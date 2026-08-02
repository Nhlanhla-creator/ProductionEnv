"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { 
  Trophy, Users, TrendingUp, Building, MapPin, DollarSign, Calendar, Eye, Wrench, 
  Loader, RefreshCw, X, BarChart3, Briefcase, Award, Package, ChevronDown, ChevronUp,
  AlertCircle, Info, Layers, GraduationCap, MoreVertical, FileText, Ticket, Copy,
  CheckCircle, SlidersHorizontal, LayoutGrid, Settings, RotateCcw, GripVertical,
  Square, CheckSquare, ArrowUpDown, Download, Archive, StickyNote, Plus, Trash2,
  FileCheck, Star, Clock, Activity
} from "lucide-react"

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
  if (typeof dateValue === "object" && typeof dateValue.toDate === "function") {
    date = dateValue.toDate()
  } else {
    date = new Date(dateValue)
  }

  if (isNaN(date.getTime())) return fallback

  return date.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// ─── Status vocabulary ──────────────────────────────────────────────────────
const STATUS_META = {
  "Active Advisory": { label: "Active Advisory", color: "#4caf50", group: "active" },
  "Completed Successfully": { label: "Completed", color: "#2196f3", group: "completed" },
  "Under Review": { label: "Under Review", color: "#ff9800", group: "active" },
}

const getStatusMeta = (status) => STATUS_META[status] || { label: status || "Active Advisory", color: "#7d5a50", group: "active" }

// ─── Performance rating helpers ────────────────────────────────────────────
const getRatingColor = (rating) => {
  if (!rating) return "#666"
  const score = Number.parseFloat(rating.split("/")[0])
  if (score >= 4.5) return "#4caf50"
  if (score >= 4.0) return "#8bc34a"
  if (score >= 3.5) return "#ff9800"
  return "#f44336"
}

const getRatingLabel = (rating) => {
  if (!rating) return "Pending"
  const score = Number.parseFloat(rating.split("/")[0])
  if (score >= 4.5) return "Excellent"
  if (score >= 4.0) return "Good"
  if (score >= 3.5) return "Satisfactory"
  return "Needs Improvement"
}

// ─── Stage pipeline ─────────────────────────────────────────────────────────
const ADVISOR_STAGE_CARDS = [
  { key: "active", label: "Active Engagements", icon: TrendingUp, note: true, noteText: "SMEs you're currently providing advisory services to." },
  { key: "completed", label: "Completed", icon: GraduationCap, note: true, noteText: "Advisory engagements that have been successfully completed." },
]

