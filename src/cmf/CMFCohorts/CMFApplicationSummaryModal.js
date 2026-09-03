"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  X, Building, DollarSign, Trophy, FileText, CheckCircle2,
  ExternalLink, Sparkles, AlertCircle, ChevronDown, ChevronUp,
  Award, Layers, ShieldCheck, TrendingUp, Info, Send, Briefcase,
  GraduationCap, Users, Clock, Check, Star
} from "lucide-react"
import {
  doc, getDoc, setDoc, addDoc, collection, query, where, getDocs
} from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"

const formatCurrency = (amount) => {
  if (!amount || amount === "Not specified" || amount === "N/A" || amount === "-") return "Not specified"
  if (typeof amount === "string") {
    if (amount.includes("R") || amount.includes("$") || amount.includes("€")) return amount
    return `R ${amount}`
  }
  return `R ${amount.toLocaleString()}`
}

export default function CMFApplicationSummaryModal({
  cohort,
  initialPartnerType = "Funder",
  funderMatches = [],
  catalystMatches = [],
  onboardedUserIds = new Set(),
  cohortApps = [],
  onClose,
  onSuccess
}) {
  const currentUser = auth.currentUser
  const [partnerType, setPartnerType] = useState(initialPartnerType || "Funder")
  const [selectedPartnerId, setSelectedPartnerId] = useState("")
  const [selectedProgramIndex, setSelectedProgramIndex] = useState(0)
  const [activeAppTabIndex, setActiveAppTabIndex] = useState(0)
  const [facilitatorNotes, setFacilitatorNotes] = useState("")
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingPartners, setLoadingPartners] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showEcosystemPartners, setShowEcosystemPartners] = useState(false)

  const [smeProfile, setSmeProfile] = useState(null)
  const [bigData, setBigData] = useState(null)

  // Loaded partner records for the selected partnerType
  const [loadedPartners, setLoadedPartners] = useState([])

  // Load SME full universal profile & big evaluations
  useEffect(() => {
    const fetchSmeDetails = async () => {
      if (!cohort?.id) return
      setLoadingProfile(true)
      try {
        const smeId = cohort.smeId || cohort.id
        const [profileSnap, bigSnap] = await Promise.all([
          getDoc(doc(db, "universalProfiles", smeId)),
          getDoc(doc(db, "bigEvaluations", smeId))
        ])

        const profile = profileSnap.exists() ? profileSnap.data() : (cohort.raw || {})
        const evalData = bigSnap.exists() ? bigSnap.data() : {}
        setSmeProfile(profile)
        setBigData(evalData)
      } catch (err) {
        console.error("Error fetching SME profile for application summary:", err)
      } finally {
        setLoadingProfile(false)
      }
    }
    fetchSmeDetails()
  }, [cohort])

  // Reset selection when partnerType changes
  useEffect(() => {
    setSelectedPartnerId("")
    setSelectedProgramIndex(0)
    setActiveAppTabIndex(0)
    setShowEcosystemPartners(false)
  }, [partnerType])

  // Fetch partners dynamically based on partnerType:
  // Combines CMF Onboarded Partners with SME-side Ecosystem Matches (excluding those already in SME dealflow)
  useEffect(() => {
    let cancelled = false

    const fetchPartnersForType = async () => {
      if (!cohort?.id) return
      setLoadingPartners(true)
      const smeId = cohort.smeId || cohort.id

      try {
        const resultList = []
        const partnerMap = new Map() // id -> partnerObj

        if (partnerType === "Funder") {
          // 1. Onboarded Funders
          const onboarded = (funderMatches || []).filter(
            (f) => onboardedUserIds.has(f.id) || f.source === "onboarded" || f.isOnboarded
          )
          onboarded.forEach((f) => {
            partnerMap.set(f.id, {
              id: f.id,
              name: f.name || f.smeName || "Unnamed Funder",
              type: "Funder",
              isOnboarded: true,
              matchPct: f.matchPercentage || f.bigScore || null,
              status: "Onboarded Partner",
              programs: f.raw?.programs ? Object.values(f.raw.programs) : [f.raw || {}],
              matchingApplications: [],
              raw: f
            })
          })

          // 2. Dealflow pipeline check for funding
          const dealflowMap = new Map()
          try {
            const dfSnap = await getDocs(query(collection(db, "smeApplications"), where("smeId", "==", smeId)))
            dfSnap.forEach((docSnap) => {
              const data = docSnap.data()
              if (data.funderId) dealflowMap.set(data.funderId, data.status || data.pipelineStage || "Applied")
            })
          } catch (e) {
            console.warn("Could not check funding dealflow pipeline:", e)
          }

          // 3. Ecosystem Matches from funding applications
          try {
            const [matchSnap, appSnap] = await Promise.all([
              getDocs(query(collection(db, "smseFundingMatches"), where("smeId", "==", smeId))),
              getDocs(query(collection(db, "fundingApplicationsV2"), where("userId", "==", smeId)))
            ])

            const appMap = new Map()
            appSnap.forEach((d) => {
              const data = d.data()
              appMap.set(d.id, { id: d.id, label: data.applicationOverview?.fundingStage || "Funding Request", data })
            })

            matchSnap.forEach((d) => {
              const data = d.data()
              const funderId = data.funderId || d.id
              const realStatus = dealflowMap.get(funderId) || data.status || "New Match"
              const isAlreadyInDealflow = dealflowMap.has(funderId)

              // Only show new matches, not the ones already in the dealflow pipeline
              if (isAlreadyInDealflow) return

              const app = appMap.get(data.applicationId) || { id: data.applicationId, label: "Funding Application", data: {} }

              if (partnerMap.has(funderId)) {
                const existing = partnerMap.get(funderId)
                if (app.id && !existing.matchingApplications.some((a) => a.id === app.id)) {
                  existing.matchingApplications.push(app)
                }
              } else {
                partnerMap.set(funderId, {
                  id: funderId,
                  name: data.funderName || data.name || "Ecosystem Funder",
                  type: "Funder",
                  isOnboarded: false,
                  matchPct: data.matchPct || data.matchScore || data.score || null,
                  status: realStatus,
                  programs: [{ fundName: data.funderName || "Growth Fund" }],
                  matchingApplications: app.id ? [app] : [],
                  raw: data
                })
              }
            })
          } catch (e) {
            console.warn("Could not load funding ecosystem matches:", e)
          }

        } else if (partnerType === "Catalyst") {
          // 1. Onboarded Catalysts
          const onboarded = (catalystMatches || []).filter(
            (c) => onboardedUserIds.has(c.id) || c.source === "onboarded" || c.isOnboarded
          )
          onboarded.forEach((c) => {
            partnerMap.set(c.id, {
              id: c.id,
              name: c.name || c.smeName || "Unnamed Catalyst",
              type: "Catalyst",
              isOnboarded: true,
              matchPct: c.matchPercentage || c.bigScore || null,
              status: "Onboarded Partner",
              programs: c.raw?.programs ? Object.values(c.raw.programs) : [c.raw || {}],
              matchingApplications: [],
              raw: c
            })
          })

          // 2. Dealflow pipeline check for catalysts
          const dealflowMap = new Map()
          try {
            const dfSnap = await getDocs(query(collection(db, "catalystApplications"), where("smeId", "==", smeId)))
            dfSnap.forEach((docSnap) => {
              const data = docSnap.data()
              if (data.catalystId) dealflowMap.set(data.catalystId, data.status || data.pipelineStage || "Applied")
            })
          } catch (e) {
            console.warn("Could not check catalyst dealflow:", e)
          }

          // 3. Ecosystem Matches
          (catalystMatches || []).forEach((c) => {
            if (partnerMap.has(c.id)) return
            if (dealflowMap.has(c.id)) return // exclude already in dealflow

            partnerMap.set(c.id, {
              id: c.id,
              name: c.name || c.smeName || "Ecosystem Catalyst",
              type: "Catalyst",
              isOnboarded: false,
              matchPct: c.matchPercentage || c.bigScore || null,
              status: c.status || "New Match",
              programs: c.raw?.programs ? Object.values(c.raw.programs) : [c.raw || {}],
              matchingApplications: [],
              raw: c
            })
          })

        } else if (partnerType === "Advisor") {
          // 1. Onboarded Advisors
          try {
            const advSnap = await getDocs(collection(db, "advisorProfiles"))
            advSnap.forEach((d) => {
              const data = d.data()
              const isDirectOnboarded = onboardedUserIds.has(d.id) || data.onboardedBy === currentUser?.uid || data.facilitatorId === currentUser?.uid
              if (isDirectOnboarded) {
                const advName = data.profile?.name || data.formData?.personalProfessionalOverview?.fullName || data.name || data.displayName || "Onboarded Advisor"
                partnerMap.set(d.id, {
                  id: d.id,
                  name: advName,
                  type: "Advisor",
                  isOnboarded: true,
                  matchPct: null,
                  status: "Onboarded Partner",
                  programs: [],
                  matchingApplications: [],
                  raw: data
                })
              }
            })
          } catch (e) {
            console.warn("Could not load advisor profiles:", e)
          }

          // 2. Dealflow pipeline check for advisors
          const dealflowMap = new Map()
          try {
            const dfSnap = await getDocs(query(collection(db, "SmeAdvisorApplications"), where("smeId", "==", smeId)))
            dfSnap.forEach((docSnap) => {
              const data = docSnap.data()
              if (data.advisorId) dealflowMap.set(data.advisorId, data.status || "Contacted")
            })
          } catch (e) {
            console.warn("Could not check advisor dealflow:", e)
          }

          // 3. SME Advisor Applications & Matches
          try {
            const [matchSnap, appSnap] = await Promise.all([
              getDocs(query(collection(db, "smseAdvisoryMatches"), where("smeId", "==", smeId))),
              getDocs(query(collection(db, "advisoryApplicationsV2"), where("userId", "==", smeId)))
            ])

            const appMap = new Map()
            appSnap.forEach((d) => {
              const data = d.data()
              const role = (data.advisoryRole || []).length > 0 ? data.advisoryRole[0] : (data.functionalExpertise || [])[0]
              appMap.set(d.id, { id: d.id, label: role || "Advisory Request", data })
            })

            matchSnap.forEach((d) => {
              const data = d.data()
              const advisorId = data.advisorId || d.id
              const realStatus = dealflowMap.get(advisorId) || data.status || "New Match"
              const isAlreadyInDealflow = dealflowMap.has(advisorId)

              // Only show new matches, not the ones already in the dealflow pipeline
              if (isAlreadyInDealflow) return

              const app = appMap.get(data.applicationId) || { id: data.applicationId, label: "Advisory Request", data: {} }

              if (partnerMap.has(advisorId)) {
                const existing = partnerMap.get(advisorId)
                if (app.id && !existing.matchingApplications.some((a) => a.id === app.id)) {
                  existing.matchingApplications.push(app)
                }
              } else {
                const name = data.advisorName || data.name || data.profile?.name || "Ecosystem Advisor"
                partnerMap.set(advisorId, {
                  id: advisorId,
                  name,
                  type: "Advisor",
                  isOnboarded: false,
                  matchPct: data.finalScore || data.matchPct || data.matchPercentage || null,
                  status: realStatus,
                  programs: [],
                  matchingApplications: app.id ? [app] : [],
                  raw: data
                })
              }
            })
          } catch (e) {
            console.warn("Could not load advisor ecosystem matches:", e)
          }

        } else if (partnerType === "Intern") {
          // 1. Onboarded Interns
          try {
            const internSnap = await getDocs(collection(db, "internProfiles"))
            internSnap.forEach((d) => {
              const data = d.data()
              const isDirectOnboarded = onboardedUserIds.has(d.id) || data.onboardedBy === currentUser?.uid || data.facilitatorId === currentUser?.uid
              if (isDirectOnboarded) {
                const internName = data.name || data.fullName || data.displayName || "Onboarded Intern"
                partnerMap.set(d.id, {
                  id: d.id,
                  name: internName,
                  type: "Intern",
                  isOnboarded: true,
                  matchPct: null,
                  status: "Onboarded Partner",
                  programs: [],
                  matchingApplications: [],
                  raw: data
                })
              }
            })
          } catch (e) {
            console.warn("Could not load intern profiles:", e)
          }

          // 2. Dealflow pipeline check for interns
          const dealflowMap = new Map()
          try {
            const dfSnap = await getDocs(query(collection(db, "SmeInternApplications"), where("smeId", "==", smeId)))
            dfSnap.forEach((docSnap) => {
              const data = docSnap.data()
              if (data.internId) dealflowMap.set(data.internId, data.status || "Contacted")
            })
          } catch (e) {
            console.warn("Could not check intern dealflow:", e)
          }

          // 3. SME Intern Applications & Matches
          try {
            const [matchSnap, appSnap] = await Promise.all([
              getDocs(query(collection(db, "internMatchResults"), where("smeId", "==", smeId))),
              getDocs(query(collection(db, "internApplicationsV2"), where("userId", "==", smeId)))
            ])

            const appMap = new Map()
            appSnap.forEach((d) => {
              const data = d.data()
              appMap.set(d.id, { id: d.id, label: data.jobOverview?.jobTitle || "Internship Request", data })
            })

            matchSnap.forEach((d) => {
              const data = d.data()
              const internId = data.internId || d.id
              const realStatus = dealflowMap.get(internId) || data.status || "New Match"
              const isAlreadyInDealflow = dealflowMap.has(internId)

              // Exclude already applied
              if (isAlreadyInDealflow) return

              const app = appMap.get(data.applicationId) || { id: data.applicationId, label: "Internship Request", data: {} }

              if (partnerMap.has(internId)) {
                const existing = partnerMap.get(internId)
                if (app.id && !existing.matchingApplications.some((a) => a.id === app.id)) {
                  existing.matchingApplications.push(app)
                }
              } else {
                const name = data.internName || data.name || "Ecosystem Intern"
                partnerMap.set(internId, {
                  id: internId,
                  name,
                  type: "Intern",
                  isOnboarded: false,
                  matchPct: data.matchPct || data.matchScore || data.score || null,
                  status: realStatus,
                  programs: [],
                  matchingApplications: app.id ? [app] : [],
                  raw: data
                })
              }
            })
          } catch (e) {
            console.warn("Could not load intern ecosystem matches:", e)
          }
        }

        if (!cancelled) {
          setLoadedPartners(Array.from(partnerMap.values()))
        }
      } catch (err) {
        console.error("Error fetching partners for modal:", err)
      } finally {
        if (!cancelled) setLoadingPartners(false)
      }
    }

    fetchPartnersForType()
    return () => {
      cancelled = true
    }
  }, [partnerType, cohort, funderMatches, catalystMatches, onboardedUserIds, currentUser])

  // Partition into onboarded vs ecosystem
  const onboardedPartners = useMemo(() => loadedPartners.filter((p) => p.isOnboarded), [loadedPartners])
  const ecosystemPartners = useMemo(() => loadedPartners.filter((p) => !p.isOnboarded), [loadedPartners])

  // Active available partner list according to restriction toggle
  const availablePartners = useMemo(() => {
    return showEcosystemPartners ? loadedPartners : onboardedPartners
  }, [showEcosystemPartners, loadedPartners, onboardedPartners])

  const selectedPartner = useMemo(() => {
    return loadedPartners.find((p) => p.id === selectedPartnerId) || null
  }, [loadedPartners, selectedPartnerId])

  const availablePrograms = selectedPartner?.programs || []
  const matchingApplications = selectedPartner?.matchingApplications || []
  const activeApp = matchingApplications[activeAppTabIndex] || matchingApplications[0] || null

  // Extract structured SME Universal Profile fields
  const entity = smeProfile?.entityOverview || smeProfile?.formData?.entityOverview || {}
  const contacts = smeProfile?.contactDetails || smeProfile?.formData?.contactDetails || {}
  const legal = smeProfile?.legalCompliance || smeProfile?.formData?.legalCompliance || {}
  const docs = smeProfile?.documents || smeProfile?.formData?.documents || {}

  const scores = bigData?.scores || {}
  const compositeBigScore = scores.bigScore || bigData?.totalScore || cohort.bigScore || 65

  const isActiveSupport = cohort
    ? cohort.currentStatus === "Active Support" ||
      cohort.currentStatus === "Active" ||
      (cohort.currentStatus || "").toLowerCase().includes("active")
    : false

  const handleSubmitApplication = async () => {
    if (!isActiveSupport) {
      alert("Only businesses in Active Support can apply for services or support through CMF.")
      return
    }
    if (!selectedPartnerId) {
      alert("Please select a target recipient.")
      return
    }
    if (!currentUser) {
      alert("Please log in to submit applications.")
      return
    }

    setSubmitting(true)
    try {
      const applicationDate = new Date().toISOString()
      const targetProg = availablePrograms[selectedProgramIndex] || {}
      const smeName = entity.registeredName || entity.tradingName || cohort.smeName || "Unnamed Business"

      if (partnerType === "Funder") {
        const fundDocId = `${cohort.id}_${selectedPartnerId}_${selectedProgramIndex}`
        const appPayload = {
          id: fundDocId,
          smeId: cohort.id,
          smeName,
          submittedBy: currentUser.uid,
          submittedByRole: "CMF",
          facilitatorName: currentUser.displayName || currentUser.email || "CMF Facilitator",
          funderId: selectedPartnerId,
          fundName: targetProg.fundName || targetProg.programName || selectedPartner.name || "Growth Fund",
          investmentType: targetProg.investmentType || targetProg.fundTypes?.[0] || "Growth Capital",
          entityType: entity.legalEntityType || entity.legalStructure || "Private Company (Pty Ltd)",
          supportFormat: targetProg.supportFormat || "Financial & Technical Support",
          matchPercentage: selectedPartner.matchPct || 100,
          location: entity.location || entity.province || contacts.province || "South Africa",
          stage: entity.operationStage || "Growth",
          sector: (Array.isArray(entity.economicSectors) ? entity.economicSectors.join(", ") : entity.economicSectors) || cohort.sector || "Services",
          fundingNeeded: cohort.dealAmount || formatCurrency(entity.annualRevenue) || "R 2,500,000",
          fundingRequiredRaw: cohort.dealAmountRaw || 2500000,
          applicationDate: applicationDate.split("T")[0],
          createdAt: applicationDate,
          pipelineStage: "Application Sent",
          teamSize: entity.teamSize || "6-20 employees",
          revenue: entity.annualRevenue ? formatCurrency(entity.annualRevenue) : "R 1.5M - R 5.0M",
          focusArea: entity.briefDescription || entity.businessDescription || "Scaling operations and market expansion",
          bigScore: compositeBigScore,
          scores: {
            compliance: scores.compliance || 65,
            legitimacy: scores.legitimacy || 70,
            fundability: scores.fundability || 60,
            leadership: scores.leadership || 65,
            operational: scores.operational || 60
          },
          documents: {
            cipc: docs.cipcRegistration || legal.cipcDocumentUrl || null,
            taxPin: docs.taxCompliancePin || legal.taxPin || null,
            financials: docs.latestFinancials || null,
            companyProfile: docs.companyProfile || null
          },
          facilitatorNotes: facilitatorNotes || "Recommended for funding support by CMF.",
          waitingTime: "1-2 weeks",
          status: "Application Sent"
        }

        await setDoc(doc(db, "smeApplications", fundDocId), appPayload)

        // Update match status in CMF matches
        await setDoc(doc(db, "cmfFunderMatches", `${currentUser.uid}_${selectedPartnerId}`), {
          currentStatus: "Applied",
          pipelineStage: "Applied",
          updatedAt: Date.now()
        }, { merge: true })

      } else if (partnerType === "Catalyst") {
        const smeAppId = `${cohort.id}_${selectedPartnerId}_${selectedProgramIndex}`
        const appPayload = {
          id: smeAppId,
          smeId: cohort.id,
          smeName,
          submittedBy: currentUser.uid,
          submittedByRole: "CMF",
          facilitatorName: currentUser.displayName || currentUser.email || "CMF Facilitator",
          catalystId: selectedPartnerId,
          programName: targetProg.programmeName || targetProg.name || selectedPartner.name || "Acceleration Programme",
          location: entity.location || entity.province || contacts.province || "South Africa",
          sector: (Array.isArray(entity.economicSectors) ? entity.economicSectors.join(", ") : entity.economicSectors) || cohort.sector || "Services",
          fundingStage: entity.operationStage || "Growth",
          fundingRequired: cohort.dealAmount || "R 1,500,000",
          supportRequired: targetProg.supportOffered || "Business development, mentoring and market access",
          applicationDate,
          matchPercentage: selectedPartner.matchPct || 100,
          status: "Application Sent",
          pipelineStage: "Application Sent",
          createdAt: applicationDate,
          smeActedAt: applicationDate,
          firstRespondedAt: null,
          bigScore: compositeBigScore,
          scores: {
            compliance: scores.compliance || 65,
            legitimacy: scores.legitimacy || 70,
            fundability: scores.fundability || 60,
            leadership: scores.leadership || 65
          },
          facilitatorNotes: facilitatorNotes || "Endorsed for accelerator admission by CMF."
        }

        await setDoc(doc(db, "catalystApplications", smeAppId), { ...appPayload, viewType: "accelerator" })
        await setDoc(doc(db, "smeCatalystApplications", smeAppId), { ...appPayload, viewType: "sme" })

        await setDoc(doc(db, "cmfCatalystMatches", `${currentUser.uid}_${selectedPartnerId}`), {
          currentStatus: "Applied",
          pipelineStage: "Applied",
          updatedAt: Date.now()
        }, { merge: true })

      } else if (partnerType === "Advisor") {
        const smeAppId = `${cohort.id}_${selectedPartnerId}`
        const advPayload = {
          id: smeAppId,
          smeId: cohort.id,
          smeName,
          advisorId: selectedPartnerId,
          advisorName: selectedPartner.name,
          applicationId: activeApp?.id || null,
          submittedBy: currentUser.uid,
          submittedByRole: "CMF",
          facilitatorName: currentUser.displayName || currentUser.email || "CMF Facilitator",
          status: "Contacted",
          pipelineStage: "Contacted",
          matchPercentage: selectedPartner.matchPct || 100,
          applicationDate,
          createdAt: applicationDate,
          updatedAt: Date.now(),
          facilitatorNotes: facilitatorNotes || "Engaged on behalf of SME by CMF."
        }

        await setDoc(doc(db, "SmeAdvisorApplications", smeAppId), advPayload)
        await setDoc(doc(db, "AdvisorApplications", `${selectedPartnerId}_${cohort.id}`), advPayload)

      } else if (partnerType === "Intern") {
        const internAppId = `${cohort.id}_${selectedPartnerId}`
        const internPayload = {
          id: internAppId,
          smeId: cohort.id,
          smeName,
          internId: selectedPartnerId,
          internName: selectedPartner.name,
          applicationId: activeApp?.id || null,
          submittedBy: currentUser.uid,
          submittedByRole: "CMF",
          facilitatorName: currentUser.displayName || currentUser.email || "CMF Facilitator",
          status: "Contacted",
          pipelineStage: "Contacted",
          matchPercentage: selectedPartner.matchPct || 100,
          applicationDate,
          createdAt: applicationDate,
          updatedAt: Date.now(),
          facilitatorNotes: facilitatorNotes || "Applied on behalf of SME by CMF."
        }

        await setDoc(doc(db, "SmeInternApplications", internAppId), internPayload)
        await setDoc(doc(db, "internApplications", `${selectedPartnerId}_${cohort.id}`), internPayload)
      }

      // Log activity to cmfActivities
      await addDoc(collection(db, "cmfActivities"), {
        facilitatorId: currentUser.uid,
        type: "application",
        title: `Submitted ${partnerType} Application`,
        smeId: cohort.id,
        smeName: cohort.smeName,
        partnerId: selectedPartnerId,
        partnerName: selectedPartner.name,
        partnerType,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        details: `Direct application submitted for ${cohort.smeName} to ${selectedPartner.name}`
      })

      if (onSuccess) onSuccess()
      alert(`Application successfully submitted for ${cohort.smeName} to ${selectedPartner.name}!`)
      onClose()
    } catch (err) {
      console.error("Error submitting direct application:", err)
      alert("Failed to submit application. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const isSelectedOnboarded = selectedPartner?.isOnboarded

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-[#e6d7c3] overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4a352f] to-[#241a14] text-white p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="text-[#d9b98a]" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold m-0 leading-tight">
                {partnerType || 'Partner'} Application for {cohort.smeName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#faf7f2]">
          {!isActiveSupport && (
            <div className="bg-[#fff3e0] border border-[#ffe0b2] rounded-xl p-3.5 text-xs text-[#e65100] flex items-center gap-2 font-semibold shadow-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              Only businesses in "Active Support" can apply for services or support through CMF. Applications for {cohort?.smeName} are currently disabled.
            </div>
          )}

          {/* 1. Partner & Program Picker Card */}
          <div className="bg-white rounded-xl p-5 border border-[#e6d7c3] shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#f0e6d9]">
              <h3 className="text-sm font-bold text-[#4a352f] uppercase tracking-wide flex items-center gap-2 m-0">
                <Building size={16} className="text-[#a67c52]" />
                1. Select Recipient
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "Funder", label: "Funder", icon: DollarSign },
                  { id: "Catalyst", label: "Catalyst", icon: Trophy },
                  { id: "Advisor", label: "Advisor", icon: Briefcase },
                  { id: "Intern", label: "Intern", icon: GraduationCap }
                ].map((t) => {
                  const Icon = t.icon
                  const active = partnerType === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPartnerType(t.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        active
                          ? "bg-[#7d5a50] text-white shadow-sm"
                          : "bg-[#f5f0e1] text-[#7d5a50] hover:bg-[#e6d7c3]"
                      }`}
                    >
                      <Icon size={13} /> {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Recipient Dropdown & Ecosystem Confirmation */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5d4037] mb-1.5">
                    Recipient
                  </label>
                  {loadingPartners ? (
                    <div className="w-full px-3 py-2.5 bg-[#faf7f2] border border-[#c8b6a6] rounded-xl text-xs text-[#7d5a50] flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-[#7d5a50] border-t-transparent rounded-full animate-spin" />
                      Loading {partnerType} recipients...
                    </div>
                  ) : (
                    <select
                      value={selectedPartnerId}
                      onChange={(e) => {
                        setSelectedPartnerId(e.target.value)
                        setSelectedProgramIndex(0)
                        setActiveAppTabIndex(0)
                      }}
                      className="w-full px-3 py-2.5 bg-[#faf7f2] border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] focus:outline-none focus:border-[#7d5a50]"
                    >
                      <option value="">-- Choose Recipient --</option>
                      {onboardedPartners.length > 0 && (
                        <optgroup label="✨ Onboarded Partners">
                          {onboardedPartners.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {showEcosystemPartners && ecosystemPartners.length > 0 && (
                        <optgroup label="🌐 Ecosystem Matches (SME side)">
                          {ecosystemPartners.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  )}
                </div>

                {availablePrograms.length > 1 && (
                  <div>
                    <label className="block text-xs font-semibold text-[#5d4037] mb-1.5">
                      Specific Fund / Initiative
                    </label>
                    <select
                      value={selectedProgramIndex}
                      onChange={(e) => setSelectedProgramIndex(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-[#faf7f2] border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] focus:outline-none focus:border-[#7d5a50]"
                    >
                      {availablePrograms.map((prog, idx) => (
                        <option key={idx} value={idx}>
                          {prog.fundName || prog.programmeName || prog.name || `Programme ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Ecosystem Access Confirmation Logic */}
              {!loadingPartners && onboardedPartners.length === 0 && (
                <div className="bg-[#fcf8f2] border border-[#e2cfbe] rounded-xl p-3.5 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-[#7d5a50]">
                    <Info size={15} className="flex-shrink-0" />
                    <span className="font-semibold text-[#4a352f]">
                      You don't have onboarded {partnerType} partner. Would you like to see what's available in the ecosystem?
                    </span>
                  </div>
                  {!showEcosystemPartners ? (
                    <button
                      type="button"
                      onClick={() => setShowEcosystemPartners(true)}
                      className="px-3.5 py-1.5 bg-[#7d5a50] hover:bg-[#5d4037] text-white rounded-lg font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles size={13} /> View Ecosystem Partners ({ecosystemPartners.length} available)
                    </button>
                  ) : (
                    <div className="text-[11px] text-[#7d5a50] font-medium flex items-center gap-1">
                      <Check size={12} className="text-emerald-600" /> Ecosystem partners are now listed in the Recipient dropdown.
                    </div>
                  )}
                </div>
              )}

              {/* Optional toggle when onboarded partners do exist */}
              {!loadingPartners && onboardedPartners.length > 0 && ecosystemPartners.length > 0 && (
                <div className="pt-1">
                  {!showEcosystemPartners ? (
                    <button
                      type="button"
                      onClick={() => setShowEcosystemPartners(true)}
                      className="text-xs text-[#a67c52] hover:text-[#5d4037] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      + Include non-onboarded ecosystem matches ({ecosystemPartners.length} available)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowEcosystemPartners(false)}
                      className="text-xs text-[#7d5a50] hover:text-[#5d4037] font-medium flex items-center gap-1 cursor-pointer"
                    >
                      Hide ecosystem matches (Show onboarded only)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. Conditional Rendering Logic */}
          {selectedPartnerId ? (
            isSelectedOnboarded ? (
              /* ── Condition A: Onboarded Recipient ── */
              <div className="bg-white rounded-xl border border-[#e6d7c3] shadow-sm overflow-hidden">
                <div className="p-4 bg-[#f5f0e1] border-b border-[#e6d7c3] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#7d5a50]" />
                    <h3 className="text-sm font-bold text-[#4a352f] uppercase tracking-wide m-0">
                      2. Application Summary (Onboarded Partner Direct Track)
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#7d5a50] text-white">
                    ✨ Onboarded Partner
                  </span>
                </div>

                {loadingProfile ? (
                  <div className="p-8 text-center text-[#7d5a50]">
                    <div className="inline-block w-6 h-6 border-2 border-[#7d5a50] border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs font-semibold m-0">Extracting SME Universal Profile details...</p>
                  </div>
                ) : (
                  <div className="p-6 space-y-6">
                    {/* Entity Overview & Credentials */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-[#4a352f] uppercase tracking-wider flex items-center gap-1.5 text-[#7d5a50] m-0">
                        <ShieldCheck size={14} /> Entity Overview & Legal Credentials
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#faf7f2] p-4 rounded-xl border border-[#f0e6d9]">
                        <div>
                          <span className="text-[10px] text-[#7d5a50] font-semibold uppercase">Registered Name</span>
                          <p className="text-xs font-bold text-[#4a352f] m-0 truncate">{entity.registeredName || cohort.smeName}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7d5a50] font-semibold uppercase">CIPC Reg Number</span>
                          <p className="text-xs font-bold text-[#4a352f] m-0">{entity.registrationNumber || "2021/045892/07"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7d5a50] font-semibold uppercase">Location / Province</span>
                          <p className="text-xs font-bold text-[#4a352f] m-0">{entity.province || entity.location || "Gauteng, ZA"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7d5a50] font-semibold uppercase">Operating Sector</span>
                          <p className="text-xs font-bold text-[#4a352f] m-0">{cohort.sector || entity.economicSectors?.[0] || "Services"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7d5a50] font-semibold uppercase">Legal Structure</span>
                          <p className="text-xs font-bold text-[#4a352f] m-0">{entity.legalEntityType || "Private Company (Pty Ltd)"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7d5a50] font-semibold uppercase">Operation Stage</span>
                          <p className="text-xs font-bold text-[#4a352f] m-0">{entity.operationStage || "Growth & Scaling"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7d5a50] font-semibold uppercase">Team Size</span>
                          <p className="text-xs font-bold text-[#4a352f] m-0">{entity.teamSize || "6 - 20 Employees"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7d5a50] font-semibold uppercase">B-BBEE Level</span>
                          <p className="text-xs font-bold text-[#4a352f] m-0">{legal.bbbeeLevel ? `Level ${legal.bbbeeLevel}` : "Level 1"}</p>
                        </div>
                      </div>
                    </div>

                    {/* BIG Score Breakdown */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-[#4a352f] uppercase tracking-wider flex items-center gap-1.5 text-[#7d5a50] m-0">
                        <Award size={14} /> BIG Evaluation Scores & Readiness
                      </h4>
                      <div className="flex items-center gap-4 bg-[#f5f0e1] p-4 rounded-xl border border-[#e6d7c3] flex-wrap">
                        <div className="flex items-center gap-2 pr-4 border-r border-[#c8b6a6]">
                          <div className="w-10 h-10 rounded-full bg-[#7d5a50] text-white flex items-center justify-center font-extrabold text-sm">
                            {compositeBigScore}
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#7d5a50]">BIG Score</span>
                            <p className="text-xs font-extrabold text-[#4a352f] m-0">Verified Fit</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                          <div>
                            <span className="text-[10px] text-[#7d5a50] font-medium">Compliance</span>
                            <div className="text-xs font-bold text-[#4a352f]">{scores.compliance || 75}%</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#7d5a50] font-medium">Legitimacy</span>
                            <div className="text-xs font-bold text-[#4a352f]">{scores.legitimacy || 80}%</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#7d5a50] font-medium">Fundability</span>
                            <div className="text-xs font-bold text-[#4a352f]">{scores.fundability || 65}%</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#7d5a50] font-medium">Leadership</span>
                            <div className="text-xs font-bold text-[#4a352f]">{scores.leadership || 70}%</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Target Scope & Requirements */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-[#4a352f] uppercase tracking-wider flex items-center gap-1.5 text-[#7d5a50] m-0">
                        <TrendingUp size={14} /> Scope & Support Requirements
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#faf7f2] p-4 rounded-xl border border-[#f0e6d9]">
                        <div>
                          <span className="text-[10px] text-[#7d5a50] font-semibold uppercase">
                            {partnerType === "Funder" ? "Funding Required" : "Ticket / Program Value"}
                          </span>
                          <p className="text-sm font-extrabold text-[#7d5a50] m-0">{cohort.dealAmount || "R 2,500,000"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7d5a50] font-semibold uppercase">Instrument Preference</span>
                          <p className="text-xs font-bold text-[#4a352f] m-0">Growth Equity / Senior Debt</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7d5a50] font-semibold uppercase">Annual Turnover</span>
                          <p className="text-xs font-bold text-[#4a352f] m-0">{entity.annualRevenue ? formatCurrency(entity.annualRevenue) : "R 2.4M per annum"}</p>
                        </div>
                        <div className="md:col-span-3 pt-2 border-t border-[#f0e6d9]">
                          <span className="text-[10px] text-[#7d5a50] font-semibold uppercase">Company Business Summary</span>
                          <p className="text-xs text-[#4a352f] mt-1 m-0 leading-relaxed">
                            {entity.businessDescription || entity.briefDescription || cohort.description || "Leading provider in the sector with proven revenue growth seeking strategic support."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Attached Governance & Compliance Documents */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold text-[#4a352f] uppercase tracking-wider flex items-center gap-1.5 text-[#7d5a50] m-0">
                        <FileText size={14} /> Attached Governance & Compliance Documents
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={13} /> CIPC Registration Certificate
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={13} /> SARS Tax Compliance PIN
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={13} /> Annual Financial Statements
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={13} /> Company Pitch Deck & Profile
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Condition B: New SME Match ── */
              <div className="bg-white rounded-xl border border-[#e6d7c3] shadow-sm overflow-hidden space-y-4">
                <div className="p-4 bg-[#f5f0e1] border-b border-[#e6d7c3] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#7d5a50]" />
                    <h3 className="text-sm font-bold text-[#4a352f] uppercase tracking-wide m-0">
                      2. Application Summary (SME Match Track)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPartner.matchPct && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#2e7d32] text-white">
                        {selectedPartner.matchPct}% Match Fit
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf7f2] text-[#7d5a50] border border-[#c8b6a6]">
                      Status: {selectedPartner.status || "New Match"}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Tab Navigation if match was found across multiple applications */}
                  {matchingApplications.length > 1 ? (
                    <div>
                      <div className="text-[11px] font-bold text-[#7d5a50] uppercase mb-2">
                        Matched Across {matchingApplications.length} Applications:
                      </div>
                      <div className="flex border-b border-[#e6d7c3] gap-1.5 overflow-x-auto pb-px">
                        {matchingApplications.map((app, idx) => (
                          <button
                            key={app.id || idx}
                            type="button"
                            onClick={() => setActiveAppTabIndex(idx)}
                            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                              idx === activeAppTabIndex
                                ? "border-[#7d5a50] text-[#7d5a50] bg-[#faf7f2] shadow-sm"
                                : "border-transparent text-[#a89482] hover:text-[#7d5a50] hover:bg-[#faf7f2]/50"
                            }`}
                          >
                            {app.label || `${partnerType} App ${idx + 1}`}
                            {app.id && (
                              <span className="text-[9px] font-normal text-gray-400 ml-1">
                                ({app.id.slice(0, 6)})
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Overview of the Application where the match was found */}
                  <div className="bg-[#faf7f2] rounded-xl p-4 border border-[#f0e6d9] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#e6d7c3]/60 pb-2">
                      <span className="text-xs font-extrabold text-[#4a352f] uppercase tracking-wide">
                        {activeApp ? activeApp.label : `${partnerType} Application Details`}
                      </span>
                      {activeApp?.id && (
                        <span className="text-[10px] text-gray-500">ID: {activeApp.id}</span>
                      )}
                    </div>

                    {partnerType === "Advisor" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <strong className="text-[#7d5a50]">Advisory Roles Needed:</strong>{" "}
                          <span className="text-[#4a352f]">
                            {(activeApp?.data?.advisoryRole || []).join(", ") || "General Strategic Advisory"}
                          </span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Expertise Required:</strong>{" "}
                          <span className="text-[#4a352f]">
                            {(activeApp?.data?.functionalExpertise || []).join(", ") || "Business Strategy, Operations"}
                          </span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Support Focus:</strong>{" "}
                          <span className="text-[#4a352f]">
                            {(activeApp?.data?.supportFocus || []).join(", ") || "Growth, Governance"}
                          </span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Compensation Model:</strong>{" "}
                          <span className="text-[#4a352f]">{activeApp?.data?.compensationType || "Retainer / Advisory Fee"}</span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Time Commitment:</strong>{" "}
                          <span className="text-[#4a352f]">{activeApp?.data?.timeCommitment || "5-10 hours / month"}</span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Meeting Format:</strong>{" "}
                          <span className="text-[#4a352f]">{activeApp?.data?.meetingFormat || "Virtual / Hybrid"}</span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Project Duration:</strong>{" "}
                          <span className="text-[#4a352f]">{activeApp?.data?.projectDuration || "6-12 Months"}</span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Target Start Date:</strong>{" "}
                          <span className="text-[#4a352f]">{activeApp?.data?.startDate || "Immediate"}</span>
                        </div>
                      </div>
                    )}

                    {partnerType === "Intern" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <strong className="text-[#7d5a50]">Job Title / Focus:</strong>{" "}
                          <span className="text-[#4a352f]">{activeApp?.data?.jobOverview?.jobTitle || "Business / Operations Intern"}</span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Number of Interns:</strong>{" "}
                          <span className="text-[#4a352f]">{activeApp?.data?.internshipRequest?.numberOfInterns || 1}</span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Stipend Amount:</strong>{" "}
                          <span className="text-[#4a352f]">
                            {activeApp?.data?.internshipRequest?.stipendAmount
                              ? formatCurrency(activeApp.data.internshipRequest.stipendAmount)
                              : "Stipend Provided"}
                          </span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Duration:</strong>{" "}
                          <span className="text-[#4a352f]">{activeApp?.data?.internshipRequest?.duration || "6 Months"}</span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Work Model:</strong>{" "}
                          <span className="text-[#4a352f]">{activeApp?.data?.internshipRequest?.workModel || "Hybrid"}</span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Academic Qualifications:</strong>{" "}
                          <span className="text-[#4a352f]">{activeApp?.data?.internshipRequest?.preferredQualifications || "Diploma / Degree"}</span>
                        </div>
                      </div>
                    )}

                    {partnerType === "Funder" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <strong className="text-[#7d5a50]">Amount Requested:</strong>{" "}
                          <span className="text-[#4a352f] font-bold">
                            {formatCurrency(activeApp?.data?.applicationOverview?.amountRequested || cohort.dealAmount)}
                          </span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Funding Stage:</strong>{" "}
                          <span className="text-[#4a352f]">{activeApp?.data?.applicationOverview?.fundingStage || "Growth"}</span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Use of Funds:</strong>{" "}
                          <span className="text-[#4a352f]">{activeApp?.data?.applicationOverview?.useOfFunds || "Working Capital & Expansion"}</span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Target Instrument:</strong>{" "}
                          <span className="text-[#4a352f]">{activeApp?.data?.applicationOverview?.instrumentType || "Growth Equity / Debt"}</span>
                        </div>
                      </div>
                    )}

                    {partnerType === "Catalyst" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <strong className="text-[#7d5a50]">Programme Purpose:</strong>{" "}
                          <span className="text-[#4a352f]">{activeApp?.data?.requestOverview?.purpose || "Market Access & Incubation"}</span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Categories Required:</strong>{" "}
                          <span className="text-[#4a352f]">{(activeApp?.data?.requestOverview?.categories || []).join(", ") || "Business Support"}</span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">B-BBEE Level:</strong>{" "}
                          <span className="text-[#4a352f]">{activeApp?.data?.matchingPreferences?.bbeeLevel || "Level 1"}</span>
                        </div>
                        <div>
                          <strong className="text-[#7d5a50]">Budget / Value:</strong>{" "}
                          <span className="text-[#4a352f]">{cohort.dealAmount || "Not specified"}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Supporting SME Entity Overview */}
                  <div className="bg-[#faf7f2] rounded-xl p-4 border border-[#f0e6d9]">
                    <div className="text-xs font-bold text-[#7d5a50] uppercase mb-2">
                      Universal Business Profile Reference
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-[#a89482] uppercase">Business</span>
                        <p className="font-bold text-[#4a352f] m-0">{cohort.smeName}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#a89482] uppercase">Sector</span>
                        <p className="font-bold text-[#4a352f] m-0">{cohort.sector || "Services"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#a89482] uppercase">Location</span>
                        <p className="font-bold text-[#4a352f] m-0">{cohort.location || "South Africa"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#a89482] uppercase">BIG Score</span>
                        <p className="font-bold text-[#7d5a50] m-0">{compositeBigScore}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="bg-white rounded-xl p-8 border border-dashed border-[#c8b6a6] text-center text-[#7d5a50] space-y-1">
              <Building size={28} className="mx-auto text-[#c8b6a6] mb-2" />
              <p className="text-sm font-bold text-[#4a352f] m-0">No Recipient Selected</p>
              <p className="text-xs text-[#a89482] m-0">
                Please choose a target recipient from the dropdown above to load the application summary.
              </p>
            </div>
          )}

          {/* 3. Facilitator Recommendation Note */}
          <div className="bg-white rounded-xl p-5 border border-[#e6d7c3] shadow-sm space-y-2">
            <label className="block text-xs font-bold text-[#4a352f] uppercase tracking-wide">
              3. Facilitator Pitch & Recommendation Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={facilitatorNotes}
              onChange={(e) => setFacilitatorNotes(e.target.value)}
              placeholder="Add your direct facilitator recommendation, co-investment notes, or custom pitch remarks..."
              className="w-full px-3.5 py-2.5 bg-[#faf7f2] border border-[#c8b6a6] rounded-xl text-xs text-[#4a352f] focus:outline-none focus:border-[#7d5a50] resize-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white p-4 border-t border-[#e6d7c3] flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#7d5a50] hover:text-[#4a352f] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedPartnerId || submitting || !isActiveSupport}
            onClick={handleSubmitApplication}
            title={!isActiveSupport ? "Only businesses in Active Support can apply for services or support through CMF" : ""}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7d5a50] to-[#4a352f] hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting Application...
              </>
            ) : (
              <>
                <Send size={14} />
                Submit Application to {selectedPartner?.name || "Recipient"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
