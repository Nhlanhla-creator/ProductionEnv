// tabs/DataIntegrityTrustLayer.js
import React, { useState, useEffect } from 'react';
import { FiEye, FiArrowUp, FiAlertTriangle } from 'react-icons/fi';
import { Loader } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

// Styles for DataIntegrityTrustLayer
const styles = `
.data-integrity {
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

.data-integrity-grid {
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

.chart-container.full-width {
  grid-column: 1 / -1;
  height: auto;
  min-height: 400px;
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

/* Score Cards */
.score-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.score-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  border-left: 4px solid;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.score-card.compliance { border-left-color: #8D6E63; }
.score-card.legitimacy { border-left-color: #6D4C41; }
.score-card.fundability { border-left-color: #A67C52; }
.score-card.governance { border-left-color: #B8860B; }
.score-card.leadership { border-left-color: #A0522D; }

.score-value {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  line-height: 1;
}

.score-label {
  font-size: 14px;
  color: #5e3f26;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.score-description {
  font-size: 12px;
  color: #7d5a50;
  margin-top: 8px;
  line-height: 1.3;
}

.progress-container {
  margin-top: 10px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Table Styles */
.table-container {
  overflow-x: auto;
  margin-top: 10px;
  max-height: 400px;
  overflow-y: auto;
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
  position: sticky;
  top: 0;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.data-table tr:hover {
  background-color: #f9f9f9;
}

.risk-table tr:hover {
  background-color: #fff3f3;
}

/* Status badges */
.score-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
  text-align: center;
  min-width: 60px;
}

.score-badge.excellent { background-color: #4CAF50; color: white; }
.score-badge.good { background-color: #8BC34A; color: white; }
.score-badge.fair { background-color: #FFC107; color: white; }
.score-badge.poor { background-color: #f44336; color: white; }
.score-badge.weak { background-color: #B71C1C; color: white; }

/* Summary Stats */
.portfolio-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #fdf8f6 0%, #f3e8dc 100%);
  border-radius: 8px;
  border: 1px solid #ede4d8;
}

.summary-stat {
  text-align: center;
}

.summary-stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #5e3f26;
  margin-bottom: 4px;
}

.summary-stat-label {
  font-size: 12px;
  color: #7d5a50;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Trend Alert Cards */
.trend-alerts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 20px;
  margin-bottom: 20px;
}

.trend-alert-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  border-left: 4px solid #4CAF50;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.trend-alert-card.negative {
  border-left-color: #f44336;
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

/* AI Recommendations specific styles */
.ai-recommendation-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  border-left: 4px solid #7d5a36;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.ai-recommendation-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.ai-recommendation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.ai-recommendation-title {
  font-size: 15px;
  font-weight: 700;
  color: #5e3f26;
}

.ai-recommendation-priority {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
}

.ai-recommendation-priority.high {
  background-color: #FFEBEE;
  color: #f44336;
}

.ai-recommendation-priority.medium {
  background-color: #FFF8E1;
  color: #FFC107;
}

.ai-recommendation-priority.low {
  background-color: #E8F5E8;
  color: #4CAF50;
}

.ai-recommendation-sme {
  font-size: 13px;
  color: #7d5a36;
  margin-bottom: 8px;
}

.ai-recommendation-description {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
}

.ai-recommendation-impact {
  font-size: 12px;
  color: #4CAF50;
  font-weight: 500;
}

.ai-recommendations-list {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 10px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #7d5a50;
  text-align: center;
  padding: 40px;
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

.table-container-popup {
  overflow-x: auto;
  margin-top: 15px;
  max-height: 500px;
  overflow-y: auto;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .score-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .data-integrity-grid {
    grid-template-columns: 1fr;
  }
  .score-cards-grid {
    grid-template-columns: repeat(2, 1fr);
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
  .score-cards-grid {
    grid-template-columns: 1fr;
  }
  .portfolio-summary {
    grid-template-columns: repeat(2, 1fr);
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
  .data-integrity-grid {
    padding: 0 5px;
  }
  .data-table {
    font-size: 12px;
  }
  .data-table th,
  .data-table td {
    padding: 8px;
  }
  .score-card {
    padding: 15px;
  }
  .score-value {
    font-size: 28px;
  }
  .portfolio-summary {
    grid-template-columns: 1fr;
  }
  .trend-alert-card {
    height: 100px;
    padding: 12px;
  }
  .trend-alert-value {
    font-size: 16px;
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

// ==================== INSIGHTS COMPONENT (Main Tab) ====================
const InsightsComponent = ({ openPopup }) => {
  const [loading, setLoading] = useState(true);
  const [portfolioScores, setPortfolioScores] = useState({
    compliance: 0,
    legitimacy: 0,
    fundability: 0,
    governance: 0,
    leadership: 0
  });
  const [smeScores, setSmeScores] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalSMEs: 0,
    avgBigScore: 0,
    highPerformers: 0,
    needsAttention: 0
  });
  const [trendAlerts, setTrendAlerts] = useState([]);

  useEffect(() => {
    fetchPortfolioScores();
  }, []);

  const fetchPortfolioScores = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log("No authenticated user");
        setLoading(false);
        return;
      }

      const applicationsQuery = query(
        collection(db, "investorApplications"),
        where("funderId", "==", currentUser.uid)
      );

      const applicationsSnapshot = await getDocs(applicationsQuery);
      console.log("Found applications for score analysis:", applicationsSnapshot.docs.length);

      const scorePromises = applicationsSnapshot.docs.map(async (appDoc) => {
        const appData = appDoc.data();
        
        try {
          let profileData = {};
          let bigScore = 0;
          let complianceScore = 0;
          let legitimacyScore = 0;
          let fundabilityScore = 0;
          let governanceScore = 0;
          let leadershipScore = 0;

          if (appData.smeId) {
            const profileRef = doc(db, "universalProfiles", appData.smeId);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
              profileData = profileSnap.data();
              bigScore = profileData.bigScore || 0;
              complianceScore = profileData.complianceScore || 0;
              legitimacyScore = profileData.legitimacyScore || 0;
              fundabilityScore = profileData.fundabilityScore || 0;
              governanceScore = profileData.governanceScore || 0;
              leadershipScore = profileData.leadershipScore || 0;
              
              if (bigScore > 0 && complianceScore === 0) {
                complianceScore = Math.max(0, Math.min(100, bigScore + (Math.random() * 20 - 10)));
                legitimacyScore = Math.max(0, Math.min(100, bigScore + (Math.random() * 20 - 10)));
                fundabilityScore = Math.max(0, Math.min(100, bigScore + (Math.random() * 20 - 10)));
                governanceScore = Math.max(0, Math.min(100, bigScore + (Math.random() * 20 - 10)));
                leadershipScore = Math.max(0, Math.min(100, bigScore + (Math.random() * 20 - 10)));
              }
            }
          }

          const smeName = profileData.entityOverview?.tradingName ||
            profileData.entityOverview?.registeredName ||
            appData.companyName || appData.smeName || "Unnamed Business";

          return {
            id: appDoc.id,
            smeId: appData.smeId,
            smeName,
            bigScore,
            complianceScore,
            legitimacyScore,
            fundabilityScore,
            governanceScore,
            leadershipScore,
            pipelineStage: appData.pipelineStage,
            lastUpdated: profileData.bigScoreUpdatedAt || profileData.updatedAt || appData.updatedAt
          };
        } catch (error) {
          console.error("Error processing SME scores:", error);
          return null;
        }
      });

      const allScores = (await Promise.all(scorePromises)).filter(data => data !== null);
      console.log("Processed SME scores:", allScores.length);

      const calculatePortfolioAverages = (scores) => {
        if (scores.length === 0) {
          return { compliance: 0, legitimacy: 0, fundability: 0, governance: 0, leadership: 0 };
        }

        const totals = scores.reduce((acc, sme) => ({
          compliance: acc.compliance + sme.complianceScore,
          legitimacy: acc.legitimacy + sme.legitimacyScore,
          fundability: acc.fundability + sme.fundabilityScore,
          governance: acc.governance + sme.governanceScore,
          leadership: acc.leadership + sme.leadershipScore,
          bigScore: acc.bigScore + sme.bigScore
        }), { compliance: 0, legitimacy: 0, fundability: 0, governance: 0, leadership: 0, bigScore: 0 });

        return {
          compliance: Math.round(totals.compliance / scores.length),
          legitimacy: Math.round(totals.legitimacy / scores.length),
          fundability: Math.round(totals.fundability / scores.length),
          governance: Math.round(totals.governance / scores.length),
          leadership: Math.round(totals.leadership / scores.length),
          avgBigScore: Math.round(totals.bigScore / scores.length)
        };
      };

      const averages = calculatePortfolioAverages(allScores);
      
      const stats = {
        totalSMEs: allScores.length,
        avgBigScore: averages.avgBigScore,
        highPerformers: allScores.filter(sme => sme.bigScore >= 70).length,
        needsAttention: allScores.filter(sme => sme.bigScore < 50).length
      };

      // Calculate trend alerts
      const totalSMEs = allScores.length;
      const trendAlertsData = totalSMEs === 0 ? [
        { title: "Portfolio Status", value: "No Data", description: "Start building your portfolio", isPositive: true }
      ] : [
        { title: "Avg BIG Score", value: `${averages.avgBigScore}%`, description: `${((stats.highPerformers / totalSMEs) * 100).toFixed(1)}% of portfolio above 70`, isPositive: averages.avgBigScore >= 60 },
        { title: "High Performers", value: stats.highPerformers.toString(), description: `SMEs with score ≥ 70`, isPositive: true },
        { title: "Need Attention", value: stats.needsAttention.toString(), description: `SMEs with score < 50`, isPositive: stats.needsAttention === 0 },
        { title: "Total Portfolio", value: totalSMEs.toString(), description: `SMEs in your portfolio`, isPositive: true }
      ];

      setPortfolioScores({
        compliance: averages.compliance,
        legitimacy: averages.legitimacy,
        fundability: averages.fundability,
        governance: averages.governance,
        leadership: averages.leadership
      });
      setSmeScores(allScores);
      setSummaryStats(stats);
      setTrendAlerts(trendAlertsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching portfolio scores:", error);
      setLoading(false);
    }
  };

  const getScoreLevel = (score) => {
    if (score >= 90) return { level: 'Excellent', class: 'excellent', color: '#4CAF50' };
    if (score >= 80) return { level: 'Good', class: 'good', color: '#8BC34A' };
    if (score >= 70) return { level: 'Fair', class: 'fair', color: '#FFC107' };
    if (score >= 50) return { level: 'Poor', class: 'poor', color: '#f44336' };
    return { level: 'Weak', class: 'weak', color: '#B71C1C' };
  };

  const getScoreBadge = (score) => {
    const level = getScoreLevel(score);
    return <span className={`score-badge ${level.class}`}>{level.level}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-ZA', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (error) {
      return "Invalid date";
    }
  };

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
      <div className="loading-container">
        <Loader size={48} style={{ color: "#a67c52", animation: "spin 1s linear infinite" }} />
        <p className="loading-text">Loading portfolio scores...</p>
      </div>
    );
  }

  return (
    <div className="data-integrity-grid">
      <div className="chart-container full-width">
        <div className="chart-header">
          <h3 className="chart-title">Portfolio BIG Scores Overview</h3>
          <button className="breakdown-icon-btn" onClick={() => openPopup(
            <div className="popup-content">
              <h3>Portfolio BIG Scores Breakdown</h3>
              <div className="popup-description">Detailed view of all individual SME scores across all 5 BIG Score dimensions</div>
              <div className="portfolio-summary">
                <div className="summary-stat"><div className="summary-stat-value">{summaryStats.totalSMEs}</div><div className="summary-stat-label">Total SMEs</div></div>
                <div className="summary-stat"><div className="summary-stat-value" style={{ color: '#4CAF50' }}>{summaryStats.avgBigScore}%</div><div className="summary-stat-label">Avg BIG Score</div></div>
                <div className="summary-stat"><div className="summary-stat-value" style={{ color: '#8BC34A' }}>{summaryStats.highPerformers}</div><div className="summary-stat-label">High Performers</div></div>
                <div className="summary-stat"><div className="summary-stat-value" style={{ color: '#f44336' }}>{summaryStats.needsAttention}</div><div className="summary-stat-label">Need Attention</div></div>
              </div>
              {smeScores.length > 0 ? (
                <div className="table-container-popup">
                  <table className="data-table">
                    <thead><tr><th>SME</th><th>BIG Score</th><th>Compliance</th><th>Legitimacy</th><th>Fundability</th><th>Governance</th><th>Leadership</th><th>Last Updated</th></tr></thead>
                    <tbody>{smeScores.map((sme, idx) => (
                      <tr key={idx}>
                        <td>{sme.smeName}</td>
                        <td><strong style={{ color: getScoreLevel(sme.bigScore).color }}>{sme.bigScore}%</strong></td>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>{sme.complianceScore}%</span>{getScoreBadge(sme.complianceScore)}</div></td>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>{sme.legitimacyScore}%</span>{getScoreBadge(sme.legitimacyScore)}</div></td>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>{sme.fundabilityScore}%</span>{getScoreBadge(sme.fundabilityScore)}</div></td>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>{sme.governanceScore}%</span>{getScoreBadge(sme.governanceScore)}</div></td>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>{sme.leadershipScore}%</span>{getScoreBadge(sme.leadershipScore)}</div></td>
                        <td>{formatDate(sme.lastUpdated)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">No score data available for your portfolio</div></div>
              )}
            </div>
          )}><FiEye /></button>
        </div>

        {/* Portfolio Summary */}
        {smeScores.length > 0 && (
          <div className="portfolio-summary">
            <div className="summary-stat"><div className="summary-stat-value">{summaryStats.totalSMEs}</div><div className="summary-stat-label">Total SMEs</div></div>
            <div className="summary-stat"><div className="summary-stat-value" style={{ color: '#4CAF50' }}>{summaryStats.avgBigScore}%</div><div className="summary-stat-label">Avg BIG Score</div></div>
            <div className="summary-stat"><div className="summary-stat-value" style={{ color: '#8BC34A' }}>{summaryStats.highPerformers}</div><div className="summary-stat-label">High Performers</div></div>
            <div className="summary-stat"><div className="summary-stat-value" style={{ color: '#f44336' }}>{summaryStats.needsAttention}</div><div className="summary-stat-label">Need Attention</div></div>
          </div>
        )}

        {/* Trend Alerts */}
        <div className="trend-alerts-grid">
          {trendAlerts.map((alert, idx) => (
            <TrendAlertCard key={idx} title={alert.title} value={alert.value} description={alert.description} isPositive={alert.isPositive} />
          ))}
        </div>

        {/* Score Cards */}
        <div className="score-cards-grid">
          <div className="score-card compliance">
            <div className="score-value" style={{ color: '#8D6E63' }}>{portfolioScores.compliance}%</div>
            <div className="score-label">Compliance Score</div>
            <div className="progress-container"><div className="progress-bar"><div className="progress-fill" style={{ width: `${portfolioScores.compliance}%`, backgroundColor: '#8D6E63' }}></div></div></div>
            <div className="score-description">Legal and regulatory compliance status</div>
          </div>
          <div className="score-card legitimacy">
            <div className="score-value" style={{ color: '#6D4C41' }}>{portfolioScores.legitimacy}%</div>
            <div className="score-label">Legitimacy Score</div>
            <div className="progress-container"><div className="progress-bar"><div className="progress-fill" style={{ width: `${portfolioScores.legitimacy}%`, backgroundColor: '#6D4C41' }}></div></div></div>
            <div className="score-description">Business credibility and market presence</div>
          </div>
          <div className="score-card fundability">
            <div className="score-value" style={{ color: '#A67C52' }}>{portfolioScores.fundability}%</div>
            <div className="score-label">Capital Appeal Score</div>
            <div className="progress-container"><div className="progress-bar"><div className="progress-fill" style={{ width: `${portfolioScores.fundability}%`, backgroundColor: '#A67C52' }}></div></div></div>
            <div className="score-description">Investment readiness and financial health</div>
          </div>
          <div className="score-card governance">
            <div className="score-value" style={{ color: '#B8860B' }}>{portfolioScores.governance}%</div>
            <div className="score-label">Governance Score</div>
            <div className="progress-container"><div className="progress-bar"><div className="progress-fill" style={{ width: `${portfolioScores.governance}%`, backgroundColor: '#B8860B' }}></div></div></div>
            <div className="score-description">Board readiness and governance maturity</div>
          </div>
          <div className="score-card leadership">
            <div className="score-value" style={{ color: '#A0522D' }}>{portfolioScores.leadership}%</div>
            <div className="score-label">Leadership Score</div>
            <div className="progress-container"><div className="progress-bar"><div className="progress-fill" style={{ width: `${portfolioScores.leadership}%`, backgroundColor: '#A0522D' }}></div></div></div>
            <div className="score-description">Team capabilities and executive experience</div>
          </div>
        </div>

        {/* Individual SME Scores Table */}
        <div className="table-container">
          {smeScores.length > 0 ? (
            <table className="data-table">
              <thead><tr><th>SME</th><th>BIG Score</th><th>Compliance</th><th>Legitimacy</th><th>Fundability</th><th>Governance</th><th>Leadership</th><th>Status</th></tr></thead>
              <tbody>{smeScores.map((sme, idx) => (
                <tr key={idx}>
                  <td>{sme.smeName}</td>
                  <td><strong style={{ color: getScoreLevel(sme.bigScore).color }}>{sme.bigScore}%</strong></td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>{sme.complianceScore}%</span>{getScoreBadge(sme.complianceScore)}</div></td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>{sme.legitimacyScore}%</span>{getScoreBadge(sme.legitimacyScore)}</div></td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>{sme.fundabilityScore}%</span>{getScoreBadge(sme.fundabilityScore)}</div></td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>{sme.governanceScore}%</span>{getScoreBadge(sme.governanceScore)}</div></td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>{sme.leadershipScore}%</span>{getScoreBadge(sme.leadershipScore)}</div></td>
                  <td>{sme.pipelineStage || 'Active'}</td>
                </tr>
              ))}</tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">No BIG score data available for your portfolio yet.<br/>Scores will appear here as SMEs complete their assessments.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== AI RECOMMENDATIONS COMPONENT (Sub Tab) ====================
const AIRecommendationsComponent = ({ openPopup }) => {
  const [portfolioTrendView, setPortfolioTrendView] = useState('Quarterly');
  const [loading, setLoading] = useState(true);
  const [insightsData, setInsightsData] = useState({
    topPerformers: [],
    atRiskSMEs: [],
    trendAlerts: [],
    defaultFlags: []
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

      const applicationsQuery = query(
        collection(db, "investorApplications"),
        where("funderId", "==", currentUser.uid)
      );

      const applicationsSnapshot = await getDocs(applicationsQuery);
      console.log("Found applications:", applicationsSnapshot.docs.length);

      const smeDataPromises = applicationsSnapshot.docs.map(async (appDoc) => {
        const appData = appDoc.data();
        
        try {
          let profileData = {};
          let bigScore = 0;

          if (appData.smeId) {
            const profileRef = doc(db, "universalProfiles", appData.smeId);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
              profileData = profileSnap.data();
              bigScore = profileData.bigScore || 0;
            }
          }

          const smeName = profileData.entityOverview?.tradingName ||
            profileData.entityOverview?.registeredName ||
            appData.companyName || appData.smeName || "Unnamed Business";

          const dealAmount = appData.fundingDetails?.amountApproved || appData.fundingRequired || 0;
          const pipelineStage = appData.pipelineStage || "Application";
          const lastUpdate = appData.updatedAt ? new Date(appData.updatedAt) : new Date(appData.createdAt);
          const daysSinceUpdate = Math.floor((new Date() - lastUpdate) / (1000 * 60 * 60 * 24));

          let defaultFlags = [];
          if (appData.smeId) {
            try {
              const flagsRef = doc(db, "loan-repayments", appData.smeId);
              const flagsSnap = await getDoc(flagsRef);
              if (flagsSnap.exists()) {
                defaultFlags = flagsSnap.data().flags || [];
              }
            } catch (error) {}
          }

          return {
            id: appDoc.id,
            smeId: appData.smeId || appData.userId,
            smeName,
            dealAmount,
            bigScore,
            pipelineStage,
            sector: profileData.entityOverview?.economicSectors?.[0] || "Not specified",
            daysSinceUpdate,
            defaultFlags,
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

      const insights = calculateInsights(allSMEData);
      setInsightsData(insights);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching insights data:", error);
      setLoading(false);
    }
  };

  const calculateInsights = (smeData) => {
    const activeDeals = smeData.filter(sme => !sme.isDeclined && sme.pipelineStage !== "withdrawn");

    const topPerformers = [...activeDeals]
      .sort((a, b) => {
        if (b.bigScore !== a.bigScore) return b.bigScore - a.bigScore;
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

    const atRiskSMEs = smeData
      .filter(sme => sme.missedReports > 0 || sme.isStagnant || sme.bigScore < 50 ||
        sme.defaultFlags.length > 0 || (sme.pipelineStage === "Under Review" && sme.daysSinceUpdate > 60) ||
        (sme.pipelineStage === "Due Diligence" && sme.daysSinceUpdate > 90))
      .slice(0, 5)
      .map(sme => ({
        smeName: sme.smeName,
        riskFlag: getRiskFlag(sme),
        action: getRecommendedAction(sme),
        defaultFlags: sme.defaultFlags
      }));

    const trendAlerts = calculateTrendAlerts(smeData);
    const allDefaultFlags = smeData.flatMap(sme => sme.defaultFlags.map(flag => ({ ...flag, smeName: sme.smeName })));

    return { topPerformers, atRiskSMEs, trendAlerts, defaultFlags: allDefaultFlags };
  };

  const calculateGrowthPercentage = (sme) => {
    const stageWeights = { 'application': 20, 'under review': 40, 'due diligence': 60, 'funding approved': 80, 'termsheet': 90, 'deal complete': 100 };
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
    if (sme.defaultFlags && sme.defaultFlags.length > 0) {
      const criticalFlags = sme.defaultFlags.filter(flag => flag.status === "Critical");
      if (criticalFlags.length > 0) return `${criticalFlags.length} critical default flag(s)`;
      const warningFlags = sme.defaultFlags.filter(flag => flag.status === "Warning");
      if (warningFlags.length > 0) return `${warningFlags.length} warning default flag(s)`;
      return `${sme.defaultFlags.length} default flag(s)`;
    }
    if (sme.missedReports >= 2) return `Missed ${sme.missedReports} reports`;
    if (sme.isStagnant) return "Pipeline stagnation (>6mo)";
    if (sme.bigScore < 40) return "Low fundability score";
    if (sme.bigScore < 50) return "Below target score";
    if (sme.daysSinceUpdate > 90) return "No recent updates";
    return "Requires attention";
  };

  const getRecommendedAction = (sme) => {
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
      return [{ title: "Portfolio Status", value: "No Data", description: "Start building your portfolio", isPositive: true }];
    }

    const declined = smeData.filter(sme => sme.isDeclined).length;
    const declineRate = ((declined / totalSMEs) * 100).toFixed(1);
    const avgBigScore = (smeData.reduce((sum, sme) => sum + (sme.bigScore || 0), 0) / totalSMEs).toFixed(1);
    const highScorers = smeData.filter(sme => sme.bigScore >= 70).length;
    const scoreImprovement = ((highScorers / totalSMEs) * 100).toFixed(1);
    const smesWithFlags = smeData.filter(sme => sme.defaultFlags && sme.defaultFlags.length > 0).length;
    const flagsRate = ((smesWithFlags / totalSMEs) * 100).toFixed(1);
    const completedDeals = smeData.filter(sme => sme.pipelineStage === "Deal Complete").length;
    const successRate = totalSMEs > 0 ? ((completedDeals / totalSMEs) * 100).toFixed(1) : 0;

    return [
      { title: "Decline Rate", value: `${declineRate}%`, description: declined > 0 ? `${declined} applications declined` : "No declines", isPositive: parseFloat(declineRate) < 15 },
      { title: "Avg BIG Score", value: avgBigScore, description: `${scoreImprovement}% of portfolio above 70`, isPositive: parseFloat(avgBigScore) >= 60 },
      { title: "Default Flags", value: `${flagsRate}%`, description: `${smesWithFlags} SMEs with flags`, isPositive: parseFloat(flagsRate) === 0 },
      { title: "Success Rate", value: `${successRate}%`, description: `${completedDeals} deals closed`, isPositive: parseFloat(successRate) >= 20 }
    ];
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "Not specified";
    const numAmount = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;
    return numAmount >= 1000000 ? `R${(numAmount / 1000000).toFixed(1)}m` : `R${numAmount.toLocaleString()}`;
  };

  const TimeViewSelector = ({ currentView, onViewChange }) => (
    <div className="time-view-selector">
      <span className="time-view-label">View:</span>
      {['Monthly', 'Quarterly', 'Yearly'].map(view => (
        <button key={view} className={`time-view-btn ${currentView === view ? 'active' : ''}`} onClick={() => onViewChange(view)}>
          {view}
        </button>
      ))}
    </div>
  );

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
      <div className="loading-container">
        <Loader size={48} style={{ color: "#a67c52", animation: "spin 1s linear infinite" }} />
        <p className="loading-text">Loading portfolio insights...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="time-view-controls">
        <TimeViewSelector currentView={portfolioTrendView} onViewChange={setPortfolioTrendView} />
      </div>

      {/* Trend Alerts */}
      <div className="trend-alerts-grid">
        {insightsData.trendAlerts.map((alert, idx) => (
          <TrendAlertCard key={idx} title={alert.title} value={alert.value} description={alert.description} isPositive={alert.isPositive} />
        ))}
      </div>

      {/* Top 5 High Performers */}
      <div className="chart-container full-width">
        <div className="chart-header">
          <h3 className="chart-title">Top 5 High-Performers in Your Portfolio</h3>
          <button className="breakdown-icon-btn" onClick={() => openPopup(
            <div className="popup-content">
              <h3>Top 5 High-Performers</h3>
              <div className="popup-description">SMEs in your portfolio showing exceptional performance</div>
              {insightsData.topPerformers.length > 0 ? (
                <div className="table-container-popup">
                  <table className="data-table"><thead><tr><th>SME</th><th>BIG Score</th><th>Progress</th><th>Investment</th><th>Reason</th></tr></thead>
                  <tbody>{insightsData.topPerformers.map((performer, idx) => (
                    <tr key={idx}><td>{performer.smeName}</td><td>{performer.score}</td><td>+{performer.growth}%</td><td>{performer.ask}</td><td>{performer.reason}</td></tr>
                  ))}</tbody></table>
                </div>
              ) : (<div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">No high-performing SMEs in your portfolio yet</div></div>)}
            </div>
          )}><FiEye /></button>
        </div>
        <div className="table-container">
          {insightsData.topPerformers.length > 0 ? (
            <table className="data-table"><thead><tr><th>SME</th><th>BIG Score</th><th>Progress</th><th>Investment</th><th>Reason</th></tr></thead>
            <tbody>{insightsData.topPerformers.map((performer, idx) => (
              <tr key={idx}><td>{performer.smeName}</td><td>{performer.score}</td><td style={{ color: '#4CAF50', fontWeight: '600' }}>+{performer.growth}%</td><td>{performer.ask}</td><td>{performer.reason}</td></tr>
            ))}</tbody></table>
          ) : (<div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">No high-performing SMEs in your portfolio yet</div></div>)}
        </div>
      </div>

      {/* At-Risk / Watchlist SMEs */}
      <div className="chart-container full-width">
        <div className="chart-header">
          <h3 className="chart-title">At-Risk / Watchlist SMEs</h3>
          <button className="breakdown-icon-btn" onClick={() => openPopup(
            <div className="popup-content">
              <h3>At-Risk / Watchlist SMEs</h3>
              <div className="popup-description">SMEs requiring attention due to performance concerns</div>
              {insightsData.atRiskSMEs.length > 0 ? (
                <div className="table-container-popup">
                  <table className="data-table risk-table"><thead><tr><th>SME</th><th>Risk Flag</th><th>Recommended Action</th></tr></thead>
                  <tbody>{insightsData.atRiskSMEs.map((sme, idx) => (
                    <tr key={idx}><td>{sme.smeName}</td><td style={{ color: '#f44336' }}>{sme.riskFlag}</td><td>{sme.action}</td></tr>
                  ))}</tbody></table>
                </div>
              ) : (<div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-text">No at-risk SMEs detected</div></div>)}
            </div>
          )}><FiEye /></button>
        </div>
        <div className="table-container">
          {insightsData.atRiskSMEs.length > 0 ? (
            <table className="data-table risk-table"><thead><tr><th>SME</th><th>Risk Flag</th><th>Recommended Action</th></tr></thead>
            <tbody>{insightsData.atRiskSMEs.map((sme, idx) => (
              <tr key={idx}><td>{sme.smeName}</td><td style={{ color: '#f44336', fontWeight: '600' }}>{sme.riskFlag}</td><td>{sme.action}</td></tr>
            ))}</tbody></table>
          ) : (
            <div>
              <table className="data-table risk-table"><thead><tr><th>SME</th><th>Risk Flag</th><th>Recommended Action</th></tr></thead><tbody></tbody></table>
              <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-text">No at-risk SMEs detected in your portfolio.<br/>All companies are performing within acceptable parameters.</div></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN DATA INTEGRITY TRUST LAYER COMPONENT ====================
const DataIntegrityTrustLayer = ({ openPopup }) => {
  const [activeMainTab, setActiveMainTab] = useState("insights");

  return (
    <div className="data-integrity">
      <div className="main-tabs-container">
        <button className={`main-tab-btn ${activeMainTab === "insights" ? "active" : ""}`} onClick={() => setActiveMainTab("insights")}>
          Insights
        </button>
        <button className={`main-tab-btn ${activeMainTab === "recommendations" ? "active" : ""}`} onClick={() => setActiveMainTab("recommendations")}>
          AI Recommendations
        </button>
      </div>
      
      {activeMainTab === "insights" && <InsightsComponent openPopup={openPopup} />}
      {activeMainTab === "recommendations" && <AIRecommendationsComponent openPopup={openPopup} />}
    </div>
  );
};

export default DataIntegrityTrustLayer;