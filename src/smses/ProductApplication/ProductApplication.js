"use client"

import { useState, useEffect } from "react"
import { /* useNavigate, useParams */ } from "react-router-dom" // keep for non-embedded usage
import { CheckCircle, ChevronRight, ChevronLeft, Save, X, ArrowRight } from "lucide-react"
import { sections } from "./applicationOptions"
import RequestOverview from "./RequestOverview"
import ProductsServices from "./ProductsServices"
import MatchingPreferences from "./MatchingPreferences"
import ContactSubmission from "./ContactSubmission"
import ApplicationSummary from "./application-summary"
import "./ProductApplication.css"
import { doc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "../../firebaseConfig"

// Onboarding steps for the welcome popup
const onboardingSteps = [
  { title: "Welcome to Products/Services Application", content: "This application will help us understand your product and service needs so we can match you with the right providers.", icon: "🛍️" },
  { title: "Step 1: Request Overview", content: "Start by providing basic information about what you're looking for and your budget requirements.", icon: "📝" },
  { title: "Step 2: Products & Services", content: "Specify the categories and details of the products or services you need.", icon: "📦" },
  { title: "Step 3: Submit & Match", content: "Complete your preferences and contact information to help us find the best match for your needs.", icon: "✅" },
]

/**
 * New props for embedded use:
 * - embedded: boolean (default false)
 * - onNavigateToMatches: () => void  (parent switches to "My Matches" tab)
 * - onNavigateToDashboard: () => void (parent decides what “dashboard” means in-tab)
 * - initialSectionId: string (optional — start at a specific section)
 */
const ProductApplication = ({
  embedded = false,
  onNavigateToMatches,
  onNavigateToDashboard,
  initialSectionId,
}) => {
  // Router only used when not embedded
  // eslint-disable-next-line react-hooks/rules-of-hooks
  // const { section: urlSectionRaw } = embedded ? { section: null } : useParams()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  // const navigate = embedded ? (() => {}) : useNavigate()

  const urlSection = embedded ? null : null /* replace with urlSectionRaw if you re-enable routing */

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0)
  const [forceShowPopup, setForceShowPopup] = useState(false)

  const [activeSection, setActiveSection] = useState(() => {
    const byUrl = sections.find((s) => s.path === urlSection)?.id
    return initialSectionId || byUrl || sections[0].id
  })

  const getUserSpecificKey = (baseKey) => {
    const userId = auth.currentUser?.uid
    return userId ? `${baseKey}_${userId}` : baseKey
  }

  const [completedSections, setCompletedSections] = useState(() => {
    const userId = auth.currentUser?.uid
    const key = userId ? `productApplicationCompletedSections_${userId}` : "productApplicationCompletedSections"
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : Object.fromEntries(sections.map((s) => [s.id, false]))
  })

  const [formData, setFormData] = useState(() => {
    const userId = auth.currentUser?.uid
    const key = userId ? `productApplicationData_${userId}` : "productApplicationData"
    const saved = localStorage.getItem(key)
    const parsedData = saved ? JSON.parse(saved) : {}

    return {
      requestOverview: {
        purpose: "",
        engagementType: "",
        deliveryModes: [],
        startDate: "",
        endDate: "",
        location: "",
        minBudget: "",
        maxBudget: "",
        esdProgram: null,
        ...(parsedData.requestOverview || {}),
      },
      productsServices: {
        categories: [],
        keywords: "",
        scopeOfWorkFiles: [],
        ...(parsedData.productsServices || {}),
      },
      matchingPreferences: {
        bbeeLevel: "",
        ownershipPrefs: [],
        sectorExperience: "",
        ...(parsedData.matchingPreferences || {}),
      },
      contactSubmission: {
        contactName: "",
        contactRole: "",
        businessName: "",
        email: "",
        phone: "",
        responseMethod: "",
        declaration: false,
        ...(parsedData.contactSubmission || {}),
      },
    }
  })

  // First-load popup / submission status (works the same embedded vs routed)
  useEffect(() => {
    const userId = auth.currentUser?.uid
    if (!userId) return

    const savedSubmissionStatus = localStorage.getItem(getUserSpecificKey("applicationSubmitted"))
    const hasSeenWelcome = localStorage.getItem(getUserSpecificKey("hasSeenProductWelcomePopup")) === "true"

    if (!hasSeenWelcome) {
      setShowWelcomePopup(true)
      setShowSummary(false)
    } else if (savedSubmissionStatus === "true" && !forceShowPopup) {
      setApplicationSubmitted(true)
      setShowSummary(true)
    }
  }, [forceShowPopup])

  // Persistence
  useEffect(() => {
    const userId = auth.currentUser?.uid
    if (!userId) return
    localStorage.setItem(getUserSpecificKey("productApplicationData"), JSON.stringify(formData))
  }, [formData])

  useEffect(() => {
    const userId = auth.currentUser?.uid
    if (!userId) return
    localStorage.setItem(getUserSpecificKey("productApplicationCompletedSections"), JSON.stringify(completedSections))
  }, [completedSections])

  useEffect(() => {
    const userId = auth.currentUser?.uid
    if (!userId) return
    localStorage.setItem(getUserSpecificKey("applicationSubmitted"), applicationSubmitted.toString())
  }, [applicationSubmitted])

  // URL sync — DISABLED in embedded mode
  // useEffect(() => {
  //   if (embedded) return
  //   const section = sections.find((s) => s.id === activeSection)
  //   if (section && !showSummary && urlSection) {
  //     navigate(`/applications/product/${section.path}`, { replace: true })
  //   }
  // }, [activeSection, navigate, showSummary, urlSection, embedded])

  // React to URL changes — DISABLED in embedded mode
  // useEffect(() => {
  //   if (embedded) return
  //   if (urlSection) {
  //     const section = sections.find((s) => s.path === urlSection)
  //     if (section) {
  //       setActiveSection(section.id)
  //       setShowSummary(false)
  //     }
  //   } else {
  //     const userId = auth.currentUser?.uid
  //     if (userId) {
  //       const saved = localStorage.getItem(`applicationSubmitted_${userId}`)
  //       if (saved === "true") setShowSummary(true)
  //       else {
  //         setActiveSection(sections[0].id)
  //         navigate(`/applications/product/${sections[0].path}`, { replace: true })
  //       }
  //     }
  //   }
  // }, [urlSection, navigate, embedded])

  const goToSection = (sectionId) => {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return
    setActiveSection(section.id)
    setShowSummary(false)
    // if (!embedded) navigate(`/applications/product/${section.path}`, { replace: true })
    window.scrollTo(0, 0)
  }

  const handleEditApplication = () => {
    const hasSeen = localStorage.getItem(getUserSpecificKey("hasSeenProductWelcomePopup")) === "true"
    if (!hasSeen) setForceShowPopup(true)
    setShowSummary(false)
    setActiveSection(sections[0].id)
    window.scrollTo(0, 0)
  }

  const handleNextOnboardingStep = () => {
    if (currentOnboardingStep < onboardingSteps.length - 1) {
      setCurrentOnboardingStep((s) => s + 1)
    } else {
      handleCloseWelcomePopup()
    }
  }

  const handleCloseWelcomePopup = () => {
    setShowWelcomePopup(false)
    setForceShowPopup(false)
    localStorage.setItem(getUserSpecificKey("hasSeenProductWelcomePopup"), "true")
    if (applicationSubmitted) setShowSummary(true)
  }

  const handleCloseCongratulationsPopup = () => {
    setShowCongratulationsPopup(false)
    setShowSummary(true)
  }

  // NEW: In embedded mode, these call back up instead of routing
  const handleNavigateToDashboard = () => {
    if (embedded) {
      onNavigateToDashboard?.()
    } else {
      // navigate("/dashboard")
    }
  }
  const handleViewMatches = () => {
    if (embedded) {
      onNavigateToMatches?.()
    } else {
      // navigate("/funding-matches")
    }
  }

  const updateFormData = (section, newData) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...newData },
    }))
  }

  const saveCurrentSection = () => {
    const userId = auth.currentUser?.uid
    if (!userId) return
    localStorage.setItem(getUserSpecificKey("productApplicationData"), JSON.stringify(formData))
    setCompletedSections((prev) => ({ ...prev, [activeSection]: true }))
    alert("Section saved successfully!")
  }

  const goToNextSection = () => {
    const currentIndex = sections.findIndex((s) => s.id === activeSection)
    if (currentIndex < sections.length - 1) {
      setCompletedSections((prev) => ({ ...prev, [activeSection]: true }))
      goToSection(sections[currentIndex + 1].id)
    }
  }

  const goToPreviousSection = () => {
    const currentIndex = sections.findIndex((s) => s.id === activeSection)
    if (currentIndex > 0) goToSection(sections[currentIndex - 1].id)
  }

  const uploadFilesAndReplaceWithURLs = async (data, section) => {
    const uploadRecursive = async (item, pathPrefix) => {
      if (item instanceof File) {
        const fileRef = ref(storage, `productApplication/${auth.currentUser?.uid}/${pathPrefix}`)
        await uploadBytes(fileRef, item)
        return await getDownloadURL(fileRef)
      } else if (Array.isArray(item)) {
        return await Promise.all(item.map((entry, idx) => uploadRecursive(entry, `${pathPrefix}/${idx}`)))
      } else if (typeof item === "object" && item !== null) {
        const updated = {}
        for (const key in item) {
          updated[key] = await uploadRecursive(item[key], `${pathPrefix}/${key}`)
        }
        return updated
      } else {
        return item
      }
    }
    return await uploadRecursive(data, section)
  }

  const saveDataToFirebase = async (section = null) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error("User not logged in.")
      const docRef = doc(db, "productApplications", userId)

      const sectionData = section ? formData[section] : formData
      const uploaded = section
        ? { [section]: await uploadFilesAndReplaceWithURLs(sectionData, section) }
        : await uploadFilesAndReplaceWithURLs(formData, "full")

      const dataToSave = {
        ...uploaded,
        completedSections: { ...completedSections },
        lastUpdated: new Date().toISOString(),
      }

      if (section) {
        await setDoc(
          docRef,
          {
            ...uploaded,
            [`completedSections.${section}`]: completedSections[section],
            lastUpdated: new Date().toISOString(),
          },
          { merge: true },
        )
      } else {
        await setDoc(docRef, dataToSave, { merge: true })
      }
    } catch (err) {
      console.error("Error saving to Firebase:", err)
      alert("Failed to save to Firebase.")
    }
  }

  const handleSaveSection = async () => {
    const updatedCompletedSections = { ...completedSections, [activeSection]: true }
    setCompletedSections(updatedCompletedSections)
    await saveDataToFirebase(activeSection)
    alert("Section saved successfully!")
  }

  const handleSaveAndContinue = async () => {
    const updatedCompletedSections = { ...completedSections, [activeSection]: true }
    setCompletedSections(updatedCompletedSections)
    await saveDataToFirebase(activeSection)
    goToNextSection()
  }

  const submitApplication = async () => {
    try {
      const allCompleted = Object.fromEntries(sections.map((s) => [s.id, true]))
      setCompletedSections(allCompleted)
      setApplicationSubmitted(true)
      await saveDataToFirebase()

      const hasSeenCongrats = localStorage.getItem(getUserSpecificKey("hasSeenProductCongratulationsPopup")) === "true"
      if (!hasSeenCongrats) {
        setShowCongratulationsPopup(true)
        localStorage.setItem(getUserSpecificKey("hasSeenProductCongratulationsPopup"), "true")
      } else {
        setShowSummary(true) // no route change in embedded
      }
      window.scrollTo(0, 0)
    } catch (err) {
      console.error("Failed to submit application:", err)
      alert("Failed to submit application.")
    }
  }

  const renderActiveSection = () => {
    const sectionData = formData[activeSection] || {}
    const sectionProps = { data: sectionData, updateData: (newData) => updateFormData(activeSection, newData) }

    switch (activeSection) {
      case "requestOverview":
        return <RequestOverview {...sectionProps} />
      case "productsServices":
        return <ProductsServices {...sectionProps} />
      case "matchingPreferences":
        return <MatchingPreferences {...sectionProps} />
      case "contactSubmission":
        return <ContactSubmission {...sectionProps} />
      default:
        return <RequestOverview {...sectionProps} />
    }
  }

  const isLastSection = activeSection === sections[sections.length - 1].id
  const isFirstSection = activeSection === sections[0].id

  // Sidebar class watcher — optional while embedded (kept harmless)
  useEffect(() => {
    if (embedded) return
    const checkSidebarState = () => {
      const sidebarCollapsed = document.body.classList.contains("sidebar-collapsed")
      setIsSidebarCollapsed(sidebarCollapsed)
    }
    checkSidebarState()
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === "attributes" && m.attributeName === "class") checkSidebarState()
      })
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [embedded])

  // Embedded gets tight, route page gets padded
  const getContainerStyles = () =>
    embedded
      ? {
          width: "100%",
          maxWidth: "100%",
          margin: 0,
          padding: 0,
        }
      : {
          width: "100%",
          minHeight: "100vh",
          maxWidth: "100vw",
          overflowX: "hidden",
          padding: isSidebarCollapsed ? "80px 20px 20px 80px" : "80px 10px 20px 280px",
          margin: "0",
          boxSizing: "border-box",
          position: "relative",
          transition: "padding 0.3s ease",
        }

  // Summary: in embedded mode, don't gate on urlSection
  if (showSummary && !showWelcomePopup && (embedded || !urlSection)) {
    return <ApplicationSummary data={formData} onEdit={handleEditApplication} />
  }

  return (
    <div style={getContainerStyles()} className="product-application-container">
      {/* Welcome Popup */}
      {showWelcomePopup && (
        <div className="popup-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: 20, boxSizing: "border-box" }}>
          <div className="welcome-popup" style={{ backgroundColor: "white", borderRadius: 8, padding: 20, maxWidth: "90vw", maxHeight: "90vh", overflow: "auto", position: "relative", width: "100%", maxWidth: 600 }}>
            <button className="close-popup" onClick={handleCloseWelcomePopup} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", padding: 5 }}>
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
              <div className="popup-buttons" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
                <button className="btn btn-secondary" onClick={handleCloseWelcomePopup}>Skip</button>
                <button className="btn btn-primary" onClick={handleNextOnboardingStep}>
                  {currentOnboardingStep < onboardingSteps.length - 1 ? "Next" : "Get Started"} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Congratulations Popup */}
      {showCongratulationsPopup && (
        <div className="popup-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: 20, boxSizing: "border-box" }}>
          <div className="congratulations-popup" style={{ backgroundColor: "white", borderRadius: 8, padding: 20, maxWidth: "90vw", maxHeight: "90vh", overflow: "auto", position: "relative", width: "100%", maxWidth: 600 }}>
            <button className="close-popup" onClick={handleCloseCongratulationsPopup} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", padding: 5 }}>
              <X size={24} />
            </button>
            <div className="popup-content">
              <h2>Congratulations!</h2>
              <p>You've successfully completed your Products/Services Application!</p>
              <p>Your application has been submitted and our team will start matching you with suitable providers. You can view your application summary, go to your dashboard, or view your matches right away!</p>
              <div className="popup-buttons-group" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
                <button className="btn btn-secondary" onClick={handleCloseCongratulationsPopup}>View Summary</button>
                <button className="btn btn-primary" onClick={handleViewMatches}>View Matches</button>
                <button className="btn btn-secondary" onClick={handleNavigateToDashboard}>Go to Dashboard</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded header should be outside in parent, but keep title here too (harmless) */}
      <h1 style={{ width: "100%", textAlign: "center", margin: "20px 0", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", lineHeight: 1.2, wordBreak: "break-word" }}>
        Products/Services Request
      </h1>

      {/* Progress Tracker */}
      <div className="profile-tracker" style={{ width: "100%", maxWidth: "100%", overflowX: "auto", padding: "10px 0", margin: "20px 0", boxSizing: "border-box" }}>
        <div className="profile-tracker-inner" style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", minWidth: "max-content", padding: "0 10px", flexWrap: "wrap" }}>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => goToSection(section.id)}
              className={`profile-tracker-button ${activeSection === section.id ? "active" : completedSections[section.id] ? "completed" : "pending"}`}
              style={{ minWidth: 100, maxWidth: 190, padding: "10px 8px", fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)", lineHeight: 1.2, textAlign: "center", cursor: "pointer", transition: "all 0.3s ease", wordBreak: "break-word", hyphens: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", minHeight: 60 }}
            >
              {section.label.split("\n").map((line, i) => (
                <span key={i} className="tracker-label-line" style={{ display: "block", margin: "1px 0" }}>{line}</span>
              ))}
              {completedSections[section.id] && (
                <CheckCircle className="check-icon" style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16 }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="content-card" style={{ width: "100%", maxWidth: "100%", padding: 20, margin: "0 auto", backgroundColor: "white", borderRadius: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.1)", boxSizing: "border-box", overflow: "hidden" }}>
        <div style={{ width: "100%", overflowX: "auto" }}>{renderActiveSection()}</div>

        {/* Navigation Buttons */}
        <div className="action-buttons" style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", marginTop: 30, padding: "20px 0", borderTop: "1px solid #eee", flexWrap: "wrap", width: "100%" }}>
          {activeSection !== sections[0].id && (
            <button type="button" onClick={goToPreviousSection} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 5, padding: "10px 15px", fontSize: "clamp(0.8rem, 2vw, 1rem)", minWidth: 100, justifyContent: "center" }}>
              <ChevronLeft size={16} /> Previous
            </button>
          )}

          <button type="button" onClick={handleSaveSection} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 5, padding: "10px 15px", fontSize: "clamp(0.8rem, 2vw, 1rem)", minWidth: 100, justifyContent: "center" }}>
            <Save size={16} /> Save
          </button>

          {activeSection !== sections[sections.length - 1].id ? (
            <button type="button" onClick={handleSaveAndContinue} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 5, padding: "10px 15px", fontSize: "clamp(0.8rem, 2vw, 1rem)", minWidth: 140, justifyContent: "center" }}>
              Save & Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={submitApplication} className="btn btn-primary" disabled={!formData.contactSubmission?.declaration}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "10px 15px", fontSize: "clamp(0.8rem, 2vw, 1rem)", minWidth: 140, justifyContent: "center", opacity: !formData.contactSubmission?.declaration ? 0.6 : 1 }}>
              Submit Application
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductApplication
