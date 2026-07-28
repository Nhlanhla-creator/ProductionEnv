"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  X,
  Eye,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  GripVertical,
  RotateCcw,
  Settings,
  Trash2,
  Plus,
  LayoutGrid,
  CheckCircle,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowRight,
  Pin,
  PinOff,
  Bookmark,
  MoreVertical,
  HelpCircle,
  Calendar,
  Video,
  Target,
  MessageSquare,
  XCircle,
} from "lucide-react"
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

/* ═══════════════════════════════════════════════════════════════════════════
   Reference data
   ═══════════════════════════════════════════════════════════════════════════ */

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

  "Other",
].sort((a, b) => a.localeCompare(b))

const degreeOptions = [
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
  {
    group: "Diplomas",
    options: ["National Diploma", "Higher Certificate", "Advanced Diploma", "Postgraduate Diploma"],
  },
  {
    group: "TVET Qualifications",
    options: ["N6 Certificate", "N5 Certificate", "N4 Certificate", "NCV Level 4", "NCV Level 3", "NCV Level 2"],
  },
  { group: "Postgraduate", options: ["Honours Degree", "Master's Degree", "Doctoral Degree (PhD)"] },
  { group: "Other", options: ["Other"] },
]

const institutionFilterOptions = southAfricanInstitutions
const degreeFilterOptions = degreeOptions.flatMap((g) => g.options)

/* ═══════════════════════════════════════════════════════════════════════════
   Shared helpers
   ═══════════════════════════════════════════════════════════════════════════ */

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

const TruncatedText = ({ text, maxLength = 30 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span style={{ color: "#a89482", fontSize: "0.75rem" }}>{text || "-"}</span>
  }

  const shouldTruncate = text.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`

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
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
        >
          {isExpanded ? "Less" : "More"}
        </button>
      )}
    </div>
  )
}

const getScoreColor = (score) => {
  if (score >= 80) return "#22c55e"
  if (score >= 60) return "#f59e0b"
  return "#ef4444"
}

/* Every status the table can produce now has a colour. Completed previously
   carried Declined's pink background with Accepted's green text. */
const STATUS_TYPES = {
  Matched: { color: "#F5F0E1", textColor: "#7D5A50" },
  Requested: { color: "#E8EAF6", textColor: "#3949AB" },
  Applied: { color: "#E3F2FD", textColor: "#1565C0" },
  Shortlisted: { color: "#FFF3E0", textColor: "#F57C00" },
  "Contacted/Interview": { color: "#F3E5F5", textColor: "#7B1FA2" },
  Confirmed: { color: "#E8F5E8", textColor: "#388E3C" },
  "Confirmed/Term Sheet Sign": { color: "#E8F5E8", textColor: "#388E3C" },
  Accepted: { color: "#E8F5E8", textColor: "#388E3C" },
  "Contract Signed": { color: "#E0F2F1", textColor: "#00695C" },
  Active: { color: "#E0F7FA", textColor: "#00838F" },
  Completed: { color: "#EDE7F6", textColor: "#4527A0" },
  Declined: { color: "#FFEBEE", textColor: "#D32F2F" },
}

const getStatusStyle = (status) => STATUS_TYPES[status] || { color: "#F5F5F5", textColor: "#666666" }

const firstUrl = (arr) => (Array.isArray(arr) && arr.length > 0 && arr[0] && arr[0].url ? arr[0].url : null)

const toDateSafe = (ts) => {
  if (!ts) return null
  if (typeof ts === "string") return new Date(ts)
  if (typeof ts.toDate === "function") return ts.toDate()
  if (ts.seconds != null) return new Date(ts.seconds * 1000)
  return null
}

const toISODateOnly = (value) => {
  if (!value || value === "Not specified") return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

const formatAvailability = (value) => {
  if (!value || value === "Not specified") return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
}

const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

/* ═══════════════════════════════════════════════════════════════════════════
   Match scoring (unchanged)
   ═══════════════════════════════════════════════════════════════════════════ */

const calculateMatchScore = (internData, sponsorData) => {
  const internProfile = internData?.formData || {}
  const sponsorIR = sponsorData?.internshipRequest || {}
  const sponsorJob = sponsorData?.jobOverview || {}

  let score = 0

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

  breakdown.skillsMatch.details = { internSkills, sponsorRole, sponsorSkills }

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

  breakdown.workModeMatch.details = { internFlexibility: internLocationFlexibility, sponsorType }

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

  breakdown.availabilityMatch.details = { internStartDate, sponsorStartDate }

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
  const hasGradYear = internProfile.academicOverview?.graduationYear ? 1 : 0
  const hasInternType = sponsorIR.internType ? 1 : 0
  const additionalScore = hasGradYear + hasInternType

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
    breakdown.additionalFactors.description = "No profile completeness bonus - missing graduation year or internship type"
  }

  score += additionalScore

  return { score: Math.min(score, 100), breakdown }
}

export const calculateMatchScoreForSponsor = (smeData, internProfileData) => {
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
    breakdown.skillsMatch.description = "Skills align with role"
    score += 30
  } else {
    breakdown.skillsMatch.description = "Skills do not fully align with role"
  }

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
    breakdown.workModeMatch.description = "Work mode compatible"
    score += 25
  } else {
    breakdown.workModeMatch.description = "Work mode not compatible"
  }

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

  const additionalScore =
    (internProfile.academicOverview?.graduationYear ? 1 : 0) + (sponsorIR.internType ? 1 : 0)
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

/* ═══════════════════════════════════════════════════════════════════════════
   Pipeline stages
   ═══════════════════════════════════════════════════════════════════════════ */

const APPLICATION_STAGES = [
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
  "Contract Signed": "contract_signed",
  Active: "active",
  Completed: "completed",
  Declined: "declined",
  Decline: "declined",
}

const CUSTOM_NEXT_STAGE_MAP = {
  applied: "interviewed",
  requested: "accepted",
}

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

const NextStageIndicator = ({ currentStage }) => {
  const pipelineStage = currentStage ? STATUS_TO_PIPELINE_MAP[currentStage] || currentStage.toLowerCase() : null
  const currentIndex = pipelineStage ? PIPELINE_STAGES.indexOf(pipelineStage) : -1
  const nextStageName = computeNextStageName(currentStage)

  const pill = (text) => (
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
      {text}
    </div>
  )

  if (currentIndex === -1) return pill("Unknown stage")
  if (!nextStageName) return pill("Final stage")

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <ChevronRight size={14} color="#7d5a50" />
      <span style={{ fontSize: "12px", fontWeight: "500", color: "#4a352f" }}>{nextStageName}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Row actions.
   The primary action changes with status and never stays "Apply" once the
   SME has acted. Everything else now lives in the three-dot quick actions
   popup, matching the SME table's single-primary-button layout.
   ═══════════════════════════════════════════════════════════════════════════ */

const INTERN_ROW_ACTIONS = {
  Matched: { primary: { label: "Shortlist", kind: "shortlist" } },
  Shortlisted: { primary: { label: "Request", kind: "request" } },
  Requested: { primary: { label: "View Status", kind: "stage" } },
  Applied: { primary: { label: "View Application", kind: "stage" } },
  "Contacted/Interview": { primary: { label: "Schedule Interview", kind: "stage" } },
  Confirmed: { primary: { label: "View Status", kind: "stage" } },
  "Confirmed/Term Sheet Sign": { primary: { label: "View Status", kind: "stage" } },
  Accepted: { primary: { label: "View Next Steps", kind: "stage" } },
  "Contract Signed": { primary: { label: "View Placement", kind: "stage" } },
  Active: { primary: { label: "View Placement", kind: "stage" } },
  Completed: { primary: { label: "View Outcome", kind: "stage" } },
  Declined: { primary: { label: "View Outcome", kind: "stage" } },
}

const getRowActions = (status) => INTERN_ROW_ACTIONS[status] || { primary: { label: "View Candidate", kind: "view" } }

/* ═══════════════════════════════════════════════════════════════════════════
   Column configuration.

   Candidate is the pinned first column and Action the pinned last column, so
   neither appears here. The six above the divider are the spec default view;
   everything below is a spec "hidden by default" column.

   Widths were raised slightly so the uppercase header labels have room to sit
   next to their sort/filter controls — the old widths were what forced
   "Match %" to break into "MAT CH.." and "Status" into "STA TUS".

   priority drives responsive collapse: 1 survives mobile, <=3 survives
   tablet, everything shows on laptop and up.
   ═══════════════════════════════════════════════════════════════════════════ */

const COLUMN_DEFS = {
  matchPercentage: { label: "Match %", align: "center", width: 136, filterType: "match", visible: true, priority: 1, sortable: true },
  bigScore: { label: "Readiness / BIG Score", align: "center", width: 156, filterType: "bigScore", visible: true, priority: 2, sortable: true },
  qualification: { label: "Qualification / Field", width: 178, filterType: "qualification", visible: true, priority: 3, sortable: true },
  keySkills: { label: "Key Skills", width: 186, filterType: "keySkills", visible: true, priority: 3, sortable: false },
  availability: { label: "Availability", width: 140, filterType: "availability", visible: true, priority: 2, sortable: true },
  status: { label: "Status", width: 132, filterType: "status", visible: true, priority: 1, sortable: true },

  institution: { label: "Institution", width: 158, filterType: "institution", visible: false, priority: 4, sortable: true },
  degree: { label: "Degree", width: 138, filterType: "degree", visible: false, priority: 4, sortable: true },
  field: { label: "Field", width: 138, filterType: "field", visible: false, priority: 4, sortable: true },
  location: { label: "Location", width: 132, filterType: "location", visible: false, priority: 4, sortable: true },
  locationFlexibility: { label: "Work Preference", width: 144, filterType: "locationFlexibility", visible: false, priority: 4, sortable: true },
  languages: { label: "Languages", width: 138, filterType: "languages", visible: false, priority: 4, sortable: false },
  fundingProgramType: { label: "Funding Program", width: 150, filterType: "fundingProgramType", visible: false, priority: 4, sortable: true },
  nextStage: { label: "Next Stage", width: 132, filterType: "nextStage", visible: false, priority: 4, sortable: false },
}

const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS)
const DEFAULT_COLUMN_VISIBILITY = Object.fromEntries(
  DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].visible !== false]),
)
const DEFAULT_COLUMN_WIDTHS = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].width]))
const DEFAULT_PINNED = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, null]))
const DEFAULT_DENSITY = "comfortable"

const CANDIDATE_WIDTH = 214
const ACTION_WIDTH = 196
const MIN_COLUMN_WIDTH = 84

/* ─── Saved views + filter persistence ──────────────────────────────────── */

const BUILTIN_VIEW_ID = "__default__"
// Bumped to v3: the stored widths from v2 are the narrow ones that caused the
// header labels to break mid-word, so old saved views need to fall back to the
// new defaults rather than resurrect the cramped layout.
const VIEWS_STORAGE_KEY = "intern-table-views-v3"
const FILTERS_STORAGE_KEY = "intern-table-filters-v1"

const EMPTY_FILTERS = {
  name: "",
  matchRange: [0, 100],
  bigScoreRange: [0, 100],
  qualification: "",
  keySkills: [],
  availableFrom: "",
  availableTo: "",
  status: [],
  institution: [],
  degree: [],
  field: [],
  location: [],
  locationFlexibility: [],
  languages: [],
  fundingProgramType: [],
  nextStage: [],
}

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
  columnWidths: { ...DEFAULT_COLUMN_WIDTHS },
  pinned: { ...DEFAULT_PINNED },
  density: DEFAULT_DENSITY,
})

const createBuiltinDefaultView = () => ({
  id: BUILTIN_VIEW_ID,
  name: "Default",
  description: "",
  builtin: true,
  ...createDefaultViewLayout(),
})

const sanitizeView = (view, fallbackId) => ({
  id: view?.id || fallbackId,
  name: (view?.name || "Untitled view").toString(),
  description: (view?.description || "").toString(),
  builtin: !!view?.builtin,
  columnVisibility: { ...DEFAULT_COLUMN_VISIBILITY, ...(view?.columnVisibility || {}) },
  columnOrder: sanitizeColumnOrder(view?.columnOrder),
  columnWidths: { ...DEFAULT_COLUMN_WIDTHS, ...(view?.columnWidths || {}) },
  pinned: { ...DEFAULT_PINNED, ...(view?.pinned || {}) },
  density: view?.density || DEFAULT_DENSITY,
})

const loadViewsState = () => {
  const freshDefault = () => ({
    activeViewId: BUILTIN_VIEW_ID,
    views: { [BUILTIN_VIEW_ID]: createBuiltinDefaultView() },
  })
  if (typeof window === "undefined") return freshDefault()
  try {
    const saved = JSON.parse(window.localStorage.getItem(VIEWS_STORAGE_KEY) || "null")
    const rawViews = saved?.views && typeof saved.views === "object" ? saved.views : {}
    const views = {}
    Object.entries(rawViews).forEach(([id, v]) => {
      views[id] = sanitizeView(v, id)
    })
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
  try {
    window.localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage can fail (private browsing, quota) — the table still works this session.
  }
}

const loadFilterState = () => {
  if (typeof window === "undefined") return { filters: { ...EMPTY_FILTERS }, sort: null }
  try {
    const saved = JSON.parse(window.localStorage.getItem(FILTERS_STORAGE_KEY) || "null")
    return {
      filters: { ...EMPTY_FILTERS, ...(saved?.filters || {}) },
      sort: saved?.sort?.key ? saved.sort : null,
    }
  } catch {
    return { filters: { ...EMPTY_FILTERS }, sort: null }
  }
}

const persistFilterState = (filters, sort) => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({ filters, sort }))
  } catch {
    // Non-fatal.
  }
}

const generateViewId = () => {
  try {
    return `view_${crypto.randomUUID()}`
  } catch {
    return `view_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }
}

