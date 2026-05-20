// tabs/PerformanceRiskDashboard.js
import React, { useState } from 'react';
import { Bar, Line, Radar, Doughnut } from 'react-chartjs-2';
import { FiEye } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Import sub-tab components
import ESGImpactPerformance from './ESGImpactPerformance';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Styles
const styles = `
.performance-risk {
  width: 100%;
}

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

.performance-charts-grid {
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

@media (max-width: 992px) {
  .performance-charts-grid {
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
}

@media (max-width: 576px) {
  .chart-container {
    padding: 15px;
    height: 320px;
  }
  .performance-charts-grid {
    padding: 0 5px;
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
  elements: { line: { tension: 0 }, point: { radius: 3 } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { drawBorder: false } }
  }
};

const staticRadarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } } }
};

// ==================== PERFORMANCE METRICS MAIN COMPONENT ====================
const PerformanceRiskDashboard = ({ openPopup, downloadSectionAsPDF, currentUser }) => {
  const [activeMainTab, setActiveMainTab] = useState("performance"); // performance, esg

  // Data generation functions
  const generateBarData = (labels, data, label, colorIndex) => ({
    labels,
    datasets: [{ label, data, backgroundColor: brownShades[colorIndex % brownShades.length] }]
  });

  const generateStackedBarData = (labels, datasets) => ({
    labels,
    datasets: datasets.map((ds, i) => ({ label: ds.label, data: ds.values, backgroundColor: brownShades[i % brownShades.length] }))
  });

  const generateLineData = (labels, datasets) => ({
    labels,
    datasets: datasets.map((ds, i) => ({ label: ds.label, data: ds.values, borderColor: brownShades[i % brownShades.length], backgroundColor: brownShades[i % brownShades.length] + '20', borderWidth: 2, fill: ds.fill || false, tension: 0 }))
  });

  const generateRadarData = (labels, actualData, targetData) => ({
    labels,
    datasets: [
      { label: 'Actual', data: actualData, backgroundColor: 'rgba(94, 63, 38, 0.2)', borderColor: brownShades[0], pointBackgroundColor: brownShades[0], borderWidth: 2 },
      { label: 'Target', data: targetData, backgroundColor: 'rgba(125, 90, 54, 0.2)', borderColor: brownShades[1], pointBackgroundColor: brownShades[1], borderWidth: 2 }
    ]
  });

  // Chart Components
  const BarChartWithTitle = ({ data, title, chartTitle }) => {
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">Detailed breakdown of {title.toLowerCase()}</div>
          <div className="popup-chart"><Bar data={data} options={staticBarOptions} /></div>
          <div className="popup-details">
            {data.labels.map((label, index) => (
              <div key={label} className="detail-item"><span className="detail-label">{label}:</span><span className="detail-value">{data.datasets[0].data[index]}</span></div>
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

  const LineChartWithTitle = ({ data, title, chartTitle }) => {
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">Detailed trend analysis of {title.toLowerCase()}</div>
          <div className="popup-chart"><Line data={data} options={staticLineOptions} /></div>
          <div className="popup-details">
            {data.labels.map((label, index) => (
              <div key={label} className="detail-item">
                <span className="detail-label">{label}:</span>
                <span className="detail-value">{data.datasets.map(ds => `${ds.label}: ${ds.data[index]}`).join(' | ')}</span>
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
        <div className="chart-area"><Line data={data} options={staticLineOptions} /></div>
      </div>
    );
  };

  const RadarChartWithTitle = ({ data, title }) => {
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">Performance comparison across diversity and inclusion metrics</div>
          <div className="popup-chart"><Radar data={data} options={staticRadarOptions} /></div>
          <div className="popup-details">
            {data.labels.map((label, index) => (
              <div key={label} className="detail-item">
                <span className="detail-label">{label}:</span>
                <span className="detail-value">Actual: {data.datasets[0].data[index]} | Target: {data.datasets[1].data[index]}</span>
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
        <div className="chart-area"><Radar data={data} options={staticRadarOptions} /></div>
      </div>
    );
  };

  return (
    <div className="performance-risk">
      {/* Main Tabs - Performance Metrics (charts), ESG Impact */}
      <div className="main-tabs-container">
        <button className={`main-tab-btn ${activeMainTab === "performance" ? "active" : ""}`} onClick={() => setActiveMainTab("performance")}>
          Performance Metrics
        </button>
        <button className={`main-tab-btn ${activeMainTab === "esg" ? "active" : ""}`} onClick={() => setActiveMainTab("esg")}>
          ESG Impact Performance
        </button>
      </div>

      {/* PERFORMANCE METRICS CHARTS - visible when performance is selected */}
      {activeMainTab === "performance" && (
        <div className="performance-charts-grid">
          <BarChartWithTitle
            data={generateBarData(['Q1', 'Q2', 'Q3', 'Q4'], [7.5, 9.8, 6.1, 4.2], '% Defaults', 0)}
            title="Default / Non-performing Ratio"
            chartTitle="Default rates per quarter (%)"
          />

          <LineChartWithTitle
            data={generateLineData(['Q1', 'Q2', 'Q3', 'Q4'], [{ label: 'Revenue Growth', values: [9, 10, 12, 11] }, { label: 'Benchmark (8%)', values: [8, 8, 8, 8] }])}
            title="SME Growth Index"
            chartTitle="Revenue growth vs benchmark (%)"
          />

          <BarChartWithTitle
            data={generateStackedBarData(['Agriculture', 'Services', 'Manufacturing', 'Retail', 'Tech'], [{ label: 'New Jobs', values: [800, 1000, 600, 400, 300] }, { label: 'Retained Jobs', values: [400, 500, 400, 300, 200] }])}
            title="Job Creation / Retention"
            chartTitle="Jobs created and retained by sector"
          />

          <LineChartWithTitle
            data={generateLineData(['Q1', 'Q2', 'Q3', 'Q4'], [{ label: 'Graduation Rate', values: [15, 17, 18, 19] }, { label: 'Target (25%)', values: [20, 21, 23, 25] }])}
            title="SME Graduation Rate (to 80+ BIG Score)"
            chartTitle="Graduation rate vs target (%)"
          />

          <RadarChartWithTitle
            data={generateRadarData(['Women', 'Youth', 'Rural', 'Black-owned'], [38, 24, 45, 72], [35, 25, 40, 70])}
            title="Diversity & Inclusion Score"
          />
        </div>
      )}

      {/* ESG IMPACT PERFORMANCE SUB-TAB */}
      {activeMainTab === "esg" && <ESGImpactPerformance openPopup={openPopup} />}
    </div>
  );
};

export default PerformanceRiskDashboard;