"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
} from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { useNavigate } from "react-router-dom"

import { auth } from "../../firebaseConfig"

import { renderApplicationOverview } from "./ApplicationOverview"
import { renderUseOfFunds } from "./UseOfFunds"
import { renderEnterpriseReadiness } from "./EnterpriseReadiness"
import { renderGuarantees } from "./Gurantees"
import { renderGrowthPotential } from "./GrowthPotential"
import { renderSocialImpact } from "./SocialImpact"
import { renderDocumentUpload } from "./DocumentUpload"
import { renderDeclarationCommitment } from "./DeclarationCommitment"

import ApplicationSummary from "./application-summary"
import AnalysisProgressOverlay from "./AnalysisProgressOverlay"
import { useFundingApplications } from "./hooks/useFundingApplications"

import "./FundingApplication.css"

// ============================================================
// Funding sections
// Financial Overview is handled in Universal Profile.
// ============================================================

const sectionsWithGuarantees = [
  {
    id: "applicationOverview",
    label: "Application\nOverview",
  },
  {
    id: "useOfFunds",
    label: "Use of\nFunds",
  },
  {
    id: "enterpriseReadiness",
    label: "Enterprise\nReadiness",
  },
  {
    id: "guarantees",
    label: "Guarantees",
  },
  {
    id: "growthPotential",
    label: "Growth\nPotential",
  },
  {
    id: "socialImpact",
    label: "Social\nImpact",
  },
  {
    id: "documentUpload",
    label: "Document\nUpload",
  },
  {
    id: "declarationCommitment",
    label: "Declaration &\nCommitment",
  },
]

const onboardingSteps = [
  {
    title: "Welcome to Funding Application",
    content:
      "This application helps us understand your funding needs and how we can support your business growth.",
    icon: "💰",
  },
  {
    title: "Step 1: Application Overview",
    content:
      "Start by providing basic information about your funding request and business needs.",
    icon: "📋",
  },
  {
    title: "Step 2: Funding and Readiness",
    content:
      "Complete your funding ask, use of funds, business readiness, guarantees, growth potential, and social impact.",
    icon: "📊",
  },
  {
    title: "Step 3: Upload Documents",
    content:
      "Upload the required budgets, bank confirmations, and financial statements.",
    icon: "📄",
  },
  {
    title: "Step 4: Save and Submit",
    content:
      "You can save incomplete sections and continue. We will show what is still missing. Complete all required fields before final submission.",
    icon: "✅",
  },
]

// ============================================================
// Existing layout styles
// ============================================================

const pageStyle = {
  width: "100%",
  minHeight: "100vh",
  maxWidth: "100%",
  overflowX: "visible",
  padding: "0 20px",
  margin: "0 auto",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  flex: 1,
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  padding: "20px",
  boxSizing: "border-box",
}

const popupStyle = {
  backgroundColor: "white",
  borderRadius: "8px",
  padding: "20px",
  maxHeight: "90vh",
  overflow: "auto",
  position: "relative",
  width: "100%",
  maxWidth: "600px",
  boxSizing: "border-box",
}

const closeButtonStyle = {
  position: "absolute",
  top: "10px",
  right: "10px",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "5px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}

const popupButtonsStyle = {
  display: "flex",
  gap: "10px",
  justifyContent: "center",
  flexWrap: "wrap",
  marginTop: "20px",
}

const actionButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  padding: "10px 15px",
  fontSize: "clamp(0.8rem, 2vw, 1rem)",
  minWidth: "100px",
  justifyContent: "center",
}

const emptyValidationModal = {
  open: false,
  title: "",
  messages: [],
}

// ============================================================
// Component
// ============================================================

