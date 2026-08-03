"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import {
  FileText,
  MessageCircle,
  Send,
  Check,
  X,
  Eye,
  Trophy,
  SlidersHorizontal,
  GripVertical,
  ChevronDown,
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
  Pin,
  PinOff,
  Info,
} from "lucide-react"
import { collection, getDocs, doc, getDoc, setDoc, addDoc, serverTimestamp, updateDoc } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import emailjs from "@emailjs/browser"
import { API_KEYS } from "../../API"
import { getFunctions, httpsCallable } from "firebase/functions"
/* Same business pop-up the advisor-side match table uses. Place the file
   beside this one, or adjust the path — it reads universalProfiles itself and
   imports "../../firebaseConfig", so it needs to sit at the same depth. */
import BusinessDetailsModal from "./BusinessDetailsModal"

/* ════════════════════════════════════════════════════════════════════════════
   intern-table.jsx

   Same chrome as the advisor tables: saved views, column drag / resize / pin,
   per-column header filters, sorting, density, responsive collapse, a sticky
   pinned first column and the Customize Table menu.

   Every selector here is prefixed it- (intern table) so it can share a page
   with the other match tables without their <style> blocks fighting, and the
   sticky headers declare `position: sticky !important` so a global `th` rule
   from another table's kit can't scroll them away.

   None of the data logic changed: calculateMatchScore, checkApplicationStatus,
   fetchSMes, handleConnectClick, acceptRequest, handleStageUpdate, the emails
   and the cloud-function calls are all as they were.

   Design tokens — do not introduce new ones:
     header #4a352f · header text #faf7f2 · toolbar #faf7f2 · border #e6d7c3
     border2 #c8b6a6 · chip #f5f0e1 · chip active #7d5a50 · accent #a67c52
     muted #a89482 · body text #4a352f
   ════════════════════════════════════════════════════════════════════════ */

/* Must stay identical to the strings intern-dealflow.jsx uses. */
export const INTERN_STAGE_FILTER_EVENT = "intern-stage-filter"
export const INTERN_ROWS_EVENT = "intern-rows"
export const INTERN_ROWS_REQUEST_EVENT = "intern-rows-request"

// Status definitions with color scheme
const STATUS_TYPES = {
  "New Match": { color: "#EFEBE9", textColor: "#3E2723" },
  Applied: { color: "#E3F2FD", textColor: "#1565C0" },
  Requested: { color: "#EDE7F6", textColor: "#5E35B1" },
  Matched: { color: "#E0F2F1", textColor: "#00695C" },
  Shortlisted: { color: "#E8F5E9", textColor: "#2E7D32" },
  Contacted: { color: "#FFF8E1", textColor: "#F57F17" },
  "Contacted/Interview": { color: "#FFF8E1", textColor: "#F57F17" },
  Confirmed: { color: "#E8F5E9", textColor: "#1B5E20" },
  "Confirmed/Term Sheet Sign": { color: "#E8F5E9", textColor: "#1B5E20" },
  Accepted: { color: "#E0F2F1", textColor: "#00695C" },
  "Contract Signed": { color: "#E8F5E8", textColor: "#388E3C" },
  Active: { color: "#E8F5E8", textColor: "#388E3C" },
  Completed: { color: "#F5F0E1", textColor: "#7D5A50" },
  Declined: { color: "#FFEBEE", textColor: "#C62828" },
}

const getStatusStyle = (status) => STATUS_TYPES[status] || { color: "#F5F5F5", textColor: "#616161" }

/* Match % and any other score bar is coloured by value, not by brand — the
   same thresholds the advisor and SME match tables use, so a 42% reads red
   everywhere in the product. */
const getScoreColor = (score) => {
  if (score > 75) return "#48BB78"
  if (score > 50) return "#D69E2E"
  return "#E53E3E"
}

/* ─── Shared primitives ─────────────────────────────────────────────────── */

const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

/* ─── Column header info tooltip ──────────────────────────────────────────
   Portaled to <body> because the header cell is sticky and would otherwise
   clip the bubble. */
const HeaderInfoTooltip = ({ text }) => {
  const [rect, setRect] = useState(null)
  if (!text) return null
  return (
    <span
      onMouseEnter={(e) => setRect(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setRect(null)}
      className="inline-flex"
    >
      <Info size={12} style={{ color: "#d9c7b8" }} className="opacity-80 hover:opacity-100" />
      {rect && (
        <PopupPortal>
          <div
            className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal"
            style={{
              top: rect.bottom + 8,
              left: Math.min(Math.max(rect.left - 90, 12), window.innerWidth - 232),
              width: "220px",
            }}
          >
            {text}
          </div>
        </PopupPortal>
      )}
    </span>
  )
}

const TruncatedText = ({ text, maxLength = 25 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span style={{ color: "#a89482", fontSize: "0.75rem" }}>{text || "-"}</span>
  }

  const value = text.toString()
  const shouldTruncate = value.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? value : `${value.slice(0, maxLength)}...`

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

const toDateSafe = (value) => {
  if (!value || value === "-" || value === "TBD" || value === "unspecified") return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value?.toDate === "function") return value.toDate()
  if (value?.seconds != null) return new Date(value.seconds * 1000)
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const toISODateOnly = (value) => {
  const d = toDateSafe(value)
  if (!d) return ""
  return d.toISOString().slice(0, 10)
}

const formatDateValue = (value) => {
  const d = toDateSafe(value)
  if (!d) return null
  return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
}

// Match calculation function
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
    const provinceMatch = internProvinces.some(
      (province) => province.toLowerCase() === sponsorProvince.toLowerCase(),
    )
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

const checkApplicationStatus = async (userId, sponsorId) => {
  try {
    const docId = `${sponsorId}_${userId}`
    const applicationDoc = await getDoc(doc(db, "internshipApplications", docId))

    if (applicationDoc.exists()) {
      const appData = applicationDoc.data()
      const status = appData.status || "Applied"

      // Normalize status - treat both "Applied" and "Requested" as applied
      const normalizedStatus = status === "Applied" ? "Applied" : status === "Requested" ? "Requested" : status

      return {
        status: normalizedStatus,
        exists: true,
        data: appData,
      }
    }
    return {
      status: "New Match",
      exists: false,
      data: null,
    }
  } catch (error) {
    console.warn(`Could not fetch application status for ${sponsorId}_${userId}:`, error)
    return {
      status: "New Match",
      exists: false,
      data: null,
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

/* ════════════════════════════════════════════════════════════════════════════
   Column configuration.

   Business Name is the pinned first column and Action the last, so neither
   appears here — but both resize like everything else, via the reserved width
   keys below. Widths are generous: each header carries a grip, a sort control,
   a filter control and an info icon (~75px of chrome).
   ════════════════════════════════════════════════════════════════════════ */
const COLUMN_DEFS = {
  location: { label: "Location", width: 152, filterType: "location", visible: true, priority: 2, sortable: true, tooltip: "Where the business is based." },
  sector: { label: "Sector", width: 158, filterType: "sector", visible: true, priority: 3, sortable: true, tooltip: "The industry the business trades in." },
  operationStage: { label: "Stage", width: 150, filterType: "operationStage", visible: true, priority: 3, sortable: true, tooltip: "How established the business is — startup, growth, established and so on." },
  internshipRole: { label: "Role", width: 210, filterType: "internshipRole", visible: true, priority: 2, sortable: true, tooltip: "The internship role on offer. Press Brief to read the full description." },
  stipend: { label: "Stipend", width: 150, filterType: "stipend", visible: true, priority: 3, sortable: true, tooltip: "What the internship pays, where the business has published it." },
  startDate: { label: "Start Date", width: 152, filterType: "startDate", visible: true, priority: 3, sortable: true, tooltip: "When the internship begins. TBD means the business hasn't set a date yet." },
  matchPercentage: { label: "Match %", align: "center", width: 150, filterType: "matchPercentage", visible: true, priority: 1, sortable: true, tooltip: "How well this internship fits your profile — skills, work mode, location and availability. Click the score for the full breakdown." },
  status: { label: "Status", width: 158, filterType: "status", visible: true, priority: 1, sortable: true, tooltip: "Where you stand with this business, from New Match through to Accepted or Declined." },

  ratingRecommendation: { label: "Rating", width: 152, filterType: "ratingRecommendation", visible: false, priority: 4, sortable: true, tooltip: "Any rating or recommendation recorded for this placement." },
}

const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS)
const DEFAULT_COLUMN_VISIBILITY = Object.fromEntries(
  DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].visible !== false]),
)
const DEFAULT_COLUMN_WIDTHS = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].width]))
const DEFAULT_PINNED = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, null]))
const DEFAULT_DENSITY = "comfortable"

/* Business Name and Action can't be hidden or reordered, so they aren't in
   COLUMN_DEFS — but they resize like everything else, and their widths live
   under these reserved keys inside the same columnWidths map. */
const SMSE_KEY = "__smse__"
const ACTION_KEY = "__action__"
const FIXED_WIDTHS = { [SMSE_KEY]: 230, [ACTION_KEY]: 190 }
const MIN_COLUMN_WIDTH = 84

/* Every filter is a list of selected values, so the header popovers can offer
   what is actually in the table rather than a blank search box. */
const EMPTY_FILTERS = {
  name: [],
  location: [],
  sector: [],
  operationStage: [],
  internshipRole: [],
  stipend: [],
  startFrom: "",
  startTo: "",
  matchRange: [0, 100],
  status: [],
  ratingRecommendation: [],
}

