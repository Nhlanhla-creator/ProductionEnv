"use client"

/* ════════════════════════════════════════════════════════════════════════════
   supplierMatching.js

   Everything score-related for supplier matches: the structured (primary)
   score, the preference-only score, the AI (secondary) score runner, and the
   eligibility rules that decide which supplier profiles are worth sending to
   the model.

   This used to live inside supplier-table.jsx, which is why that file was
   ~2,600 lines and nobody wanted to touch it. supplier-table re-exports
   everything here, so existing imports like

     import { calculateEnhancedMatchScore } from "./supplier-table"

   keep working unchanged.
   ════════════════════════════════════════════════════════════════════════ */

import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { getFunctions, httpsCallable } from "firebase/functions"
import { db } from "../../firebaseConfig"
import { expandSearchTerms } from "../../utils/synonyms"

export const AI_SUPPLIER_ANALYSIS_LIMIT = 100

/* ─── Weights ───────────────────────────────────────────────────────────── */

export const ENHANCED_MATCHING_CRITERIA = {
  CATEGORY_MATCH: { weight: 0.4, description: "Product/Service Category Alignment" },
  BBBEE_LEVEL: { weight: 0.1, description: "B-BBEE Level Compliance" },
  LOCATION: { weight: 0.1, description: "Geographic Location Match" },
  DELIVERY_MODE: { weight: 0.1, description: "Delivery Mode Compatibility" },
  BUDGET_RANGE: { weight: 0.1, description: "Budget Fit" },
  OWNERSHIP_PREFS: { weight: 0.05, description: "Ownership Preferences Match" },
  URGENCY_LEAD_TIME: { weight: 0.05, description: "Urgency & Lead Time Match" },
  EXPERIENCE: { weight: 0.05, description: "Sector Experience Match" },
  RATING: { weight: 0.05, description: "Supplier Rating" },
}

export const PREFERENCE_WEIGHTS = {
  BBBEE_LEVEL: { weight: 0.15, label: "B-BBEE Level Compliance" },
  LOCATION: { weight: 0.15, label: "Geographic Location Match" },
  DELIVERY_MODE: { weight: 0.15, label: "Delivery Mode Compatibility" },
  BUDGET_RANGE: { weight: 0.2, label: "Budget Fit" },
  OWNERSHIP_PREFS: { weight: 0.1, label: "Ownership Preferences Match" },
  RATING: { weight: 0.1, label: "Supplier Rating" },
  EXPERIENCE: { weight: 0.1, label: "Sector Experience" },
  URGENCY_LEAD_TIME: { weight: 0.05, label: "Urgency & Lead Time" },
}

/* ─── Small helpers ─────────────────────────────────────────────────────── */

const toArr = (v) => (Array.isArray(v) ? v : v ? [v] : [])

export const getFirstCategory = (productsServices) => {
  if (!productsServices) return "Not specified"

  const first = (list) => {
    if (!Array.isArray(list) || list.length === 0) return null
    const entry = list[0]
    return typeof entry === "string" ? entry : entry?.name || entry?.category || null
  }

  return (
    first(productsServices.productCategories) ||
    first(productsServices.serviceCategories) ||
    first(productsServices.categories) ||
    "Not specified"
  )
}

export const countCategories = (productsServices = {}) =>
  toArr(productsServices.productCategories).length +
  toArr(productsServices.serviceCategories).length +
  toArr(productsServices.categories).length

export function extractSupplierDescriptiveText(supplier) {
  let text = ""

  toArr(supplier?.productsServices?.productCategories).forEach((category) => {
    if (typeof category === "string") {
      text += ` ${category} `
      return
    }
    text += ` ${category?.name || ""} `
    toArr(category?.products).forEach((product) => {
      text += ` ${product?.name || ""} ${product?.description || ""} `
    })
  })

  toArr(supplier?.productsServices?.serviceCategories).forEach((category) => {
    if (typeof category === "string") {
      text += ` ${category} `
      return
    }
    text += ` ${category?.name || ""} `
    toArr(category?.services).forEach((service) => {
      text += ` ${service?.name || ""} ${service?.description || ""} `
    })
  })

  text += ` ${supplier?.productsServices?.targetMarket || ""} `

  return text.toLowerCase().trim()
}

