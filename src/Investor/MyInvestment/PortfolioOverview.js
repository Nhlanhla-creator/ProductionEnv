// tabs/PortfolioOverview.js
import React, { useState, useEffect } from 'react';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import { FiEye, FiArrowUp, FiArrowDown, FiEdit } from 'react-icons/fi';
import { db, auth } from '../../firebaseConfig'; 
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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

// Import sub-tab components
import PortfolioComposition from './PortfolioComposition';
import FunderHealthEfficiency from './FunderHealthEfficiency';

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

/* Main tabs container */
.main-tabs-container {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  border-bottom: 1px solid #c4c4c4;
  padding-bottom: 12px;
}

.main-tab-btn {
  padding: 6px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  border: 1.5px solid #c4c4c4;
  font-weight: 500;
  background: #fff;
  color: #4a4a4a;
}

.main-tab-btn.active {
  border-color: #8b694e;
  font-weight: 700;
  background: #8b694e;
  color: #fff;
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
}

.time-view-btn.active {
  background-color: #7d5a36;
  color: white;
}

.time-view-btn:hover:not(.active) {
  background-color: #e0e0e0;
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
}

.breakdown-icon-btn:hover {
  background: #f0f0f0;
}

.edit-icon-btn {
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
  margin-left: 8px;
}

.edit-icon-btn:hover {
  background: #f0f0f0;
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

/* Funding Ready Circular Styles */
.funding-ready-circular {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 15px;
}

.funding-ready-value-circular {
  font-size: 32px;
  font-weight: 700;
  color: #5e3f26;
  line-height: 1;
  margin-bottom: 4px;
}

.funding-ready-label-circular {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* Time to Fund Legend Styles */
.time-to-fund-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 3px;
  border-radius: 2px;
}

.legend-color.days-to-fund {
  background-color: #5e3f26;
}

.legend-color.target-line {
  background-color: #4CAF50;
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
}

.popup-close:hover {
  background: #f0f0f0;
  color: #333;
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

/* Data Input Form Styles */
.data-input-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  color: #5e3f26;
  font-size: 14px;
}

.form-input {
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #7d5a36;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background-color: #7d5a36;
  color: white;
}

.btn-primary:hover {
  background-color: #5e3f26;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #666;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .top-row,
  .bottom-row {
    grid-template-columns: repeat(2, 1fr);
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
  
  .time-view-controls {
    justify-content: center;
  }
}

@media (max-width: 576px) {
  .chart-container {
    padding: 15px;
    height: 320px;
  }
  
  .main-tabs-container {
    flex-wrap: wrap;
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
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { drawBorder: false } }
  }
};

const staticLineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  elements: { line: { tension: 0 }, point: { radius: 3, hoverRadius: 5 } },
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { drawBorder: false } }
  }
};

const staticPieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { position: 'bottom' } }
};

// Helper functions (simplified versions for demo - in production, these would fetch real data)
const getFinancialYearMonths = () => ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const getQuarterLabels = () => ['Q1', 'Q2', 'Q3', 'Q4'];

