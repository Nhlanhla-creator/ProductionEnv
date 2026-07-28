"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import {
  X,
  Eye,
  EyeOff,
  HelpCircle,
  FileText,
  Send,
  Calendar,
  Check,
  Download,
  FileIcon,
  Target,
  Flag,
  StickyNote,
  Share2,
  Layers,
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
  Briefcase,
} from "lucide-react"
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  getDocs,
  getDoc,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore"
import { onAuthStateChanged, getAuth } from "firebase/auth"
import { db } from "../../firebaseConfig"
import { DayPicker } from "react-day-picker"
// Was "react-day-picker/dist/style.module.css" — that path doesn't exist in
// the package and fails to resolve at build time.
import "react-day-picker/dist/style.css"
import CustomerDetailsModal from "./CustomerDetailsModal"

/* ════════════════════════════════════════════════════════════════════════════
   This file no longer imports ./matchTableKit.

   The kit rendered the header row, and its own <style> block set
   `position: relative` on every <th>, which overrode the sticky positioning.
   The header scrolled away while the pinned body cells stayed frozen —
   customer names sliding over the next column, and the ACTION label drifting
   away from its buttons. The table now owns its head, toolbar, filters and
   row actions, identical to the intern, advisor and funding tables.
   ════════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════════════
   NAMING NOTE — worth resolving before this ships.

   Rows come from `supplierApplications` filtered by `customerId`, but each row
   stores the counterparty under `supplierName` / `supplierId` / `supplierLocation`
   while `getCustomerEconomicSectors` reads `customerId`, and `handleViewDetails`
   looks up `supplierId` and feeds it to CustomerDetailsModal as the customer.
   One record is describing both sides with the wrong labels.

   This file treats the counterparty as the customer (which is what the UI
   claims) and reads it from the `supplier*` fields, because that's where the
   data actually is. Renaming the fields is a migration, not a UI change.
   ════════════════════════════════════════════════════════════════════════ */

/* ─── Status vocabulary (spec section 3) ────────────────────────────────── */
export const CUSTOMER_STATUSES = [
  "New Match",
  "Viewed",
  "Shortlisted",
  "Contacted",
  "Application Started",
  "Applied",
  "Under Review",
  "Accepted",
  "Declined",
  "Closed",
]

const LEGACY_STATUS_ALIASES = {
  Pending: "New Match",
  Reviewed: "Under Review",
  "Proposal/Quote": "Applied",
  "Proposal Sent": "Applied",
  "In Progress": "Accepted",
  Completed: "Closed",
  Rejected: "Declined",
}
export const normalizeCustomerStatus = (s) => LEGACY_STATUS_ALIASES[s] || s || "New Match"

const STATUS_TYPES = {
  "New Match": { color: "#F5F0E1", textColor: "#7D5A50" },
  Viewed: { color: "#EFEBE9", textColor: "#5D4037" },
  Shortlisted: { color: "#FFF3E0", textColor: "#F57C00" },
  Contacted: { color: "#E8EAF6", textColor: "#3949AB" },
  "Application Started": { color: "#E1F5FE", textColor: "#0277BD" },
  Applied: { color: "#E3F2FD", textColor: "#1565C0" },
  "Under Review": { color: "#F3E5F5", textColor: "#7B1FA2" },
  Accepted: { color: "#E8F5E8", textColor: "#388E3C" },
  Declined: { color: "#FFEBEE", textColor: "#D32F2F" },
  Closed: { color: "#EEEEEE", textColor: "#616161" },
}
const getStatusStyle = (s) => STATUS_TYPES[s] || { color: "#F5F5F5", textColor: "#666666" }

/* One primary action per row; everything else lives in the three-dot quick
   actions popup, matching the other match tables. */
const getRowActions = (status) => {
  switch (status) {
    case "New Match":
    case "Viewed":
      return { primary: "Shortlist", kind: "shortlist" }
    case "Shortlisted":
      return { primary: "Send Proposal", kind: "proposal" }
    case "Application Started":
      return { primary: "Continue Application", kind: "proposal" }
    case "Contacted":
    case "Applied":
      return { primary: "View Application", kind: "view" }
    case "Under Review":
      return { primary: "View Status", kind: "view" }
    case "Accepted":
      return { primary: "View Next Steps", kind: "view" }
    case "Declined":
    case "Closed":
      return { primary: "View Outcome", kind: "view" }
    default:
      return { primary: "View Opportunity", kind: "view" }
  }
}

const OPPORTUNITY_TYPES = ["RFQ", "RFP", "Tender", "Purchase Order", "Framework Agreement", "Direct Award", "Other"]

/* ─── Shared helpers (previously imported from the kit) ──────────────────── */
const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
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
   Section A column configuration.

   Customer is the pinned first column and Action the last, so neither appears
   here. The six above the divider are the spec default view; everything below
   is a spec "hidden by default" column.

   Widths raised in line with the other match tables — each header carries a
   grip, sort and filter control (~60px of chrome), so the old 120–150px
   columns left too little room and the browser broke labels mid-word
   ("MAT CH..", "STA TUS").
   ════════════════════════════════════════════════════════════════════════ */
const COLUMN_DEFS = {
  match: { label: "Match %", align: "center", width: 136, filterType: "match", visible: true, priority: 1, sortable: true },
  productService: { label: "Product or Service Required", width: 210, filterType: "productService", visible: true, priority: 2, sortable: true },
  opportunityType: { label: "Opportunity Type", width: 158, filterType: "opportunityType", visible: true, priority: 3, sortable: true },
  estimatedValue: { label: "Estimated Value / Range", width: 178, filterType: "estimatedValue", visible: true, priority: 2, sortable: true },
  closingDate: { label: "Closing Date", width: 148, filterType: "closingDate", visible: true, priority: 2, sortable: true },
  status: { label: "Status", width: 144, filterType: "status", visible: true, priority: 1, sortable: true },

  customerSector: { label: "Customer Sector", width: 166, filterType: "customerSector", visible: false, priority: 4, sortable: true },
  deliveryLocation: { label: "Delivery Location", width: 160, filterType: "deliveryLocation", visible: false, priority: 4, sortable: true },
  contractDuration: { label: "Contract Duration", width: 160, filterType: "contractDuration", visible: false, priority: 4, sortable: true },
  paymentTerms: { label: "Payment Terms", width: 154, filterType: "paymentTerms", visible: false, priority: 4, sortable: true },
  minimumRequirements: { label: "Minimum Requirements", width: 190, filterType: "minimumRequirements", visible: false, priority: 4, sortable: false },
  bbbeeRequirement: { label: "B-BBEE Requirement", width: 168, filterType: "bbbeeRequirement", visible: false, priority: 4, sortable: true },
  complianceRequirements: { label: "Compliance Requirements", width: 196, filterType: "complianceRequirements", visible: false, priority: 4, sortable: false },
  contactPerson: { label: "Contact Person", width: 156, filterType: "contactPerson", visible: false, priority: 4, sortable: true },
  deliveryTurnaround: { label: "Delivery Turnaround", width: 166, filterType: "deliveryTurnaround", visible: false, priority: 4, sortable: true },
  customerType: { label: "Customer Type", width: 150, filterType: "customerType", visible: false, priority: 4, sortable: true },
  documents: { label: "Documents", align: "center", width: 132, filterType: "documents", visible: false, priority: 4, sortable: true },
  dateMatched: { label: "Date Matched", width: 148, filterType: null, visible: false, priority: 4, sortable: true },
  lastActivity: { label: "Last Activity", width: 148, filterType: null, visible: false, priority: 4, sortable: true },
  nextStage: { label: "Next Stage", width: 142, filterType: "nextStage", visible: false, priority: 4, sortable: false },
}

const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS)
const DEFAULT_COLUMN_VISIBILITY = Object.fromEntries(
  DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].visible !== false]),
)
const DEFAULT_COLUMN_WIDTHS = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].width]))
const DEFAULT_PINNED = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, null]))
const DEFAULT_DENSITY = "comfortable"

const CUSTOMER_WIDTH = 230
const ACTION_WIDTH = 208
const MIN_COLUMN_WIDTH = 84

