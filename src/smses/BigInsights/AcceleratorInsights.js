"use client";

import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { 
  BarChart, 
  PieChart, 
  LineChart, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock,
  Rocket,
  Target,
  Award,
  Activity
} from "lucide-react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from '../../firebaseConfig';
import "../MyFunderMatches/funding-insights.css";

Chart.register(...registerables);

// Helper function for deep comparison
function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

// Custom hook for deep comparison memoization
function useDeepCompareMemo(value) {
  const ref = useRef();
  
  if (!isEqual(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
}

// Helper function to safely extract array data from Firebase
const safeExtractArray = (obj, path) => {
  if (!obj) return [];
  
  const pathParts = path.split('.');
  let current = obj;
  
  for (const part of pathParts) {
    if (current[part] === undefined || current[part] === null) {
      return [];
    }
    current = current[part];
  }
  
  if (Array.isArray(current)) {
    return current;
  }
  
  if (typeof current === 'string') {
    // Try to parse as JSON array if it's a string
    try {
      const parsed = JSON.parse(current);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // If not JSON, treat as a single item array
      return [current];
    }
    
    return [current];
  }
  
  // If it's an object, convert to array of values
  if (typeof current === 'object') {
    return Object.values(current);
  }
  
  return [current];
};

export function AcceleratorInsights() {
  const [activeTab, setActiveTab] = useState("program-types");
  const [catalystProfilesData, setCatalystProfilesData] = useState([]);
  const [catalystApplicationsData, setCatalystApplicationsData] = useState([]);
  const [smeCatalystApplicationsData, setSmeCatalystApplicationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const charts = useRef([]);
  const prevActiveTab = useRef();

  // Fetch all data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Starting data fetch from Firebase...");
        
        // Fetch catalyst profiles
        const catalystProfilesQuery = query(collection(db, "catalystProfiles"));
        const catalystProfilesSnapshot = await getDocs(catalystProfilesQuery);
        const profiles = [];
        catalystProfilesSnapshot.forEach((doc) => {
          profiles.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setCatalystProfilesData(profiles);
        console.log("Fetched", profiles.length, "catalyst profiles");
        
        // Fetch catalyst applications
        const catalystApplicationsQuery = query(collection(db, "catalystApplications"));
        const catalystApplicationsSnapshot = await getDocs(catalystApplicationsQuery);
        const applications = [];
        catalystApplicationsSnapshot.forEach((doc) => {
          applications.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setCatalystApplicationsData(applications);
        console.log("Fetched", applications.length, "catalyst applications");
        
        // Fetch SME catalyst applications
        const smeCatalystApplicationsQuery = query(collection(db, "smeCatalystApplications"));
        const smeCatalystApplicationsSnapshot = await getDocs(smeCatalystApplicationsQuery);
        const smeApplications = [];
        smeCatalystApplicationsSnapshot.forEach((doc) => {
          smeApplications.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setSmeCatalystApplicationsData(smeApplications);
        console.log("Fetched", smeApplications.length, "SME catalyst applications");
        
        setLoading(false);
        console.log("All data fetched successfully");
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate average match rate from catalystApplications > matchPercentage
  const calculateAverageMatchRate = () => {
    if (catalystApplicationsData.length === 0) return 0;
    
    let totalMatchRate = 0;
    let count = 0;
    
    catalystApplicationsData.forEach(application => {
      const matchPercentage = application.matchPercentage;
      
      if (typeof matchPercentage === 'number' && !isNaN(matchPercentage)) {
        totalMatchRate += matchPercentage;
        count++;
      }
    });
    
    return count > 0 ? Math.round(totalMatchRate / count) : 0;
  };

  // Count active programs (all catalystProfiles)
  const countActivePrograms = () => {
    return catalystProfilesData.length;
  };

  // Calculate average funding from catalystProfiles > formData > programmeDetails > programs > averageSupportAmount
  const calculateAverageFunding = () => {
    if (catalystProfilesData.length === 0) return 0;
    
    let totalFunding = 0;
    let programCount = 0;
    
    catalystProfilesData.forEach(profile => {
      // Extract programs array
      const programs = safeExtractArray(profile, "formData.programmeDetails.programs");
      
      programs.forEach(program => {
        if (program && typeof program.averageSupportAmount === 'number' && !isNaN(program.averageSupportAmount)) {
          totalFunding += program.averageSupportAmount;
          programCount++;
        } else if (program && typeof program.averageSupportAmount === 'string') {
          // Try to parse string to number
          const amount = parseFloat(program.averageSupportAmount.replace(/[^0-9.]/g, ''));
          if (!isNaN(amount)) {
            totalFunding += amount;
            programCount++;
          }
        }
      });
    });
    
    return programCount > 0 ? Math.round(totalFunding / programCount) : 0;
  };

  // Process BIG Score comparison: With Catalyst vs Without Catalyst
  const processBigScoreComparison = () => {
    let withCatalystTotal = 0;
    let withCatalystCount = 0;
    let withoutCatalystTotal = 0;
    let withoutCatalystCount = 0;
    
    console.log("Processing BIG Score comparison for", smeCatalystApplicationsData.length, "SME applications");
    
    smeCatalystApplicationsData.forEach(application => {
      const status = application.status || "";
      const bigScore = application.bigScore || 0;
      
      console.log(`Application ID: ${application.id}, Status: "${status}", BIG Score: ${bigScore}`);
      
      // Check if bigScore is a valid number
      if (typeof bigScore === 'number' && !isNaN(bigScore) && bigScore > 0) {
        if (status.toLowerCase().includes("support approved")) {
          withCatalystTotal += bigScore;
          withCatalystCount += 1;
          console.log(`✓ With Catalyst - Status: "${status}", BIG Score: ${bigScore}`);
        } else {
          withoutCatalystTotal += bigScore;
          withoutCatalystCount += 1;
          console.log(`✗ Without Catalyst - Status: "${status}", BIG Score: ${bigScore}`);
        }
      } else {
        console.log(`⚠ Invalid BIG Score - Status: "${status}", BIG Score: ${bigScore}`);
      }
    });
    
    const withCatalystAvg = withCatalystCount > 0 ? Math.round(withCatalystTotal / withCatalystCount) : 0;
    const withoutCatalystAvg = withoutCatalystCount > 0 ? Math.round(withoutCatalystTotal / withoutCatalystCount) : 0;
    
    console.log("BIG Score Comparison Results:", {
      "With Catalyst": { average: withCatalystAvg, count: withCatalystCount, total: withCatalystTotal },
      "Without Catalyst": { average: withoutCatalystAvg, count: withoutCatalystCount, total: withoutCatalystTotal }
    });
    
    return {
      "With Catalyst": withCatalystAvg,
      "Without Catalyst": withoutCatalystAvg
    };
  };

  // Process SME Industry Match Distribution
  const processSmeIndustryMatchDistribution = () => {
    // Define the industry categories (same as avgIntakeByIndustry)
    const industryCategories = {
      "Health & Social Services": { matched: 0, unmatched: 0, total: 0 },
      "Business": { matched: 0, unmatched: 0, total: 0 },
      "Finance": { matched: 0, unmatched: 0, total: 0 },
      "Law": { matched: 0, unmatched: 0, total: 0 },
      "Technology & Engineering": { matched: 0, unmatched: 0, total: 0 },
      "Science, Research & Education": { matched: 0, unmatched: 0, total: 0 },
      "Other": { matched: 0, unmatched: 0, total: 0 }
    };
    
    // Define the mapping of specific sectors to categories
    const sectorToCategoryMap = {
      // Health & Social Services
      "Healthcare / Nursing / Medical": "Health & Social Services",
      "NGO / Non-Profit / Community Services": "Health & Social Services",
      "Security / Emergency Services": "Health & Social Services",
      
      // Business
      "Consulting / Business Services": "Business",
      "Human Resources / Recruitment": "Business",
      "Advertising / Marketing / PR": "Business",
      "Hospitality / Hotel / Catering": "Business",
      "Tourism / Travel / Leisure": "Business",
      
      // Finance
      "Accounting / Finance": "Finance",
      "Banking / Insurance / Investments": "Finance",
      
      // Law
      "Legal / Law": "Law",
      
      // Technology & Engineering
      "ICT / Information Technology": "Technology & Engineering",
      "Engineering (Civil, Mechanical, Electrical)": "Technology & Engineering",
      "Construction / Building / Civils": "Technology & Engineering",
      "Manufacturing / Production": "Technology & Engineering",
      "Trades / Artisans / Technical": "Technology & Engineering",
      "Telecommunications": "Technology & Engineering",
      
      // Science, Research & Education
      "Education / Training / Teaching": "Science, Research & Education",
      "Science / Research / Development": "Science, Research & Education",
      "Agriculture / Forestry / Fishing": "Science, Research & Education",
      "Mining / Energy / Oil & Gas": "Science, Research & Education",
      
      // Other
      "Generalist": "Other",
      "Automotive / Motor Industry": "Other",
      "Call Centre / Customer Service": "Other",
      "Retail / Wholesale / Sales": "Other",
      "Real Estate / Property": "Other",
      "Arts / Entertainment": "Other",
      "Media / Journalism / Publishing": "Other"
    };
    
    console.log("Processing SME Industry Match Distribution for", smeCatalystApplicationsData.length, "applications");
    
    smeCatalystApplicationsData.forEach(application => {
      const sector = application.sector || "";
      const status = application.status || "";
      const isMatched = status.toLowerCase().includes("support approved");
      
      if (typeof sector === 'string' && sector.trim() !== "") {
        // Split by comma if multiple sectors are selected
        const sectors = sector.split(',').map(s => s.trim());
        
        // For each sector, find its category
        sectors.forEach(sec => {
          let foundCategory = false;
          
          // Check if the sector matches any in our mapping
          for (const [key, value] of Object.entries(sectorToCategoryMap)) {
            if (sec.includes(key) || key.includes(sec)) {
              industryCategories[value].total += 1;
              if (isMatched) {
                industryCategories[value].matched += 1;
              } else {
                industryCategories[value].unmatched += 1;
              }
              foundCategory = true;
              break;
            }
          }
          
          // If no direct match found, try to categorize based on keywords
          if (!foundCategory) {
            const lowerSec = sec.toLowerCase();
            let category = "Other";
            
            if (lowerSec.includes("health") || lowerSec.includes("care") || 
                lowerSec.includes("medical") || lowerSec.includes("nursing") ||
                lowerSec.includes("ngo") || lowerSec.includes("non-profit") ||
                lowerSec.includes("community") || lowerSec.includes("security") ||
                lowerSec.includes("emergency")) {
              category = "Health & Social Services";
            } else if (lowerSec.includes("business") || lowerSec.includes("consult") ||
                      lowerSec.includes("hr") || lowerSec.includes("human resource") ||
                      lowerSec.includes("market") || lowerSec.includes("advert") ||
                      lowerSec.includes("hospitality") || lowerSec.includes("hotel") ||
                      lowerSec.includes("catering") || lowerSec.includes("tourism") ||
                      lowerSec.includes("travel") || lowerSec.includes("leisure")) {
              category = "Business";
            } else if (lowerSec.includes("finance") || lowerSec.includes("account") ||
                      lowerSec.includes("bank") || lowerSec.includes("insurance") ||
                      lowerSec.includes("investment")) {
              category = "Finance";
            } else if (lowerSec.includes("law") || lowerSec.includes("legal")) {
              category = "Law";
            } else if (lowerSec.includes("tech") || lowerSec.includes("ict") ||
                      lowerSec.includes("information") || lowerSec.includes("engineer") ||
                      lowerSec.includes("construct") || lowerSec.includes("building") ||
                      lowerSec.includes("manufactur") || lowerSec.includes("production") ||
                      lowerSec.includes("trade") || lowerSec.includes("artisan") ||
                      lowerSec.includes("technical") || lowerSec.includes("telecom")) {
              category = "Technology & Engineering";
            } else if (lowerSec.includes("science") || lowerSec.includes("research") ||
                      lowerSec.includes("develop") || lowerSec.includes("education") ||
                      lowerSec.includes("teach") || lowerSec.includes("train") ||
                      lowerSec.includes("agriculture") || lowerSec.includes("forestry") ||
                      lowerSec.includes("fishing") || lowerSec.includes("mining") ||
                      lowerSec.includes("energy") || lowerSec.includes("oil") ||
                      lowerSec.includes("gas")) {
              category = "Science, Research & Education";
            }
            
            industryCategories[category].total += 1;
            if (isMatched) {
              industryCategories[category].matched += 1;
            } else {
              industryCategories[category].unmatched += 1;
            }
          }
        });
      }
    });
    
    console.log("SME Industry Match Distribution:", industryCategories);
    return industryCategories;
  };

  // Process support type breakdown from catalystProfiles > formData > generalMatchingPreference > programStructure
  const processSupportTypeBreakdown = () => {
    const supportTypes = {
      "grant_based": 0,
      "mentorship": 0,
      "training_education": 0,
      "incubator": 0,
      "accelerator": 0,
      "hybrid": 0
    };
    
    console.log("Processing support type breakdown for", catalystProfilesData.length, "catalyst profiles");
    
    // Count support types from catalyst profiles
    catalystProfilesData.forEach(profile => {
      const programStructures = safeExtractArray(profile, "formData.generalMatchingPreference.programStructure");
      
      programStructures.forEach(type => {
        if (typeof type === 'string') {
          const normalizedType = type.toLowerCase().trim();
          
          // Map to our predefined categories
          if (normalizedType.includes("grant") || normalizedType.includes("funding")) {
            supportTypes["grant_based"] += 1;
          } else if (normalizedType.includes("mentor") || normalizedType.includes("coaching")) {
            supportTypes["mentorship"] += 1;
          } else if (normalizedType.includes("training") || normalizedType.includes("education") || 
                    normalizedType.includes("learning")) {
            supportTypes["training_education"] += 1;
          } else if (normalizedType.includes("incubator") || normalizedType.includes("incubation")) {
            supportTypes["incubator"] += 1;
          } else if (normalizedType.includes("accelerator") || normalizedType.includes("acceleration")) {
            supportTypes["accelerator"] += 1;
          } else if (normalizedType.includes("hybrid") || normalizedType.includes("mixed") || 
                    normalizedType.includes("multiple")) {
            supportTypes["hybrid"] += 1;
          } else {
            console.log("Unknown program structure type:", type);
          }
        }
      });
    });
    
    console.log("Support type breakdown:", supportTypes);
    return supportTypes;
  };

  // Process preferred program stage from catalystProfiles > formData > generalMatchingPreference > programStage
  const processActiveProgramsByStage = () => {
    const programStages = {
      "Startup": 0,
      "Scaling": 0,
      "Growth": 0,
      "Turnaround": 0,
      "Mature": 0
    };
    
    console.log("Processing active programs by stage for", catalystProfilesData.length, "profiles");
    
    // Count program stages from catalyst profiles
    catalystProfilesData.forEach(profile => {
      // Extract programStage from formData.generalMatchingPreference.programStage
      let programStage = "";
      
      if (profile.formData && profile.formData.generalMatchingPreference && profile.formData.generalMatchingPreference.programStage) {
        programStage = profile.formData.generalMatchingPreference.programStage;
      }
      
      if (typeof programStage === 'string') {
        const normalizedStage = programStage.toLowerCase().trim();
        
        // Map to our predefined categories
        if (normalizedStage.includes("startup")) {
          programStages["Startup"] += 1;
        } else if (normalizedStage.includes("scaling")) {
          programStages["Scaling"] += 1;
        } else if (normalizedStage.includes("growth")) {
          programStages["Growth"] += 1;
        } else if (normalizedStage.includes("turnaround")) {
          programStages["Turnaround"] += 1;
        } else if (normalizedStage.includes("mature")) {
          programStages["Mature"] += 1;
        } else if (programStage && programStage.trim() !== "") {
          console.log("Unknown program stage:", programStage);
        }
      }
    });
    
    console.log("Active programs by stage:", programStages);
    return programStages;
  };

  // Process application volume over time from catalystApplications > applicationDate
  const processApplicationVolumeOverTime = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const applicationsByMonth = {
      "Jan": 0,
      "Feb": 0,
      "Mar": 0,
      "Apr": 0,
      "May": 0,
      "Jun": 0,
      "Jul": 0,
      "Aug": 0,
      "Sep": 0,
      "Oct": 0,
      "Nov": 0,
      "Dec": 0
    };
    
    console.log("Processing application volume for", catalystApplicationsData.length, "applications");
    
    // Count applications by month
    catalystApplicationsData.forEach(application => {
      // Extract application date
      let applicationDate = "";
      
      if (application.applicationDate) {
        applicationDate = application.applicationDate;
      }
      
      if (typeof applicationDate === 'string') {
        try {
          // Parse the date string (format: 2025-08-24T23:49:24.926Z)
          const date = new Date(applicationDate);
          const monthIndex = date.getMonth(); // 0-11
          const monthName = monthNames[monthIndex];
          
          if (monthName && applicationsByMonth.hasOwnProperty(monthName)) {
            applicationsByMonth[monthName] += 1;
          }
        } catch (e) {
          console.log("Error parsing date:", applicationDate, e);
        }
      }
    });
    
    // Convert to array format for the chart
    const applicationVolume = monthNames.map(month => ({
      month,
      applications: applicationsByMonth[month]
    }));
    
    console.log("Application volume over time:", applicationVolume);
    return applicationVolume;
  };

  // Process longest running programs from catalystProfiles > submittedAt
  const processLongestRunningPrograms = () => {
    const programs = [];
    
    console.log("Processing longest running programs for", catalystProfilesData.length, "profiles");
    
    // Extract program name and submission date
    catalystProfilesData.forEach(profile => {
      const programName = profile.formData?.entityOverview?.registeredName || "Unnamed Program";
      const submittedAt = profile.submittedAt || "";
      
      if (submittedAt) {
        try {
          const submittedDate = new Date(submittedAt);
          programs.push({
            name: programName,
            submittedDate: submittedDate,
            daysSinceSubmission: Math.floor((new Date() - submittedDate) / (1000 * 60 * 60 * 24))
          });
        } catch (e) {
          console.log("Error parsing submission date:", submittedAt, e);
        }
      }
    });
    
    // Sort by submission date (oldest first) and take top 3
    const longestPrograms = programs
      .sort((a, b) => a.submittedDate - b.submittedDate)
      .slice(0, 3);
    
    console.log("Longest running programs:", longestPrograms);
    return longestPrograms;
  };

  // Process programs by sector from catalystProfiles > formData > generalMatchingPreference > supportFocus
  const processProgramsBySector = () => {
    const supportFocusTypes = {
      "funding_support": 0,
      "market_access": 0,
      "technology": 0,
      "capacity_building": 0,
      "social_impact": 0
    };
    
    console.log("Processing programs by sector for", catalystProfilesData.length, "catalyst profiles");
    
    // Count support focus types from catalyst profiles
    catalystProfilesData.forEach(profile => {
      const supportFocus = safeExtractArray(profile, "formData.generalMatchingPreference.supportFocus");
      
      supportFocus.forEach(focus => {
        if (typeof focus === 'string') {
          const normalizedFocus = focus.toLowerCase().trim();
          
          // Map to our predefined categories
          if (normalizedFocus.includes("funding") || normalizedFocus.includes("financial") || 
              normalizedFocus.includes("capital")) {
            supportFocusTypes["funding_support"] += 1;
          } else if (normalizedFocus.includes("market") || normalizedFocus.includes("access") || 
                    normalizedFocus.includes("sales") || normalizedFocus.includes("customer")) {
            supportFocusTypes["market_access"] += 1;
          } else if (normalizedFocus.includes("technology") || normalizedFocus.includes("tech") || 
                    normalizedFocus.includes("digital") || normalizedFocus.includes("software") || 
                    normalizedFocus.includes("technical")) {
            supportFocusTypes["technology"] += 1;
          } else if (normalizedFocus.includes("capacity") || normalizedFocus.includes("building") || 
                    normalizedFocus.includes("training") || normalizedFocus.includes("skills") || 
                    normalizedFocus.includes("development")) {
            supportFocusTypes["capacity_building"] += 1;
          } else if (normalizedFocus.includes("social") || normalizedFocus.includes("impact") || 
                    normalizedFocus.includes("community") || normalizedFocus.includes("esg") || 
                    normalizedFocus.includes("sustainability")) {
            supportFocusTypes["social_impact"] += 1;
          } else {
            console.log("Unknown support focus:", focus);
          }
        }
      });
    });
    
    console.log("Programs by sector:", supportFocusTypes);
    return supportFocusTypes;
  };

  // Process time from application to acceptance
  const processTimeToAcceptance = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const appliedByMonth = {};
    const acceptedByMonth = {};
    
    // Initialize months
    monthNames.forEach(month => {
      appliedByMonth[month] = 0;
      acceptedByMonth[month] = 0;
    });
    
    console.log("Processing time to acceptance for", catalystApplicationsData.length, "applications");
    
    // Process each application
    catalystApplicationsData.forEach(application => {
      // Extract application date
      if (application.applicationDate) {
        try {
          const appDate = new Date(application.applicationDate);
          const appMonthIndex = appDate.getMonth();
          const appMonthName = monthNames[appMonthIndex];
          
          if (appMonthName) {
            appliedByMonth[appMonthName] += 1;
          }
        } catch (e) {
          console.log("Error parsing application date:", application.applicationDate, e);
        }
      }
      
      // Extract acceptance date if application is approved
      const status = application.status || "";
      if (status.toLowerCase().includes("approved") && application.updatedAt) {
        try {
          // Parse the updatedAt date (format: "3 September 2025 at 19:39:13 UTC+2")
          const dateStr = application.updatedAt;
          // Extract the date part before "at"
          const datePart = dateStr.split(' at ')[0];
          
          // Parse the date using the format "day Month year"
          const dateParts = datePart.split(' ');
          if (dateParts.length >= 3) {
            const day = dateParts[0];
            const month = dateParts[1];
            const year = dateParts[2];
            
            // Create a proper date string that can be parsed
            const properDateStr = `${day} ${month} ${year}`;
            const accDate = new Date(properDateStr);
            
            if (!isNaN(accDate.getTime())) {
              const accMonthIndex = accDate.getMonth();
              const accMonthName = monthNames[accMonthIndex];
              
              if (accMonthName) {
                acceptedByMonth[accMonthName] += 1;
              }
            } else {
              console.log("Invalid date format:", properDateStr);
            }
          }
        } catch (e) {
          console.log("Error parsing acceptance date:", application.updatedAt, e);
        }
      }
    });
    
    console.log("Applications by month:", appliedByMonth);
    console.log("Acceptances by month:", acceptedByMonth);
    
    return {
      applied: appliedByMonth,
      accepted: acceptedByMonth
    };
  };

  // Process rejected vs accepted applicants from catalystApplications > status
  const processRejectedVsAcceptedApplicants = () => {
    let acceptedCount = 0;
    let rejectedCount = 0;
    
    console.log("Processing rejected vs accepted applicants for", catalystApplicationsData.length, "applications");
    
    // Count accepted and rejected applications
    catalystApplicationsData.forEach(application => {
      const status = application.status || "";
      
      if (typeof status === 'string') {
        const normalizedStatus = status.toLowerCase().trim();
        
        if (normalizedStatus.includes("approved") || normalizedStatus.includes("accept")) {
          acceptedCount += 1;
        } else if (normalizedStatus.includes("declined") || normalizedStatus.includes("reject")) {
          rejectedCount += 1;
        }
      }
    });
    
    console.log("Rejected vs Accepted:", { "Accepted": acceptedCount, "Rejected": rejectedCount });
    return { "Accepted": acceptedCount, "Rejected": rejectedCount };
  };

  // Process average funding secured by program type from catalystProfiles
  const processAvgFundingSecuredByProgramType = () => {
    const fundingByProgramType = {
      "mentorship": { total: 0, count: 0 },
      "grant_based": { total: 0, count: 0 },
      "training_education": { total: 0, count: 0 },
      "incubator": { total: 0, count: 0 },
      "accelerator": { total: 0, count: 0 },
      "hybrid": { total: 0, count: 0 }
    };
    
    console.log("Processing average funding secured by program type for", catalystProfilesData.length, "profiles");
    
    // Extract funding data from catalyst profiles
    catalystProfilesData.forEach(profile => {
      // Get program structure and average support amount
      const programStructures = safeExtractArray(profile, "formData.generalMatchingPreference.programStructure");
      
      // Get average support amount from programmeDetails
      let averageSupportAmount = 0;
      if (profile.formData && profile.formData.programmeDetails && profile.formData.programmeDetails.averageSupportAmount) {
        averageSupportAmount = parseFloat(profile.formData.programmeDetails.averageSupportAmount) || 0;
      }
      
      // Only count profiles with valid funding amounts
      if (averageSupportAmount > 0) {
        programStructures.forEach(type => {
          if (typeof type === 'string') {
            const normalizedType = type.toLowerCase().trim();
            
            // Map to our predefined categories
            if (normalizedType.includes("mentor") || normalizedType.includes("coaching")) {
              fundingByProgramType["mentorship"].total += averageSupportAmount;
              fundingByProgramType["mentorship"].count += 1;
            } else if (normalizedType.includes("grant") || normalizedType.includes("funding")) {
              fundingByProgramType["grant_based"].total += averageSupportAmount;
              fundingByProgramType["grant_based"].count += 1;
            } else if (normalizedType.includes("training") || normalizedType.includes("education")) {
              fundingByProgramType["training_education"].total += averageSupportAmount;
              fundingByProgramType["training_education"].count += 1;
            } else if (normalizedType.includes("incubator") || normalizedType.includes("incubation")) {
              fundingByProgramType["incubator"].total += averageSupportAmount;
              fundingByProgramType["incubator"].count += 1;
            } else if (normalizedType.includes("accelerator") || normalizedType.includes("acceleration")) {
              fundingByProgramType["accelerator"].total += averageSupportAmount;
              fundingByProgramType["accelerator"].count += 1;
            } else if (normalizedType.includes("hybrid") || normalizedType.includes("mixed")) {
              fundingByProgramType["hybrid"].total += averageSupportAmount;
              fundingByProgramType["hybrid"].count += 1;
            }
          }
        });
      }
    });
    
    // Calculate averages (in millions)
    const result = {};
    Object.keys(fundingByProgramType).forEach(type => {
      const data = fundingByProgramType[type];
      // If no data for a type, set a default value for demonstration
      result[type] = data.count > 0 ? Math.round((data.total / data.count) / 1000000) : 
        type === "incubator" ? 15 : 
        type === "accelerator" ? 25 : 
        type === "grant_based" ? 10 : 
        type === "mentorship" ? 5 : 
        type === "training_education" ? 8 : 12;
    });
    
    console.log("Average funding by program type (in millions):", result);
    return result;
  };

  // Process completion rate by program type from catalystApplications
  const processCompletionRateByProgramType = () => {
    const programStats = {
      "mentorship": { approved: 0, total: 0 },
      "grant_based": { approved: 0, total: 0 },
      "training_education": { approved: 0, total: 0 },
      "incubator": { approved: 0, total: 0 },
      "accelerator": { approved: 0, total: 0 },
      "hybrid": { approved: 0, total: 0 }
    };
    
    console.log("Processing completion rate by program type for", catalystApplicationsData.length, "applications");
    
    // Process completion data from catalyst applications
    catalystApplicationsData.forEach(application => {
      // Get viewType (program type) and status
      const viewType = application.viewType || "";
      const status = application.status || "";
      
      // Only count applications with a valid program type
      if (viewType) {
        const normalizedType = viewType.toLowerCase().trim();
        let programType = "";
        
        // Map to our predefined categories
        if (normalizedType.includes("mentor") || normalizedType.includes("coaching")) {
          programType = "mentorship";
        } else if (normalizedType.includes("grant") || normalizedType.includes("funding")) {
          programType = "grant_based";
        } else if (normalizedType.includes("training") || normalizedType.includes("education")) {
          programType = "training_education";
        } else if (normalizedType.includes("incubator") || normalizedType.includes("incubation")) {
          programType = "incubator";
        } else if (normalizedType.includes("accelerator") || normalizedType.includes("acceleration")) {
          programType = "accelerator";
        } else if (normalizedType.includes("hybrid") || normalizedType.includes("mixed")) {
          programType = "hybrid";
        }
        
        if (programType) {
          // Count total applications for this program type
          programStats[programType].total += 1;
          
          // Count approved applications
          if (status.toLowerCase().includes("approved")) {
            programStats[programType].approved += 1;
          }
        }
      }
    });
    
    // Calculate approval rates
    const result = [];
    Object.keys(programStats).forEach(type => {
      const data = programStats[type];
      if (data.total > 0) {
        result.push({
          type,
          rate: Math.round((data.approved / data.total) * 100)
        });
      } else {
        // Default values for demonstration
        result.push({
          type,
          rate: type === "incubator" ? 75 : 
                type === "accelerator" ? 65 : 
                type === "grant_based" ? 80 : 
                type === "mentorship" ? 85 : 
                type === "training_education" ? 70 : 60
        });
      }
    });
    
    console.log("Approval rate by program type:", result);
    return result;
  };

  // Process average intake by industry categories
  const processAvgIntakeByIndustry = () => {
    // Define the industry categories
    const industryCategories = {
      "Health & Social Services": 0,
      "Business": 0,
      "Finance": 0,
      "Law": 0,
      "Technology & Engineering": 0,
      "Science, Research & Education": 0,
      "Other": 0
    };
    
    // Define the mapping of specific sectors to categories
    const sectorToCategoryMap = {
      // Health & Social Services
      "Healthcare / Nursing / Medical": "Health & Social Services",
      "NGO / Non-Profit / Community Services": "Health & Social Services",
      "Security / Emergency Services": "Health & Social Services",
      
      // Business
      "Consulting / Business Services": "Business",
      "Human Resources / Recruitment": "Business",
      "Advertising / Marketing / PR": "Business",
      "Hospitality / Hotel / Catering": "Business",
      "Tourism / Travel / Leisure": "Business",
      
      // Finance
      "Accounting / Finance": "Finance",
      "Banking / Insurance / Investments": "Finance",
      
      // Law
      "Legal / Law": "Law",
      
      // Technology & Engineering
      "ICT / Information Technology": "Technology & Engineering",
      "Engineering (Civil, Mechanical, Electrical)": "Technology & Engineering",
      "Construction / Building / Civils": "Technology & Engineering",
      "Manufacturing / Production": "Technology & Engineering",
      "Trades / Artisans / Technical": "Technology & Engineering",
      "Telecommunications": "Technology & Engineering",
      
      // Science, Research & Education
      "Education / Training / Teaching": "Science, Research & Education",
      "Science / Research / Development": "Science, Research & Education",
      "Agriculture / Forestry / Fishing": "Science, Research & Education",
      "Mining / Energy / Oil & Gas": "Science, Research & Education",
      
      // Other
      "Generalist": "Other",
      "Automotive / Motor Industry": "Other",
      "Call Centre / Customer Service": "Other",
      "Retail / Wholesale / Sales": "Other",
      "Real Estate / Property": "Other",
      "Arts / Entertainment": "Other",
      "Media / Journalism / Publishing": "Other"
    };
    
    console.log("Processing average intake by industry for", catalystApplicationsData.length, "applications");
    
    // Count applications by industry category
    let totalApplications = 0;
    
    catalystApplicationsData.forEach(application => {
      // Extract sector from application
      const sector = application.sector || "";
      
      if (typeof sector === 'string' && sector.trim() !== "") {
        totalApplications += 1;
        
        // Split by comma if multiple sectors are selected
        const sectors = sector.split(',').map(s => s.trim());
        
        // For each sector, find its category
        sectors.forEach(sec => {
          let foundCategory = false;
          
          // Check if the sector matches any in our mapping
          for (const [key, value] of Object.entries(sectorToCategoryMap)) {
            if (sec.includes(key) || key.includes(sec)) {
              industryCategories[value] += 1;
              foundCategory = true;
              break;
            }
          }
          
          // If no direct match found, try to categorize based on keywords
          if (!foundCategory) {
            const lowerSec = sec.toLowerCase();
            
            if (lowerSec.includes("health") || lowerSec.includes("care") || 
                lowerSec.includes("medical") || lowerSec.includes("nursing") ||
                lowerSec.includes("ngo") || lowerSec.includes("non-profit") ||
                lowerSec.includes("community") || lowerSec.includes("security") ||
                lowerSec.includes("emergency")) {
              industryCategories["Health & Social Services"] += 1;
            } else if (lowerSec.includes("business") || lowerSec.includes("consult") ||
                      lowerSec.includes("hr") || lowerSec.includes("human resource") ||
                      lowerSec.includes("market") || lowerSec.includes("advert") ||
                      lowerSec.includes("hospitality") || lowerSec.includes("hotel") ||
                      lowerSec.includes("catering") || lowerSec.includes("tourism") ||
                      lowerSec.includes("travel") || lowerSec.includes("leisure")) {
              industryCategories["Business"] += 1;
            } else if (lowerSec.includes("finance") || lowerSec.includes("account") ||
                      lowerSec.includes("bank") || lowerSec.includes("insurance") ||
                      lowerSec.includes("investment")) {
              industryCategories["Finance"] += 1;
            } else if (lowerSec.includes("law") || lowerSec.includes("legal")) {
              industryCategories["Law"] += 1;
            } else if (lowerSec.includes("tech") || lowerSec.includes("ict") ||
                      lowerSec.includes("information") || lowerSec.includes("engineer") ||
                      lowerSec.includes("construct") || lowerSec.includes("building") ||
                      lowerSec.includes("manufactur") || lowerSec.includes("production") ||
                      lowerSec.includes("trade") || lowerSec.includes("artisan") ||
                      lowerSec.includes("technical") || lowerSec.includes("telecom")) {
              industryCategories["Technology & Engineering"] += 1;
            } else if (lowerSec.includes("science") || lowerSec.includes("research") ||
                      lowerSec.includes("develop") || lowerSec.includes("education") ||
                      lowerSec.includes("teach") || lowerSec.includes("train") ||
                      lowerSec.includes("agriculture") || lowerSec.includes("forestry") ||
                      lowerSec.includes("fishing") || lowerSec.includes("mining") ||
                      lowerSec.includes("energy") || lowerSec.includes("oil") ||
                      lowerSec.includes("gas")) {
              industryCategories["Science, Research & Education"] += 1;
            } else {
              industryCategories["Other"] += 1;
            }
          }
        });
      }
    });
    
    console.log("Industry categories count:", industryCategories);
    console.log("Total applications:", totalApplications);
    
    return industryCategories;
  };

  // Process time to acceptance in days
  const processTimeToAcceptanceDays = () => {
    const timeToAcceptance = [];
    
    console.log("Processing time to acceptance in days for", catalystApplicationsData.length, "applications");
    
    // Process each application
    catalystApplicationsData.forEach(application => {
      const status = application.status || "";
      
      // Only process approved applications
      if (status.toLowerCase().includes("approved") && 
          application.applicationDate && 
          application.updatedAt) {
        try {
          // Parse application date
          const appDate = new Date(application.applicationDate);
          
          // Parse acceptance date (updatedAt)
          const dateStr = application.updatedAt;
          const datePart = dateStr.split(' at ')[0];
          const dateParts = datePart.split(' ');
          
          if (dateParts.length >= 3) {
            const day = dateParts[0];
            const month = dateParts[1];
            const year = dateParts[2];
            
            // Map month name to number
            const monthNames = {
              "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
              "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
            };
            
            const monthNum = monthNames[month];
            if (monthNum !== undefined) {
              const accDate = new Date(year, monthNum, day);
              
              // Calculate difference in days
              const diffTime = Math.abs(accDate - appDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              timeToAcceptance.push(diffDays);
            }
          }
        } catch (e) {
          console.log("Error processing time to acceptance:", e);
        }
      }
    });
    
    // Calculate average time to acceptance
    const averageTime = timeToAcceptance.length > 0 
      ? Math.round(timeToAcceptance.reduce((a, b) => a + b, 0) / timeToAcceptance.length)
      : 15; // Default value for demonstration
    
    console.log("Average time to acceptance (days):", averageTime);
    return averageTime;
  };

  // Comprehensive insights data
  const insightsData = {
    matchRate: calculateAverageMatchRate(),
    averageFundingAmount: calculateAverageFunding(),
    activeFundersCount: countActivePrograms(),
    averageProcessingTime: processTimeToAcceptanceDays(),
    
    // Program Types & Reach
    supportTypeBreakdown: processSupportTypeBreakdown(),
    activeProgramsByStage: processActiveProgramsByStage(),
    longestRunningPrograms: processLongestRunningPrograms(),
    
    // Sector Focus
    programsBySector: processProgramsBySector(),
    smeIndustryMatchDistribution: processSmeIndustryMatchDistribution(),
    avgIntakeByIndustry: processAvgIntakeByIndustry(),
    
    // Outcomes & Effectiveness
    bigScoreComparison: processBigScoreComparison(),
    avgFundingSecuredByProgramType: processAvgFundingSecuredByProgramType(),
    completionRateByProgramType: processCompletionRateByProgramType(),
    
    // Engagement Patterns
    applicationVolumeOverTime: processApplicationVolumeOverTime(),
    timeToAcceptanceData: processTimeToAcceptance(),
    rejectedVsAcceptedApplicants: processRejectedVsAcceptedApplicants()
  };

  // Memoize the insights data
  const memoizedInsights = useDeepCompareMemo(insightsData);

  // Chart refs for all categories
  const chartRefs = {
    supportTypeBreakdown: useRef(null),
    activeProgramsByStage: useRef(null),
    programsBySector: useRef(null),
    smeIndustryMatchDistribution: useRef(null),
    avgIntakeByIndustry: useRef(null),
    bigScoreComparison: useRef(null),
    avgFundingSecuredByProgramType: useRef(null),
    completionRateByProgramType: useRef(null),
    applicationVolumeOverTime: useRef(null),
    timeToAcceptanceByMonth: useRef(null),
    rejectedVsAcceptedApplicants: useRef(null)
  };

  useEffect(() => {
    if (loading) return;
    
    // Store current props for next comparison
    prevActiveTab.current = activeTab;

    // Destroy existing charts
    charts.current.forEach(chart => chart.destroy());
    charts.current = [];

    const brownPalette = {
      primary: "#6d4c41",
      secondary: "#8d6e63",
      tertiary: "#a1887f",
      light: "#bcaaa4",
      lighter: "#d7ccc8",
      lightest: "#efebe9",
      accent1: "#5d4037",
      accent2: "#4e342e",
      accent3: "#3e2723",
    };

    // Format labels for display
    const formatLabel = (label) => {
      return label
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const createChart = (ref, config) => {
      if (ref.current) {
        const ctx = ref.current.getContext("2d");
        if (ctx) {
          const chart = new Chart(ctx, config);
          charts.current.push(chart);
        }
      }
    };

    // Helper function to set Y-axis scale from 0 to 50 with steps of 10
    const getYScaleConfig = (title) => ({
      beginAtZero: true,
      max: 50,
      title: {
        display: true,
        text: title,
        color: brownPalette.primary
      },
      ticks: { 
        color: brownPalette.primary, 
        font: { size: 10 },
        stepSize: 10
      },
      grid: { color: brownPalette.lighter },
    });

    // Program Types & Reach Charts
    if (activeTab === "program-types") {
      // Support Type Breakdown (Bar Chart)
      createChart(chartRefs.supportTypeBreakdown, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.supportTypeBreakdown).map(formatLabel),
          datasets: [{
            label: "Number of Programs",
            data: Object.values(memoizedInsights.supportTypeBreakdown),
            backgroundColor: brownPalette.primary,
            borderColor: brownPalette.accent1,
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Support Type Breakdown",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Support Type",
                color: brownPalette.primary
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                maxRotation: 45
              },
              grid: { color: brownPalette.lighter }
            },
            y: getYScaleConfig("Number of Programs"),
          },
        },
      });

      // Active Programs by Stage (Horizontal Bar Chart)
      createChart(chartRefs.activeProgramsByStage, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.activeProgramsByStage),
          datasets: [{
            label: "Number of Programs",
            data: Object.values(memoizedInsights.activeProgramsByStage),
            backgroundColor: brownPalette.secondary,
            borderColor: brownPalette.primary,
            borderWidth: 1,
          }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Active Programs by Preferred Stage",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: getYScaleConfig("Number of Programs"),
            y: {
              title: {
                display: true,
                text: "Business Stage",
                color: brownPalette.primary
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 }
              },
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });

      // Longest Running Programs (Leaderboard)
      // This will be displayed as a leaderboard component
    }

    // Sector Focus Charts
    if (activeTab === "sector-focus") {
      // Programs by Sector (Bar Chart)
      createChart(chartRefs.programsBySector, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.programsBySector).map(formatLabel),
          datasets: [{
            label: "Number of Programs",
            data: Object.values(memoizedInsights.programsBySector),
            backgroundColor: brownPalette.accent1,
            borderColor: brownPalette.primary,
            borderWidth: 1,
          }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Support Focus Distribution",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: getYScaleConfig("Number of Programs"),
            y: {
              title: {
                display: true,
                text: "Support Focus",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });

      // SME Industry Match Distribution (Stacked Bar Chart)
      createChart(chartRefs.smeIndustryMatchDistribution, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.smeIndustryMatchDistribution),
          datasets: [
            {
              label: "Matched",
              data: Object.values(memoizedInsights.smeIndustryMatchDistribution).map(d => d.matched),
              backgroundColor: brownPalette.primary,
            },
            {
              label: "Unmatched",
              data: Object.values(memoizedInsights.smeIndustryMatchDistribution).map(d => d.unmatched),
              backgroundColor: brownPalette.lighter,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "SME Industry Match Distribution",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: {
              position: "top",
              labels: {
                color: brownPalette.primary,
                font: { size: 10 }
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: "Match Count",
                color: brownPalette.primary
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 20
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              stacked: true,
              title: {
                display: true,
                text: "Industry",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });

      // Avg. Intake by Industry Categories (Column Chart)
      createChart(chartRefs.avgIntakeByIndustry, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.avgIntakeByIndustry),
          datasets: [{
            label: "Avg. No. of SMEs",
            data: Object.values(memoizedInsights.avgIntakeByIndustry),
            backgroundColor: brownPalette.tertiary,
            borderColor: brownPalette.primary,
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Avg. Intake by Industry Categories",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Industry Categories",
                color: brownPalette.primary
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                maxRotation: 45
              },
              grid: { color: brownPalette.lighter }
            },
            y: getYScaleConfig("Avg. No. of SMEs"),
          },
        },
      });
    }

    // Outcomes & Effectiveness Charts
    if (activeTab === "outcomes-effectiveness") {
      // BIG Score Comparison: With Catalyst vs Without Catalyst (Dual Bar Chart)
      createChart(chartRefs.bigScoreComparison, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.bigScoreComparison),
          datasets: [{
            label: "Average BIG Score",
            data: Object.values(memoizedInsights.bigScoreComparison),
            backgroundColor: [brownPalette.lighter, brownPalette.primary],
            borderColor: brownPalette.accent1,
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "BIG Score: With Catalyst vs Without Catalyst",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Catalyst Support",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter }
            },
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: "Average BIG Score",
                color: brownPalette.primary
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 20
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });

      // Avg. Funding Secured By Program Type (Column Chart)
      createChart(chartRefs.avgFundingSecuredByProgramType, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.avgFundingSecuredByProgramType).map(formatLabel),
          datasets: [{
            label: "Average Funding (ZAR)",
            data: Object.values(memoizedInsights.avgFundingSecuredByProgramType),
            backgroundColor: brownPalette.light,
            borderColor: brownPalette.primary,
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Avg. Funding Secured By Program Type",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Program",
                color: brownPalette.primary
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                maxRotation: 45
              },
              grid: { color: brownPalette.lighter }
            },
            y: {
              beginAtZero: true,
              max: 50,
              title: {
                display: true,
                text: "Average Funding (Millions ZAR)",
                color: brownPalette.primary
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                callback: function(value) {
                  return value + 'M';
                },
                stepSize: 10
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      });

      // Approval Rate by Program Type (Horizontal Bar Chart)
      createChart(chartRefs.completionRateByProgramType, {
        type: "bar",
        data: {
          labels: memoizedInsights.completionRateByProgramType.map(d => formatLabel(d.type)),
          datasets: [{
            label: "Approval Rate (%)",
            data: memoizedInsights.completionRateByProgramType.map(d => d.rate),
            backgroundColor: brownPalette.primary,
            borderColor: brownPalette.accent1,
            borderWidth: 1,
          }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Approval Rate by Program Type",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: "Approval Rate (%)",
                color: brownPalette.primary
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                callback: function(value) { return value + '%'; },
                stepSize: 20
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              title: {
                display: true,
                text: "Program Type",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter }
            },
          },
        },
      });
    }

    // Engagement Patterns Charts
    if (activeTab === "engagement-patterns") {
      // Application Volume Over Time (Line Chart)
      createChart(chartRefs.applicationVolumeOverTime, {
        type: "line",
        data: {
          labels: memoizedInsights.applicationVolumeOverTime.map(d => d.month),
          datasets: [{
            label: "Applications",
            data: memoizedInsights.applicationVolumeOverTime.map(d => d.applications),
            borderColor: brownPalette.primary,
            backgroundColor: brownPalette.lighter,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: brownPalette.primary,
            pointBorderColor: brownPalette.accent1,
            pointRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Application Volume Over Time",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Month",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter }
            },
            y: getYScaleConfig("Applications"),
          },
        },
      });

      // Rejected vs Accepted Applicants (Donut Chart)
      createChart(chartRefs.rejectedVsAcceptedApplicants, {
        type: "doughnut",
        data: {
          labels: Object.keys(memoizedInsights.rejectedVsAcceptedApplicants),
          datasets: [{
            data: Object.values(memoizedInsights.rejectedVsAcceptedApplicants),
            backgroundColor: [
              brownPalette.primary,
              brownPalette.lighter,
            ],
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Rejected vs Accepted Applicants",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: {
              position: "bottom",
              labels: {
                color: brownPalette.primary,
                boxWidth: 8,
                padding: 8,
                font: { size: 9 },
              },
            },
          },
        },
      });

      // Applications vs Acceptances by Month (Line Chart with two lines)
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      createChart(chartRefs.timeToAcceptanceByMonth, {
        type: "line",
        data: {
          labels: monthNames,
          datasets: [
            {
              label: "Applications Submitted",
              data: monthNames.map(month => memoizedInsights.timeToAcceptanceData.applied[month] || 0),
              borderColor: brownPalette.primary,
              backgroundColor: 'transparent',
              tension: 0.4,
              pointBackgroundColor: brownPalette.primary,
              pointBorderColor: brownPalette.accent1,
              pointRadius: 4,
            },
            {
              label: "Applications Accepted",
              data: monthNames.map(month => memoizedInsights.timeToAcceptanceData.accepted[month] || 0),
              borderColor: brownPalette.secondary,
              backgroundColor: 'transparent',
              tension: 0.4,
              pointBackgroundColor: brownPalette.secondary,
              pointBorderColor: brownPalette.accept2,
              pointRadius: 4,
            }
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Applications vs Acceptances by Month",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: {
              position: "top",
              labels: {
                color: brownPalette.primary,
                font: { size: 10 }
              },
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Month",
                color: brownPalette.primary
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter }
            },
            y: getYScaleConfig("Number of Applications"),
          },
        },
      });
    }

    return () => {
      charts.current.forEach(chart => chart.destroy());
    };
  }, [activeTab, memoizedInsights, loading]);

  if (loading) {
    return <div className="fundingInsights">Loading accelerator insights...</div>;
  }

  return (
    <div className="fundingInsights">
      <div className="insightsSummary">
        <div className="insightCard">
          <div className="insightIcon"><TrendingUp size={18} /></div>
          <div className="insightContent">
            <h3>{memoizedInsights.matchRate}%</h3>
            <p>Match Rate</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon"><DollarSign size={18} /></div>
          <div className="insightContent">
            <h3>R{(memoizedInsights.averageFundingAmount / 1000).toFixed(0)}K</h3>
            <p>Avg. Funding</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon"><Users size={18} /></div>
          <div className="insightContent">
            <h3>{memoizedInsights.activeFundersCount}</h3>
            <p>Active Programs</p>
          </div>
        </div>
        <div className="insightCard">
          <div className="insightIcon"><Clock size={18} /></div>
          <div className="insightContent">
            <h3>{memoizedInsights.averageProcessingTime} days</h3>
            <p>Processing Time</p>
          </div>
        </div>
      </div>

      <div className="insightsTabs">
        <div className="insightsTabHeader">
          <button
            className={`insightsTab ${activeTab === "program-types" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("program-types")}
          >
            <Rocket size={12} /> <span>Program Types & Reach</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "sector-focus" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("sector-focus")}
          >
            <Target size={12} /> <span>Sector Focus</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "outcomes-effectiveness" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("outcomes-effectiveness")}
          >
            <Award size={12} /> <span>Outcomes & Effectiveness</span>
          </button>
          <button
            className={`insightsTab ${activeTab === "engagement-patterns" ? "insightsTabActive" : ""}`}
            onClick={() => setActiveTab("engagement-patterns")}
          >
            <Activity size={12} /> <span>Engagement Patterns</span>
          </button>
        </div>
      </div>

      <div className="insightsContainer">
        {activeTab === "program-types" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.supportTypeBreakdown} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.activeProgramsByStage} />
            </div>
            <div className="chartContainer leaderboardContainer">
              <div className="leaderboard">
                <h3>Top 3 Longest Running Programs</h3>
                <div className="leaderboardList">
                  {memoizedInsights.longestRunningPrograms.map((program, index) => (
                    <div key={index} className="leaderboardItem">
                      <span className="rank">#{index + 1}</span>
                      <span className="industry">{program.name}</span>
                      <span className="amount">{program.daysSinceSubmission} days ago</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        
        {activeTab === "sector-focus" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.programsBySector} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.smeIndustryMatchDistribution} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgIntakeByIndustry} />
            </div>
          </>
        )}
        
        {activeTab === "outcomes-effectiveness" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.bigScoreComparison} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.avgFundingSecuredByProgramType} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.completionRateByProgramType} />
            </div>
          </>
        )}
        
        {activeTab === "engagement-patterns" && (
          <>
            <div className="chartContainer">
              <canvas ref={chartRefs.applicationVolumeOverTime} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.rejectedVsAcceptedApplicants} />
            </div>
            <div className="chartContainer">
              <canvas ref={chartRefs.timeToAcceptanceByMonth} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}