// ==================== MAIN PORTFOLIO OVERVIEW COMPONENT ====================
const PortfolioOverview = ({ openPopup, downloadSectionAsPDF, currentUser }) => {
  const [activeMainTab, setActiveMainTab] = useState("overview"); // overview, composition, efficiency
  const [timeToFundView, setTimeToFundView] = useState('Quarterly');
  const [fundingFacilitatedData, setFundingFacilitatedData] = useState([15, 18, 22, 20, 25, 28]);
  const [showFundingInput, setShowFundingInput] = useState(false);
  const [portfolioData, setPortfolioData] = useState({
    activeSMEs: { 'Micro': 6, 'Small': 12, 'Medium': 8, 'Large': 3 },
    averageBIGScore: { averageScore: 74, individualScores: [], totalSMEs: 29 },
    fundingReadyPercentage: { fundingReadyPercentage: 65, fundingReadyCount: 19, totalCount: 29, fundingReadySMEs: [] },
    portfolioValue: { currentValue: 187, quarterlyData: [45, 42, 48, 52], monthlyData: [15, 18, 22, 20, 25, 28], yearlyData: [187], yearlyLabels: ['2024'], financialYearStartMonth: 6, totalDeals: 12, totalInvestment: 187000000 },
    timeToFund: { averageDays: 35, timeToFundData: [38, 36, 34, 32], monthlyTimeToFundData: [40, 38, 37, 36, 35, 34], yearlyTimeToFundData: [35], yearlyTimeToFundLabels: ['2024'], totalSMEs: 29, allProcessingTimes: [], financialYearStartMonth: 6 },
    loading: false,
    usingFallback: true
  });

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

  const getTimeData = (view, dataObject) => {
    return dataObject[view] || dataObject.Quarterly;
  };

  const getTimeLabels = (view) => {
    switch (view) {
      case 'Monthly': return getFinancialYearMonths();
      case 'Quarterly': return getQuarterLabels();
      case 'Yearly': return portfolioData.portfolioValue.yearlyLabels;
      default: return getQuarterLabels();
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

  // Portfolio Value Chart
  const portfolioValueData = {
    Monthly: portfolioData.portfolioValue.monthlyData,
    Quarterly: portfolioData.portfolioValue.quarterlyData,
    Yearly: portfolioData.portfolioValue.yearlyData
  };

  const timeToFundData = {
    Monthly: portfolioData.timeToFund.monthlyTimeToFundData,
    Quarterly: portfolioData.timeToFund.timeToFundData,
    Yearly: portfolioData.timeToFund.yearlyTimeToFundData
  };

  // BarChart Component
  const BarChartWithTitle = ({ data, title, chartTitle }) => {
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">Detailed breakdown of {title.toLowerCase()}</div>
          <div className="popup-chart"><Bar data={data} options={staticBarOptions} /></div>
          <div className="popup-details">
            {data.labels.map((label, index) => (
              <div key={label} className="detail-item">
                <span className="detail-label">{label}:</span>
                <span className="detail-value">R {data.datasets[0].data[index]} million</span>
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
          <button className="breakdown-icon-btn" onClick={handleEyeClick}><FiEye /></button>
        </div>
        <div className="chart-title-fixed">{chartTitle}</div>
        <div className="chart-area"><Bar data={data} options={staticBarOptions} /></div>
      </div>
    );
  };

  // Active SMEs Pie Chart
  const ActiveSMEsPieChart = ({ title }) => {
    const { activeSMEs, loading } = portfolioData;
    const data = {
      labels: ['Micro', 'Small', 'Medium', 'Large'],
      datasets: [{
        data: [activeSMEs.Micro, activeSMEs.Small, activeSMEs.Medium, activeSMEs.Large],
        backgroundColor: [brownShades[0], brownShades[1], brownShades[2], brownShades[3]],
        borderWidth: 2, borderColor: '#fff', hoverOffset: 0
      }]
    };

    const totalSMEs = activeSMEs.Micro + activeSMEs.Small + activeSMEs.Medium + activeSMEs.Large;

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Your Successful Deals Portfolio</h3>
          <div className="popup-description">Distribution of SMEs from your successful investment deals by business size</div>
          <div className="popup-chart"><Pie data={data} options={staticPieOptions} /></div>
          <div className="popup-details">
            <div className="detail-item"><span className="detail-label">Micro Enterprises:</span><span className="detail-value">{activeSMEs.Micro} SMEs</span></div>
            <div className="detail-item"><span className="detail-label">Small Enterprises:</span><span className="detail-value">{activeSMEs.Small} SMEs</span></div>
            <div className="detail-item"><span className="detail-label">Medium Enterprises:</span><span className="detail-value">{activeSMEs.Medium} SMEs</span></div>
            <div className="detail-item"><span className="detail-label">Large Enterprises:</span><span className="detail-value">{activeSMEs.Large} SMEs</span></div>
            <div className="detail-item"><span className="detail-label">Total SMEs:</span><span className="detail-value">{totalSMEs}</span></div>
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button className="breakdown-icon-btn" onClick={handleEyeClick}><FiEye /></button>
        </div>
        <div className="chart-area"><Pie data={data} options={staticPieOptions} /></div>
      </div>
    );
  };

  // BIG Score Circular Component
  const BIGScoreInfographic = ({ value, target, title }) => {
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>BIG Score - Successful Deals</h3>
          <div className="popup-description">Average BIG Score across SMEs from your successful investment deals</div>
          <div className="popup-details">
            <div className="detail-item"><span className="detail-label">Current BIG Score:</span><span className="detail-value">{value}%</span></div>
            <div className="detail-item"><span className="detail-label">Target:</span><span className="detail-value">{target}%</span></div>
            <div className="detail-item"><span className="detail-label">Total SMEs Analyzed:</span><span className="detail-value">{portfolioData.averageBIGScore.totalSMEs}</span></div>
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button className="breakdown-icon-btn" onClick={handleEyeClick}><FiEye /></button>
        </div>
        <div className="big-score-circular">
          <div className="circular-progress">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" stroke="#e0e0e0" strokeWidth="8" fill="none" />
              <circle cx="70" cy="70" r="60" stroke="#7d5a36" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="377" strokeDashoffset={377 - (377 * value) / 100} transform="rotate(-90 70 70)" />
            </svg>
            <div className="circular-content">
              <div className="big-score-value-circular">{value}%</div>
              <div className="big-score-label-circular">BIG Score</div>
            </div>
          </div>
          <div className="circular-target">Target: {target}%</div>
        </div>
      </div>
    );
  };

  // Funding Ready Circular Component
  const FundingReadyCircular = ({ value, target, title }) => {
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Funding Ready - Successful Deals</h3>
          <div className="popup-description">Percentage of SMEs in your portfolio with BIG Score ≥ 80%</div>
          <div className="popup-details">
            <div className="detail-item"><span className="detail-label">Funding Ready:</span><span className="detail-value">{value}%</span></div>
            <div className="detail-item"><span className="detail-label">Target:</span><span className="detail-value">{target}%</span></div>
            <div className="detail-item"><span className="detail-label">Funding Ready SMEs:</span><span className="detail-value">{portfolioData.fundingReadyPercentage.fundingReadyCount} out of {portfolioData.fundingReadyPercentage.totalCount}</span></div>
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button className="breakdown-icon-btn" onClick={handleEyeClick}><FiEye /></button>
        </div>
        <div className="funding-ready-circular">
          <div className="circular-progress">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" stroke="#e0e0e0" strokeWidth="8" fill="none" />
              <circle cx="70" cy="70" r="60" stroke="#7d5a36" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="377" strokeDashoffset={377 - (377 * value) / 100} transform="rotate(-90 70 70)" />
            </svg>
            <div className="circular-content">
              <div className="funding-ready-value-circular">{value}%</div>
              <div className="funding-ready-label-circular">Funding Ready</div>
            </div>
          </div>
          <div className="circular-target">Target: {target}%</div>
        </div>
      </div>
    );
  };

  // Time to Fund Chart
  const TimeToFundChart = ({ value, target, data, title }) => {
    const labels = getTimeLabels(timeToFundView);
    const chartData = {
      labels: labels,
      datasets: [
        { label: 'Days to Fund', data: data, borderColor: brownShades[0], backgroundColor: brownShades[0] + '20', borderWidth: 3, fill: true, tension: 0.4, pointBackgroundColor: brownShades[0], pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4 },
        { label: 'Target (<30 days)', data: Array(data.length).fill(target), borderColor: '#4CAF50', backgroundColor: 'transparent', borderWidth: 2, borderDash: [5, 5], fill: false, pointRadius: 0, tension: 0 }
      ]
    };

    const options = {
      ...staticLineOptions,
      plugins: {
        ...staticLineOptions.plugins,
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} days` } }
      }
    };

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Time to Fund - Successful Deals</h3>
          <div className="popup-description">Average funding time from application to approval</div>
          <div className="popup-chart"><Line data={chartData} options={options} /></div>
          <div className="popup-details">
            <div className="detail-item"><span className="detail-label">Current Average:</span><span className="detail-value">{value} days</span></div>
            <div className="detail-item"><span className="detail-label">Target:</span><span className="detail-value">{target} days</span></div>
            <div className="detail-item"><span className="detail-label">SMEs Analyzed:</span><span className="detail-value">{portfolioData.timeToFund.totalSMEs}</span></div>
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button className="breakdown-icon-btn" onClick={handleEyeClick}><FiEye /></button>
        </div>
        <div className="chart-area-ultra-compact"><Line data={chartData} options={options} /></div>
        <div className="time-to-fund-legend">
          <div className="legend-item"><div className="legend-color days-to-fund"></div><span>Days to Fund</span></div>
          <div className="legend-item"><div className="legend-color target-line"></div><span>Target Line</span></div>
        </div>
        <div className="chart-summary-compact">
          <div className="current-value">Current: {value} days</div>
          <div className="target-value">Target: {target} days</div>
        </div>
      </div>
    );
  };

  // Funding Facilitated Chart
  const FundingFacilitatedChart = ({ title }) => {
    const [tempData, setTempData] = useState([...fundingFacilitatedData]);
    const financialYearMonths = getFinancialYearMonths();

    const handleEditClick = () => { setShowFundingInput(true); setTempData([...fundingFacilitatedData]); };
    const handleSaveData = () => { setFundingFacilitatedData([...tempData]); setShowFundingInput(false); };
    const handleCancelEdit = () => { setShowFundingInput(false); setTempData([...fundingFacilitatedData]); };
    const handleInputChange = (index, value) => { const newData = [...tempData]; newData[index] = parseFloat(value) || 0; setTempData(newData); };

    const chartData = generateBarData(financialYearMonths, fundingFacilitatedData, 'Funding (R millions)', 2);

    const handleEyeClick = () => {
      const totalFacilitated = fundingFacilitatedData.reduce((sum, value) => sum + value, 0);
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">Monthly funding facilitated from your successful deals</div>
          <div className="popup-chart"><Bar data={chartData} options={staticBarOptions} /></div>
          <div className="popup-details">
            {financialYearMonths.map((month, index) => (
              <div key={month} className="detail-item"><span className="detail-label">{month}:</span><span className="detail-value">R {fundingFacilitatedData[index]} million</span></div>
            ))}
            <div className="detail-item"><span className="detail-label">Total Facilitated:</span><span className="detail-value">R {totalFacilitated.toFixed(1)} million</span></div>
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <div>
            <button className="breakdown-icon-btn" onClick={handleEyeClick}><FiEye /></button>
            <button className="edit-icon-btn" onClick={handleEditClick}><FiEdit /></button>
          </div>
        </div>
        {showFundingInput ? (
          <div className="data-input-form">
            <div className="form-row">
              {financialYearMonths.map((month, index) => (
                <div key={month} className="form-group">
                  <label className="form-label">{month}</label>
                  <input type="number" className="form-input" value={tempData[index]} onChange={(e) => handleInputChange(index, e.target.value)} step="0.1" min="0" />
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={handleCancelEdit}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveData}>Save Data</button>
            </div>
          </div>
        ) : (
          <>
            <div className="chart-title-fixed">Monthly funding from successful deals (R millions)</div>
            <div className="chart-area"><Bar data={chartData} options={staticBarOptions} /></div>
          </>
        )}
      </div>
    );
  };

  // Follow-on Funding Chart
  const FollowOnFundingChart = ({ value, target, data, title }) => {
    const chartData = {
      labels: data.map((_, index) => `Q${index + 1}`),
      datasets: [{ label: 'Follow-on Rate', data: data, backgroundColor: brownShades.map(color => color + '80'), borderColor: brownShades[2], borderWidth: 2, hoverBackgroundColor: brownShades.map(color => color + '80') }]
    };

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">Follow-on funding rates from your successful deals portfolio</div>
          <div className="popup-chart"><Bar data={chartData} options={staticBarOptions} /></div>
          <div className="popup-details">
            <div className="detail-item"><span className="detail-label">Current Quarter:</span><span className="detail-value">{value}%</span></div>
            <div className="detail-item"><span className="detail-label">Quarterly Avg:</span><span className="detail-value">24.5%</span></div>
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button className="breakdown-icon-btn" onClick={handleEyeClick}><FiEye /></button>
        </div>
        <div className="chart-area-ultra-compact"><Bar data={chartData} options={staticBarOptions} /></div>
        <div className="chart-summary-compact">
          <div className="current-value">Current: {value}%</div>
          <div className="target-value">Target: {target}%</div>
        </div>
      </div>
    );
  };

  // Exit Repayment Chart
  const ExitRepaymentChart = ({ value, target, data, title }) => {
    const chartData = {
      labels: data.map((_, index) => `Q${index + 1}`),
      datasets: [
        { label: 'Exit/Repayment Ratio', data: data, borderColor: brownShades[5], backgroundColor: brownShades[5] + '20', borderWidth: 3, fill: true, tension: 0, pointBackgroundColor: brownShades[5], pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4 },
        { label: 'Target (>15%)', data: Array(data.length).fill(target), borderColor: '#4CAF50', backgroundColor: 'transparent', borderWidth: 2, borderDash: [5, 5], fill: false, pointRadius: 0, tension: 0 }
      ]
    };

    const options = {
      ...staticLineOptions,
      plugins: {
        ...staticLineOptions.plugins,
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%` } }
      }
    };

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">Exit and repayment performance from your portfolio</div>
          <div className="popup-chart"><Line data={chartData} options={options} /></div>
          <div className="popup-details">
            <div className="detail-item"><span className="detail-label">Current Ratio:</span><span className="detail-value">{value}%</span></div>
            <div className="detail-item"><span className="detail-label">Target:</span><span className="detail-value">{target}%</span></div>
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button className="breakdown-icon-btn" onClick={handleEyeClick}><FiEye /></button>
        </div>
        <div className="chart-area-ultra-compact"><Line data={chartData} options={options} /></div>
        <div className="chart-summary-compact">
          <div className="current-value">Current: {value}%</div>
          <div className="target-value">Target: {target}%</div>
        </div>
      </div>
    );
  };

  return (
    <div className="portfolio-overview">
      {/* Main Tabs - Overview (charts), Composition, Efficiency */}
      <div className="main-tabs-container">
        <button className={`main-tab-btn ${activeMainTab === "overview" ? "active" : ""}`} onClick={() => setActiveMainTab("overview")}>
          Portfolio Overview
        </button>
        <button className={`main-tab-btn ${activeMainTab === "composition" ? "active" : ""}`} onClick={() => setActiveMainTab("composition")}>
          Portfolio Composition
        </button>
        <button className={`main-tab-btn ${activeMainTab === "efficiency" ? "active" : ""}`} onClick={() => setActiveMainTab("efficiency")}>
          Funder Health & Efficiency
        </button>
      </div>

      {/* MAIN PORTFOLIO OVERVIEW CHARTS - visible when overview is selected */}
      {activeMainTab === "overview" && (
        <>
          <div className="time-view-controls">
            <TimeViewSelector currentView={timeToFundView} onViewChange={setTimeToFundView} />
          </div>
          
          <div className="charts-grid-4x4">
            <div className="top-row">
              <BarChartWithTitle
                data={generateBarData(getTimeLabels(timeToFundView), getTimeData(timeToFundView, portfolioValueData), 'Portfolio Value (R millions)', 0)}
                title="Your Successful Deals Portfolio Value"
                chartTitle={`Investment values from successful deals (${timeToFundView.toLowerCase()} view in R millions)`}
              />

              <ActiveSMEsPieChart title="SMEs in Successful Deals" />

              <BIGScoreInfographic value={portfolioData.averageBIGScore.averageScore} target={80} title="Avg. BIG Score - Successful Deals" />

              <FundingReadyCircular value={portfolioData.fundingReadyPercentage.fundingReadyPercentage} target={75} title='% Portfolio "Funding Ready"' />
            </div>

            <div className="bottom-row">
              <FundingFacilitatedChart title="Funding Facilitated - Successful Deals" />

              <TimeToFundChart
                value={portfolioData.timeToFund.averageDays}
                target={30}
                data={getTimeData(timeToFundView, timeToFundData)}
                title="Avg. Time-to-Fund - Successful Deals"
              />

              <FollowOnFundingChart value={27} target={30} data={[22, 24, 25, 27]} title="Follow-on Funding Rate - Successful Deals" />

              <ExitRepaymentChart value={12} target={15} data={[10, 11, 12, 12]} title="Exit / Repayment Ratio - Successful Deals" />
            </div>
          </div>
        </>
      )}

      {/* PORTFOLIO COMPOSITION SUB-TAB */}
      {activeMainTab === "composition" && <PortfolioComposition openPopup={openPopup} />}

      {/* FUNDER HEALTH & EFFICIENCY SUB-TAB */}
      {activeMainTab === "efficiency" && <FunderHealthEfficiency openPopup={openPopup} />}
    </div>
  );
};

export default PortfolioOverview;