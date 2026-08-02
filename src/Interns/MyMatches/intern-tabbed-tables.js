"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import {
  X,
  Trophy,
  Users,
  Star,
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
  RefreshCw,
  Check,
  TrendingUp,
} from "lucide-react"
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { InternTable } from "./intern-table"

/* ════════════════════════════════════════════════════════════════════════════
   intern-tabbed-tables.jsx

   Same chrome and tokens as the advisor tabs: saved views, column
   drag / resize / pin, per-column header filters, sorting, density,
   responsive collapse, a pinned first column and the Customize Table menu.

   The data path is untouched: the same onSnapshot on internshipApplications
   with the same SUCCESS_STATUSES, the same sponsor lookup, the same
   InternToSmsesRatings aggregation, the same absorptionStatus write and the
   same rating submission.

   Selectors are prefixed ih- (intern history) so this table can share a page
   with the others without their <style> blocks fighting.

   Design tokens — do not introduce new ones:
     header #4a352f · header text #faf7f2 · toolbar #faf7f2 · border #e6d7c3
     border2 #c8b6a6 · chip #f5f0e1 · chip active #7d5a50 · accent #a67c52
     muted #a89482 · body text #4a352f
   ════════════════════════════════════════════════════════════════════════ */

// Same success statuses the SME side uses, so an accepted/confirmed deal
// shows on BOTH the Intern and SME sides (includes every status variant).
const SUCCESS_STATUSES = [
  "Accepted",
  "Confirmed",
  "Confirmed/Term Sheet Sign",
  "Active",
  "Contract_signed",
  "Contract Signed",
  "Completed",
  "Successfully Completed",
]

/* ─── Shared primitives ─────────────────────────────────────────────────── */

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
  if (!value || value === "-" || value === "Not specified") return null
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
const StarRating = ({ rating, size = 13, onRatingChange, readOnly = true }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((v) => (
      <button
        key={v}
        type="button"
        onClick={() => !readOnly && onRatingChange?.(v)}
        disabled={readOnly}
        className="p-0 bg-transparent border-none"
        style={{ cursor: readOnly ? "default" : "pointer", lineHeight: 0 }}
        aria-label={`${v} star${v === 1 ? "" : "s"}`}
      >
        <Star
          size={size}
          style={{
            color: v <= (rating || 0) ? "#a67c52" : "#e6d7c3",
            fill: v <= (rating || 0) ? "#a67c52" : "none",
          }}
        />
      </button>
    ))}
  </div>
)

/* ════════════════════════════════════════════════════════════════════════════
   Rate this SMS — same reads and writes, restyled.
   ════════════════════════════════════════════════════════════════════════ */
const SmsRatingModal = ({ internship, isOpen, onClose }) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingRatings, setExistingRatings] = useState([])
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)
  const [formError, setFormError] = useState("")

  // Fetch existing ratings when modal opens
  useEffect(() => {
    const fetchExistingRatings = async () => {
      if (!isOpen || !internship?.sponsorId) return

      setIsLoadingReviews(true)
      try {
        const ratingsRef = collection(db, "InternToSmsesRatings")
        const q = query(ratingsRef, where("sponsorId", "==", internship.sponsorId), orderBy("ratedAt", "desc"))

        const ratingsSnapshot = await getDocs(q)
        const ratingsData = ratingsSnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))

        setExistingRatings(ratingsData)
      } catch (error) {
        console.error("Error fetching SMS ratings:", error)
      } finally {
        setIsLoadingReviews(false)
      }
    }

    fetchExistingRatings()
  }, [isOpen, internship])

  // Calculate average rating
  const averageRating =
    existingRatings.length > 0
      ? existingRatings.reduce((sum, review) => sum + review.rating, 0) / existingRatings.length
      : 0

  const handleSubmit = async () => {
    if (rating === 0) {
      setFormError("Pick a star rating before submitting.")
      return
    }

    setFormError("")
    setIsSubmitting(true)

    try {
      const user = auth.currentUser
      if (!user) {
        setFormError("Log in to submit a rating.")
        setIsSubmitting(false)
        return
      }

      const ratingData = {
        internshipId: internship.id,
        sponsorId: internship.sponsorId,
        sponsorName: internship.sponsorName,
        internId: user.uid,
        internName: internship.applicantName,
        rating: rating,
        comment: comment,
        ratedAt: new Date().toISOString(),
      }

      await addDoc(collection(db, "InternToSmsesRatings"), ratingData)

      // Refresh the ratings list
      const ratingsRef = collection(db, "InternToSmsesRatings")
      const q = query(ratingsRef, where("sponsorId", "==", internship.sponsorId))
      const ratingsSnapshot = await getDocs(q)
      const ratingsData = ratingsSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      setExistingRatings(ratingsData)

      setRating(0)
      setComment("")
      setFormError("")
    } catch (error) {
      console.error("Error saving rating:", error)
      setFormError("That rating didn't save. Try again.")
    }

    setIsSubmitting(false)
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setRating(0)
      setComment("")
      setShowAllReviews(false)
      setFormError("")
    }
  }, [isOpen])

  if (!isOpen || !internship) return null

  const displayedReviews = showAllReviews ? existingRatings : existingRatings.slice(0, 3)

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-[1200] p-4"
      style={{ backgroundColor: "rgba(62,39,35,0.85)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-[640px] w-full max-h-[88vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex items-center gap-2">
              <Star size={20} className="text-[#f5f0e1] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Rate this SMS</p>
                <h3 className="text-sm font-bold mt-0.5 truncate">{internship.sponsorName}</h3>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1 flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Average */}
          <div className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4 text-center">
            <div className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold mb-2">Overall SMS rating</div>
            <div className="flex items-center justify-center gap-3">
              <StarRating rating={Math.round(averageRating)} size={20} />
              <span className="text-xl font-bold text-[#7d5a50]">{averageRating.toFixed(1)}/5</span>
            </div>
            <p className="text-xs text-[#a89482] mt-2 m-0">
              Based on {existingRatings.length} rating{existingRatings.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Your rating */}
          <div className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4 mt-4">
            <div className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold mb-2">Your rating</div>
            <StarRating rating={rating} size={26} readOnly={false} onRatingChange={setRating} />
            {rating > 0 && (
              <p className="text-xs text-[#7d5a50] mt-2 m-0">
                You selected {rating} star{rating !== 1 ? "s" : ""}
              </p>
            )}

            <label className="block text-xs font-semibold text-[#4a352f] mt-4 mb-1.5">Your experience (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="What worked well, and what could be better?"
              className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm resize-y bg-white focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
            />

            {formError && (
              <p className="text-xs text-[#C62828] mt-2 m-0" role="alert">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-[#7d5a50] border border-[#c8b6a6] hover:bg-[#f5f0e1]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="px-5 py-2 rounded-lg bg-[#7d5a50] text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Submit rating
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Reviews */}
          <div className="mt-4">
            {isLoadingReviews ? (
              <div className="text-center py-6 text-[#a89482] text-sm">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                Loading reviews...
              </div>
            ) : existingRatings.length > 0 ? (
              <>
                <div className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold mb-2">
                  What other interns say
                </div>
                <div className="flex flex-col gap-2">
                  {displayedReviews.map((review) => (
                    <div key={review.id} className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-[#4a352f]">{review.internName}</span>
                        <span className="text-[10px] text-[#a89482]">
                          {formatDateValue(review.ratedAt) || ""}
                        </span>
                      </div>
                      <StarRating rating={review.rating} size={13} />
                      {review.comment && <p className="text-xs text-[#7d5a50] mt-2 m-0 leading-relaxed">{review.comment}</p>}
                    </div>
                  ))}
                </div>
                {existingRatings.length > 3 && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="mt-2 text-xs font-semibold text-[#a67c52] hover:text-[#4a352f]"
                  >
                    {showAllReviews ? "Show fewer reviews" : `Show all ${existingRatings.length} reviews`}
                  </button>
                )}
              </>
            ) : (
              <div className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4 text-center">
                <p className="text-sm text-[#7d5a50] m-0">No reviews yet — yours would be the first.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Internship history — column configuration.

   Company is the pinned first column and Action the last, so neither appears
   here. Widths are generous: each header carries a grip, a sort control and a
   filter control, and narrow columns break labels mid-word.
   ════════════════════════════════════════════════════════════════════════ */
const COLUMN_DEFS = {
  fundType: { label: "Monthly Stipend", width: 178, filterType: "fundType", visible: true, priority: 2, sortable: true },
  location: { label: "Location", width: 152, filterType: "location", visible: true, priority: 3, sortable: true },
  completionDate: { label: "Completion Date", width: 172, filterType: "completionDate", visible: true, priority: 3, sortable: true },
  sector: { label: "Sector", width: 158, filterType: "sector", visible: true, priority: 3, sortable: true },
  duration: { label: "Duration", width: 146, filterType: "duration", visible: true, priority: 4, sortable: true },
  rating: { label: "Rating", align: "center", width: 158, filterType: "rating", visible: true, priority: 1, sortable: true },
  status: { label: "Status", width: 158, filterType: "status", visible: true, priority: 1, sortable: true },
  absorptionStatus: { label: "Post-Internship", width: 180, filterType: "absorptionStatus", visible: true, priority: 2, sortable: true },

  role: { label: "Role", width: 182, filterType: "role", visible: false, priority: 4, sortable: true },
  matchScore: { label: "Match %", align: "center", width: 138, filterType: "matchScore", visible: false, priority: 4, sortable: true },
  startDate: { label: "Start Date", width: 152, filterType: null, visible: false, priority: 4, sortable: true },
  appliedDate: { label: "Applied", width: 152, filterType: null, visible: false, priority: 4, sortable: true },
}

const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS)
const DEFAULT_COLUMN_VISIBILITY = Object.fromEntries(
  DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].visible !== false]),
)
const DEFAULT_COLUMN_WIDTHS = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].width]))
const DEFAULT_PINNED = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, null]))
const DEFAULT_DENSITY = "comfortable"

const COMPANY_WIDTH = 230
const ACTION_WIDTH = 190
const MIN_COLUMN_WIDTH = 84

const EMPTY_FILTERS = {
  name: "",
  fundType: "",
  location: [],
  completionFrom: "",
  completionTo: "",
  sector: [],
  duration: [],
  ratingRange: [0, 5],
  status: [],
  absorptionStatus: [],
  role: "",
  matchRange: [0, 100],
}

/* ─── Saved views + filter persistence ──────────────────────────────────── */
const BUILTIN_VIEW_ID = "__default__"
const VIEWS_STORAGE_KEY = "intern-history-views-v1"
const FILTERS_STORAGE_KEY = "intern-history-filters-v1"

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

const STATUS_COLORS = {
  Accepted: { color: "#E0F2F1", textColor: "#00695C" },
  Confirmed: { color: "#E8F5E9", textColor: "#1B5E20" },
  "Confirmed/Term Sheet Sign": { color: "#E8F5E9", textColor: "#1B5E20" },
  Active: { color: "#E8F5E8", textColor: "#388E3C" },
  "Contract Signed": { color: "#E8F5E8", textColor: "#388E3C" },
  Contract_signed: { color: "#E8F5E8", textColor: "#388E3C" },
  Completed: { color: "#f5f0e1", textColor: "#7d5a50" },
  "Successfully Completed": { color: "#f5f0e1", textColor: "#7d5a50" },
}
const statusStyle = (s) => STATUS_COLORS[s] || { color: "#F5F5F5", textColor: "#616161" }

const ABSORPTION_COLORS = {
  "Hired Full-time": { color: "#E8F5E8", textColor: "#388E3C" },
  "Contract Extended": { color: "#E0F2F1", textColor: "#00695C" },
  "Under Review": { color: "#fff3e0", textColor: "#e65100" },
  "Not Continuing": { color: "#FFEBEE", textColor: "#C62828" },
}
const absorptionStyle = (s) => ABSORPTION_COLORS[s] || { color: "#f5f0e1", textColor: "#a89482" }

/* ════════════════════════════════════════════════════════════════════════════
   Internship history table
   ════════════════════════════════════════════════════════════════════════ */
const SuccessfulInternshipsTable = ({ internships = [], loading, onCountChange, onNotify, onRate }) => {
  const [selectedInternship, setSelectedInternship] = useState(null)
  const [postInternshipStatus, setPostInternshipStatus] = useState("")
  const [hoveredRow, setHoveredRow] = useState(null)

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
  const uniqueOf = useCallback(
    (accessor) =>
      [...new Set(internships.map(accessor).filter((v) => v && v !== "-" && v !== "Not specified"))].sort(),
    [internships],
  )
  const locationOptions = useMemo(() => uniqueOf((d) => d.location), [uniqueOf])
  const sectorOptions = useMemo(() => uniqueOf((d) => d.sector), [uniqueOf])
  const durationOptions = useMemo(() => uniqueOf((d) => d.duration), [uniqueOf])
  const absorptionOptions = useMemo(() => {
    const found = uniqueOf((d) => d.absorptionStatus)
    return found.length > 0 ? found : ["Hired Full-time", "Contract Extended", "Under Review", "Not Continuing"]
  }, [uniqueOf])
  const statusOptions = useMemo(() => {
    const found = uniqueOf((d) => d.status)
    return found.length > 0 ? found : SUCCESS_STATUSES
  }, [uniqueOf])

  /* ─── Filtering + sorting ───────────────────────────────────────────── */
  const filteredInternships = useMemo(() => {
    const f = localFilters
    const matchesAny = (selected, value) =>
      selected.length === 0 || selected.some((v) => (value || "").toLowerCase().includes(v.toLowerCase()))
    const includesText = (needle, value) =>
      !needle.trim() || (value || "").toString().toLowerCase().includes(needle.toLowerCase().trim())

    const rows = internships.filter((d) => {
      if (!includesText(f.name, d.sponsorName)) return false
      if (!includesText(f.fundType, d.fundType)) return false
      if (!matchesAny(f.location, d.location)) return false
      if (!matchesAny(f.sector, d.sector)) return false
      if (!matchesAny(f.duration, d.duration)) return false
      if (f.status.length > 0 && !f.status.includes(d.status)) return false
      if (f.absorptionStatus.length > 0 && !f.absorptionStatus.includes(d.absorptionStatus)) return false
      if (!includesText(f.role, d.role)) return false

      const iso = toISODateOnly(d.completionDate)
      if (f.completionFrom && (!iso || iso < f.completionFrom)) return false
      if (f.completionTo && (!iso || iso > f.completionTo)) return false

      const rating = Number(d.rating) || 0
      if (rating < f.ratingRange[0] || rating > f.ratingRange[1]) return false

      const match = d.matchScore || 0
      if (match < f.matchRange[0] || match > f.matchRange[1]) return false

      return true
    })

    if (sortConfig?.key) {
      const accessors = {
        name: (r) => r.sponsorName,
        fundType: (r) => r.fundType,
        location: (r) => r.location,
        completionDate: (r) => toDateSafe(r.completionDate)?.getTime() ?? 0,
        sector: (r) => r.sector,
        duration: (r) => r.duration,
        rating: (r) => Number(r.rating) || 0,
        status: (r) => r.status,
        absorptionStatus: (r) => r.absorptionStatus,
        role: (r) => r.role,
        matchScore: (r) => r.matchScore || 0,
        startDate: (r) => toDateSafe(r.startDate)?.getTime() ?? 0,
        appliedDate: (r) => toDateSafe(r.appliedDate)?.getTime() ?? 0,
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
  }, [internships, localFilters, sortConfig])

  useEffect(() => {
    if (onCountChange) onCountChange(filteredInternships.length)
  }, [filteredInternships, onCountChange])

  /* ─── Filter chrome ─────────────────────────────────────────────────── */
  const f = localFilters
  const activeFilterCount =
    (f.name.trim() ? 1 : 0) +
    (f.fundType.trim() ? 1 : 0) +
    f.location.length +
    (f.completionFrom || f.completionTo ? 1 : 0) +
    f.sector.length +
    f.duration.length +
    (f.ratingRange[0] > 0 || f.ratingRange[1] < 5 ? 1 : 0) +
    f.status.length +
    f.absorptionStatus.length +
    (f.role.trim() ? 1 : 0) +
    (f.matchRange[0] > 0 || f.matchRange[1] < 100 ? 1 : 0)

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
      case "matchScore":
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
    // Left-pinned columns stack to the right of the frozen Company column.
    let leftAcc = COMPANY_WIDTH
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

  const totalWidth = COMPANY_WIDTH + ACTION_WIDTH + orderedColumns.reduce((sum, key) => sum + widthOf(key), 0)

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

  /* ─── Post-internship status write (unchanged) ──────────────────────── */
  const handleUpdatePostInternshipStatus = async (internship) => {
    try {
      if (!postInternshipStatus) return

      // Update the internship application with the post-internship status
      await updateDoc(doc(db, "internshipApplications", internship.id), {
        absorptionStatus: postInternshipStatus,
        statusUpdatedAt: new Date().toISOString(),
      })

      onNotify?.("success", "Post-internship status updated")
      setSelectedInternship(null)
      setPostInternshipStatus("")
    } catch (error) {
      console.error("Error updating post-internship status:", error)
      onNotify?.("error", "That status didn't save. Try again.")
    }
  }

  const handleViewDetails = (internship) => {
    setSelectedInternship(internship)
    setPostInternshipStatus(internship.absorptionStatus || "")
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
      case "fundType":
        return (
          <td key={key} style={style}>
            <span className="inline-block px-2 py-0.5 rounded-full bg-[#f5f0e1] text-[#4a352f] text-[10px] font-medium">
              {d.fundType || "Not specified"}
            </span>
          </td>
        )

      case "completionDate":
      case "startDate":
      case "appliedDate":
        return (
          <td key={key} style={style}>
            {formatDateValue(d[key]) || <span className="text-[#a89482]">-</span>}
          </td>
        )

      case "status": {
        const s = statusStyle(d.status)
        return (
          <td key={key} style={style}>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ backgroundColor: s.color, color: s.textColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.textColor }} />
              {d.status}
            </span>
          </td>
        )
      }

      case "absorptionStatus": {
        const s = absorptionStyle(d.absorptionStatus)
        return (
          <td key={key} style={style}>
            <span
              className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
              style={{ backgroundColor: s.color, color: s.textColor }}
            >
              {d.absorptionStatus || "Not specified"}
            </span>
          </td>
        )
      }

      case "rating": {
        const rating = Number(d.rating) || 0
        return (
          <td key={key} style={{ ...style, textAlign: "center" }}>
            <div className="flex flex-col items-center gap-1">
              <StarRating rating={Math.round(rating)} size={13} />
              <span className="text-[11px] font-semibold text-[#7d5a50]">
                {rating > 0 ? `${rating.toFixed(1)}/5` : "Not rated"}
              </span>
              {d.reviewsCount > 0 && (
                <span className="text-[10px] text-[#a89482]">
                  {d.reviewsCount} review{d.reviewsCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </td>
        )
      }

      case "matchScore":
        return (
          <td key={key} style={{ ...style, textAlign: "center" }}>
            <span className="font-semibold text-[#7d5a50]">{d.matchScore || 0}%</span>
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

  if (loading) {
    return <div className="p-10 text-center text-[#7d5a50] text-sm">Loading internship history...</div>
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
            <h2 className="text-lg font-bold text-[#4a352f] m-0">Internship History</h2>
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
                        <GripVertical size={12} className="flex-shrink-0" /> Drag a header to reorder, drag its right edge to resize.
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
               puts a global 'position: relative' on every th. Prefix is
               ih- (intern history) so the match tables can share a page. */
            .ih-th { position: sticky !important; color: #faf7f2 !important; vertical-align: top !important; }
            .ih-th-draggable { cursor: grab; }
            .ih-th-draggable:active { cursor: grabbing; }
            .ih-th-row { display: flex; align-items: flex-start; gap: 2px; min-width: 0; }
            /* overflow-wrap: normal stops the browser splitting inside a word,
               which is what turned "Post-Internship" into "POST-INTERN.." */
            .ih-th-label {
              flex: 1 1 auto; min-width: 0;
              display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
              overflow: hidden; white-space: normal;
              overflow-wrap: normal; word-break: normal; hyphens: none;
              line-height: 1.2; letter-spacing: 0.02em;
            }
            .ih-th-tools { display: flex; align-items: center; flex-shrink: 0; }
            .ih-th-grip { position: absolute; left: 3px; top: 10px; opacity: 0; transition: opacity .15s; }
            .ih-th:hover .ih-th-grip { opacity: .45; }
            .ih-resize { position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: col-resize; }
            .ih-resize:hover { background: rgba(255,255,255,0.25); }
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
                  className="ih-th font-semibold uppercase tracking-wider text-xs top-0 left-0 z-30 text-left"
                  style={{
                    backgroundColor: "#4a352f",
                    width: COMPANY_WIDTH,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                    boxShadow: "2px 0 0 #e6d7c3",
                  }}
                >
                  <div className="ih-th-row">
                    <span className="ih-th-label" title="Company">
                      Business Name
                    </span>
                    <span className="ih-th-tools">
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
                      className={`ih-th ih-th-draggable font-semibold uppercase tracking-wider text-xs top-0 select-none transition-opacity ${
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
                      <GripVertical size={11} className="ih-th-grip" />
                      <div className={`ih-th-row ${col.align === "center" ? "justify-center" : ""}`}>
                        <span className="ih-th-label" title={col.label}>
                          {col.label}
                        </span>
                        <span className="ih-th-tools">
                          {pinned[key] && <Pin size={10} className="opacity-60 mt-0.5" />}
                          {col.sortable && <SortTrigger columnKey={key} />}
                          {col.filterType && <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} />}
                        </span>
                      </div>
                      <div className="ih-resize" onMouseDown={(e) => startResize(e, key)} onClick={(e) => e.stopPropagation()} />
                    </th>
                  )
                })}

                <th
                  className="ih-th text-center font-semibold uppercase tracking-wider text-xs top-0 z-20"
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
              {filteredInternships.length === 0 ? (
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
                        {internships.length === 0 ? "No internships here yet" : "No internships match these filters"}
                      </p>
                      <p className="text-xs text-[#a89482] m-0 max-w-md">
                        {internships.length === 0
                          ? "Once a sponsor confirms a placement, it lands here with the stipend, dates, rating and what happened afterwards."
                          : "Clear a filter to widen the results."}
                      </p>
                      {activeFilterCount > 0 && internships.length > 0 && (
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
                filteredInternships.map((d) => {
                  const rowBg = hoveredRow === d.id ? "#fdf8f4" : "#ffffff"

                  return (
                    <tr
                      key={d.id}
                      onMouseEnter={() => setHoveredRow(d.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ backgroundColor: rowBg, transition: "background-color .15s" }}
                    >
                      {/* Company — pinned left, sector underneath. */}
                      <td
                        className="sticky left-0 z-10"
                        style={{
                          ...tableCellStyle,
                          width: COMPANY_WIDTH,
                          backgroundColor: rowBg,
                          borderRight: "none",
                          boxShadow: "2px 0 0 #e6d7c3",
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-[#4a352f] break-words text-sm">{d.sponsorName}</span>
                          <button
                            onClick={() => handleViewDetails(d)}
                            className="text-[#a89482] hover:text-[#7d5a50] flex-shrink-0"
                            aria-label={`View internship with ${d.sponsorName}`}
                            title="View internship"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                        {d.sector && d.sector !== "-" && (
                          <div className="text-[10px] text-[#a89482] mt-0.5">{d.sector}</div>
                        )}
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
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => handleViewDetails(d)}
                            title="View internship"
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all text-white hover:brightness-105 px-2.5 py-1.5 bg-[#7d5a50]"
                          >
                            <ArrowRight size={13} className="flex-shrink-0" />
                            <span className="truncate">View details</span>
                          </button>
                          <button
                            onClick={() => onRate?.(d)}
                            title={`Rate ${d.sponsorName}`}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap px-2.5 py-1.5 text-[#7d5a50] border border-[#c8b6a6] hover:bg-[#f5f0e1] transition-colors"
                          >
                            <Star size={13} className="flex-shrink-0" />
                            <span className="truncate">Rate SMS</span>
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
                <p className="text-[10px] text-[#a89482] mt-2">Internships without a completion date are hidden while this filter is on.</p>
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

            {headerFilterOpen.type === "matchScore" && (
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
              { type: "name", label: "Company name", placeholder: "Search company..." },
              { type: "fundType", label: "Monthly Stipend", placeholder: "Search stipend..." },
              { type: "role", label: "Role", placeholder: "Search role..." },
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
              { type: "location", label: "Location", options: locationOptions },
              { type: "sector", label: "Sector", options: sectorOptions },
              { type: "duration", label: "Duration", options: durationOptions },
              { type: "status", label: "Status", options: statusOptions },
              { type: "absorptionStatus", label: "Post-Internship", options: absorptionOptions },
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

      {/* Internship detail */}
      {selectedInternship &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center z-[1000] p-4"
            style={{ backgroundColor: "rgba(62,39,35,0.85)", backdropFilter: "blur(4px)" }}
            onClick={() => setSelectedInternship(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-[880px] w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex items-center gap-2">
                    <Trophy size={20} className="text-[#f5f0e1] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Internship experience</p>
                      <h3 className="text-sm font-bold mt-0.5 truncate">{selectedInternship.sponsorName}</h3>
                    </div>
                  </div>
                  <button onClick={() => setSelectedInternship(null)} className="text-white/70 hover:text-white p-1 flex-shrink-0">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                  {[
                    ["Monthly stipend", selectedInternship.fundType],
                    ["Total earnings", selectedInternship.contractValue],
                    ["Internship role", selectedInternship.role],
                    ["Sector", selectedInternship.sector],
                    ["Location", selectedInternship.location],
                    ["Funding", selectedInternship.funding],
                    ["Start date", formatDateValue(selectedInternship.startDate) || "-"],
                    ["Applied date", formatDateValue(selectedInternship.appliedDate) || "-"],
                    ["Completion date", formatDateValue(selectedInternship.completionDate) || "-"],
                    ["Duration", selectedInternship.duration],
                    ["Status", selectedInternship.status],
                    ["Post-internship outcome", selectedInternship.absorptionStatus],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-3 text-sm text-[#4a352f]">
                      <div className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">{label}</div>
                      {value || "Not specified"}
                    </div>
                  ))}
                </div>

                <div className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4 mt-4">
                  <div className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold mb-2">Rating</div>
                  {Number(selectedInternship.rating) > 0 ? (
                    <div className="flex items-center gap-3">
                      <StarRating rating={Math.round(Number(selectedInternship.rating))} size={18} />
                      <span className="text-base font-bold text-[#7d5a50]">
                        {Number(selectedInternship.rating).toFixed(1)}/5
                      </span>
                      {selectedInternship.reviewsCount > 0 && (
                        <span className="text-xs text-[#a89482]">
                          {selectedInternship.reviewsCount} review{selectedInternship.reviewsCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-[#a89482] m-0">Not rated yet.</p>
                  )}
                </div>

                {selectedInternship.matchAnalysis && (
                  <div className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4 mt-4">
                    <div className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold mb-3">
                      Match analysis
                    </div>
                    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                      <div className="text-center">
                        <div className="text-2xl font-extrabold text-[#7d5a50]">
                          {selectedInternship.matchAnalysis.overallScore}%
                        </div>
                        <div className="text-xs text-[#a89482]">Overall match score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-extrabold text-[#7d5a50]">{selectedInternship.fundType || "N/A"}</div>
                        <div className="text-xs text-[#a89482]">Stipend</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-extrabold text-[#7d5a50]">
                          {selectedInternship.absorptionStatus || "N/A"}
                        </div>
                        <div className="text-xs text-[#a89482]">Career outcome</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Post-internship status */}
                <div className="bg-[#faf7f2] border border-[#e6d7c3] rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[#a89482] font-semibold mb-2">
                    <TrendingUp size={12} /> Update post-internship status
                  </div>
                  <select
                    value={postInternshipStatus}
                    onChange={(e) => setPostInternshipStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm bg-white text-[#4a352f]"
                  >
                    <option value="">Select status...</option>
                    <option value="Hired Full-time">Hired Full-time</option>
                    <option value="Contract Extended">Contract Extended</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Not Continuing">Not Continuing</option>
                  </select>
                  <button
                    onClick={() => handleUpdatePostInternshipStatus(selectedInternship)}
                    disabled={!postInternshipStatus}
                    className="mt-3 px-4 py-2 rounded-lg bg-[#7d5a50] text-white text-sm font-semibold disabled:opacity-40"
                  >
                    Update status
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-6 border-t border-[#e6d7c3]">
                <button
                  onClick={() => {
                    const internship = selectedInternship
                    setSelectedInternship(null)
                    onRate?.(internship)
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-[#7d5a50] border border-[#c8b6a6] hover:bg-[#f5f0e1] inline-flex items-center gap-1.5"
                >
                  <Star size={14} /> Rate this SMS
                </button>
                <button
                  onClick={() => setSelectedInternship(null)}
                  className="px-5 py-2.5 rounded-lg bg-[#7d5a50] text-white text-sm font-semibold"
                >
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
const InternTabbedTables = ({ filters, stageFilter, loading, matchesCount }) => {
  const [activeTab, setActiveTab] = useState("my-matches")
  const [tableMatchesCount, setTableMatchesCount] = useState(null)
  const [internshipsCount, setInternshipsCount] = useState(0)
  const [internships, setInternships] = useState([])
  const [loadingInternships, setLoadingInternships] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)
  const [notification, setNotification] = useState(null)
  const [ratingInternship, setRatingInternship] = useState(null)
  const [showRatingModal, setShowRatingModal] = useState(false)

  const notify = useCallback((type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const refreshData = () => setRefreshCount((prev) => prev + 1)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      setLoadingInternships(false)
      return undefined
    }

    const q = query(
      collection(db, "internshipApplications"),
      where("applicantId", "==", user.uid),
      where("status", "in", SUCCESS_STATUSES),
    )

    // Real-time listener: updates the moment the SME changes a status (no refresh needed).
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const successfulApps = []

          for (const docSnap of snapshot.docs) {
            const appData = docSnap.data()

            // Get sponsor details
            let sponsorData = {}
            try {
              const sponsorDoc = await getDoc(doc(db, "universalProfiles", appData.sponsorId))
              if (sponsorDoc.exists()) {
                sponsorData = sponsorDoc.data()
              }
            } catch (error) {
              console.error("Error fetching sponsor data:", error)
            }

            // ⭐ FETCH SMS RATINGS: Get average rating for this SMS
            let avgRating = null
            let reviewCount = 0
            try {
              if (appData.sponsorId) {
                const smsRatingsRef = collection(db, "InternToSmsesRatings")
                const ratingsQuery = query(smsRatingsRef, where("sponsorId", "==", appData.sponsorId))
                const ratingsSnap = await getDocs(ratingsQuery)

                if (!ratingsSnap.empty) {
                  const ratings = ratingsSnap.docs.map((r) => r.data().rating || 0)
                  reviewCount = ratings.length
                  avgRating = ratings.reduce((sum, r) => sum + r, 0) / reviewCount
                }
              }
            } catch (error) {
              console.error("Error fetching ratings from InternToSmsesRatings:", error)
            }

            successfulApps.push({
              id: docSnap.id,
              ...appData,
              sponsorData,
              rating: avgRating,
              performanceRating: avgRating ? `${avgRating.toFixed(1)}/5` : "Not Rated",
              reviewsCount: reviewCount,
              matchScore: appData.matchAnalysis?.overallScore || 0,
              absorptionStatus: appData.absorptionStatus || "Not specified",
            })
          }

          setInternships(successfulApps)
        } catch (error) {
          console.error("Error fetching successful internships:", error)
        } finally {
          setLoadingInternships(false)
        }
      },
      (error) => {
        console.error("Error in successful internships listener:", error)
        setLoadingInternships(false)
      },
    )

    return () => unsubscribe()
  }, [refreshCount])

  const handleRate = (internship) => {
    setRatingInternship(internship)
    setShowRatingModal(true)
  }

  const TABS = [
    { id: "my-matches", label: "My Matches", icon: Users, count: tableMatchesCount ?? matchesCount ?? 0 },
    { id: "internship-history", label: "My Internship History", icon: Trophy, count: internshipsCount },
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
          <InternTable
            filters={filters}
            stageFilter={stageFilter}
            onRefresh={refreshData}
            onCountChange={setTableMatchesCount}
          />
        </div>

        <div style={{ display: activeTab === "internship-history" ? "block" : "none" }}>
          <SuccessfulInternshipsTable
            internships={internships}
            loading={loading || loadingInternships}
            onCountChange={setInternshipsCount}
            onNotify={notify}
            onRate={handleRate}
          />
        </div>
      </div>

      <SmsRatingModal
        internship={ratingInternship}
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
      />
    </div>
  )
}

export default InternTabbedTables