"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  ChevronLeft, ChevronRight, Save, Trash2, CheckCircle, Info,
  AlertCircle, ShieldCheck, Building2, User, Globe, FileText,
  MapPin, Check, Plus, Loader2
} from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import {
  doc, setDoc, getDoc, getDocs, collection, query, where, deleteDoc
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

const SECTOR_OPTIONS = [
  "Agriculture, Forestry & Fishing",
  "Mining, Energy, Oil & Gas",
  "Manufacturing & Production",
  "Construction, Building & Civils",
  "ICT & Information Technology",
  "Logistics, Transport & Supply Chain",
  "Retail & Wholesale",
  "Financial Services & FinTech",
  "Tourism & Hospitality",
  "Education & EdTech",
  "Health & CleanTech",
  "Professional Advisory Services"
]

const PROVINCE_OPTIONS = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape"
]

const STAGE_OPTIONS = ["Ideation", "Start-up", "Growth", "Mature"]
const SIZE_OPTIONS = ["Micro", "Small", "Medium", "Large"]

const LEGAL_STRUCTURES = {
  Business: ["Private Company (Pty Ltd)", "Sole Proprietorship", "Close Corporation (CC)", "Partnership", "Public Company (Ltd)", "Trust", "Non-Profit Company (NPC)"],
  Funder: ["Private Company (Pty Ltd)", "Public Company (Ltd)", "Trust", "Non-Profit Company (NPC)", "Government Agency", "Financial Institution"],
  Catalyst: ["Private Company (Pty Ltd)", "Non-Profit Company (NPC)", "Trust", "Sole Proprietorship", "Close Corporation (CC)"],
  CMF: ["Private Company (Pty Ltd)", "Close Corporation (CC)", "Trust", "Non-Profit Company (NPC)"]
}

const FIRM_TYPES = [
  "Venture Capital",
  "Private Equity",
  "Angel Network",
  "Debt Funder",
  "Grant Provider",
  "Corporate Venture Capital (CVC)",
  "Impact Investor",
  "DFI (Development Finance Institution)"
]

const SUPPORT_TYPES = [
  "Funding / Investment Capital",
  "Technical Advisory & Consulting",
  "Mentorship & Coaching",
  "Market Access & Business Development",
  "Workspace & Incubator Facilities",
  "Legal & Regulatory Support",
  "Operational Scaling Support"
]

