"use client"

import { useState, useEffect } from "react"
import { BarChart3, Calendar, Filter, X, Info, ExternalLink, Eye, ChevronRight } from "lucide-react"
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
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { createPortal } from "react-dom"
import "react-circular-progressbar/dist/styles.css"
import emailjs from '@emailjs/browser';
import { API_KEYS } from "../../API"

// Inside your component render return
const southAfricanCities = [
  "Johannesburg",
  "Cape Town",
  "Pretoria",
  "Durban",
  "Stellenbosch",
  "Grahamstown",
  "Potchefstroom",
  "Bloemfontein",
  "Port Elizabeth",
  "East London",
  "Pietermaritzburg",
  "Kimberley",
  "Mafikeng",
  "Polokwane",
  "Nelspruit",
  "Rustenburg",
  "Welkom",
  "Vanderbijlpark",
  "George",
  "Other",
].sort((a, b) => a.localeCompare(b))

// South African universities and institutions
const southAfricanInstitutions = [
  // Traditional Universities
  "University of Cape Town",
  "University of the Witwatersrand",
  "Stellenbosch University",
  "University of Pretoria",
  "University of KwaZulu-Natal",
  "Rhodes University",
  "University of the Free State",
  "University of Johannesburg",
  "University of the Western Cape",
  "University of Limpopo",
  "North-West University",
  "University of Venda",
  "University of Fort Hare",
  "University of Zululand",
  "University of South Africa (UNISA)",

  // Universities of Technology
  "Cape Peninsula University of Technology",
  "Central University of Technology",
  "Durban University of Technology",
  "Mangosuthu University of Technology",
  "Tshwane University of Technology",
  "Vaal University of Technology",

  // TVET Colleges (grouped)
  "TVET College",

  // Private Colleges (grouped)
  "Private College",

  // Other
  "Other",
].sort((a, b) => a.localeCompare(b))

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
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          fontSize: "12px",
          color: "#999",
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
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          fontSize: "12px",
          color: "#999",
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
        <ChevronRight size={14} color="#5d4037" />
        <span
          style={{
            fontSize: "12px",
            fontWeight: "500",
            color: "#5d4037",
          }}
        >
          {formatStageName(nextStage)}
        </span>
      </div>
    </div>
  )
}

// Sample Intern Data (for initial load or when no data is found)
const sampleInterns = [
  // {
  //   id: "sample1",
  //   internId: "sample_intern_1",
  //   applicationId: "sample_app_1",
  //   internName: "Alice Wonderland",
  //   location: "Cape Town",
  //   institution: "University of Cape Town",
  //   degree: "BSc Computer Science",
  //   field: "Information Technology",
  //   internType: "Full-time",
  //   role: "Software Developer Intern",
  //   sponsorName: "Tech Innovators Inc.",
  //   fundingProgramType: "General",
  //   startDate: "2024-09-01",
  //   bigScore: 85,
  //   matchPercentage: 92,
  //   status: "Confirmed",
  //   pipelineStage: "confirmed",
  //   action: "Application Received",
  //   availableDates: [],
  //   locationFlexibility: "Hybrid",
  //   matchAnalysis: {
  //     breakdown: {
  //       skillsMatch: { score: 28, maxScore: 30, matched: true, description: "Strong match in Python and Java." },
  //       workModeMatch: { score: 22, maxScore: 25, matched: true, description: "Compatible with Hybrid work mode." },
  //       locationMatch: { score: 18, maxScore: 20, matched: true, description: "Lives in same province." },
  //       availabilityMatch: {
  //         score: 13,
  //         maxScore: 15,
  //         matched: true,
  //         description: "Available one week after required start.",
  //       },
  //       additionalFactors: {
  //         score: 8,
  //         maxScore: 10,
  //         matched: true,
  //         description: "Has graduation year and internship type.",
  //       },
  //     },
  //     matchSummary: {
  //       overallScore: 89,
  //       matchPercentage: 89,
  //       overallAssessment: "Excellent Match",
  //       strongPoints: ["Skills", "Location"],
  //       weakPoints: [],
  //     },
  //   },
  //   profileEmail: "alice@example.com",
  //   phone: "071 234 5678",
  //   nationalId: "9001015000000",
  //   availabilityStart: "2024-09-08",
  //   availableHours: "9am - 5pm",
  //   internTypePreference: "Full-time",
  //   languagesSpoken: ["English"],
  //   technicalSkills: ["Python", "Java", "SQL"],
  //   industryInterests: ["Technology", "Software Development"],
  //   careerGoals: "Become a full-stack developer",
  //   cvUrl: "/docs/alice_cv.pdf",
  //   idDocumentUrl: "/docs/alice_id.pdf",
  //   transcriptUrl: "/docs/alice_transcript.pdf",
  //   motivationLetterUrl: "/docs/alice_motivation.pdf",
  //   portfolioFileUrl: "/docs/alice_portfolio.pdf",
  //   proofOfStudyUrl: "/docs/alice_proof.pdf",
  //   referencesUrl: "/docs/alice_references.pdf",
  //   completedSections: { profile: true, education: true, skills: true },
  //   profileCreatedAt: new Date("2023-01-15"),
  //   profileLastUpdated: new Date("2024-05-20"),
  //   applicationCreatedAt: new Date("2024-07-01"),
  //   applicationUpdatedAt: new Date("2024-07-10"),
  // },
]

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
            borderBottom: "1px solid #E8D5C4",
            background: "#FEFCFA",
          }}
        >
          <h3
            style={{
              margin: "0",
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#5D2A0A",
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
              color: "#5D2A0A",
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
              borderBottom: "2px solid #E8D5C4",
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
                color: "#8D6E63",
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
                        color: "#8D6E63",
                      }}
                    >
                      Weight: {details.weight}%
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#8D6E63",
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
              background: "#F5EBE0",
              border: "1px solid #E8D5C4",
              borderRadius: "8px",
              padding: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <h4
              style={{
                fontSize: "1rem",
                fontWeight: "600",
                color: "#5D2A0A",
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
                      border: "1px solid #E8D5C4",
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
                        color: "#5D2A0A",
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
              onClick={onClose}
            >
              Close Breakdown
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function InternTablePage({ filters, stageFilter, matchesCount, profileMatchesCount }) {
  const [interns, setInterns] = useState([])
  const [filteredInterns, setFilteredInterns] = useState([])
  const [selectedIntern, setSelectedIntern] = useState(null)
  const [modalType, setModalType] = useState(null)
  const [message, setMessage] = useState("")
  const [interviewDate, setInterviewDate] = useState("")
  const [interviewTime, setInterviewTime] = useState("")
  const [interviewLocation, setInterviewLocation] = useState("")
  const [formErrors, setFormErrors] = useState({})

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
  const [termSheetFile, setTermSheetFile] = useState(null) // State for term sheet file
  const [statuses, setStatuses] = useState({})
  // Availability management state
  const [availabilities, setAvailabilities] = useState([])
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [tempDates, setTempDates] = useState([])
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" })
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [localFilters, setLocalFilters] = useState({
    location: "",
    matchScore: 0,
    institution: "",
    degree: "",
    field: "",
    internType: "",
    fundingProgram: "",
    fundingProgramType: "",
    startDate: "",
    sortBy: "matchPercentage",
  })
  const [updatingStageForIntern, setUpdatingStageForIntern] = useState(null)
  const [showFilters, setShowFilters] = useState(false) // State to control filter modal visibility
  const [bigScoreData, setBigScoreData] = useState({
    // State for BIG score breakdown
    PresentationScore: { score: 0, color: "#000" },
    ProfessionalSkillsScore: { score: 0, color: "#000" },
    WorkExperienceScore: { score: 0, color: "#000" },
    AcademicScore: { score: 0, color: "#000" },
  })

  // Dynamically determine which fields to show based on the selected stage
  const getStageFields = (stage) => {
    const fields = {
      showMessage: true, // Message is generally always shown
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
        fields.showMeeting = true // Meeting might still be relevant
        break
      case "Applied":
        fields.showMessage = true // Explicitly set for clarity
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

    // Availability is typically used when scheduling interviews or follow-ups
    if (stage === "Contacted/Interview" || stage === "Interviewed" || stage === "Confirmed") {
      fields.showAvailability = true
    }

    return fields
  }

  // Define available stages for the dropdown
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

  // Handle time slot changes
  const handleTimeChange = (type, value) => {
    setTimeSlot((prev) => ({ ...prev, [type]: value }))
  }

  // Handle date selection for availability
  const handleDateSelect = (selected) => {
    setTempDates(selected || [])
  }

  // Add selected dates and time slot to availabilities state
  const saveSelectedDates = () => {
    const newAvailabilities = tempDates.map((date) => ({
      date,
      timeSlots: [{ start: timeSlot.start, end: timeSlot.end }],
      timeZone: timeZone,
      status: "available", // Default status
    }))
    setAvailabilities((prev) => [...prev, ...newAvailabilities])
    setShowCalendarModal(false)
    setTempDates([]) // Reset temp dates
  }

  // Remove an availability slot
  const removeAvailability = (dateToRemove) => {
    setAvailabilities((prev) => prev.filter((avail) => avail.date.getTime() !== dateToRemove.getTime()))
  }

  // Load availability data for a specific intern
  const loadApplicationAvailability = (intern) => {
    if (intern?.availableDates && Array.isArray(intern.availableDates)) {
      setAvailabilities(
        intern.availableDates.map((avail) => ({
          ...avail,
          date: new Date(avail.date), // Ensure dates are Date objects
          timeSlots: Array.isArray(avail.timeSlots) ? avail.timeSlots : [{ start: "09:00", end: "17:00" }], // Ensure timeSlots is an array
          timeZone: avail.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone, // Default timezone
        })),
      )
    } else {
      setAvailabilities([])
    }
  }

  // Render document links safely
  const renderDocumentLink = (url, text) => {
    if (!url) return null
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#a67c52", textDecoration: "underline" }}>
        {text} <ExternalLink size={12} style={{ marginLeft: "4px" }} />
      </a>
    )
  }

  // Function to handle clicking the Match Score breakdown
  const handleMatchScoreBreakdown = (intern) => {
    setSelectedIntern(intern)
    setModalType("matchBreakdown")
  }

  // Function to reset modal states
  const resetModal = () => {
    setSelectedIntern(null)
    setModalType(null)
  }

  useEffect(() => {
    const fetchInternApplications = async () => {
      setLoading(true)
      try {
        const user = auth.currentUser
        if (!user) {
          console.log("No authenticated user")
          setLoading(false)
          return
        }

        const smeUserId = user.uid
        const smeUserDoc = await getDoc(doc(db, "universalProfiles", smeUserId))
        const smeUserData = smeUserDoc.exists() ? smeUserDoc.data() : {}

        // Step 1: Fetch applications to this SME first
        const applicationsQuery = query(collection(db, "internshipApplications"), where("sponsorId", "==", smeUserId))
        const applicationsSnapshot = await getDocs(applicationsQuery)

        // Track which intern IDs have already applied
        const appliedInternIds = new Set()

        // Process applications first
        const applicationInterns = await Promise.all(
          applicationsSnapshot.docs.map(async (applicationDoc) => {
            try {
              const applicationData = applicationDoc.data()
              const internId = applicationData.applicantId

              if (!internId) {
                console.log(`Application ${applicationDoc.id} has no applicantId`)
                return null
              }

              // Add to applied set
              appliedInternIds.add(internId)

              // Get the intern profile data
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

              // Calculate match score and BIG score
              const bigScore = applicationData.bigScore || applicationData.bigInternScore || 0
              const matchPercentage =
                applicationData.matchPercentage || applicationData.matchAnalysis?.overallScore || 0

              setBigScoreData({
                PresentationScore: {
                  score: applicationData.aiPresentationScore || 0,
                  color: getScoreColor(applicationData.aiPresentationScore || 0),
                },
                ProfessionalSkillsScore: {
                  score: applicationData.aiProfessionalSkillsScore || 0,
                  color: getScoreColor(applicationData.aiProfessionalSkillsScore || 0),
                },
                WorkExperienceScore: {
                  score: applicationData.aiWorkExperienceScore || 0,
                  color: getScoreColor(applicationData.aiWorkExperienceScore || 0),
                },
                AcademicScore: {
                  score: applicationData.aiAcademicScore || 0,
                  color: getScoreColor(applicationData.aiAcademicScore || 0),
                },
              })

              // Handle availability data
              const availabilityData = applicationData.availableDates
                ? applicationData.availableDates.map((avail) => ({
                    ...avail,
                    date: new Date(avail.date),
                  }))
                : []

              // Extract document URLs
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
                matchPercentage: matchPercentage,
                status: applicationData.status || "Applied",
                pipelineStage: applicationData.status || "Applied",
                action: "Application Received",
                availableDates: availabilityData,
                locationFlexibility:
  (applicationData.locationFlexibility && 
   applicationData.locationFlexibility[0] && 
   applicationData.locationFlexibility[0] !== "N") 
    ? applicationData.locationFlexibility[0] 
    : (skillsInterests.locationPreference && skillsInterests.locationPreference !== "N")
      ? skillsInterests.locationPreference
      : "Not specified",
                matchAnalysis: applicationData.matchAnalysis || null,

                // Profile information
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

                // Document URLs
                cvUrl: extractDocUrl(requiredDocuments.cvFile),
                idDocumentUrl: extractDocUrl(requiredDocuments.idDocument),
                transcriptUrl: extractDocUrl(requiredDocuments.transcriptFile),
                motivationLetterUrl: extractDocUrl(requiredDocuments.motivationLetter),
                portfolioFileUrl: extractDocUrl(requiredDocuments.portfolioFile),
                proofOfStudyUrl: extractDocUrl(requiredDocuments.proofOfStudy),
                referencesUrl: extractDocUrl(requiredDocuments.references),

                // Additional profile data
                completedSections: profileData.completedSections || {},
                profileCreatedAt: profileData.createdAt?.toDate() || null,
                profileLastUpdated: profileData.lastUpdated?.toDate() || null,

                // Application specific data
                applicationCreatedAt: applicationData.createdAt || null,
                applicationUpdatedAt: applicationData.updatedAt || null,
              }
            } catch (docError) {
              console.log(`Error processing application document ${applicationDoc.id}:`, docError)
              return null
            }
          }),
        )

        // Step 2: Fetch intern profiles that haven't applied yet
        const profilesSnapshot = await getDocs(collection(db, "internProfiles"))

        const profileInterns = await Promise.all(
          profilesSnapshot.docs.map(async (docSnap) => {
            try {
              const internId = docSnap.id

              // skip if already applied or is the SME themselves
              if (appliedInternIds.has(internId) || internId === smeUserId) return null

              const data = docSnap.data()
              if (!data) return null
              if (appliedInternIds.has(internId) || internId === smeUserId) return null

              // Calculate match score for profiles that haven't applied
              const matchResult = calculateMatchScoreForSponsor(smeUserData, data)
              const matchPercentage = matchResult.score || (data.matchPercentage ?? 0) // Use calculation if available, else fallback

              const fd = data.formData || {}
              const personalOverview = fd.personalOverview || {}
              const academicOverview = fd.academicOverview || {}
              const skillsInterests = fd.skillsInterests || {}
              const programAffiliation = fd.programAffiliation || {}
              const requiredDocs = fd.requiredDocuments || data.requiredDocuments || {}
              const experienceTrackRecord = fd.experienceTrackRecord || {}
              // must have some signal
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

                bigScore: data.bigInternScore || 0,
                matchPercentage: matchPercentage || 0, // no app yet

                status: "Matched",
                pipelineStage: "Matched",
                action: "No Application",

                availableDates: [],
                locationFlexibility: 
  (Array.isArray(academicOverview.locationFlexibility) && 
   academicOverview.locationFlexibility.length > 0 && 
   academicOverview.locationFlexibility[0] !== "N")
    ? academicOverview.locationFlexibility.join(", ")
    : "Not specified",

                matchAnalysis: matchResult,

                // profile info
                profileEmail: data.userEmail || personalOverview.email || null,
                phone: personalOverview.phone || personalOverview.phoneNumber || null,
                nationalId: personalOverview.nationalIdOrStudentNo || null,
                availabilityStart: skillsInterests.availabilityStart || null,
                availableHours: skillsInterests.availableHours || null,
                internTypePreference: skillsInterests.internTypePreference || null,
                languagesSpoken: skillsInterests.languagesSpoken || [],
                technicalSkills: skillsInterests.technicalSkills || [],
                industryInterests: skillsInterests.industryInterests || [],
                careerGoals: skillsInterests.careerGoals || null,

                // doc URLs
                cvUrl: firstUrl(requiredDocs.cvFile),
                idDocumentUrl: firstUrl(requiredDocs.idDocument),
                transcriptUrl: firstUrl(requiredDocs.transcriptFile),
                motivationLetterUrl: firstUrl(requiredDocs.motivationLetter),
                portfolioFileUrl: firstUrl(requiredDocs.portfolioFile),
                proofOfStudyUrl: firstUrl(requiredDocs.proofOfStudy),
                referencesUrl: firstUrl(requiredDocs.references),

                // timestamps
                completedSections: data.completedSections || {},
                profileCreatedAt: toDateSafe(data.createdAt),
                profileLastUpdated: toDateSafe(data.lastUpdated),

                applicationCreatedAt: null,
                applicationUpdatedAt: null,
              }
            } catch (docError) {
              console.log(`Error processing profile document ${docSnap.id}:`, docError)
              return null
            }
          }),
        )

        // Combine and filter out null values
        const allInterns = [...applicationInterns, ...profileInterns].filter((intern) => intern !== null)

        console.log(
          `Found ${applicationInterns.filter((i) => i !== null).length} applications and ${profileInterns.filter((i) => i !== null).length} additional profiles`,
        )
        setInterns(allInterns.length > 0 ? allInterns : sampleInterns)

        if (allInterns.length === 0) {
          setNotification({ type: "info", message: "No intern data found." })
          setTimeout(() => setNotification(null), 3000)
        } else {
          const applicationCount = applicationInterns.filter((i) => i !== null).length
          const profileCount = profileInterns.filter((i) => i !== null).length
          matchesCount(applicationCount + profileCount)
          profileMatchesCount(profileCount)
          setNotification({
            type: "success",
            message: `Found ${applicationCount} application(s) and ${profileCount} additional profile(s)`,
          })
          setTimeout(() => setNotification(null), 3000)
        }
      } catch (error) {
        console.error("Error loading intern data:", error)
        console.error("Error details:", error.message, error.code)

        // Set sample data to prevent crashes
        setInterns(sampleInterns)

        // More specific error message
        let errorMessage = "Failed to load intern data."
        if (error.code === "permission-denied") {
          errorMessage = "Permission denied. Please check your authentication."
        } else if (error.code === "unavailable") {
          errorMessage = "Service temporarily unavailable. Please try again later."
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection."
        }

        setNotification({ type: "error", message: errorMessage })
        setTimeout(() => setNotification(null), 5000)
      } finally {
        setLoading(false)
      }
    }

    fetchInternApplications()
  }, [])

  const handleFilterChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }))
  }

  const formatLabel = (value) => {
    if (!value) return "Not specified"

    try {
      return value
        .toString()
        .split(",")
        .map((item) => item.trim())
        .map((word) => {
          if (!word) return ""

          // Convert snake_case or kebab-case to Title Case
          return word
            .replace(/[_-]+/g, " ") // Replace underscores/dashes with space
            .split(" ") // Split into words
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) // Capitalize each word
            .join(" ")
        })
        .join(", ")
    } catch (error) {
      console.error("Error formatting label:", error)
      return value || ""
    }
  }

  const clearFilters = () => {
    setLocalFilters({
      location: "",
      matchScore: 0,
      institution: "",
      degree: "",
      field: "",
      internType: "",
      fundingProgram: "",
      fundingProgramType: "",
      startDate: "",
      sortBy: "matchPercentage",
    })
  }

  const applyFilters = () => {
    setShowFilters(false)
  }

  const handleStageAction = (intern) => {
    setSelectedInternForStage(intern)
    setShowStageModal(true)
    setNextStage("")
    setMessage("")
    setInterviewDate("")
    setInterviewTime("")
    setInterviewLocation("")
    setTermSheetFile(null)
    setFormErrors({})

    // Load availability data when opening stage modal
    loadApplicationAvailability(intern)
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
  }

  const handleStageUpdate = async () => {
    const stageFields = getStageFields(nextStage)
    const errors = {}

    if (!nextStage) {
      errors.nextStage = "Please select a stage"
    }

    if (stageFields.showMessage) {
      if (!message.trim()) {
        errors.message = "A message to the applicant is required"
      } else if (message.length < 10) {
        errors.message = "Message is too short (min 10 characters)"
      }
    }

    if (stageFields.showAvailability) {
      if (!availabilities.length) {
        errors.availabilities = "Please select at least one availability slot"
      }
    }

    if (stageFields.showMeeting) {
      if (!meetingLocation || typeof meetingLocation !== "string" || (meetingLocation && !meetingLocation.trim())) {
        errors.meetingLocation = "Meeting location is required"
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

      const sponsorId = user.uid
      const internId = selectedInternForStage.id // this is the doc ID in internshipApplications

      let attachmentUrl = null
      if (termSheetFile) {
        const storageRef = ref(storage, `internship_termsheets/${internId}/${termSheetFile.name}`)
        const snapshot = await uploadBytes(storageRef, termSheetFile)
        attachmentUrl = await getDownloadURL(snapshot.ref)
      }

      const updateData = {
        status: nextStage,
        pipelineStage: nextStage,
        updatedAt: serverTimestamp(),
        ...(message && { lastMessage: message }),
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

      const docRef = doc(db, "internshipApplications", internId)

      const docSnapshot = await getDoc(docRef)
      if (!docSnapshot.exists()) throw new Error(`Application with ID ${internId} not found`)

      const applicationData = docSnapshot.data()
      const internUid = applicationData.applicantId

      await updateDoc(docRef, updateData)
      console.log("Document updated in internshipApplications")

      if (stageFields.showInterview && interviewDate && interviewTime && interviewLocation) {
        await addDoc(collection(db, "internCalendarEvents"), {
          sponsorId,
          internId: internUid,
          title: "Internship Interview",
          date: interviewDate,
          time: interviewTime,
          status: "available",
          location: interviewLocation,
          type: "internship_meeting",
          createdAt: new Date().toISOString(),
          ...(updateData.availableDates && { availableDates: updateData.availableDates }),
        })
      }

      setInterns((prevInterns) =>
        prevInterns.map((intern) =>
          intern.id === internId
            ? {
                ...intern,
                status: nextStage,
                pipelineStage: nextStage,
                ...(message && { lastMessage: message }),
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

      setUpdatedStages((prev) => ({ ...prev, [internId]: nextStage }))
      setNotification({
        type: "success",
        message: `Application status updated to ${nextStage} successfully`,
      })
      setShowStageModal(false)
      resetStageModal()

      // Get intern email from internProfiles collection
      let internEmail = null
      try {
        const internProfileRef = doc(db, "internProfiles", internUid)
        const internProfileSnap = await getDoc(internProfileRef)
        
        if (internProfileSnap.exists()) {
          const internProfileData = internProfileSnap.data()
          internEmail = internProfileData.formData?.personalOverview?.email || 
                       internProfileData.userEmail ||
                       internProfileData.contactDetails?.email ||
                       internProfileData.email
          
          console.log("Found intern email:", internEmail)
        } else {
          console.log("No intern profile found for:", internUid)
        }
      } catch (emailError) {
        console.error("Error fetching intern email:", emailError)
      }

      // If no email found in internProfiles, use the profileEmail from the intern object
      if (!internEmail) {
        internEmail = selectedInternForStage.profileEmail
        console.log("Using profile email as fallback:", internEmail)
      }

      const subject = `Update: ${nextStage} Stage for Your Application`
      let content = `Dear ${selectedInternForStage.internName},\n\nYour application has progressed to the "${nextStage}" stage.\n\n${message}`

      if (stageFields.showInterview) {
        content += `\n\nInterview Details:\n-Location: ${meetingLocation}`
      }
      if (stageFields.showAvailability && availabilities.length > 0) {
        content += `\n\nAvailable Interview Times:\n`
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

        content += `\n\nPlease reply with your preferred time.`
      }

      content += `\n\nBest regards,\nInternship Program Team`

      const messagePayload = {
        to: internUid,
        from: sponsorId,
        subject,
        content,
        date: new Date().toISOString(),
        read: false,
        type: "inbox",
        applicationId: internId,
        attachments: attachmentUrl ? [attachmentUrl] : [],
        ...(updateData.availableDates && { availableDates: updateData.availableDates }),
      }

      const sentMessagePayload = {
        ...messagePayload,
        read: true,
        type: "sent",
      }

      await Promise.all([
        addDoc(collection(db, "messages"), messagePayload),
        addDoc(collection(db, "messages"), sentMessagePayload),
      ])

      // Send email to intern's personal email
      if (internEmail) {
        try {
          console.log("🔄 Using EmailJS service to send email to intern...")

          const emailjsConfig = {
            serviceId: API_KEYS.SERVICE_ID_MESSAGES,
            templateId: API_KEYS.TEMPLATE_ID_MESSAGES,
            publicKey: API_KEYS.PUBLIC_KEY_ID_MESSAGES
          };

          console.log("📧 Using EmailJS config:", emailjsConfig);

          if (!window.emailjs) {
            emailjs.init(emailjsConfig.publicKey);
            window.emailjs = emailjs;
          }

          const sponsorName = user?.displayName || "Internship Program Team";
          const internName = selectedInternForStage.internName;

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(internEmail)) {
            throw new Error(`Invalid email format: "${internEmail}"`);
          }

          let emailMessage = `Dear ${internName},\n\n`;
          
          if (nextStage === "Declined") {
            emailMessage += `We regret to inform you that your application has been moved to the "${nextStage}" stage.\n\n`;
          } else {
            emailMessage += `We are pleased to inform you that your application has progressed to the "${nextStage}" stage.\n\n`;
          }
          
          if (message) {
            emailMessage += `Message from ${sponsorName}:\n${message}\n\n`;
          }

          if (stageFields.showMeeting && meetingLocation && meetingPurpose) {
            emailMessage += `Meeting Details:\n`;
            if (meetingTime) {
              emailMessage += `- Date: ${new Date(meetingTime).toLocaleString()}\n`;
            }
            emailMessage += `- Location: ${meetingLocation}\n`;
            emailMessage += `- Purpose: ${meetingPurpose}\n\n`;
          }

          if (stageFields.showAvailability && availabilities.length > 0) {
            emailMessage += `Available Meeting Times:\n`;
            availabilities.forEach((avail, idx) => {
              const dateStr = avail.date.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              const timeStr = avail.timeSlots?.[0]
                ? `${avail.timeSlots[0].start} - ${avail.timeSlots[0].end} ${avail.timeZone}`
                : "Time not specified";
              emailMessage += `${idx + 1}. ${dateStr} (${timeStr})\n`;
            });
            emailMessage += `\nPlease reply with your preferred meeting time from the above options.\n\n`;
          }

          emailMessage += `Best regards,\n${sponsorName}\nInternship Program Team\nBIG Marketplace Africa`;

          const templateParams = {
            to_email: internEmail,
            subject: `Internship Application Stage Update: ${nextStage}`,
            from_name: sponsorName,
            date: new Date().toLocaleDateString(),
            message: emailMessage,
            portal_url: `https://www.bigmarketplace.africa/applications/${sponsorId}_${internId}`,
            has_attachments: termSheetFile ? "true" : "false",
            attachments_count: termSheetFile ? "1" : "0"
          };

          console.log("📨 Sending email to intern with EmailJS...", templateParams);

          const response = await window.emailjs.send(
            emailjsConfig.serviceId,
            emailjsConfig.templateId,
            templateParams,
            emailjsConfig.publicKey
          );
          
          console.log("✅ Email sent successfully to intern!", response);
          
          setNotification({
            type: "success",
            message: `Stage updated to ${nextStage} and email notification sent successfully`
          });

        } catch (emailError) {
          console.error("❌ Email to intern failed:", emailError);
          
          setNotification({
            type: "success", 
            message: `Stage updated to ${nextStage} successfully (email notification failed)`
          });
        }
      } else {
        console.warn("⚠️ No intern email found, skipping email notification");
        setNotification({
          type: "success",
          message: `Stage updated to ${nextStage} successfully (no email available)`
        });
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

      console.log("Starting intern request for:", intern.internName)
      console.log("SME User ID:", user.uid)
      console.log("Intern object:", intern)

      // Get SME profile data
      let smeData = {}
      try {
        const smeDoc = await getDoc(doc(db, "universalProfiles", user.uid))
        smeData = smeDoc.exists() ? smeDoc.data() : {}
        console.log("SME data retrieved:", smeData)
      } catch (smeError) {
        console.warn("Could not retrieve SME profile:", smeError)
      }
      let internshipInformation = {}
      try {
        const smeDoc = await getDoc(doc(db, "internApplications", user.uid))
        internshipInformation = smeDoc.exists() ? smeDoc.data() : {}
        console.log("SME data retrieved:", internshipInformation)
      } catch (smeError) {
        console.warn("Could not retrieve SME profile:", smeError)
      }

      // Get intern data (already available in the intern object, but we might need more details)
      let internData = {}
      try {
        const internDoc = await getDoc(doc(db, "internProfiles", intern.internId))
        internData = internDoc.exists() ? internDoc.data() : {}
        console.log("Intern data retrieved:", internData)
      } catch (internError) {
        console.warn("Could not retrieve intern profile:", internError)
      }

      // Fetch evaluation scores from internEvaluations collection
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
          console.log("Evaluation data retrieved:", evalData)

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
          console.log("No evaluation scores found for intern:", intern.internId)
        }
      } catch (evaluationError) {
        console.warn("Could not retrieve evaluation scores:", evaluationError)
      }

      // Build the composite ID for the request document
      const internId = intern.internId
      const sponsorId = user.uid
      const requestDocId = `${sponsorId}_${internId}`

      console.log("Request document ID:", requestDocId)
      console.log("Sponsor ID:", sponsorId)
      console.log("Intern ID:", internId)

      // Get more detailed intern information if available
      const internFormData = internData.formData || {}
      const internProfile = internData.entityOverview || {}

      // Calculate fresh match breakdown for the request
      const matchResult = calculateMatchScore(internData, smeData)
      console.log("Match result with breakdown:", matchResult)

      // Request data structure with match breakdown and evaluation scores included
      const requestData = {
        // Intern Information
        applicantId: internId,
        internId: internId,
        internName: intern.internName || internFormData.personalOverview?.fullName || "Anonymous Intern",
        internEmail: intern.profileEmail || internFormData.personalOverview?.email || "Not provided",

        // Educational Information
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

        // Intern Skills and Preferences
        technicalSkills: intern.technicalSkills || internFormData.skillsInterests?.technicalSkills || [],
        availabilityStart:
          intern.availabilityStart || internFormData.skillsInterests?.availabilityStart || "Not specified",
        provinces: internFormData.personalOverview?.provinces || [],
        cities: internFormData.personalOverview?.cities || [],

        // SME/Sponsor Details
        sponsorId: sponsorId,
        sponsorName:
          smeData.entityOverview?.tradingName || smeData.entityOverview?.registeredName || "Our Organization",
        sponsorEmail: user.email || smeData.contactEmail || "Not provided",
        location: smeData.location || smeData.entityOverview?.location || "N/A",
        type: "Internship Request",
        role: internshipInformation.internshipRequest?.internRolesText || smeData.jobOverview?.roleTitle || "N/A",
        sector: smeData.sector || smeData.entityOverview?.sector || "N/A",

        // Funding Information (if applicable)
        funding: smeData.fundingAvailable || "No",
        fundType: smeData.fundingType || "not specified",

        // Timeline
        startDate: smeData.internshipRequest?.startDate || "TBD",
        requestedDate: new Date().toISOString(),

        // AI EVALUATION SCORES
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
              description: matchResult.breakdown.locationMatch.description,
              applicantProvinces: matchResult.breakdown.locationMatch.details.internProvinces,
              applicantCities: matchResult.breakdown.locationMatch.details.internCities,
              requiredProvince: matchResult.breakdown.locationMatch.details.sponsorProvince,
              requiredCities: matchResult.breakdown.locationMatch.details.sponsorCities,
              isLocationRelevant: matchResult.breakdown.locationMatch.details.isLocationRelevant,
            },
            availabilityAlignment: {
              score: matchResult.breakdown.availabilityMatch.score,
              maxScore: matchResult.breakdown.availabilityMatch.maxScore,
              matched: matchResult.breakdown.availabilityMatch.matched,
              description: matchResult.breakdown.availabilityMatch.description,
              applicantStartDate: matchResult.breakdown.availabilityMatch.details.internStartDate,
              requiredStartDate: matchResult.breakdown.availabilityMatch.details.sponsorStartDate,
            },
            profileCompleteness: {
              score: matchResult.breakdown.additionalFactors.score,
              maxScore: matchResult.breakdown.additionalFactors.maxScore,
              matched: matchResult.breakdown.additionalFactors.matched,
              description: matchResult.breakdown.additionalFactors.description,
              hasGraduationYear: matchResult.breakdown.additionalFactors.details.hasGradYear,
              hasInternshipType: matchResult.breakdown.additionalFactors.details.hasInternType,
            },
          },
          // Summary for quick review
          matchSummary: {
            strongPoints: [],
            weakPoints: [],
            recommendations: [],
          },
        },

        // Status Tracking - Different from the application version
        status: "Requested", // This is the key difference - status is "Requested" not "Applied"
        action: "Request Intern",
        rating: intern.ratingRecommendation || "Pending",

        // Metadata
        submittedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        requestVersion: "1.0", // Different version to indicate this is a request
      }

      // Generate match summary
      const breakdown = matchResult.breakdown
      const strongPoints = []
      const weakPoints = []
      const recommendations = []

      // Analyze each component
      if (breakdown.skillsMatch.matched) {
        strongPoints.push("Skills align well with role requirements")
      } else {
        weakPoints.push("Skills don't match role requirements")
        recommendations.push("Consider highlighting transferable skills or willingness to learn")
      }

      if (breakdown.workModeMatch.matched) {
        strongPoints.push("Work mode preferences are compatible")
      } else {
        weakPoints.push("Work mode preferences don't align")
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

      // Add evaluation-based insights to summary
      if (evaluationScores.bigInternScore >= 70) {
        strongPoints.push("High overall evaluation score")
      } else if (evaluationScores.bigInternScore >= 50) {
        strongPoints.push("Good evaluation score")
      } else if (evaluationScores.bigInternScore > 0) {
        weakPoints.push("Lower evaluation score")
        recommendations.push("Consider highlighting achievements and growth potential")
      }

      // Add summary to request data
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

      // Save to Firestore with error handling
      await setDoc(doc(db, "internshipApplications", requestDocId), requestData, { merge: true })

      console.log("Intern request successfully saved to Firestore")

      // Update UI state
      setStatuses((prev) => ({ ...prev, [intern.id]: "Requested" }))

      // Send email notification to intern
      try {
        let internEmail = null
        try {
          const internProfileRef = doc(db, "internProfiles", intern.internId)
          const internProfileSnap = await getDoc(internProfileRef)
          
          if (internProfileSnap.exists()) {
            const internProfileData = internProfileSnap.data()
            internEmail = internProfileData.formData?.personalOverview?.email || 
                         internProfileData.userEmail ||
                         internProfileData.contactDetails?.email ||
                         internProfileData.email
            
            console.log("Found intern email for request:", internEmail)
          }
        } catch (emailError) {
          console.error("Error fetching intern email for request:", emailError)
        }

        if (!internEmail) {
          internEmail = intern.profileEmail
        }

        if (internEmail) {
          console.log("🔄 Sending internship request email to intern...")

          const emailjsConfig = {
            serviceId: API_KEYS.SERVICE_ID_MESSAGES,
            templateId: API_KEYS.TEMPLATE_ID_MESSAGES,
            publicKey: API_KEYS.PUBLIC_KEY_ID_MESSAGES
          };

          if (!window.emailjs) {
            emailjs.init(emailjsConfig.publicKey);
            window.emailjs = emailjs;
          }

          const sponsorName = user?.displayName || "Our Organization";
          const internName = intern.internName;

          const emailMessage = `Dear ${internName},\n\n
We are excited to inform you that ${sponsorName} has requested you for an internship opportunity!\n\n
Position: ${requestData.role}\n
Location: ${requestData.location}\n
Start Date: ${requestData.startDate}\n\n
Your profile stood out to us because of your strong match with our requirements. We would like to discuss this opportunity further with you.\n\n
Please log into your BIG Marketplace Africa account to view the full details and respond to this request.\n\n
Best regards,\n${sponsorName}\nInternship Program Team\nBIG Marketplace Africa`;

          const templateParams = {
            to_email: internEmail,
            subject: `New Internship Request from ${sponsorName}`,
            from_name: sponsorName,
            date: new Date().toLocaleDateString(),
            message: emailMessage,
            portal_url: `https://www.bigmarketplace.africa/applications/${sponsorId}_${internId}`,
            has_attachments: "false",
            attachments_count: "0"
          };

          console.log("📨 Sending internship request email to intern...");

          const response = await window.emailjs.send(
            emailjsConfig.serviceId,
            emailjsConfig.templateId,
            templateParams,
            emailjsConfig.publicKey
          );
          
          console.log("✅ Internship request email sent successfully!", response);
        }
      } catch (emailError) {
        console.error("❌ Internship request email failed:", emailError);
      }

      // Dispatch notification event to the intern
      const dispatchNotification = () => {
        const notificationMessage = `New internship request from ${requestData.sponsorName} for ${requestData.role}!`
        console.log("Dispatching intern notification:", notificationMessage)

        const event = new CustomEvent("newNotification", {
          detail: {
            message: notificationMessage,
            type: "info",
            timestamp: new Date().toISOString(),
            recipientId: internId, // Send to the intern
          },
          bubbles: true,
          cancelable: true,
          composed: true,
        })

        setTimeout(() => {
          window.dispatchEvent(event)
          console.log("Intern notification event dispatched")
        }, 100)
      }

      dispatchNotification()

      // Show success notification to SME
      setNotification({
        type: "success",
        message: `Intern request successfully sent to ${intern.internName}!`,
      })
      setTimeout(() => setNotification(null), 4000)
    } catch (error) {
      console.error("Detailed error in handleRequestIntern:", error)
      console.error("Error code:", error.code)
      console.error("Error message:", error.message)

      // More specific error messages
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

      // Dispatch error notification
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
    setSelectedIntern(intern)
    setModalType("view")
  }

  const handleBigScoreClick = (intern) => {
    setSelectedIntern(intern)
    setModalType("bigScore")
  }

  const handleScoreBreakdown = (intern) => {
    setSelectedIntern(intern)
    setModalType("scoreBreakdown")
  }

  // Enhanced Modal Overlay Style with animation
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

  // Enhanced Modern Modal Content Style
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

  // Style constants
  const tableHeaderStyle = {
    background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
    color: "#FEFCFA",
    padding: "0.5rem 0.25rem", // Reduced padding from 0.75rem 0.5rem
    textAlign: "left",
    fontWeight: "600",
    fontSize: "0.75rem", // Reduced from 0.75rem
    letterSpacing: "0.3px", // Reduced from 0.5px
    textTransform: "uppercase",
    position: "sticky",
    top: "0",
    zIndex: "10",
    borderBottom: "2px solid #1a0c02",
    borderRight: "1px solid #1a0c02",
    lineHeight: "1.2", // Reduced from 1.2
  }

  const tableCellStyle = {
    padding: "0.5rem 0.25rem", // Reduced padding from 0.75rem 0.5rem
    borderBottom: "1px solid #E8D5C4",
    borderRight: "1px solid #E8D5C4",
    fontSize: "0.8rem", // Reduced from 0.8rem
    verticalAlign: "top",
    color: "#5d4037",
    lineHeight: "1.3", // Reduced from 1.3
    maxWidth: "0", // This forces text wrapping
    overflow: "hidden",
  }

  const matchContainerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
  }

  const progressBarStyle = {
    width: "60%", // Updated from 35px to 60% to match supplier
    height: "6px", // Updated from 4px to 6px to match supplier
    background: "#E2E8F0", // Updated to match supplier color
    borderRadius: "3px", // Updated from 2px to 3px
    overflow: "hidden",
  }

  const progressFillStyle = {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  }

  const matchScoreStyle = {
    fontWeight: "600", // Updated from 600 to match supplier
    color: "#5D2A0A",
    fontSize: "0.75rem", // Updated from 0.7rem to 0.75rem to match supplier
  }

  // Added statusBadgeStyle definition
  const statusBadgeStyle = {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    display: "inline-block",
    textTransform: "capitalize",
  }
// Add this filter function near your other filter functions
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
    intern.bigScore?.toString()
  ];

  const missingCount = fieldsToCheck.filter(field => {
    if (field === null || field === undefined) return true;
    
    const stringField = field.toString().trim();
    return (
      stringField === '' ||
      stringField === '-' ||
      stringField === 'Not specified' ||
      stringField === 'Various' ||
      stringField === 'unspecified' ||
      stringField === 'Unknown' ||
      stringField === 'N/A' ||
stringField === 'Not Provided' ||
      stringField === '0' || // If scores are 0, consider them missing
      stringField.toLowerCase() === 'null' ||
      stringField.toLowerCase().includes('not specified') ||
      stringField.toLowerCase().includes('unspecified') ||
      stringField.toLowerCase().includes('tbd') ||
      stringField.toLowerCase().includes('anonymous')
    );
  }).length;

  return missingCount > 4;
};
  // The useEffect hook must be called at the top level of the component, not conditionally.
  // The original code had it inside the component body but not as a direct child.
  // This has been moved to the top level of the component's scope.
  // However, the logic within the useEffect is fine for fetching data on component mount.

  // Moved the filtering logic directly into the component body, outside of the useEffect.
  // This ensures it runs on every render after `interns` is updated.
 const applyLocalFilters = () => {
  let updatedInterns = [...interns];

  // Apply the main filters (user exclusion and missing fields)
  updatedInterns = updatedInterns.filter((intern) => {
    // First check if intern UID matches current user - if so, exclude
    const user = auth.currentUser;
    if (user && intern.internId === user.uid) {
      return false;
    }

    // Then check if too many fields are missing - if so, exclude completely
    if (hasTooManyMissingFields(intern)) {
      return false;
    }

    // Then apply your existing local filters...
    if (localFilters.location) {
      if (!intern.location || !intern.location.toLowerCase().includes(localFilters.location.toLowerCase())) {
        return false;
      }
    }

    if (localFilters.institution) {
      if (!intern.institution || !intern.institution.toLowerCase().includes(localFilters.institution.toLowerCase())) {
        return false;
      }
    }

    if (localFilters.degree) {
      if (!intern.degree || !intern.degree.toLowerCase().includes(localFilters.degree.toLowerCase())) {
        return false;
      }
    }

    if (localFilters.matchScore > 0) {
      if (!intern.matchPercentage || intern.matchPercentage < localFilters.matchScore) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  updatedInterns.sort((a, b) => {
    if (localFilters.sortBy === "matchPercentage") {
      return b.matchPercentage - a.matchPercentage;
    } else if (localFilters.sortBy === "bigScore") {
      return b.bigScore - a.bigScore;
    } else if (localFilters.sortBy === "internName") {
      return a.internName.localeCompare(b.internName);
    }
    return 0;
  });

  setFilteredInterns(updatedInterns);
};

  useEffect(() => {
    applyLocalFilters()
  }, [localFilters, interns]) // Re-run filter when filters or intern list changes

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading applications...</div>
  }

  const currentStageFields = getStageFields(nextStage)

  return (
    <div style={{ padding: "20px", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Intern Applications</h2>
        <button
          onClick={() => setShowFilters(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 20px",
            backgroundColor: "#a67c52",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "0.8rem",
            boxShadow: "0 2px 6px rgba(166, 124, 82, 0.3)",
          }}
        >
          <Filter size={14} />
          Filter Applications
        </button>
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

      <div
        style={{
          borderRadius: "6px",
          border: "1px solid #E8D5C4",
          boxShadow: "0 3px 20px rgba(139, 69, 19, 0.08)",
          width: "100%",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            fontSize: "0.8rem",
            backgroundColor: "#FEFCFA",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: "8%" }} /> {/* Intern Name */}
            <col style={{ width: "7%" }} /> {/* Location */}
            <col style={{ width: "9%" }} /> {/* Institution */}
            <col style={{ width: "8%" }} /> {/* Degree */}
            <col style={{ width: "10%" }} /> {/* Field */}
            <col style={{ width: "8%" }} /> {/* Intern Type */}
            <col style={{ width: "9%" }} /> {/* Role */}
            <col style={{ width: "8%" }} /> {/* Funding Program */}
            <col style={{ width: "6%" }} /> {/* Match % */}
            <col style={{ width: "7%" }} /> {/* BIG Score */}
            <col style={{ width: "7%" }} /> {/* Status */}
            <col style={{ width: "7%" }} /> {/* Next Stage */}
            <col style={{ width: "13%" }} /> {/* Action */}
          </colgroup>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>
                Intern
                <br />
                Name
              </th>
              <th style={tableHeaderStyle}>Location</th>
              <th style={tableHeaderStyle}>Institution</th>
              <th style={tableHeaderStyle}>Degree</th>
              <th style={tableHeaderStyle}>Field</th>
              <th style={tableHeaderStyle}>
                Location
                <br />
                Flexibility
              </th>
              <th style={tableHeaderStyle}>Role</th>
              <th style={tableHeaderStyle}>
                Funding
                <br />
                Program
              </th>
              <th style={tableHeaderStyle}>Match %</th>
              <th style={tableHeaderStyle}>BIG Score</th>
              <th style={tableHeaderStyle}>Status</th>
              <th style={tableHeaderStyle}>Next Stage</th>
              <th style={{ ...tableHeaderStyle, borderRight: "none" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredInterns.length === 0 ? (
              <tr>
                <td colSpan="12" style={{ ...tableCellStyle, textAlign: "center", color: "#666" }}>
                  No applications found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredInterns.map((intern) => {
                const currentStatus = updatedStages[intern.id] || intern.pipelineStage || intern.status
                const statusStyle = getStatusStyle(currentStatus)
                return (
                  <tr key={intern.id} style={{ borderBottom: "1px solid #E8D5C4" }}>
                    <td style={tableCellStyle}>
                      <button
                        onClick={() => handleViewDetails(intern)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#a67c52",
                          textDecoration: "underline",
                          cursor: "pointer",
                          fontWeight: "500",
                          padding: "0",
                          fontSize: "0.80rem",
                          textAlign: "left",
                          wordBreak: "break-word",
                          width: "100%",
                          lineHeight: "1.2",
                        }}
                      >
                        {intern.internName}
                      </button>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "0.8rem" }}>
                        <span style={{ wordBreak: "break-word" }}>{intern.location}</span>
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      {/* CHANGE: Updated TruncatedText maxLength for better visibility */}
                      <TruncatedText text={intern.institution} maxLength={25} />
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={intern.degree} maxLength={20} />
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={intern.field} maxLength={25} />
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={intern.locationFlexibility} maxLength={12} />
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={intern.role} maxLength={15} />
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={intern.sponsorName} maxLength={15} />
                    </td>
                    <td style={tableCellStyle}>
                      <div style={matchContainerStyle}>
                        <div style={progressBarStyle}>
                          <div
                            style={{
                              ...progressFillStyle,
                              width: `${intern.matchPercentage}%`,
                              background:
                                intern.matchPercentage > 75
                                  ? "#48BB78"
                                  : intern.matchPercentage > 50
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
                                intern.matchPercentage > 75
                                  ? "#48BB78"
                                  : intern.matchPercentage > 50
                                    ? "#D69E2E"
                                    : "#E53E3E",
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
                    <td style={tableCellStyle}>
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
                          <span
                            style={{
                              color: getScoreColor(intern.bigScore),
                              fontWeight: "500",
                              fontSize: "0.75rem",
                            }}
                          >
                            {intern.bigScore}%
                          </span>
                          {/* CHANGE: Fixed eye icon to call handleBigScoreClick instead of handleScoreBreakdown */}
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
                    <td style={tableCellStyle}>
                      <NextStageIndicator
                        currentStage={currentStatus}
                        // onStageUpdate={(newStage) => handleQuickStageUpdate(intern, newStage)}
                        // isLoading={updatingStageForIntern === intern.id}
                      />
                    </td>
                    <td style={{ ...tableCellStyle, borderRight: "none" }}>
                      {intern.status === "Matched" ? (
                        <button
                          onClick={() => handleRequestIntern(intern)}
                          style={{
                            padding: "6px 8px",
                            backgroundColor: "#5d4037",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
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
                            backgroundColor: "#5d4037",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
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
                            backgroundColor: "#5d4037",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
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

      {/* Filter Modal */}
      {showFilters &&
        createPortal(
          <div style={modalOverlayStyle} onClick={() => setShowFilters(false)}>
            <div style={{ ...modalContentStyle, maxWidth: "800px" }} onClick={(e) => e.stopPropagation()}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}
              >
                <h3 style={{ fontSize: "28px", fontWeight: "800", color: "#3e2723", margin: 0 }}>
                  Filter Internship Applications
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
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
                    Location
                  </label>
                  <select
                    value={localFilters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "2px solid #c8b6a6",
                      borderRadius: "8px",
                      fontSize: "16px",
                      backgroundColor: "#f5f0e1",
                    }}
                  >
                    <option value="">All Locations</option>
                    {southAfricanCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
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
                    Institution
                  </label>
                  <select
                    value={localFilters.institution}
                    onChange={(e) => handleFilterChange("institution", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "2px solid #c8b6a6",
                      borderRadius: "8px",
                      fontSize: "16px",
                      backgroundColor: "#f5f0e1",
                    }}
                  >
                    <option value="">All Institutions</option>
                    {southAfricanInstitutions.map((institution) => (
                      <option key={institution} value={institution}>
                        {institution}
                      </option>
                    ))}
                  </select>
                </div>
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
                    Degree
                  </label>
                  <input
                    type="text"
                    value={localFilters.degree}
                    onChange={(e) => handleFilterChange("degree", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "2px solid #c8b6a6",
                      borderRadius: "8px",
                      fontSize: "16px",
                      backgroundColor: "#f5f0e1",
                    }}
                    placeholder="Filter by degree"
                  />
                </div>
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
                    Minimum Match Score: {localFilters.matchScore}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localFilters.matchScore}
                    onChange={(e) => handleFilterChange("matchScore", Number.parseInt(e.target.value))}
                    style={{
                      width: "100%",
                      height: "8px",
                      borderRadius: "4px",
                      background: "#e6d7c3",
                      outline: "none",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "#7d5a50",
                      marginTop: "4px",
                    }}
                  >
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
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
                    Sort By
                  </label>
                  <select
                    value={localFilters.sortBy}
                    onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "2px solid #c8b6a6",
                      borderRadius: "8px",
                      fontSize: "16px",
                      backgroundColor: "#f5f0e1",
                    }}
                  >
                    <option value="matchPercentage">Match Percentage (High to Low)</option>
                    <option value="bigScore">BIG Score (High to Low)</option>
                    <option value="internName">Intern Name (A-Z)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                <button
                  onClick={clearFilters}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#e6d7c3",
                    color: "#4a352f",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <X size={16} />
                  Clear All
                </button>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => setShowFilters(false)}
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
                    onClick={applyFilters}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#a67c52",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Filter size={16} />
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* View Details Modal */}
      {selectedIntern &&
        modalType === "view" &&
        createPortal(
          <div style={modalOverlayStyle} onClick={resetModal}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}
              >
                <h3 style={{ fontSize: "28px", fontWeight: "800", color: "#3e2723", margin: 0 }}>
                  {selectedIntern.internName} - Application Details
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                <div>
                  <h4 style={{ fontSize: "18px", fontWeight: "600", color: "#4a352f", marginBottom: "16px" }}>
                    Basic Information
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <strong>Name:</strong> {selectedIntern.internName}
                    </div>
                    <div>
                      <strong>Location:</strong> {selectedIntern.location}
                    </div>
                    <div>
                      <strong>Institution:</strong> {selectedIntern.institution}
                    </div>
                    <div>
                      <strong>Status:</strong> {selectedIntern.status}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: "18px", fontWeight: "600", color: "#4a352f", marginBottom: "16px" }}>
                    Education Details
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <strong>Degree:</strong> {selectedIntern.degree}
                    </div>
                    <div>
                      <strong>Field:</strong> {selectedIntern.field}
                    </div>
                    <div>
                      <strong>Intern Type:</strong> {selectedIntern.internType}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: "18px", fontWeight: "600", color: "#4a352f", marginBottom: "16px" }}>
                    Internship Details
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <strong>Role:</strong> {selectedIntern.role}
                    </div>
                    <div>
                      <strong>Funding Program:</strong> {selectedIntern.fundingProgram}
                    </div>
                    <div>
                      <strong>Funding Type:</strong> {selectedIntern.fundingProgramType}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <h4>Documents</h4>

                      <div>{renderDocumentLink(selectedIntern.cvUrl, "CV Document")}</div>
                      <div>{renderDocumentLink(selectedIntern.transcriptUrl, "Transcript Document")}</div>
                      <div>{renderDocumentLink(selectedIntern.idDocumentUrl, "ID Document Document")}</div>
                      <div>{renderDocumentLink(selectedIntern.portfolioFileUrl, "Portfolio Document")}</div>
                      <div>{renderDocumentLink(selectedIntern.proofOfStudyUrl, "Proof of Study Document")}</div>
                      <div>{renderDocumentLink(selectedIntern.referencesUrl, "References Document")}</div>

                      <div>{renderDocumentLink(selectedIntern.motivationLetterUrl, "Motivation Letter Document")}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: "18px", fontWeight: "600", color: "#4a352f", marginBottom: "16px" }}>
                    Evaluation Scores
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <strong>Match Score:</strong>{" "}
                      <span style={{ color: getScoreColor(selectedIntern.matchPercentage) }}>
                        {selectedIntern.matchPercentage}%
                      </span>
                    </div>
                    <div>
                      <strong>BIG Score:</strong>{" "}
                      <span style={{ color: getScoreColor(selectedIntern.bigScore) }}>{selectedIntern.bigScore}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}>
                <button
                  onClick={() => handleBigScoreClick(selectedIntern)}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#a67c52",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <BarChart3 size={16} />
                  View BIG Score Breakdown
                </button>
                <button
                  onClick={resetModal}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#e6d7c3",
                    color: "#4a352f",
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
      {selectedIntern &&
        modalType === "matchBreakdown" &&
        createPortal(<MatchBreakdownModal intern={selectedIntern} onClose={resetModal} />, document.body)}
      {/* Enhanced BIG Score Modal */}
      {selectedIntern &&
        modalType === "bigScore" &&
        createPortal(
          <div style={modalOverlayStyle} onClick={resetModal}>
            <div style={{ ...modalContentStyle, maxWidth: "1000px" }} onClick={(e) => e.stopPropagation()}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}
              >
                <h3 style={{ fontSize: "32px", fontWeight: "800", color: "#3e2723", margin: 0 }}>
                  BIG Score Breakdown
                </h3>
                <div
                  style={{
                    backgroundColor: getScoreColor(selectedIntern.bigScore),
                    color: "white",
                    borderRadius: "50%",
                    width: "100px",
                    height: "100px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    fontWeight: "800",
                    boxShadow: "0 12px 32px rgba(93, 64, 55, 0.4)",
                  }}
                >
                  {selectedIntern.bigScore}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#f8f5f3",
                  padding: "24px",
                  borderRadius: "16px",
                  marginBottom: "32px",
                  border: "2px solid #8d6e63",
                }}
              >
                <p
                  style={{
                    fontSize: "20px",
                    color: "#5d4037",
                    marginBottom: "16px",
                    lineHeight: "1.6",
                    fontWeight: "500",
                  }}
                >
                  The BIG Score is a comprehensive evaluation of {selectedIntern.internName}'s internship readiness
                  across key dimensions:
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#4E342E" }}
                      ></div>
                      <span style={{ fontWeight: "600", color: "#3e2723" }}>Presentation Score (25%)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#8D6E63" }}
                      ></div>
                      <span style={{ fontWeight: "600", color: "#3e2723" }}>Professional Skills (25%)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#5D4037" }}
                      ></div>
                      <span style={{ fontWeight: "600", color: "#3e2723" }}>Work Experience (25%)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#3E2723" }}
                      ></div>
                      <span style={{ fontWeight: "600", color: "#3e2723" }}>Academic Score (25%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score breakdown sections - PIS first */}
              {Object.entries(bigScoreData).map(([key, data]) => (
                <div
                  key={key}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "20px",
                    padding: "32px",
                    marginBottom: "24px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
                    border: `2px solid ${data.color}20`,
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)"
                    e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "24px",
                          fontWeight: "700",
                          textTransform: "capitalize",
                          color: "#3e2723",
                        }}
                      >
                        {/* Updated key formatting */}
                        {key === "PresentationScore"
                          ? "Presentation Score"
                          : key === "ProfessionalSkillsScore"
                            ? "Professional Skills Score"
                            : key === "WorkExperienceScore"
                              ? "Work Experience Score"
                              : key === "AcademicScore"
                                ? "Academic Score"
                                : key}
                      </h4>
                      <p style={{ margin: "8px 0 0 0", fontSize: "16px", color: "#666", fontWeight: "400" }}>
                        {/* Updated descriptions */}
                        {key === "PresentationScore" && "Communication and presentation capabilities assessment"}
                        {key === "ProfessionalSkillsScore" && "Technical and professional competencies evaluation"}
                        {key === "WorkExperienceScore" && "Relevant work experience and practical skills"}
                        {key === "AcademicScore" && "Educational background and academic achievements"}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "36px",
                          fontWeight: "800",
                          color: data.color,
                          textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        {data.score}%
                      </div>
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "50%",
                          backgroundColor: `${data.color}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `3px solid ${data.color}`,
                        }}
                      >
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: data.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "20px",
                      backgroundColor: "#f5f5f5",
                      borderRadius: "10px",
                      overflow: "hidden",
                      boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: `${data.score}%`,
                        height: "100%",
                        background: `linear-gradient(90deg, ${data.color}, ${data.color}dd)`,
                        borderRadius: "10px",
                        transition: "width 2s cubic-bezier(0.4, 0, 0.2, 1)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                          animation: "shimmer 2s infinite",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div
                style={{
                  backgroundColor: "#f3e5f5",
                  padding: "24px",
                  borderRadius: "16px",
                  marginTop: "32px",
                  marginBottom: "32px",
                  border: "2px solid #ce93d8",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#f3e5f5",
                    padding: "24px",
                    borderRadius: "16px",
                    marginTop: "32px",
                    marginBottom: "32px",
                    border: "2px solid #ce93d8",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <Info size={24} style={{ color: "#5d4037" }} />
                    <p style={{ margin: 0, color: "#5d4037", fontSize: "16px", lineHeight: "1.5", fontWeight: "500" }}>
                      The BIG Score is calculated using equal weights: Presentation Score (25%) + Professional Skills
                      Score (25%) + Work Experience Score (25%) + Academic Score (25%)
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={resetModal}
                  style={{
                    background: "linear-gradient(135deg, #5d4037 0%, #4e342e 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    padding: "16px 32px",
                    fontSize: "18px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(93, 64, 55, 0.3)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = "translateY(-2px)"
                    e.target.style.boxShadow = "0 8px 24px rgba(93, 64, 55, 0.4)"
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0)"
                    e.target.style.boxShadow = "0 4px 16px rgba(93, 64, 55, 0.3)"
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showCalendarModal &&
        createPortal(
          <div style={{ ...modalOverlayStyle, zIndex: 1100 }} onClick={() => setShowCalendarModal(false)}>
            <div style={{ ...modalContentStyle, maxWidth: "800px" }} onClick={(e) => e.stopPropagation()}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}
              >
                <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#3e2723", margin: 0 }}>
                  Select Available Dates
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

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
                  Time Zone
                </label>
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  <option value="Africa/Johannesburg">South Africa Time (SAST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
                  Time Slot
                </label>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "4px" }}>Start Time</label>
                    <input
                      type="time"
                      value={timeSlot.start}
                      onChange={(e) => handleTimeChange("start", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "4px" }}>End Time</label>
                    <input
                      type="time"
                      value={timeSlot.end}
                      onChange={(e) => handleTimeChange("end", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
                  Select Dates
                </label>
                <DayPicker
                  mode="multiple"
                  selected={tempDates}
                  onSelect={handleDateSelect}
                  fromDate={new Date()}
                  styles={{
                    caption: { color: "#4a352f", fontWeight: "bold" },
                    day_selected: { backgroundColor: "#5d4037", color: "white" },
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>Selected Availability</h4>
                {tempDates.length > 0 ? (
                  <div
                    style={{
                      border: "1px solid #eee",
                      borderRadius: "8px",
                      padding: "12px",
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                  >
                    {tempDates.map((date, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 0",
                          borderBottom: "1px solid #f0f0f0",
                        }}
                      >
                        <span>
                          {date.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          {timeSlot.start && timeSlot.end && (
                            <span style={{ color: "#666", marginLeft: "8px" }}>
                              {timeSlot.start} - {timeSlot.end}
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => setTempDates(tempDates.filter((d, i) => i !== index))}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ff4444",
                            cursor: "pointer",
                            padding: "4px",
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#666", fontStyle: "italic" }}>No dates selected yet</p>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  onClick={() => setShowCalendarModal(false)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "transparent",
                    color: "#666",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveSelectedDates}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#5d4037",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                  disabled={tempDates.length === 0}
                >
                  Save Availability
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {currentStageFields.showMeeting && (
        <div style={{ backgroundColor: "#f8f5f3", padding: "20px", borderRadius: "12px", marginBottom: "24px" }}>
          <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#4a352f", marginBottom: "16px" }}>
            Schedule Meeting
          </h4>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
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
                <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>{formErrors.meetingLocation}</p>
              )}
            </div>
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
              Meeting Purpose:
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
              <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>{formErrors.meetingPurpose}</p>
            )}
          </div>
        </div>
      )}
      {/* Stage Action Modal - Conditional Fields Based on Selected Stage */}
      {showStageModal &&
        selectedInternForStage &&
        createPortal(
          <div style={modalOverlayStyle} onClick={() => setShowStageModal(false)}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#3e2723", margin: "0 0 8px 0" }}>
                  Update Application Stage
                </h3>
                <p style={{ fontSize: "16px", color: "#666", margin: 0 }}>{selectedInternForStage.internName}</p>
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
                  Select Next Stage:
                </label>
                <select
                  value={nextStage}
                  onChange={(e) => {
                    setNextStage(e.target.value)
                    if (e.target.value) {
                      setFormErrors({ ...formErrors, nextStage: "" })
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: formErrors.nextStage ? "2px solid #dc2626" : "2px solid #c8b6a6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: "#f5f0e1",
                  }}
                >
                  <option value="">Choose a stage...</option>
                  {applicationStages.map((stage) => (
                    <option key={stage.id} value={stage.name}>
                      {stage.name}
                    </option>
                  ))}
                </select>
                {formErrors.nextStage && (
                  <p style={{ color: "#dc2626", fontSize: "14px", marginTop: "8px" }}>{formErrors.nextStage}</p>
                )}
              </div>

              {/* Conditional Fields Based on Selected Stage */}
              {nextStage && (
                <>
                  {/* Message - Always show */}
                  {currentStageFields.showMessage && (
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
                        Message to SMSE:
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value)
                          if (e.target.value.trim()) {
                            setFormErrors({ ...formErrors, message: "" })
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: formErrors.message ? "2px solid #dc2626" : "2px solid #c8b6a6",
                          borderRadius: "8px",
                          minHeight: "100px",
                          resize: "vertical",
                          fontSize: "16px",
                          fontFamily: "inherit",
                          backgroundColor: "#f5f0e1",
                        }}
                        placeholder="Enter your message..."
                      />
                      {formErrors.message && (
                        <p style={{ color: "#dc2626", fontSize: "14px", marginTop: "8px" }}>{formErrors.message}</p>
                      )}
                    </div>
                  )}
                  {currentStageFields.showAvailability && (
                    <div
                      style={{
                        backgroundColor: "#f8f5f3",
                        padding: "20px",
                        borderRadius: "12px",
                        marginBottom: "24px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "16px",
                        }}
                      >
                        <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#4a352f" }}>Your Availability</h4>
                        <button
                          onClick={() => setShowCalendarModal(true)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#5d4037",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Calendar size={14} />
                          Add Dates
                        </button>
                      </div>

                      {availabilities.length > 0 ? (
                        <div
                          style={{
                            border: "1px solid #eee",
                            borderRadius: "8px",
                            maxHeight: "200px",
                            overflowY: "auto",
                          }}
                        >
                          {availabilities.map((availability, index) => (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px 12px",
                                borderBottom: "1px solid #f0f0f0",
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: "500" }}>
                                  {availability.date.toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>
                                {availability.timeSlots?.[0] && (
                                  <div style={{ fontSize: "12px", color: "#666" }}>
                                    {availability.timeSlots[0].start} - {availability.timeSlots[0].end} (
                                    {availability.timeZone})
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => removeAvailability(availability.date)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#ff4444",
                                  cursor: "pointer",
                                  padding: "4px",
                                }}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: "#666", fontStyle: "italic" }}>No availability slots added yet</p>
                      )}
                      {formErrors.availabilities && (
                        <p style={{ color: "#dc2626", fontSize: "14px", marginTop: "8px" }}>
                          {formErrors.availabilities}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Meeting Details - Show for most stages */}
                  {currentStageFields.showMeeting && (
                    <div
                      style={{
                        backgroundColor: "#f8f5f3",
                        padding: "20px",
                        borderRadius: "12px",
                        marginBottom: "24px",
                      }}
                    >
                      <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#4a352f", marginBottom: "16px" }}>
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
                          Meeting Purpose:
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
                        onChange={(e) => setTermSheetFile(e.target.files[0])}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: "2px solid #c8b6a6",
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
                    backgroundColor: "#5d4037",
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Stage"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <style jsx>{`
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