"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle, ChevronRight, ChevronLeft, X, ArrowRight, Save, Send } from "lucide-react"
import Instructions from "./Instructions​"
import JobOverview from "./JobOverview"
import InternshipRequest from "./InternshipRequest"
import MatchingAgreement from "./MatchingAgreement"
import ApplicationSummary from "./ApplicationSummary"
import InternAnalysisProgressOverlay from "./InternAnalysisProgressOverlay"
import { db, auth } from "../../firebaseConfig"
import { getDoc, getDocs, doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import "./internApplication.css"

export const sections = [
  { id: "instructions", label: "Instructions" },
  { id: "jobOverview", label: "Job Overview" },
  { id: "internshipRequest", label: "Internship Request" },
  { id: "matchingAgreement", label: "Matching Agreement" },
]

export default function InternApplication({ applicationId: propApplicationId, isNew, onBack, onSubmitted }) {
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
  const [localApplicationId, setLocalApplicationId] = useState(propApplicationId)
  const [analysisProgress, setAnalysisProgress] = useState(null)
  const [analysisComplete, setAnalysisComplete] = useState(false)

  const applicationId = localApplicationId || propApplicationId

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
    if (user && applicationId) loadApplication()
  }, [user, applicationId])

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
    if (!applicationId) return
    setIsLoading(true)
    try {
      const ref = doc(db, "internApplicationsV2", applicationId)
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

  const markSectionAsCompleted = useCallback(
    async (section) => {
      const updated = { ...completedSections, [section]: true }
      setCompletedSections(updated)
      if (user && applicationId) {
        try {
          const ref = doc(db, "internApplicationsV2", applicationId)
          await updateDoc(ref, {
            completedSections: updated,
            lastUpdated: serverTimestamp(),
          })
        } catch (error) {
          console.error("Error updating completed sections:", error)
        }
      }
    },
    [user, completedSections, applicationId],
  )

  const updateFormData = useCallback(
    (section, data) => {
      setFormData((prev) => {
        const updated = { ...prev[section], ...data }
        return { ...prev, [section]: updated }
      })
    },
    [], // only updates local state, no Firebase writes
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
    const sectionData = formData[activeSection]
    if (!user) return
    try {
      setSaveStatus("saving")

      const baseData = {
        [activeSection]: sectionData,
        lastUpdated: serverTimestamp(),
        userId: user.uid,
        userEmail: user.email,
        status: "in_progress",
      }

      if (applicationId) {
        const ref = doc(db, "internApplicationsV2", applicationId)
        await updateDoc(ref, baseData)
      } else if (isNew) {
        const ref = collection(db, "internApplicationsV2")
        const docRef = await addDoc(ref, {
          ...baseData,
          createdAt: serverTimestamp(),
          completedSections: completedSections,
        })
        setLocalApplicationId(docRef.id)
      }

      await markSectionAsCompleted(activeSection)
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus(""), 2000)
      navigateToNextSection()
    } catch (err) {
      console.error("Save error:", err)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus(""), 3000)
    }
  }, [activeSection, formData, user, applicationId, isNew, completedSections, markSectionAsCompleted, navigateToNextSection])

  const handleSubmitApplication = useCallback(async () => {
    if (!user) return
    try {
      setSaveStatus("saving")

      // Save current section first
      const sectionData = formData[activeSection]
      const baseData = {
        [activeSection]: sectionData,
        lastUpdated: serverTimestamp(),
        userId: user.uid,
        userEmail: user.email,
      }

      let currentId = applicationId
      if (currentId) {
        await updateDoc(doc(db, "internApplicationsV2", currentId), baseData)
      } else if (isNew) {
        const docRef = await addDoc(collection(db, "internApplicationsV2"), {
          ...baseData,
          createdAt: serverTimestamp(),
          completedSections: completedSections,
        })
        currentId = docRef.id
        setLocalApplicationId(docRef.id)
      }

      if (!currentId) return

      // Submit — only write section data + metadata, NOT flat redundant fields
      const ref = doc(db, "internApplicationsV2", currentId)
      await updateDoc(ref, {
        [activeSection]: sectionData,
        completedSections,
        status: "submitted",
        submittedAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      })

      setApplicationSubmitted(true)

      // STEP 1: Count intern profiles
      let internsCount = 0
      try {
        const snapshot = await getDocs(collection(db, "internProfiles"))
        internsCount = snapshot.size
      } catch (err) {
        console.error("Error counting interns:", err)
      }

      // STEP 2: Show "Getting Things Ready" for 3 seconds
      setAnalysisProgress({ stage: "gettingReady", internsCount })
      await new Promise((r) => setTimeout(r, 5000))

      // STEP 3: Show "Searching For Matches" and start the fetch
      setAnalysisProgress({ stage: "searching", internsCount })

      const controller = new AbortController()
      const fetchPromise = fetch("http://localhost:8000/api/interns/analyze-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: currentId }),
        signal: controller.signal,
      })

      // STEP 4: Race — if fetch takes >10s, switch to "Almost There"
      const tenSecondTimer = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 15000)
      )

      try {
        await Promise.race([fetchPromise, tenSecondTimer])
        // Fetch completed within 10s — proceed directly to complete state
        clearTimeout(controller._timeoutId)
      } catch (raceErr) {
        if (raceErr.message === "timeout") {
          // 10s elapsed — show "Almost There", then wait for the actual fetch
          setAnalysisProgress({ stage: "wrappingUp" })
          // Abort after 30s total from here (40s overall)
          const abortTimer = setTimeout(() => controller.abort(), 30000)
          controller._timeoutId = abortTimer
          await fetchPromise.catch(() => {})
          clearTimeout(abortTimer)
        }
        // else fetch completed or aborted — continue
      }

      setAnalysisComplete(true)

      // After 1.5s, navigate back to list so match data refreshes
      setTimeout(() => {
        setAnalysisProgress(null)
        setAnalysisComplete(false)
        if (onSubmitted) onSubmitted()
      }, 1500)
    } catch (error) {
      console.error("Error submitting application:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus(""), 3000)
      setAnalysisProgress(null)
    }
  }, [formData, completedSections, user, applicationId, onSubmitted, activeSection, isNew])

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
  width: "90%",
  maxWidth: "1200px",
  minHeight: "100vh",
  margin: "53px auto",
  padding: "2rem",
  boxSizing: "border-box",
  position: "relative",
  overflowX: "hidden",
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
    return <ApplicationSummary formData={getSummaryData()} onEdit={handleEditApplication} onBack={onBack} />
  }

  return (
    <div  className="intern-application">
      {/* Analysis Progress Overlay */}
      <InternAnalysisProgressOverlay
        progress={analysisProgress}
        isComplete={analysisComplete}
      />

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

      {/* Back Button - Matching Intern style */}
      {onBack && (
        <button 
          onClick={onBack}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 7, 
            padding: "10px 0", 
            marginBottom: 14, 
            background: "none", 
            border: "none", 
            color: "#a67c52", 
            cursor: "pointer", 
            fontSize: 14, 
            fontWeight: 500 
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#7d5a50" }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#a67c52" }}
        >
          <ChevronLeft size={19} /> Back to Applications
        </button>
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
                gap: "5px",
                padding: "10px 15px",
                fontSize: "clamp(0.8rem, 2vw, 1rem)",
                minWidth: "140px",
                justifyContent: "center",
              }}
              className="btn btn-primary"
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
                gap: "5px",
                padding: "10px 15px",
                fontSize: "clamp(0.8rem, 2vw, 1rem)",
                minWidth: "140px",
                justifyContent: "center",
              }}
              className="btn btn-primary"
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
                gap: "5px",
                padding: "10px 15px",
                fontSize: "clamp(0.8rem, 2vw, 1rem)",
                minWidth: "140px",
                justifyContent: "center",
              }}
              className="btn btn-primary"
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