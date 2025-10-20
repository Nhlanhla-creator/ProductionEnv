"use client"

import { useEffect, useRef, useState } from "react"
import { Chart, registerables } from "chart.js"
import { TrendingUp, Users, Clock, Award, UserCheck, Brain, Target } from "lucide-react"
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
  const charts = useRef([])
  const prevActiveTab = useRef()

  // Comprehensive mock data for supplier insights
  const mockInsights = {
    totalMatches: 234,
    avgMatchScore: 82,
    avgResponseTime: 3.2, // days
    completionRate: 78.5,

    // TAB 1: Matching & Discovery
    supplierMatchCountOverTime: [
      { month: "Jan", matches: 28 },
      { month: "Feb", matches: 35 },
      { month: "Mar", matches: 42 },
      { month: "Apr", matches: 38 },
      { month: "May", matches: 45 },
      { month: "Jun", matches: 52 },
    ],
    avgMatchScorePerRequest: [
      { requestId: "REQ-001", score: 85 },
      { requestId: "REQ-002", score: 72 },
      { requestId: "REQ-003", score: 91 },
      { requestId: "REQ-004", score: 68 },
      { requestId: "REQ-005", score: 79 },
      { requestId: "REQ-006", score: 88 },
      { requestId: "REQ-007", score: 76 },
      { requestId: "REQ-008", score: 93 },
    ],
    matchesByServiceCategory: {
      "Digital Marketing": 145,
      "Web Development": 128,
      Consulting: 98,
      "Graphic Design": 85,
      "Content Creation": 72,
      "SEO Services": 54,
    },

    // TAB 2: Supplier Performance
    avgSupplierRatingLast6Months: [
      { month: "Jan", rating: 4.1 },
      { month: "Feb", rating: 4.2 },
      { month: "Mar", rating: 4.0 },
      { month: "Apr", rating: 4.4 },
      { month: "May", rating: 4.3 },
      { month: "Jun", rating: 4.5 },
    ],
    completionRateBySupplier: {
      "TechCorp Solutions": 85,
      "Digital Dynamics": 78,
      "Creative Studio": 92,
      "Marketing Pro": 68,
      "Dev Masters": 74,
      "Design Hub": 81,
    },
    avgTimeToRespond: {
      "TechCorp Solutions": 2.5,
      "Digital Dynamics": 3.8,
      "Creative Studio": 1.2,
      "Marketing Pro": 4.5,
      "Dev Masters": 2.1,
      "Design Hub": 3.2,
    },

    // TAB 3: Engagement Outcome
    conversionRateByServiceType: {
      "Digital Marketing": 72,
      "Web Development": 68,
      Consulting: 85,
      "Graphic Design": 58,
      "Content Creation": 64,
      "SEO Services": 71,
    },
    avgDealSizeBySupplier: {
      "TechCorp Solutions": 125000,
      "Digital Dynamics": 85000,
      "Creative Studio": 45000,
      "Marketing Pro": 65000,
      "Dev Masters": 95000,
      "Design Hub": 38000,
    },
    proposalToDealConversionTime: [
      { supplier: "TechCorp Solutions", time: 12 },
      { supplier: "Digital Dynamics", time: 18 },
      { supplier: "Creative Studio", time: 8 },
      { supplier: "Marketing Pro", time: 22 },
      { supplier: "Dev Masters", time: 15 },
      { supplier: "Design Hub", time: 14 },
    ],
  }

  // Memoize the insights data
  const memoizedInsights = useDeepCompareMemo(mockInsights)

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

      // Avg. Match Score per Request (Column Chart)
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

      // Matches by Service Category (Bar Chart)
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

      // Avg. Time to Respond (Bar Chart)
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

    // TAB 3: Engagement Outcome
    if (activeTab === "engagement-outcome") {
      // Conversion Rate by Service Type (Column Chart)
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

      // Avg. Deal Size by Supplier (Bar Chart)
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

      // Proposal to Deal Conversion Time (Line Chart)
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

    return () => {
      charts.current.forEach((chart) => chart.destroy())
    }
  }, [activeTab, memoizedInsights])

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
    </div>
  )
}
