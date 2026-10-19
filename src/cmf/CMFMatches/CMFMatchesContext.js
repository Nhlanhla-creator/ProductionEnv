import React, { createContext, useContext, useState, useEffect } from "react"
import { db, auth } from "../../firebaseConfig"
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

const CMFMatchesContext = createContext()

export const useCMFMatches = () => {
  const context = useContext(CMFMatchesContext)
  if (!context) {
    throw new Error("useCMFMatches must be used within a CMFMatchesProvider")
  }
  return context
}

// Utility function to safely resolve fields from root or inside formData
const getNestedField = (data, pathStr) => {
  if (!data) return undefined
  const keys = pathStr.split('.')

  // Try at root first
  let val = data
  for (const key of keys) {
    if (val == null) break
    val = val[key]
  }
  if (val !== undefined) return val

  // Try nested inside formData
  val = data.formData
  for (const key of keys) {
    if (val == null) break
    val = val[key]
  }
  return val
}

// Reformat or decode values that have underscored terms
const formatCustomTerm = (word) => {
  if (!word) return ""
  const lower = String(word).toLowerCase().trim()

  const customMap = {
    "ict": "ICT",
    "ict_information_technology": "ICT & Information Technology",
    "agriculture_forestry_fishing": "Agriculture, Forestry & Fishing",
    "construction_building_civils": "Construction, Building & Civils",
    "logistics_transport_supply_chain": "Logistics, Transport & Supply Chain",
    "manufacturing_production": "Manufacturing & Production",
    "mining_energy_oil_gas": "Mining, Energy, Oil & Gas",
    "pty_ltd": "PTY LTD",
    "sole_proprietorship": "Sole Proprietorship",
    "level_1": "Level 1",
    "level_2": "Level 2",
    "level_3": "Level 3",
    "level_4": "Level 4",
    "south_africa": "South Africa"
  }

  if (customMap[lower]) return customMap[lower]
  if (customMap[word]) return customMap[word]

  // Generic split-capitalize-join for underscores
  return String(word)
    .split(/[_\s-]+/)
    .map(part => {
      const p = part.toLowerCase()
      if (p === "ict") return "ICT"
      if (p === "and") return "&"
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    })
    .join(" ")
}

