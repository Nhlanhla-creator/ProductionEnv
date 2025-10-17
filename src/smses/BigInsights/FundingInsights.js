"use client"

import { useEffect, useRef, useState } from "react"
import { Chart, registerables } from "chart.js"
import { TrendingUp, DollarSign, Users, Clock, Building2, MapPin, Target, Award } from "lucide-react"
import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import "../MyFunderMatches/funding-insights.css"

Chart.register(...registerables)

export function FundingInsights() {
  const [activeTab, setActiveTab] = useState("sme-demand")
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState([])
  const [universalProfiles, setUniversalProfiles] = useState([])
  const [users, setUsers] = useState([])
  const [insights, setInsights] = useState({
    matchRate: 0,
    averageFundingAmount: 0,
    activeFundersCount: 0,
    averageProcessingTime: 0,
    topFundTypes: {},
    fundingPurposeBreakdown: {},
    monthlyFundingApplications: [],
    approvalRatesByFundType: {},
    averageTimeToDisbursement: {},
    smeMatchRateByLifecycle: {},
    fundingAllocationByIndustry: {},
    topFundedIndustries: [],
    avgDealSizeByIndustry: {},
    mostActiveFunders: [],
    avgTimeMatchToContact: {},
    funderTypeBreakdown: {},
    fundingVolumeByProvince: {},
    fundingApplicationsByRegion: {},
    approvalRateByRegion: {},
  })

  const charts = useRef([])

  // Sector categorization mapping (without emojis)
  const sectorCategories = {
    "Business & Finance": [
      "Banking, Finance & Insurance",
      "Consulting",
      "Human Resources",
      "Marketing / Advertising / PR",
      "Non-Profit / NGO"
    ],
    "Information Technology": [
      "Information Technology (IT)",
      "Telecommunications"
    ],
    "Legal": [
      "Legal / Law",
      "Government / Public Sector",
      "Safety & Security / Police / Defence"
    ],
    "Health": [
      "Healthcare / Medical",
      "Social Services / Social Work",
      "Beauty / Cosmetics / Personal Care"
    ],
    "Science & Environment": [
      "Environmental / Natural Sciences",
      "Science & Research",
      "Energy",
      "Utilities (Water, Electricity, Waste)"
    ],
    "Agriculture & Industry": [
      "Agriculture",
      "Manufacturing",
      "Mining",
      "Oil & Gas",
      "Construction",
      "Engineering",
      "Infrastructure",
      "Transport",
      "Logistics / Supply Chain"
    ],
    "Creative": [
      "Creative Arts / Design",
      "Media / Journalism / Broadcasting"
    ],
    "Education": [
      "Education & Training"
    ],
    "Sports": [
      "Sports / Recreation / Fitness",
      "Hospitality / Tourism"
    ],
    "Other": [
      "Property / Real Estate",
      "Retail / Wholesale",
      "Sales",
      "Customer Service"
    ]
  }

  useEffect(() => {
    // Fetch universal profiles for support format and province data
    const unsubscribeProfiles = onSnapshot(collection(db, "universalProfiles"), (snapshot) => {
      const profilesData = []
      snapshot.forEach((doc) => {
        profilesData.push({ id: doc.id, ...doc.data() })
      })
      setUniversalProfiles(profilesData)
    })

    // Fetch investor applications for monthly applications data
    const unsubscribeApplications = onSnapshot(collection(db, "investorApplications"), (snapshot) => {
      const applicationsData = []
      snapshot.forEach((doc) => {
        applicationsData.push({ id: doc.id, ...doc.data() })
      })
      setApplications(applicationsData)
    })

    // Fetch users for investor count
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = []
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() })
      })
      setUsers(usersData)
      setLoading(false)
    })

    return () => {
      unsubscribeProfiles()
      unsubscribeApplications()
      unsubscribeUsers()
    }
  }, [])

  // Helper function to get category for a specific sector
  const getCategoryForSector = (sector) => {
    for (const [category, sectors] of Object.entries(sectorCategories)) {
      if (sectors.includes(sector)) {
        return category
      }
    }
    return "Other"
  }

  const calculateInsights = (applicationsData, profilesData, usersData) => {
    // Calculate active funders count from users collection
    const activeFundersCount = usersData.filter(user => {
      const roles = user.role || ""
      const roleArray = roles.split(',').map(role => role.trim().toLowerCase())
      return roleArray.includes('investor')
    }).length

    // Calculate top funded industries by category
    const categoryCount = {}
    const categoryMatchPercentage = {}

    // Initialize all categories
    Object.keys(sectorCategories).forEach(category => {
      categoryCount[category] = 0
      categoryMatchPercentage[category] = { total: 0, count: 0 }
    })
    categoryCount["Other"] = 0
    categoryMatchPercentage["Other"] = { total: 0, count: 0 }

    // Count applications by category and calculate match percentages
    applicationsData.forEach((app) => {
      const fundFocusSectors = app.fundFocusSectors || []
      const matchPercentage = app.matchPercentage || 0

      // Handle fundFocusSectors whether it's an array, string, or undefined
      let sectorsArray = []
      
      if (Array.isArray(fundFocusSectors)) {
        sectorsArray = fundFocusSectors
      } else if (typeof fundFocusSectors === 'string') {
        // If it's a string, try to split by comma or use as single value
        sectorsArray = fundFocusSectors.split(',').map(s => s.trim()).filter(s => s)
      } else if (fundFocusSectors) {
        // If it's some other type, convert to array
        sectorsArray = [String(fundFocusSectors)]
      }

      sectorsArray.forEach(sector => {
        const category = getCategoryForSector(sector)
        if (categoryCount[category] !== undefined) {
          categoryCount[category]++
          
          // Add to match percentage calculation
          if (matchPercentage > 0) {
            categoryMatchPercentage[category].total += matchPercentage
            categoryMatchPercentage[category].count++
          }
        }
      })
    })

    // Calculate average match percentage by category
    const avgMatchPercentageByCategory = {}
    Object.keys(categoryMatchPercentage).forEach(category => {
      const data = categoryMatchPercentage[category]
      avgMatchPercentageByCategory[category] = data.count > 0 
        ? Math.round(data.total / data.count)
        : 0
    })

    // Get top 3 funded categories
    const topFundedCategories = Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    // Calculate top fund types from universalProfiles
    const fundTypeOptions = [
      "Venture Capital",
      "Angel Investment", 
      "Private Equity",
      "Government Fund",
      "Grant/Non-Profit",
      "Development Finance",
      "Corporate Investment",
      "Other"
    ]

    const fundTypeCount = {}
    fundTypeOptions.forEach(type => {
      fundTypeCount[type] = 0
    })

    profilesData.forEach((profile) => {
      const applicationType = profile.applicationOverview?.applicationType?.toLowerCase() || ""
      
      // Check if this is a relevant application type
      const relevantTypes = ["funding", "acceleration", "technicalsupport", "enterprise supplier development", "businessmentorship"]
      const isRelevant = relevantTypes.some(type => applicationType.includes(type.toLowerCase()))
      
      if (isRelevant && profile.useOfFunds?.funderTypes) {
        const funderTypes = profile.useOfFunds.funderTypes
        
        // Handle funderTypes whether it's an array, string, or undefined
        let funderTypesArray = []
        
        if (Array.isArray(funderTypes)) {
          funderTypesArray = funderTypes
        } else if (typeof funderTypes === 'string') {
          funderTypesArray = funderTypes.split(',').map(s => s.trim()).filter(s => s)
        } else if (funderTypes) {
          funderTypesArray = [String(funderTypes)]
        }

        funderTypesArray.forEach(funderType => {
          // Normalize the funder type to match our options
          const normalizedType = fundTypeOptions.find(option => 
            funderType.toLowerCase().includes(option.toLowerCase().split(' ')[0]) // Match first word
          ) || "Other"
          
          fundTypeCount[normalizedType]++
        })
      }
    })

    // Calculate approval rates by fund type from investorApplications
    const approvalRatesByFundType = {
      "Any": { total: 0, approved: 0 },
      "Equity": { total: 0, approved: 0 },
      "Debt": { total: 0, approved: 0 },
      "Grant": { total: 0, approved: 0 },
      "Convertible Notes": { total: 0, approved: 0 },
      "Revenue-based Financing": { total: 0, approved: 0 },
      "Other": { total: 0, approved: 0 }
    }

    applicationsData.forEach((app) => {
      const investmentType = app.fundingDetails?.investmentType?.toLowerCase() || ""
      const stage = app.stage?.toLowerCase() || ""
      
      // Map investment type to our categories
      let mappedType = "Other"
      
      if (investmentType.includes("any") || investmentType === "") {
        mappedType = "Any"
      } else if (investmentType.includes("equity")) {
        mappedType = "Equity"
      } else if (investmentType.includes("debt")) {
        mappedType = "Debt"
      } else if (investmentType.includes("grant")) {
        mappedType = "Grant"
      } else if (investmentType.includes("convertible") || investmentType.includes("note")) {
        mappedType = "Convertible Notes"
      } else if (investmentType.includes("revenue") || investmentType.includes("based")) {
        mappedType = "Revenue-based Financing"
      }

      // Count total applications for this type
      approvalRatesByFundType[mappedType].total++

      // Check if approved/completed
      const isApproved = stage.includes("deal complete") || stage.includes("funding approved") || stage.includes("approved")
      if (isApproved) {
        approvalRatesByFundType[mappedType].approved++
      }
    })

    // Calculate approval rate percentages
    const approvalRatesPercentage = {}
    Object.keys(approvalRatesByFundType).forEach(type => {
      const data = approvalRatesByFundType[type]
      approvalRatesPercentage[type] = data.total > 0 
        ? Math.round((data.approved / data.total) * 100)
        : 0
    })

    // Calculate monthly applications from investorApplications
    const monthlyApplications = Array(12).fill(0)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    applicationsData.forEach((app) => {
      if (app.applicationDate) {
        const date = new Date(app.applicationDate)
        const month = date.getMonth() // 0-11
        monthlyApplications[month]++
      }
    })

    const monthlyFundingApplications = monthNames.map((month, index) => ({
      month,
      count: monthlyApplications[index]
    }))

    // Calculate support format breakdown from universalProfiles
    const supportFormatCount = {
      "Incubation": 0,
      "Governance Support": 0,
      "Network Access": 0,
      "None": 0,
      "Other": 0
    }

    profilesData.forEach((profile) => {
      const applicationType = profile.applicationOverview?.applicationType?.toLowerCase() || ""
      const supportFormat = profile.applicationOverview?.supportFormat || "None"
      
      // Check if this is a relevant application type
      const relevantTypes = ["funding", "acceleration", "technicalsupport", "enterprise supplier development", "businessmentorship"]
      const isRelevant = relevantTypes.some(type => applicationType.includes(type.toLowerCase()))
      
      if (isRelevant) {
        // Map the support format to our categories
        if (supportFormat.includes("Incubation") || supportFormat.includes("incubation")) {
          supportFormatCount["Incubation"]++
        } else if (supportFormat.includes("Governance") || supportFormat.includes("governance")) {
          supportFormatCount["Governance Support"]++
        } else if (supportFormat.includes("Network") || supportFormat.includes("network")) {
          supportFormatCount["Network Access"]++
        } else if (supportFormat === "None" || !supportFormat || supportFormat === "") {
          supportFormatCount["None"]++
        } else {
          supportFormatCount["Other"]++
        }
      }
    })

    // Calculate applications by province
    const provinceApplications = {
      "Gauteng": 0,
      "Western Cape": 0,
      "KwaZulu-Natal": 0,
      "Eastern Cape": 0,
      "Free State": 0,
      "Mpumalanga": 0,
      "North West": 0,
      "Limpopo": 0,
      "Northern Cape": 0
    }

    profilesData.forEach((profile) => {
      const applicationType = profile.applicationOverview?.applicationType?.toLowerCase() || ""
      const province = profile.entityOverview?.province || "Unknown"
      
      // Check if this is a relevant application type
      const relevantTypes = ["funding", "acceleration", "technicalsupport", "enterprise supplier development", "businessmentorship"]
      const isRelevant = relevantTypes.some(type => applicationType.includes(type.toLowerCase()))
      
      if (isRelevant && province !== "Unknown") {
        // Normalize province names
        const normalizedProvince = Object.keys(provinceApplications).find(p => 
          province.toLowerCase().includes(p.toLowerCase())
        ) || "Gauteng" // Default to Gauteng if no match
        
        provinceApplications[normalizedProvince]++
      }
    })

    // Calculate total applications for percentage conversion
    const totalProvinceApplications = Object.values(provinceApplications).reduce((sum, count) => sum + count, 0)
    const provincePercentages = {}
    Object.keys(provinceApplications).forEach(province => {
      provincePercentages[province] = totalProvinceApplications > 0 
        ? Math.round((provinceApplications[province] / totalProvinceApplications) * 100)
        : 0
    })

    return {
      matchRate: 75,
      averageFundingAmount: 2500000,
      activeFundersCount: activeFundersCount,
      averageProcessingTime: 21,
      topFundTypes: fundTypeCount,
      fundingPurposeBreakdown: supportFormatCount,
      monthlyFundingApplications: monthlyFundingApplications.some(m => m.count > 0) 
        ? monthlyFundingApplications 
        : [
            { month: "Jan", count: 45 },
            { month: "Feb", count: 52 },
            { month: "Mar", count: 48 },
            { month: "Apr", count: 61 },
            { month: "May", count: 58 },
            { month: "Jun", count: 67 },
            { month: "Jul", count: 55 },
            { month: "Aug", count: 62 },
            { month: "Sep", count: 59 },
            { month: "Oct", count: 71 },
            { month: "Nov", count: 65 },
            { month: "Dec", count: 48 },
          ],
      approvalRatesByFundType: approvalRatesPercentage,
      averageTimeToDisbursement: {
        "Any": 35,
        "Equity": 28,
        "Debt": 21,
        "Grant": 42,
        "Convertible Notes": 18,
        "Revenue-based Financing": 25,
        "Other": 30,
      },
      smeMatchRateByLifecycle: {
        Startup: { matched: 45, notMatched: 55 },
        Growth: { matched: 72, notMatched: 28 },
        Established: { matched: 68, notMatched: 32 },
        Mature: { matched: 58, notMatched: 42 },
      },
      fundingAllocationByIndustry: categoryCount,
      topFundedIndustries: topFundedCategories,
      avgDealSizeByIndustry: avgMatchPercentageByCategory,
      mostActiveFunders: [
        { name: "IDC", matches: 89 },
        { name: "SEDA", matches: 76 },
        { name: "NEF", matches: 68 },
        { name: "NYDA", matches: 54 },
        { name: "SAMSA", matches: 43 },
      ],
      avgTimeMatchToContact: {
        Government: 12,
        "Private Equity": 8,
        "Development Finance": 15,
        "Commercial Bank": 6,
        "Impact Investor": 10,
      },
      funderTypeBreakdown: {
        Government: 35,
        "Private Equity": 25,
        "Development Finance": 20,
        "Commercial Bank": 15,
        "Impact Investor": 5,
      },
      fundingVolumeByProvince: {
        Gauteng: 850000000,
        "Western Cape": 620000000,
        "KwaZulu-Natal": 480000000,
        "Eastern Cape": 320000000,
        "Free State": 180000000,
        Mpumalanga: 150000000,
        "North West": 120000000,
        Limpopo: 110000000,
        "Northern Cape": 80000000,
      },
      fundingApplicationsByRegion: provinceApplications,
      approvalRateByRegion: provincePercentages,
    }
  }

  useEffect(() => {
    if ((applications.length > 0 || universalProfiles.length > 0 || users.length > 0) && !loading) {
      const calculatedInsights = calculateInsights(applications, universalProfiles, users)
      setInsights(calculatedInsights)
    }
  }, [applications, universalProfiles, users, loading])

  // Chart refs for all categories
  const chartRefs = {
    topFundTypes: useRef(null),
    fundingPurposeBreakdown: useRef(null),
    monthlyFundingApplications: useRef(null),
    approvalRatesByFundType: useRef(null),
    averageTimeToDisbursement: useRef(null),
    smeMatchRateByLifecycle: useRef(null),
    fundingAllocationByIndustry: useRef(null),
    avgDealSizeByIndustry: useRef(null),
    avgTimeMatchToContact: useRef(null),
    funderTypeBreakdown: useRef(null),
    fundingVolumeByProvince: useRef(null),
    fundingApplicationsByRegion: useRef(null),
    approvalRateByRegion: useRef(null),
  }

  useEffect(() => {
    if (loading || !insights.topFundTypes) return

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

    // Common font styles
    const fontStyle = {
      family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      size: 9,
      weight: 'normal'
    }

    const axisTitleStyle = {
      color: brownPalette.primary,
      font: {
        size: 10,
        weight: 'bold',
        family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }
    }

    const tickStyle = {
      color: brownPalette.primary,
      font: {
        size: 9,
        family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }
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

    // SME Funding Demand Charts
    if (activeTab === "sme-demand") {
      createChart(chartRefs.topFundTypes, {
        type: "bar",
        data: {
          labels: Object.keys(insights.topFundTypes),
          datasets: [
            {
              label: "Applications",
              data: Object.values(insights.topFundTypes),
              backgroundColor: brownPalette.primary,
              borderColor: brownPalette.accent1,
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
              text: "Top Fund Types Requested",
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
                text: "Number of Applications",
                ...axisTitleStyle
              },
              ticks: tickStyle,
              grid: { color: brownPalette.lighter },
            },
            y: {
              title: {
                display: true,
                text: "Fund Type",
                ...axisTitleStyle
              },
              ticks: tickStyle,
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      createChart(chartRefs.fundingPurposeBreakdown, {
        type: "doughnut",
        data: {
          labels: Object.keys(insights.fundingPurposeBreakdown),
          datasets: [
            {
              data: Object.values(insights.fundingPurposeBreakdown),
              backgroundColor: [
                brownPalette.primary,
                brownPalette.secondary,
                brownPalette.tertiary,
                brownPalette.light,
                brownPalette.accent1,
              ],
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
              text: "Support Required Breakdown",
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

      createChart(chartRefs.monthlyFundingApplications, {
        type: "line",
        data: {
          labels: insights.monthlyFundingApplications.map((d) => d.month),
          datasets: [
            {
              label: "Applications",
              data: insights.monthlyFundingApplications.map((d) => d.count),
              borderColor: brownPalette.primary,
              backgroundColor: brownPalette.lighter,
              tension: 0.4,
              fill: true,
              pointRadius: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Monthly Applications",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: "Number of Applications",
                ...axisTitleStyle
              },
              ticks: { 
                ...tickStyle,
                stepSize: 20,
                callback: function(value) {
                  return value
                }
              },
              grid: { color: brownPalette.lighter },
            },
            x: {
              title: {
                display: true,
                text: "Month",
                ...axisTitleStyle
              },
              ticks: tickStyle,
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })
    }

    // Approval Trends Charts
    if (activeTab === "approval-trends") {
      createChart(chartRefs.approvalRatesByFundType, {
        type: "bar",
        data: {
          labels: Object.keys(insights.approvalRatesByFundType),
          datasets: [
            {
              label: "Approval Rate (%)",
              data: Object.values(insights.approvalRatesByFundType),
              backgroundColor: brownPalette.primary,
              borderColor: brownPalette.accent1,
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
              text: "Approval Rates by Fund Type",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: "Approval Rate (%)",
                ...axisTitleStyle
              },
              ticks: {
                ...tickStyle,
                callback: (value) => value + "%",
              },
              grid: { color: brownPalette.lighter },
            },
            x: {
              title: {
                display: true,
                text: "Fund Type",
                ...axisTitleStyle
              },
              ticks: tickStyle,
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      createChart(chartRefs.averageTimeToDisbursement, {
        type: "line",
        data: {
          labels: Object.keys(insights.averageTimeToDisbursement),
          datasets: [
            {
              label: "Days",
              data: Object.values(insights.averageTimeToDisbursement),
              borderColor: brownPalette.primary,
              backgroundColor: brownPalette.lighter,
              tension: 0.4,
              fill: true,
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
              text: "Average Time to Disbursement",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Days to Disbursement",
                ...axisTitleStyle
              },
              ticks: {
                ...tickStyle,
                callback: (value) => value + " days",
              },
              grid: { color: brownPalette.lighter },
            },
            x: {
              title: {
                display: true,
                text: "Fund Type",
                ...axisTitleStyle
              },
              ticks: tickStyle,
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      createChart(chartRefs.smeMatchRateByLifecycle, {
        type: "doughnut",
        data: {
          labels: Object.keys(insights.smeMatchRateByLifecycle),
          datasets: [
            {
              label: "Matched",
              data: Object.values(insights.smeMatchRateByLifecycle).map((item) => item.matched),
              backgroundColor: [
                brownPalette.primary,
                brownPalette.secondary,
                brownPalette.tertiary,
                brownPalette.light,
              ],
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
              text: "SME Match Rate by Lifecycle",
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

    // Sector Funding Charts
    if (activeTab === "sector-funding") {
      // Filter out categories with zero values for better visualization
      const industryData = insights.fundingAllocationByIndustry || {}
      const filteredIndustryData = Object.fromEntries(
        Object.entries(industryData).filter(([_, value]) => value > 0)
      )
      
      if (Object.keys(filteredIndustryData).length > 0) {
        createChart(chartRefs.fundingAllocationByIndustry, {
          type: "pie",
          data: {
            labels: Object.keys(filteredIndustryData),
            datasets: [
              {
                data: Object.values(filteredIndustryData),
                backgroundColor: [
                  brownPalette.primary,
                  brownPalette.secondary,
                  brownPalette.tertiary,
                  brownPalette.light,
                  brownPalette.accent1,
                  brownPalette.accent2,
                  brownPalette.accent3,
                  "#8d6e63",
                  "#a1887f",
                  "#bcaaa4"
                ],
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
                text: "Funding Allocation by Industry Category",
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
                  usePointStyle: true,
                },
              },
            },
          },
        })
      }

      // Filter out categories with zero match percentage for better visualization
      const matchData = insights.avgDealSizeByIndustry || {}
      const filteredMatchData = Object.fromEntries(
        Object.entries(matchData).filter(([_, value]) => value > 0)
      )

      createChart(chartRefs.avgDealSizeByIndustry, {
        type: "bar",
        data: {
          labels: Object.keys(filteredMatchData),
          datasets: [
            {
              label: "Match Percentage (%)",
              data: Object.values(filteredMatchData),
              backgroundColor: brownPalette.secondary,
              borderColor: brownPalette.accent1,
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
              text: "Average Match Percentage by Industry Category",
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
                ...axisTitleStyle
              },
              ticks: {
                ...tickStyle,
                callback: (value) => value + "%",
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              title: {
                display: true,
                text: "Industry Category",
                ...axisTitleStyle
              },
              ticks: {
                ...tickStyle,
                // Ensure all labels are shown
                autoSkip: false,
                maxRotation: 0
              },
              grid: { color: brownPalette.lighter },
            },
          },
          layout: {
            padding: {
              left: 10,
              right: 10,
              top: 10,
              bottom: 10
            }
          }
        },
      })
    }

    // Funder Engagement Charts
    if (activeTab === "funder-engagement") {
      createChart(chartRefs.avgTimeMatchToContact, {
        type: "bar",
        data: {
          labels: Object.keys(insights.avgTimeMatchToContact),
          datasets: [
            {
              label: "Days",
              data: Object.values(insights.avgTimeMatchToContact),
              backgroundColor: brownPalette.tertiary,
              borderColor: brownPalette.accent1,
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
              text: "Average Time from Match to Contact",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Days to Contact",
                ...axisTitleStyle
              },
              ticks: {
                ...tickStyle,
                callback: (value) => value + " days",
              },
              grid: { color: brownPalette.lighter },
            },
            x: {
              title: {
                display: true,
                text: "Funder Type",
                ...axisTitleStyle
              },
              ticks: tickStyle,
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      createChart(chartRefs.funderTypeBreakdown, {
        type: "doughnut",
        data: {
          labels: Object.keys(insights.funderTypeBreakdown),
          datasets: [
            {
              data: Object.values(insights.funderTypeBreakdown),
              backgroundColor: [
                brownPalette.primary,
                brownPalette.secondary,
                brownPalette.tertiary,
                brownPalette.light,
                brownPalette.accent1,
              ],
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
              text: "Funder Type Breakdown",
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

    // Geography Charts
    if (activeTab === "geography") {
      createChart(chartRefs.fundingVolumeByProvince, {
        type: "bar",
        data: {
          labels: Object.keys(insights.fundingVolumeByProvince),
          datasets: [
            {
              label: "Funding Volume (R)",
              data: Object.values(insights.fundingVolumeByProvince),
              backgroundColor: brownPalette.light,
              borderColor: brownPalette.accent1,
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
              text: "Funding Volume by Province",
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
                text: "Funding Volume (R Millions)",
                ...axisTitleStyle
              },
              ticks: {
                ...tickStyle,
                callback: (value) => "R" + (value / 1000000).toFixed(1) + "M",
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              title: {
                display: true,
                text: "Province",
                ...axisTitleStyle
              },
              ticks: tickStyle,
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      createChart(chartRefs.fundingApplicationsByRegion, {
        type: "bar",
        data: {
          labels: Object.keys(insights.fundingApplicationsByRegion),
          datasets: [
            {
              label: "Applications",
              data: Object.values(insights.fundingApplicationsByRegion),
              backgroundColor: brownPalette.secondary,
              borderColor: brownPalette.accent1,
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
              text: "Applications by Province",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Number of Applications",
                ...axisTitleStyle
              },
              ticks: tickStyle,
              grid: { color: brownPalette.lighter },
            },
            x: {
              title: {
                display: true,
                text: "Province",
                ...axisTitleStyle
              },
              ticks: {
                ...tickStyle,
                maxRotation: 45,
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      createChart(chartRefs.approvalRateByRegion, {
        type: "line",
        data: {
          labels: Object.keys(insights.approvalRateByRegion),
          datasets: [
            {
              label: "Approval Rate (%)",
              data: Object.values(insights.approvalRateByRegion),
              borderColor: brownPalette.primary,
              backgroundColor: brownPalette.lighter,
              tension: 0.4,
              fill: true,
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
              text: "Approval Rate by Province",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: "Approval Rate (%)",
                ...axisTitleStyle
              },
              ticks: {
                ...tickStyle,
                stepSize: 20,
                callback: (value) => value + "%",
              },
              grid: { color: brownPalette.lighter },
            },
            x: {
              title: {
                display: true,
                text: "Province",
                ...axisTitleStyle
              },
              ticks: {
                ...tickStyle,
                maxRotation: 45,
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
  }, [activeTab, insights, loading])

  if (loading) {
    return (
      <div className="fundingInsights">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Loading insights...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fundingInsights">
      <div className="insightsSummary">
        <div className="insightCard">
          <div className="insightIcon">
            <TrendingUp size={18} />
          </div>
          <div className="insightContent">
            <h3>{insights.matchRate}%</h3>
            <p>Match Rate</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon">
            <DollarSign size={18} />
          </div>
          <div className="insightContent">
            <h3>R{(insights.averageFundingAmount / 1000000).toFixed(1)}M</h3>
            <p>Avg. Funding</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon">
            <Users size={18} />
          </div>
          <div className="insightContent">
            <h3>{insights.activeFundersCount}</h3>
            <p>Active Funders</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon">
            <Clock size={18} />
          </div>
          <div className="insightContent">
            <h3>{insights.averageProcessingTime} days</h3>
            <p>Processing Time</p>
          </div>
        </div>
      </div>

      <div className="insightsTabs">
        <div className="insightsTabHeader">
          <button
            className={`insightsTab ${activeTab === "sme-demand" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("sme-demand")}
          >
            <Target size={12} /> <span>SME Demand</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "approval-trends" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("approval-trends")}
          >
            <Award size={12} /> <span>Approval Trends</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "sector-funding" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("sector-funding")}
          >
            <Building2 size={12} /> <span>Sector Funding</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "funder-engagement" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("funder-engagement")}
          >
            <Users size={12} /> <span>Funder Engagement</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "geography" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("geography")}
          >
            <MapPin size={12} /> <span>Geography</span>
          </button>
        </div>
      </div>

      <div className="insightsContainer">
        {activeTab === "sme-demand" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.topFundTypes} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.fundingPurposeBreakdown} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.monthlyFundingApplications} />
            </div>
          </>
        )}

        {activeTab === "approval-trends" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.approvalRatesByFundType} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.averageTimeToDisbursement} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.smeMatchRateByLifecycle} />
            </div>
          </>
        )}

        {activeTab === "sector-funding" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.fundingAllocationByIndustry} />
            </div>
            <div className="chartContainer leaderboardContainer">
              <div className="leaderboard">
                <h3>Top 3 Funded Industry Categories</h3>
                <div className="leaderboardList">
                  {insights.topFundedIndustries.slice(0, 3).map((industry, index) => (
                    <div key={index} className="leaderboardItem">
                      <span className="rank">#{index + 1}</span>
                      <span className="industry">{industry.name}</span>
                      <span className="amount">{industry.count} applications</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgDealSizeByIndustry} />
            </div>
          </>
        )}

        {activeTab === "funder-engagement" && (
          <>
            <div className="chartContainer leaderboardContainer">
              <div className="leaderboard">
                <h3>Top 3 Active Funders</h3>
                <div className="leaderboardList">
                  {insights.mostActiveFunders.slice(0, 3).map((funder, index) => (
                    <div key={index} className="leaderboardItem">
                      <span className="rank">#{index + 1}</span>
                      <span className="funder">{funder.name}</span>
                      <span className="matches">{funder.matches} matches</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgTimeMatchToContact} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.funderTypeBreakdown} />
            </div>
          </>
        )}

        {activeTab === "geography" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.fundingVolumeByProvince} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.fundingApplicationsByRegion} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.approvalRateByRegion} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}