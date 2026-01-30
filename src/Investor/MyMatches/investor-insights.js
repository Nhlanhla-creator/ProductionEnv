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
import styles from "./investor-funding.module.css";

Chart.register(...registerables);

export function InvestorInsights() {
  const [activeTab, setActiveTab] = useState("investment-demand");
  const charts = useRef([]);

  // Mock data for demonstration
  const mockInsights = {
    successRate: 68,
    averageInvestmentAmount: 1800000,
    totalSMEs: 34,
    averageProcessingTime: 18,
    
    // Investment Demand
    topInvestmentTypes: {
      "Equity Investment": 95,
      "Growth Capital": 78,
      "Working Capital": 65,
      "Equipment Finance": 42,
      "Trade Finance": 28
    },
    investmentPurposeBreakdown: {
      "Business Expansion": 40,
      "Technology Upgrade": 25,
      "Market Entry": 18,
      "Working Capital": 12,
      "Equipment Purchase": 5
    },
    monthlyInvestments: [
      { month: "Jan", count: 8 },
      { month: "Feb", count: 12 },
      { month: "Mar", count: 10 },
      { month: "Apr", count: 15 },
      { month: "May", count: 13 },
      { month: "Jun", count: 18 }
    ],
    
    // Success & Access Trends
    successRatesByInvestmentType: {
      "Equity Investment": 75,
      "Growth Capital": 68,
      "Working Capital": 82,
      "Equipment Finance": 70,
      "Trade Finance": 85
    },
    investmentByLifecycle: {
      "Startup": 12,
      "Growth": 18,
      "Established": 15,
      "Mature": 8
    },
    
    // Sector-Level Investment
    investmentAllocationBySector: {
      "Technology": 45000000,
      "Healthcare": 32000000,
      "Manufacturing": 28000000,
      "Education": 22000000,
      "Agriculture": 18000000,
      "Tourism": 12000000
    },
    topInvestedSectors: [
      { name: "Technology", amount: 45000000 },
      { name: "Healthcare", amount: 32000000 },
      { name: "Manufacturing", amount: 28000000 },
      { name: "Education", amount: 22000000 },
      { name: "Agriculture", amount: 18000000 }
    ],
    avgDealSizeBySector: {
      "Technology": 2800000,
      "Healthcare": 2200000,
      "Manufacturing": 1950000,
      "Education": 1650000,
      "Agriculture": 1450000,
      "Tourism": 1200000
    },
    
    // Investment Engagement
    investmentTypeBreakdown: {
      "Equity Investment": 35,
      "Growth Capital": 25,
      "Working Capital": 20,
      "Equipment Finance": 15,
      "Trade Finance": 5
    },
    avgTimeMatchToInvestment: {
      "Technology": 14,
      "Healthcare": 18,
      "Manufacturing": 22,
      "Education": 16,
      "Agriculture": 25,
      "Tourism": 20
    },
    mostActiveInvestors: [
      { name: "TechVentures SA", investments: 15 },
      { name: "Growth Capital Partners", investments: 12 },
      { name: "SA Innovation Fund", investments: 10 },
      { name: "Impact Investors", investments: 8 },
      { name: "SME Capital", investments: 7 }
    ],
    
    // Success Trends Additional
    avgROIByInvestmentType: {
      "Equity Investment": 18.5,
      "Growth Capital": 22.3,
      "Working Capital": 12.7,
      "Equipment Finance": 15.2,
      "Trade Finance": 8.9
    },
    
    // Geography
    investmentVolumeByRegion: {
      "Gauteng": 65000000,
      "Western Cape": 48000000,
      "KwaZulu-Natal": 32000000,
      "Eastern Cape": 18000000,
      "Free State": 12000000,
      "Mpumalanga": 8000000
    },
    applicationsByRegion: {
      "Johannesburg": 28,
      "Cape Town": 22,
      "Durban": 15,
      "Port Elizabeth": 8,
      "Bloemfontein": 6,
      "Pretoria": 18
    },
    successRateByRegion: {
      "Gauteng": 75,
      "Western Cape": 72,
      "KwaZulu-Natal": 68,
      "Eastern Cape": 62,
      "Free State": 65,
      "Mpumalanga": 58
    }
  };

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
    successRateByRegion: useRef(null)
  };

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

  useEffect(() => {
    // Destroy existing charts
    charts.current.forEach(chart => chart.destroy());
    charts.current = [];

    const createChart = (ref, config) => {
      if (ref.current) {
        const ctx = ref.current.getContext("2d");
        if (ctx) {
          const chart = new Chart(ctx, config);
          charts.current.push(chart);
        }
      }
    };

    // Investment Demand Charts
    if (activeTab === "investment-demand") {
      // Top Investment Types - Horizontal Bar Chart
      createChart(chartRefs.topInvestmentTypes, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.topInvestmentTypes),
          datasets: [{
            label: "Investments",
            data: Object.values(mockInsights.topInvestmentTypes),
            backgroundColor: brownPalette.primary,
            borderColor: brownPalette.accent1,
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
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });

      // Investment Purpose Breakdown
      createChart(chartRefs.investmentPurposeBreakdown, {
        type: "doughnut",
        data: {
          labels: Object.keys(mockInsights.investmentPurposeBreakdown),
          datasets: [{
            data: Object.values(mockInsights.investmentPurposeBreakdown),
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
      });

      // Monthly Investments
      createChart(chartRefs.monthlyInvestments, {
        type: "line",
        data: {
          labels: mockInsights.monthlyInvestments.map(d => d.month),
          datasets: [{
            label: "Investments",
            data: mockInsights.monthlyInvestments.map(d => d.count),
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
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });
    }

    // Success & Access Trends Charts
    if (activeTab === "success-trends") {
      // Success Rates by Investment Type
      createChart(chartRefs.successRatesByType, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.successRatesByInvestmentType),
          datasets: [{
            label: "Success Rate (%)",
            data: Object.values(mockInsights.successRatesByInvestmentType),
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

      // Investment by Business Lifecycle
      createChart(chartRefs.investmentByLifecycle, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.investmentByLifecycle),
          datasets: [{
            label: "Number of Investments",
            data: Object.values(mockInsights.investmentByLifecycle),
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
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });

      // Average ROI by Investment Type
      createChart(chartRefs.avgROIByInvestmentType, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.avgROIByInvestmentType),
          datasets: [{
            label: "Average ROI (%)",
            data: Object.values(mockInsights.avgROIByInvestmentType),
            backgroundColor: brownPalette.tertiary,
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
                callback: function(value) { return value + '%'; }
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });
    }

    // Sector-Level Investment Charts
    if (activeTab === "sector-investment") {
      // Investment Allocation by Sector - Horizontal Bar Chart
      createChart(chartRefs.investmentAllocationBySector, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.investmentAllocationBySector),
          datasets: [{
            label: "Total Investment (ZAR)",
            data: Object.values(mockInsights.investmentAllocationBySector),
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

      // Average Deal Size by Sector
      createChart(chartRefs.avgDealSizeBySector, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.avgDealSizeBySector),
          datasets: [{
            label: "Average Deal Size (ZAR)",
            data: Object.values(mockInsights.avgDealSizeBySector),
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

    // Investment Engagement Charts
    if (activeTab === "investment-engagement") {
      createChart(chartRefs.investmentTypeBreakdown, {
        type: "doughnut",
        data: {
          labels: Object.keys(mockInsights.investmentTypeBreakdown),
          datasets: [{
            data: Object.values(mockInsights.investmentTypeBreakdown),
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
      });

      // Average Time from Match to Investment - Horizontal Bar Chart
      createChart(chartRefs.avgTimeMatchToInvestment, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.avgTimeMatchToInvestment),
          datasets: [{
            label: "Average Time (Days)",
            data: Object.values(mockInsights.avgTimeMatchToInvestment),
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
                callback: function(value) { return value + ' days'; }
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });
    }

    // Geography Charts
    if (activeTab === "geography") {
      // Investment Volume by Region - Horizontal Bar Chart
      createChart(chartRefs.investmentVolumeByRegion, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.investmentVolumeByRegion),
          datasets: [{
            label: "Investment Volume (ZAR)",
            data: Object.values(mockInsights.investmentVolumeByRegion),
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

      // Applications by Region
      createChart(chartRefs.applicationsByRegion, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.applicationsByRegion),
          datasets: [{
            label: "Number of Applications",
            data: Object.values(mockInsights.applicationsByRegion),
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
                maxRotation: 45
              },
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });

      // Success Rate by Region - Horizontal Bar Chart
      createChart(chartRefs.successRateByRegion, {
        type: "bar",
        data: {
          labels: Object.keys(mockInsights.successRateByRegion),
          datasets: [{
            label: "Success Rate (%)",
            data: Object.values(mockInsights.successRateByRegion),
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
    <div>
    

      <div className={styles.insightsSummary}>
        <div className={styles.insightCard}>
          <div className={styles.insightIcon}><TrendingUp size={18} /></div>
          <div className={styles.insightContent}>
            <h3>{mockInsights.successRate}%</h3>
            <p>Success Rate</p>
          </div>
        </div>
        <div className={styles.insightCard}>
          <div className={styles.insightIcon}><DollarSign size={18} /></div>
          <div className={styles.insightContent}>
            <h3>R{(mockInsights.averageInvestmentAmount / 1000000).toFixed(1)}M</h3>
            <p>Avg. Investment</p>
          </div>
        </div>
        <div className={styles.insightCard}>
          <div className={styles.insightIcon}><Users size={18} /></div>
          <div className={styles.insightContent}>
            <h3>{mockInsights.totalSMEs}</h3>
            <p>SMEs Funded</p>
          </div>
        </div>
        <div className={styles.insightCard}>
          <div className={styles.insightIcon}><Clock size={18} /></div>
          <div className={styles.insightContent}>
            <h3>{mockInsights.averageProcessingTime} days</h3>
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
                  {mockInsights.topInvestedSectors.slice(0, 3).map((sector, index) => (
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
                <h3>Top 3 Most Active Investors</h3>
                <div className={styles.leaderboardList}>
                  {mockInsights.mostActiveInvestors.slice(0, 3).map((investor, index) => (
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
  );
}