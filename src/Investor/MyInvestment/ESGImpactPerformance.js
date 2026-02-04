// tabs/ESGImpactPerformance.js
import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FiEye } from 'react-icons/fi';
import { Loader } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
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
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Styles for ESGImpactPerformance
const styles = `
.esg-impact {
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

.esg-charts-grid {
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

.table-container-popup {
  overflow-x: auto;
  margin-top: 15px;
}

/* Three Column Layout */
.three-column-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .three-column-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 992px) {
  .esg-charts-grid {
    grid-template-columns: 1fr;
  }
  
  .three-column-grid {
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
  
  .esg-charts-grid {
    padding: 0 5px;
  }
  
  .data-table {
    font-size: 12px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px;
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
    x: { grid: { display: false } },
    y: { 
      beginAtZero: true, 
      grid: { drawBorder: false },
      max: 100
    }
  }
};

const staticPieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { position: 'bottom' } }
};

const ESGImpactPerformance = ({ openPopup }) => {
  const [loading, setLoading] = useState(true);
  const [esgData, setEsgData] = useState({
    pillarScores: { environmental: 0, social: 0, governance: 0 },
    sdgAlignment: {},
    governanceCompliance: { compliant: 0, partial: 0, atRisk: 0 },
    topContributors: []
  });

  useEffect(() => {
    fetchESGData();
  }, []);

  const fetchESGData = async () => {
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
      console.log("Found applications for ESG analysis:", applicationsSnapshot.docs.length);

      // Process each SME's ESG/Impact data
      const esgPromises = applicationsSnapshot.docs.map(async (appDoc) => {
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

          // Extract ESG/Impact metrics from profile
          const impactMeasurement = profileData.impactMeasurement || {};
          const legalCompliance = profileData.legalCompliance || {};
          const entityOverview = profileData.entityOverview || {};
          const ownershipManagement = profileData.ownershipManagement || {};
          const complianceScore = profileData.complianceScore || 0;
          const governanceScore = profileData.governanceScore || 0;

          return {
            id: appDoc.id,
            smeId: appData.smeId,
            smeName,
            // Environmental metrics
            environmental: {
              carbonFootprint: impactMeasurement.carbonFootprint || 0,
              renewableEnergy: impactMeasurement.renewableEnergyUsage || 0,
              wasteReduction: impactMeasurement.wasteReduction || 0,
              score: calculateEnvironmentalScore(impactMeasurement)
            },
            // Social metrics
            social: {
              jobsCreated: impactMeasurement.jobsCreated || entityOverview.employeeCount || 0,
              womenEmployment: ownershipManagement.femaleOwnership || 0,
              youthEmployment: impactMeasurement.youthEmployed || 0,
              trainingHours: impactMeasurement.trainingHoursProvided || 0,
              communityImpact: impactMeasurement.communityBenefit || '',
              score: calculateSocialScore(impactMeasurement, entityOverview, ownershipManagement)
            },
            // Governance metrics
            governance: {
              complianceScore: complianceScore,
              governanceScore: governanceScore,
              bbbeeLevel: legalCompliance.bbbeeLevel || 'Not rated',
              boardDiversity: ownershipManagement.femaleOwnership > 25 ? 'High' : 'Medium',
              auditStatus: legalCompliance.lastAuditDate ? 'Current' : 'Pending',
              score: calculateGovernanceScore(complianceScore, governanceScore, legalCompliance)
            },
            // SDG alignment
            sdgs: impactMeasurement.sdgsTargeted || [],
            // Overall ESG score
            overallESGScore: calculateOverallESGScore(impactMeasurement, complianceScore, governanceScore, entityOverview, ownershipManagement)
          };
        } catch (error) {
          console.error("Error processing SME ESG data:", error);
          return null;
        }
      });

      const allESGData = (await Promise.all(esgPromises)).filter(data => data !== null);
      console.log("Processed ESG data:", allESGData.length);

      // Calculate portfolio-wide metrics
      const metrics = calculatePortfolioMetrics(allESGData);
      setEsgData(metrics);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching ESG data:", error);
      setLoading(false);
    }
  };

  const calculateEnvironmentalScore = (impactMeasurement) => {
    let score = 0;
    let factors = 0;

    // Carbon footprint tracking
    if (impactMeasurement.carbonFootprint) {
      score += 30;
      factors++;
    }

    // Renewable energy usage
    const renewableUsage = parseFloat(impactMeasurement.renewableEnergyUsage || 0);
    if (renewableUsage > 0) {
      score += Math.min(renewableUsage, 100) * 0.4; // Up to 40 points
      factors++;
    }

    // Waste reduction efforts
    if (impactMeasurement.wasteReduction) {
      score += 30;
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  };

  const calculateSocialScore = (impactMeasurement, entityOverview, ownershipManagement) => {
    let score = 0;
    let factors = 0;

    // Job creation
    const jobsCreated = parseInt(impactMeasurement.jobsCreated || entityOverview.employeeCount || 0);
    if (jobsCreated > 0) {
      score += Math.min((jobsCreated / 10) * 20, 30); // Up to 30 points based on jobs
      factors++;
    }

    // Women employment/ownership
    const womenOwnership = parseFloat(ownershipManagement.femaleOwnership || 0);
    if (womenOwnership > 0) {
      score += Math.min(womenOwnership, 100) * 0.25; // Up to 25 points
      factors++;
    }

    // Youth employment
    if (impactMeasurement.youthEmployed && impactMeasurement.youthEmployed > 0) {
      score += 20;
      factors++;
    }

    // Training and development
    if (impactMeasurement.trainingHoursProvided && impactMeasurement.trainingHoursProvided > 0) {
      score += 25;
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  };

  const calculateGovernanceScore = (complianceScore, governanceScore, legalCompliance) => {
    let score = 0;
    let factors = 0;

    // Compliance score
    if (complianceScore > 0) {
      score += complianceScore * 0.4; // Up to 40 points
      factors++;
    }

    // Governance score
    if (governanceScore > 0) {
      score += governanceScore * 0.4; // Up to 40 points
      factors++;
    }

    // B-BBEE certification
    if (legalCompliance.bbbeeLevel) {
      score += 20;
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  };

  const calculateOverallESGScore = (impactMeasurement, complianceScore, governanceScore, entityOverview, ownershipManagement) => {
    const envScore = calculateEnvironmentalScore(impactMeasurement);
    const socScore = calculateSocialScore(impactMeasurement, entityOverview, ownershipManagement);
    const govScore = calculateGovernanceScore(complianceScore, governanceScore, {});

    return Math.round((envScore + socScore + govScore) / 3);
  };

  const calculatePortfolioMetrics = (allESGData) => {
    if (allESGData.length === 0) {
      return {
        pillarScores: { environmental: 0, social: 0, governance: 0 },
        sdgAlignment: {},
        governanceCompliance: { compliant: 0, partial: 0, atRisk: 0 },
        topContributors: []
      };
    }

    // Calculate average pillar scores
    const avgEnvironmental = Math.round(
      allESGData.reduce((sum, sme) => sum + sme.environmental.score, 0) / allESGData.length
    );
    const avgSocial = Math.round(
      allESGData.reduce((sum, sme) => sum + sme.social.score, 0) / allESGData.length
    );
    const avgGovernance = Math.round(
      allESGData.reduce((sum, sme) => sum + sme.governance.score, 0) / allESGData.length
    );

    // Calculate SDG alignment
    const sdgCounts = {};
    allESGData.forEach(sme => {
      if (Array.isArray(sme.sdgs)) {
        sme.sdgs.forEach(sdg => {
          sdgCounts[sdg] = (sdgCounts[sdg] || 0) + 1;
        });
      }
    });

    // Convert to percentages
    const sdgAlignment = {};
    Object.keys(sdgCounts).forEach(sdg => {
      sdgAlignment[sdg] = Math.round((sdgCounts[sdg] / allESGData.length) * 100);
    });

    // Calculate governance compliance breakdown
    let compliant = 0;
    let partial = 0;
    let atRisk = 0;

    allESGData.forEach(sme => {
      const govScore = sme.governance.score;
      if (govScore >= 80) compliant++;
      else if (govScore >= 50) partial++;
      else atRisk++;
    });

    const total = allESGData.length;
    const governanceCompliance = {
      compliant: Math.round((compliant / total) * 100),
      partial: Math.round((partial / total) * 100),
      atRisk: Math.round((atRisk / total) * 100)
    };

    // Identify top ESG contributors
    const topContributors = [...allESGData]
      .sort((a, b) => b.overallESGScore - a.overallESGScore)
      .slice(0, 5)
      .map(sme => {
        // Determine primary strength
        let pillar = 'Governance';
        let stat = `${sme.governance.score} governance score`;

        if (sme.environmental.score > sme.social.score && sme.environmental.score > sme.governance.score) {
          pillar = 'Environmental';
          if (sme.environmental.renewableEnergy > 0) {
            stat = `${sme.environmental.renewableEnergy}% renewable energy`;
          } else if (sme.environmental.carbonFootprint) {
            stat = `Carbon footprint tracking`;
          } else {
            stat = `${sme.environmental.score} environmental score`;
          }
        } else if (sme.social.score > sme.governance.score) {
          pillar = 'Social';
          if (sme.social.jobsCreated > 0) {
            stat = `${sme.social.jobsCreated} jobs created`;
          } else if (sme.social.trainingHours > 0) {
            stat = `${sme.social.trainingHours}+ training hours`;
          } else if (sme.social.womenEmployment > 0) {
            stat = `${sme.social.womenEmployment}% women ownership`;
          } else {
            stat = `${sme.social.score} social score`;
          }
        }

        return {
          smeName: sme.smeName,
          pillar,
          stat,
          overallScore: sme.overallESGScore
        };
      });

    return {
      pillarScores: {
        environmental: avgEnvironmental,
        social: avgSocial,
        governance: avgGovernance
      },
      sdgAlignment,
      governanceCompliance,
      topContributors
    };
  };

  // Data generation functions
  const generateBarData = (labels, data, label, colorIndex) => ({
    labels,
    datasets: [{
      label,
      data,
      backgroundColor: brownShades[colorIndex % brownShades.length]
    }]
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

  // Empty chart data functions
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

  const generateEmptyPieData = (labels) => ({
    labels,
    datasets: [{
      data: labels.map(() => 33), // Equal distribution for empty state
      backgroundColor: labels.map((_, i) => brownShades[i % brownShades.length] + '40'),
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 0
    }]
  });

  // Chart Components
  const BarChartWithTitle = ({ data, title, chartTitle, chartId, isEmpty = false }) => {
    const handleEyeClick = () => {
      if (isEmpty) {
        openPopup(
          <div className="popup-content">
            <h3>{title}</h3>
            <div className="popup-description">
              No data available for {title.toLowerCase()}. Data will appear when SMEs complete their ESG assessments.
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

  // Pie Chart with Numbers ALWAYS visible
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
              No data available for {title.toLowerCase()}. Data will appear when SMEs complete their ESG assessments.
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
      <div className="esg-impact">
        <div className="loading-container">
          <Loader size={48} style={{ color: "#a67c52", animation: "spin 1s linear infinite" }} />
          <p className="loading-text">Loading ESG & impact data...</p>
        </div>
      </div>
    );
  }

  // Check if we have meaningful data
  const hasPillarData = esgData.pillarScores.environmental + esgData.pillarScores.social + esgData.pillarScores.governance > 0;
  const hasSDGData = Object.keys(esgData.sdgAlignment).length > 0;
  const hasGovernanceData = esgData.governanceCompliance.compliant + esgData.governanceCompliance.partial + esgData.governanceCompliance.atRisk > 0;

  // Prepare SDG data for chart - always show structure even if no data
  const sdgLabels = hasSDGData 
    ? Object.keys(esgData.sdgAlignment).slice(0, 4)
    : ['SDG 1', 'SDG 8', 'SDG 9', 'SDG 13']; // Default SDG labels for empty state
  const sdgValues = hasSDGData 
    ? sdgLabels.map(sdg => esgData.sdgAlignment[sdg])
    : [0, 0, 0, 0];

  return (
    <div className="esg-impact">
      {/* Three Column Grid for First 3 Charts */}
      <div className="three-column-grid">
        {/* ESG Pillar Scores */}
        {hasPillarData ? (
          <BarChartWithTitle
            data={generateBarData(
              ['Environmental', 'Social', 'Governance'],
              [
                esgData.pillarScores.environmental,
                esgData.pillarScores.social,
                esgData.pillarScores.governance
              ],
              'Score (0-100)',
              1
            )}
            title="ESG Pillar Scores (E, S, G)"
            chartTitle="Portfolio average ESG pillar scores (0-100)"
            chartId="esg-pillar"
          />
        ) : (
          <BarChartWithTitle
            data={generateEmptyBarData(
              ['Environmental', 'Social', 'Governance'],
              'Score (0-100)',
              1
            )}
            title="ESG Pillar Scores (E, S, G)"
            chartTitle="Portfolio average ESG pillar scores (0-100)"
            chartId="esg-pillar"
            isEmpty={true}
          />
        )}

        {/* SDG Alignment - ALWAYS shows structure */}
        <BarChartWithTitle
          data={generateBarData(
            sdgLabels,
            sdgValues,
            '% of portfolio',
            2
          )}
          title="SDG Alignment"
          chartTitle="Portfolio alignment with SDGs (%)"
          chartId="sdg-alignment"
          isEmpty={!hasSDGData}
        />

        {/* Governance Compliance Health */}
        {hasGovernanceData ? (
          <PieChartWithNumbers
            title="Governance Compliance Health"
            labels={['Compliant', 'Partial', 'At Risk']}
            data={[
              esgData.governanceCompliance.compliant,
              esgData.governanceCompliance.partial,
              esgData.governanceCompliance.atRisk
            ]}
            chartId="governance-compliance"
          />
        ) : (
          <PieChartWithNumbers
            title="Governance Compliance Health"
            labels={['Compliant', 'Partial', 'At Risk']}
            data={[33, 33, 34]}
            chartId="governance-compliance"
            isEmpty={true}
          />
        )}
      </div>

      {/* Full Width Table for Top Contributors */}
      <div className="esg-charts-grid">
        <div className="chart-container full-width">
          <div className="chart-header">
            <h3 className="chart-title">Top 5 ESG Contributors</h3>
            <button 
              className="breakdown-icon-btn"
              onClick={() => openPopup(
                <div className="popup-content">
                  <h3>Top 5 ESG Contributors</h3>
                  <div className="popup-description">
                    Leading SMEs in your portfolio for environmental, social, and governance performance
                  </div>
                  {esgData.topContributors.length > 0 ? (
                    <div className="table-container-popup">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>SME</th>
                            <th>Primary Pillar</th>
                            <th>Key Metric</th>
                            <th>ESG Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {esgData.topContributors.map((contributor, idx) => (
                            <tr key={idx}>
                              <td>{contributor.smeName}</td>
                              <td>{contributor.pillar}</td>
                              <td>{contributor.stat}</td>
                              <td>{contributor.overallScore}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">🌱</div>
                      <div className="empty-state-text">
                        No ESG contributors data available yet.<br/>
                        ESG metrics will appear here as SMEs complete their impact assessments.
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
            {esgData.topContributors.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SME</th>
                    <th>Primary Pillar</th>
                    <th>Key Metric</th>
                    <th>ESG Score</th>
                  </tr>
                </thead>
                <tbody>
                  {esgData.topContributors.map((contributor, idx) => (
                    <tr key={idx}>
                      <td>{contributor.smeName}</td>
                      <td>{contributor.pillar}</td>
                      <td>{contributor.stat}</td>
                      <td>{contributor.overallScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🌱</div>
                <div className="empty-state-text">
                  No ESG contribution data available yet.<br/>
                  ESG metrics will appear here as SMEs complete their impact assessments.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESGImpactPerformance;