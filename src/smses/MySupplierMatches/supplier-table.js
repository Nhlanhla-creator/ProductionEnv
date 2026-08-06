"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import {
  Eye,
  EyeOff,
  X,
  HelpCircle,
  BadgeCheck,
  Brain,
  AlertCircle,
  Target,
  Layers,
  Share2,
  StickyNote,
  Flag,
  Send,
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
  Package,
  Info,
  Hash,
} from "lucide-react"
import {
  collection,
  getDocs,
  doc,
  setDoc,
  addDoc,
  getDoc,
  serverTimestamp,
  arrayUnion,
  query,
  where,
  onSnapshot,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../../firebaseConfig"
import emailjs from "@emailjs/browser"
import { API_KEYS } from "../../API"
import SupplierDetailsModal from "./SupplierDetailsModal"
import { deriveAppId } from "../hooks/useMatches"
import {
  calculateEnhancedMatchScore,
  calculateOwnershipPercentages,
  getEffectiveMatchScore,
  getFirstCategory,
  countCategories,
  getSupplierAiEligibility,
  runAiAnalysisForApplication,
} from "./supplierMatching"

/* ════════════════════════════════════════════════════════════════════════════
   This file no longer imports ./matchTableKit.

   The kit rendered the header row, and its own <style> block set
   `position: relative` on every <th>, which overrode the sticky positioning.
   The header scrolled away while the pinned body cells stayed frozen —
   supplier names sliding over the next column, and the ACTION label drifting
   away from its buttons. The table now owns its head, toolbar, filters and
   row actions, identical to the intern, advisor, funding, customer and
   catalyst tables.
   ════════════════════════════════════════════════════════════════════════ */

/* ────────────────────────────────────────────────────────────────────────────
   Scoring lives in supplierMatching.js. These are re-exported by name so that
   existing call sites — useMatches.js, ProductApplication.js and anything else
   importing scoring helpers from "./supplier-table" — keep working.

   Written out one by one rather than as `export * from "./supplierMatching"`:
   webpack could not statically resolve the star form through this file, so
   every re-exported name came back as "not found" at build time.

   New code should import from "./supplierMatching" directly.
   ──────────────────────────────────────────────────────────────────────── */
export {
  AI_SUPPLIER_ANALYSIS_LIMIT,
  ENHANCED_MATCHING_CRITERIA,
  PREFERENCE_WEIGHTS,
  getFirstCategory,
  countCategories,
  extractSupplierDescriptiveText,
  calculateOwnershipPercentages,
  calculateCategoryMatch,
  calculateLocationMatch,
  calculateDeliveryMatch,
  parseBudgetValue,
  calculateBudgetMatch,
  calculateBBBEEEMatch,
  calculateOwnershipMatch,
  calculateRatingMatch,
  calculateExperienceMatch,
  calculateUrgencyMatch,
  calculateEnhancedMatchScore,
  calculatePreferenceScore,
  calculateCombinedMatchScore,
  getEffectiveMatchScore,
  hasSupplierCategoryData,
  getSupplierAiEligibility,
  withSupplierAiEligibility,
  selectSuppliersForAiAnalysis,
  analyzeSupplierMatchesWithFallback,
  runAiAnalysisForApplication,
} from "./supplierMatching"

/* ════════════════════════════════════════════════════════════════════════════
   Collections.

   The old flow called addDoc on "supplierApplications" with a random id and
   wrote supplierId = the SME and customerId = the supplier — the two were
   swapped, which is why the supplier-side dashboard showed the buyer as the
   vendor. There is now one document per side, keyed deterministically, so a
   second Request Quote updates the same record instead of creating a duplicate.
   ════════════════════════════════════════════════════════════════════════ */
export const SME_SUPPLIER_COLLECTION = "SmeSupplierApplications"
export const SUPPLIER_SME_COLLECTION = "supplierApplications"
export const smeSupplierId = (smeId, supplierId) => `${smeId}_${supplierId}`
export const supplierSmeId = (supplierId, smeId) => `${supplierId}_${smeId}`

/* ════════════════════════════════════════════════════════════════════════════
   Events the pipeline uses to talk to this table.
   ════════════════════════════════════════════════════════════════════════ */
export const SUPPLIER_STAGE_FILTER_EVENT = "supplier-pipeline-stage-filter"
export const SUPPLIER_ROWS_EVENT = "supplier-pipeline-rows"
export const SUPPLIER_ROWS_REQUEST_EVENT = "supplier-pipeline-rows-request"

/* Applications page → table. Detail is a productApplications id to scope to,
   or null to fall back to the user's default request. */
export const SUPPLIER_APPLICATION_FILTER_EVENT = "supplier-application-filter"

/* Applications page → table. Detail is a [min, max] score band, from the band
   picker on the row the user opened. */
export const SUPPLIER_MATCH_RANGE_EVENT = "supplier-match-range-filter"

/* The Applications page links here as
   /supplier-matches?applicationId=<id>&matchMin=<n>&matchMax=<n>, so both the
   request in scope and the score band survive the route change — an event
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

/* ─── Status vocabulary ───────────────────────────────────────────────────── */
export const SUPPLIER_STATUSES = [
  "New Match",
  "Viewed",
  "Shortlisted",
  "Contacted",
  "Quote Requested",
  "Quote Received",
  "Under Review",
  "Accepted",
  "Declined",
  "Closed",
]

/* The old table stored match *quality* in `status` ("Perfect Match", "Strong
   Match"…) while workflow state lived in `currentStage`, so the Status column
   never moved as the deal progressed. Status is now workflow only, and the old
   values map onto it here. */
const LEGACY_STATUS_ALIASES = {
  "New Lead": "New Match",
  "Perfect Match": "New Match",
  "Strong Match": "New Match",
  "Potential Match": "New Match",
  "Low Match": "New Match",
  "Potential Supplier": "New Match",
  Shortlist: "Shortlisted",
  Pending: "Contacted",
  "Contact Initiated": "Contacted",
  "Proposal Sent": "Quote Received",
  "Proposal Submitted": "Quote Received",
  "Proposal/Quote": "Quote Received",
  Negotiation: "Under Review",
  "Contract Sent": "Under Review",
  "Contract Signed": "Accepted",
  "Active Contract": "Accepted",
  Completed: "Accepted",
  "Completed Successfully": "Accepted",
  Rejected: "Declined",
}
export const normalizeSupplierStatus = (s) => LEGACY_STATUS_ALIASES[s] || s || "New Match"

const STATUS_TYPES = {
  "New Match": { color: "#F5F0E1", textColor: "#7D5A50" },
  Viewed: { color: "#EFEBE9", textColor: "#5D4037" },
  Shortlisted: { color: "#FFF3E0", textColor: "#F57C00" },
  Contacted: { color: "#E8EAF6", textColor: "#3949AB" },
  "Quote Requested": { color: "#EDE7F6", textColor: "#5E35B1" },
  "Quote Received": { color: "#F3E5F5", textColor: "#7B1FA2" },
  "Under Review": { color: "#E3F2FD", textColor: "#1565C0" },
  Accepted: { color: "#E8F5E8", textColor: "#388E3C" },
  Declined: { color: "#FFEBEE", textColor: "#D32F2F" },
  Closed: { color: "#EEEEEE", textColor: "#616161" },
}
const getStatusStyle = (status) => STATUS_TYPES[status] || { color: "#F5F5F5", textColor: "#666666" }

/* One primary action that follows the workflow; everything else lives in the
   three-dot quick actions popup, matching the other match tables. */
const getRowActions = (status) => {
  switch (status) {
    case "New Match":
    case "Viewed":
    case "Shortlisted":
      return { primary: "Request Quote", kind: "quote" }
    case "Contacted":
    case "Quote Requested":
    case "Under Review":
      return { primary: "View Status", kind: "view" }
    case "Quote Received":
      return { primary: "Review Quote", kind: "view" }
    case "Accepted":
      return { primary: "View Next Steps", kind: "view" }
    case "Declined":
    case "Closed":
      return { primary: "View Outcome", kind: "view", terminal: true }
    default:
      return { primary: "View Supplier", kind: "view" }
  }
}

/* ─── Reference data ────────────────────────────────────────────────────── */
const BBBEE_LEVELS = [
  "Level 1",
  "Level 2",
  "Level 3",
  "Level 4",
  "Level 5",
  "Level 6",
  "Level 7",
  "Level 8",
  "Non-Compliant",
]

const DELIVERY_MODES = ["On-site", "Remote", "Hybrid", "Delivery", "Collection"]

const OWNERSHIP_TAGS = ["Black-owned", "Women-owned", "Youth-owned", "Disability-owned"]

/* ─── Shared helpers (previously imported from the kit) ──────────────────── */

/* Lives here, not in supplierMatching.js — that module never exported it. The
   old file pulled it from matchTableKit; this is the same implementation the
   other match tables use. Exported so anything importing it from
   "./supplier-table" keeps working. */
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
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value?.toDate === "function") return value.toDate()
  if (value?.seconds != null) return new Date(value.seconds * 1000)
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const formatDateValue = (value) => {
  const d = toDateSafe(value)
  if (!d) return null
  return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
}

export const toISODateOnly = (value) => {
  const d = toDateSafe(value)
  if (!d) return ""
  return d.toISOString().slice(0, 10)
}

/* The same label the Applications list puts in its "Application" column, so a
   request reads identically in both places. */
const describeApplication = (application) => {
  if (!application) return "-"
  const ro = application.requestOverview || {}
  const purpose = ro.purpose || application.purpose || ""
  const categories = ro.categories || application.categories || []
  const primaryCategory = categories[0] || ""
  if (purpose?.trim()) return purpose.trim().split(/\s+/).slice(0, 5).join(" ")
  if (primaryCategory) return `${primaryCategory} Request`
  return "Product Request"
}

