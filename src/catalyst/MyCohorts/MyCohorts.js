"use client"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Trophy, Users, TrendingUp, Building, MapPin, DollarSign, Calendar, Eye, Wrench, Loader, RefreshCw, X, BarChart3, ChevronDown, FileText, Ticket, Copy, CheckCircle, MoreVertical, AlertCircle, Info } from "lucide-react"
import { collection, query, where, getDocs, doc, getDoc, orderBy, addDoc, updateDoc } from "firebase/firestore"
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

const formatCurrency = (amount) => {
  if (!amount || amount === "Not specified") return "Not specified"
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
  // Firestore Timestamps have a .toDate() method; plain strings/numbers go
  // straight to the Date constructor.
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
// "Active" and "Exit". The spec's fuller lifecycle (Onboarding, At Risk,
// Graduation Pending, Graduated, Withdrawn, etc.) needs those states to
// actually exist on the record before we can display them truthfully.
// This mapping normalizes what exists today into cleaner labels without
// inventing states the data can't support yet.
const STATUS_META = {
  "Active Support": { label: "Active", color: "#4caf50", group: "active" },
  "Active": { label: "Active", color: "#4caf50", group: "active" },
  "Exit": { label: "Exited", color: "#9e9e9e", group: "exited" },
  "Exit Support": { label: "Exited", color: "#9e9e9e", group: "exited" },
}

const getStatusMeta = (status) => STATUS_META[status] || { label: status || "Unknown", color: "#7d5a50", group: "active" }

// ─── "Attention Required" heuristic ─────────────────────────────────────────
// TODO(backend): a real implementation needs reporting-overdue flags,
// last-activity timestamps, and milestone due dates on the record. Until
// those fields exist, we flag records with missing/invalid core data as a
// conservative, honest stand-in — this is a data-quality signal, not a
// programme-health signal, and is labeled as such in the UI.
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

// Small helper so popups/tooltips render straight to <body>, avoiding
// clipping or mispositioning from transformed ancestors.
const Portal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

// ─── Voucher info hover tooltip ──────────────────────────────────────────────
// This replaces the always-visible banner. It only appears while hovering
// the "Generate Voucher" action, anchored to that element.
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
        <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
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

  // New: quick-filter counters, density, row menu, voucher hover tooltip
  const [activeFilter, setActiveFilter] = useState("all") // all | active | attention | exited
  const [density, setDensity] = useState("comfortable")
  const [rowMenu, setRowMenu] = useState(null) // { cohort, position }
  const [voucherTooltip, setVoucherTooltip] = useState(null) // { rect }

  useEffect(() => {
    fetchCohorts()
  }, [])

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

            return {
              id: docSnap.id,
              smeId,
              smeName: `${smeName}${programSuffix}`,
              dealAmount: fundingRequired,
              dealType: equityOffered,
              completionDate: data.updatedAt || data.createdAt || null, // no fabricated "now" fallback — let formatDate show "Not recorded"
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
              programIndex,
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

  // ─── Derived: counters + filtering ─────────────────────────────────────────
  const counts = {
    total: cohorts.length,
    active: cohorts.filter(c => getStatusMeta(c.currentStatus).group === "active" && !needsAttention(c)).length,
    attention: cohorts.filter(c => getStatusMeta(c.currentStatus).group === "active" && needsAttention(c)).length,
    exited: cohorts.filter(c => getStatusMeta(c.currentStatus).group === "exited").length,
  }

  const filteredCohorts = cohorts.filter((c) => {
    const meta = getStatusMeta(c.currentStatus)
    if (activeFilter === "active") return meta.group === "active" && !needsAttention(c)
    if (activeFilter === "attention") return meta.group === "active" && needsAttention(c)
    if (activeFilter === "exited") return meta.group === "exited"
    return true
  })

  const rowPad = density === "compact" ? "py-2.5 px-3" : "py-3.5 px-4"

  const openRowMenu = (cohort, event) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    const menuWidth = 220
    let x = rect.right - menuWidth
    let y = rect.bottom + 6
    if (x < 12) x = 12
    if (y + 260 > window.innerHeight - 12) y = rect.top - 260 - 6
    setRowMenu({ cohort, position: { x, y } })
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

  return (
    <div className="min-h-screen box-border transition-[margin-left] duration-300">
      <div className="mx-auto px-8 w-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-[#4a352f] mb-1">My Cohorts</h1>
            <p className="text-[#7d5a50] text-base m-0">
              Manage active, completed and exited businesses across your programmes.
            </p>
          </div>

          <div className="flex items-center gap-2">
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

        {/* Summary counters — also act as quick filters */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 mb-6">
          {[
            { key: "all", label: "Total Businesses", value: counts.total, color: "#a67c52" },
            { key: "active", label: "Active", value: counts.active, color: "#4caf50" },
            { key: "attention", label: "Attention Required", value: counts.attention, color: "#e65100" },
            { key: "exited", label: "Exited", value: counts.exited, color: "#9e9e9e" },
          ].map(({ key, label, value, color }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(activeFilter === key ? "all" : key)}
              className={`text-left bg-white p-4 rounded-xl shadow-md border-2 transition-all ${activeFilter === key ? 'ring-2 ring-offset-1' : ''}`}
              style={{ borderColor: activeFilter === key ? color : "#e6d7c3" }}
            >
              <h3 className="text-xs font-semibold text-[#7d5a50] m-0 mb-1 uppercase tracking-wide">{label}</h3>
              <p className="text-2xl font-bold m-0" style={{ color }}>{value}</p>
            </button>
          ))}
        </div>
        {/* TODO(backend): a "Graduated" counter/status needs a real graduation
            milestone on the record; omitted rather than faked. */}

        {activeFilter !== "all" && (
          <div className="mb-4">
            <button onClick={() => setActiveFilter("all")} className="text-xs text-[#7d5a50] underline hover:text-[#4a352f]">
              Clear filter
            </button>
          </div>
        )}

        {filteredCohorts.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden w-full border border-[#e6d7c3]">
            <div className="p-4 border-b-2 border-[#e6d7c3] bg-[#f5f0e1] flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[#4a352f] m-0">Cohort Businesses</h2>
              <span className="text-xs text-[#7d5a50] bg-[#a67c52]/15 px-3 py-1.5 rounded-md font-semibold">
                {filteredCohorts.length} {filteredCohorts.length === 1 ? 'business' : 'businesses'}
              </span>
            </div>

            {/* Sticky header + sticky first column: wrapper needs its own
                bounded, scrolling area for `sticky top-0` to work. */}
            <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#4a352f]">
                    <th className={`${rowPad} text-left font-semibold text-white text-xs uppercase tracking-wide whitespace-nowrap sticky top-0 left-0 z-30`} style={{ backgroundColor: '#4a352f' }}>
                      Business
                    </th>
                    <th className={`${rowPad} text-left font-semibold text-white text-xs uppercase tracking-wide whitespace-nowrap sticky top-0 z-20`} style={{ backgroundColor: '#4a352f' }}>
                      Support Value
                    </th>
                    <th className={`${rowPad} text-left font-semibold text-white text-xs uppercase tracking-wide whitespace-nowrap sticky top-0 z-20`} style={{ backgroundColor: '#4a352f' }}>
                      Start Date
                    </th>
                    <th className={`${rowPad} text-left font-semibold text-white text-xs uppercase tracking-wide whitespace-nowrap sticky top-0 z-20`} style={{ backgroundColor: '#4a352f' }}>
                      Status
                    </th>
                    <th className={`${rowPad} text-center font-semibold text-white text-xs uppercase tracking-wide whitespace-nowrap sticky top-0 z-20`} style={{ backgroundColor: '#4a352f' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCohorts.map((cohort) => {
                    const meta = getStatusMeta(cohort.currentStatus)
                    const flagged = meta.group === "active" && needsAttention(cohort)

                    return (
                      <tr key={cohort.id} className="border-b border-[#f0e6d9] last:border-b-0 hover:bg-[#faf7f2] transition-colors duration-200">
                        <td className={`${rowPad} sticky left-0 bg-white z-10 border-r border-[#f0e6d9]`} style={{ minWidth: '220px' }}>
                          <button
                            onClick={() => handleViewDetails(cohort)}
                            className="text-left font-semibold text-[#4a352f] hover:text-[#7d5a50] transition-colors block"
                            style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}
                          >
                            {cohort.smeName}
                          </button>
                          <div className="text-xs text-[#7d5a50] mt-0.5">
                            {cohort.sector} · {cohort.location}
                          </div>
                        </td>

                        <td className={`${rowPad}`} style={{ minWidth: '130px' }}>
                          <span className="font-semibold text-[#4a352f]">{formatCurrency(cohort.dealAmount)}</span>
                        </td>

                        <td className={`${rowPad}`} style={{ minWidth: '120px' }}>
                          <span className="text-[#5d4037]">{formatDate(cohort.completionDate)}</span>
                        </td>

                        <td className={`${rowPad}`} style={{ minWidth: '180px' }}>
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

                        <td className={`${rowPad} text-center`} style={{ minWidth: '160px' }}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleViewGrowthSuite(cohort)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:shadow-md whitespace-nowrap"
                              style={{ backgroundColor: "#a67c52" }}
                            >
                              View Progress
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center p-[60px_20px] bg-white rounded-2xl shadow-md border border-[#e6d7c3] w-full">
            <h3 className="text-2xl font-semibold text-[#4a352f] mb-3">
              {cohorts.length === 0 ? "No businesses in the cohort" : "No businesses match the selected filters"}
            </h3>
            <p className="text-[#7d5a50] text-base max-w-[500px] mx-auto">
              {cohorts.length === 0
                ? <>No businesses have entered a programme yet. Businesses will appear here once support is approved and they reach an active stage.</>
                : <>Try clearing the current filter to see all cohort businesses.</>}
            </p>
          </div>
        )}
      </div>

      {/* ─── Row secondary-action menu (⋮) ─────────────────────────────────── */}
      {rowMenu && (
        <Portal>
          <div className="fixed inset-0 z-[1090]" onClick={() => { setRowMenu(null); setVoucherTooltip(null) }} />
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
              <TrendingUp size={12} /> Open Growth Suite
            </button>
            <button
              onClick={() => { handleViewDocuments(rowMenu.cohort); setRowMenu(null) }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <FileText size={12} /> View Documents
            </button>
            {/* Generate Voucher — hover shows the info tooltip instead of an
                always-visible banner elsewhere on the page. */}
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
              onClick={() => handleViewDetails(rowMenu.cohort)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
            >
              <Eye size={12} /> View Summary
            </button>
          </div>
        </Portal>
      )}

      {voucherTooltip && <VoucherInfoTooltip anchorRect={voucherTooltip.rect} />}

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