export const CMFMatchesProvider = ({ children }) => {
  const [smeMatches, setSmeMatches] = useState([])
  const [funderMatches, setFunderMatches] = useState([])
  const [catalystMatches, setCatalystMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [cmfUser, setCmfUser] = useState(null)
  const [effectiveUserId, setEffectiveUserId] = useState(null)

  const calculateMatchPercentage = (profileData, cmfPref) => {
    const baseScore = 40

    // 1. Sector matching (20%)
    const economicSectors = getNestedField(profileData, "entityOverview.economicSectors") ||
      getNestedField(profileData, "programBriefMatchingPreference.sectorFocus") ||
      (getNestedField(profileData, "entityOverview.industrySector") ? [getNestedField(profileData, "entityOverview.industrySector")] : [])
    const cmfSectors = cmfPref?.sectorFocus || []
    const sectorsArray = Array.isArray(economicSectors) ? economicSectors : (economicSectors ? [economicSectors] : [])
    let sectorMatch = false
    if (cmfSectors.length === 0) {
      sectorMatch = true
    } else {
      sectorMatch = sectorsArray.some(s =>
        cmfSectors.some(c => s.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(s.toLowerCase()))
      )
    }
    const sectorScore = sectorMatch ? 20 : 0

    // 2. Location matching (15%)
    let province = getNestedField(profileData, "location") ||
      getNestedField(profileData, "entityOverview.contactDetails.province") ||
      getNestedField(profileData, "entityOverview.province") ||
      ""
    const provincesList = getNestedField(profileData, "programBriefMatchingPreference.selectedProvinces")
    if (Array.isArray(provincesList) && provincesList.length > 0) {
      province = provincesList[0]
    }
    const cmfLocations = cmfPref?.geographicFocus || []
    let locationMatch = false
    if (cmfLocations.length === 0) {
      locationMatch = true
    } else {
      locationMatch = cmfLocations.some(c =>
        String(province).toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(String(province).toLowerCase())
      ) || String(province).toLowerCase() === "national"
    }
    const locationScore = locationMatch ? 15 : 0

    // 3. Stage Focus matching (15%)
    const operationStage = getNestedField(profileData, "entityOverview.operationStage")
    const cmfStages = cmfPref?.investmentStage || []
    let stageMatch = false
    if (cmfStages.length === 0) {
      stageMatch = true
    } else if (operationStage) {
      const normalizedOp = operationStage.toLowerCase().trim()
      const mappedCmfStages = []
      if (normalizedOp === "startup") mappedCmfStages.push("pre-seed", "seed")
      else if (normalizedOp === "growth") mappedCmfStages.push("seed", "series a")
      else if (normalizedOp === "scaling") mappedCmfStages.push("series a", "series b", "series c+")
      else if (normalizedOp === "turnaround") mappedCmfStages.push("growth/pe", "series b")
      else if (normalizedOp === "mature") mappedCmfStages.push("series c+", "growth/pe", "mbo", "mbi", "lbo")

      stageMatch = cmfStages.some(s => mappedCmfStages.includes(s.toLowerCase().trim()))
    }
    const stageScore = stageMatch ? 15 : 0

    // 4. Legal Entity Fit matching (10%)
    const legalStructure = getNestedField(profileData, "entityOverview.legalStructure")
    const cmfLegalEntities = cmfPref?.legalEntityFit ? (Array.isArray(cmfPref.legalEntityFit) ? cmfPref.legalEntityFit : [cmfPref.legalEntityFit]) : []
    let legalMatch = false
    if (cmfLegalEntities.length === 0) {
      legalMatch = true
    } else if (legalStructure) {
      const cleanSmeLegal = legalStructure.toLowerCase().replace(/[\(\)\s-\.]/g, "")
      legalMatch = cmfLegalEntities.some(c => {
        const cleanCmfLegal = c.toLowerCase().replace(/[\(\)\s-\.]/g, "")
        return cleanSmeLegal.includes(cleanCmfLegal) || cleanCmfLegal.includes(cleanSmeLegal)
      })
    }
    const legalScore = legalMatch ? 10 : 0

    return Math.min(baseScore + sectorScore + locationScore + stageScore + legalScore, 98)
  }

  const getMatchReason = (profileData, pct) => {
    const sectorsList = getNestedField(profileData, "entityOverview.economicSectors") ||
      getNestedField(profileData, "programBriefMatchingPreference.sectorFocus") || []
    const sectors = sectorsList.length > 0 ? sectorsList.map(formatCustomTerm).join(", ") : "various sectors"
    const location = getNestedField(profileData, "location") ||
      getNestedField(profileData, "entityOverview.contactDetails.province") ||
      getNestedField(profileData, "entityOverview.province") ||
      "South Africa"
    return `${pct}% match fit based on aligning with your focus in ${sectors} and operational presence in ${formatCustomTerm(location)}.`
  }

  const mapSMEProfileToMatch = (smeId, smeData, matchRecord, cmfPref, isDirectOnboarded) => {
    const sector = getNestedField(smeData, "entityOverview.economicSectors")?.[0] || "Services"
    const score = smeData.bigScore || 45
    const name = getNestedField(smeData, "entityOverview.registeredName") || getNestedField(smeData, "entityOverview.tradingName") || "Unnamed Business"

    return {
      id: smeId,
      name,
      location: formatCustomTerm(getNestedField(smeData, "entityOverview.location") || getNestedField(smeData, "entityOverview.province") || "South Africa"),
      sector: formatCustomTerm(sector),
      fundingStage: formatCustomTerm(getNestedField(smeData, "entityOverview.operationStage") || "Growth"),
      fundingRequired: getNestedField(smeData, "entityOverview.entitySize") === "Medium" ? "R3.0M" : "R1.5M",
      fundingAmount: getNestedField(smeData, "entityOverview.entitySize") === "Medium" ? 3000000 : 1500000,
      equityOffered: "10%",
      guarantees: "Directors Surety",
      supportRequired: getNestedField(smeData, "entityOverview.businessDescription") || "Operations and scaling advisory",
      servicesRequired: getNestedField(smeData, "productsServices.offeringType") || "Advisory",
      applicationDate: smeData.bigScoreUpdatedAt ? smeData.bigScoreUpdatedAt.split("T")[0] : new Date().toISOString().split("T")[0],
      pipelineStage: matchRecord?.pipelineStage || (isDirectOnboarded ? "Active Support" : "Matched"),
      currentStatus: matchRecord?.currentStatus || (isDirectOnboarded ? "Active Support" : "Matched"),
      matchPercentage: isDirectOnboarded
        ? 100
        : calculateMatchPercentage(smeData, cmfPref),
      bigScore: score,
      compliance: getNestedField(smeData, "legalCompliance.bbbeeLevel") ? 80 : 50,
      legitimacy: 60,
      fundability: 55,
      leadership: 65,
      pis: 60,
      lastActivity: matchRecord?.updatedAt ? new Date(matchRecord.updatedAt).toISOString() : "N/A",
      reason: matchRecord?.reason || (isDirectOnboarded ? "Directly onboarded by Capital and Market Facilitator." : getMatchReason(smeData, 75)),
      source: isDirectOnboarded ? "onboarded" : "matched",
      isOnboarded: isDirectOnboarded,
      isSponsored: !isDirectOnboarded && smeData.entityOverview?.sponsorType === "CMF" &&
        smeData.entityOverview?.sponsorViewPermission === "yes",
      onboardedBy: smeData.onboardedBy || null,
      onboardedByName: isDirectOnboarded ? smeData.onboardedByName || null : null
    }
  }

  const mapFunderProfileToMatch = (funderId, data, matchRecord, cmfPref) => {
    let name = getNestedField(data, "fundManageOverview.registeredName") ||
      getNestedField(data, "fundManageOverview.tradingName") ||
      getNestedField(data, "entityOverview.registeredName") ||
      getNestedField(data, "entityOverview.tradingName") ||
      getNestedField(data, "registeredName") ||
      getNestedField(data, "tradingName") ||
      getNestedField(data, "companyName") ||
      getNestedField(data, "name")

    if (name) {
      name = name.trim()
    } else {
      name = funderId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    }

    let type = getNestedField(data, "fundManageOverview.firmType") ||
      getNestedField(data, "fundManageOverview.legalEntityType") ||
      getNestedField(data, "entityOverview.legalEntityType") ||
      getNestedField(data, "fundingType") ||
      getNestedField(data, "legalEntity") ||
      "Growth Fund"
    if (Array.isArray(type) && type.length > 0) {
      type = type[0]
    }
    type = formatCustomTerm(type)

    let minTicket = getNestedField(data, "generalInvestmentPreference.minimumSupportTicket") ||
      getNestedField(data, "minimumSupportTicket") ||
      getNestedField(data, "programBriefMatchingPreference.minimumSupportTicket") || ""
    let maxTicket = getNestedField(data, "generalInvestmentPreference.maximumSupportTicket") ||
      getNestedField(data, "maximumSupportTicket") ||
      getNestedField(data, "programBriefMatchingPreference.maximumSupportTicket") || ""
    let fundingRange = "R500K - R5.0M"
    if (minTicket || maxTicket) {
      fundingRange = `${minTicket ? 'R ' + minTicket : 'R0'} - ${maxTicket ? 'R ' + maxTicket : 'Open'}`
    }

    const loc = formatCustomTerm(getNestedField(data, "location") ||
      getNestedField(data, "contactDetails.physicalAddress") ||
      getNestedField(data, "entityOverview.contactDetails.province") ||
      getNestedField(data, "entityOverview.province") || "National")

    let sectors = getNestedField(data, "generalInvestmentPreference.sectorFocus") ||
      getNestedField(data, "entityOverview.economicSectors") ||
      getNestedField(data, "programBriefMatchingPreference.sectorFocus") || ["Technology", "Logistics", "Retail"]
    if (!Array.isArray(sectors)) {
      sectors = [sectors]
    }
    const formattedSectors = sectors.map(formatCustomTerm)

    const description = getNestedField(data, "fundManageOverview.briefDescription") ||
      getNestedField(data, "entityOverview.briefDescription") ||
      getNestedField(data, "programBriefMatchingPreference.aboutProgram") || "Growth support and financial investment partner."

    const contactName = getNestedField(data, "contactDetails.contactName") ||
      getNestedField(data, "entityOverview.contactDetails.contactName") ||
      (getNestedField(data, "contactDetails.primaryContactName") ? `${getNestedField(data, "contactDetails.primaryContactName")} ${getNestedField(data, "contactDetails.primaryContactSurname") || ""}`.trim() : "Representative")

    const email = getNestedField(data, "contactDetails.primaryContactEmail") ||
      getNestedField(data, "contactDetails.businessEmail") ||
      getNestedField(data, "contactDetails.email") ||
      getNestedField(data, "entityOverview.contactDetails.email") ||
      "info@funder.org"

    const isDirectOnboarded = Boolean(
      (matchRecord?.reason && matchRecord.reason.toLowerCase().includes("onboarded")) ||
      matchRecord?.pipelineStage === "Active Support" ||
      matchRecord?.currentStatus === "Active Support" ||
      data.onboardedBy ||
      data.sponsorType === "CMF" ||
      data.entityOverview?.sponsorType === "CMF" ||
      data.entityOverview?.sponsorName?.toLowerCase?.().includes("cmf") ||
      data.corporateId
    )

    return {
      id: funderId,
      name,
      type,
      location: loc,
      fundingRange,
      sectors: formattedSectors,
      matchPercentage: (matchRecord?.reason && matchRecord.reason.includes("Directly onboarded"))
        ? (matchRecord.matchPercentage || 100)
        : calculateMatchPercentage(data, cmfPref),
      contactPerson: contactName,
      email,
      description,
      status: matchRecord?.currentStatus || (isDirectOnboarded ? "Active Support" : "Matched"),
      currentStatus: matchRecord?.currentStatus || (isDirectOnboarded ? "Active Support" : "Matched"),
      bigScore: data.bigScore || 0,
      compliance: data.compliance || 0,
      legitimacy: data.legitimacy || 0,
      fundability: data.fundability || 0,
      leadership: data.leadership || 0,
      pis: data.pis || 0,
      source: isDirectOnboarded ? "onboarded" : "matched",
      isOnboarded: isDirectOnboarded,
      onboardedBy: data.onboardedBy || null,
      onboardedByName: data.onboardedByName || null
    }
  }

  const mapCatalystProfileToMatch = (catalystId, data, matchRecord, cmfPref) => {
    let name = getNestedField(data, "entityOverview.registeredName") ||
      getNestedField(data, "entityOverview.tradingName") ||
      getNestedField(data, "registeredName") ||
      getNestedField(data, "tradingName") ||
      getNestedField(data, "companyName") ||
      getNestedField(data, "name")

    if (name) {
      name = name.trim()
    } else {
      name = catalystId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    }

    let type = getNestedField(data, "entityOverview.legalEntityType") ||
      getNestedField(data, "legalEntity") ||
      "Accelerator/Incubator"
    if (Array.isArray(type) && type.length > 0) {
      type = type[0]
    }
    type = formatCustomTerm(type)

    const focus = formatCustomTerm(getNestedField(data, "programBriefMatchingPreference.intangibleSupport") || getNestedField(data, "intangibleSupport") || "Technical Advisory & Mentorship")

    let loc = getNestedField(data, "location") || getNestedField(data, "entityOverview.province") || "National"
    const provincesList = getNestedField(data, "programBriefMatchingPreference.selectedProvinces")
    if (Array.isArray(provincesList) && provincesList.length > 0) {
      loc = provincesList[0]
    }
    loc = formatCustomTerm(loc)

    let sectors = getNestedField(data, "entityOverview.economicSectors") || getNestedField(data, "programBriefMatchingPreference.sectorFocus") || ["Technology", "Retail"]
    if (!Array.isArray(sectors)) {
      sectors = [sectors]
    }
    const formattedSectors = sectors.map(formatCustomTerm)

    const description = getNestedField(data, "entityOverview.briefDescription") || getNestedField(data, "programBriefMatchingPreference.aboutProgram") || "Entrepreneurship and innovation support organization."

    const contactName = getNestedField(data, "contactDetails.primaryContactName")
      ? `${getNestedField(data, "contactDetails.primaryContactName")} ${getNestedField(data, "contactDetails.primaryContactSurname") || ""}`.trim()
      : (getNestedField(data, "contactDetails.contactName") || "Support Lead")

    const email = getNestedField(data, "contactDetails.businessEmail") || getNestedField(data, "contactDetails.email") || getNestedField(data, "contactDetails.primaryContactEmail") || "info@catalyst.africa"

    const isDirectOnboarded = Boolean(
      (matchRecord?.reason && matchRecord.reason.toLowerCase().includes("onboarded")) ||
      matchRecord?.pipelineStage === "Active Support" ||
      matchRecord?.currentStatus === "Active Support" ||
      data.onboardedBy ||
      data.sponsorType === "CMF" ||
      data.entityOverview?.sponsorType === "CMF" ||
      data.entityOverview?.sponsorName?.toLowerCase?.().includes("cmf") ||
      data.corporateId
    )

    return {
      id: catalystId,
      name,
      type,
      location: loc,
      focus,
      sectors: formattedSectors,
      matchPercentage: (matchRecord?.reason && matchRecord.reason.includes("Directly onboarded"))
        ? (matchRecord.matchPercentage || 100)
        : calculateMatchPercentage(data, cmfPref),
      contactPerson: contactName,
      email,
      description,
      status: matchRecord?.currentStatus || (isDirectOnboarded ? "Active Support" : "Matched"),
      currentStatus: matchRecord?.currentStatus || (isDirectOnboarded ? "Active Support" : "Matched"),
      bigScore: data.bigScore || 0,
      compliance: data.compliance || 0,
      legitimacy: data.legitimacy || 0,
      fundability: data.fundability || 0,
      leadership: data.leadership || 0,
      pis: data.pis || 0,
      source: isDirectOnboarded ? "onboarded" : "matched",
      isOnboarded: isDirectOnboarded,
      onboardedBy: data.onboardedBy || null,
      onboardedByName: data.onboardedByName || null
    }
  }

  const calculateCompleteness = (profileData) => {
    const completedSections = profileData.completedSections || profileData.formData?.completedSections
    if (!completedSections) return 0
    const sectionKeys = Object.keys(completedSections).filter(k => k !== "instructions")
    if (sectionKeys.length === 0) return 0
    const trueCount = sectionKeys.filter(key => completedSections[key] === true).length
    return (trueCount / sectionKeys.length) * 100
  }

  const loadMatches = async (user) => {
    try {
      setLoading(true)
      let currentEffectiveId = `${user.uid}_cmf`
      let currentUserData = null

      // 1. Resolve effective CMF user ID
      try {
        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
          currentUserData = userData
          const companyId = userData.companyId
          if (companyId) {
            const companyDocRef = doc(db, "companies", companyId)
            const companyDocSnap = await getDoc(companyDocRef)
            if (companyDocSnap.exists()) {
              const companyData = companyDocSnap.data()
              const ownerId = companyData.createdBy
              if (ownerId && ownerId !== user.uid) {
                currentEffectiveId = `${ownerId}_cmf`
              }
            }
          }
        }
      } catch (err) {
        console.warn("Error resolving effective CMF user:", err)
      }
      setEffectiveUserId(currentEffectiveId)

      // 2. Fetch CMF profile preferences
      let cmfPref = null
      let cmfOnboarderName = ""
      try {
        const cmfDocRef = doc(db, "cmfProfiles", currentEffectiveId)
        const cmfDocSnap = await getDoc(cmfDocRef)
        if (cmfDocSnap.exists()) {
          const cmfProfile = cmfDocSnap.data()
          cmfPref = cmfProfile?.generalInvestmentPreference
          cmfOnboarderName =
            cmfProfile?.entityOverview?.organisationName ||
            cmfProfile?.entityOverview?.registeredName ||
            cmfProfile?.contactDetails?.accountAdminName ||
            cmfProfile?.contactDetails?.smeContactName ||
            ""
        }
      } catch (err) {
        console.warn("Error fetching CMF profile:", err)
      }
      cmfOnboarderName ||= currentUserData?.displayName ||
        currentUserData?.fullName ||
        currentUserData?.name ||
        currentUserData?.username ||
        user.displayName ||
        user.email ||
        "CMF"

      // 3. Fetch existing facilitator matches maps
      const existingSmeMatchesMap = {}
      const existingFunderMatchesMap = {}
      const existingCatalystMatchesMap = {}

      try {
        const smeMatchesSnap = await getDocs(query(collection(db, "cmfBusinessMatches"), where("facilitatorId", "==", user.uid)))
        smeMatchesSnap.forEach((docSnap) => {
          const matchData = docSnap.data()
          existingSmeMatchesMap[matchData.smeId] = { id: docSnap.id, ...matchData }
        })

        const funderMatchesSnap = await getDocs(query(collection(db, "cmfFunderMatches"), where("facilitatorId", "==", user.uid)))
        funderMatchesSnap.forEach((docSnap) => {
          const matchData = docSnap.data()
          existingFunderMatchesMap[matchData.funderId] = { id: docSnap.id, ...matchData }
        })

        const catalystMatchesSnap = await getDocs(query(collection(db, "cmfCatalystMatches"), where("facilitatorId", "==", user.uid)))
        catalystMatchesSnap.forEach((docSnap) => {
          const matchData = docSnap.data()
          existingCatalystMatchesMap[matchData.catalystId] = { id: docSnap.id, ...matchData }
        })
      } catch (err) {
        console.warn("Error fetching existing match records:", err)
      }

      // A business enters this CMF's cohort only through onboarding or explicit
      // sponsor permission on its own profile.
      const onboardedUsersSnap = await getDocs(query(
        collection(db, "users"),
        where("onboardedBy", "==", user.uid)
      ))
      const onboardedSmeIds = new Set(
        onboardedUsersSnap.docs
          .filter((userDoc) => {
            const data = userDoc.data()
            const roles = [
              data.role,
              ...(Array.isArray(data.roleArray) ? data.roleArray : []),
              ...(data.roles && typeof data.roles === "object" ? Object.keys(data.roles) : [])
            ].map((role) => String(role || "").toLowerCase())
            return roles.some((role) =>
              ["sme", "smse", "business", "smes", "smses"].includes(role)
            )
          })
          .map((userDoc) => userDoc.id)
      )
      const sponsorIds = [...new Set([user.uid, currentEffectiveId])]
      const sponsoredSmeProfilesSnap = await getDocs(query(
        collection(db, "universalProfiles"),
        where("entityOverview.sponsorType", "==", "CMF"),
        where("entityOverview.sponsorName", "in", sponsorIds),
        where("entityOverview.sponsorViewPermission", "==", "yes")
      ))

      const authorizedSmeProfiles = new Map()
      const onboardedProfiles = await Promise.all(
        [...onboardedSmeIds].map((profileId) =>
          getDoc(doc(db, "universalProfiles", profileId))
        )
      )
      onboardedProfiles.forEach((profileSnap) => {
        if (profileSnap.exists()) {
          authorizedSmeProfiles.set(profileSnap.id, {
            data: profileSnap.data(),
            isOnboarded: true
          })
        }
      })
      sponsoredSmeProfilesSnap.forEach((profileSnap) => {
        const profileData = profileSnap.data()
        const entityOverview = profileData.entityOverview || {}
        if (
          entityOverview.sponsorType === "CMF" &&
          sponsorIds.includes(entityOverview.sponsorName) &&
          entityOverview.sponsorViewPermission === "yes" &&
          !authorizedSmeProfiles.has(profileSnap.id)
        ) {
          authorizedSmeProfiles.set(profileSnap.id, {
            data: profileData,
            isOnboarded: false
          })
        }
      })

      const funderProfilesSnap = await getDocs(collection(db, "MyuniversalProfiles"))
      const catalystProfilesSnap = await getDocs(collection(db, "catalystProfiles"))

      const finalSmeMatches = []
      const finalFunderMatches = []
      const finalCatalystMatches = []

      const catalystIds = new Set()

      // Process only the SMEs authorized above, never the global SME directory.
      for (const [profileId, candidate] of authorizedSmeProfiles) {
        const profileData = candidate.data

        // Detect type using getNestedField
        const entityType1 = (getNestedField(profileData, "entityOverview.entityType") ||
          getNestedField(profileData, "fundManageOverview.entityType") || "").toUpperCase()
        const entityType2 = (getNestedField(profileData, "productsServices.entityType") || "").toUpperCase()

        const isSME = entityType1 === "SME" || entityType1 === "SMSE" || entityType1 === "BUSINESS" ||
          entityType2 === "SME" || entityType2 === "SMSE" || entityType2 === "BUSINESS"

        if (!isSME) continue

        const sponsorType = getNestedField(profileData, "entityOverview.sponsorType") ||
          profileData.sponsorType || ""
        const sponsorName = getNestedField(profileData, "entityOverview.sponsorName") ||
          profileData.sponsorName || ""
        const sponsorPermission = getNestedField(profileData, "entityOverview.sponsorViewPermission") ||
          profileData.sponsorViewPermission || ""
        const hasSponsorConsent = sponsorType === "CMF" &&
          sponsorIds.includes(sponsorName) &&
          sponsorPermission === "yes"
        if (!candidate.isOnboarded && !hasSponsorConsent) continue

        const matchDocId = `${user.uid}_${profileId}`
        const matchDocRef = doc(db, "cmfBusinessMatches", matchDocId)
        const isDirectOnboarded = candidate.isOnboarded
        const matchPercentage = isDirectOnboarded
          ? 100
          : calculateMatchPercentage(profileData, cmfPref)
        let matchRecord = existingSmeMatchesMap[profileId]

        if (!matchRecord) {
          matchRecord = {
            id: matchDocId,
            facilitatorId: user.uid,
            smeId: profileId,
            pipelineStage: isDirectOnboarded ? "Active Support" : "Matched",
            currentStatus: isDirectOnboarded ? "Active Support" : "Matched",
            matchPercentage,
            reason: isDirectOnboarded
              ? "Directly onboarded by this Capital and Market Facilitator."
              : "SME selected this CMF as sponsor and granted profile access.",
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
          try {
            await setDoc(matchDocRef, matchRecord)
          } catch (error) {
            console.warn(`Could not create CMF cohort record for SME ${profileId}:`, error)
          }
        }

        const profileWithOnboarder = isDirectOnboarded
          ? {
              ...profileData,
              onboardedBy: user.uid,
              onboardedByName: cmfOnboarderName
            }
          : profileData
        finalSmeMatches.push(mapSMEProfileToMatch(
          profileId,
          profileWithOnboarder,
          matchRecord,
          cmfPref,
          isDirectOnboarded
        ))
      }

      // Process funderProfiles from MyuniversalProfiles
      for (const docSnap of funderProfilesSnap.docs) {
        const profileId = docSnap.id
        if (finalFunderMatches.some(f => f.id === profileId)) continue

        const profileData = docSnap.data()

        const sponsorType = profileData.sponsorType || profileData.entityOverview?.sponsorType || ""
        const onboardedBy = profileData.onboardedBy || profileData.sponsorName || profileData.entityOverview?.sponsorName || ""
        const isCmfOnboarded = sponsorType === "CMF" || !!profileData.corporateId || (onboardedBy && onboardedBy.includes("_cmf"))
        if (isCmfOnboarded && onboardedBy !== user.uid && onboardedBy !== currentEffectiveId) {
          continue
        }

        let matchRecord = existingFunderMatchesMap[profileId]
        const isDirectOnboarded = isCmfOnboarded || onboardedBy === user.uid || onboardedBy === currentEffectiveId
        const completeness = calculateCompleteness(profileData)
        if (!isDirectOnboarded && !matchRecord && completeness < 40) continue

        if (!matchRecord) {
          const matchPct = calculateMatchPercentage(profileData, cmfPref)
          if (matchPct >= 50 || isDirectOnboarded) {
            const reason = getMatchReason(profileData, matchPct)
            const matchDocId = `${user.uid}_${profileId}`
            const matchDocRef = doc(db, "cmfFunderMatches", matchDocId)
            matchRecord = {
              id: matchDocId,
              facilitatorId: user.uid,
              funderId: profileId,
              pipelineStage: "Matched",
              currentStatus: "Matched",
              matchPercentage: isDirectOnboarded ? 100 : matchPct,
              reason: reason,
              createdAt: Date.now(),
              updatedAt: Date.now()
            }
            await setDoc(matchDocRef, matchRecord).catch((e) => console.warn("Failed to set funder matchDoc:", e))
          }
        }
        if (matchRecord) {
          const profileForMatch = isDirectOnboarded
            ? { ...profileData, onboardedByName: cmfOnboarderName }
            : profileData
          finalFunderMatches.push(mapFunderProfileToMatch(profileId, profileForMatch, matchRecord, cmfPref))
        }
      }

      // Process catalystProfiles (and deduplicate if already added!)
      for (const docSnap of catalystProfilesSnap.docs) {
        const profileId = docSnap.id
        if (catalystIds.has(profileId)) continue

        const profileData = docSnap.data()

        const sponsorType = profileData.sponsorType || profileData.entityOverview?.sponsorType || ""
        const onboardedBy = profileData.onboardedBy || profileData.sponsorName || profileData.entityOverview?.sponsorName || ""
        const isCmfOnboarded = sponsorType === "CMF" || !!profileData.corporateId || (onboardedBy && onboardedBy.includes("_cmf"))
        if (isCmfOnboarded && onboardedBy !== user.uid && onboardedBy !== currentEffectiveId) {
          continue
        }

        let matchRecord = existingCatalystMatchesMap[profileId]
        const isDirectOnboarded = isCmfOnboarded || onboardedBy === user.uid || onboardedBy === currentEffectiveId
        const completeness = calculateCompleteness(profileData)
        if (!isDirectOnboarded && !matchRecord && completeness < 40) continue

        if (!matchRecord) {
          const matchPct = calculateMatchPercentage(profileData, cmfPref)
          if (matchPct >= 50 || isDirectOnboarded) {
            const reason = getMatchReason(profileData, matchPct)
            const matchDocId = `${user.uid}_${profileId}`
            const matchDocRef = doc(db, "cmfCatalystMatches", matchDocId)
            matchRecord = {
              id: matchDocId,
              facilitatorId: user.uid,
              catalystId: profileId,
              pipelineStage: "Matched",
              currentStatus: "Matched",
              matchPercentage: isDirectOnboarded ? 100 : matchPct,
              reason: reason,
              createdAt: Date.now(),
              updatedAt: Date.now()
            }
            await setDoc(matchDocRef, matchRecord).catch((e) => console.warn("Failed to set catalyst matchDoc:", e))
          }
        }
        if (matchRecord) {
          const profileForMatch = isDirectOnboarded
            ? { ...profileData, onboardedByName: cmfOnboarderName }
            : profileData
          finalCatalystMatches.push(mapCatalystProfileToMatch(profileId, profileForMatch, matchRecord, cmfPref))
          catalystIds.add(profileId)
        }
      }

      setSmeMatches(finalSmeMatches)
      setFunderMatches(finalFunderMatches)
      setCatalystMatches(finalCatalystMatches)
    } catch (err) {
      console.error("Error loading CMF matches:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCmfUser(user)
      if (user) {
        loadMatches(user)
      } else {
        setSmeMatches([])
        setFunderMatches([])
        setCatalystMatches([])
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  const updateMatchStage = async (smeId, newStage) => {
    if (!cmfUser) return
    try {
      const matchDocId = `${cmfUser.uid}_${smeId}`
      const docRef = doc(db, "cmfBusinessMatches", matchDocId)

      await setDoc(docRef, {
        pipelineStage: newStage,
        currentStatus: newStage,
        updatedAt: Date.now()
      }, { merge: true })

      setSmeMatches((prev) =>
        prev.map((item) => {
          if (item.id === smeId) {
            return {
              ...item,
              pipelineStage: newStage,
              currentStatus: newStage,
              lastActivity: new Date().toISOString()
            }
          }
          return item
        })
      )
    } catch (err) {
      console.error("Error updating match stage:", err)
      alert("Failed to update pipeline stage.")
    }
  }

  return (
    <CMFMatchesContext.Provider value={{
      smeMatches,
      funderMatches,
      catalystMatches,
      loading,
      updateMatchStage,
      reloadMatches: () => cmfUser && loadMatches(cmfUser)
    }}>
      {children}
    </CMFMatchesContext.Provider>
  )
}
