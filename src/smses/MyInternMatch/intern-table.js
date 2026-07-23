"use client"

import { useState, useEffect, useMemo } from "react"
import { X, ExternalLink, Eye, ChevronRight, ChevronDown, SlidersHorizontal, GripVertical, RotateCcw, Settings, Trash2, Plus, LayoutGrid, CheckCircle } from "lucide-react"
import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "../../firebaseConfig"
import "react-day-picker/dist/style.css"
import { createPortal } from "react-dom"
import "react-circular-progressbar/dist/styles.css"
import emailjs from "@emailjs/browser"
import { API_KEYS } from "../../API"
import InternDetailsModal from "./InternDetailsModal"

// Replaced cities with South African provinces for location filter
const southAfricanProvinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
].sort((a, b) => a.localeCompare(b))

// Comprehensive list of South African universities and colleges
const southAfricanInstitutions = [
  // Traditional Universities
  "University of Cape Town (UCT)",
  "University of the Witwatersrand (Wits)",
  "Stellenbosch University",
  "University of Pretoria (UP)",
  "University of KwaZulu-Natal (UKZN)",
  "Rhodes University",
  "University of the Free State (UFS)",
  "University of Johannesburg (UJ)",
  "University of the Western Cape (UWC)",
  "University of Limpopo",
  "North-West University (NWU)",
  "University of Venda",
  "University of Fort Hare",
  "University of Zululand",
  "University of South Africa (UNISA)",
  "Nelson Mandela University",
  "University of Mpumalanga",
  "Sefako Makgatho Health Sciences University",
  "Sol Plaatje University",

  // Universities of Technology
  "Cape Peninsula University of Technology (CPUT)",
  "Central University of Technology (CUT)",
  "Durban University of Technology (DUT)",
  "Mangosuthu University of Technology (MUT)",
  "Tshwane University of Technology (TUT)",
  "Vaal University of Technology (VUT)",
  "Walter Sisulu University",

  // TVET Colleges - Eastern Cape
  "Buffalo City TVET College",
  "Eastcape Midlands TVET College",
  "Ikhala TVET College",
  "Ingwe TVET College",
  "King Hintsa TVET College",
  "King Sabata Dalindyebo TVET College",
  "Lovedale TVET College",
  "Port Elizabeth TVET College",

  // TVET Colleges - Free State
  "Flavius Mareka TVET College",
  "Goldfields TVET College",
  "Maluti TVET College",
  "Motheo TVET College",

  // TVET Colleges - Gauteng
  "Central Johannesburg TVET College",
  "Ekurhuleni East TVET College",
  "Ekurhuleni West TVET College",
  "Sedibeng TVET College",
  "South West Gauteng TVET College",
  "Tshwane North TVET College",
  "Tshwane South TVET College",
  "Western TVET College",

  // TVET Colleges - KwaZulu-Natal
  "Coastal KZN TVET College",
  "Elangeni TVET College",
  "Esayidi TVET College",
  "Majuba TVET College",
  "Mnambithi TVET College",
  "Mthashana TVET College",
  "Thekwini TVET College",
  "Umfolozi TVET College",
  "Umgungundlovu TVET College",

  // TVET Colleges - Limpopo
  "Capricorn TVET College",
  "Lephalale TVET College",
  "Letaba TVET College",
  "Mopani South East TVET College",
  "Sekhukhune TVET College",
  "Vhembe TVET College",
  "Waterberg TVET College",

  // TVET Colleges - Mpumalanga
  "Ehlanzeni TVET College",
  "Gert Sibande TVET College",
  "Nkangala TVET College",

  // TVET Colleges - North West
  "ORBIT TVET College",
  "Taletso TVET College",
  "Vuselela TVET College",

  // TVET Colleges - Northern Cape
  "Northern Cape Rural TVET College",
  "Northern Cape Urban TVET College",

  // TVET Colleges - Western Cape
  "Boland TVET College",
  "College of Cape Town",
  "False Bay TVET College",
  "Northlink TVET College",
  "South Cape TVET College",
  "West Coast TVET College",

  // Private Colleges and Institutions
  "Damelin",
  "Boston City Campus",
  "Varsity College",
  "Rosebank College",
  "CTI Education Group",
  "Pearson Institute of Higher Education (formerly Midrand Graduate Institute)",
  "Monash South Africa",
  "AFDA (The South African School of Motion Picture Medium and Live Performance)",
  "IMM Graduate School",
  "Milpark Education",
  "Regent Business School",
  "MANCOSA",
  "Richfield Graduate Institute of Technology",
  "IIE (The Independent Institute of Education)",
  "CTU Training Solutions",
  "Oxbridge Academy",
  "Boston Media House",

  // Other
  "Other",
].sort((a, b) => a.localeCompare(b))

// Degree options as specified by user
const degreeOptions = [
  // Undergraduate Degrees
  {
    group: "Undergraduate Degrees",
    options: [
      "Bachelor of Commerce (BCom)",
      "Bachelor of Business Administration (BBA)",
      "Bachelor of Arts (BA)",
      "Bachelor of Science (BSc)",
      "Bachelor of Engineering (BEng)",
      "Bachelor of Technology (BTech)",
      "Bachelor of Education (BEd)",
      "Bachelor of Law (LLB)",
      "Bachelor of Medicine (MBChB)",
      "Bachelor of Accounting Science (BAcc)",
      "Bachelor of Social Work (BSW)",
      "Bachelor of Fine Arts (BFA)",
    ],
  },
  // Diplomas
  {
    group: "Diplomas",
    options: ["National Diploma", "Higher Certificate", "Advanced Diploma", "Postgraduate Diploma"],
  },
  // TVET Qualifications
  {
    group: "TVET Qualifications",
    options: ["N6 Certificate", "N5 Certificate", "N4 Certificate", "NCV Level 4", "NCV Level 3", "NCV Level 2"],
  },
  // Postgraduate
  { group: "Postgraduate", options: ["Honours Degree", "Master's Degree", "Doctoral Degree (PhD)"] },
  // Other
  { group: "Other", options: ["Other"] },
]

const formatLabel = (value) => {
  if (!value) return ""

  try {
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
  } catch (error) {
    console.error("Error formatting label:", error)
    return value || ""
  }
}

