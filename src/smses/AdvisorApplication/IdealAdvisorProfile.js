"use client"

import { useState, useEffect } from "react"
import "./AdvisoryApplication.css"
import { CheckCircle, ChevronRight, ChevronLeft, X, ArrowRight } from "lucide-react"
import { renderSMEProfileSnapshot } from "./sme-profile-snapshot"
import { renderAdvisoryNeedsAssessment } from "./advisory-needs-assessment"
import { renderUrgencyTimeline } from "./urgency-timeline"
import { renderDocumentUploads } from "./document-uploads"

// Updated sections to match new structure
const sections = [
  {
    id: "smeProfileSnapshot",
    label: "SME Profile\nSnapshot",
  },
  {
    id: "advisoryNeedsAssessment",
    label: "Advisory Needs\nAssessment",
  },
  {
    id: "urgencyTimeline",
    label: "Urgency &\nTimeline",
  },
  {
    id: "documentUploads",
    label: "Document\nUploads",
  },
]

// Onboarding steps for the welcome popup
const onboardingSteps = [
  {
    title: "Welcome to Advisory Matching Application",
    content:
      "This application will help us understand your advisory needs and match you with the right advisors for your business.",
    icon: "🤝",
  },
  {
    title: "Step 1: SME Profile Snapshot",
    content: "We'll start with your basic company information that's auto-pulled from your existing data.",
    icon: "📋",
  },
  {
    title: "Step 2: Advisory Needs Assessment",
    content: "Tell us about the specific type of advisory support you need and your engagement preferences.",
    icon: "🎯",
  },
  {
    title: "Step 3: Urgency & Timeline",
    content: "Let us know when you need to start and how long you expect the engagement to last.",
    icon: "⏰",
  },
  {
    title: "Step 4: Document Uploads",
    content: "Upload any relevant documents that will help us make better matches.",
    icon: "📄",
  },
]

export default function FundingApplication() {
  const [activeSection, setActiveSection] = useState("smeProfileSnapshot")
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [validationModal, setValidationModal] = useState({ open: false, title: "", messages: [] })
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0)

  // Section validations
  const sectionValidations = {
    smeProfileSnapshot: (data) => {
      return data?.companyName && data?.sector && data?.businessStage && data?.currentPISScore
    },
    advisoryNeedsAssessment: (data) => {
      const hasAdvisoryRole = data?.advisoryRole
      const hasSupportFocus = data?.supportFocus && data.supportFocus.length > 0
      const hasTimeCommitment = data?.timeCommitment
      const hasCompensationType = data?.compensationType
      const hasMeetingFormat = data?.meetingFormat
      const hasStartDate = data?.startDate
      const hasProjectDuration = data?.projectDuration

      // If meeting format is in-person, province is required
      const provinceValid = data?.meetingFormat !== "in-person" || data?.province

      return (
        hasAdvisoryRole &&
        hasSupportFocus &&
        hasTimeCommitment &&
        hasCompensationType &&
        hasMeetingFormat &&
        hasStartDate &&
        hasProjectDuration &&
        provinceValid
      )
    },
    urgencyTimeline: (data) => {
      return data?.startDate && data?.projectDuration
    },
    documentUploads: (data) => {
      // Business plan is required, others are optional
      // For now, we'll make it flexible since it depends on revenue
      return true // Can be made more strict based on business rules
    },
  }

  const [completedSections, setCompletedSections] = useState({
    smeProfileSnapshot: false,
    advisoryNeedsAssessment: false,
    urgencyTimeline: false,
    documentUploads: false,
  })

  const [formData, setFormData] = useState({
    smeProfileSnapshot: {
      companyName: "Auto-filled Company Name",
      sector: "",
      businessStage: "",
      currentPISScore: "45/100 – Governance Gap Detected",
    },
    advisoryNeedsAssessment: {},
    urgencyTimeline: {},
    documentUploads: {},
  })

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem("hasSeenAdvisoryOnboarding")
    if (!hasSeenOnboarding) {
      setShowWelcomePopup(true)
    }
  }, [])

  const updateFormData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }))
  }

  const markSectionAsCompleted = (section) => {
    setCompletedSections((prev) => ({ ...prev, [section]: true }))
  }

  const navigateToNextSection = () => {
    const currentIndex = sections.findIndex((section) => section.id === activeSection)
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id)
      window.scrollTo(0, 0)
    }
  }

  const navigateToPreviousSection = () => {
    const currentIndex = sections.findIndex((section) => section.id === activeSection)
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id)
      window.scrollTo(0, 0)
    }
  }

  const handleEditApplication = () => {
    setShowSummary(false)
    setApplicationSubmitted(false)
    setActiveSection("smeProfileSnapshot")
    window.scrollTo(0, 0)
  }

  const handleNextOnboardingStep = () => {
    if (currentOnboardingStep < onboardingSteps.length - 1) {
      setCurrentOnboardingStep(currentOnboardingStep + 1)
    } else {
      setShowWelcomePopup(false)
      localStorage.setItem("hasSeenAdvisoryOnboarding", "true")
    }
  }

  const handleCloseWelcomePopup = () => {
    setShowWelcomePopup(false)
    localStorage.setItem("hasSeenAdvisoryOnboarding", "true")
  }

  const handleCloseCongratulationsPopup = () => {
    setShowCongratulationsPopup(false)
    setShowSummary(true)
  }

  const handleSubmitApplication = () => {
    const allSectionsValid = Object.entries(sectionValidations).every(
      ([key, validate]) => validate(formData[key] || {}) && completedSections[key],
    )

    if (!allSectionsValid) {
      const invalidSections = Object.entries(sectionValidations)
        .filter(([key, validate]) => !validate(formData[key] || {}) || !completedSections[key])
        .map(([key]) => sections.find((s) => s.id === key)?.label.replace(/\n/g, " "))

      setValidationModal({
        open: true,
        title: "Please complete all required sections before submitting:",
        messages: invalidSections,
      })
      return
    }

    setApplicationSubmitted(true)

    const hasSeenCongratulationsPopup = localStorage.getItem("hasSeenAdvisoryCongratulationsPopup")
    if (!hasSeenCongratulationsPopup) {
      setShowCongratulationsPopup(true)
      localStorage.setItem("hasSeenAdvisoryCongratulationsPopup", "true")
    } else {
      setShowSummary(true)
    }

    window.scrollTo(0, 0)
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case "smeProfileSnapshot":
        return renderSMEProfileSnapshot(formData.smeProfileSnapshot, updateFormData)
      case "advisoryNeedsAssessment":
        return renderAdvisoryNeedsAssessment(formData.advisoryNeedsAssessment, updateFormData)
      case "urgencyTimeline":
        return renderUrgencyTimeline(formData.urgencyTimeline, updateFormData)
      case "documentUploads":
        return renderDocumentUploads(formData.documentUploads, updateFormData)
      default:
        return renderSMEProfileSnapshot(formData.smeProfileSnapshot, updateFormData)
    }
  }

  const handleSaveAndContinue = () => {
    const isValid = sectionValidations[activeSection](formData[activeSection])

    if (!isValid) {
      const errors = []
      errors.push(
        `${sections.find((s) => s.id === activeSection)?.label.replace(/\n/g, " ")} is incomplete or has invalid fields.`,
      )
      setValidationModal({
        open: true,
        title: "Please review the following:",
        messages: errors,
      })
      return
    }

    markSectionAsCompleted(activeSection)
    navigateToNextSection()
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="funding-application-container">
        <div className="loading-container">Loading your application data...</div>
      </div>
    )
  }

  // Show summary if application is submitted
  if (showSummary) {
    return (
      <div className="funding-application-container">
        <h1>Application Summary</h1>
        <div className="content-card">
          <h2>Your Advisory Matching Application</h2>
          <p>
            Thank you for submitting your advisory matching application. We will review your requirements and match you
            with suitable advisors.
          </p>
          <button className="btn btn-primary" onClick={handleEditApplication}>
            Edit Application
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="funding-application-container">
      {validationModal.open && (
        <div className="popup-overlay">
          <div className="validation-popup">
            <button
              className="close-popup"
              onClick={() => setValidationModal({ open: false, title: "", messages: [] })}
            >
              <X size={24} />
            </button>
            <div className="popup-content">
              <h2>{validationModal.title}</h2>
              <ul>
                {validationModal.messages.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
              <button
                className="btn btn-primary"
                onClick={() => setValidationModal({ open: false, title: "", messages: [] })}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Popup */}
      {showWelcomePopup && (
        <div className="popup-overlay">
          <div className="welcome-popup">
            <button className="close-popup" onClick={handleCloseWelcomePopup}>
              <X size={24} />
            </button>
            <div className="popup-content">
              <div className="popup-icon">{onboardingSteps[currentOnboardingStep].icon}</div>
              <h2>{onboardingSteps[currentOnboardingStep].title}</h2>
              <p>{onboardingSteps[currentOnboardingStep].content}</p>

              <div className="popup-progress">
                {onboardingSteps.map((_, index) => (
                  <div key={index} className={`progress-dot ${index === currentOnboardingStep ? "active" : ""}`} />
                ))}
              </div>

              <div className="popup-buttons">
                <button className="btn btn-secondary" onClick={handleCloseWelcomePopup}>
                  Skip
                </button>
                <button className="btn btn-primary" onClick={handleNextOnboardingStep}>
                  {currentOnboardingStep < onboardingSteps.length - 1 ? "Next" : "Get Started"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Congratulations Popup */}
      {showCongratulationsPopup && (
        <div className="popup-overlay">
          <div className="congratulations-popup">
            <button className="close-popup" onClick={handleCloseCongratulationsPopup}>
              <X size={24} />
            </button>
            <div className="popup-content">
              <h2>Congratulations!</h2>
              <p>You've successfully completed your Advisory Matching Application!</p>
              <p>We'll now work on finding the perfect advisors for your needs.</p>
              <div className="popup-buttons-group">
                <button className="btn btn-primary" onClick={handleCloseCongratulationsPopup}>
                  View Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1>Advisory Matching Application</h1>

      <div className="profile-tracker">
        <div className="profile-tracker-inner">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`profile-tracker-button ${
                activeSection === section.id ? "active" : completedSections[section.id] ? "completed" : "pending"
              }`}
            >
              {section.label.split("\n").map((line, i) => (
                <span key={i} className="tracker-label-line">
                  {line}
                </span>
              ))}
              {completedSections[section.id] && <CheckCircle className="check-icon" />}
            </button>
          ))}
        </div>
      </div>

      <div className="content-card">
        {renderActiveSection()}

        <div className="action-buttons">
          {activeSection !== "smeProfileSnapshot" && (
            <button type="button" onClick={navigateToPreviousSection} className="btn btn-secondary">
              <ChevronLeft size={16} /> Previous
            </button>
          )}

          {activeSection !== "documentUploads" ? (
            <button type="button" onClick={handleSaveAndContinue} className="btn btn-primary">
              Save & Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={handleSubmitApplication}>
              Submit Application
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
