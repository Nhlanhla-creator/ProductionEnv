"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import {
  Eye,
  X,
  Info,
  Trophy,
  Calendar,
  Users,
  MapPin,
  GraduationCap,
  Briefcase,
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
  ArrowRight,
  Pin,
  PinOff,
} from "lucide-react"
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { db, auth } from "../../firebaseConfig"
import { InternTablePage } from "./intern-table"

/* ════════════════════════════════════════════════════════════════════════════
   Successful intern deals.

   Layout model matches the other match tables: explicit widths,
   `table-layout: fixed`, separate borders (collapsed borders get dropped by
   sticky cells, which made the pinned column lose its edge), and
   `overflow-wrap: normal` so labels wrap between words or truncate, never
   mid-word — that last rule is what stopped "MONTHLY STIP.." and
   "SPECIALIZ ATION".

   Every column resizes, including the pinned Intern Name column and the
   Action column, whose widths live under reserved keys in the same
   columnWidths map. Every column carries a tooltip, shown from the ⓘ in its
   header.

   InternTablePage (the applications tab) shares a page with this table, so
   every selector is prefixed it- (intern deals) and the sticky headers declare
   `position: sticky !important` in case the applications table ever ships a
   global <th> rule of its own.
   ════════════════════════════════════════════════════════════════════════ */

/* ────────────────────────────────────────────────────────────────────────────
   Design tokens — identical to intern-table.jsx so the two tabs read as one
   surface. Do not introduce new colours here; if the palette changes, change
   it in both files.

   header      #4a352f      toolbar bg   #faf7f2      chip bg     #f5f0e1
   header text #faf7f2      border       #e6d7c3      chip active #7d5a50
   body text   #4a352f      border 2     #c8b6a6      accent      #a67c52
   muted       #a89482      primary btn  #7d5a50
   ──────────────────────────────────────────────────────────────────────── */

const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

/* Portaled to <body> because the header cell is sticky and would otherwise
   clip the bubble. */
const HeaderInfoTooltip = ({ text }) => {
  const [rect, setRect] = useState(null)
  if (!text) return null
  return (
    <span
      className="inline-flex"
      onMouseEnter={(e) => setRect(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setRect(null)}
    >
      <Info size={12} style={{ color: "#d9c7b8" }} className="opacity-80 hover:opacity-100" />
      {rect && (
        <PopupPortal>
          <div
            className="fixed z-[1400] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal"
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

/* Firestore hands back Timestamps as well as ISO strings — `new Date(value)`
   alone returned Invalid Date for the former, so dates silently read
   "Not specified" and date sorting collapsed to 0. */
const toDateSafe = (value) => {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value?.toDate === "function") return value.toDate()
  if (value?.seconds != null) return new Date(value.seconds * 1000)
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const formatDate = (value) => {
  const d = toDateSafe(value)
  if (!d) return "Not specified"
  return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
}

const toISODateOnly = (value) => {
  const d = toDateSafe(value)
  if (!d) return ""
  return d.toISOString().slice(0, 10)
}

const parseRating = (rating) => {
  if (rating === null || rating === undefined) return 0
  const value = Number.parseFloat(rating.toString().split("/")[0])
  return Number.isNaN(value) ? 0 : value
}

const DEAL_STATUS_TYPES = {
  Accepted: { color: "#E8F5E8", textColor: "#388E3C" },
  Confirmed: { color: "#E8F5E8", textColor: "#388E3C" },
  "Confirmed/Term Sheet Sign": { color: "#E8F5E8", textColor: "#388E3C" },
  Active: { color: "#FFF3E0", textColor: "#F57C00" },
  Completed: { color: "#F3E5F5", textColor: "#7B1FA2" },
}

const getDealStatusStyle = (status) => DEAL_STATUS_TYPES[status] || { color: "#F5F5F5", textColor: "#666666" }

const getRatingColor = (rating) => {
  const score = parseRating(rating)
  if (score >= 4.5) return "#22c55e"
  if (score >= 3.5) return "#f59e0b"
  return "#ef4444"
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
  animation: "fadeIn 0.3s ease-out",
  backdropFilter: "blur(4px)",
}

const modalContentStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "20px",
  maxWidth: "900px",
  width: "100%",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
  animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
  position: "relative",
}

/* Company-membership resolution — same rule intern-table.jsx uses, so the
   deals tab and the applications tab always resolve to the same sponsor.
   Wrapped in onAuthStateChanged so a cold page load doesn't silently read
   auth.currentUser before Firebase has restored the session. */
const useEffectiveUserId = () => {
  const [effectiveUserId, setEffectiveUserId] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setEffectiveUserId(null)
        return
      }
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid))
        const companyId = userSnap.exists() ? userSnap.data().companyId : null

        if (companyId) {
          const companySnap = await getDoc(doc(db, "companies", companyId))
          if (companySnap.exists()) {
            const ownerId = companySnap.data().createdBy
            setEffectiveUserId(ownerId || user.uid)
            return
          }
        }
        setEffectiveUserId(user.uid)
      } catch (error) {
        console.error("Error resolving company membership:", error)
        setEffectiveUserId(user.uid)
      }
    })

    return () => unsubscribe()
  }, [])

  return effectiveUserId
}

/* ════════════════════════════════════════════════════════════════════════════
   Column configuration.

   Intern Name is the pinned first column and Action the last, so neither
   appears here — but both resize like everything else, via the reserved width
   keys further down. Every column carries a tooltip. Institution and Degree
   start hidden so the default view fits a laptop; they stay available in the
   Columns menu.
   ════════════════════════════════════════════════════════════════════════ */
const COLUMN_DEFS = {
  stipend: {
    label: "Monthly Stipend",
    width: 180,
    filterType: "stipend",
    visible: true,
    priority: 2,
    sortable: true,
    tooltip: "What the intern is paid each month, taken from the internship request where one was captured.",
  },
  programType: {
    label: "Program Type",
    width: 170,
    filterType: "programType",
    visible: true,
    priority: 2,
    sortable: true,
    tooltip: "The kind of placement — internship, learnership, graduate programme and so on.",
  },
  startDate: {
    label: "Start Date",
    width: 152,
    filterType: "startDate",
    visible: true,
    priority: 3,
    sortable: true,
    tooltip: "When the placement begins, or when it was completed if no start date was captured.",
  },
  specialization: {
    label: "Specialization",
    width: 176,
    filterType: "specialization",
    visible: true,
    priority: 3,
    sortable: true,
    tooltip: "The field the intern works in — their area of study or discipline.",
  },
  location: {
    label: "Location",
    width: 152,
    filterType: "location",
    visible: true,
    priority: 3,
    sortable: true,
    tooltip: "Where the placement is based.",
  },
  duration: {
    label: "Duration",
    width: 146,
    filterType: "duration",
    visible: true,
    priority: 3,
    sortable: true,
    tooltip: "How long the placement runs for.",
  },
  rating: {
    label: "Rating",
    align: "center",
    width: 140,
    filterType: "rating",
    visible: true,
    priority: 1,
    sortable: true,
    tooltip: "The performance rating recorded against this placement, out of five.",
  },
  status: {
    label: "Program Status",
    width: 178,
    filterType: "status",
    visible: true,
    priority: 1,
    sortable: true,
    tooltip: "Where the placement stands now — accepted, confirmed, active or completed.",
  },
  institution: {
    label: "Institution",
    width: 180,
    filterType: "institution",
    visible: false,
    priority: 4,
    sortable: true,
    tooltip: "The university, college or TVET the intern studies at.",
  },
  degree: {
    label: "Degree",
    width: 158,
    filterType: "degree",
    visible: false,
    priority: 4,
    sortable: true,
    tooltip: "The qualification the intern is working towards or has completed.",
  },
}

const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS)

const DEFAULT_COLUMN_VISIBILITY = Object.fromEntries(
  DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].visible !== false]),
)

const DEFAULT_PINNED = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, null]))
const DEFAULT_DENSITY = "comfortable"

/* Intern Name and Action can't be hidden or reordered, so they aren't in
   COLUMN_DEFS — but they resize like everything else, and their widths live
   under these reserved keys inside the same columnWidths map. */
const NAME_KEY = "__name__"
const ACTION_KEY = "__action__"
const FIXED_WIDTHS = { [NAME_KEY]: 230, [ACTION_KEY]: 180 }
const MIN_COLUMN_WIDTH = 84

const DEFAULT_COLUMN_WIDTHS = {
  ...Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].width])),
  ...FIXED_WIDTHS,
}

const NAME_TOOLTIP =
  "The intern on this placement, with location and intern type underneath. Click the eye to open the full record."
const ACTION_TOOLTIP = "Open the full placement record — contact details, education, skills and documents."

const EMPTY_FILTERS = {
  name: "",
  stipend: "",
  programType: [],
  startFrom: "",
  startTo: "",
  specialization: [],
  location: [],
  duration: [],
  ratingRange: [0, 5],
  status: [],
  institution: [],
  degree: [],
}

/* ─── Saved views — own storage key, so each match category keeps its own
   layout exactly as the brief requires ─────────────────────────────────── */
const BUILTIN_VIEW_ID = "__default__"
// v3: the two fixed columns now store their widths in this map too, so a v2
// view would leave them undefined.
const VIEWS_STORAGE_KEY = "intern-deals-table-views-v3"
const FILTERS_STORAGE_KEY = "intern-deals-table-filters-v1"

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

// Filters persist too, so a user returning to the tab lands where they left off.
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

/* ══════════════════════════════════════════════════════════════════════════
   Successful intern deals table
   ══════════════════════════════════════════════════════════════════════════ */
const SuccessfulInternDealsTable = ({ onCountChange, onNotify }) => {
  const effectiveUserId = useEffectiveUserId()

  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [hoveredRow, setHoveredRow] = useState(null)

  const initialFilterState = useMemo(() => loadFilterState(), [])
  const [localFilters, setLocalFilters] = useState(initialFilterState.filters)
  const [sortConfig, setSortConfig] = useState(initialFilterState.sort)
  const [headerFilterOpen, setHeaderFilterOpen] = useState(null)

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
  const [resizingColumn, setResizingColumn] = useState(null)

  const [viewportWidth, setViewportWidth] = useState(typeof window === "undefined" ? 1440 : window.innerWidth)

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]

  /* ─── Data ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!effectiveUserId) return undefined

    setLoading(true)
    let cancelled = false

    const q = query(
      collection(db, "internshipApplications"),
      where("sponsorId", "==", effectiveUserId),
      where("status", "in", ["Accepted", "Confirmed", "Confirmed/Term Sheet Sign", "Completed"]),
    )

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        try {
          const dealsData = await Promise.all(
            querySnapshot.docs.map(async (docSnapshot) => {
              const data = docSnapshot.data()

              let internApplicationData = null
              let internProfileData = null

              if (data.applicantId) {
                try {
                  const applicationDoc = await getDoc(doc(db, "internApplications", data.applicantId))
                  if (applicationDoc.exists()) internApplicationData = applicationDoc.data()
                } catch (error) {
                  console.error("Error fetching intern application:", error)
                }

                try {
                  const profileDoc = await getDoc(doc(db, "internProfiles", data.applicantId))
                  if (profileDoc.exists()) internProfileData = profileDoc.data()
                } catch (error) {
                  console.error("Error fetching intern profile:", error)
                }
              }

              const stipendAmount =
                internApplicationData?.internshipRequest?.stipendAmount ||
                data.stipendAmount ||
                data.monthlyStipend ||
                "Not specified"

              const duration =
                internApplicationData?.internshipRequest?.duration ||
                data.duration ||
                data.programDuration ||
                "Not specified"

              return {
                id: docSnapshot.id,
                internName: data.applicantName || data.internName || "Not specified",
                dealAmount: stipendAmount,
                dealType: data.internType || data.programType || "Internship Program",
                completionDate: data.startDate || data.completedAt || new Date().toISOString(),
                sector: data.field || "Not specified",
                dealDuration: duration,
                currentStatus: data.status || "Active",
                contractValue: data.totalValue || (stipendAmount ? `${stipendAmount} total` : "Not specified"),
                location: data.location || "Not specified",
                internType: data.internType || data.department || "General Intern",
                performanceRating: data.performanceRating || "4.5/5",
                institution: data.institution || "Not specified",
                degree: data.degree || "Not specified",
                stipendAmount,
                duration,
                internDetails: {
                  ...data,
                  profileData: internProfileData,
                  applicationData: internApplicationData,
                  email: internProfileData?.userEmail || data.applicantEmail || "Not specified",
                  phone: internProfileData?.phoneNumber || "Not specified",
                  availabilityStart: internProfileData?.availabilityStart || "Not specified",
                  availableHours: internProfileData?.availableHours || "Not specified",
                  technicalSkills: internProfileData?.technicalSkills || [],
                  languagesSpoken: internProfileData?.languagesSpoken || [],
                  cv: internProfileData?.cv || null,
                  transcript: internProfileData?.transcript || null,
                  idDocument: internProfileData?.idDocument || null,
                  portfolioFile: internProfileData?.portfolioFile || null,
                  proofOfStudy: internProfileData?.proofOfStudy || null,
                  references: internProfileData?.references || null,
                  motivationLetter: internProfileData?.motivationLetter || null,
                },
              }
            }),
          )

          if (!cancelled) setDeals(dealsData)
        } catch (error) {
          console.error("Error loading successful deals:", error)
        } finally {
          if (!cancelled) setLoading(false)
        }
      },
      (error) => {
        console.error("Successful deals listener failed:", error)
        if (!cancelled) setLoading(false)
      },
    )

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [effectiveUserId])

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

  const startEditingViewMeta = (view) => {
    setEditingViewMeta({
      id: view.id,
      name: view.name,
      description: view.description,
      builtin: !!view.builtin,
    })
  }

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

  const cyclePin = (key) => {
    setPinned((prev) => ({
      ...prev,
      [key]: prev[key] === "left" ? "right" : prev[key] === "right" ? null : "left",
    }))
  }

  /* ─── Drag to reorder ───────────────────────────────────────────────── */
  const handleColumnDragStart = (e, key) => {
    setDraggedColumn(key)
    setDragHintRect(null)
    try {
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", key)
    } catch {
      // Some browsers throw on setData outside a real drag — harmless.
    }
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
     widthOf is declared above startResize because startResize calls it — a
     const referenced before its initializer throws at render. It covers the
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
  const resetColumnWidth = (key) => {
    setColumnWidths((prev) => ({
      ...prev,
      [key]: COLUMN_DEFS[key]?.width ?? FIXED_WIDTHS[key] ?? 148,
    }))
  }

  const ColumnResizer = ({ colKey }) => (
    <div
      className="it-resize"
      title="Drag to resize · double-click to reset"
      style={{ background: resizingColumn === colKey ? "rgba(255,255,255,0.35)" : undefined }}
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
    />
  )

  /* ─── Header filter + sort controls ─────────────────────────────────── */
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
      title="Filter this column"
      className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${
        active ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"
      }`}
      onClick={(e) => openHeaderFilter(type, e)}
    >
      <SlidersHorizontal size={11} />
    </button>
  )

  const SortTrigger = ({ columnKey }) => {
    const isActive = sortConfig?.key === columnKey
    return (
      <button
        type="button"
        title={isActive ? (sortConfig.dir === "asc" ? "Sort descending" : "Clear sort") : "Sort ascending"}
        className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${
          isActive ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"
        }`}
        onClick={(e) => toggleSort(columnKey, e)}
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

  /* ─── Derived filter options ────────────────────────────────────────── */
  const uniqueValues = useCallback(
    (accessor) => [...new Set(deals.map(accessor).filter((v) => v && v !== "Not specified"))].sort(),
    [deals],
  )

  const programTypeOptions = useMemo(() => uniqueValues((d) => d.dealType), [uniqueValues])
  const specializationOptions = useMemo(() => uniqueValues((d) => d.sector), [uniqueValues])
  const locationOptions = useMemo(() => uniqueValues((d) => d.location), [uniqueValues])
  const durationOptions = useMemo(() => uniqueValues((d) => d.dealDuration), [uniqueValues])
  const institutionOptions = useMemo(() => uniqueValues((d) => d.institution), [uniqueValues])
  const degreeOptionsList = useMemo(() => uniqueValues((d) => d.degree), [uniqueValues])
  const statusOptions = ["Accepted", "Confirmed", "Confirmed/Term Sheet Sign", "Active", "Completed"]

  /* ─── Filtering + sorting ───────────────────────────────────────────── */
  const filteredDeals = useMemo(() => {
    const f = localFilters

    const matchesAny = (selected, value) =>
      selected.length === 0 || selected.some((v) => (value || "").toLowerCase().includes(v.toLowerCase()))

    const includesText = (needle, value) =>
      !needle.trim() || (value || "").toString().toLowerCase().includes(needle.toLowerCase().trim())

    const rows = deals.filter((deal) => {
      if (!includesText(f.name, deal.internName)) return false
      if (!includesText(f.stipend, deal.dealAmount)) return false
      if (!matchesAny(f.programType, deal.dealType)) return false
      if (!matchesAny(f.specialization, deal.sector)) return false
      if (!matchesAny(f.location, deal.location)) return false
      if (!matchesAny(f.duration, deal.dealDuration)) return false
      if (!matchesAny(f.status, deal.currentStatus)) return false
      if (!matchesAny(f.institution, deal.institution)) return false
      if (!matchesAny(f.degree, deal.degree)) return false

      const dealDate = toISODateOnly(deal.completionDate)
      if (f.startFrom && (!dealDate || dealDate < f.startFrom)) return false
      if (f.startTo && (!dealDate || dealDate > f.startTo)) return false

      const rating = parseRating(deal.performanceRating)
      if (rating < f.ratingRange[0] || rating > f.ratingRange[1]) return false

      return true
    })

    if (sortConfig?.key) {
      const accessors = {
        internName: (d) => d.internName,
        stipend: (d) => d.dealAmount,
        programType: (d) => d.dealType,
        startDate: (d) => toDateSafe(d.completionDate)?.getTime() ?? 0,
        specialization: (d) => d.sector,
        location: (d) => d.location,
        duration: (d) => d.dealDuration,
        rating: (d) => parseRating(d.performanceRating),
        status: (d) => d.currentStatus,
        institution: (d) => d.institution,
        degree: (d) => d.degree,
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
  }, [deals, localFilters, sortConfig])

  useEffect(() => {
    if (onCountChange) onCountChange(filteredDeals.length)
  }, [filteredDeals, onCountChange])

  /* ─── Filter chrome ─────────────────────────────────────────────────── */
  const f = localFilters

  const activeFilterCount =
    (f.name.trim() ? 1 : 0) +
    (f.stipend.trim() ? 1 : 0) +
    f.programType.length +
    f.specialization.length +
    f.location.length +
    f.duration.length +
    f.status.length +
    f.institution.length +
    f.degree.length +
    (f.startFrom || f.startTo ? 1 : 0) +
    (f.ratingRange[0] > 0 || f.ratingRange[1] < 5 ? 1 : 0)

  const clearAllFilters = () => {
    setLocalFilters({ ...EMPTY_FILTERS })
    setSortConfig(null)
  }

  const getFilterActive = (type) => {
    if (type === "startDate") return !!f.startFrom || !!f.startTo
    if (type === "rating") return f.ratingRange[0] > 0 || f.ratingRange[1] < 5
    const v = f[type]
    if (Array.isArray(v)) return v.length > 0
    return typeof v === "string" ? !!v.trim() : false
  }

  const toggleChip = (field, value) => {
    setLocalFilters((p) => ({
      ...p,
      [field]: p[field].includes(value) ? p[field].filter((x) => x !== value) : [...p[field], value],
    }))
  }

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

    // Left-pinned columns stack to the right of the frozen Intern Name column.
    let leftAcc = nameWidth
    orderedColumns.forEach((key) => {
      if (pinned[key] === "left") {
        offsets[key] = { side: "left", value: leftAcc }
        leftAcc += widthOf(key)
      }
    })

    // Action is not pinned, so right-pinned columns stick to the table edge.
    let rightAcc = 0
    const reversed = [...orderedColumns].reverse()
    reversed.forEach((key) => {
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

  const statusBadgeStyle = {
    padding: "4px 10px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: "600",
    display: "inline-block",
    textTransform: "capitalize",
    whiteSpace: "nowrap",
  }

  const searchedColumns = DEFAULT_COLUMN_ORDER.filter((key) =>
    COLUMN_DEFS[key].label.toLowerCase().includes(columnSearch.toLowerCase()),
  )

  const documentLinkStyle = {
    color: "#a67c52",
    textDecoration: "underline",
    fontSize: "0.85rem",
  }

  const renderDocumentLink = (docUrl, docName) => {
    if (!docUrl) {
      return <span style={{ color: "#a89482", fontSize: "0.85rem" }}>Not provided</span>
    }
    return (
      <a href={docUrl} target="_blank" rel="noopener noreferrer" style={documentLinkStyle}>
        View {docName}
      </a>
    )
  }

  /* ─── Cells ─────────────────────────────────────────────────────────── */
  const renderCell = (key, deal, rowBg) => {
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

    if (key === "stipend") {
      return (
        <td key={key} style={{ ...style, fontWeight: 600 }}>
          <TruncatedText text={deal.dealAmount} maxLength={22} />
        </td>
      )
    }

    if (key === "programType") {
      return (
        <td key={key} style={style}>
          <TruncatedText text={deal.dealType} maxLength={22} />
        </td>
      )
    }

    if (key === "startDate") {
      return (
        <td key={key} style={style}>
          {formatDate(deal.completionDate)}
        </td>
      )
    }

    if (key === "specialization") {
      return (
        <td key={key} style={style}>
          <TruncatedText text={deal.sector} maxLength={22} />
        </td>
      )
    }

    if (key === "location") {
      return (
        <td key={key} style={style}>
          <TruncatedText text={deal.location} maxLength={20} />
        </td>
      )
    }

    if (key === "duration") {
      return (
        <td key={key} style={style}>
          <TruncatedText text={deal.dealDuration} maxLength={18} />
        </td>
      )
    }

    if (key === "rating") {
      return (
        <td key={key} style={{ ...style, textAlign: "center" }}>
          <span style={{ color: getRatingColor(deal.performanceRating), fontWeight: 700, fontSize: "0.8rem" }}>
            {deal.performanceRating}
          </span>
        </td>
      )
    }

    if (key === "status") {
      const s = getDealStatusStyle(deal.currentStatus)
      return (
        <td key={key} style={style}>
          <span style={{ ...statusBadgeStyle, backgroundColor: s.color, color: s.textColor }}>{deal.currentStatus}</span>
        </td>
      )
    }

    if (key === "institution") {
      return (
        <td key={key} style={style}>
          <TruncatedText text={deal.institution} maxLength={24} />
        </td>
      )
    }

    if (key === "degree") {
      return (
        <td key={key} style={style}>
          <TruncatedText text={deal.degree} maxLength={20} />
        </td>
      )
    }

    return null
  }

  if (loading) {
    return <div className="p-10 text-center text-[#7d5a50] text-sm">Loading successful deals...</div>
  }

  const textFilters = [
    { type: "name", field: "name", label: "Intern name", placeholder: "Search intern name..." },
    { type: "stipend", field: "stipend", label: "Monthly stipend", placeholder: "Search stipend..." },
  ]

  const chipFilters = [
    { type: "programType", field: "programType", label: "Program Type", options: programTypeOptions },
    { type: "specialization", field: "specialization", label: "Specialization", options: specializationOptions },
    { type: "location", field: "location", label: "Location", options: locationOptions },
    { type: "duration", field: "duration", label: "Duration", options: durationOptions },
    { type: "status", field: "status", label: "Program Status", options: statusOptions },
    { type: "institution", field: "institution", label: "Institution", options: institutionOptions },
    { type: "degree", field: "degree", label: "Degree", options: degreeOptionsList },
  ]

  const densityOptions = [
    { key: "comfortable", label: "Comfortable" },
    { key: "compact", label: "Compact" },
  ]

  /* ═══════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ width: "100%" }}>
      {/* Toolbar — same layout and tokens as the applications table */}
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
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#fff3e0] text-[#e65100] border border-[#e65100]/30">
                <SlidersHorizontal size={12} /> {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
              </span>
            )}

            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#a67c52] hover:text-[#4a352f] hover:bg-white border border-[#e6d7c3] transition-colors"
              >
                Clear all filters
              </button>
            )}

            {collapsedByViewport > 0 && (
              <span className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#a89482] border border-[#e6d7c3]">
                {collapsedByViewport} column{collapsedByViewport > 1 ? "s" : ""} hidden on this screen size
              </span>
            )}
          </div>

          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm"
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
            >
              <SlidersHorizontal size={16} /> Customize Table{" "}
              <ChevronDown size={14} className={`transition-transform ${showCustomizeMenu ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Customize panel */}
      {showCustomizeMenu && customizeMenuRect && (
        <CustomizePanel
          anchorRect={customizeMenuRect}
          viewsState={viewsState}
          activeView={activeView}
          editingViewMeta={editingViewMeta}
          setEditingViewMeta={setEditingViewMeta}
          saveViewMeta={saveViewMeta}
          startEditingViewMeta={startEditingViewMeta}
          switchToView={switchToView}
          removeView={removeView}
          showNewViewForm={showNewViewForm}
          setShowNewViewForm={setShowNewViewForm}
          newViewName={newViewName}
          setNewViewName={setNewViewName}
          newViewDescription={newViewDescription}
          setNewViewDescription={setNewViewDescription}
          createNewView={createNewView}
          columnSearch={columnSearch}
          setColumnSearch={setColumnSearch}
          searchedColumns={searchedColumns}
          columnVisibility={columnVisibility}
          toggleColumn={toggleColumn}
          pinned={pinned}
          cyclePin={cyclePin}
          density={density}
          setDensity={setDensity}
          densityOptions={densityOptions}
          resetActiveViewToDefault={resetActiveViewToDefault}
          onClose={() => {
            setShowCustomizeMenu(false)
            setCustomizeMenuRect(null)
            setShowNewViewForm(false)
            setEditingViewMeta(null)
          }}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-b-2xl border border-[#e6d7c3] shadow-lg overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
          <style>{`
            .it-th { position: sticky !important; color: #faf7f2 !important; vertical-align: top !important; }
            .it-th-draggable { cursor: grab; }
            .it-th-draggable:active { cursor: grabbing; }
            .it-th-row { display: flex; align-items: flex-start; gap: 2px; min-width: 0; }
            .it-th-label {
              flex: 1 1 auto; min-width: 0;
              display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
              overflow: hidden; white-space: normal;
              overflow-wrap: normal; word-break: normal; hyphens: none;
              line-height: 1.2; letter-spacing: 0.02em;
            }
            .it-th-tools { display: flex; align-items: center; flex-shrink: 0; }
            .it-th-grip { position: absolute; left: 3px; top: 10px; opacity: 0; transition: opacity .15s; }
            .it-th:hover .it-th-grip { opacity: .45; }
            .it-resize { position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: col-resize; z-index: 5; }
            .it-resize:hover { background: rgba(255,255,255,0.25); }
          `}</style>

          <table
            style={{
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
                {/* Intern Name — pinned first column, resizable like the rest */}
                <th
                  className="it-th font-semibold uppercase tracking-wider text-xs top-0 left-0 z-30 text-left"
                  style={{
                    backgroundColor: "#4a352f",
                    width: nameWidth,
                    padding: headerPadding,
                    borderBottom: "1px solid #e6d7c3",
                    boxShadow: "2px 0 0 #e6d7c3",
                  }}
                >
                  <div className="it-th-row">
                    <span className="it-th-label" title="Intern Name">
                      Intern Name
                    </span>
                    <span className="it-th-tools">
                      <SortTrigger columnKey="internName" />
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

                  const offsetStyle = offset
                    ? {
                        [offset.side]: `${offset.value}px`,
                        boxShadow: offset.side === "left" ? "2px 0 0 #e6d7c3" : "-2px 0 0 #e6d7c3",
                      }
                    : {}

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
                        ...offsetStyle,
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
                    <HeaderInfoTooltip text={ACTION_TOOLTIP} />
                  </div>
                  <ColumnResizer colKey={ACTION_KEY} />
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredDeals.length === 0 && (
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
                        {deals.length === 0 ? "No completed internships yet" : "No deals match these filters"}
                      </p>
                      <p className="text-xs text-[#a89482] m-0">
                        {deals.length === 0
                          ? "Hire an intern from Applications Received and the placement will appear here."
                          : "Clear a filter to widen the results."}
                      </p>
                      {activeFilterCount > 0 && deals.length > 0 && (
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
              )}

              {filteredDeals.map((deal) => {
                const rowBg = hoveredRow === deal.id ? "#fdf8f4" : "#ffffff"
                const buttonWidth = Math.max(96, actionWidth - 34)

                return (
                  <tr
                    key={deal.id}
                    onMouseEnter={() => setHoveredRow(deal.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{ backgroundColor: rowBg, transition: "background-color .15s" }}
                  >
                    {/* Intern Name — pinned left. Secondary line carries
                        location and intern type so those columns can stay
                        hidden on a narrow screen. */}
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
                        <span className="font-medium text-[#4a352f] break-words text-sm">{deal.internName}</span>
                        <button
                          onClick={() => setSelectedDeal(deal)}
                          className="text-[#a89482] hover:text-[#7d5a50] flex-shrink-0"
                          aria-label={`View details for ${deal.internName}`}
                          title="View details"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                      <div className="text-[10px] text-[#a89482] mt-0.5">
                        {deal.location} · {deal.internType}
                      </div>
                    </td>

                    {orderedColumns.map((key) => renderCell(key, deal, rowBg))}

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
                      <button
                        onClick={() => setSelectedDeal(deal)}
                        title="View Placement"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all text-white hover:shadow-md hover:brightness-105"
                        style={{ width: `${buttonWidth}px`, height: "34px", backgroundColor: "#7d5a50" }}
                      >
                        <ArrowRight size={13} className="flex-shrink-0" />
                        <span className="truncate">View Placement</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
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
              <div>
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
              </div>
            )}

            {headerFilterOpen.type === "rating" && (
              <div>
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
                    step="0.1"
                    value={localFilters.ratingRange[0]}
                    onChange={(e) => {
                      const low = Number.parseFloat(e.target.value) || 0
                      setLocalFilters((p) => ({ ...p, ratingRange: [Math.min(low, p.ratingRange[1]), p.ratingRange[1]] }))
                    }}
                    className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center"
                  />
                  <span className="text-[#7d5a50]">to</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={localFilters.ratingRange[1]}
                    onChange={(e) => {
                      const high = Number.parseFloat(e.target.value) || 0
                      setLocalFilters((p) => ({ ...p, ratingRange: [p.ratingRange[0], Math.max(high, p.ratingRange[0])] }))
                    }}
                    className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={localFilters.ratingRange[0]}
                  onChange={(e) => {
                    const low = Number.parseFloat(e.target.value)
                    setLocalFilters((p) => ({ ...p, ratingRange: [low, p.ratingRange[1]] }))
                  }}
                  className="w-full accent-[#7d5a50]"
                />
              </div>
            )}

            {textFilters.map((item) => {
              if (headerFilterOpen.type !== item.type) return null
              return (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#4a352f]">{item.label}</label>
                    {localFilters[item.field] && (
                      <button
                        onClick={() => setLocalFilters((p) => ({ ...p, [item.field]: "" }))}
                        className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    autoFocus
                    type="text"
                    value={localFilters[item.field]}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, [item.field]: e.target.value }))}
                    placeholder={item.placeholder}
                    className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
                  />
                </div>
              )
            })}

            {chipFilters.map((item) => {
              if (headerFilterOpen.type !== item.type) return null
              return (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-[#4a352f]">{item.label}</label>
                    {localFilters[item.field].length > 0 && (
                      <button
                        onClick={() => setLocalFilters((p) => ({ ...p, [item.field]: [] }))}
                        className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto">
                    {item.options.length === 0 && <span className="text-xs text-[#a89482]">No data available</span>}
                    {item.options.map((value) => (
                      <button
                        key={value}
                        onClick={() => toggleChip(item.field, value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          localFilters[item.field].includes(value)
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

      {/* Placement details modal */}
      {selectedDeal && (
        <PopupPortal>
          <div style={modalOverlayStyle} onClick={() => setSelectedDeal(null)}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10 rounded-t-[20px]">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex items-center gap-2">
                    <Trophy size={20} className="text-[#f5f0e1] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Placement details</p>
                      <h3 className="text-sm font-bold mt-0.5 truncate">{selectedDeal.internName}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDeal(null)}
                    className="text-white/70 hover:text-white p-1 flex-shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div style={{ padding: "32px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "30px",
                    marginBottom: "30px",
                  }}
                >
                  <div>
                    <h4 className="text-base font-semibold text-[#4a352f] mb-4 flex items-center gap-2">
                      <Users size={18} /> Basic information
                    </h4>
                    <div className="flex flex-col gap-2.5 text-sm">
                      <div>
                        <strong>Name:</strong> {selectedDeal.internName}
                      </div>
                      <div>
                        <strong>Email:</strong> {selectedDeal.internDetails.email}
                      </div>
                      <div>
                        <strong>Phone:</strong> {selectedDeal.internDetails.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={15} />
                        <strong>Location:</strong> {selectedDeal.location}
                      </div>
                      <div>
                        <strong>Status:</strong> {selectedDeal.currentStatus}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-[#4a352f] mb-4 flex items-center gap-2">
                      <GraduationCap size={18} /> Education
                    </h4>
                    <div className="flex flex-col gap-2.5 text-sm">
                      <div>
                        <strong>Institution:</strong> {selectedDeal.institution}
                      </div>
                      <div>
                        <strong>Degree:</strong> {selectedDeal.degree}
                      </div>
                      <div>
                        <strong>Field:</strong> {selectedDeal.sector}
                      </div>
                      <div>
                        <strong>Intern type:</strong> {selectedDeal.internType}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "30px",
                    marginBottom: "30px",
                  }}
                >
                  <div>
                    <h4 className="text-base font-semibold text-[#4a352f] mb-4 flex items-center gap-2">
                      <Briefcase size={18} /> Internship
                    </h4>
                    <div className="flex flex-col gap-2.5 text-sm">
                      <div>
                        <strong>Monthly stipend:</strong> {selectedDeal.stipendAmount}
                      </div>
                      <div>
                        <strong>Duration:</strong> {selectedDeal.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={15} />
                        <strong>Start date:</strong> {formatDate(selectedDeal.completionDate)}
                      </div>
                      <div>
                        <strong>Available hours:</strong> {selectedDeal.internDetails.availableHours}
                      </div>
                      <div>
                        <strong>Availability start:</strong> {selectedDeal.internDetails.availabilityStart}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-[#4a352f] mb-4">Skills &amp; languages</h4>
                    <div className="flex flex-col gap-3 text-sm">
                      <div>
                        <strong>Technical skills:</strong>
                        <div className="mt-1.5">
                          {selectedDeal.internDetails.technicalSkills?.length > 0 ? (
                            selectedDeal.internDetails.technicalSkills.map((skill, index) => (
                              <span
                                key={index}
                                className="inline-block bg-[#f5f0e1] text-[#4a352f] px-2.5 py-0.5 rounded-full text-xs mr-1 mb-1"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#a89482]">Not specified</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <strong>Languages:</strong>
                        <div className="mt-1.5">
                          {selectedDeal.internDetails.languagesSpoken?.length > 0 ? (
                            selectedDeal.internDetails.languagesSpoken.map((lang, index) => (
                              <span
                                key={index}
                                className="inline-block bg-[#f5f0e1] text-[#4a352f] px-2.5 py-0.5 rounded-full text-xs mr-1 mb-1"
                              >
                                {lang}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#a89482]">Not specified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-[#4a352f] mb-4">Documents</h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "12px",
                      fontSize: "14px",
                    }}
                  >
                    <div>
                      <strong>CV:</strong> {renderDocumentLink(selectedDeal.internDetails.cv, "CV")}
                    </div>
                    <div>
                      <strong>Transcript:</strong> {renderDocumentLink(selectedDeal.internDetails.transcript, "transcript")}
                    </div>
                    <div>
                      <strong>ID document:</strong>{" "}
                      {renderDocumentLink(selectedDeal.internDetails.idDocument, "ID document")}
                    </div>
                    <div>
                      <strong>Portfolio:</strong>{" "}
                      {renderDocumentLink(selectedDeal.internDetails.portfolioFile, "portfolio")}
                    </div>
                    <div>
                      <strong>Proof of study:</strong>{" "}
                      {renderDocumentLink(selectedDeal.internDetails.proofOfStudy, "proof of study")}
                    </div>
                    <div>
                      <strong>References:</strong>{" "}
                      {renderDocumentLink(selectedDeal.internDetails.references, "references")}
                    </div>
                    <div>
                      <strong>Motivation letter:</strong>{" "}
                      {renderDocumentLink(selectedDeal.internDetails.motivationLetter, "motivation letter")}
                    </div>
                  </div>
                </div>

                <div className="mt-7 p-[18px] bg-[#faf7f2] rounded-xl border border-[#e6d7c3]">
                  <h4 className="text-[15px] font-semibold text-[#4a352f] mb-3">Performance summary</h4>
                  <div className="flex justify-between flex-wrap gap-3 text-sm">
                    <span>
                      <strong>Rating:</strong> {selectedDeal.performanceRating}
                    </span>
                    <span>
                      <strong>Contract value:</strong> {selectedDeal.contractValue}
                    </span>
                    <span>
                      <strong>Program status:</strong> {selectedDeal.currentStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end p-6 border-t border-[#e6d7c3]">
                <button
                  onClick={() => setSelectedDeal(null)}
                  className="px-5 py-2.5 rounded-lg bg-[#7d5a50] text-white text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </PopupPortal>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   Customize panel — lifted out of the table body so the render stays flat.
   ══════════════════════════════════════════════════════════════════════════ */
const CustomizePanel = ({
  anchorRect,
  viewsState,
  activeView,
  editingViewMeta,
  setEditingViewMeta,
  saveViewMeta,
  startEditingViewMeta,
  switchToView,
  removeView,
  showNewViewForm,
  setShowNewViewForm,
  newViewName,
  setNewViewName,
  newViewDescription,
  setNewViewDescription,
  createNewView,
  columnSearch,
  setColumnSearch,
  searchedColumns,
  columnVisibility,
  toggleColumn,
  pinned,
  cyclePin,
  density,
  setDensity,
  densityOptions,
  resetActiveViewToDefault,
  onClose,
}) => {
  const panelWidth = 340
  const margin = 12

  let left = anchorRect.right - panelWidth
  left = Math.min(Math.max(left, margin), window.innerWidth - panelWidth - margin)

  const spaceBelow = window.innerHeight - anchorRect.bottom - margin - 8
  const spaceAbove = anchorRect.top - margin - 8
  const openUpward = spaceBelow < 320 && spaceAbove > spaceBelow
  const maxHeight = Math.max(200, Math.min(640, openUpward ? spaceAbove : spaceBelow))
  const top = openUpward ? undefined : anchorRect.bottom + 8
  const bottom = openUpward ? window.innerHeight - anchorRect.top + 8 : undefined

  const allViews = Object.values(viewsState.views).sort((a, b) => {
    if (a.builtin) return -1
    if (b.builtin) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <PopupPortal>
      <div className="fixed inset-0 z-40" onClick={onClose} />
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
                      Default <span className="font-normal text-[#a89482] text-xs">(name can&apos;t be changed)</span>
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
                    <span className={`text-sm text-[#4a352f] ${isActive ? "font-semibold" : ""}`}>{view.name}</span>
                    {view.builtin && (
                      <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Built-in</span>
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
          Every column resizes, including the pinned ones.
        </p>

        <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
          <input type="checkbox" checked disabled className="rounded border-[#c8b6a6]" />
          <span className="text-sm text-[#4a352f] flex-1">Intern Name</span>
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
              className={`p-1 rounded flex-shrink-0 ${
                pinned[key] ? "text-[#7d5a50]" : "text-[#c8b6a6] hover:text-[#7d5a50]"
              }`}
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
          {densityOptions.map((item) => (
            <button
              key={item.key}
              onClick={() => setDensity(item.key)}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                density === item.key ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="border-t border-[#e6d7c3] my-4" />
        <button
          onClick={resetActiveViewToDefault}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#a67c52] hover:text-[#4a352f] hover:bg-[#faf7f2] border border-[#e6d7c3]"
        >
          <RotateCcw size={12} /> Reset &quot;{activeView.name}&quot; to factory defaults
        </button>
      </div>
    </PopupPortal>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   Tab shell
   ══════════════════════════════════════════════════════════════════════════ */
const InternTabbedTables = ({
  filters,
  stageFilter,
  loading,
  activeTab = "my-matches",
  setActiveTab,
  onDealComplete,
  profiles,
}) => {
  const [localActiveTab, setLocalActiveTab] = useState(activeTab)
  const [successfulDealsCount, setSuccessfulDealsCount] = useState(0)
  const [myMatchesCount, setMyMatchesCount] = useState(0)
  const [profileMatchesCount, setProfileMatchesCount] = useState(0)
  const [notification, setNotification] = useState(null)

  const currentActiveTab = setActiveTab ? activeTab : localActiveTab
  const handleTabChange = setActiveTab || setLocalActiveTab

  const notify = useCallback((type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  // Guarded — `profiles` is optional, and calling it unguarded crashes the page.
  useEffect(() => {
    if (typeof profiles === "function") profiles(profileMatchesCount)
  }, [profiles, profileMatchesCount])

  const TABS = [
    { id: "my-matches", label: "Applications Received", icon: Users, count: myMatchesCount },
    { id: "successful-deals", label: "Successful Deals", icon: Trophy, count: successfulDealsCount },
  ]

  const bannerClass = (type) => {
    if (type === "success") return "bg-green-50 text-green-800 border-green-200"
    if (type === "warning") return "bg-amber-50 text-amber-800 border-amber-200"
    if (type === "info") return "bg-[#faf7f2] text-[#4a352f] border-[#e6d7c3]"
    return "bg-red-50 text-red-800 border-red-200"
  }

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto", padding: 0 }}>
      {/* Inline banner, same as the other match tables */}
      {notification && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border mb-3 ${bannerClass(notification.type)}`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-current opacity-50 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Tab navigation — cream/brown tokens matching the tables below */}
      <div className="flex gap-1 p-1 bg-[#f5f0e1] rounded-t-2xl border border-[#e6d7c3] border-b-0">
        {TABS.map((tab) => {
          const isActive = currentActiveTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all min-h-[52px] ${
                isActive
                  ? "bg-[#4a352f] text-[#faf7f2] shadow-md"
                  : "bg-transparent text-[#7d5a50] hover:bg-white hover:text-[#4a352f]"
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

      {/* Tab content — both stay mounted so the tab badges stay accurate */}
      <div className="bg-white rounded-b-2xl p-6 border border-[#e6d7c3] border-t-0 shadow-lg" style={{ minHeight: "600px" }}>
        <div style={{ display: currentActiveTab === "my-matches" ? "block" : "none" }}>
          <InternTablePage
            filters={filters}
            stageFilter={stageFilter}
            onDealComplete={onDealComplete}
            matchesCount={myMatchesCount}
            profileMatchesCount={setProfileMatchesCount}
            onMatchesCountChange={setMyMatchesCount}
          />
        </div>

        <div style={{ display: currentActiveTab === "successful-deals" ? "block" : "none" }}>
          <SuccessfulInternDealsTable onCountChange={setSuccessfulDealsCount} onNotify={notify} />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

export default InternTabbedTables