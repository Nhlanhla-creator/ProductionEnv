"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, Filter, X, Eye } from "lucide-react"
import { collection, getDocs } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import emailjs from '@emailjs/browser';
import { API_KEYS } from "../../API"

// Mock data for the table
const mockAccelerators = []

// Pipeline stage definitions with colors
const PIPELINE_STAGES = {
  MATCH: {
    label: "Match",
    next: "Application Sent",
  },
  "APPLICATION SENT": {
    label: "Application Sent",
    next: "Evaluation",
  },
  EVALUATION: {
    label: "Evaluation",
    next: "Due Diligence",
  },
  "DUE DILIGENCE": {
    label: "Due Diligence",
    next: "Decision",
  },
  DECISION: {
    label: "Decision",
    next: "Support Approved",
  },
  "SUPPORT APPROVED": {
    label: "Support Approved",
    next: "Active Support",
  },
  "ACTIVE SUPPORT": {
    label: "Active Support",
    next: "N/A",
  },
  "SUPPORT DECLINED": {
    label: "Support Declined",
    next: "N/A",
  },
}

// Geographic focus options - UPDATED
const geographicFocusOptions = [
  { value: "global", label: "Global" },
  { value: "regional_na", label: "Regional (NA)" },
  { value: "regional_emea", label: "Regional (EMEA)" },
  { value: "regional_apac", label: "Regional (APAC)" },
  { value: "country_specific", label: "Country-specific" },
  { value: "province_specific", label: "Province Specific" },
]

