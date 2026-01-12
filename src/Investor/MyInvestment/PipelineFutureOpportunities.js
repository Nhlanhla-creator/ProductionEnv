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

// Helper function to calculate days difference
const calculateDaysDifference = (date1, date2) => {
  const diffTime = Math.abs(date2 - date1);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

// Helper function to format currency
const formatCurrency = (amount) => {
  if (!amount || amount === "Not specified" || amount === "N/A") return "Not specified";
  if (typeof amount === "string" && amount.includes('R')) return amount;
  const numAmount = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;
  if (numAmount >= 1000000) {
    return `R${(numAmount / 1000000).toFixed(1)}m`;
  } else if (numAmount >= 1000) {
    return `R${(numAmount / 1000).toFixed(1)}k`;
  }
  return `R${numAmount}`;
};

const PipelineFutureOpportunities = ({ openPopup }) => {
  const [loading, setLoading] = useState(true);
  const [activeDeals, setActiveDeals] = useState([]);
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

    const timeoutId = setTimeout(savePreferences, 1000);
    return () => clearTimeout(timeoutId);
  }, [selectedCharts, loading]);

  // Fetch investor data when component mounts
  useEffect(() => {
    fetchInvestorData();
  }, []);

  const fetchInvestorData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log("❌ No authenticated user");
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching investor applications for pipeline opportunities...');

      // Get all investor applications for this funder
      const q = query(
        collection(db, "investorApplications"),
        where("funderId", "==", currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      console.log('📊 Total applications found:', querySnapshot.docs.length);

      const activeDealsData = [];
      
      // Process each application
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const pipelineStage = data.pipelineStage || data.stage;
        
        // Only include ACTIVE deals (not completed or declined)
        if (pipelineStage !== "Deal Complete" && 
            pipelineStage !== "Deal Declined" && 
            pipelineStage !== "Declined" &&
            pipelineStage !== "Closed") {
          
          try {
            // Get SME profile data
            let profileData = {};
            let smeName = data.smeName || "Unknown SME";
            
            if (data.smeId) {
              const profileRef = doc(db, "universalProfiles", data.smeId);
              const profileSnap = await getDoc(profileRef);
              
              if (profileSnap.exists()) {
                profileData = profileSnap.data();
                smeName = profileData.entityOverview?.tradingName ||
                         profileData.entityOverview?.registeredName ||
                         data.smeName ||
                         "Unknown SME";
              }
            }

            // Calculate days in current stage
            const updatedDate = data.updatedAt ? new Date(data.updatedAt) : new Date();
            const daysInStage = calculateDaysDifference(updatedDate, new Date());
            
            // Get funding amount
            let fundingAmount = 0;
            if (data.fundingDetails?.amountApproved) {
              fundingAmount = parseFloat(String(data.fundingDetails.amountApproved).replace(/[^0-9.]/g, '')) || 0;
            } else if (profileData.useOfFunds?.amountRequested) {
              fundingAmount = parseFloat(String(profileData.useOfFunds.amountRequested).replace(/[^0-9.]/g, '')) || 0;
            }

            // Get sector
            const sector = profileData.entityOverview?.economicSectors?.[0] || 
                          data.sector || 
                          "Not specified";

            // Get investment type
            const investmentType = data.fundingDetails?.investmentType || 
                                  profileData.useOfFunds?.fundingInstruments?.[0] || 
                                  "equity";

            // Calculate deal score
            const dealScore = calculateDealScore(data, profileData, pipelineStage);

            activeDealsData.push({
              id: docSnap.id,
              smeId: data.smeId,
              smeName,
              fundingAmount,
              investmentType: investmentType.toLowerCase(),
              pipelineStage,
              updatedAt: data.updatedAt,
              createdAt: data.createdAt,
              daysInStage,
              sector,
              profileData,
              fundingDetails: data.fundingDetails || {},
              dealScore,
              matchPercentage: data.matchPercentage || 0
            });

            console.log(`✅ Added active deal: ${smeName} - ${pipelineStage} - R${fundingAmount}`);
            
          } catch (error) {
            console.error('❌ Error processing application:', error);
            continue;
          }
        }
      }

      console.log(`📈 Active deals found: ${activeDealsData.length}`);
      setActiveDeals(activeDealsData);
      
      // Calculate pipeline metrics
      if (activeDealsData.length > 0) {
        calculatePipelineMetrics(activeDealsData);
      } else {
        // Set default empty data
        setPipelineData({
          agingData: {
            labels: ['<1 month', '1-3 months', '3-6 months', '>6 months'],
            values: [0, 0, 0, 0]
          },
          conversionData: {
            stages: ['Application', 'Under Review', 'Due Diligence', 'Funding Approved', 'Termsheet'],
            values: [0, 0, 0, 0, 0]
          },
          capitalRequirement: {
            quarters: ['Next 3 months', '3-6 months', '6-9 months', '9-12 months'],
            debt: [0, 0, 0, 0],
            equity: [0, 0, 0, 0],
            grants: [0, 0, 0, 0]
          },
          dataConfidence: {
            labels: ['High Confidence', 'Medium Confidence', 'Low Confidence'],
            values: [0, 0, 0]
          },
          coInvestOpportunities: []
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching investor data:', error);
      setLoading(false);
    }
  };

  const calculateDealScore = (applicationData, profileData, pipelineStage) => {
    let score = 50; // Base score
    
    // Data completeness points
    if (profileData.entityOverview?.tradingName || profileData.entityOverview?.registeredName) score += 10;
    if (profileData.entityOverview?.location) score += 5;
    if (profileData.entityOverview?.economicSectors?.length > 0) score += 5;
    if (profileData.useOfFunds?.amountRequested) score += 10;
    if (applicationData.fundingDetails?.amountApproved) score += 15;
    
    // Pipeline stage points
    const stagePoints = {
      'Application Received': 0,
      'Under Review': 10,
      'Due Diligence': 20,
      'Funding Approved': 30,
      'Termsheet': 40
    };
    
    score += stagePoints[pipelineStage] || 0;
    
    // Match percentage points
    if (applicationData.matchPercentage) {
      score += Math.round(applicationData.matchPercentage / 2);
    }
    
    return Math.min(score, 100);
  };

  const calculatePipelineMetrics = (deals) => {
    const now = new Date();
    
    // 1. Pipeline Stage Aging
    const agingBuckets = { 
      '<1 month': 0, 
      '1-3 months': 0, 
      '3-6 months': 0, 
      '>6 months': 0 
    };
    
    deals.forEach(deal => {
      if (deal.updatedAt) {
        const updatedDate = new Date(deal.updatedAt);
        const monthsDiff = (now - updatedDate) / (1000 * 60 * 60 * 24 * 30);
        
        if (monthsDiff < 1) agingBuckets['<1 month']++;
        else if (monthsDiff < 3) agingBuckets['1-3 months']++;
        else if (monthsDiff < 6) agingBuckets['3-6 months']++;
        else agingBuckets['>6 months']++;
      }
    });

    // 2. Pipeline Distribution by Stage
    const stageCounts = {
      'Application Received': 0,
      'Under Review': 0,
      'Due Diligence': 0,
      'Funding Approved': 0,
      'Termsheet': 0
    };

    deals.forEach(deal => {
      const stage = deal.pipelineStage;
      if (stageCounts.hasOwnProperty(stage)) {
        stageCounts[stage]++;
      } else if (stage) {
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      }
    });

    // Remove stages with 0 deals
    const activeStages = Object.keys(stageCounts).filter(stage => stageCounts[stage] > 0);
    const stageValues = activeStages.map(stage => stageCounts[stage]);

    // 3. Capital Requirement Forecast
    const capitalByType = {
      debt: [0, 0, 0, 0],
      equity: [0, 0, 0, 0],
      grants: [0, 0, 0, 0]
    };

    deals.forEach(deal => {
      const amount = deal.fundingAmount || 0;
      const amountInMillions = amount / 1000000;
      const dealType = deal.investmentType;
      
      // Distribute across quarters (simplified forecast)
      const quarterAmount = amountInMillions / 4;
      
      if (dealType.includes('debt') || dealType.includes('loan')) {
        capitalByType.debt = capitalByType.debt.map(q => q + quarterAmount);
      } else if (dealType.includes('grant') || dealType.includes('funding')) {
        capitalByType.grants = capitalByType.grants.map(q => q + quarterAmount);
      } else {
        // Default to equity
        capitalByType.equity = capitalByType.equity.map(q => q + quarterAmount);
      }
    });

    // 4. Data Confidence Meter
    let highConfidence = 0, mediumConfidence = 0, lowConfidence = 0;
    
    deals.forEach(deal => {
      const hasCompleteProfile = deal.profileData && 
        (deal.profileData.entityOverview?.tradingName || deal.profileData.entityOverview?.registeredName) &&
        deal.profileData.entityOverview?.location &&
        deal.profileData.entityOverview?.economicSectors?.length > 0;
      
      const hasFundingDetails = deal.fundingDetails && 
        deal.fundingDetails.amountApproved;
      
      const hasFinancials = deal.profileData?.financialOverview?.annualRevenue;
      
      if (hasCompleteProfile && hasFundingDetails && hasFinancials) {
        highConfidence++;
      } else if ((hasCompleteProfile && hasFundingDetails) || (hasCompleteProfile && hasFinancials)) {
        mediumConfidence++;
      } else {
        lowConfidence++;
      }
    });

    const totalDeals = highConfidence + mediumConfidence + lowConfidence;
    const dataConfidence = {
      labels: ['High Confidence', 'Medium Confidence', 'Low Confidence'],
      values: totalDeals > 0 ? [
        Math.round((highConfidence / totalDeals) * 100),
        Math.round((mediumConfidence / totalDeals) * 100),
        Math.round((lowConfidence / totalDeals) * 100)
      ] : [0, 0, 0]
    };

    // 5. Active Pipeline Opportunities (top deals by deal score)
    const activeOpportunities = [...deals]
      .sort((a, b) => b.dealScore - a.dealScore)
      .slice(0, 5)
      .map(deal => ({
        smeName: deal.smeName,
        stage: deal.pipelineStage,
        ask: formatCurrency(deal.fundingAmount),
        score: deal.dealScore,
        daysInStage: `${deal.daysInStage} days`,
        sector: deal.sector,
        matchPercentage: deal.matchPercentage
      }));

    setPipelineData({
      agingData: {
        labels: Object.keys(agingBuckets),
        values: Object.values(agingBuckets)
      },
      conversionData: {
        stages: activeStages,
        values: stageValues
      },
      capitalRequirement: {
        quarters: ['Next 3 months', '3-6 months', '6-9 months', '9-12 months'],
        debt: capitalByType.debt.map(v => Math.round(v * 10) / 10),
        equity: capitalByType.equity.map(v => Math.round(v * 10) / 10),
        grants: capitalByType.grants.map(v => Math.round(v * 10) / 10)
      },
      dataConfidence,
      coInvestOpportunities: activeOpportunities
    });
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
      <div style={{
        position: 'absolute',
        top: '40px',
        left: '0',
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
        zIndex: 1000,
        minWidth: '300px',
        border: '1px solid #e0e0e0'
      }}>
        <h4 style={{
          margin: '0 0 15px 0',
          color: '#5e3f26',
          fontSize: '16px',
          fontWeight: 600,
          paddingBottom: '10px',
          borderBottom: '1px solid #ede4d8'
        }}>
          Select Charts to Display ({selectedCount} selected)
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {chartOptions.map(option => (
            <div
              key={option.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: selectedCharts[option.id] ? '#e8f5e8' : '#f8f9fa',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: selectedCharts[option.id] ? '1px solid #4CAF50' : 'none'
              }}
              onClick={() => handleToggleChart(option.id)}
            >
              <div style={{
                width: '18px',
                height: '18px',
                border: '2px solid #7d5a36',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: selectedCharts[option.id] ? '#7d5a36' : 'transparent',
                color: selectedCharts[option.id] ? 'white' : 'transparent'
              }}>
                {selectedCharts[option.id] && <FiCheck size={12} />}
              </div>
              <span style={{
                fontSize: '13px',
                color: '#333',
                fontWeight: 500
              }}>{option.label}</span>
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'space-between'
        }}>
          <button style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            flex: 1,
            backgroundColor: '#f5f5f5',
            color: '#666'
          }} onClick={handleDeselectAll}>
            Deselect All
          </button>
          <button style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            flex: 1,
            backgroundColor: '#f5f5f5',
            color: '#666'
          }} onClick={handleSelectAll}>
            Select All
          </button>
          <button style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            flex: 1,
            backgroundColor: '#7d5a36',
            color: 'white'
          }} onClick={handleSaveSelection}>
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
  const BarChartWithTitle = ({ data, title, chartTitle, chartId, description }) => {
    const handleEyeClick = () => {
      openPopup(
        <div style={{ width: '100%' }}>
          <h3 style={{
            margin: '0 0 20px 0',
            color: '#5e3f26',
            fontSize: '24px',
            textAlign: 'center',
            borderBottom: '2px solid #ede4d8',
            paddingBottom: '15px'
          }}>{title}</h3>
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '20px',
            textAlign: 'center',
            lineHeight: '1.5',
            fontStyle: 'italic',
            background: '#f8f9fa',
            padding: '12px 15px',
            borderRadius: '6px',
            borderLeft: '3px solid #7d5a36'
          }}>
            {description}
          </div>
          <div style={{ height: '300px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bar data={data} options={staticBarOptions} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
            {data.labels.map((label, index) => (
              <div key={label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #7d5a36'
              }}>
                <span style={{ fontWeight: 600, color: '#5e3f26', fontSize: '14px' }}>{label}:</span>
                <span style={{ fontWeight: 600, color: '#7d5a36', fontSize: '14px' }}>{data.datasets[0].data[index]} deals</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '420px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <h3 style={{
            margin: '0 0 10px 0',
            color: '#5e3f26',
            fontSize: '16px',
            fontWeight: 600,
            paddingBottom: '10px',
            borderBottom: '1px solid #ede4d8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            lineHeight: 1.3,
            minHeight: '40px',
            flex: 1
          }}>{title}</h3>
          <button style={{
            background: 'none',
            border: 'none',
            color: '#7d5a36',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '4px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} onClick={handleEyeClick} title="View breakdown">
            <FiEye />
          </button>
        </div>
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#7d5a36',
          marginBottom: '15px',
          textAlign: 'center',
          padding: '8px 12px',
          background: '#f8f9fa',
          borderRadius: '4px',
          borderLeft: '3px solid #7d5a36'
        }}>{chartTitle}</div>
        <div style={{ flexGrow: 1, minHeight: '240px', position: 'relative', marginBottom: '10px' }}>
          {data.labels.length > 0 && data.datasets[0].data.some(value => value > 0) ? (
            <Bar data={data} options={staticBarOptions} />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#7d5a50',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              No data available
            </div>
          )}
        </div>
      </div>
    );
  };

  // Funnel Chart Component
  const FunnelChart = ({ stages, values, colors, title }) => {
    const maxValue = Math.max(...values);
    
    const handleEyeClick = () => {
      openPopup(
        <div style={{ width: '100%' }}>
          <h3 style={{
            margin: '0 0 20px 0',
            color: '#5e3f26',
            fontSize: '24px',
            textAlign: 'center',
            borderBottom: '2px solid #ede4d8',
            paddingBottom: '15px'
          }}>Current Pipeline Distribution</h3>
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '20px',
            textAlign: 'center',
            lineHeight: '1.5',
            fontStyle: 'italic',
            background: '#f8f9fa',
            padding: '12px 15px',
            borderRadius: '6px',
            borderLeft: '3px solid #7d5a36'
          }}>
            Active deals distributed across pipeline stages
          </div>
          <div style={{ height: '300px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', width: '100%', padding: '20px' }}>
              {stages.map((stage, index) => {
                const width = (values[index] / maxValue) * 80 + 20;
                return (
                  <div key={stage} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div 
                      style={{
                        width: `${width}%`,
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 20px',
                        borderRadius: '6px',
                        minWidth: '200px',
                        backgroundColor: colors[index] || brownShades[index % brownShades.length]
                      }}
                    >
                      <span style={{ color: 'white', fontWeight: 600, fontSize: '14px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>{stage}</span>
                      <span style={{ color: 'white', fontWeight: 700, fontSize: '16px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>{values[index]} deals</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
            {stages.map((stage, index) => (
              <div key={stage} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #7d5a36'
              }}>
                <span style={{ fontWeight: 600, color: '#5e3f26', fontSize: '14px' }}>{stage}:</span>
                <span style={{ fontWeight: 600, color: '#7d5a36', fontSize: '14px' }}>{values[index]} active deals</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '420px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <h3 style={{
            margin: '0 0 10px 0',
            color: '#5e3f26',
            fontSize: '16px',
            fontWeight: 600,
            paddingBottom: '10px',
            borderBottom: '1px solid #ede4d8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            lineHeight: 1.3,
            minHeight: '40px',
            flex: 1
          }}>{title}</h3>
          <button style={{
            background: 'none',
            border: 'none',
            color: '#7d5a36',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '4px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} onClick={handleEyeClick} title="View breakdown">
            <FiEye />
          </button>
        </div>
        <div style={{ flexGrow: 1, minHeight: '240px', position: 'relative', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {stages.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', height: '100%', justifyContent: 'center', width: '100%' }}>
              {stages.map((stage, index) => {
                const width = (values[index] / maxValue) * 80 + 20;
                return (
                  <div key={stage} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div 
                      style={{
                        width: `${width}%`,
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 15px',
                        borderRadius: '4px',
                        backgroundColor: colors[index] || brownShades[index % brownShades.length]
                      }}
                    >
                      <span style={{ color: 'white', fontWeight: 600, fontSize: '12px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>{stage}</span>
                      <span style={{ color: 'white', fontWeight: 700, fontSize: '14px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>{values[index]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#7d5a50',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              No active pipeline data
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ width: '100%' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '16px'
        }}>
          <Loader size={48} style={{ color: "#a67c52", animation: "spin 1s linear infinite" }} />
          <p style={{ color: '#7d5a50', fontSize: '16px' }}>Loading pipeline data...</p>
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
          description="Shows how long deals have been stuck in their current pipeline stage"
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
          colors={[brownShades[0], brownShades[1], brownShades[2], brownShades[3], brownShades[4]]}
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
          description="Estimated capital needed for active deals over the next 12 months"
        />
      )
    });
  }

  // Add Active Opportunities table if selected
  if (selectedCharts.activeOpportunities) {
    selectedChartComponents.push({
      id: 'activeOpportunities',
      component: (
        <div key="activeOpportunities" style={{
          background: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          height: '450px',
          gridColumn: '1 / -1',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <h3 style={{
              margin: '0 0 10px 0',
              color: '#5e3f26',
              fontSize: '16px',
              fontWeight: 600,
              paddingBottom: '10px',
              borderBottom: '1px solid #ede4d8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              lineHeight: 1.3,
              minHeight: '40px',
              flex: 1
            }}>Active Pipeline Opportunities</h3>
            <button 
              style={{
                background: 'none',
                border: 'none',
                color: '#7d5a36',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '4px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => openPopup(
                <div style={{ width: '100%' }}>
                  <h3 style={{
                    margin: '0 0 20px 0',
                    color: '#5e3f26',
                    fontSize: '24px',
                    textAlign: 'center',
                    borderBottom: '2px solid #ede4d8',
                    paddingBottom: '15px'
                  }}>Active Pipeline Opportunities</h3>
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '20px',
                    textAlign: 'center',
                    lineHeight: '1.5',
                    fontStyle: 'italic',
                    background: '#f8f9fa',
                    padding: '12px 15px',
                    borderRadius: '6px',
                    borderLeft: '3px solid #7d5a36'
                  }}>
                    Your current active deals that haven't reached completion
                  </div>
                  <div style={{ overflowX: 'auto', marginTop: '15px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr>
                          <th style={{ backgroundColor: '#f5f5f5', color: '#5e3f26', fontWeight: 600, padding: '12px', textAlign: 'left', borderBottom: '2px solid #ede4d8' }}>SME</th>
                          <th style={{ backgroundColor: '#f5f5f5', color: '#5e3f26', fontWeight: 600, padding: '12px', textAlign: 'left', borderBottom: '2px solid #ede4d8' }}>Current Stage</th>
                          <th style={{ backgroundColor: '#f5f5f5', color: '#5e3f26', fontWeight: 600, padding: '12px', textAlign: 'left', borderBottom: '2px solid #ede4d8' }}>Investment Ask</th>
                          <th style={{ backgroundColor: '#f5f5f5', color: '#5e3f26', fontWeight: 600, padding: '12px', textAlign: 'left', borderBottom: '2px solid #ede4d8' }}>Deal Score</th>
                          <th style={{ backgroundColor: '#f5f5f5', color: '#5e3f26', fontWeight: 600, padding: '12px', textAlign: 'left', borderBottom: '2px solid #ede4d8' }}>Time in Stage</th>
                          <th style={{ backgroundColor: '#f5f5f5', color: '#5e3f26', fontWeight: 600, padding: '12px', textAlign: 'left', borderBottom: '2px solid #ede4d8' }}>Sector</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pipelineData.coInvestOpportunities.map((opp, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>{opp.smeName}</td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>{opp.stage}</td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>{opp.ask}</td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>{opp.score}</td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>{opp.daysInStage}</td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>{opp.sector}</td>
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
          <div style={{ overflowX: 'auto', marginTop: '10px', height: '300px' }}>
            {pipelineData.coInvestOpportunities.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th style={{ backgroundColor: '#f5f5f5', color: '#5e3f26', fontWeight: 600, padding: '12px', textAlign: 'left', borderBottom: '2px solid #ede4d8' }}>SME</th>
                    <th style={{ backgroundColor: '#f5f5f5', color: '#5e3f26', fontWeight: 600, padding: '12px', textAlign: 'left', borderBottom: '2px solid #ede4d8' }}>Current Stage</th>
                    <th style={{ backgroundColor: '#f5f5f5', color: '#5e3f26', fontWeight: 600, padding: '12px', textAlign: 'left', borderBottom: '2px solid #ede4d8' }}>Investment Ask</th>
                    <th style={{ backgroundColor: '#f5f5f5', color: '#5e3f26', fontWeight: 600, padding: '12px', textAlign: 'left', borderBottom: '2px solid #ede4d8' }}>Deal Score</th>
                    <th style={{ backgroundColor: '#f5f5f5', color: '#5e3f26', fontWeight: 600, padding: '12px', textAlign: 'left', borderBottom: '2px solid #ede4d8' }}>Time in Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelineData.coInvestOpportunities.map((opp, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px' }}>{opp.smeName}</td>
                      <td style={{ padding: '12px' }}>{opp.stage}</td>
                      <td style={{ padding: '12px' }}>{opp.ask}</td>
                      <td style={{ padding: '12px' }}>{opp.score}</td>
                      <td style={{ padding: '12px' }}>{opp.daysInStage}</td>
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
                fontSize: '14px',
                textAlign: 'center',
                padding: '20px'
              }}>
                No active pipeline opportunities found. All deals are either completed or declined.
              </div>
            )}
          </div>
        </div>
      )
    });
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Chart Selection Controls */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <button 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: showChartSelector ? '#7d5a36' : '#f5f5f5',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: showChartSelector ? 'white' : '#666',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 10px' }}>
        {selectedChartComponents.filter(chart => chart.id !== 'activeOpportunities').length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {selectedChartComponents.filter(chart => chart.id !== 'activeOpportunities').map(chart => chart.component)}
          </div>
        )}
        
        {selectedChartComponents.filter(chart => chart.id === 'activeOpportunities').length > 0 && (
          <div>
            {selectedChartComponents.filter(chart => chart.id === 'activeOpportunities').map(chart => chart.component)}
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