/* ─── Saved views + filter persistence ──────────────────────────────────── */
const BUILTIN_VIEW_ID = "__default__"
// v2: the fixed columns now store their widths in this map too, so a v1 view
// would leave them undefined.
const VIEWS_STORAGE_KEY = "intern-matches-views-v2"
// v2: every text filter became a multi-select array.
const FILTERS_STORAGE_KEY = "intern-matches-filters-v2"

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
  columnWidths: { ...DEFAULT_COLUMN_WIDTHS, ...FIXED_WIDTHS },
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
  columnWidths: { ...DEFAULT_COLUMN_WIDTHS, ...FIXED_WIDTHS, ...(view?.columnWidths || {}) },
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
    const merged = { ...EMPTY_FILTERS, ...(saved?.filters || {}) }
    // A value stored by an older build as a string would blow up .includes.
    Object.keys(EMPTY_FILTERS).forEach((key) => {
      if (Array.isArray(EMPTY_FILTERS[key]) && !Array.isArray(merged[key])) {
        merged[key] = merged[key] ? [merged[key].toString()] : []
      }
    })
    return { filters: merged, sort: saved?.sort?.key ? saved.sort : null }
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

/* ════════════════════════════════════════════════════════════════════════════
   InternTable
   ════════════════════════════════════════════════════════════════════════ */
