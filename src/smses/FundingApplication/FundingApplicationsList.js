"use client"

import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  addDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import {
  Eye,
  Calendar,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Hash,
  DollarSign,
  Table2,
  X,
  Info,
  MoreVertical,
  Send,
  ChevronDown,
} from "lucide-react"

/**
 * FundingApplicationsList
 *
 * The inline "show matches" panel is gone — funder matches are read on the
 * Funding Matches table instead, so there's one place to look rather than two.
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

/* ⚠️ CONFIRM THIS PATH — set it to whatever route renders <FundingTable />.
   The advisor list uses /find-advisors and the intern list
   /intern-matches-page; this is the funding equivalent. */
const MATCHES_ROUTE = "/funding-matches"

/* Both events are string literals rather than imports from the funding table,
   so the two files can't form an import cycle. They must match the constants
   exported there: FUNDING_APPLICATION_FILTER_EVENT and
   FUNDING_MATCH_RANGE_EVENT. */
const FUNDING_APPLICATION_FILTER_EVENT = "funding-application-filter"
const FUNDING_MATCH_RANGE_EVENT = "funding-match-range-filter"

/* The bands offered on each row's Matches cell. `test` counts them here;
   `range` is what the Funding Matches table filters on. */
const MATCH_BANDS = [
  { key: "all", label: "All matches", short: "All", range: [0, 100], test: () => true },
  { key: "above75", label: "Above 75%", short: ">75%", range: [75, 100], test: (s) => s >= 75 },
  { key: "above50", label: "Above 50%", short: ">50%", range: [50, 100], test: (s) => s >= 50 },
  { key: "below50", label: "Below 50%", short: "<50%", range: [0, 49], test: (s) => s < 50 },
]
const bandOf = (key) => MATCH_BANDS.find((b) => b.key === key) || MATCH_BANDS[0]

/* Column explanations, same idea as the Funding Matches table: an i beside
   each header, portaled to <body> so nothing clips it. */
