"use client"

import { useState, useEffect } from "react"
import "./AdvisoryApplication.css"
import { CheckCircle, ChevronRight, X, ArrowRight } from "lucide-react"
import  renderAdvisoryNeedsAssessment from "./advisory-needs-assessment"

import { renderDocumentUploads } from "./document-uploads"
import ApplicationSummary from "./application-summary"
import { updateDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

// Firebase configuration - Replace with your actual config
import { db, auth } from "../../firebaseConfig"

// Updated sections to match new structure
export const sections = [
  {
    id: "advisoryNeedsAssessment",
    label: "Advisory Needs\nAssessment",
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

export default function FundingApplication() {
  const [activeSection, setActiveSection] = useState("advisoryNeedsAssessment")
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [validationModal, setValidationModal] = useState({ open: false, title: "", messages: [] })
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0)

  // Firebase states
  const [user, setUser] = useState(null)
  const [applicationId, setApplicationId] = useState(null)
  const [saveStatus, setSaveStatus] = useState("") // 'saving', 'saved', 'error'

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Section validations
  const sectionValidations = {
    advisoryNeedsAssessment: (data) => {
      const hasAdvisors = data?.advisors && data.advisors.length > 0
      const hasTimeCommitment = data?.timeCommitment
      const hasCompensationType = data?.compensationType
      const hasMeetingFormat = data?.meetingFormat
      const hasStartDate = data?.startDate
      const hasProjectDuration = data?.projectDuration

      // If meeting format is in-person, province is required
      const provinceValid = data?.meetingFormat !== "in-person" || data?.province

      return (
        hasAdvisors &&
        hasTimeCommitment &&
        hasCompensationType &&
        hasMeetingFormat &&
        provinceValid &&
        hasStartDate &&
        hasProjectDuration
      )
    },
    documentUploads: (data) => {
      // For advisory applications, document uploads are optional
      // Always return true since no documents are strictly required
      return true
    },
  }

  const [completedSections, setCompletedSections] = useState({
    advisoryNeedsAssessment: false,
    documentUploads: false,
  })

  const [formData, setFormData] = useState({
    advisoryNeedsAssessment: {},
    documentUploads: {},
  })

  // Firebase functions
  const saveToFirebase = async (sectionData, sectionName) => {
    if (!user) {
      console.warn("No user authenticated, cannot save to Firebase")
      return
    }

    try {
      setSaveStatus("saving")

      const applicationData = {
        userId: user.uid,
        userEmail: user.email,
        [sectionName]: sectionData,
        lastUpdated: serverTimestamp(),
        status: "in_progress",
      }

      // Use userId as document ID instead of auto-generated applicationId
      const docRef = doc(db, "advisoryApplications", user.uid)

      // Always use updateDoc with merge option to create or update
      await updateDoc(docRef, {
        [sectionName]: sectionData,
        lastUpdated: serverTimestamp(),
        userId: user.uid,
        userEmail: user.email,
        status: "in_progress",
      }).catch(async (error) => {
        // If document doesn't exist, create it
        if (error.code === "not-found") {
          await setDoc(docRef, {
            ...applicationData,
            createdAt: serverTimestamp(),
          })
        } else {
          throw error
        }
      })

      setSaveStatus("saved")
      setTimeout(() => setSaveStatus(""), 2000)
    } catch (error) {
      console.error("Error saving to Firebase:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus(""), 3000)
    }
  }
  const saveCompleteApplication = async () => {
    if (!user) {
      console.warn("No user authenticated, cannot save complete application")
      return
    }

    try {
      const docRef = doc(db, "advisoryApplications", user.uid)
      await updateDoc(docRef, {
        ...formData,
        status: "submitted",
        completedSections,
        submittedAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        userId: user.uid,
        userEmail: user.email,
      })
    } catch (error) {
      console.error("Error saving complete application:", error)
    }
  }

  const loadExistingApplication = async () => {
    if (!user) return

    try {
      setIsLoading(true)

      const docRef = doc(db, "advisoryApplications", user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()

        // Restore form data
        setFormData({
          advisoryNeedsAssessment: data.advisoryNeedsAssessment || {},
          documentUploads: data.documentUploads || {},
        })

        // Restore section completion
        const completed = data.completedSections || {}
        setCompletedSections(completed)

        // Check if all sections are complete
        const allComplete = sections.every((section) => completed[section.id] === true)

        if (data.status === "submitted" || allComplete) {
          setApplicationSubmitted(true)
          setShowSummary(true)
        }
      }
    } catch (error) {
      console.error("Error loading existing application:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      loadExistingApplication()
    }
  }, [user])

  useEffect(() => {
    // Save application ID to localStorage when it changes
    if (applicationId && user) {
      localStorage.setItem(`advisoryApplicationId_${user.uid}`, applicationId)
    }
  }, [applicationId, user])

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem("hasSeenAdvisoryOnboarding")
    if (!hasSeenOnboarding && !isLoading) {
      setShowWelcomePopup(true)
    }
  }, [isLoading])

  useEffect(() => {
    // Check initial sidebar state
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    // Check initial state
    checkSidebarState()

    // Create observer to watch for sidebar state changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          checkSidebarState()
        }
      })
    })

    // Start observing
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    // Cleanup
    return () => observer.disconnect()
  }, [])

  const updateFormData = (section, data) => {
    const updatedData = {
      ...formData[section],
      ...data,
    }

    setFormData((prev) => ({
      ...prev,
      [section]: updatedData,
    }))

    // Auto-save to Firebase when data changes
    if (user) {
      saveToFirebase(updatedData, section)
    }
  }

  const markSectionAsCompleted = (section) => {
    const updated = { ...completedSections, [section]: true }
    setCompletedSections(updated)

    if (user) {
      const docRef = doc(db, "advisoryApplications", user.uid)
      updateDoc(docRef, { completedSections: updated, lastUpdated: serverTimestamp() }).catch(console.error)
    }
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
    setActiveSection("advisoryNeedsAssessment")
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

  const handleSubmitApplication = async () => {
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

    // Save complete application to Firebase
    await saveCompleteApplication()

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
      case "advisoryNeedsAssessment":
        return renderAdvisoryNeedsAssessment(formData.advisoryNeedsAssessment, updateFormData)
  
      case "documentUploads":
        return renderDocumentUploads(formData.documentUploads, updateFormData)
      default:
        return null
    }
  }

  const handleSaveAndContinue = async () => {
    const sectionData = formData[activeSection]
    const isValid = sectionValidations[activeSection](sectionData)

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

    // Mark section as complete
    markSectionAsCompleted(activeSection)

    // ✅ Explicitly save this section to Firebase before navigating
    if (user) {
      await saveToFirebase(sectionData, activeSection)
    }

    // Move to next section
    navigateToNextSection()
  }

  useEffect(() => {
    // Auto-complete document uploads section since it's optional
    if (activeSection === "documentUploads") {
      markSectionAsCompleted("documentUploads")
    }
  }, [activeSection])

  const getContainerStyles = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    padding: "0",
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
  })

  // Show loading state
  if (isLoading) {
    return (
      <div style={getContainerStyles()} className="funding-application-container">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "200px",
            fontSize: "16px",
            color: "#666",
          }}
          className="loading-container"
        >
          Loading your application data...
        </div>
      </div>
    )
  }

  // Show summary if application is submitted - EARLY RETURN
  if (showSummary) {
    return <ApplicationSummary formData={formData} onEdit={handleEditApplication} />
  }

  // Authentication check
  if (!user) {
    return (
      <div style={getContainerStyles()} className="funding-application-container">
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
          }}
          className="auth-required"
        >
          <h2>Authentication Required</h2>
          <p>Please sign in to access the Advisory Matching Application.</p>
        </div>
      </div>
    )
  }

  // Main application form
  return (
    <div style={getContainerStyles()} className="funding-application-container">
      {/* Save Status Indicator */}
      {saveStatus && (
        <div
          style={{
            position: "fixed",
            top: "100px",
            right: "20px",
            padding: "10px 15px",
            borderRadius: "4px",
            backgroundColor: saveStatus === "saved" ? "#d4edda" : saveStatus === "error" ? "#f8d7da" : "#fff3cd",
            color: saveStatus === "saved" ? "#155724" : saveStatus === "error" ? "#721c24" : "#856404",
            border: `1px solid ${saveStatus === "saved" ? "#c3e6cb" : saveStatus === "error" ? "#f5c6cb" : "#ffeaa7"}`,
            zIndex: "1000",
            fontSize: "14px",
          }}
          className={`save-status ${saveStatus}`}
        >
          {saveStatus === "saving" && "💾 Saving..."}
          {saveStatus === "saved" && "✅ Saved"}
          {saveStatus === "error" && "❌ Save failed"}
        </div>
      )}

      {validationModal.open && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "9999",
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
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "auto",
              position: "relative",
              width: "100%",
              maxWidth: "500px",
            }}
            className="validation-popup"
          >
            <button
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "5px",
              }}
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
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "9999",
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
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "auto",
              position: "relative",
              width: "100%",
              maxWidth: "600px",
            }}
            className="welcome-popup"
          >
            <button
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "5px",
              }}
              className="close-popup"
              onClick={handleCloseWelcomePopup}
            >
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

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: "20px",
                }}
                className="popup-buttons"
              >
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
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "9999",
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
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "auto",
              position: "relative",
              width: "100%",
              maxWidth: "600px",
            }}
            className="congratulations-popup"
          >
            <button
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "5px",
              }}
              className="close-popup"
              onClick={handleCloseCongratulationsPopup}
            >
              <X size={24} />
            </button>
            <div className="popup-content">
              <h2>Congratulations!</h2>
              <p>You've successfully completed your Advisory Matching Application!</p>
              <p>We'll now work on finding the perfect advisors for your needs.</p>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: "20px",
                }}
                className="popup-buttons-group"
              >
                <button className="btn btn-primary" onClick={handleCloseCongratulationsPopup}>
                  View Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
          padding: "0 20px",
        }}
        className="application-header"
      >
        <h1
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
            lineHeight: "1.2",
            margin: "0 0 10px 0",
            wordBreak: "break-word",
          }}
        >
          Advisory Matching Application
        </h1>
        <p
          style={{
            fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
            color: "#666",
            margin: "0",
            lineHeight: "1.4",
          }}
        >
          Complete all sections to submit your application
        </p>
      </div>

      {/* Section Tracker */}
      <div className="section-tracker">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`section-button ${activeSection === section.id ? "active" : ""} ${completedSections[section.id] ? "completed" : ""}`}
          >
            <span className="section-label">{section.label}</span>
            {completedSections[section.id] && <CheckCircle size={16} className="completed-icon" />}
          </button>
        ))}
      </div>

      {/* Section Content */}
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
        <div style={{ width: "100%", overflowX: "auto" }}>{renderActiveSection()}</div>

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
            width: "100%",
          }}
          className="action-buttons"
        >
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
              onClick={handleSubmitApplication}
            >
              Submit Application
            </button>
          )}
        </div>
      </div>
    </div>
  )
}