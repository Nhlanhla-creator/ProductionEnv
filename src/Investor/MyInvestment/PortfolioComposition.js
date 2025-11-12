// tabs/PortfolioComposition.js
import React, { useState, useEffect } from 'react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet';
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

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #7d5a36;
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

/* Fixed Map Container Styles */
.map-container-full {
  height: 100%;
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.map-container-full .leaflet-container {
  height: 100% !important;
  width: 100% !important;
  min-height: 300px;
}

/* Province Label Styles */
.province-label {
  position: absolute;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #5e3f26;
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: bold;
  font-size: 12px;
  color: #5e3f26;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  pointer-events: none;
}

.province-name {
  display: block;
  font-size: 10px;
  color: #7d5a36;
  margin-bottom: 2px;
}

.province-count {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #5e3f26;
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

.map-container-popup {
  height: 400px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
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
  
  .province-label {
    padding: 4px 8px;
    font-size: 10px;
  }
  
  .province-name {
    font-size: 8px;
  }
  
  .province-count {
    font-size: 11px;
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

// CORRECTED South Africa GeoJSON data with proper coordinates
const southAfricaGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "Gauteng",
      properties: { name: "Gauteng", value: 35, count: 0 },
      geometry: { 
        type: "Polygon", 
        coordinates: [[
          [27.5, -25.5], [28.5, -25.5], [28.5, -26.5], [27.5, -26.5], [27.5, -25.5]
        ]]
      }
    },
    {
      type: "Feature",
      id: "Western Cape",
      properties: { name: "Western Cape", value: 25, count: 0 },
      geometry: { 
        type: "Polygon", 
        coordinates: [[
          [18.0, -32.0], [19.5, -32.0], [19.5, -34.5], [18.0, -34.5], [18.0, -32.0]
        ]]
      }
    },
    {
      type: "Feature",
      id: "KwaZulu-Natal",
      properties: { name: "KwaZulu-Natal", value: 15, count: 0 },
      geometry: { 
        type: "Polygon", 
        coordinates: [[
          [29.0, -27.0], [31.5, -27.0], [31.5, -31.0], [29.0, -31.0], [29.0, -27.0]
        ]]
      }
    },
    {
      type: "Feature",
      id: "Eastern Cape",
      properties: { name: "Eastern Cape", value: 10, count: 0 },
      geometry: { 
        type: "Polygon", 
        coordinates: [[
          [24.0, -30.5], [27.5, -30.5], [27.5, -34.0], [24.0, -34.0], [24.0, -30.5]
        ]]
      }
    },
    {
      type: "Feature",
      id: "Other",
      properties: { name: "Other", value: 15, count: 0 },
      geometry: { 
        type: "Polygon", 
        coordinates: [[
          [22.0, -27.0], [25.0, -27.0], [25.0, -30.0], [22.0, -30.0], [22.0, -27.0]
        ]]
      }
    }
  ]
};

// Province coordinates for labels (centered within each province)
const provinceLabelCoordinates = {
  'Gauteng': [-26.0, 28.0],
  'Western Cape': [-33.5, 18.75],
  'KwaZulu-Natal': [-29.0, 30.25],
  'Eastern Cape': [-32.0, 25.75],
  'Other': [-28.5, 23.5]
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

// UPDATED: Fetch Geographic Data from Successful Deals - using province field
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
        'Other': 0
      };
    }
    
    // Count SMEs by province
    const provinceCount = {
      'Gauteng': 0,
      'Western Cape': 0,
      'KwaZulu-Natal': 0,
      'Eastern Cape': 0,
      'Other': 0
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
            // Clean and standardize province names
            const provinceLower = province.toLowerCase().trim();
            
            if (provinceLower.includes('gauteng')) {
              provinceCount['Gauteng']++;
            } else if (provinceLower.includes('western cape') || provinceLower.includes('western_cape')) {
              provinceCount['Western Cape']++;
            } else if (provinceLower.includes('kwazulu') || provinceLower.includes('natal')) {
              provinceCount['KwaZulu-Natal']++;
            } else if (provinceLower.includes('eastern cape') || provinceLower.includes('eastern_cape')) {
              provinceCount['Eastern Cape']++;
            } else {
              provinceCount['Other']++;
            }
          } else {
            console.log('❌ STEP 2: No province found for successful deal SME:', smeId);
            provinceCount['Other']++;
          }
        } else {
          console.log('❌ STEP 2: Profile does not exist for successful deal SME:', smeId);
        }
      } catch (error) {
        console.error(`❌ STEP 2: Error processing province for SME ${smeId}:`, error);
        provinceCount['Other']++;
      }
    }
    
    console.log('📈 FINAL: Geographic distribution from successful deals:', provinceCount);
    return provinceCount;
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch geographic data from successful deals:', error);
    return {
      'Gauteng': 0,
      'Western Cape': 0,
      'KwaZulu-Natal': 0,
      'Eastern Cape': 0,
      'Other': 0
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

// FALLBACK DATA for when investor has no successful deals
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
      geography: { 'Gauteng': 12, 'Western Cape': 8, 'KwaZulu-Natal': 5, 'Eastern Cape': 3, 'Other': 2 },
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
      geography: { 'Gauteng': 15, 'Western Cape': 7, 'KwaZulu-Natal': 6, 'Eastern Cape': 4, 'Other': 3 },
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
      geography: { 'Gauteng': 10, 'Western Cape': 9, 'KwaZulu-Natal': 4, 'Eastern Cape': 5, 'Other': 2 },
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
      geography: { 'Gauteng': 14, 'Western Cape': 6, 'KwaZulu-Natal': 5, 'Eastern Cape': 3, 'Other': 2 },
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
    geography: { 'Gauteng': 0, 'Western Cape': 0, 'KwaZulu-Natal': 0, 'Eastern Cape': 0, 'Other': 0 },
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

  // Chart Components
  const BarChartWithTitle = ({ data, title, chartTitle, chartId }) => {
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">
            Detailed breakdown of {title.toLowerCase()} from your successful deals
          </div>
          <div className="popup-chart">
            <Bar data={data} options={staticBarOptions} />
          </div>
          <div className="popup-details">
            {data.labels.map((label, index) => (
              <div key={label} className="detail-item">
                <span className="detail-label">{label}:</span>
                <span className="detail-value">{data.datasets[0].data[index]}%</span>
              </div>
            ))}
            <div className="detail-item" style={{borderLeftColor: '#5e3f26'}}>
              <span className="detail-label">Data Source:</span>
              <span className="detail-value">
                {compositionData.usingFallback ? 'Sample Portfolio' : 'Your Successful Deals'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Applications:</span>
              <span className="detail-value">{compositionData.totalApplications}</span>
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
          {compositionData.loading ? (
            <div className="loading-state">Loading your successful deals...</div>
          ) : compositionData.totalApplications === 0 ? (
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
            <Bar data={data} options={staticBarOptions} />
          )}
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
            <div className="detail-item" style={{borderLeftColor: '#5e3f26'}}>
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

  // Province Label Component
  const ProvinceLabel = ({ province, count, coordinates }) => {
    if (!coordinates) return null;
    
    return (
      <div 
        className="province-label"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(${coordinates[1] - 28}px, ${coordinates[0] + 32}px)`
        }}
      >
        <span className="province-name">{province}</span>
        <span className="province-count">{count} SMEs</span>
      </div>
    );
  };

  const GeographyMap = ({ title }) => {
    // Calculate percentages for geographic data
    const geographicPercentages = () => {
      const total = Object.values(compositionData.geography).reduce((a, b) => a + b, 0);
      if (total === 0) return [35, 25, 15, 10, 15]; // Default fallback
      
      return [
        Math.round((compositionData.geography.Gauteng / total) * 100),
        Math.round((compositionData.geography['Western Cape'] / total) * 100),
        Math.round((compositionData.geography['KwaZulu-Natal'] / total) * 100),
        Math.round((compositionData.geography['Eastern Cape'] / total) * 100),
        Math.round((compositionData.geography.Other / total) * 100)
      ];
    };

    const percentages = geographicPercentages();
    const actualCounts = compositionData.geography;
    
    // Create dynamic GeoJSON with actual counts
    const dynamicGeoJSON = {
      ...southAfricaGeoJSON,
      features: southAfricaGeoJSON.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          value: percentages[southAfricaGeoJSON.features.findIndex(f => f.id === feature.id)] || feature.properties.value,
          count: actualCounts[feature.id] || 0
        }
      }))
    };

    const getRegionColor = (value) => {
      if (value > 30) return brownShades[0];
      if (value > 20) return brownShades[1];
      if (value > 10) return brownShades[2];
      return brownShades[3];
    };

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Geographical Distribution - Successful Deals</h3>
          <div className="popup-description">
            Geographic distribution of SMEs from your successful investment deals across South Africa
          </div>
          <div className="popup-chart">
            <div className="map-container-popup">
              <MapContainer 
                center={[-28.5, 25.0]} 
                zoom={5} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer 
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <GeoJSON
                  key={JSON.stringify(actualCounts)} // Force re-render when data changes
                  data={dynamicGeoJSON}
                  style={(feature) => ({
                    fillColor: getRegionColor(feature.properties.value),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 0.7
                  })}
                  onEachFeature={(feature, layer) => {
                    layer.bindPopup(`
                      <div style="padding: 8px; text-align: center;">
                        <strong style="color: #5e3f26; font-size: 16px;">${feature.properties.name}</strong><br>
                        <span style="color: #7d5a36; font-size: 14px;">SMEs: ${feature.properties.count}</span><br>
                        <span style="color: #666; font-size: 12px;">Allocation: ${feature.properties.value}%</span>
                      </div>
                    `);
                  }}
                />
                
                {/* Add province labels */}
                {dynamicGeoJSON.features.map((feature) => (
                  feature.properties.count > 0 && (
                    <ProvinceLabel
                      key={feature.id}
                      province={feature.properties.name}
                      count={feature.properties.count}
                      coordinates={provinceLabelCoordinates[feature.id]}
                    />
                  )
                ))}
              </MapContainer>
            </div>
          </div>
          <div className="popup-details">
            {dynamicGeoJSON.features.map((feature) => (
              <div key={feature.properties.name} className="detail-item">
                <span className="detail-label">{feature.properties.name}:</span>
                <span className="detail-value">
                  {feature.properties.count} SMEs ({feature.properties.value}%)
                </span>
              </div>
            ))}
            <div className="detail-item" style={{borderLeftColor: '#5e3f26'}}>
              <span className="detail-label">Total SMEs:</span>
              <span className="detail-value">{compositionData.totalSMEs}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Data Source:</span>
              <span className="detail-value">
                {compositionData.usingFallback ? 'Sample Portfolio' : 'Your Successful Deals'}
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
            <div className="map-container-full">
              <MapContainer 
                center={[-28.5, 25.0]} 
                zoom={5} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer 
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <GeoJSON
                  key={JSON.stringify(actualCounts)} // Force re-render when data changes
                  data={dynamicGeoJSON}
                  style={(feature) => ({
                    fillColor: getRegionColor(feature.properties.value),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 0.7
                  })}
                  onEachFeature={(feature, layer) => {
                    layer.bindPopup(`
                      <div style="padding: 8px; text-align: center;">
                        <strong style="color: #5e3f26; font-size: 16px;">${feature.properties.name}</strong><br>
                        <span style="color: #7d5a36; font-size: 14px;">SMEs: ${feature.properties.count}</span><br>
                        <span style="color: #666; font-size: 12px;">Allocation: ${feature.properties.value}%</span>
                      </div>
                    `);
                  }}
                />
                
                {/* Add province labels */}
                {dynamicGeoJSON.features.map((feature) => (
                  feature.properties.count > 0 && (
                    <ProvinceLabel
                      key={feature.id}
                      province={feature.properties.name}
                      count={feature.properties.count}
                      coordinates={provinceLabelCoordinates[feature.id]}
                    />
                  )
                ))}
              </MapContainer>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Calculate percentages for lifecycle data
  const lifecyclePercentages = () => {
    const total = Object.values(compositionData.lifecycle).reduce((a, b) => a + b, 0);
    if (total === 0) return [0, 0, 0, 0, 0];
    
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
    if (total === 0) return [0, 0, 0, 0, 0, 0];
    
    return [
      Math.round((compositionData.industry['Business, Finance & Consulting'] / total) * 100),
      Math.round((compositionData.industry['Technology & Engineering'] / total) * 100),
      Math.round((compositionData.industry['Logistics, Manufacturing & Industry'] / total) * 100),
      Math.round((compositionData.industry['Media, Creative & Entertainment'] / total) * 100),
      Math.round((compositionData.industry['Health, Environment & Community'] / total) * 100),
      Math.round((compositionData.industry['Other'] / total) * 100)
    ];
  };

  // Calculate percentages for funding instrument data
  const fundingInstrumentPercentages = () => {
    const total = Object.values(compositionData.funding).reduce((a, b) => a + b, 0);
    if (total === 0) return [0, 0, 0, 0];
    
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

  return (
    <div className="portfolio-composition">
      <div className="composition-charts-grid">
        <PieChartWithNumbers
          title="By Lifecycle Stage - Successful Deals"
          labels={['Startup', 'Growth', 'Scaling', 'Turnaround', 'Mature']}
          data={lifecyclePercentages()}
          chartId="lifecycle-stage"
        />

        <BarChartWithTitle
          data={generateBarData(
            ['Business, Finance & Consulting', 'Technology & Engineering', 'Logistics, Manufacturing & Industry', 'Media, Creative & Entertainment', 'Health, Environment & Community', 'Other'],
            industryPercentages(),
            '% Portfolio',
            1
          )}
          title="By Industry / Sector - Successful Deals"
          chartTitle="Portfolio composition by sector (%)"
          chartId="industry-sector"
        />

        <GeographyMap title="By Geography - Successful Deals" />

        <BarChartWithTitle
          data={generateBarData(
            ['Equity', 'Debt', 'Grant', 'Other'],
            fundingInstrumentPercentages(),
            '% Applications',
            2
          )}
          title="By Funding Instrument - Successful Deals"
          chartTitle="Funding instrument allocation (%)"
          chartId="funding-instrument"
        />

        <PieChartWithNumbers
          title="By Demographic / Ownership - Successful Deals"
          labels={['Women-led', 'Youth-led', 'Black-owned', 'Other']}
          data={demographicPercentages()}
          chartId="demographic-ownership"
        />
      </div>
    </div>
  );
};

export default PortfolioComposition;