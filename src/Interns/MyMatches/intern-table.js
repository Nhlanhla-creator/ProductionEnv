"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { FileText, MessageCircle, Filter, Download, Send, FileIcon, User, Check, X,Eye } from "lucide-react"
import { collection, getDocs, doc, getDoc,setDoc,addDoc } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"

// Status definitions with color scheme
const STATUS_TYPES = {
  "New Match": {
    color: "#EFEBE9",
    textColor: "#3E2723",
  },
  Shortlisted: {
    color: "#E8F5E9",
    textColor: "#2E7D32",
  },
  Contacted: {
    color: "#FFF8E1",
    textColor: "#F57F17",
  },
  Confirmed: {
    color: "#E8F5E9",
    textColor: "#1B5E20",
  },
  Declined: {
    color: "#FFEBEE",
    textColor: "#C62828",
  },
}

// Text truncation component
const TruncatedText = ({ text, maxLength = 25 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span style={{ color: "#999" }}>{text || "-"}</span>
  }

  const shouldTruncate = text.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`

  const toggleExpanded = (e) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div style={{ lineHeight: "1.4" }}>
      <span style={{ wordBreak: "break-word" }}>{displayText}</span>
      {shouldTruncate && (
        <button
          style={{
            background: "none",
            border: "none",
            color: "#5D4037",
            cursor: "pointer",
            fontSize: "0.7rem",
            marginLeft: "4px",
            textDecoration: "underline",
            padding: "0",
          }}
          onClick={toggleExpanded}
        >
          {isExpanded ? "Less" : "More"}
        </button>
      )}
    </div>
  )
}

const getStatusStyle = (status) => {
  return STATUS_TYPES[status] || { color: "#F5F5F5", textColor: "#666666" }
}

// Match calculation function (you can customize this based on your matching criteria)
const calculateMatchScore = (internData, sponsorData) => {
  const internProfile = internData?.formData || {};
  const sponsorIR = sponsorData?.internshipRequest || {};
  const sponsorJob = sponsorData?.jobOverview || {};

  let score = 0;
  
  // Initialize breakdown object
  const breakdown = {
    skillsMatch: { score: 0, maxScore: 30, matched: false, description: "", details: {} },
    workModeMatch: { score: 0, maxScore: 25, matched: false, description: "", details: {} },
    locationMatch: { score: 0, maxScore: 20, matched: false, description: "", details: {} },
    availabilityMatch: { score: 0, maxScore: 15, matched: false, description: "", details: {} },
    additionalFactors: { score: 0, maxScore: 10, matched: false, description: "", details: {} }
  };

  // 1. Skills/Role Match (30%)
  const internSkills = internProfile?.skillsInterests?.technicalSkills || [];
  const sponsorRole = sponsorIR?.internRolesText || "";
  const sponsorSkills = sponsorJob?.preferredSkills || [];

  let skillsMatch = false;
  if (internSkills.length > 0 && (sponsorRole || sponsorSkills.length > 0)) {
    skillsMatch = internSkills.some(skill =>
      sponsorRole.toLowerCase().includes(skill.toLowerCase()) ||
      sponsorSkills.some(reqSkill => reqSkill.toLowerCase().includes(skill.toLowerCase()))
    );
  }

  breakdown.skillsMatch.details = {
    internSkills: internSkills,
    sponsorRole: sponsorRole,
    sponsorSkills: sponsorSkills
  };

  if (skillsMatch) {
    breakdown.skillsMatch.score = 30;
    breakdown.skillsMatch.matched = true;
    breakdown.skillsMatch.description = `Your skills (${internSkills.join(', ')}) match the required role: ${sponsorRole}`;
    score += 30;
  } else {
    breakdown.skillsMatch.description = internSkills.length > 0 ? 
      `Your skills (${internSkills.join(', ')}) don't match the required role: ${sponsorRole || 'Not specified'}` :
      "No technical skills specified in your profile";
  }

  // 2. Work Mode / Location Flexibility (25%)
  const internLocationFlexibility = internProfile?.academicOverview?.locationFlexibility || [];
  const sponsorType = sponsorIR?.internType || "";

  let workModeMatch = false;
  if (internLocationFlexibility.length > 0) {
    for (const flexibility of internLocationFlexibility) {
      const flexLower = flexibility.toLowerCase();
      const sponsorLower = sponsorType.toLowerCase();

      if (flexLower === "all") {
        workModeMatch = true;
        break;
      }

      if (flexLower === sponsorLower) {
        workModeMatch = true;
        break;
      }

      if ((flexLower === "hybrid" && (sponsorLower === "remote" || sponsorLower === "in-person")) ||
        (flexLower === "remote" && sponsorLower === "hybrid") ||
        (flexLower === "in-person" && sponsorLower === "hybrid")) {
        workModeMatch = true;
        break;
      }
    }
  }

  breakdown.workModeMatch.details = {
    internFlexibility: internLocationFlexibility,
    sponsorType: sponsorType
  };

  if (workModeMatch) {
    breakdown.workModeMatch.score = 25;
    breakdown.workModeMatch.matched = true;
    breakdown.workModeMatch.description = `Your flexibility (${internLocationFlexibility.join(', ')}) is compatible with ${sponsorType}`;
    score += 25;
  } else {
    breakdown.workModeMatch.description = `Your flexibility (${internLocationFlexibility.join(', ')}) is not compatible with ${sponsorType}`;
  }

  // 3. Location Match (20%)
  let locationScore = 0;
  const isLocationRelevant = sponsorType.toLowerCase() === "in-person" || sponsorType.toLowerCase() === "hybrid";
  const internHasAll = internLocationFlexibility.some(flex => flex.toLowerCase() === "all");
  const internHasRemoteOnly = internLocationFlexibility.length === 1 && internLocationFlexibility[0].toLowerCase() === "remote";
  const internHasRemote = internLocationFlexibility.some(flex => flex.toLowerCase() === "remote");

  const sponsorProvince = sponsorJob?.province || "";
  const sponsorCities = sponsorJob?.cities || [];
  const internProvinces = internProfile?.personalOverview?.provinces || [];
  const internCities = internProfile?.personalOverview?.cities || [];

  breakdown.locationMatch.details = {
    isLocationRelevant,
    sponsorProvince,
    sponsorCities,
    internProvinces,
    internCities,
    internHasAll,
    internHasRemote
  };

  if (!isLocationRelevant || (internHasRemoteOnly && sponsorType.toLowerCase() === "remote")) {
    locationScore = 20;
    breakdown.locationMatch.description = "Full score for remote work compatibility";
  } else if (internHasAll) {
    locationScore = 20;
    breakdown.locationMatch.description = "Full score - you selected 'All' locations";
  } else if (internHasRemote && !isLocationRelevant) {
    locationScore = 20;
    breakdown.locationMatch.description = "Full score for remote capability match";
  } else {
    const provinceMatch = internProvinces.some(province =>
      province.toLowerCase() === sponsorProvince.toLowerCase()
    );
    const cityMatch = internCities.some(city =>
      sponsorCities.some(sponsorCity => city.toLowerCase() === sponsorCity.toLowerCase())
    );

    if (provinceMatch || cityMatch) {
      locationScore = 20;
      breakdown.locationMatch.description = `Location match: ${provinceMatch ? 'Same province' : 'Same city'}`;
    } else if (internProvinces.length > 1 || internCities.length > 1) {
      locationScore = 10;
      breakdown.locationMatch.description = "Partial score for geographic flexibility";
    } else if (internHasRemote && sponsorType.toLowerCase() === "hybrid") {
      locationScore = 15;
      breakdown.locationMatch.description = "Partial score - remote capability with hybrid role";
    } else {
      breakdown.locationMatch.description = `No location match: You (${internProvinces.join(', ')}) vs Required (${sponsorProvince})`;
    }
  }

  breakdown.locationMatch.score = locationScore;
  score += locationScore;

  // 4. Availability Date Match (15%)
  const internStartDate = internProfile?.skillsInterests?.availabilityStart || "";
  const sponsorStartDate = sponsorIR?.startDate || "";
  let availabilityScore = 0;

  breakdown.availabilityMatch.details = {
    internStartDate,
    sponsorStartDate
  };

  if (internStartDate && sponsorStartDate) {
    const internStart = new Date(internStartDate);
    const sponsorStart = new Date(sponsorStartDate);
    const daysDiff = Math.abs((internStart - sponsorStart) / (1000 * 60 * 60 * 24));

    if (internStart <= sponsorStart) {
      availabilityScore = 15;
      breakdown.availabilityMatch.description = `Perfect timing - you're available from ${internStartDate}, they need ${sponsorStartDate}`;
    } else if (daysDiff <= 30) {
      availabilityScore = 10;
      breakdown.availabilityMatch.description = `Good timing - only ${Math.round(daysDiff)} days difference`;
    } else if (daysDiff <= 60) {
      availabilityScore = 5;
      breakdown.availabilityMatch.description = `Acceptable timing - ${Math.round(daysDiff)} days difference`;
    } else {
      breakdown.availabilityMatch.description = `Poor timing - ${Math.round(daysDiff)} days difference`;
    }
  } else {
    breakdown.availabilityMatch.description = `Missing availability data: Your start: ${internStartDate || 'Not set'}, Required: ${sponsorStartDate || 'Not set'}`;
  }

  breakdown.availabilityMatch.score = availabilityScore;
  breakdown.availabilityMatch.matched = availabilityScore > 0;
  score += availabilityScore;

  // 5. Additional Factors (10%)
  let additionalScore = 0;
  const hasGradYear = internProfile.academicOverview?.graduationYear ? 1 : 0;
  const hasInternType = sponsorIR.internType ? 1 : 0;

  additionalScore = hasGradYear + hasInternType;

  breakdown.additionalFactors.score = additionalScore;
  breakdown.additionalFactors.matched = additionalScore > 0;
  breakdown.additionalFactors.details = {
    hasGradYear,
    hasInternType,
    graduationYear: internProfile.academicOverview?.graduationYear,
    internType: sponsorIR.internType
  };

  if (additionalScore > 0) {
    breakdown.additionalFactors.description = `Profile completeness bonus: ${hasGradYear ? 'Has graduation year' : ''} ${hasInternType ? 'Has internship type' : ''}`;
  } else {
    breakdown.additionalFactors.description = "No profile completeness bonus - missing graduation year or internship type";
  }

  score += additionalScore;

  return {
    score: Math.min(score, 100),
    breakdown: breakdown
  };
};

