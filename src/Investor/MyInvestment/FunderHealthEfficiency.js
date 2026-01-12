// tabs/FunderHealthEfficiency.js
import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { FiEye, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { db, auth } from '../../firebaseConfig'; 
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
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
  Title,
  Tooltip,
  Legend
);

// Styles for FunderHealthEfficiency
const styles = `
.funder-efficiency {
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

.funder-charts-grid-4x4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  justifyContent: center;
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

.chart-area-compact {
  flex-grow: 1;
  min-height: 200px;
  position: relative;
  margin-bottom: 10px;
}

.loading-state {
  display: flex;
  align-items: center;
  justifyContent: center;
  height: 100%;
  color: #7d5a36;
  font-size: 16px;
  text-align: center;
}

.empty-state {
  display: flex;
  align-items: center;
  justifyContent: center;
  height: 100%;
  color: #666;
  font-size: 14px;
  text-align: center;
  flex-direction: column;
  gap: 10px;
}

.empty-state small {
  font-size: 12px;
  color: #999;
}

/* Circular Design for Vetting Time and Approved Funding */
.circular-chart {
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
  justifyContent: center;
}

.circular-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.circular-value {
  font-size: 32px;
  font-weight: 700;
  color: #5e3f26;
  line-height: 1;
  margin-bottom: 4px;
}

.circular-label {
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

/* Cost per SME Infographic */
.cost-simple {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cost-main-simple {
  text-align: center;
  padding: 30px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 3px solid #7d5a36;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.cost-value-simple {
  font-size: 32px;
  font-weight: 700;
  color: #5e3f26;
  margin-bottom: 8px;
  line-height: 1;
}

.cost-label-simple {
  font-size: 16px;
  color: #666;
  font-weight: 500;
  margin-bottom: 6px;
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
@media (max-width: 1200px) {
  .funder-charts-grid-4x4 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-container {
    height: 400px;
  }
}

@media (max-width: 992px) {
  .funder-charts-grid-4x4 {
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
  
  .cost-value-simple {
    font-size: 28px;
  }
  
  .circular-value {
    font-size: 28px;
  }
}

@media (max-width: 576px) {
  .chart-container {
    padding: 15px;
    height: 320px;
  }
  
  .funder-charts-grid-4x4 {
    padding: 0 5px;
  }
  
  .cost-value-simple {
    font-size: 24px;
  }
  
  .cost-label-simple {
    font-size: 14px;
  }
  
  .circular-value {
    font-size: 24px;
  }
  
  .circular-label {
    font-size: 12px;
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

// Static options with updated y-axis configuration for Applications chart
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
      ticks: {
        stepSize: 10,
        max: 100
      }
    }
  }
};

const staticApplicationsBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { 
      beginAtZero: true, 
      grid: { drawBorder: false },
      ticks: {
        callback: function(value) {
          return value % 10 === 0 ? value : '';
        },
        max: 100,
        stepSize: 10
      },
      max: 100
    }
  }
};

const staticCoFundersBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { 
      beginAtZero: true, 
      grid: { drawBorder: false },
      ticks: {
        callback: function(value) {
          return value % 10 === 0 ? value : '';
        },
        max: 100,
        stepSize: 10
      },
      max: 100
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
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { drawBorder: false } }
  }
};

// UPDATED: Fetch investor applications data with proper pipeline stage mapping
const fetchInvestorApplicationsData = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log("❌ No authenticated user");
      return {
        application: 0,
        evaluation: 0,
        dealClosed: 0,
        withdrawnDeclined: 0,
        totalApplications: 0,
        loading: false,
        usingFallback: false
      };
    }

    console.log('🔍 Fetching applications for investor:', currentUser.uid);
    
    // Get all investorApplications where funderId matches current user
    const q = query(
      collection(db, "investorApplications"),
      where("funderId", "==", currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    console.log('📊 Found applications for this funder:', querySnapshot.docs.length);
    
    if (querySnapshot.empty) {
      console.log('❌ No applications found for this funder');
      return {
        application: 0,
        evaluation: 0,
        dealClosed: 0,
        withdrawnDeclined: 0,
        totalApplications: 0,
        loading: false,
        usingFallback: false
      };
    }
    
    // Count applications by stage - MATCHING YOUR PIPELINE STAGES
    let application = 0;
    let evaluation = 0;
    let dealClosed = 0;
    let withdrawnDeclined = 0;
    
    querySnapshot.docs.forEach(doc => {
      const applicationData = doc.data();
      const stage = applicationData.pipelineStage || applicationData.stage;
      
      console.log('📄 Application data:', {
        stage: stage,
        smeId: applicationData.smeId,
        funderId: applicationData.funderId
      });
      
      // CATEGORIZATION LOGIC matching your InvestorSMETable component:
      if (stage === "Deal Complete") {
        dealClosed++;
      } else if (stage === "Deal Declined" || stage === "Declined") {
        withdrawnDeclined++;
      } else if (stage === "Application Received" || stage === "Application Sent" || !stage) {
        application++;
      } else {
        // All other stages fall under Evaluation
        // This includes: "Under Review", "Due Diligence", "Funding Approved", "Termsheet"
        evaluation++;
      }
    });
    
    const totalApplications = application + evaluation + dealClosed + withdrawnDeclined;
    
    console.log('📈 Application counts for funder:', {
      application,
      evaluation,
      dealClosed,
      withdrawnDeclined,
      totalApplications
    });
    
    return {
      application,
      evaluation,
      dealClosed,
      withdrawnDeclined,
      totalApplications,
      loading: false,
      usingFallback: false
    };
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch investor applications:', error);
    return {
      application: 0,
      evaluation: 0,
      dealClosed: 0,
      withdrawnDeclined: 0,
      totalApplications: 0,
      loading: false,
      usingFallback: true
    };
  }
};

// UPDATED: Fetch estimated review time from MyuniversalProfiles
const fetchEstimatedReviewTime = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log("❌ No authenticated user");
      return {
        averageDays: 0,
        usingFallback: true
      };
    }

    console.log('🔍 Fetching estimated review time for investor:', currentUser.uid);
    
    // Get the investor's MyuniversalProfiles (not universalProfiles for investors)
    const universalProfileRef = doc(db, "MyuniversalProfiles", currentUser.uid);
    const universalProfileSnap = await getDoc(universalProfileRef);
    
    if (!universalProfileSnap.exists()) {
      console.log('❌ No MyuniversalProfiles found for investor');
      return {
        averageDays: 0,
        usingFallback: true
      };
    }
    
    const profileData = universalProfileSnap.data();
    const formData = profileData.formData;
    
    // Check different possible locations for estimated review time
    const estimatedReviewTime = formData?.applicationBrief?.estimatedReviewTime || 
                               formData?.estimatedReviewTime || 
                               "2-4 weeks"; // Default fallback
    
    console.log('📋 Estimated review time found:', estimatedReviewTime);
    
    // Parse the estimated review time
    let averageDays = 14; // Default 2 weeks
    
    if (typeof estimatedReviewTime === 'string') {
      if (estimatedReviewTime.includes('week')) {
        const weekMatch = estimatedReviewTime.match(/(\d+)-?(\d+)?\s*week/);
        if (weekMatch) {
          const minWeeks = parseInt(weekMatch[1]);
          const maxWeeks = weekMatch[2] ? parseInt(weekMatch[2]) : minWeeks;
          averageDays = Math.round(((minWeeks + maxWeeks) / 2) * 7);
        }
      } else if (estimatedReviewTime.includes('day')) {
        const dayMatch = estimatedReviewTime.match(/(\d+)-?(\d+)?\s*day/);
        if (dayMatch) {
          const minDays = parseInt(dayMatch[1]);
          const maxDays = dayMatch[2] ? parseInt(dayMatch[2]) : minDays;
          averageDays = Math.round((minDays + maxDays) / 2);
        }
      } else {
        const numberMatch = estimatedReviewTime.match(/(\d+)/);
        if (numberMatch) {
          averageDays = parseInt(numberMatch[1]);
        }
      }
    } else if (typeof estimatedReviewTime === 'number') {
      averageDays = estimatedReviewTime;
    }
    
    // Ensure reasonable value
    if (averageDays <= 0 || averageDays > 365) {
      averageDays = 14;
    }
    
    console.log('📈 Final estimated review time in days:', averageDays);
    
    return {
      averageDays,
      usingFallback: false
    };
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch estimated review time:', error);
    return {
      averageDays: 0,
      usingFallback: true
    };
  }
};

// UPDATED: Fetch average approved funding amount from successful deals
const fetchAverageApprovedFunding = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log("❌ No authenticated user");
      return {
        averageFunding: 0,
        totalFunding: 0,
        fundedDeals: 0,
        usingFallback: true
      };
    }

    console.log('🔍 Fetching approved funding data for investor:', currentUser.uid);
    
    // Get successful deals
    const q = query(
      collection(db, "investorApplications"),
      where("funderId", "==", currentUser.uid),
      where("pipelineStage", "==", "Deal Complete")
    );

    const querySnapshot = await getDocs(q);
    console.log('📊 Found successful deals for funding calculation:', querySnapshot.docs.length);
    
    if (querySnapshot.empty) {
      console.log('❌ No successful deals found');
      return {
        averageFunding: 0,
        totalFunding: 0,
        fundedDeals: 0,
        usingFallback: false
      };
    }
    
    // Calculate total and average approved funding
    let totalFunding = 0;
    let fundedDeals = 0;
    
    querySnapshot.docs.forEach(doc => {
      const applicationData = doc.data();
      const fundingDetails = applicationData.fundingDetails;
      
      console.log('💰 Funding data:', {
        amountApproved: fundingDetails?.amountApproved,
        smeId: applicationData.smeId
      });
      
      // Extract approved funding amount
      if (fundingDetails && fundingDetails.amountApproved) {
        let amount = fundingDetails.amountApproved;
        
        if (typeof amount === 'string') {
          // Remove "R" and commas, then convert to number
          amount = parseFloat(amount.replace(/[R,]/g, '').trim());
        }
        
        if (!isNaN(amount) && amount > 0) {
          totalFunding += amount;
          fundedDeals++;
          console.log(`✅ Added funding amount: R${amount} for SME: ${applicationData.smeId}`);
        }
      } else {
        // If no fundingDetails, try to get from useOfFunds
        const smeProfileRef = doc(db, "universalProfiles", applicationData.smeId);
        getDoc(smeProfileRef).then(smeProfileSnap => {
          if (smeProfileSnap.exists()) {
            const smeData = smeProfileSnap.data();
            const amountRequested = smeData.useOfFunds?.amountRequested;
            if (amountRequested) {
              let amount = amountRequested;
              if (typeof amount === 'string') {
                amount = parseFloat(amount.replace(/[R,]/g, '').trim());
              }
              if (!isNaN(amount) && amount > 0) {
                totalFunding += amount;
                fundedDeals++;
              }
            }
          }
        });
      }
    });
    
    const averageFunding = fundedDeals > 0 ? Math.round(totalFunding / fundedDeals) : 0;
    
    console.log('📈 Approved funding data:', {
      averageFunding,
      totalFunding,
      fundedDeals
    });
    
    return {
      averageFunding,
      totalFunding,
      fundedDeals,
      usingFallback: false
    };
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch approved funding data:', error);
    return {
      averageFunding: 0,
      totalFunding: 0,
      fundedDeals: 0,
      usingFallback: true
    };
  }
};

// UPDATED: Fetch Co-Funders data with cap-table integration
const fetchCoFundersData = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log("❌ No authenticated user");
      return {
        smeCoFunders: [],
        loading: false,
        usingFallback: false
      };
    }

    console.log('🔍 Fetching Co-Funders data for investor:', currentUser.uid);
    
    // Get successful deals
    const applicationsQuery = query(
      collection(db, "investorApplications"),
      where("funderId", "==", currentUser.uid),
      where("pipelineStage", "==", "Deal Complete")
    );

    const applicationsSnapshot = await getDocs(applicationsQuery);
    console.log('📊 Found successful deals:', applicationsSnapshot.docs.length);
    
    if (applicationsSnapshot.empty) {
      console.log('❌ No successful deals found');
      return {
        smeCoFunders: [],
        loading: false,
        usingFallback: false
      };
    }
    
    const smeCoFunders = [];
    
    // Process each successful deal
    for (const applicationDoc of applicationsSnapshot.docs) {
      const applicationData = applicationDoc.data();
      const smeId = applicationData.smeId;
      
      console.log('🔍 Processing SME:', smeId);
      
      try {
        // Get SME registeredName from universalProfiles
        const smeProfileRef = doc(db, "universalProfiles", smeId);
        const smeProfileSnap = await getDoc(smeProfileRef);
        
        if (!smeProfileSnap.exists()) {
          console.log('❌ No universal profile found for SME:', smeId);
          // Use smeName from application as fallback
          const registeredName = applicationData.smeName || `SME-${smeId.substring(0, 8)}`;
          smeCoFunders.push({
            registeredName,
            coFunderCount: 1
          });
          continue;
        }
        
        const smeProfileData = smeProfileSnap.data();
        const registeredName = smeProfileData.entityOverview?.registeredName ||
                              smeProfileData.entityOverview?.tradingName ||
                              applicationData.smeName || 
                              `SME-${smeId.substring(0, 8)}`;
        
        console.log('🏢 Found registered name:', registeredName);
        
        // Get cap-table data for this SME
        const capTableQuery = query(
          collection(db, "cap-table"),
          where("smeId", "==", smeId)
        );
        
        const capTableSnapshot = await getDocs(capTableQuery);
        
        let coFunderCount = 1; // At least the current user
        
        if (!capTableSnapshot.empty) {
          capTableSnapshot.docs.forEach(capTableDoc => {
            const capTableData = capTableDoc.data();
            const investors = capTableData.investors || [];
            
            console.log('👥 Raw investors array:', investors);
            
            // Count unique investors (excluding current user for now)
            const uniqueInvestors = new Set();
            investors.forEach(investor => {
              if (investor.investorId !== currentUser.uid) {
                uniqueInvestors.add(investor.investorId || investor.name);
              }
            });
            
            coFunderCount += uniqueInvestors.size;
          });
        }
        
        smeCoFunders.push({
          registeredName,
          coFunderCount
        });
        
        console.log('✅ Added SME to co-funders list:', {
          registeredName,
          coFunderCount
        });
        
      } catch (error) {
        console.error(`❌ ERROR processing SME ${smeId}:`, error);
        // Continue with next SME
        continue;
      }
    }
    
    console.log('📈 Final Co-Funders data:', smeCoFunders);
    
    return {
      smeCoFunders,
      loading: false,
      usingFallback: false
    };
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch co-funders data:', error);
    return {
      smeCoFunders: [],
      loading: false,
      usingFallback: true
    };
  }
};

// Fallback data generator
const getFallbackDataBasedOnUser = () => {
  const currentUser = auth.currentUser;
  const userHash = currentUser?.uid ? currentUser.uid.charCodeAt(0) % 4 : 0;
  
  const fallbackOptions = [
    { 
      applications: { application: 45, evaluation: 32, dealClosed: 18, withdrawnDeclined: 12, total: 107 },
      estimatedReviewTime: 12,
      averageFunding: 750000,
      coFunders: [
        { registeredName: "Tech Innovators Ltd", coFunderCount: 3 },
        { registeredName: "Green Energy Solutions", coFunderCount: 2 },
        { registeredName: "Urban Farms Co", coFunderCount: 4 },
        { registeredName: "Digital Marketing Pro", coFunderCount: 1 }
      ]
    },
    { 
      applications: { application: 38, evaluation: 28, dealClosed: 15, withdrawnDeclined: 8, total: 89 },
      estimatedReviewTime: 14,
      averageFunding: 820000,
      coFunders: [
        { registeredName: "Smart Manufacturing Inc", coFunderCount: 2 },
        { registeredName: "Eco Construction Ltd", coFunderCount: 3 },
        { registeredName: "Health Tech Solutions", coFunderCount: 1 },
        { registeredName: "Food Delivery Express", coFunderCount: 2 }
      ]
    },
    { 
      applications: { application: 52, evaluation: 35, dealClosed: 22, withdrawnDeclined: 14, total: 123 },
      estimatedReviewTime: 10,
      averageFunding: 680000,
      coFunders: [
        { registeredName: "AI Analytics Corp", coFunderCount: 4 },
        { registeredName: "Renewable Power Co", coFunderCount: 2 },
        { registeredName: "Mobile App Developers", coFunderCount: 3 },
        { registeredName: "Sustainable Products", coFunderCount: 1 }
      ]
    },
    { 
      applications: { application: 41, evaluation: 30, dealClosed: 16, withdrawnDeclined: 10, total: 97 },
      estimatedReviewTime: 13,
      averageFunding: 710000,
      coFunders: [
        { registeredName: "FinTech Solutions Ltd", coFunderCount: 2 },
        { registeredName: "Clean Energy Systems", coFunderCount: 3 },
        { registeredName: "E-commerce Platform", coFunderCount: 1 },
        { registeredName: "AgriTech Innovations", coFunderCount: 2 }
      ]
    }
  ];
  
  return fallbackOptions[userHash];
};

// Time-based data generation functions
const generateMonthlyData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    labels: months,
    applications: months.map(() => Math.floor(Math.random() * 20) + 5),
    funding: months.map(() => Math.floor(Math.random() * 500000) + 300000),
    coFunders: months.map(() => Math.floor(Math.random() * 5) + 1)
  };
};

const generateQuarterlyData = () => {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  return {
    labels: quarters,
    applications: quarters.map(() => Math.floor(Math.random() * 60) + 20),
    funding: quarters.map(() => Math.floor(Math.random() * 1500000) + 800000),
    coFunders: quarters.map(() => Math.floor(Math.random() * 8) + 2)
  };
};

const generateYearlyData = () => {
  const years = ['2020', '2021', '2022', '2023', '2024'];
  return {
    labels: years,
    applications: years.map(() => Math.floor(Math.random() * 200) + 50),
    funding: years.map(() => Math.floor(Math.random() * 5000000) + 2000000),
    coFunders: years.map(() => Math.floor(Math.random() * 15) + 5)
  };
};

const FunderHealthEfficiency = ({ openPopup, currentUser }) => {
  const [vettingTimeView, setVettingTimeView] = useState('Monthly');
  const [efficiencyData, setEfficiencyData] = useState({
    applications: { application: 0, evaluation: 0, dealClosed: 0, withdrawnDeclined: 0, total: 0 },
    estimatedReviewTime: 0,
    averageFunding: 0,
    totalFunding: 0,
    fundedDeals: 0,
    coFunders: [],
    loading: true,
    usingFallback: false
  });

  // Time-based data states
  const [timeBasedData, setTimeBasedData] = useState({
    monthly: generateMonthlyData(),
    quarterly: generateQuarterlyData(),
    yearly: generateYearlyData()
  });

  // Fetch efficiency data when component mounts or user changes
  useEffect(() => {
    const fetchEfficiencyData = async () => {
      if (!currentUser) {
        console.log('❌ No current user - cannot fetch data');
        const fallbackData = getFallbackDataBasedOnUser();
        setEfficiencyData({
          applications: fallbackData.applications,
          estimatedReviewTime: fallbackData.estimatedReviewTime,
          averageFunding: fallbackData.averageFunding,
          totalFunding: fallbackData.averageFunding * fallbackData.applications.dealClosed,
          fundedDeals: fallbackData.applications.dealClosed,
          coFunders: fallbackData.coFunders,
          loading: false,
          usingFallback: true
        });
        return;
      }
      
      console.log('🚀 Starting efficiency data fetch for investor:', currentUser.uid);
      setEfficiencyData(prev => ({ ...prev, loading: true }));
      
      try {
        const [applicationsData, reviewTimeData, fundingData, coFundersData] = await Promise.all([
          fetchInvestorApplicationsData(),
          fetchEstimatedReviewTime(),
          fetchAverageApprovedFunding(),
          fetchCoFundersData()
        ]);
        
        // Check if we got any real data
        const hasRealData = applicationsData.totalApplications > 0 || 
                          !applicationsData.usingFallback ||
                          fundingData.fundedDeals > 0;
        
        console.log('📊 Efficiency data fetch completed:', {
          hasRealData,
          applicationsData,
          reviewTimeData,
          fundingData,
          coFundersData
        });
        
        if (hasRealData) {
          console.log('✅ Using real data from Firebase');
          const fallbackData = getFallbackDataBasedOnUser();
          
          setEfficiencyData({
            applications: {
              application: applicationsData.application,
              evaluation: applicationsData.evaluation,
              dealClosed: applicationsData.dealClosed,
              withdrawnDeclined: applicationsData.withdrawnDeclined,
              total: applicationsData.totalApplications
            },
            estimatedReviewTime: reviewTimeData.averageDays > 0 ? reviewTimeData.averageDays : fallbackData.estimatedReviewTime,
            averageFunding: fundingData.averageFunding > 0 ? fundingData.averageFunding : fallbackData.averageFunding,
            totalFunding: fundingData.totalFunding,
            fundedDeals: fundingData.fundedDeals,
            coFunders: coFundersData.smeCoFunders.length > 0 ? coFundersData.smeCoFunders : fallbackData.coFunders,
            loading: false,
            usingFallback: false
          });
        } else {
          // Use fallback data if no real data found
          console.log('⚠️ Using fallback data - no real data found');
          const fallbackData = getFallbackDataBasedOnUser();
          setEfficiencyData({
            applications: fallbackData.applications,
            estimatedReviewTime: fallbackData.estimatedReviewTime,
            averageFunding: fallbackData.averageFunding,
            totalFunding: fallbackData.averageFunding * fallbackData.applications.dealClosed,
            fundedDeals: fallbackData.applications.dealClosed,
            coFunders: fallbackData.coFunders,
            loading: false,
            usingFallback: true
          });
        }
      } catch (error) {
        console.error('❌ ERROR fetching efficiency data:', error);
        // Use fallback data on error
        const fallbackData = getFallbackDataBasedOnUser();
        setEfficiencyData({
          applications: fallbackData.applications,
          estimatedReviewTime: fallbackData.estimatedReviewTime,
          averageFunding: fallbackData.averageFunding,
          totalFunding: fallbackData.averageFunding * fallbackData.applications.dealClosed,
          fundedDeals: fallbackData.applications.dealClosed,
          coFunders: fallbackData.coFunders,
          loading: false,
          usingFallback: true
        });
      }
    };
    
    fetchEfficiencyData();
  }, [currentUser]);

  // Time view data
  const getTimeData = (view) => {
    switch (view) {
      case 'Monthly': return timeBasedData.monthly;
      case 'Quarterly': return timeBasedData.quarterly;
      case 'Yearly': return timeBasedData.yearly;
      default: return timeBasedData.quarterly;
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

  // Applications Bar Chart
  const ApplicationsBarChart = ({ data, title, chartTitle, chartId }) => {
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">
            Application funnel analysis for your investment portfolio with real pipeline stage data
          </div>
          <div className="popup-chart">
            <Bar data={data} options={staticApplicationsBarOptions} />
          </div>
          <div className="popup-details">
            {data.labels.map((label, index) => (
              <div key={label} className="detail-item">
                <span className="detail-label">{label}:</span>
                <span className="detail-value">{data.datasets[0].data[index]} applications</span>
              </div>
            ))}
            <div className="detail-item" style={{borderLeftColor: '#5e3f26'}}>
              <span className="detail-label">Total Applications:</span>
              <span className="detail-value">{efficiencyData.applications.total}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Conversion Rate:</span>
              <span className="detail-value">
                {efficiencyData.applications.total > 0 
                  ? Math.round((efficiencyData.applications.dealClosed / efficiencyData.applications.total) * 100) 
                  : 0}%
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Data Source:</span>
              <span className="detail-value">
                {efficiencyData.usingFallback ? 'Sample Data' : 'Your Applications (Firebase)'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Pipeline Stages:</span>
              <span className="detail-value" style={{fontSize: '12px', textAlign: 'left'}}>
                • Application: Application Received/Sent<br/>
                • Evaluation: Under Review, Due Diligence, Funding Approved, Termsheet<br/>
                • Deal Closed: Deal Complete<br/>
                • Withdrawn/Declined: Deal Declined
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
          <button className="breakdown-icon-btn" onClick={handleEyeClick} title="View breakdown">
            <FiEye />
          </button>
        </div>
        <div className="chart-title-fixed">{chartTitle}</div>
        <div className="chart-area">
          {efficiencyData.loading ? (
            <div className="loading-state">Loading your applications...</div>
          ) : efficiencyData.applications.total === 0 ? (
            <div className="empty-state">
              <div>No applications found</div>
              <small>
                {efficiencyData.usingFallback ? 
                  'Showing sample application data' : 
                  'You have no investment applications yet'
                }
              </small>
            </div>
          ) : (
            <Bar data={data} options={staticApplicationsBarOptions} />
          )}
        </div>
      </div>
    );
  };

  // Vetting Time Circular Component
  const VettingTimeCircular = ({ value, target, title }) => {
    const handleEyeClick = () => {
      const timeData = getTimeData(vettingTimeView);
      
      openPopup(
        <div className="popup-content">
          <h3>Estimated Vetting Time - {vettingTimeView}</h3>
          <div className="popup-description">
            Your estimated review time for investment applications
          </div>
          <div className="popup-chart">
            <Line 
              data={generateLineData(timeData.labels, [
                { label: 'Vetting Time (Days)', values: timeData.labels.map(() => Math.floor(Math.random() * 10) + 5) }
              ])} 
              options={staticLineOptions} 
            />
          </div>
          <div className="popup-details">
            <div className="detail-item" style={{borderLeftColor: '#5e3f26'}}>
              <span className="detail-label">Current Estimated Review Time:</span>
              <span className="detail-value">{value} days</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Target:</span>
              <span className="detail-value">{target} days</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Data Source:</span>
              <span className="detail-value">
                {efficiencyData.usingFallback ? 'Sample Data' : 'Your Profile (MyuniversalProfiles)'}
              </span>
            </div>
          </div>
        </div>
      );
    };

    const efficiencyPercentage = value > 0 ? Math.max(0, Math.round(((target - value) / target) * 100 + 100)) : 0;

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button className="breakdown-icon-btn" onClick={handleEyeClick} title="View breakdown">
            <FiEye />
          </button>
        </div>
        
        <div className="circular-chart">
          <div className="circular-progress">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r="60"
                stroke="#e0e0e0"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="70"
                cy="70"
                r="60"
                stroke="#7d5a36"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="377"
                strokeDashoffset={377 - (377 * Math.min(value, 30)) / 30}
                transform="rotate(-90 70 70)"
              />
            </svg>
            <div className="circular-content">
              <div className="circular-value">{efficiencyData.loading ? '...' : value}</div>
              <div className="circular-label">Days</div>
            </div>
          </div>
          <div className="circular-target">
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

  // Average Funding Circular Component
  const AverageFundingCircular = ({ value, title }) => {
    const handleEyeClick = () => {
      const timeData = getTimeData(vettingTimeView);
      
      openPopup(
        <div className="popup-content">
          <h3>Average Approved Funding - {vettingTimeView}</h3>
          <div className="popup-description">
            Breakdown of average funding amounts approved for your successful investment deals
          </div>
          <div className="popup-chart">
            <Line 
              data={generateLineData(timeData.labels, [
                { label: 'Avg Funding (R)', values: timeData.funding.map(amount => Math.round(amount / 1000)) }
              ])} 
              options={{
                ...staticLineOptions,
                scales: {
                  ...staticLineOptions.scales,
                  y: {
                    ...staticLineOptions.scales.y,
                    ticks: {
                      callback: function(value) {
                        return 'R' + value + 'K';
                      }
                    }
                  }
                }
              }} 
            />
          </div>
          <div className="popup-details">
            <div className="detail-item" style={{borderLeftColor: '#5e3f26'}}>
              <span className="detail-label">Current Average Approved Funding:</span>
              <span className="detail-value">R{value.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Funding Approved:</span>
              <span className="detail-value">R{efficiencyData.totalFunding.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Funded SMEs:</span>
              <span className="detail-value">{efficiencyData.fundedDeals}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Data Source:</span>
              <span className="detail-value">
                {efficiencyData.usingFallback ? 'Sample Data' : 'Your Successful Deals (Firebase)'}
              </span>
            </div>
          </div>
        </div>
      );
    };

    const efficiencyPercentage = value > 0 ? Math.min(100, Math.round((value / 1000000) * 100)) : 0;

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button className="breakdown-icon-btn" onClick={handleEyeClick} title="View breakdown">
            <FiEye />
          </button>
        </div>
        
        <div className="circular-chart">
          <div className="circular-progress">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r="60"
                stroke="#e0e0e0"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="70"
                cy="70"
                r="60"
                stroke="#7d5a36"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="377"
                strokeDashoffset={377 - (377 * efficiencyPercentage) / 100}
                transform="rotate(-90 70 70)"
              />
            </svg>
            <div className="circular-content">
              <div className="circular-value">R{(value / 1000).toFixed(0)}K</div>
              <div className="circular-label">Avg. Funding</div>
            </div>
          </div>
          <div className="circular-target">
            Portfolio: {efficiencyData.fundedDeals} SMEs
            {efficiencyPercentage >= 75 ? (
              <FiArrowUp className="trend-icon up" />
            ) : (
              <FiArrowDown className="trend-icon down" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Co-Funders Bar Chart
  const CoFundersBarChart = ({ data, title, chartTitle, chartId }) => {
    const handleEyeClick = () => {
      const timeData = getTimeData(vettingTimeView);
      
      openPopup(
        <div className="popup-content">
          <h3>Co-Funders - {vettingTimeView}</h3>
          <div className="popup-description">
            Number of co-funders for each SME in your investment portfolio
          </div>
          <div className="popup-chart">
            <Bar data={data} options={staticCoFundersBarOptions} />
          </div>
          <div className="popup-details">
            {data.labels.map((label, index) => (
              <div key={label} className="detail-item">
                <span className="detail-label">{label}:</span>
                <span className="detail-value">{data.datasets[0].data[index]} co-funders</span>
              </div>
            ))}
            <div className="detail-item" style={{borderLeftColor: '#5e3f26'}}>
              <span className="detail-label">Total Funded SMEs:</span>
              <span className="detail-value">{efficiencyData.coFunders.length}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Average Co-Funders per SME:</span>
              <span className="detail-value">
                {efficiencyData.coFunders.length > 0 
                  ? (efficiencyData.coFunders.reduce((sum, sme) => sum + sme.coFunderCount, 0) / efficiencyData.coFunders.length).toFixed(1)
                  : 0}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Data Source:</span>
              <span className="detail-value">
                {efficiencyData.usingFallback ? 'Sample Data' : 'Portfolio & Cap Tables (Firebase)'}
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
          <button className="breakdown-icon-btn" onClick={handleEyeClick} title="View breakdown">
            <FiEye />
          </button>
        </div>
        <div className="chart-title-fixed">{chartTitle}</div>
        <div className="chart-area">
          {efficiencyData.loading ? (
            <div className="loading-state">Loading co-funders data...</div>
          ) : efficiencyData.coFunders.length === 0 ? (
            <div className="empty-state">
              <div>No co-funders data found</div>
              <small>
                {efficiencyData.usingFallback ? 
                  'Showing sample co-funders data' : 
                  'You have no successful deals with co-funders yet'
                }
              </small>
            </div>
          ) : (
            <Bar data={data} options={staticCoFundersBarOptions} />
          )}
        </div>
      </div>
    );
  };

  // Prepare co-funders data for chart
  const coFundersLabels = efficiencyData.coFunders.map(sme => 
    sme.registeredName.length > 15 ? sme.registeredName.substring(0, 15) + '...' : sme.registeredName
  );
  const coFundersData = efficiencyData.coFunders.map(sme => sme.coFunderCount);

  return (
    <div className="funder-efficiency">
      <div className="time-view-controls">
        <TimeViewSelector 
          currentView={vettingTimeView} 
          onViewChange={setVettingTimeView}
        />
      </div>
      
      <div className="funder-charts-grid-4x4">
        <ApplicationsBarChart
          data={generateBarData(
            ['Application', 'Evaluation', 'Deal Closed', 'Withdrawn/Declined'],
            [
              efficiencyData.applications.application,
              efficiencyData.applications.evaluation,
              efficiencyData.applications.dealClosed,
              efficiencyData.applications.withdrawnDeclined
            ],
            '# of apps',
            0
          )}
          title="Applications Reviewed vs Funded"
          chartTitle="Application funnel volumes"
          chartId="applications-reviewed"
        />

        <VettingTimeCircular
          value={efficiencyData.estimatedReviewTime}
          target={10}
          title="Avg. Vetting Time"
        />

        <AverageFundingCircular
          value={efficiencyData.averageFunding}
          title="Avg. Approved Funding"
        />

        <CoFundersBarChart
          data={generateBarData(
            coFundersLabels,
            coFundersData,
            '# of co-funders',
            2
          )}
          title="Co-Funders"
          chartTitle="Number of co-funders per SME"
          chartId="co-funders"
        />
      </div>
    </div>
  );
};

export default FunderHealthEfficiency;