export function InternTable({ interns = [], stageFilter: stageFilterProp = null, onRefresh, onCountChange }) {
  const [showModal, setShowModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showBriefModal, setShowBriefModal] = useState(false)
  const [selectedIntern, setSelectedIntern] = useState(null)
  const [messageText, setMessageText] = useState("")
  const [statuses, setStatuses] = useState({})
  const [notification, setNotification] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [programSponsors, setProgramSponsors] = useState([])
  const [showMatchBreakdown, setShowMatchBreakdown] = useState(false)
  const [showStageModal, setShowStageModal] = useState(false)
  const [nextStage, setNextStage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hoveredRow, setHoveredRow] = useState(null)

  // Stage filter coming from the pipeline (prop or window event)
  const [eventStageFilter, setEventStageFilter] = useState(null)
  const stageFilter = stageFilterProp ?? eventStageFilter

  // Filters + sort, restored from the last visit
  const initialFilterState = useMemo(() => loadFilterState(), [])
  const [localFilters, setLocalFilters] = useState(initialFilterState.filters)
  const [sortConfig, setSortConfig] = useState(initialFilterState.sort)
  const [headerFilterOpen, setHeaderFilterOpen] = useState(null)
  const [chipSearch, setChipSearch] = useState("")

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
  const [resizingColumn, setResizingColumn] = useState(null)

  // Viewport, for responsive column collapse
  const [viewportWidth, setViewportWidth] = useState(typeof window === "undefined" ? 1440 : window.innerWidth)
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const isMountedRef = useRef(false)
  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]

  const handleViewMatchBreakdown = (intern) => {
    setSelectedIntern(intern)
    setShowMatchBreakdown(true)
  }

  const resetStageModal = () => {
    setSelectedIntern(null)
    setShowStageModal(false)
    setNextStage("")
    setMessageText("")
  }

  useEffect(() => {
    setMounted(true)
    isMountedRef.current = true
    fetchSMes()
    return () => {
      setMounted(false)
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Pipeline → table filtering */
  useEffect(() => {
    if (typeof window === "undefined") return undefined
    const onStageFilter = (e) => setEventStageFilter(e.detail || null)
    window.addEventListener(INTERN_STAGE_FILTER_EVENT, onStageFilter)
    return () => window.removeEventListener(INTERN_STAGE_FILTER_EVENT, onStageFilter)
  }, [])

  /* ─── View + filter persistence ─────────────────────────────────────── */
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
    setTimeout(() => setNotification(null), 3000)
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
    setTimeout(() => setNotification(null), 3000)
  }

  const resetActiveViewToDefault = () => {
    const layout = createDefaultViewLayout()
    setColumnVisibility(layout.columnVisibility)
    setColumnOrder(layout.columnOrder)
    setColumnWidths(layout.columnWidths)
    setPinned(layout.pinned)
    setDensity(layout.density)
    setNotification({ type: "success", message: `"${activeView.name}" reset to factory defaults` })
    setTimeout(() => setNotification(null), 3000)
  }

  const toggleColumn = (key) => setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }))

  const cyclePin = (key) =>
    setPinned((prev) => ({
      ...prev,
      [key]: prev[key] === "left" ? "right" : prev[key] === "right" ? null : "left",
    }))

  /* ─── Drag to reorder ───────────────────────────────────────────────── */
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

  /* ─── Widths + resize ───────────────────────────────────────────────────
     widthOf is declared here, above startResize, because startResize calls it —
     a const referenced before its initializer throws at render. It covers the
     reorderable columns *and* the two fixed ones, so every column in the table
     can be dragged wider. */
  const widthOf = useCallback(
    (key) => columnWidths[key] ?? COLUMN_DEFS[key]?.width ?? FIXED_WIDTHS[key] ?? 140,
    [columnWidths],
  )

  const startResize = (e, key) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = widthOf(key)
    resizingRef.current = key
    setResizingColumn(key)

    const onMove = (ev) => {
      const next = Math.max(MIN_COLUMN_WIDTH, startWidth + (ev.clientX - startX))
      setColumnWidths((prev) => ({ ...prev, [key]: next }))
    }
    const onUp = () => {
      resizingRef.current = null
      setResizingColumn(null)
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

  // Double-click a divider to put that column back to its default width.
  const resetColumnWidth = (key) =>
    setColumnWidths((prev) => ({
      ...prev,
      [key]: COLUMN_DEFS[key]?.width ?? FIXED_WIDTHS[key] ?? 140,
    }))

  const ColumnResizer = ({ colKey }) => (
    <div
      className="it-resize"
      onMouseDown={(e) => startResize(e, colKey)}
      onDoubleClick={(e) => {
        e.stopPropagation()
        resetColumnWidth(colKey)
      }}
      onClick={(e) => e.stopPropagation()}
      onDragStart={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      title="Drag to resize · double-click to reset"
      style={{ background: resizingColumn === colKey ? "rgba(255,255,255,0.35)" : undefined }}
    />
  )

  /* ─── Header filter + sort ──────────────────────────────────────────── */
  const openHeaderFilter = (type, event) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    setChipSearch("")
    setHeaderFilterOpen((prev) => (prev?.type === type ? null : { type, rect }))
  }
  const closeHeaderFilter = () => {
    setHeaderFilterOpen(null)
    setChipSearch("")
  }

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
        {isActive ? sortConfig.dir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} /> : <ArrowUpDown size={11} />}
      </button>
    )
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
            const hasRelevantData =
              overview.registeredName ||
              overview.organizationName ||
              programs.length > 0 ||
              Object.keys(matchPrefs).length > 0

            if (!hasRelevantData) {
              return []
            }

            // Check application status for this sponsor
            const applicationStatusData = await checkApplicationStatus(userId, sponsorId)

            // Calculate match result with breakdown
            const matchResult = calculateMatchScore(userData, AppData)

            // If no programs, create one entry with default values
            if (programs.length === 0) {
              return [
                {
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
                      "Team collaboration abilities",
                    ],
                    responsibilities: ApplicationOverview.keyTasks || [
                      "Support daily operations",
                      "Participate in projects",
                      "Learn industry best practices",
                      "Contribute to team initiatives",
                    ],
                    benefits: ApplicationOverview.learningOutcomes || [
                      "Professional development",
                      "Mentorship opportunities",
                      "Industry exposure",
                      "Networking opportunities",
                    ],
                    applicationProcess:
                      formData.applicationBrief?.applicationProcess ||
                      "Submit application through our portal. Successful candidates will be contacted for interviews.",
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
                  notes: [],
                },
              ]
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
                    "Team collaboration abilities",
                  ],
                  responsibilities: program.responsibilities || [
                    "Support program activities",
                    "Participate in training sessions",
                    "Assist with project implementation",
                    "Contribute to program objectives",
                  ],
                  benefits: program.benefits || [
                    "Professional development",
                    "Mentorship from experienced professionals",
                    "Industry-specific training",
                    "Certificate of completion",
                  ],
                  applicationProcess:
                    program.applicationProcess ||
                    formData.applicationBrief?.applicationProcess ||
                    "Submit application through our portal. Shortlisted candidates will be invited for interviews.",
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
                notes: [],
              }
            })
          } catch (docError) {
            console.log(`Error processing document ${docSnap.id}:`, docError)
            return [] // Return empty array for failed documents
          }
        }),
      )

      // Flatten the array and filter out empty arrays
      const flattenedSponsors = sponsors.flat().filter((sponsor) => sponsor && Object.keys(sponsor).length > 0)

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

  // Use program sponsors data if available, otherwise fallback to passed-in rows
  const displayData = programSponsors.length > 0 ? programSponsors : interns.length > 0 ? interns : []

  /* A row's live status: the optimistic value written by an action wins over
     the one fetched at load, so the Action cell updates the moment you apply. */
  const statusOf = useCallback((intern) => statuses[intern.id] || intern.status, [statuses])

  /* ─── Filtering + sorting ───────────────────────────────────────────── */
  const filteredInterns = useMemo(() => {
    const f = localFilters
    const matchesAny = (selected, value) =>
      !selected?.length || selected.some((v) => (value || "").toString().toLowerCase().includes(v.toLowerCase()))

    const rows = displayData.filter((intern) => {
      const status = statusOf(intern)

      if (stageFilter && status !== stageFilter) return false
      if (!matchesAny(f.name, intern.smseName)) return false
      if (!matchesAny(f.location, intern.location)) return false
      if (!matchesAny(f.sector, intern.sector)) return false
      if (!matchesAny(f.operationStage, intern.operationStage)) return false
      if (!matchesAny(f.internshipRole, intern.internshipRole)) return false
      if (!matchesAny(f.stipend, intern.stipend)) return false
      if (f.status.length > 0 && !f.status.includes(status)) return false
      if (!matchesAny(f.ratingRecommendation, intern.ratingRecommendation)) return false

      const iso = toISODateOnly(intern.startDate)
      if (f.startFrom && (!iso || iso < f.startFrom)) return false
      if (f.startTo && (!iso || iso > f.startTo)) return false

      const match = intern.matchPercentage || 0
      if (match < f.matchRange[0] || match > f.matchRange[1]) return false

      return true
    })

    if (sortConfig?.key) {
      const accessors = {
        name: (r) => r.smseName,
        location: (r) => r.location,
        sector: (r) => r.sector,
        operationStage: (r) => r.operationStage,
        internshipRole: (r) => r.internshipRole,
        stipend: (r) => r.stipend,
        startDate: (r) => toDateSafe(r.startDate)?.getTime() ?? 0,
        matchPercentage: (r) => r.matchPercentage || 0,
        status: (r) => statusOf(r),
        ratingRecommendation: (r) => r.ratingRecommendation,
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
  }, [displayData, localFilters, sortConfig, stageFilter, statusOf])

  useEffect(() => {
    if (onCountChange) onCountChange(filteredInterns.length)
  }, [filteredInterns, onCountChange])

  /* Broadcast every row (unfiltered) so the pipeline cards and this table can
     never disagree. Also answer a request from a pipeline that mounted first. */
  useEffect(() => {
    if (typeof window === "undefined") return undefined
    const payload = displayData.map((r) => ({ id: r.id, status: statusOf(r) }))
    const broadcast = () => window.dispatchEvent(new CustomEvent(INTERN_ROWS_EVENT, { detail: payload }))
    if (displayData.length > 0) broadcast()
    window.addEventListener(INTERN_ROWS_REQUEST_EVENT, broadcast)
    return () => window.removeEventListener(INTERN_ROWS_REQUEST_EVENT, broadcast)
  }, [displayData, statusOf])

  /* ─── Filter options + chrome ─────────────────────────────────────────
     Every filter offers the values actually present in the table, so you pick
     from what exists rather than guessing at a search box. */
  const uniqueOf = useCallback(
    (accessor) => [...new Set(displayData.map(accessor).filter((v) => v && v !== "-" && v !== "Not specified"))].sort(),
    [displayData],
  )
  const nameOptions = useMemo(() => uniqueOf((d) => d.smseName), [uniqueOf])
  const locationOptions = useMemo(() => uniqueOf((d) => d.location), [uniqueOf])
  const sectorOptions = useMemo(() => uniqueOf((d) => d.sector), [uniqueOf])
  const stageOptions = useMemo(() => uniqueOf((d) => d.operationStage), [uniqueOf])
  const roleOptions = useMemo(() => uniqueOf((d) => d.internshipRole), [uniqueOf])
  const stipendOptions = useMemo(() => uniqueOf((d) => d.stipend), [uniqueOf])
  const ratingOptions = useMemo(() => uniqueOf((d) => d.ratingRecommendation), [uniqueOf])
  const statusOptions = useMemo(() => {
    const found = [...new Set(displayData.map((d) => statusOf(d)).filter(Boolean))].sort()
    return found.length > 0 ? found : Object.keys(STATUS_TYPES)
  }, [displayData, statusOf])

  const f = localFilters
  const activeFilterCount =
    f.name.length +
    f.location.length +
    f.sector.length +
    f.operationStage.length +
    f.internshipRole.length +
    f.stipend.length +
    (f.startFrom || f.startTo ? 1 : 0) +
    (f.matchRange[0] > 0 || f.matchRange[1] < 100 ? 1 : 0) +
    f.status.length +
    f.ratingRecommendation.length

  const clearAllFilters = () => {
    setLocalFilters({ ...EMPTY_FILTERS })
    setSortConfig(null)
  }

  const getFilterActive = (type) => {
    switch (type) {
      case "startDate":
        return !!f.startFrom || !!f.startTo
      case "matchPercentage":
        return f.matchRange[0] > 0 || f.matchRange[1] < 100
      default:
        return Array.isArray(f[type]) && f[type].length > 0
    }
  }

  const toggleChip = (field, value) =>
    setLocalFilters((p) => ({
      ...p,
      [field]: p[field].includes(value) ? p[field].filter((x) => x !== value) : [...p[field], value],
    }))

  /* ─── Layout: responsive collapse, pinning, offsets ─────────────────── */
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

  const smseWidth = widthOf(SMSE_KEY)
  const actionWidth = widthOf(ACTION_KEY)

  const stickyOffsets = useMemo(() => {
    const offsets = {}
    // Left-pinned columns stack to the right of the frozen Business Name column.
    let leftAcc = smseWidth
    orderedColumns.forEach((key) => {
      if (pinned[key] === "left") {
        offsets[key] = { side: "left", value: leftAcc }
        leftAcc += widthOf(key)
      }
    })
    // Action is not pinned, so right-pinned columns stick to the table edge.
    let rightAcc = 0
    ;[...orderedColumns].reverse().forEach((key) => {
      if (pinned[key] === "right") {
        offsets[key] = { side: "right", value: rightAcc }
        rightAcc += widthOf(key)
      }
    })
    return offsets
  }, [orderedColumns, pinned, widthOf, smseWidth])

  const totalWidth = smseWidth + actionWidth + orderedColumns.reduce((sum, key) => sum + widthOf(key), 0)

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

  /* Copied from the other match tables so the score column reads identically
     across the product. */
  const matchContainerStyle = { display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%" }
  const progressBarStyle = { width: "60%", height: "6px", background: "#e6d7c3", borderRadius: "3px", overflow: "hidden" }
  const progressFillStyle = { height: "100%", borderRadius: "3px", transition: "width 0.3s ease" }
  const matchScoreStyle = { fontWeight: "600", color: "#4a352f", fontSize: "0.75rem" }

  const searchedColumns = DEFAULT_COLUMN_ORDER.filter((key) =>
    COLUMN_DEFS[key].label.toLowerCase().includes(columnSearch.toLowerCase()),
  )

  /* ═══════════════════════════════════════════════════════════════════════
     Actions — unchanged behaviour
     ═══════════════════════════════════════════════════════════════════════ */

  const handleConnectClick = async (intern) => {
    try {
      const user = auth.currentUser
      if (!user) {
        setNotification({ type: "error", message: "User not authenticated. Please log in." })
        return
      }

      console.log("Starting application submission for:", intern.smseName)
      console.log("User ID:", user.uid)

      // Get user profile data
      let userData = {}
      try {
        const userDoc = await getDoc(doc(db, "internProfiles", user.uid))
        userData = userDoc.exists() ? userDoc.data() : {}
      } catch (userError) {
        console.warn("Could not retrieve user profile:", userError)
      }

      // Get sponsor data
      let sponsorData = {}
      try {
        const sponsorDoc = await getDoc(doc(db, "internApplications", intern.originalSponsorId))
        sponsorData = sponsorDoc.exists() ? sponsorDoc.data() : {}
      } catch (sponsorError) {
        console.warn("Could not retrieve sponsor profile:", sponsorError)
      }

      // Fetch evaluation scores
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
        const evaluationDoc = await getDoc(doc(db, "internEvaluations", user.uid))
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

      // Build application ID
      const internId = user.uid
      const sponsorId = intern.originalSponsorId || intern.id.split("_")[0] || intern.id
      const applicationDocId = `${sponsorId}_${internId}`

      // Get user details
      const userFormData = userData.formData || {}
      const userProfile = userData.entityOverview || {}

      // Calculate match score
      const matchResult = calculateMatchScore(userData, sponsorData)

      // Build application data
      const applicationData = {
        applicantId: internId,
        applicantName: userFormData.personalOverview?.fullName || "Anonymous",
        applicantEmail: user.email || userFormData.personalOverview?.email || "Not provided",
        institution: userFormData.academicOverview?.institution || userProfile.organizationName || "Not Provided",
        degree: userFormData.academicOverview?.degree || userFormData.studyLevel || "Not Provided",
        field: userFormData.academicOverview?.fieldOfStudy || userFormData.sector || "Not Provided",
        locationFlexibility:
          userFormData.academicOverview?.locationFlexibility || userFormData.locationFlexibility || "Not Provided",
        technicalSkills: userFormData.skillsInterests?.technicalSkills || [],
        availabilityStart: userFormData.skillsInterests?.availabilityStart || "Not specified",
        provinces: userFormData.personalOverview?.provinces || [],
        cities: userFormData.personalOverview?.cities || [],
        sponsorId: sponsorId,
        sponsorName: intern.smseName,
        location: intern.location || "N/A",
        type: "Internship",
        role: intern.internshipRole || "N/A",
        sector: intern.sector || "N/A",
        funding: intern.stipend === "Pro-Bono" || intern.stipend === "not specified" ? "No" : "Yes",
        fundType: intern.stipend || "not specified",
        startDate: intern.startDate || "TBD",
        appliedDate: new Date().toISOString(),
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
          matchSummary: {
            strongPoints: [],
            weakPoints: [],
            recommendations: [],
            overallAssessment:
              matchResult.score >= 80
                ? "Excellent Match"
                : matchResult.score >= 60
                  ? "Good Match"
                  : matchResult.score >= 40
                    ? "Fair Match"
                    : "Poor Match",
          },
        },
        status: "Applied",
        action: intern.action || "Send Application",
        rating: intern.ratingRecommendation || "Pending",
        submittedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        applicationVersion: "2.1",
      }

      // Build match summary
      const breakdown = matchResult.breakdown
      const strongPoints = []
      const weakPoints = []
      const recommendations = []

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

      if (evaluationScores.bigInternScore >= 70) {
        strongPoints.push("High overall evaluation score")
      } else if (evaluationScores.bigInternScore >= 50) {
        strongPoints.push("Good evaluation score")
      } else if (evaluationScores.bigInternScore > 0) {
        weakPoints.push("Lower evaluation score")
        recommendations.push("Consider highlighting achievements and growth potential")
      }

      applicationData.matchAnalysis.matchSummary.strongPoints = strongPoints
      applicationData.matchAnalysis.matchSummary.weakPoints = weakPoints
      applicationData.matchAnalysis.matchSummary.recommendations = recommendations

      // Save to Firestore
      await setDoc(doc(db, "internshipApplications", applicationDocId), applicationData, { merge: true })
      console.log("Application successfully saved to Firestore")

      // Update UI state
      setStatuses((prev) => ({ ...prev, [intern.id]: "Applied" }))

      // ==========================================
      // GET INTERN NAME FOR MESSAGES
      // ==========================================

      let internName = user.displayName || "Intern"
      try {
        const internProfileRef = doc(db, "internProfiles", user.uid)
        const internProfileSnap = await getDoc(internProfileRef)
        if (internProfileSnap.exists()) {
          const profileData = internProfileSnap.data()
          const formData = profileData.formData || {}
          const personalOverview = formData.personalOverview || {}
          internName = personalOverview.fullName || user.displayName || "Intern"
        }
      } catch (error) {
        console.error("Error fetching intern profile:", error)
      }

      // ==========================================
      // SEND IN-APP MESSAGES
      // ==========================================

      // 1. Message to sponsor (SME)
      try {
        await addDoc(collection(db, "messages"), {
          to: sponsorId,
          toName: intern.smseName || "Sponsor",
          from: "system",
          fromName: "BIG Marketplace",
          subject: `📋 New Application: ${intern.internshipRole}`,
          content:
            `Dear ${intern.smseName},\n\n` +
            `You have received a new internship application from ${internName}.\n\n` +
            `📧 Contact: ${applicationData.applicantEmail}\n\n` +
            `Application Details:\n` +
            `- Role: ${intern.internshipRole}\n` +
            `- Match Score: ${applicationData.matchAnalysis?.overallScore || 0}%\n` +
            `- Institution: ${applicationData.institution}\n` +
            `- Field of Study: ${applicationData.field}\n` +
            `- Availability: ${applicationData.availabilityStart}\n\n` +
            `Match Analysis Summary:\n` +
            `- Overall Assessment: ${applicationData.matchAnalysis.matchSummary.overallAssessment}\n` +
            `- Strong Points: ${applicationData.matchAnalysis.matchSummary.strongPoints.join(", ") || "None"}\n\n` +
            `Please get back to the intern once you have made a decision.`,
          date: new Date().toISOString(),
          read: false,
          type: "inbox",
          applicationId: applicationDocId,
          linkTo: "/sponsor/applications",
        })
        console.log("✅ In-app message sent to sponsor")
      } catch (error) {
        console.warn("Could not send in-app message to sponsor:", error)
      }

      // 2. Confirmation message to intern (applicant)
      try {
        await addDoc(collection(db, "messages"), {
          to: user.uid,
          toName: internName,
          from: "system",
          fromName: "BIG Marketplace",
          subject: `✅ Application Submitted: ${intern.internshipRole}`,
          content:
            `Dear ${internName},\n\n` +
            `Your application for "${intern.internshipRole}" at ${intern.smseName} has been submitted successfully.\n\n` +
            `Application Details:\n` +
            `- Role: ${intern.internshipRole}\n` +
            `- Sponsor: ${intern.smseName}\n` +
            `- Match Score: ${applicationData.matchAnalysis?.overallScore || 0}%\n` +
            `- Institution: ${applicationData.institution}\n` +
            `- Field of Study: ${applicationData.field}\n` +
            `- Availability: ${applicationData.availabilityStart}\n\n` +
            `Match Analysis Summary:\n` +
            `- Overall Assessment: ${applicationData.matchAnalysis.matchSummary.overallAssessment}\n` +
            `- Strong Points: ${applicationData.matchAnalysis.matchSummary.strongPoints.join(", ") || "None"}\n\n` +
            `The sponsor will review your application and contact you.`,
          date: new Date().toISOString(),
          read: false,
          type: "inbox",
          applicationId: applicationDocId,
          linkTo: "/intern/applications",
        })
        console.log("✅ In-app confirmation sent to intern")
      } catch (error) {
        console.warn("Could not send in-app confirmation to intern:", error)
      }

      // ==========================================
      // SEND EMAIL NOTIFICATIONS
      // ==========================================

      // 1. Email to sponsor (SME)
      try {
        const functions = getFunctions()
        const sendInternApplicationEmail = httpsCallable(functions, "internSendApplicationEmail")

        let sponsorEmail = null
        try {
          const sponsorProfileRef = doc(db, "universalProfiles", sponsorId)
          const sponsorProfileSnap = await getDoc(sponsorProfileRef)
          if (sponsorProfileSnap.exists()) {
            const profileData = sponsorProfileSnap.data()
            sponsorEmail =
              profileData.email ||
              profileData.contactDetails?.email ||
              profileData.contactEmail ||
              profileData.businessEmail ||
              profileData.personalEmail
          }
        } catch (fetchError) {
          console.error("Error fetching sponsor email:", fetchError)
        }

        if (sponsorEmail) {
          const emailMessage =
            `Dear ${intern.smseName},\n\n` +
            `You have received a new internship application from ${applicationData.applicantName}.\n\n` +
            `📧 Contact: ${applicationData.applicantEmail}\n\n` +
            `Application Details:\n` +
            `- Role: ${intern.internshipRole}\n` +
            `- Match Score: ${applicationData.matchAnalysis.overallScore}%\n` +
            `- Institution: ${applicationData.institution}\n` +
            `- Field of Study: ${applicationData.field}\n` +
            `- Availability: ${applicationData.availabilityStart}\n\n` +
            `Match Analysis Summary:\n` +
            `- Overall Assessment: ${applicationData.matchAnalysis.matchSummary.overallAssessment}\n` +
            `- Strong Points: ${applicationData.matchAnalysis.matchSummary.strongPoints.join(", ") || "None"}\n\n` +
            `Please log in to review the full application.\n\n` +
            `Best regards,\nBIG Marketplace Africa Internship Team`

          await sendInternApplicationEmail({
            sponsorEmail: sponsorEmail,
            sponsorName: intern.smseName || "Sponsor",
            applicantName: applicationData.applicantName,
            applicantEmail: user.email,
            role: intern.internshipRole,
            matchScore: applicationData.matchAnalysis.overallScore,
            applicationId: applicationDocId,
            applicationLink: `https://www.bigmarketplace.africa/applications/${applicationDocId}`,
            message: emailMessage,
          })
          console.log("✅ Application email sent to sponsor:", sponsorEmail)
        }
      } catch (emailError) {
        console.error("❌ Application email to sponsor failed:", emailError)
      }

      // 2. Confirmation email to intern (applicant)
      try {
        const functions = getFunctions()
        const sendApplicationConfirmation = httpsCallable(functions, "internSendApplicationConfirmation")

        await sendApplicationConfirmation({
          to: user.email,
          name: applicationData.applicantName,
          sponsorName: intern.smseName || "Sponsor",
          role: intern.internshipRole,
          applicationDate: new Date().toISOString(),
          applicationId: applicationDocId,
          linkTo: "https://www.bigmarketplace.africa/intern/applications",
        })
        console.log("✅ Confirmation email sent to intern:", user.email)
      } catch (emailError) {
        console.error("❌ Confirmation email to intern failed:", emailError)
      }

      // ==========================================
      // DISPATCH NOTIFICATION
      // ==========================================

      const dispatchNotification = () => {
        const notificationMessage = `New application from ${internName} for ${intern.internshipRole}!`
        const event = new CustomEvent("newNotification", {
          detail: {
            message: notificationMessage,
            type: "success",
            timestamp: new Date().toISOString(),
            recipientId: sponsorId,
          },
          bubbles: true,
          cancelable: true,
          composed: true,
        })
        setTimeout(() => {
          window.dispatchEvent(event)
        }, 100)
      }
      dispatchNotification()

      onRefresh?.()

      setNotification({
        type: "success",
        message: `Application successfully submitted to ${intern.smseName}!`,
      })
      setTimeout(() => setNotification(null), 4000)
    } catch (error) {
      console.error("Detailed error in handleConnectClick:", error)
      console.error("Error code:", error.code)
      console.error("Error message:", error.message)

      let errorMessage = "Failed to submit application."
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

  const acceptRequest = async (intern) => {
    try {
      const user = auth.currentUser
      if (!user) {
        setNotification({ type: "error", message: "User not authenticated. Please log in." })
        return
      }

      const internId = user.uid
      const sponsorId = intern.originalSponsorId || intern.id.split("_")[0]
      const applicationDocId = `${sponsorId}_${internId}`

      console.log("Accepting request for application:", applicationDocId)

      // Update the application status to "Accepted"
      await setDoc(
        doc(db, "internshipApplications", applicationDocId),
        {
          status: "Accepted",
          acceptedDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        },
        { merge: true },
      )

      // Update UI state
      setStatuses((prev) => ({ ...prev, [intern.id]: "Accepted" }))

      // Send acceptance email
      await sendAcceptanceEmail(intern, user)

      // Notify the sponsor/SME
      const dispatchNotification = () => {
        const notificationMessage = `Your internship request has been accepted by ${user.displayName || "an intern"}!`
        console.log("Dispatching sponsor notification:", notificationMessage)

        const event = new CustomEvent("newNotification", {
          detail: {
            message: notificationMessage,
            type: "success",
            timestamp: new Date().toISOString(),
            recipientId: sponsorId,
            applicationId: applicationDocId,
          },
          bubbles: true,
          cancelable: true,
          composed: true,
        })

        setTimeout(() => {
          window.dispatchEvent(event)
          console.log("Sponsor notification event dispatched")
        }, 100)
      }

      dispatchNotification()

      onRefresh?.()

      // Show success notification to intern
      setNotification({
        type: "success",
        message: `Request accepted! ${intern.smseName} has been notified.`,
      })
      setTimeout(() => setNotification(null), 4000)
    } catch (error) {
      console.error("Error accepting request:", error)

      let errorMessage = "Failed to accept request."
      if (error.code === "permission-denied") {
        errorMessage = "Permission denied. Please check your account permissions."
      } else if (error.code === "unavailable") {
        errorMessage = "Service temporarily unavailable. Please try again."
      }

      setNotification({ type: "error", message: errorMessage })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  const sendAcceptanceEmail = async (intern, user) => {
    try {
      console.log("🔄 Sending acceptance email...")

      const emailjsConfig = {
        serviceId: API_KEYS.SERVICE_ID_MESSAGES,
        templateId: API_KEYS.TEMPLATE_ID_MESSAGES,
        publicKey: API_KEYS.PUBLIC_KEY_ID_MESSAGES,
      }

      if (!window.emailjs) {
        emailjs.init(emailjsConfig.publicKey)
        window.emailjs = emailjs
      }

      const internName = user?.displayName || "Intern"
      const sponsorName = intern.smseName

      // Get sponsor email
      let sponsorEmail = null
      try {
        const sponsorProfileRef = doc(db, "universalProfiles", intern.originalSponsorId)
        const sponsorProfileSnap = await getDoc(sponsorProfileRef)

        if (sponsorProfileSnap.exists()) {
          const profileData = sponsorProfileSnap.data()
          sponsorEmail =
            profileData.email ||
            profileData.contactDetails?.email ||
            profileData.contactEmail ||
            profileData.businessEmail ||
            profileData.personalEmail
        }
      } catch (fetchError) {
        console.error("Error fetching sponsor email:", fetchError)
      }

      if (!sponsorEmail) {
        sponsorEmail = "support@bigmarketplace.africa"
      }

      const emailMessage =
        `Dear ${sponsorName},\n\n` +
        `We are pleased to inform you that your internship request has been accepted by ${internName}!\n\n` +
        `Internship Details:\n` +
        `- Role: ${intern.internshipRole}\n` +
        `- Intern: ${internName}\n` +
        `- Status: Accepted\n\n` +
        `Next Steps:\n` +
        `1. Please log in to your dashboard to view the intern's profile\n` +
        `2. Schedule an introductory meeting\n` +
        `3. Discuss project details and expectations\n\n` +
        `You can contact ${internName} directly through the messaging system in your dashboard.\n\n` +
        `Best regards,\nBIG Marketplace Africa Internship Team`

      const templateParams = {
        to_email: sponsorEmail,
        subject: `Internship Request Accepted: ${internName}`,
        from_name: "BIG Marketplace Africa",
        date: new Date().toLocaleDateString(),
        message: emailMessage,
        portal_url: `https://www.bigmarketplace.africa/applications/${intern.originalSponsorId}_${user.uid}`,
        has_attachments: "false",
        attachments_count: "0",
      }

      console.log("📨 Sending acceptance email...")

      await window.emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        templateParams,
        emailjsConfig.publicKey,
      )

      console.log("✅ Acceptance email sent successfully!")
    } catch (emailError) {
      console.error("❌ Acceptance email failed:", emailError)
      // Don't throw error - acceptance should still proceed
    }
  }

  const handleStageUpdate = async () => {
    if (!nextStage) {
      setNotification({ type: "error", message: "Please select a stage" })
      return
    }

    setIsSubmitting(true)
    try {
      const user = auth.currentUser
      if (!user) throw new Error("User not authenticated")

      const internId = user.uid
      const sponsorId = selectedIntern.originalSponsorId

      console.log("Updating status for application:", {
        internId,
        sponsorId,
        nextStage,
      })

      const updateData = {
        status: nextStage,
        updatedAt: serverTimestamp(),
        ...(messageText && { lastMessage: messageText }),
      }

      const applicationDocId = `${sponsorId}_${internId}`
      const docRef = doc(db, "internshipApplications", applicationDocId)

      const docSnapshot = await getDoc(docRef)
      if (!docSnapshot.exists()) {
        throw new Error(`Application document does not exist`)
      }

      await updateDoc(docRef, updateData)

      // Update UI state
      setStatuses((prev) => ({ ...prev, [selectedIntern.id]: nextStage }))

      // Send stage update email
      await sendStageUpdateEmail(selectedIntern, user, nextStage, messageText)

      onRefresh?.()

      setNotification({
        type: "success",
        message: `Application status updated to ${nextStage} successfully`,
      })

      setShowStageModal(false)
      resetStageModal()
    } catch (error) {
      console.error("Error updating stage:", error)
      setNotification({
        type: "error",
        message: `Failed to update status: ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const sendStageUpdateEmail = async (intern, user, stage, message) => {
    try {
      console.log("🔄 Sending stage update email...")

      const emailjsConfig = {
        serviceId: API_KEYS.SERVICE_ID_MESSAGES,
        templateId: API_KEYS.TEMPLATE_ID_MESSAGES,
        publicKey: API_KEYS.PUBLIC_KEY_ID_MESSAGES,
      }

      if (!window.emailjs) {
        emailjs.init(emailjsConfig.publicKey)
        window.emailjs = emailjs
      }

      const internName = user?.displayName || "Intern"
      const sponsorName = intern.smseName

      // Get sponsor email
      let sponsorEmail = null
      try {
        const sponsorProfileRef = doc(db, "universalProfiles", intern.originalSponsorId)
        const sponsorProfileSnap = await getDoc(sponsorProfileRef)

        if (sponsorProfileSnap.exists()) {
          const profileData = sponsorProfileSnap.data()
          sponsorEmail =
            profileData.email ||
            profileData.contactDetails?.email ||
            profileData.contactEmail ||
            profileData.businessEmail ||
            profileData.personalEmail
        }
      } catch (fetchError) {
        console.error("Error fetching sponsor email:", fetchError)
      }

      if (!sponsorEmail) {
        sponsorEmail = "support@bigmarketplace.africa"
      }

      let emailMessage = `Dear ${sponsorName},\n\n`

      if (stage === "Declined") {
        emailMessage += `We regret to inform you that the internship application has been moved to the "${stage}" stage.\n\n`
      } else {
        emailMessage += `The internship application has progressed to the "${stage}" stage.\n\n`
      }

      if (message) {
        emailMessage += `Message from ${internName}:\n${message}\n\n`
      }

      emailMessage += `Application Details:\n`
      emailMessage += `- Role: ${intern.internshipRole}\n`
      emailMessage += `- Intern: ${internName}\n`
      emailMessage += `- Current Stage: ${stage}\n\n`

      emailMessage += `Please log in to your dashboard for more details.\n\n`
      emailMessage += `Best regards,\nBIG Marketplace Africa Internship Team`

      const templateParams = {
        to_email: sponsorEmail,
        subject: `Internship Application Update: ${stage} Stage`,
        from_name: "BIG Marketplace Africa",
        date: new Date().toLocaleDateString(),
        message: emailMessage,
        portal_url: `https://www.bigmarketplace.africa/applications/${intern.originalSponsorId}_${user.uid}`,
        has_attachments: "false",
        attachments_count: "0",
      }

      console.log("📨 Sending stage update email...")

      await window.emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        templateParams,
        emailjsConfig.publicKey,
      )

      console.log("✅ Stage update email sent successfully!")
    } catch (emailError) {
      console.error("❌ Stage update email failed:", emailError)
    }
  }

  const handleSendInternMessage = async () => {
    if (!selectedIntern || !messageText.trim()) return

    const user = auth.currentUser
    if (!user) {
      setNotification({ type: "error", message: "User not authenticated" })
      return
    }

    let sponsorId
    let internId
    let subject
    let content

    try {
      internId = user.uid
      sponsorId = selectedIntern.originalSponsorId || selectedIntern.id.split("_")[0]

      subject = `Message regarding Internship Application at ${selectedIntern.smseName}`
      content = messageText.trim()

      // Get intern name
      let internName = user.displayName || "Intern"
      try {
        const internProfileRef = doc(db, "internProfiles", user.uid)
        const internProfileSnap = await getDoc(internProfileRef)
        if (internProfileSnap.exists()) {
          const profileData = internProfileSnap.data()
          const formData = profileData.formData || {}
          const personalOverview = formData.personalOverview || {}
          internName = personalOverview.fullName || user.displayName || "Intern"
        }
      } catch (error) {
        console.error("Error fetching intern profile:", error)
      }

      const basePayload = {
        to: sponsorId,
        toName: selectedIntern.smseName,
        from: internId,
        fromName: internName,
        subject,
        content,
        date: new Date().toISOString(),
        applicationId: `${sponsorId}_${internId}`,
        read: false,
        attachments: [],
      }

      await Promise.all([
        addDoc(collection(db, "messages"), { ...basePayload, type: "inbox" }),
        addDoc(collection(db, "messages"), { ...basePayload, type: "sent", read: true }),
      ])

      // Send email notification
      await sendMessageEmail(selectedIntern, user, content)

      setNotification({
        type: "success",
        message: `Message sent to ${selectedIntern.smseName}`,
      })

      setShowMessageModal(false)
      setMessageText("")
    } catch (error) {
      console.error("Error sending message:", error)
      setNotification({ type: "error", message: "Failed to send message" })
    }
  }

  const sendMessageEmail = async (intern, user, message) => {
    try {
      console.log("🔄 Sending message email via Cloud Function...")

      const functions = getFunctions()
      const sendInternMessageEmail = httpsCallable(functions, "internSendMessageEmail")

      // Get intern name from internProfiles
      let internName = "Intern"
      let internEmail = user?.email || "No email provided"

      try {
        const internProfileRef = doc(db, "internProfiles", user.uid)
        const internProfileSnap = await getDoc(internProfileRef)
        if (internProfileSnap.exists()) {
          const profileData = internProfileSnap.data()
          const formData = profileData.formData || {}
          const personalOverview = formData.personalOverview || {}
          internName = personalOverview.fullName || "Intern"
          internEmail = personalOverview.email || user?.email || "No email provided"
        }
      } catch (error) {
        console.error("Error fetching intern profile:", error)
      }

      const sponsorName = intern.smseName

      // Get sponsor email
      let sponsorEmail = null
      try {
        const sponsorProfileRef = doc(db, "universalProfiles", intern.originalSponsorId)
        const sponsorProfileSnap = await getDoc(sponsorProfileRef)

        if (sponsorProfileSnap.exists()) {
          const profileData = sponsorProfileSnap.data()
          sponsorEmail =
            profileData.email ||
            profileData.contactDetails?.email ||
            profileData.contactEmail ||
            profileData.businessEmail ||
            profileData.personalEmail
        }
      } catch (fetchError) {
        console.error("Error fetching sponsor email:", fetchError)
      }

      if (!sponsorEmail) {
        console.warn("⚠️ No sponsor email found, using fallback")
        sponsorEmail = "support@bigmarketplace.africa"
      }

      await sendInternMessageEmail({
        to: sponsorEmail,
        name: sponsorName,
        internName: internName,
        internEmail: internEmail,
        message: message,
        role: intern.internshipRole,
        applicationId: intern.id,
        dashboardLink: "https://www.bigmarketplace.africa/messages",
      })

      console.log("✅ Message email sent to sponsor:", sponsorEmail)
    } catch (emailError) {
      console.error("❌ Message email failed:", emailError)
    }
  }

  const handleViewDetails = (intern) => {
    setSelectedIntern(intern)
    setShowModal(true)
  }

  const handleMessage = (intern) => {
    setSelectedIntern(intern)
    setMessageText("")
    setShowMessageModal(true)
  }

  const handleViewBrief = (intern) => {
    setSelectedIntern(intern)
    setShowBriefModal(true)
  }

  const handleSendMessage = () => {
    if (messageText.trim()) {
      handleSendInternMessage()
    }
  }

  const closeAllModals = () => {
    setShowModal(false)
    setShowMessageModal(false)
    setShowBriefModal(false)
    setShowMatchBreakdown(false)
    setShowStageModal(false)
    setSelectedIntern(null)
  }

  /* ─── Cells ─────────────────────────────────────────────────────────── */
  const renderCell = (key, intern, rowBg) => {
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
    const style = { ...tableCellStyle, ...stickyStyle }

    switch (key) {
      case "sector":
        return (
          <td key={key} style={style}>
            <span className="inline-block px-2 py-0.5 rounded-full bg-[#f5f0e1] text-[#4a352f] text-[10px] font-medium">
              {intern.sector || "-"}
            </span>
          </td>
        )

      case "internshipRole":
        return (
          <td key={key} style={style}>
            <TruncatedText text={intern.internshipRole} maxLength={26} />
            <button
              onClick={() => handleViewBrief(intern)}
              className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#7d5a50] border border-[#c8b6a6] hover:bg-[#f5f0e1] transition-colors"
              title="Read the internship brief"
            >
              Brief
            </button>
          </td>
        )

      case "stipend":
        return (
          <td key={key} style={style}>
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
              style={
                intern.stipend === "not specified" || intern.stipend === "Pro-Bono"
                  ? { backgroundColor: "#f5f0e1", color: "#a89482" }
                  : { backgroundColor: "#E8F5E8", color: "#388E3C" }
              }
            >
              {intern.stipend}
            </span>
          </td>
        )

      case "startDate":
        return (
          <td key={key} style={style}>
            {formatDateValue(intern.startDate) || <span className="text-[#a89482]">{intern.startDate || "-"}</span>}
          </td>
        )

      case "matchPercentage": {
        const pct = intern.matchPercentage || 0
        const scoreColor = getScoreColor(pct)
        return (
          <td key={key} style={style}>
            <div style={matchContainerStyle}>
              <div style={progressBarStyle}>
                <div
                  style={{
                    ...progressFillStyle,
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}aa)`,
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ ...matchScoreStyle, color: scoreColor }}>{pct}%</span>
                <button
                  onClick={() => handleViewMatchBreakdown(intern)}
                  title="View match breakdown"
                  aria-label="View match breakdown"
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", color: "#a67c52" }}
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>
          </td>
        )
      }

      case "status": {
        const status = statusOf(intern)
        const s = getStatusStyle(status)
        return (
          <td key={key} style={style}>
            <span
              className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap capitalize"
              style={{ backgroundColor: s.color, color: s.textColor }}
            >
              {status}
            </span>
          </td>
        )
      }

      default:
        return (
          <td key={key} style={style}>
            <TruncatedText text={intern[key]} maxLength={24} />
          </td>
        )
    }
  }

  const renderActionCell = (intern, rowBg) => {
    const currentStatus = statusOf(intern)
    const btn =
      "w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis transition-all"

    let control
    if (currentStatus === "Confirmed" || currentStatus === "Confirmed/Term Sheet Sign") {
      control = (
        <span className="inline-flex items-center justify-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#E8F5E9] text-[#1B5E20]">
          <Check size={12} /> Confirmed
        </span>
      )
    } else if (currentStatus === "Contacted" || currentStatus === "Contacted/Interview") {
      control = (
        <span className="inline-flex items-center justify-center w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#FFF8E1] text-[#F57F17]">
          Contacted
        </span>
      )
    } else if (currentStatus === "Applied" || currentStatus === "Accepted") {
      control = (
        <span className="inline-flex items-center justify-center w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#E3F2FD] text-[#1565C0]">
          Application sent
        </span>
      )
    } else if (currentStatus === "Requested") {
      control = (
        <button onClick={() => acceptRequest(intern)} className={`${btn} text-white bg-[#7d5a50] hover:brightness-105`}>
          Accept request
        </button>
      )
    } else {
      control = (
        <button
          onClick={() => handleConnectClick(intern)}
          className={`${btn} text-white bg-[#7d5a50] hover:brightness-105`}
        >
          {intern.action || "Send Application"}
        </button>
      )
    }

    return (
      <td
        style={{
          ...tableCellStyle,
          width: actionWidth,
          borderRight: "none",
          backgroundColor: rowBg,
          textAlign: "center",
        }}
      >
        <div className="flex flex-col gap-1.5">
          {control}
          <button
            onClick={() => handleMessage(intern)}
            className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#7d5a50] border border-[#c8b6a6] hover:bg-[#f5f0e1] transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <MessageCircle size={12} /> Message
          </button>
        </div>
      </td>
    )
  }

  if (loading) {
    return <div className="p-10 text-center text-[#7d5a50] text-sm">Loading program sponsors...</div>
  }

  /* Every chip-list filter is driven by this one array. */
  const FILTER_OPTION_SETS = [
    { type: "name", label: "Business name", options: nameOptions },
    { type: "location", label: "Location", options: locationOptions },
    { type: "sector", label: "Sector", options: sectorOptions },
    { type: "operationStage", label: "Stage", options: stageOptions },
    { type: "internshipRole", label: "Role", options: roleOptions },
    { type: "stipend", label: "Stipend", options: stipendOptions },
    { type: "status", label: "Status", options: statusOptions },
    { type: "ratingRecommendation", label: "Rating", options: ratingOptions },
  ]

  /* ═══════════════════════════════════════════════════════════════════════
     Render

     The root carries no font class on purpose. It used to be `font-sans`,
     which pinned this table to Tailwind's own stack while every other match
     table inherited the app font — that is what made this one look different.
     maxWidth/overflowX match the other tables so a wide table scrolls inside
     its own container instead of stretching the page.
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
      {/* Inline banner */}
      {notification && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium border mb-3 ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : notification.type === "error"
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-[#faf7f2] text-[#4a352f] border-[#e6d7c3]"
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
            <h2 className="text-lg font-bold text-[#4a352f] m-0">My Matches</h2>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
              <LayoutGrid size={12} className="text-[#7d5a50] flex-shrink-0" />
              Viewing: {activeView.name}
              {activeView.description && <span className="font-normal text-[#a89482]"> — {activeView.description}</span>}
            </span>
            {stageFilter && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#a67c52]/10 text-[#7d5a50] border border-[#a67c52]/40">
                Stage: {stageFilter}
              </span>
            )}
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
                      <p className="text-xs text-[#a89482] mb-3">Edits below auto-save into whichever view is selected.</p>
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
                                    Default <span className="font-normal text-[#a89482] text-xs">(name can't be changed)</span>
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
                              className={`flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg ${isActive ? "bg-[#f5f0e1]" : "hover:bg-[#faf7f2]"}`}
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
                                {view.description && <p className="text-xs text-[#a89482] mt-0.5 truncate">{view.description}</p>}
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
                        <GripVertical size={12} className="flex-shrink-0" /> Drag a header to reorder, drag its right edge to
                        resize. Every column resizes, including the pinned ones.
                      </p>

                      <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                        <input type="checkbox" checked disabled className="rounded border-[#c8b6a6]" />
                        <span className="text-sm text-[#4a352f] flex-1">Business Name</span>
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
            /* 'position: sticky !important' wins even when another table's kit
               puts a global 'position: relative' on every th. Sticky is itself
               a positioned ancestor, so the absolutely placed grip and resize
               handle still anchor correctly. Prefix is it- (intern table). */
            .it-th { position: sticky !important; color: #faf7f2 !important; vertical-align: top !important; }
            .it-th-draggable { cursor: grab; }
            .it-th-draggable:active { cursor: grabbing; }
            .it-th-row { display: flex; align-items: flex-start; gap: 2px; min-width: 0; }
            /* overflow-wrap: normal stops the browser splitting inside a word. */
            .it-th-label {
              flex: 1 1 auto; min-width: 0;
              display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
              overflow: hidden; white-space: normal;
              overflow-wrap: normal; word-break: normal; hyphens: none;
              line-height: 1.2; letter-spacing: 0.02em;
            }
            .it-th-tools { display: flex; align-items: center; flex-shrink: 0; }
            /* The drag grip leaves the flex flow and only appears on hover,
               buying every header ~14px more room for its label. */
            .it-th-grip { position: absolute; left: 3px; top: 10px; opacity: 0; transition: opacity .15s; }
            .it-th:hover .it-th-grip { opacity: .45; }
            .it-resize { position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: col-resize; z-index: 5; }
            .it-resize:hover { background: rgba(255,255,255,0.25); }
          `}</style>

          <table
            style={{
              /* separate (not collapse) — collapsed borders are dropped by
                 sticky cells, which makes the pinned column lose its edge. */
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
                  className="it-th font-semibold uppercase tracking-wider text-xs top-0 left-0 z-30 text-left"
                  style={{
                    backgroundColor: "#4a352f",
                    width: smseWidth,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                    boxShadow: "2px 0 0 #e6d7c3",
                  }}
                >
                  <div className="it-th-row">
                    <span className="it-th-label" title="Business Name">
                      Business Name
                    </span>
                    <span className="it-th-tools">
                      <SortTrigger columnKey="name" />
                      <FilterTrigger type="name" active={localFilters.name.length > 0} />
                      <HeaderInfoTooltip text="The business offering the internship. Click the name to open its full details." />
                    </span>
                  </div>
                  <ColumnResizer colKey={SMSE_KEY} />
                </th>

                {orderedColumns.map((key) => {
                  const col = COLUMN_DEFS[key]
                  const isDragging = draggedColumn === key
                  const isDragOver = dragOverColumn === key && draggedColumn !== key
                  const offset = stickyOffsets[key]

                  return (
                    <th
                      key={key}
                      draggable={!resizingColumn}
                      onDragStart={(e) => handleColumnDragStart(e, key)}
                      onDragOver={(e) => handleColumnDragOver(e, key)}
                      onDrop={(e) => handleColumnDrop(e, key)}
                      onDragEnd={handleColumnDragEnd}
                      onMouseEnter={(e) => setDragHintRect(e.currentTarget.getBoundingClientRect())}
                      onMouseLeave={() => setDragHintRect(null)}
                      className={`it-th it-th-draggable font-semibold uppercase tracking-wider text-xs top-0 select-none transition-opacity ${
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
                          {col.filterType && <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} />}
                          <HeaderInfoTooltip text={col.tooltip} />
                        </span>
                      </div>
                      <ColumnResizer colKey={key} />
                    </th>
                  )
                })}

                {/* Action scrolls horizontally with the table — only top-0, so
                    it still holds position on vertical scroll. */}
                <th
                  className="it-th text-center font-semibold uppercase tracking-wider text-xs top-0 z-20"
                  style={{
                    backgroundColor: "#4a352f",
                    width: actionWidth,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                  }}
                >
                  <div className="it-th-row justify-center">
                    <span className="it-th-label">Action</span>
                    <HeaderInfoTooltip text="Apply to this internship, accept a request the business sent you, or message them a question." />
                  </div>
                  <ColumnResizer colKey={ACTION_KEY} />
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredInterns.length === 0 ? (
                <tr>
                  <td
                    colSpan={orderedColumns.length + 2}
                    style={{ ...tableCellStyle, textAlign: "center", padding: "3rem 1rem", borderRight: "none" }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-[#f5f0e1] flex items-center justify-center">
                        <Trophy size={26} className="text-[#7d5a50] opacity-50" />
                      </div>
                      <p className="text-sm font-semibold text-[#4a352f] m-0">
                        {displayData.length === 0 ? "No matches yet" : "No matches fit these filters"}
                      </p>
                      <p className="text-xs text-[#a89482] m-0 max-w-md">
                        {displayData.length === 0
                          ? "Sponsors that publish an internship appear here with their location, sector and how well they match your profile."
                          : "Clear a filter to widen the results."}
                      </p>
                      {(activeFilterCount > 0 || stageFilter) && displayData.length > 0 && (
                        <button
                          onClick={clearAllFilters}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7d5a50] text-white"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInterns.map((intern) => {
                  const rowBg = hoveredRow === intern.id ? "#fdf8f4" : "#ffffff"

                  return (
                    <tr
                      key={intern.id}
                      onMouseEnter={() => setHoveredRow(intern.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ backgroundColor: rowBg, transition: "background-color .15s" }}
                    >
                      {/* Business Name — pinned left, location underneath. */}
                      <td
                        className="sticky left-0 z-10"
                        style={{
                          ...tableCellStyle,
                          width: smseWidth,
                          backgroundColor: rowBg,
                          borderRight: "none",
                          boxShadow: "2px 0 0 #e6d7c3",
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-[#f5f0e1] text-[#7d5a50] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {(intern.smseName || "?").charAt(0)}
                          </div>
                          <button
                            onClick={() => handleViewDetails(intern)}
                            className="font-medium text-[#4a352f] break-words text-sm text-left hover:text-[#7d5a50]"
                          >
                            {intern.smseName}
                          </button>
                          <Eye
                            size={13}
                            className="text-[#a89482] hover:text-[#7d5a50] flex-shrink-0 cursor-pointer"
                            onClick={() => handleViewDetails(intern)}
                          />
                        </div>
                        {intern.location && intern.location !== "N/A" && (
                          <div className="text-[10px] text-[#a89482] mt-0.5 pl-7">{intern.location}</div>
                        )}
                      </td>

                      {orderedColumns.map((key) => renderCell(key, intern, rowBg))}

                      {renderActionCell(intern, rowBg)}
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
            {headerFilterOpen.type === "startDate" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Start date</label>
                  {(localFilters.startFrom || localFilters.startTo) && (
                    <button
                      onClick={() => setLocalFilters((p) => ({ ...p, startFrom: "", startTo: "" }))}
                      className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={localFilters.startFrom}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, startFrom: e.target.value }))}
                    className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                  />
                  <span className="text-[#7d5a50] text-xs">to</span>
                  <input
                    type="date"
                    value={localFilters.startTo}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, startTo: e.target.value }))}
                    className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                  />
                </div>
                <p className="text-[10px] text-[#a89482] mt-2">Rows with a start date of "TBD" are hidden while this filter is on.</p>
              </>
            )}

            {headerFilterOpen.type === "matchPercentage" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">
                    Match %: {localFilters.matchRange[0]} - {localFilters.matchRange[1]}
                  </label>
                  {(localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100) && (
                    <button
                      onClick={() => setLocalFilters((p) => ({ ...p, matchRange: [0, 100] }))}
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
                    value={localFilters.matchRange[0]}
                    onChange={(e) =>
                      setLocalFilters((p) => ({
                        ...p,
                        matchRange: [Math.min(Number.parseInt(e.target.value, 10) || 0, p.matchRange[1]), p.matchRange[1]],
                      }))
                    }
                    className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center"
                  />
                  <span className="text-[#7d5a50]">to</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localFilters.matchRange[1]}
                    onChange={(e) =>
                      setLocalFilters((p) => ({
                        ...p,
                        matchRange: [p.matchRange[0], Math.max(Number.parseInt(e.target.value, 10) || 0, p.matchRange[0])],
                      }))
                    }
                    className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localFilters.matchRange[0]}
                  onChange={(e) =>
                    setLocalFilters((p) => ({ ...p, matchRange: [Number.parseInt(e.target.value, 10), p.matchRange[1]] }))
                  }
                  className="w-full accent-[#7d5a50]"
                />
              </>
            )}

            {/* Every other filter is a chip list of the values actually in the
                table, with a search box appearing only once the list is long
                enough to need one. */}
            {FILTER_OPTION_SETS.map(({ type, label, options }) => {
              if (headerFilterOpen.type !== type) return null
              const shown = options.filter((o) => o.toString().toLowerCase().includes(chipSearch.toLowerCase()))
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#4a352f]">{label}</label>
                    {localFilters[type].length > 0 && (
                      <button
                        onClick={() => setLocalFilters((p) => ({ ...p, [type]: [] }))}
                        className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {options.length > 8 && (
                    <div className="relative mb-2">
                      <Search
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a89482] pointer-events-none"
                      />
                      <input
                        autoFocus
                        value={chipSearch}
                        onChange={(e) => setChipSearch(e.target.value)}
                        placeholder={`Search ${label.toLowerCase()}...`}
                        className="w-full pl-7 pr-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto">
                    {shown.length === 0 && (
                      <span className="text-xs text-[#a89482]">
                        {options.length === 0 ? "No data available" : "Nothing matches that search."}
                      </span>
                    )}
                    {shown.map((value) => (
                      <button
                        key={value}
                        onClick={() => toggleChip(type, value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          localFilters[type].includes(value)
                            ? "bg-[#7d5a50] text-white"
                            : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </PopupPortal>
      )}

      {/* Stage Update Modal */}
      {mounted &&
        showStageModal &&
        selectedIntern &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center z-[1000] p-4"
            style={{ backgroundColor: "rgba(62,39,35,0.85)", backdropFilter: "blur(4px)" }}
            onClick={resetStageModal}
          >
            <div
              className="bg-white rounded-2xl max-w-[520px] w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white flex items-center justify-between">
                <h3 className="text-sm font-bold m-0">Update application stage</h3>
                <button onClick={resetStageModal} className="text-white/70 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">Next stage</label>
                  <select
                    value={nextStage}
                    onChange={(e) => setNextStage(e.target.value)}
                    className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm bg-white text-[#4a352f]"
                  >
                    <option value="">Choose a stage...</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">Message to sponsor</label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={4}
                    placeholder="Enter your message..."
                    className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm resize-y"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 p-6 border-t border-[#e6d7c3]">
                <button
                  onClick={resetStageModal}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-[#7d5a50] border border-[#c8b6a6] hover:bg-[#f5f0e1]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStageUpdate}
                  disabled={isSubmitting || !nextStage}
                  className="px-5 py-2 rounded-lg bg-[#7d5a50] text-white text-sm font-semibold disabled:opacity-40"
                >
                  {isSubmitting ? "Updating..." : "Update stage"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Brief Description Modal */}
      {mounted &&
        showBriefModal &&
        selectedIntern &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center z-[1000] p-4"
            style={{ backgroundColor: "rgba(62,39,35,0.85)", backdropFilter: "blur(4px)" }}
            onClick={closeAllModals}
          >
            <div
              className="bg-white rounded-2xl max-w-[820px] w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex items-center gap-2">
                    <FileText size={20} className="text-[#f5f0e1] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Internship brief</p>
                      <h3 className="text-sm font-bold mt-0.5 truncate">{selectedIntern.briefDescription.title}</h3>
                    </div>
                  </div>
                  <button onClick={closeAllModals} className="text-white/70 hover:text-white p-1 flex-shrink-0">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4">
                  <div className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">Organisation</div>
                  <p className="text-sm font-semibold text-[#4a352f] m-0">{selectedIntern.briefDescription.company}</p>
                  <p className="text-xs text-[#7d5a50] mt-1 m-0">Duration: {selectedIntern.briefDescription.duration}</p>
                </div>

                {[
                  ["Requirements", selectedIntern.briefDescription.requirements],
                  ["Key responsibilities", selectedIntern.briefDescription.responsibilities],
                  ["What you'll gain", selectedIntern.briefDescription.benefits],
                ].map(([label, items]) => (
                  <div key={label} className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4 mt-4">
                    <div className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold mb-2">{label}</div>
                    <ul className="list-disc pl-5 text-sm text-[#4a352f] space-y-1 m-0">
                      {(Array.isArray(items) ? items : [items]).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}

                <div className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4 mt-4">
                  <div className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">
                    Application process
                  </div>
                  <p className="text-sm text-[#7d5a50] m-0 leading-relaxed">
                    {selectedIntern.briefDescription.applicationProcess}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-6 border-t border-[#e6d7c3]">
                <button
                  onClick={() => {
                    const intern = selectedIntern
                    closeAllModals()
                    handleMessage(intern)
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-[#7d5a50] border border-[#c8b6a6] hover:bg-[#f5f0e1] inline-flex items-center gap-1.5"
                >
                  <MessageCircle size={14} /> Ask a question
                </button>
                <button
                  onClick={() => {
                    const intern = selectedIntern
                    closeAllModals()
                    handleConnectClick(intern)
                  }}
                  className="px-5 py-2 rounded-lg bg-[#7d5a50] text-white text-sm font-semibold inline-flex items-center gap-1.5"
                >
                  <Send size={14} /> Apply now
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Match Breakdown Modal */}
      {mounted &&
        showMatchBreakdown &&
        selectedIntern &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center z-[1000] p-4"
            style={{ backgroundColor: "rgba(62,39,35,0.85)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowMatchBreakdown(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-[760px] w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Match breakdown</p>
                    <h3 className="text-sm font-bold mt-0.5 truncate">{selectedIntern.smseName}</h3>
                  </div>
                  <button onClick={() => setShowMatchBreakdown(false)} className="text-white/70 hover:text-white p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="text-center pb-5 border-b border-[#e6d7c3]">
                  <div className="text-4xl font-extrabold" style={{ color: getScoreColor(selectedIntern.matchPercentage) }}>
                    {selectedIntern.matchPercentage}%
                  </div>
                  <p className="text-xs text-[#a89482] mt-1 m-0">Overall match score</p>
                  <div className="h-2 rounded-full overflow-hidden bg-[#e6d7c3] mt-3">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${selectedIntern.matchPercentage}%`,
                        background: `linear-gradient(90deg, ${getScoreColor(selectedIntern.matchPercentage)}, ${getScoreColor(selectedIntern.matchPercentage)}aa)`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-3 mt-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                  {selectedIntern.matchBreakdown &&
                    Object.entries(selectedIntern.matchBreakdown).map(([key, breakdown]) => {
                      const titles = {
                        skillsMatch: "Skills / role match",
                        workModeMatch: "Work mode compatibility",
                        locationMatch: "Location match",
                        availabilityMatch: "Availability date",
                        additionalFactors: "Profile completeness",
                      }
                      const pct = (breakdown.score / breakdown.maxScore) * 100
                      const color = pct >= 90 ? "#2E7D32" : pct >= 50 ? "#F57C00" : "#D32F2F"
                      const statusText =
                        breakdown.score === breakdown.maxScore
                          ? "Perfect match"
                          : breakdown.score > breakdown.maxScore * 0.5
                            ? "Partial match"
                            : breakdown.score > 0
                              ? "Some match"
                              : "No match"

                      return (
                        <div
                          key={key}
                          className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4"
                          style={{ borderLeft: `4px solid ${color}` }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="text-sm font-semibold text-[#4a352f] m-0">{titles[key] || key}</h4>
                            <span className="text-sm font-bold" style={{ color }}>
                              {breakdown.score}/{breakdown.maxScore}
                            </span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden bg-[#e6d7c3] mb-2">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                          <div className="text-[11px] font-semibold mb-1" style={{ color }}>
                            {statusText}
                          </div>
                          <p className="text-xs text-[#7d5a50] m-0 leading-relaxed">{breakdown.description}</p>
                        </div>
                      )
                    })}
                </div>
              </div>

              <div className="flex justify-end gap-2 p-6 border-t border-[#e6d7c3]">
                <button
                  onClick={() => {
                    const intern = selectedIntern
                    setShowMatchBreakdown(false)
                    handleMessage(intern)
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-[#7d5a50] border border-[#c8b6a6] hover:bg-[#f5f0e1] inline-flex items-center gap-1.5"
                >
                  <MessageCircle size={14} /> Ask a question
                </button>
                <button
                  onClick={() => setShowMatchBreakdown(false)}
                  className="px-5 py-2 rounded-lg bg-[#7d5a50] text-white text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Business details — the same pop-up the advisor-side match table uses,
          so a business reads identically wherever you open it. It fetches the
          full universalProfiles record itself; smseName and the match score
          are passed so the header has something to show while it loads. */}
      {showModal && selectedIntern && (
        <BusinessDetailsModal
          business={{
            businessId: selectedIntern.originalSponsorId,
            businessName: selectedIntern.smseName,
            finalScore: selectedIntern.matchPercentage,
          }}
          isOpen={showModal}
          onClose={closeAllModals}
        />
      )}

      {/* Message Modal */}
      {mounted &&
        showMessageModal &&
        selectedIntern &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center z-[1000] p-4"
            style={{ backgroundColor: "rgba(62,39,35,0.85)", backdropFilter: "blur(4px)" }}
            onClick={closeAllModals}
          >
            <div
              className="bg-white rounded-2xl max-w-[620px] w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white flex items-center justify-between">
                <div className="min-w-0 flex items-center gap-2">
                  <MessageCircle size={20} className="text-[#f5f0e1] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Message</p>
                    <h3 className="text-sm font-bold mt-0.5 truncate">{selectedIntern.smseName}</h3>
                  </div>
                </div>
                <button onClick={closeAllModals} className="text-white/70 hover:text-white p-1 flex-shrink-0">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message here..."
                  rows={8}
                  className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
                />
              </div>

              <div className="flex justify-end gap-2 p-6 border-t border-[#e6d7c3]">
                <button
                  onClick={closeAllModals}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-[#7d5a50] border border-[#c8b6a6] hover:bg-[#f5f0e1]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className="px-5 py-2 rounded-lg bg-[#7d5a50] text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Send size={14} /> Send message
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default InternTable