// Text truncation component with line limit
const TruncatedText = ({ text, maxLength = 30 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span style={{ color: "#a89482", fontSize: "0.75rem" }}>{text || "-"}</span>
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

// Score color function
const getScoreColor = (score) => {
  if (score >= 80) return "#22c55e" // Green
  if (score >= 60) return "#f59e0b" // Orange
  return "#ef4444" // Red
}

// Status definitions with colors
const STATUS_TYPES = {
  Shortlisted: {
    color: "#FFF3E0",
    textColor: "#F57C00",
  },
  "Contacted/Interview": {
    color: "#F3E5F5",
    textColor: "#7B1FA2",
  },
  Confirmed: {
    color: "#E8F5E8",
    textColor: "#388E3C",
  },
  "Confirmed/Term Sheet Sign": {
    color: "#E8F5E8",
    textColor: "#388E3C",
  },
  Declined: {
    color: "#FFEBEE",
    textColor: "#D32F2F",
  },
  Accepted: {
    color: "#E8F5E8",
    textColor: "#388E3C",
  },
  Completed: {
    color: "#FFEBEE",
    textColor: "#388E3C",
  },
}

const modalCloseButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  color: "#666",
  position: "absolute",
  top: "20px",
  right: "20px",
  padding: "8px",
  borderRadius: "50%",
  transition: "all 0.2s ease",
  ":hover": {
    backgroundColor: "#f5f5f5",
  },
}

const getStatusStyle = (status) => {
  return STATUS_TYPES[status] || { color: "#F5F5F5", textColor: "#666666" }
}

// Match calculation function (you can customize this based on your matching criteria)
const calculateMatchScore = (internData, sponsorData) => {
  const internProfile = internData?.formData || {}
  const sponsorIR = sponsorData?.internshipRequest || {}
  const sponsorJob = sponsorData?.jobOverview || {}

  let score = 0

  // Initialize breakdown object
  const breakdown = {
    skillsMatch: { score: 0, maxScore: 30, matched: false, description: "", details: {} },
    workModeMatch: { score: 0, maxScore: 25, matched: false, description: "", details: {} },
    locationMatch: { score: 0, maxScore: 20, matched: false, description: "", details: {} },
    availabilityMatch: { score: 0, maxScore: 15, matched: false, description: "", details: {} },
    additionalFactors: { score: 0, maxScore: 10, matched: false, description: "", details: {} },
  }

  // 1. Skills/Role Match (30%)
  const internSkills = internProfile?.skillsInterests?.technicalSkills || []
  const sponsorRole = sponsorIR?.internRolesText || ""
  const sponsorSkills = sponsorJob?.preferredSkills || []

  let skillsMatch = false
  if (internSkills.length > 0 && (sponsorRole || sponsorSkills.length > 0)) {
    skillsMatch = internSkills.some(
      (skill) =>
        sponsorRole.toLowerCase().includes(skill.toLowerCase()) ||
        sponsorSkills.some((reqSkill) => reqSkill.toLowerCase().includes(skill.toLowerCase())),
    )
  }

  breakdown.skillsMatch.details = {
    internSkills: internSkills,
    sponsorRole: sponsorRole,
    sponsorSkills: sponsorSkills,
  }

  if (skillsMatch) {
    breakdown.skillsMatch.score = 30
    breakdown.skillsMatch.matched = true
    breakdown.skillsMatch.description = `Your skills (${internSkills.join(", ")}) match the required role: ${sponsorRole}`
    score += 30
  } else {
    breakdown.skillsMatch.description =
      internSkills.length > 0
        ? `Your skills (${internSkills.join(", ")}) don't match the required role: ${sponsorRole || "Not specified"}`
        : "No technical skills specified in your profile"
  }

  // 2. Work Mode / Location Flexibility (25%)
  const internLocationFlexibility = internProfile?.academicOverview?.locationFlexibility || []
  const sponsorType = sponsorIR?.internType || ""

  let workModeMatch = false
  if (internLocationFlexibility.length > 0) {
    for (const flexibility of internLocationFlexibility) {
      const flexLower = flexibility.toLowerCase()
      const sponsorLower = sponsorType.toLowerCase()

      if (flexLower === "all") {
        workModeMatch = true
        break
      }

      if (flexLower === sponsorLower) {
        workModeMatch = true
        break
      }

      if (
        (flexLower === "hybrid" && (sponsorLower === "remote" || sponsorLower === "in-person")) ||
        (flexLower === "remote" && sponsorLower === "hybrid") ||
        (flexLower === "in-person" && sponsorLower === "hybrid")
      ) {
        workModeMatch = true
        break
      }
    }
  }

  breakdown.workModeMatch.details = {
    internFlexibility: internLocationFlexibility,
    sponsorType: sponsorType,
  }

  if (workModeMatch) {
    breakdown.workModeMatch.score = 25
    breakdown.workModeMatch.matched = true
    breakdown.workModeMatch.description = `Your flexibility (${internLocationFlexibility.join(", ")}) is compatible with ${sponsorType}`
    score += 25
  } else {
    breakdown.workModeMatch.description = `Your flexibility (${internLocationFlexibility.join(", ")}) is not compatible with ${sponsorType}`
  }

  // 3. Location Match (20%)
  let locationScore = 0
  const isLocationRelevant = sponsorType.toLowerCase() === "in-person" || sponsorType.toLowerCase() === "hybrid"
  const internHasAll = internLocationFlexibility.some((flex) => flex.toLowerCase() === "all")
  const internHasRemoteOnly =
    internLocationFlexibility.length === 1 && internLocationFlexibility[0].toLowerCase() === "remote"
  const internHasRemote = internLocationFlexibility.some((flex) => flex.toLowerCase() === "remote")

  const sponsorProvince = sponsorJob?.province || ""
  const sponsorCities = sponsorJob?.cities || []
  const internProvinces = internProfile?.personalOverview?.provinces || []
  const internCities = internProfile?.personalOverview?.cities || []

  breakdown.locationMatch.details = {
    isLocationRelevant,
    sponsorProvince,
    sponsorCities,
    internProvinces,
    internCities,
    internHasAll,
    internHasRemote,
  }

  if (!isLocationRelevant || (internHasRemoteOnly && sponsorType.toLowerCase() === "remote")) {
    locationScore = 20
    breakdown.locationMatch.description = "Full score for remote work compatibility"
  } else if (internHasAll) {
    locationScore = 20
    breakdown.locationMatch.description = "Full score - you selected 'All' locations"
  } else if (internHasRemote && !isLocationRelevant) {
    locationScore = 20
    breakdown.locationMatch.description = "Full score for remote capability match"
  } else {
    const provinceMatch = internProvinces.some((province) => province.toLowerCase() === sponsorProvince.toLowerCase())
    const cityMatch = internCities.some((city) =>
      sponsorCities.some((sponsorCity) => city.toLowerCase() === sponsorCity.toLowerCase()),
    )

    if (provinceMatch || cityMatch) {
      locationScore = 20
      breakdown.locationMatch.description = `Location match: ${provinceMatch ? "Same province" : "Same city"}`
    } else if (internProvinces.length > 1 || internCities.length > 1) {
      locationScore = 10
      breakdown.locationMatch.description = "Partial score for geographic flexibility"
    } else if (internHasRemote && sponsorType.toLowerCase() === "hybrid") {
      locationScore = 15
      breakdown.locationMatch.description = "Partial score - remote capability with hybrid role"
    } else {
      breakdown.locationMatch.description = `No location match: You (${internProvinces.join(", ")}) vs Required (${sponsorProvince})`
    }
  }

  breakdown.locationMatch.score = locationScore
  score += locationScore

  // 4. Availability Date Match (15%)
  const internStartDate = internProfile?.skillsInterests?.availabilityStart || ""
  const sponsorStartDate = sponsorIR?.startDate || ""
  let availabilityScore = 0

  breakdown.availabilityMatch.details = {
    internStartDate,
    sponsorStartDate,
  }

  if (internStartDate && sponsorStartDate) {
    const internStart = new Date(internStartDate)
    const sponsorStart = new Date(sponsorStartDate)
    const daysDiff = Math.abs((internStart - sponsorStart) / (1000 * 60 * 60 * 24))

    if (internStart <= sponsorStart) {
      availabilityScore = 15
      breakdown.availabilityMatch.description = `Perfect timing - you're available from ${internStartDate}, they need ${sponsorStartDate}`
    } else if (daysDiff <= 30) {
      availabilityScore = 10
      breakdown.availabilityMatch.description = `Good timing - only ${Math.round(daysDiff)} days difference`
    } else if (daysDiff <= 60) {
      availabilityScore = 5
      breakdown.availabilityMatch.description = `Acceptable timing - ${Math.round(daysDiff)} days difference`
    } else {
      breakdown.availabilityMatch.description = `Poor timing - ${Math.round(daysDiff)} days difference`
    }
  } else {
    breakdown.availabilityMatch.description = `Missing availability data: Your start: ${internStartDate || "Not set"}, Required: ${sponsorStartDate || "Not set"}`
  }

  breakdown.availabilityMatch.score = availabilityScore
  breakdown.availabilityMatch.matched = availabilityScore > 0
  score += availabilityScore

  // 5. Additional Factors (10%)
  let additionalScore = 0
  const hasGradYear = internProfile.academicOverview?.graduationYear ? 1 : 0
  const hasInternType = sponsorIR.internType ? 1 : 0

  additionalScore = hasGradYear + hasInternType

  breakdown.additionalFactors.score = additionalScore
  breakdown.additionalFactors.matched = additionalScore > 0
  breakdown.additionalFactors.details = {
    hasGradYear,
    hasInternType,
    graduationYear: internProfile.academicOverview?.graduationYear,
    internType: sponsorIR.internType,
  }

  if (additionalScore > 0) {
    breakdown.additionalFactors.description = `Profile completeness bonus: ${hasGradYear ? "Has graduation year" : ""} ${hasInternType ? "Has internship type" : ""}`
  } else {
    breakdown.additionalFactors.description =
      "No profile completeness bonus - missing graduation year or internship type"
  }

  score += additionalScore

  return {
    score: Math.min(score, 100),
    breakdown: breakdown,
  }
}

const PIPELINE_STAGES = [
  "applied",
  "requested",
  "matched",
  "shortlisted",
  "interviewed",
  "confirmed",
  "accepted",
  "contract_signed",
  "active",
  "completed",
  "declined",
]

// Map status types to pipeline stages
const STATUS_TO_PIPELINE_MAP = {
  Applied: "applied",
  Requested: "requested",
  Matched: "matched",
  Shortlisted: "shortlisted",
  "Contacted/Interview": "interviewed",
  Interviewed: "interviewed",
  Confirmed: "confirmed",
  "Confirmed/Term Sheet Sign": "confirmed",
  Accepted: "accepted",
  Contract_signed: "contract_signed",
  Active: "active",
  Completed: "completed",
  Declined: "declined",
  Decline: "declined",
}

// Custom next stage mappings for special cases
const CUSTOM_NEXT_STAGE_MAP = {
  applied: "interviewed", // Applied → Interviewed (skip requested, matched, shortlisted)
  requested: "accepted", // Requested → Accepted (skip matched, shortlisted, interviewed, confirmed)
}

// Next Stage Indicator Component
const NextStageIndicator = ({ currentStage, onStageUpdate, isLoading }) => {
  // Get the current stage index
  const getCurrentStageIndex = () => {
    if (!currentStage) return -1

    // If it's a status type, map it to pipeline stage
    const pipelineStage = STATUS_TO_PIPELINE_MAP[currentStage] || currentStage.toLowerCase()
    return PIPELINE_STAGES.indexOf(pipelineStage)
  }

  const currentIndex = getCurrentStageIndex()
  const currentPipelineStage = currentIndex >= 0 ? PIPELINE_STAGES[currentIndex] : null

  // Determine the next stage - check for custom mappings first
  let nextStage = null
  if (currentPipelineStage && CUSTOM_NEXT_STAGE_MAP[currentPipelineStage]) {
    nextStage = CUSTOM_NEXT_STAGE_MAP[currentPipelineStage]
  } else if (currentIndex < PIPELINE_STAGES.length - 1 && currentIndex >= 0) {
    nextStage = PIPELINE_STAGES[currentIndex + 1]
  }

  // Function to format stage name for display
  const formatStageName = (stage) => {
    if (!stage) return ""

    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  if (currentIndex === -1) {
    return (
      <div
        style={{
          padding: "4px 8px",
          backgroundColor: "#f5f0e1",
          borderRadius: "4px",
          fontSize: "12px",
          color: "#a89482",
          display: "inline-block",
        }}
      >
        Unknown stage
      </div>
    )
  }

  if (!nextStage) {
    return (
      <div
        style={{
          padding: "4px 8px",
          backgroundColor: "#f5f0e1",
          borderRadius: "4px",
          fontSize: "12px",
          color: "#a89482",
          display: "inline-block",
        }}
      >
        Final stage
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <ChevronRight size={14} color="#7d5a50" />
        <span
          style={{
            fontSize: "12px",
            fontWeight: "500",
            color: "#4a352f",
          }}
        >
          {formatStageName(nextStage)}
        </span>
      </div>
    </div>
  )
}

// Sample Intern Data (for initial load or when no data is found)
// Standalone version of NextStageIndicator's stage-resolution logic, for use
// by the Next Stage column filter (which needs a plain string, not a
// rendered component). NextStageIndicator itself is untouched.
const computeNextStageName = (currentStage) => {
  if (!currentStage) return ""
  const pipelineStage = STATUS_TO_PIPELINE_MAP[currentStage] || currentStage.toLowerCase()
  const currentIndex = PIPELINE_STAGES.indexOf(pipelineStage)
  if (currentIndex === -1) return ""

  let nextStage = null
  if (CUSTOM_NEXT_STAGE_MAP[pipelineStage]) {
    nextStage = CUSTOM_NEXT_STAGE_MAP[pipelineStage]
  } else if (currentIndex < PIPELINE_STAGES.length - 1) {
    nextStage = PIPELINE_STAGES[currentIndex + 1]
  }
  if (!nextStage) return ""

  return nextStage
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const sampleInterns = []

// Helper to extract the first URL from an array of document objects
const firstUrl = (arr) => (Array.isArray(arr) && arr.length > 0 && arr[0] && arr[0].url ? arr[0].url : null)

// Helper to convert Firestore timestamps or strings to Date objects safely
const toDateSafe = (ts) => {
  if (!ts) return null
  if (typeof ts === "string") return new Date(ts)
  if (typeof ts.toDate === "function") return ts.toDate()
  if (ts.seconds != null) return new Date(ts.seconds * 1000)
  return null
}

// Helper to generate match score for profiles not yet applied
const calculateMatchScoreForSponsor = (smeData, internProfileData) => {
  const internProfile = internProfileData?.formData || {}
  const sponsorIR = smeData?.internshipRequest || {}
  const sponsorJob = smeData?.jobOverview || {}

  let score = 0

  const breakdown = {
    skillsMatch: { score: 0, maxScore: 30, matched: false, description: "", details: {} },
    workModeMatch: { score: 0, maxScore: 25, matched: false, description: "", details: {} },
    locationMatch: { score: 0, maxScore: 20, matched: false, description: "", details: {} },
    availabilityMatch: { score: 0, maxScore: 15, matched: false, description: "", details: {} },
    additionalFactors: { score: 0, maxScore: 10, matched: false, description: "", details: {} },
  }

  // Skills/Role Match
  const internSkills = internProfile?.skillsInterests?.technicalSkills || []
  const sponsorRole = sponsorIR?.internRolesText || ""
  const sponsorSkills = sponsorJob?.preferredSkills || []

  let skillsMatch = false
  if (internSkills.length > 0 && (sponsorRole || sponsorSkills.length > 0)) {
    skillsMatch = internSkills.some(
      (skill) =>
        sponsorRole.toLowerCase().includes(skill.toLowerCase()) ||
        sponsorSkills.some((reqSkill) => reqSkill.toLowerCase().includes(skill.toLowerCase())),
    )
  }
  breakdown.skillsMatch.details = { internSkills, sponsorRole, sponsorSkills }
  if (skillsMatch) {
    breakdown.skillsMatch.score = 30
    breakdown.skillsMatch.matched = true
    breakdown.skillsMatch.description = `Skills align with role`
    score += 30
  } else {
    breakdown.skillsMatch.description = "Skills do not fully align with role"
  }

  // Work Mode Compatibility
  const internLocationFlexibility = internProfile?.academicOverview?.locationFlexibility || []
  const sponsorType = sponsorIR?.internType || ""
  let workModeMatch = false
  if (internLocationFlexibility.length > 0) {
    for (const flexibility of internLocationFlexibility) {
      const flexLower = flexibility.toLowerCase()
      const sponsorLower = sponsorType.toLowerCase()
      if (
        flexLower === "all" ||
        flexLower === sponsorLower ||
        (flexLower === "hybrid" && (sponsorLower === "remote" || sponsorLower === "in-person")) ||
        (flexLower === "remote" && sponsorLower === "hybrid") ||
        (flexLower === "in-person" && sponsorLower === "hybrid")
      ) {
        workModeMatch = true
        break
      }
    }
  }
  breakdown.workModeMatch.details = { internFlexibility: internLocationFlexibility, sponsorType }
  if (workModeMatch) {
    breakdown.workModeMatch.score = 25
    breakdown.workModeMatch.matched = true
    breakdown.workModeMatch.description = `Work mode compatible`
    score += 25
  } else {
    breakdown.workModeMatch.description = "Work mode not compatible"
  }

  // Location Match
  let locationScore = 0
  const isLocationRelevant = sponsorType.toLowerCase() === "in-person" || sponsorType.toLowerCase() === "hybrid"
  const internHasAll = internLocationFlexibility.some((flex) => flex.toLowerCase() === "all")
  const internHasRemoteOnly =
    internLocationFlexibility.length === 1 && internLocationFlexibility[0].toLowerCase() === "remote"
  const internHasRemote = internLocationFlexibility.some((flex) => flex.toLowerCase() === "remote")
  const sponsorProvince = sponsorJob?.province || ""
  const sponsorCities = sponsorJob?.cities || []
  const internProvinces = internProfile?.personalOverview?.provinces || []
  const internCities = internProfile?.personalOverview?.cities || []

  breakdown.locationMatch.details = {
    isLocationRelevant,
    sponsorProvince,
    sponsorCities,
    internProvinces,
    internCities,
    internHasAll,
    internHasRemote,
  }
  if (!isLocationRelevant || (internHasRemoteOnly && sponsorType.toLowerCase() === "remote")) {
    locationScore = 20
    breakdown.locationMatch.description = "Full score for remote work"
  } else if (internHasAll) {
    locationScore = 20
    breakdown.locationMatch.description = "Intern selected All locations"
  } else if (internHasRemote && !isLocationRelevant) {
    locationScore = 20
    breakdown.locationMatch.description = "Full score for remote capability"
  } else {
    const provinceMatch = internProvinces.some((p) => p.toLowerCase() === sponsorProvince.toLowerCase())
    const cityMatch = internCities.some((c) => sponsorCities.some((sc) => c.toLowerCase() === sc.toLowerCase()))
    if (provinceMatch || cityMatch) {
      locationScore = 20
      breakdown.locationMatch.description = "Location match found"
    } else if (internProvinces.length > 1 || internCities.length > 1) {
      locationScore = 10
      breakdown.locationMatch.description = "Partial location flexibility"
    } else if (internHasRemote && sponsorType.toLowerCase() === "hybrid") {
      locationScore = 15
      breakdown.locationMatch.description = "Remote capability with hybrid role"
    } else {
      breakdown.locationMatch.description = "No location match"
    }
  }
  breakdown.locationMatch.score = locationScore
  score += locationScore

  // Availability Match
  const internStartDate = internProfile?.skillsInterests?.availabilityStart || ""
  const sponsorStartDate = sponsorIR?.startDate || ""
  let availabilityScore = 0
  breakdown.availabilityMatch.details = { internStartDate, sponsorStartDate }
  if (internStartDate && sponsorStartDate) {
    const internStart = new Date(internStartDate)
    const sponsorStart = new Date(sponsorStartDate)
    const daysDiff = Math.abs((internStart - sponsorStart) / (1000 * 60 * 60 * 24))
    if (internStart <= sponsorStart) {
      availabilityScore = 15
      breakdown.availabilityMatch.description = "Perfect timing"
    } else if (daysDiff <= 30) {
      availabilityScore = 10
      breakdown.availabilityMatch.description = "Good timing"
    } else if (daysDiff <= 60) {
      availabilityScore = 5
      breakdown.availabilityMatch.description = "Acceptable timing"
    } else {
      breakdown.availabilityMatch.description = "Poor timing"
    }
  } else {
    breakdown.availabilityMatch.description = "Missing availability data"
  }
  breakdown.availabilityMatch.score = availabilityScore
  breakdown.availabilityMatch.matched = availabilityScore > 0
  score += availabilityScore

  // Additional Factors
  let additionalScore = 0
  additionalScore = (internProfile.academicOverview?.graduationYear ? 1 : 0) + (sponsorIR.internType ? 1 : 0)
  breakdown.additionalFactors.score = additionalScore
  breakdown.additionalFactors.matched = additionalScore > 0
  breakdown.additionalFactors.details = {
    hasGradYear: internProfile.academicOverview?.graduationYear,
    hasInternType: sponsorIR.internType,
  }
  breakdown.additionalFactors.description = additionalScore > 0 ? "Profile completeness bonus" : "No bonus"
  score += additionalScore

  return { score: Math.min(score, 100), breakdown }
}

const MatchBreakdownModal = ({ intern, onClose }) => {
  // Safely extract matching data with defaults
  const matchAnalysis = intern?.matchAnalysis || {
    breakdown: {
      availabilityAlignment: {
        score: 0,
        maxScore: 15,
        description: "Availability data not available",
      },
      locationCompatibility: {
        score: 0,
        maxScore: 20,
        description: "Location data not available",
      },
      profileCompleteness: {
        score: 0,
        maxScore: 10,
        description: "Profile data not available",
      },
      skillsMatch: {
        score: 0,
        maxScore: 30,
        description: "Skills data not available",
      },
      workModeCompatibility: {
        score: 0,
        maxScore: 25,
        description: "Work mode data not available",
      },
    },
    matchSummary: {
      overallScore: 0,
      matchPercentage: intern?.matchPercentage || 0,
      overallAssessment: "No assessment available",
      strongPoints: ["No strengths data available"],
      weakPoints: [],
    },
  }

  const { breakdown = {}, matchSummary = {} } = matchAnalysis

  const {
    availabilityAlignment = {},
    locationCompatibility = {},
    profileCompleteness = {},
    skillsMatch = {},
    workModeCompatibility = {},
  } = breakdown

  const {
    overallAssessment = "No assessment",
    matchPercentage = intern?.matchPercentage,
    strongPoints = [],
    weakPoints = [],
  } = matchSummary

  // Prepare data for display matching supplier structure
  const matchDetails = {
    skillsMatch: {
      description: "Skills/Role Match",
      score: skillsMatch.score || 0,
      maxScore: skillsMatch.maxScore || 30,
      weight: 30,
    },
    workModeMatch: {
      description: "Work Mode Compatibility",
      score: workModeCompatibility.score || 0,
      maxScore: workModeCompatibility.maxScore || 25,
      weight: 25,
    },
    locationMatch: {
      description: "Location Compatibility",
      score: locationCompatibility.score || 0,
      maxScore: locationCompatibility.maxScore || 20,
      weight: 20,
    },
    availabilityMatch: {
      description: "Availability Alignment",
      score: availabilityAlignment.score || 0,
      maxScore: availabilityAlignment.maxScore || 15,
      weight: 15,
    },
    profileMatch: {
      description: "Profile Completeness",
      score: profileCompleteness.score || 0,
      maxScore: profileCompleteness.maxScore || 10,
      weight: 10,
    },
  }

  const getImprovementSuggestion = (key, score) => {
    const suggestions = {
      skillsMatch: "Consider highlighting transferable skills or willingness to learn new technologies.",
      workModeMatch: "Discuss flexibility in work arrangements and willingness to adapt.",
      locationMatch: "Consider remote work possibilities or discuss relocation options.",
      availabilityMatch: "Discuss flexible start dates that work for both parties.",
      profileMatch: "Complete all profile sections to improve your match score.",
    }
    return suggestions[key] || "Review your profile to ensure all relevant information is complete."
  }

  return (
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
      onClick={onClose}
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
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.5rem",
            borderBottom: "1px solid #e6d7c3",
            background: "#faf7f2",
          }}
        >
          <h3
            style={{
              margin: "0",
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#4a352f",
            }}
          >
            Match Breakdown - {intern?.internName || "Applicant"}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.25rem",
              cursor: "pointer",
              color: "#4a352f",
              padding: "0.25rem",
            }}
          >
            ✖
          </button>
        </div>

        <div style={{ padding: "1.5rem" }}>
          {/* Overall Score Section */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "2rem",
              paddingBottom: "1rem",
              borderBottom: "2px solid #e6d7c3",
            }}
          >
            <div
              style={{
                fontSize: "3rem",
                fontWeight: "bold",
                color: matchPercentage >= 80 ? "#388E3C" : matchPercentage >= 60 ? "#F57C00" : "#D32F2F",
                marginBottom: "0.5rem",
              }}
            >
              {matchPercentage}%
            </div>
            <p
              style={{
                fontSize: "1rem",
                color: "#7d5a50",
                margin: "0",
              }}
            >
              Overall Match Score
            </p>
          </div>

          {/* Match Details Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            {Object.entries(matchDetails).map(([key, details]) => {
              const percentage = details.maxScore > 0 ? (details.score / details.maxScore) * 100 : 0
              const scoreColor = percentage >= 80 ? "#388E3C" : percentage >= 50 ? "#F57C00" : "#D32F2F"

              return (
                <div
                  key={key}
                  style={{
                    background: "#faf7f2",
                    border: "1px solid #e6d7c3",
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
                        color: "#4a352f",
                        margin: "0",
                        lineHeight: "1.3",
                        flex: "1",
                      }}
                    >
                      {details.description}
                    </h4>
                    <span
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: "bold",
                        color: scoreColor,
                        marginLeft: "1rem",
                      }}
                    >
                      {Math.round(percentage)}%
                    </span>
                  </div>

                  <div
                    style={{
                      background: "#e6d7c3",
                      borderRadius: "4px",
                      height: "8px",
                      overflow: "hidden",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background: scoreColor,
                        width: `${percentage}%`,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#7d5a50",
                      }}
                    >
                      Weight: {details.weight}%
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#7d5a50",
                      }}
                    >
                      Contribution: {Math.round((percentage * details.weight) / 100)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Improvement Suggestions */}
          <div
            style={{
              background: "#f5f0e1",
              border: "1px solid #e6d7c3",
              borderRadius: "8px",
              padding: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <h4
              style={{
                fontSize: "1rem",
                fontWeight: "600",
                color: "#4a352f",
                margin: "0 0 1rem 0",
              }}
            >
              How to Improve Your Match Score:
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "1rem",
              }}
            >
              {Object.entries(matchDetails)
                .filter(([key, details]) => {
                  const percentage = details.maxScore > 0 ? (details.score / details.maxScore) * 100 : 0
                  return percentage < 70
                })
                .map(([key, details]) => (
                  <div
                    key={key}
                    style={{
                      background: "white",
                      border: "1px solid #e6d7c3",
                      borderRadius: "6px",
                      padding: "1rem",
                    }}
                  >
                    <h5
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#D32F2F",
                        margin: "0 0 0.5rem 0",
                      }}
                    >
                      {details.description}
                    </h5>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "#4a352f",
                        margin: "0",
                        lineHeight: "1.4",
                      }}
                    >
                      {getImprovementSuggestion(key, details.score)}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Close Button */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={onClose}
              style={{
                padding: "12px 32px",
                backgroundColor: "#7d5a50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "1rem",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Column config (drag order + filters + widths) ─────────────────────────
// Every column has a filter, matching the catalyst/accelerator tables' design.
const COLUMN_DEFS = {
  location: { label: "Location", minWidth: "88px", filterType: "location" },
  institution: { label: "Institution", minWidth: "104px", filterType: "institution" },
  degree: { label: "Degree", minWidth: "92px", filterType: "degree" },
  field: { label: "Field", minWidth: "92px", filterType: "field" },
  locationFlexibility: { label: "Location Flexibility", minWidth: "112px", filterType: "locationFlexibility" },
  role: { label: "Role", minWidth: "92px", filterType: "role" },
  fundingProgramType: { label: "Funding Program", minWidth: "104px", filterType: "fundingProgramType" },
  matchPercentage: { label: "Match %", align: "center", minWidth: "110px", filterType: "match" },
  bigScore: { label: "BIG Score", align: "center", minWidth: "100px", filterType: "bigScore" },
  status: { label: "Status", minWidth: "100px", filterType: "status" },
  nextStage: { label: "Next Stage", minWidth: "100px", filterType: "nextStage" },
}
const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS)
const DEFAULT_COLUMN_VISIBILITY = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, true]))
const DEFAULT_DENSITY = "comfortable"