const EMPTY_FILTERS = {
  name: "",
  matchRange: [0, 100],
  productService: "",
  opportunityType: [],
  estimatedValue: "",
  closingFrom: "",
  closingTo: "",
  status: [],
  customerSector: [],
  deliveryLocation: "",
  contractDuration: "",
  paymentTerms: "",
  minimumRequirements: "",
  bbbeeRequirement: [],
  complianceRequirements: "",
  contactPerson: "",
  deliveryTurnaround: "",
  customerType: [],
  documents: [],
  nextStage: [],
}

/* ─── Saved views + filter persistence ──────────────────────────────────── */
const BUILTIN_VIEW_ID = "__default__"
// v2: the stored widths from the kit version are the narrow ones that caused
// the mid-word header breaks, so old saved views fall back to the new defaults.
const VIEWS_STORAGE_KEY = "customer-matches-views-v2"
const FILTERS_STORAGE_KEY = "customer-matches-filters-v1"

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

const DOCUMENT_BUCKETS = ["Has documents", "No documents"]
const BBBEE_LEVELS = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6", "Level 7", "Level 8", "Non-compliant"]

const NEXT_STAGE_BY_STATUS = {
  "New Match": "Viewed",
  Viewed: "Shortlisted",
  Shortlisted: "Contacted",
  Contacted: "Application Started",
  "Application Started": "Applied",
  Applied: "Under Review",
  "Under Review": "Accepted",
  Accepted: "Closed",
  Declined: "—",
  Closed: "—",
}

/* ─── Matching criteria (unchanged weights) ─────────────────────────────── */
const MATCHING_CRITERIA = {
  CATEGORY_MATCH: { weight: 0.4, description: "Product/Service Category Alignment" },
  BBBEE_LEVEL: { weight: 0.1, description: "B-BBEE Level Compliance" },
  LOCATION: { weight: 0.1, description: "Geographic Location Match" },
  DELIVERY_MODE: { weight: 0.1, description: "Delivery Mode Compatibility" },
  BUDGET_RANGE: { weight: 0.1, description: "Budget Fit" },
  OWNERSHIP_PREFS: { weight: 0.05, description: "Ownership Preferences Match" },
  URGENCY_LEAD_TIME: { weight: 0.05, description: "Urgency & Lead Time Match" },
  EXPERIENCE: { weight: 0.05, description: "Sector Experience Match" },
  RATING: { weight: 0.05, description: "Supplier Rating" },
}

const calculateOwnershipPercentages = (ownershipManagement = {}) => {
  const result = { blackOwnership: 0, womenOwnership: 0, youthOwnership: 0, disabilityOwnership: 0, totalShares: 0 }
  const shareholders = Array.isArray(ownershipManagement.shareholders) ? ownershipManagement.shareholders : []

  shareholders.forEach((s) => {
    const shares = Number.parseInt(s.shareholding || "0", 10) || 0
    result.totalShares += shares
    if (s.race?.toLowerCase() === "black") result.blackOwnership += shares
    if (s.gender?.toLowerCase() === "female") result.womenOwnership += shares
    if (s.isYouth === true) result.youthOwnership += shares
    if (s.isDisabled === true) result.disabilityOwnership += shares
  })

  const directors = Array.isArray(ownershipManagement.directors) ? ownershipManagement.directors : []

  if (result.totalShares === 0 && directors.length > 0) {
    const pct = (fn) => (directors.filter(fn).length / directors.length) * 100 * 0.7
    result.blackOwnership = pct((d) => d.race?.toLowerCase() === "black")
    result.womenOwnership = pct((d) => d.gender?.toLowerCase() === "female")
    result.youthOwnership = pct((d) => d.isYouth === true)
    result.disabilityOwnership = pct((d) => d.isDisabled === true)
  } else if (result.totalShares > 0) {
    ;["blackOwnership", "womenOwnership", "youthOwnership", "disabilityOwnership"].forEach((k) => {
      result[k] = (result[k] / result.totalShares) * 100
    })
  }

  return result
}

export const calculateMatchScore = (application, supplier, ratingsData = {}) => {
  if (!application || !supplier) return { totalScore: 0, breakdown: {} }

  let totalScore = 0
  const breakdown = {}

  const extractSupplierText = (sup) => {
    let text = ""
    sup.productsServices?.productCategories?.forEach((cat) => {
      text += ` ${cat.name || ""} `
      cat.products?.forEach((p) => {
        text += ` ${p.name || ""} ${p.description || ""} `
      })
    })
    sup.productsServices?.serviceCategories?.forEach((cat) => {
      text += ` ${cat.name || ""} `
      cat.services?.forEach((s) => {
        text += ` ${s.name || ""} ${s.description || ""} `
      })
    })
    text += ` ${sup.productsServices?.targetMarket || ""} `
    return text.toLowerCase().trim()
  }

  // 1. Category (40%)
  const appCategories = (
    application.productsServices?.categories ||
    application.requestOverview?.categories ||
    application.productsServices?.productCategories ||
    []
  )
    .map((c) => (typeof c === "string" ? c : c?.name || "").toLowerCase().trim())
    .filter(Boolean)

  const appKeywords = application.requestOverview?.keywords?.toLowerCase() || ""
  const appPurpose = application.requestOverview?.purpose?.toLowerCase() || ""
  const supplierText = extractSupplierText(supplier)

  const matched = appCategories.filter((c) => supplierText.includes(c))
  const unmatched = appCategories.filter((c) => !supplierText.includes(c))
  const catScore = appCategories.length > 0 ? matched.length / appCategories.length : 0

  let kwScore = 0
  if (appKeywords || appPurpose) {
    const words = `${appKeywords} ${appPurpose}`.split(/\s+/).filter((w) => w.length > 3)
    kwScore = words.length > 0 ? words.filter((w) => supplierText.includes(w)).length / words.length : 0
  }

  const categoryScore = appCategories.length > 0 ? catScore * 0.7 + kwScore * 0.3 : kwScore
  const categoryContribution = Math.min(categoryScore, 1) * MATCHING_CRITERIA.CATEGORY_MATCH.weight * 100
  totalScore += categoryContribution
  breakdown.categoryMatch = {
    score: Math.round(Math.min(categoryScore, 1) * 100),
    weight: MATCHING_CRITERIA.CATEGORY_MATCH.weight * 100,
    contribution: Math.round(categoryContribution),
    description: MATCHING_CRITERIA.CATEGORY_MATCH.description,
    matches: matched,
    unmatched,
  }

  // 2. B-BBEE (10%)
  const appBBBEE =
    Number.parseInt(
      (application.matchingPreferences?.bbeeLevel || application.requestOverview?.bbeeLevel || "0").replace(/\D/g, ""),
      10,
    ) || 0
  const supplierBBBEE = Number.parseInt(supplier.legalCompliance?.bbbeeLevel || "0", 10) || 0
  let bbbeeScore = 0.5
  if (appBBBEE > 0) bbbeeScore = supplierBBBEE <= appBBBEE ? 1 : supplierBBBEE === appBBBEE + 1 ? 0.5 : 0
  const bbbeeContribution = bbbeeScore * MATCHING_CRITERIA.BBBEE_LEVEL.weight * 100
  totalScore += bbbeeContribution
  breakdown.bbbeeMatch = {
    score: Math.round(bbbeeScore * 100),
    weight: MATCHING_CRITERIA.BBBEE_LEVEL.weight * 100,
    contribution: Math.round(bbbeeContribution),
    description: MATCHING_CRITERIA.BBBEE_LEVEL.description,
  }

  // 3. Location (10%)
  const appLoc = (application.matchingPreferences?.location || application.requestOverview?.location || "").toLowerCase().trim()
  const supLoc = (supplier.entityOverview?.location || "").toLowerCase().trim()
  let locationScore = 0.5
  if (appLoc) {
    if (!supLoc) locationScore = 0
    else if (appLoc === supLoc) locationScore = 1
    else if (supLoc.includes(appLoc) || appLoc.includes(supLoc)) locationScore = 0.7
    else locationScore = 0
  }
  const locationContribution = locationScore * MATCHING_CRITERIA.LOCATION.weight * 100
  totalScore += locationContribution
  breakdown.locationMatch = {
    score: Math.round(locationScore * 100),
    weight: MATCHING_CRITERIA.LOCATION.weight * 100,
    contribution: Math.round(locationContribution),
    description: MATCHING_CRITERIA.LOCATION.description,
  }

  // 4. Delivery mode (10%)
  const appModes = application.matchingPreferences?.deliveryModes || application.requestOverview?.deliveryModes || []
  const supModes = supplier.productsServices?.deliveryModes || []
  let deliveryScore = 0.5
  if (appModes.length > 0) {
    if (supModes.length === 0) deliveryScore = 0
    else if (appModes.includes("Hybrid") || supModes.includes("Hybrid")) deliveryScore = 1
    else deliveryScore = appModes.filter((m) => supModes.includes(m)).length / appModes.length
  }
  const deliveryContribution = deliveryScore * MATCHING_CRITERIA.DELIVERY_MODE.weight * 100
  totalScore += deliveryContribution
  breakdown.deliveryMatch = {
    score: Math.round(deliveryScore * 100),
    weight: MATCHING_CRITERIA.DELIVERY_MODE.weight * 100,
    contribution: Math.round(deliveryContribution),
    description: MATCHING_CRITERIA.DELIVERY_MODE.description,
  }

  // 5. Budget (10%)
  const appBudgetMin =
    Number.parseInt((application.matchingPreferences?.minBudget || application.requestOverview?.minBudget || "0").replace(/\D/g, ""), 10) || 0
  const appBudgetMax =
    Number.parseInt((application.matchingPreferences?.maxBudget || application.requestOverview?.maxBudget || "0").replace(/\D/g, ""), 10) || 1000000
  const revenue = Number.parseInt((supplier.financialOverview?.annualRevenue || "0").toString().replace(/\D/g, ""), 10) || 0
  let budgetScore = 0.5
  if (revenue > 0) {
    if (revenue >= appBudgetMin && revenue <= appBudgetMax) budgetScore = 1
    else if (revenue >= appBudgetMin * 0.5 && revenue <= appBudgetMax * 1.5) budgetScore = 0.7
    else budgetScore = 0.3
  }
  const budgetContribution = budgetScore * MATCHING_CRITERIA.BUDGET_RANGE.weight * 100
  totalScore += budgetContribution
  breakdown.budgetMatch = {
    score: Math.round(budgetScore * 100),
    weight: MATCHING_CRITERIA.BUDGET_RANGE.weight * 100,
    contribution: Math.round(budgetContribution),
    description: MATCHING_CRITERIA.BUDGET_RANGE.description,
  }

  // 6. Ownership (5%)
  const prefs = application.matchingPreferences?.ownershipPrefs || []
  let ownershipScore = 0.5
  if (prefs.length > 0) {
    const o = calculateOwnershipPercentages(supplier.ownershipManagement || {})
    ownershipScore = 0
    prefs.forEach((pref) => {
      const p = pref.toLowerCase().trim()
      if (p.includes("black") && o.blackOwnership >= 51) ownershipScore += 0.4
      else if (p.includes("women") && o.womenOwnership >= 30) ownershipScore += 0.3
      else if (p.includes("youth") && o.youthOwnership >= 25) ownershipScore += 0.2
      else if ((p.includes("disability") || p.includes("disabled")) && o.disabilityOwnership >= 5) ownershipScore += 0.1
    })
    ownershipScore = Math.min(ownershipScore, 1)
  }
  const ownershipContribution = ownershipScore * MATCHING_CRITERIA.OWNERSHIP_PREFS.weight * 100
  totalScore += ownershipContribution
  breakdown.ownershipMatch = {
    score: Math.round(ownershipScore * 100),
    weight: MATCHING_CRITERIA.OWNERSHIP_PREFS.weight * 100,
    contribution: Math.round(ownershipContribution),
    description: MATCHING_CRITERIA.OWNERSHIP_PREFS.description,
  }

  // 7 & 8 are placeholders until lead-time and sector-experience data is captured.
  ;[
    ["urgencyLeadTimeMatch", MATCHING_CRITERIA.URGENCY_LEAD_TIME],
    ["experienceMatch", MATCHING_CRITERIA.EXPERIENCE],
  ].forEach(([key, criteria]) => {
    const contribution = 0.5 * criteria.weight * 100
    totalScore += contribution
    breakdown[key] = {
      score: 50,
      weight: criteria.weight * 100,
      contribution: Math.round(contribution),
      description: `${criteria.description} (estimated — source data not captured yet)`,
      estimated: true,
    }
  })

  // 9. Rating (5%)
  const ratingData = ratingsData[supplier?.id] || { average: 0, count: 0 }
  const ratingScore = (ratingData.average || 0) / 5
  const ratingContribution = ratingScore * MATCHING_CRITERIA.RATING.weight * 100
  totalScore += ratingContribution
  breakdown.ratingMatch = {
    score: Math.round(ratingScore * 100),
    weight: MATCHING_CRITERIA.RATING.weight * 100,
    contribution: Math.round(ratingContribution),
    description: MATCHING_CRITERIA.RATING.description,
    actualRating: ratingData.average || 0,
    ratingCount: ratingData.count || 0,
  }

  return { totalScore: Math.round(totalScore), breakdown }
}

const IMPROVEMENT_SUGGESTIONS = {
  categoryMatch: "Expand your service categories or highlight subcategories that align with what this customer needs.",
  bbbeeMatch: "Improve your B-BBEE certification level to meet this customer's transformation requirements.",
  locationMatch: "Expand your service delivery areas, or highlight remote delivery capability.",
  deliveryMatch: "Add delivery modes (on-site, remote, hybrid) to match customer preferences.",
  budgetMatch: "Adjust pricing tiers so your offering fits this budget band.",
  ownershipMatch: "Make your ownership demographics and transformation credentials more prominent.",
  urgencyLeadTimeMatch: "Shorten quoted lead times or state your capacity for urgent work.",
  experienceMatch: "Add sector case studies and references to your profile.",
  ratingMatch: "Collect more customer reviews to lift your rating.",
}

/* ════════════════════════════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════════════════════════ */
export function CustomerTable({ stageFilter, onCountChange }) {
  const [applications, setApplications] = useState([])
  const [universalProfiles, setUniversalProfiles] = useState([])
  const [supplierRatings, setSupplierRatings] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [notification, setNotification] = useState(null)
  const [currentCustomerId, setCurrentCustomerId] = useState(null)
  const [authResolved, setAuthResolved] = useState(false)

  const [selectedApplication, setSelectedApplication] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [showShortlistModal, setShowShortlistModal] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)

  const [proposalFile, setProposalFile] = useState(null)
  const [proposalMessage, setProposalMessage] = useState("")
  const [meetingPurpose, setMeetingPurpose] = useState("")
  const [meetingLocation, setMeetingLocation] = useState("")
  const [availabilities, setAvailabilities] = useState([])
  const [tempDates, setTempDates] = useState([])
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" })
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [savedMatches, setSavedMatches] = useState({})
  const [hiddenMatches, setHiddenMatches] = useState({})
  const [hoveredRow, setHoveredRow] = useState(null)

  /* Popups — anchored popovers portaled to <body>, same pattern as the other
     match tables. { type, row, position:{x,y}, rect } */
  const [activePopup, setActivePopup] = useState(null)

  // Filters + sort, restored from the last visit
  const initialFilterState = useMemo(() => loadFilterState(), [])
  const [localFilters, setLocalFilters] = useState(initialFilterState.filters)
  const [sortConfig, setSortConfig] = useState(initialFilterState.sort)
  const [headerFilterOpen, setHeaderFilterOpen] = useState(null)

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

  // Viewport, for responsive column collapse
  const [viewportWidth, setViewportWidth] = useState(typeof window === "undefined" ? 1440 : window.innerWidth)
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentCustomerId(user ? user.uid : null)
      setAuthResolved(true)
      if (!user) setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  /* ─── Reference data. Fetched once per customer rather than inside the
     applications listener, where a full scan of universalProfiles and
     supplierReviews was re-running on every single snapshot change. ───── */
  useEffect(() => {
    if (!currentCustomerId) return

    let cancelled = false
    const loadReferenceData = async () => {
      try {
        const [profilesSnap, reviewsSnap] = await Promise.all([
          getDocs(collection(db, "universalProfiles")),
          getDocs(collection(db, "supplierReviews")),
        ])

        if (cancelled) return

        setUniversalProfiles(profilesSnap.docs.map((d) => ({ id: d.id, ...d.data() })))

        const grouped = {}
        reviewsSnap.forEach((d) => {
          const data = d.data()
          const key = data.supplierId
          if (!key) return
          if (!grouped[key]) grouped[key] = []
          grouped[key].push(data.rating || 0)
        })

        const averages = {}
        Object.entries(grouped).forEach(([id, ratings]) => {
          averages[id] = {
            average: ratings.reduce((s, r) => s + r, 0) / ratings.length,
            count: ratings.length,
          }
        })
        setSupplierRatings(averages)
      } catch (err) {
        console.error("Error loading reference data:", err)
      }
    }

    loadReferenceData()
    return () => {
      cancelled = true
    }
  }, [currentCustomerId])

  /* ─── Applications ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!authResolved) return
    if (!currentCustomerId) {
      setApplications([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = onSnapshot(
      query(collection(db, "supplierApplications"), where("customerId", "==", currentCustomerId)),
      (snapshot) => {
        const rows = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data()
          const req = data.originalRequest || {}
          const budget = req.budgetRange || {}
          const min = Number.parseInt((budget.min || "0").toString().replace(/\D/g, ""), 10) || 0
          const max = Number.parseInt((budget.max || "0").toString().replace(/\D/g, ""), 10) || 0

          return {
            id: docSnapshot.id,
            ...data,
            customerName: data.supplierName || "Unnamed customer",
            counterpartyId: data.supplierId,
            opportunityTitle: req.title || req.purpose || null,
            productService: req.purpose || req.serviceRequested || "Not specified",
            opportunityType: req.opportunityType || data.opportunityType || "Not specified",
            estimatedValueMin: min,
            estimatedValueMax: max,
            estimatedValue:
              min > 0 || max > 0 ? `R${min.toLocaleString()} - R${max.toLocaleString()}` : "Not specified",
            closingDate: req.closingDate || req.deadline || data.closingDate || null,
            deliveryLocation: req.location || data.supplierLocation || "Not specified",
            contractDuration: req.contractDuration || "Not specified",
            paymentTerms: req.paymentTerms || "Not specified",
            minimumRequirements: req.minimumRequirements || "Not specified",
            bbbeeRequirement: req.bbeeLevel ? `Level ${req.bbeeLevel}` : "Not specified",
            complianceRequirements: req.complianceRequirements || "Not specified",
            contactPerson: data.contactPerson || req.contactPerson || "Not specified",
            deliveryTurnaround: req.deliveryTurnaround || "Not specified",
            customerType: data.customerType || "Not specified",
            documentCount: Array.isArray(data.applicationData?.documents) ? data.applicationData.documents.length : 0,
            status: normalizeCustomerStatus(data.status),
            rawStatus: data.status,
            currentStage: data.currentStage || null,
            matchPercentage: data.matchPercentage ?? 0,
            matchDetails: data.matchBreakdown?.breakdown || null,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : null,
            lastActivity: data.lastActivity || data.updatedAt?.toDate?.() || null,
          }
        })

        setApplications(rows)
        setLoading(false)
      },
      (err) => {
        console.error("Error listening to applications:", err)
        setError("Failed to load opportunities")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [authResolved, currentCustomerId])

  const customerSectorsFor = useCallback(
    (row) => {
      const profile = universalProfiles.find((p) => p.id === row.counterpartyId || p.id === row.customerId)
      return profile?.entityOverview?.economicSectors || []
    },
    [universalProfiles],
  )

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

  const notify = useCallback((type, message, ms = 3000) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), ms)
  }, [])

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

  /* ─── Header filter + sort ──────────────────────────────────────────── */
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

  /* ─── Popups ────────────────────────────────────────────────────────── */
  const openPopup = (type, row, rect) => {
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

    setActivePopup({ type, row, position: { x, y }, rect })
  }

  const openPopupFromEvent = (type, row, event) => {
    event.stopPropagation()
    openPopup(type, row, event.currentTarget.getBoundingClientRect())
  }

  const closePopup = () => setActivePopup(null)

  /* ─── Actions ───────────────────────────────────────────────────────── */
  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await updateDoc(doc(db, "supplierApplications", applicationId), {
        status: newStatus,
        nextStage: NEXT_STAGE_BY_STATUS[newStatus] || "—",
        updatedAt: serverTimestamp(),
        updatedBy: currentCustomerId,
      })
      notify("success", `Status updated to ${newStatus}`)
      return true
    } catch (err) {
      console.error("Error updating status:", err)
      notify("error", `Failed to update status: ${err.message}`, 4000)
      return false
    }
  }

  const handleViewDetails = (row) => {
    setActivePopup(null)
    const profile = universalProfiles.find((p) => p.id === row.counterpartyId)
    setSelectedCustomer({
      ...row,
      entityOverview: profile?.entityOverview || {},
      productsServices: profile?.productsServices || {},
      legalCompliance: profile?.legalCompliance || {},
      financialOverview: profile?.financialOverview || {},
      ownershipManagement: profile?.ownershipManagement || {},
      contactDetails: profile?.contactDetails || {},
      documents: profile?.documents || {},
      applicationOverview: profile?.applicationOverview || {},
    })
  }

  const handleOpenShortlist = (row) => {
    setActivePopup(null)
    setSelectedApplication(row)
    setMeetingPurpose(`Meeting with ${row.customerName}`)
    setMeetingLocation("Virtual Meeting")
    setAvailabilities([])
    setFormErrors({})
    setShowShortlistModal(true)
  }

  const handleOpenProposal = (row) => {
    setActivePopup(null)
    setSelectedApplication(row)
    setProposalFile(null)
    setProposalMessage("")
    setShowProposalModal(true)
  }

  /* Single write path. The old flow created a supplier event and an SME event
     when the modal opened, then created a second pair when it was confirmed —
     every shortlist produced four calendar documents. */
  const handleConfirmShortlist = async () => {
    const errors = {}
    if (!meetingPurpose.trim()) errors.meetingPurpose = "Please provide a meeting purpose"
    if (!meetingLocation.trim()) errors.meetingLocation = "Please provide a meeting location"
    if (availabilities.length === 0) errors.availabilities = "Select at least one available date"
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const availableDates = availabilities.map((a) => ({
        date: a.date.toISOString(),
        timeSlots: a.timeSlots,
        timeZone: a.timeZone,
        status: "available",
      }))

      const meetingData = {
        title: meetingPurpose,
        purpose: meetingPurpose,
        location: meetingLocation,
        availableDates,
        type: "meeting",
        status: "pending",
        createdAt: serverTimestamp(),
        smeAppId: selectedApplication.id,
      }

      const supplierEventRef = await addDoc(collection(db, "supplierCalendarEvents"), {
        ...meetingData,
        supplierId: selectedApplication.counterpartyId,
        customerId: currentCustomerId,
      })

      await addDoc(collection(db, "smeCalendarEvents"), {
        ...meetingData,
        smeId: selectedApplication.counterpartyId,
        funderId: currentCustomerId,
        supplierEventId: supplierEventRef.id,
      })

      await updateDoc(doc(db, "supplierApplications", selectedApplication.id), {
        status: "Shortlisted",
        nextStage: NEXT_STAGE_BY_STATUS.Shortlisted,
        meetingDetails: { purpose: meetingPurpose, location: meetingLocation, availableDates },
        calendarEventId: supplierEventRef.id,
        updatedAt: serverTimestamp(),
      })

      await addDoc(collection(db, "notifications"), {
        recipientId: selectedApplication.counterpartyId,
        senderId: currentCustomerId,
        type: "meeting_invitation",
        title: "Meeting invitation",
        message: `A meeting has been proposed regarding your opportunity`,
        read: false,
        createdAt: serverTimestamp(),
        applicationId: selectedApplication.id,
      })

      notify("success", "Shortlisted and meeting proposed")
      setShowShortlistModal(false)
    } catch (err) {
      console.error("Error shortlisting:", err)
      notify("error", `Failed to shortlist: ${err.message}`, 4000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendProposal = async () => {
    if (!proposalFile || !selectedApplication) return
    setIsSubmitting(true)

    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) throw new Error("User not authenticated")

      /* The file is not uploaded anywhere — the original code built an
         attachment object with url: "" and a TODO. Until Storage upload is
         wired, say so rather than silently sending an empty link. */
      const attachment = {
        name: proposalFile.name,
        type: proposalFile.type,
        size: proposalFile.size,
        url: "",
        pendingUpload: true,
      }

      // One write, not two.
      await updateDoc(doc(db, "supplierApplications", selectedApplication.id), {
        status: "Applied",
        currentStage: "Proposal Sent",
        nextStage: NEXT_STAGE_BY_STATUS.Applied,
        updatedAt: serverTimestamp(),
        proposalSentAt: serverTimestamp(),
      })

      const baseMessage = {
        from: user.uid,
        to: selectedApplication.counterpartyId,
        toName: selectedApplication.customerName,
        subject: "Proposal / quote for your opportunity",
        content: proposalMessage || "Please find our proposal for your opportunity attached.",
        attachments: [attachment],
        date: new Date().toISOString(),
        applicationId: selectedApplication.id,
      }

      await Promise.all([
        addDoc(collection(db, "messages"), { ...baseMessage, read: false, type: "inbox" }),
        addDoc(collection(db, "messages"), { ...baseMessage, read: true, type: "sent" }),
      ])

      notify("success", `Proposal sent to ${selectedApplication.customerName}`)
      setShowProposalModal(false)
      setProposalFile(null)
      setProposalMessage("")
    } catch (err) {
      console.error("Error sending proposal:", err)
      notify("error", `Failed to send proposal: ${err.message}`, 4000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveSelectedDates = () => {
    setAvailabilities((prev) => [
      ...prev,
      ...tempDates
        .filter((d) => !prev.some((a) => a.date.getTime() === d.getTime()))
        .map((date) => ({ date, timeSlots: [{ ...timeSlot }], timeZone, status: "available" })),
    ])
    setTempDates([])
    setShowCalendarModal(false)
  }

  /* ─── Derived options ───────────────────────────────────────────────── */
  const uniqueOf = useCallback(
    (accessor) => [...new Set(applications.map(accessor).filter((v) => v && v !== "Not specified"))].sort(),
    [applications],
  )
  const opportunityTypeOptions = useMemo(() => {
    const fromData = uniqueOf((a) => a.opportunityType)
    return [...new Set([...OPPORTUNITY_TYPES, ...fromData])]
  }, [uniqueOf])
  const customerTypeOptions = useMemo(() => uniqueOf((a) => a.customerType), [uniqueOf])
  const sectorOptions = useMemo(
    () => [...new Set(applications.flatMap((a) => customerSectorsFor(a)).filter(Boolean))].sort(),
    [applications, customerSectorsFor],
  )

  /* ─── Filtering + sorting ───────────────────────────────────────────── */
  const filteredApplications = useMemo(() => {
    const f = localFilters
    const matchesAny = (selected, value) =>
      selected.length === 0 || selected.some((v) => (value || "").toLowerCase().includes(v.toLowerCase()))
    const includesText = (needle, value) =>
      !needle.trim() || (value || "").toString().toLowerCase().includes(needle.toLowerCase().trim())

    const rows = applications.filter((a) => {
      if (hiddenMatches[a.id]) return false
      if (stageFilter && a.status !== stageFilter) return false

      if (!includesText(f.name, `${a.customerName} ${a.opportunityTitle || ""}`)) return false
      if (a.matchPercentage < f.matchRange[0] || a.matchPercentage > f.matchRange[1]) return false
      if (!includesText(f.productService, a.productService)) return false
      if (!matchesAny(f.opportunityType, a.opportunityType)) return false
      if (!includesText(f.estimatedValue, a.estimatedValue)) return false
      if (f.status.length > 0 && !f.status.includes(a.status)) return false

      const closing = toISODateOnly(a.closingDate)
      if (f.closingFrom && (!closing || closing < f.closingFrom)) return false
      if (f.closingTo && (!closing || closing > f.closingTo)) return false

      if (f.customerSector.length > 0) {
        const sectors = customerSectorsFor(a)
        if (!f.customerSector.some((s) => sectors.includes(s))) return false
      }
      if (!includesText(f.deliveryLocation, a.deliveryLocation)) return false
      if (!includesText(f.contractDuration, a.contractDuration)) return false
      if (!includesText(f.paymentTerms, a.paymentTerms)) return false
      if (!includesText(f.minimumRequirements, a.minimumRequirements)) return false
      if (!matchesAny(f.bbbeeRequirement, a.bbbeeRequirement)) return false
      if (!includesText(f.complianceRequirements, a.complianceRequirements)) return false
      if (!includesText(f.contactPerson, a.contactPerson)) return false
      if (!includesText(f.deliveryTurnaround, a.deliveryTurnaround)) return false
      if (!matchesAny(f.customerType, a.customerType)) return false
      if (f.documents.length > 0) {
        const bucket = a.documentCount > 0 ? "Has documents" : "No documents"
        if (!f.documents.includes(bucket)) return false
      }
      if (f.nextStage.length > 0 && !f.nextStage.includes(NEXT_STAGE_BY_STATUS[a.status])) return false

      return true
    })

    if (sortConfig?.key) {
      const accessors = {
        name: (r) => r.customerName,
        match: (r) => r.matchPercentage || 0,
        productService: (r) => r.productService,
        opportunityType: (r) => r.opportunityType,
        estimatedValue: (r) => r.estimatedValueMax || r.estimatedValueMin || 0,
        closingDate: (r) => toDateSafe(r.closingDate)?.getTime() ?? 0,
        status: (r) => r.status,
        customerSector: (r) => customerSectorsFor(r).join(", "),
        deliveryLocation: (r) => r.deliveryLocation,
        contractDuration: (r) => r.contractDuration,
        paymentTerms: (r) => r.paymentTerms,
        bbbeeRequirement: (r) => r.bbbeeRequirement,
        contactPerson: (r) => r.contactPerson,
        deliveryTurnaround: (r) => r.deliveryTurnaround,
        customerType: (r) => r.customerType,
        documents: (r) => r.documentCount,
        dateMatched: (r) => toDateSafe(r.createdAt)?.getTime() ?? 0,
        lastActivity: (r) => toDateSafe(r.lastActivity)?.getTime() ?? 0,
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
  }, [applications, localFilters, sortConfig, hiddenMatches, stageFilter, customerSectorsFor])

  useEffect(() => {
    if (onCountChange) onCountChange(filteredApplications.length)
  }, [filteredApplications, onCountChange])

  const f = localFilters
  const activeFilterCount =
    (f.name.trim() ? 1 : 0) +
    (f.matchRange[0] > 0 || f.matchRange[1] < 100 ? 1 : 0) +
    (f.productService.trim() ? 1 : 0) +
    f.opportunityType.length +
    (f.estimatedValue.trim() ? 1 : 0) +
    (f.closingFrom || f.closingTo ? 1 : 0) +
    f.status.length +
    f.customerSector.length +
    (f.deliveryLocation.trim() ? 1 : 0) +
    (f.contractDuration.trim() ? 1 : 0) +
    (f.paymentTerms.trim() ? 1 : 0) +
    (f.minimumRequirements.trim() ? 1 : 0) +
    f.bbbeeRequirement.length +
    (f.complianceRequirements.trim() ? 1 : 0) +
    (f.contactPerson.trim() ? 1 : 0) +
    (f.deliveryTurnaround.trim() ? 1 : 0) +
    f.customerType.length +
    f.documents.length +
    f.nextStage.length

  const clearAllFilters = () => {
    setLocalFilters({ ...EMPTY_FILTERS })
    setSortConfig(null)
  }

  const getFilterActive = (type) => {
    switch (type) {
      case "match":
        return f.matchRange[0] > 0 || f.matchRange[1] < 100
      case "closingDate":
        return !!f.closingFrom || !!f.closingTo
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

  const widthOf = useCallback((key) => columnWidths[key] ?? COLUMN_DEFS[key].width, [columnWidths])

  const stickyOffsets = useMemo(() => {
    const offsets = {}
    // Left-pinned columns stack to the right of the frozen Customer column.
    let leftAcc = CUSTOMER_WIDTH
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

  const totalWidth = CUSTOMER_WIDTH + ACTION_WIDTH + orderedColumns.reduce((sum, key) => sum + widthOf(key), 0)

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

    switch (key) {
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

      case "productService":
        return (
          <td key={key} style={style}>
            <TruncatedText text={a.productService} maxLength={40} />
          </td>
        )

      case "opportunityType":
        return (
          <td key={key} style={style}>
            {a.opportunityType && a.opportunityType !== "Not specified" ? (
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#f5f0e1] text-[#4a352f] text-[10px] font-medium">
                {a.opportunityType}
              </span>
            ) : (
              <span className="text-[#a89482] text-xs">-</span>
            )}
          </td>
        )

      case "estimatedValue":
        return (
          <td key={key} style={style}>
            <span className="text-xs font-medium">{a.estimatedValue}</span>
          </td>
        )

      case "closingDate": {
        const display = formatDateValue(a.closingDate)
        const iso = toISODateOnly(a.closingDate)
        const daysLeft = iso ? Math.ceil((new Date(iso) - new Date()) / 86400000) : null
        return (
          <td key={key} style={style}>
            {display ? (
              <div className="leading-snug">
                <div className="text-xs">{display}</div>
                {daysLeft !== null && (
                  <div
                    className="text-[10px] mt-0.5"
                    style={{ color: daysLeft < 0 ? "#D32F2F" : daysLeft <= 7 ? "#F57C00" : "#a89482" }}
                  >
                    {daysLeft < 0 ? "Closed" : daysLeft === 0 ? "Closes today" : `${daysLeft} days left`}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-[#a89482] text-xs">Not specified</span>
            )}
          </td>
        )
      }

      case "status": {
        const s = getStatusStyle(a.status)
        return (
          <td key={key} style={style}>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ backgroundColor: s.color, color: s.textColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.textColor }} />
              {a.status}
            </span>
          </td>
        )
      }

      case "customerSector": {
        const sectors = customerSectorsFor(a)
        return (
          <td key={key} style={style}>
            {sectors.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {sectors.slice(0, 2).map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded-full bg-[#f5f0e1] text-[#4a352f] text-[10px]">
                    {s}
                  </span>
                ))}
                {sectors.length > 2 && (
                  <span className="text-[10px] text-[#a67c52] font-semibold self-center" title={sectors.join(", ")}>
                    +{sectors.length - 2}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[#a89482] text-xs">-</span>
            )}
          </td>
        )
      }

      case "documents":
        return (
          <td key={key} style={{ ...style, textAlign: "center" }}>
            {a.documentCount > 0 ? (
              <button
                onClick={() => {
                  setSelectedApplication(a)
                  setShowDocumentModal(true)
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5f0e1] text-[#4a352f] text-[10px] font-semibold hover:bg-[#e6d7c3]"
              >
                <FileText size={10} /> {a.documentCount}
              </button>
            ) : (
              <span className="text-[#a89482] text-[10px]">None</span>
            )}
          </td>
        )

      case "dateMatched":
        return <td key={key} style={style}>{formatDateValue(a.createdAt) || <span className="text-[#a89482]">-</span>}</td>

      case "lastActivity":
        // Was `new Date(x).toLocaleDateString() || "N/A"` — an invalid date
        // stringifies to "Invalid Date", which is truthy, so the fallback
        // never fired and the cell showed "Invalid Date".
        return <td key={key} style={style}>{formatDateValue(a.lastActivity) || <span className="text-[#a89482]">-</span>}</td>

      case "nextStage":
        return (
          <td key={key} style={style}>
            <span className="text-xs font-medium">{NEXT_STAGE_BY_STATUS[a.status] || "—"}</span>
          </td>
        )

      default:
        return (
          <td key={key} style={style}>
            <TruncatedText text={a[key]} maxLength={30} />
          </td>
        )
    }
  }

  if (!mounted || loading) {
    return <div className="p-10 text-center text-[#7d5a50] text-sm">Loading opportunities...</div>
  }

  if (error) {
    return <div className="p-10 text-center text-[#D32F2F] text-sm">{error}</div>
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
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
            <h2 className="text-lg font-bold text-[#4a352f] m-0">Customer Matches</h2>
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
                        resize.
                      </p>

                      <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                        <input type="checkbox" checked disabled className="rounded border-[#c8b6a6]" />
                        <span className="text-sm text-[#4a352f] flex-1">Customer</span>
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
            .ct-th { color: #faf7f2 !important; vertical-align: top !important; }
            .ct-th-draggable { cursor: grab; }
            .ct-th-draggable:active { cursor: grabbing; }
            .ct-th-row { display: flex; align-items: flex-start; gap: 2px; min-width: 0; }
            /* overflow-wrap: normal stops the browser splitting inside a word,
               which is what turned "Match %" into "MAT CH.." and "Status" into
               "STA TUS" in narrow columns. */
            .ct-th-label {
              flex: 1 1 auto; min-width: 0;
              display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
              overflow: hidden; white-space: normal;
              overflow-wrap: normal; word-break: normal; hyphens: none;
              line-height: 1.2; letter-spacing: 0.02em;
            }
            .ct-th-tools { display: flex; align-items: center; flex-shrink: 0; }
            /* The drag grip leaves the flex flow and only appears on hover,
               buying every header ~14px more room for its label. */
            .ct-th-grip { position: absolute; left: 3px; top: 10px; opacity: 0; transition: opacity .15s; }
            .ct-th:hover .ct-th-grip { opacity: .45; }
            .ct-resize { position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: col-resize; }
            .ct-resize:hover { background: rgba(255,255,255,0.25); }
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
                <th
                  className="ct-th font-semibold uppercase tracking-wider text-xs sticky top-0 left-0 z-30 text-left"
                  style={{
                    backgroundColor: "#4a352f",
                    width: CUSTOMER_WIDTH,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                    boxShadow: "2px 0 0 #e6d7c3",
                  }}
                >
                  <div className="ct-th-row">
                    <span className="ct-th-label" title="Customer">
                      Customer
                    </span>
                    <span className="ct-th-tools">
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
                      className={`ct-th ct-th-draggable font-semibold uppercase tracking-wider text-xs sticky top-0 select-none transition-opacity ${
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
                      <GripVertical size={11} className="ct-th-grip" />
                      <div className={`ct-th-row ${col.align === "center" ? "justify-center" : ""}`}>
                        <span className="ct-th-label" title={col.label}>
                          {col.label}
                        </span>
                        <span className="ct-th-tools">
                          {pinned[key] && <Pin size={10} className="opacity-60 mt-0.5" />}
                          {col.sortable && <SortTrigger columnKey={key} />}
                          {col.filterType && (
                            <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} />
                          )}
                        </span>
                      </div>
                      <div className="ct-resize" onMouseDown={(e) => startResize(e, key)} onClick={(e) => e.stopPropagation()} />
                    </th>
                  )
                })}

                {/* Action scrolls horizontally with the table — only top-0, so
                    it still holds position on vertical scroll. */}
                <th
                  className="ct-th text-center font-semibold uppercase tracking-wider text-xs sticky top-0 z-20"
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
              {filteredApplications.length === 0 ? (
                <tr>
                  <td
                    colSpan={orderedColumns.length + 2}
                    style={{ ...tableCellStyle, textAlign: "center", padding: "3rem 1rem", borderRight: "none" }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-[#f5f0e1] flex items-center justify-center">
                        <Briefcase size={26} className="text-[#7d5a50] opacity-50" />
                      </div>
                      <p className="text-sm font-semibold text-[#4a352f] m-0">
                        {applications.length === 0 ? "No opportunities yet" : "No opportunities match these filters"}
                      </p>
                      <p className="text-xs text-[#a89482] m-0">
                        {applications.length === 0
                          ? "Matched procurement opportunities will appear here once customers publish them."
                          : "Clear a filter to widen the results."}
                      </p>
                      {activeFilterCount > 0 && applications.length > 0 && (
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
                filteredApplications.map((a) => {
                  const actions = getRowActions(a.status)
                  const isSaved = !!savedMatches[a.id]
                  const isTerminal = a.status === "Declined" || a.status === "Closed"
                  const rowBg = hoveredRow === a.id ? "#fdf8f4" : "#ffffff"

                  const runAction = (kind) => {
                    if (kind === "shortlist") return handleOpenShortlist(a)
                    if (kind === "proposal") return handleOpenProposal(a)
                    return handleViewDetails(a)
                  }

                  return (
                    <tr
                      key={a.id}
                      onMouseEnter={() => setHoveredRow(a.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ backgroundColor: rowBg, transition: "background-color .15s" }}
                    >
                      {/* Customer — pinned left. Name only; the opportunity
                          detail lives in its own columns. */}
                      <td
                        className="sticky left-0 z-10"
                        style={{
                          ...tableCellStyle,
                          width: CUSTOMER_WIDTH,
                          backgroundColor: rowBg,
                          borderRight: "none",
                          boxShadow: "2px 0 0 #e6d7c3",
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-[#4a352f] break-words text-sm">{a.customerName}</span>
                          <button
                            onClick={() => handleViewDetails(a)}
                            className="text-[#a89482] hover:text-[#7d5a50] flex-shrink-0"
                            aria-label={`View ${a.customerName}`}
                            title="View customer profile"
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
                          width: ACTION_WIDTH,
                          borderRight: "none",
                          backgroundColor: rowBg,
                          textAlign: "center",
                        }}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => runAction(actions.kind)}
                            title={actions.primary}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                              isTerminal ? "bg-[#e6d7c3]/60 text-[#a89482]" : "text-white hover:shadow-md hover:brightness-105"
                            }`}
                            style={{ width: "126px", height: "34px", backgroundColor: isTerminal ? undefined : "#7d5a50" }}
                          >
                            {!isTerminal && <ArrowRight size={13} className="flex-shrink-0" />}
                            <span className="truncate">{actions.primary}</span>
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

            {headerFilterOpen.type === "closingDate" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Closing date</label>
                  {(localFilters.closingFrom || localFilters.closingTo) && (
                    <button
                      onClick={() => setLocalFilters((p) => ({ ...p, closingFrom: "", closingTo: "" }))}
                      className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={localFilters.closingFrom}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, closingFrom: e.target.value }))}
                    className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                  />
                  <span className="text-[#7d5a50] text-xs">to</span>
                  <input
                    type="date"
                    value={localFilters.closingTo}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, closingTo: e.target.value }))}
                    className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                  />
                </div>
                <p className="text-[11px] text-[#a89482] mt-2 mb-0">
                  Opportunities with no closing date are excluded when a range is set.
                </p>
              </>
            )}

            {[
              { type: "name", label: "Customer / opportunity", placeholder: "Search..." },
              { type: "productService", label: "Product or Service Required", placeholder: "e.g. cleaning, IT support" },
              { type: "estimatedValue", label: "Estimated Value", placeholder: "Search value..." },
              { type: "deliveryLocation", label: "Delivery Location", placeholder: "Search location..." },
              { type: "contractDuration", label: "Contract Duration", placeholder: "e.g. 12 months" },
              { type: "paymentTerms", label: "Payment Terms", placeholder: "e.g. 30 days" },
              { type: "minimumRequirements", label: "Minimum Requirements", placeholder: "Search requirements..." },
              { type: "complianceRequirements", label: "Compliance Requirements", placeholder: "Search compliance..." },
              { type: "contactPerson", label: "Contact Person", placeholder: "Search contact..." },
              { type: "deliveryTurnaround", label: "Delivery Turnaround", placeholder: "Search turnaround..." },
            ].map(
              ({ type, label, placeholder }) =>
                headerFilterOpen.type === type && (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-[#4a352f]">{label}</label>
                      {localFilters[type] && (
                        <button
                          onClick={() => setLocalFilters((p) => ({ ...p, [type]: "" }))}
                          className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      autoFocus
                      type="text"
                      value={localFilters[type]}
                      onChange={(e) => setLocalFilters((p) => ({ ...p, [type]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
                    />
                  </div>
                ),
            )}

            {[
              { type: "opportunityType", label: "Opportunity Type", options: opportunityTypeOptions },
              { type: "status", label: "Status", options: CUSTOMER_STATUSES },
              { type: "customerSector", label: "Customer Sector", options: sectorOptions },
              { type: "bbbeeRequirement", label: "B-BBEE Requirement", options: BBBEE_LEVELS },
              { type: "customerType", label: "Customer Type", options: customerTypeOptions },
              { type: "documents", label: "Documents", options: DOCUMENT_BUCKETS },
              { type: "nextStage", label: "Next Stage", options: CUSTOMER_STATUSES },
            ].map(
              ({ type, label, options }) =>
                headerFilterOpen.type === type && (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-3">
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
                    <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto">
                      {options.length === 0 && <span className="text-xs text-[#a89482]">No data available</span>}
                      {options.map((value) => (
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
                ),
            )}
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
              onClick={() => handleViewDetails(activePopup.row)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Eye size={12} /> Customer Profile
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
                if (target.documentCount > 0) {
                  setSelectedApplication(target)
                  setShowDocumentModal(true)
                } else {
                  notify("info", "No documents on this opportunity.", 2500)
                }
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <FileText size={12} /> RFQ / RFP / Tender
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
                notify("info", '"Share" is not wired up yet.', 2500)
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Share2 size={12} /> Share
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
                notify("info", `${target.customerName} hidden from your matches.`)
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
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[220px]">{activePopup.row.customerName}</h3>
                  {activePopup.row.opportunityTitle && (
                    <p className="text-[11px] text-[#e6d7c3] m-0 truncate max-w-[220px]">
                      {activePopup.row.opportunityTitle}
                    </p>
                  )}
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
              {activePopup.row.matchDetails ? (
                <>
                  {Object.entries(activePopup.row.matchDetails).map(([key, d]) => {
                    const color = d.score >= 80 ? "#22c55e" : d.score >= 50 ? "#f59e0b" : "#ef4444"
                    return (
                      <div key={key} className="p-3 rounded-lg border border-[#e6d7c3] bg-[#faf7f2] text-xs">
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <span className="font-semibold text-[#4a352f]">{d.description}</span>
                          <span className="font-bold flex-shrink-0" style={{ color }}>
                            {Math.round(d.score)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden mb-1.5">
                          <div className="h-full rounded-full" style={{ width: `${d.score}%`, backgroundColor: color }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-[#a89482]">
                          <span>Weight {d.weight}%</span>
                          <span>Contributes {Math.round((d.score / 100) * d.weight)}%</span>
                        </div>
                        {d.estimated && (
                          <p className="text-[10px] text-[#a67c52] mt-1.5 m-0">
                            Estimated — the underlying data isn't captured yet.
                          </p>
                        )}
                        {d.score < 70 && IMPROVEMENT_SUGGESTIONS[key] && (
                          <p className="text-[11px] text-[#7d5a50] mt-1.5 m-0 leading-relaxed">
                            {IMPROVEMENT_SUGGESTIONS[key]}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-[#a89482] m-0">No breakdown was stored for this opportunity.</p>
                  <p className="text-[11px] text-[#a89482] mt-1 m-0">
                    Older records created before scoring detail was captured won't have one.
                  </p>
                </div>
              )}
            </div>
          </div>
        </PopupPortal>
      )}

      {/* Shortlist + meeting */}
      {showShortlistModal &&
        selectedApplication &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4" style={{ backgroundColor: "rgba(62,39,35,0.85)", backdropFilter: "blur(4px)" }}>
            <div className="bg-white rounded-2xl max-w-[600px] w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Shortlist</p>
                    <h3 className="text-sm font-bold mt-0.5 truncate">{selectedApplication.customerName}</h3>
                  </div>
                  <button onClick={() => setShowShortlistModal(false)} className="text-white/70 hover:text-white p-1 flex-shrink-0">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">Meeting purpose</label>
                  <input
                    type="text"
                    value={meetingPurpose}
                    onChange={(e) => {
                      setMeetingPurpose(e.target.value)
                      if (e.target.value.trim()) setFormErrors((p) => ({ ...p, meetingPurpose: null }))
                    }}
                    placeholder="e.g. Initial discussion, scope review"
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{ borderColor: formErrors.meetingPurpose ? "#D32F2F" : "#c8b6a6" }}
                  />
                  {formErrors.meetingPurpose && <p className="text-[11px] text-[#D32F2F] mt-1 m-0">{formErrors.meetingPurpose}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">Meeting location</label>
                  <input
                    type="text"
                    value={meetingLocation}
                    onChange={(e) => {
                      setMeetingLocation(e.target.value)
                      if (e.target.value.trim()) setFormErrors((p) => ({ ...p, meetingLocation: null }))
                    }}
                    placeholder="e.g. Virtual meeting, office address"
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{ borderColor: formErrors.meetingLocation ? "#D32F2F" : "#c8b6a6" }}
                  />
                  {formErrors.meetingLocation && <p className="text-[11px] text-[#D32F2F] mt-1 m-0">{formErrors.meetingLocation}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">Available dates</label>
                  <button
                    onClick={() => setShowCalendarModal(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#7d5a50] text-white text-xs font-semibold mb-3"
                  >
                    <Calendar size={14} /> Select dates
                  </button>

                  {availabilities.length > 0 && (
                    <div className="border border-[#e6d7c3] rounded-lg p-2 max-h-[180px] overflow-y-auto">
                      {availabilities
                        .sort((a, b) => a.date - b.date)
                        .map((av, i) => (
                          <div key={i} className="flex justify-between items-center py-1.5 border-b border-[#f5f0e1] last:border-0">
                            <span className="text-xs text-[#4a352f]">
                              {av.date.toLocaleDateString("en-ZA", { weekday: "short", month: "short", day: "numeric" })}
                              <span className="text-[#a89482] ml-2">
                                {av.timeSlots[0].start} – {av.timeSlots[0].end}
                              </span>
                            </span>
                            <button
                              onClick={() => setAvailabilities((p) => p.filter((x) => x.date.getTime() !== av.date.getTime()))}
                              className="text-[#D32F2F]"
                              aria-label="Remove date"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                  {formErrors.availabilities && <p className="text-[11px] text-[#D32F2F] mt-1 m-0">{formErrors.availabilities}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-2 p-6 border-t border-[#e6d7c3]">
                <button onClick={() => setShowShortlistModal(false)} className="px-4 py-2 rounded-lg text-sm text-[#7d5a50] border border-[#c8b6a6]">
                  Cancel
                </button>
                <button
                  onClick={handleConfirmShortlist}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#7d5a50] text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
                >
                  <Check size={15} /> {isSubmitting ? "Saving..." : "Confirm shortlist"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Date picker */}
      {showCalendarModal &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-[1010] p-4" style={{ backgroundColor: "rgba(62,39,35,0.85)", backdropFilter: "blur(4px)" }}>
            <div className="bg-white rounded-2xl max-w-[600px] w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
              <h3 className="text-lg font-semibold text-[#4a352f] text-center mb-5 m-0">Select available dates</h3>

              <div className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4 mb-5">
                <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">Available time</label>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="time"
                    value={timeSlot.start}
                    onChange={(e) => setTimeSlot((p) => ({ ...p, start: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm"
                  />
                  <span className="text-[#7d5a50] text-xs">to</span>
                  <input
                    type="time"
                    value={timeSlot.end}
                    onChange={(e) => setTimeSlot((p) => ({ ...p, end: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm"
                  />
                </div>
                <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">Time zone</label>
                <input
                  type="text"
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-center mb-5">
                <DayPicker mode="multiple" selected={tempDates} onSelect={(d) => setTempDates(d || [])} />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowCalendarModal(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm text-[#7d5a50] border border-[#c8b6a6]">
                  Cancel
                </button>
                <button
                  onClick={saveSelectedDates}
                  disabled={tempDates.length === 0}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#7d5a50] text-white text-sm font-semibold disabled:opacity-50"
                >
                  Save dates ({tempDates.length})
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Proposal */}
      {showProposalModal &&
        selectedApplication &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4" style={{ backgroundColor: "rgba(62,39,35,0.85)", backdropFilter: "blur(4px)" }}>
            <div className="bg-white rounded-2xl max-w-[560px] w-full shadow-2xl">
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Send proposal</p>
                    <h3 className="text-sm font-bold mt-0.5 truncate">{selectedApplication.customerName}</h3>
                  </div>
                  <button onClick={() => setShowProposalModal(false)} className="text-white/70 hover:text-white p-1 flex-shrink-0">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">Message (optional)</label>
                  <textarea
                    value={proposalMessage}
                    onChange={(e) => setProposalMessage(e.target.value)}
                    placeholder="Add a note to accompany your proposal..."
                    rows={4}
                    className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm resize-vertical"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1.5">Attach proposal / quote</label>
                  <input
                    type="file"
                    onChange={(e) => setProposalFile(e.target.files[0])}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm"
                  />
                  {proposalFile && (
                    <div className="mt-2 px-3 py-2 bg-[#faf7f2] rounded-lg flex items-center gap-2 text-xs text-[#4a352f]">
                      <FileText size={14} /> {proposalFile.name}
                    </div>
                  )}
                  <p className="text-[11px] text-[#e65100] mt-2 m-0">
                    File upload to Storage isn't wired yet — the recipient will see the filename but not be able to
                    download it until that's connected.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-6 border-t border-[#e6d7c3]">
                <button onClick={() => setShowProposalModal(false)} className="px-4 py-2 rounded-lg text-sm text-[#7d5a50] border border-[#c8b6a6]">
                  Cancel
                </button>
                <button
                  onClick={handleSendProposal}
                  disabled={!proposalFile || isSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#7d5a50] text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  <Send size={15} /> {isSubmitting ? "Sending..." : "Send proposal"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Documents */}
      {showDocumentModal &&
        selectedApplication &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4" style={{ backgroundColor: "rgba(62,39,35,0.85)", backdropFilter: "blur(4px)" }}>
            <div className="bg-white rounded-2xl max-w-[560px] w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Documents</p>
                    <h3 className="text-sm font-bold mt-0.5 truncate">{selectedApplication.customerName}</h3>
                  </div>
                  <button onClick={() => setShowDocumentModal(false)} className="text-white/70 hover:text-white p-1 flex-shrink-0">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {selectedApplication.applicationData?.documents?.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {selectedApplication.applicationData.documents.map((d, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 border border-[#e6d7c3] rounded-lg bg-[#faf7f2]">
                        <div className="w-9 h-9 rounded-lg bg-[#f5f0e1] flex items-center justify-center text-[#7d5a50] flex-shrink-0">
                          <FileIcon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-[#4a352f] m-0 truncate">{d.name}</h4>
                          <p className="text-[11px] text-[#a89482] m-0">
                            {d.type} · {d.size || "size unknown"}
                          </p>
                        </div>
                        {d.url ? (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-[#7d5a50] text-white flex-shrink-0"
                            aria-label={`Download ${d.name}`}
                          >
                            <Download size={15} />
                          </a>
                        ) : (
                          <span className="text-[10px] text-[#a89482] flex-shrink-0">No file</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-[#a89482]">
                    <FileIcon size={40} className="mx-auto mb-3 text-[#e6d7c3]" />
                    <p className="m-0 text-sm">No documents on this opportunity.</p>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {selectedCustomer && (
        <CustomerDetailsModal customer={selectedCustomer} isOpen onClose={() => setSelectedCustomer(null)} />
      )}
    </div>
  )
}

export default CustomerTable