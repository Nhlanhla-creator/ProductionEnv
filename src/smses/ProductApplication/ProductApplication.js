"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
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
  {
    title: "Welcome to Products/Services Application",
    content:
      "This application will help us understand your product and service needs so we can match you with the right providers.",
    icon: "🛍️",
  },
  {
    title: "Step 1: Request Overview",
    content: "Start by providing basic information about what you're looking for and your budget requirements.",
    icon: "📝",
  },
  {
    title: "Step 2: Products & Services",
    content: "Specify the categories and details of the products or services you need.",
    icon: "📦",
  },
  {
    title: "Step 3: Submit & Match",
    content: "Complete your preferences and contact information to help us find the best match for your needs.",
    icon: "✅",
  },
]

const ProductApplication = () => {
  const { section: urlSection } = useParams()
  const navigate = useNavigate()

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // State to track if application is submitted
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  // New state for popups
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0)
  const [forceShowPopup, setForceShowPopup] = useState(false)

  // Initialize active section from URL
  const [activeSection, setActiveSection] = useState(() => {
    return sections.find((s) => s.path === urlSection)?.id || sections[0].id
  })

  // Helper function to get user-specific localStorage key
  const getUserSpecificKey = (baseKey) => {
    const userId = auth.currentUser?.uid
    return userId ? `${baseKey}_${userId}` : baseKey
  }

  // Track completed sections
  const [completedSections, setCompletedSections] = useState(() => {
    const userId = auth.currentUser?.uid
    const key = userId ? `productApplicationCompletedSections_${userId}` : "productApplicationCompletedSections"
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : Object.fromEntries(sections.map((s) => [s.id, false]))
  })

  // Form data state
  const [formData, setFormData] = useState(() => {
    const userId = auth.currentUser?.uid
    const key = userId ? `productApplicationData_${userId}` : "productApplicationData"
    const saved = localStorage.getItem(key)
    const parsedData = saved ? JSON.parse(saved) : {}

    // Ensure all sections have default values
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

  // Load submission status and check for first-time visit
  useEffect(() => {
    const userId = auth.currentUser?.uid
    if (!userId) return

    const savedSubmissionStatus = localStorage.getItem(getUserSpecificKey("applicationSubmitted"))
    const hasSeenProductWelcomePopup = localStorage.getItem(getUserSpecificKey("hasSeenProductWelcomePopup")) === "true"

    // For new users, always show the welcome popup first
    if (!hasSeenProductWelcomePopup) {
      setShowWelcomePopup(true)
      // Don't set the localStorage flag yet - we'll set it when they close the popup

      // Important: Don't show summary for new users until they've seen the popup
      setShowSummary(false)
    } else if (savedSubmissionStatus === "true" && !forceShowPopup && !urlSection) {
      // FIXED: Only show summary if we're on the base route, not a specific section
      setApplicationSubmitted(true)
      setShowSummary(true)
    }
  }, [forceShowPopup, urlSection]) // Added urlSection dependency

  // Save to localStorage whenever data changes
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

  // Update URL when active section changes (but only if we're not on base route)
  useEffect(() => {
    const section = sections.find((s) => s.id === activeSection)
    if (section && !showSummary && urlSection) {
      // Only navigate if we already have a section in URL
      navigate(`/applications/product/${section.path}`, { replace: true })
    }
  }, [activeSection, navigate, showSummary, urlSection])

  // FIXED: Update activeSection when URL changes, but handle base route properly
  useEffect(() => {
    if (urlSection) {
      const section = sections.find((s) => s.path === urlSection)
      if (section) {
        setActiveSection(section.id)
        // If navigating to a specific section, don't show summary
        setShowSummary(false)
      }
    } else {
      // If on base route /applications/product, check if app is submitted
      const userId = auth.currentUser?.uid
      if (userId) {
        const savedSubmissionStatus = localStorage.getItem(`applicationSubmitted_${userId}`)
        if (savedSubmissionStatus === "true") {
          setShowSummary(true)
        } else {
          // For new applications on base route, start with first section
          setActiveSection(sections[0].id)
          navigate(`/applications/product/${sections[0].path}`, { replace: true })
        }
      }
    }
  }, [urlSection, navigate])

  // Navigation handler
  const goToSection = (sectionId) => {
    const section = sections.find((s) => s.id === sectionId)
    if (section) {
      setActiveSection(section.id)
      setShowSummary(false) // FIXED: Ensure we don't show summary when navigating to sections
      navigate(`/applications/product/${section.path}`, { replace: true })
      window.scrollTo(0, 0)
    }
  }

  // Handle editing the application after submission
  const handleEditApplication = () => {
    // When editing from summary, force the welcome popup to show if it's a new user
    const hasSeenProductWelcomePopup = localStorage.getItem(getUserSpecificKey("hasSeenProductWelcomePopup")) === "true"
    if (!hasSeenProductWelcomePopup) {
      setForceShowPopup(true)
    }

    setShowSummary(false)
    setActiveSection(sections[0].id)
    window.scrollTo(0, 0)
  }

  // Popup handlers
  const handleNextOnboardingStep = () => {
    if (currentOnboardingStep < onboardingSteps.length - 1) {
      setCurrentOnboardingStep(currentOnboardingStep + 1)
    } else {
      handleCloseWelcomePopup()
    }
  }

  const handleCloseWelcomePopup = () => {
    setShowWelcomePopup(false)
    setForceShowPopup(false)

    // Now that they've seen the popup, set the flag
    localStorage.setItem(getUserSpecificKey("hasSeenProductWelcomePopup"), "true")

    // FIXED: Only show summary if we're on the base route and application was submitted
    if (applicationSubmitted && !urlSection) {
      setShowSummary(true)
    }
  }

  const handleCloseCongratulationsPopup = () => {
    setShowCongratulationsPopup(false)
    setShowSummary(true) // Show the summary after closing the congratulations popup
  }

  const handleNavigateToDashboard = () => {
    navigate("/dashboard")
  }

  const handleViewMatches = () => {
    navigate("/funding-matches")
  }

  // Data handling functions
  const updateFormData = (section, newData) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...newData,
      },
    }))
  }

  // Save current section
  const saveCurrentSection = () => {
    const userId = auth.currentUser?.uid
    if (!userId) return

    localStorage.setItem(getUserSpecificKey("productApplicationData"), JSON.stringify(formData))
    setCompletedSections((prev) => ({ ...prev, [activeSection]: true }))
    alert("Section saved successfully!")
  }

  // Navigate to next section
  const goToNextSection = () => {
    const currentIndex = sections.findIndex((s) => s.id === activeSection)
    if (currentIndex < sections.length - 1) {
      setCompletedSections((prev) => ({ ...prev, [activeSection]: true }))
      goToSection(sections[currentIndex + 1].id)
    }
  }

  // Navigate to previous section
  const goToPreviousSection = () => {
    const currentIndex = sections.findIndex((s) => s.id === activeSection)
    if (currentIndex > 0) {
      goToSection(sections[currentIndex - 1].id)
    }
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

      // First handle file uploads
      const sectionData = section ? formData[section] : formData
      const uploaded = section
        ? { [section]: await uploadFilesAndReplaceWithURLs(sectionData, section) }
        : await uploadFilesAndReplaceWithURLs(formData, "full")

      // Prepare the complete data to save, including completedSections
      const dataToSave = {
        ...uploaded, // This includes the uploaded files with their URLs
        completedSections: {
          ...completedSections,
        },
        lastUpdated: new Date().toISOString(),
      }

      if (section) {
        // If saving a specific section, merge just that section and its completion status
        await setDoc(
          docRef,
          {
            ...uploaded, // The uploaded section data with file URLs
            [`completedSections.${section}`]: completedSections[section],
            lastUpdated: new Date().toISOString(),
          },
          { merge: true },
        )
      } else {
        // If saving everything, save all data and all completion statuses
        await setDoc(docRef, dataToSave, { merge: true })
      }
    } catch (err) {
      console.error("Error saving to Firebase:", err)
      alert("Failed to save to Firebase.")
    }
  }

  const handleSaveSection = async () => {
    // Mark current section as completed
    const updatedCompletedSections = {
      ...completedSections,
      [activeSection]: true,
    }

    setCompletedSections(updatedCompletedSections)
    await saveDataToFirebase(activeSection)
    alert("Section saved successfully!")
  }

  const handleSaveAndContinue = async () => {
    // Mark current section as completed
    const updatedCompletedSections = {
      ...completedSections,
      [activeSection]: true,
    }

    setCompletedSections(updatedCompletedSections)
    await saveDataToFirebase(activeSection)
    goToNextSection()
  }

  // Submit the application
  const submitApplication = async () => {
    try {
      // Mark all sections as completed when submitting
      const allCompleted = Object.fromEntries(sections.map((s) => [s.id, true]))

      setCompletedSections(allCompleted)

      // Set application as submitted
      setApplicationSubmitted(true)

      // Save to Firebase
      await saveDataToFirebase()

      // Show congratulations popup only if user hasn't seen it before
      const hasSeenProductCongratulationsPopup =
        localStorage.getItem(getUserSpecificKey("hasSeenProductCongratulationsPopup")) === "true"
      if (!hasSeenProductCongratulationsPopup) {
        setShowCongratulationsPopup(true)
        localStorage.setItem(getUserSpecificKey("hasSeenProductCongratulationsPopup"), "true")
      } else {
        // Navigate to base route and show summary
        navigate("/applications/product")
        setShowSummary(true)
      }

      window.scrollTo(0, 0)
    } catch (err) {
      console.error("Failed to submit application:", err)
      alert("Failed to submit application.")
    }
  }

  // Render current section
  const renderActiveSection = () => {
    // Ensure the section data exists with defaults
    const sectionData = formData[activeSection] || {}

    const sectionProps = {
      data: sectionData,
      updateData: (newData) => updateFormData(activeSection, newData),
    }

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

  useEffect(() => {
    const checkSidebarState = () => {
      const sidebarCollapsed = document.body.classList.contains("sidebar-collapsed")
      setIsSidebarCollapsed(sidebarCollapsed)
    }

    // Check initial state
    checkSidebarState()

    // Create observer to watch for class changes on body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          checkSidebarState()
        }
      })
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const getContainerStyles = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    padding: isSidebarCollapsed
      ? "80px 20px 20px 80px" // Collapsed: minimal left padding
      : "80px 10px 20px 280px", // Expanded: full sidebar width padding
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
  })

  // FIXED: Only show summary if we're on base route and not in a specific section
  if (showSummary && !showWelcomePopup && !urlSection) {
    return <ApplicationSummary data={formData} onEdit={handleEditApplication} />
  }

  return (
    <div style={getContainerStyles()} className="product-application-container">
      {/* Welcome Popup for first-time users */}
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
              <p>You've successfully completed your Products/Services Application!</p>
              <p>
                Your application has been submitted and our team will start matching you with suitable providers. You
                can view your application summary, go to your dashboard, or view your matches right away!
              </p>
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
                <button className="btn btn-secondary" onClick={handleCloseCongratulationsPopup}>
                  View Summary
                </button>
                <button className="btn btn-primary" onClick={handleViewMatches}>
                  View Matches
                </button>
                <button className="btn btn-secondary" onClick={handleNavigateToDashboard}>
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1
        style={{
          width: "100%",
          textAlign: "center",
          margin: "20px 0",
          fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
          lineHeight: "1.2",
          wordBreak: "break-word",
        }}
      >
        Products/Services Request
      </h1>

      {/* Progress Tracker */}
      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          padding: "10px 0",
          margin: "20px 0",
          boxSizing: "border-box",
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
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => goToSection(section.id)}
              style={{
                minWidth: "100px",
                maxWidth: "190px",
                padding: "10px 8px",
                fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)",
                lineHeight: "1.2",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                wordBreak: "break-word",
                hyphens: "auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                minHeight: "60px",
              }}
              className={`profile-tracker-button ${
                activeSection === section.id ? "active" : completedSections[section.id] ? "completed" : "pending"
              }`}
            >
              {section.label.split("\n").map((line, i) => (
                <span key={i} className="tracker-label-line" style={{ display: "block", margin: "1px 0" }}>
                  {line}
                </span>
              ))}
              {completedSections[section.id] && (
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
          ))}
        </div>
      </div>

      {/* Form Content */}
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
        className="content-card"
      >
        <div style={{ width: "100%", overflowX: "auto" }}>{renderActiveSection()}</div>

        {/* Navigation Buttons */}
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
          {!isFirstSection && (
            <button
              type="button"
              onClick={goToPreviousSection}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "10px 15px",
                fontSize: "clamp(0.8rem, 2vw, 1rem)",
                minWidth: "100px",
                justifyContent: "center",
              }}
              className="btn btn-secondary"
            >
              <ChevronLeft size={16} /> Previous
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveSection}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "10px 15px",
              fontSize: "clamp(0.8rem, 2vw, 1rem)",
              minWidth: "100px",
              justifyContent: "center",
            }}
            className="btn btn-secondary"
          >
            <Save size={16} /> Save
          </button>

          {!isLastSection ? (
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
              onClick={submitApplication}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "10px 15px",
                fontSize: "clamp(0.8rem, 2vw, 1rem)",
                minWidth: "140px",
                justifyContent: "center",
                opacity: !formData.contactSubmission?.declaration ? "0.6" : "1",
              }}
              className="btn btn-primary"
              disabled={!formData.contactSubmission?.declaration}
            >
              Submit Application
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductApplication
