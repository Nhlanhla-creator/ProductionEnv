// tabs/InsightsAIRecommendations.js
import React, { useState, useEffect } from 'react';
import { FiEye, FiArrowUp, FiAlertTriangle } from 'react-icons/fi';
import { Loader } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

// Styles for InsightsAIRecommendations 
const styles = `
.insights-ai {
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

.insights-charts-grid {
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

.chart-container.full-width {
  grid-column: 1 / -1;
  height: 450px;
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

/* Table Styles */
.table-container {
  overflow-x: auto;
  margin-top: 10px;
  height: 300px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  background-color: #f5f5f5;
  color: #5e3f26;
  font-weight: 600;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #ede4d8;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.data-table tr:hover {
  background-color: #f9f9f9;
  transform: none !important;
  animation: none !important;
  transition: none !important;
}

.risk-table tr:hover {
  background-color: #fff3f3;
  transform: none !important;
  animation: none !important;
  transition: none !important;
}

/* Trend Alert Cards */
.trend-alert-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  border-left: 4px solid #4CAF50;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.trend-alert-card.negative {
  border-left-color: #f44336;
}

.trend-alert-card:hover {
  transform: none !important;
  animation: none !important;
  transition: none !important;
  box-shadow: none !important;
}

.trend-alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.trend-alert-title {
  font-size: 14px;
  font-weight: 600;
  color: #5e3f26;
}

.trend-alert-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.trend-alert-icon.positive {
  background: #E8F5E8;
  color: #4CAF50;
}

.trend-alert-icon.negative {
  background: #FFEBEE;
  color: #f44336;
}

.trend-alert-value {
  font-size: 18px;
  font-weight: 700;
  color: #5e3f26;
  margin-bottom: 5px;
}

.trend-alert-description {
  font-size: 11px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.3;
}

.trend-alerts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 20px;
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

.table-container-popup {
  overflow-x: auto;
  margin-top: 15px;
}

.trend-alerts-grid-popup {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 20px;
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

/* Responsive Design */
@media (max-width: 992px) {
  .insights-charts-grid {
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
  
  .trend-alerts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .chart-container {
    padding: 15px;
    height: 320px;
  }
  
  .insights-charts-grid {
    padding: 0 5px;
  }
  
  .data-table {
    font-size: 12px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px;
  }
  
  .trend-alert-card {
    height: 100px;
    padding: 12px;
  }
  
  .trend-alert-value {
    font-size: 16px;
  }
  
  .trend-alert-description {
    font-size: 10px;
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

const InsightsAIRecommendations = ({ openPopup }) => {
  const [portfolioTrendView, setPortfolioTrendView] = useState('Quarterly');
  const [loading, setLoading] = useState(true);
  const [insightsData, setInsightsData] = useState({
    topPerformers: [],
    atRiskSMEs: [],
    trendAlerts: [],
    defaultFlags: [] // Added to store flags from loan repayments
  });

  useEffect(() => {
    fetchInsightsData();
  }, [portfolioTrendView]);

  const fetchInsightsData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log("No authenticated user");
        setLoading(false);
        return;
      }

      // Fetch all investor's applications (all stages)
      const applicationsQuery = query(
        collection(db, "investorApplications"),
        where("funderId", "==", currentUser.uid)
      );

      const applicationsSnapshot = await getDocs(applicationsQuery);
      console.log("Found applications:", applicationsSnapshot.docs.length);

      // Process all applications to get SME data
      const smeDataPromises = applicationsSnapshot.docs.map(async (appDoc) => {
        const appData = appDoc.data();
        
        try {
          let profileData = {};
          let bigScore = 0;

          // Fetch SME profile
          if (appData.smeId) {
            const profileRef = doc(db, "universalProfiles", appData.smeId);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
              profileData = profileSnap.data();
              bigScore = profileData.bigScore || 0;
            }
          }

          const smeName =
            profileData.entityOverview?.tradingName ||
            profileData.entityOverview?.registeredName ||
            appData.companyName ||
            appData.smeName ||
            "Unnamed Business";

          const dealAmount = appData.fundingDetails?.amountApproved || appData.fundingRequired || 0;
          const pipelineStage = appData.pipelineStage || "Application";
          
          // Calculate days since last update
          const lastUpdate = appData.updatedAt ? new Date(appData.updatedAt) : new Date(appData.createdAt);
          const daysSinceUpdate = Math.floor((new Date() - lastUpdate) / (1000 * 60 * 60 * 24));

          // Fetch default flags for this SME
          let defaultFlags = [];
          if (appData.smeId) {
            try {
              const flagsRef = doc(db, "loan-repayments", appData.smeId);
              const flagsSnap = await getDoc(flagsRef);
              if (flagsSnap.exists()) {
                const flagsData = flagsSnap.data();
                defaultFlags = flagsData.flags || [];
              }
            } catch (error) {
              console.log("No default flags found for SME:", appData.smeId);
            }
          }

          return {
            id: appDoc.id,
            smeId: appData.smeId || appData.userId,
            smeName,
            dealAmount,
            bigScore,
            pipelineStage,
            sector: profileData.entityOverview?.economicSectors?.[0] || "Not specified",
            location: profileData.entityOverview?.location || "Not specified",
            createdAt: appData.createdAt,
            updatedAt: appData.updatedAt,
            daysSinceUpdate,
            status: appData.status,
            fundingDetails: appData.fundingDetails || {},
            defaultFlags, // Add default flags to SME data
            // Risk indicators
            missedReports: daysSinceUpdate > 90 ? Math.floor(daysSinceUpdate / 45) : 0,
            isStagnant: daysSinceUpdate > 180,
            isDeclined: pipelineStage?.toLowerCase().includes('decline'),
            profileData
          };
        } catch (error) {
          console.error("Error processing SME:", error);
          return null;
        }
      });

      const allSMEData = (await Promise.all(smeDataPromises)).filter(sme => sme !== null);
      console.log("Processed SME data:", allSMEData.length);

      // Calculate insights
      const insights = calculateInsights(allSMEData);
      setInsightsData(insights);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching insights data:", error);
      setLoading(false);
    }
  };

  const calculateInsights = (smeData) => {
    // 1. Top 5 High Performers (based on BIG Score and deal progress)
    const activeDeals = smeData.filter(sme => 
      !sme.isDeclined && 
      sme.pipelineStage !== "withdrawn"
    );

    const topPerformers = [...activeDeals]
      .sort((a, b) => {
        // Sort by BIG Score first, then by deal amount
        if (b.bigScore !== a.bigScore) {
          return b.bigScore - a.bigScore;
        }
        const amountA = parseFloat(String(a.dealAmount).replace(/[^0-9.]/g, '')) || 0;
        const amountB = parseFloat(String(b.dealAmount).replace(/[^0-9.]/g, '')) || 0;
        return amountB - amountA;
      })
      .slice(0, 5)
      .map(sme => {
        const amount = parseFloat(String(sme.dealAmount).replace(/[^0-9.]/g, '')) || 0;
        
        return {
          smeName: sme.smeName,
          score: sme.bigScore || 0,
          growth: calculateGrowthPercentage(sme),
          ask: formatCurrency(amount),
          reason: getPerformanceReason(sme)
        };
      });

    // 2. At-Risk / Watchlist SMEs - Now includes default flags
    const atRiskSMEs = smeData
      .filter(sme => {
        // Identify at-risk SMEs based on various criteria including default flags
        return (
          sme.missedReports > 0 ||
          sme.isStagnant ||
          sme.bigScore < 50 ||
          sme.defaultFlags.length > 0 || // Include SMEs with default flags
          (sme.pipelineStage === "Under Review" && sme.daysSinceUpdate > 60) ||
          (sme.pipelineStage === "Due Diligence" && sme.daysSinceUpdate > 90)
        );
      })
      .slice(0, 5)
      .map(sme => ({
        smeName: sme.smeName,
        riskFlag: getRiskFlag(sme),
        action: getRecommendedAction(sme),
        defaultFlags: sme.defaultFlags // Include actual default flags
      }));

    // 3. Portfolio Trend Alerts
    const trendAlerts = calculateTrendAlerts(smeData);

    // 4. Aggregate default flags across portfolio
    const allDefaultFlags = smeData.flatMap(sme => 
      sme.defaultFlags.map(flag => ({
        ...flag,
        smeName: sme.smeName
      }))
    );

    return {
      topPerformers,
      atRiskSMEs,
      trendAlerts,
      defaultFlags: allDefaultFlags
    };
  };

  const calculateGrowthPercentage = (sme) => {
    // Calculate growth based on pipeline progression
    const stageWeights = {
      'application': 20,
      'under review': 40,
      'due diligence': 60,
      'funding approved': 80,
      'termsheet': 90,
      'deal complete': 100
    };

    const currentWeight = stageWeights[sme.pipelineStage?.toLowerCase()] || 0;
    const timeBonus = Math.min(sme.daysSinceUpdate < 30 ? 10 : 0, 10);
    const scoreBonus = Math.min(Math.floor(sme.bigScore / 10), 10);

    return Math.min(currentWeight + timeBonus + scoreBonus - 20, 99);
  };

  const getPerformanceReason = (sme) => {
    if (sme.bigScore >= 80) return "Excellent fundability score";
    if (sme.bigScore >= 70) return "Strong growth potential";
    if (sme.pipelineStage === "Deal Complete") return "Successfully closed deal";
    if (sme.pipelineStage === "Funding Approved") return "Approved for funding";
    if (sme.sector?.toLowerCase().includes("tech")) return "High-growth sector";
    return "Promising opportunity";
  };

  const getRiskFlag = (sme) => {
    // Check for default flags first
    if (sme.defaultFlags && sme.defaultFlags.length > 0) {
      const criticalFlags = sme.defaultFlags.filter(flag => flag.status === "Critical");
      const warningFlags = sme.defaultFlags.filter(flag => flag.status === "Warning");
      
      if (criticalFlags.length > 0) {
        return `${criticalFlags.length} critical default flag${criticalFlags.length > 1 ? 's' : ''}`;
      }
      if (warningFlags.length > 0) {
        return `${warningFlags.length} warning default flag${warningFlags.length > 1 ? 's' : ''}`;
      }
      return `${sme.defaultFlags.length} default flag${sme.defaultFlags.length > 1 ? 's' : ''}`;
    }
    
    if (sme.missedReports >= 2) return `Missed ${sme.missedReports} reports`;
    if (sme.isStagnant) return "Pipeline stagnation (>6mo)";
    if (sme.bigScore < 40) return "Low fundability score";
    if (sme.bigScore < 50) return "Below target score";
    if (sme.daysSinceUpdate > 90) return "No recent updates";
    return "Requires attention";
  };

  const getRecommendedAction = (sme) => {
    // Prioritize actions based on default flags
    if (sme.defaultFlags && sme.defaultFlags.length > 0) {
      const criticalFlags = sme.defaultFlags.filter(flag => flag.status === "Critical");
      if (criticalFlags.length > 0) return "Immediate intervention required";
      
      const warningFlags = sme.defaultFlags.filter(flag => flag.status === "Warning");
      if (warningFlags.length > 0) return "Review default flags urgently";
      
      return "Monitor default flags";
    }
    
    if (sme.missedReports >= 2) return "Follow up immediately";
    if (sme.isStagnant) return "Review and decide";
    if (sme.bigScore < 40) return "Request improvements";
    if (sme.bigScore < 50) return "Monitor progress";
    if (sme.daysSinceUpdate > 90) return "Request status update";
    return "Schedule review";
  };

  const calculateTrendAlerts = (smeData) => {
    const totalSMEs = smeData.length;
    if (totalSMEs === 0) {
      return [
        {
          title: "Portfolio Status",
          value: "No Data",
          description: "Start building your portfolio",
          isPositive: true
        }
      ];
    }

    // Calculate various metrics
    const declined = smeData.filter(sme => sme.isDeclined).length;
    const declineRate = ((declined / totalSMEs) * 100).toFixed(1);

    const avgBigScore = (smeData.reduce((sum, sme) => sum + (sme.bigScore || 0), 0) / totalSMEs).toFixed(1);
    const highScorers = smeData.filter(sme => sme.bigScore >= 70).length;
    const scoreImprovement = ((highScorers / totalSMEs) * 100).toFixed(1);

    const stagnantCount = smeData.filter(sme => sme.isStagnant).length;
    const activeDeals = smeData.filter(sme => 
      sme.pipelineStage === "Under Review" || 
      sme.pipelineStage === "Due Diligence" ||
      sme.pipelineStage === "Funding Approved"
    ).length;

    const completedDeals = smeData.filter(sme => 
      sme.pipelineStage === "Deal Complete"
    ).length;
    const successRate = totalSMEs > 0 ? ((completedDeals / totalSMEs) * 100).toFixed(1) : 0;

    // Calculate default flags metrics
    const smesWithFlags = smeData.filter(sme => sme.defaultFlags && sme.defaultFlags.length > 0).length;
    const flagsRate = ((smesWithFlags / totalSMEs) * 100).toFixed(1);

    return [
      {
        title: "Decline Rate",
        value: `${declineRate}%`,
        description: declined > 0 ? `${declined} applications declined` : "No declines in portfolio",
        isPositive: parseFloat(declineRate) < 15
      },
      {
        title: "Avg BIG Score",
        value: avgBigScore,
        description: `${scoreImprovement}% of portfolio above 70`,
        isPositive: parseFloat(avgBigScore) >= 60
      },
      {
        title: "Default Flags",
        value: `${flagsRate}%`,
        description: `${smesWithFlags} SMEs with default flags`,
        isPositive: parseFloat(flagsRate) === 0
      },
      {
        title: "Success Rate",
        value: `${successRate}%`,
        description: `${completedDeals} deals successfully closed`,
        isPositive: parseFloat(successRate) >= 20
      }
    ];
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "Not specified";
    const numAmount = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;
    if (numAmount >= 1000000) {
      return `R${(numAmount / 1000000).toFixed(1)}m`;
    }
    return `R${numAmount.toLocaleString()}`;
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

  // Trend Alert Card Component
  const TrendAlertCard = ({ title, value, description, isPositive = true }) => (
    <div className={`trend-alert-card ${isPositive ? 'positive' : 'negative'}`}>
      <div className="trend-alert-header">
        <div className="trend-alert-title">{title}</div>
        <div className={`trend-alert-icon ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <FiArrowUp /> : <FiAlertTriangle />}
        </div>
      </div>
      <div className="trend-alert-value">{value}</div>
      <div className="trend-alert-description">{description}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="insights-ai">
        <div className="loading-container">
          <Loader size={48} style={{ color: "#a67c52", animation: "spin 1s linear infinite" }} />
          <p className="loading-text">Loading portfolio insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="insights-ai">
      <div className="time-view-controls">
        <TimeViewSelector 
          currentView={portfolioTrendView} 
          onViewChange={setPortfolioTrendView}
        />
      </div>
      
      <div className="insights-charts-grid">
        {/* Top 5 High Performers */}
        <div className="chart-container full-width">
          <div className="chart-header">
            <h3 className="chart-title">Top 5 High-Performers in Your Portfolio</h3>
            <button 
              className="breakdown-icon-btn"
              onClick={() => openPopup(
                <div className="popup-content">
                  <h3>Top 5 High-Performers</h3>
                  <div className="popup-description">
                    SMEs in your portfolio showing exceptional performance and strong fundability scores
                  </div>
                  {insightsData.topPerformers.length > 0 ? (
                    <div className="table-container-popup">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>SME</th>
                            <th>BIG Score</th>
                            <th>Progress</th>
                            <th>Investment</th>
                            <th>Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {insightsData.topPerformers.map((performer, idx) => (
                            <tr key={idx}>
                              <td>{performer.smeName}</td>
                              <td>{performer.score}</td>
                              <td>+{performer.growth}%</td>
                              <td>{performer.ask}</td>
                              <td>{performer.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">📊</div>
                      <div className="empty-state-text">
                        No high-performing SMEs in your portfolio yet
                      </div>
                    </div>
                  )}
                </div>
              )}
              title="View details"
            >
              <FiEye />
            </button>
          </div>
          <div className="table-container">
            {insightsData.topPerformers.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SME</th>
                    <th>BIG Score</th>
                    <th>Progress</th>
                    <th>Investment</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {insightsData.topPerformers.map((performer, idx) => (
                    <tr key={idx}>
                      <td>{performer.smeName}</td>
                      <td>{performer.score}</td>
                      <td style={{ color: '#4CAF50', fontWeight: '600' }}>+{performer.growth}%</td>
                      <td>{performer.ask}</td>
                      <td>{performer.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-text">
                  No high-performing SMEs in your portfolio yet.<br/>
                  As you invest in more companies, top performers will appear here.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* At-Risk / Watchlist SMEs - ALWAYS shows empty table structure */}
        <div className="chart-container full-width">
          <div className="chart-header">
            <h3 className="chart-title">At-Risk / Watchlist SMEs</h3>
            <button 
              className="breakdown-icon-btn"
              onClick={() => openPopup(
                <div className="popup-content">
                  <h3>At-Risk / Watchlist SMEs</h3>
                  <div className="popup-description">
                    SMEs in your portfolio requiring attention due to performance or activity concerns
                  </div>
                  {insightsData.atRiskSMEs.length > 0 ? (
                    <div className="table-container-popup">
                      <table className="data-table risk-table">
                        <thead>
                          <tr>
                            <th>SME</th>
                            <th>Risk Flag</th>
                            <th>Recommended Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {insightsData.atRiskSMEs.map((sme, idx) => (
                            <tr key={idx}>
                              <td>{sme.smeName}</td>
                              <td>{sme.riskFlag}</td>
                              <td>{sme.action}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="table-container-popup">
                      <table className="data-table risk-table">
                        <thead>
                          <tr>
                            <th>SME</th>
                            <th>Risk Flag</th>
                            <th>Recommended Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Empty table body - shows structure only */}
                        </tbody>
                      </table>
                      <div className="empty-state">
                        <div className="empty-state-icon">✅</div>
                        <div className="empty-state-text">
                          No at-risk SMEs detected in your portfolio.<br/>
                          All companies are performing within acceptable parameters.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              title="View details"
            >
              <FiEye />
            </button>
          </div>
          <div className="table-container">
            {insightsData.atRiskSMEs.length > 0 ? (
              <table className="data-table risk-table">
                <thead>
                  <tr>
                    <th>SME</th>
                    <th>Risk Flag</th>
                    <th>Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {insightsData.atRiskSMEs.map((sme, idx) => (
                    <tr key={idx}>
                      <td>{sme.smeName}</td>
                      <td style={{ color: '#f44336', fontWeight: '600' }}>{sme.riskFlag}</td>
                      <td>{sme.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div>
                <table className="data-table risk-table">
                  <thead>
                    <tr>
                      <th>SME</th>
                      <th>Risk Flag</th>
                      <th>Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Empty table body - shows structure only */}
                  </tbody>
                </table>
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <div className="empty-state-text">
                    No at-risk SMEs detected in your portfolio.<br/>
                    All companies are performing within acceptable parameters.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsAIRecommendations;