"use client";

import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { 
  BarChart, 
  PieChart, 
  LineChart, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock,
  Rocket,
  Target,
  Award,
  Activity
} from "lucide-react";
import "../../smses/MyFunderMatches/funding-insights.css";


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

export function AcceleratorInsights() {
  const [activeTab, setActiveTab] = useState("program-types");
  const charts = useRef([]);
  const prevActiveTab = useRef();

  // Comprehensive mock data for accelerator insights
  const mockInsights = {
    matchRate: 72,
    averageFundingAmount: 250000,
    activeFundersCount: 18,
    averageProcessingTime: 45,
    
    // Program Types & Reach
    supportTypeBreakdown: {
      "Incubator": 35,
      "Accelerator": 28,
      "Mentorship": 22,
      "Funding Support": 15
    },
    activeProgramsByRegion: {
      "Gauteng": 25,
      "Western Cape": 18,
      "KwaZulu-Natal": 12,
      "Eastern Cape": 8,
      "Free State": 6,
      "Mpumalanga": 5,
      "North West": 4,
      "Limpopo": 3,
      "Northern Cape": 2
    },
    longestRunningPrograms: [
      { name: "LaunchLab Accelerator", duration: 8 },
      { name: "TechStars Cape Town", duration: 6 },
      { name: "Westbrooke Angels", duration: 5 },
 
    ],
    
    // Sector Focus
    programsBySector: {
      "Technology": 45,
      "Healthcare": 28,
      "Education": 22,
      "Agriculture": 18,
      "Manufacturing": 15,
      "Finance": 12
    },
    smeIndustryMatchDistribution: {
      "Technology": { matched: 85, unmatched: 25 },
      "Healthcare": { matched: 65, unmatched: 20 },
      "Education": { matched: 55, unmatched: 15 },
      "Agriculture": { matched: 45, unmatched: 18 },
      "Manufacturing": { matched: 38, unmatched: 22 },
      "Finance": { matched: 32, unmatched: 12 }
    },
    avgIntakeByIndustry: {
      "Technology": 45,
      "Healthcare": 32,
      "Education": 28,
      "Agriculture": 25,
      "Manufacturing": 22,
      "Finance": 18
    },
    
    // Outcomes & Effectiveness
    bigScoreBeforeAfterProgram: {
      "Before Program": 52,
      "After Program": 78
    },
    avgFundingSecuredAfterGraduation: {
      "Incubator": 180000,
      "Accelerator": 350000,
      "Mentorship": 120000,
      "Funding Support": 250000
    },
    completionRateByProgramType: [
      { type: "Incubator", rate: 85 },
      { type: "Accelerator", rate: 78 },
      { type: "Mentorship", rate: 92 },
      { type: "Funding Support", rate: 88 }
    ],
    
    // Engagement Patterns
    applicationVolumeOverTime: [
      { month: "Jan", applications: 45 },
      { month: "Feb", applications: 52 },
      { month: "Mar", applications: 48 },
      { month: "Apr", applications: 61 },
      { month: "May", applications: 58 },
      { month: "Jun", applications: 67 }
    ],
    avgTimeApplicationToAcceptance: {
      "Incubator": 21,
      "Accelerator": 28,
      "Mentorship": 14,
      "Funding Support": 35
    },
    rejectedVsAcceptedApplicants: {
      "Accepted": 35,
      "Rejected": 65
    }
  };

  // Memoize the insights data
  const memoizedInsights = useDeepCompareMemo(mockInsights);

  // Chart refs for all categories
  const chartRefs = {
    supportTypeBreakdown: useRef(null),
    activeProgramsByRegion: useRef(null),
    programsBySector: useRef(null),
    smeIndustryMatchDistribution: useRef(null),
    avgIntakeByIndustry: useRef(null),
    bigScoreBeforeAfterProgram: useRef(null),
    avgFundingSecuredAfterGraduation: useRef(null),
    completionRateByProgramType: useRef(null),
    applicationVolumeOverTime: useRef(null),
    avgTimeApplicationToAcceptance: useRef(null),
    rejectedVsAcceptedApplicants: useRef(null)
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

    // Program Types & Reach Charts
    if (activeTab === "program-types") {
      // Support Type Breakdown (Donut Chart)
      createChart(chartRefs.supportTypeBreakdown, {
        type: "doughnut",
        data: {
          labels: Object.keys(memoizedInsights.supportTypeBreakdown),
          datasets: [{
            data: Object.values(memoizedInsights.supportTypeBreakdown),
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
              text: "Support Type Breakdown",
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

      // Active Programs by Region (Column Chart)
      createChart(chartRefs.activeProgramsByRegion, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.activeProgramsByRegion),
          datasets: [{
            label: "Number of Programs",
            data: Object.values(memoizedInsights.activeProgramsByRegion),
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
              text: "Active Programs by Region",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Region",
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
                text: "Number of Programs",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });

      // Longest Running Programs (Leaderboard)
      // This will be displayed as a leaderboard component
    }

    // Sector Focus Charts
    if (activeTab === "sector-focus") {
      // Programs by Sector (Bar Chart)
      createChart(chartRefs.programsBySector, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.programsBySector),
          datasets: [{
            label: "Number of Programs",
            data: Object.values(memoizedInsights.programsBySector),
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
              text: "Programs by Sector",
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
                text: "Number of Programs",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              title: {
                display: true,
                text: "Sector",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });

      // SME Industry Match Distribution (Stacked Bar Chart)
      createChart(chartRefs.smeIndustryMatchDistribution, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.smeIndustryMatchDistribution),
          datasets: [
            {
              label: "Matched",
              data: Object.values(memoizedInsights.smeIndustryMatchDistribution).map(d => d.matched),
              backgroundColor: brownPalette.primary,
            },
            {
              label: "Unmatched",
              data: Object.values(memoizedInsights.smeIndustryMatchDistribution).map(d => d.unmatched),
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
              text: "SME Industry Match Distribution",
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
                text: "Match Count",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              stacked: true,
              title: {
                display: true,
                text: "Industry",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });

      // Avg. Intake by Industry (Column Chart)
      createChart(chartRefs.avgIntakeByIndustry, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.avgIntakeByIndustry),
          datasets: [{
            label: "Avg. No. of SMEs",
            data: Object.values(memoizedInsights.avgIntakeByIndustry),
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
              text: "Avg. Intake by Industry",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Industry",
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
                text: "Avg. No. of SMEs",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });
    }

    // Outcomes & Effectiveness Charts
    if (activeTab === "outcomes-effectiveness") {
      // BIG Score Before vs After Program (Dual Bar Chart)
      createChart(chartRefs.bigScoreBeforeAfterProgram, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.bigScoreBeforeAfterProgram),
          datasets: [{
            label: "Average BIG Score",
            data: Object.values(memoizedInsights.bigScoreBeforeAfterProgram),
            backgroundColor: [brownPalette.lighter, brownPalette.primary],
            borderColor: brownPalette.accent1,
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "BIG Score Before vs After Program",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Before/After",
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
                text: "Average BIG Score",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });

      // Avg. Funding Secured After Graduation (Column Chart)
      createChart(chartRefs.avgFundingSecuredAfterGraduation, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.avgFundingSecuredAfterGraduation),
          datasets: [{
            label: "Average Funding (ZAR)",
            data: Object.values(memoizedInsights.avgFundingSecuredAfterGraduation),
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
              text: "Avg. Funding Secured After Graduation",
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
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Average Funding",
                color: brownPalette.primary
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                callback: function(value) {
                  return 'R' + (value / 1000).toFixed(0) + 'K';
                }
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });

      // Completion Rate by Program Type (Line Chart)
      createChart(chartRefs.completionRateByProgramType, {
        type: "line",
        data: {
          labels: memoizedInsights.completionRateByProgramType.map(d => d.type),
          datasets: [{
            label: "Completion Rate (%)",
            data: memoizedInsights.completionRateByProgramType.map(d => d.rate),
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
              text: "Completion Rate by Program Type",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Program Type",
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
                text: "Completion Rate",
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

    // Engagement Patterns Charts
    if (activeTab === "engagement-patterns") {
      // Application Volume Over Time (Line Chart)
      createChart(chartRefs.applicationVolumeOverTime, {
        type: "line",
        data: {
          labels: memoizedInsights.applicationVolumeOverTime.map(d => d.month),
          datasets: [{
            label: "Applications",
            data: memoizedInsights.applicationVolumeOverTime.map(d => d.applications),
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
              text: "Application Volume Over Time",
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
              title: {
                display: true,
                text: "Applications",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });

      // Avg. Time from Application to Acceptance (Bar Chart)
      createChart(chartRefs.avgTimeApplicationToAcceptance, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.avgTimeApplicationToAcceptance),
          datasets: [{
            label: "Time to Acceptance (Days)",
            data: Object.values(memoizedInsights.avgTimeApplicationToAcceptance),
            backgroundColor: brownPalette.secondary,
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
              text: "Avg. Time from Application to Acceptance",
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
                text: "Time to Acceptance",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              title: {
                display: true,
                text: "Program",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });

      // Rejected vs Accepted Applicants (Donut Chart)
      createChart(chartRefs.rejectedVsAcceptedApplicants, {
        type: "doughnut",
        data: {
          labels: Object.keys(memoizedInsights.rejectedVsAcceptedApplicants),
          datasets: [{
            data: Object.values(memoizedInsights.rejectedVsAcceptedApplicants),
            backgroundColor: [
              brownPalette.primary,
              brownPalette.lighter,
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
              text: "Rejected vs Accepted Applicants",
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
            <h3>{memoizedInsights.matchRate}%</h3>
            <p>Match Rate</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon"><DollarSign size={18} /></div>
          <div className="insightContent">
            <h3>R{(memoizedInsights.averageFundingAmount / 1000).toFixed(0)}K</h3>
            <p>Avg. Funding</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon"><Users size={18} /></div>
          <div className="insightContent">
            <h3>{memoizedInsights.activeFundersCount}</h3>
            <p>Active Programs</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon"><Clock size={18} /></div>
          <div className="insightContent">
            <h3>{memoizedInsights.averageProcessingTime} days</h3>
            <p>Processing Time</p>
          </div>
        </div>
      </div>

      <div className="insightsTabs">
        <div className="insightsTabHeader">
          <button
            className={`insightsTab ${activeTab === "program-types" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("program-types")}
          >
            <Rocket size={12} /> <span>Program Types & Reach</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "sector-focus" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("sector-focus")}
          >
            <Target size={12} /> <span>Sector Focus</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "outcomes-effectiveness" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("outcomes-effectiveness")}
          >
            <Award size={12} /> <span>Outcomes & Effectiveness</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "engagement-patterns" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("engagement-patterns")}
          >
            <Activity size={12} /> <span>Engagement Patterns</span>
          </button>
        </div>
      </div>

      <div className="insightsContainer">
        {activeTab === "program-types" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.supportTypeBreakdown} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.activeProgramsByRegion} />
            </div>
            <div className="chartContainer leaderboardContainer">
              <div className="leaderboard">
                <h3>Top 3 Longest Running Programs</h3>
                <div className="leaderboardList">
                  {memoizedInsights.longestRunningPrograms.map((program, index) => (
                    <div key={index} className="leaderboardItem">
                      <span className="rank">#{index + 1}</span>
                      <span className="industry">{program.name}</span>
                      <span className="amount">{program.duration} years</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        
        {activeTab === "sector-focus" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.programsBySector} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.smeIndustryMatchDistribution} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgIntakeByIndustry} />
            </div>
          </>
        )}
        
        {activeTab === "outcomes-effectiveness" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.bigScoreBeforeAfterProgram} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgFundingSecuredAfterGraduation} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.completionRateByProgramType} />
            </div>
          </>
        )}
        
        {activeTab === "engagement-patterns" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.applicationVolumeOverTime} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgTimeApplicationToAcceptance} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.rejectedVsAcceptedApplicants} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}