"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronRight, ChevronLeft, Save, CheckCircle, Loader2 } from "lucide-react"
import { sections } from "./applicationOptions"
import RequestOverview from "./RequestOverview"
import ProductsServices from "./ProductsServices"
import MatchingPreferences from "./MatchingPreferences"
import ApplicationSummary from "./application-summary"
import ProductApplicationTracker from "./ProductApplicationTracker"
import "./ProductApplication.css"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { fetchAllSuppliers } from "../hooks/useMatches"
import { runAiAnalysisForApplication } from "../MySupplierMatches/supplier-table"

// ── Inline toast ─────────────────────────────────────────────────────────────

const TOAST_TYPES = {
  success: { bg: "#22c55e", icon: "✓" },
  error: { bg: "#ef4444", icon: "✕" },
  info: { bg: "#a67c52", icon: "ℹ" },
}

const Toast = ({ toast }) => {
  if (!toast) return null
  const { bg, icon } = TOAST_TYPES[toast.type] || TOAST_TYPES.info
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 20px",
        background: bg,
        color: "#fff",
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        fontSize: "0.9rem",
        fontWeight: 500,
        maxWidth: 380,
        animation: "toastIn 0.25s ease",
      }}
    >
      <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{icon}</span>
      <span>{toast.message}</span>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

