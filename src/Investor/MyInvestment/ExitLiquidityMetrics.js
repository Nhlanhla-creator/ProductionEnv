// tabs/ExitLiquidityMetrics.js
import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { FiEye, FiArrowUp, FiArrowDown } from 'react-icons/fi';
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
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

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
  height: 380px;
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
  min-height: 280px;
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #7d5a50;
  text-align: center;
  padding: 20px;
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state-text {
  font-size: 14px;
  line-height: 1.5;
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
    x: { 
      grid: { display: false },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    y: { 
      beginAtZero: true, 
      grid: { drawBorder: false },
      ticks: {
        font: {
          size: 11
        }
      }
    }
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
    x: { 
      grid: { display: false },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    y: { 
      beginAtZero: true, 
      grid: { drawBorder: false },
      ticks: {
        font: {
          size: 11
        }
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
      position: 'bottom',
      labels: {
        font: {
          size: 12
        }
      }
    } 
  }
};

const ExitLiquidityMetrics = ({ openPopup }) => {
  const [timeToExitView, setTimeToExitView] = useState('Quarterly');
  const [loading, setLoading] = useState(true);
  const [exitData, setExitData] = useState({
    exitHistory: { q1: 0, q2: 0, q3: 0, q4: 0 },
    timeToExit: { q1: 0, q2: 0, q3: 0, q4: 0 },
    exitMultiples: [],
    reinvestmentRatio: { reinvested: 0, held: 100 }
  });

  useEffect(() => {
    fetchExitData();
  }, []);

  const fetchExitData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log("No authenticated user");
        setLoading(false);
        return;
      }

      // Fetch investor's portfolio SMEs
      const applicationsQuery = query(
        collection(db, "investorApplications"),
        where("funderId", "==", currentUser.uid)
      );

      const applicationsSnapshot = await getDocs(applicationsQuery);
      console.log("Found applications for exit analysis:", applicationsSnapshot.docs.length);

      // Process each SME's exit/liquidity data
      const exitPromises = applicationsSnapshot.docs.map(async (appDoc) => {
        const appData = appDoc.data();
        
        try {
          let profileData = {};

          // Fetch SME profile
          if (appData.smeId) {
            const profileRef = doc(db, "universalProfiles", appData.smeId);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
              profileData = profileSnap.data();
            }
          }

          const smeName =
            profileData.entityOverview?.tradingName ||
            profileData.entityOverview?.registeredName ||
            appData.companyName ||
            appData.smeName ||
            "Unnamed Business";

          // Extract exit metrics
          const pipelineStage = appData.pipelineStage || '';
          const fundingData = appData.fundingData || {};
          
          // Parse dates
          const createdAt = appData.createdAt?.toDate ? appData.createdAt.toDate() : 
                           (appData.createdAt ? new Date(appData.createdAt) : new Date());
          const updatedAt = appData.updatedAt?.toDate ? appData.updatedAt.toDate() : 
                           (appData.updatedAt ? new Date(appData.updatedAt) : new Date());
          const exitDate = appData.exitDate?.toDate ? appData.exitDate.toDate() : 
                          (appData.exitDate ? new Date(appData.exitDate) : null);
          const disbursementDate = fundingData.disbursementDate?.toDate ? fundingData.disbursementDate.toDate() :
                                  (fundingData.disbursementDate ? new Date(fundingData.disbursementDate) : null);

          // Determine if exited
          const isExited = pipelineStage.toLowerCase().includes('exit') || 
                          pipelineStage.toLowerCase().includes('complete') ||
                          pipelineStage === 'Deal Complete' ||
                          exitDate !== null;

          // Calculate time to exit (months)
          let monthsToExit = 0;
          if (isExited && disbursementDate) {
            const exitDateFinal = exitDate || updatedAt;
            monthsToExit = Math.round((exitDateFinal - disbursementDate) / (1000 * 60 * 60 * 24 * 30));
          }

          // Determine quarter based on exit date or current date
          const dateForQuarter = exitDate || createdAt;
          const month = dateForQuarter.getMonth();
          const quarter = Math.floor(month / 3) + 1; // 1-4

          // Calculate exit multiple (return on investment)
          const amountInvested = parseFloat(fundingData.amountApproved || appData.amountApproved || 0);
          const amountReturned = parseFloat(appData.amountReturned || amountInvested * 1.5); // Default 1.5x if not specified
          const exitMultiple = amountInvested > 0 ? (amountReturned / amountInvested) : 0;

          // Check reinvestment status
          const hasReinvested = appData.reinvested === true || 
                               (isExited && appData.portfolioReinvestment === true);

          return {
            id: appDoc.id,
            smeId: appData.smeId,
            smeName,
            pipelineStage,
            isExited,
            exitDate: exitDate || updatedAt,
            quarter,
            monthsToExit,
            exitMultiple,
            amountInvested,
            amountReturned,
            hasReinvested,
            createdAt,
            disbursementDate,
            month: dateForQuarter.getMonth() // Add month for monthly view
          };
        } catch (error) {
          console.error("Error processing SME exit data:", error);
          return null;
        }
      });

      const allExitData = (await Promise.all(exitPromises)).filter(data => data !== null);
      console.log("Processed exit data:", allExitData.length);

      // Calculate portfolio-wide exit metrics
      const metrics = calculateExitMetrics(allExitData);
      setExitData(metrics);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching exit data:", error);
      setLoading(false);
    }
  };

  const calculateExitMetrics = (allData) => {
    if (allData.length === 0) {
      return {
        exitHistory: { q1: 0, q2: 0, q3: 0, q4: 0 },
        timeToExit: { q1: 0, q2: 0, q3: 0, q4: 0 },
        exitMultiples: [],
        reinvestmentRatio: { reinvested: 0, held: 100 }
      };
    }

    // 1. Calculate Exit/Repayment History by Quarter
    const exitedSMEs = allData.filter(sme => sme.isExited);
    const exitsByQuarter = { q1: 0, q2: 0, q3: 0, q4: 0 };
    const exitsByMonth = Array(12).fill(0); // For monthly data
    
    exitedSMEs.forEach(sme => {
      const qKey = `q${sme.quarter}`;
      if (exitsByQuarter[qKey] !== undefined) {
        exitsByQuarter[qKey]++;
      }
      // Count by month
      if (sme.month !== undefined && sme.month >= 0 && sme.month < 12) {
        exitsByMonth[sme.month]++;
      }
    });

    // 2. Calculate Average Time-to-Exit by Quarter
    const timeByQuarter = { q1: [], q2: [], q3: [], q4: [] };
    const timeByMonth = Array(12).fill().map(() => []); // For monthly data
    
    exitedSMEs.forEach(sme => {
      if (sme.monthsToExit > 0) {
        const qKey = `q${sme.quarter}`;
        if (timeByQuarter[qKey]) {
          timeByQuarter[qKey].push(sme.monthsToExit);
        }
        // Time by month
        if (sme.month !== undefined && sme.month >= 0 && sme.month < 12) {
          timeByMonth[sme.month].push(sme.monthsToExit);
        }
      }
    });

    const avgTimeToExit = {
      q1: timeByQuarter.q1.length > 0 ? Math.round(timeByQuarter.q1.reduce((a, b) => a + b, 0) / timeByQuarter.q1.length) : 0,
      q2: timeByQuarter.q2.length > 0 ? Math.round(timeByQuarter.q2.reduce((a, b) => a + b, 0) / timeByQuarter.q2.length) : 0,
      q3: timeByQuarter.q3.length > 0 ? Math.round(timeByQuarter.q3.reduce((a, b) => a + b, 0) / timeByQuarter.q3.length) : 0,
      q4: timeByQuarter.q4.length > 0 ? Math.round(timeByQuarter.q4.reduce((a, b) => a + b, 0) / timeByQuarter.q4.length) : 0
    };

    // Calculate average time by month
    const avgTimeByMonth = timeByMonth.map(monthData => 
      monthData.length > 0 ? Math.round(monthData.reduce((a, b) => a + b, 0) / monthData.length) : 0
    );

    // 3. Calculate Exit Multiples for Top 5 Exits
    const exitMultiples = exitedSMEs
      .filter(sme => sme.exitMultiple > 0)
      .sort((a, b) => b.exitMultiple - a.exitMultiple)
      .slice(0, 5)
      .map(sme => ({
        name: sme.smeName,
        multiple: sme.exitMultiple.toFixed(1)
      }));

    // 4. Calculate Reinvestment Ratio
    const totalExited = exitedSMEs.length;
    const reinvestedCount = exitedSMEs.filter(sme => sme.hasReinvested).length;
    
    const reinvestmentRatio = {
      reinvested: totalExited > 0 ? Math.round((reinvestedCount / totalExited) * 100) : 0,
      held: totalExited > 0 ? Math.round(((totalExited - reinvestedCount) / totalExited) * 100) : 100
    };

    return {
      exitHistory: exitsByQuarter,
      exitHistoryMonthly: exitsByMonth,
      timeToExit: avgTimeToExit,
      timeToExitMonthly: avgTimeByMonth,
      exitMultiples,
      reinvestmentRatio
    };
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

  // Data generation functions with time view support
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

  // Empty chart data structures
  const generateEmptyBarData = (labels, label, colorIndex) => ({
    labels,
    datasets: [{
      label,
      data: labels.map(() => 0),
      backgroundColor: brownShades[colorIndex % brownShades.length],
      borderColor: brownShades[colorIndex % brownShades.length],
      borderWidth: 1
    }]
  });

  const generateEmptyLineData = (labels, datasets) => ({
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: labels.map(() => 0),
      borderColor: brownShades[i % brownShades.length] + '80',
      backgroundColor: brownShades[i % brownShades.length] + '20',
      borderWidth: 1,
      borderDash: [5, 5],
      fill: ds.fill || false,
      tension: 0
    }))
  });

  const generateEmptyPieData = (labels) => ({
    labels,
    datasets: [{
      data: labels.map(() => 50), // Equal distribution for empty state
      backgroundColor: labels.map((_, i) => brownShades[i % brownShades.length] + '40'),
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 0
    }]
  });

  // Get labels based on time view
  const getTimeLabels = (view) => {
    switch (view) {
      case 'Monthly':
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      case 'Quarterly':
        return ['Q1', 'Q2', 'Q3', 'Q4'];
      case 'Yearly':
        const currentYear = new Date().getFullYear();
        return [`${currentYear-2}`, `${currentYear-1}`, `${currentYear}`, `${currentYear+1}`];
      default:
        return ['Q1', 'Q2', 'Q3', 'Q4'];
    }
  };

  // Get data based on time view
  const getExitHistoryData = (view) => {
    const labels = getTimeLabels(view);
    
    switch (view) {
      case 'Monthly':
        // Use monthly exit data
        return exitData.exitHistoryMonthly || Array(12).fill(0);
      case 'Quarterly':
        return [
          exitData.exitHistory.q1,
          exitData.exitHistory.q2,
          exitData.exitHistory.q3,
          exitData.exitHistory.q4
        ];
      case 'Yearly':
        // For yearly view, show total exits per year
        const yearlyTotal = exitData.exitHistory.q1 + exitData.exitHistory.q2 + 
                          exitData.exitHistory.q3 + exitData.exitHistory.q4;
        return [0, 0, yearlyTotal, 0]; // Show in current year
      default:
        return Array(labels.length).fill(0);
    }
  };

  const getTimeToExitData = (view) => {
    const labels = getTimeLabels(view);
    
    switch (view) {
      case 'Monthly':
        // Use monthly time to exit data
        return exitData.timeToExitMonthly || Array(12).fill(0);
      case 'Quarterly':
        return [
          exitData.timeToExit.q1,
          exitData.timeToExit.q2,
          exitData.timeToExit.q3,
          exitData.timeToExit.q4
        ];
      case 'Yearly':
        // For yearly view, use average time to exit
        const avgTime = (exitData.timeToExit.q1 + exitData.timeToExit.q2 + 
                        exitData.timeToExit.q3 + exitData.timeToExit.q4) / 4;
        return labels.map(() => Math.round(avgTime));
      default:
        return Array(labels.length).fill(0);
    }
  };

  // Chart Components
  const BarChartWithTitle = ({ data, title, chartTitle, chartId, isEmpty = false }) => {
    const handleEyeClick = () => {
      if (isEmpty) {
        openPopup(
          <div className="popup-content">
            <h3>{title}</h3>
            <div className="popup-description">
              No data available for {title.toLowerCase()}. Data will appear when deals are completed.
            </div>
            <div className="popup-chart">
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-text">
                  No data available yet.<br/>
                  Chart structure shown for preview.
                </div>
              </div>
            </div>
          </div>
        );
        return;
      }

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
          {isEmpty ? (
            <div style={{ opacity: 0.5 }}>
              <Bar data={data} options={staticBarOptions} />
            </div>
          ) : (
            <Bar data={data} options={staticBarOptions} />
          )}
        </div>
      </div>
    );
  };

  const LineChartWithTitle = ({ data, title, chartTitle, chartId, isEmpty = false }) => {
    const handleEyeClick = () => {
      if (isEmpty) {
        openPopup(
          <div className="popup-content">
            <h3>{title}</h3>
            <div className="popup-description">
              No data available for {title.toLowerCase()}. Data will appear when deals are completed.
            </div>
            <div className="popup-chart">
              <div className="empty-state">
                <div className="empty-state-icon">📈</div>
                <div className="empty-state-text">
                  No data available yet.<br/>
                  Chart structure shown for preview.
                </div>
              </div>
            </div>
          </div>
        );
        return;
      }

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
          {isEmpty ? (
            <div style={{ opacity: 0.5 }}>
              <Line data={data} options={staticLineOptions} />
            </div>
          ) : (
            <Line data={data} options={staticLineOptions} />
          )}
        </div>
      </div>
    );
  };

  const PieChartWithNumbers = ({ title, labels, data, chartId, isEmpty = false }) => {
    const chartData = isEmpty ? generateEmptyPieData(labels) : generatePieData(labels, data);

    const plugins = [{
      id: 'centerText',
      afterDraw: (chart) => {
        if (isEmpty) return;
        
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
      if (isEmpty) {
        openPopup(
          <div className="popup-content">
            <h3>{title}</h3>
            <div className="popup-description">
              No data available for {title.toLowerCase()}. Data will appear when deals are completed.
            </div>
            <div className="popup-chart">
              <div className="empty-state">
                <div className="empty-state-icon">🥧</div>
                <div className="empty-state-text">
                  No data available yet.<br/>
                  Chart structure shown for preview.
                </div>
              </div>
            </div>
          </div>
        );
        return;
      }

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
          {isEmpty ? (
            <div style={{ opacity: 0.5 }}>
              <Doughnut data={chartData} options={staticPieOptions} />
            </div>
          ) : (
            <Doughnut data={chartData} options={staticPieOptions} plugins={plugins} />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="exit-liquidity">
        <div className="loading-container">
          <Loader size={48} style={{ color: "#a67c52", animation: "spin 1s linear infinite" }} />
          <p className="loading-text">Loading exit & liquidity data...</p>
        </div>
      </div>
    );
  }

  // Check if we have any meaningful data
  const hasExitData = exitData.exitHistory.q1 + exitData.exitHistory.q2 + exitData.exitHistory.q3 + exitData.exitHistory.q4 > 0;
  const hasTimeToExitData = exitData.timeToExit.q1 + exitData.timeToExit.q2 + exitData.timeToExit.q3 + exitData.timeToExit.q4 > 0;
  const hasExitMultiples = exitData.exitMultiples.length > 0;
  const hasReinvestmentData = exitData.reinvestmentRatio.reinvested > 0;

  // Get current time labels
  const currentLabels = getTimeLabels(timeToExitView);

  return (
    <div className="exit-liquidity">
      <div className="time-view-controls">
        <TimeViewSelector 
          currentView={timeToExitView} 
          onViewChange={setTimeToExitView}
        />
      </div>
      
      <div className="exit-charts-grid">
        {/* Exit/Repayment History */}
        {hasExitData ? (
          <BarChartWithTitle
            data={generateBarData(
              currentLabels,
              getExitHistoryData(timeToExitView),
              '# of Exits',
              0
            )}
            title="Exit / Repayment History"
            chartTitle={`Number of exits or deal completions (${timeToExitView})`}
            chartId="exit-repayment-history"
          />
        ) : (
          <BarChartWithTitle
            data={generateEmptyBarData(
              currentLabels,
              '# of Exits',
              0
            )}
            title="Exit / Repayment History"
            chartTitle={`Number of exits or deal completions (${timeToExitView})`}
            chartId="exit-repayment-history"
            isEmpty={true}
          />
        )}

        {/* Avg. Time-to-Exit */}
        {hasTimeToExitData ? (
          <LineChartWithTitle
            data={generateLineData(
              currentLabels,
              [
                { 
                  label: 'Avg Months', 
                  values: getTimeToExitData(timeToExitView)
                }
              ]
            )}
            title="Avg. Time-to-Exit"
            chartTitle={`Average months from disbursement to exit (${timeToExitView})`}
            chartId="time-to-exit"
          />
        ) : (
          <LineChartWithTitle
            data={generateEmptyLineData(
              currentLabels,
              [
                { label: 'Avg Months', values: [] }
              ]
            )}
            title="Avg. Time-to-Exit"
            chartTitle={`Average months from disbursement to exit (${timeToExitView})`}
            chartId="time-to-exit"
            isEmpty={true}
          />
        )}

        {/* Exit Multiple */}
        {hasExitMultiples ? (
          <BarChartWithTitle
            data={generateBarData(
              exitData.exitMultiples.map(e => e.name),
              exitData.exitMultiples.map(e => parseFloat(e.multiple)),
              'Multiple (x)',
              1
            )}
            title="Exit Multiple"
            chartTitle="Return multiples for top exited deals (x)"
            chartId="exit-multiple"
          />
        ) : (
          <BarChartWithTitle
            data={generateEmptyBarData(
              ['Deal 1', 'Deal 2', 'Deal 3', 'Deal 4', 'Deal 5'],
              'Multiple (x)',
              1
            )}
            title="Exit Multiple"
            chartTitle="Return multiples for top exited deals (x)"
            chartId="exit-multiple"
            isEmpty={true}
          />
        )}

        {/* Reinvestment Ratio */}
        {hasReinvestmentData ? (
          <PieChartWithNumbers
            title="Reinvestment Ratio"
            labels={['Reinvested', 'Held']}
            data={[exitData.reinvestmentRatio.reinvested, exitData.reinvestmentRatio.held]}
            chartId="reinvestment-ratio"
          />
        ) : (
          <PieChartWithNumbers
            title="Reinvestment Ratio"
            labels={['Reinvested', 'Held']}
            data={[50, 50]}
            chartId="reinvestment-ratio"
            isEmpty={true}
          />
        )}
      </div>
    </div>
  );
};

export default ExitLiquidityMetrics;