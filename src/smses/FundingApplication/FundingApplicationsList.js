"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
  AlertTriangle,
  Hash,
  DollarSign,
  Table2,
  X,
  Info,
  MoreVertical,
  Send,
  ChevronDown,
  Sparkles,
} from "lucide-react"
import { getFunctions, httpsCallable } from "firebase/functions"

/* ⚠️ CONFIRM THIS PATH — set it to whatever route renders <FundingTable />. */
const MATCHES_ROUTE = "/funding-matches"

const FUNDING_APPLICATION_FILTER_EVENT = "funding-application-filter"
const FUNDING_MATCH_RANGE_EVENT = "funding-match-range-filter"

const MATCH_BANDS = [
  { key: "all", label: "All matches", short: "All", range: [0, 100], test: () => true },
  { key: "above75", label: "Above 75%", short: ">75%", range: [75, 100], test: (s) => s >= 75 },
  { key: "above50", label: "Above 50%", short: ">50%", range: [50, 100], test: (s) => s >= 50 },
  { key: "below50", label: "Below 50%", short: "<50%", range: [0, 49], test: (s) => s < 50 },
]
const bandOf = (key) => MATCH_BANDS.find((b) => b.key === key) || MATCH_BANDS[0]

const COLUMN_TOOLTIPS = {
  appId: "The short id for this funding request. Hover it in the row to see the full document id.",
  application:
    "The funding stage you applied for, the amount requested, and the AI capital navigation analysis for this application.",
  type: "The funding instruments you asked for — debt, equity, grant and so on.",
  matches:
    "Funds matched to this application. Pick a score band to see how many fall in it, then press the eye to open those matches in the Funding Matches table.",
  lastUpdated: "When you last saved a change to this application.",
  status: "Draft while sections are still incomplete, Ready once every section is done, Submitted after you send it.",
  actions: "Open the quick actions menu to view matches, view the analysis, view the application, submit it, or delete it.",
}

const Portal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

/* ─── Capital navigation helpers ─────────────────────────────────────────── */

const parseAmount = (v) => parseInt((v ?? "").toString().replace(/[^\d]/g, ""), 10) || 0

const getRequestedRoute = (useOfFunds = {}) => {
  const pick = (main, other) => (main && main.startsWith("Other") ? other || main : main) || null
  const legacy = Array.isArray(useOfFunds.fundingInstruments)
    ? useOfFunds.fundingInstruments.filter(Boolean).join(", ")
    : ""
  return {
    category: pick(useOfFunds.fundingCategory, useOfFunds.fundingCategoryOther),
    instrument: pick(useOfFunds.fundingInstrument, useOfFunds.fundingInstrumentOther) || legacy || null,
    funderType: pick(useOfFunds.preferredFunderType, useOfFunds.preferredFunderTypeOther),
  }
}

const buildCapitalNavSignature = (appData, scores = {}, guaranteesEvaluation, profile = {}) => {
  const route = getRequestedRoute(appData.useOfFunds)
  return JSON.stringify({
    compliance: scores.compliance ?? null,
    legitimacy: scores.legitimacy ?? null,
    governanceLeadership: scores.governanceLeadership ?? null,
    operational: scores.operational ?? null,
    fundability: scores.fundability ?? null,
    overall: scores.bigScore ?? null,
    guarantees: guaranteesEvaluation?.score ?? null,
    stage: profile?.entityOverview?.operationStage ?? null,
    category: route.category,
    instrument: route.instrument,
    amountRequested: appData.useOfFunds?.amountRequested ?? null,
    items: (appData.useOfFunds?.fundingItems || []).length,
  })
}

const getMissingInfo = (appData, ctx) => {
  const blocking = []
  const optional = []
  const useOfFunds = appData?.useOfFunds || {}
  const route = getRequestedRoute(useOfFunds)

  if (parseAmount(useOfFunds.amountRequested) <= 0) blocking.push("Amount requested (Use of Funds section)")
  if (!route.category && !route.instrument) blocking.push("Funding category (Use of Funds section)")
  else if (route.category && route.category !== "Any" && !route.instrument)
    optional.push("Funding instrument (Use of Funds section)")

  if (ctx) {
    if (ctx.scores?.bigScore == null)
      blocking.push("Your BIG Score hasn't been calculated yet — open the Dashboard once so it can be generated")

    const profile = ctx.profile || {}
    if (!profile.entityOverview?.operationStage) optional.push("Business stage (Business Profile → Entity Overview)")
    if (!(profile.entityOverview?.economicSectors || []).length)
      optional.push("Industry / economic sector (Business Profile → Entity Overview)")
    if (!ctx.guaranteesEvaluation) optional.push("Guarantees haven't been analysed yet (Guarantees section)")
    if (!profile.financialOverview?.existingDebt) optional.push("Existing debt position (Financial Overview)")
  }

  if (!(useOfFunds.fundingItems || []).length) optional.push("Purpose of funds breakdown (Use of Funds section)")

  return { blocking, optional }
}

