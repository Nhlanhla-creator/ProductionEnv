"use client"

import { useEffect, useState } from "react"
import { CheckCircle, ChevronRight, X, ArrowRight } from "lucide-react"
import "./AdvisoryApplication.css"
import AnalysisProgressOverlay from "./AnalysisProgressOverlay"
import AdvisoryRequestOverview from "./AdvisoryRequestOverview"
import { DocumentUploads } from "./DocumentUploads"
import ApplicationSummary from "./ApplicationSummary"
import { useAdvisoryApplications } from "../MyAdvisorMatches/hooks/useAdvisoryApplications"

export const sections = [
  { id: "advisoryNeedsAssessment", label: "Advisory Needs\nAssessment" },
  { id: "documentUploads", label: "Document\nUploads" },
]

const ONBOARDING_STEPS = [
  {
    title: "Welcome to Advisory Matching Application",
    content: "This application will help us understand your advisory needs and match you with the right advisors for your business.",
    icon: "🤝",
  },
  {
    title: "Step 1: Advisory Needs Assessment",
    content: "Tell us about the specific type of advisory support you need and your engagement preferences.",
    icon: "🎯",
  },
  {
    title: "Step 2: Document Uploads",
    content: "Upload any relevant documents that will help us make better matches.",
    icon: "📄",
  },
]

const CONTAINER_STYLE = {
  width: "100%",
  minHeight: "100vh",
  maxWidth: "100vw",
  overflowX: "hidden",
  padding: "0",
  margin: "0",
  boxSizing: "border-box",
  position: "relative",
}

export default function AdvisorApplication({
  applicationId = null,
  isNew = false,
  onNavigateBack,
  onNavigateToMatches,
  onAnalysisComplete,
}) {
  const [activeSection, setActiveSection] = useState("advisoryNeedsAssessment")
  const [showSummary, setShowSummary] = useState(false)
  const [validationModal, setValidationModal] = useState({ open: false, title: "", messages: [] })
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)

  const app = useAdvisoryApplications({ applicationId, isNew, onNavigateToMatches })

  // Show welcome popup once
  useEffect(() => {
    if (!app.isLoading && !localStorage.getItem("hasSeenAdvisoryOnboarding")) {
      setShowWelcomePopup(true)
    }
  }, [app.isLoading])

  // Sync summary view when a submitted app is loaded
  useEffect(() => {
    if (app.isSubmitted) setShowSummary(true)
  }, [app.isSubmitted])

  const closeValidation = () => setValidationModal({ open: false, title: "", messages: [] })

  const handleSaveAndContinue = async () => {
    const currentIndex = sections.findIndex((s) => s.id === activeSection)
    const nextSection = sections[currentIndex + 1]?.id
    if (!app.validate(activeSection)) {
      setValidationModal({
        open: true,
        title: "Please review the following:",
        messages: [`${sections.find((s) => s.id === activeSection)?.label.replace(/\n/g, " ")} is incomplete.`],
      })
      return
    }
    const saved = await app.saveSectionToFirebase(activeSection, true)
    if (saved && nextSection) {
      setActiveSection(nextSection)
      window.scrollTo(0, 0)
    }
  }

  const handleSectionClick = async (sectionId) => {
    if (sectionId === activeSection) return
    const shouldMark = app.validate(activeSection) && !app.completedSections[activeSection]
    await app.saveSectionToFirebase(activeSection, shouldMark)
    setActiveSection(sectionId)
    window.scrollTo(0, 0)
  }

  const handleDiscardChanges = () => {
    if (app.hasUnsavedChanges) {
      setShowDiscardConfirm(true)
    } else {
      onNavigateBack?.()
    }
  }

  const confirmDiscard = async () => {
    setShowDiscardConfirm(false)
    await app.discardChanges()
    onNavigateBack?.()
  }

  const handleSubmitApplication = async () => {
    if (!app.validateAll()) {
      setValidationModal({
        open: true,
        title: "Please complete all required sections before submitting:",
        messages: app.getInvalidSections(),
      })
      return
    }
    // Flush any dirty sections before full submit
    for (const section of sections) {
      const isDirty = section.id === "advisoryNeedsAssessment"
        ? JSON.stringify(app.formData) !== JSON.stringify({})
        : true
      if (!app.completedSections[section.id] || isDirty) {
        await app.saveSectionToFirebase(section.id, !app.completedSections[section.id])
      }
    }
    try {
      await app.submitApplication()
      if (onAnalysisComplete && app.currentDocId) onAnalysisComplete(app.currentDocId)
    } catch {
      alert("Failed to submit application. Please try again.")
    }
  }

  const renderSection = () => {
    switch (activeSection) {
      case "advisoryNeedsAssessment":
        return AdvisoryRequestOverview(app.formData, app.updateFormData)
      case "documentUploads":
        return DocumentUploads(
          app.formData.documentUploads,
          app.updateFormData,
          app.existingUniversalDocs,
          app.documentSelections,
          app.handleDocumentSelection
        )
      default:
        return null
    }
  }

  if (showSummary) {
    return (
      <ApplicationSummary
        formData={app.formData}
        onEdit={() => setShowSummary(false)}
        onBack={onNavigateBack}
        documentSelections={app.documentSelections}
        existingUniversalDocs={app.existingUniversalDocs}
      />
    )
  }

  if (!app.user) {
    return (
      <div style={CONTAINER_STYLE} className="funding-application-container">
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <h2>Authentication Required</h2>
          <p>Please sign in to access the Advisory Matching Application.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={CONTAINER_STYLE} className="funding-application-container">
      <AnalysisProgressOverlay progress={app.analysisProgress} isComplete={app.analysisComplete} />

      <SaveStatusBadge status={app.saveStatus} />

      {validationModal.open && (
        <Modal onClose={closeValidation}>
          <h2>{validationModal.title}</h2>
          <ul>{validationModal.messages.map((msg, i) => <li key={i}>{msg}</li>)}</ul>
          <button className="btn btn-primary" onClick={closeValidation}>Got it</button>
        </Modal>
      )}

      {showDiscardConfirm && (
        <Modal onClose={() => setShowDiscardConfirm(false)}>
          <h3>Discard changes?</h3>
          <p>You have unsaved changes that will be lost.</p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px" }}>
            <button className="btn btn-secondary" onClick={() => setShowDiscardConfirm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={confirmDiscard}>Discard</button>
          </div>
        </Modal>
      )}

      {showWelcomePopup && (
        <Modal onClose={() => setShowWelcomePopup(false)} maxWidth="600px">
          <div className="popup-icon">{ONBOARDING_STEPS[onboardingStep].icon}</div>
          <h2>{ONBOARDING_STEPS[onboardingStep].title}</h2>
          <p>{ONBOARDING_STEPS[onboardingStep].content}</p>
          <div className="popup-progress">
            {ONBOARDING_STEPS.map((_, i) => (
              <div key={i} className={`progress-dot ${i === onboardingStep ? "active" : ""}`} />
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "20px" }}>
            <button className="btn btn-secondary" onClick={() => setShowWelcomePopup(false)}>Skip</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (onboardingStep < ONBOARDING_STEPS.length - 1) {
                  setOnboardingStep((s) => s + 1)
                } else {
                  setShowWelcomePopup(false)
                  localStorage.setItem("hasSeenAdvisoryOnboarding", "true")
                }
              }}
            >
              {onboardingStep < ONBOARDING_STEPS.length - 1 ? "Next" : "Get Started"}
              <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}

      <div style={{ textAlign: "center", marginBottom: "30px", padding: "0 20px" }} className="application-header">
        <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", lineHeight: "1.2", margin: "0 0 10px 0" }}>
          Advisory Matching Application
        </h1>
        <p style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)", color: "#666", margin: "0", lineHeight: "1.4" }}>
          Complete all sections to submit your application
        </p>
      </div>

      <div className="section-tracker">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => handleSectionClick(section.id)}
            className={`section-button ${activeSection === section.id ? "active" : ""} ${app.completedSections[section.id] ? "completed" : ""}`}
          >
            <span className="section-label">{section.label}</span>
            {app.completedSections[section.id] && <CheckCircle size={16} className="completed-icon" />}
          </button>
        ))}
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          padding: "40px",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
        className="content-card"
      >
        <div style={{ width: "100%", overflowX: "auto" }}>{renderSection()}</div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "30px",
            padding: "20px 0",
            borderTop: "1px solid #eee",
            flexWrap: "wrap",
          }}
          className="action-buttons"
        >
          <button
            type="button"
            onClick={handleDiscardChanges}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "10px 15px",
              fontSize: "clamp(0.8rem, 2vw, 1rem)",
              minWidth: "140px",
              justifyContent: "center",
              backgroundColor: "#f3f4f6",
              color: "#4b5563",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              cursor: "pointer",
            }}
            className="btn btn-secondary"
          >
            Discard Changes
          </button>

          {activeSection !== "documentUploads" ? (
            <button
              type="button"
              onClick={handleSaveAndContinue}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "10px 15px",
                fontSize: "clamp(0.8rem, 2vw, 1rem)",
                minWidth: "140px",
                justifyContent: "center",
              }}
              className="btn btn-primary"
            >
              Save & Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitApplication}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "10px 15px",
                fontSize: "clamp(0.8rem, 2vw, 1rem)",
                minWidth: "140px",
                justifyContent: "center",
              }}
              className="btn btn-primary"
            >
              Submit Application
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Small local components ────────────────────────────────────────────────────

function SaveStatusBadge({ status }) {
  if (!status) return null
  const styles = {
    saved: { bg: "#d4edda", color: "#155724", border: "#c3e6cb" },
    error: { bg: "#f8d7da", color: "#721c24", border: "#f5c6cb" },
    saving: { bg: "#fff3cd", color: "#856404", border: "#ffeaa7" },
  }
  const s = styles[status] || styles.saving
  return (
    <div
      style={{
        position: "fixed",
        top: "100px",
        right: "20px",
        padding: "10px 15px",
        borderRadius: "4px",
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        zIndex: 1000,
        fontSize: "14px",
      }}
    >
      {status === "saving" && "Saving..."}
      {status === "saved" && "Saved"}
      {status === "error" && "Save failed"}
    </div>
  )
}

function Modal({ children, onClose, maxWidth = "500px" }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "20px",
        boxSizing: "border-box",
      }}
      className="popup-overlay"
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "20px",
          maxWidth,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          position: "relative",
        }}
        className="popup-content"
      >
        <button
          style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", cursor: "pointer", padding: "5px" }}
          onClick={onClose}
        >
          <X size={24} />
        </button>
        {children}
      </div>
    </div>
  )
}