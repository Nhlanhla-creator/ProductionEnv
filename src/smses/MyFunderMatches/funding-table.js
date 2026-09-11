"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import {
  Eye,
  X,
  XCircle,
  HelpCircle,
  Timer,
  AlertTriangle,
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
  StickyNote,
  Wallet,
  Info,
  Hash,
} from "lucide-react"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  query,
  where,
  onSnapshot,
  writeBatch,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getFunctions, httpsCallable } from "firebase/functions"
import get from "lodash.get"
import { db, storage, auth } from "../../firebaseConfig"
import { DOCUMENT_PATHS } from "../../utils/documentUtils"
import FunderDetailsModal from "./FunderDetailsModal"
import {
  calculateHybridScore,
  calculateAdjustedBigScore,
  getFunderScoreWeightings,
  normalizeSMEProfile,
  normalizeAmount,
  formatLabel,
  formatDocumentLabel,
  formatSectorLabel,
  formatTicketSize,
  formatLocation,
  formatInvestmentStage,
  formatSupport,
  formatWaitingTime,
} from "./funderMatching"
import { RESPONSIVENESS_COLLECTION, ResponsivenessBadge, responsivenessSortValue } from "./responsiveness"

/* ════════════════════════════════════════════════════════════════════════════
   This file no longer imports ./matchTableKit.

   The kit rendered the header row, and its own <style> block set
   `position: relative` on every <th>, which overrode the sticky positioning.
   The header scrolled away while the pinned body cells stayed frozen — fund
   names sliding over the next column, and the ACTION label drifting away from
   its buttons. The table now owns its head, toolbar, filters and row actions,
   identical to InternTablePage and AdvisorTable.
   ════════════════════════════════════════════════════════════════════════ */

/* Scoring lives in funderMatching.js. Named re-exports rather than
   `export *` — webpack could not resolve the star form through this file. */
export {
  normalizeText,
  normalizeStage,
  normalizeSector,
  normalizeAmount,
  normalizeSMEProfile,
  normalizeInvestorFund,
  expandSectorsWithSynonyms,
  SECTOR_SYNONYMS,
  HYBRID_WEIGHTS,
  calculateHybridScore,
  calculateAdjustedBigScore,
  getFunderScoreWeightings,
  formatLabel,
  formatDocumentLabel,
  formatSectorLabel,
  formatTicketSize,
  formatLocation,
  formatSingleLocation,
  formatInvestmentStage,
  formatSupport,
  formatWaitingTime,
} from "./funderMatching"

/* ════════════════════════════════════════════════════════════════════════════
   Collections.
   ════════════════════════════════════════════════════════════════════════ */
export const SME_APPLICATIONS = "smeApplications"
export const INVESTOR_APPLICATIONS = "investorApplications"
export const SME_FUNDER_COLLECTION = "SmeFunderMatches"
export const REMOVED_FUNDERS = "removedFunders"

export const fundKeyOf = (funderId, fundName) => `${funderId}__${fundName}`
export const applicationIdOf = (smeId, funderId, fundName) => `${smeId}__${funderId}__${fundName}`

export const BIG_SCORE_MINIMUM = 85

/* ════════════════════════════════════════════════════════════════════════════
   Events the pipeline uses to talk to this table.
   ════════════════════════════════════════════════════════════════════════ */
export const FUNDING_STAGE_FILTER_EVENT = "funding-pipeline-stage-filter"
export const FUNDING_ROWS_EVENT = "funding-pipeline-rows"
export const FUNDING_ROWS_REQUEST_EVENT = "funding-pipeline-rows-request"

/* Applications page → table. Detail is a fundingApplicationsV2 id to scope to,
   or null for "View All Matches". */
export const FUNDING_APPLICATION_FILTER_EVENT = "funding-application-filter"

/* Applications page → table. Detail is a [min, max] score band, from the band
   picker on the row the user opened. */
export const FUNDING_MATCH_RANGE_EVENT = "funding-match-range-filter"

/* ─── Status vocabulary ─────────────────────────────────────────────────── */
export const FUNDER_STATUSES = [
  "New Match",
  "Viewed",
  "Shortlisted",
  "Application Started",
  "Applied",
  "Under Review",
  "Accepted",
  "Termsheet",
  "Funded",
  "Declined",
  "Closed",
]

const LEGACY_STATUS_ALIASES = {
  Match: "New Match",
  Matched: "New Match",
  Saved: "Shortlisted",
  "Application Sent": "Applied",
  "Application Received": "Applied",
  Pending: "Applied",
  "Funding Approved": "Accepted",
  "Term Sheet": "Termsheet",
  "Deal Complete": "Funded",
  "Deal Closed": "Funded",
  "Deal Declined": "Declined",
  Rejected: "Declined",
}
export const normalizeFunderStatus = (s) => LEGACY_STATUS_ALIASES[s] || s || "New Match"

const STATUS_TYPES = {
  "New Match": { color: "#F5F0E1", textColor: "#7D5A50" },
  Viewed: { color: "#EFEBE9", textColor: "#5D4037" },
  Shortlisted: { color: "#FFF3E0", textColor: "#F57C00" },
  "Application Started": { color: "#E8EAF6", textColor: "#3949AB" },
  Applied: { color: "#EDE7F6", textColor: "#5E35B1" },
  "Under Review": { color: "#E3F2FD", textColor: "#1565C0" },
  Accepted: { color: "#E8F5E8", textColor: "#388E3C" },
  Termsheet: { color: "#E0F7FA", textColor: "#00838F" },
  Funded: { color: "#E0F2F1", textColor: "#00695C" },
  Declined: { color: "#FFEBEE", textColor: "#D32F2F" },
  Closed: { color: "#EEEEEE", textColor: "#616161" },
}
const getStatusStyle = (status) => STATUS_TYPES[status] || { color: "#F5F5F5", textColor: "#666666" }

/* One primary action per row; everything else lives in the three-dot quick
   actions popup, matching the SME, intern and advisor tables. */
const getRowActions = (status) => {
  switch (status) {
    case "New Match":
    case "Viewed":
    case "Shortlisted":
      return { primary: "Apply", kind: "apply" }
    case "Application Started":
      return { primary: "Continue Application", kind: "apply" }
    case "Applied":
      return { primary: "View Application", kind: "view" }
    case "Under Review":
      return { primary: "View Status", kind: "view" }
    case "Accepted":
      return { primary: "View Next Steps", kind: "view" }
    case "Termsheet":
      return { primary: "View Termsheet", kind: "view" }
    case "Funded":
      return { primary: "View Deal", kind: "view" }
    case "Declined":
    case "Closed":
      return { primary: "View Outcome", kind: "view" }
    default:
      return { primary: "View Funding", kind: "view" }
  }
}

/* The Applications page links here as
   /funding-matches?applicationId=<id>&matchMin=<n>&matchMax=<n>, so both the
   application scope and the score band survive the route change — an event
   fired before this component mounts has nobody listening. */
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

/* ─── Shared helpers (previously imported from the kit) ──────────────────── */
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

const TruncatedText = ({ text, maxLength = 30 }) => {
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
  if (!value) return null
  if (typeof value?.toDate === "function") return value.toDate()
  if (value?.seconds != null) return new Date(value.seconds * 1000)
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export const formatDateValue = (value) => {
  const d = toDateSafe(value)
  if (!d) return null
  return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
}

export const toISODateOnly = (value) => {
  const d = toDateSafe(value)
  if (!d) return ""
  return d.toISOString().slice(0, 10)
}

/* ════════════════════════════════════════════════════════════════════════════
   Section C column configuration.

   Funder is the pinned first column and Action the last, so neither appears
   here — but both resize like everything else, via the reserved width keys
   further down.
   ════════════════════════════════════════════════════════════════════════ */
const COLUMN_DEFS = {
  applicationRequest: { label: "Application Request", width: 186, filterType: "applicationRequest", visible: true, priority: 2, sortable: true, tooltip: "The funding application this fund was matched to. Funds surfaced before you created an application show a dash." },
  match: { label: "Match %", align: "center", width: 136, filterType: "match", visible: true, priority: 1, sortable: true, tooltip: "How well this fund's mandate fits your business — sector, stage, ticket size and instrument. Click the ? for the breakdown." },
  adjustedBigScore: { label: "Adjusted BIG Score", align: "center", width: 162, filterType: "adjustedBigScore", visible: true, priority: 2, sortable: true, tooltip: "Your BIG Score re-weighted the way this particular funder scores businesses, so it can differ from your platform score." },
  fundingInstrument: { label: "Funding Instrument", width: 176, filterType: "fundingInstrument", visible: true, priority: 2, sortable: true, tooltip: "What form the money takes — debt, equity, grant, blended and so on." },
  fundingRange: { label: "Funding Range", width: 184, filterType: "fundingRange", visible: true, priority: 3, sortable: true, tooltip: "The smallest and largest cheque this fund writes. Ask outside that band and you'll usually be declined on size alone." },
  businessStage: { label: "Business Stage", width: 158, filterType: "businessStage", visible: true, priority: 3, sortable: true, tooltip: "The stages of business this fund backs, from idea through to established." },
  deadline: { label: "Application Deadline", width: 168, filterType: "deadline", visible: true, priority: 3, sortable: true, tooltip: "The closing date for this round. Funds with no date accept applications on a rolling basis." },
  status: { label: "Status", width: 148, filterType: "status", visible: true, priority: 1, sortable: true, tooltip: "Where you stand with this fund, from New Match through to Funded, Declined or Closed." },
  responsiveness: { label: "Responsiveness", width: 160, filterType: "responsiveness", visible: true, priority: 3, sortable: true, tooltip: "Median business days from an enquiry to this funder's first reply, across every SME who approached them. It measures the first reply, not the final decision." },

  interestRate: { label: "Interest Rate", width: 140, filterType: "interestRate", visible: false, priority: 4, sortable: true, tooltip: "What the fund charges on debt, where it has published a rate." },
  investmentTerm: { label: "Investment Term", width: 152, filterType: "investmentTerm", visible: false, priority: 4, sortable: true, tooltip: "How long the funding runs before repayment or exit." },
  equityExpectation: { label: "Equity Expectation", width: 162, filterType: "equityExpectation", visible: false, priority: 4, sortable: true, tooltip: "The share of your business the fund typically takes." },
  securityRequirements: { label: "Security Requirements", width: 180, filterType: "securityRequirements", visible: false, priority: 4, sortable: false, tooltip: "Collateral or guarantees the fund asks for before releasing money." },
  geographicMandate: { label: "Geographic Mandate", width: 176, filterType: "geographicMandate", visible: false, priority: 4, sortable: true, tooltip: "Where the fund is allowed to deploy capital. Outside it, they cannot invest even if everything else fits." },
  sectorMandate: { label: "Sector Mandate", width: 176, filterType: "sectorMandate", visible: false, priority: 4, sortable: true, tooltip: "The industries this fund backs. Generalist means no sector restriction." },
  turnoverRequirements: { label: "Turnover Requirements", width: 180, filterType: "turnoverRequirements", visible: false, priority: 4, sortable: true, tooltip: "The minimum annual revenue the fund expects before it will consider you." },
  funderType: { label: "Funder Type", width: 148, filterType: "funderType", visible: false, priority: 4, sortable: true, tooltip: "What kind of institution this is — bank, DFI, VC, foundation and so on." },
  useOfFundsRestrictions: { label: "Use-of-Funds Restrictions", width: 198, filterType: "useOfFundsRestrictions", visible: false, priority: 4, sortable: false, tooltip: "What the money may not be spent on." },
  coFundingRequirement: { label: "Co-Funding Requirement", width: 188, filterType: "coFundingRequirement", visible: false, priority: 4, sortable: true, tooltip: "How much you're expected to raise elsewhere or contribute yourself alongside this fund." },
  supportOffered: { label: "Support Offered", width: 168, filterType: "supportOffered", visible: false, priority: 4, sortable: false, tooltip: "Non-financial help that comes with the money — mentorship, market access, technical assistance." },
  reviewTime: { label: "Estimated Review Time", width: 176, filterType: "reviewTime", visible: false, priority: 4, sortable: false, tooltip: "How long the funder says it takes to assess an application." },
  funderStage: { label: "Funder Stage", width: 158, filterType: "funderStage", visible: false, priority: 4, sortable: true, tooltip: "The funder's own internal pipeline label, kept verbatim. Finer-grained than Status." },
  documents: { label: "Documents", align: "center", width: 128, filterType: null, visible: false, priority: 4, sortable: true, tooltip: "How many documents this fund requires with an application." },
  dateMatched: { label: "Date Matched", width: 144, filterType: "dateMatched", visible: false, priority: 4, sortable: true, tooltip: "When this fund first appeared in your matches, or the date you applied." },
  notes: { label: "Notes", width: 198, filterType: "notes", visible: false, priority: 4, sortable: false, tooltip: "Your own private notes on this fund. Nobody at the funder can see them." },
}

const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS)
const DEFAULT_COLUMN_VISIBILITY = Object.fromEntries(
  DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].visible !== false]),
)
const DEFAULT_COLUMN_WIDTHS = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].width]))
const DEFAULT_PINNED = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, null]))
const DEFAULT_DENSITY = "comfortable"

/* Funder and Action can't be hidden or reordered, so they aren't in
   COLUMN_DEFS — but they resize like everything else, and their widths live
   under these reserved keys inside the same columnWidths map. */
const APPID_KEY = "__appId__"
const FUNDER_KEY = "__funder__"
const ACTION_KEY = "__action__"
const FIXED_WIDTHS = { [APPID_KEY]: 132, [FUNDER_KEY]: 222, [ACTION_KEY]: 220 }
const MIN_COLUMN_WIDTH = 84

/* Every filter is a list of selected values, so the header popovers can offer
   what is actually in the table rather than a blank search box. Notes stays a
   text search — chips of whole notes would be unusable. */
const EMPTY_FILTERS = {
  name: [],
  applicationId: [],
  applicationRequest: [],
  matchRange: [0, 100],
  bigScoreRange: [0, 100],
  fundingInstrument: [],
  fundingRange: [],
  businessStage: [],
  deadlineFrom: "",
  deadlineTo: "",
  status: [],
  responsiveness: [],
  interestRate: [],
  investmentTerm: [],
  equityExpectation: [],
  securityRequirements: [],
  geographicMandate: [],
  sectorMandate: [],
  turnoverRequirements: [],
  funderType: [],
  useOfFundsRestrictions: [],
  coFundingRequirement: [],
  supportOffered: [],
  reviewTime: [],
  funderStage: [],
  matchedFrom: "",
  matchedTo: "",
  notes: "",
}

/* ─── Saved views + filter persistence ──────────────────────────────────── */
const BUILTIN_VIEW_ID = "__default__"
// v3: the fixed columns now store their widths in this map too, so a v2 view
// would leave them undefined.
const VIEWS_STORAGE_KEY = "funder-matches-views-v4"
// v2: every text filter became a multi-select array.
const FILTERS_STORAGE_KEY = "funder-matches-filters-v3"
const SAVED_STORAGE_KEY = "funder-matches-saved-v1"

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
    /* matchRange and bigScoreRange hold numbers, not selected values, so the
       coercion above can leave either as a one-element array of a string. Put
       them back to numeric pairs — every filter comparison depends on it. */
    const fixRange = (range) =>
      Array.isArray(range) && range.length === 2 && range.every((n) => Number.isFinite(Number(n)))
        ? [Number(range[0]), Number(range[1])]
        : [0, 100]
    merged.matchRange = fixRange(merged.matchRange)
    merged.bigScoreRange = fixRange(merged.bigScoreRange)
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

const RESPONSIVENESS_BANDS = ["Within 3 days", "Within 10 days", "Slower than 10 days", "Not enough data"]
const responsivenessBand = (metric) => {
  if (!metric?.meetsThreshold) return "Not enough data"
  if (metric.median <= 3) return "Within 3 days"
  if (metric.median <= 10) return "Within 10 days"
  return "Slower than 10 days"
}

const CATEGORY_LABEL = {
  sector: "Sector Mandate",
  stage: "Business Stage",
  ticket: "Funding Range",
  type: "Funding Instrument",
}

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : [])

/* ─── Row mapping ───────────────────────────────────────────────────────────
   One row per fund, not per funder. The old table pushed the fund manager's
   registered name into `name` for every fund they run, so a manager with three
   funds produced three identical-looking rows, and applying to one marked all
   three as applied because the duplicate check keys on that name.
   ──────────────────────────────────────────────────────────────────────── */