const COLUMN_TOOLTIPS = {
  appId: "The short id for this funding request. Hover it in the row to see the full document id.",
  application: "The funding stage you applied for, with the amount requested underneath.",
  type: "The funding instruments you asked for — debt, equity, grant and so on.",
  matches:
    "Funds matched to this application. Pick a score band to see how many fall in it, then press the eye to open those matches in the Funding Matches table.",
  lastUpdated: "When you last saved a change to this application.",
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

const FundingApplicationsList = ({
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

  /* applicationId -> [finalScore, ...]. Scores are kept rather than a single
     count so the row's band picker can answer all four questions without
     going back to Firestore. */
  const [matchScores, setMatchScores] = useState({})

  /* applicationId -> band key. Defaults to "all". */
  const [rowBand, setRowBand] = useState({})

  /* { app, rect } for the quick actions popover. */
  const [quickActions, setQuickActions] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchApplications(user.uid)
      else {
        setLoading(false)
        setError("Please log in")
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchMatchCounts = async (userId) => {
    try {
      /* No status filter and no score floor. It used to require
         status == "matched" and finalScore >= 70, but the match table shows
         every record whatever its stage — so the moment a fund moved to
         "applied" the badge count dropped while the table still listed the
         row, and anything under 70 was invisible here even though it was
         sitting in the table. */
      const q = query(collection(db, "smseFundingMatches"), where("smeId", "==", userId))
      const snapshot = await getDocs(q)
      const scores = {}
      snapshot.forEach((d) => {
        const data = d.data()
        const appId = data.applicationId
        if (!appId) return
        const finalScore = Number(data.finalScore) || 0
        if (!scores[appId]) scores[appId] = []
        scores[appId].push(finalScore)
      })
      setMatchScores(scores)
    } catch (err) {
      console.error("Failed to fetch match counts:", err)
    }
  }

  const fetchApplications = async (userId) => {
    try {
      setLoading(true)
      setError(null)
      let apps = []

      // Check if any apps exist in fundingApplicationsV2
      const qNew = query(collection(db, "fundingApplicationsV2"), where("userId", "==", userId))
      const snapshot = await getDocs(qNew)

      if (snapshot.empty) {
        // If no apps exist in fundingApplicationsV2, check universalProfiles for legacy app
        const upDocRef = doc(db, "universalProfiles", userId)
        const upSnap = await getDoc(upDocRef)
        if (upSnap.exists()) {
          const upData = upSnap.data()
          if (upData.applicationOverview || upData.useOfFunds || upData.completedSections) {
            // Seed the legacy application
            const newAppPayload = {
              userId: userId,
              userEmail: auth.currentUser?.email || "",
              status: upData.status || (upData.applicationSubmitted ? "submitted" : "in_progress"),
              createdAt: serverTimestamp(),
              lastUpdated: serverTimestamp(),
              completedSections: upData.completedSections || {},
            }

            const possibleFields = [
              "applicationOverview", "useOfFunds", "enterpriseReadiness",
              "financialOverview", "guarantees", "growthPotential",
              "socialImpact", "documentUpload", "declarationCommitment"
            ]
            possibleFields.forEach(field => {
              if (upData[field]) {
                newAppPayload[field] = upData[field]
              }
            })

            await addDoc(collection(db, "fundingApplicationsV2"), newAppPayload)

            // Mark universalProfile as seeded so we don't try again
            await setDoc(upDocRef, { legacyFundingSeeded: true }, { merge: true })

            // Re-fetch now that it's seeded
            const snapshotRefreshed = await getDocs(qNew)
            snapshotRefreshed.forEach((d) => apps.push(formatAppData(d.id, d.data())))
          }
        }
      } else {
        snapshot.forEach((d) => apps.push(formatAppData(d.id, d.data())))
        apps.sort((a, b) => (b.lastUpdatedTimestamp || 0) - (a.lastUpdatedTimestamp || 0))
      }

      setApplications(apps)
      await fetchMatchCounts(userId)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatAppData = (docId, data) => {
    let lastUpdatedFormatted = "N/A", lastUpdatedTimestamp = 0
    if (data.lastUpdated) {
      try {
        const date = data.lastUpdated.toDate ? data.lastUpdated.toDate() : new Date(data.lastUpdated)
        lastUpdatedTimestamp = date.getTime()
        lastUpdatedFormatted = date.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
      } catch {}
    }
    const completedSections = data.completedSections || {}
    const sectionsArr = Object.values(completedSections)
    const isComplete = sectionsArr.length > 0 && sectionsArr.every((v) => v === true)

    const useOfFunds = data.useOfFunds || {}
    const amountRequested = useOfFunds.amountRequested || ""
    const applicationOverview = data.applicationOverview || {}
    const fundingStage = applicationOverview.fundingStage || ""
    const applicationType = applicationOverview.applicationType || ""
    const fundingInstruments = useOfFunds.fundingInstruments || []

    return {
      id: docId,
      appId: docId?.slice(-8) || docId,
      name: `Funding${fundingStage ? ` - ${fundingStage}` : ""}`,
      purpose: amountRequested ? `${amountRequested}` : "",
      fundingType: fundingInstruments.length > 0
        ? fundingInstruments.join(", ")
        : applicationType || "",
      lastUpdatedFormatted,
      lastUpdatedTimestamp,
      isComplete,
      status: data.status || (isComplete ? "complete" : "draft"),
    }
  }

  /* ─── Match bands ───────────────────────────────────────────────────── */
  const countInBand = useMemo(
    () => (appId, bandKey) => {
      const scores = matchScores[appId] || []
      return scores.filter(bandOf(bandKey).test).length
    },
    [matchScores],
  )

  const totalMatches = (appId) => (matchScores[appId] || []).length

  /* ─── Actions ───────────────────────────────────────────────────────── */
  const handleDelete = async (appId) => {
    try {
      setDeleting(true)
      await deleteDoc(doc(db, "fundingApplicationsV2", appId))
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
      setNavNotice("Finish every section before submitting this application.")
      return
    }
    try {
      setSubmittingId(app.id)
      await updateDoc(doc(db, "fundingApplicationsV2", app.id), {
        status: "submitted",
        submittedAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      })
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: "submitted" } : a)))
      setNavNotice(`${app.name} submitted. You'll see new fund matches as they come in.`)
    } catch (err) {
      console.error("Failed to submit application:", err)
      setNavNotice("Could not submit the application. Please try again.")
    } finally {
      setSubmittingId(null)
    }
  }

  /* Open the Funding Matches table scoped to this application, narrowed to the
     score band picked on the row.

     Both channels are used on purpose. The query params are what survive the
     route change and are read on mount; the events cover the case where the
     table is already mounted and only needs re-scoping. A shell-provided
     handler wins when there is one, so a tabbed layout can switch panes
     without a route change. */
  const openMatchTable = (appId, bandKey = "all") => {
    const band = bandOf(bandKey)

    window.dispatchEvent(new CustomEvent(FUNDING_APPLICATION_FILTER_EVENT, { detail: appId }))
    window.dispatchEvent(new CustomEvent(FUNDING_MATCH_RANGE_EVENT, { detail: band.range }))

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

  const getStatusBadge = (app) => {
    if (app.status === "submitted") return { label: "Submitted", color: "#10b981", bg: "#d1fae5", Icon: CheckCircle }
    if (app.isComplete) return { label: "Ready", color: "#f59e0b", bg: "#fef3c7", Icon: AlertCircle }
    return { label: "Draft", color: "#6b7280", bg: "#f3f4f6", Icon: Clock }
  }

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ width: 44, height: 44, border: "3px solid rgba(166,124,82,0.15)", borderTopColor: "#a67c52", borderRadius: "50%", animation: "fl-spin 0.8s linear infinite" }} />
      <p style={{ marginTop: 14, color: "#7d5a50", fontSize: 15 }}>Loading your applications…</p>
      <style>{`@keyframes fl-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error && applications.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 40 }}>
      <div style={{ fontSize: 44, marginBottom: 16 }}>⚠️</div>
      <h3 style={{ color: "#4a352f", marginBottom: 8 }}>Error Loading Applications</h3>
      <p style={{ color: "#dc2626", marginBottom: 20 }}>{error}</p>
      <button onClick={() => auth.currentUser && fetchApplications(auth.currentUser.uid)}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", background: "linear-gradient(135deg,#a67c52,#7d5a50)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
        <RefreshCw size={15} /> Retry
      </button>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes fl-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fl-wrap {
          width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch;
          border-radius:14px; border:1px solid rgba(200,182,166,0.3);
          box-shadow:0 10px 26px rgba(74,53,47,0.08);
          background:linear-gradient(135deg,rgba(250,247,242,0.97),rgba(245,240,225,0.97));
          animation:fl-fadein 0.35s ease-out;
        }
        .fl-tbl { width:100%; min-width:960px; border-collapse:collapse; table-layout:fixed; }
        .fl-tbl col.c0 { width:9%;  }
        .fl-tbl col.c1 { width:24%; }
        .fl-tbl col.c2 { width:12%; }
        .fl-tbl col.c3 { width:20%; }
        .fl-tbl col.c4 { width:13%; }
        .fl-tbl col.c5 { width:11%; }
        .fl-tbl col.c6 { width:11%; }

        /* Same header treatment as the Funding Matches table: white label on
           the dark bar, so the two tables read as one product. */
        .fl-tbl thead th {
          padding:13px 15px; text-align:left;
          font-size:11px; font-weight:700; color:#faf7f2;
          background:#4a352f;
          text-transform:uppercase; letter-spacing:0.55px; white-space:nowrap;
          border-bottom:1px solid rgba(230,215,195,0.35);
        }
        .fl-th-row { display:inline-flex; align-items:center; gap:6px; }
        .fl-tbl th.r { text-align:center; }
        .fl-tbl th.r .fl-th-row { justify-content:center; }
        .fl-tbl td { padding:12px 15px; vertical-align:middle; overflow:hidden; }
        .fl-tbl tbody tr { border-bottom:1px solid rgba(200,182,166,0.15); transition:background 0.15s; }
        .fl-tbl tbody tr:last-child { border-bottom:none; }
        .fl-tbl tbody tr:hover { background:rgba(166,124,82,0.04); }
        .ell { display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
        .fl-appid { display:inline-flex;align-items:center;gap:5px;padding:3px 9px;background:linear-gradient(135deg,#5d4037,#4a332a);color:#FAF7F2;border-radius:999px;font-size:10.5px;font-weight:700;letter-spacing:0.5px;white-space:nowrap;font-family:'SF Mono','Monaco','Consolas',monospace; }

        /* Matches cell: band picker + the eye that opens those matches */
        .fl-match { display:flex; align-items:center; gap:7px; min-width:0; }
        .fl-sel-wrap { position:relative; flex:1 1 auto; min-width:0; }
        .fl-sel {
          width:100%; appearance:none; -webkit-appearance:none;
          padding:5px 24px 5px 10px; border-radius:999px;
          border:1px solid rgba(200,182,166,0.55);
          background:rgba(255,255,255,0.85); color:#4a352f;
          font-size:11.5px; font-weight:600; font-family:inherit;
          cursor:pointer; line-height:1.4;
          text-overflow:ellipsis;
        }
        .fl-sel:focus-visible { outline:2px solid #a67c52; outline-offset:1px; }
        .fl-sel-chev { position:absolute; right:8px; top:50%; transform:translateY(-50%); pointer-events:none; color:#7d5a50; }
        .fl-eye {
          display:inline-flex; align-items:center; justify-content:center;
          width:28px; height:28px; flex-shrink:0;
          border-radius:8px; cursor:pointer;
          border:1px solid transparent;
          background:linear-gradient(135deg,#a67c52,#7d5a50); color:#faf7f2;
          box-shadow:0 2px 6px rgba(166,124,82,0.3);
          transition:transform 0.15s, box-shadow 0.15s;
        }
        .fl-eye:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(166,124,82,0.45); }
        .fl-eye:disabled { opacity:0.4; cursor:not-allowed; transform:none; box-shadow:none; }

        .fl-kebab {
          display:inline-flex; align-items:center; justify-content:center;
          width:32px; height:32px; margin:0 auto;
          border-radius:9px; cursor:pointer;
          border:1px solid rgba(200,182,166,0.5);
          background:rgba(250,247,242,0.9); color:#4a352f;
          transition:transform 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .fl-kebab:hover { transform:translateY(-1px); box-shadow:0 3px 8px rgba(0,0,0,0.12); background:#fff; }

        .fl-menu-item {
          width:100%; display:flex; align-items:center; gap:9px;
          padding:10px 14px; background:none; border:none;
          font-size:12.5px; font-family:inherit; color:#4a352f;
          text-align:left; cursor:pointer;
        }
        .fl-menu-item:hover:not(:disabled) { background:#faf7f2; }
        .fl-menu-item:disabled { color:#b9aa9c; cursor:not-allowed; }
        .fl-menu-item.danger { color:#dc2626; }
      `}</style>

      <div style={{ width: "100%", boxSizing: "border-box", padding: embedded ? "14px" : "22px", fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

        {/* HEADER */}
        <div style={{ background: "linear-gradient(135deg,rgba(250,247,242,0.97),rgba(245,240,225,0.97))", borderRadius: 14, padding: "16px 20px", marginBottom: 18, border: "1px solid rgba(200,182,166,0.3)", boxShadow: "0 8px 22px rgba(74,53,47,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ background: "linear-gradient(135deg,#4a352f,#7d5a50)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "clamp(20px,3vw,30px)", fontWeight: 800, margin: "0 0 5px", letterSpacing: "-0.02em" }}>My Funding Applications</h1>
            <p style={{ color: "#7d5a50", fontSize: 13, margin: 0, fontWeight: 500 }}>
              {applications.length} {applications.length === 1 ? "Application" : "Applications"}
            </p>
          </div>
          <button onClick={onCreateNew} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: "linear-gradient(135deg,#a67c52,#7d5a50)", color: "#faf7f2", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(166,124,82,0.3)", transition: "all 0.22s" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 7px 20px rgba(166,124,82,0.4)" }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 14px rgba(166,124,82,0.3)" }}
          >
            <Plus size={16} /> Create New Application
          </button>
        </div>

        {navNotice && (
          <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 12, background: "#faf7f2", border: "1px solid #e6d7c3", color: "#4a352f", fontSize: 13, display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span>{navNotice}</span>
            <button onClick={() => setNavNotice(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#7d5a50" }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* EMPTY */}
        {applications.length === 0 ? (
          <div style={{ background: "linear-gradient(135deg,rgba(250,247,242,0.97),rgba(245,240,225,0.97))", borderRadius: 14, padding: "64px 32px", textAlign: "center", border: "1px solid rgba(200,182,166,0.3)", boxShadow: "0 10px 24px rgba(74,53,47,0.07)" }}>
            <DollarSign size={42} style={{ color: "#c8b6a6", margin: "0 auto 12px" }} />
            <h3 style={{ color: "#4a352f", marginBottom: 6, fontSize: 18, fontWeight: 700 }}>No Funding Applications Yet</h3>
            <p style={{ color: "#6b7280", marginBottom: 20 }}>Create your first funding application to get started.</p>
            <button onClick={onCreateNew} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 24px", background: "linear-gradient(135deg,#a67c52,#7d5a50)", color: "#faf7f2", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(166,124,82,0.3)" }}>
              <Plus size={16} /> Create Application
            </button>
          </div>
        ) : (
          <div className="fl-wrap">
            <table className="fl-tbl">
              <colgroup>
                <col className="c0" /><col className="c1" /><col className="c2" />
                <col className="c3" /><col className="c4" /><col className="c5" />
                <col className="c6" />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <span className="fl-th-row">
                      AppID <HeaderInfoTooltip text={COLUMN_TOOLTIPS.appId} />
                    </span>
                  </th>
                  <th>
                    <span className="fl-th-row">
                      Application <HeaderInfoTooltip text={COLUMN_TOOLTIPS.application} />
                    </span>
                  </th>
                  <th>
                    <span className="fl-th-row">
                      Type <HeaderInfoTooltip text={COLUMN_TOOLTIPS.type} />
                    </span>
                  </th>
                  <th>
                    <span className="fl-th-row">
                      Matches <HeaderInfoTooltip text={COLUMN_TOOLTIPS.matches} />
                    </span>
                  </th>
                  <th>
                    <span className="fl-th-row">
                      Last Updated <HeaderInfoTooltip text={COLUMN_TOOLTIPS.lastUpdated} />
                    </span>
                  </th>
                  <th>
                    <span className="fl-th-row">
                      Status <HeaderInfoTooltip text={COLUMN_TOOLTIPS.status} />
                    </span>
                  </th>
                  <th className="r">
                    <span className="fl-th-row">
                      Actions <HeaderInfoTooltip text={COLUMN_TOOLTIPS.actions} />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const { label, color, bg, Icon } = getStatusBadge(app)
                  const bandKey = rowBand[app.id] || "all"
                  const bandTotal = countInBand(app.id, bandKey)
                  const hasAnyMatch = totalMatches(app.id) > 0

                  return (
                    <tr key={app.id}>
                      <td>
                        <span className="fl-appid uppercase" title={`Full application id: ${app.id}`}>
                          <Hash size={10} /> {app.appId}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                          <div style={{ width: 32, height: 32, flexShrink: 0, background: "rgba(166,124,82,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <DollarSign size={15} color="#a67c52" />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <span className="ell" style={{ fontWeight: 600, color: "#4a352f", fontSize: 13, marginBottom: 2 }} title={app.name}>{app.name}</span>
                            <span className="ell" style={{ fontSize: 11, color: "#6b7280" }} title={app.purpose}>{app.purpose}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="ell" style={{ fontSize: 12, color: "#4a352f", fontWeight: 500 }} title={app.fundingType}>
                          {app.fundingType || "—"}
                        </span>
                      </td>

                      {/* Matches — pick a score band, then press the eye to open
                          exactly those rows in the Funding Matches table. */}
                      <td>
                        {hasAnyMatch ? (
                          <div className="fl-match">
                            <span className="fl-sel-wrap">
                              <select
                                className="fl-sel"
                                value={bandKey}
                                onChange={(e) => setRowBand((prev) => ({ ...prev, [app.id]: e.target.value }))}
                                aria-label={`Match score band for ${app.name}`}
                                title="Choose which matches to count and open"
                              >
                                {MATCH_BANDS.map((b) => (
                                  <option key={b.key} value={b.key}>
                                    {countInBand(app.id, b.key)} · {b.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={12} className="fl-sel-chev" />
                            </span>
                            <button
                              className="fl-eye"
                              onClick={() => openMatchTable(app.id, bandKey)}
                              disabled={bandTotal === 0}
                              aria-label={`Open ${bandOf(bandKey).label.toLowerCase()} for ${app.name}`}
                              title={
                                bandTotal === 0
                                  ? `No funds in ${bandOf(bandKey).label.toLowerCase()} yet`
                                  : `Open the Funding Matches table — ${bandTotal} ${
                                      bandTotal === 1 ? "fund" : "funds"
                                    } ${bandOf(bandKey).short}`
                              }
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>— no matches yet</span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#6b7280", fontSize: 11, whiteSpace: "nowrap" }}>
                          <Calendar size={12} style={{ flexShrink: 0 }} /> {app.lastUpdatedFormatted}
                        </div>
                      </td>

                      {/* Status — unchanged */}
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", background: bg, color, borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                          <Icon size={10} /> {label}
                        </span>
                      </td>

                      {/* Actions — one quick actions menu, nothing else. */}
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="fl-kebab"
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
                  className="fl-menu-item"
                  role="menuitem"
                  onClick={() => {
                    closeQuickActions()
                    openMatchTable(app.id, bandKey)
                  }}
                >
                  <Table2 size={14} /> View matches
                </button>

                <button
                  className="fl-menu-item"
                  role="menuitem"
                  onClick={() => {
                    closeQuickActions()
                    onViewSummary(app.id, app)
                  }}
                >
                  <Eye size={14} /> View application
                </button>

                <button
                  className="fl-menu-item"
                  role="menuitem"
                  disabled={alreadySubmitted || submittingId === app.id}
                  title={
                    alreadySubmitted
                      ? "This application has already been submitted"
                      : app.isComplete
                        ? "Send this application"
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
                  className="fl-menu-item danger"
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
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20, backdropFilter: "blur(4px)" }}
          onClick={() => setShowDeleteConfirm(null)}>
          <div style={{ background: "linear-gradient(135deg,rgba(250,247,242,0.99),rgba(245,240,225,0.99))", borderRadius: 16, padding: 28, maxWidth: 360, width: "100%", boxShadow: "0 28px 56px rgba(0,0,0,0.18)", border: "1px solid rgba(200,182,166,0.3)" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 52, height: 52, margin: "0 auto 16px", background: "#fee2e2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Trash2 size={26} color="#dc2626" />
            </div>
            <h3 style={{ textAlign: "center", fontSize: 18, fontWeight: 700, color: "#4a352f", marginBottom: 8 }}>Delete Application?</h3>
            <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 20, lineHeight: 1.6 }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ flex: 1, padding: 10, background: "#f3f4f6", color: "#4a352f", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} disabled={deleting} style={{ flex: 1, padding: 10, background: "#dc2626", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: deleting ? 0.7 : 1 }}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FundingApplicationsList