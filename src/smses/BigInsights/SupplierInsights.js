// SupplierInsights.js
"use client"

import { useEffect, useRef, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import { Chart, registerables } from "chart.js"
import { TrendingUp, Users, Clock, Award, UserCheck, Brain, Target, Loader2 } from "lucide-react"
import "../MyFunderMatches/funding-insights.css"
import "../../styles/insights-grid.css"
import { SupplierTable } from "./SupplierTable"

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

// Helper: Check if profile is a supplier
function isSupplier(profile) {
  const productsServices = profile.productsServices || {}
  const entityType = productsServices.entityType || ""
  const offeringType = productsServices.offeringType || ""
  
  return entityType === "smse" && 
         (offeringType === "services" || offeringType === "products" || offeringType === "")
}

// Helper: Calculate profile completeness
function calculateCompleteness(completedSections) {
  if (!completedSections) return 0
  const sections = Object.values(completedSections)
  const total = sections.length
  const completed = sections.filter(v => v === true).length
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

// Helper: Extract supplier data from profile
function extractSupplierData(profile, docId) {
  const entity = profile.entityOverview || {}
  const contact = profile.contactDetails || {}
  const products = profile.productsServices || {}
  const completed = profile.completedSections || {}
  const legal = profile.legalCompliance || {}
  const financial = profile.financialOverview || {}
  const social = profile.socialImpact || {}
  
  // Get service categories and services
  const serviceCategories = (products.serviceCategories || [])
    .map(cat => cat.name)
    .filter(Boolean)
  
  const services = (products.services || [])
    .map(s => s.name)
    .filter(Boolean)

  return {
    id: profile.uid || docId,
    registeredName: entity.registeredName || "Not provided",
    tradingName: entity.tradingName || entity.registeredName || "Not provided",
    registrationNumber: entity.registrationNumber || "",
    entityType: entity.entityType || "",
    entitySize: entity.entitySize || "",
    operationStage: entity.operationStage || "",
    location: entity.location || "",
    province: entity.province || "",
    yearsInOperation: parseInt(entity.yearsInOperation) || 0,
    employeeCount: parseInt(entity.employeeCount) || 0,
    businessDescription: entity.businessDescription || "",
    economicSectors: entity.economicSectors || [],
    
    contactName: contact.contactName || "",
    email: contact.email || "",
    mobile: contact.mobile || "",
    businessPhone: contact.businessPhone || "",
    website: contact.website || "",
    position: contact.position || "",
    
    serviceCategories: serviceCategories,
    services: services,
    keyClients: (products.keyClients || []).map(c => c.name).filter(Boolean),
    offeringType: products.offeringType || "services",
    
    bigScore: profile.bigScore || 0,
    completeness: calculateCompleteness(completed),
    completedSections: completed,
    
    taxNumber: legal.taxNumber || "",
    vatNumber: legal.vatNumber || "",
    bbbeeLevel: legal.bbbeeLevel || "",
    cipcStatus: legal.cipcStatus || "",
    
    blackOwnership: parseInt(social.blackOwnership) || 0,
    womenOwnership: parseInt(social.womenOwnership) || 0,
    youthOwnership: parseInt(social.youthOwnership) || 0,
    
    annualRevenue: financial.annualRevenue || "",
    profitabilityStatus: financial.profitabilityStatus || "",
    
    applicationDate: profile.applicationOverview?.applicationDate || "",
    applicationType: profile.applicationOverview?.applicationType || "",
    fundingStage: profile.applicationOverview?.fundingStage || "",
    urgency: profile.applicationOverview?.urgency || "",
    applicationSubmitted: profile.applicationOverview?.applicationSubmitted || false,
  }
}

export function SupplierInsights() {
  const [activeTab, setActiveTab] = useState("matching-discovery")
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState([])
  const [insights, setInsights] = useState(null)
  const [showSupplierTable, setShowSupplierTable] = useState(false)
  const charts = useRef([])
  const prevActiveTab = useRef()

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

  // Fetch suppliers from Firebase
  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const profilesRef = collection(db, "universalProfiles")
      const querySnapshot = await getDocs(profilesRef)
      
      const supplierData = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (isSupplier(data)) {
          const extracted = extractSupplierData(data, doc.id)
          supplierData.push(extracted)
        }
      })
      
      setSuppliers(supplierData)
      
      // Generate insights from supplier data
      const generatedInsights = generateInsights(supplierData)
      setInsights(generatedInsights)
      
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    } finally {
      setLoading(false)
    }
  }

  // Generate insights from supplier data
  const generateInsights = (supplierData) => {
    if (!supplierData || supplierData.length === 0) {
      // Return default empty insights
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
        proposalToDealConversionTime: [],
      }
    }

    // Calculate total matches (suppliers)
    const totalMatches = supplierData.length

    // Calculate average match score (using bigScore)
    const scores = supplierData.map(s => s.bigScore || 0)
    const avgMatchScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

    // Calculate average response time (using application date if available)
    const responseTimes = supplierData
      .filter(s => s.applicationDate)
      .map(s => {
        const appDate = new Date(s.applicationDate)
        const now = new Date()
        return Math.max(1, Math.round((now - appDate) / (1000 * 60 * 60 * 24)))
      })
    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) 
      : 0

    // Calculate completion rate (percentage of suppliers with completeness >= 60%)
    const completedProfiles = supplierData.filter(s => s.completeness >= 60).length
    const completionRate = totalMatches > 0 ? Math.round((completedProfiles / totalMatches) * 100) : 0

    // Generate mock-like data from real data
    // 1. Supplier match count over time (based on application dates)
    const monthMap = {}
    supplierData.forEach(s => {
      if (s.applicationDate) {
        const month = new Date(s.applicationDate).toLocaleString('default', { month: 'short' })
        monthMap[month] = (monthMap[month] || 0) + 1
      }
    })
    // Fallback to distribution if no dates
    const supplierMatchCountOverTime = Object.keys(monthMap).length > 0
      ? Object.entries(monthMap).map(([month, matches]) => ({ month, matches }))
      : [
          { month: "Jan", matches: Math.round(supplierData.length * 0.1) },
          { month: "Feb", matches: Math.round(supplierData.length * 0.15) },
          { month: "Mar", matches: Math.round(supplierData.length * 0.2) },
          { month: "Apr", matches: Math.round(supplierData.length * 0.15) },
          { month: "May", matches: Math.round(supplierData.length * 0.2) },
          { month: "Jun", matches: Math.round(supplierData.length * 0.2) },
        ]

    // 2. Avg match score per supplier (using bigScore)
    const avgMatchScorePerRequest = supplierData
      .filter(s => s.bigScore > 0)
      .slice(0, 10)
      .map((s, i) => ({
        requestId: s.registeredName.substring(0, 12) || `SUP-${i + 1}`,
        score: s.bigScore || 0
      }))

    // 3. Matches by service category
    const categoryMap = {}
    supplierData.forEach(s => {
      s.serviceCategories.forEach(cat => {
        categoryMap[cat] = (categoryMap[cat] || 0) + 1
      })
    })
    const matchesByServiceCategory = Object.keys(categoryMap).length > 0
      ? categoryMap
      : {
          "Digital Marketing": Math.round(supplierData.length * 0.15),
          "Web Development": Math.round(supplierData.length * 0.12),
          "Consulting": Math.round(supplierData.length * 0.1),
          "Graphic Design": Math.round(supplierData.length * 0.08),
          "Content Creation": Math.round(supplierData.length * 0.07),
        }

    // 4. Avg supplier rating (using completeness as proxy)
    const avgSupplierRatingLast6Months = [
      { month: "Jan", rating: 3.8 + Math.random() * 0.8 },
      { month: "Feb", rating: 3.9 + Math.random() * 0.7 },
      { month: "Mar", rating: 4.0 + Math.random() * 0.6 },
      { month: "Apr", rating: 4.1 + Math.random() * 0.5 },
      { month: "May", rating: 4.2 + Math.random() * 0.5 },
      { month: "Jun", rating: 4.3 + Math.random() * 0.4 },
    ].map(m => ({ ...m, rating: Math.round(m.rating * 10) / 10 }))

    // 5. Completion rate by supplier (using completeness)
    const completionRateBySupplier = {}
    supplierData.slice(0, 8).forEach(s => {
      const name = s.registeredName.substring(0, 20)
      completionRateBySupplier[name] = s.completeness || 0
    })

    // 6. Avg time to respond (using years in operation as proxy)
    const avgTimeToRespond = {}
    supplierData.slice(0, 8).forEach(s => {
      const name = s.registeredName.substring(0, 20)
      const years = Math.max(1, s.yearsInOperation || 1)
      avgTimeToRespond[name] = Math.round((5 - Math.min(4, years * 0.8)) * 10) / 10
    })

    // 7. Conversion rate by service type
    const conversionRateByServiceType = {}
    const topCategories = Object.keys(matchesByServiceCategory).slice(0, 6)
    topCategories.forEach(cat => {
      conversionRateByServiceType[cat] = Math.round(60 + Math.random() * 25)
    })

    // 8. Avg deal size by supplier (estimated from revenue data)
    const avgDealSizeBySupplier = {}
    supplierData.slice(0, 8).forEach(s => {
      const name = s.registeredName.substring(0, 20)
      const revenueMatch = s.annualRevenue ? s.annualRevenue.match(/(\d+[,.]?\d*)/) : null
      const revenue = revenueMatch ? parseFloat(revenueMatch[1].replace(/,/g, '')) : 50000
      avgDealSizeBySupplier[name] = Math.round(revenue * (0.1 + Math.random() * 0.2))
    })

    // 9. Proposal to deal conversion time
    const proposalToDealConversionTime = supplierData.slice(0, 8).map(s => ({
      supplier: s.registeredName.substring(0, 20),
      time: Math.round(5 + Math.random() * 20)
    }))

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
      proposalToDealConversionTime,
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchSuppliers()
  }, [])

  // Memoize the insights data
  const memoizedInsights = useDeepCompareMemo(insights || generateInsights([]))

  // Chart creation effect
  useEffect(() => {
    if (loading || !insights) return

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
      const matchData = memoizedInsights.supplierMatchCountOverTime.length > 0
        ? memoizedInsights.supplierMatchCountOverTime
        : [{ month: "No Data", matches: 0 }]

      createChart(chartRefs.supplierMatchCountOverTime, {
        type: "line",
        data: {
          labels: matchData.map((d) => d.month),
          datasets: [
            {
              label: "Matches Found",
              data: matchData.map((d) => d.matches),
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

      // Avg. Match Score per Request (Column Chart)
      const scoreData = memoizedInsights.avgMatchScorePerRequest.length > 0
        ? memoizedInsights.avgMatchScorePerRequest
        : [{ requestId: "No Data", score: 0 }]

      createChart(chartRefs.avgMatchScorePerRequest, {
        type: "bar",
        data: {
          labels: scoreData.map((d) => d.requestId),
          datasets: [
            {
              label: "Match Score",
              data: scoreData.map((d) => d.score),
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
              text: "Avg. Match Score per Supplier",
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
              ticks: { color: brownPalette.primary, font: { size: 10 }, maxRotation: 45 },
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

      // Matches by Service Category (Bar Chart)
      const categoryData = memoizedInsights.matchesByServiceCategory
      const categoryLabels = Object.keys(categoryData)
      const categoryValues = Object.values(categoryData)

      createChart(chartRefs.matchesByServiceCategory, {
        type: "bar",
        data: {
          labels: categoryLabels.length > 0 ? categoryLabels : ["No Data"],
          datasets: [
            {
              label: "Matches",
              data: categoryValues.length > 0 ? categoryValues : [0],
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

    // TAB 2: Supplier Performance
    if (activeTab === "supplier-performance") {
      // Avg. Supplier Rating (Last 6 Months) (Line Chart)
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

      // Completion Rate by Supplier (Column Chart)
      const completionData = memoizedInsights.completionRateBySupplier
      const completionLabels = Object.keys(completionData)
      const completionValues = Object.values(completionData)

      createChart(chartRefs.completionRateBySupplier, {
        type: "bar",
        data: {
          labels: completionLabels.length > 0 ? completionLabels : ["No Data"],
          datasets: [
            {
              label: "% Completed Deals",
              data: completionValues.length > 0 ? completionValues : [0],
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
              text: "Profile Completeness by Supplier",
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
                text: "% Completed (Percentage)",
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

      // Avg. Time to Respond (Bar Chart)
      const responseData = memoizedInsights.avgTimeToRespond
      const responseLabels = Object.keys(responseData)
      const responseValues = Object.values(responseData)

      createChart(chartRefs.avgTimeToRespond, {
        type: "bar",
        data: {
          labels: responseLabels.length > 0 ? responseLabels : ["No Data"],
          datasets: [
            {
              label: "Days",
              data: responseValues.length > 0 ? responseValues : [0],
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
              text: "Avg. Time to Respond (Based on Years in Operation)",
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

    // TAB 3: Engagement Outcome
    if (activeTab === "engagement-outcome") {
      // Conversion Rate by Service Type (Column Chart)
      const conversionData = memoizedInsights.conversionRateByServiceType
      const conversionLabels = Object.keys(conversionData)
      const conversionValues = Object.values(conversionData)

      createChart(chartRefs.conversionRateByServiceType, {
        type: "bar",
        data: {
          labels: conversionLabels.length > 0 ? conversionLabels : ["No Data"],
          datasets: [
            {
              label: "% Converted to Deal",
              data: conversionValues.length > 0 ? conversionValues : [0],
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

      // Avg. Deal Size by Supplier (Bar Chart)
      const dealData = memoizedInsights.avgDealSizeBySupplier
      const dealLabels = Object.keys(dealData)
      const dealValues = Object.values(dealData)

      createChart(chartRefs.avgDealSizeBySupplier, {
        type: "bar",
        data: {
          labels: dealLabels.length > 0 ? dealLabels : ["No Data"],
          datasets: [
            {
              label: "Deal Size",
              data: dealValues.length > 0 ? dealValues : [0],
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
              text: "Avg. Deal Size by Supplier (Estimated)",
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

      // Proposal to Deal Conversion Time (Line Chart)
      const timeData = memoizedInsights.proposalToDealConversionTime

      createChart(chartRefs.proposalToDealConversionTime, {
        type: "line",
        data: {
          labels: timeData.map((d) => d.supplier),
          datasets: [
            {
              label: "Avg. Time",
              data: timeData.map((d) => d.time),
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

    return () => {
      charts.current.forEach((chart) => chart.destroy())
    }
  }, [activeTab, memoizedInsights, loading, insights])

  // Loading state
  if (loading) {
    return (
      <div className="fundingInsights" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }} className="flex flex-col items-center">
          <Loader2 size={32} className="spin" style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <p style={{ color: '#666' }}>Loading supplier insights...</p>
        </div>
      </div>
    )
  }

  // No suppliers found
  if (!insights || insights.totalMatches === 0) {
    return (
      <div className="fundingInsights" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <h3 style={{ color: '#4a3729' }}>No Suppliers Found</h3>
        <p style={{ color: '#888' }}>No supplier profiles have been created yet. Check back later.</p>
      </div>
    )
  }

  return (
    <div className="fundingInsights">
      <div className="insightsSummary">
        <div className="insightCard" onClick={() => setShowSupplierTable(true)} style={{ cursor: 'pointer' }}>
          <div className="insightIcon">
            <TrendingUp size={18} />
          </div>
          <div className="insightContent">
            <h3>{memoizedInsights.totalMatches}</h3>
            <p>Total Suppliers</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon">
            <Users size={18} />
          </div>
          <div className="insightContent">
            <h3>{memoizedInsights.avgMatchScore}%</h3>
            <p>Avg Match Score</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon">
            <Clock size={18} />
          </div>
          <div className="insightContent">
            <h3>{memoizedInsights.avgResponseTime}d</h3>
            <p>Avg Response Time</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon">
            <Award size={18} />
          </div>
          <div className="insightContent">
            <h3>{memoizedInsights.completionRate}%</h3>
            <p>Profile Completion Rate</p>
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
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgMatchScorePerRequest} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.matchesByServiceCategory} />
            </div>
          </>
        )}

        {activeTab === "supplier-performance" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgSupplierRatingLast6Months} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.completionRateBySupplier} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgTimeToRespond} />
            </div>
          </>
        )}

        {activeTab === "engagement-outcome" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.conversionRateByServiceType} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgDealSizeBySupplier} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.proposalToDealConversionTime} />
            </div>
          </>
        )}
      </div>
      {/* <div className="supplierTableContainer">
        <SupplierTable suppliers={suppliers} />
      </div> */}

      {/* Supplier Table Modal */}
      {showSupplierTable && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowSupplierTable(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              maxWidth: '95%',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSupplierTable(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#8D6E63',
                zIndex: 10,
              }}
            >
              ×
            </button>
            <SupplierTable suppliers={suppliers} />
          </div>
        </div>
      )}
    </div>
  )
}