const mapFund = (investor, funderId, fund, index) => {
  const form = investor.formData || {}
  const overview = form.fundManageOverview || {}
  const prefs = form.generalInvestmentPreference || {}
  const brief = form.applicationBrief || {}
  const contact = form.contactDetails || {}
  const fundProfile = form.fundDetails?.funds?.[index] || fund

  const isAnonymous = investor.anonymous === true
  const funderName = isAnonymous ? "Anonymous funder" : overview.registeredName || overview.tradingName || "Unnamed funder"

  const minTicket =
    fundProfile?.minimumTicket ?? fundProfile?.minTicket ?? fund.minimumTicket ?? fund.minTicket ??
    form.fundDetails?.minimumTicket ?? fundProfile?.ticketSize?.min ?? 0
  const maxTicket =
    fundProfile?.maximumTicket ?? fundProfile?.maxTicket ?? fund.maximumTicket ?? fund.maxTicket ??
    form.fundDetails?.maximumTicket ?? fundProfile?.ticketSize?.max ?? fund.size ?? 0

  const instruments = asList(prefs.investmentFocus)
  const stages = asList(prefs.investmentStage)
  const sectors = asList(prefs.sectorFocus)
  const geography = [...asList(prefs.geographicFocus), ...asList(prefs.selectedProvinces), ...asList(prefs.selectedCountries)]

  const documentCount = asList(brief.coreDocuments).length

  return {
    id: fundKeyOf(funderId, fund.name || `fund-${index}`),
    funderId,
    fundName: fund.name || `Fund ${index + 1}`,
    funderName,
    anonymous: isAnonymous,
    fullProfile: form,

    scoringFund: {
      ...fund,
      stages,
      sectorFocus: sectors,
      sectorExclusions: asList(prefs.sectorExclusions),
      geographicFocus: asList(prefs.geographicFocus),
      selectedProvinces: asList(prefs.selectedProvinces),
      selectedCountries: asList(prefs.selectedCountries),
      instruments,
      minimumTicket: minTicket,
      maximumTicket: maxTicket,
      supportOffered: asList(fund.supportOffered),
      dueDiligenceTimeline: fund.dueDiligenceTimeline || prefs.typicalDealClosingTime,
    },

    fundingInstrument: formatLabel(instruments.join(", ")) || "Various",
    fundingRange: formatTicketSize(minTicket, maxTicket),
    minTicket: normalizeAmount(minTicket),
    maxTicket: normalizeAmount(maxTicket),
    businessStage: formatInvestmentStage(stages),
    deadline: fund.applicationDeadline || brief.applicationDeadline || brief.applicationWindow || null,
    reviewTime: formatWaitingTime(brief.estimatedReviewTime || fund.estimatedReviewTime),

    interestRate: fundProfile?.interestRate || fund.interestRate || "-",
    investmentTerm: fundProfile?.investmentTerm || fund.investmentTerm || fund.term || "-",
    equityExpectation: fundProfile?.equityExpectation || fund.equityExpectation || "-",
    securityRequirements: formatLabel(asList(fundProfile?.securityRequirements || fund.securityRequirements).join(", ")) || "-",
    geographicMandate: formatLocation(geography),
    sectorMandate: formatSectorLabel(sectors.join(", ")) || "Generalist",
    turnoverRequirements: fundProfile?.revenueThreshold || fund.revenueThreshold || "-",
    funderType: formatLabel(overview.firmType || overview.investorRole || "-"),
    useOfFundsRestrictions: formatLabel(asList(fundProfile?.useOfFundsRestrictions || fund.useOfFundsRestrictions).join(", ")) || "-",
    coFundingRequirement: fundProfile?.coFundingRequirement || fund.coFundingRequirement || "-",
    supportOffered: formatSupport(fund.supportOffered),
    documentCount,
    requiredDocuments: asList(brief.coreDocuments),
    website: contact.website || null,

    scoreWeightings: getFunderScoreWeightings(form),

    matchPercentage: 0,
    matchBreakdown: null,
    adjustedBigScore: null,
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════════════════════════ */
export function FundingTable({
  filters,
  stageFilter,
  applicationFilter,
  onInsightsData,
  onPrimaryMatchCount,
  onCountChange,
  onDealComplete,
}) {
  const [funds, setFunds] = useState([])
  const [records, setRecords] = useState({})
  const [applications, setApplications] = useState({})
  const [responsiveness, setResponsiveness] = useState({})
  const [removedFunderIds, setRemovedFunderIds] = useState(new Set())
  const [business, setBusiness] = useState(null)
  const [bigEvaluation, setBigEvaluation] = useState(null)
  const [bigScore, setBigScore] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notification, setNotification] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [isCompanyMember, setIsCompanyMember] = useState(false)
  const [userRole, setUserRole] = useState(null)

  /* A stage pressed in the pipeline arrives here. The `stageFilter` prop still
     wins when the page passes one, so wiring props stays optional — drop
     <DealFlowPipeline /> anywhere on the page and the two find each other. */
  const [eventStageFilter, setEventStageFilter] = useState(null)
  useEffect(() => {
    const onFilter = (e) => setEventStageFilter(e.detail ?? null)
    window.addEventListener(FUNDING_STAGE_FILTER_EVENT, onFilter)
    return () => window.removeEventListener(FUNDING_STAGE_FILTER_EVENT, onFilter)
  }, [])
  const activeStageFilter = stageFilter ?? eventStageFilter

  /* Built from smseFundingMatches, which is the only collection tying a fund
     back to a fundingApplicationsV2 document. Two indexes because the record's
     shape varies by writer: fundKey when it has one, funderId otherwise. */
  const [applicationLinks, setApplicationLinks] = useState({ byFundKey: {}, byFunderId: {} })

  /* Seeded from ?applicationId= so arriving from the Applications page works;
     the event covers the case where this table is already on screen. */
  const [eventApplicationFilter, setEventApplicationFilter] = useState(readApplicationIdFromUrl)
  useEffect(() => {
    const onFilter = (e) => setEventApplicationFilter(e.detail ?? null)
    window.addEventListener(FUNDING_APPLICATION_FILTER_EVENT, onFilter)
    return () => window.removeEventListener(FUNDING_APPLICATION_FILTER_EVENT, onFilter)
  }, [])
  const activeApplicationFilter = applicationFilter ?? eventApplicationFilter

  /* "View All Matches" drops the score band too — it arrived with the
     application, so leaving it behind would make the button look broken.
     setLocalFilters is declared further down; that's fine, this only runs on
     click, long after render has finished. */
  const clearApplicationFilter = () => {
    setEventApplicationFilter(null)
    window.dispatchEvent(new CustomEvent(FUNDING_APPLICATION_FILTER_EVENT, { detail: null }))
    setLocalFilters((prev) => ({ ...prev, matchRange: [0, 100] }))
    // Drop the params too, or a refresh would put the filter straight back.
    if (typeof window !== "undefined" && window.history?.replaceState) {
      const url = new URL(window.location.href)
      url.searchParams.delete("applicationId")
      url.searchParams.delete("matchMin")
      url.searchParams.delete("matchMax")
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
    }
  }

  const [detailsFund, setDetailsFund] = useState(null)
  const [applyingFund, setApplyingFund] = useState(null)
  const [profileData, setProfileData] = useState({})
  const [submittedDocuments, setSubmittedDocuments] = useState([])
  const [selectedDocs, setSelectedDocs] = useState([])
  const [showBigScoreGate, setShowBigScoreGate] = useState(false)
  const [noteTarget, setNoteTarget] = useState(null)
  const [noteText, setNoteText] = useState("")
  const [confirmHide, setConfirmHide] = useState(null)
  const [showRemoved, setShowRemoved] = useState(false)

  const [savedMatches, setSavedMatches] = useState(() => loadSavedMatches())
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [hoveredRow, setHoveredRow] = useState(null)

  useEffect(() => {
    persistSavedMatches(savedMatches)
  }, [savedMatches])

  const savedCount = useMemo(() => Object.values(savedMatches).filter(Boolean).length, [savedMatches])

  /* Popups — anchored popovers portaled to <body>, same pattern as the SME,
     intern and advisor tables. { type, fund, position:{x,y}, rect } */
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
    window.addEventListener(FUNDING_MATCH_RANGE_EVENT, onRange)
    return () => window.removeEventListener(FUNDING_MATCH_RANGE_EVENT, onRange)
  }, [])

  const clearMatchRange = () => {
    setLocalFilters((prev) => ({ ...prev, matchRange: [0, 100] }))
    stripMatchRangeParams()
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

  const functions = useMemo(() => getFunctions(), [])

  const toast = useCallback((type, message, ms = 3000) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), ms)
  }, [])

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
      } catch (err) {
        console.error("Error resolving company membership:", err)
        setEffectiveUserId(user.uid)
        setUserRole("owner")
      } finally {
        setAuthResolved(true)
      }
    })
    return () => unsubscribe()
  }, [])

  const canAct = !isCompanyMember || ["owner", "admin"].includes(userRole)
  const canAdvance = !isCompanyMember || ["owner", "admin", "manager"].includes(userRole)

  /* Parent callbacks live behind a ref so an inline arrow in the parent
     can't retrigger the listeners on every render. */
  const notifyRef = useRef({ onCountChange, onPrimaryMatchCount, onInsightsData, onDealComplete })

  /* ─── Live applications ─────────────────────────────────────────────── */
  const fundedSeenRef = useRef(null)
  useEffect(() => {
    if (!effectiveUserId) return undefined
    const unsubscribe = onSnapshot(
      query(collection(db, SME_APPLICATIONS), where("smeId", "==", effectiveUserId)),
      (snapshot) => {
        const next = {}
        const funded = new Set()
        snapshot.forEach((d) => {
          const data = d.data()
          // Index on both the fund name and the funder name: rows written
          // before the one-row-per-fund fix stored the funder name in fundName.
          const entry = { ...data, docId: d.id }
          if (data.funderId) {
            if (data.fundName) next[fundKeyOf(data.funderId, data.fundName)] = entry
            if (data.funderName) next[fundKeyOf(data.funderId, data.funderName)] = entry
          }
          if (normalizeFunderStatus(data.pipelineStage) === "Funded") funded.add(d.id)
        })
        setApplications(next)

        // First snapshot establishes the baseline; only a genuinely new
        // funded deal should bounce the user to the deals tab.
        const previous = fundedSeenRef.current
        fundedSeenRef.current = funded
        if (previous && [...funded].some((id) => !previous.has(id))) {
          notifyRef.current.onDealComplete?.()
        }
      },
      (err) => console.error("Funding application listener failed:", err),
    )
    return () => unsubscribe()
  }, [effectiveUserId])

  /* ─── Live pre-application match records ────────────────────────────── */
  useEffect(() => {
    if (!effectiveUserId) return undefined
    const unsubscribe = onSnapshot(
      query(collection(db, SME_FUNDER_COLLECTION), where("smeId", "==", effectiveUserId)),
      (snapshot) => {
        const next = {}
        snapshot.forEach((d) => {
          const data = d.data()
          if (!data.fundKey) return
          next[data.fundKey] = {
            status: data.status || null,
            notes: data.notes || [],
            createdAt: data.createdAt || null,
          }
        })
        setRecords(next)
      },
      (err) => console.error("Funder match record listener failed:", err),
    )
    return () => unsubscribe()
  }, [effectiveUserId])

  /* ─── Application join ────────────────────────────────────────────────
     This table lists every fund on the platform, so it has no application in
     scope of its own. smseFundingMatches is what the matching backend writes
     and what the Applications page counts from, and each record carries an
     applicationId — so the two are stitched together here. Funds with no
     record still appear, with a dash. */
  useEffect(() => {
    if (!effectiveUserId) return undefined

    let cancelled = false

    const loadApplicationLinks = async () => {
      try {
        const [matchSnap, appSnap] = await Promise.all([
          getDocs(query(collection(db, "smseFundingMatches"), where("smeId", "==", effectiveUserId))),
          getDocs(query(collection(db, "fundingApplicationsV2"), where("userId", "==", effectiveUserId))),
        ])

        // Application Request is the same label the Applications list shows in
        // its "Application" column.
        const titleByAppId = {}
        appSnap.forEach((d) => {
          const data = d.data()
          const stage = data.applicationOverview?.fundingStage || ""
          titleByAppId[d.id] = `Funding${stage ? ` - ${stage}` : ""}`
        })

        const byFundKey = {}
        const byFunderId = {}
        matchSnap.forEach((d) => {
          const data = d.data()
          const appFullId = data.applicationId
          if (!appFullId) return
          const link = {
            applicationFullId: appFullId,
            applicationId: appFullId.slice(-8).toUpperCase(),
            applicationRequest: titleByAppId[appFullId] || "-",
          }
          // Field names vary by writer, so index every identifier the record
          // actually carries rather than assuming one and linking nothing.
          const funderId = data.funderId || data.investorId || data.funderProfileId
          const fundName = data.fundName || data.fundTitle
          if (data.fundKey) byFundKey[data.fundKey] = link
          if (funderId && fundName) byFundKey[fundKeyOf(funderId, fundName)] = link
          if (funderId && !byFunderId[funderId]) byFunderId[funderId] = link
        })

        if (!cancelled) setApplicationLinks({ byFundKey, byFunderId })
      } catch (error) {
        console.error("Failed to load application links:", error)
      }
    }

    loadApplicationLinks()
    return () => {
      cancelled = true
    }
  }, [effectiveUserId])

  /* ─── Everything else, in one pass ──────────────────────────────────── */
  const load = useCallback(async () => {
    if (!effectiveUserId) return
    setLoading(true)
    setError(null)
    try {
      const [profileSnap, bigSnap, investorsSnap, removedSnap] = await Promise.all([
        getDoc(doc(db, "universalProfiles", effectiveUserId)),
        getDoc(doc(db, "bigEvaluations", effectiveUserId)),
        getDocs(collection(db, "MyuniversalProfiles")),
        getDocs(query(collection(db, REMOVED_FUNDERS), where("userId", "==", effectiveUserId))),
      ])

      if (!profileSnap.exists()) {
        setError("Complete your business profile first and your funding matches will appear here.")
        setFunds([])
        return
      }

      const rawProfile = profileSnap.data()
      setProfileData(rawProfile)
      const smeProfile = normalizeSMEProfile(rawProfile)
      setBusiness({ ...rawProfile, ...rawProfile.entityOverview, normalized: smeProfile })

      const evaluation = bigSnap.exists() ? bigSnap.data() : null
      setBigEvaluation(evaluation)
      setBigScore(evaluation?.scores?.bigScore ?? 0)

      const removed = new Set(removedSnap.docs.map((d) => d.data().funderId))
      setRemovedFunderIds(removed)

      const rows = []
      investorsSnap.forEach((docSnap) => {
        if (removed.has(docSnap.id)) return
        const investor = docSnap.data()

        const sponsorType = investor.sponsorType || investor.entityOverview?.sponsorType || ""
        const onboardedBy = investor.onboardedBy || investor.sponsorName || investor.entityOverview?.sponsorName || ""
        const isCmfOnboarded = sponsorType === "CMF" || !!investor.corporateId || (onboardedBy && onboardedBy.includes("_cmf"))
        
        const smeCmfId = rawProfile.onboardedBy || rawProfile.entityOverview?.sponsorName || ""
        if (isCmfOnboarded && onboardedBy !== smeCmfId) {
          return
        }

        const fundList = investor.formData?.fundDetails?.funds || []
        fundList.forEach((fund, index) => {
          const row = mapFund(investor, docSnap.id, fund, index)
          const result = calculateHybridScore(smeProfile, row.scoringFund)
          const adjusted = calculateAdjustedBigScore(evaluation, row.scoreWeightings)
          rows.push({ ...row, matchPercentage: result.score, matchBreakdown: result.breakdown, adjustedBigScore: adjusted })
        })
      })

      rows.sort((a, b) => b.matchPercentage - a.matchPercentage)
      setFunds(rows)

      // Responsiveness is precomputed per funder by a scheduled job; the client
      // only reads. Missing docs simply render "Not enough data".
      const funderIds = [...new Set(rows.map((r) => r.funderId))]
      const metrics = {}
      await Promise.all(
        funderIds.map(async (id) => {
          try {
            const snap = await getDoc(doc(db, RESPONSIVENESS_COLLECTION, id))
            if (snap.exists()) metrics[id] = snap.data()
          } catch {
            // A missing metric is not an error worth surfacing.
          }
        }),
      )
      setResponsiveness(metrics)
    } catch (err) {
      console.error("Error loading funding matches:", err)
      setError("Could not load funding matches. Refresh to try again.")
    } finally {
      setLoading(false)
    }
  }, [effectiveUserId])

  useEffect(() => {
    if (!authResolved) return
    if (!effectiveUserId) {
      setLoading(false)
      return
    }
    load()
  }, [authResolved, effectiveUserId, load])

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
      className="ft-resize"
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

  /* Status: an application, once it exists, is the source of truth. Before
     that, the match record. */
  const statusOf = useCallback(
    (fund) => {
      const application = applications[fund.id]
      if (application) return normalizeFunderStatus(application.pipelineStage || application.status)
      return normalizeFunderStatus(records[fund.id]?.status)
    },
    [applications, records],
  )

  const funderStageOf = useCallback((fund) => applications[fund.id]?.pipelineStage || "-", [applications])

  /* ─── Writing records ───────────────────────────────────────────────── */
  const writeRecord = useCallback(
    async (fund, patch) => {
      if (!effectiveUserId) return
      await setDoc(
        doc(db, SME_FUNDER_COLLECTION, applicationIdOf(effectiveUserId, fund.funderId, fund.fundName)),
        {
          smeId: effectiveUserId,
          funderId: fund.funderId,
          fundName: fund.fundName,
          funderName: fund.funderName,
          fundKey: fund.id,
          matchPercentage: fund.matchPercentage || 0,
          createdAt: records[fund.id]?.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...patch,
        },
        { merge: true },
      )
    },
    [effectiveUserId, records],
  )

  /* ─── Popups ────────────────────────────────────────────────────────── */
  const openPopup = (type, fund, rect) => {
    let popupWidth
    let popupHeight
    switch (type) {
      case "match":
        popupWidth = 400
        popupHeight = 520
        break
      case "quickActions":
        popupWidth = 224
        popupHeight = 360
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

    setActivePopup({ type, fund, position: { x, y }, rect })
  }

  const openPopupFromEvent = (type, fund, event) => {
    event.stopPropagation()
    openPopup(type, fund, event.currentTarget.getBoundingClientRect())
  }

  const closePopup = () => setActivePopup(null)

  const openDetails = (fund) => {
    setDetailsFund(fund)
    setActivePopup(null)
    if (!applications[fund.id] && !records[fund.id]?.status && canAct) {
      writeRecord(fund, { status: "Viewed" }).catch((err) => console.error("Could not record the view:", err))
    }
  }

  /* ─── Apply ─────────────────────────────────────────────────────────── */
  const openApply = async (fund) => {
    setActivePopup(null)
    if (!canAct) {
      toast("warning", "Only company owners and admins can submit applications.", 4000)
      return
    }
    if (bigScore === null) {
      toast("info", "Checking your BIG Score...")
      return
    }
    if (bigScore < BIG_SCORE_MINIMUM) {
      setShowBigScoreGate(true)
      return
    }
    if (applications[fund.id]) {
      toast("warning", "You've already applied to this fund.", 4000)
      return
    }

    setBusyId(fund.id)
    try {
      const coreDocs = fund.requiredDocuments
      const uploads = profileData.documentUpload || {}
      const normalize = (str) => str?.toLowerCase().replace(/[\s_-]/g, "").trim()

      const submitted = coreDocs.filter((label) =>
        Object.entries(uploads).some(
          ([key, urls]) =>
            normalize(key) === normalize(label) &&
            Array.isArray(urls) &&
            urls.some((url) => typeof url === "string" && url.startsWith("http")),
        ),
      )

      setSubmittedDocuments(submitted)
      setSelectedDocs(submitted)
      setApplyingFund(fund)
      await writeRecord(fund, { status: "Application Started" })
    } catch (err) {
      console.error("Could not open the application:", err)
      toast("error", "Could not load the application requirements.", 4000)
    } finally {
      setBusyId(null)
    }
  }

  const handleUpload = async (docLabel, file) => {
    const user = auth.currentUser
    if (!user || !file) return
    try {
      toast("info", `Uploading ${formatDocumentLabel(docLabel)}...`)
      const storageRef = ref(storage, `documents/${user.uid}/${docLabel}.pdf`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      const path = DOCUMENT_PATHS[docLabel]
      await updateDoc(doc(db, "universalProfiles", effectiveUserId), {
        [path]: [downloadURL],
        [`${path}UpdatedAt`]: serverTimestamp(),
      })

      setProfileData((prev) => ({ ...prev }))
      setSubmittedDocuments((prev) => [...new Set([...prev, docLabel])])
      toast("success", `${formatDocumentLabel(docLabel)} uploaded.`)
    } catch (err) {
      console.error("Upload failed:", err)
      toast("error", "Upload failed. Try again.", 4000)
    }
  }

  const submitApplication = async (fund) => {
    const user = auth.currentUser
    if (!user || !business) return
    if (!canAct) {
      toast("warning", "Only company owners and admins can submit applications.", 4000)
      return
    }

    setBusyId(fund.id)
    try {
      const applicationDate = new Date().toISOString().split("T")[0]
      const smeName = business.registeredName || business.entityOverview?.registeredName || "Unnamed Business"

      const documentURLs = {}
      selectedDocs.forEach((label) => {
        const url = get(profileData, DOCUMENT_PATHS[label])?.[0]
        if (url) documentURLs[label] = url
      })

      const shared = {
        smeId: effectiveUserId,
        submittedBy: user.uid,
        submittedByRole: userRole,
        funderId: fund.funderId,
        funderName: fund.funderName,
        fundName: fund.fundName,
        fundKey: fund.id,
        smeName,
        investmentType: fund.fundingInstrument,
        matchPercentage: fund.matchPercentage,
        adjustedBigScore: fund.adjustedBigScore?.score ?? null,
        bigScore,
        location: business.location || "Not specified",
        stage: business.operationStage || "Not specified",
        sector: asList(business.economicSectors).join(", ") || "Not specified",
        fundingNeeded: business.useOfFunds?.amountRequested || "Not specified",
        entityType: business.useOfFunds?.entityType || "Not specified",
        supportFormat: business.applicationOverview?.supportFormat || "Not specified",
        teamSize: business.teamSize || "Not specified",
        revenue: business.financialOverview?.annualRevenue || "Not specified",
        focusArea: business.businessDescription || "Not specified",
        documents: selectedDocs,
        documentURLs,
        fundTicketSize: fund.fundingRange,
        applicationDate,
        pipelineStage: "Application Sent",
        status: "Pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Both ends of the responsiveness clock. firstRespondedAt is filled by
        // the funder side on its first meaningful reply — never on a decision.
        smeActedAt: serverTimestamp(),
        firstRespondedAt: null,
      }

      const applicationId = applicationIdOf(effectiveUserId, fund.funderId, fund.fundName)

      /* setDoc with a deterministic id, not addDoc. A double click used to
         create two applications because the "already applied" check was a
         query that had not yet seen the first write. */
      await Promise.all([
        setDoc(doc(db, SME_APPLICATIONS, applicationId), {
          ...shared,
          funderSupportOffered: fund.supportOffered,
          funderDecisionCriteria: fund.fullProfile?.applicationBrief?.evaluationCriteria || "Not specified",
        }),
        setDoc(doc(db, INVESTOR_APPLICATIONS, applicationId), {
          ...shared,
          fundType: fund.fundingInstrument,
          fundFocusSectors: fund.sectorMandate,
          fundStagePreferences: fund.businessStage,
        }),
      ])

      await writeRecord(fund, { status: "Applied" })

      const smeEmail = business.contactDetails?.email || user.email
      const funderEmail =
        fund.fullProfile?.contactDetails?.businessEmail || fund.fullProfile?.contactDetails?.email || null

      if (smeEmail) {
        try {
          await httpsCallable(functions, "sendApplicationConfirmation")({
            to: smeEmail,
            name: smeName,
            funderName: fund.funderName,
            applicationDate,
            matchPercentage: fund.matchPercentage || 0,
            applicationId,
            dashboardLink: "https://www.bigmarketplace.africa/my-applications",
          })
        } catch (emailError) {
          console.error("Confirmation email failed:", emailError)
        }
      }

      if (funderEmail) {
        try {
          await httpsCallable(functions, "sendFundingApplicationNotification")({
            funderEmail,
            funderName: fund.funderName,
            smeName,
            matchPercentage: fund.matchPercentage || 0,
            smeLocation: shared.location,
            smeSector: shared.sector,
            fundingStage: shared.stage,
            fundingRequired: shared.fundingNeeded,
            bigScore,
            applicationLink: "https://www.bigmarketplace.africa/funder/applications",
          })
        } catch (emailError) {
          console.error("Funder notification email failed:", emailError)
        }
      }

      try {
        await Promise.all([
          addDoc(collection(db, "messages"), {
            to: fund.funderId,
            toName: fund.funderName,
            from: "system",
            fromName: "BIG Marketplace",
            subject: `New application to ${fund.fundName} from ${smeName}`,
            content:
              `Dear ${fund.funderName},\n\n${smeName} has applied to ${fund.fundName}.\n\n` +
              `Location: ${shared.location}\nSector: ${shared.sector}\nStage: ${shared.stage}\n` +
              `Funding required: ${shared.fundingNeeded}\nMatch: ${fund.matchPercentage}%\n\n` +
              `Log in to review the application.\n\nBIG Marketplace Africa`,
            date: new Date().toISOString(),
            read: false,
            type: "inbox",
            applicationId,
            linkTo: "/funder/applications",
          }),
          addDoc(collection(db, "messages"), {
            to: effectiveUserId,
            toName: smeName,
            from: "system",
            fromName: "BIG Marketplace",
            subject: `Application sent to ${fund.fundName}`,
            content:
              `Dear ${smeName},\n\nYour application to ${fund.fundName} (${fund.funderName}) has been sent.\n\n` +
              `Instrument: ${fund.fundingInstrument}\nMatch: ${fund.matchPercentage}%\n\n` +
              `You'll be notified when they respond.\n\nBIG Marketplace Africa`,
            date: new Date().toISOString(),
            read: false,
            type: "inbox",
            applicationId,
            linkTo: "/my-applications",
          }),
        ])
      } catch (messageError) {
        console.error("Application saved but the in-app messages failed:", messageError)
      }

      window.dispatchEvent(
        new CustomEvent("newNotification", {
          detail: {
            message: `Application to ${fund.fundName} submitted`,
            type: "success",
            timestamp: new Date().toISOString(),
          },
          bubbles: true,
        }),
      )

      toast("success", `Application sent to ${fund.fundName}.`)
      setApplyingFund(null)
      setSelectedDocs([])
    } catch (err) {
      console.error("Application submission error:", err)
      toast("error", "The application didn't send. Try again.", 4000)
    } finally {
      setBusyId(null)
    }
  }

  /* ─── Hide / restore ────────────────────────────────────────────────── */
  const hideFunder = async (fund) => {
    if (!canAct) {
      toast("warning", "Only company owners and admins can hide funders.", 4000)
      return
    }
    try {
      await addDoc(collection(db, REMOVED_FUNDERS), {
        userId: effectiveUserId,
        funderId: fund.funderId,
        fundKey: fund.id,
        removedAt: new Date().toISOString(),
        removedBy: auth.currentUser?.uid,
        removedByRole: userRole,
      })
      // The old handler reloaded the whole page here. Filtering in place is
      // instant and doesn't lose the user's scroll position or filters.
      setRemovedFunderIds((prev) => new Set([...prev, fund.funderId]))
      setFunds((prev) => prev.filter((r) => r.funderId !== fund.funderId))
      toast("info", `${fund.funderName} hidden from your matches.`)
    } catch (err) {
      console.error("Error hiding funder:", err)
      toast("error", "Could not hide that funder.", 4000)
    }
  }

  const restoreFunder = async (funderId) => {
    try {
      const snapshot = await getDocs(
        query(collection(db, REMOVED_FUNDERS), where("userId", "==", effectiveUserId), where("funderId", "==", funderId)),
      )
      const batch = writeBatch(db)
      snapshot.docs.forEach((d) => batch.delete(d.ref))
      await batch.commit()
      setRemovedFunderIds((prev) => {
        const next = new Set(prev)
        next.delete(funderId)
        return next
      })
      await load()
      toast("success", "Funder restored.")
    } catch (err) {
      console.error("Error restoring funder:", err)
      toast("error", "Could not restore that funder.", 4000)
    }
  }

  const saveNote = async () => {
    if (!noteTarget || !noteText.trim()) return
    try {
      await writeRecord(noteTarget, { notes: arrayUnion(noteText.trim()) })
      toast("success", "Note saved.")
    } catch (err) {
      console.error("Failed to save the note:", err)
      toast("error", "Could not save the note.", 4000)
    } finally {
      setNoteTarget(null)
      setNoteText("")
    }
  }

  /* One place that both the row bookmark and the quick-actions entry call, so
     the two can't drift apart. Saving also shortlists the fund, which is what
     moves it along the pipeline. */
  const toggleSaved = useCallback(
    (fund) => {
      const nowSaved = !savedMatches[fund.id]
      setSavedMatches((prev) => ({ ...prev, [fund.id]: nowSaved }))
      toast("success", nowSaved ? `${fund.fundName} saved` : `${fund.fundName} removed from saved`, 2000)
      if (nowSaved && !applications[fund.id]) {
        writeRecord(fund, { status: "Shortlisted" }).catch((err) => console.error("Could not shortlist:", err))
      }
    },
    [savedMatches, applications, writeRecord, toast],
  )

  /* Every row with its application attached. Kept separate from `funds` so a
     late-arriving join re-decorates without refetching the funds themselves. */
  const decoratedFunds = useMemo(
    () =>
      funds.map((r) => {
        const link = applicationLinks.byFundKey[r.id] || applicationLinks.byFunderId[r.funderId] || null
        return {
          ...r,
          applicationRefId: link ? link.applicationId : "-",
          applicationFullId: link ? link.applicationFullId : null,
          applicationRequest: link ? link.applicationRequest : "-",
        }
      }),
    [funds, applicationLinks],
  )

  /* ─── Derived options ───────────────────────────────────────────────────
     Every filter offers the values actually present in the table, so you pick
     from what exists rather than guessing at a search box. */
  const uniqueOf = useCallback(
    (accessor) =>
      [...new Set(decoratedFunds.map(accessor).filter((v) => v && v !== "-" && v !== "Not specified"))].sort(),
    [decoratedFunds],
  )
  const applicationIdOptions = useMemo(() => uniqueOf((r) => r.applicationRefId), [uniqueOf])
  const applicationRequestOptions = useMemo(() => uniqueOf((r) => r.applicationRequest), [uniqueOf])
  const nameOptions = useMemo(() => uniqueOf((r) => r.fundName), [uniqueOf])
  const instrumentOptions = useMemo(() => uniqueOf((r) => r.fundingInstrument), [uniqueOf])
  const fundingRangeOptions = useMemo(() => uniqueOf((r) => r.fundingRange), [uniqueOf])
  const stageOptions = useMemo(() => uniqueOf((r) => r.businessStage), [uniqueOf])
  const geographyOptions = useMemo(() => uniqueOf((r) => r.geographicMandate), [uniqueOf])
  const sectorOptions = useMemo(() => uniqueOf((r) => r.sectorMandate), [uniqueOf])
  const funderTypeOptions = useMemo(() => uniqueOf((r) => r.funderType), [uniqueOf])
  const interestRateOptions = useMemo(() => uniqueOf((r) => r.interestRate), [uniqueOf])
  const investmentTermOptions = useMemo(() => uniqueOf((r) => r.investmentTerm), [uniqueOf])
  const equityOptions = useMemo(() => uniqueOf((r) => r.equityExpectation), [uniqueOf])
  const securityOptions = useMemo(() => uniqueOf((r) => r.securityRequirements), [uniqueOf])
  const turnoverOptions = useMemo(() => uniqueOf((r) => r.turnoverRequirements), [uniqueOf])
  const useOfFundsOptions = useMemo(() => uniqueOf((r) => r.useOfFundsRestrictions), [uniqueOf])
  const coFundingOptions = useMemo(() => uniqueOf((r) => r.coFundingRequirement), [uniqueOf])
  const supportOptions = useMemo(() => uniqueOf((r) => r.supportOffered), [uniqueOf])
  const reviewTimeOptions = useMemo(() => uniqueOf((r) => r.reviewTime), [uniqueOf])
  const funderStageOptions = useMemo(
    () => [...new Set(Object.values(applications).map((a) => a.pipelineStage).filter(Boolean))].sort(),
    [applications],
  )

  /* ─── Filtering + sorting ───────────────────────────────────────────────
     Split in two on purpose. `preStageFunds` applies every filter except the
     pipeline stage; that list is what gets broadcast, so a card reading 8 and
     the table showing 8 are the same 8 rows. Applying the stage filter before
     broadcasting would collapse every other card to zero the moment you
     pressed one. ──────────────────────────────────────────────────────── */
  const preStageFunds = useMemo(() => {
    const f = localFilters
    const matchesAny = (selected, value) =>
      !selected?.length || selected.some((v) => (value || "").toString().toLowerCase().includes(v.toLowerCase()))
    const includesText = (needle, value) =>
      !needle?.trim() || (value || "").toString().toLowerCase().includes(needle.toLowerCase().trim())

    return decoratedFunds.filter((r) => {
      const status = statusOf(r)
      // Arriving from an application's "View Match Table" narrows to that one
      // application; "View All Matches" clears it.
      if (activeApplicationFilter && r.applicationFullId !== activeApplicationFilter) return false
      if (showSavedOnly && !savedMatches[r.id]) return false
      if (filters?.search && !`${r.fundName} ${r.funderName}`.toLowerCase().includes(filters.search.toLowerCase()))
        return false
      if (filters?.showOnly === "matches" && applications[r.id]) return false
      if (filters?.showOnly === "applications" && !applications[r.id]) return false

      if (!matchesAny(f.name, `${r.fundName} ${r.funderName}`)) return false
      if (!matchesAny(f.applicationId, r.applicationRefId)) return false
      if (!matchesAny(f.applicationRequest, r.applicationRequest)) return false
      if (r.matchPercentage < f.matchRange[0] || r.matchPercentage > f.matchRange[1]) return false

      const big = r.adjustedBigScore?.score
      if (big !== null && big !== undefined && (big < f.bigScoreRange[0] || big > f.bigScoreRange[1])) return false

      if (!matchesAny(f.fundingInstrument, r.fundingInstrument)) return false
      if (!matchesAny(f.fundingRange, r.fundingRange)) return false
      if (!matchesAny(f.businessStage, r.businessStage)) return false
      if (f.status.length > 0 && !f.status.includes(status)) return false
      if (f.responsiveness.length > 0 && !f.responsiveness.includes(responsivenessBand(responsiveness[r.funderId])))
        return false
      if (!matchesAny(f.interestRate, r.interestRate)) return false
      if (!matchesAny(f.investmentTerm, r.investmentTerm)) return false
      if (!matchesAny(f.equityExpectation, r.equityExpectation)) return false
      if (!matchesAny(f.securityRequirements, r.securityRequirements)) return false
      if (!matchesAny(f.geographicMandate, r.geographicMandate)) return false
      if (!matchesAny(f.sectorMandate, r.sectorMandate)) return false
      if (!matchesAny(f.turnoverRequirements, r.turnoverRequirements)) return false
      if (!matchesAny(f.funderType, r.funderType)) return false
      if (!matchesAny(f.useOfFundsRestrictions, r.useOfFundsRestrictions)) return false
      if (!matchesAny(f.coFundingRequirement, r.coFundingRequirement)) return false
      if (!matchesAny(f.supportOffered, r.supportOffered)) return false
      if (!matchesAny(f.reviewTime, r.reviewTime)) return false
      if (!matchesAny(f.funderStage, funderStageOf(r))) return false
      if (!includesText(f.notes, (records[r.id]?.notes || []).join(" "))) return false

      const deadlineIso = toISODateOnly(r.deadline)
      if (f.deadlineFrom && (!deadlineIso || deadlineIso < f.deadlineFrom)) return false
      if (f.deadlineTo && (!deadlineIso || deadlineIso > f.deadlineTo)) return false

      const matchedIso = toISODateOnly(applications[r.id]?.applicationDate || records[r.id]?.createdAt)
      if (f.matchedFrom && (!matchedIso || matchedIso < f.matchedFrom)) return false
      if (f.matchedTo && (!matchedIso || matchedIso > f.matchedTo)) return false

      return true
    })
  }, [
    decoratedFunds,
    applications,
    records,
    responsiveness,
    localFilters,
    statusOf,
    funderStageOf,
    filters,
    showSavedOnly,
    savedMatches,
    activeApplicationFilter,
  ])

  /* Every fund the pipeline should count, each with its resolved status. New
     Match has no stored record, so the pipeline cannot work this out on its
     own — it would have to infer it from a total. */
  useEffect(() => {
    if (typeof window === "undefined") return
    const payload = preStageFunds.map((r) => ({ id: r.id, name: r.fundName, status: statusOf(r) }))
    const emit = () => window.dispatchEvent(new CustomEvent(FUNDING_ROWS_EVENT, { detail: payload }))
    emit()
    window.addEventListener(FUNDING_ROWS_REQUEST_EVENT, emit)
    return () => window.removeEventListener(FUNDING_ROWS_REQUEST_EVENT, emit)
  }, [preStageFunds, statusOf])

  const filteredFunds = useMemo(() => {
    const rows = activeStageFilter ? preStageFunds.filter((r) => statusOf(r) === activeStageFilter) : [...preStageFunds]

    if (sortConfig?.key) {
      const accessors = {
        name: (r) => r.fundName,
        applicationId: (r) => r.applicationRefId,
        applicationRequest: (r) => r.applicationRequest,
        match: (r) => r.matchPercentage || 0,
        adjustedBigScore: (r) => r.adjustedBigScore?.score ?? -1,
        fundingInstrument: (r) => r.fundingInstrument,
        fundingRange: (r) => r.minTicket || 0,
        businessStage: (r) => r.businessStage,
        deadline: (r) => toDateSafe(r.deadline)?.getTime() ?? Number.POSITIVE_INFINITY,
        status: (r) => statusOf(r),
        responsiveness: (r) => responsivenessSortValue(responsiveness[r.funderId]),
        interestRate: (r) => r.interestRate,
        investmentTerm: (r) => r.investmentTerm,
        equityExpectation: (r) => r.equityExpectation,
        geographicMandate: (r) => r.geographicMandate,
        sectorMandate: (r) => r.sectorMandate,
        turnoverRequirements: (r) => normalizeAmount(r.turnoverRequirements),
        funderType: (r) => r.funderType,
        coFundingRequirement: (r) => r.coFundingRequirement,
        funderStage: (r) => funderStageOf(r),
        documents: (r) => r.documentCount || 0,
        dateMatched: (r) =>
          toDateSafe(applications[r.id]?.applicationDate || records[r.id]?.createdAt)?.getTime() ?? 0,
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
  }, [
    preStageFunds,
    activeStageFilter,
    sortConfig,
    statusOf,
    funderStageOf,
    applications,
    records,
    responsiveness,
  ])

  useEffect(() => {
    notifyRef.current = { onCountChange, onPrimaryMatchCount, onInsightsData, onDealComplete }
  })
  useEffect(() => {
    notifyRef.current.onCountChange?.(filteredFunds.length)
    notifyRef.current.onPrimaryMatchCount?.(funds.length)
  }, [funds, filteredFunds])

  useEffect(() => {
    if (!notifyRef.current.onInsightsData || funds.length === 0) return
    const instrumentBreakdown = {}
    const stageBreakdown = {}
    const sectorDistribution = {}
    funds.forEach((r) => {
      r.fundingInstrument.split(",").forEach((t) => {
        const key = t.trim()
        if (key) instrumentBreakdown[key] = (instrumentBreakdown[key] || 0) + 1
      })
      r.sectorMandate.split(",").forEach((s) => {
        const key = s.trim()
        if (key) sectorDistribution[key] = (sectorDistribution[key] || 0) + 1
      })
      const stage = r.businessStage.trim()
      if (stage) stageBreakdown[stage] = (stageBreakdown[stage] || 0) + 1
    })

    const appList = Object.values(applications)
    const amounts = appList.map((a) => normalizeAmount(a.fundingNeeded)).filter(Boolean)

    notifyRef.current.onInsightsData({
      fundingUseBreakdown: stageBreakdown,
      fundingTypeBreakdown: instrumentBreakdown,
      sectorDistribution,
      topMatchedSectors: Object.fromEntries(
        Object.entries(sectorDistribution).sort((a, b) => b[1] - a[1]).slice(0, 5),
      ),
      averageFundingAmount: amounts.length ? Math.round(amounts.reduce((s, n) => s + n, 0) / amounts.length) : 0,
      activeFundersCount: new Set(funds.map((r) => r.funderId)).size,
      matchRate: funds.length ? Math.round((filteredFunds.length / funds.length) * 100) : 0,
    })
  }, [funds, filteredFunds, applications])

  /* ─── Filter chrome ─────────────────────────────────────────────────── */
  const f = localFilters
  const activeFilterCount =
    f.name.length +
    f.applicationId.length +
    f.applicationRequest.length +
    (f.matchRange[0] > 0 || f.matchRange[1] < 100 ? 1 : 0) +
    (f.bigScoreRange[0] > 0 || f.bigScoreRange[1] < 100 ? 1 : 0) +
    f.fundingInstrument.length +
    f.fundingRange.length +
    f.businessStage.length +
    (f.deadlineFrom || f.deadlineTo ? 1 : 0) +
    f.status.length +
    f.responsiveness.length +
    f.interestRate.length +
    f.investmentTerm.length +
    f.equityExpectation.length +
    f.securityRequirements.length +
    f.geographicMandate.length +
    f.sectorMandate.length +
    f.turnoverRequirements.length +
    f.funderType.length +
    f.useOfFundsRestrictions.length +
    f.coFundingRequirement.length +
    f.supportOffered.length +
    f.reviewTime.length +
    f.funderStage.length +
    (f.matchedFrom || f.matchedTo ? 1 : 0) +
    (f.notes.trim() ? 1 : 0)

  const matchRangeLabel = describeMatchRange(localFilters.matchRange)

  const clearAllFilters = () => {
    setLocalFilters({ ...EMPTY_FILTERS })
    setSortConfig(null)
    stripMatchRangeParams()
  }

  const getFilterActive = (type) => {
    switch (type) {
      case "match":
        return f.matchRange[0] > 0 || f.matchRange[1] < 100
      case "adjustedBigScore":
        return f.bigScoreRange[0] > 0 || f.bigScoreRange[1] < 100
      case "deadline":
        return !!f.deadlineFrom || !!f.deadlineTo
      case "dateMatched":
        return !!f.matchedFrom || !!f.matchedTo
      default: {
        const v = f[type]
        if (Array.isArray(v)) return v.length > 0
        return typeof v === "string" ? !!v.trim() : false
      }
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

  const appIdWidth = widthOf(APPID_KEY)
  const funderWidth = widthOf(FUNDER_KEY)
  const actionWidth = widthOf(ACTION_KEY)
  // Application ID and Funder are both frozen to the left, in that order, so
  // every other sticky offset starts after the pair.
  const pinnedLeadWidth = appIdWidth + funderWidth

  const stickyOffsets = useMemo(() => {
    const offsets = {}
    // Left-pinned columns stack to the right of the frozen Funder column.
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

  const totalWidth = pinnedLeadWidth + actionWidth + orderedColumns.reduce((sum, key) => sum + widthOf(key), 0)

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
  const scoreColor = (n) => (n > 75 ? "#48BB78" : n > 50 ? "#D69E2E" : "#E53E3E")
  const barColor = (n) => (n > 75 ? "#48BB78" : n > 50 ? "#F6AD55" : "#F56565")

  const renderCell = (key, r, rowBg) => {
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
    const status = statusOf(r)
    const record = records[r.id]
    const application = applications[r.id]

    switch (key) {
      case "applicationRequest":
        return (
          <td key={key} style={style}>
            <TruncatedText text={r.applicationRequest} maxLength={26} />
          </td>
        )

      case "match":
        return (
          <td key={key} style={{ ...style, textAlign: "center" }}>
            <div className="flex flex-col items-center gap-1 w-full">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold" style={{ color: scoreColor(r.matchPercentage) }}>
                  {r.matchPercentage}%
                </span>
                <button
                  onClick={(e) => openPopupFromEvent("match", r, e)}
                  title="Why this match?"
                  aria-label={`Why this match for ${r.fundName}?`}
                  className="text-[#a67c52] hover:text-[#4a352f]"
                >
                  <HelpCircle size={13} />
                </button>
              </div>
              <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(0, Math.min(100, r.matchPercentage))}%`,
                    backgroundColor: barColor(r.matchPercentage),
                  }}
                />
              </div>
            </div>
          </td>
        )

      case "adjustedBigScore": {
        const adjusted = r.adjustedBigScore
        if (!adjusted || adjusted.score === null) {
          return (
            <td key={key} style={{ ...style, textAlign: "center" }}>
              <span className="text-[#a89482] text-xs">No BIG Score</span>
            </td>
          )
        }
        return (
          <td key={key} style={{ ...style, textAlign: "center" }}>
            <span
              className="inline-block px-2.5 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: adjusted.score >= BIG_SCORE_MINIMUM ? "#E8F5E8" : "#FFF3E0",
                color: adjusted.score >= BIG_SCORE_MINIMUM ? "#388E3C" : "#F57C00",
              }}
            >
              {adjusted.score}
            </span>
            {adjusted.adjusted && adjusted.delta !== 0 && (
              <div className="text-[10px] text-[#a89482] mt-0.5">
                {adjusted.delta > 0 ? "+" : ""}
                {adjusted.delta} vs base {adjusted.base}
              </div>
            )}
          </td>
        )
      }

      case "fundingInstrument":
        return (
          <td key={key} style={style}>
            <span className="inline-block px-2 py-0.5 rounded-full bg-[#f5f0e1] text-[#4a352f] text-[10px] font-medium">
              {r.fundingInstrument}
            </span>
          </td>
        )

      case "fundingRange":
        return (
          <td key={key} style={style}>
            <span className="text-xs">{r.fundingRange}</span>
          </td>
        )

      case "deadline":
        return (
          <td key={key} style={style}>
            {formatDateValue(r.deadline) || <span className="text-[#a89482] text-xs">{r.deadline || "Rolling"}</span>}
          </td>
        )

      case "status": {
        const st = getStatusStyle(status)
        return (
          <td key={key} style={style}>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ backgroundColor: st.color, color: st.textColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.textColor }} />
              {status}
            </span>
          </td>
        )
      }

      case "responsiveness":
        return (
          <td key={key} style={style}>
            <ResponsivenessBadge metric={responsiveness[r.funderId]} />
          </td>
        )

      case "funderStage":
        return (
          <td key={key} style={style}>
            {application?.pipelineStage || <span className="text-[#a89482] text-xs">-</span>}
          </td>
        )

      case "documents":
        return (
          <td key={key} style={{ ...style, textAlign: "center" }}>
            {r.documentCount || <span className="text-[#a89482]">-</span>}
          </td>
        )

      case "dateMatched":
        return (
          <td key={key} style={style}>
            {formatDateValue(application?.applicationDate || record?.createdAt) || (
              <span className="text-[#a89482] text-xs">-</span>
            )}
          </td>
        )

      case "notes": {
        const notes = record?.notes || []
        return (
          <td key={key} style={style}>
            {notes.length === 0 ? (
              <span className="text-[#a89482] text-xs">-</span>
            ) : (
              <TruncatedText text={notes[notes.length - 1]} maxLength={30} />
            )}
          </td>
        )
      }

      default:
        return (
          <td key={key} style={style}>
            <TruncatedText text={r[key]} maxLength={26} />
          </td>
        )
    }
  }

  /* ─── Render ────────────────────────────────────────────────────────── */
  if (loading) {
    return <div className="p-10 text-center text-[#7d5a50] text-sm">Loading funding matches...</div>
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm font-semibold text-[#4a352f] m-0">{error}</p>
      </div>
    )
  }

  const eligible = bigScore !== null && bigScore >= BIG_SCORE_MINIMUM

  /* Every chip-list filter is driven by this one array. */
  const FILTER_OPTION_SETS = [
    { type: "name", label: "Fund or funder", options: nameOptions },
    { type: "applicationId", label: "Application ID", options: applicationIdOptions },
    { type: "applicationRequest", label: "Application Request", options: applicationRequestOptions },
    { type: "fundingInstrument", label: "Funding Instrument", options: instrumentOptions },
    { type: "fundingRange", label: "Funding Range", options: fundingRangeOptions },
    { type: "businessStage", label: "Business Stage", options: stageOptions },
    { type: "status", label: "Status", options: FUNDER_STATUSES },
    { type: "responsiveness", label: "Responsiveness", options: RESPONSIVENESS_BANDS },
    { type: "interestRate", label: "Interest Rate", options: interestRateOptions },
    { type: "investmentTerm", label: "Investment Term", options: investmentTermOptions },
    { type: "equityExpectation", label: "Equity Expectation", options: equityOptions },
    { type: "securityRequirements", label: "Security Requirements", options: securityOptions },
    { type: "geographicMandate", label: "Geographic Mandate", options: geographyOptions },
    { type: "sectorMandate", label: "Sector Mandate", options: sectorOptions },
    { type: "turnoverRequirements", label: "Turnover Requirements", options: turnoverOptions },
    { type: "funderType", label: "Funder Type", options: funderTypeOptions },
    { type: "useOfFundsRestrictions", label: "Use-of-Funds Restrictions", options: useOfFundsOptions },
    { type: "coFundingRequirement", label: "Co-Funding Requirement", options: coFundingOptions },
    { type: "supportOffered", label: "Support Offered", options: supportOptions },
    { type: "reviewTime", label: "Estimated Review Time", options: reviewTimeOptions },
    { type: "funderStage", label: "Funder Stage", options: funderStageOptions },
  ]

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
          <h3 className="m-0 font-bold text-base" style={{ color: userRole === "viewer" ? "#f59e0b" : "#0369a1" }}>
            Company funding applications — role: {userRole?.toUpperCase()}
          </h3>
          <p className="m-0 mt-1 text-sm text-[#4a5568]">
            {canAct
              ? "You can apply to funds and move applications through the pipeline."
              : canAdvance
                ? "You can track applications but not submit new ones."
                : "You have read-only access to these funding matches."}
          </p>
        </div>
      )}

      {/* BIG Score gate. The old indicator checked >= 75 while the gate and the
          copy both said 85, so scores of 75–84 were told they were eligible and
          then blocked on click. One constant now drives all three. */}
      <div
        className="rounded-xl mb-5 px-4 py-3 flex items-center justify-between gap-4 flex-wrap"
        style={{
          backgroundColor: eligible ? "#E8F5E8" : "#FFF3E0",
          border: `1px solid ${eligible ? "#388E3C" : "#F57C00"}33`,
        }}
      >
        <div className="text-sm" style={{ color: eligible ? "#388E3C" : "#8a5a1e" }}>
          <strong>BIG Score: {bigScore === null ? "—" : `${bigScore}%`}</strong>
          <span className="ml-2">
            {eligible
              ? "You can apply to any fund below."
              : `Applications open at ${BIG_SCORE_MINIMUM}%. You can still browse and shortlist.`}
          </span>
        </div>
        {!eligible && (
          <button
            onClick={() => setShowBigScoreGate(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#7d5a50] text-white"
          >
            How to raise it
          </button>
        )}
      </div>

      {/* Inline banner, same as the SME, intern and advisor tables */}
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
            <h2 className="text-lg font-bold text-[#4a352f] m-0">Funding Matches</h2>
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
                <span className="font-normal text-[#a89482]">({filteredFunds.length})</span>
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
                <span className="font-normal text-[#a89482]">({filteredFunds.length})</span>
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
                <span className="font-normal text-[#a89482]">({filteredFunds.length})</span>
              </span>
            )}
            {/* Saved matches. The bookmark on each row writes here; this is
                where you get them back. */}
            {(showSavedOnly || savedCount > 0) && (
              <button
                onClick={() => setShowSavedOnly((v) => !v)}
                title={showSavedOnly ? "Show all funds" : "Show only saved funds"}
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
            {removedFunderIds.size > 0 && (
              <button
                onClick={() => setShowRemoved((p) => !p)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#4a352f] bg-white border border-[#c8b6a6] hover:bg-[#f5f0e1]"
              >
                {showRemoved ? "Hide" : "Show"} hidden funders ({removedFunderIds.size})
              </button>
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
                        <span className="text-sm text-[#4a352f] flex-1">Funder Name</span>
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

      {showRemoved && removedFunderIds.size > 0 && (
        <div className="border-x border-[#e6d7c3] bg-[#faf7f2] px-4 py-3">
          <p className="text-xs font-semibold text-[#4a352f] m-0 mb-2">Hidden funders</p>
          <div className="flex flex-wrap gap-2">
            {[...removedFunderIds].map((id) => (
              <button
                key={id}
                onClick={() => restoreFunder(id)}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-[#c8b6a6] text-[#4a352f] hover:bg-[#f5f0e1]"
              >
                Restore {id.slice(0, 8)}…
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-b-2xl border border-[#e6d7c3] shadow-lg overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
          <style>{`
            /* No 'position: relative' here — that is what the shared kit had,
               and it silently overrode the sticky positioning on every <th>,
               so the header scrolled away while the pinned body cells stayed.
               Sticky is itself a positioned ancestor, so the absolutely
               placed grip and resize handle still anchor correctly. */
            .ft-th { color: #faf7f2 !important; vertical-align: top !important; }
            .ft-th-draggable { cursor: grab; }
            .ft-th-draggable:active { cursor: grabbing; }
            .ft-th-row { display: flex; align-items: flex-start; gap: 2px; min-width: 0; }
            /* overflow-wrap: normal stops the browser splitting inside a word,
               which is what turned "Match %" into "MAT CH.." and "Status" into
               "STA TUS" in narrow columns. */
            .ft-th-label {
              flex: 1 1 auto; min-width: 0;
              display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
              overflow: hidden; white-space: normal;
              overflow-wrap: normal; word-break: normal; hyphens: none;
              line-height: 1.2; letter-spacing: 0.02em;
            }
            .ft-th-tools { display: flex; align-items: center; flex-shrink: 0; }
            /* The drag grip leaves the flex flow and only appears on hover,
               buying every header ~14px more room for its label. */
            .ft-th-grip { position: absolute; left: 3px; top: 10px; opacity: 0; transition: opacity .15s; }
            .ft-th:hover .ft-th-grip { opacity: .45; }
            .ft-resize { position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: col-resize; z-index: 5; }
            .ft-resize:hover { background: rgba(255,255,255,0.25); }
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
                  className="ft-th font-semibold uppercase tracking-wider text-xs sticky top-0 left-0 z-30 text-left"
                  style={{
                    backgroundColor: "#4a352f",
                    width: appIdWidth,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                    borderRight: "1px solid #e6d7c3",
                  }}
                >
                  <div className="ft-th-row">
                    <span className="ft-th-label" title="Application ID">
                      Application ID
                    </span>
                    <span className="ft-th-tools">
                      <SortTrigger columnKey="applicationId" />
                      <FilterTrigger type="applicationId" active={localFilters.applicationId.length > 0} />
                      <HeaderInfoTooltip text="The funding application this fund was matched to. Funds surfaced before you created an application show a dash." />
                    </span>
                  </div>
                  <ColumnResizer colKey={APPID_KEY} />
                </th>

                <th
                  className="ft-th font-semibold uppercase tracking-wider text-xs sticky top-0 z-30 text-left"
                  style={{
                    backgroundColor: "#4a352f",
                    left: appIdWidth,
                    width: funderWidth,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                    boxShadow: "2px 0 0 #e6d7c3",
                  }}
                >
                  <div className="ft-th-row">
                    <span className="ft-th-label" title="Funder">
                      Funder
                    </span>
                    <span className="ft-th-tools">
                      <SortTrigger columnKey="name" />
                      <FilterTrigger type="name" active={localFilters.name.length > 0} />
                      <HeaderInfoTooltip text="The fund you'd be applying to. One row per fund, so a manager running several appears more than once. Click the eye for its full profile." />
                    </span>
                  </div>
                  <ColumnResizer colKey={FUNDER_KEY} />
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
                      className={`ft-th ft-th-draggable font-semibold uppercase tracking-wider text-xs sticky top-0 select-none transition-opacity ${
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
                      <GripVertical size={11} className="ft-th-grip" />
                      <div className={`ft-th-row ${col.align === "center" ? "justify-center" : ""}`}>
                        <span className="ft-th-label" title={col.label}>
                          {col.label}
                        </span>
                        <span className="ft-th-tools">
                          {pinned[key] && <Pin size={10} className="opacity-60 mt-0.5" />}
                          {col.sortable && <SortTrigger columnKey={key} />}
                          {col.filterType && (
                            <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} />
                          )}
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
                  className="ft-th text-center font-semibold uppercase tracking-wider text-xs sticky top-0 z-20"
                  style={{
                    backgroundColor: "#4a352f",
                    width: actionWidth,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                  }}
                >
                  <div className="ft-th-row justify-center">
                    <span className="ft-th-label">Action</span>
                    <HeaderInfoTooltip text="Apply to the fund or open what you've already sent, bookmark it to come back to, or open quick actions for notes and hiding." />
                  </div>
                  <ColumnResizer colKey={ACTION_KEY} />
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredFunds.length === 0 ? (
                <tr>
                  <td
                    colSpan={orderedColumns.length + 3}
                    style={{ ...tableCellStyle, textAlign: "center", padding: "3rem 1rem", borderRight: "none" }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-[#f5f0e1] flex items-center justify-center">
                        <Wallet size={26} className="text-[#7d5a50] opacity-50" />
                      </div>
                      <p className="text-sm font-semibold text-[#4a352f] m-0">
                        {funds.length === 0
                          ? "No funding matches yet"
                          : activeApplicationFilter
                            ? matchRangeLabel
                              ? `No funds ${matchRangeLabel.toLowerCase()} on this application`
                              : "No funds matched to this application yet"
                            : showSavedOnly
                              ? "No saved funds"
                              : activeStageFilter
                                ? `No funds at ${activeStageFilter}`
                                : "No funds match these filters"}
                      </p>
                      <p className="text-xs text-[#a89482] m-0">
                        {funds.length === 0
                          ? "Add your sector, stage and amount required to your profile and matches will follow."
                          : activeApplicationFilter
                            ? "Widen the score band, show every fund instead, or run matching on this application."
                            : showSavedOnly
                              ? "Bookmark a row to keep it here."
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
                          Show all funds
                        </button>
                      )}
                      {activeFilterCount > 0 && funds.length > 0 && (
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
                filteredFunds.map((r) => {
                  const status = statusOf(r)
                  const actions = getRowActions(status)
                  const isSaved = !!savedMatches[r.id]
                  const isTerminal = status === "Declined" || status === "Closed"
                  const rowBg = hoveredRow === r.id ? "#fdf8f4" : "#ffffff"
                  const busy = busyId === r.id

                  return (
                    <tr
                      key={r.id}
                      onMouseEnter={() => setHoveredRow(r.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ backgroundColor: rowBg, transition: "background-color .15s" }}
                    >
                      {/* Application ID — pinned left */}
                      <td
                        className="sticky left-0 z-10"
                        style={{ ...tableCellStyle, width: appIdWidth, backgroundColor: rowBg }}
                      >
                        {r.applicationRefId && r.applicationRefId !== "-" ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold tracking-wide text-[#FAF7F2]"
                            style={{ background: "linear-gradient(135deg,#5d4037,#4a332a)", fontFamily: "monospace" }}
                            title={`Full application id: ${r.applicationFullId}`}
                          >
                            <Hash size={10} /> {r.applicationRefId}
                          </span>
                        ) : (
                          <span style={{ color: "#a89482", fontSize: "0.75rem" }}>-</span>
                        )}
                      </td>

                      {/* Funder — pinned left. Fund name only; the managing
                          funder is searchable by name and shown in the match
                          popover. */}
                      <td
                        className="sticky z-10"
                        style={{
                          ...tableCellStyle,
                          left: appIdWidth,
                          width: funderWidth,
                          backgroundColor: rowBg,
                          borderRight: "none",
                          boxShadow: "2px 0 0 #e6d7c3",
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-[#4a352f] break-words text-sm">{r.fundName}</span>
                          <button
                            onClick={() => openDetails(r)}
                            className="text-[#a89482] hover:text-[#7d5a50] flex-shrink-0"
                            aria-label={`View ${r.fundName}`}
                            title="View funding opportunity"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>

                      {orderedColumns.map((key) => renderCell(key, r, rowBg))}

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
                          <button
                            onClick={() => (actions.kind === "apply" ? openApply(r) : openDetails(r))}
                            disabled={busy}
                            title={actions.primary}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 disabled:opacity-60 ${
                              isTerminal ? "bg-[#e6d7c3]/60 text-[#a89482]" : "text-white hover:shadow-md hover:brightness-105"
                            }`}
                            style={{
                              width: `${Math.max(110, actionWidth - 82)}px`,
                              height: "34px",
                              backgroundColor: isTerminal ? undefined : "#7d5a50",
                            }}
                          >
                            {!isTerminal && !busy && <ArrowRight size={13} className="flex-shrink-0" />}
                            <span className="truncate">{busy ? "Working..." : actions.primary}</span>
                          </button>

                          <button
                            onClick={() => toggleSaved(r)}
                            title={isSaved ? "Remove from saved" : "Save match"}
                            aria-label={isSaved ? "Remove from saved" : "Save match"}
                            aria-pressed={isSaved}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-[#f5f0e1] flex-shrink-0"
                            style={{ color: isSaved ? "#a67c52" : "#c8b6a6" }}
                          >
                            <Bookmark size={14} fill={isSaved ? "#a67c52" : "none"} />
                          </button>

                          <button
                            onClick={(e) => openPopupFromEvent("quickActions", r, e)}
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
            {["match", "adjustedBigScore"].includes(headerFilterOpen.type) &&
              (() => {
                const field = headerFilterOpen.type === "match" ? "matchRange" : "bigScoreRange"
                const label = headerFilterOpen.type === "match" ? "Match %" : "Adjusted BIG Score"
                const range = localFilters[field]
                return (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-semibold text-[#4a352f]">
                        {label}: {range[0]} - {range[1]}
                      </label>
                      {(range[0] > 0 || range[1] < 100) && (
                        <button
                          onClick={() => {
                            setLocalFilters((p) => ({ ...p, [field]: [0, 100] }))
                            if (field === "matchRange") stripMatchRangeParams()
                          }}
                          className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* The same bands the Applications page offers, so a range
                        set here and one arrived at from there are the same
                        thing. Match % only — a BIG Score band means something
                        different. */}
                    {field === "matchRange" && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {[
                          { label: "All", value: [0, 100] },
                          { label: "Above 75%", value: [75, 100] },
                          { label: "Above 50%", value: [50, 100] },
                          { label: "Below 50%", value: [0, 49] },
                        ].map((preset) => {
                          const isActive = range[0] === preset.value[0] && range[1] === preset.value[1]
                          return (
                            <button
                              key={preset.label}
                              onClick={() => {
                                setLocalFilters((p) => ({ ...p, matchRange: preset.value }))
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
                    )}

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

            {["deadline", "dateMatched"].includes(headerFilterOpen.type) &&
              (() => {
                const isDeadline = headerFilterOpen.type === "deadline"
                const fromKey = isDeadline ? "deadlineFrom" : "matchedFrom"
                const toKey = isDeadline ? "deadlineTo" : "matchedTo"
                return (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-semibold text-[#4a352f]">
                        {isDeadline ? "Application deadline" : "Date matched"}
                      </label>
                      {(localFilters[fromKey] || localFilters[toKey]) && (
                        <button
                          onClick={() => setLocalFilters((p) => ({ ...p, [fromKey]: "", [toKey]: "" }))}
                          className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={localFilters[fromKey]}
                        onChange={(e) => setLocalFilters((p) => ({ ...p, [fromKey]: e.target.value }))}
                        className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                      />
                      <span className="text-[#7d5a50] text-xs">to</span>
                      <input
                        type="date"
                        value={localFilters[toKey]}
                        onChange={(e) => setLocalFilters((p) => ({ ...p, [toKey]: e.target.value }))}
                        className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                      />
                    </div>
                    {isDeadline && (
                      <p className="text-[11px] text-[#a89482] mt-2 mb-0">
                        Funds with a rolling window have no date and are excluded when this is set.
                      </p>
                    )}
                  </>
                )
              })()}

            {/* Notes stays a text search — chips of whole notes would be
                unusable, since every note is a different sentence. */}
            {headerFilterOpen.type === "notes" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Notes</label>
                  {localFilters.notes && (
                    <button
                      onClick={() => setLocalFilters((p) => ({ ...p, notes: "" }))}
                      className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  autoFocus
                  type="text"
                  value={localFilters.notes}
                  onChange={(e) => setLocalFilters((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Search your notes..."
                  className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
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
              onClick={() => openDetails(activePopup.fund)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Eye size={12} /> View Funding
            </button>
            <button
              onClick={() => openPopup("match", activePopup.fund, activePopup.rect)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Target size={12} /> Why This Match?
            </button>
            <button
              onClick={() => {
                const target = activePopup.fund
                closePopup()
                toggleSaved(target)
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Bookmark size={12} fill={savedMatches[activePopup.fund.id] ? "#a67c52" : "none"} />
              {savedMatches[activePopup.fund.id] ? "Remove from Saved" : "Save Match"}
            </button>
            <button
              onClick={() => {
                closePopup()
                setShowSavedOnly(true)
                toast(
                  "info",
                  savedCount > 0
                    ? `Showing your ${savedCount} saved fund${savedCount === 1 ? "" : "s"}.`
                    : "You haven't saved any funds yet — use the bookmark on a row.",
                  3000,
                )
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <LayoutGrid size={12} /> View Saved Funds ({savedCount})
            </button>
            <div className="border-t border-[#e6d7c3] my-1" />
            <button
              onClick={() => openPopup("match", activePopup.fund, activePopup.rect)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <CheckCircle size={12} /> Check Eligibility
            </button>
            <button
              onClick={() => {
                const target = activePopup.fund
                closePopup()
                setNoteTarget(target)
                setNoteText("")
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <StickyNote size={12} /> Add Note
            </button>
            <button
              onClick={() => {
                const target = activePopup.fund
                closePopup()
                setConfirmHide(target)
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#D32F2F] hover:bg-[#faf7f2] text-left"
            >
              <EyeOff size={12} /> Hide Match
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
              width: "400px",
              maxHeight: "520px",
              overflowY: "auto",
            }}
          >
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Why this match?</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[220px]">{activePopup.fund.fundName}</h3>
                  <p className="text-[11px] text-[#e6d7c3] m-0 truncate max-w-[220px]">{activePopup.fund.funderName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold">{activePopup.fund.matchPercentage}%</div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {activePopup.fund.adjustedBigScore?.adjusted && (
                <div className="p-3 rounded-lg border border-[#e6d7c3] bg-[#f5f0e1] text-[11px] text-[#4a352f]">
                  This funder applies its own BIG Score weighting: {activePopup.fund.adjustedBigScore.score} against a
                  platform base of {activePopup.fund.adjustedBigScore.base}.
                </div>
              )}

              {activePopup.fund.matchBreakdown &&
                Object.entries(activePopup.fund.matchBreakdown).map(([key, c]) => {
                  const value = Math.round(c.score)
                  const color = value >= 75 ? "#22c55e" : value >= 50 ? "#f59e0b" : "#ef4444"
                  return (
                    <div key={key} className="p-3 rounded-lg border border-[#e6d7c3] bg-[#faf7f2] text-xs">
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <span className="font-semibold text-[#4a352f]">{CATEGORY_LABEL[key] || formatLabel(key)}</span>
                        <span className="font-bold flex-shrink-0" style={{ color }}>
                          {value}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
                      </div>
                      <p className="text-[10px] text-[#a89482] m-0 mb-1">Weight {Math.round(c.weight * 100)}%</p>

                      {key === "sector" && (
                        <div className="text-[11px] text-[#7d5a50]">
                          {c.hasExclusion ? (
                            <span className="text-[#D32F2F] font-semibold">
                              Your sector is on this fund's exclusion list.
                            </span>
                          ) : (
                            <>
                              <div>Matched: {c.matched.length ? formatSectorLabel(c.matched.join(", ")) : "none"}</div>
                              <div className="text-[#a89482]">
                                Fund mandate: {formatSectorLabel(c.investorSectors.join(", ")) || "Generalist"}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {key === "stage" && (
                        <div className="text-[11px] text-[#7d5a50]">
                          <div>Your stage: {formatInvestmentStage(c.smeStage)}</div>
                          <div className="text-[#a89482]">Fund stages: {formatInvestmentStage(c.investorStages)}</div>
                        </div>
                      )}
                      {key === "ticket" && (
                        <div className="text-[11px] text-[#7d5a50]">
                          <div>You asked for R{(c.smeAmount || 0).toLocaleString("en-ZA")}</div>
                          <div className="text-[#a89482]">Fund writes {formatTicketSize(c.minTicket, c.maxTicket)}</div>
                        </div>
                      )}
                      {key === "type" && (
                        <div className="text-[11px] text-[#7d5a50]">
                          <div>You want: {formatLabel(c.smeInstruments.join(", ")) || "not specified"}</div>
                          <div className="text-[#a89482]">
                            Fund offers: {formatLabel(c.investorInstruments.join(", ")) || "not specified"}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

              <div className="p-3 rounded-lg border border-[#e6d7c3] bg-[#faf7f2]">
                <h4 className="text-xs font-semibold text-[#4a352f] m-0 mb-2 flex items-center gap-1.5">
                  <Timer size={13} /> How quickly this funder replies
                </h4>
                <ResponsivenessBadge metric={responsiveness[activePopup.fund.funderId]} size="md" />
                <p className="text-[10px] text-[#a89482] m-0 mt-2">
                  Median business days from an enquiry to the funder's first reply, across every SME who approached
                  them. It measures the first reply, not the final decision.
                </p>
              </div>
            </div>
          </div>
        </PopupPortal>
      )}

      {/* Apply */}
      {mounted &&
        applyingFund &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white rounded-2xl max-w-[620px] w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Apply</p>
                    <h3 className="text-sm font-bold mt-0.5 truncate">{applyingFund.fundName}</h3>
                    <p className="text-[11px] text-[#e6d7c3] m-0 truncate">{applyingFund.funderName}</p>
                  </div>
                  <button onClick={() => setApplyingFund(null)} className="text-white/70 hover:text-white p-1 flex-shrink-0">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <h4 className="text-sm font-semibold text-[#4a352f] m-0">Required documents</h4>
                <p className="text-xs text-[#a89482] mt-1 mb-4">
                  Tick each document to include it. Anything missing can be uploaded here.
                </p>

                {applyingFund.requiredDocuments.length === 0 ? (
                  <p className="text-xs text-[#7d5a50]">This fund hasn't listed any required documents.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {applyingFund.requiredDocuments.map((label) => {
                      const submitted = submittedDocuments.includes(label)
                      const path = DOCUMENT_PATHS[label]
                      const url = path ? get(profileData, path)?.[0] : null
                      const updatedAt = path ? get(profileData, `${path}UpdatedAt`) : null
                      const when = updatedAt?.seconds ? new Date(updatedAt.seconds * 1000).toLocaleDateString("en-ZA") : null

                      return (
                        <div
                          key={label}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-[#e6d7c3] bg-[#faf7f2]"
                        >
                          <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedDocs.includes(label)}
                              disabled={!submitted}
                              onChange={() =>
                                setSelectedDocs((prev) =>
                                  prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label],
                                )
                              }
                              className="rounded border-[#c8b6a6]"
                            />
                            <span className="text-sm text-[#4a352f] truncate">{formatDocumentLabel(label)}</span>
                            {when && <span className="text-[10px] text-[#a89482] flex-shrink-0">Uploaded {when}</span>}
                          </label>

                          {submitted && url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs font-semibold text-[#a67c52] flex-shrink-0"
                            >
                              <Eye size={13} /> View
                            </a>
                          ) : (
                            <>
                              <input
                                type="file"
                                id={`upload-${label}`}
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => handleUpload(label, e.target.files[0])}
                                className="hidden"
                              />
                              <label
                                htmlFor={`upload-${label}`}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-[#c8b6a6] text-[#4a352f] cursor-pointer flex-shrink-0"
                              >
                                Upload
                              </label>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 p-6 border-t border-[#e6d7c3]">
                <button onClick={() => setApplyingFund(null)} className="px-3 py-2 text-sm font-semibold text-[#7d5a50]">
                  Cancel
                </button>
                <button
                  onClick={() => submitApplication(applyingFund)}
                  disabled={busyId === applyingFund.id || (applyingFund.requiredDocuments.length > 0 && selectedDocs.length === 0)}
                  className="px-4 py-2 rounded-lg bg-[#7d5a50] text-white text-sm font-semibold disabled:opacity-40"
                >
                  {busyId === applyingFund.id ? "Sending..." : "Submit application"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* BIG Score gate */}
      {mounted &&
        showBigScoreGate &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1100] p-4"
            onClick={() => setShowBigScoreGate(false)}
          >
            <div className="bg-white rounded-2xl max-w-[480px] w-full p-8 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-[#FFF3E0]">
                <AlertTriangle size={26} className="text-[#F57C00]" />
              </div>
              <h3 className="text-lg font-bold text-[#4a352f] m-0">Applications open at {BIG_SCORE_MINIMUM}%</h3>
              <p className="text-sm text-[#7d5a50] mt-2 mb-5">
                Your BIG Score is {bigScore}%. Funders use it as a first filter, so strengthening it first gives your
                application a far better hearing. An advisor or a support programme is the fastest route.
              </p>

              <div className="h-2.5 rounded-full bg-[#e6d7c3] relative mb-6">
                <div className="h-full rounded-full bg-[#a67c52]" style={{ width: `${Math.min(100, bigScore || 0)}%` }} />
                <div
                  className="absolute -top-1 w-0.5 bg-[#4a352f]"
                  style={{ left: `${BIG_SCORE_MINIMUM}%`, height: "18px" }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowBigScoreGate(false)}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold bg-[#f5f0e1] text-[#4a352f]"
                >
                  Close
                </button>
                <a
                  href="/find-advisors"
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold bg-[#a67c52] text-white no-underline"
                >
                  Find an advisor
                </a>
                <a
                  href="/support-program-matches"
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold bg-[#4a352f] text-white no-underline"
                >
                  Find a programme
                </a>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Add note */}
      {mounted &&
        noteTarget &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4" onClick={() => setNoteTarget(null)}>
            <div className="bg-white rounded-2xl max-w-[420px] w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-semibold text-[#4a352f] m-0 mb-3">Add a note on {noteTarget.fundName}</h3>
              <textarea
                autoFocus
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="What should your team know about this fund?"
                className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm resize-none"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setNoteTarget(null)} className="px-3 py-1.5 text-xs font-semibold text-[#7d5a50]">
                  Cancel
                </button>
                <button
                  onClick={saveNote}
                  disabled={!noteText.trim()}
                  className="px-3 py-1.5 rounded-lg bg-[#7d5a50] text-white text-xs font-semibold disabled:opacity-40"
                >
                  Save note
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Confirm hide */}
      {mounted &&
        confirmHide &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1100] p-4" onClick={() => setConfirmHide(null)}>
            <div className="bg-white rounded-2xl max-w-[420px] w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-semibold text-[#4a352f] m-0 mb-2">Hide {confirmHide.funderName}?</h3>
              <p className="text-sm text-[#7d5a50] m-0 mb-5">
                Every fund from this funder disappears from your matches. You can restore them from the toolbar at any
                time.
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmHide(null)} className="px-3 py-1.5 text-xs font-semibold text-[#7d5a50]">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    hideFunder(confirmHide)
                    setConfirmHide(null)
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#D32F2F] text-white text-xs font-semibold"
                >
                  Hide funder
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {mounted && detailsFund && (
        <FunderDetailsModal
          funder={{ ...detailsFund, name: detailsFund.fundName }}
          isOpen
          onClose={() => setDetailsFund(null)}
        />
      )}
    </div>
  )
}

export default FundingTable