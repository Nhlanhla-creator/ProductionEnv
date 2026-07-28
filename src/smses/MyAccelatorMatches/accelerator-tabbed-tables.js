"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import {
  X,
  Trophy,
  TrendingUp,
  Ticket,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  ChevronDown,
  SlidersHorizontal,
  GripVertical,
  RotateCcw,
  Settings,
  Trash2,
  Plus,
  LayoutGrid,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowRight,
  Pin,
  PinOff,
} from "lucide-react"
import { collection, getDocs, query, where, doc, getDoc, onSnapshot, orderBy } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../../firebaseConfig"
import { AcceleratorTable } from "./accelator-table"
import { DEFAULT_STAGES, mapStatusToStageId, getStageColors } from "../../catalyst/CatalystMatches/stageConfig"

/* ════════════════════════════════════════════════════════════════════════════
   This file no longer imports ./matchTableKit.

   The kit rendered the header row, and its own <style> block set
   `position: relative` on every <th>, which overrode the sticky positioning:
   the header scrolled away while the pinned body cells stayed frozen. Its
   default widths were also too narrow for labels that share their cell with a
   grip, a sort control and a filter control (~60px of chrome), so the browser
   broke them mid-word — "PROGRAMME COHO..", "SERVICES DELIV..".

   This table now owns its head, toolbar, filters and row actions.

   AcceleratorTable (the matches tab) still uses the kit and shares a page with
   this table, so every selector here is prefixed ct- (catalyst table) and the
   sticky headers declare `position: sticky !important` to survive the kit's
   global <th> rule regardless of mount order.
   ════════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════════════
   Successful-deal resolution.

   The original query hardcoded legacy labels in a Firestore `in` clause. The
   table now writes canonical stageConfig names and the alias map turns
   Support Approved into Offer and Active Support into Admitted, neither of
   which was in that list — so deals would quietly stop appearing as records
   migrated. Fetching by smeId and resolving client-side handles both
   vocabularies with no `in`-clause length limit.
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
  Exit: "Admitted",
  "Support Declined": "Declined",
  Decline: "Declined",
  Rejected: "Declined",
}
const normalizeStatus = (s) => LEGACY_STATUS_ALIASES[s] || s

// A deal counts as successful from the point an offer is on the table onward.
// If an offer is not a deal until accepted, drop `offer|approved|term sheet`.
const SUCCESS_STAGE_TEST = /offer|approved|admitted|active|graduat|exit|complet|term sheet/i

const isSuccessfulDeal = (status) => {
  const normalized = normalizeStatus(status)
  if (!normalized) return false
  if (/declin|withdraw|reject/i.test(normalized)) return false
  const stage = DEFAULT_STAGES.find((s) => s.id === mapStatusToStageId(normalized, DEFAULT_STAGES))
  return SUCCESS_STAGE_TEST.test(stage?.name || normalized)
}

const getStatusMeta = (status) => {
  const normalized = normalizeStatus(status)
  const stage = DEFAULT_STAGES.find((s) => s.id === mapStatusToStageId(normalized, DEFAULT_STAGES)) || DEFAULT_STAGES[0]
  return { label: status || stage.name, colors: getStageColors(stage.group) }
}

const useEffectiveUserId = () => {
  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setEffectiveUserId(null)
        setResolved(true)
        return
      }
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid))
        const companyId = userSnap.exists() ? userSnap.data().companyId : null
        if (companyId) {
          const companySnap = await getDoc(doc(db, "companies", companyId))
          if (companySnap.exists()) {
            setEffectiveUserId(companySnap.data().createdBy || user.uid)
            setResolved(true)
            return
          }
        }
        setEffectiveUserId(user.uid)
      } catch (error) {
        console.error("Error resolving company membership:", error)
        setEffectiveUserId(user.uid)
      } finally {
        setResolved(true)
      }
    })
    return () => unsubscribe()
  }, [])

  return { effectiveUserId, resolved }
}

const getVoucherTypeName = (type) =>
  ({
    legitimacy: "Legitimacy Boost",
    capital: "Capital Appeal Boost",
    governance: "Governance Boost",
    compliance: "Compliance Boost",
  })[type] || "Premium Subscription"

const isVoucherExpired = (expiresAt) => {
  if (!expiresAt) return false
  const d = expiresAt?.toDate ? expiresAt.toDate() : new Date(expiresAt)
  return !Number.isNaN(d.getTime()) && d < new Date()
}

const formatDateTime = (value) => {
  if (!value) return "Not specified"
  const d = value?.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(d.getTime())) return "Not specified"
  return d.toLocaleString("en-ZA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(62, 39, 35, 0.85)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  padding: "16px",
  backdropFilter: "blur(4px)",
}

const modalContentStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "20px",
  padding: "32px",
  maxWidth: "520px",
  width: "100%",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5)",
}

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

/* ─── Voucher detail ────────────────────────────────────────────────────── */
const VoucherView = ({ voucher, onClose }) => {
  const [copied, setCopied] = useState(false)
  const expired = isVoucherExpired(voucher.expiresAt)

  return (
    <div style={{ ...modalOverlayStyle, zIndex: 1200 }} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold text-[#4a352f] m-0 flex items-center gap-2">
            <Ticket size={22} className="text-[#a67c52]" /> Your voucher
          </h2>
          <button onClick={onClose} className="text-[#7d5a50] hover:text-[#4a352f]">
            <X size={20} />
          </button>
        </div>

        <div
          className="rounded-xl p-6 mb-5 text-center"
          style={{ backgroundColor: expired ? "#FFEBEE" : "#E8F5E8", border: `2px solid ${expired ? "#D32F2F" : "#388E3C"}` }}
        >
          {expired ? (
            <AlertCircle size={40} className="mx-auto mb-3 text-[#D32F2F]" />
          ) : (
            <CheckCircle size={40} className="mx-auto mb-3 text-[#388E3C]" />
          )}
          <h3 className="text-base mb-1.5" style={{ color: expired ? "#D32F2F" : "#2e7d32" }}>
            {expired ? "Voucher expired" : "Valid voucher available"}
          </h3>
          <p className="text-sm text-[#4a352f] mb-4">
            {getVoucherTypeName(voucher.type)} · {voucher.seats || 1} seat{(voucher.seats || 1) > 1 ? "s" : ""}
          </p>
          <div className="bg-white border-2 border-dashed border-[#c8b6a6] rounded-lg p-4 mb-3">
            <div className="font-mono text-lg font-bold text-[#4a352f] mb-2">{voucher.code}</div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(voucher.code)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="text-[#a67c52] text-xs flex items-center gap-1 mx-auto"
            >
              <Copy size={14} /> {copied ? "Copied" : "Copy code"}
            </button>
          </div>
          <p className="text-xs text-[#7d5a50] m-0">Received {formatDateTime(voucher.createdAt)}</p>
          <p className="text-xs m-0 mt-0.5" style={{ color: expired ? "#D32F2F" : "#7d5a50", fontWeight: expired ? 700 : 400 }}>
            Expires {voucher.expiresAt ? formatDateTime(voucher.expiresAt) : "never"}
          </p>
        </div>

        <div className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4 mb-5">
          <p className="m-0 text-sm font-semibold text-[#4a352f]">How to redeem</p>
          <ol className="mt-2 mb-0 pl-5 text-xs text-[#7d5a50] leading-relaxed">
            <li>Go to the Subscription page</li>
            <li>Choose "Have a voucher code? Click here to redeem"</li>
            <li>Enter this code to activate your {getVoucherTypeName(voucher.type)}</li>
          </ol>
        </div>

        <button onClick={onClose} className="w-full py-3.5 rounded-lg bg-[#7d5a50] text-white text-sm font-semibold">
          Close
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Successful deals — column configuration.

   Programme / Catalyst is the pinned first column and Action the last, so
   neither appears here. Widths raised in line with the other match tables:
   each header carries a grip, sort and filter control, so the old 116–180px
   columns left too little room and the browser broke labels mid-word.
   ════════════════════════════════════════════════════════════════════════ */
const COLUMN_DEFS = {
  sectorFocus: { label: "Sector Focus", width: 174, filterType: "sectorFocus", visible: true, priority: 3, sortable: true },
  fundingType: { label: "Funding Type", width: 166, filterType: "fundingType", visible: true, priority: 2, sortable: true },
  startDate: { label: "Start Date", width: 152, filterType: "startDate", visible: true, priority: 2, sortable: true },
  ticketSize: { label: "Ticket Size", width: 154, filterType: "ticketSize", visible: true, priority: 3, sortable: true },
  location: { label: "Location", width: 152, filterType: "location", visible: true, priority: 3, sortable: true },
  status: { label: "Status", width: 152, filterType: "status", visible: true, priority: 1, sortable: true },
  vouchers: { label: "Vouchers", width: 150, filterType: "vouchers", visible: true, priority: 1, sortable: true },

  programCohort: { label: "Programme Cohort", width: 190, filterType: "programCohort", visible: false, priority: 4, sortable: true },
  duration: { label: "Duration", width: 146, filterType: "duration", visible: false, priority: 4, sortable: true },
  equityTaken: { label: "Equity Taken", width: 160, filterType: "equityTaken", visible: false, priority: 4, sortable: true },
  contractValue: { label: "Contract Value", width: 170, filterType: "contractValue", visible: false, priority: 4, sortable: true },
  nextMilestone: { label: "Next Milestone", width: 174, filterType: "nextMilestone", visible: false, priority: 4, sortable: true },
  servicesDelivered: { label: "Services Delivered", width: 200, filterType: "servicesDelivered", visible: false, priority: 4, sortable: false },
  fundingStage: { label: "Funding Stage", width: 166, filterType: "fundingStage", visible: false, priority: 4, sortable: true },
  matchPercentage: { label: "Match %", align: "center", width: 138, filterType: "matchPercentage", visible: false, priority: 4, sortable: true },
}

const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS)
const DEFAULT_COLUMN_VISIBILITY = Object.fromEntries(
  DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].visible !== false]),
)
const DEFAULT_COLUMN_WIDTHS = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].width]))
const DEFAULT_PINNED = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, null]))
const DEFAULT_DENSITY = "comfortable"

const PROGRAMME_WIDTH = 240
const ACTION_WIDTH = 152
const MIN_COLUMN_WIDTH = 84

const EMPTY_FILTERS = {
  name: "",
  sectorFocus: [],
  fundingType: [],
  startFrom: "",
  startTo: "",
  ticketSize: "",
  location: [],
  status: [],
  vouchers: [],
  programCohort: "",
  duration: "",
  equityTaken: "",
  contractValue: "",
  nextMilestone: "",
  servicesDelivered: "",
  fundingStage: [],
  matchRange: [0, 100],
}

const VOUCHER_BUCKETS = ["Has active voucher", "Has expired voucher", "No vouchers"]

/* ─── Saved views + filter persistence ──────────────────────────────────── */
const BUILTIN_VIEW_ID = "__default__"
// v2: the stored widths from the kit version are the narrow ones that caused
// the mid-word header breaks, so old saved views fall back to the new defaults.
const VIEWS_STORAGE_KEY = "catalyst-deals-views-v2"
const FILTERS_STORAGE_KEY = "catalyst-deals-filters-v1"

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

/* ════════════════════════════════════════════════════════════════════════════
   Successful catalyst deals table
   ════════════════════════════════════════════════════════════════════════ */
const SuccessfulAcceleratorDealsTable = ({ effectiveUserId, resolved, onCountChange, onNotify }) => {
  const [deals, setDeals] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [voucherPicker, setVoucherPicker] = useState(null)
  const [hoveredRow, setHoveredRow] = useState(null)
  const unsubRef = useRef(null)

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

  /* ─── Load deals + vouchers ─────────────────────────────────────────── */
  useEffect(() => {
    if (!resolved) return undefined
    if (!effectiveUserId) {
      setLoading(false)
      return undefined
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const snapshot = await getDocs(
          query(collection(db, "smeCatalystApplications"), where("smeId", "==", effectiveUserId)),
        )

        const successful = snapshot.docs.filter((d) => isSuccessfulDeal(d.data().status || d.data().pipelineStage))

        const rows = await Promise.all(
          successful.map(async (docSnap) => {
            const data = docSnap.data()
            let catalystName = data.acceleratorName || "Unknown Catalyst"
            let sector = data.sector || "-"
            let fundingType = data.fundingType || "-"
            let location = data.location || "-"

            if (data.catalystId) {
              try {
                const catalystSnap = await getDoc(doc(db, "catalystProfiles", data.catalystId))
                if (catalystSnap.exists()) {
                  const formData = catalystSnap.data().formData || {}
                  const overview = formData.entityOverview || {}
                  const prefs = formData.generalMatchingPreference || {}
                  catalystName = data.acceleratorName || overview.registeredName || catalystName
                  sector = prefs.sectorFocus || sector
                  fundingType = prefs.supportFocusSubtype || fundingType
                  location = prefs.geographicFocus || overview.province || location
                }
              } catch (err) {
                console.error("Error fetching catalyst profile:", err)
              }
            }

            return {
              id: docSnap.id,
              catalystId: data.catalystId,
              acceleratorName: catalystName,
              programmeName: data.programmeName || null,
              sectorFocus: sector,
              fundingType,
              startDate: data.applicationDate || data.createdAt || null,
              ticketSize: data.fundingRequired || "-",
              location,
              status: data.status || data.pipelineStage || "-",
              programCohort: `Programme ${(data.programIndex || 0) + 1}`,
              duration: data.duration || "Not specified",
              equityTaken: data.equityOffered || "N/A",
              contractValue: data.fundingRequired || "-",
              nextMilestone: data.nextStage || "—",
              servicesDelivered: data.servicesRequired || "Standard programme services",
              fundingStage: data.fundingStage || "-",
              matchPercentage: data.matchPercentage ?? 0,
            }
          }),
        )

        if (cancelled) return
        setDeals(rows)
        setLoading(false)

        // The old version returned this unsubscribe from an async function,
        // so React never received it and the listener leaked on unmount.
        unsubRef.current = onSnapshot(
          query(collection(db, "vouchers"), where("smeId", "==", effectiveUserId), orderBy("createdAt", "desc")),
          (snap) => {
            if (!cancelled) setVouchers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
          },
          (err) => console.error("Voucher listener failed:", err),
        )
      } catch (err) {
        if (cancelled) return
        console.error("Error fetching successful deals:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
      if (unsubRef.current) {
        unsubRef.current()
        unsubRef.current = null
      }
    }
  }, [effectiveUserId, resolved])

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
    onNotify?.("success", `View "${trimmedName}" created`)
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
    onNotify?.("success", "View deleted")
  }

  const resetActiveViewToDefault = () => {
    const layout = createDefaultViewLayout()
    setColumnVisibility(layout.columnVisibility)
    setColumnOrder(layout.columnOrder)
    setColumnWidths(layout.columnWidths)
    setPinned(layout.pinned)
    setDensity(layout.density)
    onNotify?.("success", `"${activeView.name}" reset to factory defaults`)
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

  /* ─── Data ──────────────────────────────────────────────────────────── */
  const dealsWithVouchers = useMemo(
    () =>
      deals.map((deal) => ({
        ...deal,
        vouchers: vouchers.filter(
          (v) => v.catalystId === deal.catalystId || v.createdForSME === deal.id || v.cohortId === deal.id,
        ),
      })),
    [deals, vouchers],
  )

  const uniqueOf = useCallback(
    (accessor) => [...new Set(dealsWithVouchers.map(accessor).filter((v) => v && v !== "-"))].sort(),
    [dealsWithVouchers],
  )
  const sectorOptions = useMemo(() => uniqueOf((d) => d.sectorFocus), [uniqueOf])
  const fundingTypeOptions = useMemo(() => uniqueOf((d) => d.fundingType), [uniqueOf])
  const locationOptions = useMemo(() => uniqueOf((d) => d.location), [uniqueOf])
  const statusOptions = useMemo(() => uniqueOf((d) => d.status), [uniqueOf])
  const fundingStageOptions = useMemo(() => uniqueOf((d) => d.fundingStage), [uniqueOf])

  const voucherBucket = (deal) => {
    if (deal.vouchers.length === 0) return "No vouchers"
    return deal.vouchers.some((v) => !isVoucherExpired(v.expiresAt)) ? "Has active voucher" : "Has expired voucher"
  }

  /* ─── Filtering + sorting ───────────────────────────────────────────── */
  const filteredDeals = useMemo(() => {
    const f = localFilters
    const matchesAny = (selected, value) =>
      selected.length === 0 || selected.some((v) => (value || "").toLowerCase().includes(v.toLowerCase()))
    const includesText = (needle, value) =>
      !needle.trim() || (value || "").toString().toLowerCase().includes(needle.toLowerCase().trim())

    const rows = dealsWithVouchers.filter((d) => {
      if (!includesText(f.name, `${d.programmeName || ""} ${d.acceleratorName}`)) return false
      if (!matchesAny(f.sectorFocus, d.sectorFocus)) return false
      if (!matchesAny(f.fundingType, d.fundingType)) return false
      if (!includesText(f.ticketSize, d.ticketSize)) return false
      if (!matchesAny(f.location, d.location)) return false
      if (!matchesAny(f.status, d.status)) return false
      if (f.vouchers.length > 0 && !f.vouchers.includes(voucherBucket(d))) return false
      if (!includesText(f.programCohort, d.programCohort)) return false
      if (!includesText(f.duration, d.duration)) return false
      if (!includesText(f.equityTaken, d.equityTaken)) return false
      if (!includesText(f.contractValue, d.contractValue)) return false
      if (!includesText(f.nextMilestone, d.nextMilestone)) return false
      if (!includesText(f.servicesDelivered, d.servicesDelivered)) return false
      if (!matchesAny(f.fundingStage, d.fundingStage)) return false

      const match = d.matchPercentage || 0
      if (match < f.matchRange[0] || match > f.matchRange[1]) return false

      const iso = toISODateOnly(d.startDate)
      if (f.startFrom && (!iso || iso < f.startFrom)) return false
      if (f.startTo && (!iso || iso > f.startTo)) return false

      return true
    })

    if (sortConfig?.key) {
      const accessors = {
        name: (r) => r.programmeName || r.acceleratorName,
        sectorFocus: (r) => r.sectorFocus,
        fundingType: (r) => r.fundingType,
        startDate: (r) => toDateSafe(r.startDate)?.getTime() ?? 0,
        ticketSize: (r) => Number.parseFloat((r.ticketSize || "").toString().replace(/[^0-9.]/g, "")) || 0,
        location: (r) => r.location,
        status: (r) => r.status,
        vouchers: (r) => r.vouchers.length,
        programCohort: (r) => r.programCohort,
        duration: (r) => r.duration,
        equityTaken: (r) => r.equityTaken,
        contractValue: (r) => r.contractValue,
        nextMilestone: (r) => r.nextMilestone,
        fundingStage: (r) => r.fundingStage,
        matchPercentage: (r) => r.matchPercentage || 0,
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
  }, [dealsWithVouchers, localFilters, sortConfig])

  useEffect(() => {
    if (onCountChange) onCountChange(filteredDeals.length)
  }, [filteredDeals, onCountChange])

  /* Keep the open detail panel pointed at a live row so a voucher arriving
     mid-session shows up without reopening. */
  const liveSelectedDeal = useMemo(
    () => (selectedDeal ? dealsWithVouchers.find((d) => d.id === selectedDeal.id) || selectedDeal : null),
    [selectedDeal, dealsWithVouchers],
  )

  /* ─── Filter chrome ─────────────────────────────────────────────────── */
  const f = localFilters
  const activeFilterCount =
    (f.name.trim() ? 1 : 0) +
    f.sectorFocus.length +
    f.fundingType.length +
    (f.startFrom || f.startTo ? 1 : 0) +
    (f.ticketSize.trim() ? 1 : 0) +
    f.location.length +
    f.status.length +
    f.vouchers.length +
    (f.programCohort.trim() ? 1 : 0) +
    (f.duration.trim() ? 1 : 0) +
    (f.equityTaken.trim() ? 1 : 0) +
    (f.contractValue.trim() ? 1 : 0) +
    (f.nextMilestone.trim() ? 1 : 0) +
    (f.servicesDelivered.trim() ? 1 : 0) +
    f.fundingStage.length +
    (f.matchRange[0] > 0 || f.matchRange[1] < 100 ? 1 : 0)

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
    // Left-pinned columns stack to the right of the frozen Programme column.
    let leftAcc = PROGRAMME_WIDTH
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

  const totalWidth = PROGRAMME_WIDTH + ACTION_WIDTH + orderedColumns.reduce((sum, key) => sum + widthOf(key), 0)

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
  const renderCell = (key, d, rowBg) => {
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
      case "startDate":
        return (
          <td key={key} style={style}>
            {formatDateValue(d.startDate) || <span className="text-[#a89482]">-</span>}
          </td>
        )

      case "status": {
        const meta = getStatusMeta(d.status)
        return (
          <td key={key} style={style}>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ backgroundColor: meta.colors.bgColor, color: meta.colors.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.colors.color }} />
              {meta.label}
            </span>
          </td>
        )
      }

      case "vouchers":
        return (
          <td key={key} style={style}>
            {d.vouchers.length > 0 ? (
              <button
                onClick={() => (d.vouchers.length === 1 ? setSelectedVoucher(d.vouchers[0]) : setVoucherPicker(d))}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5f0e1] text-[#4a352f] text-[10px] font-semibold hover:bg-[#e6d7c3]"
                title={d.vouchers.length === 1 ? "View voucher" : "Choose a voucher"}
              >
                <Ticket size={10} /> {d.vouchers.length}
              </button>
            ) : (
              <span className="text-[#a89482] text-[10px]">None</span>
            )}
          </td>
        )

      case "matchPercentage":
        return (
          <td key={key} style={{ ...style, textAlign: "center" }}>
            <span className="font-semibold text-[#7d5a50]">{d.matchPercentage || 0}%</span>
          </td>
        )

      default:
        return (
          <td key={key} style={style}>
            <TruncatedText text={d[key]} maxLength={26} />
          </td>
        )
    }
  }

  if (loading) return <div className="p-10 text-center text-[#7d5a50] text-sm">Loading successful deals...</div>

  if (error) {
    return (
      <div className="p-10 text-center">
        <AlertCircle size={40} className="mx-auto mb-3 text-[#D32F2F]" />
        <p className="text-sm text-[#4a352f] mb-3">Couldn't load your deals: {error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-[#7d5a50] text-white text-xs font-semibold">
          Try again
        </button>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ width: "100%" }}>
      {/* Toolbar */}
      <div className="bg-[#faf7f2] rounded-t-2xl p-4 border border-[#e6d7c3] border-b-0 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-[#4a352f] m-0">Successful Deals</h2>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
              <LayoutGrid size={12} className="text-[#7d5a50] flex-shrink-0" />
              Viewing: {activeView.name}
              {activeView.description && <span className="font-normal text-[#a89482]"> — {activeView.description}</span>}
            </span>
            {vouchers.length > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
                <Ticket size={12} className="text-[#7d5a50] flex-shrink-0" />
                {vouchers.length} voucher{vouchers.length === 1 ? "" : "s"} available
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
                        <span className="text-sm text-[#4a352f] flex-1">Programme / Catalyst</span>
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
               'position: sticky !important' below wins even when the kit's own
               style block is on the page via the matches tab. Sticky is itself
               a positioned ancestor, so the absolutely placed grip and resize
               handle still anchor correctly.
               Prefix is ct- (catalyst table) to avoid colliding with the other
               match tables' styles when they share a page. */
            .ct-th { position: sticky !important; color: #faf7f2 !important; vertical-align: top !important; }
            .ct-th-draggable { cursor: grab; }
            .ct-th-draggable:active { cursor: grabbing; }
            .ct-th-row { display: flex; align-items: flex-start; gap: 2px; min-width: 0; }
            /* overflow-wrap: normal stops the browser splitting inside a word,
               which is what turned "Programme Cohort" into "PROGRAMME COHO.."
               and "Vouchers" into "VOUC HERS" in narrow columns. */
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
                  className="ct-th font-semibold uppercase tracking-wider text-xs top-0 left-0 z-30 text-left"
                  style={{
                    backgroundColor: "#4a352f",
                    width: PROGRAMME_WIDTH,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                    boxShadow: "2px 0 0 #e6d7c3",
                  }}
                >
                  <div className="ct-th-row">
                    <span className="ct-th-label" title="Programme / Catalyst">
                      Programme / Catalyst
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
                      className={`ct-th ct-th-draggable font-semibold uppercase tracking-wider text-xs top-0 select-none transition-opacity ${
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
                          {col.filterType && <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} />}
                        </span>
                      </div>
                      <div className="ct-resize" onMouseDown={(e) => startResize(e, key)} onClick={(e) => e.stopPropagation()} />
                    </th>
                  )
                })}

                {/* Action scrolls horizontally with the table — only top-0, so
                    it still holds position on vertical scroll. */}
                <th
                  className="ct-th text-center font-semibold uppercase tracking-wider text-xs top-0 z-20"
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
              {filteredDeals.length === 0 ? (
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
                        {deals.length === 0 ? "No successful deals yet" : "No deals match these filters"}
                      </p>
                      <p className="text-xs text-[#a89482] m-0">
                        {deals.length === 0
                          ? "Apply to a programme from Catalyst Matches and accepted placements appear here."
                          : "Clear a filter to widen the results."}
                      </p>
                      {activeFilterCount > 0 && deals.length > 0 && (
                        <button onClick={clearAllFilters} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7d5a50] text-white">
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDeals.map((d) => {
                  const rowBg = hoveredRow === d.id ? "#fdf8f4" : "#ffffff"

                  return (
                    <tr
                      key={d.id}
                      onMouseEnter={() => setHoveredRow(d.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ backgroundColor: rowBg, transition: "background-color .15s" }}
                    >
                      {/* Programme / Catalyst — pinned left. */}
                      <td
                        className="sticky left-0 z-10"
                        style={{
                          ...tableCellStyle,
                          width: PROGRAMME_WIDTH,
                          backgroundColor: rowBg,
                          borderRight: "none",
                          boxShadow: "2px 0 0 #e6d7c3",
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-[#4a352f] break-words text-sm">
                            {d.programmeName || d.acceleratorName}
                          </span>
                          <button
                            onClick={() => setSelectedDeal(d)}
                            className="text-[#a89482] hover:text-[#7d5a50] flex-shrink-0"
                            aria-label={`View deal with ${d.acceleratorName}`}
                            title="View deal"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                        {d.programmeName && <div className="text-[10px] text-[#a89482] mt-0.5">{d.acceleratorName}</div>}
                      </td>

                      {orderedColumns.map((key) => renderCell(key, d, rowBg))}

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
                        <button
                          onClick={() => setSelectedDeal(d)}
                          title="View Deal"
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all text-white hover:shadow-md hover:brightness-105"
                          style={{ width: "118px", height: "34px", backgroundColor: "#7d5a50" }}
                        >
                          <ArrowRight size={13} className="flex-shrink-0" />
                          <span className="truncate">View Deal</span>
                        </button>
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
            className="fixed z-[1300] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal flex items-center gap-1.5"
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

            {[
              { type: "name", label: "Programme / catalyst", placeholder: "Search name..." },
              { type: "ticketSize", label: "Ticket Size", placeholder: "Search amount..." },
              { type: "programCohort", label: "Programme Cohort", placeholder: "Search cohort..." },
              { type: "duration", label: "Duration", placeholder: "e.g. 12 months" },
              { type: "equityTaken", label: "Equity Taken", placeholder: "Search equity..." },
              { type: "contractValue", label: "Contract Value", placeholder: "Search value..." },
              { type: "nextMilestone", label: "Next Milestone", placeholder: "Search milestone..." },
              { type: "servicesDelivered", label: "Services Delivered", placeholder: "Search services..." },
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
              { type: "sectorFocus", label: "Sector Focus", options: sectorOptions },
              { type: "fundingType", label: "Funding Type", options: fundingTypeOptions },
              { type: "location", label: "Location", options: locationOptions },
              { type: "status", label: "Status", options: statusOptions },
              { type: "vouchers", label: "Vouchers", options: VOUCHER_BUCKETS },
              { type: "fundingStage", label: "Funding Stage", options: fundingStageOptions },
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

      {/* Voucher picker — replaces the old window.prompt() */}
      {voucherPicker &&
        createPortal(
          <div style={modalOverlayStyle} onClick={() => setVoucherPicker(null)}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-extrabold text-[#4a352f] m-0">Vouchers from {voucherPicker.acceleratorName}</h3>
                <button onClick={() => setVoucherPicker(null)} className="text-[#7d5a50] hover:text-[#4a352f]">
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {voucherPicker.vouchers.map((v) => {
                  const expired = isVoucherExpired(v.expiresAt)
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setVoucherPicker(null)
                        setSelectedVoucher(v)
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl border border-[#e6d7c3] hover:bg-[#faf7f2] transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ backgroundColor: expired ? "#FFEBEE" : "#E8F5E8", color: expired ? "#D32F2F" : "#388E3C" }}
                        >
                          {expired ? "EXPIRED" : "ACTIVE"}
                        </span>
                        <span className="text-sm font-semibold text-[#4a352f]">{getVoucherTypeName(v.type)}</span>
                      </div>
                      <div className="text-[11px] text-[#a89482] flex items-center gap-1">
                        <Clock size={11} /> Received {formatDateTime(v.createdAt)}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Deal detail */}
      {liveSelectedDeal &&
        createPortal(
          <div style={modalOverlayStyle} onClick={() => setSelectedDeal(null)}>
            <div style={{ ...modalContentStyle, maxWidth: "820px", padding: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10 rounded-t-[20px]">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex items-center gap-2">
                    <Trophy size={20} className="text-[#f5f0e1] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Successful deal</p>
                      <h3 className="text-sm font-bold mt-0.5 truncate">
                        {liveSelectedDeal.programmeName || liveSelectedDeal.acceleratorName}
                      </h3>
                    </div>
                  </div>
                  <button onClick={() => setSelectedDeal(null)} className="text-white/70 hover:text-white p-1 flex-shrink-0">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                  {[
                    ["Catalyst", liveSelectedDeal.acceleratorName],
                    ["Sector", liveSelectedDeal.sectorFocus],
                    ["Funding type", liveSelectedDeal.fundingType],
                    ["Funding stage", liveSelectedDeal.fundingStage],
                    ["Ticket size", liveSelectedDeal.ticketSize],
                    ["Contract value", liveSelectedDeal.contractValue],
                    ["Equity taken", liveSelectedDeal.equityTaken],
                    ["Start date", formatDateValue(liveSelectedDeal.startDate) || "-"],
                    ["Duration", liveSelectedDeal.duration],
                    ["Cohort", liveSelectedDeal.programCohort],
                    ["Location", liveSelectedDeal.location],
                    ["Next milestone", liveSelectedDeal.nextMilestone],
                    ["Status", liveSelectedDeal.status],
                    ["Match at application", `${liveSelectedDeal.matchPercentage || 0}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-3 text-sm text-[#4a352f]">
                      <div className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">{label}</div>
                      {value || "-"}
                    </div>
                  ))}
                </div>

                <div className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4 mt-4">
                  <div className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">
                    Services and support
                  </div>
                  <p className="text-sm text-[#7d5a50] m-0 leading-relaxed">{liveSelectedDeal.servicesDelivered}</p>
                </div>

                {liveSelectedDeal.vouchers.length > 0 && (
                  <div className="rounded-lg p-4 mt-4" style={{ backgroundColor: "#E8F5E8", border: "2px solid #388E3C" }}>
                    <h3 className="text-sm font-semibold text-[#2e7d32] mb-3 flex items-center gap-2">
                      <Ticket size={16} /> Vouchers ({liveSelectedDeal.vouchers.length})
                    </h3>
                    <div className="flex flex-col gap-2.5">
                      {liveSelectedDeal.vouchers.map((voucher, idx) => {
                        const expired = isVoucherExpired(voucher.expiresAt)
                        return (
                          <div
                            key={voucher.id}
                            className="flex justify-between items-center gap-3 flex-wrap p-3 rounded-lg"
                            style={{ backgroundColor: expired ? "#FFEBEE" : "white", border: `1px solid ${expired ? "#D32F2F" : "#388E3C"}` }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <strong className="text-xs text-[#4a352f]">#{idx + 1}</strong>
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                                  style={{ backgroundColor: expired ? "#D32F2F" : "#388E3C" }}
                                >
                                  {expired ? "EXPIRED" : "ACTIVE"}
                                </span>
                                <span className="text-xs font-semibold text-[#a67c52]">{getVoucherTypeName(voucher.type)}</span>
                              </div>
                              <div className="text-[11px] text-[#7d5a50]">
                                Received {formatDateTime(voucher.createdAt)} · Expires{" "}
                                {voucher.expiresAt ? formatDateTime(voucher.expiresAt) : "never"}
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedVoucher(voucher)}
                              disabled={expired}
                              className="px-3 py-1.5 rounded-md text-[11px] font-semibold text-white disabled:cursor-not-allowed"
                              style={{ backgroundColor: expired ? "#c8b6a6" : "#7d5a50", opacity: expired ? 0.6 : 1 }}
                            >
                              View voucher
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end p-6 border-t border-[#e6d7c3]">
                <button onClick={() => setSelectedDeal(null)} className="px-5 py-2.5 rounded-lg bg-[#7d5a50] text-white text-sm font-semibold">
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {selectedVoucher && <VoucherView voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Tab shell
   ════════════════════════════════════════════════════════════════════════ */
const AcceleratorTabbedTables = ({ filters, stageFilter, onApplicationSubmitted }) => {
  const [activeTab, setActiveTab] = useState("my-matches")
  const [myMatchesCount, setMyMatchesCount] = useState(0)
  const [successfulDealsCount, setSuccessfulDealsCount] = useState(0)
  const [notification, setNotification] = useState(null)
  const { effectiveUserId, resolved } = useEffectiveUserId()

  const notify = useCallback((type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const TABS = [
    { id: "my-matches", label: "Catalyst Matches", icon: TrendingUp, count: myMatchesCount },
    { id: "successful-deals", label: "Successful Deals", icon: Trophy, count: successfulDealsCount },
  ]

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto", padding: 0 }}>
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

      <div className="flex gap-1 p-1 bg-[#f5f0e1] rounded-t-2xl border border-[#e6d7c3] border-b-0">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all min-h-[52px] ${
                isActive ? "bg-[#4a352f] text-[#faf7f2] shadow-md" : "bg-transparent text-[#7d5a50] hover:bg-white hover:text-[#4a352f]"
              }`}
            >
              <Icon size={17} className="flex-shrink-0" />
              <span className="whitespace-nowrap">{tab.label}</span>
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold flex-shrink-0 ${
                  isActive ? "bg-white/15 text-[#faf7f2]" : "bg-white text-[#7d5a50] border border-[#e6d7c3]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-b-2xl p-6 border border-[#e6d7c3] border-t-0 shadow-lg" style={{ minHeight: "600px" }}>
        {/* Both stay mounted so the tab badges stay accurate */}
        <div style={{ display: activeTab === "my-matches" ? "block" : "none" }}>
          <AcceleratorTable
            filters={filters}
            stageFilter={stageFilter}
            onApplicationSubmitted={onApplicationSubmitted}
            onMatchesCountChange={setMyMatchesCount}
          />
        </div>

        <div style={{ display: activeTab === "successful-deals" ? "block" : "none" }}>
          <SuccessfulAcceleratorDealsTable
            effectiveUserId={effectiveUserId}
            resolved={resolved}
            onCountChange={setSuccessfulDealsCount}
            onNotify={notify}
          />
        </div>
      </div>
    </div>
  )
}

export default AcceleratorTabbedTables