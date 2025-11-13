// tabs/PortfolioComposition.js
import React, { useState, useEffect } from 'react';
import { Pie, Doughnut } from 'react-chartjs-2';
import { FiEye } from 'react-icons/fi';
import { db, auth } from '../../firebaseConfig'; 
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

// Styles for PortfolioComposition
const styles = `
.portfolio-composition {
  width: 100%;
}

.composition-charts-grid {
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

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.chart-title {
  margin: 0 0 10px 0;
  color: #6E260E;
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
  color: #7B3F00;
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
  color: #7B3F00;
  margin-bottom: 15px;
  text-align: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #7B3F00;
}

.chart-area {
  flex-grow: 1;
  min-height: 240px;
  position: relative;
  margin-bottom: 10px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #7B3F00;
  font-size: 16px;
  text-align: center;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
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
  color: #6E260E;
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
  border-left: 3px solid #7B3F00;
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
  border-left: 4px solid #7B3F00;
}

.detail-label {
  font-weight: 600;
  color: #6E260E;
  font-size: 14px;
}

.detail-value {
  font-weight: 600;
  color: #7B3F00;
  font-size: 14px;
}

/* Responsive Design */
@media (max-width: 992px) {
  .composition-charts-grid {
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
  
  .composition-charts-grid {
    padding: 0 5px;
  }
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// New brown color palette without dark/blackish colors
const brownShades = [
  '#6E260E', '#C19A6B', '#7B3F00', '#6F4E37', '#988558',
  '#C2B280', '#B87333', '#967969', '#C4A484', '#C2B280', 
  '#A0522D', '#D2B48C'
];

// Static options for pie charts
const staticPieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { 
    legend: { 
      position: 'bottom',
      labels: {
        padding: 15,
        usePointStyle: true,
        pointStyle: 'circle',
        font: {
          size: 11
        }
      }
    } 
  }
};

// Industry/Sector Mapping
const industrySectorMapping = {
  // Business, Finance & Consulting
  'Generalist': 'Business, Finance & Consulting',
  'Banking, Finance & Insurance': 'Business, Finance & Consulting',
  'Consulting': 'Business, Finance & Consulting',
  'Marketing / Advertising / PR': 'Business, Finance & Consulting',
  'Human Resources': 'Business, Finance & Consulting',
  'Sales': 'Business, Finance & Consulting',
  'Legal / Law': 'Business, Finance & Consulting',
  'Education & Training': 'Business, Finance & Consulting',
  'Property / Real Estate': 'Business, Finance & Consulting',
  
  // Technology & Engineering
  'Information Technology (IT)': 'Technology & Engineering',
  'Telecommunications': 'Technology & Engineering',
  'Engineering': 'Technology & Engineering',
  'Infrastructure': 'Technology & Engineering',
  'Science & Research': 'Technology & Engineering',
  
  // Logistics, Manufacturing & Industry
  'Logistics / Supply Chain': 'Logistics, Manufacturing & Industry',
  'Manufacturing': 'Logistics, Manufacturing & Industry',
  'Construction': 'Logistics, Manufacturing & Industry',
  'Transport': 'Logistics, Manufacturing & Industry',
  'Mining': 'Logistics, Manufacturing & Industry',
  'Energy': 'Logistics, Manufacturing & Industry',
  'Oil & Gas': 'Logistics, Manufacturing & Industry',
  'Utilities (Water, Electricity, Waste)': 'Logistics, Manufacturing & Industry',
  'Agriculture': 'Logistics, Manufacturing & Industry',
  
  // Media, Creative & Entertainment
  'Creative Arts / Design': 'Media, Creative & Entertainment',
  'Media / Journalism / Broadcasting': 'Media, Creative & Entertainment',
  'Sports / Recreation / Fitness': 'Media, Creative & Entertainment',
  'Hospitality / Tourism': 'Media, Creative & Entertainment',
  'Beauty / Cosmetics / Personal Care': 'Media, Creative & Entertainment',
  
  // Health, Environment & Community
  'Healthcare / Medical': 'Health, Environment & Community',
  'Environmental / Natural Sciences': 'Health, Environment & Community',
  'Social Services / Social Work': 'Health, Environment & Community',
  'Non-Profit / NGO': 'Health, Environment & Community',
  'Government / Public Sector': 'Health, Environment & Community',
  'Safety & Security / Police / Defence': 'Health, Environment & Community',
  
  // Other
  'Other': 'Other'
};

// UPDATED: Fetch Investor's Successful Deals - EXACT SAME LOGIC AS MyCohorts
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
    
    // STEP 1: Get all investorApplications where pipelineStage is "Deal Complete"
    // This is the EXACT same query as in MyCohorts
    const q = query(
      collection(db, "investorApplications"),
      where("pipelineStage", "==", "Deal Complete")
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
    
    querySnapshot.docs.forEach(doc => {
      const applicationData = doc.data();
      console.log('📄 Successful deal data:', {
        smeId: applicationData.smeId,
        investmentAmount: applicationData.fundingDetails?.amountApproved || applicationData.fundingRequired,
        pipelineStage: applicationData.pipelineStage,
        userId: applicationData.userId,
        investmentType: applicationData.fundingDetails?.investmentType || applicationData.investmentType
      });
      
      // Use the same logic as MyCohorts to get SME ID
      const smeId = applicationData.smeId || applicationData.userId;
      if (smeId) {
        smeIds.push(smeId);
        applications.push(applicationData);
        
        // Sum investment amounts using same logic as MyCohorts
        const investmentAmount = applicationData.fundingDetails?.amountApproved || applicationData.fundingRequired || 0;
        totalInvestment += investmentAmount;
      }
    });
    
    const uniqueSmeIds = [...new Set(smeIds)]; // Remove duplicates
    
    console.log('🏢 STEP 1: Unique SME IDs from successful deals:', uniqueSmeIds);
    console.log('💰 STEP 1: Total investment from successful deals:', totalInvestment);
    console.log('📄 STEP 1: Number of successful applications:', applications.length);
    
    return {
      smeIds: uniqueSmeIds,
      applications: applications,
      totalInvestment: totalInvestment
    };
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch investor successful deals:', error);
    return {
      smeIds: [],
      applications: [],
      totalInvestment: 0
    };
  }
};

// UPDATED: Fetch Lifecycle Stage Data from Successful Deals
const fetchLifecycleStageData = async () => {
  try {
    // First get the successful deals using the SAME logic as MyCohorts
    const successfulDeals = await fetchInvestorSuccessfulDeals();
    const { smeIds } = successfulDeals;
    
    console.log('🔍 STEP 1: Fetching lifecycle stages from successful deals. Total SMEs:', smeIds.length);
    
    if (smeIds.length === 0) {
      console.log('❌ STEP 1: No SMEs found in successful deals for lifecycle analysis');
      return {
        'Startup': 0,
        'Growth': 0,
        'Scaling': 0,
        'Turnaround': 0,
        'Mature': 0
      };
    }
    
    // Count SMEs by lifecycle stage
    const lifecycleCount = {
      'Startup': 0,
      'Growth': 0,
      'Scaling': 0,
      'Turnaround': 0,
      'Mature': 0
    };
    
    // STEP 2: Fetch operationStage for each SME from successful deals
    for (const smeId of smeIds) {
      try {
        console.log('🔍 STEP 2: Fetching profile for SME from successful deal:', smeId);
        const universalProfileRef = doc(db, "universalProfiles", smeId);
        const universalProfileSnap = await getDoc(universalProfileRef);
        
        if (universalProfileSnap.exists()) {
          const profileData = universalProfileSnap.data();
          const operationStage = profileData.entityOverview?.operationStage;
          
          console.log('📋 STEP 2: Operation stage for successful deal SME', smeId, ':', operationStage);
          
          if (operationStage && lifecycleCount.hasOwnProperty(operationStage)) {
            lifecycleCount[operationStage]++;
            console.log(`✅ STEP 2: Counted ${operationStage} from successful deal: ${lifecycleCount[operationStage]}`);
          } else {
            console.log('❌ STEP 2: Invalid operation stage for successful deal SME:', operationStage);
            // Count as "Growth" if operationStage is missing or invalid (same as MyCohorts logic)
            lifecycleCount['Growth']++;
          }
        } else {
          console.log('❌ STEP 2: Profile does not exist for successful deal SME:', smeId);
        }
      } catch (error) {
        console.error(`❌ STEP 2: Error processing lifecycle for SME ${smeId}:`, error);
      }
    }
    
    console.log('📈 FINAL: Lifecycle stage counts from successful deals:', lifecycleCount);
    console.log('📊 FINAL: Total successful SMEs processed for lifecycle:', smeIds.length);
    return lifecycleCount;
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch lifecycle stage data from successful deals:', error);
    return {
      'Startup': 0,
      'Growth': 0,
      'Scaling': 0,
      'Turnaround': 0,
      'Mature': 0
    };
  }
};

// UPDATED: Fetch Industry/Sector Data from Successful Deals
const fetchIndustrySectorData = async () => {
  try {
    // First get the successful deals using the SAME logic as MyCohorts
    const successfulDeals = await fetchInvestorSuccessfulDeals();
    const { smeIds } = successfulDeals;
    
    console.log('🔍 STEP 1: Fetching industry sectors from successful deals. Total SMEs:', smeIds.length);
    
    if (smeIds.length === 0) {
      console.log('❌ STEP 1: No SMEs found in successful deals for industry analysis');
      return {
        'Business, Finance & Consulting': 0,
        'Technology & Engineering': 0,
        'Logistics, Manufacturing & Industry': 0,
        'Media, Creative & Entertainment': 0,
        'Health, Environment & Community': 0,
        'Other': 0
      };
    }
    
    // Count SMEs by industry sector
    const industryCount = {
      'Business, Finance & Consulting': 0,
      'Technology & Engineering': 0,
      'Logistics, Manufacturing & Industry': 0,
      'Media, Creative & Entertainment': 0,
      'Health, Environment & Community': 0,
      'Other': 0
    };
    
    // STEP 2: Fetch economicSectors for each SME from successful deals
    for (const smeId of smeIds) {
      try {
        console.log('🔍 STEP 2: Fetching profile for SME from successful deal:', smeId);
        const universalProfileRef = doc(db, "universalProfiles", smeId);
        const universalProfileSnap = await getDoc(universalProfileRef);
        
        if (universalProfileSnap.exists()) {
          const profileData = universalProfileSnap.data();
          const economicSectors = profileData.entityOverview?.economicSectors || [];
          
          console.log('📋 STEP 2: Economic sectors for successful deal SME', smeId, ':', economicSectors);
          
          if (economicSectors.length > 0) {
            // Process each economic sector and map to broader categories
            let sectorCounted = false;
            economicSectors.forEach(sector => {
              const mappedSector = industrySectorMapping[sector] || 'Other';
              if (industryCount.hasOwnProperty(mappedSector)) {
                industryCount[mappedSector]++;
                sectorCounted = true;
                console.log(`✅ STEP 2: Mapped ${sector} → ${mappedSector}: ${industryCount[mappedSector]}`);
              }
            });
            
            // If no sectors were successfully mapped, count as "Other"
            if (!sectorCounted) {
              industryCount['Other']++;
              console.log(`✅ STEP 2: No valid sectors mapped, counted as Other: ${industryCount['Other']}`);
            }
          } else {
            console.log('❌ STEP 2: No economic sectors found for successful deal SME:', smeId);
            // Count as "Other" if no sectors specified
            industryCount['Other']++;
          }
        } else {
          console.log('❌ STEP 2: Profile does not exist for successful deal SME:', smeId);
        }
      } catch (error) {
        console.error(`❌ STEP 2: Error processing industry sectors for SME ${smeId}:`, error);
      }
    }
    
    console.log('📈 FINAL: Industry sector counts from successful deals:', industryCount);
    console.log('📊 FINAL: Total successful SMEs processed for industry sectors:', smeIds.length);
    return industryCount;
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch industry sector data from successful deals:', error);
    return {
      'Business, Finance & Consulting': 0,
      'Technology & Engineering': 0,
      'Logistics, Manufacturing & Industry': 0,
      'Media, Creative & Entertainment': 0,
      'Health, Environment & Community': 0,
      'Other': 0
    };
  }
};

// UPDATED: Fetch Geographic Data from Successful Deals - ALL 9 PROVINCES
const fetchGeographicData = async () => {
  try {
    // First get the successful deals using the SAME logic as MyCohorts
    const successfulDeals = await fetchInvestorSuccessfulDeals();
    const { smeIds } = successfulDeals;
    
    console.log('🔍 STEP 1: Fetching geographic data from successful deals. Total SMEs:', smeIds.length);
    
    if (smeIds.length === 0) {
      console.log('❌ STEP 1: No SMEs found in successful deals for geographic analysis');
      return {
        'Gauteng': 0,
        'Western Cape': 0,
        'KwaZulu-Natal': 0,
        'Eastern Cape': 0,
        'Limpopo': 0,
        'Mpumalanga': 0,
        'North West': 0,
        'Free State': 0,
        'Northern Cape': 0
      };
    }
    
    // Count SMEs by ALL 9 provinces
    const provinceCount = {
      'Gauteng': 0,
      'Western Cape': 0,
      'KwaZulu-Natal': 0,
      'Eastern Cape': 0,
      'Limpopo': 0,
      'Mpumalanga': 0,
      'North West': 0,
      'Free State': 0,
      'Northern Cape': 0
    };
    
    // STEP 2: Fetch province data for each SME from successful deals
    for (const smeId of smeIds) {
      try {
        console.log('🔍 STEP 2: Fetching profile for SME from successful deal:', smeId);
        const universalProfileRef = doc(db, "universalProfiles", smeId);
        const universalProfileSnap = await getDoc(universalProfileRef);
        
        if (universalProfileSnap.exists()) {
          const profileData = universalProfileSnap.data();
          const province = profileData.entityOverview?.province;
          
          console.log('📋 STEP 2: Province for successful deal SME', smeId, ':', province);
          
          if (province) {
            // Clean and standardize province names for ALL 9 provinces
            const provinceLower = province.toLowerCase().trim();
            
            if (provinceLower.includes('gauteng')) {
              provinceCount['Gauteng']++;
            } else if (provinceLower.includes('western cape') || provinceLower.includes('western_cape')) {
              provinceCount['Western Cape']++;
            } else if (provinceLower.includes('kwazulu') || provinceLower.includes('natal')) {
              provinceCount['KwaZulu-Natal']++;
            } else if (provinceLower.includes('eastern cape') || provinceLower.includes('eastern_cape')) {
              provinceCount['Eastern Cape']++;
            } else if (provinceLower.includes('limpopo')) {
              provinceCount['Limpopo']++;
            } else if (provinceLower.includes('mpumalanga')) {
              provinceCount['Mpumalanga']++;
            } else if (provinceLower.includes('north west') || provinceLower.includes('north_west')) {
              provinceCount['North West']++;
            } else if (provinceLower.includes('free state') || provinceLower.includes('free_state') || provinceLower.includes('freestate')) {
              provinceCount['Free State']++;
            } else if (provinceLower.includes('northern cape') || provinceLower.includes('northern_cape')) {
              provinceCount['Northern Cape']++;
            } else {
              // If province doesn't match any known province, distribute evenly for fallback
              provinceCount['Gauteng']++;
            }
          } else {
            console.log('❌ STEP 2: No province found for successful deal SME:', smeId);
            provinceCount['Gauteng']++; // Default to Gauteng if no province specified
          }
        } else {
          console.log('❌ STEP 2: Profile does not exist for successful deal SME:', smeId);
        }
      } catch (error) {
        console.error(`❌ STEP 2: Error processing province for SME ${smeId}:`, error);
        provinceCount['Gauteng']++; // Default to Gauteng on error
      }
    }
    
    console.log('📈 FINAL: Geographic distribution from successful deals (9 provinces):', provinceCount);
    return provinceCount;
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch geographic data from successful deals:', error);
    return {
      'Gauteng': 0,
      'Western Cape': 0,
      'KwaZulu-Natal': 0,
      'Eastern Cape': 0,
      'Limpopo': 0,
      'Mpumalanga': 0,
      'North West': 0,
      'Free State': 0,
      'Northern Cape': 0
    };
  }
};

// NEW: Fetch Funding Instrument Data from Successful Deals
const fetchFundingInstrumentData = async () => {
  try {
    // First get the successful deals using the SAME logic as MyCohorts
    const successfulDeals = await fetchInvestorSuccessfulDeals();
    const { applications } = successfulDeals;
    
    console.log('🔍 STEP 1: Fetching funding instrument data from successful deals. Total applications:', applications.length);
    
    if (applications.length === 0) {
      console.log('❌ STEP 1: No successful deals found for funding instrument analysis');
      return {
        'Equity': 0,
        'Debt': 0,
        'Grant': 0,
        'Other': 0
      };
    }
    
    // Count applications by funding instrument
    const fundingCount = {
      'Equity': 0,
      'Debt': 0,
      'Grant': 0,
      'Other': 0
    };
    
    // STEP 2: Process each successful application to get investment type
    applications.forEach(application => {
      const investmentType = application.fundingDetails?.investmentType || application.investmentType;
      
      console.log('📋 STEP 2: Investment type for successful deal:', investmentType);
      
      if (investmentType) {
        const typeLower = investmentType.toLowerCase().trim();
        
        if (typeLower === 'equity') {
          fundingCount['Equity']++;
        } else if (typeLower === 'debt') {
          fundingCount['Debt']++;
        } else if (typeLower === 'grant') {
          fundingCount['Grant']++;
        } else {
          fundingCount['Other']++;
        }
      } else {
        console.log('❌ STEP 2: No investment type found for successful deal');
        fundingCount['Other']++;
      }
    });
    
    console.log('📈 FINAL: Funding instrument counts from successful deals:', fundingCount);
    return fundingCount;
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch funding instrument data from successful deals:', error);
    return {
      'Equity': 0,
      'Debt': 0,
      'Grant': 0,
      'Other': 0
    };
  }
};

// NEW: Fetch Demographic/Ownership Data from Successful Deals
const fetchDemographicOwnershipData = async () => {
  try {
    // First get the successful deals using the SAME logic as MyCohorts
    const successfulDeals = await fetchInvestorSuccessfulDeals();
    const { smeIds } = successfulDeals;
    
    console.log('🔍 STEP 1: Fetching demographic/ownership data from successful deals. Total SMEs:', smeIds.length);
    
    if (smeIds.length === 0) {
      console.log('❌ STEP 1: No SMEs found in successful deals for demographic analysis');
      return {
        'Women-led': 0,
        'Youth-led': 0,
        'Black-owned': 0,
        'Other': 0
      };
    }
    
    // Count SMEs by demographic categories
    const demographicCount = {
      'Women-led': 0,
      'Youth-led': 0,
      'Black-owned': 0,
      'Other': 0
    };
    
    // STEP 2: Fetch ownership data for each SME from successful deals
    for (const smeId of smeIds) {
      try {
        console.log('🔍 STEP 2: Fetching profile for SME from successful deal:', smeId);
        const universalProfileRef = doc(db, "universalProfiles", smeId);
        const universalProfileSnap = await getDoc(universalProfileRef);
        
        if (universalProfileSnap.exists()) {
          const profileData = universalProfileSnap.data();
          const shareholders = profileData.ownershipManagement?.shareholders || [];
          
          console.log('📋 STEP 2: Shareholders for successful deal SME', smeId, ':', shareholders);
          
          if (shareholders.length > 0) {
            // Find the shareholder with the highest shareholding (owner)
            let highestShareholder = null;
            let highestShareholding = 0;
            
            shareholders.forEach(shareholder => {
              const shareholding = parseFloat(shareholder.shareholding) || 0;
              if (shareholding > highestShareholding) {
                highestShareholding = shareholding;
                highestShareholder = shareholder;
              }
            });
            
            console.log('👑 STEP 2: Highest shareholder for SME', smeId, ':', highestShareholder);
            
            if (highestShareholder) {
              // Check demographic characteristics of the main owner
              const gender = highestShareholder.gender;
              const isYouth = highestShareholder.isYouth;
              const race = highestShareholder.race;
              
              console.log('📊 STEP 2: Owner demographics for SME', smeId, ':', {
                gender,
                isYouth,
                race,
                shareholding: highestShareholding
              });
              
              // Count demographic categories (can be multiple)
              if (gender && gender.toLowerCase() === 'female') {
                demographicCount['Women-led']++;
              }
              
              if (isYouth === true) {
                demographicCount['Youth-led']++;
              }
              
              if (race && race.toLowerCase() === 'black') {
                demographicCount['Black-owned']++;
              }
              
              // If none of the above categories apply, count as "Other"
              if (!gender || gender.toLowerCase() !== 'female') {
                if (isYouth !== true) {
                  if (!race || race.toLowerCase() !== 'black') {
                    demographicCount['Other']++;
                  }
                }
              }
            } else {
              console.log('❌ STEP 2: No valid shareholder found for SME:', smeId);
              demographicCount['Other']++;
            }
          } else {
            console.log('❌ STEP 2: No shareholders found for successful deal SME:', smeId);
            demographicCount['Other']++;
          }
        } else {
          console.log('❌ STEP 2: Profile does not exist for successful deal SME:', smeId);
        }
      } catch (error) {
        console.error(`❌ STEP 2: Error processing demographic data for SME ${smeId}:`, error);
        demographicCount['Other']++;
      }
    }
    
    console.log('📈 FINAL: Demographic/ownership counts from successful deals:', demographicCount);
    return demographicCount;
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch demographic/ownership data from successful deals:', error);
    return {
      'Women-led': 0,
      'Youth-led': 0,
      'Black-owned': 0,
      'Other': 0
    };
  }
};

// FALLBACK DATA for when investor has no successful deals - UPDATED FOR 9 PROVINCES
const getFallbackDataBasedOnUser = () => {
  const currentUser = auth.currentUser;
  const userHash = currentUser?.uid ? currentUser.uid.charCodeAt(0) % 4 : 0;
  
  const fallbackOptions = [
    { 
      lifecycle: { 'Startup': 22, 'Growth': 41, 'Scaling': 27, 'Turnaround': 5, 'Mature': 5 },
      industry: { 
        'Business, Finance & Consulting': 28, 
        'Technology & Engineering': 24, 
        'Logistics, Manufacturing & Industry': 20, 
        'Media, Creative & Entertainment': 18, 
        'Health, Environment & Community': 8, 
        'Other': 2 
      },
      geography: { 
        'Gauteng': 35, 'Western Cape': 20, 'KwaZulu-Natal': 15, 'Eastern Cape': 8,
        'Limpopo': 6, 'Mpumalanga': 7, 'North West': 4, 'Free State': 3, 'Northern Cape': 2
      },
      funding: { 'Equity': 45, 'Debt': 30, 'Grant': 15, 'Other': 10 },
      demographic: { 'Women-led': 38, 'Youth-led': 24, 'Black-owned': 72, 'Other': 16 }
    },
    { 
      lifecycle: { 'Startup': 18, 'Growth': 45, 'Scaling': 25, 'Turnaround': 7, 'Mature': 5 },
      industry: { 
        'Business, Finance & Consulting': 25, 
        'Technology & Engineering': 30, 
        'Logistics, Manufacturing & Industry': 22, 
        'Media, Creative & Entertainment': 15, 
        'Health, Environment & Community': 6, 
        'Other': 2 
      },
      geography: { 
        'Gauteng': 40, 'Western Cape': 18, 'KwaZulu-Natal': 12, 'Eastern Cape': 7,
        'Limpopo': 5, 'Mpumalanga': 8, 'North West': 5, 'Free State': 3, 'Northern Cape': 2
      },
      funding: { 'Equity': 50, 'Debt': 25, 'Grant': 20, 'Other': 5 },
      demographic: { 'Women-led': 42, 'Youth-led': 28, 'Black-owned': 68, 'Other': 12 }
    },
    { 
      lifecycle: { 'Startup': 25, 'Growth': 38, 'Scaling': 22, 'Turnaround': 10, 'Mature': 5 },
      industry: { 
        'Business, Finance & Consulting': 22, 
        'Technology & Engineering': 20, 
        'Logistics, Manufacturing & Industry': 28, 
        'Media, Creative & Entertainment': 20, 
        'Health, Environment & Community': 8, 
        'Other': 2 
      },
      geography: { 
        'Gauteng': 30, 'Western Cape': 22, 'KwaZulu-Natal': 14, 'Eastern Cape': 9,
        'Limpopo': 7, 'Mpumalanga': 6, 'North West': 6, 'Free State': 4, 'Northern Cape': 2
      },
      funding: { 'Equity': 40, 'Debt': 35, 'Grant': 10, 'Other': 15 },
      demographic: { 'Women-led': 35, 'Youth-led': 32, 'Black-owned': 75, 'Other': 18 }
    },
    { 
      lifecycle: { 'Startup': 20, 'Growth': 42, 'Scaling': 24, 'Turnaround': 8, 'Mature': 6 },
      industry: { 
        'Business, Finance & Consulting': 30, 
        'Technology & Engineering': 26, 
        'Logistics, Manufacturing & Industry': 18, 
        'Media, Creative & Entertainment': 16, 
        'Health, Environment & Community': 8, 
        'Other': 2 
      },
      geography: { 
        'Gauteng': 38, 'Western Cape': 16, 'KwaZulu-Natal': 13, 'Eastern Cape': 8,
        'Limpopo': 6, 'Mpumalanga': 7, 'North West': 5, 'Free State': 4, 'Northern Cape': 3
      },
      funding: { 'Equity': 35, 'Debt': 40, 'Grant': 15, 'Other': 10 },
      demographic: { 'Women-led': 45, 'Youth-led': 20, 'Black-owned': 65, 'Other': 20 }
    }
  ];
  
  return fallbackOptions[userHash];
};

const PortfolioComposition = ({ openPopup }) => {
  const [compositionData, setCompositionData] = useState({
    lifecycle: { 'Startup': 0, 'Growth': 0, 'Scaling': 0, 'Turnaround': 0, 'Mature': 0 },
    industry: { 
      'Business, Finance & Consulting': 0, 
      'Technology & Engineering': 0, 
      'Logistics, Manufacturing & Industry': 0, 
      'Media, Creative & Entertainment': 0, 
      'Health, Environment & Community': 0, 
      'Other': 0 
    },
    geography: { 
      'Gauteng': 0, 'Western Cape': 0, 'KwaZulu-Natal': 0, 'Eastern Cape': 0,
      'Limpopo': 0, 'Mpumalanga': 0, 'North West': 0, 'Free State': 0, 'Northern Cape': 0
    },
    funding: { 'Equity': 0, 'Debt': 0, 'Grant': 0, 'Other': 0 },
    demographic: { 'Women-led': 0, 'Youth-led': 0, 'Black-owned': 0, 'Other': 0 },
    loading: true,
    usingFallback: false,
    totalSMEs: 0,
    totalApplications: 0
  });

  // Fetch composition data when component mounts
  useEffect(() => {
    const fetchCompositionData = async () => {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log('❌ No current user found - cannot fetch data');
        const fallbackData = getFallbackDataBasedOnUser();
        setCompositionData({
          lifecycle: fallbackData.lifecycle,
          industry: fallbackData.industry,
          geography: fallbackData.geography,
          funding: fallbackData.funding,
          demographic: fallbackData.demographic,
          loading: false,
          usingFallback: true,
          totalSMEs: Object.values(fallbackData.lifecycle).reduce((a, b) => a + b, 0),
          totalApplications: Object.values(fallbackData.funding).reduce((a, b) => a + b, 0)
        });
        return;
      }
      
      console.log('🚀 STARTING COMPOSITION DATA FETCH FOR SUCCESSFUL DEALS - User:', currentUser.uid);
      setCompositionData(prev => ({ ...prev, loading: true }));
      
      try {
        const [lifecycleData, industryData, geographicData, fundingData, demographicData] = await Promise.all([
          fetchLifecycleStageData(),
          fetchIndustrySectorData(),
          fetchGeographicData(),
          fetchFundingInstrumentData(),
          fetchDemographicOwnershipData()
        ]);
        
        // Check if we got any real data from successful deals
        const totalLifecycleSMEs = Object.values(lifecycleData).reduce((a, b) => a + b, 0);
        const totalIndustrySMEs = Object.values(industryData).reduce((a, b) => a + b, 0);
        const totalApplications = Object.values(fundingData).reduce((a, b) => a + b, 0);
        const hasRealData = totalLifecycleSMEs > 0 || totalIndustrySMEs > 0 || totalApplications > 0;
        
        console.log('📊 COMPOSITION DATA FETCH COMPLETED:', {
          hasRealData,
          totalLifecycleSMEs,
          totalIndustrySMEs,
          totalApplications,
          lifecycleData,
          industryData,
          geographicData,
          fundingData,
          demographicData
        });
        
        if (hasRealData) {
          console.log('✅ USING REAL DATA FROM SUCCESSFUL DEALS');
          setCompositionData({
            lifecycle: lifecycleData,
            industry: industryData,
            geography: geographicData,
            funding: fundingData,
            demographic: demographicData,
            loading: false,
            usingFallback: false,
            totalSMEs: totalLifecycleSMEs,
            totalApplications: totalApplications
          });
        } else {
          // Use fallback data if no successful deals found
          console.log('⚠️ USING FALLBACK DATA - no successful deals found for this investor');
          const fallbackData = getFallbackDataBasedOnUser();
          setCompositionData({
            lifecycle: fallbackData.lifecycle,
            industry: fallbackData.industry,
            geography: fallbackData.geography,
            funding: fallbackData.funding,
            demographic: fallbackData.demographic,
            loading: false,
            usingFallback: true,
            totalSMEs: Object.values(fallbackData.lifecycle).reduce((a, b) => a + b, 0),
            totalApplications: Object.values(fallbackData.funding).reduce((a, b) => a + b, 0)
          });
        }
      } catch (error) {
        console.error('❌ ERROR fetching composition data:', error);
        // Use fallback data on error
        const fallbackData = getFallbackDataBasedOnUser();
        setCompositionData({
          lifecycle: fallbackData.lifecycle,
          industry: fallbackData.industry,
          geography: fallbackData.geography,
          funding: fallbackData.funding,
          demographic: fallbackData.demographic,
          loading: false,
          usingFallback: true,
          totalSMEs: Object.values(fallbackData.lifecycle).reduce((a, b) => a + b, 0),
          totalApplications: Object.values(fallbackData.funding).reduce((a, b) => a + b, 0)
        });
      }
    };
    
    fetchCompositionData();
  }, []);

  // Data generation functions for pie charts
  const generatePieData = (labels, data, startIndex = 0) => ({
    labels,
    datasets: [{
      data,
      backgroundColor: labels.map((_, index) => brownShades[(startIndex + index) % brownShades.length]),
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 8
    }]
  });

  // Pie Chart with Numbers ALWAYS visible
  const PieChartWithNumbers = ({ title, labels, data, chartId, startIndex = 0 }) => {
    const chartData = generatePieData(labels, data, startIndex);

    const plugins = [{
      id: 'centerText',
      afterDraw: (chart) => {
        const ctx = chart.ctx;
        
        chart.data.datasets.forEach((dataset, i) => {
          chart.getDatasetMeta(i).data.forEach((arc, index) => {
            const { x, y } = arc.tooltipPosition();
            
            ctx.save();
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dataset.data[index] + '%', x, y);
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
            Detailed percentage breakdown of {title.toLowerCase()} from your successful deals
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
            <div className="detail-item" style={{borderLeftColor: '#6E260E'}}>
              <span className="detail-label">Data Source:</span>
              <span className="detail-value">
                {compositionData.usingFallback ? 'Sample Portfolio' : 'Your Successful Deals'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total SMEs:</span>
              <span className="detail-value">{compositionData.totalSMEs}</span>
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
        <div className="chart-area">
          {compositionData.loading ? (
            <div className="loading-state">Loading your successful deals...</div>
          ) : compositionData.totalSMEs === 0 ? (
            <div className="empty-state">
              <div>No successful deals in your portfolio</div>
              <small>
                {compositionData.usingFallback ? 
                  'Showing sample portfolio composition' : 
                  'You have no Deal Complete investments yet'
                }
              </small>
            </div>
          ) : (
            <Doughnut data={chartData} options={staticPieOptions} plugins={plugins} />
          )}
        </div>
      </div>
    );
  };

  // Calculate percentages for lifecycle data
  const lifecyclePercentages = () => {
    const total = Object.values(compositionData.lifecycle).reduce((a, b) => a + b, 0);
    if (total === 0) return [22, 41, 27, 5, 5]; // Default fallback
    
    return [
      Math.round((compositionData.lifecycle.Startup / total) * 100),
      Math.round((compositionData.lifecycle.Growth / total) * 100),
      Math.round((compositionData.lifecycle.Scaling / total) * 100),
      Math.round((compositionData.lifecycle.Turnaround / total) * 100),
      Math.round((compositionData.lifecycle.Mature / total) * 100)
    ];
  };

  // Calculate percentages for industry data
  const industryPercentages = () => {
    const total = Object.values(compositionData.industry).reduce((a, b) => a + b, 0);
    if (total === 0) return [28, 24, 20, 18, 8, 2]; // Default fallback
    
    return [
      Math.round((compositionData.industry['Business, Finance & Consulting'] / total) * 100),
      Math.round((compositionData.industry['Technology & Engineering'] / total) * 100),
      Math.round((compositionData.industry['Logistics, Manufacturing & Industry'] / total) * 100),
      Math.round((compositionData.industry['Media, Creative & Entertainment'] / total) * 100),
      Math.round((compositionData.industry['Health, Environment & Community'] / total) * 100),
      Math.round((compositionData.industry['Other'] / total) * 100)
    ];
  };

  // Calculate percentages for geographic data - ALL 9 PROVINCES
  const geographicPercentages = () => {
    const total = Object.values(compositionData.geography).reduce((a, b) => a + b, 0);
    if (total === 0) return [35, 20, 15, 8, 6, 7, 4, 3, 2]; // Default fallback for 9 provinces
    
    return [
      Math.round((compositionData.geography.Gauteng / total) * 100),
      Math.round((compositionData.geography['Western Cape'] / total) * 100),
      Math.round((compositionData.geography['KwaZulu-Natal'] / total) * 100),
      Math.round((compositionData.geography['Eastern Cape'] / total) * 100),
      Math.round((compositionData.geography.Limpopo / total) * 100),
      Math.round((compositionData.geography.Mpumalanga / total) * 100),
      Math.round((compositionData.geography['North West'] / total) * 100),
      Math.round((compositionData.geography['Free State'] / total) * 100),
      Math.round((compositionData.geography['Northern Cape'] / total) * 100)
    ];
  };

  // Calculate percentages for funding instrument data
  const fundingInstrumentPercentages = () => {
    const total = Object.values(compositionData.funding).reduce((a, b) => a + b, 0);
    if (total === 0) return [45, 30, 15, 10]; // Default fallback
    
    return [
      Math.round((compositionData.funding.Equity / total) * 100),
      Math.round((compositionData.funding.Debt / total) * 100),
      Math.round((compositionData.funding.Grant / total) * 100),
      Math.round((compositionData.funding.Other / total) * 100)
    ];
  };

  // Calculate percentages for demographic data
  const demographicPercentages = () => {
    const total = Object.values(compositionData.demographic).reduce((a, b) => a + b, 0);
    if (total === 0) return [38, 24, 72, 16]; // Default fallback
    
    return [
      Math.round((compositionData.demographic['Women-led'] / total) * 100),
      Math.round((compositionData.demographic['Youth-led'] / total) * 100),
      Math.round((compositionData.demographic['Black-owned'] / total) * 100),
      Math.round((compositionData.demographic['Other'] / total) * 100)
    ];
  };

  // Get all 9 South African provinces in order
  const allProvinces = [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 
    'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'
  ];

  return (
    <div className="portfolio-composition">
      <div className="composition-charts-grid">
        <PieChartWithNumbers
          title="By Lifecycle Stage - Successful Deals"
          labels={['Startup', 'Growth', 'Scaling', 'Turnaround', 'Mature']}
          data={lifecyclePercentages()}
          chartId="lifecycle-stage"
          startIndex={0}
        />

        <PieChartWithNumbers
          title="By Industry / Sector - Successful Deals"
          labels={['Business, Finance & Consulting', 'Technology & Engineering', 'Logistics, Manufacturing & Industry', 'Media, Creative & Entertainment', 'Health, Environment & Community', 'Other']}
          data={industryPercentages()}
          chartId="industry-sector"
          startIndex={5}
        />

        <PieChartWithNumbers
          title="By Geography - Successful Deals"
          labels={allProvinces}
          data={geographicPercentages()}
          chartId="geography"
          startIndex={11}
        />

        <PieChartWithNumbers
          title="By Funding Instrument - Successful Deals"
          labels={['Equity', 'Debt', 'Grant', 'Other']}
          data={fundingInstrumentPercentages()}
          chartId="funding-instrument"
          startIndex={20}
        />

        <PieChartWithNumbers
          title="By Demographic / Ownership - Successful Deals"
          labels={['Women-led', 'Youth-led', 'Black-owned', 'Other']}
          data={demographicPercentages()}
          chartId="demographic-ownership"
          startIndex={24}
        />
      </div>
    </div>
  );
};

export default PortfolioComposition;