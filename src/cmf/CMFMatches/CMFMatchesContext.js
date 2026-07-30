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
    let score = 55 // Base score

    // Sector matching
    const economicSectors = getNestedField(profileData, "entityOverview.economicSectors") || 
                            getNestedField(profileData, "programBriefMatchingPreference.sectorFocus") || 
                            (getNestedField(profileData, "entityOverview.industrySector") ? [getNestedField(profileData, "entityOverview.industrySector")] : [])
    
    const cmfSectors = cmfPref?.sectorFocus || ["Technology", "Logistics", "Retail", "Construction", "CleanTech"]
    
    const sectorsArray = Array.isArray(economicSectors) ? economicSectors : (economicSectors ? [economicSectors] : [])
    const sectorMatch = sectorsArray.some(s => 
      cmfSectors.some(c => s.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(s.toLowerCase()))
    )
    if (sectorMatch) score += 25

    // Location matching
    let province = getNestedField(profileData, "location") || 
                   getNestedField(profileData, "entityOverview.contactDetails.province") || 
                   getNestedField(profileData, "entityOverview.province") || 
                   ""
    const provincesList = getNestedField(profileData, "programBriefMatchingPreference.selectedProvinces")
    if (Array.isArray(provincesList) && provincesList.length > 0) {
      province = provincesList[0]
    }
    
    const cmfLocations = cmfPref?.geographicFocus || ["Gauteng", "Western Cape", "Eastern Cape", "Limpopo", "National", "South Africa"]
    const locationMatch = cmfLocations.some(c => 
      String(province).toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(String(province).toLowerCase())
    )
    if (locationMatch) score += 15

    return Math.min(score, 98)
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

  const mapSMEProfileToMatch = (smeId, smeData, matchRecord) => {
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
      pipelineStage: matchRecord?.pipelineStage || "Matched",
      currentStatus: matchRecord?.currentStatus || "Matched",
      matchPercentage: matchRecord?.matchPercentage || calculateMatchPercentage(smeData, null),
      bigScore: score,
      compliance: getNestedField(smeData, "legalCompliance.bbbeeLevel") ? 80 : 50,
      legitimacy: 60,
      fundability: 55,
      leadership: 65,
      pis: 60,
      lastActivity: matchRecord?.updatedAt ? new Date(matchRecord.updatedAt).toISOString() : "N/A",
      reason: matchRecord?.reason || getMatchReason(smeData, 75)
    }
  }

  const mapFunderProfileToMatch = (funderId, data, matchRecord) => {
    let name = getNestedField(data, "entityOverview.registeredName") || 
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

    let type = getNestedField(data, "entityOverview.legalEntityType") || 
               getNestedField(data, "fundingType") || 
               getNestedField(data, "legalEntity") ||
               "Growth Fund"
    if (Array.isArray(type) && type.length > 0) {
      type = type[0]
    }
    type = formatCustomTerm(type)

    let minTicket = getNestedField(data, "minimumSupportTicket") || getNestedField(data, "programBriefMatchingPreference.minimumSupportTicket") || ""
    let maxTicket = getNestedField(data, "maximumSupportTicket") || getNestedField(data, "programBriefMatchingPreference.maximumSupportTicket") || ""
    let fundingRange = "R500K - R5.0M"
    if (minTicket || maxTicket) {
      fundingRange = `${minTicket ? 'R ' + minTicket : 'R0'} - ${maxTicket ? 'R ' + maxTicket : 'Open'}`
    }

    const loc = formatCustomTerm(getNestedField(data, "location") || getNestedField(data, "entityOverview.contactDetails.province") || getNestedField(data, "entityOverview.province") || "National")
    
    let sectors = getNestedField(data, "entityOverview.economicSectors") || getNestedField(data, "programBriefMatchingPreference.sectorFocus") || ["Technology", "Logistics", "Retail"]
    if (!Array.isArray(sectors)) {
      sectors = [sectors]
    }
    const formattedSectors = sectors.map(formatCustomTerm)

    const description = getNestedField(data, "entityOverview.briefDescription") || getNestedField(data, "programBriefMatchingPreference.aboutProgram") || "Growth support and financial investment partner."
    
    const contactName = getNestedField(data, "contactDetails.contactName") || 
                        getNestedField(data, "entityOverview.contactDetails.contactName") || 
                        (getNestedField(data, "contactDetails.primaryContactName") ? `${getNestedField(data, "contactDetails.primaryContactName")} ${getNestedField(data, "contactDetails.primaryContactSurname") || ""}`.trim() : "Representative")
    
    const email = getNestedField(data, "contactDetails.email") || getNestedField(data, "entityOverview.contactDetails.email") || getNestedField(data, "contactDetails.businessEmail") || getNestedField(data, "contactDetails.primaryContactEmail") || "info@funder.org"

    return {
      id: funderId,
      name,
      type,
      location: loc,
      fundingRange,
      sectors: formattedSectors,
      matchPercentage: matchRecord?.matchPercentage || calculateMatchPercentage(data, null),
      contactPerson: contactName,
      email,
      description,
      status: matchRecord?.currentStatus || "Matched"
    }
  }

  const mapCatalystProfileToMatch = (catalystId, data, matchRecord) => {
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

    return {
      id: catalystId,
      name,
      type,
      location: loc,
      focus,
      sectors: formattedSectors,
      matchPercentage: matchRecord?.matchPercentage || calculateMatchPercentage(data, null),
      contactPerson: contactName,
      email,
      description,
      status: matchRecord?.currentStatus || "Matched"
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

      // 1. Resolve effective CMF user ID
      try {
        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
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
      try {
        const cmfDocRef = doc(db, "cmfProfiles", currentEffectiveId)
        const cmfDocSnap = await getDoc(cmfDocRef)
        if (cmfDocSnap.exists()) {
          cmfPref = cmfDocSnap.data()?.generalInvestmentPreference
        }
      } catch (err) {
        console.warn("Error fetching CMF profile:", err)
      }

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

      // 4. Fetch profiles
      const universalProfilesSnap = await getDocs(collection(db, "universalProfiles"))
      const catalystProfilesSnap = await getDocs(collection(db, "catalystProfiles"))

      const finalSmeMatches = []
      const finalFunderMatches = []
      const finalCatalystMatches = []
      
      const catalystIds = new Set()

      // Process universalProfiles
      for (const docSnap of universalProfilesSnap.docs) {
        const profileId = docSnap.id
        const profileData = docSnap.data()

        // Detect type using getNestedField
        const entityType1 = (getNestedField(profileData, "entityOverview.entityType") || "").toUpperCase()
        const entityType2 = (getNestedField(profileData, "productsServices.entityType") || "").toUpperCase()

        const isSME = entityType1 === "SME" || entityType1 === "SMSE" || entityType1 === "BUSINESS" ||
                      entityType2 === "SME" || entityType2 === "SMSE" || entityType2 === "BUSINESS"
        
        const isFunder = entityType1 === "INVESTOR" || entityType1 === "FUNDER" || entityType1 === "SPONSOR" ||
                         entityType2 === "INVESTOR" || entityType2 === "FUNDER" || entityType2 === "SPONSOR"

        const isCatalyst = entityType1 === "CATALYST" || entityType2 === "CATALYST"

        // Completeness check
        const completeness = calculateCompleteness(profileData)

        if (isSME) {
          if (completeness < 90) continue
          let matchRecord = existingSmeMatchesMap[profileId]
          if (!matchRecord) {
            const matchPct = calculateMatchPercentage(profileData, cmfPref)
            if (matchPct >= 50) {
              const reason = getMatchReason(profileData, matchPct)
              const matchDocId = `${user.uid}_${profileId}`
              const matchDocRef = doc(db, "cmfBusinessMatches", matchDocId)
              matchRecord = {
                id: matchDocId,
                facilitatorId: user.uid,
                smeId: profileId,
                pipelineStage: "Matched",
                currentStatus: "Matched",
                matchPercentage: matchPct,
                reason: reason,
                createdAt: Date.now(),
                updatedAt: Date.now()
              }
              await setDoc(matchDocRef, matchRecord)
            }
          }
          if (matchRecord) {
            finalSmeMatches.push(mapSMEProfileToMatch(profileId, profileData, matchRecord))
          }
        } 
        else if (isFunder) {
          if (completeness < 90) continue
          let matchRecord = existingFunderMatchesMap[profileId]
          if (!matchRecord) {
            const matchPct = calculateMatchPercentage(profileData, cmfPref)
            if (matchPct >= 50) {
              const reason = getMatchReason(profileData, matchPct)
              const matchDocId = `${user.uid}_${profileId}`
              const matchDocRef = doc(db, "cmfFunderMatches", matchDocId)
              matchRecord = {
                id: matchDocId,
                facilitatorId: user.uid,
                funderId: profileId,
                pipelineStage: "Matched",
                currentStatus: "Matched",
                matchPercentage: matchPct,
                reason: reason,
                createdAt: Date.now(),
                updatedAt: Date.now()
              }
              await setDoc(matchDocRef, matchRecord)
            }
          }
          if (matchRecord) {
            finalFunderMatches.push(mapFunderProfileToMatch(profileId, profileData, matchRecord))
          }
        }
        else if (isCatalyst) {
          if (completeness < 90) continue
          let matchRecord = existingCatalystMatchesMap[profileId]
          if (!matchRecord) {
            const matchPct = calculateMatchPercentage(profileData, cmfPref)
            if (matchPct >= 50) {
              const reason = getMatchReason(profileData, matchPct)
              const matchDocId = `${user.uid}_${profileId}`
              const matchDocRef = doc(db, "cmfCatalystMatches", matchDocId)
              matchRecord = {
                id: matchDocId,
                facilitatorId: user.uid,
                catalystId: profileId,
                pipelineStage: "Matched",
                currentStatus: "Matched",
                matchPercentage: matchPct,
                reason: reason,
                createdAt: Date.now(),
                updatedAt: Date.now()
              }
              await setDoc(matchDocRef, matchRecord)
            }
          }
          if (matchRecord) {
            finalCatalystMatches.push(mapCatalystProfileToMatch(profileId, profileData, matchRecord))
            catalystIds.add(profileId)
          }
        }
      }

      // Process catalystProfiles (and deduplicate if already added!)
      for (const docSnap of catalystProfilesSnap.docs) {
        const profileId = docSnap.id
        if (catalystIds.has(profileId)) continue

        const profileData = docSnap.data()
        const completeness = calculateCompleteness(profileData)
        if (completeness < 90) continue

        let matchRecord = existingCatalystMatchesMap[profileId]
        if (!matchRecord) {
          const matchPct = calculateMatchPercentage(profileData, cmfPref)
          if (matchPct >= 50) {
            const reason = getMatchReason(profileData, matchPct)
            const matchDocId = `${user.uid}_${profileId}`
            const matchDocRef = doc(db, "cmfCatalystMatches", matchDocId)
            matchRecord = {
              id: matchDocId,
              facilitatorId: user.uid,
              catalystId: profileId,
              pipelineStage: "Matched",
              currentStatus: "Matched",
              matchPercentage: matchPct,
              reason: reason,
              createdAt: Date.now(),
              updatedAt: Date.now()
            }
            await setDoc(matchDocRef, matchRecord)
          }
        }
        if (matchRecord) {
          finalCatalystMatches.push(mapCatalystProfileToMatch(profileId, profileData, matchRecord))
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
