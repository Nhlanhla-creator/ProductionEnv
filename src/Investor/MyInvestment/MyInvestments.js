import React, { useState, useEffect, useRef } from 'react';
import { Bar, Pie, Line, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler
} from 'chart.js';
import {
  FiPieChart,
  FiDollarSign,
  FiUsers,
  FiAlertTriangle,
  FiMap,
  FiTrendingUp,
  FiEye,
  FiPieChart as FiComposition,
  FiBarChart2,
  FiGlobe,
  FiTarget,
  FiDollarSign as FiLiquidity,
  FiHeart,
  FiActivity,
  FiShield,
  FiClock,
  FiCheckCircle,
  FiArrowUp,
  FiArrowDown,
  FiCalendar,
  FiDownload,
  FiTrendingUp as FiTrendingUpIcon,
  FiInfo,
  FiX
} from 'react-icons/fi';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MyInvestments.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler
);

// Sample South Africa GeoJSON data
const southAfricaGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Gauteng", value: 35 },
      geometry: { 
        type: "Polygon", 
        coordinates: [[
          [27.5, -26.5], [28.5, -26.5], [28.5, -25.5],
          [27.5, -25.5], [27.5, -26.5]
        ]] 
      }
    },
    {
      type: "Feature",
      properties: { name: "Western Cape", value: 25 },
      geometry: { 
        type: "Polygon", 
        coordinates: [[
          [18.0, -34.5], [19.5, -34.5], [19.5, -32.0],
          [18.0, -32.0], [18.0, -34.5]
        ]] 
      }
    },
    {
      type: "Feature",
      properties: { name: "KwaZulu-Natal", value: 15 },
      geometry: { 
        type: "Polygon", 
        coordinates: [[
          [29.0, -31.0], [31.5, -31.0], [31.5, -27.0],
          [29.0, -27.0], [29.0, -31.0]
        ]] 
      }
    },
    {
      type: "Feature",
      properties: { name: "Eastern Cape", value: 10 },
      geometry: { 
        type: "Polygon", 
        coordinates: [[
          [24.0, -34.0], [27.5, -34.0], [27.5, -30.5],
          [24.0, -30.5], [24.0, -34.0]
        ]] 
      }
    },
    {
      type: "Feature",
      properties: { name: "Other", value: 15 },
      geometry: { 
        type: "Polygon", 
        coordinates: [[
          [22.0, -30.0], [25.0, -30.0], [25.0, -27.0],
          [22.0, -27.0], [22.0, -30.0]
        ]] 
      }
    }
  ]
};

const brownShades = [
  '#5e3f26', '#7d5a36', '#9c7c54', '#b8a082',
  '#3f2a18', '#d4c4b0', '#5D4037', '#3E2723'
];

// COMPLETELY STATIC chart options - NO ANIMATIONS WHATSOEVER
const staticChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  animations: {
    colors: false,
    x: false,
    y: false
  },
  transitions: {
    active: {
      animation: {
        duration: 0
      }
    }
  },
  responsiveAnimationDuration: 0,
  animationDuration: 0,
  hover: {
    animationDuration: 0
  },
  plugins: {
    legend: {
      display: true,
      labels: {
        usePointStyle: false,
        pointStyle: 'line',
        boxWidth: 15,
        boxHeight: 2,
      }
    },
    tooltip: {
      enabled: true,
      animation: false,
      transitions: {
        active: {
          animation: {
            duration: 0
          }
        }
      }
    }
  },
  elements: {
    line: {
      tension: 0
    },
    point: {
      radius: 3,
      hoverRadius: 3
    },
    arc: {
      hoverOffset: 0
    }
  }
};

// Static options for specific chart types
const staticPieOptions = {
  ...staticChartOptions,
  plugins: {
    ...staticChartOptions.plugins,
    legend: {
      position: 'bottom'
    }
  }
};

const staticBarOptions = {
  ...staticChartOptions,
  scales: {
    x: {
      grid: {
        display: false
      },
      title: {
        display: false
      },
      ticks: {
        display: true
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        drawBorder: false
      },
      title: {
        display: false
      },
      ticks: {
        display: true
      }
    }
  }
};

const staticLineOptions = {
  ...staticChartOptions,
  elements: {
    line: {
      tension: 0
    },
    point: {
      radius: 3,
      hoverRadius: 3
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      title: {
        display: false
      },
      ticks: {
        display: true
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        drawBorder: false
      },
      title: {
        display: false
      },
      ticks: {
        display: true
      }
    }
  }
};

