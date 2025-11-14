// tabs/PortfolioOverview.js
import React, { useState, useEffect } from 'react';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import { FiEye, FiArrowUp, FiArrowDown, FiEdit } from 'react-icons/fi';
import { db, auth } from '../../firebaseConfig'; 
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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

// Styles for PortfolioOverview
const styles = `
.portfolio-overview {
  width: 100%;
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

.edit-icon-btn {
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
  margin-left: 8px;
}

.edit-icon-btn:hover {
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

.chart-area-ultra-compact {
  flex-grow: 1;
  min-height: 280px;
  position: relative;
  margin-bottom: 5px;
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

.chart-summary-ultra-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  background: #f8f9fa;
  padding: 12px 15px;
  border-radius: 6px;
  margin-bottom: 0;
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

/* BIG Score Circular Design */
.big-score-circular {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 15px;
}

.circular-progress {
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circular-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.big-score-value-circular {
  font-size: 32px;
  font-weight: 700;
  color: #5e3f26;
  line-height: 1;
  margin-bottom: 4px;
}

.big-score-label-circular {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.circular-target {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #7d5a36;
  font-weight: 500;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 6px;
}

/* Funding Ready Circular Styles */
.funding-ready-circular {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 15px;
}

.funding-ready-value-circular {
  font-size: 32px;
  font-weight: 700;
  color: #5e3f26;
  line-height: 1;
  margin-bottom: 4px;
}

.funding-ready-label-circular {
  font-size: 14px;
  color: #666;
  font-weight: 500;
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

.detail-value.positive {
  color: #4CAF50;
}

/* BIG Score Popup Styles */
.big-score-popup {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.big-score-main-popup {
  text-align: center;
  padding: 25px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 3px solid #7d5a36;
}

.big-score-value {
  font-size: 48px;
  font-weight: 700;
  color: #5e3f26;
  margin-bottom: 10px;
}

.big-score-label {
  font-size: 18px;
  color: #666;
  font-weight: 500;
  margin-bottom: 8px;
}

.big-score-target {
  font-size: 14px;
  color: #7d5a36;
  font-weight: 500;
}

/* Funding Ready Popup Styles */
.funding-ready-popup {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.readiness-main-popup {
  text-align: center;
  padding: 25px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 3px solid #7d5a36;
}

.readiness-value {
  font-size: 48px;
  font-weight: 700;
  color: #5e3f26;
  margin-bottom: 10px;
}

.readiness-label {
  font-size: 18px;
  color: #666;
  font-weight: 500;
  margin-bottom: 8px;
}

.readiness-target {
  font-size: 14px;
  color: #7d5a36;
  font-weight: 500;
}

/* Time to Fund Legend Styles */
.time-to-fund-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 3px;
  border-radius: 2px;
}

.legend-color.days-to-fund {
  background-color: #5e3f26;
}

.legend-color.target-line {
  background-color: #4CAF50;
}

/* Data Input Form Styles */
.data-input-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  color: #5e3f26;
  font-size: 14px;
}

.form-input {
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #7d5a36;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #7d5a36;
  color: white;
}

.btn-primary:hover {
  background-color: #5e3f26;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #666;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
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
  .chart-container {
    height: 380px;
  }
}

@media (max-width: 768px) {
  .top-row,
  .bottom-row {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 350px;
    padding: 15px;
  }
  
  .chart-summary-compact,
  .chart-summary-ultra-compact {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .chart-summary-compact .current-value,
  .chart-summary-compact .target-value,
  .chart-summary-ultra-compact .current-value,
  .chart-summary-ultra-compact .target-value {
    justify-content: center;
    text-align: center;
  }
  
  .big-score-value-circular {
    font-size: 28px;
  }
  
  .big-score-value-simple,
  .readiness-value-simple {
    font-size: 36px;
  }
  
  .time-to-fund-legend {
    gap: 10px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .chart-container {
    padding: 15px;
    height: 320px;
  }
  
  .time-view-controls,
  .charts-grid-4x4 {
    padding: 0 5px;
  }
  
  .big-score-value-circular {
    font-size: 24px;
  }
  
  .big-score-label-circular {
    font-size: 12px;
  }
  
  .big-score-value-simple,
  .readiness-value-simple {
    font-size: 32px;
  }
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

// Static chart options
const staticBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        drawBorder: false
      }
    }
  }
};

const staticLineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  elements: {
    line: {
      tension: 0
    },
    point: {
      radius: 3,
      hoverRadius: 5
    }
  },
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        drawBorder: false
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
      position: 'bottom'
    }
  }
};

// CORRECTED: Function to get financial year start month - FIXED PATH
const getFinancialYearStartMonth = async (userId) => {
  try {
    console.log('🔍 Fetching financial year start for user:', userId);
    
    // CORRECTED: Look in MyuniversalProfiles collection instead of universalProfiles
    const myUniversalProfileRef = doc(db, "MyuniversalProfiles", userId);
    const myUniversalProfileSnap = await getDoc(myUniversalProfileRef);
    
    if (myUniversalProfileSnap.exists()) {
      const profileData = myUniversalProfileSnap.data();
      console.log('📋 Full MyuniversalProfiles data:', profileData);
      
      // CORRECTED PATH: MyuniversalProfiles > formData > fundManageOverview > financialYearStart
      const financialYearStart = profileData.formData?.fundManageOverview?.financialYearStart;
      
      console.log('📅 Financial year start found in MyuniversalProfiles:', financialYearStart);
      
      if (financialYearStart) {
        // Convert month name to month number (0-11)
        const monthNames = [
          'january', 'february', 'march', 'april', 'may', 'june',
          'july', 'august', 'september', 'october', 'november', 'december'
        ];
        
        // Clean the month name (remove any extra spaces, convert to lowercase)
        const cleanedMonth = financialYearStart.trim().toLowerCase();
        const monthIndex = monthNames.findIndex(month => 
          month === cleanedMonth
        );
        
        if (monthIndex !== -1) {
          console.log(`✅ Financial year starts in month: ${monthIndex + 1} (${financialYearStart})`);
          return monthIndex; // Return 0-11
        } else {
          console.log('❌ Month name not recognized:', financialYearStart);
          console.log('Available month names:', monthNames);
        }
      } else {
        console.log('❌ No financialYearStart found in formData.fundManageOverview');
        console.log('Available formData:', profileData.formData);
        
        // Try alternative paths
        const altFinancialYearStart = profileData.fundManageOverview?.financialYearStart;
        if (altFinancialYearStart) {
          console.log('🔄 Found financialYearStart in alternative path:', altFinancialYearStart);
          const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];
          const cleanedMonth = altFinancialYearStart.trim().toLowerCase();
          const monthIndex = monthNames.findIndex(month => month === cleanedMonth);
          if (monthIndex !== -1) {
            console.log(`✅ Financial year starts in month: ${monthIndex + 1} (${altFinancialYearStart})`);
            return monthIndex;
          }
        }
      }
    } else {
      console.log('❌ MyuniversalProfiles document does not exist for user:', userId);
    }
    
    console.log('⚠️ Using default financial year start: July (month 6)');
    return 6; // Default to July if not found
  } catch (error) {
    console.error('❌ Error fetching financial year start:', error);
    return 6; // Default to July on error
  }
};

// Function to calculate quarter based on financial year start
const getQuarterFromDate = (date, financialYearStartMonth) => {
  const month = date.getMonth(); // 0-11
  
  // Calculate the adjusted month relative to financial year start
  // If financial year starts in July (month 6), then:
  // July (6) = Q1, August (7) = Q1, September (8) = Q1, October (9) = Q2, etc.
  const adjustedMonth = (month - financialYearStartMonth + 12) % 12;
  
  console.log(`📅 Quarter calculation: Month ${month + 1}, Financial Start: ${financialYearStartMonth + 1}, Adjusted Month: ${adjustedMonth}`);
  
  if (adjustedMonth >= 0 && adjustedMonth <= 2) {
    console.log(`✅ Quarter 1: Months ${financialYearStartMonth + 1}-${(financialYearStartMonth + 3) % 12 || 12}`);
    return 0; // Q1
  }
  if (adjustedMonth >= 3 && adjustedMonth <= 5) {
    console.log(`✅ Quarter 2: Months ${(financialYearStartMonth + 3) % 12 + 1}-${(financialYearStartMonth + 6) % 12 || 12}`);
    return 1; // Q2
  }
  if (adjustedMonth >= 6 && adjustedMonth <= 8) {
    console.log(`✅ Quarter 3: Months ${(financialYearStartMonth + 6) % 12 + 1}-${(financialYearStartMonth + 9) % 12 || 12}`);
    return 2; // Q3
  }
  console.log(`✅ Quarter 4: Months ${(financialYearStartMonth + 9) % 12 + 1}-${(financialYearStartMonth) % 12 || 12}`);
  return 3; // Q4
};

// Function to parse amount string like "R800,000" to number
const parseAmountToNumber = (amountString) => {
  if (!amountString) return 0;
  
  try {
    // Remove "R", commas, and any whitespace, then parse to number
    const numericString = amountString.replace(/[R,\s]/g, '');
    return parseFloat(numericString) || 0;
  } catch (error) {
    console.error('❌ Error parsing amount:', amountString, error);
    return 0;
  }
};

// Backend Data Fetching Functions
const fetchInvestorSuccessfulDeals = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log("❌ No authenticated user");
      return {
        smeIds: [],
        applications: [],
        totalInvestment: 0
      };
    }

    console.log('🔍 STEP 1: Fetching successful deals for investor:', currentUser.uid);
    
    // STEP 1: Get all investorApplications where pipelineStage is "Deal Complete" AND funderId matches current user
    const q = query(
      collection(db, "investorApplications"),
      where("pipelineStage", "==", "Deal Complete"),
      where("funderId", "==", currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    console.log('📊 STEP 1: Found successful deals (Deal Complete):', querySnapshot.docs.length);
    
    if (querySnapshot.empty) {
      console.log('❌ STEP 1: No successful deals found');
      return {
        smeIds: [],
        applications: [],
        totalInvestment: 0
      };
    }
    
    // Extract SME IDs and investment data from successful applications
    const smeIds = [];
    const applications = [];
    let totalInvestment = 0;
    const smeDetails = []; // Store SME details for debugging
    
    querySnapshot.docs.forEach(doc => {
      const applicationData = doc.data();
      console.log('📄 Successful deal data:', {
        smeId: applicationData.smeId,
        investmentAmount: applicationData.fundingDetails?.amountApproved,
        pipelineStage: applicationData.pipelineStage,
        funderId: applicationData.funderId,
        approvedAt: applicationData.fundingDetails?.approvedAt
      });
      
      // Use the SME ID from the application
      const smeId = applicationData.smeId;
      if (smeId) {
        smeIds.push(smeId);
        applications.push(applicationData);
        
        // Parse amount from string like "R800,000" to number
        const investmentAmount = parseAmountToNumber(applicationData.fundingDetails?.amountApproved);
        totalInvestment += investmentAmount;
        
        // Store SME details for debugging
        smeDetails.push({
          smeId: smeId,
          amount: investmentAmount,
          approvedAt: applicationData.fundingDetails?.approvedAt
        });
      }
    });
    
    const uniqueSmeIds = [...new Set(smeIds)]; // Remove duplicates
    
    console.log('🏢 STEP 1: Unique SME IDs from successful deals:', uniqueSmeIds);
    console.log('💰 STEP 1: Total investment from successful deals:', totalInvestment);
    console.log('📄 STEP 1: Number of successful applications:', applications.length);
    console.log('🔍 STEP 1: SME Details:', smeDetails);
    
    return {
      smeIds: uniqueSmeIds,
      applications: applications,
      totalInvestment: totalInvestment,
      smeDetails: smeDetails
    };
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch investor successful deals:', error);
    return {
      smeIds: [],
      applications: [],
      totalInvestment: 0,
      smeDetails: []
    };
  }
};

const fetchActiveSMEsData = async () => {
  try {
    const successfulDeals = await fetchInvestorSuccessfulDeals();
    const { smeIds, applications } = successfulDeals;
    
    console.log('🔍 STEP 2: Processing SMEs from successful deals. Total SMEs:', smeIds.length);
    
    if (smeIds.length === 0) {
      console.log('❌ STEP 2: No SMEs found in successful deals');
      return {
        'Micro': 0,
        'Small': 0,
        'Medium': 0,
        'Large': 0
      };
    }
    
    // Count SMEs by entity size
    const entitySizeCount = {
      'Micro': 0,
      'Small': 0,
      'Medium': 0,
      'Large': 0
    };
    
    // STEP 3: Fetch universal profiles for each SME from successful deals
    for (const smeId of smeIds) {
      try {
        console.log('🔍 STEP 3: Fetching profile for SME from successful deal:', smeId);
        const universalProfileRef = doc(db, "universalProfiles", smeId);
        const universalProfileSnap = await getDoc(universalProfileRef);
        
        if (universalProfileSnap.exists()) {
          const profileData = universalProfileSnap.data();
          console.log('📋 STEP 3: Profile data for successful deal SME', smeId, ':', {
            entityOverview: profileData.entityOverview,
            entitySize: profileData.entityOverview?.entitySize,
            companyName: profileData.entityOverview?.tradingName || profileData.entityOverview?.registeredName
          });
          
          // STEP 4: Get entitySize from entityOverview
          const entitySize = profileData.entityOverview?.entitySize;
          console.log('🏷️ STEP 4: Entity size found for successful deal:', entitySize);
          
          if (entitySize && entitySizeCount.hasOwnProperty(entitySize)) {
            entitySizeCount[entitySize]++;
            console.log(`✅ STEP 4: Counted ${entitySize} from successful deal: ${entitySizeCount[entitySize]}`);
          } else {
            console.log('❌ STEP 4: Invalid entity size for successful deal SME:', entitySize);
            entitySizeCount['Small']++;
          }
        } else {
          console.log('❌ STEP 3: Profile does not exist for successful deal SME:', smeId);
        }
      } catch (error) {
        console.error(`❌ STEP 3-4: Error processing successful deal SME ${smeId}:`, error);
      }
    }
    
    console.log('📈 FINAL: Entity size counts from successful deals:', entitySizeCount);
    console.log('📊 FINAL: Total successful SMEs processed:', smeIds.length);
    return entitySizeCount;
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch active SMEs data from successful deals:', error);
    return {
      'Micro': 0,
      'Small': 0,
      'Medium': 0,
      'Large': 0
    };
  }
};

// BIG Score calculation - whole numbers with % sign
const fetchAverageBIGScore = async () => {
  try {
    const successfulDeals = await fetchInvestorSuccessfulDeals();
    const { smeIds } = successfulDeals;
    
    console.log('🔍 STEP 1: Fetching BIG scores from successful deals. Total SMEs:', smeIds.length);
    
    if (smeIds.length === 0) {
      console.log('❌ STEP 1: No SMEs found in successful deals for BIG score calculation');
      return {
        averageScore: 0,
        individualScores: [],
        totalSMEs: 0
      };
    }
    
    let totalScore = 0;
    let count = 0;
    const individualScores = [];
    
    // STEP 2: Fetch BIG scores for each SME from successful deals
    for (const smeId of smeIds) {
      try {
        const universalProfileRef = doc(db, "universalProfiles", smeId);
        const universalProfileSnap = await getDoc(universalProfileRef);
        
        if (universalProfileSnap.exists()) {
          const profileData = universalProfileSnap.data();
          const bigScore = profileData.bigScore;
          
          console.log(`📊 STEP 2: BIG Score for successful deal SME ${smeId}:`, bigScore);
          
          if (typeof bigScore === 'number' && !isNaN(bigScore)) {
            totalScore += bigScore;
            count++;
            individualScores.push({
              smeId: smeId,
              score: bigScore,
              companyName: profileData.entityOverview?.tradingName || profileData.entityOverview?.registeredName || 'Unknown'
            });
            console.log(`✅ STEP 2: Valid BIG score added from successful deal: ${bigScore}`);
          } else {
            console.log('❌ STEP 2: Invalid BIG score for successful deal SME:', smeId, bigScore);
            // Use default score for invalid scores
            const defaultScore = 70;
            totalScore += defaultScore;
            count++;
            individualScores.push({
              smeId: smeId,
              score: defaultScore,
              companyName: profileData.entityOverview?.tradingName || profileData.entityOverview?.registeredName || 'Unknown',
              note: 'Used default score (70)'
            });
          }
        } else {
          console.log('❌ STEP 2: Profile does not exist for successful deal SME:', smeId);
        }
      } catch (error) {
        console.error(`❌ STEP 2: Error fetching BIG score for successful deal SME ${smeId}:`, error);
      }
    }
    
    const averageScore = count > 0 ? Math.round(totalScore / count) : 0;
    console.log('📈 FINAL: Average BIG Score from successful deals:', averageScore + '%', 'from', count, 'SMEs');
    console.log('🔍 FINAL: Individual BIG Scores:', individualScores);
    
    return {
      averageScore: averageScore,
      individualScores: individualScores,
      totalSMEs: count
    };
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch average BIG score from successful deals:', error);
    return {
      averageScore: 0,
      individualScores: [],
      totalSMEs: 0
    };
  }
};

// Funding Ready Percentage - count SMEs with BIG Score >= 80%
const fetchFundingReadyPercentage = async () => {
  try {
    const successfulDeals = await fetchInvestorSuccessfulDeals();
    const { smeIds } = successfulDeals;
    
    console.log('🔍 STEP 1: Calculating funding ready percentage from successful deals. Total SMEs:', smeIds.length);
    
    if (smeIds.length === 0) {
      console.log('❌ STEP 1: No SMEs found in successful deals for funding ready calculation');
      return {
        fundingReadyPercentage: 0,
        fundingReadyCount: 0,
        totalCount: 0,
        fundingReadySMEs: []
      };
    }
    
    let fundingReadyCount = 0;
    let totalCount = 0;
    const fundingReadySMEs = [];
    const notFundingReadySMEs = [];
    
    // STEP 2: Check BIG scores for each SME from successful deals
    for (const smeId of smeIds) {
      try {
        const universalProfileRef = doc(db, "universalProfiles", smeId);
        const universalProfileSnap = await getDoc(universalProfileRef);
        
        if (universalProfileSnap.exists()) {
          const profileData = universalProfileSnap.data();
          const bigScore = profileData.bigScore;
          const companyName = profileData.entityOverview?.tradingName || profileData.entityOverview?.registeredName || 'Unknown';
          
          console.log(`📊 STEP 2: BIG Score for funding ready check SME ${smeId}:`, bigScore);
          
          if (typeof bigScore === 'number' && !isNaN(bigScore)) {
            totalCount++;
            // Consider SMEs with BIG Score >= 80 as "Funding Ready"
            if (bigScore >= 80) {
              fundingReadyCount++;
              fundingReadySMEs.push({
                smeId: smeId,
                companyName: companyName,
                score: bigScore
              });
              console.log(`✅ STEP 2: SME ${smeId} is funding ready with score: ${bigScore}%`);
            } else {
              notFundingReadySMEs.push({
                smeId: smeId,
                companyName: companyName,
                score: bigScore
              });
              console.log(`❌ STEP 2: SME ${smeId} is NOT funding ready with score: ${bigScore}%`);
            }
          } else {
            console.log('❌ STEP 2: Invalid BIG score for funding ready check SME:', smeId, bigScore);
            totalCount++;
            // Default to not funding ready if score is invalid
            notFundingReadySMEs.push({
              smeId: smeId,
              companyName: companyName,
              score: bigScore,
              note: 'Invalid score'
            });
          }
        } else {
          console.log('❌ STEP 2: Profile does not exist for funding ready check SME:', smeId);
        }
      } catch (error) {
        console.error(`❌ STEP 2: Error checking funding ready status for SME ${smeId}:`, error);
      }
    }
    
    const fundingReadyPercentage = totalCount > 0 ? Math.round((fundingReadyCount / totalCount) * 100) : 0;
    
    console.log('📈 FINAL: Funding Ready Percentage from successful deals:', {
      fundingReadyPercentage: fundingReadyPercentage + '%',
      fundingReadyCount,
      totalCount,
      calculation: `${fundingReadyCount} out of ${totalCount} SMEs are funding ready (BIG Score >= 80%)`
    });
    console.log('✅ Funding Ready SMEs:', fundingReadySMEs);
    console.log('❌ Not Funding Ready SMEs:', notFundingReadySMEs);
    
    return {
      fundingReadyPercentage: fundingReadyPercentage,
      fundingReadyCount: fundingReadyCount,
      totalCount: totalCount,
      fundingReadySMEs: fundingReadySMEs,
      notFundingReadySMEs: notFundingReadySMEs
    };
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch funding ready percentage from successful deals:', error);
    return {
      fundingReadyPercentage: 0,
      fundingReadyCount: 0,
      totalCount: 0,
      fundingReadySMEs: [],
      notFundingReadySMEs: []
    };
  }
};

// Portfolio Value Calculation with Financial Year Quarters - FIXED YEARLY DATA
const fetchPortfolioValueData = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('❌ No user logged in');
      return {
        currentValue: 0,
        quarterlyData: [0, 0, 0, 0],
        monthlyData: [0, 0, 0, 0, 0, 0],
        yearlyData: [0], // Only current year
        totalDeals: 0,
        totalInvestment: 0,
        financialYearStartMonth: 6 // Default to July
      };
    }

    // Get financial year start month - FIXED
    const financialYearStartMonth = await getFinancialYearStartMonth(currentUser.uid);
    console.log(`📅 Using financial year starting in month: ${financialYearStartMonth + 1}`);
    
    const successfulDeals = await fetchInvestorSuccessfulDeals();
    const { applications } = successfulDeals;
    
    console.log('💰 STEP 1: Calculating portfolio value from successful deals with FINANCIAL YEAR allocation');
    console.log('📊 STEP 1: Number of successful applications:', applications.length);
    
    if (applications.length === 0) {
      console.log('❌ STEP 1: No successful deals found for portfolio value calculation');
      return {
        currentValue: 0,
        quarterlyData: [0, 0, 0, 0],
        monthlyData: [0, 0, 0, 0, 0, 0],
        yearlyData: [0], // Only current year
        totalDeals: 0,
        totalInvestment: 0,
        financialYearStartMonth
      };
    }
    
    // Initialize data arrays
    const quarterlyData = [0, 0, 0, 0];
    const monthlyData = [0, 0, 0, 0, 0, 0]; // First 6 months of financial year
    let totalInvestment = 0;
    const quarterlyBreakdown = [[], [], [], []]; // Store individual investments per quarter
    const monthlyBreakdown = [[], [], [], [], [], []]; // Store individual investments per month
    
    // Track investments by calendar year
    const investmentsByYear = {};
    
    // STEP 2: Process each application and allocate to correct financial year quarter and month
    for (const application of applications) {
      try {
        // Parse amount from string like "R800,000" to number
        const investmentAmount = parseAmountToNumber(application.fundingDetails?.amountApproved);
        totalInvestment += investmentAmount;
        
        // Get approval date from fundingDetails.approvedAt
        const approvedAt = application.fundingDetails?.approvedAt;
        
        if (approvedAt) {
          try {
            const approvalDate = new Date(approvedAt);
            
            if (!isNaN(approvalDate.getTime())) {
              const approvalYear = approvalDate.getFullYear();
              
              // Track investment by calendar year
              if (!investmentsByYear[approvalYear]) {
                investmentsByYear[approvalYear] = 0;
              }
              investmentsByYear[approvalYear] += investmentAmount;
              
              // Calculate quarter based on FINANCIAL YEAR start month
              const quarter = getQuarterFromDate(approvalDate, financialYearStartMonth);
              
              // Calculate month in financial year (0-11)
              const approvalMonth = approvalDate.getMonth();
              const financialYearMonth = (approvalMonth - financialYearStartMonth + 12) % 12;
              
              console.log(`📅 STEP 2: Processing application approved at:`, approvedAt, {
                approvalYear,
                approvalMonth: approvalMonth + 1,
                financialYearStartMonth: financialYearStartMonth + 1,
                financialYearMonth: financialYearMonth + 1,
                quarter: quarter + 1,
                investmentAmount
              });
              
              // Add investment to the correct quarter
              quarterlyData[quarter] += investmentAmount;
              quarterlyBreakdown[quarter].push({
                amount: investmentAmount,
                date: approvedAt,
                smeId: application.smeId,
                year: approvalYear
              });
              
              // Add investment to the correct month (first 6 months only for display)
              if (financialYearMonth < 6) {
                monthlyData[financialYearMonth] += investmentAmount;
                monthlyBreakdown[financialYearMonth].push({
                  amount: investmentAmount,
                  date: approvedAt,
                  smeId: application.smeId,
                  year: approvalYear
                });
              }
              
              console.log(`✅ STEP 2: Allocated R${investmentAmount} to Financial Year Q${quarter + 1}, Month ${financialYearMonth + 1}, Year ${approvalYear}`);
              
            } else {
              console.log('❌ STEP 2: Invalid approval date:', approvedAt);
              // If date is invalid, distribute evenly
              const equalAmount = investmentAmount / 4;
              quarterlyData.forEach((_, index) => {
                quarterlyData[index] += equalAmount;
                quarterlyBreakdown[index].push({
                  amount: equalAmount,
                  date: approvedAt,
                  smeId: application.smeId,
                  note: 'Distributed evenly - invalid date'
                });
              });
              
              // Distribute evenly across months
              const monthlyEqualAmount = investmentAmount / 6;
              monthlyData.forEach((_, index) => {
                monthlyData[index] += monthlyEqualAmount;
                monthlyBreakdown[index].push({
                  amount: monthlyEqualAmount,
                  date: approvedAt,
                  smeId: application.smeId,
                  note: 'Distributed evenly - invalid date'
                });
              });
            }
          } catch (dateError) {
            console.error('❌ STEP 2: Error parsing approval date:', approvedAt, dateError);
            // If date parsing fails, distribute evenly across quarters and months
            const equalAmount = investmentAmount / 4;
            quarterlyData.forEach((_, index) => {
              quarterlyData[index] += equalAmount;
              quarterlyBreakdown[index].push({
                amount: equalAmount,
                date: approvedAt,
                smeId: application.smeId,
                note: 'Distributed evenly - date parsing error'
              });
            });
            
            const monthlyEqualAmount = investmentAmount / 6;
            monthlyData.forEach((_, index) => {
              monthlyData[index] += monthlyEqualAmount;
              monthlyBreakdown[index].push({
                amount: monthlyEqualAmount,
                date: approvedAt,
                smeId: application.smeId,
                note: 'Distributed evenly - date parsing error'
              });
            });
          }
        } else {
          console.log('❌ STEP 2: No approvedAt date found for application, distributing evenly');
          // If no approval date, distribute evenly across quarters and months
          const equalAmount = investmentAmount / 4;
          quarterlyData.forEach((_, index) => {
            quarterlyData[index] += equalAmount;
            quarterlyBreakdown[index].push({
              amount: equalAmount,
              smeId: application.smeId,
              note: 'Distributed evenly - no approval date'
            });
          });
          
          const monthlyEqualAmount = investmentAmount / 6;
          monthlyData.forEach((_, index) => {
            monthlyData[index] += monthlyEqualAmount;
            monthlyBreakdown[index].push({
              amount: monthlyEqualAmount,
              smeId: application.smeId,
              note: 'Distributed evenly - no approval date'
            });
          });
        }
      } catch (error) {
        console.error('❌ STEP 2: Error processing application:', error);
      }
    }
    
    // Calculate yearly data - ONLY include years where we actually have investments
    const currentYear = new Date().getFullYear();
    const yearlyData = [];
    const yearlyLabels = [];
    
    // Get all years with investments, sorted
    const investmentYears = Object.keys(investmentsByYear)
      .map(year => parseInt(year))
      .sort((a, b) => a - b);
    
    console.log('📊 Investment years found:', investmentYears);
    
    if (investmentYears.length > 0) {
      // Only show current year if we have investments in current year
      if (investmentYears.includes(currentYear)) {
        yearlyData.push(investmentsByYear[currentYear]);
        yearlyLabels.push(`${currentYear}`);
      }
      
      // If we have previous years, show them too (but only if we have actual data)
      investmentYears.forEach(year => {
        if (year !== currentYear) {
          yearlyData.push(investmentsByYear[year]);
          yearlyLabels.push(`${year}`);
        }
      });
    } else {
      // Fallback: just show current year total
      yearlyData.push(totalInvestment);
      yearlyLabels.push(`${currentYear}`);
    }
    
    // Convert to R millions and ensure proper formatting
    const quarterlyDataInMillions = quarterlyData.map(amount => 
      parseFloat((amount / 1000000).toFixed(1))
    );
    
    const monthlyDataInMillions = monthlyData.map(amount => 
      parseFloat((amount / 1000000).toFixed(1))
    );
    
    const yearlyDataInMillions = yearlyData.map(amount => 
      parseFloat((amount / 1000000).toFixed(1))
    );
    
    const currentValue = parseFloat((totalInvestment / 1000000).toFixed(1));
    
    const result = {
      currentValue,
      quarterlyData: quarterlyDataInMillions,
      monthlyData: monthlyDataInMillions,
      yearlyData: yearlyDataInMillions,
      yearlyLabels: yearlyLabels,
      totalDeals: applications.length,
      totalInvestment: totalInvestment,
      financialYearStartMonth,
      quarterlyBreakdown: quarterlyBreakdown,
      monthlyBreakdown: monthlyBreakdown,
      investmentsByYear: investmentsByYear,
      investmentYears: investmentYears
    };
    
    console.log('📈 FINAL: Portfolio value with accurate yearly data:', result);
    return result;
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch portfolio value data from successful deals:', error);
    return {
      currentValue: 0,
      quarterlyData: [0, 0, 0, 0],
      monthlyData: [0, 0, 0, 0, 0, 0],
      yearlyData: [0],
      yearlyLabels: [`${new Date().getFullYear()}`],
      totalDeals: 0,
      totalInvestment: 0,
      financialYearStartMonth: 6,
      quarterlyBreakdown: [[], [], [], []],
      monthlyBreakdown: [[], [], [], [], [], []],
      investmentsByYear: {},
      investmentYears: []
    };
  }
};

// Time to Fund Calculation with Financial Year Quarters - FIXED YEARLY DATA
const fetchAverageTimeToFund = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('❌ No user logged in');
      return {
        averageDays: 0,
        timeToFundData: [0, 0, 0, 0],
        monthlyTimeToFundData: [0, 0, 0, 0, 0, 0],
        yearlyTimeToFundData: [0], // Only current year
        yearlyTimeToFundLabels: [`${new Date().getFullYear()}`],
        totalSMEs: 0,
        allProcessingTimes: [],
        financialYearStartMonth: 6,
        processingDetails: []
      };
    }

    // Get financial year start month - FIXED
    const financialYearStartMonth = await getFinancialYearStartMonth(currentUser.uid);
    console.log(`📅 Using financial year starting in month: ${financialYearStartMonth + 1}`);
    
    const successfulDeals = await fetchInvestorSuccessfulDeals();
    const { applications } = successfulDeals;
    
    console.log('🔍 STEP 1: Calculating average time to fund from successful deals. Total applications:', applications.length);
    
    if (applications.length === 0) {
      console.log('❌ STEP 1: No applications found for time to fund calculation');
      return {
        averageDays: 0,
        timeToFundData: [0, 0, 0, 0],
        monthlyTimeToFundData: [0, 0, 0, 0, 0, 0],
        yearlyTimeToFundData: [0],
        yearlyTimeToFundLabels: [`${new Date().getFullYear()}`],
        totalSMEs: 0,
        allProcessingTimes: [],
        financialYearStartMonth: 6,
        processingDetails: []
      };
    }
    
    const quarterlyProcessingTimes = [[], [], [], []]; // Arrays to store processing times per quarter
    const monthlyProcessingTimes = [[], [], [], [], [], []]; // Arrays for first 6 months
    const processingTimesByYear = {}; // Store processing times by calendar year
    const processingDetails = [[], [], [], []]; // Store detailed processing info per quarter
    const monthlyProcessingDetails = [[], [], [], [], [], []]; // Store detailed processing info per month
    let totalDays = 0;
    let count = 0;
    const allProcessingTimes = [];
    
    // STEP 2: Process each application to calculate processing time and allocate to FINANCIAL YEAR quarter, month, and year
    for (const application of applications) {
      try {
        // Get application date and approval date
        const applicationDateStr = application.applicationDate; // "2025-10-14"
        const approvalDateStr = application.fundingDetails?.approvedAt; // "2025-11-10T09:24:01.430Z"
        
        console.log(`📅 STEP 2: Processing dates for application:`, {
          applicationDate: applicationDateStr,
          approvalDate: approvalDateStr
        });
        
        if (applicationDateStr && approvalDateStr) {
          try {
            // Parse application date (format: "2025-10-14")
            const applicationDate = new Date(applicationDateStr);
            
            // Parse approval date (format: "2025-11-10T09:24:01.430Z")
            const approvalDate = new Date(approvalDateStr);
            
            console.log(`📅 STEP 2: Parsed dates:`, {
              applicationDate: applicationDate.toString(),
              approvalDate: approvalDate.toString()
            });
            
            if (!isNaN(applicationDate.getTime()) && !isNaN(approvalDate.getTime())) {
              // Calculate difference in days
              const timeDiff = approvalDate.getTime() - applicationDate.getTime();
              const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
              
              const approvalYear = approvalDate.getFullYear();
              
              console.log(`⏱️ STEP 2: Time to fund for application: ${daysDiff} days in year ${approvalYear}`);
              
              if (daysDiff > 0 && daysDiff < 365) { // Reasonable validation
                totalDays += daysDiff;
                count++;
                allProcessingTimes.push(daysDiff);
                
                // Track by calendar year
                if (!processingTimesByYear[approvalYear]) {
                  processingTimesByYear[approvalYear] = [];
                }
                processingTimesByYear[approvalYear].push(daysDiff);
                
                // Determine quarter and month based on FINANCIAL YEAR using approval date
                const quarter = getQuarterFromDate(approvalDate, financialYearStartMonth);
                const approvalMonth = approvalDate.getMonth();
                const financialYearMonth = (approvalMonth - financialYearStartMonth + 12) % 12;
                
                // Add to quarterly processing times
                quarterlyProcessingTimes[quarter].push(daysDiff);
                processingDetails[quarter].push({
                  smeId: application.smeId,
                  days: daysDiff,
                  applicationDate: applicationDateStr,
                  approvalDate: approvalDateStr,
                  applicationMonth: applicationDate.getMonth() + 1,
                  approvalMonth: approvalDate.getMonth() + 1,
                  financialYearQuarter: quarter + 1,
                  year: approvalYear
                });
                
                // Add to monthly processing times (first 6 months only)
                if (financialYearMonth < 6) {
                  monthlyProcessingTimes[financialYearMonth].push(daysDiff);
                  monthlyProcessingDetails[financialYearMonth].push({
                    smeId: application.smeId,
                    days: daysDiff,
                    applicationDate: applicationDateStr,
                    approvalDate: approvalDateStr,
                    financialYearMonth: financialYearMonth + 1,
                    year: approvalYear
                  });
                }
                
                console.log(`✅ STEP 2: Allocated ${daysDiff} days to Financial Year Q${quarter + 1}, Month ${financialYearMonth + 1}, Year ${approvalYear}`);
              } else {
                console.log('⚠️ STEP 2: Invalid day difference calculated:', daysDiff);
                // Use default and allocate to current quarter, month, and year
                const defaultDays = 45;
                totalDays += defaultDays;
                count++;
                allProcessingTimes.push(defaultDays);
                
                const currentDate = new Date();
                const currentYear = currentDate.getFullYear();
                
                if (!processingTimesByYear[currentYear]) {
                  processingTimesByYear[currentYear] = [];
                }
                processingTimesByYear[currentYear].push(defaultDays);
                
                // Allocate to most recent quarter and month
                const currentQuarter = getQuarterFromDate(currentDate, financialYearStartMonth);
                const currentMonth = (currentDate.getMonth() - financialYearStartMonth + 12) % 12;
                
                quarterlyProcessingTimes[currentQuarter].push(defaultDays);
                processingDetails[currentQuarter].push({
                  smeId: application.smeId,
                  days: defaultDays,
                  note: 'Used default - invalid day difference',
                  financialYearQuarter: currentQuarter + 1,
                  year: currentYear
                });
                
                if (currentMonth < 6) {
                  monthlyProcessingTimes[currentMonth].push(defaultDays);
                  monthlyProcessingDetails[currentMonth].push({
                    smeId: application.smeId,
                    days: defaultDays,
                    note: 'Used default - invalid day difference',
                    financialYearMonth: currentMonth + 1,
                    year: currentYear
                  });
                }
              }
            } else {
              console.log('❌ STEP 2: Invalid date parsing for application');
              // Use default and allocate to current quarter, month, and year
              const defaultDays = 45;
              totalDays += defaultDays;
              count++;
              allProcessingTimes.push(defaultDays);
              
              const currentDate = new Date();
              const currentYear = currentDate.getFullYear();
              
              if (!processingTimesByYear[currentYear]) {
                processingTimesByYear[currentYear] = [];
              }
              processingTimesByYear[currentYear].push(defaultDays);
              
              const currentQuarter = getQuarterFromDate(currentDate, financialYearStartMonth);
              const currentMonth = (currentDate.getMonth() - financialYearStartMonth + 12) % 12;
              
              quarterlyProcessingTimes[currentQuarter].push(defaultDays);
              processingDetails[currentQuarter].push({
                smeId: application.smeId,
                days: defaultDays,
                note: 'Used default - invalid date parsing',
                financialYearQuarter: currentQuarter + 1,
                year: currentYear
              });
              
              if (currentMonth < 6) {
                monthlyProcessingTimes[currentMonth].push(defaultDays);
                monthlyProcessingDetails[currentMonth].push({
                  smeId: application.smeId,
                  days: defaultDays,
                  note: 'Used default - invalid date parsing',
                  financialYearMonth: currentMonth + 1,
                  year: currentYear
                });
              }
            }
          } catch (dateError) {
            console.error(`❌ STEP 2: Date parsing error:`, dateError);
            // Use default and allocate to current quarter, month, and year
            const defaultDays = 45;
            totalDays += defaultDays;
            count++;
            allProcessingTimes.push(defaultDays);
            
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            
            if (!processingTimesByYear[currentYear]) {
              processingTimesByYear[currentYear] = [];
            }
            processingTimesByYear[currentYear].push(defaultDays);
            
            const currentQuarter = getQuarterFromDate(currentDate, financialYearStartMonth);
            const currentMonth = (currentDate.getMonth() - financialYearStartMonth + 12) % 12;
            
            quarterlyProcessingTimes[currentQuarter].push(defaultDays);
            processingDetails[currentQuarter].push({
              smeId: application.smeId,
              days: defaultDays,
              note: 'Used default - date parsing error',
              financialYearQuarter: currentQuarter + 1,
              year: currentYear
            });
            
            if (currentMonth < 6) {
              monthlyProcessingTimes[currentMonth].push(defaultDays);
              monthlyProcessingDetails[currentMonth].push({
                smeId: application.smeId,
                days: defaultDays,
                note: 'Used default - date parsing error',
                financialYearMonth: currentMonth + 1,
                year: currentYear
              });
            }
          }
        } else {
          console.log('❌ STEP 2: Missing dates for application');
          // Use default and allocate to current quarter, month, and year
          const defaultDays = 45;
          totalDays += defaultDays;
          count++;
          allProcessingTimes.push(defaultDays);
          
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          
          if (!processingTimesByYear[currentYear]) {
            processingTimesByYear[currentYear] = [];
          }
          processingTimesByYear[currentYear].push(defaultDays);
          
          const currentQuarter = getQuarterFromDate(currentDate, financialYearStartMonth);
          const currentMonth = (currentDate.getMonth() - financialYearStartMonth + 12) % 12;
          
          quarterlyProcessingTimes[currentQuarter].push(defaultDays);
          processingDetails[currentQuarter].push({
            smeId: application.smeId,
            days: defaultDays,
            note: 'Used default - missing dates',
            financialYearQuarter: currentQuarter + 1,
            year: currentYear
          });
          
          if (currentMonth < 6) {
            monthlyProcessingTimes[currentMonth].push(defaultDays);
            monthlyProcessingDetails[currentMonth].push({
              smeId: application.smeId,
              days: defaultDays,
              note: 'Used default - missing dates',
              financialYearMonth: currentMonth + 1,
              year: currentYear
            });
          }
        }
      } catch (error) {
        console.error(`❌ STEP 2: Error processing application:`, error);
      }
    }
    
    // Calculate average days per quarter
    const timeToFundData = quarterlyProcessingTimes.map(quarterTimes => {
      if (quarterTimes.length === 0) return 0;
      const quarterAvg = quarterTimes.reduce((sum, days) => sum + days, 0) / quarterTimes.length;
      return Math.round(quarterAvg);
    });
    
    // Calculate average days per month
    const monthlyTimeToFundData = monthlyProcessingTimes.map(monthTimes => {
      if (monthTimes.length === 0) return 0;
      const monthAvg = monthTimes.reduce((sum, days) => sum + days, 0) / monthTimes.length;
      return Math.round(monthAvg);
    });
    
    // Calculate yearly data - ONLY include years where we actually have processing times
    const currentYear = new Date().getFullYear();
    const yearlyTimeToFundData = [];
    const yearlyTimeToFundLabels = [];
    
    // Get all years with processing times, sorted
    const processingYears = Object.keys(processingTimesByYear)
      .map(year => parseInt(year))
      .sort((a, b) => a - b);
    
    console.log('📊 Processing years found:', processingYears);
    
    if (processingYears.length > 0) {
      processingYears.forEach(year => {
        const yearTimes = processingTimesByYear[year];
        if (yearTimes.length > 0) {
          const yearAvg = yearTimes.reduce((sum, days) => sum + days, 0) / yearTimes.length;
          yearlyTimeToFundData.push(Math.round(yearAvg));
          yearlyTimeToFundLabels.push(`${year}`);
        }
      });
    } else {
      // Fallback: just show current year average
      yearlyTimeToFundData.push(averageDays);
      yearlyTimeToFundLabels.push(`${currentYear}`);
    }
    
    const averageDays = count > 0 ? Math.round(totalDays / count) : 0;
    
    console.log('📈 FINAL: Average time to fund with accurate yearly data:', {
      averageDays,
      timeToFundData,
      monthlyTimeToFundData,
      yearlyTimeToFundData,
      yearlyTimeToFundLabels,
      totalSMEs: count,
      quarterlyCounts: quarterlyProcessingTimes.map(q => q.length),
      monthlyCounts: monthlyProcessingTimes.map(m => m.length),
      processingYears,
      financialYearStartMonth: financialYearStartMonth + 1,
      allProcessingTimes
    });
    
    return {
      averageDays,
      timeToFundData,
      monthlyTimeToFundData,
      yearlyTimeToFundData,
      yearlyTimeToFundLabels,
      totalSMEs: count,
      allProcessingTimes,
      financialYearStartMonth,
      processingDetails,
      monthlyProcessingDetails,
      processingTimesByYear,
      processingYears
    };
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch average time to fund from successful deals:', error);
    return {
      averageDays: 0,
      timeToFundData: [0, 0, 0, 0],
      monthlyTimeToFundData: [0, 0, 0, 0, 0, 0],
      yearlyTimeToFundData: [0],
      yearlyTimeToFundLabels: [`${new Date().getFullYear()}`],
      totalSMEs: 0,
      allProcessingTimes: [],
      financialYearStartMonth: 6,
      processingDetails: [],
      monthlyProcessingDetails: [[], [], [], [], [], []],
      processingTimesByYear: {},
      processingYears: []
    };
  }
};

// FALLBACK DATA for when investor has no successful deals - FIXED YEARLY DATA
const getFallbackDataBasedOnUser = () => {
  const currentUser = auth.currentUser;
  const userHash = currentUser?.uid ? currentUser.uid.charCodeAt(0) % 4 : 0;
  
  const currentYear = new Date().getFullYear();
  
  const fallbackOptions = [
    { 
      activeSMEs: { 'Micro': 6, 'Small': 12, 'Medium': 8, 'Large': 3 }, 
      averageBIGScore: { averageScore: 74, individualScores: [
        { smeId: 'sme1', companyName: 'Tech Startup A', score: 82 },
        { smeId: 'sme2', companyName: 'Manufacturing Co B', score: 76 },
        { smeId: 'sme3', companyName: 'Service Provider C', score: 68 }
      ], totalSMEs: 29 }, 
      fundingReadyPercentage: { fundingReadyPercentage: 65, fundingReadyCount: 19, totalCount: 29, fundingReadySMEs: [
        { smeId: 'sme1', companyName: 'Tech Startup A', score: 82 },
        { smeId: 'sme4', companyName: 'Innovation Labs', score: 85 }
      ] },
      portfolioValue: { 
        currentValue: 187, 
        quarterlyData: [45, 42, 48, 52], 
        monthlyData: [15, 18, 22, 20, 25, 28],
        yearlyData: [187], // Only current year
        yearlyLabels: [`${currentYear}`],
        financialYearStartMonth: 6 
      },
      timeToFund: { 
        averageDays: 35, 
        timeToFundData: [38, 36, 34, 32], 
        monthlyTimeToFundData: [40, 38, 37, 36, 35, 34],
        yearlyTimeToFundData: [35], // Only current year
        yearlyTimeToFundLabels: [`${currentYear}`],
        totalSMEs: 29, 
        allProcessingTimes: [32, 35, 38, 40, 33, 36, 34, 37], 
        financialYearStartMonth: 6 
      }
    },
    { 
      activeSMEs: { 'Micro': 8, 'Small': 10, 'Medium': 6, 'Large': 4 }, 
      averageBIGScore: { averageScore: 72, individualScores: [
        { smeId: 'sme5', companyName: 'Retail Chain D', score: 78 },
        { smeId: 'sme6', companyName: 'Food Processing E', score: 71 },
        { smeId: 'sme7', companyName: 'Logistics F', score: 67 }
      ], totalSMEs: 28 }, 
      fundingReadyPercentage: { fundingReadyPercentage: 60, fundingReadyCount: 17, totalCount: 28, fundingReadySMEs: [
        { smeId: 'sme5', companyName: 'Retail Chain D', score: 78 }
      ] },
      portfolioValue: { 
        currentValue: 215, 
        quarterlyData: [52, 51, 55, 57], 
        monthlyData: [18, 20, 25, 22, 28, 30],
        yearlyData: [215], // Only current year
        yearlyLabels: [`${currentYear}`],
        financialYearStartMonth: 6 
      },
      timeToFund: { 
        averageDays: 32, 
        timeToFundData: [35, 34, 32, 29], 
        monthlyTimeToFundData: [36, 35, 34, 33, 32, 31],
        yearlyTimeToFundData: [32], // Only current year
        yearlyTimeToFundLabels: [`${currentYear}`],
        totalSMEs: 28, 
        allProcessingTimes: [30, 32, 34, 31, 33, 32, 30, 35], 
        financialYearStartMonth: 6 
      }
    },
    { 
      activeSMEs: { 'Micro': 5, 'Small': 14, 'Medium': 9, 'Large': 2 }, 
      averageBIGScore: { averageScore: 76, individualScores: [
        { smeId: 'sme8', companyName: 'Healthcare G', score: 84 },
        { smeId: 'sme9', companyName: 'Education Tech H', score: 79 },
        { smeId: 'sme10', companyName: 'Clean Energy I', score: 72 }
      ], totalSMEs: 30 }, 
      fundingReadyPercentage: { fundingReadyPercentage: 70, fundingReadyCount: 21, totalCount: 30, fundingReadySMEs: [
        { smeId: 'sme8', companyName: 'Healthcare G', score: 84 },
        { smeId: 'sme9', companyName: 'Education Tech H', score: 79 }
      ] },
      portfolioValue: { 
        currentValue: 198, 
        quarterlyData: [48, 47, 50, 53], 
        monthlyData: [16, 19, 23, 21, 26, 29],
        yearlyData: [198], // Only current year
        yearlyLabels: [`${currentYear}`],
        financialYearStartMonth: 6 
      },
      timeToFund: { 
        averageDays: 38, 
        timeToFundData: [42, 40, 37, 35], 
        monthlyTimeToFundData: [44, 42, 41, 39, 38, 37],
        yearlyTimeToFundData: [38], // Only current year
        yearlyTimeToFundLabels: [`${currentYear}`],
        totalSMEs: 30, 
        allProcessingTimes: [36, 38, 40, 37, 39, 38, 36, 41], 
        financialYearStartMonth: 6 
      }
    },
    { 
      activeSMEs: { 'Micro': 7, 'Small': 11, 'Medium': 7, 'Large': 5 }, 
      averageBIGScore: { averageScore: 73, individualScores: [
        { smeId: 'sme11', companyName: 'Real Estate J', score: 81 },
        { smeId: 'sme12', companyName: 'Tourism K', score: 75 },
        { smeId: 'sme13', companyName: 'Agriculture L', score: 69 }
      ], totalSMEs: 31 }, 
      fundingReadyPercentage: { fundingReadyPercentage: 68, fundingReadyCount: 21, totalCount: 31, fundingReadySMEs: [
        { smeId: 'sme11', companyName: 'Real Estate J', score: 81 }
      ] },
      portfolioValue: { 
        currentValue: 232, 
        quarterlyData: [56, 58, 57, 61], 
        monthlyData: [20, 22, 27, 25, 30, 33],
        yearlyData: [232], // Only current year
        yearlyLabels: [`${currentYear}`],
        financialYearStartMonth: 6 
      },
      timeToFund: { 
        averageDays: 29, 
        timeToFundData: [32, 31, 29, 26], 
        monthlyTimeToFundData: [34, 33, 32, 31, 30, 29],
        yearlyTimeToFundData: [29], // Only current year
        yearlyTimeToFundLabels: [`${currentYear}`],
        totalSMEs: 31, 
        allProcessingTimes: [27, 29, 31, 28, 30, 29, 27, 32], 
        financialYearStartMonth: 6 
      }
    }
  ];
  
  return fallbackOptions[userHash];
};

const PortfolioOverview = ({ openPopup, downloadSectionAsPDF, currentUser }) => {
  const [timeToFundView, setTimeToFundView] = useState('Quarterly');
  const [fundingFacilitatedData, setFundingFacilitatedData] = useState([15, 18, 22, 20, 25, 28]);
  const [showFundingInput, setShowFundingInput] = useState(false);
  const [portfolioData, setPortfolioData] = useState({
    activeSMEs: { 'Micro': 0, 'Small': 0, 'Medium': 0, 'Large': 0 },
    averageBIGScore: { averageScore: 0, individualScores: [], totalSMEs: 0 },
    fundingReadyPercentage: { fundingReadyPercentage: 0, fundingReadyCount: 0, totalCount: 0, fundingReadySMEs: [], notFundingReadySMEs: [] },
    portfolioValue: { 
      currentValue: 0, 
      quarterlyData: [0, 0, 0, 0], 
      monthlyData: [0, 0, 0, 0, 0, 0],
      yearlyData: [0],
      yearlyLabels: [`${new Date().getFullYear()}`],
      totalDeals: 0, 
      totalInvestment: 0, 
      financialYearStartMonth: 6, 
      quarterlyBreakdown: [[], [], [], []],
      monthlyBreakdown: [[], [], [], [], [], []],
      investmentsByYear: {},
      investmentYears: []
    },
    timeToFund: { 
      averageDays: 0, 
      timeToFundData: [0, 0, 0, 0], 
      monthlyTimeToFundData: [0, 0, 0, 0, 0, 0],
      yearlyTimeToFundData: [0],
      yearlyTimeToFundLabels: [`${new Date().getFullYear()}`],
      totalSMEs: 0, 
      allProcessingTimes: [], 
      financialYearStartMonth: 6, 
      processingDetails: [],
      monthlyProcessingDetails: [[], [], [], [], [], []],
      processingTimesByYear: {},
      processingYears: []
    },
    loading: true,
    usingFallback: false
  });

  // Fetch portfolio data when component mounts
  useEffect(() => {
    const fetchPortfolioData = async () => {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log('❌ No current user found - cannot fetch data');
        const fallbackData = getFallbackDataBasedOnUser();
        setPortfolioData({
          activeSMEs: fallbackData.activeSMEs,
          averageBIGScore: fallbackData.averageBIGScore,
          fundingReadyPercentage: fallbackData.fundingReadyPercentage,
          portfolioValue: fallbackData.portfolioValue,
          timeToFund: fallbackData.timeToFund,
          loading: false,
          usingFallback: true
        });
        return;
      }
      
      console.log('🚀 STARTING PORTFOLIO DATA FETCH FOR SUCCESSFUL DEALS - User:', currentUser.uid);
      setPortfolioData(prev => ({ ...prev, loading: true }));
      
      try {
        const [activeSMEsData, averageBIGScoreData, fundingReadyPercentageData, portfolioValueData, timeToFundData] = await Promise.all([
          fetchActiveSMEsData(),
          fetchAverageBIGScore(),
          fetchFundingReadyPercentage(),
          fetchPortfolioValueData(),
          fetchAverageTimeToFund()
        ]);
        
        // Check if we got any real data from successful deals
        const totalSMEs = Object.values(activeSMEsData).reduce((a, b) => a + b, 0);
        const hasRealData = totalSMEs > 0 || portfolioValueData.currentValue > 0;
        
        console.log('📊 SUCCESSFUL DEALS DATA FETCH COMPLETED:', {
          hasRealData,
          totalSMEs,
          averageBIGScore: averageBIGScoreData.averageScore,
          fundingReadyPercentage: fundingReadyPercentageData.fundingReadyPercentage,
          portfolioValue: portfolioValueData.currentValue,
          totalDeals: portfolioValueData.totalDeals,
          totalInvestment: portfolioValueData.totalInvestment,
          financialYearStartMonth: portfolioValueData.financialYearStartMonth,
          timeToFund: timeToFundData.averageDays,
          timeToFundSMEs: timeToFundData.totalSMEs,
          investmentYears: portfolioValueData.investmentYears,
          processingYears: timeToFundData.processingYears
        });
        
        if (hasRealData) {
          console.log('✅ USING REAL DATA FROM SUCCESSFUL DEALS');
          setPortfolioData({
            activeSMEs: activeSMEsData,
            averageBIGScore: averageBIGScoreData,
            fundingReadyPercentage: fundingReadyPercentageData,
            portfolioValue: portfolioValueData,
            timeToFund: timeToFundData,
            loading: false,
            usingFallback: false
          });
        } else {
          console.log('⚠️ USING FALLBACK DATA - no successful deals found for this investor');
          const fallbackData = getFallbackDataBasedOnUser();
          setPortfolioData({
            activeSMEs: fallbackData.activeSMEs,
            averageBIGScore: fallbackData.averageBIGScore,
            fundingReadyPercentage: fallbackData.fundingReadyPercentage,
            portfolioValue: fallbackData.portfolioValue,
            timeToFund: fallbackData.timeToFund,
            loading: false,
            usingFallback: true
          });
        }
      } catch (error) {
        console.error('❌ ERROR fetching successful deals data:', error);
        const fallbackData = getFallbackDataBasedOnUser();
        setPortfolioData({
          activeSMEs: fallbackData.activeSMEs,
          averageBIGScore: fallbackData.averageBIGScore,
          fundingReadyPercentage: fallbackData.fundingReadyPercentage,
          portfolioValue: fallbackData.portfolioValue,
          timeToFund: fallbackData.timeToFund,
          loading: false,
          usingFallback: true
        });
      }
    };
    
    fetchPortfolioData();
  }, []);

  // Helper function to get quarter labels based on financial year start
  const getQuarterLabels = (financialYearStartMonth) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Calculate quarter ranges based on financial year start
    const q1Start = financialYearStartMonth;
    const q1End = (financialYearStartMonth + 2) % 12;
    
    const q2Start = (financialYearStartMonth + 3) % 12;
    const q2End = (financialYearStartMonth + 5) % 12;
    
    const q3Start = (financialYearStartMonth + 6) % 12;
    const q3End = (financialYearStartMonth + 8) % 12;
    
    const q4Start = (financialYearStartMonth + 9) % 12;
    const q4End = (financialYearStartMonth + 11) % 12;
    
    return [
      `Q1 (${monthNames[q1Start]}-${monthNames[q1End]})`,
      `Q2 (${monthNames[q2Start]}-${monthNames[q2End]})`,
      `Q3 (${monthNames[q3Start]}-${monthNames[q3End]})`,
      `Q4 (${monthNames[q4Start]}-${monthNames[q4End]})`
    ];
  };

  // Helper function to get financial year months in order
  const getFinancialYearMonths = (financialYearStartMonth) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = [];
    
    // Start from financial year start month and get next 6 months
    for (let i = 0; i < 6; i++) {
      const monthIndex = (financialYearStartMonth + i) % 12;
      months.push(monthNames[monthIndex]);
    }
    
    return months;
  };

  // Time view data - now using real data from successful deals with FINANCIAL YEAR allocation
  const timeToFundData = {
    Monthly: portfolioData.timeToFund.monthlyTimeToFundData,
    Quarterly: portfolioData.timeToFund.timeToFundData,
    Yearly: portfolioData.timeToFund.yearlyTimeToFundData
  };

  // Portfolio value data for different time views
  const portfolioValueData = {
    Monthly: portfolioData.portfolioValue.monthlyData,
    Quarterly: portfolioData.portfolioValue.quarterlyData,
    Yearly: portfolioData.portfolioValue.yearlyData
  };

  const getTimeData = (view, dataObject) => {
    return dataObject[view] || dataObject.Quarterly;
  };

  const getTimeLabels = (view, financialYearStartMonth) => {
    switch (view) {
      case 'Monthly':
        return getFinancialYearMonths(financialYearStartMonth);
      case 'Quarterly':
        return getQuarterLabels(financialYearStartMonth);
      case 'Yearly':
        // Use the actual years we have data for
        if (view === 'Yearly') {
          if (timeToFundView === 'Yearly') {
            return portfolioData.timeToFund.yearlyTimeToFundLabels;
          } else {
            return portfolioData.portfolioValue.yearlyLabels;
          }
        }
        return portfolioData.portfolioValue.yearlyLabels;
      default:
        return getQuarterLabels(financialYearStartMonth);
    }
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

  // Data generation functions
  const generateBarData = (labels, data, label, colorIndex) => ({
    labels,
    datasets: [{
      label,
      data,
      backgroundColor: brownShades[colorIndex % brownShades.length],
      borderColor: brownShades[(colorIndex + 1) % brownShades.length],
      borderWidth: 1
    }]
  });

  // NEW: Funding Facilitated Chart with Data Input
  const FundingFacilitatedChart = ({ title }) => {
    const [tempData, setTempData] = useState([...fundingFacilitatedData]);
    const financialYearMonths = getFinancialYearMonths(portfolioData.portfolioValue.financialYearStartMonth);

    const handleEditClick = () => {
      setShowFundingInput(true);
      setTempData([...fundingFacilitatedData]);
    };

    const handleSaveData = () => {
      setFundingFacilitatedData([...tempData]);
      setShowFundingInput(false);
    };

    const handleCancelEdit = () => {
      setShowFundingInput(false);
      setTempData([...fundingFacilitatedData]);
    };

    const handleInputChange = (index, value) => {
      const newData = [...tempData];
      newData[index] = parseFloat(value) || 0;
      setTempData(newData);
    };

    const chartData = generateBarData(
      financialYearMonths,
      fundingFacilitatedData,
      'Funding (R millions)',
      2
    );

    const handleEyeClick = () => {
      const totalFacilitated = fundingFacilitatedData.reduce((sum, value) => sum + value, 0);
      const maxAllowed = portfolioData.portfolioValue.totalInvestment / 1000000;
      
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">
            Monthly funding facilitated from your successful deals - manually input data that reflects your actual funding activities
          </div>
          <div className="popup-chart">
            <Bar data={chartData} options={staticBarOptions} />
          </div>
          <div className="popup-details">
            {financialYearMonths.map((month, index) => (
              <div key={month} className="detail-item">
                <span className="detail-label">{month}:</span>
                <span className="detail-value">R {fundingFacilitatedData[index]} million</span>
              </div>
            ))}
            <div className="detail-item" style={{borderLeftColor: '#5e3f26'}}>
              <span className="detail-label">Total Facilitated:</span>
              <span className="detail-value" style={{color: '#5e3f26'}}>R {totalFacilitated.toFixed(1)} million</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Available from Deals:</span>
              <span className="detail-value">R {maxAllowed.toFixed(1)} million</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Utilization Rate:</span>
              <span className="detail-value">
                {maxAllowed > 0 ? ((totalFacilitated / maxAllowed) * 100).toFixed(1) : '0'}%
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Financial Year Start:</span>
              <span className="detail-value">
                {financialYearMonths[0]} (Month {portfolioData.portfolioValue.financialYearStartMonth + 1})
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Data Type:</span>
              <span className="detail-value">Manually Input</span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <div>
            <button 
              className="breakdown-icon-btn"
              onClick={handleEyeClick}
              title="View breakdown"
            >
              <FiEye />
            </button>
            <button 
              className="edit-icon-btn"
              onClick={handleEditClick}
              title="Edit data"
            >
              <FiEdit />
            </button>
          </div>
        </div>
        
        {showFundingInput ? (
          <div className="data-input-form">
            <div className="popup-description">
              Enter funding amounts for each month (R millions)
            </div>
            <div className="form-row">
              {financialYearMonths.map((month, index) => (
                <div key={month} className="form-group">
                  <label className="form-label">{month}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={tempData[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    step="0.1"
                    min="0"
                  />
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveData}>
                Save Data
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="chart-title-fixed">
              Monthly funding from successful deals (R millions)
            </div>
            <div className="chart-area">
              <Bar data={chartData} options={staticBarOptions} />
            </div>
          </>
        )}
      </div>
    );
  };

  // UPDATED: BIG Score Circular Component with % sign and whole numbers - FIXED to show individual scores
  const BIGScoreInfographic = ({ value, target, title }) => {
    const handleEyeClick = () => {
      const { individualScores, totalSMEs } = portfolioData.averageBIGScore;
      
      openPopup(
        <div className="popup-content">
          <h3>BIG Score - Successful Deals</h3>
          <div className="popup-description">
            Average BIG Score across SMEs from your successful investment deals
          </div>
          <div className="big-score-popup">
            <div className="big-score-main-popup">
              <div className="big-score-value">{value}%</div>
              <div className="big-score-label">Your Successful Deals BIG Score</div>
              <div className="big-score-target">Target: {target}%</div>
            </div>
            <div className="popup-details">
              <div className="detail-item">
                <span className="detail-label">Data Source:</span>
                <span className="detail-value">
                  {portfolioData.usingFallback ? 'Sample Portfolio' : 'Your Successful Deals'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Calculation:</span>
                <span className="detail-value">Average of SMEs from your successful deals</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Scoring Range:</span>
                <span className="detail-value">0-100%</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total SMEs Analyzed:</span>
                <span className="detail-value">{totalSMEs}</span>
              </div>
              
              {/* Show individual SME scores */}
              {individualScores.length > 0 && (
                <>
                  <div className="detail-item" style={{borderLeftColor: '#4CAF50', marginTop: '15px'}}>
                    <span className="detail-label" style={{fontSize: '16px', fontWeight: '700'}}>Individual SME BIG Scores:</span>
                    <span className="detail-value" style={{fontSize: '16px', fontWeight: '700'}}>{individualScores.length} SMEs</span>
                  </div>
                  {individualScores.map((sme, index) => (
                    <div key={sme.smeId} className="detail-item" style={{borderLeftColor: sme.score >= 80 ? '#4CAF50' : '#FF9800'}}>
                      <span className="detail-label">{sme.companyName || `SME ${index + 1}`}:</span>
                      <span className="detail-value" style={{color: sme.score >= 80 ? '#4CAF50' : '#FF9800'}}>
                        {sme.score}% {sme.note && `(${sme.note})`}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button 
            className="breakdown-icon-btn"
            onClick={handleEyeClick}
            title="View breakdown"
          >
            <FiEye />
          </button>
        </div>
        
        <div className="big-score-circular">
          <div className="circular-progress">
            <svg width="140" height="140" viewBox="0 0 140 140">
              {/* Background circle */}
              <circle
                cx="70"
                cy="70"
                r="60"
                stroke="#e0e0e0"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="70"
                cy="70"
                r="60"
                stroke="#7d5a36"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="377"
                strokeDashoffset={377 - (377 * value) / 100}
                transform="rotate(-90 70 70)"
              />
            </svg>
            <div className="circular-content">
              <div className="big-score-value-circular">{portfolioData.loading ? '...' : value}%</div>
              <div className="big-score-label-circular">BIG Score</div>
            </div>
          </div>
          <div className="circular-target">
            Target: {target}%
            {value >= target ? (
              <FiArrowUp className="trend-icon up" />
            ) : (
              <FiArrowDown className="trend-icon down" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // UPDATED: Funding Ready Circular Component with 80% threshold - FIXED to show individual SMEs
  const FundingReadyCircular = ({ value, target, title }) => {
    const handleEyeClick = () => {
      const { fundingReadySMEs, notFundingReadySMEs, fundingReadyCount, totalCount } = portfolioData.fundingReadyPercentage;
      
      openPopup(
        <div className="popup-content">
          <h3>Funding Ready - Successful Deals</h3>
          <div className="popup-description">
            Percentage of SMEs in your successful deals portfolio with BIG Score ≥ 80% (considered "Funding Ready")
          </div>
          <div className="funding-ready-popup">
            <div className="readiness-main-popup">
              <div className="readiness-value">{value}%</div>
              <div className="readiness-label">Funding Ready Portfolio</div>
              <div className="readiness-target">Target: {target}%</div>
            </div>
            <div className="popup-details">
              <div className="detail-item">
                <span className="detail-label">Calculation:</span>
                <span className="detail-value">SMEs with BIG Score ≥ 80%</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Data Source:</span>
                <span className="detail-value">
                  {portfolioData.usingFallback ? 'Sample Portfolio' : 'Your Successful Deals'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Funding Ready Definition:</span>
                <span className="detail-value">BIG Score of 80% or higher</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Funding Ready SMEs:</span>
                <span className="detail-value" style={{color: '#4CAF50'}}>{fundingReadyCount} out of {totalCount}</span>
              </div>
              
              {/* Show funding ready SMEs */}
              {fundingReadySMEs.length > 0 && (
                <>
                  <div className="detail-item" style={{borderLeftColor: '#4CAF50', marginTop: '15px'}}>
                    <span className="detail-label" style={{fontSize: '16px', fontWeight: '700'}}>Funding Ready SMEs:</span>
                    <span className="detail-value" style={{fontSize: '16px', fontWeight: '700', color: '#4CAF50'}}>{fundingReadySMEs.length} SMEs</span>
                  </div>
                  {fundingReadySMEs.map((sme, index) => (
                    <div key={sme.smeId} className="detail-item" style={{borderLeftColor: '#4CAF50'}}>
                      <span className="detail-label">{sme.companyName || `SME ${index + 1}`}:</span>
                      <span className="detail-value" style={{color: '#4CAF50'}}>{sme.score}%</span>
                    </div>
                  ))}
                </>
              )}
              
              {/* Show not funding ready SMEs */}
              {notFundingReadySMEs.length > 0 && (
                <>
                  <div className="detail-item" style={{borderLeftColor: '#FF9800', marginTop: '15px'}}>
                    <span className="detail-label" style={{fontSize: '16px', fontWeight: '700'}}>Not Funding Ready SMEs:</span>
                    <span className="detail-value" style={{fontSize: '16px', fontWeight: '700', color: '#FF9800'}}>{notFundingReadySMEs.length} SMEs</span>
                  </div>
                  {notFundingReadySMEs.slice(0, 5).map((sme, index) => (
                    <div key={sme.smeId} className="detail-item" style={{borderLeftColor: '#FF9800'}}>
                      <span className="detail-label">{sme.companyName || `SME ${index + 1}`}:</span>
                      <span className="detail-value" style={{color: '#FF9800'}}>{sme.score}% {sme.note && `(${sme.note})`}</span>
                    </div>
                  ))}
                  {notFundingReadySMEs.length > 5 && (
                    <div className="detail-item">
                      <span className="detail-label">... and {notFundingReadySMEs.length - 5} more</span>
                      <span className="detail-value"></span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button 
            className="breakdown-icon-btn"
            onClick={handleEyeClick}
            title="View breakdown"
          >
            <FiEye />
          </button>
        </div>
        
        <div className="funding-ready-circular">
          <div className="circular-progress">
            <svg width="140" height="140" viewBox="0 0 140 140">
              {/* Background circle */}
              <circle
                cx="70"
                cy="70"
                r="60"
                stroke="#e0e0e0"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="70"
                cy="70"
                r="60"
                stroke="#7d5a36"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="377"
                strokeDashoffset={377 - (377 * value) / 100}
                transform="rotate(-90 70 70)"
              />
            </svg>
            <div className="circular-content">
              <div className="funding-ready-value-circular">{portfolioData.loading ? '...' : value}%</div>
              <div className="funding-ready-label-circular">Funding Ready</div>
            </div>
          </div>
          <div className="circular-target">
            Target: {target}%
            {value >= target ? (
              <FiArrowUp className="trend-icon up" />
            ) : (
              <FiArrowDown className="trend-icon down" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // UPDATED: BarChartWithTitle to support all time views with accurate yearly data
  const BarChartWithTitle = ({ data, title, chartTitle, chartId }) => {
    const handleEyeClick = () => {
      const { quarterlyBreakdown, monthlyBreakdown, investmentsByYear, investmentYears } = portfolioData.portfolioValue;
      const currentYear = new Date().getFullYear();
      
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">
            Portfolio value growth from your successful investment deals with accurate yearly data based on actual investment dates
          </div>
          <div className="popup-chart">
            <Bar data={data} options={staticBarOptions} />
          </div>
          <div className="popup-details">
            {data.labels.map((label, index) => (
              <div key={label} className="detail-item">
                <span className="detail-label">{label}:</span>
                <span className="detail-value">R {data.datasets[0].data[index]} million</span>
              </div>
            ))}
            <div className="detail-item" style={{borderLeftColor: '#5e3f26'}}>
              <span className="detail-label">Successful Deals:</span>
              <span className="detail-value" style={{color: '#5e3f26'}}>
                {portfolioData.portfolioValue.totalDeals || 'N/A'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Investment:</span>
              <span className="detail-value">
                R {portfolioData.portfolioValue.totalInvestment ? (portfolioData.portfolioValue.totalInvestment / 1000000).toFixed(1) : '0'} million
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Financial Year Start:</span>
              <span className="detail-value">
                Month {portfolioData.portfolioValue.financialYearStartMonth + 1} ({getFinancialYearMonths(portfolioData.portfolioValue.financialYearStartMonth)[0]})
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Data Source:</span>
              <span className="detail-value">
                {portfolioData.usingFallback ? 'Sample Portfolio' : 'Your Successful Deals'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Time View:</span>
              <span className="detail-value">{timeToFundView}</span>
            </div>
            
            {/* Show investment years breakdown */}
            {investmentYears && investmentYears.length > 0 && (
              <>
                <div className="detail-item" style={{borderLeftColor: '#4CAF50', marginTop: '15px'}}>
                  <span className="detail-label" style={{fontSize: '16px', fontWeight: '700'}}>Investments by Calendar Year:</span>
                  <span className="detail-value" style={{fontSize: '16px', fontWeight: '700'}}></span>
                </div>
                {investmentYears.map(year => (
                  <div key={year} className="detail-item">
                    <span className="detail-label">{year}:</span>
                    <span className="detail-value">
                      R {((investmentsByYear[year] || 0) / 1000000).toFixed(1)} million
                    </span>
                  </div>
                ))}
              </>
            )}
            
            {/* Show quarterly breakdown for quarterly view */}
            {timeToFundView === 'Quarterly' && quarterlyBreakdown && quarterlyBreakdown.some(q => q.length > 0) && (
              <>
                <div className="detail-item" style={{borderLeftColor: '#4CAF50', marginTop: '15px'}}>
                  <span className="detail-label" style={{fontSize: '16px', fontWeight: '700'}}>Quarterly Investment Breakdown:</span>
                  <span className="detail-value" style={{fontSize: '16px', fontWeight: '700'}}></span>
                </div>
                {quarterlyBreakdown.map((quarter, index) => (
                  <div key={index} className="detail-item">
                    <span className="detail-label">{getQuarterLabels(portfolioData.portfolioValue.financialYearStartMonth)[index]}:</span>
                    <span className="detail-value">
                      {quarter.length} deals, R {portfolioData.portfolioValue.quarterlyData[index]}M
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button 
            className="breakdown-icon-btn"
            onClick={handleEyeClick}
            title="View breakdown"
          >
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

  // Active SMEs Pie Chart
  const ActiveSMEsPieChart = ({ title }) => {
    const { activeSMEs, loading } = portfolioData;
    
    const data = {
      labels: ['Micro', 'Small', 'Medium', 'Large'],
      datasets: [{
        data: [activeSMEs.Micro, activeSMEs.Small, activeSMEs.Medium, activeSMEs.Large],
        backgroundColor: [brownShades[0], brownShades[1], brownShades[2], brownShades[3]],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 0
      }]
    };

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
            ctx.textAlign= 'center';
            ctx.textBaseline= 'middle';
            ctx.fillText(dataset.data[index], x, y);
            ctx.restore();
          });
        });
      }
    }];

    const totalSMEs = activeSMEs.Micro + activeSMEs.Small + activeSMEs.Medium + activeSMEs.Large;

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Your Successful Deals Portfolio</h3>
          <div className="popup-description">
            Distribution of SMEs from your successful investment deals by business size
          </div>
          <div className="popup-chart">
            <Pie data={data} options={staticPieOptions} plugins={plugins} />
          </div>
          <div className="popup-details">
            <div className="detail-item">
              <span className="detail-label">Micro Enterprises:</span>
              <span className="detail-value">
                {activeSMEs.Micro} SMEs ({totalSMEs > 0 ? Math.round((activeSMEs.Micro / totalSMEs) * 100) : 0}%)
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Small Enterprises:</span>
              <span className="detail-value">
                {activeSMEs.Small} SMEs ({totalSMEs > 0 ? Math.round((activeSMEs.Small / totalSMEs) * 100) : 0}%)
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Medium Enterprises:</span>
              <span className="detail-value">
                {activeSMEs.Medium} SMEs ({totalSMEs > 0 ? Math.round((activeSMEs.Medium / totalSMEs) * 100) : 0}%)
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Large Enterprises:</span>
              <span className="detail-value">
                {activeSMEs.Large} SMEs ({totalSMEs > 0 ? Math.round((activeSMEs.Large / totalSMEs) * 100) : 0}%)
              </span>
            </div>
            <div className="detail-item" style={{borderLeftColor: '#5e3f26'}}>
              <span className="detail-label">Total SMEs in Successful Deals:</span>
              <span className="detail-value" style={{color: '#5e3f26'}}>{totalSMEs}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Successful Deals:</span>
              <span className="detail-value">{portfolioData.portfolioValue.totalDeals || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Data Source:</span>
              <span className="detail-value">
                {portfolioData.usingFallback ? 'Sample Successful Deals' : 'Your Actual Successful Deals'}
              </span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button 
            className="breakdown-icon-btn"
            onClick={handleEyeClick}
            title="View breakdown"
          >
            <FiEye />
          </button>
        </div>
        <div className="chart-area">
          {loading ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#7d5a36',
              fontSize: '16px'
            }}>
              Loading your successful deals...
            </div>
          ) : totalSMEs === 0 ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#666',
              fontSize: '14px',
              textAlign: 'center',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div>No successful deals in your portfolio</div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {portfolioData.usingFallback ? 
                  'Showing sample successful deals portfolio' : 
                  'You have no Deal Complete investments yet'
                }
              </div>
            </div>
          ) : (
            <Pie data={data} options={staticPieOptions} plugins={plugins} />
          )}
        </div>
      </div>
    );
  };

  // UPDATED: Time to Fund Chart to support all time views with accurate yearly data
  const TimeToFundChart = ({ value, target, data, title }) => {
    const labels = getTimeLabels(timeToFundView, portfolioData.timeToFund.financialYearStartMonth);
    
    const chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Days to Fund',
          data: data,
          borderColor: brownShades[0],
          backgroundColor: brownShades[0] + '20',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: brownShades[0],
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        },
        {
          label: 'Target (<30 days)',
          data: Array(data.length).fill(target),
          borderColor: '#4CAF50',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          tension: 0
        }
      ]
    };

    const options = {
      ...staticLineOptions,
      plugins: {
        ...staticLineOptions.plugins,
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y + ' days';
              }
              return label;
            }
          }
        }
      }
    };

    const handleEyeClick = () => {
      const { processingDetails, monthlyProcessingDetails, processingTimesByYear, processingYears } = portfolioData.timeToFund;
      
      openPopup(
        <div className="popup-content">
          <h3>Time to Fund - Successful Deals</h3>
          <div className="popup-description">
            Average funding time calculated from your successful deals (application date to approval date) with accurate yearly data based on actual processing dates
          </div>
          <div className="popup-chart">
            <Line data={chartData} options={options} />
          </div>
          <div className="popup-details">
            <div className="detail-item">
              <span className="detail-label">Current Average:</span>
              <span className="detail-value">{value} days</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Target:</span>
              <span className="detail-value">{target} days</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">SMEs Analyzed:</span>
              <span className="detail-value">{portfolioData.timeToFund.totalSMEs || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Financial Year Start:</span>
              <span className="detail-value">
                Month {portfolioData.timeToFund.financialYearStartMonth + 1} ({getFinancialYearMonths(portfolioData.timeToFund.financialYearStartMonth)[0]})
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Data Source:</span>
              <span className="detail-value">
                {portfolioData.usingFallback ? 'Sample Data' : 'Your Successful Deals'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Calculation:</span>
              <span className="detail-value">Application Date → Approval Date</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Time View:</span>
              <span className="detail-value">{timeToFundView}</span>
            </div>
            
            {/* Show processing years breakdown */}
            {processingYears && processingYears.length > 0 && (
              <>
                <div className="detail-item" style={{borderLeftColor: '#4CAF50', marginTop: '15px'}}>
                  <span className="detail-label" style={{fontSize: '16px', fontWeight: '700'}}>Processing Times by Calendar Year:</span>
                  <span className="detail-value" style={{fontSize: '16px', fontWeight: '700'}}></span>
                </div>
                {processingYears.map(year => {
                  const yearTimes = processingTimesByYear[year] || [];
                  const yearAvg = yearTimes.length > 0 ? 
                    Math.round(yearTimes.reduce((sum, days) => sum + days, 0) / yearTimes.length) : 0;
                  return (
                    <div key={year} className="detail-item">
                      <span className="detail-label">{year}:</span>
                      <span className="detail-value">
                        {yearAvg} days ({yearTimes.length} SMEs)
                      </span>
                    </div>
                  );
                })}
              </>
            )}
            
            {/* Show processing details based on current view */}
            {timeToFundView === 'Quarterly' && processingDetails && processingDetails.some(q => q.length > 0) && (
              <>
                <div className="detail-item" style={{borderLeftColor: '#4CAF50', marginTop: '15px'}}>
                  <span className="detail-label" style={{fontSize: '16px', fontWeight: '700'}}>Processing Details by Quarter:</span>
                  <span className="detail-value" style={{fontSize: '16px', fontWeight: '700'}}></span>
                </div>
                {processingDetails.map((quarter, index) => (
                  <div key={index} className="detail-item">
                    <span className="detail-label">{getQuarterLabels(portfolioData.timeToFund.financialYearStartMonth)[index]}:</span>
                    <span className="detail-value">
                      {quarter.length} SMEs, Avg: {data[index]} days
                    </span>
                  </div>
                ))}
              </>
            )}
            
            {timeToFundView === 'Monthly' && monthlyProcessingDetails && monthlyProcessingDetails.some(m => m.length > 0) && (
              <>
                <div className="detail-item" style={{borderLeftColor: '#4CAF50', marginTop: '15px'}}>
                  <span className="detail-label" style={{fontSize: '16px', fontWeight: '700'}}>Processing Details by Month:</span>
                  <span className="detail-value" style={{fontSize: '16px', fontWeight: '700'}}></span>
                </div>
                {monthlyProcessingDetails.map((month, index) => (
                  <div key={index} className="detail-item">
                    <span className="detail-label">{getFinancialYearMonths(portfolioData.timeToFund.financialYearStartMonth)[index]}:</span>
                    <span className="detail-value">
                      {month.length} SMEs, Avg: {data[index]} days
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button 
            className="breakdown-icon-btn"
            onClick={handleEyeClick}
            title="View details"
          >
            <FiEye />
          </button>
        </div>
        <div className="chart-area-ultra-compact">
          <Line data={chartData} options={options} id="time-to-fund" />
        </div>
        
        {/* Enhanced Legend at bottom */}
        <div className="time-to-fund-legend">
          <div className="legend-item">
            <div className="legend-color days-to-fund"></div>
            <span>Days to Fund</span>
          </div>
          <div className="legend-item">
            <div className="legend-color target-line"></div>
            <span>Target Line</span>
          </div>
        </div>
        
        <div className="chart-summary-ultra-compact">
          <div className="current-value">
            Current: {portfolioData.loading ? '...' : value} days
            {portfolioData.timeToFund.totalSMEs > 0 && (
              <span style={{fontSize: '11px', color: '#666', marginLeft: '5px'}}>
                (from {portfolioData.timeToFund.totalSMEs} SMEs)
              </span>
            )}
          </div>
          <div className="target-value">
            Target: {target} days
            {value <= target ? (
              <FiArrowDown className="trend-icon up" />
            ) : (
              <FiArrowUp className="trend-icon down" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Follow-on Funding Rate Component
  const EnhancedFollowOnFundingChart = ({ value, target, data, title }) => {
    const chartData = {
      labels: data.map((_, index) => `Q${index + 1}`),
      datasets: [
        {
          label: 'Follow-on Rate',
          data: data,
          backgroundColor: brownShades.map(color => color + '80'),
          borderColor: brownShades[2],
          borderWidth: 2,
          hoverBackgroundColor: brownShades.map(color => color + '80')
        }
      ]
    };

    const options = {
      ...staticBarOptions,
      plugins: {
        ...staticBarOptions.plugins,
        legend: {
          display: false
        }
      }
    };

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Follow-on Funding - Successful Deals</h3>
          <div className="popup-description">
            Follow-on funding rates from your successful deals portfolio
          </div>
          <div className="popup-chart">
            <Bar data={chartData} options={options} />
          </div>
          <div className="popup-details">
            <div className="detail-item">
              <span className="detail-label">Current Quarter:</span>
              <span className="detail-value">{value}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Quarterly Avg:</span>
              <span className="detail-value">24.5%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Top Sector:</span>
              <span className="detail-value">Tech (42%)</span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button 
            className="breakdown-icon-btn"
            onClick={handleEyeClick}
            title="View details"
          >
            <FiEye />
          </button>
        </div>
        <div className="chart-area-ultra-compact">
          <Bar data={chartData} options={options} id="follow-on-funding" />
        </div>
        <div className="chart-summary-ultra-compact">
          <div className="current-value">Current: {value}%</div>
          <div className="target-value">
            Target: {target}%
            {value >= target ? (
              <FiArrowUp className="trend-icon up" />
            ) : (
              <FiArrowDown className="trend-icon down" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Exit Repayment Chart Component
  const ExitRepaymentChart = ({ value, target, data, title }) => {
    const chartData = {
      labels: data.map((_, index) => `Q${index + 1}`),
      datasets: [
        {
          label: 'Exit/Repayment Ratio',
          data: data,
          borderColor: brownShades[5],
          backgroundColor: brownShades[5] + '20',
          borderWidth: 3,
          fill: true,
          tension: 0,
          pointBackgroundColor: brownShades[5],
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        },
        {
          label: 'Target (>15%)',
          data: Array(data.length).fill(target),
          borderColor: '#4CAF50',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          tension: 0
        }
      ]
    };

    const options = {
      ...staticLineOptions,
      plugins: {
        ...staticLineOptions.plugins,
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y + '%';
              }
              return label;
            }
          }
        }
      }
    };

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Exit/Repayment - Successful Deals</h3>
          <div className="popup-description">
            Exit and repayment performance from your successful deals portfolio
          </div>
          <div className="popup-chart">
            <Line data={chartData} options={options} />
          </div>
          <div className="popup-details">
            <div className="detail-item">
              <span className="detail-label">Current Ratio:</span>
              <span className="detail-value">{value}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Target:</span>
              <span className="detail-value">{target}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className="detail-value positive">On Track</span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button 
            className="breakdown-icon-btn"
            onClick={handleEyeClick}
            title="View details"
          >
            <FiEye />
          </button>
        </div>
        <div className="chart-area-ultra-compact">
          <Line data={chartData} options={options} id="exit-repayment" />
        </div>
        <div className="chart-summary-ultra-compact">
          <div className="current-value">Current: {value}%</div>
          <div className="target-value">
            Target: {target}%
            {value >= target ? (
              <FiArrowUp className="trend-icon up" />
            ) : (
              <FiArrowDown className="trend-icon down" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="portfolio-overview">
      <div className="time-view-controls">
        <TimeViewSelector 
          currentView={timeToFundView} 
          onViewChange={setTimeToFundView}
        />
      </div>
      
      {/* TOP ROW - 4 charts */}
      <div className="charts-grid-4x4">
        <div className="top-row">
          <BarChartWithTitle
            data={generateBarData(
              getTimeLabels(timeToFundView, portfolioData.portfolioValue.financialYearStartMonth),
              getTimeData(timeToFundView, portfolioValueData),
              'Portfolio Value (R millions)',
              0
            )}
            title="Your Successful Deals Portfolio Value"
            chartTitle={`Investment values from successful deals (${timeToFundView.toLowerCase()} view in R millions)`}
            chartId="total-portfolio-value"
          />

          <ActiveSMEsPieChart
            title="SMEs in Successful Deals"
          />

          <BIGScoreInfographic 
            value={portfolioData.averageBIGScore.averageScore} 
            target={80} 
            title="Avg. BIG Score - Successful Deals"
          />

          <FundingReadyCircular 
            value={portfolioData.fundingReadyPercentage.fundingReadyPercentage} 
            target={75} 
            title='% Portfolio "Funding Ready"'
          />
        </div>

        {/* BOTTOM ROW - 4 charts */}
        <div className="bottom-row">
          <FundingFacilitatedChart
            title="Funding Facilitated - Successful Deals"
          />

          <TimeToFundChart
            value={portfolioData.timeToFund.averageDays}
            target={30}
            data={getTimeData(timeToFundView, timeToFundData)}
            title="Avg. Time-to-Fund - Successful Deals"
          />

          <EnhancedFollowOnFundingChart
            value={27}
            target={30}
            data={[22, 24, 25, 27]}
            title="Follow-on Funding Rate - Successful Deals"
          />

          <ExitRepaymentChart
            value={12}
            target={15}
            data={[10, 11, 12, 12]}
            title="Exit / Repayment Ratio - Successful Deals"
          />
        </div>
      </div>
    </div>
  );
};

export default PortfolioOverview;