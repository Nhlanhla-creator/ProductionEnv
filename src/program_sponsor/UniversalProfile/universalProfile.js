"use client"
import { useState, useEffect } from "react"
import { CheckCircle, ChevronLeft, ChevronRight, Save } from "lucide-react"
import { db, auth } from "../../firebaseConfig" // Assuming firebaseConfig is correctly set up
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore"
import ProgramSponsorInstructions from "./Instructions"
import ProgramSponsorEntityOverview from "./EntityOverview"
import ProgramSponsorContactDetails from "./ContactDetails"
import ProgramSponsorProgramDetails from "./ProgramDetails"
import ProgramSponsorRequiredDocuments from "./ProgramSponsorRequiredDocuments" // NEW IMPORT
import ProgramSponsorDeclarationConsent from "./DeclarationConsent"
import ProgramSponsorProfileSummary from "./program-sponsor-profile-summary"

const sections = [
  { id: "instructions", title: "Instructions", component: ProgramSponsorInstructions },
  { id: "entityOverview", title: "Entity\nOverview", component: ProgramSponsorEntityOverview },
  { id: "contactDetails", title: "Contact\nDetails", component: ProgramSponsorContactDetails },
  { id: "programDetails", title: "Program\nDetails", component: ProgramSponsorProgramDetails },
  { id: "requiredDocuments", title: "Required\nDocuments", component: ProgramSponsorRequiredDocuments }, // NEW SECTION
  { id: "declarationConsent", title: "Declaration &\nConsent", component: ProgramSponsorDeclarationConsent },
]

