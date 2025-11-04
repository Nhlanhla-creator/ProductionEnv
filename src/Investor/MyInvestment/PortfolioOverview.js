// tabs/PortfolioOverview.js
import React, { useState } from 'react';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import { FiEye, FiArrowUp, FiArrowDown } from 'react-icons/fi';
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
  Legend
} from 'chart.js';

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
  Legend
);

// Styles for PortfolioOverview
const styles = `
.portfolio-overview {
  width: 100%;
}

.time-view-controls {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 0 10px;
}

.time-view-selector {
  display: flex;
  gap: 8px;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 8px;
  align-items: center;
}

.time-view-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  margin-right: 8px;
}

.time-view-btn {
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  color: #666;
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.time-view-btn.active {
  background-color: #7d5a36;
  color: white;
}

.time-view-btn:hover:not(.active) {
  background-color: #e0e0e0;
  transform: none !important;
  animation: none !important;
}

.charts-grid-4x4 {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 10px;
}

.top-row,
.bottom-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 420px;
  position: relative;
  overflow: hidden;
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.chart-container:hover {
  transform: none !important;
  animation: none !important;
  transition: none !important;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.chart-title {
  margin: 0 0 10px 0;
  color: #5e3f26;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 1px solid #ede4d8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  line-height: 1.3;
  min-height: 40px;
}

.breakdown-icon-btn {
  background: none;
  border: none;
  color: #7d5a36;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.breakdown-icon-btn:hover {
  background: #f0f0f0;
  transform: none !important;
  animation: none !important;
}

.chart-title-fixed {
  font-size: 14px;
  font-weight: 600;
  color: #7d5a36;
  margin-bottom: 15px;
  text-align: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #7d5a36;
}

.chart-area {
  flex-grow: 1;
  min-height: 240px;
  position: relative;
  margin-bottom: 10px;
}

.chart-area-ultra-compact {
  flex-grow: 1;
  min-height: 280px;
  position: relative;
  margin-bottom: 5px;
}

.chart-summary-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding: 12px 15px;
  background: #f8f9fa;
  border-radius: 6px;
  border-top: 1px solid #e0e0e0;
}

.chart-summary-ultra-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  background: #f8f9fa;
  padding: 12px 15px;
  border-radius: 6px;
  margin-bottom: 0;
}

.current-value {
  font-weight: 600;
  color: #5e3f26;
  font-size: 13px;
}

.target-value {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #666;
}

.trend-icon {
  font-size: 14px;
}

.trend-icon.up {
  color: #4CAF50;
}

.trend-icon.down {
  color: #f44336;
}

/* BIG Score Circular Design */
.big-score-circular {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 15px;
}

.circular-progress {
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circular-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.big-score-value-circular {
  font-size: 32px;
  font-weight: 700;
  color: #5e3f26;
  line-height: 1;
  margin-bottom: 4px;
}

.big-score-label-circular {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.circular-target {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #7d5a36;
  font-weight: 500;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 6px;
}

/* Funding Ready Styles */
.funding-ready-simple {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.readiness-main-simple {
  text-align: center;
  padding: 30px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 3px solid #7d5a36;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.readiness-value-simple {
  font-size: 42px;
  font-weight: 700;
  color: #5e3f26;
  margin-bottom: 8px;
  line-height: 1;
}

.readiness-label-simple {
  font-size: 16px;
  color: #666;
  font-weight: 500;
  margin-bottom: 6px;
}

.readiness-target-simple {
  font-size: 14px;
  color: #7d5a36;
  font-weight: 500;
}

/* Popup Styles */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.popup-container {
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.popup-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.popup-close:hover {
  background: #f0f0f0;
  color: #333;
  transform: none !important;
  animation: none !important;
}

.popup-content {
  width: 100%;
}

.popup-content h3 {
  margin: 0 0 20px 0;
  color: #5e3f26;
  font-size: 24px;
  text-align: center;
  border-bottom: 2px solid #ede4d8;
  padding-bottom: 15px;
}

.popup-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  text-align: center;
  line-height: 1.5;
  font-style: italic;
  background: #f8f9fa;
  padding: 12px 15px;
  border-radius: 6px;
  border-left: 3px solid #7d5a36;
}

.popup-chart {
  height: 300px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #7d5a36;
}

.detail-label {
  font-weight: 600;
  color: #5e3f26;
  font-size: 14px;
}

.detail-value {
  font-weight: 600;
  color: #7d5a36;
  font-size: 14px;
}

.detail-value.positive {
  color: #4CAF50;
}

/* BIG Score Popup Styles */
.big-score-popup {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.big-score-main-popup {
  text-align: center;
  padding: 25px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 3px solid #7d5a36;
}

.big-score-value {
  font-size: 48px;
  font-weight: 700;
  color: #5e3f26;
  margin-bottom: 10px;
}

.big-score-label {
  font-size: 18px;
  color: #666;
  font-weight: 500;
  margin-bottom: 8px;
}

.big-score-target {
  font-size: 14px;
  color: #7d5a36;
  font-weight: 500;
}

/* Funding Ready Popup Styles */
.funding-ready-popup {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.readiness-main-popup {
  text-align: center;
  padding: 25px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 3px solid #7d5a36;
}

.readiness-value {
  font-size: 48px;
  font-weight: 700;
  color: #5e3f26;
  margin-bottom: 10px;
}

.readiness-label {
  font-size: 18px;
  color: #666;
  font-weight: 500;
  margin-bottom: 8px;
}

.readiness-target {
  font-size: 14px;
  color: #7d5a36;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .top-row,
  .bottom-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-container {
    height: 400px;
  }
}

@media (max-width: 992px) {
  .chart-container {
    height: 380px;
  }
}

@media (max-width: 768px) {
  .top-row,
  .bottom-row {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 350px;
    padding: 15px;
  }
  
  .chart-summary-compact,
  .chart-summary-ultra-compact {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .chart-summary-compact .current-value,
  .chart-summary-compact .target-value,
  .chart-summary-ultra-compact .current-value,
  .chart-summary-ultra-compact .target-value {
    justify-content: center;
    text-align: center;
  }
  
  .big-score-value-circular {
    font-size: 28px;
  }
  
  .big-score-value-simple,
  .readiness-value-simple {
    font-size: 36px;
  }
}

@media (max-width: 576px) {
  .chart-container {
    padding: 15px;
    height: 320px;
  }
  
  .time-view-controls,
  .charts-grid-4x4 {
    padding: 0 5px;
  }
  
  .big-score-value-circular {
    font-size: 24px;
  }
  
  .big-score-label-circular {
    font-size: 12px;
  }
  
  .big-score-value-simple,
  .readiness-value-simple {
    font-size: 32px;
  }
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

const brownShades = [
  '#5e3f26', '#7d5a36', '#9c7c54', '#b8a082',
  '#3f2a18', '#d4c4b0', '#5D4037', '#3E2723'
];

// Static chart options
const staticBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        drawBorder: false
      }
    }
  }
};

const staticLineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  elements: {
    line: {
      tension: 0
    },
    point: {
      radius: 3,
      hoverRadius: 5
    }
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        usePointStyle: true,
        pointStyle: 'line',
        boxWidth: 15,
        boxHeight: 2,
        padding: 15,
        font: {
          size: 11
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        drawBorder: false
      }
    }
  }
};

const staticPieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
};

const PortfolioOverview = ({ openPopup, downloadSectionAsPDF }) => {
  const [timeToFundView, setTimeToFundView] = useState('Quarterly');

  // Time view data
  const timeToFundData = {
    Monthly: [35, 34, 33, 32, 32, 31],
    Quarterly: [35, 33, 32, 32],
    Yearly: [36, 34, 32, 30]
  };

  const getTimeData = (view, monthlyData, quarterlyData, yearlyData) => {
    switch (view) {
      case 'Monthly': return monthlyData;
      case 'Quarterly': return quarterlyData;
      case 'Yearly': return yearlyData;
      default: return quarterlyData;
    }
  };

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

  // Data generation functions
  const generateBarData = (labels, data, label, colorIndex) => ({
    labels,
    datasets: [{
      label,
      data,
      backgroundColor: brownShades[colorIndex % brownShades.length],
      borderColor: brownShades[(colorIndex + 1) % brownShades.length],
      borderWidth: 1
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
      fill: ds.fill || false,
      tension: 0
    }))
  });

  // Chart Components
  const BarChartWithTitle = ({ data, title, chartTitle, chartId }) => {
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">
            Detailed breakdown of {title.toLowerCase()}
          </div>
          <div className="popup-chart">
            <Bar data={data} options={staticBarOptions} />
          </div>
          <div className="popup-details">
            {data.labels.map((label, index) => (
              <div key={label} className="detail-item">
                <span className="detail-label">{label}:</span>
                <span className="detail-value">{data.datasets[0].data[index]}</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
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
        <div className="chart-title-fixed">{chartTitle}</div>
        <div className="chart-area">
          <Bar data={data} options={staticBarOptions} />
        </div>
      </div>
    );
  };

  // UPDATED: BIG Score Circular Component
  const BIGScoreInfographic = ({ value, target, title }) => {
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>BIG Score Breakdown</h3>
          <div className="popup-description">
            Detailed breakdown of BIG Score components across compliance, legitimacy, leadership, governance, and capital appeal
          </div>
          <div className="big-score-popup">
            <div className="big-score-main-popup">
              <div className="big-score-value">{value}</div>
              <div className="big-score-label">Overall BIG Score</div>
              <div className="big-score-target">Target: {target}</div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
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
        
        <div className="big-score-circular">
          <div className="circular-progress">
            <svg width="140" height="140" viewBox="0 0 140 140">
              {/* Background circle */}
              <circle
                cx="70"
                cy="70"
                r="60"
                stroke="#e0e0e0"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="70"
                cy="70"
                r="60"
                stroke="#7d5a36"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="377"
                strokeDashoffset={377 - (377 * value) / 100}
                transform="rotate(-90 70 70)"
              />
            </svg>
            <div className="circular-content">
              <div className="big-score-value-circular">{value}</div>
              <div className="big-score-label-circular">BIG Score</div>
            </div>
          </div>
          <div className="circular-target">
            Target: {target}
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

  // Enhanced Funding Ready Component
  const EnhancedFundingReady = ({ value, target, title }) => {
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Funding Ready Breakdown</h3>
          <div className="popup-description">
            Shows readiness ratio with detailed breakdown across fully ready, near ready, developing, and early stage SMEs
          </div>
          <div className="funding-ready-popup">
            <div className="readiness-main-popup">
              <div className="readiness-value">{value}%</div>
              <div className="readiness-label">Funding Ready</div>
              <div className="readiness-target">Target: {target}%</div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
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
        
        <div className="funding-ready-simple">
          <div className="readiness-main-simple">
            <div className="readiness-value-simple">{value}%</div>
            <div className="readiness-label-simple">Funding Ready</div>
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

  // Active SMEs Pie Chart Component WITH NUMBERS
  const ActiveSMEsPieChart = ({ title }) => {
    const data = {
      labels: ['Early Stage', 'Growth Stage', 'Mature Stage', 'Exit-ready'],
      datasets: [{
        data: [28, 45, 35, 20],
        backgroundColor: [brownShades[0], brownShades[1], brownShades[2], brownShades[3]],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 0
      }]
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
            ctx.textAlign= 'center';
            ctx.textBaseline= 'middle';
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
          <div className="popup-description">
            Distribution of active SMEs across different business stages
          </div>
          <div className="popup-chart">
            <Pie data={data} options={staticPieOptions} plugins={plugins} />
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
      <div className="chart-container">
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
        <div className="chart-area">
          <Pie data={data} options={staticPieOptions} plugins={plugins} />
        </div>
      </div>
    );
  };

  // FIXED: Time to Fund Chart Component with working line legends
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
          label: 'Target (<30 days)',
          data: Array(data.length).fill(target),
          borderColor: '#4CAF50',
          backgroundColor: 'transparent',
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
            padding: 10,
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y + ' days';
              }
              return label;
            }
          }
        }
      }
    };

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Time to Fund Details</h3>
          <div className="popup-description">
            Average time to fund deals vs target over time. Lower values indicate faster funding processing.
          </div>
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
      <div className="chart-container">
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

  // Enhanced Follow-on Funding Rate Component
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
          <div className="popup-description">
            Follow-on funding rates over quarters with detailed breakdown. Higher rates indicate successful portfolio company growth.
          </div>
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
      <div className="chart-container">
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

  // FIXED: Exit Repayment Chart Component with working line legends
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
          label: 'Target (>15%)',
          data: Array(data.length).fill(target),
          borderColor: '#4CAF50',
          backgroundColor: 'transparent',
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
            padding: 10,
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y + '%';
              }
              return label;
            }
          }
        }
      }
    };

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Exit/Repayment Details</h3>
          <div className="popup-description">
            Exit and repayment ratio performance over time. Higher ratios indicate successful exits and loan repayments.
          </div>
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
      <div className="chart-container">
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

  return (
    <div className="portfolio-overview">
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
  );
};

export default PortfolioOverview;