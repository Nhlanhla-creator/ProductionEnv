"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, Filter, Eye, X } from "lucide-react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../../firebaseConfig" // adjust to your Firebase setup
import { auth } from "../../firebaseConfig"
import { doc, setDoc, serverTimestamp, getDoc, query, where, onSnapshot } from "firebase/firestore"

// Mock data for the advisor table
const mockAdvisors = []

// Status definitions with colors
const STATUS_TYPES = {
  "New Match": {
    color: "#F5EBE0",
    textColor: "#5D2A0A",
  },
  Shortlisted: {
    color: "#E8D5C4",
    textColor: "#4E342E",
  },
  Contacted: {
    color: "#E8D5C4",
    textColor: "#543c36ff",
  },
  Confirmed: {
    color: "#E8F5E8",
    textColor: "#388E3C",
  },
  Declined: {
    color: "#FFEBEE",
    textColor: "#D32F2F",
  },
  Match: {
    color: "#F5EBE0",
    textColor: "#5D2A0A",
  },
}
const operationStages = [
  { value: "Startup", label: "Startup" },
  { value: "Growth", label: "Growth" },
  { value: "Scaling", label: "Scaling" },
  { value: "Turnaround", label: "Turnaround" },
  { value: "Mature", label: "Mature" },
]

// Economic sectors data
const economicSectors = [
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

// African countries data
const africanCountries = [
  { value: "Algeria", label: "Algeria" },
  { value: "Angola", label: "Angola" },
  { value: "Benin", label: "Benin" },
  { value: "Botswana", label: "Botswana" },
  { value: "Burkina Faso", label: "Burkina Faso" },
  { value: "Burundi", label: "Burundi" },
  { value: "Cabo Verde", label: "Cabo Verde" },
  { value: "Cameroon", label: "Cameroon" },
  { value: "Central African Republic", label: "Central African Republic" },
  { value: "Chad", label: "Chad" },
  { value: "Comoros", label: "Comoros" },
  { value: "Congo", label: "Congo" },
  { value: "Côte d'Ivoire", label: "Côte d'Ivoire" },
  { value: "Djibouti", label: "Djibouti" },
  { value: "DR Congo", label: "DR Congo" },
  { value: "Egypt", label: "Egypt" },
  { value: "Equatorial Guinea", label: "Equatorial Guinea" },
  { value: "Eritrea", label: "Eritrea" },
  { value: "Eswatini", label: "Eswatini" },
  { value: "Ethiopia", label: "Ethiopia" },
  { value: "Gabon", label: "Gabon" },
  { value: "Gambia", label: "Gambia" },
  { value: "Ghana", label: "Ghana" },
  { value: "Guinea", label: "Guinea" },
  { value: "Guinea-Bissau", label: "Guinea-Bissau" },
  { value: "Kenya", label: "Kenya" },
  { value: "Lesotho", label: "Lesotho" },
  { value: "Liberia", label: "Liberia" },
  { value: "Libya", label: "Libya" },
  { value: "Madagascar", label: "Madagascar" },
  { value: "Malawi", label: "Malawi" },
  { value: "Mali", label: "Mali" },
  { value: "Mauritania", label: "Mauritania" },
  { value: "Mauritius", label: "Mauritius" },
  { value: "Morocco", label: "Morocco" },
  { value: "Mozambique", label: "Mozambique" },
  { value: "Namibia", label: "Namibia" },
  { value: "Niger", label: "Niger" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "Rwanda", label: "Rwanda" },
  { value: "São Tomé and Príncipe", label: "São Tomé and Príncipe" },
  { value: "Senegal", label: "Senegal" },
  { value: "Seychelles", label: "Seychelles" },
  { value: "Sierra Leone", label: "Sierra Leone" },
  { value: "Somalia", label: "Somalia" },
  { value: "South Africa", label: "South Africa" },
  { value: "South Sudan", label: "South Sudan" },
  { value: "Sudan", label: "Sudan" },
  { value: "Tanzania", label: "Tanzania" },
  { value: "Togo", label: "Togo" },
  { value: "Tunisia", label: "Tunisia" },
  { value: "Uganda", label: "Uganda" },
  { value: "Zambia", label: "Zambia" },
  { value: "Zimbabwe", label: "Zimbabwe" },
]

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
          fontSize: "0.75rem",
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
                fontSize: "0.75rem",
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
const TruncatedText = ({ text, maxLength = 30 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span style={{ color: "#999", fontSize: "0.75rem" }}>{text || "-"}</span>
  }

  const shouldTruncate = text.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`

  const toggleExpanded = (e) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div style={{ lineHeight: "1.3", fontSize: "0.75rem" }}>
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

  // Handle arrays by joining them first
  if (Array.isArray(value)) {
    return value.map((item) => formatLabel(item)).join(", ")
  }

  // Convert to string in case it's a number or other type
  const stringValue = value.toString().trim()

  // Return empty string if value is falsy after conversion
  if (!stringValue) return ""

  // Special cases
  const specialCases = {
    ict: "ICT",
    southafrica: "South Africa",
    south_africa: "South Africa",
    usa: "USA",
    uk: "UK",
    uae: "UAE",
  }

  // Check for special cases
  const lowerValue = stringValue.toLowerCase()
  if (specialCases[lowerValue]) {
    return specialCases[lowerValue]
  }

  // Process each word separated by commas first
  return stringValue
    .split(",")
    .map((part) => {
      // Process each word separated by underscores, hyphens, or spaces
      return part
        .trim()
        .split(/[_\s-]+/)
        .map((word) => {
          // Skip empty words
          if (!word) return ""
          // Capitalize first letter, lowercase the rest
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        })
        .join(" ")
    })
    .join(", ")
}

const breakdownItemStyle = (matched, label) => ({
  background: "#FEFCFA",
  border: "1px solid #E8D5C4",
  borderRadius: "8px",
  padding: "1.25rem",
  borderLeft: `4px solid ${matched ? "#388E3C" : "#D32F2F"}`,
  marginBottom: "1rem",
})

const getStatusStyle = (status) => {
  return STATUS_TYPES[status] || { color: "#F5F5F5", textColor: "#666666" }
}

export function AdvisorTable({ filters, onConnectionRequested, onCountChange }) {
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState({})
  const [advisors, setAdvisors] = useState([])
  const [loading, setLoading] = useState(false)
  const [statuses, setStatuses] = useState({})
  const [modalAdvisor, setModalAdvisor] = useState(null)
  const [notification, setNotification] = useState(null)
  const [mounted, setMounted] = useState(false)

  // Filter states
  const [sectorFilter, setSectorFilter] = useState("")
  const [stageFilter, setStageFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState("")
  const [selectedLocations, setSelectedLocations] = useState([])
  const [selectedSectors, setSelectedSectors] = useState([])
  const [selectedStages, setSelectedStages] = useState([])
  const [statusFilter, setStatusFilter] = useState("")
  const [compensationFilter, setCompensationFilter] = useState("")
  const [minMatchFilter, setMinMatchFilter] = useState(0)

  const [matchBreakdownModal, setMatchBreakdownModal] = useState(null)
  // Add this useEffect to listen for status updates
  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const unsubscribe = onSnapshot(
      query(collection(db, "SmeAdvisorApplications"), where("smeId", "==", user.uid)),
      (snapshot) => {
        const statusUpdates = {}
        snapshot.forEach((doc) => {
          const data = doc.data()
          statusUpdates[data.advisorId] = data.status
        })
        setStatuses(statusUpdates)
      },
    )

    return () => unsubscribe()
  }, [])

  const mapFirestoreAdvisorToTable = (data, id) => {
    const formData = data.formData || {}
    const contact = formData.contactDetails || {}
    const overview = formData.personalProfessionalOverview || {}
    const selection = formData.selectionCriteria || {}
    const declaration = formData.declarationConsent || {}

    return {
      id, // Firestore document ID
      name: `${contact.name || ""} ${contact.surname || ""}`.trim(),
      headline: overview.professionalHeadline || "Advisor",
      location: formatLabel(contact.country || contact.province || "N/A"),
      sectorFocus: formatLabel(overview.industryExperience || []),
      functionalExpertise: formatLabel(overview.functionalExpertise || []),
      fundingStage: formatLabel(selection.smeStageFit || []),
      engagementType: formatLabel(selection.preferredAdvisorRole || "Not specified"),
      compensationModel: formatLabel(selection.compensationModel || "Not specified"),
      startDate: "Anytime",
      availability: formatLabel(selection.timeCommitment + " hrs" || "Not specified"),
      matchPercentage: 0, // 70-100%
      responseRate: 0, // 30-90%
      status: "Match",
      nextAction: "Review Profile",
    }
  }

  const ADVISORY_PIPELINE = {
    MATCHED: { label: "Match", next: "Contacted" },
    CONTACTED: { label: "Contacted", next: "Pending " },
    CONFIRMED: { label: "Confirmed", next: "Engaged" },
    DECLINED: { label: "Declined", next: null },
  }

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // ---- Functional-Expertise helpers ----
const toArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const canon = (s) => s.toString().toLowerCase().replace(/[^a-z]/g, "");

// Common aliases (extend as needed)
const FE_ALIASES = {
  hr: "hr", humanresources: "hr",
  tech: "tech", technology: "tech", it: "tech", ict: "tech",
  legal: "legal", law: "legal",
  strategy: "strategy",
  finance: "finance",
  esg: "esg",
  governance: "governance",
};

const normFE = (list) => {
  const out = new Set();
  for (const item of toArr(list)) {
    const key = FE_ALIASES[canon(item)] || canon(item);
    if (key) out.add(key);
  }
  return [...out];
};

const overlapFE = (a, b) => {
  const A = new Set(normFE(a));
  for (const t of normFE(b)) if (A.has(t)) return true;
  return false;
};

  function calculateAdvisorMatch(smeProfile, advisorProfile) {
    const supportFocus = smeProfile.advisoryNeedsAssessment?.supportFocus || []
    const fundingStage = (smeProfile.entityOverview?.operationStage || "").toLowerCase()
    const smeSectors = (smeProfile.entityOverview?.economicSectors || []).map((s) => s.toLowerCase())
    const smeLocation = (smeProfile.entityOverview?.location || "").toLowerCase()
    const smeLegal = (smeProfile.entityOverview?.legalStructure || "").toLowerCase()
    const rawRevenue = smeProfile.financialOverview?.annualRevenue || "0"
    const smeRevenue = Number.parseFloat(rawRevenue.replace(/[Rr\s,]/g, "").trim())
const smeFunctionalExpertise = (smeProfile.entityOverview || [])
    const advForm = advisorProfile.formData || {}
    const contact = advForm.contactDetails || {}
    const overview = advForm.personalProfessionalOverview || {}
    const selection = advForm.selectionCriteria || {}
const smeFE = toArr(smeProfile?.advisoryNeedsAssessment?.functionalExpertise);
const advisorFE = [
  ...new Set([
    ...toArr(overview?.functionalExpertise),
    ...toArr(selection?.functionalExpertise),
  ]),
];

    // Initialize breakdown with safe defaults
    const breakdown = {
      stageFit: {
        matched: false,
        smeValue: fundingStage,
        advisorValue: selection.smeStageFit || [],
      },
      skillAlignment: {
        matched: false,
        smeValue: supportFocus,
        advisorValue: selection.advisorySupportType || [],
      },
      location: {
        matched: false,
        smeValue: smeLocation,
        advisorValue: contact.country || "",
      },
      sector: {
        matched: false,
        smeValue: smeSectors,
        advisorValue: overview.industryExperience || [],
      },
      compensation: {
        matched: !!selection.compensationModel,
        advisorValue: selection.compensationModel || "Not specified",
      },
      functionalExpertise: {
        matched: false,
         smeValue: smeFE ||[],
        advisorValue: overview.functionalExpertise || [],
      },
      legalEntityFit: {
        matched: false,
        smeValue: smeLegal,
        advisorValue: selection.legalEntityFit || "",
      },
      revenueThreshold: {
        matched: false,
        smeValue: smeRevenue,
        advisorRange: selection.revenueThreshold || "Not specified",
      },
    }

    // Calculate matches with proper null checks
    breakdown.stageFit.matched = (breakdown.stageFit.advisorValue || [])
      .map((s) => s?.toLowerCase() || "")
      .includes(fundingStage)

    breakdown.skillAlignment.matched = (breakdown.skillAlignment.advisorValue || []).some((type) =>
      supportFocus.includes(type),
    )

    breakdown.location.matched = (contact.country || "").toLowerCase() === smeLocation

    breakdown.sector.matched = (breakdown.sector.advisorValue || []).some((sector) =>
      smeSectors.includes((sector || "").toLowerCase()),
    )

    breakdown.functionalExpertise.matched = overlapFE(
  breakdown.functionalExpertise.smeValue,
  breakdown.functionalExpertise.advisorValue,
);

    breakdown.legalEntityFit.matched = (selection.legalEntityFit || "").toLowerCase() === smeLegal

    // Revenue threshold calculation
    const revenueBands = {
      less_than_500k: [0, 500000],
      "500k_to_1m": [500000, 1000000],
      less_than_1m: [0, 1000000],
      "1m_to_5m": [1000000, 5000000],
      "5m_to_10m": [5000000, 10000000],
      "10m_plus": [10000000, Number.POSITIVE_INFINITY],
    }

    const threshold = (selection.revenueThreshold || "").toLowerCase()
    const [minRev, maxRev] = revenueBands[threshold] || [0, Number.POSITIVE_INFINITY]
    breakdown.revenueThreshold.matched = smeRevenue >= minRev && smeRevenue <= maxRev

    // Calculate score
    const score = Object.values(breakdown).filter((item) => item.matched).length
    const total = Object.keys(breakdown).length
    const matchScore = Math.round((score / total) * 100)

    console.groupCollapsed(`🧩 Advisor Match Debug: ${contact.name || "Unnamed Advisor"}`)
    console.log("Breakdown:", breakdown)
    console.log("Final Score:", matchScore)
    console.groupEnd()

    return {
      score: matchScore,
      breakdown,
    }
  }

  useEffect(() => {
  const fetchAdvisors = async () => {
    setLoading(true)
    try {
      const snapshot = await getDocs(collection(db, "advisorProfiles"))
      const user = auth.currentUser
      if (!user) return

      const smeDoc = await getDoc(doc(db, "universalProfiles", user.uid))
      const advisoryApp = await getDoc(doc(db, "advisoryApplications", user.uid))

      const profileData = {
        ...(smeDoc.exists() ? smeDoc.data() : {}),
        advisoryNeedsAssessment: advisoryApp.exists() ? advisoryApp.data().advisoryNeedsAssessment : {},
      }

      const mapped = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        const id = docSnap.id
        const matchResult = calculateAdvisorMatch(profileData, data)

        return {
          ...mapFirestoreAdvisorToTable(data, id),
          matchPercentage: matchResult.score,
          matchBreakdown: matchResult.breakdown,
        }
      })

      // Sort by match percentage (highest to lowest)
      mapped.sort((a, b) => b.matchPercentage - a.matchPercentage)
      setAdvisors(mapped)

      if (onCountChange) {
        onCountChange(mapped.length) // Use mapped.length instead of advisors.length
      }
    } catch (error) {
      console.error("Error fetching advisors:", error)
    } finally {
      setLoading(false)
    }
  }

  fetchAdvisors()
}, [onCountChange])

  const handleConnectClick = async (advisor) => {
    const user = auth.currentUser
    if (!user) return

    const smeUserId = user.uid
    const advisorUserId = advisor.id

    // Initialize matchData first
    const matchData = {
      advisorId: advisorUserId,
      smeId: smeUserId,
      createdAt: serverTimestamp(),
      status: "Contacted",
      matchPercentage: advisor.matchPercentage || 0,
      advisorName: advisor.name,
      advisorSector: advisor.sectorFocus,
      advisorFundingStage: advisor.fundingStage,
      advisorEngagementType: advisor.engagementType,
      advisorCompensationModel: advisor.compensationModel,
      advisorAvailability: advisor.availability,
      bigScore: 0,
      compliance: 0,
      fundability: 0,
      leadership: 0,
      legitimacy: 0,
      pis: 0,
      smeName: "",
      smeLocation: "",
      smeSector: "",
      smeStage: "",
      smeSupport: "",
      revenue: 0,
    }

    try {
      // Fetch SME profile details
      const smeDoc = await getDoc(doc(db, "universalProfiles", smeUserId))
      const smeData = smeDoc.exists() ? smeDoc.data() : {}
      const smeApplicationDoc = await getDoc(doc(db, "advisoryApplications", smeUserId))
      const smeApplicationData = smeApplicationDoc.exists() ? smeApplicationDoc.data() : {}
      const advisoryNeedsAssessment = smeApplicationData.advisoryNeedsAssessment || {}
      const Revenue = smeData.financialOverview?.annualRevenue || "0"
      const smeBigScoreDoc = await getDoc(doc(db, "bigEvaluations", smeUserId))
      const smeBigScoreData = smeBigScoreDoc.exists() ? smeBigScoreDoc.data() : {}

      // Update match data with SME details
      matchData.bigScore = smeBigScoreData.scores?.bigScore || 0
      matchData.smeName = smeData.entityOverview?.registeredName || ""
      matchData.revenue = Revenue
      matchData.compliance = smeBigScoreData.scores?.compliance || 0
      matchData.fundability = smeBigScoreData.scores?.fundability || 0
      matchData.leadership = smeBigScoreData.scores?.leadership || 0
      matchData.legitimacy = smeBigScoreData.scores?.legitimacy || 0
      matchData.smeLocation = smeData.entityOverview?.location || ""
      matchData.smeSector = (smeData.entityOverview?.economicSectors || []).join(", ")
      matchData.smeStage = smeData.applicationOverview?.fundingStage || ""
      matchData.smeSupport = (advisoryNeedsAssessment.supportFocus || []).join(", ")

      // Save match record
      await setDoc(doc(db, "AdvisoryMatches", `${smeUserId}_${advisorUserId}`), matchData)

      // Save views for SME and advisor sides
      const advisorAppData = { ...matchData, viewType: "advisor" }
      const smeAppData = { ...matchData, viewType: "sme" }

      await Promise.all([
        setDoc(doc(db, "AdvisorApplications", `${advisorUserId}_${smeUserId}`), advisorAppData),
        setDoc(doc(db, "SmeAdvisorApplications", `${smeUserId}_${advisorUserId}`), smeAppData),
      ])

      // Update UI status
      setStatuses((prev) => ({ ...prev, [advisor.id]: "Contacted" }))

      // Dispatch notification event
      const dispatchNotification = () => {
        const notificationMessage = `Connection request sent to ${advisor.name}!`
        console.log("Dispatching advisor notification:", notificationMessage)

        const event = new CustomEvent("newNotification", {
          detail: {
            message: notificationMessage,
            type: "success",
            timestamp: new Date().toISOString(),
          },
          bubbles: true,
          cancelable: true,
          composed: true,
        })

        setTimeout(() => {
          window.dispatchEvent(event)
          console.log("Advisor notification event dispatched")
        }, 100)
      }

      dispatchNotification()

      // UI notification
      setNotification({ type: "success", message: `Connection request sent to ${advisor.name}!` })
      setTimeout(() => setNotification(null), 3000)

      if (onConnectionRequested) {
        onConnectionRequested()
      }
    } catch (error) {
      console.error("Error saving advisor match:", error)

      // Dispatch error notification
      const errorEvent = new CustomEvent("newNotification", {
        detail: {
          message: `Failed to send connection request to ${advisor.name}`,
          type: "error",
          timestamp: new Date().toISOString(),
        },
      })
      window.dispatchEvent(errorEvent)

      setNotification({ type: "error", message: "Failed to send connection request." })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  useEffect(() => {
    const fetchAdvisorApplications = async () => {
      const user = auth.currentUser
      if (!user) return

      const snapshot = await getDocs(collection(db, "SmeAdvisorApplications"))
      const matches = snapshot.docs.filter((doc) => doc.data().smeId === user.uid).map((doc) => doc.data())

      const updatedStatuses = {}
      matches.forEach((match) => {
        updatedStatuses[match.advisorId] = match.status || "Contacted"
      })
      setStatuses(updatedStatuses)
    }

    fetchAdvisorApplications()
  }, [])

  const handleViewClick = (advisor) => {
    setModalAdvisor(advisor)
  }

  const handleShortlistClick = (advisor) => {
    setStatuses((prev) => ({ ...prev, [advisor.id]: "Shortlisted" }))
    setNotification({ type: "info", message: `${advisor.name} added to shortlist` })
    setTimeout(() => setNotification(null), 3000)
  }

  const applyFilters = () => {
    setShowFilterModal(false)
  }

  const resetFilters = () => {
    setSelectedLocations([])
    setSelectedSectors([])
    setSelectedStages([])
    setStatusFilter("")
    setCompensationFilter("")
    setMinMatchFilter(0)
    setShowFilterModal(false)
  }

  // Get unique values for filter dropdowns
  const uniqueLocations = [...new Set(advisors.map((adv) => adv.location).filter(Boolean))]
  const uniqueSectors = [...new Set(advisors.map((adv) => adv.sectorFocus).filter(Boolean))]
  const uniqueStages = [...new Set(advisors.map((adv) => adv.fundingStage).filter(Boolean))]
  const uniqueStatuses = [...new Set(advisors.map((adv) => statuses[adv.id] || adv.status).filter(Boolean))]
  const uniqueCompensation = [...new Set(advisors.map((adv) => adv.compensationModel).filter(Boolean))]

  const filteredAdvisors = advisors.filter((advisor) => {
    const currentStatus = statuses[advisor.id] || advisor.status

    // Filter by location
    if (
      selectedLocations.length > 0 &&
      !selectedLocations.some((loc) => formatLabel(advisor.location).toLowerCase().includes(loc.toLowerCase()))
    ) {
      return false
    }
    // Filter by sector
    if (
      selectedSectors.length > 0 &&
      !selectedSectors.some((sec) => formatLabel(advisor.sectorFocus).toLowerCase().includes(sec.toLowerCase()))
    ) {
      return false
    }
    // Filter by stage
    if (
      selectedStages.length > 0 &&
      !selectedStages.some((stage) => formatLabel(advisor.fundingStage).toLowerCase().includes(stage.toLowerCase()))
    ) {
      return false
    }
    // Filter by status
    if (statusFilter && currentStatus.toLowerCase() !== statusFilter.toLowerCase()) {
      return false
    }
    // Filter by compensation model
    if (
      compensationFilter &&
      !formatLabel(advisor.compensationModel).toLowerCase().includes(compensationFilter.toLowerCase())
    ) {
      return false
    }
    // Filter by minimum match percentage
    if (minMatchFilter > 0 && advisor.matchPercentage < minMatchFilter) {
      return false
    }
    return true
  })

  if (loading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem", color: "#a67c52" }}
      >
        <p>Loading advisors...</p>
      </div>
    )
  }

  return (
    <>
      {/* Main content container */}
      <div
        style={{
          position: "relative",
          filter: modalAdvisor || showFilterModal ? "blur(2px)" : "none",
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
                fontSize: "0.75rem",
                transition: "all 0.2s",
              }}
              onClick={() => setShowFilterModal(true)}
            >
              <Filter size={16} />
              Filters
              {(selectedLocations.length > 0 ||
                selectedSectors.length > 0 ||
                selectedStages.length > 0 ||
                statusFilter ||
                compensationFilter ||
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
                      selectedLocations.length,
                      selectedSectors.length,
                      selectedStages.length,
                      statusFilter,
                      compensationFilter,
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
              fontSize: "0.875rem",
              backgroundColor: "#FEFCFA",
              tableLayout: "fixed",
              minWidth: "1200px",
            }}
          >
            <colgroup>
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Advisor Name</th>
                <th style={tableHeaderStyle}>Headline/Role</th>
                <th style={tableHeaderStyle}>Location</th>
                <th style={tableHeaderStyle}>Sector Focus</th>
                <th style={tableHeaderStyle}>Functional Expertise</th>
                <th style={tableHeaderStyle}>Funding Stage</th>
                <th style={tableHeaderStyle}>Engagement Type</th>
                <th style={tableHeaderStyle}>Compensation Model</th>
                <th style={tableHeaderStyle}>Start Date</th>
                <th style={tableHeaderStyle}>Availability</th>
                <th style={tableHeaderStyle}>Match %</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={{ ...tableHeaderStyle, borderRight: "none" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdvisors.length === 0 ? (
                <tr>
                  <td colSpan="13" style={{ ...tableCellStyle, textAlign: "center", padding: "2rem", borderRight: "none" }}>
                    <span style={{ color: "#999", fontSize: "0.875rem" }}>No advisor data available</span>
                  </td>
                </tr>
              ) : (
                filteredAdvisors.map((advisor) => {
                  const currentStatus = statuses[advisor.id] || advisor.status
                  const statusStyle = getStatusStyle(currentStatus)

                  return (
                    <tr key={advisor.id} style={{ borderBottom: "1px solid #E8D5C4" }}>
                      <td style={tableCellStyle}>
                        <span
                          onClick={() => handleViewClick(advisor)}
                          style={{
                            color: "#a67c52",
                            textDecoration: "underline",
                            cursor: "pointer",
                            fontWeight: "500",
                            wordBreak: "break-word",
                          }}
                        >
                          {advisor.name}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <TruncatedText text={advisor.headline} maxLength={25} />
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{ wordBreak: "break-word" }}>{advisor.location}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <TruncatedText text={formatLabel(advisor.sectorFocus)} maxLength={20} />
                      </td>
                      <td style={tableCellStyle}>
                        <TruncatedText text={formatLabel(advisor.functionalExpertise)} maxLength={25} />
                      </td>
                      <td style={tableCellStyle}>
                        <TruncatedText text={formatLabel(advisor.fundingStage)} maxLength={20} />
                      </td>
                      <td style={tableCellStyle}>
                        <TruncatedText text={advisor.engagementType} maxLength={20} />
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{ wordBreak: "break-word", fontSize: "0.7rem" }}>{advisor.compensationModel}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{ wordBreak: "break-word", fontSize: "0.7rem" }}>{advisor.startDate}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={availabilityBadgeStyle}>{advisor.availability}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={matchContainerStyle}>
                          <div style={progressBarStyle}>
                            <div
                              style={{
                                ...progressFillStyle,
                                width: `${Math.max(0, Math.min(100, advisor.matchPercentage || 0))}%`,
                                backgroundColor:
                                  advisor.matchPercentage > 75
                                    ? "#48BB78"
                                    : advisor.matchPercentage > 50
                                      ? "#F6AD55"
                                      : "#F56565",
                              }}
                            />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                            <span
                              style={{
                                ...matchScoreStyle,
                                color:
                                  advisor.matchPercentage > 75
                                    ? "#48BB78"
                                    : advisor.matchPercentage > 50
                                      ? "#D69E2E"
                                      : "#E53E3E",
                              }}
                            >
                              {advisor.matchPercentage || 0}%
                            </span>
                            <Eye
                              size={14}
                              style={{ cursor: "pointer", color: "#a67c52" }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setMatchBreakdownModal({
                                  ...advisor,
                                  breakdown: advisor.matchBreakdown,
                                })
                              }}
                              title="View match breakdown"
                            />
                          </div>
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <span
                          style={{
                            ...statusBadgeStyle,
                            backgroundColor: statusStyle.color,
                            color: statusStyle.textColor,
                          }}
                        >
                          {currentStatus}
                        </span>
                      </td>
                      <td style={{ ...tableCellStyle, borderRight: "none" }}>
                        <div style={actionButtonsStyle}>
                          {currentStatus === "Confirmed" ? (
                            <span style={confirmedBadgeStyle}>
                              <Check size={12} /> Confirmed
                            </span>
                          ) : currentStatus === "Deal Successful" ? (
                            <span style={confirmedBadgeStyle}>
                              <Check size={12} /> Connected
                            </span>
                          ) : currentStatus === "Deal Declined" ? (
                            <span style={contactedBadgeStyle}>Declined</span>
                          ) : currentStatus === "Match" || currentStatus === "New Match" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <button
                                onClick={() => handleConnectClick(advisor)}
                                style={{
                                  ...statusBadgeStyle,
                                  backgroundColor: "#5D2A0A",
                                  color: "white",
                                  padding: "0.25rem 0.5rem",
                                  cursor: "pointer",
                                  border: "none",
                                  borderRadius: "3px",
                                  fontWeight: "500",
                                  fontSize: "0.65rem",
                                }}
                              >
                                Connect
                              </button>
                            </div>
                          ) : (
                            <span style={contactedBadgeStyle}>Pending</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Message below table when no advisors */}
        {filteredAdvisors.length === 0 && !loading && (
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
              You have not applied for any advisors, so there are no matches available. You need to apply first.
            </p>
          </div>
        )}
      </div>

      {/* Portal for Advisor Details Modal */}
      {mounted &&
        modalAdvisor &&
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
                <h3 style={modalTitleStyle}>{modalAdvisor.name} Profile Summary</h3>
                <button onClick={() => setModalAdvisor(null)} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                <div style={profileSummaryStyle}>
                  <div style={summarySectionStyle}>
                    <h4 style={summaryTitleStyle}>Basic Information</h4>
                    <p style={summaryTextStyle}>
                      <strong>Role:</strong> {modalAdvisor.headline}
                    </p>
                    <p style={summaryTextStyle}>
                      <strong>Location:</strong> {modalAdvisor.location}
                    </p>
                    <p style={summaryTextStyle}>
                      <strong>Sector Focus:</strong> {modalAdvisor.sectorFocus}
                    </p>
                  </div>
                  <div style={summarySectionStyle}>
                    <h4 style={summaryTitleStyle}>Expertise & Experience</h4>
                    <p style={summaryTextStyle}>
                      <strong>Functional Expertise:</strong> {modalAdvisor.functionalExpertise}
                    </p>
                    <p style={summaryTextStyle}>
                      <strong>Funding Stage:</strong> {modalAdvisor.fundingStage}
                    </p>
                    <p style={summaryTextStyle}>
                      <strong>Engagement Type:</strong> {modalAdvisor.engagementType}
                    </p>
                  </div>
                  <div style={summarySectionStyle}>
                    <h4 style={summaryTitleStyle}>Engagement Details</h4>
                    <p style={summaryTextStyle}>
                      <strong>Compensation:</strong> {modalAdvisor.compensationModel}
                    </p>
                    <p style={summaryTextStyle}>
                      <strong>Availability:</strong> {modalAdvisor.availability}
                    </p>
                    <p style={summaryTextStyle}>
                      <strong>Start Date:</strong> {modalAdvisor.startDate}
                    </p>
                  </div>
                  <div style={summarySectionStyle}>
                    <h4 style={summaryTitleStyle}>Performance Metrics</h4>
                    <p style={summaryTextStyle}>
                      <strong>Match Score:</strong> {modalAdvisor.matchPercentage}%
                    </p>
                    <p style={summaryTextStyle}>
                      <strong>Status:</strong> {modalAdvisor.status}
                    </p>
                  </div>
                </div>
              </div>
              <div style={modalActionsStyle}>
                <button onClick={() => setModalAdvisor(null)} style={cancelButtonStyle}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {/* Portal for Match Breakdown Modal */}
      {mounted &&
        matchBreakdownModal &&
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
                <h3 style={modalTitleStyle}>Match Breakdown - {matchBreakdownModal?.name || "Advisor"}</h3>
                <button onClick={() => setMatchBreakdownModal(null)} style={modalCloseButtonStyle}>
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
                        matchBreakdownModal?.matchPercentage >= 80
                          ? "#388E3C"
                          : matchBreakdownModal?.matchPercentage >= 60
                            ? "#F57C00"
                            : "#D32F2F",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {matchBreakdownModal?.matchPercentage || 0}%
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
                  {matchBreakdownModal?.breakdown &&
                    Object.entries(matchBreakdownModal.breakdown).map(([key, criteria]) => {
                      if (!criteria || typeof criteria !== "object") {
                        return null
                      }

                      const scoreColor = criteria.matched ? "#388E3C" : "#D32F2F"

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
                              {formatLabel(key)}
                            </h4>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                color: scoreColor,
                                marginLeft: "0.5rem",
                              }}
                            >
                              {criteria.matched ? "✓ Match" : "✗ No Match"}
                            </span>
                          </div>

                          <div style={{ fontSize: "0.75rem", color: "#666", lineHeight: "1.4" }}>
                            <div style={{ marginBottom: "0.5rem" }}>
                              <strong>Your Need:</strong>{" "}
                              {Array.isArray(criteria.smeValue)
                                ? criteria.smeValue.join(", ")
                                : String(criteria.smeValue || "N/A")}
                            </div>
                            <div>
                              <strong>Advisor Offers:</strong>{" "}
                              {Array.isArray(criteria.advisorValue)
                                ? criteria.advisorValue.join(", ")
                                : String(criteria.advisorValue || "N/A")}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
              <div style={modalActionsStyle}>
                <button onClick={() => setMatchBreakdownModal(null)} style={cancelButtonStyle}>
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
                <h3 style={modalTitleStyle}>Filter Advisors</h3>
                <button onClick={() => setShowFilterModal(false)} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1.5rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#5D2A0A" }}>
                      Location
                    </label>
                    <MultiSelectDropdown
                      options={africanCountries}
                      selectedValues={selectedLocations}
                      onSelect={(value) => setSelectedLocations((prev) => [...prev, value])}
                      onRemove={(value) => setSelectedLocations((prev) => prev.filter((v) => v !== value))}
                      placeholder="Select locations..."
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#5D2A0A" }}>
                      Sector Focus
                    </label>
                    <MultiSelectDropdown
                      options={economicSectors}
                      selectedValues={selectedSectors}
                      onSelect={(value) => setSelectedSectors((prev) => [...prev, value])}
                      onRemove={(value) => setSelectedSectors((prev) => prev.filter((v) => v !== value))}
                      placeholder="Select sectors..."
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#5D2A0A" }}>
                      Funding Stage
                    </label>
                    <MultiSelectDropdown
                      options={operationStages}
                      selectedValues={selectedStages}
                      onSelect={(value) => setSelectedStages((prev) => [...prev, value])}
                      onRemove={(value) => setSelectedStages((prev) => prev.filter((v) => v !== value))}
                      placeholder="Select stages..."
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#5D2A0A" }}>
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid #E8D5C4",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                      }}
                    >
                      <option value="">All Statuses</option>
                      {uniqueStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#5D2A0A" }}>
                      Compensation Model
                    </label>
                    <select
                      value={compensationFilter}
                      onChange={(e) => setCompensationFilter(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid #E8D5C4",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                      }}
                    >
                      <option value="">All Models</option>
                      {uniqueCompensation.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#5D2A0A" }}>
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

const tableHeaderStyle = {
  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
  color: "#FEFCFA",
  padding: "0.75rem 0.4rem",
  textAlign: "left",
  fontWeight: "600",
  fontSize: "0.7rem",
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
  overflow: "hidden",
}

const availabilityBadgeStyle = {
  background: "#F5EBE0",
  color: "#5D2A0A",
  padding: "0.15rem 0.3rem",
  borderRadius: "4px",
  fontSize: "0.65rem",
  fontWeight: "500",
  whiteSpace: "nowrap",
}

const matchContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  width: "100%",
}

const progressBarStyle = {
  width: "60%",
  height: "6px",
  backgroundColor: "#E2E8F0",
  borderRadius: "3px",
  overflow: "hidden",
}

const progressFillStyle = {
  height: "100%",
  borderRadius: "3px",
  transition: "width 0.3s ease",
}

const matchScoreStyle = {
  fontWeight: "500",
  fontSize: "0.75rem",
}

const responseRateStyle = {
  fontWeight: "500",
  color: "#5D2A0A",
  fontSize: "0.7rem",
}

const statusBadgeStyle = {
  padding: "0.15rem 0.3rem",
  borderRadius: "4px",
  fontSize: "0.65rem",
  fontWeight: "500",
  display: "inline-block",
  whiteSpace: "nowrap",
}

const actionButtonsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.2rem",
  width: "100%",
}

const connectButtonStyle = {
  padding: "0.3rem 0.5rem",
  background: "#5D2A0A",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "0.65rem",
  cursor: "pointer",
  transition: "background 0.2s",
  whiteSpace: "nowrap",
}

const shortlistButtonStyle = {
  padding: "0.3rem 0.5rem",
  background: "#F5EBE0",
  color: "#5D2A0A",
  border: "1px solid #E8D5C4",
  borderRadius: "4px",
  fontSize: "0.65rem",
  cursor: "pointer",
  transition: "all 0.2s",
  whiteSpace: "nowrap",
}

const confirmedBadgeStyle = {
  background: "#48BB78",
  color: "white",
  padding: "0.3rem 0.5rem",
  borderRadius: "4px",
  fontSize: "0.65rem",
  fontWeight: "500",
  display: "flex",
  alignItems: "center",
  gap: "0.2rem",
  whiteSpace: "nowrap",
}

const contactedBadgeStyle = {
  background: "#F3E5F5",
  color: "#7B1FA2",
  padding: "0.3rem 0.5rem",
  borderRadius: "4px",
  fontSize: "0.65rem",
  fontWeight: "500",
  whiteSpace: "nowrap",
}

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1.5rem",
  borderBottom: "1px solid #E8D5C4",
  background: "#FEFCFA",
}

const modalTitleStyle = {
  margin: "0",
  fontSize: "1.25rem",
  fontWeight: "600",
  color: "#5D2A0A",
}

const modalCloseButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "1.25rem",
  cursor: "pointer",
  color: "#5D2A0A",
  padding: "0.25rem",
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
  fontSize: "1rem",
  fontWeight: "600",
  margin: "0 0 0.5rem 0",
  color: "#5D2A0A",
}

const summaryTextStyle = {
  margin: "0.25rem 0",
  fontSize: "0.875rem",
  color: "#5D2A0A",
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
}