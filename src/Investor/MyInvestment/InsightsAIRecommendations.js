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
    performanceFlags: [] // Renamed from defaultFlags
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

      // Fetch all catalyst's support applications
      const applicationsQuery = query(
        collection(db, "catalystApplications"),
        where("catalystId", "==", currentUser.uid)
      );

      const applicationsSnapshot = await getDocs(applicationsQuery);
      console.log("Found support applications:", applicationsSnapshot.docs.length);

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

          const programValue = appData.programValue || appData.fundingRequired || 0;
          const status = appData.status || "New Application";
          const pipelineStage = appData.pipelineStage || "Evaluation";
          
          // Calculate days since last update
          const lastUpdate = appData.updatedAt ? new Date(appData.updatedAt) : new Date(appData.createdAt);
          const daysSinceUpdate = Math.floor((new Date() - lastUpdate) / (1000 * 60 * 60 * 24));

          // Fetch performance flags for this SME (renamed from default flags)
          let performanceFlags = [];
          if (appData.smeId) {
            try {
              const flagsRef = doc(db, "smePerformance", appData.smeId); // Changed collection name
              const flagsSnap = await getDoc(flagsRef);
              if (flagsSnap.exists()) {
                const flagsData = flagsSnap.data();
                performanceFlags = flagsData.performanceFlags || flagsData.flags || [];
              }
            } catch (error) {
              console.log("No performance flags found for SME:", appData.smeId);
            }
          }

          // Check for missed milestones or deliverables
          let missedMilestones = 0;
          if (appData.programMilestones) {
            const currentDate = new Date();
            missedMilestones = appData.programMilestones.filter(milestone => {
              const dueDate = new Date(milestone.dueDate);
              return milestone.status !== 'completed' && dueDate < currentDate;
            }).length;
          }

          // Calculate engagement score based on interactions
          let engagementScore = 0;
          if (appData.interactions) {
            const recentInteractions = appData.interactions.filter(interaction => {
              const interactionDate = new Date(interaction.date);
              return (new Date() - interactionDate) < (30 * 24 * 60 * 60 * 1000); // Last 30 days
            });
            engagementScore = Math.min(recentInteractions.length * 20, 100);
          }

          return {
            id: appDoc.id,
            smeId: appData.smeId,
            smeName,
            programValue,
            bigScore,
            status,
            pipelineStage,
            sector: profileData.entityOverview?.economicSectors?.[0] || "Not specified",
            location: profileData.entityOverview?.location || "Not specified",
            createdAt: appData.createdAt,
            updatedAt: appData.updatedAt,
            daysSinceUpdate,
            programStartDate: appData.programStartDate,
            programEndDate: appData.programEndDate,
            programMilestones: appData.programMilestones || [],
            missedMilestones,
            engagementScore,
            performanceFlags,
            // Risk indicators for support programs
            isStagnant: daysSinceUpdate > 90, // Stagnant if no update in 90 days
            isDeclined: status?.toLowerCase().includes('declined'),
            isCompleted: status?.toLowerCase().includes('completed') || status === "Deal Closed",
            hasLowEngagement: engagementScore < 40,
            hasMissedMilestones: missedMilestones > 0,
            profileData
          };
        } catch (error) {
          console.error("Error processing SME:", error);
          return null;
        }
      });

      const allSMEData = (await Promise.all(smeDataPromises)).filter(sme => sme !== null);
      console.log("Processed SME data for insights:", allSMEData.length);

      // Calculate insights
      const insights = calculateSupportInsights(allSMEData);
      setInsightsData(insights);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching insights data:", error);
      setLoading(false);
    }
  };

  const calculateSupportInsights = (smeData) => {
    const activePrograms = smeData.filter(sme => 
      !sme.isDeclined && 
      !sme.isCompleted &&
      sme.status !== "withdrawn"
    );

    // 1. Top 5 High Performers in Support Programs
    const topPerformers = [...activePrograms]
      .sort((a, b) => {
        // Sort by engagement score, then BIG score, then program value
        if (b.engagementScore !== a.engagementScore) {
          return b.engagementScore - a.engagementScore;
        }
        if (b.bigScore !== a.bigScore) {
          return b.bigScore - a.bigScore;
        }
        const valueA = parseFloat(String(a.programValue).replace(/[^0-9.]/g, '')) || 0;
        const valueB = parseFloat(String(b.programValue).replace(/[^0-9.]/g, '')) || 0;
        return valueB - valueA;
      })
      .slice(0, 5)
      .map(sme => {
        const value = parseFloat(String(sme.programValue).replace(/[^0-9.]/g, '')) || 0;
        
        return {
          smeName: sme.smeName,
          score: sme.engagementScore || 0,
          progress: calculateSupportProgress(sme),
          programValue: formatCurrency(value),
          reason: getSupportPerformanceReason(sme)
        };
      });

    // 2. At-Risk / Watchlist SMEs in Support Programs
    const atRiskSMEs = smeData
      .filter(sme => {
        // Identify at-risk SMEs based on support program criteria
        return (
          sme.hasMissedMilestones ||
          sme.missedMilestones > 1 ||
          sme.isStagnant ||
          sme.hasLowEngagement ||
          sme.performanceFlags.length > 0 ||
          sme.bigScore < 50 ||
          (sme.status === "Under Review" && sme.daysSinceUpdate > 60) ||
          (sme.status === "Due Diligence" && sme.daysSinceUpdate > 90) ||
          (sme.programMilestones?.length > 0 && 
           sme.programMilestones.filter(m => m.status !== 'completed').length > 2)
        );
      })
      .slice(0, 5)
      .map(sme => ({
        smeName: sme.smeName,
        riskFlag: getSupportRiskFlag(sme),
        action: getSupportRecommendedAction(sme),
        performanceFlags: sme.performanceFlags
      }));

    // 3. Support Program Trend Alerts
    const trendAlerts = calculateSupportTrendAlerts(smeData);

    // 4. Aggregate performance flags across portfolio
    const allPerformanceFlags = smeData.flatMap(sme => 
      sme.performanceFlags.map(flag => ({
        ...flag,
        smeName: sme.smeName,
        severity: flag.severity || flag.status || "medium"
      }))
    );

    return {
      topPerformers,
      atRiskSMEs,
      trendAlerts,
      performanceFlags: allPerformanceFlags
    };
  };

  const calculateSupportProgress = (sme) => {
    // Calculate progress based on program milestones and status
    let progress = 0;
    
    if (sme.programMilestones && sme.programMilestones.length > 0) {
      const completedMilestones = sme.programMilestones.filter(m => m.status === 'completed').length;
      progress = Math.round((completedMilestones / sme.programMilestones.length) * 100);
    } else {
      // Fallback based on status
      const statusWeights = {
        'evaluation': 20,
        'under review': 40,
        'due diligence': 60,
        'decision': 75,
        'support approved': 90,
        'active support': 95,
        'deal closed': 100,
        'completed': 100
      };
      
      progress = statusWeights[sme.status?.toLowerCase()] || 
                statusWeights[sme.pipelineStage?.toLowerCase()] || 0;
    }
    
    // Adjust based on engagement
    progress = Math.min(progress + Math.floor(sme.engagementScore / 10), 100);
    
    return Math.max(progress, 5); // Minimum 5% progress
  };

  const getSupportPerformanceReason = (sme) => {
    if (sme.engagementScore >= 80) return "Excellent engagement";
    if (sme.engagementScore >= 60) return "Strong participation";
    if (sme.bigScore >= 80) return "High fundability potential";
    if (sme.status === "Active Support") return "Actively progressing";
    if (sme.status === "Support Approved") return "Program approved";
    if (sme.programMilestones?.every(m => m.status === 'completed')) return "All milestones achieved";
    return "Good program candidate";
  };

  const getSupportRiskFlag = (sme) => {
    // Check for performance flags first
    if (sme.performanceFlags && sme.performanceFlags.length > 0) {
      const criticalFlags = sme.performanceFlags.filter(flag => 
        flag.severity === "critical" || flag.status === "Critical"
      );
      const warningFlags = sme.performanceFlags.filter(flag => 
        flag.severity === "warning" || flag.status === "Warning"
      );
      
      if (criticalFlags.length > 0) {
        return `${criticalFlags.length} critical performance issue${criticalFlags.length > 1 ? 's' : ''}`;
      }
      if (warningFlags.length > 0) {
        return `${warningFlags.length} performance warning${warningFlags.length > 1 ? 's' : ''}`;
      }
      return `${sme.performanceFlags.length} performance flag${sme.performanceFlags.length > 1 ? 's' : ''}`;
    }
    
    // Other risk indicators
    if (sme.missedMilestones >= 2) return `${sme.missedMilestones} missed milestones`;
    if (sme.isStagnant) return "Program stagnation (>3mo)";
    if (sme.hasLowEngagement) return "Low engagement score";
    if (sme.bigScore < 40) return "Low fundability score";
    if (sme.daysSinceUpdate > 60) return "No recent updates";
    return "Requires attention";
  };

  const getSupportRecommendedAction = (sme) => {
    // Prioritize actions based on performance flags
    if (sme.performanceFlags && sme.performanceFlags.length > 0) {
      const criticalFlags = sme.performanceFlags.filter(flag => 
        flag.severity === "critical" || flag.status === "Critical"
      );
      if (criticalFlags.length > 0) return "Immediate intervention required";
      
      const warningFlags = sme.performanceFlags.filter(flag => 
        flag.severity === "warning" || flag.status === "Warning"
      );
      if (warningFlags.length > 0) return "Review performance issues urgently";
      
      return "Monitor performance metrics";
    }
    
    // Other action recommendations
    if (sme.missedMilestones >= 2) return "Follow up on milestones";
    if (sme.isStagnant) return "Review program progress";
    if (sme.hasLowEngagement) return "Increase engagement";
    if (sme.bigScore < 40) return "Assess fundability support";
    if (sme.daysSinceUpdate > 60) return "Request program update";
    return "Schedule program review";
  };

  const calculateSupportTrendAlerts = (smeData) => {
    const totalPrograms = smeData.length;
    if (totalPrograms === 0) {
      return [
        {
          title: "Support Portfolio",
          value: "No Data",
          description: "Start building your support portfolio",
          isPositive: true
        }
      ];
    }

    // Calculate various support program metrics
    const declined = smeData.filter(sme => sme.isDeclined).length;
    const declineRate = totalPrograms > 0 ? ((declined / totalPrograms) * 100).toFixed(1) : 0;

    const completed = smeData.filter(sme => sme.isCompleted).length;
    const completionRate = totalPrograms > 0 ? ((completed / totalPrograms) * 100).toFixed(1) : 0;

    const avgEngagement = (smeData.reduce((sum, sme) => sum + (sme.engagementScore || 0), 0) / totalPrograms).toFixed(1);
    const highEngagement = smeData.filter(sme => sme.engagementScore >= 60).length;
    const engagementRate = totalPrograms > 0 ? ((highEngagement / totalPrograms) * 100).toFixed(1) : 0;

    const avgBigScore = (smeData.reduce((sum, sme) => sum + (sme.bigScore || 0), 0) / totalPrograms).toFixed(1);
    const highScorers = smeData.filter(sme => sme.bigScore >= 70).length;
    const scoreImprovement = totalPrograms > 0 ? ((highScorers / totalPrograms) * 100).toFixed(1) : 0;

    // Performance flags metrics
    const smesWithFlags = smeData.filter(sme => sme.performanceFlags && sme.performanceFlags.length > 0).length;
    const flagsRate = totalPrograms > 0 ? ((smesWithFlags / totalPrograms) * 100).toFixed(1) : 0;

    // Milestone completion metrics
    const totalMilestones = smeData.reduce((sum, sme) => sum + (sme.programMilestones?.length || 0), 0);
    const completedMilestones = smeData.reduce((sum, sme) => {
      if (sme.programMilestones) {
        return sum + sme.programMilestones.filter(m => m.status === 'completed').length;
      }
      return sum;
    }, 0);
    const milestoneCompletionRate = totalMilestones > 0 ? ((completedMilestones / totalMilestones) * 100).toFixed(1) : 0;

    return [
      {
        title: "Completion Rate",
        value: `${completionRate}%`,
        description: `${completed} programs successfully completed`,
        isPositive: parseFloat(completionRate) >= 20
      },
      {
        title: "Avg Engagement",
        value: avgEngagement,
        description: `${engagementRate}% of portfolio highly engaged`,
        isPositive: parseFloat(avgEngagement) >= 50
      },
      {
        title: "Performance Flags",
        value: `${flagsRate}%`,
        description: `${smesWithFlags} programs with performance flags`,
        isPositive: parseFloat(flagsRate) < 10
      },
      {
        title: "Milestone Completion",
        value: `${milestoneCompletionRate}%`,
        description: `${completedMilestones} of ${totalMilestones} milestones completed`,
        isPositive: parseFloat(milestoneCompletionRate) >= 80
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
          <p className="loading-text">Loading support program insights...</p>
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
        {/* Top 5 High Performers in Support Programs */}
        <div className="chart-container full-width">
          <div className="chart-header">
            <h3 className="chart-title">Top 5 High-Performers in Your Support Programs</h3>
            <button 
              className="breakdown-icon-btn"
              onClick={() => openPopup(
                <div className="popup-content">
                  <h3>Top 5 High-Performers</h3>
                  <div className="popup-description">
                    SMEs in your support programs showing exceptional engagement and strong progress
                  </div>
                  {insightsData.topPerformers.length > 0 ? (
                    <div className="table-container-popup">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>SME</th>
                            <th>Engagement Score</th>
                            <th>Progress</th>
                            <th>Program Value</th>
                            <th>Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {insightsData.topPerformers.map((performer, idx) => (
                            <tr key={idx}>
                              <td>{performer.smeName}</td>
                              <td>{performer.score}</td>
                              <td>{performer.progress}%</td>
                              <td>{performer.programValue}</td>
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
                        No high-performing SMEs in your support programs yet
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
                    <th>Engagement Score</th>
                    <th>Progress</th>
                    <th>Program Value</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {insightsData.topPerformers.map((performer, idx) => (
                    <tr key={idx}>
                      <td>{performer.smeName}</td>
                      <td>{performer.score}</td>
                      <td style={{ color: '#4CAF50', fontWeight: '600' }}>{performer.progress}%</td>
                      <td>{performer.programValue}</td>
                      <td>{performer.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-text">
                  No high-performing SMEs in your support programs yet.<br/>
                  As you engage with more SMEs in support programs, top performers will appear here.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* At-Risk / Watchlist SMEs in Support Programs */}
        <div className="chart-container full-width">
          <div className="chart-header">
            <h3 className="chart-title">At-Risk / Watchlist SMEs in Support Programs</h3>
            <button 
              className="breakdown-icon-btn"
              onClick={() => openPopup(
                <div className="popup-content">
                  <h3>At-Risk / Watchlist SMEs</h3>
                  <div className="popup-description">
                    SMEs in your support programs requiring attention due to performance, engagement, or progress concerns
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
                          No at-risk SMEs detected in your support programs.<br/>
                          All support programs are progressing within acceptable parameters.
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
                    No at-risk SMEs detected in your support programs.<br/>
                    All support programs are progressing within acceptable parameters.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Support Program Trend Alerts */}
        <div className="chart-container full-width">
          <div className="chart-header">
            <h3 className="chart-title">Support Program Performance Alerts</h3>
            <button 
              className="breakdown-icon-btn"
              onClick={() => openPopup(
                <div className="popup-content">
                  <h3>Support Program Performance Metrics</h3>
                  <div className="popup-description">
                    Key performance indicators and trends across your support program portfolio
                  </div>
                  <div className="trend-alerts-grid-popup">
                    {insightsData.trendAlerts.map((alert, idx) => (
                      <TrendAlertCard
                        key={idx}
                        title={alert.title}
                        value={alert.value}
                        description={alert.description}
                        isPositive={alert.isPositive}
                      />
                    ))}
                  </div>
                </div>
              )}
              title="View details"
            >
              <FiEye />
            </button>
          </div>
          <div className="trend-alerts-grid">
            {insightsData.trendAlerts.map((alert, idx) => (
              <TrendAlertCard
                key={idx}
                title={alert.title}
                value={alert.value}
                description={alert.description}
                isPositive={alert.isPositive}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsAIRecommendations;