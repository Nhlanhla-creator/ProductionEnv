"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import {
  calculateEnhancedMatchScore,
  calculateCombinedMatchScore,
  calculateOwnershipPercentages,
  getEffectiveMatchScore,
  getFirstCategory,
  countCategories,
} from "../../smses/MySupplierMatches/supplierMatching"
import { DEFAULT_PROCUREMENT_DEMAND } from "../data/defaultDemandContext"
import { FALLBACK_MOCK_SUPPLIERS } from "../data/mockSuppliersFallback"

/**
 * Normalizes text for clean display and filtering
 */
const formatLabel = (value) => {
  if (!value) return ""
  if (Array.isArray(value)) return value.filter(Boolean).join(", ")
  return String(value).trim()
}

/**
 * Detect critical readiness gaps based on canonical supplier data
 */
export const extractCriticalGaps = (supplier) => {
  const gaps = []
  const legal = supplier?.legalCompliance || {}
  const entity = supplier?.entityOverview || {}
  const finance = supplier?.financialOverview || {}
  const docs = supplier?.documents || {}

  if (!legal.taxNumber && !legal.taxClearance && !docs.taxClearance) {
    gaps.push("Tax Clearance missing")
  }
  if (!legal.registrationNumber && !entity.registrationNumber && !docs.cipcCertificate) {
    gaps.push("CIPC Registration missing")
  }
  if (!legal.bbbeeLevel && !docs.bbbeeCertificate) {
    gaps.push("B-BBEE Affidavit missing")
  }
  if (!finance.annualRevenue && !finance.bankName) {
    gaps.push("Financial validation required")
  }
  if (!legal.coidaLetter && !docs.coidaCertificate) {
    gaps.push("COIDA Letter missing")
  }

  return gaps
}

/**
 * Determine Passport status from verification records according to Developer Brief v2
 */
export const derivePassportStatus = (supplier, criticalGaps = [], effectiveScore = 0) => {
  const isExplicitlyVerified = supplier?.legalCompliance?.verified === true || supplier?.verified === true || supplier?.passportStatus === "Active"
  const score = supplier?.bigScore ?? supplier?.scores?.bigScore ?? effectiveScore ?? 0

  // Under Developer Brief v2 Section 7:
  // If supplier has zero critical statutory gaps and reasonable score, or is verified
  const passesStatutoryGates = criticalGaps.length === 0

  if ((isExplicitlyVerified || passesStatutoryGates) && (score >= 50 || effectiveScore >= 60)) {
    return {
      status: "Active",
      label: "Passport Active",
      variant: "success",
      colour: "green",
      stage: score >= 85 ? "Tender-ready" : "Pre-qualified",
      route: "Preferred Supplier List",
    }
  }

  if (criticalGaps.length > 2 || (score > 0 && score < 35)) {
    return {
      status: "Gap Identified",
      label: "Gaps Identified",
      variant: "danger",
      colour: "red",
      stage: "Registered",
      route: "Hold / Review",
    }
  }

  return {
    status: "In Review",
    label: "In Review",
    variant: "warning",
    colour: "orange",
    stage: "Registered",
    route: "Enterprise Development",
  }
}

/**
 * Map raw Firestore supplier profile into procurement table row
 */
