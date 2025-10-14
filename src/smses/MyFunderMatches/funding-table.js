"use client"
import { useState, useEffect } from "react"
import { Eye, Check, Filter,X } from "lucide-react"
import { createPortal } from "react-dom"
import { db, storage } from "../../firebaseConfig"
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { DOCUMENT_PATHS } from "../../utils/documentUtils"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import get from "lodash.get"
import styles from "./funding.module.css";
const ADJACENT_INDUSTRIES = {
  ict: ["technology", "software", "digital services"],
  education: ["e-learning", "training", "edtech"],
  manufacturing: ["construction", "engineering", "industrial"],
  healthcare: ["medtech", "biotech", "pharmaceuticals"],
}

const stageMap = {
  "pre-seed": "early_pre_seed",
  seed: "early_seed",
  "series a": "venture_series_a",
  "series b": "venture_series_b",
  "series c": "venture_series_c",
  growth: "late_growth_pe",
  pe: "late_growth_pe",
  mbo: "late_mbo",
  mbi: "late_mbi",
  lbo: "late_lbo",
}

const normalizeStage = (raw) => {
  const clean = raw?.toString().toLowerCase().replace(/\s+/g, " ")
  return stageMap[clean] || normalizeText(raw) // fallback
}

const FUNDING_STAGES = ["Pre-Seed", "Seed", "Series A", "Series B", "Growth"]

const formatWaitingTime = (value) => {
  if (!value) return "Not specified"

  return value
    .replace(/([0-9]+)\s*weeks?/i, "$1 weeks")
    .replace(/([0-9]+)\s*days?/i, "$1 days")
    .replace(/([0-9]+)\s*month/i, "$1 month")
    .replace(/([0-9]+)-([0-9]+)\s*days?/i, "$1–$2 days")
    .replace(/([0-9]+)-([0-9]+)\s*weeks?/i, "$1–$2 weeks")
    .replace(/([0-9]+)\s*-+\s*([0-9]+)\s*(days?|weeks?|months?)/i, "$1–$2 $3")
    .replace(/([0-9]+)(days?|weeks?|months?)/i, "$1 $2")
    .trim()
}

// Pipeline stage definitions with colors and next stages
const PIPELINE_STAGES = {
  MATCH: {
    label: "Match",
    color: "#F5EBE0", // Light cream/beige brown
    next: "Application Sent",
  },
  APPLICATION_SENT: {
    label: "Application Sent",
    color: "#FFE0B2", // light orange
    next: "Application Received",
  },
  APPLICATION_RECEIVED: {
    label: "Application Received",
    color: "#E8D5C4",
    next: "Under Review",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "#FFE0B2",
    next: "Funding Approved",
  },
  FUNDING_APPROVED: {
    label: "Funding Approved",
    color: "#C8E6C9", // Light green
    next: "Termsheet",
  },
  TERM_SHEET: {
    label: "Termsheet",
    color: "#A5D6A7", // Medium green
    next: "Deal Complete",
  },
  DEAL_COMPLETE: {
    label: "Deal Complete",
    color: "#81C784", // Green
    next: "Closed",
  },
  DEAL_CLOSED: {
    label: "Closed",
    color: "#4CAF50", // Dark green
    next: "Closed", // Terminal state
  },
  DEAL_DECLINED: {
    label: "Deal Declined",
    color: "#FFCDD2", // Light red
    next: "Closed",
  },
  DECLINED: {
    label: "Declined",
    color: "#FFCDD2", // Light red
    next: "Closed",
  },
}

// Simplified statuses
const APPLICATION_STATUSES = {
  NO_APPLICATION: {
    label: "Application not sent",
    color: "#E0E0E0", // Light gray
  },
  PENDING: {
    label: "Pending",
    color: "#FFE082", // Amber
  },
  ACCEPTED: {
    label: "Accepted",
    color: "#81C784", // Green
  },
  DECLINED: {
    label: "Declined",
    color: "#E57373", // Red
  },
}