export default function CMFOnboardProfile() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const typeParam = searchParams.get("type") || "Business"
  const draftIdParam = searchParams.get("draftId") || ""

  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeStep, setActiveStep] = useState(1)
  const [profileType, setProfileType] = useState(typeParam)
  const [cmfsList, setCmfsList] = useState([])
  const [showCancelModal, setShowCancelModal] = useState(false)

  // Initial Form Data
  const [formData, setFormData] = useState({
    // Contact Info
    contactName: "",
    contactEmail: "",
    contactPhone: "",

    // Entity Details
    registeredName: "",
    tradingName: "",
    registrationNumber: "",
    legalStructure: "",
    legalEntityType: "", // used for Investor/Catalyst to align with legacy schemas
    entitySize: "",
    companySize: "", // used for Catalyst
    yearsInOperation: "",
    yearEstablished: "", // used for Catalyst
    operationStage: "",
    economicSectors: [],
    businessDescription: "",
    briefDescription: "", // used for Investor/Catalyst

    // Preferences & Financials
    fundingRequired: "",
    equityOffered: "",
    guarantees: "None",
    supportRequired: "",
    minTicket: "",
    maxTicket: "",
    firmType: "",
    firmSubtype: [],
    investorRole: "Lead Investor",
    programName: "",
    programDuration: "",
    geographicFocus: [],
    selectedProvinces: [],

    // Compliance & Address
    physicalAddress: "",
    sameAsPhysical: true,
    postalAddress: "",
    taxNumber: "",
    vatNumber: "",
    bbbeeLevel: "Level 1",

    // Association
    associateId: "", // CMF ID who will manage it
    consentAccuracy: false,
    consentProcessing: false,
    consentTerms: false
  })

  // Set Profile Type when route param changes
  useEffect(() => {
    if (typeParam) {
      setProfileType(typeParam)
    }
  }, [typeParam])

  // Resolve logged in CMF user and pull other CMFs for dropdown
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        setFormData((prev) => ({ ...prev, associateId: user.uid }))

        // Fetch CMF profiles
        try {
          const cmfsSnap = await getDocs(collection(db, "cmfProfiles"))
          const fetchedCmfs = []
          cmfsSnap.forEach((docSnap) => {
            const data = docSnap.data()
            const name = data.entityOverview?.registeredName || data.entityOverview?.tradingName || "Unknown CMF"
            fetchedCmfs.push({ uid: docSnap.id, name })
          })

          // Fallback if cmfProfiles is empty (add current user details if missing)
          if (!fetchedCmfs.some(c => c.uid === user.uid)) {
            fetchedCmfs.push({ uid: user.uid, name: user.email || "My CMF Profile" })
          }
          setCmfsList(fetchedCmfs)
        } catch (e) {
          console.warn("Could not fetch CMF profiles:", e)
          setCmfsList([{ uid: user.uid, name: user.email || "My CMF Profile" }])
        }

        // Fetch Draft if draftIdParam exists
        if (draftIdParam) {
          try {
            const draftDoc = await getDoc(doc(db, "cmfOnboardingDrafts", draftIdParam))
            if (draftDoc.exists()) {
              const draftData = draftDoc.data()
              setProfileType(draftData.profileType)
              setFormData((prev) => ({ ...prev, ...draftData.formData }))
              if (draftData.activeStep) {
                setActiveStep(draftData.activeStep)
              }
            }
          } catch (err) {
            console.error("Error loading draft:", err)
          }
        }

        setLoading(false)
      } else {
        navigate("/auth")
      }
    })

    return () => unsubscribe()
  }, [draftIdParam, navigate])

  // Form Fields Config per type
  const requiredFields = useMemo(() => {
    const common = ["contactName", "contactEmail", "contactPhone", "registeredName", "registrationNumber", "physicalAddress", "taxNumber"]
    if (!formData.sameAsPhysical) {
      common.push("postalAddress")
    }

    if (profileType === "Business") {
      return [...common, "legalStructure", "entitySize", "yearsInOperation", "operationStage", "businessDescription", "supportRequired", "fundingRequired"]
    }
    if (profileType === "Funder") {
      return [...common, "legalEntityType", "firmType", "yearsInOperation", "briefDescription", "minTicket", "maxTicket"]
    }
    if (profileType === "Catalyst") {
      return [...common, "legalEntityType", "yearEstablished", "briefDescription", "programName", "programDuration", "supportRequired"]
    }
    if (profileType === "CMF") {
      return [...common, "legalStructure", "entitySize", "yearsInOperation", "operationStage", "businessDescription", "minTicket", "maxTicket"]
    }
    return common
  }, [profileType, formData.sameAsPhysical])

  // Sticky Progress Bar Calc
  const completionPercentage = useMemo(() => {
    if (requiredFields.length === 0) return 0
    let filledCount = 0
    requiredFields.forEach((field) => {
      const value = formData[field]
      if (Array.isArray(value)) {
        if (value.length > 0) filledCount++
      } else if (value !== null && value !== undefined && value.toString().trim() !== "") {
        filledCount++
      }
    })
    return Math.round((filledCount / requiredFields.length) * 100)
  }, [formData, requiredFields])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  const handleMultiSelectToggle = (field, item) => {
    setFormData((prev) => {
      const current = prev[field] || []
      const updated = current.includes(item)
        ? current.filter((x) => x !== item)
        : [...current, item]
      return { ...prev, [field]: updated }
    })
  }

  // Save draft to DB
  const handleSaveDraft = async () => {
    if (!currentUser) return
    setSaving(true)
    try {
      const draftId = draftIdParam || `draft_${Date.now()}`
      const draftDocRef = doc(db, "cmfOnboardingDrafts", draftId)

      await setDoc(draftDocRef, {
        id: draftId,
        facilitatorId: currentUser.uid,
        profileType,
        formData,
        activeStep,
        updatedAt: Date.now()
      })

      alert("Draft saved successfully!")
      navigate("/cmf-cohorts")
    } catch (err) {
      console.error("Error saving draft:", err)
      alert("Failed to save draft.")
    } finally {
      setSaving(false)
    }
  }

  const handleDiscardDraft = async () => {
    if (draftIdParam) {
      setSaving(true)
      try {
        await deleteDoc(doc(db, "cmfOnboardingDrafts", draftIdParam))
      } catch (e) {
        console.warn("Could not delete discarded draft record:", e)
      }
    }
    navigate("/cmf-cohorts")
  }

  // Form Submit Action
  const handleSubmit = async () => {
    if (!formData.consentAccuracy || !formData.consentProcessing || !formData.consentTerms) {
      alert("Please accept all declarations & consents to continue.")
      return
    }

    setSaving(true)
    try {
      // 1. Generate unique entity ID
      const newEntityId = doc(collection(db, "users")).id

      // 2. Map Database Collections based on selected profile type
      const mapping = {
        Business: {
          collectionName: "universalProfiles",
          roleName: "SMSE",
          payload: {
            entityOverview: {
              registeredName: formData.registeredName,
              tradingName: formData.tradingName || formData.registeredName,
              registrationNumber: formData.registrationNumber,
              entityType: "SME",
              legalStructure: formData.legalStructure,
              entitySize: formData.entitySize,
              financialYearEnd: "February",
              yearsInOperation: Number(formData.yearsInOperation || 0),
              operationStage: formData.operationStage,
              economicSectors: formData.economicSectors || [],
              businessDescription: formData.businessDescription,
              operatingCountries: ["South Africa"],
              sponsorName: formData.associateId,
              sponsorType: "CMF",
              sponsorViewPermission: "yes"
            },
            productsServices: {
              offeringType: formData.supportRequired || "Advisory"
            },
            contactDetails: {
              contactTitle: "Mr/Ms",
              contactName: formData.contactName,
              position: "Director",
              businessPhone: formData.contactPhone,
              mobile: formData.contactPhone,
              email: formData.contactEmail,
              physicalAddress: formData.physicalAddress,
              sameAsPhysical: formData.sameAsPhysical,
              postalAddress: formData.sameAsPhysical ? formData.physicalAddress : formData.postalAddress
            },
            legalCompliance: {
              taxNumber: formData.taxNumber || "",
              vatNumber: formData.vatNumber || "",
              bbbeeLevel: formData.bbbeeLevel || "Level 1"
            },
            completedSections: {
              instructions: true, entityOverview: true, productsServices: true,
              ownershipManagement: true, legalCompliance: true, operationsOverview: true,
              financialOverview: true, governance: true, contactDetails: true,
              howDidYouHear: true, documents: true, declarationConsent: true
            },
            profileSubmitted: true,
            bigScore: 75,
            bigScoreUpdatedAt: new Date().toISOString()
          }
        },
        Funder: {
          collectionName: "MyuniversalProfiles",
          roleName: "Investor",
          payload: {
            entityOverview: {
              registeredName: formData.registeredName,
              tradingName: formData.tradingName || formData.registeredName,
              registrationNumber: formData.registrationNumber,
              legalEntityType: formData.legalEntityType || "PTY LTD",
              firmType: formData.firmType || "Venture Capital",
              firmSubtype: formData.firmSubtype || [],
              investorRole: formData.investorRole || "Lead Investor",
              yearsInOperation: Number(formData.yearsInOperation || 0),
              briefDescription: formData.briefDescription,
              numberOfInvestmentExecutives: 3,
              portfolioCompanies: "Various",
              numberOfInvestments: 5,
              valueDeployed: "R10M - R50M",
              additionalSupport: ["Mentorship"],
              howDidYouHear: "CMF Onboarded",
              sponsorName: formData.associateId,
              sponsorType: "CMF",
              sponsorViewPermission: "yes"
            },
            contactDetails: {
              businessTel: formData.contactPhone,
              businessEmail: formData.contactEmail,
              physicalAddress: formData.physicalAddress,
              postalAddress: formData.sameAsPhysical ? formData.physicalAddress : formData.postalAddress,
              primaryContactTitle: "Mr/Ms",
              primaryContactName: formData.contactName.split(" ")[0] || "Name",
              primaryContactSurname: formData.contactName.split(" ").slice(1).join(" ") || "Surname",
              primaryContactPosition: "Manager",
              primaryContactMobile: formData.contactPhone,
              primaryContactEmail: formData.contactEmail
            },
            generalInvestmentPreference: {
              minimumSupportTicket: formData.minTicket || "500000",
              maximumSupportTicket: formData.maxTicket || "5000000",
              sectorFocus: formData.economicSectors || [],
              geographicFocus: formData.geographicFocus || ["Gauteng"],
              selectedProvinces: formData.selectedProvinces || ["Gauteng"],
              legalEntity: [formData.legalEntityType || "PTY LTD"],
              businessLifecycleStage: [formData.operationStage || "Growth"],
              ticketSize: `${formData.minTicket || "500K"} - ${formData.maxTicket || "5M"}`
            },
            completedSections: {
              instructions: true, entityOverview: true, contactDetails: true,
              generalInvestmentPreference: true, fundDetails: true,
              applicationBrief: true, documentUpload: true, declarationConsent: true
            },
            profileSubmitted: true
          }
        },
        Catalyst: {
          collectionName: "catalystProfiles",
          roleName: "Catalyst",
          payload: {
            entityOverview: {
              registeredName: formData.registeredName,
              tradingName: formData.tradingName || formData.registeredName,
              legalEntityType: formData.legalEntityType || "PTY LTD",
              registrationNumber: formData.registrationNumber,
              industrySector: formData.economicSectors?.[0] || "Services",
              companySize: formData.entitySize || "Small",
              yearEstablished: Number(formData.yearEstablished || new Date().getFullYear()),
              briefDescription: formData.briefDescription,
              referralSource: "CMF Onboarded",
              sponsorName: formData.associateId,
              sponsorType: "CMF",
              sponsorViewPermission: "yes"
            },
            contactDetails: {
              businessTel: formData.contactPhone,
              businessEmail: formData.contactEmail,
              physicalAddress: formData.physicalAddress,
              postalAddress: formData.sameAsPhysical ? formData.physicalAddress : formData.postalAddress,
              primaryContactName: formData.contactName,
              primaryContactMobile: formData.contactPhone,
              primaryContactEmail: formData.contactEmail
            },
            programBriefMatchingPreference: {
              programName: formData.programName || `${formData.registeredName} Program`,
              programDuration: formData.programDuration || "12 Months",
              intangibleSupport: formData.supportRequired || "Mentorship & Training",
              geographicFocus: formData.geographicFocus || ["National"],
              sectorFocus: formData.economicSectors || [],
              selectedProvinces: formData.selectedProvinces || ["Gauteng"],
              selectedCountries: ["South Africa"]
            },
            completedSections: {
              instructions: true, entityOverview: true, contactDetails: true,
              programBriefMatchingPreference: true, applicationBrief: true,
              documentUpload: true, declarationConsent: true
            },
            profileSubmitted: true
          }
        },
        CMF: {
          collectionName: "cmfProfiles",
          roleName: "CMF",
          payload: {
            entityOverview: {
              registeredName: formData.registeredName,
              tradingName: formData.tradingName || formData.registeredName,
              registrationNumber: formData.registrationNumber,
              entityType: "CMF",
              legalStructure: formData.legalStructure,
              entitySize: formData.entitySize,
              yearsInOperation: Number(formData.yearsInOperation || 0),
              businessDescription: formData.businessDescription
            },
            contactDetails: {
              contactName: formData.contactName,
              businessPhone: formData.contactPhone,
              email: formData.contactEmail,
              physicalAddress: formData.physicalAddress,
              postalAddress: formData.sameAsPhysical ? formData.physicalAddress : formData.postalAddress
            },
            generalInvestmentPreference: {
              minimumSupportTicket: formData.minTicket || "500000",
              maximumSupportTicket: formData.maxTicket || "5000000",
              sectorFocus: formData.economicSectors || [],
              geographicFocus: formData.geographicFocus || ["Gauteng"]
            },
            completedSections: {
              instructions: true, entityOverview: true, productsServices: true,
              ownershipManagement: true, legalCompliance: true, contactDetails: true,
              documents: true, fundDetails: true, applicationBrief: true,
              generalInvestmentPreference: true, declarationConsent: true
            },
            profileSubmitted: true
          }
        }
      }

      const activeConfig = mapping[profileType]

      // 3. Set profile document
      await setDoc(doc(db, activeConfig.collectionName, newEntityId), activeConfig.payload)

      // 4. Set credentials in users collection
      await setDoc(doc(db, "users", newEntityId), {
        uid: newEntityId,
        email: formData.contactEmail,
        username: formData.contactEmail,
        role: activeConfig.roleName,
        roleArray: [activeConfig.roleName],
        createdAt: new Date(),
        registrationCompleted: true,
        termsAccepted: true,
        ndaAccepted: true,
        onboardedBy: currentUser.uid
      })

      // 5. Create facilitators link mapping in matches (Businesses, Funders, Catalysts)
      if (profileType === "Business") {
        await setDoc(doc(db, "cmfBusinessMatches", `${currentUser.uid}_${newEntityId}`), {
          id: `${currentUser.uid}_${newEntityId}`,
          facilitatorId: currentUser.uid,
          smeId: newEntityId,
          pipelineStage: "Active Support",
          currentStatus: "Active Support",
          matchPercentage: 98,
          reason: "Directly onboarded by Capital and Market Facilitator.",
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
      } else if (profileType === "Funder") {
        await setDoc(doc(db, "cmfFunderMatches", `${currentUser.uid}_${newEntityId}`), {
          id: `${currentUser.uid}_${newEntityId}`,
          facilitatorId: currentUser.uid,
          funderId: newEntityId,
          pipelineStage: "Matched",
          currentStatus: "Matched",
          matchPercentage: 98,
          reason: "Directly onboarded by Capital and Market Facilitator.",
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
      } else if (profileType === "Catalyst") {
        await setDoc(doc(db, "cmfCatalystMatches", `${currentUser.uid}_${newEntityId}`), {
          id: `${currentUser.uid}_${newEntityId}`,
          facilitatorId: currentUser.uid,
          catalystId: newEntityId,
          pipelineStage: "Matched",
          currentStatus: "Matched",
          matchPercentage: 98,
          reason: "Directly onboarded by Capital and Market Facilitator.",
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
      }

      // 6. Delete draft if we resumed one
      if (draftIdParam) {
        await deleteDoc(doc(db, "cmfOnboardingDrafts", draftIdParam))
      }

      alert(`${profileType} profile onboarded successfully!`)
      navigate("/cmf-cohorts")
    } catch (err) {
      console.error("Error submitting onboarding form:", err)
      alert("Submission failed. Please check logs and try again.")
    } finally {
      setSaving(false)
    }
  }

  // Cancel form trigger
  const handleCancelClick = () => {
    // If form has entries, prompt saving draft
    const hasData = formData.registeredName || formData.contactName || formData.contactEmail
    if (hasData) {
      setShowCancelModal(true)
    } else {
      navigate("/cmf-cohorts")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf7f2] text-[#4a352f]">
        <Loader2 className="w-12 h-12 animate-spin text-[#d9b98a] mb-4" />
        <span className="text-sm font-medium">Resolving onboarding environment...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col font-sans">
      {/* ─── STICKY HEADER & PROGRESS ────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e6d7c3]/80 shadow-sm transition-all">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancelClick}
              className="p-2 hover:bg-[#f5f0e1] rounded-xl text-[#7d5a50] transition-colors"
              title="Return to cohorts"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-[#4a352f] m-0">
                Onboard Ecosystem {profileType}
              </h1>
              <p className="text-[11px] text-[#7d5a50] m-0 font-medium tracking-wide uppercase">
                Step {activeStep} of 5 — Phase {activeStep}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs font-semibold text-[#7d5a50]">Onboarding Completion</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-32 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#d9b98a] to-[#a67c52] h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[#4a352f]">{completionPercentage}%</span>
              </div>
            </div>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-1.5 bg-white border border-[#c8b6a6] hover:bg-[#fdfbfa] text-[#7d5a50] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Save size={14} />
              Save Draft
            </button>
          </div>
        </div>
      </div>

      {/* ─── PHASE PROGRESS STEPS ─────────────────────────────────────────────── */}
      <div className="bg-[#faf7f2] border-b border-[#e6d7c3]/30 py-3">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between text-xs font-medium text-[#7d5a50]">
            {[
              "Contact Info",
              "Entity Overview",
              profileType === "Business" || profileType === "CMF" ? "Financials" : "Preferences",
              "Compliance & Address",
              "Association & Review"
            ].map((stepName, i) => {
              const stepIndex = i + 1
              const isActive = activeStep === stepIndex
              const isPassed = activeStep > stepIndex

              return (
                <div key={stepIndex} className="flex items-center gap-2 flex-1 justify-center last:flex-initial">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      isActive
                        ? "bg-[#4a352f] text-white ring-4 ring-[#4a352f]/10"
                        : isPassed
                        ? "bg-emerald-600 text-white"
                        : "bg-white border border-[#c8b6a6] text-[#7d5a50]"
                    }`}
                  >
                    {isPassed ? <Check size={10} /> : stepIndex}
                  </div>
                  <span className={`hidden md:inline ${isActive ? "text-[#4a352f] font-bold" : "text-[#7d5a50]/70"}`}>
                    {stepName}
                  </span>
                  {stepIndex < 5 && <div className="hidden md:block flex-1 h-[1px] bg-[#c8b6a6]/30 mx-4" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── MAIN FORM AREA ─────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl border border-[#e6d7c3] shadow-sm p-8 transition-all">
          {/* STEP 1: CONTACT DETAILS & INFO */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-[#e6d7c3]/50 pb-4">
                <h2 className="text-xl font-bold text-[#4a352f] flex items-center gap-2">
                  <User size={18} className="text-[#a67c52]" />
                  Primary Contact Credentials
                </h2>
                <p className="text-xs text-[#7d5a50] mt-1">
                  Enter the coordinator credentials for this onboarding profile. CMF will manage these records.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    placeholder="e.g. Jane Doe"
                    className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="e.g. jane@company.com"
                    className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    placeholder="e.g. +27 82 123 4567"
                    className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ENTITY OVERVIEW */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-[#e6d7c3]/50 pb-4">
                <h2 className="text-xl font-bold text-[#4a352f] flex items-center gap-2">
                  <Building2 size={18} className="text-[#a67c52]" />
                  Entity Profile Overview
                </h2>
                <p className="text-xs text-[#7d5a50] mt-1">
                  Provide registration and categorization parameters for the {profileType} entity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                    Registered Name *
                  </label>
                  <input
                    type="text"
                    name="registeredName"
                    value={formData.registeredName}
                    onChange={handleInputChange}
                    placeholder="Official Registered Name"
                    className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                    Trading Name (Optional)
                  </label>
                  <input
                    type="text"
                    name="tradingName"
                    value={formData.tradingName}
                    onChange={handleInputChange}
                    placeholder="Trading As Name"
                    className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. 2020/123456/07"
                    className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                  />
                </div>

                {/* Legal Entity structure conditional selection */}
                {(profileType === "Business" || profileType === "CMF") ? (
                  <div>
                    <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                      Legal Structure *
                    </label>
                    <select
                      name="legalStructure"
                      value={formData.legalStructure}
                      onChange={handleInputChange}
                      className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none bg-white transition-all"
                    >
                      <option value="">Select Structure</option>
                      {LEGAL_STRUCTURES[profileType].map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                      Legal Entity Type *
                    </label>
                    <select
                      name="legalEntityType"
                      value={formData.legalEntityType}
                      onChange={handleInputChange}
                      className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none bg-white transition-all"
                    >
                      <option value="">Select Structure Type</option>
                      {LEGAL_STRUCTURES[profileType].map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                )}

                {profileType === "Business" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                        Entity Size *
                      </label>
                      <select
                        name="entitySize"
                        value={formData.entitySize}
                        onChange={handleInputChange}
                        className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none bg-white transition-all"
                      >
                        <option value="">Select Size</option>
                        {SIZE_OPTIONS.map((x) => (
                          <option key={x} value={x}>{x}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                        Operation Stage *
                      </label>
                      <select
                        name="operationStage"
                        value={formData.operationStage}
                        onChange={handleInputChange}
                        className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none bg-white transition-all"
                      >
                        <option value="">Select Stage</option>
                        {STAGE_OPTIONS.map((x) => (
                          <option key={x} value={x}>{x}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {profileType === "Funder" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                      Firm Type *
                    </label>
                    <select
                      name="firmType"
                      value={formData.firmType}
                      onChange={handleInputChange}
                      className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none bg-white transition-all"
                    >
                      <option value="">Select Firm Type</option>
                      {FIRM_TYPES.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Years in Operation */}
                {profileType !== "Catalyst" ? (
                  <div>
                    <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                      Years in Operation *
                    </label>
                    <input
                      type="number"
                      name="yearsInOperation"
                      value={formData.yearsInOperation}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                      Year Established *
                    </label>
                    <input
                      type="number"
                      name="yearEstablished"
                      value={formData.yearEstablished}
                      onChange={handleInputChange}
                      min="1900"
                      max={new Date().getFullYear()}
                      className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Economic Sector Select Multi-Checkboxes */}
              {profileType !== "Catalyst" && (
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-2">
                    Industry / Economic Sectors Focus (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {SECTOR_OPTIONS.map((sector) => {
                      const isChecked = (formData.economicSectors || []).includes(sector)
                      return (
                        <button
                          type="button"
                          key={sector}
                          onClick={() => handleMultiSelectToggle("economicSectors", sector)}
                          className={`text-left text-xs px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between ${
                            isChecked
                              ? "bg-[#4a352f] text-white border-[#4a352f] shadow-sm font-semibold"
                              : "bg-white text-[#7d5a50] border-[#c8b6a6]/50 hover:bg-[#f5f0e1]/40"
                          }`}
                        >
                          <span>{sector}</span>
                          {isChecked && <Check size={12} className="text-white ml-2 flex-shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                  Business Description / Brief Overview *
                </label>
                <textarea
                  name={profileType === "Business" || profileType === "CMF" ? "businessDescription" : "briefDescription"}
                  value={profileType === "Business" || profileType === "CMF" ? formData.businessDescription : formData.briefDescription}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Provide details about products, services, value proposition, and key activities."
                  className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* STEP 3: FINANCIALS & PREFERENCES */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-[#e6d7c3]/50 pb-4">
                <h2 className="text-xl font-bold text-[#4a352f] flex items-center gap-2">
                  <Globe size={18} className="text-[#a67c52]" />
                  Preferences & Mandate Settings
                </h2>
                <p className="text-xs text-[#7d5a50] mt-1">
                  Adjust matching preferences, ticket bounds, or support constraints for {profileType}.
                </p>
              </div>

              {/* SMME / Business Financial details */}
              {profileType === "Business" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                      Funding Required (ZAR Target Amount) *
                    </label>
                    <input
                      type="text"
                      name="fundingRequired"
                      value={formData.fundingRequired}
                      onChange={handleInputChange}
                      placeholder="e.g. R 2,500,000"
                      className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                      Equity Offered (%)
                    </label>
                    <input
                      type="text"
                      name="equityOffered"
                      value={formData.equityOffered}
                      onChange={handleInputChange}
                      placeholder="e.g. 15%"
                      className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                      Collateral / Guarantees Offered
                    </label>
                    <select
                      name="guarantees"
                      value={formData.guarantees}
                      onChange={handleInputChange}
                      className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none bg-white transition-all"
                    >
                      <option value="None">None / Equity Only</option>
                      <option value="Directors Surety">Personal Directors Surety</option>
                      <option value="Asset Backed">Asset-Backed Collateral</option>
                      <option value="Bonds">Bonds / Guarantees</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                      Type of Support Required *
                    </label>
                    <select
                      name="supportRequired"
                      value={formData.supportRequired}
                      onChange={handleInputChange}
                      className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none bg-white transition-all"
                    >
                      <option value="">Select Support Mode</option>
                      {SUPPORT_TYPES.map(x => <option key={x} value={x}>{x}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Funder Preferences */}
              {profileType === "Funder" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                        Minimum Investment Ticket (ZAR) *
                      </label>
                      <input
                        type="text"
                        name="minTicket"
                        value={formData.minTicket}
                        onChange={handleInputChange}
                        placeholder="e.g. 500,000"
                        className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                        Maximum Investment Ticket (ZAR) *
                      </label>
                      <input
                        type="text"
                        name="maxTicket"
                        value={formData.maxTicket}
                        onChange={handleInputChange}
                        placeholder="e.g. 10,000,000"
                        className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#4a352f] mb-2">
                      Funder Subtypes (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {FIRM_TYPES.map((type) => {
                        const isChecked = (formData.firmSubtype || []).includes(type)
                        return (
                          <button
                            type="button"
                            key={type}
                            onClick={() => handleMultiSelectToggle("firmSubtype", type)}
                            className={`text-left text-xs px-3 py-2 rounded-lg border transition-all flex items-center justify-between ${
                              isChecked
                                ? "bg-[#4a352f] text-white border-[#4a352f]"
                                : "bg-white text-[#7d5a50] border-[#c8b6a6]/50 hover:bg-[#f5f0e1]/40"
                            }`}
                          >
                            <span>{type}</span>
                            {isChecked && <Check size={12} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Catalyst Program Details */}
              {profileType === "Catalyst" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                        Active Program Name *
                      </label>
                      <input
                        type="text"
                        name="programName"
                        value={formData.programName}
                        onChange={handleInputChange}
                        placeholder="e.g. Alpha Accelerator Cohort 4"
                        className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                        Program Duration *
                      </label>
                      <input
                        type="text"
                        name="programDuration"
                        value={formData.programDuration}
                        onChange={handleInputChange}
                        placeholder="e.g. 6 Months"
                        className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                        Intangible Support Mode Offered *
                      </label>
                      <select
                        name="supportRequired"
                        value={formData.supportRequired}
                        onChange={handleInputChange}
                        className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none bg-white transition-all"
                      >
                        <option value="">Select Support Mode</option>
                        <option value="Mentorship & Coaching">Mentorship & Coaching</option>
                        <option value="Technical Advisory">Technical Advisory</option>
                        <option value="Corporate Market Access">Corporate Market Access</option>
                        <option value="Incubator Coworking">Incubator Coworking Facilities</option>
                        <option value="Investment Pitch Prep">Investment Pitch Prep & Vetting</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* CMF Preferences */}
              {profileType === "CMF" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                      Min Ecosystem Transaction Size (ZAR) *
                    </label>
                    <input
                      type="text"
                      name="minTicket"
                      value={formData.minTicket}
                      onChange={handleInputChange}
                      placeholder="e.g. 100,000"
                      className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                      Max Ecosystem Transaction Size (ZAR) *
                    </label>
                    <input
                      type="text"
                      name="maxTicket"
                      value={formData.maxTicket}
                      onChange={handleInputChange}
                      placeholder="e.g. 50,000,000"
                      className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Geographical Focus (Funder, Catalyst, CMF) */}
              {profileType !== "Business" && (
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-2">
                    Geographic Focus (Select target provinces)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {PROVINCE_OPTIONS.map((prov) => {
                      const isChecked = (formData.selectedProvinces || []).includes(prov)
                      return (
                        <button
                          type="button"
                          key={prov}
                          onClick={() => handleMultiSelectToggle("selectedProvinces", prov)}
                          className={`text-left text-xs px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between ${
                            isChecked
                              ? "bg-[#4a352f] text-white border-[#4a352f] shadow-sm font-semibold"
                              : "bg-white text-[#7d5a50] border-[#c8b6a6]/50 hover:bg-[#f5f0e1]/40"
                          }`}
                        >
                          <span>{prov}</span>
                          {isChecked && <Check size={12} className="text-white ml-2 flex-shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: COMPLIANCE & ADDRESS */}
          {activeStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-[#e6d7c3]/50 pb-4">
                <h2 className="text-xl font-bold text-[#4a352f] flex items-center gap-2">
                  <MapPin size={18} className="text-[#a67c52]" />
                  Compliance & Address
                </h2>
                <p className="text-xs text-[#7d5a50] mt-1">
                  Enter statutory tax registry parameters and operational office addresses.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                    Tax Reference Number *
                  </label>
                  <input
                    type="text"
                    name="taxNumber"
                    value={formData.taxNumber}
                    onChange={handleInputChange}
                    placeholder="10-Digit Tax Number"
                    className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                    VAT Registration Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="vatNumber"
                    value={formData.vatNumber}
                    onChange={handleInputChange}
                    placeholder="14-Digit VAT Number"
                    className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                    B-BBEE Level Status *
                  </label>
                  <select
                    name="bbbeeLevel"
                    value={formData.bbbeeLevel}
                    onChange={handleInputChange}
                    className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none bg-white transition-all"
                  >
                    <option value="Level 1">Level 1 Contributor</option>
                    <option value="Level 2">Level 2 Contributor</option>
                    <option value="Level 3">Level 3 Contributor</option>
                    <option value="Level 4">Level 4 Contributor</option>
                    <option value="Level 5">Level 5 Contributor</option>
                    <option value="Level 6">Level 6 Contributor</option>
                    <option value="Level 7">Level 7 Contributor</option>
                    <option value="Level 8">Level 8 Contributor</option>
                    <option value="Non-Compliant">Non-Compliant</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                    Physical Address *
                  </label>
                  <textarea
                    name="physicalAddress"
                    value={formData.physicalAddress}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Street Address, City, Province, Postal Code"
                    className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sameAsPhysical"
                    name="sameAsPhysical"
                    checked={formData.sameAsPhysical}
                    onChange={handleInputChange}
                    className="rounded text-[#4a352f] focus:ring-[#7d5a50]/20 w-4 h-4 border-[#c8b6a6]"
                  />
                  <label htmlFor="sameAsPhysical" className="text-xs font-semibold text-[#4a352f] select-none cursor-pointer">
                    Postal Address is the same as Physical Address
                  </label>
                </div>

                {!formData.sameAsPhysical && (
                  <div className="animate-fadeIn">
                    <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">
                      Postal Address *
                    </label>
                    <textarea
                      name="postalAddress"
                      value={formData.postalAddress}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="PO Box / Private Bag Address"
                      className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none transition-all"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: FINAL REVIEW & ASSOCIATION */}
          {activeStep === 5 && (
            <div className="space-y-6">
              <div className="border-b border-[#e6d7c3]/50 pb-4">
                <h2 className="text-xl font-bold text-[#4a352f] flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#a67c52]" />
                  Association Link & Submission Review
                </h2>
                <p className="text-xs text-[#7d5a50] mt-1">
                  Assign this profile to a CMF associate and sign off.
                </p>
              </div>

              {/* CMF Associate selection */}
              <div className="bg-[#faf7f2] p-5 rounded-2xl border border-[#e6d7c3]/80 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#4a352f] mb-1.5">
                    Select Managing Associate (CMF) *
                  </label>
                  <select
                    name="associateId"
                    value={formData.associateId}
                    onChange={handleInputChange}
                    className="w-full border border-[#c8b6a6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7d5a50]/20 focus:outline-none bg-white transition-all"
                  >
                    {cmfsList.map((cmf) => (
                      <option key={cmf.uid} value={cmf.uid}>
                        {cmf.name} {cmf.uid === currentUser?.uid ? "(You)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-[#7d5a50]">
                  <Info size={14} className="text-[#a67c52] flex-shrink-0 mt-0.5" />
                  <span>
                    The selected associate (CMF) will have full data ownership rights to view, update, delete, and coordinate applications for this onboarding record.
                  </span>
                </div>
              </div>

              {/* Data Summary Verification */}
              <div className="border border-[#e6d7c3]/60 rounded-2xl overflow-hidden text-xs">
                <div className="bg-[#4a352f] text-white font-semibold px-4 py-2.5 flex items-center justify-between">
                  <span>Onboarding Profile Summary</span>
                  <span>{profileType}</span>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[#4a352f]">
                  <div>
                    <span className="text-[#7d5a50] font-semibold block">Registered Name:</span>
                    <span>{formData.registeredName || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-[#7d5a50] font-semibold block">Contact Name:</span>
                    <span>{formData.contactName || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-[#7d5a50] font-semibold block">Contact Email:</span>
                    <span>{formData.contactEmail || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-[#7d5a50] font-semibold block">Registration No:</span>
                    <span>{formData.registrationNumber || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-[#7d5a50] font-semibold block">Tax Ref Number:</span>
                    <span>{formData.taxNumber || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-[#7d5a50] font-semibold block">Completion Score:</span>
                    <span className="font-bold text-emerald-600">{completionPercentage}% Completed</span>
                  </div>
                </div>
              </div>

              {/* Consent checkmarks */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consentAccuracy"
                    name="consentAccuracy"
                    checked={formData.consentAccuracy}
                    onChange={handleInputChange}
                    className="rounded text-[#4a352f] focus:ring-[#7d5a50]/20 w-4 h-4 border-[#c8b6a6] mt-0.5"
                  />
                  <label htmlFor="consentAccuracy" className="text-xs text-[#7d5a50] select-none cursor-pointer leading-relaxed">
                    I declare that all information submitted in this form is accurate, true, and complete to the best of my knowledge on behalf of the entity owner.
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consentProcessing"
                    name="consentProcessing"
                    checked={formData.consentProcessing}
                    onChange={handleInputChange}
                    className="rounded text-[#4a352f] focus:ring-[#7d5a50]/20 w-4 h-4 border-[#c8b6a6] mt-0.5"
                  />
                  <label htmlFor="consentProcessing" className="text-xs text-[#7d5a50] select-none cursor-pointer leading-relaxed">
                    I consent to the collection, hosting, and processing of the personal and entity information for matchmaking purposes under applicable POPIA regulations.
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consentTerms"
                    name="consentTerms"
                    checked={formData.consentTerms}
                    onChange={handleInputChange}
                    className="rounded text-[#4a352f] focus:ring-[#7d5a50]/20 w-4 h-4 border-[#c8b6a6] mt-0.5"
                  />
                  <label htmlFor="consentTerms" className="text-xs text-[#7d5a50] select-none cursor-pointer leading-relaxed">
                    I accept the terms of the BIG Marketplace Platform Terms & Conditions and Mutual NDA for this onboarded partner.
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ─── FOOTER CONTROLS ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#e6d7c3]/80">
            <button
              onClick={() => {
                if (activeStep > 1) setActiveStep((x) => x - 1)
              }}
              disabled={activeStep === 1}
              className={`flex items-center gap-1.5 border border-[#c8b6a6] px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                activeStep === 1
                  ? "opacity-40 cursor-not-allowed bg-gray-100 text-gray-400"
                  : "bg-white hover:bg-[#f5f0e1] text-[#7d5a50]"
              }`}
            >
              <ChevronLeft size={16} />
              Previous Phase
            </button>

            {activeStep < 5 ? (
              <button
                onClick={() => {
                  // Phase validation before next
                  let canProceed = true
                  if (activeStep === 1) {
                    if (!formData.contactName || !formData.contactEmail || !formData.contactPhone) {
                      canProceed = false
                      alert("Please fill in contact name, email, and phone.")
                    }
                  } else if (activeStep === 2) {
                    const desc = profileType === "Business" || profileType === "CMF" ? formData.businessDescription : formData.briefDescription
                    if (!formData.registeredName || !formData.registrationNumber || !desc) {
                      canProceed = false
                      alert("Please fill in registered name, registration number, and description.")
                    }
                  }
                  if (canProceed) {
                    setActiveStep((x) => x + 1)
                  }
                }}
                className="flex items-center gap-1.5 bg-[#4a352f] hover:bg-[#392823] text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                Next Phase
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Onboarding...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Complete Onboarding
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── DRAFT CANCEL PROMPT MODAL ─────────────────────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-[#e6d7c3] shadow-2xl mx-4 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle size={24} className="flex-shrink-0" />
              <h3 className="text-base font-bold text-[#4a352f]">Save Draft?</h3>
            </div>
            <p className="text-xs text-[#7d5a50] leading-relaxed">
              You are leaving an incomplete onboarding form. Would you like to save this progress as a draft, or discard your changes?
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleSaveDraft}
                className="w-full bg-[#4a352f] hover:bg-[#392823] text-white py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                Save as Draft
              </button>
              <button
                onClick={handleDiscardDraft}
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 py-2.5 rounded-xl text-xs font-semibold transition-all"
              >
                Discard Changes
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full bg-white border border-[#c8b6a6] hover:bg-gray-50 text-[#7d5a50] py-2.5 rounded-xl text-xs font-semibold transition-all"
              >
                Continue Onboarding
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