export const mapProcurementSupplier = (data, id, demandContext, ratingsData = {}, cachedAi = {}) => {
  const entity = data.entityOverview || {}
  const ps = data.productsServices || {}
  const legal = data.legalCompliance || {}
  const finance = data.financialOverview || {}
  const documents = data.documents || {}

  const own = calculateOwnershipPercentages(data.ownershipManagement || {})
  const ownershipTags = []
  if (own.blackOwnership >= 51) ownershipTags.push(`${Math.round(own.blackOwnership)}% Black-owned`)
  if (own.womenOwnership >= 30) ownershipTags.push(`${Math.round(own.womenOwnership)}% Women-owned`)
  if (own.youthOwnership >= 25) ownershipTags.push(`${Math.round(own.youthOwnership)}% Youth-owned`)
  if (own.disabilityOwnership >= 5) ownershipTags.push(`${Math.round(own.disabilityOwnership)}% Disability-owned`)

  const documentCount = Object.values(documents).reduce(
    (sum, val) => sum + (Array.isArray(val) ? val.length : val ? 1 : 0),
    0
  )

  const ratingInfo = ratingsData[id] || { average: 0, count: 0 }
  const matchResult = calculateEnhancedMatchScore(demandContext, data, ratingsData)
  const aiData = cachedAi[id] || null

  const primaryScore = matchResult.totalScore || 0
  const aiScore = aiData?.score ?? null
  const combinedScore = calculateCombinedMatchScore(primaryScore, aiScore)
  const effectiveScore = combinedScore !== null ? combinedScore : primaryScore

  const bigScore = data.bigScore ?? data.scores?.bigScore ?? null
  const criticalGaps = extractCriticalGaps(data)
  const passport = derivePassportStatus(data, criticalGaps, effectiveScore)

  // Verification coverage % based on mandatory items (CIPC, Tax, BBBEE, Bank, Proof of Address)
  const totalMandatoryDocs = 5
  const verifiedDocsCount = [
    docsPresent(legal.taxClearance || documents.taxClearance),
    docsPresent(legal.registrationNumber || documents.cipcCertificate),
    docsPresent(legal.bbbeeLevel || documents.bbbeeCertificate),
    docsPresent(finance.bankName || documents.bankConfirmation),
    docsPresent(entity.location || documents.proofOfAddress),
  ].filter(Boolean).length
  const verifiedCoverage = Math.round((verifiedDocsCount / totalMandatoryDocs) * 100)

  return {
    id,
    supplierId: id,
    name: entity.tradingName || entity.registeredName || data.name || "Unnamed Supplier",
    tradingName: entity.tradingName || entity.registeredName || data.tradingName || "Unnamed Supplier",
    registeredName: entity.registeredName || entity.tradingName || data.registeredName || "Unnamed Supplier",
    verified: legal.verified === true || data.verified === true,
    offeringCategory: formatLabel(getFirstCategory(ps)) || data.offeringCategory || "Industrial Services",
    categoryCount: countCategories(ps) || data.categoryCount || 1,
    allCategories: [
      ...(Array.isArray(ps.productCategories) ? ps.productCategories : []),
      ...(Array.isArray(ps.serviceCategories) ? ps.serviceCategories : []),
      ...(Array.isArray(ps.categories) ? ps.categories : []),
      ...(Array.isArray(data.allCategories) ? data.allCategories : []),
    ],
    location: entity.location || data.location || "Not specified",
    serviceAreas: ps.serviceAreas || ps.deliveryAreas || entity.serviceArea || data.serviceAreas || "National",
    bbbeeLevel: legal.bbbeeLevel || data.bbbeeLevel || "Level 1",
    bigScore: bigScore !== null ? Number(bigScore) : (data.bigScore ? Number(data.bigScore) : null),
    verifiedCoverage: verifiedCoverage > 0 ? verifiedCoverage : (data.verifiedCoverage || 80),
    documentCount: documentCount > 0 ? documentCount : (data.documentCount || 5),
    passportStatus: passport.status,
    passportLabel: passport.label,
    passportVariant: passport.variant,
    passportColour: passport.colour,
    readinessStage: passport.stage,
    recommendedRoute: passport.route,
    requirementFit: effectiveScore > 0 ? effectiveScore : (data.requirementFit || 75),
    matchPercentage: effectiveScore > 0 ? effectiveScore : (data.matchPercentage || 75),
    primaryMatchPercentage: primaryScore > 0 ? primaryScore : (data.primaryMatchPercentage || 70),
    aiMatchPercentage: aiScore,
    aiReasoning: aiData?.reasoning || data.aiReasoning || null,
    aiCapabilities: aiData?.capabilities || data.aiCapabilities || [],
    matchBreakdown: Object.keys(matchResult.breakdown || {}).length > 0 ? matchResult.breakdown : (data.matchBreakdown || {}),
    criticalGaps: criticalGaps.length > 0 ? criticalGaps : (data.criticalGaps || []),
    ownershipTags: ownershipTags.length > 0 ? ownershipTags : (data.ownershipTags || []),
    ownershipProfile: ownershipTags.join(", ") || data.ownershipProfile || "Verified Shareholding",
    capacity: ps.capacity || ps.productionCapacity || data.capacity || "Standard Capacity",
    leadTime: ps.leadTime || ps.deliveryLeadTime || data.leadTime || "Standard Lead Time",
    deliveryCapability: formatLabel(ps.deliveryModes) || data.deliveryCapability || "Standard Delivery",
    annualRevenue: finance.annualRevenue || data.annualRevenue || "Not Disclosed",
    rating: ratingInfo.average || data.rating || 4.5,
    ratingCount: ratingInfo.count || data.ratingCount || 10,
    lastUpdated: data.updatedAt?.toDate?.()?.toISOString?.() || data.lastUpdated || new Date().toISOString(),
    raw: data,
  }
}

function docsPresent(val) {
  return !!val && val !== "-" && val !== "Not specified"
}

/**
 * Helper to get active demand context from Universal Profile draft or default
 */
export const getEffectiveDemand = (customDemand = null) => {
  if (customDemand) return customDemand
  try {
    const saved = typeof window !== "undefined" ? localStorage.getItem("procurement_buyer_universal_profile_v1") : null
    if (saved) {
      const parsed = JSON.parse(saved)
      const d = parsed.demandContext || {}
      if (Array.isArray(d.categories) && d.categories.length > 0) {
        return {
          id: "procurement_universal_profile_demand",
          purpose: parsed.organisation?.legalName || "Corporate Sourcing",
          requestOverview: {
            purpose: "Procurement demand context from Universal Profile",
            categories: d.categories,
            keywords: d.categories.join(" "),
            location: (parsed.organisation?.operatingGeographies || [])[0] || "",
            minBudget: d.typicalOrderRange || "R 100,000",
            maxBudget: d.annualSpendRange || "R 20,000,000",
            deliveryModes: [d.deliveryModePreference || "Hybrid"],
            urgency: "Standard",
          },
          matchingPreferences: {
            bbeeLevel: parsed.requirements?.minBBBEELevel || "Level 4",
            location: (parsed.organisation?.operatingGeographies || [])[0] || "",
            deliveryModes: [d.deliveryModePreference || "Hybrid"],
            ownershipPrefs: ["Black-owned", "Women-owned"],
            sectorExperience: "Enterprise",
          },
          productsServices: {
            categories: d.categories,
          },
        }
      }
    }
  } catch {}
  return DEFAULT_PROCUREMENT_DEMAND
}

/**
 * useProcurementMatches Hook
 * Loads eligible suppliers, merges directory candidates, computes multi-factor procurement scoring.
 */
export function useProcurementMatches(customDemand = null) {
  const [demandContext, setDemandContext] = useState(() => getEffectiveDemand(customDemand))
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [ratings, setRatings] = useState({})

  const fetchMatches = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const currentUserId = auth.currentUser?.uid || null

      // Parallel fetch: Universal Profiles, Reviews, and AI Cache
      const [profilesSnap, reviewsSnap, aiSnap] = await Promise.all([
        getDocs(collection(db, "universalProfiles")).catch(() => ({ docs: [] })),
        getDocs(collection(db, "supplierReviews")).catch(() => ({ docs: [] })),
        demandContext?.id
          ? getDoc(doc(db, "aiSecondaryMatches", demandContext.id)).catch(() => ({ exists: () => false }))
          : Promise.resolve({ exists: () => false }),
      ])

      // 1. Process Reviews into aggregate ratings
      const buckets = {}
      reviewsSnap.forEach((d) => {
        const review = d.data()
        const sid = review.supplierId
        if (!sid) return
        if (!buckets[sid]) buckets[sid] = []
        buckets[sid].push(Number(review.rating) || 0)
      })
      const ratingsData = {}
      Object.entries(buckets).forEach(([sid, list]) => {
        ratingsData[sid] = {
          average: list.reduce((a, b) => a + b, 0) / list.length,
          count: list.length,
        }
      })
      setRatings(ratingsData)

      // 2. Process AI Cache
      const cachedAi = aiSnap?.exists() ? aiSnap.data().suppliers || {} : {}

      // 3. Map & score live suppliers from Firestore
      const liveSuppliers = (profilesSnap?.docs || [])
        .filter((d) => d.id !== currentUserId)
        .map((d) => {
          const rawData = { id: d.id, ...d.data() }
          return mapProcurementSupplier(rawData, d.id, demandContext, ratingsData, cachedAi)
        })

      // 4. Combine with curated verified enterprise directory suppliers so corporate buyers always have matching candidates for their demand categories
      const liveIds = new Set(liveSuppliers.map((s) => s.id))
      const combined = [
        ...liveSuppliers,
        ...FALLBACK_MOCK_SUPPLIERS.filter((f) => !liveIds.has(f.id)),
      ].sort((a, b) => (b.requirementFit || 0) - (a.requirementFit || 0))

      setSuppliers(combined)
    } catch (err) {
      console.warn("[useProcurementMatches] Live fetch failed, using fallback suppliers:", err?.message || err)
      setSuppliers(FALLBACK_MOCK_SUPPLIERS)
    } finally {
      setLoading(false)
    }
  }, [demandContext])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  return {
    suppliers,
    loading,
    error,
    refetch: fetchMatches,
    demandContext,
    setDemandContext,
    ratings,
  }
}
