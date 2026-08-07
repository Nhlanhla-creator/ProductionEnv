"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import {
  X,
  Info,
  Trophy,
  Users,
  Star,
  Send,
  RefreshCw,
  MessageSquare,
  Eye,
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
  MoreVertical,
} from "lucide-react"
import { collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { db } from "../../firebaseConfig"
import CustomerTable from "./customer-table"

/* ════════════════════════════════════════════════════════════════════════════
   This file no longer imports ./matchTableKit.

   The kit rendered the header row, and its own <style> block set
   `position: relative` on every <th>, which overrode the sticky positioning.
   The header scrolled away while the pinned body cells stayed frozen —
   customer names sliding over the next column, and the ACTION label drifting
   away from its buttons. The deals table now owns its head, toolbar, filters
   and row actions, identical to the other match tables.
   ════════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════════════
   Ratings.

   The old flow wrote `rating`, `feedback` and `ratingHistory` onto
   supplierApplications/{dealId}, but the table read from the supplierReviews
   collection matched on `where("supplierName", "==", supplierName)`. Nothing
   bridged them, so submitted ratings never surfaced — and matching on a
   display-name string meant two counterparties sharing a name shared reviews.

   One collection, keyed by supplierId, written and read in the same shape.
   customer-table.jsx's match score already reads supplierReviews by
   supplierId, so this makes ratings feed matching too.
   ════════════════════════════════════════════════════════════════════════ */
export const REVIEWS_COLLECTION = "supplierReviews"

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

/* ─── Stars ─────────────────────────────────────────────────────────────── */
const StarRating = ({ rating, onRatingChange, readOnly = true, size = 16 }) => {
  const [hover, setHover] = useState(0)
  const active = hover || rating || 0

  return (
    <div className="flex gap-0.5" onMouseLeave={() => !readOnly && setHover(0)}>
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onRatingChange?.(v)}
          onMouseEnter={() => !readOnly && setHover(v)}
          aria-label={`${v} star${v === 1 ? "" : "s"}`}
          className={readOnly ? "cursor-default" : "cursor-pointer"}
          style={{ background: "none", border: "none", padding: 0, lineHeight: 0 }}
        >
          <Star
            size={size}
            style={{
              color: v <= active ? "#a67c52" : "#e6d7c3",
              fill: v <= active ? "#a67c52" : "none",
              transition: "all 0.15s ease",
            }}
          />
        </button>
      ))}
    </div>
  )
}

/* ─── Rating modal ──────────────────────────────────────────────────────── */
const RatingModal = ({ deal, isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setRating(0)
      setComment("")
      setError(null)
    }
  }, [isOpen, deal?.id])

  if (!isOpen || !deal) return null

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Select a rating before submitting.")
      return
    }
    setSubmitting(true)
    setError(null)
    const ok = await onSubmit({ deal, rating, comment: comment.slice(0, 500) })
    setSubmitting(false)
    if (ok) onClose()
    else setError("Couldn't save that rating. Try again.")
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-[1100] p-4"
      style={{ backgroundColor: "rgba(62,39,35,0.85)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-[560px] w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Rate counterparty</p>
              <h3 className="text-sm font-bold mt-0.5 truncate">{deal.supplierName}</h3>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1 flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {deal.reviews?.length > 0 && (
            <div className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4">
              <h4 className="text-xs font-semibold text-[#4a352f] m-0 mb-2">
                Current average — {deal.reviews.length} review{deal.reviews.length === 1 ? "" : "s"}
              </h4>
              <div className="flex items-center gap-3">
                <StarRating rating={deal.performanceRating} size={17} />
                <span className="text-sm font-semibold text-[#7d5a50]">{deal.performanceRating.toFixed(1)}/5</span>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-[#4a352f] m-0 mb-2">Your rating</h4>
            <StarRating rating={rating} onRatingChange={setRating} readOnly={false} size={30} />
            {rating > 0 && (
              <p className="text-xs text-[#a89482] mt-2 m-0">
                {rating} star{rating === 1 ? "" : "s"}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#4a352f] mb-1.5">
              <MessageSquare size={13} /> Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience on this deal..."
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
            />
            <div className="text-[11px] text-[#a89482] text-right mt-1">{comment.length}/500</div>
          </div>

          {deal.reviews?.length > 0 && (
            <div className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4">
              <h4 className="text-xs font-semibold text-[#4a352f] m-0 mb-2">Previous reviews</h4>
              <div className="flex flex-col gap-2.5 max-h-[160px] overflow-y-auto">
                {deal.reviews.map((r, i) => (
                  <div key={i} className="pb-2 border-b border-[#e6d7c3] last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating rating={r.rating} size={13} />
                      <span className="text-[11px] text-[#a89482]">{formatDateValue(r.date) || ""}</span>
                    </div>
                    {r.comment && <p className="text-xs text-[#7d5a50] m-0">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-[#D32F2F] m-0">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 p-6 border-t border-[#e6d7c3]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-[#7d5a50] border border-[#c8b6a6]">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="px-4 py-2 rounded-lg bg-[#7d5a50] text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
            {submitting ? "Submitting..." : "Submit rating"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Successful deals — column configuration.

   Customer Name is the pinned first column and Action the last, so neither
   appears here — but both resize like everything else, via the reserved width
   keys further down. Every column carries a tooltip, shown from the ⓘ in its
   header, so what a column means never has to be guessed from a two-word
   label.
   ════════════════════════════════════════════════════════════════════════ */
const COLUMN_DEFS = {
  dealAmount: {
    label: "Deal Amount", width: 152, filterType: "dealAmount", visible: true, priority: 2, sortable: true,
    tooltip: "What the deal was worth at close. Sorting uses the underlying number, not the formatted label.",
  },
  dealType: {
    label: "Deal Type", width: 154, filterType: "dealType", visible: true, priority: 3, sortable: true,
    tooltip: "How the work was awarded — RFQ, RFP, tender, purchase order, framework agreement or direct award.",
  },
  completionDate: {
    label: "Completion Date", width: 160, filterType: "completionDate", visible: true, priority: 2, sortable: true,
    tooltip: "When the deal closed or the contract was signed.",
  },
  sector: {
    label: "Sector", width: 158, filterType: "sector", visible: true, priority: 3, sortable: true,
    tooltip: "The industry this deal sits in.",
  },
  location: {
    label: "Location", width: 148, filterType: "location", visible: true, priority: 3, sortable: true,
    tooltip: "Where the goods or services were delivered.",
  },
  rating: {
    label: "Rating", align: "center", width: 158, filterType: "rating", visible: true, priority: 1, sortable: true,
    tooltip: "The average star rating across every review left on this counterparty, with the review count in brackets. Click the star in Action to add yours.",
  },
  currentStatus: {
    label: "Status", width: 148, filterType: "currentStatus", visible: true, priority: 1, sortable: true,
    tooltip: "Where the deal stands now — an active contract, completed, or back under review.",
  },

  dealDuration: {
    label: "Duration", width: 140, filterType: "dealDuration", visible: false, priority: 4, sortable: true,
    tooltip: "How long the contract runs for.",
  },
  dealStructure: {
    label: "Deal Structure", width: 162, filterType: "dealStructure", visible: false, priority: 4, sortable: true,
    tooltip: "How the agreement is put together — fixed price, retainer, milestone-based and so on.",
  },
  contractValue: {
    label: "Contract Value", width: 158, filterType: "contractValue", visible: false, priority: 4, sortable: true,
    tooltip: "The full value of the contract, where it differs from the amount transacted on this deal.",
  },
  nextRenewal: {
    label: "Next Renewal", width: 152, filterType: "nextRenewal", visible: false, priority: 4, sortable: true,
    tooltip: "When the contract comes up for renewal, on contracts that renew.",
  },
  serviceDelivered: {
    label: "Services Delivered", width: 198, filterType: "serviceDelivered", visible: false, priority: 4, sortable: false,
    tooltip: "What was actually supplied under this deal, in the counterparty's own words.",
  },
  supplierType: {
    label: "Supplier Type", width: 152, filterType: "supplierType", visible: false, priority: 4, sortable: true,
    tooltip: "What kind of business the counterparty is — manufacturer, distributor, service provider and so on.",
  },
}

const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS)
const DEFAULT_COLUMN_VISIBILITY = Object.fromEntries(
  DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].visible !== false]),
)
const DEFAULT_PINNED = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, null]))
const DEFAULT_DENSITY = "comfortable"

/* Customer Name and Action can't be hidden or reordered, so they aren't in
   COLUMN_DEFS — but they resize like everything else, and their widths live
   under these reserved keys inside the same columnWidths map. */
const NAME_KEY = "__name__"
const ACTION_KEY = "__action__"
const FIXED_WIDTHS = { [NAME_KEY]: 224, [ACTION_KEY]: 200 }
const MIN_COLUMN_WIDTH = 84

const DEFAULT_COLUMN_WIDTHS = {
  ...Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].width])),
  ...FIXED_WIDTHS,
}

const NAME_TOOLTIP = "The customer this deal was closed with. Click the eye to open the full deal record."
const ACTION_TOOLTIP = "Open the deal, leave a star rating, or use quick actions for more."

const EMPTY_FILTERS = {
  name: "",
  dealAmount: "",
  dealType: [],
  completionFrom: "",
  completionTo: "",
  sector: [],
  location: [],
  ratingRange: [0, 5],
  currentStatus: [],
  dealDuration: "",
  dealStructure: "",
  contractValue: "",
  nextRenewal: "",
  serviceDelivered: "",
  supplierType: [],
}

/* ─── Saved views + filter persistence ──────────────────────────────────── */
const BUILTIN_VIEW_ID = "__default__"
// v3: the two fixed columns now store their widths in this map too, so a v2
// view would leave them undefined.
const VIEWS_STORAGE_KEY = "customer-deals-views-v3"
const FILTERS_STORAGE_KEY = "customer-deals-filters-v1"

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

const DEAL_STATUS_COLORS = {
  "Active Contract": { color: "#E0F2F1", textColor: "#00695C" },
  Completed: { color: "#E8F5E8", textColor: "#388E3C" },
  "Under Review": { color: "#FFF3E0", textColor: "#F57C00" },
}
const dealStatusStyle = (s) => DEAL_STATUS_COLORS[s] || { color: "#F5F5F5", textColor: "#616161" }

/* ════════════════════════════════════════════════════════════════════════════
   Successful deals table
   ════════════════════════════════════════════════════════════════════════ */
const SuccessfulDealsTable = ({ successfulDeals = [], onCountChange, onNotify }) => {
  const [reviewsBySupplier, setReviewsBySupplier] = useState({})
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [dealToRate, setDealToRate] = useState(null)
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
  const [resizingColumn, setResizingColumn] = useState(null)

  // Viewport, for responsive column collapse
  const [viewportWidth, setViewportWidth] = useState(typeof window === "undefined" ? 1440 : window.innerWidth)
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]

  /* One live listener for all reviews rather than an N+1 loop of getDocs per
     deal, and keyed by supplierId rather than by display name. */
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, REVIEWS_COLLECTION),
      (snapshot) => {
        const grouped = {}
        snapshot.forEach((d) => {
          const data = d.data()
          if (!data.supplierId) return
          if (!grouped[data.supplierId]) grouped[data.supplierId] = []
          grouped[data.supplierId].push({ id: d.id, ...data })
        })
        setReviewsBySupplier(grouped)
        setLoadingReviews(false)
      },
      (err) => {
        console.error("Reviews listener failed:", err)
        setLoadingReviews(false)
      },
    )
    return () => unsubscribe()
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

  /* ─── Widths + resize ───────────────────────────────────────────────────
     widthOf is declared here, above startResize, because startResize calls it —
     a const referenced before its initializer throws at render. It covers the
     reorderable columns *and* the two fixed ones, so every column in the table
     can be dragged wider. */
  const widthOf = useCallback(
    (key) => columnWidths[key] ?? COLUMN_DEFS[key]?.width ?? FIXED_WIDTHS[key] ?? 148,
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
      [key]: COLUMN_DEFS[key]?.width ?? FIXED_WIDTHS[key] ?? 148,
    }))

  const ColumnResizer = ({ colKey }) => (
    <div
      className="dt-resize"
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
    const popupWidth = 210
    const popupHeight = 180

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

  /* ─── Data ──────────────────────────────────────────────────────────── */
  const dealsWithRatings = useMemo(
    () =>
      successfulDeals.map((deal) => {
        const reviews = reviewsBySupplier[deal.supplierId] || []
        const average = reviews.length > 0 ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0
        return { ...deal, reviews, performanceRating: Number.parseFloat(average.toFixed(1)) }
      }),
    [successfulDeals, reviewsBySupplier],
  )

  const uniqueOf = useCallback(
    (accessor) => [...new Set(dealsWithRatings.map(accessor).filter((v) => v && v !== "-" && v !== "Not specified"))].sort(),
    [dealsWithRatings],
  )
  const dealTypeOptions = useMemo(() => uniqueOf((d) => d.dealType), [uniqueOf])
  const sectorOptions = useMemo(() => uniqueOf((d) => d.sector), [uniqueOf])
  const locationOptions = useMemo(() => uniqueOf((d) => d.location), [uniqueOf])
  const statusOptions = useMemo(() => uniqueOf((d) => d.currentStatus), [uniqueOf])
  const supplierTypeOptions = useMemo(() => uniqueOf((d) => d.supplierType), [uniqueOf])

  /* ─── Filtering + sorting ───────────────────────────────────────────── */
  const filteredDeals = useMemo(() => {
    const f = localFilters
    const matchesAny = (selected, value) =>
      selected.length === 0 || selected.some((v) => (value || "").toLowerCase().includes(v.toLowerCase()))
    const includesText = (needle, value) =>
      !needle.trim() || (value || "").toString().toLowerCase().includes(needle.toLowerCase().trim())

    const rows = dealsWithRatings.filter((d) => {
      if (!includesText(f.name, d.supplierName)) return false
      if (!includesText(f.dealAmount, d.dealAmount)) return false
      if (!matchesAny(f.dealType, d.dealType)) return false
      if (!matchesAny(f.sector, d.sector)) return false
      if (!matchesAny(f.location, d.location)) return false
      if (f.currentStatus.length > 0 && !f.currentStatus.includes(d.currentStatus)) return false
      if (!includesText(f.dealDuration, d.dealDuration)) return false
      if (!includesText(f.dealStructure, d.dealStructure)) return false
      if (!includesText(f.contractValue, d.contractValue)) return false
      if (!includesText(f.nextRenewal, d.nextRenewal)) return false
      if (!includesText(f.serviceDelivered, d.serviceDelivered)) return false
      if (!matchesAny(f.supplierType, d.supplierType)) return false

      const iso = toISODateOnly(d.completionDate)
      if (f.completionFrom && (!iso || iso < f.completionFrom)) return false
      if (f.completionTo && (!iso || iso > f.completionTo)) return false

      const rating = d.performanceRating || 0
      if (rating < f.ratingRange[0] || rating > f.ratingRange[1]) return false

      return true
    })

    if (sortConfig?.key) {
      const accessors = {
        name: (r) => r.supplierName,
        dealAmount: (r) => Number.parseFloat((r.dealAmount || "").toString().replace(/[^0-9.]/g, "")) || 0,
        dealType: (r) => r.dealType,
        completionDate: (r) => toDateSafe(r.completionDate)?.getTime() ?? 0,
        sector: (r) => r.sector,
        location: (r) => r.location,
        rating: (r) => r.performanceRating || 0,
        currentStatus: (r) => r.currentStatus,
        dealDuration: (r) => r.dealDuration,
        dealStructure: (r) => r.dealStructure,
        contractValue: (r) => r.contractValue,
        nextRenewal: (r) => r.nextRenewal,
        supplierType: (r) => r.supplierType,
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
  }, [dealsWithRatings, localFilters, sortConfig])

  useEffect(() => {
    if (onCountChange) onCountChange(filteredDeals.length)
  }, [filteredDeals, onCountChange])

  /* ─── Filter chrome ─────────────────────────────────────────────────── */
  const f = localFilters
  const activeFilterCount =
    (f.name.trim() ? 1 : 0) +
    (f.dealAmount.trim() ? 1 : 0) +
    f.dealType.length +
    (f.completionFrom || f.completionTo ? 1 : 0) +
    f.sector.length +
    f.location.length +
    (f.ratingRange[0] > 0 || f.ratingRange[1] < 5 ? 1 : 0) +
    f.currentStatus.length +
    (f.dealDuration.trim() ? 1 : 0) +
    (f.dealStructure.trim() ? 1 : 0) +
    (f.contractValue.trim() ? 1 : 0) +
    (f.nextRenewal.trim() ? 1 : 0) +
    (f.serviceDelivered.trim() ? 1 : 0) +
    f.supplierType.length

  const clearAllFilters = () => {
    setLocalFilters({ ...EMPTY_FILTERS })
    setSortConfig(null)
  }

  const getFilterActive = (type) => {
    switch (type) {
      case "completionDate":
        return !!f.completionFrom || !!f.completionTo
      case "rating":
        return f.ratingRange[0] > 0 || f.ratingRange[1] < 5
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

  const nameWidth = widthOf(NAME_KEY)
  const actionWidth = widthOf(ACTION_KEY)

  const stickyOffsets = useMemo(() => {
    const offsets = {}
    // Left-pinned columns stack to the right of the frozen name column.
    let leftAcc = nameWidth
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
  }, [orderedColumns, pinned, widthOf, nameWidth])

  const totalWidth = nameWidth + actionWidth + orderedColumns.reduce((sum, key) => sum + widthOf(key), 0)

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

  /* Writes to the same collection the table reads from, keyed by supplierId. */
  const handleSubmitRating = async ({ deal, rating, comment }) => {
    try {
      const user = getAuth().currentUser
      if (!user) throw new Error("Not authenticated")

      await addDoc(collection(db, REVIEWS_COLLECTION), {
        supplierId: deal.supplierId,
        supplierName: deal.supplierName,
        customerId: user.uid,
        applicationId: deal.id,
        rating,
        comment,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      })

      onNotify?.("success", "Rating submitted")
      return true
    } catch (err) {
      console.error("Error submitting rating:", err)
      onNotify?.("error", `Couldn't submit rating: ${err.message}`)
      return false
    }
  }

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
      case "completionDate":
        return (
          <td key={key} style={style}>
            {formatDateValue(d.completionDate) || <span className="text-[#a89482]">-</span>}
          </td>
        )

      case "rating":
        return (
          <td key={key} style={{ ...style, textAlign: "center" }}>
            <div className="flex flex-col items-center gap-1">
              <StarRating rating={d.performanceRating} size={13} />
              <span className="text-[11px] font-semibold text-[#7d5a50]">
                {d.reviews.length > 0 ? `${d.performanceRating}/5 (${d.reviews.length})` : "No ratings"}
              </span>
            </div>
          </td>
        )

      case "currentStatus": {
        const s = dealStatusStyle(d.currentStatus)
        return (
          <td key={key} style={style}>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ backgroundColor: s.color, color: s.textColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.textColor }} />
              {d.currentStatus}
            </span>
          </td>
        )
      }

      default:
        return (
          <td key={key} style={style}>
            <TruncatedText text={d[key]} maxLength={26} />
          </td>
        )
    }
  }

  if (loadingReviews && successfulDeals.length > 0) {
    return <div className="p-10 text-center text-[#7d5a50] text-sm">Loading deals...</div>
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
                        <GripVertical size={12} className="flex-shrink-0" /> Drag a header to reorder, drag its right edge to
                        resize. Every column resizes, including the pinned ones.
                      </p>

                      <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                        <input type="checkbox" checked disabled className="rounded border-[#c8b6a6]" />
                        <span className="text-sm text-[#4a352f] flex-1">Customer Name</span>
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
               Sticky is itself a positioned ancestor, so the absolutely
               placed grip and resize handle still anchor correctly.
               Prefix is dt- (deals table) to avoid colliding with the other
               match tables' styles when they share a page. */
            .dt-th { color: #faf7f2 !important; vertical-align: top !important; }
            .dt-th-draggable { cursor: grab; }
            .dt-th-draggable:active { cursor: grabbing; }
            .dt-th-row { display: flex; align-items: flex-start; gap: 2px; min-width: 0; }
            /* overflow-wrap: normal stops the browser splitting inside a word,
               which is what turned "Deal Amount" into "DEAL AMO.." and
               "Status" into "STA TUS" in narrow columns. */
            .dt-th-label {
              flex: 1 1 auto; min-width: 0;
              display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
              overflow: hidden; white-space: normal;
              overflow-wrap: normal; word-break: normal; hyphens: none;
              line-height: 1.2; letter-spacing: 0.02em;
            }
            .dt-th-tools { display: flex; align-items: center; flex-shrink: 0; }
            /* The drag grip leaves the flex flow and only appears on hover,
               buying every header ~14px more room for its label. */
            .dt-th-grip { position: absolute; left: 3px; top: 10px; opacity: 0; transition: opacity .15s; }
            .dt-th:hover .dt-th-grip { opacity: .45; }
            .dt-resize { position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: col-resize; z-index: 5; }
            .dt-resize:hover { background: rgba(255,255,255,0.25); }
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
                {/* Customer Name — pinned first column, resizable like the rest */}
                <th
                  className="dt-th font-semibold uppercase tracking-wider text-xs sticky top-0 left-0 z-30 text-left"
                  style={{
                    backgroundColor: "#4a352f",
                    width: nameWidth,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                    boxShadow: "2px 0 0 #e6d7c3",
                  }}
                >
                  <div className="dt-th-row">
                    <span className="dt-th-label" title="Customer Name">
                      Customer Name
                    </span>
                    <span className="dt-th-tools">
                      <SortTrigger columnKey="name" />
                      <FilterTrigger type="name" active={!!localFilters.name.trim()} />
                      <HeaderInfoTooltip text={NAME_TOOLTIP} />
                    </span>
                  </div>
                  <ColumnResizer colKey={NAME_KEY} />
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
                      className={`dt-th dt-th-draggable font-semibold uppercase tracking-wider text-xs sticky top-0 select-none transition-opacity ${
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
                      <GripVertical size={11} className="dt-th-grip" />
                      <div className={`dt-th-row ${col.align === "center" ? "justify-center" : ""}`}>
                        <span className="dt-th-label" title={col.label}>
                          {col.label}
                        </span>
                        <span className="dt-th-tools">
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
                  className="dt-th text-center font-semibold uppercase tracking-wider text-xs sticky top-0 z-20"
                  style={{
                    backgroundColor: "#4a352f",
                    width: actionWidth,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                  }}
                >
                  <div className="dt-th-row justify-center">
                    <span className="dt-th-label">Action</span>
                    <HeaderInfoTooltip text={ACTION_TOOLTIP} />
                  </div>
                  <ColumnResizer colKey={ACTION_KEY} />
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
                        {successfulDeals.length === 0 ? "No successful deals yet" : "No deals match these filters"}
                      </p>
                      <p className="text-xs text-[#a89482] m-0">
                        {successfulDeals.length === 0
                          ? "Accept an application and the deal will appear here."
                          : "Clear a filter to widen the results."}
                      </p>
                      {activeFilterCount > 0 && successfulDeals.length > 0 && (
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
                      {/* Customer Name — pinned left. Name only; sector has its
                          own column. The underlying field is still
                          `supplierName`, which is where this record stores the
                          counterparty. */}
                      <td
                        className="sticky left-0 z-10"
                        style={{
                          ...tableCellStyle,
                          width: nameWidth,
                          backgroundColor: rowBg,
                          borderRight: "none",
                          boxShadow: "2px 0 0 #e6d7c3",
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-[#4a352f] break-words text-sm">{d.supplierName}</span>
                          <button
                            onClick={() => setSelectedDeal(d)}
                            className="text-[#a89482] hover:text-[#7d5a50] flex-shrink-0"
                            aria-label={`View deal with ${d.supplierName}`}
                            title="View deal"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>

                      {orderedColumns.map((key) => renderCell(key, d, rowBg))}

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
                            onClick={() => setSelectedDeal(d)}
                            title="View Deal"
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 text-white hover:shadow-md hover:brightness-105"
                            style={{ width: `${Math.max(96, actionWidth - 82)}px`, height: "34px", backgroundColor: "#7d5a50" }}
                          >
                            <ArrowRight size={13} className="flex-shrink-0" />
                            <span className="truncate">View Deal</span>
                          </button>

                          <button
                            onClick={() => setDealToRate(d)}
                            title="Rate this deal"
                            aria-label="Rate this deal"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-[#f5f0e1] flex-shrink-0"
                            style={{ color: d.reviews.length > 0 ? "#a67c52" : "#c8b6a6" }}
                          >
                            <Star size={14} fill={d.reviews.length > 0 ? "#a67c52" : "none"} />
                          </button>

                          <button
                            onClick={(e) => openPopupFromEvent("quickActions", d, e)}
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

      {/* Quick actions popup */}
      {activePopup?.type === "quickActions" && (
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
              onClick={() => {
                const target = activePopup.row
                closePopup()
                setSelectedDeal(target)
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Eye size={12} /> View Deal
            </button>
            <button
              onClick={() => {
                const target = activePopup.row
                closePopup()
                setDealToRate(target)
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Star size={12} /> Rate this deal
            </button>
            <button
              onClick={() => {
                closePopup()
                onNotify?.("info", '"Message" is not wired up yet.')
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <MessageSquare size={12} /> Message
            </button>
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
            {headerFilterOpen.type === "completionDate" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Completion date</label>
                  {(localFilters.completionFrom || localFilters.completionTo) && (
                    <button
                      onClick={() => setLocalFilters((p) => ({ ...p, completionFrom: "", completionTo: "" }))}
                      className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={localFilters.completionFrom}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, completionFrom: e.target.value }))}
                    className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                  />
                  <span className="text-[#7d5a50] text-xs">to</span>
                  <input
                    type="date"
                    value={localFilters.completionTo}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, completionTo: e.target.value }))}
                    className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                  />
                </div>
              </>
            )}

            {headerFilterOpen.type === "rating" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">
                    Rating: {localFilters.ratingRange[0]} - {localFilters.ratingRange[1]}
                  </label>
                  {(localFilters.ratingRange[0] > 0 || localFilters.ratingRange[1] < 5) && (
                    <button
                      onClick={() => setLocalFilters((p) => ({ ...p, ratingRange: [0, 5] }))}
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
                    max="5"
                    step="0.5"
                    value={localFilters.ratingRange[0]}
                    onChange={(e) =>
                      setLocalFilters((p) => ({
                        ...p,
                        ratingRange: [Math.min(Number.parseFloat(e.target.value) || 0, p.ratingRange[1]), p.ratingRange[1]],
                      }))
                    }
                    className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center"
                  />
                  <span className="text-[#7d5a50]">to</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    value={localFilters.ratingRange[1]}
                    onChange={(e) =>
                      setLocalFilters((p) => ({
                        ...p,
                        ratingRange: [p.ratingRange[0], Math.max(Number.parseFloat(e.target.value) || 0, p.ratingRange[0])],
                      }))
                    }
                    className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={localFilters.ratingRange[0]}
                  onChange={(e) =>
                    setLocalFilters((p) => ({ ...p, ratingRange: [Number.parseFloat(e.target.value), p.ratingRange[1]] }))
                  }
                  className="w-full accent-[#7d5a50]"
                />
              </>
            )}

            {[
              { type: "name", label: "Customer name", placeholder: "Search name..." },
              { type: "dealAmount", label: "Deal Amount", placeholder: "Search amount..." },
              { type: "dealDuration", label: "Duration", placeholder: "e.g. 12 months" },
              { type: "dealStructure", label: "Deal Structure", placeholder: "Search structure..." },
              { type: "contractValue", label: "Contract Value", placeholder: "Search value..." },
              { type: "nextRenewal", label: "Next Renewal", placeholder: "Search renewal..." },
              { type: "serviceDelivered", label: "Services Delivered", placeholder: "Search services..." },
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
              { type: "dealType", label: "Deal Type", options: dealTypeOptions },
              { type: "sector", label: "Sector", options: sectorOptions },
              { type: "location", label: "Location", options: locationOptions },
              { type: "currentStatus", label: "Status", options: statusOptions },
              { type: "supplierType", label: "Supplier Type", options: supplierTypeOptions },
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

      <RatingModal deal={dealToRate} isOpen={!!dealToRate} onClose={() => setDealToRate(null)} onSubmit={handleSubmitRating} />

      {/* Deal detail */}
      {selectedDeal &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center z-[1000] p-4"
            style={{ backgroundColor: "rgba(62,39,35,0.85)", backdropFilter: "blur(4px)" }}
            onClick={() => setSelectedDeal(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-[820px] w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex items-center gap-2">
                    <Trophy size={20} className="text-[#f5f0e1] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Successful deal</p>
                      <h3 className="text-sm font-bold mt-0.5 truncate">{selectedDeal.supplierName}</h3>
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
                    ["Deal amount", selectedDeal.dealAmount],
                    ["Contract value", selectedDeal.contractValue],
                    ["Deal type", selectedDeal.dealType],
                    ["Deal structure", selectedDeal.dealStructure],
                    ["Completion date", formatDateValue(selectedDeal.completionDate) || "-"],
                    ["Duration", selectedDeal.dealDuration],
                    ["Next renewal", selectedDeal.nextRenewal],
                    ["Sector", selectedDeal.sector],
                    ["Location", selectedDeal.location],
                    ["Supplier type", selectedDeal.supplierType],
                    ["Status", selectedDeal.currentStatus],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-3 text-sm text-[#4a352f]">
                      <div className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">{label}</div>
                      {value || "-"}
                    </div>
                  ))}
                </div>

                <div className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4 mt-4">
                  <div className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">
                    Services / products delivered
                  </div>
                  <p className="text-sm text-[#7d5a50] m-0 leading-relaxed">{selectedDeal.serviceDelivered || "-"}</p>
                </div>

                <div className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4 mt-4">
                  <div className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold mb-2">
                    Ratings ({selectedDeal.reviews.length})
                  </div>
                  {selectedDeal.reviews.length > 0 ? (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <StarRating rating={selectedDeal.performanceRating} size={18} />
                        <span className="text-base font-bold text-[#7d5a50]">{selectedDeal.performanceRating}/5</span>
                      </div>
                      <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto">
                        {selectedDeal.reviews.map((r, i) => (
                          <div key={i} className="bg-white border border-[#e6d7c3] rounded p-2.5">
                            <div className="flex items-center gap-2 mb-1">
                              <StarRating rating={r.rating} size={12} />
                              <span className="text-[10px] text-[#a89482]">{formatDateValue(r.date) || ""}</span>
                            </div>
                            {r.comment && <p className="text-xs text-[#7d5a50] m-0">{r.comment}</p>}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[#a89482] m-0">No ratings yet.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between gap-3 p-6 border-t border-[#e6d7c3]">
                <button
                  onClick={() => {
                    setDealToRate(selectedDeal)
                    setSelectedDeal(null)
                  }}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[#7d5a50] border border-[#c8b6a6] flex items-center gap-2"
                >
                  <Star size={15} /> Rate this deal
                </button>
                <button onClick={() => setSelectedDeal(null)} className="px-5 py-2.5 rounded-lg bg-[#7d5a50] text-white text-sm font-semibold">
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Tab shell
   ════════════════════════════════════════════════════════════════════════ */
const CustomerTabbedTables = ({ successfulDeals = [], stageFilter }) => {
  const [activeTab, setActiveTab] = useState("customer-matches")
  const [matchesCount, setMatchesCount] = useState(0)
  const [dealsCount, setDealsCount] = useState(0)
  const [notification, setNotification] = useState(null)

  const notify = useCallback((type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const TABS = [
    { id: "customer-matches", label: "Customer Matches", icon: Users, count: matchesCount },
    { id: "successful-deals", label: "Successful Deals", icon: Trophy, count: dealsCount },
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
        <div style={{ display: activeTab === "customer-matches" ? "block" : "none" }}>
          <CustomerTable stageFilter={stageFilter} onCountChange={setMatchesCount} />
        </div>

        <div style={{ display: activeTab === "successful-deals" ? "block" : "none" }}>
          <SuccessfulDealsTable successfulDeals={successfulDeals} onCountChange={setDealsCount} onNotify={notify} />
        </div>
      </div>
    </div>
  )
}

export default CustomerTabbedTables