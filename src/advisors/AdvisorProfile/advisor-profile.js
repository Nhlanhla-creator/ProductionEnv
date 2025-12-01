"use client"

import { useState, useEffect } from "react"
import { CheckCircle, ChevronRight, ChevronLeft, Save, X, ArrowRight } from "lucide-react"
import styles from "./AdvisorProfile.module.css"
import AdvisorProfileSummary from "./advisor-profile-summary"

import Instructions from "./Instructions​"
import PersonalProfessionalOverview from "./PersonalProfessional"
import ContactDetails from "./Contacts"
import SelectionCriteria from "./SelectionCriteria"
import ProfessionalCredentials from "./ProfessionalCredentialss"
import RequiredDocuments from "./RequiredDocuments"
import DeclarationConsent from "./Consent"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "../../firebaseConfig"
import { useNavigate } from "react-router-dom"

import { documentsList } from "./documentsconfig"

const sections = [
  { id: "instructions", label: "Instructions" },
  { id: "personalProfessionalOverview", label: "Personal & Professional\nOverview" },
  { id: "contactDetails", label: "Contact\nDetails" },
  { id: "selectionCriteria", label: "Selection\nCriteria" },
  { id: "professionalCredentials", label: "Professional\nCredentials" },
  { id: "requiredDocuments", label: "Required\nDocuments" },
  { id: "declarationConsent", label: "Declaration &\nConsent" },
]

const sectionValidations = {
  personalProfessionalOverview: (data) => {
    if (!data) return false

    // Define required fields explicitly
    const requiredFields = ["professionalHeadline", "briefBio", "yearsOfExperience"]

    for (const field of requiredFields) {
      if (
        data[field] === undefined ||
        data[field] === null ||
        (typeof data[field] === "string" && data[field].trim() === "") ||
        (Array.isArray(data[field]) && data[field].length === 0)
      ) {
        return false
      }
    }

    // Optional: validate briefBio word count (<= 200)
    const wordCount =
      data.briefBio
        ?.trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length || 0
    if (wordCount > 200) return false

    return true
  },
  selectionCriteria: (data) => {
    if (!data) return false

    const requiredFields = [
      "preferredAdvisorRole",
      "advisorySupportType",
      "smeStageFit",
      "timeCommitment",
      "compensationModel",
    ]

    for (const field of requiredFields) {
      if (
        data[field] === undefined ||
        data[field] === null ||
        (typeof data[field] === "string" && data[field].trim() === "") ||
        (Array.isArray(data[field]) && data[field].length === 0)
      ) {
        return false
      }
    }

    return true
  },

  contactDetails: (data) => {
    if (!data) return false

    const requiredFields = ["name", "surname", "position", "mobile", "email", "country"]

    for (const field of requiredFields) {
      if (!data[field] || data[field].toString().trim() === "") {
        return false
      }
    }

    return true
  },

  professionalCredentials: (data) => {
    if (!data) return false

    const requiredFields = ["qualifications", "currentBoardSeats", "pastBoardRoles"]

    for (const field of requiredFields) {
      if (
        data[field] === undefined ||
        data[field] === null ||
        (typeof data[field] === "string" && data[field].trim() === "") ||
        (Array.isArray(data[field]) && data[field].length === 0)
      ) {
        return false
      }
    }

    return true
  },

  requiredDocuments: (data) => {
    if (!data || typeof data !== "object") return false

    const requiredDocs = Array.isArray(documentsList)
      ? documentsList.filter((doc) => doc.required).map((doc) => doc.id)
      : []

    for (const docId of requiredDocs) {
      const files = data[docId]
      if (!Array.isArray(files) || files.length === 0) {
        return false
      }
    }

    return true
  },

  declarationConsent: (data) => {
    return data?.codeOfConduct === true && data?.dataSharingConsent === true && data?.availabilityConfirmation === true
  },
}

// Onboarding steps for the welcome popup
const onboardingSteps = [
  {
    title: "Welcome to Advisor Profile",
    content:
      "This profile will help us understand your expertise and match you with SMEs that need your advisory support.",
    icon: "👋",
  },
  {
    title: "Step 1: Read Instructions",
    content: "Start by reading the instructions carefully to understand what information you'll need to provide.",
    icon: "📝",
  },
  {
    title: "Step 2: Fill in Your Details",
    content: "Complete each section with accurate information about your background, expertise, and preferences.",
    icon: "📋",
  },
  {
    title: "Step 3: Upload Documents",
    content: "Upload required documents including ID, CV, certifications, and reference letters.",
    icon: "📄",
  },
  {
    title: "Step 4: Review & Submit",
    content: "Review your information in the summary page and submit when you're ready. You can always edit later.",
    icon: "✅",
  },
]

export default function AdvisorProfile() {
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState("instructions")
  const [profileSubmitted, setProfileSubmitted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sectionLoading, setSectionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [profileData, setProfileData] = useState(null)

  const isProfileComplete = () => {
    return Object.entries(sectionValidations).every(([key, validate]) => validate(formData[key] || {}))
  }

  const [validationModal, setValidationModal] = useState({
    open: false,
    title: "",
    messages: [],
  })

  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0)

  // Initial data structure for formData
  const [formData, setFormData] = useState({
    instructions: {},
    personalProfessionalOverview: {},
    selectionCriteria: {},
    contactDetails: {},
    professionalCredentials: {},
    requiredDocuments: {},
    declarationConsent: {
      codeOfConduct: false,
      dataSharingConsent: false,
      availabilityConfirmation: false,
    },
  })

  const [completedSections, setCompletedSections] = useState({
    instructions: true,
    personalProfessionalOverview: false,
    selectionCriteria: false,
    contactDetails: false,
    professionalCredentials: false,
    requiredDocuments: false,
    declarationConsent: false,
  })

  // Helper function to get user-specific localStorage key
  const getUserSpecificKey = (baseKey) => {
    const userId = auth.currentUser?.uid
    return userId ? `${baseKey}_${userId}` : baseKey
  }

  // Function to check if declaration consent is complete
  const checkDeclarationConsent = (data) => {
    const declarationConsent = data?.formData?.declarationConsent || data?.declarationConsent
    if (!declarationConsent) return false

    return (
      declarationConsent.codeOfConduct === true &&
      declarationConsent.dataSharingConsent === true &&
      declarationConsent.availabilityConfirmation === true
    )
  }

  useEffect(() => {
    const requiredDocs = Array.isArray(documentsList)
      ? documentsList.filter((doc) => doc.required).map((doc) => doc.id)
      : []

    const uploadedDocs = formData.requiredDocuments || {}

    const isComplete = requiredDocs.every(
      (docId) => Array.isArray(uploadedDocs[docId]) && uploadedDocs[docId].length > 0,
    )

    if (isComplete && !completedSections.requiredDocuments) {
      setCompletedSections((prev) => ({ ...prev, requiredDocuments: true }))
    } else if (!isComplete && completedSections.requiredDocuments) {
      setCompletedSections((prev) => ({ ...prev, requiredDocuments: false }))
    }
  }, [formData.requiredDocuments])

  // Load profile data from Firebase first, then fall back to localStorage
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // First try to fetch from Firebase
        const docRef = doc(db, "advisorProfiles", user.uid)
        const docSnap = await getDoc(docRef)

        let firebaseData = null
        let firebaseCompletedSections = null
        let firebaseSubmissionStatus = false

        if (docSnap.exists()) {
          const data = docSnap.data()
          firebaseData = data.formData
          firebaseCompletedSections = data.completedSections

          // Check if declaration consent is complete in Firebase
          const declarationConsentComplete = checkDeclarationConsent(data)

          // Profile is considered submitted if declaration consent is complete OR profileSubmitted is true
          firebaseSubmissionStatus = declarationConsentComplete || data.profileSubmitted === true

          // Set data from Firebase
          if (firebaseData) setFormData((prev) => ({ ...prev, ...firebaseData }))
          if (firebaseCompletedSections) setCompletedSections((prev) => ({ ...prev, ...firebaseCompletedSections }))

          // If profile is marked as submitted in Firebase, show summary
          if (firebaseSubmissionStatus) {
            setProfileSubmitted(true)
            setShowSummary(true)
          }
        }

        // Check if this is the first time visiting - only show welcome popup for new users
        const hasSeenWelcomePopup = localStorage.getItem(getUserSpecificKey("hasSeenAdvisorWelcomePopup")) === "true"
        if (!hasSeenWelcomePopup) {
          setShowWelcomePopup(true)
          localStorage.setItem(getUserSpecificKey("hasSeenAdvisorWelcomePopup"), "true")
        }
      } catch (error) {
        console.error("Error fetching profile data:", error)
        setError("Failed to load profile data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem("advisorProfileData", JSON.stringify(formData))
  }, [formData])

  useEffect(() => {
    localStorage.setItem("advisorProfileCompletedSections", JSON.stringify(completedSections))
  }, [completedSections])

  useEffect(() => {
    localStorage.setItem("advisorProfileSubmitted", profileSubmitted.toString())
  }, [profileSubmitted])

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          const isCollapsed = document.body.classList.contains("sidebar-collapsed")
          setIsSidebarCollapsed(isCollapsed)
        }
      })
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    // Check initial state
    setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))

    return () => observer.disconnect()
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

  const markSectionAsCompleted = async (section) => {
    setCompletedSections((prev) => {
      const updated = { ...prev, [section]: true }

      // Save to Firebase
      const userId = auth.currentUser?.uid
      if (userId) {
        const docRef = doc(db, "advisorProfiles", userId)
        setDoc(docRef, { completedSections: updated }, { merge: true })
      }

      return updated
    })
  }

  const navigateToNextSection = async () => {
    setSectionLoading(true)

    // Simulate some processing time for better UX
    await new Promise((resolve) => setTimeout(resolve, 800))

    const currentIndex = sections.findIndex((s) => s.id === activeSection)
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id)
      window.scrollTo(0, 0)
    }

    setSectionLoading(false)
  }

  const navigateToPreviousSection = async () => {
    setSectionLoading(true)

    // Simulate some processing time for better UX
    await new Promise((resolve) => setTimeout(resolve, 500))

    const currentIndex = sections.findIndex((s) => s.id === activeSection)
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id)
      window.scrollTo(0, 0)
    }

    setSectionLoading(false)
  }

  const handleEditProfile = () => {
    setShowSummary(false)
    setProfileSubmitted(false)
    setActiveSection("personalProfessionalOverview")
    window.scrollTo(0, 0)
  }

  const renderActiveSection = () => {
    const sectionData = formData[activeSection] || {}
    const updateData = (data) => updateFormData(activeSection, data)

    const commonProps = { data: sectionData, updateData }

    try {
      switch (activeSection) {
        case "instructions":
          return <Instructions />
        case "personalProfessionalOverview":
          return <PersonalProfessionalOverview {...commonProps} />
        case "selectionCriteria":
          return <SelectionCriteria {...commonProps} />
        case "contactDetails":
          return <ContactDetails {...commonProps} />
        case "professionalCredentials":
          return <ProfessionalCredentials {...commonProps} />
        case "requiredDocuments":
          return <RequiredDocuments {...commonProps} />
        case "declarationConsent":
          return <DeclarationConsent {...commonProps} />
        default:
          return <Instructions />
      }
    } catch (error) {
      console.error("Error rendering section:", activeSection, error)
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h3>Component Loading Error</h3>
          <p>There was an issue loading the {activeSection} component.</p>
          <p>Please check that the component file exists and is properly exported.</p>
        </div>
      )
    }
  }

  const uploadFilesAndReplaceWithURLs = async (data, section) => {
    const uploadRecursive = async (item, pathPrefix) => {
      if (item instanceof File) {
        const fileRef = ref(storage, `advisorProfile/${auth.currentUser?.uid}/${pathPrefix}`)
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

  const saveDataToFirebase = async (section = null, includingSubmissionStatus = false) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error("User not logged in.")

      const docRef = doc(db, "advisorProfiles", userId)
      const sectionData = section ? formData[section] : formData

      const uploaded = section
        ? {
            ...(section !== "instructions" && {
              [section]: await uploadFilesAndReplaceWithURLs(sectionData, section),
            }),
          }
        : await uploadFilesAndReplaceWithURLs(sectionData, "full")

      const dataToSave = {
        formData: section ? { ...uploaded } : uploaded,
        completedSections,
      }

      // Only include submission status if specifically requested
      if (includingSubmissionStatus) {
        dataToSave.profileSubmitted = profileSubmitted
      }

      await setDoc(docRef, dataToSave, { merge: true })

      return true
    } catch (err) {
      console.error("Error saving to Firebase:", err)
      throw err
    }
  }

  const handleSaveSection = async () => {
    try {
      setSectionLoading(true)
      await saveDataToFirebase(activeSection)
      
    } catch (err) {
      alert("Failed to save.")
    } finally {
      setSectionLoading(false)
    }
  }

  const handleSaveAndContinue = async () => {
    const sectionData = formData[activeSection] || {}
    const isValid = sectionValidations[activeSection]?.(sectionData)

    if (!isValid && activeSection !== "instructions") {
      const errors = []

      // Default fallback
      if (errors.length === 0) {
        errors.push(
          `${sections.find((s) => s.id === activeSection)?.label.replace(/\n/g, " ")} is incomplete or has invalid fields.`,
        )
      }

      setValidationModal({
        open: true,
        title: "Please review the following:",
        messages: errors,
      })

      return
    }

    try {
      setSectionLoading(true)
      await markSectionAsCompleted(activeSection)

      await saveDataToFirebase(activeSection)

      await new Promise((resolve) => setTimeout(resolve, 800))

      const currentIndex = sections.findIndex((s) => s.id === activeSection)
      if (currentIndex < sections.length - 1) {
        setActiveSection(sections[currentIndex + 1].id)
        window.scrollTo(0, 0)
      }
    } catch (err) {
      alert("Failed to save. Please try again.")
    } finally {
      setSectionLoading(false)
    }
  }

  const handleSubmitProfile = async () => {
    try {
      setSectionLoading(true)

      // Mark the current section as completed
      await markSectionAsCompleted("declarationConsent")

      // Set profile as submitted
      const allSectionsValid = Object.entries(sectionValidations).every(
        ([sectionKey, validate]) => validate(formData[sectionKey] || {}) && completedSections[sectionKey],
      )

      if (!allSectionsValid) {
        const invalidSections = Object.entries(sectionValidations)
          .filter(([key, validate]) => !validate(formData[key] || {}) || !completedSections[key])
          .map(([key]) => key)

        alert("Please complete and validate all sections before submitting:\n" + invalidSections.join(", "))
        setSectionLoading(false)
        return
      }

      setProfileSubmitted(true)

      // First save everything to Firebase including the submission status
      await saveDataToFirebase(null, true)

      // Add a delay to show processing
      await new Promise((resolve) => setTimeout(resolve, 1200))

      // Check if user has seen the congratulations popup before
      const hasSeenCongratulationsPopup =
        localStorage.getItem(getUserSpecificKey("hasSeenAdvisorCongratulationsPopup")) === "true"

      if (!hasSeenCongratulationsPopup) {
        // Show congratulations popup only for first-time completion
        setShowCongratulationsPopup(true)
        localStorage.setItem(getUserSpecificKey("hasSeenAdvisorCongratulationsPopup"), "true")
      } else {
        // Just show the summary directly
        setShowSummary(true)
      }

      // Scroll to top for better user experience
      window.scrollTo(0, 0)
    } catch (err) {
      console.error("Failed to submit profile:", err)
      alert("Failed to submit profile. Please try again.")

      // Revert the submission status if Firebase save failed
      setProfileSubmitted(false)
    } finally {
      setSectionLoading(false)
    }
  }

  // Popup handlers
  const handleNextOnboardingStep = () => {
    if (currentOnboardingStep < onboardingSteps.length - 1) {
      setCurrentOnboardingStep(currentOnboardingStep + 1)
    } else {
      setShowWelcomePopup(false)
    }
  }

  const handleCloseWelcomePopup = () => {
    setShowWelcomePopup(false)
  }

  const handleCloseCongratulationsPopup = () => {
    setShowCongratulationsPopup(false)
    setShowSummary(true)
  }

  const handleNavigateToMatches = () => {
    navigate("/advisor-matches")
  }

  // If still loading initially, show a loading message
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <div className="loading-message">Loading profile data...</div>
      </div>
    )
  }

  // If there's an error, show an error message
  if (error) {
    return <div className="error">{error}</div>
  }

  // If section loading overlay when transitioning between sections
  if (sectionLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <div className="loading-message">Preparing next step...</div>
      </div>
    )
  }

  // If profile is submitted and we're showing the summary
  if (showSummary && !showCongratulationsPopup) {
    return <AdvisorProfileSummary data={formData} onEdit={handleEditProfile} />
  }

  return (
    <div
      className="universal-profile-container"
      style={{
        padding: "70px 20px 20px",
        marginLeft: isSidebarCollapsed ? "100px" : "270px",
        transition: "margin-left 0.3s ease",
        width: `calc(100vw - ${isSidebarCollapsed ? "100px" : "270px"})`,
        boxSizing: "border-box",
        minHeight: "100vh",
        backgroundColor: "#f5f7fa",
      }}
    >
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
              <h2 className="text-lg font-semibold">{validationModal.title}</h2>
              <ul className="list-disc pl-5 mt-2 text-sm text-red-600">
                {validationModal.messages.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
              <div className="mt-4 flex justify-end">
                <button
                  className="btn btn-primary"
                  onClick={() => setValidationModal({ open: false, title: "", messages: [] })}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Popup for first-time users */}
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
              <p>You've successfully completed your Advisor Profile!</p>
              <p>You can now view your profile summary, go to your dashboard to see potential SME matches.</p>
              <div className="popup-buttons-group">
                <button className="btn btn-secondary" onClick={handleCloseCongratulationsPopup}>
                  View Summary
                </button>
                <button className="btn btn-secondary" onClick={handleNavigateToMatches}>
                  View SME Matches
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1>My Advisor Profile</h1>

      <div className={`${styles.profileTracker} profile-tracker`}>
        <div className={`${styles.profileTrackerInner} profile-tracker-inner`}>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`${styles.profileTrackerButton} profile-tracker-button ${
                activeSection === section.id ? "active" : completedSections[section.id] ? "completed" : "pending"
              }`}
            >
              {section.label.split("\n").map((line, i) => (
                <span key={i} className={`${styles.trackerLabelLine} tracker-label-line`}>
                  {line}
                </span>
              ))}
              {completedSections[section.id] && <CheckCircle className="check-icon" />}
            </button>
          ))}
        </div>
      </div>

      <div className={`${styles.contentCard} content-card`}>
        {renderActiveSection()}

        <div className={`${styles.actionButtons} action-buttons`}>
          {activeSection !== "instructions" && (
            <button
              type="button"
              onClick={navigateToPreviousSection}
              className={`${styles.btn} ${styles.btnSecondary} btn btn-secondary`}
              disabled={sectionLoading}
            >
              <ChevronLeft size={16} /> Previous
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveSection}
            className={`${styles.btn} ${styles.btnSecondary} btn btn-secondary`}
            disabled={sectionLoading}
          >
            <Save size={16} /> Save
          </button>

          {activeSection !== "declarationConsent" ? (
            <button type="button" onClick={handleSaveAndContinue} className="btn btn-primary">
              Save & Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary} btn btn-primary`}
              onClick={handleSubmitProfile}
              disabled={!sectionValidations.declarationConsent(formData.declarationConsent || {})}
            >
              Submit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  )
}