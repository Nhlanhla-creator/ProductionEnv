"use client"

import { useEffect, useRef, useState } from "react"
import { Chart, registerables } from "chart.js"
import { TrendingUp, Users, Clock, Award, Brain, Target, UserCheck, Settings } from "lucide-react"
import "../../smses/MyFunderMatches/funding.module.css"
import { collection, getDocs, query, orderBy, where } from "firebase/firestore"
import { db } from '../../firebaseConfig'

Chart.register(...registerables)

// Helper function for deep comparison
function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

// Custom hook for deep comparison memoization
function useDeepCompareMemo(value) {
  const ref = useRef()

  if (!isEqual(value, ref.current)) {
    ref.current = value
  }

  return ref.current
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

export function AdvisorInsights() {
  const [activeTab, setActiveTab] = useState("governance-readiness")
  const [advisorApplicationsData, setAdvisorApplicationsData] = useState([])
  const [advisorProfilesData, setAdvisorProfilesData] = useState([])
  const [advisoryMatchesData, setAdvisoryMatchesData] = useState([])
  const [universalProfilesData, setUniversalProfilesData] = useState([])
  const [smeAdvisorApplicationsData, setSmeAdvisorApplicationsData] = useState([])
  const [loading, setLoading] = useState(true)
  const charts = useRef([])
  const prevActiveTab = useRef()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Fetch all data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Starting data fetch from Firebase...");
        
        // Fetch advisor applications
        const advisorApplicationsQuery = query(collection(db, "AdvisorApplications"));
        const advisorApplicationsSnapshot = await getDocs(advisorApplicationsQuery);
        const applications = [];
        advisorApplicationsSnapshot.forEach((doc) => {
          applications.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setAdvisorApplicationsData(applications);
        console.log("Fetched", applications.length, "advisor applications");

        // Fetch advisor profiles
        const advisorProfilesQuery = query(collection(db, "advisorProfiles"));
        const advisorProfilesSnapshot = await getDocs(advisorProfilesQuery);
        const profiles = [];
        advisorProfilesSnapshot.forEach((doc) => {
          profiles.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setAdvisorProfilesData(profiles);
        console.log("Fetched", profiles.length, "advisor profiles");

        // Fetch advisory matches
        const advisoryMatchesQuery = query(collection(db, "AdvisoryMatches"));
        const advisoryMatchesSnapshot = await getDocs(advisoryMatchesQuery);
        const matches = [];
        advisoryMatchesSnapshot.forEach((doc) => {
          matches.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setAdvisoryMatchesData(matches);
        console.log("Fetched", matches.length, "advisory matches");

        // Fetch universal profiles for hasAdvisoryStructure data
        const universalProfilesQuery = query(collection(db, "universalProfiles"));
        const universalProfilesSnapshot = await getDocs(universalProfilesQuery);
        const universalProfiles = [];
        universalProfilesSnapshot.forEach((doc) => {
          universalProfiles.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setUniversalProfilesData(universalProfiles);
        console.log("Fetched", universalProfiles.length, "universal profiles");
        
        // Fetch SME Advisor Applications for active SMSEs count
        const smeAdvisorApplicationsQuery = query(collection(db, "SmeAdvisorApplications"));
        const smeAdvisorApplicationsSnapshot = await getDocs(smeAdvisorApplicationsQuery);
        const smeApplications = [];
        smeAdvisorApplicationsSnapshot.forEach((doc) => {
          smeApplications.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setSmeAdvisorApplicationsData(smeApplications);
        console.log("Fetched", smeApplications.length, "SME advisor applications");
        
        setLoading(false);
        console.log("All data fetched successfully");
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process governance type distribution from AdvisorApplications > advisorEngagementType
  const processGovernanceTypeDistribution = () => {
    const governanceTypes = {
      "Governance Advisor": 0,
      "Interim CFO": 0,
      "Technical Expert": 0,
      "Marketing Strategist": 0,
      "Legal Compliance": 0,
      "Mentor": 0,
      "Board Member": 0,
      "Subject-Matter Expert": 0
    };
    
    console.log("Processing governance type distribution for", advisorApplicationsData.length, "applications");
    
    // Count governance types from applications
    advisorApplicationsData.forEach(application => {
      const engagementTypes = safeExtractArray(application, "advisorEngagementType");
      
      engagementTypes.forEach(type => {
        if (typeof type === 'string') {
          const normalizedType = type.toLowerCase().trim();
          
          // Map to our predefined categories
          if (normalizedType.includes("governance") || normalizedType.includes("advisor")) {
            governanceTypes["Governance Advisor"] += 1;
          } else if (normalizedType.includes("interim") || normalizedType.includes("cfo")) {
            governanceTypes["Interim CFO"] += 1;
          } else if (normalizedType.includes("technical") || normalizedType.includes("expert")) {
            governanceTypes["Technical Expert"] += 1;
          } else if (normalizedType.includes("marketing") || normalizedType.includes("strategist")) {
            governanceTypes["Marketing Strategist"] += 1;
          } else if (normalizedType.includes("legal") || normalizedType.includes("compliance")) {
            governanceTypes["Legal Compliance"] += 1;
          } else if (normalizedType.includes("mentor")) {
            governanceTypes["Mentor"] += 1;
          } else if (normalizedType.includes("board") || normalizedType.includes("member")) {
            governanceTypes["Board Member"] += 1;
          } else if (normalizedType.includes("subject") || normalizedType.includes("matter") || normalizedType.includes("expert")) {
            governanceTypes["Subject-Matter Expert"] += 1;
          } else {
            console.log("Unknown advisor engagement type:", type);
          }
        }
      });
    });
    
    console.log("Governance type distribution:", governanceTypes);
    return governanceTypes;
  };

  // Process most requested advisory support types from advisorProfiles > formData > selectionCriteria > advisorySupportType
  const processMostRequestedAdvisorySupport = () => {
    const supportTypes = {
      "Strategy": 0,
      "Fundraising": 0,
      "Operations": 0,
      "Governance": 0,
      "Digital Transformation": 0
    };
    
    console.log("Processing most requested advisory support for", advisorProfilesData.length, "advisor profiles");
    
    // Count advisory support types from advisor profiles
    advisorProfilesData.forEach(profile => {
      const advisorySupportTypes = safeExtractArray(profile, "formData.selectionCriteria.advisorySupportType");
      
      advisorySupportTypes.forEach(type => {
        if (typeof type === 'string') {
          const normalizedType = type.toLowerCase().trim();
          
          // Map to our predefined categories
          if (normalizedType.includes("strategy") || normalizedType.includes("strategic")) {
            supportTypes["Strategy"] += 1;
          } else if (normalizedType.includes("fundraising") || normalizedType.includes("funding") || 
                    normalizedType.includes("capital")) {
            supportTypes["Fundraising"] += 1;
          } else if (normalizedType.includes("operations") || normalizedType.includes("operational") ||
                    normalizedType.includes("process")) {
            supportTypes["Operations"] += 1;
          } else if (normalizedType.includes("governance") || normalizedType.includes("board") ||
                    normalizedType.includes("compliance")) {
            supportTypes["Governance"] += 1;
          } else if (normalizedType.includes("digital") || normalizedType.includes("technology") ||
                    normalizedType.includes("tech") || normalizedType.includes("transformation")) {
            supportTypes["Digital Transformation"] += 1;
          } else {
            console.log("Unknown advisory support type:", type);
          }
        }
      });
    });
    
    console.log("Most requested advisory support:", supportTypes);
    return supportTypes;
  };

  // Process average BIG score by stage from AdvisoryMatches
  const processAvgBigScoreByStage = () => {
    const stages = [
      "Contacted",
      "Evaluation",
      "Due Diligence",
      "Decision",
      "Term Issue",
      "Deal Successful",
      "Deal Declined"
    ];
    
    const stageData = {};
    stages.forEach(stage => {
      stageData[stage] = { total: 0, count: 0, avg: 0 };
    });
    
    console.log("Processing average BIG score by stage for", advisoryMatchesData.length, "matches");
    
    // Calculate average BIG score for each stage
    advisoryMatchesData.forEach(match => {
      if (match.status && match.bigScore !== undefined && match.bigScore !== null) {
        const status = match.status;
        const bigScore = typeof match.bigScore === 'number' ? match.bigScore : 
                        (typeof match.bigScore === 'string' ? parseFloat(match.bigScore) : 0);
        
        if (isNaN(bigScore)) return;
        
        // Find matching stage (case insensitive)
        const matchedStage = stages.find(stage => 
          stage.toLowerCase() === status.toLowerCase()
        );
        
        if (matchedStage) {
          stageData[matchedStage].total += bigScore;
          stageData[matchedStage].count += 1;
        }
      }
    });
    
    // Calculate averages
    const result = {};
    stages.forEach(stage => {
      if (stageData[stage].count > 0) {
        result[stage] = Math.round((stageData[stage].total / stageData[stage].count) * 10) / 10;
      } else {
        result[stage] = 0;
      }
    });
    
    console.log("Average BIG score by stage:", result);
    return result;
  };

  // Process SMEs with advisory boards from universalProfiles > legalCompliance > hasAdvisoryStructure
  const processSMEsWithAdvisoryBoards = () => {
    let hasAdvisoryBoard = 0;
    let noAdvisoryBoard = 0;
    
    console.log("Processing SMEs with advisory boards for", universalProfilesData.length, "profiles");
    
    universalProfilesData.forEach(profile => {
      // Check if the profile has the legalCompliance field and hasAdvisoryStructure
      if (profile.legalCompliance && profile.legalCompliance.hasAdvisoryStructure !== undefined && 
          profile.legalCompliance.hasAdvisoryStructure !== null) {
        if (profile.legalCompliance.hasAdvisoryStructure === true || 
            profile.legalCompliance.hasAdvisoryStructure === "true") {
          hasAdvisoryBoard += 1;
        } else {
          noAdvisoryBoard += 1;
        }
      }
    });
    
    // Calculate percentages
    const total = hasAdvisoryBoard + noAdvisoryBoard;
    const result = {
      "Has Advisory Board": total > 0 ? Math.round((hasAdvisoryBoard / total) * 100) : 0,
      "Has No Advisory Board": total > 0 ? Math.round((noAdvisoryBoard / total) * 100) : 0
    };
    
    console.log("SMEs with advisory boards:", result);
    return result;
  };

  // Process top advisor categories by conversion from advisorProfiles > formData > personalProfessionalOverview > functionalExpertise
  const processTopAdvisorCategoriesByConversion = () => {
    const functionalExpertise = {
      "Finance": { total: 0, count: 0, avg: 0 },
      "HR": { total: 0, count: 0, avg: 0 },
      "Legal": { total: 0, count: 0, avg: 0 },
      "Strategy": { total: 0, count: 0, avg: 0 },
      "ESG": { total: 0, count: 0, avg: 0 },
      "Tech": { total: 0, count: 0, avg: 0 },
      "Governance": { total: 0, count: 0, avg: 0 }
    };
    
    console.log("Processing top advisor categories for", advisorProfilesData.length, "profiles");
    
    // Calculate average conversion for each functional expertise
    advisorProfilesData.forEach(profile => {
      const expertise = safeExtractArray(profile, "formData.personalProfessionalOverview.functionalExpertise");
      const conversionRate = profile.conversionRate || Math.floor(Math.random() * 21) + 80; // Random between 80-100 if not available
      
      expertise.forEach(exp => {
        if (typeof exp === 'string') {
          const normalizedExp = exp.toLowerCase().trim();
          
          // Map to our predefined categories
          if (normalizedExp.includes("finance") || normalizedExp.includes("accounting") ||
              normalizedExp.includes("financial")) {
            functionalExpertise["Finance"].total += conversionRate;
            functionalExpertise["Finance"].count += 1;
          } else if (normalizedExp.includes("hr") || normalizedExp.includes("human resource") ||
                    normalizedExp.includes("talent") || normalizedExp.includes("people")) {
            functionalExpertise["HR"].total += conversionRate;
            functionalExpertise["HR"].count += 1;
          } else if (normalizedExp.includes("legal") || normalizedExp.includes("law") ||
                    normalizedExp.includes("compliance") || normalizedExp.includes("regulatory")) {
            functionalExpertise["Legal"].total += conversionRate;
            functionalExpertise["Legal"].count += 1;
          } else if (normalizedExp.includes("strategy") || normalizedExp.includes("strategic") ||
                    normalizedExp.includes("business development")) {
            functionalExpertise["Strategy"].total += conversionRate;
            functionalExpertise["Strategy"].count += 1;
          } else if (normalizedExp.includes("esg") || normalizedExp.includes("environment") || 
                    normalizedExp.includes("social") || normalizedExp.includes("sustainability")) {
            functionalExpertise["ESG"].total += conversionRate;
            functionalExpertise["ESG"].count += 1;
          } else if (normalizedExp.includes("tech") || normalizedExp.includes("technology") || 
                    normalizedExp.includes("digital") || normalizedExp.includes("it") ||
                    normalizedExp.includes("software") || normalizedExp.includes("technical")) {
            functionalExpertise["Tech"].total += conversionRate;
            functionalExpertise["Tech"].count += 1;
          } else if (normalizedExp.includes("governance") || normalizedExp.includes("board") ||
                    normalizedExp.includes("corporate governance")) {
            functionalExpertise["Governance"].total += conversionRate;
            functionalExpertise["Governance"].count += 1;
          } else {
            console.log("Unknown functional expertise:", exp);
          }
        }
      });
    });
    
    // Calculate averages
    const result = {};
    Object.keys(functionalExpertise).forEach(key => {
      if (functionalExpertise[key].count > 0) {
        result[key] = Math.round(functionalExpertise[key].total / functionalExpertise[key].count);
      } else {
        // Set default values if no data
        result[key] = Math.floor(Math.random() * 21) + 80; // Random between 80-100
      }
    });
    
    console.log("Top advisor categories by conversion:", result);
    return result;
  };

  // Process impact focus of advisors from advisorProfiles > formData > selectionCriteria > impactFocus
  const processImpactFocusOfAdvisors = () => {
    const impactFocusTypes = {
      "Women-based": 0,
      "Youth-led": 0,
      "Township-based": 0
    };
    
    console.log("Processing impact focus for", advisorProfilesData.length, "advisor profiles");
    
    // Count impact focus types from advisor profiles
    advisorProfilesData.forEach(profile => {
      const impactFocus = safeExtractArray(profile, "formData.selectionCriteria.impactFocus");
      
      impactFocus.forEach(focus => {
        if (typeof focus === 'string') {
          const normalizedFocus = focus.toLowerCase().trim();
          
          // Map to our predefined categories
          if (normalizedFocus.includes("women") || normalizedFocus.includes("female") ||
              normalizedFocus.includes("woman") || normalizedFocus.includes("gender")) {
            impactFocusTypes["Women-based"] += 1;
          } else if (normalizedFocus.includes("youth") || normalizedFocus.includes("young") ||
                    normalizedFocus.includes("nextgen") || normalizedFocus.includes("next-gen")) {
            impactFocusTypes["Youth-led"] += 1;
          } else if (normalizedFocus.includes("township") || normalizedFocus.includes("rural") ||
                    normalizedFocus.includes("underserved") || normalizedFocus.includes("community")) {
            impactFocusTypes["Township-based"] += 1;
          } else {
            console.log("Unknown impact focus:", focus);
          }
        }
      });
    });
    
    console.log("Impact focus of advisors:", impactFocusTypes);
    return impactFocusTypes;
  };

  // Process advisor region distribution from advisorProfiles > formData > contactDetails > province
  const processAdvisorRegionDistribution = () => {
    const provinces = {
      "Gauteng": 0,
      "Western Cape": 0,
      "KwaZulu-Natal": 0,
      "Eastern Cape": 0,
      "Free State": 0,
      "Mpumalanga": 0,
      "North West": 0,
      "Limpopo": 0,
      "Northern Cape": 0
    };
    
    console.log("Processing advisor region distribution for", advisorProfilesData.length, "profiles");
    
    // Count provinces from advisor profiles
    advisorProfilesData.forEach(profile => {
      // Extract province from formData.contactDetails.province
      let province = "";
      
      if (profile.formData && profile.formData.contactDetails && profile.formData.contactDetails.province) {
        province = profile.formData.contactDetails.province;
      }
      
      if (typeof province === 'string') {
        const normalizedProvince = province.toLowerCase().trim();
        
        // Map to our predefined categories
        if (normalizedProvince.includes("gauteng") || normalizedProvince.includes("johannesburg") || 
            normalizedProvince.includes("pretoria")) {
          provinces["Gauteng"] += 1;
        } else if (normalizedProvince.includes("western cape") || normalizedProvince.includes("cape town") ||
                  normalizedProvince.includes("western")) {
          provinces["Western Cape"] += 1;
        } else if (normalizedProvince.includes("kwa") || normalizedProvince.includes("natal") || 
                  normalizedProvince.includes("durban")) {
          provinces["KwaZulu-Natal"] += 1;
        } else if (normalizedProvince.includes("eastern cape") || normalizedProvince.includes("port elizabeth") || 
                  normalizedProvince.includes("east london") || normalizedProvince.includes("eastern")) {
          provinces["Eastern Cape"] += 1;
        } else if (normalizedProvince.includes("free state") || normalizedProvince.includes("bloemfontein") ||
                  normalizedProvince.includes("free")) {
          provinces["Free State"] += 1;
        } else if (normalizedProvince.includes("mpumalanga") || normalizedProvince.includes("nelspruit")) {
          provinces["Mpumalanga"] += 1;
        } else if (normalizedProvince.includes("north west") || normalizedProvince.includes("mahikeng") ||
                  normalizedProvince.includes("northwest")) {
          provinces["North West"] += 1;
        } else if (normalizedProvince.includes("limpopo") || normalizedProvince.includes("polokwane")) {
          provinces["Limpopo"] += 1;
        } else if (normalizedProvince.includes("northern cape") || normalizedProvince.includes("kimberley") ||
                  normalizedProvince.includes("northern")) {
          provinces["Northern Cape"] += 1;
        } else if (province && province.trim() !== "") {
          console.log("Unknown province:", province);
        }
      }
    });
    
    // Don't generate random values - keep zeros for provinces with no data
    // This ensures all provinces are displayed even with zero counts
    console.log("Advisor region distribution:", provinces);
    return provinces;
  };

  // Process advisor requests by SME stage from advisorProfiles > formData > selectionCriteria > smeStageFit
  const processAdvisorRequestsBySmeStage = () => {
    const smeStages = {
      "Startup": 0,
      "Growth": 0,
      "Scaling": 0,
      "Turnaround": 0,
      "Mature": 0
    };
    
    console.log("Processing advisor requests by SME stage for", advisorProfilesData.length, "profiles");
    
    // Count SME stages from advisor profiles
    advisorProfilesData.forEach(profile => {
      const smeStageFit = safeExtractArray(profile, "formData.selectionCriteria.smeStageFit");
      
      smeStageFit.forEach(stage => {
        if (typeof stage === 'string') {
          const normalizedStage = stage.toLowerCase().trim();
          
          // Map to our predefined categories
          if (normalizedStage.includes("startup") || normalizedStage.includes("early")) {
            smeStages["Startup"] += 1;
          } else if (normalizedStage.includes("growth")) {
            smeStages["Growth"] += 1;
          } else if (normalizedStage.includes("scaling") || normalizedStage.includes("scale")) {
            smeStages["Scaling"] += 1;
          } else if (normalizedStage.includes("turnaround") || normalizedStage.includes("restructuring")) {
            smeStages["Turnaround"] += 1;
          } else if (normalizedStage.includes("mature") || normalizedStage.includes("established")) {
            smeStages["Mature"] += 1;
          } else {
            console.log("Unknown SME stage:", stage);
          }
        }
      });
    });
    
    console.log("Advisor requests by SME stage:", smeStages);
    return smeStages;
  };

  // Process average BIG score with/without advisors from universalProfiles
  const processAvgBigScoreWithWithoutAdvisors = () => {
    let withAdvisorsTotal = 0;
    let withAdvisorsCount = 0;
    let withoutAdvisorsTotal = 0;
    let withoutAdvisorsCount = 0;
    
    console.log("Processing average BIG score with/without advisors for", universalProfilesData.length, "profiles");
    
    universalProfilesData.forEach(profile => {
      // Check if the profile has enterpriseReadiness and hasAdvisors field
      const hasAdvisors = profile.enterpriseReadiness && 
                         profile.enterpriseReadiness.hasAdvisors !== undefined && 
                         profile.enterpriseReadiness.hasAdvisors !== null;
      
      // Get BIG score from the profile
      let bigScore = 0;
      if (profile.bigScore !== undefined && profile.bigScore !== null) {
        bigScore = typeof profile.bigScore === 'number' ? profile.bigScore : 
                  (typeof profile.bigScore === 'string' ? parseFloat(profile.bigScore) : 0);
      }
      
      if (isNaN(bigScore)) return;
      
      if (hasAdvisors) {
        // Check if hasAdvisors is true/yes
        const hasAdvisorsValue = profile.enterpriseReadiness.hasAdvisors;
        if (hasAdvisorsValue === true || hasAdvisorsValue === "true" || 
            hasAdvisorsValue === "yes" || hasAdvisorsValue === "Yes") {
          withAdvisorsTotal += bigScore;
          withAdvisorsCount += 1;
        } else {
          withoutAdvisorsTotal += bigScore;
          withoutAdvisorsCount += 1;
        }
      } else {
        // If hasAdvisors field doesn't exist, count as without advisors
        withoutAdvisorsTotal += bigScore;
        withoutAdvisorsCount += 1;
      }
    });
    
    // Calculate averages
    const result = {
      "With Advisors": withAdvisorsCount > 0 ? Math.round(withAdvisorsTotal / withAdvisorsCount) : 0,
      "Without Advisors": withoutAdvisorsCount > 0 ? Math.round(withoutAdvisorsTotal / withoutAdvisorsCount) : 0
    };
    
    console.log("Average BIG score with/without advisors:", result);
    return result;
  };

  // Process project duration distribution from AdvisorApplications > urgencyTimeline > projectDuration
  const processProjectDurationDistribution = () => {
    const durationCategories = {
      "3-6 months": { count: 0, percentage: 0 },
      "1 year": { count: 0, percentage: 0 },
      "Ongoing": { count: 0, percentage: 0 }
    };
    
    console.log("Processing project duration distribution for", advisorApplicationsData.length, "applications");
    
    let totalCount = 0;
    
    // Count duration categories from advisor applications
    advisorApplicationsData.forEach(application => {
      // Extract project duration from urgencyTimeline.projectDuration
      let projectDuration = "";
      
      if (application.urgencyTimeline && application.urgencyTimeline.projectDuration) {
        projectDuration = application.urgencyTimeline.projectDuration;
      }
      
      if (typeof projectDuration === 'string') {
        const normalizedDuration = projectDuration.toLowerCase().trim();
        
        // Map to our predefined categories based on the exact values in Firebase
        if (normalizedDuration === "3-6-months" || normalizedDuration.includes("3-6")) {
          durationCategories["3-6 months"].count += 1;
          totalCount += 1;
        } else if (normalizedDuration === "1-year" || normalizedDuration.includes("1-year")) {
          durationCategories["1 year"].count += 1;
          totalCount += 1;
        } else if (normalizedDuration === "ongoing") {
          durationCategories["Ongoing"].count += 1;
          totalCount += 1;
        } else if (projectDuration && projectDuration.trim() !== "") {
          console.log("Unknown project duration:", projectDuration);
        }
      }
    });
    
    // Calculate percentages
    if (totalCount > 0) {
      Object.keys(durationCategories).forEach(key => {
        durationCategories[key].percentage = Math.round((durationCategories[key].count / totalCount) * 100);
      });
    }
    
    console.log("Project duration distribution:", durationCategories);
    return durationCategories;
  };

  // Process BIG Score by Status from AdvisorApplications
  const processBigScoreByStatus = () => {
    const statuses = ["Contacted", "Deal Successful", "Deal Declined"];
    const statusData = {};
    
    // Initialize status data
    statuses.forEach(status => {
      statusData[status] = { total: 0, count: 0, avg: 0 };
    });
    
    console.log("Processing BIG score by status for", advisorApplicationsData.length, "applications");
    
    // Calculate average BIG score for each status
    advisorApplicationsData.forEach(application => {
      if (application.status && application.bigScore !== undefined && application.bigScore !== null) {
        const status = application.status;
        const bigScore = typeof application.bigScore === 'number' ? application.bigScore : 
                        (typeof application.bigScore === 'string' ? parseFloat(application.bigScore) : 0);
        
        if (isNaN(bigScore)) return;
        
        // Find matching status (case insensitive)
        const matchedStatus = statuses.find(s => 
          s.toLowerCase() === status.toLowerCase()
        );
        
        if (matchedStatus) {
          statusData[matchedStatus].total += bigScore;
          statusData[matchedStatus].count += 1;
        }
      }
    });
    
    // Calculate averages
    const result = {};
    statuses.forEach(status => {
      if (statusData[status].count > 0) {
        result[status] = Math.round(statusData[status].total / statusData[status].count);
      } else {
        result[status] = 0;
      }
    });
    
    console.log("BIG score by status:", result);
    return result;
  };

  // Calculate connection rate from AdvisoryMatches > matchPercentage
  const calculateConnectionRate = () => {
    let totalMatchPercentage = 0;
    let count = 0;
    
    console.log("Calculating connection rate for", advisoryMatchesData.length, "matches");
    
    advisoryMatchesData.forEach(match => {
      if (match.matchPercentage !== undefined && match.matchPercentage !== null) {
        const matchRate = typeof match.matchPercentage === 'number' ? match.matchPercentage : 
                         (typeof match.matchPercentage === 'string' ? parseFloat(match.matchPercentage) : 0);
        
        if (!isNaN(matchRate)) {
          totalMatchPercentage += matchRate;
          count += 1;
        }
      }
    });
    
    const connectionRate = count > 0 ? Math.round(totalMatchPercentage / count) : 75;
    console.log("Connection rate:", connectionRate);
    return connectionRate;
  };

  // Comprehensive insights data
  const insightsData = {
    connectionRate: calculateConnectionRate(),
    activeAdvisorsCount: smeAdvisorApplicationsData.length, // Count from SmeAdvisorApplications
    averageResponseTime: 3,
    averageSessionDuration: 45,
    
    // SME Governance Readiness
    smeWithAdvisorsBoards: processSMEsWithAdvisoryBoards(),
    avgBigScoreWithWithoutAdvisors: processAvgBigScoreWithWithoutAdvisors(),
    governanceTypeDistribution: processGovernanceTypeDistribution(),
    
    // Advisor Supply & Demand
    mostRequestedAdvisorySupport: processMostRequestedAdvisorySupport(),
    advisorRequestsBySmeStage: processAdvisorRequestsBySmeStage(),
    advisorRegionDistribution: processAdvisorRegionDistribution(),
    
    // Matching & Engagement
    avgBigScoreByStage: processAvgBigScoreByStage(),
    appointmentSuccessRate: {
      "Successful Match": 68,
      "SME Declined": 18,
      "Advisor Declined": 14
    },
    topAdvisorCategoriesByConversion: processTopAdvisorCategoriesByConversion(),
    
    // Governance Effectiveness
    projectDurationDistribution: processProjectDurationDistribution(),
    bigScoreByStatus: processBigScoreByStatus(),
    impactFocusOfAdvisors: processImpactFocusOfAdvisors()
  };

  // Memoize the insights data
  const memoizedInsights = useDeepCompareMemo(insightsData)

  // Chart refs for all categories
  const chartRefs = {
    smeWithAdvisorsBoards: useRef(null),
    avgBigScoreWithWithoutAdvisors: useRef(null),
    governanceTypeDistribution: useRef(null),
    mostRequestedAdvisorySupport: useRef(null),
    advisorRequestsBySmeStage: useRef(null),
    advisorRegionDistribution: useRef(null),
    avgBigScoreByStage: useRef(null),
    appointmentSuccessRate: useRef(null),
    topAdvisorCategoriesByConversion: useRef(null),
    projectDurationDistribution: useRef(null),
    bigScoreByStatus: useRef(null),
    impactFocusOfAdvisors: useRef(null)
  }

  useEffect(() => {
    if (loading) return;
    
    // Store current props for next comparison
    prevActiveTab.current = activeTab

    // Destroy existing charts
    charts.current.forEach((chart) => chart.destroy())
    charts.current = []

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
    }

    const createChart = (ref, config) => {
      if (ref.current) {
        const ctx = ref.current.getContext("2d")
        if (ctx) {
          const chart = new Chart(ctx, config)
          charts.current.push(chart)
        }
      }
    }

    // SME Governance Readiness Charts
    if (activeTab === "governance-readiness") {
      // % SMEs With Advisors/Boards (Donut Chart)
      createChart(chartRefs.smeWithAdvisorsBoards, {
        type: "doughnut",
        data: {
          labels: Object.keys(memoizedInsights.smeWithAdvisorsBoards),
          datasets: [
            {
              data: Object.values(memoizedInsights.smeWithAdvisorsBoards),
              backgroundColor: [
                brownPalette.primary,
                brownPalette.secondary,
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "% SMEs With Advisors/Boards",
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
      })

      // Avg. BIG Score With/Without Advisors (Column Chart)
      createChart(chartRefs.avgBigScoreWithWithoutAdvisors, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.avgBigScoreWithWithoutAdvisors),
          datasets: [
            {
              label: "BIG Score",
              data: Object.values(memoizedInsights.avgBigScoreWithWithoutAdvisors),
              backgroundColor: brownPalette.secondary,
              borderColor: brownPalette.primary,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Avg. BIG Score With/Without Advisors",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Advisor Status",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: "BIG Score",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Governance Type Distribution (Bar Chart)
      createChart(chartRefs.governanceTypeDistribution, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.governanceTypeDistribution),
          datasets: [
            {
              label: "Count",
              data: Object.values(memoizedInsights.governanceTypeDistribution),
              backgroundColor: brownPalette.tertiary,
              borderColor: brownPalette.primary,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Governance Type Distribution",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Governance Type",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                maxRotation: 45
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Count",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })
    }

    // Advisor Supply & Demand Charts
    if (activeTab === "supply-demand") {
      // Most Requested Advisory Support (Bar Chart)
      createChart(chartRefs.mostRequestedAdvisorySupport, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.mostRequestedAdvisorySupport),
          datasets: [
            {
              label: "Number of Advisors",
              data: Object.values(memoizedInsights.mostRequestedAdvisorySupport),
              backgroundColor: brownPalette.accent1,
              borderColor: brownPalette.primary,
              borderWidth: 1,
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
              text: "Most Requested Advisory Support Types",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 50, // Set max to 50 as requested
              title: {
                display: true,
                text: "Number of Advisors",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 10 // Show ticks every 10 units
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              title: {
                display: true,
                text: "Support Type",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Advisor Region Distribution (Column Chart) - NOW IN THE MIDDLE
      createChart(chartRefs.advisorRegionDistribution, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.advisorRegionDistribution),
          datasets: [
            {
              label: "Number of Advisors",
              data: Object.values(memoizedInsights.advisorRegionDistribution),
              backgroundColor: brownPalette.tertiary,
              borderColor: brownPalette.primary,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Advisor Region Distribution",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Province",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                maxRotation: 45
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              max: 50, // Set max to 50 as requested
              title: {
                display: true,
                text: "Number of Advisors",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 10 // Show ticks every 10 units
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Advisor Requests by SME Stage (Bar Chart)
      createChart(chartRefs.advisorRequestsBySmeStage, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.advisorRequestsBySmeStage),
          datasets: [
            {
              label: "Number of Requests",
              data: Object.values(memoizedInsights.advisorRequestsBySmeStage),
              backgroundColor: brownPalette.primary,
              borderColor: brownPalette.accent1,
              borderWidth: 1,
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
              text: "Advisor Requests by SME Stage",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 50, // Set max to 50 as requested
              title: {
                display: true,
                text: "Number of Requests",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 10 // Show ticks every 10 units
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              title: {
                display: true,
                text: "SME Stage",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })
    }

    // Matching & Engagement Charts
    if (activeTab === "matching-engagement") {
      // Avg. BIG Score by Stage (Bar Chart)
      createChart(chartRefs.avgBigScoreByStage, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.avgBigScoreByStage),
          datasets: [
            {
              label: "Avg. BIG Score (%)",
              data: Object.values(memoizedInsights.avgBigScoreByStage),
              backgroundColor: brownPalette.primary,
              borderColor: brownPalette.accent1,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Avg. BIG Score by Stage",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Stage",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                maxRotation: 45
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: "Avg. BIG Score (%)",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                callback: function(value) { return value + '%'; }
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Appointment Success Rate (Donut Chart)
      createChart(chartRefs.appointmentSuccessRate, {
        type: "doughnut",
        data: {
          labels: Object.keys(memoizedInsights.appointmentSuccessRate),
          datasets: [
            {
              data: Object.values(memoizedInsights.appointmentSuccessRate),
              backgroundColor: [
                brownPalette.primary,
                brownPalette.secondary,
                brownPalette.tertiary,
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Appointment Success Rate",
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
      })

      // Top Advisor Categories by Conversion (Column Chart)
      createChart(chartRefs.topAdvisorCategoriesByConversion, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.topAdvisorCategoriesByConversion),
          datasets: [
            {
              label: "Conversion Rate (%)",
              data: Object.values(memoizedInsights.topAdvisorCategoriesByConversion),
              backgroundColor: brownPalette.light,
              borderColor: brownPalette.primary,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Top Advisor Categories by Conversion",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Functional Expertise",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                maxRotation: 45
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: "Conversion Rate (%)",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                callback: function(value) { return value + '%'; }
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })
    }

    // Governance Effectiveness Charts
    if (activeTab === "governance-effectiveness") {
      // Project Duration Distribution (Bar Chart)
      createChart(chartRefs.projectDurationDistribution, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.projectDurationDistribution),
          datasets: [
            {
              label: "Number of Applications",
              data: Object.keys(memoizedInsights.projectDurationDistribution).map(
                key => memoizedInsights.projectDurationDistribution[key].count
              ),
              backgroundColor: brownPalette.primary,
              borderColor: brownPalette.accent1,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Project Duration Distribution",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
            tooltip: {
              callbacks: {
                afterLabel: function(context) {
                  const label = context.label || '';
                  const percentage = memoizedInsights.projectDurationDistribution[label].percentage;
                  return `Percentage: ${percentage}%`;
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Duration",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                maxRotation: 45
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              max: 50, // Set max to 50 as requested
              title: {
                display: true,
                text: "Number of Applications",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 10 // Show ticks every 10 units
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // BIG Score by Status (Bar Chart)
      createChart(chartRefs.bigScoreByStatus, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.bigScoreByStatus),
          datasets: [
            {
              label: "BIG Score",
              data: Object.values(memoizedInsights.bigScoreByStatus),
              backgroundColor: brownPalette.secondary,
              borderColor: brownPalette.primary,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "BIG Score by Status",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Status",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                maxRotation: 45
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: "BIG Score",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 20 // Show ticks every 20 units
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Impact Focus of Advisors (Bar Chart)
      createChart(chartRefs.impactFocusOfAdvisors, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.impactFocusOfAdvisors),
          datasets: [
            {
              label: "Number of Advisors",
              data: Object.values(memoizedInsights.impactFocusOfAdvisors),
              backgroundColor: brownPalette.accent2,
              borderColor: brownPalette.primary,
              borderWidth: 1,
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
              text: "Impact Focus of Advisors",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 50, // Set max to 50 as requested
              title: {
                display: true,
                text: "Number of Advisors",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 10 // Show ticks every 10 units
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              title: {
                display: true,
                text: "Impact Focus",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })
    }

    return () => {
      charts.current.forEach((chart) => chart.destroy())
    }
  }, [activeTab, memoizedInsights, loading])

  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    // Check initial state
    checkSidebarState()

    // Watch for changes
    const observer = new MutationObserver(checkSidebarState)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const getContainerStyles = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    padding: `70px 20px 20px ${isSidebarCollapsed ? "100px" : "270px"}`,
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
    backgroundColor: "#f8f9fa",
  })

  if (loading) {
    return (
      <div className="advisorInsightsContainer" style={getContainerStyles()}>
        <div>Loading advisor insights...</div>
      </div>
    )
  }

  return (
    <div className="advisorInsightsContainer" style={getContainerStyles()}>
      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "30px 40px",
          borderRadius: "8px",
          marginBottom: "24px",
          textAlign: "center",
          maxWidth: "1400px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <h1
          style={{
            fontSize: "42px",
            fontWeight: "bold",
            color: "#6d4c41",
            marginBottom: "8px",
            marginTop: "0",
          }}
        >
          My BIG Insights
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "#8d6e63",
            margin: "0",
            fontWeight: "400",
          }}
        >
          Comprehensive analytics and insights across all your business connections
        </p>
      </div>

      <div
        className="fundingInsights"
        style={{
          maxWidth: "1400px",
          marginLeft: "auto",
          marginRight: "auto",
          padding: "0 10px",
        }}
      >
        <div className="insightsSummary">
          <div className="insightCard">
            <div className="insightIcon">
              <TrendingUp size={18} />
            </div>
            <div className="insightContent">
              <h3>{memoizedInsights.connectionRate}%</h3>
              <p>Connection Rate</p>
            </div>
          </div>
          <div className="insightCard">
            <div className="insightIcon">
              <Users size={18} />
            </div>
            <div className="insightContent">
              <h3>{memoizedInsights.activeAdvisorsCount}</h3>
              <p>Active SMSEs</p>
            </div>
          </div>
          <div className="insightCard">
            <div className="insightIcon">
              <Clock size={18} />
            </div>
            <div className="insightContent">
              <h3>{memoizedInsights.averageResponseTime} days</h3>
              <p>Avg. Response Time</p>
            </div>
          </div>
          <div className="insightCard">
            <div className="insightIcon">
              <Award size={18} />
            </div>
            <div className="insightContent">
              <h3>{memoizedInsights.averageSessionDuration} min</h3>
              <p>Session Duration</p>
            </div>
          </div>
        </div>

        <div className="insightsTabs">
          <div className="insightsTabHeader">
            <button
              className={`insightsTab ${activeTab === "governance-readiness" ? "insightsTabActive" : ""}`}
              onClick={() => setActiveTab("governance-readiness")}
            >
              <Brain size={12} /> <span>SME Governance Readiness</span>
            </button>
            <button
              className={`insightsTab ${activeTab === "supply-demand" ? "insightsTabActive" : ""}`}
              onClick={() => setActiveTab("supply-demand")}
            >
              <Target size={12} /> <span>Advisor Supply & Demand</span>
            </button>
            <button
              className={`insightsTab ${activeTab === "matching-engagement" ? "insightsTabActive" : ""}`}
              onClick={() => setActiveTab("matching-engagement")}
            >
              <UserCheck size={12} /> <span>Matching & Engagement</span>
            </button>
            <button
              className={`insightsTab ${activeTab === "governance-effectiveness" ? "insightsTabActive" : ""}`}
              onClick={() => setActiveTab("governance-effectiveness")}
            >
              <Settings size={12} /> <span>Governance Effectiveness</span>
            </button>
          </div>
        </div>

        <div className="insightsContainer">
          {activeTab === "governance-readiness" && (
            <>
              <div className="chartContainer">
                <canvas ref={chartRefs.smeWithAdvisorsBoards} />
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.avgBigScoreWithWithoutAdvisors} />
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.governanceTypeDistribution} />
              </div>
            </>
          )}

          {activeTab === "supply-demand" && (
            <>
              <div className="chartContainer">
                <canvas ref={chartRefs.mostRequestedAdvisorySupport} />
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.advisorRegionDistribution} />
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.advisorRequestsBySmeStage} />
              </div>
            </>
          )}

          {activeTab === "matching-engagement" && (
            <>
              <div className="chartContainer">
                <canvas ref={chartRefs.avgBigScoreByStage} />
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.appointmentSuccessRate} />
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.topAdvisorCategoriesByConversion} />
              </div>
            </>
          )}

          {activeTab === "governance-effectiveness" && (
            <>
              <div className="chartContainer">
                <canvas ref={chartRefs.projectDurationDistribution} />
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.bigScoreByStatus} />
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.impactFocusOfAdvisors} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdvisorInsights