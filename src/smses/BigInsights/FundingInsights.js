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
  const [funderProfiles, setFunderProfiles] = useState({})
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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "smeApplications"), async (snapshot) => {
      const applicationsData = []
      const funderIds = new Set()
      
      snapshot.forEach((doc) => {
        const appData = { id: doc.id, ...doc.data() }
        applicationsData.push(appData)
        
        // Collect funder IDs to fetch their profiles
        if (appData.funderId) {
          funderIds.add(appData.funderId)
        }
      })
      
      setApplications(applicationsData)
      
      // Fetch funder profiles
      const profiles = {}
      const funderIdsArray = Array.from(funderIds)
      
      for (const funderId of funderIdsArray) {
        try {
          // Try to fetch from universalProfiles first
          const profileQuery = query(collection(db, "universalProfiles"), where("__name__", "==", funderId))
          const profileSnapshot = await getDocs(profileQuery)
          
          if (!profileSnapshot.empty) {
            profileSnapshot.forEach((doc) => {
              profiles[funderId] = {
                name: doc.data().entityOverview?.registeredName || `Funder ${funderId.substring(0, 6)}...`,
                id: funderId
              }
            })
          } else {
            // If not found in universalProfiles, try to fetch from MyuniversalProfiles
            const myProfileQuery = query(collection(db, "MyuniversalProfiles"), where("__name__", "==", funderId))
            const myProfileSnapshot = await getDocs(myProfileQuery)
            
            if (!myProfileSnapshot.empty) {
              myProfileSnapshot.forEach((doc) => {
                profiles[funderId] = {
                  name: doc.data().formData?.fundManageOverview?.registeredName || `Funder ${funderId.substring(0, 6)}...`,
                  id: funderId
                }
              })
            } else {
              // Fallback to using the ID if no profile found
              profiles[funderId] = {
                name: `Funder ${funderId.substring(0, 6)}...`,
                id: funderId
              }
            }
          }
        } catch (error) {
          console.error("Error fetching funder profile:", error)
          profiles[funderId] = {
            name: `Funder ${funderId.substring(0, 6)}...`,
            id: funderId
          }
        }
      }
      
      setFunderProfiles(profiles)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const calculateInsights = (applicationsData, funderProfiles) => {
    if (!applicationsData.length) {
      // Return default data if no applications
      return {
        matchRate: 75,
        averageFundingAmount: 2500000,
        activeFundersCount: 45,
        averageProcessingTime: 21,
        topFundTypes: {
          "Growth Capital": 120,
          "Working Capital": 95,
          "Equipment Finance": 68,
          "Property Finance": 45,
          "Trade Finance": 32,
        },
        fundingPurposeBreakdown: {
          "Business Expansion": 35,
          "Equipment Purchase": 25,
          "Working Capital": 20,
          "Property Investment": 12,
          Inventory: 8,
        },
        monthlyFundingApplications: [
          { month: "Jan", count: 45 },
          { month: "Feb", count: 52 },
          { month: "Mar", count: 48 },
          { month: "Apr", count: 61 },
          { month: "May", count: 58 },
          { month: "Jun", count: 67 },
        ],
        approvalRatesByFundType: {
          "Growth Capital": 68,
          "Working Capital": 72,
          "Equipment Finance": 78,
          "Property Finance": 65,
          "Trade Finance": 82,
        },
        averageTimeToDisbursement: {
          "Growth Capital": 35,
          "Working Capital": 21,
          "Equipment Finance": 28,
          "Property Finance": 42,
          "Trade Finance": 18,
        },
        smeMatchRateByLifecycle: {
          Startup: { matched: 45, notMatched: 55 },
          Growth: { matched: 72, notMatched: 28 },
          Established: { matched: 68, notMatched: 32 },
          Mature: { matched: 58, notMatched: 42 },
        },
        fundingAllocationByIndustry: {
          Technology: 450000000,
          Manufacturing: 380000000,
          Healthcare: 320000000,
          Education: 280000000,
          Agriculture: 220000000,
          Tourism: 180000000,
        },
        topFundedIndustries: [
          { name: "Technology", amount: 450000000 },
          { name: "Manufacturing", amount: 380000000 },
          { name: "Healthcare", amount: 320000000 },
          { name: "Education", amount: 280000000 },
          { name: "Agriculture", amount: 220000000 },
        ],
        avgDealSizeByIndustry: {
          Technology: 2800000,
          Manufacturing: 1950000,
          Healthcare: 2200000,
          Education: 1650000,
          Agriculture: 1450000,
          Tourism: 1200000,
        },
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
        fundingApplicationsByRegion: {
          Johannesburg: 245,
          "Cape Town": 198,
          Durban: 156,
          "Port Elizabeth": 89,
          Bloemfontein: 67,
          Pretoria: 234,
          "East London": 45,
          Polokwane: 34,
        },
        approvalRateByRegion: {
          Gauteng: 72,
          "Western Cape": 68,
          "KwaZulu-Natal": 65,
          "Eastern Cape": 58,
          "Free State": 62,
          Mpumalanga: 55,
          "North West": 51,
          Limpopo: 48,
          "Northern Cape": 45,
        },
      }
    }

    const totalApps = applicationsData.length
    const matchedApps = applicationsData.filter((app) => app.pipelineStage && app.pipelineStage !== "declined").length
    const approvedApps = applicationsData.filter(
      (app) => app.pipelineStage === "funding approved" || app.pipelineStage === "deal closed",
    ).length

    // Calculate top fund types
    const fundTypeCount = {}
    applicationsData.forEach((app) => {
      const fundType = app.fundingType || "Working Capital"
      fundTypeCount[fundType] = (fundTypeCount[fundType] || 0) + 1
    })

    // Calculate funding purpose breakdown
    const purposeCount = {}
    applicationsData.forEach((app) => {
      const purpose = app.fundingPurpose || "Business Expansion"
      purposeCount[purpose] = (purposeCount[purpose] || 0) + 1
    })

    // Calculate monthly applications (last 6 months)
    const monthlyApps = []
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    months.forEach((month, index) => {
      const count = applicationsData.filter((app) => {
        const appDate = new Date(app.createdAt?.toDate?.() || app.createdAt)
        return appDate.getMonth() === index
      }).length
      monthlyApps.push({ month, count })
    })

    // Calculate approval rates by fund type
    const approvalRates = {}
    Object.keys(fundTypeCount).forEach((type) => {
      const typeApps = applicationsData.filter((app) => app.fundingType === type)
      const typeApproved = typeApps.filter(
        (app) => app.pipelineStage === "funding approved" || app.pipelineStage === "deal closed",
      ).length
      approvalRates[type] = typeApps.length > 0 ? Math.round((typeApproved / typeApps.length) * 100) : 0
    })

    // Calculate industry allocation - FIXED THIS PART
    const industryAllocation = {}
    applicationsData.forEach((app) => {
      const industry = app.industry || "Technology"
      const amount = Number.parseFloat(app.fundingAmount) || 0
      industryAllocation[industry] = (industryAllocation[industry] || 0) + amount
    })

    // Calculate geographic distribution
    const provinceVolume = {}
    const regionApplications = {}
    applicationsData.forEach((app) => {
      const province = app.province || "Gauteng"
      const city = app.city || "Johannesburg"
      const amount = Number.parseFloat(app.fundingAmount) || 0

      provinceVolume[province] = (provinceVolume[province] || 0) + amount
      regionApplications[city] = (regionApplications[city] || 0) + 1
    })

    // Calculate most active funders with actual names
    const funderActivity = {}
    applicationsData.forEach((app) => {
      const funderId = app.funderId
      if (funderId) {
        funderActivity[funderId] = (funderActivity[funderId] || 0) + 1
      }
    })

    const mostActiveFunders = Object.entries(funderActivity)
      .map(([funderId, matches]) => ({ 
        name: funderProfiles[funderId]?.name || `Funder ${funderId.substring(0, 6)}...`, 
        matches 
      }))
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 5)

    return {
      matchRate: totalApps > 0 ? Math.round((matchedApps / totalApps) * 100) : 75,
      averageFundingAmount:
        totalApps > 0
          ? applicationsData.reduce((sum, app) => sum + (Number.parseFloat(app.fundingAmount) || 0), 0) / totalApps
          : 2500000,
      activeFundersCount: new Set(applicationsData.map((app) => app.funderId).filter(Boolean)).size || 45,
      averageProcessingTime: 21,
      topFundTypes: fundTypeCount,
      fundingPurposeBreakdown: purposeCount,
      monthlyFundingApplications: monthlyApps.some((m) => m.count > 0)
        ? monthlyApps
        : [
            { month: "Jan", count: 45 },
            { month: "Feb", count: 52 },
            { month: "Mar", count: 48 },
            { month: "Apr", count: 61 },
            { month: "May", count: 58 },
            { month: "Jun", count: 67 },
          ],
      approvalRatesByFundType: approvalRates,
      averageTimeToDisbursement: {
        "Growth Capital": 35,
        "Working Capital": 21,
        "Equipment Finance": 28,
        "Property Finance": 42,
        "Trade Finance": 18,
      },
      smeMatchRateByLifecycle: {
        Startup: { matched: 45, notMatched: 55 },
        Growth: { matched: 72, notMatched: 28 },
        Established: { matched: 68, notMatched: 32 },
        Mature: { matched: 58, notMatched: 42 },
      },
      fundingAllocationByIndustry: industryAllocation,
      topFundedIndustries:
        Object.entries(industryAllocation).length > 0
          ? Object.entries(industryAllocation)
              .map(([name, amount]) => ({ name, amount }))
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5)
          : [
              { name: "Technology", amount: 450000000 },
              { name: "Manufacturing", amount: 380000000 },
              { name: "Healthcare", amount: 320000000 },
              { name: "Education", amount: 280000000 },
              { name: "Agriculture", amount: 220000000 },
            ],
      avgDealSizeByIndustry:
        Object.keys(industryAllocation).length > 0
          ? Object.keys(industryAllocation).reduce((acc, industry) => {
              const industryApps = applicationsData.filter((app) => app.industry === industry)
              const avgSize =
                industryApps.length > 0
                  ? industryApps.reduce((sum, app) => sum + (Number.parseFloat(app.fundingAmount) || 0), 0) /
                    industryApps.length
                  : 0
              acc[industry] = avgSize
              return acc
            }, {})
          : {
              Technology: 2800000,
              Manufacturing: 1950000,
              Healthcare: 2200000,
              Education: 1650000,
              Agriculture: 1450000,
              Tourism: 1200000,
            },
      mostActiveFunders:
        mostActiveFunders.length > 0
          ? mostActiveFunders
          : [
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
      fundingVolumeByProvince: provinceVolume,
      fundingApplicationsByRegion: regionApplications,
      approvalRateByRegion: {
        Gauteng: 72,
        "Western Cape": 68,
        "KwaZulu-Natal": 65,
        "Eastern Cape": 58,
        "Free State": 62,
        Mpumalanga: 55,
        "North West": 51,
        Limpopo: 48,
        "Northern Cape": 45,
      },
    }
  }

  useEffect(() => {
    if (applications.length > 0 && Object.keys(funderProfiles).length > 0) {
      const calculatedInsights = calculateInsights(applications, funderProfiles)
      setInsights(calculatedInsights)
    }
  }, [applications, funderProfiles])

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
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              ticks: { color: brownPalette.primary, font: { size: 10 } },
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
              text: "Funding Purpose Breakdown",
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
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            x: {
              ticks: { color: brownPalette.primary, font: { size: 10 } },
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
              ticks: {
                color: brownPalette.primary,
                font: { size: 10 },
                callback: (value) => value + "%",
              },
              grid: { color: brownPalette.lighter },
            },
            x: {
              ticks: { color: brownPalette.primary, font: { size: 10 } },
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
              ticks: {
                color: brownPalette.primary,
                font: { size: 10 },
                callback: (value) => value + " days",
              },
              grid: { color: brownPalette.lighter },
            },
            x: {
              ticks: { color: brownPalette.primary, font: { size: 10 } },
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
      // Make sure we have data for the funding allocation chart
      const industryData = insights.fundingAllocationByIndustry || {}
      const industryKeys = Object.keys(industryData)
      const industryValues = Object.values(industryData)
      
      // Only create the chart if we have data
      if (industryKeys.length > 0) {
        createChart(chartRefs.fundingAllocationByIndustry, {
          type: "pie",
          data: {
            labels: industryKeys,
            datasets: [
              {
                data: industryValues,
                backgroundColor: [
                  brownPalette.primary,
                  brownPalette.secondary,
                  brownPalette.tertiary,
                  brownPalette.light,
                  brownPalette.accent1,
                  brownPalette.accent2,
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
                text: "Funding Allocation by Industry",
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

      createChart(chartRefs.avgDealSizeByIndustry, {
        type: "bar",
        data: {
          labels: Object.keys(insights.avgDealSizeByIndustry),
          datasets: [
            {
              label: "Average Deal Size (R)",
              data: Object.values(insights.avgDealSizeByIndustry),
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
              text: "Average Deal Size by Industry",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                color: brownPalette.primary,
                font: { size: 10 },
                callback: (value) => "R" + (value / 1000000).toFixed(1) + "M",
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
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
              ticks: {
                color: brownPalette.primary,
                font: { size: 10 },
                callback: (value) => value + " days",
              },
              grid: { color: brownPalette.lighter },
            },
            x: {
              ticks: { color: brownPalette.primary, font: { size: 10 } },
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
              ticks: {
                color: brownPalette.primary,
                font: { size: 10 },
                callback: (value) => "R" + (value / 1000000).toFixed(1) + "M",
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              ticks: { color: brownPalette.primary, font: { size: 10 } },
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
              text: "Applications by Region",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            x: {
              ticks: {
                color: brownPalette.primary,
                font: { size: 10 },
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
              text: "Approval Rate by Region",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                color: brownPalette.primary,
                font: { size: 10 },
                callback: (value) => value + "%",
              },
              grid: { color: brownPalette.lighter },
            },
            x: {
              ticks: {
                color: brownPalette.primary,
                font: { size: 10 },
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
                <h3>Top 3 Funded Industries</h3>
                <div className="leaderboardList">
                  {insights.topFundedIndustries.slice(0, 3).map((industry, index) => (
                    <div key={index} className="leaderboardItem">
                      <span className="rank">#{index + 1}</span>
                      <span className="industry">{industry.name}</span>
                      <span className="amount">R{(industry.amount / 1000000).toFixed(0)}M</span>
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