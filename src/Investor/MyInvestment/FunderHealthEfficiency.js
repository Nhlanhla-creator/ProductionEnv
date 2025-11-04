// tabs/FunderHealthEfficiency.js
import React, { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { FiEye, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
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
  Title,
  Tooltip,
  Legend
);

// Styles for FunderHealthEfficiency
const styles = `
.funder-efficiency {
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

.funder-charts-grid-4x4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 0 10px;
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

.chart-area-compact {
  flex-grow: 1;
  min-height: 200px;
  position: relative;
  margin-bottom: 10px;
}

/* Cost per SME Infographic */
.cost-simple {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cost-main-simple {
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

.cost-value-simple {
  font-size: 32px;
  font-weight: 700;
  color: #5e3f26;
  margin-bottom: 8px;
  line-height: 1;
}

.cost-label-simple {
  font-size: 16px;
  color: #666;
  font-weight: 500;
  margin-bottom: 6px;
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

/* Responsive Design */
@media (max-width: 1200px) {
  .funder-charts-grid-4x4 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-container {
    height: 400px;
  }
}

@media (max-width: 992px) {
  .funder-charts-grid-4x4 {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 380px;
  }
}

@media (max-width: 768px) {
  .chart-container {
    height: 350px;
    padding: 15px;
  }
  
  .chart-summary-compact {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .chart-summary-compact .current-value,
  .chart-summary-compact .target-value {
    justify-content: center;
    text-align: center;
  }
  
  .cost-value-simple {
    font-size: 28px;
  }
}

@media (max-width: 576px) {
  .chart-container {
    padding: 15px;
    height: 320px;
  }
  
  .funder-charts-grid-4x4 {
    padding: 0 5px;
  }
  
  .cost-value-simple {
    font-size: 24px;
  }
  
  .cost-label-simple {
    font-size: 14px;
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

// Static options
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
  elements: {
    line: { tension: 0 },
    point: { radius: 3 }
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { drawBorder: false } }
  }
};

const FunderHealthEfficiency = ({ openPopup }) => {
  const [vettingTimeView, setVettingTimeView] = useState('Monthly');

  // Time view data
  const vettingTimeData = {
    Monthly: [12, 11, 10, 9, 9, 9],
    Quarterly: [11, 10, 9, 9],
    Yearly: [12, 11, 10, 9]
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
      backgroundColor: brownShades[colorIndex % brownShades.length]
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
          <button className="breakdown-icon-btn" onClick={handleEyeClick} title="View breakdown">
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

  const LineChartWithTitle = ({ data, title, chartTitle, chartId }) => {
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">
            Detailed trend analysis of {title.toLowerCase()}
          </div>
          <div className="popup-chart">
            <Line data={data} options={staticLineOptions} />
          </div>
          <div className="popup-details">
            {data.labels.map((label, index) => (
              <div key={label} className="detail-item">
                <span className="detail-label">{label}:</span>
                <span className="detail-value">
                  {data.datasets.map(ds => `${ds.label}: ${ds.data[index]}`).join(' | ')}
                </span>
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
          <button className="breakdown-icon-btn" onClick={handleEyeClick} title="View breakdown">
            <FiEye />
          </button>
        </div>
        <div className="chart-title-fixed">{chartTitle}</div>
        <div className="chart-area">
          <Line data={data} options={staticLineOptions} />
        </div>
      </div>
    );
  };

  // Cost per SME Infographic
  const CostPerSMEInfographic = ({ value, target, title }) => {
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Cost Breakdown Details</h3>
          <div className="popup-description">
            Detailed breakdown of operational costs per funded SME across staff, operations, technology, travel, and other expenses
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
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button className="breakdown-icon-btn" onClick={handleEyeClick} title="View breakdown">
            <FiEye />
          </button>
        </div>
        
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

  return (
    <div className="funder-efficiency">
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
  );
};

export default FunderHealthEfficiency;