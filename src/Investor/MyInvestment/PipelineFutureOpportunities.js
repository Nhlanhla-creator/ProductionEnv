// tabs/PipelineFutureOpportunities.js
import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FiEye, FiGrid, FiCheck } from 'react-icons/fi';
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
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
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

// Styles for PipelineFutureOpportunities
const styles = `
.pipeline-opportunities {
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

.charts-grid-4x4 {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 10px;
}

.top-row,
.bottom-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.bottom-full {
  grid-column: 1 / -1;
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

/* Funnel Chart Styles */
.funnel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  height: 100%;
  justify-content: center;
}

.funnel-stage {
  width: 100%;
  display: flex;
  justify-content: center;
}

.funnel-bar {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  border-radius: 4px;
  position: relative;
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.funnel-bar:hover {
  transform: none !important;
  animation: none !important;
  transition: none !important;
  box-shadow: none !important;
}

.funnel-label {
  color: white;
  font-weight: 600;
  font-size: 12px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.funnel-value {
  color: white;
  font-weight: 700;
  font-size: 14px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
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

/* Funnel in popup */
.funnel-container-popup {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
  padding: 20px;
}

.funnel-stage-popup {
  width: 100%;
  display: flex;
  justify-content: center;
}

.funnel-bar-popup {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-radius: 6px;
  min-width: 200px;
}

.funnel-label-popup {
  color: white;
  font-weight: 600;
  font-size: 14px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.funnel-value-popup {
  color: white;
  font-weight: 700;
  font-size: 16px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

/* Table in popup */
.table-container-popup {
  overflow-x: auto;
  margin-top: 15px;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .top-row,
  .bottom-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-container {
    height: 400px;
  }
}

@media (max-width: 992px) {
  .top-row,
  .bottom-row {
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
  
  .charts-grid-4x4 {
    padding: 0 5px;
  }
  
  .data-table {
    font-size: 12px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px;
  }
  
  .funnel-bar {
    padding: 0 10px;
  }
  
  .funnel-label {
    font-size: 10px;
  }
  
  .funnel-value {
    font-size: 12px;
  }
  
  .chart-selection-grid {
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

const staticPieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { position: 'bottom' } }
};

// Save user preferences to Firebase
const saveUserChartPreferences = async (userId, preferences) => {
  try {
    const userPrefsRef = doc(db, "userPreferences", userId);
    await setDoc(userPrefsRef, {
      pipelineChartPreferences: preferences,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('✅ Pipeline chart preferences saved to Firebase');
  } catch (error) {
    console.error('❌ Error saving pipeline chart preferences:', error);
  }
};

// Load user preferences from Firebase
const loadUserChartPreferences = async (userId) => {
  try {
    const userPrefsRef = doc(db, "userPreferences", userId);
    const userPrefsSnap = await getDoc(userPrefsRef);
    
    if (userPrefsSnap.exists()) {
      const preferences = userPrefsSnap.data().pipelineChartPreferences;
      console.log('✅ Pipeline chart preferences loaded from Firebase:', preferences);
      return preferences;
    } else {
      console.log('⚠️ No pipeline chart preferences found, using defaults');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading pipeline chart preferences:', error);
    return null;
  }
};

const PipelineFutureOpportunities = ({ openPopup }) => {
  const [loading, setLoading] = useState(true);
  const [cohorts, setCohorts] = useState([]);
  const [pipelineData, setPipelineData] = useState({
    agingData: { labels: [], values: [] },
    conversionData: { stages: [], values: [] },
    capitalRequirement: { quarters: [], debt: [], equity: [], grants: [] },
    dataConfidence: { labels: [], values: [] },
    coInvestOpportunities: []
  });
  
  const [showChartSelector, setShowChartSelector] = useState(false);
  const [selectedCharts, setSelectedCharts] = useState({
    pipelineAging: true,
    pipelineDistribution: true,
    capitalDeployment: true,
    dataConfidence: true,
    activeOpportunities: true
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
      if (currentUser && !loading) {
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
  }, [selectedCharts, loading]);

  useEffect(() => {
    fetchInvestorData();
  }, []);

  const fetchInvestorData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log("No authenticated user");
        setLoading(false);
        return;
      }

      // Fetch ALL investor applications (not just Deal Complete)
      const q = query(
        collection(db, "investorApplications"),
        where("funderId", "==", currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      console.log("Found all deals:", querySnapshot.docs.length);

      const cohortsData = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          
          try {
            let profileData = {};

            if (data.smeId) {
              const profileRef = doc(db, "universalProfiles", data.smeId);
              const profileSnap = await getDoc(profileRef);

              if (profileSnap.exists()) {
                profileData = profileSnap.data();
              } else if (data.userId) {
                const userProfileRef = doc(db, "universalProfiles", data.userId);
                const userProfileSnap = await getDoc(userProfileRef);
                if (userProfileSnap.exists()) {
                  profileData = userProfileSnap.data();
                }
              }
            }

            const smeName =
              profileData.entityOverview?.tradingName ||
              profileData.entityOverview?.registeredName ||
              data.companyName ||
              data.smeName ||
              "Unnamed Business";

            return {
              id: docSnap.id,
              smeId: data.smeId || data.userId,
              smeName,
              dealAmount: data.fundingDetails?.amountApproved || data.fundingRequired || 0,
              dealType: data.fundingDetails?.investmentType || data.investmentType || "equity",
              completionDate: data.updatedAt || data.createdAt,
              sector: profileData.entityOverview?.economicSectors?.[0] || data.sector || "Not specified",
              location: profileData.entityOverview?.location || data.location || "Not specified",
              pipelineStage: data.pipelineStage,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              fundingDetails: data.fundingDetails || {},
              profileData: profileData,
              status: data.status,
              isComplete: data.pipelineStage === "Deal Complete"
            };
          } catch (error) {
            console.error("Error fetching profile:", error);
            return null;
          }
        })
      );

      const validCohorts = cohortsData.filter(cohort => cohort !== null);
      
      // FILTER: Only show deals that are NOT complete (didn't reach the end)
      const incompleteDeals = validCohorts.filter(cohort => 
        !cohort.isComplete && 
        cohort.pipelineStage !== "Deal Complete" &&
        cohort.pipelineStage !== "declined" &&
        cohort.pipelineStage !== "withdrawn"
      );

      console.log("Incomplete deals:", incompleteDeals.length);
      console.log("Complete deals:", validCohorts.filter(cohort => cohort.isComplete).length);

      setCohorts(incompleteDeals);

      // Calculate pipeline metrics from INCOMPLETE deals only
      calculatePipelineMetrics(incompleteDeals);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching investor data:", error);
      setLoading(false);
    }
  };

  const calculatePipelineMetrics = (cohorts) => {
    if (cohorts.length === 0) {
      // Set empty/placeholder data
      setPipelineData({
        agingData: {
          labels: ['<1 month', '1-3 months', '3-6 months', '>6 months'],
          values: [0, 0, 0, 0]
        },
        conversionData: {
          stages: ['Application', 'Under Review', 'Due Diligence', 'Approved'],
          values: [0, 0, 0, 0]
        },
        capitalRequirement: {
          quarters: ['Q1', 'Q2', 'Q3', 'Q4'],
          debt: [0, 0, 0, 0],
          equity: [0, 0, 0, 0],
          grants: [0, 0, 0, 0]
        },
        dataConfidence: {
          labels: ['Verified', 'Partial', 'Unverified'],
          values: [0, 0, 0]
        },
        coInvestOpportunities: []
      });
      return;
    }

    // 1. Calculate Pipeline Stage Aging for INCOMPLETE deals
    const now = new Date();
    const agingBuckets = { '<1 month': 0, '1-3 months': 0, '3-6 months': 0, '>6 months': 0 };
    
    cohorts.forEach(cohort => {
      if (cohort.updatedAt) {
        const updatedDate = new Date(cohort.updatedAt);
        const monthsDiff = (now - updatedDate) / (1000 * 60 * 60 * 24 * 30);
        
        if (monthsDiff < 1) agingBuckets['<1 month']++;
        else if (monthsDiff < 3) agingBuckets['1-3 months']++;
        else if (monthsDiff < 6) agingBuckets['3-6 months']++;
        else agingBuckets['>6 months']++;
      }
    });

    // 2. Calculate Current Pipeline Distribution (actual stages of incomplete deals)
    const stageCounts = {
      'Application': 0,
      'Under Review': 0,
      'Due Diligence': 0,
      'Funding Approved': 0,
      'Termsheet': 0
    };

    cohorts.forEach(cohort => {
      const stage = cohort.pipelineStage;
      if (stageCounts.hasOwnProperty(stage)) {
        stageCounts[stage]++;
      } else if (stage) {
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      }
    });

    // Convert to funnel data (showing current pipeline distribution)
    const currentStages = Object.keys(stageCounts).filter(stage => stageCounts[stage] > 0);
    const currentValues = currentStages.map(stage => stageCounts[stage]);

    // 3. Calculate Forecasted Capital Requirement by deal type for INCOMPLETE deals
    const capitalByType = {
      debt: [0, 0, 0, 0],
      equity: [0, 0, 0, 0],
      grants: [0, 0, 0, 0]
    };

    cohorts.forEach(cohort => {
      const amount = parseFloat(String(cohort.dealAmount).replace(/[^0-9.]/g, '')) || 0;
      const amountInMillions = amount / 1000000;
      const dealType = cohort.dealType.toLowerCase();
      
      // Distribute across quarters (simplified)
      const quarterAmount = amountInMillions / 4;
      
      if (dealType.includes('debt') || dealType.includes('loan')) {
        capitalByType.debt = capitalByType.debt.map(q => q + quarterAmount);
      } else if (dealType.includes('equity')) {
        capitalByType.equity = capitalByType.equity.map(q => q + quarterAmount);
      } else if (dealType.includes('grant')) {
        capitalByType.grants = capitalByType.grants.map(q => q + quarterAmount);
      }
    });

    // 4. Calculate Data Confidence Meter for INCOMPLETE deals
    let verified = 0, partial = 0, unverified = 0;
    
    cohorts.forEach(cohort => {
      const hasCompleteProfile = cohort.profileData && 
        cohort.profileData.entityOverview?.tradingName &&
        cohort.profileData.entityOverview?.location;
      
      const hasFundingDetails = cohort.fundingDetails && 
        cohort.fundingDetails.amountApproved;
      
      if (hasCompleteProfile && hasFundingDetails) verified++;
      else if (hasCompleteProfile || hasFundingDetails) partial++;
      else unverified++;
    });

    const total = verified + partial + unverified;
    const dataConfidence = {
      labels: ['Verified', 'Partial', 'Unverified'],
      values: total > 0 ? [
        Math.round((verified / total) * 100),
        Math.round((partial / total) * 100),
        Math.round((unverified / total) * 100)
      ] : [0, 0, 0]
    };

    // 5. Prepare Active Pipeline Opportunities (incomplete deals sorted by deal amount)
    const activeOpportunities = [...cohorts]
      .sort((a, b) => {
        const amountA = parseFloat(String(a.dealAmount).replace(/[^0-9.]/g, '')) || 0;
        const amountB = parseFloat(String(b.dealAmount).replace(/[^0-9.]/g, '')) || 0;
        return amountB - amountA;
      })
      .slice(0, 5)
      .map(cohort => ({
        smeName: cohort.smeName,
        stage: cohort.pipelineStage || 'Application',
        ask: formatCurrency(cohort.dealAmount),
        score: calculateDealScore(cohort), // Calculate based on actual data
        daysInStage: calculateDaysInStage(cohort)
      }));

    setPipelineData({
      agingData: {
        labels: Object.keys(agingBuckets),
        values: Object.values(agingBuckets)
      },
      conversionData: {
        stages: currentStages,
        values: currentValues
      },
      capitalRequirement: {
        quarters: ['Q1', 'Q2', 'Q3', 'Q4'],
        debt: capitalByType.debt.map(v => Math.round(v * 10) / 10), // Keep one decimal
        equity: capitalByType.equity.map(v => Math.round(v * 10) / 10),
        grants: capitalByType.grants.map(v => Math.round(v * 10) / 10)
      },
      dataConfidence,
      coInvestOpportunities: activeOpportunities
    });
  };

  const calculateDealScore = (cohort) => {
    // Calculate a score based on data completeness and deal stage
    let score = 50; // Base score
    
    // Add points for data completeness
    if (cohort.profileData?.entityOverview?.tradingName) score += 10;
    if (cohort.fundingDetails?.amountApproved) score += 15;
    if (cohort.profileData?.entityOverview?.location) score += 10;
    if (cohort.profileData?.entityOverview?.economicSectors?.length > 0) score += 10;
    
    // Add points for pipeline stage (later stages get higher scores)
    const stageWeights = {
      'Application': 0,
      'Under Review': 5,
      'Due Diligence': 10,
      'Funding Approved': 15,
      'Termsheet': 20
    };
    
    score += stageWeights[cohort.pipelineStage] || 0;
    
    return Math.min(score, 100);
  };

  const calculateDaysInStage = (cohort) => {
    if (!cohort.updatedAt) return 'Unknown';
    const updatedDate = new Date(cohort.updatedAt);
    const now = new Date();
    const daysDiff = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));
    return `${daysDiff} days`;
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === "Not specified") return "Not specified";
    if (typeof amount === "string" && amount.includes('R')) return amount;
    const numAmount = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;
    if (numAmount >= 1000000) {
      return `R${(numAmount / 1000000).toFixed(1)}m`;
    } else if (numAmount >= 1000) {
      return `R${(numAmount / 1000).toFixed(1)}k`;
    }
    return `R${numAmount}`;
  };

  // Chart Selection Component
  const ChartSelectionPopup = () => {
    const chartOptions = [
      { id: 'pipelineAging', label: 'Pipeline Stage Aging' },
      { id: 'pipelineDistribution', label: 'Pipeline Distribution' },
      { id: 'capitalDeployment', label: 'Capital Deployment' },
      { id: 'dataConfidence', label: 'Data Confidence Meter' },
      { id: 'activeOpportunities', label: 'Active Opportunities' }
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

  // Pie Chart with Numbers ALWAYS visible
  const PieChartWithNumbers = ({ title, labels, data, chartId }) => {
    const chartData = generatePieData(labels, data);

    const plugins = [{
      id: 'centerText',
      afterDraw: (chart) => {
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
          <Doughnut data={chartData} options={staticPieOptions} plugins={plugins} />
        </div>
      </div>
    );
  };

  // Funnel Chart Component
  const FunnelChart = ({ stages, values, colors, title }) => {
    const maxValue = Math.max(...values);
    
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Current Pipeline Distribution</h3>
          <div className="popup-description">
            Active deals distributed across pipeline stages
          </div>
          <div className="popup-chart">
            <div className="funnel-container-popup">
              {stages.map((stage, index) => {
                const width = (values[index] / maxValue) * 80 + 20;
                return (
                  <div key={stage} className="funnel-stage-popup">
                    <div 
                      className="funnel-bar-popup"
                      style={{
                        width: `${width}%`,
                        backgroundColor: colors[index] || brownShades[index % brownShades.length]
                      }}
                    >
                      <span className="funnel-label-popup">{stage}</span>
                      <span className="funnel-value-popup">{values[index]} deals</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="popup-details">
            {stages.map((stage, index) => (
              <div key={stage} className="detail-item">
                <span className="detail-label">{stage}:</span>
                <span className="detail-value">{values[index]} active deals</span>
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
          <div className="funnel-container">
            {stages.map((stage, index) => {
              const width = (values[index] / maxValue) * 80 + 20;
              return (
                <div key={stage} className="funnel-stage">
                  <div 
                    className="funnel-bar"
                    style={{
                      width: `${width}%`,
                      backgroundColor: colors[index] || brownShades[index % brownShades.length]
                    }}
                  >
                    <span className="funnel-label">{stage}</span>
                    <span className="funnel-value">{values[index]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="pipeline-opportunities">
        <div className="loading-container">
          <Loader size={48} style={{ color: "#a67c52", animation: "spin 1s linear infinite" }} />
          <p className="loading-text">Loading pipeline data...</p>
        </div>
      </div>
    );
  }

  // Get selected charts
  const selectedChartComponents = [];
  
  // Add Pipeline Stage Aging chart if selected
  if (selectedCharts.pipelineAging) {
    selectedChartComponents.push({
      id: 'pipelineAging',
      component: (
        <BarChartWithTitle
          key="pipelineAging"
          data={generateBarData(
            pipelineData.agingData.labels,
            pipelineData.agingData.values,
            '# of Deals',
            0
          )}
          title="Pipeline Stage Aging"
          chartTitle="Active deals by time in current stage"
          chartId="pipeline-aging"
        />
      )
    });
  }

  // Add Pipeline Distribution chart if selected
  if (selectedCharts.pipelineDistribution) {
    selectedChartComponents.push({
      id: 'pipelineDistribution',
      component: (
        <FunnelChart 
          key="pipelineDistribution"
          stages={pipelineData.conversionData.stages}
          values={pipelineData.conversionData.values}
          colors={[brownShades[0], brownShades[1], brownShades[2], brownShades[3]]}
          title="Current Pipeline Distribution"
        />
      )
    });
  }

  // Add Capital Deployment chart if selected
  if (selectedCharts.capitalDeployment) {
    selectedChartComponents.push({
      id: 'capitalDeployment',
      component: (
        <BarChartWithTitle
          key="capitalDeployment"
          data={generateStackedBarData(
            pipelineData.capitalRequirement.quarters,
            [
              { label: 'Debt', values: pipelineData.capitalRequirement.debt },
              { label: 'Equity', values: pipelineData.capitalRequirement.equity },
              { label: 'Grants', values: pipelineData.capitalRequirement.grants }
            ]
          )}
          title="Forecasted Capital Deployment"
          chartTitle="Capital required for active pipeline (R millions)"
          chartId="capital-requirement"
        />
      )
    });
  }

  // Add Data Confidence Meter chart if selected
  if (selectedCharts.dataConfidence) {
    selectedChartComponents.push({
      id: 'dataConfidence',
      component: (
        <PieChartWithNumbers
          key="dataConfidence"
          title="Data Confidence Meter"
          labels={pipelineData.dataConfidence.labels}
          data={pipelineData.dataConfidence.values}
          chartId="data-confidence"
        />
      )
    });
  }

  // Add Active Opportunities table if selected
  if (selectedCharts.activeOpportunities) {
    selectedChartComponents.push({
      id: 'activeOpportunities',
      component: (
        <div key="activeOpportunities" className="chart-container full-width">
          <div className="chart-header">
            <h3 className="chart-title">Active Pipeline Opportunities</h3>
            <button 
              className="breakdown-icon-btn"
              onClick={() => openPopup(
                <div className="popup-content">
                  <h3>Active Pipeline Opportunities</h3>
                  <div className="popup-description">
                    Your current active deals that haven't reached completion
                  </div>
                  <div className="table-container-popup">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>SME</th>
                          <th>Current Stage</th>
                          <th>Investment Ask</th>
                          <th>Deal Score</th>
                          <th>Time in Stage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pipelineData.coInvestOpportunities.map((opp, idx) => (
                          <tr key={idx}>
                            <td>{opp.smeName}</td>
                            <td>{opp.stage}</td>
                            <td>{opp.ask}</td>
                            <td>{opp.score}</td>
                            <td>{opp.daysInStage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              title="View details"
            >
              <FiEye />
            </button>
          </div>
          <div className="table-container">
            {pipelineData.coInvestOpportunities.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SME</th>
                    <th>Current Stage</th>
                    <th>Investment Ask</th>
                    <th>Deal Score</th>
                    <th>Time in Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelineData.coInvestOpportunities.map((opp, idx) => (
                    <tr key={idx}>
                      <td>{opp.smeName}</td>
                      <td>{opp.stage}</td>
                      <td>{opp.ask}</td>
                      <td>{opp.score}</td>
                      <td>{opp.daysInStage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#7d5a50',
                fontSize: '14px'
              }}>
                No active pipeline opportunities found
              </div>
            )}
          </div>
        </div>
      )
    });
  }

  // Split charts into top row (max 4) and bottom full width
  const topRowCharts = selectedChartComponents
    .filter(chart => chart.id !== 'activeOpportunities')
    .slice(0, 4);
  const bottomFullChart = selectedChartComponents
    .find(chart => chart.id === 'activeOpportunities');

  return (
    <div className="pipeline-opportunities">
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
      <div className="charts-grid-4x4">
        {topRowCharts.length > 0 && (
          <div className="top-row">
            {topRowCharts.map(chart => chart.component)}
          </div>
        )}
        
        {bottomFullChart && (
          <div className="bottom-full">
            {bottomFullChart.component}
          </div>
        )}
        
        {selectedChartComponents.length === 0 && (
          <div style={{ 
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

export default PipelineFutureOpportunities;