/* ─── Ownership ─────────────────────────────────────────────────────────── */

export function calculateOwnershipPercentages(ownershipManagement = {}) {
  const result = {
    blackOwnership: 0,
    womenOwnership: 0,
    youthOwnership: 0,
    disabilityOwnership: 0,
    totalShares: 0,
  }

  toArr(ownershipManagement.shareholders).forEach((shareholder) => {
    const shareholding = Number.parseInt(shareholder?.shareholding || "0", 10) || 0
    result.totalShares += shareholding

    if ((shareholder?.race || "").toLowerCase() === "black") result.blackOwnership += shareholding
    if ((shareholder?.gender || "").toLowerCase() === "female") result.womenOwnership += shareholding
    if (shareholder?.isYouth === true) result.youthOwnership += shareholding
    if (shareholder?.isDisabled === true) result.disabilityOwnership += shareholding
  })

  if (result.totalShares > 0) {
    result.blackOwnership = (result.blackOwnership / result.totalShares) * 100
    result.womenOwnership = (result.womenOwnership / result.totalShares) * 100
    result.youthOwnership = (result.youthOwnership / result.totalShares) * 100
    result.disabilityOwnership = (result.disabilityOwnership / result.totalShares) * 100
  }

  return result
}

/* ─── Individual criteria (all return 0–1) ──────────────────────────────── */

export function calculateCategoryMatch(application, supplier) {
  const appCategories = (
    application?.productsServices?.categories ||
    application?.requestOverview?.categories ||
    application?.productsServices?.productCategories ||
    []
  )
    .map((c) => (typeof c === "string" ? c : c?.name || "").toLowerCase().trim())
    .filter(Boolean)

  const appKeywords = (application?.requestOverview?.keywords || "").toLowerCase()
  const appPurpose = (application?.requestOverview?.purpose || "").toLowerCase()

  const supplierText = extractSupplierDescriptiveText(supplier)

  if (!supplierText) return { score: 0, matches: [], unmatched: appCategories, keywordMatches: [] }
  if (appCategories.length === 0 && !appKeywords && !appPurpose) {
    return { score: 0, matches: [], unmatched: [], keywordMatches: [] }
  }

  const matchedCategories = []
  const unmatchedCategories = []

  appCategories.forEach((appCat) => {
    const expanded = expandSearchTerms([appCat])
    if (expanded.some((term) => supplierText.includes(term))) matchedCategories.push(appCat)
    else unmatchedCategories.push(appCat)
  })

  const categoryScore = appCategories.length > 0 ? matchedCategories.length / appCategories.length : 0

  let keywordScore = 0
  const matchedKeywords = []
  if (appKeywords || appPurpose) {
    const words = `${appKeywords} ${appPurpose}`.split(/\s+/).filter((w) => w.length > 3)
    let hits = 0
    words.forEach((word) => {
      if (expandSearchTerms([word]).some((term) => supplierText.includes(term))) {
        hits += 1
        matchedKeywords.push(word)
      }
    })
    keywordScore = words.length > 0 ? hits / words.length : 0
  }

  const finalScore = appCategories.length > 0 ? categoryScore * 0.7 + keywordScore * 0.3 : keywordScore

  return {
    score: Math.min(finalScore, 1),
    matches: matchedCategories,
    unmatched: unmatchedCategories,
    keywordMatches: matchedKeywords,
  }
}

export function calculateLocationMatch(application, supplier) {
  const appLocation =
    application?.matchingPreferences?.location || application?.requestOverview?.location || ""
  if (!appLocation) return 1
  const supplierLocation = supplier?.entityOverview?.location || ""
  if (!supplierLocation) return 0
  return appLocation.toLowerCase().trim() === supplierLocation.toLowerCase().trim() ? 1 : 0
}

