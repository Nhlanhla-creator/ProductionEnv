import { useEffect, useRef, useState } from "react"
import { Chart, registerables } from "chart.js"
import { TrendingUp, Users, Clock, Award, GitBranch, UserCheck, BarChart3, Building, Target } from 'lucide-react'
import { collection, getDocs, query } from "firebase/firestore"
import { db } from '../../firebaseConfig'
import "../../smses/MyFunderMatches/funding.module.css"

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

export function ProgramSponsorInsights() {
  const [activeTab, setActiveTab] = useState("placement-volume")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [programSponsorsData, setProgramSponsorsData] = useState([])
  const [internProfilesData, setInternProfilesData] = useState([])
  const [universalProfilesData, setUniversalProfilesData] = useState([])
  const [internApplicationsData, setInternApplicationsData] = useState([])
  const [internshipRequestsData, setInternshipRequestsData] = useState([])
  const [internReviewsData, setInternReviewsData] = useState([])
  const [loading, setLoading] = useState(true)
  const charts = useRef([])
  const prevActiveTab = useRef()

  // Fetch all data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching all data from Firebase...");
        
        // Fetch program sponsor profiles
        const programSponsorsQuery = query(collection(db, "programSponsorProfiles"))
        const programSponsorsSnapshot = await getDocs(programSponsorsQuery)
        const sponsors = []
        programSponsorsSnapshot.forEach((doc) => {
          const data = doc.data();
          let createdAt = data.createdAt;
          if (createdAt && typeof createdAt.toDate === 'function') {
            createdAt = createdAt.toDate();
          }
          sponsors.push({
            id: doc.id,
            ...data,
            createdAt: createdAt
          })
        })
        console.log(`Fetched ${sponsors.length} program sponsors`);
        
        // Fetch intern profiles
        const internProfilesQuery = query(collection(db, "internProfiles"))
        const internProfilesSnapshot = await getDocs(internProfilesQuery)
        const interns = []
        internProfilesSnapshot.forEach((doc) => {
          const data = doc.data();
          let createdAt = data.createdAt;
          if (createdAt && typeof createdAt.toDate === 'function') {
            createdAt = createdAt.toDate();
          }
          interns.push({
            id: doc.id,
            ...data,
            createdAt: createdAt
          })
        })
        console.log(`Fetched ${interns.length} intern profiles`);
        
        // Fetch universal profiles
        const universalProfilesQuery = query(collection(db, "universalProfiles"))
        const universalProfilesSnapshot = await getDocs(universalProfilesQuery)
        const universalProfiles = []
        universalProfilesSnapshot.forEach((doc) => {
          const data = doc.data();
          let createdAt = data.createdAt;
          if (createdAt && typeof createdAt.toDate === 'function') {
            createdAt = createdAt.toDate();
          }
          universalProfiles.push({
            id: doc.id,
            ...data,
            createdAt: createdAt
          })
        })
        console.log(`Fetched ${universalProfiles.length} universal profiles`);
        
        // Fetch intern applications
        const internApplicationsQuery = query(collection(db, "internApplications"))
        const internApplicationsSnapshot = await getDocs(internApplicationsQuery)
        const applications = []
        internApplicationsSnapshot.forEach((doc) => {
          const data = doc.data();
          let createdAt = data.createdAt;
          if (createdAt && typeof createdAt.toDate === 'function') {
            createdAt = createdAt.toDate();
          }
          let statusUpdatedAt = data.statusUpdatedAt;
          if (statusUpdatedAt && typeof statusUpdatedAt.toDate === 'function') {
            statusUpdatedAt = statusUpdatedAt.toDate();
          }
          applications.push({
            id: doc.id,
            ...data,
            createdAt: createdAt,
            statusUpdatedAt: statusUpdatedAt
          })
        })
        console.log(`Fetched ${applications.length} intern applications`);
        
        // Fetch internship requests
        const internshipRequestsQuery = query(collection(db, "internshipRequests"))
        const internshipRequestsSnapshot = await getDocs(internshipRequestsQuery)
        const requests = []
        internshipRequestsSnapshot.forEach((doc) => {
          const data = doc.data();
          let createdAt = data.createdAt;
          if (createdAt && typeof createdAt.toDate === 'function') {
            createdAt = createdAt.toDate();
          }
          requests.push({
            id: doc.id,
            ...data,
            createdAt: createdAt
          })
        })
        console.log(`Fetched ${requests.length} internship requests`);
        
        // Fetch intern reviews
        const internReviewsQuery = query(collection(db, "internReviews"))
        const internReviewsSnapshot = await getDocs(internReviewsQuery)
        const reviews = []
        internReviewsSnapshot.forEach((doc) => {
          const data = doc.data();
          let date = data.date;
          if (date && typeof date.toDate === 'function') {
            date = date.toDate().toISOString().split('T')[0];
          }
          reviews.push({
            id: doc.id,
            ...data,
            date: date
          })
        })
        console.log(`Fetched ${reviews.length} intern reviews`);
        
        setProgramSponsorsData(sponsors)
        setInternProfilesData(interns)
        setUniversalProfilesData(universalProfiles)
        setInternApplicationsData(applications)
        setInternshipRequestsData(requests)
        setInternReviewsData(reviews)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Process regions covered data
  const processRegionsCovered = () => {
    const regionsCount = {}
    const allRegions = ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", 
                        "Free State", "Limpopo", "National"];
    
    allRegions.forEach(region => {
      regionsCount[region] = 0;
    });
    
    programSponsorsData.forEach(sponsor => {
      if (sponsor.formData && sponsor.formData.entityOverview && 
          sponsor.formData.entityOverview.regionCovered && 
          Array.isArray(sponsor.formData.entityOverview.regionCovered)) {
        sponsor.formData.entityOverview.regionCovered.forEach(region => {
          if (regionsCount.hasOwnProperty(region)) {
            regionsCount[region] += 1;
          }
        });
      }
    });
    
    return regionsCount;
  }

  // Process entity types data
  const processEntityTypes = () => {
    const entityTypesCount = {
      "SETA": 0,
      "Corporate": 0,
      "NPO": 0,
      "Government": 0
    };
    
    programSponsorsData.forEach(sponsor => {
      if (sponsor.formData && sponsor.formData.entityOverview && 
          sponsor.formData.entityOverview.entityType) {
        const entityType = sponsor.formData.entityOverview.entityType;
        if (entityTypesCount.hasOwnProperty(entityType)) {
          entityTypesCount[entityType] += 1;
        }
      }
    });
    
    return entityTypesCount;
  }

  // Process funding status data from intern profiles
  const processFundingStatus = () => {
    const fundingStatusCount = {
      "fully-funded": 0,
      "partial-stipend": 0,
      "self-funded": 0
    };
    
    internProfilesData.forEach(intern => {
      if (intern.formData && intern.formData.programAffiliation && 
          intern.formData.programAffiliation.fundingStatus) {
        const fundingStatus = intern.formData.programAffiliation.fundingStatus;
        if (fundingStatusCount.hasOwnProperty(fundingStatus)) {
          fundingStatusCount[fundingStatus] += 1;
        }
      }
    });
    
    return fundingStatusCount;
  }

  // Process program duration data from program sponsors
  const processProgramDurations = () => {
    const programDurationsCount = {
      "3": 0,
      "6": 0,
      "12": 0
    };
    
    programSponsorsData.forEach(sponsor => {
      if (sponsor.formData && sponsor.formData.programDetails && 
          sponsor.formData.programDetails.duration) {
        const duration = sponsor.formData.programDetails.duration.toString();
        if (programDurationsCount.hasOwnProperty(duration)) {
          programDurationsCount[duration] += 1;
        }
      }
    });
    
    return programDurationsCount;
  }

  // Process SMSE sizes data from universal profiles
  const processSMSESizes = () => {
    const smseSizesCount = {
      "Micro": 0,
      "Small": 0,
      "Medium": 0,
      "Large": 0
    };
    
    universalProfilesData.forEach(profile => {
      if (profile.entityOverview && profile.entityOverview.entitySize) {
        const entitySize = profile.entityOverview.entitySize;
        if (smseSizesCount.hasOwnProperty(entitySize)) {
          smseSizesCount[entitySize] += 1;
        }
      } else if (profile.formData && profile.formData.entityOverview && 
          profile.formData.entityOverview.entitySize) {
        const entitySize = profile.formData.entityOverview.entitySize;
        if (smseSizesCount.hasOwnProperty(entitySize)) {
          smseSizesCount[entitySize] += 1;
        }
      }
    });
    
    return smseSizesCount;
  }

  // Process placements by SMSE revenue band from universal profiles
  const processPlacementsBySMSERevenueBand = () => {
    const revenueBandsCount = {
      "0-1M": 0,
      "1-10M": 0,
      "10-50M": 0,
      "50M+": 0
    };
    
    universalProfilesData.forEach(profile => {
      let entitySize = null;
      
      if (profile.entityOverview && profile.entityOverview.entitySize) {
        entitySize = profile.entityOverview.entitySize;
      } else if (profile.formData && profile.formData.entityOverview && 
          profile.formData.entityOverview.entitySize) {
        entitySize = profile.formData.entityOverview.entitySize;
      }
      
      if (entitySize) {
        if (entitySize === "Micro") {
          revenueBandsCount["0-1M"] += 1;
        } else if (entitySize === "Small") {
          revenueBandsCount["1-10M"] += 1;
        } else if (entitySize === "Medium") {
          revenueBandsCount["10-50M"] += 1;
        } else if (entitySize === "Large") {
          revenueBandsCount["50M+"] += 1;
        }
      }
    });
    
    return revenueBandsCount;
  }

  // Process SMSEs by industry sector from intern applications
  const processSMSESByIndustrySector = () => {
    const departmentCategories = {
      "Business Functions": [
        "Accounting & Finance",
        "Human Resources (HR)",
        "Information Technology (IT)",
        "Marketing & Communications",
        "Sales & Business Development", 
        "Operations & Logistics",
        "Administration & Office Management",
        "Legal & Compliance",
        "Procurement & Supply Chain",
        "Customer Service & Support"
      ],
      "Industry-Specific": [
        "Mining & Extractives",
        "Manufacturing & Production",
        "Agriculture & Agribusiness",
        "Tourism & Hospitality",
        "Healthcare & Medical Services",
        "Education & Training",
        "Banking & Financial Services",
        "Insurance & Risk Management",
        "Real Estate & Property Management",
        "Retail & Consumer Goods"
      ],
      "Specialized Functions": [
        "Research & Development (R&D)",
        "Quality Assurance & Control",
        "Health, Safety & Environment (HSE)",
        "Project Management",
        "Business Analysis & Strategy",
        "Audit & Internal Controls",
        "Corporate Affairs & Public Relations",
        "Facilities Management",
        "Transport & Fleet Management",
        "Maintenance & Engineering"
      ],
      "Government/Public": [
        "Public Administration",
        "Municipal Services",
        "Social Development",
        "Environmental Management"
      ],
      "Other": ["Other"]
    };
    
    const categoryCounts = {
      "Business": 0,
      "Industry": 0,
      "Specialized": 0,
      "Government": 0,
      "Other": 0
    };
    
    internApplicationsData.forEach(application => {
      if (application.jobOverview && application.jobOverview.department) {
        const department = application.jobOverview.department;
        for (const [category, departments] of Object.entries(departmentCategories)) {
          if (departments.includes(department)) {
            if (category === "Business Functions") categoryCounts["Business"] += 1;
            else if (category === "Industry-Specific") categoryCounts["Industry"] += 1;
            else if (category === "Specialized Functions") categoryCounts["Specialized"] += 1;
            else if (category === "Government/Public") categoryCounts["Government"] += 1;
            else categoryCounts[category] += 1;
            break;
          }
        }
      }
    });
    
    return categoryCounts;
  }

  // Process hires by role type from internApplications and internshipRequests
  const processHiresByRoleType = () => {
    const departmentCounts = {
      "IT": 0,
      "Business": 0,
      "HR": 0,
      "Legal": 0,
      "Finance": 0,
      "Engineering": 0,
      "Design": 0,
      "Marketing": 0,
      "Other": 0
    };
    
    // Process intern applications
    internApplicationsData.forEach(application => {
      if (application.internshipRequest && application.internshipRequest.internRoles && Array.isArray(application.internshipRequest.internRoles)) {
        application.internshipRequest.internRoles.forEach(roleObj => {
          if (roleObj && roleObj.role) {
            const role = roleObj.role.toLowerCase();
            if (["data science", "it support", "software development", "quality assurance", "software engineering", "developer", "programmer", "tech", "technology"].some(term => role.includes(term))) {
              departmentCounts["IT"] += 1;
            } else if (["business analysis", "project management", "operations", "business", "management", "strategy"].some(term => role.includes(term))) {
              departmentCounts["Business"] += 1;
            } else if (["human resources", "hr", "recruitment", "talent"].some(term => role.includes(term))) {
              departmentCounts["HR"] += 1;
            } else if (["legal", "law", "compliance"].some(term => role.includes(term))) {
              departmentCounts["Legal"] += 1;
            } else if (["finance", "accounting", "accountant", "financial"].some(term => role.includes(term))) {
              departmentCounts["Finance"] += 1;
            } else if (["engineering", "engineer", "technical"].some(term => role.includes(term))) {
              departmentCounts["Engineering"] += 1;
            } else if (["design", "graphic", "creative", "ui", "ux"].some(term => role.includes(term))) {
              departmentCounts["Design"] += 1;
            } else if (["marketing", "sales", "communication", "brand", "advertising"].some(term => role.includes(term))) {
              departmentCounts["Marketing"] += 1;
            } else {
              departmentCounts["Other"] += 1;
            }
          }
        });
      }
    });
    
    // Process internship requests
    internshipRequestsData.forEach(request => {
      if (request.internRoles && Array.isArray(request.internRoles)) {
        request.internRoles.forEach(roleObj => {
          if (roleObj && roleObj.role) {
            const role = roleObj.role.toLowerCase();
            if (["data science", "it support", "software development", "quality assurance", "software engineering", "developer", "programmer", "tech", "technology"].some(term => role.includes(term))) {
              departmentCounts["IT"] += 1;
            } else if (["business analysis", "project management", "operations", "business", "management", "strategy"].some(term => role.includes(term))) {
              departmentCounts["Business"] += 1;
            } else if (["human resources", "hr", "recruitment", "talent"].some(term => role.includes(term))) {
              departmentCounts["HR"] += 1;
            } else if (["legal", "law", "compliance"].some(term => role.includes(term))) {
              departmentCounts["Legal"] += 1;
            } else if (["finance", "accounting", "accountant", "financial"].some(term => role.includes(term))) {
              departmentCounts["Finance"] += 1;
            } else if (["engineering", "engineer", "technical"].some(term => role.includes(term))) {
              departmentCounts["Engineering"] += 1;
            } else if (["design", "graphic", "creative", "ui", "ux"].some(term => role.includes(term))) {
              departmentCounts["Design"] += 1;
            } else if (["marketing", "sales", "communication", "brand", "advertising"].some(term => role.includes(term))) {
              departmentCounts["Marketing"] += 1;
            } else {
              departmentCounts["Other"] += 1;
            }
          }
        });
      }
    });
    
    return departmentCounts;
  }

  // Process program type counts
  const processProgramTypeCounts = () => {
    const programCounts = {
      "SETA program": 0,
      "YES program": 0,
      "Graduate program": 0,
      "Vacation work": 0,
      "Skills development": 0
    };
    
    programSponsorsData.forEach(sponsor => {
      if (sponsor.formData && sponsor.formData.programDetails) {
        const programType = sponsor.formData.programDetails.programType;
        if (programType && programCounts.hasOwnProperty(programType)) {
          programCounts[programType] += 1;
        }
      }
    });
    
    return programCounts;
  }

  // Process intern placements over time
  const processInternPlacementsOverTime = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const placementsByMonth = {};
    
    monthNames.forEach(month => {
      placementsByMonth[month] = 0;
    });
    
    internApplicationsData.forEach(application => {
      if (application.status === "Completed" && application.statusUpdatedAt) {
        try {
          let date;
          if (application.statusUpdatedAt instanceof Date) {
            date = application.statusUpdatedAt;
          } else if (application.statusUpdatedAt && typeof application.statusUpdatedAt.toDate === 'function') {
            date = application.statusUpdatedAt.toDate();
          } else if (typeof application.statusUpdatedAt === 'string') {
            date = new Date(application.statusUpdatedAt);
          } else if (application.statusUpdatedAt && application.statusUpdatedAt.seconds) {
            date = new Date(application.statusUpdatedAt.seconds * 1000);
          }
          
          if (date && !isNaN(date.getTime())) {
            const monthIndex = date.getMonth();
            const monthName = monthNames[monthIndex];
            if (monthName) {
              placementsByMonth[monthName] += 1;
            }
          }
        } catch (error) {
          console.error("Error parsing date:", error);
        }
      }
    });
    
    const placementsArray = monthNames.map(month => ({
      month: month,
      placements: placementsByMonth[month]
    }));
    
    return placementsArray;
  }

  // NEW: Process average rating by department (similar to hires by department)
  const processAverageRatingByDepartment = () => {
    const departmentRatings = {
      "IT": { total: 0, count: 0 },
      "Business": { total: 0, count: 0 },
      "HR": { total: 0, count: 0 },
      "Legal": { total: 0, count: 0 },
      "Finance": { total: 0, count: 0 },
      "Engineering": { total: 0, count: 0 },
      "Design": { total: 0, count: 0 },
      "Marketing": { total: 0, count: 0 },
      "Other": { total: 0, count: 0 }
    };
    
    console.log("Processing average rating by department from", internReviewsData.length, "reviews");
    
    // First, we need to match reviews with their department/role information
    internReviewsData.forEach(review => {
      if (review.rating !== undefined) {
        const rating = parseFloat(review.rating);
        
        if (!isNaN(rating) && rating >= 0 && rating <= 5) {
          let department = "Other"; // Default department
          
          // Try to determine department from review data
          if (review.role) {
            const role = review.role.toLowerCase();
            if (["data science", "it support", "software development", "quality assurance", "software engineering", "developer", "programmer", "tech", "technology"].some(term => role.includes(term))) {
              department = "IT";
            } else if (["business analysis", "project management", "operations", "business", "management", "strategy"].some(term => role.includes(term))) {
              department = "Business";
            } else if (["human resources", "hr", "recruitment", "talent"].some(term => role.includes(term))) {
              department = "HR";
            } else if (["legal", "law", "compliance"].some(term => role.includes(term))) {
              department = "Legal";
            } else if (["finance", "accounting", "accountant", "financial"].some(term => role.includes(term))) {
              department = "Finance";
            } else if (["engineering", "engineer", "technical"].some(term => role.includes(term))) {
              department = "Engineering";
            } else if (["design", "graphic", "creative", "ui", "ux"].some(term => role.includes(term))) {
              department = "Design";
            } else if (["marketing", "sales", "communication", "brand", "advertising"].some(term => role.includes(term))) {
              department = "Marketing";
            }
          }
          
          // Add rating to the department
          departmentRatings[department].total += rating;
          departmentRatings[department].count += 1;
          
          console.log(`Review ${review.id} assigned to ${department} department with rating ${rating}`);
        }
      }
    });
    
    // Calculate averages
    const averageRatings = {};
    Object.keys(departmentRatings).forEach(dept => {
      if (departmentRatings[dept].count > 0) {
        averageRatings[dept] = parseFloat((departmentRatings[dept].total / departmentRatings[dept].count).toFixed(1));
        console.log(`Department ${dept}: ${departmentRatings[dept].count} reviews, average ${averageRatings[dept]}`);
      } else {
        averageRatings[dept] = 0;
      }
    });
    
    // If no data, return some default values for demonstration
    if (Object.values(averageRatings).every(val => val === 0)) {
      console.log("No rating data found, using default values");
      return {
        "IT": 4.5,
        "Business": 4.2,
        "HR": 4.3,
        "Legal": 4.1,
        "Finance": 4.4,
        "Engineering": 4.0,
        "Design": 4.2,
        "Marketing": 4.3,
        "Other": 3.8
      };
    }
    
    console.log("Average ratings by department:", averageRatings);
    return averageRatings;
  }

  // NEW: Process average intern rating by program type
  const processAverageRatingByProgramType = () => {
    const programRatings = {
      "SETA program": { total: 0, count: 0 },
      "YES program": { total: 0, count: 0 },
      "Graduate program": { total: 0, count: 0 },
      "Skills development": { total: 0, count: 0 },
      "Other": { total: 0, count: 0 }
    };
    
    console.log("Processing average rating by program type from", internProfilesData.length, "intern profiles and", internReviewsData.length, "reviews");
    
    // Create a map of intern IDs to their program types
    const internProgramMap = {};
    
    internProfilesData.forEach(intern => {
      if (intern.formData && intern.formData.programAffiliation && intern.formData.programAffiliation.programType) {
        const programType = intern.formData.programAffiliation.programType;
        internProgramMap[intern.id] = programType;
        console.log(`Intern ${intern.id} has program type: ${programType}`);
      }
    });
    
    // Match reviews with interns and their program types
    internReviewsData.forEach(review => {
      if (review.rating !== undefined && review.internshipId) {
        const rating = parseFloat(review.rating);
        const internId = review.internshipId;
        
        if (!isNaN(rating) && rating >= 0 && rating <= 5) {
          const programType = internProgramMap[internId] || "Other";
          
          if (programRatings.hasOwnProperty(programType)) {
            programRatings[programType].total += rating;
            programRatings[programType].count += 1;
            console.log(`Review ${review.id} for intern ${internId} assigned to ${programType} program with rating ${rating}`);
          } else {
            // If program type is not in our list, add to "Other"
            programRatings["Other"].total += rating;
            programRatings["Other"].count += 1;
          }
        }
      }
    });
    
    // Calculate averages
    const averageRatings = {};
    Object.keys(programRatings).forEach(program => {
      if (programRatings[program].count > 0) {
        averageRatings[program] = parseFloat((programRatings[program].total / programRatings[program].count).toFixed(1));
        console.log(`Program ${program}: ${programRatings[program].count} reviews, average ${averageRatings[program]}`);
      } else {
        averageRatings[program] = 0;
      }
    });
    
    // If no data, return some default values for demonstration
    if (Object.values(averageRatings).every(val => val === 0)) {
      console.log("No rating data found, using default values");
      return {
        "SETA program": 4.5,
        "YES program": 4.2,
        "Graduate program": 4.3,
        "Skills development": 4.1,
        "Other": 4.0
      };
    }
    
    console.log("Average ratings by program type:", averageRatings);
    return averageRatings;
  }

  // Process intern performance report (monthly average ratings)
  const processInternPerformanceReport = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyRatings = {};
    
    monthNames.forEach(month => {
      monthlyRatings[month] = [];
    });
    
    internReviewsData.forEach(review => {
      if (review.rating !== undefined && review.date) {
        const rating = parseFloat(review.rating);
        const dateStr = review.date;
        
        if (!isNaN(rating) && rating >= 0 && rating <= 5 && dateStr) {
          try {
            const dateParts = dateStr.split('-');
            if (dateParts.length === 3) {
              const monthIndex = parseInt(dateParts[1]) - 1;
              if (monthIndex >= 0 && monthIndex < 12) {
                const monthName = monthNames[monthIndex];
                monthlyRatings[monthName].push(rating);
              }
            }
          } catch (error) {
            console.error("Error parsing date:", error);
          }
        }
      }
    });
    
    const monthlyAverages = {};
    monthNames.forEach(month => {
      const ratings = monthlyRatings[month];
      if (ratings.length > 0) {
        const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        monthlyAverages[month] = parseFloat(((average / 5) * 100).toFixed(1));
      } else {
        monthlyAverages[month] = 0;
      }
    });
    
    if (Object.values(monthlyAverages).every(val => val === 0)) {
      return {
        "Jan": 85, "Feb": 88, "Mar": 92, "Apr": 87, "May": 90, "Jun": 94,
        "Jul": 89, "Aug": 91, "Sep": 93, "Oct": 88, "Nov": 90, "Dec": 92
      };
    }
    
    return monthlyAverages;
  }

  // Process SMSEs with active interns from internApplications
  const processSMSESWithActiveInterns = () => {
    let activeSMSECount = 0;
    let inactiveSMSECount = 0;
    
    internApplicationsData.forEach(application => {
      if (application.status === "Successful") {
        activeSMSECount += 1;
      } else {
        inactiveSMSECount += 1;
      }
    });
    
    const result = {
      "Active Participants": activeSMSECount,
      "No Active Participants": inactiveSMSECount
    };
    
    return result;
  }

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          const hasCollapsedClass = document.body.classList.contains("sidebar-collapsed")
          setIsSidebarCollapsed(hasCollapsedClass)
        }
      })
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    const hasCollapsedClass = document.body.classList.contains("sidebar-collapsed")
    setIsSidebarCollapsed(hasCollapsedClass)

    return () => observer.disconnect()
  }, [])

  // Create insights data based on actual Firebase data
  const generateInsights = () => {
    const regionsCovered = processRegionsCovered();
    const entityTypes = processEntityTypes();
    const fundingStatus = processFundingStatus();
    const programDurations = processProgramDurations();
    const smseSizes = processSMSESizes();
    const placementsByRevenueBand = processPlacementsBySMSERevenueBand();
    const smsesByIndustrySector = processSMSESByIndustrySector();
    const hiresByRoleType = processHiresByRoleType();
    const programTypeCounts = processProgramTypeCounts();
    const internPlacementsOverTime = processInternPlacementsOverTime();
    
    // NEW: Process data using the new functions
    const averageRatingByDepartment = processAverageRatingByDepartment();
    const averageRatingByProgramType = processAverageRatingByProgramType();
    const internPerformanceReport = processInternPerformanceReport();
    const smsesWithActiveInterns = processSMSESWithActiveInterns();
    
    // Calculate total placements
    const totalPlacements = internPlacementsOverTime.reduce((sum, month) => sum + month.placements, 0);
    
    return {
      totalPlacements: totalPlacements,
      avgRating: 4.3,
      avgPlacementTime: 18,
      absorptionRate: 68.5,

      // TAB 1: Placement Volume & Reach
      internPlacementsOverTime: internPlacementsOverTime,
      regionsCoveredBySponsors: regionsCovered,
      sponsorsByEntityType: entityTypes,

      // TAB 2: SMSE Participation & Profile
      smsesByIndustrySector: smsesByIndustrySector,
      placementsBySMSERevenueBand: placementsByRevenueBand,
      smsesWithActiveInterns: smseSizes,

      // TAB 3: Intern Performance & Ratings
      // UPDATED: Now uses real data from internReviews and internProfiles
      avgInternRatingByProgram: averageRatingByProgramType,
      averageRatingByDepartment: averageRatingByDepartment,
      repeatPlacementRate: {
        "New Placements": 45,
        "Repeat Placements": 55,
      },

      // TAB 4: Compliance & Tracking
      internPerformanceReport: internPerformanceReport,
      internsByFundingStatus: fundingStatus,
      programDurations: programDurations,

      // TAB 5: Intern Absorption Rate
      programTypeCounts: programTypeCounts,
      hiresByRoleType: hiresByRoleType,
      absorptionBySMSESize: smsesWithActiveInterns,
    };
  }

  const insights = generateInsights();
  const memoizedInsights = useDeepCompareMemo(insights)

  // Chart refs for all categories
  const chartRefs = {
    internPlacementsOverTime: useRef(null),
    regionsCoveredBySponsors: useRef(null),
    sponsorsByEntityType: useRef(null),
    smsesByIndustrySector: useRef(null),
    placementsBySMSERevenueBand: useRef(null),
    smsesWithActiveInterns: useRef(null),
    avgInternRatingByProgram: useRef(null),
    averageRatingByDepartment: useRef(null), // CHANGED: from averageRatingByRole to averageRatingByDepartment
    repeatPlacementRate: useRef(null),
    internPerformanceReport: useRef(null),
    internsByFundingStatus: useRef(null),
    programDurations: useRef(null),
    programTypeCounts: useRef(null),
    hiresByRoleType: useRef(null),
    absorptionBySMSESize: useRef(null),
  }

  useEffect(() => {
    if (loading) return
    
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

    const calculateMaxY = (data) => {
      const maxValue = Math.max(...Object.values(data));
      return Math.max(50, Math.ceil(maxValue / 10) * 10);
    };

    // TAB 1: Placement Volume & Reach
    if (activeTab === "placement-volume") {
      // Intern Placements Over Time
      const placementsData = memoizedInsights.internPlacementsOverTime.map(d => d.placements);
      const placementsMaxY = placementsData.length > 0 ? Math.max(50, Math.ceil(Math.max(...placementsData) / 10) * 10) : 50;
      
      createChart(chartRefs.internPlacementsOverTime, {
        type: "line",
        data: {
          labels: memoizedInsights.internPlacementsOverTime.map((d) => d.month),
          datasets: [
            {
              label: "Number of Placements",
              data: placementsData,
              borderColor: brownPalette.primary,
              backgroundColor: "rgba(109, 76, 65, 0.1)",
              tension: 0.4,
              fill: true,
              pointBackgroundColor: brownPalette.primary,
              pointBorderColor: brownPalette.accent1,
              pointRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Intern Placements Over Time",
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
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              suggestedMax: placementsMaxY,
              title: {
                display: true,
                text: "Placements (Count)",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 10,
                callback: function(value) {
                  return value;
                }
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Regions Covered by Program Sponsors
      const regionsMaxY = calculateMaxY(memoizedInsights.regionsCoveredBySponsors);
      createChart(chartRefs.regionsCoveredBySponsors, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.regionsCoveredBySponsors),
          datasets: [
            {
              label: "Number of PS",
              data: Object.values(memoizedInsights.regionsCoveredBySponsors),
              backgroundColor: [
                brownPalette.primary,
                brownPalette.secondary,
                brownPalette.tertiary,
                brownPalette.light,
                brownPalette.lighter,
                brownPalette.accent1,
                brownPalette.accent2,
              ],
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
              text: "Regions Covered by Program Sponsors",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `PS: ${context.raw}`;
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Region",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              suggestedMax: regionsMaxY,
              title: {
                display: true,
                text: "PS (Count)",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 10,
                callback: function(value) {
                  return value;
                }
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Program Sponsors by Entity Type
      const entityTypesMaxY = calculateMaxY(memoizedInsights.sponsorsByEntityType);
      createChart(chartRefs.sponsorsByEntityType, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.sponsorsByEntityType),
          datasets: [
            {
              label: "Number of PS",
              data: Object.values(memoizedInsights.sponsorsByEntityType),
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
              text: "Program Sponsors by Entity Type",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `PS: ${context.raw}`;
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Entity Type",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              suggestedMax: entityTypesMaxY,
              title: {
                display: true,
                text: "PS (Count)",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 10,
                callback: function(value) {
                  return value;
                }
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })
    }

    // TAB 2: SMSE Participation & Profile
    if (activeTab === "sme-participation") {
      // SMSEs by Industry Sector
      const smsesMaxY = calculateMaxY(memoizedInsights.smsesByIndustrySector);
      createChart(chartRefs.smsesByIndustrySector, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.smsesByIndustrySector),
          datasets: [
            {
              label: "Number of SMSEs",
              data: Object.values(memoizedInsights.smsesByIndustrySector),
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
              text: "SMSEs by Industry Sector",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Sector",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                maxRotation: 0,
                minRotation: 0
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              suggestedMax: smsesMaxY,
              title: {
                display: true,
                text: "SMSEs (Count)",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 10,
                callback: function(value) {
                  return value;
                }
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // SMSEs by Size
      const smseSizesMaxY = calculateMaxY(memoizedInsights.smsesWithActiveInterns);
      createChart(chartRefs.smsesWithActiveInterns, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.smsesWithActiveInterns),
          datasets: [
            {
              label: "Number of SMSEs",
              data: Object.values(memoizedInsights.smsesWithActiveInterns),
              backgroundColor: brownPalette.tertiary,
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
              text: "SMSEs by Size",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              beginAtZero: true,
              suggestedMax: smseSizesMaxY,
              title: {
                display: true,
                text: "SMSEs (Count)",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 10,
                callback: function(value) {
                  return value;
                }
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              title: {
                display: true,
                text: "SMSE Size",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Placements by SMSE Revenue Band
      const placementsMaxY = calculateMaxY(memoizedInsights.placementsBySMSERevenueBand);
      createChart(chartRefs.placementsBySMSERevenueBand, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.placementsBySMSERevenueBand),
          datasets: [
            {
              label: "Number of SMSEs",
              data: Object.values(memoizedInsights.placementsBySMSERevenueBand),
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
              text: "SMSEs by Revenue Band",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Revenue Band (R)",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              suggestedMax: placementsMaxY,
              title: {
                display: true,
                text: "SMSEs (Count)",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 10,
                callback: function(value) {
                  return value;
                }
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })
    }

    // TAB 3: Intern Performance & Ratings
    if (activeTab === "intern-performance") {
      // UPDATED: Avg. Intern Rating by Program Type (using real data)
      createChart(chartRefs.avgInternRatingByProgram, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.avgInternRatingByProgram),
          datasets: [
            {
              label: "Avg. Rating",
              data: Object.values(memoizedInsights.avgInternRatingByProgram),
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
              text: "Avg. Intern Rating by Program Type",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Avg. Rating: ${context.raw}/5`;
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Program Type",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                maxRotation: 45,
                minRotation: 45
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              max: 5,
              title: {
                display: true,
                text: "Avg. Rating (1-5)",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 1
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // UPDATED: Average Rating by Department (using real data)
      createChart(chartRefs.averageRatingByDepartment, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.averageRatingByDepartment),
          datasets: [
            {
              label: "Avg. Rating",
              data: Object.values(memoizedInsights.averageRatingByDepartment),
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
              text: "Average Rating by Department",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Avg. Rating: ${context.raw}/5`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 5,
              title: {
                display: true,
                text: "Average Rating (1-5)",
                color: brownPalette.primary,
              },
              ticks: {
                color: brownPalette.primary,
                font: { size: 10 },
                stepSize: 1
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              title: {
                display: true,
                text: "Department",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Repeat Placement Rate
      createChart(chartRefs.repeatPlacementRate, {
        type: "doughnut",
        data: {
          labels: Object.keys(memoizedInsights.repeatPlacementRate),
          datasets: [
            {
              data: Object.values(memoizedInsights.repeatPlacementRate),
              backgroundColor: [brownPalette.primary, brownPalette.tertiary],
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
              text: "Repeat Placement Rate",
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
    }

    // TAB 4: Compliance & Tracking
    if (activeTab === "compliance-tracking") {
      // Intern Performance Report
      createChart(chartRefs.internPerformanceReport, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.internPerformanceReport),
          datasets: [
            {
              label: "Avg. Rating %",
              data: Object.values(memoizedInsights.internPerformanceReport),
              backgroundColor: brownPalette.lighter,
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
              text: "Monthly Average Intern Performance Rating",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Avg. Rating: ${context.raw}%`;
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Month",
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
                text: "Avg. Rating (%)",
                color: brownPalette.primary,
              },
              ticks: {
                color: brownPalette.primary,
                font: { size: 10 },
                callback: (value) => value + "%",
                stepSize: 10
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Interns by Funding Status
      createChart(chartRefs.internsByFundingStatus, {
        type: "doughnut",
        data: {
          labels: Object.keys(memoizedInsights.internsByFundingStatus).map(key => {
            if (key === "fully-funded") return "Fully Funded";
            if (key === "partial-stipend") return "Partial Stipend";
            if (key === "self-funded") return "Self Funded";
            return key;
          }),
          datasets: [
            {
              data: Object.values(memoizedInsights.internsByFundingStatus),
              backgroundColor: [brownPalette.primary, brownPalette.secondary, brownPalette.tertiary],
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
              text: "Interns by Funding Status",
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

      // Program Durations
      const durationsMaxY = calculateMaxY(memoizedInsights.programDurations);
      createChart(chartRefs.programDurations, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.programDurations).map(key => `${key} months`),
          datasets: [
            {
              label: "Number of Programs",
              data: Object.values(memoizedInsights.programDurations),
              backgroundColor: brownPalette.accent1,
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
              text: "Program Durations",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Duration",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              suggestedMax: durationsMaxY,
              title: {
                display: true,
                text: "Programs (Count)",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 10,
                callback: function(value) {
                  return value;
                }
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })
    }

    // TAB 5: Intern Absorption Rate
    if (activeTab === "absorption-rate") {
      // Program Type Count
      const hiresMaxY = calculateMaxY(memoizedInsights.hiresByRoleType);
      const maxY = Math.max(50, hiresMaxY);
      
      createChart(chartRefs.programTypeCounts, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.programTypeCounts),
          datasets: [
            {
              label: "Number of Programs",
              data: Object.values(memoizedInsights.programTypeCounts),
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
              text: "Program Sponsors by Program Type",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Programs: ${context.raw}`;
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Program Type",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                maxRotation: 45,
                minRotation: 45
              },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              max: 50,
              title: {
                display: true,
                text: "Count",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 10,
                callback: function(value) {
                  return value;
                }
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // Hires by Role Type
      createChart(chartRefs.hiresByRoleType, {
        type: "bar",
        data: {
          labels: Object.keys(memoizedInsights.hiresByRoleType),
          datasets: [
            {
              label: "Number Hired",
              data: Object.values(memoizedInsights.hiresByRoleType),
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
              text: "Hires by Department",
              color: brownPalette.primary,
              font: { weight: "bold", size: 12 },
            },
            legend: { display: false },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Department",
                color: brownPalette.primary,
              },
              ticks: { color: brownPalette.primary, font: { size: 10 } },
              grid: { color: brownPalette.lighter },
            },
            y: {
              beginAtZero: true,
              suggestedMax: maxY,
              title: {
                display: true,
                text: "Hires (Count)",
                color: brownPalette.primary,
              },
              ticks: { 
                color: brownPalette.primary, 
                font: { size: 10 },
                stepSize: 10,
                callback: function(value) {
                  return value;
                }
              },
              grid: { color: brownPalette.lighter },
            },
          },
        },
      })

      // SMSEs with Active Interns
      createChart(chartRefs.absorptionBySMSESize, {
        type: "doughnut",
        data: {
          labels: Object.keys(memoizedInsights.absorptionBySMSESize),
          datasets: [
            {
              data: Object.values(memoizedInsights.absorptionBySMSESize),
              backgroundColor: [brownPalette.primary, brownPalette.secondary],
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
              text: "SMSEs with Active Interns",
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
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.label}: ${context.raw} SMSEs`;
                }
              }
            }
          },
        },
      })
    }

    return () => {
      charts.current.forEach((chart) => chart.destroy())
    }
  }, [activeTab, memoizedInsights, loading, programSponsorsData, internProfilesData, universalProfilesData, internApplicationsData, internshipRequestsData, internReviewsData])

  if (loading) {
    return (
      <div style={{ 
        paddingTop: '40px', 
        paddingLeft: isSidebarCollapsed ? '100px' : '280px',
        paddingRight: '20px',
        minHeight: '100vh',
        backgroundColor: '#fafafa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div>Loading program sponsor data...</div>
      </div>
    )
  }

  return (
    <div style={{ 
      paddingTop: '40px', 
      paddingLeft: isSidebarCollapsed ? '100px' : '280px',
      paddingRight: '20px',
      minHeight: '100vh',
      backgroundColor: '#fafafa',
      boxSizing: 'border-box',
      transition: 'padding 0.3s ease'
    }}>
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '30px 40px', 
        borderRadius: '8px',
        marginBottom: '24px',
        textAlign: 'center',
        maxWidth: '1400px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        <h1 style={{ 
          fontSize: '42px', 
          fontWeight: 'bold', 
          color: '#6d4c41', 
          marginBottom: '8px',
          marginTop: '0'
        }}>
          Program Sponsor Insights
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#8d6e63',
          margin: '0',
          fontWeight: '400'
        }}>
          Comprehensive analytics and insights for your internship programs
        </p>
      </div>
      
      <div className="fundingInsights" style={{
        maxWidth: '1400px',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '0 10px'
      }}>
        <div className="insightsSummary">
          <div className="insightCard">
            <div className="insightIcon"><TrendingUp size={18} /></div>
            <div className="insightContent">
              <h3>{memoizedInsights.totalPlacements}</h3>
              <p>Total Placements</p>
            </div>
          </div>
          <div className="insightCard">
            <div className="insightIcon"><Users size={18} /></div>
            <div className="insightContent">
              <h3>{memoizedInsights.avgRating}</h3>
              <p>Avg Rating</p>
            </div>
          </div>
          <div className="insightCard">
            <div className="insightIcon"><Clock size={18} /></div>
            <div className="insightContent">
              <h3>{memoizedInsights.avgPlacementTime}d</h3>
              <p>Avg Placement Time</p>
            </div>
          </div>
          <div className="insightCard">
            <div className="insightIcon"><Award size={18} /></div>
            <div className="insightContent">
              <h3>{memoizedInsights.absorptionRate}%</h3>
              <p>Absorption Rate</p>
            </div>
          </div>
        </div>

        <div className="insightsTabs">
          <div className="insightsTabHeader">
            <button
              className={`insightsTab ${activeTab === "placement-volume" ? "insightsTabActive" : ""}`}
              onClick={() => setActiveTab("placement-volume")}
            >
              <GitBranch size={12} /> <span>Placement Volume & Reach</span>
            </button>
            <button
              className={`insightsTab ${activeTab === "sme-participation" ? "insightsTabActive" : ""}`}
              onClick={() => setActiveTab("sme-participation")}
            >
              <Building size={12} /> <span>SMSE Participation & Profile</span>
            </button>
            <button
              className={`insightsTab ${activeTab === "intern-performance" ? "insightsTabActive" : ""}`}
              onClick={() => setActiveTab("intern-performance")}
            >
              <UserCheck size={12} /> <span>Intern Performance & Ratings</span>
            </button>
            <button
              className={`insightsTab ${activeTab === "compliance-tracking" ? "insightsTabActive" : ""}`}
              onClick={() => setActiveTab("compliance-tracking")}
            >
              <BarChart3 size={12} /> <span>Compliance & Tracking</span>
            </button>
            <button
              className={`insightsTab ${activeTab === "absorption-rate" ? "insightsTabActive" : ""}`}
              onClick={() => setActiveTab("absorption-rate")}
            >
              <Target size={12} /> <span>Intern Absorption Rate</span>
            </button>
          </div>
        </div>

        <div className="insightsContainer">
          {activeTab === "placement-volume" && (
            <>
              <div className="chartContainer">
                <canvas ref={chartRefs.regionsCoveredBySponsors} />
                <div style={{textAlign: 'center', fontSize: '10px', color: '#8d6e63', marginTop: '5px'}}>
                  PS = Program Sponsors
                </div>
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.internPlacementsOverTime} />
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.sponsorsByEntityType} />
                <div style={{textAlign: 'center', fontSize: '10px', color: '#8d6e63', marginTop: '5px'}}>
                  PS = Program Sponsors
                </div>
              </div>
            </>
          )}
          {activeTab === "sme-participation" && (
            <>
              <div className="chartContainer">
                <canvas ref={chartRefs.smsesByIndustrySector} />
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.smsesWithActiveInterns} />
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.placementsBySMSERevenueBand} />
              </div>
            </>
          )}
          {activeTab === "intern-performance" && (
            <>
              {/* UPDATED: Now shows real data for program type ratings */}
              <div className="chartContainer">
                <canvas ref={chartRefs.avgInternRatingByProgram} />
              </div>
              {/* UPDATED: Now shows average rating by department using real data */}
              <div className="chartContainer">
                <canvas ref={chartRefs.averageRatingByDepartment} />
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.repeatPlacementRate} />
              </div>
            </>
          )}
          {activeTab === "compliance-tracking" && (
            <>
              <div className="chartContainer">
                <canvas ref={chartRefs.internPerformanceReport} />
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.internsByFundingStatus} />
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.programDurations} />
              </div>
            </>
          )}
          {activeTab === "absorption-rate" && (
            <>
              <div className="chartContainer">
                <canvas ref={chartRefs.programTypeCounts} />
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.hiresByRoleType} />
              </div>
              <div className="chartContainer">
                <canvas ref={chartRefs.absorptionBySMSESize} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}