/* ════════════════════════════════════════════════════════════════════════════
   Section B column configuration.

   Application ID and Supplier are the pinned first columns and Action the
   last, so none of them appear here — but all three resize like everything
   else, via the reserved width keys further down.
   ════════════════════════════════════════════════════════════════════════ */
const COLUMN_DEFS = {
  applicationRequest: { label: "Application Request", width: 190, filterType: "applicationRequest", visible: true, priority: 2, sortable: true, tooltip: "The product or service request every supplier below is being scored against. Open a different request from My Applications to change it." },
  match: { label: "Match %", align: "center", width: 136, filterType: "match", visible: true, priority: 1, sortable: true, tooltip: "How well this supplier fits your request. Once AI analysis has run it is 60% AI reading of their descriptions plus 40% structured profile fields; before that, structured only. Click the ? for the breakdown." },
  productService: { label: "Product / Service Offered", width: 204, filterType: "productService", visible: true, priority: 2, sortable: true, tooltip: "The supplier's primary category, with a count of any others they list." },
  location: { label: "Location / Service Area", width: 178, filterType: "location", visible: true, priority: 3, sortable: true, tooltip: "Where the supplier is based, and the areas they deliver or travel to." },
  capacity: { label: "Capacity / Lead Time", width: 170, filterType: "capacity", visible: true, priority: 3, sortable: true, tooltip: "How much they can take on and how long they need before delivery." },
  status: { label: "Status", width: 148, filterType: "status", visible: true, priority: 1, sortable: true, tooltip: "Where this supplier sits in your pipeline, from New Match through to Accepted, Declined or Closed." },

  businessSize: { label: "Business Size", width: 148, filterType: "businessSize", visible: false, priority: 4, sortable: true, tooltip: "Micro, small, medium or large, as the supplier declared it." },
  yearsOperating: { label: "Years Operating", width: 146, filterType: "yearsOperating", visible: false, priority: 4, sortable: true, tooltip: "How long the business has been trading." },
  bbbeeLevel: { label: "B-BBEE Level", width: 142, filterType: "bbbeeLevel", visible: false, priority: 4, sortable: true, tooltip: "The supplier's B-BBEE contributor level, which drives your own procurement recognition." },
  ownershipProfile: { label: "Ownership Profile", width: 182, filterType: "ownershipProfile", visible: false, priority: 4, sortable: false, tooltip: "Black, women, youth and disability ownership, shown only where it passes the recognition threshold." },
  certifications: { label: "Certifications", width: 170, filterType: "certifications", visible: false, priority: 4, sortable: false, tooltip: "Industry accreditations and standards the supplier holds." },
  pricingRange: { label: "Pricing Range", width: 152, filterType: "pricingRange", visible: false, priority: 4, sortable: true, tooltip: "The supplier's typical price band, where they have published one." },
  minimumOrder: { label: "Minimum Order", width: 152, filterType: "minimumOrder", visible: false, priority: 4, sortable: true, tooltip: "The smallest order the supplier will accept." },
  deliveryCapability: { label: "Delivery Capability", width: 166, filterType: "deliveryCapability", visible: false, priority: 4, sortable: false, tooltip: "How they fulfil — on-site, remote, hybrid, delivery or collection." },
  complianceStatus: { label: "Compliance Status", width: 164, filterType: "complianceStatus", visible: false, priority: 4, sortable: true, tooltip: "Whether the supplier has both tax clearance and CIPC registration on file. Partially compliant means one of the two." },
  sector: { label: "Sector", width: 158, filterType: "sector", visible: false, priority: 4, sortable: true, tooltip: "The industry the supplier trades in." },
  primaryMatch: { label: "Structured Match %", align: "center", width: 156, filterType: "primaryMatch", visible: false, priority: 4, sortable: true, tooltip: "Score from the profile fields alone — category, location, budget, B-BBEE, ownership, rating, experience and lead time." },
  aiMatch: { label: "AI Match %", align: "center", width: 140, filterType: "aiMatch", visible: false, priority: 4, sortable: true, tooltip: "Score from the AI reading the supplier's written descriptions against your request. Shows Not run until you press Run AI analysis." },
  documents: { label: "Documents", align: "center", width: 132, filterType: null, visible: false, priority: 4, sortable: true, tooltip: "How many documents the supplier has uploaded to their profile." },
  dateMatched: { label: "Date Matched", width: 148, filterType: "dateMatched", visible: false, priority: 4, sortable: true, tooltip: "When this supplier first entered your pipeline. Blank until you view or contact them." },
  notes: { label: "Notes", width: 198, filterType: "notes", visible: false, priority: 4, sortable: false, tooltip: "Your own private notes on this supplier. The supplier cannot see them." },
}

const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS)
const DEFAULT_COLUMN_VISIBILITY = Object.fromEntries(
  DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].visible !== false]),
)
const DEFAULT_COLUMN_WIDTHS = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].width]))
const DEFAULT_PINNED = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, null]))
const DEFAULT_DENSITY = "comfortable"

/* Application ID, Supplier and Action can't be hidden or reordered, so they
   aren't in COLUMN_DEFS — but they resize like everything else, and their
   widths live under these reserved keys inside the same columnWidths map. */
const APPID_KEY = "__appId__"
const SUPPLIER_KEY = "__supplier__"
const ACTION_KEY = "__action__"
const FIXED_WIDTHS = { [APPID_KEY]: 132, [SUPPLIER_KEY]: 214, [ACTION_KEY]: 214 }
const MIN_COLUMN_WIDTH = 84

/* Every filter is a list of selected values, so the header popovers can offer
   what is actually in the table rather than a blank search box. Notes stays a
   text search — chips of whole notes would be unusable. */
const EMPTY_FILTERS = {
  name: [],
  applicationId: [],
  applicationRequest: [],
  matchRange: [0, 100],
  productService: [],
  location: [],
  capacity: [],
  status: [],
  businessSize: [],
  yearsOperating: [],
  bbbeeLevel: [],
  ownershipProfile: [],
  certifications: [],
  pricingRange: [],
  minimumOrder: [],
  deliveryCapability: [],
  complianceStatus: [],
  sector: [],
  primaryRange: [0, 100],
  aiRange: [0, 100],
  matchedFrom: "",
  matchedTo: "",
  notes: "",
}

/* ─── Saved views + filter persistence ──────────────────────────────────── */
const BUILTIN_VIEW_ID = "__default__"
// v3: the fixed columns now store their widths in this map too, so a v2 view
// would leave them undefined.
const VIEWS_STORAGE_KEY = "supplier-matches-views-v3"
// v2: every text filter became a multi-select array.
const FILTERS_STORAGE_KEY = "supplier-matches-filters-v2"
const SAVED_STORAGE_KEY = "supplier-matches-saved-v1"

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
    /* The three score ranges hold numbers, not selected values, so the
       coercion above can leave any of them as a one-element array of a
       string. Put them back to numeric pairs — every filter comparison
       depends on it. */
    const fixRange = (range) =>
      Array.isArray(range) && range.length === 2 && range.every((n) => Number.isFinite(Number(n)))
        ? [Number(range[0]), Number(range[1])]
        : [0, 100]
    merged.matchRange = fixRange(merged.matchRange)
    merged.primaryRange = fixRange(merged.primaryRange)
    merged.aiRange = fixRange(merged.aiRange)
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
  categoryMatch: "Category Alignment",
  bbbeeMatch: "B-BBEE Level",
  locationMatch: "Location",
  deliveryMatch: "Delivery Mode",
  budgetMatch: "Budget Fit",
  ownershipMatch: "Ownership Profile",
  ratingMatch: "Supplier Rating",
  experienceMatch: "Sector Experience",
  urgencyLeadTimeMatch: "Urgency & Lead Time",
}

/* ─── Row mapping ───────────────────────────────────────────────────────── */

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : [])

const mapSupplier = (data, id) => {
  const entity = data.entityOverview || {}
  const ps = data.productsServices || {}
  const legal = data.legalCompliance || {}
  const finance = data.financialOverview || {}
  const documents = data.documents || {}

  const own = calculateOwnershipPercentages(data.ownershipManagement || {})
  const ownershipTags = []
  if (own.blackOwnership >= 51) ownershipTags.push(`${Math.round(own.blackOwnership)}% Black-owned`)
  if (own.womenOwnership >= 30) ownershipTags.push(`${Math.round(own.womenOwnership)}% Women-owned`)
  if (own.youthOwnership >= 25) ownershipTags.push(`${Math.round(own.youthOwnership)}% Youth-owned`)
  if (own.disabilityOwnership >= 5) ownershipTags.push(`${Math.round(own.disabilityOwnership)}% Disability-owned`)

  const serviceArea = asList(ps.serviceAreas || ps.deliveryAreas || entity.serviceArea).join(", ")
  const locationLine = [entity.location, serviceArea].filter(Boolean).join(" · ") || "-"

  const capacity = ps.capacity || ps.productionCapacity || ""
  const leadTime = ps.leadTime || ps.deliveryLeadTime || ""
  const capacityLine = [capacity, leadTime && `${leadTime} lead time`].filter(Boolean).join(" · ")

  const documentCount = Object.values(documents).reduce(
    (sum, value) => sum + (Array.isArray(value) ? value.length : value ? 1 : 0),
    0,
  )

  const taxCompliant = !!(legal.taxNumber || legal.taxClearance)
  const cipcRegistered = !!(legal.registrationNumber || entity.registrationNumber)
  const complianceStatus = taxCompliant && cipcRegistered
    ? "Fully compliant"
    : taxCompliant || cipcRegistered
      ? "Partially compliant"
      : "Not verified"

  const yearEstablished = Number.parseInt(entity.yearEstablished || entity.yearFounded || "", 10)
  const yearsOperating =
    entity.yearsOperating ||
    (Number.isFinite(yearEstablished) ? `${new Date().getFullYear() - yearEstablished}` : "-")

  return {
    id,
    name: entity.tradingName || entity.registeredName || "Unnamed Supplier",
    verified: legal.verified === true || data.verified === true || entity.verified === true,
    sector: formatLabel(asList(entity.economicSectors)[0] || "-"),
    productService: formatLabel(getFirstCategory(ps)),
    categoryCount: countCategories(ps),
    location: locationLine,
    locationOnly: entity.location || "-",
    capacity: capacityLine || "Not specified",
    bigScore: data.bigScore ?? data.scores?.bigScore ?? null,
    pisScore: data.pisScore ?? data.scores?.pisScore ?? null,
    businessSize: formatLabel(entity.businessSize || entity.companySize || "-"),
    yearsOperating,
    bbbeeLevel: legal.bbbeeLevel || "-",
    ownershipProfile: ownershipTags.join(", ") || "Not specified",
    ownershipTags,
    certifications: formatLabel(asList(legal.certifications || legal.accreditations)) || "-",
    pricingRange: ps.pricingRange || finance.pricingRange || "-",
    minimumOrder: ps.minimumOrderQuantity || ps.moq || "-",
    deliveryCapability: formatLabel(asList(ps.deliveryModes)) || "-",
    complianceStatus,
    documentCount,
    email: data.contactDetails?.email || data.userEmail || null,
    rating: 0,
    ratingCount: 0,
    primaryMatchPercentage: 0,
    aiMatchPercentage: null,
    aiReasoning: null,
    aiCapabilities: [],
    matchPercentage: 0,
    matchBreakdown: null,
  }
}

const hasTooManyMissingFields = (s) => {
  const fields = [s.name, s.productService, s.location, s.capacity, s.sector, s.bbbeeLevel]
  const missing = fields.filter(
    (f) =>
      !f ||
      ["-", "Not specified", "Various", "Unknown", "N/A"].includes(f.toString().trim()) ||
      f.toString().toLowerCase().includes("not specified"),
  ).length
  return missing > 4
}

/* ════════════════════════════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════════════════════════ */
export function SupplierTable({
  filters,
  stageFilter,
  applicationFilter,
  onSupplierContacted,
  onSuppliersUpdate,
  onCountChange,
  onNewRequest,
}) {
  const [suppliers, setSuppliers] = useState([])
  const [records, setRecords] = useState({})
  const [application, setApplication] = useState(null)
  const [ratings, setRatings] = useState({})
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
     <SupplierFlowPipeline /> anywhere on the page and the two find each
     other. */
  const [eventStageFilter, setEventStageFilter] = useState(null)
  useEffect(() => {
    const onFilter = (e) => setEventStageFilter(e.detail ?? null)
    window.addEventListener(SUPPLIER_STAGE_FILTER_EVENT, onFilter)
    return () => window.removeEventListener(SUPPLIER_STAGE_FILTER_EVENT, onFilter)
  }, [])
  const activeStageFilter = stageFilter ?? eventStageFilter

  /* Which product request the whole table is scored against. Seeded from
     ?applicationId= so arriving from the Applications page works; the event
     covers the case where this table is already on screen. */
  const [eventApplicationFilter, setEventApplicationFilter] = useState(readApplicationIdFromUrl)
  useEffect(() => {
    const onFilter = (e) => setEventApplicationFilter(e.detail ?? null)
    window.addEventListener(SUPPLIER_APPLICATION_FILTER_EVENT, onFilter)
    return () => window.removeEventListener(SUPPLIER_APPLICATION_FILTER_EVENT, onFilter)
  }, [])
  const activeApplicationFilter = applicationFilter ?? eventApplicationFilter

  /* Clearing the request drops the score band too — it arrived with the
     request, so leaving it behind would make the button look broken.
     setLocalFilters is declared further down; that's fine, this only runs on
     click, long after render has finished. */
  const clearApplicationFilter = () => {
    setEventApplicationFilter(null)
    window.dispatchEvent(new CustomEvent(SUPPLIER_APPLICATION_FILTER_EVENT, { detail: null }))
    setLocalFilters((prev) => ({ ...prev, matchRange: [0, 100] }))
    // Drop the params too, or a refresh would put the scope straight back.
    if (typeof window !== "undefined" && window.history?.replaceState) {
      const url = new URL(window.location.href)
      url.searchParams.delete("applicationId")
      url.searchParams.delete("matchMin")
      url.searchParams.delete("matchMax")
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
    }
  }

  const [detailsSupplier, setDetailsSupplier] = useState(null)
  const [noteTarget, setNoteTarget] = useState(null)
  const [noteText, setNoteText] = useState("")
  const [savedMatches, setSavedMatches] = useState(() => loadSavedMatches())
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [hoveredRow, setHoveredRow] = useState(null)

  useEffect(() => {
    persistSavedMatches(savedMatches)
  }, [savedMatches])

  const savedCount = useMemo(() => Object.values(savedMatches).filter(Boolean).length, [savedMatches])

  /* Popups — anchored popovers portaled to <body>, same pattern as the other
     match tables. { type, row, position:{x,y}, rect } */
  const [activePopup, setActivePopup] = useState(null)

  const [aiRunning, setAiRunning] = useState(false)
  const [aiProgress, setAiProgress] = useState({ current: 0, total: 0 })
  const [aiError, setAiError] = useState("")
  const [showIneligible, setShowIneligible] = useState(false)

  /* Filters + sort, restored from the last visit — but a band carried in the
     link wins over the stored match range, so the eye on the Applications page
     lands on exactly the rows it named. Seeded in the initializer rather than
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
    window.addEventListener(SUPPLIER_MATCH_RANGE_EVENT, onRange)
    return () => window.removeEventListener(SUPPLIER_MATCH_RANGE_EVENT, onRange)
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

  const toast = useCallback((type, message, ms = 3000) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), ms)
  }, [])

  /* One place that both the row bookmark and the quick-actions entry call, so
     the two can't drift apart. Declared after `toast` because it uses it — a
     const referenced before its initializer throws at render. */
  const toggleSaved = useCallback(
    (supplier) => {
      const nowSaved = !savedMatches[supplier.id]
      setSavedMatches((prev) => ({ ...prev, [supplier.id]: nowSaved }))
      toast("success", nowSaved ? `${supplier.name} saved` : `${supplier.name} removed from saved`, 2000)
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

  /* ─── Live SME-side records. One scoped listener; the old file ran an
     unscoped getDocs over supplierApplications and filtered in JS. ────── */
  useEffect(() => {
    if (!effectiveUserId) return undefined
    const unsubscribe = onSnapshot(
      query(collection(db, SME_SUPPLIER_COLLECTION), where("smeId", "==", effectiveUserId)),
      (snapshot) => {
        const next = {}
        snapshot.forEach((d) => {
          const data = d.data()
          if (!data.supplierId) return
          next[data.supplierId] = {
            status: data.status ? normalizeSupplierStatus(data.status) : null,
            hidden: data.hidden === true,
            notes: data.notes || [],
            dateMatched: data.createdAt || null,
          }
        })
        setRecords(next)
      },
      (err) => console.error("Supplier status listener failed:", err),
    )
    return () => unsubscribe()
  }, [effectiveUserId])

  /* ─── Application + profiles + ratings + cached AI, in one pass ──────────
     The old file had three overlapping effects that each refetched every
     universalProfile, plus a cached-AI effect keyed on allSuppliers.length
     that also set allSuppliers. That is what made the route hang. ─────── */
  const loadEverything = useCallback(async () => {
    if (!effectiveUserId) return

    setLoading(true)
    setError(null)
    try {
      /* Which request are we scoring against? The id from the Applications
         page wins. Falling back to a document keyed on the user id keeps the
         old single-request behaviour working for anyone arriving directly. */
      let appSnap = null
      if (activeApplicationFilter) {
        const scoped = await getDoc(doc(db, "productApplications", activeApplicationFilter))
        if (scoped.exists()) appSnap = scoped
      }
      if (!appSnap) {
        const fallback = await getDoc(doc(db, "productApplications", effectiveUserId))
        if (fallback.exists()) appSnap = fallback
      }
      if (!appSnap) {
        setSuppliers([])
        setApplication(null)
        setError("Complete a product or service request first and your supplier matches will appear here.")
        return
      }
      const applicationData = { id: appSnap.id, ...appSnap.data() }
      setApplication(applicationData)

      const [profilesSnap, reviewsSnap, aiSnap] = await Promise.all([
        getDocs(collection(db, "universalProfiles")),
        getDocs(collection(db, "supplierReviews")),
        getDoc(doc(db, "aiSecondaryMatches", applicationData.id)),
      ])

      /* Ratings are keyed by supplierId. The reviews modal used to write only
         supplierName, so nothing it saved ever reached this aggregate — it now
         writes both and this reads the id. */
      const buckets = {}
      reviewsSnap.forEach((d) => {
        const review = d.data()
        const key = review.supplierId
        if (!key) return
        if (!buckets[key]) buckets[key] = []
        buckets[key].push(Number(review.rating) || 0)
      })
      const ratingsData = {}
      Object.entries(buckets).forEach(([key, list]) => {
        ratingsData[key] = {
          average: list.reduce((sum, r) => sum + r, 0) / list.length,
          count: list.length,
        }
      })
      setRatings(ratingsData)

      const cachedAi = aiSnap.exists() ? aiSnap.data().suppliers || {} : {}

      const mapped = profilesSnap.docs
        .filter((d) => d.id !== effectiveUserId)
        .map((docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() }
          const row = mapSupplier(data, docSnap.id)
          const result = calculateEnhancedMatchScore(applicationData, data, ratingsData)
          const ai = cachedAi[docSnap.id]
          const ratingInfo = ratingsData[docSnap.id] || { average: 0, count: 0 }

          const enriched = {
            ...row,
            raw: data,
            rating: ratingInfo.average,
            ratingCount: ratingInfo.count,
            primaryMatchPercentage: result.totalScore,
            matchBreakdown: result.breakdown,
            aiMatchPercentage: ai ? ai.score : null,
            aiReasoning: ai ? ai.reasoning : null,
            aiCapabilities: ai ? ai.capabilities || [] : [],
            aiEligibility: getSupplierAiEligibility(data, effectiveUserId),
          }
          return { ...enriched, matchPercentage: getEffectiveMatchScore(enriched) }
        })
        .filter((s) => s.primaryMatchPercentage > 0)

      mapped.sort((a, b) => b.matchPercentage - a.matchPercentage)
      setSuppliers(mapped)
    } catch (err) {
      console.error("Error loading supplier matches:", err)
      setError("Could not load supplier matches. Refresh to try again.")
    } finally {
      setLoading(false)
    }
  }, [effectiveUserId, activeApplicationFilter])

  useEffect(() => {
    if (!authResolved) return
    if (!effectiveUserId) {
      setLoading(false)
      return
    }
    loadEverything()
  }, [authResolved, effectiveUserId, loadEverything])

  /* The request in scope, as the Application ID and Application Request
     columns show it. Every row is scored against this one request, so both
     read the same down the whole table. */
  const applicationMeta = useMemo(() => {
    if (!application) return { refId: "-", request: "-", fullId: null }
    return {
      refId: deriveAppId(application.id),
      request: describeApplication(application),
      fullId: application.id,
    }
  }, [application])

  const statusOf = useCallback((supplier) => normalizeSupplierStatus(records[supplier.id]?.status), [records])

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
     reorderable columns *and* the three fixed ones, so every column in the
     table can be dragged wider. */
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
      className="st-resize"
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
  const openPopup = (type, row, rect) => {
    let popupWidth
    let popupHeight
    switch (type) {
      case "match":
        popupWidth = 420
        popupHeight = 560
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

    setActivePopup({ type, row, position: { x, y }, rect })
  }

  const openPopupFromEvent = (type, row, event) => {
    event.stopPropagation()
    openPopup(type, row, event.currentTarget.getBoundingClientRect())
  }

  const closePopup = () => setActivePopup(null)

  /* ─── Writing status ────────────────────────────────────────────────── */
  const canAct = !isCompanyMember || ["owner", "admin"].includes(userRole)

  const writeRecord = useCallback(
    async (supplier, patch) => {
      if (!effectiveUserId) return
      await setDoc(
        doc(db, SME_SUPPLIER_COLLECTION, smeSupplierId(effectiveUserId, supplier.id)),
        {
          smeId: effectiveUserId,
          supplierId: supplier.id,
          supplierName: supplier.name,
          viewType: "sme",
          matchPercentage: supplier.matchPercentage || 0,
          updatedAt: serverTimestamp(),
          ...patch,
        },
        { merge: true },
      )
    },
    [effectiveUserId],
  )

  const handleSetStatus = async (supplier, nextStatus, { quiet = false } = {}) => {
    if (!canAct) {
      toast("warning", "Only company owners and admins can update supplier matches.", 4000)
      return
    }
    try {
      await writeRecord(supplier, { status: nextStatus, createdAt: records[supplier.id]?.dateMatched || serverTimestamp() })
      if (!quiet) toast("success", `${supplier.name} moved to ${nextStatus}.`)
    } catch (err) {
      console.error("Failed to update supplier status:", err)
      toast("error", "Could not update the status. Try again.", 4000)
    }
  }

  /* Opening a profile is what "Viewed" means, so record it. Without this the
     funnel could never show anything between New Match and Contacted. */
  const openDetails = (supplier) => {
    setActivePopup(null)
    setDetailsSupplier(supplier)
    if (statusOf(supplier) === "New Match" && !records[supplier.id]?.status && canAct) {
      handleSetStatus(supplier, "Viewed", { quiet: true })
    }
  }

  /* ─── Request a quote ───────────────────────────────────────────────── */
  const sendSupplierEmail = async (supplier, payload) => {
    try {
      const config = {
        serviceId: API_KEYS.SERVICE_ID_MESSAGES,
        templateId: API_KEYS.TEMPLATE_ID_MESSAGES,
        publicKey: API_KEYS.PUBLIC_KEY_ID_MESSAGES,
      }
      if (!window.emailjs) {
        emailjs.init(config.publicKey)
        window.emailjs = emailjs
      }

      const recipient = supplier.email
      if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
        console.warn("No usable email on the supplier profile, skipping the email notification.")
        return
      }

      await window.emailjs.send(
        config.serviceId,
        config.templateId,
        {
          to_email: recipient,
          subject: `Quote request from ${payload.smeName}`,
          from_name: "BIG Marketplace Africa",
          date: new Date().toLocaleDateString("en-ZA"),
          message:
            `Dear ${supplier.name},\n\n${payload.smeName} has requested a quote through BIG Marketplace Africa.\n\n` +
            `- Requirement: ${payload.request.serviceRequested}\n` +
            `- Location: ${payload.request.location}\n` +
            `- Budget: ${payload.request.budgetRange.min} to ${payload.request.budgetRange.max}\n` +
            `- Needed by: ${payload.request.deliveryTurnaround}\n` +
            `- Match score: ${payload.matchPercentage}%\n\n` +
            `Log in to respond with your quote.\n\nBIG Marketplace Africa`,
          portal_url: "https://www.bigmarketplace.africa/supplier/applications",
          has_attachments: "false",
          attachments_count: "0",
        },
        config.publicKey,
      )
    } catch (err) {
      // Email failing must never report the quote request itself as failed.
      console.error("Quote saved but the email notification failed:", err)
    }
  }

  const handleRequestQuote = async (supplier) => {
    setActivePopup(null)
    const user = auth.currentUser
    if (!user) {
      toast("error", "Log in to request a quote.")
      return
    }
    if (!canAct) {
      toast("warning", "Only company owners and admins can request quotes.", 4000)
      return
    }
    if (supplier.id === effectiveUserId) {
      toast("error", "That is your own profile.")
      return
    }

    setBusyId(supplier.id)
    try {
      const smeSnap = await getDoc(doc(db, "universalProfiles", effectiveUserId))
      const smeData = smeSnap.exists() ? smeSnap.data() : {}
      const smeName = smeData.entityOverview?.registeredName || smeData.entityOverview?.tradingName || "A Small Business"

      const request = {
        id: application?.id || "unknown",
        serviceRequested:
          getFirstCategory(application?.productsServices) ||
          application?.requestOverview?.purpose ||
          "Not specified",
        purpose: application?.requestOverview?.purpose || "Not specified",
        location: application?.requestOverview?.location || application?.matchingPreferences?.location || "Not specified",
        budgetRange: {
          min: application?.requestOverview?.minBudget || application?.matchingPreferences?.minBudget || "0",
          max: application?.requestOverview?.maxBudget || application?.matchingPreferences?.maxBudget || "0",
        },
        urgency: application?.applicationOverview?.urgency || "Not specified",
        deliveryTurnaround: application?.requestOverview?.endDate
          ? `By ${application.requestOverview.endDate}`
          : "Not specified",
      }

      const shared = {
        smeId: effectiveUserId,
        smeName,
        smeLocation: smeData.entityOverview?.location || "",
        smeSector: asList(smeData.entityOverview?.economicSectors).join(", "),
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierLocation: supplier.locationOnly,
        supplierSector: supplier.sector,
        // Kept so anything still reading the old shape keeps working. The old
        // writer had these two the wrong way round.
        customerId: effectiveUserId,
        customerName: smeName,
        submittedBy: user.uid,
        submittedByRole: userRole,
        applicationId: application?.id || null,
        originalRequest: request,
        matchPercentage: supplier.matchPercentage || 0,
        primaryMatchPercentage: supplier.primaryMatchPercentage || 0,
        aiMatchPercentage: supplier.aiMatchPercentage ?? null,
        matchBreakdown: supplier.matchBreakdown || null,
        status: "Quote Requested",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Both ends of the gap, so responsiveness can be measured later.
        smeActedAt: serverTimestamp(),
        firstRespondedAt: null,
      }

      await Promise.all([
        setDoc(doc(db, SME_SUPPLIER_COLLECTION, smeSupplierId(effectiveUserId, supplier.id)), {
          ...shared,
          viewType: "sme",
        }, { merge: true }),
        setDoc(doc(db, SUPPLIER_SME_COLLECTION, supplierSmeId(supplier.id, effectiveUserId)), {
          ...shared,
          viewType: "supplier",
        }, { merge: true }),
      ])

      const applicationId = smeSupplierId(effectiveUserId, supplier.id)

      try {
        await Promise.all([
          addDoc(collection(db, "messages"), {
            to: supplier.id,
            toName: supplier.name,
            from: user.uid,
            fromName: smeName,
            subject: `Quote request from ${smeName}`,
            content:
              `Dear ${supplier.name},\n\n${smeName} has requested a quote.\n\n` +
              `Requirement: ${request.serviceRequested}\nLocation: ${request.location}\n` +
              `Budget: ${request.budgetRange.min} to ${request.budgetRange.max}\nNeeded by: ${request.deliveryTurnaround}\n\n` +
              `Log in to BIG Marketplace Africa to respond.\n\nBIG Marketplace Africa`,
            date: new Date().toISOString(),
            read: false,
            type: "inbox",
            applicationId,
            linkTo: `/supplier/quotes/${applicationId}`,
          }),
          addDoc(collection(db, "messages"), {
            to: user.uid,
            toName: smeName,
            from: "system",
            fromName: "BIG Marketplace",
            subject: `Quote requested from ${supplier.name}`,
            content:
              `Dear ${smeName},\n\nYour quote request to ${supplier.name} has been sent.\n\n` +
              `Supplier: ${supplier.name}\nOffering: ${supplier.productService}\nLocation: ${supplier.locationOnly}\n\n` +
              `You will be notified when they respond.\n\nBIG Marketplace Africa`,
            date: new Date().toISOString(),
            read: false,
            type: "inbox",
            applicationId,
            linkTo: `/sme/quotes/${applicationId}`,
          }),
        ])
      } catch (messageError) {
        console.error("Quote saved but the in-app messages failed:", messageError)
      }

      await sendSupplierEmail(supplier, { smeName, request, matchPercentage: supplier.matchPercentage || 0 })

      window.dispatchEvent(
        new CustomEvent("newNotification", {
          detail: {
            message: `Quote requested from ${supplier.name}`,
            type: "success",
            timestamp: new Date().toISOString(),
          },
          bubbles: true,
        }),
      )

      toast("success", `Quote requested from ${supplier.name}.`)
      if (onSupplierContacted) onSupplierContacted(supplier.id)
    } catch (err) {
      console.error("Error requesting a quote:", err)
      toast("error", "Could not send the quote request. Try again.", 4000)
    } finally {
      setBusyId(null)
    }
  }

  /* ─── AI analysis ───────────────────────────────────────────────────── */
  const runAiAnalysis = async () => {
    if (!application || suppliers.length === 0) {
      setAiError("There is nothing to analyse yet.")
      return
    }
    setAiRunning(true)
    setAiError("")
    setAiProgress({ current: 0, total: 0 })
    try {
      const { processed, analyzedCount, ineligibleCount } = await runAiAnalysisForApplication(
        application,
        suppliers.map((s) => s.raw || s),
        { onProgress: setAiProgress, currentUserId: effectiveUserId },
      )

      setSuppliers((prev) =>
        prev.map((s) => {
          const ai = processed[s.id]
          if (!ai) return s
          const next = {
            ...s,
            aiMatchPercentage: ai.score,
            aiReasoning: ai.reasoning,
            aiCapabilities: ai.capabilities || [],
          }
          return { ...next, matchPercentage: getEffectiveMatchScore(next) }
        }),
      )

      toast(
        "success",
        `AI analysis complete — ${analyzedCount} supplier${analyzedCount === 1 ? "" : "s"} scored${
          ineligibleCount ? `, ${ineligibleCount} skipped as ineligible` : ""
        }.`,
        4000,
      )
    } catch (err) {
      console.error("AI analysis failed:", err)
      const message = err?.message?.includes("AI-eligible")
        ? err.message
        : "AI analysis failed. Wait a moment and try again."
      setAiError(message)
      toast("error", message, 4000)
    } finally {
      setAiRunning(false)
      setAiProgress({ current: 0, total: 0 })
    }
  }

  /* ─── Notes ─────────────────────────────────────────────────────────── */
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

  /* ─── Derived options ───────────────────────────────────────────────────
     Every filter offers the values actually present in the table, so you pick
     from what exists rather than guessing at a search box. */
  const uniqueOf = useCallback(
    (accessor) =>
      [...new Set(suppliers.map(accessor).filter((v) => v && v !== "-" && v !== "Not specified"))].sort(),
    [suppliers],
  )
  const nameOptions = useMemo(() => uniqueOf((s) => s.name), [uniqueOf])
  const productServiceOptions = useMemo(() => uniqueOf((s) => s.productService), [uniqueOf])
  const locationOptions = useMemo(() => uniqueOf((s) => s.locationOnly), [uniqueOf])
  const capacityOptions = useMemo(() => uniqueOf((s) => s.capacity), [uniqueOf])
  const businessSizeOptions = useMemo(() => uniqueOf((s) => s.businessSize), [uniqueOf])
  const yearsOperatingOptions = useMemo(() => uniqueOf((s) => s.yearsOperating), [uniqueOf])
  const certificationOptions = useMemo(() => uniqueOf((s) => s.certifications), [uniqueOf])
  const pricingRangeOptions = useMemo(() => uniqueOf((s) => s.pricingRange), [uniqueOf])
  const minimumOrderOptions = useMemo(() => uniqueOf((s) => s.minimumOrder), [uniqueOf])
  const sectorOptions = useMemo(() => uniqueOf((s) => s.sector), [uniqueOf])
  const complianceOptions = useMemo(() => uniqueOf((s) => s.complianceStatus), [uniqueOf])
  const bbbeeOptions = useMemo(() => {
    const found = uniqueOf((s) => s.bbbeeLevel)
    return found.length ? found : BBBEE_LEVELS
  }, [uniqueOf])

  /* ─── Filtering + sorting ───────────────────────────────────────────────
     Split in two on purpose. `preStageSuppliers` applies every filter except
     the pipeline stage; that list is what gets broadcast, so a card reading 8
     and the table showing 8 are the same 8 rows. ──────────────────────── */
  const preStageSuppliers = useMemo(() => {
    const f = localFilters
    const matchesAny = (selected, value) =>
      !selected?.length || selected.some((v) => (value || "").toString().toLowerCase().includes(v.toLowerCase()))
    const includesText = (needle, value) =>
      !needle?.trim() || (value || "").toString().toLowerCase().includes(needle.toLowerCase().trim())

    return suppliers.filter((s) => {
      const record = records[s.id]
      if (record?.hidden) return false
      if (hasTooManyMissingFields(s)) return false
      if (showSavedOnly && !savedMatches[s.id]) return false

      const status = statusOf(s)

      if (filters?.search && !s.name.toLowerCase().includes(filters.search.toLowerCase())) return false

      if (!matchesAny(f.name, s.name)) return false
      if (!matchesAny(f.applicationId, applicationMeta.refId)) return false
      if (!matchesAny(f.applicationRequest, applicationMeta.request)) return false

      if (s.matchPercentage < f.matchRange[0] || s.matchPercentage > f.matchRange[1]) return false
      if (s.primaryMatchPercentage < f.primaryRange[0] || s.primaryMatchPercentage > f.primaryRange[1]) return false

      const ai = s.aiMatchPercentage
      if ((f.aiRange[0] > 0 || f.aiRange[1] < 100) && (ai === null || ai < f.aiRange[0] || ai > f.aiRange[1]))
        return false

      if (!matchesAny(f.productService, s.productService)) return false
      if (!matchesAny(f.location, s.location)) return false
      if (!matchesAny(f.capacity, s.capacity)) return false
      if (f.status.length > 0 && !f.status.includes(status)) return false
      if (!matchesAny(f.businessSize, s.businessSize)) return false
      if (!matchesAny(f.yearsOperating, s.yearsOperating)) return false
      if (f.bbbeeLevel.length > 0 && !f.bbbeeLevel.includes(s.bbbeeLevel)) return false
      if (f.ownershipProfile.length > 0 && !f.ownershipProfile.some((tag) => s.ownershipProfile.includes(tag.split("-")[0])))
        return false
      if (!matchesAny(f.certifications, s.certifications)) return false
      if (!matchesAny(f.pricingRange, s.pricingRange)) return false
      if (!matchesAny(f.minimumOrder, s.minimumOrder)) return false
      if (f.deliveryCapability.length > 0 && !f.deliveryCapability.some((m) => s.deliveryCapability.includes(m)))
        return false
      if (f.complianceStatus.length > 0 && !f.complianceStatus.includes(s.complianceStatus)) return false
      if (!matchesAny(f.sector, s.sector)) return false
      if (!includesText(f.notes, (record?.notes || []).join(" "))) return false

      const matchedIso = toISODateOnly(record?.dateMatched)
      if (f.matchedFrom && (!matchedIso || matchedIso < f.matchedFrom)) return false
      if (f.matchedTo && (!matchedIso || matchedIso > f.matchedTo)) return false

      return true
    })
  }, [suppliers, records, localFilters, filters, statusOf, showSavedOnly, savedMatches, applicationMeta])

  /* Every supplier the pipeline should count, each with its resolved status.
     New Match has no stored record, so the pipeline cannot work this out on
     its own — it would have to infer it from a total. */
  useEffect(() => {
    if (typeof window === "undefined") return
    const payload = preStageSuppliers.map((s) => ({ id: s.id, name: s.name, status: statusOf(s) }))
    const emit = () => window.dispatchEvent(new CustomEvent(SUPPLIER_ROWS_EVENT, { detail: payload }))
    emit()
    window.addEventListener(SUPPLIER_ROWS_REQUEST_EVENT, emit)
    return () => window.removeEventListener(SUPPLIER_ROWS_REQUEST_EVENT, emit)
  }, [preStageSuppliers, statusOf])

  const filteredSuppliers = useMemo(() => {
    const rows = activeStageFilter
      ? preStageSuppliers.filter((s) => statusOf(s) === activeStageFilter)
      : [...preStageSuppliers]

    if (sortConfig?.key) {
      const accessors = {
        name: (s) => s.name,
        applicationId: () => applicationMeta.refId,
        applicationRequest: () => applicationMeta.request,
        match: (s) => s.matchPercentage || 0,
        primaryMatch: (s) => s.primaryMatchPercentage || 0,
        aiMatch: (s) => (s.aiMatchPercentage === null ? -1 : s.aiMatchPercentage),
        productService: (s) => s.productService,
        location: (s) => s.location,
        capacity: (s) => s.capacity,
        status: (s) => statusOf(s),
        businessSize: (s) => s.businessSize,
        yearsOperating: (s) => Number.parseInt(s.yearsOperating, 10) || 0,
        bbbeeLevel: (s) => s.bbbeeLevel,
        pricingRange: (s) => s.pricingRange,
        minimumOrder: (s) => s.minimumOrder,
        complianceStatus: (s) => s.complianceStatus,
        sector: (s) => s.sector,
        documents: (s) => s.documentCount || 0,
        dateMatched: (s) => toDateSafe(records[s.id]?.dateMatched)?.getTime() ?? 0,
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
  }, [preStageSuppliers, activeStageFilter, sortConfig, statusOf, records, applicationMeta])

  useEffect(() => {
    if (onCountChange) onCountChange(filteredSuppliers.length)
    if (onSuppliersUpdate) onSuppliersUpdate(filteredSuppliers)
  }, [filteredSuppliers, onCountChange, onSuppliersUpdate])

  /* ─── Filter chrome ─────────────────────────────────────────────────── */
  const f = localFilters
  const activeFilterCount =
    f.name.length +
    f.applicationId.length +
    f.applicationRequest.length +
    (f.matchRange[0] > 0 || f.matchRange[1] < 100 ? 1 : 0) +
    (f.primaryRange[0] > 0 || f.primaryRange[1] < 100 ? 1 : 0) +
    (f.aiRange[0] > 0 || f.aiRange[1] < 100 ? 1 : 0) +
    f.productService.length +
    f.location.length +
    f.capacity.length +
    f.status.length +
    f.businessSize.length +
    f.yearsOperating.length +
    f.bbbeeLevel.length +
    f.ownershipProfile.length +
    f.certifications.length +
    f.pricingRange.length +
    f.minimumOrder.length +
    f.deliveryCapability.length +
    f.complianceStatus.length +
    f.sector.length +
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
      case "primaryMatch":
        return f.primaryRange[0] > 0 || f.primaryRange[1] < 100
      case "aiMatch":
        return f.aiRange[0] > 0 || f.aiRange[1] < 100
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
  const supplierWidth = widthOf(SUPPLIER_KEY)
  const actionWidth = widthOf(ACTION_KEY)
  // Application ID and Supplier are both frozen to the left, in that order, so
  // every other sticky offset starts after the pair.
  const pinnedLeadWidth = appIdWidth + supplierWidth

  const stickyOffsets = useMemo(() => {
    const offsets = {}
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

  const aiEligibleCount = useMemo(() => suppliers.filter((s) => s.aiEligibility?.eligible).length, [suppliers])
  const ineligibleSuppliers = useMemo(() => suppliers.filter((s) => !s.aiEligibility?.eligible), [suppliers])

  /* ─── Cells ─────────────────────────────────────────────────────────── */
  const scoreColor = (n) => (n > 75 ? "#48BB78" : n > 50 ? "#D69E2E" : "#E53E3E")

  const renderCell = (key, s, rowBg) => {
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
    const record = records[s.id]

    switch (key) {
      case "applicationRequest":
        return (
          <td key={key} style={style}>
            <TruncatedText text={applicationMeta.request} maxLength={28} />
          </td>
        )

      case "match":
        return (
          <td key={key} style={{ ...style, textAlign: "center" }}>
            <div className="flex flex-col items-center gap-1 w-full">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold" style={{ color: scoreColor(s.matchPercentage) }}>
                  {s.matchPercentage}%
                </span>
                <button
                  onClick={(e) => openPopupFromEvent("match", s, e)}
                  title="Why this match?"
                  aria-label={`Why this match for ${s.name}?`}
                  className="text-[#a67c52] hover:text-[#4a352f]"
                >
                  <HelpCircle size={13} />
                </button>
              </div>
              <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(0, Math.min(100, s.matchPercentage))}%`,
                    backgroundColor: scoreColor(s.matchPercentage),
                  }}
                />
              </div>
              {s.aiMatchPercentage !== null && (
                <span className="text-[9px] text-[#a89482] uppercase tracking-wide">AI blended</span>
              )}
            </div>
          </td>
        )

      case "primaryMatch":
        return (
          <td key={key} style={{ ...style, textAlign: "center" }}>
            <span className="text-xs font-semibold" style={{ color: scoreColor(s.primaryMatchPercentage) }}>
              {s.primaryMatchPercentage}%
            </span>
          </td>
        )

      case "aiMatch":
        return (
          <td key={key} style={{ ...style, textAlign: "center" }}>
            {s.aiMatchPercentage === null ? (
              <span className="text-[#a89482] text-xs">Not run</span>
            ) : (
              <span className="text-xs font-semibold" style={{ color: scoreColor(s.aiMatchPercentage) }}>
                {s.aiMatchPercentage}%
              </span>
            )}
          </td>
        )

      case "productService":
        return (
          <td key={key} style={style}>
            <TruncatedText text={s.productService} maxLength={26} />
            {s.categoryCount > 1 && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#f5f0e1] text-[#7d5a50] text-[10px] font-medium">
                +{s.categoryCount - 1} more
              </span>
            )}
          </td>
        )

      case "status": {
        const st = getStatusStyle(statusOf(s))
        return (
          <td key={key} style={style}>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ backgroundColor: st.color, color: st.textColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.textColor }} />
              {statusOf(s)}
            </span>
          </td>
        )
      }

      case "bbbeeLevel":
        return (
          <td key={key} style={style}>
            {s.bbbeeLevel && s.bbbeeLevel !== "-" ? (
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#f5f0e1] text-[#4a352f] text-[10px] font-medium">
                {s.bbbeeLevel}
              </span>
            ) : (
              <span className="text-[#a89482] text-xs">-</span>
            )}
          </td>
        )

      case "ownershipProfile":
        return (
          <td key={key} style={style}>
            {s.ownershipTags.length === 0 ? (
              <span className="text-[#a89482] text-xs">Not specified</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {s.ownershipTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-[#f5f0e1] text-[#4a352f] text-[10px] font-medium whitespace-nowrap"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </td>
        )

      case "complianceStatus": {
        const tone =
          s.complianceStatus === "Fully compliant"
            ? { bg: "#E8F5E8", fg: "#388E3C" }
            : s.complianceStatus === "Partially compliant"
              ? { bg: "#FFF3E0", fg: "#F57C00" }
              : { bg: "#FFEBEE", fg: "#D32F2F" }
        return (
          <td key={key} style={style}>
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
              style={{ backgroundColor: tone.bg, color: tone.fg }}
            >
              {s.complianceStatus}
            </span>
          </td>
        )
      }

      case "documents":
        return (
          <td key={key} style={{ ...style, textAlign: "center" }}>
            {s.documentCount || <span className="text-[#a89482]">-</span>}
          </td>
        )

      case "dateMatched":
        return (
          <td key={key} style={style}>
            {formatDateValue(record?.dateMatched) || <span className="text-[#a89482] text-xs">-</span>}
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
            <TruncatedText text={s[key]} maxLength={26} />
          </td>
        )
    }
  }

  /* ─── Render ────────────────────────────────────────────────────────── */
  if (loading) {
    return <div className="p-10 text-center text-[#7d5a50] text-sm">Loading supplier matches...</div>
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm font-semibold text-[#4a352f] m-0 mb-3">{error}</p>
        {onNewRequest && (
          <button onClick={onNewRequest} className="px-4 py-2 rounded-xl bg-[#7d5a50] text-white text-sm font-semibold">
            Create a request
          </button>
        )}
      </div>
    )
  }

  /* Every chip-list filter is driven by this one array. */
  const FILTER_OPTION_SETS = [
    { type: "name", label: "Supplier name", options: nameOptions },
    { type: "applicationId", label: "Application ID", options: applicationMeta.refId !== "-" ? [applicationMeta.refId] : [] },
    { type: "applicationRequest", label: "Application Request", options: applicationMeta.request !== "-" ? [applicationMeta.request] : [] },
    { type: "productService", label: "Product / Service", options: productServiceOptions },
    { type: "location", label: "Location", options: locationOptions },
    { type: "capacity", label: "Capacity / Lead Time", options: capacityOptions },
    { type: "status", label: "Status", options: SUPPLIER_STATUSES },
    { type: "businessSize", label: "Business Size", options: businessSizeOptions },
    { type: "yearsOperating", label: "Years Operating", options: yearsOperatingOptions },
    { type: "bbbeeLevel", label: "B-BBEE Level", options: bbbeeOptions },
    { type: "ownershipProfile", label: "Ownership Profile", options: OWNERSHIP_TAGS },
    { type: "certifications", label: "Certifications", options: certificationOptions },
    { type: "pricingRange", label: "Pricing Range", options: pricingRangeOptions },
    { type: "minimumOrder", label: "Minimum Order", options: minimumOrderOptions },
    { type: "deliveryCapability", label: "Delivery Capability", options: DELIVERY_MODES },
    { type: "complianceStatus", label: "Compliance Status", options: complianceOptions },
    { type: "sector", label: "Sector", options: sectorOptions },
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
            Company supplier matches — role: {userRole?.toUpperCase()}
          </h3>
          <p className="m-0 mt-1 text-sm text-[#4a5568]">
            {canAct
              ? "You can request quotes and move suppliers through the pipeline."
              : "You have read-only access to these supplier matches."}
          </p>
        </div>
      )}

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

      {/* AI analysis strip */}
      <div className="bg-[#faf7f2] border border-[#e6d7c3] rounded-2xl p-4 mb-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#4a352f] m-0 flex items-center gap-2">
            <Brain size={15} className="text-[#7d5a50]" /> AI supplier analysis
          </h3>
          <p className="text-xs text-[#7d5a50] m-0 mt-1">
            Reads each supplier's written descriptions against your request. {aiEligibleCount} of {suppliers.length}{" "}
            supplier{suppliers.length === 1 ? "" : "s"} have enough profile text to analyse.
          </p>
          {aiError && (
            <p className="text-xs text-[#D32F2F] m-0 mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> {aiError}
            </p>
          )}
          {aiRunning && aiProgress.total > 0 && (
            <p className="text-xs text-[#7d5a50] m-0 mt-1">
              Analysing {aiProgress.current} of {aiProgress.total}...
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {ineligibleSuppliers.length > 0 && (
            <button
              onClick={() => setShowIneligible((v) => !v)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-[#c8b6a6] text-[#4a352f] hover:bg-[#f5f0e1]"
            >
              {showIneligible ? "Hide" : "Show"} skipped ({ineligibleSuppliers.length})
            </button>
          )}
          <button
            onClick={runAiAnalysis}
            disabled={aiRunning || aiEligibleCount === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#7d5a50] text-white disabled:opacity-40"
          >
            {aiRunning ? "Analysing..." : "Run AI analysis"}
          </button>
        </div>
      </div>

      {showIneligible && ineligibleSuppliers.length > 0 && (
        <div className="bg-white border border-[#e6d7c3] rounded-2xl p-4 mb-4">
          <p className="text-xs font-semibold text-[#4a352f] m-0 mb-2">
            Skipped by AI analysis — not enough profile text
          </p>
          <div className="flex flex-wrap gap-2">
            {ineligibleSuppliers.map((s) => (
              <span
                key={s.id}
                className="px-2.5 py-1 rounded-full text-xs bg-[#f5f0e1] text-[#4a352f]"
                title={s.aiEligibility?.reason || "No reason recorded"}
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-[#faf7f2] rounded-t-2xl p-4 border border-[#e6d7c3] border-b-0 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-[#4a352f] m-0">Supplier Matches</h2>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
              <LayoutGrid size={12} className="text-[#7d5a50] flex-shrink-0" />
              Viewing: {activeView.name}
              {activeView.description && <span className="font-normal text-[#a89482]"> — {activeView.description}</span>}
            </span>

            {/* Which request the scores belong to. Everything in the table is
                scored against this one, so it is worth stating plainly. */}
            {applicationMeta.fullId && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#5d4037]/10 text-[#4a352f] border border-[#5d4037]/40">
                <Hash size={12} className="text-[#7d5a50]" />
                {applicationMeta.refId} · {applicationMeta.request}
                {activeApplicationFilter && (
                  <button
                    onClick={clearApplicationFilter}
                    title="Go back to your default request"
                    className="ml-1 px-2 py-0.5 rounded-lg bg-white border border-[#c8b6a6] text-[#7d5a50] hover:bg-[#f5f0e1] font-semibold"
                  >
                    Clear
                  </button>
                )}
              </span>
            )}

            {/* The score band the Applications page sent, or one set here in the
                Match % filter. Named the same way it was picked over there. */}
            {matchRangeLabel && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#e8f5e8]/70 text-[#4a352f] border border-[#48BB78]/40">
                <Target size={12} className="text-[#7d5a50]" />
                Match: {matchRangeLabel}
                <span className="font-normal text-[#a89482]">({filteredSuppliers.length})</span>
                <button
                  onClick={clearMatchRange}
                  className="ml-1 px-2 py-0.5 rounded-lg bg-white border border-[#c8b6a6] text-[#7d5a50] hover:bg-[#f5f0e1] font-semibold"
                >
                  Show all scores
                </button>
              </span>
            )}

            {activeStageFilter && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#a67c52]/10 text-[#4a352f] border border-[#a67c52]/40">
                <Target size={12} className="text-[#7d5a50]" />
                Pipeline stage: {activeStageFilter}
                <span className="font-normal text-[#a89482]">({filteredSuppliers.length})</span>
              </span>
            )}
            {(showSavedOnly || savedCount > 0) && (
              <button
                onClick={() => setShowSavedOnly((v) => !v)}
                title={showSavedOnly ? "Show all suppliers" : "Show only saved suppliers"}
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
                        <span className="text-sm text-[#4a352f] flex-1">Supplier</span>
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
            .st-th { color: #faf7f2 !important; vertical-align: top !important; }
            .st-th-draggable { cursor: grab; }
            .st-th-draggable:active { cursor: grabbing; }
            .st-th-row { display: flex; align-items: flex-start; gap: 2px; min-width: 0; }
            /* overflow-wrap: normal stops the browser splitting inside a word,
               which is what turned "Match %" into "MAT CH.." in narrow
               columns. */
            .st-th-label {
              flex: 1 1 auto; min-width: 0;
              display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
              overflow: hidden; white-space: normal;
              overflow-wrap: normal; word-break: normal; hyphens: none;
              line-height: 1.2; letter-spacing: 0.02em;
            }
            .st-th-tools { display: flex; align-items: center; flex-shrink: 0; }
            /* The drag grip leaves the flex flow and only appears on hover,
               buying every header ~14px more room for its label. */
            .st-th-grip { position: absolute; left: 3px; top: 10px; opacity: 0; transition: opacity .15s; }
            .st-th:hover .st-th-grip { opacity: .45; }
            .st-resize { position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: col-resize; z-index: 5; }
            .st-resize:hover { background: rgba(255,255,255,0.25); }
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
                  className="st-th font-semibold uppercase tracking-wider text-xs sticky top-0 left-0 z-30 text-left"
                  style={{
                    backgroundColor: "#4a352f",
                    width: appIdWidth,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                    borderRight: "1px solid #e6d7c3",
                  }}
                >
                  <div className="st-th-row">
                    <span className="st-th-label" title="Application ID">
                      Application ID
                    </span>
                    <span className="st-th-tools">
                      <SortTrigger columnKey="applicationId" />
                      <FilterTrigger type="applicationId" active={localFilters.applicationId.length > 0} />
                      <HeaderInfoTooltip text="The product or service request these scores belong to. Every supplier in the table is scored against this one request." />
                    </span>
                  </div>
                  <ColumnResizer colKey={APPID_KEY} />
                </th>

                {/* Supplier — second pinned column */}
                <th
                  className="st-th font-semibold uppercase tracking-wider text-xs sticky top-0 z-30 text-left"
                  style={{
                    backgroundColor: "#4a352f",
                    left: appIdWidth,
                    width: supplierWidth,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                    boxShadow: "2px 0 0 #e6d7c3",
                  }}
                >
                  <div className="st-th-row">
                    <span className="st-th-label" title="Supplier">
                      Supplier
                    </span>
                    <span className="st-th-tools">
                      <SortTrigger columnKey="name" />
                      <FilterTrigger type="name" active={localFilters.name.length > 0} />
                      <HeaderInfoTooltip text="The supplier's trading name. A tick means their profile is verified; a warning triangle means key fields are still missing. Click the eye for the full profile." />
                    </span>
                  </div>
                  <ColumnResizer colKey={SUPPLIER_KEY} />
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
                      className={`st-th st-th-draggable font-semibold uppercase tracking-wider text-xs sticky top-0 select-none transition-opacity ${
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
                      <GripVertical size={11} className="st-th-grip" />
                      <div className={`st-th-row ${col.align === "center" ? "justify-center" : ""}`}>
                        <span className="st-th-label" title={col.label}>
                          {col.label}
                        </span>
                        <span className="st-th-tools">
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
                  className="st-th text-center font-semibold uppercase tracking-wider text-xs sticky top-0 z-20"
                  style={{
                    backgroundColor: "#4a352f",
                    width: actionWidth,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                  }}
                >
                  <div className="st-th-row justify-center">
                    <span className="st-th-label">Action</span>
                    <HeaderInfoTooltip text="Request a quote or open what you've already sent, bookmark the supplier to come back to, or open quick actions for notes and sharing." />
                  </div>
                  <ColumnResizer colKey={ACTION_KEY} />
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan={orderedColumns.length + 3}
                    style={{ ...tableCellStyle, textAlign: "center", padding: "3rem 1rem", borderRight: "none" }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-[#f5f0e1] flex items-center justify-center">
                        <Package size={26} className="text-[#7d5a50] opacity-50" />
                      </div>
                      <p className="text-sm font-semibold text-[#4a352f] m-0">
                        {suppliers.length === 0
                          ? "No supplier matches yet"
                          : matchRangeLabel
                            ? `No suppliers ${matchRangeLabel.toLowerCase()} for this request`
                            : showSavedOnly
                              ? "No saved suppliers"
                              : activeStageFilter
                                ? `No suppliers at ${activeStageFilter}`
                                : "No suppliers match these filters"}
                      </p>
                      <p className="text-xs text-[#a89482] m-0">
                        {suppliers.length === 0
                          ? "Add the categories, budget and location to your request and matches will follow."
                          : matchRangeLabel
                            ? "Widen the score band, or clear it to see every supplier scored against this request."
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
                      {showSavedOnly && (
                        <button
                          onClick={() => setShowSavedOnly(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7d5a50] text-white"
                        >
                          Show all suppliers
                        </button>
                      )}
                      {activeFilterCount > 0 && suppliers.length > 0 && (
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
                filteredSuppliers.map((s) => {
                  const status = statusOf(s)
                  const actions = getRowActions(status)
                  const isSaved = !!savedMatches[s.id]
                  const isTerminal = !!actions.terminal
                  const rowBg = hoveredRow === s.id ? "#fdf8f4" : "#ffffff"
                  const busy = busyId === s.id
                  const incomplete = !s.verified && (s.productService === "-" || s.location === "-")

                  return (
                    <tr
                      key={s.id}
                      onMouseEnter={() => setHoveredRow(s.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ backgroundColor: rowBg, transition: "background-color .15s" }}
                    >
                      {/* Application ID — pinned left. Constant down the table,
                          because every score belongs to the same request. */}
                      <td
                        className="sticky left-0 z-10"
                        style={{ ...tableCellStyle, width: appIdWidth, backgroundColor: rowBg }}
                      >
                        {applicationMeta.refId !== "-" ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold tracking-wide text-[#FAF7F2]"
                            style={{ background: "linear-gradient(135deg,#5d4037,#4a332a)", fontFamily: "monospace" }}
                            title={`Full application id: ${applicationMeta.fullId}`}
                          >
                            <Hash size={10} /> {applicationMeta.refId}
                          </span>
                        ) : (
                          <span style={{ color: "#a89482", fontSize: "0.75rem" }}>-</span>
                        )}
                      </td>

                      {/* Supplier — pinned left */}
                      <td
                        className="sticky z-10"
                        style={{
                          ...tableCellStyle,
                          left: appIdWidth,
                          width: supplierWidth,
                          backgroundColor: rowBg,
                          borderRight: "none",
                          boxShadow: "2px 0 0 #e6d7c3",
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-[#4a352f] break-words text-sm">{s.name}</span>
                          {s.verified && (
                            <BadgeCheck size={13} className="text-[#388E3C] flex-shrink-0" title="Verified supplier" />
                          )}
                          {incomplete && (
                            <AlertCircle
                              size={13}
                              className="text-[#F57C00] flex-shrink-0"
                              title="This profile is missing key details"
                            />
                          )}
                          <button
                            onClick={() => openDetails(s)}
                            className="text-[#a89482] hover:text-[#7d5a50] flex-shrink-0"
                            aria-label={`View ${s.name}`}
                            title="View supplier profile"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>

                      {orderedColumns.map((key) => renderCell(key, s, rowBg))}

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
                            onClick={() => (actions.kind === "quote" ? handleRequestQuote(s) : openDetails(s))}
                            disabled={busy}
                            title={actions.primary}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 disabled:opacity-60 ${
                              isTerminal ? "bg-[#e6d7c3]/60 text-[#a89482]" : "text-white hover:shadow-md hover:brightness-105"
                            }`}
                            style={{
                              width: `${Math.max(104, actionWidth - 82)}px`,
                              height: "34px",
                              backgroundColor: isTerminal ? undefined : "#7d5a50",
                            }}
                          >
                            {!isTerminal && !busy && <ArrowRight size={13} className="flex-shrink-0" />}
                            <span className="truncate">{busy ? "Working..." : actions.primary}</span>
                          </button>

                          <button
                            onClick={() => toggleSaved(s)}
                            title={isSaved ? "Remove from saved" : "Save match"}
                            aria-label={isSaved ? "Remove from saved" : "Save match"}
                            aria-pressed={isSaved}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-[#f5f0e1] flex-shrink-0"
                            style={{ color: isSaved ? "#a67c52" : "#c8b6a6" }}
                          >
                            <Bookmark size={14} fill={isSaved ? "#a67c52" : "none"} />
                          </button>

                          <button
                            onClick={(e) => openPopupFromEvent("quickActions", s, e)}
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
            {["match", "primaryMatch", "aiMatch"].includes(headerFilterOpen.type) &&
              (() => {
                const field =
                  headerFilterOpen.type === "match"
                    ? "matchRange"
                    : headerFilterOpen.type === "primaryMatch"
                      ? "primaryRange"
                      : "aiRange"
                const label =
                  headerFilterOpen.type === "match"
                    ? "Match %"
                    : headerFilterOpen.type === "primaryMatch"
                      ? "Structured Match %"
                      : "AI Match %"
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
                        thing. Match % only — the structured and AI bands mean
                        something different. */}
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
                    {headerFilterOpen.type === "aiMatch" && (
                      <p className="text-[11px] text-[#a89482] mt-2 mb-0">
                        Suppliers the AI hasn't scored yet are excluded while this filter is set.
                      </p>
                    )}
                  </>
                )
              })()}

            {headerFilterOpen.type === "dateMatched" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Date matched</label>
                  {(localFilters.matchedFrom || localFilters.matchedTo) && (
                    <button
                      onClick={() => setLocalFilters((p) => ({ ...p, matchedFrom: "", matchedTo: "" }))}
                      className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={localFilters.matchedFrom}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, matchedFrom: e.target.value }))}
                    className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                  />
                  <span className="text-[#7d5a50] text-xs">to</span>
                  <input
                    type="date"
                    value={localFilters.matchedTo}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, matchedTo: e.target.value }))}
                    className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                  />
                </div>
                <p className="text-[11px] text-[#a89482] mt-2 mb-0">
                  A supplier has no date until you view or contact them, so untouched matches are excluded here.
                </p>
              </>
            )}

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
              onClick={() => openDetails(activePopup.row)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Eye size={12} /> View Supplier
            </button>
            <button
              onClick={() => openPopup("match", activePopup.row, activePopup.rect)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Target size={12} /> Why This Match?
            </button>
            <button
              onClick={() => {
                const target = activePopup.row
                closePopup()
                toggleSaved(target)
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Bookmark size={12} fill={savedMatches[activePopup.row.id] ? "#a67c52" : "none"} />
              {savedMatches[activePopup.row.id] ? "Remove from Saved" : "Save Match"}
            </button>
            <button
              onClick={() => {
                const target = activePopup.row
                closePopup()
                handleSetStatus(target, "Shortlisted")
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Layers size={12} /> Add to Shortlist
            </button>
            <div className="border-t border-[#e6d7c3] my-1" />
            <button
              onClick={() => {
                const target = activePopup.row
                closePopup()
                handleRequestQuote(target)
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Send size={12} /> Request Quote
            </button>
            <button
              onClick={() => {
                const target = activePopup.row
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
                const target = activePopup.row
                closePopup()
                const url = `${window.location.origin}/supplier/${target.id}`
                if (navigator.clipboard) {
                  navigator.clipboard
                    .writeText(url)
                    .then(() => toast("success", "Supplier link copied.", 2000))
                    .catch(() => toast("error", "Could not copy the link.", 3000))
                }
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Share2 size={12} /> Copy Share Link
            </button>
            <div className="border-t border-[#e6d7c3] my-1" />
            <button
              onClick={() => {
                const target = activePopup.row
                closePopup()
                handleSetStatus(target, "Declined")
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#D32F2F] hover:bg-[#faf7f2] text-left"
            >
              <Flag size={12} /> Decline Supplier
            </button>
            <button
              onClick={async () => {
                const target = activePopup.row
                closePopup()
                try {
                  await writeRecord(target, { hidden: true })
                  toast("info", `${target.name} hidden from your matches.`)
                } catch (err) {
                  console.error("Could not hide the supplier:", err)
                  toast("error", "Could not hide that supplier.", 4000)
                }
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#D32F2F] hover:bg-[#faf7f2] text-left"
            >
              <EyeOff size={12} /> Hide Match
            </button>
          </div>
        </PopupPortal>
      )}

      {/* ─── Why this match? ───────────────────────────────────────────── */}
      {activePopup?.type === "match" && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div
            className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
            style={{
              top: activePopup.position.y,
              left: activePopup.position.x,
              width: "420px",
              maxHeight: "560px",
              overflowY: "auto",
            }}
          >
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Why this match?</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[260px]">{activePopup.row.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold">{activePopup.row.matchPercentage}%</div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {activePopup.row.aiMatchPercentage !== null ? (
                <div className="p-3 rounded-lg border border-[#e6d7c3] bg-[#f5f0e1] text-[11px] text-[#4a352f]">
                  Blended score: {activePopup.row.aiMatchPercentage}% from the AI reading their descriptions and{" "}
                  {activePopup.row.primaryMatchPercentage}% from the structured profile fields, weighted 60/40.
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-[#e6d7c3] bg-[#faf7f2] text-[11px] text-[#7d5a50]">
                  Structured fields only — run AI analysis to add a reading of their written descriptions.
                </div>
              )}

              {activePopup.row.aiReasoning && (
                <div className="p-3 rounded-lg border border-[#e6d7c3] bg-white text-[11px] text-[#4a352f]">
                  <p className="font-semibold m-0 mb-1 flex items-center gap-1.5">
                    <Brain size={12} /> AI reasoning
                  </p>
                  <p className="m-0 text-[#7d5a50] leading-relaxed">{activePopup.row.aiReasoning}</p>
                  {activePopup.row.aiCapabilities?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {activePopup.row.aiCapabilities.map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded-full bg-[#f5f0e1] text-[10px]">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activePopup.row.matchBreakdown &&
                Object.entries(activePopup.row.matchBreakdown).map(([key, c]) => {
                  const value = Math.round(typeof c === "object" ? c.score : c)
                  const color = value >= 75 ? "#22c55e" : value >= 50 ? "#f59e0b" : "#ef4444"
                  return (
                    <div key={key} className="p-3 rounded-lg border border-[#e6d7c3] bg-[#faf7f2] text-xs">
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <span className="font-semibold text-[#4a352f]">{CATEGORY_LABEL[key] || formatLabel(key)}</span>
                        <span className="font-bold flex-shrink-0" style={{ color }}>
                          {value}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
                      </div>
                      {typeof c === "object" && c.detail && (
                        <p className="text-[11px] text-[#7d5a50] m-0 mt-1.5">{c.detail}</p>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </PopupPortal>
      )}

      {/* Add note */}
      {mounted &&
        noteTarget &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4" onClick={() => setNoteTarget(null)}>
            <div className="bg-white rounded-2xl max-w-[420px] w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-semibold text-[#4a352f] m-0 mb-3">Add a note on {noteTarget.name}</h3>
              <textarea
                autoFocus
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="What should your team know about this supplier?"
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

      {mounted && detailsSupplier && (
        <SupplierDetailsModal
          supplier={detailsSupplier}
          isOpen
          onClose={() => setDetailsSupplier(null)}
          onRequestQuote={() => handleRequestQuote(detailsSupplier)}
        />
      )}
    </div>
  )
}

export default SupplierTable