/* Rows with barely any data are noise. Kept identical to the pipeline's copy —
   if you change it, change it there too, or the counts drift apart. */
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

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */

export function InternTablePage({
  filters,
  stageFilter,
  profileMatchesCount,
  onMatchesCountChange,
}) {
  const [interns, setInterns] = useState([])
  const [showInternDetails, setShowInternDetails] = useState(false)
  const [selectedInternDetails, setSelectedInternDetails] = useState(null)

  // ─── Popups (same pattern as SupportSMETable) ───────────────────────────
  // activePopup = { type, internKey, position:{x,y}, rect }. All four popup
  // kinds (bigScore / match / stage / quickActions) are anchored popovers
  // portaled to <body>, so they never get clipped by the table's scroll
  // container the way the old centred modals did.
  const [activePopup, setActivePopup] = useState(null)
  const [selectedInternForPopup, setSelectedInternForPopup] = useState(null)

  const [interviewDate, setInterviewDate] = useState("")
  const [interviewTime, setInterviewTime] = useState("")
  const [interviewLocation, setInterviewLocation] = useState("")
  const [formErrors, setFormErrors] = useState({})

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedInternForStage, setSelectedInternForStage] = useState(null)
  const [updatedStages, setUpdatedStages] = useState({})
  const [meetingTime, setMeetingTime] = useState("")
  const [meetingLocation, setMeetingLocation] = useState("")
  const [meetingPurpose, setMeetingPurpose] = useState("")
  const [termSheetFile, setTermSheetFile] = useState(null)
  const [availabilities, setAvailabilities] = useState([])
  const [showCalendarPopup, setShowCalendarPopup] = useState(false)
  const [tempDates, setTempDates] = useState([])
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" })
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [selectedStage, setSelectedStage] = useState("")
  const [stageNotes, setStageNotes] = useState("")

  const [companyOwnerId, setCompanyOwnerId] = useState(null)
  const [isCompanyMember, setIsCompanyMember] = useState(false)
  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [userRole, setUserRole] = useState(null)

  const [savedMatches, setSavedMatches] = useState({})
  const [hoveredRowKey, setHoveredRowKey] = useState(null)

  // Filters + sort, restored from the last visit
  const initialFilterState = useMemo(() => loadFilterState(), [])
  const [localFilters, setLocalFilters] = useState(initialFilterState.filters)
  const [sortConfig, setSortConfig] = useState(initialFilterState.sort)

  // Views
  const [viewsState, setViewsState] = useState(() => loadViewsState())
  const initialActiveView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]
  const [columnVisibility, setColumnVisibility] = useState(() => initialActiveView.columnVisibility)
  const [columnOrder, setColumnOrder] = useState(() => initialActiveView.columnOrder)
  const [columnWidths, setColumnWidths] = useState(() => initialActiveView.columnWidths)
  const [pinned, setPinned] = useState(() => initialActiveView.pinned)
  const [density, setDensity] = useState(() => initialActiveView.density)

  const [showCustomizeMenu, setShowCustomizeMenu] = useState(false)
  const [customizeMenuRect, setCustomizeMenuRect] = useState(null)
  const [showNewViewForm, setShowNewViewForm] = useState(false)
  const [newViewName, setNewViewName] = useState("")
  const [newViewDescription, setNewViewDescription] = useState("")
  const [editingViewMeta, setEditingViewMeta] = useState(null)
  const [columnSearch, setColumnSearch] = useState("")

  // Drag-to-reorder / resize
  const [draggedColumn, setDraggedColumn] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [dragHintRect, setDragHintRect] = useState(null)
  const resizingRef = useRef(null)

  const [headerFilterOpen, setHeaderFilterOpen] = useState(null)

  // Viewport, for responsive column collapse
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === "undefined" ? 1440 : window.innerWidth,
  )
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]

  /* ─── Company membership ──────────────────────────────────────────────── */
  useEffect(() => {
    const checkCompanyMembership = async () => {
      const user = auth.currentUser
      if (!user) return

      try {
        const userDocSnap = await getDoc(doc(db, "users", user.uid))

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
          const userCompanyId = userData.companyId
          const userCompanyRole = userData.userRole

          if (userCompanyId) {
            const companyDocSnap = await getDoc(doc(db, "companies", userCompanyId))

            if (companyDocSnap.exists()) {
              const ownerId = companyDocSnap.data().createdBy
              setUserRole(userCompanyRole || "viewer")

              if (ownerId === user.uid) {
                setIsCompanyMember(false)
                setEffectiveUserId(user.uid)
              } else {
                setIsCompanyMember(true)
                setCompanyOwnerId(ownerId)
                setEffectiveUserId(ownerId)
              }
              return
            }
          }
          setIsCompanyMember(false)
          setEffectiveUserId(user.uid)
          setUserRole("owner")
        } else {
          setEffectiveUserId(user.uid)
          setUserRole("owner")
        }
      } catch (error) {
        console.error("Error checking company membership:", error)
        setEffectiveUserId(user.uid)
        setUserRole("owner")
      }
    }

    checkCompanyMembership()
  }, [])

  /* ─── Data ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const fetchInternApplications = async () => {
      if (!effectiveUserId) return

      setLoading(true)
      try {
        const user = auth.currentUser
        if (!user) {
          setLoading(false)
          return
        }

        const smeUserId = effectiveUserId
        const smeUserDoc = await getDoc(doc(db, "universalProfiles", smeUserId))
        const smeUserData = smeUserDoc.exists() ? smeUserDoc.data() : {}

        const applicationsQuery = query(
          collection(db, "internshipApplications"),
          where("sponsorId", "==", smeUserId),
        )
        const applicationsSnapshot = await getDocs(applicationsQuery)

        const appliedInternIds = new Set()

        const applicationInterns = await Promise.all(
          applicationsSnapshot.docs.map(async (applicationDoc) => {
            try {
              const applicationData = applicationDoc.data()
              const internId = applicationData.applicantId
              if (!internId) return null

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
                const internProfileSnap = await getDoc(doc(db, "internProfiles", internId))
                if (internProfileSnap.exists()) profileData = internProfileSnap.data()
              } catch (profileError) {
                console.error(`Failed to fetch profile for intern ${internId}:`, profileError)
              }

              const formData = profileData.formData || {}
              const personalOverview = formData.personalOverview || {}
              const educationalBackground = formData.educationalBackground || {}
              const academicOverview = formData.academicOverview || {}
              const skillsInterests = formData.skillsInterests || {}
              const programAffiliation = formData.programAffiliation || {}
              const requiredDocuments = formData.requiredDocuments || profileData.requiredDocuments || {}

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
                    professionalPresentation:
                      evalScores.professionalPresentation ?? evaluationScores.professionalPresentation,
                    professionalSkills: evalScores.professionalSkills ?? evaluationScores.professionalSkills,
                    workExperience: evalScores.workExperience ?? evaluationScores.workExperience,
                  }
                }
              } catch (evalError) {
                console.warn(`Could not fetch live evaluation for intern ${internId}:`, evalError)
              }

              const matchPercentage =
                applicationData.matchPercentage || applicationData.matchAnalysis?.overallScore || 0

              const availabilityData = applicationData.availableDates
                ? applicationData.availableDates.map((avail) => ({ ...avail, date: new Date(avail.date) }))
                : []

              const extractDocUrl = (docArray) =>
                Array.isArray(docArray) && docArray.length > 0 ? docArray[0].url || null : null

              return {
                id: applicationDoc.id,
                internId,
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
                yearOfStudy: academicOverview.yearOfStudy || educationalBackground.currentLevel || "Not specified",
                graduationYear: academicOverview.graduationYear || "Not specified",
                role: applicationData.role || skillsInterests.careerGoals || "Not specified",
                sponsorName: programAffiliation.sponsorName || "Not specified",
                fundingProgramType: applicationData.funding || programAffiliation.fundingType || "Not specified",
                startDate: applicationData.startDate || skillsInterests.availabilityStart || "Not specified",
                bigScore: evaluationScores.bigInternScore,
                evaluationScores,
                matchPercentage,
                status: applicationData.status || "Applied",
                pipelineStage: applicationData.status || "Applied",
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
                profileCreatedAt: toDateSafe(profileData.createdAt),
                profileLastUpdated: toDateSafe(profileData.lastUpdated),
                applicationCreatedAt: applicationData.createdAt || null,
                applicationUpdatedAt: applicationData.updatedAt || null,
              }
            } catch {
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

              const matchResult = calculateMatchScoreForSponsor(smeUserData, data)
              const matchPercentage = matchResult.score || (data.matchPercentage ?? 0)

              const fd = data.formData || {}
              const personalOverview = fd.personalOverview || {}
              const academicOverview = fd.academicOverview || {}
              const skillsInterests = fd.skillsInterests || {}
              const programAffiliation = fd.programAffiliation || {}
              const requiredDocs = fd.requiredDocuments || data.requiredDocuments || {}
              const experienceTrackRecord = fd.experienceTrackRecord || {}

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
                yearOfStudy: academicOverview.yearOfStudy || "Not specified",
                graduationYear: academicOverview.graduationYear || "Not specified",
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
                evaluationScores,
                matchPercentage: matchPercentage || 0,
                status: "Matched",
                pipelineStage: "Matched",
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

        // Report the unapplied-profile count upward — this was previously
        // wired but never called, so the parent always received 0.
        if (typeof profileMatchesCount === "function") {
          profileMatchesCount(profileInterns.filter(Boolean).length)
        }
      } catch (error) {
        console.error("Error fetching intern applications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInternApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId])

  /* ─── View + filter persistence ───────────────────────────────────────── */
  useEffect(() => {
    setViewsState((prev) => {
      const current = prev.views[prev.activeViewId]
      if (!current) return prev
      const updated = { ...current, columnVisibility, columnOrder, columnWidths, pinned, density }
      const next = { ...prev, views: { ...prev.views, [prev.activeViewId]: updated } }
      persistViewsState(next)
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility, columnOrder, columnWidths, pinned, density])

  useEffect(() => {
    persistFilterState(localFilters, sortConfig)
  }, [localFilters, sortConfig])

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
    setColumnWidths(target.columnWidths)
    setPinned(target.pinned)
    setDensity(target.density)
  }

  const createNewView = () => {
    const trimmedName = newViewName.trim()
    if (!trimmedName) return
    const id = generateViewId()
    const newView = {
      id,
      name: trimmedName,
      description: newViewDescription.trim(),
      builtin: false,
      columnVisibility: { ...columnVisibility },
      columnOrder: [...columnOrder],
      columnWidths: { ...columnWidths },
      pinned: { ...pinned },
      density,
    }
    setViewsState((prev) => {
      const next = { activeViewId: id, views: { ...prev.views, [id]: newView } }
      persistViewsState(next)
      return next
    })
    setNewViewName("")
    setNewViewDescription("")
    setShowNewViewForm(false)
    setNotification({ type: "success", message: `View "${trimmedName}" created` })
  }

  const startEditingViewMeta = (view) =>
    setEditingViewMeta({ id: view.id, name: view.name, description: view.description, builtin: !!view.builtin })

  const saveViewMeta = () => {
    if (!editingViewMeta) return
    const trimmedName = editingViewMeta.name.trim()
    if (!trimmedName && !editingViewMeta.builtin) return
    setViewsState((prev) => {
      const existing = prev.views[editingViewMeta.id]
      if (!existing) return prev
      const updated = {
        ...existing,
        name: existing.builtin ? existing.name : trimmedName,
        description: editingViewMeta.description.trim(),
      }
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
      setColumnWidths(def.columnWidths)
      setPinned(def.pinned)
      setDensity(def.density)
    }
    setNotification({ type: "success", message: "View deleted" })
  }

  const resetActiveViewToDefault = () => {
    const layout = createDefaultViewLayout()
    setColumnVisibility(layout.columnVisibility)
    setColumnOrder(layout.columnOrder)
    setColumnWidths(layout.columnWidths)
    setPinned(layout.pinned)
    setDensity(layout.density)
    setNotification({ type: "success", message: `"${activeView.name}" reset to factory defaults` })
  }

  const toggleColumn = (key) => setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }))

  const cyclePin = (key) =>
    setPinned((prev) => ({
      ...prev,
      [key]: prev[key] === "left" ? "right" : prev[key] === "right" ? null : "left",
    }))

  /* ─── Drag to reorder ─────────────────────────────────────────────────── */
  const handleColumnDragStart = (e, key) => {
    setDraggedColumn(key)
    setDragHintRect(null)
    try {
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", key)
    } catch {}
  }
  const handleColumnDragOver = (e, key) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (key !== dragOverColumn) setDragOverColumn(key)
  }
  const handleColumnDrop = (e, key) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === key) {
      setDraggedColumn(null)
      setDragOverColumn(null)
      return
    }
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
  const handleColumnDragEnd = () => {
    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  /* ─── Resize ──────────────────────────────────────────────────────────── */
  const startResize = (e, key) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = columnWidths[key] ?? COLUMN_DEFS[key].width
    resizingRef.current = key

    const onMove = (ev) => {
      const next = Math.max(MIN_COLUMN_WIDTH, startWidth + (ev.clientX - startX))
      setColumnWidths((prev) => ({ ...prev, [key]: next }))
    }
    const onUp = () => {
      resizingRef.current = null
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  /* ─── Header filter + sort ────────────────────────────────────────────── */
  const openHeaderFilter = (type, event) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    setHeaderFilterOpen((prev) => (prev?.type === type ? null : { type, rect }))
  }
  const closeHeaderFilter = () => setHeaderFilterOpen(null)

  const toggleSort = (key, event) => {
    event.stopPropagation()
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" }
      if (prev.dir === "asc") return { key, dir: "desc" }
      return null
    })
  }

  const FilterTrigger = ({ type, active }) => (
    <button
      type="button"
      onClick={(e) => openHeaderFilter(type, e)}
      className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${
        active ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"
      }`}
      title="Filter this column"
    >
      <SlidersHorizontal size={11} />
    </button>
  )

  const SortTrigger = ({ columnKey }) => {
    const isActive = sortConfig?.key === columnKey
    return (
      <button
        type="button"
        onClick={(e) => toggleSort(columnKey, e)}
        className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${
          isActive ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"
        }`}
        title={isActive ? (sortConfig.dir === "asc" ? "Sort descending" : "Clear sort") : "Sort ascending"}
      >
        {isActive ? (
          sortConfig.dir === "asc" ? (
            <ArrowUp size={11} />
          ) : (
            <ArrowDown size={11} />
          )
        ) : (
          <ArrowUpDown size={11} />
        )}
      </button>
    )
  }

  /* ─── Popup plumbing (mirrors SupportSMETable.openPopup) ──────────────── */
  const handleViewDetails = (intern) => {
    setSelectedInternDetails(intern)
    setShowInternDetails(true)
    setActivePopup(null)
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

  const openPopup = (type, intern, rect) => {
    let popupWidth
    let popupHeight
    switch (type) {
      case "bigScore":
        popupWidth = 380
        popupHeight = 450
        break
      case "match":
        popupWidth = 380
        popupHeight = 460
        break
      case "stage":
        popupWidth = 460
        popupHeight = 560
        break
      case "quickActions":
        popupWidth = 210
        popupHeight = 280
        break
      default:
        popupWidth = 300
        popupHeight = 300
    }

    let x = rect.left + rect.width / 2 - popupWidth / 2
    let y = rect.bottom + 8

    if (x + popupWidth > window.innerWidth - 20) x = window.innerWidth - popupWidth - 20
    if (x < 20) x = 20
    if (y + popupHeight > window.innerHeight - 20) y = rect.top - popupHeight - 8
    if (y < 20) y = 20

    setSelectedInternForPopup(intern)
    setActivePopup({ type, internKey: intern.id, position: { x, y }, rect })

    if (type === "stage") {
      setSelectedInternForStage(intern)
      setSelectedStage("")
      setStageNotes("")
      setInterviewDate("")
      setInterviewTime("")
      setInterviewLocation("")
      setMeetingTime("")
      setMeetingLocation("")
      setMeetingPurpose("")
      setTermSheetFile(null)
      setFormErrors({})
      loadApplicationAvailability(intern)
    }
  }

  const openPopupFromEvent = (type, intern, event) => {
    event.stopPropagation()
    openPopup(type, intern, event.currentTarget.getBoundingClientRect())
  }

  const closePopup = () => {
    setActivePopup(null)
    setSelectedInternForPopup(null)
    setShowCalendarPopup(false)
  }

  const handleStageAction = (intern, event) => {
    if (event) return openPopupFromEvent("stage", intern, event)
    // Fallback when invoked without an event (e.g. from the quick actions menu).
    const fallbackRect = activePopup?.rect || {
      left: window.innerWidth / 2 - 100,
      right: window.innerWidth / 2 + 100,
      top: window.innerHeight / 2 - 100,
      bottom: window.innerHeight / 2,
      width: 200,
      height: 34,
    }
    openPopup("stage", intern, fallbackRect)
  }

  const resetStageForm = () => {
    setSelectedInternForStage(null)
    setInterviewDate("")
    setInterviewTime("")
    setInterviewLocation("")
    setTermSheetFile(null)
    setFormErrors({})
    setAvailabilities([])
    setSelectedStage("")
    setStageNotes("")
    setMeetingTime("")
    setMeetingLocation("")
    setMeetingPurpose("")
  }

  const handleTimeChange = (type, value) => setTimeSlot((prev) => ({ ...prev, [type]: value }))

  const saveSelectedDates = () => {
    const newAvailabilities = tempDates
      .filter((date) => !availabilities.some((a) => a.date?.getTime?.() === date.getTime()))
      .map((date) => ({
        date,
        timeSlots: [{ start: timeSlot.start, end: timeSlot.end }],
        timeZone,
        status: "available",
      }))
    setAvailabilities((prev) => [...prev, ...newAvailabilities])
    setShowCalendarPopup(false)
    setTempDates([])
  }

  const removeAvailability = (dateToRemove) =>
    setAvailabilities((prev) => prev.filter((avail) => avail.date.getTime() !== dateToRemove.getTime()))

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
      case "Confirmed":
        fields.showMeeting = true
        break
      default:
        break
    }

    if (stage === "Contacted/Interview" || stage === "Interviewed" || stage === "Confirmed") {
      fields.showAvailability = true
    }

    return fields
  }

  /* Shortlist without opening the popup. Profile rows have no application
     document yet, so one is created with a deterministic id. */
  const handleQuickStage = async (intern, nextStatus) => {
    if (isCompanyMember && !["owner", "admin", "manager"].includes(userRole)) {
      setNotification({ type: "warning", message: "You don't have permission to update application stages." })
      setTimeout(() => setNotification(null), 4000)
      return
    }

    const user = auth.currentUser
    if (!user) {
      setNotification({ type: "error", message: "User not authenticated. Please log in." })
      return
    }

    const sponsorId = effectiveUserId
    const docId = intern.applicationId || `${sponsorId}_${intern.internId}`

    try {
      await setDoc(
        doc(db, "internshipApplications", docId),
        {
          applicantId: intern.internId,
          internId: intern.internId,
          internName: intern.internName,
          sponsorId,
          status: nextStatus,
          pipelineStage: nextStatus,
          matchPercentage: intern.matchPercentage,
          bigInternScore: intern.bigScore,
          lastUpdatedBy: user.uid,
          lastUpdatedByRole: userRole,
          updatedAt: serverTimestamp(),
          ...(intern.applicationId ? {} : { createdAt: serverTimestamp(), type: "Shortlisted Candidate" }),
        },
        { merge: true },
      )

      setInterns((prev) =>
        prev.map((row) =>
          row.id === intern.id
            ? { ...row, status: nextStatus, pipelineStage: nextStatus, applicationId: docId }
            : row,
        ),
      )
      setUpdatedStages((prev) => ({ ...prev, [intern.id]: nextStatus }))
      setNotification({ type: "success", message: `${intern.internName} moved to ${nextStatus}.` })
      setTimeout(() => setNotification(null), 4000)
    } catch (error) {
      console.error("Quick stage update failed:", error)
      setNotification({ type: "error", message: `Could not update ${intern.internName}: ${error.message}` })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  const handleStageUpdate = async () => {
    if (isCompanyMember && !["owner", "admin", "manager"].includes(userRole)) {
      setNotification({ type: "warning", message: "You don't have permission to update application stages." })
      return
    }

    const stageFields = getStageFields(selectedStage)
    const errors = {}

    if (!selectedStage) errors.selectedStage = "Please select a new stage"

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
      if (!meetingLocation || !meetingLocation.trim()) errors.meetingLocation = "Meeting location is required"
      if (!meetingPurpose || !meetingPurpose.trim()) errors.meetingPurpose = "Meeting purpose is required"
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
      const internId = selectedInternForStage.id

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
        lastUpdatedBy: user.uid,
        lastUpdatedByRole: userRole,
        ...(stageNotes && { lastMessage: stageNotes }),
        ...(stageFields.showInterview && {
          interviewDetails: { date: interviewDate, time: interviewTime, location: interviewLocation },
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

      const applicationDocId = selectedInternForStage.applicationId || selectedInternForStage.id
      const docRef = doc(db, "internshipApplications", applicationDocId)

      const docSnapshot = await getDoc(docRef)
      if (!docSnapshot.exists()) throw new Error(`Application document ${applicationDocId} not found`)

      const applicationData = docSnapshot.data()
      const internUid = applicationData.applicantId

      await updateDoc(docRef, updateData)

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
                status: selectedStage,
                pipelineStage: selectedStage,
                ...(stageNotes && { lastMessage: stageNotes }),
                ...(stageFields.showInterview && {
                  interviewDetails: { date: interviewDate, time: interviewTime, location: interviewLocation },
                }),
                ...(updateData.availableDates && { availableDates: updateData.availableDates }),
              }
            : intern,
        ),
      )

      setUpdatedStages((prev) => ({ ...prev, [internId]: selectedStage }))
      setNotification({ type: "success", message: `Application status updated to ${selectedStage} successfully` })
      closePopup()
      resetStageForm()

      let internEmail = null
      try {
        const internProfileSnap = await getDoc(doc(db, "internProfiles", internUid))
        if (internProfileSnap.exists()) {
          const internProfileData = internProfileSnap.data()
          internEmail =
            internProfileData.formData?.personalOverview?.email ||
            internProfileData.userEmail ||
            internProfileData.contactDetails?.email ||
            internProfileData.email
        }
      } catch (emailError) {
        console.error("Error fetching intern email:", emailError)
      }

      if (!internEmail) internEmail = selectedInternForStage.profileEmail

      const subject = `Update: ${selectedStage} Stage for Your Application`
      let content = `Dear ${selectedInternForStage.internName},\n\nYour application has progressed to the "${selectedStage}" stage.\n\n`

      if (stageNotes) {
        content += `Message from ${user?.displayName || "Internship Program Team"}:\n${stageNotes}\n\n`
      }

      if (stageFields.showMeeting) {
        content += `Meeting Details:\n`
        if (meetingTime) content += `- Time: ${new Date(meetingTime).toLocaleString()}\n`
        if (meetingLocation) content += `- Location: ${meetingLocation}\n`
        if (meetingPurpose) content += `- Purpose: ${meetingPurpose}\n\n`
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
              ? `${avail.timeSlots[0].start} - ${avail.timeSlots[0].end} ${avail.timeZone}`
              : "Time not specified"
            return `${idx + 1}. ${dateStr} (${timeStr})`
          })
          .join("\n")
        content += `\nPlease reply with your preferred time.`
      }

      content += `\n\nBest regards,\nInternship Program Team\nBIG Marketplace Africa`

      const messagePayload = {
        to: internUid,
        from: sponsorId,
        subject,
        content,
        date: new Date().toISOString(),
        read: false,
        type: "inbox",
        applicationId: internId,
        ...(attachmentUrl && { attachments: [attachmentUrl] }),
        ...(stageFields.showAvailability &&
          availabilities.length > 0 && { availableDates: updateData.availableDates }),
      }

      const sentMessagePayload = {
        ...messagePayload,
        read: true,
        type: "sent",
        to: sponsorId,
        from: internUid,
      }

      await Promise.all([
        addDoc(collection(db, "messages"), messagePayload),
        addDoc(collection(db, "messages"), sentMessagePayload),
      ])

      if (internEmail) {
        try {
          const emailjsConfig = {
            serviceId: API_KEYS.SERVICE_ID_MESSAGES,
            templateId: API_KEYS.TEMPLATE_ID_MESSAGES,
            publicKey: API_KEYS.PUBLIC_KEY_ID_MESSAGES,
          }

          if (!window.emailjs) {
            emailjs.init(emailjsConfig.publicKey)
            window.emailjs = emailjs
          }

          const sponsorName = user?.displayName || "Internship Program Team"
          const internName = selectedInternForStage.internName

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(internEmail)) throw new Error(`Invalid email format: "${internEmail}"`)

          let emailMessage = `Dear ${internName},\n\n`

          if (selectedStage === "Declined") {
            emailMessage += `We regret to inform you that your application has been moved to the "${selectedStage}" stage.\n\n`
          } else {
            emailMessage += `We are pleased to inform you that your application has progressed to the "${selectedStage}" stage.\n\n`
          }

          if (stageNotes) emailMessage += `Message from ${sponsorName}:\n${stageNotes}\n\n`

          if (stageFields.showMeeting && meetingLocation && meetingPurpose) {
            emailMessage += `Meeting Details:\n`
            if (meetingTime) emailMessage += `- Date: ${new Date(meetingTime).toLocaleString()}\n`
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

          await window.emailjs.send(
            emailjsConfig.serviceId,
            emailjsConfig.templateId,
            templateParams,
            emailjsConfig.publicKey,
          )

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
      console.error("Detailed error:", { message: error.message, code: error.code, stack: error.stack })
      setNotification({ type: "error", message: `Failed to update status: ${error.message}` })
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

      if (isCompanyMember && !["owner", "admin"].includes(userRole)) {
        setNotification({ type: "warning", message: "Only company owners and admins can request interns." })
        return
      }

      const internId = intern.internId
      const sponsorId = effectiveUserId

      let smeData = {}
      try {
        const smeDoc = await getDoc(doc(db, "universalProfiles", sponsorId))
        smeData = smeDoc.exists() ? smeDoc.data() : {}
      } catch (smeError) {
        console.warn("Could not retrieve SME profile:", smeError)
      }

      let internshipInformation = {}
      try {
        const smeDoc = await getDoc(doc(db, "internApplications", sponsorId))
        internshipInformation = smeDoc.exists() ? smeDoc.data() : {}
      } catch (smeError) {
        console.warn("Could not retrieve internship request:", smeError)
      }

      let internData = {}
      try {
        const internDoc = await getDoc(doc(db, "internProfiles", intern.internId))
        internData = internDoc.exists() ? internDoc.data() : {}
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
          evaluationScores = {
            academic: evalData.scores?.academic || 0,
            bigInternScore: evalData.scores?.bigInternScore || 0,
            professionalPresentation: evalData.scores?.professionalPresentation || 0,
            professionalSkills: evalData.scores?.professionalSkills || 0,
            workExperience: evalData.scores?.workExperience || 0,
            lastUpdated: evalData.scores?.lastUpdated || null,
            updatedAt: evalData.scores?.updatedAt || null,
          }
        }
      } catch (evaluationError) {
        console.warn("Could not retrieve evaluation scores:", evaluationError)
      }

      const requestDocId = `${sponsorId}_${internId}`
      const internFormData = internData.formData || {}
      const internProfile = internData.entityOverview || {}
      const matchResult = calculateMatchScore(internData, smeData)

      const requestData = {
        applicantId: internId,
        internId,
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
        sponsorId,
        submittedBy: user.uid,
        submittedByRole: userRole,
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

      // Reflect the new status in the row immediately. The old `statuses`
      // state was written here and never read, so the button never changed.
      setInterns((prev) =>
        prev.map((row) =>
          row.id === intern.id
            ? { ...row, status: "Requested", pipelineStage: "Requested", applicationId: requestDocId }
            : row,
        ),
      )
      setUpdatedStages((prev) => ({ ...prev, [intern.id]: "Requested" }))

      try {
        let internEmail = null
        try {
          const internProfileSnap = await getDoc(doc(db, "internProfiles", intern.internId))
          if (internProfileSnap.exists()) {
            const internProfileData = internProfileSnap.data()
            internEmail =
              internProfileData.formData?.personalOverview?.email ||
              internProfileData.userEmail ||
              internProfileData.contactDetails?.email ||
              internProfileData.email
          }
        } catch (emailError) {
          console.error("Error fetching intern email for request:", emailError)
        }

        if (!internEmail) internEmail = intern.profileEmail

        if (internEmail) {
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

          const emailMessage = `Dear ${intern.internName},\n\n
We are excited to inform you that ${sponsorName} has requested you for an internship opportunity!\n\n
Position: ${requestData.role}\n
Location: ${requestData.location}\n
Start Date: ${requestData.startDate}\n\n
Your profile stood out to us because of your strong match with our requirements. We would like to discuss this opportunity further with you.\n\n
Please log into your BIG Marketplace Africa account to view the full details and respond to this request.\n\n
Best regards,\n${sponsorName}\nInternship Program Team\nBIG Marketplace Africa`

          await window.emailjs.send(
            emailjsConfig.serviceId,
            emailjsConfig.templateId,
            {
              to_email: internEmail,
              subject: `New Internship Request from ${sponsorName}`,
              from_name: sponsorName,
              date: new Date().toLocaleDateString(),
              message: emailMessage,
              portal_url: `https://www.bigmarketplace.africa/applications/${sponsorId}_${internId}`,
              has_attachments: "false",
              attachments_count: "0",
            },
            emailjsConfig.publicKey,
          )
        }
      } catch (emailError) {
        console.error("Internship request email failed:", emailError)
      }

      const event = new CustomEvent("newNotification", {
        detail: {
          message: `New internship request from ${requestData.sponsorName} for ${requestData.role}!`,
          type: "info",
          timestamp: new Date().toISOString(),
          recipientId: internId,
        },
        bubbles: true,
        cancelable: true,
        composed: true,
      })
      setTimeout(() => window.dispatchEvent(event), 100)

      setNotification({ type: "success", message: `Intern request successfully sent to ${intern.internName}!` })
      setTimeout(() => setNotification(null), 4000)
    } catch (error) {
      console.error("Detailed error in handleRequestIntern:", error)

      let errorMessage = "Failed to send intern request."
      if (error.code === "permission-denied") {
        errorMessage = "Permission denied. Please check your account permissions."
      } else if (error.code === "unavailable") {
        errorMessage = "Service temporarily unavailable. Please try again."
      } else if (error.code === "network-request-failed") {
        errorMessage = "Network error. Please check your internet connection."
      } else if (error.message?.includes("auth")) {
        errorMessage = "Authentication error. Please log in again."
      }

      window.dispatchEvent(
        new CustomEvent("newNotification", {
          detail: { message: errorMessage, type: "error", timestamp: new Date().toISOString() },
        }),
      )

      setNotification({ type: "error", message: errorMessage })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  /* ─── Derived filter options ──────────────────────────────────────────── */
  const uniqueFields = useMemo(
    () => [...new Set(interns.map((i) => formatLabel(i.field)).filter((v) => v && v !== "Not Specified"))].sort(),
    [interns],
  )
  const uniqueLocationFlex = useMemo(
    () => [...new Set(interns.map((i) => i.locationFlexibility).filter((v) => v && v !== "Not specified"))].sort(),
    [interns],
  )
  const uniqueFundingPrograms = useMemo(
    () => [...new Set(interns.map((i) => i.fundingProgramType).filter((v) => v && v !== "Not specified"))].sort(),
    [interns],
  )
  const uniqueSkills = useMemo(
    () => [...new Set(interns.flatMap((i) => (Array.isArray(i.technicalSkills) ? i.technicalSkills : [])).filter(Boolean))].sort(),
    [interns],
  )
  const uniqueLanguages = useMemo(
    () => [...new Set(interns.flatMap((i) => (Array.isArray(i.languagesSpoken) ? i.languagesSpoken : [])).filter(Boolean))].sort(),
    [interns],
  )
  const statusFilterOptions = APPLICATION_STAGES.map((s) => s.name)

  /* ─── Filtering + sorting ─────────────────────────────────────────────── */
  const filteredInterns = useMemo(() => {
    const user = auth.currentUser
    const matchesAny = (selected, value) =>
      selected.length === 0 || selected.some((v) => (value || "").toLowerCase().includes(v.toLowerCase()))

    const rows = interns.filter((intern) => {
      if ((user && intern.internId === user.uid) || (effectiveUserId && intern.internId === effectiveUserId))
        return false
      if (hasTooManyMissingFields(intern)) return false

      // Optional stage filter driven from the pipeline above the table.
      if (stageFilter) {
        const current = updatedStages[intern.id] || intern.pipelineStage || intern.status
        if ((current || "").toLowerCase() !== stageFilter.toLowerCase()) return false
      }

      // Optional external filters passed down from the page shell.
      if (filters?.search && !intern.internName.toLowerCase().includes(filters.search.toLowerCase())) return false

      if (localFilters.name.trim() && !intern.internName.toLowerCase().includes(localFilters.name.toLowerCase().trim()))
        return false

      if ((intern.matchPercentage || 0) < localFilters.matchRange[0] || (intern.matchPercentage || 0) > localFilters.matchRange[1])
        return false
      if ((intern.bigScore || 0) < localFilters.bigScoreRange[0] || (intern.bigScore || 0) > localFilters.bigScoreRange[1])
        return false

      if (localFilters.qualification.trim()) {
        const haystack = `${intern.degree || ""} ${formatLabel(intern.field) || ""}`.toLowerCase()
        if (!haystack.includes(localFilters.qualification.toLowerCase().trim())) return false
      }

      if (localFilters.keySkills.length > 0) {
        const skills = Array.isArray(intern.technicalSkills) ? intern.technicalSkills : []
        if (!localFilters.keySkills.some((s) => skills.some((v) => v.toLowerCase() === s.toLowerCase()))) return false
      }

      const availabilityISO = toISODateOnly(intern.availabilityStart || intern.startDate)
      if (localFilters.availableFrom && (!availabilityISO || availabilityISO < localFilters.availableFrom)) return false
      if (localFilters.availableTo && (!availabilityISO || availabilityISO > localFilters.availableTo)) return false

      if (!matchesAny(localFilters.institution, intern.institution)) return false
      if (!matchesAny(localFilters.degree, intern.degree)) return false
      if (!matchesAny(localFilters.field, formatLabel(intern.field))) return false
      if (!matchesAny(localFilters.location, intern.location)) return false
      if (!matchesAny(localFilters.locationFlexibility, intern.locationFlexibility)) return false
      if (!matchesAny(localFilters.fundingProgramType, intern.fundingProgramType)) return false

      if (localFilters.languages.length > 0) {
        const langs = Array.isArray(intern.languagesSpoken) ? intern.languagesSpoken : []
        if (!localFilters.languages.some((l) => langs.some((v) => v.toLowerCase() === l.toLowerCase()))) return false
      }

      const currentStatusForFilter = updatedStages[intern.id] || intern.pipelineStage || intern.status
      if (!matchesAny(localFilters.status, currentStatusForFilter)) return false

      if (localFilters.nextStage.length > 0) {
        const nextStageName = computeNextStageName(currentStatusForFilter)
        if (!localFilters.nextStage.some((v) => (nextStageName || "").toLowerCase().includes(v.toLowerCase())))
          return false
      }

      return true
    })

    if (sortConfig?.key) {
      const accessors = {
        internName: (r) => r.internName,
        matchPercentage: (r) => r.matchPercentage || 0,
        bigScore: (r) => r.bigScore || 0,
        qualification: (r) => `${r.degree || ""} ${r.field || ""}`,
        availability: (r) => new Date(r.availabilityStart || r.startDate).getTime() || 0,
        status: (r) => updatedStages[r.id] || r.pipelineStage || r.status,
        institution: (r) => r.institution,
        degree: (r) => r.degree,
        field: (r) => r.field,
        location: (r) => r.location,
        locationFlexibility: (r) => r.locationFlexibility,
        fundingProgramType: (r) => r.fundingProgramType,
      }
      const accessor = accessors[sortConfig.key]
      if (accessor) {
        rows.sort((a, b) => {
          const av = accessor(a)
          const bv = accessor(b)
          if (typeof av === "number" && typeof bv === "number") {
            return sortConfig.dir === "asc" ? av - bv : bv - av
          }
          const cmp = (av || "").toString().localeCompare((bv || "").toString())
          return sortConfig.dir === "asc" ? cmp : -cmp
        })
      }
    }

    return rows
  }, [interns, localFilters, sortConfig, updatedStages, effectiveUserId, stageFilter, filters])

  useEffect(() => {
    if (onMatchesCountChange) onMatchesCountChange(filteredInterns.length)
  }, [filteredInterns, onMatchesCountChange])

  /* ─── Filter chrome ───────────────────────────────────────────────────── */
  const activeFilterCount =
    (localFilters.name.trim() ? 1 : 0) +
    (localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100 ? 1 : 0) +
    (localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100 ? 1 : 0) +
    (localFilters.qualification.trim() ? 1 : 0) +
    localFilters.keySkills.length +
    (localFilters.availableFrom || localFilters.availableTo ? 1 : 0) +
    localFilters.status.length +
    localFilters.institution.length +
    localFilters.degree.length +
    localFilters.field.length +
    localFilters.location.length +
    localFilters.locationFlexibility.length +
    localFilters.languages.length +
    localFilters.fundingProgramType.length +
    localFilters.nextStage.length

  const clearAllFilters = () => {
    setLocalFilters({ ...EMPTY_FILTERS })
    setSortConfig(null)
  }

  const getFilterActive = (filterType) => {
    switch (filterType) {
      case "match":
        return localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100
      case "bigScore":
        return localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100
      case "qualification":
        return !!localFilters.qualification.trim()
      case "keySkills":
        return localFilters.keySkills.length > 0
      case "availability":
        return !!localFilters.availableFrom || !!localFilters.availableTo
      case "status":
        return localFilters.status.length > 0
      case "institution":
        return localFilters.institution.length > 0
      case "degree":
        return localFilters.degree.length > 0
      case "field":
        return localFilters.field.length > 0
      case "location":
        return localFilters.location.length > 0
      case "locationFlexibility":
        return localFilters.locationFlexibility.length > 0
      case "languages":
        return localFilters.languages.length > 0
      case "fundingProgramType":
        return localFilters.fundingProgramType.length > 0
      case "nextStage":
        return localFilters.nextStage.length > 0
      default:
        return false
    }
  }

  const toggleChip = (field, value) =>
    setLocalFilters((p) => ({
      ...p,
      [field]: p[field].includes(value) ? p[field].filter((x) => x !== value) : [...p[field], value],
    }))

  /* ─── Layout: responsive collapse, pinning, offsets ───────────────────── */
  const maxPriority = viewportWidth < 640 ? 1 : viewportWidth < 1024 ? 3 : 99

  const visibleColumnKeys = useMemo(
    () => columnOrder.filter((key) => columnVisibility[key] && COLUMN_DEFS[key].priority <= maxPriority),
    [columnOrder, columnVisibility, maxPriority],
  )

  const collapsedByViewport = useMemo(
    () => columnOrder.filter((key) => columnVisibility[key] && COLUMN_DEFS[key].priority > maxPriority).length,
    [columnOrder, columnVisibility, maxPriority],
  )

  const orderedColumns = useMemo(() => {
    const left = visibleColumnKeys.filter((k) => pinned[k] === "left")
    const right = visibleColumnKeys.filter((k) => pinned[k] === "right")
    const middle = visibleColumnKeys.filter((k) => !pinned[k])
    return [...left, ...middle, ...right]
  }, [visibleColumnKeys, pinned])

  const widthOf = useCallback((key) => columnWidths[key] ?? COLUMN_DEFS[key].width, [columnWidths])

  const stickyOffsets = useMemo(() => {
    const offsets = {}
    let leftAcc = CANDIDATE_WIDTH
    orderedColumns.forEach((key) => {
      if (pinned[key] === "left") {
        offsets[key] = { side: "left", value: leftAcc }
        leftAcc += widthOf(key)
      }
    })
    // Action is no longer pinned, so right-pinned columns stick to the table
    // edge itself rather than sitting beside a frozen Action column.
    let rightAcc = 0
    ;[...orderedColumns].reverse().forEach((key) => {
      if (pinned[key] === "right") {
        offsets[key] = { side: "right", value: rightAcc }
        rightAcc += widthOf(key)
      }
    })
    return offsets
  }, [orderedColumns, pinned, widthOf])

  const totalWidth =
    CANDIDATE_WIDTH + ACTION_WIDTH + orderedColumns.reduce((sum, key) => sum + widthOf(key), 0)

  const cellPadding = density === "compact" ? "0.4rem 0.3rem" : "0.6rem 0.4rem"
  const headerPadding = density === "compact" ? "0.5rem 0.6rem" : "0.7rem 0.6rem"

  const tableCellStyle = {
    padding: cellPadding,
    borderBottom: "1px solid #e6d7c3",
    borderRight: "1px solid #e6d7c3",
    fontSize: "0.8rem",
    verticalAlign: "top",
    color: "#4a352f",
    lineHeight: "1.3",
    overflow: "hidden",
  }

  const matchContainerStyle = { display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%" }
  const progressBarStyle = { width: "60%", height: "6px", background: "#e6d7c3", borderRadius: "3px", overflow: "hidden" }
  const progressFillStyle = { height: "100%", borderRadius: "3px", transition: "width 0.3s ease" }
  const matchScoreStyle = { fontWeight: "600", color: "#4a352f", fontSize: "0.75rem" }
  const statusBadgeStyle = {
    padding: "4px 10px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: "600",
    display: "inline-block",
    textTransform: "capitalize",
  }

  const currentStageFields = getStageFields(selectedStage)

  const searchedColumns = DEFAULT_COLUMN_ORDER.filter((key) =>
    COLUMN_DEFS[key].label.toLowerCase().includes(columnSearch.toLowerCase()),
  )

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#7d5a50" }}>Loading applications...</div>
  }

  /* ─── Cell renderer ───────────────────────────────────────────────────── */
  const renderCell = (key, intern, currentStatus, statusStyle, rowBg) => {
    const offset = stickyOffsets[key]
    const stickyStyle = offset
      ? {
          position: "sticky",
          [offset.side]: `${offset.value}px`,
          zIndex: 9,
          backgroundColor: rowBg,
          boxShadow: offset.side === "left" ? "2px 0 0 #e6d7c3" : "-2px 0 0 #e6d7c3",
        }
      : {}
    const base = { ...tableCellStyle, ...stickyStyle }

    switch (key) {
      case "matchPercentage":
        return (
          <td key={key} style={base}>
            <div style={matchContainerStyle}>
              <div style={progressBarStyle}>
                <div
                  style={{
                    ...progressFillStyle,
                    width: `${intern.matchPercentage}%`,
                    background: `linear-gradient(90deg, ${
                      intern.matchPercentage > 75 ? "#48BB78" : intern.matchPercentage > 50 ? "#D69E2E" : "#E53E3E"
                    }, ${intern.matchPercentage > 75 ? "#48BB78" : intern.matchPercentage > 50 ? "#D69E2E" : "#E53E3E"}aa)`,
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span
                  style={{
                    ...matchScoreStyle,
                    color:
                      intern.matchPercentage > 75 ? "#48BB78" : intern.matchPercentage > 50 ? "#D69E2E" : "#E53E3E",
                  }}
                >
                  {intern.matchPercentage}%
                </span>
                {/* "Why this match?" sits beside Match %, not in Action */}
                <button
                  onClick={(e) => openPopupFromEvent("match", intern, e)}
                  title="Why this match?"
                  aria-label="Why this match?"
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", color: "#a67c52" }}
                >
                  <HelpCircle size={14} />
                </button>
              </div>
            </div>
          </td>
        )

      case "bigScore":
        return (
          <td key={key} style={base}>
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
                <button
                  onClick={(e) => openPopupFromEvent("bigScore", intern, e)}
                  title="View BIG score breakdown"
                  aria-label="View BIG score breakdown"
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", color: "#a67c52" }}
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>
          </td>
        )

      case "qualification": {
        const qualification = intern.degree && intern.degree !== "Not specified" ? intern.degree : null
        const field = intern.field && intern.field !== "Not specified" ? formatLabel(intern.field) : null
        return (
          <td key={key} style={base}>
            {qualification || field ? (
              <div style={{ lineHeight: "1.3" }}>
                {qualification && (
                  <div style={{ fontSize: "0.75rem", color: "#4a352f" }}>
                    <TruncatedText text={qualification} maxLength={24} />
                  </div>
                )}
                {field && <div style={{ fontSize: "0.7rem", color: "#a89482", marginTop: "1px" }}>{field}</div>}
              </div>
            ) : (
              <span style={{ color: "#a89482", fontSize: "0.75rem" }}>-</span>
            )}
          </td>
        )
      }

      case "keySkills": {
        const skills = Array.isArray(intern.technicalSkills) ? intern.technicalSkills.filter(Boolean) : []
        if (skills.length === 0) {
          return (
            <td key={key} style={base}>
              <span style={{ color: "#a89482", fontSize: "0.75rem" }}>-</span>
            </td>
          )
        }
        const shown = skills.slice(0, 3)
        const overflow = skills.length - shown.length
        return (
          <td key={key} style={base}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
              {shown.map((skill) => (
                <span
                  key={skill}
                  style={{
                    backgroundColor: "#f5f0e1",
                    color: "#4a352f",
                    padding: "1px 7px",
                    borderRadius: "9999px",
                    fontSize: "0.68rem",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {skill}
                </span>
              ))}
              {overflow > 0 && (
                <span
                  style={{ color: "#a67c52", fontSize: "0.68rem", fontWeight: 600, alignSelf: "center" }}
                  title={skills.join(", ")}
                >
                  +{overflow}
                </span>
              )}
            </div>
          </td>
        )
      }

      case "availability": {
        const display = formatAvailability(intern.availabilityStart || intern.startDate)
        return (
          <td key={key} style={base}>
            {display ? (
              <div style={{ lineHeight: "1.3" }}>
                <div style={{ fontSize: "0.75rem" }}>{display}</div>
                {intern.availableHours && (
                  <div style={{ fontSize: "0.7rem", color: "#a89482", marginTop: "1px" }}>{intern.availableHours}</div>
                )}
              </div>
            ) : (
              <span style={{ color: "#a89482", fontSize: "0.75rem" }}>-</span>
            )}
          </td>
        )
      }

      case "status":
        return (
          <td key={key} style={base}>
            <span style={{ ...statusBadgeStyle, backgroundColor: statusStyle.color, color: statusStyle.textColor }}>
              {currentStatus}
            </span>
          </td>
        )

      case "institution":
        return <td key={key} style={base}><TruncatedText text={intern.institution} maxLength={25} /></td>
      case "degree":
        return <td key={key} style={base}><TruncatedText text={intern.degree} maxLength={20} /></td>
      case "field":
        return <td key={key} style={base}><TruncatedText text={formatLabel(intern.field)} maxLength={25} /></td>
      case "location":
        return <td key={key} style={base}><TruncatedText text={intern.location} maxLength={20} /></td>
      case "locationFlexibility":
        return <td key={key} style={base}><TruncatedText text={intern.locationFlexibility} maxLength={15} /></td>
      case "languages":
        return (
          <td key={key} style={base}>
            <TruncatedText
              text={Array.isArray(intern.languagesSpoken) ? intern.languagesSpoken.join(", ") : ""}
              maxLength={22}
            />
          </td>
        )
      case "fundingProgramType":
        return <td key={key} style={base}><TruncatedText text={intern.fundingProgramType} maxLength={18} /></td>
      case "nextStage":
        return <td key={key} style={base}><NextStageIndicator currentStage={currentStatus} /></td>

      default:
        return null
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
      {/* Company member banner */}
      {isCompanyMember && (
        <div
          style={{
            backgroundColor: userRole === "viewer" ? "#fef3c7" : "#e0f2fe",
            border: `2px solid ${userRole === "viewer" ? "#f59e0b" : "#0369a1"}`,
            borderRadius: "12px",
            padding: "16px 24px",
            marginBottom: "24px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "24px" }}>🤝</span>
            <h3
              style={{
                margin: 0,
                color: userRole === "viewer" ? "#f59e0b" : "#0369a1",
                fontWeight: "700",
                fontSize: "1.1rem",
              }}
            >
              Company Internship Applications - Role: {userRole?.toUpperCase()}
            </h3>
          </div>
          <p style={{ margin: 0, color: "#4a5568", fontSize: "0.95rem", lineHeight: "1.5" }}>
            {userRole === "owner" && "You can view and manage all company internship applications."}
            {userRole === "admin" && "You can view and request interns for the company."}
            {userRole === "manager" && "You can view and update internship application stages."}
            {userRole === "employee" && "You can view company internship applications."}
            {userRole === "viewer" && "You have read-only access to company internship applications."}
          </p>
        </div>
      )}

      {/* Notification — same treatment as the SME table */}
      {notification && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium border mb-3 ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : notification.type === "warning"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 text-current opacity-50 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-[#faf7f2] rounded-t-2xl p-4 border border-[#e6d7c3] border-b-0 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-[#4a352f] m-0">Intern Matches</h2>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
              <LayoutGrid size={12} className="text-[#7d5a50] flex-shrink-0" />
              Viewing: {activeView.name}
              {activeView.description && (
                <span className="font-normal text-[#a89482]"> — {activeView.description}</span>
              )}
            </span>
            {activeFilterCount > 0 && (
              <>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#fff3e0] text-[#e65100] border border-[#e65100]/30">
                  <SlidersHorizontal size={12} /> {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                </span>
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#a67c52] hover:text-[#4a352f] hover:bg-white border border-[#e6d7c3] transition-colors"
                >
                  Clear all filters
                </button>
              </>
            )}
            {collapsedByViewport > 0 && (
              <span className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#a89482] border border-[#e6d7c3]">
                {collapsedByViewport} column{collapsedByViewport > 1 ? "s" : ""} hidden on this screen size
              </span>
            )}
          </div>

          <div className="relative">
            <button
              onClick={(e) => {
                if (showCustomizeMenu) {
                  setShowCustomizeMenu(false)
                  setCustomizeMenuRect(null)
                } else {
                  setCustomizeMenuRect(e.currentTarget.getBoundingClientRect())
                  setShowCustomizeMenu(true)
                  setShowNewViewForm(false)
                  setEditingViewMeta(null)
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm"
            >
              <SlidersHorizontal size={16} /> Customize Table{" "}
              <ChevronDown size={14} className={`transition-transform ${showCustomizeMenu ? "rotate-180" : ""}`} />
            </button>

            {showCustomizeMenu &&
              customizeMenuRect &&
              (() => {
                const panelWidth = 340
                const margin = 12
                let left = customizeMenuRect.right - panelWidth
                left = Math.min(Math.max(left, margin), window.innerWidth - panelWidth - margin)
                const spaceBelow = window.innerHeight - customizeMenuRect.bottom - margin - 8
                const spaceAbove = customizeMenuRect.top - margin - 8
                const openUpward = spaceBelow < 320 && spaceAbove > spaceBelow
                const maxHeight = Math.max(200, Math.min(640, openUpward ? spaceAbove : spaceBelow))
                const top = openUpward ? undefined : customizeMenuRect.bottom + 8
                const bottom = openUpward ? window.innerHeight - customizeMenuRect.top + 8 : undefined
                const allViews = Object.values(viewsState.views).sort((a, b) =>
                  a.builtin ? -1 : b.builtin ? 1 : a.name.localeCompare(b.name),
                )

                return (
                  <PopupPortal>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => {
                        setShowCustomizeMenu(false)
                        setCustomizeMenuRect(null)
                        setShowNewViewForm(false)
                        setEditingViewMeta(null)
                      }}
                    />
                    <div
                      className="fixed bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-5 z-50 overflow-y-auto"
                      style={{ left, width: panelWidth, top, bottom, maxHeight }}
                    >
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-1">Views</h4>
                      <p className="text-xs text-[#a89482] mb-3">
                        Edits below auto-save into whichever view is selected.
                      </p>
                      <div className="space-y-1 mb-3">
                        {allViews.map((view) => {
                          const isActive = view.id === viewsState.activeViewId
                          const isEditing = editingViewMeta?.id === view.id
                          if (isEditing) {
                            return (
                              <div key={view.id} className="p-2.5 rounded-lg border border-[#c8b6a6] bg-[#faf7f2] space-y-2">
                                {!view.builtin ? (
                                  <input
                                    autoFocus
                                    value={editingViewMeta.name}
                                    onChange={(e) => setEditingViewMeta((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="View name"
                                    className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm"
                                  />
                                ) : (
                                  <p className="text-sm font-semibold text-[#4a352f]">
                                    Default{" "}
                                    <span className="font-normal text-[#a89482] text-xs">(name can't be changed)</span>
                                  </p>
                                )}
                                <textarea
                                  value={editingViewMeta.description}
                                  onChange={(e) =>
                                    setEditingViewMeta((prev) => ({ ...prev, description: e.target.value }))
                                  }
                                  placeholder="Description (optional) — what is this view for?"
                                  rows={2}
                                  className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingViewMeta(null)}
                                    className="px-2.5 py-1 text-xs text-[#7d5a50] hover:text-[#4a352f]"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={saveViewMeta}
                                    className="px-2.5 py-1 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            )
                          }
                          return (
                            <div
                              key={view.id}
                              className={`flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg ${
                                isActive ? "bg-[#f5f0e1]" : "hover:bg-[#faf7f2]"
                              }`}
                            >
                              <button onClick={() => switchToView(view.id)} className="flex-1 text-left min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {isActive && <CheckCircle size={12} className="text-[#7d5a50] flex-shrink-0" />}
                                  <span className={`text-sm ${isActive ? "font-semibold text-[#4a352f]" : "text-[#4a352f]"}`}>
                                    {view.name}
                                  </span>
                                  {view.builtin && (
                                    <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">
                                      Built-in
                                    </span>
                                  )}
                                </div>
                                {view.description && (
                                  <p className="text-xs text-[#a89482] mt-0.5 truncate">{view.description}</p>
                                )}
                              </button>
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <button
                                  onClick={() => startEditingViewMeta(view)}
                                  title="Rename / edit description"
                                  className="text-[#a89482] hover:text-[#7d5a50] p-1"
                                >
                                  <Settings size={13} />
                                </button>
                                {!view.builtin && (
                                  <button
                                    onClick={() => removeView(view.id)}
                                    title="Delete view"
                                    className="text-[#a89482] hover:text-red-500 p-1"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {showNewViewForm ? (
                        <div className="space-y-2 mb-1">
                          <input
                            autoFocus
                            value={newViewName}
                            onChange={(e) => setNewViewName(e.target.value)}
                            placeholder="New view name..."
                            className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm"
                          />
                          <textarea
                            value={newViewDescription}
                            onChange={(e) => setNewViewDescription(e.target.value)}
                            placeholder="Description (optional) — what is this view for?"
                            rows={2}
                            className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setShowNewViewForm(false)
                                setNewViewName("")
                                setNewViewDescription("")
                              }}
                              className="px-2.5 py-1 text-xs text-[#7d5a50] hover:text-[#4a352f]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={createNewView}
                              disabled={!newViewName.trim()}
                              className="px-3 py-1.5 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold disabled:opacity-40"
                            >
                              Create view
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowNewViewForm(true)}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-[#c8b6a6] rounded-lg text-xs font-semibold text-[#7d5a50] hover:bg-[#faf7f2]"
                        >
                          <Plus size={13} /> New view from current layout
                        </button>
                      )}

                      <div className="border-t border-[#e6d7c3] my-4" />
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Columns</h4>

                      <div className="relative mb-3">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a89482] pointer-events-none" />
                        <input
                          value={columnSearch}
                          onChange={(e) => setColumnSearch(e.target.value)}
                          placeholder="Search columns..."
                          className="w-full pl-7 pr-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                        />
                      </div>

                      <p className="text-xs text-[#a89482] mb-3 flex items-center gap-1.5">
                        <GripVertical size={12} className="flex-shrink-0" /> Drag a header to reorder, drag its right
                        edge to resize.
                      </p>

                      <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                        <input type="checkbox" checked disabled className="rounded border-[#c8b6a6]" />
                        <span className="text-sm text-[#4a352f] flex-1">Candidate</span>
                        <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Pinned</span>
                      </div>
                      <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                        <input type="checkbox" checked disabled className="rounded border-[#c8b6a6]" />
                        <span className="text-sm text-[#4a352f] flex-1">Action</span>
                        <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Always last</span>
                      </div>
                      <div className="border-t border-[#e6d7c3] my-2" />

                      {searchedColumns.length === 0 && (
                        <p className="text-xs text-[#a89482] px-2 py-1.5">No columns match that search.</p>
                      )}
                      {searchedColumns.map((key) => (
                        <div key={key} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[#faf7f2]">
                          <label className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
                            <input
                              type="checkbox"
                              checked={columnVisibility[key] || false}
                              onChange={() => toggleColumn(key)}
                              className="rounded border-[#c8b6a6] text-[#7d5a50]"
                            />
                            <span className="text-sm text-[#4a352f] truncate">{COLUMN_DEFS[key].label}</span>
                          </label>
                          <button
                            onClick={() => cyclePin(key)}
                            title={
                              pinned[key] === "left"
                                ? "Pinned left — click to pin right"
                                : pinned[key] === "right"
                                  ? "Pinned right — click to unpin"
                                  : "Pin left"
                            }
                            className={`p-1 rounded flex-shrink-0 ${pinned[key] ? "text-[#7d5a50]" : "text-[#c8b6a6] hover:text-[#7d5a50]"}`}
                          >
                            {pinned[key] ? <Pin size={13} /> : <PinOff size={13} />}
                          </button>
                          <span className="text-[10px] text-[#a89482] w-7 text-right flex-shrink-0">
                            {pinned[key] === "left" ? "L" : pinned[key] === "right" ? "R" : ""}
                          </span>
                        </div>
                      ))}

                      <div className="border-t border-[#e6d7c3] my-4" />
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Density</h4>
                      <div className="flex gap-1.5">
                        {[
                          { key: "comfortable", label: "Comfortable" },
                          { key: "compact", label: "Compact" },
                        ].map((d) => (
                          <button
                            key={d.key}
                            onClick={() => setDensity(d.key)}
                            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              density === d.key ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-[#e6d7c3] my-4" />
                      <button
                        onClick={resetActiveViewToDefault}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#a67c52] hover:text-[#4a352f] hover:bg-[#faf7f2] border border-[#e6d7c3]"
                      >
                        <RotateCcw size={12} /> Reset "{activeView.name}" to factory defaults
                      </button>
                    </div>
                  </PopupPortal>
                )
              })()}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-b-2xl border border-[#e6d7c3] shadow-lg overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
          <style>{`
            /* NOTE: no 'position: relative' here. It used to override the
               sticky positioning Tailwind applies to every <th>, which is why
               the whole header row scrolled away while the pinned body cells
               stayed put. Sticky is itself a positioned ancestor, so the
               absolutely-positioned grip/resize handles still anchor fine. */
            .it-th { color: #faf7f2 !important; vertical-align: top !important; }
            .it-th-draggable { cursor: grab; }
            .it-th-draggable:active { cursor: grabbing; }
            .it-th-row { display: flex; align-items: flex-start; gap: 2px; min-width: 0; }
            /* overflow-wrap: normal stops the browser splitting inside a word,
               which is what turned "Match %" into "MAT CH.." and "Status" into
               "STA TUS" in narrow columns. */
            .it-th-label {
              flex: 1 1 auto; min-width: 0;
              display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
              overflow: hidden; white-space: normal;
              overflow-wrap: normal; word-break: normal; hyphens: none;
              line-height: 1.2; letter-spacing: 0.02em;
            }
            .it-th-tools { display: flex; align-items: center; flex-shrink: 0; }
            /* The drag grip moves out of the flex flow and only appears on
               hover, buying every header ~14px more room for its label. */
            .it-th-grip { position: absolute; left: 3px; top: 10px; opacity: 0; transition: opacity .15s; }
            .it-th:hover .it-th-grip { opacity: .45; }
            .it-resize { position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: col-resize; }
            .it-resize:hover { background: rgba(255,255,255,0.25); }
          `}</style>

          <table
            style={{
              /* separate (not collapse) — collapsed borders are dropped by
                 sticky cells, which made the pinned columns lose their edges
                 and mispaint while scrolling. */
              borderCollapse: "separate",
              borderSpacing: 0,
              background: "white",
              fontSize: "0.8rem",
              backgroundColor: "#faf7f2",
              tableLayout: "fixed",
              width: totalWidth,
              minWidth: "100%",
            }}
          >
            <thead>
              <tr>
                <th
                  className="it-th font-semibold uppercase tracking-wider text-xs sticky top-0 left-0 z-30 text-left"
                  style={{
                    backgroundColor: "#4a352f",
                    width: CANDIDATE_WIDTH,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                    boxShadow: "2px 0 0 #e6d7c3",
                  }}
                >
                  <div className="it-th-row">
                    <span className="it-th-label" title="Candidate">Candidate</span>
                    <span className="it-th-tools">
                      <SortTrigger columnKey="internName" />
                      <FilterTrigger type="name" active={!!localFilters.name.trim()} />
                    </span>
                  </div>
                </th>

                {orderedColumns.map((key) => {
                  const col = COLUMN_DEFS[key]
                  const isDragging = draggedColumn === key
                  const isDragOver = dragOverColumn === key && draggedColumn !== key
                  const offset = stickyOffsets[key]

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
                      className={`it-th it-th-draggable font-semibold uppercase tracking-wider text-xs sticky top-0 select-none transition-opacity ${
                        col.align === "center" ? "text-center" : "text-left"
                      } ${isDragging ? "opacity-40" : ""}`}
                      style={{
                        width: widthOf(key),
                        padding: headerPadding,
                        backgroundColor: isDragOver ? "#5a423b" : "#4a352f",
                        zIndex: offset ? 25 : 20,
                        borderBottom: "1px solid #e6d7c3",
                        borderRight: "1px solid #e6d7c3",
                        ...(offset
                          ? {
                              [offset.side]: `${offset.value}px`,
                              boxShadow: offset.side === "left" ? "2px 0 0 #e6d7c3" : "-2px 0 0 #e6d7c3",
                            }
                          : {}),
                      }}
                    >
                      <GripVertical size={11} className="it-th-grip" />
                      <div className={`it-th-row ${col.align === "center" ? "justify-center" : ""}`}>
                        <span className="it-th-label" title={col.label}>
                          {col.label}
                        </span>
                        <span className="it-th-tools">
                          {pinned[key] && <Pin size={10} className="opacity-60 mt-0.5" />}
                          {col.sortable && <SortTrigger columnKey={key} />}
                          <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} />
                        </span>
                      </div>
                      <div className="it-resize" onMouseDown={(e) => startResize(e, key)} onClick={(e) => e.stopPropagation()} />
                    </th>
                  )
                })}

                {/* Action scrolls horizontally with the rest of the table —
                    only `top-0` here, so it still stays put on vertical
                    scroll like every other header cell. */}
                <th
                  className="it-th text-center font-semibold uppercase tracking-wider text-xs sticky top-0 z-20"
                  style={{
                    backgroundColor: "#4a352f",
                    width: ACTION_WIDTH,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredInterns.length === 0 ? (
                <tr>
                  <td
                    colSpan={orderedColumns.length + 2}
                    style={{ ...tableCellStyle, textAlign: "center", color: "#a89482", padding: "2.5rem 1rem", borderRight: "none" }}
                  >
                    {interns.length === 0 ? "No intern matches yet." : "No candidates match these filters."}
                    {activeFilterCount > 0 && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <button
                          onClick={clearAllFilters}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7d5a50] text-white"
                        >
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredInterns.map((intern) => {
                  const currentStatus = updatedStages[intern.id] || intern.pipelineStage || intern.status
                  const statusStyle = getStatusStyle(currentStatus)
                  const actions = getRowActions(currentStatus)
                  const isSaved = !!savedMatches[intern.id]
                  const isTerminalNegative = /declined|completed/i.test(currentStatus || "")
                  const rowBg = hoveredRowKey === intern.id ? "#fdf8f4" : "#ffffff"

                  const runAction = (kind, event) => {
                    if (kind === "view") return handleViewDetails(intern)
                    if (kind === "request") return handleRequestIntern(intern)
                    if (kind === "shortlist") return handleQuickStage(intern, "Shortlisted")
                    return handleStageAction(intern, event)
                  }

                  return (
                    <tr
                      key={intern.id}
                      onMouseEnter={() => setHoveredRowKey(intern.id)}
                      onMouseLeave={() => setHoveredRowKey(null)}
                      style={{ backgroundColor: rowBg, transition: "background-color .15s" }}
                    >
                      {/* Candidate — pinned left. Name only; location and work
                          preference have their own columns. */}
                      <td
                        className="sticky left-0 z-10"
                        style={{
                          ...tableCellStyle,
                          width: CANDIDATE_WIDTH,
                          backgroundColor: rowBg,
                          borderRight: "none",
                          boxShadow: "2px 0 0 #e6d7c3",
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-[#4a352f] break-words text-sm">{intern.internName}</span>
                          <button
                            onClick={() => handleViewDetails(intern)}
                            className="text-[#a89482] hover:text-[#7d5a50] flex-shrink-0"
                            aria-label={`View details for ${intern.internName}`}
                            title="View candidate"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>

                      {orderedColumns.map((key) => renderCell(key, intern, currentStatus, statusStyle, rowBg))}

                      {/* Action — scrolls with the table, laid out like the SME table */}
                      <td
                        style={{
                          ...tableCellStyle,
                          width: ACTION_WIDTH,
                          borderRight: "none",
                          backgroundColor: rowBg,
                          textAlign: "center",
                        }}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => runAction(actions.primary.kind, e)}
                            title={actions.primary.label}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                              isTerminalNegative
                                ? "bg-[#e6d7c3]/60 text-[#a89482]"
                                : "text-white hover:shadow-md hover:brightness-105"
                            }`}
                            style={{
                              width: "118px",
                              height: "34px",
                              backgroundColor: isTerminalNegative ? undefined : "#7d5a50",
                            }}
                          >
                            {!isTerminalNegative && <ArrowRight size={13} className="flex-shrink-0" />}
                            <span className="truncate">{actions.primary.label}</span>
                          </button>

                          <button
                            onClick={() => setSavedMatches((p) => ({ ...p, [intern.id]: !p[intern.id] }))}
                            title={isSaved ? "Remove from saved" : "Save match"}
                            aria-label={isSaved ? "Remove from saved" : "Save match"}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-[#f5f0e1] flex-shrink-0"
                            style={{ color: isSaved ? "#a67c52" : "#c8b6a6" }}
                          >
                            <Bookmark size={14} fill={isSaved ? "#a67c52" : "none"} />
                          </button>

                          <button
                            onClick={(e) => openPopupFromEvent("quickActions", intern, e)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all hover:bg-[#f5f0e1] flex-shrink-0"
                            style={{ borderColor: "#7d5a5050", color: "#7d5a50" }}
                            title="More actions"
                            aria-label="More actions"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drag-to-reorder hint */}
      {dragHintRect && !draggedColumn && (
        <PopupPortal>
          <div
            className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal flex items-center gap-1.5"
            style={{
              top: dragHintRect.bottom + 8,
              left: Math.min(Math.max(dragHintRect.left, 12), window.innerWidth - 210),
              width: "200px",
            }}
          >
            <GripVertical size={12} className="flex-shrink-0" /> Drag to reorder · edge to resize
          </div>
        </PopupPortal>
      )}

      {/* Column header filter popover */}
      {headerFilterOpen && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1090]" onClick={closeHeaderFilter} />
          <div
            className="fixed z-[1091] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-4"
            style={{
              top: headerFilterOpen.rect.bottom + 8,
              left: Math.min(Math.max(headerFilterOpen.rect.left - 20, 12), window.innerWidth - 312),
              width: "300px",
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            {headerFilterOpen.type === "name" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Candidate name</label>
                  {localFilters.name && (
                    <button
                      onClick={() => setLocalFilters((p) => ({ ...p, name: "" }))}
                      className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  autoFocus
                  type="text"
                  value={localFilters.name}
                  onChange={(e) => setLocalFilters((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Search candidate name..."
                  className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
                />
              </>
            )}

            {headerFilterOpen.type === "qualification" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Qualification / Field</label>
                  {localFilters.qualification && (
                    <button
                      onClick={() => setLocalFilters((p) => ({ ...p, qualification: "" }))}
                      className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  autoFocus
                  type="text"
                  value={localFilters.qualification}
                  onChange={(e) => setLocalFilters((p) => ({ ...p, qualification: e.target.value }))}
                  placeholder="e.g. BCom, Computer Science..."
                  className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
                />
              </>
            )}

            {headerFilterOpen.type === "availability" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Available between</label>
                  {(localFilters.availableFrom || localFilters.availableTo) && (
                    <button
                      onClick={() => setLocalFilters((p) => ({ ...p, availableFrom: "", availableTo: "" }))}
                      className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={localFilters.availableFrom}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, availableFrom: e.target.value }))}
                    className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                  />
                  <span className="text-[#7d5a50] text-xs">to</span>
                  <input
                    type="date"
                    value={localFilters.availableTo}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, availableTo: e.target.value }))}
                    className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                  />
                </div>
              </>
            )}

            {["match", "bigScore"].includes(headerFilterOpen.type) &&
              (() => {
                const field = headerFilterOpen.type === "match" ? "matchRange" : "bigScoreRange"
                const label = headerFilterOpen.type === "match" ? "Match %" : "Readiness / BIG Score"
                const range = localFilters[field]
                return (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-semibold text-[#4a352f]">
                        {label}: {range[0]} - {range[1]}
                      </label>
                      {(range[0] > 0 || range[1] < 100) && (
                        <button
                          onClick={() => setLocalFilters((p) => ({ ...p, [field]: [0, 100] }))}
                          className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={range[0]}
                        onChange={(e) =>
                          setLocalFilters((p) => ({
                            ...p,
                            [field]: [Math.min(Number.parseInt(e.target.value) || 0, p[field][1]), p[field][1]],
                          }))
                        }
                        className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center"
                      />
                      <span className="text-[#7d5a50]">to</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={range[1]}
                        onChange={(e) =>
                          setLocalFilters((p) => ({
                            ...p,
                            [field]: [p[field][0], Math.max(Number.parseInt(e.target.value) || 0, p[field][0])],
                          }))
                        }
                        className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={range[0]}
                      onChange={(e) =>
                        setLocalFilters((p) => ({ ...p, [field]: [Number.parseInt(e.target.value), p[field][1]] }))
                      }
                      className="w-full accent-[#7d5a50]"
                    />
                  </>
                )
              })()}

            {[
              { type: "keySkills", field: "keySkills", label: "Key Skills", options: uniqueSkills },
              { type: "status", field: "status", label: "Status", options: statusFilterOptions },
              { type: "nextStage", field: "nextStage", label: "Next Stage", options: statusFilterOptions },
              { type: "institution", field: "institution", label: "Institution", options: institutionFilterOptions },
              { type: "degree", field: "degree", label: "Degree", options: degreeFilterOptions },
              { type: "field", field: "field", label: "Field", options: uniqueFields },
              { type: "location", field: "location", label: "Location (Province)", options: southAfricanProvinces },
              { type: "locationFlexibility", field: "locationFlexibility", label: "Work Preference", options: uniqueLocationFlex },
              { type: "languages", field: "languages", label: "Languages", options: uniqueLanguages },
              { type: "fundingProgramType", field: "fundingProgramType", label: "Funding Program", options: uniqueFundingPrograms },
            ].map(
              ({ type, field, label, options }) =>
                headerFilterOpen.type === type && (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-semibold text-[#4a352f]">{label}</label>
                      {localFilters[field].length > 0 && (
                        <button
                          onClick={() => setLocalFilters((p) => ({ ...p, [field]: [] }))}
                          className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto">
                      {options.length === 0 && <span className="text-xs text-[#a89482]">No data available</span>}
                      {options.map((value) => (
                        <button
                          key={value}
                          onClick={() => toggleChip(field, value)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            localFilters[field].includes(value)
                              ? "bg-[#7d5a50] text-white"
                              : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ),
            )}
          </div>
        </PopupPortal>
      )}

      {/* ─── Readiness / BIG Score popup ─────────────────────────────────── */}
      {activePopup?.type === "bigScore" && selectedInternForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div
            className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
            style={{
              top: activePopup.position.y,
              left: activePopup.position.x,
              width: "380px",
              maxHeight: "450px",
              overflowY: "auto",
            }}
          >
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Readiness / BIG Score</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[200px]">{selectedInternForPopup.internName}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-xl font-bold">
                    {selectedInternForPopup.bigScore}
                  </div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {[
                { key: "academic", label: "Academic", desc: "Qualification and results" },
                { key: "professionalPresentation", label: "Professional Presentation", desc: "CV and portfolio quality" },
                { key: "professionalSkills", label: "Professional Skills", desc: "Role-relevant capability" },
                { key: "workExperience", label: "Work Experience", desc: "Prior placements and projects" },
              ].map(({ key, label, desc }) => {
                const score = selectedInternForPopup.evaluationScores?.[key] || 0
                return (
                  <div key={key} className="bg-[#faf7f2] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-xs font-semibold text-[#4a352f]">{label}</span>
                        <p className="text-[10px] text-[#7d5a50]">{desc}</p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: getScoreColor(score) }}>
                        {score}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#e6d7c3] rounded-full">
                      <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: getScoreColor(score) }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </PopupPortal>
      )}

      {/* ─── Why this match? popup ───────────────────────────────────────── */}
      {activePopup?.type === "match" && selectedInternForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div
            className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
            style={{
              top: activePopup.position.y,
              left: activePopup.position.x,
              width: "380px",
              maxHeight: "460px",
              overflowY: "auto",
            }}
          >
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Why this match?</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[200px]">{selectedInternForPopup.internName}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold">{selectedInternForPopup.matchPercentage}%</div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {selectedInternForPopup.matchAnalysis?.breakdown ? (
                Object.entries(selectedInternForPopup.matchAnalysis.breakdown).map(([key, data]) => {
                  if (!data || typeof data !== "object") return null
                  const pct = data.maxScore ? Math.round((data.score / data.maxScore) * 100) : 0
                  const good = pct >= 70
                  const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())
                  return (
                    <div key={key} className="p-3 rounded-lg border border-[#e6d7c3] bg-[#faf7f2] text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-[#4a352f]">{label}</span>
                        <span className="font-bold" style={{ color: good ? "#22c55e" : pct > 0 ? "#f59e0b" : "#ef4444" }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: good ? "#22c55e" : pct > 0 ? "#f59e0b" : "#ef4444" }}
                        />
                      </div>
                      {data.description && <p className="text-[11px] text-[#7d5a50] mt-1.5">{data.description}</p>}
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-[#a89482] text-center py-4">No breakdown available for this candidate yet.</p>
              )}
            </div>
          </div>
        </PopupPortal>
      )}

      {/* ─── Quick Actions popup ─────────────────────────────────────────── */}
      {activePopup?.type === "quickActions" && selectedInternForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div
            className="fixed z-[1001] bg-white rounded-xl shadow-2xl border border-[#e6d7c3] py-1 overflow-hidden"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: "210px" }}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#e6d7c3]">
              <span className="text-xs font-semibold text-[#4a352f]">Quick Actions</span>
              <button onClick={closePopup} className="text-[#7d5a50] hover:text-[#4a352f]">
                <X size={14} />
              </button>
            </div>
            <button
              onClick={() => handleViewDetails(selectedInternForPopup)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Eye size={12} /> View Candidate
            </button>
            <button
              onClick={() => openPopup("match", selectedInternForPopup, activePopup.rect)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Target size={12} /> Why This Match?
            </button>
            <button
              onClick={() => openPopup("stage", selectedInternForPopup, activePopup.rect)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <ArrowRight size={12} /> Update Stage
            </button>
            <button
              onClick={() => {
                const target = selectedInternForPopup
                closePopup()
                handleRequestIntern(target)
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <MessageSquare size={12} /> Invite to Apply
            </button>
            <button
              onClick={() => {
                const target = selectedInternForPopup
                closePopup()
                handleQuickStage(target, "Declined")
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#D32F2F] hover:bg-[#faf7f2] text-left"
            >
              <XCircle size={12} /> Decline
            </button>
          </div>
        </PopupPortal>
      )}

      {/* ─── Stage Update popup (same layout as the SME table) ───────────── */}
      {activePopup?.type === "stage" && selectedInternForStage && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div
            className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
            style={{
              top: activePopup.position.y,
              left: activePopup.position.x,
              width: "460px",
              maxHeight: "560px",
              overflowY: "auto",
            }}
          >
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Update Stage</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[300px]">{selectedInternForStage.internName}</h3>
                </div>
                <button
                  onClick={() => {
                    closePopup()
                    resetStageForm()
                  }}
                  className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#4a352f] mb-1">Select Next Stage *</label>
                <select
                  value={selectedStage}
                  onChange={(e) => {
                    setSelectedStage(e.target.value)
                    setFormErrors((prev) => ({ ...prev, selectedStage: "" }))
                  }}
                  className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${
                    formErrors.selectedStage ? "border-red-500" : "border-[#c8b6a6]"
                  }`}
                >
                  <option value="">Choose a stage...</option>
                  {APPLICATION_STAGES.map((stage) => (
                    <option key={stage.id} value={stage.name}>
                      {stage.name}
                    </option>
                  ))}
                </select>
                {formErrors.selectedStage && <p className="text-red-500 text-xs mt-1">{formErrors.selectedStage}</p>}
              </div>

              {selectedStage && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#4a352f] mb-1">Message to Candidate *</label>
                    <textarea
                      value={stageNotes}
                      onChange={(e) => {
                        setStageNotes(e.target.value)
                        if (e.target.value.trim() && formErrors.stageNotes) {
                          setFormErrors((prev) => ({ ...prev, stageNotes: "" }))
                        }
                      }}
                      placeholder="Enter your message..."
                      rows={3}
                      className={`w-full px-3 py-2 border-2 rounded-lg text-xs resize-y ${
                        formErrors.stageNotes ? "border-red-500" : "border-[#c8b6a6]"
                      }`}
                    />
                    {formErrors.stageNotes && <p className="text-red-500 text-xs mt-1">{formErrors.stageNotes}</p>}
                  </div>

                  {currentStageFields.showMeeting && (
                    <div className="bg-[#faf7f2] rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-semibold text-[#4a352f] flex items-center gap-2">
                        <Video size={14} /> Schedule Meeting
                      </h4>
                      <div>
                        <label className="block text-xs text-[#4a352f] mb-1">Meeting Time</label>
                        <input
                          type="datetime-local"
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#4a352f] mb-1">Location *</label>
                        <input
                          type="text"
                          value={meetingLocation}
                          onChange={(e) => {
                            setMeetingLocation(e.target.value)
                            if (e.target.value.trim()) setFormErrors((prev) => ({ ...prev, meetingLocation: "" }))
                          }}
                          placeholder="Office, Virtual, etc."
                          className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${
                            formErrors.meetingLocation ? "border-red-500" : "border-[#c8b6a6]"
                          }`}
                        />
                        {formErrors.meetingLocation && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.meetingLocation}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-[#4a352f] mb-1">Purpose *</label>
                        <input
                          type="text"
                          value={meetingPurpose}
                          onChange={(e) => {
                            setMeetingPurpose(e.target.value)
                            if (e.target.value.trim()) setFormErrors((prev) => ({ ...prev, meetingPurpose: "" }))
                          }}
                          placeholder="Initial discussion, strategy review, etc."
                          className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${
                            formErrors.meetingPurpose ? "border-red-500" : "border-[#c8b6a6]"
                          }`}
                        />
                        {formErrors.meetingPurpose && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.meetingPurpose}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {currentStageFields.showInterview && (
                    <div className="bg-[#faf7f2] rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-semibold text-[#4a352f] flex items-center gap-2">
                        <Calendar size={14} /> Interview Details
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Date</label>
                          <input
                            type="date"
                            value={interviewDate}
                            onChange={(e) => setInterviewDate(e.target.value)}
                            className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Time</label>
                          <input
                            type="time"
                            value={interviewTime}
                            onChange={(e) => setInterviewTime(e.target.value)}
                            className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-[#4a352f] mb-1">Interview Location</label>
                        <input
                          type="text"
                          value={interviewLocation}
                          onChange={(e) => setInterviewLocation(e.target.value)}
                          placeholder="Meeting link or address"
                          className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {currentStageFields.showAvailability && (
                    <div className="bg-[#faf7f2] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-[#4a352f] flex items-center gap-2">
                          <Calendar size={14} /> Your Availability
                        </h4>
                        <button
                          onClick={() => setShowCalendarPopup(true)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#7d5a50] text-white rounded-lg text-xs hover:bg-[#4a352f] transition-all"
                        >
                          <Calendar size={12} /> Add Dates
                        </button>
                      </div>
                      {availabilities.length > 0 ? (
                        <div className="space-y-2 max-h-[150px] overflow-y-auto">
                          {availabilities.map((a, i) => (
                            <div key={i} className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#e6d7c3]">
                              <div>
                                <div className="text-xs font-medium text-[#4a352f]">
                                  {a.date?.toLocaleDateString?.("en-US", { weekday: "short", month: "short", day: "numeric" }) ||
                                    "N/A"}
                                </div>
                                {a.timeSlots?.[0] && (
                                  <div className="text-xs text-[#7d5a50]">
                                    {a.timeSlots[0].start} - {a.timeSlots[0].end}
                                  </div>
                                )}
                              </div>
                              <button onClick={() => removeAvailability(a.date)} className="text-red-500 hover:text-red-700 p-1">
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#7d5a50] italic">No availability added yet</p>
                      )}
                      {formErrors.availabilities && (
                        <p className="text-red-500 text-xs mt-2">{formErrors.availabilities}</p>
                      )}
                    </div>
                  )}

                  {currentStageFields.showTermSheet && (
                    <div>
                      <label className="block text-xs font-semibold text-[#4a352f] mb-1">Term Sheet (PDF/DOC) *</label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          setTermSheetFile(e.target.files[0])
                          if (e.target.files[0]) setFormErrors((prev) => ({ ...prev, termSheetFile: "" }))
                        }}
                        className={`w-full px-3 py-2 border rounded-lg text-xs ${
                          formErrors.termSheetFile ? "border-red-500" : "border-[#c8b6a6]"
                        }`}
                      />
                      {termSheetFile && <p className="text-xs text-[#7d5a50] mt-1">Selected: {termSheetFile.name}</p>}
                      {formErrors.termSheetFile && <p className="text-red-500 text-xs mt-1">{formErrors.termSheetFile}</p>}
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    closePopup()
                    resetStageForm()
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-all"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleStageUpdate}
                  disabled={isSubmitting || !selectedStage}
                  className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-xs font-medium hover:bg-[#4a352f] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Update Stage"}
                </button>
              </div>
            </div>
          </div>

          {/* Availability calendar — centred card, same as the SME table */}
          {showCalendarPopup && (
            <>
              <div className="fixed inset-0 z-[1100]" onClick={() => setShowCalendarPopup(false)} />
              <div
                className="fixed z-[1101] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-6"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "400px",
                  maxHeight: "80vh",
                  overflowY: "auto",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-[#4a352f]">Select Available Dates</h4>
                  <button onClick={() => setShowCalendarPopup(false)} className="text-[#7d5a50] hover:text-[#4a352f]">
                    <X size={18} />
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[#4a352f] mb-2">Time Slot</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="time"
                      value={timeSlot.start}
                      onChange={(e) => handleTimeChange("start", e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                    />
                    <span className="text-[#7d5a50]">to</span>
                    <input
                      type="time"
                      value={timeSlot.end}
                      onChange={(e) => handleTimeChange("end", e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[#4a352f] mb-2">Add a date</label>
                  <input
                    type="date"
                    onChange={(e) => {
                      if (!e.target.value) return
                      const picked = new Date(e.target.value)
                      setTempDates((prev) => (prev.some((d) => d.getTime() === picked.getTime()) ? prev : [...prev, picked]))
                    }}
                    className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                  />
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tempDates.map((d) => (
                      <span
                        key={d.toISOString()}
                        className="inline-flex items-center gap-1.5 bg-[#f5f0e1] text-[#4a352f] px-2.5 py-1 rounded-full text-xs"
                      >
                        {d.toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}
                        <button
                          onClick={() => setTempDates((prev) => prev.filter((x) => x.getTime() !== d.getTime()))}
                          className="text-[#a67c52] hover:text-[#4a352f]"
                          aria-label="Remove date"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[#4a352f] mb-2">Timezone</label>
                  <input
                    type="text"
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowCalendarPopup(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSelectedDates}
                    disabled={tempDates.length === 0}
                    className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-xs disabled:opacity-50"
                  >
                    Save Dates
                  </button>
                </div>
              </div>
            </>
          )}
        </PopupPortal>
      )}

      {/* Candidate details */}
      {showInternDetails && selectedInternDetails && (
        <InternDetailsModal
          intern={selectedInternDetails}
          isOpen={showInternDetails}
          onClose={() => {
            setShowInternDetails(false)
            setSelectedInternDetails(null)
          }}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}

export default InternTablePage