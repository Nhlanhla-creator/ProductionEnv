"use client"
import { useEffect, useRef, useState } from "react"
import { Chart, registerables } from "chart.js"
import { TrendingUp, Users, Clock, Award, GitBranch, UserCheck, BarChart3, Building, Target } from 'lucide-react'
import "../../smses/MyFunderMatches/funding.module.css"

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

export function ProgramSponsorInsights() {
  const [activeTab, setActiveTab] = useState("placement-volume")
  const charts = useRef([])
  const prevActiveTab = useRef()

  // Comprehensive mock data for program sponsor insights
  const mockInsights = {
    totalPlacements: 156,
    avgRating: 4.3,
    avgPlacementTime: 18, // days
    absorptionRate: 68.5,

    // TAB 1: Placement Volume & Reach
    internPlacementsOverTime: [
      { month: "Jan", placements: 12 },
      { month: "Feb", placements: 18 },
      { month: "Mar", placements: 22 },
      { month: "Apr", placements: 28 },
      { month: "May", placements: 35 },
      { month: "Jun", placements: 41 },
    ],
    internsByProvince: {
      "Gauteng": 45,
      "Western Cape": 38,
      "KwaZulu-Natal": 28,
      "Eastern Cape": 22,
      "Free State": 15,
      "Limpopo": 8,
    },
    placementsByRole: {
      "Software Development": 35,
      "Data Analysis": 28,
      "Marketing": 25,
      "Finance": 22,
      "HR": 18,
      "Operations": 15,
      "Design": 13,
    },

    // TAB 2: SME Participation & Profile
    smesByIndustrySector: {
      "Technology": 42,
      "Finance": 35,
      "Healthcare": 28,
      "Manufacturing": 25,
      "Retail": 22,
      "Agriculture": 18,
    },
    placementsBySMERevenueBand: {
      "R0-R5M": 45,
      "R5M-R20M": 38,
      "R20M-R50M": 32,
      "R50M-R100M": 25,
      "R100M+": 16,
    },
    smesWithActiveInterns: {
      "Active Placements": 75,
      "No Current Placements": 25,
    },

    // TAB 3: Intern Performance & Ratings
    avgInternRatingByProgram: {
      "SETA Digital": 4.5,
      "YES Program": 4.2,
      "University Partnership": 4.3,
      "Skills Development": 4.1,
      "Graduate Program": 4.4,
    },
    completionRateByRole: {
      "Software Development": 92,
      "Data Analysis": 88,
      "Marketing": 85,
      "Finance": 90,
      "HR": 82,
      "Operations": 87,
    },
    repeatPlacementRate: {
      "New Placements": 45,
      "Repeat Placements": 55,
    },

    // TAB 4: Compliance & Tracking
    internPerformanceReport: {
      "January": 85,
      "February": 88,
      "March": 92,
      "April": 87,
      "May": 90,
      "June": 94,
    },
    internsByStipendSource: {
      "SETA Funding": 45,
      "Company Budget": 35,
      "Government Grant": 20,
    },
    avgTimeToPlaceIntern: {
      "Software Development": 12,
      "Marketing": 15,
      "Finance": 18,
      "Operations": 14,
      "HR": 16,
      "Design": 13,
    },

    // TAB 5: Intern Absorption Rate
    absorptionRateByProgram: {
      "SETA Digital": 75,
      "YES Program": 68,
      "University Partnership": 72,
      "Skills Development": 65,
      "Graduate Program": 78,
    },
    hiresByRoleType: {
      "Software Development": 25,
      "Marketing": 18,
      "Finance": 15,
      "Operations": 12,
      "HR": 10,
      "Design": 8,
    },
    absorptionBySMESize: {
      "Small (0-50)": 45,
      "Medium (51-200)": 35,
      "Large (200+)": 68,
    },
  }

  // Memoize the insights data
  const memoizedInsights = useDeepCompareMemo(mockInsights)

  // Chart refs for all categories
  const chartRefs = {
    internPlacementsOverTime: useRef(null),
    internsByProvince: useRef(null),
    placementsByRole: useRef(null),
    smesByIndustrySector: useRef(null),
    placementsBySMERevenueBand: useRef(null),
    smesWithActiveInterns: useRef(null),
    avgInternRatingByProgram: useRef(null),
    completionRateByRole: useRef(null),
    repeatPlacementRate: useRef(null),
    internPerformanceReport: useRef(null),
    internsByStipendSource: useRef(null),
    avgTimeToPlaceIntern: useRef(null),
    absorptionRateByProgram: useRef(null),
    hiresByRoleType: useRef(null),
    absorptionBySMESize: useRef(null),
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

    // TAB 1: Placement Volume & Reach
    if (activeTab === "placement-volume") {
      // Intern Placements Over Time (Line Chart)
      createChart(chartRefs.internPlacementsOverTime, {
        type: "line",
        data: {
          labels: memoizedInsights.internPlacementsOverTime.map((d) => d.month),
          datasets: [
            {
              label: "Number of Placements",
              data: memoizedInsights.internPlacementsOverTime.map((d) => d.placements),
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
              text: "Intern Placements Over Time",
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
                text: "Number of Placements (Count)",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Interns by Province (Column Chart)
      createChart(chartRefs.internsByProvince, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.internsByProvince),
          datasets: [
            {
              label: "Number of Interns",
              data: Object.values(memoizedInsights.internsByProvince),
              backgroundColor: [
                brownPalette.primary,
                brownPalette.secondary,
                brownPalette.tertiary,
                brownPalette.light,
                brownPalette.lighter,
                brownPalette.accent1,
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
              text: "Interns by Province",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Province",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Number of Interns (Count)",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Placements by Role/Function (Bar Chart)
      createChart(chartRefs.placementsByRole, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.placementsByRole),
          datasets: [
            {
              label: "Number Placed",
              data: Object.values(memoizedInsights.placementsByRole),
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
              text: "Placements by Role / Function",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Intern Role",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Number Placed (Count)",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })
    }

    // TAB 2: SME Participation & Profile
    if (activeTab === "sme-participation") {
      // SMEs by Industry Sector (Bar Chart)
      createChart(chartRefs.smesByIndustrySector, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.smesByIndustrySector),
          datasets: [
            {
              label: "Number of SMEs",
              data: Object.values(memoizedInsights.smesByIndustrySector),
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
              text: "SMEs by Industry Sector",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Sector",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Number of SMEs (Count)",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Placements by SME Revenue Band (Column Chart)
      createChart(chartRefs.placementsBySMERevenueBand, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.placementsBySMERevenueBand),
          datasets: [
            {
              label: "Intern Placements",
              data: Object.values(memoizedInsights.placementsBySMERevenueBand),
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
              text: "Placements by SME Revenue Band",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Revenue Band",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Intern Placements (Count)",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // SMEs with Active Interns (Donut Chart)
      createChart(chartRefs.smesWithActiveInterns, {
        type: "doughnut",
        data: {
          labels: Object.keys(memoizedInsights.smesWithActiveInterns),
          datasets: [
            {
              data: Object.values(memoizedInsights.smesWithActiveInterns),
              backgroundColor: [brownPalette.primary, brownPalette.secondary],
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
              text: "SMEs with Active Interns",
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

    // TAB 3: Intern Performance & Ratings
    if (activeTab === "intern-performance") {
      // Avg. Intern Rating by Program (Column Chart)
      createChart(chartRefs.avgInternRatingByProgram, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.avgInternRatingByProgram),
          datasets: [
            {
              label: "Avg. Rating",
              data: Object.values(memoizedInsights.avgInternRatingByProgram),
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
              text: "Avg. Intern Rating by Program",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Program",
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

      // Completion Rate by Role (Bar Chart)
      createChart(chartRefs.completionRateByRole, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.completionRateByRole),
          datasets: [
            {
              label: "% Completed",
              data: Object.values(memoizedInsights.completionRateByRole),
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
                text: "Role",
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
              backgroundColor: [brownPalette.primary, brownPalette.tertiary],
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

    // TAB 4: Compliance & Tracking
    if (activeTab === "compliance-tracking") {
      // Intern Performance Report (Column Chart)
      createChart(chartRefs.internPerformanceReport, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.internPerformanceReport),
          datasets: [
            {
              label: "% Submitted",
              data: Object.values(memoizedInsights.internPerformanceReport),
              backgroundColor: brownPalette.lighter,
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
              text: "Intern Performance Report",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Program or Month",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "% Submitted (Percentage)",
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

      // Interns by Stipend Source (Donut Chart)
      createChart(chartRefs.internsByStipendSource, {
        type: "doughnut",
        data: {
          labels: Object.keys(memoizedInsights.internsByStipendSource),
          datasets: [
            {
              data: Object.values(memoizedInsights.internsByStipendSource),
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
              text: "Interns by Stipend Source",
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

      // Avg. Time to Place Intern (Bar Chart)
      createChart(chartRefs.avgTimeToPlaceIntern, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.avgTimeToPlaceIntern),
          datasets: [
            {
              label: "Days to Placement",
              data: Object.values(memoizedInsights.avgTimeToPlaceIntern),
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
              text: "Avg. Time to Place Intern",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Role or SME",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Days to Placement (Days)",
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

    // TAB 5: Intern Absorption Rate
    if (activeTab === "absorption-rate") {
      // Absorption Rate by Program (Bar Chart)
      createChart(chartRefs.absorptionRateByProgram, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.absorptionRateByProgram),
          datasets: [
            {
              label: "% Hired Post-Internship",
              data: Object.values(memoizedInsights.absorptionRateByProgram),
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
              text: "Absorption Rate by Program",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Program",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "% Hired Post-Internship",
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

      // Hires by Role Type (Column Chart)
      createChart(chartRefs.hiresByRoleType, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.hiresByRoleType),
          datasets: [
            {
              label: "Number Hired",
              data: Object.values(memoizedInsights.hiresByRoleType),
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
              text: "Hires by Role Type",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Role",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Number Hired (Count)",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Absorption by SME Size (Bar Chart)
      createChart(chartRefs.absorptionBySMESize, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.absorptionBySMESize),
          datasets: [
            {
              label: "% Hired",
              data: Object.values(memoizedInsights.absorptionBySMESize),
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
              text: "Absorption by SME Size",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Revenue Band",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "% Hired",
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
            <h3>{memoizedInsights.totalPlacements}</h3>
            <p>Total Placements</p>
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
            <h3>{memoizedInsights.absorptionRate}%</h3>
            <p>Absorption Rate</p>
          </div>
        </div>
      </div>

      <div className="insightsTabs">
        <div className="insightsTabHeader">
          <button
            className={`insightsTab ${activeTab === "placement-volume" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("placement-volume")}
          >
            <GitBranch size={12} /> <span>Placement Volume & Reach</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "sme-participation" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("sme-participation")}
          >
            <Building size={12} /> <span>SME Participation & Profile</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "intern-performance" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("intern-performance")}
          >
            <UserCheck size={12} /> <span>Intern Performance & Ratings</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "compliance-tracking" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("compliance-tracking")}
          >
            <BarChart3 size={12} /> <span>Compliance & Tracking</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "absorption-rate" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("absorption-rate")}
          >
            <Target size={12} /> <span>Intern Absorption Rate</span>
          </button>
        </div>
      </div>

      <div className="insightsContainer">
        {activeTab === "placement-volume" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.internPlacementsOverTime} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.internsByProvince} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.placementsByRole} />
            </div>
          </>
        )}
        {activeTab === "sme-participation" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.smesByIndustrySector} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.placementsBySMERevenueBand} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.smesWithActiveInterns} />
            </div>
          </>
        )}
        {activeTab === "intern-performance" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgInternRatingByProgram} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.completionRateByRole} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.repeatPlacementRate} />
            </div>
          </>
        )}
        {activeTab === "compliance-tracking" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.internPerformanceReport} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.internsByStipendSource} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgTimeToPlaceIntern} />
            </div>
          </>
        )}
        {activeTab === "absorption-rate" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.absorptionRateByProgram} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.hiresByRoleType} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.absorptionBySMESize} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}