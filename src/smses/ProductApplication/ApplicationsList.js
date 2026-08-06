"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import {
  Eye,
  FileText,
  Package,
  Calendar,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Hash,
  Table2,
  X,
  Info,
  MoreVertical,
  Send,
  ChevronDown,
} from "lucide-react"
import { deriveAppId } from "../hooks/useMatches"

/**
 * ApplicationsList — product / service requests.
 *
 * The inline supplier panel is gone. Matches are read on the Supplier Matches
 * table instead, scoped to whichever application you came from, so there's one
 * place to look rather than two.
 *
 * Props:
 * - onViewSummary: (applicationId, applicationData) => void
 * - onEditApplication: (applicationId) => void
 * - onCreateNew: () => void
 * - onNavigateToMatches: (applicationId, matchRange) => void   optional; wins over the route
 * - onSubmitApplication: (applicationId, applicationData) => void  optional; without
 *   it this component writes status: "submitted" itself
 * - embedded: boolean
 */

/* ⚠️ CONFIRM THIS PATH — set it to whatever route renders <SupplierTable />.
   The advisor list uses /find-advisors, the intern list /intern-matches-page;
   this is the supplier equivalent. */
const MATCHES_ROUTE = "/supplier-matches"

/* Both events are string literals rather than imports from the supplier table,
   so the two files can't form an import cycle. They must match the constants
   exported there: SUPPLIER_APPLICATION_FILTER_EVENT and
   SUPPLIER_MATCH_RANGE_EVENT. */
const SUPPLIER_APPLICATION_FILTER_EVENT = "supplier-application-filter"
const SUPPLIER_MATCH_RANGE_EVENT = "supplier-match-range-filter"

/* The bands offered on each row's Matches cell.

   No counts here, unlike the advisor, funding and intern lists. Those read a
   stored match collection; suppliers are scored in the browser when the match
   table opens, against whichever request is in scope — there is no per-request
   score sitting in Firestore to count. So the picker chooses which band to
   open, and the count appears on the table itself. */
const MATCH_BANDS = [
  { key: "all", label: "All matches", short: "All", range: [0, 100] },
  { key: "above75", label: "Above 75%", short: ">75%", range: [75, 100] },
  { key: "above50", label: "Above 50%", short: ">50%", range: [50, 100] },
  { key: "below50", label: "Below 50%", short: "<50%", range: [0, 49] },
]
const bandOf = (key) => MATCH_BANDS.find((b) => b.key === key) || MATCH_BANDS[0]

/* Column explanations, same idea as the Supplier Matches table: an i beside
   each header, portaled to <body> so nothing clips it. */
const COLUMN_TOOLTIPS = {
  appId: "The short id for this request. Hover it in the row to see the full document id.",
  application: "What you're asking for, taken from the purpose you wrote, with the full text underneath.",
  category: "The primary category this request falls under.",
  budget: "The budget band you set for this request. Suppliers are scored partly on whether they fit inside it.",
  matches:
    "Pick a score band, then press the eye to open the Supplier Matches table with that band applied. Suppliers are scored when the table opens, so the counts appear there.",
  lastUpdated: "When you last saved a change to this request.",
  status: "Draft while sections are still incomplete, Ready once every section is done, Submitted after you send it.",
  actions: "Open the quick actions menu to view matches, view the application, submit it, or delete it.",
}

const Portal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

/* ─── Column header info tooltip ─────────────────────────────────────────── */
const HeaderInfoTooltip = ({ text }) => {
  const [rect, setRect] = useState(null)
  if (!text) return null
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", cursor: "help" }}
      onMouseEnter={(e) => setRect(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setRect(null)}
    >
      <Info size={12} style={{ color: "#d9c7b8" }} />
      {rect && (
        <Portal>
          <div
            style={{
              position: "fixed",
              zIndex: 1200,
              top: rect.bottom + 8,
              left: Math.min(Math.max(rect.left - 100, 12), window.innerWidth - 244),
              width: 232,
              background: "#4a352f",
              color: "#faf7f2",
              fontSize: 11.5,
              lineHeight: 1.5,
              fontWeight: 400,
              textTransform: "none",
              letterSpacing: 0,
              borderRadius: 10,
              padding: "9px 12px",
              boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
              pointerEvents: "none",
            }}
          >
            {text}
          </div>
        </Portal>
      )}
    </span>
  )
}

