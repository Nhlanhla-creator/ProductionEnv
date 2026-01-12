// tabs/PortfolioOverview.js
import React, { useState, useEffect } from 'react';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import { FiEye, FiArrowUp, FiArrowDown, FiEdit, FiGrid, FiCheck } from 'react-icons/fi';
import { db, auth } from '../../firebaseConfig'; 
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
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

// Styles for PortfolioOverview (keep the same styles)
const styles = `
/* ... keep all the existing CSS styles ... */
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

const brownShades = [
  '#5e3f26', '#7d5a36', '#9c7c54', '#b8a082',
  '#3f2a18', '#d4c4b0', '#5D4037', '#3E2723'
];

// Static chart options (keep the same)
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

// Function to get financial year start month (keep the same)
const getFinancialYearStartMonth = async (userId) => {
  try {
    console.log('🔍 Fetching financial year start for user:', userId);
    
    const myUniversalProfileRef = doc(db, "MyuniversalProfiles", userId);
    const myUniversalProfileSnap = await getDoc(myUniversalProfileRef);
    
    if (myUniversalProfileSnap.exists()) {
      const profileData = myUniversalProfileSnap.data();
      console.log('📋 Full MyuniversalProfiles data:', profileData);
      
      const financialYearStart = profileData.formData?.fundManageOverview?.financialYearStart;
      
      console.log('📅 Financial year start found in MyuniversalProfiles:', financialYearStart);
      
      if (financialYearStart) {
        const monthNames = [
          'january', 'february', 'march', 'april', 'may', 'june',
          'july', 'august', 'september', 'october', 'november', 'december'
        ];
        
        const cleanedMonth = financialYearStart.trim().toLowerCase();
        const monthIndex = monthNames.findIndex(month => 
          month === cleanedMonth
        );
        
        if (monthIndex !== -1) {
          console.log(`✅ Financial year starts in month: ${monthIndex + 1} (${financialYearStart})`);
          return monthIndex;
        } else {
          console.log('❌ Month name not recognized:', financialYearStart);
          console.log('Available month names:', monthNames);
        }
      } else {
        console.log('❌ No financialYearStart found in formData.fundManageOverview');
        
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
    return 6;
  } catch (error) {
    console.error('❌ Error fetching financial year start:', error);
    return 6;
  }
};

// Function to calculate quarter based on financial year start (keep the same)
const getQuarterFromDate = (date, financialYearStartMonth) => {
  const month = date.getMonth();
  const adjustedMonth = (month - financialYearStartMonth + 12) % 12;
  
  console.log(`📅 Quarter calculation: Month ${month + 1}, Financial Start: ${financialYearStartMonth + 1}, Adjusted Month: ${adjustedMonth}`);
  
  if (adjustedMonth >= 0 && adjustedMonth <= 2) {
    console.log(`✅ Quarter 1: Months ${financialYearStartMonth + 1}-${(financialYearStartMonth + 3) % 12 || 12}`);
    return 0;
  }
  if (adjustedMonth >= 3 && adjustedMonth <= 5) {
    console.log(`✅ Quarter 2: Months ${(financialYearStartMonth + 3) % 12 + 1}-${(financialYearStartMonth + 6) % 12 || 12}`);
    return 1;
  }
  if (adjustedMonth >= 6 && adjustedMonth <= 8) {
    console.log(`✅ Quarter 3: Months ${(financialYearStartMonth + 6) % 12 + 1}-${(financialYearStartMonth + 9) % 12 || 12}`);
    return 2;
  }
  console.log(`✅ Quarter 4: Months ${(financialYearStartMonth + 9) % 12 + 1}-${(financialYearStartMonth) % 12 || 12}`);
  return 3;
};

// Function to parse amount string to number (keep the same)
const parseAmountToNumber = (amountString) => {
  if (!amountString) return 0;
  
  try {
    const numericString = amountString.replace(/[R,\s]/g, '');
    return parseFloat(numericString) || 0;
  } catch (error) {
    console.error('❌ Error parsing amount:', amountString, error);
    return 0;
  }
};

// Save user preferences to Firebase (keep the same)
const saveUserChartPreferences = async (userId, preferences) => {
  try {
    const userPrefsRef = doc(db, "userPreferences", userId);
    await setDoc(userPrefsRef, {
      portfolioChartPreferences: preferences,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('✅ Chart preferences saved to Firebase');
  } catch (error) {
    console.error('❌ Error saving chart preferences:', error);
  }
};

// Load user preferences from Firebase (keep the same)
const loadUserChartPreferences = async (userId) => {
  try {
    const userPrefsRef = doc(db, "userPreferences", userId);
    const userPrefsSnap = await getDoc(userPrefsRef);
    
    if (userPrefsSnap.exists()) {
      const preferences = userPrefsSnap.data().portfolioChartPreferences;
      console.log('✅ Chart preferences loaded from Firebase:', preferences);
      return preferences;
    } else {
      console.log('⚠️ No chart preferences found, using defaults');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading chart preferences:', error);
    return null;
  }
};

// UPDATED: Fetch support successful deals for catalyst/support users
const fetchSupportSuccessfulDeals = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log("❌ No authenticated user");
      return {
        smeIds: [],
        applications: [],
        totalSupportValue: 0
      };
    }

    console.log('🔍 STEP 1: Fetching successful support deals for catalyst:', currentUser.uid);
    
    // STEP 1: Get all catalystApplications where pipelineStage is "Active Support" OR "Support Approved"
    const q = query(
      collection(db, "catalystApplications"),
      where("catalystId", "==", currentUser.uid),
      where("status", "in", ["Active Support", "Support Approved", "Deal Closed"])
    );

    const querySnapshot = await getDocs(q);
    console.log('📊 STEP 1: Found successful support deals:', querySnapshot.docs.length);
    
    if (querySnapshot.empty) {
      console.log('❌ STEP 1: No successful support deals found');
      return {
        smeIds: [],
        applications: [],
        totalSupportValue: 0
      };
    }
    
    // Extract SME IDs and support data from successful applications
    const smeIds = [];
    const applications = [];
    let totalSupportValue = 0;
    const smeDetails = [];
    
    querySnapshot.docs.forEach(doc => {
      const applicationData = doc.data();
      console.log('📄 Support deal data:', {
        smeId: applicationData.smeId,
        programValue: applicationData.programValue,
        status: applicationData.status,
        catalystId: applicationData.catalystId,
        createdAt: applicationData.createdAt
      });
      
      // Use the SME ID from the application
      const smeId = applicationData.smeId;
      if (smeId) {
        smeIds.push(smeId);
        applications.push({
          ...applicationData,
          id: doc.id
        });
        
        // Parse program value (this might be different structure than funding)
        const supportValue = parseAmountToNumber(applicationData.programValue || "0");
        totalSupportValue += supportValue;
        
        // Store SME details for debugging
        smeDetails.push({
          smeId: smeId,
          value: supportValue,
          status: applicationData.status,
          createdAt: applicationData.createdAt
        });
      }
    });
    
    const uniqueSmeIds = [...new Set(smeIds)];
    
    console.log('🏢 STEP 1: Unique SME IDs from support deals:', uniqueSmeIds);
    console.log('💰 STEP 1: Total support value from deals:', totalSupportValue);
    console.log('📄 STEP 1: Number of successful applications:', applications.length);
    console.log('🔍 STEP 1: SME Details:', smeDetails);
    
    return {
      smeIds: uniqueSmeIds,
      applications: applications,
      totalSupportValue: totalSupportValue,
      smeDetails: smeDetails
    };
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch support successful deals:', error);
    return {
      smeIds: [],
      applications: [],
      totalSupportValue: 0,
      smeDetails: []
    };
  }
};

// UPDATED: Fetch active SMEs data for support users
const fetchActiveSMEsData = async () => {
  try {
    const successfulDeals = await fetchSupportSuccessfulDeals();
    const { smeIds, applications } = successfulDeals;
    
    console.log('🔍 STEP 2: Processing SMEs from support deals. Total SMEs:', smeIds.length);
    
    if (smeIds.length === 0) {
      console.log('❌ STEP 2: No SMEs found in support deals');
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
    
    // Fetch universal profiles for each SME from support deals
    for (const smeId of smeIds) {
      try {
        console.log('🔍 STEP 3: Fetching profile for SME from support deal:', smeId);
        const universalProfileRef = doc(db, "universalProfiles", smeId);
        const universalProfileSnap = await getDoc(universalProfileRef);
        
        if (universalProfileSnap.exists()) {
          const profileData = universalProfileSnap.data();
          console.log('📋 STEP 3: Profile data for support deal SME', smeId, ':', {
            entityOverview: profileData.entityOverview,
            entitySize: profileData.entityOverview?.entitySize,
            companyName: profileData.entityOverview?.tradingName || profileData.entityOverview?.registeredName
          });
          
          const entitySize = profileData.entityOverview?.entitySize;
          console.log('🏷️ STEP 4: Entity size found for support deal:', entitySize);
          
          if (entitySize && entitySizeCount.hasOwnProperty(entitySize)) {
            entitySizeCount[entitySize]++;
            console.log(`✅ STEP 4: Counted ${entitySize} from support deal: ${entitySizeCount[entitySize]}`);
          } else {
            console.log('❌ STEP 4: Invalid entity size for support deal SME:', entitySize);
            entitySizeCount['Small']++;
          }
        } else {
          console.log('❌ STEP 3: Profile does not exist for support deal SME:', smeId);
        }
      } catch (error) {
        console.error(`❌ STEP 3-4: Error processing support deal SME ${smeId}:`, error);
      }
    }
    
    console.log('📈 FINAL: Entity size counts from support deals:', entitySizeCount);
    console.log('📊 FINAL: Total support SMEs processed:', smeIds.length);
    return entitySizeCount;
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch active SMEs data from support deals:', error);
    return {
      'Micro': 0,
      'Small': 0,
      'Medium': 0,
      'Large': 0
    };
  }
};

// UPDATED: BIG Score calculation for support users
const fetchAverageBIGScore = async () => {
  try {
    const successfulDeals = await fetchSupportSuccessfulDeals();
    const { smeIds } = successfulDeals;
    
    console.log('🔍 STEP 1: Fetching BIG scores from support deals. Total SMEs:', smeIds.length);
    
    if (smeIds.length === 0) {
      console.log('❌ STEP 1: No SMEs found in support deals for BIG score calculation');
      return {
        averageScore: 0,
        individualScores: [],
        totalSMEs: 0
      };
    }
    
    let totalScore = 0;
    let count = 0;
    const individualScores = [];
    
    // Fetch BIG scores for each SME from support deals
    for (const smeId of smeIds) {
      try {
        const universalProfileRef = doc(db, "universalProfiles", smeId);
        const universalProfileSnap = await getDoc(universalProfileRef);
        
        if (universalProfileSnap.exists()) {
          const profileData = universalProfileSnap.data();
          const bigScore = profileData.bigScore;
          
          console.log(`📊 STEP 2: BIG Score for support deal SME ${smeId}:`, bigScore);
          
          if (typeof bigScore === 'number' && !isNaN(bigScore)) {
            totalScore += bigScore;
            count++;
            individualScores.push({
              smeId: smeId,
              score: bigScore,
              companyName: profileData.entityOverview?.tradingName || profileData.entityOverview?.registeredName || 'Unknown'
            });
            console.log(`✅ STEP 2: Valid BIG score added from support deal: ${bigScore}`);
          } else {
            console.log('❌ STEP 2: Invalid BIG score for support deal SME:', smeId, bigScore);
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
          console.log('❌ STEP 2: Profile does not exist for support deal SME:', smeId);
        }
      } catch (error) {
        console.error(`❌ STEP 2: Error fetching BIG score for support deal SME ${smeId}:`, error);
      }
    }
    
    const averageScore = count > 0 ? Math.round(totalScore / count) : 0;
    console.log('📈 FINAL: Average BIG Score from support deals:', averageScore + '%', 'from', count, 'SMEs');
    console.log('🔍 FINAL: Individual BIG Scores:', individualScores);
    
    return {
      averageScore: averageScore,
      individualScores: individualScores,
      totalSMEs: count
    };
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch average BIG score from support deals:', error);
    return {
      averageScore: 0,
      individualScores: [],
      totalSMEs: 0
    };
  }
};

// UPDATED: Funding Ready Percentage for support users
const fetchFundingReadyPercentage = async () => {
  try {
    const successfulDeals = await fetchSupportSuccessfulDeals();
    const { smeIds } = successfulDeals;
    
    console.log('🔍 STEP 1: Calculating funding ready percentage from support deals. Total SMEs:', smeIds.length);
    
    if (smeIds.length === 0) {
      console.log('❌ STEP 1: No SMEs found in support deals for funding ready calculation');
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
    
    // Check BIG scores for each SME from support deals
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
    
    console.log('📈 FINAL: Funding Ready Percentage from support deals:', {
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
    console.error('❌ ERROR: Failed to fetch funding ready percentage from support deals:', error);
    return {
      fundingReadyPercentage: 0,
      fundingReadyCount: 0,
      totalCount: 0,
      fundingReadySMEs: [],
      notFundingReadySMEs: []
    };
  }
};

// UPDATED: Portfolio Value Calculation for support programs
const fetchPortfolioValueData = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('❌ No user logged in');
      return {
        currentValue: 0,
        quarterlyData: [0, 0, 0, 0],
        monthlyData: [0, 0, 0, 0, 0, 0],
        yearlyData: [0],
        totalDeals: 0,
        totalSupportValue: 0,
        financialYearStartMonth: 6
      };
    }

    const financialYearStartMonth = await getFinancialYearStartMonth(currentUser.uid);
    console.log(`📅 Using financial year starting in month: ${financialYearStartMonth + 1}`);
    
    const successfulDeals = await fetchSupportSuccessfulDeals();
    const { applications } = successfulDeals;
    
    console.log('💰 STEP 1: Calculating portfolio value from support deals with FINANCIAL YEAR allocation');
    console.log('📊 STEP 1: Number of successful support applications:', applications.length);
    
    if (applications.length === 0) {
      console.log('❌ STEP 1: No support deals found for portfolio value calculation');
      return {
        currentValue: 0,
        quarterlyData: [0, 0, 0, 0],
        monthlyData: [0, 0, 0, 0, 0, 0],
        yearlyData: [0],
        yearlyLabels: [`${new Date().getFullYear()}`],
        totalDeals: 0,
        totalSupportValue: 0,
        financialYearStartMonth
      };
    }
    
    const quarterlyData = [0, 0, 0, 0];
    const monthlyData = [0, 0, 0, 0, 0, 0];
    let totalSupportValue = 0;
    const quarterlyBreakdown = [[], [], [], []];
    const monthlyBreakdown = [[], [], [], [], [], []];
    
    const supportByYear = {};
    
    for (const application of applications) {
      try {
        // Parse support value - this could be programValue or fundingRequired
        const supportValue = parseAmountToNumber(application.programValue || application.fundingRequired || "0");
        totalSupportValue += supportValue;
        
        // Get creation date
        const createdAt = application.createdAt;
        
        if (createdAt) {
          try {
            const creationDate = new Date(createdAt);
            
            if (!isNaN(creationDate.getTime())) {
              const creationYear = creationDate.getFullYear();
              
              if (!supportByYear[creationYear]) {
                supportByYear[creationYear] = 0;
              }
              supportByYear[creationYear] += supportValue;
              
              const quarter = getQuarterFromDate(creationDate, financialYearStartMonth);
              const creationMonth = creationDate.getMonth();
              const financialYearMonth = (creationMonth - financialYearStartMonth + 12) % 12;
              
              console.log(`📅 STEP 2: Processing support deal created at:`, createdAt, {
                creationYear,
                creationMonth: creationMonth + 1,
                financialYearStartMonth: financialYearStartMonth + 1,
                financialYearMonth: financialYearMonth + 1,
                quarter: quarter + 1,
                supportValue
              });
              
              quarterlyData[quarter] += supportValue;
              quarterlyBreakdown[quarter].push({
                amount: supportValue,
                date: createdAt,
                smeId: application.smeId,
                year: creationYear
              });
              
              if (financialYearMonth < 6) {
                monthlyData[financialYearMonth] += supportValue;
                monthlyBreakdown[financialYearMonth].push({
                  amount: supportValue,
                  date: createdAt,
                  smeId: application.smeId,
                  year: creationYear
                });
              }
              
              console.log(`✅ STEP 2: Allocated R${supportValue} to Financial Year Q${quarter + 1}, Month ${financialYearMonth + 1}, Year ${creationYear}`);
              
            } else {
              console.log('❌ STEP 2: Invalid creation date:', createdAt);
              const equalAmount = supportValue / 4;
              quarterlyData.forEach((_, index) => {
                quarterlyData[index] += equalAmount;
                quarterlyBreakdown[index].push({
                  amount: equalAmount,
                  date: createdAt,
                  smeId: application.smeId,
                  note: 'Distributed evenly - invalid date'
                });
              });
              
              const monthlyEqualAmount = supportValue / 6;
              monthlyData.forEach((_, index) => {
                monthlyData[index] += monthlyEqualAmount;
                monthlyBreakdown[index].push({
                  amount: monthlyEqualAmount,
                  date: createdAt,
                  smeId: application.smeId,
                  note: 'Distributed evenly - invalid date'
                });
              });
            }
          } catch (dateError) {
            console.error('❌ STEP 2: Error parsing creation date:', createdAt, dateError);
            const equalAmount = supportValue / 4;
            quarterlyData.forEach((_, index) => {
              quarterlyData[index] += equalAmount;
              quarterlyBreakdown[index].push({
                amount: equalAmount,
                date: createdAt,
                smeId: application.smeId,
                note: 'Distributed evenly - date parsing error'
              });
            });
            
            const monthlyEqualAmount = supportValue / 6;
            monthlyData.forEach((_, index) => {
              monthlyData[index] += monthlyEqualAmount;
              monthlyBreakdown[index].push({
                amount: monthlyEqualAmount,
                date: createdAt,
                smeId: application.smeId,
                note: 'Distributed evenly - date parsing error'
              });
            });
          }
        } else {
          console.log('❌ STEP 2: No createdAt date found for support deal, distributing evenly');
          const equalAmount = supportValue / 4;
          quarterlyData.forEach((_, index) => {
            quarterlyData[index] += equalAmount;
            quarterlyBreakdown[index].push({
              amount: equalAmount,
              smeId: application.smeId,
              note: 'Distributed evenly - no creation date'
            });
          });
          
          const monthlyEqualAmount = supportValue / 6;
          monthlyData.forEach((_, index) => {
            monthlyData[index] += monthlyEqualAmount;
            monthlyBreakdown[index].push({
              amount: monthlyEqualAmount,
              smeId: application.smeId,
              note: 'Distributed evenly - no creation date'
            });
          });
        }
      } catch (error) {
        console.error('❌ STEP 2: Error processing support deal:', error);
      }
    }
    
    const currentYear = new Date().getFullYear();
    const yearlyData = [];
    const yearlyLabels = [];
    
    const supportYears = Object.keys(supportByYear)
      .map(year => parseInt(year))
      .sort((a, b) => a - b);
    
    console.log('📊 Support years found:', supportYears);
    
    if (supportYears.length > 0) {
      if (supportYears.includes(currentYear)) {
        yearlyData.push(supportByYear[currentYear]);
        yearlyLabels.push(`${currentYear}`);
      }
      
      supportYears.forEach(year => {
        if (year !== currentYear) {
          yearlyData.push(supportByYear[year]);
          yearlyLabels.push(`${year}`);
        }
      });
    } else {
      yearlyData.push(totalSupportValue);
      yearlyLabels.push(`${currentYear}`);
    }
    
    const quarterlyDataInMillions = quarterlyData.map(amount => 
      parseFloat((amount / 1000000).toFixed(1))
    );
    
    const monthlyDataInMillions = monthlyData.map(amount => 
      parseFloat((amount / 1000000).toFixed(1))
    );
    
    const yearlyDataInMillions = yearlyData.map(amount => 
      parseFloat((amount / 1000000).toFixed(1))
    );
    
    const currentValue = parseFloat((totalSupportValue / 1000000).toFixed(1));
    
    const result = {
      currentValue,
      quarterlyData: quarterlyDataInMillions,
      monthlyData: monthlyDataInMillions,
      yearlyData: yearlyDataInMillions,
      yearlyLabels: yearlyLabels,
      totalDeals: applications.length,
      totalSupportValue: totalSupportValue,
      financialYearStartMonth,
      quarterlyBreakdown: quarterlyBreakdown,
      monthlyBreakdown: monthlyBreakdown,
      supportByYear: supportByYear,
      supportYears: supportYears
    };
    
    console.log('📈 FINAL: Support portfolio value with accurate yearly data:', result);
    return result;
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch portfolio value data from support deals:', error);
    return {
      currentValue: 0,
      quarterlyData: [0, 0, 0, 0],
      monthlyData: [0, 0, 0, 0, 0, 0],
      yearlyData: [0],
      yearlyLabels: [`${new Date().getFullYear()}`],
      totalDeals: 0,
      totalSupportValue: 0,
      financialYearStartMonth: 6,
      quarterlyBreakdown: [[], [], [], []],
      monthlyBreakdown: [[], [], [], [], [], []],
      supportByYear: {},
      supportYears: []
    };
  }
};

// UPDATED: Time to Support Approval Calculation
const fetchAverageTimeToSupport = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('❌ No user logged in');
      return {
        averageDays: 0,
        timeToSupportData: [0, 0, 0, 0],
        monthlyTimeToSupportData: [0, 0, 0, 0, 0, 0],
        yearlyTimeToSupportData: [0],
        yearlyTimeToSupportLabels: [`${new Date().getFullYear()}`],
        totalSMEs: 0,
        allProcessingTimes: [],
        financialYearStartMonth: 6,
        processingDetails: []
      };
    }

    const financialYearStartMonth = await getFinancialYearStartMonth(currentUser.uid);
    console.log(`📅 Using financial year starting in month: ${financialYearStartMonth + 1}`);
    
    const successfulDeals = await fetchSupportSuccessfulDeals();
    const { applications } = successfulDeals;
    
    console.log('🔍 STEP 1: Calculating average time to support from support deals. Total applications:', applications.length);
    
    if (applications.length === 0) {
      console.log('❌ STEP 1: No support applications found for time calculation');
      return {
        averageDays: 0,
        timeToSupportData: [0, 0, 0, 0],
        monthlyTimeToSupportData: [0, 0, 0, 0, 0, 0],
        yearlyTimeToSupportData: [0],
        yearlyTimeToSupportLabels: [`${new Date().getFullYear()}`],
        totalSMEs: 0,
        allProcessingTimes: [],
        financialYearStartMonth: 6,
        processingDetails: []
      };
    }
    
    const quarterlyProcessingTimes = [[], [], [], []];
    const monthlyProcessingTimes = [[], [], [], [], [], []];
    const processingTimesByYear = {};
    const processingDetails = [[], [], [], []];
    const monthlyProcessingDetails = [[], [], [], [], [], []];
    let totalDays = 0;
    let count = 0;
    const allProcessingTimes = [];
    
    for (const application of applications) {
      try {
        const applicationDateStr = application.createdAt;
        const approvalDateStr = application.updatedAt || application.createdAt;
        
        console.log(`📅 STEP 2: Processing dates for support application:`, {
          applicationDate: applicationDateStr,
          approvalDate: approvalDateStr
        });
        
        if (applicationDateStr && approvalDateStr) {
          try {
            const applicationDate = new Date(applicationDateStr);
            const approvalDate = new Date(approvalDateStr);
            
            console.log(`📅 STEP 2: Parsed dates:`, {
              applicationDate: applicationDate.toString(),
              approvalDate: approvalDate.toString()
            });
            
            if (!isNaN(applicationDate.getTime()) && !isNaN(approvalDate.getTime())) {
              const timeDiff = approvalDate.getTime() - applicationDate.getTime();
              const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
              
              const approvalYear = approvalDate.getFullYear();
              
              console.log(`⏱️ STEP 2: Time to support for application: ${daysDiff} days in year ${approvalYear}`);
              
              if (daysDiff > 0 && daysDiff < 365) {
                totalDays += daysDiff;
                count++;
                allProcessingTimes.push(daysDiff);
                
                if (!processingTimesByYear[approvalYear]) {
                  processingTimesByYear[approvalYear] = [];
                }
                processingTimesByYear[approvalYear].push(daysDiff);
                
                const quarter = getQuarterFromDate(approvalDate, financialYearStartMonth);
                const approvalMonth = approvalDate.getMonth();
                const financialYearMonth = (approvalMonth - financialYearStartMonth + 12) % 12;
                
                quarterlyProcessingTimes[quarter].push(daysDiff);
                processingDetails[quarter].push({
                  smeId: application.smeId,
                  days: daysDiff,
                  applicationDate: applicationDateStr,
                  approvalDate: approvalDateStr,
                  financialYearQuarter: quarter + 1,
                  year: approvalYear
                });
                
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
              console.log('❌ STEP 2: Invalid date parsing for support application');
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
          console.log('❌ STEP 2: Missing dates for support application');
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
        console.error(`❌ STEP 2: Error processing support application:`, error);
      }
    }
    
    const timeToSupportData = quarterlyProcessingTimes.map(quarterTimes => {
      if (quarterTimes.length === 0) return 0;
      const quarterAvg = quarterTimes.reduce((sum, days) => sum + days, 0) / quarterTimes.length;
      return Math.round(quarterAvg);
    });
    
    const monthlyTimeToSupportData = monthlyProcessingTimes.map(monthTimes => {
      if (monthTimes.length === 0) return 0;
      const monthAvg = monthTimes.reduce((sum, days) => sum + days, 0) / monthTimes.length;
      return Math.round(monthAvg);
    });
    
    const currentYear = new Date().getFullYear();
    const yearlyTimeToSupportData = [];
    const yearlyTimeToSupportLabels = [];
    
    const processingYears = Object.keys(processingTimesByYear)
      .map(year => parseInt(year))
      .sort((a, b) => a - b);
    
    console.log('📊 Processing years found:', processingYears);
    
    if (processingYears.length > 0) {
      processingYears.forEach(year => {
        const yearTimes = processingTimesByYear[year];
        if (yearTimes.length > 0) {
          const yearAvg = yearTimes.reduce((sum, days) => sum + days, 0) / yearTimes.length;
          yearlyTimeToSupportData.push(Math.round(yearAvg));
          yearlyTimeToSupportLabels.push(`${year}`);
        }
      });
    } else {
      yearlyTimeToSupportData.push(averageDays);
      yearlyTimeToSupportLabels.push(`${currentYear}`);
    }
    
    const averageDays = count > 0 ? Math.round(totalDays / count) : 0;
    
    console.log('📈 FINAL: Average time to support with accurate yearly data:', {
      averageDays,
      timeToSupportData,
      monthlyTimeToSupportData,
      yearlyTimeToSupportData,
      yearlyTimeToSupportLabels,
      totalSMEs: count,
      quarterlyCounts: quarterlyProcessingTimes.map(q => q.length),
      monthlyCounts: monthlyProcessingTimes.map(m => m.length),
      processingYears,
      financialYearStartMonth: financialYearStartMonth + 1,
      allProcessingTimes
    });
    
    return {
      averageDays,
      timeToSupportData,
      monthlyTimeToSupportData,
      yearlyTimeToSupportData,
      yearlyTimeToSupportLabels,
      totalSMEs: count,
      allProcessingTimes,
      financialYearStartMonth,
      processingDetails,
      monthlyProcessingDetails,
      processingTimesByYear,
      processingYears
    };
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch average time to support from support deals:', error);
    return {
      averageDays: 0,
      timeToSupportData: [0, 0, 0, 0],
      monthlyTimeToSupportData: [0, 0, 0, 0, 0, 0],
      yearlyTimeToSupportData: [0],
      yearlyTimeToSupportLabels: [`${new Date().getFullYear()}`],
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

// UPDATED: FALLBACK DATA for support users
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
        yearlyData: [187],
        yearlyLabels: [`${currentYear}`],
        financialYearStartMonth: 6 
      },
      timeToSupport: { 
        averageDays: 35, 
        timeToSupportData: [38, 36, 34, 32], 
        monthlyTimeToSupportData: [40, 38, 37, 36, 35, 34],
        yearlyTimeToSupportData: [35],
        yearlyTimeToSupportLabels: [`${currentYear}`],
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
        yearlyData: [215],
        yearlyLabels: [`${currentYear}`],
        financialYearStartMonth: 6 
      },
      timeToSupport: { 
        averageDays: 32, 
        timeToSupportData: [35, 34, 32, 29], 
        monthlyTimeToSupportData: [36, 35, 34, 33, 32, 31],
        yearlyTimeToSupportData: [32],
        yearlyTimeToSupportLabels: [`${currentYear}`],
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
        yearlyData: [198],
        yearlyLabels: [`${currentYear}`],
        financialYearStartMonth: 6 
      },
      timeToSupport: { 
        averageDays: 38, 
        timeToSupportData: [42, 40, 37, 35], 
        monthlyTimeToSupportData: [44, 42, 41, 39, 38, 37],
        yearlyTimeToSupportData: [38],
        yearlyTimeToSupportLabels: [`${currentYear}`],
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
        yearlyData: [232],
        yearlyLabels: [`${currentYear}`],
        financialYearStartMonth: 6 
      },
      timeToSupport: { 
        averageDays: 29, 
        timeToSupportData: [32, 31, 29, 26], 
        monthlyTimeToSupportData: [34, 33, 32, 31, 30, 29],
        yearlyTimeToSupportData: [29],
        yearlyTimeToSupportLabels: [`${currentYear}`],
        totalSMEs: 31, 
        allProcessingTimes: [27, 29, 31, 28, 30, 29, 27, 32], 
        financialYearStartMonth: 6 
      }
    }
  ];
  
  return fallbackOptions[userHash];
};

const PortfolioOverview = ({ openPopup, downloadSectionAsPDF, currentUser }) => {
  const [timeToSupportView, setTimeToSupportView] = useState('Quarterly');
  const [fundingFacilitatedData, setFundingFacilitatedData] = useState([15, 18, 22, 20, 25, 28]);
  const [showFundingInput, setShowFundingInput] = useState(false);
  const [showChartSelector, setShowChartSelector] = useState(false);
  const [selectedCharts, setSelectedCharts] = useState({
    portfolioValue: true,
    activeSMEs: true,
    bigScore: true,
    fundingReady: true,
    fundingFacilitated: true,
    timeToSupport: true,
    followOnFunding: true,
    exitRepayment: true
  });
  
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
      totalSupportValue: 0, 
      financialYearStartMonth: 6, 
      quarterlyBreakdown: [[], [], [], []],
      monthlyBreakdown: [[], [], [], [], [], []],
      supportByYear: {},
      supportYears: []
    },
    timeToSupport: { 
      averageDays: 0, 
      timeToSupportData: [0, 0, 0, 0], 
      monthlyTimeToSupportData: [0, 0, 0, 0, 0, 0],
      yearlyTimeToSupportData: [0],
      yearlyTimeToSupportLabels: [`${new Date().getFullYear()}`],
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
      if (currentUser && !portfolioData.loading) {
        const preferences = {
          selectedCharts,
          updatedAt: new Date().toISOString()
        };
        await saveUserChartPreferences(currentUser.uid, preferences);
      }
    };

    const timeoutId = setTimeout(savePreferences, 1000);
    return () => clearTimeout(timeoutId);
  }, [selectedCharts]);

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
          timeToSupport: fallbackData.timeToSupport,
          loading: false,
          usingFallback: true
        });
        return;
      }
      
      console.log('🚀 STARTING PORTFOLIO DATA FETCH FOR SUPPORT DEALS - User:', currentUser.uid);
      setPortfolioData(prev => ({ ...prev, loading: true }));
      
      try {
        const [activeSMEsData, averageBIGScoreData, fundingReadyPercentageData, portfolioValueData, timeToSupportData] = await Promise.all([
          fetchActiveSMEsData(),
          fetchAverageBIGScore(),
          fetchFundingReadyPercentage(),
          fetchPortfolioValueData(),
          fetchAverageTimeToSupport()
        ]);
        
        const totalSMEs = Object.values(activeSMEsData).reduce((a, b) => a + b, 0);
        const hasRealData = totalSMEs > 0 || portfolioValueData.currentValue > 0;
        
        console.log('📊 SUPPORT DEALS DATA FETCH COMPLETED:', {
          hasRealData,
          totalSMEs,
          averageBIGScore: averageBIGScoreData.averageScore,
          fundingReadyPercentage: fundingReadyPercentageData.fundingReadyPercentage,
          portfolioValue: portfolioValueData.currentValue,
          totalDeals: portfolioValueData.totalDeals,
          totalSupportValue: portfolioValueData.totalSupportValue,
          financialYearStartMonth: portfolioValueData.financialYearStartMonth,
          timeToSupport: timeToSupportData.averageDays,
          timeToSupportSMEs: timeToSupportData.totalSMEs,
          supportYears: portfolioValueData.supportYears,
          processingYears: timeToSupportData.processingYears
        });
        
        if (hasRealData) {
          console.log('✅ USING REAL DATA FROM SUPPORT DEALS');
          setPortfolioData({
            activeSMEs: activeSMEsData,
            averageBIGScore: averageBIGScoreData,
            fundingReadyPercentage: fundingReadyPercentageData,
            portfolioValue: portfolioValueData,
            timeToSupport: timeToSupportData,
            loading: false,
            usingFallback: false
          });
        } else {
          console.log('⚠️ USING FALLBACK DATA - no support deals found for this catalyst');
          const fallbackData = getFallbackDataBasedOnUser();
          setPortfolioData({
            activeSMEs: fallbackData.activeSMEs,
            averageBIGScore: fallbackData.averageBIGScore,
            fundingReadyPercentage: fallbackData.fundingReadyPercentage,
            portfolioValue: fallbackData.portfolioValue,
            timeToSupport: fallbackData.timeToSupport,
            loading: false,
            usingFallback: true
          });
        }
      } catch (error) {
        console.error('❌ ERROR fetching support deals data:', error);
        const fallbackData = getFallbackDataBasedOnUser();
        setPortfolioData({
          activeSMEs: fallbackData.activeSMEs,
          averageBIGScore: fallbackData.averageBIGScore,
          fundingReadyPercentage: fallbackData.fundingReadyPercentage,
          portfolioValue: fallbackData.portfolioValue,
          timeToSupport: fallbackData.timeToSupport,
          loading: false,
          usingFallback: true
        });
      }
    };
    
    fetchPortfolioData();
  }, []);

  // Helper function to get quarter labels based on financial year start (keep the same)
  const getQuarterLabels = (financialYearStartMonth) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
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

  // Helper function to get financial year months in order (keep the same)
  const getFinancialYearMonths = (financialYearStartMonth) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = [];
    
    for (let i = 0; i < 6; i++) {
      const monthIndex = (financialYearStartMonth + i) % 12;
      months.push(monthNames[monthIndex]);
    }
    
    return months;
  };

  // Time view data for support
  const timeToSupportData = {
    Monthly: portfolioData.timeToSupport.monthlyTimeToSupportData,
    Quarterly: portfolioData.timeToSupport.timeToSupportData,
    Yearly: portfolioData.timeToSupport.yearlyTimeToSupportData
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
        if (timeToSupportView === 'Yearly') {
          return portfolioData.timeToSupport.yearlyTimeToSupportLabels;
        } else {
          return portfolioData.portfolioValue.yearlyLabels;
        }
      default:
        return getQuarterLabels(financialYearStartMonth);
    }
  };

  // Time View Selector Component (keep the same)
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

  // Chart Selection Component (keep the same)
  const ChartSelectionPopup = () => {
    const chartOptions = [
      { id: 'portfolioValue', label: 'Portfolio Value' },
      { id: 'activeSMEs', label: 'Active SMEs' },
      { id: 'bigScore', label: 'BIG Score' },
      { id: 'fundingReady', label: 'Funding Ready %' },
      { id: 'fundingFacilitated', label: 'Support Facilitated' },
      { id: 'timeToSupport', label: 'Time to Support' },
      { id: 'followOnFunding', label: 'Follow-on Support' },
      { id: 'exitRepayment', label: 'Program Completion' }
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

  // Data generation functions (keep the same)
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

  // UPDATED: Support Facilitated Chart (renamed from Funding Facilitated)
  const SupportFacilitatedChart = ({ title }) => {
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
      'Support Value (R millions)',
      2
    );

    const handleEyeClick = () => {
      const totalFacilitated = fundingFacilitatedData.reduce((sum, value) => sum + value, 0);
      const maxAllowed = portfolioData.portfolioValue.totalSupportValue / 1000000;
      
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">
            Monthly support value facilitated from your successful programs - manually input data that reflects your actual support activities
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
              <span className="detail-label">Available from Programs:</span>
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
              Enter support values for each month (R millions)
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
              Monthly support from successful programs (R millions)
            </div>
            <div className="chart-area">
              <Bar data={chartData} options={staticBarOptions} />
            </div>
          </>
        )}
      </div>
    );
  };

  // UPDATED: BIG Score Circular Component for support
  const BIGScoreInfographic = ({ value, target, title }) => {
    const handleEyeClick = () => {
      const { individualScores, totalSMEs } = portfolioData.averageBIGScore;
      
      openPopup(
        <div className="popup-content">
          <h3>BIG Score - Support Programs</h3>
          <div className="popup-description">
            Average BIG Score across SMEs from your successful support programs
          </div>
          <div className="big-score-popup">
            <div className="big-score-main-popup">
              <div className="big-score-value">{value}%</div>
              <div className="big-score-label">Your Support Programs BIG Score</div>
              <div className="big-score-target">Target: {target}%</div>
            </div>
            <div className="popup-details">
              <div className="detail-item">
                <span className="detail-label">Data Source:</span>
                <span className="detail-value">
                  {portfolioData.usingFallback ? 'Sample Portfolio' : 'Your Support Programs'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Calculation:</span>
                <span className="detail-value">Average of SMEs from your support programs</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Scoring Range:</span>
                <span className="detail-value">0-100%</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total SMEs Analyzed:</span>
                <span className="detail-value">{totalSMEs}</span>
              </div>
              
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

  // UPDATED: Funding Ready Circular Component for support
  const FundingReadyCircular = ({ value, target, title }) => {
    const handleEyeClick = () => {
      const { fundingReadySMEs, notFundingReadySMEs, fundingReadyCount, totalCount } = portfolioData.fundingReadyPercentage;
      
      openPopup(
        <div className="popup-content">
          <h3>Funding Ready - Support Programs</h3>
          <div className="popup-description">
            Percentage of SMEs in your support programs with BIG Score ≥ 80% (considered "Funding Ready")
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
                  {portfolioData.usingFallback ? 'Sample Portfolio' : 'Your Support Programs'}
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

  // UPDATED: BarChartWithTitle for support portfolio
  const BarChartWithTitle = ({ data, title, chartTitle, chartId }) => {
    const handleEyeClick = () => {
      const { quarterlyBreakdown, monthlyBreakdown, supportByYear, supportYears } = portfolioData.portfolioValue;
      
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">
            Support program value growth from your successful support deals with accurate yearly data based on actual program dates
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
              <span className="detail-label">Successful Programs:</span>
              <span className="detail-value" style={{color: '#5e3f26'}}>
                {portfolioData.portfolioValue.totalDeals || 'N/A'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Support Value:</span>
              <span className="detail-value">
                R {portfolioData.portfolioValue.totalSupportValue ? (portfolioData.portfolioValue.totalSupportValue / 1000000).toFixed(1) : '0'} million
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
                {portfolioData.usingFallback ? 'Sample Portfolio' : 'Your Support Programs'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Time View:</span>
              <span className="detail-value">{timeToSupportView}</span>
            </div>
            
            {supportYears && supportYears.length > 0 && (
              <>
                <div className="detail-item" style={{borderLeftColor: '#4CAF50', marginTop: '15px'}}>
                  <span className="detail-label" style={{fontSize: '16px', fontWeight: '700'}}>Support by Calendar Year:</span>
                  <span className="detail-value" style={{fontSize: '16px', fontWeight: '700'}}></span>
                </div>
                {supportYears.map(year => (
                  <div key={year} className="detail-item">
                    <span className="detail-label">{year}:</span>
                    <span className="detail-value">
                      R {((supportByYear[year] || 0) / 1000000).toFixed(1)} million
                    </span>
                  </div>
                ))}
              </>
            )}
            
            {timeToSupportView === 'Quarterly' && quarterlyBreakdown && quarterlyBreakdown.some(q => q.length > 0) && (
              <>
                <div className="detail-item" style={{borderLeftColor: '#4CAF50', marginTop: '15px'}}>
                  <span className="detail-label" style={{fontSize: '16px', fontWeight: '700'}}>Quarterly Program Breakdown:</span>
                  <span className="detail-value" style={{fontSize: '16px', fontWeight: '700'}}></span>
                </div>
                {quarterlyBreakdown.map((quarter, index) => (
                  <div key={index} className="detail-item">
                    <span className="detail-label">{getQuarterLabels(portfolioData.portfolioValue.financialYearStartMonth)[index]}:</span>
                    <span className="detail-value">
                      {quarter.length} programs, R {portfolioData.portfolioValue.quarterlyData[index]}M
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

  // UPDATED: Active SMEs Pie Chart for support
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
          <h3>Your Support Programs Portfolio</h3>
          <div className="popup-description">
            Distribution of SMEs from your successful support programs by business size
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
              <span className="detail-label">Total SMEs in Support Programs:</span>
              <span className="detail-value" style={{color: '#5e3f26'}}>{totalSMEs}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Active Programs:</span>
              <span className="detail-value">{portfolioData.portfolioValue.totalDeals || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Data Source:</span>
              <span className="detail-value">
                {portfolioData.usingFallback ? 'Sample Support Programs' : 'Your Actual Support Programs'}
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
              Loading your support programs...
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
              <div>No active support programs in your portfolio</div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {portfolioData.usingFallback ? 
                  'Showing sample support programs portfolio' : 
                  'You have no Active Support programs yet'
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

  // UPDATED: Time to Support Chart (renamed from Time to Fund)
  const TimeToSupportChart = ({ value, target, data, title }) => {
    const labels = getTimeLabels(timeToSupportView, portfolioData.timeToSupport.financialYearStartMonth);
    
    const chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Days to Support',
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
      const { processingDetails, monthlyProcessingDetails, processingTimesByYear, processingYears } = portfolioData.timeToSupport;
      
      openPopup(
        <div className="popup-content">
          <h3>Time to Support - Programs</h3>
          <div className="popup-description">
            Average support approval time calculated from your successful programs (application date to approval date) with accurate yearly data based on actual processing dates
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
              <span className="detail-value">{portfolioData.timeToSupport.totalSMEs || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Financial Year Start:</span>
              <span className="detail-value">
                Month {portfolioData.timeToSupport.financialYearStartMonth + 1} ({getFinancialYearMonths(portfolioData.timeToSupport.financialYearStartMonth)[0]})
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Data Source:</span>
              <span className="detail-value">
                {portfolioData.usingFallback ? 'Sample Data' : 'Your Support Programs'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Calculation:</span>
              <span className="detail-value">Application Date → Support Approval Date</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Time View:</span>
              <span className="detail-value">{timeToSupportView}</span>
            </div>
            
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
            
            {timeToSupportView === 'Quarterly' && processingDetails && processingDetails.some(q => q.length > 0) && (
              <>
                <div className="detail-item" style={{borderLeftColor: '#4CAF50', marginTop: '15px'}}>
                  <span className="detail-label" style={{fontSize: '16px', fontWeight: '700'}}>Processing Details by Quarter:</span>
                  <span className="detail-value" style={{fontSize: '16px', fontWeight: '700'}}></span>
                </div>
                {processingDetails.map((quarter, index) => (
                  <div key={index} className="detail-item">
                    <span className="detail-label">{getQuarterLabels(portfolioData.timeToSupport.financialYearStartMonth)[index]}:</span>
                    <span className="detail-value">
                      {quarter.length} SMEs, Avg: {data[index]} days
                    </span>
                  </div>
                ))}
              </>
            )}
            
            {timeToSupportView === 'Monthly' && monthlyProcessingDetails && monthlyProcessingDetails.some(m => m.length > 0) && (
              <>
                <div className="detail-item" style={{borderLeftColor: '#4CAF50', marginTop: '15px'}}>
                  <span className="detail-label" style={{fontSize: '16px', fontWeight: '700'}}>Processing Details by Month:</span>
                  <span className="detail-value" style={{fontSize: '16px', fontWeight: '700'}}></span>
                </div>
                {monthlyProcessingDetails.map((month, index) => (
                  <div key={index} className="detail-item">
                    <span className="detail-label">{getFinancialYearMonths(portfolioData.timeToSupport.financialYearStartMonth)[index]}:</span>
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
          <Line data={chartData} options={options} id="time-to-support" />
        </div>
        
        <div className="time-to-fund-legend">
          <div className="legend-item">
            <div className="legend-color days-to-fund"></div>
            <span>Days to Support</span>
          </div>
          <div className="legend-item">
            <div className="legend-color target-line"></div>
            <span>Target Line</span>
          </div>
        </div>
        
        <div className="chart-summary-ultra-compact">
          <div className="current-value">
            Current: {portfolioData.loading ? '...' : value} days
            {portfolioData.timeToSupport.totalSMEs > 0 && (
              <span style={{fontSize: '11px', color: '#666', marginLeft: '5px'}}>
                (from {portfolioData.timeToSupport.totalSMEs} SMEs)
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

  // UPDATED: Follow-on Support Rate Component (renamed from Follow-on Funding)
  const EnhancedFollowOnSupportChart = ({ value, target, data, title }) => {
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
          <h3>Follow-on Support - Programs</h3>
          <div className="popup-description">
            Follow-on support rates from your successful programs portfolio
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
          <Bar data={chartData} options={options} id="follow-on-support" />
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

  // UPDATED: Program Completion Chart (renamed from Exit Repayment)
  const ProgramCompletionChart = ({ value, target, data, title }) => {
    const chartData = {
      labels: data.map((_, index) => `Q${index + 1}`),
      datasets: [
        {
          label: 'Completion Ratio',
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
          <h3>Program Completion - Support</h3>
          <div className="popup-description">
            Program completion performance from your support programs portfolio
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
          <Line data={chartData} options={options} id="program-completion" />
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

  // Get selected charts in the correct order
  const selectedChartComponents = [];
  
  if (selectedCharts.portfolioValue) {
    selectedChartComponents.push({
      id: 'portfolioValue',
      component: (
        <BarChartWithTitle
          key="portfolioValue"
          data={generateBarData(
            getTimeLabels(timeToSupportView, portfolioData.portfolioValue.financialYearStartMonth),
            getTimeData(timeToSupportView, portfolioValueData),
            'Support Portfolio Value (R millions)',
            0
          )}
          title="Your Support Programs Portfolio Value"
          chartTitle={`Program values from successful support deals (${timeToSupportView.toLowerCase()} view in R millions)`}
          chartId="total-portfolio-value"
        />
      )
    });
  }

  if (selectedCharts.activeSMEs) {
    selectedChartComponents.push({
      id: 'activeSMEs',
      component: (
        <ActiveSMEsPieChart
          key="activeSMEs"
          title="SMEs in Support Programs"
        />
      )
    });
  }

  if (selectedCharts.bigScore) {
    selectedChartComponents.push({
      id: 'bigScore',
      component: (
        <BIGScoreInfographic 
          key="bigScore"
          value={portfolioData.averageBIGScore.averageScore} 
          target={80} 
          title="Avg. BIG Score - Support Programs"
        />
      )
    });
  }

  if (selectedCharts.fundingReady) {
    selectedChartComponents.push({
      id: 'fundingReady',
      component: (
        <FundingReadyCircular 
          key="fundingReady"
          value={portfolioData.fundingReadyPercentage.fundingReadyPercentage} 
          target={75} 
          title='% Portfolio "Funding Ready"'
        />
      )
    });
  }

  if (selectedCharts.fundingFacilitated) {
    selectedChartComponents.push({
      id: 'fundingFacilitated',
      component: (
        <SupportFacilitatedChart
          key="fundingFacilitated"
          title="Support Facilitated - Programs"
        />
      )
    });
  }

  if (selectedCharts.timeToSupport) {
    selectedChartComponents.push({
      id: 'timeToSupport',
      component: (
        <TimeToSupportChart
          key="timeToSupport"
          value={portfolioData.timeToSupport.averageDays}
          target={30}
          data={getTimeData(timeToSupportView, timeToSupportData)}
          title="Avg. Time-to-Support - Programs"
        />
      )
    });
  }

  if (selectedCharts.followOnFunding) {
    selectedChartComponents.push({
      id: 'followOnFunding',
      component: (
        <EnhancedFollowOnSupportChart
          key="followOnFunding"
          value={27}
          target={30}
          data={[22, 24, 25, 27]}
          title="Follow-on Support Rate - Programs"
        />
      )
    });
  }

  if (selectedCharts.exitRepayment) {
    selectedChartComponents.push({
      id: 'exitRepayment',
      component: (
        <ProgramCompletionChart
          key="exitRepayment"
          value={12}
          target={15}
          data={[10, 11, 12, 12]}
          title="Program Completion Ratio - Support"
        />
      )
    });
  }

  // Split charts into top and bottom rows
  const selectedCount = selectedChartComponents.length;
  const topRowCharts = selectedChartComponents.slice(0, Math.min(4, selectedCount));
  const bottomRowCharts = selectedChartComponents.slice(4);

  const getGridClass = (count, prefix) => {
    if (count === 0) return '';
    if (count === 1) return `${prefix}-1`;
    if (count === 2) return `${prefix}-2`;
    if (count === 3) return `${prefix}-3`;
    return `${prefix}-4`;
  };

  const topRowClass = getGridClass(topRowCharts.length, 'charts-top-row');
  const bottomRowClass = getGridClass(bottomRowCharts.length, 'charts-bottom-row');

  return (
    <div className="portfolio-overview">
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
        
        <div className="time-view-controls">
          <TimeViewSelector 
            currentView={timeToSupportView} 
            onViewChange={setTimeToSupportView}
          />
        </div>
      </div>
      
      {selectedCount === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666',
          fontSize: '16px',
          background: '#f8f9fa',
          borderRadius: '8px',
          margin: '20px 10px'
        }}>
          <p>No charts selected. Please select charts to display using the "Select Charts" button above.</p>
        </div>
      ) : (
        <div className="charts-grid-dynamic">
          {topRowCharts.length > 0 && (
            <div className={`charts-top-row ${topRowClass}`}>
              {topRowCharts.map(chart => chart.component)}
            </div>
          )}
          
          {bottomRowCharts.length > 0 && (
            <div className={`charts-bottom-row ${bottomRowClass}`}>
              {bottomRowCharts.map(chart => chart.component)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PortfolioOverview;