const checkApplicationStatus = async (userId, sponsorId) => {
  try {
    const docId = `${sponsorId}_${userId}`
    const applicationDoc = await getDoc(doc(db, "internshipApplications", docId))

    if (applicationDoc.exists()) {
      const appData = applicationDoc.data()
      const status = appData.status || "Applied"
      
      // Normalize status - treat both "Applied" and "Requested" as applied
      const normalizedStatus = (status === "Applied" ) ? "Applied" : ( status === "Requested") ? "Requested" :status
      
      return {
        status: normalizedStatus,
        exists: true,
        data: appData
      }
    }
    return {
      status: "New Match",
      exists: false,
      data: null
    }
  } catch (error) {
    console.warn(`Could not fetch application status for ${sponsorId}_${userId}:`, error)
    return {
      status: "New Match",
      exists: false,
      data: null
    }
  }
}




const formatLabel = (value) => {
  if (!value) return ""
  return value
    .toString()
    .split(",")
    .map((item) => item.trim())
    .map((word) => {
      if (word.toLowerCase() === "ict") return "ICT"
      if (word.toLowerCase() === "southafrica" || word.toLowerCase() === "south_africa") return "South Africa"
      return word
        .split(/[_\s-]+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ")
    })
    .join(", ")
}

export function InternTable({ interns = [] }) {
  const [showFilters, setShowFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showBriefModal, setShowBriefModal] = useState(false)
  const [selectedIntern, setSelectedIntern] = useState(null)
  const [messageText, setMessageText] = useState("")
  const [noteText, setNoteText] = useState("")
  const [statuses, setStatuses] = useState({})
  const [notification, setNotification] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [programSponsors, setProgramSponsors] = useState([])
  const [showMatchBreakdown, setShowMatchBreakdown] = useState(false);

  const [filters, setFilters] = useState({
    location: "",
    matchScore: 0,
    sector: "",
    operationStage: "",
    internshipRole: "",
    stipend: "",
    startDate: "",
    sortBy: "",
  })

  const filterPanelRef = useRef(null)
  const isMountedRef = useRef(false)




   const handleViewMatchBreakdown = (intern) => {
    setSelectedIntern(intern);
    setShowMatchBreakdown(true);
  };


  useEffect(() => {
    setMounted(true)
    isMountedRef.current = true
    fetchSMes()
    return () => {
      setMounted(false)
      isMountedRef.current = false
    }
  }, [])



   const matchBreakdownSection = {
    marginBottom: "1.5rem",
    padding: "1rem",
    background: "#F8F9FA",
    borderRadius: "8px",
    border: "1px solid #E0E0E0",
  }

  const matchBreakdownTitle = {
    color: "#5D4037",
    margin: "0 0 0.5rem 0",
    fontSize: "0.9rem",
    fontWeight: "600",
  }

  const matchBreakdownItem = {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.25rem",
  }

  const matchBreakdownLabel = {
    fontWeight: "500",
    color: "#5D4037",
    fontSize: "0.8rem",
  }

  const matchBreakdownValue = {
    fontWeight: "600",
    color: "#5D4037",
    fontSize: "0.8rem",
  }

  const matchBreakdownDescription = {
    margin: "0.5rem 0 0 0",
    color: "#666",
    fontSize: "0.8rem",
    lineHeight: "1.4",
  }

  // Fetch program sponsors from Firestore
const fetchSMes = async () => {
    if (!isMountedRef.current) return

    setLoading(true)
    try {
      const user = auth.currentUser
      if (!user) {
        console.log("No authenticated user")
        setLoading(false)
        return
      }

      const userId = user.uid
      const userDoc = await getDoc(doc(db, "internProfiles", userId))
      const userData = userDoc.exists() ? userDoc.data() : {}

      // Get program sponsor profiles from Firebase
      const snapshot = await getDocs(collection(db, "universalProfiles"))

      if (snapshot.empty) {
        console.log("No documents found in universalProfiles collection")
        setProgramSponsors([])
        setNotification({ type: "info", message: "No program sponsors found." })
        setTimeout(() => setNotification(null), 3000)
        setLoading(false)
        return
      }

      const sponsors = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          try {
            const sponsorId = docSnap.id

            // Skip current user's profile
            if (sponsorId === userId) {
              return []
            }

            const data = docSnap.data()
            if (!data) {
              console.log(`No data found for sponsor ${sponsorId}`)
              return []
            }

            // Get internship applications correctly
            // Skip sponsors with no application document
            let appDoc
            try {
              appDoc = await getDoc(doc(db, "internApplications", sponsorId))
              if (!appDoc.exists()) {
                return [] // Skip this sponsor if no application doc exists
              }
            } catch (appError) {
              console.log(`Error checking application doc for ${sponsorId}:`, appError)
              return [] // Also skip on read error
            }

            const AppData = appDoc.data() || {}

            const formData = data || {}
            const Application = AppData.internshipRequest || AppData || {}
            const ApplicationOverview = AppData.jobOverview || AppData || {}
            const overview = formData.entityOverview || {}
            const programs = formData?.programDetails?.programs || []
            const matchPrefs = formData.generalMatchingPreference || {}

            // Only include profiles that have some relevant data
            const hasRelevantData = overview.registeredName ||
              overview.organizationName ||
              programs.length > 0 ||
              Object.keys(matchPrefs).length > 0

            if (!hasRelevantData) {
              return []
            }

            // Check application status for this sponsor
            const applicationStatusData = await checkApplicationStatus(userId, sponsorId)

            // Calculate match result with breakdown
            const matchResult = calculateMatchScore(userData, AppData);

            // If no programs, create one entry with default values
            if (programs.length === 0) {
              return [{
                id: sponsorId,
                originalSponsorId: sponsorId,
                programIndex: 0,
                smseName: overview.registeredName || overview.organizationName || "Unnamed Organization",
                location: overview.province || overview.regionCovered || "N/A",
                sector: formatLabel(matchPrefs.sectorFocus) || "Various",
                operationStage: overview.operationStage || "N/A",
                internshipRole: Application.internRolesText || matchPrefs.supportFocus || "Not Provided",
                briefDescription: {
                  title: `Internship at ${overview.registeredName || overview.organizationName || "Organization"}`,
                  company: overview.registeredName || overview.organizationName || "Organization",
                  duration: Application.duration || "unspecified",
                  requirements: ApplicationOverview.briefDescription || [
                    "Currently pursuing relevant degree",
                    "Strong communication skills",
                    "Willingness to learn",
                    "Team collaboration abilities"
                  ],
                  responsibilities: ApplicationOverview.keyTasks || [
                    "Support daily operations",
                    "Participate in projects",
                    "Learn industry best practices",
                    "Contribute to team initiatives"
                  ],
                  benefits: ApplicationOverview.learningOutcomes || [
                    "Professional development",
                    "Mentorship opportunities",
                    "Industry exposure",
                    "Networking opportunities"
                  ],
                  applicationProcess: formData.applicationBrief?.applicationProcess || "Submit application through our portal. Successful candidates will be contacted for interviews."
                },
                stipend: Application.stipendAmount || "not specified",
                startDate: Application.startDate || "TBD",
                matchPercentage: matchResult.score,
                matchBreakdown: matchResult.breakdown,
 status: applicationStatusData.status,
                action: applicationStatusData.exists ? "Application exists" : "Send Application",
  applicationExists: applicationStatusData.exists,
                applicationData: applicationStatusData.data,
                ratingRecommendation: "Not Yet Completed",
                documents: [],
                notes: []
              }]
            }

            // Create an entry for each program
            return programs.map((program, index) => {
              return {
                id: `${sponsorId}_${index}`,
                originalSponsorId: sponsorId,
                programIndex: index,
                smseName: `${overview.registeredName || overview.organizationName || "Unnamed"}${programs.length > 1 ? ` (${program.name || `Program ${index + 1}`})` : ""}`,
                location: overview.province || overview.location || "N/A",
                sector: formatLabel(program.sectorFocus || matchPrefs.sectorFocus) || "Various",
                operationStage: program.stage || matchPrefs.programStage || overview.operationStage || "N/A",
                internshipRole: program.role || program.focus || matchPrefs.supportFocus || "General Support",
                briefDescription: {
                  title: program.name || `Internship Program`,
                  company: overview.registeredName || overview.organizationName || "Organization",
                  duration: program.duration || formData.applicationBrief?.programDuration || "3-6 months",
                  requirements: program.requirements || [
                    "Currently pursuing relevant degree",
                    "Strong communication skills",
                    "Willingness to learn",
                    "Team collaboration abilities"
                  ],
                  responsibilities: program.responsibilities || [
                    "Support program activities",
                    "Participate in training sessions",
                    "Assist with project implementation",
                    "Contribute to program objectives"
                  ],
                  benefits: program.benefits || [
                    "Professional development",
                    "Mentorship from experienced professionals",
                    "Industry-specific training",
                    "Certificate of completion"
                  ],
                  applicationProcess: program.applicationProcess || formData.applicationBrief?.applicationProcess || "Submit application through our portal. Shortlisted candidates will be invited for interviews."
                },
                stipend: Application.stipendAmount || "not specified",
                startDate: program.startDate || formData.applicationBrief?.startDate || "TBD",
                matchPercentage: matchResult.score,
                matchBreakdown: matchResult.breakdown,
                status: applicationStatusData.status,
                action: applicationStatusData.exists ? "Application exist" : "Send Application",
                applicationExists: applicationStatusData.exists,
                applicationData: applicationStatusData.data,
                ratingRecommendation: "Not Yet Completed",
                documents: [],
                notes: []
              }
            })

          } catch (docError) {
            console.log(`Error processing document ${docSnap.id}:`, docError)
            return [] // Return empty array for failed documents
          }
        })
      )

      // Flatten the array and filter out empty arrays
      const flattenedSponsors = sponsors.flat().filter(sponsor => sponsor && Object.keys(sponsor).length > 0)

      console.log(`Found ${flattenedSponsors.length} program sponsors`)
      setProgramSponsors(flattenedSponsors)

      if (flattenedSponsors.length === 0) {
        setNotification({ type: "info", message: "No matching program sponsors found." })
        setTimeout(() => setNotification(null), 3000)
      } else {
        setNotification({ type: "success", message: `Found ${flattenedSponsors.length} program sponsor(s)` })
        setTimeout(() => setNotification(null), 3000)
      }

    } catch (error) {
      console.error("Error loading program sponsor profiles:", error)
      console.error("Error details:", error.message, error.code)

      // Set empty array to prevent crashes
      setProgramSponsors([])

      // More specific error message
      let errorMessage = "Failed to load program sponsor data."
      if (error.code === 'permission-denied') {
        errorMessage = "Permission denied. Please check your authentication."
      } else if (error.code === 'unavailable') {
        errorMessage = "Service temporarily unavailable. Please try again later."
      } else if (error.message.includes('network')) {
        errorMessage = "Network error. Please check your connection."
      }

      setNotification({ type: "error", message: errorMessage })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  // Use program sponsors data if available, otherwise fallback to mock data
  const displayData = programSponsors.length > 0 ? programSponsors : interns.length > 0 ? interns : []

  const filteredInterns = displayData.filter((intern) => {
    if (filters.location && !intern.location.toLowerCase().includes(filters.location.toLowerCase())) return false
    if (intern.matchPercentage < filters.matchScore) return false
    if (filters.sector && !intern.sector.toLowerCase().includes(filters.sector.toLowerCase())) return false
    if (filters.operationStage && intern.operationStage !== filters.operationStage) return false
    if (filters.internshipRole && !intern.internshipRole.toLowerCase().includes(filters.internshipRole.toLowerCase())) return false
    if (filters.stipend && intern.stipend !== filters.stipend) return false
    if (filters.startDate && intern.startDate < filters.startDate) return false
    return true
  })

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target)) {
        setShowFilters(false)
      }
    }

    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showFilters])