const MyInvestments = () => {
  const [activeCategory, setActiveCategory] = useState('Portfolio Overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [timeToFundView, setTimeToFundView] = useState('Quarterly');
  const [timeToExitView, setTimeToExitView] = useState('Quarterly');
  const [vettingTimeView, setVettingTimeView] = useState('Monthly');
  const [portfolioTrendView, setPortfolioTrendView] = useState('Quarterly');
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [popupContent, setPopupContent] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [hoveredChart, setHoveredChart] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"));
    };

    checkSidebarState();

    const observer = new MutationObserver(checkSidebarState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Popup functionality
  const openPopup = (content) => {
    setPopupContent(content);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupContent(null);
  };

  // Download functionality
  const downloadSectionAsPDF = async (sectionName = 'all') => {
    try {
      const originalCategory = activeCategory;
      
      if (sectionName === 'all') {
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        let currentPage = 1;
        
        for (const category of allCategories) {
          setActiveCategory(category);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const element = document.querySelector('.section-content');
          if (!element) continue;

          const canvas = await html2canvas(element, {
            scale: 1.5,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            scrollY: -window.scrollY,
            height: element.scrollHeight,
            windowHeight: element.scrollHeight
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pdf.internal.pageSize.getWidth() - 20;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          if (currentPage > 1) {
            pdf.addPage();
          }
          
          pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
          currentPage++;
        }
        
        setActiveCategory(originalCategory);
        pdf.save('MyInvestments_Complete_Report.pdf');
      } else {
        setActiveCategory(sectionName);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const element = document.querySelector('.section-content');
        if (!element) return;

        const canvas = await html2canvas(element, {
          scale: 1.5,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          scrollY: -window.scrollY,
          height: element.scrollHeight,
          windowHeight: element.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        const imgWidth = pdf.internal.pageSize.getWidth() - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        
        const fileName = `MyInvestments_${sectionName.replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);
        
        setActiveCategory(originalCategory);
      }
      setShowDownloadOptions(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Time view data generators
  const getTimeData = (view, monthlyData, quarterlyData, yearlyData) => {
    switch (view) {
      case 'Monthly':
        return monthlyData;
      case 'Quarterly':
        return quarterlyData;
      case 'Yearly':
        return yearlyData;
      default:
        return quarterlyData;
    }
  };

  const timeToFundData = {
    Monthly: [35, 34, 33, 32, 32, 31],
    Quarterly: [35, 33, 32, 32],
    Yearly: [36, 34, 32, 30]
  };

  const timeToExitData = {
    Monthly: [34, 33, 32, 31, 31, 30],
    Quarterly: [34, 32, 31, 30],
    Yearly: [35, 33, 31, 29]
  };

  const vettingTimeData = {
    Monthly: [12, 11, 10, 9, 9, 9],
    Quarterly: [11, 10, 9, 9],
    Yearly: [12, 11, 10, 9]
  };

  const portfolioTrendData = {
    Monthly: [4.5, 4.3, 4.1, 4.2, 4.0, 3.9],
    Quarterly: [4.5, 4.1, 4.2, 4.0],
    Yearly: [4.8, 4.3, 4.1, 3.8]
  };

  // Chart descriptions for hover tooltips
  const chartDescriptions = {
    'total-portfolio-value': 'Quarterly portfolio value trend showing growth over time',
    'funding-facilitated': 'Monthly funding distribution across different periods',
    'applications-reviewed': 'Funnel showing applications reviewed vs approved vs funded',
    'industry-sector': 'Sector diversification across different industries',
    'funding-instrument': 'Allocation by different funding instruments',
    'exit-repayment-history': 'Historical exit and repayment trends',
    'exit-multiple': 'Return multiples for exited equity deals',
    'default-ratio': 'Default and non-performing ratio trends',
    'job-creation': 'Job creation and retention by sector',
    'esg-pillar': 'Environmental, Social, and Governance pillar scores',
    'sdg-alignment': 'Sustainable Development Goal alignment percentages',
    'pipeline-aging': 'Age distribution of pipeline deals',
    'capital-requirement': 'Forecasted capital requirements by quarter',
    'active-partnerships': 'Active partnerships and co-funders activity',
    'vetting-time': 'Average vetting time efficiency metrics',
    'sme-growth-index': 'SME revenue growth vs benchmark comparison',
    'graduation-rate': 'SME graduation rate to bankable status',
    'diversity-inclusion': 'Diversity and inclusion performance metrics',
    'lifecycle-stage': 'Portfolio distribution by business lifecycle stages',
    'demographic-ownership': 'Demographic and ownership diversity breakdown',
    'reinvestment-ratio': 'Capital reinvestment vs holding ratios',
    'governance-compliance': 'Governance compliance health status',
    'active-smes': 'Distribution of active SMEs across different stages',
    'follow-on-funding': 'Follow-on funding rates over quarters',
    'time-to-fund': 'Average time to fund deals vs target',
    'exit-repayment': 'Exit and repayment ratio performance',
    'data-confidence': 'Data verification and confidence levels'
  };

  // Custom Pie Chart with Numbers ALWAYS visible - COMPLETELY STATIC
  const PieChartWithNumbers = ({ data, labels, title, showEye = false, chartId }) => {
    const chartData = {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: brownShades.slice(0, data.length),
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 0
        }
      ]
    };

    const options = {
      ...staticPieOptions,
      plugins: {
        ...staticPieOptions.plugins,
        tooltip: {
          enabled: true,
          animation: false
        }
      }
    };

    const plugins = [{
      id: 'centerText',
      afterDraw: (chart) => {
        const ctx = chart.ctx;
        const { chartArea: { left, right, top, bottom, width, height } } = chart;
        
        chart.data.datasets.forEach((dataset, i) => {
          chart.getDatasetMeta(i).data.forEach((arc, index) => {
            const { x, y } = arc.tooltipPosition();
            
            ctx.save();
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dataset.data[index], x, y);
            ctx.restore();
          });
        });
      }
    }];

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-chart">
            <Doughnut data={chartData} options={options} plugins={plugins} />
          </div>
          <div className="popup-details">
            {labels.map((label, index) => (
              <div key={label} className="detail-item">
                <span className="detail-label">{label}:</span>
                <span className="detail-value">{data[index]}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div 
        className="chart-container"
        onMouseEnter={() => setHoveredChart(chartId)}
        onMouseLeave={() => setHoveredChart(null)}
      >
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          {showEye && (
            <button 
              className="breakdown-icon-btn"
              onClick={handleEyeClick}
              title="View breakdown"
            >
              <FiEye />
            </button>
          )}
        </div>
        {hoveredChart === chartId && (
          <div className="visual-description">
            {chartDescriptions[chartId] || 'Chart visualization'}
          </div>
        )}
        <div className="chart-area">
          <Doughnut data={chartData} options={options} plugins={plugins} id={chartId} />
        </div>
      </div>
    );
  };

  // Active SMEs Pie Chart Component - STATIC
  const ActiveSMEsPieChart = ({ title }) => {
    const data = {
      labels: ['Early Stage', 'Growth Stage', 'Mature Stage', 'Exit-ready'],
      datasets: [
        {
          data: [28, 45, 35, 20],
          backgroundColor: [
            brownShades[0],
            brownShades[1],
            brownShades[2],
            brownShades[3]
          ],
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 0
        }
      ]
    };

    const options = {
      ...staticPieOptions,
      plugins: {
        ...staticPieOptions.plugins,
        tooltip: {
          enabled: true,
          animation: false
        }
      }
    };

    const plugins = [{
      id: 'centerText',
      afterDraw: (chart) => {
        const ctx = chart.ctx;
        const { chartArea: { left, right, top, bottom, width, height } } = chart;
        
        chart.data.datasets.forEach((dataset, i) => {
          chart.getDatasetMeta(i).data.forEach((arc, index) => {
            const { x, y } = arc.tooltipPosition();
            
            ctx.save();
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dataset.data[index], x, y);
            ctx.restore();
          });
        });
      }
    }];

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>SME Breakdown</h3>
          <div className="popup-chart">
            <Pie data={data} options={options} plugins={plugins} />
          </div>
          <div className="popup-details">
            <div className="detail-item">
              <span className="detail-label">Early Stage:</span>
              <span className="detail-value">28 SMEs (22%)</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Growth Stage:</span>
              <span className="detail-value">45 SMEs (35%)</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Mature Stage:</span>
              <span className="detail-value">35 SMEs (27%)</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Exit-ready:</span>
              <span className="detail-value">20 SMEs (16%)</span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div 
        className="chart-container"
        onMouseEnter={() => setHoveredChart('active-smes')}
        onMouseLeave={() => setHoveredChart(null)}
      >
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button 
            className="breakdown-icon-btn"
            onClick={handleEyeClick}
            title="View breakdown"
          >
            <FiEye />
          </button>
        </div>
        {hoveredChart === 'active-smes' && (
          <div className="visual-description">
            {chartDescriptions['active-smes']}
          </div>
        )}
        <div className="chart-area">
          <Pie data={data} options={options} plugins={plugins} id="active-smes" />
        </div>
      </div>
    );
  };

  // BIG Score Infographic Component - SIMPLIFIED
  const BIGScoreInfographic = ({ value, target, title }) => {
    const handleEyeClick = () => {
      const scoreComponents = [
        { name: 'Compliance Score', value: 82, color: brownShades[0] },
        { name: 'Legitimacy Score', value: 76, color: brownShades[1] },
        { name: 'Leadership Score', value: 85, color: brownShades[2] },
        { name: 'Governance Score', value: 79, color: brownShades[3] },
        { name: 'Capital Appeal Score', value: 70, color: brownShades[4] }
      ];

      openPopup(
        <div className="popup-content">
          <h3>BIG Score Breakdown</h3>
          <div className="big-score-popup">
            <div className="big-score-main-popup">
              <div className="big-score-value">{value}</div>
              <div className="big-score-label">Overall BIG Score</div>
              <div className="big-score-target">Target: {target}</div>
            </div>
            
            <div className="big-score-components-popup">
              {scoreComponents.map((component, index) => (
                <div key={component.name} className="score-component-popup">
                  <div className="component-header-popup">
                    <span className="component-name">{component.name}</span>
                    <span className="component-value">{component.value}</span>
                  </div>
                  <div className="component-bar-popup">
                    <div 
                      className="component-progress-popup"
                      style={{
                        width: `${component.value}%`,
                        backgroundColor: component.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div 
        className="chart-container"
        onMouseEnter={() => setHoveredChart('big-score')}
        onMouseLeave={() => setHoveredChart(null)}
      >
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button 
            className="breakdown-icon-btn"
            onClick={handleEyeClick}
            title="View breakdown"
          >
            <FiEye />
          </button>
        </div>
        {hoveredChart === 'big-score' && (
          <div className="visual-description">
            Detailed breakdown of BIG Score components across compliance, legitimacy, leadership, governance, and capital appeal
          </div>
        )}
        
        <div className="big-score-simple">
          <div className="big-score-main-simple">
            <div className="big-score-value-simple">{value}</div>
            <div className="big-score-label-simple">Overall BIG Score</div>
            <div className="big-score-target-simple">Target: {target}</div>
          </div>
        </div>
        
        <div className="chart-summary-compact">
          <div className="current-value">Average: {value}/100</div>
          <div className="target-value">
            Target: {target}/100
            {value >= target ? (
              <FiArrowUp className="trend-icon up" />
            ) : (
              <FiArrowDown className="trend-icon down" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Funding Ready Infographic - SIMPLIFIED
  const EnhancedFundingReady = ({ value, target, title }) => {
    const handleEyeClick = () => {
      const readinessData = [
        { stage: 'Fully Ready', count: 59, percentage: 46, color: '#4CAF50' },
        { stage: 'Near Ready', count: 32, percentage: 25, color: '#FF9800' },
        { stage: 'Developing', count: 25, percentage: 20, color: '#FFC107' },
        { stage: 'Early Stage', count: 12, percentage: 9, color: '#F44336' }
      ];

      openPopup(
        <div className="popup-content">
          <h3>Funding Ready Breakdown</h3>
          <div className="funding-ready-popup">
            <div className="readiness-main-popup">
              <div className="readiness-value">{value}%</div>
              <div className="readiness-label">Funding Ready</div>
              <div className="readiness-target">Target: {target}%</div>
            </div>
            
            <div className="readiness-breakdown-popup">
              {readinessData.map((item, index) => (
                <div key={item.stage} className="readiness-item-popup">
                  <div className="readiness-stage-popup">
                    <div 
                      className="stage-color-popup"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="stage-name-popup">{item.stage}</span>
                  </div>
                  <div className="readiness-stats-popup">
                    <span className="stage-count-popup">{item.count} SMEs</span>
                    <span className="stage-percentage-popup">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div 
        className="chart-container"
        onMouseEnter={() => setHoveredChart('funding-ready')}
        onMouseLeave={() => setHoveredChart(null)}
      >
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button 
            className="breakdown-icon-btn"
            onClick={handleEyeClick}
            title="View breakdown"
          >
            <FiEye />
          </button>
        </div>
        {hoveredChart === 'funding-ready' && (
          <div className="visual-description">
            Shows readiness ratio with detailed breakdown across fully ready, near ready, developing, and early stage SMEs
          </div>
        )}
        
        <div className="funding-ready-simple">
          <div className="readiness-main-simple">
            <div className="readiness-value-simple">{value}%</div>
            <div className="readiness-label-simple">Funding Ready</div>
            <div className="readiness-target-simple">Target: {target}%</div>
          </div>
        </div>
        
        <div className="chart-summary-compact">
          <div className="current-value">Current: {value}%</div>
          <div className="target-value">
            Target: {target}%
            {value >= target ? (
              <FiArrowUp className="trend-icon up" />
            ) : (
              <FiArrowDown className="trend-icon down" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // SME Graduation Infographic - SIMPLIFIED
  const SMEGraduationInfographic = ({ value, target, title }) => {
    const handleEyeClick = () => {
      const graduationStages = [
        { stage: 'Graduated', count: 40, percentage: 31, color: '#4CAF50', description: 'Self-sustaining' },
        { stage: 'Near Graduation', count: 35, percentage: 27, color: '#8BC34A', description: '6-12 months' },
        { stage: 'Progressing', count: 28, percentage: 22, color: '#FFC107', description: '1-2 years' },
        { stage: 'Early Stage', count: 25, percentage: 20, color: '#FF9800', description: '2+ years' }
      ];

      openPopup(
        <div className="popup-content">
          <h3>SME Graduation Breakdown</h3>
          <div className="graduation-popup">
            <div className="graduation-main-popup">
              <div className="graduation-value">{value}%</div>
              <div className="graduation-label">Graduated to Bankable</div>
              <div className="graduation-subtitle">40 SMEs Successfully Graduated</div>
            </div>
            
            <div className="graduation-timeline-popup">
              {graduationStages.map((item, index) => (
                <div key={item.stage} className="timeline-item-popup">
                  <div className="timeline-marker-popup" style={{ backgroundColor: item.color }}>
                    <div className="marker-value-popup">{item.percentage}%</div>
                  </div>
                  <div className="timeline-content-popup">
                    <div className="timeline-stage-popup">{item.stage}</div>
                    <div className="timeline-count-popup">{item.count} SMEs</div>
                    <div className="timeline-description-popup">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div 
        className="chart-container"
        onMouseEnter={() => setHoveredChart('graduation')}
        onMouseLeave={() => setHoveredChart(null)}
      >
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button 
            className="breakdown-icon-btn"
            onClick={handleEyeClick}
            title="View breakdown"
          >
            <FiEye />
          </button>
        </div>
        {hoveredChart === 'graduation' && (
          <div className="visual-description">
            Percentage of SMEs now self-sustaining with impact metrics across graduated, near graduation, progressing, and early stages
          </div>
        )}
        
        <div className="graduation-simple">
          <div className="graduation-main-simple">
            <div className="graduation-value-simple">{value}%</div>
            <div className="graduation-label-simple">Graduated to Bankable</div>
          </div>
        </div>
        
        <div className="chart-summary-compact">
          <div className="current-value">Graduation Rate: {value}%</div>
          <div className="target-value">
            Target: {target}%
            {value >= target ? (
              <FiArrowUp className="trend-icon up" />
            ) : (
              <FiArrowDown className="trend-icon down" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Follow-on Funding Rate Component - STATIC
  const EnhancedFollowOnFundingChart = ({ value, target, data, title }) => {
    const chartData = {
      labels: data.map((_, index) => `Q${index + 1}`),
      datasets: [
        {
          label: 'Follow-on Rate',
          data: data,
          backgroundColor: brownShades.map(color => color + '80'),
          borderColor: brownShades[2],
          borderWidth: 2,
          hoverBackgroundColor: brownShades.map(color => color + '80')
        }
      ]
    };

    const options = {
      ...staticBarOptions,
      plugins: {
        ...staticBarOptions.plugins,
        legend: {
          display: false
        }
      }
    };

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Follow-on Funding Details</h3>
          <div className="popup-chart">
            <Bar data={chartData} options={options} />
          </div>
          <div className="popup-details">
            <div className="detail-item">
              <span className="detail-label">Current Quarter:</span>
              <span className="detail-value">{value}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Quarterly Avg:</span>
              <span className="detail-value">24.5%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Top Sector:</span>
              <span className="detail-value">Tech (42%)</span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div 
        className="chart-container"
        onMouseEnter={() => setHoveredChart('follow-on-funding')}
        onMouseLeave={() => setHoveredChart(null)}
      >
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button 
            className="breakdown-icon-btn"
            onClick={handleEyeClick}
            title="View details"
          >
            <FiEye />
          </button>
        </div>
        {hoveredChart === 'follow-on-funding' && (
          <div className="visual-description">
            {chartDescriptions['follow-on-funding']}
          </div>
        )}
        <div className="chart-area-ultra-compact">
          <Bar data={chartData} options={options} id="follow-on-funding" />
        </div>
        <div className="chart-summary-ultra-compact">
          <div className="current-value">Current: {value}%</div>
          <div className="target-value">
            Target: {target}%
            {value >= target ? (
              <FiArrowUp className="trend-icon up" />
            ) : (
              <FiArrowDown className="trend-icon down" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Cost per Funded SME Infographic Component - SIMPLIFIED
  const CostPerSMEInfographic = ({ value, target, title }) => {
    const costData = {
      labels: ['Staff', 'Operations', 'Technology', 'Travel', 'Other'],
      datasets: [
        {
          data: [45, 25, 15, 10, 5],
          backgroundColor: [
            brownShades[0],
            brownShades[1],
            brownShades[2],
            brownShades[3],
            brownShades[4]
          ],
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 0
        }
      ]
    };

    const options = {
      ...staticPieOptions,
      plugins: {
        ...staticPieOptions.plugins,
        tooltip: {
          enabled: true,
          animation: false
        }
      }
    };

    const plugins = [{
      id: 'centerText',
      afterDraw: (chart) => {
        const ctx = chart.ctx;
        const { chartArea: { left, right, top, bottom, width, height } } = chart;
        
        chart.data.datasets.forEach((dataset, i) => {
          chart.getDatasetMeta(i).data.forEach((arc, index) => {
            const { x, y } = arc.tooltipPosition();
            
            ctx.save();
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dataset.data[index], x, y);
            ctx.restore();
          });
        });
      }
    }];

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Cost Breakdown Details</h3>
          <div className="popup-chart">
            <Doughnut data={costData} options={options} plugins={plugins} />
          </div>
          <div className="popup-details">
            <div className="detail-item">
              <span className="detail-label">Staff (45%):</span>
              <span className="detail-value">R12,375</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Operations (25%):</span>
              <span className="detail-value">R6,875</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Technology (15%):</span>
              <span className="detail-value">R4,125</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Travel (10%):</span>
              <span className="detail-value">R2,750</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Other (5%):</span>
              <span className="detail-value">R1,375</span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div 
        className="chart-container"
        onMouseEnter={() => setHoveredChart('cost-sme')}
        onMouseLeave={() => setHoveredChart(null)}
      >
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button 
            className="breakdown-icon-btn"
            onClick={handleEyeClick}
            title="View breakdown"
          >
            <FiEye />
          </button>
        </div>
        {hoveredChart === 'cost-sme' && (
          <div className="visual-description">
            Detailed breakdown of operational costs per funded SME across staff, operations, technology, travel, and other expenses
          </div>
        )}
        
        <div className="cost-simple">
          <div className="cost-main-simple">
            <div className="cost-value-simple">R27,500</div>
            <div className="cost-label-simple">Average Cost per Funded SME</div>
          </div>
        </div>
        
        <div className="chart-summary-compact">
          <div className="current-value">Efficiency: {value}% of target</div>
          <div className="target-value">
            Target: {target}%
            {value >= target ? (
              <FiArrowUp className="trend-icon up" />
            ) : (
              <FiArrowDown className="trend-icon down" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Time to Fund Chart Component - STATIC with lines instead of boxes
  const TimeToFundChart = ({ value, target, data, title }) => {
    const chartData = {
      labels: data.map((_, index) => `Q${index + 1}`),
      datasets: [
        {
          label: 'Days to Fund',
          data: data,
          borderColor: brownShades[0],
          backgroundColor: brownShades[0] + '20',
          borderWidth: 3,
          fill: true,
          tension: 0,
          pointBackgroundColor: brownShades[0],
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        },
        {
          label: 'Target',
          data: Array(data.length).fill(target),
          borderColor: '#4CAF50',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          tension: 0
        }
      ]
    };

    const options = {
      ...staticLineOptions,
      plugins: {
        ...staticLineOptions.plugins,
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            pointStyle: 'line',
            boxWidth: 15,
            boxHeight: 2,
          }
        }
      }
    };

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Time to Fund Details</h3>
          <div className="popup-chart">
            <Line data={chartData} options={options} />
          </div>
          <div className="popup-details">
            <div className="detail-item">
              <span className="detail-label">Current Average:</span>
              <span className="detail-value">{value} days</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Target:</span>
              <span className="detail-value">{target} days</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Trend:</span>
              <span className="detail-value positive">Improving</span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div 
        className="chart-container"
        onMouseEnter={() => setHoveredChart('time-to-fund')}
        onMouseLeave={() => setHoveredChart(null)}
      >
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button 
            className="breakdown-icon-btn"
            onClick={handleEyeClick}
            title="View details"
          >
            <FiEye />
          </button>
        </div>
        {hoveredChart === 'time-to-fund' && (
          <div className="visual-description">
            {chartDescriptions['time-to-fund']}
          </div>
        )}
        <div className="chart-area-ultra-compact">
          <Line data={chartData} options={options} id="time-to-fund" />
        </div>
        <div className="chart-summary-ultra-compact">
          <div className="current-value">Current: {value} days</div>
          <div className="target-value">
            Target: {target} days
            {value <= target ? (
              <FiArrowDown className="trend-icon up" />
            ) : (
              <FiArrowUp className="trend-icon down" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Exit Repayment Ratio Chart Component - STATIC with lines instead of boxes
  const ExitRepaymentChart = ({ value, target, data, title }) => {
    const chartData = {
      labels: data.map((_, index) => `Q${index + 1}`),
      datasets: [
        {
          label: 'Exit/Repayment Ratio',
          data: data,
          borderColor: brownShades[5],
          backgroundColor: brownShades[5] + '20',
          borderWidth: 3,
          fill: true,
          tension: 0,
          pointBackgroundColor: brownShades[5],
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        },
        {
          label: 'Target',
          data: Array(data.length).fill(target),
          borderColor: '#4CAF50',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          tension: 0
        }
      ]
    };

    const options = {
      ...staticLineOptions,
      plugins: {
        ...staticLineOptions.plugins,
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            pointStyle: 'line',
            boxWidth: 15,
            boxHeight: 2,
          }
        }
      }
    };

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Exit/Repayment Details</h3>
          <div className="popup-chart">
            <Line data={chartData} options={options} />
          </div>
          <div className="popup-details">
            <div className="detail-item">
              <span className="detail-label">Current Ratio:</span>
              <span className="detail-value">{value}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Target:</span>
              <span className="detail-value">{target}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className="detail-value positive">On Track</span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div 
        className="chart-container"
        onMouseEnter={() => setHoveredChart('exit-repayment')}
        onMouseLeave={() => setHoveredChart(null)}
      >
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button 
            className="breakdown-icon-btn"
            onClick={handleEyeClick}
            title="View details"
          >
            <FiEye />
          </button>
        </div>
        {hoveredChart === 'exit-repayment' && (
          <div className="visual-description">
            {chartDescriptions['exit-repayment']}
          </div>
        )}
        <div className="chart-area-ultra-compact">
          <Line data={chartData} options={options} id="exit-repayment" />
        </div>
        <div className="chart-summary-ultra-compact">
          <div className="current-value">Current: {value}%</div>
          <div className="target-value">
            Target: {target}%
            {value >= target ? (
              <FiArrowUp className="trend-icon up" />
            ) : (
              <FiArrowDown className="trend-icon down" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Bar Chart Component with Title and Hover Description
  const BarChartWithTitle = ({ data, title, chartTitle, chartId }) => {
    const options = {
      ...staticBarOptions,
      plugins: {
        ...staticBarOptions.plugins,
        legend: {
          display: false
        }
      }
    };

    return (
      <div 
        className="chart-container"
        onMouseEnter={() => setHoveredChart(chartId)}
        onMouseLeave={() => setHoveredChart(null)}
      >
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
        </div>
        {hoveredChart === chartId && (
          <div className="visual-description">
            {chartDescriptions[chartId] || 'Chart visualization'}
          </div>
        )}
        <div className="chart-title-fixed">{chartTitle}</div>
        <div className="chart-area">
          <Bar 
            data={data} 
            options={options} 
            id={chartId}
          />
        </div>
      </div>
    );
  };

  // Line Chart Component with Title and Hover Description
  const LineChartWithTitle = ({ data, title, chartTitle, chartId, options = staticLineOptions }) => {
    const customOptions = {
      ...options,
      plugins: {
        ...options.plugins
      }
    };

    return (
      <div 
        className="chart-container"
        onMouseEnter={() => setHoveredChart(chartId)}
        onMouseLeave={() => setHoveredChart(null)}
      >
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
        </div>
        {hoveredChart === chartId && (
          <div className="visual-description">
            {chartDescriptions[chartId] || 'Chart visualization'}
          </div>
        )}
        <div className="chart-title-fixed">{chartTitle}</div>
        <div className="chart-area">
          <Line 
            data={data} 
            options={customOptions} 
            id={chartId}
          />
        </div>
      </div>
    );
  };

  // Funnel Chart Component
  const FunnelChart = ({ stages, values, colors }) => {
    const maxValue = Math.max(...values);
    
    return (
      <div className="funnel-container">
        {stages.map((stage, index) => {
          const width = (values[index] / maxValue) * 80 + 20;
          return (
            <div key={stage} className="funnel-stage">
              <div 
                className="funnel-bar"
                style={{
                  width: `${width}%`,
                  backgroundColor: colors[index] || brownShades[index % brownShades.length]
                }}
              >
                <span className="funnel-label">{stage}</span>
                <span className="funnel-value">{values[index]}%</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Trend Alert Card Component
  const TrendAlertCard = ({ title, value, description, trend, isPositive = true }) => (
    <div className={`trend-alert-card ${isPositive ? 'positive' : 'negative'}`}>
      <div className="trend-alert-header">
        <div className="trend-alert-title">{title}</div>
        <div className={`trend-alert-icon ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <FiArrowDown /> : <FiAlertTriangle />}
        </div>
      </div>
      <div className="trend-alert-value">{value}</div>
      <div className="trend-alert-description">{description}</div>
    </div>
  );

  // Data generation functions with static options
  const generateBarData = (labels, data, label, colorIndex) => ({
    labels,
    datasets: [{
      label,
      data,
      backgroundColor: brownShades[colorIndex % brownShades.length],
      borderColor: brownShades[(colorIndex + 1) % brownShades.length],
      borderWidth: 1,
      hoverBackgroundColor: brownShades[colorIndex % brownShades.length]
    }]
  });

  const generateLineData = (labels, datasets) => ({
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.values,
      borderColor: brownShades[i % brownShades.length],
      backgroundColor: brownShades[i % brownShades.length] + '20',
      borderWidth: 2,
      pointBackgroundColor: brownShades[i % brownShades.length],
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      fill: ds.fill || false,
      tension: 0
    }))
  });

  const generatePieData = (labels, data) => ({
    labels,
    datasets: [{
      data,
      backgroundColor: brownShades.slice(0, data.length),
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 0
    }]
  });

  const generateStackedBarData = (labels, datasets) => ({
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.values,
      backgroundColor: brownShades[i % brownShades.length],
      borderColor: brownShades[i % brownShades.length],
      borderWidth: 1,
      hoverBackgroundColor: brownShades[i % brownShades.length]
    }))
  });

  const generateRadarData = (labels, actualData, targetData) => ({
    labels,
    datasets: [
      {
        label: 'Actual',
        data: actualData,
        backgroundColor: 'rgba(94, 63, 38, 0.2)',
        borderColor: brownShades[0],
        pointBackgroundColor: brownShades[0],
        borderWidth: 2
      },
      {
        label: 'Target',
        data: targetData,
        backgroundColor: 'rgba(125, 90, 54, 0.2)',
        borderColor: brownShades[1],
        pointBackgroundColor: brownShades[1],
        borderWidth: 2
      }
    ]
  });

  const getRegionColor = (value) => {
    if (value > 30) return brownShades[0];
    if (value > 20) return brownShades[1];
    if (value > 10) return brownShades[2];
    return brownShades[3];
  };

  // Purpose Component
  const Purpose = ({ purpose }) => (
    <div className="purpose">
      <div className="purpose-text">
        <strong>Purpose:</strong> {purpose}
      </div>
    </div>
  );

  // Time View Selector Component
  const TimeViewSelector = ({ currentView, onViewChange, views = ['Monthly', 'Quarterly', 'Yearly'] }) => (
    <div className="time-view-selector">
      <span className="time-view-label">View:</span>
      {views.map(view => (
        <button
          key={view}
          className={`time-view-btn ${currentView === view ? 'active' : ''}`}
          onClick={() => onViewChange(view)}
        >
          {view}
        </button>
      ))}
    </div>
  );

  // Download Options Component
  const DownloadOptions = () => (
    <div className="download-options">
      <div className="download-options-content">
        <h4>Download Report</h4>
        <div className="download-options-list">
          <button onClick={() => downloadSectionAsPDF('all')}>All Sections</button>
          {allCategories.map(section => (
            <button key={section} onClick={() => downloadSectionAsPDF(section)}>
              {section}
            </button>
          ))}
        </div>
        <button className="close-download" onClick={() => setShowDownloadOptions(false)}>
          Close
        </button>
      </div>
    </div>
  );

  // Popup Component
  const Popup = () => {
    if (!showPopup) return null;

    return (
      <div className="popup-overlay" onClick={closePopup}>
        <div className="popup-container" onClick={(e) => e.stopPropagation()}>
          <button className="popup-close" onClick={closePopup}>
            <FiX />
          </button>
          {popupContent}
        </div>
      </div>
    );
  };

  // Data for ALL sections
  const sectionData = {
    'Portfolio Overview': {
      icon: <FiEye />,
      purpose: 'Provide a high-level snapshot of overall performance and exposure at a glance',
      content: (
        <div className="portfolio-overview">
          <div className="section-header">
            <Purpose purpose="Provide a high-level snapshot of overall performance and exposure at a glance" />
            <div className="section-controls">
              <button 
                className="download-section-btn"
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              >
                <FiDownload /> Download
              </button>
            </div>
          </div>

          <div className="time-view-controls">
            <TimeViewSelector 
              currentView={timeToFundView} 
              onViewChange={setTimeToFundView}
            />
          </div>
          
          {/* TOP ROW - 4 charts */}
          <div className="charts-grid-4x4">
            <div className="top-row">
              <BarChartWithTitle
                data={generateBarData(
                  ['Q1', 'Q2', 'Q3', 'Q4'],
                  [280, 295, 305, 312],
                  'Portfolio Value (R millions)',
                  0
                )}
                title="Total Portfolio Value / Exposure"
                chartTitle="Values (R millions) per quarter"
                chartId="total-portfolio-value"
              />

              <ActiveSMEsPieChart
                title="# of Active SMEs"
              />

              <BIGScoreInfographic 
                value={78.4} 
                target={80} 
                title="Avg. BIG Score"
              />

              <EnhancedFundingReady 
                value={46} 
                target={50} 
                title='% Portfolio "Funding Ready"'
              />
            </div>

            {/* BOTTOM ROW - 4 charts */}
            <div className="bottom-row">
              <BarChartWithTitle
                data={generateBarData(
                  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  [15, 18, 22, 20, 25, 28],
                  'Funding (R millions)',
                  2
                )}
                title="Funding Facilitated"
                chartTitle="Monthly funding amounts (R millions)"
                chartId="funding-facilitated"
              />

              <TimeToFundChart
                value={32}
                target={30}
                data={getTimeData(timeToFundView, timeToFundData.Monthly, timeToFundData.Quarterly, timeToFundData.Yearly)}
                title="Avg. Time-to-Fund"
              />

              <EnhancedFollowOnFundingChart
                value={27}
                target={30}
                data={[22, 24, 25, 27]}
                title="Follow-on Funding Rate"
              />

              <ExitRepaymentChart
                value={12}
                target={15}
                data={[10, 11, 12, 12]}
                title="Exit / Repayment Ratio"
              />
            </div>
          </div>
        </div>
      )
    },
    'Portfolio Composition': {
      icon: <FiComposition />,
      purpose: 'Show diversification and concentration by sector, stage, location, etc.',
      content: (
        <div className="portfolio-composition">
          <div className="section-header">
            <Purpose purpose="Show diversification and concentration by sector, stage, location, etc." />
            <div className="section-controls">
              <button 
                className="download-section-btn"
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              >
                <FiDownload /> Download
              </button>
            </div>
          </div>
          
          <div className="composition-charts-grid">
            <PieChartWithNumbers
              title="By Lifecycle Stage"
              labels={['Early', 'Growth', 'Mature', 'Exit-ready']}
              data={[22, 41, 27, 10]}
              showEye={true}
              chartId="lifecycle-stage"
            />

            <BarChartWithTitle
              data={generateBarData(
                ['Manufacturing', 'Services', 'Agriculture', 'Retail', 'Tech'],
                [28, 24, 20, 18, 10],
                '% Capital',
                1
              )}
              title="By Industry / Sector"
              chartTitle="Capital allocation by sector (%)"
              chartId="industry-sector"
            />

            <div 
              className="chart-container"
              onMouseEnter={() => setHoveredChart('geography')}
              onMouseLeave={() => setHoveredChart(null)}
            >
              <h3 className="chart-title">By Geography</h3>
              {hoveredChart === 'geography' && (
                <div className="visual-description">
                  Displays provincial distribution with hover tooltips showing regional allocations
                </div>
              )}
              <div className="chart-area">
                <div className="map-container">
                  <MapContainer 
                    center={[-28.4796, 24.6987]} 
                    zoom={5} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    <GeoJSON
                      data={southAfricaGeoJSON}
                      style={(feature) => ({
                        fillColor: getRegionColor(feature.properties.value),
                        weight: 1,
                        opacity: 1,
                        color: 'white',
                        fillOpacity: 0.7
                      })}
                      onEachFeature={(feature, layer) => {
                        layer.bindPopup(`
                          <strong>${feature.properties.name}</strong><br>
                          Allocation: ${feature.properties.value}%
                        `);
                      }}
                    />
                  </MapContainer>
                </div>
              </div>
            </div>

            <BarChartWithTitle
              data={generateStackedBarData(
                ['Equity', 'Debt', 'Grant', 'EaaS'],
                [
                  { label: 'Current', values: [120, 95, 45, 52] },
                  { label: 'Target', values: [130, 100, 50, 70] }
                ]
              )}
              title="By Funding Instrument"
              chartTitle="Current vs Target allocation (R millions)"
              chartId="funding-instrument"
            />

            <PieChartWithNumbers
              title="By Demographic / Ownership"
              labels={['Women-led', 'Youth-led', 'Black-owned', 'Other']}
              data={[38, 24, 72, 16]}
              showEye={true}
              chartId="demographic-ownership"
            />
          </div>
        </div>
      )
    },
    'Exit & Liquidity Metrics': {
      icon: <FiLiquidity />,
      purpose: 'Measure realized outcomes, repayments, and liquidity flow',
      content: (
        <div className="exit-liquidity">
          <div className="section-header">
            <Purpose purpose="Measure realized outcomes, repayments, and liquidity flow" />
            <div className="section-controls">
              <button 
                className="download-section-btn"
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              >
                <FiDownload /> Download
              </button>
            </div>
          </div>

          <div className="time-view-controls">
            <TimeViewSelector 
              currentView={timeToExitView} 
              onViewChange={setTimeToExitView}
            />
          </div>
          
          <div className="exit-charts-grid">
            <BarChartWithTitle
              data={generateBarData(
                ['Q1', 'Q2', 'Q3', 'Q4'],
                [2, 4, 5, 7],
                '# of Exits',
                0
              )}
              title="Exit / Repayment History"
              chartTitle="Number of exits per quarter"
              chartId="exit-repayment-history"
            />

            <LineChartWithTitle
              data={generateLineData(
                ['Q1', 'Q2', 'Q3', 'Q4'],
                [
                  { label: 'Avg Months', values: getTimeData(timeToExitView, timeToExitData.Monthly, timeToExitData.Quarterly, timeToExitData.Yearly) },
                  { label: 'Target (&lt;32)', values: getTimeData(timeToExitView, [32, 32, 32, 32, 32, 32], [32, 32, 32, 32], [32, 32, 32, 32]) }
                ]
              )}
              title="Avg. Time-to-Exit"
              chartTitle="Average months to exit vs target"
              chartId="time-to-exit"
            />

            <BarChartWithTitle
              data={generateBarData(
                ['Deal A', 'Deal B', 'Deal C', 'Deal D', 'Deal E'],
                [1.8, 2.4, 3.0, 2.1, 2.8],
                'Multiple (x)',
                1
              )}
              title="Exit Multiple"
              chartTitle="Return multiples for exited deals (x)"
              chartId="exit-multiple"
            />

            <PieChartWithNumbers
              title="Reinvestment Ratio"
              labels={['Reinvested', 'Held']}
              data={[64, 36]}
              showEye={true}
              chartId="reinvestment-ratio"
            />

            <SMEGraduationInfographic
              value={31}
              target={35}
              title="SME Graduation to Bankable"
            />
          </div>
        </div>
      )
    },
    'Funder Health & Efficiency': {
      icon: <FiHeart />,
      purpose: 'Track funder/catalyst performance and operational efficiency',
      content: (
        <div className="funder-efficiency">
          <div className="section-header">
            <Purpose purpose="Track funder/catalyst performance and operational efficiency" />
            <div className="section-controls">
              <button 
                className="download-section-btn"
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              >
                <FiDownload /> Download
              </button>
            </div>
          </div>

          <div className="time-view-controls">
            <TimeViewSelector 
              currentView={vettingTimeView} 
              onViewChange={setVettingTimeView}
            />
          </div>
          
          <div className="funder-charts-grid-4x4">
            <BarChartWithTitle
              data={generateBarData(
                ['Reviewed', 'Approved', 'Funded'],
                [210, 85, 46],
                '# of apps',
                0
              )}
              title="Applications Reviewed vs Funded"
              chartTitle="Application funnel volumes"
              chartId="applications-reviewed"
            />

            <LineChartWithTitle
              data={generateLineData(
                ['Q1', 'Q2', 'Q3', 'Q4'],
                [{ label: 'Days', values: getTimeData(vettingTimeView, vettingTimeData.Monthly, vettingTimeData.Quarterly, vettingTimeData.Yearly) }]
              )}
              title="Avg. Vetting Time"
              chartTitle="Average vetting time in days"
              chartId="vetting-time"
              options={{
                ...staticLineOptions,
                plugins: {
                  ...staticLineOptions.plugins,
                  legend: {
                    display: false
                  }
                }
              }}
            />

            <CostPerSMEInfographic
              value={75}
              target={80}
              title="Cost per Funded SME"
            />

            <BarChartWithTitle
              data={generateBarData(
                ['Funder A', 'Funder B', 'Funder C', 'Funder D'],
                [12, 9, 7, 5],
                '# SMEs co-funded',
                2
              )}
              title="Active Partnerships / Co-Funders"
              chartTitle="Number of SMEs co-funded per partner"
              chartId="active-partnerships"
            />
          </div>
        </div>
      )
    },
    'Performance & Risk Dashboard': {
      icon: <FiBarChart2 />,
      purpose: 'Assess growth, risk, and inclusion performance of portfolio',
      content: (
        <div className="performance-risk">
          <div className="section-header">
            <Purpose purpose="Assess growth, risk, and inclusion performance of portfolio" />
            <div className="section-controls">
              <button 
                className="download-section-btn"
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              >
                <FiDownload /> Download
              </button>
            </div>
          </div>
          
          <div className="performance-charts-grid">
            <BarChartWithTitle
              data={generateBarData(
                ['Q1', 'Q2', 'Q3', 'Q4'],
                [7.5, 9.8, 6.1, 4.2],
                '% Defaults',
                0
              )}
              title="Default / Non-performing Ratio"
              chartTitle="Default rates per quarter (%)"
              chartId="default-ratio"
            />

            <LineChartWithTitle
              data={generateLineData(
                ['Q1', 'Q2', 'Q3', 'Q4'],
                [
                  { label: 'Revenue Growth', values: [9, 10, 12, 11] },
                  { label: 'Benchmark (8%)', values: [8, 8, 8, 8] }
                ]
              )}
              title="SME Growth Index"
              chartTitle="Revenue growth vs benchmark (%)"
              chartId="sme-growth-index"
            />

            <BarChartWithTitle
              data={generateStackedBarData(
                ['Agriculture', 'Services', 'Manufacturing', 'Retail', 'Tech'],
                [
                  { label: 'New Jobs', values: [800, 1000, 600, 400, 300] },
                  { label: 'Retained Jobs', values: [400, 500, 400, 300, 200] }
                ]
              )}
              title="Job Creation / Retention"
              chartTitle="Jobs created and retained by sector"
              chartId="job-creation"
            />

            <LineChartWithTitle
              data={generateLineData(
                ['Q1', 'Q2', 'Q3', 'Q4'],
                [
                  { label: 'Graduation Rate', values: [15, 17, 18, 19] },
                  { label: 'Target (25%)', values: [20, 21, 23, 25] }
                ]
              )}
              title="SME Graduation Rate (to 80+ BIG Score)"
              chartTitle="Graduation rate vs target (%)"
              chartId="graduation-rate"
              options={{
                ...staticLineOptions,
                scales: {
                  ...staticLineOptions.scales,
                  y: {
                    ...staticLineOptions.scales.y,
                    max: 30
                  }
                }
              }}
            />

            <div 
              className="chart-container"
              onMouseEnter={() => setHoveredChart('diversity-inclusion')}
              onMouseLeave={() => setHoveredChart(null)}
            >
              <h3 className="chart-title">Diversity & Inclusion Score</h3>
              {hoveredChart === 'diversity-inclusion' && (
                <div className="visual-description">
                  {chartDescriptions['diversity-inclusion']}
                </div>
              )}
              <div className="chart-area">
                <Radar 
                  data={generateRadarData(
                    ['Women', 'Youth', 'Rural', 'Black-owned'],
                    [38, 24, 45, 72],
                    [35, 25, 40, 70]
                  )}
                  options={{
                    ...staticChartOptions,
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          stepSize: 20
                        }
                      }
                    }
                  }}
                  id="diversity-inclusion"
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    'ESG & Impact Performance': {
      icon: <FiGlobe />,
      purpose: 'Measure environmental, social, and governance outcomes',
      content: (
        <div className="esg-impact">
          <div className="section-header">
            <Purpose purpose="Measure environmental, social, and governance outcomes" />
            <div className="section-controls">
              <button 
                className="download-section-btn"
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              >
                <FiDownload /> Download
              </button>
            </div>
          </div>
          
          <div className="esg-charts-grid">
            <BarChartWithTitle
              data={generateBarData(
                ['Environmental', 'Social', 'Governance'],
                [62, 81, 74],
                'Score (0-100)',
                1
              )}
              title="ESG Pillar Scores (E, S, G)"
              chartTitle="ESG pillar performance scores (0-100)"
              chartId="esg-pillar"
            />

            <BarChartWithTitle
              data={generateBarData(
                ['SDG8', 'SDG9', 'SDG5', 'SDG11'],
                [64, 41, 38, 32],
                '% of portfolio',
                2
              )}
              title="SDG Alignment"
              chartTitle="Portfolio alignment with SDGs (%)"
              chartId="sdg-alignment"
            />

            <PieChartWithNumbers
              title="Governance Compliance Health"
              labels={['Compliant', 'Partial', 'At Risk']}
              data={[72, 21, 7]}
              showEye={true}
              chartId="governance-compliance"
            />

            <div className="chart-container full-width">
              <h3 className="chart-title">Top 5 ESG Contributors</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SME</th>
                      <th>Pillar</th>
                      <th>Supporting Stat</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>FemmeTech Labs</td>
                      <td>Social</td>
                      <td>68 new jobs created</td>
                    </tr>
                    <tr>
                      <td>Green Agro</td>
                      <td>Environmental</td>
                      <td>120t CO2 reduced annually</td>
                    </tr>
                    <tr>
                      <td>EduTech SA</td>
                      <td>Social</td>
                      <td>500+ training hours delivered</td>
                    </tr>
                    <tr>
                      <td>Clean Energy Co</td>
                      <td>Environmental</td>
                      <td>100% renewable energy usage</td>
                    </tr>
                    <tr>
                      <td>Community Build</td>
                      <td>Governance</td>
                      <td>100% compliance rating</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )
    },
    'Data Integrity & Trust Layer': {
      icon: <FiShield />,
      purpose: 'Ensure transparency, compliance, and auditability',
      content: (
        <div className="data-integrity">
          <div className="section-header">
            <Purpose purpose="Ensure transparency, compliance, and auditability" />
            <div className="section-controls">
              <button 
                className="download-section-btn"
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              >
                <FiDownload /> Download
              </button>
            </div>
          </div>
          
          <div className="data-integrity-grid">
            <div className="chart-container full-width">
              <h3 className="chart-title">Compliance Verification Status</h3>
              <div className="table-container">
                <table className="data-table verification-table">
                  <thead>
                    <tr>
                      <th>SME</th>
                      <th>CIPC</th>
                      <th>Tax</th>
                      <th>KYC</th>
                      <th>Audit Stamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>FemmeTech Labs</td>
                      <td><span className="status-badge verified">Verified</span></td>
                      <td><span className="status-badge verified">Verified</span></td>
                      <td><span className="status-badge verified">Verified</span></td>
                      <td>2024-12-01</td>
                    </tr>
                    <tr>
                      <td>Green Agro</td>
                      <td><span className="status-badge verified">Verified</span></td>
                      <td><span className="status-badge partial">Partial</span></td>
                      <td><span className="status-badge verified">Verified</span></td>
                      <td>2024-11-15</td>
                    </tr>
                    <tr>
                      <td>Tech Innovate</td>
                      <td><span className="status-badge unverified">Pending</span></td>
                      <td><span className="status-badge verified">Verified</span></td>
                      <td><span className="status-badge partial">Partial</span></td>
                      <td>2024-12-10</td>
                    </tr>
                    <tr>
                      <td>Urban Solutions</td>
                      <td><span className="status-badge verified">Verified</span></td>
                      <td><span className="status-badge verified">Verified</span></td>
                      <td><span className="status-badge verified">Verified</span></td>
                      <td>2024-10-22</td>
                    </tr>
                    <tr>
                      <td>Service Provider</td>
                      <td><span className="status-badge partial">Partial</span></td>
                      <td><span className="status-badge unverified">Pending</span></td>
                      <td><span className="status-badge verified">Verified</span></td>
                      <td>2024-11-30</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )
    },
    'Insights & AI Recommendations': {
      icon: <FiActivity />,
      purpose: 'Provide AI-driven opportunities, risks, and alerts',
      content: (
        <div className="insights-ai">
          <div className="section-header">
            <Purpose purpose="Provide AI-driven opportunities, risks, and alerts" />
            <div className="section-controls">
              <button 
                className="download-section-btn"
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              >
                <FiDownload /> Download
              </button>
            </div>
          </div>

          <div className="time-view-controls">
            <TimeViewSelector 
              currentView={portfolioTrendView} 
              onViewChange={setPortfolioTrendView}
            />
          </div>
          
          <div className="insights-charts-grid">
            <div className="chart-container full-width">
              <h3 className="chart-title">Top 5 High-Performers</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SME</th>
                      <th>Score</th>
                      <th>Growth %</th>
                      <th>Ask</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>FemmeTech Labs</td>
                      <td>88</td>
                      <td>+32%</td>
                      <td>R15m</td>
                      <td>Market leader in sector</td>
                    </tr>
                    <tr>
                      <td>Green Agro</td>
                      <td>85</td>
                      <td>+28%</td>
                      <td>R8m</td>
                      <td>Sustainable practices</td>
                    </tr>
                    <tr>
                      <td>Tech Innovate</td>
                      <td>87</td>
                      <td>+45%</td>
                      <td>R12m</td>
                      <td>High growth potential</td>
                    </tr>
                    <tr>
                      <td>Urban Solutions</td>
                      <td>82</td>
                      <td>+25%</td>
                      <td>R6m</td>
                      <td>Strong management</td>
                    </tr>
                    <tr>
                      <td>EduTech SA</td>
                      <td>84</td>
                      <td>+38%</td>
                      <td>R10m</td>
                      <td>Social impact focus</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="chart-container full-width">
              <h3 className="chart-title">At-Risk / Watchlist SMEs</h3>
              <div className="table-container">
                <table className="data-table risk-table">
                  <thead>
                    <tr>
                      <th>SME</th>
                      <th>Risk Flag</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Coastal Retail</td>
                      <td>Missed 2 reports</td>
                      <td>Follow up required</td>
                    </tr>
                    <tr>
                      <td>Manufacturing Co</td>
                      <td>Revenue decline</td>
                      <td>Performance review</td>
                    </tr>
                    <tr>
                      <td>Service Provider</td>
                      <td>Compliance issues</td>
                      <td>Audit needed</td>
                    </tr>
                    <tr>
                      <td>Urban Solutions</td>
                      <td>Market volatility</td>
                      <td>Monitor closely</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="chart-container full-width">
              <h3 className="chart-title">Portfolio Trend Alerts</h3>
              <div className="trend-alerts-grid">
                <TrendAlertCard 
                  title="Defaults" 
                  value="↓ to 4.2%" 
                  description="Significant improvement in portfolio health"
                  trend="down"
                  isPositive={true}
                />
                <TrendAlertCard 
                  title="ESG Scores" 
                  value="↑ 5.6%" 
                  description="Improved environmental performance"
                  trend="up"
                  isPositive={true}
                />
                <TrendAlertCard 
                  title="Pipeline Aging" 
                  value="10 SMEs &gt;6mo" 
                  description="Increased pipeline stagnation risk"
                  trend="up"
                  isPositive={false}
                />
                <TrendAlertCard 
                  title="Revenue Growth" 
                  value="↑ 12%" 
                  description="Strong quarter-over-quarter performance"
                  trend="up"
                  isPositive={true}
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    'Pipeline & Future Opportunities': {
      icon: <FiTarget />,
      purpose: 'Show pipeline strength and forecast future capital needs',
      content: (
        <div className="pipeline-opportunities">
          <div className="section-header">
            <Purpose purpose="Show pipeline strength and forecast future capital needs" />
            <div className="section-controls">
              <button 
                className="download-section-btn"
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              >
                <FiDownload /> Download
              </button>
            </div>
          </div>
          
          {/* TOP ROW - 4 charts */}
          <div className="charts-grid-4x4">
            <div className="top-row">
              <BarChartWithTitle
                data={generateBarData(
                  ['&lt;1 month', '1-3 months', '3-6 months', '&gt;6 months'],
                  [15, 24, 30, 10],
                  '# of SMEs',
                  0
                )}
                title="Pipeline Stage Aging"
                chartTitle="Number of SMEs by pipeline age"
                chartId="pipeline-aging"
              />

              <div 
                className="chart-container"
                onMouseEnter={() => setHoveredChart('conversion-funnel')}
                onMouseLeave={() => setHoveredChart(null)}
              >
                <h3 className="chart-title">Conversion Funnel (App→Approval→Disburse)</h3>
                {hoveredChart === 'conversion-funnel' && (
                  <div className="visual-description">
                    Displays application conversion efficiency from application to approval to disbursement stages
                  </div>
                )}
                <div className="chart-area">
                  <FunnelChart 
                    stages={['Application', 'Approval', 'Disbursed']}
                    values={[28, 45, 82]}
                    colors={[brownShades[0], brownShades[1], brownShades[2]]}
                  />
                </div>
              </div>

              <BarChartWithTitle
                data={generateStackedBarData(
                  ['Q1', 'Q2', 'Q3', 'Q4'],
                  [
                    { label: 'Debt', values: [35, 40, 45, 50] },
                    { label: 'Equity', values: [22, 25, 28, 30] },
                    { label: 'Grants', values: [15, 18, 20, 22] }
                  ]
                )}
                title="Forecasted Capital Requirement (Next 12mo)"
                chartTitle="Capital requirements by instrument (R millions)"
                chartId="capital-requirement"
              />

              <PieChartWithNumbers
                title="Data Confidence Meter"
                labels={['Verified', 'Partial', 'Unverified']}
                data={[78, 15, 7]}
                showEye={true}
                chartId="data-confidence"
              />
            </div>

            {/* BOTTOM - Full width table */}
            <div className="bottom-full">
              <div className="chart-container full-width">
                <h3 className="chart-title">Co-Invest / Support Opportunities</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>SME</th>
                        <th>Stage</th>
                        <th>Ask</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>KZN AgroPack</td>
                        <td>Growth</td>
                        <td>R8m</td>
                        <td>83</td>
                      </tr>
                      <tr>
                        <td>Tech Innovate</td>
                        <td>Early</td>
                        <td>R5m</td>
                        <td>79</td>
                      </tr>
                      <tr>
                        <td>Green Manufacturing</td>
                        <td>Mature</td>
                        <td>R12m</td>
                        <td>88</td>
                      </tr>
                      <tr>
                        <td>Urban Solutions</td>
                        <td>Growth</td>
                        <td>R6m</td>
                        <td>76</td>
                      </tr>
                      <tr>
                        <td>Digital Finance Co</td>
                        <td>Early</td>
                        <td>R10m</td>
                        <td>81</td>
                      </tr>
                    </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      )
    }
  };

  const getContainerStyles = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    padding: `70px 20px 20px ${isSidebarCollapsed ? "100px" : "270px"}`,
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
    backgroundColor: "#f8f9fa",
  });

  const allCategories = [
    'Portfolio Overview',
    'Portfolio Composition', 
    'Exit & Liquidity Metrics',
    'Funder Health & Efficiency',
    'Performance & Risk Dashboard',
    'ESG & Impact Performance',
    'Data Integrity & Trust Layer',
    'Insights & AI Recommendations',
    'Pipeline & Future Opportunities'
  ];

  const topCategories = allCategories.slice(0, 5);
  const bottomCategories = allCategories.slice(5);

  return (
    <div className="investments-container" style={getContainerStyles()}>
      <div className="investments-content">
        <h2 className="investments-title">My Investments</h2>

        {/* Top Categories Row - 5 tabs */}
        <div className="categories-scroll-container">
          <div className="categories-grid">
            {topCategories.map((category) => (
              <button
                key={category}
                className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                <span className="btn-icon">{sectionData[category].icon}</span>
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Categories Row - 4 tabs */}
        <div className="categories-scroll-container">
          <div className="categories-grid">
            {bottomCategories.map((category) => (
              <button
                key={category}
                className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                <span className="btn-icon">{sectionData[category].icon}</span>
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="section-content" ref={sectionRef}>
          {sectionData[activeCategory].content}
        </div>
      </div>

      {showDownloadOptions && <DownloadOptions />}
      <Popup />
    </div>
  );
};

export default MyInvestments;