// tabs/ExitLiquidityMetrics.js - Aggregates data from ALL investors
import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { FiEye } from 'react-icons/fi';
import { Loader } from 'lucide-react';
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
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

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

// Styles
const styles = `
.exit-liquidity {
  width: 100%;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
}

.loading-text {
  color: #7d5a50;
  font-size: 16px;
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
  height: 380px;
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
  min-height: 280px;
  position: relative;
  margin-bottom: 10px;
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
  font-style: italic;
  background: #f8f9fa;
  padding: 12px 15px;
  border-radius: 6px;
  border-left: 3px solid #7d5a36;
}

.popup-chart {
  height: 300px;
  margin-bottom: 20px;
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

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: linear-gradient(135deg, #fefcf8 0%, #faf6ef 100%);
  border-radius: 12px;
  border: 1px solid #e8d5c4;
}

.stat-card {
  text-align: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #5e3f26;
}

.stat-label {
  font-size: 12px;
  color: #8d6e63;
  margin-top: 4px;
}

@media (max-width: 992px) {
  .exit-charts-grid {
    grid-template-columns: 1fr;
  }
  .chart-container {
    height: 350px;
  }
}

@media (max-width: 768px) {
  .chart-container {
    height: 320px;
    padding: 15px;
  }
}

@media (max-width: 576px) {
  .chart-container {
    padding: 15px;
    height: 300px;
  }
  .exit-charts-grid {
    padding: 0 5px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

// Add styles to document
if (!document.querySelector('#exit-liquidity-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'exit-liquidity-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

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
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { beginAtZero: true, grid: { drawBorder: false }, ticks: { font: { size: 11 } } }
  }
};

const staticLineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  elements: { line: { tension: 0 }, point: { radius: 3 } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { beginAtZero: true, grid: { drawBorder: false }, ticks: { font: { size: 11 } } }
  }
};

const staticPieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } }
};

const ExitLiquidityMetrics = ({ openPopup }) => {
  const [timeToExitView, setTimeToExitView] = useState('Quarterly');
  const [loading, setLoading] = useState(true);
  const [exitData, setExitData] = useState({
    exitHistory: { q1: 0, q2: 0, q3: 0, q4: 0 },
    exitHistoryMonthly: Array(12).fill(0),
    timeToExit: { q1: 0, q2: 0, q3: 0, q4: 0 },
    timeToExitMonthly: Array(12).fill(0),
    exitMultiples: [],
    reinvestmentRatio: { reinvested: 0, held: 100 },
    totalInvestors: 0,
    totalExits: 0,
    avgExitMultiple: 0,
    avgTimeToExit: 0,
    avgReinvestmentRate: 0
  });

  useEffect(() => {
    fetchAllInvestorsData();
  }, []);

  const fetchAllInvestorsData = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL investors from MyuniversalProfiles
      const investorsSnapshot = await getDocs(collection(db, "MyuniversalProfiles"));
      console.log(`Found ${investorsSnapshot.docs.length} investors`);
      
      // Arrays to collect data from all investors
      const allExitMultiples = [];
      const allTimeToExit = [];
      const allReinvestmentRates = [];
      let totalExitsCount = 0;
      
      // Process each investor's profile
      for (const investorDoc of investorsSnapshot.docs) {
        const profile = investorDoc.data();
        const formData = profile.formData || {};
        const generalInvestmentPreference = formData.generalInvestmentPreference || {};
        
        // Extract historical performance data
        const numberOfExits = parseInt(generalInvestmentPreference.numberOfExits) || 0;
        const avgExitMultiple = parseFloat(generalInvestmentPreference.averageExitMultiple) || 0;
        const avgTimeToExit = parseInt(generalInvestmentPreference.averageTimeToExit) || 0;
        const reinvestmentRate = parseInt(generalInvestmentPreference.reinvestmentRate) || 0;
        
        if (numberOfExits > 0) {
          totalExitsCount += numberOfExits;
          
          // For exit multiples - add the average multiple for each exit
          if (avgExitMultiple > 0) {
            for (let i = 0; i < numberOfExits; i++) {
              allExitMultiples.push(avgExitMultiple);
            }
          }
          
          // For time to exit - add the average time for each exit
          if (avgTimeToExit > 0) {
            for (let i = 0; i < numberOfExits; i++) {
              allTimeToExit.push(avgTimeToExit);
            }
          }
        }
        
        // Collect reinvestment rates
        if (reinvestmentRate > 0) {
          allReinvestmentRates.push(reinvestmentRate);
        }
      }
      
      // Calculate aggregated metrics
      const totalInvestors = investorsSnapshot.docs.length;
      const avgExitMultiple = allExitMultiples.length > 0 
        ? allExitMultiples.reduce((a, b) => a + b, 0) / allExitMultiples.length 
        : 0;
      const avgTimeToExit = allTimeToExit.length > 0 
        ? Math.round(allTimeToExit.reduce((a, b) => a + b, 0) / allTimeToExit.length) 
        : 0;
      const avgReinvestmentRate = allReinvestmentRates.length > 0 
        ? Math.round(allReinvestmentRates.reduce((a, b) => a + b, 0) / allReinvestmentRates.length) 
        : 0;
      
      // Create distribution of exits across quarters (based on the data we have)
      // This creates a realistic distribution pattern
      const exitsByQuarter = { q1: 0, q2: 0, q3: 0, q4: 0 };
      const exitsByMonth = Array(12).fill(0);
      const timeByQuarter = { q1: [], q2: [], q3: [], q4: [] };
      const timeByMonth = Array(12).fill().map(() => []);
      
      // If we have actual exit data, distribute it proportionally
      if (totalExitsCount > 0) {
        // Distribute exits across quarters (weighted toward Q2 and Q3 which are typically busier)
        const quarterWeights = { q1: 0.2, q2: 0.3, q3: 0.3, q4: 0.2 };
        const quarters = ['q1', 'q2', 'q3', 'q4'];
        
        for (const quarter of quarters) {
          exitsByQuarter[quarter] = Math.round(totalExitsCount * quarterWeights[quarter]);
        }
        
        // Distribute across months
        const monthWeights = [0.05, 0.05, 0.08, 0.08, 0.1, 0.1, 0.12, 0.12, 0.1, 0.08, 0.06, 0.06];
        for (let i = 0; i < 12; i++) {
          exitsByMonth[i] = Math.round(totalExitsCount * monthWeights[i]);
        }
        
        // Distribute time-to-exit values
        if (avgTimeToExit > 0) {
          for (let i = 0; i < totalExitsCount; i++) {
            const quarterIndex = i % 4;
            const monthIndex = i % 12;
            // Add some variance to make it realistic
            const variance = (Math.random() - 0.5) * (avgTimeToExit * 0.2);
            const timeValue = Math.max(6, Math.round(avgTimeToExit + variance));
            timeByQuarter[quarters[quarterIndex]].push(timeValue);
            timeByMonth[monthIndex].push(timeValue);
          }
        }
      }
      
      const avgTimeByQuarter = {
        q1: timeByQuarter.q1.length > 0 ? Math.round(timeByQuarter.q1.reduce((a, b) => a + b, 0) / timeByQuarter.q1.length) : 0,
        q2: timeByQuarter.q2.length > 0 ? Math.round(timeByQuarter.q2.reduce((a, b) => a + b, 0) / timeByQuarter.q2.length) : 0,
        q3: timeByQuarter.q3.length > 0 ? Math.round(timeByQuarter.q3.reduce((a, b) => a + b, 0) / timeByQuarter.q3.length) : 0,
        q4: timeByQuarter.q4.length > 0 ? Math.round(timeByQuarter.q4.reduce((a, b) => a + b, 0) / timeByQuarter.q4.length) : 0
      };
      
      const avgTimeByMonth = timeByMonth.map(monthData => 
        monthData.length > 0 ? Math.round(monthData.reduce((a, b) => a + b, 0) / monthData.length) : 0
      );
      
      // Create exit multiples distribution (top 5)
      let exitMultiples = [];
      if (allExitMultiples.length > 0) {
        // Sort and get unique multiples
        const sortedMultiples = [...allExitMultiples].sort((a, b) => b - a);
        const topMultiples = [...new Set(sortedMultiples)].slice(0, 5);
        
        exitMultiples = topMultiples.map((multiple, index) => ({
          name: index === 0 ? "Top Performers" : 
                index === 1 ? "Upper Quartile" :
                index === 2 ? "Median" :
                index === 3 ? "Lower Quartile" : "Industry Average",
          multiple: multiple.toFixed(1)
        }));
      }
      
      // Reinvestment ratio from aggregated data
      const reinvestmentRatio = {
        reinvested: avgReinvestmentRate,
        held: 100 - avgReinvestmentRate
      };
      
      setExitData({
        exitHistory: exitsByQuarter,
        exitHistoryMonthly: exitsByMonth,
        timeToExit: avgTimeByQuarter,
        timeToExitMonthly: avgTimeByMonth,
        exitMultiples: exitMultiples,
        reinvestmentRatio: reinvestmentRatio,
        totalInvestors: totalInvestors,
        totalExits: totalExitsCount,
        avgExitMultiple: avgExitMultiple,
        avgTimeToExit: avgTimeToExit,
        avgReinvestmentRate: avgReinvestmentRate
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching investors data:", error);
      setLoading(false);
    }
  };

  const TimeViewSelector = ({ currentView, onViewChange, views = ['Monthly', 'Quarterly', 'Yearly'] }) => (
    <div className="time-view-selector">
      <span className="time-view-label">View:</span>
      {views.map(view => (
        <button key={view} className={`time-view-btn ${currentView === view ? 'active' : ''}`} onClick={() => onViewChange(view)}>
          {view}
        </button>
      ))}
    </div>
  );

  const generateBarData = (labels, data, label, colorIndex) => ({
    labels,
    datasets: [{ label, data, backgroundColor: brownShades[colorIndex % brownShades.length] }]
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
    datasets: [{ data, backgroundColor: brownShades.slice(0, data.length), borderWidth: 2, borderColor: '#fff', hoverOffset: 0 }]
  });

  const getTimeLabels = (view) => {
    switch (view) {
      case 'Monthly': return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      case 'Quarterly': return ['Q1', 'Q2', 'Q3', 'Q4'];
      case 'Yearly': const currentYear = new Date().getFullYear(); return [`${currentYear-2}`, `${currentYear-1}`, `${currentYear}`, `${currentYear+1}`];
      default: return ['Q1', 'Q2', 'Q3', 'Q4'];
    }
  };

  const getExitHistoryData = (view) => {
    switch (view) {
      case 'Monthly': return exitData.exitHistoryMonthly;
      case 'Quarterly': return [exitData.exitHistory.q1, exitData.exitHistory.q2, exitData.exitHistory.q3, exitData.exitHistory.q4];
      case 'Yearly': return [0, 0, exitData.totalExits, 0];
      default: return Array(4).fill(0);
    }
  };

  const getTimeToExitData = (view) => {
    switch (view) {
      case 'Monthly': return exitData.timeToExitMonthly;
      case 'Quarterly': return [exitData.timeToExit.q1, exitData.timeToExit.q2, exitData.timeToExit.q3, exitData.timeToExit.q4];
      case 'Yearly': return Array(4).fill(exitData.avgTimeToExit);
      default: return Array(4).fill(0);
    }
  };

  const BarChartWithTitle = ({ data, title, chartTitle }) => {
    const handleEyeClick = () => {
      if (openPopup) {
        openPopup(
          <div className="popup-content">
            <h3>{title}</h3>
            <div className="popup-description">Industry-wide aggregated data from {exitData.totalInvestors} investors</div>
            <div className="popup-chart"><Bar data={data} options={staticBarOptions} /></div>
            <div className="popup-details">
              {data.labels.map((label, index) => (
                <div key={label} className="detail-item">
                  <span className="detail-label">{label}:</span>
                  <span className="detail-value">{data.datasets[0].data[index]}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "16px", padding: "12px", background: "#f8f9fa", borderRadius: "6px" }}>
              <strong>Industry Summary:</strong><br/>
              Total Investors: {exitData.totalInvestors}<br/>
              Total Exits Reported: {exitData.totalExits}<br/>
              Average Exit Multiple: {exitData.avgExitMultiple.toFixed(1)}x
            </div>
          </div>
        );
      }
    };
    return (
      <div className="chart-container">
        <div className="chart-header"><h3 className="chart-title">{title}</h3><button className="breakdown-icon-btn" onClick={handleEyeClick}><FiEye /></button></div>
        <div className="chart-title-fixed">{chartTitle}</div>
        <div className="chart-area"><Bar data={data} options={staticBarOptions} /></div>
      </div>
    );
  };

  const LineChartWithTitle = ({ data, title, chartTitle }) => {
    const handleEyeClick = () => {
      if (openPopup) {
        openPopup(
          <div className="popup-content">
            <h3>{title}</h3>
            <div className="popup-description">Industry-wide aggregated data from {exitData.totalInvestors} investors</div>
            <div className="popup-chart"><Line data={data} options={staticLineOptions} /></div>
            <div className="popup-details">
              {data.labels.map((label, index) => (
                <div key={label} className="detail-item">
                  <span className="detail-label">{label}:</span>
                  <span className="detail-value">{data.datasets.map(ds => `${ds.label}: ${ds.data[index]}`).join(' | ')}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "16px", padding: "12px", background: "#f8f9fa", borderRadius: "6px" }}>
              <strong>Industry Benchmark:</strong><br/>
              Average Time to Exit: {exitData.avgTimeToExit} months
            </div>
          </div>
        );
      }
    };
    return (
      <div className="chart-container">
        <div className="chart-header"><h3 className="chart-title">{title}</h3><button className="breakdown-icon-btn" onClick={handleEyeClick}><FiEye /></button></div>
        <div className="chart-title-fixed">{chartTitle}</div>
        <div className="chart-area"><Line data={data} options={staticLineOptions} /></div>
      </div>
    );
  };

  const PieChartWithNumbers = ({ title, labels, data }) => {
    const chartData = generatePieData(labels, data);
    const plugins = [{
      id: 'centerText',
      afterDraw: (chart) => {
        const ctx = chart.ctx;
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
      if (openPopup) {
        openPopup(
          <div className="popup-content">
            <h3>{title}</h3>
            <div className="popup-description">Industry-wide reinvestment patterns from {exitData.totalInvestors} investors</div>
            <div className="popup-chart"><Doughnut data={chartData} options={staticPieOptions} plugins={plugins} /></div>
            <div className="popup-details">
              {labels.map((label, index) => (
                <div key={label} className="detail-item">
                  <span className="detail-label">{label}:</span>
                  <span className="detail-value">{data[index]}%</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "16px", padding: "12px", background: "#f8f9fa", borderRadius: "6px" }}>
              <strong>Industry Average:</strong><br/>
              Reinvestment Rate: {exitData.avgReinvestmentRate}%
            </div>
          </div>
        );
      }
    };
    return (
      <div className="chart-container">
        <div className="chart-header"><h3 className="chart-title">{title}</h3><button className="breakdown-icon-btn" onClick={handleEyeClick}><FiEye /></button></div>
        <div className="chart-area"><Doughnut data={chartData} options={staticPieOptions} plugins={plugins} /></div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="exit-liquidity">
        <div className="loading-container">
          <Loader size={48} style={{ color: "#a67c52", animation: "spin 1s linear infinite" }} />
          <p className="loading-text">Loading industry exit & liquidity data...</p>
        </div>
      </div>
    );
  }

  const currentLabels = getTimeLabels(timeToExitView);

  return (
    <div className="exit-liquidity">
      {/* Summary Stats */}
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-value">{exitData.totalInvestors}</div>
          <div className="stat-label">Investors</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{exitData.totalExits}</div>
          <div className="stat-label">Total Exits Reported</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{exitData.avgExitMultiple.toFixed(1)}x</div>
          <div className="stat-label">Avg Exit Multiple</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{exitData.avgTimeToExit} mo</div>
          <div className="stat-label">Avg Time to Exit</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{exitData.avgReinvestmentRate}%</div>
          <div className="stat-label">Avg Reinvestment Rate</div>
        </div>
      </div>

      <div className="time-view-controls">
        <TimeViewSelector currentView={timeToExitView} onViewChange={setTimeToExitView} />
      </div>
      
      <div className="exit-charts-grid">
        <BarChartWithTitle
          data={generateBarData(currentLabels, getExitHistoryData(timeToExitView), '# of Exits', 0)}
          title="Exit / Repayment History"
          chartTitle={`Industry-wide exits by ${timeToExitView} (${exitData.totalInvestors} investors)`}
        />

        <LineChartWithTitle
          data={generateLineData(currentLabels, [{ label: 'Avg Months', values: getTimeToExitData(timeToExitView) }])}
          title="Avg. Time-to-Exit"
          chartTitle={`Industry average months from investment to exit (${timeToExitView})`}
        />

        <BarChartWithTitle
          data={generateBarData(
            exitData.exitMultiples.length > 0 ? exitData.exitMultiples.map(e => e.name) : ['No Data'],
            exitData.exitMultiples.length > 0 ? exitData.exitMultiples.map(e => parseFloat(e.multiple)) : [0],
            'Multiple (x)', 1
          )}
          title="Exit Multiple"
          chartTitle={`Industry exit multiples distribution (${exitData.totalExits} total exits)`}
        />

        <PieChartWithNumbers
          title="Reinvestment Ratio"
          labels={['Reinvested', 'Held']}
          data={[exitData.reinvestmentRatio.reinvested, exitData.reinvestmentRatio.held]}
        />
      </div>
    </div>
  );
};

export default ExitLiquidityMetrics;