const FundingApplication = ({
  applicationId = null,
  isNew = false,
  onBack,
  onNavigateToMatches,
  onAnalysisComplete,
}) => {
  const navigate = useNavigate()

  const [activeSection, setActiveSection] = useState(
    "applicationOverview"
  )

  const [showSummary, setShowSummary] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [validationModal, setValidationModal] = useState(
    emptyValidationModal
  )

  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [showCongratulationsPopup, setShowCongratulationsPopup] =
    useState(false)

  const [currentOnboardingStep, setCurrentOnboardingStep] =
    useState(0)

  const [isSavingSection, setIsSavingSection] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzingGuarantees, setIsAnalyzingGuarantees] =
    useState(false)

  const guaranteesAiRef = useRef(null)
  const savingSectionRef = useRef(false)
  const submittingRef = useRef(false)

  // The hook owns validation, file uploads, completion tracking,
  // and fundability-analysis requests.
  //
  // Navigation is handled by this page's View Matches button,
  // allowing the existing congratulations popup to remain visible.
  const {
    user,
    formData,
    completedSections,
    isLoading,
    updateFormData,
    saveSectionToFirebase,
    submitApplication,
    analysisProgress,
    analysisComplete,
    hasUnsavedChanges,
    existingUniversalDocs,
    getValidationMessages,
  } = useFundingApplications({
    applicationId,
    isNew,
  })

  const isBusy =
    isSavingSection ||
    isSubmitting ||
    isAnalyzingGuarantees

  const currentSectionIndex = sectionsWithGuarantees.findIndex(
    (section) => section.id === activeSection
  )

  const currentSectionLabel =
    sectionsWithGuarantees
      .find((section) => section.id === activeSection)
      ?.label.replace(/\n/g, " ") || activeSection

  // ==========================================================
  // Authentication
  // ==========================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setAuthChecked(true)
        setIsAuthenticated(Boolean(currentUser))

        if (!currentUser) {
          navigate("/login", { replace: true })
        }
      }
    )

    return unsubscribe
  }, [navigate])

  // ==========================================================
  // User-specific onboarding preferences
  // ==========================================================

  const getUserSpecificKey = (baseKey) => {
    const userId = auth.currentUser?.uid

    return userId
      ? `${baseKey}_${userId}`
      : baseKey
  }

  const hasSeenPopup = (baseKey) => {
    try {
      return (
        localStorage.getItem(getUserSpecificKey(baseKey)) ===
        "true"
      )
    } catch {
      return false
    }
  }

  const markPopupSeen = (baseKey) => {
    try {
      localStorage.setItem(
        getUserSpecificKey(baseKey),
        "true"
      )
    } catch (error) {
      console.error(
        "Unable to save onboarding preference:",
        error
      )
    }
  }

  useEffect(() => {
    if (
      !authChecked ||
      !isAuthenticated ||
      !user ||
      isLoading
    ) {
      return
    }

    const storageKey =
      `hasSeenFundingOnboarding_${user.uid}`

    try {
      setShowWelcomePopup(
        localStorage.getItem(storageKey) !== "true"
      )
    } catch {
      setShowWelcomePopup(true)
    }
  }, [
    authChecked,
    isAuthenticated,
    user,
    isLoading,
  ])

  // Reset page navigation when opening a different application.
  useEffect(() => {
    setActiveSection("applicationOverview")
    setShowSummary(false)
    setShowCongratulationsPopup(false)
    setCurrentOnboardingStep(0)
    setValidationModal(emptyValidationModal)
  }, [applicationId, isNew])

  // ==========================================================
  // Unsaved changes
  // ==========================================================

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!hasUnsavedChanges) return

      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    )

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      )
    }
  }, [hasUnsavedChanges])

  const handleBackClick = () => {
    if (isBusy) return

    if (
      hasUnsavedChanges &&
      !window.confirm(
        "You have unsaved changes. Leave this application?"
      )
    ) {
      return
    }

    onBack?.()
  }

  // ==========================================================
  // Navigation
  // ==========================================================

  const selectSection = (sectionId) => {
    if (isBusy) return

    setActiveSection(sectionId)
    window.scrollTo(0, 0)
  }

  const navigateToPreviousSection = () => {
    if (isBusy || currentSectionIndex <= 0) return

    const previousSection =
      sectionsWithGuarantees[currentSectionIndex - 1]

    if (previousSection) {
      setActiveSection(previousSection.id)
      window.scrollTo(0, 0)
    }
  }

  const handleEditApplication = () => {
    setShowSummary(false)
    setShowCongratulationsPopup(false)
    setActiveSection("applicationOverview")
    window.scrollTo(0, 0)
  }

  const handleNavigateToDashboard = () => {
    navigate("/dashboard")
  }

  const handleViewMatches = () => {
    if (onNavigateToMatches) {
      onNavigateToMatches()
    } else {
      navigate("/funding-matches")
    }
  }

  // ==========================================================
  // Popup handlers
  // ==========================================================

  const closeValidationModal = () => {
    setValidationModal(emptyValidationModal)
  }

  const handleCloseWelcomePopup = () => {
    setShowWelcomePopup(false)
    markPopupSeen("hasSeenFundingOnboarding")
  }

  const handleNextOnboardingStep = () => {
    if (
      currentOnboardingStep <
      onboardingSteps.length - 1
    ) {
      setCurrentOnboardingStep((previous) => previous + 1)
      return
    }

    handleCloseWelcomePopup()
  }

  const handleCloseCongratulationsPopup = () => {
    setShowCongratulationsPopup(false)
    setShowSummary(true)
    window.scrollTo(0, 0)
  }

  // ==========================================================
  // Existing guarantee analysis
  // A scoring failure does not prevent draft saving.
  // ==========================================================

  const runGuaranteesAnalysisIfNeeded = async (
    sectionId = activeSection
  ) => {
    if (sectionId !== "guarantees") return

    const api = guaranteesAiRef.current

    if (!api) return

    try {
      if (
        typeof api.hasPendingChanges !== "function" ||
        typeof api.runAnalysis !== "function" ||
        !api.hasPendingChanges()
      ) {
        return
      }

      setIsAnalyzingGuarantees(true)
      await api.runAnalysis()
    } catch (error) {
      console.error(
        "Guarantees analysis failed:",
        error
      )
    } finally {
      setIsAnalyzingGuarantees(false)
    }
  }

  // ==========================================================
  // Save / Save & Continue
  //
  // Incomplete data:
  // - is saved as a draft
  // - stays marked incomplete
  // - produces specific missing-field messages
  // - can continue to the next section
  //
  // Fundability analysis is requested by the updated hook after
  // each successful section save.
  // ==========================================================

  const persistFundingSection = async (
    continueAfterSave
  ) => {
    if (
      savingSectionRef.current ||
      submittingRef.current
    ) {
      return
    }

    const sectionId = activeSection

    const sectionLabel =
      sectionsWithGuarantees
        .find((section) => section.id === sectionId)
        ?.label.replace(/\n/g, " ") || sectionId

    savingSectionRef.current = true
    setIsSavingSection(true)

    try {
      await runGuaranteesAnalysisIfNeeded(sectionId)

      const result =
        await saveSectionToFirebase(sectionId)

      if (!result?.saved) {
        throw new Error(
          "Your changes could not be saved. Please try again."
        )
      }

      const messages = (result.issues || []).map(
        (message) => `${sectionLabel}: ${message}`
      )

      if (result.warning) {
        messages.push(result.warning)
      }

      if (continueAfterSave) {
        const savedSectionIndex =
          sectionsWithGuarantees.findIndex(
            (section) => section.id === sectionId
          )

        const nextSection =
          sectionsWithGuarantees[
            savedSectionIndex + 1
          ]

        if (nextSection) {
          setActiveSection(nextSection.id)
          window.scrollTo(0, 0)
        }
      }

      if (messages.length > 0) {
        setValidationModal({
          open: true,
          title: result.complete
            ? "Section saved — please review"
            : "Draft saved — information still needed",
          messages,
        })
      } else if (!continueAfterSave) {
        setValidationModal({
          open: true,
          title: "Section saved",
          messages: [
            "Your section is complete.",
            ...(result.analysisRequested
              ? ["Fundability analysis was requested."]
              : []),
          ],
        })
      }
    } catch (error) {
      console.error(
        "Unable to save funding section:",
        error
      )

      setValidationModal({
        open: true,
        title: "Unable to save",
        messages: [
          error.message ||
            "Please try saving this section again.",
        ],
      })
    } finally {
      savingSectionRef.current = false
      setIsSavingSection(false)
    }
  }

  const handleSaveSection = () => {
    return persistFundingSection(false)
  }

  const handleSaveAndContinue = () => {
    return persistFundingSection(true)
  }

  // ==========================================================
  // Final submission
  // Uses the same validator as the hook.
  // No hidden financialOverview validation.
  // No stale completedSections requirement.
  // ==========================================================

  const handleSubmitApplication = async () => {
    if (
      submittingRef.current ||
      savingSectionRef.current
    ) {
      return
    }

    const messages = getValidationMessages()

    if (messages.length > 0) {
      setValidationModal({
        open: true,
        title: "Complete these items before submitting",
        messages,
      })

      return
    }

    submittingRef.current = true
    setIsSubmitting(true)

    try {
      const result = await submitApplication()

      if (!result?.submitted) {
        throw new Error(
          "Your application could not be submitted."
        )
      }

      // Parent callback errors must not be presented as failed
      // submission after Firebase has already saved the app.
      try {
        onAnalysisComplete?.(result.documentId)
      } catch (callbackError) {
        console.error(
          "Analysis completion callback failed:",
          callbackError
        )
      }

      const alreadySeen = hasSeenPopup(
        "hasSeenFundingCongratulationsPopup"
      )

      if (!alreadySeen) {
        markPopupSeen(
          "hasSeenFundingCongratulationsPopup"
        )

        setShowCongratulationsPopup(true)
      } else {
        setShowSummary(true)
      }

      if (result.warning) {
        setValidationModal({
          open: true,
          title: "Application submitted — please review",
          messages: [result.warning],
        })
      }

      window.scrollTo(0, 0)
    } catch (error) {
      console.error(
        "Funding submission failed:",
        error
      )

      setValidationModal({
        open: true,
        title: error.applicationSubmitted
          ? "Application submitted — matching failed"
          : "Unable to submit application",
        messages:
          error.validationMessages || [
            error.message ||
              "Please try submitting again.",
          ],
      })
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  // ==========================================================
  // Section rendering
  // ==========================================================

  const renderActiveSection = () => {
    switch (activeSection) {
      case "applicationOverview":
        return renderApplicationOverview(
          formData.applicationOverview || {},
          updateFormData
        )

      case "useOfFunds":
        return renderUseOfFunds(
          formData.useOfFunds || {},
          updateFormData
        )

      case "enterpriseReadiness":
        return renderEnterpriseReadiness(
          formData.enterpriseReadiness || {},
          updateFormData,
          null,
          (response, score, label) => {
            updateFormData("enterpriseReadiness", {
              aiEvaluation: {
                response,
                score,
                label,
                timestamp: new Date().toISOString(),
              },
            })
          },
          existingUniversalDocs
        )

      case "guarantees":
        return renderGuarantees(
          formData.guarantees || {},
          updateFormData,
          guaranteesAiRef
        )

      case "growthPotential":
        return renderGrowthPotential(
          formData.growthPotential || {},
          updateFormData
        )

      case "socialImpact":
        return renderSocialImpact(
          formData.socialImpact || {},
          updateFormData
        )

      case "documentUpload":
        return renderDocumentUpload(
          formData.documentUpload || {},
          updateFormData
        )

      case "declarationCommitment":
        return renderDeclarationCommitment(
          formData.declarationCommitment || {},
          updateFormData
        )

      default:
        return renderApplicationOverview(
          formData.applicationOverview || {},
          updateFormData
        )
    }
  }

  // ==========================================================
  // Shared validation popup
  // Also rendered over ApplicationSummary when needed.
  // ==========================================================

  const renderValidationModal = () => {
    if (!validationModal.open) return null

    return (
      <div style={overlayStyle}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="funding-validation-title"
          style={{
            ...popupStyle,
            maxWidth: "500px",
            paddingTop: "45px",
          }}
          className="validation-popup"
        >
          <button
            type="button"
            aria-label="Close notification"
            style={closeButtonStyle}
            onClick={closeValidationModal}
          >
            <X size={24} />
          </button>

          <div className="popup-content">
            <h2 id="funding-validation-title">
              {validationModal.title}
            </h2>

            <ul
              style={{
                textAlign: "left",
                paddingLeft: "22px",
                lineHeight: "1.6",
              }}
            >
              {validationModal.messages.map(
                (message, index) => (
                  <li
                    key={`${index}-${message}`}
                    style={{ marginBottom: "8px" }}
                  >
                    {message}
                  </li>
                )
              )}
            </ul>

            <button
              type="button"
              className="btn btn-primary"
              onClick={closeValidationModal}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================================
  // Loading / authentication
  // ==========================================================

  if (
    !authChecked ||
    !isAuthenticated ||
    (isLoading && !analysisProgress)
  ) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          maxWidth: "100vw",
          overflowX: "hidden",
          padding: 0,
          margin: 0,
          boxSizing: "border-box",
        }}
        className="loading"
      >
        <div className="spinner" />

        <div className="loading-message">
          Preparing next step...
        </div>
      </div>
    )
  }

  // ==========================================================
  // Application summary
  // ==========================================================

  if (showSummary) {
    return (
      <>
        <ApplicationSummary
          formData={formData}
          onEdit={handleEditApplication}
          onBack={
            onBack ? handleBackClick : undefined
          }
        />

        {renderValidationModal()}
      </>
    )
  }

  // ==========================================================
  // Full page
  // ==========================================================

  return (
    <div
      style={pageStyle}
      className="funding-application-container"
    >
      {renderValidationModal()}

      {/* Welcome popup */}
      {showWelcomePopup && (
        <div
          style={overlayStyle}
          className="popup-overlay"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="funding-welcome-title"
            style={popupStyle}
            className="welcome-popup"
          >
            <button
              type="button"
              aria-label="Close welcome"
              style={closeButtonStyle}
              className="close-popup"
              onClick={handleCloseWelcomePopup}
            >
              <X size={24} />
            </button>

            <div className="popup-content">
              <div className="popup-icon">
                {
                  onboardingSteps[
                    currentOnboardingStep
                  ].icon
                }
              </div>

              <h2 id="funding-welcome-title">
                {
                  onboardingSteps[
                    currentOnboardingStep
                  ].title
                }
              </h2>

              <p>
                {
                  onboardingSteps[
                    currentOnboardingStep
                  ].content
                }
              </p>

              <div className="popup-progress">
                {onboardingSteps.map(
                  (_, index) => (
                    <div
                      key={index}
                      className={`progress-dot ${
                        index ===
                        currentOnboardingStep
                          ? "active"
                          : ""
                      }`}
                    />
                  )
                )}
              </div>

              <div
                style={popupButtonsStyle}
                className="popup-buttons"
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseWelcomePopup}
                >
                  Skip
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNextOnboardingStep}
                >
                  {currentOnboardingStep <
                  onboardingSteps.length - 1
                    ? "Next"
                    : "Get Started"}

                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Congratulations popup */}
      {showCongratulationsPopup && (
        <div
          style={overlayStyle}
          className="popup-overlay"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="funding-congratulations-title"
            style={popupStyle}
            className="congratulations-popup"
          >
            <button
              type="button"
              aria-label="Close congratulations"
              style={closeButtonStyle}
              className="close-popup"
              onClick={
                handleCloseCongratulationsPopup
              }
            >
              <X size={24} />
            </button>

            <div className="popup-content">
              <div className="confetti-animation">
                🎉
              </div>

              <h2 id="funding-congratulations-title">
                Congratulations!
              </h2>

              <p>
                You&apos;ve successfully completed
                your Funding Application!
              </p>

              <p>
                You can now view your application
                summary, view your matches, or
                proceed to the dashboard.
              </p>

              <div
                style={popupButtonsStyle}
                className="popup-buttons-group"
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={
                    handleCloseCongratulationsPopup
                  }
                >
                  View Summary
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleViewMatches}
                >
                  View Matches
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={
                    handleNavigateToDashboard
                  }
                >
                  Go to Big Score
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      {onBack && (
        <button
          type="button"
          onClick={handleBackClick}
          disabled={isBusy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 0",
            marginBottom: 14,
            background: "none",
            border: "none",
            color: "#a67c52",
            cursor: isBusy
              ? "default"
              : "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.color =
              "#7d5a50"
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.color =
              "#a67c52"
          }}
        >
          <ChevronLeft size={19} />
          Back to Applications
        </button>
      )}

      {/* Page title */}
      <h1
        style={{
          width: "100%",
          textAlign: "center",
          margin: "20px 0",
          fontSize: "clamp(1.2rem, 3vw, 2rem)",
          lineHeight: "1.2",
          wordBreak: "break-word",
        }}
      >
        Funding and Support Application
      </h1>

      {/* Section tracker */}
      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          padding: "10px 0",
          margin: "20px 0",
          boxSizing: "border-box",
          WebkitOverflowScrolling: "touch",
        }}
        className="profile-tracker"
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            alignItems: "center",
            minWidth: "max-content",
            padding: "0 10px",
            flexWrap: "wrap",
          }}
          className="profile-tracker-inner"
        >
          {sectionsWithGuarantees.map(
            (section) => {
              const isActive =
                activeSection === section.id

              const isComplete =
                Boolean(
                  completedSections[section.id]
                )

              return (
                <button
                  type="button"
                  key={section.id}
                  onClick={() =>
                    selectSection(section.id)
                  }
                  disabled={isBusy}
                  aria-current={
                    isActive ? "step" : undefined
                  }
                  style={{
                    minWidth: "90px",
                    maxWidth: "100px",
                    height: "70px",
                    padding: "6px 8px",
                    fontSize: "12px",
                    fontWeight: 500,
                    lineHeight: "1.1",
                    textAlign: "center",
                    cursor: isBusy
                      ? "default"
                      : "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                  className={`profile-tracker-button ${
                    isActive
                      ? "active"
                      : isComplete
                        ? "completed"
                        : "pending"
                  }`}
                >
                  {section.label
                    .split("\n")
                    .map((line, index) => (
                      <span
                        key={index}
                        className="tracker-label-line"
                        style={{
                          display: "block",
                          margin: "1px 0",
                        }}
                      >
                        {line}
                      </span>
                    ))}

                  {isComplete && (
                    <CheckCircle
                      style={{
                        position: "absolute",
                        top: "2px",
                        right: "2px",
                        width: "16px",
                        height: "16px",
                      }}
                      className="check-icon"
                    />
                  )}
                </button>
              )
            }
          )}
        </div>
      </div>

      {/* Active section */}
      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          padding: "20px",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow:
            "0 2px 4px rgba(0,0,0,0.1)",
          boxSizing: "border-box",
          overflowX: "auto",
          overflowY: "visible",
          flex: 1,
        }}
        className="content-card"
      >
        <div
          aria-busy={isBusy}
          style={{
            width: "100%",
            overflowX: "auto",
          }}
        >
          {renderActiveSection()}
        </div>

        {/* Existing action area */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "30px",
            padding: "20px 0",
            borderTop: "1px solid #eee",
            flexWrap: "wrap",
            width: "100%",
          }}
          className="action-buttons"
        >
          {activeSection !==
            "applicationOverview" && (
            <button
              type="button"
              onClick={
                navigateToPreviousSection
              }
              disabled={isBusy}
              style={actionButtonStyle}
              className="btn btn-secondary"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveSection}
            disabled={isBusy}
            style={actionButtonStyle}
            className="btn btn-secondary"
          >
            <Save size={16} />

            {isAnalyzingGuarantees
              ? "Analyzing…"
              : isSavingSection
                ? "Saving…"
                : "Save"}
          </button>

          {activeSection !==
          "declarationCommitment" ? (
            <button
              type="button"
              onClick={handleSaveAndContinue}
              disabled={isBusy}
              style={{
                ...actionButtonStyle,
                minWidth: "140px",
              }}
              className="btn btn-primary"
            >
              {isAnalyzingGuarantees
                ? "Analyzing guarantees…"
                : isSavingSection
                  ? "Saving…"
                  : "Save & Continue"}

              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={
                handleSubmitApplication
              }
              disabled={isBusy}
              style={{
                ...actionButtonStyle,
                minWidth: "140px",
              }}
              className="btn btn-primary"
            >
              {isSubmitting
                ? "Submitting…"
                : "Submit Application"}
            </button>
          )}
        </div>

        <p
          style={{
            margin: "0 0 8px",
            color: "#6b7280",
            fontSize: "13px",
            lineHeight: "1.5",
          }}
        >
          You can save an incomplete{" "}
          {currentSectionLabel} section and
          continue. Any missing information will
          be shown after saving. Complete all
          required fields before submitting.
        </p>
      </div>

      {/* Existing matching progress overlay */}
      <AnalysisProgressOverlay
        progress={analysisProgress}
        isComplete={analysisComplete}
      />
    </div>
  )
}

export default FundingApplication