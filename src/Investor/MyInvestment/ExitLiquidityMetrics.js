// tabs/ExitLiquidityMetrics.js
import React, { useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
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

// Styles for ExitLiquidityMetrics
const styles = `
.exit-liquidity {
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

.exit-charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
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

/* SME Graduation Infographic */
.graduation-simple {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.graduation-main-simple {
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

.graduation-value-simple {
  font-size: 42px;
  font-weight: 700;
  color: #5e3f26;
  margin-bottom: 8px;
  line-height: 1;
}

.graduation-label-simple {
  font-size: 16px;
  color: #666;
  font-weight: 500;
  margin-bottom: 6px;
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

/* Graduation Popup Styles */
.graduation-popup {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.graduation-main-popup {
  text-align: center;
  padding: 25px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 3px solid #7d5a36;
}

.graduation-value {
  font-size: 48px;
  font-weight: 700;
  color: #5e3f26;
  margin-bottom: 10px;
}

.graduation-label {
  font-size: 18px;
  color: #666;
  font-weight: 500;
  margin-bottom: 8px;
}

.graduation-subtitle {
  font-size: 14px;
  color: #7d5a36;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 992px) {
  .exit-charts-grid {
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
  
  .graduation-value-simple {
    font-size: 36px;
  }
}

@media (max-width: 576px) {
  .chart-container {
    padding: 15px;
    height: 320px;
  }
  
  .exit-charts-grid {
    padding: 0 5px;
  }
  
  .graduation-value-simple {
    font-size: 32px;
  }
  
  .graduation-label-simple {
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

const staticPieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { position: 'bottom' } }
};

const ExitLiquidityMetrics = ({ openPopup }) => {
  const [timeToExitView, setTimeToExitView] = useState('Quarterly');

  // Time view data
  const timeToExitData = {
    Monthly: [34, 33, 32, 31, 31, 30],
    Quarterly: [34, 32, 31, 30],
    Yearly: [35, 33, 31, 29]
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

  // UPDATED: Pie Chart with Numbers ALWAYS visible (same as Pipeline)
  const PieChartWithNumbers = ({ title, labels, data, chartId }) => {
    const chartData = generatePieData(labels, data);

    // Custom plugin to display numbers on pie chart segments
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
          <div className="popup-description">
            Detailed percentage breakdown of {title.toLowerCase()}
          </div>
          <div className="popup-chart">
            <Doughnut data={chartData} options={staticPieOptions} plugins={plugins} />
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
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button className="breakdown-icon-btn" onClick={handleEyeClick} title="View breakdown">
            <FiEye />
          </button>
        </div>
        <div className="chart-area">
          <Doughnut data={chartData} options={staticPieOptions} plugins={plugins} />
        </div>
      </div>
    );
  };

  // SME Graduation Infographic
  const SMEGraduationInfographic = ({ value, target, title }) => {
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>SME Graduation Breakdown</h3>
          <div className="popup-description">
            Percentage of SMEs now self-sustaining with impact metrics across graduated, near graduation, progressing, and early stages
          </div>
          <div className="graduation-popup">
            <div className="graduation-main-popup">
              <div className="graduation-value">{value}%</div>
              <div className="graduation-label">Graduated to Bankable</div>
              <div className="graduation-subtitle">40 SMEs Successfully Graduated</div>
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

  return (
    <div className="exit-liquidity">
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
              { label: 'Target (<32)', values: [32, 32, 32, 32] }
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
          chartId="reinvestment-ratio"
        />

        <SMEGraduationInfographic
          value={31}
          target={35}
          title="SME Graduation to Bankable"
        />
      </div>
    </div>
  );
};

export default ExitLiquidityMetrics;