export function calculateDeliveryMatch(application, supplier) {
  const appModes =
    application?.matchingPreferences?.deliveryModes || application?.requestOverview?.deliveryModes || []
  if (!appModes.length) return 1
  const supplierModes = supplier?.productsServices?.deliveryModes || []
  if (!supplierModes.length) return 0
  if (appModes.includes("Hybrid") || supplierModes.includes("Hybrid")) return 1
  return appModes.some((m) => supplierModes.includes(m)) ? 1 : 0
}

/** "R 1,000,000" → 1000000. Handles numbers as well as formatted strings. */
export function parseBudgetValue(formattedValue) {
  if (formattedValue === null || formattedValue === undefined) return 0
  const numeric = String(formattedValue).replace(/[^\d.]/g, "")
  return Number.parseFloat(numeric) || 0
}

export function calculateBudgetMatch(application, supplier) {
  const minRaw = application?.matchingPreferences?.minBudget || application?.requestOverview?.minBudget || ""
  const maxRaw = application?.matchingPreferences?.maxBudget || application?.requestOverview?.maxBudget || ""
  if (!minRaw && !maxRaw) return 1

  const appMin = parseBudgetValue(minRaw)
  const appMax = parseBudgetValue(maxRaw) || Number.POSITIVE_INFINITY
  const revenue = parseBudgetValue(supplier?.financialOverview?.annualRevenue)
  if (revenue === 0) return 0

  return revenue >= appMin && revenue <= appMax ? 1 : 0
}

export function calculateBBBEEEMatch(application, supplier) {
  const pref = application?.matchingPreferences?.bbeeLevel || ""
  if (!pref || pref === "None" || pref === "Any") return 1

  const appLevel = Number.parseInt(pref.replace(/\D/g, "") || "0", 10) || 0
  if (appLevel === 0) return 1

  const supplierLevel =
    Number.parseInt((supplier?.legalCompliance?.bbbeeLevel || "").replace(/\D/g, "") || "0", 10) || 0
  if (supplierLevel === 0) return 0

  // Lower level number is better — Level 1 beats Level 4.
  return supplierLevel <= appLevel ? 1 : 0
}

export function calculateOwnershipMatch(application, supplier) {
  const prefs = toArr(application?.matchingPreferences?.ownershipPrefs).filter((p) => p && p !== "None")
  if (!prefs.length) return 1

  const own = calculateOwnershipPercentages(supplier?.ownershipManagement || {})

  return prefs.some((pref) => {
    const p = pref.toLowerCase().trim()
    if ((p.includes("black-owned") || p.includes("black owned")) && own.blackOwnership >= 51) return true
    if ((p.includes("women-owned") || p.includes("women owned")) && own.womenOwnership >= 30) return true
    if ((p.includes("youth-owned") || p.includes("youth owned")) && own.youthOwnership >= 25) return true
    if ((p.includes("disability") || p.includes("disabled")) && own.disabilityOwnership >= 5) return true
    return false
  })
    ? 1
    : 0
}

export function calculateRatingMatch(supplier, ratingsData) {
  const info = ratingsData?.[supplier?.id] || { average: 0, count: 0 }
  return (info.average || 0) / 5
}

/* Sector experience and lead time have no structured field on either side yet.
   The old version hard-coded both to 0.5, which handed every supplier a free
   5% regardless of the request — the same free-points bug the advisor table
   had on compensation. They now behave like every other criterion: no stated
   preference scores full, a stated preference we cannot yet evaluate scores
   half, and the reason is shown in the breakdown. */
export function calculateExperienceMatch(application) {
  return application?.matchingPreferences?.sectorExperience ? 0.5 : 1
}

export function calculateUrgencyMatch(application, supplier) {
  const required = application?.applicationOverview?.urgency || application?.requestOverview?.urgency || ""
  if (!required) return 1
  const offered = supplier?.productsServices?.leadTime || supplier?.applicationOverview?.urgency || ""
  return offered ? 0.5 : 0
}

/* ─── Primary (structured) score ────────────────────────────────────────── */

export function calculateEnhancedMatchScore(application, supplier, ratingsData = null) {
  if (!application || !supplier) return { totalScore: 0, breakdown: {} }

  let totalScore = 0
  const breakdown = {}

  const add = (key, criteria, rawScore, extra = {}) => {
    const contribution = rawScore * criteria.weight * 100
    totalScore += contribution
    breakdown[key] = {
      score: Math.round(rawScore * 100),
      weight: criteria.weight * 100,
      contribution: Math.round(contribution),
      description: criteria.description,
      ...extra,
    }
  }

  const category = calculateCategoryMatch(application, supplier)
  add("categoryMatch", ENHANCED_MATCHING_CRITERIA.CATEGORY_MATCH, category.score, {
    matches: category.matches,
    unmatched: category.unmatched,
  })

  add("bbbeeMatch", ENHANCED_MATCHING_CRITERIA.BBBEE_LEVEL, calculateBBBEEEMatch(application, supplier))
  add("locationMatch", ENHANCED_MATCHING_CRITERIA.LOCATION, calculateLocationMatch(application, supplier))
  add("deliveryMatch", ENHANCED_MATCHING_CRITERIA.DELIVERY_MODE, calculateDeliveryMatch(application, supplier))
  add("budgetMatch", ENHANCED_MATCHING_CRITERIA.BUDGET_RANGE, calculateBudgetMatch(application, supplier))
  add("ownershipMatch", ENHANCED_MATCHING_CRITERIA.OWNERSHIP_PREFS, calculateOwnershipMatch(application, supplier))
  add("ratingMatch", ENHANCED_MATCHING_CRITERIA.RATING, calculateRatingMatch(supplier, ratingsData))
  add("experienceMatch", ENHANCED_MATCHING_CRITERIA.EXPERIENCE, calculateExperienceMatch(application))
  add(
    "urgencyLeadTimeMatch",
    ENHANCED_MATCHING_CRITERIA.URGENCY_LEAD_TIME,
    calculateUrgencyMatch(application, supplier),
  )

  return { totalScore: Math.round(totalScore), breakdown }
}

/* ─── Preference-only score (secondary, excludes category alignment) ────── */

