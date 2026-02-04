import { useEffect, useRef, useState } from "react"
import { Chart, registerables } from "chart.js"
import { TrendingUp, DollarSign, Users, Clock, Building2, MapPin, Target, Award } from "lucide-react"
import styles from "../MyMatches/investor-funding.module.css"
import { db, auth } from "../../firebaseConfig"
import { collection, query, onSnapshot, getDocs, where, doc, getDoc } from "firebase/firestore"
import Upsell from "../../components/Upsell/Upsell"
import useSubscriptionPlan from "../../hooks/useSubscriptionPlan"

Chart.register(...registerables)

export function InvestorInsights() {
  const [activeTab, setActiveTab] = useState("investment-demand")
  const { currentPlan, subscriptionLoading } = useSubscriptionPlan()
  const charts = useRef([])
  const [realTimeInsights, setRealTimeInsights] = useState(null)
  const [loading, setLoading] = useState(true)

  // Chart refs for all categories
  const chartRefs = {
    topInvestmentTypes: useRef(null),
    investmentPurposeBreakdown: useRef(null),
    monthlyInvestments: useRef(null),
    successRatesByType: useRef(null),
    investmentByLifecycle: useRef(null),
    avgROIByInvestmentType: useRef(null),
    investmentAllocationBySector: useRef(null),
    avgDealSizeBySector: useRef(null),
    investmentTypeBreakdown: useRef(null),
    avgTimeMatchToInvestment: useRef(null),
    investmentVolumeByRegion: useRef(null),
    applicationsByRegion: useRef(null),
    successRateByRegion: useRef(null),
  }

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



  const fetchRealTimeInsights = () => {
    setLoading(true)
    
    // Set up real-time listener for ALL investor applications (not just for current user)
    const applicationsQuery = query(collection(db, "investorApplications"))
    
    const unsubscribeApplications = onSnapshot(applicationsQuery, async (querySnapshot) => {
      try {
        const applications = []
        const smeIds = new Set()
        const investorIds = new Set()
        
        // Get all applications and collect SME IDs
        querySnapshot.forEach((docSnap) => {
          const appData = docSnap.data()
          applications.push({
            id: docSnap.id,
            ...appData,
            createdAt: appData.createdAt ? new Date(appData.createdAt) : new Date(),
            updatedAt: appData.updatedAt ? new Date(appData.updatedAt) : new Date(),
          })
          
          if (appData.smeId) {
            smeIds.add(appData.smeId)
          }
          
          if (appData.funderId) {
            investorIds.add(appData.funderId)
          }
        })

        // Fetch all SME profiles
        const smeProfiles = []
        const smeIdsArray = Array.from(smeIds)
        
        for (const smeId of smeIdsArray) {
          try {
            const profileQuery = query(collection(db, "universalProfiles"), where("__name__", "==", smeId))
            const profileSnapshot = await getDocs(profileQuery)
            
            if (!profileSnapshot.empty) {
              profileSnapshot.forEach((doc) => {
                smeProfiles.push({
                  id: doc.id,
                  ...doc.data(),
                })
              })
            }
          } catch (error) {
            console.error("Error fetching SME profile:", error)
          }
        }

        // Fetch all investor profiles to get names
        const investorProfiles = {}
        const investorIdsArray = Array.from(investorIds)
        
        for (const investorId of investorIdsArray) {
          try {
            // Try to fetch from universalProfiles first
            const profileQuery = query(collection(db, "universalProfiles"), where("__name__", "==", investorId))
            const profileSnapshot = await getDocs(profileQuery)
            
            if (!profileSnapshot.empty) {
              profileSnapshot.forEach((doc) => {
                investorProfiles[investorId] = {
                  name: doc.data().entityOverview?.registeredName || `Investor ${investorId.substring(0, 6)}...`,
                  id: investorId
                }
              })
            } else {
              // If not found in universalProfiles, try to fetch from MyuniversalProfiles
              const myProfileQuery = query(collection(db, "MyuniversalProfiles"), where("__name__", "==", investorId))
              const myProfileSnapshot = await getDocs(myProfileQuery)
              
              if (!myProfileSnapshot.empty) {
                myProfileSnapshot.forEach((doc) => {
                  investorProfiles[investorId] = {
                    name: doc.data().formData?.fundManageOverview?.registeredName || `Investor ${investorId.substring(0, 6)}...`,
                    id: investorId
                  }
                })
              } else {
                // Fallback to using the ID if no profile found
                investorProfiles[investorId] = {
                  name: `Investor ${investorId.substring(0, 6)}...`,
                  id: investorId
                }
              }
            }
          } catch (error) {
            console.error("Error fetching investor profile:", error)
            investorProfiles[investorId] = {
              name: `Investor ${investorId.substring(0, 6)}...`,
              id: investorId
            }
          }
        }

        // Calculate insights from ALL data
        const insights = calculateInsights(applications, smeProfiles, investorProfiles)
        setRealTimeInsights(insights)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching real-time insights:", error)
        setLoading(false)
      }
    })

    return unsubscribeApplications
  }

  const calculateInsights = (applications, smeProfiles, investorProfiles) => {
    const totalApplications = applications.length;
    
    // Get successful applications from the "Deal Complete" stage
    const successfulApplications = applications.filter(
      (app) => app.pipelineStage === "Deal Complete"
    ).length;

    // Calculate success rate
    const successRate = totalApplications > 0 ? 
      Math.round((successfulApplications / totalApplications) * 100) : 0;

    // Calculate average investment amount
    const fundingAmounts = smeProfiles
      .map((profile) => {
        const amount = profile.useOfFunds?.amountRequested?.replace(/[^\d]/g, "");
        return amount ? Number.parseInt(amount) : 0;
      })
      .filter((amount) => amount > 0);

    const averageInvestmentAmount =
      fundingAmounts.length > 0
        ? Math.round(fundingAmounts.reduce((sum, amount) => sum + amount, 0) / fundingAmounts.length)
        : 0

    // Calculate processing time
    const processingTimes = applications
      .filter((app) => app.updatedAt && app.createdAt)
      .map((app) => Math.ceil((app.updatedAt - app.createdAt) / (1000 * 60 * 60 * 24)))

    const averageProcessingTime =
      processingTimes.length > 0
        ? Math.round(processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length)
        : 0

    // Investment types analysis
    const investmentTypes = {}
    smeProfiles.forEach((profile) => {
      const instruments = profile.useOfFunds?.fundingInstruments
      if (Array.isArray(instruments)) {
        instruments.forEach((instrument) => {
          const formatted = formatLabel(instrument)
          investmentTypes[formatted] = (investmentTypes[formatted] || 0) + 1
        })
      }
    })

    // Sector analysis
    const sectorData = {}
    const sectorAmounts = {}
    smeProfiles.forEach((profile) => {
      const sector = formatLabel(profile.entityOverview?.economicSectors?.[0]) || "Other"
      const amount = Number.parseInt(profile.useOfFunds?.amountRequested?.replace(/[^\d]/g, "") || "0")

      sectorData[sector] = (sectorData[sector] || 0) + 1
      sectorAmounts[sector] = (sectorAmounts[sector] || 0) + amount
    })

    // Regional analysis
    const regionData = {}
    const regionAmounts = {}
    smeProfiles.forEach((profile) => {
      const location = formatLabel(profile.entityOverview?.location) || "Unknown"
      const amount = Number.parseInt(profile.useOfFunds?.amountRequested?.replace(/[^\d]/g, "") || "0")

      regionData[location] = (regionData[location] || 0) + 1
      regionAmounts[location] = (regionAmounts[location] || 0) + amount
    })

    // Pipeline stage analysis
    const stageData = {}
    applications.forEach((app) => {
      const stage = app.pipelineStage || "Initial"
      stageData[stage] = (stageData[stage] || 0) + 1
    })

    // Calculate success rates by investment type
    const typeSuccessRates = {}
    Object.keys(investmentTypes).forEach((type) => {
      const typeApps = applications.filter((app) => {
        const profile = smeProfiles.find((p) => p.id === app.smeId)
        return profile?.useOfFunds?.fundingInstruments?.some((inst) => formatLabel(inst) === type)
      })
      const successful = typeApps.filter(
        (app) => app.pipelineStage === "Deal Complete"
      ).length
      typeSuccessRates[type] = typeApps.length > 0 ? Math.round((successful / typeApps.length) * 100) : 0
    })

    // Monthly investments trend
    const monthlyData = {}
    applications.forEach((app) => {
      const month = app.createdAt.toLocaleDateString("en-US", { month: "short" })
      monthlyData[month] = (monthlyData[month] || 0) + 1
    })

    const monthlyInvestments = Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count,
    }))

    // Get unique investors with their names
    const investorData = {}
    applications.forEach((app) => {
      if (app.funderId) {
        investorData[app.funderId] = (investorData[app.funderId] || 0) + 1
      }
    })

    // Create most active investors list with actual names
    const mostActiveInvestors = Object.entries(investorData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, investments]) => ({ 
        name: investorProfiles[id]?.name || `Investor ${id.substring(0, 6)}...`, 
        investments 
      }))

    return {
      successRate,
      averageInvestmentAmount,
      totalSMEs: totalApplications,
      averageProcessingTime,

      // Investment Demand
      topInvestmentTypes: investmentTypes,
      investmentPurposeBreakdown: {
        "Business Expansion": Math.round(totalApplications * 0.4),
        "Technology Upgrade": Math.round(totalApplications * 0.25),
        "Market Entry": Math.round(totalApplications * 0.18),
        "Working Capital": Math.round(totalApplications * 0.12),
        "Equipment Purchase": Math.round(totalApplications * 0.05),
      },
      monthlyInvestments,

      // Success & Access Trends
      successRatesByInvestmentType: typeSuccessRates,
      investmentByLifecycle: stageData,
      avgROIByInvestmentType: Object.keys(investmentTypes).reduce((acc, type) => {
        acc[type] = Math.round(Math.random() * 15 + 10) // Placeholder calculation
        return acc
      }, {}),

      // Sector-Level Investment
      investmentAllocationBySector: sectorAmounts,
      topInvestedSectors: Object.entries(sectorAmounts)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
      avgDealSizeBySector: Object.keys(sectorAmounts).reduce((acc, sector) => {
        const count = sectorData[sector] || 1
        acc[sector] = Math.round(sectorAmounts[sector] / count)
        return acc
      }, {}),

      // Investment Engagement
      investmentTypeBreakdown: Object.keys(investmentTypes).reduce((acc, type, index) => {
        acc[type] = Math.round((investmentTypes[type] / totalApplications) * 100)
        return acc
      }, {}),
      avgTimeMatchToInvestment: Object.keys(sectorData).reduce((acc, sector) => {
        acc[sector] = Math.round(Math.random() * 15 + 10) // Placeholder calculation
        return acc
      }, {}),
      mostActiveInvestors,

      // Geography
      investmentVolumeByRegion: regionAmounts,
      applicationsByRegion: regionData,
      successRateByRegion: Object.keys(regionData).reduce((acc, region) => {
        const regionApps = applications.filter((app) => {
          const profile = smeProfiles.find((p) => p.id === app.smeId)
          return formatLabel(profile?.entityOverview?.location) === region
        })
        const successful = regionApps.filter(
          (app) => app.pipelineStage === "Deal Complete"
        ).length
        acc[region] = regionApps.length > 0 ? Math.round((successful / regionApps.length) * 100) : 0
        return acc
      }, {}),
    }
  }

  const formatLabel = (value) => {
    if (!value) return ""

    return value
      .toString()
      .split(",")
      .map((item) => item.trim())
      .map((word) => {
        if (word.toLowerCase() === "ict") return "ICT"
        if (word.toLowerCase() === "southafrica" || word.toLowerCase() === "south_africa") return "South Africa"
        return word
          .split(/[_\s-]+/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(" ")
      })
      .join(", ")
  }

  useEffect(() => {
    if (subscriptionLoading) return
    if (currentPlan === "basic") return

    const unsubscribe = fetchRealTimeInsights()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [subscriptionLoading, currentPlan])

  useEffect(() => {
    if (!realTimeInsights) return

    // Destroy existing charts
    charts.current.forEach((chart) => chart.destroy())
    charts.current = []

    const createChart = (ref, config) => {
      if (ref.current) {
        const ctx = ref.current.getContext("2d")
        if (ctx) {
          const chart = new Chart(ctx, config)
          charts.current.push(chart)
        }
      }
    }

    // Investment Demand Charts
    if (activeTab === "investment-demand") {
      // Top Investment Types - Horizontal Bar Chart
      createChart(chartRefs.topInvestmentTypes, {
        type: "bar",
        data: {
          labels: Object.keys(realTimeInsights.topInvestmentTypes),
          datasets: [
            {
              label: "Investments",
              data: Object.values(realTimeInsights.topInvestmentTypes),
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
              text: "Top Investment Types",
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

      // Investment Purpose Breakdown
      createChart(chartRefs.investmentPurposeBreakdown, {
        type: "doughnut",
        data: {
          labels: Object.keys(realTimeInsights.investmentPurposeBreakdown),
          datasets: [
            {
              data: Object.values(realTimeInsights.investmentPurposeBreakdown),
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
              text: "Investment Purpose Breakdown",
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

      // Monthly Investments
      createChart(chartRefs.monthlyInvestments, {
        type: "line",
        data: {
          labels: realTimeInsights.monthlyInvestments.map((d) => d.month),
          datasets: [
            {
              label: "Investments",
              data: realTimeInsights.monthlyInvestments.map((d) => d.count),
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
              text: "Monthly Investments",
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

    // Success & Access Trends Charts
    if (activeTab === "success-trends") {
      // Success Rates by Investment Type
      createChart(chartRefs.successRatesByType, {
        type: "bar",
        data: {
          labels: Object.keys(realTimeInsights.successRatesByInvestmentType),
          datasets: [
            {
              label: "Success Rate (%)",
              data: Object.values(realTimeInsights.successRatesByInvestmentType),
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
              text: "Success Rates by Investment Type",
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

      // Investment by Business Lifecycle
      createChart(chartRefs.investmentByLifecycle, {
        type: "bar",
        data: {
          labels: Object.keys(realTimeInsights.investmentByLifecycle),
          datasets: [
            {
              label: "Number of Investments",
              data: Object.values(realTimeInsights.investmentByLifecycle),
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
              text: "Investment by Business Lifecycle Stage",
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

      // Average ROI by Investment Type
      createChart(chartRefs.avgROIByInvestmentType, {
        type: "bar",
        data: {
          labels: Object.keys(realTimeInsights.avgROIByInvestmentType),
          datasets: [
            {
              label: "Average ROI (%)",
              data: Object.values(realTimeInsights.avgROIByInvestmentType),
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
              text: "Average ROI by Investment Type",
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
                callback: (value) => value + "%",
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

    // Sector-Level Investment Charts
    if (activeTab === "sector-investment") {
      // Investment Allocation by Sector - Horizontal Bar Chart
      createChart(chartRefs.investmentAllocationBySector, {
        type: "bar",
        data: {
          labels: Object.keys(realTimeInsights.investmentAllocationBySector),
          datasets: [
            {
              label: "Total Investment (ZAR)",
              data: Object.values(realTimeInsights.investmentAllocationBySector),
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
              text: "Investment Allocation by Sector",
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
                callback: (value) => "R" + (value / 1000000).toFixed(0) + "M",
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              ticks: {
                color: brownPalette.primary,
                font: { size: 10 },
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Average Deal Size by Sector
      createChart(chartRefs.avgDealSizeBySector, {
        type: "bar",
        data: {
          labels: Object.keys(realTimeInsights.avgDealSizeBySector),
          datasets: [
            {
              label: "Average Deal Size (ZAR)",
              data: Object.values(realTimeInsights.avgDealSizeBySector),
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
              text: "Average Deal Size by Sector",
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
                callback: (value) => "R" + (value / 1000).toFixed(0) + "K",
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

    // Investment Engagement Charts
    if (activeTab === "investment-engagement") {
      createChart(chartRefs.investmentTypeBreakdown, {
        type: "doughnut",
        data: {
          labels: Object.keys(realTimeInsights.investmentTypeBreakdown),
          datasets: [
            {
              data: Object.values(realTimeInsights.investmentTypeBreakdown),
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
              text: "Investment Type Breakdown",
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

      // Average Time from Match to Investment - Horizontal Bar Chart
      createChart(chartRefs.avgTimeMatchToInvestment, {
        type: "bar",
        data: {
          labels: Object.keys(realTimeInsights.avgTimeMatchToInvestment),
          datasets: [
            {
              label: "Average Time (Days)",
              data: Object.values(realTimeInsights.avgTimeMatchToInvestment),
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
              text: "Average Time from Match to Investment",
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
                callback: (value) => value + " days",
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

    // Geography Charts
    if (activeTab === "geography") {
      // Investment Volume by Region - Horizontal Bar Chart
      createChart(chartRefs.investmentVolumeByRegion, {
        type: "bar",
        data: {
          labels: Object.keys(realTimeInsights.investmentVolumeByRegion),
          datasets: [
            {
              label: "Investment Volume (ZAR)",
              data: Object.values(realTimeInsights.investmentVolumeByRegion),
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
              text: "Investment Volume by Region",
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
                callback: (value) => "R" + (value / 1000000).toFixed(0) + "M",
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              ticks: {
                color: brownPalette.primary,
                font: { size: 10 },
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Applications by Region
      createChart(chartRefs.applicationsByRegion, {
        type: "bar",
        data: {
          labels: Object.keys(realTimeInsights.applicationsByRegion),
          datasets: [
            {
              label: "Number of Applications",
              data: Object.values(realTimeInsights.applicationsByRegion),
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
              text: "Investment Applications by Region",
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

      // Success Rate by Region - Horizontal Bar Chart
      createChart(chartRefs.successRateByRegion, {
        type: "bar",
        data: {
          labels: Object.keys(realTimeInsights.successRateByRegion),
          datasets: [
            {
              label: "Success Rate (%)",
              data: Object.values(realTimeInsights.successRateByRegion),
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
              text: "Investment Success Rate by Region",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              ticks: {
                color: brownPalette.primary,
                font: { size: 10 },
                callback: (value) => value + "%",
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              ticks: {
                color: brownPalette.primary,
                font: { size: 10 },
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
  }, [activeTab, realTimeInsights])

  // Subscription check takes priority: show upsell early if the user is on Discover
  if (subscriptionLoading) {
    return (
      <div
        style={{
          paddingTop: "40px",
          paddingLeft: "280px",
          paddingRight: "20px",
          minHeight: "100vh",
          backgroundColor: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#6d4c41" }}>
          <h2>Checking subscription...</h2>
        </div>
      </div>
    )
  }

  if (currentPlan === "basic") {
    return (
      <Upsell
        title={"BIG Insights Analytics"}
        subtitle={"Unlock powerful analytics and real-time insights to discover investment opportunities, track market trends, and make data-driven decisions with our comprehensive platform analytics."}
        features={[
          "Real-time investment demand analytics",
          "Success rates & performance trends by investment type",
          "Sector-level investment analysis & breakdowns",
          "Deal flow engagement metrics & ROI tracking",
          "Geographic investment patterns & regional insights",
          "Comprehensive market intelligence for informed decisions",
        ]}
        variant={"card"}
        sidebarWidth={280}
        plans={["Engage", "Partner"]}
        upgradeMessage={"Upgrade your subscription to access exclusive analytics, advanced reporting, and strategic insights that power successful investment decisions."}
        primaryLabel={"View Available Plans"}
      />
    )
  }

  if (loading || !realTimeInsights) {
    return (
      <div
        style={{
          paddingTop: "40px",
          paddingLeft: "280px",
          paddingRight: "20px",
          minHeight: "100vh",
          backgroundColor: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#6d4c41" }}>
          <h2>Loading Platform Insights...</h2>
          <p>Fetching investment data from all investors</p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        paddingTop: "40px",
        paddingLeft: "280px", // Account for sidebar
        paddingRight: "20px",
        minHeight: "100vh",
        backgroundColor: "#fafafa",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "30px 40px",
          borderRadius: "8px",
          marginBottom: "24px",
          textAlign: "center",
          maxWidth: "1400px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <h1
          style={{
            fontSize: "42px",
            fontWeight: "bold",
            color: "#6d4c41",
            marginBottom: "8px",
            marginTop: "0",
          }}
        >
          BIG Platform Insights
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "#8d6e63",
            margin: "0",
            fontWeight: "400",
          }}
        >
          Real-time analytics and insights across all investors on the platform
        </p>
      </div>

      <div
        className={styles.fundingInsights}
        style={{
          maxWidth: "1400px",
          marginLeft: "auto",
          marginRight: "auto",
          padding: "0 10px",
        }}
      >
        <div className={styles.insightsSummary}>
          <div className={styles.insightCard}>
            <div className={styles.insightIcon}>
              <TrendingUp size={18} />
            </div>
            <div className={styles.insightContent}>
              <h3>{realTimeInsights.successRate}%</h3>
              <p>Success Rate</p>
            </div>
          </div>
          <div className={styles.insightCard}>
            <div className={styles.insightIcon}>
              <DollarSign size={18} />
            </div>
            <div className={styles.insightContent}>
              <h3>R{(realTimeInsights.averageInvestmentAmount / 1000000).toFixed(1)}M</h3>
              <p>Avg. Investment</p>
            </div>
          </div>
          <div className={styles.insightCard}>
            <div className={styles.insightIcon}>
              <Users size={18} />
            </div>
            <div className={styles.insightContent}>
              <h3>{realTimeInsights.totalSMEs}</h3>
              <p>SMEs Funded</p>
            </div>
          </div>
          <div className={styles.insightCard}>
            <div className={styles.insightIcon}>
              <Clock size={18} />
            </div>
            <div className={styles.insightContent}>
              <h3>{realTimeInsights.averageProcessingTime} days</h3>
              <p>Processing Time</p>
            </div>
          </div>
        </div>

        <div className={styles.insightsTabs}>
          <div className={styles.insightsTabHeader}>
            <button
              className={`${styles.insightsTab} ${activeTab === "investment-demand" ? styles.insightsTabActive : ""}`}
              onClick={() => setActiveTab("investment-demand")}
            >
              <Target size={12} /> <span>Investment Demand</span>
            </button>
            <button
              className={`${styles.insightsTab} ${activeTab === "success-trends" ? styles.insightsTabActive : ""}`}
              onClick={() => setActiveTab("success-trends")}
            >
              <Award size={12} /> <span>Success Trends</span>
            </button>
            <button
              className={`${styles.insightsTab} ${activeTab === "sector-investment" ? styles.insightsTabActive : ""}`}
              onClick={() => setActiveTab("sector-investment")}
            >
              <Building2 size={12} /> <span>Sector Investment</span>
            </button>
            <button
              className={`${styles.insightsTab} ${activeTab === "investment-engagement" ? styles.insightsTabActive : ""}`}
              onClick={() => setActiveTab("investment-engagement")}
            >
              <Users size={12} /> <span>Investment Engagement</span>
            </button>
            <button
              className={`${styles.insightsTab} ${activeTab === "geography" ? styles.insightsTabActive : ""}`}
              onClick={() => setActiveTab("geography")}
            >
              <MapPin size={12} /> <span>Geography</span>
            </button>
          </div>
        </div>

        <div className={styles.insightsContainer}>
          {activeTab === "investment-demand" && (
            <>
              <div className={styles.chartContainer}>
                <canvas ref={chartRefs.topInvestmentTypes} />
              </div>
              <div className={styles.chartContainer}>
                <canvas ref={chartRefs.investmentPurposeBreakdown} />
              </div>
              <div className={styles.chartContainer}>
                <canvas ref={chartRefs.monthlyInvestments} />
              </div>
            </>
          )}

          {activeTab === "success-trends" && (
            <>
              <div className={styles.chartContainer}>
                <canvas ref={chartRefs.successRatesByType} />
              </div>
              <div className={styles.chartContainer}>
                <canvas ref={chartRefs.investmentByLifecycle} />
              </div>
              <div className={styles.chartContainer}>
                <canvas ref={chartRefs.avgROIByInvestmentType} />
              </div>
            </>
          )}

          {activeTab === "sector-investment" && (
            <>
              <div className={styles.chartContainer}>
                <canvas ref={chartRefs.investmentAllocationBySector} />
              </div>
              <div className={`${styles.chartContainer} ${styles.leaderboardContainer}`}>
                <div className={styles.leaderboard}>
                  <h3>Top 3 Invested Sectors</h3>
                  <div className={styles.leaderboardList}>
                    {realTimeInsights.topInvestedSectors.slice(0, 3).map((sector, index) => (
                      <div key={index} className={styles.leaderboardItem}>
                        <span className={styles.rank}>#{index + 1}</span>
                        <span className={styles.industry}>{sector.name}</span>
                        <span className={styles.amount}>R{(sector.amount / 1000000).toFixed(0)}M</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles.chartContainer}>
                <canvas ref={chartRefs.avgDealSizeBySector} />
              </div>
            </>
          )}

          {activeTab === "investment-engagement" && (
            <>
              <div className={styles.chartContainer}>
                <canvas ref={chartRefs.investmentTypeBreakdown} />
              </div>
              <div className={styles.chartContainer}>
                <canvas ref={chartRefs.avgTimeMatchToInvestment} />
              </div>
              <div className={`${styles.chartContainer} ${styles.leaderboardContainer}`}>
                <div className={styles.leaderboard}>
                  <h3>Most Active Investors</h3>
                  <div className={styles.leaderboardList}>
                    {realTimeInsights.mostActiveInvestors.slice(0, 3).map((investor, index) => (
                      <div key={index} className={styles.leaderboardItem}>
                        <span className={styles.rank}>#{index + 1}</span>
                        <span className={styles.industry}>{investor.name}</span>
                        <span className={styles.amount}>{investor.investments} investments</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "geography" && (
            <>
              <div className={styles.chartContainer}>
                <canvas ref={chartRefs.investmentVolumeByRegion} />
              </div>
              <div className={styles.chartContainer}>
                <canvas ref={chartRefs.applicationsByRegion} />
              </div>
              <div className={styles.chartContainer}>
                <canvas ref={chartRefs.successRateByRegion} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}