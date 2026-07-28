"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import {
  ChevronDown,
  X,
  Eye,
  EyeOff,
  SlidersHorizontal,
  GripVertical,
  RotateCcw,
  Settings,
  Trash2,
  Plus,
  LayoutGrid,
  CheckCircle,
  MoreVertical,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowRight,
  Pin,
  PinOff,
  Bookmark,
  HelpCircle,
  Gauge,
  Target,
  Layers,
  StickyNote,
  Flag,
  Rocket,
} from "lucide-react"
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp, query, where, limit } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../../firebaseConfig"
import emailjs from "@emailjs/browser"
import { API_KEYS } from "../../API"
import CatalystDetailsModal from "./accelatorDetailsModal"
import {
  DEFAULT_STAGES,
  mapStatusToStageId,
  getStageColors,
  getNextStageId,
} from "../../catalyst/CatalystMatches/stageConfig"

/* ════════════════════════════════════════════════════════════════════════════
   Application identity.

   There were three conventions in the old file: reads used
   `${catalystId}_${smeId}_${index}` (and `${catalystId}_${smeId}` with no
   index for zero-programme catalysts), the duplicate guard read
   `${smeId}_${catalystId}_${index}`, and the status map keyed rows as
   `${catalystId}_${index}` while a zero-programme row's id was bare
   `catalystId`. The guard could therefore never fire, and zero-programme
   catalysts never showed as applied.

   One helper per collection now, used for every read and every write, and
   the programme index is always present.
   ════════════════════════════════════════════════════════════════════════ */
const rowKey = (catalystId, programIndex = 0) => `${catalystId}::${programIndex}`
const catalystAppId = (catalystId, smeId, programIndex = 0) => `${catalystId}_${smeId}_${programIndex}`
const smeAppId = (smeId, catalystId, programIndex = 0) => `${smeId}_${catalystId}_${programIndex}`

/* ════════════════════════════════════════════════════════════════════════════
   Stage vocabulary — sourced from the shared stageConfig.js the catalyst side
   uses. LEGACY_STATUS_ALIASES resolves records written before the vocabularies
   were unified, so no data migration is needed.
   ════════════════════════════════════════════════════════════════════════ */
const LEGACY_STATUS_ALIASES = {
  Match: "Matched",
  "New Application": "Matched",
  "Application Sent": "Applied",
  "Under Review": "Evaluation",
  "In Review": "Evaluation",
  "Support Approved": "Offer",
  "Term Sheet": "Offer",
  "Active Support": "Admitted",
  Active: "Admitted",
  "Successful Deals": "Admitted",
  "Graduated Successfully": "Admitted",
  "Support Declined": "Declined",
  Decline: "Declined",
  Rejected: "Declined",
}
const normalizeStatus = (status) => LEGACY_STATUS_ALIASES[status] || status

const getStatusMeta = (status) => {
  const normalized = normalizeStatus(status)
  const stageId = mapStatusToStageId(normalized, DEFAULT_STAGES)
  const stage = DEFAULT_STAGES.find((s) => s.id === stageId) || DEFAULT_STAGES[0]
  return { label: status || stage.name, colors: getStageColors(stage.group), stage }
}

const getNextStageName = (currentStatus) => {
  const currentId = mapStatusToStageId(normalizeStatus(currentStatus), DEFAULT_STAGES)
  const nextId = getNextStageId(DEFAULT_STAGES, currentId)
  const stage = DEFAULT_STAGES.find((s) => s.id === nextId)
  return stage ? stage.name : "—"
}

/* ════════════════════════════════════════════════════════════════════════════
   Section 3 — row actions.

   Keyed off the resolved stage *name* rather than its id, because stageConfig
   ids aren't guaranteed stable across custom catalyst setups. One primary
   action per row; everything else lives in the three-dot quick actions popup,
   matching the SME, intern, advisor, funding and customer tables.
   ════════════════════════════════════════════════════════════════════════ */
const getRowActions = (applied, stageName) => {
  if (!applied) return { primary: "Apply", kind: "apply" }
  const name = (stageName || "").toLowerCase()
  if (/declin|withdraw|reject|closed/.test(name)) return { primary: "View Outcome", kind: "view", terminal: true }
  if (/admitted|active|graduat/.test(name)) return { primary: "View Next Steps", kind: "view" }
  if (/offer|term sheet/.test(name)) return { primary: "Respond", kind: "view" }
  if (/due diligence|evaluat|review|screen/.test(name)) return { primary: "View Status", kind: "view" }
  if (/applied|submitted/.test(name)) return { primary: "View Application", kind: "view" }
  return { primary: "View Programme", kind: "view" }
}

/* ════════════════════════════════════════════════════════════════════════════
   Responsiveness (spec section 1).

   Definition: median business days between an eligible SME action and the
   organisation's first meaningful platform response, shown as a human-readable
   range and paired with the percentage of eligible enquiries answered. It is
   explicitly NOT the final programme decision time — which is what the old
   "Speed (Days)" column showed, and that was self-reported by the catalyst
   rather than measured.

   This must be computed across every SME that has contacted the catalyst, so
   it cannot be derived client-side without reading other SMEs' applications.
   It is read from a precomputed aggregate on the catalyst profile:

     catalystProfiles/{id}.responsiveness = {
       medianBusinessDays: number,   // median action -> first response
       answeredPct:        number,   // 0-100, share of eligible enquiries answered
       sampleSize:         number,   // eligible enquiries in the window
       updatedAt:          Timestamp,
     }

   computeResponsiveness() below is the exact calculation a scheduled backend
   job should run. Until that job writes the field, the column renders
   "Not enough data" and no badge appears — which is the behaviour the spec
   asks for below the minimum data threshold.
   ════════════════════════════════════════════════════════════════════════ */
const MIN_RESPONSIVENESS_SAMPLE = 5

const businessDaysBetween = (start, end) => {
  const from = start instanceof Date ? start : new Date(start)
  const to = end instanceof Date ? end : new Date(end)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return null

  let days = 0
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const target = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  while (cursor < target) {
    cursor.setDate(cursor.getDate() + 1)
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) days += 1
  }
  return days
}

/* Backend reference implementation. `enquiries` is every eligible SME action
   against one catalyst: { actedAt, firstRespondedAt }. firstRespondedAt must
   be the first *meaningful* platform response — a status move off the entry
   stage, a message, or a document request — never the final decision. */
export const computeResponsiveness = (enquiries = []) => {
  const eligible = enquiries.filter((e) => e.actedAt)
  if (eligible.length === 0) return null

  const answered = eligible.filter((e) => e.firstRespondedAt)
  const spans = answered
    .map((e) => businessDaysBetween(e.actedAt, e.firstRespondedAt))
    .filter((v) => v !== null)
    .sort((a, b) => a - b)

  if (spans.length === 0) {
    return { medianBusinessDays: null, answeredPct: 0, sampleSize: eligible.length }
  }

  const mid = Math.floor(spans.length / 2)
  const median = spans.length % 2 === 0 ? Math.round((spans[mid - 1] + spans[mid]) / 2) : spans[mid]

  return {
    medianBusinessDays: median,
    answeredPct: Math.round((answered.length / eligible.length) * 100),
    sampleSize: eligible.length,
  }
}

const readResponsiveness = (data, formData) => {
  const raw = data?.responsiveness || formData?.responsiveness || null
  if (!raw || typeof raw !== "object") return null
  const sampleSize = Number(raw.sampleSize) || 0
  if (sampleSize < MIN_RESPONSIVENESS_SAMPLE) return { belowThreshold: true, sampleSize }
  return {
    belowThreshold: false,
    medianBusinessDays: Number(raw.medianBusinessDays),
    answeredPct: Number(raw.answeredPct) || 0,
    sampleSize,
  }
}

const formatResponsivenessRange = (medianDays) => {
  if (medianDays === null || medianDays === undefined || Number.isNaN(medianDays)) return null
  if (medianDays <= 1) return "Within 1 day"
  if (medianDays <= 2) return "1–2 days"
  if (medianDays <= 5) return "3–5 days"
  if (medianDays <= 10) return "1–2 weeks"
  if (medianDays <= 20) return "2–4 weeks"
  return "Over 4 weeks"
}

const responsivenessBucket = (resp) => {
  if (!resp || resp.belowThreshold || resp.medianBusinessDays == null) return "unknown"
  if (resp.medianBusinessDays <= 3) return "fast"
  if (resp.medianBusinessDays <= 10) return "moderate"
  return "slow"
}

const RESPONSIVENESS_BUCKETS = [
  { id: "fast", label: "Fast (≤3 days)" },
  { id: "moderate", label: "Moderate (4–10 days)" },
  { id: "slow", label: "Slow (over 10 days)" },
  { id: "unknown", label: "Not enough data" },
]

/* ════════════════════════════════════════════════════════════════════════════
   Support Offered — short tags, per spec section D.
   ════════════════════════════════════════════════════════════════════════ */
const SUPPORT_TAGS = [
  { id: "funding", label: "Funding", test: /fund|capital|grant|invest|financ|loan|equity/i },
  { id: "market_access", label: "Market Access", test: /market|customer|buyer|offtake|procure|route.to.market|sales/i },
  { id: "mentoring", label: "Mentoring", test: /mentor|coach|advis|guidance/i },
  { id: "technical", label: "Technical Support", test: /technical|technolog|product|engineer|r&d|innovat|digital/i },
  { id: "training", label: "Training", test: /train|capacity|skill|workshop|learn|educat|develop/i },
  { id: "incubation", label: "Incubation", test: /incubat|accelerat|cohort|workspace|residen/i },
]

const toSupportTags = (...sources) => {
  const haystack = sources
    .flatMap((s) => (Array.isArray(s) ? s : [s]))
    .filter(Boolean)
    .join(" ")
  if (!haystack.trim()) return []
  return SUPPORT_TAGS.filter((tag) => tag.test.test(haystack)).map((tag) => tag.label)
}

/* ════════════════════════════════════════════════════════════════════════════
   Reference data
   ════════════════════════════════════════════════════════════════════════ */
const geographicFocusOptions = [
  { value: "global", label: "Global" },
  { value: "regional_na", label: "Regional (NA)" },
  { value: "regional_emea", label: "Regional (EMEA)" },
  { value: "regional_apac", label: "Regional (APAC)" },
  { value: "country_specific", label: "Country-specific" },
  { value: "province_specific", label: "Province Specific" },
]

const fundingStageOptions = [
  { value: "Startup", label: "Startup" },
  { value: "Growth", label: "Growth" },
  { value: "Scaling", label: "Scaling" },
  { value: "Turnaround", label: "Turnaround" },
  { value: "Mature", label: "Mature" },
  { value: "any_stage", label: "Any Stage" },
]

const PROGRAMME_TYPE_OPTIONS = [
  "Accelerator",
  "Incubator",
  "ESD Programme",
  "Enterprise Development",
  "Supplier Development",
  "Grant Programme",
  "Mentorship Programme",
  "Training Programme",
  "Other",
]

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

const formatDateValue = (value) => {
  if (!value || value === "-" || value === "unspecified") return null
  if (value?.toDate) return value.toDate().toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value.toString()
  return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
}

const toISODateOnly = (value) => {
  if (!value) return ""
  const d = value?.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

const TruncatedText = ({ text, maxLength = 50 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span className="text-[#a89482]">{text || "-"}</span>
  }

  const value = text.toString()
  const shouldTruncate = value.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? value : `${value.slice(0, maxLength)}...`

  return (
    <span className="leading-snug">
      <span className="break-words">{displayText}</span>
      {shouldTruncate && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className="ml-1 text-[10px] text-[#a67c52] underline hover:text-[#4a352f]"
        >
          {isExpanded ? "Less" : "More"}
        </button>
      )}
    </span>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Section D column configuration.

   Programme/Catalyst is the pinned first column and Action the last, so
   neither appears here. The seven above the divider are the spec default
   view; everything below is a spec "hidden by default" column.

   Widths raised in line with the other match tables — each header carries a
   grip, sort and filter control (~60px of chrome), so the old 116–150px
   columns left too little room and the browser broke labels mid-word
   ("MAT CH..", "STA TUS").

   priority drives responsive collapse: 1 survives mobile, <=3 survives
   tablet, everything shows on laptop and up.
   ════════════════════════════════════════════════════════════════════════ */
const COLUMN_DEFS = {
  match: { label: "Match %", align: "center", width: 136, filterType: "match", visible: true, priority: 1, sortable: true },
  programmeType: { label: "Programme Type", width: 156, filterType: "programmeType", visible: true, priority: 2, sortable: true },
  supportOffered: { label: "Support Offered", width: 198, filterType: "supportOffered", visible: true, priority: 3, sortable: false },
  duration: { label: "Duration / Start Date", width: 166, filterType: "duration", visible: true, priority: 3, sortable: true },
  deadline: { label: "Application Deadline", width: 168, filterType: "deadline", visible: true, priority: 2, sortable: true },
  responsiveness: { label: "Responsiveness", width: 160, filterType: "responsiveness", visible: true, priority: 3, sortable: true },
  status: { label: "Status", width: 144, filterType: "status", visible: true, priority: 1, sortable: true },

  programmeSponsor: { label: "Programme Sponsor", width: 164, filterType: "programmeSponsor", visible: false, priority: 4, sortable: true },
  sectorFocus: { label: "Sector Focus", width: 160, filterType: "sectorFocus", visible: false, priority: 4, sortable: true },
  location: { label: "Location", width: 134, filterType: "location", visible: false, priority: 4, sortable: true },
  geographicFocus: { label: "Geographic Focus", width: 156, filterType: "geographicFocus", visible: false, priority: 4, sortable: true },
  deliveryFormat: { label: "Delivery Format", width: 148, filterType: "deliveryFormat", visible: false, priority: 4, sortable: true },
  cohortSize: { label: "Cohort Size", width: 130, filterType: "cohortSize", visible: false, priority: 4, sortable: true },
  programmeCost: { label: "Programme Cost", width: 152, filterType: "programmeCost", visible: false, priority: 4, sortable: true },
  eligibility: { label: "Eligibility Requirements", width: 182, filterType: "eligibility", visible: false, priority: 4, sortable: false },
  fundingAvailable: { label: "Funding Available", width: 156, filterType: "fundingAvailable", visible: false, priority: 4, sortable: true },
  fundingStage: { label: "Funding Stage", width: 144, filterType: "fundingStage", visible: false, priority: 4, sortable: true },
  fundingType: { label: "Funding Type", width: 144, filterType: "fundingType", visible: false, priority: 4, sortable: true },
  servicesOffered: { label: "Services Offered", width: 160, filterType: "servicesOffered", visible: false, priority: 4, sortable: false },
  reportingRequirements: { label: "Reporting Requirements", width: 182, filterType: "reportingRequirements", visible: false, priority: 4, sortable: false },
  dateMatched: { label: "Date Matched", width: 144, filterType: null, visible: false, priority: 4, sortable: true },
  nextStage: { label: "Next Stage", width: 140, filterType: "nextStage", visible: false, priority: 4, sortable: false },
}

const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS)
const DEFAULT_COLUMN_VISIBILITY = Object.fromEntries(
  DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].visible !== false]),
)
const DEFAULT_COLUMN_WIDTHS = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].width]))
const DEFAULT_PINNED = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, null]))
const DEFAULT_DENSITY = "comfortable"

const CATALYST_WIDTH = 224
const ACTION_WIDTH = 208
const MIN_COLUMN_WIDTH = 84

/* ─── Saved views + filter persistence ──────────────────────────────────── */
const BUILTIN_VIEW_ID = "__default__"
// v3: the stored widths from earlier versions are the narrow ones that caused
// the mid-word header breaks, so old saved views fall back to the new defaults.
const VIEWS_STORAGE_KEY = "catalyst-matches-views-v3"
const FILTERS_STORAGE_KEY = "catalyst-matches-filters-v1"

const EMPTY_FILTERS = {
  name: "",
  matchRange: [0, 100],
  programmeType: [],
  supportOffered: [],
  durationText: "",
  deadlineFrom: "",
  deadlineTo: "",
  responsiveness: [],
  status: [],
  programmeSponsor: "",
  sectorFocus: [],
  location: "",
  geographicFocus: [],
  deliveryFormat: [],
  cohortSize: "",
  programmeCost: "",
  eligibility: "",
  fundingAvailable: "",
  fundingStage: [],
  fundingType: [],
  servicesOffered: "",
  reportingRequirements: "",
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

/* Row-emptiness rule, now checked against the Section D default columns
   rather than the old column set. */
const hasTooManyMissingFields = (accelerator) => {
  const fields = [
    accelerator.programmeType,
    accelerator.durationText,
    accelerator.deadline,
    accelerator.sectorFocus,
    accelerator.geographicFocus,
    accelerator.fundingStage,
    accelerator.fundingAvailable,
    accelerator.servicesOffered,
    accelerator.eligibility,
  ]
  const missing = fields.filter(
    (f) =>
      !f ||
      f === "-" ||
      f === "Not specified" ||
      f === "Various" ||
      f === "unspecified" ||
      f === "Unknown" ||
      f === "N/A",
  ).length
  return missing > 5
}

/* ════════════════════════════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════════════════════════ */
export function AcceleratorTable({ filters, stageFilter, onApplicationSubmitted, onMatchesCountChange }) {
  const [accelerators, setAccelerators] = useState([])
  const [applicationsByRow, setApplicationsByRow] = useState({})
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [showCatalystDetails, setShowCatalystDetails] = useState(false)
  const [selectedCatalystDetails, setSelectedCatalystDetails] = useState(null)
  const [applyingRow, setApplyingRow] = useState(null)

  const [savedMatches, setSavedMatches] = useState({})
  const [hiddenMatches, setHiddenMatches] = useState({})
  const [hoveredRowKey, setHoveredRowKey] = useState(null)

  /* Popups — anchored popovers portaled to <body>, same pattern as the other
     match tables. { type, row, position:{x,y}, rect } */
  const [activePopup, setActivePopup] = useState(null)

  const initialFilterState = useMemo(() => loadFilterState(), [])
  const [localFilters, setLocalFilters] = useState(initialFilterState.filters)
  const [sortConfig, setSortConfig] = useState(initialFilterState.sort)

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

  const [draggedColumn, setDraggedColumn] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [dragHintRect, setDragHintRect] = useState(null)
  const resizingRef = useRef(null)

  const [headerFilterOpen, setHeaderFilterOpen] = useState(null)

  const [isCompanyMember, setIsCompanyMember] = useState(false)
  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [userRole, setUserRole] = useState(null)

  const [viewportWidth, setViewportWidth] = useState(typeof window === "undefined" ? 1440 : window.innerWidth)

  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]

  const notify = useCallback((type, message, ms = 3000) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), ms)
  }, [])

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  /* ─── Auth + company membership. Wrapped in onAuthStateChanged so a cold
     load doesn't read auth.currentUser before the session is restored. ─── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setEffectiveUserId(null)
        setAuthResolved(true)
        setLoading(false)
        return
      }

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
                setEffectiveUserId(ownerId)
              }
              setAuthResolved(true)
              return
            }
          }
        }
        setIsCompanyMember(false)
        setEffectiveUserId(user.uid)
        setUserRole("owner")
      } catch (error) {
        console.error("Error checking company membership:", error)
        setEffectiveUserId(user.uid)
        setUserRole("owner")
      } finally {
        setAuthResolved(true)
      }
    })

    return () => unsubscribe()
  }, [])

  /* ─── Match scoring (unchanged logic, returns { score, breakdown }) ───── */
  const calculateMatchScore = useCallback((smeData, acceleratorData, program = null) => {
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

    const toArray = (v) => {
      if (v == null) return []
      if (Array.isArray(v)) return v
      return v.toString().split(/[,|/]+/g).map((s) => s.trim()).filter(Boolean)
    }

    const splitSectorTokens = (v) =>
      toArray(v)
        .flatMap((item) => item.split(/[,|/]+/g))
        .flatMap((item) => item.split(/[_/\-\s]+/g))
        .map((s) => s.replace(/\(.*?\)/g, ""))
        .map((s) => s.trim())
        .filter(Boolean)

    const canon = (s) => s.toLowerCase().replace(/[^a-z]/g, "")

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
    }

    const COMPOSITE_EXPANSIONS = { agricultureforestryfishing: ["agriculture", "forestry", "fishing"] }
    const mapAlias = (t) => SECTOR_ALIASES[t] || t

    const normalizeSectors = (v) =>
      splitSectorTokens(v)
        .map(canon)
        .map(mapAlias)
        .flatMap((t) => (COMPOSITE_EXPANSIONS[t] ? COMPOSITE_EXPANSIONS[t] : [t]))
        .filter(Boolean)

    const hasOverlap = (a, b) => {
      const A = new Set(normalizeSectors(a))
      for (const t of normalizeSectors(b)) if (A.has(t)) return true
      return false
    }

    const normalizeToken = (s) => s.toString().toLowerCase().trim().replace(/[_\-\s]+/g, "")
    const normalizeList = (v) =>
      toArray(v).flatMap((item) => item.split(/\s*,\s*/)).map(normalizeToken).filter(Boolean)

    const normalize = (val) =>
      Array.isArray(val) ? val.map((v) => v.toLowerCase().trim()) : val?.toLowerCase().trim()

    const cleanCurrency = (value) => {
      if (!value) return 0
      return Number.parseFloat(value.toString().replace(/[^0-9.]/g, "")) || 0
    }

    const cleanString = (input) => {
      if (Array.isArray(input)) {
        return input.map((str) => (typeof str === "string" ? str.replace(/[_-]/g, " ").toLowerCase() : str))
      }
      if (typeof input === "string") return input.replace(/[_-]/g, " ").toLowerCase()
      return input
    }

    const checkGeographicMatch = (smeLocation, acceleratorGeoData) => {
      const smeProvince = normalize(smeData.entityOverview?.province)
      const smeCountry = cleanString(smeData.entityOverview?.location) || "not specified"
      const accelGeoFocus = acceleratorGeoData.geographicFocus || []
      const accelSelectedCountries = cleanString(acceleratorGeoData.selectedCountries) || []
      const accelSelectedProvinces = cleanString(acceleratorGeoData.selectedProvinces) || []

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
      if (accelGeoFocus.includes("province_specific")) return accelSelectedProvinces.includes(smeProvince)
      return false
    }

    const programData = program || acceleratorData?.programmeDetails?.programs?.[0] || {}

    // 1. Funding Stage
    const smeStage = smeData.entityOverview?.operationStage
    const accelStage = acceleratorData?.generalMatchingPreference?.programStage
    const stageMatch = normalize(smeStage) === normalize(accelStage)
    breakdown.fundingStage.details = { smeValue: smeStage, accelValue: accelStage }
    breakdown.fundingStage.matched = stageMatch
    if (stageMatch) {
      breakdown.fundingStage.score = 12.5
      breakdown.fundingStage.description = `Your ${smeStage} stage aligns with their ${accelStage} focus`
      matched++
    } else {
      breakdown.fundingStage.description = `You're in ${smeStage || "unspecified"} stage, they focus on ${accelStage || "unspecified"}`
    }

    // 2. Ticket Size
    const smeAmountRequested = cleanCurrency(smeData.useOfFunds?.amountRequested)
    const accelMinTicket = cleanCurrency(programData.minimumSupport || 0)
    const accelMaxTicket = cleanCurrency(programData.maximumSupport || 0)
    const ticketMatch = smeAmountRequested >= accelMinTicket && smeAmountRequested <= accelMaxTicket
    breakdown.ticketSize.details = { smeValue: smeAmountRequested, accelValue: `${accelMinTicket}-${accelMaxTicket}` }
    breakdown.ticketSize.matched = ticketMatch
    if (ticketMatch) {
      breakdown.ticketSize.score = 12.5
      breakdown.ticketSize.description = `Your funding need (${smeAmountRequested}) fits their range`
      matched++
    } else {
      breakdown.ticketSize.description = `You need ${smeAmountRequested || "unspecified"}, they offer ${accelMinTicket}-${accelMaxTicket}`
    }

    // 3. Geographic Fit
    const smeLocation = cleanString(smeData.entityOverview?.location)
    const accelGeoData = acceleratorData.generalMatchingPreference || {}
    const geoMatch = checkGeographicMatch(smeLocation, accelGeoData)
    breakdown.geographicFit.details = { smeValue: smeLocation, accelValue: accelGeoData.geographicFocus }
    breakdown.geographicFit.matched = geoMatch
    if (geoMatch) {
      breakdown.geographicFit.score = 12.5
      breakdown.geographicFit.description = `Your location (${smeLocation}) fits their focus areas`
      matched++
    } else {
      breakdown.geographicFit.description = `Your location (${smeLocation}) doesn't align with their focus areas`
    }

    // 4. Sector
    const smeSectors = smeData.entityOverview?.economicSectors
    const accelSectors = acceleratorData?.generalMatchingPreference?.sectorFocus
    const sectorMatch = hasOverlap(smeSectors, accelSectors)
    breakdown.sectorMatch.details = {
      smeValue: normalizeSectors(smeSectors).join(", "),
      accelValue: normalizeSectors(accelSectors).join(", "),
    }
    breakdown.sectorMatch.matched = sectorMatch
    if (sectorMatch) {
      breakdown.sectorMatch.score = 12.5
      breakdown.sectorMatch.description = `Sector overlap found`
      matched++
    } else {
      breakdown.sectorMatch.description = `You have [${breakdown.sectorMatch.details.smeValue || "unspecified"}], they focus on [${breakdown.sectorMatch.details.accelValue || "unspecified"}]`
    }

    // 5. Instrument
    const smeInstrumentRaw = smeData.useOfFunds?.fundingInstruments
    const accelInstrumentRaw =
      programData.supportType ||
      acceleratorData?.generalMatchingPreference?.supportFocusSubtype ||
      acceleratorData?.generalMatchingPreference?.supportFocusType
    const instrumentMatch = hasOverlap(smeInstrumentRaw, accelInstrumentRaw)
    breakdown.instrumentFit.details = {
      smeValue: normalizeList(smeInstrumentRaw).join(", "),
      accelValue: normalizeList(accelInstrumentRaw).join(", "),
    }
    breakdown.instrumentFit.matched = instrumentMatch
    if (instrumentMatch) {
      breakdown.instrumentFit.score = 12.5
      breakdown.instrumentFit.description = `Instrument overlap found`
      matched++
    } else {
      breakdown.instrumentFit.description = `You have [${breakdown.instrumentFit.details.smeValue || "unspecified"}], they offer [${breakdown.instrumentFit.details.accelValue || "unspecified"}]`
    }

    // 6. Support
    const smeSupportCategory = smeData.useOfFunds?.additionalSupportFocus
    const smeSupportSubtype = smeData.useOfFunds?.additionalSupportFocusSubtype
    const accelSupportCategory = programData.supportFocusType || acceleratorData?.generalMatchingPreference?.supportFocus
    const accelSupportSubtype =
      programData.supportFocusSubtype || acceleratorData?.generalMatchingPreference?.supportFocusSubtype

    let supportMatchScore = 0
    let supportMatched = false
    let supportDescription = ""

    if (smeSupportSubtype && accelSupportSubtype && smeSupportSubtype === accelSupportSubtype) {
      supportMatchScore = 12.5
      supportMatched = true
      supportDescription = `Your ${smeSupportSubtype} need aligns with their ${accelSupportSubtype} offering`
      matched++
    } else if (smeSupportCategory && accelSupportCategory && smeSupportCategory === accelSupportCategory) {
      supportMatchScore = 6.25
      supportMatched = true
      supportDescription = `Your ${smeSupportCategory} category aligns, but subtypes differ`
    } else {
      supportDescription = `You need ${smeSupportCategory || "unspecified"}, they offer ${accelSupportCategory || "unspecified"}`
    }

    breakdown.supportMatch.details = {
      smeValue: smeSupportSubtype ? `${smeSupportCategory} - ${smeSupportSubtype}` : smeSupportCategory,
      accelValue: accelSupportSubtype ? `${accelSupportCategory} - ${accelSupportSubtype}` : accelSupportCategory,
    }
    breakdown.supportMatch.score = supportMatchScore
    breakdown.supportMatch.matched = supportMatched
    breakdown.supportMatch.description = supportDescription

    // 7. Legal entity
    const smeLegal = smeData.entityOverview?.legalStructure
    const accelLegal = acceleratorData?.generalMatchingPreference?.legalEntityFit
    const legalMatch = normalize(smeLegal) === normalize(accelLegal)
    breakdown.legalEntityFit.details = { smeValue: smeLegal, accelValue: accelLegal }
    breakdown.legalEntityFit.matched = legalMatch
    if (legalMatch) {
      breakdown.legalEntityFit.score = 12.5
      breakdown.legalEntityFit.description = `Both work with ${smeLegal}`
      matched++
    } else {
      breakdown.legalEntityFit.description = `You are ${smeLegal || "unspecified"}, they work with ${accelLegal || "unspecified"}`
    }

    // 8. Revenue threshold
    const smeRevenue = cleanCurrency(smeData.financialOverview?.annualRevenue)
    const accelThreshold = cleanCurrency(programData.minimumSupport || "0")
    const revenueMatch = smeRevenue >= accelThreshold
    breakdown.revenueThreshold.details = { smeValue: smeRevenue, accelValue: accelThreshold }
    breakdown.revenueThreshold.matched = revenueMatch
    if (revenueMatch) {
      breakdown.revenueThreshold.score = 12.5
      breakdown.revenueThreshold.description = `Your ${smeRevenue} exceeds their ${accelThreshold} threshold`
      matched++
    } else {
      breakdown.revenueThreshold.description = `Your ${smeRevenue || "unspecified"} is below their ${accelThreshold} requirement`
    }

    return { score: Math.round((matched / totalFields) * 100), breakdown }
  }, [])

  /* ─── Data ────────────────────────────────────────────────────────────── */
  const fetchAccelerators = useCallback(async () => {
    if (!effectiveUserId) return

    setLoading(true)
    try {
      const smeDoc = await getDoc(doc(db, "universalProfiles", effectiveUserId))
      const smeData = smeDoc.exists() ? smeDoc.data() : {}

      /* One scoped query instead of a per-programme getDoc, and instead of
         downloading the entire smeCatalystApplications collection and
         filtering in JS — that read was unscoped and returned every SME's
         applications to this client. */
      const appsSnapshot = await getDocs(
        query(collection(db, "catalystApplications"), where("smeId", "==", effectiveUserId)),
      )
      const appsMap = {}
      appsSnapshot.docs.forEach((d) => {
        const data = d.data()
        appsMap[rowKey(data.catalystId, data.programIndex ?? 0)] = data
      })
      setApplicationsByRow(appsMap)

      const snapshot = await getDocs(collection(db, "catalystProfiles"))

      const rows = snapshot.docs.flatMap((docSnap) => {
        const catalystId = docSnap.id
        if (catalystId === effectiveUserId) return []

        const data = docSnap.data()
        const formData = data.formData || {}
        const overview = formData.entityOverview || {}
        const matchPrefs = formData.generalMatchingPreference || {}
        const brief = formData.applicationBrief || {}
        const programs = formData?.programmeDetails?.programs || []
        const responsiveness = readResponsiveness(data, formData)

        const buildRow = (program, index) => {
          // The whole result object used to be assigned here in the
          // zero-programme branch, which rendered as an object child and
          // crashed the table. Both branches now take .score / .breakdown.
          const matchResult = calculateMatchScore(smeData, formData, program)
          const app = appsMap[rowKey(catalystId, index)] || null
          const rawStatus = app?.status || app?.pipelineStage || null

          const programmeName = program?.name || program?.programmeName || null

          return {
            id: rowKey(catalystId, index),
            originalCatalystId: catalystId,
            programIndex: index,
            // Always identify the programme, including for single-programme
            // catalysts — the old label only appended it when programs.length > 1.
            name: overview.registeredName || "Unnamed",
            programmeName,
            displayName: programmeName
              ? `${overview.registeredName || "Unnamed"} — ${programmeName}`
              : overview.registeredName || "Unnamed",

            matchPercentage: matchResult.score,
            matchBreakdown: matchResult.breakdown,

            programmeType:
              program?.programmeType || program?.type || matchPrefs.programmeType || matchPrefs.supportFocus || "-",
            supportTags: toSupportTags(
              program?.supportOffered,
              program?.supportType,
              matchPrefs.supportFocus,
              matchPrefs.supportFocusSubtype,
              program?.servicesOffered,
            ),
            supportOfferedRaw: program?.supportOffered || matchPrefs.supportFocus || "-",
            durationText: program?.duration || program?.programmeDuration || "-",
            startDate: program?.startDate || program?.cohortStartDate || null,
            deadline: brief.closingDate || brief.applicationWindow || "unspecified",
            responsiveness,

            programmeSponsor: program?.sponsor || overview.parentOrganisation || overview.registeredName || "-",
            sectorFocus: matchPrefs.sectorFocus || "-",
            location: overview.province || "-",
            geographicFocus: matchPrefs.geographicFocus || "-",
            deliveryFormat: program?.deliveryFormat || program?.format || "-",
            cohortSize: program?.cohortSize || program?.numberOfParticipants || "-",
            programmeCost: program?.cost || program?.programmeCost || program?.fee || "-",
            eligibility: program?.eligibility || brief.eligibilityCriteria || "-",
            fundingAvailable:
              program?.budget ||
              (program?.minimumSupport || program?.maximumSupport
                ? `${program?.minimumSupport || "0"} - ${program?.maximumSupport || "0"}`
                : "-"),
            fundingStage: matchPrefs.programStage || "-",
            fundingType: program?.supportType || matchPrefs.supportFocusSubtype || "-",
            servicesOffered: program?.servicesOffered || matchPrefs.supportFocusSubtype || "-",
            reportingRequirements: program?.reportingRequirements || "-",
            dateMatched: app?.createdAt || app?.applicationDate || null,

            applied: !!app,
            status: rawStatus,
            rawFormData: formData,
          }
        }

        if (programs.length === 0) return [buildRow(null, 0)]
        return programs.map((program, index) => buildRow(program, index))
      })

      rows.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))
      setAccelerators(rows)
    } catch (err) {
      console.error("Error loading catalyst profiles:", err)
      notify("error", "Failed to load catalyst data.", 4000)
    } finally {
      setLoading(false)
    }
  }, [effectiveUserId, calculateMatchScore, notify])

  useEffect(() => {
    if (!authResolved) return
    if (!effectiveUserId) {
      setLoading(false)
      return
    }
    fetchAccelerators()
  }, [authResolved, effectiveUserId, filters, fetchAccelerators])

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
    notify("success", `View "${trimmedName}" created`)
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
    notify("success", "View deleted")
  }

  const resetActiveViewToDefault = () => {
    const layout = createDefaultViewLayout()
    setColumnVisibility(layout.columnVisibility)
    setColumnOrder(layout.columnOrder)
    setColumnWidths(layout.columnWidths)
    setPinned(layout.pinned)
    setDensity(layout.density)
    notify("success", `"${activeView.name}" reset to factory defaults`)
  }

  const toggleColumn = (key) => setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
  const cyclePin = (key) =>
    setPinned((prev) => ({
      ...prev,
      [key]: prev[key] === "left" ? "right" : prev[key] === "right" ? null : "left",
    }))

  /* ─── Drag / resize ───────────────────────────────────────────────────── */
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
        {isActive ? sortConfig.dir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} /> : <ArrowUpDown size={11} />}
      </button>
    )
  }

  /* ─── Popups ──────────────────────────────────────────────────────────── */
  const openPopup = (type, row, rect) => {
    let popupWidth
    let popupHeight
    switch (type) {
      case "match":
        popupWidth = 400
        popupHeight = 520
        break
      case "quickActions":
        popupWidth = 216
        popupHeight = 300
        break
      default:
        popupWidth = 320
        popupHeight = 320
    }

    let x = rect.left + rect.width / 2 - popupWidth / 2
    let y = rect.bottom + 8

    if (x + popupWidth > window.innerWidth - 20) x = window.innerWidth - popupWidth - 20
    if (x < 20) x = 20
    if (y + popupHeight > window.innerHeight - 20) y = rect.top - popupHeight - 8
    if (y < 20) y = 20

    setActivePopup({ type, row, position: { x, y }, rect })
  }

  const openPopupFromEvent = (type, row, event) => {
    event.stopPropagation()
    openPopup(type, row, event.currentTarget.getBoundingClientRect())
  }

  const closePopup = () => setActivePopup(null)

  /* ─── Actions ─────────────────────────────────────────────────────────── */
  const sendCatalystEmailNotification = async (catalystId, smeData, accelerator) => {
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

      let catalystEmail = null
      try {
        const catalystProfileSnap = await getDoc(doc(db, "catalystProfiles", catalystId))
        if (catalystProfileSnap.exists()) {
          const profileData = catalystProfileSnap.data()
          catalystEmail =
            profileData.formData?.contactDetails?.businessEmail ||
            profileData.formData?.contactDetails?.email ||
            profileData.email ||
            profileData.contactEmail
        }
      } catch (fetchError) {
        console.error("Error fetching catalyst email:", fetchError)
      }

      if (!catalystEmail) {
        console.warn("No catalyst email found, skipping notification")
        return false
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(catalystEmail)) throw new Error(`Invalid email format: "${catalystEmail}"`)

      const smeName = smeData.entityOverview?.registeredName || "An SMSE"

      let emailMessage = `Dear ${accelerator.name || "Catalyst"} Team,\n\n`
      emailMessage += `You have received a new application from ${smeName}.\n\n`
      emailMessage += `Application Details:\n`
      emailMessage += `- SMSE Name: ${smeName}\n`
      emailMessage += `- Programme: ${accelerator.programmeName || "General"}\n`
      emailMessage += `- Location: ${smeData.entityOverview?.location || "Not specified"}\n`
      emailMessage += `- Sector: ${(smeData.entityOverview?.economicSectors || []).join(", ") || "Not specified"}\n`
      emailMessage += `- Funding Stage: ${smeData.entityOverview?.operationStage || "Not specified"}\n`
      emailMessage += `- Funding Required: ${smeData.useOfFunds?.amountRequested || "Not specified"}\n`
      emailMessage += `- Match Score: ${accelerator.matchPercentage || 0}%\n\n`
      emailMessage += `You can review this application in your catalyst dashboard.\n\n`
      emailMessage += `Best regards,\nBIG Marketplace Africa Team`

      await window.emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        {
          to_email: catalystEmail,
          subject: `New Application Received from ${smeName}`,
          from_name: "BIG Marketplace Africa",
          date: new Date().toLocaleDateString(),
          message: emailMessage,
          portal_url: `https://www.bigmarketplace.africa/catalyst/applications`,
          has_attachments: "false",
          attachments_count: "0",
        },
        emailjsConfig.publicKey,
      )

      return true
    } catch (emailError) {
      console.error("Catalyst email failed:", emailError)
      return false
    }
  }

  const handleApplyClick = async (accelerator) => {
    setActivePopup(null)
    const user = auth.currentUser
    if (!user) return

    if (isCompanyMember && !["owner", "admin"].includes(userRole)) {
      notify("warning", "Only company owners and admins can submit applications.", 4000)
      return
    }

    const smeUserId = effectiveUserId
    const catalystId = accelerator.originalCatalystId
    const programIndex = accelerator.programIndex ?? 0
    const key = rowKey(catalystId, programIndex)

    setApplyingRow(key)

    try {
      // Read the same document the write below creates. The old guard read
      // a differently-ordered id, so it could never find an existing
      // application and every re-click overwrote the record and re-emailed.
      const catalystDocId = catalystAppId(catalystId, smeUserId, programIndex)
      const existing = await getDoc(doc(db, "catalystApplications", catalystDocId))

      if (existing.exists()) {
        const data = existing.data()
        setApplicationsByRow((prev) => ({ ...prev, [key]: data }))
        setAccelerators((prev) =>
          prev.map((row) =>
            row.id === key ? { ...row, applied: true, status: data.status || data.pipelineStage } : row,
          ),
        )
        notify("info", `You've already applied to ${accelerator.displayName}`)
        return
      }

      const smeDoc = await getDoc(doc(db, "universalProfiles", smeUserId))
      const smeData = smeDoc.exists() ? smeDoc.data() : {}
      const bigDoc = await getDoc(doc(db, "bigEvaluations", smeUserId))
      const bigData = bigDoc.exists() ? bigDoc.data() : {}

      const guarantees = smeData.guarantees || {}
      const entity = smeData.entityOverview || {}
      const funding = smeData.useOfFunds || {}

      const guaranteeGroups = {
        "Forward Contracts (Revenue Guarantees)": [
          "signedCustomerContracts",
          "purchaseOrders",
          "offtakeAgreements",
          "subscriptionRevenue",
        ],
        "Payment of Credit Guarantees": [
          "letterOfGuarantee",
          "thirdPartyGuarantees",
          "factoringAgreements",
          "suretyBonds",
        ],
        "Government or Institutional Support": [
          "governmentContracts",
          "approvedSupplierStatus",
          "incubatorGuarantees",
          "exportCreditGuarantees",
        ],
        "Asset-backed Guarantees": ["liensCollateral", "securedAssets", "retentionGuarantees"],
        "Export Credit or Trade Insurance Cover": ["exportCreditInsurance"],
        "Factoring or Receivables Finance Agreements": ["receivablesFinancing"],
        "Personal or Third-Party Guarantees": ["personalSurety", "corporateGuarantees"],
      }

      const guaranteeSummary = Object.entries(guaranteeGroups)
        .filter(([, keys]) => keys.some((k) => guarantees[k] === "yes"))
        .map(([category]) => category)
        .join(", ")

      const pipelineStage = "Applied"

      const applicationData = {
        catalystId,
        programIndex,
        programmeName: accelerator.programmeName || null,
        smeId: smeUserId,
        submittedBy: user.uid,
        submittedByRole: userRole,
        acceleratorName: accelerator.name,
        location: entity.location || "-",
        sector: (entity.economicSectors || []).join(", ") || "-",
        fundingStage: smeData.applicationOverview?.fundingStage || "-",
        fundingRequired: funding.amountRequested || "-",
        equityOffered: funding.equityType || "",
        guarantees: guaranteeSummary || "-",
        supportRequired: accelerator.supportOfferedRaw || "-",
        servicesRequired: accelerator.servicesOffered || "-",
        applicationDate: new Date().toISOString(),
        matchPercentage: accelerator.matchPercentage || 0,
        status: pipelineStage,
        pipelineStage,
        createdAt: serverTimestamp(),
        // Responsiveness measures the gap between this and the catalyst's
        // first meaningful response, so the backend job needs both.
        smeActedAt: serverTimestamp(),
        firstRespondedAt: null,
        bigScore: bigData.scores?.bigScore || 0,
        compliance: bigData.scores?.compliance || 0,
        fundability: bigData.scores?.fundability || 0,
        legitimacy: bigData.scores?.legitimacy || 0,
        leadership: bigData.scores?.leadership || 0,
        smeName: entity.registeredName || "-",
      }

      await Promise.all([
        setDoc(doc(db, "catalystApplications", catalystDocId), { ...applicationData, viewType: "accelerator" }),
        setDoc(doc(db, "smeCatalystApplications", smeAppId(smeUserId, catalystId, programIndex)), {
          ...applicationData,
          viewType: "sme",
        }),
      ])

      await sendCatalystEmailNotification(catalystId, smeData, accelerator)

      setApplicationsByRow((prev) => ({ ...prev, [key]: applicationData }))
      setAccelerators((prev) =>
        prev.map((row) => (row.id === key ? { ...row, applied: true, status: pipelineStage } : row)),
      )
      notify("success", `Application sent to ${accelerator.displayName}`)

      if (onApplicationSubmitted) onApplicationSubmitted()
    } catch (error) {
      console.error("Failed to submit catalyst application:", error)
      notify("error", "Failed to submit application.", 4000)
    } finally {
      setApplyingRow(null)
    }
  }

  const handleViewClick = async (accelerator) => {
    setActivePopup(null)
    try {
      // Was querying with user.uid, so company members never saw a shared NDA.
      const sharedNDAQuery = query(
        collection(db, "shared_nda"),
        where("catalystId", "==", accelerator.originalCatalystId),
        where("smeId", "==", effectiveUserId),
        where("programIndex", "==", accelerator.programIndex ?? 0),
        limit(1),
      )

      const snapshot = await getDocs(sharedNDAQuery)

      let ndaUrl = null
      let ndaStatus = null
      let ndaSharedDate = null

      if (!snapshot.empty) {
        const ndaData = snapshot.docs[0].data()
        ndaUrl = ndaData.ndaUrl
        ndaStatus = ndaData.status
        ndaSharedDate = ndaData.sharedAt?.toDate?.() || ndaData.sharedAt
      }

      setSelectedCatalystDetails({ ...accelerator, ndaUrl, ndaStatus, ndaSharedDate })
      setShowCatalystDetails(true)
    } catch (error) {
      console.error("Error fetching NDA info:", error)
      setSelectedCatalystDetails(accelerator)
      setShowCatalystDetails(true)
    }
  }

  /* ─── Derived filter options ──────────────────────────────────────────── */
  const uniqueOf = useCallback(
    (accessor) => [...new Set(accelerators.map(accessor).filter((v) => v && v !== "-"))].sort(),
    [accelerators],
  )

  const uniqueProgrammeTypes = useMemo(() => {
    const fromData = uniqueOf((a) => formatLabel(a.programmeType))
    return [...new Set([...PROGRAMME_TYPE_OPTIONS, ...fromData])]
  }, [uniqueOf])
  const uniqueSectors = useMemo(() => uniqueOf((a) => formatLabel(a.sectorFocus)), [uniqueOf])
  const uniqueFundingStages = useMemo(() => {
    const fromData = uniqueOf((a) => formatLabel(a.fundingStage))
    return [...new Set([...fundingStageOptions.map((o) => o.label), ...fromData])]
  }, [uniqueOf])
  const uniqueFundingTypes = useMemo(() => uniqueOf((a) => formatLabel(a.fundingType)), [uniqueOf])
  const uniqueDeliveryFormats = useMemo(() => uniqueOf((a) => formatLabel(a.deliveryFormat)), [uniqueOf])

  const statusOptions = useMemo(() => {
    const canonical = DEFAULT_STAGES.map((s) => s.name)
    const dynamic = accelerators.map((a) => a.status).filter(Boolean)
    return [...new Set([...canonical, ...dynamic])]
  }, [accelerators])

  /* ─── Filtering + sorting ─────────────────────────────────────────────── */
  const filteredAccelerators = useMemo(() => {
    const matchesAny = (selected, value) =>
      selected.length === 0 || selected.some((v) => (value || "").toLowerCase().includes(v.toLowerCase()))
    const includesText = (needle, value) =>
      !needle.trim() || (value || "").toString().toLowerCase().includes(needle.toLowerCase().trim())

    const rows = accelerators.filter((a) => {
      if (hiddenMatches[a.id]) return false
      if (hasTooManyMissingFields(a)) return false

      if (stageFilter) {
        if (stageFilter === "matched") {
          if (a.applied) return false
        } else {
          if (!a.applied) return false
          const resolved = mapStatusToStageId(normalizeStatus(a.status), DEFAULT_STAGES)
          if (resolved !== stageFilter) return false
        }
      }

      if (filters?.search && !a.displayName.toLowerCase().includes(filters.search.toLowerCase())) return false

      if (!includesText(localFilters.name, a.displayName)) return false
      if (a.matchPercentage < localFilters.matchRange[0] || a.matchPercentage > localFilters.matchRange[1]) return false

      if (!matchesAny(localFilters.programmeType, formatLabel(a.programmeType))) return false

      if (localFilters.supportOffered.length > 0) {
        if (!localFilters.supportOffered.some((tag) => a.supportTags.includes(tag))) return false
      }

      if (!includesText(localFilters.durationText, a.durationText)) return false

      const deadlineISO = toISODateOnly(a.deadline)
      if (localFilters.deadlineFrom && (!deadlineISO || deadlineISO < localFilters.deadlineFrom)) return false
      if (localFilters.deadlineTo && (!deadlineISO || deadlineISO > localFilters.deadlineTo)) return false

      if (localFilters.responsiveness.length > 0) {
        if (!localFilters.responsiveness.includes(responsivenessBucket(a.responsiveness))) return false
      }

      if (localFilters.status.length > 0) {
        const value = a.applied ? a.status : "Matched"
        if (!localFilters.status.some((v) => (value || "").toLowerCase().includes(v.toLowerCase()))) return false
      }

      if (!includesText(localFilters.programmeSponsor, a.programmeSponsor)) return false
      if (!matchesAny(localFilters.sectorFocus, formatLabel(a.sectorFocus))) return false
      if (!includesText(localFilters.location, a.location)) return false
      if (!matchesAny(localFilters.geographicFocus, formatLabel(a.geographicFocus))) return false
      if (!matchesAny(localFilters.deliveryFormat, formatLabel(a.deliveryFormat))) return false
      if (!includesText(localFilters.cohortSize, a.cohortSize)) return false
      if (!includesText(localFilters.programmeCost, a.programmeCost)) return false
      if (!includesText(localFilters.eligibility, a.eligibility)) return false
      if (!includesText(localFilters.fundingAvailable, a.fundingAvailable)) return false
      if (!matchesAny(localFilters.fundingStage, formatLabel(a.fundingStage))) return false
      if (!matchesAny(localFilters.fundingType, formatLabel(a.fundingType))) return false
      if (!includesText(localFilters.servicesOffered, formatLabel(a.servicesOffered))) return false
      if (!includesText(localFilters.reportingRequirements, a.reportingRequirements)) return false

      if (localFilters.nextStage.length > 0) {
        const next = a.applied ? getNextStageName(a.status) : "Applied"
        if (!localFilters.nextStage.some((v) => (next || "").toLowerCase().includes(v.toLowerCase()))) return false
      }

      return true
    })

    if (sortConfig?.key) {
      const accessors = {
        name: (r) => r.programmeName || r.name,
        match: (r) => r.matchPercentage || 0,
        programmeType: (r) => r.programmeType,
        duration: (r) => r.durationText,
        deadline: (r) => new Date(r.deadline).getTime() || 0,
        responsiveness: (r) => r.responsiveness?.medianBusinessDays ?? 9999,
        status: (r) => (r.applied ? r.status : "Matched"),
        programmeSponsor: (r) => r.programmeSponsor,
        sectorFocus: (r) => r.sectorFocus,
        location: (r) => r.location,
        geographicFocus: (r) => r.geographicFocus,
        deliveryFormat: (r) => r.deliveryFormat,
        cohortSize: (r) => r.cohortSize,
        programmeCost: (r) => r.programmeCost,
        fundingAvailable: (r) => r.fundingAvailable,
        fundingStage: (r) => r.fundingStage,
        fundingType: (r) => r.fundingType,
        dateMatched: (r) => new Date(r.dateMatched?.toDate?.() || r.dateMatched || 0).getTime() || 0,
      }
      const accessor = accessors[sortConfig.key]
      if (accessor) {
        rows.sort((a, b) => {
          const av = accessor(a)
          const bv = accessor(b)
          if (typeof av === "number" && typeof bv === "number") return sortConfig.dir === "asc" ? av - bv : bv - av
          const cmp = (av || "").toString().localeCompare((bv || "").toString())
          return sortConfig.dir === "asc" ? cmp : -cmp
        })
      }
    }

    return rows
  }, [accelerators, localFilters, sortConfig, stageFilter, filters, hiddenMatches])

  useEffect(() => {
    if (onMatchesCountChange) onMatchesCountChange(filteredAccelerators.length)
  }, [filteredAccelerators, onMatchesCountChange])

  /* ─── Filter chrome ───────────────────────────────────────────────────── */
  const activeFilterCount =
    (localFilters.name.trim() ? 1 : 0) +
    (localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100 ? 1 : 0) +
    localFilters.programmeType.length +
    localFilters.supportOffered.length +
    (localFilters.durationText.trim() ? 1 : 0) +
    (localFilters.deadlineFrom || localFilters.deadlineTo ? 1 : 0) +
    localFilters.responsiveness.length +
    localFilters.status.length +
    (localFilters.programmeSponsor.trim() ? 1 : 0) +
    localFilters.sectorFocus.length +
    (localFilters.location.trim() ? 1 : 0) +
    localFilters.geographicFocus.length +
    localFilters.deliveryFormat.length +
    (localFilters.cohortSize.trim() ? 1 : 0) +
    (localFilters.programmeCost.trim() ? 1 : 0) +
    (localFilters.eligibility.trim() ? 1 : 0) +
    (localFilters.fundingAvailable.trim() ? 1 : 0) +
    localFilters.fundingStage.length +
    localFilters.fundingType.length +
    (localFilters.servicesOffered.trim() ? 1 : 0) +
    (localFilters.reportingRequirements.trim() ? 1 : 0) +
    localFilters.nextStage.length

  const clearAllFilters = () => {
    setLocalFilters({ ...EMPTY_FILTERS })
    setSortConfig(null)
  }

  const getFilterActive = (filterType) => {
    switch (filterType) {
      case "match":
        return localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100
      case "programmeType":
        return localFilters.programmeType.length > 0
      case "supportOffered":
        return localFilters.supportOffered.length > 0
      case "duration":
        return !!localFilters.durationText.trim()
      case "deadline":
        return !!localFilters.deadlineFrom || !!localFilters.deadlineTo
      case "responsiveness":
        return localFilters.responsiveness.length > 0
      case "status":
        return localFilters.status.length > 0
      case "nextStage":
        return localFilters.nextStage.length > 0
      case "sectorFocus":
        return localFilters.sectorFocus.length > 0
      case "geographicFocus":
        return localFilters.geographicFocus.length > 0
      case "deliveryFormat":
        return localFilters.deliveryFormat.length > 0
      case "fundingStage":
        return localFilters.fundingStage.length > 0
      case "fundingType":
        return localFilters.fundingType.length > 0
      case "programmeSponsor":
        return !!localFilters.programmeSponsor.trim()
      case "location":
        return !!localFilters.location.trim()
      case "cohortSize":
        return !!localFilters.cohortSize.trim()
      case "programmeCost":
        return !!localFilters.programmeCost.trim()
      case "eligibility":
        return !!localFilters.eligibility.trim()
      case "fundingAvailable":
        return !!localFilters.fundingAvailable.trim()
      case "servicesOffered":
        return !!localFilters.servicesOffered.trim()
      case "reportingRequirements":
        return !!localFilters.reportingRequirements.trim()
      default:
        return false
    }
  }

  const toggleChip = (field, value) =>
    setLocalFilters((p) => ({
      ...p,
      [field]: p[field].includes(value) ? p[field].filter((x) => x !== value) : [...p[field], value],
    }))

  /* ─── Layout ──────────────────────────────────────────────────────────── */
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
    // Left-pinned columns stack to the right of the frozen first column.
    let leftAcc = CATALYST_WIDTH
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
  }, [orderedColumns, pinned, widthOf])

  const totalWidth = CATALYST_WIDTH + ACTION_WIDTH + orderedColumns.reduce((sum, key) => sum + widthOf(key), 0)

  const cellPad = density === "compact" ? "py-2 px-2" : density === "ultra-compact" ? "py-1.5 px-1.5" : "py-3 px-3"
  const cellFont = density === "comfortable" ? "text-sm" : "text-xs"
  const headerPadding = density === "comfortable" ? "0.7rem 0.6rem" : "0.5rem 0.6rem"

  const searchedColumns = DEFAULT_COLUMN_ORDER.filter((key) =>
    COLUMN_DEFS[key].label.toLowerCase().includes(columnSearch.toLowerCase()),
  )

  /* ─── Cell renderer ───────────────────────────────────────────────────── */
  const renderCell = (key, a, rowBg) => {
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
    const cls = `${cellPad} ${cellFont} text-[#4a352f] border-r border-b border-[#e6d7c3] align-top`

    switch (key) {
      case "match":
        return (
          <td key={key} className={`${cellPad} text-center border-r border-b border-[#e6d7c3] align-top`} style={stickyStyle}>
            <div className="flex flex-col items-center gap-1 w-full">
              <div className="flex items-center gap-1">
                <span className={`${cellFont} font-semibold text-[#4a352f]`}>{a.matchPercentage}%</span>
                {/* Spec: "Why this match?" sits beside Match %, not in Action */}
                <button
                  onClick={(e) => openPopupFromEvent("match", a, e)}
                  title="Why this match?"
                  aria-label="Why this match?"
                  className="text-[#a67c52] hover:text-[#4a352f]"
                >
                  <HelpCircle size={13} />
                </button>
              </div>
              <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#48BB78] to-[#68d391]"
                  style={{ width: `${a.matchPercentage}%` }}
                />
              </div>
            </div>
          </td>
        )

      case "programmeType":
        return (
          <td key={key} className={cls} style={stickyStyle}>
            <TruncatedText text={formatLabel(a.programmeType)} maxLength={24} />
          </td>
        )

      case "supportOffered":
        return (
          <td key={key} className={cls} style={stickyStyle}>
            {a.supportTags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {a.supportTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-[#f5f0e1] text-[#4a352f] text-[10px] font-medium whitespace-nowrap"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[#a89482]">-</span>
            )}
          </td>
        )

      case "duration":
        return (
          <td key={key} className={cls} style={stickyStyle}>
            <div className="leading-snug">
              <div>{a.durationText && a.durationText !== "-" ? a.durationText : <span className="text-[#a89482]">-</span>}</div>
              {formatDateValue(a.startDate) && (
                <div className="text-[10px] text-[#a89482] mt-0.5">Starts {formatDateValue(a.startDate)}</div>
              )}
            </div>
          </td>
        )

      case "deadline":
        return (
          <td key={key} className={cls} style={stickyStyle}>
            {formatDateValue(a.deadline) || <span className="text-[#a89482]">Rolling / unspecified</span>}
          </td>
        )

      case "responsiveness": {
        const r = a.responsiveness
        const range = r && !r.belowThreshold ? formatResponsivenessRange(r.medianBusinessDays) : null
        return (
          <td key={key} className={cls} style={stickyStyle}>
            {range ? (
              <div className="leading-snug">
                <div className="flex items-center gap-1">
                  <Gauge size={11} className="text-[#a67c52] flex-shrink-0" />
                  <span className="font-medium">{range}</span>
                </div>
                <div className="text-[10px] text-[#a89482] mt-0.5">{r.answeredPct}% of enquiries answered</div>
              </div>
            ) : (
              <span className="text-[10px] text-[#a89482] italic">Not enough data</span>
            )}
          </td>
        )
      }

      case "status": {
        const meta = getStatusMeta(a.applied ? a.status : "Matched")
        return (
          <td key={key} className={`${cellPad} border-r border-b border-[#e6d7c3] align-top`} style={stickyStyle}>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ backgroundColor: meta.colors.bgColor, color: meta.colors.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.colors.color }} />
              {a.applied ? meta.label : "New Match"}
            </span>
          </td>
        )
      }

      case "nextStage":
        return (
          <td key={key} className={cls} style={stickyStyle}>
            {/* Derived live from the current status — the old column rendered
                the value frozen at application time, so it went stale as soon
                as the catalyst advanced anything. */}
            <span className="text-xs font-medium">{a.applied ? getNextStageName(a.status) : "Applied"}</span>
          </td>
        )

      case "dateMatched":
        return (
          <td key={key} className={cls} style={stickyStyle}>
            {formatDateValue(a.dateMatched?.toDate?.() || a.dateMatched) || <span className="text-[#a89482]">-</span>}
          </td>
        )

      case "programmeSponsor":
        return <td key={key} className={cls} style={stickyStyle}><TruncatedText text={a.programmeSponsor} maxLength={24} /></td>
      case "sectorFocus":
        return <td key={key} className={cls} style={stickyStyle}><TruncatedText text={formatLabel(a.sectorFocus)} maxLength={24} /></td>
      case "location":
        return <td key={key} className={cls} style={stickyStyle}><TruncatedText text={formatLabel(a.location)} maxLength={20} /></td>
      case "geographicFocus":
        return <td key={key} className={cls} style={stickyStyle}><TruncatedText text={formatLabel(a.geographicFocus)} maxLength={24} /></td>
      case "deliveryFormat":
        return <td key={key} className={cls} style={stickyStyle}><TruncatedText text={formatLabel(a.deliveryFormat)} maxLength={20} /></td>
      case "cohortSize":
        return <td key={key} className={cls} style={stickyStyle}>{a.cohortSize}</td>
      case "programmeCost":
        return <td key={key} className={cls} style={stickyStyle}>{a.programmeCost}</td>
      case "eligibility":
        return <td key={key} className={cls} style={stickyStyle}><TruncatedText text={a.eligibility} maxLength={40} /></td>
      case "fundingAvailable":
        return <td key={key} className={cls} style={stickyStyle}>{a.fundingAvailable}</td>
      case "fundingStage":
        return <td key={key} className={cls} style={stickyStyle}><TruncatedText text={formatLabel(a.fundingStage)} maxLength={20} /></td>
      case "fundingType":
        return <td key={key} className={cls} style={stickyStyle}><TruncatedText text={formatLabel(a.fundingType)} maxLength={20} /></td>
      case "servicesOffered":
        return <td key={key} className={cls} style={stickyStyle}><TruncatedText text={formatLabel(a.servicesOffered)} maxLength={30} /></td>
      case "reportingRequirements":
        return <td key={key} className={cls} style={stickyStyle}><TruncatedText text={a.reportingRequirements} maxLength={40} /></td>

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 text-[#a67c52]">
        <p>Loading catalysts...</p>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <div style={{ width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
        {isCompanyMember && (
          <div
            className="rounded-xl mb-6 p-4 shadow-md"
            style={{
              backgroundColor: userRole === "viewer" ? "#fef3c7" : "#e0f2fe",
              border: `2px solid ${userRole === "viewer" ? "#f59e0b" : "#0369a1"}`,
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🤝</span>
              <h3 className="m-0 font-bold text-lg" style={{ color: userRole === "viewer" ? "#f59e0b" : "#0369a1" }}>
                Company Catalyst Applications — Role: {userRole?.toUpperCase()}
              </h3>
            </div>
            <p className="m-0 text-sm leading-relaxed text-[#4a5568]">
              {userRole === "owner" && "You can view and manage all company catalyst applications."}
              {userRole === "admin" && "You can view and submit catalyst applications for the company."}
              {userRole === "manager" && "You can view catalyst applications and track their progress."}
              {userRole === "employee" && "You can view company catalyst applications."}
              {userRole === "viewer" && "You have read-only access to company catalyst applications."}
            </p>
          </div>
        )}

        {/* Inline banner, same as the other match tables */}
        {notification && (
          <div
            className={`px-4 py-3 rounded-xl text-sm font-medium border mb-3 ${
              notification.type === "success"
                ? "bg-green-50 text-green-800 border-green-200"
                : notification.type === "warning"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : notification.type === "info"
                    ? "bg-[#faf7f2] text-[#4a352f] border-[#e6d7c3]"
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
              <h2 className="text-lg font-bold text-[#4a352f] m-0">Catalyst Matches</h2>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
                <LayoutGrid size={12} className="text-[#7d5a50] flex-shrink-0" />
                Viewing: {activeView.name}
                {activeView.description && <span className="font-normal text-[#a89482]"> — {activeView.description}</span>}
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
                                    onChange={(e) => setEditingViewMeta((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="Description (optional) — what is this view for?"
                                    rows={2}
                                    className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingViewMeta(null)} className="px-2.5 py-1 text-xs text-[#7d5a50] hover:text-[#4a352f]">
                                      Cancel
                                    </button>
                                    <button onClick={saveViewMeta} className="px-2.5 py-1 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold">
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
                                    <span className={`text-sm ${isActive ? "font-semibold text-[#4a352f]" : "text-[#4a352f]"}`}>{view.name}</span>
                                    {view.builtin && (
                                      <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Built-in</span>
                                    )}
                                  </div>
                                  {view.description && <p className="text-xs text-[#a89482] mt-0.5 truncate">{view.description}</p>}
                                </button>
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  <button onClick={() => startEditingViewMeta(view)} title="Rename / edit description" className="text-[#a89482] hover:text-[#7d5a50] p-1">
                                    <Settings size={13} />
                                  </button>
                                  {!view.builtin && (
                                    <button onClick={() => removeView(view.id)} title="Delete view" className="text-[#a89482] hover:text-red-500 p-1">
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
                          <GripVertical size={12} className="flex-shrink-0" /> Drag a header to reorder, drag its right edge to resize.
                        </p>

                        <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                          <input type="checkbox" checked disabled className="rounded border-[#c8b6a6]" />
                          <span className="text-sm text-[#4a352f] flex-1">Programme</span>
                          <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Pinned</span>
                        </div>
                        <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                          <input type="checkbox" checked disabled className="rounded border-[#c8b6a6]" />
                          <span className="text-sm text-[#4a352f] flex-1">Action</span>
                          <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Always last</span>
                        </div>
                        <div className="border-t border-[#e6d7c3] my-2" />

                        {searchedColumns.length === 0 && <p className="text-xs text-[#a89482] px-2 py-1.5">No columns match that search.</p>}
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
                            { key: "ultra-compact", label: "Ultra" },
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
              /* No 'position: relative' here — it silently overrode the sticky
                 positioning on every <th>, so the header scrolled away while
                 the pinned body cells stayed. Sticky is itself a positioned
                 ancestor, so the grip and resize handle still anchor.
                 Prefix is kt- (not at-) to avoid colliding with AdvisorTable's
                 styles when both are mounted on the same page. */
              .kt-th { color: #faf7f2 !important; vertical-align: top !important; }
              .kt-th-draggable { cursor: grab; }
              .kt-th-draggable:active { cursor: grabbing; }
              .kt-th-row { display: flex; align-items: flex-start; gap: 2px; min-width: 0; }
              /* overflow-wrap: normal stops the browser splitting inside a word,
                 which is what turned "Match %" into "MAT CH.." and "Status" into
                 "STA TUS" in narrow columns. */
              .kt-th-label {
                flex: 1 1 auto; min-width: 0;
                display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
                overflow: hidden; white-space: normal;
                overflow-wrap: normal; word-break: normal; hyphens: none;
                line-height: 1.2; letter-spacing: 0.02em;
              }
              .kt-th-tools { display: flex; align-items: center; flex-shrink: 0; }
              /* The drag grip leaves the flex flow and only appears on hover,
                 buying every header ~14px more room for its label. */
              .kt-th-grip { position: absolute; left: 3px; top: 10px; opacity: 0; transition: opacity .15s; }
              .kt-th:hover .kt-th-grip { opacity: .45; }
              .kt-resize { position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: col-resize; }
              .kt-resize:hover { background: rgba(255,255,255,0.25); }
            `}</style>

            <table
              className="text-sm"
              style={{
                /* separate (not collapse) — collapsed borders are dropped by
                   sticky cells, which made the pinned column lose its edge and
                   mispaint over its neighbour while scrolling. */
                borderCollapse: "separate",
                borderSpacing: 0,
                tableLayout: "fixed",
                width: totalWidth,
                minWidth: "100%",
              }}
            >
              <thead>
                <tr>
                  <th
                    className="kt-th text-left font-semibold uppercase tracking-wider text-xs sticky top-0 left-0 z-30"
                    style={{
                      backgroundColor: "#4a352f",
                      width: CATALYST_WIDTH,
                      padding: headerPadding,
                      borderBottom: "1px solid #e6d7c3",
                      boxShadow: "2px 0 0 #e6d7c3",
                    }}
                  >
                    <div className="kt-th-row">
                      <span className="kt-th-label" title="Programme">
                        Programme
                      </span>
                      <span className="kt-th-tools">
                        <SortTrigger columnKey="name" />
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
                        className={`kt-th kt-th-draggable font-semibold uppercase tracking-wider text-xs sticky top-0 select-none transition-opacity ${
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
                        <GripVertical size={11} className="kt-th-grip" />
                        <div className={`kt-th-row ${col.align === "center" ? "justify-center" : ""}`}>
                          <span className="kt-th-label" title={col.label}>
                            {col.label}
                          </span>
                          <span className="kt-th-tools">
                            {pinned[key] && <Pin size={10} className="opacity-60 mt-0.5" />}
                            {col.sortable && <SortTrigger columnKey={key} />}
                            {col.filterType && <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} />}
                          </span>
                        </div>
                        <div className="kt-resize" onMouseDown={(e) => startResize(e, key)} onClick={(e) => e.stopPropagation()} />
                      </th>
                    )
                  })}

                  {/* Action scrolls horizontally with the table — only top-0, so
                      it still holds position on vertical scroll. */}
                  <th
                    className="kt-th text-center font-semibold uppercase tracking-wider text-xs sticky top-0 z-20"
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
                {filteredAccelerators.length === 0 ? (
                  <tr>
                    <td colSpan={orderedColumns.length + 2} className="text-center py-12 border-b border-[#e6d7c3]">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-[#f5f0e1] flex items-center justify-center">
                          <Rocket size={26} className="text-[#7d5a50] opacity-50" />
                        </div>
                        <p className="text-sm font-semibold text-[#4a352f] m-0">
                          {accelerators.length === 0 ? "No catalyst matches yet" : "No programmes match these filters"}
                        </p>
                        <p className="text-xs text-[#a89482] m-0">
                          {accelerators.length === 0
                            ? "Programmes will appear here once catalysts publish them."
                            : "Clear a filter to widen the results."}
                        </p>
                        {activeFilterCount > 0 && accelerators.length > 0 && (
                          <button onClick={clearAllFilters} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7d5a50] text-white">
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAccelerators.map((a) => {
                    const meta = getStatusMeta(a.applied ? a.status : "Matched")
                    const actions = getRowActions(a.applied, meta.stage?.name)
                    const isSaved = !!savedMatches[a.id]
                    const isApplying = applyingRow === a.id
                    const rowBg = hoveredRowKey === a.id ? "#fdf8f4" : "#ffffff"

                    const runAction = (kind) => {
                      if (kind === "apply") return handleApplyClick(a)
                      return handleViewClick(a)
                    }

                    return (
                      <tr
                        key={a.id}
                        onMouseEnter={() => setHoveredRowKey(a.id)}
                        onMouseLeave={() => setHoveredRowKey(null)}
                        style={{ backgroundColor: rowBg, transition: "background-color .15s" }}
                      >
                        {/* Programme — pinned left. Name only; the catalyst is
                            searchable by name and shown in the details modal. */}
                        <td
                          className={`${cellPad} sticky left-0 z-10 align-top border-b border-[#e6d7c3]`}
                          style={{ width: CATALYST_WIDTH, backgroundColor: rowBg, boxShadow: "2px 0 0 #e6d7c3" }}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-[#4a352f] break-words text-sm">{a.programmeName || a.name}</span>
                            <button
                              onClick={() => handleViewClick(a)}
                              className="text-[#a89482] hover:text-[#7d5a50] transition-colors flex-shrink-0"
                              aria-label={`View details for ${a.displayName}`}
                              title="View programme details"
                            >
                              <Eye size={13} />
                            </button>
                          </div>
                        </td>

                        {orderedColumns.map((key) => renderCell(key, a, rowBg))}

                        {/* Action — scrolls with the table */}
                        <td
                          className={`${cellPad} align-top border-b border-[#e6d7c3] text-center`}
                          style={{ width: ACTION_WIDTH, backgroundColor: rowBg }}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => runAction(actions.kind)}
                              disabled={isApplying}
                              title={actions.primary}
                              className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 disabled:opacity-60 ${
                                actions.terminal ? "bg-[#e6d7c3]/60 text-[#a89482]" : "text-white hover:shadow-md hover:brightness-105"
                              }`}
                              style={{ width: "126px", height: "34px", backgroundColor: actions.terminal ? undefined : "#7d5a50" }}
                            >
                              {!actions.terminal && !isApplying && <ArrowRight size={13} className="flex-shrink-0" />}
                              <span className="truncate">{isApplying ? "Sending..." : actions.primary}</span>
                            </button>

                            <button
                              onClick={() => setSavedMatches((p) => ({ ...p, [a.id]: !p[a.id] }))}
                              title={isSaved ? "Remove from saved" : "Save match"}
                              aria-label={isSaved ? "Remove from saved" : "Save match"}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-[#f5f0e1] flex-shrink-0"
                              style={{ color: isSaved ? "#a67c52" : "#c8b6a6" }}
                            >
                              <Bookmark size={14} fill={isSaved ? "#a67c52" : "none"} />
                            </button>

                            <button
                              onClick={(e) => openPopupFromEvent("quickActions", a, e)}
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
      </div>

      {/* Drag hint */}
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

      {/* ─── Quick Actions popup ───────────────────────────────────────── */}
      {activePopup?.type === "quickActions" && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div
            className="fixed z-[1001] bg-white rounded-xl shadow-2xl border border-[#e6d7c3] py-1 overflow-hidden"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: "216px" }}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#e6d7c3]">
              <span className="text-xs font-semibold text-[#4a352f]">Quick Actions</span>
              <button onClick={closePopup} className="text-[#7d5a50] hover:text-[#4a352f]">
                <X size={14} />
              </button>
            </div>
            <button
              onClick={() => handleViewClick(activePopup.row)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Eye size={12} /> View Programme
            </button>
            <button
              onClick={() => openPopup("match", activePopup.row, activePopup.rect)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Target size={12} /> Why This Match?
            </button>
            <button
              onClick={() => openPopup("match", activePopup.row, activePopup.rect)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <CheckCircle size={12} /> Check Eligibility
            </button>
            <button
              onClick={() => {
                closePopup()
                notify("info", '"Compare" is not wired up yet.', 2500)
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Layers size={12} /> Compare
            </button>
            <button
              onClick={() => {
                closePopup()
                notify("info", '"Add Note" is not wired up yet.', 2500)
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <StickyNote size={12} /> Add Note
            </button>
            <button
              onClick={() => {
                const target = activePopup.row
                closePopup()
                setHiddenMatches((p) => ({ ...p, [target.id]: true }))
                notify("info", `${target.displayName} hidden from your matches.`)
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <EyeOff size={12} /> Hide Match
            </button>
            <button
              onClick={() => {
                closePopup()
                notify("info", '"Report" is not wired up yet.', 2500)
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#D32F2F] hover:bg-[#faf7f2] text-left"
            >
              <Flag size={12} /> Report
            </button>
          </div>
        </PopupPortal>
      )}

      {/* ─── Why this match? — anchored popover ─────────────────────────── */}
      {activePopup?.type === "match" && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div
            className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
            style={{
              top: activePopup.position.y,
              left: activePopup.position.x,
              width: "400px",
              maxHeight: "520px",
              overflowY: "auto",
            }}
          >
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Why this match?</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[220px]">
                    {activePopup.row.programmeName || activePopup.row.name}
                  </h3>
                  {activePopup.row.programmeName && (
                    <p className="text-[11px] text-[#e6d7c3] m-0 truncate max-w-[220px]">{activePopup.row.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold">{activePopup.row.matchPercentage || 0}%</div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {activePopup.row.matchBreakdown ? (
                Object.entries(activePopup.row.matchBreakdown).map(([key, breakdown]) => {
                  if (!breakdown || typeof breakdown !== "object") return null
                  const color = breakdown.matched ? "#22c55e" : "#ef4444"
                  const titles = {
                    fundingStage: "Funding Stage Match",
                    ticketSize: "Ticket Size Compatibility",
                    geographicFit: "Geographic Fit",
                    sectorMatch: "Sector Match",
                    instrumentFit: "Instrument Fit",
                    supportMatch: "Support Match",
                    legalEntityFit: "Legal Entity Fit",
                    revenueThreshold: "Revenue Threshold",
                  }
                  return (
                    <div key={key} className="p-3 rounded-lg border border-[#e6d7c3] bg-[#faf7f2] text-xs">
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <span className="font-semibold text-[#4a352f]">{titles[key] || formatLabel(key)}</span>
                        <span className="font-bold flex-shrink-0" style={{ color }}>
                          {breakdown.matched ? "Match" : "No match"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full" style={{ width: breakdown.matched ? "100%" : "0%", backgroundColor: color }} />
                      </div>
                      <div className="text-[11px] text-[#7d5a50] leading-relaxed">
                        <div>
                          <span className="font-semibold">Your need:</span> {breakdown.details?.smeValue || "N/A"}
                        </div>
                        <div className="mt-0.5">
                          <span className="font-semibold">Programme offers:</span> {breakdown.details?.accelValue || "N/A"}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-[#a89482] text-center py-4">No breakdown available for this programme yet.</p>
              )}
            </div>
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
                  <label className="text-xs font-semibold text-[#4a352f]">Programme / catalyst</label>
                  {localFilters.name && (
                    <button onClick={() => setLocalFilters((p) => ({ ...p, name: "" }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">
                      Clear
                    </button>
                  )}
                </div>
                <input
                  autoFocus
                  type="text"
                  value={localFilters.name}
                  onChange={(e) => setLocalFilters((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Search name..."
                  className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
                />
              </>
            )}

            {headerFilterOpen.type === "match" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">
                    Match %: {localFilters.matchRange[0]} - {localFilters.matchRange[1]}
                  </label>
                  {(localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100) && (
                    <button onClick={() => setLocalFilters((p) => ({ ...p, matchRange: [0, 100] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">
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
                        matchRange: [Math.min(Number.parseInt(e.target.value) || 0, p.matchRange[1]), p.matchRange[1]],
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
                        matchRange: [p.matchRange[0], Math.max(Number.parseInt(e.target.value) || 0, p.matchRange[0])],
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
                  onChange={(e) => setLocalFilters((p) => ({ ...p, matchRange: [Number.parseInt(e.target.value), p.matchRange[1]] }))}
                  className="w-full accent-[#7d5a50]"
                />
              </>
            )}

            {headerFilterOpen.type === "deadline" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Application deadline</label>
                  {(localFilters.deadlineFrom || localFilters.deadlineTo) && (
                    <button onClick={() => setLocalFilters((p) => ({ ...p, deadlineFrom: "", deadlineTo: "" }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={localFilters.deadlineFrom}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, deadlineFrom: e.target.value }))}
                    className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                  />
                  <span className="text-[#7d5a50] text-xs">to</span>
                  <input
                    type="date"
                    value={localFilters.deadlineTo}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, deadlineTo: e.target.value }))}
                    className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                  />
                </div>
                <p className="text-[10px] text-[#a89482] mt-2">Rolling / unspecified deadlines are excluded when a range is set.</p>
              </>
            )}

            {headerFilterOpen.type === "responsiveness" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Responsiveness</label>
                  {localFilters.responsiveness.length > 0 && (
                    <button onClick={() => setLocalFilters((p) => ({ ...p, responsiveness: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {RESPONSIVENESS_BUCKETS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => toggleChip("responsiveness", b.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        localFilters.responsiveness.includes(b.id) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#a89482] mt-2.5 leading-relaxed">
                  Median business days from your action to the catalyst's first meaningful response. Shown only once at
                  least {MIN_RESPONSIVENESS_SAMPLE} eligible enquiries exist.
                </p>
              </>
            )}

            {[
              { type: "programmeType", field: "programmeType", label: "Programme Type", options: uniqueProgrammeTypes },
              { type: "supportOffered", field: "supportOffered", label: "Support Offered", options: SUPPORT_TAGS.map((t) => t.label) },
              { type: "status", field: "status", label: "Status", options: statusOptions },
              { type: "nextStage", field: "nextStage", label: "Next Stage", options: statusOptions },
              { type: "sectorFocus", field: "sectorFocus", label: "Sector Focus", options: uniqueSectors },
              { type: "geographicFocus", field: "geographicFocus", label: "Geographic Focus", options: geographicFocusOptions.map((o) => o.label) },
              { type: "deliveryFormat", field: "deliveryFormat", label: "Delivery Format", options: uniqueDeliveryFormats },
              { type: "fundingStage", field: "fundingStage", label: "Funding Stage", options: uniqueFundingStages },
              { type: "fundingType", field: "fundingType", label: "Funding Type", options: uniqueFundingTypes },
            ].map(
              ({ type, field, label, options }) =>
                headerFilterOpen.type === type && (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-semibold text-[#4a352f]">{label}</label>
                      {localFilters[field].length > 0 && (
                        <button onClick={() => setLocalFilters((p) => ({ ...p, [field]: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">
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
                            localFilters[field].includes(value) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ),
            )}

            {[
              { type: "duration", field: "durationText", label: "Duration / Start Date", placeholder: "e.g. 6 months" },
              { type: "programmeSponsor", field: "programmeSponsor", label: "Programme Sponsor", placeholder: "Search sponsor..." },
              { type: "location", field: "location", label: "Location", placeholder: "Search location..." },
              { type: "cohortSize", field: "cohortSize", label: "Cohort Size", placeholder: "Search cohort size..." },
              { type: "programmeCost", field: "programmeCost", label: "Programme Cost", placeholder: "Search cost..." },
              { type: "eligibility", field: "eligibility", label: "Eligibility Requirements", placeholder: "Search eligibility..." },
              { type: "fundingAvailable", field: "fundingAvailable", label: "Funding Available", placeholder: "Search amount..." },
              { type: "servicesOffered", field: "servicesOffered", label: "Services Offered", placeholder: "Search services..." },
              { type: "reportingRequirements", field: "reportingRequirements", label: "Reporting Requirements", placeholder: "Search requirements..." },
            ].map(
              ({ type, field, label, placeholder }) =>
                headerFilterOpen.type === type && (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-[#4a352f]">{label}</label>
                      {localFilters[field] && (
                        <button onClick={() => setLocalFilters((p) => ({ ...p, [field]: "" }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      autoFocus
                      type="text"
                      value={localFilters[field]}
                      onChange={(e) => setLocalFilters((p) => ({ ...p, [field]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
                    />
                  </div>
                ),
            )}
          </div>
        </PopupPortal>
      )}

      {mounted && showCatalystDetails && selectedCatalystDetails && (
        <CatalystDetailsModal
          catalyst={selectedCatalystDetails}
          isOpen={showCatalystDetails}
          onClose={() => {
            setShowCatalystDetails(false)
            setSelectedCatalystDetails(null)
          }}
        />
      )}
    </>
  )
}

export default AcceleratorTable