// Sector focus options - UPDATED
const sectorFocusOptions = [
  { value: "Generalist", label: "Generalist" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Automotive", label: "Automotive" },
  { value: "Banking, Finance & Insurance", label: "Banking, Finance & Insurance" },
  { value: "Beauty / Cosmetics / Personal Care", label: "Beauty / Cosmetics / Personal Care" },
  { value: "Construction", label: "Construction" },
  { value: "Consulting", label: "Consulting" },
  { value: "Creative Arts / Design", label: "Creative Arts / Design" },
  { value: "Customer Service", label: "Customer Service" },
  { value: "Education & Training", label: "Education & Training" },
  { value: "Engineering", label: "Engineering" },
  { value: "Environmental / Natural Sciences", label: "Environmental / Natural Sciences" },
  { value: "Government / Public Sector", label: "Government / Public Sector" },
  { value: "Healthcare / Medical", label: "Healthcare / Medical" },
  { value: "Hospitality / Tourism", label: "Hospitality / Tourism" },
  { value: "Human Resources", label: "Human Resources" },
  { value: "Information Technology (IT)", label: "Information Technology (IT)" },
  { value: "Infrastructure", label: "Infrastructure" },
  { value: "Legal / Law", label: "Legal / Law" },
  { value: "Logistics / Supply Chain", label: "Logistics / Supply Chain" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Marketing / Advertising / PR", label: "Marketing / Advertising / PR" },
  { value: "Media / Journalism / Broadcasting", label: "Media / Journalism / Broadcasting" },
  { value: "Mining", label: "Mining" },
  { value: "Energy", label: "Energy" },
  { value: "Oil & Gas", label: "Oil & Gas" },
  { value: "Non-Profit / NGO", label: "Non-Profit / NGO" },
  { value: "Property / Real Estate", label: "Property / Real Estate" },
  { value: "Retail / Wholesale", label: "Retail / Wholesale" },
  { value: "Safety & Security / Police / Defence", label: "Safety & Security / Police / Defence" },
  { value: "Sales", label: "Sales" },
  { value: "Science & Research", label: "Science & Research" },
  { value: "Social Services / Social Work", label: "Social Services / Social Work" },
  { value: "Sports / Recreation / Fitness", label: "Sports / Recreation / Fitness" },
  { value: "Telecommunications", label: "Telecommunications" },
  { value: "Transport", label: "Transport" },
  { value: "Utilities (Water, Electricity, Waste)", label: "Utilities (Water, Electricity, Waste)" },
]

// Funding stage options - UPDATED
const fundingStageOptions = [
  { value: "Startup", label: "Startup" },
  { value: "Growth", label: "Growth" },
  { value: "Scaling", label: "Scaling" },
  { value: "Turnaround", label: "Turnaround" },
  { value: "Mature", label: "Mature" },
  { value: "any_stage", label: "Any Stage" },
]

// Support offered options - UPDATED
const supportOfferedOptions = [
  { value: "funding", label: "Funding Support" },
  { value: "capacity_building", label: "Capacity Building" },
  { value: "market_access", label: "Market Access" },
  { value: "technology", label: "Technology & Innovation" },
  { value: "social_impact", label: "Social Impact" },
]

// Status options
const statusOptions = [
  { value: "Match", label: "Match" },
  { value: "Application Sent", label: "Application Sent" },
  { value: "Evaluation", label: "Evaluation" },
  { value: "Due Diligence", label: "Due Diligence" },
  { value: "Decision", label: "Decision" },
  { value: "Support Approved", label: "Support Approved" },
  { value: "Active Support", label: "Active Support" },
  { value: "Support Declined", label: "Support Declined" },
]

// Helper function to get the next stage
const getNextStage = (currentStage) => {
  const stageEntry = Object.values(PIPELINE_STAGES).find(
    (stage) => stage.label.toLowerCase() === currentStage?.toLowerCase(),
  )
  return stageEntry ? stageEntry.next : "N/A"
}

// MultiSelectDropdown component
const MultiSelectDropdown = ({ options, selectedValues, onSelect, placeholder, onRemove }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const handleSelect = (value) => {
    onSelect(value)
  }

  const handleRemove = (value, e) => {
    e.stopPropagation()
    onRemove(value)
  }

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <div
        onClick={toggleDropdown}
        style={{
          width: "100%",
          padding: "0.5rem",
          border: "1px solid #E8D5C4",
          borderRadius: "4px",
          fontSize: "0.8rem",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "white",
          minHeight: "36px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            flex: 1,
            overflow: "hidden",
          }}
        >
          {selectedValues.length === 0 ? (
            <span style={{ color: "#999" }}>{placeholder}</span>
          ) : (
            selectedValues.map((value) => {
              const option = options.find((opt) => opt.value === value)
              return (
                <span
                  key={value}
                  style={{
                    background: "#F5EBE0",
                    color: "#5D2A0A",
                    padding: "0.2rem 0.4rem",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {option?.label || value}
                  <button
                    onClick={(e) => handleRemove(value, e)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#5D2A0A",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <X size={12} />
                  </button>
                </span>
              )
            })
          )}
        </div>
        <ChevronDown
          size={16}
          style={{
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: "200px",
            overflowY: "auto",
            background: "white",
            border: "1px solid #E8D5C4",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            zIndex: 100,
            marginTop: "4px",
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              style={{
                padding: "0.5rem",
                cursor: "pointer",
                backgroundColor: selectedValues.includes(option.value) ? "#F5EBE0" : "white",
                color: selectedValues.includes(option.value) ? "#5D2A0A" : "#333",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.8rem",
                ":hover": {
                  backgroundColor: "#F5EBE0",
                },
              }}
            >
              {selectedValues.includes(option.value) && <Check size={14} />}
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Text truncation component
const TruncatedText = ({ text, maxLength = 50 }) => {
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
            color: "#a67c52",
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

export function AcceleratorTable({ filters, onApplicationSubmitted }) {
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState({})
  const [accelerators, setAccelerators] = useState([])
  const [loading, setLoading] = useState(false)
  const [statuses, setStatuses] = useState({})
  const [pipelineStages, setPipelineStages] = useState({})
  const [modalAccelerator, setModalAccelerator] = useState(null)
  const [notification, setNotification] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [showMatchBreakdown, setShowMatchBreakdown] = useState(false)
  const [selectedAccelerator, setSelectedAccelerator] = useState(null)
  
  // Filter states - UPDATED
  const [selectedGeographic, setSelectedGeographic] = useState([])
  const [selectedSectors, setSelectedSectors] = useState([])
  const [selectedStages, setSelectedStages] = useState([])
  const [selectedSupport, setSelectedSupport] = useState([])
  const [selectedStatus, setSelectedStatus] = useState([])
  const [nextStageFilter, setNextStageFilter] = useState("")
  const [minMatchFilter, setMinMatchFilter] = useState(0)

  // Company member states
const [companyOwnerId, setCompanyOwnerId] = useState(null)
const [isCompanyMember, setIsCompanyMember] = useState(false)
const [effectiveUserId, setEffectiveUserId] = useState(null)
const [userRole, setUserRole] = useState(null)


  const hasApplication = (acceleratorId) => {
    return statuses[acceleratorId] || (pipelineStages[acceleratorId] && pipelineStages[acceleratorId] !== "Match")
  }

  const isMountedRef = useRef(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
// Check company membership on mount
useEffect(() => {
  const checkCompanyMembership = async () => {
    const user = auth.currentUser
    if (!user) return

    try {
      const userDocRef = doc(db, "users", user.uid)
      const userDocSnap = await getDoc(userDocRef)
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        const userCompanyId = userData.companyId
        const userCompanyRole = userData.userRole
        
        if (userCompanyId) {
          const companyDocRef = doc(db, "companies", userCompanyId)
          const companyDocSnap = await getDoc(companyDocRef)
          
          if (companyDocSnap.exists()) {
            const companyData = companyDocSnap.data()
            const ownerId = companyData.createdBy
            
            setUserRole(userCompanyRole || 'viewer')
            
            if (ownerId === user.uid) {
              setIsCompanyMember(false)
              setEffectiveUserId(user.uid)
            } else {
              setIsCompanyMember(true)
              setCompanyOwnerId(ownerId)
              setEffectiveUserId(ownerId)
            }
          }
        } else {
          setIsCompanyMember(false)
          setEffectiveUserId(user.uid)
          setUserRole('owner')
        }
      }
    } catch (error) {
      console.error("Error checking company membership:", error)
      setEffectiveUserId(user.uid)
      setUserRole('owner')
    }
  }

  checkCompanyMembership()
}, [])



  const hasTooManyMissingFields = (accelerator) => {
    const fieldsToCheck = [
      accelerator.geographicFocus,
      accelerator.sectorFocus,
      accelerator.fundingStage,
      accelerator.fundingType,
      accelerator.ticketSize,
      accelerator.supportOffered,
      accelerator.servicesOffered,
      accelerator.deadline,
      accelerator.speed
    ];

    const missingCount = fieldsToCheck.filter(field => 
      !field || 
      field === '-' || 
      field === 'Not specified' || 
      field === 'Various' || 
      field === 'unspecified' || 
      field === 'Unknown' ||
      field === 'N/A'
    ).length;

    return missingCount > 4;
  };

  // Function to send email notification to catalyst
  const sendCatalystEmailNotification = async (catalystId, smeData, accelerator) => {
    try {
      console.log("🔄 Sending catalyst email notification...");

      const emailjsConfig = {
        serviceId: API_KEYS.SERVICE_ID_MESSAGES,
        templateId: API_KEYS.TEMPLATE_ID_MESSAGES,
        publicKey: API_KEYS.PUBLIC_KEY_ID_MESSAGES
      };

      console.log("📧 Using Feedback config:", emailjsConfig);

      if (!window.emailjs) {
        emailjs.init(emailjsConfig.publicKey);
        window.emailjs = emailjs;
      }

      // Fetch catalyst email from catalystProfiles > formData > contactDetails > businessEmail
      let catalystEmail = null;
      console.log("📋 Fetching catalyst email for:", catalystId);

      try {
        const catalystProfileRef = doc(db, "catalystProfiles", catalystId);
        const catalystProfileSnap = await getDoc(catalystProfileRef);
        
        if (catalystProfileSnap.exists()) {
          const profileData = catalystProfileSnap.data();
          console.log("📄 catalystProfiles data:", profileData);
          
          catalystEmail = profileData.formData?.contactDetails?.businessEmail;
          
          if (catalystEmail) {
            console.log("✅ Found catalyst email:", catalystEmail);
          } else {
            console.log("❌ No business email found in catalyst profile");
            catalystEmail = profileData.formData?.contactDetails?.email ||
                           profileData.email ||
                           profileData.contactEmail;
          }
        } else {
          console.log("❌ No document in catalystProfiles for:", catalystId);
        }
      } catch (fetchError) {
        console.error("❌ Error fetching catalyst email:", fetchError);
      }

      if (!catalystEmail) {
        console.warn("⚠️ No catalyst email found, using fallback");
        catalystEmail = "support@bigmarketplace.africa";
      }

      console.log("📧 Final recipient email:", catalystEmail);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(catalystEmail)) {
        throw new Error(`Invalid email format: "${catalystEmail}"`);
      }

      const user = auth.currentUser;
      const smeName = smeData.entityOverview?.registeredName || "An SMSE";
      const catalystName = accelerator.name || "Catalyst";

      const emailSubject = `New Application Received from ${smeName}`;
      
      let emailMessage = `Dear ${catalystName} Team,\n\n`;
      emailMessage += `You have received a new application from ${smeName}.\n\n`;
      emailMessage += `Application Details:\n`;
      emailMessage += `- SMSE Name: ${smeName}\n`;
      emailMessage += `- Location: ${smeData.entityOverview?.location || "Not specified"}\n`;
      emailMessage += `- Sector: ${(smeData.entityOverview?.economicSectors || []).join(", ") || "Not specified"}\n`;
      emailMessage += `- Funding Stage: ${smeData.entityOverview?.operationStage || "Not specified"}\n`;
      emailMessage += `- Funding Required: ${smeData.useOfFunds?.amountRequested || "Not specified"}\n`;
      emailMessage += `- Match Score: ${accelerator.matchPercentage || 0}%\n\n`;
      
      emailMessage += `You can review this application in your catalyst dashboard.\n\n`;
      emailMessage += `Best regards,\nBIG Marketplace Africa Team`;

      const templateParams = {
        to_email: catalystEmail,
        subject: emailSubject,
        from_name: "BIG Marketplace Africa",
        date: new Date().toLocaleDateString(),
        message: emailMessage,
        portal_url: `https://www.bigmarketplace.africa/catalyst/applications`,
        has_attachments: "false",
        attachments_count: "0"
      };

      console.log("📨 Sending catalyst email with Feedback service...", templateParams);

      const response = await window.emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        templateParams,
        emailjsConfig.publicKey
      );
      
      console.log("✅ Catalyst email sent successfully!", response);
      return true;
      
    } catch (emailError) {
      console.error("❌ Catalyst email failed:", emailError);
      return false;
    }
  }

 const fetchAccelerators = async () => {
  if (!isMountedRef.current || !effectiveUserId) return

    setLoading(true)
    try {
      const user = auth.currentUser
      if (!user) return

      // Use effectiveUserId for SME profile
const smeDoc = await getDoc(doc(db, "universalProfiles", effectiveUserId))
      const smeData = smeDoc.exists() ? smeDoc.data() : {}

      // Get fresh data from Firebase
      const snapshot = await getDocs(collection(db, "catalystProfiles"))

      const profiles = await Promise.all(
        snapshot.docs.flatMap(async (docSnap) => {
          const catalystId = docSnap.id
          
          // Skip current user's own profile
if (catalystId === user.uid || catalystId === effectiveUserId) {
  return []
}
          
          const data = docSnap.data()
          const formData = data.formData || {}
          const overview = formData.entityOverview || {}
          const programs = formData?.programmeDetails?.programs || []
          const matchPrefs = formData.generalMatchingPreference || {}

          // If no programs, create one entry with default values
          if (programs.length === 0) {
            const applicationId = `${catalystId}_${effectiveUserId}`
            const appDocRef = doc(db, "catalystApplications", applicationId)
            const appDocSnap = await getDoc(appDocRef)
            const appData = appDocSnap.exists() ? appDocSnap.data() : null

            return [
              {
                id: catalystId,
                programIndex: 0,
                name: overview.registeredName || "Unnamed",
                location: overview.province || "N/A",
                geographicFocus: matchPrefs.geographicFocus || "-",
                sectorFocus: matchPrefs.sectorFocus || "-",
                fundingStage: matchPrefs.programStage || "-",
                fundingType: matchPrefs.supportFocusSubtype || "-",
                ticketSize: "-",
                supportOffered: matchPrefs.supportFocus || "-",
                servicesOffered: matchPrefs.supportFocusSubtype || "-",
                deadline: formData.applicationBrief?.applicationWindow || "unspecified",
                speed: formData.applicationBrief?.estimatedReviewTime || "Unknown",
                matchPercentage: calculateMatchScore(smeData, formData),
                pipelineStage: appData?.pipelineStage || "Match",
                nextStage: appData?.nextStage || "Application Review",
              },
            ]
          }

          // Create an entry for each program
          return await Promise.all(
            programs.map(async (program, index) => {
              const applicationId = `${catalystId}_${effectiveUserId}_${index}`
              const appDocRef = doc(db, "catalystApplications", applicationId)
              const appDocSnap = await getDoc(appDocRef)
              const appData = appDocSnap.exists() ? appDocSnap.data() : null
              const matchResult = calculateMatchScore(smeData, formData, program)

              return {
                id: `${catalystId}_${index}`,
                originalCatalystId: catalystId,
                programIndex: index,
                name: `${overview.registeredName || "Unnamed"}${programs.length > 1 ? ` (Program ${program.name})` : ""}`,
                location: overview.province || "N/A",
                geographicFocus: matchPrefs.geographicFocus || "-",
                sectorFocus: matchPrefs.sectorFocus || "-",
                fundingStage: matchPrefs.programStage || "-",
                fundingType: program.supportType || matchPrefs.supportFocusSubtype || "-",
                ticketSize:
                  program.budget || `${program.minimumSupport || "0"} - ${program.maximumSupport || "0"}` || "-",
                supportOffered: program.supportOffered || matchPrefs.supportFocus || "-",
                servicesOffered: program.servicesOffered || matchPrefs.supportFocusSubtype || "-",
                deadline: formData.applicationBrief?.applicationWindow || "unspecified",
                speed: formData.applicationBrief?.estimatedReviewTime || "Unknown",
                matchPercentage: matchResult.score,
                matchBreakdown: matchResult.breakdown,
                pipelineStage: appData?.pipelineStage || "Match",
                nextStage: appData?.nextStage || "Application Review",
              }
            }),
          )
        }),
      )

      const flattenedProfiles = profiles.flat()
      flattenedProfiles.sort((a, b) => b.matchPercentage - a.matchPercentage)
      setAccelerators(flattenedProfiles)
    } catch (err) {
      console.error("Error loading accelerator profiles:", err)
      setNotification({ type: "error", message: "Failed to load accelerator data." })
    } finally {
      setLoading(false)
    }
  }

useEffect(() => {
  isMountedRef.current = true
  if (effectiveUserId) {
    fetchAccelerators()
  }

  return () => {
    isMountedRef.current = false
  }
}, [filters, effectiveUserId])


useEffect(() => {
  if (!effectiveUserId) return

  const loadStatusFromFirestore = async () => {
    const snapshot = await getDocs(collection(db, "smeCatalystApplications"))
    const statusMap = {}
    const stageMap = {}

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data()
      if (data.smeId === effectiveUserId) {
        // This must match accelerator.id = `${catalystId}_${programIndex}`
        const key = `${data.catalystId}_${data.programIndex ?? 0}`
        statusMap[key] = "Sent"
        stageMap[key] = data.status || "Application Sent"
      }
    })

    setStatuses(statusMap)
    setPipelineStages(stageMap)
  }

  loadStatusFromFirestore()
}, [effectiveUserId, accelerators])


  const calculateMatchScore = (smeData, acceleratorData, program = null) => {
    const totalFields = 8
    let matched = 0

    const breakdown = {
      fundingStage: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      ticketSize: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      geographicFit: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      sectorMatch: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      instrumentFit: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      supportMatch: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      legalEntityFit: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      revenueThreshold: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
    }

    // Helper functions
    const toArray = (v) => {
      if (v == null) return [];
      if (Array.isArray(v)) return v;
      return v.toString().split(/[,\|/]+/g).map(s => s.trim()).filter(Boolean);
    };

    const splitSectorTokens = (v) =>
      toArray(v)
        .flatMap(item => item.split(/[,\|/]+/g))
        .flatMap(item => item.split(/[_/\-\s]+/g))
        .map(s => s.replace(/\(.*?\)/g, ""))
        .map(s => s.trim())
        .filter(Boolean);

    const canon = (s) => s.toLowerCase().replace(/[^a-z]/g, "");

    const SECTOR_ALIASES = {
      it: "informationtechnology",
      ict: "informationtechnology",
      informationtechnology: "informationtechnology",
      technology: "informationtechnology",
      software: "informationtechnology",
      agri: "agriculture",
      agriculture: "agriculture",
      forestry: "forestry",
      fishing: "fishing",
    };

    const COMPOSITE_EXPANSIONS = {
      agricultureforestryfishing: ["agriculture", "forestry", "fishing"],
    };

    const mapAlias = (t) => SECTOR_ALIASES[t] || t;

    const normalizeSectors = (v) =>
      splitSectorTokens(v)
        .map(canon)
        .map(mapAlias)
        .flatMap(t => COMPOSITE_EXPANSIONS[t] ? COMPOSITE_EXPANSIONS[t] : [t])
        .filter(Boolean);

    const hasOverlap = (a, b) => {
      const A = new Set(normalizeSectors(a));
      for (const t of normalizeSectors(b)) if (A.has(t)) return true;
      return false;
    };

    const normalizeToken = (s) =>
      s.toString().toLowerCase().trim().replace(/[_\-\s]+/g, "");

    const normalizeList = (v) =>
      toArray(v)
        .flatMap(item => item.split(/\s*,\s*/))
        .map(normalizeToken)
        .filter(Boolean);

    const normalize = (val) => (Array.isArray(val) ? val.map((v) => v.toLowerCase().trim()) : val?.toLowerCase().trim())

    const includesMatch = (smeVal, accelVal) => {
      if (!smeVal || !accelVal) return false
      const smeSet = new Set(Array.isArray(smeVal) ? smeVal : [smeVal])
      const accelSet = new Set(Array.isArray(accelVal) ? accelVal : [accelVal])
      return [...smeSet].some((v) => accelSet.has(v))
    }

    const cleanCurrency = (value) => {
      if (!value) return 0
      const cleaned = value.toString().replace(/[^0-9.]/g, "")
      return Number.parseFloat(cleaned) || 0
    }

    const cleanString = (input) => {
      if (Array.isArray(input)) {
        return input.map((str) => (typeof str === "string" ? str.replace(/[_-]/g, " ").toLowerCase() : str))
      }
      if (typeof input === "string") {
        return input.replace(/[_-]/g, " ").toLowerCase()
      }
      return input
    }

    const checkGeographicMatch = (smeLocation, acceleratorGeoData) => {
      const smeProvince = normalize(smeData.entityOverview?.province)
      const smeCountry = cleanString(smeData.entityOverview?.location) || "not specified"

      const accelGeoFocus = acceleratorGeoData.geographicFocus || []
      const accelSelectedCountries = cleanString(acceleratorGeoData.selectedCountries) || []
      const accelSelectedProvinces = cleanString(acceleratorGeoData.selectedProvinces) || []

      console.log(accelSelectedCountries)

      if (accelGeoFocus.includes("global")) return true
      if (
        accelGeoFocus.includes("regional_emea") ||
        accelGeoFocus.includes("regional_na") ||
        accelGeoFocus.includes("regional_apac")
      )
        return true

      if (accelGeoFocus.includes("country_specific")) {
        return accelSelectedCountries.includes(smeCountry) || accelSelectedCountries.includes(smeLocation)
      }
      if (accelGeoFocus.includes("province_specific")) {
        return accelSelectedProvinces.includes(smeProvince)
      }
      return false
    }

    const programData = program || acceleratorData?.programmeDetails?.programs?.[0] || {}
    const allPrograms = acceleratorData?.programmeDetails?.programs || []

    // 1. Funding Stage Match
    const smeStage = smeData.entityOverview?.operationStage
    const accelStage = acceleratorData?.generalMatchingPreference?.programStage
    const stageMatch = normalize(smeStage) === normalize(accelStage)

    breakdown.fundingStage.details = { smeStage, accelStage, smeValue: smeStage, accelValue: accelStage }
    breakdown.fundingStage.matched = stageMatch

    if (stageMatch) {
      breakdown.fundingStage.score = 12.5
      breakdown.fundingStage.description = `Perfect match: Your ${smeStage} stage aligns with their ${accelStage} focus`
      matched++
    } else {
      breakdown.fundingStage.description = `Stage mismatch: You're in ${smeStage || "unspecified"} stage, they focus on ${accelStage || "unspecified"}`
    }

    // 2. Ticket Size Compatibility
    const smeAmountRequested = cleanCurrency(smeData.useOfFunds?.amountRequested)
    const accelMinTicket = cleanCurrency(programData.minimumSupport || 0)
    const accelMaxTicket = cleanCurrency(programData.maximumSupport || 0)
    const ticketMatch = smeAmountRequested >= accelMinTicket && smeAmountRequested <= accelMaxTicket

    breakdown.ticketSize.details = {
      smeAmountRequested,
      accelMinTicket,
      accelMaxTicket,
      smeValue:smeAmountRequested,
      accelValue: `${accelMinTicket}-${accelMaxTicket}` ,
    }
    breakdown.ticketSize.matched = ticketMatch

    if (ticketMatch) {
      breakdown.ticketSize.score = 12.5
      breakdown.ticketSize.description = `Perfect fit: Your funding need (${smeAmountRequested}) fits their range (${accelMinTicket}-${accelMaxTicket})`
      matched++
    } else {
      breakdown.ticketSize.description = `Size mismatch: You need ${smeAmountRequested || "unspecified"}, they offer ${accelMinTicket}-${accelMaxTicket}`
    }

    // 3. Geographic Fit
    const smeLocation = cleanString(smeData.entityOverview?.location)
    const accelGeoData = acceleratorData.generalMatchingPreference || {}
    const geoMatch = checkGeographicMatch(smeLocation, accelGeoData)

    breakdown.geographicFit.details = {
      smeLocation,
      accelGeoData,
      smeValue: smeLocation,
      accelValue: accelGeoData.geographicFocus,
    }
    breakdown.geographicFit.matched = geoMatch

    if (geoMatch) {
      breakdown.geographicFit.score = 12.5
      breakdown.geographicFit.description = `Geographic compatibility: Your location (${smeLocation}) fits their focus areas`
      matched++
    } else {
      breakdown.geographicFit.description = `Geographic mismatch: Your location (${smeLocation}) doesn't align with their focus areas`
    }

    // 4. Sector Match
    const smeSectors = smeData.entityOverview?.economicSectors;
    const accelSectors = acceleratorData?.generalMatchingPreference?.sectorFocus;

    const sectorMatch = hasOverlap(smeSectors, accelSectors);

    breakdown.sectorMatch.details = {
      smeSectors: Array.isArray(smeSectors) ? smeSectors : toArray(smeSectors),
      accelSectors: Array.isArray(accelSectors) ? accelSectors : toArray(accelSectors),
      smeValue: normalizeSectors(smeSectors).join(", "),
      accelValue: normalizeSectors(accelSectors).join(", "),
    };
    breakdown.sectorMatch.matched = sectorMatch;

    if (sectorMatch) {
      breakdown.sectorMatch.score = 12.5;
      breakdown.sectorMatch.description =
        `Sector alignment: overlap found (${breakdown.sectorMatch.details.smeValue} ↔ ${breakdown.sectorMatch.details.accelValue})`;
      matched++;
    } else {
      breakdown.sectorMatch.description =
        `Sector mismatch: you have [${breakdown.sectorMatch.details.smeValue || "unspecified"}], they focus on [${breakdown.sectorMatch.details.accelValue || "unspecified"}]`;
    }

    // 5. Instrument Fit
    const smeInstrumentRaw = smeData.useOfFunds?.fundingInstruments;
    const accelInstrumentRaw =
      programData.supportType ||
      acceleratorData?.generalMatchingPreference?.supportFocusSubtype ||
      acceleratorData?.generalMatchingPreference?.supportFocusType;

    const instrumentMatch = hasOverlap(smeInstrumentRaw, accelInstrumentRaw);

    breakdown.instrumentFit.details = {
      smeInstrument: toArray(smeInstrumentRaw),
      accelInstrument: toArray(accelInstrumentRaw),
      smeValue: normalizeList(smeInstrumentRaw).join(", "),
      accelValue: normalizeList(accelInstrumentRaw).join(", "),
    };
    breakdown.instrumentFit.matched = instrumentMatch;

    if (instrumentMatch) {
      breakdown.instrumentFit.score = 12.5;
      breakdown.instrumentFit.description = `Instrument match: overlap found between your instruments and theirs (${breakdown.instrumentFit.details.smeValue} ↔ ${breakdown.instrumentFit.details.accelValue})`;
      matched++;
    } else {
      breakdown.instrumentFit.description = `Instrument mismatch: you have [${breakdown.instrumentFit.details.smeValue || "unspecified"}], they offer [${breakdown.instrumentFit.details.accelValue || "unspecified"}]`;
    }

    // 6. Support Match
    const smeSupportCategory = smeData.useOfFunds?.additionalSupportFocus;
    const smeSupportSubtype = smeData.useOfFunds?.additionalSupportFocusSubtype;
    
    const accelSupportCategory = 
      programData.supportFocusType || 
      acceleratorData?.generalMatchingPreference?.supportFocus;
    const accelSupportSubtype = 
      programData.supportFocusSubtype || 
      acceleratorData?.generalMatchingPreference?.supportFocusSubtype;

    let supportMatchScore = 0;
    let supportMatched = false;
    let supportDescription = "";

    if (smeSupportSubtype && accelSupportSubtype && smeSupportSubtype === accelSupportSubtype) {
      supportMatchScore = 12.5;
      supportMatched = true;
      supportDescription = `Perfect support match: Your ${smeSupportSubtype} need aligns with their ${accelSupportSubtype} offering`;
      matched++;
    } else if (smeSupportCategory && accelSupportCategory && smeSupportCategory === accelSupportCategory) {
      supportMatchScore = 6.25;
      supportMatched = true;
      supportDescription = `Partial support match: Your ${smeSupportCategory} category aligns, but subtypes may differ`;
    } else {
      supportDescription = `Support mismatch: You need ${smeSupportCategory || "unspecified"}${smeSupportSubtype ? ` - ${smeSupportSubtype}` : ""}, they offer ${accelSupportCategory || "unspecified"}${accelSupportSubtype ? ` - ${accelSupportSubtype}` : ""}`;
    }

    breakdown.supportMatch.details = {
      smeSupportCategory,
      smeSupportSubtype,
      accelSupportCategory,
      accelSupportSubtype,
      smeValue: smeSupportSubtype ? `${smeSupportCategory} - ${smeSupportSubtype}` : smeSupportCategory,
      accelValue: accelSupportSubtype ? `${accelSupportCategory} - ${accelSupportSubtype}` : accelSupportCategory,
      matchLevel: supportMatchScore === 12.5 ? "subtype" : supportMatchScore === 6.25 ? "category" : "none"
    };
    breakdown.supportMatch.score = supportMatchScore;
    breakdown.supportMatch.matched = supportMatched;
    breakdown.supportMatch.description = supportDescription;

    // 7. Legal Entity Fit
    const smeLegal = smeData.entityOverview?.legalStructure
    const accelLegal = acceleratorData?.generalMatchingPreference?.legalEntityFit
    const legalMatch = normalize(smeLegal) === normalize(accelLegal)

    breakdown.legalEntityFit.details = { smeLegal, accelLegal, smeValue: smeLegal, accelValue: accelLegal }
    breakdown.legalEntityFit.matched = legalMatch

    if (legalMatch) {
      breakdown.legalEntityFit.score = 12.5
      breakdown.legalEntityFit.description = `Legal structure compatibility: Both work with ${smeLegal}`
      matched++
    } else {
      breakdown.legalEntityFit.description = `Legal structure mismatch: You are ${smeLegal || "unspecified"}, they work with ${accelLegal || "unspecified"}`
    }

    // 8. Revenue Threshold
    const smeRevenue = cleanCurrency(smeData.financialOverview?.annualRevenue)
    const accelThreshold = cleanCurrency(programData.minimumSupport || "0")
    const revenueMatch = smeRevenue >= accelThreshold

    breakdown.revenueThreshold.details = {
      smeRevenue,
      accelThreshold,
      smeValue: smeRevenue,
      accelValue: accelThreshold,
    }
    breakdown.revenueThreshold.matched = revenueMatch

    if (revenueMatch) {
      breakdown.revenueThreshold.score = 12.5
      breakdown.revenueThreshold.description = `Revenue meets requirements: Your ${smeRevenue} exceeds their ${accelThreshold} threshold`
      matched++
    } else {
      breakdown.revenueThreshold.description = `Revenue below threshold: Your ${smeRevenue || "unspecified"} is below their ${accelThreshold} requirement`
    }

    return {
      score: Math.round((matched / totalFields) * 100),
      breakdown: breakdown,
    }
  }

  const handleApplyClick = async (accelerator) => {
  const user = auth.currentUser
  if (!user) return

  // Check permissions for company members
  if (isCompanyMember && !['owner', 'admin'].includes(userRole)) {
    setNotification({
      type: "warning",
      message: "Only company owners and admins can submit applications.",
    })
    return
  }

  const smeUserId = effectiveUserId
    const catalystId = accelerator.originalCatalystId || accelerator.id
    const programIndex = accelerator.programIndex || 0

    try {
      const appId = `${smeUserId}_${catalystId}_${programIndex}`
      const appRef = doc(db, "catalystApplications", appId)
      const appSnap = await getDoc(appRef)

      if (appSnap.exists()) {
        const existingData = appSnap.data()
        setStatuses((prev) => ({ ...prev, [accelerator.id]: "Sent" }))
        setPipelineStages((prev) => ({ ...prev, [accelerator.id]: existingData.pipelineStage || "Application Sent" }))
        setNotification({ type: "info", message: `You've already applied to ${accelerator.name}` })
        setTimeout(() => setNotification(null), 3000)
        return
      }

      const smeDoc = await getDoc(doc(db, "universalProfiles", smeUserId))
      const smeData = smeDoc.exists() ? smeDoc.data() : {}

      const guarantees = smeData.guarantees || {}
      const bigDoc = await getDoc(doc(db, "bigEvaluations", smeUserId))
      const bigData = bigDoc.exists() ? bigDoc.data() : {}
      const entity = smeData.entityOverview || {}
      const funding = smeData.useOfFunds || {}

      const guaranteeGroups = {
        "Forward Contracts (Revenue Guarantees)": [
          ["signedCustomerContracts", "Signed customer contracts"],
          ["purchaseOrders", "Purchase orders"],
          ["offtakeAgreements", "Offtake agreements"],
          ["subscriptionRevenue", "Subscription revenue"],
        ],
        "Payment of Credit Guarantees": [
          ["letterOfGuarantee", "Letter of guarantee"],
          ["thirdPartyGuarantees", "Third-party guarantees"],
          ["factoringAgreements", "Factoring agreements"],
          ["suretyBonds", "Surety bonds"],
        ],
        "Government or Institutional Support": [
          ["governmentContracts", "Government contracts"],
          ["approvedSupplierStatus", "Approved supplier status"],
          ["incubatorGuarantees", "Incubator guarantees"],
          ["exportCreditGuarantees", "Export credit guarantees"],
        ],
        "Asset-backed Guarantees": [
          ["liensCollateral", "Liens or collateral"],
          ["securedAssets", "Secured assets"],
          ["retentionGuarantees", "Retention guarantees"],
        ],
        "Export Credit or Trade Insurance Cover": [["exportCreditInsurance", "Export credit or trade insurance"]],
        "Factoring or Receivables Finance Agreements": [["receivablesFinancing", "Receivables financing"]],
        "Personal or Third-Party Guarantees": [
          ["personalSurety", "Personal surety"],
          ["corporateGuarantees", "Corporate guarantees"],
        ],
      }

      const guaranteeTitles = Object.entries(guaranteeGroups)
        .filter(([_, items]) => items.some(([key]) => guarantees[key] === "yes"))
        .map(([category]) => category)

      const guaranteeSummary = guaranteeTitles.join(", ")

      const pipelineStage = "Application Sent"
      const nextStage = getNextStage(pipelineStage)

      const applicationData = {
        catalystId: catalystId,
        programIndex: programIndex,
        smeId: smeUserId,
          submittedBy: user.uid,              // ADD THIS
  submittedByRole: userRole,      
        acceleratorName: accelerator.name,
        location: entity.location || "-",
        sector: (entity.economicSectors || []).join(", ") || "-",
        fundingStage: smeData.applicationOverview?.fundingStage || "-",
        fundingRequired: funding.amountRequested || "-",
        equityOffered: funding.equityType || "",
        guarantees: guaranteeSummary || "-",
        supportRequired: accelerator.supportOffered || "-",
        servicesRequired: accelerator.servicesOffered || "-",
        applicationDate: new Date().toISOString(),
        matchPercentage: accelerator.matchPercentage || 0,
        status: "Application Sent",
        pipelineStage,
        nextStage,
        createdAt: serverTimestamp(),
        bigScore: bigData.scores?.bigScore || 0,
        compliance: bigData.scores?.compliance || 0,
        fundability: bigData.scores?.fundability || 0,
        legitimacy: bigData.scores?.legitimacy || 0,
        leadership: bigData.scores?.leadership || 0,
        smeName: entity.registeredName || "-",
      }

      const catalystApp = { ...applicationData, viewType: "accelerator" }
      const smeApp = { ...applicationData, viewType: "sme" }

      await Promise.all([
        setDoc(doc(db, "catalystApplications", `${catalystId}_${smeUserId}_${programIndex}`), catalystApp),
        setDoc(doc(db, "smeCatalystApplications", appId), smeApp),
      ])

      await sendCatalystEmailNotification(catalystId, smeData, accelerator);

      setStatuses((prev) => ({ ...prev, [accelerator.id]: "Sent" }))
      setPipelineStages((prev) => ({ ...prev, [accelerator.id]: pipelineStage }))
      setNotification({ 
        type: "success", 
        message: `Application sent to ${accelerator.name} and notification email sent!` 
      })

      if (onApplicationSubmitted) onApplicationSubmitted()
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error("Failed to submit accelerator application:", error)
      setNotification({ type: "error", message: "Failed to submit application." })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleViewClick = (accelerator) => {
    setModalAccelerator(accelerator)
  }

  const handleViewMatchBreakdown = (accelerator) => {
    setSelectedAccelerator(accelerator)
    setShowMatchBreakdown(true)
  }

  const closeAllModals = () => {
    setModalAccelerator(null)
    setShowFilterModal(false)
    setShowMatchBreakdown(false)
    setSelectedAccelerator(null)
  }

  const handleCompareClick = (accelerator) => {
    setNotification({ type: "info", message: `Added ${accelerator.name} to comparison` })
    setTimeout(() => setNotification(null), 3000)
  }

  const applyFilters = () => {
    setShowFilterModal(false)
  }

  const resetFilters = () => {
    setSelectedGeographic([])
    setSelectedSectors([])
    setSelectedStages([])
    setSelectedSupport([])
    setSelectedStatus([])
    setNextStageFilter("")
    setMinMatchFilter(0)
    setShowFilterModal(false)
  }

  // Get unique values for filter dropdowns
  const uniqueGeographic = [...new Set(accelerators.map((acc) => acc.geographicFocus).filter(Boolean))]
  const uniqueSectors = [...new Set(accelerators.map((acc) => acc.sectorFocus).filter(Boolean))]
  const uniqueStages = [...new Set(accelerators.map((acc) => acc.fundingStage).filter(Boolean))]
  const uniqueSupport = [...new Set(accelerators.map((acc) => acc.supportOffered).filter(Boolean))]
  const uniqueStatuses = [...new Set(accelerators.map((acc) => pipelineStages[acc.id] || "Match").filter(Boolean))]
  const uniqueNextStages = [...new Set(accelerators.map((acc) => acc.nextStage).filter(Boolean))]

  const filteredAccelerators = accelerators.filter((accelerator) => {
    if (hasTooManyMissingFields(accelerator)) {
      return false;
    }

    // Filter by geographic focus
    if (
      selectedGeographic.length > 0 &&
      !selectedGeographic.some((geo) =>
        formatLabel(accelerator.geographicFocus).toLowerCase().includes(geo.toLowerCase()),
      )
    ) {
      return false
    }
    // Filter by sector
    if (
      selectedSectors.length > 0 &&
      !selectedSectors.some((sec) => formatLabel(accelerator.sectorFocus).toLowerCase().includes(sec.toLowerCase()))
    ) {
      return false
    }
    // Filter by stage
    if (
      selectedStages.length > 0 &&
      !selectedStages.some((stage) => formatLabel(accelerator.fundingStage).toLowerCase().includes(stage.toLowerCase()))
    ) {
      return false
    }
    // Filter by support offered
    if (
      selectedSupport.length > 0 &&
      !selectedSupport.some((sup) => formatLabel(accelerator.supportOffered).toLowerCase().includes(sup.toLowerCase()))
    ) {
      return false
    }
    // Filter by status
    if (
      selectedStatus.length > 0 &&
      !selectedStatus.some((status) => 
        (pipelineStages[accelerator.id] || "Match").toLowerCase().includes(status.toLowerCase()))
    ) {
      return false
    }
    // Filter by next stage
    if (nextStageFilter && !formatLabel(accelerator.nextStage).toLowerCase().includes(nextStageFilter.toLowerCase())) {
      return false
    }
    // Filter by minimum match percentage
    if (minMatchFilter > 0 && accelerator.matchPercentage < minMatchFilter) {
      return false
    }
    return true
  })

  if (loading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem", color: "#a67c52" }}
      >
        <p>Loading accelerators...</p>
      </div>
    )
  }

  return (
    <>
      {/* Main content container */}
      <div
        style={{
          position: "relative",
          filter: modalAccelerator || showFilterModal ? "blur(2px)" : "none",
          transition: "filter 0.2s ease",
        }}
      >

        {/* Company Member Banner */}
{isCompanyMember && (
  <div style={{
    backgroundColor: userRole === 'viewer' ? '#fef3c7' : '#e0f2fe',
    border: `2px solid ${userRole === 'viewer' ? '#f59e0b' : '#0369a1'}`,
    borderRadius: '12px',
    padding: '16px 24px',
    marginBottom: '24px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  }}>
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      marginBottom: '8px' 
    }}>
      <span style={{ fontSize: '24px' }}>🤝</span>
      <h3 style={{ 
        margin: 0, 
        color: userRole === 'viewer' ? '#f59e0b' : '#0369a1', 
        fontWeight: '700',
        fontSize: '1.1rem'
      }}>
        Company Catalyst Applications - Role: {userRole?.toUpperCase()}
      </h3>
    </div>
    <p style={{ 
      margin: 0, 
      color: '#4a5568', 
      fontSize: '0.95rem',
      lineHeight: '1.5'
    }}>
      {userRole === 'owner' && 'You can view and manage all company catalyst applications.'}
      {userRole === 'admin' && 'You can view and submit catalyst applications for the company.'}
      {userRole === 'manager' && 'You can view catalyst applications and track their progress.'}
      {userRole === 'employee' && 'You can view company catalyst applications.'}
      {userRole === 'viewer' && 'You have read-only access to company catalyst applications.'}
    </p>
  </div>
)}
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
                notification.type === "success" ? "#48BB78" : notification.type === "error" ? "#F56565" : "#4299E1",
            }}
          >
            {notification.message}
          </div>
        )}

        {/* Table header with filter button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#5D2A0A",
              margin: 0,
            }}
          ></h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              style={{
                background: "#F5EBE0",
                color: "#5D2A0A",
                border: "1px solid #E8D5C4",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.8rem",
                transition: "all 0.2s",
              }}
              onClick={() => setShowFilterModal(true)}
            >
              <Filter size={16} />
              Filters
              {(selectedGeographic.length > 0 ||
                selectedSectors.length > 0 ||
                selectedStages.length > 0 ||
                selectedSupport.length > 0 ||
                selectedStatus.length > 0 ||
                nextStageFilter ||
                minMatchFilter > 0) && (
                <span
                  style={{
                    background: "#5D2A0A",
                    color: "white",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                  }}
                >
                  {
                    [
                      selectedGeographic.length,
                      selectedSectors.length,
                      selectedStages.length,
                      selectedSupport.length,
                      selectedStatus.length,
                      nextStageFilter,
                      minMatchFilter > 0,
                    ].filter(Boolean).length
                  }
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Table structure - always show */}
        <div
          style={{
            overflowX: "auto",
            borderRadius: "8px",
            border: "1px solid #E8D5C4",
            boxShadow: "0 4px 24px rgba(139, 69, 19, 0.08)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
              fontSize: "0.8rem",
              backgroundColor: "#FEFCFA",
              minWidth: "1200px",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            <colgroup>
              <col style={{ width: "160px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "110px" }} />
              <col style={{ width: "110px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "90px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "130px" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Catalyst Name</th>
                <th style={tableHeaderStyle}>Geographic Focus</th>
                <th style={tableHeaderStyle}>Sector Focus</th>
                <th style={tableHeaderStyle}>Funding Stage</th>
                <th style={tableHeaderStyle}>Funding Type</th>
                <th style={tableHeaderStyle}>Ticket Size</th>
                <th style={tableHeaderStyle}>Support Offered</th>
                <th style={tableHeaderStyle}>Services Offered</th>
                <th style={tableHeaderStyle}>Deadline</th>
                <th style={tableHeaderStyle}>Speed (Days)</th>
                <th style={tableHeaderStyle}>Match %</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={{ ...tableHeaderStyle, borderRight: "none" }}>Next Stage</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccelerators.length === 0 ? (
                <tr>
                  <td colSpan="13" style={{ ...tableCellStyle, textAlign: "center", padding: "2rem", borderRight: "none" }}>
                    <span style={{ color: "#999", fontSize: "0.875rem" }}>No catalyst data available</span>
                  </td>
                </tr>
              ) : (
                filteredAccelerators.map((accelerator) => {
                  const status = statuses[accelerator.id] || "Application not sent"
                  const pipelineStage = pipelineStages[accelerator.id] || accelerator.pipelineStage

                  return (
                    <tr key={accelerator.id} style={{ borderBottom: "1px solid #E8D5C4" }}>
                      <td style={tableCellStyle}>
                        <span
                          onClick={() => handleViewClick(accelerator)}
                          style={{
                            color: "#a67c52",
                            textDecoration: "underline",
                            cursor: "pointer",
                            fontWeight: "500",
                            wordBreak: "break-word",
                            fontSize: "0.8rem",
                          }}
                        >
                          {accelerator.name}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <TruncatedText text={formatLabel(accelerator.geographicFocus)} maxLength={30} />
                      </td>
                      <td style={tableCellStyle}>
                        <TruncatedText text={formatLabel(accelerator.sectorFocus)} maxLength={25} />
                      </td>
                      <td style={tableCellStyle}>
                        <TruncatedText text={formatLabel(accelerator.fundingStage)} maxLength={25} />
                      </td>
                      <td style={tableCellStyle}>
                        <TruncatedText text={formatLabel(accelerator.fundingType)} maxLength={20} />
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{ wordBreak: "break-word", fontSize: "0.8rem" }}>{accelerator.ticketSize}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <TruncatedText text={formatLabel(accelerator.supportOffered)} maxLength={35} />
                      </td>
                      <td style={tableCellStyle}>
                        <TruncatedText text={formatLabel(accelerator.servicesOffered)} maxLength={30} />
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{ wordBreak: "break-word", fontSize: "0.8rem" }}>
                          {accelerator.deadline || "-"}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={waitingBadgeStyle}>{accelerator.speed}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={matchContainerStyle}>
                          <div style={progressBarStyle}>
                            <div style={{ ...progressFillStyle, width: `${accelerator.matchPercentage}%` }} />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={matchScoreStyle}>{accelerator.matchPercentage}%</span>
                            <Eye
                              size={14}
                              style={{ cursor: "pointer", color: "#a67c52" }}
                              onClick={() => handleViewMatchBreakdown(accelerator)}
                            />
                          </div>
                        </div>
                      </td>

                      <td style={tableCellStyle}>
                        <div style={actionButtonsStyle}>
                          {hasApplication(accelerator.id) ? (
                            <span style={sentBadgeStyle}>
                              <Check size={14} />
                              {(pipelineStages[accelerator.id] || "Application Sent").length > 15
                                ? (pipelineStages[accelerator.id] || "Application Sent").substring(0, 12) + "..."
                                : pipelineStages[accelerator.id] || "Application Sent"}
                            </span>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <button onClick={() => handleApplyClick(accelerator)} style={applyButtonStyle}>
                                Apply
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      <td style={{ ...tableCellStyle, borderRight: "none" }}>
                        <div
                          style={{
                            ...statusBadgeStyle,
                            backgroundColor: "#F5EBE0",
                            color: "#5D2A0A",
                            fontSize: "0.55rem",
                            padding: "0.15rem 0.3rem",
                            textAlign: "center",
                            lineHeight: "1.1",
                            minHeight: "2.2rem",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            maxWidth: "100px",
                            overflow: "hidden",
                          }}
                        >
                          {accelerator.nextStage.split(" ").map((word, index) => (
                            <div key={index} style={{ fontSize: "0.55rem" }}>
                              {word}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Message below table when no accelerators */}
        {filteredAccelerators.length === 0 && !loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "2rem",
              color: "#a67c52",
              marginTop: "1rem",
            }}
          >
            <p style={{ textAlign: "center", fontSize: "0.875rem" }}>
              You have not applied for any catalysts, so there are no matches available. You need to apply first.
            </p>
          </div>
        )}
      </div>

      {mounted &&
        showMatchBreakdown &&
        selectedAccelerator &&
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
                width: "95%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              }}
            >
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>Match Breakdown - {selectedAccelerator?.name || "Accelerator"}</h3>
                <button onClick={closeAllModals} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "2rem",
                    paddingBottom: "1rem",
                    borderBottom: "2px solid #E8D5C4",
                  }}
                >
                  <div
                    style={{
                      fontSize: "3rem",
                      fontWeight: "bold",
                      color:
                        selectedAccelerator?.matchPercentage >= 80
                          ? "#388E3C"
                          : selectedAccelerator?.matchPercentage >= 60
                            ? "#F57C00"
                            : "#D32F2F",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {selectedAccelerator?.matchPercentage || 0}%
                  </div>
                  <p
                    style={{
                      fontSize: "1rem",
                      color: "#8D6E63",
                      margin: "0",
                    }}
                  >
                    Overall Match Score
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                    gap: "1rem",
                    marginBottom: "2rem",
                  }}
                >
                  {selectedAccelerator?.matchBreakdown &&
                    Object.entries(selectedAccelerator.matchBreakdown).map(([key, breakdown]) => {
                      if (!breakdown || typeof breakdown !== "object") {
                        return null
                      }

                      const scoreColor = breakdown.matched ? "#388E3C" : "#D32F2F"

                      const titles = {
                        fundingStage: "Funding Stage Match",
                        ticketSize: "Ticket Size Compatibility",
                        geographicFit: "Geographic Fit",
                        sectorMatch: "Sector Match",
                        instrumentFit: "Instrument Fit",
                        firmTypeMatch: "Firm Type Match",
                        legalEntityFit: "Legal Entity Fit",
                        revenueThreshold: "Revenue Threshold",
                      }

                      return (
                        <div
                          key={key}
                          style={{
                            background: "#FEFCFA",
                            border: "1px solid #E8D5C4",
                            borderRadius: "8px",
                            padding: "1.25rem",
                            borderLeft: `4px solid ${scoreColor}`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "0.75rem",
                            }}
                          >
                            <h4
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                color: "#5D2A0A",
                                margin: "0",
                                lineHeight: "1.3",
                                flex: "1",
                              }}
                            >
                              {titles[key] || formatLabel(key)}
                            </h4>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                color: scoreColor,
                                marginLeft: "0.5rem",
                              }}
                            >
                              {breakdown.matched ? "✓ Match" : "✗ No Match"}
                            </span>
                          </div>

                          <div style={{ fontSize: "0.75rem", color: "#666", lineHeight: "1.4" }}>
                            <div style={{ marginBottom: "0.5rem" }}>
                              <strong>Your Need:</strong>{" "}
                              {breakdown.details?.smeValue || breakdown.description || "N/A"}
                            </div>
                            <div>
                              <strong>Accelerator Offers:</strong>{" "}
                              {breakdown.details?.accelValue || breakdown.details?.acceleratorValue || "N/A"}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
              <div style={modalActionsStyle}>
                <button onClick={() => setShowMatchBreakdown(false)} style={cancelButtonStyle}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Portal for Accelerator Details Modal */}
      {mounted &&
        modalAccelerator &&
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
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              }}
            >
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>{modalAccelerator.name} Profile Summary</h3>
                <button onClick={() => setModalAccelerator(null)} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                <div style={profileSummaryStyle}>
                  <div style={summarySectionStyle}>
                    <h4 style={summaryTitleStyle}>Basic Information</h4>
                    <p style={summaryTextStyle}>
                      <strong>Location:</strong> {modalAccelerator.location}
                    </p>
                    <p style={summaryTextStyle}>
                      <strong>Geographic Focus:</strong> {modalAccelerator.geographicFocus}
                    </p>
                    <p style={summaryTextStyle}>
                      <strong>Sector Focus:</strong> {modalAccelerator.sectorFocus}
                    </p>
                  </div>
                  <div style={summarySectionStyle}>
                    <h4 style={summaryTitleStyle}>Funding Details</h4>
                    <p style={summaryTextStyle}>
                      <strong>Stage:</strong> {modalAccelerator.fundingStage}
                    </p>
                    <p style={summaryTextStyle}>
                      <strong>Type:</strong> {modalAccelerator.fundingType}
                    </p>
                    <p style={summaryTextStyle}>
                      <strong>Ticket Size:</strong> {modalAccelerator.ticketSize}
                    </p>
                  </div>
                  <div style={summarySectionStyle}>
                    <h4 style={summaryTitleStyle}>Support & Services</h4>
                    <p style={summaryTextStyle}>
                      <strong>Support Offered:</strong> {modalAccelerator.supportOffered}
                    </p>
                    <p style={summaryTextStyle}>
                      <strong>Services:</strong> {modalAccelerator.servicesOffered}
                    </p>
                  </div>
                  <div style={summarySectionStyle}>
                    <h4 style={summaryTitleStyle}>Application Details</h4>
                    <p style={summaryTextStyle}>
                      <strong>Deadline:</strong> {modalAccelerator.deadline}
                    </p>
                    <p style={summaryTextStyle}>
                      <strong>Response Time:</strong> {modalAccelerator.speed} days
                    </p>
                    <p style={summaryTextStyle}>
                      <strong>Match Score:</strong> {modalAccelerator.matchPercentage}%
                    </p>
                  </div>
                </div>
              </div>
              <div style={modalActionsStyle}>
                <button onClick={() => setModalAccelerator(null)} style={cancelButtonStyle}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Portal for Filter Modal */}
      {mounted &&
        showFilterModal &&
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
                maxWidth: "500px",
                width: "90%",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              }}
            >
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>Filter Accelerators</h3>
                <button onClick={() => setShowFilterModal(false)} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1.5rem" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "500",
                        color: "#5D2A0A",
                        fontSize: "0.8rem",
                      }}
                    >
                      Geographic Focus
                    </label>
                    <MultiSelectDropdown
                      options={geographicFocusOptions}
                      selectedValues={selectedGeographic}
                      onSelect={(value) => setSelectedGeographic((prev) => [...prev, value])}
                      onRemove={(value) => setSelectedGeographic((prev) => prev.filter((v) => v !== value))}
                      placeholder="Select geographic focus..."
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "500",
                        color: "#5D2A0A",
                        fontSize: "0.8rem",
                      }}
                    >
                      Sector Focus
                    </label>
                    <MultiSelectDropdown
                      options={sectorFocusOptions}
                      selectedValues={selectedSectors}
                      onSelect={(value) => setSelectedSectors((prev) => [...prev, value])}
                      onRemove={(value) => setSelectedSectors((prev) => prev.filter((v) => v !== value))}
                      placeholder="Select sectors..."
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "500",
                        color: "#5D2A0A",
                        fontSize: "0.8rem",
                      }}
                    >
                      Funding Stage
                    </label>
                    <MultiSelectDropdown
                      options={fundingStageOptions}
                      selectedValues={selectedStages}
                      onSelect={(value) => setSelectedStages((prev) => [...prev, value])}
                      onRemove={(value) => setSelectedStages((prev) => prev.filter((v) => v !== value))}
                      placeholder="Select funding stages..."
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "500",
                        color: "#5D2A0A",
                        fontSize: "0.8rem",
                      }}
                    >
                      Support Offered
                    </label>
                    <MultiSelectDropdown
                      options={supportOfferedOptions}
                      selectedValues={selectedSupport}
                      onSelect={(value) => setSelectedSupport((prev) => [...prev, value])}
                      onRemove={(value) => setSelectedSupport((prev) => prev.filter((v) => v !== value))}
                      placeholder="Select support types..."
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "500",
                        color: "#5D2A0A",
                        fontSize: "0.8rem",
                      }}
                    >
                      Status
                    </label>
                    <MultiSelectDropdown
                      options={statusOptions}
                      selectedValues={selectedStatus}
                      onSelect={(value) => setSelectedStatus((prev) => [...prev, value])}
                      onRemove={(value) => setSelectedStatus((prev) => prev.filter((v) => v !== value))}
                      placeholder="Select status..."
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "500",
                        color: "#5D2A0A",
                        fontSize: "0.8rem",
                      }}
                    >
                      Next Stage
                    </label>
                    <select
                      value={nextStageFilter}
                      onChange={(e) => setNextStageFilter(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid #E8D5C4",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                      }}
                    >
                      <option value="">All Next Stages</option>
                      {uniqueNextStages.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "500",
                        color: "#5D2A0A",
                        fontSize: "0.8rem",
                      }}
                    >
                      Minimum Match Percentage: {minMatchFilter}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={minMatchFilter}
                      onChange={(e) => setMinMatchFilter(Number.parseInt(e.target.value))}
                      style={{
                        width: "100%",
                      }}
                    />
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "1.5rem",
                  borderTop: "1px solid #E8D5C4",
                }}
              >
                <button
                  onClick={resetFilters}
                  style={{
                    background: "transparent",
                    color: "#5D2A0A",
                    border: "1px solid #5D2A0A",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  Reset Filters
                </button>
                <button
                  onClick={applyFilters}
                  style={{
                    background: "#5D2A0A",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

// Style constants - reduced font sizes
const tableHeaderStyle = {
  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
  color: "#FEFCFA",
  padding: "0.6rem 0.4rem",
  textAlign: "left",
  fontWeight: "600",
  fontSize: "0.8rem",
  letterSpacing: "0.3px",
  textTransform: "none",
  position: "sticky",
  top: "0",
  zIndex: "10",
  borderBottom: "2px solid #1a0c02",
  borderRight: "1px solid #1a0c02",
  lineHeight: "1.2",
  fontFamily: "system-ui, -apple-system, sans-serif",
}

const tableCellStyle = {
  padding: "0.6rem 0.4rem",
  borderBottom: "1px solid #E8D5C4",
  borderRight: "1px solid #E8D5C4",
  fontSize: "0.8rem",
  verticalAlign: "top",
  color: "#5d2a0a",
  lineHeight: "1.4",
  maxWidth: "0",
  overflow: "hidden",
  fontFamily: "system-ui, -apple-system, sans-serif",
}

const waitingBadgeStyle = {
  background: "#F5EBE0",
  color: "#5D2A0A",
  padding: "0.2rem 0.4rem",
  borderRadius: "4px",
  fontSize: "0.8rem",
  fontWeight: "500",
  whiteSpace: "nowrap",
  fontFamily: "system-ui, -apple-system, sans-serif",
}

const matchContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "0.25rem",
}

const progressBarStyle = {
  width: "60px",
  height: "6px",
  background: "#E8D5C4",
  borderRadius: "3px",
  overflow: "hidden",
}

const progressFillStyle = {
  height: "100%",
  background: "linear-gradient(90deg, #48BB78, #68d391)",
  transition: "width 0.3s ease",
}

const matchScoreStyle = {
  fontWeight: "600",
  color: "#5D2A0A",
  fontSize: "0.8rem",
  fontFamily: "system-ui, -apple-system, sans-serif",
}

const actionButtonsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  width: "100%",
}

const applyButtonStyle = {
  padding: "0.3rem 0.5rem",
  background: "#5D2A0A",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "0.7rem",
  cursor: "pointer",
  transition: "background 0.2s",
  whiteSpace: "nowrap",
  fontFamily: "system-ui, -apple-system, sans-serif",
}

const sentBadgeStyle = {
  background: "#48BB78",
  color: "white",
  padding: "0.3rem 0.5rem",
  borderRadius: "4px",
  fontSize: "0.7rem",
  fontWeight: "500",
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
  whiteSpace: "nowrap",
  fontFamily: "system-ui, -apple-system, sans-serif",
}

const statusBadgeStyle = {
  borderRadius: "3px",
  fontWeight: "500",
  display: "inline-block",
}

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1.5rem",
  borderBottom: "1px solid #E8D5C4",
  background: "#F5EBE0",
}

const modalTitleStyle = {
  margin: "0",
  fontSize: "1.1rem",
  fontWeight: "600",
  color: "#5D2A0A",
  fontFamily: "system-ui, -apple-system, sans-serif",
}

const modalCloseButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "1.5rem",
  cursor: "pointer",
  color: "#5D2A0A",
}

const modalBodyStyle = {
  padding: "1.5rem",
}

const profileSummaryStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
}

const summarySectionStyle = {
  // No specific styles needed
}

const summaryTitleStyle = {
  fontSize: "0.9rem",
  fontWeight: "600",
  margin: "0 0 0.5rem 0",
  color: "#5D2A0A",
  fontFamily: "system-ui, -apple-system, sans-serif",
}

const summaryTextStyle = {
  margin: "0.25rem 0",
  fontSize: "0.8rem",
  color: "#5D2A0A",
  fontFamily: "system-ui, -apple-system, sans-serif",
}

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.5rem",
  padding: "1.5rem",
  borderTop: "1px solid #E8D5C4",
}

const cancelButtonStyle = {
  background: "#F5EBE0",
  color: "#5D2A0A",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontFamily: "system-ui, -apple-system, sans-serif",
}