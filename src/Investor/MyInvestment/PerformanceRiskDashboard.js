// tabs/PerformanceRiskDashboard.js
import React, { useState, useEffect } from 'react';
import { Bar, Line, Radar } from 'react-chartjs-2';
import { FiEye, FiGrid, FiCheck } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Styles for PerformanceRiskDashboard
const styles = `
.performance-risk {
  width: 100%;
}

.controls-row {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

.chart-selection-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.chart-selector-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.chart-selector-btn:hover {
  background: #e0e0e0;
}

.chart-selector-btn.active {
  background-color: #7d5a36;
  color: white;
}

.chart-selector-popup {
  position: absolute;
  top: 40px;
  left: 0;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  min-width: 300px;
  border: 1px solid #e0e0e0;
}

.chart-selector-popup h4 {
  margin: 0 0 15px 0;
  color: #5e3f26;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 1px solid #ede4d8;
}

.chart-selection-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.chart-selection-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.chart-selection-item:hover {
  background: #e9ecef;
}

.chart-selection-item.selected {
  background: #e8f5e8;
  border: 1px solid #4CAF50;
}

.chart-selection-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid #7d5a36;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-selection-checkbox.checked {
  background: #7d5a36;
  color: white;
}

.chart-selection-label {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.chart-selection-actions {
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.chart-selection-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.chart-selection-btn.primary {
  background-color: #7d5a36;
  color: white;
}

.chart-selection-btn.primary:hover {
  background-color: #5e3f26;
}

.chart-selection-btn.secondary {
  background-color: #f5f5f5;
  color: #666;
}

.chart-selection-btn.secondary:hover {
  background-color: #e0e0e0;
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
  .performance-charts-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
}

@media (max-width: 992px) {
  .performance-charts-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 380px;
  }
  
  .controls-row {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .chart-selection-controls {
    justify-content: space-between;
  }
  
  .chart-selector-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 400px;
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
  
  .chart-selection-grid {
    grid-template-columns: 1fr;
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

const staticRadarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  scales: {
    r: {
      beginAtZero: true,
      max: 100,
      ticks: { stepSize: 20 }
    }
  }
};

// Save user preferences to Firebase
const saveUserChartPreferences = async (userId, preferences) => {
  try {
    const userPrefsRef = doc(db, "userPreferences", userId);
    await setDoc(userPrefsRef, {
      performanceChartPreferences: preferences,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('✅ Performance chart preferences saved to Firebase');
  } catch (error) {
    console.error('❌ Error saving performance chart preferences:', error);
  }
};

// Load user preferences from Firebase
const loadUserChartPreferences = async (userId) => {
  try {
    const userPrefsRef = doc(db, "userPreferences", userId);
    const userPrefsSnap = await getDoc(userPrefsRef);
    
    if (userPrefsSnap.exists()) {
      const preferences = userPrefsSnap.data().performanceChartPreferences;
      console.log('✅ Performance chart preferences loaded from Firebase:', preferences);
      return preferences;
    } else {
      console.log('⚠️ No performance chart preferences found, using defaults');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading performance chart preferences:', error);
    return null;
  }
};

const PerformanceRiskDashboard = ({ openPopup }) => {
  const [showChartSelector, setShowChartSelector] = useState(false);
  const [selectedCharts, setSelectedCharts] = useState({
    defaultRatio: true,
    smeGrowthIndex: true,
    jobCreation: true,
    graduationRate: true,
    diversityInclusion: true
  });

  // Load chart preferences on component mount
  useEffect(() => {
    const loadPreferences = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const savedPreferences = await loadUserChartPreferences(currentUser.uid);
        if (savedPreferences) {
          setSelectedCharts(savedPreferences.selectedCharts || selectedCharts);
        }
      }
    };
    
    loadPreferences();
  }, []);

  // Save preferences when they change
  useEffect(() => {
    const savePreferences = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const preferences = {
          selectedCharts,
          updatedAt: new Date().toISOString()
        };
        await saveUserChartPreferences(currentUser.uid, preferences);
      }
    };

    // Debounce the save to prevent too many writes
    const timeoutId = setTimeout(savePreferences, 1000);
    return () => clearTimeout(timeoutId);
  }, [selectedCharts]);

  // Data generation functions
  const generateBarData = (labels, data, label, colorIndex) => ({
    labels,
    datasets: [{
      label,
      data,
      backgroundColor: brownShades[colorIndex % brownShades.length]
    }]
  });

  const generateStackedBarData = (labels, datasets) => ({
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.values,
      backgroundColor: brownShades[i % brownShades.length]
    }))
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

  // Chart Selection Component
  const ChartSelectionPopup = () => {
    const chartOptions = [
      { id: 'defaultRatio', label: 'Default Ratio' },
      { id: 'smeGrowthIndex', label: 'SME Growth Index' },
      { id: 'jobCreation', label: 'Job Creation' },
      { id: 'graduationRate', label: 'Graduation Rate' },
      { id: 'diversityInclusion', label: 'Diversity & Inclusion' }
    ];

    const handleToggleChart = (chartId) => {
      setSelectedCharts(prev => ({
        ...prev,
        [chartId]: !prev[chartId]
      }));
    };

    const handleSelectAll = () => {
      const allSelected = {};
      chartOptions.forEach(option => {
        allSelected[option.id] = true;
      });
      setSelectedCharts(allSelected);
    };

    const handleDeselectAll = () => {
      const noneSelected = {};
      chartOptions.forEach(option => {
        noneSelected[option.id] = false;
      });
      setSelectedCharts(noneSelected);
    };

    const handleSaveSelection = () => {
      setShowChartSelector(false);
    };

    const selectedCount = Object.values(selectedCharts).filter(Boolean).length;

    return (
      <div className="chart-selector-popup">
        <h4>Select Charts to Display ({selectedCount} selected)</h4>
        <div className="chart-selection-grid">
          {chartOptions.map(option => (
            <div
              key={option.id}
              className={`chart-selection-item ${selectedCharts[option.id] ? 'selected' : ''}`}
              onClick={() => handleToggleChart(option.id)}
            >
              <div className={`chart-selection-checkbox ${selectedCharts[option.id] ? 'checked' : ''}`}>
                {selectedCharts[option.id] && <FiCheck size={12} />}
              </div>
              <span className="chart-selection-label">{option.label}</span>
            </div>
          ))}
        </div>
        <div className="chart-selection-actions">
          <button className="chart-selection-btn secondary" onClick={handleDeselectAll}>
            Deselect All
          </button>
          <button className="chart-selection-btn secondary" onClick={handleSelectAll}>
            Select All
          </button>
          <button className="chart-selection-btn primary" onClick={handleSaveSelection}>
            Apply
          </button>
        </div>
      </div>
    );
  };

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

  const RadarChartWithTitle = ({ data, title, chartId }) => {
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">
            Performance comparison across different diversity and inclusion metrics
          </div>
          <div className="popup-chart">
            <Radar data={data} options={staticRadarOptions} />
          </div>
          <div className="popup-details">
            {data.labels.map((label, index) => (
              <div key={label} className="detail-item">
                <span className="detail-label">{label}:</span>
                <span className="detail-value">
                  Actual: {data.datasets[0].data[index]} | Target: {data.datasets[1].data[index]}
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
        <div className="chart-area">
          <Radar data={data} options={staticRadarOptions} />
        </div>
      </div>
    );
  };

  // Get selected charts
  const selectedChartComponents = [];
  
  // Add Default Ratio chart if selected
  if (selectedCharts.defaultRatio) {
    selectedChartComponents.push({
      id: 'defaultRatio',
      component: (
        <BarChartWithTitle
          key="defaultRatio"
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
      )
    });
  }

  // Add SME Growth Index chart if selected
  if (selectedCharts.smeGrowthIndex) {
    selectedChartComponents.push({
      id: 'smeGrowthIndex',
      component: (
        <LineChartWithTitle
          key="smeGrowthIndex"
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
      )
    });
  }

  // Add Job Creation chart if selected
  if (selectedCharts.jobCreation) {
    selectedChartComponents.push({
      id: 'jobCreation',
      component: (
        <BarChartWithTitle
          key="jobCreation"
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
      )
    });
  }

  // Add Graduation Rate chart if selected
  if (selectedCharts.graduationRate) {
    selectedChartComponents.push({
      id: 'graduationRate',
      component: (
        <LineChartWithTitle
          key="graduationRate"
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
        />
      )
    });
  }

  // Add Diversity & Inclusion chart if selected
  if (selectedCharts.diversityInclusion) {
    selectedChartComponents.push({
      id: 'diversityInclusion',
      component: (
        <RadarChartWithTitle
          key="diversityInclusion"
          data={generateRadarData(
            ['Women', 'Youth', 'Rural', 'Black-owned'],
            [38, 24, 45, 72],
            [35, 25, 40, 70]
          )}
          title="Diversity & Inclusion Score"
          chartId="diversity-inclusion"
        />
      )
    });
  }

  return (
    <div className="performance-risk">
      {/* Chart Selection Controls */}
      <div className="controls-row">
        <div className="chart-selection-controls">
          <div style={{ position: 'relative' }}>
            <button 
              className={`chart-selector-btn ${showChartSelector ? 'active' : ''}`}
              onClick={() => setShowChartSelector(!showChartSelector)}
              title="Select charts to display"
            >
              <FiGrid />
              Select Charts ({Object.values(selectedCharts).filter(Boolean).length} selected)
            </button>
            {showChartSelector && <ChartSelectionPopup />}
          </div>
        </div>
      </div>
      
      {/* Charts Grid */}
      <div className="performance-charts-grid">
        {selectedChartComponents.map(chart => chart.component)}
        
        {selectedChartComponents.length === 0 && (
          <div style={{ 
            gridColumn: '1 / -1',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '200px',
            color: '#666',
            fontSize: '16px',
            textAlign: 'center'
          }}>
            No charts selected. Click "Select Charts" to choose which charts to display.
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceRiskDashboard;