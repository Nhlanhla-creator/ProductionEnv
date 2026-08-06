"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import {
  Eye,
  X,
  XCircle,
  HelpCircle,
  Target,
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
  EyeOff,
  Users,
  Info,
  Hash,
  ShieldCheck,
  Clock,
} from "lucide-react"
import {
  collection,
  getDocs,
  doc,
  setDoc,
  addDoc,
  getDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../../firebaseConfig"
import AdvisorDetailsModal from "./AdvisorDetailsModal"
import {
  deriveAdvisorVerification,
  getVerificationStyle,
  VERIFICATION_CATEGORY_LABELS,
} from "./advisorVerification"

/* ════════════════════════════════════════════════════════════════════════════
   This file no longer imports ./matchTableKit.

   The kit rendered the header row, and its own <style> block set
   `position: relative` on every <th>, which overrode the sticky positioning.
   The result was a header that scrolled away while the pinned body cells
   stayed frozen — the Advisor names sliding over Role / Expertise, and the
   ACTION label drifting away from its buttons. Rather than patch around that
   from the outside, the table now owns its own head, toolbar, filters and row
   actions, identical to InternTablePage.
   ════════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════════════
   Collections.

   There were four names for one relationship: this table wrote AdvisoryMatches,
   AdvisorApplications and SmeAdvisorApplications, while the tabbed shell read
   and updated smseAdvisoryMatches. Two documents is enough for the pipeline:
   one keyed for the SME's view, one for the advisor's.

   smseAdvisoryMatches is a third thing and is *not* dead — the AI matching
   backend (analyzeAdvisorMatches) writes it, and the Applications page counts
   from it. This table reads it below purely to learn which application each
   advisor was matched under; it never writes it.
   ════════════════════════════════════════════════════════════════════════ */
export const SME_ADVISOR_COLLECTION = "SmeAdvisorApplications"
export const ADVISOR_SME_COLLECTION = "AdvisorApplications"
export const AI_MATCHES_COLLECTION = "smseAdvisoryMatches"
export const smeAdvisorId = (smeId, advisorId) => `${smeId}_${advisorId}`
export const advisorSmeId = (advisorId, smeId) => `${advisorId}_${smeId}`

/* ════════════════════════════════════════════════════════════════════════════
   Events the pipeline and the Applications page use to talk to this table.

     ADVISOR_STAGE_FILTER_EVENT        pipeline → table. Detail is the pressed
                                       status name, or null to clear.
     ADVISOR_APPLICATION_FILTER_EVENT  Applications page → table. Detail is an
                                       application id to scope to, or null for
                                       "View All Matches".
     ADVISOR_MATCH_RANGE_EVENT         Applications page → table. Detail is a
                                       [min, max] score band, from the band
                                       picker on the row that was opened.
     ADVISOR_ROWS_EVENT                table → pipeline. Every advisor that
                                       passes the table's other filters.
     ADVISOR_ROWS_REQUEST_EVENT        pipeline → table. Asks for a re-broadcast.
   ════════════════════════════════════════════════════════════════════════ */
export const ADVISOR_STAGE_FILTER_EVENT = "advisor-pipeline-stage-filter"
export const ADVISOR_APPLICATION_FILTER_EVENT = "advisor-application-filter"
export const ADVISOR_MATCH_RANGE_EVENT = "advisor-match-range-filter"
export const ADVISOR_ROWS_EVENT = "advisor-pipeline-rows"
export const ADVISOR_ROWS_REQUEST_EVENT = "advisor-pipeline-rows-request"

/* ─── Status vocabulary (spec section 3 + advisor additions) ─────────────── */
export const ADVISOR_STATUSES = [
  "New Match",
  "Viewed",
  "Shortlisted",
  "Contacted",
  "Under Review",
  "Interviewing",
  "Accepted",
  "Engaged/Placed",
  "Declined",
  "Closed",
]

const LEGACY_STATUS_ALIASES = {
  Match: "New Match",
  Matched: "New Match",
  Confirmed: "Accepted",
  "Deal Successful": "Engaged/Placed",
  "Deal Declined": "Declined",
  Pending: "Contacted",
}
export const normalizeAdvisorStatus = (s) => LEGACY_STATUS_ALIASES[s] || s || "New Match"

const STATUS_TYPES = {
  "New Match": { color: "#F5F0E1", textColor: "#7D5A50" },
  Viewed: { color: "#EFEBE9", textColor: "#5D4037" },
  Shortlisted: { color: "#FFF3E0", textColor: "#F57C00" },
  Contacted: { color: "#E8EAF6", textColor: "#3949AB" },
  "Under Review": { color: "#E3F2FD", textColor: "#1565C0" },
  Interviewing: { color: "#F3E5F5", textColor: "#7B1FA2" },
  Accepted: { color: "#E8F5E8", textColor: "#388E3C" },
  "Engaged/Placed": { color: "#E0F2F1", textColor: "#00695C" },
  Declined: { color: "#FFEBEE", textColor: "#D32F2F" },
  Closed: { color: "#EEEEEE", textColor: "#616161" },
}
const getStatusStyle = (status) => STATUS_TYPES[status] || { color: "#F5F5F5", textColor: "#666666" }

/* ─── Row action ──────────────────────────────────────────────────────────
   Applying is the only move the business makes. Once the application is in,
   the advisor owns the pipeline — so every later stage is shown, not offered:
   the button becomes a read-only marker naming the stage the advisor would
   move this row to next, and it re-labels itself as they progress.

     kind: "connect"  the one actionable state — sends the application
     kind: "await"    read-only; `next` is what the advisor can move it to
     kind: "terminal" nothing follows this stage
*/
const NEXT_STAGE = {
  "New Match": { label: "Apply", next: "Contacted", kind: "connect" },
  Viewed: { label: "Apply", next: "Contacted", kind: "connect" },
  Shortlisted: { label: "Apply", next: "Contacted", kind: "connect" },
  Contacted: { label: "Under Review", next: "Under Review", kind: "await" },
  "Under Review": { label: "Interviewing", next: "Interviewing", kind: "await" },
  Interviewing: { label: "Accepted", next: "Accepted", kind: "await" },
  Accepted: { label: "Engaged/Placed", next: "Engaged/Placed", kind: "await" },
  "Engaged/Placed": { label: "Engaged/Placed", next: null, kind: "terminal" },
  Declined: { label: "Declined", next: null, kind: "terminal" },
  Closed: { label: "Closed", next: null, kind: "terminal" },
}

const getRowActions = (status) => NEXT_STAGE[status] || NEXT_STAGE["New Match"]

/* ─── Reference data ────────────────────────────────────────────────────── */
const COMPENSATION_MODELS = [
  "Volunteer",
  "Pro-Bono",
  "Paid",
  "Fee-Based",
  "Hourly Rate",
  "Monthly Retainer",
  "Equity-Based",
  "Project-Based",
  "Board Appointment",
]

const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon",
  "Central African Republic", "Chad", "Comoros", "Congo", "Côte d'Ivoire", "Djibouti", "DR Congo",
  "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana",
  "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali",
  "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda",
  "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa",
  "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
]

/* ─── Shared helpers (previously imported from the kit) ──────────────────── */
export const formatLabel = (value) => {
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

  const shouldTruncate = text.toString().length > maxLength
  const displayText = isExpanded || !shouldTruncate ? text : `${text.toString().slice(0, maxLength)}...`

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

/* The Applications page links here as
   /find-advisors?applicationId=<id>&matchMin=<n>&matchMax=<n>, so both the
   application scope and the score band survive the route change. */
const readApplicationIdFromUrl = () => {
  if (typeof window === "undefined") return null
  try {
    return new URLSearchParams(window.location.search).get("applicationId") || null
  } catch {
    return null
  }
}

/* Returns [min, max] when the link carried a band, otherwise null so the
   stored filter state is left alone. */
const readMatchRangeFromUrl = () => {
  if (typeof window === "undefined") return null
  try {
    const params = new URLSearchParams(window.location.search)
    const rawMin = params.get("matchMin")
    const rawMax = params.get("matchMax")
    if (rawMin === null && rawMax === null) return null
    const clamp = (n, fallback) => {
      const parsed = Number.parseInt(n, 10)
      return Number.isNaN(parsed) ? fallback : Math.max(0, Math.min(100, parsed))
    }
    const min = clamp(rawMin, 0)
    const max = clamp(rawMax, 100)
    return min <= max ? [min, max] : [max, min]
  } catch {
    return null
  }
}

/* Dropping the band params keeps a refresh from re-applying a filter the user
   has just cleared. */
const stripMatchRangeParams = () => {
  if (typeof window === "undefined" || !window.history?.replaceState) return
  const url = new URL(window.location.href)
  url.searchParams.delete("matchMin")
  url.searchParams.delete("matchMax")
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
}

const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

/* ─── Column header info tooltip ──────────────────────────────────────────
   Same component the Business table uses, so both tables explain their
   columns identically. Portaled to <body> because the header cell is sticky
   and would otherwise clip the bubble. */
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

/* ════════════════════════════════════════════════════════════════════════════
   Column configuration.

   Application ID, Advisor and Action are not here: the first two are pinned
   left and the last is pinned to the end of the row, so none of them can be
   reordered or hidden. Everything below is draggable, resizable, hideable and
   pinnable, and the key order here is the default column order.

   priority drives responsive collapse: 1 survives mobile, <=3 survives tablet,
   everything shows on laptop and up.
   ════════════════════════════════════════════════════════════════════════ */
const COLUMN_DEFS = {
  requestedService: { label: "Requested Service", width: 180, filterType: "requestedService", visible: true, priority: 2, sortable: true, tooltip: "The advisory role or expertise you asked for on the application this match belongs to." },
  match: { label: "Match %", align: "center", width: 136, filterType: "match", visible: true, priority: 1, sortable: true, tooltip: "How well this advisor fits your stated needs across stage, sector, expertise, location and compensation. Open the ? for the full breakdown." },
  verification: { label: "Verification Status", align: "center", width: 132, filterType: "verification", visible: true, priority: 2, sortable: true, tooltip: "How complete and verified the advisor's profile is, Tier 1 (fully verified) down to Tier 4. Click the tier for the full breakdown." },
  roleExpertise: { label: "Role / Expertise", width: 198, filterType: "roleExpertise", visible: true, priority: 2, sortable: true, tooltip: "The advisor's professional headline, preferred advisory role and functional expertise." },
  engagementModel: { label: "Compensation Model", width: 176, filterType: "engagementModel", visible: true, priority: 2, sortable: true, tooltip: "How the advisor expects to be compensated — pro-bono, retainer, equity, project-based and so on." },

  sectorExperience: { label: "Sector Experience", width: 176, filterType: "sectorExperience", visible: true, priority: 3, sortable: true, tooltip: "Industries the advisor has worked in." },
  availability: { label: "Availability", width: 142, filterType: "availability", visible: true, priority: 3, sortable: true, tooltip: "Hours per month the advisor has said they can commit." },
  status: { label: "Status", width: 140, filterType: "status", visible: true, priority: 1, sortable: true, tooltip: "Where this advisor sits in your pipeline, from New Match through to Engaged or Declined." },

  yearsExperience: { label: "Years of Experience", width: 158, filterType: "yearsExperience", visible: false, priority: 4, sortable: true, tooltip: "Total years the advisor has been working in their field." },
  qualifications: { label: "Qualifications", width: 164, filterType: "qualifications", visible: false, priority: 4, sortable: false, tooltip: "Degrees, certifications and professional designations the advisor holds." },
  previousRoles: { label: "Previous Roles", width: 168, filterType: "previousRoles", visible: false, priority: 4, sortable: false, tooltip: "Positions the advisor has held before." },
  location: { label: "Geographic Location", width: 160, filterType: "location", visible: false, priority: 4, sortable: true, tooltip: "Where the advisor is based." },
  workPreference: { label: "Virtual / In-Person", width: 156, filterType: "workPreference", visible: false, priority: 4, sortable: true, tooltip: "Whether the advisor works remotely, on site, or both." },
  languages: { label: "Languages", width: 140, filterType: "languages", visible: false, priority: 4, sortable: false, tooltip: "Languages the advisor can work in." },
  feeRange: { label: "Fee Range", width: 138, filterType: "feeRange", visible: false, priority: 4, sortable: true, tooltip: "The advisor's stated rate or fee band, where they've published one." },
  boardExperience: { label: "Board Experience", width: 156, filterType: "boardExperience", visible: false, priority: 4, sortable: true, tooltip: "Whether the advisor has served on boards." },
  references: { label: "References", width: 138, filterType: "references", visible: false, priority: 4, sortable: false, tooltip: "References the advisor has supplied." },
  smeStageFit: { label: "SME Stage Fit", width: 148, filterType: "smeStageFit", visible: false, priority: 4, sortable: true, tooltip: "Business stages the advisor prefers to work with — pre-seed, growth and so on." },
  dateMatched: { label: "Date Matched", width: 142, filterType: "dateMatched", visible: false, priority: 4, sortable: true, tooltip: "When this advisor first entered your pipeline." },
}

const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS)
const DEFAULT_COLUMN_VISIBILITY = Object.fromEntries(
  DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].visible !== false]),
)
const DEFAULT_COLUMN_WIDTHS = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].width]))
const DEFAULT_PINNED = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, null]))
const DEFAULT_DENSITY = "comfortable"

/* Application ID, Advisor Name and Action can't be hidden or reordered, so
   they aren't in COLUMN_DEFS — but they are resizable like everything else,
   and their widths live under these reserved keys inside columnWidths. */
const APPID_KEY = "__appId__"
const ADVISOR_KEY = "__advisor__"
const ACTION_KEY = "__action__"
const FIXED_WIDTHS = { [APPID_KEY]: 132, [ADVISOR_KEY]: 210, [ACTION_KEY]: 208 }
const MIN_COLUMN_WIDTH = 84

/* ─── Saved views + filter persistence ──────────────────────────────────── */
const BUILTIN_VIEW_ID = "__default__"
// v4: the column set changed (Requested Service, Verification Status, Status
// Summary added; Engagement Model relabelled), so older saved orders would
// omit the new columns entirely.
const VIEWS_STORAGE_KEY = "advisor-matches-views-v5"
// v2: every text filter became a multi-select array, so a stored string would
// blow up .includes on load.
const FILTERS_STORAGE_KEY = "advisor-matches-filters-v3"
const SAVED_STORAGE_KEY = "advisor-matches-saved-v1"

/* Saved matches were previously component state only, so the bookmark
   survived until the next render of a parent and no further — pressing it
   looked like nothing happened. */
const loadSavedMatches = () => {
  if (typeof window === "undefined") return {}
  try {
    const saved = JSON.parse(window.localStorage.getItem(SAVED_STORAGE_KEY) || "null")
    return saved && typeof saved === "object" ? saved : {}
  } catch {
    return {}
  }
}

const persistSavedMatches = (saved) => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(saved))
  } catch {
    // Non-fatal.
  }
}

/* Every filter except the match range is now a list of selected values, so the
   header popovers can offer what is actually in the table instead of a blank
   search box. */
const EMPTY_FILTERS = {
  name: [],
  applicationId: [],
  requestedService: [],
  matchRange: [0, 100],
  verification: [],
  roleExpertise: [],
  sectorExperience: [],
  engagementModel: [],
  availability: [],
  status: [],
  yearsExperience: [],
  qualifications: [],
  previousRoles: [],
  location: [],
  workPreference: [],
  languages: [],
  feeRange: [],
  boardExperience: [],
  references: [],
  smeStageFit: [],
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

/* Filters are merged over EMPTY_FILTERS and then coerced to arrays, so a
   value saved by an older build as a string can't reach the filter functions. */
const loadFilterState = () => {
  if (typeof window === "undefined") return { filters: { ...EMPTY_FILTERS }, sort: null }
  try {
    const saved = JSON.parse(window.localStorage.getItem(FILTERS_STORAGE_KEY) || "null")
    const merged = { ...EMPTY_FILTERS, ...(saved?.filters || {}) }
    Object.keys(EMPTY_FILTERS).forEach((key) => {
      if (Array.isArray(EMPTY_FILTERS[key]) && !Array.isArray(merged[key])) {
        merged[key] = merged[key] ? [merged[key].toString()] : []
      }
    })
    /* matchRange is the one array that holds numbers, not selected values, so
       the coercion above can leave it as a one-element array of a string. Put
       it back to a numeric pair — every filter comparison depends on it. */
    const range = merged.matchRange
    merged.matchRange =
      Array.isArray(range) && range.length === 2 && range.every((n) => Number.isFinite(Number(n)))
        ? [Number(range[0]), Number(range[1])]
        : [0, 100]
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

const CATEGORY_LABEL = {
  stageFit: "Stage Fit",
  skillAlignment: "Support Type Alignment",
  location: "Location",
  sector: "Sector Experience",
  compensation: "Compensation Model Fit",
  functionalExpertise: "Functional Expertise",
  legalEntityFit: "Legal Entity Fit",
  revenueThreshold: "Revenue Threshold",
}

/* ─── Match scoring ─────────────────────────────────────────────────────── */
const toArr = (v) => (Array.isArray(v) ? v : v ? [v] : [])
const canon = (s) => s.toString().toLowerCase().replace(/[^a-z]/g, "")

const FE_ALIASES = {
  hr: "hr",
  humanresources: "hr",
  tech: "tech",
  technology: "tech",
  it: "tech",
  ict: "tech",
  legal: "legal",
  law: "legal",
  strategy: "strategy",
  finance: "finance",
  esg: "esg",
  governance: "governance",
}

const normFE = (list) => {
  const out = new Set()
  for (const item of toArr(list)) {
    const key = FE_ALIASES[canon(item)] || canon(item)
    if (key) out.add(key)
  }
  return [...out]
}

const overlapFE = (a, b) => {
  const A = new Set(normFE(a))
  return normFE(b).some((t) => A.has(t))
}

// Was `rawRevenue.replace(...)` — threw whenever annualRevenue was a number.
const parseCurrency = (value) => {
  if (value === null || value === undefined) return 0
  const n = Number.parseFloat(value.toString().replace(/[^0-9.]/g, ""))
  return Number.isNaN(n) ? 0 : n
}

export const calculateAdvisorMatch = (smeProfile, advisorProfile) => {
  const supportFocus = toArr(smeProfile?.advisoryNeedsAssessment?.supportFocus)
  const fundingStage = (smeProfile?.entityOverview?.operationStage || "").toLowerCase()
  const smeSectors = toArr(smeProfile?.entityOverview?.economicSectors).map((s) => (s || "").toLowerCase())
  const smeLocation = (smeProfile?.entityOverview?.location || "").toLowerCase()
  const smeLegal = (smeProfile?.entityOverview?.legalStructure || "").toLowerCase()
  const smeRevenue = parseCurrency(smeProfile?.financialOverview?.annualRevenue)
  const smeFE = toArr(smeProfile?.advisoryNeedsAssessment?.functionalExpertise)

  const advForm = advisorProfile?.formData || {}
  const contact = advForm.contactDetails || {}
  const overview = advForm.personalProfessionalOverview || {}
  const selection = advForm.selectionCriteria || {}

  // The old version built `advisorFE` from both sources then ignored it,
  // scoring against overview.functionalExpertise only.
  const advisorFE = [...new Set([...toArr(overview.functionalExpertise), ...toArr(selection.functionalExpertise)])]

  const breakdown = {
    stageFit: { matched: false, smeValue: fundingStage, advisorValue: toArr(selection.smeStageFit) },
    skillAlignment: { matched: false, smeValue: supportFocus, advisorValue: toArr(selection.advisorySupportType) },
    location: { matched: false, smeValue: smeLocation, advisorValue: contact.country || "" },
    sector: { matched: false, smeValue: smeSectors, advisorValue: toArr(overview.industryExperience) },
    compensation: { matched: false, smeValue: toArr(smeProfile?.advisoryNeedsAssessment?.compensationModel), advisorValue: selection.compensationModel || "Not specified" },
    functionalExpertise: { matched: false, smeValue: smeFE, advisorValue: advisorFE },
    legalEntityFit: { matched: false, smeValue: smeLegal, advisorValue: selection.legalEntityFit || "" },
    revenueThreshold: { matched: false, smeValue: smeRevenue, advisorValue: selection.revenueThreshold || "Not specified" },
  }

  breakdown.stageFit.matched = breakdown.stageFit.advisorValue.map((s) => (s || "").toLowerCase()).includes(fundingStage)
  breakdown.skillAlignment.matched = breakdown.skillAlignment.advisorValue.some((t) => supportFocus.includes(t))
  breakdown.location.matched = (contact.country || "").toLowerCase() === smeLocation && !!smeLocation
  breakdown.sector.matched = breakdown.sector.advisorValue.some((s) => smeSectors.includes((s || "").toLowerCase()))
  breakdown.functionalExpertise.matched = overlapFE(smeFE, advisorFE)
  breakdown.legalEntityFit.matched = !!smeLegal && (selection.legalEntityFit || "").toLowerCase() === smeLegal

  /* Was `!!selection.compensationModel` — true for every advisor who filled
     the field in, so it was a free 12.5% on every score. It now has to
     actually align with what the SME said it can offer; if the SME hasn't
     stated a preference, no points either way. */
  const smePref = breakdown.compensation.smeValue.map(canon)
  breakdown.compensation.matched =
    smePref.length > 0 && smePref.includes(canon(selection.compensationModel || ""))

  const revenueBands = {
    less_than_500k: [0, 500000],
    "500k_to_1m": [500000, 1000000],
    less_than_1m: [0, 1000000],
    "1m_to_5m": [1000000, 5000000],
    "5m_to_10m": [5000000, 10000000],
    "10m_plus": [10000000, Number.POSITIVE_INFINITY],
  }
  const band = revenueBands[(selection.revenueThreshold || "").toLowerCase()]
  breakdown.revenueThreshold.matched = band ? smeRevenue >= band[0] && smeRevenue <= band[1] : false

  const matchedCount = Object.values(breakdown).filter((b) => b.matched).length
  return { score: Math.round((matchedCount / Object.keys(breakdown).length) * 100), breakdown }
}

/* ─── Row mapping ───────────────────────────────────────────────────────── */
const mapAdvisor = (data, id) => {
  // Verification is derived from the profile itself. The old check read
  // `declaration.verified`, which almost no advisor sets, so every row came
  // back "Unverified" and the column told you nothing.
  const verificationResult = deriveAdvisorVerification(data)

  const formData = data.formData || {}
  const contact = formData.contactDetails || {}
  const overview = formData.personalProfessionalOverview || {}
  const selection = formData.selectionCriteria || {}
  const declaration = formData.declarationConsent || {}

  // Was `formatLabel(selection.timeCommitment + " hrs" || "Not specified")`,
  // which concatenates before the ||, so a missing value rendered
  // "Undefined Hrs" — truthy, so the fallback never fired.
  const timeCommitment = selection.timeCommitment
  const availability =
    timeCommitment === null || timeCommitment === undefined || timeCommitment === ""
      ? "Not specified"
      : `${timeCommitment} hrs / month`

  return {
    id,
    name: `${contact.name || ""} ${contact.surname || ""}`.trim() || "Unnamed Advisor",
    headline: overview.professionalHeadline || "Advisor",
    advisorRole: formatLabel(selection.preferredAdvisorRole || ""),
    functionalExpertise: formatLabel(overview.functionalExpertise || []),
    sectorExperience: formatLabel(overview.industryExperience || []),
    engagementModel: formatLabel(selection.compensationModel || "Not specified"),
    availability,
    smeStageFit: formatLabel(selection.smeStageFit || []),
    yearsExperience: overview.yearsOfExperience || overview.yearsExperience || "-",
    qualifications: formatLabel(overview.qualifications || overview.highestQualification || ""),
    previousRoles: formatLabel(overview.previousRoles || overview.pastPositions || ""),
    location: formatLabel(contact.country || contact.province || "-"),
    workPreference: formatLabel(selection.engagementPreference || selection.workPreference || "-"),
    languages: formatLabel(overview.languages || contact.languages || ""),
    feeRange: selection.feeRange || selection.rateRange || "-",
    boardExperience: formatLabel(overview.boardExperience || selection.boardExperience || "-"),
    references: formatLabel(declaration.references || overview.references || "-"),

    // Short value for the column; everything else feeds the popup.
    verification: verificationResult.tier,
    verificationBadge: verificationResult.badge,
    verificationLabel: verificationResult.label,
    verificationScore: verificationResult.score,
    verificationSummary: verificationResult.summary,
    verificationBreakdown: verificationResult.breakdown,

    // Filled in by the application join below; an advisor with no AI match
    // record keeps these dashes and is still listed.
    applicationId: "-",
    applicationFullId: null,
    requestedService: "-",

    email: contact.email || data.userEmail || null,
    matchPercentage: 0,
    matchBreakdown: null,
  }
}

const hasTooManyMissingFields = (a) => {
  const fields = [
    a.name,
    a.headline,
    a.sectorExperience,
    a.functionalExpertise,
    a.engagementModel,
    a.availability,
    a.location,
    a.smeStageFit,
  ]
  const missing = fields.filter(
    (f) =>
      !f ||
      ["-", "Not specified", "Various", "unspecified", "Unknown", "N/A"].includes(f.toString().trim()) ||
      f.toString().toLowerCase().includes("not specified"),
  ).length
  return missing > 4
}

/* Reads back as the label the Applications page used, so the chip in the
   toolbar names the same band the user picked over there. Tolerates a
   malformed stored range — destructuring undefined here would throw during
   render and take the whole page down with it. */
const describeMatchRange = (range) => {
  const pair = Array.isArray(range) ? range : []
  const min = Number.isFinite(Number(pair[0])) ? Number(pair[0]) : 0
  const max = Number.isFinite(Number(pair[1])) ? Number(pair[1]) : 100
  if (min <= 0 && max >= 100) return null
  if (max >= 100) return `Above ${min}%`
  if (min <= 0) return `Below ${max + 1}%`
  return `${min}–${max}%`
}

/* ════════════════════════════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════════════════════════ */
export function AdvisorTable({
  filters,
  stageFilter,
  applicationFilter,
  onConnectionRequested,
  onCountChange,
}) {
  const [advisors, setAdvisors] = useState([])
  const [statuses, setStatuses] = useState({})
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [connectingId, setConnectingId] = useState(null)

  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [isCompanyMember, setIsCompanyMember] = useState(false)
  const [userRole, setUserRole] = useState(null)

  /* advisorId -> { applicationFullId, applicationId, requestedService }. */
  const [applicationsByAdvisor, setApplicationsByAdvisor] = useState({})

  /* A stage pressed in the pipeline arrives here. The `stageFilter` prop still
     wins when the page passes one, so wiring props stays optional — drop
     <AdvisorFlowPipeline /> anywhere on the page and the two find each
     other. */
  const [eventStageFilter, setEventStageFilter] = useState(null)
  useEffect(() => {
    const onFilter = (e) => setEventStageFilter(e.detail ?? null)
    window.addEventListener(ADVISOR_STAGE_FILTER_EVENT, onFilter)
    return () => window.removeEventListener(ADVISOR_STAGE_FILTER_EVENT, onFilter)
  }, [])
  const activeStageFilter = stageFilter ?? eventStageFilter

  /* Same pattern for application scoping: the Applications page dispatches an
     id when the user picks "View Match Table", and null to clear it. */
  /* Seeded from ?applicationId= so arriving from the Applications page works:
     that navigation remounts this component, and an event dispatched before
     the mount would have had nobody listening. The event is still handled for
     the case where the table is already on screen. */
  const [eventApplicationFilter, setEventApplicationFilter] = useState(readApplicationIdFromUrl)
  useEffect(() => {
    const onFilter = (e) => setEventApplicationFilter(e.detail ?? null)
    window.addEventListener(ADVISOR_APPLICATION_FILTER_EVENT, onFilter)
    return () => window.removeEventListener(ADVISOR_APPLICATION_FILTER_EVENT, onFilter)
  }, [])
  const activeApplicationFilter = applicationFilter ?? eventApplicationFilter

  const [detailsAdvisor, setDetailsAdvisor] = useState(null)
  const [savedMatches, setSavedMatches] = useState(() => loadSavedMatches())
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [hiddenMatches, setHiddenMatches] = useState({})
  const [hoveredRow, setHoveredRow] = useState(null)

  useEffect(() => {
    persistSavedMatches(savedMatches)
  }, [savedMatches])

  const savedCount = useMemo(() => Object.values(savedMatches).filter(Boolean).length, [savedMatches])

  /* Popups — anchored popovers portaled to <body>, same pattern as the SME
     and intern tables. { type, advisor, position:{x,y}, rect } */
  const [activePopup, setActivePopup] = useState(null)

  /* Filters + sort, restored from the last visit — but a band carried in the
     link wins over the stored match range, so the eye on the Applications page
     lands on exactly the rows it counted. Seeded in the initializer rather than
     an effect so the table never paints the old range first. */
  const initialFilterState = useMemo(() => {
    const state = loadFilterState()
    const seededRange = readMatchRangeFromUrl()
    return seededRange ? { ...state, filters: { ...state.filters, matchRange: seededRange } } : state
  }, [])
  const [localFilters, setLocalFilters] = useState(initialFilterState.filters)
  const [sortConfig, setSortConfig] = useState(initialFilterState.sort)
  const [headerFilterOpen, setHeaderFilterOpen] = useState(null)
  const [chipSearch, setChipSearch] = useState("")

  /* The table may already be mounted when the Applications page fires — a
     tabbed shell switching panes never remounts it, so the URL seed above
     never runs. */
  useEffect(() => {
    const onRange = (e) => {
      const range = e.detail
      if (!Array.isArray(range) || range.length !== 2) return
      const min = Math.max(0, Math.min(100, Number(range[0]) || 0))
      const max = Math.max(0, Math.min(100, Number(range[1]) ?? 100))
      setLocalFilters((prev) => ({ ...prev, matchRange: min <= max ? [min, max] : [max, min] }))
    }
    window.addEventListener(ADVISOR_MATCH_RANGE_EVENT, onRange)
    return () => window.removeEventListener(ADVISOR_MATCH_RANGE_EVENT, onRange)
  }, [])

  const clearMatchRange = () => {
    setLocalFilters((prev) => ({ ...prev, matchRange: [0, 100] }))
    stripMatchRangeParams()
  }

  /* "View All Matches" drops the score band too — it arrived with the
     application, so leaving it behind would make the button look broken. */
  const clearApplicationFilter = () => {
    setEventApplicationFilter(null)
    window.dispatchEvent(new CustomEvent(ADVISOR_APPLICATION_FILTER_EVENT, { detail: null }))
    setLocalFilters((prev) => ({ ...prev, matchRange: [0, 100] }))
    // Drop the params too, otherwise a refresh would put the filter straight
    // back and "View All Matches" would look broken.
    if (typeof window !== "undefined" && window.history?.replaceState) {
      const url = new URL(window.location.href)
      url.searchParams.delete("applicationId")
      url.searchParams.delete("matchMin")
      url.searchParams.delete("matchMax")
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
    }
  }

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

  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]

  /* Every notification in this file used to be a setNotification plus its own
     setTimeout. One helper, so the timings can't drift. */
  const toast = useCallback((type, message, ms = 3000) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), ms)
  }, [])

  /* One place that both the row bookmark and the quick-actions entry call, so
     the two can't drift apart. Declared after `toast` because it uses it — a
     const referenced before its initializer throws at render. */
  const toggleSaved = useCallback(
    (advisor) => {
      const nowSaved = !savedMatches[advisor.id]
      setSavedMatches((prev) => ({ ...prev, [advisor.id]: nowSaved }))
      toast("success", nowSaved ? `${advisor.name} saved` : `${advisor.name} removed from saved`, 2000)
    },
    [savedMatches, toast],
  )

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  /* ─── Auth + company membership ─────────────────────────────────────── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setEffectiveUserId(null)
        setAuthResolved(true)
        setLoading(false)
        return
      }
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid))
        if (userSnap.exists()) {
          const { companyId, userRole: role } = userSnap.data()
          if (companyId) {
            const companySnap = await getDoc(doc(db, "companies", companyId))
            if (companySnap.exists()) {
              const ownerId = companySnap.data().createdBy
              setUserRole(role || "viewer")
              setIsCompanyMember(ownerId !== user.uid)
              setEffectiveUserId(ownerId || user.uid)
              setAuthResolved(true)
              return
            }
          }
        }
        setIsCompanyMember(false)
        setEffectiveUserId(user.uid)
        setUserRole("owner")
      } catch (error) {
        console.error("Error resolving company membership:", error)
        setEffectiveUserId(user.uid)
        setUserRole("owner")
      } finally {
        setAuthResolved(true)
      }
    })
    return () => unsubscribe()
  }, [])

  /* ─── Live statuses. One scoped listener — the old file also ran an
     unscoped getDocs over the whole collection and filtered in JS, which
     both leaked every SME's data and raced this listener. ─────────────── */
  useEffect(() => {
    if (!effectiveUserId) return undefined
    const unsubscribe = onSnapshot(
      query(collection(db, SME_ADVISOR_COLLECTION), where("smeId", "==", effectiveUserId)),
      (snapshot) => {
        const next = {}
        snapshot.forEach((d) => {
          const data = d.data()
          next[data.advisorId] = {
            status: normalizeAdvisorStatus(data.status),
            dateMatched: data.createdAt || null,
          }
        })
        setStatuses(next)
      },
      (err) => console.error("Advisor status listener failed:", err),
    )
    return () => unsubscribe()
  }, [effectiveUserId])

  /* ─── Application join ────────────────────────────────────────────────
     This table scores every advisor profile itself and has no application in
     scope. smseAdvisoryMatches is what the AI matching backend writes and
     what the Applications page counts from, and each of its records carries
     an applicationId — so the two are stitched together here by advisorId.
     Advisors with no record still appear, with a dash. */
  useEffect(() => {
    if (!effectiveUserId) return undefined

    let cancelled = false

    const loadApplicationLinks = async () => {
      try {
        const [matchSnap, appSnap] = await Promise.all([
          getDocs(query(collection(db, AI_MATCHES_COLLECTION), where("smeId", "==", effectiveUserId))),
          getDocs(query(collection(db, "advisoryApplicationsV2"), where("userId", "==", effectiveUserId))),
        ])

        // Requested Service is the same value the Applications list shows in
        // its "Application" column.
        const serviceByAppId = {}
        appSnap.forEach((d) => {
          const data = d.data()
          const roleOrExpertise =
            (data.advisoryRole || []).length > 0 ? data.advisoryRole[0] : (data.functionalExpertise || [])[0]
          serviceByAppId[d.id] = formatLabel(roleOrExpertise?.trim() || "") || "Advisory Request"
        })

        const links = {}
        matchSnap.forEach((d) => {
          const data = d.data()
          const advisorId = data.advisorId
          const appFullId = data.applicationId
          if (!advisorId || !appFullId) return
          // An advisor matched under more than one application keeps the most
          // recent link; the others stay reachable through the filter.
          const stamp = data.createdAt?.toMillis?.() || 0
          const existing = links[advisorId]
          if (existing && existing.stamp > stamp) return
          links[advisorId] = {
            stamp,
            applicationFullId: appFullId,
            applicationId: appFullId.slice(-8).toUpperCase(),
            requestedService: serviceByAppId[appFullId] || "-",
          }
        })

        if (!cancelled) setApplicationsByAdvisor(links)
      } catch (error) {
        console.error("Failed to load application links:", error)
      }
    }

    loadApplicationLinks()
    return () => {
      cancelled = true
    }
  }, [effectiveUserId])

  /* ─── Advisors ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!authResolved) return
    if (!effectiveUserId) {
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchAdvisors = async () => {
      setLoading(true)
      try {
        const [snapshot, smeDoc, advisoryApp] = await Promise.all([
          getDocs(collection(db, "advisorProfiles")),
          getDoc(doc(db, "universalProfiles", effectiveUserId)),
          getDoc(doc(db, "advisoryApplications", effectiveUserId)),
        ])

        const profileData = {
          ...(smeDoc.exists() ? smeDoc.data() : {}),
          advisoryNeedsAssessment: advisoryApp.exists() ? advisoryApp.data().advisoryNeedsAssessment || {} : {},
        }

        const mapped = snapshot.docs
          .filter((d) => d.id !== effectiveUserId)
          .map((docSnap) => {
            const data = docSnap.data()
            const result = calculateAdvisorMatch(profileData, data)
            return { ...mapAdvisor(data, docSnap.id), matchPercentage: result.score, matchBreakdown: result.breakdown }
          })
          .map((row) => {
            const link = applicationsByAdvisor[row.id]
            return link
              ? {
                  ...row,
                  applicationId: link.applicationId,
                  applicationFullId: link.applicationFullId,
                  requestedService: link.requestedService,
                }
              : row
          })

        mapped.sort((a, b) => b.matchPercentage - a.matchPercentage)
        if (!cancelled) setAdvisors(mapped)
      } catch (error) {
        console.error("Error fetching advisors:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAdvisors()
    return () => {
      cancelled = true
    }
    // onCountChange deliberately not a dependency — an inline arrow from the
    // parent would re-trigger the whole fetch on every render.
  }, [authResolved, effectiveUserId, applicationsByAdvisor])

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
    toast("success", `View "${trimmedName}" created`)
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
    toast("success", "View deleted")
  }

  const resetActiveViewToDefault = () => {
    const layout = createDefaultViewLayout()
    setColumnVisibility(layout.columnVisibility)
    setColumnOrder(layout.columnOrder)
    setColumnWidths(layout.columnWidths)
    setPinned(layout.pinned)
    setDensity(layout.density)
    toast("success", `"${activeView.name}" reset to factory defaults`)
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

  /* ─── Resize ────────────────────────────────────────────────────────── */
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
      className="at-resize"
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

  /* ─── Popups ────────────────────────────────────────────────────────── */
  const openPopup = (type, advisor, rect) => {
    let popupWidth
    let popupHeight
    switch (type) {
      case "match":
      case "verification":
        popupWidth = 380
        popupHeight = 460
        break
      case "quickActions":
        popupWidth = 224
        popupHeight = 340
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

    setActivePopup({ type, advisor, position: { x, y }, rect })
  }

  const openPopupFromEvent = (type, advisor, event) => {
    event.stopPropagation()
    openPopup(type, advisor, event.currentTarget.getBoundingClientRect())
  }

  const closePopup = () => setActivePopup(null)

  const handleViewDetails = (advisor) => {
    setDetailsAdvisor(advisor)
    setActivePopup(null)
  }

  /* ─── Connect ───────────────────────────────────────────────────────── */
  const handleConnect = async (advisor) => {
    const user = auth.currentUser
    if (!user) {
      toast("error", "Please log in to connect.")
      return
    }
    if (isCompanyMember && !["owner", "admin"].includes(userRole)) {
      toast("warning", "Only company owners and admins can connect with advisors.", 4000)
      return
    }

    const smeUserId = effectiveUserId
    const advisorUserId = advisor.id
    setConnectingId(advisor.id)

    try {
      const smeDoc = await getDoc(doc(db, "universalProfiles", smeUserId))
      const smeData = smeDoc.exists() ? smeDoc.data() : {}
      const smeName = smeData.entityOverview?.registeredName || "A Small Business"

      const matchData = {
        advisorId: advisorUserId,
        smeId: smeUserId,
        submittedBy: user.uid,
        submittedByRole: userRole,
        createdAt: serverTimestamp(),
        status: "Contacted",
        matchPercentage: advisor.matchPercentage || 0,
        advisorName: advisor.name,
        advisorSector: advisor.sectorExperience,
        advisorEngagementModel: advisor.engagementModel,
        smeName,
        smeLocation: smeData.entityOverview?.location || "",
        smeSector: (smeData.entityOverview?.economicSectors || []).join(", "),
        smeStage: smeData.applicationOverview?.fundingStage || "",
        // Responsiveness measurement needs both ends of the gap.
        smeActedAt: serverTimestamp(),
        firstRespondedAt: null,
        // Carry the application through so the advisor's side can show which
        // request they were approached for.
        ...(advisor.applicationFullId ? { applicationId: advisor.applicationFullId } : {}),
      }

      await Promise.all([
        setDoc(doc(db, SME_ADVISOR_COLLECTION, smeAdvisorId(smeUserId, advisorUserId)), {
          ...matchData,
          viewType: "sme",
        }),
        setDoc(doc(db, ADVISOR_SME_COLLECTION, advisorSmeId(advisorUserId, smeUserId)), {
          ...matchData,
          viewType: "advisor",
        }),
      ])

      setStatuses((prev) => ({ ...prev, [advisor.id]: { status: "Contacted", dateMatched: new Date() } }))

      // `addDoc` was called here but never imported, so every Connect threw a
      // ReferenceError after the writes landed — the record saved, no message
      // sent, and the catch showed a failure toast on a partial success.
      const applicationId = smeAdvisorId(smeUserId, advisorUserId)

      try {
        await Promise.all([
          addDoc(collection(db, "messages"), {
            to: advisorUserId,
            toName: advisor.name,
            from: user.uid,
            fromName: smeName,
            subject: `New advisory connection request from ${smeName}`,
            content:
              `Dear ${advisor.name},\n\n${smeName} has requested to connect with you for advisory services.\n\n` +
              `Business details:\n- Name: ${smeName}\n- Location: ${matchData.smeLocation || "Not specified"}\n` +
              `- Sector: ${matchData.smeSector || "Not specified"}\n- Stage: ${matchData.smeStage || "Not specified"}\n\n` +
              `Your expertise in ${advisor.sectorExperience || "your sector"} aligns with their needs.\n\n` +
              `Log in to BIG Marketplace Africa to view the full details and respond.\n\nBest regards,\nBIG Marketplace Africa`,
            date: new Date().toISOString(),
            read: false,
            type: "inbox",
            applicationId,
            linkTo: `/advisor/connections/${applicationId}`,
          }),
          addDoc(collection(db, "messages"), {
            to: user.uid,
            toName: smeName,
            from: "system",
            fromName: "BIG Marketplace",
            subject: `Connection request sent to ${advisor.name}`,
            content:
              `Dear ${smeName},\n\nYour connection request to ${advisor.name} has been sent.\n\n` +
              `- Advisor: ${advisor.name}\n- Sector: ${advisor.sectorExperience || "Not specified"}\n` +
              `- Compensation model: ${advisor.engagementModel || "Not specified"}\n\n` +
              `You'll be notified when ${advisor.name} responds.\n\nBest regards,\nBIG Marketplace Africa`,
            date: new Date().toISOString(),
            read: false,
            type: "inbox",
            applicationId,
            linkTo: `/sme/connections/${applicationId}`,
          }),
        ])
      } catch (messageError) {
        // Messaging failing must not report the connection itself as failed.
        console.error("Connection saved but in-app messages failed:", messageError)
      }

      window.dispatchEvent(
        new CustomEvent("newNotification", {
          detail: {
            message: `Connection request sent to ${advisor.name}`,
            type: "success",
            timestamp: new Date().toISOString(),
          },
          bubbles: true,
        }),
      )

      toast("success", `Connection request sent to ${advisor.name}`)
      if (onConnectionRequested) onConnectionRequested(advisor)
    } catch (error) {
      console.error("Error connecting with advisor:", error)
      toast("error", "Failed to send connection request.", 4000)
    } finally {
      setConnectingId(null)
    }
  }

  /* Shortlist now persists — the old handler only set local state, so it was
     lost on refresh. It's wired to the quick actions menu below. */
  const handleSetStatus = async (advisor, nextStatus) => {
    const user = auth.currentUser
    if (!user || !effectiveUserId) return
    if (isCompanyMember && !["owner", "admin", "manager"].includes(userRole)) {
      toast("warning", "You don't have permission to update advisor statuses.", 4000)
      return
    }
    const id = smeAdvisorId(effectiveUserId, advisor.id)
    setConnectingId(advisor.id)
    try {
      await setDoc(
        doc(db, SME_ADVISOR_COLLECTION, id),
        {
          advisorId: advisor.id,
          smeId: effectiveUserId,
          advisorName: advisor.name,
          matchPercentage: advisor.matchPercentage || 0,
          status: nextStatus,
          viewType: "sme",
          updatedAt: serverTimestamp(),
          ...(advisor.applicationFullId ? { applicationId: advisor.applicationFullId } : {}),
        },
        { merge: true },
      )
      setStatuses((prev) => ({ ...prev, [advisor.id]: { status: nextStatus, dateMatched: new Date() } }))
      toast("success", `${advisor.name} moved to ${nextStatus}.`)
    } catch (error) {
      console.error("Failed to update advisor status:", error)
      toast("error", "Could not update status.", 4000)
    } finally {
      setConnectingId(null)
    }
  }

  // Applying is the only stage change this side can make. "await" and
  // "terminal" rows render as markers rather than buttons, so nothing else
  // reaches here.
  const runRowAction = (advisor, action) => {
    if (action.kind !== "connect") return
    handleConnect(advisor)
  }

  const statusOf = useCallback((advisor) => normalizeAdvisorStatus(statuses[advisor.id]?.status), [statuses])

  /* ─── Derived filter options ────────────────────────────────────────────
     Every header filter offers the values actually present in the table, so
     the user picks from what exists instead of guessing at a search box. */
  const uniqueOf = useCallback(
    (accessor) =>
      [...new Set(advisors.map(accessor).filter((v) => v && v !== "-" && v !== "Not specified"))].sort(),
    [advisors],
  )
  const nameOptions = useMemo(() => uniqueOf((a) => a.name), [uniqueOf])
  const applicationIdOptions = useMemo(() => uniqueOf((a) => a.applicationId), [uniqueOf])
  const requestedServiceOptions = useMemo(() => uniqueOf((a) => a.requestedService), [uniqueOf])
  const verificationOptions = useMemo(() => uniqueOf((a) => a.verification), [uniqueOf])
  const roleExpertiseOptions = useMemo(
    () =>
      [...new Set(advisors.flatMap((a) => [a.headline, a.advisorRole, a.functionalExpertise]))]
        .filter((v) => v && v !== "-" && v !== "Not specified")
        .sort(),
    [advisors],
  )
  const sectorOptions = useMemo(() => uniqueOf((a) => a.sectorExperience), [uniqueOf])
  const availabilityOptions = useMemo(() => uniqueOf((a) => a.availability), [uniqueOf])
  const yearsExperienceOptions = useMemo(() => uniqueOf((a) => a.yearsExperience?.toString()), [uniqueOf])
  const qualificationOptions = useMemo(() => uniqueOf((a) => a.qualifications), [uniqueOf])
  const previousRoleOptions = useMemo(() => uniqueOf((a) => a.previousRoles), [uniqueOf])
  const locationOptions = useMemo(() => uniqueOf((a) => a.location), [uniqueOf])
  const workPreferenceOptions = useMemo(() => uniqueOf((a) => a.workPreference), [uniqueOf])
  const languageOptions = useMemo(() => uniqueOf((a) => a.languages), [uniqueOf])
  const feeRangeOptions = useMemo(() => uniqueOf((a) => a.feeRange), [uniqueOf])
  const boardExperienceOptions = useMemo(() => uniqueOf((a) => a.boardExperience), [uniqueOf])
  const referenceOptions = useMemo(() => uniqueOf((a) => a.references), [uniqueOf])
  const stageFitOptions = useMemo(() => uniqueOf((a) => a.smeStageFit), [uniqueOf])

  /* ─── Filtering + sorting ───────────────────────────────────────────────
     Split in two on purpose. `preStageAdvisors` applies every filter except
     the pipeline stage; that list is what gets broadcast, so a card reading 8
     and the table showing 8 are the same 8 rows. Applying the stage filter
     before broadcasting would collapse every other card to zero the moment
     you pressed one. ──────────────────────────────────────────────────── */
  const preStageAdvisors = useMemo(() => {
    const f = localFilters
    const matchesAny = (selected, value) =>
      !selected?.length || selected.some((v) => (value || "").toString().toLowerCase().includes(v.toLowerCase()))

    return advisors.filter((a) => {
      // Arriving from an application's "View Match Table" narrows to that one
      // request; "View All Matches" clears it.
      if (activeApplicationFilter && a.applicationFullId !== activeApplicationFilter) return false
      if (hiddenMatches[a.id]) return false
      if (hasTooManyMissingFields(a)) return false
      if (showSavedOnly && !savedMatches[a.id]) return false

      const status = statusOf(a)
      if (filters?.search && !a.name.toLowerCase().includes(filters.search.toLowerCase())) return false

      if (!matchesAny(f.name, a.name)) return false
      if (!matchesAny(f.applicationId, a.applicationId)) return false
      if (!matchesAny(f.requestedService, a.requestedService)) return false
      if (a.matchPercentage < f.matchRange[0] || a.matchPercentage > f.matchRange[1]) return false
      if (!matchesAny(f.verification, a.verification)) return false
      if (!matchesAny(f.roleExpertise, `${a.headline} ${a.advisorRole} ${a.functionalExpertise}`)) return false
      if (!matchesAny(f.sectorExperience, a.sectorExperience)) return false
      if (!matchesAny(f.engagementModel, a.engagementModel)) return false
      if (!matchesAny(f.availability, a.availability)) return false
      if (f.status.length > 0 && !f.status.includes(status)) return false
      if (!matchesAny(f.yearsExperience, a.yearsExperience?.toString())) return false
      if (!matchesAny(f.qualifications, a.qualifications)) return false
      if (!matchesAny(f.previousRoles, a.previousRoles)) return false
      if (!matchesAny(f.location, a.location)) return false
      if (!matchesAny(f.workPreference, a.workPreference)) return false
      if (!matchesAny(f.languages, a.languages)) return false
      if (!matchesAny(f.feeRange, a.feeRange)) return false
      if (!matchesAny(f.boardExperience, a.boardExperience)) return false
      if (!matchesAny(f.references, a.references)) return false
      if (!matchesAny(f.smeStageFit, a.smeStageFit)) return false

      return true
    })
  }, [
    advisors,
    localFilters,
    statusOf,
    hiddenMatches,
    filters,
    showSavedOnly,
    savedMatches,
    activeApplicationFilter,
  ])

  /* Every advisor the pipeline should count, each with its resolved status.
     New Match has no stored record, so the pipeline cannot work this out on
     its own — it would have to infer it from a total. */
  useEffect(() => {
    if (typeof window === "undefined") return
    const payload = preStageAdvisors.map((a) => ({ id: a.id, name: a.name, status: statusOf(a) }))
    const emit = () => window.dispatchEvent(new CustomEvent(ADVISOR_ROWS_EVENT, { detail: payload }))
    emit()
    window.addEventListener(ADVISOR_ROWS_REQUEST_EVENT, emit)
    return () => window.removeEventListener(ADVISOR_ROWS_REQUEST_EVENT, emit)
  }, [preStageAdvisors, statusOf])

  const filteredAdvisors = useMemo(() => {
    const rows = activeStageFilter
      ? preStageAdvisors.filter((a) => statusOf(a) === activeStageFilter)
      : [...preStageAdvisors]

    if (sortConfig?.key) {
      const accessors = {
        name: (r) => r.name,
        applicationId: (r) => r.applicationId,
        requestedService: (r) => r.requestedService,
        match: (r) => r.matchPercentage || 0,
        // Sorted by the underlying score, so Tier 1 groups above Tier 2
        // rather than sorting alphabetically by badge.
        verification: (r) => r.verificationScore || 0,
        roleExpertise: (r) => r.headline,
        sectorExperience: (r) => r.sectorExperience,
        engagementModel: (r) => r.engagementModel,
        availability: (r) => r.availability,
        status: (r) => statusOf(r),
        yearsExperience: (r) => Number.parseFloat(r.yearsExperience) || 0,
        location: (r) => r.location,
        workPreference: (r) => r.workPreference,
        feeRange: (r) => r.feeRange,
        boardExperience: (r) => r.boardExperience,
        smeStageFit: (r) => r.smeStageFit,
        dateMatched: (r) =>
          new Date(statuses[r.id]?.dateMatched?.toDate?.() || statuses[r.id]?.dateMatched || 0).getTime(),
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
  }, [preStageAdvisors, activeStageFilter, sortConfig, statusOf, statuses])

  useEffect(() => {
    if (onCountChange) onCountChange(filteredAdvisors.length)
  }, [filteredAdvisors, onCountChange])

  const matchRangeLabel = describeMatchRange(localFilters.matchRange)

  const activeFilterCount =
    (localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100 ? 1 : 0) +
    Object.entries(localFilters)
      .filter(([key]) => key !== "matchRange")
      .reduce((sum, [, value]) => sum + (Array.isArray(value) ? value.length : 0), 0)

  const clearAllFilters = () => {
    setLocalFilters({ ...EMPTY_FILTERS })
    setSortConfig(null)
    stripMatchRangeParams()
  }

  const getFilterActive = (type) => {
    if (type === "match") return localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100
    return Array.isArray(localFilters[type]) && localFilters[type].length > 0
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

  /* Covers the reorderable columns *and* the three fixed ones, so every
     column in the table can be dragged wider. */
  const widthOf = useCallback(
    (key) => columnWidths[key] ?? COLUMN_DEFS[key]?.width ?? FIXED_WIDTHS[key] ?? 140,
    [columnWidths],
  )

  const appIdWidth = widthOf(APPID_KEY)
  const advisorWidth = widthOf(ADVISOR_KEY)
  const actionWidth = widthOf(ACTION_KEY)
  const pinnedLeadWidth = appIdWidth + advisorWidth

  const stickyOffsets = useMemo(() => {
    const offsets = {}
    // Left-pinned columns stack to the right of the frozen Application ID +
    // Advisor pair.
    let leftAcc = pinnedLeadWidth
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
  }, [orderedColumns, pinned, widthOf, pinnedLeadWidth])

  const totalWidth =
    pinnedLeadWidth + actionWidth + orderedColumns.reduce((sum, key) => sum + widthOf(key), 0)

  const cellPadding = density === "compact" ? "0.4rem 0.4rem" : "0.6rem 0.5rem"
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

  const searchedColumns = DEFAULT_COLUMN_ORDER.filter((key) =>
    COLUMN_DEFS[key].label.toLowerCase().includes(columnSearch.toLowerCase()),
  )

  /* ─── Cells ─────────────────────────────────────────────────────────── */
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
    const style = { ...tableCellStyle, ...stickyStyle }
    const status = statusOf(a)

    switch (key) {
      case "requestedService":
        return (
          <td key={key} style={style}>
            <TruncatedText text={a.requestedService} maxLength={28} />
          </td>
        )

      case "match":
        return (
          <td key={key} style={{ ...style, textAlign: "center" }}>
            <div className="flex flex-col items-center gap-1 w-full">
              <div className="flex items-center gap-1">
                <span
                  className="text-xs font-semibold"
                  style={{ color: a.matchPercentage > 75 ? "#48BB78" : a.matchPercentage > 50 ? "#D69E2E" : "#E53E3E" }}
                >
                  {a.matchPercentage}%
                </span>
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
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(0, Math.min(100, a.matchPercentage))}%`,
                    backgroundColor: a.matchPercentage > 75 ? "#48BB78" : a.matchPercentage > 50 ? "#F6AD55" : "#F56565",
                  }}
                />
              </div>
            </div>
          </td>
        )

      /* Just the tier. The sentence that used to fill its own Status Summary
         column is identical for every advisor at a given tier, so it lives in
         the popup instead — same interaction as Match %. */
      case "verification": {
        const v = getVerificationStyle(a.verification)
        return (
          <td key={key} style={{ ...style, textAlign: "center" }}>
            <button
              onClick={(e) => openPopupFromEvent("verification", a, e)}
              title={`${a.verificationLabel} — click for the full breakdown`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap hover:brightness-95"
              style={{ backgroundColor: v.bg, color: v.color }}
            >
              <span>{a.verificationBadge}</span>
              {a.verification}
              <Info size={11} className="opacity-60" />
            </button>
          </td>
        )
      }

      case "roleExpertise":
        return (
          <td key={key} style={style}>
            <div className="leading-snug">
              <div className="text-[#4a352f]">
                <TruncatedText text={a.headline} maxLength={26} />
              </div>
              {(a.advisorRole !== "" || a.functionalExpertise !== "") && (
                <div className="text-[10px] text-[#a89482] mt-0.5">
                  {[a.advisorRole, a.functionalExpertise].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
          </td>
        )

      case "sectorExperience":
        return (
          <td key={key} style={style}>
            <TruncatedText text={a.sectorExperience} maxLength={28} />
          </td>
        )

      case "engagementModel":
        return (
          <td key={key} style={style}>
            {a.engagementModel && a.engagementModel !== "Not specified" ? (
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#f5f0e1] text-[#4a352f] text-[10px] font-medium">
                {a.engagementModel}
              </span>
            ) : (
              <span className="text-[#a89482] text-xs">-</span>
            )}
          </td>
        )

      case "availability":
        return (
          <td key={key} style={style}>
            <span className="text-xs">{a.availability}</span>
          </td>
        )

      case "status": {
        const s = getStatusStyle(status)
        return (
          <td key={key} style={style}>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ backgroundColor: s.color, color: s.textColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.textColor }} />
              {status}
            </span>
          </td>
        )
      }

      case "dateMatched":
        return (
          <td key={key} style={style}>
            {statuses[a.id]?.dateMatched ? (
              new Date(statuses[a.id].dateMatched?.toDate?.() || statuses[a.id].dateMatched).toLocaleDateString("en-ZA", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            ) : (
              <span className="text-[#a89482] text-xs">-</span>
            )}
          </td>
        )

      default:
        return (
          <td key={key} style={style}>
            <TruncatedText text={a[key]} maxLength={28} />
          </td>
        )
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-[#7d5a50] text-sm">Loading advisors...</div>
  }

  /* Every filter popover is driven by this one list, so adding a column means
     adding one row here rather than a new JSX block. */
  const FILTER_OPTION_SETS = [
    { type: "name", label: "Advisor name", options: nameOptions },
    { type: "applicationId", label: "Application ID", options: applicationIdOptions },
    { type: "requestedService", label: "Requested Service", options: requestedServiceOptions },
    { type: "verification", label: "Verification Status", options: verificationOptions },
    { type: "roleExpertise", label: "Role / Expertise", options: roleExpertiseOptions },
    { type: "sectorExperience", label: "Sector Experience", options: sectorOptions },
    { type: "engagementModel", label: "Compensation Model", options: COMPENSATION_MODELS },
    { type: "availability", label: "Availability", options: availabilityOptions },
    { type: "status", label: "Status", options: ADVISOR_STATUSES },
    { type: "yearsExperience", label: "Years of Experience", options: yearsExperienceOptions },
    { type: "qualifications", label: "Qualifications", options: qualificationOptions },
    { type: "previousRoles", label: "Previous Roles", options: previousRoleOptions },
    { type: "location", label: "Geographic Location", options: locationOptions.length ? locationOptions : AFRICAN_COUNTRIES },
    { type: "workPreference", label: "Virtual / In-Person", options: workPreferenceOptions },
    { type: "languages", label: "Languages", options: languageOptions },
    { type: "feeRange", label: "Fee Range", options: feeRangeOptions },
    { type: "boardExperience", label: "Board Experience", options: boardExperienceOptions },
    { type: "references", label: "References", options: referenceOptions },
    { type: "smeStageFit", label: "SME Stage Fit", options: stageFitOptions },
  ]

  /* ═══════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════ */
  return (
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
              Company Advisor Connections — Role: {userRole?.toUpperCase()}
            </h3>
          </div>
          <p className="m-0 text-sm leading-relaxed text-[#4a5568]">
            {userRole === "owner" && "You can view and manage all company advisor connections."}
            {userRole === "admin" && "You can view and connect with advisors for the company."}
            {userRole === "manager" && "You can view advisor connections and track their progress."}
            {userRole === "employee" && "You can view company advisor connections."}
            {userRole === "viewer" && "You have read-only access to company advisor connections."}
          </p>
        </div>
      )}

      {/* Inline banner, same as the SME and intern tables */}
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
            <h2 className="text-lg font-bold text-[#4a352f] m-0">Advisor Matches</h2>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
              <LayoutGrid size={12} className="text-[#7d5a50] flex-shrink-0" />
              Viewing: {activeView.name}
              {activeView.description && <span className="font-normal text-[#a89482]"> — {activeView.description}</span>}
            </span>

            {/* Which application the table is scoped to, with the way back out. */}
            {activeApplicationFilter && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#5d4037]/10 text-[#4a352f] border border-[#5d4037]/40">
                <Hash size={12} className="text-[#7d5a50]" />
                Application: {activeApplicationFilter.slice(-8).toUpperCase()}
                <span className="font-normal text-[#a89482]">({filteredAdvisors.length})</span>
                <button
                  onClick={clearApplicationFilter}
                  className="ml-1 px-2 py-0.5 rounded-lg bg-white border border-[#c8b6a6] text-[#7d5a50] hover:bg-[#f5f0e1] font-semibold"
                >
                  View All Matches
                </button>
              </span>
            )}

            {/* The score band the Applications page sent, or one set here in the
                Match % filter. Named the same way it was picked over there. */}
            {matchRangeLabel && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#e8f5e8]/70 text-[#4a352f] border border-[#48BB78]/40">
                <Target size={12} className="text-[#7d5a50]" />
                Match: {matchRangeLabel}
                <span className="font-normal text-[#a89482]">({filteredAdvisors.length})</span>
                <button
                  onClick={clearMatchRange}
                  className="ml-1 px-2 py-0.5 rounded-lg bg-white border border-[#c8b6a6] text-[#7d5a50] hover:bg-[#f5f0e1] font-semibold"
                >
                  Show all scores
                </button>
              </span>
            )}

            {/* Which pipeline stage the table is narrowed to. Press the same
                card again in the pipeline to clear it. */}
            {activeStageFilter && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#a67c52]/10 text-[#4a352f] border border-[#a67c52]/40">
                <Target size={12} className="text-[#7d5a50]" />
                Pipeline stage: {activeStageFilter}
                <span className="font-normal text-[#a89482]">({filteredAdvisors.length})</span>
              </span>
            )}

            {/* Saved matches. The bookmark on each row writes here; this is
                where you get them back. */}
            {(showSavedOnly || savedCount > 0) && (
              <button
                onClick={() => setShowSavedOnly((v) => !v)}
                title={showSavedOnly ? "Show all advisors" : "Show only saved advisors"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  showSavedOnly
                    ? "bg-[#a67c52] text-white border-[#a67c52]"
                    : "bg-white text-[#4a352f] border-[#c8b6a6] hover:bg-[#f5f0e1]"
                }`}
              >
                <Bookmark size={12} fill={showSavedOnly ? "#ffffff" : "none"} />
                {showSavedOnly ? "Showing saved only" : "Saved"} ({savedCount})
              </button>
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
                                  onChange={(e) => setEditingViewMeta((prev) => ({ ...prev, description: e.target.value }))}
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
                        <span className="text-sm text-[#4a352f] flex-1">Application ID</span>
                        <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Pinned</span>
                      </div>
                      <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                        <input type="checkbox" checked disabled className="rounded border-[#c8b6a6]" />
                        <span className="text-sm text-[#4a352f] flex-1">Advisor Name</span>
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
            /* No 'position: relative' here — that is what the shared kit had,
               and it silently overrode the sticky positioning on every <th>,
               so the header scrolled away while the pinned body cells stayed.
               Sticky is itself a positioned ancestor, so the absolutely
               placed grip and resize handle still anchor correctly. */
            .at-th { color: #faf7f2 !important; vertical-align: top !important; }
            .at-th-draggable { cursor: grab; }
            .at-th-draggable:active { cursor: grabbing; }
            .at-th-row { display: flex; align-items: flex-start; gap: 2px; min-width: 0; }
            /* overflow-wrap: normal stops the browser splitting inside a word,
               which is what turned "Match %" into "MAT CH.." and "Status" into
               "STA TUS" in narrow columns. */
            .at-th-label {
              flex: 1 1 auto; min-width: 0;
              display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
              overflow: hidden; white-space: normal;
              overflow-wrap: normal; word-break: normal; hyphens: none;
              line-height: 1.2; letter-spacing: 0.02em;
            }
            .at-th-tools { display: flex; align-items: center; flex-shrink: 0; }
            /* The drag grip leaves the flex flow and only appears on hover,
               buying every header ~14px more room for its label. */
            .at-th-grip { position: absolute; left: 3px; top: 10px; opacity: 0; transition: opacity .15s; }
            .at-th:hover .at-th-grip { opacity: .45; }
            .at-resize { position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: col-resize; z-index: 5; }
            .at-resize:hover { background: rgba(255,255,255,0.25); }
          `}</style>

          <table
            style={{
              /* separate (not collapse) — collapsed borders are dropped by
                 sticky cells, which made the pinned column lose its edge and
                 mispaint over its neighbour while scrolling. */
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
                {/* Application ID — first pinned column */}
                <th
                  className="at-th font-semibold uppercase tracking-wider text-xs sticky top-0 left-0 z-30 text-left"
                  style={{
                    backgroundColor: "#4a352f",
                    width: appIdWidth,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                    borderRight: "1px solid #e6d7c3",
                  }}
                >
                  <div className="at-th-row">
                    <span className="at-th-label" title="Application ID">
                      Application ID
                    </span>
                    <span className="at-th-tools">
                      <SortTrigger columnKey="applicationId" />
                      <FilterTrigger type="applicationId" active={localFilters.applicationId.length > 0} />
                      <HeaderInfoTooltip text="The advisory request this match belongs to. Matches made before an application was submitted show a dash." />
                    </span>
                  </div>
                  <ColumnResizer colKey={APPID_KEY} />
                </th>

                {/* Advisor — second pinned column */}
                <th
                  className="at-th font-semibold uppercase tracking-wider text-xs sticky top-0 z-30 text-left"
                  style={{
                    backgroundColor: "#4a352f",
                    left: appIdWidth,
                    width: advisorWidth,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                    boxShadow: "2px 0 0 #e6d7c3",
                  }}
                >
                  <div className="at-th-row">
                    <span className="at-th-label" title="Advisor Name">
                      Advisor Name
                    </span>
                    <span className="at-th-tools">
                      <SortTrigger columnKey="name" />
                      <FilterTrigger type="name" active={localFilters.name.length > 0} />
                      <HeaderInfoTooltip text="The advisor's name. Click the eye to open their full profile." />
                    </span>
                  </div>
                  <ColumnResizer colKey={ADVISOR_KEY} />
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
                      className={`at-th at-th-draggable font-semibold uppercase tracking-wider text-xs sticky top-0 select-none transition-opacity ${
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
                      <GripVertical size={11} className="at-th-grip" />
                      <div className={`at-th-row ${col.align === "center" ? "justify-center" : ""}`}>
                        <span className="at-th-label" title={col.label}>
                          {col.label}
                        </span>
                        <span className="at-th-tools">
                          {pinned[key] && <Pin size={10} className="opacity-60 mt-0.5" />}
                          {col.sortable && <SortTrigger columnKey={key} />}
                          <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} />
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
                  className="at-th text-center font-semibold uppercase tracking-wider text-xs sticky top-0 z-20"
                  style={{
                    backgroundColor: "#4a352f",
                    width: actionWidth,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                  }}
                >
                  <div className="at-th-row justify-center">
                    <span className="at-th-label">Action</span>
                    <HeaderInfoTooltip text="Apply is the only move you make. After that the advisor drives the pipeline, and this shows the stage they can move you to next." />
                  </div>
                  <ColumnResizer colKey={ACTION_KEY} />
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredAdvisors.length === 0 ? (
                <tr>
                  <td
                    colSpan={orderedColumns.length + 3}
                    style={{ ...tableCellStyle, textAlign: "center", padding: "3rem 1rem", borderRight: "none" }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-[#f5f0e1] flex items-center justify-center">
                        <Users size={26} className="text-[#7d5a50] opacity-50" />
                      </div>
                      <p className="text-sm font-semibold text-[#4a352f] m-0">
                        {advisors.length === 0
                          ? "No advisor matches yet"
                          : showSavedOnly
                            ? "No saved advisors"
                            : activeApplicationFilter
                              ? matchRangeLabel
                                ? `No advisors ${matchRangeLabel.toLowerCase()} on this application`
                                : "No advisors matched to this application"
                              : activeStageFilter
                                ? `No advisors at ${activeStageFilter}`
                                : "No advisors match these filters"}
                      </p>
                      <p className="text-xs text-[#a89482] m-0">
                        {advisors.length === 0
                          ? "Complete your advisory needs assessment to start seeing matches."
                          : showSavedOnly
                            ? "Bookmark a row to keep it here."
                            : activeApplicationFilter
                              ? "Widen the score band, show every advisor instead, or run AI matching on this application."
                              : activeStageFilter
                                ? "Press that stage card again to clear the filter."
                                : "Clear a filter to widen the results."}
                      </p>
                      {matchRangeLabel && (
                        <button
                          onClick={clearMatchRange}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7d5a50] text-white"
                        >
                          Show all scores
                        </button>
                      )}
                      {activeApplicationFilter && (
                        <button
                          onClick={clearApplicationFilter}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7d5a50] text-white"
                        >
                          View All Matches
                        </button>
                      )}
                      {showSavedOnly && (
                        <button
                          onClick={() => setShowSavedOnly(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7d5a50] text-white"
                        >
                          Show all advisors
                        </button>
                      )}
                      {activeFilterCount > 0 && advisors.length > 0 && (
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
                filteredAdvisors.map((a) => {
                  const status = statusOf(a)
                  const action = getRowActions(status)
                  const isSaved = !!savedMatches[a.id]
                  const canApply = action.kind === "connect"
                  const isAwaiting = action.kind === "await"
                  const rowBg = hoveredRow === a.id ? "#fdf8f4" : "#ffffff"
                  const busy = connectingId === a.id

                  return (
                    <tr
                      key={a.id}
                      onMouseEnter={() => setHoveredRow(a.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ backgroundColor: rowBg, transition: "background-color .15s" }}
                    >
                      {/* Application ID — pinned left */}
                      <td
                        className="sticky left-0 z-10"
                        style={{
                          ...tableCellStyle,
                          width: appIdWidth,
                          backgroundColor: rowBg,
                        }}
                      >
                        {a.applicationId && a.applicationId !== "-" ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold tracking-wide text-[#FAF7F2]"
                            style={{ background: "linear-gradient(135deg,#5d4037,#4a332a)", fontFamily: "monospace" }}
                            title={`Full application id: ${a.applicationFullId}`}
                          >
                            <Hash size={10} /> {a.applicationId}
                          </span>
                        ) : (
                          <span className="text-[#a89482] text-xs">-</span>
                        )}
                      </td>

                      {/* Advisor — pinned left. Name only; location has its own column. */}
                      <td
                        className="sticky z-10"
                        style={{
                          ...tableCellStyle,
                          left: appIdWidth,
                          width: advisorWidth,
                          backgroundColor: rowBg,
                          borderRight: "none",
                          boxShadow: "2px 0 0 #e6d7c3",
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-[#4a352f] break-words text-sm">{a.name}</span>
                          <button
                            onClick={() => handleViewDetails(a)}
                            className="text-[#a89482] hover:text-[#7d5a50] flex-shrink-0"
                            aria-label={`View profile for ${a.name}`}
                            title="View profile"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>

                      {orderedColumns.map((key) => renderCell(key, a, rowBg))}

                      {/* Action — scrolls with the table */}
                      <td
                        style={{
                          ...tableCellStyle,
                          width: actionWidth,
                          borderRight: "none",
                          backgroundColor: rowBg,
                          textAlign: "center",
                        }}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {canApply ? (
                            <button
                              onClick={() => runRowAction(a, action)}
                              disabled={busy}
                              title={`Apply to ${a.name}`}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 text-white hover:shadow-md hover:brightness-105 disabled:opacity-60"
                              style={{
                                width: `${Math.max(96, actionWidth - 82)}px`,
                                height: "34px",
                                backgroundColor: "#7d5a50",
                              }}
                            >
                              {!busy && <ArrowRight size={13} className="flex-shrink-0" />}
                              <span className="truncate">{busy ? "Sending..." : action.label}</span>
                            </button>
                          ) : (
                            /* Read-only from here on. The advisor drives the
                               pipeline, so this names the stage they can move
                               the row to next and re-labels as they do. */
                            <div
                              title={
                                isAwaiting
                                  ? `Waiting on ${a.name} to move you to ${action.next}`
                                  : `${action.label} — no further stage`
                              }
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 border border-dashed"
                              style={{
                                width: `${Math.max(96, actionWidth - 82)}px`,
                                height: "34px",
                                backgroundColor: "#faf7f2",
                                borderColor: "#e6d7c3",
                                color: "#a89482",
                                cursor: "default",
                              }}
                            >
                              {isAwaiting && <Clock size={12} className="flex-shrink-0" />}
                              <span className="truncate">
                                {isAwaiting ? `Next: ${action.label}` : action.label}
                              </span>
                            </div>
                          )}

                          <button
                            onClick={() => toggleSaved(a)}
                            title={isSaved ? "Remove from saved" : "Save match"}
                            aria-label={isSaved ? "Remove from saved" : "Save match"}
                            aria-pressed={isSaved}
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
            {headerFilterOpen.type === "match" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">
                    Match %: {localFilters.matchRange[0]} - {localFilters.matchRange[1]}
                  </label>
                  {(localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100) && (
                    <button
                      onClick={clearMatchRange}
                      className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* The same bands the Applications page offers, so a range set
                    here and one arrived at from there are the same thing. */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    { label: "All", range: [0, 100] },
                    { label: "Above 75%", range: [75, 100] },
                    { label: "Above 50%", range: [50, 100] },
                    { label: "Below 50%", range: [0, 49] },
                  ].map((preset) => {
                    const isActive =
                      localFilters.matchRange[0] === preset.range[0] && localFilters.matchRange[1] === preset.range[1]
                    return (
                      <button
                        key={preset.label}
                        onClick={() => {
                          setLocalFilters((p) => ({ ...p, matchRange: preset.range }))
                          stripMatchRangeParams()
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          isActive ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
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
                  onChange={(e) =>
                    setLocalFilters((p) => ({ ...p, matchRange: [Number.parseInt(e.target.value), p.matchRange[1]] }))
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

      {/* ─── Verification popup ─────────────────────────────────────────────
          Replaces the Status Summary column: what the tier means, plus the
          five weighted categories it was scored on. */}
      {activePopup?.type === "verification" && (() => {
        const a = activePopup.advisor
        const v = getVerificationStyle(a.verification)
        return (
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
                    <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={12} /> Verification
                    </p>
                    <h3 className="text-sm font-bold mt-0.5 truncate max-w-[200px]">{a.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xl font-bold">{a.verificationScore}%</div>
                    <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="rounded-xl p-3" style={{ backgroundColor: v.bg }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{a.verificationBadge}</span>
                    <span className="text-sm font-bold" style={{ color: v.color }}>
                      {a.verification} — {a.verificationLabel}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed m-0" style={{ color: v.color }}>
                    {a.verificationSummary}
                  </p>
                </div>

                {Object.entries(a.verificationBreakdown || {}).map(([category, data]) => (
                  <div key={category} className="bg-[#faf7f2] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[#4a352f]">
                        {VERIFICATION_CATEGORY_LABELS[category] || category}
                      </span>
                      <span className="text-xs font-semibold text-[#7d5a50]">
                        {data.score} / {data.max}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#e6d7c3] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(data.score / data.max) * 100}%`, backgroundColor: v.color }}
                      />
                    </div>
                    <div className="text-[10px] text-[#a89482] mt-1">Weight: {Math.round(data.weight * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </PopupPortal>
        )
      })()}

      {/* ─── Quick Actions popup ───────────────────────────────────────── */}
      {activePopup?.type === "quickActions" && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div
            className="fixed z-[1001] bg-white rounded-xl shadow-2xl border border-[#e6d7c3] py-1 overflow-hidden"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: "224px" }}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#e6d7c3]">
              <span className="text-xs font-semibold text-[#4a352f]">Quick Actions</span>
              <button onClick={closePopup} className="text-[#7d5a50] hover:text-[#4a352f]">
                <X size={14} />
              </button>
            </div>
            <button
              onClick={() => handleViewDetails(activePopup.advisor)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Eye size={12} /> View Profile
            </button>
            <button
              onClick={() => openPopup("match", activePopup.advisor, activePopup.rect)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Target size={12} /> Why This Match?
            </button>
            <button
              onClick={() => openPopup("verification", activePopup.advisor, activePopup.rect)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <ShieldCheck size={12} /> Verification Breakdown
            </button>
            <button
              onClick={() => {
                const target = activePopup.advisor
                closePopup()
                toggleSaved(target)
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Bookmark size={12} fill={savedMatches[activePopup.advisor.id] ? "#a67c52" : "none"} />
              {savedMatches[activePopup.advisor.id] ? "Remove from Saved" : "Save Match"}
            </button>
            <button
              onClick={() => {
                closePopup()
                setShowSavedOnly(true)
                toast(
                  "info",
                  savedCount > 0
                    ? `Showing your ${savedCount} saved advisor${savedCount === 1 ? "" : "s"}.`
                    : "You haven't saved any advisors yet — use the bookmark on a row.",
                  3000,
                )
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <LayoutGrid size={12} /> View Saved Advisors ({savedCount})
            </button>
            <div className="border-t border-[#e6d7c3] my-1" />
            {/* Hiding is a view preference, not a stage change — the advisor
                owns the pipeline, so no status actions live here. */}
            <button
              onClick={() => {
                const target = activePopup.advisor
                closePopup()
                setHiddenMatches((p) => ({ ...p, [target.id]: true }))
                toast("info", `${target.name} hidden from your matches.`, 2500)
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <EyeOff size={12} /> Hide Match
            </button>
            <button
              onClick={() => {
                const target = activePopup.advisor
                closePopup()
                handleSetStatus(target, "Declined")
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#D32F2F] hover:bg-[#faf7f2] text-left"
            >
              <XCircle size={12} /> Withdraw Interest
            </button>
          </div>
        </PopupPortal>
      )}

      {/* ─── Why this match? — anchored popover, SME/intern styling ─────── */}
      {activePopup?.type === "match" && (
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
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[200px]">{activePopup.advisor.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold">{activePopup.advisor.matchPercentage}%</div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {activePopup.advisor.matchBreakdown ? (
                Object.entries(activePopup.advisor.matchBreakdown).map(([key, c]) => {
                  const color = c.matched ? "#22c55e" : "#ef4444"
                  const smeValue = Array.isArray(c.smeValue)
                    ? c.smeValue.join(", ") || "Not specified"
                    : String(c.smeValue || "Not specified")
                  const advisorValue = Array.isArray(c.advisorValue)
                    ? c.advisorValue.join(", ") || "Not specified"
                    : String(c.advisorValue || "Not specified")
                  return (
                    <div key={key} className="p-3 rounded-lg border border-[#e6d7c3] bg-[#faf7f2] text-xs">
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <span className="font-semibold text-[#4a352f]">{CATEGORY_LABEL[key] || formatLabel(key)}</span>
                        <span className="font-bold flex-shrink-0" style={{ color }}>
                          {c.matched ? "Match" : "No match"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full" style={{ width: c.matched ? "100%" : "0%", backgroundColor: color }} />
                      </div>
                      <div className="text-[11px] text-[#7d5a50] leading-relaxed">
                        <div>
                          <span className="font-semibold">Your need:</span> {smeValue}
                        </div>
                        <div className="mt-0.5">
                          <span className="font-semibold">Advisor offers:</span> {advisorValue}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-[#a89482] text-center py-4">No breakdown available for this advisor yet.</p>
              )}
            </div>
          </div>
        </PopupPortal>
      )}

      {/* ─── Advisor profile pop-up ─────────────────────────────────────────
          AdvisorDetailsModal keys off advisorId / advisorName / finalScore —
          the shape AdvisorMatchesTable passes from smseAdvisoryMatches. This
          table's rows are { id, name, matchPercentage }, so passing the row
          straight through left advisor.advisorId undefined, the profile fetch
          never ran, and every field fell back to undefined. Mapped here rather
          than inside the modal so the Applications page keeps working. */}
      {mounted && detailsAdvisor && (
        <AdvisorDetailsModal
          advisor={{
            ...detailsAdvisor,
            advisorId: detailsAdvisor.id,
            advisorName: detailsAdvisor.name,
            finalScore: detailsAdvisor.matchPercentage,
          }}
          isOpen
          onClose={() => setDetailsAdvisor(null)}
        />
      )}
    </div>
  )
}

export default AdvisorTable