const ApplicationsList = ({
  onViewSummary,
  onEditApplication,
  onCreateNew,
  onNavigateToMatches,
  onSubmitApplication,
  embedded = false,
}) => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [submittingId, setSubmittingId] = useState(null)
  const [navNotice, setNavNotice] = useState(null)

  /* applicationId -> band key. Defaults to "all". */
  const [rowBand, setRowBand] = useState({})

  /* { app, rect } for the quick actions popover. */
  const [quickActions, setQuickActions] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchApplications(user.uid)
      else { setLoading(false); setError("Please log in") }
    })
    return () => unsubscribe()
  }, [])

  const fetchApplications = async (userId) => {
    try {
      setLoading(true); setError(null)
      try {
        const q = query(collection(db, "productApplications"), where("userId", "==", userId), orderBy("lastUpdated", "desc"))
        const snapshot = await getDocs(q)
        const apps = []; snapshot.forEach((d) => apps.push(formatAppData(d.id, d.data())))
        setApplications(apps)
      } catch {
        const q = query(collection(db, "productApplications"), where("userId", "==", userId))
        const snapshot = await getDocs(q)
        const apps = []; snapshot.forEach((d) => apps.push(formatAppData(d.id, d.data())))
        apps.sort((a, b) => (b.lastUpdatedTimestamp || 0) - (a.lastUpdatedTimestamp || 0))
        setApplications(apps)
      }
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const formatAppData = (docId, data) => {
    let lastUpdatedFormatted = "N/A", lastUpdatedTimestamp = 0
    if (data.lastUpdated) {
      try {
        const date = data.lastUpdated.toDate ? data.lastUpdated.toDate() : new Date(data.lastUpdated)
        lastUpdatedTimestamp = date.getTime()
        lastUpdatedFormatted = date.toLocaleDateString("en-ZA", { year:"numeric", month:"short", day:"numeric" })
      } catch {}
    }
    const mp = data.matchingPreferences || {}, ro = data.requestOverview || {}
    const categories = ro.categories || data.categories || []
    const primaryCategory = categories[0] || "Uncategorized"
    const purpose = ro.purpose || data.purpose || ""
    const completedSections = data.completedSections || {}
    const sectionsArr = Object.values(completedSections)
    const isComplete = sectionsArr.length > 0 && sectionsArr.every((v) => v === true)
    const fmt = (v) => { if (!v) return null; const n = parseInt(v.toString().replace(/[^\d]/g,"")); if (isNaN(n)) return null; if (n>=1000000) return `R ${(n/1000000).toFixed(1)}M`; if (n>=1000) return `R ${(n/1000).toFixed(0)}K`; return `R ${n.toLocaleString()}` }
    const minFmt = fmt(mp.minBudget), maxFmt = fmt(mp.maxBudget)
    let budgetDisplay = "Not specified"
    if (minFmt && maxFmt) budgetDisplay = `${minFmt} – ${maxFmt}`
    else if (minFmt) budgetDisplay = `From ${minFmt}`
    else if (maxFmt) budgetDisplay = `Up to ${maxFmt}`
    let name = "Product Request"
    if (purpose?.trim()) name = purpose.trim().split(/\s+/).slice(0, 5).join(" ")
    else if (primaryCategory !== "Uncategorized") name = `${primaryCategory} Request`
    return { id:docId, appId: deriveAppId(docId), name, primaryCategory, purposePreview: purpose, budgetDisplay, lastUpdatedFormatted, lastUpdatedTimestamp, isComplete, status: data.status || (isComplete ? "complete" : "draft") }
  }

  /* ─── Actions ───────────────────────────────────────────────────────── */
  const handleDelete = async (appId) => {
    try {
      setDeleting(true)
      await deleteDoc(doc(db, "productApplications", appId))
      setApplications((p) => p.filter((a) => a.id !== appId))
      setShowDeleteConfirm(null)
      setNavNotice("Application deleted.")
    } catch {
      alert("Failed to delete. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  /* Submit hands off to the shell when it wants to run its own validation or
     flow; otherwise the status is written here so the badge updates. */
  const handleSubmit = async (app) => {
    if (typeof onSubmitApplication === "function") {
      onSubmitApplication(app.id, app)
      return
    }
    if (!app.isComplete) {
      setNavNotice("Finish every section before submitting this request.")
      return
    }
    try {
      setSubmittingId(app.id)
      await updateDoc(doc(db, "productApplications", app.id), {
        status: "submitted",
        submittedAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      })
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: "submitted" } : a)))
      setNavNotice(`${app.name} submitted.`)
    } catch (err) {
      console.error("Failed to submit application:", err)
      setNavNotice("Could not submit the request. Please try again.")
    } finally {
      setSubmittingId(null)
    }
  }

  /* Open the Supplier Matches table scoped to this request, narrowed to the
     score band picked on the row.

     Both channels are used on purpose. The query params are what survive the
     route change and are read on mount; the events cover the case where the
     table is already mounted and only needs re-scoping. A shell-provided
     handler wins when there is one, so a tabbed layout can switch panes
     without a route change. */
  const openMatchTable = (appId, bandKey = "all") => {
    const band = bandOf(bandKey)

    window.dispatchEvent(new CustomEvent(SUPPLIER_APPLICATION_FILTER_EVENT, { detail: appId }))
    window.dispatchEvent(new CustomEvent(SUPPLIER_MATCH_RANGE_EVENT, { detail: band.range }))

    if (typeof onNavigateToMatches === "function") {
      onNavigateToMatches(appId, band.range)
      return
    }

    const params = new URLSearchParams({
      applicationId: appId,
      matchMin: String(band.range[0]),
      matchMax: String(band.range[1]),
    })
    navigate(`${MATCHES_ROUTE}?${params.toString()}`)
  }

  const openQuickActions = (app, event) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    setQuickActions((prev) => (prev?.app?.id === app.id ? null : { app, rect }))
  }
  const closeQuickActions = () => setQuickActions(null)

  /* The list is used with either callback depending on the shell, so fall
     back rather than crashing on whichever one wasn't passed. */
  const openApplication = (app) => {
    if (typeof onViewSummary === "function") onViewSummary(app.id, app)
    else if (typeof onEditApplication === "function") onEditApplication(app.id, app)
  }

  const getStatusBadge = (app) => {
    if (app.status === "submitted") return { label:"Submitted", color:"#10b981", bg:"#d1fae5", Icon:CheckCircle }
    if (app.isComplete)             return { label:"Ready",     color:"#f59e0b", bg:"#fef3c7", Icon:AlertCircle }
    return                                 { label:"Draft",     color:"#6b7280", bg:"#f3f4f6", Icon:Clock }
  }

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
      <div style={{ width:44, height:44, border:"3px solid rgba(166,124,82,0.15)", borderTopColor:"#a67c52", borderRadius:"50%", animation:"al-spin 0.8s linear infinite" }} />
      <p style={{ marginTop:14, color:"#7d5a50", fontSize:15 }}>Loading your applications…</p>
      <style>{`@keyframes al-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error && applications.length === 0) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", padding:40 }}>
      <div style={{ fontSize:44, marginBottom:16 }}>⚠️</div>
      <h3 style={{ color:"#4a352f", marginBottom:8 }}>Error Loading Applications</h3>
      <p style={{ color:"#dc2626", marginBottom:20 }}>{error}</p>
      <button onClick={() => auth.currentUser && fetchApplications(auth.currentUser.uid)}
        style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 22px", background:"linear-gradient(135deg,#a67c52,#7d5a50)", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" }}>
        <RefreshCw size={15} /> Retry
      </button>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes al-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes al-spin   { to{transform:rotate(360deg)} }

        .al-wrap {
          width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch;
          border-radius:14px; border:1px solid rgba(200,182,166,0.3);
          box-shadow:0 10px 26px rgba(74,53,47,0.08);
          background:linear-gradient(135deg,rgba(250,247,242,0.97),rgba(245,240,225,0.97));
          animation:al-fadein 0.35s ease-out;
        }

        /* min-width prevents columns from crushing when sidebar is open */
        .al-tbl { width:100%; min-width:1020px; border-collapse:collapse; table-layout:fixed; }

        .al-appid { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; background:linear-gradient(135deg,#5d4037,#4a332a); color:#FAF7F2; border-radius:999px; font-size:10.5px; font-weight:700; letter-spacing:0.5px; white-space:nowrap; font-family:'SF Mono','Monaco','Consolas',monospace; }

        /* 8 columns: AppID + Application + Category + Budget + Matches + Updated + Status + Actions */
        .al-tbl col.c0 { width:9%;  }   /* AppID        */
        .al-tbl col.c1 { width:22%; }   /* Application  */
        .al-tbl col.c2 { width:11%; }   /* Category     */
        .al-tbl col.c3 { width:11%; }   /* Budget       */
        .al-tbl col.c4 { width:19%; }   /* Matches      */
        .al-tbl col.c5 { width:11%; }   /* Last updated */
        .al-tbl col.c6 { width:9%;  }   /* Status       */
        .al-tbl col.c7 { width:8%;  }   /* Actions      */

        /* Same header treatment as the Supplier Matches table: white label on
           the dark bar, so the two tables read as one product. */
        .al-tbl thead th {
          padding:13px 15px; text-align:left;
          font-size:11px; font-weight:700; color:#faf7f2;
          background:#4a352f;
          text-transform:uppercase; letter-spacing:0.55px; white-space:nowrap;
          border-bottom:1px solid rgba(230,215,195,0.35);
        }
        .al-th-row { display:inline-flex; align-items:center; gap:6px; }
        .al-tbl th.r { text-align:center; }
        .al-tbl th.r .al-th-row { justify-content:center; }
        .al-tbl td { padding:12px 15px; vertical-align:middle; overflow:hidden; }
        .al-tbl tbody tr { border-bottom:1px solid rgba(200,182,166,0.15); transition:background 0.15s; }
        .al-tbl tbody tr:last-child { border-bottom:none; }
        .al-tbl tbody tr:hover { background:rgba(166,124,82,0.04); }

        .ell { display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }

        /* Matches cell: band picker + the eye that opens those matches */
        .al-match { display:flex; align-items:center; gap:7px; min-width:0; }
        .al-sel-wrap { position:relative; flex:1 1 auto; min-width:0; }
        .al-sel {
          width:100%; appearance:none; -webkit-appearance:none;
          padding:5px 24px 5px 10px; border-radius:999px;
          border:1px solid rgba(200,182,166,0.55);
          background:rgba(255,255,255,0.85); color:#4a352f;
          font-size:11.5px; font-weight:600; font-family:inherit;
          cursor:pointer; line-height:1.4;
          text-overflow:ellipsis;
        }
        .al-sel:focus-visible { outline:2px solid #a67c52; outline-offset:1px; }
        .al-sel-chev { position:absolute; right:8px; top:50%; transform:translateY(-50%); pointer-events:none; color:#7d5a50; }
        .al-eye {
          display:inline-flex; align-items:center; justify-content:center;
          width:28px; height:28px; flex-shrink:0;
          border-radius:8px; cursor:pointer;
          border:1px solid transparent;
          background:linear-gradient(135deg,#a67c52,#7d5a50); color:#faf7f2;
          box-shadow:0 2px 6px rgba(166,124,82,0.3);
          transition:transform 0.15s, box-shadow 0.15s;
        }
        .al-eye:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(166,124,82,0.45); }

        .al-kebab {
          display:inline-flex; align-items:center; justify-content:center;
          width:32px; height:32px; margin:0 auto;
          border-radius:9px; cursor:pointer;
          border:1px solid rgba(200,182,166,0.5);
          background:rgba(250,247,242,0.9); color:#4a352f;
          transition:transform 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .al-kebab:hover { transform:translateY(-1px); box-shadow:0 3px 8px rgba(0,0,0,0.12); background:#fff; }

        .al-menu-item {
          width:100%; display:flex; align-items:center; gap:9px;
          padding:10px 14px; background:none; border:none;
          font-size:12.5px; font-family:inherit; color:#4a352f;
          text-align:left; cursor:pointer;
        }
        .al-menu-item:hover:not(:disabled) { background:#faf7f2; }
        .al-menu-item:disabled { color:#b9aa9c; cursor:not-allowed; }
        .al-menu-item.danger { color:#dc2626; }
      `}</style>

      <div style={{ width:"100%", boxSizing:"border-box", padding: embedded ? "14px" : "22px", fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

        {/* HEADER */}
        <div style={{ background:"linear-gradient(135deg,rgba(250,247,242,0.97),rgba(245,240,225,0.97))", borderRadius:14, padding:"16px 20px", marginBottom:18, border:"1px solid rgba(200,182,166,0.3)", boxShadow:"0 8px 22px rgba(74,53,47,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:14, flexWrap:"wrap" }}>
          <div>
            <h1 style={{ background:"linear-gradient(135deg,#4a352f,#7d5a50)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontSize:"clamp(20px,3vw,30px)", fontWeight:800, margin:"0 0 5px", letterSpacing:"-0.02em" }}>My Applications</h1>
            <p style={{ color:"#7d5a50", fontSize:13, margin:0, fontWeight:500 }}>
              Product &amp; Service Requests &bull; {applications.length} {applications.length === 1 ? "Application" : "Applications"}
            </p>
          </div>
          <button onClick={onCreateNew} style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 20px", background:"linear-gradient(135deg,#a67c52,#7d5a50)", color:"#faf7f2", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:"0 4px 14px rgba(166,124,82,0.3)", transition:"all 0.22s" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 7px 20px rgba(166,124,82,0.4)" }}
            onMouseLeave={(e) => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 4px 14px rgba(166,124,82,0.3)" }}
          >
            <Plus size={16} /> Create New Application
          </button>
        </div>

        {navNotice && (
          <div style={{ marginBottom:14, padding:"12px 16px", borderRadius:12, background:"#faf7f2", border:"1px solid #e6d7c3", color:"#4a352f", fontSize:13, display:"flex", justifyContent:"space-between", gap:12 }}>
            <span>{navNotice}</span>
            <button onClick={() => setNavNotice(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#7d5a50" }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* EMPTY */}
        {applications.length === 0 ? (
          <div style={{ background:"linear-gradient(135deg,rgba(250,247,242,0.97),rgba(245,240,225,0.97))", borderRadius:14, padding:"64px 32px", textAlign:"center", border:"1px solid rgba(200,182,166,0.3)", boxShadow:"0 10px 24px rgba(74,53,47,0.07)" }}>
            <FileText size={42} style={{ color:"#c8b6a6", margin:"0 auto 12px" }} />
            <h3 style={{ color:"#4a352f", marginBottom:6, fontSize:18, fontWeight:700 }}>No Applications Yet</h3>
            <p style={{ color:"#6b7280", marginBottom:20 }}>Create your first product/service request to get started.</p>
            <button onClick={onCreateNew} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 24px", background:"linear-gradient(135deg,#a67c52,#7d5a50)", color:"#faf7f2", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:"0 4px 14px rgba(166,124,82,0.3)" }}>
              <Plus size={16} /> Create Application
            </button>
          </div>
        ) : (
          <div className="al-wrap">
            <table className="al-tbl">
              <colgroup>
                <col className="c0"/><col className="c1"/><col className="c2"/>
                <col className="c3"/><col className="c4"/><col className="c5"/>
                <col className="c6"/><col className="c7"/>
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <span className="al-th-row">
                      AppID <HeaderInfoTooltip text={COLUMN_TOOLTIPS.appId} />
                    </span>
                  </th>
                  <th>
                    <span className="al-th-row">
                      Application <HeaderInfoTooltip text={COLUMN_TOOLTIPS.application} />
                    </span>
                  </th>
                  <th>
                    <span className="al-th-row">
                      Category <HeaderInfoTooltip text={COLUMN_TOOLTIPS.category} />
                    </span>
                  </th>
                  <th>
                    <span className="al-th-row">
                      Budget <HeaderInfoTooltip text={COLUMN_TOOLTIPS.budget} />
                    </span>
                  </th>
                  <th>
                    <span className="al-th-row">
                      Matches <HeaderInfoTooltip text={COLUMN_TOOLTIPS.matches} />
                    </span>
                  </th>
                  <th>
                    <span className="al-th-row">
                      Last Updated <HeaderInfoTooltip text={COLUMN_TOOLTIPS.lastUpdated} />
                    </span>
                  </th>
                  <th>
                    <span className="al-th-row">
                      Status <HeaderInfoTooltip text={COLUMN_TOOLTIPS.status} />
                    </span>
                  </th>
                  <th className="r">
                    <span className="al-th-row">
                      Actions <HeaderInfoTooltip text={COLUMN_TOOLTIPS.actions} />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const { label, color, bg, Icon } = getStatusBadge(app)
                  const bandKey = rowBand[app.id] || "all"

                  return (
                    <tr key={app.id}>
                      {/* AppID */}
                      <td>
                        <span className="al-appid" title={`Full application id: ${app.id}`}>
                          <Hash size={10} /> {app.appId}
                        </span>
                      </td>

                      {/* Application */}
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:9, minWidth:0 }}>
                          <div style={{ width:32, height:32, flexShrink:0, background:"rgba(166,124,82,0.1)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Package size={15} color="#a67c52" />
                          </div>
                          <div style={{ minWidth:0, flex:1 }}>
                            <span className="ell" style={{ fontWeight:600, color:"#4a352f", fontSize:13, marginBottom:2 }} title={app.name}>{app.name}</span>
                            <span className="ell" style={{ fontSize:11, color:"#6b7280" }} title={app.purposePreview}>{app.purposePreview}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="ell" style={{ display:"inline-block", maxWidth:"100%", padding:"3px 9px", background:"rgba(166,124,82,0.1)", borderRadius:20, fontSize:11, fontWeight:500, color:"#7d5a50" }} title={app.primaryCategory}>
                          {app.primaryCategory}
                        </span>
                      </td>

                      {/* Budget */}
                      <td>
                        <span className="ell" style={{ fontWeight:600, color:"#4a352f", fontSize:12 }} title={app.budgetDisplay}>{app.budgetDisplay}</span>
                      </td>

                      {/* Matches — pick a score band, then press the eye to open
                          the Supplier Matches table with that band applied. */}
                      <td>
                        <div className="al-match">
                          <span className="al-sel-wrap">
                            <select
                              className="al-sel"
                              value={bandKey}
                              onChange={(e) => setRowBand((prev) => ({ ...prev, [app.id]: e.target.value }))}
                              aria-label={`Match score band for ${app.name}`}
                              title="Choose which matches to open"
                            >
                              {MATCH_BANDS.map((b) => (
                                <option key={b.key} value={b.key}>
                                  {b.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={12} className="al-sel-chev" />
                          </span>
                          <button
                            className="al-eye"
                            onClick={() => openMatchTable(app.id, bandKey)}
                            aria-label={`Open ${bandOf(bandKey).label.toLowerCase()} for ${app.name}`}
                            title={`Open the Supplier Matches table — suppliers ${bandOf(bandKey).short} for this request`}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:5, color:"#6b7280", fontSize:11, whiteSpace:"nowrap" }}>
                          <Calendar size={12} style={{ flexShrink:0 }} /> {app.lastUpdatedFormatted}
                        </div>
                      </td>

                      {/* Status — unchanged */}
                      <td>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", background:bg, color, borderRadius:20, fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>
                          <Icon size={10} /> {label}
                        </span>
                      </td>

                      {/* Actions — one quick actions menu, nothing else. */}
                      <td style={{ textAlign:"center" }}>
                        <button
                          className="al-kebab"
                          onClick={(e) => openQuickActions(app, e)}
                          aria-label={`Quick actions for ${app.name}`}
                          aria-haspopup="menu"
                          aria-expanded={quickActions?.app?.id === app.id}
                          title="Quick actions"
                        >
                          <MoreVertical size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK ACTIONS MENU */}
      {quickActions &&
        (() => {
          const app = quickActions.app
          const rect = quickActions.rect
          const menuWidth = 232
          const menuHeight = 208
          let left = rect.right - menuWidth
          left = Math.min(Math.max(left, 12), window.innerWidth - menuWidth - 12)
          const openUpward = rect.bottom + menuHeight > window.innerHeight - 12
          const top = openUpward ? undefined : rect.bottom + 8
          const bottom = openUpward ? window.innerHeight - rect.top + 8 : undefined
          const bandKey = rowBand[app.id] || "all"
          const alreadySubmitted = app.status === "submitted"

          return (
            <Portal>
              <div style={{ position: "fixed", inset: 0, zIndex: 1100 }} onClick={closeQuickActions} />
              <div
                role="menu"
                style={{
                  position: "fixed",
                  left,
                  top,
                  bottom,
                  width: menuWidth,
                  zIndex: 1101,
                  background: "#fff",
                  borderRadius: 14,
                  border: "1px solid #e6d7c3",
                  boxShadow: "0 20px 44px rgba(74,53,47,0.22)",
                  overflow: "hidden",
                  paddingBottom: 4,
                  fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderBottom: "1px solid #e6d7c3",
                  }}
                >
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "#4a352f" }}>Quick actions</span>
                  <button
                    onClick={closeQuickActions}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#7d5a50", display: "flex" }}
                    aria-label="Close quick actions"
                  >
                    <X size={14} />
                  </button>
                </div>

                <button
                  className="al-menu-item"
                  role="menuitem"
                  onClick={() => {
                    closeQuickActions()
                    openMatchTable(app.id, bandKey)
                  }}
                >
                  <Table2 size={14} /> View matches
                </button>

                <button
                  className="al-menu-item"
                  role="menuitem"
                  onClick={() => {
                    closeQuickActions()
                    openApplication(app)
                  }}
                >
                  <Eye size={14} /> View application
                </button>

                <button
                  className="al-menu-item"
                  role="menuitem"
                  disabled={alreadySubmitted || submittingId === app.id}
                  title={
                    alreadySubmitted
                      ? "This request has already been submitted"
                      : app.isComplete
                        ? "Send this request"
                        : "Finish every section first"
                  }
                  onClick={() => {
                    closeQuickActions()
                    handleSubmit(app)
                  }}
                >
                  <Send size={14} />{" "}
                  {alreadySubmitted ? "Already submitted" : submittingId === app.id ? "Submitting…" : "Submit application"}
                </button>

                <div style={{ borderTop: "1px solid #e6d7c3", margin: "4px 0" }} />

                <button
                  className="al-menu-item danger"
                  role="menuitem"
                  onClick={() => {
                    closeQuickActions()
                    setShowDeleteConfirm(app.id)
                  }}
                >
                  <Trash2 size={14} /> Delete application
                </button>
              </div>
            </Portal>
          )
        })()}

      {/* DELETE MODAL */}
      {showDeleteConfirm && (
        <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:20, backdropFilter:"blur(4px)" }}
          onClick={() => setShowDeleteConfirm(null)}>
          <div style={{ background:"linear-gradient(135deg,rgba(250,247,242,0.99),rgba(245,240,225,0.99))", borderRadius:16, padding:28, maxWidth:360, width:"100%", boxShadow:"0 28px 56px rgba(0,0,0,0.18)", border:"1px solid rgba(200,182,166,0.3)" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ width:52, height:52, margin:"0 auto 16px", background:"#fee2e2", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Trash2 size={26} color="#dc2626" />
            </div>
            <h3 style={{ textAlign:"center", fontSize:18, fontWeight:700, color:"#4a352f", marginBottom:8 }}>Delete Application?</h3>
            <p style={{ textAlign:"center", color:"#6b7280", marginBottom:20, lineHeight:1.6 }}>This action cannot be undone.</p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ flex:1, padding:10, background:"#f3f4f6", color:"#4a352f", border:"none", borderRadius:9, fontSize:14, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} disabled={deleting} style={{ flex:1, padding:10, background:"#dc2626", color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:600, cursor:"pointer", opacity: deleting ? 0.7 : 1 }}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ApplicationsList