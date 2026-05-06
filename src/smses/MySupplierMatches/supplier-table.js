"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { getAuth } from "firebase/auth"
import {
  addDoc,
  collection,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  serverTimestamp,
  setDoc,
  arrayUnion
} from "firebase/firestore"
import { db } from "../../firebaseConfig"
import {
  Eye,
  Filter,
  History,
  Brain,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Users,
  X
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useLocation } from "react-router-dom";
import emailjs from '@emailjs/browser'
import { API_KEYS } from "../../API"
import SupplierDetailsModal from './SupplierDetailsModal'
import { findSynonyms, expandSearchTerms, containsTermOrSynonyms } from '../../utils/synonyms'
import { getFunctions, httpsCallable } from "firebase/functions"

// Status definitions with brown color scheme
const STATUS_TYPES = {
  Pending: {
    color: "#F5EBE0",
    textColor: "#5D2A0A",
  },
  Shortlisted: {
    color: "#E8D5C4",
    textColor: "#4E342E",
  },
  "Proposal/Quote": {
    color: "#E8D5C4",
    textColor: "#543c36ff",
  },
  Accepted: {
    color: "#E8F5E8",
    textColor: "#388E3C",
  },
  Rejected: {
    color: "#FFEBEE",
    textColor: "#D32F2F",
  },
  "New Lead": {
    color: "#F5EBE0",
    textColor: "#5D2A0A",
  },
}

const STAGE_COLORS = {
  "Potential Supplier": { backgroundColor: "#E3F2FD", color: "#1976D2" },
  "Contact Initiated": { backgroundColor: "#FFF3E0", color: "#F57C00" },
  "Proposal Sent": { backgroundColor: "#F3E5F5", color: "#7B1FA2" },
  "Under Review": { backgroundColor: "#E8F5E8", color: "#388E3C" },
  Negotiation: { backgroundColor: "#FFF8E1", color: "#F9A825" },
  Accepted: { backgroundColor: "#E8F5E8", color: "#2E7D32" },
  Rejected: { backgroundColor: "#FFEBEE", color: "#D32F2F" },
}

// Enhanced matching criteria with better weights
const ENHANCED_MATCHING_CRITERIA = {
  CATEGORY_MATCH: {
    weight: 0.40,
    description: "Product/Service Category Alignment",
  },
  BBBEE_LEVEL: {
    weight: 0.10,
    description: "BBBEE Level Compliance",
  },
  LOCATION: {
    weight: 0.10,
    description: "Geographic Location Match",
  },
  DELIVERY_MODE: {
    weight: 0.10,
    description: "Delivery Mode Compatibility",
  },
  BUDGET_RANGE: {
    weight: 0.10,
    description: "Budget Fit",
  },
  OWNERSHIP_PREFS: {
    weight: 0.05,
    description: "Ownership Preferences Match",
  },
  URGENCY_LEAD_TIME: {
    weight: 0.05,
    description: "Urgency & Lead Time Match",
  },
  EXPERIENCE: {
    weight: 0.05,
    description: "Sector Experience Match",
  },
  RATING: {
    weight: 0.05,
    description: "Supplier Rating",
  },
}

const TruncatedText = ({ text, maxLength = 20 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span style={{ color: "#999" }}>{text || "-"}</span>
  }

  const shouldTruncate = text.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`

  const toggleExpanded = (e) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div style={{ lineHeight: "1.4" }}>
      <span style={{ wordBreak: "break-word" }}>{displayText}</span>
      {shouldTruncate && (
        <div>
          <button
            style={{
              background: "none",
              border: "none",
              color: "#a67c52",
              cursor: "pointer",
              fontSize: "0.75rem",
              textDecoration: "underline",
              padding: "0",
              display: "block",
            }}
            onClick={toggleExpanded}
          >
            {isExpanded ? "Less" : "See more"}
          </button>
        </div>
      )}
    </div>
  )
}

const getStatusStyle = (status) => {
  return STATUS_TYPES[status] || { color: "#F5F5F5", textColor: "#666666" }
}

const getStageStyle = (stage) => {
  return STAGE_COLORS[stage] || { backgroundColor: "#F5F5F5", color: "#666666" }
}

function getDeliveryModeMatches(appModes, supplyModes) {
  const matches = []

  // Check if either has Hybrid for full compatibility
  const appHasHybrid = appModes.includes("Hybrid")
  const supplyHasHybrid = supplyModes.includes("Hybrid")

  if (appHasHybrid || supplyHasHybrid) {
    matches.push({
      applicationMode: appHasHybrid ? "Hybrid" : appModes[0],
      supplierMode: supplyHasHybrid ? "Hybrid" : supplyModes[0],
      matchType: "hybrid-full-compatibility",
      score: 1,
      note: "Hybrid delivery provides full compatibility with all modes"
    })
  } else {
    // Standard exact matching
    appModes.forEach((appMode) => {
      supplyModes.forEach((supplyMode) => {
        if (appMode === supplyMode) {
          matches.push({
            applicationMode: appMode,
            supplierMode: supplyMode,
            matchType: "exact",
            score: 1,
          })
        }
      })
    })
  }

  return matches
}

export const getFirstCategory = (productsServices) => {
  if (!productsServices) return "Not specified"

  // Check productCategories first
  if (Array.isArray(productsServices.productCategories) && productsServices.productCategories.length > 0) {
    const firstProductCat = productsServices.productCategories[0]
    return typeof firstProductCat === "string" ? firstProductCat : firstProductCat?.name || "Not specified"
  }

  // Check serviceCategories if productCategories is empty
  if (Array.isArray(productsServices.serviceCategories) && productsServices.serviceCategories.length > 0) {
    const firstServiceCat = productsServices.serviceCategories[0]
    return typeof firstServiceCat === "string" ? firstServiceCat : firstServiceCat?.name || "Not specified"
  }

  return "Not specified"
}

function convertToDays(value, unit) {
  const numericValue = parseInt(value) || 0
  switch (unit) {
    case 'hours':
      return numericValue / 24
    case 'days':
      return numericValue
    case 'weeks':
      return numericValue * 7
    case 'months':
      return numericValue * 30 // Approximate
    default:
      return numericValue // Default to days
  }
}

// Enhanced match calculation functions
export function calculateCategoryMatch(application, supplier) {
  const appCategories = (
    application.productsServices?.categories ||
    application.requestOverview?.categories ||
    application.productsServices?.productCategories ||
    []
  ).map(c => (typeof c === 'string' ? c : c?.name || '').toLowerCase().trim())
    .filter(Boolean);

  const appKeywords = application.requestOverview?.keywords?.toLowerCase() || "";
  const appPurpose = application.requestOverview?.purpose?.toLowerCase() || "";

  const supplierText = extractSupplierDescriptiveText(supplier);

  if (!supplierText) return { score: 0, matches: [] };
  if (appCategories.length === 0 && !appKeywords && !appPurpose) return { score: 0, matches: [] };

  const matchedCategories = [];
  const unmatchedCategories = [];

  // Binary match per category — matched or not
  appCategories.forEach(appCat => {
    const expandedTerms = expandSearchTerms([appCat]);
    const hasMatch = expandedTerms.some(term => supplierText.includes(term));
    if (hasMatch) {
      matchedCategories.push(appCat);
    } else {
      unmatchedCategories.push(appCat);
    }
  });

  // Category score: proportion of requested categories matched (0 to 1)
  const categoryScore = appCategories.length > 0
    ? matchedCategories.length / appCategories.length
    : 0;

  // Keyword/purpose secondary signal
  let keywordScore = 0;
  const matchedKeywords = [];
  if (appKeywords || appPurpose) {
    const combinedText = `${appKeywords} ${appPurpose}`;
    const words = combinedText.split(/\s+/).filter(w => w.length > 3);
    let keywordHits = 0;
    words.forEach(word => {
      const expanded = expandSearchTerms([word]);
      const hasMatch = expanded.some(term => supplierText.includes(term));
      if (hasMatch) {
        keywordHits++;
        matchedKeywords.push(word);
      }
    });
    keywordScore = words.length > 0 ? keywordHits / words.length : 0;
  }

  const finalScore = appCategories.length > 0
    ? (categoryScore * 0.7) + (keywordScore * 0.3)
    : keywordScore;

  return {
    score: Math.min(finalScore, 1),
    matches: matchedCategories,
    unmatched: unmatchedCategories,
    keywordMatches: matchedKeywords,
  };
}

function calculateLocationMatch(application, supplier) {
  const appLocation =
    application.matchingPreferences?.location ||
    application.requestOverview?.location || "";
  const supplierLocation = supplier.entityOverview?.location || "";

  if (!appLocation) return 0.5; // No preference = neutral
  if (!supplierLocation) return 0;

  const normalizedApp = appLocation.toLowerCase().trim();
  const normalizedSupplier = supplierLocation.toLowerCase().trim();

  if (normalizedApp === normalizedSupplier) return 1;
  // Partial match (e.g. "Johannesburg" within "Johannesburg, Gauteng")
  if (normalizedSupplier.includes(normalizedApp) || normalizedApp.includes(normalizedSupplier)) return 0.7;
  return 0;
}

function calculateDeliveryMatch(application, supplier) {
  const appModes =
    application.matchingPreferences?.deliveryModes ||
    application.requestOverview?.deliveryModes || [];
  const supplierModes = supplier.productsServices?.deliveryModes || [];

  if (appModes.length === 0) return 0.5; // No preference = neutral
  if (supplierModes.length === 0) return 0;

  const appHasHybrid = appModes.includes("Hybrid");
  const supplyHasHybrid = supplierModes.includes("Hybrid");
  if (appHasHybrid || supplyHasHybrid) return 1;

  // Count how many required modes the supplier supports
  const matchedModes = appModes.filter(appMode => supplierModes.includes(appMode));

  // All modes match = full score, partial = proportional, none = 0
  return matchedModes.length / appModes.length;
}

function calculateBudgetMatch(application, supplier) {
  // FIX: budget fields are saved under matchingPreferences
  const minBudgetRaw =
    application.matchingPreferences?.minBudget ||
    application.requestOverview?.minBudget ||
    "0";
  const maxBudgetRaw =
    application.matchingPreferences?.maxBudget ||
    application.requestOverview?.maxBudget ||
    "0";

  const appBudgetMin = parseInt(minBudgetRaw.replace(/\D/g, "")) || 0;
  const appBudgetMax = parseInt(maxBudgetRaw.replace(/\D/g, "")) || 1000000;
  const revenue = parseInt((supplier.financialOverview?.annualRevenue || "0").replace(/\D/g, "")) || 0;

  if (revenue === 0) return 0.5;
  if (revenue >= appBudgetMin && revenue <= appBudgetMax) return 1;
  if (revenue >= appBudgetMin * 0.5 && revenue <= appBudgetMax * 1.5) return 0.7;
  return 0.3;
}

function calculateBBBEEEMatch(application, supplier) {
  const bbeePreference =
    application.matchingPreferences?.bbeeLevel || "0";

  const appBBBEEPref = parseInt(bbeePreference.replace(/\D/g, "") || "0") || 0;
  const bbbeeLevel = parseInt(supplier.legalCompliance?.bbbeeLevel || "0") || 0;

  // If no preference specified, neutral score
  if (appBBBEEPref === 0) return 0.5;

  // Binary: meets requirement or doesn't
  // Lower level number = better (Level 1 is best)
  if (bbbeeLevel <= appBBBEEPref) return 1;      // Meets or exceeds requirement
  if (bbbeeLevel === appBBBEEPref + 1) return 0.5; // One level off
  return 0;                                         // Does not meet requirement
}

function calculateOwnershipMatch(application, supplier) {
  const appOwnershipPrefs = application.matchingPreferences?.ownershipPrefs || []
  let ownershipScore = 0.5

  if (appOwnershipPrefs.length > 0) {
    const ownershipDetails = calculateOwnershipPercentages(supplier.ownershipManagement || {})

    appOwnershipPrefs.forEach((pref) => {
      const normalizedPref = pref.toLowerCase().trim()
      if ((normalizedPref.includes("black-owned") || normalizedPref.includes("black owned")) &&
        ownershipDetails.blackOwnership >= 51) {
        ownershipScore += 0.4
      } else if ((normalizedPref.includes("women-owned") || normalizedPref.includes("women owned")) &&
        ownershipDetails.womenOwnership >= 30) {
        ownershipScore += 0.3
      } else if ((normalizedPref.includes("youth-owned") || normalizedPref.includes("youth owned")) &&
        ownershipDetails.youthOwnership >= 25) {
        ownershipScore += 0.2
      } else if ((normalizedPref.includes("disability") || normalizedPref.includes("disabled")) &&
        ownershipDetails.disabilityOwnership >= 5) {
        ownershipScore += 0.1
      }
    })
    ownershipScore = Math.min(ownershipScore, 1)
  }

  return ownershipScore
}

function calculateRatingMatch(supplier, ratingsData) {
  const supplierId = supplier?.id
  const supplierRatingData = ratingsData?.[supplierId] || { average: 0, count: 0 }
  return supplierRatingData.average / 5
}

export function extractSupplierDescriptiveText(supplier) {
  let text = "";

  // Product descriptions
  if (supplier.productsServices?.productCategories) {
    supplier.productsServices.productCategories.forEach(category => {
      text += ` ${category.name || ""} `;
      if (category.products) {
        category.products.forEach(product => {
          text += ` ${product.name || ""} ${product.description || ""} `;
        });
      }
    });
  }

  // Service descriptions
  if (supplier.productsServices?.serviceCategories) {
    supplier.productsServices.serviceCategories.forEach(category => {
      text += ` ${category.name || ""} `;
      if (category.services) {
        category.services.forEach(service => {
          text += ` ${service.name || ""} ${service.description || ""} `;
        });
      }
    });
  }

  // Target market and other relevant fields
  text += ` ${supplier.productsServices?.targetMarket || ""} `;

  return text.toLowerCase().trim();
}

export function calculateEnhancedMatchScore(application, supplier, ratingsData = null) {
  if (!application || !supplier) {
    return { totalScore: 0, breakdown: {} }
  }

  let totalScore = 0
  const breakdown = {}

  // Category Match (40%)
  const categoryMatch = calculateCategoryMatch(application, supplier)
  const categoryContribution = categoryMatch.score * ENHANCED_MATCHING_CRITERIA.CATEGORY_MATCH.weight * 100
  totalScore += categoryContribution
  breakdown.categoryMatch = {
    score: Math.round(categoryMatch.score * 100),
    weight: ENHANCED_MATCHING_CRITERIA.CATEGORY_MATCH.weight * 100,
    contribution: Math.round(categoryContribution),
    description: ENHANCED_MATCHING_CRITERIA.CATEGORY_MATCH.description,
    matches: categoryMatch.matches
  }

  // BBBEE Match (10%)
  const bbbeeScore = calculateBBBEEEMatch(application, supplier)
  const bbbeeContribution = bbbeeScore * ENHANCED_MATCHING_CRITERIA.BBBEE_LEVEL.weight * 100
  totalScore += bbbeeContribution
  breakdown.bbbeeMatch = {
    score: Math.round(bbbeeScore * 100),
    weight: ENHANCED_MATCHING_CRITERIA.BBBEE_LEVEL.weight * 100,
    contribution: Math.round(bbbeeContribution),
    description: ENHANCED_MATCHING_CRITERIA.BBBEE_LEVEL.description,
  }

  // Location Match (10%)
  const locationScore = calculateLocationMatch(application, supplier)
  const locationContribution = locationScore * ENHANCED_MATCHING_CRITERIA.LOCATION.weight * 100
  totalScore += locationContribution
  breakdown.locationMatch = {
    score: Math.round(locationScore * 100),
    weight: ENHANCED_MATCHING_CRITERIA.LOCATION.weight * 100,
    contribution: Math.round(locationContribution),
    description: ENHANCED_MATCHING_CRITERIA.LOCATION.description,
  }

  // Delivery Match (10%)
  const deliveryScore = calculateDeliveryMatch(application, supplier)
  const deliveryContribution = deliveryScore * ENHANCED_MATCHING_CRITERIA.DELIVERY_MODE.weight * 100
  totalScore += deliveryContribution
  breakdown.deliveryMatch = {
    score: Math.round(deliveryScore * 100),
    weight: ENHANCED_MATCHING_CRITERIA.DELIVERY_MODE.weight * 100,
    contribution: Math.round(deliveryContribution),
    description: ENHANCED_MATCHING_CRITERIA.DELIVERY_MODE.description,
  }

  // Budget Match (10%)
  const budgetScore = calculateBudgetMatch(application, supplier)
  const budgetContribution = budgetScore * ENHANCED_MATCHING_CRITERIA.BUDGET_RANGE.weight * 100
  totalScore += budgetContribution
  breakdown.budgetMatch = {
    score: Math.round(budgetScore * 100),
    weight: ENHANCED_MATCHING_CRITERIA.BUDGET_RANGE.weight * 100,
    contribution: Math.round(budgetContribution),
    description: ENHANCED_MATCHING_CRITERIA.BUDGET_RANGE.description,
  }

  // Ownership Preferences (5%)
  const ownershipScore = calculateOwnershipMatch(application, supplier)
  const ownershipContribution = ownershipScore * ENHANCED_MATCHING_CRITERIA.OWNERSHIP_PREFS.weight * 100
  totalScore += ownershipContribution
  breakdown.ownershipMatch = {
    score: Math.round(ownershipScore * 100),
    weight: ENHANCED_MATCHING_CRITERIA.OWNERSHIP_PREFS.weight * 100,
    contribution: Math.round(ownershipContribution),
    description: ENHANCED_MATCHING_CRITERIA.OWNERSHIP_PREFS.description,
  }

  // Rating Match (5%)
  const ratingScore = calculateRatingMatch(supplier, ratingsData)
  const ratingContribution = ratingScore * ENHANCED_MATCHING_CRITERIA.RATING.weight * 100
  totalScore += ratingContribution
  breakdown.ratingMatch = {
    score: Math.round(ratingScore * 100),
    weight: ENHANCED_MATCHING_CRITERIA.RATING.weight * 100,
    contribution: Math.round(ratingContribution),
    description: ENHANCED_MATCHING_CRITERIA.RATING.description,
  }

  // Experience Match (5%)
  const experienceScore = 0.5
  const experienceContribution = experienceScore * ENHANCED_MATCHING_CRITERIA.EXPERIENCE.weight * 100
  totalScore += experienceContribution
  breakdown.experienceMatch = {
    score: Math.round(experienceScore * 100),
    weight: ENHANCED_MATCHING_CRITERIA.EXPERIENCE.weight * 100,
    contribution: Math.round(experienceContribution),
    description: ENHANCED_MATCHING_CRITERIA.EXPERIENCE.description,
  }

  // Urgency/Lead Time Match (5%)
  const urgencyScore = 0.5
  const urgencyContribution = urgencyScore * ENHANCED_MATCHING_CRITERIA.URGENCY_LEAD_TIME.weight * 100
  totalScore += urgencyContribution
  breakdown.urgencyLeadTimeMatch = {
    score: Math.round(urgencyScore * 100),
    weight: ENHANCED_MATCHING_CRITERIA.URGENCY_LEAD_TIME.weight * 100,
    contribution: Math.round(urgencyContribution),
    description: ENHANCED_MATCHING_CRITERIA.URGENCY_LEAD_TIME.description,
  }

  return {
    totalScore: Math.round(totalScore),
    breakdown,
  }
}

// ── Preference-only score (secondary) ──────────────────────────────────
// SECONDARY matching score: evaluates applicant-specified preferences
// against the supplier profile. Excludes category alignment (handled
// by the AI primary score). Returns 0-100 with per-criterion breakdown.

const PREFERENCE_WEIGHTS = {
  BBBEE_LEVEL:       { weight: 0.15, label: "BBBEE Level Compliance" },
  LOCATION:          { weight: 0.15, label: "Geographic Location Match" },
  DELIVERY_MODE:     { weight: 0.15, label: "Delivery Mode Compatibility" },
  BUDGET_RANGE:      { weight: 0.20, label: "Budget Fit" },
  OWNERSHIP_PREFS:   { weight: 0.10, label: "Ownership Preferences Match" },
  RATING:            { weight: 0.10, label: "Supplier Rating" },
  EXPERIENCE:        { weight: 0.10, label: "Sector Experience" },
  URGENCY_LEAD_TIME: { weight: 0.05, label: "Urgency & Lead Time" },
}

export function calculatePreferenceScore(application, supplier, ratingsData = null) {
  if (!application || !supplier) return { totalScore: 0, breakdown: {} }

  let totalScore = 0
  const breakdown = {}

  // BBBEE Match (15%)
  const bbbeeScore = calculateBBBEEEMatch(application, supplier)
  const bbbeeCont = bbbeeScore * PREFERENCE_WEIGHTS.BBBEE_LEVEL.weight * 100
  totalScore += bbbeeCont
  breakdown.bbbee = {
    score: Math.round(bbbeeScore * 100),
    weight: PREFERENCE_WEIGHTS.BBBEE_LEVEL.weight,
    contribution: Math.round(bbbeeCont),
    label: PREFERENCE_WEIGHTS.BBBEE_LEVEL.label,
    appValue: application.matchingPreferences?.bbeeLevel || "None specified",
    supplierValue: supplier.legalCompliance?.bbbeeLevel || "N/A",
  }

  // Location Match (15%)
  const locationScore = calculateLocationMatch(application, supplier)
  const locationCont = locationScore * PREFERENCE_WEIGHTS.LOCATION.weight * 100
  totalScore += locationCont
  breakdown.location = {
    score: Math.round(locationScore * 100),
    weight: PREFERENCE_WEIGHTS.LOCATION.weight,
    contribution: Math.round(locationCont),
    label: PREFERENCE_WEIGHTS.LOCATION.label,
    appValue: application.matchingPreferences?.location || application.requestOverview?.location || "Any",
    supplierValue: supplier.entityOverview?.location || "Not specified",
  }

  // Delivery Mode (15%)
  const deliveryScore = calculateDeliveryMatch(application, supplier)
  const deliveryCont = deliveryScore * PREFERENCE_WEIGHTS.DELIVERY_MODE.weight * 100
  totalScore += deliveryCont
  breakdown.delivery = {
    score: Math.round(deliveryScore * 100),
    weight: PREFERENCE_WEIGHTS.DELIVERY_MODE.weight,
    contribution: Math.round(deliveryCont),
    label: PREFERENCE_WEIGHTS.DELIVERY_MODE.label,
    appValue: (application.matchingPreferences?.deliveryModes || application.requestOverview?.deliveryModes || []).join(", ") || "Any",
    supplierValue: (supplier.productsServices?.deliveryModes || []).join(", ") || "Not specified",
  }

  // Budget Range (20%)
  const budgetScore = calculateBudgetMatch(application, supplier)
  const budgetCont = budgetScore * PREFERENCE_WEIGHTS.BUDGET_RANGE.weight * 100
  totalScore += budgetCont
  const minB = application.matchingPreferences?.minBudget || application.requestOverview?.minBudget || "0"
  const maxB = application.matchingPreferences?.maxBudget || application.requestOverview?.maxBudget || "0"
  breakdown.budget = {
    score: Math.round(budgetScore * 100),
    weight: PREFERENCE_WEIGHTS.BUDGET_RANGE.weight,
    contribution: Math.round(budgetCont),
    label: PREFERENCE_WEIGHTS.BUDGET_RANGE.label,
    appValue: `R${minB} – R${maxB}`,
    supplierValue: supplier.financialOverview?.annualRevenue || "Not disclosed",
  }

  // Ownership Prefs (10%)
  const ownershipScore = calculateOwnershipMatch(application, supplier)
  const ownershipCont = ownershipScore * PREFERENCE_WEIGHTS.OWNERSHIP_PREFS.weight * 100
  totalScore += ownershipCont
  breakdown.ownership = {
    score: Math.round(ownershipScore * 100),
    weight: PREFERENCE_WEIGHTS.OWNERSHIP_PREFS.weight,
    contribution: Math.round(ownershipCont),
    label: PREFERENCE_WEIGHTS.OWNERSHIP_PREFS.label,
    appValue: (application.matchingPreferences?.ownershipPrefs || []).join(", ") || "None specified",
    supplierValue: "Evaluated from shareholder data",
  }

  // Rating (10%)
  const ratingScore = calculateRatingMatch(supplier, ratingsData)
  const ratingCont = ratingScore * PREFERENCE_WEIGHTS.RATING.weight * 100
  totalScore += ratingCont
  const ratingInfo = ratingsData?.[supplier.id] || { average: 0, count: 0 }
  breakdown.rating = {
    score: Math.round(ratingScore * 100),
    weight: PREFERENCE_WEIGHTS.RATING.weight,
    contribution: Math.round(ratingCont),
    label: PREFERENCE_WEIGHTS.RATING.label,
    appValue: "Platform rating",
    supplierValue: ratingInfo.count > 0 ? `${ratingInfo.average.toFixed(1)}/5 (${ratingInfo.count} reviews)` : "No reviews yet",
  }

  // Experience (10%) — stub
  const experienceScore = 0.5
  const experienceCont = experienceScore * PREFERENCE_WEIGHTS.EXPERIENCE.weight * 100
  totalScore += experienceCont
  breakdown.experience = {
    score: Math.round(experienceScore * 100),
    weight: PREFERENCE_WEIGHTS.EXPERIENCE.weight,
    contribution: Math.round(experienceCont),
    label: PREFERENCE_WEIGHTS.EXPERIENCE.label,
    appValue: "Any",
    supplierValue: "Not evaluated yet",
  }

  // Urgency / Lead Time (5%) — stub
  const urgencyScorePref = 0.5
  const urgencyContPref = urgencyScorePref * PREFERENCE_WEIGHTS.URGENCY_LEAD_TIME.weight * 100
  totalScore += urgencyContPref
  breakdown.urgency = {
    score: Math.round(urgencyScorePref * 100),
    weight: PREFERENCE_WEIGHTS.URGENCY_LEAD_TIME.weight,
    contribution: Math.round(urgencyContPref),
    label: PREFERENCE_WEIGHTS.URGENCY_LEAD_TIME.label,
    appValue: "Any",
    supplierValue: "Not evaluated yet",
  }

  return { totalScore: Math.round(totalScore), breakdown }
}

// ── Reusable AI analysis runner ────────────────────────────────────────
// Calls the Cloud Function, saves results to Firestore, and returns
// the processed matches map. Can be called from any component.

export async function runAiAnalysisForApplication(application, suppliers, { onProgress } = {}) {
  if (!application || !suppliers?.length) {
    throw new Error("Application and suppliers are required")
  }

  const applicationId = application.id
  if (!applicationId) throw new Error("Application must have an id")

  const customerPurpose =
    application.requestOverview?.purpose ||
    application.purpose ||
    "General business procurement needs"

  // Extract explicit categories from the application for detailed breakdown
  const productCategories =
    application.requestOverview?.productCategories ||
    application.productsServices?.productCategories ||
    application.requestOverview?.categories ||
    application.productsServices?.categories ||
    []

  const serviceCategories =
    application.requestOverview?.serviceCategories ||
    application.productsServices?.serviceCategories ||
    []

  const suppliersForAnalysis = suppliers.map((s) => ({
    id: s.id,
    entityOverview: s.entityOverview || {},
    productsServices: s.productsServices || {},
  }))

  const functions = getFunctions()
  const analyzeSupplierMatches = httpsCallable(functions, "analyzeSupplierMatches")

  if (onProgress) onProgress({ current: 0, total: suppliersForAnalysis.length })

  const result = await analyzeSupplierMatches({
    suppliers: suppliersForAnalysis,
    customerPurpose,
    applicationId,
    productCategories,
    serviceCategories,
    analyzeAll: true,
    maxSuppliers: suppliersForAnalysis.length,
  })

  const { matches, missingSupplierIds = [] } = result.data

  const processedMatches = {}
  matches.forEach((match) => {
    const normalizedScore = Math.round((match.score / 5) * 100)
    processedMatches[match.supplierId] = {
      score: normalizedScore,
      reasoning: match.reasoning || "No reasoning provided",
      capabilities: match.matchedCapabilities || [],
      breakdown: match.breakdown || null,
      analyzedAt: new Date().toISOString(),
    }
  })

  // Mark missing suppliers with a 0 score so they don't stay pending
  missingSupplierIds.forEach((id) => {
    if (!processedMatches[id]) {
      processedMatches[id] = {
        score: 0,
        reasoning: "AI analysis did not return a result for this supplier.",
        capabilities: [],
        breakdown: null,
        analyzedAt: new Date().toISOString(),
      }
    }
  })

  if (onProgress) onProgress({ current: Object.keys(processedMatches).length, total: suppliersForAnalysis.length })

  // Persist to Firestore
  const matchDocRef = doc(db, "aiSecondaryMatches", applicationId)
  await setDoc(matchDocRef, {
    suppliers: processedMatches,
    requestPurpose: customerPurpose,
    analyzedAt: serverTimestamp(),
    suppliersAnalyzed: Object.keys(processedMatches).length,
    applicationId,
  })

  return processedMatches
}

// Helper function to calculate string similarity
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  return (longer.length - editDistance(longer, shorter)) / parseFloat(longer.length)
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase()
  s2 = s2.toLowerCase()

  const costs = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }
  return costs[s2.length]
}

// Helper function to calculate ownership percentages from shareholder data
function calculateOwnershipPercentages(ownershipManagement) {
  const result = {
    blackOwnership: 0,
    womenOwnership: 0,
    youthOwnership: 0,
    disabilityOwnership: 0,
    totalShares: 0,
  }

  const shareholders = Array.isArray(ownershipManagement.shareholders) ? ownershipManagement.shareholders : []

  shareholders.forEach((shareholder) => {
    const shareholding = parseInt(shareholder.shareholding || "0") || 0
    result.totalShares += shareholding

    if (shareholder.race && shareholder.race.toLowerCase() === "black") {
      result.blackOwnership += shareholding
    }
    if (shareholder.gender && shareholder.gender.toLowerCase() === "female") {
      result.womenOwnership += shareholding
    }
    if (shareholder.isYouth === true) {
      result.youthOwnership += shareholding
    }
    if (shareholder.isDisabled === true) {
      result.disabilityOwnership += shareholding
    }
  })

  if (result.totalShares > 0) {
    result.blackOwnership = (result.blackOwnership / result.totalShares) * 100
    result.womenOwnership = (result.womenOwnership / result.totalShares) * 100
    result.youthOwnership = (result.youthOwnership / result.totalShares) * 100
    result.disabilityOwnership = (result.disabilityOwnership / result.totalShares) * 100
  }

  return result
}

const mergeSupplierHistory = (newMatches, contactedHistory) => {
  const supplierMap = new Map();

  // Add contacted suppliers first (priority)
  contactedHistory.forEach(supplier => {
    if (supplier && supplier.id) {
      supplierMap.set(supplier.id, {
        ...supplier,
        isPreviousContact: true,
        previousServiceRequested: supplier.serviceRequired || supplier.originalRequest?.serviceRequested,
        previousContactDate: supplier.lastContacted || supplier.contactDate,
        contactHistory: [{
          date: supplier.lastContacted || supplier.contactDate,
          serviceRequested: supplier.serviceRequired || supplier.originalRequest?.serviceRequested,
          matchScore: supplier.matchPercentage || supplier.matchScore
        }]
      });
    }
  });

  // Add new matches (don't override previous contacts)
  newMatches.forEach(supplier => {
    if (supplier && supplier.id) {
      if (supplierMap.has(supplier.id)) {
        // Update existing supplier (previously contacted)
        const existing = supplierMap.get(supplier.id);
        existing.hasNewMatch = true;
        existing.newMatchScore = supplier.matchPercentage;
        existing.newServiceRequired = supplier.serviceRequired;
      } else {
        // New supplier
        supplierMap.set(supplier.id, {
          ...supplier,
          isPreviousContact: false,
          hasNewMatch: true
        });
      }
    }
  });

  return Array.from(supplierMap.values());
};

const fetchContactedHistory = async (userId) => {
  try {
    if (!userId) return [];

    const userDocRef = doc(db, "userApplications", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      // Flatten all contacted suppliers from all applications
      const allContactedSuppliers = [];

      data.contactedApplications?.forEach(app => {
        if (app.matches && app.contactedSuppliers) {
          app.contactedSuppliers.forEach(supplierId => {
            const supplierMatch = app.matches.find(m => m.id === supplierId);
            if (supplierMatch) {
              allContactedSuppliers.push({
                ...supplierMatch,
                contactDate: app.lastContacted,
                originalApplication: {
                  id: app.id,
                  purpose: app.data?.requestOverview?.purpose
                }
              });
            }
          });
        }
      });

      return allContactedSuppliers;
    }
    return [];
  } catch (error) {
    console.error("Error fetching contacted history:", error);
    return [];
  }
};

export function SupplierTable({ onSupplierContacted, onSuppliersUpdate, onSupplierAccepted, onNewRequest }) {
  const [showFilters, setShowFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState({ type: "", supplier: null })
  const [notification, setNotification] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState([])
  const [supplierRatings, setSupplierRatings] = useState({})
  const [allSuppliers, setAllSuppliers] = useState([])
  const [filteredSuppliers, setFilteredSuppliers] = useState([])
  const [error, setError] = useState(null)
  const [showMatchBreakdown, setShowMatchBreakdown] = useState(false)
  const [matchBreakdownData, setMatchBreakdownData] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [currentUserApplication, setCurrentUserApplication] = useState(null)
  const [filters, setFilters] = useState({
    location: "",
    matchScore: 50,
    minValue: "",
    maxValue: "",
    entityType: "",
    sectors: [],
    bbbeeLevel: "",
    procurementCategories: [],
    availability: "",
    sortBy: "",
  })
  const [tableKey, setTableKey] = useState(0);

  const [showLegend, setShowLegend] = useState(false);
  const [combinedSuppliers, setCombinedSuppliers] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasPreviousContacts, setHasPreviousContacts] = useState(false);



  const [contactedApplications, setContactedApplications] = useState([])
  const [showContactedApplications, setShowContactedApplications] = useState(false)
  const [applicationsWithContacts, setApplicationsWithContacts] = useState(new Set())

  // NEW STATE FOR AI SECONDARY MATCHING
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false)
  const [aiAnalysisProgress, setAiAnalysisProgress] = useState({ current: 0, total: 0 })
  const [secondaryMatchData, setSecondaryMatchData] = useState({})
  const [showSecondaryBreakdown, setShowSecondaryBreakdown] = useState(false)
  const [secondaryBreakdownData, setSecondaryBreakdownData] = useState(null)
  const [aiAnalysisError, setAiAnalysisError] = useState("")

  const navigate = useNavigate()
  const location = useLocation()


  // NEW: Load cached secondary matches
  // Replace the current useEffect for loading cached secondary matches with this:

  // Load cached secondary matches
  useEffect(() => {
    // Replace the current loadCachedSecondaryMatches function with this:

    const loadCachedSecondaryMatches = async () => {
      if (!currentUserApplication?.id) {
        console.log("No application ID available yet");
        return;
      }

      try {
        console.log("Loading cached matches for application:", currentUserApplication.id);

        const matchDocRef = doc(db, "aiSecondaryMatches", currentUserApplication.id);
        const matchDoc = await getDoc(matchDocRef);

        if (matchDoc.exists()) {
          const data = matchDoc.data();
          const suppliersData = data.suppliers || {};

          console.log("✅ Found cached AI matches:", {
            suppliersCount: Object.keys(suppliersData).length,
            analyzedAt: data.analyzedAt,
            supplierIds: Object.keys(suppliersData)
          });

          // Store the raw data
          setSecondaryMatchData(suppliersData);

          // Create update function for suppliers
          const updateSupplierWithCache = (supplier) => {
            const cachedData = suppliersData[supplier.id];
            if (cachedData) {
              return {
                ...supplier,
                secondaryMatchScore: cachedData.score || 0,
                secondaryMatchReasoning: cachedData.reasoning || "",
                secondaryMatchCapabilities: cachedData.capabilities || [],
                _hasAiAnalysis: true
              };
            }
            return supplier;
          };

          // Update the base suppliers array
          const updatedAllSuppliers = allSuppliers.map(updateSupplierWithCache);

          setAllSuppliers(updatedAllSuppliers); // Update the base array

          console.log("📈 Updated suppliers with AI data:", {
            total: updatedAllSuppliers.length,
            withAiData: updatedAllSuppliers.filter(s => s._hasAiAnalysis).length
          });

          // CRITICAL: Re-apply filters after updating with AI data
          applyFiltersWithUpdatedSuppliers(updatedAllSuppliers);

          setNotification({
            type: "success",
            message: `Loaded cached secondary match analysis for ${Object.keys(suppliersData).length} suppliers`
          });
          setTimeout(() => setNotification(null), 3000);
        } else {
          console.log("⚠️ No cached AI matches found for application:", currentUserApplication.id);
          setSecondaryMatchData({});
        }
      } catch (error) {
        console.error("❌ Error loading cached secondary matches:", error);
        setNotification({
          type: "error",
          message: "Failed to load cached AI analysis"
        });
        setTimeout(() => setNotification(null), 3000);
      }
    };
    // Add a small delay to ensure application is fully loaded
    const loadData = async () => {
      if (currentUserApplication?.id && allSuppliers.length > 0) {
        await loadCachedSecondaryMatches();
      }
    };

    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, [currentUserApplication?.id, allSuppliers.length]); // Only depend on the ID string, not the whole object


  const applyFiltersWithUpdatedSuppliers = (suppliersArray) => {
    const getEffectiveScore = (supplier) => {
      if (supplier.secondaryMatchScore !== null && supplier.secondaryMatchScore !== undefined) {
        return calculateCombinedMatchScore(supplier.matchPercentage || 0, supplier.secondaryMatchScore);
      }
      return supplier.matchPercentage || 0;
    };

    const filtered = suppliersArray.filter((supplier) => {
      if (filters.location && !supplier.entityOverview?.location?.includes(filters.location)) return false
      const effectiveScore = getEffectiveScore(supplier);
      if (effectiveScore < filters.matchScore) return false
      if (filters.bbbeeLevel && supplier.legalCompliance?.bbbeeLevel !== filters.bbbeeLevel) return false
      if (
        filters.sectors.length > 0 &&
        !filters.sectors.some((sector) => supplier.entityOverview?.economicSectors?.includes(sector))
      )
        return false
      return true
    })

    // Sort by combined/AI score when available, fallback to primary match
    const sorted = filtered.sort((a, b) => {
      const scoreA = getEffectiveScore(a);
      const scoreB = getEffectiveScore(b);
      return scoreB - scoreA;
    });

    setFilteredSuppliers(sorted);
    if (onSuppliersUpdate) {
      onSuppliersUpdate(suppliersArray, sorted)
    }
  }

  // // Helper function to create the analysis prompt
  function createSupplierAnalysisPrompt(suppliers, customerPurpose) {
    const truncatedPurpose = customerPurpose.length > 800
      ? customerPurpose.substring(0, 800) + "..."
      : customerPurpose;

    const supplierData = suppliers.map(supplier => {
      const name = supplier.entityOverview?.tradingName ||
        supplier.entityOverview?.registeredName ||
        'Unknown Supplier';

      const productCategories = supplier.productsServices?.productCategories || [];
      const serviceCategories = supplier.productsServices?.serviceCategories || [];
      const targetMarket = supplier.productsServices?.targetMarket || 'Not specified';
      const sector = supplier.entityOverview?.economicSectors?.[0] || 'Not specified';
      const location = supplier.entityOverview?.location || 'Not specified';

      // Extract product names and descriptions
      const productsDesc = productCategories.map(cat => {
        if (typeof cat === 'string') return cat;
        const name = cat.name || cat.category || '';
        const products = cat.products?.map(p => `${p.name || ''} ${p.description || ''}`).join('; ') || '';
        return `${name} ${products}`;
      }).join(', ').substring(0, 200);

      // Extract service names and descriptions
      const servicesDesc = serviceCategories.map(cat => {
        if (typeof cat === 'string') return cat;
        const name = cat.name || cat.category || '';
        const services = cat.services?.map(s => `${s.name || ''} ${s.description || ''}`).join('; ') || '';
        return `${name} ${services}`;
      }).join(', ').substring(0, 200);

      return `SUPPLIER_ID: ${supplier.id}
NAME: ${name}
SECTOR: ${sector}
LOCATION: ${location}
PRODUCTS: ${productsDesc || 'None listed'}
SERVICES: ${servicesDesc || 'None listed'}
TARGET_MARKET: ${targetMarket.substring(0, 150)}
---END_SUPPLIER---`;
    }).join('\n');

    return `You are a business matching expert. Analyze how well each supplier matches the customer request below.

CUSTOMER REQUEST:
"${truncatedPurpose}"

SUPPLIERS TO ANALYZE (${suppliers.length} total):
${supplierData}

CRITICAL RULES:
1. You MUST return a match for EVERY supplier listed above — all ${suppliers.length} of them
2. Use the exact SUPPLIER_ID values as the supplierId in your response
3. Do NOT skip any supplier even if their profile is incomplete
4. For suppliers with no product/service info, give score 0 with reasoning explaining why

SCORING GUIDE (0-5):
5 = Excellent — direct capability match, supplier clearly offers what customer needs
4 = Strong — high relevance, minor gaps
3 = Good — general alignment, some capability gaps
2 = Partial — limited relevance, indirect connection
1 = Minimal — very weak connection
0 = None — no meaningful alignment or profile is too incomplete to assess

RETURN THIS EXACT JSON FORMAT (no markdown, no extra text):
{
  "matches": [
    {
      "supplierId": "exact-supplier-id-here",
      "score": 3.5,
      "reasoning": "2-3 sentences explaining WHY this score was given, what matched and what didn't",
      "matchedCapabilities": ["specific capability 1", "specific capability 2"]
    }
  ]
}

Remember: The matches array must contain exactly ${suppliers.length} entries, one per supplier.`;
  }

  // In your runSecondaryAiAnalysis function, add this check at the beginning:

  const runSecondaryAiAnalysis = async () => {
    if (!currentUserApplication || filteredSuppliers.length === 0) {
      setAiAnalysisError("No suppliers or application data available");
      return;
    }

    const applicationId = currentUserApplication.id ||
      `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log("Starting AI analysis for ALL suppliers:", {
      totalSuppliers: filteredSuppliers.length,
      applicationId
    });

    // Use ALL filtered suppliers, not just first 5
    const suppliersToAnalyze = allSuppliers.filter(s => s.id !== currentUser?.uid);

    setIsAiAnalyzing(true);
    setAiAnalysisProgress({ current: 0, total: suppliersToAnalyze.length });
    setAiAnalysisError("");
    console.log(`Starting AI analysis for ${suppliersToAnalyze.length} suppliers`);

    try {
      const functions = getFunctions();
      const analyzeSupplierMatches = httpsCallable(functions, "analyzeSupplierMatches");

      // Prepare ALL supplier data for AI analysis
      const suppliersForAnalysis = suppliersToAnalyze.map(supplier => ({
        id: supplier.id,
        entityOverview: supplier.entityOverview || {},
        productsServices: supplier.productsServices || {}
      }));

      const customerPurpose = currentUserApplication.requestOverview?.purpose ||
        currentUserApplication.purpose ||
        "General business procurement needs";

      console.log("Sending", suppliersForAnalysis.length, "suppliers for AI analysis");

      setAiAnalysisProgress({ current: 0, total: suppliersToAnalyze.length });

      const result = await analyzeSupplierMatches({
        suppliers: suppliersForAnalysis,
        customerPurpose: customerPurpose,
        applicationId: applicationId,
        analyzeAll: true,        // tell the function to not limit results
        maxSuppliers: suppliersForAnalysis.length  // explicit count
      });

      console.log("AI analysis completed successfully:", result.data);

      const { matches } = result.data;

      // Process and normalize scores for ALL suppliers
      const processedMatches = {};
      matches.forEach(match => {
        const normalizedScore = Math.round((match.score / 5) * 100);
        processedMatches[match.supplierId] = {
          score: normalizedScore,
          reasoning: match.reasoning || "No reasoning provided",
          capabilities: match.matchedCapabilities || [],
          analyzedAt: new Date().toISOString()
        };
      });

      // Log which suppliers got analysis vs which didn't
      const analyzedIds = Object.keys(processedMatches);
      const allSupplierIds = suppliersToAnalyze.map(s => s.id);
      const missingAnalyses = allSupplierIds.filter(id => !analyzedIds.includes(id));

      console.log("Analysis coverage:", {
        analyzed: analyzedIds.length,
        total: allSupplierIds.length,
        missing: missingAnalyses.length,
        missingIds: missingAnalyses
      });

      // Save to Firestore only if we have a real application ID (not temp)
      if (!applicationId.startsWith('temp-')) {
        await saveSecondaryMatchesToFirestore(applicationId, processedMatches);
      }

      // Update local state
      setSecondaryMatchData(processedMatches);

      // Update ALL suppliers with new scores
      const updateSupplierWithAnalysis = (supplier) => {
        const analysis = processedMatches[supplier.id];
        if (analysis) {
          return {
            ...supplier,
            secondaryMatchScore: analysis.score,
            secondaryMatchReasoning: analysis.reasoning,
            secondaryMatchCapabilities: analysis.capabilities
          };
        }
        return supplier;
      };

      setSuppliers(prev => prev.map(updateSupplierWithAnalysis));
      setAllSuppliers(prev => prev.map(updateSupplierWithAnalysis));
      setFilteredSuppliers(prev => prev.map(updateSupplierWithAnalysis));

      setAiAnalysisProgress({ current: analyzedIds.length, total: suppliersToAnalyze.length });

      const missedCount = suppliersToAnalyze.length - analyzedIds.length;
      setNotification({
        type: missedCount === 0 ? "success" : "info",
        message: missedCount === 0
          ? `✅ AI analysis complete — all ${analyzedIds.length} suppliers analyzed`
          : `✅ AI analysis complete — ${analyzedIds.length} analyzed, ${missedCount} skipped (incomplete profiles)`
      });
      setTimeout(() => setNotification(null), 4000);

    } catch (error) {
      console.error("AI Analysis error details:", error);

      let errorMessage = "AI analysis failed. Please try again.";

      if (error.message.includes('Missing')) {
        errorMessage = "Data validation error: " + error.message;
      } else if (error.message.includes('INTERNAL')) {
        errorMessage = "Server error: The AI service is temporarily unavailable";
      } else if (error.message.includes('timeout')) {
        errorMessage = "Analysis timed out. Try with fewer suppliers or try again later.";
      } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
        errorMessage = "Rate limit reached. Please wait a few minutes and try again.";
      } else if (error.message.includes('OpenAI')) {
        errorMessage = "AI service error: " + error.message;
      }

      setAiAnalysisError(errorMessage);
      setNotification({
        type: "error",
        message: errorMessage
      });
    } finally {
      setIsAiAnalyzing(false);
      setAiAnalysisProgress({ current: 0, total: 0 });
    }
  };

  // NEW: Save matches to Firestore
  const saveSecondaryMatchesToFirestore = async (applicationId, matches) => {
    try {
      const matchDocRef = doc(db, "aiSecondaryMatches", applicationId)
      await setDoc(matchDocRef, {
        suppliers: matches,
        requestPurpose: currentUserApplication.requestOverview?.purpose,
        analyzedAt: serverTimestamp(),
        suppliersAnalyzed: Object.keys(matches).length,
        applicationId: applicationId
      })
    } catch (error) {
      console.error("Error saving secondary matches:", error)
      throw error
    }
  }

  // NEW: Prepare supplier data for AI (helper function)
  const prepareSupplierDataForAi = (supplier) => {
    return {
      id: supplier.id,
      name: supplier.entityOverview?.tradingName || supplier.entityOverview?.registeredName,
      products: supplier.productsServices?.productCategories || [],
      services: supplier.productsServices?.serviceCategories || [],
      targetMarket: supplier.productsServices?.targetMarket || ""
    }
  }

  // NEW: Handle secondary match breakdown
  const handleShowSecondaryBreakdown = (supplier) => {
    setSecondaryBreakdownData({
      supplier,
      primaryScore: supplier.matchPercentage || supplier.newMatchScore || 0,
      secondaryScore: supplier.secondaryMatchScore ?? null,
      reasoning: supplier.secondaryMatchReasoning || null,
      capabilities: supplier.secondaryMatchCapabilities || []
    });
    setShowSecondaryBreakdown(true);
  };


  // NEW: Get secondary match color
  const getSecondaryMatchColor = (score) => {
    if (!score) return "#999"
    if (score >= 75) return "#48BB78"
    if (score >= 50) return "#F6AD55"
    return "#F56565"
  }

  function calculateCombinedMatchScore(primaryScore, aiScore) {
    if (aiScore === null || aiScore === undefined) {
      return null; // No AI analysis yet
    }

    // Combine scores: 60% primary match, 40% AI semantic match
    const combinedScore = (aiScore * 0.6) + (primaryScore * 0.4);
    return Math.round(combinedScore);
  }

  useEffect(() => {
    const loadContactedApplications = async () => {
      try {
        const user = getAuth().currentUser
        if (!user) return

        const userDocRef = doc(db, "userApplications", user.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const data = userDoc.data()
          const contactedApps = data.contactedApplications || []
          setContactedApplications(contactedApps)

          // Populate applicationsWithContacts set
          const contactedIds = new Set(contactedApps.map(app => app.id))
          setApplicationsWithContacts(contactedIds)
        }
      } catch (error) {
        console.error("Error loading contacted applications:", error)
      }
    }

    if (currentUser) {
      loadContactedApplications()
    }
  }, [currentUser])

  const saveContactedAppToFirestore = async (contactedApp) => {
    try {
      const user = getAuth().currentUser
      if (!user) return

      const userDocRef = doc(db, "userApplications", user.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        // Update existing document
        await updateDoc(userDocRef, {
          contactedApplications: arrayUnion(contactedApp),
          updatedAt: serverTimestamp()
        })
      } else {
        // Create new document
        await setDoc(userDocRef, {
          userId: user.uid,
          contactedApplications: [contactedApp],
          createdAt: serverTimestamp()
        })
      }
    } catch (error) {
      console.error("Error saving contacted application:", error)
    }
  }

  const updateContactedApplication = async (applicationId, newSupplierId) => {
    try {
      // Update in local state
      setContactedApplications(prev =>
        prev.map(app => {
          if (app.id === applicationId) {
            const updatedSuppliers = [...(app.contactedSuppliers || []), newSupplierId]
            return {
              ...app,
              contactedSuppliers: updatedSuppliers,
              contactedCount: updatedSuppliers.length,
              lastContacted: new Date().toISOString()
            }
          }
          return app
        })
      )

      // Update in Firestore
      const user = getAuth().currentUser
      if (!user) return

      const userDocRef = doc(db, "userApplications", user.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const data = userDoc.data()
        const updatedContactedApps = data.contactedApplications.map(app => {
          if (app.id === applicationId) {
            const updatedSuppliers = [...(app.contactedSuppliers || []), newSupplierId]
            return {
              ...app,
              contactedSuppliers: updatedSuppliers,
              contactedCount: updatedSuppliers.length,
              lastContacted: new Date().toISOString()
            }
          }
          return app
        })

        await updateDoc(userDocRef, {
          contactedApplications: updatedContactedApps
        })
      }
    } catch (error) {
      console.error("Error updating contacted application:", error)
    }
  }

  const handleNewRequest = () => {
    console.log("New request triggered from SupplierTable");

    // Clear current matches and data
    setAllSuppliers([]);
    setFilteredSuppliers([]);
    setSuppliers([]);
    setCombinedSuppliers([]);
    setCurrentUserApplication(null);
    setSecondaryMatchData({});

    setNotification({
      type: "info",
      message: "Starting new request. Switch to Application tab to update criteria."
    });

    // Call the parent's onNewRequest callback to switch tabs
    if (onNewRequest) {  // Now using the prop parameter
      onNewRequest();
    } else {
      // Fallback: Show instruction
      setNotification({
        type: "warning",
        message: "Please switch to the 'Product & Service Application' tab to start a new request."
      });
    }

    setTimeout(() => setNotification(null), 3000);
  };

  // Add a useEffect to handle navigation state
  useEffect(() => {
    if (location.state?.newApplicationSubmitted) {
      setNotification({
        type: "success",
        message: "New application submitted! Loading matches..."
      });

      // Trigger refresh of matches
      if (currentUser) {
        loadUserApplicationAndMatches();
      }
    }
  }, [location.state]);

  useEffect(() => {
    const loadDataWithHistory = async () => {
      if (!currentUser || !currentUserApplication) return;

      setIsLoadingHistory(true);
      try {
        // 1. Calculate new matches (existing logic)
        const profilesSnapshot = await getDocs(collection(db, "universalProfiles"));
        const profilesData = profilesSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            productsServices: data.productsServices || {},
            financialOverview: data.financialOverview || {},
            legalCompliance: data.legalCompliance || {},
            entityOverview: data.entityOverview || {},
            currentStage: "Potential Supplier",
            status: "New Lead",
          };
        });

        const ratingsData = await fetchSupplierRatings();

        const suppliersWithMatches = profilesData.map((supplier) => {
          const matchScore = calculateEnhancedMatchScore(currentUserApplication, supplier, ratingsData);
          const firstCategory = getFirstCategory(supplier.productsServices);
          const supplierRatingData = ratingsData[supplier.id] || {
            average: 0,
            count: 0,
            latestComment: "No ratings yet"
          };
          const actualRating = supplierRatingData.average;

          return {
            ...supplier,
            matchPercentage: matchScore.totalScore,
            matchDetails: matchScore.breakdown,
            status: getStatusBasedOnScore(matchScore.totalScore),
            rating: actualRating,
            avgResponseTime: "1-2 days",
            lastActivity: new Date().toLocaleDateString(),
            urgency: supplier.applicationOverview?.urgency || "1 month",
            dealSize: supplier.financialOverview?.annualRevenue || "Not specified",
            serviceCategory: firstCategory,
            currentStage: "Potential Supplier",
            nextStage: "Initial Contact",
            bbbeeLevel: supplier.legalCompliance?.bbbeeLevel || "N/A",
            applicationId: null,
            ratingCount: supplierRatingData.count,
            serviceRequired: currentUserApplication?.requestOverview?.purpose || "Not specified"
          };
        });

        const relevantSuppliers = suppliersWithMatches
          .filter(supplier => supplier.matchPercentage > 0 && supplier.id !== currentUser?.uid)
          .sort((a, b) => b.matchPercentage - a.matchPercentage);

        // 2. Fetch contacted history
        const contactedHistory = await fetchContactedHistory(currentUser.uid);

        // 3. Merge with new matches
        const mergedSuppliers = mergeSupplierHistory(relevantSuppliers, contactedHistory);

        // 4. Update states
        setAllSuppliers(mergedSuppliers);
        setCombinedSuppliers(mergedSuppliers);
        setFilteredSuppliers(mergedSuppliers);

        // 5. Check if we have previous contacts
        const hasPrevious = mergedSuppliers.some(s => s.isPreviousContact);
        setHasPreviousContacts(hasPrevious);
        setShowLegend(hasPrevious);

        // Notify parent component
        if (onSuppliersUpdate) {
          onSuppliersUpdate(mergedSuppliers, mergedSuppliers);
        }

      } catch (error) {
        console.error("Error loading data with history:", error);
        setError("Failed to load supplier matches with history.");
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadDataWithHistory();
  }, [currentUserApplication, currentUser]);

  // Update the table rendering to show combined suppliers
  const renderSupplierRows = () => {
    return filteredSuppliers.map((supplier) => {
      const statusStyle = getStatusStyle(supplier.status);
      const stageStyle = getStageStyle(supplier.currentStage);

      const isPreviousContact = supplier.isPreviousContact;
      const hasNewMatch = supplier.hasNewMatch;

      return (
        <tr
          key={supplier.id}
          style={{
            ...tableRowStyle,
            backgroundColor: isPreviousContact ? '#FFF8E1' : 'white',
            borderLeft: isPreviousContact ? '4px solid #F57C00' : 'none',
            opacity: isPreviousContact && !hasNewMatch ? 0.8 : 1
          }}
        >
          <td style={tableCellStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <div>
                <span onClick={() => handleViewDetails(supplier)} style={supplierNameStyle}>
                  <TruncatedText
                    text={supplier.entityOverview?.tradingName || supplier.entityOverview?.registeredName}
                    maxLength={15}
                  />
                </span>
                {isPreviousContact && (
                  <div style={{ fontSize: "0.6rem", color: "#F57C00", marginTop: "2px" }}>
                    ✓ Previously Contacted
                  </div>
                )}
              </div>
            </div>
          </td>

          <td style={tableCellStyle}>
            <TruncatedText text={supplier.entityOverview?.location || "Not specified"} maxLength={12} />
          </td>

          <td style={tableCellStyle}>
            <TruncatedText
              text={supplier.entityOverview?.economicSectors?.[0] || "Not specified"}
              maxLength={12}
            />
          </td>

          <td style={tableCellStyle}>
            <TruncatedText text={supplier.legalCompliance?.bbbeeLevel || "N/A"} maxLength={8} />
          </td>

          <td style={tableCellStyle}>
            <TruncatedText
              text={supplier.financialOverview?.annualRevenue || "Not specified"}
              maxLength={12}
            />
          </td>

          <td style={tableCellStyle}>
            <TruncatedText
              text={
                supplier.productsServices?.productCategories?.[0]?.name ||
                supplier.productsServices?.serviceCategories?.[0]?.name ||
                "Not specified"
              }
              maxLength={10}
            />
          </td>

          {/* Updated Service Required Column */}
          <td style={tableCellStyle}>
            {isPreviousContact ? (
              <div>
                <div style={{ fontSize: '0.7rem', color: '#F57C00', fontWeight: 'bold' }}>
                  Previous: {supplier.previousServiceRequested || "Not specified"}
                </div>
                {hasNewMatch && (
                  <div style={{ fontSize: '0.7rem', color: '#388E3C', marginTop: '4px' }}>
                    New Match: {supplier.serviceRequired || supplier.newServiceRequired || "Not specified"}
                  </div>
                )}
                {supplier.previousContactDate && (
                  <div style={{ fontSize: '0.6rem', color: '#666', marginTop: '2px' }}>
                    Contacted: {new Date(supplier.previousContactDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : (
              <TruncatedText
                text={supplier.serviceRequired || "Not specified"}
                maxLength={15}
              />
            )}
          </td>

          <td style={tableCellStyle}>
            <TruncatedText text={supplier.urgency || "1 month"} maxLength={10} />
          </td>

          <td style={tableCellStyle}>
            {supplier.secondaryMatchScore !== null && supplier.secondaryMatchScore !== undefined ? (
              <div style={matchContainerStyle}>
                <div style={progressBarStyle}>
                  <div
                    style={{
                      ...progressFillStyle,
                      width: `${calculateCombinedMatchScore(
                        supplier.matchPercentage || supplier.newMatchScore || 0,
                        supplier.secondaryMatchScore
                      )}%`,
                      backgroundColor: getSecondaryMatchColor(
                        calculateCombinedMatchScore(
                          supplier.matchPercentage || supplier.newMatchScore || 0,
                          supplier.secondaryMatchScore
                        )
                      ),
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                  <span style={{ ...matchScoreStyle, color: getSecondaryMatchColor(calculateCombinedMatchScore(supplier.matchPercentage || supplier.newMatchScore || 0, supplier.secondaryMatchScore)), fontWeight: "bold" }}>
                    {calculateCombinedMatchScore(supplier.matchPercentage || supplier.newMatchScore || 0, supplier.secondaryMatchScore)}%
                  </span>
                  <Eye
                    size={14}
                    style={{ cursor: "pointer", color: "#a67c52" }}
                    onClick={() => handleShowSecondaryBreakdown(supplier)}
                    title="View AI match breakdown"
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ color: "#999", fontSize: "0.75rem", fontStyle: "italic" }}>Pending</span>
                <Eye
                  size={14}
                  style={{ cursor: "pointer", color: "#a67c52" }}
                  onClick={() => handleShowSecondaryBreakdown(supplier)}
                  title="Click to see details / run AI analysis"
                />
              </div>
            )}
          </td>

          <td style={tableCellStyle}>
            <div style={matchContainerStyle}>
              <div style={progressBarStyle}>
                <div
                  style={{
                    ...progressFillStyle,
                    width: `${supplier.matchPercentage || supplier.newMatchScore || 0}%`,
                    background:
                      (supplier.matchPercentage || supplier.newMatchScore || 0) > 75
                        ? "#48BB78"
                        : (supplier.matchPercentage || supplier.newMatchScore || 0) > 50
                          ? "#F6AD55"
                          : "#F56565",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <span
                  style={{
                    ...matchScoreStyle,
                    color:
                      (supplier.matchPercentage || supplier.newMatchScore || 0) > 75
                        ? "#48BB78"
                        : (supplier.matchPercentage || supplier.newMatchScore || 0) > 50
                          ? "#D69E2E"
                          : "#E53E3E",
                  }}
                >
                  {supplier.matchPercentage || supplier.newMatchScore || 0}%
                </span>
                <Eye
                  size={14}
                  style={{
                    cursor: "pointer",
                    color: "#a67c52",
                  }}
                  onClick={() => handleShowMatchBreakdown(supplier)}
                  title="View match breakdown"
                />
              </div>
            </div>
          </td>


          {/* Action Column - Updated for previous contacts */}
          <td style={tableCellStyle}>
            {isPreviousContact ? (
              <span style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#E0E0E0',
                color: '#666',
                fontSize: '0.65rem',
                borderRadius: '3px',
                display: 'inline-block',
                cursor: 'default'
              }}>
                Previously Contacted
              </span>
            ) : (
              <button
                onClick={() => handleConnectClick(supplier)}
                style={{
                  ...statusBadgeStyle,
                  backgroundColor: "#5D2A0A",
                  color: "white",
                  padding: "0.25rem 0.5rem",
                  cursor: "pointer",
                  border: "none",
                  borderRadius: "3px",
                  fontWeight: "500",
                  fontSize: "0.65rem",
                }}
              >
                Contact
              </button>
            )}
          </td>

          <td style={{ ...tableCellStyle, borderRight: "none" }}>
            <div
              style={{
                ...statusBadgeStyle,
                backgroundColor: stageStyle.backgroundColor,
                color: stageStyle.color,
                fontSize: "0.65rem",
                padding: "0.15rem 0.3rem",
                textAlign: "center",
                lineHeight: "1.2",
                minHeight: "2.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {supplier.currentStage.split(" ").map((word, index) => (
                <div key={index} style={{ fontSize: "0.6rem" }}>
                  {word}
                </div>
              ))}
            </div>
          </td>
        </tr>
      );
    });
  };

  // Add Legend/Info Panel component
  const renderLegend = () => {
    if (!hasPreviousContacts) return null;

    return (
      <div style={{
        background: '#FFF3E0',
        padding: '0.75rem',
        borderRadius: '6px',
        border: '1px solid #FFE0B2',
        marginBottom: '1rem',
        fontSize: '0.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong>Match Types:</strong>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '20px',
                height: '12px',
                background: '#FFF8E1',
                border: '2px solid #F57C00',
                borderRadius: '2px'
              }}></div>
              <span>Previously Contacted Suppliers</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '20px',
                height: '12px',
                background: 'white',
                border: '1px solid #E8D5C4',
                borderRadius: '2px'
              }}></div>
              <span>New Matches</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '20px',
                height: '12px',
                background: '#FFF8E1',
                border: '2px dashed #F57C00',
                borderRadius: '2px'
              }}></div>
              <span>Previously Contacted with New Match</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowLegend(!showLegend)}
          style={{
            background: 'none',
            border: 'none',
            color: '#F57C00',
            cursor: 'pointer',
            fontSize: '0.7rem',
            padding: '0.25rem 0.5rem'
          }}
        >
          {showLegend ? 'Hide Legend' : 'Show Legend'}
        </button>
      </div>
    );
  };

  // Update the New Request button logic in the render
  const renderNewRequestButton = () => {
    const hasMatches = filteredSuppliers.length > 0;
    const buttonStyle = hasMatches ? filterButtonStyle : {
      ...newRequestButtonStyle,
      background: "#5D2A0A",
      color: "white",
      fontWeight: "600",
      fontSize: "1rem",
      padding: "0.75rem 1.5rem",
      margin: "0 auto",
      display: "block"
    };

    return (
      <button onClick={handleNewRequest} style={newRequestButtonStyle}>
        {hasMatches ? "New Request" : "Start New Request"}
      </button>
    );
  };

  const loadUserApplicationAndMatches = async () => {
    try {
      if (!currentUser) return;

      // Reload the user's application
      const applicationDoc = await getDoc(doc(db, "productApplications", currentUser.uid));
      if (applicationDoc.exists()) {
        const applicationData = applicationDoc.data();
        setCurrentUserApplication({
          id: applicationDoc.id,
          ...applicationData
        })

        // TEMP DEBUG - remove after fixing
        console.log("=== APPLICATION DATA STRUCTURE ===", {
          hasMatchingPrefs: !!applicationData.matchingPreferences,
          hasRequestOverview: !!applicationData.requestOverview,
          hasProductsServices: !!applicationData.productsServices,
          categories: applicationData.requestOverview?.categories || applicationData.productsServices?.categories,
          keywords: applicationData.requestOverview?.keywords,
          purpose: applicationData.requestOverview?.purpose,
          location: applicationData.matchingPreferences?.location,
          deliveryModes: applicationData.matchingPreferences?.deliveryModes,
        })


        // This will trigger the useEffect that loads data with history
      } else {
        setError("Please complete a product application first");
      }
    } catch (error) {
      console.error("Error reloading application:", error);
    }
  };

  const getImprovementSuggestion = (criteriaKey, score) => {
    const suggestions = {
      categoryMatch: "Consider expanding your service categories or highlighting relevant subcategories that align with customer needs.",
      bbbeeMatch: "Improve your BBBEE certification level to better match customer transformation requirements.",
      locationMatch: "Consider expanding your service delivery areas or highlighting remote service capabilities.",
      deliveryMatch: "Add more delivery mode options (on-site, remote, hybrid) to match customer preferences.",
      budgetMatch: "Adjust your pricing structure or highlight different service tiers to better fit customer budgets.",
      ownershipMatch: "Highlight your transformation credentials and ownership demographics more prominently.",
      urgencyMatch: "Improve your response times and project delivery capabilities to meet urgent requirements.",
      experienceMatch: "Better showcase your relevant sector experience and case studies in your profile.",
      ratingMatch: "Focus on improving customer satisfaction and collecting more positive reviews.",
    }

    return suggestions[criteriaKey] || "Review your profile to ensure all relevant information is complete and accurate."
  }

  const fetchSupplierRatings = async () => {
    try {
      const ratingsSnapshot = await getDocs(collection(db, "supplierReviews"))
      const ratingsData = {}

      ratingsSnapshot.forEach((doc) => {
        const ratingData = doc.data()
        const supplierId = ratingData.supplierId

        if (supplierId) {
          if (!ratingsData[supplierId]) {
            ratingsData[supplierId] = []
          }
          ratingsData[supplierId].push({
            rating: ratingData.rating || 0,
            comment: ratingData.comment || "",
            date: ratingData.date || "",
            customerName: ratingData.customerName || "",
            feedbackTheme: ratingData.feedbackTheme || ""
          })
        }
      })

      const averageRatings = {}
      Object.keys(ratingsData).forEach(supplierId => {
        const ratings = ratingsData[supplierId]
        if (ratings.length > 0) {
          const total = ratings.reduce((sum, item) => sum + (item.rating || 0), 0)
          averageRatings[supplierId] = {
            average: total / ratings.length,
            count: ratings.length,
            latestComment: ratings[ratings.length - 1]?.comment || "No comments"
          }
        } else {
          averageRatings[supplierId] = {
            average: 0,
            count: 0,
            latestComment: "No ratings yet"
          }
        }
      })

      setSupplierRatings(averageRatings)
      return averageRatings
    } catch (error) {
      console.error("Error fetching supplier ratings:", error)
      return {}
    }
  }

  const getSupplierRating = (supplierId) => {
    return supplierRatings[supplierId] || {
      average: 0,
      count: 0,
      latestComment: "No ratings yet"
    }
  }

  const handleShowMatchBreakdown = (supplier) => {
    setMatchBreakdownData(supplier)
    setShowMatchBreakdown(true)
  }

  useEffect(() => {
    setMounted(true)
    const auth = getAuth()

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user)
      } else {
        setCurrentUser(null)
        setCurrentUserApplication(null)
      }
    })

    return () => {
      unsubscribeAuth()
      setMounted(false)
    }
  }, [])

  // Check if user has a product application
  useEffect(() => {
    const checkApplicationExists = async () => {
      if (!currentUser) return

      try {
        const applicationDoc = await getDoc(doc(db, "productApplications", currentUser.uid))
        if (!applicationDoc.exists()) {
          setSuppliers([])
          setFilteredSuppliers([])
          setError("Please complete a product application first to see matching suppliers")
          setLoading(false)
          return
        }

        const applicationData = applicationDoc.data()
        console.log("Loaded application data:", {
          id: applicationDoc.id,
          hasRequestOverview: !!applicationData.requestOverview,
          hasPurpose: !!applicationData.requestOverview?.purpose
        })

        setCurrentUserApplication({
          id: applicationDoc.id, // Make sure we have the ID
          ...applicationData
        })
      } catch (error) {
        console.error("Error checking application:", error)
        setError("Failed to verify product application")
        setLoading(false)
      }
    }

    checkApplicationExists()
  }, [currentUser])

  // Fetch data only when application exists
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUserApplication) return

      try {
        setLoading(true)
        setError(null)

        // Fetch universal profiles (suppliers)
        const profilesSnapshot = await getDocs(collection(db, "universalProfiles"))
        const profilesData = profilesSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            productsServices: data.productsServices || {},
            financialOverview: data.financialOverview || {},
            legalCompliance: data.legalCompliance || {},
            entityOverview: data.entityOverview || {},
            currentStage: "Potential Supplier",
            status: "New Lead",
          }
        })

        const ratingsData = await fetchSupplierRatings()

        // Calculate matches using enhanced matching
        const suppliersWithMatches = profilesData.map((supplier) => {
          const matchScore = calculateEnhancedMatchScore(currentUserApplication, supplier, ratingsData)

          // Get first category name or default
          const firstCategory = getFirstCategory(supplier.productsServices)

          // Get the actual rating
          const supplierRatingData = ratingsData[supplier.id] || {
            average: 0,
            count: 0,
            latestComment: "No ratings yet"
          }
          const actualRating = supplierRatingData.average

          return {
            ...supplier,
            matchPercentage: matchScore.totalScore,
            matchDetails: matchScore.breakdown,
            status: getStatusBasedOnScore(matchScore.totalScore),
            rating: actualRating,
            avgResponseTime: "1-2 days",
            lastActivity: new Date().toLocaleDateString(),
            urgency: supplier.applicationOverview?.urgency || "1 month", // ← CHANGED LINE
            dealSize: supplier.financialOverview?.annualRevenue || "Not specified",
            serviceCategory: firstCategory,
            currentStage: "Potential Supplier",
            nextStage: "Initial Contact",
            bbbeeLevel: supplier.legalCompliance?.bbbeeLevel || "N/A",
            applicationId: null,
            ratingCount: supplierRatingData.count,
            serviceRequired: currentUserApplication?.requestOverview?.purpose || "Not specified"
          }
        })

        // Filter out suppliers with 0% match and sort by match percentage
        const relevantSuppliers = suppliersWithMatches
          .filter(supplier => supplier.matchPercentage > 0 && supplier.id !== currentUser?.uid)
          .sort((a, b) => b.matchPercentage - a.matchPercentage)

        setSuppliers(relevantSuppliers)
        setAllSuppliers(relevantSuppliers)
        setFilteredSuppliers(relevantSuppliers)

        // Notify parent component of the update
        if (onSuppliersUpdate) {
          onSuppliersUpdate(relevantSuppliers, relevantSuppliers)
        }

      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load supplier matches. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUserApplication])

  // Determine status based on match score
  const getStatusBasedOnScore = (score) => {
    if (score >= 90) return "Perfect Match"
    if (score >= 75) return "Strong Match"
    if (score >= 50) return "Potential Match"
    if (score >= 25) return "Low Match"
    return "New Lead"
  }

  // Filter suppliers based on active filters
  const applyFilters = () => {
    applyFiltersWithUpdatedSuppliers(allSuppliers);
  }

  const getEffectiveScore = (supplier) => {
    if (supplier.secondaryMatchScore !== null && supplier.secondaryMatchScore !== undefined) {
      return calculateCombinedMatchScore(supplier.matchPercentage || 0, supplier.secondaryMatchScore);
    }
    return supplier.matchPercentage || 0;
  };


  useEffect(() => {
    applyFilters()
  }, [filters, allSuppliers])

  const getMatchScoreClass = (percentage) => {
    if (percentage >= 90) return { color: "#388E3C", fontWeight: "bold" }
    if (percentage >= 80) return { color: "#F57C00", fontWeight: "bold" }
    return { color: "#D32F2F", fontWeight: "bold" }
  }

  const sendEmailNotification = async (supplier, applicationPayload) => {
    try {
      console.log("🔄 Using Feedback service configuration for supplier notification...");

      const emailjsConfig = {
        serviceId: API_KEYS.SERVICE_ID_MESSAGES,
        templateId: API_KEYS.TEMPLATE_ID_MESSAGES,
        publicKey: API_KEYS.PUBLIC_KEY_ID_MESSAGES
      };

      console.log("📧 Using Feedback config:", emailjsConfig);

      if (!window.emailjs) {
        emailjs.init(emailjsConfig.publicKey);
        window.emailjs = emailjs;
      }

      // Get supplier email from supplierApplications collection
      let supplierEmail = null;
      console.log("📋 Fetching supplier email for:", supplier.id);

      try {
        // Query supplierApplications collection to find the supplier's application
        const supplierApplicationsQuery = query(
          collection(db, "supplierApplications"),
          where("supplierId", "==", supplier.id)
        );
        const supplierApplicationsSnapshot = await getDocs(supplierApplicationsQuery);

        if (!supplierApplicationsSnapshot.empty) {
          const supplierApplication = supplierApplicationsSnapshot.docs[0].data();
          console.log("📄 supplierApplications data:", supplierApplication);

          // Get email from customerProfileData
          supplierEmail = supplierApplication.customerProfileData?.email;

          if (supplierEmail) {
            console.log("✅ Found supplier email:", supplierEmail);
          } else {
            console.log("❌ No email found in customerProfileData");
          }
        } else {
          console.log("❌ No supplier applications found for:", supplier.id);
        }
      } catch (fetchError) {
        console.error("❌ Error fetching supplier email:", fetchError);
      }

      if (!supplierEmail) {
        console.warn("⚠️ No supplier email found, using fallback");
        supplierEmail = "support@bigmarketplace.africa";
      }

      console.log("📧 Final recipient email:", supplierEmail);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(supplierEmail)) {
        throw new Error(`Invalid email format: "${supplierEmail}"`);
      }

      const currentUser = getAuth().currentUser;
      const customerName = currentUser?.displayName || "Customer";
      const supplierName = supplier.entityOverview?.tradingName || supplier.entityOverview?.registeredName || "Supplier";

      const emailMessage = `Dear ${supplierName},\n\n
We are pleased to inform you that a customer has expressed interest in your services through the BIG Marketplace Africa.\n\n
Application Details:
- Customer: ${customerName}
- Service Required: ${applicationPayload.originalRequest?.serviceRequested || "Not specified"}
- Location: ${applicationPayload.originalRequest?.location || "Not specified"}
- Budget Range: ${applicationPayload.originalRequest?.budgetRange?.min || "0"} - ${applicationPayload.originalRequest?.budgetRange?.max || "0"}
- Match Score: ${applicationPayload.matchPercentage}%\n\n
Please log into your BIG Marketplace Africa account to view the complete application details and respond to this opportunity.\n\n
Best regards,\n
BIG Marketplace Africa Team`;

      const templateParams = {
        to_email: supplierEmail,
        subject: `New Customer Interest - ${applicationPayload.originalRequest?.serviceRequested || "Service Request"}`,
        from_name: "BIG Marketplace Africa",
        date: new Date().toLocaleDateString(),
        message: emailMessage,
        portal_url: `https://www.bigmarketplace.africa/supplier/applications`,
        has_attachments: "false",
        attachments_count: "0"
      };

      console.log("📨 Sending supplier notification with Feedback service...", templateParams);

      const response = await window.emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        templateParams,
        emailjsConfig.publicKey
      );

      console.log("✅ Supplier notification email sent successfully!", response);

    } catch (emailError) {
      console.error("❌ Supplier notification email failed:", emailError);
      // Don't throw error here - we don't want to block the application process if email fails
    }
  }

  const handleConnectClick = async (supplier) => {
    if (supplier.id === currentUser?.uid) {
      setNotification({
        type: "error",
        message: "You cannot contact yourself"
      })
      setTimeout(() => setNotification(null), 3000)
      return
    }

    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      if (!currentUser) throw new Error("Please log in to contact suppliers")

      // ✅ TRACK CONTACTED APPLICATIONS
      const isFirstContact = !applicationsWithContacts.has(currentUserApplication?.id)

      if (currentUserApplication && isFirstContact) {
        // First contact for this application - create new entry
        setApplicationsWithContacts(prev => new Set([...prev, currentUserApplication.id]))

        const contactedApp = {
          id: currentUserApplication.id || `app_${Date.now()}`,
          createdAt: new Date().toISOString(),
          data: currentUserApplication,
          matches: filteredSuppliers,
          matchCount: filteredSuppliers.length,
          contactedSuppliers: [supplier.id],
          contactedCount: 1,
          lastContacted: new Date().toISOString()
        }

        setContactedApplications(prev => [contactedApp, ...prev])
        await saveContactedAppToFirestore(contactedApp)

        setNotification({
          type: "info",
          message: "Application saved to your contacted requests"
        })
      } else if (currentUserApplication) {
        // Update existing contacted application
        await updateContactedApplication(currentUserApplication.id, supplier.id)
      }

      // ... REST OF YOUR EXISTING handleConnectClick CODE
      const supplierRef = doc(db, "universalProfiles", supplier.id)
      await updateDoc(supplierRef, {
        currentStage: "Contact Initiated",
        updatedAt: serverTimestamp(),
      })

      // Update local state optimistically
      setAllSuppliers((prev) =>
        prev.map((s) => (s.id === supplier.id ? { ...s, currentStage: "Contact Initiated" } : s)),
      )
      setFilteredSuppliers((prev) =>
        prev.map((s) => (s.id === supplier.id ? { ...s, currentStage: "Contact Initiated" } : s)),
      )

      // Notify parent component about the contact
      if (onSupplierContacted) {
        onSupplierContacted(supplier.id)
      }

      // Get both profiles (current user and target supplier)
      const [supplierProfile, customerProfile] = await Promise.all([
        getDoc(doc(db, "universalProfiles", currentUser.uid)),
        getDoc(doc(db, "universalProfiles", supplier.id)),
      ])

      if (!supplierProfile.exists()) throw new Error("Your supplier profile not found")
      if (!customerProfile.exists()) throw new Error("Supplier profile not found")

      const customerData = customerProfile.data()
      const supplierData = supplierProfile.data()

      // Helper function to safely get nested values
      const getSafeValue = (obj, path, defaultValue = null) => {
        return path.split(".").reduce((acc, key) => acc?.[key] ?? defaultValue, obj)
      }

      const formatMatchBreakdown = (matchDetails) => {
        if (!matchDetails) return null

        return Object.entries(matchDetails).reduce((acc, [key, details]) => {
          acc[key] = {
            score: details.score,
            description: details.description,
            weight: ENHANCED_MATCHING_CRITERIA[key]?.weight * 100 || 0,
          }
          return acc
        }, {})
      }

      // Prepare the complete application payload
      const applicationPayload = {
        applicationSource: "supplier-directory",
        status: "Pending",
        matchPercentage: supplier.matchPercentage || 0,
        matchBreakdown: {
          totalScore: supplier.matchPercentage || 0,
          breakdown: formatMatchBreakdown(supplier.matchDetails),
          calculatedAt: serverTimestamp(),
          criteriaWeights: Object.entries(ENHANCED_MATCHING_CRITERIA).reduce((acc, [key, criteria]) => {
            acc[key] = {
              weight: criteria.weight * 100,
              description: criteria.description,
            }
            return acc
          }, {}),
        },

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        supplierId: currentUser.uid,
        supplierName:
          getSafeValue(supplierData, "entityOverview.tradingName") ||
          getSafeValue(supplierData, "entityOverview.registeredName") ||
          "Unknown Supplier",
        supplierLocation: getSafeValue(supplierData, "entityOverview.location") || "Not specified",
        supplierType: getSafeValue(supplierData, "entityOverview.entityType") || "Not specified",
        supplierSector: getSafeValue(supplierData, "entityOverview.economicSectors[0]") || "Not specified",
        customerId: supplier.id,
        customerName:
          getSafeValue(customerData, "entityOverview.tradingName") ||
          getSafeValue(customerData, "entityOverview.registeredName") ||
          "Unknown Customer",
        customerLocation: getSafeValue(customerData, "entityOverview.location") || "Not specified",
        customerType: getSafeValue(customerData, "entityOverview.entityType") || "Not specified",
        customerSector: getSafeValue(customerData, "entityOverview.economicSectors[0]") || "Not specified",
        originalRequest: {
          id: currentUserApplication?.id || "unknown-id",
          businessName: getSafeValue(currentUserApplication, "contactSubmission.businessName") || "Unknown Business",
          serviceRequested:
            getSafeValue(currentUserApplication, "productsServices.categories[0]") ||
            getSafeValue(currentUserApplication, "productsServices.serviceCategories[0]") ||
            "Not specified",
          budgetRange: {
            min: getSafeValue(currentUserApplication, "requestOverview.minBudget") || "0",
            max: getSafeValue(currentUserApplication, "requestOverview.maxBudget") || "0",
          },
          location: getSafeValue(currentUserApplication, "requestOverview.location") || "Not specified",
          urgency: getSafeValue(currentUserApplication, "applicationOverview.urgency") || "Not specified",
          deliveryTurnaround: getSafeValue(currentUserApplication, "requestOverview.endDate")
            ? `By ${currentUserApplication.requestOverview.endDate}`
            : "Not specified",
          purpose: currentUserApplication?.requestOverview?.purpose || "Not specified",
        },
        currentStage: "Contact Initiated",
        nextStage: "Proposal Sent",
        lastActivity: new Date().toISOString(),
        supplierOffer: {
          productCategories: Array.isArray(supplierData.productsServices?.productCategories)
            ? supplierData.productsServices.productCategories
            : [],
          serviceCategory: getFirstCategory(supplierData.productsServices),
          bbbeeLevel: supplierData.legalCompliance?.bbbeeLevel || "Not specified",
          deliveryModes: Array.isArray(supplierData.productsServices?.deliveryModes)
            ? supplierData.productsServices.deliveryModes
            : ["Not specified"],
          pisScore: supplierData.pisScore || 0,
          bigScore: supplierData.bigScore || 0,
          products: Array.isArray(supplierData.productsServices?.products)
            ? supplierData.productsServices.products
            : [],
        },
        customerProfileData: {
          contactName: getSafeValue(customerData, "contactDetails.contactName") || "Not specified",
          email: getSafeValue(customerData, "contactDetails.email") || "Not specified",
          phone: getSafeValue(customerData, "contactDetails.mobile") || "Not specified",
          annualRevenue: getSafeValue(customerData, "financialOverview.annualRevenue") || "Not specified",
          fundingStage: getSafeValue(customerData, "applicationOverview.fundingStage") || "Not specified",
          bbbeeLevel: getSafeValue(customerData, "legalCompliance.bbbeeLevel") || "Not specified",
          taxStatus: getSafeValue(customerData, "legalCompliance.taxNumber") ? "Compliant" : "Not specified",
          companyProfile: getSafeValue(customerData, "documents.companyProfile[0]") || null,
          financialStatements: getSafeValue(customerData, "documents.financialStatements[0]") || null,
        },
      }

      // Save the application
      await addDoc(collection(db, "supplierApplications"), applicationPayload)

      await updateDoc(supplierRef, {
        currentStage: "Contact Initiated",
        updatedAt: serverTimestamp(),
      })

      // Send email notification to supplier
      await sendEmailNotification(supplier, applicationPayload)

      setNotification({
        type: "success",
        message: `Contact initiated with ${supplier.entityOverview?.tradingName || supplier.entityOverview?.registeredName}`,
      })

      if (applicationPayload.status === "Accepted") {
        if (onSupplierAccepted) {
          onSupplierAccepted(supplier.id)
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      setAllSuppliers((prev) =>
        prev.map((s) => (s.id === supplier.id ? { ...s, currentStage: "Potential Supplier" } : s)),
      )
      setFilteredSuppliers((prev) =>
        prev.map((s) => (s.id === supplier.id ? { ...s, currentStage: "Potential Supplier" } : s)),
      )

      console.error("Application error:", error)
      setNotification({
        type: "error",
        message: error.message.includes("FirebaseError")
          ? "Failed to send application due to data validation"
          : error.message,
      })
    } finally {
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const loadContactedRequest = (contactedApp) => {
    setCurrentUserApplication(contactedApp.data)
    setSuppliers(contactedApp.matches)
    setFilteredSuppliers(contactedApp.matches)
    setShowContactedApplications(false)

    setNotification({
      type: "success",
      message: "Loaded previous contacted request"
    })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleViewDetails = (supplier) => {
    setModalContent({
      type: "supplier-details",
      supplier
    })
    setShowModal(true)
  }

  const handleViewDocuments = (supplier) => {
    setModalContent({ type: "documents", supplier })
    setShowModal(true)
  }

  const handleMessage = (supplier) => {
    setModalContent({ type: "message", supplier })
    setShowModal(true)
  }

  const handleCall = (supplier) => {
    setModalContent({ type: "call", supplier })
    setShowModal(true)
  }

  const handleExport = () => {
    setNotification({ type: "info", message: "Exporting supplier data..." })
    setTimeout(() => setNotification(null), 3000)
  }

  const clearAllFilters = () => {
    setFilters({
      location: "",
      matchScore: 50,
      minValue: "",
      maxValue: "",
      entityType: "",
      sectors: [],
      bbbeeLevel: "",
      procurementCategories: [],
      availability: "",
      sortBy: "",
    })
  }

  if (loading) return <div>Loading suppliers...</div>

  if (error) return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <div style={{ color: '#D32F2F', marginBottom: '1rem', fontSize: '1.1rem' }}>{error}</div>
      {error.includes("complete a product application") && (
        <button
          onClick={() => navigate('/applications/product')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#5D2A0A',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Create Product Application
        </button>
      )}
    </div>
  )

  if (filteredSuppliers.length === 0 && !loading) return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <p style={{ fontSize: '1.1rem', color: '#5D2A0A', marginBottom: '1rem' }}>
        No matching suppliers found based on your product application criteria.
      </p>
      <p style={{ color: '#7d5a50', marginBottom: '2rem' }}>
        Try updating your product application or check back later for new suppliers.
      </p>
      <button
        onClick={() => navigate('/applications/product')}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#5D2A0A',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '1rem',
          fontWeight: '500',
          cursor: 'pointer',
        }}
      >
        Edit Product Application
      </button>
    </div>
  )

  return (
    <>
      <div
        style={{
          position: "relative",
          filter: showModal || showFilters ? "blur(2px)" : "none",
          transition: "filter 0.2s ease",
          pointerEvents: isAiAnalyzing ? "none" : "auto",
        }}
      >
        {/* Notification area */}
        {notification && (
          <div
            style={{
              position: "fixed",
              top: "1rem",
              right: "1rem",
              padding: "1rem",
              borderRadius: "6px",
              color: "white",
              fontWeight: "500",
              zIndex: 1001,
              background:
                notification.type === "success" ? "#48BB78" : notification.type === "error" ? "#F56565" : "#4299E1",
            }}
          >
            {notification.message}
          </div>
        )}

        {/* Loading state */}
        {isLoadingHistory && (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#5D2A0A'
          }}>
            Loading matches with history...
          </div>
        )}

        {/* No matches but has previous contacts */}
        {!isLoadingHistory && filteredSuppliers.length === 0 && hasPreviousContacts && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '1.1rem', color: '#5D2A0A', marginBottom: '1rem' }}>
              No new matches found for your current request.
            </p>
            <p style={{ color: '#7d5a50', marginBottom: '2rem' }}>
              However, you have previously contacted suppliers below.
            </p>
            {renderNewRequestButton()}
          </div>
        )}

        {/* No matches at all */}
        {!isLoadingHistory && filteredSuppliers.length === 0 && !hasPreviousContacts && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '1.1rem', color: '#5D2A0A', marginBottom: '1rem' }}>
              No matching suppliers found based on your product application criteria.
            </p>
            <p style={{ color: '#7d5a50', marginBottom: '2rem' }}>
              Try creating a new request or check back later for new suppliers.
            </p>
            {renderNewRequestButton()}
          </div>
        )}

        {/* AI Analysis Full Screen Loader - rendered via portal so it's always on top */}
        {mounted && isAiAnalyzing && createPortal(
          <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
          }}>
            <div style={{
              background: "white",
              padding: "2.5rem",
              borderRadius: "16px",
              textAlign: "center",
              color: "#5D2A0A",
              minWidth: "380px",
              maxWidth: "480px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
            }}>
              {/* Animated brain icon */}
              <div style={{
                width: "80px", height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #5D2A0A, #a67c52)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1.5rem auto",
                animation: "pulse 1.5s ease-in-out infinite",
              }}>
                <Brain size={40} color="white" />
              </div>

              <style>{`
                @keyframes pulse {
                  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(93,42,10,0.4); }
                  70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(93,42,10,0); }
                  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(93,42,10,0); }
                }
                @keyframes shimmer {
                  0% { background-position: -400px 0; }
                  100% { background-position: 400px 0; }
                }
                @keyframes dotBounce {
                  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
                  40% { transform: scale(1); opacity: 1; }
                }
              `}</style>

              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem", fontWeight: "700" }}>
                AI Semantic Analysis Running
              </h3>
              <p style={{ margin: "0 0 1.5rem 0", color: "#8D6E63", fontSize: "0.875rem" }}>
                Analyzing supplier capabilities against your request...
              </p>

              {/* Progress bar */}
              <div style={{
                width: "100%", height: "10px",
                backgroundColor: "#E8D5C4",
                borderRadius: "5px",
                margin: "0 0 0.75rem 0",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #5D2A0A 0%, #a67c52 50%, #5D2A0A 100%)",
                  backgroundSize: "400px 100%",
                  borderRadius: "5px",
                  animation: "shimmer 1.5s infinite linear",
                  width: aiAnalysisProgress.total > 0
                    ? `${Math.max(5, (aiAnalysisProgress.current / aiAnalysisProgress.total) * 100)}%`
                    : "100%",
                  transition: "width 0.5s ease",
                }} />
              </div>

              {/* Supplier count */}
              <p style={{ margin: "0 0 1.5rem 0", color: "#5D2A0A", fontSize: "0.875rem", fontWeight: "600" }}>
                {aiAnalysisProgress.total > 0
                  ? `Analyzing ${aiAnalysisProgress.total} supplier profiles...`
                  : "Preparing analysis..."}
              </p>

              {/* Animated dots */}
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "1.5rem" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: "10px", height: "10px",
                    borderRadius: "50%",
                    background: "#5D2A0A",
                    animation: `dotBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                  }} />
                ))}
              </div>

              {/* What's happening */}
              <div style={{
                background: "#FFF8F5",
                border: "1px solid #E8D5C4",
                borderRadius: "8px",
                padding: "1rem",
                textAlign: "left",
              }}>
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.75rem", fontWeight: "600", color: "#5D2A0A" }}>
                  What's happening right now:
                </p>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#7D5A50" }}>
                  <li style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Reading each supplier's full product & service profile</li>
                  <li style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Comparing against your specific request semantically</li>
                  <li style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Scoring capability alignment & generating explanations</li>
                  <li style={{ fontSize: "0.75rem" }}>Caching results so future loads are instant</li>
                </ul>
              </div>

              <p style={{ margin: "1.25rem 0 0 0", fontSize: "0.7rem", color: "#A67C52" }}>
                ⏱ This may take 30–60 seconds for large supplier lists
              </p>
            </div>
          </div>,
          document.body
        )}

        <div style={{ marginBottom: "2rem" }}>
          {/* Current Request Section */}
          <div style={{
            background: "#FEFCFA",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid #E8D5C4",
            marginBottom: "1rem"
          }}>
            {/* Table Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ color: "#5D2A0A", margin: 0 }}>
                {hasPreviousContacts ? "Combined Matches" : "Current Request"}
              </h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {renderNewRequestButton()}
                {/* Other buttons remain the same */}
                <button
                  onClick={runSecondaryAiAnalysis}
                  disabled={isAiAnalyzing || filteredSuppliers.length === 0 || !currentUserApplication}
                  style={{
                    ...filterButtonStyle,
                    background: isAiAnalyzing ? "#E8D5C4" : "#5D2A0A",
                    color: isAiAnalyzing ? "#5D2A0A" : "white",
                    opacity: (filteredSuppliers.length === 0 || !currentUserApplication) ? 0.5 : 1,
                    cursor: (isAiAnalyzing || filteredSuppliers.length === 0 || !currentUserApplication) ? "not-allowed" : "pointer"
                  }}
                >
                  <Brain size={16} />
                  {isAiAnalyzing ? "Analyzing..." : "AI Analysis"}
                </button>
                <button onClick={() => setShowFilters(true)} style={filterButtonStyle}>
                  <Filter size={16} />
                  Filter
                </button>
                {contactedApplications.length > 0 && (
                  <button
                    onClick={() => setShowContactedApplications(!showContactedApplications)}
                    style={{
                      background: "#5D2A0A",
                      color: "white",
                      border: "1px solid #5D2A0A",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <History size={16} />
                    {showContactedApplications ? "Hide" : "Show"} Contacted ({contactedApplications.length})
                  </button>
                )}
              </div>
            </div>

            {/* Legend */}
            {showLegend && renderLegend()}

            {/* Error Display */}
            {aiAnalysisError && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#DC2626",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem"
                }}
              >
                <AlertCircle size={16} />
                {aiAnalysisError}
              </div>
            )}

            {/* Table Structure - UPDATED WITH NEW COLUMN */}
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <colgroup>
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "10%" }} /> {/* Increased width for service required */}
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "8%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Supplier Name</th>
                    <th style={tableHeaderStyle}>Location</th>
                    <th style={tableHeaderStyle}>Sector Focus</th>
                    <th style={tableHeaderStyle}>BBBEE Level</th>
                    <th style={tableHeaderStyle}>Revenue</th>
                    <th style={tableHeaderStyle}>Category</th>
                    <th style={tableHeaderStyle}>Service Required</th>
                    <th style={tableHeaderStyle}>Urgency</th>
                    <th style={tableHeaderStyle}>Match %</th>
                    <th style={tableHeaderStyle}>Secondary Match %</th>
                    <th style={tableHeaderStyle}>Action</th>
                    <th style={{ ...tableHeaderStyle, borderRight: "none" }}>Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {renderSupplierRows()} {/* Use the new render function */}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "1rem",
                padding: "1rem",
                background: "#FEFCFA",
                borderRadius: "8px",
                border: "1px solid #E8D5C4",
              }}
            >
              <div style={{ color: "#5D2A0A", fontSize: "0.875rem" }}>
                Showing {filteredSuppliers.length} of {suppliers.length} suppliers
                {Object.keys(secondaryMatchData).length > 0 && (
                  <span style={{ marginLeft: "1rem", color: "#8D6E63" }}>
                    • AI Analysis: {Object.keys(secondaryMatchData).length} suppliers
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#F5EBE0",
                    color: "#5D2A0A",
                    border: "1px solid #E8D5C4",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Previous
                </button>
                <span style={{ color: "#5D2A0A", fontSize: "0.875rem" }}>Page 1 of 1</span>
                <button
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#F5EBE0",
                    color: "#5D2A0A",
                    border: "1px solid #E8D5C4",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* NEW: Secondary Match Breakdown Modal */}
          {mounted &&
            showSecondaryBreakdown &&
            createPortal(
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    maxWidth: "800px",
                    width: "95%",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                  }}
                >
                  <div style={modalHeaderStyle}>
                    <h3 style={modalTitleStyle}>
                      AI Semantic Match -{" "}
                      {secondaryBreakdownData?.supplier?.entityOverview?.tradingName ||
                        secondaryBreakdownData?.supplier?.entityOverview?.registeredName}
                    </h3>
                    <button onClick={() => setShowSecondaryBreakdown(false)} style={modalCloseButtonStyle}>
                      ✖
                    </button>
                  </div>

                  <div style={modalBodyStyle}>
                    {secondaryBreakdownData?.secondaryScore === null || secondaryBreakdownData?.secondaryScore === undefined ? (
                      <div>
                        <div style={{ textAlign: "center", padding: "2rem", background: "#FFF8E1", borderRadius: "8px", border: "1px solid #FFE0B2", marginBottom: "1.5rem" }}>
                          <Brain size={48} color="#F57C00" style={{ marginBottom: "1rem" }} />
                          <h3 style={{ color: "#5D2A0A", marginBottom: "0.5rem" }}>AI Analysis Pending</h3>
                          <p style={{ color: "#7D5A50", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                            Click <strong>"AI Analysis"</strong> to run semantic analysis on all {allSuppliers.length} suppliers.
                          </p>
                          <button onClick={() => { setShowSecondaryBreakdown(false); runSecondaryAiAnalysis(); }}
                            style={{ padding: "0.75rem 1.5rem", background: "#5D2A0A", color: "white", border: "none", borderRadius: "6px", fontSize: "0.875rem", fontWeight: "600", cursor: "pointer" }}>
                            Run AI Analysis Now
                          </button>
                        </div>
                        <div style={{ background: "#FEFCFA", border: "1px solid #E8D5C4", borderRadius: "8px", padding: "1.5rem" }}>
                          <h4 style={{ color: "#5D2A0A", marginBottom: "1rem", fontSize: "0.875rem" }}>
                            Current Primary Match Score: <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: secondaryBreakdownData?.primaryScore >= 75 ? "#48BB78" : secondaryBreakdownData?.primaryScore >= 50 ? "#F6AD55" : "#F56565" }}>{secondaryBreakdownData?.primaryScore}%</span>
                          </h4>
                          <p style={{ fontSize: "0.75rem", color: "#8D6E63", margin: 0 }}>Based on structured data matching (category, location, BBBEE, budget, delivery mode). AI analysis adds semantic understanding of actual service alignment.</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* TOP SCORE SUMMARY */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "2rem", paddingBottom: "1rem", borderBottom: "2px solid #E8D5C4" }}>
                          <div style={{ textAlign: "center", background: "#F8F5F0", borderRadius: "8px", padding: "1rem" }}>
                            <div style={{ fontSize: "2rem", fontWeight: "bold", color: getMatchScoreClass(secondaryBreakdownData?.primaryScore).color, marginBottom: "0.25rem" }}>
                              {secondaryBreakdownData?.primaryScore}%
                            </div>
                            <p style={{ fontSize: "0.8rem", fontWeight: "600", color: "#5D2A0A", margin: "0 0 0.25rem 0" }}>Primary Match</p>
                            <p style={{ fontSize: "0.7rem", color: "#8D6E63", margin: 0 }}>Structured Data Scoring</p>
                          </div>
                          <div style={{ textAlign: "center", background: "#F8F5F0", borderRadius: "8px", padding: "1rem" }}>
                            <div style={{ fontSize: "2rem", fontWeight: "bold", color: getSecondaryMatchColor(secondaryBreakdownData?.secondaryScore), marginBottom: "0.25rem" }}>
                              {secondaryBreakdownData?.secondaryScore}%
                            </div>
                            <p style={{ fontSize: "0.8rem", fontWeight: "600", color: "#5D2A0A", margin: "0 0 0.25rem 0" }}>AI Semantic Match</p>
                            <p style={{ fontSize: "0.7rem", color: "#8D6E63", margin: 0 }}>Context & Meaning Analysis</p>
                          </div>
                          <div style={{ textAlign: "center", background: "#5D2A0A", borderRadius: "8px", padding: "1rem" }}>
                            <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "white", marginBottom: "0.25rem" }}>
                              {calculateCombinedMatchScore(secondaryBreakdownData?.primaryScore, secondaryBreakdownData?.secondaryScore)}%
                            </div>
                            <p style={{ fontSize: "0.8rem", fontWeight: "600", color: "#E8D5C4", margin: "0 0 0.25rem 0" }}>Combined Match</p>
                            <p style={{ fontSize: "0.7rem", color: "#E8D5C4", margin: 0 }}>60% AI + 40% Primary</p>
                          </div>
                        </div>

                        {/* PRIMARY MATCH DETAILED BREAKDOWN */}
                        <div style={{ background: "#FEFCFA", border: "1px solid #E8D5C4", borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem" }}>
                          <h4 style={{ fontSize: "1rem", fontWeight: "600", color: "#5D2A0A", margin: "0 0 1.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            📊 Primary Match Breakdown — What We Analyzed
                          </h4>
                          <p style={{ fontSize: "0.75rem", color: "#8D6E63", margin: "0 0 1rem 0" }}>
                            These are the structured data criteria we compare between your application and this supplier's profile:
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {secondaryBreakdownData?.supplier?.matchDetails && Object.entries(secondaryBreakdownData.supplier.matchDetails).map(([key, details]) => {
                              const criteriaInfo = ENHANCED_MATCHING_CRITERIA[key];
                              const weight = criteriaInfo ? criteriaInfo.weight * 100 : 0;
                              const score = Math.round(details.score);
                              const scoreColor = score >= 75 ? "#388E3C" : score >= 50 ? "#F57C00" : "#D32F2F";
                              const getStatusIcon = (s) => s >= 75 ? "✅" : s >= 50 ? "⚠️" : "❌";
                              const getStatusLabel = (s) => s >= 75 ? "Good match" : s >= 50 ? "Partial match" : "Poor match";

                              const getCriteriaExplanation = (k, s, supplier, application) => {
                                const sup = secondaryBreakdownData?.supplier;
                                switch (k) {
                                  case 'categoryMatch':
                                    return s >= 75
                                      ? `The supplier's product/service categories align well with your requested categories.${details.matches?.length > 0 ? ` Matched: ${details.matches.slice(0, 3).join(", ")}` : ""}`
                                      : s >= 40
                                        ? `Partial category overlap found.${details.matches?.length > 0 ? ` Some matches: ${details.matches.slice(0, 2).join(", ")}` : " Limited category alignment detected."}`
                                        : `No strong category match. The supplier's listed categories don't align with what you requested.`;
                                  case 'bbbeeMatch':
                                    const bbbeeLevel = sup?.legalCompliance?.bbbeeLevel || "N/A";
                                    return s >= 75
                                      ? `Supplier BBBEE level (${bbbeeLevel}) meets or exceeds your requirement.`
                                      : s >= 50
                                        ? `Supplier BBBEE level (${bbbeeLevel}) is close to your preferred level but not exact.`
                                        : `Supplier BBBEE level (${bbbeeLevel}) does not meet your transformation requirement.`;
                                  case 'locationMatch':
                                    const loc = sup?.entityOverview?.location || "Not specified";
                                    return s >= 75
                                      ? `Supplier is located in ${loc}, which matches your geographic preference.`
                                      : s >= 40
                                        ? `Supplier location (${loc}) is nearby or in the same region as your preference.`
                                        : `Supplier is in ${loc}, which doesn't match your preferred location.`;
                                  case 'deliveryMatch':
                                    const modes = sup?.productsServices?.deliveryModes?.join(", ") || "Not specified";
                                    return s >= 75
                                      ? `Supplier delivery modes (${modes}) match your required delivery preferences.`
                                      : s >= 40
                                        ? `Supplier offers some compatible delivery modes (${modes}) but not all you require.`
                                        : `Supplier delivery modes (${modes}) don't match your requirements.`;
                                  case 'budgetMatch':
                                    const revenue = sup?.financialOverview?.annualRevenue || "Not specified";
                                    return s >= 75
                                      ? `Supplier's revenue (${revenue}) indicates capacity within your budget range.`
                                      : s >= 40
                                        ? `Supplier's revenue (${revenue}) is somewhat aligned with your budget, but may be outside your ideal range.`
                                        : `Supplier's revenue (${revenue}) suggests a capacity mismatch with your budget range.`;
                                  case 'ownershipMatch':
                                    return s >= 75
                                      ? `Supplier's ownership profile meets your transformation/ownership preferences.`
                                      : s >= 40
                                        ? `Supplier partially meets your ownership preferences.`
                                        : `Supplier ownership profile doesn't strongly match your preferences.`;
                                  case 'ratingMatch':
                                    const rating = sup?.rating || 0;
                                    const ratingCount = sup?.ratingCount || 0;
                                    return ratingCount === 0
                                      ? `No ratings yet — this supplier has not been reviewed on the platform.`
                                      : `Supplier has an average rating of ${rating.toFixed(1)}/5 based on ${ratingCount} review(s).`;
                                  case 'experienceMatch':
                                    return `Sector experience match is estimated at 50% (detailed experience data not yet fully captured in profile).`;
                                  case 'urgencyLeadTimeMatch':
                                    const urgency = sup?.applicationOverview?.urgency || sup?.urgency || "Not specified";
                                    return `Supplier's typical lead time (${urgency}) compared to your urgency requirement.`;
                                  default:
                                    return details.description || "No additional detail available.";
                                }
                              };

                              return (
                                <div key={key} style={{ background: "#F8F5F0", borderRadius: "6px", padding: "0.75rem 1rem", borderLeft: `4px solid ${scoreColor}` }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                      <span style={{ fontSize: "0.85rem" }}>{getStatusIcon(score)}</span>
                                      <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "#5D2A0A" }}>{details.description}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                      <span style={{ fontSize: "0.7rem", color: "#8D6E63" }}>Weight: {weight}%</span>
                                      <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: scoreColor }}>{score}%</span>
                                    </div>
                                  </div>
                                  <div style={{ background: "#E8D5C4", borderRadius: "3px", height: "5px", marginBottom: "0.5rem" }}>
                                    <div style={{ height: "100%", background: scoreColor, width: `${score}%`, borderRadius: "3px", transition: "width 0.3s ease" }} />
                                  </div>
                                  <p style={{ fontSize: "0.75rem", color: "#5D2A0A", margin: "0 0 0.25rem 0", lineHeight: "1.4" }}>
                                    {getCriteriaExplanation(key, score)}
                                  </p>
                                  <span style={{ fontSize: "0.7rem", color: "#8D6E63" }}>
                                    {getStatusLabel(score)} · Contributes {Math.round((score * weight) / 100)}% to total primary score
                                  </span>
                                  {/* Show matched categories chips */}
                                  {key === 'categoryMatch' && details.matches && details.matches.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.5rem" }}>
                                      {details.matches.map((m, i) => (
                                        <span key={i} style={{ background: "#E8F5E8", color: "#388E3C", padding: "0.2rem 0.5rem", borderRadius: "10px", fontSize: "0.65rem", border: "1px solid #C8E6C9" }}>{m}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* AI SEMANTIC ANALYSIS */}
                        <div style={{ background: "#FEFCFA", border: "1px solid #E8D5C4", borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem" }}>
                          <h4 style={{ fontSize: "1rem", fontWeight: "600", color: "#5D2A0A", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Brain size={18} />
                            AI Semantic Analysis — Why this score?
                          </h4>
                          <div style={{ background: "#F8F5F0", borderRadius: "6px", padding: "1rem", marginBottom: "1rem", borderLeft: "4px solid #5D2A0A" }}>
                            <p style={{ fontSize: "0.875rem", lineHeight: "1.7", color: "#5D2A0A", margin: 0, whiteSpace: "pre-wrap" }}>
                              {secondaryBreakdownData?.reasoning || "No reasoning provided."}
                            </p>
                          </div>
                          <p style={{ fontSize: "0.7rem", color: "#8D6E63", margin: 0 }}>
                            The AI reads the supplier's actual product/service descriptions and compares them semantically to your request — going beyond category tags to understand real-world capability alignment.
                          </p>
                        </div>

                        {/* MATCHED CAPABILITIES */}
                        {secondaryBreakdownData?.capabilities && secondaryBreakdownData.capabilities.length > 0 && (
                          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem" }}>
                            <h4 style={{ fontSize: "1rem", fontWeight: "600", color: "#166534", margin: "0 0 0.75rem 0" }}>✅ Matched Capabilities</h4>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                              {secondaryBreakdownData.capabilities.map((cap, i) => (
                                <span key={i} style={{ background: "#DCFCE7", color: "#166534", padding: "0.4rem 0.75rem", borderRadius: "16px", fontSize: "0.75rem", fontWeight: "500", border: "1px solid #BBF7D0" }}>{cap}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* GAPS / WHY NOT HIGHER */}
                        {secondaryBreakdownData?.secondaryScore < 75 && (
                          <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem" }}>
                            <h4 style={{ fontSize: "1rem", fontWeight: "600", color: "#9A3412", margin: "0 0 0.75rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <TrendingUp size={18} />
                              Why isn't the AI score higher?
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#7C2D12" }}>
                              {secondaryBreakdownData?.secondaryScore < 40 && (
                                <li style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}>The supplier's listed products/services have <strong>limited or no overlap</strong> with your requested service category.</li>
                              )}
                              {secondaryBreakdownData?.secondaryScore >= 40 && secondaryBreakdownData?.secondaryScore < 75 && (
                                <li style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}>The supplier has <strong>some relevant capabilities</strong> but may serve a different target market or industry vertical.</li>
                              )}
                              <li style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}>The supplier's profile descriptions may be <strong>incomplete or use different terminology</strong> — view their full profile before deciding.</li>
                              <li style={{ fontSize: "0.875rem" }}>AI scoring is based solely on <strong>publicly listed profile information</strong> — the supplier may have unlisted capabilities.</li>
                            </ul>
                          </div>
                        )}

                        {/* IMPROVEMENT TIPS */}
                        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "8px", padding: "1.5rem" }}>
                          <h4 style={{ fontSize: "1rem", fontWeight: "600", color: "#1E40AF", margin: "0 0 0.75rem 0" }}>💡 How to improve this match</h4>
                          <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#1E3A8A" }}>
                            <li style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}>Add more detail to your service request description so AI can better match intent</li>
                            <li style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}>View the supplier's full profile — their actual offerings may align more than the score suggests</li>
                            <li style={{ fontSize: "0.875rem" }}>Re-run AI Analysis after updating your application criteria</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "center", paddingTop: "1.5rem", borderTop: "1px solid #E8D5C4", marginTop: "1.5rem" }}>
                      <button style={{ padding: "0.75rem 2rem", background: "#5D2A0A", color: "white", border: "none", borderRadius: "6px", fontSize: "0.875rem", fontWeight: "500", cursor: "pointer" }}
                        onClick={() => setShowSecondaryBreakdown(false)}>
                        Close Analysis
                      </button>
                    </div>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {/* Contacted Requests Section */}
          {showContactedApplications && contactedApplications.length > 0 && (
            <div style={{
              background: "#F9F5F0",
              padding: "1.5rem",
              borderRadius: "8px",
              border: "2px solid #D7CCC8",
              marginTop: "2rem"
            }}>
              <h3 style={{
                color: "#5D2A0A",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <History size={20} />
                Contacted Requests ({contactedApplications.length})
              </h3>

              {contactedApplications.map((contactedApp, index) => (
                <div key={contactedApp.id} style={{
                  background: "white",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  border: "2px solid #E8D5C4",
                  marginBottom: "1rem",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 8px rgba(93, 42, 10, 0.1)"
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(93, 42, 10, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(93, 42, 10, 0.1)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ color: "#5D2A0A", margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>
                        {contactedApp.data?.requestOverview?.purpose?.substring(0, 60) || "Product/Service Request"}...
                      </h4>

                      <div style={{ display: "flex", gap: "2rem", fontSize: "0.875rem", color: "#7D5A50", flexWrap: "wrap" }}>
                        <div>
                          <strong>Created:</strong> {new Date(contactedApp.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Total Matches:</strong> {contactedApp.matchCount} suppliers
                        </div>
                        <div>
                          <strong>Contacted:</strong> {contactedApp.contactedCount || 0} supplier(s)
                        </div>
                        <div>
                          <strong>Last Contact:</strong> {new Date(contactedApp.lastContacted).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Status:</strong>
                          <span style={{
                            color: contactedApp.contactedCount > 0 ? "#388E3C" : "#D32F2F",
                            fontWeight: "600",
                            marginLeft: "0.25rem"
                          }}>
                            {contactedApp.contactedCount > 0 ? "Active" : "No contacts"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => loadContactedRequest(contactedApp)}
                      style={{
                        background: "transparent",
                        color: "#5D2A0A",
                        border: "2px solid #5D2A0A",
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        transition: "all 0.2s",
                        whiteSpace: "nowrap"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "#5D2A0A";
                        e.target.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "transparent";
                        e.target.style.color = "#5D2A0A";
                      }}
                    >
                      Resume This Request
                    </button>
                  </div>

                  {/* Show contacted suppliers if any */}
                  {contactedApp.contactedSuppliers && contactedApp.contactedSuppliers.length > 0 && (
                    <div style={{
                      background: "#E8F5E8",
                      padding: "0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #C8E6C9",
                      fontSize: "0.8rem",
                      color: "#2E7D32"
                    }}>
                      <strong>Contacted Suppliers:</strong> {contactedApp.contactedCount} suppliers
                      <div style={{ marginTop: "0.25rem", fontSize: "0.75rem" }}>
                        (Supplier IDs: {contactedApp.contactedSuppliers.slice(0, 3).join(", ")}
                        {contactedApp.contactedSuppliers.length > 3 ? `... +${contactedApp.contactedSuppliers.length - 3} more` : ""})
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Match Breakdown Modal */}
        {mounted &&
          showMatchBreakdown &&
          createPortal(
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: "12px",
                  maxWidth: "800px",
                  width: "95%",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                }}
              >
                <div style={modalHeaderStyle}>
                  <h3 style={modalTitleStyle}>
                    Match Breakdown -{" "}
                    {matchBreakdownData?.entityOverview?.tradingName ||
                      matchBreakdownData?.entityOverview?.registeredName}
                  </h3>
                  <button onClick={() => setShowMatchBreakdown(false)} style={modalCloseButtonStyle}>
                    ✖
                  </button>
                </div>
                <div style={modalBodyStyle}>
                  {/* Overall Score Header */}
                  <div style={{ textAlign: "center", marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "2px solid #E8D5C4" }}>
                    <div style={{
                      fontSize: "3.5rem", fontWeight: "bold", lineHeight: 1,
                      color: matchBreakdownData?.matchPercentage >= 75 ? "#388E3C"
                        : matchBreakdownData?.matchPercentage >= 50 ? "#F57C00" : "#D32F2F",
                      marginBottom: "0.5rem"
                    }}>
                      {matchBreakdownData?.matchPercentage}%
                    </div>
                    <p style={{ fontSize: "1rem", color: "#8D6E63", margin: "0 0 0.5rem 0" }}>Overall Primary Match Score</p>
                    <p style={{ fontSize: "0.75rem", color: "#A67C52", margin: 0 }}>
                      Based on structured data: categories, location, BBBEE, budget, delivery mode & more
                    </p>
                  </div>

                  {/* Score Legend */}
                  <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", justifyContent: "center", flexWrap: "wrap" }}>
                    {[
                      { color: "#388E3C", label: "Strong match (75–100%)" },
                      { color: "#F57C00", label: "Partial match (50–74%)" },
                      { color: "#D32F2F", label: "Weak match (0–49%)" },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#5D2A0A" }}>
                        <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: item.color }} />
                        {item.label}
                      </div>
                    ))}
                  </div>

                  {/* Criteria Breakdown */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
                    {matchBreakdownData?.matchDetails && Object.entries(matchBreakdownData.matchDetails).map(([key, details]) => {
                      const score = details.score ?? 0;
                      const weight = details.weight ?? 0;
                      const contribution = details.contribution ?? 0;
                      const scoreColor = score >= 75 ? "#388E3C" : score >= 50 ? "#F57C00" : "#D32F2F";
                      const statusIcon = score >= 75 ? "✅" : score >= 50 ? "⚠️" : "❌";

                      // Human-readable explanation per criterion
                      const getExplanation = (k, s, data) => {
                        const sup = matchBreakdownData;
                        switch (k) {
                          case 'categoryMatch': {
                            const matched = data.matches || [];
                            const unmatched = data.unmatched || [];
                            if (matched.length === 0 && unmatched.length === 0) {
                              return "No categories were specified in your request to compare against.";
                            }
                            if (matched.length === 0) {
                              return `None of your requested categories (${unmatched.join(", ")}) were found in this supplier's profile.`;
                            }
                            if (unmatched.length === 0) {
                              return `All requested categories matched: ${matched.join(", ")}.`;
                            }
                            return `Matched ${matched.length} of ${matched.length + unmatched.length} categories. ✓ ${matched.join(", ")} | ✗ ${unmatched.join(", ")}`;
                          }
                          case 'bbbeeMatch': {
                            const level = sup?.legalCompliance?.bbbeeLevel || "N/A";
                            if (s === 50) return `No BBBEE preference was set in your request — neutral score applied. Supplier is Level ${level}.`;
                            if (s >= 75) return `Supplier BBBEE Level ${level} meets your requirement.`;
                            if (s >= 50) return `Supplier BBBEE Level ${level} is one level off your requirement.`;
                            return `Supplier BBBEE Level ${level} does not meet your requirement.`;
                          }
                          case 'locationMatch': {
                            const loc = sup?.entityOverview?.location || "Not specified";
                            if (s === 50) return `No location preference was set — neutral score applied. Supplier is based in ${loc}.`;
                            if (s >= 75) return `Supplier location (${loc}) matches your preference.`;
                            if (s >= 40) return `Supplier (${loc}) is in the same general region as your preference.`;
                            return `Supplier location (${loc}) does not match your preferred location.`;
                          }
                          case 'deliveryMatch': {
                            const modes = sup?.productsServices?.deliveryModes?.join(", ") || "Not specified";
                            if (s === 50) return `No delivery mode preference set — neutral score applied. Supplier offers: ${modes}.`;
                            if (s >= 75) return `Supplier delivery modes (${modes}) fully match your requirements.`;
                            if (s >= 40) return `Supplier (${modes}) partially matches your required delivery modes.`;
                            return `Supplier delivery modes (${modes}) do not match your requirements.`;
                          }
                          case 'budgetMatch': {
                            const revenue = sup?.financialOverview?.annualRevenue || "Not specified";
                            if (s === 50) return `No budget range set — neutral score applied. Supplier revenue: ${revenue}.`;
                            if (s >= 75) return `Supplier revenue (${revenue}) is within your specified budget range.`;
                            if (s >= 40) return `Supplier revenue (${revenue}) is slightly outside your budget range.`;
                            return `Supplier revenue (${revenue}) is significantly outside your budget range.`;
                          }
                          case 'ownershipMatch': {
                            if (s === 50) return "No ownership preferences were set — neutral score applied.";
                            if (s >= 75) return "Supplier's ownership profile meets your transformation preferences.";
                            return "Supplier partially meets your ownership preferences.";
                          }
                          case 'ratingMatch': {
                            const rating = sup?.rating || 0;
                            const count = sup?.ratingCount || 0;
                            if (count === 0) return "This supplier has not been rated yet on the platform.";
                            return `Supplier has ${rating.toFixed(1)}/5 stars based on ${count} review(s).`;
                          }
                          case 'experienceMatch':
                            return "Sector experience is estimated — detailed experience data not yet fully captured in this supplier's profile.";
                          case 'urgencyLeadTimeMatch': {
                            const urgency = sup?.urgency || sup?.applicationOverview?.urgency || "Not specified";
                            return `Supplier's typical lead time is ${urgency}. This is compared to your urgency requirement.`;
                          }
                          default:
                            return "No additional detail available.";
                        }
                      };

                      return (
                        <div key={key} style={{
                          background: "#FEFCFA",
                          border: `1px solid ${scoreColor}30`,
                          borderLeft: `5px solid ${scoreColor}`,
                          borderRadius: "8px",
                          padding: "1rem",
                        }}>
                          {/* Row 1: Label + Score */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span>{statusIcon}</span>
                              <span style={{ fontWeight: "600", fontSize: "0.875rem", color: "#5D2A0A" }}>
                                {details.description}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                              <span style={{ fontSize: "0.7rem", color: "#8D6E63" }}>
                                Weight: <strong>{weight}%</strong>
                              </span>
                              <span style={{ fontSize: "0.7rem", color: "#8D6E63" }}>
                                Contributes: <strong>+{contribution}%</strong>
                              </span>
                              <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: scoreColor }}>
                                {score}%
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div style={{ background: "#E8D5C4", borderRadius: "4px", height: "7px", marginBottom: "0.6rem" }}>
                            <div style={{
                              height: "100%", borderRadius: "4px",
                              background: scoreColor,
                              width: `${score}%`,
                              transition: "width 0.4s ease"
                            }} />
                          </div>

                          {/* Explanation */}
                          <p style={{ fontSize: "0.8rem", color: "#5D2A0A", margin: "0 0 0.35rem 0", lineHeight: "1.5" }}>
                            {getExplanation(key, score, details)}
                          </p>

                          {/* Category chips for category match */}
                          {key === 'categoryMatch' && details.matches && details.matches.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.4rem" }}>
                              {details.matches.map((m, i) => (
                                <span key={i} style={{
                                  background: "#E8F5E8", color: "#388E3C",
                                  padding: "0.2rem 0.5rem", borderRadius: "10px",
                                  fontSize: "0.7rem", border: "1px solid #C8E6C9"
                                }}>✓ {m}</span>
                              ))}
                              {(details.unmatched || []).map((m, i) => (
                                <span key={`u-${i}`} style={{
                                  background: "#FFEBEE", color: "#D32F2F",
                                  padding: "0.2rem 0.5rem", borderRadius: "10px",
                                  fontSize: "0.7rem", border: "1px solid #FFCDD2"
                                }}>✗ {m}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Score formula note */}
                  <div style={{
                    background: "#F8F5F0", border: "1px solid #E8D5C4",
                    borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem",
                    fontSize: "0.75rem", color: "#5D2A0A", lineHeight: "1.6"
                  }}>
                    <strong>📊 How this score is calculated:</strong><br />
                    Each criterion has a weight (shown above). The score for each criterion (0–100%) is multiplied by its weight and summed to produce the overall match %. For example, Category Alignment (weight 40%) scoring 75% contributes 30% to the total.
                  </div>

                  {/* Improvement section - only show criteria scoring below 75% */}
                  {matchBreakdownData?.matchDetails && Object.entries(matchBreakdownData.matchDetails).some(([, d]) => (d.score ?? 0) < 75) && (
                    <div style={{
                      background: "#FFF3E0", border: "1px solid #FFE0B2",
                      borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem"
                    }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: "600", color: "#5D2A0A", margin: "0 0 1rem 0" }}>
                        🔧 How to Improve This Match Score
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        {Object.entries(matchBreakdownData.matchDetails)
                          .filter(([, d]) => (d.score ?? 0) < 75)
                          .sort(([, a], [, b]) => (b.weight ?? 0) - (a.weight ?? 0)) // highest weight first
                          .map(([key, details]) => {
                            const suggestions = {
                              categoryMatch: "Expand your service/product categories in your profile to include more relevant terms that align with customer needs.",
                              bbbeeMatch: "Improve your BBBEE certification level — even moving one level has a significant impact on matching.",
                              locationMatch: "Add remote or national delivery capability to your profile if you can serve clients outside your base location.",
                              deliveryMatch: "Add more delivery modes (on-site, remote, hybrid) to broaden your compatibility with customer preferences.",
                              budgetMatch: "Ensure your annual revenue and pricing tiers are accurately reflected in your financial profile.",
                              ownershipMatch: "Ensure your ownership demographics (Black-owned, Women-owned, Youth-owned) are fully captured in your profile.",
                              ratingMatch: "Encourage satisfied clients to leave reviews on the platform to improve your rating score.",
                              experienceMatch: "Add detailed sector experience, case studies, and client names to your profile.",
                              urgencyLeadTimeMatch: "Update your profile to reflect your actual delivery lead times and availability.",
                            };
                            return (
                              <div key={key} style={{
                                background: "white", border: "1px solid #E8D5C4",
                                borderRadius: "6px", padding: "0.75rem",
                                display: "flex", gap: "0.75rem", alignItems: "flex-start"
                              }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#F57C00", whiteSpace: "nowrap" }}>
                                  {details.weight}% weight
                                </span>
                                <div>
                                  <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#D32F2F", marginBottom: "0.2rem" }}>
                                    {details.description} — currently {details.score}%
                                  </div>
                                  <div style={{ fontSize: "0.78rem", color: "#5D2A0A", lineHeight: "1.4" }}>
                                    {suggestions[key] || "Review your profile to ensure all relevant information is complete and accurate."}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "center", paddingTop: "1.5rem", borderTop: "1px solid #E8D5C4" }}>
                    <button
                      style={{ padding: "0.75rem 2rem", background: "#5D2A0A", color: "white", border: "none", borderRadius: "6px", fontSize: "0.875rem", fontWeight: "500", cursor: "pointer" }}
                      onClick={() => setShowMatchBreakdown(false)}
                    >
                      Close Breakdown
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}

        {/* Filter Modal */}
        {mounted &&
          showFilters &&
          createPortal(
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: "12px",
                  maxWidth: "1000px",
                  width: "95%",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                }}
              >
                <div style={modalHeaderStyle}>
                  <h3 style={modalTitleStyle}>Filter Suppliers</h3>
                  <button onClick={() => setShowFilters(false)} style={modalCloseButtonStyle}>
                    ✖
                  </button>
                </div>
                <div style={modalBodyStyle}>
                  <div
                    style={{
                      textAlign: "center",
                      marginBottom: "2rem",
                      paddingBottom: "1rem",
                      borderBottom: "2px solid #E8D5C4",
                    }}
                  >
                    <h1
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        color: "#5D2A0A",
                        margin: "0 0 0.5rem 0",
                      }}
                    >
                      Filter Suppliers
                    </h1>
                    <p
                      style={{
                        fontSize: "1rem",
                        color: "#8D6E63",
                        margin: "0",
                      }}
                    >
                      Find the perfect suppliers for your business needs
                    </p>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "1.5rem",
                      marginBottom: "2rem",
                    }}
                  >
                    <div style={filterCardStyle}>
                      <h3 style={filterTitleStyle}>📍 Location</h3>
                      <select
                        style={filterSelectStyle}
                        value={filters.location}
                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                      >
                        <option value="">Select Location</option>
                        {["South Africa", "Johannesburg", "Cape Town", "Durban", "Pretoria", "Bloemfontein"].map(
                          (loc) => (
                            <option key={loc} value={loc}>
                              {loc}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div style={filterCardStyle}>
                      <h3 style={filterTitleStyle}>🎯 Match Score Minimum</h3>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={filters.matchScore}
                          onChange={(e) => setFilters({ ...filters, matchScore: Number.parseInt(e.target.value) })}
                          style={{
                            width: "100%",
                            height: "6px",
                            background: "#E8D5C4",
                            borderRadius: "3px",
                            outline: "none",
                            appearance: "none",
                          }}
                        />
                        <div
                          style={{
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#5D2A0A",
                            fontSize: "0.875rem",
                          }}
                        >
                          {filters.matchScore}%
                        </div>
                      </div>
                    </div>

                    <div style={filterCardStyle}>
                      <h3 style={filterTitleStyle}>💰 Contract Value Range</h3>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="text"
                          placeholder="Min Amount"
                          style={filterInputStyle}
                          value={filters.minValue}
                          onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Max Amount"
                          style={filterInputStyle}
                          value={filters.maxValue}
                          onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={filterCardStyle}>
                      <h3 style={filterTitleStyle}>🏢 Entity Type</h3>
                      <select
                        style={filterSelectStyle}
                        value={filters.entityType}
                        onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                      >
                        <option value="">Select Entity Type</option>
                        {["Pty Ltd", "CC", "NGO", "Co-op", "Sole Proprietor", "Partnership"].map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={filterCardStyle}>
                      <h3 style={filterTitleStyle}>🏭 Industry/Sector</h3>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                          maxHeight: "200px",
                          overflowY: "auto",
                        }}
                      >
                        {[
                          "Agriculture",
                          "Mining",
                          "Manufacturing",
                          "Energy",
                          "Construction",
                          "Retail",
                          "Transport",
                          "Finance",
                          "Real Estate",
                          "ICT",
                          "Tourism",
                          "Education",
                          "Health",
                          "Arts",
                          "Other Services",
                        ].map((sector) => (
                          <div
                            key={sector}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <input
                              type="checkbox"
                              id={`sector-${sector}`}
                              checked={filters.sectors.includes(sector)}
                              onChange={() => {
                                const newSectors = filters.sectors.includes(sector)
                                  ? filters.sectors.filter((s) => s !== sector)
                                  : [...filters.sectors, sector]
                                setFilters({ ...filters, sectors: newSectors })
                              }}
                              style={{
                                width: "16px",
                                height: "16px",
                                accentColor: "#5D2A0A",
                              }}
                            />
                            <label
                              htmlFor={`sector-${sector}`}
                              style={{
                                fontSize: "0.875rem",
                                color: "#5D2A0A",
                                cursor: "pointer",
                              }}
                            >
                              {sector}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={filterCardStyle}>
                      <h3 style={filterTitleStyle}>⭐ BBBEE Level</h3>
                      <select
                        style={filterSelectStyle}
                        value={filters.bbbeeLevel}
                        onChange={(e) => setFilters({ ...filters, bbbeeLevel: e.target.value })}
                      >
                        <option value="">Select BBBEE Level</option>
                        {[
                          "Level 1",
                          "Level 2",
                          "Level 3",
                          "Level 4",
                          "Level 5",
                          "Level 6",
                          "Level 7",
                          "Level 8",
                          "Non-Compliant",
                        ].map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={filterCardStyle}>
                      <h3 style={filterTitleStyle}>📦 Procurement Category</h3>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        {["Services", "Goods", "Construction", "Professional Services", "IT Solutions"].map(
                          (category) => (
                            <div
                              key={category}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <input
                                type="checkbox"
                                id={`proc-${category}`}
                                checked={filters.procurementCategories.includes(category)}
                                onChange={() => {
                                  const newCategories = filters.procurementCategories.includes(category)
                                    ? filters.procurementCategories.filter((c) => c !== category)
                                    : [...filters.procurementCategories, category]
                                  setFilters({ ...filters, procurementCategories: newCategories })
                                }}
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  accentColor: "#5D2A0A",
                                }}
                              />
                              <label
                                htmlFor={`proc-${category}`}
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#5D2A0A",
                                  cursor: "pointer",
                                }}
                              >
                                {category}
                              </label>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div style={filterCardStyle}>
                      <h3 style={filterTitleStyle}>⏰ Availability</h3>
                      <select
                        style={filterSelectStyle}
                        value={filters.availability}
                        onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                      >
                        <option value="">Select Availability</option>
                        {["Immediate", "Within 1 week", "Within 1 month", "Within 3 months", "Custom"].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={filterCardStyle}>
                      <h3 style={filterTitleStyle}>🔄 Sort By</h3>
                      <select
                        style={filterSelectStyle}
                        value={filters.sortBy}
                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                      >
                        <option value="">Select Sort Option</option>
                        {[
                          "Match Score (High to Low)",
                          "Match Score (Low to High)",
                          "Rating (High to Low)",
                          "Rating (Low to High)",
                          "Date Added (Newest First)",
                          "Date Added (Oldest First)",
                        ].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "1rem",
                      paddingTop: "1.5rem",
                      borderTop: "1px solid #E8D5C4",
                    }}
                  >
                    <button
                      style={{
                        flex: "1",
                        padding: "0.75rem 1.5rem",
                        background: "#F5EBE0",
                        color: "#5D2A0A",
                        border: "1px solid #E8D5C4",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onClick={clearAllFilters}
                    >
                      Clear All Filters
                    </button>
                    <button
                      style={{
                        flex: "1",
                        padding: "0.75rem 1.5rem",
                        background: "#5D2A0A",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onClick={() => setShowFilters(false)}
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}

        {/* Supplier Details Modal */}
        {mounted && showModal && modalContent.type === "supplier-details" && (
          <SupplierDetailsModal
            supplier={modalContent.supplier}
            isOpen={showModal}
            onClose={() => setShowModal(false)}
          />
        )}

        {/* Keep your existing modals for other types */}
        {mounted && showModal && modalContent.type === "documents" && (
          createPortal(
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: "12px",
                  maxWidth: "600px",
                  width: "90%",
                  maxHeight: "80vh",
                  overflowY: "auto",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                }}
              >
                <div style={modalHeaderStyle}>
                  <h3 style={modalTitleStyle}>Supplier Documents</h3>
                  <button onClick={() => setShowModal(false)} style={modalCloseButtonStyle}>
                    ✖
                  </button>
                </div>
                <div style={modalBodyStyle}>
                  <div>
                    <p style={{ marginBottom: "1rem", color: "#5D2A0A" }}>
                      Documents for{" "}
                      <strong>
                        {modalContent.supplier?.entityOverview?.tradingName ||
                          modalContent.supplier?.entityOverview?.registeredName}
                      </strong>
                      :
                    </p>
                    <ul
                      style={{
                        listStyle: "none",
                        padding: "0",
                        margin: "0 0 1.5rem 0",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <li
                        style={{ padding: "0.75rem", background: "#F5EBE0", borderRadius: "4px", fontSize: "0.875rem" }}
                      >
                        📄 Company Profile.pdf
                      </li>
                      <li
                        style={{ padding: "0.75rem", background: "#F5EBE0", borderRadius: "4px", fontSize: "0.875rem" }}
                      >
                        📄 BBBEE Certificate.pdf
                      </li>
                      <li
                        style={{ padding: "0.75rem", background: "#F5EBE0", borderRadius: "4px", fontSize: "0.875rem" }}
                      >
                        📄 Tax Compliance.pdf
                      </li>
                      <li
                        style={{ padding: "0.75rem", background: "#F5EBE0", borderRadius: "4px", fontSize: "0.875rem" }}
                      >
                        📄 References.pdf
                      </li>
                      <li
                        style={{ padding: "0.75rem", background: "#F5EBE0", borderRadius: "4px", fontSize: "0.875rem" }}
                      >
                        📄 Service Portfolio.pdf
                      </li>
                      <li
                        style={{ padding: "0.75rem", background: "#F5EBE0", borderRadius: "4px", fontSize: "0.875rem" }}
                      >
                        📄 Case Studies.pdf
                      </li>
                    </ul>
                    <div style={modalActionsStyle}>
                      <button style={primaryButtonStyle}>Download All</button>
                      <button style={cancelButtonStyle} onClick={() => setShowModal(false)}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        )}

        {mounted && showModal && modalContent.type === "message" && (
          createPortal(
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: "12px",
                  maxWidth: "600px",
                  width: "90%",
                  maxHeight: "80vh",
                  overflowY: "auto",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                }}
              >
                <div style={modalHeaderStyle}>
                  <h3 style={modalTitleStyle}>Send Message</h3>
                  <button onClick={() => setShowModal(false)} style={modalCloseButtonStyle}>
                    ✖
                  </button>
                </div>
                <div style={modalBodyStyle}>
                  <div>
                    <p style={{ marginBottom: "1rem", color: "#5D2A0A" }}>
                      Send a message to{" "}
                      <strong>
                        {modalContent.supplier?.entityOverview?.tradingName ||
                          modalContent.supplier?.entityOverview?.registeredName}
                      </strong>
                      :
                    </p>
                    <textarea
                      style={{
                        width: "100%",
                        minHeight: "120px",
                        padding: "0.75rem",
                        border: "1px solid #E8D5C4",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        fontFamily: "inherit",
                        resize: "vertical",
                        background: "#FEFCFA",
                        marginBottom: "1.5rem",
                      }}
                      placeholder="Type your message here..."
                      rows={4}
                    />
                    <div style={modalActionsStyle}>
                      <button style={primaryButtonStyle}>Send Message</button>
                      <button style={cancelButtonStyle} onClick={() => setShowModal(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        )}

        {mounted && showModal && modalContent.type === "call" && (
          createPortal(
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: "12px",
                  maxWidth: "600px",
                  width: "90%",
                  maxHeight: "80vh",
                  overflowY: "auto",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                }}
              >
                <div style={modalHeaderStyle}>
                  <h3 style={modalTitleStyle}>Call Supplier</h3>
                  <button onClick={() => setShowModal(false)} style={modalCloseButtonStyle}>
                    ✖
                  </button>
                </div>
                <div style={modalBodyStyle}>
                  <div>
                    <p style={{ marginBottom: "1rem", color: "#5D2A0A" }}>
                      Call{" "}
                      <strong>
                        {modalContent.supplier?.entityOverview?.tradingName ||
                          modalContent.supplier?.entityOverview?.registeredName}
                      </strong>
                      :
                    </p>
                    <div
                      style={{
                        padding: "1rem",
                        background: "#F5EBE0",
                        borderRadius: "8px",
                        marginBottom: "1.5rem",
                        border: "1px solid #E8D5C4",
                      }}
                    >
                      <p style={{ margin: "0.25rem 0", color: "#5D2A0A" }}>Primary Contact: John Smith</p>
                      <p style={{ margin: "0.25rem 0", color: "#5D2A0A" }}>Phone: +27 12 345 6789</p>
                      <p style={{ margin: "0.25rem 0", color: "#5D2A0A" }}>
                        Email: contact@
                        {(modalContent.supplier?.entityOverview?.tradingName || "supplier")
                          .toLowerCase()
                          .replace(/\s/g, "")}
                        .com
                      </p>
                    </div>
                    <div style={modalActionsStyle}>
                      <button style={primaryButtonStyle}>Dial Now</button>
                      <button style={cancelButtonStyle} onClick={() => setShowModal(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        )}
      </div>
    </>
  )
}

// Styles
const newRequestButtonStyle = {
  background: "#5D2A0A",
  color: "white",
  border: "1px solid #5D2A0A",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.875rem",
  fontWeight: "500",
  transition: "all 0.2s",
};

const filterButtonStyle = {
  background: "#F5EBE0",
  color: "#5D2A0A",
  border: "1px solid #E8D5C4",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.875rem",
  transition: "all 0.2s",
}

const noResultsStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "2rem",
  color: "#a67c52",
  textAlign: "center",
  marginTop: "1rem",
}

const clearFiltersButtonStyle = {
  padding: "0.5rem 1rem",
  background: "#F5EBE0",
  color: "#5D2A0A",
  border: "1px solid #E8D5C4",
  borderRadius: "6px",
  cursor: "pointer",
  marginTop: "0.5rem",
}

const tableContainerStyle = {
  overflowX: "auto",
  borderRadius: "8px",
  border: "1px solid #E8D5C4",
  boxShadow: "0 4px 24px rgba(139, 69, 19, 0.08)",
}

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "white",
  fontSize: "0.875rem",
  backgroundColor: "#FEFCFA",
  tableLayout: "fixed",
  minWidth: "1300px", // Increased to accommodate new column
}


const tableRowStyle = {
  borderBottom: "1px solid #E8D5C4",
}

const supplierNameStyle = {
  color: "#a67c52",
  textDecoration: "underline",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "0.75rem",
  lineHeight: "1.2",
}

const statusBadgeStyle = {
  borderRadius: "3px",
  fontWeight: "500",
  display: "inline-block",
}

// Style constants
const tableHeaderStyle = {
  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
  color: "#FEFCFA",
  padding: "0.75rem 0.4rem",
  textAlign: "left",
  fontWeight: "600",
  fontSize: "0.7rem",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  position: "sticky",
  top: "0",
  zIndex: "10",
  borderBottom: "2px solid #1a0c02",
  borderRight: "1px solid #1a0c02",
  lineHeight: "1.2",
}

const tableCellStyle = {
  padding: "0.6rem 0.4rem",
  borderBottom: "1px solid #E8D5C4",
  borderRight: "1px solid #E8D5C4",
  fontSize: "0.75rem",
  verticalAlign: "top",
  color: "#5d2a0a",
  lineHeight: "1.3",
  overflow: "hidden",
}

const matchScoreStyle = {
  fontSize: "0.75rem",
  fontWeight: "500",
}

const matchContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  width: "100%",
}

const progressBarStyle = {
  width: "60%", // Reduced progress bar width from 80% to 60% to make it shorter
  height: "6px",
  backgroundColor: "#E2E8F0",
  borderRadius: "3px",
  overflow: "hidden",
}

const progressFillStyle = {
  height: "100%",
  borderRadius: "3px",
  transition: "width 0.3s ease",
}

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1.5rem",
  borderBottom: "1px solid #E8D5C4",
  background: "#FEFCFA",
}

const modalTitleStyle = {
  margin: "0",
  fontSize: "1.25rem",
  fontWeight: "600",
  color: "#5D2A0A",
}

const modalCloseButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "1.25rem",
  cursor: "pointer",
  color: "#5D2A0A",
  padding: "0.25rem",
}

const modalBodyStyle = {
  padding: "1.5rem",
}

const detailCardStyle = {
  padding: "1rem",
  background: "#F5EBE0",
  borderRadius: "8px",
  border: "1px solid #E8D5C4",
}

const detailTextStyle = {
  margin: "0.5rem 0",
  fontSize: "0.875rem",
  color: "#5D2A0A",
}

const modalActionsStyle = {
  display: "flex",
  gap: "0.75rem",
  justifyContent: "flex-end",
}

const primaryButtonStyle = {
  padding: "0.75rem 1.5rem",
  background: "#5D2A0A",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "0.875rem",
  fontWeight: "500",
  cursor: "pointer",
}

const cancelButtonStyle = {
  padding: "0.75rem 1.5rem",
  background: "#F5EBE0",
  color: "#5D2A0A",
  border: "1px solid #E8D5C4",
  borderRadius: "6px",
  fontSize: "0.875rem",
  fontWeight: "500",
  cursor: "pointer",
}

const filterCardStyle = {
  padding: "1.5rem",
  background: "#FEFCFA",
  borderRadius: "8px",
  border: "1px solid #E8D5C4",
}

const filterTitleStyle = {
  margin: "0 0 1rem 0",
  fontSize: "1rem",
  fontWeight: "600",
  color: "#5D2A0A",
}

const filterSelectStyle = {
  width: "100%",
  padding: "0.75rem",
  border: "1px solid #E8D5C4",
  borderRadius: "6px",
  fontSize: "0.875rem",
  background: "white",
  color: "#5D2A0A",
}

const filterInputStyle = {
  flex: "1",
  padding: "0.75rem",
  border: "1px solid #E8D5C4",
  borderRadius: "6px",
  fontSize: "0.875rem",
  background: "white",
  color: "#5D2A0A",
}