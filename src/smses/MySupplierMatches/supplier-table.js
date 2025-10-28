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
} from "firebase/firestore"
import { db } from "../../firebaseConfig"
import { Eye, Filter } from "lucide-react"
import { useNavigate } from "react-router-dom"
import emailjs from '@emailjs/browser'
import { API_KEYS } from "../../API"
import SupplierDetailsModal from './SupplierDetailsModal'
import { findSynonyms, expandSearchTerms, containsTermOrSynonyms } from '../../utils/synonyms';

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
  // Primary matching (60%)
  CATEGORY_MATCH: {
    weight: 0.4,
    description: "Product/Service Category Alignment",
  },
  BBBEE_LEVEL: {
    weight: 0.1,
    description: "BBBEE Level Compliance",
  },
  LOCATION: {
    weight: 0.1,
    description: "Geographic Location Match",
  },

  // Secondary matching (40%)
  DELIVERY_MODE: {
    weight: 0.1,
    description: "Delivery Mode Compatibility",
  },
  BUDGET_RANGE: {
    weight: 0.1,
    description: "Budget Fit",
  },
  OWNERSHIP_PREFS: {
    weight: 0.05,
    description: "Ownership Preferences Match",
  },
  URGENCY_LEAD_TIME: {
    weight: 0.05,
    description: "Delivery Timeframe & Urgency Match",
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

const getFirstCategory = (productsServices) => {
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
function calculateCategoryMatch(application, supplier) {
  const appCategories = application.productsServices?.categories || [];
  const appKeywords = application.keywords?.toLowerCase() || "";
  const appPurpose = application.purpose?.toLowerCase() || "";

  // Extract all descriptive text from supplier
  const supplierText = extractSupplierDescriptiveText(supplier);

  if ((appCategories.length === 0 && !appKeywords && !appPurpose) || !supplierText) {
    return { score: 0, matches: [] };
  }

  let matches = 0;
  const matchedTerms = [];
  const totalTerms = [];

  // Check category matches with synonyms
  appCategories.forEach(appCat => {
    totalTerms.push(appCat);
    const expandedCategories = expandSearchTerms([appCat.toLowerCase()]);

    const hasMatch = expandedCategories.some(catTerm =>
      supplierText.includes(catTerm)
    );

    if (hasMatch) {
      matches++;
      matchedTerms.push(appCat);
    }
  });

  // Check keyword matches from application with synonyms
  if (appKeywords || appPurpose) {
    const combinedText = `${appKeywords} ${appPurpose}`;
    const words = combinedText.split(/\s+/).filter(word => word.length > 3);

    words.forEach(word => {
      totalTerms.push(word);
      const expandedWords = expandSearchTerms([word.toLowerCase()]);

      const hasMatch = expandedWords.some(expandedWord =>
        supplierText.includes(expandedWord)
      );

      if (hasMatch) {
        matches++;
        matchedTerms.push(word);
      }
    });
  }

  const score = totalTerms.length > 0 ? matches / totalTerms.length : 0;

  return {
    score: Math.min(score * 1.3, 1), // Boost for semantic matches
    matches: matchedTerms
  };
}

function calculateLocationMatch(application, supplier) {
  const appLocation = application.requestOverview?.location || ""
  const supplierLocation = supplier.entityOverview?.location || ""

  if (!appLocation || !supplierLocation) return 0.5

  const normalizedApp = appLocation.toLowerCase().trim()
  const normalizedSupplier = supplierLocation.toLowerCase().trim()

  return normalizedApp === normalizedSupplier ? 1 : 0
}

function calculateDeliveryMatch(application, supplier) {
  const appModes = application.requestOverview?.deliveryModes || []
  const supplierModes = supplier.productsServices?.deliveryModes || []

  if (appModes.length === 0 || supplierModes.length === 0) return 0.5

  // Check if either party has Hybrid for full compatibility
  const appHasHybrid = appModes.includes("Hybrid")
  const supplyHasHybrid = supplierModes.includes("Hybrid")

  if (appHasHybrid || supplyHasHybrid) {
    return 1
  }

  // Standard matching for non-Hybrid cases
  const deliveryMatches = appModes.filter(appMode =>
    supplierModes.includes(appMode)
  )
  return deliveryMatches.length / appModes.length
}

function calculateBudgetMatch(application, supplier) {
  const appBudgetMin = parseInt((application.requestOverview?.minBudget || "0").replace(/\D/g, "")) || 0
  const appBudgetMax = parseInt((application.requestOverview?.maxBudget || "0").replace(/\D/g, "")) || 1000000
  const revenue = parseInt((supplier.financialOverview?.annualRevenue || "0").replace(/\D/g, "")) || 0

  if (revenue === 0) return 0.5

  if (revenue >= appBudgetMin && revenue <= appBudgetMax) {
    return 1
  } else if (revenue >= appBudgetMin * 0.5 && revenue <= appBudgetMax * 1.5) {
    return 0.7
  } else {
    return 0.3
  }
}

function calculateBBBEEEMatch(application, supplier) {
  const appBBBEEPref = parseInt(application.matchingPreferences?.bbeeLevel?.replace(/\D/g, "") || "0") || 0
  const bbbeeLevel = parseInt(supplier.legalCompliance?.bbbeeLevel || "0") || 0

  if (appBBBEEPref <= bbbeeLevel) {
    return 1
  } else if (appBBBEEPref - bbbeeLevel <= 2) {
    return 0.5
  }
  return 0
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

function extractSupplierDescriptiveText(supplier) {
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

function calculateEnhancedMatchScore(application, supplier, ratingsData = null) {
  if (!application || !supplier) {
    return {
      totalScore: 0,
      breakdown: {},
    }
  }

  let totalScore = 0
  const breakdown = {}

  // Category Match (40%)
  const categoryMatch = calculateCategoryMatch(application, supplier)
  totalScore += categoryMatch.score * ENHANCED_MATCHING_CRITERIA.CATEGORY_MATCH.weight * 100
  breakdown.categoryMatch = {
    score: categoryMatch.score * 100,
    description: ENHANCED_MATCHING_CRITERIA.CATEGORY_MATCH.description,
    matches: categoryMatch.matches
  }

  // BBBEE Match (10%)
  const bbbeeScore = calculateBBBEEEMatch(application, supplier)
  totalScore += bbbeeScore * ENHANCED_MATCHING_CRITERIA.BBBEE_LEVEL.weight * 100
  breakdown.bbbeeMatch = {
    score: bbbeeScore * 100,
    description: ENHANCED_MATCHING_CRITERIA.BBBEE_LEVEL.description,
  }

  // Location Match (10%)
  const locationScore = calculateLocationMatch(application, supplier)
  totalScore += locationScore * ENHANCED_MATCHING_CRITERIA.LOCATION.weight * 100
  breakdown.locationMatch = {
    score: locationScore * 100,
    description: ENHANCED_MATCHING_CRITERIA.LOCATION.description,
  }

  // Delivery Match (10%)
  const deliveryScore = calculateDeliveryMatch(application, supplier)
  totalScore += deliveryScore * ENHANCED_MATCHING_CRITERIA.DELIVERY_MODE.weight * 100
  breakdown.deliveryMatch = {
    score: deliveryScore * 100,
    description: ENHANCED_MATCHING_CRITERIA.DELIVERY_MODE.description,
  }

  // Budget Match (10%)
  const budgetScore = calculateBudgetMatch(application, supplier)
  totalScore += budgetScore * ENHANCED_MATCHING_CRITERIA.BUDGET_RANGE.weight * 100
  breakdown.budgetMatch = {
    score: budgetScore * 100,
    description: ENHANCED_MATCHING_CRITERIA.BUDGET_RANGE.description,
  }

  // Ownership Preferences (5%)
  const ownershipScore = calculateOwnershipMatch(application, supplier)
  totalScore += ownershipScore * ENHANCED_MATCHING_CRITERIA.OWNERSHIP_PREFS.weight * 100
  breakdown.ownershipMatch = {
    score: ownershipScore * 100,
    description: ENHANCED_MATCHING_CRITERIA.OWNERSHIP_PREFS.description,
  }

  // Rating Match (5%)
  const ratingScore = calculateRatingMatch(supplier, ratingsData)
  totalScore += ratingScore * ENHANCED_MATCHING_CRITERIA.RATING.weight * 100
  breakdown.ratingMatch = {
    score: ratingScore * 100,
    description: ENHANCED_MATCHING_CRITERIA.RATING.description,
  }

  // Experience Match (5%) - Simplified for now
  const experienceScore = 0.5
  totalScore += experienceScore * ENHANCED_MATCHING_CRITERIA.EXPERIENCE.weight * 100
  breakdown.experienceMatch = {
    score: experienceScore * 100,
    description: ENHANCED_MATCHING_CRITERIA.EXPERIENCE.description,
  }

  // Urgency/Lead Time Match (5%) - Simplified for now
  const urgencyScore = 0.5
  totalScore += urgencyScore * ENHANCED_MATCHING_CRITERIA.URGENCY_LEAD_TIME.weight * 100
  breakdown.urgencyLeadTimeMatch = {
    score: urgencyScore * 100,
    description: ENHANCED_MATCHING_CRITERIA.URGENCY_LEAD_TIME.description,
  }

  return {
    totalScore: Math.round(totalScore),
    breakdown,
  }
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

export function SupplierTable({ onSupplierContacted, onSuppliersUpdate, onSupplierAccepted }) {
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

  const navigate = useNavigate()

  const handleNewRequest = () => {
    navigate("/applications/product/request-overview")
  }

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
        setCurrentUserApplication(applicationData)
        console.log("Current user application:", applicationData)
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
    const filtered = allSuppliers.filter((supplier) => {
      if (filters.location && !supplier.entityOverview?.location?.includes(filters.location)) return false
      if (supplier.matchPercentage < filters.matchScore) return false
      if (filters.bbbeeLevel && supplier.legalCompliance?.bbbeeLevel !== filters.bbbeeLevel) return false
      if (
        filters.sectors.length > 0 &&
        !filters.sectors.some((sector) => supplier.entityOverview?.economicSectors?.includes(sector))
      )
        return false
      return true
    })

    setFilteredSuppliers(filtered)
    if (onSuppliersUpdate) {
      onSuppliersUpdate(allSuppliers, filtered)
    }
  }

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

      // Update supplier's stage in Firestore first
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
      {/* Main content container */}
      <div
        style={{
          position: "relative",
          filter: showModal || showFilters ? "blur(2px)" : "none",
          transition: "filter 0.2s ease",
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
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => setShowFilters(true)} style={filterButtonStyle}>
              <Filter size={16} />
              Filter
            </button>
            <button onClick={handleNewRequest} style={newRequestButtonStyle}>
              New Requests
            </button>
          </div>
        </div>

        {/* Table Structure */}
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <colgroup>
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "5%" }} />
              <col style={{ width: "5%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
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
                <th style={tableHeaderStyle}>Action</th>
                <th style={{ ...tableHeaderStyle, borderRight: "none" }}>Stage</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => {
                const statusStyle = getStatusStyle(supplier.status)
                const stageStyle = getStageStyle(supplier.currentStage)

                return (
                  <tr key={supplier.id} style={tableRowStyle}>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <div>
                          <span onClick={() => handleViewDetails(supplier)} style={supplierNameStyle}>
                            <TruncatedText
                              text={supplier.entityOverview?.tradingName || supplier.entityOverview?.registeredName}
                              maxLength={15}
                            />
                          </span>
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

                    <td style={tableCellStyle}>
                      <TruncatedText
                        text={supplier.serviceRequired || "Not specified"}
                        maxLength={15}
                      />
                    </td>

                    <td style={tableCellStyle}>
                      <TruncatedText text={supplier.urgency || "1 month"} maxLength={10} />
                    </td>

                    <td style={tableCellStyle}>
                      <div style={matchContainerStyle}>
                        <div style={progressBarStyle}>
                          <div
                            style={{
                              ...progressFillStyle,
                              width: `${supplier.matchPercentage}%`,
                              background:
                                supplier.matchPercentage > 75
                                  ? "#48BB78"
                                  : supplier.matchPercentage > 50
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
                                supplier.matchPercentage > 75
                                  ? "#48BB78"
                                  : supplier.matchPercentage > 50
                                    ? "#D69E2E"
                                    : "#E53E3E",
                            }}
                          >
                            {supplier.matchPercentage}%
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

                    <td style={tableCellStyle}>
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
                )
              })}
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

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                    gap: "1rem",
                    marginBottom: "2rem",
                  }}
                >
                  {matchBreakdownData?.matchDetails &&
                    Object.entries(matchBreakdownData.matchDetails).map(([key, details]) => {
                      const criteriaInfo = ENHANCED_MATCHING_CRITERIA[key]
                      const weight = criteriaInfo ? criteriaInfo.weight * 100 : 0
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
                              Weight: {weight}%
                            </span>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#8D6E63",
                              }}
                            >
                              Contribution: {Math.round((details.score * weight) / 100)}%
                            </span>
                          </div>

                          {/* Show matched categories for category match */}
                          {key === 'categoryMatch' && details.matches && details.matches.length > 0 && (
                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E8D5C4' }}>
                              <span style={{ fontSize: "0.75rem", color: "#8D6E63", fontWeight: "600" }}>
                                Matched Categories:
                              </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                                {details.matches.map((category, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      background: '#E8F5E8',
                                      color: '#388E3C',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '12px',
                                      fontSize: '0.7rem',
                                    }}
                                  >
                                    {category}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>

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
                    How to Improve Your Match Score:
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    {matchBreakdownData?.matchDetails &&
                      Object.entries(matchBreakdownData.matchDetails)
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
  minWidth: "1200px",
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