export function calculatePreferenceScore(application, supplier, ratingsData = null) {
  if (!application || !supplier) return { totalScore: 0, breakdown: {} }

  let totalScore = 0
  const breakdown = {}

  const add = (key, config, rawScore, appValue, supplierValue) => {
    const contribution = rawScore * config.weight * 100
    totalScore += contribution
    breakdown[key] = {
      score: Math.round(rawScore * 100),
      weight: config.weight,
      contribution: Math.round(contribution),
      label: config.label,
      appValue,
      supplierValue,
    }
  }

  const bbbeePref = application.matchingPreferences?.bbeeLevel || ""
  add(
    "bbbee",
    PREFERENCE_WEIGHTS.BBBEE_LEVEL,
    calculateBBBEEEMatch(application, supplier),
    bbbeePref && bbbeePref !== "None" && bbbeePref !== "Any" ? bbbeePref : "No preference",
    supplier.legalCompliance?.bbbeeLevel || "Not specified",
  )

  const locationPref = application.matchingPreferences?.location || application.requestOverview?.location || ""
  add(
    "location",
    PREFERENCE_WEIGHTS.LOCATION,
    calculateLocationMatch(application, supplier),
    locationPref || "No preference",
    supplier.entityOverview?.location || "Not specified",
  )

  const deliveryPref = toArr(
    application.matchingPreferences?.deliveryModes || application.requestOverview?.deliveryModes,
  )
  add(
    "delivery",
    PREFERENCE_WEIGHTS.DELIVERY_MODE,
    calculateDeliveryMatch(application, supplier),
    deliveryPref.length ? deliveryPref.join(", ") : "No preference",
    toArr(supplier.productsServices?.deliveryModes).join(", ") || "Not specified",
  )

  const minB = application.matchingPreferences?.minBudget || application.requestOverview?.minBudget || ""
  const maxB = application.matchingPreferences?.maxBudget || application.requestOverview?.maxBudget || ""
  add(
    "budget",
    PREFERENCE_WEIGHTS.BUDGET_RANGE,
    calculateBudgetMatch(application, supplier),
    minB || maxB ? `${minB || "0"} – ${maxB || "no ceiling"}` : "No preference",
    supplier.financialOverview?.annualRevenue || "Not disclosed",
  )

  const ownershipPrefs = toArr(application.matchingPreferences?.ownershipPrefs).filter((p) => p && p !== "None")
  const own = calculateOwnershipPercentages(supplier.ownershipManagement || {})
  add(
    "ownership",
    PREFERENCE_WEIGHTS.OWNERSHIP_PREFS,
    calculateOwnershipMatch(application, supplier),
    ownershipPrefs.length ? ownershipPrefs.join(", ") : "No preference",
    own.totalShares > 0
      ? `${Math.round(own.blackOwnership)}% Black, ${Math.round(own.womenOwnership)}% women`
      : "No shareholder data",
  )

  const ratingInfo = ratingsData?.[supplier.id] || { average: 0, count: 0 }
  add(
    "rating",
    PREFERENCE_WEIGHTS.RATING,
    calculateRatingMatch(supplier, ratingsData),
    "Platform rating",
    ratingInfo.count > 0
      ? `${ratingInfo.average.toFixed(1)}/5 from ${ratingInfo.count} review${ratingInfo.count === 1 ? "" : "s"}`
      : "No reviews yet",
  )

  const sectorExp = application.matchingPreferences?.sectorExperience || ""
  add(
    "experience",
    PREFERENCE_WEIGHTS.EXPERIENCE,
    calculateExperienceMatch(application),
    sectorExp || "No preference",
    sectorExp ? "Cannot be evaluated from the profile yet" : "No requirement set",
  )

  add(
    "urgency",
    PREFERENCE_WEIGHTS.URGENCY_LEAD_TIME,
    calculateUrgencyMatch(application, supplier),
    application.applicationOverview?.urgency || "Any",
    supplier.productsServices?.leadTime || "Not specified",
  )

  return { totalScore: Math.round(totalScore), breakdown }
}

/* ─── Combined score ────────────────────────────────────────────────────── */

/** 60% AI semantic, 40% structured. Returns null when there is no AI score. */
export function calculateCombinedMatchScore(primaryScore, aiScore) {
  if (aiScore === null || aiScore === undefined) return null
  return Math.round(aiScore * 0.6 + (primaryScore || 0) * 0.4)
}

/** The single number the Match % column shows: combined where AI has run,
    structured otherwise. Used for display, filtering and sorting alike. */
export function getEffectiveMatchScore(supplier) {
  const primary = supplier?.primaryMatchPercentage ?? supplier?.matchPercentage ?? 0
  const combined = calculateCombinedMatchScore(primary, supplier?.aiMatchPercentage)
  return combined === null ? primary : combined
}

/* ─── AI eligibility ────────────────────────────────────────────────────── */

export function hasSupplierCategoryData(productsServices = {}) {
  return [
    productsServices.productCategories,
    productsServices.serviceCategories,
    productsServices.categories,
  ].some((categories) => Array.isArray(categories) && categories.length > 0)
}

export function getSupplierAiEligibility(supplier, currentUserId = null) {
  const completed = supplier?.completedSections || {}
  const hasName = !!(supplier?.entityOverview?.tradingName || supplier?.entityOverview?.registeredName)
  const hasCategories = hasSupplierCategoryData(supplier?.productsServices || {})

  const reasons = []
  if (currentUserId && supplier?.id === currentUserId) reasons.push("This is your own profile")
  if (completed.entityOverview !== true) reasons.push("Entity Overview incomplete")
  if (completed.productsServices !== true) reasons.push("Products & Services incomplete")
  if (!hasName) reasons.push("Supplier name missing")
  if (!hasCategories) reasons.push("No product or service categories")

  return {
    eligible: reasons.length === 0,
    reasons,
    label: reasons.length > 0 ? reasons.join("; ") : "AI eligible",
  }
}

