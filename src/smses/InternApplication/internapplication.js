"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle, ChevronRight, ChevronLeft, X, ArrowRight, Save, Send } from "lucide-react"
import Instructions from "./Instructions​"
import JobOverview from "./JobOverview"
import InternshipRequest from "./InternshipRequest"
import MatchingAgreement from "./MatchingAgreement"
import ApplicationSummary from "./ApplicationSummary"
import { db, auth } from "../../firebaseConfig"
import { getDoc, doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import "./internApplication.css"

export const sections = [
  { id: "instructions", label: "Instructions" },
  { id: "jobOverview", label: "Job Overview" },
  { id: "internshipRequest", label: "Internship Request" },
  { id: "matchingAgreement", label: "Matching Agreement" },
]

export default function InternApplication() {
  const [activeSection, setActiveSection] = useState("instructions")
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    instructions: {},
    jobOverview: {},
    internshipRequest: {},
    matchingAgreement: {},
  })
  const [completedSections, setCompletedSections] = useState({
    instructions: false,
    jobOverview: false,
    internshipRequest: false,
    matchingAgreement: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [saveStatus, setSaveStatus] = useState("")
  const [validationModal, setValidationModal] = useState({ open: false, title: "", messages: [] })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const sectionValidations = {
    instructions: () => true,
    jobOverview: () => true,
    internshipRequest: () => true,
    matchingAgreement: () => true,
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (user) loadApplication()
  }, [user])

  useEffect(() => {
    const checkSidebarState = () => {
      setSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    // Check initial state
    checkSidebarState()

    // Monitor for changes
    const observer = new MutationObserver(checkSidebarState)
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] })

    return () => observer.disconnect()
  }, [])

  const loadApplication = async () => {
    setIsLoading(true)
    try {
      const ref = doc(db, "internApplications", user.uid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const data = snap.data()
        setFormData({
          instructions: data.instructions || {},
          jobOverview: data.jobOverview || {},
          internshipRequest: data.internshipRequest || {},
          matchingAgreement: data.matchingAgreement || {},
        })
        setCompletedSections(data.completedSections || {})
        if (data.status === "submitted") {
          setApplicationSubmitted(true)
          setShowSummary(true)
        }
      }
    } catch (error) {
      console.error("Error loading intern application:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveToFirebase = useCallback(
    async (sectionData, sectionName) => {
      if (!user) return
      try {
        setSaveStatus("saving")
        const ref = doc(db, "internApplications", user.uid)

        const updateData = {
          [sectionName]: sectionData,
          lastUpdated: serverTimestamp(),
          userId: user.uid,
          userEmail: user.email,
          status: applicationSubmitted ? "submitted" : "in_progress",
        }

        await updateDoc(ref, updateData).catch(async (err) => {
          if (err.code === "not-found") {
            await setDoc(ref, {
              ...updateData,
              createdAt: serverTimestamp(),
              completedSections: completedSections,
            })
          } else throw err
        })

        setSaveStatus("saved")
        setTimeout(() => setSaveStatus(""), 2000)
      } catch (err) {
        console.error("Save error:", err)
        setSaveStatus("error")
        setTimeout(() => setSaveStatus(""), 3000)
      }
    },
    [user, applicationSubmitted, completedSections],
  )

  const markSectionAsCompleted = useCallback(
    async (section) => {
      const updated = { ...completedSections, [section]: true }
      setCompletedSections(updated)
      if (user) {
        try {
          const ref = doc(db, "internApplications", user.uid)
          await updateDoc(ref, {
            completedSections: updated,
            lastUpdated: serverTimestamp(),
          }).catch(async (err) => {
            if (err.code === "not-found") {
              await setDoc(ref, {
                completedSections: updated,
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                userId: user.uid,
                userEmail: user.email,
                status: "in_progress",
                ...formData,
              })
            } else throw err
          })
        } catch (error) {
          console.error("Error updating completed sections:", error)
        }
      }
    },
    [user, completedSections, formData],
  )

  const updateFormData = useCallback(
    (section, data) => {
      setFormData((prev) => {
        const updated = { ...prev[section], ...data }
        const newFormData = { ...prev, [section]: updated }

        // Save to Firebase
        if (user) {
          saveToFirebase(updated, section)
        }

        return newFormData
      })
    },
    [user, saveToFirebase],
  )

  const navigateToNextSection = useCallback(() => {
    const i = sections.findIndex((s) => s.id === activeSection)
    if (i < sections.length - 1) {
      setActiveSection(sections[i + 1].id)
      window.scrollTo(0, 0)
    }
  }, [activeSection])

  const navigateToPreviousSection = useCallback(() => {
    const i = sections.findIndex((s) => s.id === activeSection)
    if (i > 0) {
      setActiveSection(sections[i - 1].id)
      window.scrollTo(0, 0)
    }
  }, [activeSection])

  const handleSaveAndContinue = useCallback(async () => {
    await markSectionAsCompleted(activeSection)
    navigateToNextSection()
  }, [activeSection, markSectionAsCompleted, navigateToNextSection])

  const handleSubmitApplication = useCallback(async () => {
    try {
      const ref = doc(db, "internApplications", user.uid)
      await updateDoc(ref, {
        ...formData,
        completedSections,
        status: "submitted",
        submittedAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      }).catch(async (err) => {
        if (err.code === "not-found") {
          await setDoc(ref, {
            ...formData,
            completedSections,
            status: "submitted",
            submittedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            userId: user.uid,
            userEmail: user.email,
          })
        } else throw err
      })

      setApplicationSubmitted(true)
      setShowSummary(true)
    } catch (error) {
      console.error("Error submitting application:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus(""), 3000)
    }
  }, [formData, completedSections, user])

  const handleEditApplication = useCallback(() => {
    setShowSummary(false)
    setActiveSection("instructions")
    window.scrollTo(0, 0)
  }, [])

  const renderSection = () => {
    switch (activeSection) {
      case "instructions":
        return <Instructions data={formData.instructions} updateData={(data) => updateFormData("instructions", data)} />
      case "jobOverview":
        return <JobOverview data={formData.jobOverview} updateData={(data) => updateFormData("jobOverview", data)} />
      case "internshipRequest":
        return (
          <InternshipRequest
            data={formData.internshipRequest}
            updateData={(data) => updateFormData("internshipRequest", data)}
          />
        )
      case "matchingAgreement":
        return (
          <MatchingAgreement
            data={formData.matchingAgreement}
            updateData={(data) => updateFormData("matchingAgreement", data)}
          />
        )
      default:
        return null
    }
  }

  const getSummaryData = useCallback(() => {
    return {
      internshipTitle: formData.jobOverview?.internshipTitle,
      department: formData.jobOverview?.department,
      briefDescription: formData.jobOverview?.briefDescription,
      keyTasks: formData.jobOverview?.keyTasks,
      learningOutcomes: formData.jobOverview?.learningOutcomes,
      preferredSkills: formData.jobOverview?.preferredSkills,
      numberOfInterns: formData.internshipRequest?.numberOfInterns,
      internRolesText: formData.internshipRequest?.internRolesText,
      internType: formData.internshipRequest?.internType,
      hoursPerWeek: formData.internshipRequest?.hoursPerWeek,
      startDate: formData.internshipRequest?.startDate,
      duration: formData.internshipRequest?.duration,
      stipendOffered: formData.internshipRequest?.stipendOffered,
      stipendAmount: formData.internshipRequest?.stipendAmount,
      equityOrIncentives: formData.internshipRequest?.equityOrIncentives,
      reportingDepartment: formData.internshipRequest?.reportingDepartment,
      workDescription: formData.internshipRequest?.workDescription,
      canRotate: formData.internshipRequest?.canRotate,
      writtenEvaluation: formData.matchingAgreement?.writtenEvaluation,
      mentorshipSupport: formData.matchingAgreement?.mentorshipSupport,
      codeOfConduct: formData.matchingAgreement?.codeOfConduct,
      consentDeclaration: formData.matchingAgreement?.consentDeclaration,
    }
  }, [formData])

  const getContainerStyle = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    padding: `80px 10px 20px ${sidebarCollapsed ? "80px" : "280px"}`,
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
  })

  if (!user) {
    return (
      <div style={getContainerStyle()} className="intern-application-container">
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
          }}
          className="auth-required"
        >
          <h2>Authentication Required</h2>
          <p>Please sign in to access the intern application.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={getContainerStyle()} className="intern-application-container">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "200px",
            fontSize: "16px",
            color: "#666",
          }}
          className="loading-container"
        >
          <div className="loading-spinner"></div>
          <p>Loading your application...</p>
        </div>
      </div>
    )
  }

  if (showSummary) {
    return <ApplicationSummary formData={getSummaryData()} onEdit={handleEditApplication} />
  }

  return (
    <div style={getContainerStyle()} className="intern-application">
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
          {saveStatus === "saving"
            ? "Saving..."
            : saveStatus === "saved"
              ? "Saved successfully!"
              : "Save failed - please try again"}
        </div>
      )}

      {/* Validation Modal */}
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
            className="popup"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
                borderBottom: "1px solid #eee",
                paddingBottom: "10px",
              }}
              className="popup-header"
            >
              <h3 style={{ margin: "0", fontSize: "18px" }}>{validationModal.title}</h3>
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "5px",
                  borderRadius: "4px",
                }}
                className="popup-close"
                onClick={() => setValidationModal({ open: false, title: "", messages: [] })}
              >
                <X size={20} />
              </button>
            </div>
            <div className="popup-content">
              <ul style={{ margin: "0", paddingLeft: "20px" }}>
                {validationModal.messages.map((msg, i) => (
                  <li key={i} style={{ marginBottom: "5px" }}>
                    {msg}
                  </li>
                ))}
              </ul>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "20px",
                paddingTop: "15px",
                borderTop: "1px solid #eee",
              }}
              className="popup-actions"
            >
              <button
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                className="btn-primary"
                onClick={() => setValidationModal({ open: false, title: "", messages: [] })}
              >
                Close
              </button>
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
          Intern Application
        </h1>
        <p
          style={{
            fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
            color: "#666",
            margin: "0",
            lineHeight: "1.4",
          }}
        >
          Complete all sections to submit your internship application
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
          padding: "20px",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
        className="section-content"
      >
        <div style={{ width: "100%", overflowX: "auto" }}>{renderSection()}</div>
      </div>

      {/* Navigation Buttons */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          flexWrap: "wrap",
          width: "100%",
          boxSizing: "border-box",
        }}
        className="navigation-buttons-enhanced"
      >
        {activeSection !== "instructions" ? (
          <button
            onClick={navigateToPreviousSection}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 16px",
              fontSize: "clamp(0.8rem, 2vw, 1rem)",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              minWidth: "120px",
              justifyContent: "center",
            }}
            className="btn-nav-secondary"
          >
            <ChevronLeft size={18} />
            <span>Previous</span>
          </button>
        ) : (
          <div></div>
        )}

        <div
          style={{
            flex: "1",
            minWidth: "20px",
          }}
          className="nav-spacer"
        ></div>

        {activeSection !== "matchingAgreement" ? (
          <button
            onClick={handleSaveAndContinue}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 16px",
              fontSize: "clamp(0.8rem, 2vw, 1rem)",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              minWidth: "150px",
              justifyContent: "center",
            }}
            className="btn-nav-primary"
          >
            <Save size={18} />
            <span>Save & Continue</span>
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleSubmitApplication}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 16px",
              fontSize: "clamp(0.8rem, 2vw, 1rem)",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              minWidth: "160px",
              justifyContent: "center",
            }}
            className="btn-nav-submit"
          >
            <Send size={18} />
            <span>Submit Application</span>
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