// ─── Custom Views (same model as the catalyst/accelerator tables) ──────────
const BUILTIN_VIEW_ID = "__default__"
const VIEWS_STORAGE_KEY = "intern-table-views-v1"

const sanitizeColumnOrder = (order) => {
  if (!Array.isArray(order)) return [...DEFAULT_COLUMN_ORDER]
  const known = new Set(DEFAULT_COLUMN_ORDER)
  const deduped = order.filter((key) => known.has(key))
  const missing = DEFAULT_COLUMN_ORDER.filter((key) => !deduped.includes(key))
  return [...deduped, ...missing]
}
const createDefaultViewLayout = () => ({
  columnVisibility: { ...DEFAULT_COLUMN_VISIBILITY },
  columnOrder: [...DEFAULT_COLUMN_ORDER],
  density: DEFAULT_DENSITY,
})
const createBuiltinDefaultView = () => ({ id: BUILTIN_VIEW_ID, name: "Default", description: "", builtin: true, ...createDefaultViewLayout() })
const sanitizeView = (view, fallbackId) => ({
  id: view?.id || fallbackId,
  name: (view?.name || "Untitled view").toString(),
  description: (view?.description || "").toString(),
  builtin: !!view?.builtin,
  columnVisibility: { ...DEFAULT_COLUMN_VISIBILITY, ...(view?.columnVisibility || {}) },
  columnOrder: sanitizeColumnOrder(view?.columnOrder),
  density: view?.density || DEFAULT_DENSITY,
})
const loadViewsState = () => {
  const freshDefault = () => ({ activeViewId: BUILTIN_VIEW_ID, views: { [BUILTIN_VIEW_ID]: createBuiltinDefaultView() } })
  if (typeof window === "undefined") return freshDefault()
  try {
    const saved = JSON.parse(window.localStorage.getItem(VIEWS_STORAGE_KEY) || "null")
    const rawViews = saved?.views && typeof saved.views === "object" ? saved.views : {}
    const views = {}
    Object.entries(rawViews).forEach(([id, v]) => { views[id] = sanitizeView(v, id) })
    views[BUILTIN_VIEW_ID] = views[BUILTIN_VIEW_ID]
      ? { ...views[BUILTIN_VIEW_ID], id: BUILTIN_VIEW_ID, name: "Default", builtin: true }
      : createBuiltinDefaultView()
    const activeViewId = saved?.activeViewId && views[saved.activeViewId] ? saved.activeViewId : BUILTIN_VIEW_ID
    return { activeViewId, views }
  } catch {
    return freshDefault()
  }
}
const persistViewsState = (state) => {
  if (typeof window === "undefined") return
  try { window.localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(state)) } catch {
    // Storage can fail (private browsing, quota) — table still works this session.
  }
}
const generateViewId = () => {
  try { return `view_${crypto.randomUUID()}` } catch { return `view_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }
}

const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

// Institution/degree option lists flattened for the filter chip UI (the
// full South African institution/degree lists already defined above).
const institutionFilterOptions = southAfricanInstitutions
const degreeFilterOptions = degreeOptions.flatMap((g) => g.options)

export function InternTablePage({ filters, stageFilter, matchesCount, profileMatchesCount, onMatchesCountChange }) {
  const [interns, setInterns] = useState([])
  const [filteredInterns, setFilteredInterns] = useState([])
  const [selectedIntern, setSelectedIntern] = useState(null)
  const [modalType, setModalType] = useState(null)
  const [message, setMessage] = useState("")
  const [interviewDate, setInterviewDate] = useState("")
  const [interviewTime, setInterviewTime] = useState("")
  const [interviewLocation, setInterviewLocation] = useState("")
  const [formErrors, setFormErrors] = useState({})
  const [showInternDetails, setShowInternDetails] = useState(false)
  const [selectedInternDetails, setSelectedInternDetails] = useState(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nextStage, setNextStage] = useState("")
  const [showStageModal, setShowStageModal] = useState(false)
  const [selectedInternForStage, setSelectedInternForStage] = useState(null)
  const [updatedStages, setUpdatedStages] = useState({})
  const [meetingTime, setMeetingTime] = useState("")
  const [meetingLocation, setMeetingLocation] = useState("")
  const [meetingPurpose, setMeetingPurpose] = useState("")
  const [termSheetFile, setTermSheetFile] = useState(null)
  const [statuses, setStatuses] = useState({})
  const [availabilities, setAvailabilities] = useState([])
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [tempDates, setTempDates] = useState([])
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" })
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [localFilters, setLocalFilters] = useState({
    name: "",
    location: [], institution: [], degree: [], field: [], locationFlexibility: [], fundingProgramType: [],
    role: "",
    matchRange: [0, 100], bigScoreRange: [0, 100],
    status: [], nextStage: [],
  })
  const [updatingStageForIntern, setUpdatingStageForIntern] = useState(null)

  // ─── Views (column visibility / order / density) ─────────────────────────
  const [viewsState, setViewsState] = useState(() => loadViewsState())
  const initialActiveView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]
  const [columnVisibility, setColumnVisibility] = useState(() => initialActiveView.columnVisibility)
  const [columnOrder, setColumnOrder] = useState(() => initialActiveView.columnOrder)
  const [density, setDensity] = useState(() => initialActiveView.density)

  const [showCustomizeMenu, setShowCustomizeMenu] = useState(false)
  const [customizeMenuRect, setCustomizeMenuRect] = useState(null)
  const [showNewViewForm, setShowNewViewForm] = useState(false)
  const [newViewName, setNewViewName] = useState("")
  const [newViewDescription, setNewViewDescription] = useState("")
  const [editingViewMeta, setEditingViewMeta] = useState(null)

  // Column drag-to-reorder
  const [draggedColumn, setDraggedColumn] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [dragHintRect, setDragHintRect] = useState(null)

  // Per-column header filters
  const [headerFilterOpen, setHeaderFilterOpen] = useState(null)

  const [bigScoreData, setBigScoreData] = useState({
    PresentationScore: { score: 0, color: "#000" },
    ProfessionalSkillsScore: { score: 0, color: "#000" },
    WorkExperienceScore: { score: 0, color: "#000" },
    AcademicScore: { score: 0, color: "#000" },
  })
  // State for the stage update modal
  const [selectedStage, setSelectedStage] = useState("")
  const [stageNotes, setStageNotes] = useState("")


  const [companyOwnerId, setCompanyOwnerId] = useState(null)
  const [isCompanyMember, setIsCompanyMember] = useState(false)
  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [userRole, setUserRole] = useState(null)


  const getStageFields = (stage) => {
    const fields = {
      showMessage: true,
      showAvailability: false,
      showInterview: false,
      showMeeting: false,
      showTermSheet: false,
      showNextStageButton: true,
    }

    switch (stage) {
      case "Contacted/Interview":
      case "Interviewed":
        fields.showInterview = true
        fields.showMeeting = true
        break
      case "Confirmed/Term Sheet Sign":
        fields.showTermSheet = true
        fields.showMeeting = true
        break
      case "Applied":
        fields.showMessage = true
        fields.showNextStageButton = true
        break
      case "Requested":
        fields.showMessage = true
        fields.showNextStageButton = true
        break
      case "Confirmed":
        fields.showMessage = true
        fields.showMeeting = true
        break
      case "Accepted":
        fields.showMessage = true
        fields.showNextStageButton = true
        break
      case "Declined":
        fields.showMessage = true
        fields.showNextStageButton = true
        break
      default:
        break
    }

    if (stage === "Contacted/Interview" || stage === "Interviewed" || stage === "Confirmed") {
      fields.showAvailability = true
    }

    return fields
  }

  const applicationStages = [
    { id: "applied", name: "Applied" },
    { id: "requested", name: "Requested" },
    { id: "matched", name: "Matched" },
    { id: "shortlisted", name: "Shortlisted" },
    { id: "interviewed", name: "Contacted/Interview" },
    { id: "confirmed", name: "Confirmed" },
    { id: "confirmed_ts", name: "Confirmed/Term Sheet Sign" },
    { id: "accepted", name: "Accepted" },
    { id: "contract_signed", name: "Contract Signed" },
    { id: "active", name: "Active" },
    { id: "completed", name: "Completed" },
    { id: "declined", name: "Declined" },
  ]

  const handleTimeChange = (type, value) => {
    setTimeSlot((prev) => ({ ...prev, [type]: value }))
  }

  const handleDateSelect = (selected) => {
    setTempDates(selected || [])
  }

  const saveSelectedDates = () => {
    const newAvailabilities = tempDates.map((date) => ({
      date,
      timeSlots: [{ start: timeSlot.start, end: timeSlot.end }],
      timeZone: timeZone,
      status: "available",
    }))
    setAvailabilities((prev) => [...prev, ...newAvailabilities])
    setShowCalendarModal(false)
    setTempDates([])
  }

  const removeAvailability = (dateToRemove) => {
    setAvailabilities((prev) => prev.filter((avail) => avail.date.getTime() !== dateToRemove.getTime()))
  }

  const loadApplicationAvailability = (intern) => {
    if (intern?.availableDates && Array.isArray(intern.availableDates)) {
      setAvailabilities(
        intern.availableDates.map((avail) => ({
          ...avail,
          date: new Date(avail.date),
          timeSlots: Array.isArray(avail.timeSlots) ? avail.timeSlots : [{ start: "09:00", end: "17:00" }],
          timeZone: avail.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        })),
      )
    } else {
      setAvailabilities([])
    }
  }

  const renderDocumentLink = (url, text) => {
    if (!url) return null
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#a67c52", textDecoration: "underline" }}>
        {text} <ExternalLink size={12} style={{ marginLeft: "4px" }} />
      </a>
    )
  }

  const handleMatchScoreBreakdown = (intern) => {
    setSelectedIntern(intern)
    setModalType("matchBreakdown")
  }

  const resetModal = () => {
    setSelectedIntern(null)
    setModalType(null)
  }


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


  useEffect(() => {
    const fetchInternApplications = async () => {
      if (!effectiveUserId) return

      setLoading(true)
      try {
        const user = auth.currentUser
        if (!user) {
          // console.log("No authenticated user")
          setLoading(false)
          return
        }

        const smeUserId = effectiveUserId
        const smeUserDoc = await getDoc(doc(db, "universalProfiles", smeUserId))
        const smeUserData = smeUserDoc.exists() ? smeUserDoc.data() : {}

        const applicationsQuery = query(collection(db, "internshipApplications"), where("sponsorId", "==", smeUserId))
        const applicationsSnapshot = await getDocs(applicationsQuery)

        const appliedInternIds = new Set()

        const applicationInterns = await Promise.all(
          applicationsSnapshot.docs.map(async (applicationDoc) => {
            try {
              const applicationData = applicationDoc.data()
              const internId = applicationData.applicantId

              if (!internId) {
                // console.log(`Application ${applicationDoc.id} has no applicantId`)
                return null
              }

              appliedInternIds.add(internId)

              let profileData = {
                formData: {
                  personalOverview: {},
                  educationalBackground: {},
                  skillsInterests: {},
                  programAffiliation: {},
                  requiredDocuments: {},
                },
                userEmail: null,
                completedSections: {},
                createdAt: null,
                lastUpdated: null,
              }

              try {
                const internProfileRef = doc(db, "internProfiles", internId)
                const internProfileSnap = await getDoc(internProfileRef)

                if (internProfileSnap.exists()) {
                  profileData = internProfileSnap.data()
                }
              } catch (profileError) {
                console.error(`Failed to fetch profile for intern ${internId}:`, profileError)
              }

              const formData = profileData.formData || {}
              const personalOverview = formData.personalOverview || {}
              const educationalBackground = formData.educationalBackground || {}
              const skillsInterests = formData.skillsInterests || {}
              const programAffiliation = formData.programAffiliation || {}
              const requiredDocuments = formData.requiredDocuments || profileData.requiredDocuments || {}

              // Fetch live evaluation scores from internEvaluations collection
              let evaluationScores = {
                academic: applicationData.aiAcademicScore || 0,
                bigInternScore: applicationData.bigScore || applicationData.bigInternScore || 0,
                professionalPresentation: applicationData.aiPresentationScore || 0,
                professionalSkills: applicationData.aiProfessionalSkillsScore || 0,
                workExperience: applicationData.aiWorkExperienceScore || 0,
              }
              try {
                const evalDoc = await getDoc(doc(db, "internEvaluations", internId))
                if (evalDoc.exists()) {
                  const evalScores = evalDoc.data().scores || {}
                  evaluationScores = {
                    academic: evalScores.academic ?? evaluationScores.academic,
                    bigInternScore: evalScores.bigInternScore ?? evaluationScores.bigInternScore,
                    professionalPresentation: evalScores.professionalPresentation ?? evaluationScores.professionalPresentation,
                    professionalSkills: evalScores.professionalSkills ?? evaluationScores.professionalSkills,
                    workExperience: evalScores.workExperience ?? evaluationScores.workExperience,
                  }
                }
              } catch (evalError) {
                console.warn(`Could not fetch live evaluation for intern ${internId}:`, evalError)
              }

              const bigScore = evaluationScores.bigInternScore
              const matchPercentage =
                applicationData.matchPercentage || applicationData.matchAnalysis?.overallScore || 0

              setBigScoreData({
                PresentationScore: {
                  score: evaluationScores.professionalPresentation,
                  color: getScoreColor(evaluationScores.professionalPresentation),
                },
                ProfessionalSkillsScore: {
                  score: evaluationScores.professionalSkills,
                  color: getScoreColor(evaluationScores.professionalSkills),
                },
                WorkExperienceScore: {
                  score: evaluationScores.workExperience,
                  color: getScoreColor(evaluationScores.workExperience),
                },
                AcademicScore: {
                  score: evaluationScores.academic,
                  color: getScoreColor(evaluationScores.academic),
                },
              })

              const availabilityData = applicationData.availableDates
                ? applicationData.availableDates.map((avail) => ({
                  ...avail,
                  date: new Date(avail.date),
                }))
                : []

              const extractDocUrl = (docArray) => {
                if (Array.isArray(docArray) && docArray.length > 0) {
                  return docArray[0].url || null
                }
                return null
              }

              return {
                id: applicationDoc.id,
                internId: internId,
                applicationId: applicationDoc.id,
                internName:
                  applicationData.applicantName ||
                  applicationData.internName ||
                  `${personalOverview.firstName || ""} ${personalOverview.lastName || ""}`.trim() ||
                  "Unnamed Intern",
                location:
                  applicationData.location || personalOverview.province || personalOverview.city || "Not specified",
                institution: applicationData.institution || educationalBackground.institution || "Not specified",
                degree:
                  applicationData.degree ||
                  educationalBackground.qualification ||
                  educationalBackground.degree ||
                  "Not specified",
                field:
                  applicationData.field ||
                  educationalBackground.fieldOfStudy ||
                  skillsInterests.industryInterests?.[0] ||
                  "Not specified",
                internType:
                  applicationData.internType ||
                  educationalBackground.currentLevel ||
                  skillsInterests.internTypePreference ||
                  "Not specified",
                role: applicationData.role || skillsInterests.careerGoals || "Not specified",
                sponsorName: programAffiliation.sponsorName || "Not specified",
                fundingProgramType: applicationData.funding || programAffiliation.fundingType || "Not specified",
                startDate: applicationData.startDate || skillsInterests.availabilityStart || "Not specified",
                bigScore: bigScore,
                evaluationScores: evaluationScores,
                matchPercentage: matchPercentage,
                status: applicationData.status || "Applied",
                pipelineStage: applicationData.status || "Applied",
                action: "Application Received",
                availableDates: availabilityData,
                locationFlexibility:
                  applicationData.locationFlexibility &&
                    applicationData.locationFlexibility[0] &&
                    applicationData.locationFlexibility[0] !== "N"
                    ? applicationData.locationFlexibility[0]
                    : skillsInterests.locationPreference && skillsInterests.locationPreference !== "N"
                      ? skillsInterests.locationPreference
                      : "Not specified",
                matchAnalysis: applicationData.matchAnalysis || null,
                profileEmail: profileData.userEmail || personalOverview.email,
                phone: personalOverview.phoneNumber,
                nationalId: personalOverview.nationalIdOrStudentNo,
                availabilityStart: skillsInterests.availabilityStart,
                availableHours: skillsInterests.availableHours,
                internTypePreference: skillsInterests.internTypePreference,
                languagesSpoken: skillsInterests.languagesSpoken || [],
                technicalSkills: skillsInterests.technicalSkills || [],
                industryInterests: skillsInterests.industryInterests || [],
                careerGoals: skillsInterests.careerGoals,
                cvUrl: extractDocUrl(requiredDocuments.cvFile),
                idDocumentUrl: extractDocUrl(requiredDocuments.idDocument),
                transcriptUrl: extractDocUrl(requiredDocuments.transcriptFile),
                motivationLetterUrl: extractDocUrl(requiredDocuments.motivationLetter),
                portfolioFileUrl: extractDocUrl(requiredDocuments.portfolioFile),
                proofOfStudyUrl: extractDocUrl(requiredDocuments.proofOfStudy),
                referencesUrl: extractDocUrl(requiredDocuments.references),
                completedSections: profileData.completedSections || {},
                profileCreatedAt: profileData.createdAt?.toDate() || null,
                profileLastUpdated: profileData.lastUpdated?.toDate() || null,
                applicationCreatedAt: applicationData.createdAt || null,
                applicationUpdatedAt: applicationData.updatedAt || null,
              }
            } catch (docError) {
              // console.log(`Error processing application document ${applicationDoc.id}:`, docError)
              return null
            }
          }),
        )

        const profilesSnapshot = await getDocs(collection(db, "internProfiles"))

        const profileInterns = await Promise.all(
          profilesSnapshot.docs.map(async (docSnap) => {
            try {
              const internId = docSnap.id

              if (appliedInternIds.has(internId) || internId === smeUserId) return null

              const data = docSnap.data()
              if (!data) return null
              if (appliedInternIds.has(internId) || internId === smeUserId) return null

              const matchResult = calculateMatchScoreForSponsor(smeUserData, data)
              const matchPercentage = matchResult.score || (data.matchPercentage ?? 0)

              const fd = data.formData || {}
              const personalOverview = fd.personalOverview || {}
              const academicOverview = fd.academicOverview || {}
              const skillsInterests = fd.skillsInterests || {}
              const programAffiliation = fd.programAffiliation || {}
              const requiredDocs = fd.requiredDocuments || data.requiredDocuments || {}
              const experienceTrackRecord = fd.experienceTrackRecord || {}
              // inside profilesSnapshot.docs.map, before building the return object:
              let evaluationScores = {
                academic: 0,
                bigInternScore: data.bigInternScore || 0,
                professionalPresentation: 0,
                professionalSkills: 0,
                workExperience: 0,
              }
              try {
                const evalDoc = await getDoc(doc(db, "internEvaluations", internId))
                if (evalDoc.exists()) {
                  const evalScores = evalDoc.data().scores || {}
                  evaluationScores = {
                    academic: evalScores.academic ?? 0,
                    bigInternScore: evalScores.bigInternScore ?? evaluationScores.bigInternScore,
                    professionalPresentation: evalScores.professionalPresentation ?? 0,
                    professionalSkills: evalScores.professionalSkills ?? 0,
                    workExperience: evalScores.workExperience ?? 0,
                  }
                }
              } catch (evalError) {
                console.warn(`Could not fetch live evaluation for intern ${internId}:`, evalError)
              }
              const hasRelevantData =
                personalOverview.fullName ||
                personalOverview.firstName ||
                academicOverview.institution ||
                (skillsInterests && Object.keys(skillsInterests).length > 0)

              if (!hasRelevantData) return null

              return {
                id: `profile_${internId}`,
                internId,
                applicationId: null,
                internName:
                  personalOverview.fullName ||
                  `${personalOverview.firstName || ""} ${personalOverview.lastName || ""}`.trim() ||
                  "Unnamed Intern",
                location:
                  Array.isArray(personalOverview.provinces) && personalOverview.provinces.length
                    ? personalOverview.provinces.join(", ")
                    : Array.isArray(personalOverview.cities) && personalOverview.cities.length
                      ? personalOverview.cities.join(", ")
                      : "Not specified",
                institution: academicOverview.institution || "Not specified",
                degree: academicOverview.degree || academicOverview.qualificationLevel || "Not specified",
                field:
                  academicOverview.fieldOfStudy ||
                  (Array.isArray(skillsInterests.industryInterests) && skillsInterests.industryInterests[0]) ||
                  "Not specified",
                internType: academicOverview.yearOfStudy || "Not specified",
                role:
                  Array.isArray(skillsInterests.technicalSkills) && skillsInterests.technicalSkills.length
                    ? skillsInterests.technicalSkills.join(", ")
                    : Array.isArray(experienceTrackRecord.type) && experienceTrackRecord.type.length
                      ? experienceTrackRecord.type.join(", ")
                      : "Not specified",
                sponsorName: programAffiliation.sponsorName || "Not specified",
                fundingProgramType: programAffiliation.fundingStatus || "Not specified",
                startDate: skillsInterests.availabilityStart || "Not specified",
                bigScore: evaluationScores.bigInternScore,
                evaluationScores: evaluationScores, // ADD THIS LINE
                matchPercentage: matchPercentage || 0,
                status: "Matched",
                pipelineStage: "Matched",
                action: "No Application",
                availableDates: [],
                locationFlexibility:
                  Array.isArray(academicOverview.locationFlexibility) &&
                    academicOverview.locationFlexibility.length > 0 &&
                    academicOverview.locationFlexibility[0] !== "N"
                    ? academicOverview.locationFlexibility.join(", ")
                    : "Not specified",
                matchAnalysis: matchResult,
                profileEmail: data.userEmail || personalOverview.email,
                phone: personalOverview.phoneNumber,
                nationalId: personalOverview.nationalIdOrStudentNo,
                availabilityStart: skillsInterests.availabilityStart,
                availableHours: skillsInterests.availableHours,
                internTypePreference: skillsInterests.internTypePreference,
                languagesSpoken: skillsInterests.languagesSpoken || [],
                technicalSkills: skillsInterests.technicalSkills || [],
                industryInterests: skillsInterests.industryInterests || [],
                careerGoals: skillsInterests.careerGoals,
                cvUrl: firstUrl(requiredDocs.cvFile),
                idDocumentUrl: firstUrl(requiredDocs.idDocument),
                transcriptUrl: firstUrl(requiredDocs.transcriptFile),
                motivationLetterUrl: firstUrl(requiredDocs.motivationLetter),
                portfolioFileUrl: firstUrl(requiredDocs.portfolioFile),
                proofOfStudyUrl: firstUrl(requiredDocs.proofOfStudy),
                referencesUrl: firstUrl(requiredDocs.references),
                completedSections: data.completedSections || {},
                profileCreatedAt: toDateSafe(data.createdAt),
                profileLastUpdated: toDateSafe(data.lastUpdated),
                applicationCreatedAt: null,
                applicationUpdatedAt: null,
              }
            } catch (err) {
              console.error("Error processing intern profile:", err)
              return null
            }
          }),
        )

        const allInterns = [...applicationInterns, ...profileInterns].filter(Boolean)

        allInterns.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))

        setInterns(allInterns)
        setFilteredInterns(allInterns)
      } catch (error) {
        console.error("Error fetching intern applications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInternApplications()
  }, [effectiveUserId])

  // ─── Views actions (identical model to the catalyst/accelerator tables) ──
  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]

  useEffect(() => {
    setViewsState((prev) => {
      const current = prev.views[prev.activeViewId]
      if (!current) return prev
      const updated = { ...current, columnVisibility, columnOrder, density }
      const next = { ...prev, views: { ...prev.views, [prev.activeViewId]: updated } }
      persistViewsState(next)
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility, columnOrder, density])

  const switchToView = (viewId) => {
    const target = viewsState.views[viewId]
    if (!target) return
    setViewsState((prev) => {
      const next = { ...prev, activeViewId: viewId }
      persistViewsState(next)
      return next
    })
    setColumnVisibility(target.columnVisibility)
    setColumnOrder(target.columnOrder)
    setDensity(target.density)
  }

  const createNewView = () => {
    const trimmedName = newViewName.trim()
    if (!trimmedName) return
    const id = generateViewId()
    const newView = { id, name: trimmedName, description: newViewDescription.trim(), builtin: false, columnVisibility: { ...columnVisibility }, columnOrder: [...columnOrder], density }
    setViewsState((prev) => {
      const next = { activeViewId: id, views: { ...prev.views, [id]: newView } }
      persistViewsState(next)
      return next
    })
    setNewViewName("")
    setNewViewDescription("")
    setShowNewViewForm(false)
  }

  const startEditingViewMeta = (view) => setEditingViewMeta({ id: view.id, name: view.name, description: view.description, builtin: !!view.builtin })

  const saveViewMeta = () => {
    if (!editingViewMeta) return
    const trimmedName = editingViewMeta.name.trim()
    if (!trimmedName && !editingViewMeta.builtin) return
    setViewsState((prev) => {
      const existing = prev.views[editingViewMeta.id]
      if (!existing) return prev
      const updated = { ...existing, name: existing.builtin ? existing.name : trimmedName, description: editingViewMeta.description.trim() }
      const next = { ...prev, views: { ...prev.views, [editingViewMeta.id]: updated } }
      persistViewsState(next)
      return next
    })
    setEditingViewMeta(null)
  }

  const removeView = (viewId) => {
    if (viewId === BUILTIN_VIEW_ID) return
    const wasActive = viewsState.activeViewId === viewId
    setViewsState((prev) => {
      const { [viewId]: _removed, ...restViews } = prev.views
      const nextActiveId = prev.activeViewId === viewId ? BUILTIN_VIEW_ID : prev.activeViewId
      const next = { activeViewId: nextActiveId, views: restViews }
      persistViewsState(next)
      return next
    })
    if (wasActive) {
      const def = viewsState.views[BUILTIN_VIEW_ID]
      setColumnVisibility(def.columnVisibility)
      setColumnOrder(def.columnOrder)
      setDensity(def.density)
    }
  }

  const resetActiveViewToDefault = () => {
    const layout = createDefaultViewLayout()
    setColumnVisibility(layout.columnVisibility)
    setColumnOrder(layout.columnOrder)
    setDensity(layout.density)
  }

  const toggleColumn = (key) => setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }))

  // ─── Column drag-to-reorder ───────────────────────────────────────────────
  const handleColumnDragStart = (e, key) => {
    setDraggedColumn(key)
    setDragHintRect(null)
    try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", key) } catch {}
  }
  const handleColumnDragOver = (e, key) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (key !== dragOverColumn) setDragOverColumn(key)
  }
  const handleColumnDrop = (e, key) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === key) { setDraggedColumn(null); setDragOverColumn(null); return }
    setColumnOrder((prev) => {
      const next = [...prev]
      const fromIdx = next.indexOf(draggedColumn)
      const toIdx = next.indexOf(key)
      if (fromIdx === -1 || toIdx === -1) return prev
      next.splice(fromIdx, 1)
      next.splice(toIdx, 0, draggedColumn)
      return next
    })
    setDraggedColumn(null)
    setDragOverColumn(null)
  }
  const handleColumnDragEnd = () => { setDraggedColumn(null); setDragOverColumn(null) }

  const openHeaderFilter = (type, event) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    setHeaderFilterOpen((prev) => (prev?.type === type ? null : { type, rect }))
  }
  const closeHeaderFilter = () => setHeaderFilterOpen(null)

  const FilterTrigger = ({ type, active }) => (
    <button
      type="button"
      onClick={(e) => openHeaderFilter(type, e)}
      className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${active ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"}`}
      title="Filter this column"
    >
      <SlidersHorizontal size={11} />
    </button>
  )

  const handleStageAction = (intern) => {
    setSelectedInternForStage(intern)
    setShowStageModal(true)
    setNextStage("") // Clear previous selection
    setMessage("")
    setInterviewDate("")
    setInterviewTime("")
    setInterviewLocation("")
    setTermSheetFile(null)
    setFormErrors({})
    loadApplicationAvailability(intern)
    setSelectedStage("") // Reset stage selection in modal
    setStageNotes("") // Reset notes
    setMeetingLocation("") // Reset meeting location
    setMeetingPurpose("") // Reset meeting purpose
  }

  const resetStageModal = () => {
    setSelectedInternForStage(null)
    setShowStageModal(false)
    setNextStage("")
    setMessage("")
    setInterviewDate("")
    setInterviewTime("")
    setInterviewLocation("")
    setTermSheetFile(null)
    setFormErrors({})
    setAvailabilities([])
    setSelectedStage("") // Reset stage selection
    setStageNotes("") // Reset notes
    setMeetingLocation("") // Reset meeting location
    setMeetingPurpose("") // Reset meeting purpose
  }

  const handleStageUpdate = async () => {
    // Check permissions for company members
    if (isCompanyMember && !['owner', 'admin', 'manager'].includes(userRole)) {
      setNotification({
        type: "warning",
        message: "You don't have permission to update application stages.",
      })
      return
    }

    // Determine the fields relevant to the selected stage
    const stageFields = getStageFields(selectedStage)
    const errors = {}

    if (!selectedStage) {
      errors.selectedStage = "Please select a new stage"
    }

    if (stageFields.showMessage) {
      if (!stageNotes.trim()) {
        errors.stageNotes = "A message/note to the applicant is required"
      } else if (stageNotes.length < 10) {
        errors.stageNotes = "Message is too short (min 10 characters)"
      }
    }

    if (stageFields.showAvailability && availabilities.length === 0) {
      errors.availabilities = "Please select at least one availability slot"
    }

    if (stageFields.showMeeting) {
      if (!meetingLocation || typeof meetingLocation !== "string" || (meetingLocation && !meetingLocation.trim())) {
        errors.meetingLocation = "Meeting location is required"
      }
      if (!meetingPurpose || typeof meetingPurpose !== "string" || (meetingPurpose && !meetingPurpose.trim())) {
        errors.meetingPurpose = "Meeting purpose is required"
      }
    }

    if (stageFields.showTermSheet && !termSheetFile) {
      errors.termSheetFile = "Please upload the term sheet document"
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const user = auth.currentUser
      if (!user) throw new Error("User not authenticated")

      const sponsorId = effectiveUserId
      const internId = selectedInternForStage.id // This is the application ID

      let attachmentUrl = null
      if (termSheetFile) {
        const storageRef = ref(storage, `internship_termsheets/${internId}/${termSheetFile.name}`)
        const snapshot = await uploadBytes(storageRef, termSheetFile)
        attachmentUrl = await getDownloadURL(snapshot.ref)
      }

      const updateData = {
        status: selectedStage,
        pipelineStage: selectedStage,
        updatedAt: serverTimestamp(),
        lastUpdatedBy: user.uid,           // ADD THIS
        lastUpdatedByRole: userRole,
        ...(stageNotes && { lastMessage: stageNotes }), // Use stageNotes as lastMessage
        ...(stageFields.showInterview && {
          interviewDetails: {
            date: interviewDate,
            time: interviewTime,
            location: interviewLocation,
          },
        }),
      }

      if (stageFields.showAvailability && availabilities.length > 0) {
        updateData.availableDates = availabilities.map((avail) => ({
          date: avail.date.toISOString(),
          timeSlots: avail.timeSlots,
          timeZone: avail.timeZone,
          status: avail.status,
        }))
      }

      const applicationDocId = selectedInternForStage.id
      const docRef = doc(db, "internshipApplications", applicationDocId)

      const docSnapshot = await getDoc(docRef)
      if (!docSnapshot.exists()) {
        throw new Error(`Application document ${applicationDocId} not found`)
      }

      const applicationData = docSnapshot.data()
      const internUid = applicationData.applicantId

      await updateDoc(docRef, updateData)
      // console.log("Document updated in internshipApplications")

      // Add to internCalendarEvents if applicable (e.g., for interviews)
      if (stageFields.showInterview && interviewDate && interviewTime && interviewLocation) {
        await addDoc(collection(db, "internCalendarEvents"), {
          sponsorId,
          internId: internUid, // Link to the intern's profile
          title: "Internship Interview",
          date: interviewDate,
          time: interviewTime,
          status: "available", // Default status
          location: interviewLocation,
          type: "internship_meeting",
          createdAt: new Date().toISOString(),
          ...(updateData.availableDates && { availableDates: updateData.availableDates }),
        })
      }

      // Update local state
      setInterns((prevInterns) =>
        prevInterns.map((intern) =>
          intern.id === internId
            ? {
              ...intern,
              status: selectedStage,
              pipelineStage: selectedStage,
              ...(stageNotes && { lastMessage: stageNotes }),
              ...(stageFields.showInterview && {
                interviewDetails: {
                  date: interviewDate,
                  time: interviewTime,
                  location: interviewLocation,
                },
              }),
              ...(updateData.availableDates && { availableDates: updateData.availableDates }),
            }
            : intern,
        ),
      )

      setUpdatedStages((prev) => ({ ...prev, [internId]: selectedStage }))
      setNotification({
        type: "success",
        message: `Application status updated to ${selectedStage} successfully`,
      })
      setShowStageModal(false)
      resetStageModal()

      // Sending email notification to intern
      let internEmail = null
      try {
        const internProfileRef = doc(db, "internProfiles", internUid)
        const internProfileSnap = await getDoc(internProfileRef)

        if (internProfileSnap.exists()) {
          const internProfileData = internProfileSnap.data()
          internEmail =
            internProfileData.formData?.personalOverview?.email ||
            internProfileData.userEmail ||
            internProfileData.contactDetails?.email ||
            internProfileData.email

          // console.log("Found intern email:", internEmail)
        } else {
          // console.log("No intern profile found for:", internUid)
        }
      } catch (emailError) {
        console.error("Error fetching intern email:", emailError)
      }

      // Fallback to email from selectedInternForStage if profile email not found
      if (!internEmail) {
        internEmail = selectedInternForStage.profileEmail
        // console.log("Using profile email as fallback:", internEmail)
      }

      const subject = `Update: ${selectedStage} Stage for Your Application`
      let content = `Dear ${selectedInternForStage.internName},\n\nYour application has progressed to the "${selectedStage}" stage.\n\n`

      if (stageNotes) {
        content += `Message from ${user?.displayName || "Internship Program Team"}:\n${stageNotes}\n\n`
      }

      if (stageFields.showMeeting) {
        content += `Meeting Details:\n`
        if (meetingTime) {
          content += `- Time: ${new Date(meetingTime).toLocaleString()}\n`
        }
        if (meetingLocation) {
          content += `- Location: ${meetingLocation}\n`
        }
        if (meetingPurpose) {
          content += `- Purpose: ${meetingPurpose}\n\n`
        }
      }

      if (stageFields.showAvailability && availabilities.length > 0) {
        content += `Available Meeting Times:\n`
        content += availabilities
          .map((avail, idx) => {
            const dateStr = avail.date.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
            const timeStr = avail.timeSlots?.[0]
              ? `${avail.timeSlots[0].start} - ${avail.timeSlots[0].end} ${avail.timeSlots[0].timeZone}`
              : "Time not specified"
            return `${idx + 1}. ${dateStr} (${timeStr})`
          })
          .join("\n")

        content += `\nPlease reply with your preferred time.`
      }

      content += `\n\nBest regards,\nInternship Program Team\nBIG Marketplace Africa`

      // Store message in 'messages' collection
      const messagePayload = {
        to: internUid, // Intern's profile ID
        from: sponsorId, // Sponsor's profile ID
        subject,
        content,
        date: new Date().toISOString(),
        read: false,
        type: "inbox",
        applicationId: internId, // Link to the application
        ...(attachmentUrl && { attachments: [attachmentUrl] }),
        ...(stageFields.showAvailability && availabilities.length > 0 && { availableDates: updateData.availableDates }),
      }

      const sentMessagePayload = {
        ...messagePayload,
        read: true,
        type: "sent",
        to: sponsorId, // Sent message from sponsor's perspective
        from: internUid, // Sent message to intern's perspective
      }

      await Promise.all([
        addDoc(collection(db, "messages"), messagePayload),
        addDoc(collection(db, "messages"), sentMessagePayload),
      ])

      // Send email using EmailJS
      if (internEmail) {
        try {
          // console.log("Using EmailJS service to send email to intern...")

          const emailjsConfig = {
            serviceId: API_KEYS.SERVICE_ID_MESSAGES,
            templateId: API_KEYS.TEMPLATE_ID_MESSAGES,
            publicKey: API_KEYS.PUBLIC_KEY_ID_MESSAGES,
          }

          // console.log("Using EmailJS config:", emailjsConfig)

          if (!window.emailjs) {
            emailjs.init(emailjsConfig.publicKey)
            window.emailjs = emailjs
          }

          const sponsorName = user?.displayName || "Internship Program Team"
          const internName = selectedInternForStage.internName

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(internEmail)) {
            throw new Error(`Invalid email format: "${internEmail}"`)
          }

          let emailMessage = `Dear ${internName},\n\n`

          if (selectedStage === "Declined") {
            emailMessage += `We regret to inform you that your application has been moved to the "${selectedStage}" stage.\n\n`
          } else {
            emailMessage += `We are pleased to inform you that your application has progressed to the "${selectedStage}" stage.\n\n`
          }

          if (stageNotes) {
            emailMessage += `Message from ${sponsorName}:\n${stageNotes}\n\n`
          }

          if (stageFields.showMeeting && meetingLocation && meetingPurpose) {
            emailMessage += `Meeting Details:\n`
            if (meetingTime) {
              emailMessage += `- Date: ${new Date(meetingTime).toLocaleString()}\n`
            }
            emailMessage += `- Location: ${meetingLocation}\n`
            emailMessage += `- Purpose: ${meetingPurpose}\n\n`
          }

          if (stageFields.showAvailability && availabilities.length > 0) {
            emailMessage += `Available Meeting Times:\n`
            availabilities.forEach((avail, idx) => {
              const dateStr = avail.date.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
              const timeStr = avail.timeSlots?.[0]
                ? `${avail.timeSlots[0].start} - ${avail.timeSlots[0].end} ${avail.timeZone}`
                : "Time not specified"
              emailMessage += `${idx + 1}. ${dateStr} (${timeStr})\n`
            })
            emailMessage += `\nPlease reply with your preferred meeting time from the above options.\n\n`
          }

          emailMessage += `Best regards,\n${sponsorName}\nInternship Program Team\nBIG Marketplace Africa`

          const templateParams = {
            to_email: internEmail,
            subject: `Internship Application Stage Update: ${selectedStage}`,
            from_name: sponsorName,
            date: new Date().toLocaleDateString(),
            message: emailMessage,
            portal_url: `https://www.bigmarketplace.africa/applications/${sponsorId}_${internId}`,
            has_attachments: termSheetFile ? "true" : "false",
            attachments_count: termSheetFile ? "1" : "0",
          }

          // console.log("Sending email to intern with EmailJS...", templateParams)

          const response = await window.emailjs.send(
            emailjsConfig.serviceId,
            emailjsConfig.templateId,
            templateParams,
            emailjsConfig.publicKey,
          )

          // console.log("Email sent successfully to intern!", response)

          setNotification({
            type: "success",
            message: `Stage updated to ${selectedStage} and email notification sent successfully`,
          })
        } catch (emailError) {
          console.error("Email to intern failed:", emailError)

          setNotification({
            type: "success",
            message: `Stage updated to ${selectedStage} successfully (email notification failed)`,
          })
        }
      } else {
        console.warn("No intern email found, skipping email notification")
        setNotification({
          type: "success",
          message: `Stage updated to ${selectedStage} successfully (no email available)`,
        })
      }
    } catch (error) {
      console.error("Detailed error:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      })

      setNotification({
        type: "error",
        message: `Failed to update status: ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestIntern = async (intern) => {
    try {
      const user = auth.currentUser
      if (!user) {
        setNotification({ type: "error", message: "User not authenticated. Please log in." })
        return
      }

      // Check permissions for company members
      if (isCompanyMember && !['owner', 'admin'].includes(userRole)) {
        setNotification({
          type: "warning",
          message: "Only company owners and admins can request interns.",
        })
        return
      }

      // console.log("Starting intern request for:", intern.internName)
      // console.log("SME User ID:", user.uid)
      // console.log("Intern object:", intern)
      const internId = intern.internId
      const sponsorId = effectiveUserId

      let smeData = {}
      try {
        const smeDoc = await getDoc(doc(db, "universalProfiles", sponsorId))
        smeData = smeDoc.exists() ? smeDoc.data() : {}
        // console.log("SME data retrieved:", smeData)
      } catch (smeError) {
        console.warn("Could not retrieve SME profile:", smeError)
      }
      let internshipInformation = {}
      try {
        const smeDoc = await getDoc(doc(db, "internApplications", sponsorId))
        internshipInformation = smeDoc.exists() ? smeDoc.data() : {}
        // console.log("SME data retrieved:", internshipInformation)
      } catch (smeError) {
        console.warn("Could not retrieve SME profile:", smeError)
      }

      let internData = {}
      try {
        const internDoc = await getDoc(doc(db, "internProfiles", intern.internId))
        internData = internDoc.exists() ? internDoc.data() : {}
        // console.log("Intern data retrieved:", internData)
      } catch (internError) {
        console.warn("Could not retrieve intern profile:", internError)
      }

      let evaluationScores = {
        academic: 0,
        bigInternScore: 0,
        professionalPresentation: 0,
        professionalSkills: 0,
        workExperience: 0,
        lastUpdated: null,
        updatedAt: null,
      }

      try {
        const evaluationDoc = await getDoc(doc(db, "internEvaluations", intern.internId))
        if (evaluationDoc.exists()) {
          const evalData = evaluationDoc.data()
          // console.log("Evaluation data retrieved:", evalData)

          evaluationScores = {
            academic: evalData.scores?.academic || 0,
            bigInternScore: evalData.scores?.bigInternScore || 0,
            professionalPresentation: evalData.scores?.professionalPresentation || 0,
            professionalSkills: evalData.scores?.professionalSkills || 0,
            workExperience: evalData.scores?.workExperience || 0,
            lastUpdated: evalData.scores?.lastUpdated || null,
            updatedAt: evalData.scores?.updatedAt || null,
          }
        } else {
          // console.log("No evaluation scores found for intern:", intern.internId)
        }
      } catch (evaluationError) {
        console.warn("Could not retrieve evaluation scores:", evaluationError)
      }


      const requestDocId = `${sponsorId}_${internId}`

      // console.log("Request document ID:", requestDocId)
      // console.log("Sponsor ID:", sponsorId)
      // console.log("Intern ID:", internId)

      const internFormData = internData.formData || {}
      const internProfile = internData.entityOverview || {}

      const matchResult = calculateMatchScore(internData, smeData)
      // console.log("Match result with breakdown:", matchResult)

      const requestData = {
        applicantId: internId,
        internId: internId,
        internName: intern.internName || internFormData.personalOverview?.fullName || "Anonymous Intern",
        internEmail: intern.profileEmail || internFormData.personalOverview?.email || "Not provided",
        institution:
          intern.institution ||
          internFormData.academicOverview?.institution ||
          internProfile.organizationName ||
          "Not Provided",
        degree: intern.degree || internFormData.academicOverview?.degree || internFormData.studyLevel || "Not Provided",
        field: intern.field || internFormData.academicOverview?.fieldOfStudy || internFormData.sector || "Not Provided",
        locationFlexibility:
          intern.locationFlexibility ||
          internFormData.academicOverview?.locationFlexibility ||
          internFormData.locationFlexibility ||
          "Not Provided",
        technicalSkills: intern.technicalSkills || internFormData.skillsInterests?.technicalSkills || [],
        availabilityStart:
          intern.availabilityStart || internFormData.skillsInterests?.availabilityStart || "Not specified",
        provinces: internFormData.personalOverview?.provinces || [],
        cities: internFormData.personalOverview?.cities || [],
        sponsorId: sponsorId,
        submittedBy: user.uid,              // ADD THIS
        submittedByRole: userRole,          // ADD THIS
        sponsorName:
          smeData.entityOverview?.tradingName || smeData.entityOverview?.registeredName || "Our Organization",
        sponsorEmail: user.email || smeData.contactEmail || "Not provided",
        location: smeData.location || smeData.entityOverview?.location || "N/A",
        type: "Internship Request",
        role: internshipInformation.internshipRequest?.internRolesText || smeData.jobOverview?.roleTitle || "N/A",
        sector: smeData.sector || smeData.entityOverview?.sector || "N/A",
        funding: smeData.fundingAvailable || "No",
        fundType: smeData.fundingType || "not specified",
        startDate: smeData.internshipRequest?.startDate || "TBD",
        requestedDate: new Date().toISOString(),
        aiAcademicScore: evaluationScores.academic,
        aiProfessionalSkillsScore: evaluationScores.professionalSkills,
        aiWorkExperienceScore: evaluationScores.workExperience,
        aiPresentationScore: evaluationScores.professionalPresentation,
        bigInternScore: evaluationScores.bigInternScore,
        evaluationLastUpdated: evaluationScores.lastUpdated,
        evaluationUpdatedAt: evaluationScores.updatedAt,
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
              preferredSkills: matchResult.breakdown.skillsMatch.details.sponsorSkills,
            },
            workModeCompatibility: {
              score: matchResult.breakdown.workModeMatch.score,
              maxScore: matchResult.breakdown.workModeMatch.maxScore,
              matched: matchResult.breakdown.workModeMatch.matched,
              description: matchResult.breakdown.workModeMatch.description,
              applicantFlexibility: matchResult.breakdown.workModeMatch.details.internFlexibility,
              requiredType: matchResult.breakdown.workModeMatch.details.sponsorType,
            },
            locationCompatibility: {
              score: matchResult.breakdown.locationMatch.score,
              maxScore: matchResult.breakdown.locationMatch.maxScore,
              matched: matchResult.breakdown.locationMatch.score > 0,
              description: matchResult.breakdown.locationMatch.description,
              applicantProvinces: matchResult.breakdown.locationMatch.details.internProvinces,
              applicantCities: matchResult.breakdown.locationMatch.details.internCities,
              sponsorProvince: matchResult.breakdown.locationMatch.details.sponsorProvince,
              sponsorCities: matchResult.breakdown.locationMatch.details.sponsorCities,
            },
            availabilityAlignment: {
              score: matchResult.breakdown.availabilityMatch.score,
              maxScore: matchResult.breakdown.availabilityMatch.maxScore,
              matched: matchResult.breakdown.availabilityMatch.matched,
              description: matchResult.breakdown.availabilityMatch.description,
              applicantStartDate: matchResult.breakdown.availabilityMatch.details.internStartDate,
              sponsorStartDate: matchResult.breakdown.availabilityMatch.details.sponsorStartDate,
            },
            profileCompleteness: {
              score: matchResult.breakdown.additionalFactors.score,
              maxScore: matchResult.breakdown.additionalFactors.maxScore,
              matched: matchResult.breakdown.additionalFactors.matched,
              description: matchResult.breakdown.additionalFactors.description,
            },
          },
        },
        matchPercentage: matchResult.score,
        status: "Requested",
        pipelineStage: "Requested",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const strongPoints = []
      const weakPoints = []
      const recommendations = []

      const { breakdown } = matchResult

      if (breakdown.skillsMatch.matched) {
        strongPoints.push("Skills align with role requirements")
      } else {
        weakPoints.push("Skills may not fully match role requirements")
        recommendations.push("Consider highlighting transferable skills")
      }

      if (breakdown.workModeMatch.matched) {
        strongPoints.push("Work mode preferences are compatible")
      } else {
        weakPoints.push("Work mode preferences don't match")
        recommendations.push("Consider discussing flexibility in work arrangements")
      }

      if (breakdown.locationMatch.score >= 15) {
        strongPoints.push("Good location compatibility")
      } else if (breakdown.locationMatch.score > 0) {
        strongPoints.push("Some location flexibility")
      } else {
        weakPoints.push("Location requirements not met")
        recommendations.push("Discuss remote work possibilities or relocation")
      }

      if (breakdown.availabilityMatch.matched) {
        strongPoints.push("Availability aligns with timeline")
      } else {
        weakPoints.push("Availability doesn't match preferred timeline")
        recommendations.push("Discuss flexible start dates")
      }

      if (evaluationScores.bigInternScore >= 70) {
        strongPoints.push("High overall evaluation score")
      } else if (evaluationScores.bigInternScore >= 50) {
        strongPoints.push("Good evaluation score")
      } else if (evaluationScores.bigInternScore > 0) {
        weakPoints.push("Lower evaluation score")
        recommendations.push("Consider highlighting achievements and growth potential")
      }

      requestData.matchAnalysis.matchSummary = {
        strongPoints,
        weakPoints,
        recommendations,
        overallAssessment:
          matchResult.score >= 80
            ? "Excellent Match"
            : matchResult.score >= 60
              ? "Good Match"
              : matchResult.score >= 40
                ? "Fair Match"
                : "Poor Match",
      }

      await setDoc(doc(db, "internshipApplications", requestDocId), requestData, { merge: true })

      // console.log("Intern request successfully saved to Firestore")

      setStatuses((prev) => ({ ...prev, [intern.id]: "Requested" }))

      try {
        let internEmail = null
        try {
          const internProfileRef = doc(db, "internProfiles", intern.internId)
          const internProfileSnap = await getDoc(internProfileRef)

          if (internProfileSnap.exists()) {
            const internProfileData = internProfileSnap.data()
            internEmail =
              internProfileData.formData?.personalOverview?.email ||
              internProfileData.userEmail ||
              internProfileData.contactDetails?.email ||
              internProfileData.email

            // console.log("Found intern email for request:", internEmail)
          }
        } catch (emailError) {
          console.error("Error fetching intern email for request:", emailError)
        }

        if (!internEmail) {
          internEmail = intern.profileEmail
        }

        if (internEmail) {
          // console.log("Sending internship request email to intern...")

          const emailjsConfig = {
            serviceId: API_KEYS.SERVICE_ID_MESSAGES,
            templateId: API_KEYS.TEMPLATE_ID_MESSAGES,
            publicKey: API_KEYS.PUBLIC_KEY_ID_MESSAGES,
          }

          if (!window.emailjs) {
            emailjs.init(emailjsConfig.publicKey)
            window.emailjs = emailjs
          }

          const sponsorName = user?.displayName || "Our Organization"
          const internName = intern.internName

          const emailMessage = `Dear ${internName},\n\n
We are excited to inform you that ${sponsorName} has requested you for an internship opportunity!\n\n
Position: ${requestData.role}\n
Location: ${requestData.location}\n
Start Date: ${requestData.startDate}\n\n
Your profile stood out to us because of your strong match with our requirements. We would like to discuss this opportunity further with you.\n\n
Please log into your BIG Marketplace Africa account to view the full details and respond to this request.\n\n
Best regards,\n${sponsorName}\nInternship Program Team\nBIG Marketplace Africa`

          const templateParams = {
            to_email: internEmail,
            subject: `New Internship Request from ${sponsorName}`,
            from_name: sponsorName,
            date: new Date().toLocaleDateString(),
            message: emailMessage,
            portal_url: `https://www.bigmarketplace.africa/applications/${sponsorId}_${internId}`,
            has_attachments: "false",
            attachments_count: "0",
          }

          // console.log("Sending internship request email to intern...")

          const response = await window.emailjs.send(
            emailjsConfig.serviceId,
            emailjsConfig.templateId,
            templateParams,
            emailjsConfig.publicKey,
          )

          // console.log("Internship request email sent successfully!", response)
        }
      } catch (emailError) {
        console.error("Internship request email failed:", emailError)
      }

      const dispatchNotification = () => {
        const notificationMessage = `New internship request from ${requestData.sponsorName} for ${requestData.role}!`
        // console.log("Dispatching intern notification:", notificationMessage)

        const event = new CustomEvent("newNotification", {
          detail: {
            message: notificationMessage,
            type: "info",
            timestamp: new Date().toISOString(),
            recipientId: internId,
          },
          bubbles: true,
          cancelable: true,
          composed: true,
        })

        setTimeout(() => {
          window.dispatchEvent(event)
          // console.log("Intern notification event dispatched")
        }, 100)
      }

      dispatchNotification()

      setNotification({
        type: "success",
        message: `Intern request successfully sent to ${intern.internName}!`,
      })
      setTimeout(() => setNotification(null), 4000)
    } catch (error) {
      console.error("Detailed error in handleRequestIntern:", error)
      console.error("Error code:", error.code)
      console.error("Error message:", error.message)

      let errorMessage = "Failed to send intern request."

      if (error.code === "permission-denied") {
        errorMessage = "Permission denied. Please check your account permissions."
      } else if (error.code === "unavailable") {
        errorMessage = "Service temporarily unavailable. Please try again."
      } else if (error.code === "network-request-failed") {
        errorMessage = "Network error. Please check your internet connection."
      } else if (error.message.includes("auth")) {
        errorMessage = "Authentication error. Please log in again."
      }

      const errorEvent = new CustomEvent("newNotification", {
        detail: {
          message: errorMessage,
          type: "error",
          timestamp: new Date().toISOString(),
        },
      })
      window.dispatchEvent(errorEvent)

      setNotification({ type: "error", message: errorMessage })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  const handleViewDetails = (intern) => {
    setSelectedInternDetails(intern)
    setShowInternDetails(true)
  }

  const handleBigScoreClick = (intern) => {
    setSelectedIntern(intern)
    setModalType("bigScore")
  }

  const handleScoreBreakdown = (intern) => {
    setSelectedIntern(intern)
    setModalType("scoreBreakdown")
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
    maxWidth: "900px",
    width: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    border: "none",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
    position: "relative",
  }

  const tableHeaderStyle = {
    background: "#4a352f",
    color: "#faf7f2",
    padding: "0.6rem 0.4rem",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "0.75rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    position: "sticky",
    top: "0",
    zIndex: "10",
    borderBottom: "2px solid #e6d7c3",
    borderRight: "1px solid #e6d7c3",
    lineHeight: "1.2",
  }

  const tableCellStyle = {
    padding: "0.6rem 0.4rem",
    borderBottom: "1px solid #e6d7c3",
    borderRight: "1px solid #e6d7c3",
    fontSize: "0.8rem",
    verticalAlign: "top",
    color: "#4a352f",
    lineHeight: "1.3",
    maxWidth: "0",
    overflow: "hidden",
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
    background: "#e6d7c3",
    borderRadius: "3px",
    overflow: "hidden",
  }

  const progressFillStyle = {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  }

  const matchScoreStyle = {
    fontWeight: "600",
    color: "#4a352f",
    fontSize: "0.75rem",
  }

  const statusBadgeStyle = {
    padding: "4px 10px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: "600",
    display: "inline-block",
    textTransform: "capitalize",
  }

  const hasTooManyMissingFields = (intern) => {
    const fieldsToCheck = [
      intern.internName,
      intern.location,
      intern.institution,
      intern.degree,
      intern.field,
      intern.locationFlexibility,
      intern.role,
      intern.sponsorName,
      intern.fundingProgramType,
      intern.startDate,
      intern.matchPercentage?.toString(),
      intern.bigScore?.toString(),
    ]

    const missingCount = fieldsToCheck.filter((field) => {
      if (field === null || field === undefined) return true

      const stringField = field.toString().trim()
      return (
        stringField === "" ||
        stringField === "-" ||
        stringField === "Not specified" ||
        stringField === "Various" ||
        stringField === "unspecified" ||
        stringField === "Unknown" ||
        stringField === "N/A" ||
        stringField === "Not Provided" ||
        stringField === "0" ||
        stringField.toLowerCase() === "null" ||
        stringField.toLowerCase().includes("not specified") ||
        stringField.toLowerCase().includes("unspecified") ||
        stringField.toLowerCase().includes("tbd") ||
        stringField.toLowerCase().includes("anonymous")
      )
    }).length

    return missingCount > 4
  }

  useEffect(() => {
    const user = auth.currentUser
    const updated = interns.filter((intern) => {
      if ((user && intern.internId === user.uid) || (effectiveUserId && intern.internId === effectiveUserId)) return false
      if (hasTooManyMissingFields(intern)) return false

      if (localFilters.name.trim() && !intern.internName.toLowerCase().includes(localFilters.name.toLowerCase().trim())) return false

      if (localFilters.location.length > 0 && !localFilters.location.some((v) => (intern.location || "").toLowerCase().includes(v.toLowerCase()))) return false
      if (localFilters.institution.length > 0 && !localFilters.institution.some((v) => (intern.institution || "").toLowerCase().includes(v.toLowerCase()))) return false
      if (localFilters.degree.length > 0 && !localFilters.degree.some((v) => (intern.degree || "").toLowerCase().includes(v.toLowerCase()))) return false
      if (localFilters.field.length > 0 && !localFilters.field.some((v) => formatLabel(intern.field).toLowerCase().includes(v.toLowerCase()))) return false
      if (localFilters.locationFlexibility.length > 0 && !localFilters.locationFlexibility.some((v) => (intern.locationFlexibility || "").toLowerCase().includes(v.toLowerCase()))) return false
      if (localFilters.fundingProgramType.length > 0 && !localFilters.fundingProgramType.some((v) => (intern.fundingProgramType || "").toLowerCase().includes(v.toLowerCase()))) return false

      if (localFilters.role.trim() && !formatLabel(intern.role).toLowerCase().includes(localFilters.role.toLowerCase().trim())) return false

      if ((intern.matchPercentage || 0) < localFilters.matchRange[0] || (intern.matchPercentage || 0) > localFilters.matchRange[1]) return false
      if ((intern.bigScore || 0) < localFilters.bigScoreRange[0] || (intern.bigScore || 0) > localFilters.bigScoreRange[1]) return false

      const currentStatusForFilter = updatedStages[intern.id] || intern.pipelineStage || intern.status
      if (localFilters.status.length > 0 && !localFilters.status.some((v) => (currentStatusForFilter || "").toLowerCase().includes(v.toLowerCase()))) return false
      if (localFilters.nextStage.length > 0) {
        const nextStageName = computeNextStageName(currentStatusForFilter)
        if (!localFilters.nextStage.some((v) => (nextStageName || "").toLowerCase().includes(v.toLowerCase()))) return false
      }

      return true
    })

    setFilteredInterns(updated)
  }, [localFilters, interns, updatedStages, effectiveUserId])

  useEffect(() => {
    if (onMatchesCountChange) {
      onMatchesCountChange(filteredInterns.length)
    }
  }, [filteredInterns, onMatchesCountChange])

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading applications...</div>
  }

  // Determine current stage fields based on the selected stage in the modal
  const currentStageFields = getStageFields(selectedStage)

  // ─── Derived filter options from real data (for columns with no fixed
  // predefined list) ─────────────────────────────────────────────────────
  const uniqueFields = [...new Set(interns.map((i) => formatLabel(i.field)).filter((v) => v && v !== "Not Specified"))]
  const uniqueLocationFlex = [...new Set(interns.map((i) => i.locationFlexibility).filter((v) => v && v !== "Not specified"))]
  const uniqueFundingPrograms = [...new Set(interns.map((i) => i.fundingProgramType).filter((v) => v && v !== "Not specified"))]
  const statusFilterOptions = applicationStages.map((s) => s.name)

  const activeFilterCount = (localFilters.name.trim() ? 1 : 0)
    + localFilters.location.length + localFilters.institution.length + localFilters.degree.length
    + localFilters.field.length + localFilters.locationFlexibility.length + localFilters.fundingProgramType.length
    + (localFilters.role.trim() ? 1 : 0)
    + (localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100 ? 1 : 0)
    + (localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100 ? 1 : 0)
    + localFilters.status.length + localFilters.nextStage.length

  const getFilterActive = (filterType) => {
    switch (filterType) {
      case "location": return localFilters.location.length > 0
      case "institution": return localFilters.institution.length > 0
      case "degree": return localFilters.degree.length > 0
      case "field": return localFilters.field.length > 0
      case "locationFlexibility": return localFilters.locationFlexibility.length > 0
      case "fundingProgramType": return localFilters.fundingProgramType.length > 0
      case "role": return !!localFilters.role.trim()
      case "match": return localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100
      case "bigScore": return localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100
      case "status": return localFilters.status.length > 0
      case "nextStage": return localFilters.nextStage.length > 0
      default: return false
    }
  }

  const densityStyles = {
    comfortable: { cell: "0.6rem 0.4rem", header: "0.6rem 0.4rem" },
    compact: { cell: "0.4rem 0.3rem", header: "0.4rem 0.3rem" },
  }
  const ds = densityStyles[density] || densityStyles.comfortable

  const visibleColumnKeys = columnOrder.filter((key) => columnVisibility[key])

  return (
    <div style={{ width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>

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
              Company Internship Applications - Role: {userRole?.toUpperCase()}
            </h3>
          </div>
          <p style={{
            margin: 0,
            color: '#4a5568',
            fontSize: '0.95rem',
            lineHeight: '1.5'
          }}>
            {userRole === 'owner' && 'You can view and manage all company internship applications.'}
            {userRole === 'admin' && 'You can view and request interns for the company.'}
            {userRole === 'manager' && 'You can view and update internship application stages.'}
            {userRole === 'employee' && 'You can view company internship applications.'}
            {userRole === 'viewer' && 'You have read-only access to company internship applications.'}
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-[#faf7f2] rounded-t-2xl p-4 border border-[#e6d7c3] border-b-0 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-[#4a352f] m-0">Intern Applications</h2>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
              <LayoutGrid size={12} className="text-[#7d5a50] flex-shrink-0" />
              Viewing: {activeView.name}
              {activeView.description && <span className="font-normal text-[#a89482]"> — {activeView.description}</span>}
            </span>
            {activeFilterCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#fff3e0] text-[#e65100] border border-[#e65100]/30">
                <SlidersHorizontal size={12} /> {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
              </span>
            )}
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                if (showCustomizeMenu) { setShowCustomizeMenu(false); setCustomizeMenuRect(null) }
                else { setCustomizeMenuRect(e.currentTarget.getBoundingClientRect()); setShowCustomizeMenu(true); setShowNewViewForm(false); setEditingViewMeta(null) }
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm"
            >
              <SlidersHorizontal size={16} /> Customize Table <ChevronDown size={14} className={`transition-transform ${showCustomizeMenu ? "rotate-180" : ""}`} />
            </button>
            {showCustomizeMenu && customizeMenuRect && (() => {
              const panelWidth = 320
              const margin = 12
              let left = customizeMenuRect.right - panelWidth
              left = Math.min(Math.max(left, margin), window.innerWidth - panelWidth - margin)
              const spaceBelow = window.innerHeight - customizeMenuRect.bottom - margin - 8
              const spaceAbove = customizeMenuRect.top - margin - 8
              const openUpward = spaceBelow < 320 && spaceAbove > spaceBelow
              const maxHeight = Math.max(200, Math.min(620, openUpward ? spaceAbove : spaceBelow))
              const top = openUpward ? undefined : customizeMenuRect.bottom + 8
              const bottom = openUpward ? window.innerHeight - customizeMenuRect.top + 8 : undefined
              const allViews = Object.values(viewsState.views).sort((a, b) => (a.builtin ? -1 : b.builtin ? 1 : a.name.localeCompare(b.name)))
              return (
                <PopupPortal>
                  <div className="fixed inset-0 z-40" onClick={() => { setShowCustomizeMenu(false); setCustomizeMenuRect(null); setShowNewViewForm(false); setEditingViewMeta(null) }} />
                  <div className="fixed bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-5 z-50 overflow-y-auto" style={{ left, width: panelWidth, top, bottom, maxHeight }}>
                    <h4 className="text-sm font-semibold text-[#4a352f] mb-1">Views</h4>
                    <p className="text-xs text-[#a89482] mb-3">Edits below auto-save into whichever view is selected.</p>
                    <div className="space-y-1 mb-3">
                      {allViews.map((view) => {
                        const isActive = view.id === viewsState.activeViewId
                        const isEditing = editingViewMeta?.id === view.id
                        if (isEditing) {
                          return (
                            <div key={view.id} className="p-2.5 rounded-lg border border-[#c8b6a6] bg-[#faf7f2] space-y-2">
                              {!view.builtin ? (
                                <input autoFocus value={editingViewMeta.name} onChange={(e) => setEditingViewMeta((prev) => ({ ...prev, name: e.target.value }))} placeholder="View name" className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm" />
                              ) : (
                                <p className="text-sm font-semibold text-[#4a352f]">Default <span className="font-normal text-[#a89482] text-xs">(name can't be changed)</span></p>
                              )}
                              <textarea value={editingViewMeta.description} onChange={(e) => setEditingViewMeta((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description (optional) — what is this view for?" rows={2} className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none" />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingViewMeta(null)} className="px-2.5 py-1 text-xs text-[#7d5a50] hover:text-[#4a352f]">Cancel</button>
                                <button onClick={saveViewMeta} className="px-2.5 py-1 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold">Save</button>
                              </div>
                            </div>
                          )
                        }
                        return (
                          <div key={view.id} className={`flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg ${isActive ? "bg-[#f5f0e1]" : "hover:bg-[#faf7f2]"}`}>
                            <button onClick={() => switchToView(view.id)} className="flex-1 text-left min-w-0">
                              <div className="flex items-center gap-1.5">
                                {isActive && <CheckCircle size={12} className="text-[#7d5a50] flex-shrink-0" />}
                                <span className={`text-sm ${isActive ? "font-semibold text-[#4a352f]" : "text-[#4a352f]"}`}>{view.name}</span>
                                {view.builtin && <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Built-in</span>}
                              </div>
                              {view.description && <p className="text-xs text-[#a89482] mt-0.5 truncate">{view.description}</p>}
                            </button>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <button onClick={() => startEditingViewMeta(view)} title="Rename / edit description" className="text-[#a89482] hover:text-[#7d5a50] p-1"><Settings size={13} /></button>
                              {!view.builtin && <button onClick={() => removeView(view.id)} title="Delete view" className="text-[#a89482] hover:text-red-500 p-1"><Trash2 size={13} /></button>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {showNewViewForm ? (
                      <div className="space-y-2 mb-1">
                        <input autoFocus value={newViewName} onChange={(e) => setNewViewName(e.target.value)} placeholder="New view name..." className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm" />
                        <textarea value={newViewDescription} onChange={(e) => setNewViewDescription(e.target.value)} placeholder="Description (optional) — what is this view for?" rows={2} className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none" />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setShowNewViewForm(false); setNewViewName(""); setNewViewDescription("") }} className="px-2.5 py-1 text-xs text-[#7d5a50] hover:text-[#4a352f]">Cancel</button>
                          <button onClick={createNewView} disabled={!newViewName.trim()} className="px-3 py-1.5 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold disabled:opacity-40">Create view</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowNewViewForm(true)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-[#c8b6a6] rounded-lg text-xs font-semibold text-[#7d5a50] hover:bg-[#faf7f2]">
                        <Plus size={13} /> New view from current layout
                      </button>
                    )}

                    <div className="border-t border-[#e6d7c3] my-4" />
                    <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Hide/Unhide</h4>
                    <p className="text-xs text-[#a89482] mb-3 flex items-center gap-1.5">
                      <GripVertical size={12} className="flex-shrink-0" /> Tip: drag any column header in the table to reorder it.
                    </p>
                    <label className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                      <input type="checkbox" checked={true} disabled={true} className="rounded border-[#c8b6a6]" />
                      <span className="text-sm text-[#4a352f]">Intern Name</span>
                    </label>
                    <div className="border-t border-[#e6d7c3] my-2" />
                    {DEFAULT_COLUMN_ORDER.map((key) => (
                      <label key={key} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-[#faf7f2] cursor-pointer">
                        <input type="checkbox" checked={columnVisibility[key] || false} onChange={() => toggleColumn(key)} className="rounded border-[#c8b6a6] text-[#7d5a50]" />
                        <span className="text-sm text-[#4a352f]">{COLUMN_DEFS[key].label}</span>
                      </label>
                    ))}

                    <div className="border-t border-[#e6d7c3] my-4" />
                    <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Density</h4>
                    <div className="flex gap-1.5">
                      {[{ key: "comfortable", label: "Comfortable" }, { key: "compact", label: "Compact" }].map((d) => (
                        <button key={d.key} onClick={() => setDensity(d.key)} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${density === d.key ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>
                          {d.label}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-[#e6d7c3] my-4" />
                    <button onClick={resetActiveViewToDefault} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#a67c52] hover:text-[#4a352f] hover:bg-[#faf7f2] border border-[#e6d7c3]">
                      <RotateCcw size={12} /> Reset "{activeView.name}" to factory defaults
                    </button>
                  </div>
                </PopupPortal>
              )
            })()}
          </div>
        </div>
      </div>

      {notification && (
        <div
          style={{
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "20px",
            backgroundColor: notification.type === "success" ? "#d4edda" : "#f8d7da",
            color: notification.type === "success" ? "#155724" : "#721c24",
            border: `1px solid ${notification.type === "success" ? "#c3e6cb" : "#f5c6cb"}`,
            fontSize: "0.8rem",
          }}
        >
          {notification.message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-lg overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
          <style>{`
            .it-th { color: #faf7f2 !important; vertical-align: top !important; }
            .it-th-draggable { cursor: grab; }
            .it-th-draggable:active { cursor: grabbing; }
            .it-th-label { flex: 1 1 auto; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; overflow-wrap: break-word; line-height: 1.2; }
          `}</style>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            fontSize: "0.8rem",
            backgroundColor: "#faf7f2",
            tableLayout: "auto",
          }}
        >
          <thead>
            <tr className="bg-[#4a352f]">
              <th className="it-th py-3 px-3 text-left font-semibold uppercase tracking-wider text-xs border-r border-[#e6d7c3] sticky top-0 left-0 z-30" style={{ backgroundColor: "#4a352f", minWidth: "180px", maxWidth: "200px" }}>
                <div className="flex items-start gap-1 min-w-0">
                  <span className="it-th-label">Intern Name</span>
                  <FilterTrigger type="name" active={!!localFilters.name.trim()} />
                </div>
              </th>

              {visibleColumnKeys.map((key) => {
                const col = COLUMN_DEFS[key]
                const isDragging = draggedColumn === key
                const isDragOver = dragOverColumn === key && draggedColumn !== key
                return (
                  <th
                    key={key}
                    draggable
                    onDragStart={(e) => handleColumnDragStart(e, key)}
                    onDragOver={(e) => handleColumnDragOver(e, key)}
                    onDrop={(e) => handleColumnDrop(e, key)}
                    onDragEnd={handleColumnDragEnd}
                    onMouseEnter={(e) => setDragHintRect(e.currentTarget.getBoundingClientRect())}
                    onMouseLeave={() => setDragHintRect(null)}
                    className={`it-th it-th-draggable py-3 px-3 font-semibold uppercase tracking-wider text-xs border-r border-[#e6d7c3] sticky top-0 z-20 select-none transition-opacity ${col.align === "center" ? "text-center" : "text-left"} ${isDragging ? "opacity-40" : ""}`}
                    style={{ minWidth: col.minWidth, backgroundColor: isDragOver ? "#5a423b" : "#4a352f" }}
                  >
                    <div className={`flex items-start gap-1 min-w-0 ${col.align === "center" ? "justify-center" : ""}`}>
                      <GripVertical size={11} className="opacity-40 flex-shrink-0 mt-0.5" />
                      <span className="it-th-label">{col.label}</span>
                      <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} />
                    </div>
                  </th>
                )
              })}

              <th className="it-th py-3 px-3 text-center font-semibold uppercase tracking-wider text-xs sticky top-0 z-20" style={{ backgroundColor: "#4a352f", minWidth: "150px" }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredInterns.length === 0 ? (
              <tr>
                <td colSpan={visibleColumnKeys.length + 2} style={{ ...tableCellStyle, textAlign: "center", color: "#666" }}>
                  No applications found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredInterns.map((intern) => {
                const currentStatus = updatedStages[intern.id] || intern.pipelineStage || intern.status
                const statusStyle = getStatusStyle(currentStatus)

                const renderCell = (key) => {
                  switch (key) {
                    case "location":
                      return (
                        <td key={key} style={tableCellStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "0.8rem" }}>
                            <span style={{ wordBreak: "break-word" }}>{intern.location}</span>
                          </div>
                        </td>
                      )
                    case "institution":
                      return <td key={key} style={tableCellStyle}><TruncatedText text={intern.institution} maxLength={25} /></td>
                    case "degree":
                      return <td key={key} style={tableCellStyle}><TruncatedText text={intern.degree} maxLength={20} /></td>
                    case "field":
                      return <td key={key} style={tableCellStyle}><TruncatedText text={formatLabel(intern.field)} maxLength={25} /></td>
                    case "locationFlexibility":
                      return <td key={key} style={tableCellStyle}><TruncatedText text={intern.locationFlexibility} maxLength={15} /></td>
                    case "role":
                      return <td key={key} style={tableCellStyle}><TruncatedText text={formatLabel(intern.role)} maxLength={25} /></td>
                    case "fundingProgramType":
                      return <td key={key} style={tableCellStyle}><TruncatedText text={intern.fundingProgramType} maxLength={18} /></td>
                    case "matchPercentage":
                      return (
                        <td key={key} style={tableCellStyle}>
                          <div style={matchContainerStyle}>
                            <div style={progressBarStyle}>
                              <div
                                style={{
                                  ...progressFillStyle,
                                  width: `${intern.matchPercentage}%`,
                                  background: `linear-gradient(90deg, ${intern.matchPercentage > 75 ? "#48BB78" : intern.matchPercentage > 50 ? "#D69E2E" : "#E53E3E"}, ${intern.matchPercentage > 75 ? "#48BB78" : intern.matchPercentage > 50 ? "#D69E2E" : "#E53E3E"}aa)`,
                                }}
                              />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <span
                                style={{
                                  ...matchScoreStyle,
                                  color: intern.matchPercentage > 75 ? "#48BB78" : intern.matchPercentage > 50 ? "#D69E2E" : "#E53E3E",
                                }}
                              >
                                {intern.matchPercentage}%
                              </span>
                              <Eye
                                size={14}
                                style={{ cursor: "pointer", color: "#a67c52" }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMatchScoreBreakdown(intern)
                                }}
                                title="View match breakdown"
                              />
                            </div>
                          </div>
                        </td>
                      )
                    case "bigScore":
                      return (
                        <td key={key} style={tableCellStyle}>
                          <div style={matchContainerStyle}>
                            <div style={progressBarStyle}>
                              <div
                                style={{
                                  ...progressFillStyle,
                                  width: `${intern.bigScore}%`,
                                  background: `linear-gradient(90deg, ${getScoreColor(intern.bigScore)}, ${getScoreColor(intern.bigScore)}aa)`,
                                }}
                              />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <span style={{ color: getScoreColor(intern.bigScore), fontWeight: "500", fontSize: "0.75rem" }}>
                                {intern.bigScore}%
                              </span>
                              <Eye
                                size={14}
                                style={{ cursor: "pointer", color: "#a67c52" }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleBigScoreClick(intern)
                                }}
                                title="View BIG score breakdown"
                              />
                            </div>
                          </div>
                        </td>
                      )
                    case "status":
                      return (
                        <td key={key} style={tableCellStyle}>
                          <span style={{ ...statusBadgeStyle, backgroundColor: statusStyle.color, color: statusStyle.textColor }}>
                            {currentStatus}
                          </span>
                        </td>
                      )
                    case "nextStage":
                      return (
                        <td key={key} style={tableCellStyle}>
                          <NextStageIndicator currentStage={currentStatus} />
                        </td>
                      )
                    default:
                      return null
                  }
                }

                return (
                  <tr key={intern.id} style={{ borderBottom: "1px solid #e6d7c3" }}>
                    <td
                      className="sticky left-0 border-r border-[#e6d7c3] z-10"
                      style={{ ...tableCellStyle, minWidth: "180px", maxWidth: "200px", backgroundColor: "#ffffff" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: 500, color: "#4a352f", wordBreak: "break-word" }}>{intern.internName}</span>
                        <button
                          onClick={() => handleViewDetails(intern)}
                          style={{ background: "none", border: "none", color: "#a89482", cursor: "pointer", padding: 0, flexShrink: 0, display: "flex" }}
                          aria-label={`View details for ${intern.internName}`}
                          title="View details"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </td>

                    {visibleColumnKeys.map((key) => renderCell(key))}

                    <td style={{ ...tableCellStyle, borderRight: "none" }}>
                      {intern.status === "Matched" ? (
                        <button
                          onClick={() => handleRequestIntern(intern)}
                          style={{
                            padding: "6px 8px",
                            backgroundColor: "#7d5a50",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: "500",
                            width: "100%",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Request
                        </button>
                      ) : intern.status === "Requested" ? (
                        <button
                          style={{
                            padding: "6px 8px",
                            backgroundColor: "#7d5a50",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: "500",
                            width: "100%",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Awaiting Response
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStageAction(intern)}
                          style={{
                            padding: "6px 8px",
                            backgroundColor: "#7d5a50",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: "500",
                            width: "100%",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Update Stage
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Drag-to-reorder hint tooltip */}
      {dragHintRect && !draggedColumn && (
        <PopupPortal>
          <div className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal flex items-center gap-1.5" style={{ top: dragHintRect.bottom + 8, left: Math.min(Math.max(dragHintRect.left, 12), window.innerWidth - 200), width: "190px" }}>
            <GripVertical size={12} className="flex-shrink-0" /> Drag to reorder columns
          </div>
        </PopupPortal>
      )}

      {/* Column header filter popover */}
      {headerFilterOpen && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1090]" onClick={closeHeaderFilter} />
          <div className="fixed z-[1091] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-4" style={{ top: headerFilterOpen.rect.bottom + 8, left: Math.min(Math.max(headerFilterOpen.rect.left - 20, 12), window.innerWidth - 312), width: "300px", maxHeight: "70vh", overflowY: "auto" }}>
            {headerFilterOpen.type === "name" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Intern name</label>
                  {localFilters.name && <button onClick={() => setLocalFilters((p) => ({ ...p, name: "" }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <input autoFocus type="text" value={localFilters.name} onChange={(e) => setLocalFilters((p) => ({ ...p, name: e.target.value }))} placeholder="Search intern name..." className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20" />
              </>
            )}

            {headerFilterOpen.type === "location" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Location (Province)</label>
                  {localFilters.location.length > 0 && <button onClick={() => setLocalFilters((p) => ({ ...p, location: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto">
                  {southAfricanProvinces.map((prov) => (
                    <button key={prov} onClick={() => setLocalFilters((p) => ({ ...p, location: p.location.includes(prov) ? p.location.filter((x) => x !== prov) : [...p.location, prov] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.location.includes(prov) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>{prov}</button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === "institution" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Institution</label>
                  {localFilters.institution.length > 0 && <button onClick={() => setLocalFilters((p) => ({ ...p, institution: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto">
                  {institutionFilterOptions.map((inst) => (
                    <button key={inst} onClick={() => setLocalFilters((p) => ({ ...p, institution: p.institution.includes(inst) ? p.institution.filter((x) => x !== inst) : [...p.institution, inst] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.institution.includes(inst) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>{inst}</button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === "degree" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Degree</label>
                  {localFilters.degree.length > 0 && <button onClick={() => setLocalFilters((p) => ({ ...p, degree: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto">
                  {degreeFilterOptions.map((deg) => (
                    <button key={deg} onClick={() => setLocalFilters((p) => ({ ...p, degree: p.degree.includes(deg) ? p.degree.filter((x) => x !== deg) : [...p.degree, deg] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.degree.includes(deg) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>{deg}</button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === "field" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Field</label>
                  {localFilters.field.length > 0 && <button onClick={() => setLocalFilters((p) => ({ ...p, field: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto">
                  {uniqueFields.length === 0 && <span className="text-xs text-[#a89482]">No field data available</span>}
                  {uniqueFields.map((f) => (
                    <button key={f} onClick={() => setLocalFilters((p) => ({ ...p, field: p.field.includes(f) ? p.field.filter((x) => x !== f) : [...p.field, f] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.field.includes(f) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>{f}</button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === "locationFlexibility" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Location Flexibility</label>
                  {localFilters.locationFlexibility.length > 0 && <button onClick={() => setLocalFilters((p) => ({ ...p, locationFlexibility: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueLocationFlex.length === 0 && <span className="text-xs text-[#a89482]">No data available</span>}
                  {uniqueLocationFlex.map((v) => (
                    <button key={v} onClick={() => setLocalFilters((p) => ({ ...p, locationFlexibility: p.locationFlexibility.includes(v) ? p.locationFlexibility.filter((x) => x !== v) : [...p.locationFlexibility, v] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.locationFlexibility.includes(v) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>{v}</button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === "role" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Role</label>
                  {localFilters.role && <button onClick={() => setLocalFilters((p) => ({ ...p, role: "" }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <input autoFocus type="text" value={localFilters.role} onChange={(e) => setLocalFilters((p) => ({ ...p, role: e.target.value }))} placeholder="Search role..." className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20" />
              </>
            )}

            {headerFilterOpen.type === "fundingProgramType" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Funding Program</label>
                  {localFilters.fundingProgramType.length > 0 && <button onClick={() => setLocalFilters((p) => ({ ...p, fundingProgramType: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueFundingPrograms.length === 0 && <span className="text-xs text-[#a89482]">No data available</span>}
                  {uniqueFundingPrograms.map((v) => (
                    <button key={v} onClick={() => setLocalFilters((p) => ({ ...p, fundingProgramType: p.fundingProgramType.includes(v) ? p.fundingProgramType.filter((x) => x !== v) : [...p.fundingProgramType, v] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.fundingProgramType.includes(v) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>{v}</button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === "match" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Match %: {localFilters.matchRange[0]} - {localFilters.matchRange[1]}</label>
                  {(localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100) && <button onClick={() => setLocalFilters((p) => ({ ...p, matchRange: [0, 100] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <input type="number" min="0" max="100" value={localFilters.matchRange[0]} onChange={(e) => setLocalFilters((p) => ({ ...p, matchRange: [Math.min(parseInt(e.target.value) || 0, p.matchRange[1]), p.matchRange[1]] }))} className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                  <span className="text-[#7d5a50]">to</span>
                  <input type="number" min="0" max="100" value={localFilters.matchRange[1]} onChange={(e) => setLocalFilters((p) => ({ ...p, matchRange: [p.matchRange[0], Math.max(parseInt(e.target.value) || 0, p.matchRange[0])] }))} className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                </div>
                <input type="range" min="0" max="100" value={localFilters.matchRange[0]} onChange={(e) => setLocalFilters((p) => ({ ...p, matchRange: [parseInt(e.target.value), p.matchRange[1]] }))} className="w-full accent-[#7d5a50]" />
              </>
            )}

            {headerFilterOpen.type === "bigScore" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">BIG Score: {localFilters.bigScoreRange[0]} - {localFilters.bigScoreRange[1]}</label>
                  {(localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100) && <button onClick={() => setLocalFilters((p) => ({ ...p, bigScoreRange: [0, 100] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <input type="number" min="0" max="100" value={localFilters.bigScoreRange[0]} onChange={(e) => setLocalFilters((p) => ({ ...p, bigScoreRange: [Math.min(parseInt(e.target.value) || 0, p.bigScoreRange[1]), p.bigScoreRange[1]] }))} className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                  <span className="text-[#7d5a50]">to</span>
                  <input type="number" min="0" max="100" value={localFilters.bigScoreRange[1]} onChange={(e) => setLocalFilters((p) => ({ ...p, bigScoreRange: [p.bigScoreRange[0], Math.max(parseInt(e.target.value) || 0, p.bigScoreRange[0])] }))} className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                </div>
                <input type="range" min="0" max="100" value={localFilters.bigScoreRange[0]} onChange={(e) => setLocalFilters((p) => ({ ...p, bigScoreRange: [parseInt(e.target.value), p.bigScoreRange[1]] }))} className="w-full accent-[#7d5a50]" />
              </>
            )}

            {headerFilterOpen.type === "status" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Status</label>
                  {localFilters.status.length > 0 && <button onClick={() => setLocalFilters((p) => ({ ...p, status: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {statusFilterOptions.map((s) => (
                    <button key={s} onClick={() => setLocalFilters((p) => ({ ...p, status: p.status.includes(s) ? p.status.filter((x) => x !== s) : [...p.status, s] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.status.includes(s) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>{s}</button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === "nextStage" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Next Stage</label>
                  {localFilters.nextStage.length > 0 && <button onClick={() => setLocalFilters((p) => ({ ...p, nextStage: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {statusFilterOptions.map((s) => (
                    <button key={s} onClick={() => setLocalFilters((p) => ({ ...p, nextStage: p.nextStage.includes(s) ? p.nextStage.filter((x) => x !== s) : [...p.nextStage, s] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.nextStage.includes(s) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>{s}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </PopupPortal>
      )}


      {/* View Details Modal */}
      {showInternDetails && selectedInternDetails && (
        <InternDetailsModal
          intern={selectedInternDetails}
          isOpen={showInternDetails}
          onClose={() => { setShowInternDetails(false); setSelectedInternDetails(null) }}
        />
      )}

      {/* Match Score Breakdown Modal */}
      {selectedIntern &&
        modalType === "matchBreakdown" &&
        createPortal(
          <div style={modalOverlayStyle} onClick={resetModal}>
            <div style={{ ...modalContentStyle, maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}
              >
                <h3 style={{ fontSize: "24px", fontWeight: "800", color: "#4a352f", margin: 0 }}>
                  Match Score Breakdown
                </h3>
                <button
                  onClick={resetModal}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#666",
                  }}
                >
                  <X size={24} />
                </button>
              </div>
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    fontSize: "48px",
                    fontWeight: "800",
                    color: getScoreColor(selectedIntern.matchPercentage),
                    textAlign: "center",
                    marginBottom: "16px",
                  }}
                >
                  {selectedIntern.matchPercentage}%
                </div>
                <p style={{ textAlign: "center", color: "#666", fontSize: "14px" }}>Overall Match Score</p>
              </div>
              {selectedIntern.matchAnalysis && selectedIntern.matchAnalysis.breakdown && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {Object.entries(selectedIntern.matchAnalysis.breakdown).map(([key, data]) => (
                    <div
                      key={key}
                      style={{
                        padding: "16px",
                        backgroundColor:
                          data.score >= data.maxScore * 0.7
                            ? "#e8f5e9"
                            : data.score >= data.maxScore * 0.4
                              ? "#fff3e0"
                              : "#ffebee",
                        borderRadius: "8px",
                        border: `1px solid ${data.score >= data.maxScore * 0.7 ? "#c8e6c9" : data.score >= data.maxScore * 0.4 ? "#ffe0b2" : "#ffcdd2"}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <strong style={{ color: "#4a352f" }}>
                          {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </strong>
                        <span
                          style={{
                            color:
                              data.score >= data.maxScore * 0.7
                                ? "#388e3c"
                                : data.score >= data.maxScore * 0.4
                                  ? "#f57c00"
                                  : "#d32f2f",
                            fontWeight: "600",
                          }}
                        >
                          {data.score}/{data.maxScore}
                        </span>
                      </div>
                      <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>{data.description}</p>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                <button
                  onClick={resetModal}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#7d5a50",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* BIG Score Modal */}
      {selectedIntern &&
        modalType === "bigScore" &&
        createPortal(
          <div style={modalOverlayStyle} onClick={resetModal}>
            <div style={{ ...modalContentStyle, maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "24px", fontWeight: "800", color: "#4a352f", margin: 0 }}>
                  BIG Score Breakdown
                </h3>
                <button onClick={resetModal} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#666" }}>
                  <X size={24} />
                </button>
              </div>
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "48px", fontWeight: "800", color: getScoreColor(selectedIntern.bigScore), textAlign: "center", marginBottom: "16px" }}>
                  {selectedIntern.bigScore}%
                </div>
                <p style={{ textAlign: "center", color: "#666", fontSize: "14px" }}>BIG Assessment Score</p>
              </div>
              {selectedIntern.evaluationScores && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { label: "Academic", value: selectedIntern.evaluationScores.academic },
                    { label: "Professional Presentation", value: selectedIntern.evaluationScores.professionalPresentation },
                    { label: "Professional Skills", value: selectedIntern.evaluationScores.professionalSkills },
                    { label: "Work Experience", value: selectedIntern.evaluationScores.workExperience },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: "12px 16px", backgroundColor: "#f9f5f0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "14px", color: "#4a352f", fontWeight: "600" }}>{item.label}</span>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: getScoreColor(item.value) }}>{item.value}%</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                <button onClick={resetModal} style={{ padding: "12px 24px", backgroundColor: "#7d5a50", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {/* Stage Update Modal */}
      {showStageModal &&
        selectedInternForStage &&
        createPortal(
          <div style={modalOverlayStyle} onClick={() => setShowStageModal(false)}>
            <div style={{ ...modalContentStyle, maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}
              >
                <h3 style={{ fontSize: "24px", fontWeight: "800", color: "#4a352f", margin: 0 }}>
                  Update Stage - {selectedInternForStage.internName}
                </h3>
                <button
                  onClick={() => {
                    setShowStageModal(false)
                    resetStageModal()
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#666",
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Stage Selection */}
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#4a352f",
                    marginBottom: "12px",
                  }}
                >
                  Select New Stage:
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => {
                    setSelectedStage(e.target.value)
                    // Clear previous errors related to stage selection
                    setFormErrors({ ...formErrors, selectedStage: "" })
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: formErrors.selectedStage ? "2px solid #dc2626" : "2px solid #c8b6a6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: "#f5f0e1",
                  }}
                >
                  <option value="">Select a stage...</option>
                  {applicationStages.map((stage) => (
                    <option key={stage.id} value={stage.name}>
                      {stage.name}
                    </option>
                  ))}
                </select>
                {formErrors.selectedStage && (
                  <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>{formErrors.selectedStage}</p>
                )}
              </div>

              {/* Conditional Fields based on stage */}
              {selectedStage && (
                <>
                  {/* Notes Field */}
                  <div style={{ marginBottom: "24px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#4a352f",
                        marginBottom: "12px",
                      }}
                    >
                      Notes:
                    </label>
                    <textarea
                      value={stageNotes}
                      onChange={(e) => {
                        setStageNotes(e.target.value)
                        if (e.target.value.trim() && !formErrors.stageNotes) {
                          setFormErrors({ ...formErrors, stageNotes: "" })
                        }
                      }}
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: formErrors.stageNotes ? "2px solid #dc2626" : "2px solid #c8b6a6",
                        borderRadius: "8px",
                        fontSize: "14px",
                        backgroundColor: "#f5f0e1",
                        resize: "vertical",
                      }}
                      placeholder="Add notes about this stage update..."
                    />
                    {formErrors.stageNotes && (
                      <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>{formErrors.stageNotes}</p>
                    )}
                  </div>

                  {/* Meeting Schedule - Only for interview stages */}
                  {currentStageFields.showMeeting && (
                    <div
                      style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#f9f5f0", borderRadius: "8px" }}
                    >
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#4a352f",
                          marginBottom: "16px",
                        }}
                      >
                        Schedule Meeting
                      </h4>

                      <div
                        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}
                      >
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#4a352f",
                              marginBottom: "8px",
                            }}
                          >
                            Location:
                          </label>
                          <input
                            type="text"
                            value={meetingLocation}
                            onChange={(e) => {
                              setMeetingLocation(e.target.value)
                              if (e.target.value.trim()) {
                                setFormErrors({ ...formErrors, meetingLocation: "" })
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              border: formErrors.meetingLocation ? "2px solid #dc2626" : "2px solid #c8b6a6",
                              borderRadius: "6px",
                              fontSize: "14px",
                              backgroundColor: "white",
                            }}
                            placeholder="Office, Virtual, etc."
                          />
                          {formErrors.meetingLocation && (
                            <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                              {formErrors.meetingLocation}
                            </p>
                          )}
                        </div>
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#4a352f",
                              marginBottom: "8px",
                            }}
                          >
                            Purpose:
                          </label>
                          <input
                            type="text"
                            value={meetingPurpose}
                            onChange={(e) => {
                              setMeetingPurpose(e.target.value)
                              if (e.target.value.trim()) {
                                setFormErrors({ ...formErrors, meetingPurpose: "" })
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              border: formErrors.meetingPurpose ? "2px solid #dc2626" : "2px solid #c8b6a6",
                              borderRadius: "6px",
                              fontSize: "14px",
                              backgroundColor: "white",
                            }}
                            placeholder="Initial discussion, strategy review, etc."
                          />
                          {formErrors.meetingPurpose && (
                            <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                              {formErrors.meetingPurpose}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Date and Time Selection for Interview */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#4a352f",
                              marginBottom: "8px",
                            }}
                          >
                            Date:
                          </label>
                          <input
                            type="date"
                            value={interviewDate}
                            onChange={(e) => setInterviewDate(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              border: "2px solid #c8b6a6",
                              borderRadius: "6px",
                              fontSize: "14px",
                              backgroundColor: "white",
                            }}
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#4a352f",
                              marginBottom: "8px",
                            }}
                          >
                            Time:
                          </label>
                          <input
                            type="time"
                            value={interviewTime}
                            onChange={(e) => setInterviewTime(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              border: "2px solid #c8b6a6",
                              borderRadius: "6px",
                              fontSize: "14px",
                              backgroundColor: "white",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Availability Selection - Only for stages requiring availability */}
                  {currentStageFields.showAvailability && (
                    <div
                      style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#f9f5f0", borderRadius: "8px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "16px",
                        }}
                      >
                        <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#4a352f", margin: 0 }}>
                          Set Availability
                        </h4>
                        <button
                          onClick={() => setShowCalendarModal(true)}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#7d5a50",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          Add Availability
                        </button>
                      </div>
                      {availabilities.length > 0 ? (
                        <div style={{ maxHeight: "200px", overflowY: "auto", paddingRight: "8px" }}>
                          {availabilities.map((avail, index) => (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px",
                                borderBottom: "1px solid #e6d7c3",
                                fontSize: "13px",
                                color: "#4a352f",
                              }}
                            >
                              <span>
                                {avail.date.toLocaleDateString("en-US", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}{" "}
                                {avail.timeSlots?.[0]?.start} - {avail.timeSlots?.[0]?.end} ({avail.timeZone})
                              </span>
                              <button
                                onClick={() => removeAvailability(avail.date)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#d32f2f",
                                  cursor: "pointer",
                                  fontSize: "16px",
                                }}
                              >
                                ✖
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: "14px", color: "#a89482", textAlign: "center" }}>
                          No availability slots added yet.
                        </p>
                      )}
                      {formErrors.availabilities && (
                        <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "8px", textAlign: "center" }}>
                          {formErrors.availabilities}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Term Sheet Upload - Only show for specific stages */}
                  {currentStageFields.showTermSheet && (
                    <div style={{ marginBottom: "24px" }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#4a352f",
                          marginBottom: "12px",
                        }}
                      >
                        Term Sheet Upload:
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          setTermSheetFile(e.target.files[0])
                          if (e.target.files[0]) {
                            setFormErrors({ ...formErrors, termSheetFile: "" })
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: formErrors.termSheetFile ? "2px solid #dc2626" : "2px solid #c8b6a6",
                          borderRadius: "8px",
                          fontSize: "14px",
                          backgroundColor: "#f5f0e1",
                        }}
                      />
                      {termSheetFile && (
                        <p style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
                          Selected: {termSheetFile.name}
                        </p>
                      )}
                      {formErrors.termSheetFile && (
                        <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                          {formErrors.termSheetFile}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  onClick={() => {
                    setShowStageModal(false)
                    resetStageModal()
                  }}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "transparent",
                    color: "#666",
                    border: "2px solid #ddd",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "16px",
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleStageUpdate}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#7d5a50",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  disabled={isSubmitting || !selectedStage}
                >
                  {isSubmitting ? "Updating..." : "Update Stage"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Calendar Modal for Availability Selection */}
      {showCalendarModal &&
        createPortal(
          <div style={modalOverlayStyle} onClick={() => setShowCalendarModal(false)}>
            <div style={{ ...modalContentStyle, maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}
              >
                <h3 style={{ fontSize: "24px", fontWeight: "800", color: "#4a352f", margin: 0 }}>
                  Select Availability Dates
                </h3>
                <button
                  onClick={() => setShowCalendarModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#666",
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                {/* Date Picker */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#4a352f",
                      marginBottom: "12px",
                    }}
                  >
                    Select Dates:
                  </label>
                  {/* Placeholder for actual date picker component */}
                  <div
                    style={{
                      border: "2px solid #c8b6a6",
                      borderRadius: "8px",
                      padding: "12px",
                      backgroundColor: "#f5f0e1",
                      minHeight: "150px", // To ensure it has some height even if empty
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#a89482",
                      fontSize: "14px",
                    }}
                  >
                    Coming Soon: Interactive Date Picker
                  </div>
                </div>

                {/* Time Slot Selection */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#4a352f",
                      marginBottom: "12px",
                    }}
                  >
                    Time Slot:
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <input
                      type="time"
                      value={timeSlot.start}
                      onChange={(e) => handleTimeChange("start", e.target.value)}
                      style={{
                        padding: "10px",
                        border: "2px solid #c8b6a6",
                        borderRadius: "6px",
                        fontSize: "14px",
                        backgroundColor: "#f5f0e1",
                      }}
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={timeSlot.end}
                      onChange={(e) => handleTimeChange("end", e.target.value)}
                      style={{
                        padding: "10px",
                        border: "2px solid #c8b6a6",
                        borderRadius: "6px",
                        fontSize: "14px",
                        backgroundColor: "#f5f0e1",
                      }}
                    />
                  </div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#4a352f",
                      marginBottom: "12px",
                    }}
                  >
                    Timezone:
                  </label>
                  <input
                    type="text"
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    style={{
                      width: "calc(100% - 24px)",
                      padding: "10px",
                      border: "2px solid #c8b6a6",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "#f5f0e1",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  onClick={() => setShowCalendarModal(false)}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#c8b6a6",
                    color: "#4a352f",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveSelectedDates}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#7d5a50",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Save Availability
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default InternTablePage