"use client"

import { useEffect, useRef, useState } from "react"
import { Chart, registerables } from "chart.js"
import { TrendingUp, Users, Clock, Award, UserCheck, Brain, Target } from "lucide-react"
import { getAuth } from "firebase/auth"
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore"
import { db } from "../../firebaseConfig"
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

export function SupplierInsights() {
  const [activeTab, setActiveTab] = useState("matching-discovery")
  const [suppliers, setSuppliers] = useState([])
  const [applications, setApplications] = useState([])
  const [currentSupplierId, setCurrentSupplierId] = useState(null)
  const [loading, setLoading] = useState(true)
  const charts = useRef([])
  const prevActiveTab = useRef()

  // Set up auth listener
  useEffect(() => {
    const auth = getAuth()
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentSupplierId(user.uid)
      } else {
        setCurrentSupplierId(null)
        setSuppliers([])
        setApplications([])
        setLoading(false)
      }
    })
    
    return () => unsubscribeAuth()
  }, [])

  // Set up real-time listener for supplier applications
  useEffect(() => {
    if (!currentSupplierId) {
      setApplications([])
      setLoading(false)
      return
    }

    setLoading(true)
    const q = query(
      collection(db, "supplierApplications"),
      where("supplierId", "==", currentSupplierId)
    )

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
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
        
        // Fetch supplier profiles for these applications
        if (apps.length > 0) {
          try {
            // Get all customer IDs from applications
            const customerIds = apps.map(app => app.customerId).filter(id => id)
            
            if (customerIds.length > 0) {
              // Fetch customer profiles
              const profilesQuery = query(
                collection(db, "universalProfiles"),
                where("__name__", "in", customerIds)
              )
              
              const profilesSnapshot = await getDocs(profilesQuery)
              const profilesData = profilesSnapshot.docs.map(doc => {
                const data = doc.data()
                return {
                  id: doc.id,
                  ...data,
                  productsServices: data.productsServices || {},
                  financialOverview: data.financialOverview || {},
                  legalCompliance: data.legalCompliance || {},
                  entityOverview: data.entityOverview || {}
                }
              })
              
              // Enrich applications with customer data
              const enrichedApplications = apps.map(app => {
                const customerProfile = profilesData.find(profile => profile.id === app.customerId)
                return {
                  ...app,
                  customerProfile
                }
              })
              
              setApplications(enrichedApplications)
            }
          } catch (err) {
            console.error("Error fetching customer profiles:", err)
          }
        }
        
        setLoading(false)
      },
      (err) => {
        console.error("Error listening to applications:", err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [currentSupplierId])

  // Process application data into insights
  const processInsightsData = () => {
    if (applications.length === 0) {
      return {
        totalMatches: 0,
        avgMatchScore: 0,
        avgResponseTime: 0,
        completionRate: 0,
        supplierMatchCountOverTime: [],
        avgMatchScorePerRequest: [],
        matchesByServiceCategory: {},
        avgSupplierRatingLast6Months: [],
        completionRateBySupplier: {},
        avgTimeToRespond: {},
        conversionRateByServiceType: {},
        avgDealSizeBySupplier: {},
        proposalToDealConversionTime: []
      }
    }

    // Calculate basic metrics
    const totalMatches = applications.length
    const avgMatchScore = applications.reduce((sum, app) => sum + (app.matchPercentage || 0), 0) / totalMatches
    
    // Calculate response time (time from application creation to first response)
    const respondedApplications = applications.filter(app => 
      app.currentStage && app.currentStage !== "Contact Initiated"
    )
    
    let totalResponseTime = 0
    respondedApplications.forEach(app => {
      if (app.createdAt && app.updatedAt) {
        const created = app.createdAt.toDate ? app.createdAt.toDate() : new Date(app.createdAt)
        const updated = app.updatedAt.toDate ? app.updatedAt.toDate() : new Date(app.updatedAt)
        totalResponseTime += (updated - created) / (1000 * 60 * 60 * 24) // days
      }
    })
    
    const avgResponseTime = respondedApplications.length > 0 
      ? totalResponseTime / respondedApplications.length 
      : 0

    // Calculate completion rate (percentage of applications that reached final stage)
    const completedApplications = applications.filter(app => 
      app.status === "Accepted" || app.status === "Completed"
    )
    const completionRate = totalMatches > 0 ? (completedApplications.length / totalMatches) * 100 : 0

    // Group by month for time-based charts
    const monthlyData = {}
    applications.forEach(app => {
      if (app.createdAt) {
        const date = app.createdAt.toDate ? app.createdAt.toDate() : new Date(app.createdAt)
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`
        
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = { matches: 0, ratings: [] }
        }
        
        monthlyData[monthYear].matches++
        
        // Add rating if available (using match percentage as a proxy)
        if (app.matchPercentage) {
          monthlyData[monthYear].ratings.push((app.matchPercentage / 100) * 5) // Convert to 5-star scale
        }
      }
    })

    // Prepare supplier match count over time data
    const supplierMatchCountOverTime = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      matches: data.matches
    }))

    // Prepare average supplier rating over time data
    const avgSupplierRatingLast6Months = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      rating: data.ratings.length > 0 ? 
        data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length : 0
    }))

    // Group by service category
    const serviceCategoryCounts = {}
    applications.forEach(app => {
      // Get service category from customer profile or application
      let serviceCategory = "Not specified"
      if (app.customerProfile?.productsServices?.productCategories) {
        const categories = app.customerProfile.productsServices.productCategories
        if (Array.isArray(categories) && categories.length > 0) {
          serviceCategory = categories[0]?.name || "Not specified"
        }
      } else if (app.originalRequest?.serviceRequested) {
        serviceCategory = app.originalRequest.serviceRequested
      }
      
      serviceCategoryCounts[serviceCategory] = (serviceCategoryCounts[serviceCategory] || 0) + 1
    })

    // Prepare matches by service category
    const matchesByServiceCategory = serviceCategoryCounts

    // Prepare average match score per request
    const avgMatchScorePerRequest = applications.slice(0, 8).map((app, index) => ({
      requestId: `REQ-${(index + 1).toString().padStart(3, '0')}`,
      score: app.matchPercentage || 0
    }))

    // Prepare completion rate by supplier (using customer names)
    const completionRateBySupplier = {}
    applications.forEach(app => {
      const customerName = app.customerName || "Unknown Customer"
      if (!completionRateBySupplier[customerName]) {
        const customerApps = applications.filter(a => a.customerName === customerName)
        const completed = customerApps.filter(a => a.status === "Accepted" || a.status === "Completed")
        completionRateBySupplier[customerName] = customerApps.length > 0 
          ? (completed.length / customerApps.length) * 100 
          : 0
      }
    })

    // Prepare average time to respond by supplier (using customer names)
    const avgTimeToRespond = {}
    applications.forEach(app => {
      const customerName = app.customerName || "Unknown Customer"
      if (!avgTimeToRespond[customerName] && app.createdAt && app.updatedAt) {
        const created = app.createdAt.toDate ? app.createdAt.toDate() : new Date(app.createdAt)
        const updated = app.updatedAt.toDate ? app.updatedAt.toDate() : new Date(app.updatedAt)
        const responseTime = (updated - created) / (1000 * 60 * 60 * 24) // days
        
        const customerApps = applications.filter(a => a.customerName === customerName && a.createdAt && a.updatedAt)
        let totalResponseTime = 0
        customerApps.forEach(customerApp => {
          const cCreated = customerApp.createdAt.toDate ? customerApp.createdAt.toDate() : new Date(customerApp.createdAt)
          const cUpdated = customerApp.updatedAt.toDate ? customerApp.updatedAt.toDate() : new Date(customerApp.updatedAt)
          totalResponseTime += (cUpdated - cCreated) / (1000 * 60 * 60 * 24)
        })
        
        avgTimeToRespond[customerName] = customerApps.length > 0 
          ? totalResponseTime / customerApps.length 
          : responseTime
      }
    })

    // Prepare conversion rate by service type
    const conversionRateByServiceType = {}
    Object.keys(serviceCategoryCounts).forEach(category => {
      const categoryApps = applications.filter(app => {
        let appCategory = "Not specified"
        if (app.customerProfile?.productsServices?.productCategories) {
          const categories = app.customerProfile.productsServices.productCategories
          if (Array.isArray(categories) && categories.length > 0) {
            appCategory = categories[0]?.name || "Not specified"
          }
        } else if (app.originalRequest?.serviceRequested) {
          appCategory = app.originalRequest.serviceRequested
        }
        return appCategory === category
      })
      
      const converted = categoryApps.filter(app => 
        app.status === "Accepted" || app.status === "Completed"
      )
      
      conversionRateByServiceType[category] = categoryApps.length > 0 
        ? (converted.length / categoryApps.length) * 100 
        : 0
    })

    // Prepare average deal size by supplier (using customer names)
    const avgDealSizeBySupplier = {}
    applications.forEach(app => {
      const customerName = app.customerName || "Unknown Customer"
      if (!avgDealSizeBySupplier[customerName]) {
        // Use financial data from customer profile if available
        let dealSize = 0
        if (app.customerProfile?.financialOverview?.annualRevenue) {
          const revenue = app.customerProfile.financialOverview.annualRevenue
          // Extract numeric value from string like "R 1,600,000"
          const numericValue = parseInt(revenue.replace(/[^\d]/g, '')) || 0
          dealSize = numericValue
        }
        
        avgDealSizeBySupplier[customerName] = dealSize
      }
    })

    // Prepare proposal to deal conversion time
    const proposalToDealConversionTime = []
    applications.forEach(app => {
      if (app.status === "Accepted" || app.status === "Completed") {
        const customerName = app.customerName || "Unknown Customer"
        if (app.createdAt && app.updatedAt) {
          const created = app.createdAt.toDate ? app.createdAt.toDate() : new Date(app.createdAt)
          const updated = app.updatedAt.toDate ? app.updatedAt.toDate() : new Date(app.updatedAt)
          const conversionTime = (updated - created) / (1000 * 60 * 60 * 24) // days
          
          proposalToDealConversionTime.push({
            supplier: customerName,
            time: conversionTime
          })
        }
      }
    })

    return {
      totalMatches,
      avgMatchScore,
      avgResponseTime,
      completionRate,
      supplierMatchCountOverTime,
      avgMatchScorePerRequest,
      matchesByServiceCategory,
      avgSupplierRatingLast6Months,
      completionRateBySupplier,
      avgTimeToRespond,
      conversionRateByServiceType,
      avgDealSizeBySupplier,
      proposalToDealConversionTime
    }
  }

  const insightsData = processInsightsData()
  const memoizedInsights = useDeepCompareMemo(insightsData)

  // Chart refs for all categories
  const chartRefs = {
    supplierMatchCountOverTime: useRef(null),
    avgMatchScorePerRequest: useRef(null),
    matchesByServiceCategory: useRef(null),
    avgSupplierRatingLast6Months: useRef(null),
    completionRateBySupplier: useRef(null),
    avgTimeToRespond: useRef(null),
    conversionRateByServiceType: useRef(null),
    avgDealSizeBySupplier: useRef(null),
    proposalToDealConversionTime: useRef(null),
  }

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
      // Supplier Match Count Over Time (Line Chart)
      if (memoizedInsights.supplierMatchCountOverTime.length > 0) {
        createChart(chartRefs.supplierMatchCountOverTime, {
          type: "line",
          data: {
            labels: memoizedInsights.supplierMatchCountOverTime.map((d) => d.month),
            datasets: [
              {
                label: "Matches Found",
                data: memoizedInsights.supplierMatchCountOverTime.map((d) => d.matches),
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
                text: "Supplier Match Count Over Time",
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
                  text: "Matches Found (Count)",
                  color: brownPalette.primary,
                },
                ticks: { color: brownPalette.primary, font: { size: 10 } },
                grid: { color: brownPalette.lighter },
              },
            },
          },
        })
      }

      // Avg. Match Score per Request (Column Chart)
      if (memoizedInsights.avgMatchScorePerRequest.length > 0) {
        createChart(chartRefs.avgMatchScorePerRequest, {
          type: "bar",
          data: {
            labels: memoizedInsights.avgMatchScorePerRequest.map((d) => d.requestId),
            datasets: [
              {
                label: "Match Score",
                data: memoizedInsights.avgMatchScorePerRequest.map((d) => d.score),
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
                text: "Avg. Match Score per Request",
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
                max: 100,
                title: {
                  display: true,
                  text: "Match Score (Score 0-100%)",
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

      // Matches by Service Category (Bar Chart)
      if (Object.keys(memoizedInsights.matchesByServiceCategory).length > 0) {
        createChart(chartRefs.matchesByServiceCategory, {
          type: "bar",
          data: {
            labels: Object.keys(memoizedInsights.matchesByServiceCategory),
            datasets: [
              {
                label: "Matches",
                data: Object.values(memoizedInsights.matchesByServiceCategory),
                backgroundColor: brownPalette.tertiary,
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
                text: "Matches by Service Category",
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
                  text: "Matches (Count)",
                  color: brownPalette.primary,
                },
                ticks: { color: brownPalette.primary, font: { size: 10 } },
                grid: { color: brownPalette.lighter },
              },
              y: {
                title: {
                  display: true,
                  text: "Category",
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

    // TAB 2: Supplier Performance
    if (activeTab === "supplier-performance") {
      // Avg. Supplier Rating (Last 6 Months) (Line Chart)
      if (memoizedInsights.avgSupplierRatingLast6Months.length > 0) {
        createChart(chartRefs.avgSupplierRatingLast6Months, {
          type: "line",
          data: {
            labels: memoizedInsights.avgSupplierRatingLast6Months.map((d) => d.month),
            datasets: [
              {
                label: "Avg. Rating",
                data: memoizedInsights.avgSupplierRatingLast6Months.map((d) => d.rating),
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
                text: "Avg. Supplier Rating (Last 6 Months)",
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
        })
      }

      // Completion Rate by Supplier (Column Chart)
      if (Object.keys(memoizedInsights.completionRateBySupplier).length > 0) {
        createChart(chartRefs.completionRateBySupplier, {
          type: "bar",
          data: {
            labels: Object.keys(memoizedInsights.completionRateBySupplier),
            datasets: [
              {
                label: "% Completed Deals",
                data: Object.values(memoizedInsights.completionRateBySupplier),
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
                text: "Completion Rate by Supplier",
                color: brownPalette.primary,
                font: { weight: "bold", size: 12 },
              },
              legend: { display: false },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Supplier",
                  color: brownPalette.primary,
                },
                ticks: {
                  color: brownPalette.primary,
                  font: { size: 10 },
                  maxRotation: 45,
                },
                grid: { color: brownPalette.lighter },
              },
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: "% Completed Deals (Percentage)",
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

      // Avg. Time to Respond (Bar Chart)
      if (Object.keys(memoizedInsights.avgTimeToRespond).length > 0) {
        createChart(chartRefs.avgTimeToRespond, {
          type: "bar",
          data: {
            labels: Object.keys(memoizedInsights.avgTimeToRespond),
            datasets: [
              {
                label: "Days",
                data: Object.values(memoizedInsights.avgTimeToRespond),
                backgroundColor: brownPalette.accent1,
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
                text: "Avg. Time to Respond",
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
                  text: "Days (Days)",
                  color: brownPalette.primary,
                },
                ticks: {
                  color: brownPalette.primary,
                  font: { size: 10 },
                  callback: (value) => value + "d",
                },
                grid: { color: brownPalette.lighter },
              },
              y: {
                title: {
                  display: true,
                  text: "Supplier",
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

    // TAB 3: Engagement Outcome
    if (activeTab === "engagement-outcome") {
      // Conversion Rate by Service Type (Column Chart)
      if (Object.keys(memoizedInsights.conversionRateByServiceType).length > 0) {
        createChart(chartRefs.conversionRateByServiceType, {
          type: "bar",
          data: {
            labels: Object.keys(memoizedInsights.conversionRateByServiceType),
            datasets: [
              {
                label: "% Converted to Deal",
                data: Object.values(memoizedInsights.conversionRateByServiceType),
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
                text: "Conversion Rate by Service Type",
                color: brownPalette.primary,
                font: { weight: "bold", size: 12 },
              },
              legend: { display: false },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Service Type",
                  color: brownPalette.primary,
                },
                ticks: {
                  color: brownPalette.primary,
                  font: { size: 10 },
                  maxRotation: 45,
                },
                grid: { color: brownPalette.lighter },
              },
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: "% Converted to Deal (Percentage)",
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

      // Avg. Deal Size by Supplier (Bar Chart)
      if (Object.keys(memoizedInsights.avgDealSizeBySupplier).length > 0) {
        createChart(chartRefs.avgDealSizeBySupplier, {
          type: "bar",
          data: {
            labels: Object.keys(memoizedInsights.avgDealSizeBySupplier),
            datasets: [
              {
                label: "Deal Size",
                data: Object.values(memoizedInsights.avgDealSizeBySupplier),
                backgroundColor: brownPalette.tertiary,
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
                text: "Avg. Deal Size by Supplier",
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
                  text: "Deal Size (ZAR)",
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
                  text: "Supplier",
                  color: brownPalette.primary,
                },
                ticks: { color: brownPalette.primary, font: { size: 10 } },
                grid: { color: brownPalette.lighter },
              },
            },
          },
        })
      }

      // Proposal to Deal Conversion Time (Line Chart)
      if (memoizedInsights.proposalToDealConversionTime.length > 0) {
        createChart(chartRefs.proposalToDealConversionTime, {
          type: "line",
          data: {
            labels: memoizedInsights.proposalToDealConversionTime.map((d) => d.supplier),
            datasets: [
              {
                label: "Avg. Time",
                data: memoizedInsights.proposalToDealConversionTime.map((d) => d.time),
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
                text: "Proposal to Deal Conversion Time",
                color: brownPalette.primary,
                font: { weight: "bold", size: 12 },
              },
              legend: { display: false },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Supplier",
                  color: brownPalette.primary,
                },
                ticks: {
                  color: brownPalette.primary,
                  font: { size: 10 },
                  maxRotation: 45,
                },
                grid: { color: brownPalette.lighter },
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Avg. Time (Days)",
                  color: brownPalette.primary,
                },
                ticks: {
                  color: brownPalette.primary,
                  font: { size: 10 },
                  callback: (value) => value + "d",
                },
                grid: { color: brownPalette.lighter },
              },
            },
          },
        })
      }
    }

    return () => {
      charts.current.forEach((chart) => chart.destroy())
    }
  }, [activeTab, memoizedInsights, applications])

  if (loading) {
    return <div className="fundingInsights">Loading supplier insights...</div>
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
            <h3>{memoizedInsights.avgResponseTime.toFixed(1)}d</h3>
            <p>Avg Response Time</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon">
            <Award size={18} />
          </div>
          <div className="insightContent">
            <h3>{memoizedInsights.completionRate.toFixed(1)}%</h3>
            <p>Completion Rate</p>
          </div>
        </div>
      </div>

      <div className="insightsTabs">
        <div className="insightsTabHeader">
          <button
            className={`insightsTab ${activeTab === "matching-discovery" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("matching-discovery")}
          >
            <Brain size={12} /> <span>Matching & Discovery</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "supplier-performance" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("supplier-performance")}
          >
            <Target size={12} /> <span>Supplier Performance</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "engagement-outcome" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("engagement-outcome")}
          >
            <UserCheck size={12} /> <span>Engagement Outcome</span>
          </button>
        </div>
      </div>

      <div className="insightsContainer">
        {activeTab === "matching-discovery" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.supplierMatchCountOverTime} />
              {memoizedInsights.supplierMatchCountOverTime.length === 0 && (
                <div className="noDataMessage">No match data available</div>
              )}
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgMatchScorePerRequest} />
              {memoizedInsights.avgMatchScorePerRequest.length === 0 && (
                <div className="noDataMessage">No match score data available</div>
              )}
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.matchesByServiceCategory} />
              {Object.keys(memoizedInsights.matchesByServiceCategory).length === 0 && (
                <div className="noDataMessage">No service category data available</div>
              )}
            </div>
          </>
        )}

        {activeTab === "supplier-performance" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgSupplierRatingLast6Months} />
              {memoizedInsights.avgSupplierRatingLast6Months.length === 0 && (
                <div className="noDataMessage">No rating data available</div>
              )}
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.completionRateBySupplier} />
              {Object.keys(memoizedInsights.completionRateBySupplier).length === 0 && (
                <div className="noDataMessage">No completion data available</div>
              )}
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgTimeToRespond} />
              {Object.keys(memoizedInsights.avgTimeToRespond).length === 0 && (
                <div className="noDataMessage">No response time data available</div>
              )}
            </div>
          </>
        )}

        {activeTab === "engagement-outcome" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.conversionRateByServiceType} />
              {Object.keys(memoizedInsights.conversionRateByServiceType).length === 0 && (
                <div className="noDataMessage">No conversion data available</div>
              )}
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgDealSizeBySupplier} />
              {Object.keys(memoizedInsights.avgDealSizeBySupplier).length === 0 && (
                <div className="noDataMessage">No deal size data available</div>
              )}
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.proposalToDealConversionTime} />
              {memoizedInsights.proposalToDealConversionTime.length === 0 && (
                <div className="noDataMessage">No conversion time data available</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}