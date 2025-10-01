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
import { db, } from "../../firebaseConfig"
import { Eye, Filter } from "lucide-react"

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

const MATCHING_CRITERIA = {
  // High importance (total 50%)
  CATEGORY_MATCH: {
    weight: 0.3, // 30%
    description: "Service/Product Category Alignment",
  },
  BBBEE_LEVEL: {
    weight: 0.1, // 10%
    description: "BBBEE Level Compliance",
  },
  LOCATION: {
    weight: 0.1, // 10%
    description: "Geographic Location Match",
  },

  // Medium importance (total 30%)
  DELIVERY_MODE: {
    weight: 0.1, // 10%
    description: "Delivery Mode Compatibility",
  },
  BUDGET_RANGE: {
    weight: 0.1, // 10%
    description: "Budget Fit",
  },
  OWNERSHIP_PREFS: {
    weight: 0.1, // 10%
    description: "Ownership Preferences Match",
  },

  // Lower importance (total 20%)
  URGENCY: {
    weight: 0.05, // 5%
    description: "Project Urgency Alignment",
  },
  EXPERIENCE: {
    weight: 0.1, // 10%
    description: "Sector Experience Match",
  },
  RATING: {
    weight: 0.05, // 5%
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

export function SupplierTable({ onSupplierContacted, onSuppliersUpdate, onSupplierAccepted }) {
  const [showFilters, setShowFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState({ type: "", supplier: null })
  const [notification, setNotification] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState([])
   const [supplierRatings, setSupplierRatings] = useState({})
  const [productApplications, setProductApplications] = useState([])
  const [allSuppliers, setAllSuppliers] = useState([])
  const [filteredSuppliers, setFilteredSuppliers] = useState([])
  const [error, setError] = useState(null)
  const [showMatchBreakdown, setShowMatchBreakdown] = useState(false)
  const [matchBreakdownData, setMatchBreakdownData] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
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
  
        console.log("Fetched supplier ratings:", averageRatings)
        setSupplierRatings(averageRatings)
        return averageRatings // Return the data so it can be used immediately
  
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
      }
    })

    return () => {
      unsubscribeAuth()
      setMounted(false)
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product applications
        const applicationsSnapshot = await getDocs(collection(db, "productApplications"))
        const applicationsData = applicationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setProductApplications(applicationsData)

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
            // Default stage values
            currentStage: "Potential Supplier",
            status: "New Lead",
          }
        })

           const ratingsData = await fetchSupplierRatings()
        // Fetch supplier applications to sync stages
        const auth = getAuth()
        const currentUser = auth.currentUser
        let supplierApplicationsData = []

        if (currentUser) {
          const supplierAppsQuery = query(
            collection(db, "supplierApplications"),
            where("supplierId", "==", currentUser.uid),
          )
          const supplierAppsSnapshot = await getDocs(supplierAppsQuery)
          supplierApplicationsData = supplierAppsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        }

        // Calculate matches if we have applications
        let suppliersWithMatches
        if (applicationsData.length > 0) {
          const currentApplication = applicationsData.find((app) => app.id === auth.currentUser?.uid)
          console.log(currentApplication)

          // Calculate match scores for all suppliers
           // Calculate match scores for all suppliers
          // In your main useEffect, replace this section:
suppliersWithMatches = profilesData.map((supplier) => {
  // Pass the ratings data directly to calculateMatchScore
  const matchScore = calculateMatchScore(currentApplication, supplier, ratingsData)
  console.log(matchScore.totalScore)
  console.log(supplier)

  // Get first category name or default
  const firstCategory = getFirstCategory(supplier.productsServices)
  // Find if this supplier has an application (where they are the customer)
  const supplierApp = supplierApplicationsData.find((app) => app.customerId === supplier.id)

  // Get the actual rating from the ratings data
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
    status: supplierApp?.status || getStatusBasedOnScore(matchScore.totalScore),
    rating: actualRating, // Use the actual rating from supplierReviews
    avgResponseTime: "1-2 days",
    lastActivity: supplierApp?.updatedAt || new Date().toLocaleDateString(),
    urgency: supplier.applicationOverview?.urgency || "Not specified",
    dealSize: supplier.financialOverview?.annualRevenue || "Not specified",
    serviceCategory: firstCategory,
    currentStage: supplierApp?.currentStage || "Potential Supplier",
    nextStage: supplierApp?.nextStage || "Initial Contact",
    bbbeeLevel: supplier.legalCompliance?.bbbeeLevel || "N/A",
    applicationId: supplierApp?.id || null,
    ratingCount: supplierRatingData.count, // Add rating count for display
  }
})

          // Sort by match percentage (highest to lowest)
          suppliersWithMatches.sort((a, b) => b.matchPercentage - a.matchPercentage)
          setSuppliers(suppliersWithMatches)
        } else {
          // Fallback if no applications
          suppliersWithMatches = profilesData.map((profile) => {
            // Find if this supplier has an application (where they are the customer)
            const supplierApp = supplierApplicationsData.find((app) => app.customerId === profile.id)

            return {
              ...profile,
              // matchPercentage: Math.floor(Math.random() * 40) + 60,
              status: supplierApp?.status || "New Lead",
              rating: (profile.pisScore || 50) / 10,
              serviceCategory: Array.isArray(profile.productsServices?.productCategories)
                ? profile.productsServices.productCategories[0]?.name || "Not specified"
                : "Not specified",
              bbbeeLevel: profile.legalCompliance?.bbbeeLevel || "N/A",
              dealSize: profile.financialOverview?.annualRevenue || "Not specified",
              currentStage: supplierApp?.currentStage || "Potential Supplier",
              nextStage: supplierApp?.nextStage || "Initial Contact",
              applicationId: supplierApp?.id || null,
              lastActivity: supplierApp?.updatedAt || new Date().toLocaleDateString(),
            }
          })
          setSuppliers(suppliersWithMatches)
        }

        setAllSuppliers(suppliersWithMatches)
        setFilteredSuppliers(suppliersWithMatches)

        if (currentUser) {
          const supplierAppsQuery = query(
            collection(db, "supplierApplications"),
            where("supplierId", "==", currentUser.uid),
          )

          const unsubscribe = onSnapshot(supplierAppsQuery, (snapshot) => {
            const updatedApplications = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))

            setAllSuppliers((prev) =>
              prev.map((supplier) => {
                const updatedApp = updatedApplications.find((app) => app.customerId === supplier.id)
                if (updatedApp) {
                  // Check if status changed to "Accepted"
                  if (updatedApp.status === "Accepted" && supplier.status !== "Accepted") {
                    // Notify parent about accepted supplier
                    if (onSupplierAccepted) {
                      onSupplierAccepted(supplier.id)
                    }
                  }

                  return {
                    ...supplier,
                    currentStage: updatedApp.currentStage || supplier.currentStage,
                    status: updatedApp.status || supplier.status,
                    applicationId: updatedApp.id,

                    lastActivity: updatedApp.updatedAt || updatedApp.createdAt || supplier.lastActivity,
                  }
                }
                return supplier
              }),
            )
          })

          // Cleanup function
          return () => unsubscribe()
        }

        // Notify parent component of the update
        if (onSuppliersUpdate) {
          onSuppliersUpdate(suppliersWithMatches, suppliersWithMatches)
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const verifyStageUpdate = async (supplierId) => {
    const docRef = doc(db, "universalProfiles", supplierId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      console.log("Current stage in Firestore:", docSnap.data().currentStage)
    }
  }


function calculateMatchScore(application, supplier, ratingsData = null) {
    if (!application || !supplier) {
      console.error("Invalid parameters to calculateMatchScore:", { application, supplier })
      return {
        totalScore: 0,
        breakdown: {},
      }
    }

    let score = 0
    let totalWeight = 0
    const breakdown = {}

    // Safely extract all required data with fallbacks
    const demand = application.productsServices || {}
    const supply = supplier.productsServices || {}
    const requestOverview = application.requestOverview || {}
    const matchingPrefs = application.matchingPreferences || {}
    const supplierLegal = supplier.legalCompliance || {}
    const supplierFinancial = supplier.financialOverview || {}
    const supplierEntity = supplier.entityOverview || {}
    const supplierOwnership = supplier.ownershipManagement || {}

    // Normalize application categories
    const appCategories = Array.isArray(demand.categories)
      ? demand.categories
          .map((c) => (typeof c === "string" ? c.toLowerCase().trim() : (c.name || "").toLowerCase().trim()))
          .filter(Boolean)
      : []

    console.log("Application Categories:", appCategories)

    // Normalize supplier categories from both productCategories and serviceCategories
    const supplierProductCategories = Array.isArray(supply.productCategories)
      ? supply.productCategories
          .map((c) => (typeof c === "string" ? c.toLowerCase().trim() : (c.name || "").toLowerCase().trim()))
          .filter(Boolean)
      : []

    const supplierServiceCategories = Array.isArray(supply.serviceCategories)
      ? supply.serviceCategories
          .map((c) => (typeof c === "string" ? c.toLowerCase().trim() : (c.name || "").toLowerCase().trim()))
          .filter(Boolean)
      : []

    // Combine all supplier categories and remove duplicates
    const allSupplierCategories = [...new Set([...supplierProductCategories, ...supplierServiceCategories])]
    console.log("Supplier Categories:", allSupplierCategories)

    const appBudgetMin = Number.parseInt((requestOverview.minBudget || "0").replace(/\D/g, "")) || 0
    const appBudgetMax = Number.parseInt((requestOverview.maxBudget || "0").replace(/\D/g, "")) || 1000000
    const appLocation = (requestOverview.location || "").toLowerCase().trim()

    console.log("Budget Range:", appBudgetMin, "-", appBudgetMax)

    const appDeliveryModes = Array.isArray(requestOverview.deliveryModes)
      ? requestOverview.deliveryModes.map((m) => m.toLowerCase().trim()).filter(Boolean)
      : []

    const number = matchingPrefs.bbeeLevel ? matchingPrefs.bbeeLevel.replace(/\D/g, "") : "0"
    const appBBBEEPref = Number.parseInt(number || "0") || 0

    const appOwnershipPrefs = Array.isArray(matchingPrefs.ownershipPrefs)
      ? matchingPrefs.ownershipPrefs.map((p) => p.toLowerCase().trim()).filter(Boolean)
      : []

    const supplyDeliveryModes = Array.isArray(supply.deliveryModes)
      ? supply.deliveryModes.map((m) => m.toLowerCase().trim()).filter(Boolean)
      : []

    const bbbeeLevel = Number.parseInt(supplierLegal.bbbeeLevel || "0") || 0
    const revenue = Number.parseInt((supplierFinancial.annualRevenue || "0").replace(/\D/g, "")) || 0
    const location = (supplierEntity.location || "").toLowerCase().trim()
    const experienceText = (supplierEntity.businessDescription || "").toLowerCase().trim()
    const sectorPref = (matchingPrefs.sectorExperience || "").toLowerCase().trim()
    const supplierRating = (supplier.pisScore || 50) / 10

    console.log("Supplier Revenue:", revenue)

    // IMPROVED CATEGORY MATCHING (30%)
    if (MATCHING_CRITERIA.CATEGORY_MATCH.weight > 0) {
      let categoryScore = 0

      if (appCategories.length > 0 && allSupplierCategories.length > 0) {
        // Find matching categories (case-insensitive, partial matches)
        const matchingCategories = appCategories.filter((appCat) =>
          allSupplierCategories.some(
            (supplierCat) =>
              supplierCat.includes(appCat) ||
              appCat.includes(supplierCat) ||
              calculateSimilarity(appCat, supplierCat) > 0.7,
          ),
        )

        categoryScore = matchingCategories.length / appCategories.length
        console.log("Category Matches:", matchingCategories, "Score:", categoryScore)
      } else if (appCategories.length === 0) {
        categoryScore = 0.5 // Neutral score if no categories specified
      }

      score += categoryScore * MATCHING_CRITERIA.CATEGORY_MATCH.weight * 100
      breakdown.categoryMatch = {
        score: categoryScore * 100,
        description: MATCHING_CRITERIA.CATEGORY_MATCH.description,
        matches: appCategories.length > 0 ? getCategoryMatches(appCategories, allSupplierCategories) : [],
      }
      totalWeight += MATCHING_CRITERIA.CATEGORY_MATCH.weight * 100
    }

    // Rest of your existing criteria calculations remain the same...
    // 2. BBBEE_LEVEL (10%)
    if (MATCHING_CRITERIA.BBBEE_LEVEL.weight > 0) {
      let bbbeeScore = 0

      if (appBBBEEPref <= bbbeeLevel) {
        bbbeeScore = 1 // Perfect match
      } else if (appBBBEEPref - bbbeeLevel <= 2) {
        bbbeeScore = 0.5 // Partial match
      }

      score += bbbeeScore * MATCHING_CRITERIA.BBBEE_LEVEL.weight * 100
      breakdown.bbbeeMatch = {
        score: bbbeeScore * 100,
        description: MATCHING_CRITERIA.BBBEE_LEVEL.description,
      }
      totalWeight += MATCHING_CRITERIA.BBBEE_LEVEL.weight * 100
    }

    // 3. LOCATION (10%)
    if (MATCHING_CRITERIA.LOCATION.weight > 0) {
      const locationScore =
        location && appLocation && (location.includes(appLocation) || appLocation.includes(location)) ? 1 : 0

      score += locationScore * MATCHING_CRITERIA.LOCATION.weight * 100
      breakdown.locationMatch = {
        score: locationScore * 100,
        description: MATCHING_CRITERIA.LOCATION.description,
      }
      totalWeight += MATCHING_CRITERIA.LOCATION.weight * 100
    }

    // 4. DELIVERY_MODE (10%)
    if (MATCHING_CRITERIA.DELIVERY_MODE.weight > 0) {
      let deliveryScore = 0

      if (appDeliveryModes.length > 0 && supplyDeliveryModes.length > 0) {
        const deliveryMatches = appDeliveryModes.filter((mode) => supplyDeliveryModes.includes(mode))
        deliveryScore = deliveryMatches.length / appDeliveryModes.length
      } else if (appDeliveryModes.length === 0) {
        deliveryScore = 0.5 // Neutral score if no delivery modes specified
      }

      score += deliveryScore * MATCHING_CRITERIA.DELIVERY_MODE.weight * 100
      breakdown.deliveryMatch = {
        score: deliveryScore * 100,
        description: MATCHING_CRITERIA.DELIVERY_MODE.description,
      }
      totalWeight += MATCHING_CRITERIA.DELIVERY_MODE.weight * 100
    }

    // 5. BUDGET_RANGE (10%)
    if (MATCHING_CRITERIA.BUDGET_RANGE.weight > 0) {
      let budgetScore = 0

      if (revenue > 0) {
        if (revenue >= appBudgetMin && revenue <= appBudgetMax) {
          budgetScore = 1
        } else if (revenue >= appBudgetMin * 0.5 && revenue <= appBudgetMax * 1.5) {
          budgetScore = 0.7
        } else {
          budgetScore = 0.3
        }
      }

      score += budgetScore * MATCHING_CRITERIA.BUDGET_RANGE.weight * 100
      breakdown.budgetMatch = {
        score: budgetScore * 100,
        description: MATCHING_CRITERIA.BUDGET_RANGE.description,
      }
      totalWeight += MATCHING_CRITERIA.BUDGET_RANGE.weight * 100
    }

    // 6. OWNERSHIP_PREFS (10%)
    // IMPROVED OWNERSHIP_PREFS (10%)
    if (MATCHING_CRITERIA.OWNERSHIP_PREFS.weight > 0) {
      let ownershipScore = 0
      const ownershipDetails = {
        blackOwned: { percentage: 0, meetsThreshold: false },
        womenOwned: { percentage: 0, meetsThreshold: false },
        youthOwned: { percentage: 0, meetsThreshold: false },
        disabilityInclusive: { percentage: 0, meetsThreshold: false },
      }
      console.log(appOwnershipPrefs)
      if (appOwnershipPrefs.length > 0) {
        // Calculate ownership percentages from shareholders array
        const shareholderData = calculateOwnershipPercentages(supplierOwnership)

        // Update ownership details with calculated percentages
        ownershipDetails.blackOwned.percentage = shareholderData.blackOwnership
        ownershipDetails.womenOwned.percentage = shareholderData.womenOwnership
        ownershipDetails.youthOwned.percentage = shareholderData.youthOwnership
        ownershipDetails.disabilityInclusive.percentage = shareholderData.disabilityOwnership

        // Check thresholds for each preference
        appOwnershipPrefs.forEach((pref) => {
          const normalizedPref = pref.toLowerCase().trim()

          if (normalizedPref.includes("black-owned") || normalizedPref.includes("black owned")) {
            const meetsThreshold = shareholderData.blackOwnership >= 51
            ownershipDetails.blackOwned.meetsThreshold = meetsThreshold
            if (meetsThreshold) ownershipScore += 0.4
          } else if (
            normalizedPref.includes("women-owned") ||
            normalizedPref.includes("women owned") ||
            normalizedPref.includes("female-owned")
          ) {
            const meetsThreshold = shareholderData.womenOwnership >= 30
            ownershipDetails.womenOwned.meetsThreshold = meetsThreshold
            if (meetsThreshold) ownershipScore += 0.3
          } else if (normalizedPref.includes("youth-owned") || normalizedPref.includes("youth owned")) {
            const meetsThreshold = shareholderData.youthOwnership >= 25
            ownershipDetails.youthOwned.meetsThreshold = meetsThreshold
            if (meetsThreshold) ownershipScore += 0.2
          } else if (normalizedPref.includes("disability") || normalizedPref.includes("disabled")) {
            const meetsThreshold = shareholderData.disabilityOwnership >= 5
            ownershipDetails.disabilityInclusive.meetsThreshold = meetsThreshold
            if (meetsThreshold) ownershipScore += 0.1
          }
        })

        ownershipScore = Math.min(ownershipScore, 1)
      } else {
        ownershipScore = 0.5 // Neutral score if no preferences
      }

      score += ownershipScore * MATCHING_CRITERIA.OWNERSHIP_PREFS.weight * 100
      breakdown.ownershipMatch = {
        score: ownershipScore * 100,
        description: MATCHING_CRITERIA.OWNERSHIP_PREFS.description,
        details: ownershipDetails,
      }
      totalWeight += MATCHING_CRITERIA.OWNERSHIP_PREFS.weight * 100
    }

    // 7. URGENCY (5%)
    if (MATCHING_CRITERIA.URGENCY.weight > 0) {
      const urgencyMap = {
        immediate: 7,
        "1 week": 7,
        "2 weeks": 14,
        "1 month": 30,
        "1-3 months": 90,
        "3-6 months": 180,
      }

      const appUrgency = (requestOverview.urgency || "1 month").toLowerCase()
      const supplierUrgency = (supplier.applicationOverview?.urgency || "1 month").toLowerCase()

      const appDays = urgencyMap[appUrgency] || 30
      const supplierDays = urgencyMap[supplierUrgency] || 30

      let urgencyScore = 0
      if (supplierDays <= appDays) {
        urgencyScore = 1
      } else if (supplierDays <= appDays * 1.5) {
        urgencyScore = 0.7
      } else {
        urgencyScore = 0.3
      }

      score += urgencyScore * MATCHING_CRITERIA.URGENCY.weight * 100
      breakdown.urgencyMatch = {
        score: urgencyScore * 100,
        description: MATCHING_CRITERIA.URGENCY.description,
      }
      totalWeight += MATCHING_CRITERIA.URGENCY.weight * 100
    }

    // 8. EXPERIENCE (10%)
    if (MATCHING_CRITERIA.EXPERIENCE.weight > 0) {
      let experienceScore = 0

      if (sectorPref && experienceText) {
        // Simple keyword matching
        const prefWords = sectorPref.split(/\s+/)
        const matchedWords = prefWords.filter((word) => experienceText.includes(word))
        experienceScore = matchedWords.length / Math.max(prefWords.length, 1)
      } else if (!sectorPref) {
        experienceScore = 0.5 // Neutral score if no preference
      }

      score += experienceScore * MATCHING_CRITERIA.EXPERIENCE.weight * 100
      breakdown.experienceMatch = {
        score: experienceScore * 100,
        description: MATCHING_CRITERIA.EXPERIENCE.description,
      }
      totalWeight += MATCHING_CRITERIA.EXPERIENCE.weight * 100
    }

        // 9. RATING (5%)
  if (MATCHING_CRITERIA.RATING.weight > 0) {
    console.log("Available ratings data:", ratingsData)
    
    // Use the ratings data passed as parameter, or fall back to state
    const effectiveRatingsData = ratingsData || supplierRatings;
    
    // Helper function to get rating from the data
    const getRatingFromData = (supplierId) => {
      return effectiveRatingsData[supplierId] || {
        average: 0,
        count: 0,
        latestComment: "No ratings yet"
      };
    };

    // Use the actual supplier rating
    const supplierId = supplier?.id;
    const supplierRatingData = getRatingFromData(supplierId);
    const actualRating = supplierRatingData.average || 0;
    
    console.log("Rating calculation:", {
      supplierId,
      actualRating,
      ratingData: supplierRatingData,
      allRatings: effectiveRatingsData
    });

    // Normalize rating to 0-1 scale (assuming 0-5 scale)
    const ratingScore = actualRating / 5;

    score += ratingScore * MATCHING_CRITERIA.RATING.weight * 100;
    breakdown.ratingMatch = {
      score: ratingScore * 100,
      description: MATCHING_CRITERIA.RATING.description,
      actualRating: actualRating,
      ratingCount: supplierRatingData.count
    };
    totalWeight += MATCHING_CRITERIA.RATING.weight * 100;
  }

    // Calculate final weighted score
    const finalScore = totalWeight > 0 ? score / totalWeight : 0

    return {
      totalScore: Math.round(finalScore * 100), // Convert to percentage
      breakdown,
    }
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

  const handleConnectClick = async (supplier) => {
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
      if (!productApplications.length) throw new Error("No active product application found")

      const currentApplication = productApplications[0]
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
            // Add the weight information from MATCHING_CRITERIA
            weight:
              Object.values(MATCHING_CRITERIA).find((c) => c.description === details.description)?.weight * 100 || 0,
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
          // Store the criteria weights for reference
          criteriaWeights: Object.entries(MATCHING_CRITERIA).reduce((acc, [key, criteria]) => {
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
          id: currentApplication.id || "unknown-id",
          businessName: getSafeValue(currentApplication, "contactSubmission.businessName") || "Unknown Business",
          serviceRequested:
            getSafeValue(currentApplication, "productsServices.categories[0]") ||
            getSafeValue(currentApplication, "productsServices.serviceCategories[0]") ||
            "Not specified",
          budgetRange: {
            min: getSafeValue(currentApplication, "requestOverview.minBudget") || "0",
            max: getSafeValue(currentApplication, "requestOverview.maxBudget") || "0",
          },
          location: getSafeValue(currentApplication, "requestOverview.location") || "Not specified",
          urgency: getSafeValue(currentApplication, "applicationOverview.urgency") || "Not specified",
          deliveryTurnaround: getSafeValue(currentApplication, "requestOverview.endDate")
            ? `By ${currentApplication.requestOverview.endDate}`
            : "Not specified",
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

          // Add products information for better display
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
      await verifyStageUpdate(supplier.id)

      setNotification({
        type: "success",
        message: `Contact initiated with ${supplier.entityOverview?.tradingName || supplier.entityOverview?.registeredName}`,
      })

      if (applicationPayload.status === "Accepted") {
        // Notify parent about accepted supplier
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

  const getUrgencyClass = (urgency) => {
    if (urgency.includes("1 week")) return { backgroundColor: "#FFEBEE", color: "#D32F2F" }
    if (urgency.includes("2 weeks")) return { backgroundColor: "#FFF3E0", color: "#F57C00" }
    return { backgroundColor: "#E8F5E8", color: "#388E3C" }
  }

  const handleViewDetails = (supplier) => {
    setModalContent({ type: "view", supplier })
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
  if (error) return <div>Error: {error}</div>

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
          </div>
        </div>

        {/* Table Content */}
        {filteredSuppliers.length === 0 ? (
          <div style={noResultsStyle}>
            <p>No suppliers match your current filters.</p>
            <button onClick={clearAllFilters} style={clearFiltersButtonStyle}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <colgroup>
                <col style={{ width: "8%" }} /> {/* Supplier Name */}
                <col style={{ width: "8%" }} /> {/* Location */}
                <col style={{ width: "8%" }} /> {/* Sector */}
                <col style={{ width: "5%" }} /> {/* Rating */}
                <col style={{ width: "5%" }} /> {/* BBBEE */}
                <col style={{ width: "8%" }} /> {/* Revenue */}
                <col style={{ width: "8%" }} /> {/* Category */}
                <col style={{ width: "8%" }} /> {/* Urgency */}
                <col style={{ width: "8%" }} /> {/* Match % */}
                <col style={{ width: "5%" }} /> {/* Action */}
                <col style={{ width: "8%" }} /> {/* Stage */}
              </colgroup>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Supplier Name</th>
                  <th style={tableHeaderStyle}>Location</th>
                  <th style={tableHeaderStyle}>Sector Focus</th>
                  <th style={tableHeaderStyle}>Rating</th>
                  <th style={tableHeaderStyle}>BBBEE Level</th>
                  <th style={tableHeaderStyle}>Revenue</th>
                  <th style={tableHeaderStyle}>Category</th>
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
                      {/* Supplier Name Cell - CHANGE: Removed avatar */}
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

                      {/* Location Cell */}
                      <td style={tableCellStyle}>
                        <TruncatedText text={supplier.entityOverview?.location || "Not specified"} maxLength={12} />
                      </td>

                      {/* Sector Focus Cell - CHANGE: Normal text, see more underneath */}
                      <td style={tableCellStyle}>
                        <TruncatedText
                          text={supplier.entityOverview?.economicSectors?.[0] || "Not specified"}
                          maxLength={12}
                        />
                      </td>

                      {/* Rating Cell - CHANGE: Show numbers only like 4/5 */}
                      <td style={tableCellStyle}>
                        <span style={{ fontSize: "0.75rem", color: "#5D2A0A", fontWeight: "500" }}>
                           {supplier.rating}/5
                        </span>
                      </td>

                      {/* BBBEE Level Cell - CHANGE: Normal text */}
                      <td style={tableCellStyle}>
                        <TruncatedText text={supplier.legalCompliance?.bbbeeLevel || "N/A"} maxLength={8} />
                      </td>

                      {/* Annual Revenue Cell */}
                      <td style={tableCellStyle}>
                        <TruncatedText
                          text={supplier.financialOverview?.annualRevenue || "Not specified"}
                          maxLength={12}
                        />
                      </td>

                      {/* Service Category Cell - CHANGE: Normal text, see more underneath */}
                      <td style={tableCellStyle}>
                        <TruncatedText
                          text={
                            // Check both productCategories and serviceCategories
                            supplier.productsServices?.productCategories?.[0]?.name ||
                            supplier.productsServices?.serviceCategories?.[0]?.name ||
                            "Not specified"
                          }
                          maxLength={10}
                        />
                      </td>

                      {/* Urgency Cell - CHANGE: Normal text, see more underneath */}
                      <td style={tableCellStyle}>
                        <TruncatedText text={supplier.urgency || "1 month"} maxLength={10} />
                      </td>

                      {/* Match Percentage Cell - CHANGE: Added progress bar like customer table */}
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

                      {/* Action Cell */}
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

                      {/* Stage Cell - CHANGE: Two lines, different colors, no see more */}
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
        )}

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

      {/* {modal added 21st}  */}
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
                      const criteriaInfo = Object.values(MATCHING_CRITERIA).find(
                        (c) => c.description === details.description,
                      )
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

      {/* Modal */}
      {mounted &&
        showModal &&
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
                <h3 style={modalTitleStyle}>
                  {modalContent.type === "view" && "Supplier Details"}
                  {modalContent.type === "documents" && "Supplier Documents"}
                  {modalContent.type === "message" && "Send Message"}
                  {modalContent.type === "call" && "Call Supplier"}
                </h3>
                <button onClick={() => setShowModal(false)} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                {modalContent.type === "view" && (
                  <div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: "1rem",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <div style={detailCardStyle}>
                        <p style={detailTextStyle}>
                          <strong>Supplier:</strong>{" "}
                          {modalContent.supplier?.entityOverview?.tradingName ||
                            modalContent.supplier?.entityOverview?.registeredName}
                        </p>
                        <p style={detailTextStyle}>
                          <strong>Service Category:</strong> {modalContent.supplier?.serviceCategory}
                        </p>
                        <p style={detailTextStyle}>
                          <strong>Service Offered:</strong>{" "}
                          {modalContent.supplier?.productsServices?.productCategories?.[0]?.name || "Not specified"}
                        </p>
                      </div>
                      <div style={detailCardStyle}>
                        <p style={detailTextStyle}>
                          <strong>Match Score:</strong> {modalContent.supplier?.matchPercentage}%
                        </p>
                        <p style={detailTextStyle}>
                          <strong>Location:</strong> {modalContent.supplier?.entityOverview?.location}
                        </p>
                        <p style={detailTextStyle}>
                          <strong>BBBEE Level:</strong> {modalContent.supplier?.bbbeeLevel}
                        </p>
                      </div>
                      <div style={detailCardStyle}>
                        <p style={detailTextStyle}>
                          <strong>Annual Revenue:</strong>{" "}
                          {modalContent.supplier?.financialOverview?.annualRevenue || "Not specified"}
                        </p>
                        <p style={detailTextStyle}>
                          <strong>Status:</strong> {modalContent.supplier?.status}
                        </p>
                        <p style={detailTextStyle}>
                          <strong>Rating:</strong> {modalContent.supplier?.rating?.toFixed(1)}/5
                        </p>
                      </div>
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <h4 style={{ color: "#5d4037", fontSize: "14px", margin: "0 0 8px 0" }}>Supplier Documents:</h4>
                      <ul
                        style={{
                          listStyle: "none",
                          padding: "0",
                          margin: "0",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        <li
                          style={{
                            padding: "0.5rem",
                            background: "#F5EBE0",
                            borderRadius: "4px",
                            fontSize: "0.875rem",
                          }}
                        >
                          📄 Company Profile.pdf
                        </li>
                        <li
                          style={{
                            padding: "0.5rem",
                            background: "#F5EBE0",
                            borderRadius: "4px",
                            fontSize: "0.875rem",
                          }}
                        >
                          📄 BBBEE Certificate.pdf
                        </li>
                        <li
                          style={{
                            padding: "0.5rem",
                            background: "#F5EBE0",
                            borderRadius: "4px",
                            fontSize: "0.875rem",
                          }}
                        >
                          📄 Tax Compliance.pdf
                        </li>
                        <li
                          style={{
                            padding: "0.5rem",
                            background: "#F5EBE0",
                            borderRadius: "4px",
                            fontSize: "0.875rem",
                          }}
                        >
                          📄 References.pdf
                        </li>
                      </ul>
                    </div>

                    <div style={modalActionsStyle}>
                      <button
                        style={primaryButtonStyle}
                        onClick={() => {
                          setModalContent({ type: "documents", supplier: modalContent.supplier })
                        }}
                      >
                        View Documents
                      </button>
                      <button style={cancelButtonStyle} onClick={() => setShowModal(false)}>
                        Close
                      </button>
                    </div>
                  </div>
                )}
                {modalContent.type === "documents" && (
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
                )}
                {modalContent.type === "message" && (
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
                )}
                {modalContent.type === "call" && (
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
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
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