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
  FiInfo
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

const MyInvestments = () => {
  const [activeCategory, setActiveCategory] = useState('Portfolio Overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [timeToFundView, setTimeToFundView] = useState('Quarterly');
  const [timeToExitView, setTimeToExitView] = useState('Quarterly');
  const [vettingTimeView, setVettingTimeView] = useState('Monthly');
  const [portfolioTrendView, setPortfolioTrendView] = useState('Quarterly');
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [showSMEDetails, setShowSMEDetails] = useState(false);
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

  // Download functionality - FIXED to download correct section
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
        // Set the active category to the one we want to download
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
        
        // Restore original category after download
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

  // Custom Pie Chart with Numbers ALWAYS visible
  const PieChartWithNumbers = ({ data, labels, title, description }) => {
    const chartData = {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: brownShades.slice(0, data.length),
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.parsed}`;
            }
          }
        }
      }
    };

    const plugins = [{
      id: 'centerText',
      afterDraw: (chart) => {
        const ctx = chart.ctx;
        const { chartArea: { left, right, top, bottom, width, height } } = chart;
        
        // Draw numbers on each slice
        chart.data.datasets.forEach((dataset, i) => {
          chart.getDatasetMeta(i).data.forEach((arc, index) => {
            const { x, y } = arc.tooltipPosition();
            const percentage = chart.data.labels[index] + ': ' + dataset.data[index];
            
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

    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        {description && <div className="visual-description">{description}</div>}
        <div className="chart-area">
          <Doughnut data={chartData} options={options} plugins={plugins} />
        </div>
      </div>
    );
  };

  // Active SMEs Circle Chart Component - FIXED with smaller circle
  const ActiveSMEsCircleChart = ({ value, title, description }) => {
    const [showDetails, setShowDetails] = useState(false);
    
    const data = {
      datasets: [
        {
          data: [128, 0],
          backgroundColor: [brownShades[0], '#f0f0f0'],
          borderWidth: 0,
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%', // Smaller circle
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      }
    };

    const plugins = [{
      id: 'centerText',
      afterDraw: (chart) => {
        const ctx = chart.ctx;
        const width = chart.width;
        const height = chart.height;
        ctx.save();
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = brownShades[0];
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('128', width / 2, height / 2 - 10);
        ctx.font = '12px Arial';
        ctx.fillText('SMEs', width / 2, height / 2 + 15);
        ctx.restore();
      }
    }];

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button 
            className={`breakdown-icon-btn ${showDetails ? 'active' : ''}`}
            onClick={() => setShowDetails(!showDetails)}
            title="View breakdown"
          >
            <FiEye />
          </button>
        </div>
        {description && <div className="visual-description">{description}</div>}
        <div className="chart-area">
          <Doughnut data={data} options={options} plugins={plugins} />
        </div>
        {showDetails && (
          <div className="breakdown-details">
            <h4>SME Breakdown</h4>
            <div className="breakdown-list">
              <div className="breakdown-item">
                <span className="breakdown-label">Early Stage:</span>
                <span className="breakdown-value">28 SMEs (22%)</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Growth Stage:</span>
                <span className="breakdown-value">45 SMEs (35%)</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Mature Stage:</span>
                <span className="breakdown-value">35 SMEs (27%)</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Exit-ready:</span>
                <span className="breakdown-value">20 SMEs (16%)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // NEW: Enhanced BIG Score Infographic Component
  const BIGScoreInfographic = ({ value, target, title, description }) => {
    const scoreComponents = [
      { name: 'Compliance Score', value: 82, color: brownShades[0] },
      { name: 'Legitimacy Score', value: 76, color: brownShades[1] },
      { name: 'Leadership Score', value: 85, color: brownShades[2] },
      { name: 'Governance Score', value: 79, color: brownShades[3] },
      { name: 'Capital Appeal Score', value: 70, color: brownShades[4] }
    ];

    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        {description && <div className="visual-description">{description}</div>}
        
        <div className="big-score-infographic">
          <div className="big-score-main">
            <div className="big-score-value">{value}</div>
            <div className="big-score-label">Overall BIG Score</div>
            <div className="big-score-target">Target: {target}</div>
          </div>
          
          <div className="big-score-components">
            {scoreComponents.map((component, index) => (
              <div key={component.name} className="score-component">
                <div className="component-header">
                  <span className="component-name">{component.name}</span>
                  <span className="component-value">{component.value}</span>
                </div>
                <div className="component-bar">
                  <div 
                    className="component-progress"
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
        
        <div className="chart-summary">
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

  // NEW: Enhanced Funding Ready Infographic
  const EnhancedFundingReady = ({ value, target, title, description }) => {
    const readinessData = [
      { stage: 'Fully Ready', count: 59, percentage: 46, color: '#4CAF50' },
      { stage: 'Near Ready', count: 32, percentage: 25, color: '#FF9800' },
      { stage: 'Developing', count: 25, percentage: 20, color: '#FFC107' },
      { stage: 'Early Stage', count: 12, percentage: 9, color: '#F44336' }
    ];

    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        {description && <div className="visual-description">{description}</div>}
        
        <div className="funding-ready-infographic">
          <div className="readiness-main">
            <div className="readiness-value">{value}%</div>
            <div className="readiness-label">Funding Ready</div>
            <div className="readiness-target">Target: {target}%</div>
          </div>
          
          <div className="readiness-breakdown">
            {readinessData.map((item, index) => (
              <div key={item.stage} className="readiness-item">
                <div className="readiness-stage">
                  <div 
                    className="stage-color"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="stage-name">{item.stage}</span>
                </div>
                <div className="readiness-stats">
                  <span className="stage-count">{item.count} SMEs</span>
                  <span className="stage-percentage">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="readiness-gap">
            <div className="gap-label">Gap to Target:</div>
            <div className="gap-value">5 SMEs needed</div>
          </div>
        </div>
        
        <div className="chart-summary">
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

  // NEW: Enhanced SME Graduation Infographic
  const SMEGraduationInfographic = ({ value, target, title, description }) => {
    const graduationStages = [
      { stage: 'Graduated', count: 40, percentage: 31, color: '#4CAF50', description: 'Self-sustaining' },
      { stage: 'Near Graduation', count: 35, percentage: 27, color: '#8BC34A', description: '6-12 months' },
      { stage: 'Progressing', count: 28, percentage: 22, color: '#FFC107', description: '1-2 years' },
      { stage: 'Early Stage', count: 25, percentage: 20, color: '#FF9800', description: '2+ years' }
    ];

    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        {description && <div className="visual-description">{description}</div>}
        
        <div className="graduation-infographic">
          <div className="graduation-main">
            <div className="graduation-value">{value}%</div>
            <div className="graduation-label">Graduated to Bankable</div>
            <div className="graduation-subtitle">40 SMEs Successfully Graduated</div>
          </div>
          
          <div className="graduation-timeline">
            {graduationStages.map((item, index) => (
              <div key={item.stage} className="timeline-item">
                <div className="timeline-marker" style={{ backgroundColor: item.color }}>
                  <div className="marker-value">{item.percentage}%</div>
                </div>
                <div className="timeline-content">
                  <div className="timeline-stage">{item.stage}</div>
                  <div className="timeline-count">{item.count} SMEs</div>
                  <div className="timeline-description">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="graduation-impact">
            <div className="impact-item">
              <div className="impact-value">R 245M</div>
              <div className="impact-label">Total Revenue</div>
            </div>
            <div className="impact-item">
              <div className="impact-value">1,240</div>
              <div className="impact-label">Jobs Created</div>
            </div>
            <div className="impact-item">
              <div className="impact-value">R 89M</div>
              <div className="impact-label">Capital Raised</div>
            </div>
          </div>
        </div>
        
        <div className="chart-summary">
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

  // Gauge Component
  const GaugeChart = ({ value, target, min = 0, max = 100, title, description, showZones = true }) => {
    const percentage = ((value - min) / (max - min)) * 100;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    let color = '#4CAF50';
    if (value < 60) color = '#f44336';
    else if (value < 80) color = '#ff9800';

    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        {description && <div className="visual-description">{description}</div>}
        <div className="gauge-wrapper">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="8"
            />
            
            {showZones && (
              <>
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#f44336"
                  strokeWidth="8"
                  strokeDasharray={circumference * 0.6}
                  strokeDashoffset={circumference * 0.7}
                  transform="rotate(-90 60 60)"
                  opacity="0.3"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#ff9800"
                  strokeWidth="8"
                  strokeDasharray={circumference * 0.2}
                  strokeDashoffset={circumference * 0.1}
                  transform="rotate(-90 60 60)"
                  opacity="0.3"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#4CAF50"
                  strokeWidth="8"
                  strokeDasharray={circumference * 0.2}
                  strokeDashoffset={0}
                  transform="rotate(-90 60 60)"
                  opacity="0.3"
                />
              </>
            )}
            
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
            
            <text
              x="60"
              y="60"
              textAnchor="middle"
              dy="7"
              fontSize="20"
              fontWeight="bold"
              fill={color}
            >
              {value}
            </text>
          </svg>
        </div>
        {target && (
          <div className="gauge-target">
            Target: {target}
            {value >= target ? (
              <FiArrowUp className="trend-icon up" />
            ) : (
              <FiArrowDown className="trend-icon down" />
            )}
          </div>
        )}
      </div>
    );
  };

  // Enhanced Follow-on Funding Rate Component
  const EnhancedFollowOnFundingChart = ({ value, target, data, title, description }) => {
    const chartData = {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Follow-on Rate',
          data: data,
          backgroundColor: brownShades.map(color => color + '80'),
          borderColor: brownShades[2],
          borderWidth: 2
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 35,
          title: {
            display: true,
            text: 'Rate (%)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Quarter'
          }
        }
      }
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button className="info-icon-btn" title="Follow-on Funding Information">
            <FiInfo />
          </button>
        </div>
        {description && <div className="visual-description">{description}</div>}
        <div className="chart-area">
          <Bar data={chartData} options={options} />
        </div>
        <div className="follow-on-details">
          <div className="metric-breakdown">
            <div className="metric-item">
              <span className="metric-label">Current Quarter:</span>
              <span className="metric-value">{value}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Quarterly Avg:</span>
              <span className="metric-value">24.5%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Top Sector:</span>
              <span className="metric-value">Tech (42%)</span>
            </div>
          </div>
        </div>
        <div className="chart-summary">
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

  // NEW: Cost per Funded SME Infographic Component with Numbers in Pie Chart
  const CostPerSMEInfographic = ({ value, target, title, description }) => {
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
          borderColor: '#fff'
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.parsed}%`;
            }
          }
        }
      }
    };

    const plugins = [{
      id: 'centerText',
      afterDraw: (chart) => {
        const ctx = chart.ctx;
        const { chartArea: { left, right, top, bottom, width, height } } = chart;
        
        // Draw numbers on each slice
        chart.data.datasets.forEach((dataset, i) => {
          chart.getDatasetMeta(i).data.forEach((arc, index) => {
            const { x, y } = arc.tooltipPosition();
            const percentage = chart.data.labels[index] + ': ' + dataset.data[index];
            
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

    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        {description && <div className="visual-description">{description}</div>}
        
        <div className="cost-infographic">
          <div className="cost-main-metric">
            <div className="cost-value">R27,500</div>
            <div className="cost-label">Average Cost per Funded SME</div>
          </div>
          
          <div className="cost-breakdown">
            <div className="breakdown-chart">
              <Doughnut data={costData} options={options} plugins={plugins} />
            </div>
            
            <div className="breakdown-details">
              <div className="breakdown-item">
                <span className="breakdown-color" style={{backgroundColor: brownShades[0]}}></span>
                <span className="breakdown-label">Staff (45%)</span>
                <span className="breakdown-value">R12,375</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-color" style={{backgroundColor: brownShades[1]}}></span>
                <span className="breakdown-label">Operations (25%)</span>
                <span className="breakdown-value">R6,875</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-color" style={{backgroundColor: brownShades[2]}}></span>
                <span className="breakdown-label">Technology (15%)</span>
                <span className="breakdown-value">R4,125</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-color" style={{backgroundColor: brownShades[3]}}></span>
                <span className="breakdown-label">Travel (10%)</span>
                <span className="breakdown-value">R2,750</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-color" style={{backgroundColor: brownShades[4]}}></span>
                <span className="breakdown-label">Other (5%)</span>
                <span className="breakdown-value">R1,375</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="chart-summary">
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

  // NEW: Catalyst Engagement Score Bar Chart Component
  const CatalystEngagementChart = ({ value, target, data, title, description }) => {
    const chartData = {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Engagement Score',
          data: data,
          backgroundColor: brownShades[1],
          borderColor: brownShades[0],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: 'Target',
          data: [target, target, target, target],
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderColor: '#4CAF50',
          borderWidth: 2,
          borderDash: [5, 5],
          type: 'line',
          pointRadius: 0
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Engagement Score'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Quarter'
          },
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      }
    };

    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        {description && <div className="visual-description">{description}</div>}
        <div className="chart-area">
          <Bar data={chartData} options={options} />
        </div>
        <div className="engagement-details">
          <div className="engagement-metrics">
            <div className="metric">
              <span className="metric-label">Current Score:</span>
              <span className="metric-value">{value}/100</span>
            </div>
            <div className="metric">
              <span className="metric-label">Quarterly Trend:</span>
              <span className="metric-value positive">+2.5%</span>
            </div>
            <div className="metric">
              <span className="metric-label">Top Partner:</span>
              <span className="metric-value">Funder A (94)</span>
            </div>
          </div>
        </div>
        <div className="chart-summary">
          <div className="current-value">Current: {value}/100</div>
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

  // Time to Fund Chart Component
  const TimeToFundChart = ({ value, target, data, title, description }) => {
    const chartData = {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Days to Fund',
          data: data,
          backgroundColor: brownShades[0],
          borderColor: brownShades[1],
          borderWidth: 2,
          fill: false
        },
        {
          label: 'Target',
          data: [target, target, target, target],
          borderColor: '#4CAF50',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Days'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Quarter'
          }
        }
      }
    };

    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        {description && <div className="visual-description">{description}</div>}
        <div className="chart-area">
          <Line data={chartData} options={options} />
        </div>
        <div className="chart-summary">
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

  // Exit Repayment Ratio Chart Component
  const ExitRepaymentChart = ({ value, target, data, title, description }) => {
    const chartData = {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Exit/Repayment Ratio',
          data: data,
          borderColor: brownShades[5],
          backgroundColor: brownShades[5] + '20',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Target',
          data: [target, target, target, target],
          borderColor: '#4CAF50',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 20,
          title: {
            display: true,
            text: 'Ratio (%)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Quarter'
          }
        }
      }
    };

    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        {description && <div className="visual-description">{description}</div>}
        <div className="chart-area">
          <Line data={chartData} options={options} />
        </div>
        <div className="chart-summary">
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

  const generateBarData = (labels, data, label, colorIndex, xAxisTitle, yAxisTitle) => ({
    labels,
    datasets: [{
      label,
      data,
      backgroundColor: brownShades[colorIndex % brownShades.length],
      borderColor: brownShades[(colorIndex + 1) % brownShades.length],
      borderWidth: 1
    }]
  });

  const generateLineData = (labels, datasets, xAxisTitle, yAxisTitle) => ({
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
    }))
  });

  const generatePieData = (labels, data) => ({
    labels,
    datasets: [{
      data,
      backgroundColor: brownShades.slice(0, data.length),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  });

  const generateStackedBarData = (labels, datasets, xAxisTitle, yAxisTitle) => ({
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.values,
      backgroundColor: brownShades[i % brownShades.length],
      borderColor: brownShades[i % brownShades.length],
      borderWidth: 1
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

  // Section Purpose Component
  const SectionPurpose = ({ purpose }) => (
    <div className="section-purpose">
      <div className="purpose-text">
        <strong>Section Purpose:</strong> {purpose}
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

  // Data for ALL sections
  const sectionData = {
    'Portfolio Overview': {
      icon: <FiEye />,
      purpose: 'Provide a high-level snapshot of overall performance and exposure at a glance',
      content: (
        <div className="portfolio-overview">
          <div className="section-header">
            <SectionPurpose purpose="Provide a high-level snapshot of overall performance and exposure at a glance" />
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
              <div className="chart-container">
                <h3 className="chart-title">Total Portfolio Value / Exposure</h3>
                <div className="visual-description">Quarterly portfolio value trend</div>
                <div className="chart-area">
                  <Bar 
                    data={generateBarData(
                      ['Q1', 'Q2', 'Q3', 'Q4'],
                      [280, 295, 305, 312],
                      'Portfolio Value (R millions)',
                      0,
                      'Quarter',
                      'Value (R millions)'
                    )}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `R${context.parsed} million`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Quarter'
                          }
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Value (R millions)'
                          },
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <ActiveSMEsCircleChart
                value="128"
                title="# of Active SMEs"
                description="Total number of active SMEs in portfolio"
              />

              <BIGScoreInfographic 
                value={78.4} 
                target={80} 
                title="Avg. BIG Score"
                description="Detailed breakdown of BIG Score components"
              />

              <EnhancedFundingReady 
                value={46} 
                target={50} 
                title='% Portfolio "Funding Ready"'
                description='Shows readiness ratio with detailed breakdown'
              />
            </div>

            {/* BOTTOM ROW - 4 charts */}
            <div className="bottom-row">
              <div className="chart-container">
                <h3 className="chart-title">Funding Facilitated</h3>
                <div className="visual-description">Monthly funding distribution</div>
                <div className="chart-area">
                  <Bar 
                    data={generateBarData(
                      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                      [15, 18, 22, 20, 25, 28],
                      'Funding (R millions)',
                      2,
                      'Month',
                      'Funding (R millions)'
                    )}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `R${context.parsed} million`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Month'
                          }
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Funding (R millions)'
                          },
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <TimeToFundChart
                value={32}
                target={30}
                data={getTimeData(timeToFundView, timeToFundData.Monthly, timeToFundData.Quarterly, timeToFundData.Yearly)}
                title="Avg. Time-to-Fund"
                description="Average days from application to funding disbursement"
              />

              <EnhancedFollowOnFundingChart
                value={27}
                target={30}
                data={[22, 24, 25, 27]}
                title="Follow-on Funding Rate"
                description="Percentage of SMEs receiving additional funding with sector breakdown"
              />

              <ExitRepaymentChart
                value={12}
                target={15}
                data={[10, 11, 12, 12]}
                title="Exit / Repayment Ratio"
                description="Percentage of exited or repaid investments"
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
            <SectionPurpose purpose="Show diversification and concentration by sector, stage, location, etc." />
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
              description="Shows breakdown by Early/Growth/Mature/Exit-ready"
              labels={['Early', 'Growth', 'Mature', 'Exit-ready']}
              data={[22, 41, 27, 10]}
            />

            <div className="chart-container">
              <h3 className="chart-title">By Industry / Sector</h3>
              <div className="visual-description">Highlights sector diversification</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['Manufacturing', 'Services', 'Agriculture', 'Retail', 'Tech'],
                    [28, 24, 20, 18, 10],
                    '% Capital',
                    1,
                    'Sector',
                    '% of Capital'
                  )}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: '% of Capital'
                        },
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">By Geography</h3>
              <div className="visual-description">Displays provincial distribution with hover tooltips</div>
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

            <div className="chart-container">
              <h3 className="chart-title">By Funding Instrument</h3>
              <div className="visual-description">Shows allocation by debt/equity/grant/EaaS</div>
              <div className="chart-area">
                <Bar 
                  data={generateStackedBarData(
                    ['Equity', 'Debt', 'Grant', 'EaaS'],
                    [
                      { label: 'Current', values: [120, 95, 45, 52] },
                      { label: 'Target', values: [130, 100, 50, 70] }
                    ],
                    'Instrument Type',
                    'ZAR millions'
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { 
                        stacked: true,
                        title: {
                          display: true,
                          text: 'Instrument Type'
                        }
                      },
                      y: { 
                        stacked: true,
                        title: {
                          display: true,
                          text: 'ZAR millions'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <PieChartWithNumbers
              title="By Demographic / Ownership"
              description="Highlights women/youth/black-owned ratios"
              labels={['Women-led', 'Youth-led', 'Black-owned', 'Other']}
              data={[38, 24, 72, 16]}
            />
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
            <SectionPurpose purpose="Show pipeline strength and forecast future capital needs" />
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
              <div className="chart-container">
                <h3 className="chart-title">Pipeline Stage Aging</h3>
                <div className="visual-description">Age distribution of pipeline</div>
                <div className="chart-area">
                  <Bar 
                    data={generateBarData(
                      ['&lt;1 month', '1-3 months', '3-6 months', '&gt;6 months'],
                      [15, 24, 30, 10],
                      '# of SMEs',
                      0,
                      'Age Category',
                      '# of SMEs'
                    )}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: '# of SMEs'
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Age Category'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="chart-container">
                <h3 className="chart-title">Conversion Funnel (App→Approval→Disburse)</h3>
                <div className="visual-description">Displays application conversion efficiency</div>
                <div className="chart-area">
                  <FunnelChart 
                    stages={['Application', 'Approval', 'Disbursed']}
                    values={[28, 45, 82]}
                    colors={[brownShades[0], brownShades[1], brownShades[2]]}
                  />
                </div>
              </div>

              <div className="chart-container">
                <h3 className="chart-title">Forecasted Capital Requirement (Next 12mo)</h3>
                <div className="visual-description">Forecasted need by instrument</div>
                <div className="chart-area">
                  <Bar 
                    data={generateStackedBarData(
                      ['Q1', 'Q2', 'Q3', 'Q4'],
                      [
                        { label: 'Debt', values: [35, 40, 45, 50] },
                        { label: 'Equity', values: [22, 25, 28, 30] },
                        { label: 'Grants', values: [15, 18, 20, 22] }
                      ],
                      'Quarter',
                      'ZAR millions'
                    )}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        x: { 
                          stacked: true,
                          title: {
                            display: true,
                            text: 'Quarter'
                          }
                        },
                        y: { 
                          stacked: true,
                          title: {
                            display: true,
                            text: 'ZAR millions'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <PieChartWithNumbers
                title="Data Confidence Meter"
                description="Highlights data reliability"
                labels={['Verified', 'Partial', 'Unverified']}
                data={[78, 15, 7]}
              />
            </div>

            {/* BOTTOM - Full width table */}
            <div className="bottom-full">
              <div className="chart-container full-width">
                <h3 className="chart-title">Co-Invest / Support Opportunities</h3>
                <div className="visual-description">Ranked table of co-investment candidates</div>
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
    },
    'Exit & Liquidity Metrics': {
      icon: <FiLiquidity />,
      purpose: 'Measure realized outcomes, repayments, and liquidity flow',
      content: (
        <div className="exit-liquidity">
          <div className="section-header">
            <SectionPurpose purpose="Measure realized outcomes, repayments, and liquidity flow" />
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
            <div className="chart-container">
              <h3 className="chart-title">Exit / Repayment History</h3>
              <div className="visual-description">Exit trends over time</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['Q1', 'Q2', 'Q3', 'Q4'],
                    [2, 4, 5, 7],
                    '# of Exits',
                    0,
                    'Quarter',
                    '# of Exits'
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: '# of Exits'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Quarter'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">Avg. Time-to-Exit</h3>
              <div className="visual-description">Average months to exit</div>
              <div className="chart-area">
                <Line 
                  data={generateLineData(
                    getTimeData(timeToExitView, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], ['Q1', 'Q2', 'Q3', 'Q4'], ['2021', '2022', '2023', '2024']),
                    [
                      { label: 'Avg Months', values: getTimeData(timeToExitView, timeToExitData.Monthly, timeToExitData.Quarterly, timeToExitData.Yearly) },
                      { label: 'Target (&lt;32)', values: getTimeData(timeToExitView, [32, 32, 32, 32, 32, 32], [32, 32, 32, 32], [32, 32, 32, 32]) }
                    ],
                    timeToExitView,
                    'Months'
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: timeToExitView
                        }
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Months'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">Exit Multiple</h3>
              <div className="visual-description">Return multiples for exited equity deals</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['Deal A', 'Deal B', 'Deal C', 'Deal D', 'Deal E'],
                    [1.8, 2.4, 3.0, 2.1, 2.8],
                    'Multiple (x)',
                    1,
                    'Deal',
                    'Multiple (x)'
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Multiple (x)'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Deal'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <PieChartWithNumbers
              title="Reinvestment Ratio"
              description="Share of capital recycled"
              labels={['Reinvested', 'Held']}
              data={[64, 36]}
            />

            <SMEGraduationInfographic
              value={31}
              target={35}
              title="SME Graduation to Bankable"
              description="% of SMEs now self-sustaining with impact metrics"
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
            <SectionPurpose purpose="Track funder/catalyst performance and operational efficiency" />
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
          
          <div className="funder-charts-grid">
            <div className="chart-container">
              <h3 className="chart-title">Applications Reviewed vs Funded</h3>
              <div className="visual-description">Compares funnel volumes</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['Reviewed', 'Approved', 'Funded'],
                    [210, 85, 46],
                    '# of apps',
                    0,
                    'Stage',
                    '# of Applications'
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: '# of Applications'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Stage'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">Avg. Vetting Time</h3>
              <div className="visual-description">Efficiency metric</div>
              <div className="chart-area">
                <Line 
                  data={generateLineData(
                    getTimeData(vettingTimeView, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], ['Q1', 'Q2', 'Q3', 'Q4'], ['2021', '2022', '2023', '2024']),
                    [{ label: 'Days', values: getTimeData(vettingTimeView, vettingTimeData.Monthly, vettingTimeData.Quarterly, vettingTimeData.Yearly) }],
                    vettingTimeView,
                    'Days'
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: vettingTimeView
                        }
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Days'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* FIXED: Cost per Funded SME - Now using infographic with numbers in pie chart */}
            <CostPerSMEInfographic
              value={75}
              target={80}
              title="Cost per Funded SME"
              description="Detailed breakdown of operational costs per funded SME"
            />

            <div className="chart-container">
              <h3 className="chart-title">Active Partnerships / Co-Funders</h3>
              <div className="visual-description">Lists top partners by activity</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['Funder A', 'Funder B', 'Funder C', 'Funder D'],
                    [12, 9, 7, 5],
                    '# SMEs co-funded',
                    2,
                    'Funder',
                    '# SMEs co-funded'
                  )}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: '# SMEs co-funded'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* FIXED: Catalyst Engagement Score - Now using proper bar chart */}
            <CatalystEngagementChart
              value={82}
              target={85}
              data={[78, 80, 81, 82]}
              title="Catalyst Engagement Score"
              description="Quarterly engagement performance with partners"
            />
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
            <SectionPurpose purpose="Provide AI-driven opportunities, risks, and alerts" />
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
              <div className="visual-description">Ranked actionable table</div>
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
              <div className="visual-description">Risk alerts table</div>
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
              <div className="visual-description">Small trend mini-cards ("Defaults ↓ 5.6%")</div>
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
    'Performance & Risk Dashboard': {
      icon: <FiBarChart2 />,
      purpose: 'Assess growth, risk, and inclusion performance of portfolio',
      content: (
        <div className="performance-risk">
          <div className="section-header">
            <SectionPurpose purpose="Assess growth, risk, and inclusion performance of portfolio" />
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
            <div className="chart-container">
              <h3 className="chart-title">Default / Non-performing Ratio</h3>
              <div className="visual-description">Tracks decline in defaults</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['Q1', 'Q2', 'Q3', 'Q4'],
                    [7.5, 9.8, 6.1, 4.2],
                    '% Defaults',
                    0,
                    'Quarter',
                    '% of active loans'
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Quarter'
                        }
                      },
                      y: {
                        beginAtZero: true,
                        max: 12,
                        title: {
                          display: true,
                          text: '% of active loans'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">SME Growth Index</h3>
              <div className="visual-description">Shows average revenue growth vs benchmark</div>
              <div className="chart-area">
                <Line 
                  data={generateLineData(
                    ['Q1', 'Q2', 'Q3', 'Q4'],
                    [
                      { label: 'Revenue Growth', values: [9, 10, 12, 11] },
                      { label: 'Benchmark (8%)', values: [8, 8, 8, 8] }
                    ],
                    'Quarter',
                    '% Revenue Growth QoQ'
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Quarter'
                        }
                      },
                      y: {
                        title: {
                          display: true,
                          text: '% Revenue Growth QoQ'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">Job Creation / Retention</h3>
              <div className="visual-description">Shows jobs created by sector</div>
              <div className="chart-area">
                <Bar 
                  data={generateStackedBarData(
                    ['Agriculture', 'Services', 'Manufacturing', 'Retail', 'Tech'],
                    [
                      { label: 'New Jobs', values: [800, 1000, 600, 400, 300] },
                      { label: 'Retained Jobs', values: [400, 500, 400, 300, 200] }
                    ],
                    'Sector',
                    '# of jobs'
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { 
                        stacked: true,
                        title: {
                          display: true,
                          text: 'Sector'
                        }
                      },
                      y: { 
                        stacked: true,
                        title: {
                          display: true,
                          text: '# of jobs'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">SME Graduation Rate (to 80+ BIG Score)</h3>
              <div className="visual-description">Indicates progress in improving SME readiness</div>
              <div className="chart-area">
                <Line 
                  data={generateLineData(
                    ['Q1', 'Q2', 'Q3', 'Q4'],
                    [
                      { label: 'Graduation Rate', values: [15, 17, 18, 19] },
                      { label: 'Target (25%)', values: [20, 21, 23, 25] }
                    ],
                    'Quarter',
                    '% of SMEs'
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Quarter'
                        }
                      },
                      y: {
                        beginAtZero: true,
                        max: 30,
                        title: {
                          display: true,
                          text: '% of SMEs'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">Diversity & Inclusion Score</h3>
              <div className="visual-description">Compares actual vs target inclusion values</div>
              <div className="chart-area">
                <Radar 
                  data={generateRadarData(
                    ['Women', 'Youth', 'Rural', 'Black-owned'],
                    [38, 24, 45, 72],
                    [35, 25, 40, 70]
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
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
            <SectionPurpose purpose="Measure environmental, social, and governance outcomes" />
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
            <div className="chart-container">
              <h3 className="chart-title">ESG Pillar Scores (E, S, G)</h3>
              <div className="visual-description">Shows average ESG performance</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['Environmental', 'Social', 'Governance'],
                    [62, 81, 74],
                    'Score (0-100)',
                    1,
                    'Pillar',
                    'Score (0-100)'
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Score (0-100)'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Pillar'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">SDG Alignment</h3>
              <div className="visual-description">Highlights SDG coverage (8, 9, 5, 11)</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['SDG8', 'SDG9', 'SDG5', 'SDG11'],
                    [64, 41, 38, 32],
                    '% of portfolio',
                    2,
                    'SDG',
                    '% of portfolio'
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: '% of portfolio'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'SDG'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <PieChartWithNumbers
              title="Governance Compliance Health"
              description="Displays compliance ratio from BIG Score data"
              labels={['Compliant', 'Partial', 'At Risk']}
              data={[72, 21, 7]}
            />

            <div className="chart-container full-width">
              <h3 className="chart-title">Top 5 ESG Contributors</h3>
              <div className="visual-description">Lists SMEs with notable ESG impacts</div>
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
            <SectionPurpose purpose="Ensure transparency, compliance, and auditability" />
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
              <div className="visual-description">Shows compliance per SME</div>
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

            <PieChartWithNumbers
              title="Data Confidence Meter"
              description="Highlights data reliability"
              labels={['Verified', 'Partial', 'Unverified']}
              data={[76, 18, 6]}
            />
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

  const allCategories = Object.keys(sectionData);
  const topCategories = allCategories.slice(0, 5);
  const bottomCategories = allCategories.slice(5);

  return (
    <div className="investments-container" style={getContainerStyles()}>
      <div className="investments-content">
        <h2 className="investments-title">My Investments</h2>

        {/* Top Categories Row - 5 tabs - FIXED alignment */}
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

        {/* Bottom Categories Row - 4 tabs - FIXED alignment */}
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
    </div>
  );
};

export default MyInvestments;