const TruncatedText = ({ text, maxLength = 20, maxLines = 1, hideSeeModeForAmounts = false }) => {
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
      {shouldTruncate && !hideSeeModeForAmounts && (
        <div>
          <button
            style={{
              background: "none",
              border: "none",
              color: "#a67c52",
              cursor: "pointer",
              fontSize: "0.75rem",
              textDecoration: "underline",
              padding: "0",
              display: "block",
            }}
            onClick={toggleExpanded}
          >
            {isExpanded ? "Less" : "See more"}
          </button>
        </div>
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

const formatDocumentLabel = (label) => {
  if (!label) return ""
  return label
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

const formatSectorLabel = (value) => {
  if (!value) return ""

  return value
    .toString()
    .split(",")
    .map((item) => item.trim())
    .map((sector) => {
      // Replace underscores with spaces and capitalize each word
      return sector
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    })
    .join(", ")
}

const formatTicketSize = (min, max) => {
  const cleanAmount = (value) => {
    if (!value) return 0
    if (typeof value === "number") return value

    // Handle string values - remove currency symbols, commas, and non-numeric chars
    const cleanValue = value
      .toString()
      .replace(/[R$,\s]/g, "") // Remove R, $, commas, spaces
      .replace(/[^\d.]/g, "") // Keep only digits and decimal points

    return Number.parseFloat(cleanValue) || 0
  }

  const minAmount = cleanAmount(min)
  const maxAmount = cleanAmount(max)

  if (minAmount > 0 && maxAmount > 0) {
    if (minAmount === maxAmount) {
      return `R${minAmount.toLocaleString("en-ZA")}`
    }
    return `R${minAmount.toLocaleString("en-ZA")} - R${maxAmount.toLocaleString("en-ZA")}`
  }

  if (minAmount > 0) return `From R${minAmount.toLocaleString("en-ZA")}`
  if (maxAmount > 0) return `Up to R${maxAmount.toLocaleString("en-ZA")}`

  return "Not specified"
}

const formatLocation = (locations) => {
  if (!locations || !Array.isArray(locations)) return "Global"

  // Handle case where string was split into characters
  if (locations.length > 0 && typeof locations[0] === "string" && locations[0].length === 1) {
    const joined = locations.join("")
    if (joined.includes(",")) {
      return joined
        .split(",")
        .map((l) => formatSingleLocation(l.trim()))
        .join(", ")
    }
    return formatSingleLocation(joined)
  }

  return locations.map(formatSingleLocation).join(", ") || "Global"
}

const formatSingleLocation = (loc) => {
  const locationMap = {
    country_specific: "Country Specific",
    regional_emea: "EMEA",
    regional_apac: "APAC",
    regional_na: "North America",
    south_africa: "South Africa",
    global: "Global",
  }

  return (
    locationMap[loc.toLowerCase()] ||
    loc
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  )
}

const formatSupport = (support) => {
  if (!support) return "Not specified"

  // Handle case where it's an array with "none"
  if (Array.isArray(support) && support.includes("none")) return "None"

  const supportMap = {
    mentorship: "Mentorship",
    network_access: "Network Access",
    technical_assistance: "Technical Assistance",
  }

  if (Array.isArray(support)) {
    const formatted = support
      .map((s) => supportMap[s.toLowerCase()] || s)
      .filter((s) => s && s.toLowerCase() !== "none")
    return formatted.length > 0 ? formatted.join(", ") : "None"
  }

  if (typeof support === "string") {
    if (support.includes(",")) {
      return support
        .split(",")
        .map((s) => supportMap[s.trim().toLowerCase()] || s.trim())
        .join(", ")
    }
    return supportMap[support.toLowerCase()] || support
  }

  return "Not specified"
}

const formatSectors = (sectors) => {
  if (!sectors || !Array.isArray(sectors)) return "Generalist"

  // Handle case where string was split into characters
  if (sectors.length > 0 && typeof sectors[0] === "string" && sectors[0].length === 1) {
    const joined = sectors.join("")
    if (joined.includes(",")) {
      return joined
        .split(",")
        .map((s) => formatSingleSector(s.trim()))
        .join(", ")
    }
    return formatSingleSector(joined)
  }

  return sectors.map(formatSingleSector).join(", ") || "Generalist"
}

const formatSingleSector = (sector) => {
  return sector
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const formatInvestmentStage = (stage) => {
  const stageMap = {
    early_pre_seed: "Pre-Seed",
    early_seed: "Seed",
    venture_series_a: "Series A",
    venture_series_b: "Series B",
    late_growth_pe: "Growth",
  }

  if (Array.isArray(stage)) {
    return stage.map((s) => stageMap[s.toLowerCase()] || s).join(", ")
  }

  if (typeof stage === "string") {
    if (stage.includes(",")) {
      return stage
        .split(",")
        .map((s) => stageMap[s.trim().toLowerCase()] || s.trim())
        .join(", ")
    }
    return stageMap[stage.toLowerCase()] || stage
  }

  return "Various"
}

const capitalize = (str) => str?.charAt(0).toUpperCase() + str?.slice(1).toLowerCase()

const getStatusColor = (status) => {
  const statusKey = Object.keys(APPLICATION_STATUSES).find(
    (key) => APPLICATION_STATUSES[key].label.toLowerCase() === status?.toLowerCase(),
  )
  return statusKey ? APPLICATION_STATUSES[statusKey].color : "#E0E0E0"
}

const SECTOR_SYNONYMS = {
  general: "generalist",
  generalist: "generalist",
  agri: "agriculture",
  agriculture: "agriculture",
  farming: "agriculture",
  auto: "automotive",
  automotive: "automotive",
  cars: "automotive",
  vehicles: "automotive",
  banking: "banking_finance_insurance",
  finance: "banking_finance_insurance",
  insurance: "banking_finance_insurance",
  financial_services: "banking_finance_insurance",
  banking_finance_insurance: "banking_finance_insurance",
  beauty: "beauty_cosmetics_personal_care",
  cosmetics: "beauty_cosmetics_personal_care",
  personal_care: "beauty_cosmetics_personal_care",
  beauty_cosmetics_personal_care: "beauty_cosmetics_personal_care",
  construction: "construction",
  building: "construction",
  civil_engineering: "construction",
  consulting: "consulting",
  business_services: "consulting",
  arts: "creative_arts_design",
  design: "creative_arts_design",
  creative: "creative_arts_design",
  creative_arts_design: "creative_arts_design",
  customer_service: "customer_service",
  support: "customer_service",
  education: "education_training",
  training: "education_training",
  teaching: "education_training",
  education_training: "education_training",
  engineering: "engineering",
  environment: "environmental_natural_sciences",
  natural_sciences: "environmental_natural_sciences",
  environmental_natural_sciences: "environmental_natural_sciences",
  government: "government_public_sector",
  public_sector: "government_public_sector",
  government_public_sector: "government_public_sector",
  healthcare: "healthcare_medical",
  medical: "healthcare_medical",
  health: "healthcare_medical",
  healthcare_medical: "healthcare_medical",
  tourism: "hospitality_tourism",
  hospitality: "hospitality_tourism",
  hospitality_tourism: "hospitality_tourism",
  hr: "human_resources",
  human_resources: "human_resources",
  it: "information_technology",
  tech: "information_technology",
  ict: "information_technology",
  information_technology: "information_technology",
  infrastructure: "infrastructure",
  law: "legal_law",
  legal: "legal_law",
  legal_law: "legal_law",
  logistics: "logistics_supply_chain",
  supply_chain: "logistics_supply_chain",
  logistics_supply_chain: "logistics_supply_chain",
  manufacturing: "manufacturing",
  production: "manufacturing",
  marketing: "marketing_advertising_pr",
  advertising: "marketing_advertising_pr",
  pr: "marketing_advertising_pr",
  marketing_advertising_pr: "marketing_advertising_pr",
  media: "media_journalism_broadcasting",
  journalism: "media_journalism_broadcasting",
  broadcasting: "media_journalism_broadcasting",
  media_journalism_broadcasting: "media_journalism_broadcasting",
  mining: "mining",
  energy: "energy",
  renewable_energy: "energy",
  oil: "oil_gas",
  gas: "oil_gas",
  oil_and_gas: "oil_gas",
  oil_gas: "oil_gas",
  non_profit: "non_profit_ngo",
  ngo: "non_profit_ngo",
  non_profit_ngo: "non_profit_ngo",
  property: "property_real_estate",
  real_estate: "property_real_estate",
  property_real_estate: "property_real_estate",
  retail: "retail_wholesale",
  wholesale: "retail_wholesale",
  retail_wholesale: "retail_wholesale",
  safety: "safety_security_police_defence",
  security: "safety_security_police_defence",
  police: "safety_security_police_defence",
  defence: "safety_security_police_defence",
  safety_security_police_defence: "safety_security_police_defence",
  sales: "sales",
  science: "science_research",
  research: "science_research",
  science_research: "science_research",
  social_services: "social_services_social_work",
  social_work: "social_services_social_work",
  social_services_social_work: "social_services_social_work",
  sports: "sports_recreation_fitness",
  recreation: "sports_recreation_fitness",
  fitness: "sports_recreation_fitness",
  sports_recreation_fitness: "sports_recreation_fitness",
  telecom: "telecommunications",
  telecommunications: "telecommunications",
  transport: "transport",
  transportation: "transport",
  utilities: "utilities",
  water: "utilities",
  electricity: "utilities",
  waste: "utilities",
}

const expandSectorsWithSynonyms = (sectors) => {
  const expanded = new Set()

  sectors.forEach((sector) => {
    if (!sector) return // skip empty/null

    expanded.add(sector)

    const synonyms = Array.isArray(SECTOR_SYNONYMS[sector]) ? SECTOR_SYNONYMS[sector] : []

    synonyms.forEach((syn) => expanded.add(syn))
  })

  return Array.from(expanded)
}

const STAGE_NORMALIZATION_MAP = {
  preseed: "early_pre_seed",
  seed: "early_seed",
  seriesa: "venture_series_a",
  seriesb: "venture_series_b",
  seriesc: "venture_series_c",
  growth: "late_growth_pe",
  mbo: "late_mbo",
  mbi: "late_mbi",
  lbo: "late_lbo",
}

const normalizeSector = (value) => {
  if (!value) return ""
  const key = value.toLowerCase().replace(/[\s-]/g, "_").trim()
  return SECTOR_SYNONYMS[key] || key
}

const normalizeText = (str) => {
  return str?.toString().toLowerCase().trim().replace(/\s+/g, "_")
}

const getStageColor = (stage) => {
  const stageKey = Object.keys(PIPELINE_STAGES).find(
    (key) => PIPELINE_STAGES[key].label.toLowerCase() === stage?.toLowerCase(),
  )
  return stageKey ? PIPELINE_STAGES[stageKey].color : "#E0E0E0"
}

const getNextStage = (currentStage) => {
  const entry = Object.values(PIPELINE_STAGES).find((s) => s.label.toLowerCase() === currentStage?.toLowerCase())
  return entry?.next || "Pending"
}

export const FundingTable = ({ filters = {}, onInsightsData, onPrimaryMatchCount, onDealComplete }) => {
  const [funders, setFunders] = useState([])
  const [allFunders, setAllFunders] = useState([])
  const [filteredFunders, setFilteredFunders] = useState([])
  const [currentBusiness, setCurrentBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statuses, setStatuses] = useState({})
  const [pipelineStages, setPipelineStages] = useState({})
  const [applicationDates, setApplicationDates] = useState({})
  const [waitingTimes, setWaitingTimes] = useState({})
  const [modalFunder, setModalFunder] = useState(null)
  const [applyingFunder, setApplyingFunder] = useState(null)
  const [notification, setNotification] = useState(null)
  const [submittedDocuments, setSubmittedDocuments] = useState([])
  const [selectedDocs, setSelectedDocs] = useState([])
  const [profileData, setProfileData] = useState({})
  const [insightsData, setInsightsData] = useState({})
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [scoreBreakdowns, setScoreBreakdowns] = useState({})
  const [showBreakdownModal, setShowBreakdownModal] = useState(false)
  const [existingApplications, setExistingApplications] = useState({})

  const [currentBreakdown, setCurrentBreakdown] = useState(null)
  // Filter states

  const [tableFilters, setTableFilters] = useState({
    funderName: "",
    location: "",
    sector: "",
    fundingStage: "",
    fundingType: "",
    minTicket: "",
    maxTicket: "",
    minMatch: 0,
    maxMatch: 100,
    currentStage: "",
    supportOffered: "",
  })

  // Add this useEffect to listen for application status changes
  // Add this useEffect after your existing useEffects, around line 500-600
  useEffect(() => {
    const updatePipelineStagesFromApplications = async () => {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user || allFunders.length === 0) return

      try {
        const applicationsQuery = query(collection(db, "smeApplications"), where("smeId", "==", user.uid))

        const applicationsSnapshot = await getDocs(applicationsQuery)

        const applicationStatusMap = {}
        const applicationPipelineMap = {}
        const applicationDateMap = {}
        const applicationWaitingTimeMap = {}

        applicationsSnapshot.forEach((doc) => {
          const data = doc.data()
          // Use consistent key format: funderId_fundName
          const fundKey = `${data.funderId}_${data.fundName}`

          applicationStatusMap[fundKey] = data.status || "Pending"
          applicationPipelineMap[fundKey] = data.pipelineStage || "Application Sent"
          applicationDateMap[fundKey] = data.applicationDate || new Date().toISOString().split("T")[0]
          applicationWaitingTimeMap[fundKey] = data.waitingTime || "3-5 days"
        })

        // Update state with application data
        setStatuses(applicationStatusMap)
        setPipelineStages(applicationPipelineMap)
        setApplicationDates(applicationDateMap)
        setWaitingTimes(applicationWaitingTimeMap)

        // Update funders with hasApplication status and current pipeline stage
        setAllFunders((prevFunders) =>
          prevFunders.map((funder) => {
            // Use consistent key format here too
            const fundKey = `${funder.funderId}_${funder.name}`
            const hasApplication = !!applicationStatusMap[fundKey]
            const currentPipelineStage = applicationPipelineMap[fundKey] || "Match"

            return {
              ...funder,
              hasApplication,
              pipelineStage: currentPipelineStage,
            }
          }),
        )

        // Also update filteredFunders if they exist
        setFilteredFunders((prevFiltered) =>
          prevFiltered.map((funder) => {
            const fundKey = `${funder.funderId}_${funder.name}`
            const hasApplication = !!applicationStatusMap[fundKey]
            const currentPipelineStage = applicationPipelineMap[fundKey] || "Match"

            return {
              ...funder,
              hasApplication,
              pipelineStage: currentPipelineStage,
            }
          }),
        )
      } catch (error) {
        console.error("Error updating pipeline stages from applications:", error)
      }
    }

    if (allFunders.length > 0) {
      updatePipelineStagesFromApplications()
    }
  }, [allFunders.length]) // Only depend on length to avoid infinite loops

  const getRequiredDocs = (funder) => {
    if (!funder.fullProfile?.productsServices?.funds) return []

    const matchedFund = funder.fullProfile.productsServices.funds.find(
      (f) => f.name?.toLowerCase().trim() === funder.name?.toLowerCase().trim(),
    )

    return matchedFund?.requiredDocuments || []
  }

  // Apply table filters
  useEffect(() => {
    const filtered = allFunders.filter((funder) => {
      return (
        (!tableFilters.funderName || funder.name?.toLowerCase().includes(tableFilters.funderName.toLowerCase())) &&
        (!tableFilters.location ||
          funder.geographicFocus?.toLowerCase().includes(tableFilters.location.toLowerCase())) &&
        (!tableFilters.sector || funder.sectorFocus?.toLowerCase().includes(tableFilters.sector.toLowerCase())) &&
        (!tableFilters.fundingStage ||
          funder.targetStage?.toLowerCase().includes(tableFilters.fundingStage.toLowerCase())) &&
        (!tableFilters.fundingType ||
          funder.investmentType?.toLowerCase().includes(tableFilters.fundingType.toLowerCase())) &&
        (!tableFilters.minTicket ||
          (funder.minInvestment && funder.minInvestment >= Number.parseInt(tableFilters.minTicket))) &&
        (!tableFilters.maxTicket ||
          (funder.maxInvestment && funder.maxInvestment <= Number.parseInt(tableFilters.maxTicket))) &&
        funder.matchPercentage >= tableFilters.minMatch &&
        funder.matchPercentage <= tableFilters.maxMatch &&
        (!tableFilters.currentStage ||
          funder.pipelineStage?.toLowerCase().includes(tableFilters.currentStage.toLowerCase())) &&
        (!tableFilters.supportOffered ||
          funder.supportOffered?.toLowerCase().includes(tableFilters.supportOffered.toLowerCase()))
      )
    })
    setFilteredFunders(filtered)
  }, [tableFilters, allFunders])

  const handleFilterChange = (key, value) => {
    setTableFilters((prev) => ({ ...prev, [key]: value }))
  }

  const deriveNextStage = (currentStage) => {
    if (!currentStage) return "Application Sent"

    const normalizedStage = currentStage.trim()

    switch (normalizedStage) {
      case "Match":
        return "Application Sent"
      case "Application Sent":
        return "Application Received"
      case "Application Received":
        return "Under Review"
      case "Under Review":
        return "Funding Approved"
      case "Funding Approved":
        return "Termsheet"
      case "Termsheet":
        return "Deal Complete"
      case "Deal Complete":
        return "Closed"
      case "Deal Declined":
      case "Declined":
        return "Closed"
      case "Closed":
        return "Closed" // Terminal state
      default:
        return "Pending"
    }
  }

  // Updated getNextStage function to replace the existing one
  const getNextStage = (currentStage) => {
    if (!currentStage) return "Send Application"

    // Handle the case where user hasn't applied yet
    if (currentStage === "Match") {
      return "Send Application"
    }

    // Find the stage object
    const stageEntry = Object.values(PIPELINE_STAGES).find(
      (stage) => stage.label.toLowerCase() === currentStage.toLowerCase(),
    )

    if (!stageEntry) {
      // Fallback to deriveNextStage for stages not in PIPELINE_STAGES
      return deriveNextStage(currentStage)
    }

    // Handle terminal stages
    if (["Closed", "Deal Declined", "Declined"].includes(stageEntry.label)) {
      return stageEntry.label // No next stage for terminal states
    }

    return stageEntry.next || deriveNextStage(currentStage)
  }

  // Additional helper function to check if a stage is terminal
  const isTerminalStage = (stage) => {
    return ["Closed", "Deal Declined", "Declined"].includes(stage)
  }

  // Helper function to get stage progression path
  const getStageProgressionPath = (currentStage) => {
    const path = []
    let stage = currentStage

    while (stage && !isTerminalStage(stage) && path.length < 10) {
      // Prevent infinite loops
      path.push(stage)
      stage = deriveNextStage(stage)

      // Break if we reach a stage we've already seen
      if (path.includes(stage)) break
    }

    if (stage && isTerminalStage(stage)) {
      path.push(stage)
    }

    return path
  }

  // Updated stage color function
  const getStageColor = (stage) => {
    if (!stage) return "#E0E0E0"

    const stageKey = Object.keys(PIPELINE_STAGES).find(
      (key) => PIPELINE_STAGES[key].label.toLowerCase() === stage.toLowerCase(),
    )

    if (stageKey) {
      return PIPELINE_STAGES[stageKey].color
    }

    // Fallback colors for stages not in PIPELINE_STAGES
    const fallbackColors = {
      pending: "#FFE082", // Amber
      "funding approved": "#C8E6C9", // Light green
      "deal complete": "#81C784", // Green
      closed: "#4CAF50", // Dark green
    }

    return fallbackColors[stage.toLowerCase()] || "#E0E0E0"
  }
  const clearFilters = () => {
    setTableFilters({
      funderName: "",
      location: "",
      sector: "",
      fundingStage: "",
      fundingType: "",
      minTicket: "",
      maxTicket: "",
      minMatch: 0,
      maxMatch: 100,
      currentStage: "",
      supportOffered: "",
    })
  }

  const getActiveFilterCount = () => {
    return Object.values(tableFilters).filter((value) => value !== "" && value !== 0 && value !== 100).length
  }

  // Modify the handleApplyClick function to check for existing applications
  useEffect(() => {
    const checkExistingApplications = async () => {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) return

      try {
        // Query both collections for existing applications
        const [smeAppsSnapshot, investorAppsSnapshot] = await Promise.all([
          getDocs(query(collection(db, "smeApplications"), where("smeId", "==", user.uid))),
          getDocs(query(collection(db, "investorApplications"), where("smeId", "==", user.uid))),
        ])

        const existingApps = {}
        const appStatusMap = {}
        const pipelineStageMap = {}
        const applicationDateMap = {}
        const waitingTimeMap = {}

        // Process smeApplications - this is our source of truth for pipeline stages
        smeAppsSnapshot.forEach((doc) => {
          const data = doc.data()
          const key = `${data.funderId}_${data.fundName}`
          existingApps[key] = true
          appStatusMap[key] = data.status || "Pending"
          pipelineStageMap[key] = data.pipelineStage || "Application Sent"
          applicationDateMap[key] = data.applicationDate || new Date().toISOString().split("T")[0]
          waitingTimeMap[key] = data.waitingTime || "3-5 days"
        })

        // Process investorApplications - just for existence check
        investorAppsSnapshot.forEach((doc) => {
          const data = doc.data()
          const key = `${data.funderId}_${data.fundName}`
          existingApps[key] = true
        })

        setExistingApplications(existingApps)
        setStatuses(appStatusMap)
        setPipelineStages(pipelineStageMap)
        setApplicationDates(applicationDateMap)
        setWaitingTimes(waitingTimeMap)

        // Update funders with the latest pipeline stages
        setAllFunders((prevFunders) =>
          prevFunders.map((funder) => {
            const key = `${funder.funderId}_${funder.name}`
            return {
              ...funder,
              hasApplication: !!existingApps[key],
              pipelineStage: pipelineStageMap[key] || "Match",
            }
          }),
        )

        setFilteredFunders((prevFunders) =>
          prevFunders.map((funder) => {
            const key = `${funder.funderId}_${funder.name}`
            return {
              ...funder,
              hasApplication: !!existingApps[key],
              pipelineStage: pipelineStageMap[key] || "Match",
            }
          }),
        )
      } catch (error) {
        console.error("Error checking existing applications:", error)
      }
    }

    checkExistingApplications()
  }, [])
  useEffect(() => {
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) return

    const unsubscribe = onSnapshot(
      query(collection(db, "smeApplications"), where("smeId", "==", user.uid)),
      (snapshot) => {
        const updatedPipelineStages = {}
        const updatedStatuses = {}
        const updatedDates = {}
        const updatedWaitingTimes = {}

        snapshot.forEach((doc) => {
          const data = doc.data()
          const key = `${data.funderId}_${data.fundName}`
          updatedPipelineStages[key] = data.pipelineStage || "Application Sent"
          updatedStatuses[key] = data.status || "Pending"
          updatedDates[key] = data.applicationDate || new Date().toISOString().split("T")[0]
          updatedWaitingTimes[key] = data.waitingTime || "3-5 days"
        })

        setPipelineStages((prev) => ({ ...prev, ...updatedPipelineStages }))
        setStatuses((prev) => ({ ...prev, ...updatedStatuses }))
        setApplicationDates((prev) => ({ ...prev, ...updatedDates }))
        setWaitingTimes((prev) => ({ ...prev, ...updatedWaitingTimes }))

        // Update funders with the latest pipeline stages
        setAllFunders((prevFunders) =>
          prevFunders.map((funder) => {
            const key = `${funder.funderId}_${funder.name}`
            return {
              ...funder,
              pipelineStage: updatedPipelineStages[key] || funder.pipelineStage || "Match",
            }
          }),
        )

        setFilteredFunders((prevFunders) =>
          prevFunders.map((funder) => {
            const key = `${funder.funderId}_${funder.name}`
            return {
              ...funder,
              pipelineStage: updatedPipelineStages[key] || funder.pipelineStage || "Match",
            }
          }),
        )
      },
      (error) => {
        console.error("Error listening to application updates:", error)
      },
    )

    return () => unsubscribe()
  }, [])
  // Modify the handleApplyClick function to check for existing applications
  const handleApplyClick = async (funder) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      // Check if application already exists in either collection
      const applicationKey = `${funder.funderId}_${funder.name}`;
      if (existingApplications[applicationKey]) {
        setNotification({ 
          type: "warning", 
          message: "You've already submitted an application to this funder." 
        });
        return;
      }

      const [funderSnap, profileSnap] = await Promise.all([
        getDoc(doc(db, "MyuniversalProfiles", funder.funderId)),
        getDoc(doc(db, "universalProfiles", user.uid))
      ]);

      if (!funderSnap.exists() || !profileSnap.exists()) {
        throw new Error("Missing funder or profile data");
      }

      const funderData = funderSnap.data();
      const profile = profileSnap.data();
      const coreDocs = funderData.formData?.applicationBrief?.coreDocuments || [];
      const docUploadMap = profile.documentUpload || {};
      const submitted = [];

      const normalize = (str) =>
        str?.toLowerCase().replace(/[\s_-]/g, "").trim();

      coreDocs.forEach((docLabel) => {
        const normalizedLabel = normalize(docLabel);
        const isSubmitted = Object.entries(docUploadMap).some(([key, urls]) => {
          return normalize(key) === normalizedLabel && Array.isArray(urls) && urls.length > 0 && urls.some(url => typeof url === 'string' && url.startsWith('http'));
        });

        if (isSubmitted) submitted.push(docLabel);
      });

      setProfileData(profile);
      setSubmittedDocuments(submitted);
      setSelectedDocs([]);
      setApplyingFunder({
        ...funder,
        fullProfile: funderData.formData,
        requiredDocuments: coreDocs
      });
    } catch (err) {
      console.error("Error in handleApplyClick:", err);
      setNotification({ type: "error", message: "Failed to load application requirements." });
    }
  };


  const handleUpload = async (docLabel, file) => {
    const auth = getAuth()
    const user = auth.currentUser
    if (!user || !file) return

    try {
      setNotification({ type: "info", message: `Uploading ${docLabel}...` })

      const storageRef = ref(storage, `documents/${user.uid}/${docLabel}.pdf`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      const profileRef = doc(db, "universalProfiles", user.uid)
      const path = DOCUMENT_PATHS[docLabel]
      const timestampField = `${path}UpdatedAt`

      await updateDoc(profileRef, {
        [path]: [downloadURL], // Store as array
        [timestampField]: serverTimestamp(),
      })

      setSubmittedDocuments((prev) => [...new Set([...prev, docLabel])])
      setNotification({ type: "success", message: `${formatDocumentLabel(docLabel)} uploaded successfully!` })
    } catch (error) {
      console.error("Upload failed:", error)
      setNotification({ type: "error", message: "Upload failed. Please try again." })
    }
  }

  const toggleDocumentSelection = (docLabel) => {
    setSelectedDocs((prev) => (prev.includes(docLabel) ? prev.filter((d) => d !== docLabel) : [...prev, docLabel]))
  }

  const isAllDocumentsSubmitted = () => {
    return selectedDocs.every((doc) => submittedDocuments.includes(doc))
  }

  const submitApplication = async (funder) => {
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user || !currentBusiness) throw new Error("Missing user or business")

      // Double-check if application already exists
      const existingAppQuery = query(
        collection(db, "smeApplications"),
        where("smeId", "==", user.uid),
        where("funderId", "==", funder.funderId),
        where("fundName", "==", funder.name),
      )

      const existingAppSnapshot = await getDocs(existingAppQuery)
      if (!existingAppSnapshot.empty) {
        setNotification({
          type: "warning",
          message: "Application already submitted to this funder.",
        })
        return
      }

      const applicationDate = new Date().toISOString().split("T")[0]

      // Construct the shared metadata
      const baseApplicationData = {
        smeId: user.uid,
        funderId: funder.funderId,
        fundName: funder.name,
        smeName: currentBusiness.registeredName || "Unnamed Business",
        investmentType: funder.investmentType,
        entityType: currentBusiness.useOfFunds?.entityType || "Not specified",
        supportFormat: currentBusiness.applicationOverview?.supportFormat || "Not specified",
        matchPercentage: funder.matchPercentage,
        location: currentBusiness.location || "Not specified",
        stage: currentBusiness.operationStage || "Not specified",
        sector: currentBusiness.economicSectors?.join(", ") || "Not specified",
        fundingNeeded: currentBusiness.useOfFunds?.amountRequested || "Not specified",
        applicationDate,
        pipelineStage: "Application Sent",
        teamSize: currentBusiness.teamSize || "Not specified",
        revenue: currentBusiness.financials?.annualRevenue || "Not specified",
        focusArea: currentBusiness.businessDescription || "Not specified",
        documents: selectedDocs,
        createdAt: new Date().toISOString(),
        waitingTime: "unspecified",
      }

      // Gather document URLs for the investor
      const documentURLs = {}
      selectedDocs.forEach((docLabel) => {
        const path = DOCUMENT_PATHS[docLabel]
        const url = get(profileData, path)?.[0]
        if (url) {
          documentURLs[docLabel] = url
        }
      })

      // Separate application records for investor and SME
      const investorApplicationData = {
        ...baseApplicationData,
        documentURLs,
        fundType: funder.investmentType,
        fundTicketSize: formatTicketSize(funder.minInvestment, funder.maxInvestment),
        fundFocusSectors: formatSectorLabel(funder.sectorFocus),
        fundStagePreferences: formatInvestmentStage(funder.targetStage),
      }

      const smeApplicationData = {
        ...baseApplicationData,
        funderSupportOffered: funder.supportOffered || "Not specified",
        funderDecisionCriteria: funder.fullProfile?.applicationBrief?.evaluationCriteria || "Not specified",
        fundTicketSize: formatTicketSize(funder.minInvestment, funder.maxInvestment),
      }

      // Write both documents
      await Promise.all([
        addDoc(collection(db, "investorApplications"), investorApplicationData),
        addDoc(collection(db, "smeApplications"), smeApplicationData),
      ])

      // Update UI state
      setStatuses((prev) => ({ ...prev, [funder.id]: "Pending" }))
      setPipelineStages((prev) => ({ ...prev, [funder.id]: "Application Sent" }))
      setApplicationDates((prev) => ({ ...prev, [funder.id]: applicationDate }))
      setWaitingTimes((prev) => ({ ...prev, [funder.id]: "3-5 days" }))

      // Trigger notification with more robust event dispatch
      const dispatchNotification = () => {
        const notificationMessage = `Application to ${funder.name} submitted successfully`
        console.log("Dispatching notification:", notificationMessage) // Debug log

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

        // Dispatch with a small delay to ensure proper propagation
        setTimeout(() => {
          window.dispatchEvent(event)
          console.log("Notification event dispatched") // Debug log
        }, 100)
      }

      dispatchNotification()

      setStatuses((prev) => ({ ...prev, [funder.id]: "Pending" }))
      setPipelineStages((prev) => ({ ...prev, [funder.id]: "Application Sent" }))
      setApplicationDates((prev) => ({ ...prev, [funder.id]: applicationDate }))
      setWaitingTimes((prev) => ({ ...prev, [funder.id]: "3-5 days" }))

      // Update the funders list
      setAllFunders((prevFunders) => prevFunders.map((f) => (f.id === funder.id ? { ...f, hasApplication: true } : f)))

      setNotification({ type: "success", message: "Application submitted!" })
      setApplyingFunder(null)
    } catch (err) {
      console.error("Application submission error:", err)

      // Dispatch error notification
      const errorEvent = new CustomEvent("newNotification", {
        detail: {
          message: `Failed to submit application: ${err.message}`,
          type: "error",
          timestamp: new Date().toISOString(),
        },
      })
      window.dispatchEvent(errorEvent)

      setNotification({ type: "error", message: err.message })
    }
  }
  useEffect(() => {
    if (!filters) return
    const fetchData = async () => {
      try {
        const auth = getAuth()
        const user = auth.currentUser
        if (!user) throw new Error("User not authenticated")

        const businessSnap = await getDoc(doc(db, "universalProfiles", user.uid))
        if (!businessSnap.exists()) throw new Error("Business profile not found")

        const rawBusinessData = businessSnap.data()
        const businessData = normalizeSMEProfile(rawBusinessData)
        setCurrentBusiness(businessData)

        const [investorsSnapshot, appSnapshot] = await Promise.all([
          getDocs(collection(db, "MyuniversalProfiles")),
          getDocs(query(collection(db, "smeApplications"), where("smeId", "==", user.uid))),
        ])

        const totalInvestorCount = investorsSnapshot.size
        const matchedFunds = []

        const applicationsMap = {}
        const appStatusMap = {}
        const pipelineStageMap = {}
        const applicationDateMap = {}
        let currentStage = ""
        let pkey = ""
        appSnapshot.forEach((doc) => {
          const data = doc.data()
          const key = `${data.funderId}_${data.fundName}`
          applicationsMap[key] = true
          pipelineStageMap[key] = data.pipelineStage || "Application Sent"
          pkey = `${data.funderId}_${data.fundName}`
          appStatusMap[key] = data.status || "Pending"
          currentStage = data.pipelineStage || "Application Sent"
          applicationDateMap[key] = data.applicationDate || new Date().toISOString().split("T")[0]
        })

        console.log(pipelineStageMap[pkey])
        investorsSnapshot.forEach((docSnap) => {
          const investor = docSnap.data()
          const generalPrefs = investor.formData?.generalInvestmentPreference || {}
          const funds = investor.formData?.fundDetails?.funds || []
          const entityOverview = investor.formData?.entityOverview || {}
          const contact = investor.formData?.contactDetails || {}

          funds.forEach((fund, index) => {
            const fundProfile = investor.formData?.fundDetails?.funds?.[index]
            const estimatedReviewTime = investor.formData?.applicationBrief?.equityDocuments?.estimatedReviewTime || "-"

            let minTicket =
              fundProfile?.minimumTicket ||
              fundProfile?.minTicket ||
              fund.minimumTicket ||
              fund.minTicket ||
              investor.formData?.fundDetails?.minimumTicket

            let maxTicket =
              fundProfile?.maximumTicket ||
              fundProfile?.maxTicket ||
              fund.maximumTicket ||
              fund.maxTicket ||
              investor.formData?.fundDetails?.maximumTicket

            if (!minTicket || !maxTicket) {
              const ticketInfo = fundProfile?.ticketSize || fund.ticketSize || {}
              minTicket = minTicket || ticketInfo.min || ticketInfo.minimum
              maxTicket = maxTicket || ticketInfo.max || ticketInfo.maximum
            }

            const instruments = generalPrefs.investmentFocusSubtype
              ? Array.isArray(generalPrefs.investmentFocusSubtype)
                ? generalPrefs.investmentFocusSubtype
                : [generalPrefs.investmentFocusSubtype]
              : []

            const enrichedFund = {
              ...fund,
              stages: Array.isArray(generalPrefs.investmentStage)
                ? generalPrefs.investmentStage
                : [generalPrefs.investmentStage].filter(Boolean),

              sectorFocus: Array.isArray(generalPrefs.sectorFocus)
                ? generalPrefs.sectorFocus
                : [generalPrefs.sectorFocus].filter(Boolean),
              geographicFocus: Array.isArray(generalPrefs.geographicFocus)
                ? generalPrefs.geographicFocus
                : [generalPrefs.geographicFocus].filter(Boolean),
              saProvinces: Array.isArray(generalPrefs.selectedProvinces)
                ? generalPrefs.selectedProvinces
                : [generalPrefs.selectedProvinces].filter(Boolean),
              type: [generalPrefs.investmentFocus || "Various"],
              instruments,
              supportOffered: fund.supportOffered || [],
              dueDiligenceTimeline: fund.dueDiligenceTimeline || generalPrefs.typicalDealClosingTime,
              minimumTicket: minTicket,
              maximumTicket: maxTicket,
            }

            const scoreResult = calculateHybridScore(businessData, enrichedFund)
            if (scoreResult.score >= 0) {
              const fundKey = `${docSnap.id}_${fund.name}`

              setScoreBreakdowns((prev) => ({
                ...prev,
                [fundKey]: scoreResult.breakdown,
              }))

              matchedFunds.push({
                id: fundKey,
                funderId: docSnap.id,
                name: investor.formData?.fundManageOverview?.registeredName || "Unnamed Fund",
                fullProfile: investor.formData,
                matchPercentage: scoreResult.score,
                investmentType: enrichedFund.type.join(", ") || "Various",
                targetStage: enrichedFund.stages.join(", ") || "Various",
                ticketSize: formatTicketSize(minTicket, maxTicket),
                minInvestment: minTicket,
                maxInvestment: maxTicket,
                sectorFocus: enrichedFund.sectorFocus.join(", ") || "Various",
                geographicFocus: [...enrichedFund.geographicFocus, ...enrichedFund.saProvinces].join(", ") || "Various",
                supportOffered: enrichedFund.supportOffered.join(", ") || "Not specified",
                website: contact.website || "#",
                pipe: pipelineStageMap[pkey],
                deadline: entityOverview.deadline || "-",
                waitingTime: investor.formData?.applicationBrief?.estimatedReviewTime || "-",
                hasApplication: !!applicationsMap[fundKey],
                pipelineStage: pipelineStageMap[fundKey] || "Match",
              })
            }
          })
        })

        const waitingTimeMap = {}
        matchedFunds.forEach((f) => {
          waitingTimeMap[f.id] = f.estimatedReviewTime || "-"
        })
        setWaitingTimes(waitingTimeMap)

        setStatuses(appStatusMap)
        setPipelineStages(pipelineStageMap)
        setApplicationDates(applicationDateMap)

        matchedFunds.sort((a, b) => b.matchPercentage - a.matchPercentage)
        setAllFunders(matchedFunds)
        setFilteredFunders(matchedFunds)

        // Apply original filters
        let filteredFunders = [...matchedFunds]
        if (filters.showOnly === "matches") {
          filteredFunders = filteredFunders.filter((funder) => !funder.hasApplication)
        } else if (filters.showOnly === "applications") {
          filteredFunders = filteredFunders.filter((funder) => funder.hasApplication)
        } else if (filters.pipelineStage) {
          if (Array.isArray(filters.pipelineStage)) {
            filteredFunders = filteredFunders.filter((funder) => filters.pipelineStage.includes(funder.pipelineStage))
          } else {
            filteredFunders = filteredFunders.filter((funder) => funder.pipelineStage === filters.pipelineStage)
          }
        }
        setFunders(filteredFunders)

        // Generate insights (same as before)
        const useBreakdown = {}
        const typeBreakdown = {}
        const sectorMatchCount = {}
        const sectorDistribution = {}
        const activityByMonth = Array(12)
          .fill()
          .map(() => ({
            started: 0,
            submitted: 0,
            review: 0,
            termSheets: 0,
            closed: 0,
          }))

        let totalFundingRequested = 0
        let appCount = 0

        appSnapshot.forEach((doc) => {
          const data = doc.data()
          const monthIndex = new Date(data.applicationDate).getMonth()
          appCount++
          const amount = Number.parseFloat(data.fundingNeeded || 0)
          if (!isNaN(amount)) totalFundingRequested += amount

          if (data.pipelineStage === "Application Started") activityByMonth[monthIndex].started++
          if (data.pipelineStage === "Application Sent") activityByMonth[monthIndex].submitted++
          if (data.pipelineStage === "Under Review") activityByMonth[monthIndex].review++
          if (data.pipelineStage === "Term Sheet") activityByMonth[monthIndex].termSheets++
          if (data.pipelineStage === "Deal Closed") activityByMonth[monthIndex].closed++
        })

        matchedFunds.forEach((funder) => {
          ;(funder.investmentType?.split(",") || []).forEach((type) => {
            const cleanType = type.trim()
            if (cleanType) typeBreakdown[cleanType] = (typeBreakdown[cleanType] || 0) + 1
          })
          ;(funder.sectorFocus?.split(",") || []).forEach((sector) => {
            const cleanSector = sector.trim()
            if (cleanSector) {
              sectorMatchCount[cleanSector] = (sectorMatchCount[cleanSector] || 0) + 1
              sectorDistribution[cleanSector] = (sectorDistribution[cleanSector] || 0) + 1
            }
          })

          if (funder.targetStage) {
            const stage = funder.targetStage.trim()
            useBreakdown[stage] = (useBreakdown[stage] || 0) + 1
          }
        })

        const uniqueFunderCount = new Set(matchedFunds.map((f) => f.funderId)).size
        const matchRate = totalInvestorCount ? Math.round((uniqueFunderCount / totalInvestorCount) * 100) : 0

        const newInsightsData = {
          fundingUseBreakdown: useBreakdown,
          fundingTypeBreakdown: typeBreakdown,
          topMatchedSectors: Object.fromEntries(
            Object.entries(sectorMatchCount)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5),
          ),
          sectorDistribution,
          timelineProgress: activityByMonth.map((v, i) => ({
            month: new Date(0, i).toLocaleString("default", { month: "short" }),
            ...v,
          })),
          monthlyActivity: activityByMonth.map((v, i) => ({
            month: new Date(0, i).toLocaleString("default", { month: "short" }),
            ...v,
          })),
          averageFundingAmount: appCount ? Math.round(totalFundingRequested / appCount) : 0,
          matchRate,
          activeFundersCount: totalInvestorCount,
        }

        setInsightsData(newInsightsData)
        if (onInsightsData) onInsightsData(newInsightsData)
        if (onPrimaryMatchCount) onPrimaryMatchCount(matchedFunds.length)
      } catch (error) {
        setNotification({ type: "error", message: error.message })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [JSON.stringify(filters)])

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const auth = getAuth()
        const user = auth.currentUser
        if (!user) return

        const profileRef = doc(db, "universalProfiles", user.uid)
        const profileSnap = await getDoc(profileRef)

        if (profileSnap.exists()) {
          const profile = profileSnap.data()
          setProfileData(profile)

          // Check which required documents are already uploaded
          if (applyingFunder && applyingFunder.requiredDocuments) {
            const existingDocs = applyingFunder.requiredDocuments.filter((docLabel) => {
              const path = DOCUMENT_PATHS[docLabel]
              return get(profile, path) && Array.isArray(get(profile, path)) && get(profile, path).length > 0
            })

            setSubmittedDocuments(existingDocs)
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      }
    }

    fetchUserProfile()
  }, [applyingFunder])

  const normalizeAmount = (value) => {
    if (!value) return 0
    if (typeof value === "number") return value

    // Handle string values more robustly
    const cleanValue = value
      .toString()
      .replace(/[R$,\s]/g, "") // Remove currency symbols, commas, spaces
      .replace(/[^\d.]/g, "") // Keep only digits and decimal points

    return Number.parseFloat(cleanValue) || 0
  }

  const normalizeSMEProfile = (profile) => {
    const entity = profile.entityOverview || {}
    const funds = profile.useOfFunds || {}
    const app = profile.applicationOverview || {}

    // Normalize helper for arrays
    const normalizeArray = (value) => {
      if (!value) return []
      if (Array.isArray(value)) return value.map(normalizeText)
      return [normalizeText(value)]
    }

    return {
      // 📍 Location: general + province
      location: normalizeText(entity.location),
      province: normalizeText(entity.province),

      // 🧠 Sector: normalize list of economic sectors
      economicSectors: normalizeArray(entity.economicSectors),

      // 🏗️ Stage: used to compare to investmentStage (in lowercase underscore form)
      applicationStage: normalizeStage(app.fundingStage),

      // 💸 Funding amount (ticket size match)
      amountRequested: normalizeAmount(funds.amountRequested),

      // ⚙️ Instruments (like SAFE, convertible note, etc)
      instruments: normalizeArray(funds.fundingInstruments),

      // Optional: can be used for deeper matching or filtering
      supportNeeded: normalizeArray(profile.productsServices?.support),
    }
  }

  const normalizeInvestorFund = (fund) => {
    const getTicketValue = (ticketField) => {
      if (!ticketField) return 0
      if (typeof ticketField === "number") return ticketField

      const cleanValue = ticketField
        .toString()
        .replace(/[R$,\s]/g, "")
        .replace(/[^\d.]/g, "")

      return Number.parseFloat(cleanValue) || 0
    }
    console.log(fund.stages)
    const normalizeArray = (value) => {
      if (!value) return []
      if (Array.isArray(value)) return value.map(normalizeText)
      return [normalizeText(value)]
    }

    return {
      fundName: fund.name?.trim() || "Unnamed Fund",

      // 📍 Location match: includes general and specific targeting
      locations: [
        ...(fund.geographicFocus || []),
        ...(fund.selectedProvinces || []),
        ...(fund.selectedCountries || []),
      ].map(normalizeText),

      // 🏗️ Investment stage match (multi)
      stages: Array.isArray(fund.stages)
        ? fund.stages.map((stage) => normalizeStage(stage))
        : normalizeArray(fund.stages),

      // 🌱 Sector matching
      sectors: normalizeArray(fund.sectorFocus),
      excludedSectors: normalizeArray(fund.sectorExclusions),

      // ⚙️ Instrument/Type match
      instruments: Array.isArray(fund.instruments)
        ? fund.instruments.map((i) => i.toLowerCase().trim())
        : [fund.instruments?.toLowerCase().trim()].filter(Boolean),

      // 💰 Ticket range parsing
      ticketMin: getTicketValue(fund.minimumTicket),
      ticketMax: getTicketValue(fund.maximumTicket),

      // Optional
      supportOffered: normalizeArray(fund.supportOffered),
      decisionTime: fund.dueDiligenceTimeline || "-",
    }
  }

  const calculateHybridScore = (sme, investorFund) => {
    const fund = normalizeInvestorFund(investorFund)

    const weights = {
      sector: 0.5,
      stage: 0.2,
      ticket: 0.2,
      type: 0.1,
    }

    let score = 0
    const breakdown = {
      sector: { score: 0, matched: [], smeSectors: [], investorSectors: [] },
      stage: { score: 0, smeStage: "", investorStages: [] },
      ticket: { score: 0, smeAmount: 0, minTicket: 0, maxTicket: 0 },
      type: { score: 0, smeInstruments: [], investorInstruments: [], matchedInstruments: [] },
    }

    // 🌱 Sector match with synonym support
    const smeSectorsExpanded = expandSectorsWithSynonyms(sme.economicSectors)
    const matchedSectors = smeSectorsExpanded.filter((s) => fund.sectors.includes(s))
    const hasExclusion = fund.excludedSectors.some((ex) => smeSectorsExpanded.includes(ex))

    let sectorScore = 0
    if (matchedSectors.length && !hasExclusion) {
      const matchRatio = matchedSectors.length / sme.economicSectors.length
      sectorScore =10 
    }
    score += sectorScore * weights.sector
    breakdown.sector = {
      score: sectorScore * 10, // Convert to percentage
      matched: matchedSectors,
      smeSectors: sme.economicSectors,
      investorSectors: fund.sectors,
      hasExclusion,
      weight: weights.sector,
    }

    // 🏗️ Stage match
    const stageMatch = fund.stages.includes(sme.applicationStage) ? 10 : 0
    score += stageMatch * weights.stage
    breakdown.stage = {
      score: stageMatch * 10, // Convert to percentage
      smeStage: sme.applicationStage,
      investorStages: fund.stages,
      matched: fund.stages.includes(sme.applicationStage),
      weight: weights.stage,
    }

    // ⚙️ Type (instrument) match
    const matchedInstruments = fund.instruments.filter((inst) =>
      sme.instruments.some((smeInst) => smeInst.toLowerCase() === inst.toLowerCase()),
    )
    const typeMatch = matchedInstruments.length > 0 ? 10 : 0
    score += typeMatch * weights.type
    breakdown.type = {
      score: typeMatch * 10,
      smeInstruments: sme.instruments,
      investorInstruments: fund.instruments,
      matchedInstruments,
      weight: weights.type,
    }

    // 💰 Ticket match — full score if in range, else scale down
    let ticketScore = 0
    const { ticketMin, ticketMax } = fund
    const { amountRequested } = sme

    if (amountRequested >= ticketMin && amountRequested <= ticketMax) {
      ticketScore = 10
    } else {
      const distance = amountRequested < ticketMin ? ticketMin - amountRequested : amountRequested - ticketMax
      const range = ticketMax - ticketMin || 1 // prevent div-by-zero
      const penalty = Math.min((distance / range) * 10, 10)
      ticketScore = Math.max(0, 10 - penalty)
    }
    score += ticketScore * weights.ticket
    breakdown.ticket = {
      score: ticketScore * 10, // Convert to percentage
      smeAmount: amountRequested,
      minTicket: ticketMin,
      maxTicket: ticketMax,
      inRange: amountRequested >= ticketMin && amountRequested <= ticketMax,
      weight: weights.ticket,
    }

    return {
      score: Math.round(score * 10), // return as percentage 0–100
      breakdown,
    }
  }

  
  const handleViewClick = async (funder) => {
    try {
      const docSnap = await getDoc(doc(db, "MyuniversalProfiles", funder.funderId))
      if (!docSnap.exists()) return
      const data = docSnap.data()
      setModalFunder({
        name: funder.name,
        data: data.formData,
        matchPercentage: funder.matchPercentage, // Add this line
      })
      funder.fullProfile = data.formData
    } catch (err) {
      console.error("Error loading funder profile", err)
    }
  }

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(62, 39, 35, 0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    animation: "fadeIn 0.3s ease-out",
    backdropFilter: "blur(4px)",
  }

  const modalContentStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "40px",
    maxWidth: "950px",
    width: "95%",
    maxHeight: "95vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    border: "none",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
    position: "relative",
  }

  // Add this function to handle viewing investor details
  const handleViewInvestorDetails = async (funder) => {
    try {
      setLoading(true);
      const docRef = doc(db, "MyuniversalProfiles", funder.funderId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setModalFunder({
          ...funder,
          fullProfile: data.formData || {}, // Fallback to empty object
          matchPercentage: funder.matchPercentage,
        });
      } else {
        setModalFunder({
          ...funder,
          fullProfile: null, // Explicitly mark as missing
        });
      }
    } catch (err) {
      console.error("Error loading funder profile", err);
      setModalFunder(null); // Reset on error
      setNotification({ type: "error", message: "Failed to load investor details" });
    } finally {
      setLoading(false);
    }
  };


  const handleUpdateNextStage = async (funder) => {
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) throw new Error("User not authenticated")

      const applicationKey = `${funder.funderId}_${funder.name}`
      const currentStage = pipelineStages[applicationKey] || "Match"
      const nextStage = getNextStage(currentStage)

      // Find the application document
      const applicationQuery = query(
        collection(db, "smeApplications"),
        where("smeId", "==", user.uid),
        where("funderId", "==", funder.funderId),
        where("fundName", "==", funder.name),
      )

      const applicationSnapshot = await getDocs(applicationQuery)
      if (applicationSnapshot.empty) {
        console.error("No application found for this funder")
        return
      }

      const applicationDoc = applicationSnapshot.docs[0]

      // Update the pipeline stage
      await updateDoc(applicationDoc.ref, {
        pipelineStage: nextStage,
        lastUpdated: new Date().toISOString(),
      })

      // Update local state
      setPipelineStages((prev) => ({
        ...prev,
        [applicationKey]: nextStage,
      }))

      if (nextStage === "Deal Complete" && onDealComplete) {
        console.log("[v0] Deal completed, switching to successful deals tab")
        onDealComplete()
      }

      console.log(`Updated ${funder.name} from ${currentStage} to ${nextStage}`)
    } catch (error) {
      console.error("Error updating pipeline stage:", error)
    }
  }

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (loading) return <div>Loading funders...</div>

  return (
    <>
      <div
        style={{
          position: "relative",
          filter: showFilterModal || showBreakdownModal || modalFunder ? "blur(2px)" : "none",
          transition: "filter 0.2s ease",
        }}
      >
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => setShowFilterModal(true)} style={filterButtonStyle}>
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>

        {filteredFunders.length === 0 ? (
          <div style={noResultsStyle}>
            <p>
              {getActiveFilterCount() > 0
                ? "No funders match your filters. Try adjusting your criteria."
                : "No matching funders found. Try adjusting your profile."}
            </p>
            <button onClick={clearFilters} style={clearFiltersButtonStyle}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <colgroup>
                <col style={{ width: "11%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Funder Name</th>
                  <th style={tableHeaderStyle}>Location</th>
                  <th style={tableHeaderStyle}>Sector</th>
                  <th style={tableHeaderStyle}>Funding Stage</th>
                  <th style={tableHeaderStyle}>Funding Type</th>
                  <th style={tableHeaderStyle}>Ticket Size (R-M)</th>
                  <th style={tableHeaderStyle}>Match %</th>
                  <th style={tableHeaderStyle}>Current Stage</th>
                  <th style={tableHeaderStyle}>Next Stage</th>
                  <th style={tableHeaderStyle}>Waiting Time</th>
                  <th style={{ ...tableHeaderStyle, borderRight: "none" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFunders.map((funder) => {
                  // Use consistent key format
                  const applicationKey = `${funder.funderId}_${funder.name}`

                  const status = statuses[applicationKey] || "Application not sent"
                  const hasApplication = existingApplications[applicationKey] || funder.hasApplication

                  // Get the pipeline stage using the consistent key
                  const currentStage = hasApplication
                    ? pipelineStages[applicationKey] || funder.pipelineStage || "Application Sent"
                    : "Match"

                  const nextStage = hasApplication ? getNextStage(currentStage) : "Send Application"

                  return (
                    <tr key={funder.id} style={tableRowStyle}>
                      <td style={tableCellStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <div>
                            <span   onClick={() => handleViewInvestorDetails(funder)} style={funderNameStyle}>
                              <TruncatedText text={funder.name} maxLength={15} />
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={tableCellStyle}>
                        <TruncatedText
                          text={formatSingleLocation(funder.geographicFocus || funder.selectedCountries)}
                          maxLength={12}
                        />
                      </td>

                      <td style={tableCellStyle}>
                        <TruncatedText text={formatSectorLabel(funder.sectorFocus)} maxLength={12} />
                      </td>

                      <td style={tableCellStyle}>
                        <TruncatedText text={formatInvestmentStage(funder.targetStage)} maxLength={12} />
                      </td>

                      <td style={tableCellStyle}>
                        <TruncatedText text={formatLabel(funder.investmentType)} maxLength={12} />
                      </td>

                      <td style={tableCellStyle}>
                        <TruncatedText
                          text={formatTicketSize(funder.minInvestment, funder.maxInvestment)}
                          maxLength={12}
                          hideSeeModeForAmounts={true}
                        />
                      </td>

                      <td style={tableCellStyle}>
                        <div style={matchContainerStyle}>
                          <div style={progressBarStyle}>
                            <div
                              style={{
                                ...progressFillStyle,
                                width: `${funder.matchPercentage}%`,
                                background:
                                  funder.matchPercentage > 75
                                    ? "#48BB78"
                                    : funder.matchPercentage > 50
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
                                  funder.matchPercentage > 75
                                    ? "#48BB78"
                                    : funder.matchPercentage > 50
                                      ? "#D69E2E"
                                      : "#E53E3E",
                              }}
                            >
                              {funder.matchPercentage}%
                            </span>
                            <Eye
                              size={14}
                              style={{
                                cursor: "pointer",
                                color: "#a67c52",
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setCurrentBreakdown(scoreBreakdowns[funder.id])
                                setShowBreakdownModal(true)
                              }}
                              title="View match breakdown"
                            />
                          </div>
                        </div>
                      </td>

                      <td style={tableCellStyle}>
                        <div
                          style={{
                            ...statusBadgeStyle,
                            backgroundColor: getStageColor(currentStage),
                            color: "#5D2A0A",
                            fontSize: "0.65rem",
                            padding: "0.15rem 0.3rem",
                            textAlign: "center",
                            lineHeight: "1.2",
                            minHeight: "2.5rem",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                          }}
                        >
                          {currentStage.split(" ").map((word, index) => (
                            <div key={index} style={{ fontSize: "0.6rem" }}>
                              {word}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td style={tableCellStyle}>
                        <div
                          style={{
                            ...statusBadgeStyle,
                            backgroundColor: "#E8F5E8",
                            color: "#388E3C",
                            fontSize: "0.65rem",
                            padding: "0.15rem 0.3rem",
                            textAlign: "center",
                            lineHeight: "1.2",
                            minHeight: "2.5rem",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                          }}
                        >
                          {nextStage.split(" ").map((word, index) => (
                            <div key={index} style={{ fontSize: "0.6rem" }}>
                              {word}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td style={tableCellStyle}>
                        <div
                          style={{
                            ...statusBadgeStyle,
                            backgroundColor: "#e3f2fd",
                            color: "#1976d2",
                            fontSize: "0.65rem",
                            padding: "0.15rem 0.3rem",
                            textAlign: "center",
                            lineHeight: "1.2",
                            minHeight: "2.5rem",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                          }}
                        >
                          <TruncatedText text={formatWaitingTime(funder.waitingTime)} maxLength={10} />
                        </div>
                      </td>

                      <td style={{ ...tableCellStyle, borderRight: "none" }}>
                        {hasApplication ? (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              color: "#4caf50",
                              fontSize: "0.65rem",
                              fontWeight: "600",
                              justifyContent: "center",
                            }}
                          >
                            <Check size={14} /> Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApplyClick(funder)}
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
                            Apply
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "1rem",
            padding: "1rem",
            background: "#FEFCFA",
            borderRadius: "8px",
            border: "1px solid #E8D5C4",
          }}
        >
          <div style={{ color: "#5D2A0A", fontSize: "0.875rem" }}>
            Showing {filteredFunders.length} of {allFunders.length} funders
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              style={{
                padding: "0.5rem 1rem",
                background: "#F5EBE0",
                color: "#5D2A0A",
                border: "1px solid #E8D5C4",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Previous
            </button>
            <span style={{ color: "#5D2A0A", fontSize: "0.875rem" }}>Page 1 of 1</span>
            <button
              style={{
                padding: "0.5rem 1rem",
                background: "#F5EBE0",
                color: "#5D2A0A",
                border: "1px solid #E8D5C4",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

       {modalFunder && (
        <div style={modalOverlayStyle} onClick={() => setModalFunder(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "32px",
              paddingBottom: "24px",
              borderBottom: "3px solid #8d6e63"
            }}>
              <h2 style={{
                fontSize: "32px",
                fontWeight: "800",
                color: "#3e2723",
                margin: 0
              }}>
                {modalFunder.name} Investor Profile
              </h2>
              <button
                onClick={() => setModalFunder(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                  padding: "8px"
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* General Information Section */}
            <div style={{
              marginBottom: "40px",
              backgroundColor: "#fff",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #e8e8e8",
            }}>
              <h3 style={{
                margin: "0 0 24px 0",
                fontSize: "24px",
                fontWeight: "700",
                color: "#3e2723",
                paddingBottom: "16px",
                borderBottom: "3px solid #8d6e63",
              }}>
                General Information
              </h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "24px",
              }}>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Firm Type:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.fundManageOverview?.firmType || "N/A"}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Legal Entity Type:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.fundManageOverview?.legalEntityType || "N/A"}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Registered Name:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.fundManageOverview?.registeredName}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Trading Name:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.fundManageOverview?.tradingName}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Registration Number:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.fundManageOverview?.registrationNumber}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Tax Number:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.fundManageOverview?.taxNumber}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    VAT Number:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.fundManageOverview?.vatRegistrationNumbers}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Years in Operation:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.fundManageOverview?.yearsInOperation}
                  </span>
                </div>
              </div>
            </div>

            {/* Fund Management Overview Section */}
            <div style={{
              marginBottom: "40px",
              backgroundColor: "#fff",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #e8e8e8",
            }}>
              <h3 style={{
                margin: "0 0 24px 0",
                fontSize: "24px",
                fontWeight: "700",
                color: "#3e2723",
                paddingBottom: "16px",
                borderBottom: "3px solid #8d6e63",
              }}>
                Fund Management Overview
              </h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "24px",
              }}>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Brief Description:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.fundManageOverview?.briefDescription || "N/A"}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Investor Role:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.fundManageOverview?.investorRole}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Number of Investments:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.fundManageOverview?.numberOfInvestments}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Value Deployed:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.fundManageOverview?.valueDeployed}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Number of Executives:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.fundManageOverview?.numberOfInvestmentExecutives}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Portfolio Companies:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.fundManageOverview?.portfolioCompanies}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Additional Services:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.fundManageOverview?.additionalServices?.join(", ")}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Additional Support:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.fundManageOverview?.additionalSupport?.join(", ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Fund Details Section */}
            {modalFunder.fullProfile?.fundDetails?.funds?.map((fund, index) => (
              <div key={index} style={{
                marginBottom: "40px",
                backgroundColor: "#fff",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
                border: "1px solid #e8e8e8",
              }}>
                <h3 style={{
                  margin: "0 0 24px 0",
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#3e2723",
                  paddingBottom: "16px",
                  borderBottom: "3px solid #8d6e63",
                }}>
                  Fund Details {modalFunder.fullProfile?.fundDetails?.funds?.length > 1 ? `#${index + 1}` : ''}
                </h3>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "24px",
                }}>
                  <div>
                    <span style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#5d4037",
                      marginBottom: "8px",
                    }}>
                      Fund Name:
                    </span>
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {fund.name}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#5d4037",
                      marginBottom: "8px",
                    }}>
                      Fund Size:
                    </span>
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {fund.size}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#5d4037",
                      marginBottom: "8px",
                    }}>
                      Fund Structure:
                    </span>
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {fund.fundStructure}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#5d4037",
                      marginBottom: "8px",
                    }}>
                      Legal Structure:
                    </span>
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {fund.fundLegalStructure}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#5d4037",
                      marginBottom: "8px",
                    }}>
                      Minimum Ticket:
                    </span>
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {fund.minimumTicket}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#5d4037",
                      marginBottom: "8px",
                    }}>
                      Maximum Ticket:
                    </span>
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {fund.maximumTicket}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#5d4037",
                      marginBottom: "8px",
                    }}>
                      Average Deal Size:
                    </span>
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {fund.averageDealSize}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#5d4037",
                      marginBottom: "8px",
                    }}>
                      Revenue Threshold:
                    </span>
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {fund.revenueThreshold}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#5d4037",
                      marginBottom: "8px",
                    }}>
                      Follow-on Percentage:
                    </span>
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {fund.followOnPercentage}%
                    </span>
                  </div>
                  <div>
                    <span style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#5d4037",
                      marginBottom: "8px",
                    }}>
                      Pro Rata Rights:
                    </span>
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {fund.proRataRights ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#5d4037",
                      marginBottom: "8px",
                    }}>
                      Reserves for Follow-on:
                    </span>
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {fund.reservesForFollowOn ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#5d4037",
                      marginBottom: "8px",
                    }}>
                      Captive Fund:
                    </span>
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {fund.captiveFund ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#5d4037",
                      marginBottom: "8px",
                    }}>
                      LP Composition:
                    </span>
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {fund.lpComposition}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#5d4037",
                      marginBottom: "8px",
                    }}>
                      Target Investor Type:
                    </span>
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {fund.targetInvestorType}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Investment Preferences Section */}
            <div style={{
              marginBottom: "40px",
              backgroundColor: "#fff",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #e8e8e8",
            }}>
              <h3 style={{
                margin: "0 0 24px 0",
                fontSize: "24px",
                fontWeight: "700",
                color: "#3e2723",
                paddingBottom: "16px",
                borderBottom: "3px solid #8d6e63",
              }}>
                Investment Preferences
              </h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "24px",
              }}>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Investment Focus:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.generalInvestmentPreference?.investmentFocus || "N/A"}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Investment Stage:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.generalInvestmentPreference?.investmentStage?.join(", ")}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Sector Focus:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.generalInvestmentPreference?.sectorFocus?.join(", ")}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Geographic Focus:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.generalInvestmentPreference?.geographicFocus?.join(", ")}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Risk Appetite:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.generalInvestmentPreference?.riskAppetite}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Legal Entity Fit:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.generalInvestmentPreference?.legalEntityFit}
                  </span>
                </div>
              </div>
            </div>

            {/* Application Brief Section */}
            <div style={{
              marginBottom: "40px",
              backgroundColor: "#fff",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #e8e8e8",
            }}>
              <h3 style={{
                margin: "0 0 24px 0",
                fontSize: "24px",
                fontWeight: "700",
                color: "#3e2723",
                paddingBottom: "16px",
                borderBottom: "3px solid #8d6e63",
              }}>
                Application Process
              </h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "24px",
              }}>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Application Window:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.applicationBrief?.applicationWindow}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Typical Deal Closing Time:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.applicationBrief?.typicalDealClosingTime}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Estimated Review Time:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.applicationBrief?.estimatedReviewTime}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Overview & Objectives:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.applicationBrief?.overviewObjectives}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Evaluation Criteria:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.applicationBrief?.evaluationCriteria}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Impact Alignment:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.applicationBrief?.impactAlignment}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Instructions for Applying:
                  </span>
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.applicationBrief?.instructionsForApplying}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#5d4037",
                    marginBottom: "8px",
                  }}>
                    Required Documents:
                  </span>
                  <div style={{ fontSize: "16px", color: "#333" }}>
                    {modalFunder.fullProfile?.applicationBrief?.coreDocuments?.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: "20px" }}>
                        {modalFunder.fullProfile?.applicationBrief?.coreDocuments.map((doc, index) => (
                          <li key={index}>{doc}</li>
                        ))}
                      </ul>
                    ) : "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "40px",
              paddingTop: "24px",
              borderTop: "1px solid #e0e0e0"
            }}>
              <button
                onClick={() => setModalFunder(null)}
                style={{
                  background: "linear-gradient(135deg, #5d4037 0%, #4e342e 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "16px 32px",
                  fontSize: "18px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 16px rgba(93, 64, 55, 0.3)",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {mounted &&
        showBreakdownModal &&
        currentBreakdown &&
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
                <h3 style={modalTitleStyle}>Match Breakdown - Funding Analysis</h3>
                <button onClick={() => setShowBreakdownModal(false)} style={modalCloseButtonStyle}>
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
                        currentBreakdown.sector.score * currentBreakdown.sector.weight +
                          currentBreakdown.stage.score * currentBreakdown.stage.weight +
                          currentBreakdown.ticket.score * currentBreakdown.ticket.weight +
                          currentBreakdown.type.score * currentBreakdown.type.weight >=
                        80
                          ? "#388E3C"
                          : currentBreakdown.sector.score * currentBreakdown.sector.weight +
                                currentBreakdown.stage.score * currentBreakdown.stage.weight +
                                currentBreakdown.ticket.score * currentBreakdown.ticket.weight +
                                currentBreakdown.type.score * currentBreakdown.type.weight >=
                              60
                            ? "#F57C00"
                            : "#D32F2F",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {(
                      currentBreakdown.sector.score * currentBreakdown.sector.weight +
                      currentBreakdown.stage.score * currentBreakdown.stage.weight +
                      currentBreakdown.ticket.score * currentBreakdown.ticket.weight +
                      currentBreakdown.type.score * currentBreakdown.type.weight
                    ).toFixed(1)}
                    %
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
                  {/* Sector Match */}
                  <div
                    style={{
                      background: "#FEFCFA",
                      border: "1px solid #E8D5C4",
                      borderRadius: "8px",
                      padding: "1.25rem",
                      borderLeft: `4px solid ${currentBreakdown.sector.score >= 80 ? "#388E3C" : currentBreakdown.sector.score >= 50 ? "#F57C00" : "#D32F2F"}`,
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
                        Sector Match (Weight: {currentBreakdown.sector.weight * 100}%)
                      </h4>
                      <span
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "bold",
                          color:
                            currentBreakdown.sector.score >= 80
                              ? "#388E3C"
                              : currentBreakdown.sector.score >= 50
                                ? "#F57C00"
                                : "#D32F2F",
                          marginLeft: "1rem",
                        }}
                      >
                        {Math.round(currentBreakdown.sector.score)}%
                      </span>
                    </div>

                    <div
                      style={{
                        background: "#E8D5C4",
                        borderRadius: "4px",
                        height: "8px",
                        overflow: "hidden",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background:
                            currentBreakdown.sector.score >= 80
                              ? "#388E3C"
                              : currentBreakdown.sector.score >= 50
                                ? "#F57C00"
                                : "#D32F2F",
                          width: `${currentBreakdown.sector.score}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "#8D6E63" }}>
                      <div>Your Sectors: {currentBreakdown.sector.smeSectors.join(", ")}</div>
                      <div>Investor Sectors: {currentBreakdown.sector.investorSectors.join(", ")}</div>
                      <div>
                        Matched:{" "}
                        {currentBreakdown.sector.matched.length > 0
                          ? currentBreakdown.sector.matched.join(", ")
                          : "None"}
                      </div>
                    </div>
                  </div>

                  {/* Stage Match */}
                  <div
                    style={{
                      background: "#FEFCFA",
                      border: "1px solid #E8D5C4",
                      borderRadius: "8px",
                      padding: "1.25rem",
                      borderLeft: `4px solid ${currentBreakdown.stage.score >= 80 ? "#388E3C" : currentBreakdown.stage.score >= 50 ? "#F57C00" : "#D32F2F"}`,
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
                        Stage Match (Weight: {currentBreakdown.stage.weight * 100}%)
                      </h4>
                      <span
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "bold",
                          color:
                            currentBreakdown.stage.score >= 80
                              ? "#388E3C"
                              : currentBreakdown.stage.score >= 50
                                ? "#F57C00"
                                : "#D32F2F",
                          marginLeft: "1rem",
                        }}
                      >
                        {Math.round(currentBreakdown.stage.score)}%
                      </span>
                    </div>

                    <div
                      style={{
                        background: "#E8D5C4",
                        borderRadius: "4px",
                        height: "8px",
                        overflow: "hidden",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background:
                            currentBreakdown.stage.score >= 80
                              ? "#388E3C"
                              : currentBreakdown.stage.score >= 50
                                ? "#F57C00"
                                : "#D32F2F",
                          width: `${currentBreakdown.stage.score}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "#8D6E63" }}>
                      <div>Your Stage: {formatInvestmentStage(currentBreakdown.stage.smeStage)}</div>
                      <div>
                        Investor Stages: {formatInvestmentStage(currentBreakdown.stage.investorStages.join(", "))}
                      </div>
                    </div>
                  </div>

                  {/* Ticket Size Match */}
                  <div
                    style={{
                      background: "#FEFCFA",
                      border: "1px solid #E8D5C4",
                      borderRadius: "8px",
                      padding: "1.25rem",
                      borderLeft: `4px solid ${currentBreakdown.ticket.score >= 80 ? "#388E3C" : currentBreakdown.ticket.score >= 50 ? "#F57C00" : "#D32F2F"}`,
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
                        Ticket Size Match (Weight: {currentBreakdown.ticket.weight * 100}%)
                      </h4>
                      <span
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "bold",
                          color:
                            currentBreakdown.ticket.score >= 80
                              ? "#388E3C"
                              : currentBreakdown.ticket.score >= 50
                                ? "#F57C00"
                                : "#D32F2F",
                          marginLeft: "1rem",
                        }}
                      >
                        {Math.round(currentBreakdown.ticket.score)}%
                      </span>
                    </div>

                    <div
                      style={{
                        background: "#E8D5C4",
                        borderRadius: "4px",
                        height: "8px",
                        overflow: "hidden",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background:
                            currentBreakdown.ticket.score >= 80
                              ? "#388E3C"
                              : currentBreakdown.ticket.score >= 50
                                ? "#F57C00"
                                : "#D32F2F",
                          width: `${currentBreakdown.ticket.score}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "#8D6E63" }}>
                      <div>
                        Your Amount: R{currentBreakdown.ticket.smeAmount?.toLocaleString("en-ZA") || "Not specified"}
                      </div>
                      <div>
                        Investor Range: R{currentBreakdown.ticket.minTicket?.toLocaleString("en-ZA") || "0"} - R
                        {currentBreakdown.ticket.maxTicket?.toLocaleString("en-ZA") || "∞"}
                      </div>
                    </div>
                  </div>

                  {/* Instrument Match */}
                  <div
                    style={{
                      background: "#FEFCFA",
                      border: "1px solid #E8D5C4",
                      borderRadius: "8px",
                      padding: "1.25rem",
                      borderLeft: `4px solid ${currentBreakdown.type.score >= 80 ? "#388E3C" : currentBreakdown.type.score >= 50 ? "#F57C00" : "#D32F2F"}`,
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
                        Instrument Match (Weight: {currentBreakdown.type.weight * 100}%)
                      </h4>
                      <span
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "bold",
                          color:
                            currentBreakdown.type.score >= 80
                              ? "#388E3C"
                              : currentBreakdown.type.score >= 50
                                ? "#F57C00"
                                : "#D32F2F",
                          marginLeft: "1rem",
                        }}
                      >
                        {Math.round(currentBreakdown.type.score)}%
                      </span>
                    </div>

                    <div
                      style={{
                        background: "#E8D5C4",
                        borderRadius: "4px",
                        height: "8px",
                        overflow: "hidden",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background:
                            currentBreakdown.type.score >= 80
                              ? "#388E3C"
                              : currentBreakdown.type.score >= 50
                                ? "#F57C00"
                                : "#D32F2F",
                          width: `${currentBreakdown.type.score}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "#8D6E63" }}>
                      <div>Your Instruments: {currentBreakdown.type.smeInstruments.join(", ") || "None"}</div>
                      <div>Investor Instruments: {currentBreakdown.type.investorInstruments.join(", ") || "None"}</div>
                      <div>
                        Matched:{" "}
                        {currentBreakdown.type.matchedInstruments.length > 0
                          ? currentBreakdown.type.matchedInstruments.join(", ")
                          : "None"}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid #E8D5C4",
                  }}
                >
                  <button
                    style={{
                      padding: "0.75rem 2rem",
                      background: "#5D2A0A",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={() => setShowBreakdownModal(false)}
                  >
                    Close Breakdown
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

        

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
                maxWidth: "1000px",
                width: "95%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              }}
            >
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>Filter Funders</h3>
                <button onClick={() => setShowFilterModal(false)} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                {/* Filter content - keeping existing filter logic but updating styles */}
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "2rem",
                    paddingBottom: "1rem",
                    borderBottom: "2px solid #E8D5C4",
                  }}
                >
                  <h1
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#5D2A0A",
                      margin: "0 0 0.5rem 0",
                    }}
                  >
                    Filter Funders
                  </h1>
                  <p
                    style={{
                      fontSize: "1rem",
                      color: "#8D6E63",
                      margin: "0",
                    }}
                  >
                    Find the perfect funders for your business needs
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid #E8D5C4",
                  }}
                >
                  <button
                    style={{
                      flex: "1",
                      padding: "0.75rem 1.5rem",
                      background: "#F5EBE0",
                      color: "#5D2A0A",
                      border: "1px solid #E8D5C4",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={clearFilters}
                  >
                    Clear All Filters
                  </button>
                  <button
                    style={{
                      flex: "1",
                      padding: "0.75rem 1.5rem",
                      background: "#5D2A0A",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={() => setShowFilterModal(false)}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

          {applyingFunder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Application to {applyingFunder.name}</h3>
              <button onClick={() => setApplyingFunder(null)}>✖</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.documentsSection}>
                <h4>Required Documents</h4>
                <p>Please ensure all documents are uploaded before submitting</p>

                <div className={styles.documentsList}>
                  {applyingFunder.requiredDocuments?.map((docLabel) => {
                    const submitted = submittedDocuments.includes(docLabel);
                    const path = DOCUMENT_PATHS[docLabel];
                    const docUrl = profileData && get(profileData, path)?.[0];
                    const lastUpdated = profileData && get(profileData, `${path}UpdatedAt`);
                    const formattedDate = lastUpdated?.seconds
                      ? new Date(lastUpdated.seconds * 1000).toLocaleDateString()
                      : null;

                    return (
                      <div key={docLabel} className={styles.documentItem}>
                        <div className={styles.documentStatus}>
                          <input
                            type="checkbox"
                            checked={selectedDocs.includes(docLabel)}
                            disabled={!submitted}
                            onChange={() => toggleDocumentSelection(docLabel)}
                            className={styles.checkbox}
                          />
                          <span className={styles.documentName}>
                            {formatDocumentLabel(docLabel)}
                          </span>
                          {submitted && formattedDate && (
                            <span className={styles.documentDate}>
                              (Uploaded {formattedDate})
                            </span>
                          )}
                        </div>

                        {submitted ? (
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.viewLink}
                          >
                            <Eye size={16} /> View
                          </a>
                        ) : (
                          <div className={styles.uploadContainer}>
                            <input
                              type="file"
                              id={`file-upload-${docLabel}`}
                              onChange={(e) => handleUpload(docLabel, e.target.files[0])}
                              accept=".pdf,.doc,.docx"
                              className={styles.fileInput}
                            />
                            <label
                              htmlFor={`file-upload-${docLabel}`}
                              className={styles.uploadButton}
                            >
                              Upload
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={() => submitApplication(applyingFunder)}
                className={styles.submitButton}
                disabled={selectedDocs.length === 0}
              >
                Submit Application
              </button>
              <button
                onClick={() => setApplyingFunder(null)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const filterButtonStyle = {
  background: "#F5EBE0",
  color: "#5D2A0A",
  border: "1px solid #E8D5C4",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.875rem",
  transition: "all 0.2s",
}

const noResultsStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: "2rem",
  color: "#a67c52",
  textAlign: "center",
}

const clearFiltersButtonStyle = {
  padding: "0.5rem 1rem",
  background: "#F5EBE0",
  color: "#5D2A0A",
  border: "1px solid #E8D5C4",
  borderRadius: "6px",
  cursor: "pointer",
  marginTop: "0.5rem",
}

const tableContainerStyle = {
  overflowX: "auto",
  borderRadius: "8px",
  border: "1px solid #E8D5C4",
  boxShadow: "0 4px 24px rgba(139, 69, 19, 0.08)",
}

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "white",
  fontSize: "0.875rem",
  backgroundColor: "#FEFCFA",
  tableLayout: "fixed",
  minWidth: "1200px",
}

const tableRowStyle = {
  borderBottom: "1px solid #E8D5C4",
}

const funderNameStyle = {
  color: "#a67c52",
  textDecoration: "underline",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "0.75rem",
  lineHeight: "1.2",
}

const statusBadgeStyle = {
  borderRadius: "3px",
  fontWeight: "500",
  display: "inline-block",
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

const matchScoreStyle = {
  fontSize: "0.75rem",
  fontWeight: "500",
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
