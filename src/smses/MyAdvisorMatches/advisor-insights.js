"use client";

import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { 
  BarChart, 
  PieChart, 
  LineChart, 
  TrendingUp, 
  Users, 
  Clock, 
  Award,
  Brain,
  Target,
  UserCheck,
  Settings
} from "lucide-react";
import "../MyFunderMatches/funding-insights.css";

Chart.register(...registerables);

// Helper function for deep comparison
function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

// Custom hook for deep comparison memoization
function useDeepCompareMemo(value) {
  const ref = useRef();
  
  if (!isEqual(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
}

export function AdvisorInsights() {
  const [activeTab, setActiveTab] = useState("governance-readiness");
  const charts = useRef([]);
  const prevActiveTab = useRef();

  // Comprehensive mock data for advisor insights
  const mockInsights = {
    connectionRate: 75,
    activeAdvisorsCount: 45,
    averageResponseTime: 3,
    averageSessionDuration: 45,
    
    // SME Governance Readiness
    smeWithAdvisorsBoards: {
      "Have Advisory Board": 35,
      "Have Advisors Only": 28,
      "Informal Advisors": 22,
      "No Governance": 15
    },
    avgBigScoreWithWithoutGovernance: {
      "With Governance": 78,
      "Without Governance": 52
    },
    governanceTypeDistribution: {
      "Advisory Board": 40,
      "Board of Directors": 25,
      "Interim Board": 20,
      "Formal Advisors": 15
    },
    
    // Advisor Supply & Demand
    mostRequestedSkills: {
      "Business Strategy": 145,
      "Marketing & Sales": 128,
      "Finance & Fundraising": 98,
      "Technology": 85,
      "Operations": 72,
      "Legal & Compliance": 54
    },
    advisorRequestsBySmeStage: {
      "Startup": { requested: 85, fulfilled: 45 },
      "Growth": { requested: 120, fulfilled: 78 },
      "Established": { requested: 95, fulfilled: 68 },
      "Mature": { requested: 65, fulfilled: 48 }
    },
    advisorRegionDistribution: {
      "Gauteng": 156,
      "Western Cape": 134,
      "KwaZulu-Natal": 89,
      "Eastern Cape": 45,
      "Free State": 34,
      "Mpumalanga": 28,
      "North West": 23,
      "Limpopo": 18,
      "Northern Cape": 12
    },
    
    // Matching & Engagement
    avgTimeToMatch: [
      { category: "Business Strategy", days: 5 },
      { category: "Finance", days: 7 },
      { category: "Marketing", days: 4 },
      { category: "Technology", days: 6 },
      { category: "Operations", days: 8 },
      { category: "Legal", days: 12 }
    ],
    appointmentSuccessRate: {
      "Successful Match": 68,
      "SME Declined": 18,
      "Advisor Declined": 14
    },
    topAdvisorCategoriesByConversion: {
      "Business Strategy": 78,
      "Marketing & Sales": 72,
      "Finance & Fundraising": 69,
      "Technology": 65,
      "Operations": 61,
      "Legal & Compliance": 58
    },
    
    // Governance Effectiveness
    scoreUpliftVsAdvisorFit: [
      { fitRating: 8.2, scoreUplift: 15 },
      { fitRating: 7.8, scoreUplift: 12 },
      { fitRating: 9.1, scoreUplift: 22 },
      { fitRating: 6.5, scoreUplift: 8 },
      { fitRating: 8.7, scoreUplift: 18 },
      { fitRating: 7.2, scoreUplift: 10 },
      { fitRating: 9.5, scoreUplift: 25 },
      { fitRating: 8.0, scoreUplift: 14 },
      { fitRating: 7.6, scoreUplift: 11 },
      { fitRating: 8.9, scoreUplift: 20 }
    ],
    advisorRetentionRate: [
      { month: "Jan", rate: 85 },
      { month: "Feb", rate: 87 },
      { month: "Mar", rate: 84 },
      { month: "Apr", rate: 89 },
      { month: "May", rate: 91 },
      { month: "Jun", rate: 88 }
    ],
    smesWithGovernanceBasedRejections: {
      "Lack of Structure": 45,
      "No Clear Vision": 38,
      "Poor Communication": 32,
      "Inadequate Resources": 28,
      "Timeline Issues": 22,
      "Cultural Mismatch": 18
    }
  };

  // Memoize the insights data
  const memoizedInsights = useDeepCompareMemo(mockInsights);

  // Chart refs for all categories
  const chartRefs = {
    smeWithAdvisorsBoards: useRef(null),
    avgBigScoreWithWithoutGovernance: useRef(null),
    governanceTypeDistribution: useRef(null),
    mostRequestedSkills: useRef(null),
    advisorRequestsBySmeStage: useRef(null),
    advisorRegionDistribution: useRef(null),
    avgTimeToMatch: useRef(null),
    appointmentSuccessRate: useRef(null),
    topAdvisorCategoriesByConversion: useRef(null),
    scoreUpliftVsAdvisorFit: useRef(null),
    advisorRetentionRate: useRef(null),
    smesWithGovernanceBasedRejections: useRef(null)
  };

  useEffect(() => {
    // Store current props for next comparison
    prevActiveTab.current = activeTab;

    // Destroy existing charts
    charts.current.forEach(chart => chart.destroy());
    charts.current = [];

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
    };

    const createChart = (ref, config) => {
      if (ref.current) {
        const ctx = ref.current.getContext("2d");
        if (ctx) {
          const chart = new Chart(ctx, config);
          charts.current.push(chart);
        }
      }
    };

    // SME Governance Readiness Charts
    if (activeTab === "governance-readiness") {
      // % SMEs With Advisors/Boards (Donut Chart)
      createChart(chartRefs.smeWithAdvisorsBoards, {
        type: "doughnut",
        data: {
          labels: Object.keys(memoizedInsights.smeWithAdvisorsBoards),
          datasets: [{
            data: Object.values(memoizedInsights.smeWithAdvisorsBoards),
            backgroundColor: [
              brownPalette.primary,
              brownPalette.secondary,
              brownPalette.tertiary,
              brownPalette.light,
            ],
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "% SMEs With Advisors/Boards",
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
      });

      // Avg. BIG Score With/Without Governance (Column Chart)
      createChart(chartRefs.avgBigScoreWithWithoutGovernance, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.avgBigScoreWithWithoutGovernance),
          datasets: [{
            label: "BIG Score",
            data: Object.values(memoizedInsights.avgBigScoreWithWithoutGovernance),
            backgroundColor: brownPalette.secondary,
            borderColor: brownPalette.primary,
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Avg. BIG Score With/Without Governance",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Governance Status",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter }
            },
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: "BIG Score",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });

      // Governance Type Distribution (Pie Chart)
      createChart(chartRefs.governanceTypeDistribution, {
        type: "pie",
        data: {
          labels: Object.keys(memoizedInsights.governanceTypeDistribution),
          datasets: [{
            data: Object.values(memoizedInsights.governanceTypeDistribution),
            backgroundColor: [
              brownPalette.primary,
              brownPalette.secondary,
              brownPalette.tertiary,
              brownPalette.light,
            ],
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Governance Type Distribution",
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
      });
    }

    // Advisor Supply & Demand Charts
    if (activeTab === "supply-demand") {
      // Most Requested Skills (Bar Chart)
      createChart(chartRefs.mostRequestedSkills, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.mostRequestedSkills),
          datasets: [{
            label: "Number of Requests",
            data: Object.values(memoizedInsights.mostRequestedSkills),
            backgroundColor: brownPalette.accent1,
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
              text: "Most Requested Skills",
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
                text: "Number of Requests",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              title: {
                display: true,
                text: "Skill Area",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });

      // Advisor Requests by SME Stage (Stacked Bar Chart)
      createChart(chartRefs.advisorRequestsBySmeStage, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.advisorRequestsBySmeStage),
          datasets: [
            {
              label: "Requested",
              data: Object.values(memoizedInsights.advisorRequestsBySmeStage).map(d => d.requested),
              backgroundColor: brownPalette.primary,
            },
            {
              label: "Fulfilled",
              data: Object.values(memoizedInsights.advisorRequestsBySmeStage).map(d => d.fulfilled),
              backgroundColor: brownPalette.lighter,
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
              text: "Advisor Requests by SME Stage",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: {
              position: "top",
              labels: {
                color: brownPalette.primary,
                font: { size: 10 }
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              beginAtZero: true,
              title: {
                display: true,
                text: "Requests",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              stacked: true,
              title: {
                display: true,
                text: "SME Stage",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });

      // Advisor Region Distribution (Column Chart)
      createChart(chartRefs.advisorRegionDistribution, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.advisorRegionDistribution),
          datasets: [{
            label: "Number of Advisors",
            data: Object.values(memoizedInsights.advisorRegionDistribution),
            backgroundColor: brownPalette.tertiary,
            borderColor: brownPalette.primary,
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Advisor Region Distribution",
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
                color: brownPalette.primary
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                maxRotation: 45
              },
              grid: { color: brownPalette.lighter }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Number of Advisors",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });
    }

    // Matching & Engagement Charts
    if (activeTab === "matching-engagement") {
      // Avg. Time to Match (Line Chart)
      createChart(chartRefs.avgTimeToMatch, {
        type: "line",
        data: {
          labels: memoizedInsights.avgTimeToMatch.map(d => d.category),
          datasets: [{
            label: "Time to Match (Days)",
            data: memoizedInsights.avgTimeToMatch.map(d => d.days),
            borderColor: brownPalette.primary,
            backgroundColor: brownPalette.lighter,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: brownPalette.primary,
            pointBorderColor: brownPalette.accent1,
            pointRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Avg. Time to Match",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Advisor Category",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Time to Match",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });

      // Appointment Success Rate (Donut Chart)
      createChart(chartRefs.appointmentSuccessRate, {
        type: "doughnut",
        data: {
          labels: Object.keys(memoizedInsights.appointmentSuccessRate),
          datasets: [{
            data: Object.values(memoizedInsights.appointmentSuccessRate),
            backgroundColor: [
              brownPalette.primary,
              brownPalette.secondary,
              brownPalette.tertiary,
            ],
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Appointment Success Rate",
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
      });

      // Top Advisor Categories by Conversion (Column Chart)
      createChart(chartRefs.topAdvisorCategoriesByConversion, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.topAdvisorCategoriesByConversion),
          datasets: [{
            label: "Conversion Rate (%)",
            data: Object.values(memoizedInsights.topAdvisorCategoriesByConversion),
            backgroundColor: brownPalette.light,
            borderColor: brownPalette.primary,
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Top Advisor Categories by Conversion",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Category",
                color: brownPalette.primary
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                maxRotation: 45
              },
              grid: { color: brownPalette.lighter }
            },
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: "Conversion Rate",
                color: brownPalette.primary
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                callback: function(value) { return value + '%'; }
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });
    }

    // Governance Effectiveness Charts
    if (activeTab === "governance-effectiveness") {
      // Score Uplift vs Advisor Fit (Scatter Plot)
      createChart(chartRefs.scoreUpliftVsAdvisorFit, {
        type: "scatter",
        data: {
          datasets: [{
            label: "Score Uplift vs Fit Rating",
            data: memoizedInsights.scoreUpliftVsAdvisorFit.map(d => ({
              x: d.fitRating,
              y: d.scoreUplift
            })),
            backgroundColor: brownPalette.primary,
            borderColor: brownPalette.accent1,
            pointRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Score Uplift vs Advisor Fit",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Fit Rating",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Score Uplift",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });

      // Advisor Retention Rate (Line Chart)
      createChart(chartRefs.advisorRetentionRate, {
        type: "line",
        data: {
          labels: memoizedInsights.advisorRetentionRate.map(d => d.month),
          datasets: [{
            label: "Retention Rate (%)",
            data: memoizedInsights.advisorRetentionRate.map(d => d.rate),
            borderColor: brownPalette.primary,
            backgroundColor: brownPalette.lighter,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: brownPalette.primary,
            pointBorderColor: brownPalette.accent1,
            pointRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Advisor Retention Rate",
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
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter }
            },
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: "Retention Rate",
                color: brownPalette.primary
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                callback: function(value) { return value + '%'; }
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });

      // SMEs with Governance-Based Rejections (Bar Chart)
      createChart(chartRefs.smesWithGovernanceBasedRejections, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.smesWithGovernanceBasedRejections),
          datasets: [{
            label: "Number of SMEs",
            data: Object.values(memoizedInsights.smesWithGovernanceBasedRejections),
            backgroundColor: brownPalette.accent2,
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
              text: "SMEs with Governance-Based Rejections",
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
                text: "Number of SMEs",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              title: {
                display: true,
                text: "Rejection Reason",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });
    }

    return () => {
      charts.current.forEach(chart => chart.destroy());
    };
  }, [activeTab, memoizedInsights]);

  return (
    <div className="fundingInsights">
    

      <div className="insightsSummary">
        <div className="insightCard">
          <div className="insightIcon"><TrendingUp size={18} /></div>
          <div className="insightContent">
            <h3>{memoizedInsights.connectionRate}%</h3>
            <p>Connection Rate</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon"><Users size={18} /></div>
          <div className="insightContent">
            <h3>{memoizedInsights.activeAdvisorsCount}</h3>
            <p>Available Advisors</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon"><Clock size={18} /></div>
          <div className="insightContent">
            <h3>{memoizedInsights.averageResponseTime} days</h3>
            <p>Avg. Response Time</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon"><Award size={18} /></div>
          <div className="insightContent">
            <h3>{memoizedInsights.averageSessionDuration} min</h3>
            <p>Session Duration</p>
          </div>
        </div>
      </div>

      <div className="insightsTabs">
        <div className="insightsTabHeader">
          <button
            className={`insightsTab ${activeTab === "governance-readiness" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("governance-readiness")}
          >
            <Brain size={12} /> <span>SME Governance Readiness</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "supply-demand" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("supply-demand")}
          >
            <Target size={12} /> <span>Advisor Supply & Demand</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "matching-engagement" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("matching-engagement")}
          >
            <UserCheck size={12} /> <span>Matching & Engagement</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "governance-effectiveness" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("governance-effectiveness")}
          >
            <Settings size={12} /> <span>Governance Effectiveness</span>
          </button>
        </div>
      </div>

      <div className="insightsContainer">
        {activeTab === "governance-readiness" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.smeWithAdvisorsBoards} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgBigScoreWithWithoutGovernance} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.governanceTypeDistribution} />
            </div>
          </>
        )}
        
        {activeTab === "supply-demand" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.mostRequestedSkills} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.advisorRequestsBySmeStage} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.advisorRegionDistribution} />
            </div>
          </>
        )}
        
        {activeTab === "matching-engagement" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgTimeToMatch} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.appointmentSuccessRate} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.topAdvisorCategoriesByConversion} />
            </div>
          </>
        )}
        
        {activeTab === "governance-effectiveness" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.scoreUpliftVsAdvisorFit} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.advisorRetentionRate} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.smesWithGovernanceBasedRejections} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}