const handleConnectClick = async (intern) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      setNotification({ type: "error", message: "User not authenticated. Please log in." });
      return;
    }

    console.log("Starting application submission for:", intern.smseName);
    console.log("User ID:", user.uid);
    console.log("Intern object:", intern);

    // Get user profile data for more complete application
    let userData = {};
    try {
      const userDoc = await getDoc(doc(db, "internProfiles", user.uid));
      userData = userDoc.exists() ? userDoc.data() : {};
      console.log("User data retrieved:", userData);
    } catch (userError) {
      console.warn("Could not retrieve user profile:", userError);
    }

    // Get sponsor data
    let sponsorData = {};
    try {
      const sponsorDoc = await getDoc(doc(db, "internApplications", intern.originalSponsorId));
      sponsorData = sponsorDoc.exists() ? sponsorDoc.data() : {};
      console.log("Sponsor data retrieved:", sponsorData);
    } catch (sponsorError) {
      console.warn("Could not retrieve sponsor profile:", sponsorError);
    }

    // Fetch evaluation scores from internEvaluations collection
    let evaluationScores = {
      academic: 0,
      bigInternScore: 0,
      professionalPresentation: 0,
      professionalSkills: 0,
      workExperience: 0,
      lastUpdated: null,
      updatedAt: null
    };

    try {
      const evaluationDoc = await getDoc(doc(db, "internEvaluations", user.uid));
      if (evaluationDoc.exists()) {
        const evalData = evaluationDoc.data();
        console.log("Evaluation data retrieved:", evalData);
        
        evaluationScores = {
          academic: evalData.scores?.academic || 0,
          bigInternScore: evalData.scores?.bigInternScore || 0,
          professionalPresentation: evalData.scores?.professionalPresentation || 0,
          professionalSkills: evalData.scores?.professionalSkills || 0,
          workExperience: evalData.scores?.workExperience || 0,
          lastUpdated: evalData.scores?.lastUpdated || null,
          updatedAt: evalData.scores?.updatedAt || null
        };
      } else {
        console.log("No evaluation scores found for user:", user.uid);
      }
    } catch (evaluationError) {
      console.warn("Could not retrieve evaluation scores:", evaluationError);
    }

    // Build the composite ID for the application document
    const internId = user.uid;
    const sponsorId = intern.originalSponsorId || intern.id.split("_")[0] || intern.id;
    const applicationDocId = `${sponsorId}_${internId}`;

    console.log("Application document ID:", applicationDocId);
    console.log("Sponsor ID:", sponsorId);

    // Get more detailed user information if available
    const userFormData = userData.formData || {};
    const userProfile = userData.entityOverview || {};

    // Calculate fresh match breakdown for the application
    const matchResult = calculateMatchScore(userData, sponsorData);
    console.log("Match result with breakdown:", matchResult);

    // Application data structure with match breakdown and evaluation scores included
    const applicationData = {
      // Applicant Information
      applicantId: internId,
      applicantName: userFormData.personalOverview?.fullName || "Anonymous",
      applicantEmail: user.email || userFormData.personalOverview?.email || "Not provided",

      // Educational Information
      institution: userFormData.academicOverview?.institution || userProfile.organizationName || "Not Provided",
      degree: userFormData.academicOverview?.degree || userFormData.studyLevel || "Not Provided",
      field: userFormData.academicOverview?.fieldOfStudy || userFormData.sector || "Not Provided",
      locationFlexibility: userFormData.academicOverview?.locationFlexibility || userFormData.locationFlexibility || "Not Provided",
      
      // Applicant Skills and Preferences
      technicalSkills: userFormData.skillsInterests?.technicalSkills || [],
      availabilityStart: userFormData.skillsInterests?.availabilityStart || "Not specified",
      provinces: userFormData.personalOverview?.provinces || [],
      cities: userFormData.personalOverview?.cities || [],

      // Internship Details
      sponsorId: sponsorId,
      sponsorName: intern.smseName,
      location: intern.location || "N/A",
      type: "Internship",
      role: intern.internshipRole || "N/A",
      sector: intern.sector || "N/A",

      // Funding Information
      funding: intern.stipend === "Pro-Bono" || intern.stipend === "not specified" ? "No" : "Yes",
      fundType: intern.stipend || "not specified",

      // Timeline
      startDate: intern.startDate || "TBD",
      appliedDate: new Date().toISOString(),

      // AI EVALUATION SCORES - NEW SECTION
      aiAcademicScore: evaluationScores.academic,
      aiProfessionalSkillsScore: evaluationScores.professionalSkills,
      aiWorkExperienceScore: evaluationScores.workExperience,
      aiPresentationScore: evaluationScores.professionalPresentation,
      bigInternScore: evaluationScores.bigInternScore,
      evaluationLastUpdated: evaluationScores.lastUpdated,
      evaluationUpdatedAt: evaluationScores.updatedAt,

      // MATCH BREAKDOWN INFORMATION
      matchAnalysis: {
        overallScore: matchResult.score,
        calculatedAt: new Date().toISOString(),
        breakdown: {
          skillsMatch: {
            score: matchResult.breakdown.skillsMatch.score,
            maxScore: matchResult.breakdown.skillsMatch.maxScore,
            matched: matchResult.breakdown.skillsMatch.matched,
            description: matchResult.breakdown.skillsMatch.description,
            applicantSkills: matchResult.breakdown.skillsMatch.details.internSkills,
            requiredRole: matchResult.breakdown.skillsMatch.details.sponsorRole,
            preferredSkills: matchResult.breakdown.skillsMatch.details.sponsorSkills
          },
          workModeCompatibility: {
            score: matchResult.breakdown.workModeMatch.score,
            maxScore: matchResult.breakdown.workModeMatch.maxScore,
            matched: matchResult.breakdown.workModeMatch.matched,
            description: matchResult.breakdown.workModeMatch.description,
            applicantFlexibility: matchResult.breakdown.workModeMatch.details.internFlexibility,
            requiredType: matchResult.breakdown.workModeMatch.details.sponsorType
          },
          locationCompatibility: {
            score: matchResult.breakdown.locationMatch.score,
            maxScore: matchResult.breakdown.locationMatch.maxScore,
            description: matchResult.breakdown.locationMatch.description,
            applicantProvinces: matchResult.breakdown.locationMatch.details.internProvinces,
            applicantCities: matchResult.breakdown.locationMatch.details.internCities,
            requiredProvince: matchResult.breakdown.locationMatch.details.sponsorProvince,
            requiredCities: matchResult.breakdown.locationMatch.details.sponsorCities,
            isLocationRelevant: matchResult.breakdown.locationMatch.details.isLocationRelevant
          },
          availabilityAlignment: {
            score: matchResult.breakdown.availabilityMatch.score,
            maxScore: matchResult.breakdown.availabilityMatch.maxScore,
            matched: matchResult.breakdown.availabilityMatch.matched,
            description: matchResult.breakdown.availabilityMatch.description,
            applicantStartDate: matchResult.breakdown.availabilityMatch.details.internStartDate,
            requiredStartDate: matchResult.breakdown.availabilityMatch.details.sponsorStartDate
          },
          profileCompleteness: {
            score: matchResult.breakdown.additionalFactors.score,
            maxScore: matchResult.breakdown.additionalFactors.maxScore,
            matched: matchResult.breakdown.additionalFactors.matched,
            description: matchResult.breakdown.additionalFactors.description,
            hasGraduationYear: matchResult.breakdown.additionalFactors.details.hasGradYear,
            hasInternshipType: matchResult.breakdown.additionalFactors.details.hasInternType
          }
        },
        // Summary for quick review
        matchSummary: {
          strongPoints: [],
          weakPoints: [],
          recommendations: []
        }
      },

      // Status Tracking
      status: "Applied",
      action: intern.action || "Send Application",
      rating: intern.ratingRecommendation || "Pending",

      // Metadata
      submittedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      applicationVersion: "2.1" // Updated version to indicate evaluation scores inclusion
    };

    // Generate match summary
    const breakdown = matchResult.breakdown;
    const strongPoints = [];
    const weakPoints = [];
    const recommendations = [];

    // Analyze each component
    if (breakdown.skillsMatch.matched) {
      strongPoints.push("Skills align well with role requirements");
    } else {
      weakPoints.push("Skills don't match role requirements");
      recommendations.push("Consider highlighting transferable skills or willingness to learn");
    }

    if (breakdown.workModeMatch.matched) {
      strongPoints.push("Work mode preferences are compatible");
    } else {
      weakPoints.push("Work mode preferences don't align");
      recommendations.push("Consider discussing flexibility in work arrangements");
    }

    if (breakdown.locationMatch.score >= 15) {
      strongPoints.push("Good location compatibility");
    } else if (breakdown.locationMatch.score > 0) {
      strongPoints.push("Some location flexibility");
    } else {
      weakPoints.push("Location requirements not met");
      recommendations.push("Discuss remote work possibilities or relocation");
    }

    if (breakdown.availabilityMatch.matched) {
      strongPoints.push("Availability aligns with timeline");
    } else {
      weakPoints.push("Availability doesn't match preferred timeline");
      recommendations.push("Discuss flexible start dates");
    }

    // Add evaluation-based insights to summary
    if (evaluationScores.bigInternScore >= 70) {
      strongPoints.push("High overall evaluation score");
    } else if (evaluationScores.bigInternScore >= 50) {
      strongPoints.push("Good evaluation score");
    } else if (evaluationScores.bigInternScore > 0) {
      weakPoints.push("Lower evaluation score");
      recommendations.push("Consider highlighting achievements and growth potential");
    }

    // Add summary to application data
    applicationData.matchAnalysis.matchSummary = {
      strongPoints,
      weakPoints,
      recommendations,
      overallAssessment: matchResult.score >= 80 ? "Excellent Match" :
                        matchResult.score >= 60 ? "Good Match" :
                        matchResult.score >= 40 ? "Fair Match" : "Poor Match"
    };

    // Save to Firestore with error handling
    await setDoc(doc(db, "internshipApplications", applicationDocId), applicationData, { merge: true });
    
    console.log("Application successfully saved to Firestore with evaluation scores");

    // Update UI state
    setStatuses((prev) => ({ ...prev, [intern.id]: "Applied" }));
    
    // Dispatch notification event to the sponsor
    const dispatchNotification = () => {
      const notificationMessage = `New application from ${applicationData.applicantName} for ${intern.internshipRole}!`;
      console.log('Dispatching sponsor notification:', notificationMessage);
      
      const event = new CustomEvent('newNotification', {
        detail: { 
          message: notificationMessage,
          type: 'success',
          timestamp: new Date().toISOString(),
          recipientId: sponsorId // Add recipient ID for targeted notifications
        },
        bubbles: true,
        cancelable: true,
        composed: true
      });

      setTimeout(() => {
        window.dispatchEvent(event);
        console.log('Sponsor notification event dispatched');
      }, 100);
    };

    dispatchNotification();

    // Show success notification to applicant
    setNotification({ 
      type: "success", 
      message: `Application successfully submitted to ${intern.smseName}!` 
    });
    setTimeout(() => setNotification(null), 4000);

  } catch (error) {
    console.error("Detailed error in handleConnectClick:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    // More specific error messages
    let errorMessage = "Failed to submit application.";
    
    if (error.code === 'permission-denied') {
      errorMessage = "Permission denied. Please check your account permissions.";
    } else if (error.code === 'unavailable') {
      errorMessage = "Service temporarily unavailable. Please try again.";
    } else if (error.code === 'network-request-failed') {
      errorMessage = "Network error. Please check your internet connection.";
    } else if (error.message.includes('auth')) {
      errorMessage = "Authentication error. Please log in again.";
    }
    
    // Dispatch error notification
    const errorEvent = new CustomEvent('newNotification', {
      detail: {
        message: errorMessage,
        type: 'error',
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(errorEvent);
    
    setNotification({ type: "error", message: errorMessage });
    setTimeout(() => setNotification(null), 5000);
  }
};

const acceptRequest = async (intern) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      setNotification({ type: "error", message: "User not authenticated. Please log in." });
      return;
    }

    const internId = user.uid;
    const sponsorId = intern.originalSponsorId || intern.id.split("_")[0];
    const applicationDocId = `${sponsorId}_${internId}`;

    console.log("Accepting request for application:", applicationDocId);

    // Update the application status to "Accepted"
    await setDoc(
      doc(db, "internshipApplications", applicationDocId),
      {
        status: "Accepted",
        acceptedDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );

    // Update UI state
    setStatuses((prev) => ({ ...prev, [intern.id]: "Accepted" }));
    
    // Notify the sponsor/SME
    const dispatchNotification = () => {
      const notificationMessage = `Your internship request has been accepted by ${user.displayName || "an intern"}!`;
      console.log('Dispatching sponsor notification:', notificationMessage);
      
      const event = new CustomEvent('newNotification', {
        detail: { 
          message: notificationMessage,
          type: 'success',
          timestamp: new Date().toISOString(),
          recipientId: sponsorId,
          applicationId: applicationDocId
        },
        bubbles: true,
        cancelable: true,
        composed: true
      });

      setTimeout(() => {
        window.dispatchEvent(event);
        console.log('Sponsor notification event dispatched');
      }, 100);
    };

    dispatchNotification();

    // Show success notification to intern
    setNotification({ 
      type: "success", 
      message: `Request accepted! ${intern.smseName} has been notified.` 
    });
    setTimeout(() => setNotification(null), 4000);

  } catch (error) {
    console.error("Error accepting request:", error);
    
    let errorMessage = "Failed to accept request.";
    if (error.code === 'permission-denied') {
      errorMessage = "Permission denied. Please check your account permissions.";
    } else if (error.code === 'unavailable') {
      errorMessage = "Service temporarily unavailable. Please try again.";
    }
    
    setNotification({ type: "error", message: errorMessage });
    setTimeout(() => setNotification(null), 5000);
  }
};
const handleSendInternMessage = async () => {
  if (!selectedIntern || !messageText.trim()) return;

  const user = auth.currentUser;
  if (!user) {
    setNotification({ type: "error", message: "User not authenticated" });
    return;
  }

  try {
    const internId = user.uid;
    const sponsorId = selectedIntern.originalSponsorId || selectedIntern.id.split("_")[0];

    const subject = `Message regarding Internship Application at ${selectedIntern.smseName}`;
    const content = messageText.trim();

    const basePayload = {
      to: sponsorId,
      from: internId,
      subject,
      content,
      date: new Date().toISOString(),
      applicationId: `${sponsorId}_${internId}`,
      read: false,
      attachments: [],
    };

    await Promise.all([
      addDoc(collection(db, "messages"), { ...basePayload, type: "inbox" }),
      addDoc(collection(db, "messages"), { ...basePayload, type: "sent", read: true }),
    ]);

    setNotification({
      type: "success",
      message: `Message sent to ${selectedIntern.smseName}`,
    });

    setShowMessageModal(false);
    setMessageText("");

  } catch (error) {
    console.error("Error sending message:", error);
    setNotification({ type: "error", message: "Failed to send message" });
  }
};


  const handleViewDetails = (intern) => {
    setSelectedIntern(intern)
    setShowModal(true)
  }

  const handleViewDocuments = (intern) => {
    setSelectedIntern(intern)
    setShowDocumentModal(true)
  }

  const handleMessage = (intern) => {
    setSelectedIntern(intern)
    setMessageText("")
    setShowMessageModal(true)
  }

  const handleAddNote = (intern) => {
    setSelectedIntern(intern)
    setNoteText("")
    setShowNoteModal(true)
  }

  const handleViewBrief = (intern) => {
    setSelectedIntern(intern)
    setShowBriefModal(true)
  }

 const handleSendMessage = () => {
  if (messageText.trim()) {
    handleSendInternMessage();
  }
};

  const handleSaveNote = () => {
    if (noteText.trim()) {
      setNotification({ type: "info", message: `Note saved for ${selectedIntern.smseName}` })
      setShowNoteModal(false)
      setNoteText("")
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleExport = () => {
    setNotification({ type: "info", message: "Exporting intern data..." })
    setTimeout(() => setNotification(null), 3000)
  }

  const closeAllModals = () => {
    setShowModal(false)
    setShowDocumentModal(false)
    setShowMessageModal(false)
    setShowNoteModal(false)
    setShowBriefModal(false)
    setSelectedIntern(null)
  }

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "4rem",
        color: "#5D4037"
      }}>
        <p>Loading program sponsors...</p>
      </div>
    )
  }
  return (
    <>
      {/* Main content container */}
      <div
        style={{
          position: "relative",
          filter: selectedIntern || showFilters ? "blur(2px)" : "none",
          transition: "filter 0.2s ease",
        }}
      >
        {/* Notification area */}
        {notification && (
          <div
            style={{
              position: "fixed",
              top: "1rem",
              right: "1rem",
              padding: "1rem",
              borderRadius: "6px",
              color: "white",
              fontWeight: "500",
              zIndex: 1001,
              background:
                notification.type === "success" ? "#48BB78" : notification.type === "error" ? "#F56565" : "#5D4037",
            }}
          >
            {notification.message}
          </div>
        )}

        {/* Table header with filter button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#5D4037",
              marginBottom: "0",
              fontFamily: "Segoe UI, sans-serif",
            }}
          >
        
          </h1>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              style={{
                background: "#EFEBE9",
                color: "#5D4037",
                border: "1px solid #D7CCC8",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                transition: "all 0.2s",
              }}
              onClick={() => setShowFilters(true)}
            >
              <Filter size={16} />
              Filters
              {Object.keys(filters).some(
                (key) =>
                  key !== "matchScore" &&
                  filters[key] !== "" &&
                  filters[key] !== 50 &&
                  (!Array.isArray(filters[key]) || filters[key].length > 0),
              ) && (
                <span
                  style={{
                    background: "#5D4037",
                    color: "white",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                  }}
                >
                  {
                    Object.keys(filters).filter(
                      (key) =>
                        key !== "matchScore" &&
                        filters[key] !== "" &&
                        filters[key] !== 50 &&
                        (!Array.isArray(filters[key]) || filters[key].length > 0),
                    ).length
                  }
                </span>
              )}
            </button>
            <button
              style={{
                background: "#5D4037",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                transition: "all 0.2s",
              }}
              onClick={handleExport}
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Always show table structure */}
        <div
          style={{
            borderRadius: "8px",
            border: "1px solid #E0E0E0",
            boxShadow: "0 4px 24px rgba(93, 64, 55, 0.08)",
            width: "100%",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
              fontSize: "0.8rem",
              backgroundColor: "#FFFFFF",
              tableLayout: "fixed", // This makes columns respect width settings
            }}
          >
            <colgroup>
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "7%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>SMSE Name</th>
                <th style={tableHeaderStyle}>Location</th>
                <th style={tableHeaderStyle}>Sector</th>
                <th style={tableHeaderStyle}>Stage</th>
                <th style={tableHeaderStyle}>Role</th>
                <th style={tableHeaderStyle}>Stipend</th>
                <th style={tableHeaderStyle}>Start Date</th>
                <th style={tableHeaderStyle}>Match %</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Action</th>
                <th style={{ ...tableHeaderStyle, borderRight: "none" }}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterns.length === 0 ? (
                // Empty state - show empty table row with message
                <tr>
                  <td colSpan="11" style={{
                    padding: "3rem 2rem",
                    textAlign: "center",
                    color: "#666",
                    fontSize: "1rem",
                    borderBottom: "1px solid #E0E0E0"
                  }}>
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "1rem"
                    }}>
                      <div style={{
                        fontSize: "3rem",
                        color: "#D7CCC8"
                      }}>
                        📋
                      </div>
                      <div>
                        <h3 style={{
                          margin: "0 0 0.5rem 0",
                          color: "#5D4037",
                          fontSize: "1.2rem"
                        }}>
                          You have not applied for any customers, so there are no matches available.
                        </h3>
                        <p style={{
                          margin: "0",
                          color: "#666",
                          fontSize: "0.9rem"
                        }}>
                          You need to apply first. Once you start applying to internship opportunities, your matches will appear in this table with details like company name, location, sector, and match percentage.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                // Show actual data rows
                filteredInterns.map((intern) => {
                  const currentStatus =  intern.status || statuses[intern.id]
                  const statusStyle = getStatusStyle(currentStatus)
                  return (
                    <tr key={intern.id} style={{ borderBottom: "1px solid #E0E0E0" }}>
                      {/* SMSE Name */}
                      <td style={tableCellStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: "#EFEBE9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.7rem",
                              fontWeight: "bold",
                              color: "#5D4037",
                              flexShrink: 0,
                            }}
                          >
                            {intern.smseName.charAt(0)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <span
                              onClick={() => handleViewDetails(intern)}
                              style={{
                                color: "#5D4037",
                                textDecoration: "underline",
                                cursor: "pointer",
                                fontWeight: "500",
                                wordBreak: "break-word",
                                fontSize: "0.8rem",
                              }}
                            >
                              {intern.smseName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td style={tableCellStyle}>
                        <TruncatedText text={intern.location} maxLength={12} />
                      </td>

                      {/* Sector */}
                      <td style={tableCellStyle}>
                        <span style={{ wordBreak: "break-word", fontSize: "0.8rem" }}>{intern.sector}</span>
                      </td>

                      {/* Operation Stage */}
                      <td style={tableCellStyle}>
                        <TruncatedText text={intern.operationStage} maxLength={10} />
                      </td>

                      {/* Internship Role */}
                      <td style={tableCellStyle}>
                        <TruncatedText text={intern.internshipRole} maxLength={15} />
                        <div style={{ marginTop: "4px" }}>
                          <button
                            style={{
                              background: "#4CAF50",
                              color: "white",
                              border: "none",
                              padding: "2px 6px",
                              borderRadius: "3px",
                              fontSize: "0.6rem",
                              cursor: "pointer",
                            }}
                            onClick={() => handleViewBrief(intern)}
                          >
                            Brief
                          </button>
                        </div>
                      </td>

                      {/* Stipend */}
                      <td style={tableCellStyle}>
                        <span
                          style={{
                            background: intern.stipend === "Pro-Bono" ? "#FFEBEE" : "#E8F5E9",
                            color: intern.stipend === "not specified" ? "#C62828" : "#2E7D32",
                            padding: "0.2rem 0.3rem",
                            borderRadius: "3px",
                            fontSize: "0.6rem",
                            fontWeight: "500",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {intern.stipend}
                          {/* {intern.stipend === "Pro-Bono" ? "Pro-Bono" : "Paid"} */}
                        </span>
                      </td>

                      {/* Start Date */}
                      <td style={tableCellStyle}>
                        <span style={{ fontSize: "0.75rem" }}>{intern.startDate || "-"}</span>
                      </td>

                      {/* Match % */}
                      <td style={tableCellStyle}>
                        <div style={matchContainerStyle}>
                          <div style={progressBarStyle}>
                            <div style={{ ...progressFillStyle, width: `${intern.matchPercentage}%` }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={matchScoreStyle}>{intern.matchPercentage}%</span>
                          
                            <Eye
                                                      size={14}
                                                      style={{ cursor: "pointer", color: "#a67c52" }}
                                                      onClick={() => handleViewMatchBreakdown(intern)}
                                                    />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={tableCellStyle}>
                        <span
                          style={{
                            ...statusBadgeStyle,
                            background: statusStyle.color,
                            color: statusStyle.textColor,
                            fontSize: "0.65rem",
                          }}
                        >
                          {intern.status || currentStatus}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={tableCellStyle}>
                        <div style={actionButtonsStyle}>
                         {currentStatus === "Confirmed" ? (
  <span style={confirmedBadgeStyle}>
    <Check size={12} /> Confirmed
  </span>
) : currentStatus === "Contacted" ? (
  <span style={contactedBadgeStyle}>Contacted</span>
) : currentStatus === "Applied" ||  currentStatus != "New Match" && currentStatus != "Requested"   ? ( // Check for both statuses
  <span style={{
    background: "#E3F2FD",
    color: "#1976D2", 
    padding: "0.3rem 0.5rem",
    borderRadius: "3px",
    fontSize: "0.65rem",
    fontWeight: "500",
    whiteSpace: "nowrap"
  }}>
    Application Sent
  </span>
) : currentStatus === "Requested" ? ( // Check for both statuses
   <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    <button onClick={() => acceptRequest(intern)} style={connectButtonStyle}>
      Accept
    </button>
  </div>
): (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    <button onClick={() => handleConnectClick(intern)} style={connectButtonStyle}>
      {intern.action}
    </button>
  </div>
)}
                        </div>
                      </td>

                      {/* Rating & Recommendation */}
                      <td style={{ ...tableCellStyle, borderRight: "none" }}>
                        <span style={{ color: "#999", fontSize: "0.65rem" }}>
                          <TruncatedText text={intern.ratingRecommendation} maxLength={8} />
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All your existing modals remain the same */}
      {/* Brief Description Modal */}
      {mounted &&
        showBriefModal &&
        selectedIntern &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                maxWidth: "800px",
                width: "90%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              }}
            >
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>
                  <FileText size={20} style={{ marginRight: "0.5rem" }} />
                  {selectedIntern.briefDescription.title}
                </h3>
                <button onClick={closeAllModals} style={modalCloseButtonStyle}>
                  <X size={20} />
                </button>
              </div>
              <div style={modalBodyStyle}>
                {/* Company Info */}
                <div
                  style={{
                    marginBottom: "1.5rem",
                    padding: "1rem",
                    background: "#F8F9FA",
                    borderRadius: "8px",
                  }}
                >
                  <h4 style={{ margin: "0 0 0.5rem 0", color: "#5D4037", fontSize: "1.1rem" }}>
                    {selectedIntern.briefDescription.company}
                  </h4>
                  <p style={{ margin: "0", color: "#666", fontSize: "0.9rem" }}>
                    <strong>Duration:</strong> {selectedIntern.briefDescription.duration}
                  </p>
                </div>

                {/* Requirements */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "#5D4037", marginBottom: "0.75rem", fontSize: "1rem" }}>📋 Requirements</h4>
                  <ul style={{ margin: "0", paddingLeft: "1.5rem", color: "#333" }}>
                    {selectedIntern.briefDescription.requirements}
                  </ul>
                </div>

                {/* Responsibilities */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "#5D4037", marginBottom: "0.75rem", fontSize: "1rem" }}>
                    💼 Key Responsibilities
                  </h4>
                  <ul style={{ margin: "0", paddingLeft: "1.5rem", color: "#333" }}>
                    {selectedIntern.briefDescription.responsibilities}
                  </ul>
                </div>

                {/* Benefits */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "#5D4037", marginBottom: "0.75rem", fontSize: "1rem" }}>🎯 What You'll Gain</h4>
                  <ul style={{ margin: "0", paddingLeft: "1.5rem", color: "#333" }}>
                    {selectedIntern.briefDescription.benefits}
                  </ul>
                </div>

                {/* Application Process */}
                <div
                  style={{
                    padding: "1rem",
                    background: "#EFEBE9",
                    borderRadius: "8px",
                    border: "1px solid #D7CCC8",
                  }}
                >
                  <h4 style={{ color: "#5D4037", marginBottom: "0.75rem", fontSize: "1rem" }}>
                    📝 Application Process
                  </h4>
                  <p style={{ margin: "0", color: "#333", lineHeight: "1.5" }}>
                    {selectedIntern.briefDescription.applicationProcess}
                  </p>
                </div>
              </div>
              <div style={modalActionsStyle}>
                <button
                  style={primaryButtonStyle}
                  onClick={() => {
                    closeAllModals()
                    handleConnectClick(selectedIntern)
                  }}
                >
                  <Send size={16} /> Apply Now
                </button>
                <button
                  style={{
                    background: "#EFEBE9",
                    color: "#5D4037",
                    border: "1px solid #D7CCC8",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                  onClick={() => {
                    closeAllModals()
                    handleMessage(selectedIntern)
                  }}
                >
                  <MessageCircle size={16} /> Ask Questions
                </button>
                <button style={cancelButtonStyle} onClick={closeAllModals}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
        
        {mounted &&
        showMatchBreakdown &&
        selectedIntern &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                maxWidth: "700px",
                width: "90%",
                maxHeight: "85vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              }}
            >
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>
                  Match Breakdown: {selectedIntern.smseName}
                </h3>
                <button onClick={closeAllModals} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "#5D4037", marginBottom: "0.75rem" }}>
                    Overall Match Score: {selectedIntern.matchPercentage}%
                  </h4>
                  <div style={{...progressBarStyle, width: "100%", height: "10px"}}>
                    <div
                      style={{
                        ...progressFillStyle,
                        width: `${selectedIntern.matchPercentage}%`,
                      }}
                    />
                  </div>
                </div>

                {selectedIntern.matchBreakdown && Object.entries(selectedIntern.matchBreakdown).map(([key, breakdown]) => {
                  const titles = {
                    skillsMatch: "Skills/Role Match",
                    workModeMatch: "Work Mode Compatibility", 
                    locationMatch: "Location Match",
                    availabilityMatch: "Availability Date",
                    additionalFactors: "Profile Completeness"
                  };

                  const getStatusColor = (score, maxScore) => {
                    const percentage = (score / maxScore) * 100;
                    if (percentage >= 90) return "#2E7D32";
                    if (percentage >= 50) return "#F57F17"; 
                    return "#C62828";
                  };

                  const getStatusText = (score, maxScore) => {
                    if (score === maxScore) return "✓ Perfect Match";
                    if (score > maxScore * 0.5) return "◐ Partial Match";
                    if (score > 0) return "◒ Some Match";
                    return "✗ No Match";
                  };

                  return (
                    <div key={key} style={matchBreakdownSection}>
                      <h4 style={matchBreakdownTitle}>{titles[key]}</h4>
                      <div style={matchBreakdownItem}>
                        <span style={matchBreakdownLabel}>Weight:</span>
                        <span style={matchBreakdownValue}>{((breakdown.maxScore / 100) * 100).toFixed(0)}%</span>
                      </div>
                      <div style={matchBreakdownItem}>
                        <span style={matchBreakdownLabel}>Score:</span>
                        <span style={matchBreakdownValue}>{breakdown.score}/{breakdown.maxScore}</span>
                      </div>
                      <div style={matchBreakdownItem}>
                        <span style={matchBreakdownLabel}>Status:</span>
                        <span style={{ 
                          ...matchBreakdownValue, 
                          color: getStatusColor(breakdown.score, breakdown.maxScore)
                        }}>
                          {getStatusText(breakdown.score, breakdown.maxScore)}
                        </span>
                      </div>
                      <p style={matchBreakdownDescription}>
                        {breakdown.description}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div style={modalActionsStyle}>
                <button 
                  style={primaryButtonStyle}
                  onClick={() => {
                    setShowMatchBreakdown(false);
                    handleMessage(selectedIntern);
                  }}
                >
                  <MessageCircle size={16} /> Ask Questions
                </button>
                <button 
                  style={cancelButtonStyle}
                  onClick={() => setShowMatchBreakdown(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}


      {/* Filter Modal */}
      {mounted &&
        showFilters &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                maxWidth: "1000px",
                width: "95%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              }}
            >
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>Filter Interns</h3>
                <button onClick={() => setShowFilters(false)} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "2rem",
                    paddingBottom: "1rem",
                    borderBottom: "2px solid #E0E0E0",
                  }}
                >
                  <h1
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#5D4037",
                      margin: "0 0 0.5rem 0",
                    }}
                  >
                    Filter Intern Matches
                  </h1>
                  <p
                    style={{
                      fontSize: "1rem",
                      color: "#5F6368",
                      margin: "0",
                    }}
                  >
                    Find the perfect intern candidates for your organization
                  </p>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "2rem",
                  }}
                >
                  <div
                    style={{
                      background: "#F8F9FA",
                      border: "1px solid #E0E0E0",
                      borderRadius: "8px",
                      padding: "1.25rem",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#5D4037",
                        margin: "0 0 0.75rem 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      📍 Location
                    </h3>
                    <select
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #E0E0E0",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        background: "white",
                        color: "#202124",
                      }}
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    >
                      <option value="">Select Location</option>
                      {["Cape Town", "Johannesburg", "Pretoria", "Durban", "Port Elizabeth"].map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    style={{
                      background: "#F8F9FA",
                      border: "1px solid #E0E0E0",
                      borderRadius: "8px",
                      padding: "1.25rem",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#5D4037",
                        margin: "0 0 0.75rem 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      🏢 Sector
                    </h3>
                    <select
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #E0E0E0",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        background: "white",
                        color: "#202124",
                      }}
                      value={filters.sector}
                      onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                    >
                      <option value="">Select Sector</option>
                      {["Tech", "Agri", "Finance", "Healthcare", "Education"].map((sector) => (
                        <option key={sector} value={sector}>
                          {sector}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    style={{
                      background: "#F8F9FA",
                      border: "1px solid #E0E0E0",
                      borderRadius: "8px",
                      padding: "1.25rem",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#5D4037",
                        margin: "0 0 0.75rem 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      📈 Operation Stage
                    </h3>
                    <select
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #E0E0E0",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        background: "white",
                        color: "#202124",
                      }}
                      value={filters.operationStage}
                      onChange={(e) => setFilters({ ...filters, operationStage: e.target.value })}
                    >
                      <option value="">Select Stage</option>
                      {["Seed", "Series A", "Series B", "Growth", "Mature"].map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid #E0E0E0",
                  }}
                >
                  <button
                    style={{
                      flex: "1",
                      padding: "0.75rem 1.5rem",
                      background: "#EFEBE9",
                      color: "#5D4037",
                      border: "1px solid #D7CCC8",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={() => {
                      setFilters({
                        location: "",
                        matchScore: 50,
                        sector: "",
                        operationStage: "",
                        internshipRole: "",
                        stipend: "",
                        startDate: "",
                        sortBy: "",
                      })
                    }}
                  >
                    Clear All Filters
                  </button>
                  <button
                    style={{
                      flex: "1",
                      padding: "0.75rem 1.5rem",
                      background: "#5D4037",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={() => setShowFilters(false)}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Detail Modal */}
      {mounted &&
        showModal &&
        selectedIntern &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                maxWidth: "700px",
                width: "90%",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              }}
            >
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>
                  <User size={20} style={{ marginRight: "0.5rem" }} />
                  SMSE Details
                </h3>
                <button onClick={closeAllModals} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  <div style={detailCardStyle}>
                    <h4 style={detailCardTitleStyle}>
                      <User size={16} style={{ marginRight: "0.5rem" }} />
                      Company Information
                    </h4>
                    <p style={detailTextStyle}>
                      <strong>SMSE Name:</strong> {selectedIntern.smseName}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Location:</strong> {selectedIntern.location}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Sector:</strong> {selectedIntern.sector}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Operation Stage:</strong> {selectedIntern.operationStage}
                    </p>
                  </div>
                  <div style={detailCardStyle}>
                    <h4 style={detailCardTitleStyle}>
                      <FileIcon size={16} style={{ marginRight: "0.5rem" }} />
                      Internship Details
                    </h4>
                    <p style={detailTextStyle}>
                      <strong>Role:</strong> {selectedIntern.internshipRole}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Stipend:</strong> {selectedIntern.stipend}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Start Date:</strong> {selectedIntern.startDate}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Match Score:</strong> {selectedIntern.matchPercentage}%
                    </p>
                  </div>
                </div>
              </div>
              <div style={modalActionsStyle}>
                <button
                  style={primaryButtonStyle}
                  onClick={() => {
                    closeAllModals()
                    handleMessage(selectedIntern)
                  }}
                >
                  <MessageCircle size={16} /> Send Message
                </button>
                <button style={cancelButtonStyle} onClick={closeAllModals}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Message Modal */}
      {mounted &&
        showMessageModal &&
        selectedIntern &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                maxWidth: "600px",
                width: "90%",
                maxHeight: "70vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              }}
            >
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>
                  <MessageCircle size={20} style={{ marginRight: "0.5rem" }} />
                  Send Message to {selectedIntern.smseName}
                </h3>
                <button onClick={closeAllModals} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                <textarea
                  style={{
                    width: "100%",
                    height: "200px",
                    padding: "1rem",
                    border: "1px solid #E0E0E0",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontFamily: "inherit",
                    resize: "vertical",
                    outline: "none",
                  }}
                  placeholder="Type your message here..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
              </div>
              <div style={modalActionsStyle}>
                <button
                  style={primaryButtonStyle}
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                >
                  <Send size={16} /> Send Message
                </button>
                <button style={cancelButtonStyle} onClick={closeAllModals}>
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

// Style constants with brown color scheme
const tableHeaderStyle = {
  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
  color: "#FEFCFA",
  padding: "0.75rem 0.5rem",
  textAlign: "left",
  fontWeight: "600",
  fontSize: "0.65rem",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  position: "sticky",
  top: "0",
  zIndex: "10",
  borderBottom: "2px solid #1a0c02",
  borderRight: "1px solid #1a0c02",
  lineHeight: "1.2",
}

const tableCellStyle = {
  padding: "0.6rem 0.4rem",
  borderBottom: "1px solid #E8D5C4",
  borderRight: "1px solid #E8D5C4",
  fontSize: "0.75rem",
  verticalAlign: "top",
  color: "#5d2a0a",
  lineHeight: "1.3",
  wordWrap: "break-word",
  overflow: "hidden",
}

const matchContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "0.25rem",
}

const progressBarStyle = {
  width: "40px",
  height: "5px",
  background: "#E0E0E0",
  borderRadius: "3px",
  overflow: "hidden",
}

const progressFillStyle = {
  height: "100%",
  background: "linear-gradient(90deg, #5D4037, #8D6E63)",
  transition: "width 0.3s ease",
}

const matchScoreStyle = {
  fontWeight: "600",
  color: "#202124",
  fontSize: "0.7rem",
}

const statusBadgeStyle = {
  padding: "0.2rem 0.3rem",
  borderRadius: "3px",
  fontSize: "0.65rem",
  fontWeight: "500",
  display: "inline-block",
  whiteSpace: "nowrap",
}

const actionButtonsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  width: "100%",
}

const connectButtonStyle = {
  padding: "0.3rem 0.5rem",
  background: "#5D4037",
  color: "white",
  border: "none",
  borderRadius: "3px",
  fontSize: "0.65rem",
  cursor: "pointer",
  transition: "background 0.2s",
  whiteSpace: "nowrap",
}

const confirmedBadgeStyle = {
  background: "#8D6E63",
  color: "white",
  padding: "0.3rem 0.5rem",
  borderRadius: "3px",
  fontSize: "0.65rem",
  fontWeight: "500",
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
  whiteSpace: "nowrap",
}

const contactedBadgeStyle = {
  background: "#F3E5F5",
  color: "#7B1FA2",
  padding: "0.3rem 0.5rem",
  borderRadius: "3px",
  fontSize: "0.65rem",
  fontWeight: "500",
  whiteSpace: "nowrap",
}

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1.5rem",
  borderBottom: "1px solid #E0E0E0",
  background: "#EFEBE9",
}

const modalTitleStyle = {
  margin: "0",
  fontSize: "1.25rem",
  fontWeight: "600",
  color: "#5D4037",
  display: "flex",
  alignItems: "center",
}

const modalCloseButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "1.5rem",
  cursor: "pointer",
  color: "#5D4037",
}

const modalBodyStyle = {
  padding: "1.5rem",
}

const detailCardStyle = {
  padding: "1rem",
  background: "#F8F9FA",
  border: "1px solid #E0E0E0",
  borderRadius: "8px",
}

const detailCardTitleStyle = {
  fontSize: "1rem",
  fontWeight: "600",
  margin: "0 0 0.5rem 0",
  color: "#5D4037",
  display: "flex",
  alignItems: "center",
}

const detailTextStyle = {
  margin: "0.25rem 0",
  fontSize: "0.875rem",
  color: "#202124",
}

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.5rem",
  padding: "1.5rem",
  borderTop: "1px solid #E0E0E0",
}

const primaryButtonStyle = {
  background: "#5D4037",
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.875rem",
  transition: "all 0.2s",
}

const cancelButtonStyle = {
  background: "#F1F3F4",
  color: "#5F6368",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer",
}