const AdvisorStagePipeline = ({ counts, activeFilter, setActiveFilter }) => {
  const total = counts.total || 1
  const toggle = (key) => setActiveFilter(activeFilter === key ? "all" : key)

  return (
    <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#4a352f]">Advisory Portfolio</h3>
          <span title="Your successful advisory engagements with SMEs">
            <Info size={12} className="text-[#a89482]" />
          </span>
        </div>
        <button
          onClick={() => toggle("all")}
          className="flex items-baseline gap-1.5 px-3 py-1 rounded-xl transition-all hover:bg-[#f5f0e1]"
          style={{ backgroundColor: activeFilter === "all" ? "#f5f0e1" : "transparent" }}
        >
          <span className="text-lg font-extrabold text-[#4a352f]">{counts.total}</span>
          <span className="text-[10px] text-[#7d5a50] font-semibold uppercase tracking-wide">Total Engagements</span>
        </button>
      </div>

      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        {ADVISOR_STAGE_CARDS.map(({ key, label, icon: Icon, note, noteText }) => {
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
const COLUMN_DEFS = {
  compensation: { label: "Compensation", minWidth: "112px", filterType: "compensation" },
  startDate: { label: "Start Date", minWidth: "96px", filterType: "startDate" },
  sector: { label: "Sector", minWidth: "100px", filterType: "sector" },
  location: { label: "Location", minWidth: "92px", filterType: "location" },
  teamSize: { label: "Team Size", minWidth: "80px", filterType: "teamSize" },
  status: { label: "Status", minWidth: "130px", filterType: "status" },
  rating: { label: "Performance", minWidth: "100px", filterType: "rating" },
  advisoryType: { label: "Advisory Type", minWidth: "120px", filterType: "advisoryType" },
}

const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS)
const DEFAULT_COLUMN_VISIBILITY = {
  compensation: true, startDate: true, status: true, rating: true,
  sector: true, location: false, teamSize: false, advisoryType: false,
}
const DEFAULT_DENSITY = "comfortable"

// ─── Custom Views ──────────────────────────────────────────────────────────
const BUILTIN_VIEW_ID = "__default__"
const VIEWS_STORAGE_KEY = "advisor-cohorts-views-v1"
const ACTIVE_FILTER_STORAGE_KEY = "advisor-cohorts-active-filter-v1"

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
  try { window.localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

const generateViewId = () => {
  try { return `view_${crypto.randomUUID()}` } catch { return `view_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }
}

const loadStoredActiveFilter = () => {
  if (typeof window === "undefined") return "all"
  try { return window.localStorage.getItem(ACTIVE_FILTER_STORAGE_KEY) || "all" } catch { return "all" }
}

// Cache key for localStorage
const ADVISOR_COHORTS_CACHE_KEY = 'advisorCohorts_cache'
const CACHE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

// ─── Modal overlay styles ──────────────────────────────────────────────────
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(62, 39, 35, 0.85)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  animation: "fadeIn 0.3s ease-out",
  backdropFilter: "blur(4px)",
}

const modalContentStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "20px",
  padding: "40px",
  maxWidth: "900px",
  width: "95%",
  maxHeight: "90vh",
  overflowY: "auto",
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
  const delays = ['animate-shimmer', 'animate-shimmer-d1', 'animate-shimmer-d2', 'animate-shimmer-d3']
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

function AdvisorCohorts() {
  const [cohorts, setCohorts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState(null)
  const [activeFilter, setActiveFilter] = useState(() => loadStoredActiveFilter())
  const [hoveredRowKey, setHoveredRowKey] = useState(null)
  const [rowMenu, setRowMenu] = useState(null)
  const [noteModal, setNoteModal] = useState(null) // { cohort, text }
  const [notesByCohort, setNotesByCohort] = useState({})
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [showArchived, setShowArchived] = useState(false)
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [statusModal, setStatusModal] = useState(null)
  
  // ─── Views (column visibility / order / density) ─────────────────────────
  const [viewsState, setViewsState] = useState(() => loadViewsState())
  const initialActiveView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]
  const [columnVisibility, setColumnVisibility] = useState(() => initialActiveView.columnVisibility)
  const [columnOrder, setColumnOrder] = useState(() => initialActiveView.columnOrder)
  const [density, setDensity] = useState(() => initialActiveView.density)

  const [showCustomizeMenu, setShowCustomizeMenu] = useState(false)
  const [customizeMenuRect, setCustomizeMenuRect] = useState(null)
  const [showNewViewForm, setShowNewViewForm] = useState(false)
  const [newViewName, setNewViewName] = useState("")
  const [newViewDescription, setNewViewDescription] = useState("")
  const [editingViewMeta, setEditingViewMeta] = useState(null)

  const [draggedColumn, setDraggedColumn] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [dragHintRect, setDragHintRect] = useState(null)

  const navigate = useNavigate()

  // ─── Auto-save views ──────────────────────────────────────────────────────
  useEffect(() => {
    setViewsState((prev) => {
      const current = prev.views[prev.activeViewId]
      if (!current) return prev
      const updated = { ...current, columnVisibility, columnOrder, density }
      const next = { ...prev, views: { ...prev.views, [prev.activeViewId]: updated } }
      persistViewsState(next)
      return next
    })
  }, [columnVisibility, columnOrder, density])

  useEffect(() => {
    if (typeof window === "undefined") return
    try { window.localStorage.setItem(ACTIVE_FILTER_STORAGE_KEY, activeFilter) } catch { /* ignore */ }
  }, [activeFilter])

  // ─── Load cohorts ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCohorts()
  }, [])

  const getCachedCohorts = () => {
    try {
      const cached = localStorage.getItem(ADVISOR_COHORTS_CACHE_KEY)
      if (!cached) return null
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_TIMEOUT) {
        return data
      } else {
        localStorage.removeItem(ADVISOR_COHORTS_CACHE_KEY)
        return null
      }
    } catch (error) {
      console.error("Error reading cache:", error)
      return null
    }
  }

  const setCachedCohorts = (data) => {
    try {
      const cacheData = { data, timestamp: Date.now() }
      localStorage.setItem(ADVISOR_COHORTS_CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error("Error setting cache:", error)
    }
  }

  const fetchCohorts = async (forceRefresh = false) => {
    try {
      setLoading(true)
      
      if (!forceRefresh) {
        const cachedCohorts = getCachedCohorts()
        if (cachedCohorts) {
          setCohorts(cachedCohorts)
          setLoading(false)
          return
        }
      }

      const currentUser = auth.currentUser
      if (!currentUser) {
        setLoading(false)
        return
      }

      const q = query(
        collection(db, "AdvisorApplications"),
        where("advisorId", "==", currentUser.uid),
        where("status", "==", "Deal Successful")
      )

      const querySnapshot = await getDocs(q)

      const cohortsData = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data()
          try {
            let profileData = {}
            if (data.smeId) {
              const profileRef = doc(db, "universalProfiles", data.smeId)
              const profileSnap = await getDoc(profileRef)
              if (profileSnap.exists()) {
                profileData = profileSnap.data()
              }
            }

            const smeName = data.smeName || data.companyName || "Unnamed Business"

            return {
              id: docSnap.id,
              docId: docSnap.id,
              smeId: data.smeId || data.userId,
              smeName: smeName,
              dealAmount: data.advisorCompensationModel || "Not specified",
              dealType: data.smeSupport || "Advisory",
              completionDate: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              sector: formatLabel(data.smeSector) || "Not specified",
              location: formatLabel(data.smeLocation) || "Not specified",
              teamSize: data.teamSize || "Not specified",
              description: data.serviceDelivered || "Advisory services provided",
              currentStatus: "Active Advisory",
              profileData: profileData,
              lastUpdated: new Date().toISOString(),
              dealStructure: data.dealStructure || "Advisory contract",
              dealDuration: data.dealDuration || "Ongoing",
              supportProvided: data.serviceDelivered || "Strategic advisory services",
              compensationModel: data.advisorCompensationModel || "Not specified",
              contractValue: data.contractValue || "Not specified",
              nextRenewal: data.nextRenewal || "To be determined",
              advisoryType: data.advisoryType || "Strategic Advisor",
              performanceRating: data.performanceRating || "4.5/5",
              smeStage: data.smeStage || "Not specified",
              revenueBand: data.revenue || "Not specified",
              fundingDetails: data.fundingDetails || {},
              archived: data.archived || false,
              statusHistory: data.statusHistory || [],
            }
          } catch (error) {
            console.error("Error fetching profile:", error)
            return null
          }
        })
      )

      const validCohorts = cohortsData.filter(cohort => cohort !== null)
      setCohorts(validCohorts)
      setCachedCohorts(validCohorts)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching advisor cohorts:", error)
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchCohorts(true)
    setRefreshing(false)
  }

  // ─── Notes functionality ──────────────────────────────────────────────────
  const fetchNotesForCohort = async (cohort) => {
    try {
      const snapshot = await getDocs(query(collection(db, "advisorNotes"), where("cohortId", "==", cohort.id)))
      const notes = snapshot.docs
        .map((d) => d.data())
        .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))
      setNotesByCohort((prev) => ({ ...prev, [cohort.id]: notes }))
    } catch (error) {
      console.error("Error fetching notes:", error)
    }
  }

  const toggleExpandRow = (cohort) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(cohort.id)) {
        next.delete(cohort.id)
      } else {
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
      await addDoc(collection(db, "advisorNotes"), {
        advisorId: user.uid,
        smeId: noteModal.cohort.smeId,
        cohortId: noteModal.cohort.id,
        note: noteModal.text.trim(),
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
        authorName: user.displayName || user.email || "Advisor",
      })
      await fetchNotesForCohort(noteModal.cohort)
      setExpandedRows((prev) => new Set(prev).add(noteModal.cohort.id))
      setNoteModal(null)
    } catch (error) {
      console.error("Error saving note:", error)
      alert("Failed to save note. Please try again.")
    }
  }

  // ─── Archive functionality ────────────────────────────────────────────────
  const handleArchive = async (cohort) => {
    setBulkConfirm({
      message: `Archive ${cohort.smeName}? It will be hidden from the default view but can still be found via "Show archived".`,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "AdvisorApplications", cohort.docId), { archived: true })
          await fetchCohorts()
        } catch (error) {
          console.error("Error archiving record:", error)
          alert("Failed to archive. Please try again.")
        }
      },
    })
    setRowMenu(null)
  }

  // ─── Status change functionality ──────────────────────────────────────────
  const openStatusModal = (cohortOrCohorts) => {
    const list = Array.isArray(cohortOrCohorts) ? cohortOrCohorts : [cohortOrCohorts]
    setStatusModal({ cohorts: list, targetGroup: "", reason: "", note: "" })
    setRowMenu(null)
  }

  const submitStatusChange = async () => {
    if (!statusModal?.targetGroup) return

    const newStatus = statusModal.targetGroup === "completed" ? "Completed Successfully" : "Active Advisory"
    const run = async () => {
      try {
        for (const cohort of statusModal.cohorts) {
          const prevMeta = getStatusMeta(cohort.currentStatus)
          const historyEntry = {
            previousStatus: prevMeta.label,
            newStatus: statusModal.targetGroup === "completed" ? "Completed" : "Active Advisory",
            changedAt: new Date().toISOString(),
            reason: statusModal.reason || null,
            note: statusModal.note || null,
          }
          await updateDoc(doc(db, "AdvisorApplications", cohort.docId), {
            status: newStatus,
            statusHistory: arrayUnion(historyEntry),
          })
        }
        await fetchCohorts()
        setStatusModal(null)
        setSelectedRows(new Set())
      } catch (error) {
        console.error("Error changing status:", error)
        alert("Failed to update status. Please try again.")
      }
    }

    if (statusModal.targetGroup === "completed") {
      setBulkConfirm({
        message: statusModal.cohorts.length > 1
          ? `Mark ${statusModal.cohorts.length} engagements as Completed?`
          : `Mark ${statusModal.cohorts[0].smeName} as Completed?`,
        onConfirm: run,
      })
    } else {
      run()
    }
  }

  // ─── Bulk selection + export ─────────────────────────────────────────────
  const toggleRowSelected = (id) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = (rows) => {
    setSelectedRows((prev) => {
      const allSelected = rows.every((r) => prev.has(r.id))
      if (allSelected) return new Set()
      return new Set(rows.map((r) => r.id))
    })
  }

  const handleExportSelected = (rows) => {
    try {
      const selected = rows.filter((r) => selectedRows.has(r.id))
      const headers = ["Business Name", "Compensation", "Start Date", "Status", "Sector", "Location", "Advisory Type", "Performance Rating"]
      const dataRows = selected.map((c) => [
        c.smeName, formatCurrency(c.dealAmount), formatDate(c.completionDate),
        getStatusMeta(c.currentStatus).label, c.sector, c.location, c.advisoryType, c.performanceRating,
      ].map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(","))
      const csv = [headers.join(","), ...dataRows].join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url; link.download = `advisor-engagements-${new Date().toISOString().split("T")[0]}.csv`; link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  // ─── Views helpers ──────────────────────────────────────────────────────
  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]

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
    setDensity(target.density)
  }

  const createNewView = () => {
    const trimmedName = newViewName.trim()
    if (!trimmedName) return
    const id = generateViewId()
    const newView = { id, name: trimmedName, description: newViewDescription.trim(), builtin: false, columnVisibility: { ...columnVisibility }, columnOrder: [...columnOrder], density }
    setViewsState((prev) => {
      const next = { activeViewId: id, views: { ...prev.views, [id]: newView } }
      persistViewsState(next)
      return next
    })
    setNewViewName("")
    setNewViewDescription("")
    setShowNewViewForm(false)
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
      const nextActiveId = prev.activeViewId === viewId ? BUILTIN_VIEW_ID : prev.activeViewId
      const next = { activeViewId: nextActiveId, views: restViews }
      persistViewsState(next)
      return next
    })
    if (wasActive) {
      const def = viewsState.views[BUILTIN_VIEW_ID]
      setColumnVisibility(def.columnVisibility)
      setColumnOrder(def.columnOrder)
      setDensity(def.density)
    }
  }

  const resetActiveViewToDefault = () => {
    const layout = createDefaultViewLayout()
    setColumnVisibility(layout.columnVisibility)
    setColumnOrder(layout.columnOrder)
    setDensity(layout.density)
  }

  const toggleColumn = (key) => setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }))

  // ─── Column drag-to-reorder ──────────────────────────────────────────────
  const handleColumnDragStart = (e, key) => {
    setDraggedColumn(key)
    setDragHintRect(null)
    try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", key) } catch { /* ignore */ }
  }
  const handleColumnDragOver = (e, key) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (key !== dragOverColumn) setDragOverColumn(key)
  }
  const handleColumnDrop = (e, key) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === key) { setDraggedColumn(null); setDragOverColumn(null); return }
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
  const handleColumnDragEnd = () => { setDraggedColumn(null); setDragOverColumn(null) }

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
    sessionStorage.setItem('advisorViewMode', 'true')
    sessionStorage.setItem('viewOrigin', 'advisor')
    window.location.href = '/overall-company-health'
  }

  const handleViewDetails = (cohort) => {
    setSelectedCohort(cohort)
    setRowMenu(null)
  }

  // ─── Get primary action ──────────────────────────────────────────────────
  const getPrimaryAction = (cohort) => {
    const meta = getStatusMeta(cohort.currentStatus)
    if (meta.group === "completed") return { label: "View Record", handler: handleViewGrowthSuite }
    return { label: "Deep Dive", handler: handleViewGrowthSuite }
  }

  // ─── Derived: counters ──────────────────────────────────────────────────
  const visibleCohorts = useMemo(() => cohorts.filter((c) => showArchived || !c.archived), [cohorts, showArchived])

  const counts = {
    total: visibleCohorts.length,
    active: visibleCohorts.filter((c) => getStatusMeta(c.currentStatus).group === "active").length,
    completed: visibleCohorts.filter((c) => getStatusMeta(c.currentStatus).group === "completed").length,
  }

  const filteredCohorts = useMemo(() => {
    let result = visibleCohorts
    if (activeFilter === "active") {
      result = result.filter((c) => getStatusMeta(c.currentStatus).group === "active")
    } else if (activeFilter === "completed") {
      result = result.filter((c) => getStatusMeta(c.currentStatus).group === "completed")
    }
    return result
  }, [visibleCohorts, activeFilter])

  const rowPad = density === "compact" ? "py-2.5 px-3" : "py-3.5 px-4"

  // ─── Data-driven cell renderer ───────────────────────────────────────────
  const renderCell = (key, cohort) => {
    switch (key) {
      case "compensation":
        return (
          <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`} style={{ minWidth: '130px' }}>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-[#4a352f]">{formatCurrency(cohort.dealAmount)}</span>
              {cohort.contractValue !== "Not specified" && (
                <span className="text-xs text-[#7d5a50]">Contract: {formatCurrency(cohort.contractValue)}</span>
              )}
            </div>
          </td>
        )
      case "startDate":
        return <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`} style={{ minWidth: '120px' }}><span className="text-[#5d4037]">{formatDate(cohort.completionDate)}</span></td>
      case "sector":
        return <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`}><span className="text-[#5d4037]">{cohort.sector}</span></td>
      case "location":
        return <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`}><span className="text-[#5d4037]">{cohort.location}</span></td>
      case "teamSize":
        return <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`}><span className="text-[#5d4037]">{cohort.teamSize}</span></td>
      case "status": {
        const meta = getStatusMeta(cohort.currentStatus)
        return (
          <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`} style={{ minWidth: '130px' }}>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap" style={{ backgroundColor: meta.color + "20", color: meta.color }}>
              {meta.label}
            </span>
          </td>
        )
      }
      case "rating":
        return (
          <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`} style={{ minWidth: '100px' }}>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold" style={{ color: getRatingColor(cohort.performanceRating) }}>
                {cohort.performanceRating}
              </span>
              <span className="text-xs text-[#7d5a50]">{getRatingLabel(cohort.performanceRating)}</span>
            </div>
          </td>
        )
      case "advisoryType":
        return <td key={key} className={`${rowPad} border-r border-[#e6d7c3]`}><span className="text-[#5d4037] text-sm">{cohort.advisoryType}</span></td>
      default:
        return null
    }
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
            <h1 className="text-[28px] font-bold text-[#4a352f] mb-1">My Advisory Cohorts</h1>
            <p className="text-[#7d5a50] text-base m-0">
              View and manage your portfolio of successful SME advisory engagements
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

        <AdvisorStagePipeline counts={counts} activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

        {/* Toolbar */}
        <div className="bg-[#faf7f2] rounded-t-2xl p-4 border border-[#e6d7c3] border-b-0 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
                <LayoutGrid size={12} className="text-[#7d5a50] flex-shrink-0" />
                Viewing: {activeView.name}
                {activeView.description && <span className="font-normal text-[#a89482]"> — {activeView.description}</span>}
              </span>
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
                  const panelWidth = 320
                  const margin = 12
                  let left = customizeMenuRect.right - panelWidth
                  left = Math.min(Math.max(left, margin), window.innerWidth - panelWidth - margin)
                  const spaceBelow = window.innerHeight - customizeMenuRect.bottom - margin - 8
                  const spaceAbove = customizeMenuRect.top - margin - 8
                  const openUpward = spaceBelow < 320 && spaceAbove > spaceBelow
                  const maxHeight = Math.max(200, Math.min(620, openUpward ? spaceAbove : spaceBelow))
                  const top = openUpward ? undefined : customizeMenuRect.bottom + 8
                  const bottom = openUpward ? window.innerHeight - customizeMenuRect.top + 8 : undefined
                  const allViews = Object.values(viewsState.views).sort((a, b) => (a.builtin ? -1 : b.builtin ? 1 : a.name.localeCompare(b.name)))
                  return (
                    <div className="fixed inset-0 z-40" onClick={() => { setShowCustomizeMenu(false); setCustomizeMenuRect(null); setShowNewViewForm(false); setEditingViewMeta(null) }}>
                      <div className="fixed bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-5 z-50 overflow-y-auto" style={{ left, width: panelWidth, top, bottom, maxHeight }} onClick={(e) => e.stopPropagation()}>
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
                          <GripVertical size={12} className="flex-shrink-0" /> Tip: drag any column header in the table to reorder it.
                        </p>
                        <label className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                          <input type="checkbox" checked={true} disabled={true} className="rounded border-[#c8b6a6]" />
                          <span className="text-sm text-[#4a352f]">Business</span>
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
                    </div>
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
              <h2 className="text-lg font-semibold text-[#4a352f] m-0">Advisory Portfolio</h2>
              <span className="text-xs text-[#7d5a50] bg-[#a67c52]/15 px-3 py-1.5 rounded-md font-semibold">
                {filteredCohorts.length} {filteredCohorts.length === 1 ? 'engagement' : 'engagements'}
              </span>
            </div>

            <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
              <style>{`
                .mc-th { color: #faf7f2 !important; vertical-align: top !important; }
                .mc-th-draggable { cursor: grab; }
                .mc-th-draggable:active { cursor: grabbing; }
                .mc-th-label { flex: 1 1 auto; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; overflow-wrap: break-word; line-height: 1.2; }
              `}</style>
              <table className="border-collapse text-sm" style={{ tableLayout: 'auto' }}>
                <thead>
                  <tr className="bg-[#4a352f]">
                    <th className={`mc-th ${rowPad} sticky top-0 left-0 z-30 border-r border-[#e6d7c3]`} style={{ backgroundColor: '#4a352f', width: '40px' }}>
                      <button onClick={() => toggleSelectAll(filteredCohorts)} className="flex items-center justify-center">
                        {allVisibleSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </th>
                    <th className={`mc-th ${rowPad} text-left font-semibold text-xs uppercase tracking-wide border-r border-[#e6d7c3] sticky top-0 left-0 z-30`} style={{ backgroundColor: '#4a352f', minWidth: '200px', maxWidth: '240px' }}>
                      <div className="flex items-start gap-1 min-w-0">
                        <span className="mc-th-label">Business</span>
                      </div>
                    </th>

                    {visibleColumnKeys.map((key) => {
                      const col = COLUMN_DEFS[key]
                      const isDragging = draggedColumn === key
                      const isDragOver = dragOverColumn === key && draggedColumn !== key
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
                          className={`mc-th mc-th-draggable ${rowPad} text-left font-semibold text-xs uppercase tracking-wide border-r border-[#e6d7c3] sticky top-0 z-20 select-none transition-opacity ${isDragging ? 'opacity-40' : ''}`}
                          style={{ minWidth: col.minWidth, backgroundColor: isDragOver ? '#5a423b' : '#4a352f' }}
                        >
                          <div className="flex items-start gap-1 min-w-0">
                            <GripVertical size={11} className="opacity-40 flex-shrink-0 mt-0.5" />
                            <span className="mc-th-label">{col.label}</span>
                          </div>
                        </th>
                      )
                    })}
                    <th className={`mc-th ${rowPad} text-center font-semibold text-xs uppercase tracking-wide whitespace-nowrap border-r border-[#e6d7c3] sticky top-0 z-20`} style={{ backgroundColor: '#4a352f' }}>
                      Action
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
                            style={{ minWidth: '200px', maxWidth: '240px', backgroundColor: hoveredRowKey === cohort.id ? '#faf7f2' : '#ffffff' }}
                          >
                            <div className="flex items-start gap-1.5">
                              <button onClick={() => toggleExpandRow(cohort)} className="mt-0.5 text-[#a89482] hover:text-[#4a352f] flex-shrink-0">
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-[#4a352f]">
                                    {cohort.smeName}
                                  </span>
                                  <button
                                    onClick={() => handleViewDetails(cohort)}
                                    className="text-[#a89482] hover:text-[#7d5a50] transition-colors flex-shrink-0"
                                    aria-label={`View summary for ${cohort.smeName}`}
                                    title="View summary"
                                  >
                                    <Eye size={13} />
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-[#7d5a50]">
                                  <span className="flex items-center gap-1">
                                    <Briefcase size={11} className="text-[#a67c52]" />
                                    {cohort.advisoryType || "Strategic Advisor"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Star size={11} className="text-[#a67c52]" />
                                    {cohort.performanceRating}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {visibleColumnKeys.map((key) => renderCell(key, cohort))}

                          <td className={`${rowPad} text-center`} style={{ minWidth: '170px' }}>
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

                        {/* Expandable row */}
                        {isExpanded && (
                          <tr className="bg-[#faf7f2] border-b border-[#f0e6d9]">
                            <td></td>
                            <td colSpan={visibleColumnKeys.length + 2} className="px-4 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-semibold text-[#4a352f] mb-1 uppercase tracking-wide">Description</p>
                                  <p className="text-sm text-[#5d4037]">{cohort.description}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-[#4a352f] mb-1 uppercase tracking-wide">Compensation Model</p>
                                  <p className="text-sm text-[#5d4037]">{cohort.dealAmount}</p>
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
                                          <p className="text-[10px] text-[#a89482] mt-1">{n.authorName || "Advisor"} · {n.createdAtMs ? formatDate(n.createdAtMs) : "Just now"}</p>
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
              {visibleCohorts.length === 0 ? "No Advisory Engagements Yet" : "No results after filtering"}
            </h3>
            <p className="text-[#7d5a50] text-base max-w-[500px] mx-auto">
              {visibleCohorts.length === 0
                ? "Your successful advisory engagements will appear here once you complete matches with SMEs."
                : "No engagements match the selected filter."}
            </p>
          </div>
        )}
      </div>

      {/* ─── Drag-to-reorder hint tooltip ──────────────────────────────────── */}
      {dragHintRect && !draggedColumn && (
        <div className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal flex items-center gap-1.5" style={{ top: dragHintRect.bottom + 8, left: Math.min(Math.max(dragHintRect.left, 12), window.innerWidth - 200), width: '190px' }}>
          <GripVertical size={12} className="flex-shrink-0" /> Drag to reorder columns
        </div>
      )}

      {/* ─── Row secondary-action menu ────────────────────────────────────── */}
      {rowMenu && (
        <div className="fixed inset-0 z-[1090]" onClick={() => { setRowMenu(null) }} />
      )}
      {rowMenu && (
        <div
          className="fixed z-[1100] bg-white rounded-xl shadow-2xl border border-[#e6d7c3] py-1 overflow-visible"
          style={{ top: rowMenu.position.y, left: rowMenu.position.x, width: '220px' }}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#e6d7c3]">
            <span className="text-xs font-semibold text-[#4a352f]">Quick Actions</span>
            <button onClick={() => setRowMenu(null)} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={14} /></button>
          </div>
          <button
            onClick={() => { handleViewGrowthSuite(rowMenu.cohort); setRowMenu(null) }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
          >
            <TrendingUp size={12} /> Deep Dive
          </button>
          <button
            onClick={() => { setNoteModal({ cohort: rowMenu.cohort, text: "" }); setRowMenu(null) }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
          >
            <StickyNote size={12} /> Add Note
          </button>
          <button
            onClick={() => openStatusModal(rowMenu.cohort)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
          >
            <ArrowUpDown size={12} /> Change Status
          </button>
          <button
            onClick={() => handleViewDetails(rowMenu.cohort)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
          >
            <Eye size={12} /> View Details
          </button>
          <div className="border-t border-[#e6d7c3] my-1" />
          <button
            onClick={() => handleArchive(rowMenu.cohort)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 text-left"
          >
            <Archive size={12} /> Archive Record
          </button>
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
            <textarea
              value={noteModal.text}
              onChange={(e) => setNoteModal((prev) => ({ ...prev, text: e.target.value }))}
              placeholder="What happened, or what needs follow-up?"
              rows={4}
              className="w-full px-3 py-2 border-2 border-[#c8b6a6] rounded-lg text-sm resize-y"
            />
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
                Change Status {statusModal.cohorts.length > 1 ? `(${statusModal.cohorts.length} engagements)` : `— ${statusModal.cohorts[0].smeName}`}
              </h3>
              <button onClick={() => setStatusModal(null)}><X size={18} /></button>
            </div>
            <label className="block text-xs font-semibold text-[#5d4037] mb-2">New status</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setStatusModal((prev) => ({ ...prev, targetGroup: "active" }))}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 ${statusModal.targetGroup === "active" ? "border-[#4caf50] bg-[#e8f5e9] text-[#2e7d32]" : "border-[#e6d7c3] text-[#4a352f]"}`}
              >
                Active Advisory
              </button>
              <button
                onClick={() => setStatusModal((prev) => ({ ...prev, targetGroup: "completed" }))}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 ${statusModal.targetGroup === "completed" ? "border-[#2196f3] bg-[#e3f2fd] text-[#0d47a1]" : "border-[#e6d7c3] text-[#4a352f]"}`}
              >
                Completed
              </button>
            </div>
            {statusModal.targetGroup === "completed" && (
              <textarea
                value={statusModal.note}
                onChange={(e) => setStatusModal((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Completion note (optional)"
                rows={3}
                className="w-full px-3 py-2 border-2 border-[#c8b6a6] rounded-lg text-sm resize-y mb-2"
              />
            )}
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setStatusModal(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button
                onClick={submitStatusChange}
                disabled={!statusModal.targetGroup}
                className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-sm font-semibold disabled:opacity-40"
              >
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
              <button
                onClick={async () => { await bulkConfirm.onConfirm(); setBulkConfirm(null) }}
                className="px-4 py-2 bg-[#e65100] text-white rounded-lg text-sm font-semibold"
              >
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
                <Briefcase size={32} className="text-[#ffd700]" />
                Advisory Details: {selectedCohort.smeName}
              </h2>
              <button onClick={() => setSelectedCohort(null)} className="bg-none border-none text-2xl cursor-pointer text-gray-600 p-2">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mb-8">
              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200">
                <h3 className="text-[#3e2723] mb-4 flex items-center gap-2">
                  <DollarSign size={20} /> Compensation Details
                </h3>
                <div className="grid gap-3">
                  <div><strong>Compensation Model:</strong> {selectedCohort.dealAmount}</div>
                  <div><strong>Contract Value:</strong> {formatCurrency(selectedCohort.contractValue)}</div>
                  <div><strong>Revenue Band:</strong> {selectedCohort.revenueBand}</div>
                  <div><strong>Advisory Type:</strong> {selectedCohort.advisoryType}</div>
                </div>
              </div>

              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200">
                <h3 className="text-[#3e2723] mb-4 flex items-center gap-2">
                  <Calendar size={20} /> Timeline & Performance
                </h3>
                <div className="grid gap-3">
                  <div><strong>Start Date:</strong> {formatDate(selectedCohort.completionDate)}</div>
                  <div><strong>Advisory Duration:</strong> {selectedCohort.dealDuration}</div>
                  <div><strong>Next Review:</strong> {selectedCohort.nextRenewal}</div>
                  <div>
                    <strong>Performance Rating:</strong>
                    <span className="ml-2 font-bold" style={{ color: getRatingColor(selectedCohort.performanceRating) }}>
                      {selectedCohort.performanceRating}
                    </span>
                    <span className="ml-2 text-sm text-[#7d5a50]">({getRatingLabel(selectedCohort.performanceRating)})</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200">
                <h3 className="text-[#3e2723] mb-4 flex items-center gap-2">
                  <Building size={20} /> SME Details
                </h3>
                <div className="grid gap-3">
                  <div><strong>Sector:</strong> {selectedCohort.sector}</div>
                  <div><strong>Stage:</strong> {selectedCohort.smeStage}</div>
                  <div><strong>Location:</strong> {selectedCohort.location}</div>
                  <div><strong>Team Size:</strong> {selectedCohort.teamSize}</div>
                </div>
              </div>
            </div>

            <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200 mb-6">
              <h3 className="text-[#3e2723] mb-4 flex items-center gap-2">
                <Package size={20} /> Advisory Services Delivered
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
                      {h.reason && <div className="text-xs text-gray-600 mt-1">Reason: {h.reason}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-[#e8f5e9] p-6 rounded-xl border border-[#4caf50] mb-6">
              <h3 className="text-[#2e7d32] mb-4 flex items-center gap-2">
                <BarChart3 size={20} /> Engagement Summary
              </h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: getRatingColor(selectedCohort.performanceRating) }}>
                    {selectedCohort.performanceRating}
                  </div>
                  <div className="text-sm text-gray-600">Performance Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{formatCurrency(selectedCohort.contractValue)}</div>
                  <div className="text-sm text-gray-600">Contract Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{getStatusMeta(selectedCohort.currentStatus).label}</div>
                  <div className="text-sm text-gray-600">Current Status</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleViewGrowthSuite(selectedCohort)}
                className="bg-[#a67c52] text-white border-none rounded-xl px-6 py-3 text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-[#8d6e63]"
              >
                <span className="flex items-center gap-2">
                  <Wrench size={18} /> Deep Dive
                </span>
              </button>
              <button
                onClick={() => setSelectedCohort(null)}
                className="bg-[#5d4037] text-white border-none rounded-xl px-8 py-3 text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-[#4a352f]"
              >
                Close
              </button>
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

export default AdvisorCohorts