export function withSupplierAiEligibility(supplier, currentUserId = null) {
  return { ...supplier, aiEligibility: getSupplierAiEligibility(supplier, currentUserId) }
}

export function selectSuppliersForAiAnalysis(suppliers, currentUserId = null) {
  return suppliers
    .map((supplier) => withSupplierAiEligibility(supplier, currentUserId))
    .filter((supplier) => supplier.aiEligibility.eligible)
    .sort((a, b) => getEffectiveMatchScore(b) - getEffectiveMatchScore(a))
    .slice(0, AI_SUPPLIER_ANALYSIS_LIMIT)
}

/* ─── Cloud Function call ───────────────────────────────────────────────── */

export async function analyzeSupplierMatchesWithFallback(payload) {
  const functions = getFunctions()
  const analyzeSupplierMatches = httpsCallable(functions, "analyzeSupplierMatches")
  const result = await analyzeSupplierMatches(payload)
  // httpsCallable already unwraps the HTTP envelope into result.data. The old
  // in-component copy then did `const { matches } = result.data` on the
  // already-unwrapped object, so every manual run threw before saving.
  return result.data
}

export async function runAiAnalysisForApplication(application, suppliers, { onProgress, currentUserId } = {}) {
  if (!application?.id) throw new Error("An application with an id is required")
  if (!suppliers?.length) throw new Error("No suppliers to analyse")

  const applicationId = application.id

  const customerPurpose =
    application.requestOverview?.purpose || application.purpose || "General business procurement needs"

  const productCategories =
    application.requestOverview?.productCategories ||
    application.productsServices?.productCategories ||
    application.requestOverview?.categories ||
    application.productsServices?.categories ||
    []

  const serviceCategories =
    application.requestOverview?.serviceCategories || application.productsServices?.serviceCategories || []

  const eligible = selectSuppliersForAiAnalysis(suppliers, currentUserId)
  if (eligible.length === 0) {
    throw new Error(
      "No AI-eligible suppliers. A profile needs a completed Entity Overview and Products & Services section, a name, and at least one category.",
    )
  }

  const payloadSuppliers = eligible.map((s) => ({
    id: s.id,
    entityOverview: s.entityOverview || {},
    productsServices: s.productsServices || {},
  }))

  if (onProgress) onProgress({ current: 0, total: payloadSuppliers.length })

  const { matches = [], missingSupplierIds = [] } = await analyzeSupplierMatchesWithFallback({
    suppliers: payloadSuppliers,
    customerPurpose,
    applicationId,
    productCategories,
    serviceCategories,
    analyzeAll: true,
    maxSuppliers: payloadSuppliers.length,
  })

  const processed = {}
  matches.forEach((match) => {
    processed[match.supplierId] = {
      score: Math.round((match.score / 5) * 100),
      reasoning: match.reasoning || "No reasoning provided.",
      capabilities: match.matchedCapabilities || [],
      breakdown: match.breakdown || null,
      analyzedAt: new Date().toISOString(),
    }
  })

  missingSupplierIds.forEach((id) => {
    if (!processed[id]) {
      processed[id] = {
        score: 0,
        reasoning: "The model did not return a result for this supplier.",
        capabilities: [],
        breakdown: null,
        analyzedAt: new Date().toISOString(),
      }
    }
  })

  if (onProgress) onProgress({ current: Object.keys(processed).length, total: payloadSuppliers.length })

  await setDoc(doc(db, "aiSecondaryMatches", applicationId), {
    suppliers: processed,
    requestPurpose: customerPurpose,
    analyzedAt: serverTimestamp(),
    suppliersAnalyzed: Object.keys(processed).length,
    applicationId,
  })

  return {
    processed,
    eligibleCount: eligible.length,
    ineligibleCount: suppliers.length - eligible.length,
    analyzedCount: Object.keys(processed).length,
  }
}