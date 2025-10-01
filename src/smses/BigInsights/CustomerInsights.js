"use client"

import { useEffect, useRef, useState } from "react"
import { Chart, registerables } from "chart.js"
import { TrendingUp, Users, Clock, Award, Search, UserCheck, BarChart3, Star } from "lucide-react"
import { getAuth } from "firebase/auth"
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore"
import { db } from "../../firebaseConfig";
import "../MyFunderMatches/funding-insights.css"

Chart.register(...registerables)

// Helper function for deep comparison
function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

// Custom hook for deep comparison memoization  
function useDeepCompareMemo(value) {
  const ref = useRef()

  if (!isEqual(value, ref.current)) {
    ref.current = value
  }

  return ref.current
}

// Add this helper function at the top of the CustomerInsights component
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

export function CustomerInsights() {
  const [activeTab, setActiveTab] = useState("matching-discovery")
  const [applications, setApplications] = useState([])
  const [currentCustomerId, setCurrentCustomerId] = useState(null)
  const [loading, setLoading] = useState(true)
  const charts = useRef([])
  const prevActiveTab = useRef()

  // Set up auth listener and fetch applications
  useEffect(() => {
    const auth = getAuth()
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentCustomerId(user.uid)
      } else {
        setCurrentCustomerId(null)
        setApplications([])
        setLoading(false)
      }
    })

    return () => unsubscribeAuth()
  }, [])

  // Set up real-time listener for applications
  useEffect(() => {
    if (!currentCustomerId) {
      setApplications([])
      setLoading(false)
      return
    }

    setLoading(true)
    const q = query(
      collection(db, "supplierApplications"),
      where("customerId", "==", currentCustomerId)
    )

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const apps = querySnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            // Safely handle timestamps
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : null
          }
        })
        setApplications(apps)
        setLoading(false)
      },
      (err) => {
        console.error("Error listening to applications:", err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [currentCustomerId])

  // Process application data into insights
  const processInsightsData = () => {
    if (applications.length === 0) {
      return {
        totalMatches: 0,
        avgMatchScore: 0,
        responseTime: 0,
        conversionRate: 0,
        newMatchesOverTime: [],
        matchRateByServiceType: {},
        avgMatchScorePerOpportunity: [],
        customerShortlistRate: [],
        responseTimePerRequest: {},
        opportunitiesIgnoredDeclined: { Responded: 0, Ignored: 0, Declined: 0 },
        proposalConversionRate: { Submitted: 0, "Under Review": 0, Accepted: 0, Rejected: 0 },
        avgDealSizeByCustomerType: {},
        dealFlowByStage: {},
        avgRatingOverTime: [],
        ratingsByCustomerType: {},
        feedbackThemes: {}
      }
    }

    // Calculate basic metrics
    const totalMatches = applications.length
    const avgMatchScore = applications.reduce((sum, app) => sum + (app.matchPercentage || 0), 0) / totalMatches
    const respondedApplications = applications.filter(app => app.currentStage !== "Contact Initiated").length
    const conversionRate = totalMatches > 0 ? (respondedApplications / totalMatches) * 100 : 0

    // Calculate response time (simplified - using creation to current time)
    const now = new Date()
    const totalResponseTime = applications.reduce((sum, app) => {
      if (app.createdAt) {
        const created = app.createdAt.toDate ? app.createdAt.toDate() : new Date(app.createdAt)
        return sum + (now - created) / (1000 * 60 * 60) // hours
      }
      return sum
    }, 0)
    const responseTime = totalMatches > 0 ? totalResponseTime / totalMatches : 0

    // Group by month for time-based charts
    const monthlyData = {}
    applications.forEach(app => {
      if (app.createdAt) {
        const date = app.createdAt.toDate ? app.createdAt.toDate() : new Date(app.createdAt)
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`

        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = { matches: 0, shortlisted: 0, ratings: [] }
        }

        monthlyData[monthYear].matches++

        // Count as shortlisted if beyond contact initiated
        if (app.currentStage && app.currentStage !== "Contact Initiated") {
          monthlyData[monthYear].shortlisted++
        }

        // Add rating if available (simulated)
        if (app.matchPercentage) {
          monthlyData[monthYear].ratings.push((app.matchPercentage / 100) * 5) // Convert to 5-star scale
        }
      }
    })

    // Prepare new matches over time data
    const newMatchesOverTime = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      matches: data.matches
    }))

    // Prepare customer shortlist rate data
    const customerShortlistRate = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      percentage: data.matches > 0 ? (data.shortlisted / data.matches) * 100 : 0
    }))

    // Prepare average rating over time data
    const avgRatingOverTime = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      rating: data.ratings.length > 0 ?
        data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length : 0
    }))

    // FIXED: Group by service type - extract from multiple possible sources
    const serviceTypeCounts = {};
    applications.forEach(app => {
      let serviceType = "Not specified";

      // Use the same logic as CustomerTable
      if (app.supplierOffer) {
        serviceType = getFirstCategory(app.supplierOffer);
      }
      else if (app.originalRequest?.serviceRequested && app.originalRequest.serviceRequested !== "Not specified") {
        serviceType = app.originalRequest.serviceRequested;
      }
      else if (app.applicationData?.productsServices) {
        serviceType = getFirstCategory(app.applicationData.productsServices);
      }

      serviceTypeCounts[serviceType] = (serviceTypeCounts[serviceType] || 0) + 1;
    })
    // Prepare match rate by service type
    const matchRateByServiceType = {}
    Object.entries(serviceTypeCounts).forEach(([service, count]) => {
      matchRateByServiceType[service] = (count / totalMatches) * 100
    })

    // Prepare average match score per opportunity
    const avgMatchScorePerOpportunity = applications.slice(0, 6).map((app, index) => ({
      opportunityId: `OPP-${(index + 1).toString().padStart(3, '0')}`,
      score: app.matchPercentage || 0
    }))

    // Prepare response time per request (simplified)
    const responseTimePerRequest = {}
    applications.slice(0, 6).forEach((app, index) => {
      if (app.createdAt) {
        const created = app.createdAt.toDate ? app.createdAt.toDate() : new Date(app.createdAt)
        responseTimePerRequest[`REQ-${(index + 1).toString().padStart(3, '0')}`] =
          (now - created) / (1000 * 60 * 60) // hours
      }
    })

    // Prepare opportunities ignored/declined (simplified)
    const responded = applications.filter(app => app.currentStage !== "Contact Initiated").length
    const ignored = applications.filter(app => app.currentStage === "Contact Initiated").length
    const declined = applications.filter(app => app.status === "Declined" || app.status === "Rejected").length

    const opportunitiesIgnoredDeclined = {
      Responded: (responded / totalMatches) * 100,
      Ignored: (ignored / totalMatches) * 100,
      Declined: (declined / totalMatches) * 100
    }

    // NEW: Service Type Analysis - More detailed service insights
    const serviceTypeAnalysis = {};
    applications.forEach(app => {
      let serviceType = "Not specified";

      // Use the same logic as above to extract service type
      if (app.supplierOffer) {
        serviceType = getFirstCategory(app.supplierOffer);
      }
      else if (app.originalRequest?.serviceRequested && app.originalRequest.serviceRequested !== "Not specified") {
        serviceType = app.originalRequest.serviceRequested;
      }
      else if (app.applicationData?.productsServices) {
        serviceType = getFirstCategory(app.applicationData.productsServices);
      }

      if (!serviceTypeAnalysis[serviceType]) {
        serviceTypeAnalysis[serviceType] = {
          count: 0,
          totalMatchScore: 0,
          totalResponseTime: 0,
          responseTimeCount: 0
        }
      }

      serviceTypeAnalysis[serviceType].count++;
      serviceTypeAnalysis[serviceType].totalMatchScore += app.matchPercentage || 0;

      // Calculate response time for this service type
      if (app.createdAt) {
        const created = app.createdAt.toDate ? app.createdAt.toDate() : new Date(app.createdAt);
        const responseTime = (now - created) / (1000 * 60 * 60);
        serviceTypeAnalysis[serviceType].totalResponseTime += responseTime;
        serviceTypeAnalysis[serviceType].responseTimeCount++;
      }
    });

    // Calculate averages for service type analysis
    Object.keys(serviceTypeAnalysis).forEach(serviceType => {
      const data = serviceTypeAnalysis[serviceType]
      data.avgMatchScore = data.count > 0 ? data.totalMatchScore / data.count : 0
      data.avgResponseTime = data.responseTimeCount > 0 ? data.totalResponseTime / data.responseTimeCount : 0
    })

    // Prepare proposal conversion rate (simplified)
    const proposalConversionRate = {
      Submitted: 45, // Placeholder values
      "Under Review": 28,
      Accepted: 18,
      Rejected: 9
    }

    // Prepare average deal size by customer type (simplified)
    const avgDealSizeByCustomerType = {
      Enterprise: 125000,
      SME: 45000,
      Startup: 18000,
      Government: 85000
    }

    // Prepare deal flow by stage (simplified)
    const stageCounts = {}
    applications.forEach(app => {
      const stage = app.currentStage || "Unknown"
      stageCounts[stage] = (stageCounts[stage] || 0) + 1
    })

    const dealFlowByStage = stageCounts

    // Prepare ratings by customer type (simplified)
    const ratingsByCustomerType = {
      Enterprise: 4.5,
      SME: 4.2,
      Startup: 4.0,
      Government: 4.3
    }

    // Prepare feedback themes (simplified)
    const feedbackThemes = {
      "Quality of Service": 45,
      "Response Time": 38,
      Communication: 32,
      "Technical Expertise": 28,
      Pricing: 22
    }

    return {
      totalMatches,
      avgMatchScore,
      responseTime,
      conversionRate,
      newMatchesOverTime,
      matchRateByServiceType,
      avgMatchScorePerOpportunity,
      customerShortlistRate,
      responseTimePerRequest,
      opportunitiesIgnoredDeclined,
      proposalConversionRate,
      avgDealSizeByCustomerType,
      dealFlowByStage,
      avgRatingOverTime,
      ratingsByCustomerType,
      feedbackThemes,
      serviceTypeAnalysis // NEW: Added detailed service analysis
    }
  }

  const insightsData = processInsightsData()
  const memoizedInsights = useDeepCompareMemo(insightsData)

  // Chart refs for all categories
  const chartRefs = {
    newMatchesOverTime: useRef(null),
    matchRateByServiceType: useRef(null),
    avgMatchScorePerOpportunity: useRef(null),
    customerShortlistRate: useRef(null),
    responseTimePerRequest: useRef(null),
    opportunitiesIgnoredDeclined: useRef(null),
    proposalConversionRate: useRef(null),
    avgDealSizeByCustomerType: useRef(null),
    dealFlowByStage: useRef(null),
    avgRatingOverTime: useRef(null),
    ratingsByCustomerType: useRef(null),
    feedbackThemes: useRef(null),
  }

  const [firestoreData, setFirestoreData] = useState({
  avgRatingOverTime: [],
  ratingsByCustomerType: {},
  feedbackThemes: {},
});


useEffect(() => {
  const fetchSupplierReviews = async () => {
    try {
      const supplierName = "Mofokeng Enterprise"; // temporary
      const reviewsRef = collection(db, "supplierReviews");
      const q = query(reviewsRef, where("supplierName", "==", supplierName));
      const snapshot = await getDocs(q);
      const reviews = snapshot.docs.map(doc => doc.data());

      // --- Avg Rating Over Time ---
      const ratingsByMonth = {};
      reviews.forEach(r => {
        const date = new Date(r.date);
        const month = date.toLocaleString("default", { month: "short" });
        const year = date.getFullYear();
        const key = `${month} ${year}`;
        if (!ratingsByMonth[key]) ratingsByMonth[key] = [];
        ratingsByMonth[key].push(r.rating);
      });

      const avgRatingOverTime = Object.entries(ratingsByMonth).map(([month, ratings]) => ({
        month,
        rating: ratings.reduce((sum, r) => sum + r, 0) / ratings.length,
      }));
      avgRatingOverTime.sort((a, b) => new Date(a.month) - new Date(b.month));

      // --- Feedback Themes ---
      const feedbackThemes = {};
      reviews.forEach(r => {
        const theme = r.feedbackTheme || "Uncategorized";
        feedbackThemes[theme] = (feedbackThemes[theme] || 0) + 1;
      });

      // --- Ratings by Customer Type ---
      const ratingsByCustomerType = {};
      reviews.forEach(r => {
        const type = r.customerType || "Unknown"; // make sure customerType exists in your DB
        if (!ratingsByCustomerType[type]) ratingsByCustomerType[type] = [];
        ratingsByCustomerType[type].push(r.rating);
      });

      // Calculate average per customer type
      const avgRatingsByCustomerType = {};
      Object.entries(ratingsByCustomerType).forEach(([type, ratings]) => {
        avgRatingsByCustomerType[type] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      });

      setFirestoreData({ avgRatingOverTime, feedbackThemes, ratingsByCustomerType: avgRatingsByCustomerType });
    } catch (err) {
      console.error("Error fetching supplier reviews:", err);
    }
  };

  fetchSupplierReviews();
}, []);



  useEffect(() => {
    // Store current props for next comparison
    prevActiveTab.current = activeTab

    // Destroy existing charts
    charts.current.forEach((chart) => chart.destroy())
    charts.current = []

    const brownPalette = {
      primary: "#6d4c41",
      secondary: "#8d6e63",
      tertiary: "#a1887f",
      light: "#bcaaa4",
      lighter: "#d7ccc8",
      lightest: "#efebe9",
      accent1: "#5d4037",
      accent2: "#4e342e",
      accent3: "#3e2723",
    }

    const createChart = (ref, config) => {
      if (ref.current) {
        const ctx = ref.current.getContext("2d")
        if (ctx) {
          const chart = new Chart(ctx, config)
          charts.current.push(chart)
        }
      }
    }

    // TAB 1: Matching & Discovery
    if (activeTab === "matching-discovery") {
      // New Matches Over Time (Line Chart)
      if (memoizedInsights.newMatchesOverTime.length > 0) {
        createChart(chartRefs.newMatchesOverTime, {
          type: "line",
          data: {
            labels: memoizedInsights.newMatchesOverTime.map((d) => d.month),
            datasets: [
              {
                label: "Matched Opportunities",
                data: memoizedInsights.newMatchesOverTime.map((d) => d.matches),
                borderColor: brownPalette.primary,
                backgroundColor: brownPalette.lighter,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: brownPalette.primary,
                pointBorderColor: brownPalette.accent1,
                pointRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: "New Matches Over Time",
                color: brownPalette.primary,
                font: { weight: "bold", size: 12 },
              },
              legend: { display: false },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Month",
                  color: brownPalette.primary,
                },
                ticks: { color: brownPalette.primary, font: { size: 10 } },
                grid: { color: brownPalette.lighter },
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Matched Opportunities (Count)",
                  color: brownPalette.primary,
                },
                ticks: { color: brownPalette.primary, font: { size: 10 } },
                grid: { color: brownPalette.lighter },
              },
            },
          },
        })
      }

      // Match Rate by Service Type (Bar Chart) - FIXED
      if (Object.keys(memoizedInsights.matchRateByServiceType).length > 0) {
        // Sort services by percentage (descending) and take top 10
        const sortedServices = Object.entries(memoizedInsights.matchRateByServiceType)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)

        createChart(chartRefs.matchRateByServiceType, {
          type: "bar",
          data: {
            labels: sortedServices.map(([service]) => service),
            datasets: [
              {
                label: "Match Percentage",
                data: sortedServices.map(([, percentage]) => percentage),
                backgroundColor: brownPalette.secondary,
                borderColor: brownPalette.primary,
                borderWidth: 1,
              },
            ],
          },
          options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: "Match Rate by Service Type",
                color: brownPalette.primary,
                font: { weight: "bold", size: 12 },
              },
              legend: { display: false },
            },
            scales: {
              x: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: "Match Percentage (%)",
                  color: brownPalette.primary,
                },
                ticks: {
                  color: brownPalette.primary,
                  font: { size: 10 },
                  callback: (value) => value + "%"
                },
                grid: { color: brownPalette.lighter },
              },
              y: {
                title: {
                  display: true,
                  text: "Service Type",
                  color: brownPalette.primary,
                },
                ticks: { color: brownPalette.primary, font: { size: 10 } },
                grid: { color: brownPalette.lighter },
              },
            },
          },
        })
      }

      // Avg. Match Score Per Opportunity (Column Chart)
      if (memoizedInsights.avgMatchScorePerOpportunity.length > 0) {
        createChart(chartRefs.avgMatchScorePerOpportunity, {
          type: "bar",
          data: {
            labels: memoizedInsights.avgMatchScorePerOpportunity.map((d) => d.opportunityId),
            datasets: [
              {
                label: "Match Score",
                data: memoizedInsights.avgMatchScorePerOpportunity.map((d) => d.score),
                backgroundColor: brownPalette.tertiary,
                borderColor: brownPalette.primary,
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: "Avg. Match Score Per Opportunity",
                color: brownPalette.primary,
                font: { weight: "bold", size: 12 },
              },
              legend: { display: false },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Opportunity ID",
                  color: brownPalette.primary,
                },
                ticks: { color: brownPalette.primary, font: { size: 10 } },
                grid: { color: brownPalette.lighter },
              },
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: "Match Score (% Score 0-100)",
                  color: brownPalette.primary,
                },
                ticks: {
                  color: brownPalette.primary,
                  font: { size: 10 },
                  callback: (value) => value + "%",
                },
                grid: { color: brownPalette.lighter },
              },
            },
          },
        })
      }
    }

    // TAB 2: Customer Engagement
    if (activeTab === "customer-engagement") {
      // Customer Shortlist Rate (Line Chart)
      if (memoizedInsights.customerShortlistRate.length > 0) {
        createChart(chartRefs.customerShortlistRate, {
          type: "line",
          data: {
            labels: memoizedInsights.customerShortlistRate.map((d) => d.month),
            datasets: [
              {
                label: "% Shortlisted",
                data: memoizedInsights.customerShortlistRate.map((d) => d.percentage),
                borderColor: brownPalette.primary,
                backgroundColor: brownPalette.lighter,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: brownPalette.primary,
                pointBorderColor: brownPalette.accent1,
                pointRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: "Customer Shortlist Rate",
                color: brownPalette.primary,
                font: { weight: "bold", size: 12 },
              },
              legend: { display: false },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Month",
                  color: brownPalette.primary,
                },
                ticks: { color: brownPalette.primary, font: { size: 10 } },
                grid: { color: brownPalette.lighter },
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "% Shortlisted (Percentage)",
                  color: brownPalette.primary,
                },
                ticks: {
                  color: brownPalette.primary,
                  font: { size: 10 },
                  callback: (value) => value + "%",
                },
                grid: { color: brownPalette.lighter },
              },
            },
          },
        })
      }

      // Response Time Per Request (Bar Chart)
      if (Object.keys(memoizedInsights.responseTimePerRequest).length > 0) {
        createChart(chartRefs.responseTimePerRequest, {
          type: "bar",
          data: {
            labels: Object.keys(memoizedInsights.responseTimePerRequest),
            datasets: [
              {
                label: "Hours/Days",
                data: Object.values(memoizedInsights.responseTimePerRequest),
                backgroundColor: brownPalette.accent1,
                borderColor: brownPalette.primary,
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: "Response Time Per Request",
                color: brownPalette.primary,
                font: { weight: "bold", size: 12 },
              },
              legend: { display: false },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Request ID",
                  color: brownPalette.primary,
                },
                ticks: { color: brownPalette.primary, font: { size: 10 } },
                grid: { color: brownPalette.lighter },
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Hours/Days (Time)",
                  color: brownPalette.primary,
                },
                ticks: {
                  color: brownPalette.primary,
                  font: { size: 10 },
                  callback: (value) => value + "h",
                },
                grid: { color: brownPalette.lighter },
              },
            },
          },
        })
      }

      // % Opportunities Ignored or Declined (Donut Chart)
      if (Object.keys(memoizedInsights.opportunitiesIgnoredDeclined).length > 0) {
        createChart(chartRefs.opportunitiesIgnoredDeclined, {
          type: "doughnut",
          data: {
            labels: Object.keys(memoizedInsights.opportunitiesIgnoredDeclined),
            datasets: [
              {
                data: Object.values(memoizedInsights.opportunitiesIgnoredDeclined),
                backgroundColor: [brownPalette.primary, brownPalette.secondary, brownPalette.tertiary],
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: "% Opportunities Ignored or Declined",
                color: brownPalette.primary,
                font: { weight: "bold", size: 12 },
              },
              legend: {
                position: "bottom",
                labels: {
                  color: brownPalette.primary,
                  boxWidth: 8,
                  padding: 8,
                  font: { size: 9 },
                },
              },
            },
          },
        })
      }
    }

    // TAB 3: Deal Pipeline
    if (activeTab === "deal-pipeline") {
      // Proposal Conversion Rate (Column Chart)
      if (Object.keys(memoizedInsights.proposalConversionRate).length > 0) {
        createChart(chartRefs.proposalConversionRate, {
          type: "bar",
          data: {
            labels: Object.keys(memoizedInsights.proposalConversionRate),
            datasets: [
              {
                label: "Conversion %",
                data: Object.values(memoizedInsights.proposalConversionRate),
                backgroundColor: brownPalette.light,
                borderColor: brownPalette.primary,
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: "Proposal Conversion Rate",
                color: brownPalette.primary,
                font: { weight: "bold", size: 12 },
              },
              legend: { display: false },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Proposal Status",
                  color: brownPalette.primary,
                },
                ticks: { color: brownPalette.primary, font: { size: 10 } },
                grid: { color: brownPalette.lighter },
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Conversion % (Percentage)",
                  color: brownPalette.primary,
                },
                ticks: {
                  color: brownPalette.primary,
                  font: { size: 10 },
                  callback: (value) => value + "%",
                },
                grid: { color: brownPalette.lighter },
              },
            },
          },
        })
      }

      // Avg. Deal Size by Customer Type (Bar Chart)
      if (Object.keys(memoizedInsights.avgDealSizeByCustomerType).length > 0) {
        createChart(chartRefs.avgDealSizeByCustomerType, {
          type: "bar",
          data: {
            labels: Object.keys(memoizedInsights.avgDealSizeByCustomerType),
            datasets: [
              {
                label: "ZAR Value",
                data: Object.values(memoizedInsights.avgDealSizeByCustomerType),
                backgroundColor: brownPalette.accent2,
                borderColor: brownPalette.primary,
                borderWidth: 1,
              },
            ],
          },
          options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: "Avg. Deal Size by Customer Type",
                color: brownPalette.primary,
                font: { weight: "bold", size: 12 },
              },
              legend: { display: false },
            },
            scales: {
              x: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "ZAR Value (ZAR)",
                  color: brownPalette.primary,
                },
                ticks: {
                  color: brownPalette.primary,
                  font: { size: 10 },
                  callback: (value) => "R" + (value / 1000).toFixed(0) + "k",
                },
                grid: { color: brownPalette.lighter },
              },
              y: {
                title: {
                  display: true,
                  text: "Customer Type",
                  color: brownPalette.primary,
                },
                ticks: { color: brownPalette.primary, font: { size: 10 } },
                grid: { color: brownPalette.lighter },
              },
            },
          },
        })
      }

      // Deal Flow by Stage (Funnel/Stacked Bar)
      if (Object.keys(memoizedInsights.dealFlowByStage).length > 0) {
        createChart(chartRefs.dealFlowByStage, {
          type: "bar",
          data: {
            labels: Object.keys(memoizedInsights.dealFlowByStage),
            datasets: [
              {
                label: "Number of Deals",
                data: Object.values(memoizedInsights.dealFlowByStage),
                backgroundColor: [
                  brownPalette.primary,
                  brownPalette.secondary,
                  brownPalette.tertiary,
                  brownPalette.light,
                  brownPalette.lighter,
                ],
                borderColor: brownPalette.primary,
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: "Deal Flow by Stage",
                color: brownPalette.primary,
                font: { weight: "bold", size: 12 },
              },
              legend: { display: false },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Deal Stage",
                  color: brownPalette.primary,
                },
                ticks: { color: brownPalette.primary, font: { size: 10 } },
                grid: { color: brownPalette.lighter },
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Number of Deals (Count)",
                  color: brownPalette.primary,
                },
                ticks: { color: brownPalette.primary, font: { size: 10 } },
                grid: { color: brownPalette.lighter },
              },
            },
          },
        })
      }
    }

    
   // TAB 4: Ratings & Feedback
    if (activeTab === "ratings-feedback") {
  // Avg. Rating Over Time (Line Chart)
 createChart(chartRefs.avgRatingOverTime, {
    type: "line",
    data: {
      labels: firestoreData.avgRatingOverTime.map(d => d.month),
      datasets: [{
        label: "Avg Rating",
        data: firestoreData.avgRatingOverTime.map(d => d.rating),
        borderColor: brownPalette.primary,
        backgroundColor: brownPalette.lighter,
        tension: 0.4,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Avg. Rating Over Time",
          color: brownPalette.primary,
          font: { weight: "bold", size: 12 },
        },
        legend: { display: false },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Month",
            color: brownPalette.primary,
          },
          ticks: { color: brownPalette.primary, font: { size: 10 } },
          grid: { color: brownPalette.lighter },
        },
        y: {
          beginAtZero: true,
          max: 5,
          title: {
            display: true,
            text: "Avg. Rating (Score 1-5)",
            color: brownPalette.primary,
          },
          ticks: { color: brownPalette.primary, font: { size: 10 } },
          grid: { color: brownPalette.lighter },
        },
      },
    },
  });

  // Ratings by Customer Type (Column Chart)
createChart(chartRefs.ratingsByCustomerType, {
  type: "bar",
  data: {
    labels: Object.keys(firestoreData.ratingsByCustomerType),
    datasets: [
      {
        label: "Avg. Score",
        data: Object.values(firestoreData.ratingsByCustomerType),
        backgroundColor: brownPalette.secondary,
        borderColor: brownPalette.primary,
        borderWidth: 1,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Ratings by Customer Type",
        color: brownPalette.primary,
        font: { weight: "bold", size: 12 },
      },
      legend: { display: false },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Customer Type",
          color: brownPalette.primary,
        },
        ticks: { color: brownPalette.primary, font: { size: 10 } },
        grid: { color: brownPalette.lighter },
      },
      y: {
        beginAtZero: true,
        max: 5,
        title: {
          display: true,
          text: "Avg. Score (Score 1-5)",
          color: brownPalette.primary,
        },
        ticks: { color: brownPalette.primary, font: { size: 10 } },
        grid: { color: brownPalette.lighter },
      },
    },
  },
});

      // Feedback Themes (Top 3 Issues) (Bar Chart)
          // Sort and take top 3 feedback themes
const topThemes = Object.entries(firestoreData.feedbackThemes)
  .sort((a, b) => b[1] - a[1]) // descending by count
  .slice(0, 3);

const labels = topThemes.map(([theme]) => theme);
const data = topThemes.map(([_, count]) => count);

// Create the chart
createChart(chartRefs.feedbackThemes, {
  type: "bar",
  data: {
    labels,
    datasets: [{
      label: "Mentions",
      data,
      backgroundColor: brownPalette.tertiary,
      borderColor: brownPalette.primary,
      borderWidth: 1,
    }],
  },
  options: {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Feedback Themes (Top 3 Issues)",
        color: brownPalette.primary,
        font: { weight: "bold", size: 12 },
      },
      legend: { display: false },
      datalabels: {
        anchor: "end",
        align: "end",
        color: brownPalette.primary,
        font: { weight: "bold" },
        formatter: (value) => value, // display the count
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Mentions (Count)",
          color: brownPalette.primary,
        },
        ticks: { color: brownPalette.primary, font: { size: 10 } },
        grid: { color: brownPalette.lighter },
      },
      y: {
        title: {
          display: true,
          text: "Theme",
          color: brownPalette.primary,
        },
        ticks: { color: brownPalette.primary, font: { size: 10 } },
        grid: { color: brownPalette.lighter },
      },
    },
  },
});
    }

    return () => {
      charts.current.forEach((chart) => chart.destroy())
    }
  }, [activeTab, memoizedInsights, applications])

  if (loading) {
    return <div className="fundingInsights">Loading insights...</div>
  }

  return (
    <div className="fundingInsights">
      <div className="insightsSummary">
        <div className="insightCard">
          <div className="insightIcon">
            <TrendingUp size={18} />
          </div>
          <div className="insightContent">
            <h3>{memoizedInsights.totalMatches}</h3>
            <p>Total Matches</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon">
            <Users size={18} />
          </div>
          <div className="insightContent">
            <h3>{memoizedInsights.avgMatchScore.toFixed(1)}%</h3>
            <p>Avg Match Score</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon">
            <Clock size={18} />
          </div>
          <div className="insightContent">
            <h3>{memoizedInsights.responseTime.toFixed(1)}h</h3>
            <p>Avg Response Time</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon">
            <Award size={18} />
          </div>
          <div className="insightContent">
            <h3>{memoizedInsights.conversionRate.toFixed(1)}%</h3>
            <p>Response Rate</p>
          </div>
        </div>
      </div>

      <div className="insightsTabs">
        <div className="insightsTabHeader">
          <button
            className={`insightsTab ${activeTab === "matching-discovery" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("matching-discovery")}
          >
            <Search size={12} /> <span>Matching & Discovery</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "customer-engagement" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("customer-engagement")}
          >
            <UserCheck size={12} /> <span>Customer Engagement</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "deal-pipeline" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("deal-pipeline")}
          >
            <BarChart3 size={12} /> <span>Deal Pipeline</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "ratings-feedback" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("ratings-feedback")}
          >
            <Star size={12} /> <span>Ratings & Feedback</span>
          </button>
        </div>
      </div>

      <div className="insightsContainer">
        {activeTab === "matching-discovery" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.newMatchesOverTime} />
              {memoizedInsights.newMatchesOverTime.length === 0 && (
                <div className="noDataMessage">No matching data available</div>
              )}
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.matchRateByServiceType} />
              {Object.keys(memoizedInsights.matchRateByServiceType).length === 0 && (
                <div className="noDataMessage">No service type data available</div>
              )}
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgMatchScorePerOpportunity} />
              {memoizedInsights.avgMatchScorePerOpportunity.length === 0 && (
                <div className="noDataMessage">No match score data available</div>
              )}
            </div>
          </>
        )}

        {activeTab === "customer-engagement" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.customerShortlistRate} />
              {memoizedInsights.customerShortlistRate.length === 0 && (
                <div className="noDataMessage">No shortlist data available</div>
              )}
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.responseTimePerRequest} />
              {Object.keys(memoizedInsights.responseTimePerRequest).length === 0 && (
                <div className="noDataMessage">No response time data available</div>
              )}
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.opportunitiesIgnoredDeclined} />
              {Object.keys(memoizedInsights.opportunitiesIgnoredDeclined).length === 0 && (
                <div className="noDataMessage">No engagement data available</div>
              )}
            </div>
          </>
        )}

        {activeTab === "deal-pipeline" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.proposalConversionRate} />
              {Object.keys(memoizedInsights.proposalConversionRate).length === 0 && (
                <div className="noDataMessage">No conversion data available</div>
              )}
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgDealSizeByCustomerType} />
              {Object.keys(memoizedInsights.avgDealSizeByCustomerType).length === 0 && (
                <div className="noDataMessage">No deal size data available</div>
              )}
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.dealFlowByStage} />
              {Object.keys(memoizedInsights.dealFlowByStage).length === 0 && (
                <div className="noDataMessage">No deal flow data available</div>
              )}
            </div>
          </>
        )}

        {activeTab === "ratings-feedback" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgRatingOverTime} />
              {memoizedInsights.avgRatingOverTime.length === 0 && (
                <div className="noDataMessage">No rating data available</div>
              )}
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.ratingsByCustomerType} />
              {Object.keys(memoizedInsights.ratingsByCustomerType).length === 0 && (
                <div className="noDataMessage">No customer rating data available</div>
              )}
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.feedbackThemes} />
              {Object.keys(memoizedInsights.feedbackThemes).length === 0 && (
                <div className="noDataMessage">No feedback data available</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}