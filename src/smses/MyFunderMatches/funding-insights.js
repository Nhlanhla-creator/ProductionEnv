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
  Building2,
  MapPin,
  Target,
  Award
} from "lucide-react";
import "./funding-insights.css";

Chart.register(...registerables);

export function FundingInsights() {
  const [activeTab, setActiveTab] = useState("sme-demand");
  const charts = useRef([]);

  // Mock data for demonstration
  const mockInsights = {
    matchRate: 75,
    averageFundingAmount: 2500000,
    activeFundersCount: 45,
    averageProcessingTime: 21,
    
    // SME Funding Demand
    topFundTypes: {
      "Growth Capital": 120,
      "Working Capital": 95,
      "Equipment Finance": 68,
      "Property Finance": 45,
      "Trade Finance": 32
    },
    fundingPurposeBreakdown: {
      "Business Expansion": 35,
      "Equipment Purchase": 25,
      "Working Capital": 20,
      "Property Investment": 12,
      "Inventory": 8
    },
    monthlyFundingApplications: [
      { month: "Jan", count: 45 },
      { month: "Feb", count: 52 },
      { month: "Mar", count: 48 },
      { month: "Apr", count: 61 },
      { month: "May", count: 58 },
      { month: "Jun", count: 67 }
    ],
    
    // Approval & Access Trends
    approvalRatesByFundType: {
      "Growth Capital": 68,
      "Working Capital": 72,
      "Equipment Finance": 78,
      "Property Finance": 65,
      "Trade Finance": 82
    },
    averageTimeToDisbursement: {
      "Growth Capital": 35,
      "Working Capital": 21,
      "Equipment Finance": 28,
      "Property Finance": 42,
      "Trade Finance": 18
    },
    smeMatchRateByLifecycle: {
      "Startup": { matched: 45, notMatched: 55 },
      "Growth": { matched: 72, notMatched: 28 },
      "Established": { matched: 68, notMatched: 32 },
      "Mature": { matched: 58, notMatched: 42 }
    },
    
    // Sector-Level Funding
    fundingAllocationByIndustry: {
      "Technology": 450000000,
      "Manufacturing": 380000000,
      "Healthcare": 320000000,
      "Education": 280000000,
      "Agriculture": 220000000,
      "Tourism": 180000000
    },
    topFundedIndustries: [
      { name: "Technology", amount: 450000000 },
      { name: "Manufacturing", amount: 380000000 },
      { name: "Healthcare", amount: 320000000 },
      { name: "Education", amount: 280000000 },
      { name: "Agriculture", amount: 220000000 }
    ],
    avgDealSizeByIndustry: {
      "Technology": 2800000,
      "Manufacturing": 1950000,
      "Healthcare": 2200000,
      "Education": 1650000,
      "Agriculture": 1450000,
      "Tourism": 1200000
    },
    
    // Funder Engagement
    mostActiveFunders: [
      { name: "IDC", matches: 89 },
      { name: "SEDA", matches: 76 },
      { name: "NEF", matches: 68 },
      { name: "NYDA", matches: 54 },
      { name: "SAMSA", matches: 43 }
    ],
    avgTimeMatchToContact: {
      "Government": 12,
      "Private Equity": 8,
      "Development Finance": 15,
      "Commercial Bank": 6,
      "Impact Investor": 10
    },
    funderTypeBreakdown: {
      "Government": 35,
      "Private Equity": 25,
      "Development Finance": 20,
      "Commercial Bank": 15,
      "Impact Investor": 5
    },
    
    // Geography
    fundingVolumeByProvince: {
      "Gauteng": 850000000,
      "Western Cape": 620000000,
      "KwaZulu-Natal": 480000000,
      "Eastern Cape": 320000000,
      "Free State": 180000000,
      "Mpumalanga": 150000000,
      "North West": 120000000,
      "Limpopo": 110000000,
      "Northern Cape": 80000000
    },
    fundingApplicationsByRegion: {
      "Johannesburg": 245,
      "Cape Town": 198,
      "Durban": 156,
      "Port Elizabeth": 89,
      "Bloemfontein": 67,
      "Pretoria": 234,
      "East London": 45,
      "Polokwane": 34
    },
    approvalRateByRegion: {
      "Gauteng": 72,
      "Western Cape": 68,
      "KwaZulu-Natal": 65,
      "Eastern Cape": 58,
      "Free State": 62,
      "Mpumalanga": 55,
      "North West": 51,
      "Limpopo": 48,
      "Northern Cape": 45
    }
  };

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
    approvalRateByRegion: useRef(null)
  };

  useEffect(() => {
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

    // SME Funding Demand Charts
    if (activeTab === "sme-demand") {
      // Top Fund Types Requested - Horizontal Bar Chart
      createChart(chartRefs.topFundTypes, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.topFundTypes),
          datasets: [{
            label: "Applications",
            data: Object.values(mockInsights.topFundTypes),
            backgroundColor: brownPalette.primary,
            borderColor: brownPalette.accent1,
            borderWidth: 1,
          }],
        },
        options: {
          indexAxis: "y", // This makes it horizontal
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
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });

      createChart(chartRefs.fundingPurposeBreakdown, {
        type: "doughnut",
        data: {
          labels: Object.keys(mockInsights.fundingPurposeBreakdown),
          datasets: [{
            data: Object.values(mockInsights.fundingPurposeBreakdown),
            backgroundColor: [
              brownPalette.primary,
              brownPalette.secondary,
              brownPalette.tertiary,
              brownPalette.light,
              brownPalette.accent1,
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
      });

      createChart(chartRefs.monthlyFundingApplications, {
        type: "line",
        data: {
          labels: mockInsights.monthlyFundingApplications.map(d => d.month),
          datasets: [{
            label: "Applications",
            data: mockInsights.monthlyFundingApplications.map(d => d.count),
            borderColor: brownPalette.primary,
            backgroundColor: brownPalette.lighter,
            tension: 0.4,
            fill: true,
            pointRadius: 3,
          }],
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
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });
    }

    // Approval & Access Trends Charts
    if (activeTab === "approval-trends") {
      createChart(chartRefs.approvalRatesByFundType, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.approvalRatesByFundType),
          datasets: [{
            label: "Approval Rate (%)",
            data: Object.values(mockInsights.approvalRatesByFundType),
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
                callback: function(value) { return value + '%'; }
              },
              grid: { color: brownPalette.lighter },
            },
            x: {
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });

      // Average Time to Disbursement - Horizontal Bar Chart
      createChart(chartRefs.averageTimeToDisbursement, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.averageTimeToDisbursement),
          datasets: [{
            label: "Days",
            data: Object.values(mockInsights.averageTimeToDisbursement),
            backgroundColor: brownPalette.tertiary,
            borderColor: brownPalette.primary,
            borderWidth: 1,
          }],
        },
        options: {
          indexAxis: "y", // This makes it horizontal
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
      });

      createChart(chartRefs.smeMatchRateByLifecycle, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.smeMatchRateByLifecycle),
          datasets: [
            {
              label: "Matched",
              data: Object.values(mockInsights.smeMatchRateByLifecycle).map(d => d.matched),
              backgroundColor: brownPalette.primary,
            },
            {
              label: "Not Matched",
              data: Object.values(mockInsights.smeMatchRateByLifecycle).map(d => d.notMatched),
              backgroundColor: brownPalette.lighter,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "SME Match Rate by Lifecycle Stage",
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
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter }
            },
            y: {
              stacked: true,
              beginAtZero: true,
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

    // Sector-Level Funding Charts
    if (activeTab === "sector-funding") {
      // Funding Allocation by Industry - Horizontal Bar Chart
      createChart(chartRefs.fundingAllocationByIndustry, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.fundingAllocationByIndustry),
          datasets: [{
            label: "Total Funding (ZAR)",
            data: Object.values(mockInsights.fundingAllocationByIndustry),
            backgroundColor: brownPalette.accent1,
            borderColor: brownPalette.primary,
            borderWidth: 1,
          }],
        },
        options: {
          indexAxis: "y", // This makes it horizontal
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Funding Allocation by Industry",
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
                callback: function(value) {
                  return 'R' + (value / 1000000).toFixed(0) + 'M';
                }
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
              },
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });

      createChart(chartRefs.avgDealSizeByIndustry, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.avgDealSizeByIndustry),
          datasets: [{
            label: "Average Deal Size (ZAR)",
            data: Object.values(mockInsights.avgDealSizeByIndustry),
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
              text: "Average Deal Size by Industry",
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
                callback: function(value) {
                  return 'R' + (value / 1000).toFixed(0) + 'K';
                }
              },
              grid: { color: brownPalette.lighter },
            },
            x: {
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                maxRotation: 45
              },
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });
    }

    // Funder Engagement Charts
    if (activeTab === "funder-engagement") {
      // Avg. Time from Match to First Contact - Horizontal Bar Chart
      createChart(chartRefs.avgTimeMatchToContact, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.avgTimeMatchToContact),
          datasets: [{
            label: "Average Time (Days)",
            data: Object.values(mockInsights.avgTimeMatchToContact),
            backgroundColor: brownPalette.secondary,
            borderColor: brownPalette.primary,
            borderWidth: 1,
          }],
        },
        options: {
          indexAxis: "y", // This makes it horizontal
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Average Time from Match to First Contact",
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
      });

      createChart(chartRefs.funderTypeBreakdown, {
        type: "doughnut",
        data: {
          labels: Object.keys(mockInsights.funderTypeBreakdown),
          datasets: [{
            data: Object.values(mockInsights.funderTypeBreakdown),
            backgroundColor: [
              brownPalette.primary,
              brownPalette.secondary,
              brownPalette.tertiary,
              brownPalette.light,
              brownPalette.accent1,
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
      });
    }

    // Geography Charts
    if (activeTab === "geography") {
      // Funding Volume by Province - Horizontal Bar Chart
      createChart(chartRefs.fundingVolumeByProvince, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.fundingVolumeByProvince),
          datasets: [{
            label: "Funding Volume (ZAR)",
            data: Object.values(mockInsights.fundingVolumeByProvince),
            backgroundColor: brownPalette.secondary,
            borderColor: brownPalette.primary,
            borderWidth: 1,
          }],
        },
        options: {
          indexAxis: "y", // This makes it horizontal
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
                callback: function(value) {
                  return 'R' + (value / 1000000).toFixed(0) + 'M';
                }
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
              },
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });

      createChart(chartRefs.fundingApplicationsByRegion, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.fundingApplicationsByRegion),
          datasets: [{
            label: "Number of Applications",
            data: Object.values(mockInsights.fundingApplicationsByRegion),
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
              text: "Funding Applications by Region",
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
                maxRotation: 45
              },
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });

      // Approval Rate by Region - Horizontal Bar Chart
      createChart(chartRefs.approvalRateByRegion, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.approvalRateByRegion),
          datasets: [{
            label: "Approval Rate (%)",
            data: Object.values(mockInsights.approvalRateByRegion),
            backgroundColor: brownPalette.accent2,
            borderColor: brownPalette.primary,
            borderWidth: 1,
          }],
        },
        options: {
          indexAxis: "y", // This makes it horizontal
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
            x: {
              beginAtZero: true,
              max: 100,
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                callback: function(value) { return value + '%'; }
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
              },
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });
    }

    return () => {
      charts.current.forEach(chart => chart.destroy());
    };
  }, [activeTab]);

  return (
    <div className="fundingInsights">
     

      <div className="insightsSummary">
        <div className="insightCard">
          <div className="insightIcon"><TrendingUp size={18} /></div>
          <div className="insightContent">
            <h3>{mockInsights.matchRate}%</h3>
            <p>Match Rate</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon"><DollarSign size={18} /></div>
          <div className="insightContent">
            <h3>R{(mockInsights.averageFundingAmount / 1000000).toFixed(1)}M</h3>
            <p>Avg. Funding</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon"><Users size={18} /></div>
          <div className="insightContent">
            <h3>{mockInsights.activeFundersCount}</h3>
            <p>Active Funders</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon"><Clock size={18} /></div>
          <div className="insightContent">
            <h3>{mockInsights.averageProcessingTime} days</h3>
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
                  {mockInsights.topFundedIndustries.slice(0, 3).map((industry, index) => (
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
                  {mockInsights.mostActiveFunders.slice(0, 3).map((funder, index) => (
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
  );
}