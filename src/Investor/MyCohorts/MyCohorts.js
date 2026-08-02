"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { useNavigate } from "react-router-dom"
import {
  Trophy, Users, TrendingUp, Building, MapPin, DollarSign, Calendar, Eye, Wrench,
  Loader, RefreshCw, X, BarChart3, ChevronDown, ChevronUp, AlertCircle, Info,
  Layers, GraduationCap, MoreVertical, FileText, Ticket, Copy, CheckCircle,
  SlidersHorizontal, LayoutGrid, Settings, RotateCcw, GripVertical, Square,
  CheckSquare, ArrowUpDown, Download, Archive, StickyNote, Plus, Trash2,
  Briefcase, Award, Package, FileCheck, Star, Clock, Activity, TrendingDown
} from "lucide-react"
import Upsell from "../../components/Upsell/Upsell"
import useSubscriptionPlan from "../../hooks/useSubscriptionPlan"

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

const formatCurrency = (amount) => {
  if (!amount || amount === "Not specified" || amount === "N/A") return "Not specified"
  if (typeof amount === "string") {
    if (amount.includes("R") || amount.includes("$") || amount.includes("€")) return amount
    return `R ${amount}`
  }
  return `R ${amount.toLocaleString()}`
}

const formatDate = (dateValue, { fallback = "Not recorded" } = {}) => {
  if (!dateValue) return fallback
  let date
  if (typeof dateValue === "object" && typeof dateValue.toDate === "function") date = dateValue.toDate()
  else date = new Date(dateValue)
  if (isNaN(date.getTime())) return fallback
  return date.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
}

// Shared date coercion for the date-range filter — handles Firestore
// Timestamps and plain strings, returns null rather than an Invalid Date.
const toDateSafe = (value) => {
  if (!value) return null
  const d = typeof value === "object" && typeof value.toDate === "function" ? value.toDate() : new Date(value)
  return isNaN(d.getTime()) ? null : d
}

// Investment amounts arrive as formatted strings ("R 2,500,000"), so the
// numeric range filter needs the digits pulled back out.
const toAmount = (value) => {
  if (value == null) return 0
  const n = parseFloat(value.toString().replace(/[^0-9.]/g, ""))
  return isNaN(n) ? 0 : n
}

// ─── Status vocabulary ──────────────────────────────────────────────────────
const STATUS_META = {
  "Active Investment": { label: "Active Investment", color: "#4caf50", group: "active" },
  "Exited (Successful)": { label: "Exited", color: "#2196f3", group: "exited" },
  "Under Review": { label: "Under Review", color: "#ff9800", group: "active" },
}

const getStatusMeta = (status) => STATUS_META[status] || { label: status || "Active Investment", color: "#7d5a50", group: "active" }

// ─── ROI helpers ────────────────────────────────────────────────────────────
// Guarded: .replace() used to be called straight on `roi`, so a record with no
// ROI field threw instead of reading as Pending.
const getRoiColor = (roi) => {
  if (!roi || roi === "Pending" || roi === "To be determined") return "#7d5a50"
  const percentage = Number.parseInt(roi.toString().replace(/[+%]/g, ""))
  if (isNaN(percentage)) return "#7d5a50"
  if (percentage >= 100) return "#4caf50"
  if (percentage >= 50) return "#8bc34a"
  if (percentage >= 20) return "#ff9800"
  return "#f44336"
}

const getRoiLabel = (roi) => {
  if (!roi || roi === "Pending" || roi === "To be determined") return "Pending"
  const percentage = Number.parseInt(roi.toString().replace(/[+%]/g, ""))
  if (isNaN(percentage)) return "Pending"
  if (percentage >= 100) return "Excellent"
  if (percentage >= 50) return "Good"
  if (percentage >= 20) return "Moderate"
  return "Needs Attention"
}

// ─── Attention Required heuristic ──────────────────────────────────────────
const needsAttention = (cohort) => {
  const hasValidDate = !!toDateSafe(cohort.completionDate)
  const hasFundingInfo = cohort.dealAmount && cohort.dealAmount !== "Not specified"
  return !hasValidDate || !hasFundingInfo
}

const Portal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

// ─── Stage pipeline ─────────────────────────────────────────────────────────
const INVESTOR_STAGE_CARDS = [
  { key: "active", label: "Active Investments", icon: TrendingUp, note: true, noteText: "Businesses currently in your active investment portfolio." },
  { key: "attention", label: "Attention Required", icon: AlertCircle, note: true, noteText: "Investments with missing or incomplete data that need your attention." },
  { key: "exited", label: "Exited", icon: GraduationCap, note: true, noteText: "Investments that have been successfully exited." },
]

const InvestorStagePipeline = ({ counts, activeFilter, setActiveFilter }) => {
  const total = counts.total || 1
  const toggle = (key) => setActiveFilter(activeFilter === key ? "all" : key)

  return (
    <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#4a352f]">Investment Portfolio</h3>
          <span title="Your closed investments in businesses">
            <Info size={12} className="text-[#a89482]" />
          </span>
        </div>
        <button
          onClick={() => toggle("all")}
          className="flex items-baseline gap-1.5 px-3 py-1 rounded-xl transition-all hover:bg-[#f5f0e1]"
          style={{ backgroundColor: activeFilter === "all" ? "#f5f0e1" : "transparent" }}
        >
          <span className="text-lg font-extrabold text-[#4a352f]">{counts.total}</span>
          <span className="text-[10px] text-[#7d5a50] font-semibold uppercase tracking-wide">Total Investments</span>
        </button>
      </div>

      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        {INVESTOR_STAGE_CARDS.map(({ key, label, icon: Icon, note, noteText }) => {
          const count = counts[key] || 0
          const pct = Math.round((count / total) * 100)
          const isSelected = activeFilter === key
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`text-left rounded-2xl p-3 flex-shrink-0 transition-all duration-300 ${
                isSelected ? "shadow-lg -translate-y-0.5" : "hover:-translate-y-0.5 shadow-sm hover:shadow-md"
              }`}
              style={{
                width: "180px",
                background: "linear-gradient(135deg, #4a352f 0%, #241a14 100%)",
                border: `2px solid ${isSelected ? "#d9b98a" : "rgba(255,255,255,0.12)"}`,
              }}
              title={noteText}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={12} className="text-white" />
                </div>
                <span className="text-[10px] font-semibold text-white uppercase tracking-wide leading-tight flex items-center gap-1">
                  {label}
                  {note && <Info size={9} className="text-[#d9c4b0] flex-shrink-0" />}
                </span>
              </div>
              <span className="text-xl font-extrabold text-white leading-none">{count}</span>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#c9986a" }} />
                </div>
                <span className="text-[9px] font-semibold flex-shrink-0" style={{ color: "#d9c4b0" }}>{pct}%</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Column definitions ────────────────────────────────────────────────────
// filterType drives which popover opens from that column's header. Every
// column has one.
const COLUMN_DEFS = {
  investmentAmount: { label: "Investment", minWidth: "112px", filterType: "investment" },
  startDate: { label: "Start Date", minWidth: "96px", filterType: "startDate" },
  sector: { label: "Sector", minWidth: "100px", filterType: "sector" },
  location: { label: "Location", minWidth: "92px", filterType: "location" },
  teamSize: { label: "Team Size", minWidth: "80px", filterType: "teamSize" },
  status: { label: "Status", minWidth: "130px", filterType: "status" },
  roi: { label: "ROI", minWidth: "80px", filterType: "roi" },
  dealType: { label: "Deal Type", minWidth: "100px", filterType: "dealType" },
}

const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS)
const DEFAULT_COLUMN_VISIBILITY = {
  investmentAmount: true, startDate: true, status: true, roi: true,
  sector: true, location: false, teamSize: false, dealType: false,
}
const DEFAULT_DENSITY = "comfortable"

const EMPTY_FILTERS = {
  name: "",
  investmentMin: null, investmentMax: null,
  startFrom: "", startTo: "",
  sector: [], location: [], teamSize: [], status: [], dealType: [],
  roi: "",
}

// ─── Custom Views ──────────────────────────────────────────────────────────
// A view bundles column visibility, order, width and density into one named
// object, with exactly one active at a time. Editing the table edits the
// active view and auto-saves immediately.
const BUILTIN_VIEW_ID = "__default__"
const VIEWS_STORAGE_KEY = "investor-cohorts-views-v1"
const ACTIVE_FILTER_STORAGE_KEY = "investor-cohorts-active-filter-v1"

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
  density: DEFAULT_DENSITY,
  columnWidths: {},
})

const createBuiltinDefaultView = () => ({
  id: BUILTIN_VIEW_ID, name: "Default", description: "", builtin: true, ...createDefaultViewLayout(),
})

const sanitizeView = (view, fallbackId) => ({
  id: view?.id || fallbackId,
  name: (view?.name || "Untitled view").toString(),
  description: (view?.description || "").toString(),
  builtin: !!view?.builtin,
  columnVisibility: { ...DEFAULT_COLUMN_VISIBILITY, ...(view?.columnVisibility || {}) },
  columnOrder: sanitizeColumnOrder(view?.columnOrder),
  density: view?.density || DEFAULT_DENSITY,
  columnWidths: view?.columnWidths || {},
})

const loadViewsState = () => {
  const freshDefault = () => ({ activeViewId: BUILTIN_VIEW_ID, views: { [BUILTIN_VIEW_ID]: createBuiltinDefaultView() } })
  if (typeof window === "undefined") return freshDefault()
  try {
    const saved = JSON.parse(window.localStorage.getItem(VIEWS_STORAGE_KEY) || "null")
    const rawViews = saved?.views && typeof saved.views === "object" ? saved.views : {}
    const views = {}
    Object.entries(rawViews).forEach(([id, v]) => { views[id] = sanitizeView(v, id) })
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
  try { window.localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(state)) } catch {
    // Storage can fail (private browsing, quota) — still works this session.
  }
}

const generateViewId = () => {
  try { return `view_${crypto.randomUUID()}` } catch { return `view_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }
}

const loadStoredActiveFilter = () => {
  if (typeof window === "undefined") return "all"
  try { return window.localStorage.getItem(ACTIVE_FILTER_STORAGE_KEY) || "all" } catch { return "all" }
}

// Row cache
const COHORTS_CACHE_KEY = 'investorCohorts_cache'
const CACHE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

// The deal-closed stage is spelled differently across programme templates, so
// matching is normalised rather than relying on an exact-string `in` query
// (which silently dropped any deal spelled another way).
const CLOSED_STAGES = new Set(["deal complete", "deals closed", "deal closed", "disbursed", "awarded", "completed"])
const isClosedStage = (stage) => !!stage && CLOSED_STAGES.has(stage.toString().trim().toLowerCase())

// ─── Modal overlay styles ──────────────────────────────────────────────────
const modalOverlayStyle = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(62, 39, 35, 0.85)",
  display: "flex", justifyContent: "center", alignItems: "center",
  zIndex: 1000, animation: "fadeIn 0.3s ease-out", backdropFilter: "blur(4px)",
}

const modalContentStyle = {
  backgroundColor: "#ffffff", borderRadius: "20px", padding: "40px",
  maxWidth: "900px", width: "95%", maxHeight: "90vh", overflowY: "auto",
  boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
  animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
}

// ─── Loading skeleton ──────────────────────────────────────────────────────
const StatCardSkeleton = () => (
  <div className="bg-white p-4 rounded-xl shadow-md border-2 border-[#e6d7c3]">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-5 h-5 rounded bg-shimmer-mid bg-shimmer animate-shimmer" />
      <div className="w-24 h-4 bg-shimmer-light bg-shimmer animate-shimmer-d1 rounded" />
    </div>
    <div className="w-16 h-8 bg-shimmer-dark bg-shimmer animate-shimmer-d2 rounded mt-2" />
  </div>
)

const TableHeaderSkeleton = () => (
  <thead>
    <tr className="bg-[#faf7f2] border-b-2 border-[#e6d7c3]">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <th key={i} className="p-4">
          <div className="w-20 h-3 bg-shimmer-mid bg-shimmer animate-shimmer rounded" />
        </th>
      ))}
    </tr>
  </thead>
)

const TableRowSkeleton = () => {
  // Five delays for five cells — the previous version declared four and then
  // indexed delays[4], putting className="undefined" on the last cell.
  const delays = ['animate-shimmer', 'animate-shimmer-d1', 'animate-shimmer-d2', 'animate-shimmer-d3', 'animate-shimmer-d4']
  return (
    <tr className="border-b border-[#f0e6d9]">
      <td className="p-3">
        <div className="space-y-1.5">
          <div className={`w-32 h-4 bg-shimmer-dark bg-shimmer ${delays[0]} rounded`} />
          <div className={`w-24 h-3 bg-shimmer-mid bg-shimmer ${delays[1]} rounded`} />
        </div>
      </td>
      <td className="p-3"><div className={`w-20 h-5 bg-shimmer-dark bg-shimmer ${delays[1]} rounded`} /></td>
      <td className="p-3"><div className={`w-24 h-3 bg-shimmer-mid bg-shimmer ${delays[2]} rounded`} /></td>
      <td className="p-3"><div className={`w-16 h-3 bg-shimmer-mid bg-shimmer ${delays[2]} rounded`} /></td>
      <td className="p-3"><div className={`w-20 h-6 bg-shimmer-light bg-shimmer ${delays[3]} rounded-full`} /></td>
      <td className="p-3"><div className={`w-24 h-8 bg-shimmer-dark bg-shimmer ${delays[4]} rounded mx-auto`} /></td>
    </tr>
  )
}

const LoadingSkeleton = () => (
  <div className="min-h-screen box-border transition-[margin-left] duration-300">
    <div className="mx-auto px-8 w-full">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div className="space-y-2">
          <div className="w-48 h-7 bg-shimmer-dark bg-shimmer animate-shimmer rounded" />
          <div className="w-64 h-4 bg-shimmer-mid bg-shimmer animate-shimmer-d1 rounded" />
        </div>
        <div className="w-32 h-9 bg-shimmer-light bg-shimmer animate-shimmer-d2 rounded" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-6">
        <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
      </div>
      <div className="bg-white rounded-2xl shadow-md overflow-hidden w-full border border-[#e6d7c3]">
        <div className="p-4 border-b-2 border-[#e6d7c3] bg-[#f5f0e1] flex justify-between items-center">
          <div className="w-40 h-5 bg-shimmer-dark bg-shimmer animate-shimmer rounded" />
          <div className="w-20 h-6 bg-shimmer-mid bg-shimmer animate-shimmer-d1 rounded" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <TableHeaderSkeleton />
            <tbody>{[1, 2, 3].map((i) => <TableRowSkeleton key={i} />)}</tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
)

function MyCohorts() {
  const [cohorts, setCohorts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState(null)
  const [activeFilter, setActiveFilter] = useState(() => loadStoredActiveFilter())
  const [hoveredRowKey, setHoveredRowKey] = useState(null)
  const [rowMenu, setRowMenu] = useState(null)
  const [noteModal, setNoteModal] = useState(null)
  const [notesByCohort, setNotesByCohort] = useState({})
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [showArchived, setShowArchived] = useState(false)
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [statusModal, setStatusModal] = useState(null)

  // ─── Column header filters ────────────────────────────────────────────────
  const [headerFilterOpen, setHeaderFilterOpen] = useState(null)
  const [localFilters, setLocalFilters] = useState({ ...EMPTY_FILTERS })

  const { currentPlan, subscriptionLoading } = useSubscriptionPlan()
  const navigate = useNavigate()

  // ─── Views (column visibility / order / width / density) ─────────────────
  const [viewsState, setViewsState] = useState(() => loadViewsState())
  const initialActiveView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]
  const [columnVisibility, setColumnVisibility] = useState(() => initialActiveView.columnVisibility)
  const [columnOrder, setColumnOrder] = useState(() => initialActiveView.columnOrder)
  const [density, setDensity] = useState(() => initialActiveView.density)
  const [columnWidths, setColumnWidths] = useState(() => initialActiveView.columnWidths || {})

  const [showCustomizeMenu, setShowCustomizeMenu] = useState(false)
  const [customizeMenuRect, setCustomizeMenuRect] = useState(null)
  const [showNewViewForm, setShowNewViewForm] = useState(false)
  const [newViewName, setNewViewName] = useState("")
  const [newViewDescription, setNewViewDescription] = useState("")
  const [editingViewMeta, setEditingViewMeta] = useState(null)

  const [draggedColumn, setDraggedColumn] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [dragHintRect, setDragHintRect] = useState(null)
  const [resizingColumn, setResizingColumn] = useState(null)

  // ─── Auto-save views ──────────────────────────────────────────────────────
  useEffect(() => {
    setViewsState((prev) => {
      const current = prev.views[prev.activeViewId]
      if (!current) return prev
      const updated = { ...current, columnVisibility, columnOrder, density, columnWidths }
      const next = { ...prev, views: { ...prev.views, [prev.activeViewId]: updated } }
      persistViewsState(next)
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility, columnOrder, density, columnWidths])

  useEffect(() => {
    if (typeof window === "undefined") return
    try { window.localStorage.setItem(ACTIVE_FILTER_STORAGE_KEY, activeFilter) } catch {
      // Non-fatal — still works this session.
    }
  }, [activeFilter])

  // ─── Load cohorts ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (subscriptionLoading) return
    if (currentPlan === "basic") { setCohorts([]); setLoading(false); return }
    fetchCohorts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionLoading, currentPlan])

  const getCachedCohorts = () => {
    try {
      const cached = localStorage.getItem(COHORTS_CACHE_KEY)
      if (!cached) return null
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_TIMEOUT) return data
      localStorage.removeItem(COHORTS_CACHE_KEY)
      return null
    } catch (error) {
      console.error("Error reading cache:", error)
      return null
    }
  }

  const setCachedCohorts = (data) => {
    try {
      localStorage.setItem(COHORTS_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
    } catch (error) {
      console.error("Error setting cache:", error)
    }
  }

  const fetchCohorts = async (forceRefresh = false) => {
    try {
      setLoading(true)

      if (!forceRefresh) {
        const cachedCohorts = getCachedCohorts()
        if (cachedCohorts) { setCohorts(cachedCohorts); setLoading(false); return }
      }

      const currentUser = auth.currentUser
      if (!currentUser) { setLoading(false); return }

      // Previously a Firestore `in` query against four exact stage strings, so
      // a deal spelled any other way vanished from the portfolio entirely.
      const q = query(collection(db, "investorApplications"), where("funderId", "==", currentUser.uid))
      const querySnapshot = await getDocs(q)

      const cohortsData = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data()
          if (!isClosedStage(data.pipelineStage || data.stage || data.status)) return null
          try {
            let profileData = {}
            if (data.smeId) {
              const profileSnap = await getDoc(doc(db, "universalProfiles", data.smeId))
              if (profileSnap.exists()) profileData = profileSnap.data()
              else if (data.userId) {
                const userProfileSnap = await getDoc(doc(db, "universalProfiles", data.userId))
                if (userProfileSnap.exists()) profileData = userProfileSnap.data()
              }
            }

            const entity = profileData.entityOverview || {}
            const smeName = entity.tradingName || entity.registeredName || data.companyName || data.smeName || "Unnamed Business"

            return {
              id: docSnap.id,
              docId: docSnap.id,
              smeId: data.smeId || data.userId,
              smeName,
              dealAmount: data.fundingDetails?.amountApproved || data.fundingRequired || "Not specified",
              dealType: formatLabel(data.fundingDetails?.investmentType || data.investmentType) || "Equity",
              completionDate: data.updatedAt || data.createdAt || null,
              sector: formatLabel(entity.economicSectors?.[0]) || formatLabel(data.sector) || "Not specified",
              location: formatLabel(entity.location) || formatLabel(data.location) || "Not specified",
              teamSize: entity.employeeCount || data.teamSize || "Not specified",
              description: entity.shortBusinessDescription || "No description available",
              // Reads the stored status rather than hard-coding the string
              // "Active Investment" on every row — that made the Exited card
              // and status filter permanently empty, and silently reverted any
              // status change on the next fetch.
              currentStatus: data.investmentStatus || data.status || "Active Investment",
              profileData,
              lastUpdated: new Date().toISOString(),
              dealStructure: data.fundingDetails?.paymentDeployment || "Not specified",
              dealDuration: data.dealDuration || "Ongoing",
              supportProvided: data.supportProvided || "Funding and strategic support",
              roi: data.roi || "Pending",
              exitStrategy: data.exitStrategy || "To be determined",
              revenueGrowth: data.revenueGrowth || "Pending",
              fundingDetails: data.fundingDetails || {},
              archived: data.archived || false,
              statusHistory: data.statusHistory || [],
              applicationDate: data.createdAt ? formatDate(data.createdAt) : "Not recorded",
              applicationDateRaw: data.createdAt || null,
            }
          } catch (error) {
            console.error("Error fetching profile:", error)
            return null
          }
        })
      )

      const validCohorts = cohortsData.filter(Boolean)
      setCohorts(validCohorts)
      setCachedCohorts(validCohorts)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching cohorts:", error)
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchCohorts(true)
    setRefreshing(false)
  }

  // ─── Notes ────────────────────────────────────────────────────────────────
  const fetchNotesForCohort = async (cohort) => {
    try {
      const snapshot = await getDocs(query(collection(db, "investorNotes"), where("cohortId", "==", cohort.id)))
      const notes = snapshot.docs.map((d) => d.data()).sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))
      setNotesByCohort((prev) => ({ ...prev, [cohort.id]: notes }))
    } catch (error) {
      console.error("Error fetching notes:", error)
      setNotesByCohort((prev) => ({ ...prev, [cohort.id]: [] }))
    }
  }

  const toggleExpandRow = (cohort) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(cohort.id)) next.delete(cohort.id)
      else {
        next.add(cohort.id)
        if (!notesByCohort[cohort.id]) fetchNotesForCohort(cohort)
      }
      return next
    })
  }

  const handleSaveNote = async () => {
    if (!noteModal?.text?.trim()) return
    try {
      const user = auth.currentUser
      if (!user) { alert("Please log in to add a note"); return }
      await addDoc(collection(db, "investorNotes"), {
        investorId: user.uid,
        smeId: noteModal.cohort.smeId,
        cohortId: noteModal.cohort.id,
        note: noteModal.text.trim(),
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
        authorName: user.displayName || user.email || "Investor",
      })
      await fetchNotesForCohort(noteModal.cohort)
      setExpandedRows((prev) => new Set(prev).add(noteModal.cohort.id))
      setNoteModal(null)
    } catch (error) {
      console.error("Error saving note:", error)
      alert("Failed to save note. Please try again.")
    }
  }

  // ─── Archive ──────────────────────────────────────────────────────────────
  const handleArchive = async (cohort) => {
    setBulkConfirm({
      message: `Archive ${cohort.smeName}? It will be hidden from the default view but can still be found via "Show archived".`,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "investorApplications", cohort.docId), { archived: true })
          await fetchCohorts(true)
        } catch (error) {
          console.error("Error archiving record:", error)
          alert("Failed to archive. Please try again.")
        }
      },
    })
    setRowMenu(null)
  }

  // ─── Status change ────────────────────────────────────────────────────────
  const openStatusModal = (cohortOrCohorts) => {
    const list = Array.isArray(cohortOrCohorts) ? cohortOrCohorts : [cohortOrCohorts]
    setStatusModal({ cohorts: list, targetGroup: "", reason: "", note: "" })
    setRowMenu(null)
  }

  const submitStatusChange = async () => {
    if (!statusModal?.targetGroup) return
    const newStatus = statusModal.targetGroup === "exited" ? "Exited (Successful)" : "Active Investment"

    const run = async () => {
      try {
        for (const cohort of statusModal.cohorts) {
          const historyEntry = {
            previousStatus: getStatusMeta(cohort.currentStatus).label,
            newStatus: getStatusMeta(newStatus).label,
            changedAt: new Date().toISOString(),
            reason: statusModal.reason || null,
            note: statusModal.note || null,
          }
          // Written to investmentStatus, which is what the fetch above reads —
          // writing to `status` alone left the pipeline stage field ambiguous
          // and the change invisible after a refetch.
          await updateDoc(doc(db, "investorApplications", cohort.docId), {
            investmentStatus: newStatus,
            statusHistory: arrayUnion(historyEntry),
          })
        }
        await fetchCohorts(true)
        setStatusModal(null)
        setSelectedRows(new Set())
      } catch (error) {
        console.error("Error changing status:", error)
        alert("Failed to update status. Please try again.")
      }
    }

    if (statusModal.targetGroup === "exited") {
      setBulkConfirm({
        message: statusModal.cohorts.length > 1
          ? `Mark ${statusModal.cohorts.length} investments as Exited?`
          : `Mark ${statusModal.cohorts[0].smeName} as Exited?`,
        onConfirm: run,
      })
    } else {
      run()
    }
  }

  // ─── Bulk selection + export ─────────────────────────────────────────────
  const toggleRowSelected = (id) => {
    setSelectedRows((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const toggleSelectAll = (rows) => {
    setSelectedRows((prev) => (rows.every((r) => prev.has(r.id)) ? new Set() : new Set(rows.map((r) => r.id))))
  }

  const handleExportSelected = (rows) => {
    try {
      const selected = rows.filter((r) => selectedRows.has(r.id))
      const headers = ["Company Name", "Investment", "Start Date", "Status", "Sector", "Location", "Deal Type", "ROI"]
      const dataRows = selected.map((c) => [
        c.smeName, formatCurrency(c.dealAmount), formatDate(c.completionDate),
        getStatusMeta(c.currentStatus).label, c.sector, c.location, c.dealType, c.roi,
      ].map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(","))
      const csv = [headers.join(","), ...dataRows].join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url; link.download = `investments-export-${new Date().toISOString().split("T")[0]}.csv`; link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  // ─── Views helpers ────────────────────────────────────────────────────────
  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]

  const switchToView = (viewId) => {
    const target = viewsState.views[viewId]
    if (!target) return
    setViewsState((prev) => { const next = { ...prev, activeViewId: viewId }; persistViewsState(next); return next })
    setColumnVisibility(target.columnVisibility)
    setColumnOrder(target.columnOrder)
    setDensity(target.density)
    setColumnWidths(target.columnWidths || {})
  }

  const createNewView = () => {
    const trimmedName = newViewName.trim()
    if (!trimmedName) return
    const id = generateViewId()
    const newView = {
      id, name: trimmedName, description: newViewDescription.trim(), builtin: false,
      columnVisibility: { ...columnVisibility }, columnOrder: [...columnOrder],
      density, columnWidths: { ...columnWidths },
    }
    setViewsState((prev) => { const next = { activeViewId: id, views: { ...prev.views, [id]: newView } }; persistViewsState(next); return next })
    setNewViewName(""); setNewViewDescription(""); setShowNewViewForm(false)
  }

  const startEditingViewMeta = (view) => setEditingViewMeta({ id: view.id, name: view.name, description: view.description, builtin: !!view.builtin })

  const saveViewMeta = () => {
    if (!editingViewMeta) return
    const trimmedName = editingViewMeta.name.trim()
    if (!trimmedName && !editingViewMeta.builtin) return
    setViewsState((prev) => {
      const existing = prev.views[editingViewMeta.id]
      if (!existing) return prev
      const updated = { ...existing, name: existing.builtin ? existing.name : trimmedName, description: editingViewMeta.description.trim() }
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
      const next = { activeViewId: wasActive ? BUILTIN_VIEW_ID : prev.activeViewId, views: restViews }
      persistViewsState(next)
      return next
    })
    if (wasActive) {
      const def = viewsState.views[BUILTIN_VIEW_ID]
      setColumnVisibility(def.columnVisibility); setColumnOrder(def.columnOrder)
      setDensity(def.density); setColumnWidths(def.columnWidths || {})
    }
  }

  const resetActiveViewToDefault = () => {
    const layout = createDefaultViewLayout()
    setColumnVisibility(layout.columnVisibility); setColumnOrder(layout.columnOrder)
    setDensity(layout.density); setColumnWidths(layout.columnWidths || {})
  }

  const toggleColumn = (key) => setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }))

  // ─── Column drag-to-reorder ──────────────────────────────────────────────
  const handleColumnDragStart = (e, key) => {
    setDraggedColumn(key); setDragHintRect(null)
    try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", key) } catch {
      // Some browsers are picky about dataTransfer in certain contexts.
    }
  }
  const handleColumnDragOver = (e, key) => {
    e.preventDefault(); e.dataTransfer.dropEffect = "move"
    if (key !== dragOverColumn) setDragOverColumn(key)
  }
  const handleColumnDrop = (e, key) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === key) { setDraggedColumn(null); setDragOverColumn(null); return }
    setColumnOrder((prev) => {
      const next = [...prev]
      const fromIdx = next.indexOf(draggedColumn), toIdx = next.indexOf(key)
      if (fromIdx === -1 || toIdx === -1) return prev
      next.splice(fromIdx, 1); next.splice(toIdx, 0, draggedColumn)
      return next
    })
    setDraggedColumn(null); setDragOverColumn(null)
  }
  const handleColumnDragEnd = () => { setDraggedColumn(null); setDragOverColumn(null) }

  // ─── Column drag-to-resize ────────────────────────────────────────────────
  // Drag the divider on a header's right edge to resize; double-click it to
  // snap back to auto width. Widths live in the active view alongside
  // visibility/order/density, so they persist and travel between views.
  const widthStyle = (key, fallbackMin, fallbackMax) => {
    const w = columnWidths[key]
    if (w) return { width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` }
    return fallbackMax ? { minWidth: fallbackMin, maxWidth: fallbackMax } : { minWidth: fallbackMin }
  }

  const startResize = (event, key) => {
    event.preventDefault(); event.stopPropagation()
    const th = event.currentTarget.closest("th")
    const startX = event.clientX
    const startWidth = th ? th.getBoundingClientRect().width : 120
    setResizingColumn(key)
    const onMove = (moveEvent) => {
      const next = Math.max(64, Math.round(startWidth + (moveEvent.clientX - startX)))
      setColumnWidths((prev) => ({ ...prev, [key]: next }))
    }
    const onUp = () => {
      setResizingColumn(null)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    // Held on <body> so the cursor doesn't flicker back as the pointer
    // outruns the 6px handle mid-drag, and text can't be selected.
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  const autoFitColumn = (key) => setColumnWidths((prev) => { const { [key]: _dropped, ...rest } = prev; return rest })

  const ColumnResizer = ({ colKey }) => (
    <span
      onMouseDown={(e) => startResize(e, colKey)}
      onDoubleClick={(e) => { e.stopPropagation(); autoFitColumn(colKey) }}
      onDragStart={(e) => { e.preventDefault(); e.stopPropagation() }}
      onClick={(e) => e.stopPropagation()}
      title="Drag to resize · double-click to auto-fit"
      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none z-10"
      style={{ backgroundColor: resizingColumn === colKey ? "#a67c52" : "transparent" }}
    />
  )

  // ─── Header filters ───────────────────────────────────────────────────────
  const openHeaderFilter = (type, event) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    setHeaderFilterOpen((prev) => (prev?.type === type ? null : { type, rect }))
  }
  const closeHeaderFilter = () => setHeaderFilterOpen(null)

  const FilterTrigger = ({ type, active }) => (
    <button type="button" onClick={(e) => openHeaderFilter(type, e)}
      className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${active ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"}`}
      title="Filter this column">
      <SlidersHorizontal size={11} />
    </button>
  )

  const filterActiveFor = (filterType) => {
    switch (filterType) {
      case "investment": return localFilters.investmentMin != null || localFilters.investmentMax != null
      case "startDate": return !!(localFilters.startFrom || localFilters.startTo)
      case "sector": return localFilters.sector.length > 0
      case "location": return localFilters.location.length > 0
      case "teamSize": return localFilters.teamSize.length > 0
      case "status": return localFilters.status.length > 0
      case "dealType": return localFilters.dealType.length > 0
      case "roi": return !!localFilters.roi.trim()
      default: return false
    }
  }

  const openRowMenu = (cohort, event) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    const menuWidth = 220
    let x = rect.right - menuWidth
    let y = rect.bottom + 6
    if (x < 12) x = 12
    if (y + 300 > window.innerHeight - 12) y = rect.top - 300 - 6
    setRowMenu({ cohort, position: { x, y } })
  }

  const handleViewGrowthSuite = (cohort) => {
    sessionStorage.setItem('viewingSMEId', cohort.smeId)
    sessionStorage.setItem('viewingSMEName', cohort.smeName)
    sessionStorage.setItem('investorViewMode', 'true')
    sessionStorage.setItem('viewOrigin', 'investor')
    window.location.href = '/overall-company-health'
  }

  const handleViewDetails = (cohort) => {
    setSelectedCohort(cohort)
    setRowMenu(null)
  }

  const getPrimaryAction = (cohort) => {
    const meta = getStatusMeta(cohort.currentStatus)
    if (meta.group === "exited") return { label: "View Record", handler: handleViewGrowthSuite }
    if (needsAttention(cohort)) return { label: "Review Investment", handler: handleViewGrowthSuite }
    return { label: "Deep Dive", handler: handleViewGrowthSuite }
  }

  // ─── Derived ──────────────────────────────────────────────────────────────
  const visibleCohorts = useMemo(() => cohorts.filter((c) => showArchived || !c.archived), [cohorts, showArchived])

  const counts = useMemo(() => ({
    total: visibleCohorts.length,
    active: visibleCohorts.filter((c) => getStatusMeta(c.currentStatus).group === "active" && !needsAttention(c)).length,
    attention: visibleCohorts.filter((c) => getStatusMeta(c.currentStatus).group === "active" && needsAttention(c)).length,
    exited: visibleCohorts.filter((c) => getStatusMeta(c.currentStatus).group === "exited").length,
  }), [visibleCohorts])

  // Options come from the rows actually loaded, so they can't drift from the data.
  const sectorOptions = useMemo(() => [...new Set(visibleCohorts.map((c) => c.sector).filter((s) => s && s !== "Not specified"))].sort(), [visibleCohorts])
  const locationOptions = useMemo(() => [...new Set(visibleCohorts.map((c) => c.location).filter((l) => l && l !== "Not specified"))].sort(), [visibleCohorts])
  const teamSizeOptions = useMemo(() => [...new Set(visibleCohorts.map((c) => c.teamSize).filter((t) => t && t !== "Not specified"))].sort(), [visibleCohorts])
  const dealTypeOptions = useMemo(() => [...new Set(visibleCohorts.map((c) => c.dealType).filter((d) => d && d !== "Not specified"))].sort(), [visibleCohorts])
  const statusOptions = useMemo(() => [...new Set(Object.values(STATUS_META).map((m) => m.label))], [])

  const activeFilterCount = (localFilters.name.trim() ? 1 : 0)
    + (localFilters.investmentMin != null || localFilters.investmentMax != null ? 1 : 0)
    + (localFilters.startFrom || localFilters.startTo ? 1 : 0)
    + localFilters.sector.length + localFilters.location.length
    + localFilters.teamSize.length + localFilters.status.length + localFilters.dealType.length
    + (localFilters.roi.trim() ? 1 : 0)

  const filteredCohorts = useMemo(() => {
    let result = visibleCohorts

    if (activeFilter === "active") {
      result = result.filter((c) => getStatusMeta(c.currentStatus).group === "active" && !needsAttention(c))
    } else if (activeFilter === "attention") {
      result = result.filter((c) => getStatusMeta(c.currentStatus).group === "active" && needsAttention(c))
    } else if (activeFilter === "exited") {
      result = result.filter((c) => getStatusMeta(c.currentStatus).group === "exited")
    }

    if (localFilters.name.trim()) {
      const q = localFilters.name.toLowerCase().trim()
      result = result.filter((c) => c.smeName.toLowerCase().includes(q))
    }

    if (localFilters.investmentMin != null) result = result.filter((c) => toAmount(c.dealAmount) >= localFilters.investmentMin)
    if (localFilters.investmentMax != null) result = result.filter((c) => toAmount(c.dealAmount) <= localFilters.investmentMax)

    if (localFilters.startFrom || localFilters.startTo) {
      result = result.filter((c) => {
        const d = toDateSafe(c.completionDate)
        if (!d) return false
        if (localFilters.startFrom && d < new Date(localFilters.startFrom)) return false
        if (localFilters.startTo && d > new Date(localFilters.startTo + "T23:59:59")) return false
        return true
      })
    }

    if (localFilters.sector.length) result = result.filter((c) => localFilters.sector.includes(c.sector))
    if (localFilters.location.length) result = result.filter((c) => localFilters.location.includes(c.location))
    if (localFilters.teamSize.length) result = result.filter((c) => localFilters.teamSize.includes(c.teamSize))
    if (localFilters.dealType.length) result = result.filter((c) => localFilters.dealType.includes(c.dealType))
    if (localFilters.status.length) result = result.filter((c) => localFilters.status.includes(getStatusMeta(c.currentStatus).label))

    if (localFilters.roi.trim()) {
      const q = localFilters.roi.toLowerCase().trim()
      result = result.filter((c) => (c.roi || "").toString().toLowerCase().includes(q))
    }

    return result
  }, [visibleCohorts, activeFilter, localFilters])

  const rowPad = density === "compact" ? "py-2.5 px-3" : "py-3.5 px-4"

  // ─── Data-driven cell renderer ───────────────────────────────────────────
  // Each cell carries the same width style as its header, so a dragged width
  // holds instead of the body re-expanding the column. One size, one weight,
  // one colour across every cell.
  const renderCell = (key, cohort) => {
    const col = COLUMN_DEFS[key]
    const style = widthStyle(key, col.minWidth)
    switch (key) {
      case "investmentAmount":
        return <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`} style={style}><span className="text-[#4a352f]">{formatCurrency(cohort.dealAmount)}</span></td>
      case "startDate":
        return <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`} style={style}><span className="text-[#4a352f]">{formatDate(cohort.completionDate)}</span></td>
      case "sector":
        return <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`} style={style}><span className="text-[#4a352f]">{cohort.sector}</span></td>
      case "location":
        return <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`} style={style}><span className="text-[#4a352f]">{cohort.location}</span></td>
      case "teamSize":
        return <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`} style={style}><span className="text-[#4a352f]">{cohort.teamSize}</span></td>
      case "status": {
        const meta = getStatusMeta(cohort.currentStatus)
        const flagged = meta.group === "active" && needsAttention(cohort)
        return (
          <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`} style={style}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap" style={{ backgroundColor: meta.color + "20", color: meta.color }}>
                {meta.label}
              </span>
              {flagged && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: "#fff3e0", color: "#e65100" }} title="Missing investment date or amount on record">
                  <AlertCircle size={11} /> Attention
                </span>
              )}
            </div>
          </td>
        )
      }
      case "roi":
        return (
          <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`} style={style}>
            <span style={{ color: getRoiColor(cohort.roi) }}>{cohort.roi}</span>
          </td>
        )
      case "dealType":
        return <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`} style={style}><span className="text-[#4a352f]">{cohort.dealType}</span></td>
      default:
        return null
    }
  }

  if (subscriptionLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader size={36} className="text-[#a67c52] animate-spin" />
        <p className="text-[#7d5a50] text-base ml-3">Checking subscription...</p>
      </div>
    )
  }

  if (loading) return <LoadingSkeleton />

  const visibleColumnKeys = columnOrder.filter((key) => columnVisibility[key])
  const allVisibleSelected = filteredCohorts.length > 0 && filteredCohorts.every((c) => selectedRows.has(c.id))

  return (
    <div className="min-h-screen box-border transition-[margin-left] duration-300">
      <div className="mx-auto px-8 w-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-[#4a352f] mb-1">My Investment Cohorts</h1>
            <p className="text-[#7d5a50] text-base m-0">
              View and manage your portfolio of closed business investments
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={`flex items-center gap-1.5 border-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${showArchived ? "bg-[#7d5a50] text-white border-[#7d5a50]" : "bg-white text-[#7d5a50] border-[#c8b6a6] hover:bg-[#f5f0e1]"}`}
            >
              <Archive size={14} /> {showArchived ? "Hiding archived: off" : "Show archived"}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`bg-white text-[#a67c52] border-2 border-[#a67c52] rounded-lg px-4 py-2.5 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all duration-300 hover:bg-[#f5f0e1] ${refreshing ? 'opacity-60' : ''}`}
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </div>

        <InvestorStagePipeline counts={counts} activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

        {/* Toolbar */}
        <div className="bg-[#faf7f2] rounded-t-2xl p-4 border border-[#e6d7c3] border-b-0 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
                <LayoutGrid size={12} className="text-[#7d5a50] flex-shrink-0" />
                Viewing: {activeView.name}
                {activeView.description && <span className="font-normal text-[#a89482]"> — {activeView.description}</span>}
              </span>
              {activeFilterCount > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#fff3e0] text-[#e65100] border border-[#e65100]/30">
                  <SlidersHorizontal size={12} /> {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                  <button onClick={() => setLocalFilters({ ...EMPTY_FILTERS })} className="ml-1 underline hover:text-[#4a352f]">Clear</button>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={(e) => {
                    if (showCustomizeMenu) { setShowCustomizeMenu(false); setCustomizeMenuRect(null) }
                    else { setCustomizeMenuRect(e.currentTarget.getBoundingClientRect()); setShowCustomizeMenu(true); setShowNewViewForm(false); setEditingViewMeta(null) }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm"
                >
                  <SlidersHorizontal size={16} /> Customize Table <ChevronDown size={14} className={`transition-transform ${showCustomizeMenu ? 'rotate-180' : ''}`} />
                </button>
                {showCustomizeMenu && customizeMenuRect && (() => {
                  const panelWidth = 320, margin = 12
                  const left = Math.min(Math.max(customizeMenuRect.right - panelWidth, margin), window.innerWidth - panelWidth - margin)
                  const spaceBelow = window.innerHeight - customizeMenuRect.bottom - margin - 8
                  const spaceAbove = customizeMenuRect.top - margin - 8
                  const openUpward = spaceBelow < 320 && spaceAbove > spaceBelow
                  const maxHeight = Math.max(200, Math.min(620, openUpward ? spaceAbove : spaceBelow))
                  const top = openUpward ? undefined : customizeMenuRect.bottom + 8
                  const bottom = openUpward ? window.innerHeight - customizeMenuRect.top + 8 : undefined
                  const allViews = Object.values(viewsState.views).sort((a, b) => (a.builtin ? -1 : b.builtin ? 1 : a.name.localeCompare(b.name)))
                  return (
                    <Portal>
                      <div className="fixed inset-0 z-40" onClick={() => { setShowCustomizeMenu(false); setCustomizeMenuRect(null); setShowNewViewForm(false); setEditingViewMeta(null) }} />
                      <div className="fixed bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-5 z-50 overflow-y-auto" style={{ left, width: panelWidth, top, bottom, maxHeight }}>
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
                                    <input autoFocus value={editingViewMeta.name} onChange={(e) => setEditingViewMeta((prev) => ({ ...prev, name: e.target.value }))} placeholder="View name" className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm" />
                                  ) : (
                                    <p className="text-sm font-semibold text-[#4a352f]">Default <span className="font-normal text-[#a89482] text-xs">(name can't be changed)</span></p>
                                  )}
                                  <textarea value={editingViewMeta.description} onChange={(e) => setEditingViewMeta((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description (optional)" rows={2} className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none" />
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingViewMeta(null)} className="px-2.5 py-1 text-xs text-[#7d5a50] hover:text-[#4a352f]">Cancel</button>
                                    <button onClick={saveViewMeta} className="px-2.5 py-1 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold">Save</button>
                                  </div>
                                </div>
                              )
                            }
                            return (
                              <div key={view.id} className={`flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg ${isActive ? 'bg-[#f5f0e1]' : 'hover:bg-[#faf7f2]'}`}>
                                <button onClick={() => switchToView(view.id)} className="flex-1 text-left min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {isActive && <CheckCircle size={12} className="text-[#7d5a50] flex-shrink-0" />}
                                    <span className={`text-sm ${isActive ? 'font-semibold text-[#4a352f]' : 'text-[#4a352f]'}`}>{view.name}</span>
                                    {view.builtin && <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Built-in</span>}
                                  </div>
                                  {view.description && <p className="text-xs text-[#a89482] mt-0.5 truncate">{view.description}</p>}
                                </button>
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  <button onClick={() => startEditingViewMeta(view)} title="Rename / edit description" className="text-[#a89482] hover:text-[#7d5a50] p-1"><Settings size={13} /></button>
                                  {!view.builtin && <button onClick={() => removeView(view.id)} title="Delete view" className="text-[#a89482] hover:text-red-500 p-1"><Trash2 size={13} /></button>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {showNewViewForm ? (
                          <div className="space-y-2 mb-1">
                            <input autoFocus value={newViewName} onChange={(e) => setNewViewName(e.target.value)} placeholder="New view name..." className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm" />
                            <textarea value={newViewDescription} onChange={(e) => setNewViewDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none" />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setShowNewViewForm(false); setNewViewName(""); setNewViewDescription("") }} className="px-2.5 py-1 text-xs text-[#7d5a50] hover:text-[#4a352f]">Cancel</button>
                              <button onClick={createNewView} disabled={!newViewName.trim()} className="px-3 py-1.5 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold disabled:opacity-40">Create view</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setShowNewViewForm(true)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-[#c8b6a6] rounded-lg text-xs font-semibold text-[#7d5a50] hover:bg-[#faf7f2]">
                            <Plus size={13} /> New view from current layout
                          </button>
                        )}

                        <div className="border-t border-[#e6d7c3] my-4" />

                        <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Hide/Unhide</h4>
                        <p className="text-xs text-[#a89482] mb-3 flex items-center gap-1.5">
                          <GripVertical size={12} className="flex-shrink-0" /> Tip: drag a column header to reorder it, or pull its right edge to resize.
                        </p>
                        <label className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                          <input type="checkbox" checked readOnly disabled className="rounded border-[#c8b6a6]" />
                          <span className="text-sm text-[#4a352f]">Company Name</span>
                        </label>
                        <div className="border-t border-[#e6d7c3] my-2" />
                        {DEFAULT_COLUMN_ORDER.map((key) => (
                          <label key={key} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-[#faf7f2] cursor-pointer">
                            <input type="checkbox" checked={columnVisibility[key] || false} onChange={() => toggleColumn(key)} className="rounded border-[#c8b6a6] text-[#7d5a50]" />
                            <span className="text-sm text-[#4a352f]">{COLUMN_DEFS[key].label}</span>
                          </label>
                        ))}

                        <div className="border-t border-[#e6d7c3] my-4" />
                        <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Density</h4>
                        <div className="flex gap-1.5">
                          {[{ key: 'comfortable', label: 'Comfortable' }, { key: 'compact', label: 'Compact' }].map((d) => (
                            <button key={d.key} onClick={() => setDensity(d.key)} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${density === d.key ? 'bg-[#7d5a50] text-white' : 'bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]'}`}>
                              {d.label}
                            </button>
                          ))}
                        </div>

                        <div className="border-t border-[#e6d7c3] my-4" />
                        <button onClick={resetActiveViewToDefault} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#a67c52] hover:text-[#4a352f] hover:bg-[#faf7f2] border border-[#e6d7c3]">
                          <RotateCcw size={12} /> Reset "{activeView.name}" to factory defaults
                        </button>
                      </div>
                    </Portal>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedRows.size > 0 && (
          <div className="bg-[#4a352f] text-white px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-semibold">{selectedRows.size} selected</span>
            <div className="flex items-center gap-2">
              <button onClick={() => handleExportSelected(filteredCohorts)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-all">
                <Download size={13} /> Export Selected
              </button>
              <button onClick={() => openStatusModal(filteredCohorts.filter((c) => selectedRows.has(c.id)))} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-all">
                Change Status
              </button>
              <button onClick={() => setSelectedRows(new Set())} className="px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white">Clear</button>
            </div>
          </div>
        )}

        {filteredCohorts.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden w-full border border-[#e6d7c3]" style={selectedRows.size > 0 ? { borderTopLeftRadius: 0, borderTopRightRadius: 0 } : undefined}>
            <div className="p-4 border-b-2 border-[#e6d7c3] bg-[#f5f0e1] flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[#4a352f] m-0">Portfolio Businesses</h2>
              <span className="text-xs text-[#7d5a50] bg-[#a67c52]/15 px-3 py-1.5 rounded-md font-semibold">
                {filteredCohorts.length} {filteredCohorts.length === 1 ? 'business' : 'businesses'}
              </span>
            </div>

            <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
              <style>{`
                .ic-th { color: #faf7f2 !important; vertical-align: top !important; }
                .ic-th-draggable { cursor: grab; }
                .ic-th-draggable:active { cursor: grabbing; }
                .ic-th-label { flex: 1 1 auto; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; overflow-wrap: break-word; line-height: 1.2; }
                /* Column resizing: a dragged header width only holds if the
                   cells below it can shrink, so long values wrap rather than
                   setting a min-content width that forces the column open. */
                .ic-fit th, .ic-fit td { overflow: hidden; }
                .ic-fit td { word-break: break-word; }
              `}</style>
              <table className="border-collapse text-sm ic-fit" style={{ tableLayout: 'auto' }}>
                <thead>
                  <tr className="bg-[#4a352f]">
                    <th className={`ic-th ${rowPad} sticky top-0 left-0 z-30 border-r border-[#e6d7c3]`} style={{ backgroundColor: '#4a352f', width: '40px' }}>
                      <button onClick={() => toggleSelectAll(filteredCohorts)} className="flex items-center justify-center">
                        {allVisibleSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </th>
                    <th className={`ic-th ${rowPad} relative text-left font-semibold text-xs uppercase tracking-wide border-r border-[#e6d7c3] sticky top-0 left-0 z-30`} style={{ backgroundColor: '#4a352f', ...widthStyle('__name__', '200px', '240px') }}>
                      <div className="flex items-start gap-1 min-w-0">
                        <span className="ic-th-label">Company Name</span>
                        <FilterTrigger type="name" active={!!localFilters.name.trim()} />
                      </div>
                      <ColumnResizer colKey="__name__" />
                    </th>

                    {visibleColumnKeys.map((key) => {
                      const col = COLUMN_DEFS[key]
                      const isDragging = draggedColumn === key
                      const isDragOver = dragOverColumn === key && draggedColumn !== key
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
                          className={`ic-th ic-th-draggable ${rowPad} relative text-left font-semibold text-xs uppercase tracking-wide border-r border-[#e6d7c3] sticky top-0 z-20 select-none transition-opacity ${isDragging ? 'opacity-40' : ''}`}
                          style={{ ...widthStyle(key, col.minWidth), backgroundColor: isDragOver ? '#5a423b' : '#4a352f' }}
                        >
                          <div className="flex items-start gap-1 min-w-0">
                            <GripVertical size={11} className="opacity-40 flex-shrink-0 mt-0.5" />
                            <span className="ic-th-label">{col.label}</span>
                            <FilterTrigger type={col.filterType} active={filterActiveFor(col.filterType)} />
                          </div>
                          <ColumnResizer colKey={key} />
                        </th>
                      )
                    })}
                    <th className={`ic-th ${rowPad} relative text-center font-semibold text-xs uppercase tracking-wide whitespace-nowrap border-r border-[#e6d7c3] sticky top-0 z-20`} style={{ backgroundColor: '#4a352f', ...widthStyle('action', '170px') }}>
                      Action
                      <ColumnResizer colKey="action" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCohorts.map((cohort) => {
                    const isExpanded = expandedRows.has(cohort.id)
                    const primaryAction = getPrimaryAction(cohort)

                    return (
                      <React.Fragment key={cohort.id}>
                        <tr
                          className="last:border-b-0 border-b border-[#f0e6d9] transition-colors duration-200"
                          style={{ backgroundColor: hoveredRowKey === cohort.id ? '#faf7f2' : undefined }}
                          onMouseEnter={() => setHoveredRowKey(cohort.id)}
                          onMouseLeave={() => setHoveredRowKey(null)}
                        >
                          <td className={`${rowPad} border-r border-[#e6d7c3]`}>
                            <button onClick={() => toggleRowSelected(cohort.id)} className="flex items-center justify-center">
                              {selectedRows.has(cohort.id) ? <CheckSquare size={16} className="text-[#7d5a50]" /> : <Square size={16} className="text-[#c8b6a6]" />}
                            </button>
                          </td>
                          <td
                            className={`${rowPad} sticky left-0 z-10 border-r border-[#e6d7c3] transition-colors`}
                            style={{ ...widthStyle('__name__', '200px', '240px'), backgroundColor: hoveredRowKey === cohort.id ? '#faf7f2' : '#ffffff' }}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[#4a352f]">{cohort.smeName}</span>
                              <button
                                onClick={() => handleViewDetails(cohort)}
                                className="text-[#a89482] hover:text-[#7d5a50] transition-colors flex-shrink-0"
                                aria-label={`View summary for ${cohort.smeName}`}
                                title="View summary"
                              >
                                <Eye size={13} />
                              </button>
                            </div>
                          </td>

                          {visibleColumnKeys.map((key) => renderCell(key, cohort))}

                          <td className={`${rowPad} text-center`} style={widthStyle('action', '170px')}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => primaryAction.handler(cohort)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:shadow-md whitespace-nowrap"
                                style={{ backgroundColor: "#a67c52" }}
                              >
                                {primaryAction.label}
                              </button>
                              <button
                                onClick={(e) => openRowMenu(cohort, e)}
                                className="p-2 rounded-lg border border-[#c8b6a6] text-[#7d5a50] hover:bg-[#f5f0e1] transition-all"
                                aria-label="More actions"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-[#faf7f2] border-b border-[#f0e6d9]">
                            <td></td>
                            <td colSpan={visibleColumnKeys.length + 2} className="px-4 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-semibold text-[#4a352f] mb-1 uppercase tracking-wide">Description</p>
                                  <p className="text-sm text-[#4a352f]">{cohort.description}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-[#4a352f] mb-1 uppercase tracking-wide">Deal Structure</p>
                                  <p className="text-sm text-[#4a352f]">{cohort.dealStructure}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs font-semibold text-[#4a352f] uppercase tracking-wide">Latest Activity</p>
                                    <button onClick={() => setNoteModal({ cohort, text: "" })} className="flex items-center gap-1 text-xs text-[#7d5a50] hover:text-[#4a352f]">
                                      <Plus size={12} /> Add Note
                                    </button>
                                  </div>
                                  {(notesByCohort[cohort.id] || []).length === 0 ? (
                                    <p className="text-sm text-[#a89482] italic">No notes recorded yet.</p>
                                  ) : (
                                    <div className="space-y-2 max-h-[140px] overflow-y-auto">
                                      {(notesByCohort[cohort.id] || []).map((n, i) => (
                                        <div key={i} className="bg-white rounded-lg border border-[#e6d7c3] p-2">
                                          <p className="text-sm text-[#4a352f]">{n.note}</p>
                                          <p className="text-[10px] text-[#a89482] mt-1">{n.authorName || "Investor"} · {n.createdAtMs ? formatDate(n.createdAtMs) : "Just now"}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center p-[60px_20px] bg-white rounded-2xl shadow-md border border-[#e6d7c3] w-full">
            <Trophy size={60} className="text-[#c8b6a6] mx-auto mb-5" />
            <h3 className="text-2xl font-semibold text-[#4a352f] mb-3">
              {visibleCohorts.length === 0 ? "No Portfolio Businesses Yet" : "No results after filtering"}
            </h3>
            <p className="text-[#7d5a50] text-base max-w-[500px] mx-auto">
              {visibleCohorts.length === 0
                ? "Your investments will appear here once a deal reaches the closed stage in your pipeline."
                : <>No investments match the current filters. <button onClick={() => { setActiveFilter("all"); setLocalFilters({ ...EMPTY_FILTERS }) }} className="underline hover:text-[#4a352f]">Clear filters</button></>}
            </p>
          </div>
        )}
      </div>

      {/* ─── Drag hint tooltip ─────────────────────────────────────────────── */}
      {dragHintRect && !draggedColumn && !resizingColumn && (
        <Portal>
          <div className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal flex items-center gap-1.5"
            style={{ top: dragHintRect.bottom + 8, left: Math.min(Math.max(dragHintRect.left, 12), window.innerWidth - 235), width: '225px' }}>
            <GripVertical size={12} className="flex-shrink-0" /> Drag to reorder · pull the edge to resize
          </div>
        </Portal>
      )}

      {/* ─── Column header filter popover ──────────────────────────────────── */}
      {headerFilterOpen && (
        <Portal>
          <div className="fixed inset-0 z-[1090]" onClick={closeHeaderFilter} />
          <div className="fixed z-[1091] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-4"
            style={{
              top: headerFilterOpen.rect.bottom + 8,
              left: Math.min(Math.max(headerFilterOpen.rect.left - 20, 12), window.innerWidth - 312),
              width: '300px', maxHeight: '70vh', overflowY: 'auto',
            }}>

            {headerFilterOpen.type === 'name' && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Company name</label>
                  {localFilters.name && <button onClick={() => setLocalFilters((p) => ({ ...p, name: '' }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <input autoFocus type="text" value={localFilters.name}
                  onChange={(e) => setLocalFilters((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Search company name..."
                  className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20" />
              </>
            )}

            {headerFilterOpen.type === 'investment' && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Investment amount (R)</label>
                  {(localFilters.investmentMin != null || localFilters.investmentMax != null) && (
                    <button onClick={() => setLocalFilters((p) => ({ ...p, investmentMin: null, investmentMax: null }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" min="0" placeholder="Min" value={localFilters.investmentMin ?? ''}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, investmentMin: e.target.value === '' ? null : Number(e.target.value) }))}
                    className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                  <span className="text-[#7d5a50]">to</span>
                  <input type="number" min="0" placeholder="Max" value={localFilters.investmentMax ?? ''}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, investmentMax: e.target.value === '' ? null : Number(e.target.value) }))}
                    className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                </div>
              </>
            )}

            {headerFilterOpen.type === 'startDate' && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Start date</label>
                  {(localFilters.startFrom || localFilters.startTo) && (
                    <button onClick={() => setLocalFilters((p) => ({ ...p, startFrom: '', startTo: '' }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <label className="block text-[10px] text-[#7d5a50] mb-1">From</label>
                <input type="date" value={localFilters.startFrom} onChange={(e) => setLocalFilters((p) => ({ ...p, startFrom: e.target.value }))} className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm mb-3" />
                <label className="block text-[10px] text-[#7d5a50] mb-1">To</label>
                <input type="date" value={localFilters.startTo} onChange={(e) => setLocalFilters((p) => ({ ...p, startTo: e.target.value }))} className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm" />
              </>
            )}

            {['sector', 'location', 'teamSize', 'dealType', 'status'].includes(headerFilterOpen.type) && (() => {
              const cfg = {
                sector: { label: 'Sector', key: 'sector', options: sectorOptions, empty: 'No sector data available' },
                location: { label: 'Location', key: 'location', options: locationOptions, empty: 'No location data available' },
                teamSize: { label: 'Team Size', key: 'teamSize', options: teamSizeOptions, empty: 'No team size data available' },
                dealType: { label: 'Deal Type', key: 'dealType', options: dealTypeOptions, empty: 'No deal type data available' },
                status: { label: 'Status', key: 'status', options: statusOptions, empty: 'No status data available' },
              }[headerFilterOpen.type]
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-[#4a352f]">{cfg.label}</label>
                    {localFilters[cfg.key].length > 0 && (
                      <button onClick={() => setLocalFilters((p) => ({ ...p, [cfg.key]: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto">
                    {cfg.options.length === 0 && <span className="text-xs text-[#a89482]">{cfg.empty}</span>}
                    {cfg.options.map((opt) => (
                      <button key={opt}
                        onClick={() => setLocalFilters((p) => ({ ...p, [cfg.key]: p[cfg.key].includes(opt) ? p[cfg.key].filter((x) => x !== opt) : [...p[cfg.key], opt] }))}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters[cfg.key].includes(opt) ? 'bg-[#7d5a50] text-white' : 'bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              )
            })()}

            {headerFilterOpen.type === 'roi' && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">ROI</label>
                  {localFilters.roi && <button onClick={() => setLocalFilters((p) => ({ ...p, roi: '' }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <input autoFocus type="text" value={localFilters.roi}
                  onChange={(e) => setLocalFilters((p) => ({ ...p, roi: e.target.value }))}
                  placeholder="Search ROI (e.g. Pending, 45%)..."
                  className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20" />
              </>
            )}
          </div>
        </Portal>
      )}

      {/* ─── Row secondary-action menu ────────────────────────────────────── */}
      {rowMenu && (
        <Portal>
          <div className="fixed inset-0 z-[1090]" onClick={() => setRowMenu(null)} />
          <div className="fixed z-[1100] bg-white rounded-xl shadow-2xl border border-[#e6d7c3] py-1 overflow-visible"
            style={{ top: rowMenu.position.y, left: rowMenu.position.x, width: '220px' }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#e6d7c3]">
              <span className="text-xs font-semibold text-[#4a352f]">Quick Actions</span>
              <button onClick={() => setRowMenu(null)} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={14} /></button>
            </div>
            <button onClick={() => { handleViewGrowthSuite(rowMenu.cohort); setRowMenu(null) }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left">
              <TrendingUp size={12} /> Open Growth Suite
            </button>
            <button onClick={() => { setNoteModal({ cohort: rowMenu.cohort, text: "" }); setRowMenu(null) }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left">
              <StickyNote size={12} /> Add Note
            </button>
            <button onClick={() => openStatusModal(rowMenu.cohort)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left">
              <ArrowUpDown size={12} /> Change Status
            </button>
            <button onClick={() => handleViewDetails(rowMenu.cohort)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left">
              <Eye size={12} /> View Details
            </button>
            {/* The expand chevron was removed from the Company Name cell, so
                row expansion lives here now. */}
            <button onClick={() => { toggleExpandRow(rowMenu.cohort); setRowMenu(null) }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left">
              {expandedRows.has(rowMenu.cohort.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expandedRows.has(rowMenu.cohort.id) ? "Collapse Row" : "Expand Row"}
            </button>
            <div className="border-t border-[#e6d7c3] my-1" />
            <button onClick={() => handleArchive(rowMenu.cohort)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 text-left">
              <Archive size={12} /> Archive Record
            </button>
          </div>
        </Portal>
      )}

      {/* ─── Add Note Modal ────────────────────────────────────────────────── */}
      {noteModal && (
        <div style={modalOverlayStyle} onClick={() => setNoteModal(null)}>
          <div style={{ ...modalContentStyle, maxWidth: '450px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#3e2723] m-0">Add Note — {noteModal.cohort.smeName}</h3>
              <button onClick={() => setNoteModal(null)}><X size={18} /></button>
            </div>
            <textarea value={noteModal.text} onChange={(e) => setNoteModal((prev) => ({ ...prev, text: e.target.value }))}
              placeholder="What happened, or what needs follow-up?" rows={4}
              className="w-full px-3 py-2 border-2 border-[#c8b6a6] rounded-lg text-sm resize-y" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setNoteModal(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSaveNote} disabled={!noteModal.text.trim()} className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-sm font-semibold disabled:opacity-40">Save Note</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Change Status Modal ───────────────────────────────────────────── */}
      {statusModal && (
        <div style={modalOverlayStyle} onClick={() => setStatusModal(null)}>
          <div style={{ ...modalContentStyle, maxWidth: '460px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#3e2723] m-0">
                Change Status {statusModal.cohorts.length > 1 ? `(${statusModal.cohorts.length} investments)` : `— ${statusModal.cohorts[0].smeName}`}
              </h3>
              <button onClick={() => setStatusModal(null)}><X size={18} /></button>
            </div>
            <label className="block text-xs font-semibold text-[#5d4037] mb-2">New status</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={() => setStatusModal((prev) => ({ ...prev, targetGroup: "active" }))}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 ${statusModal.targetGroup === "active" ? "border-[#4caf50] bg-[#e8f5e9] text-[#2e7d32]" : "border-[#e6d7c3] text-[#4a352f]"}`}>
                Active Investment
              </button>
              <button onClick={() => setStatusModal((prev) => ({ ...prev, targetGroup: "exited" }))}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 ${statusModal.targetGroup === "exited" ? "border-[#2196f3] bg-[#e3f2fd] text-[#0d47a1]" : "border-[#e6d7c3] text-[#4a352f]"}`}>
                Exited (Successful)
              </button>
            </div>
            {statusModal.targetGroup === "exited" && (
              <textarea value={statusModal.note} onChange={(e) => setStatusModal((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Exit note (optional)" rows={3}
                className="w-full px-3 py-2 border-2 border-[#c8b6a6] rounded-lg text-sm resize-y mb-2" />
            )}
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setStatusModal(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button onClick={submitStatusChange} disabled={!statusModal.targetGroup}
                className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-sm font-semibold disabled:opacity-40">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Generic confirm modal ────────────────────────────────────────── */}
      {bulkConfirm && (
        <div style={modalOverlayStyle} onClick={() => setBulkConfirm(null)}>
          <div style={{ ...modalContentStyle, maxWidth: '420px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={20} className="text-[#e65100]" />
              <h3 className="text-base font-bold text-[#3e2723] m-0">Please confirm</h3>
            </div>
            <p className="text-sm text-[#5d4037] mb-5">{bulkConfirm.message}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setBulkConfirm(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button onClick={async () => { await bulkConfirm.onConfirm(); setBulkConfirm(null) }} className="px-4 py-2 bg-[#e65100] text-white rounded-lg text-sm font-semibold">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Detailed View Modal ───────────────────────────────────────────── */}
      {selectedCohort && (
        <div style={modalOverlayStyle} onClick={() => setSelectedCohort(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8 pb-6 border-b-[3px] border-[#8d6e63]">
              <h2 className="text-[28px] font-bold text-[#3e2723] m-0 flex items-center gap-3">
                <Trophy size={32} className="text-[#ffd700]" />
                Investment Details: {selectedCohort.smeName}
              </h2>
              <button onClick={() => setSelectedCohort(null)} className="bg-none border-none text-2xl cursor-pointer text-gray-600 p-2">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mb-8">
              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200">
                <h3 className="text-[#3e2723] mb-4 flex items-center gap-2">
                  <DollarSign size={20} /> Investment Details
                </h3>
                <div className="grid gap-3">
                  <div><strong>Investment Amount:</strong> {formatCurrency(selectedCohort.dealAmount)}</div>
                  <div><strong>Deal Type:</strong> {selectedCohort.dealType}</div>
                  <div><strong>Deal Structure:</strong> {selectedCohort.dealStructure}</div>
                  <div>
                    <strong>ROI:</strong>
                    <span className="ml-2 font-bold" style={{ color: getRoiColor(selectedCohort.roi) }}>{selectedCohort.roi}</span>
                    <span className="ml-2 text-sm text-[#7d5a50]">({getRoiLabel(selectedCohort.roi)})</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200">
                <h3 className="text-[#3e2723] mb-4 flex items-center gap-2">
                  <Calendar size={20} /> Timeline & Performance
                </h3>
                <div className="grid gap-3">
                  <div><strong>Investment Date:</strong> {formatDate(selectedCohort.completionDate)}</div>
                  <div><strong>Investment Duration:</strong> {selectedCohort.dealDuration}</div>
                  <div>
                    <strong>Revenue Growth:</strong>
                    <span className="ml-2 font-bold" style={{ color: getRoiColor(selectedCohort.revenueGrowth) }}>{selectedCohort.revenueGrowth}</span>
                  </div>
                  <div>
                    <strong>Current Status:</strong>
                    <span className="ml-2 px-2 py-1 rounded-lg text-xs font-semibold" style={{
                      backgroundColor: getStatusMeta(selectedCohort.currentStatus).color + "20",
                      color: getStatusMeta(selectedCohort.currentStatus).color,
                    }}>
                      {getStatusMeta(selectedCohort.currentStatus).label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200">
                <h3 className="text-[#3e2723] mb-4 flex items-center gap-2">
                  <Building size={20} /> Business Details
                </h3>
                <div className="grid gap-3">
                  <div><strong>Sector:</strong> {selectedCohort.sector}</div>
                  <div><strong>Location:</strong> {selectedCohort.location}</div>
                  <div><strong>Team Size:</strong> {selectedCohort.teamSize}</div>
                  <div><strong>Exit Strategy:</strong> {selectedCohort.exitStrategy}</div>
                </div>
              </div>
            </div>

            <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200 mb-6">
              <h3 className="text-[#3e2723] mb-4 flex items-center gap-2">
                <TrendingUp size={20} /> Value-Add Support Provided
              </h3>
              <p className="text-base text-gray-800 leading-relaxed m-0">{selectedCohort.supportProvided}</p>
            </div>

            {selectedCohort.statusHistory?.length > 0 && (
              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200 mb-6">
                <h3 className="text-[#3e2723] mb-4">Status History</h3>
                <div className="space-y-2">
                  {selectedCohort.statusHistory.map((h, i) => (
                    <div key={i} className="text-sm text-gray-700 border-b border-gray-200 pb-2 last:border-b-0">
                      <strong>{h.previousStatus}</strong> → <strong>{h.newStatus}</strong>
                      <span className="text-xs text-gray-500 ml-2">{formatDate(h.changedAt)}</span>
                      {h.note && <div className="text-xs text-gray-600 mt-1">{h.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-[#e8f5e9] p-6 rounded-xl border border-[#4caf50] mb-6">
              <h3 className="text-[#2e7d32] mb-4 flex items-center gap-2">
                <BarChart3 size={20} /> Investment Performance Summary
              </h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: getRoiColor(selectedCohort.roi) }}>{selectedCohort.roi}</div>
                  <div className="text-sm text-gray-600">Return on Investment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{formatCurrency(selectedCohort.dealAmount)}</div>
                  <div className="text-sm text-gray-600">Investment Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: getRoiColor(selectedCohort.revenueGrowth) }}>{selectedCohort.revenueGrowth}</div>
                  <div className="text-sm text-gray-600">Revenue Growth</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => handleViewGrowthSuite(selectedCohort)}
                className="bg-[#a67c52] text-white border-none rounded-xl px-6 py-3 text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-[#8d6e63]">
                <span className="flex items-center gap-2"><Wrench size={18} /> Open Growth Suite</span>
              </button>
              <button onClick={() => setSelectedCohort(null)}
                className="bg-[#5d4037] text-white border-none rounded-xl px-8 py-3 text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-[#4a352f]">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Upsell for basic plan ─────────────────────────────────────────── */}
      {currentPlan === "basic" && (
        <Upsell
          title="Unlock Your Investment Portfolio"
          description="Upgrade to see all your closed investments, track ROI, and manage your portfolio businesses."
          buttonText="Upgrade Now"
          onUpgrade={() => navigate('/subscription')}
          icon={<Trophy size={48} className="text-[#ffd700]" />}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .bg-shimmer { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; }
        .animate-shimmer { animation: shimmer 1.5s ease-in-out infinite; }
        .animate-shimmer-d1 { animation: shimmer 1.5s ease-in-out 0.2s infinite; }
        .animate-shimmer-d2 { animation: shimmer 1.5s ease-in-out 0.4s infinite; }
        .animate-shimmer-d3 { animation: shimmer 1.5s ease-in-out 0.6s infinite; }
        .animate-shimmer-d4 { animation: shimmer 1.5s ease-in-out 0.8s infinite; }
        .bg-shimmer-light { background: linear-gradient(90deg, #f8f8f8 25%, #ececec 50%, #f8f8f8 75%); background-size: 200% 100%; }
        .bg-shimmer-mid { background: linear-gradient(90deg, #e8e8e8 25%, #d8d8d8 50%, #e8e8e8 75%); background-size: 200% 100%; }
        .bg-shimmer-dark { background: linear-gradient(90deg, #d8d8d8 25%, #c8c8c8 50%, #d8d8d8 75%); background-size: 200% 100%; }
        @media (max-width: 768px) { .main-container { margin-left: 0 !important; padding: 20px; } }
      `}</style>
    </div>
  )
}

export default MyCohorts