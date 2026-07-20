"use client"
import React, { useState, useEffect, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import {
  Trophy, Users, TrendingUp, Building, MapPin, DollarSign, Calendar, Eye, Wrench,
  Loader, RefreshCw, X, BarChart3, ChevronDown, ChevronUp, FileText, Ticket, Copy,
  CheckCircle, MoreVertical, AlertCircle, Info, GraduationCap, Layers,
  SlidersHorizontal, Bookmark, Trash2, StickyNote, Archive,
  ArrowUpDown, Download, Square, CheckSquare, Plus
} from "lucide-react"
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"

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

// Spec §5.5 / §21: missing allocation should read "No allocation", not a
// silent "Not specified" or a bare hyphen.
const formatCurrency = (amount) => {
  if (!amount || amount === "Not specified") return "No allocation"
  if (typeof amount === "string") return amount
  return `R ${amount.toLocaleString()}`
}

// FIX: "Invalid Date" must never reach the user. new Date(garbage) silently
// produces a Date object whose getTime() is NaN — the old code passed that
// straight to toLocaleDateString(), which renders the literal string
// "Invalid Date". We now validate before formatting and fall back to a
// clear, human message instead.
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
// TODO(backend): the current schema only distinguishes "Active Support",
// "Active" and "Exit". Spec §5.7 wants a much fuller lifecycle (Onboarding,
// At Risk, Review Required, Graduation Pending, Graduated, Withdrawn,
// Removed, etc.) — those states need to actually exist on the record before
// we can display or transition between them truthfully. This mapping
// normalizes what exists today into cleaner labels without inventing states
// the data can't support yet.
const STATUS_META = {
  "Active Support": { label: "Active", color: "#4caf50", group: "active" },
  "Active": { label: "Active", color: "#4caf50", group: "active" },
  "Exit": { label: "Graduated / Exited", color: "#9e9e9e", group: "exited" },
  "Exit Support": { label: "Graduated / Exited", color: "#9e9e9e", group: "exited" },
}

const getStatusMeta = (status) => STATUS_META[status] || { label: status || "Unknown", color: "#7d5a50", group: "active" }

// Spec §17: exiting an SME must require a reason and log an audit entry.
// This is real, storable data (written to Firestore below) even though the
// richer status lifecycle it's attached to isn't fully modeled yet.
const EXIT_REASONS = [
  "Voluntary withdrawal",
  "Programme requirements not met",
  "Business closed",
  "Unable to contact",
  "Strategic mismatch",
  "Funding no longer required",
  "Moved to another programme",
  "Other",
]

// ─── Cohort stage pipeline (feedback #14, consolidated) ────────────────────
// Previously three separate, overlapping UIs all did roughly the same job:
// the "Post-Admission Journey" strip, the 5 summary tiles, and the "Active
// Cohort / Attention Required / Completed & Exited" preset pills. Graduated,
// Exited, and "Completed & Exited" were the exact same count rendered three
// times; "Attention Required" appeared twice. This single widget replaces
// all three: pipeline-styled cards (matching the DealFlow Pipeline's visual
// language) that double as the quick filters the tiles/pills used to be.
// Active and Attention Required stay mutually exclusive counts (each SME
// counted once) so the row reads as a real breakdown, not overlapping sets.
const COHORT_STAGE_CARDS = [
  { key: "active", label: "Active", icon: TrendingUp },
  { key: "attention", label: "Attention Required", icon: AlertCircle },
  { key: "exited", label: "Graduated / Exited", icon: GraduationCap, note: true },
]

const CohortStagePipeline = ({ counts, activeFilter, setActiveFilter }) => {
  const total = counts.total || 1
  const toggle = (key) => setActiveFilter(activeFilter === key ? "inProgramme" : key)

  return (
    <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#4a352f]">Post-Admission Journey</h3>
          <span title="Businesses arrive here once admitted from Deal Flow. Declined/Withdrawn applications never reach this stage.">
            <Info size={12} className="text-[#a89482]" />
          </span>
        </div>
        {/* Total SMEs — the old "Total SMEs" tile, now the hero stat rather
            than a fifth card competing for attention with the others. */}
        <button
          onClick={() => toggle("all")}
          className="flex items-baseline gap-1.5 px-3 py-1 rounded-xl transition-all hover:bg-[#f5f0e1]"
          style={{ backgroundColor: activeFilter === "all" ? "#f5f0e1" : "transparent" }}
        >
          <span className="text-lg font-extrabold text-[#4a352f]">{counts.total}</span>
          <span className="text-[10px] text-[#7d5a50] font-semibold uppercase tracking-wide">Total SMEs</span>
        </button>
      </div>

      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        {/* Onboarding — pending, informational only; no backend status field
            exists yet to make this clickable/filterable. */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border border-dashed flex-shrink-0 opacity-60"
          style={{
            width: "128px",
            borderColor: "rgba(255,255,255,0.25)",
            background: "linear-gradient(135deg, #4a352f 0%, #241a14 100%)",
          }}
          title="Awaiting a backend Onboarding status field"
        >
          <Layers size={14} className="text-white flex-shrink-0" />
          <div>
            <div className="text-[11px] font-semibold text-white uppercase tracking-wide">Onboarding</div>
            <div className="text-[10px] text-[#d9c4b0]">Pending data</div>
          </div>
        </div>

        {COHORT_STAGE_CARDS.map(({ key, label, icon: Icon, note }) => {
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
                width: "150px",
                background: "linear-gradient(135deg, #4a352f 0%, #241a14 100%)",
                border: `2px solid ${isSelected ? "#d9b98a" : "rgba(255,255,255,0.12)"}`,
              }}
              title={note ? "Graduated vs. Exited aren't yet distinguished on the record — both show the same count until a backend outcome field exists." : undefined}
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

// ─── "Attention Required" heuristic ─────────────────────────────────────────
// TODO(backend): a real implementation needs reporting-overdue flags,
// last-activity timestamps, and milestone due dates on the record (spec §13
// lists the full set: reporting overdue, no activity in 30 days, BIG Score
// declining, milestone overdue, unused support allocation, Growth Suite
// incomplete, etc.). Until those fields exist, we flag records with
// missing/invalid core data as a conservative, honest stand-in — this is a
// data-quality signal, not a programme-health signal, and is labeled as such
// in the UI.
const needsAttention = (cohort) => {
  const hasValidStartDate = (() => {
    if (!cohort.completionDate) return false
    const d = typeof cohort.completionDate === "object" && cohort.completionDate.toDate
      ? cohort.completionDate.toDate()
      : new Date(cohort.completionDate)
    return !isNaN(d.getTime())
  })()
  const hasFundingInfo = cohort.dealAmount && cohort.dealAmount !== "Not specified"
  return !hasValidStartDate || !hasFundingInfo
}

// Spec §20: attention-required first, then active, then graduated/exited
// last — exited SMEs shouldn't dominate the default operational view.
// No milestone-due-date field exists yet to sort within groups by, so ties
// break alphabetically by name instead of fabricating urgency.
const cohortSortRank = (cohort) => {
  const meta = getStatusMeta(cohort.currentStatus)
  if (meta.group === "active" && needsAttention(cohort)) return 0
  if (meta.group === "active") return 1
  return 2
}

const Portal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

// ─── Voucher info hover tooltip ──────────────────────────────────────────────
const VoucherInfoTooltip = ({ anchorRect }) => {
  if (!anchorRect) return null
  const width = 340
  let x = anchorRect.left + anchorRect.width / 2 - width / 2
  let y = anchorRect.bottom + 8
  if (x + width > window.innerWidth - 16) x = window.innerWidth - width - 16
  if (x < 16) x = 16
  if (y + 260 > window.innerHeight - 16) y = anchorRect.top - 260 - 8

  return (
    <Portal>
      <div
        className="fixed z-[1200] bg-[#f0f7ff] border border-[#a67c52] rounded-lg shadow-2xl p-4 pointer-events-none"
        style={{ top: y, left: x, width }}
      >
        <p className="m-0 mb-2 text-[#3e2723] text-sm font-semibold">
          Support your business's success with vouchers
        </p>
        <p className="m-0 text-[#5d4037] text-xs leading-relaxed">
          Generate codes for:
        </p>
        <ul className="mt-1.5 mb-0 pl-4 text-[#5d4037] text-xs space-y-0.5">
          <li><strong>Premium Subscription</strong> — unlock all premium features</li>
          <li><strong>Legitimacy Boost</strong> — improve business credibility</li>
          <li><strong>Capital Appeal Boost</strong> — attract more investors</li>
          <li><strong>Governance Boost</strong> — strengthen business structure</li>
          <li><strong>Compliance Boost</strong> — ensure regulatory compliance</li>
        </ul>
        <p className="mt-2 mb-0 text-[#a67c52] text-[11px] italic">
          You can set an expiration date — after that date/time, the voucher will no longer be valid.
        </p>
      </div>
    </Portal>
  )
}

// Skeleton Components
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
        <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
      </div>
      <div className="bg-white rounded-2xl shadow-md overflow-hidden w-full border border-[#e6d7c3]">
        <div className="p-4 border-b-2 border-[#e6d7c3] bg-[#f5f0e1] flex justify-between items-center">
          <div className="w-40 h-5 bg-shimmer-dark bg-shimmer animate-shimmer rounded" />
          <div className="w-20 h-6 bg-shimmer-mid bg-shimmer animate-shimmer-d1 rounded" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <TableHeaderSkeleton />
            <tbody>{[1, 2, 3, 4].map((i) => <TableRowSkeleton key={i} />)}</tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
)

// ─── Customizable columns (spec §9) ────────────────────────────────────────
// Scoped to fields that actually exist on the record. Programme, BIG Score,
// Programme Progress, Support Utilised (vs. allocated), and Next Milestone
// from the spec's recommended column set all need backend fields that don't
// exist yet — adding them as columns here would mean showing fabricated
// data, so they're left out rather than faked. "Days in Programme" is
// included since it's honestly derivable from the existing start-date field.
const OPTIONAL_COLUMNS = [
  { key: "progress", label: "Progress (Company Health)" },
  { key: "daysInProgramme", label: "Days in Programme" },
  { key: "appliedDate", label: "Applied Date" },
  { key: "teamSize", label: "Employees" },
  { key: "guarantees", label: "Guarantees" },
  { key: "servicesRequired", label: "Services" },
]
const DEFAULT_COLUMN_VISIBILITY = {
  supportValue: true, startDate: true, status: true, progress: true,
  daysInProgramme: false, appliedDate: false, teamSize: false, guarantees: false, servicesRequired: false,
}

const VIEW_STORAGE_KEY = "my-cohorts-view-v1"
const SAVED_VIEWS_STORAGE_KEY = "my-cohorts-saved-views-v1"

const loadStoredView = () => {
  if (typeof window === "undefined") return null
  try {
    return JSON.parse(window.localStorage.getItem(VIEW_STORAGE_KEY) || "null")
  } catch {
    return null
  }
}

// ─── Overall Business Health (Progress column) ─────────────────────────────
// Sourced from the same cache the Growth Suite → "Overall Company Health"
// tab reads/writes: users/{smeId}/cachedAnalyses/health_overview_{smeId}
// (see HealthCacheService in that page). We don't re-run the AI analysis
// here — we just read whatever is already cached for that SME and collapse
// it to a single red/yellow/green so it fits in a table cell. If the SME
// has never generated a report, there's nothing honest to show, so the
// column reads "Pending" rather than guessing a status.
const HEALTH_CATEGORY_LABELS = {
  strategy: "Strategy & Execution",
  finance: "Finance",
  operations: "Operations",
  people: "People Health",
  marketing: "Marketing & Sales",
  esg: "ESG",
}
const HEALTH_STATUS_RANK = { healthy: 0, watch: 1, risk: 2 }
const HEALTH_COLORS = { green: "#16a34a", yellow: "#f59e0b", red: "#dc2626" }
const HEALTH_LABELS = { green: "Healthy", yellow: "Watch", red: "At Risk" }

// Mirrors the banner thresholds used on the Overall Company Health page.
const scoreToHealth = (score) => {
  if (score >= 75) return "green"
  if (score >= 50) return "yellow"
  return "red"
}

// Worst-category-wins: one red category should not be hidden by five green
// ones — matches how "Attention Required" style flags are meant to surface
// real risk rather than average it away.
const categoriesToHealth = (categories) => {
  const entries = Object.values(categories || {}).filter((c) => c && c.healthStatus)
  if (entries.length === 0) return null
  let worst = "healthy"
  entries.forEach((c) => {
    if (HEALTH_STATUS_RANK[c.healthStatus] > HEALTH_STATUS_RANK[worst]) worst = c.healthStatus
  })
  if (worst === "risk") return "red"
  if (worst === "watch") return "yellow"
  return "green"
}

const deriveOverallHealth = (cachedData) => {
  if (!cachedData) return null
  if (typeof cachedData.overallHealthScore === "number") return scoreToHealth(cachedData.overallHealthScore)
  return categoriesToHealth(cachedData.categories)
}

const fetchHealthForSME = async (smeId) => {
  try {
    const healthRef = doc(db, `users/${smeId}/cachedAnalyses`, `health_overview_${smeId}`)
    const healthSnap = await getDoc(healthRef)
    if (!healthSnap.exists()) return null
    const cached = healthSnap.data()
    const data = cached?.data || {}
    return {
      overall: deriveOverallHealth(data),
      score: typeof data.overallHealthScore === "number" ? data.overallHealthScore : null,
      categories: data.categories || null,
      cachedAt: cached.createdAt || null,
    }
  } catch (error) {
    console.error("Error fetching health for SME:", error)
    return null
  }
}

function MyCohorts() {
  const [cohorts, setCohorts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState(null)
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [voucherType, setVoucherType] = useState("")
  const [voucherSeats, setVoucherSeats] = useState(1)
  const [expirationDays, setExpirationDays] = useState(30)
  const [expirationMinutes, setExpirationMinutes] = useState(null)
  const [isTestMode, setIsTestMode] = useState(false)
  const [generatedVoucher, setGeneratedVoucher] = useState(null)
  const [copied, setCopied] = useState(false)
  const [savingVoucher, setSavingVoucher] = useState(false)

  // Default filter is "inProgramme" (active, whether flagged or not) rather
  // than "all" — spec §20: exited/graduated SMEs shouldn't dominate the
  // default operational view; they're reachable via the counter, a filter,
  // or the "Completed & Exited" saved view.
  const [activeFilter, setActiveFilter] = useState(() => loadStoredView()?.activeFilter || "inProgramme")
  const [density, setDensity] = useState(() => loadStoredView()?.density || "comfortable")
  const [columnVisibility, setColumnVisibility] = useState(() => ({ ...DEFAULT_COLUMN_VISIBILITY, ...(loadStoredView()?.columnVisibility || {}) }))
  const [rowMenu, setRowMenu] = useState(null) // { cohort, position }
  const [voucherTooltip, setVoucherTooltip] = useState(null) // { rect }
  const [healthPopover, setHealthPopover] = useState(null) // { cohort, rect }

  // ─── New: search, filters, columns, saved views, bulk, expand, notes ────
  // Filtering now lives on the column headers themselves (headerFilterOpen
  // tracks which header's popover is open) rather than a separate search
  // bar or Filters panel.
  const [headerFilterOpen, setHeaderFilterOpen] = useState(null) // { type, rect }
  const [localFilters, setLocalFilters] = useState({ name: "", sector: [], location: [] })
  // Drives full-row hover highlighting, including the sticky Business column
  // — that column needs its own opaque background to stay legible while the
  // table scrolls horizontally, which a plain CSS `tr:hover` can't reach.
  const [hoveredRowKey, setHoveredRowKey] = useState(null)
  const [showColumnChooser, setShowColumnChooser] = useState(false)
  const [showSaveView, setShowSaveView] = useState(false)
  const [viewName, setViewName] = useState("")
  const [savedViews, setSavedViews] = useState(() => {
    if (typeof window === "undefined") return []
    try { return JSON.parse(window.localStorage.getItem(SAVED_VIEWS_STORAGE_KEY) || "[]") } catch { return [] }
  })
  const [showArchived, setShowArchived] = useState(false)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [notesByCohort, setNotesByCohort] = useState({}) // cohortId -> [{note, createdAt}]
  const [noteModal, setNoteModal] = useState(null) // { cohort, text }
  const [statusModal, setStatusModal] = useState(null) // { cohorts: [], targetGroup, reason, note }
  const [bulkConfirm, setBulkConfirm] = useState(null) // { message, onConfirm }

  useEffect(() => {
    fetchCohorts()
  }, [])

  // Auto-persist layout (fixes "resets when I leave and come back" for this
  // table too, same fix applied to the matching table).
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify({ activeFilter, density, columnVisibility }))
    } catch {
      // Storage can fail (private browsing, quota) — still works this session.
    }
  }, [activeFilter, density, columnVisibility])

  const fetchCohorts = async () => {
    try {
      setLoading(true)
      const currentUser = auth.currentUser
      if (!currentUser) { setLoading(false); return }

      const successfulStatuses = ["Active Support", "Active", "Exit"]
      const q = query(
        collection(db, "catalystApplications"),
        where("catalystId", "==", currentUser.uid),
        where("status", "in", successfulStatuses)
      )
      const querySnapshot = await getDocs(q)

      const cohortsData = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data()
          try {
            const docIdParts = docSnap.id.split('_')
            const smeId = docIdParts[1]
            if (!smeId) { console.error("No SME ID found in document ID:", docSnap.id); return null }

            let smeName = "Unnamed Business"
            let sector = "Not specified"
            let location = "Not specified"
            let teamSize = "Not specified"
            let description = "No description available"
            let fundingRequired = data.fundingRequired || "Not specified"
            let equityOffered = data.equityOffered || "Not specified"
            let guarantees = data.guarantees || "Not specified"

            const profileRef = doc(db, "universalProfiles", smeId)
            const profileSnap = await getDoc(profileRef)
            if (profileSnap.exists()) {
              const profileData = profileSnap.data()
              const entity = profileData.entityOverview || {}
              smeName = entity.registeredName || entity.tradingName || "Unnamed Business"
              sector = formatLabel(entity.economicSectors?.[0]) || "Not specified"
              location = formatLabel(entity.location) || "Not specified"
              teamSize = entity.employeeCount || "Not specified"
              description = entity.shortBusinessDescription || "No description available"
              const useOfFunds = profileData.useOfFunds || {}
              fundingRequired = fundingRequired === "Not specified" ? (useOfFunds.amountRequested || "Not specified") : fundingRequired
              equityOffered = equityOffered === "Not specified" ? (useOfFunds.equityType || "Not specified") : equityOffered
            }

            const programIndex = docIdParts[2] || '0'
            const programSuffix = programIndex !== '0' ? ` (Program ${parseInt(programIndex) + 1})` : ""

            let displayStatus = data.status || "Active Support"
            if (displayStatus === "Active") displayStatus = "Active Support"

            const health = await fetchHealthForSME(smeId)

            return {
              id: docSnap.id,
              docId: docSnap.id,
              smeId,
              smeName: `${smeName}${programSuffix}`,
              dealAmount: fundingRequired,
              dealType: equityOffered,
              completionDate: data.updatedAt || data.createdAt || null,
              sector,
              location,
              teamSize,
              description,
              currentStatus: displayStatus,
              dealStructure: "Support Program",
              dealDuration: "Ongoing",
              supportProvided: data.servicesRequired || "Funding and Strategic Support",
              roi: "To be determined",
              revenueGrowth: "Pending",
              guarantees,
              servicesRequired: data.servicesRequired || "Not specified",
              applicationDate: data.createdAt ? formatDate(data.createdAt) : "Not recorded",
              applicationDateRaw: data.createdAt || null,
              programIndex,
              archived: data.archived || false,
              exitReason: data.exitReason || null,
              statusHistory: data.statusHistory || [],
              health,
              // TODO(backend): populate once these fields exist on the record
              programme: data.programme || null,
            }
          } catch (error) {
            console.error("Error processing cohort:", error)
            return null
          }
        })
      )

      setCohorts(cohortsData.filter(Boolean))
      setLoading(false)
    } catch (error) {
      console.error("Error fetching cohorts:", error)
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchCohorts()
    setRefreshing(false)
  }

  const generateVoucherCode = (type) => {
    const prefix = type === "legitimacy" ? "LG" : type === "capital" ? "CA" : type === "governance" ? "GV" : type === "compliance" ? "CM" : "PR"
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
    const seatsPart = voucherSeats.toString().padStart(2, '0')
    return `${prefix}${seatsPart}${randomPart}`
  }

  const handleGenerateVoucher = (cohort, type) => {
    setSelectedCohort(cohort)
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
    if (value === "5min") {
      setIsTestMode(true); setExpirationMinutes(5); setExpirationDays(null)
    } else {
      setIsTestMode(false); setExpirationMinutes(null); setExpirationDays(parseInt(value))
    }
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
      if (isTestMode && expirationMinutes) {
        expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes)
      } else if (expirationDays) {
        expiresAt.setDate(expiresAt.getDate() + expirationDays)
      }

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
        catalystName: user.displayName || user.email || "Catalyst",
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

  const handleViewGrowthSuite = (cohort) => {
    sessionStorage.setItem('viewingSMEId', cohort.smeId)
    sessionStorage.setItem('viewingSMEName', cohort.smeName)
    sessionStorage.setItem('investorViewMode', 'true')
    sessionStorage.setItem('viewOrigin', 'catalyst')
    window.location.href = '/overall-company-health'
  }

  const handleViewDocuments = (cohort) => {
    sessionStorage.setItem('viewingSMEId', cohort.smeId)
    sessionStorage.setItem('viewingSMEName', cohort.smeName)
    sessionStorage.setItem('investorViewMode', 'true')
    window.location.href = '/my-documents'
  }

  const handleViewDetails = (cohort) => {
    setSelectedCohort(cohort)
    setRowMenu(null)
  }

  const getRoiColor = (roi) => {
    if (roi === "Pending" || roi === "To be determined") return "#666"
    const percentage = Number.parseInt(roi.replace(/[+%]/g, ""))
    if (percentage >= 100) return "#4caf50"
    if (percentage >= 50) return "#8bc34a"
    if (percentage >= 20) return "#ff9800"
    return "#f44336"
  }

  // ─── Add Note (spec §7/§8 "Latest Activity", §6 secondary menu) ─────────
  // Real Firestore write, not a placeholder — a dedicated `cohortNotes`
  // collection keyed by cohortId, fetched on row expand.
  const fetchNotesForCohort = async (cohort) => {
    try {
      const snapshot = await getDocs(query(collection(db, "cohortNotes"), where("cohortId", "==", cohort.id)))
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
      await addDoc(collection(db, "cohortNotes"), {
        catalystId: user.uid,
        smeId: noteModal.cohort.smeId,
        cohortId: noteModal.cohort.id,
        note: noteModal.text.trim(),
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
        authorName: user.displayName || user.email || "Catalyst",
      })
      await fetchNotesForCohort(noteModal.cohort)
      setExpandedRows((prev) => new Set(prev).add(noteModal.cohort.id))
      setNoteModal(null)
    } catch (error) {
      console.error("Error saving note:", error)
      alert("Failed to save note. Please try again.")
    }
  }

  // ─── Change Status (spec §17: require a reason, log an audit entry) ─────
  const openStatusModal = (cohortOrCohorts) => {
    const list = Array.isArray(cohortOrCohorts) ? cohortOrCohorts : [cohortOrCohorts]
    setStatusModal({ cohorts: list, targetGroup: "", reason: "", note: "" })
    setRowMenu(null)
  }

  const submitStatusChange = async () => {
    if (!statusModal?.targetGroup) return
    if (statusModal.targetGroup === "exited" && !statusModal.reason) return

    const newStatus = statusModal.targetGroup === "exited" ? "Exit" : "Active"
    const run = async () => {
      try {
        for (const cohort of statusModal.cohorts) {
          const prevMeta = getStatusMeta(cohort.currentStatus)
          const historyEntry = {
            previousStatus: prevMeta.label,
            newStatus: statusModal.targetGroup === "exited" ? "Graduated / Exited" : "Active",
            changedAt: new Date().toISOString(),
            reason: statusModal.reason || null,
            note: statusModal.note || null,
          }
          await updateDoc(doc(db, "catalystApplications", cohort.docId), {
            status: newStatus,
            ...(statusModal.reason ? { exitReason: statusModal.reason } : {}),
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

    if (statusModal.targetGroup === "exited") {
      setBulkConfirm({
        message: statusModal.cohorts.length > 1
          ? `Mark ${statusModal.cohorts.length} businesses as Graduated / Exited? This cannot be easily undone.`
          : `Mark ${statusModal.cohorts[0].smeName} as Graduated / Exited? This cannot be easily undone.`,
        onConfirm: run,
      })
    } else {
      run()
    }
  }

  // ─── Archive (spec §6 secondary menu) ────────────────────────────────────
  const handleArchive = async (cohort) => {
    setBulkConfirm({
      message: `Archive ${cohort.smeName}? It will be hidden from the default view but can still be found via "Show archived".`,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "catalystApplications", cohort.docId), { archived: true })
          await fetchCohorts()
        } catch (error) {
          console.error("Error archiving record:", error)
          alert("Failed to archive. Please try again.")
        }
      },
    })
    setRowMenu(null)
  }

  // ─── Bulk selection + export (spec §18) ──────────────────────────────────
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
      const headers = ["Business Name", "Support Value", "Start Date", "Status", "Sector", "Location"]
      const dataRows = selected.map((c) => [
        c.smeName, formatCurrency(c.dealAmount), formatDate(c.completionDate),
        getStatusMeta(c.currentStatus).label, c.sector, c.location,
      ].map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(","))
      const csv = [headers.join(","), ...dataRows].join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url; link.download = `cohorts-export-${new Date().toISOString().split("T")[0]}.csv`; link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  // ─── Derived: counters (spec §3 wants 5 tiles) ───────────────────────────
  // NOTE(backend): "Graduated" and "Exited" are shown as distinct tiles per
  // spec, but the schema has no field distinguishing a successful graduation
  // from an early exit — both collapse to the same "Exit" status today. Both
  // tiles read the same underlying count until that distinction exists;
  // labeling them separately (with a shared explanatory tooltip) is more
  // honest than inventing a split that isn't backed by real data.
  const visibleCohorts = useMemo(() => cohorts.filter((c) => showArchived || !c.archived), [cohorts, showArchived])

  const counts = useMemo(() => ({
    total: visibleCohorts.length,
    active: visibleCohorts.filter((c) => getStatusMeta(c.currentStatus).group === "active" && !needsAttention(c)).length,
    attention: visibleCohorts.filter((c) => getStatusMeta(c.currentStatus).group === "active" && needsAttention(c)).length,
    exited: visibleCohorts.filter((c) => getStatusMeta(c.currentStatus).group === "exited").length,
  }), [visibleCohorts])

  // ─── Derived: filter options from real data ──────────────────────────────
  const sectorOptions = useMemo(() => [...new Set(visibleCohorts.map((c) => c.sector).filter((s) => s && s !== "Not specified"))].sort(), [visibleCohorts])
  const locationOptions = useMemo(() => [...new Set(visibleCohorts.map((c) => c.location).filter((l) => l && l !== "Not specified"))].sort(), [visibleCohorts])

  const activeFilterCount = (localFilters.name.trim() ? 1 : 0) + localFilters.sector.length + localFilters.location.length

  // ─── Filtering, search, sort ──────────────────────────────────────────────
  const filteredCohorts = useMemo(() => {
    let result = visibleCohorts.filter((c) => {
      const meta = getStatusMeta(c.currentStatus)
      if (activeFilter === "inProgramme") return meta.group === "active"
      if (activeFilter === "active") return meta.group === "active" && !needsAttention(c)
      if (activeFilter === "attention") return meta.group === "active" && needsAttention(c)
      if (activeFilter === "exited") return meta.group === "exited"
      return true // "all"
    })

    if (localFilters.name.trim()) {
      const q = localFilters.name.toLowerCase().trim()
      result = result.filter((c) => c.smeName.toLowerCase().includes(q))
    }

    if (localFilters.sector.length > 0) result = result.filter((c) => localFilters.sector.includes(c.sector))
    if (localFilters.location.length > 0) result = result.filter((c) => localFilters.location.includes(c.location))

    return [...result].sort((a, b) => {
      const rankDiff = cohortSortRank(a) - cohortSortRank(b)
      if (rankDiff !== 0) return rankDiff
      return a.smeName.localeCompare(b.smeName)
    })
  }, [visibleCohorts, activeFilter, localFilters])

  const rowPad = density === "compact" ? "py-2.5 px-3" : "py-3.5 px-4"

  const openRowMenu = (cohort, event) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    const menuWidth = 220
    let x = rect.right - menuWidth
    let y = rect.bottom + 6
    if (x < 12) x = 12
    if (y + 340 > window.innerHeight - 12) y = rect.top - 340 - 6
    setRowMenu({ cohort, position: { x, y } })
  }

  const openHealthPopover = (cohort, event) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    setHealthPopover({ cohort, rect })
  }

  const toggleColumn = (key) => setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
  const resetColumns = () => setColumnVisibility(DEFAULT_COLUMN_VISIBILITY)

  // Filtering happens straight from the column header: clicking the filter
  // icon opens a small popover anchored to that header.
  const openHeaderFilter = (type, event) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    setHeaderFilterOpen((prev) => (prev?.type === type ? null : { type, rect }))
  }
  const closeHeaderFilter = () => setHeaderFilterOpen(null)

  // Small icon button placed on a column header; lights up when that
  // column currently has an active filter.
  const FilterTrigger = ({ type, active }) => (
    <button
      type="button"
      onClick={(e) => openHeaderFilter(type, e)}
      className={`p-0.5 rounded transition-colors ${active ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"}`}
      title="Filter this column"
    >
      <SlidersHorizontal size={11} />
    </button>
  )

  const saveCurrentView = () => {
    if (!viewName.trim()) return
    setSavedViews((prev) => {
      const next = [...prev.filter((v) => v.name !== viewName.trim()), { name: viewName.trim(), activeFilter, columnVisibility: { ...columnVisibility }, density }]
      try { window.localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
    setViewName(""); setShowSaveView(false)
  }

  const loadSavedView = (view) => {
    setActiveFilter(view.activeFilter); setColumnVisibility({ ...DEFAULT_COLUMN_VISIBILITY, ...(view.columnVisibility || {}) }); setDensity(view.density)
    setShowSaveView(false)
  }

  const deleteSavedView = (name) => {
    setSavedViews((prev) => {
      const next = prev.filter((v) => v.name !== name)
      try { window.localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  const daysInProgramme = (cohort) => {
    if (!cohort.completionDate) return null
    const d = typeof cohort.completionDate === "object" && cohort.completionDate.toDate ? cohort.completionDate.toDate() : new Date(cohort.completionDate)
    if (isNaN(d.getTime())) return null
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)))
  }

  // Spec §6: one contextual primary action instead of always "View
  // Progress" — varies with what the record actually needs next, using only
  // signals we can honestly derive today (attention flag, group).
  const getPrimaryAction = (cohort) => {
    const meta = getStatusMeta(cohort.currentStatus)
    if (meta.group === "exited") return { label: "View Record", handler: handleViewGrowthSuite }
    if (needsAttention(cohort)) return { label: "Review SME", handler: handleViewGrowthSuite }
    return { label: "Deep Dive", handler: handleViewGrowthSuite }
  }

  const modalOverlayStyle = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(62, 39, 35, 0.85)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 1000, animation: "fadeIn 0.3s ease-out", backdropFilter: "blur(4px)",
  }

  const modalContentStyle = {
    backgroundColor: "#ffffff", borderRadius: "20px", padding: "40px",
    maxWidth: "550px", width: "95%", maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
  }

  if (loading) return <LoadingSkeleton />

  const allVisibleSelected = filteredCohorts.length > 0 && filteredCohorts.every((c) => selectedRows.has(c.id))

  return (
    <div className="min-h-screen box-border transition-[margin-left] duration-300">
      <div className="mx-auto px-8 w-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-[#4a352f] mb-1">My Cohorts</h1>
            <p className="text-[#7d5a50] text-base m-0">
              Manage active, completed and exited SMEs across your programmes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={`flex items-center gap-1.5 border-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${showArchived ? "bg-[#7d5a50] text-white border-[#7d5a50]" : "bg-white text-[#7d5a50] border-[#c8b6a6] hover:bg-[#f5f0e1]"}`}
            >
              <Archive size={14} /> {showArchived ? "Hiding archived: off" : "Show archived"}
            </button>
            <select
              value={density}
              onChange={(e) => setDensity(e.target.value)}
              className="px-3 py-2.5 bg-white border-2 border-[#c8b6a6] rounded-lg text-xs font-semibold text-[#4a352f] cursor-pointer"
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
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

        <CohortStagePipeline counts={counts} activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

        {/* Saved views (user-created named layouts — distinct from the
            quick-filter cards above, so not part of the de-duplication) */}
        {savedViews.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {savedViews.map((v) => (
              <span key={v.name} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border border-[#c8b6a6] bg-white text-[#4a352f]">
                <button onClick={() => loadSavedView(v)} className="hover:text-[#7d5a50]">{v.name}</button>
                <button onClick={() => deleteSavedView(v.name)} className="text-[#a89482] hover:text-red-500"><Trash2 size={11} /></button>
              </span>
            ))}
          </div>
        )}

        {/* Toolbar: columns, save view (filtering now lives on headers) */}
        <div className="bg-[#faf7f2] rounded-t-2xl p-4 border border-[#e6d7c3] border-b-0 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#fff3e0] text-[#e65100] border border-[#e65100]/30">
                  <SlidersHorizontal size={12} /> {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowColumnChooser(!showColumnChooser)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm">
                  <Plus size={16} /> Add New Field <ChevronDown size={14} className={`transition-transform ${showColumnChooser ? 'rotate-180' : ''}`} />
                </button>
                {showColumnChooser && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowColumnChooser(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-4 z-50">
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-2">Column Visibility</h4>
                      {OPTIONAL_COLUMNS.map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-[#faf7f2] cursor-pointer">
                          <input type="checkbox" checked={columnVisibility[key] || false} onChange={() => toggleColumn(key)} className="rounded border-[#c8b6a6] text-[#7d5a50]" />
                          <span className="text-sm text-[#4a352f]">{label}</span>
                        </label>
                      ))}
                      <div className="border-t border-[#e6d7c3] my-2" />
                      <button onClick={resetColumns} className="text-xs text-[#7d5a50] underline hover:text-[#4a352f]">Reset to default</button>
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button onClick={() => setShowSaveView(!showSaveView)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm">
                  <Bookmark size={16} /> Save View
                </button>
                {showSaveView && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSaveView(false)} />
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-4 z-50">
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-2">Save current layout</h4>
                      <div className="flex items-center gap-2">
                        <input
                          value={viewName}
                          onChange={(e) => setViewName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveCurrentView()}
                          placeholder="View name..."
                          className="flex-1 px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm"
                        />
                        <button onClick={saveCurrentView} disabled={!viewName.trim()} className="px-3 py-1.5 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold disabled:opacity-40">Save</button>
                      </div>
                    </div>
                  </>
                )}
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
              <h2 className="text-lg font-semibold text-[#4a352f] m-0">Cohort Businesses</h2>
              <span className="text-xs text-[#7d5a50] bg-[#a67c52]/15 px-3 py-1.5 rounded-md font-semibold">
                {filteredCohorts.length} {filteredCohorts.length === 1 ? 'business' : 'businesses'}
              </span>
            </div>

            <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
              <style>{`.mc-th { color: #faf7f2 !important; }`}</style>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#4a352f]">
                    <th className={`mc-th ${rowPad} sticky top-0 left-0 z-30`} style={{ backgroundColor: '#4a352f', width: '40px' }}>
                      <button onClick={() => toggleSelectAll(filteredCohorts)} className="flex items-center justify-center">
                        {allVisibleSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </th>
                    <th className={`mc-th ${rowPad} text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap sticky top-0 left-0 z-30`} style={{ backgroundColor: '#4a352f' }}>
                      <div className="flex items-center gap-1">
                        Business
                        <FilterTrigger type="business" active={activeFilterCount > 0} />
                      </div>
                    </th>
                    {columnVisibility.supportValue && <th className={`mc-th ${rowPad} text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap sticky top-0 z-20`} style={{ backgroundColor: '#4a352f' }}>Support Value</th>}
                    {columnVisibility.startDate && <th className={`mc-th ${rowPad} text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap sticky top-0 z-20`} style={{ backgroundColor: '#4a352f' }}>Start Date</th>}
                    {columnVisibility.daysInProgramme && <th className={`mc-th ${rowPad} text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap sticky top-0 z-20`} style={{ backgroundColor: '#4a352f' }}>Days in Programme</th>}
                    {columnVisibility.appliedDate && <th className={`mc-th ${rowPad} text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap sticky top-0 z-20`} style={{ backgroundColor: '#4a352f' }}>Applied Date</th>}
                    {columnVisibility.teamSize && <th className={`mc-th ${rowPad} text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap sticky top-0 z-20`} style={{ backgroundColor: '#4a352f' }}>Employees</th>}
                    {columnVisibility.guarantees && <th className={`mc-th ${rowPad} text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap sticky top-0 z-20`} style={{ backgroundColor: '#4a352f' }}>Guarantees</th>}
                    {columnVisibility.servicesRequired && <th className={`mc-th ${rowPad} text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap sticky top-0 z-20`} style={{ backgroundColor: '#4a352f' }}>Services</th>}
                    {columnVisibility.status && <th className={`mc-th ${rowPad} text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap sticky top-0 z-20`} style={{ backgroundColor: '#4a352f', minWidth: '130px', paddingRight: '8px' }}>Status</th>}
                    {columnVisibility.progress && <th className={`mc-th ${rowPad} text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap sticky top-0 z-20`} style={{ backgroundColor: '#4a352f', minWidth: '110px', paddingLeft: '8px' }}>Progress</th>}
                    <th className={`mc-th ${rowPad} text-center font-semibold text-xs uppercase tracking-wide whitespace-nowrap sticky top-0 z-20`} style={{ backgroundColor: '#4a352f' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCohorts.map((cohort) => {
                    const meta = getStatusMeta(cohort.currentStatus)
                    const flagged = meta.group === "active" && needsAttention(cohort)
                    const isExpanded = expandedRows.has(cohort.id)
                    const primaryAction = getPrimaryAction(cohort)
                    const days = daysInProgramme(cohort)
                    const healthColor = cohort.health?.overall ? HEALTH_COLORS[cohort.health.overall] : "#a89482"
                    const healthLabel = cohort.health?.overall ? HEALTH_LABELS[cohort.health.overall] : "Pending"

                    return (
                      <React.Fragment key={cohort.id}>
                        <tr
                          className="last:border-b-0 border-b border-[#f0e6d9] transition-colors duration-200"
                          style={{ backgroundColor: hoveredRowKey === cohort.id ? '#faf7f2' : undefined }}
                          onMouseEnter={() => setHoveredRowKey(cohort.id)}
                          onMouseLeave={() => setHoveredRowKey(null)}
                        >
                          <td className={`${rowPad}`}>
                            <button onClick={() => toggleRowSelected(cohort.id)} className="flex items-center justify-center">
                              {selectedRows.has(cohort.id) ? <CheckSquare size={16} className="text-[#7d5a50]" /> : <Square size={16} className="text-[#c8b6a6]" />}
                            </button>
                          </td>
                          <td
                            className={`${rowPad} sticky left-0 z-10 border-r border-b border-[#f0e6d9] transition-colors`}
                            style={{ minWidth: '220px', backgroundColor: hoveredRowKey === cohort.id ? '#faf7f2' : '#ffffff' }}
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
                                <div className="text-xs text-[#7d5a50] mt-0.5">
                                  {cohort.sector} · {cohort.location}
                                </div>
                              </div>
                            </div>
                          </td>

                          {columnVisibility.supportValue && (
                            <td className={`${rowPad}`} style={{ minWidth: '130px' }}>
                              <span className="font-semibold text-[#4a352f]">{formatCurrency(cohort.dealAmount)}</span>
                            </td>
                          )}

                          {columnVisibility.startDate && (
                            <td className={`${rowPad}`} style={{ minWidth: '120px' }}>
                              <span className="text-[#5d4037]">{formatDate(cohort.completionDate)}</span>
                            </td>
                          )}

                          {columnVisibility.daysInProgramme && (
                            <td className={`${rowPad}`} style={{ minWidth: '120px' }}>
                              <span className="text-[#5d4037]">{days === null ? "Not available" : `${days} days`}</span>
                            </td>
                          )}

                          {columnVisibility.appliedDate && (
                            <td className={`${rowPad}`} style={{ minWidth: '120px' }}>
                              <span className="text-[#5d4037]">{cohort.applicationDate}</span>
                            </td>
                          )}

                          {columnVisibility.teamSize && (
                            <td className={`${rowPad}`}><span className="text-[#5d4037]">{cohort.teamSize}</span></td>
                          )}

                          {columnVisibility.guarantees && (
                            <td className={`${rowPad}`}><span className="text-[#5d4037] line-clamp-1">{cohort.guarantees}</span></td>
                          )}

                          {columnVisibility.servicesRequired && (
                            <td className={`${rowPad}`}><span className="text-[#5d4037] line-clamp-1">{cohort.servicesRequired}</span></td>
                          )}

                          {columnVisibility.status && (
                            <td className={`${rowPad}`} style={{ minWidth: '130px', paddingRight: '8px' }}>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className="px-2.5 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap"
                                  style={{ backgroundColor: meta.color + "20", color: meta.color }}
                                >
                                  {meta.label}
                                </span>
                                {flagged && (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                                    style={{ backgroundColor: "#fff3e0", color: "#e65100" }}
                                    title="Missing start date or funding information on record"
                                  >
                                    <AlertCircle size={11} /> Attention
                                  </span>
                                )}
                              </div>
                            </td>
                          )}

                          {columnVisibility.progress && (
                            <td className={`${rowPad}`} style={{ minWidth: '110px', paddingLeft: '8px' }}>
                              <button
                                onClick={(e) => openHealthPopover(cohort, e)}
                                className="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                                style={{ backgroundColor: healthColor + "20", color: healthColor }}
                              >
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: healthColor }} />
                                {healthLabel}
                                <ChevronDown size={11} />
                              </button>
                            </td>
                          )}

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

                        {/* Expandable row (spec §8): only new info, nothing
                            already visible in the collapsed row. */}
                        {isExpanded && (
                          <tr className="bg-[#faf7f2] border-b border-[#f0e6d9]">
                            <td></td>
                            <td colSpan={9} className="px-4 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-semibold text-[#4a352f] mb-1 uppercase tracking-wide">Description</p>
                                  <p className="text-sm text-[#5d4037]">{cohort.description}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-[#4a352f] mb-1 uppercase tracking-wide">Equity Offered</p>
                                  <p className="text-sm text-[#5d4037]">{cohort.dealType}</p>
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
                                          <p className="text-[10px] text-[#a89482] mt-1">{n.authorName || "Catalyst"} · {n.createdAtMs ? formatDate(n.createdAtMs) : "Just now"}</p>
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
            <h3 className="text-2xl font-semibold text-[#4a352f] mb-3">
              {visibleCohorts.length === 0
                ? "No SMEs in the cohort"
                : activeFilter === "inProgramme"
                  ? "No active SMEs"
                  : "No results after filtering"}
            </h3>
            <p className="text-[#7d5a50] text-base max-w-[500px] mx-auto">
              {visibleCohorts.length === 0
                ? <>No SMEs have entered this cohort yet. Businesses will appear here once support is approved and they reach an active stage.</>
                : activeFilter === "inProgramme"
                  ? <>There are currently no active SMEs in this programme.</>
                  : <>No SMEs match the selected filters. <button onClick={() => { setActiveFilter("inProgramme"); setLocalFilters({ name: "", sector: [], location: [] }) }} className="underline hover:text-[#4a352f]">Clear filters</button></>}
            </p>
          </div>
        )}
      </div>

      {/* ─── Column header filter popover ───────────────────────────────────
          Replaces the old standalone Filters panel — the Business header
          opens a popover covering name, sector, and location, since those
          three are all shown together in that one column. */}
      {headerFilterOpen && (
        <Portal>
          <div className="fixed inset-0 z-[1090]" onClick={closeHeaderFilter} />
          <div
            className="fixed z-[1091] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-4"
            style={{
              top: headerFilterOpen.rect.bottom + 8,
              left: Math.min(Math.max(headerFilterOpen.rect.left - 20, 12), window.innerWidth - 312),
              width: '300px',
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
          >
            {headerFilterOpen.type === 'business' && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Business name</label>
                  {localFilters.name && (
                    <button onClick={() => setLocalFilters((prev) => ({ ...prev, name: '' }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <input
                  autoFocus
                  type="text"
                  value={localFilters.name}
                  onChange={(e) => setLocalFilters((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Search business name..."
                  className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20 mb-4"
                />

                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Sector</label>
                  {localFilters.sector.length > 0 && (
                    <button onClick={() => setLocalFilters((prev) => ({ ...prev, sector: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {sectorOptions.length === 0 && <span className="text-xs text-[#a89482]">No sector data available</span>}
                  {sectorOptions.map((s) => (
                    <button key={s} onClick={() => setLocalFilters((prev) => ({ ...prev, sector: prev.sector.includes(s) ? prev.sector.filter((x) => x !== s) : [...prev.sector, s] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.sector.includes(s) ? 'bg-[#7d5a50] text-white' : 'bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]'}`}>{s}</button>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Location</label>
                  {localFilters.location.length > 0 && (
                    <button onClick={() => setLocalFilters((prev) => ({ ...prev, location: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {locationOptions.length === 0 && <span className="text-xs text-[#a89482]">No location data available</span>}
                  {locationOptions.map((l) => (
                    <button key={l} onClick={() => setLocalFilters((prev) => ({ ...prev, location: prev.location.includes(l) ? prev.location.filter((x) => x !== l) : [...prev.location, l] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.location.includes(l) ? 'bg-[#7d5a50] text-white' : 'bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]'}`}>{l}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </Portal>
      )}

      {/* ─── Row secondary-action menu (⋮) — spec §6 expanded set ───────────── */}
      {rowMenu && (
        <Portal>
          <div className="fixed inset-0 z-[1090]" onClick={() => { setRowMenu(null); setVoucherTooltip(null) }} />
          <div
            className="fixed z-[1100] bg-white rounded-xl shadow-2xl border border-[#e6d7c3] py-1 overflow-visible"
            style={{ top: rowMenu.position.y, left: rowMenu.position.x, width: '230px' }}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#e6d7c3]">
              <span className="text-xs font-semibold text-[#4a352f]">Quick Actions</span>
              <button onClick={() => setRowMenu(null)} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={14} /></button>
            </div>
            <button
              onClick={() => { handleViewGrowthSuite(rowMenu.cohort); setRowMenu(null) }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <TrendingUp size={12} /> Open Growth Suite
            </button>
            <button
              onClick={() => { handleViewDocuments(rowMenu.cohort); setRowMenu(null) }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <FileText size={12} /> View Documents
            </button>
            <button
              onMouseEnter={(e) => setVoucherTooltip({ rect: e.currentTarget.getBoundingClientRect() })}
              onMouseLeave={() => setVoucherTooltip(null)}
              onClick={() => handleGenerateVoucher(rowMenu.cohort, "premium")}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Ticket size={12} /> Generate Voucher
              <Info size={11} className="ml-auto text-[#a67c52]" />
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
              <Eye size={12} /> View Summary
            </button>
            <div className="border-t border-[#e6d7c3] my-1" />
            <button
              onClick={() => handleArchive(rowMenu.cohort)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 text-left"
            >
              <Archive size={12} /> Archive Record
            </button>
          </div>
        </Portal>
      )}

      {voucherTooltip && <VoucherInfoTooltip anchorRect={voucherTooltip.rect} />}

      {/* ─── Health / Progress popover ───────────────────────────────────── */}
      {healthPopover && (() => {
        const { cohort, rect } = healthPopover
        const width = 300
        let x = rect.left
        let y = rect.bottom + 8
        if (x + width > window.innerWidth - 16) x = window.innerWidth - width - 16
        if (x < 16) x = 16
        if (y + 320 > window.innerHeight - 16) y = rect.top - 320 - 8
        const health = cohort.health
        const overall = health?.overall
        const overallColor = overall ? HEALTH_COLORS[overall] : "#a89482"
        const overallLabel = overall ? HEALTH_LABELS[overall] : "Pending"

        return (
          <Portal>
            <div className="fixed inset-0 z-[1190]" onClick={() => setHealthPopover(null)} />
            <div
              className="fixed z-[1200] bg-white border border-[#e6d7c3] rounded-xl shadow-2xl p-4"
              style={{ top: y, left: x, width }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#4a352f]">Overall Business Health</span>
                <button onClick={() => setHealthPopover(null)} className="text-[#a89482] hover:text-[#4a352f]"><X size={14} /></button>
              </div>

              <div className="flex items-center gap-2 mb-3 px-2.5 py-2 rounded-lg" style={{ backgroundColor: overallColor + "15" }}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: overallColor }} />
                <span className="text-sm font-semibold" style={{ color: overallColor }}>{overallLabel}</span>
                {health?.score != null && <span className="text-xs text-[#7d5a50] ml-auto">{health.score}/100</span>}
              </div>

              {health?.categories ? (
                <div className="space-y-1.5 mb-2">
                  {Object.entries(HEALTH_CATEGORY_LABELS).map(([key, label]) => {
                    const cat = health.categories[key]
                    if (!cat?.healthStatus) return null
                    const catColor = cat.healthStatus === "risk" ? HEALTH_COLORS.red : cat.healthStatus === "watch" ? HEALTH_COLORS.yellow : HEALTH_COLORS.green
                    return (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-[#5d4037]">{label}</span>
                        <span className="flex items-center gap-1.5" style={{ color: catColor }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                          {cat.healthStatus === "risk" ? "Risk" : cat.healthStatus === "watch" ? "Watch" : "Healthy"}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#a89482] italic mb-2">
                  This business hasn't generated a Company Health report yet in their Growth Suite.
                </p>
              )}

              {health?.cachedAt && (
                <p className="text-[10px] text-[#a89482] mt-2 pt-2 border-t border-[#e6d7c3]">
                  From their Growth Suite · updated {formatDate(health.cachedAt)}
                </p>
              )}

              <button
                onClick={() => { setHealthPopover(null); handleViewGrowthSuite(cohort) }}
                className="w-full mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ backgroundColor: "#a67c52" }}
              >
                Open Growth Suite
              </button>
            </div>
          </Portal>
        )
      })()}

      {/* ─── Add Note Modal ──────────────────────────────────────────────── */}
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

      {/* ─── Change Status Modal (spec §17: required reason on exit) ─────── */}
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
              <button
                onClick={() => setStatusModal((prev) => ({ ...prev, targetGroup: "active" }))}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 ${statusModal.targetGroup === "active" ? "border-[#4caf50] bg-[#e8f5e9] text-[#2e7d32]" : "border-[#e6d7c3] text-[#4a352f]"}`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusModal((prev) => ({ ...prev, targetGroup: "exited" }))}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 ${statusModal.targetGroup === "exited" ? "border-[#9e9e9e] bg-[#f3f4f6] text-[#4a352f]" : "border-[#e6d7c3] text-[#4a352f]"}`}
              >
                Graduated / Exited
              </button>
            </div>
            {statusModal.targetGroup === "exited" && (
              <>
                <label className="block text-xs font-semibold text-[#5d4037] mb-2">Reason (required)</label>
                <select
                  value={statusModal.reason}
                  onChange={(e) => setStatusModal((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-[#c8b6a6] rounded-lg text-sm mb-3"
                >
                  <option value="">Choose a reason...</option>
                  {EXIT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <label className="block text-xs font-semibold text-[#5d4037] mb-2">Note (optional)</label>
                <textarea
                  value={statusModal.note}
                  onChange={(e) => setStatusModal((prev) => ({ ...prev, note: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-[#c8b6a6] rounded-lg text-sm resize-y mb-2"
                />
              </>
            )}
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setStatusModal(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button
                onClick={submitStatusChange}
                disabled={!statusModal.targetGroup || (statusModal.targetGroup === "exited" && !statusModal.reason)}
                className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-sm font-semibold disabled:opacity-40"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Generic confirm modal for high-risk actions (spec §18) ──────── */}
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

      {/* Detailed View Modal */}
      {selectedCohort && !showVoucherModal && (
        <div
          className="fixed inset-0 bg-[#3e2723]/85 flex justify-center items-center z-[1000] animate-[fadeIn_0.3s_ease-out] backdrop-blur-sm"
          onClick={() => setSelectedCohort(null)}
        >
          <div
            className="bg-white rounded-2xl p-10 max-w-[900px] w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl border border-[#8d6e63]/10 animate-[slideUp_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8 pb-6 border-b-[3px] border-[#8d6e63]">
              <h2 className="text-[28px] font-bold text-[#3e2723] m-0">
                Support Deal Details: {selectedCohort.smeName}
              </h2>
              <button onClick={() => setSelectedCohort(null)} className="bg-none border-none text-2xl cursor-pointer text-gray-600 p-2">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mb-8">
              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200">
                <h3 className="text-[#3e2723] mb-4">Financial Details</h3>
                <div className="grid gap-3">
                  <div><strong>Funding Required:</strong> {formatCurrency(selectedCohort.dealAmount)}</div>
                  <div><strong>Equity Offered:</strong> {selectedCohort.dealType}</div>
                  <div><strong>Guarantees:</strong> {selectedCohort.guarantees || "Not specified"}</div>
                  <div><strong>Deal Structure:</strong> {selectedCohort.dealStructure}</div>
                </div>
              </div>

              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200">
                <h3 className="text-[#3e2723] mb-4">Timeline & Performance</h3>
                <div className="grid gap-3">
                  <div><strong>Start Date:</strong> {formatDate(selectedCohort.completionDate)}</div>
                  <div><strong>Support Duration:</strong> {selectedCohort.dealDuration}</div>
                  <div><strong>ROI:</strong> <span className="font-bold ml-2" style={{ color: getRoiColor(selectedCohort.roi) }}>{selectedCohort.roi}</span></div>
                  <div>
                    <strong>Current Status:</strong>
                    <span
                      className="ml-2 px-2 py-1 rounded-lg text-xs font-semibold"
                      style={{
                        backgroundColor: getStatusMeta(selectedCohort.currentStatus).color + "20",
                        color: getStatusMeta(selectedCohort.currentStatus).color,
                      }}
                    >
                      {getStatusMeta(selectedCohort.currentStatus).label}
                    </span>
                  </div>
                  {selectedCohort.exitReason && (
                    <div><strong>Exit Reason:</strong> {selectedCohort.exitReason}</div>
                  )}
                </div>
              </div>

              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200">
                <h3 className="text-[#3e2723] mb-4">Company Details</h3>
                <div className="grid gap-3">
                  <div><strong>Sector:</strong> {selectedCohort.sector}</div>
                  <div><strong>Location:</strong> {selectedCohort.location}</div>
                  <div><strong>Team Size:</strong> {selectedCohort.teamSize}</div>
                  <div><strong>Description:</strong> {selectedCohort.description}</div>
                </div>
              </div>
            </div>

            <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200 mb-6">
              <h3 className="text-[#3e2723] mb-4">Support Services Provided</h3>
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

            <div className="bg-green-50 p-6 rounded-xl border border-green-600 mb-6">
              <h3 className="text-green-800 mb-4">Support Program Summary</h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: getRoiColor(selectedCohort.roi) }}>{selectedCohort.roi}</div>
                  <div className="text-sm text-gray-600">Return on Investment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{formatCurrency(selectedCohort.dealAmount)}</div>
                  <div className="text-sm text-gray-600">Support Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: getRoiColor(selectedCohort.revenueGrowth) }}>{selectedCohort.revenueGrowth}</div>
                  <div className="text-sm text-gray-600">Revenue Growth</div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-[#3e2723] mb-4">Generate Support Vouchers</h3>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {[
                  { id: "premium", label: "Premium Subscription" },
                  { id: "legitimacy", label: "Legitimacy Boost" },
                  { id: "capital", label: "Capital Boost" },
                  { id: "governance", label: "Governance Boost" },
                  { id: "compliance", label: "Compliance Boost" },
                ].map((v) => (
                  <div key={v.id} className="relative"
                    onMouseEnter={(e) => setVoucherTooltip({ rect: e.currentTarget.getBoundingClientRect() })}
                    onMouseLeave={() => setVoucherTooltip(null)}
                  >
                    <button
                      onClick={() => handleGenerateVoucher(selectedCohort, v.id)}
                      style={{
                        backgroundColor: "#a67c52", color: "white", border: "none", borderRadius: "8px",
                        padding: "10px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "6px",
                      }}
                    >
                      {v.label}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedCohort(null)}
                className="bg-[#5d4037] text-white border-none rounded-xl px-8 py-4 text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-[#4a352f]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Generation Modal */}
      {showVoucherModal && (
        <div style={modalOverlayStyle} onClick={() => setShowVoucherModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#3e2723", margin: 0 }}>
                Generate Voucher for {selectedCohort?.smeName}
              </h2>
              <button onClick={() => setShowVoucherModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {!generatedVoucher ? (
              <>
                <p style={{ color: "#5d4037", marginBottom: "24px" }}>
                  Select the type of voucher you want to generate for this business:
                </p>

                <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
                  {[
                    { id: "premium", label: "Premium Subscription", icon: "🌟" },
                    { id: "legitimacy", label: "Boost Your Legitimacy Score", icon: "🏆" },
                    { id: "capital", label: "Boost Capital Appeal Score", icon: "💰" },
                    { id: "governance", label: "Boost Governance Score", icon: "⚖️" },
                    { id: "compliance", label: "Boost Your Compliance", icon: "📋" },
                  ].map((option) => (
                    <label key={option.id} style={{
                      display: "flex", alignItems: "center", padding: "16px",
                      border: `2px solid ${voucherType === option.id ? "#a67c52" : "#E8D5C4"}`,
                      borderRadius: "10px", cursor: "pointer",
                      backgroundColor: voucherType === option.id ? "#fef9f4" : "white",
                      transition: "all 0.2s ease",
                    }}>
                      <input
                        type="radio" name="voucherType" value={option.id}
                        checked={voucherType === option.id}
                        onChange={(e) => setVoucherType(e.target.value)}
                        style={{ marginRight: "12px", accentColor: "#a67c52" }}
                      />
                      <span style={{ fontSize: "1.2rem", marginRight: "12px" }}>{option.icon}</span>
                      <span style={{ color: "#3e2723", fontWeight: voucherType === option.id ? "600" : "400" }}>{option.label}</span>
                    </label>
                  ))}
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", color: "#5d4037", fontWeight: "600", marginBottom: "8px" }}>Number of Seats:</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <button onClick={() => setVoucherSeats(Math.max(1, voucherSeats - 1))} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #a67c52", background: "white", fontSize: "1.2rem", cursor: "pointer" }}>-</button>
                    <span style={{ fontSize: "1.5rem", fontWeight: "700", color: "#3e2723", minWidth: "40px", textAlign: "center" }}>{voucherSeats}</span>
                    <button onClick={() => setVoucherSeats(voucherSeats + 1)} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #a67c52", background: "white", fontSize: "1.2rem", cursor: "pointer" }}>+</button>
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", color: "#5d4037", fontWeight: "600", marginBottom: "8px" }}>Voucher Expiration:</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                      <select
                        value={isTestMode ? "5min" : (expirationDays || 30)}
                        onChange={(e) => handleExpirationChange(e.target.value)}
                        style={{ padding: "10px 16px", borderRadius: "8px", border: "2px solid #a67c52", backgroundColor: "white", fontSize: "14px", cursor: "pointer", flex: 1, minWidth: "150px" }}
                      >
                        <option value="5min">5 minutes (TEST MODE — quick expiry)</option>
                        <option value="7">7 days</option>
                        <option value="14">14 days</option>
                        <option value="30">30 days (1 month)</option>
                        <option value="60">60 days (2 months)</option>
                        <option value="90">90 days (3 months)</option>
                        <option value="180">180 days (6 months)</option>
                        <option value="365">365 days (1 year)</option>
                      </select>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        {isTestMode
                          ? `Expires in 5 minutes at ${new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()}`
                          : `Expires on ${new Date(Date.now() + (expirationDays || 30) * 24 * 60 * 60 * 1000).toLocaleDateString()}`}
                      </div>
                    </div>
                    <p style={{ fontSize: "12px", color: isTestMode ? "#ff9800" : "#a67c52", margin: 0 }}>
                      {isTestMode
                        ? "TEST MODE: this voucher will expire in 5 minutes. Use this to test the expiration logic."
                        : "After this date, the voucher will expire and the business will no longer be able to redeem it."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleConfirmVoucher}
                  disabled={!voucherType || savingVoucher}
                  style={{
                    width: "100%", padding: "16px",
                    backgroundColor: (!voucherType || savingVoucher) ? "#ccc" : "#a67c52",
                    color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "600",
                    cursor: (!voucherType || savingVoucher) ? "not-allowed" : "pointer", transition: "all 0.3s ease",
                  }}
                >
                  {savingVoucher ? "Saving Voucher..." : "Generate Voucher"}
                </button>
              </>
            ) : (
              <>
                <div style={{
                  backgroundColor: generatedVoucher.isTestMode ? "#fff3e0" : "#e8f5e9",
                  border: `2px solid ${generatedVoucher.isTestMode ? "#ff9800" : "#4caf50"}`,
                  borderRadius: "12px", padding: "24px", marginBottom: "24px", textAlign: "center",
                }}>
                  <CheckCircle size={48} style={{ color: generatedVoucher.isTestMode ? "#ff9800" : "#4caf50", marginBottom: "16px" }} />
                  <h3 style={{ color: generatedVoucher.isTestMode ? "#e65100" : "#2e7d32", marginBottom: "8px" }}>
                    {generatedVoucher.isTestMode ? "TEST Voucher Generated" : "Voucher Generated Successfully"}
                  </h3>
                  <p style={{ color: "#3e2723", marginBottom: "16px" }}>
                    {getVoucherTypeName(generatedVoucher.type)} • {generatedVoucher.seats} seat{generatedVoucher.seats > 1 ? 's' : ''}
                  </p>
                  <div style={{ background: "#fff", border: "2px dashed #a67c52", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: "1.2rem", fontWeight: "bold", color: "#3e2723", marginBottom: "8px" }}>
                      {generatedVoucher.code}
                    </div>
                    <button onClick={handleCopyCode} style={{ background: "none", border: "none", color: "#a67c52", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", margin: "0 auto" }}>
                      <Copy size={16} />{copied ? "Copied!" : "Copy Code"}
                    </button>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: generatedVoucher.isTestMode ? "#e65100" : "#666", fontWeight: generatedVoucher.isTestMode ? "bold" : "normal" }}>
                    Expires: {new Date(generatedVoucher.expiresAt).toLocaleString()}
                  </p>
                  {generatedVoucher.isTestMode && (
                    <p style={{ fontSize: "0.8rem", color: "#ff9800", marginTop: "8px", fontWeight: "bold" }}>
                      TEST MODE: this voucher will expire in 5 minutes.
                    </p>
                  )}
                </div>

                <div style={{ backgroundColor: "#f0f7ff", border: "1px solid #a67c52", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
                  <p style={{ margin: 0, color: "#3e2723", fontSize: "0.9rem" }}>
                    <strong>Instructions:</strong> Share this code with the business. They can redeem it in:
                  </p>
                  <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px", color: "#5d4037" }}>
                    <li><strong>Subscription Page</strong> — for premium access</li>
                    <li><strong>Growth Tools → My Purchases</strong> — to view all received vouchers</li>
                  </ul>
                  <p style={{ margin: "12px 0 0 0", color: generatedVoucher.isTestMode ? "#ff9800" : "#a67c52", fontSize: "0.85rem", fontWeight: generatedVoucher.isTestMode ? "bold" : "normal" }}>
                    The business must redeem this voucher before {new Date(generatedVoucher.expiresAt).toLocaleString()} or it will expire.
                    {generatedVoucher.isTestMode && " This is a TEST voucher — it expires in 5 minutes."}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowVoucherModal(false)
                    setGeneratedVoucher(null)
                    setVoucherType("")
                    setExpirationDays(30)
                    setExpirationMinutes(null)
                    setIsTestMode(false)
                  }}
                  style={{ width: "100%", padding: "16px", backgroundColor: "#5d4037", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @media (max-width: 1400px) { .main-container { padding: 30px; } }
        @media (max-width: 1024px) { .main-container { padding: 25px; } }
        @media (max-width: 768px) { .main-container { margin-left: 0 !important; padding: 20px; } }
      `}</style>
    </div>
  )
}

export default MyCohorts