const ProductApplication = ({
  embedded = false,
  onNavigateToMatches,
  onNavigateToDashboard,
  onNavigateBack,
  initialSectionId,
  applicationId = null,
  forceEdit = false,
  onAnalysisComplete = null,
  onAnalysisProgress = null,
}) => {
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [loadingApplication, setLoadingApplication] = useState(!!applicationId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  /**
   * currentAppId persists the generated doc ID across all saves in this session
   * so that every "Save", "Save & Continue", and "Submit" all write to the
   * SAME Firestore document — preventing duplicate application docs.
   */
  const [currentAppId, setCurrentAppId] = useState(applicationId)

  const [activeSection, setActiveSection] = useState(() => initialSectionId || sections[0].id)
  const [completedSections, setCompletedSections] = useState(() =>
    Object.fromEntries(sections.map((s) => [s.id, false]))
  )
  const [formData, setFormData] = useState({
    matchingPreferences: {
      bbeeLevel: "",
      ownershipPrefs: [],
      sectorExperience: "",
      engagementType: "",
      engagementTypeOther: "",
      deliveryModes: [],
      startDate: "",
      endDate: "",
      location: "",
      minBudget: "",
      maxBudget: "",
      esdProgram: null,
    },
    requestOverview: {
      purpose: "",
      categories: [],
      subcategories: [],
      keywords: "",
      scopeOfWorkFiles: [],
    },
    productsServices: {
      categories: [],
      keywords: "",
      scopeOfWorkFiles: [],
    },
  })

  // Clean up toast timer on unmount
  useEffect(() => {
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }
  }, [])

  const showToast = (type, message, durationMs = 4000) => {
    setToast({ type, message })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), durationMs)
  }

  useEffect(() => {
    if (applicationId) loadApplication(applicationId)
  }, [applicationId])

  const loadApplication = async (appId) => {
    try {
      setLoadingApplication(true)
      const docRef = doc(db, "productApplications", appId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setFormData({
          matchingPreferences: {
            bbeeLevel: data.matchingPreferences?.bbeeLevel || "",
            ownershipPrefs: data.matchingPreferences?.ownershipPrefs || [],
            sectorExperience: data.matchingPreferences?.sectorExperience || "",
            engagementType: data.matchingPreferences?.engagementType || "",
            engagementTypeOther: data.matchingPreferences?.engagementTypeOther || "",
            deliveryModes: data.matchingPreferences?.deliveryModes || [],
            startDate: data.matchingPreferences?.startDate || "",
            endDate: data.matchingPreferences?.endDate || "",
            location: data.matchingPreferences?.location || "",
            minBudget: data.matchingPreferences?.minBudget || "",
            maxBudget: data.matchingPreferences?.maxBudget || "",
            esdProgram: data.matchingPreferences?.esdProgram ?? null,
          },
          requestOverview: {
            purpose: data.requestOverview?.purpose || "",
            categories: data.requestOverview?.categories || [],
            subcategories: data.requestOverview?.subcategories || [],
            keywords: data.requestOverview?.keywords || "",
            scopeOfWorkFiles: data.requestOverview?.scopeOfWorkFiles || [],
          },
          productsServices: {
            categories: data.productsServices?.categories || [],
            keywords: data.productsServices?.keywords || "",
            scopeOfWorkFiles: data.productsServices?.scopeOfWorkFiles || [],
          },
        })
        setCompletedSections(
          data.completedSections || Object.fromEntries(sections.map((s) => [s.id, false]))
        )
        const submitted = data.status === "submitted"
        setApplicationSubmitted(submitted)
        if (submitted && !forceEdit) setShowSummary(true)
      }
    } catch (err) {
      console.error("❌ Error loading application:", err)
      showToast("error", "Failed to load application data.")
    } finally {
      setLoadingApplication(false)
    }
  }

  const goToSection = (sectionId) => {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return
    setActiveSection(section.id)
    setShowSummary(false)
    window.scrollTo(0, 0)
  }

  const handleEditApplication = () => {
    setShowSummary(false)
    setActiveSection(sections[0].id)
    window.scrollTo(0, 0)
  }

  const updateFormData = (section, newData) => {
    setFormData((prev) => ({ ...prev, [section]: { ...prev[section], ...newData } }))
  }

  const goToNextSection = () => {
    const idx = sections.findIndex((s) => s.id === activeSection)
    if (idx < sections.length - 1) {
      setCompletedSections((prev) => ({ ...prev, [activeSection]: true }))
      goToSection(sections[idx + 1].id)
    }
  }

  const goToPreviousSection = () => {
    const idx = sections.findIndex((s) => s.id === activeSection)
    if (idx > 0) goToSection(sections[idx - 1].id)
  }

  /**
   * All Firestore writes funnel through here. Uses `currentAppId` so every
   * save in a session targets the same document. Generates and persists the
   * ID on first call, then reuses it for every subsequent save.
   */
  const saveDataToFirebase = async (overrides = {}) => {
    const user = auth.currentUser
    if (!user) throw new Error("User not logged in.")
    const docId = currentAppId || `${user.uid}_${Date.now()}`
    if (!currentAppId) setCurrentAppId(docId)
    await setDoc(
      doc(db, "productApplications", docId),
      {
        ...formData,
        userId: user.uid,
        completedSections: { ...completedSections },
        lastUpdated: serverTimestamp(),
        status: applicationSubmitted ? "submitted" : "draft",
        ...overrides,
      },
      { merge: true }
    )
    return docId
  }

  const handleSaveSection = async () => {
    if (isSaving) return
    try {
      setIsSaving(true)
      setCompletedSections((prev) => ({ ...prev, [activeSection]: true }))
      await saveDataToFirebase()
      showToast("success", "Section saved.")
    } catch (err) {
      console.error("❌ Error saving:", err)
      showToast("error", "Failed to save. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAndContinue = async () => {
    if (isSaving) return
    try {
      setIsSaving(true)
      setCompletedSections((prev) => ({ ...prev, [activeSection]: true }))
      await saveDataToFirebase()
      goToNextSection()
    } catch (err) {
      console.error("❌ Error saving:", err)
      showToast("error", "Failed to save. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Kick off AI analysis in the background after submission.
   * Errors are swallowed — this should never block or surface to the user.
   * After completion, calls onAnalysisComplete callback if provided.
   * Progress is reported via onAnalysisProgress callback.
   */
  const triggerAiAnalysisInBackground = async (docId, currentFormData) => {
    try {
      const suppliers = await fetchAllSuppliers()
      if (!suppliers.length) return
      const appForAi = { id: docId, ...currentFormData }
      
      await runAiAnalysisForApplication(appForAi, suppliers, {
        onProgress: (progress) => {
          if (onAnalysisProgress) {
            onAnalysisProgress(progress)
          }
        },
      })
      
      // Notify parent to refresh AI cache in useMatches hook
      if (onAnalysisComplete) {
        onAnalysisComplete(docId)
      }
    } catch (err) {
      // Silently handle errors — this should never block user
    }
  }

  const submitApplication = async () => {
    // Guard against double-submit (e.g. rapid clicks)
    if (isSubmitting) return
    try {
      setIsSubmitting(true)
      const allCompleted = Object.fromEntries(sections.map((s) => [s.id, true]))
      setCompletedSections(allCompleted)
      setApplicationSubmitted(true)

      const docId = await saveDataToFirebase({
        completedSections: allCompleted,
        status: "submitted",
      })

      showToast("success", "Application submitted! Finding your matches…", 6000)
      setShowSummary(true)
      window.scrollTo(0, 0)

      // Fire-and-forget — never awaited at the call site
      triggerAiAnalysisInBackground(docId, formData)
    } catch (err) {
      console.error("❌ Failed to submit:", err)
      showToast("error", "Submission failed. Please try again.")
      setApplicationSubmitted(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderActiveSection = () => {
    const sectionProps = {
      data: formData[activeSection] || {},
      updateData: (newData) => updateFormData(activeSection, newData),
      // Only wire onSubmit on the last preferences step
      onSubmit: activeSection === "matchingPreferences" ? submitApplication : undefined,
      applicationId: currentAppId,
    }
    switch (activeSection) {
      case "matchingPreferences": return <MatchingPreferences {...sectionProps} />
      case "requestOverview": return <RequestOverview {...sectionProps} />
      case "productsServices": return <ProductsServices {...sectionProps} />
      default: return <MatchingPreferences {...sectionProps} />
    }
  }

  const containerStyles = embedded
    ? { width: "100%", maxWidth: "100%", margin: 0, padding: "20px", backgroundColor: "#f9f9f9", minHeight: "auto", boxSizing: "border-box" }
    : { width: "100%", minHeight: "100vh", maxWidth: "100vw", overflowX: "hidden", margin: "0", boxSizing: "border-box", position: "relative" }

  if (loadingApplication) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", gap: 10, color: "#a67c52" }}>
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
        <span>Loading application…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (showSummary) {
    return (
      <>
        <Toast toast={toast} />
        <ApplicationSummary
          data={formData}
          onEdit={handleEditApplication}
          applicationId={currentAppId}
          onBack={embedded ? onNavigateBack : undefined}
        />
      </>
    )
  }

  return (
    <div
      style={containerStyles}
      className={`product-application-container ${embedded ? "embedded" : ""}`}
    >
      <Toast toast={toast} />

      {embedded && onNavigateBack && (
        <button
          onClick={onNavigateBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 0",
            background: "none",
            border: "none",
            color: "#a67c52",
            cursor: "pointer",
            marginBottom: "16px",
            fontSize: "14px",
            fontWeight: "500",
          }}
          type="button"
        >
          <ChevronLeft size={20} /> Back to Applications
        </button>
      )}

      <h1
        style={{
          width: "100%",
          textAlign: "center",
          margin: embedded ? "0 0 15px 0" : "20px 0",
          fontSize: embedded ? "1.2rem" : "clamp(1.5rem, 4vw, 2.5rem)",
          lineHeight: 1.2,
          wordBreak: "break-word",
          color: embedded ? "#333" : "inherit",
          display: "block",
        }}
      >
        {currentAppId ? "Edit Application" : "Products/Services Request"}
      </h1>

      <ProductApplicationTracker
        activeSection={activeSection}
        completedSections={completedSections}
        onSectionChange={goToSection}
        embedded={embedded}
      />

      <div
        className="content-card"
        style={{
          width: "100%",
          maxWidth: "100%",
          padding: embedded ? "15px" : "20px",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: embedded ? "6px" : "8px",
          boxShadow: embedded ? "0 1px 3px rgba(0,0,0,0.1)" : "0 2px 4px rgba(0,0,0,0.1)",
          boxSizing: "border-box",
          overflow: "hidden",
          border: embedded ? "1px solid #e0e0e0" : "none",
        }}
      >
        {/* Submission overlay — shown while submitting */}
        {isSubmitting && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.82)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              zIndex: 10,
              borderRadius: embedded ? "6px" : "8px",
            }}
          >
            <Loader2 size={36} color="#a67c52" style={{ animation: "spin 0.9s linear infinite" }} />
            <p style={{ color: "#5d2a0a", fontWeight: 600, fontSize: "1rem", margin: 0 }}>
              Submitting your application…
            </p>
            <p style={{ color: "#8d6e63", fontSize: "0.85rem", margin: 0 }}>
              This will only take a moment.
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        <div style={{ width: "100%", overflowX: "auto" }}>
          {renderActiveSection()}
        </div>

        {/* Navigation */}
        <div
          style={{
            display: "flex",
            gap: embedded ? "8px" : "10px",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: embedded ? "20px" : "30px",
            padding: embedded ? "15px 0" : "20px 0",
            borderTop: "1px solid #eee",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          {activeSection !== sections[0].id && (
            <button
              type="button"
              onClick={goToPreviousSection}
              disabled={isSaving || isSubmitting}
              className="btn btn-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: embedded ? "8px 12px" : "10px 15px",
                fontSize: embedded ? "0.8rem" : "clamp(0.8rem, 2vw, 1rem)",
                minWidth: embedded ? "80px" : "100px",
                justifyContent: "center",
                opacity: isSaving || isSubmitting ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={embedded ? 14 : 16} /> Previous
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveSection}
            disabled={isSaving || isSubmitting}
            className="btn btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: embedded ? "8px 12px" : "10px 15px",
              fontSize: embedded ? "0.8rem" : "clamp(0.8rem, 2vw, 1rem)",
              minWidth: embedded ? "80px" : "100px",
              justifyContent: "center",
              opacity: isSaving || isSubmitting ? 0.5 : 1,
            }}
          >
            {isSaving
              ? <><Loader2 size={embedded ? 13 : 15} style={{ animation: "spin 0.9s linear infinite" }} /> Saving…</>
              : <><Save size={embedded ? 14 : 16} /> Save</>
            }
          </button>

          {activeSection !== sections[sections.length - 1].id && (
            <button
              type="button"
              onClick={handleSaveAndContinue}
              disabled={isSaving || isSubmitting}
              className="btn btn-primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: embedded ? "8px 12px" : "10px 15px",
                fontSize: embedded ? "0.8rem" : "clamp(0.8rem, 2vw, 1rem)",
                minWidth: embedded ? "120px" : "140px",
                justifyContent: "center",
                opacity: isSaving || isSubmitting ? 0.5 : 1,
              }}
            >
              {isSaving ? "Saving…" : <>Save & Continue <ChevronRight size={embedded ? 14 : 16} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductApplication