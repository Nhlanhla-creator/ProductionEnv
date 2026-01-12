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

// Add styles to document (keep existing styles)
const styleSheet = document.createElement('style');
styleSheet.textContent = styles; // Use your existing styles constant
document.head.appendChild(styleSheet);

const brownShades = [
  '#5e3f26', '#7d5a36', '#9c7c54', '#b8a082',
  '#3f2a18', '#d4c4b0', '#5D4037', '#3E2723'
];

// Static options (keep existing)
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
  const [timeToCompleteView, setTimeToCompleteView] = useState('Quarterly');
  const [loading, setLoading] = useState(true);
  const [completionData, setCompletionData] = useState({
    programHistory: { q1: 0, q2: 0, q3: 0, q4: 0 },
    timeToComplete: { q1: 0, q2: 0, q3: 0, q4: 0 },
    programOutcomes: [],
    followOnRatio: { continued: 0, completed: 100 }
  });

  useEffect(() => {
    fetchCompletionData();
  }, []);

  const fetchCompletionData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log("No authenticated user");
        setLoading(false);
        return;
      }

      // Fetch catalyst's support programs
      const applicationsQuery = query(
        collection(db, "catalystApplications"),
        where("catalystId", "==", currentUser.uid)
      );

      const applicationsSnapshot = await getDocs(applicationsQuery);
      console.log("Found support programs for completion analysis:", applicationsSnapshot.docs.length);

      // Process each support program's completion data
      const completionPromises = applicationsSnapshot.docs.map(async (appDoc) => {
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

          // Extract completion metrics
          const status = appData.status || '';
          const pipelineStage = appData.pipelineStage || '';
          
          // Parse dates
          const createdAt = appData.createdAt?.toDate ? appData.createdAt.toDate() : 
                           (appData.createdAt ? new Date(appData.createdAt) : new Date());
          const updatedAt = appData.updatedAt?.toDate ? appData.updatedAt.toDate() : 
                           (appData.updatedAt ? new Date(appData.updatedAt) : new Date());
          const completionDate = appData.completionDate?.toDate ? appData.completionDate.toDate() : 
                                (appData.completionDate ? new Date(appData.completionDate) : null);
          const programStartDate = appData.programStartDate?.toDate ? appData.programStartDate.toDate() :
                                  (appData.programStartDate ? new Date(appData.programStartDate) : createdAt);

          // Determine if program is completed
          const isCompleted = status.toLowerCase().includes('completed') || 
                             pipelineStage.toLowerCase().includes('closed') ||
                             pipelineStage.toLowerCase().includes('deal closed') ||
                             status === 'Deal Closed' ||
                             completionDate !== null;

          // Calculate program duration (months)
          let monthsToComplete = 0;
          if (isCompleted && programStartDate) {
            const completionDateFinal = completionDate || updatedAt;
            monthsToComplete = Math.round((completionDateFinal - programStartDate) / (1000 * 60 * 60 * 24 * 30));
          }

          // Determine quarter based on completion date or current date
          const dateForQuarter = completionDate || updatedAt;
          const month = dateForQuarter.getMonth();
          const quarter = Math.floor(month / 3) + 1; // 1-4

          // Calculate program outcome score
          const programValue = parseFloat(appData.programValue || appData.fundingRequired || 0);
          const impactScore = parseFloat(appData.impactScore || appData.outcomeScore || 0);
          const bigScore = parseFloat(profileData.bigScore || 0);
          
          // Calculate overall outcome score (0-100)
          let outcomeScore = 0;
          if (isCompleted) {
            // Weighted score: 40% program value, 30% impact score, 30% BIG score improvement
            const valueScore = Math.min(programValue / 1000000, 100); // Normalize to 0-100
            const impactScoreNormalized = Math.min(impactScore * 10, 100); // Scale 0-10 to 0-100
            outcomeScore = Math.round((valueScore * 0.4) + (impactScoreNormalized * 0.3) + (bigScore * 0.3));
          }

          // Check follow-on status (continued support)
          const hasFollowOn = appData.hasFollowOn === true || 
                              appData.continuedSupport === true ||
                              (isCompleted && appData.followOnProgram === true);

          return {
            id: appDoc.id,
            smeId: appData.smeId,
            smeName,
            status,
            pipelineStage,
            isCompleted,
            completionDate: completionDate || updatedAt,
            quarter,
            monthsToComplete,
            outcomeScore,
            programValue,
            impactScore,
            bigScore,
            hasFollowOn,
            programStartDate,
            month: dateForQuarter.getMonth() // Add month for monthly view
          };
        } catch (error) {
          console.error("Error processing program completion data:", error);
          return null;
        }
      });

      const allCompletionData = (await Promise.all(completionPromises)).filter(data => data !== null);
      console.log("Processed completion data:", allCompletionData.length);

      // Calculate portfolio-wide completion metrics
      const metrics = calculateCompletionMetrics(allCompletionData);
      setCompletionData(metrics);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching completion data:", error);
      setLoading(false);
    }
  };

  const calculateCompletionMetrics = (allData) => {
    if (allData.length === 0) {
      return {
        programHistory: { q1: 0, q2: 0, q3: 0, q4: 0 },
        timeToComplete: { q1: 0, q2: 0, q3: 0, q4: 0 },
        programOutcomes: [],
        followOnRatio: { continued: 0, completed: 100 }
      };
    }

    // 1. Calculate Program Completion History by Quarter
    const completedPrograms = allData.filter(program => program.isCompleted);
    const completionsByQuarter = { q1: 0, q2: 0, q3: 0, q4: 0 };
    const completionsByMonth = Array(12).fill(0);
    
    completedPrograms.forEach(program => {
      const qKey = `q${program.quarter}`;
      if (completionsByQuarter[qKey] !== undefined) {
        completionsByQuarter[qKey]++;
      }
      if (program.month !== undefined && program.month >= 0 && program.month < 12) {
        completionsByMonth[program.month]++;
      }
    });

    // 2. Calculate Average Time-to-Complete by Quarter
    const timeByQuarter = { q1: [], q2: [], q3: [], q4: [] };
    const timeByMonth = Array(12).fill().map(() => []);
    
    completedPrograms.forEach(program => {
      if (program.monthsToComplete > 0) {
        const qKey = `q${program.quarter}`;
        if (timeByQuarter[qKey]) {
          timeByQuarter[qKey].push(program.monthsToComplete);
        }
        if (program.month !== undefined && program.month >= 0 && program.month < 12) {
          timeByMonth[program.month].push(program.monthsToComplete);
        }
      }
    });

    const avgTimeToComplete = {
      q1: timeByQuarter.q1.length > 0 ? Math.round(timeByQuarter.q1.reduce((a, b) => a + b, 0) / timeByQuarter.q1.length) : 0,
      q2: timeByQuarter.q2.length > 0 ? Math.round(timeByQuarter.q2.reduce((a, b) => a + b, 0) / timeByQuarter.q2.length) : 0,
      q3: timeByQuarter.q3.length > 0 ? Math.round(timeByQuarter.q3.reduce((a, b) => a + b, 0) / timeByQuarter.q3.length) : 0,
      q4: timeByQuarter.q4.length > 0 ? Math.round(timeByQuarter.q4.reduce((a, b) => a + b, 0) / timeByQuarter.q4.length) : 0
    };

    // Calculate average time by month
    const avgTimeByMonth = timeByMonth.map(monthData => 
      monthData.length > 0 ? Math.round(monthData.reduce((a, b) => a + b, 0) / monthData.length) : 0
    );

    // 3. Calculate Program Outcomes for Top 5 Completed Programs
    const programOutcomes = completedPrograms
      .filter(program => program.outcomeScore > 0)
      .sort((a, b) => b.outcomeScore - a.outcomeScore)
      .slice(0, 5)
      .map(program => ({
        name: program.smeName,
        score: program.outcomeScore,
        duration: program.monthsToComplete,
        value: program.programValue
      }));

    // 4. Calculate Follow-on Support Ratio
    const totalCompleted = completedPrograms.length;
    const followOnCount = completedPrograms.filter(program => program.hasFollowOn).length;
    
    const followOnRatio = {
      continued: totalCompleted > 0 ? Math.round((followOnCount / totalCompleted) * 100) : 0,
      completed: totalCompleted > 0 ? Math.round(((totalCompleted - followOnCount) / totalCompleted) * 100) : 100
    };

    return {
      programHistory: completionsByQuarter,
      programHistoryMonthly: completionsByMonth,
      timeToComplete: avgTimeToComplete,
      timeToCompleteMonthly: avgTimeByMonth,
      programOutcomes,
      followOnRatio
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
      data: labels.map(() => 50),
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
  const getProgramHistoryData = (view) => {
    const labels = getTimeLabels(view);
    
    switch (view) {
      case 'Monthly':
        return completionData.programHistoryMonthly || Array(12).fill(0);
      case 'Quarterly':
        return [
          completionData.programHistory.q1,
          completionData.programHistory.q2,
          completionData.programHistory.q3,
          completionData.programHistory.q4
        ];
      case 'Yearly':
        const yearlyTotal = completionData.programHistory.q1 + completionData.programHistory.q2 + 
                          completionData.programHistory.q3 + completionData.programHistory.q4;
        return [0, 0, yearlyTotal, 0];
      default:
        return Array(labels.length).fill(0);
    }
  };

  const getTimeToCompleteData = (view) => {
    const labels = getTimeLabels(view);
    
    switch (view) {
      case 'Monthly':
        return completionData.timeToCompleteMonthly || Array(12).fill(0);
      case 'Quarterly':
        return [
          completionData.timeToComplete.q1,
          completionData.timeToComplete.q2,
          completionData.timeToComplete.q3,
          completionData.timeToComplete.q4
        ];
      case 'Yearly':
        const avgTime = (completionData.timeToComplete.q1 + completionData.timeToComplete.q2 + 
                        completionData.timeToComplete.q3 + completionData.timeToComplete.q4) / 4;
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
              No data available for {title.toLowerCase()}. Data will appear when support programs are completed.
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
                <span className="detail-value">{data.datasets[0].data[index]} programs</span>
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
              No data available for {title.toLowerCase()}. Data will appear when support programs are completed.
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
                  {data.datasets.map(ds => `${ds.label}: ${ds.data[index]} months`).join(' | ')}
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
              No data available for {title.toLowerCase()}. Data will appear when support programs are completed.
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
          <p className="loading-text">Loading program completion data...</p>
        </div>
      </div>
    );
  }

  // Check if we have any meaningful data
  const hasProgramData = completionData.programHistory.q1 + completionData.programHistory.q2 + 
                        completionData.programHistory.q3 + completionData.programHistory.q4 > 0;
  const hasTimeToCompleteData = completionData.timeToComplete.q1 + completionData.timeToComplete.q2 + 
                               completionData.timeToComplete.q3 + completionData.timeToComplete.q4 > 0;
  const hasProgramOutcomes = completionData.programOutcomes.length > 0;
  const hasFollowOnData = completionData.followOnRatio.continued > 0;

  // Get current time labels
  const currentLabels = getTimeLabels(timeToCompleteView);

  return (
    <div className="exit-liquidity">
      <div className="time-view-controls">
        <TimeViewSelector 
          currentView={timeToCompleteView} 
          onViewChange={setTimeToCompleteView}
        />
      </div>
      
      <div className="exit-charts-grid">
        {/* Program Completion History */}
        {hasProgramData ? (
          <BarChartWithTitle
            data={generateBarData(
              currentLabels,
              getProgramHistoryData(timeToCompleteView),
              '# of Programs',
              0
            )}
            title="Program Completion History"
            chartTitle={`Number of completed support programs (${timeToCompleteView})`}
            chartId="program-completion-history"
          />
        ) : (
          <BarChartWithTitle
            data={generateEmptyBarData(
              currentLabels,
              '# of Programs',
              0
            )}
            title="Program Completion History"
            chartTitle={`Number of completed support programs (${timeToCompleteView})`}
            chartId="program-completion-history"
            isEmpty={true}
          />
        )}

        {/* Avg. Time-to-Complete */}
        {hasTimeToCompleteData ? (
          <LineChartWithTitle
            data={generateLineData(
              currentLabels,
              [
                { 
                  label: 'Avg Months', 
                  values: getTimeToCompleteData(timeToCompleteView)
                }
              ]
            )}
            title="Avg. Time-to-Complete"
            chartTitle={`Average months from program start to completion (${timeToCompleteView})`}
            chartId="time-to-complete"
          />
        ) : (
          <LineChartWithTitle
            data={generateEmptyLineData(
              currentLabels,
              [
                { label: 'Avg Months', values: [] }
              ]
            )}
            title="Avg. Time-to-Complete"
            chartTitle={`Average months from program start to completion (${timeToCompleteView})`}
            chartId="time-to-complete"
            isEmpty={true}
          />
        )}

        {/* Program Outcome Score */}
        {hasProgramOutcomes ? (
          <BarChartWithTitle
            data={generateBarData(
              completionData.programOutcomes.map(p => p.name),
              completionData.programOutcomes.map(p => p.score),
              'Outcome Score',
              1
            )}
            title="Program Outcome Score"
            chartTitle="Outcome scores for top completed programs (0-100)"
            chartId="program-outcome"
          />
        ) : (
          <BarChartWithTitle
            data={generateEmptyBarData(
              ['Program 1', 'Program 2', 'Program 3', 'Program 4', 'Program 5'],
              'Outcome Score',
              1
            )}
            title="Program Outcome Score"
            chartTitle="Outcome scores for top completed programs (0-100)"
            chartId="program-outcome"
            isEmpty={true}
          />
        )}

        {/* Follow-on Support Ratio */}
        {hasFollowOnData ? (
          <PieChartWithNumbers
            title="Follow-on Support Ratio"
            labels={['Continued Support', 'Completed Only']}
            data={[completionData.followOnRatio.continued, completionData.followOnRatio.completed]}
            chartId="follow-on-ratio"
          />
        ) : (
          <PieChartWithNumbers
            title="Follow-on Support Ratio"
            labels={['Continued Support', 'Completed Only']}
            data={[50, 50]}
            chartId="follow-on-ratio"
            isEmpty={true}
          />
        )}
      </div>
    </div>
  );
};

export default ExitLiquidityMetrics;