const ProgramSponsorUniversalProfile = () => {
  const [activeSection, setActiveSection] = useState("instructions")
  const [completedSections, setCompletedSections] = useState(new Set())
  const [formData, setFormData] = useState({
    instructions: {},
    entityOverview: {},
    contactDetails: {},
    programDetails: {},
    requiredDocuments: {}, // NEW FIELD
    declarationConsent: {
      // Ensure all boolean fields are initialized here
      accuracy: false,
      dataProcessing: false,
      termsConditions: false,
      communicationConsent: false,
      reportingCompliance: false,
      programSponsorshipDeclaration: false,
    },
  })
  const [isLoading, setIsLoading] = useState(true) // Added isLoading state
  const [showSummary, setShowSummary] = useState(false)

  // Load saved data from Firebase
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true)
        const userId = auth.currentUser?.uid
        if (!userId) {
          setIsLoading(false)
          return
        }
        const docRef = doc(db, "programSponsorProfiles", userId) // Changed collection name
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const profileData = docSnap.data()
          // Merge loaded data with default structure to ensure all fields exist
          setFormData((prevFormData) => ({
            ...prevFormData,
            ...profileData.formData,
            declarationConsent: {
              ...prevFormData.declarationConsent, // Keep default booleans if not in loaded data
              ...profileData.formData?.declarationConsent,
            },
          }))
          const loadedCompletedSections = new Set(profileData.completedSections || [])
          setCompletedSections(loadedCompletedSections)
          // If declarationConsent is completed, show summary first
          if (loadedCompletedSections.has("declarationConsent")) {
            setShowSummary(true)
          }
          console.log("Loaded formData from Firebase:", profileData.formData) // ADD THIS LINE
        }
      } catch (err) {
        console.error("Error loading profile data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProfileData()
  }, [])

  // Save to Firebase
  const saveToFirebase = async (data, completed) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return
      const docRef = doc(db, "programSponsorProfiles", userId) // Changed collection name
      await updateDoc(docRef, {
        formData: data,
        completedSections: Array.from(completed), // Convert Set to Array for Firestore
        lastUpdated: new Date(),
      }).catch(async (err) => {
        if (err.code === "not-found") {
          await setDoc(docRef, {
            formData: data,
            completedSections: Array.from(completed),
            createdAt: new Date(),
            lastUpdated: new Date(),
            userId: userId,
            userEmail: auth.currentUser?.email,
          })
        } else throw err
      })
      console.log("Saved formData to Firebase:", data) // ADD THIS LINE
    } catch (error) {
      console.error("Error saving to Firebase:", error)
    }
  }

  const updateSectionData = async (sectionId, data) => {
    const updatedFormData = {
      ...formData,
      [sectionId]: { ...formData[sectionId], ...data },
    }
    setFormData(updatedFormData)
    await saveToFirebase(updatedFormData, completedSections)
  }

  const markSectionComplete = async (sectionId) => {
    const updatedCompleted = new Set([...completedSections, sectionId])
    setCompletedSections(updatedCompleted)
    await saveToFirebase(formData, updatedCompleted)
  }

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId)
  }

  const getCurrentComponent = () => {
    const currentSection = sections.find((section) => section.id === activeSection)
    if (!currentSection) return null
    const Component = currentSection.component
    return (
      <Component
        data={formData[activeSection]}
        updateData={(data) => updateSectionData(activeSection, data)}
        onComplete={() => markSectionComplete(activeSection)}
      />
    )
  }

  const handleEditFromSummary = () => {
    setShowSummary(false)
    setActiveSection("entityOverview")
  }

  const handleSubmitProfile = async () => {
    await markSectionComplete("declarationConsent")
    await saveToFirebase(formData, new Set([...completedSections, "declarationConsent"]))
    setShowSummary(true)
    console.log("Submitted program sponsor profile data:", formData)
  }

  const navigateToNextSection = () => {
    const index = sections.findIndex((s) => s.id === activeSection)
    if (index < sections.length - 1) {
      setActiveSection(sections[index + 1].id)
      window.scrollTo(0, 0)
    }
  }

  const navigateToPreviousSection = () => {
    const index = sections.findIndex((s) => s.id === activeSection)
    if (index > 0) {
      setActiveSection(sections[index - 1].id)
      window.scrollTo(0, 0)
    }
  }

  const handleSaveSection = async () => {
    await saveToFirebase(formData, completedSections)
    alert("Section saved successfully!")
  }

  const handleSaveAndContinue = async () => {
    await markSectionComplete(activeSection)
    await handleSaveSection()
    navigateToNextSection()
  }

  if (isLoading) {
    return (
      <div className="universal-profile-container">
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1>Loading Profile...</h1>
          <p>Please wait while we load your profile data.</p>
        </div>
      </div>
    )
  }

  if (showSummary) {
    console.log("Passing formData to ProgramSponsorProfileSummary:", formData) // ADD THIS LINE
    return <ProgramSponsorProfileSummary formData={formData} onEdit={handleEditFromSummary} />
  }

  return (
    <div className="universal-profile-container">
      <h1>Program Sponsor Universal Profile</h1>
      <p className="profile-subtitle">Complete your profile to access all features</p>
      {/* Progress Tracker */}
      <div className="profile-tracker">
        <div className="profile-tracker-inner">
          {sections.map((section, index) => (
            <button
              key={section.id}
              className={`profile-tracker-button ${activeSection === section.id ? "active" : ""} ${
                completedSections.has(section.id) ? "completed" : "pending"
              }`}
              onClick={() => handleSectionClick(section.id)}
            >
              {completedSections.has(section.id) && <CheckCircle size={16} className="check-icon" />}
              <span className="tracker-label-line">{section.title}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Active Section Content */}
      <div className="section-content">
        <div className="content-card">
          {getCurrentComponent()}
          {/* Action Buttons */}
          <div className="action-buttons">
            {activeSection !== "instructions" && (
              <button type="button" onClick={navigateToPreviousSection} className="btn btn-secondary">
                <ChevronLeft size={16} /> Previous
              </button>
            )}
            <button type="button" onClick={handleSaveSection} className="btn btn-secondary">
              <Save size={16} /> Save
            </button>
            {activeSection !== "declarationConsent" ? (
              <button type="button" onClick={handleSaveAndContinue} className="btn btn-primary">
                Save & Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleSubmitProfile}>
                Submit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgramSponsorUniversalProfile
