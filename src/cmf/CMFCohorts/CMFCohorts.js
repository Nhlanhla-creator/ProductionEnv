"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import {
  Trophy, Users, TrendingUp, Building, MapPin, DollarSign, Calendar, Eye,
  RefreshCw, X, BarChart3, ChevronDown, ChevronUp, FileText, Copy, CheckCircle,
  Ticket, MoreVertical, Lock, AlertCircle, Info, Layers, GraduationCap,
  Wrench, SlidersHorizontal, LayoutGrid, Settings, RotateCcw, GripVertical,
  Square, CheckSquare, ArrowUpDown, Download, Archive, StickyNote, Plus, Trash2,
  Briefcase, Award, Package, FileCheck, Star, Clock, Activity
} from "lucide-react"
import {
  collection, addDoc, updateDoc, arrayUnion, serverTimestamp,
  doc, getDoc, getDocs, query, where, deleteDoc
} from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { useCMFMatches } from "../CMFMatches/CMFMatchesContext"
import { useNavigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"

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

// Shared date coercion used by the date-range filters — handles Firestore
// Timestamps and plain strings, returns null rather than an Invalid Date.
const toDateSafe = (value) => {
  if (!value) return null
  const d = typeof value === "object" && typeof value.toDate === "function" ? value.toDate() : new Date(value)
  return isNaN(d.getTime()) ? null : d
}

// Support value arrives as a formatted string ("R 2,500,000"), so the numeric
// range filter needs the digits pulled back out of it.
const toAmount = (value) => {
  if (value == null) return 0
  const n = parseFloat(value.toString().replace(/[^0-9.]/g, ""))
  return isNaN(n) ? 0 : n
}

// ─── Status vocabulary ──────────────────────────────────────────────────────
const STATUS_META = {
  "Active": { label: "Active Support", color: "#4caf50", group: "active" },
  "Active Support": { label: "Active Support", color: "#4caf50", group: "active" },
  "Exit": { label: "Exited", color: "#9e9e9e", group: "exited" },
  "Exited": { label: "Exited", color: "#9e9e9e", group: "exited" },
}

const getStatusMeta = (status) => STATUS_META[status] || { label: status || "Active Support", color: "#7d5a50", group: "active" }

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
const CMF_STAGE_CARDS = [
  { key: "active", label: "Active Support", icon: TrendingUp, note: true, noteText: "Businesses currently receiving active support and guidance." },
  { key: "attention", label: "Attention Required", icon: AlertCircle, note: true, noteText: "Businesses with missing or incomplete data that need your attention." },
  { key: "exited", label: "Exited", icon: GraduationCap, note: true, noteText: "Businesses that have completed their support journey." },
]

const CMFStagePipeline = ({ counts, activeFilter, setActiveFilter }) => {
  const total = counts.total || 1
  const toggle = (key) => setActiveFilter(activeFilter === key ? "all" : key)

  return (
    <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#4a352f]">My CMF Cohorts</h3>
          <span title="Your active engagements with businesses">
            <Info size={12} className="text-[#a89482]" />
          </span>
        </div>
        <button
          onClick={() => toggle("all")}
          className="flex items-baseline gap-1.5 px-3 py-1 rounded-xl transition-all hover:bg-[#f5f0e1]"
          style={{ backgroundColor: activeFilter === "all" ? "#f5f0e1" : "transparent" }}
        >
          <span className="text-lg font-extrabold text-[#4a352f]">{counts.total}</span>
          <span className="text-[10px] text-[#7d5a50] font-semibold uppercase tracking-wide">Total Businesses</span>
        </button>
      </div>

      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        {CMF_STAGE_CARDS.map(({ key, label, icon: Icon, note, noteText }) => {
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
// column has one — there's no separate filters panel.
const COLUMN_DEFS = {
  supportValue: { label: "Support Value", minWidth: "112px", filterType: "supportValue" },
  startDate: { label: "Start Date", minWidth: "96px", filterType: "startDate" },
  sector: { label: "Sector", minWidth: "100px", filterType: "sector" },
  location: { label: "Location", minWidth: "92px", filterType: "location" },
  teamSize: { label: "Team Size", minWidth: "80px", filterType: "teamSize" },
  status: { label: "Status", minWidth: "130px", filterType: "status" },
  dealType: { label: "Deal Type", minWidth: "100px", filterType: "dealType" },
  supportProvided: { label: "Support Provided", minWidth: "120px", filterType: "supportProvided" },
}

const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS)
const DEFAULT_COLUMN_VISIBILITY = {
  supportValue: true, startDate: true, status: true, dealType: true,
  sector: true, location: false, teamSize: false, supportProvided: false,
}
const DEFAULT_DENSITY = "comfortable"

const EMPTY_FILTERS = {
  name: "",
  supportMin: null, supportMax: null,
  startFrom: "", startTo: "",
  sector: [], location: [], teamSize: [], status: [], dealType: [],
  supportProvided: "",
}

// ─── Custom Views ──────────────────────────────────────────────────────────
// A view bundles column visibility, order, width and density into one named
// object, with exactly one active at a time. Editing the table edits the
// active view and auto-saves immediately.
const BUILTIN_VIEW_ID = "__default__"
const VIEWS_STORAGE_KEY = "cmf-cohorts-views-v1"
const ACTIVE_FILTER_STORAGE_KEY = "cmf-cohorts-active-filter-v1"

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
  // indexed delays[4], which produced className="undefined" on the last cell.
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

export default function CMFCohorts() {
  const { smeMatches, funderMatches, catalystMatches, loading: contextLoading, reloadMatches } = useCMFMatches()
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState([])
  const [showBridgePopup, setShowBridgePopup] = useState(false)
  const [showDraftsPopup, setShowDraftsPopup] = useState(false)

  const [activeCohortTab, setActiveCohortTab] = useState("businesses")
  const [cmfCohorts, setCmfCohorts] = useState([])
  const [onboardedUserIds, setOnboardedUserIds] = useState(new Set())

  const fetchDrafts = async () => {
    const user = auth.currentUser
    if (!user) return
    try {
      const q = query(
        collection(db, "cmfOnboardingDrafts"),
        where("facilitatorId", "==", user.uid)
      )
      const snap = await getDocs(q)
      const loadedDrafts = []
      snap.forEach((docSnap) => {
        loadedDrafts.push({ id: docSnap.id, ...docSnap.data() })
      })
      setDrafts(loadedDrafts)
    } catch (e) {
      console.error("Error loading onboarding drafts:", e)
    }
  }

  const fetchOnboardedUserIds = async () => {
    const user = auth.currentUser
    if (!user) return
    try {
      const q = query(
        collection(db, "users"),
        where("onboardedBy", "==", user.uid)
      )
      const snap = await getDocs(q)
      const ids = new Set()
      const cmfIds = []
      snap.forEach((docSnap) => {
        const data = docSnap.data()
        ids.add(docSnap.id)
        if (data.role === "CMF") {
          cmfIds.push(docSnap.id)
        }
      })
      setOnboardedUserIds(ids)

      const loadedCmfs = []
      for (const cmfId of cmfIds) {
        const profileDoc = await getDoc(doc(db, "cmfProfiles", cmfId))
        if (profileDoc.exists()) {
          loadedCmfs.push({ id: cmfId, ...profileDoc.data() })
        }
      }
      setCmfCohorts(loadedCmfs)
    } catch (e) {
      console.error("Error loading CMF cohorts:", e)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchDrafts()
        fetchOnboardedUserIds()
      }
    })
    return () => unsubscribe()
  }, [])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
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

  // Voucher state
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [voucherType, setVoucherType] = useState("")
  const [voucherSeats, setVoucherSeats] = useState(1)
  const [expirationDays, setExpirationDays] = useState(30)
  const [expirationMinutes, setExpirationMinutes] = useState(null)
  const [isTestMode, setIsTestMode] = useState(false)
  const [generatedVoucher, setGeneratedVoucher] = useState(null)
  const [copied, setCopied] = useState(false)
  const [savingVoucher, setSavingVoucher] = useState(false)

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

  // ─── Build cohorts from context ──────────────────────────────────────────
  const businessesCohorts = useMemo(() => {
    if (!smeMatches || smeMatches.length === 0) return []
    return smeMatches
      .filter((sme) => {
        const isDirectOnboarded = onboardedUserIds.has(sme.id)
        const status = (sme.currentStatus || sme.pipelineStage || "").toLowerCase()
        const isMatchedCohort = status.includes("active") || status.includes("exit") || status.includes("completed") || status.includes("support")
        return isDirectOnboarded || isMatchedCohort
      })
      .map((sme) => {
        const isDirectOnboarded = onboardedUserIds.has(sme.id)
        return {
          id: sme.id,
          docId: sme.id,
          smeId: sme.id,
          smeName: sme.name || "Unnamed Business",
          dealAmount: sme.fundingRequired || "Not specified",
          dealAmountRaw: sme.fundingAmount || toAmount(sme.fundingRequired),
          dealType: sme.equityOffered ? `Equity (${sme.equityOffered})` : "Not specified",
          completionDate: sme.applicationDate || null,
          sector: formatLabel(sme.sector) || "Not specified",
          location: formatLabel(sme.location) || "Not specified",
          teamSize: sme.teamSize || "Not specified",
          description: sme.supportRequired || sme.reason || "No description available",
          currentStatus: sme.currentStatus || sme.pipelineStage || "Active Support",
          lastUpdated: sme.lastActivity || null,
          dealStructure: "Support Program",
          dealDuration: "Ongoing",
          supportProvided: sme.supportRequired || "Advisory and growth support",
          roi: sme.roi || "Pending",
          revenueGrowth: sme.revenueGrowth || "Pending",
          exitStrategy: sme.exitStrategy || "To be determined",
          guarantees: sme.guarantees || "Not specified",
          servicesRequired: sme.servicesRequired || "Advisory",
          applicationDate: sme.applicationDate || null,
          applicationDateRaw: sme.applicationDate || null,
          archived: sme.archived || false,
          statusHistory: sme.statusHistory || [],
          source: isDirectOnboarded ? "onboarded" : "matched"
        }
      })
  }, [smeMatches, onboardedUserIds])

  const fundersCohorts = useMemo(() => {
    if (!funderMatches || funderMatches.length === 0) return []
    return funderMatches
      .filter((funder) => {
        const isDirectOnboarded = onboardedUserIds.has(funder.id)
        const status = (funder.status || funder.currentStatus || "").toLowerCase()
        const isMatchedCohort = status.includes("active") || status.includes("exit") || status.includes("completed") || status.includes("support")
        return isDirectOnboarded || isMatchedCohort
      })
      .map((funder) => {
        const isDirectOnboarded = onboardedUserIds.has(funder.id)
        return {
          id: funder.id,
          docId: funder.id,
          smeName: funder.name || "Unnamed Funder",
          dealAmount: funder.fundingRange || "Not specified",
          dealAmountRaw: toAmount(funder.fundingRange),
          dealType: funder.type || "Funder",
          completionDate: funder.createdAt || null,
          sector: Array.isArray(funder.sectors) ? funder.sectors.join(", ") : funder.sectors || "Not specified",
          location: funder.location || "Not specified",
          teamSize: "N/A",
          description: funder.description || "No description available",
          currentStatus: funder.status || "Active",
          lastUpdated: funder.lastActivity || null,
          supportProvided: funder.contactPerson ? `${funder.contactPerson} (${funder.email})` : funder.email || "Not specified",
          archived: funder.archived || false,
          source: isDirectOnboarded ? "onboarded" : "matched"
        }
      })
  }, [funderMatches, onboardedUserIds])

  const catalystsCohorts = useMemo(() => {
    if (!catalystMatches || catalystMatches.length === 0) return []
    return catalystMatches
      .filter((cat) => {
        const isDirectOnboarded = onboardedUserIds.has(cat.id)
        const status = (cat.status || cat.currentStatus || "").toLowerCase()
        const isMatchedCohort = status.includes("active") || status.includes("exit") || status.includes("completed") || status.includes("support")
        return isDirectOnboarded || isMatchedCohort
      })
      .map((cat) => {
        const isDirectOnboarded = onboardedUserIds.has(cat.id)
        return {
          id: cat.id,
          docId: cat.id,
          smeName: cat.name || "Unnamed Catalyst",
          dealAmount: cat.focus || "Not specified",
          dealAmountRaw: 0,
          dealType: cat.type || "Catalyst",
          completionDate: cat.createdAt || null,
          sector: Array.isArray(cat.sectors) ? cat.sectors.join(", ") : cat.sectors || "Not specified",
          location: cat.location || "Not specified",
          teamSize: "N/A",
          description: cat.description || "No description available",
          currentStatus: cat.status || "Active",
          lastUpdated: cat.lastActivity || null,
          supportProvided: cat.contactPerson ? `${cat.contactPerson} (${cat.email})` : cat.email || "Not specified",
          archived: cat.archived || false,
          source: isDirectOnboarded ? "onboarded" : "matched"
        }
      })
  }, [catalystMatches, onboardedUserIds])

  const cmfCohortsMapped = useMemo(() => {
    if (!cmfCohorts || cmfCohorts.length === 0) return []
    return cmfCohorts.map((cmf) => {
      const minT = cmf.generalInvestmentPreference?.minimumSupportTicket
      const maxT = cmf.generalInvestmentPreference?.maximumSupportTicket
      const range = minT || maxT ? `${formatCurrency(minT)} - ${formatCurrency(maxT)}` : "Not specified"
      return {
        id: cmf.id,
        docId: cmf.id,
        smeName: cmf.entityOverview?.registeredName || cmf.entityOverview?.tradingName || "Unnamed CMF",
        dealAmount: range,
        dealAmountRaw: toAmount(maxT),
        dealType: cmf.entityOverview?.entitySize || "CMF",
        completionDate: cmf.createdAt || null,
        sector: Array.isArray(cmf.generalInvestmentPreference?.sectorFocus) ? cmf.generalInvestmentPreference.sectorFocus.join(", ") : "Not specified",
        location: cmf.contactDetails?.physicalAddress || "Not specified",
        teamSize: "N/A",
        description: cmf.entityOverview?.businessDescription || "No description available",
        currentStatus: "Active",
        lastUpdated: null,
        supportProvided: cmf.contactDetails?.contactName ? `${cmf.contactDetails.contactName} (${cmf.contactDetails.email || cmf.email})` : cmf.email || "Not specified",
        archived: cmf.archived || false,
      }
    })
  }, [cmfCohorts])

  const cohortsFromContext = useMemo(() => {
    if (activeCohortTab === "businesses") return businessesCohorts
    if (activeCohortTab === "funders") return fundersCohorts
    if (activeCohortTab === "catalysts") return catalystsCohorts
    if (activeCohortTab === "cmfs") return cmfCohortsMapped
    return []
  }, [activeCohortTab, businessesCohorts, fundersCohorts, catalystsCohorts, cmfCohortsMapped])

  const [cohorts, setCohorts] = useState([])

  useEffect(() => {
    setCohorts(cohortsFromContext)
    setLoading(false)
  }, [cohortsFromContext])

  // ─── Notes ────────────────────────────────────────────────────────────────
  const fetchNotesForCohort = async (cohort) => {
    try {
      const snapshot = await getDocs(query(collection(db, "cmfNotes"), where("cohortId", "==", cohort.id)))
      const notes = snapshot.docs
        .map((d) => d.data())
        .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))
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
      await addDoc(collection(db, "cmfNotes"), {
        userId: user.uid,
        smeId: noteModal.cohort.smeId,
        cohortId: noteModal.cohort.id,
        note: noteModal.text.trim(),
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
        authorName: user.displayName || user.email || "CMF Facilitator",
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
          await updateDoc(doc(db, "cmfApplications", cohort.docId), { archived: true })
          setCohorts((prev) => prev.map((c) => (c.id === cohort.id ? { ...c, archived: true } : c)))
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
    const newStatus = statusModal.targetGroup === "exited" ? "Exited" : "Active Support"
    const ids = new Set(statusModal.cohorts.map((c) => c.id))

    const run = async () => {
      try {
        for (const cohort of statusModal.cohorts) {
          const prevMeta = getStatusMeta(cohort.currentStatus)
          const historyEntry = {
            previousStatus: prevMeta.label,
            newStatus,
            changedAt: new Date().toISOString(),
            reason: statusModal.reason || null,
            note: statusModal.note || null,
          }
          await updateDoc(doc(db, "cmfApplications", cohort.docId), {
            status: newStatus,
            statusHistory: arrayUnion(historyEntry),
          })
        }
        // The previous version rebuilt statusHistory by looking the row up in
        // the modal's own list and appending its *existing* history to itself,
        // which duplicated entries and dropped the new one. The new entry is
        // appended directly instead.
        setCohorts((prev) => prev.map((c) => (
          ids.has(c.id)
            ? {
                ...c,
                currentStatus: newStatus,
                statusHistory: [
                  ...(c.statusHistory || []),
                  {
                    previousStatus: getStatusMeta(c.currentStatus).label,
                    newStatus,
                    changedAt: new Date().toISOString(),
                    reason: statusModal.reason || null,
                    note: statusModal.note || null,
                  },
                ],
              }
            : c
        )))
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
          ? `Mark ${statusModal.cohorts.length} businesses as Exited?`
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
      const headers = ["Company Name", "Support Value", "Start Date", "Status", "Sector", "Location", "Deal Type"]
      const dataRows = selected.map((c) => [
        c.smeName, formatCurrency(c.dealAmount), formatDate(c.completionDate),
        getStatusMeta(c.currentStatus).label, c.sector, c.location, c.dealType,
      ].map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(","))
      const csv = [headers.join(","), ...dataRows].join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url; link.download = `cmf-portfolio-${new Date().toISOString().split("T")[0]}.csv`; link.click()
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
      case "supportValue": return localFilters.supportMin != null || localFilters.supportMax != null
      case "startDate": return !!(localFilters.startFrom || localFilters.startTo)
      case "sector": return localFilters.sector.length > 0
      case "location": return localFilters.location.length > 0
      case "teamSize": return localFilters.teamSize.length > 0
      case "status": return localFilters.status.length > 0
      case "dealType": return localFilters.dealType.length > 0
      case "supportProvided": return !!localFilters.supportProvided.trim()
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
    if (y + 280 > window.innerHeight - 12) y = rect.top - 280 - 6
    setRowMenu({ cohort, position: { x, y } })
  }

  const handleViewGrowthSuite = (cohort) => {
    sessionStorage.setItem('viewingSMEId', cohort.smeId)
    sessionStorage.setItem('viewingSMEName', cohort.smeName)
    sessionStorage.setItem('investorViewMode', 'true')
    sessionStorage.setItem('viewOrigin', 'cmf')
    window.location.href = '/overall-company-health'
  }

  const handleViewDocuments = (cohort) => {
    sessionStorage.setItem('viewingSMEId', cohort.smeId)
    sessionStorage.setItem('viewingSMEName', cohort.smeName)
    sessionStorage.setItem('investorViewMode', 'true')
    window.location.href = '/my-documents'
  }

  // Opening details previously set selectedCohort but nothing rendered it, so
  // the eye icon and "View Details" did nothing visible. A dedicated flag now
  // drives the detail modal, kept separate from the voucher flow which also
  // uses selectedCohort.
  const handleViewDetails = (cohort) => {
    setSelectedCohort(cohort)
    setShowDetailModal(true)
    setRowMenu(null)
  }

  const handleManagePartnerProfile = (cohort) => {
    sessionStorage.setItem('viewingSMEId', cohort.id)
    sessionStorage.setItem('viewingSMEName', cohort.smeName)
    sessionStorage.setItem('investorViewMode', 'true')
    sessionStorage.setItem('viewOrigin', 'cmf')
    
    const profileRoutes = {
      businesses: '/profile',
      funders: '/investor-profile',
      catalysts: '/support-profile',
      cmfs: '/cmf-profile'
    }
    const route = profileRoutes[activeCohortTab] || '/profile'
    window.location.href = route
  }

  // ─── Voucher ──────────────────────────────────────────────────────────────
  const generateVoucherCode = (type) => {
    const prefix = type === "legitimacy" ? "LG" : type === "capital" ? "CA" : type === "governance" ? "GV" : type === "compliance" ? "CM" : "PR"
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
    const seatsPart = voucherSeats.toString().padStart(2, '0')
    return `${prefix}${seatsPart}${randomPart}`
  }

  const handleGenerateVoucher = (cohort, type) => {
    setSelectedCohort(cohort)
    setShowDetailModal(false)
    setVoucherType(type)
    setShowVoucherModal(true)
    setGeneratedVoucher(null)
    setVoucherSeats(1)
    setExpirationDays(30)
    setExpirationMinutes(null)
    setIsTestMode(false)
    setRowMenu(null)
  }

  const handleExpirationChange = (value) => {
    if (value === "5min") { setIsTestMode(true); setExpirationMinutes(5); setExpirationDays(null) }
    else { setIsTestMode(false); setExpirationMinutes(null); setExpirationDays(parseInt(value)) }
  }

  const handleConfirmVoucher = async () => {
    const user = auth.currentUser
    if (!user) { alert("Please log in to generate vouchers"); return }
    if (!selectedCohort) { alert("No business selected. Please try again."); return }

    const code = generateVoucherCode(voucherType)
    setSavingVoucher(true)
    try {
      const smeUserId = selectedCohort?.smeId
      if (!smeUserId) {
        alert("Error: Cannot find business user ID. Please contact support.")
        setSavingVoucher(false)
        return
      }

      const expiresAt = new Date()
      if (isTestMode && expirationMinutes) expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes)
      else if (expirationDays) expiresAt.setDate(expiresAt.getDate() + expirationDays)

      const voucherData = {
        code, type: voucherType, seats: voucherSeats,
        planName: voucherType === "premium" ? "Premium" :
          voucherType === "legitimacy" ? "Legitimacy Boost" :
          voucherType === "capital" ? "Capital Appeal Boost" :
          voucherType === "governance" ? "Governance Boost" :
          voucherType === "compliance" ? "Compliance Boost" : "Standard",
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        expirationDays, expirationMinutes, isTestMode,
        status: "active", remainingSeats: voucherSeats, redeemedSeats: [],
        voucherCodes: [code], createdBy: user.uid,
        createdForSME: selectedCohort?.id || null,
        catalystId: user.uid, smeId: smeUserId,
        smeName: selectedCohort?.smeName || null,
        catalystName: user.displayName || user.email || "CMF Facilitator",
        cohortId: selectedCohort?.id, createdAtTimestamp: Date.now()
      }

      const docRef = await addDoc(collection(db, "vouchers"), voucherData)
      setGeneratedVoucher({ ...voucherData, id: docRef.id })

      const expiryMessage = isTestMode
        ? `Expires in ${expirationMinutes} minutes at ${expiresAt.toLocaleTimeString()}`
        : `Expires on ${expiresAt.toLocaleDateString()}`
      alert(`Voucher ${code} successfully generated for ${selectedCohort?.smeName}! ${expiryMessage}`)
    } catch (error) {
      console.error("Error saving voucher:", error)
      alert("Failed to save voucher. Please try again.")
    } finally {
      setSavingVoucher(false)
    }
  }

  const handleCopyCode = () => {
    if (generatedVoucher) {
      navigator.clipboard.writeText(generatedVoucher.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getVoucherTypeName = (type) => {
    switch (type) {
      case "legitimacy": return "Boost Your Legitimacy Score"
      case "capital": return "Boost Capital Appeal Score"
      case "governance": return "Boost Governance Score"
      case "compliance": return "Boost Your Compliance"
      default: return "Premium Subscription"
    }
  }

  const getPrimaryAction = (cohort) => {
    if (activeCohortTab !== "businesses") {
      return { label: "View Profile", handler: handleViewDetails }
    }
    const meta = getStatusMeta(cohort.currentStatus)
    if (meta.group === "exited") return { label: "View Record", handler: handleViewGrowthSuite }
    if (needsAttention(cohort)) return { label: "Review Business", handler: handleViewGrowthSuite }
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

  // Filter options come from the rows actually loaded, so the options and the
  // data can't drift apart the way a hard-coded dropdown list does.
  const sectorOptions = useMemo(() => [...new Set(visibleCohorts.map((c) => c.sector).filter((s) => s && s !== "Not specified"))].sort(), [visibleCohorts])
  const locationOptions = useMemo(() => [...new Set(visibleCohorts.map((c) => c.location).filter((l) => l && l !== "Not specified"))].sort(), [visibleCohorts])
  const teamSizeOptions = useMemo(() => [...new Set(visibleCohorts.map((c) => c.teamSize).filter((t) => t && t !== "Not specified"))].sort(), [visibleCohorts])
  const dealTypeOptions = useMemo(() => [...new Set(visibleCohorts.map((c) => c.dealType).filter((d) => d && d !== "Not specified"))].sort(), [visibleCohorts])
  const statusOptions = useMemo(() => [...new Set(Object.values(STATUS_META).map((m) => m.label))], [])

  const activeFilterCount = (localFilters.name.trim() ? 1 : 0)
    + (localFilters.supportMin != null || localFilters.supportMax != null ? 1 : 0)
    + (localFilters.startFrom || localFilters.startTo ? 1 : 0)
    + localFilters.sector.length + localFilters.location.length
    + localFilters.teamSize.length + localFilters.status.length + localFilters.dealType.length
    + (localFilters.supportProvided.trim() ? 1 : 0)

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

    if (localFilters.supportMin != null) result = result.filter((c) => toAmount(c.dealAmount) >= localFilters.supportMin)
    if (localFilters.supportMax != null) result = result.filter((c) => toAmount(c.dealAmount) <= localFilters.supportMax)

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

    if (localFilters.supportProvided.trim()) {
      const q = localFilters.supportProvided.toLowerCase().trim()
      result = result.filter((c) => (c.supportProvided || "").toLowerCase().includes(q))
    }

    return result
  }, [visibleCohorts, activeFilter, localFilters, activeCohortTab])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchOnboardedUserIds()
    if (reloadMatches) reloadMatches().then(() => setRefreshing(false))
    else setTimeout(() => setRefreshing(false), 800)
  }

  const rowPad = density === "compact" ? "py-2.5 px-3" : "py-3.5 px-4"

  // ─── Data-driven cell renderer ───────────────────────────────────────────
  // Each cell carries the same width style as its header, so a dragged width
  // actually holds instead of the body re-expanding the column.
  const renderCell = (key, cohort) => {
    const col = COLUMN_DEFS[key]
    const style = widthStyle(key, col.minWidth)
    switch (key) {
      case "supportValue":
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
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: "#fff3e0", color: "#e65100" }} title="Missing start date or funding information on record">
                  <AlertCircle size={11} /> Attention
                </span>
              )}
            </div>
          </td>
        )
      }
      case "dealType":
        return <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`} style={style}><span className="text-[#4a352f]">{cohort.dealType}</span></td>
      case "supportProvided":
        return <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`} style={style}><span className="text-[#4a352f] line-clamp-1">{cohort.supportProvided}</span></td>
      default:
        return null
    }
  }

  if (contextLoading || loading) return <LoadingSkeleton />

  const getColumnLabel = (key) => {
    if (activeCohortTab === "businesses") return COLUMN_DEFS[key].label;
    
    const labels = {
      funders: {
        supportValue: "Ticket Size Focus",
        startDate: "Onboarded Date",
        sector: "Sector Focus",
        location: "Location Focus",
        status: "Status",
        dealType: "Funder Type",
        supportProvided: "Contact Person"
      },
      catalysts: {
        supportValue: "Support Focus",
        startDate: "Onboarded Date",
        sector: "Sector Focus",
        location: "Location Focus",
        status: "Status",
        dealType: "Catalyst Type",
        supportProvided: "Contact Person"
      },
      cmfs: {
        supportValue: "Transaction Limit",
        startDate: "Onboarded Date",
        sector: "Sector Focus",
        location: "Location Focus",
        status: "Status",
        dealType: "Entity Size",
        supportProvided: "Contact Person"
      }
    };
    return labels[activeCohortTab]?.[key] || COLUMN_DEFS[key].label;
  }

  const nameLabel = activeCohortTab === "businesses"
    ? "Company Name"
    : activeCohortTab === "funders"
    ? "Funder Name"
    : activeCohortTab === "catalysts"
    ? "Organization"
    : "CMF Name"

  const getEmptyStateContent = () => {
    const icon = {
      businesses: <Trophy size={60} className="text-[#c8b6a6] mx-auto mb-5" />,
      funders: <Building size={60} className="text-[#c8b6a6] mx-auto mb-5" />,
      catalysts: <Award size={60} className="text-[#c8b6a6] mx-auto mb-5" />,
      cmfs: <Users size={60} className="text-[#c8b6a6] mx-auto mb-5" />,
    }[activeCohortTab];

    const title = visibleCohorts.length === 0
      ? {
          businesses: "No Businesses Yet",
          funders: "No Funders Yet",
          catalysts: "No Catalysts Yet",
          cmfs: "No Capital and Market Facilitators Yet",
        }[activeCohortTab]
      : "No results after filtering";

    const desc = visibleCohorts.length === 0
      ? {
          businesses: "Your onboarded businesses will appear here.",
          funders: "Your onboarded funders will appear here.",
          catalysts: "Your onboarded catalysts will appear here.",
          cmfs: "Ecosystem capital and market facilitators you onboarded will appear here.",
        }[activeCohortTab]
      : <>No records match the current filters. <button onClick={() => { setActiveFilter("all"); setLocalFilters({ ...EMPTY_FILTERS }) }} className="underline hover:text-[#4a352f]">Clear filters</button></>;

    return { icon, title, desc };
  }

  const emptyState = getEmptyStateContent();

  const visibleColumnKeys = columnOrder
    .filter((key) => columnVisibility[key])
    .filter((key) => activeCohortTab === "businesses" || key !== "teamSize")
  const allVisibleSelected = filteredCohorts.length > 0 && filteredCohorts.every((c) => selectedRows.has(c.id))

  return (
    <div className="min-h-screen box-border transition-[margin-left] duration-300">
      <div className="mx-auto px-8 w-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-[#4a352f] mb-1">My CMF Cohorts</h1>
            <p className="text-[#7d5a50] text-base m-0">
              View and manage your portfolio of active business engagements
            </p>
          </div>

          <div className="flex items-center gap-2 mt-8">
            {drafts.length > 0 && (
              <button
                onClick={() => setShowDraftsPopup(true)}
                className="bg-white text-[#7d5a50] border-2 border-[#c8b6a6] hover:bg-[#f5f0e1] rounded-lg px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 shadow-sm"
              >
                <FileText size={14} />
                Drafts ({drafts.length})
              </button>
            )}
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={`flex items-center gap-1.5 border-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${showArchived ? "bg-[#7d5a50] text-white border-[#7d5a50]" : "bg-white text-[#7d5a50] border-[#c8b6a6] hover:bg-[#f5f0e1]"}`}
            >
              <Archive size={14} /> {showArchived ? "Hiding archived: off" : "Show archived"}
            </button>
            {/* <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`bg-white text-[#a67c52] border-2 border-[#a67c52] rounded-lg px-4 py-2.5 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all duration-300 hover:bg-[#f5f0e1] ${refreshing ? 'opacity-60' : ''}`}
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button> */}
            <button
              onClick={() => {
                setShowBridgePopup(true)
              }}
              className="bg-[#7d5a50] hover:bg-[#6b4c43] text-white rounded-lg px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 shadow-md border-2 border-[#7d5a50]"
            >
              <Plus size={14} />
              Onboard Partners
            </button>
          </div>
        </div>

        <CMFStagePipeline counts={counts} activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

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
                  let left = Math.min(Math.max(customizeMenuRect.right - panelWidth, margin), window.innerWidth - panelWidth - margin)
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
                          <span className="text-sm text-[#4a352f]">{nameLabel}</span>
                        </label>
                        <div className="border-t border-[#e6d7c3] my-2" />
                        {DEFAULT_COLUMN_ORDER
                          .filter((key) => activeCohortTab === "businesses" || key !== "teamSize")
                          .map((key) => (
                            <label key={key} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-[#faf7f2] cursor-pointer">
                              <input type="checkbox" checked={columnVisibility[key] || false} onChange={() => toggleColumn(key)} className="rounded border-[#c8b6a6] text-[#7d5a50]" />
                              <span className="text-sm text-[#4a352f]">{getColumnLabel(key)}</span>
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

        {/* Tabs for Cohort Ecosystem Profiles */}
        <div className="flex gap-2 p-2 bg-gradient-to-r from-[#f5f0e1] to-[#faf7f2] rounded-t-2xl border border-[#e6d7c3] border-b-0 shadow-sm overflow-x-auto">
          {[
            { id: "businesses", label: "Businesses", icon: <Building size={16} />, count: businessesCohorts.length },
            { id: "funders", label: "Funders", icon: <DollarSign size={16} />, count: fundersCohorts.length },
            { id: "catalysts", label: "Catalysts", icon: <Trophy size={16} />, count: catalystsCohorts.length },
            { id: "cmfs", label: "Capital & Market Facilitators", icon: <Users size={16} />, count: cmfCohorts.length },
          ].map(({ id, label, icon, count }) => {
            const isActive = activeCohortTab === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveCohortTab(id);
                  setSelectedRows(new Set()); // clear row selection on tab switch
                }}
                className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#7d5a50] to-[#4a352f] text-white shadow-md"
                    : "text-[#7d5a50] hover:bg-white/70 hover:text-[#4a352f]"
                }`}
              >
                {icon}
                <span>{label}</span>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  isActive ? "bg-white/20 text-white" : "bg-[#7d5a50]/10 text-[#4a352f]"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {filteredCohorts.length > 0 ? (
          <div className="bg-white rounded-b-2xl shadow-md overflow-hidden w-full border border-[#e6d7c3] border-t-0" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <div className="p-4 border-b-2 border-[#e6d7c3] bg-[#f5f0e1] flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[#4a352f] m-0">
                {activeCohortTab === "businesses"
                  ? "Cohort Businesses"
                  : activeCohortTab === "funders"
                  ? "Cohort Funders"
                  : activeCohortTab === "catalysts"
                  ? "Cohort Catalysts"
                  : "Cohort CMFs"}
              </h2>
              <span className="text-xs text-[#7d5a50] bg-[#a67c52]/15 px-3 py-1.5 rounded-md font-semibold">
                {filteredCohorts.length} {
                  activeCohortTab === "businesses"
                    ? (filteredCohorts.length === 1 ? 'business' : 'businesses')
                    : activeCohortTab === "funders"
                    ? (filteredCohorts.length === 1 ? 'funder' : 'funders')
                    : activeCohortTab === "catalysts"
                    ? (filteredCohorts.length === 1 ? 'catalyst' : 'catalysts')
                    : (filteredCohorts.length === 1 ? 'CMF' : 'CMFs')
                }
              </span>
            </div>

            <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
              <style>{`
                .cmc-th { color: #faf7f2 !important; vertical-align: top !important; }
                .cmc-th-draggable { cursor: grab; }
                .cmc-th-draggable:active { cursor: grabbing; }
                .cmc-th-label { flex: 1 1 auto; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; overflow-wrap: break-word; line-height: 1.2; }
                /* Column resizing: a dragged header width only holds if the
                   cells below it can shrink, so long values wrap rather than
                   setting a min-content width that forces the column open. */
                .cmc-fit th, .cmc-fit td { overflow: hidden; }
                .cmc-fit td { word-break: break-word; }
              `}</style>
              <table className="border-collapse text-sm cmc-fit" style={{ tableLayout: 'auto' }}>
                <thead>
                  <tr className="bg-[#4a352f]">
                    <th className={`cmc-th ${rowPad} sticky top-0 left-0 z-30 border-r border-[#e6d7c3]`} style={{ backgroundColor: '#4a352f', width: '40px' }}>
                      <button onClick={() => toggleSelectAll(filteredCohorts)} className="flex items-center justify-center">
                        {allVisibleSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </th>
                    <th className={`cmc-th ${rowPad} relative text-left font-semibold text-xs uppercase tracking-wide border-r border-[#e6d7c3] sticky top-0 left-0 z-30`} style={{ backgroundColor: '#4a352f', ...widthStyle('__name__', '200px', '240px') }}>
                      <div className="flex items-start gap-1 min-w-0">
                        <span className="cmc-th-label">{nameLabel}</span>
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
                          className={`cmc-th cmc-th-draggable ${rowPad} relative text-left font-semibold text-xs uppercase tracking-wide border-r border-[#e6d7c3] sticky top-0 z-20 select-none transition-opacity ${isDragging ? 'opacity-40' : ''}`}
                          style={{ ...widthStyle(key, col.minWidth), backgroundColor: isDragOver ? '#5a423b' : '#4a352f' }}
                        >
                          <div className="flex items-start gap-1 min-w-0">
                            <GripVertical size={11} className="opacity-40 flex-shrink-0 mt-0.5" />
                            <span className="cmc-th-label">{getColumnLabel(key)}</span>
                            <FilterTrigger type={col.filterType} active={filterActiveFor(col.filterType)} />
                          </div>
                          <ColumnResizer colKey={key} />
                        </th>
                      )
                    })}
                    <th className={`cmc-th ${rowPad} relative text-center font-semibold text-xs uppercase tracking-wide whitespace-nowrap border-r border-[#e6d7c3] sticky top-0 z-20`} style={{ backgroundColor: '#4a352f', ...widthStyle('action', '170px') }}>
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
                            <div className="flex items-center gap-2 min-w-0 flex-wrap">
                              <span className="text-[#4a352f] font-semibold">{cohort.smeName}</span>
                              {cohort.source && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border flex-shrink-0 ${
                                  cohort.source === "onboarded"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}>
                                  {cohort.source === "onboarded" ? "Onboarded" : "Matched"}
                                </span>
                              )}
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
                                  <p className="text-xs font-semibold text-[#4a352f] mb-1 uppercase tracking-wide">Support Provided</p>
                                  <p className="text-sm text-[#4a352f]">{cohort.supportProvided}</p>
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
                                          <p className="text-[10px] text-[#a89482] mt-1">{n.authorName || "CMF Facilitator"} · {n.createdAtMs ? formatDate(n.createdAtMs) : "Just now"}</p>
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
          <div className="text-center p-[60px_20px] bg-white rounded-b-2xl shadow-md border border-[#e6d7c3] border-t-0 w-full flex flex-col items-center">
            {emptyState.icon}
            <h3 className="text-2xl font-semibold text-[#4a352f] mb-3">
              {emptyState.title}
            </h3>
            <div className="text-[#7d5a50] text-base max-w-[500px] mx-auto mb-6">
              {emptyState.desc}
            </div>
            {visibleCohorts.length === 0 && (
              <button
                onClick={() => {
                  const type = {
                    businesses: "Business",
                    funders: "Funder",
                    catalysts: "Catalyst",
                    cmfs: "CMF",
                  }[activeCohortTab];
                  navigate(`/cmf-cohorts/new?type=${type}`);
                }}
                className="bg-[#7d5a50] hover:bg-[#6b4c43] text-white rounded-lg px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 shadow-md border-2 border-[#7d5a50] cursor-pointer"
              >
                <Plus size={14} />
                {
                  {
                    businesses: "Onboard Business",
                    funders: "Onboard Funder",
                    catalysts: "Onboard Catalyst",
                    cmfs: "Onboard CMF",
                  }[activeCohortTab]
                }
              </button>
            )}
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

            {headerFilterOpen.type === 'supportValue' && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Support value (R)</label>
                  {(localFilters.supportMin != null || localFilters.supportMax != null) && (
                    <button onClick={() => setLocalFilters((p) => ({ ...p, supportMin: null, supportMax: null }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" min="0" placeholder="Min" value={localFilters.supportMin ?? ''}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, supportMin: e.target.value === '' ? null : Number(e.target.value) }))}
                    className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                  <span className="text-[#7d5a50]">to</span>
                  <input type="number" min="0" placeholder="Max" value={localFilters.supportMax ?? ''}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, supportMax: e.target.value === '' ? null : Number(e.target.value) }))}
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

            {headerFilterOpen.type === 'supportProvided' && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Support provided</label>
                  {localFilters.supportProvided && <button onClick={() => setLocalFilters((p) => ({ ...p, supportProvided: '' }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <input autoFocus type="text" value={localFilters.supportProvided}
                  onChange={(e) => setLocalFilters((p) => ({ ...p, supportProvided: e.target.value }))}
                  placeholder="Search support provided..."
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
            <button onClick={() => { handleViewDocuments(rowMenu.cohort); setRowMenu(null) }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left">
              <FileText size={12} /> View Documents
            </button>
            <button onClick={() => handleGenerateVoucher(rowMenu.cohort, "premium")} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left">
              <Ticket size={12} /> Generate Voucher
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
            <button onClick={() => { handleManagePartnerProfile(rowMenu.cohort); setRowMenu(null) }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left">
              <Settings size={12} /> Manage Profile
            </button>
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

      {/* ─── Detail modal ─────────────────────────────────────────────────── */}
      {showDetailModal && selectedCohort && (
        <div style={modalOverlayStyle} onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-[#e6d7c3] w-[680px] max-w-[95%] max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-5 text-white sticky top-0 z-10 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Support Engagement</p>
                <h3 className="text-lg font-bold mt-0.5 truncate">{selectedCohort.smeName}</h3>
                <p className="text-xs text-[#e6d7c3] mt-0.5">{selectedCohort.sector} · {selectedCohort.location}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-white/70 hover:text-white p-1 flex-shrink-0"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              {(() => {
                const sections = activeCohortTab === "businesses"
                  ? [
                      { label: "Support", fields: [
                        ["Support value", formatCurrency(selectedCohort.dealAmount)],
                        ["Deal type", selectedCohort.dealType],
                        ["Deal structure", selectedCohort.dealStructure],
                        ["Guarantees", selectedCohort.guarantees],
                      ]},
                      { label: "Timeline & status", fields: [
                        ["Start date", formatDate(selectedCohort.completionDate)],
                        ["Duration", selectedCohort.dealDuration],
                        ["Status", getStatusMeta(selectedCohort.currentStatus).label],
                        ["ROI", selectedCohort.roi],
                      ]},
                      { label: "Company", fields: [
                        ["Sector", selectedCohort.sector],
                        ["Location", selectedCohort.location],
                        ["Team size", selectedCohort.teamSize],
                        ["Services required", selectedCohort.servicesRequired],
                      ]},
                    ]
                  : [
                      {
                        label: activeCohortTab === "funders" ? "Funder Details" : activeCohortTab === "catalysts" ? "Catalyst Details" : "CMF Details",
                        fields: [
                          ["Type", selectedCohort.dealType],
                          [activeCohortTab === "funders" ? "Ticket Size Focus" : activeCohortTab === "catalysts" ? "Support Focus" : "Transaction Limit", selectedCohort.dealAmount],
                          ["Onboarded Date", formatDate(selectedCohort.completionDate)],
                          ["Status", selectedCohort.currentStatus || "Active"],
                        ]
                      },
                      {
                        label: "Domain Focus",
                        fields: [
                          ["Sectors", selectedCohort.sector],
                          ["Location Focus", selectedCohort.location],
                        ]
                      },
                      {
                        label: "Contact Information",
                        fields: [
                          ["Primary Contact", selectedCohort.supportProvided],
                        ]
                      }
                    ];

                return sections.map((section) => (
                  <div key={section.label}>
                    <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-3">{section.label}</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {section.fields.map(([label, value]) => (
                        <div key={label}>
                          <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">{label}</p>
                          <p className="text-sm text-[#4a352f]">{value ?? "N/A"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}

              {activeCohortTab === "businesses" && (
                <div className="px-4 py-3 rounded-xl bg-[#faf7f2] border border-[#e6d7c3]">
                  <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">Support provided</p>
                  <p className="text-sm text-[#4a352f] leading-relaxed">{selectedCohort.supportProvided}</p>
                </div>
              )}

              {selectedCohort.statusHistory?.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-2">Status history</p>
                  <div className="space-y-2">
                    {selectedCohort.statusHistory.map((h, i) => (
                      <div key={i} className="text-sm text-[#5d4037] border-b border-[#e6d7c3] pb-2 last:border-b-0">
                        <strong>{h.previousStatus}</strong> → <strong>{h.newStatus}</strong>
                        <span className="text-xs text-[#a89482] ml-2">{formatDate(h.changedAt)}</span>
                        {h.note && <div className="text-xs text-[#7d5a50] mt-1">{h.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-2">Generate support vouchers</p>
                <div className="flex flex-wrap gap-2">
                  {["premium", "legitimacy", "capital", "governance", "compliance"].map((type) => (
                    <button key={type} onClick={() => handleGenerateVoucher(selectedCohort, type)}
                      className="bg-[#a67c52] hover:bg-[#8d6e63] text-white rounded-lg px-4 py-2 text-xs font-semibold transition-all capitalize">
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[#e6d7c3]">
                <button onClick={() => setShowDetailModal(false)} className="bg-[#5d4037] hover:bg-[#4a352f] text-white rounded-xl px-6 py-2.5 text-sm font-semibold transition-all">Close</button>
              </div>
            </div>
          </div>
        </div>
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
                Change Status {statusModal.cohorts.length > 1 ? `(${statusModal.cohorts.length} businesses)` : `— ${statusModal.cohorts[0].smeName}`}
              </h3>
              <button onClick={() => setStatusModal(null)}><X size={18} /></button>
            </div>
            <label className="block text-xs font-semibold text-[#5d4037] mb-2">New status</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={() => setStatusModal((prev) => ({ ...prev, targetGroup: "active" }))}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 ${statusModal.targetGroup === "active" ? "border-[#4caf50] bg-[#e8f5e9] text-[#2e7d32]" : "border-[#e6d7c3] text-[#4a352f]"}`}>
                Active Support
              </button>
              <button onClick={() => setStatusModal((prev) => ({ ...prev, targetGroup: "exited" }))}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 ${statusModal.targetGroup === "exited" ? "border-[#9e9e9e] bg-[#f3f4f6] text-[#4a352f]" : "border-[#e6d7c3] text-[#4a352f]"}`}>
                Exited
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

      {/* ─── Voucher Generation Modal ─────────────────────────────────────── */}
      {showVoucherModal && (
        <div style={modalOverlayStyle} onClick={() => setShowVoucherModal(false)}>
          <div style={{ ...modalContentStyle, maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#3e2723] m-0">Generate Voucher for {selectedCohort?.smeName}</h2>
              <button onClick={() => setShowVoucherModal(false)} className="bg-none border-none cursor-pointer">
                <X size={20} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            {!generatedVoucher ? (
              <>
                <p className="text-sm text-[#5d4037] mb-6">Select the type of voucher you want to generate for this business:</p>

                <div className="grid gap-3 mb-6">
                  {[
                    { id: "premium", label: "Premium Subscription", icon: "🌟" },
                    { id: "legitimacy", label: "Boost Your Legitimacy Score", icon: "🏆" },
                    { id: "capital", label: "Boost Capital Appeal Score", icon: "💰" },
                    { id: "governance", label: "Boost Governance Score", icon: "⚖️" },
                    { id: "compliance", label: "Boost Your Compliance", icon: "📋" },
                  ].map((option) => (
                    <label key={option.id} className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all" style={{
                      borderColor: voucherType === option.id ? "#a67c52" : "#E8D5C4",
                      backgroundColor: voucherType === option.id ? "#fef9f4" : "white",
                    }}>
                      <input type="radio" name="voucherType" value={option.id} checked={voucherType === option.id}
                        onChange={(e) => setVoucherType(e.target.value)} className="mr-3 accent-[#a67c52]" />
                      <span className="text-xl mr-3">{option.icon}</span>
                      <span className="text-sm" style={{ color: "#3e2723", fontWeight: voucherType === option.id ? "600" : "400" }}>{option.label}</span>
                    </label>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#5d4037] mb-3">Number of Seats:</label>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setVoucherSeats(Math.max(1, voucherSeats - 1))}
                      className="w-10 h-10 rounded-full border-2 border-[#a67c52] bg-white text-lg font-bold hover:bg-[#FAF5EF] cursor-pointer flex items-center justify-center">-</button>
                    <span className="text-xl font-bold text-[#3e2723] min-w-[30px] text-center">{voucherSeats}</span>
                    <button onClick={() => setVoucherSeats(voucherSeats + 1)}
                      className="w-10 h-10 rounded-full border-2 border-[#a67c52] bg-white text-lg font-bold hover:bg-[#FAF5EF] cursor-pointer flex items-center justify-center">+</button>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-semibold text-[#5d4037] mb-3">Voucher Expiration:</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <select value={isTestMode ? "5min" : (expirationDays || 30)} onChange={(e) => handleExpirationChange(e.target.value)}
                        className="px-4 py-2 border-2 border-[#a67c52] rounded-lg bg-white text-sm cursor-pointer focus:outline-none flex-1 min-w-[150px]">
                        <option value="5min">5 minutes (TEST MODE)</option>
                        <option value="7">7 days</option>
                        <option value="14">14 days</option>
                        <option value="30">30 days (1 month)</option>
                        <option value="60">60 days (2 months)</option>
                        <option value="90">90 days (3 months)</option>
                        <option value="180">180 days (6 months)</option>
                        <option value="365">365 days (1 year)</option>
                      </select>
                      <div className="text-sm font-medium text-gray-600">
                        {isTestMode
                          ? `Expires in 5 minutes at ${new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()}`
                          : `Expires on ${new Date(Date.now() + (expirationDays || 30) * 24 * 60 * 60 * 1000).toLocaleDateString()}`}
                      </div>
                    </div>
                    <p className={`text-xs ${isTestMode ? "text-[#ff9800] font-bold" : "text-[#a67c52]"}`}>
                      {isTestMode
                        ? "TEST MODE: this voucher will expire in 5 minutes."
                        : "Vouchers expire on this date. After that, redemption is barred."}
                    </p>
                  </div>
                </div>

                <button onClick={handleConfirmVoucher} disabled={!voucherType || savingVoucher}
                  className={`w-full py-4 text-white rounded-xl text-base font-bold transition-all duration-200 cursor-pointer ${(!voucherType || savingVoucher) ? "bg-gray-300 cursor-not-allowed" : "bg-[#a67c52] hover:bg-[#8d6e63]"}`}>
                  {savingVoucher ? "Saving Voucher..." : "Generate Voucher"}
                </button>
              </>
            ) : (
              <>
                <div className="p-6 rounded-xl text-center mb-6" style={{
                  backgroundColor: generatedVoucher.isTestMode ? "#fff3e0" : "#e8f5e9",
                  border: `2px solid ${generatedVoucher.isTestMode ? "#ff9800" : "#4caf50"}`,
                }}>
                  <CheckCircle size={48} className="mx-auto" style={{ color: generatedVoucher.isTestMode ? "#ff9800" : "#4caf50", marginBottom: "16px" }} />
                  <h3 className="font-bold mb-2" style={{ color: generatedVoucher.isTestMode ? "#e65100" : "#2e7d32" }}>
                    {generatedVoucher.isTestMode ? "TEST Voucher Generated" : "Voucher Generated Successfully"}
                  </h3>
                  <p className="text-sm text-[#3e2723] mb-4">
                    {getVoucherTypeName(generatedVoucher.type)} • {generatedVoucher.seats} seat{generatedVoucher.seats > 1 ? 's' : ''}
                  </p>

                  <div className="bg-white border-2 border-dashed border-[#a67c52] rounded-lg p-4 mb-4">
                    <div className="font-mono text-xl font-bold text-[#3e2723] mb-2">{generatedVoucher.code}</div>
                    <button onClick={handleCopyCode} className="flex items-center gap-1 mx-auto text-[#a67c52] font-semibold text-sm hover:underline cursor-pointer">
                      <Copy size={16} />{copied ? "Copied!" : "Copy Code"}
                    </button>
                  </div>

                  <p className={`text-xs font-semibold ${generatedVoucher.isTestMode ? "text-[#e65100]" : "text-gray-500"}`}>
                    Expires: {new Date(generatedVoucher.expiresAt).toLocaleString()}
                  </p>
                </div>

                <div className="bg-[#f0f7ff] border border-[#a67c52] rounded-lg p-4 mb-6">
                  <p className="text-sm text-[#3e2723] font-semibold m-0">Share instructions:</p>
                  <ul className="text-sm text-[#5d4037] pl-5 mt-2">
                    <li>Share the code above with the business.</li>
                    <li>They enter it under subscription options or their purchases view.</li>
                  </ul>
                </div>

                <button onClick={() => {
                  setShowVoucherModal(false)
                  setGeneratedVoucher(null)
                  setVoucherType("")
                  setExpirationDays(30)
                  setExpirationMinutes(null)
                  setIsTestMode(false)
                }}
                  className="w-full py-4 bg-[#5d4037] hover:bg-[#4a352f] text-white rounded-xl text-base font-bold transition-all duration-200 cursor-pointer">
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── BRIDGE POPUP ─── */}
      {showBridgePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" style={{ animation: "fadeIn 0.2s ease-out" }}>
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-[#e6d7c3] shadow-2xl mx-4 space-y-6 animate-slideUp" style={{ animation: "slideUp 0.3s ease-out" }}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-[#4a352f] m-0">Onboard New Ecosystem Partner</h3>
                <p className="text-xs text-[#7d5a50] mt-1">Select the type of partner to bring onboard.</p>
              </div>
              <button onClick={() => setShowBridgePopup(false)} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { type: "Business", title: "Business", desc: "Small, medium or micro enterprises seeking funding, advisory or support.", icon: Building },
                { type: "Funder", title: "Funder", desc: "Investment firms, VC funds, angel networks or debt providers.", icon: DollarSign },
                { type: "Catalyst", title: "Catalyst", desc: "Incubators, business development hubs or training programs.", icon: Trophy },
                { type: "CMF", title: "Capital & Market Facilitator", desc: "Capital and market facilitators directing growth transactions.", icon: Users },
              ].map(({ type, title, desc, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => {
                    setShowBridgePopup(false)
                    navigate(`/cmf-cohorts/new?type=${type}`)
                  }}
                  className="text-left p-4 rounded-2xl border-2 border-[#e6d7c3] hover:border-[#7d5a50] hover:bg-[#faf7f2] transition-all flex flex-col justify-between group cursor-pointer animate-fadeIn"
                >
                  <div className="w-10 h-10 flex items-center justify-center text-[#7d5a50] mb-3">
                    <Icon size={40} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#4a352f] m-0 group-hover:text-[#7d5a50]">{title}</h4>
                    <p className="text-[11px] text-[#7d5a50] mt-1 leading-relaxed">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── DRAFTS POPUP ─── */}
      {showDraftsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" style={{ animation: "fadeIn 0.2s ease-out" }}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#e6d7c3] shadow-2xl mx-4 space-y-4 animate-slideUp" style={{ animation: "slideUp 0.3s ease-out" }}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-[#4a352f] m-0">Saved Onboarding Drafts</h3>
                <p className="text-xs text-[#7d5a50] mt-1">Pick up where you left off with incomplete partner profiles.</p>
              </div>
              <button onClick={() => setShowDraftsPopup(false)} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
              {drafts.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No saved drafts found.
                </div>
              ) : (
                drafts.map((draft) => {
                  const title = draft.formData?.registeredName || draft.formData?.contactName || "Unnamed Draft"
                  return (
                    <div key={draft.id} className="flex items-center justify-between p-3.5 rounded-xl border border-[#e6d7c3]/80 hover:bg-[#faf7f2]/50 transition-all">
                      <button
                        onClick={() => {
                          setShowDraftsPopup(false)
                          navigate(`/cmf-cohorts/new?draftId=${draft.id}`)
                        }}
                        className="text-left flex-1 cursor-pointer"
                      >
                        <h4 className="text-xs font-bold text-[#4a352f] m-0">{title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[#7d5a50]">
                          <span className="bg-[#f5f0e1] px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase">{draft.profileType}</span>
                          <span>Updated: {new Date(draft.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (window.confirm("Are you sure you want to delete this draft?")) {
                            try {
                              await deleteDoc(doc(db, "cmfOnboardingDrafts", draft.id))
                              setDrafts(prev => prev.filter(d => d.id !== draft.id))
                            } catch (err) {
                              console.error("Error deleting draft:", err)
                            }
                          }
                        }}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete draft"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
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