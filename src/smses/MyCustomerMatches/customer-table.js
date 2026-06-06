"use client"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  getDocs,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore"
import { db } from "../../firebaseConfig"
import { getAuth } from "firebase/auth"
import { DayPicker } from "react-day-picker"
import CustomerDetailsModal from "./CustomerDetailsModal"
import "react-day-picker/dist/style.module.css"
import { FileText, MessageCircle, Filter, Download, Send, FileIcon, Calendar, Check, Eye } from "lucide-react"

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
}

const STAGE_FLOW = {
  "Application Submitted": {
    nextStage: "Shortlist",
    status: "Pending",
  },
  Shortlist: {
    nextStage: "Proposal Sent",
    status: "Shortlisted",
  },
  "Proposal Sent": {
    nextStage: "Accept/Decline",
    status: "Proposal/Quote",
  },
  Accepted: {
    nextStage: "Deal Closed",
    status: "Accepted",
  },
  Rejected: {
    nextStage: "Deal Closed",
    status: "Rejected",
  },
}

// Text truncation component
const TruncatedText = ({ text, maxLength = 40 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span style={{ color: "#666" }}>{text || "-"}</span>
  }

  const shouldTruncate = text.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`

  const toggleExpanded = (e) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div style={{ lineHeight: "1.4" }}>
      <span style={{ wordBreak: "break-word", color: "#333" }}>{displayText}</span>
      {shouldTruncate && (
        <div style={{ marginTop: "4px" }}>
          <button
            style={{
              background: "none",
              border: "none",
              color: "#a67c52",
              cursor: "pointer",
              fontSize: "0.75rem",
              textDecoration: "underline",
              padding: "0",
            }}
            onClick={toggleExpanded}
          >
            {isExpanded ? "See less" : "See more"}
          </button>
        </div>
      )}
    </div>
  )
}

const getStatusStyle = (status) => {
  return STATUS_TYPES[status] || { color: "#F5F5F5", textColor: "#666666" }
}

const MATCHING_CRITERIA = {
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

  // Calculate totals from shareholders
  shareholders.forEach((shareholder) => {
    const shareholding = Number.parseInt(shareholder.shareholding || "0") || 0
    result.totalShares += shareholding

    // Black ownership
    if (shareholder.race && shareholder.race.toLowerCase() === "black") {
      result.blackOwnership += shareholding
    }

    // Women ownership
    if (shareholder.gender && shareholder.gender.toLowerCase() === "female") {
      result.womenOwnership += shareholding
    }

    // Youth ownership (assuming isYouth flag)
    if (shareholder.isYouth === true) {
      result.youthOwnership += shareholding
    }

    // Disability ownership
    if (shareholder.isDisabled === true) {
      result.disabilityOwnership += shareholding
    }
  })

  // Also check directors for management representation (weighted less than ownership)
  const directors = Array.isArray(ownershipManagement.directors) ? ownershipManagement.directors : []

  let blackDirectors = 0
  let womenDirectors = 0
  let youthDirectors = 0
  let disabledDirectors = 0
  const totalDirectors = directors.length

  directors.forEach((director) => {
    if (director.race && director.race.toLowerCase() === "black") {
      blackDirectors++
    }
    if (director.gender && director.gender.toLowerCase() === "female") {
      womenDirectors++
    }
    if (director.isYouth === true) {
      youthDirectors++
    }
    if (director.isDisabled === true) {
      disabledDirectors++
    }
  })

  // If no shareholders data but we have directors, use directors as proxy (with lower weight)
  if (result.totalShares === 0 && totalDirectors > 0) {
    result.blackOwnership = (blackDirectors / totalDirectors) * 100 * 0.7 // 70% weight for directors as proxy
    result.womenOwnership = (womenDirectors / totalDirectors) * 100 * 0.7
    result.youthOwnership = (youthDirectors / totalDirectors) * 100 * 0.7
    result.disabilityOwnership = (disabledDirectors / totalDirectors) * 100 * 0.7
  } else if (result.totalShares > 0) {
    // Convert to percentages
    result.blackOwnership = (result.blackOwnership / result.totalShares) * 100
    result.womenOwnership = (result.womenOwnership / result.totalShares) * 100
    result.youthOwnership = (result.youthOwnership / result.totalShares) * 100
    result.disabilityOwnership = (result.disabilityOwnership / result.totalShares) * 100
  }

  return result
}

// Additional helper function to get detailed ownership breakdown
function getOwnershipBreakdown(ownershipManagement) {
  const breakdown = {
    shareholders: [],
    directors: [],
    summary: {},
  }

  // Shareholder breakdown
  if (Array.isArray(ownershipManagement.shareholders)) {
    breakdown.shareholders = ownershipManagement.shareholders.map((shareholder) => ({
      name: shareholder.name || "Unknown",
      shareholding: Number.parseInt(shareholder.shareholding || "0") || 0,
      race: shareholder.race || "Not specified",
      gender: shareholder.gender || "Not specified",
      isYouth: shareholder.isYouth || false,
      isDisabled: shareholder.isDisabled || false,
    }))
  }

  // Director breakdown
  if (Array.isArray(ownershipManagement.directors)) {
    breakdown.directors = ownershipManagement.directors.map((director) => ({
      name: director.name || "Unknown",
      position: director.position || director.customPosition || "Not specified",
      race: director.race || "Not specified",
      gender: director.gender || "Not specified",
      isYouth: director.isYouth || false,
      isDisabled: director.isDisabled || false,
      execType: director.execType || "Not specified",
    }))
  }

  // Calculate summary
  const percentages = calculateOwnershipPercentages(ownershipManagement)
  breakdown.summary = percentages

  return breakdown
}
// Helper function to calculate string similarity (simple version)
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  return (longer.length - editDistance(longer, shorter)) / Number.parseFloat(longer.length)
}

// Helper function for edit distance (Levenshtein distance)
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

// Helper function to get detailed category matches
function getCategoryMatches(appCategories, supplierCategories) {
  const matches = []

  appCategories.forEach((appCat) => {
    supplierCategories.forEach((supplierCat) => {
      if (
        supplierCat.includes(appCat) ||
        appCat.includes(supplierCat) ||
        calculateSimilarity(appCat, supplierCat) > 0.7
      ) {
        matches.push({
          applicationCategory: appCat,
          supplierCategory: supplierCat,
          similarity: calculateSimilarity(appCat, supplierCat),
        })
      }
    })
  })

  return matches
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
export function CustomerTable() {
  const [showFilters, setShowFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [messageText, setMessageText] = useState("")
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [proposalFile, setProposalFile] = useState(null)
  const [proposalMessage, setProposalMessage] = useState("")
  const [notification, setNotification] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [currentCustomerId, setCurrentCustomerId] = useState(null)
  const [temporaryStatus, setTemporaryStatus] = useState(null)
  const [showShortlistModal, setShowShortlistModal] = useState(false)
  const [meetingPurpose, setMeetingPurpose] = useState("")
  const [meetingLocation, setMeetingLocation] = useState("")
  const [availabilities, setAvailabilities] = useState([])
  const [tempDates, setTempDates] = useState([])
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" })
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    minMatchScore: 0,
    supplierLocation: "",
    sortBy: "newest",
  })
  const [supplierRatings, setSupplierRatings] = useState({})
  const [showMatchBreakdown, setShowMatchBreakdown] = useState(false)
  const [matchBreakdownData, setMatchBreakdownData] = useState(null)
  const [universalProfiles, setUniversalProfiles] = useState([])
  const [productProfiles, setProductProfiles] = useState([])
  const [currentUserApplication, setCurrentUserApplication] = useState(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)


  function calculateMatchScore(application, supplier, ratingsData = null) {
    if (!application || !supplier) {
      return { totalScore: 0, breakdown: {} };
    }

    let totalScore = 0;
    const breakdown = {};

    // ── helpers ──────────────────────────────────────────────────────
    const expandSearchTerms = (terms) => terms.map(t => t.toLowerCase().trim());

    const extractSupplierText = (sup) => {
      let text = "";
      sup.productsServices?.productCategories?.forEach(cat => {
        text += ` ${cat.name || ""} `;
        cat.products?.forEach(p => { text += ` ${p.name || ""} ${p.description || ""} `; });
      });
      sup.productsServices?.serviceCategories?.forEach(cat => {
        text += ` ${cat.name || ""} `;
        cat.services?.forEach(s => { text += ` ${s.name || ""} ${s.description || ""} `; });
      });
      text += ` ${sup.productsServices?.targetMarket || ""} `;
      return text.toLowerCase().trim();
    };

    // ── 1. CATEGORY MATCH (40%) ───────────────────────────────────────
    const appCategories = (
      application.productsServices?.categories ||
      application.requestOverview?.categories ||
      application.productsServices?.productCategories ||
      []
    ).map(c => (typeof c === "string" ? c : c?.name || "").toLowerCase().trim()).filter(Boolean);

    const appKeywords = application.requestOverview?.keywords?.toLowerCase() || "";
    const appPurpose = application.requestOverview?.purpose?.toLowerCase() || "";
    const supplierText = extractSupplierText(supplier);

    let categoryScore = 0;
    const matchedCategories = [];
    const unmatchedCategories = [];

    if (appCategories.length > 0 || appKeywords || appPurpose) {
      appCategories.forEach(appCat => {
        const hasMatch = supplierText.includes(appCat);
        if (hasMatch) { matchedCategories.push(appCat); }
        else { unmatchedCategories.push(appCat); }
      });

      const catScore = appCategories.length > 0 ? matchedCategories.length / appCategories.length : 0;

      let kwScore = 0;
      if (appKeywords || appPurpose) {
        const words = `${appKeywords} ${appPurpose}`.split(/\s+/).filter(w => w.length > 3);
        const hits = words.filter(w => supplierText.includes(w)).length;
        kwScore = words.length > 0 ? hits / words.length : 0;
      }

      categoryScore = appCategories.length > 0 ? (catScore * 0.7) + (kwScore * 0.3) : kwScore;
    }

    const categoryContribution = Math.min(categoryScore, 1) * MATCHING_CRITERIA.CATEGORY_MATCH.weight * 100;
    totalScore += categoryContribution;
    breakdown.categoryMatch = {
      score: Math.round(Math.min(categoryScore, 1) * 100),
      weight: MATCHING_CRITERIA.CATEGORY_MATCH.weight * 100,
      contribution: Math.round(categoryContribution),
      description: MATCHING_CRITERIA.CATEGORY_MATCH.description,
      matches: matchedCategories,
      unmatched: unmatchedCategories,
    };

    // ── 2. BBBEE MATCH (10%) ─────────────────────────────────────────
    const bbbeePref = application.matchingPreferences?.bbeeLevel || application.requestOverview?.bbeeLevel || "0";
    const appBBBEE = parseInt((bbbeePref || "0").replace(/\D/g, "")) || 0;
    const supplierBBBEE = parseInt(supplier.legalCompliance?.bbbeeLevel || "0") || 0;

    let bbbeeScore = 0.5;
    if (appBBBEE > 0) {
      if (supplierBBBEE <= appBBBEE) bbbeeScore = 1;
      else if (supplierBBBEE === appBBBEE + 1) bbbeeScore = 0.5;
      else bbbeeScore = 0;
    }

    const bbbeeContribution = bbbeeScore * MATCHING_CRITERIA.BBBEE_LEVEL.weight * 100;
    totalScore += bbbeeContribution;
    breakdown.bbbeeMatch = {
      score: Math.round(bbbeeScore * 100),
      weight: MATCHING_CRITERIA.BBBEE_LEVEL.weight * 100,
      contribution: Math.round(bbbeeContribution),
      description: MATCHING_CRITERIA.BBBEE_LEVEL.description,
    };

    // ── 3. LOCATION MATCH (10%) ──────────────────────────────────────
    const appLoc = (application.matchingPreferences?.location || application.requestOverview?.location || "").toLowerCase().trim();
    const supLoc = (supplier.entityOverview?.location || "").toLowerCase().trim();

    let locationScore = 0.5;
    if (appLoc) {
      if (!supLoc) locationScore = 0;
      else if (appLoc === supLoc) locationScore = 1;
      else if (supLoc.includes(appLoc) || appLoc.includes(supLoc)) locationScore = 0.7;
      else locationScore = 0;
    }

    const locationContribution = locationScore * MATCHING_CRITERIA.LOCATION.weight * 100;
    totalScore += locationContribution;
    breakdown.locationMatch = {
      score: Math.round(locationScore * 100),
      weight: MATCHING_CRITERIA.LOCATION.weight * 100,
      contribution: Math.round(locationContribution),
      description: MATCHING_CRITERIA.LOCATION.description,
    };

    // ── 4. DELIVERY MODE MATCH (10%) ─────────────────────────────────
    const appModes = (application.matchingPreferences?.deliveryModes || application.requestOverview?.deliveryModes || []);
    const supModes = supplier.productsServices?.deliveryModes || [];

    let deliveryScore = 0.5;
    if (appModes.length > 0) {
      if (supModes.length === 0) {
        deliveryScore = 0;
      } else if (appModes.includes("Hybrid") || supModes.includes("Hybrid")) {
        deliveryScore = 1;
      } else {
        const matched = appModes.filter(m => supModes.includes(m));
        deliveryScore = matched.length / appModes.length;
      }
    }

    const deliveryContribution = deliveryScore * MATCHING_CRITERIA.DELIVERY_MODE.weight * 100;
    totalScore += deliveryContribution;
    breakdown.deliveryMatch = {
      score: Math.round(deliveryScore * 100),
      weight: MATCHING_CRITERIA.DELIVERY_MODE.weight * 100,
      contribution: Math.round(deliveryContribution),
      description: MATCHING_CRITERIA.DELIVERY_MODE.description,
    };

    // ── 5. BUDGET MATCH (10%) ────────────────────────────────────────
    const minBudgetRaw = application.matchingPreferences?.minBudget || application.requestOverview?.minBudget || "0";
    const maxBudgetRaw = application.matchingPreferences?.maxBudget || application.requestOverview?.maxBudget || "0";
    const appBudgetMin = parseInt((minBudgetRaw || "0").replace(/\D/g, "")) || 0;
    const appBudgetMax = parseInt((maxBudgetRaw || "0").replace(/\D/g, "")) || 1000000;
    const revenue = parseInt((supplier.financialOverview?.annualRevenue || "0").replace(/\D/g, "")) || 0;

    let budgetScore = 0.5;
    if (revenue > 0) {
      if (revenue >= appBudgetMin && revenue <= appBudgetMax) budgetScore = 1;
      else if (revenue >= appBudgetMin * 0.5 && revenue <= appBudgetMax * 1.5) budgetScore = 0.7;
      else budgetScore = 0.3;
    }

    const budgetContribution = budgetScore * MATCHING_CRITERIA.BUDGET_RANGE.weight * 100;
    totalScore += budgetContribution;
    breakdown.budgetMatch = {
      score: Math.round(budgetScore * 100),
      weight: MATCHING_CRITERIA.BUDGET_RANGE.weight * 100,
      contribution: Math.round(budgetContribution),
      description: MATCHING_CRITERIA.BUDGET_RANGE.description,
    };

    // ── 6. OWNERSHIP MATCH (5%) ──────────────────────────────────────
    const appOwnershipPrefs = (application.matchingPreferences?.ownershipPrefs || []);
    let ownershipScore = 0.5;

    if (appOwnershipPrefs.length > 0) {
      const shareholderData = calculateOwnershipPercentages(supplier.ownershipManagement || {});
      ownershipScore = 0;

      appOwnershipPrefs.forEach(pref => {
        const p = pref.toLowerCase().trim();
        if ((p.includes("black-owned") || p.includes("black owned")) && shareholderData.blackOwnership >= 51) ownershipScore += 0.4;
        else if ((p.includes("women-owned") || p.includes("women owned")) && shareholderData.womenOwnership >= 30) ownershipScore += 0.3;
        else if ((p.includes("youth-owned") || p.includes("youth owned")) && shareholderData.youthOwnership >= 25) ownershipScore += 0.2;
        else if ((p.includes("disability") || p.includes("disabled")) && shareholderData.disabilityOwnership >= 5) ownershipScore += 0.1;
      });
      ownershipScore = Math.min(ownershipScore, 1);
    }

    const ownershipContribution = ownershipScore * MATCHING_CRITERIA.OWNERSHIP_PREFS.weight * 100;
    totalScore += ownershipContribution;
    breakdown.ownershipMatch = {
      score: Math.round(ownershipScore * 100),
      weight: MATCHING_CRITERIA.OWNERSHIP_PREFS.weight * 100,
      contribution: Math.round(ownershipContribution),
      description: MATCHING_CRITERIA.OWNERSHIP_PREFS.description,
    };

    // ── 7. URGENCY / LEAD TIME (5%) ──────────────────────────────────
    const urgencyScore = 0.5; // estimated until lead time data is fully captured
    const urgencyContribution = urgencyScore * MATCHING_CRITERIA.URGENCY_LEAD_TIME.weight * 100;
    totalScore += urgencyContribution;
    breakdown.urgencyLeadTimeMatch = {
      score: Math.round(urgencyScore * 100),
      weight: MATCHING_CRITERIA.URGENCY_LEAD_TIME.weight * 100,
      contribution: Math.round(urgencyContribution),
      description: MATCHING_CRITERIA.URGENCY_LEAD_TIME.description,
    };

    // ── 8. EXPERIENCE MATCH (5%) ─────────────────────────────────────
    const experienceScore = 0.5; // estimated
    const experienceContribution = experienceScore * MATCHING_CRITERIA.EXPERIENCE.weight * 100;
    totalScore += experienceContribution;
    breakdown.experienceMatch = {
      score: Math.round(experienceScore * 100),
      weight: MATCHING_CRITERIA.EXPERIENCE.weight * 100,
      contribution: Math.round(experienceContribution),
      description: MATCHING_CRITERIA.EXPERIENCE.description,
    };

    // ── 9. RATING MATCH (5%) ─────────────────────────────────────────
    const supplierId = supplier?.id;
    const effectiveRatings = ratingsData || {};
    const ratingData = effectiveRatings[supplierId] || { average: 0, count: 0 };
    const ratingScore = (ratingData.average || 0) / 5;
    const ratingContribution = ratingScore * MATCHING_CRITERIA.RATING.weight * 100;
    totalScore += ratingContribution;
    breakdown.ratingMatch = {
      score: Math.round(ratingScore * 100),
      weight: MATCHING_CRITERIA.RATING.weight * 100,
      contribution: Math.round(ratingContribution),
      description: MATCHING_CRITERIA.RATING.description,
      actualRating: ratingData.average || 0,
      ratingCount: ratingData.count || 0,
    };

    return {
      totalScore: Math.round(totalScore),
      breakdown,
    };
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

      // Calculate average ratings for each supplier
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
          // Initialize with zero if no ratings
          averageRatings[supplierId] = {
            average: 0,
            count: 0,
            latestComment: "No ratings yet"
          }
        }
      })

      // console.log("Fetched supplier ratings:", averageRatings)
      setSupplierRatings(averageRatings)
      return averageRatings // Return the data so it can be used immediately

    } catch (error) {
      console.error("Error fetching supplier ratings:", error)
      return {}
    }
  }

  const formatMatchBreakdown = (matchDetails) => {
    if (!matchDetails) return null;
    return Object.entries(matchDetails).reduce((acc, [key, details]) => {
      acc[key] = {
        score: details.score ?? 0,
        weight: details.weight ?? 0,
        contribution: details.contribution ?? 0,
        description: details.description,
        matches: details.matches || [],
        unmatched: details.unmatched || [],
      };
      return acc;
    }, {});
  };

  const handleShowMatchBreakdown = (application) => {
    // Add validation checks
    if (!application) {
      console.error("Application is undefined")
      setNotification({
        type: "error",
        message: "Application data not available",
      })
      return
    }

    if (!application.productsServices) {
      console.warn("Application missing productsServices:", application)
      // Handle missing data gracefully
    }

    if (!application.matchDetails) {
      const supplierProfile = universalProfiles.find((profile) => profile.id === application.customerId)

      if (!supplierProfile) {
        setNotification({
          type: "error",
          message: "Supplier profile not found",
        })
        return
      }

      // Add validation for productProfiles
      if (!productProfiles) {
        setNotification({
          type: "error",
          message: "Product profiles not loaded yet",
        })
        return
      }

      const matchScore = calculateMatchScore(productProfiles, supplierProfile, supplierRatings);

      // Update the application in state with the new match data
      setApplications((prev) =>
        prev.map((app) =>
          app.id === application.id
            ? { ...app, matchPercentage: matchScore.totalScore, matchDetails: matchScore.breakdown }
            : app,
        ),
      )

      setMatchBreakdownData({
        ...application,
        matchPercentage: matchScore.totalScore,
        matchBreakdown: {
          totalScore: matchScore.totalScore,
          breakdown: formatMatchBreakdown(matchScore.breakdown),
          calculatedAt: new Date(),
          criteriaWeights: Object.entries(MATCHING_CRITERIA).reduce((acc, [key, criteria]) => {
            acc[key] = {
              weight: criteria.weight * 100,
              description: criteria.description,
            }
            return acc
          }, {}),
        },
      })
    } else {
      // Use the pre-calculated data
      setMatchBreakdownData({
        ...application,
        matchBreakdown: {
          totalScore: application.matchPercentage,
          breakdown: formatMatchBreakdown(application.matchDetails),
          calculatedAt: new Date(),
          criteriaWeights: Object.entries(MATCHING_CRITERIA).reduce((acc, [key, criteria]) => {
            acc[key] = {
              weight: criteria.weight * 100,
              description: criteria.description,
            }
            return acc
          }, {}),
        },
      })
    }

    setShowMatchBreakdown(true)
  }

  useEffect(() => {
    setMounted(true)
    const auth = getAuth()
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentCustomerId(user.uid)
      } else {
        setCurrentCustomerId(null)
        setApplications([])
      }
    })
    return () => {
      unsubscribeAuth()
      setMounted(false)
    }
  }, [])

  // Set up real-time listener for applications
  useEffect(() => {
    if (!currentCustomerId) {
      setApplications([])
      setLoading(false)
      return
    }

    setLoading(true)

    const fetchCurrentUserApplication = async () => {
      try {
        const auth = getAuth()
        const user = auth.currentUser
        if (!user) return

        const applicationDoc = await getDoc(doc(db, "productApplications", user.uid))
        if (applicationDoc.exists()) {
          setCurrentUserApplication(applicationDoc.data())
        }
      } catch (error) {
        console.error("Error fetching current user application:", error)
      }
    }

    const fetchUniversalProfiles = async () => {
      try {
        const profilesSnapshot = await getDocs(collection(db, "universalProfiles"))
        const profilesData = profilesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setUniversalProfiles(profilesData)
        // console.log("Fetched universal profiles:", profilesData.length); // Debug log
        return profilesData
      } catch (error) {
        console.error("Error fetching universal profiles:", error)
        return []
      }
    }

    const q = query(collection(db, "supplierApplications"), where("customerId", "==", currentCustomerId))

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        const profiles = await fetchUniversalProfiles()
        const ratingsData = await fetchSupplierRatings()

        const apps = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data()

            // Calculate match percentage for each application
            const supplierProfile = profiles.find((profile) => profile.id === data.customerId)
            let matchPercentage = 0
            let matchDetails = null

            // Fetch additional document data
            // Use the match score saved at the time of contact — never recalculate
            if (data.matchPercentage !== undefined && data.matchPercentage !== null) {
              matchPercentage = data.matchPercentage
              matchDetails = data.matchBreakdown?.breakdown || null
            } else {
              // Fallback for older records that don't have a stored score
              const docRef = doc(db, "productApplications", data.supplierId)
              const docSnap = await getDoc(docRef)
              const product = docSnap.data()
              if (product && supplierProfile) {
                const matchResult = calculateMatchScore(product, supplierProfile, ratingsData)
                matchPercentage = matchResult.totalScore
                matchDetails = matchResult.breakdown
              }
            }

            return {
              id: docSnapshot.id,
              ...data,
              matchPercentage,
              matchDetails,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : null,
            }
          }),
        )

        setApplications(apps)
        setLoading(false)
      },
      (err) => {
        console.error("Error listening to applications:", err)
        setError("Failed to load applications")
        setLoading(false)
      },
    )

    fetchCurrentUserApplication()

    return () => unsubscribe()
  }, [currentCustomerId])


  const getSupplierRating = (supplierId) => {
    return supplierRatings[supplierId] || {
      average: 0,
      count: 0,
      latestComment: "No ratings yet"
    }
  }
  // Add these helper functions inside your CustomerTable component:
  const getCustomerEconomicSectors = (customerId) => {
    const customerProfile = universalProfiles.find((profile) => profile.id === customerId)
    return customerProfile?.entityOverview?.economicSectors || []
  }

  const getServiceRequested = (application) => {
    // Use the service requested that was saved at the time of contact
    if (
      application.originalRequest?.purpose &&
      application.originalRequest.purpose !== "Not specified"
    ) {
      return application.originalRequest.purpose
    }

    if (
      application.originalRequest?.serviceRequested &&
      application.originalRequest.serviceRequested !== "Not specified"
    ) {
      return application.originalRequest.serviceRequested
    }

    return "Not specified"
  }

  const getAllCategories = (supplierId) => {
    const supplierProfile = universalProfiles.find((profile) => profile.id === supplierId)
    if (!supplierProfile) return []

    const productsServices = supplierProfile.productsServices || {}
    const allCategories = []

    // Add product categories
    if (Array.isArray(productsServices.productCategories)) {
      productsServices.productCategories.forEach((cat) => {
        allCategories.push(typeof cat === "string" ? cat : cat?.name || "Unnamed Category")
      })
    }

    // Add service categories
    if (Array.isArray(productsServices.serviceCategories)) {
      productsServices.serviceCategories.forEach((cat) => {
        allCategories.push(typeof cat === "string" ? cat : cat?.name || "Unnamed Category")
      })
    }

    return allCategories
  }

  const getBudgetText = (application) => {
    // Use the budget saved at the time of contact, not the current live application
    const budgetRange = application.originalRequest?.budgetRange
    if (budgetRange) {
      const min = parseInt((budgetRange.min || "0").replace(/\D/g, "")) || 0
      const max = parseInt((budgetRange.max || "0").replace(/\D/g, "")) || 0
      if (min > 0 || max > 0) {
        return `R${min.toLocaleString()} - R${max.toLocaleString()}`
      }
    }
    return "Not specified"
  }

  // Update date display to handle null values
  const formatDate = (date) => {
    if (!date) return "N/A"
    return date.toLocaleDateString()
  }

  // 5. Add helper function for improvement suggestions (add this function in the CustomerTable component)
  const getImprovementSuggestion = (criteriaKey, score) => {
    const suggestions = {
      categoryMatch:
        "Consider expanding your service categories or highlighting relevant subcategories that align with customer needs.",
      bbbeeMatch: "Improve your BBBEE certification level to better match customer transformation requirements.",
      locationMatch: "Consider expanding your service delivery areas or highlighting remote service capabilities.",
      deliveryMatch: "Add more delivery mode options (on-site, remote, hybrid) to match customer preferences.",
      budgetMatch: "Adjust your pricing structure or highlight different service tiers to better fit customer budgets.",
      ownershipMatch: "Highlight your transformation credentials and ownership demographics more prominently.",
      urgencyMatch: "Improve your response times and project delivery capabilities to meet urgent requirements.",
      experienceMatch: "Better showcase your relevant sector experience and case studies in your profile.",
      ratingMatch: "Focus on improving customer satisfaction and collecting more positive reviews.",
    }

    return (
      suggestions[criteriaKey] || "Review your profile to ensure all relevant information is complete and accurate."
    )
  }
  const filteredApplications = applications.filter((app) => {
    if (filters.status && app.status !== filters.status) return false
    if (app.matchPercentage < filters.minMatchScore) return false
    if (filters.supplierLocation && !app.supplierLocation?.includes(filters.supplierLocation)) return false
    return true
  })

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    if (filters.sortBy === "newest") {
      return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    } else if (filters.sortBy === "oldest") {
      return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
    } else if (filters.sortBy === "highestMatch") {
      return b.matchPercentage - a.matchPercentage
    } else {
      return a.matchPercentage - b.matchPercentage
    }
  })

  const handleViewDetails = async (application) => {
    try {
      // First, find the complete customer profile from universalProfiles
      const customerProfile = universalProfiles.find(profile => profile.id === application.supplierId);

      if (customerProfile) {
        // Merge the application data with the complete customer profile
        setSelectedCustomer({
          ...application,
          // Add the complete customer profile data
          entityOverview: customerProfile.entityOverview || {},
          productsServices: customerProfile.productsServices || {},
          legalCompliance: customerProfile.legalCompliance || {},
          financialOverview: customerProfile.financialOverview || {},
          ownershipManagement: customerProfile.ownershipManagement || {},
          contactDetails: customerProfile.contactDetails || {},
          documents: customerProfile.documents || {},
          applicationOverview: customerProfile.applicationOverview || {}
        });
      } else {
        // If no profile found, use the application data with fallbacks
        setSelectedCustomer({
          ...application,
          entityOverview: {},
          productsServices: {},
          legalCompliance: {},
          financialOverview: {},
          ownershipManagement: {},
          contactDetails: {},
          documents: {},
          applicationOverview: {}
        });
      }

      setShowCustomerModal(true);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      setNotification({
        type: "error",
        message: "Failed to load customer details"
      });
    }
  }

  const handleViewDocuments = (application) => {
    setSelectedApplication(application)
    setShowDocumentModal(true)
  }

  const handleMessage = (application) => {
    setSelectedApplication(application)
    setShowModal(true)  // This will open the customer details modal
  }

  const handleOpenProposalModal = (application) => {
    setSelectedApplication(application)
    setProposalFile(null)
    setProposalMessage("")
    setShowProposalModal(true)
  }

  const handleProposalFileChange = (event) => {
    setProposalFile(event.target.files[0])
  }

  const handleSendProposal = async () => {
    if (!proposalFile || !selectedApplication) return

    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) throw new Error("User not authenticated")

      await updateDoc(doc(db, "supplierApplications", selectedApplication.id), {
        status: "Proposal/Quote",
        currentStage: "Proposal Sent",
        nextStage: "Accept/Decline",
        updatedAt: serverTimestamp(),
        proposalSentAt: serverTimestamp(),
      })

      // Format the attachment
      const formattedAttachment = {
        name: proposalFile.name,
        type: proposalFile.type,
        size: proposalFile.size,
        url: "", // You'll need to upload and get URL
      }

      // Update application status
      await updateDoc(doc(db, "supplierApplications", selectedApplication.id), {
        status: "Proposal/Quote",
        updatedAt: serverTimestamp(),
        proposalSentAt: serverTimestamp(),
      })

      // Create a message with the proposal attachment
      const baseMessage = {
        from: user.uid,
        to: selectedApplication.supplierId,
        toName: selectedApplication.supplierName,
        subject: `Proposal/Quote for your application`,
        content: proposalMessage || "Please find attached our proposal/quote for your application.",
        attachments: [formattedAttachment],
        date: new Date().toISOString(),
        read: false,
        type: "proposal",
      }

      // Save both inbox (receiver's copy) and sent (sender's copy)
      await addDoc(collection(db, "messages"), { ...baseMessage, type: "inbox" })
      await addDoc(collection(db, "messages"), {
        ...baseMessage,
        read: true,
        type: "sent",
      })

      setNotification({
        type: "success",
        message: `Proposal sent to ${selectedApplication.supplierName}`,
      })

      setShowProposalModal(false)
    } catch (err) {
      console.error("Error sending proposal:", err.message)
      setNotification({
        type: "error",
        message: `Failed to send proposal: ${err.message}`,
      })
    } finally {
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleDateSelect = (dates) => {
    setTempDates(dates || [])
  }

  const handleTimeChange = (field, value) => {
    setTimeSlot((prev) => ({ ...prev, [field]: value }))
  }

  const saveSelectedDates = async () => {
    const newAvailabilities = [
      ...availabilities,
      ...tempDates
        .filter((date) => !availabilities.some((a) => a.date.getTime() === date.getTime()))
        .map((date) => ({
          date,
          timeSlots: [{ ...timeSlot }],
          timeZone,
          status: "available",
        })),
    ]

    setAvailabilities(newAvailabilities)
    setTempDates([])
    setShowCalendarModal(false)
  }

  const removeAvailability = (dateToRemove) => {
    const updatedAvailabilities = availabilities.filter((item) => item.date.getTime() !== dateToRemove.getTime())
    setAvailabilities(updatedAvailabilities)
  }

  const handleShortlist = async (application) => {
    try {
      const auth = getAuth()
      const user = auth.currentUser

      if (!user) {
        throw new Error("You must be logged in to shortlist a supplier")
      }

      await updateDoc(doc(db, "supplierApplications", application.id), {
        status: "Shortlisted",
        currentStage: "Shortlist",
        nextStage: "Proposal Sent",
        updatedAt: serverTimestamp(),
      })

      // Set up the modal state
      setSelectedApplication(application)
      setMeetingPurpose(`Meeting with ${application.supplierName}`)
      setMeetingLocation("Virtual Meeting")
      setAvailabilities([])
      setShowShortlistModal(true)

      // Create calendar events in both collections
      const supplierEventRef = await addDoc(collection(db, "supplierCalendarEvents"), {
        supplierId: application.supplierId,
        customerId: user.uid,
        customerName: user.displayName || "Customer",
        title: `Meeting with ${application.supplierName}`,
        purpose: `Meeting regarding application ${application.id}`,
        location: "Virtual Meeting",
        type: "meeting",
        status: "pending",
        createdAt: serverTimestamp(),
        availableDates: [], // Will be populated when dates are selected
        smeAppId: application.id,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })

      const smeEventRef = await addDoc(collection(db, "smeCalendarEvents"), {
        smeId: application.supplierId,
        funderId: user.uid,
        funderName: user.displayName || "Customer",
        title: `Meeting with ${user.displayName || "Customer"}`,
        purpose: `Meeting regarding your application`,
        location: "Virtual Meeting",
        type: "meeting",
        status: "pending",
        createdAt: serverTimestamp(),
        availableDates: [], // Will be populated when dates are selected
        smeAppId: application.id,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        supplierEventId: supplierEventRef.id, // Link between the two events
      })

      // Update the supplier event with the sme event ID
      await updateDoc(supplierEventRef, {
        smeEventId: smeEventRef.id,
      })

      // Update application status
      await updateDoc(doc(db, "supplierApplications", application.id), {
        status: "Shortlisted",
        updatedAt: serverTimestamp(),
        meetingStatus: "pending",
        calendarEventId: supplierEventRef.id,
      })
    } catch (error) {
      console.error("Error in handleShortlist:", error)
      setNotification({
        type: "error",
        message: `Failed to shortlist: ${error.message}`,
      })
    }
  }

  const handleConfirmShortlist = async () => {
    // Validate inputs
    if (!meetingPurpose.trim() || !meetingLocation.trim() || availabilities.length === 0) {
      setFormErrors({
        meetingPurpose: !meetingPurpose.trim() ? "Meeting purpose required" : null,
        meetingLocation: !meetingLocation.trim() ? "Location required" : null,
        availabilities: availabilities.length === 0 ? "Select at least one date" : null,
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare meeting data
      const meetingData = {
        title: meetingPurpose,
        purpose: meetingPurpose,
        location: meetingLocation,
        availableDates: availabilities.map((avail) => ({
          date: avail.date.toISOString(),
          timeSlots: avail.timeSlots,
          timeZone: avail.timeZone,
          status: "available",
        })),
        updatedAt: serverTimestamp(),
      }

      // 1. Create supplier calendar event
      const supplierEventRef = await addDoc(collection(db, "supplierCalendarEvents"), {
        ...meetingData,
        supplierId: selectedApplication.supplierId,
        customerId: currentCustomerId,
        status: "pending",
        smeAppId: selectedApplication.id,
        createdAt: serverTimestamp(),
      })

      // 2. Create matching SME calendar event
      await addDoc(collection(db, "smeCalendarEvents"), {
        ...meetingData,
        smeId: selectedApplication.supplierId,
        funderId: currentCustomerId,
        status: "pending",
        smeAppId: selectedApplication.id,
        supplierEventId: supplierEventRef.id,
        createdAt: serverTimestamp(),
      })

      // 3. Update supplier application
      await updateDoc(doc(db, "supplierApplications", selectedApplication.id), {
        status: "Shortlisted",
        meetingDetails: meetingData,
        calendarEventId: supplierEventRef.id,
        updatedAt: serverTimestamp(),
      })

      // 4. Send notification
      await addDoc(collection(db, "notifications"), {
        recipientId: selectedApplication.supplierId,
        senderId: currentCustomerId,
        type: "meeting_invitation",
        title: "Meeting Invitation",
        message: `Meeting scheduled with ${selectedApplication.customerName}`,
        read: false,
        createdAt: serverTimestamp(),
        applicationId: selectedApplication.id,
      })

      setNotification({
        type: "success",
        message: "Supplier shortlisted and meeting scheduled",
      })
      setShowShortlistModal(false)
    } catch (error) {
      setNotification({
        type: "error",
        message: "Failed to shortlist: " + error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedApplication) return

    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) throw new Error("User not authenticated")

      const baseMessage = {
        from: user.uid,
        to: selectedApplication.supplierId,
        toName: selectedApplication.supplierName,
        subject: `Message regarding your application`,
        content: messageText,
        attachments: [], // or add attachments if needed later
        date: new Date().toISOString(),
        read: false,
      }

      // Save both inbox (receiver's copy) and sent (sender's copy)
      await addDoc(collection(db, "messages"), { ...baseMessage, type: "inbox" })
      await addDoc(collection(db, "messages"), { ...baseMessage, read: true, type: "sent" })

      setNotification({
        type: "success",
        message: `Message sent to ${selectedApplication.supplierName}`,
      })

      setShowMessageModal(false)
      setMessageText("")
    } catch (err) {
      console.error("Error sending message:", err.message)
      setNotification({
        type: "error",
        message: `Failed to send message: ${err.message}`,
      })
    } finally {
      setTimeout(() => setNotification(null), 3000)
    }
  }

  // FIXED: Completely rewritten handleStatusChange function
  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      // Find the application in current state
      const application = applications.find((app) => app.id === applicationId);
      
      if (!application) {
        console.error("Application not found:", applicationId);
        setNotification({
          type: "error",
          message: "Application not found",
        });
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      // console.log("Updating status to:", newStatus, "for application:", applicationId);

      // Prepare the update data
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: currentCustomerId,
      };

      // Add stage information based on status
      if (newStatus === "Pending") {
        updateData.currentStage = "Application Submitted";
        updateData.nextStage = "Shortlist";
      } else if (newStatus === "Shortlisted") {
        updateData.currentStage = "Shortlist";
        updateData.nextStage = "Proposal Sent";
      } else if (newStatus === "Proposal/Quote") {
        updateData.currentStage = "Proposal Sent";
        updateData.nextStage = "Accept/Decline";
      } else if (newStatus === "Accepted") {
        updateData.currentStage = "Accepted";
        updateData.nextStage = "Deal Closed";
      } else if (newStatus === "Rejected") {
        updateData.currentStage = "Rejected";
        updateData.nextStage = "Deal Closed";
      }

      // Update Firestore
      const applicationRef = doc(db, "supplierApplications", applicationId);
      await updateDoc(applicationRef, updateData);
      
      // console.log("Firestore update successful");

      // Update local state immediately
      setApplications(prevApplications => 
        prevApplications.map(app => 
          app.id === applicationId 
            ? { ...app, ...updateData, updatedAt: new Date() }
            : app
        )
      );

      // Show success notification
      setNotification({
        type: "success",
        message: `Status updated to ${newStatus} successfully`,
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
      
      // Return success
      return true;
      
    } catch (err) {
      console.error("Error updating status:", err);
      setNotification({
        type: "error",
        message: `Failed to update status: ${err.message}`,
      });
      setTimeout(() => setNotification(null), 3000);
      return false;
    }
  }

  const handleExport = () => {
    setNotification({ type: "info", message: "Exporting applications data..." })
    setTimeout(() => setNotification(null), 3000)
  }

  const clearAllFilters = () => {
    setFilters({
      status: "",
      minMatchScore: 0,
      supplierLocation: "",
      sortBy: "newest",
    })
  }

  if (!mounted) return <div style={loadingStyle}>Initializing...</div>
  if (loading && applications.length === 0) return <div style={loadingStyle}>Loading applications...</div>
  if (error) return <div style={errorStyle}>Error: {error}</div>

  return (
    <>
      <style>{spinAnimation}</style>
      {/* Main content container */}
      <div
        style={{
          position: "relative",
          // Removed blur filter that was causing the table to blur
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

        {/* Table Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#5d4037",
              marginBottom: "0",
              fontFamily: "Segoe UI, sans-serif",
            }}
          ></h1>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => setShowFilters(true)} style={filterButtonStyle}>
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>

        {/* Table Content - Always show table structure */}
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Customer Name</th>
                <th style={tableHeaderStyle}>Location</th>
                <th style={tableHeaderStyle}>Sector Focus</th>
                <th style={tableHeaderStyle}>Customer Type</th>
                <th style={tableHeaderStyle}>Budget Range</th>
                <th style={tableHeaderStyle}>Service Requested</th>
                <th style={tableHeaderStyle}>Last Activity</th>
                <th style={tableHeaderStyle}>Delivery Turnaround</th>
                <th style={tableHeaderStyle}>Match %</th>
                <th style={tableHeaderStyle}>Current Stage</th>
                <th style={tableHeaderStyle}>Next Stage</th>
                <th style={tableHeaderStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                // Empty state row
                <tr>
                  <td colSpan="12" style={{ ...tableCellStyle, textAlign: "center", padding: "2rem", border: "none" }}>
                    {/* Empty cell to maintain table structure */}
                  </td>
                </tr>
              ) : (
                // Render actual applications
                sortedApplications.map((application) => {
                  const statusStyle = getStatusStyle(application.status)
                  const budgetRange = application.originalRequest?.budgetRange
                  const budgetText = getBudgetText(application)

                  return (
                    <tr key={application.id} style={tableRowStyle}>
                      {/* Supplier Name */}
                      <td style={tableCellStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div>
                            <span onClick={() => handleViewDetails(application)} style={supplierNameStyle}>
                              {application.supplierName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td style={tableCellStyle}>
                        <span style={locationTextStyle}>{application.supplierLocation || "Not specified"}</span>
                      </td>

                      {/* Sector Focus */}
                      <td style={tableCellStyle}>
                        <div style={sectorContainerStyle}>
                          {getCustomerEconomicSectors(application.customerId)
                            .slice(0, 2)
                            .map((sector, idx) => (
                              <span key={idx} style={sectorTagStyle}>
                                <TruncatedText text={sector} maxLength={12} />
                              </span>
                            ))}
                          {getCustomerEconomicSectors(application.customerId).length === 0 && (
                            <span style={{ color: "#5d2a0a", fontSize: "0.75rem" }}>Not specified</span>
                          )}
                        </div>
                       </td>

                      {/* Customer Type */}
                      <td style={tableCellStyle}>
                        <span style={{ color: "#5d2a0a", fontSize: "0.75rem" }}>
                          {application.customerType?.toLowerCase() || "Not specified"}
                        </span>
                       </td>

                      {/* Budget Range */}
                      <td style={tableCellStyle}>
                        <span style={{ color: "#5d2a0a", fontSize: "0.75rem" }}>{budgetText}</span>
                       </td>

                      {/* Service Requested */}
                      <td style={tableCellStyle}>
                        <div style={{ color: "#5d2a0a", fontSize: "0.75rem" }}>
                          <TruncatedText text={getServiceRequested(application)} maxLength={30} />
                        </div>
                       </td>

                      {/* Last Activity */}
                      <td style={tableCellStyle}>{new Date(application.lastActivity).toLocaleDateString() || "N/A"}</td>

                      {/* Delivery Turnaround */}
                      <td style={tableCellStyle}>
                        {application.originalRequest?.deliveryTurnaround || "Not specified"}
                       </td>

                      {/* Match Percentage */}
                      <td style={tableCellStyle}>
                        <div style={matchContainerStyle}>
                          <div style={progressBarStyle}>
                            <div
                              style={{
                                ...progressFillStyle,
                                width: `${application.matchPercentage}%`,
                                background:
                                  application.matchPercentage > 75
                                    ? "#48BB78"
                                    : application.matchPercentage > 50
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
                                  application.matchPercentage > 75
                                    ? "#48BB78"
                                    : application.matchPercentage > 50
                                      ? "#D69E2E"
                                      : "#E53E3E",
                              }}
                            >
                              {application.matchPercentage}%
                            </span>
                            <Eye
                              size={14}
                              style={{
                                cursor: "pointer",
                                color: "#a67c52",
                              }}
                              onClick={() => handleShowMatchBreakdown(application)}
                              title="View match breakdown"
                            />
                          </div>
                        </div>
                       </td>

                      {/* Current Stage */}
                      <td style={tableCellStyle}>
                        <span style={statusBadgeStyle}>{application.currentStage || "Application Submitted"}</span>
                       </td>

                      {/* Next Stage */}
                      <td style={tableCellStyle}>
                        <span
                          style={{
                            ...statusBadgeStyle,
                            backgroundColor: "#E8F5E8",
                            color: "#388E3C",
                          }}
                        >
                          {application.nextStage ||
                            (application.status === "Pending"
                              ? "Shortlist"
                              : application.status === "Shortlisted"
                                ? "Proposal Sent"
                                : application.status === "Proposal/Quote"
                                  ? "Accept/Decline"
                                  : "Deal Closed")}
                        </span>
                       </td>

                      {/* Action */}
                      <td style={tableCellStyle}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => handleViewDetails(application)}
                            style={{
                              ...actionButtonStyle,
                              backgroundColor: "#5D2A0A",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0.4rem",
                            }}
                          >
                            <Eye size={14} />
                          </button>
                          <button onClick={() => handleMessage(application)} style={actionButtonStyle}>
                            Message
                          </button>
                        </div>
                       </td>
                     </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Message below table when no applications */}
        {applications.length === 0 && (
          <div style={emptyMessageStyle}>
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <FileText size={48} color="#a67c52" style={{ marginBottom: "1rem" }} />
              <h3 style={{ color: "#5D2A0A", marginBottom: "0.5rem" }}>No Applications Yet</h3>
              <p style={{ color: "#8D6E63", marginBottom: "1rem" }}>
                You have not applied for any customers, so there are no matches available. You need to apply first
              </p>
            </div>
          </div>
        )}

        {/* No results message for filtered results */}
        {applications.length > 0 && filteredApplications.length === 0 && (
          <div style={noResultsStyle}>
            <p>No applications match your current filters.</p>
            <button onClick={clearAllFilters} style={clearFiltersButtonStyle}>
              Clear All Filters
            </button>
          </div>
        )}

        {/* Table Footer */}
        {applications.length > 0 && (
          <div style={tableFooterStyle}>
            <div style={{ color: "#5D2A0A", fontSize: "0.875rem" }}>
              Showing {filteredApplications.length} of {applications.length} applications
            </div>
          </div>
        )}
      </div>

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
                <h3 style={modalTitleStyle}>Match Breakdown - {matchBreakdownData?.supplierName}</h3>
                <button onClick={() => setShowMatchBreakdown(false)} style={modalCloseButtonStyle}>
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
                  <div
                    style={{
                      fontSize: "3rem",
                      fontWeight: "bold",
                      color:
                        matchBreakdownData?.matchPercentage >= 80
                          ? "#388E3C"
                          : matchBreakdownData?.matchPercentage >= 60
                            ? "#F57C00"
                            : "#D32F2F",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {matchBreakdownData?.matchPercentage}%
                  </div>
                  <p
                    style={{
                      fontSize: "1rem",
                      color: "#8D6E63",
                      margin: "0",
                    }}
                  >
                    Overall Match Score
                  </p>
                </div>

                {matchBreakdownData?.matchBreakdown?.breakdown ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                      gap: "1rem",
                      marginBottom: "2rem",
                    }}
                  >
                    {Object.entries(matchBreakdownData.matchBreakdown.breakdown).map(([key, details]) => {
                      const scoreColor = details.score >= 80 ? "#388E3C" : details.score >= 50 ? "#F57C00" : "#D32F2F"

                      return (
                        <div
                          key={key}
                          style={{
                            background: "#FEFCFA",
                            border: "1px solid #E8D5C4",
                            borderRadius: "8px",
                            padding: "1.25rem",
                            borderLeft: `4px solid ${scoreColor}`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "0.75rem",
                            }}
                          >
                            <h4
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                color: "#5D2A0A",
                                margin: "0",
                                lineHeight: "1.3",
                                flex: "1",
                              }}
                            >
                              {details.description}
                            </h4>
                            <span
                              style={{
                                fontSize: "1.25rem",
                                fontWeight: "bold",
                                color: scoreColor,
                                marginLeft: "1rem",
                              }}
                            >
                              {Math.round(details.score)}%
                            </span>
                          </div>

                          <div
                            style={{
                              background: "#E8D5C4",
                              borderRadius: "4px",
                              height: "8px",
                              overflow: "hidden",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                background: scoreColor,
                                width: `${details.score}%`,
                                transition: "width 0.3s ease",
                              }}
                            />
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#8D6E63",
                              }}
                            >
                              Weight: {details.weight}%
                            </span>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#8D6E63",
                              }}
                            >
                              Contribution: {Math.round((details.score / 100) * details.weight)}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "#8D6E63",
                    }}
                  >
                    <p>Match breakdown data is not available for this application.</p>
                    <p style={{ fontSize: "0.875rem" }}>
                      This may be an older application created before detailed scoring was implemented.
                    </p>
                  </div>
                )}

                {/* Improvement suggestions section - only show if breakdown exists and has low scores */}
                {matchBreakdownData?.matchBreakdown?.breakdown &&
                  Object.entries(matchBreakdownData.matchBreakdown.breakdown).some(
                    ([key, details]) => details.score < 70,
                  ) && (
                    <div
                      style={{
                        background: "#F5EBE0",
                        border: "1px solid #E8D5C4",
                        borderRadius: "8px",
                        padding: "1.5rem",
                        marginBottom: "2rem",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "1rem",
                          fontWeight: "600",
                          color: "#5D2A0A",
                          margin: "0 0 1rem 0",
                        }}
                      >
                        Areas for Improvement:
                      </h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                          gap: "1rem",
                        }}
                      >
                        {Object.entries(matchBreakdownData.matchBreakdown.breakdown)
                          .filter(([key, details]) => details.score < 70)
                          .map(([key, details]) => (
                            <div
                              key={key}
                              style={{
                                background: "white",
                                border: "1px solid #E8D5C4",
                                borderRadius: "6px",
                                padding: "1rem",
                              }}
                            >
                              <h5
                                style={{
                                  fontSize: "0.875rem",
                                  fontWeight: "600",
                                  color: "#D32F2F",
                                  margin: "0 0 0.5rem 0",
                                }}
                              >
                                {details.description}
                              </h5>
                              <p
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#5D2A0A",
                                  margin: "0",
                                  lineHeight: "1.4",
                                }}
                              >
                                {getImprovementSuggestion(key, details.score)}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid #E8D5C4",
                  }}
                >
                  <button
                    style={{
                      padding: "0.75rem 2rem",
                      background: "#5D2A0A",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
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

      {/* Application Details Modal */}
      {mounted &&
        showModal &&
        selectedApplication &&
        createPortal(
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>Application from {selectedApplication.supplierName}</h3>
                <button onClick={() => setShowModal(false)} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                <div style={detailGridStyle}>
                  {/* Supplier Details */}
                  <div style={detailCardStyle}>
                    <h4 style={detailCardTitleStyle}>Customer Information</h4>
                    <p style={detailTextStyle}>
                      <strong>Name:</strong> {selectedApplication.supplierName}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Location:</strong>{" "}
                      {selectedApplication.applicationData?.requestOverview?.location || "Not specified"}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Match Score:</strong> {selectedApplication.matchPercentage}%
                    </p>
                  </div>

                  {/* Application Details */}
                  <div style={detailCardStyle}>
                    <h4 style={detailCardTitleStyle}>Application Details</h4>
                    <p style={detailTextStyle}>
                      <strong>Status:</strong> {selectedApplication.status}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Received:</strong> {selectedApplication.createdAt?.toLocaleString() || "N/A"}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Last Updated:</strong> {selectedApplication.updatedAt?.toLocaleString() || "N/A"}
                    </p>
                  </div>

                  {/* Service Details */}
                  <div style={detailCardStyle}>
                    <h4 style={detailCardTitleStyle}>Service Details</h4>
                    {selectedApplication.applicationData?.productsServices?.categories?.length > 0 && (
                      <div style={{ marginBottom: "0.5rem" }}>
                        <strong style={{ color: "#5D2A0A" }}>Categories:</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.25rem" }}>
                          {selectedApplication.applicationData.productsServices.categories.map((category, index) => (
                            <span key={index} style={categoryTagStyle}>
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedApplication.applicationData?.productsServices?.keywords && (
                      <p style={detailTextStyle}>
                        <strong>Keywords:</strong> {selectedApplication.applicationData.productsServices.keywords}
                      </p>
                    )}
                  </div>

                  {/* Budget and Timeline */}
                  <div style={detailCardStyle}>
                    <h4 style={detailCardTitleStyle}>Budget & Timeline</h4>
                    <p style={detailTextStyle}>
                      <strong>Budget:</strong> R
                      {selectedApplication.applicationData?.requestOverview?.maxBudget?.toLocaleString() ||
                        "Not specified"}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Urgency:</strong>{" "}
                      {selectedApplication.applicationData?.requestOverview?.urgency || "Not specified"}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Delivery Mode:</strong>{" "}
                      {selectedApplication.applicationData?.requestOverview?.deliveryModes?.join(", ") ||
                        "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Status Actions - FIXED BUTTONS */}
                <div style={statusActionsStyle}>
                  <h4 style={detailCardTitleStyle}>Update Status</h4>
                  <p style={{ fontSize: "0.875rem", color: "#5D2A0A", marginBottom: "1rem" }}>
                    Click a button below to update the status
                  </p>
                  <div style={statusButtonsContainer}>
                    <button
                      onClick={async () => {
                        // console.log("Pending button clicked for:", selectedApplication.id);
                        await handleStatusChange(selectedApplication.id, "Pending");
                        // Refresh the modal data after status change
                        const updatedApp = applications.find(app => app.id === selectedApplication.id);
                        if (updatedApp) {
                          setSelectedApplication(updatedApp);
                        }
                      }}
                      style={{
                        ...statusButtonStyle,
                        backgroundColor: selectedApplication.status === "Pending" ? "#5D2A0A" : "#F5EBE0",
                        color: selectedApplication.status === "Pending" ? "white" : "#5D2A0A",
                      }}
                    >
                      Pending
                    </button>
                    <button
                      onClick={async () => {
                        // console.log("Shortlisted button clicked for:", selectedApplication.id);
                        await handleStatusChange(selectedApplication.id, "Shortlisted");
                        const updatedApp = applications.find(app => app.id === selectedApplication.id);
                        if (updatedApp) {
                          setSelectedApplication(updatedApp);
                        }
                      }}
                      style={{
                        ...statusButtonStyle,
                        backgroundColor: selectedApplication.status === "Shortlisted" ? "#5D2A0A" : "#F5EBE0",
                        color: selectedApplication.status === "Shortlisted" ? "white" : "#5D2A0A",
                      }}
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={async () => {
                        // console.log("Proposal/Quote button clicked for:", selectedApplication.id);
                        await handleStatusChange(selectedApplication.id, "Proposal/Quote");
                        const updatedApp = applications.find(app => app.id === selectedApplication.id);
                        if (updatedApp) {
                          setSelectedApplication(updatedApp);
                        }
                        setShowModal(false);
                        handleOpenProposalModal(selectedApplication);
                      }}
                      style={{
                        ...statusButtonStyle,
                        backgroundColor: selectedApplication.status === "Proposal/Quote" ? "#5D2A0A" : "#F5EBE0",
                        color: selectedApplication.status === "Proposal/Quote" ? "white" : "#5D2A0A",
                      }}
                    >
                      Proposal/Quote
                    </button>
                    <button
                      onClick={async () => {
                        // console.log("Accepted button clicked for:", selectedApplication.id);
                        await handleStatusChange(selectedApplication.id, "Accepted");
                        const updatedApp = applications.find(app => app.id === selectedApplication.id);
                        if (updatedApp) {
                          setSelectedApplication(updatedApp);
                        }
                      }}
                      style={{
                        ...statusButtonStyle,
                        backgroundColor: selectedApplication.status === "Accepted" ? "#5D2A0A" : "#F5EBE0",
                        color: selectedApplication.status === "Accepted" ? "white" : "#5D2A0A",
                      }}
                    >
                      Accepted
                    </button>
                    <button
                      onClick={async () => {
                        // console.log("Rejected button clicked for:", selectedApplication.id);
                        await handleStatusChange(selectedApplication.id, "Rejected");
                        const updatedApp = applications.find(app => app.id === selectedApplication.id);
                        if (updatedApp) {
                          setSelectedApplication(updatedApp);
                        }
                      }}
                      style={{
                        ...statusButtonStyle,
                        backgroundColor: selectedApplication.status === "Rejected" ? "#5D2A0A" : "#F5EBE0",
                        color: selectedApplication.status === "Rejected" ? "white" : "#5D2A0A",
                      }}
                    >
                      Rejected
                    </button>
                  </div>
                </div>
              </div>
              <div style={modalActionsStyle}>
                <button
                  onClick={async () => {
                    setShowModal(false)
                    handleMessage(selectedApplication)
                  }}
                  style={primaryButtonStyle}
                >
                  <MessageCircle size={16} /> Send Message
                </button>
                <button
                  onClick={() => {
                    setShowModal(false)
                    handleViewDocuments(selectedApplication)
                  }}
                  style={primaryButtonStyle}
                >
                  <FileText size={16} /> View Documents
                </button>
                <button onClick={() => setShowModal(false)} style={cancelButtonStyle}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Proposal/Quote Modal */}
      {mounted &&
        showProposalModal &&
        selectedApplication &&
        createPortal(
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>
                  <FileText size={20} style={{ marginRight: "0.5rem" }} />
                  Send Proposal/Quote to {selectedApplication.supplierName}
                </h3>
                <button onClick={() => setShowProposalModal(false)} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                    Message (optional):
                  </label>
                  <textarea
                    value={proposalMessage}
                    onChange={(e) => setProposalMessage(e.target.value)}
                    placeholder="Add a message to accompany your proposal..."
                    style={messageTextareaStyle}
                    rows={4}
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                    Attach Proposal/Quote:
                  </label>
                  <input
                    type="file"
                    onChange={handleProposalFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #E8D5C4",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                    }}
                  />
                  {proposalFile && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        padding: "0.75rem",
                        background: "#F5EBE0",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <FileText size={16} />
                      <span>{proposalFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div style={modalActionsStyle}>
                <button
                  onClick={handleSendProposal}
                  disabled={!proposalFile}
                  style={{
                    ...primaryButtonStyle,
                    opacity: proposalFile ? 1 : 0.5,
                    cursor: proposalFile ? "pointer" : "not-allowed",
                  }}
                >
                  <Send size={16} /> Send Proposal
                </button>
                <button onClick={() => setShowProposalModal(false)} style={cancelButtonStyle}>
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}



      {/* Shortlist Modal */}
      {mounted &&
        showShortlistModal &&
        selectedApplication &&
        createPortal(
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>Shortlist {selectedApplication.supplierName}</h3>
                <button onClick={() => setShowShortlistModal(false)} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                <div style={detailCardStyle}>
                  <h4 style={detailCardTitleStyle}>Meeting Details</h4>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                      Meeting Purpose:
                    </label>
                    <input
                      type="text"
                      value={meetingPurpose}
                      onChange={(e) => {
                        setMeetingPurpose(e.target.value)
                        if (e.target.value.trim()) {
                          setFormErrors({ ...formErrors, meetingPurpose: null })
                        }
                      }}
                      placeholder="e.g., Initial Discussion, Product Review"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: formErrors.meetingPurpose ? "2px solid #D32F2F" : "1px solid #E8D5C4",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                      }}
                    />
                    {formErrors.meetingPurpose && (
                      <p style={{ color: "#D32F2F", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                        {formErrors.meetingPurpose}
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                      Meeting Location:
                    </label>
                    <input
                      type="text"
                      value={meetingLocation}
                      onChange={(e) => {
                        setMeetingLocation(e.target.value)
                        if (e.target.value.trim()) {
                          setFormErrors({ ...formErrors, meetingLocation: null })
                        }
                      }}
                      placeholder="e.g., Virtual Meeting, Office Address"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: formErrors.meetingLocation ? "2px solid #D32F2F" : "1px solid #E8D5C4",
                        borderRadius: "6px",
                      }}
                    />
                    {formErrors.meetingLocation && (
                      <p style={{ color: "#D32F2F", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                        {formErrors.meetingLocation}
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                      Available Meeting Dates:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCalendarModal(true)}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#5D2A0A",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.875rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <Calendar size={16} /> Select Available Dates
                    </button>

                    {availabilities.length > 0 && (
                      <div
                        style={{
                          border: "1px solid #E8D5C4",
                          borderRadius: "6px",
                          padding: "0.75rem",
                          maxHeight: "200px",
                          overflowY: "auto",
                        }}
                      >
                        {availabilities
                          .sort((a, b) => a.date - b.date)
                          .map((availability, index) => (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "0.5rem",
                                borderBottom: "1px solid #F5EBE0",
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: "500" }}>
                                  {availability.date.toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                <span style={{ marginLeft: "1rem", color: "#666", fontSize: "0.75rem" }}>
                                  {availability.timeSlots[0].start} - {availability.timeSlots[0].end}
                                </span>
                              </div>
                              <button
                                onClick={() => removeAvailability(availability.date)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#D32F2F",
                                  cursor: "pointer",
                                  fontSize: "1rem",
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                    {formErrors.availabilities && (
                      <p style={{ color: "#D32F2F", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                        {formErrors.availabilities}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div style={modalActionsStyle}>
                <button
                  onClick={async () => {
                    const errors = {}
                    if (!meetingPurpose.trim()) errors.meetingPurpose = "Please provide a meeting purpose"
                    if (!meetingLocation.trim()) errors.meetingLocation = "Please provide a meeting location"
                    if (availabilities.length === 0) errors.availabilities = "Please select at least one available date"

                    if (Object.keys(errors).length > 0) {
                      setFormErrors(errors)
                      return
                    }

                    setIsSubmitting(true)
                    try {
                      // Update application status
                      await updateDoc(doc(db, "supplierApplications", selectedApplication.id), {
                        status: "Shortlisted",
                        updatedAt: serverTimestamp(),
                        meetingDetails: {
                          purpose: meetingPurpose,
                          location: meetingLocation,
                          availabilities: availabilities.map((avail) => ({
                            date: avail.date.toISOString(),
                            timeSlots: avail.timeSlots,
                            timeZone: avail.timeZone,
                          })),
                        },
                      })

                      // Create calendar event
                      await addDoc(collection(db, "supplierCalendarEvents"), {
                        supplierId: selectedApplication.supplierId,
                        customerId: currentCustomerId,
                        title: meetingPurpose,
                        date: availabilities[0].date.toISOString(),
                        location: meetingLocation,
                        type: "meeting",
                        createdAt: serverTimestamp(),
                        availableDates: availabilities.map((avail) => ({
                          date: avail.date.toISOString(),
                          timeSlots: avail.timeSlots,
                          timeZone: avail.timeZone,
                        })),
                      })

                      setNotification({
                        type: "success",
                        message: "Supplier shortlisted and meeting scheduled",
                      })
                      setShowShortlistModal(false)
                    } catch (error) {
                      console.error("Error shortlisting supplier:", error)
                      setNotification({
                        type: "error",
                        message: "Failed to shortlist supplier",
                      })
                    } finally {
                      setIsSubmitting(false)
                      setTimeout(() => setNotification(null), 3000)
                    }
                  }}
                  disabled={isSubmitting}
                  style={{
                    ...primaryButtonStyle,
                    opacity: isSubmitting ? 0.7 : 1,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className={loadingSpinner}></span> Processing...
                    </span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Check size={16} /> Confirm Shortlist
                    </span>
                  )}
                </button>
                <button onClick={() => setShowShortlistModal(false)} style={cancelButtonStyle}>
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {mounted &&
        showCalendarModal &&
        createPortal(
          <div style={modalOverlayStyle}>
            <div
              style={{
                ...modalContentStyle,
                maxWidth: "600px",
                padding: "2rem",
              }}
            >
              <h3
                style={{
                  ...modalTitleStyle,
                  textAlign: "center",
                  marginBottom: "1.5rem",
                }}
              >
                Select Available Meeting Dates
              </h3>

              <div
                style={{
                  backgroundColor: "#F5EBE0",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "600",
                    color: "#5D2A0A",
                  }}
                >
                  Available Time:
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <input
                    type="time"
                    value={timeSlot.start}
                    onChange={(e) => handleTimeChange("start", e.target.value)}
                    style={{
                      padding: "0.75rem",
                      border: "1px solid #E8D5C4",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      flex: 1,
                    }}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={timeSlot.end}
                    onChange={(e) => handleTimeChange("end", e.target.value)}
                    style={{
                      padding: "0.75rem",
                      border: "1px solid #E8D5C4",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      flex: 1,
                    }}
                  />
                </div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "600",
                    color: "#5D2A0A",
                  }}
                >
                  Time Zone:
                </label>
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #E8D5C4",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    backgroundColor: "white",
                  }}
                >
                  <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                  <option value="UTC">UTC</option>
                  {/* Add more time zones as needed */}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <DayPicker
                  mode="multiple"
                  selected={tempDates}
                  onSelect={handleDateSelect}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "1rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <button
                  onClick={() => setShowCalendarModal(false)}
                  style={{
                    ...cancelButtonStyle,
                    flex: 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveSelectedDates}
                  disabled={tempDates.length === 0}
                  style={{
                    ...primaryButtonStyle,
                    flex: 1,
                    opacity: tempDates.length === 0 ? 0.7 : 1,
                    cursor: tempDates.length === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  Save Dates ({tempDates.length})
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Customer Details Modal */}
      {mounted && showCustomerModal && selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
        />
      )}

      {/* Documents Modal */}
      {mounted &&
        showDocumentModal &&
        selectedApplication &&
        createPortal(
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>Documents from {selectedApplication.supplierName}</h3>
                <button onClick={() => setShowDocumentModal(false)} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                {selectedApplication.applicationData?.documents?.length > 0 ? (
                  <div style={documentsListStyle}>
                    {selectedApplication.applicationData.documents.map((doc, index) => (
                      <div key={index} style={documentItemStyle}>
                        <div style={documentIconStyle}>
                          <FileIcon size={20} />
                        </div>
                        <div style={documentInfoStyle}>
                          <h4 style={{ margin: "0 0 0.25rem 0", color: "#5D2A0A" }}>{doc.name}</h4>
                          <p style={{ margin: "0", fontSize: "0.8rem", color: "#666" }}>
                            {doc.type} • {doc.size || "N/A"}
                          </p>
                        </div>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" style={documentDownloadStyle}>
                          <Download size={16} />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={noDocumentsStyle}>
                    <FileIcon size={48} color="#a67c52" />
                    <p>No documents available for this application</p>
                  </div>
                )}
              </div>
              <div style={modalActionsStyle}>
                <button onClick={() => setShowDocumentModal(false)} style={primaryButtonStyle}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Message Modal */}
      {mounted &&
        showMessageModal &&
        selectedApplication &&
        createPortal(
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>Message {selectedApplication.supplierName}</h3>
                <button onClick={() => setShowMessageModal(false)} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                <div style={recipientInfoStyle}>
                  <p style={{ margin: "0 0 0.5rem 0", color: "#5D2A0A" }}>
                    <strong>To:</strong> {selectedApplication.supplierName}
                  </p>
                  <p style={{ margin: "0", color: "#5D2A0A" }}>
                    <strong>Regarding:</strong> Application #{selectedApplication.id.slice(0, 8)} - Status:{" "}
                    {temporaryStatus || selectedApplication.status}
                  </p>
                </div>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message here..."
                  style={messageTextareaStyle}
                  rows={6}
                />
              </div>
              <div style={modalActionsStyle}>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  style={{
                    ...primaryButtonStyle,
                    opacity: messageText.trim() ? 1 : 0.5,
                    cursor: messageText.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  <Send size={16} /> Send Message
                </button>
                <button onClick={() => setShowMessageModal(false)} style={cancelButtonStyle}>
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

// Styles
const loadingStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "200px",
  color: "#5D2A0A",
}

const errorStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "200px",
  color: "#D32F2F",
}

const emptyMessageStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "200px",
  background: "#FEFCFA",
  borderRadius: "8px",
  border: "1px dashed #E8D5C4",
  marginTop: "1rem",
}

const noResultsStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: "2rem",
  color: "#a67c52",
  textAlign: "center",
}

const statusUpdateMessageStyle = {
  padding: "1rem",
  background: "#F5EBE0",
  borderRadius: "8px",
  marginBottom: "1rem",
  borderLeft: "4px solid #5D2A0A",
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
}

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

const tableRowStyle = {
  borderBottom: "1px solid #E8D5C4",
}

const tableCellStyle = {
  padding: "8px 12px",
  fontSize: "0.75rem",
  color: "#5d2a0a",
  lineHeight: "1.3",
  verticalAlign: "top",
  borderRight: "1px solid #E8D5C4",
  overflow: "hidden",
}

const tableFooterStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "1rem",
  padding: "1rem",
  background: "#FEFCFA",
  borderRadius: "8px",
  border: "1px solid #E8D5C4",
}

const avatarStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  background: "#E8D5C4",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.8rem",
  fontWeight: "bold",
  color: "#5D2A0A",
}

const supplierNameStyle = {
  color: "#a67c52",
  textDecoration: "underline",
  cursor: "pointer",
  fontWeight: "500",
  wordBreak: "break-word",
}

const locationTextStyle = {
  fontSize: "0.75rem", // Match supplier table font size
  color: "#5d2a0a", // Match supplier table text color
  lineHeight: "1.4",
}

const matchContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "0.25rem",
}

const progressBarStyle = {
  width: "50px",
  height: "6px",
  background: "#E8D5C4",
  borderRadius: "3px",
  overflow: "hidden",
}

const progressFillStyle = {
  height: "100%",
  background: "linear-gradient(90deg, #48BB78, #68d391)",
  transition: "width 0.3s ease",
}

const matchScoreStyle = {
  fontSize: "0.75rem", // Match supplier table font size
  fontWeight: "600",
  lineHeight: "1.4",
}

const statusBadgeStyle = {
  padding: "0.2rem 0.4rem",
  borderRadius: "4px",
  fontSize: "0.7rem",
  fontWeight: "500",
  display: "inline-block",
  whiteSpace: "nowrap",
}

const actionButtonStyle = {
  padding: "0.4rem 0.6rem", // Slightly increased padding for icon
  background: "#5D2A0A",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "0.875rem", // Updated font size to match supplier table
  fontWeight: "500",
}

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

const exportButtonStyle = {
  background: "#5D2A0A",
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.875rem",
  transition: "all 0.2s",
}

const modalOverlayStyle = {
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
}

const modalContentStyle = {
  background: "white",
  borderRadius: "12px",
  maxWidth: "800px",
  width: "90%",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
}

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1.5rem",
  borderBottom: "1px solid #E8D5C4",
  background: "#F5EBE0",
}

const modalTitleStyle = {
  margin: 0,
  fontSize: "1.25rem",
  fontWeight: "600",
  color: "#5D2A0A",
}

const modalCloseButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "1.5rem",
  cursor: "pointer",
  color: "#5D2A0A",
}

const modalBodyStyle = {
  padding: "1.5rem",
}

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.5rem",
  padding: "1.5rem",
  borderTop: "1px solid #E8D5C4",
}

const primaryButtonStyle = {
  background: "#5D2A0A",
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.875rem",
  transition: "all 0.2s",
}

const cancelButtonStyle = {
  background: "#F5EBE0",
  color: "#5D2A0A",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer",
}

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "1.5rem",
  marginBottom: "1.5rem",
}

const detailCardStyle = {
  padding: "1rem",
  background: "#FEFCFA",
  border: "1px solid #E8D5C4",
  borderRadius: "8px",
}

const detailCardTitleStyle = {
  fontSize: "1rem",
  fontWeight: "600",
  margin: "0 0 1rem 0",
  color: "#5D2A0A",
  borderBottom: "1px solid #E8D5C4",
  paddingBottom: "0.5rem",
}

const detailTextStyle = {
  margin: "0.5rem 0",
  fontSize: "0.875rem",
  color: "#5D2A0A",
}

const categoryTagStyle = {
  background: "#E8D5C4",
  color: "#5D2A0A",
  padding: "0.2rem 0.4rem",
  borderRadius: "4px",
  fontSize: "0.7rem",
}

const statusActionsStyle = {
  marginBottom: "1.5rem",
}

const statusButtonsContainer = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  marginTop: "0.5rem",
}

const statusButtonStyle = {
  padding: "0.5rem 1rem",
  border: "1px solid #E8D5C4",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.875rem",
  transition: "all 0.2s",
}

const documentsListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
}

const documentItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  padding: "1rem",
  border: "1px solid #E8D5C4",
  borderRadius: "8px",
  background: "#FEFCFA",
}

const documentIconStyle = {
  width: "40px",
  height: "40px",
  background: "#F5EBE0",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#5D2A0A",
}

const documentInfoStyle = {
  flex: 1,
}

const documentDownloadStyle = {
  padding: "0.5rem",
  background: "#5D2A0A",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}

const noDocumentsStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1rem",
  padding: "2rem",
  color: "#666",
}

const supplierIdStyle = {
  fontSize: "0.7rem",
  color: "#999",
  marginTop: "0.1rem",
}

const sectorContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
}

const sectorTagStyle = {
  fontSize: "0.75rem", // Ensuring consistent font size
  color: "#5d2a0a", // Ensuring brown color like other text
  lineHeight: "1.4",
}

const loadingSpinner = {
  display: "inline-block",
  width: "16px",
  height: "16px",
  border: "2px solid rgba(255,255,255,0.3)",
  borderRadius: "50%",
  borderTopColor: "white",
  animation: "spin 1s ease-in-out infinite",
}

// Add this to your styles section
const spinAnimation = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

const recipientInfoStyle = {
  padding: "1rem",
  background: "#F5EBE0",
  borderRadius: "8px",
  marginBottom: "1.5rem",
  border: "1px solid #E8D5C4",
}

const messageTextareaStyle = {
  width: "100%",
  minHeight: "150px",
  padding: "0.75rem",
  border: "1px solid #E8D5C4",
  borderRadius: "6px",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  resize: "vertical",
  background: "#FEFCFA",
}