

"use client"

import { useEffect, useRef, useState } from "react"
import { Chart, registerables } from "chart.js"
import { TrendingUp, Users, Clock, Award, GitBranch, UserCheck, BarChart3 } from "lucide-react"
import "../../smses/MyFunderMatches/funding.module.css"

Chart.register(...registerables)

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

export function Insights () {
  const [activeTab, setActiveTab] = useState("pipeline-conversion")
  const charts = useRef([])
  const prevActiveTab = useRef()

  // Comprehensive mock data for intern insights
  const mockInsights = {
    totalInterns: 89,
    avgRating: 4.2,
    avgPlacementTime: 14, // days
    conversionRate: 76.5,

    // TAB 1: Pipeline & Conversion
    internsMatchedOverTime: [
      { month: "Jan", matches: 8 },
      { month: "Feb", matches: 12 },
      { month: "Mar", matches: 15 },
      { month: "Apr", matches: 18 },
      { month: "May", matches: 22 },
      { month: "Jun", matches: 25 },
    ],
    matchToOfferConversion: {
      Matched: 100,
      Interviewed: 85,
      "Offer Made": 65,
      "Offer Accepted": 48,
    },
    avgTimeToPlacement: {
      "REQ-001": 12,
      "REQ-002": 18,
      "REQ-003": 8,
      "REQ-004": 21,
      "REQ-005": 15,
      "REQ-006": 10,
    },

    // TAB 2: Intern Performance
    avgInternRating: {
      "Sarah Johnson": 4.8,
      "Michael Chen": 4.5,
      "Emily Rodriguez": 4.7,
      "David Kim": 4.2,
      "Jessica Taylor": 4.6,
      "Alex Thompson": 4.3,
    },
    completionRateByRole: {
      "Software Engineering": 92,
      "Data Science": 88,
      "Marketing": 85,
      "Design": 90,
      "Finance": 82,
    },
    repeatPlacementRate: {
      Rehired: 35,
      Retained: 28,
      "One-time": 37,
    },

    // TAB 3: Program & Impact
    internsPlacedPerProgram: {
      "SETA": 25,
      "YES": 18,
      "University Partnership": 22,
      "Skills Development": 15,
      "Graduate Program": 12,
    },
    internshipTypeBreakdown: {
      Remote: 45,
      "In-Person": 35,
      Hybrid: 20,
    },
    departmentalInternDemand: {
      "Engineering": 28,
      "Marketing": 22,
      "Operations": 18,
      "Finance": 15,
      "HR": 12,
      "Design": 10,
    },
  }

  // Memoize the insights data
  const memoizedInsights = useDeepCompareMemo(mockInsights)

  // Chart refs for all categories
  const chartRefs = {
    internsMatchedOverTime: useRef(null),
    matchToOfferConversion: useRef(null),
    avgTimeToPlacement: useRef(null),
    avgInternRating: useRef(null),
    completionRateByRole: useRef(null),
    repeatPlacementRate: useRef(null),
    internsPlacedPerProgram: useRef(null),
    internshipTypeBreakdown: useRef(null),
    departmentalInternDemand: useRef(null),
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

    // TAB 1: Pipeline & Conversion
    if (activeTab === "pipeline-conversion") {
      // Interns Matched Over Time (Line Chart)
      createChart(chartRefs.internsMatchedOverTime, {
        type: "line",
        data: {
          labels: memoizedInsights.internsMatchedOverTime.map((d) => d.month),
          datasets: [
            {
              label: "Interns Matched",
              data: memoizedInsights.internsMatchedOverTime.map((d) => d.matches),
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
              text: "Interns Matched Over Time",
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
                text: "Number of Matches (Count)",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Match-to-Offer Conversion (Funnel Chart)
      createChart(chartRefs.matchToOfferConversion, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.matchToOfferConversion),
          datasets: [
            {
              label: "Conversion %",
              data: Object.values(memoizedInsights.matchToOfferConversion),
              backgroundColor: [
                brownPalette.primary,
                brownPalette.secondary,
                brownPalette.tertiary,
                brownPalette.light,
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
              text: "Match-to-Offer Conversion",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Stage (Matched → Offer)",
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

      // Avg. Time to Placement (Bar Chart)
      createChart(chartRefs.avgTimeToPlacement, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.avgTimeToPlacement),
          datasets: [
            {
              label: "Days",
              data: Object.values(memoizedInsights.avgTimeToPlacement),
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
              text: "Avg. Time to Placement",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Request ID or Month",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Days",
                color: brownPalette.primary,
              },
              ticks: {
                color: brownPalette.primary,
                font: { size: 10 },
                callback: (value) => value + " days",
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })
    }

    // TAB 2: Intern Performance
    if (activeTab === "intern-performance") {
      // Average Intern Rating (Column Chart)
      createChart(chartRefs.avgInternRating, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.avgInternRating),
          datasets: [
            {
              label: "Rating",
              data: Object.values(memoizedInsights.avgInternRating),
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
              text: "Average Intern Rating",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Intern Name or Role",
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
                text: "Rating (Score 1-5)",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Completion Rate by Role (Bar Chart)
      createChart(chartRefs.completionRateByRole, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.completionRateByRole),
          datasets: [
            {
              label: "% Completed",
              data: Object.values(memoizedInsights.completionRateByRole),
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
              text: "Completion Rate by Role",
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
            y: {
              title: {
                display: true,
                text: "Role Type",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Repeat Placement Rate (Donut Chart)
      createChart(chartRefs.repeatPlacementRate, {
        type: "doughnut",
        data: {
          labels: Object.keys(memoizedInsights.repeatPlacementRate),
          datasets: [
            {
              data: Object.values(memoizedInsights.repeatPlacementRate),
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
              text: "Repeat Placement Rate",
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

    // TAB 3: Program & Impact
    if (activeTab === "program-impact") {
      // Interns Placed per Program (Bar Chart)
      createChart(chartRefs.internsPlacedPerProgram, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.internsPlacedPerProgram),
          datasets: [
            {
              label: "Number",
              data: Object.values(memoizedInsights.internsPlacedPerProgram),
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
              text: "Interns Placed per Program",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Program (e.g. SETA, YES)",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Number (Count)",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Internship Type Breakdown (Donut Chart)
      createChart(chartRefs.internshipTypeBreakdown, {
        type: "doughnut",
        data: {
          labels: Object.keys(memoizedInsights.internshipTypeBreakdown),
          datasets: [
            {
              data: Object.values(memoizedInsights.internshipTypeBreakdown),
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
              text: "Internship Type Breakdown",
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

      // Departmental Intern Demand (Bar Chart)
      createChart(chartRefs.departmentalInternDemand, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.departmentalInternDemand),
          datasets: [
            {
              label: "Number of Requests",
              data: Object.values(memoizedInsights.departmentalInternDemand),
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
              text: "Departmental Intern Demand",
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
                text: "Number of Requests (Count)",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              title: {
                display: true,
                text: "Dept / Function",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
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
            <h3>{memoizedInsights.totalInterns}</h3>
            <p>Total Interns</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon">
            <Users size={18} />
          </div>
          <div className="insightContent">
            <h3>{memoizedInsights.avgRating}</h3>
            <p>Avg Rating</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon">
            <Clock size={18} />
          </div>
          <div className="insightContent">
            <h3>{memoizedInsights.avgPlacementTime}d</h3>
            <p>Avg Placement Time</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon">
            <Award size={18} />
          </div>
          <div className="insightContent">
            <h3>{memoizedInsights.conversionRate}%</h3>
            <p>Conversion Rate</p>
          </div>
        </div>
      </div>

      <div className="insightsTabs">
        <div className="insightsTabHeader">
          <button
            className={`insightsTab ${activeTab === "pipeline-conversion" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("pipeline-conversion")}
          >
            <GitBranch size={12} /> <span>Pipeline & Conversion</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "intern-performance" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("intern-performance")}
          >
            <UserCheck size={12} /> <span>Intern Performance</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "program-impact" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("program-impact")}
          >
            <BarChart3 size={12} /> <span>Program & Impact</span>
          </button>
        </div>
      </div>

      <div className="insightsContainer">
        {activeTab === "pipeline-conversion" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.internsMatchedOverTime} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.matchToOfferConversion} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgTimeToPlacement} />
            </div>
          </>
        )}

        {activeTab === "intern-performance" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgInternRating} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.completionRateByRole} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.repeatPlacementRate} />
            </div>
          </>
        )}

        {activeTab === "program-impact" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.internsPlacedPerProgram} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.internshipTypeBreakdown} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.departmentalInternDemand} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}