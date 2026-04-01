// components/Subscriptions/CatalystSubscriptions.js
"use client"
import { useState, useEffect } from "react"
import { getAuth } from "firebase/auth"
import { collection, getFirestore, doc, getDoc, addDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"

// ─── Colors ──────────────────────────────────────────────────────────────────
const colors = {
  darkBrown: "#372C27",
  mediumBrown: "#5D4037",
  lightBrown: "#8D6E63",
  accentGold: "#A67C52",
  offWhite: "#F5F2F0",
  cream: "#EFEBE9",
  lightTan: "#D7CCC8",
  darkText: "#2C2927",
  lightText: "#F5F2F0",
  featureCheck: "#A67C52",
  featureCross: "#D32F2F",
  successGreen: "#2E7D32",
  pendingBlue: "#1565C0",
}

// ─── Catalyst Plans ───────────────────────────────────────────────────────────
const catalystPlans = {
  core: {
    name: "Core Programme",
    targetCohort: "10–20 SMEs",
    annualCostPerSme: "R140k – R180k",
    platformFee: "R250k – R400k",
    contractTerm: "12 months",
    cardBg: "linear-gradient(160deg, #8D6E63 0%, #6D4C41 100%)",
    description: "Structured governance and monitoring for emerging ESD programmes.",
    highlights: [
      "10–20 SME cohort size",
      "Structured Intake Portal",
      "BIG Score Pre-Vetting (initial + periodic)",
      "Basic Deal Flow Management",
      "Basic Growth Suite Tracking",
      "Standard KPI Tracking",
      "Monthly Compliance Monitoring",
      "Basic Dashboard Access",
      "Quarterly Portfolio Reporting",
      "2–5 Corporate Users",
      "Standard Support",
    ],
  },
  scaled: {
    name: "Scaled Programme",
    targetCohort: "20–50 SMEs",
    annualCostPerSme: "R130k – R150k",
    platformFee: "R400k – R700k",
    contractTerm: "12–36 months",
    cardBg: "linear-gradient(160deg, #5D4037 0%, #4A352F 100%)",
    description: "Enhanced infrastructure for growing accelerators and incubators.",
    highlights: [
      "20–50 SME cohort size",
      "SME Onboarding & Data Capture",
      "Continuous BIG Score Pre-Vetting",
      "Structured Deal Flow Pipeline",
      "Full Growth Suite Tracking",
      "Custom KPI Tracking per cohort",
      "Monthly Compliance + Alerts",
      "Cohort Dashboards",
      "Monthly + Quarterly Reporting",
      "5–15 Corporate Users",
      "Priority Support",
    ],
    isPopular: true,
  },
  enterprise: {
    name: "Enterprise Portfolio",
    targetCohort: "50–100+ SMEs",
    annualCostPerSme: "R95k – R130k",
    platformFee: "R700k – R1.5m+",
    contractTerm: "24–36 months",
    cardBg: "linear-gradient(160deg, #A67C52 0%, #8D6E63 100%)",
    description: "Full-suite enterprise infrastructure with advanced analytics and multi-division support.",
    highlights: [
      "50–100+ SME cohort size",
      "Multi-division Onboarding",
      "Advanced BIG Score + Segmentation",
      "Advanced Deal Flow Workflows",
      "Advanced Growth Analytics",
      "Multi-layer KPI Mapping",
      "Real-time Compliance Monitoring",
      "Executive Dashboards",
      "Custom + Board-ready Reporting",
      "Unlimited Users (role-based)",
      "Dedicated + Strategic Support",
    ],
  },
}

// ─── Feature rows — flat, section headers interleaved ────────────────────────
const featureRows = [
  { section: "Core Infrastructure" },
  { label: "Structured Intake Portal",      core: true,                  scaled: true,                           enterprise: "Multi-division" },
  { label: "SME Onboarding & Data Capture", core: true,                  scaled: true,                           enterprise: "Advanced" },
  { label: "BIG Score Pre-Vetting",         core: "Initial + periodic",  scaled: "Continuous",                   enterprise: "Advanced + segmentation" },
  { label: "SME Digital Profiles",          core: true,                  scaled: true,                           enterprise: true },
  { label: "Deal Flow Management",          core: "Basic tracking",      scaled: "Structured pipeline",          enterprise: "Advanced workflows" },

  { section: "Growth & Monitoring" },
  { label: "Growth Suite Tracking",         core: "Basic",               scaled: "Full",                         enterprise: "Advanced analytics" },
  { label: "KPI Tracking",                  core: "Standard",            scaled: "Custom per cohort",            enterprise: "Multi-layer KPI mapping" },
  { label: "Milestone Tracking",            core: true,                  scaled: true,                           enterprise: "Advanced" },
  { label: "SME Progress Tracking",         core: "Basic",               scaled: "Full lifecycle",               enterprise: "Full + predictive insights" },
  { label: "Consultant Commentary",         core: "Optional",            scaled: "Included",                     enterprise: "Fully integrated" },

  { section: "Governance & Compliance" },
  { label: "Compliance Monitoring",         core: "Monthly",             scaled: "Monthly + alerts",             enterprise: "Real-time" },
  { label: "Governance Calendar",           core: "Standard",            scaled: "Structured programme calendar",enterprise: "Multi-layer (group + division)" },
  { label: "Audit Trail",                   core: "Basic",               scaled: "Full",                         enterprise: "Full + historical" },
  { label: "Risk Indicators",              core: false,                 scaled: "Basic",                        enterprise: "Advanced modelling" },

  { section: "Reporting & Dashboards" },
  { label: "Dashboard Access",              core: "Basic",               scaled: "Cohort dashboards",            enterprise: "Executive dashboards" },
  { label: "Portfolio Reporting",           core: "Quarterly",           scaled: "Monthly + quarterly",          enterprise: "Custom + board-ready" },
  { label: "Benchmarking",                  core: false,                 scaled: "Basic",                        enterprise: "Advanced" },
  { label: "Executive Reports",             core: false,                 scaled: "Optional",                     enterprise: "Included" },

  { section: "Access & Support" },
  { label: "Corporate Users",               core: "2–5 users",           scaled: "5–15 users",                   enterprise: "Unlimited (role-based)" },
  { label: "Multi-Division Support",        core: false,                 scaled: "Limited",                      enterprise: true },
  { label: "Support Level",                 core: "Standard",            scaled: "Priority",                     enterprise: "Dedicated + strategic" },
]

// ─── Add-ons ──────────────────────────────────────────────────────────────────
const catalystAddOns = [
  {
    id: "reporting-customisation",
    name: "Reporting Customisation",
    price: "R250,000 (once-off)",
    items: ["Custom templates", "KPI mapping", "Executive formatting", "QA + testing"],
  },
  {
    id: "advanced-analytics",
    name: "Advanced Analytics & Intelligence",
    price: "R450k – R600k / year",
    items: ["Executive dashboards", "Benchmarking", "Risk modelling", "Board packs"],
  },
  {
    id: "integration-build",
    name: "Integration / Custom Build",
    price: "R150k – R500k+ (once-off, scoped)",
    items: ["API integrations", "ERP / procurement integration", "Custom workflows"],
  },
]

const emptyForm = {
  organisationName: "",
  contactPerson: "",
  email: "",
  phone: "",
  programmeType: "",
  cohortSize: "",
  duration: "",
  requiresCustomReporting: "",
  requiresIntegration: "",
  requiresMultiDivision: "",
  notes: "",
  selectedPlan: "",
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const CatalystSubscriptions = () => {
  const auth = getAuth()
  const db = getFirestore()
  const user = auth.currentUser
  const navigate = useNavigate()

  const [isLoading, setIsLoading]       = useState(true)
  const [catalystStatus, setCatalystStatus] = useState(null)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [form, setForm]                 = useState(emptyForm)
  const [formErrors, setFormErrors]     = useState({})
  const [submitting, setSubmitting]     = useState(false)
  const [submitted, setSubmitted]       = useState(false)
  const [hoveredPlan, setHoveredPlan]   = useState(null)

  useEffect(() => {
    const load = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) setCatalystStatus(userDoc.data().catalystStatus || null)
        } catch (e) { console.error(e) }
      }
      setIsLoading(false)
    }
    load()
  }, [user])

  // ── Form helpers ────────────────────────────────────────────────────────────
  // Simple controlled update — NO scroll restoration needed because the modal
  // is no longer a nested component; React keeps the same DOM nodes across renders.
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const openProposalForm = (planKey) => {
    setForm({ ...emptyForm, selectedPlan: catalystPlans[planKey].name })
    setFormErrors({})
    setSubmitted(false)
    setShowProposalForm(true)
  }

  const closeProposalForm = () => {
    setShowProposalForm(false)
    setSubmitted(false)
  }

  const validateForm = () => {
    const errs = {}
    if (!form.organisationName.trim()) errs.organisationName = "Required"
    if (!form.contactPerson.trim())    errs.contactPerson    = "Required"
    if (!form.email.trim() || !form.email.includes("@")) errs.email = "Valid email required"
    if (!form.phone.trim())            errs.phone            = "Required"
    if (!form.programmeType)           errs.programmeType    = "Required"
    if (!form.cohortSize)              errs.cohortSize       = "Required"
    if (!form.duration)                errs.duration         = "Required"
    return errs
  }

  const handleSubmit = async () => {
    const errs = validateForm()
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }
    setSubmitting(true)
    try {
      await addDoc(collection(db, "catalystLeads"), {
        ...form,
        userId: user?.uid || "anonymous",
        userEmail: user?.email || form.email,
        status: "new_lead",
        plan_type: "catalyst",
        billing_model: "cohort_based",
        payment_required: false,
        subscription_activation: "manual",
        submittedAt: new Date().toISOString(),
      })
      if (user) {
        const userRef  = doc(db, "users", user.uid)
        const userSnap = await getDoc(userRef)
        const { setDoc, updateDoc } = await import("firebase/firestore")
        const data = {
          catalystStatus: "pending_review",
          catalystLeadSubmittedAt: new Date().toISOString(),
          catalystSelectedPlan: form.selectedPlan,
        }
        if (userSnap.exists()) { await updateDoc(userRef, data) } else { await setDoc(userRef, data) }
        setCatalystStatus("pending_review")
      }
      try {
        await fetch(`${process.env.REACT_APP_API_URL}/api/catalyst/proposal-request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: "sales@bigmarketplace.africa",
            subject: `New Catalyst Proposal Request – ${form.organisationName}`,
            formData: form,
          }),
        })
      } catch (e) { console.warn("Email non-blocking:", e) }
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert("Submission failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Feature value renderer ──────────────────────────────────────────────────
  const renderVal = (val) => {
    if (val === true)  return <span style={{ color: colors.accentGold, fontWeight: 800, fontSize: "1.05rem" }}>✓</span>
    if (val === false) return <span style={{ color: colors.featureCross, fontWeight: 700 }}>✗</span>
    return <span style={{ color: colors.mediumBrown, fontSize: "0.8rem" }}>{val}</span>
  }

  // ─── Styles (defined once at component level, not inside render) ────────────
  const s = {
    // Layout
    container:  { width: "100%", minHeight: "100vh", padding: "1rem", background: colors.offWhite, fontFamily: "'Georgia', 'Times New Roman', serif", boxSizing: "border-box" },
    mainCard:   { background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`, borderRadius: "24px", padding: "clamp(1rem, 3vw, 2.5rem)", boxShadow: `0 20px 60px ${colors.darkBrown}15`, border: `1px solid ${colors.lightTan}`, position: "relative", overflow: "hidden", maxWidth: "100%", margin: "0 auto" },
    decorative: { position: "absolute", top: "-100px", right: "-100px", width: "300px", height: "300px", background: `radial-gradient(circle, ${colors.accentGold}14 0%, transparent 70%)`, borderRadius: "50%", pointerEvents: "none" },
    // Header
    headerBadge: { display: "inline-block", background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`, color: colors.lightText, padding: "0.4rem 1.2rem", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "1rem" },
    pageTitle:   { fontSize: "clamp(1.8rem, 4vw, 2.75rem)", fontWeight: 800, background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`, backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent", textAlign: "center", marginBottom: "0.75rem", letterSpacing: "-1px", lineHeight: "1.2" },
    subtitle:    { fontSize: "clamp(0.95rem, 2vw, 1.1rem)", color: colors.mediumBrown, textAlign: "center", fontWeight: 400, lineHeight: "1.7", maxWidth: "700px", margin: "0 auto 1rem auto" },
    footerNote:  { fontSize: "0.88rem", color: colors.lightBrown, textAlign: "center", fontStyle: "italic", padding: "1rem", background: `${colors.accentGold}10`, borderRadius: "10px", border: `1px solid ${colors.accentGold}30`, margin: "0 auto 2rem auto", maxWidth: "700px" },
    statusBanner:{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem 1.5rem", borderRadius: "14px", marginBottom: "2rem", background: `linear-gradient(135deg, ${colors.pendingBlue}15 0%, ${colors.accentGold}10 100%)`, border: `2px solid ${colors.pendingBlue}44` },
    // Feature table
    comparisonWrap:  { background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`, borderRadius: "20px", padding: "1.5rem", border: `1px solid ${colors.lightTan}`, marginBottom: "2.5rem", overflowX: "auto" },
    comparisonTitle: { fontSize: "1.3rem", fontWeight: 700, color: colors.darkBrown, marginBottom: "1.25rem", textAlign: "center" },
    featureTable:    { width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", minWidth: "580px" },
    featureTh:       { background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`, color: colors.lightText, padding: "0.85rem 1rem", fontWeight: 700, textAlign: "center", fontSize: "0.88rem", letterSpacing: "0.3px", border: "none" },
    featureThFirst:  { textAlign: "left", width: "32%" },
    sectionRow:      { background: `linear-gradient(90deg, ${colors.accentGold}20 0%, ${colors.cream} 100%)` },
    sectionCell:     { padding: "0.55rem 1rem", fontWeight: 700, color: colors.darkBrown, fontSize: "0.76rem", letterSpacing: "1.2px", textTransform: "uppercase", borderTop: `2px solid ${colors.accentGold}55`, borderBottom: `1px solid ${colors.lightTan}` },
    featureRowEven:  { background: `${colors.cream}80` },
    featureRowOdd:   { background: "transparent" },
    featureTd:       { padding: "0.62rem 1rem", borderBottom: `1px solid ${colors.lightTan}22`, textAlign: "center", verticalAlign: "middle" },
    featureTdLabel:  { textAlign: "left", fontWeight: 500, color: colors.darkBrown },
    // Pricing bar
    pricingOverview:      { background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`, borderRadius: "16px", padding: "1.5rem 2rem", marginBottom: "2rem", color: colors.lightText },
    pricingOverviewTitle: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", opacity: 0.55, marginBottom: "1rem" },
    pricingOverviewGrid:  { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" },
    pricingOverviewItem:  { textAlign: "center", padding: "1rem", background: "rgba(255,255,255,0.08)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" },
    pricingPlanName:      { fontSize: "0.78rem", fontWeight: 700, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.4rem" },
    pricingPrice:         { fontSize: "1rem", fontWeight: 800, marginBottom: "0.2rem" },
    pricingSub:           { fontSize: "0.7rem", opacity: 0.5 },
    // Plan cards
    planGrid:    { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem", margin: "0 0 2rem 0" },
    planCard:    { borderRadius: "20px", padding: "2rem 1.5rem", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", transition: "transform 0.3s ease, box-shadow 0.3s ease", minHeight: "450px" },
    popularBadge:{ position: "absolute", top: "1rem", right: "1rem", background: colors.accentGold, color: colors.lightText, padding: "0.28rem 0.8rem", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px" },
    planName:    { fontSize: "1.3rem", fontWeight: 800, color: colors.lightText, marginBottom: "0.4rem" },
    cohortBadge: { display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "rgba(255,255,255,0.18)", color: colors.lightText, padding: "0.25rem 0.65rem", borderRadius: "20px", fontSize: "0.74rem", fontWeight: 600, marginBottom: "0.6rem", width: "fit-content" },
    planDesc:    { fontSize: "0.84rem", color: "rgba(255,255,255,0.75)", marginBottom: "0.9rem", lineHeight: "1.55" },
    divider:     { height: "1px", background: "rgba(255,255,255,0.15)", margin: "0.75rem 0" },
    feeLabel:    { fontSize: "0.68rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.52)", marginBottom: "0.18rem" },
    feeValue:    { fontSize: "1.4rem", fontWeight: 900, color: colors.lightText, lineHeight: "1", marginBottom: "0.2rem" },
    feeSub:      { fontSize: "0.71rem", color: "rgba(255,255,255,0.52)", marginBottom: "1rem" },
    highlights:  { listStyle: "none", padding: 0, margin: "0 0 1.2rem 0", flex: 1 },
    hlItem:      { display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.32rem 0", fontSize: "0.81rem", color: "rgba(255,255,255,0.88)", lineHeight: "1.4" },
    checkIcon:   { color: colors.accentGold, flexShrink: 0, marginTop: "2px" },
    proposalBtn: { width: "100%", padding: "0.9rem", background: "rgba(255,255,255,0.14)", color: colors.lightText, border: "2px solid rgba(255,255,255,0.38)", borderRadius: "12px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", transition: "all 0.3s ease", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: "auto" },
    // Add-ons
    addOnsWrap:  { background: `${colors.darkBrown}05`, borderRadius: "20px", padding: "2rem", border: `2px dashed ${colors.lightTan}`, margin: "0 0 2rem 0" },
    addOnTitle:  { fontSize: "1.1rem", fontWeight: 700, color: colors.darkBrown, marginBottom: "0.35rem" },
    addOnSub:    { fontSize: "0.84rem", color: colors.mediumBrown, marginBottom: "1.2rem", fontStyle: "italic" },
    addOnsGrid:  { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" },
    addOnCard:   { background: colors.offWhite, borderRadius: "12px", padding: "1.15rem", border: `1px solid ${colors.lightTan}` },
    addOnName:   { fontSize: "0.9rem", fontWeight: 700, color: colors.darkBrown, marginBottom: "0.38rem" },
    addOnPrice:  { fontSize: "0.8rem", fontWeight: 700, color: colors.accentGold, marginBottom: "0.6rem" },
    addOnItem:   { fontSize: "0.76rem", color: colors.mediumBrown, padding: "0.15rem 0", display: "flex", gap: "0.38rem" },
    // Modal overlay — scrollable container; card inside is plain block, no overflow
    overlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: `${colors.darkBrown}88`, backdropFilter: "blur(8px)", overflowY: "auto", zIndex: 1000, padding: "2rem 1rem", boxSizing: "border-box" },
    modal:   { background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`, borderRadius: "24px", padding: "2.5rem", maxWidth: "620px", width: "100%", margin: "0 auto", boxShadow: `0 32px 80px ${colors.darkBrown}44`, border: `1px solid ${colors.lightTan}` },
    // Form elements
    modalTitle:     { fontSize: "1.5rem", fontWeight: 800, color: colors.darkBrown, marginBottom: "0.4rem" },
    modalSub:       { fontSize: "0.92rem", color: colors.mediumBrown, marginBottom: "1.5rem", lineHeight: "1.6" },
    planBadge:      { display: "inline-flex", alignItems: "center", gap: "0.5rem", background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`, color: colors.lightText, padding: "0.42rem 1.1rem", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 700, marginBottom: "1.4rem" },
    sectionLbl:     { display: "flex", alignItems: "center", gap: "0.7rem", fontSize: "0.7rem", fontWeight: 700, color: colors.accentGold, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "0.85rem", marginTop: "1.4rem" },
    sectionLine:    { flex: 1, height: "1px", background: `${colors.accentGold}33` },
    formGrid:       { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" },
    formLabel:      { display: "block", fontSize: "0.79rem", fontWeight: 600, color: colors.darkBrown, marginBottom: "0.32rem" },
    formInput:      { width: "100%", padding: "0.72rem 0.9rem", borderRadius: "10px", border: `1.5px solid ${colors.lightTan}`, background: colors.offWhite, color: colors.darkText, fontSize: "0.92rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
    formInputErr:   { borderColor: colors.featureCross },
    formSelect:     { width: "100%", padding: "0.72rem 0.9rem", borderRadius: "10px", border: `1.5px solid ${colors.lightTan}`, background: colors.offWhite, color: colors.darkText, fontSize: "0.92rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit", cursor: "pointer" },
    formTextarea:   { width: "100%", padding: "0.72rem 0.9rem", borderRadius: "10px", border: `1.5px solid ${colors.lightTan}`, background: colors.offWhite, color: colors.darkText, fontSize: "0.92rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", minHeight: "90px" },
    errText:        { fontSize: "0.74rem", color: colors.featureCross, marginTop: "0.25rem" },
    radioGroup:     { display: "flex", gap: "0.55rem", flexWrap: "wrap", marginTop: "0.35rem" },
    radioOpt:       { fontSize: "0.85rem", color: colors.darkBrown, cursor: "pointer", padding: "0.42rem 0.85rem", borderRadius: "8px", border: `1.5px solid ${colors.lightTan}`, background: colors.offWhite, fontFamily: "inherit", userSelect: "none", transition: "all 0.15s ease" },
    radioOptActive: { background: `${colors.accentGold}18`, border: `1.5px solid ${colors.accentGold}`, fontWeight: 600 },
    submitBtn:      { width: "100%", padding: "1rem", background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`, color: colors.lightText, border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "0.96rem", cursor: "pointer", marginTop: "1.6rem", letterSpacing: "0.5px", textTransform: "uppercase", boxShadow: `0 6px 18px ${colors.accentGold}4D` },
    cancelBtn:      { width: "100%", padding: "0.82rem", background: "transparent", color: colors.mediumBrown, border: `1.5px solid ${colors.lightTan}`, borderRadius: "12px", fontWeight: 600, fontSize: "0.92rem", cursor: "pointer", marginTop: "0.6rem" },
    successIcon:    { width: "68px", height: "68px", borderRadius: "50%", background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.2rem auto", fontSize: "1.9rem" },
    successTitle:   { fontSize: "1.45rem", fontWeight: 800, color: colors.darkBrown, textAlign: "center", marginBottom: "0.85rem" },
    successText:    { fontSize: "0.96rem", color: colors.mediumBrown, textAlign: "center", lineHeight: "1.7", marginBottom: "1.6rem" },
  }

  if (isLoading) {
    return (
      <div style={s.container}>
        <div style={s.mainCard}>
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <div style={{ width: "60px", height: "60px", border: `4px solid ${colors.lightTan}`, borderTop: `4px solid ${colors.accentGold}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 2rem auto" }} />
            <h2 style={{ color: colors.darkBrown, fontSize: "1.5rem", fontWeight: 600 }}>Loading...</h2>
          </div>
        </div>
      </div>
    )
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  // IMPORTANT: The modal form is rendered directly inside the main return, NOT
  // as a nested component function. This means React keeps the same DOM nodes
  // across re-renders — inputs never unmount/remount, so typing works normally.
  return (
    <div style={s.container}>
      <div style={s.mainCard}>
        <div style={s.decorative} />

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={s.headerBadge}>ESD / Accelerators / Incubators</div>
          <h1 style={s.pageTitle}>Catalyst Plans – SME Programme Infrastructure</h1>
          <p style={s.subtitle}>
            Structured governance, monitoring, and reporting infrastructure for ESD programmes,
            accelerators, and enterprise development initiatives.
          </p>
          <p style={s.footerNote}>
            Customisation, integrations, and advanced analytics are scoped separately based on programme requirements.
          </p>
        </div>

        {/* ── Status Banner ── */}
        {catalystStatus === "pending_review" && (
          <div style={s.statusBanner}>
            <span style={{ fontSize: "1.8rem" }}>⏳</span>
            <div>
              <div style={{ fontWeight: 700, color: colors.darkBrown, fontSize: "1rem" }}>Proposal Under Review</div>
              <div style={{ fontSize: "0.86rem", color: colors.mediumBrown, marginTop: "0.2rem" }}>
                Your request has been received. Our team will be in touch. You can still submit another inquiry.
              </div>
            </div>
          </div>
        )}

        {/* ── Full Feature Comparison — always open, at the top ── */}
        <div style={s.comparisonWrap}>
          <h2 style={s.comparisonTitle}>Full Feature Comparison</h2>
          <table style={s.featureTable}>
            <thead>
              <tr>
                <th style={{ ...s.featureTh, ...s.featureThFirst }}>Feature</th>
                <th style={s.featureTh}>Core Programme</th>
                <th style={s.featureTh}>Scaled Programme</th>
                <th style={s.featureTh}>Enterprise Portfolio</th>
              </tr>
            </thead>
            <tbody>
              {featureRows.map((row, i) => {
                if (row.section) {
                  return (
                    <tr key={`s${i}`} style={s.sectionRow}>
                      <td colSpan={4} style={s.sectionCell}>{row.section}</td>
                    </tr>
                  )
                }
                const dataIdx = featureRows.slice(0, i).filter(r => !r.section).length
                return (
                  <tr key={`r${i}`} style={dataIdx % 2 === 0 ? s.featureRowEven : s.featureRowOdd}>
                    <td style={{ ...s.featureTd, ...s.featureTdLabel }}>{row.label}</td>
                    <td style={s.featureTd}>{renderVal(row.core)}</td>
                    <td style={s.featureTd}>{renderVal(row.scaled)}</td>
                    <td style={s.featureTd}>{renderVal(row.enterprise)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pricing Overview Bar ── */}
        <div style={s.pricingOverview}>
          <div style={s.pricingOverviewTitle}>Annual Platform Fee Overview</div>
          <div style={s.pricingOverviewGrid}>
            {Object.entries(catalystPlans).map(([key, plan]) => (
              <div key={key} style={s.pricingOverviewItem}>
                <div style={s.pricingPlanName}>{plan.name}</div>
                <div style={s.pricingPrice}>{plan.platformFee}</div>
                <div style={s.pricingSub}>{plan.targetCohort} · {plan.contractTerm}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Plan Cards ── */}
        <div style={s.planGrid}>
          {Object.entries(catalystPlans).map(([planKey, plan]) => {
            const isHovered = hoveredPlan === planKey
            return (
              <div
                key={planKey}
                style={{
                  ...s.planCard,
                  background: plan.cardBg,
                  ...(plan.isPopular
                    ? { transform: isHovered ? "translateY(-6px) scale(1.01)" : "scale(1.01)", zIndex: 2, boxShadow: `0 20px 50px ${colors.darkBrown}33` }
                    : { transform: isHovered ? "translateY(-6px)" : "none", boxShadow: isHovered ? `0 20px 50px ${colors.darkBrown}33` : `0 8px 24px ${colors.darkBrown}18` }
                  ),
                }}
                onMouseEnter={() => setHoveredPlan(planKey)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {plan.isPopular && <div style={s.popularBadge}>POPULAR</div>}
                <h3 style={s.planName}>{plan.name}</h3>
                <div style={s.cohortBadge}>👥 {plan.targetCohort}</div>
                <p style={s.planDesc}>{plan.description}</p>
                <div style={s.divider} />
                <div style={s.feeLabel}>Annual Platform Fee</div>
                <div style={s.feeValue}>{plan.platformFee}</div>
                <div style={s.feeSub}>Per SME: {plan.annualCostPerSme} · Min {plan.contractTerm}</div>
                <div style={s.divider} />
                <ul style={s.highlights}>
                  {plan.highlights.map((item, i) => (
                    <li key={i} style={s.hlItem}>
                      <span style={s.checkIcon}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button
                  style={{
                    ...s.proposalBtn,
                    ...(isHovered ? { background: colors.accentGold, border: `2px solid ${colors.accentGold}`, boxShadow: `0 8px 24px ${colors.accentGold}55` } : {}),
                  }}
                  onClick={() => openProposalForm(planKey)}
                >
                  Request Proposal →
                </button>
              </div>
            )
          })}
        </div>

        {/* ── No self-serve note ── */}
        <div style={{ background: `${colors.accentGold}10`, border: `2px solid ${colors.accentGold}33`, borderRadius: "14px", padding: "1.1rem 1.4rem", marginBottom: "2rem", display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
          <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontWeight: 700, color: colors.darkBrown, fontSize: "0.91rem", marginBottom: "0.18rem" }}>Cohort-Based Pricing – No Instant Activation</div>
            <div style={{ fontSize: "0.84rem", color: colors.mediumBrown, lineHeight: "1.6" }}>
              Catalyst plans are priced based on programme structure, cohort size, governance complexity, and customisation requirements. All plans go through a structured sales process before activation.
            </div>
          </div>
        </div>

        {/* ── Add-ons ── */}
        <div style={s.addOnsWrap}>
          <h3 style={s.addOnTitle}>🛠️ Customisation & Add-Ons</h3>
          <p style={s.addOnSub}>⚠️ NOT included in base plans — quoted and contracted separately.</p>
          <div style={s.addOnsGrid}>
            {catalystAddOns.map(addon => (
              <div key={addon.id} style={s.addOnCard}>
                <div style={s.addOnName}>{addon.name}</div>
                <div style={s.addOnPrice}>{addon.price}</div>
                {addon.items.map((item, i) => (
                  <div key={i} style={s.addOnItem}>
                    <span style={{ color: colors.accentGold }}>·</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div style={{ textAlign: "center", padding: "1.25rem 0 0.25rem" }}>
          <p style={{ fontSize: "0.98rem", color: colors.mediumBrown, marginBottom: "1rem" }}>
            Ready to structure your SME programme infrastructure?
          </p>
          <div style={{ display: "flex", gap: "0.85rem", justifyContent: "center", flexWrap: "wrap" }}>
            {Object.entries(catalystPlans).map(([key, plan]) => (
              <button
                key={key}
                style={{ padding: "0.82rem 1.65rem", background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`, color: colors.lightText, border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", boxShadow: `0 4px 12px ${colors.accentGold}4D` }}
                onClick={() => openProposalForm(key)}
              >
                {plan.name} →
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          PROPOSAL FORM MODAL
          Rendered here, at the root level of the return — NOT as a nested
          component function. This is the fix: React preserves the same DOM
          nodes across re-renders, so text inputs never lose focus or reset.
          ════════════════════════════════════════════════════════════════════ */}
      {showProposalForm && (
        <div style={s.overlay}>
          <div style={s.modal}>

            {/* ── Success state ── */}
            {submitted ? (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <div style={s.successIcon}>🎉</div>
                <h2 style={s.successTitle}>Request Received</h2>
                <p style={s.successText}>
                  Thank you for your interest in BIG Marketplace.<br /><br />
                  Our team will review your requirements and be in touch to structure a tailored
                  proposal based on your programme scope, cohort size, and reporting needs.
                </p>
                <button style={s.submitBtn} onClick={closeProposalForm}>Close</button>
              </div>
            ) : (
              /* ── Form ── */
              <>
                <h2 style={s.modalTitle}>Request Programme Proposal</h2>
                <p style={s.modalSub}>
                  Complete the form below and our team will prepare a tailored proposal for your programme.
                </p>
                <div style={s.planBadge}>📋 {form.selectedPlan || "Catalyst Plan"}</div>

                {/* Section 1 — Organisation Details */}
                <div style={s.sectionLbl}>
                  <span style={s.sectionLine} />
                  Organisation Details
                  <span style={s.sectionLine} />
                </div>
                <div style={s.formGrid}>
                  <div>
                    <label style={s.formLabel}>Organisation Name *</label>
                    <input
                      style={{ ...s.formInput, ...(formErrors.organisationName ? s.formInputErr : {}) }}
                      value={form.organisationName}
                      onChange={e => updateForm("organisationName", e.target.value)}
                      placeholder="e.g. Acme ESD Programme"
                    />
                    {formErrors.organisationName && <div style={s.errText}>{formErrors.organisationName}</div>}
                  </div>
                  <div>
                    <label style={s.formLabel}>Contact Person *</label>
                    <input
                      style={{ ...s.formInput, ...(formErrors.contactPerson ? s.formInputErr : {}) }}
                      value={form.contactPerson}
                      onChange={e => updateForm("contactPerson", e.target.value)}
                      placeholder="Full Name"
                    />
                    {formErrors.contactPerson && <div style={s.errText}>{formErrors.contactPerson}</div>}
                  </div>
                  <div>
                    <label style={s.formLabel}>Email Address *</label>
                    <input
                      style={{ ...s.formInput, ...(formErrors.email ? s.formInputErr : {}) }}
                      type="email"
                      value={form.email}
                      onChange={e => updateForm("email", e.target.value)}
                      placeholder="you@company.com"
                    />
                    {formErrors.email && <div style={s.errText}>{formErrors.email}</div>}
                  </div>
                  <div>
                    <label style={s.formLabel}>Phone Number *</label>
                    <input
                      style={{ ...s.formInput, ...(formErrors.phone ? s.formInputErr : {}) }}
                      value={form.phone}
                      onChange={e => updateForm("phone", e.target.value)}
                      placeholder="+27 ..."
                    />
                    {formErrors.phone && <div style={s.errText}>{formErrors.phone}</div>}
                  </div>
                </div>

                {/* Section 2 — Programme Details */}
                <div style={s.sectionLbl}>
                  <span style={s.sectionLine} />
                  Programme Details
                  <span style={s.sectionLine} />
                </div>
                <div style={{ marginBottom: "0.85rem" }}>
                  <label style={s.formLabel}>Programme Type *</label>
                  <div style={s.radioGroup}>
                    {["ESD Programme", "Accelerator", "Incubator", "Other"].map(opt => (
                      <span
                        key={opt}
                        style={{ ...s.radioOpt, ...(form.programmeType === opt ? s.radioOptActive : {}) }}
                        onClick={() => updateForm("programmeType", opt)}
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                  {formErrors.programmeType && <div style={s.errText}>{formErrors.programmeType}</div>}
                </div>
                <div style={s.formGrid}>
                  <div>
                    <label style={s.formLabel}>Expected Number of SMEs *</label>
                    <select
                      style={{ ...s.formSelect, ...(formErrors.cohortSize ? s.formInputErr : {}) }}
                      value={form.cohortSize}
                      onChange={e => updateForm("cohortSize", e.target.value)}
                    >
                      <option value="">Select range</option>
                      {["10–20", "20–50", "50–100", "100+"].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    {formErrors.cohortSize && <div style={s.errText}>{formErrors.cohortSize}</div>}
                  </div>
                  <div>
                    <label style={s.formLabel}>Programme Duration *</label>
                    <select
                      style={{ ...s.formSelect, ...(formErrors.duration ? s.formInputErr : {}) }}
                      value={form.duration}
                      onChange={e => updateForm("duration", e.target.value)}
                    >
                      <option value="">Select duration</option>
                      {["12 months", "24 months", "36 months"].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    {formErrors.duration && <div style={s.errText}>{formErrors.duration}</div>}
                  </div>
                </div>

                {/* Section 3 — Requirements */}
                <div style={s.sectionLbl}>
                  <span style={s.sectionLine} />
                  Requirements
                  <span style={s.sectionLine} />
                </div>
                {[
                  { field: "requiresCustomReporting", label: "Custom Reporting" },
                  { field: "requiresIntegration",     label: "Integration" },
                  { field: "requiresMultiDivision",   label: "Multi-Division Support" },
                ].map(({ field, label }) => (
                  <div key={field} style={{ marginBottom: "0.7rem" }}>
                    <label style={s.formLabel}>{label}</label>
                    <div style={s.radioGroup}>
                      {["Yes", "No"].map(opt => (
                        <span
                          key={opt}
                          style={{ ...s.radioOpt, ...(form[field] === opt ? s.radioOptActive : {}) }}
                          onClick={() => updateForm(field, opt)}
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Section 4 — Notes */}
                <div style={s.sectionLbl}>
                  <span style={s.sectionLine} />
                  Additional Notes
                  <span style={s.sectionLine} />
                </div>
                <textarea
                  style={s.formTextarea}
                  value={form.notes}
                  onChange={e => updateForm("notes", e.target.value)}
                  placeholder="Describe your programme and any specific requirements..."
                />

                <button
                  style={{ ...s.submitBtn, opacity: submitting ? 0.7 : 1 }}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Proposal Request →"}
                </button>
                <button style={s.cancelBtn} onClick={closeProposalForm}>Cancel</button>
              </>
            )}

          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @media(max-width:900px){
          .cat-plan-grid { grid-template-columns: 1fr !important; }
          .cat-addons-grid { grid-template-columns: 1fr !important; }
          .cat-pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default CatalystSubscriptions