const suitabilityColor = (score) => (score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444")

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

  const [capitalNavByApp, setCapitalNavByApp] = useState({})
  const [capitalNavLoadingByApp, setCapitalNavLoadingByApp] = useState({})
  const [navCtx, setNavCtx] = useState(null)
  const navCtxRef = useRef(null)
  const [analysisModalId, setAnalysisModalId] = useState(null)

  const [matchScores, setMatchScores] = useState({})
  const [rowBand, setRowBand] = useState({})
  const [quickActions, setQuickActions] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const isInvestorView = sessionStorage.getItem("investorViewMode") === "true"
    const viewingSMEId = sessionStorage.getItem("viewingSMEId")
    const unsubscribe = auth.onAuthStateChanged((user) => {
      const effectiveUserId = (isInvestorView && viewingSMEId) ? viewingSMEId : user?.uid
      if (effectiveUserId) fetchApplications(effectiveUserId)
      else {
        setLoading(false)
        setError("Please log in")
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchMatchCounts = async (userId) => {
    try {
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

  const fetchSharedCapitalNavContext = async (userId) => {
    const [bigEvalSnap, profileSnap, aiEvalSnap] = await Promise.all([
      getDoc(doc(db, "bigEvaluations", userId)),
      getDoc(doc(db, "universalProfiles", userId)),
      getDocs(query(collection(db, "aiEvaluations"), where("userId", "==", userId))),
    ])
    return {
      scores: bigEvalSnap.exists() ? bigEvalSnap.data().scores || {} : {},
      profile: profileSnap.exists() ? profileSnap.data() : {},
      guaranteesEvaluation: aiEvalSnap.docs.map((d) => d.data()?.guaranteesEvaluation).find(Boolean) || null,
    }
  }

  const ensureNavCtx = async (userId, force = false) => {
    if (navCtxRef.current && !force) return navCtxRef.current
    const uid = userId || auth.currentUser?.uid
    if (!uid) return null
    const ctx = await fetchSharedCapitalNavContext(uid)
    navCtxRef.current = ctx
    setNavCtx(ctx)
    return ctx
  }

  const fetchApplications = async (userId) => {
    try {
      setLoading(true)
      setError(null)
      let apps = []

      const qNew = query(collection(db, "fundingApplicationsV2"), where("userId", "==", userId))
      const snapshot = await getDocs(qNew)

      if (snapshot.empty) {
        const upDocRef = doc(db, "universalProfiles", userId)
        const upSnap = await getDoc(upDocRef)
        if (upSnap.exists()) {
          const upData = upSnap.data()
          if (upData.applicationOverview || upData.useOfFunds || upData.completedSections) {
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
              "socialImpact", "documentUpload", "declarationCommitment",
            ]
            possibleFields.forEach((field) => {
              if (upData[field]) {
                newAppPayload[field] = upData[field]
              }
            })

            await addDoc(collection(db, "fundingApplicationsV2"), newAppPayload)
            await setDoc(upDocRef, { legacyFundingSeeded: true }, { merge: true })

            const snapshotRefreshed = await getDocs(qNew)
            snapshotRefreshed.forEach((d) => apps.push(formatAppData(d.id, d.data())))
          }
        }
      } else {
        snapshot.forEach((d) => apps.push(formatAppData(d.id, d.data())))
        apps.sort((a, b) => (b.lastUpdatedTimestamp || 0) - (a.lastUpdatedTimestamp || 0))
      }

      setApplications(apps)

      const cached = {}
      apps.forEach((a) => {
        const r = a.raw?.capitalNavigation?.result
        if (r && r.success !== false) cached[a.id] = r
      })
      setCapitalNavByApp(cached)

      await fetchMatchCounts(userId)

      try {
        await ensureNavCtx(userId, true)
      } catch (ctxErr) {
        console.error("Failed to load capital navigation context:", ctxErr)
      }
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
    const route = getRequestedRoute(useOfFunds)

    return {
      id: docId,
      appId: docId?.slice(-8) || docId,
      name: `Funding${fundingStage ? ` - ${fundingStage}` : ""}`,
      purpose: amountRequested ? `${amountRequested}` : "",
      fundingType: route.instrument || route.category || applicationType || "",
      lastUpdatedFormatted,
      lastUpdatedTimestamp,
      isComplete,
      status: data.status || (isComplete ? "complete" : "draft"),
      raw: data,
    }
  }

  const generateCapitalNavForApp = async (app, { force = false } = {}) => {
    const appId = app.id
    const appData = app.raw || {}
    setCapitalNavLoadingByApp((p) => ({ ...p, [appId]: true }))
    try {
      const ctx = await ensureNavCtx(null, force)
      if (!ctx) throw new Error("Please log in again.")

      if (getMissingInfo(appData, ctx).blocking.length > 0) return

      const { scores, profile, guaranteesEvaluation } = ctx
      const useOfFunds = appData.useOfFunds || {}
      const financials = profile.financialOverview || {}
      const growth = appData.growthPotential || {}
      const route = getRequestedRoute(useOfFunds)

      const signature = buildCapitalNavSignature(appData, scores, guaranteesEvaluation, profile)

      const saved = appData.capitalNavigation
      if (!force && saved?.signature === signature && saved?.result?.success !== false) {
        setCapitalNavByApp((p) => ({ ...p, [appId]: saved.result }))
        return
      }

      const fundingPurpose =
        (useOfFunds.fundingItems || [])
          .map((i) => `${i.category}${i.subArea ? ` (${i.subArea})` : ""}: ${i.amount}`)
          .join("; ") || null

      const growthProfileSummary =
        [
          growth.marketShare === "yes" && `Market share growth: ${growth.marketShareDetails || "yes"}`,
          growth.qualityImprovement === "yes" && `Quality/price improvement: ${growth.qualityImprovementDetails || "yes"}`,
          growth.greenTech === "yes" && `Green/resource efficiency: ${growth.greenTechDetails || "yes"}`,
          growth.employment === "yes" &&
            `Jobs: +${growth.employmentIncreaseDirect || 0} direct, +${growth.employmentIncreaseIndirect || 0} indirect`,
        ]
          .filter(Boolean)
          .join("; ") || null

      const om = profile.ownershipManagement || {}
      const headcount = ["permanentEmployees", "contractEmployees", "internshipEmployees", "temporaryEmployees"]
        .reduce((s, k) => s + (parseInt(om[k], 10) || 0), 0)
      const num = (v) => Number(String(v ?? "").replace(/[^\d.-]/g, "")) || 0
      const cur = num(financials.incomeTurnoverCurrent)
      const prev = num(financials.incomeTurnoverPrevious)
      const turnoverTrend =
        cur && prev ? `Turnover ${cur >= prev ? "up" : "down"} ${Math.abs(Math.round(((cur - prev) / prev) * 100))}% year on year` : null

      const functions = getFunctions()
      const call = httpsCallable(functions, "analyzeCapitalNavigation")
      const resp = await call({
        entityName: profile.entityOverview?.entityName || "",
        businessStage: profile.entityOverview?.operationStage || "",
        industry: (profile.entityOverview?.economicSectors || []).join(", "),
        employees: headcount || null,
        growthRate: turnoverTrend || growthProfileSummary,
        existingDebt: financials.existingDebt || null,
        bigScore: {
          compliance: scores.compliance,
          legitimacy: scores.legitimacy,
          leadershipGovernance: scores.governanceLeadership,
          operationalStrength: scores.operational,
          overall: scores.bigScore,
        },
        guarantees: guaranteesEvaluation
          ? { score: guaranteesEvaluation.score, label: guaranteesEvaluation.label, summary: guaranteesEvaluation.analysis }
          : null,
        requestedCategory: route.category,
        requestedInstrument: route.instrument,
        fundingAmount: useOfFunds.amountRequested || null,
        fundingPurpose,
      })

      const result = resp?.data
      if (!result || result.success === false) {
        setCapitalNavByApp((p) => ({
          ...p,
          [appId]: { success: false, error: result?.error || "The analysis service returned no result." },
        }))
        return
      }

      setCapitalNavByApp((p) => ({ ...p, [appId]: result }))
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId ? { ...a, raw: { ...a.raw, capitalNavigation: { result, signature } } } : a,
        ),
      )
      await setDoc(
        doc(db, "fundingApplicationsV2", appId),
        { capitalNavigation: { result, signature, evaluatedAt: serverTimestamp() } },
        { merge: true },
      )
    } catch (err) {
      console.error(`generateCapitalNavForApp(${appId}) error:`, err)
      setCapitalNavByApp((p) => ({ ...p, [appId]: { success: false, error: err?.message || "Analysis failed." } }))
    } finally {
      setCapitalNavLoadingByApp((p) => ({ ...p, [appId]: false }))
    }
  }

  const openAnalysis = (app) => {
    setAnalysisModalId(app.id)
    const existing = capitalNavByApp[app.id]
    if (existing && existing.success !== false) return
    if (capitalNavLoadingByApp[app.id]) return
    generateCapitalNavForApp(app)
  }

  const isNavStale = (app) => {
    const saved = app.raw?.capitalNavigation
    if (!saved?.signature || !navCtx) return false
    return saved.signature !== buildCapitalNavSignature(app.raw || {}, navCtx.scores, navCtx.guaranteesEvaluation, navCtx.profile)
  }

  const countInBand = useMemo(
    () => (appId, bandKey) => {
      const scores = matchScores[appId] || []
      return scores.filter(bandOf(bandKey).test).length
    },
    [matchScores],
  )

  const totalMatches = (appId) => (matchScores[appId] || []).length

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

  const renderNavLine = (app) => {
    const result = capitalNavByApp[app.id]
    const hasResult = result && result.success !== false && result.suitabilityScore != null

    if (capitalNavLoadingByApp[app.id]) {
      return <span className="ell" style={{ fontSize: 10.5, color: "#a67c52" }}>Analysing fit…</span>
    }
    if (hasResult) {
      return (
        <button
          className="fl-nav-link"
          onClick={() => setAnalysisModalId(app.id)}
          title={result.plainEnglishSummary || "Open the full analysis"}
        >
          <Sparkles size={10} /> AI: {result.suitabilityScore}/100 suitability · {result.approvalProbability || "—"} approval
          {isNavStale(app) ? " · out of date" : ""}
        </button>
      )
    }
    if (result?.success === false) {
      return (
        <button className="fl-nav-link warn" onClick={() => setAnalysisModalId(app.id)}>
          <AlertTriangle size={10} /> Analysis failed — view
        </button>
      )
    }
    if (navCtx && getMissingInfo(app.raw, navCtx).blocking.length > 0) {
      return (
        <button className="fl-nav-link warn" onClick={() => setAnalysisModalId(app.id)}>
          <AlertTriangle size={10} /> More info needed for analysis
        </button>
      )
    }
    return (
      <button className="fl-nav-link" onClick={() => openAnalysis(app)}>
        <Sparkles size={10} /> Analyse this application
      </button>
    )
  }

  const renderAnalysisModal = () => {
    const app = applications.find((a) => a.id === analysisModalId)
    if (!app) return null

    const result = capitalNavByApp[app.id]
    const isLoading = !!capitalNavLoadingByApp[app.id]
    const hasResult = result && result.success !== false
    const missing = getMissingInfo(app.raw, navCtx)
    const stale = hasResult && isNavStale(app)

    const sectionTitle = { color: "#5D4037", fontSize: 14, fontWeight: 700, margin: "18px 0 8px" }
    const listStyle = { margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.65, color: "#333" }

    const MissingBox = ({ title, items, tone }) =>
      items.length > 0 ? (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 10,
            background: tone === "block" ? "#fef2f2" : "#fffbeb",
            border: `1px solid ${tone === "block" ? "#fecaca" : "#fde68a"}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: tone === "block" ? "#b91c1c" : "#92400e", marginBottom: 6 }}>
            <AlertTriangle size={13} /> {title}
          </div>
          <ul style={listStyle}>
            {items.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      ) : null

    return (
      <Portal>
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300, padding: 20, backdropFilter: "blur(4px)" }}
          onClick={() => setAnalysisModalId(null)}
        >
          <div
            style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 28px 56px rgba(0,0,0,0.25)", fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: "linear-gradient(135deg,#5D4037,#3E2723)", color: "#fff", padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 700 }}>
                  <Sparkles size={18} /> AI Capital Navigation
                </div>
                <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 4 }}>
                  {app.name}
                  {app.purpose ? ` · ${app.purpose}` : ""} · #{app.appId}
                </div>
              </div>
              <button
                onClick={() => setAnalysisModalId(null)}
                aria-label="Close analysis"
                style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer", flexShrink: 0 }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "18px 22px 22px", overflowY: "auto", flex: 1 }}>
              {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 44, color: "#6c757d", fontSize: 14 }}>
                  <div style={{ width: 20, height: 20, border: "2px solid #5D4037", borderTopColor: "transparent", borderRadius: "50%", animation: "fl-spin 0.8s linear infinite", marginRight: 12 }} />
                  Analysing this application…
                </div>
              ) : (
                <>
                  <MissingBox
                    title="More information is needed before this can be analysed"
                    items={missing.blocking}
                    tone="block"
                  />

                  {result?.success === false && missing.blocking.length === 0 && (
                    <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 13 }}>
                      {result.error || "The analysis could not be completed."}
                    </div>
                  )}

                  {hasResult && (
                    <>
                      {stale && (
                        <div style={{ marginTop: 4, marginBottom: 6, padding: "9px 12px", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", fontSize: 12.5 }}>
                          Your scores, guarantees or this application have changed since this analysis ran. Re-run it to refresh.
                        </div>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginTop: 8 }}>
                        {[
                          { label: "Suitability", value: result.suitabilityScore != null ? `${result.suitabilityScore}/100` : "—", color: suitabilityColor(result.suitabilityScore ?? 0) },
                          { label: "Approval probability", value: result.approvalProbability || "—" },
                          { label: "Confidence", value: result.confidenceLevel || "—" },
                          { label: "Readiness", value: result.readinessStatus || "—" },
                        ].map((s) => (
                          <div key={s.label} style={{ background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: 10, padding: "10px 12px" }}>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#7d5a50", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
                            <div style={{ fontSize: 17, fontWeight: 700, color: s.color || "#4a352f", marginTop: 3 }}>{s.value}</div>
                          </div>
                        ))}
                      </div>

                      {result.plainEnglishSummary && (
                        <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "#333", margin: "16px 0 0" }}>{result.plainEnglishSummary}</p>
                      )}

                      {(result.mostSuitableCategory || result.mostSuitableInstrument || result.mostSuitableFunderType) && (
                        <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: "rgba(166,124,82,0.1)", border: "1px solid rgba(166,124,82,0.2)", fontSize: 13, lineHeight: 1.7, color: "#4a352f" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#7d5a50", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Best-fit route right now</div>
                          {result.mostSuitableCategory && <div><strong>Category:</strong> {result.mostSuitableCategory}</div>}
                          {result.mostSuitableInstrument && <div><strong>Instrument:</strong> {result.mostSuitableInstrument}</div>}
                          {result.mostSuitableFunderType && <div><strong>Funder type:</strong> {result.mostSuitableFunderType}</div>}
                        </div>
                      )}

                      {result.likelyApprovingFunderTypes?.length > 0 && (
                        <>
                          <h4 style={sectionTitle}>Funder types likely to approve today</h4>
                          <ul style={listStyle}>{result.likelyApprovingFunderTypes.map((x, i) => <li key={i}>{x}</li>)}</ul>
                        </>
                      )}
                      {result.keyStrengths?.length > 0 && (
                        <>
                          <h4 style={sectionTitle}>Key strengths</h4>
                          <ul style={listStyle}>{result.keyStrengths.map((x, i) => <li key={i}>{x}</li>)}</ul>
                        </>
                      )}
                      {result.keyWeaknesses?.length > 0 && (
                        <>
                          <h4 style={sectionTitle}>Key weaknesses</h4>
                          <ul style={listStyle}>{result.keyWeaknesses.map((x, i) => <li key={i}>{x}</li>)}</ul>
                        </>
                      )}
                      {result.recommendedAlternatives?.length > 0 && (
                        <>
                          <h4 style={sectionTitle}>Recommended alternatives</h4>
                          <ol style={listStyle}>{result.recommendedAlternatives.map((x, i) => <li key={i}>{x}</li>)}</ol>
                        </>
                      )}
                      {result.improvementActions?.length > 0 && (
                        <>
                          <h4 style={sectionTitle}>Improvement actions</h4>
                          <ul style={listStyle}>{result.improvementActions.map((x, i) => <li key={i}>{x}</li>)}</ul>
                        </>
                      )}

                      <MissingBox
                        title="This analysis is provisional — it would sharpen with:"
                        items={missing.optional}
                        tone="warn"
                      />
                    </>
                  )}

                  {!hasResult && missing.blocking.length === 0 && result?.success !== false && (
                    <MissingBox title="Not analysed yet. For a sharper result, also add:" items={missing.optional} tone="warn" />
                  )}
                </>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 22px", borderTop: "1px solid #eee", background: "#fff" }}>
              <button
                onClick={() => setAnalysisModalId(null)}
                style={{ padding: "9px 18px", background: "#f3f4f6", color: "#4a352f", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Close
              </button>
              <button
                onClick={() => generateCapitalNavForApp(app, { force: true })}
                disabled={isLoading || missing.blocking.length > 0}
                title={missing.blocking.length > 0 ? "Provide the missing information first" : "Run the analysis again with the latest data"}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "linear-gradient(135deg,#a67c52,#7d5a50)", color: "#ffffff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: isLoading || missing.blocking.length > 0 ? "not-allowed" : "pointer", opacity: isLoading || missing.blocking.length > 0 ? 0.5 : 1 }}
              >
                <RefreshCw size={14} /> {hasResult ? "Re-run analysis" : "Run analysis"}
              </button>
            </div>
          </div>
        </div>
      </Portal>
    )
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
        className="funding-cta-btn"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", background: "linear-gradient(135deg,#a67c52,#7d5a50)", color: "#ffffff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
        <RefreshCw size={15} /> Retry
      </button>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes fl-spin{to{transform:rotate(360deg)}}
        @keyframes fl-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        /* ── Force white text on every CTA button in this module ─────────── */
        .funding-cta-btn,
        .funding-cta-btn:link,
        .funding-cta-btn:visited,
        .funding-cta-btn:hover,
        .funding-cta-btn:active,
        .funding-cta-btn:focus {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          text-decoration: none !important;
        }
        .funding-cta-btn svg { color: #ffffff !important; }

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

        .fl-nav-link {
          display:inline-flex; align-items:center; gap:4px; max-width:100%;
          margin-top:3px; padding:0; background:none; border:none;
          font-size:10.5px; font-weight:600; font-family:inherit; color:#7d5a50;
          cursor:pointer; text-align:left;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .fl-nav-link:hover { color:#4a352f; text-decoration:underline; }
        .fl-nav-link.warn { color:#b45309; }

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
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <a
              href="/funding-new"
              className="funding-cta-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 20px",
                background: "linear-gradient(135deg,#a67c52,#7d5a50)",
                color: "#ffffff",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(166,124,82,0.3)",
                transition: "all 0.22s",
              }}
            >
              <Sparkles size={15} /> New funding flow
            </a>
            <button
              onClick={onCreateNew}
              className="funding-cta-btn"
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: "linear-gradient(135deg,#a67c52,#7d5a50)", color: "#ffffff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(166,124,82,0.3)", transition: "all 0.22s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 7px 20px rgba(166,124,82,0.4)" }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 14px rgba(166,124,82,0.3)" }}
            >
              <Plus size={16} /> Create New Application
            </button>
          </div>
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
            <button
              onClick={onCreateNew}
              className="funding-cta-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 24px", background: "linear-gradient(135deg,#a67c52,#7d5a50)", color: "#ffffff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(166,124,82,0.3)" }}
            >
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
                            {renderNavLine(app)}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="ell" style={{ fontSize: 12, color: "#4a352f", fontWeight: 500 }} title={app.fundingType}>
                          {app.fundingType || "—"}
                        </span>
                      </td>

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

                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", background: bg, color, borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                          <Icon size={10} /> {label}
                        </span>
                      </td>

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
          const menuHeight = 252
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
                    openAnalysis(app)
                  }}
                >
                  <Sparkles size={14} /> View AI analysis
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

      {/* AI ANALYSIS MODAL */}
      {analysisModalId && renderAnalysisModal()}

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