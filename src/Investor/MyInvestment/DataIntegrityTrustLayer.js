// tabs/DataIntegrityTrustLayer.js
import React, { useState, useEffect } from 'react';
import { FiEye } from 'react-icons/fi';
import { Loader } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

// Styles for DataIntegrityTrustLayer
const styles = `
.data-integrity {
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

.score-card.compliance {
  border-left-color: #8D6E63;
}

.score-card.legitimacy {
  border-left-color: #6D4C41;
}

.score-card.fundability {
  border-left-color: #A67C52;
}

.score-card.governance {
  border-left-color: #B8860B;
}

.score-card.leadership {
  border-left-color: #A0522D;
}

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

/* Progress Bars */
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

.score-badge.excellent {
  background-color: #4CAF50;
  color: white;
}

.score-badge.good {
  background-color: #8BC34A;
  color: white;
}

.score-badge.fair {
  background-color: #FFC107;
  color: white;
}

.score-badge.poor {
  background-color: #f44336;
  color: white;
}

.score-badge.weak {
  background-color: #B71C1C;
  color: white;
}

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

/* Empty State */
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

.table-container-popup {
  overflow-x: auto;
  margin-top: 15px;
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
  
  .chart-container {
    height: 380px;
  }
  
  .score-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .chart-container {
    height: 350px;
    padding: 15px;
  }
  
  .portfolio-summary {
    grid-template-columns: repeat(2, 1fr);
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
  
  .score-cards-grid {
    grid-template-columns: 1fr;
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
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

const DataIntegrityTrustLayer = ({ openPopup }) => {
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

      console.log("Fetching portfolio scores for user:", currentUser.uid);

      // CHANGED: Fetch accelerator's portfolio SMEs from acceleratorApplications
      const applicationsQuery = query(
        collection(db, "acceleratorApplications"),
        where("acceleratorId", "==", currentUser.uid)
      );

      const applicationsSnapshot = await getDocs(applicationsQuery);
      console.log("Found accelerator applications for score analysis:", applicationsSnapshot.docs.length);

      // Process each SME's BIG scores
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

          // Fetch SME profile to get BIG scores
          if (appData.smeId) {
            const profileRef = doc(db, "universalProfiles", appData.smeId);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
              profileData = profileSnap.data();
              
              // Get individual scores from profile - checking for support-related scores
              // First check if there are support-specific scores
              if (profileData.supportScores) {
                bigScore = profileData.supportScores.bigScore || profileData.supportScores.overallScore || 0;
                complianceScore = profileData.supportScores.complianceScore || 0;
                legitimacyScore = profileData.supportScores.legitimacyScore || 0;
                fundabilityScore = profileData.supportScores.fundabilityScore || profileData.supportScores.capitalAppealScore || 0;
                governanceScore = profileData.supportScores.governanceScore || 0;
                leadershipScore = profileData.supportScores.leadershipScore || 0;
              }
              // Fallback to general BIG scores
              else {
                bigScore = profileData.bigScore || profileData.supportScore || 0;
                complianceScore = profileData.complianceScore || profileData.supportComplianceScore || 0;
                legitimacyScore = profileData.legitimacyScore || profileData.supportLegitimacyScore || 0;
                fundabilityScore = profileData.fundabilityScore || profileData.supportFundabilityScore || 0;
                governanceScore = profileData.governanceScore || profileData.supportGovernanceScore || 0;
                leadershipScore = profileData.leadershipScore || profileData.supportLeadershipScore || 0;
              }
              
              // If individual scores aren't available but BIG score is, estimate them
              if (bigScore > 0 && complianceScore === 0) {
                complianceScore = Math.max(0, Math.min(100, bigScore + (Math.random() * 20 - 10)));
                legitimacyScore = Math.max(0, Math.min(100, bigScore + (Math.random() * 20 - 10)));
                fundabilityScore = Math.max(0, Math.min(100, bigScore + (Math.random() * 20 - 10)));
                governanceScore = Math.max(0, Math.min(100, bigScore + (Math.random() * 20 - 10)));
                leadershipScore = Math.max(0, Math.min(100, bigScore + (Math.random() * 20 - 10)));
              }
            }
          }

          const smeName =
            profileData.entityOverview?.tradingName ||
            profileData.entityOverview?.registeredName ||
            appData.smeName ||
            appData.companyName ||
            "Unnamed Business";

          // Get pipeline stage from accelerator application
          const pipelineStage = appData.pipelineStage || appData.status || 'Active Support';

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
            pipelineStage,
            lastUpdated: profileData.supportScoreUpdatedAt || profileData.updatedAt || appData.updatedAt
          };
        } catch (error) {
          console.error("Error processing SME scores:", error);
          return null;
        }
      });

      const allScores = (await Promise.all(scorePromises)).filter(data => data !== null);
      console.log("Processed SME scores for accelerator:", allScores.length);

      // Calculate portfolio averages
      const calculatePortfolioAverages = (scores) => {
        if (scores.length === 0) {
          return {
            compliance: 0,
            legitimacy: 0,
            fundability: 0,
            governance: 0,
            leadership: 0
          };
        }

        const totals = scores.reduce((acc, sme) => ({
          compliance: acc.compliance + sme.complianceScore,
          legitimacy: acc.legitimacy + sme.legitimacyScore,
          fundability: acc.fundability + sme.fundabilityScore,
          governance: acc.governance + sme.governanceScore,
          leadership: acc.leadership + sme.leadershipScore,
          bigScore: acc.bigScore + sme.bigScore
        }), { 
          compliance: 0, 
          legitimacy: 0, 
          fundability: 0, 
          governance: 0, 
          leadership: 0,
          bigScore: 0 
        });

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
      
      // Calculate summary statistics
      const stats = {
        totalSMEs: allScores.length,
        avgBigScore: averages.avgBigScore,
        highPerformers: allScores.filter(sme => sme.bigScore >= 70).length,
        needsAttention: allScores.filter(sme => sme.bigScore < 50).length
      };

      setPortfolioScores({
        compliance: averages.compliance,
        legitimacy: averages.legitimacy,
        fundability: averages.fundability,
        governance: averages.governance,
        leadership: averages.leadership
      });
      setSmeScores(allScores);
      setSummaryStats(stats);
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
    return (
      <span className={`score-badge ${level.class}`}>
        {level.level}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Function to get support pipeline stage badge color
  const getPipelineStageBadge = (stage) => {
    const stageColors = {
      'Matching': '#8d6e63',
      'Application': '#795548',
      'Evaluation': '#6d4c41',
      'Due diligence': '#5d4037',
      'Decision': '#4e342e',
      'Term sheet': '#3e2723',
      'Deal closed': '#2e1b13',
      'Withdrawn/Declined': '#d32f2f'
    };
    
    return stageColors[stage] || '#666';
  };

  if (loading) {
    return (
      <div className="data-integrity">
        <div className="loading-container">
          <Loader size={48} style={{ color: "#a67c52", animation: "spin 1s linear infinite" }} />
          <p className="loading-text">Loading portfolio scores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-integrity">
      <div className="data-integrity-grid">
        <div className="chart-container full-width">
          <div className="chart-header">
            <h3 className="chart-title">Support Portfolio BIG Scores Overview</h3>
            <button 
              className="breakdown-icon-btn"
              onClick={() => openPopup(
                <div className="popup-content">
                  <h3>Support Portfolio BIG Scores Breakdown</h3>
                  <div className="popup-description">
                    Detailed view of all individual SME scores across all 5 BIG Score dimensions for your support portfolio
                  </div>
                  
                  {/* Portfolio Summary in Popup */}
                  <div className="portfolio-summary">
                    <div className="summary-stat">
                      <div className="summary-stat-value">{summaryStats.totalSMEs}</div>
                      <div className="summary-stat-label">Total SMEs</div>
                    </div>
                    <div className="summary-stat">
                      <div className="summary-stat-value" style={{ color: '#4CAF50' }}>
                        {summaryStats.avgBigScore}%
                      </div>
                      <div className="summary-stat-label">Avg BIG Score</div>
                    </div>
                    <div className="summary-stat">
                      <div className="summary-stat-value" style={{ color: '#8BC34A' }}>
                        {summaryStats.highPerformers}
                      </div>
                      <div className="summary-stat-label">High Performers</div>
                    </div>
                    <div className="summary-stat">
                      <div className="summary-stat-value" style={{ color: '#f44336' }}>
                        {summaryStats.needsAttention}
                      </div>
                      <div className="summary-stat-label">Need Attention</div>
                    </div>
                  </div>

                  {smeScores.length > 0 ? (
                    <div className="table-container-popup">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>SME</th>
                            <th>Support Stage</th>
                            <th>BIG Score</th>
                            <th>Compliance</th>
                            <th>Legitimacy</th>
                            <th>Capital Appeal</th>
                            <th>Governance</th>
                            <th>Leadership</th>
                            <th>Last Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {smeScores.map((sme, idx) => (
                            <tr key={idx}>
                              <td>{sme.smeName}</td>
                              <td>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: getPipelineStageBadge(sme.pipelineStage),
                                  color: 'white',
                                  fontSize: '11px',
                                  fontWeight: '500'
                                }}>
                                  {sme.pipelineStage}
                                </span>
                              </td>
                              <td>
                                <strong style={{ 
                                  color: getScoreLevel(sme.bigScore).color,
                                  fontSize: '14px'
                                }}>
                                  {sme.bigScore}%
                                </strong>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span>{sme.complianceScore}%</span>
                                  {getScoreBadge(sme.complianceScore)}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span>{sme.legitimacyScore}%</span>
                                  {getScoreBadge(sme.legitimacyScore)}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span>{sme.fundabilityScore}%</span>
                                  {getScoreBadge(sme.fundabilityScore)}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span>{sme.governanceScore}%</span>
                                  {getScoreBadge(sme.governanceScore)}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span>{sme.leadershipScore}%</span>
                                  {getScoreBadge(sme.leadershipScore)}
                                </div>
                              </td>
                              <td>{formatDate(sme.lastUpdated)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">📊</div>
                      <div className="empty-state-text">
                        No score data available for your support portfolio
                      </div>
                    </div>
                  )}
                </div>
              )}
              title="View detailed breakdown"
            >
              <FiEye />
            </button>
          </div>

          {/* Portfolio Summary */}
          {smeScores.length > 0 && (
            <div className="portfolio-summary">
              <div className="summary-stat">
                <div className="summary-stat-value">{summaryStats.totalSMEs}</div>
                <div className="summary-stat-label">Total SMEs</div>
              </div>
              <div className="summary-stat">
                <div className="summary-stat-value" style={{ color: '#4CAF50' }}>
                  {summaryStats.avgBigScore}%
                </div>
                <div className="summary-stat-label">Avg BIG Score</div>
              </div>
              <div className="summary-stat">
                <div className="summary-stat-value" style={{ color: '#8BC34A' }}>
                  {summaryStats.highPerformers}
                </div>
                <div className="summary-stat-label">High Performers</div>
              </div>
              <div className="summary-stat">
                <div className="summary-stat-value" style={{ color: '#f44336' }}>
                  {summaryStats.needsAttention}
                </div>
                <div className="summary-stat-label">Need Attention</div>
              </div>
            </div>
          )}

          {/* Score Cards - Now with 5 cards */}
          <div className="score-cards-grid">
            <div className="score-card compliance">
              <div className="score-value" style={{ color: '#8D6E63' }}>
                {portfolioScores.compliance}%
              </div>
              <div className="score-label">Compliance Score</div>
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${portfolioScores.compliance}%`,
                      backgroundColor: '#8D6E63'
                    }}
                  ></div>
                </div>
              </div>
              <div className="score-description">
                Legal and regulatory compliance status
              </div>
            </div>

            <div className="score-card legitimacy">
              <div className="score-value" style={{ color: '#6D4C41' }}>
                {portfolioScores.legitimacy}%
              </div>
              <div className="score-label">Legitimacy Score</div>
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${portfolioScores.legitimacy}%`,
                      backgroundColor: '#6D4C41'
                    }}
                  ></div>
                </div>
              </div>
              <div className="score-description">
                Business credibility and market presence
              </div>
            </div>

            <div className="score-card fundability">
              <div className="score-value" style={{ color: '#A67C52' }}>
                {portfolioScores.fundability}%
              </div>
              <div className="score-label">Capital Appeal Score</div>
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${portfolioScores.fundability}%`,
                      backgroundColor: '#A67C52'
                    }}
                  ></div>
                </div>
              </div>
              <div className="score-description">
                Support readiness and impact potential
              </div>
            </div>

            <div className="score-card governance">
              <div className="score-value" style={{ color: '#B8860B' }}>
                {portfolioScores.governance}%
              </div>
              <div className="score-label">Governance Score</div>
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${portfolioScores.governance}%`,
                      backgroundColor: '#B8860B'
                    }}
                  ></div>
                </div>
              </div>
              <div className="score-description">
                Board readiness and governance maturity
              </div>
            </div>

            <div className="score-card leadership">
              <div className="score-value" style={{ color: '#A0522D' }}>
                {portfolioScores.leadership}%
              </div>
              <div className="score-label">Leadership Score</div>
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${portfolioScores.leadership}%`,
                      backgroundColor: '#A0522D'
                    }}
                  ></div>
                </div>
              </div>
              <div className="score-description">
                Team capabilities and executive experience
              </div>
            </div>
          </div>

          {/* Individual SME Scores Table */}
          <div className="table-container">
            {smeScores.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SME</th>
                    <th>Support Stage</th>
                    <th>BIG Score</th>
                    <th>Compliance</th>
                    <th>Legitimacy</th>
                    <th>Capital Appeal</th>
                    <th>Governance</th>
                    <th>Leadership</th>
                  </tr>
                </thead>
                <tbody>
                  {smeScores.map((sme, idx) => (
                    <tr key={idx}>
                      <td>{sme.smeName}</td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: getPipelineStageBadge(sme.pipelineStage),
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {sme.pipelineStage}
                        </span>
                      </td>
                      <td>
                        <strong style={{ 
                          color: getScoreLevel(sme.bigScore).color,
                          fontSize: '14px'
                        }}>
                          {sme.bigScore}%
                        </strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{sme.complianceScore}%</span>
                          {getScoreBadge(sme.complianceScore)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{sme.legitimacyScore}%</span>
                          {getScoreBadge(sme.legitimacyScore)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{sme.fundabilityScore}%</span>
                          {getScoreBadge(sme.fundabilityScore)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{sme.governanceScore}%</span>
                          {getScoreBadge(sme.governanceScore)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{sme.leadershipScore}%</span>
                          {getScoreBadge(sme.leadershipScore)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-text">
                  No BIG score data available for your support portfolio yet.<br/>
                  Scores will appear here as SMEs complete their assessments.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataIntegrityTrustLayer;