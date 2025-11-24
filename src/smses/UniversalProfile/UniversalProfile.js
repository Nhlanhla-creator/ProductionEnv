"use client"
import { useState, useEffect } from "react"
import { CheckCircle, ChevronRight, ChevronLeft, Save } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore"
import styles from "../../catalyst/CatalystUniversalProfile/catalyst-universal-profile.module.css"
import Instructions from "./Instructions"
import PersonalOverview from "./PersonalOverview​"
import AcademicOverview from "./AcademicOverview​"
import ExperienceTrackRecord from "./Experience&TrackRecord"
import ProgramAffiliation from "./ProgramAffiliation"
import SkillsInterests from "./Skills&Interests"
import ProfessionalPresentation from "./ProfessionalPresentation"
import RequiredDocuments from "./RequiredDocuments"
import DeclarationConsent from "./Declaration&Consent"
import StudentProfileSummary from "./StudentProfileSummary"

const sections = [
  { id: "instructions", label: "Instructions" },
  { id: "personalOverview", label: "Personal\nOverview" },
  { id: "academicOverview", label: "Academic\nOverview" },
  { id: "experienceTrackRecord", label: "Experience Track\nRecord" },
  { id: "programAffiliation", label: "Program\nAffiliation" },
  { id: "skillsInterests", label: "Skills\n& Interests" },
  { id: "professionalPresentation", label: "Professional\nPresentation" },
  { id: "requiredDocuments", label: "Required\nDocuments" },
  { id: "declarationConsent", label: "Declaration &\nConsent" },
]

export default function UniversalProfile() {
  const [activeSection, setActiveSection] = useState("instructions")
  const [completedSections, setCompletedSections] = useState({
    instructions: true,
    personalOverview: false,
    academicOverview: false,
    experienceTrackRecord: false,
    programAffiliation: false,
    skillsInterests: false,
    professionalPresentation: false,
    requiredDocuments: false,
    declarationConsent: false,
  })
  const [formData, setFormData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
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
        const docRef = doc(db, "internProfiles", userId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const profileData = docSnap.data()
          setFormData(profileData.formData || {})
          setCompletedSections(
            profileData.completedSections || {
              instructions: true,
              personalOverview: false,
              academicOverview: false,
              experienceTrackRecord: false,
              programAffiliation: false,
              skillsInterests: false,
              professionalPresentation: false,
              requiredDocuments: false,
              declarationConsent: false,
            },
          )
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
// Updated functions to use the new saveToFirebase with triggers

const updateFormData = async (section, data) => {
  const updatedFormData = {
    ...formData,
    [section]: {
      ...formData[section],
      ...data,
    },
  }

  setFormData(updatedFormData)
  await saveToFirebase(updatedFormData, completedSections, section)
}

const markSectionAsCompleted = async (section) => {
  const updatedCompleted = {
    ...completedSections,
    [section]: true,
  }
  
  setCompletedSections(updatedCompleted)
  await saveToFirebase(formData, updatedCompleted, section)
}

// Save to Firebase with evaluation triggers
const saveToFirebase = async (data, completed, section = null) => {
  try {
    const userId = auth.currentUser?.uid
    if (!userId) return
    
    const docRef = doc(db, "internProfiles", userId)
    
    // Define which sections trigger which evaluations
    const triggerSectionsAcademic = ["academicOverview", "skillsInterests"]
    const triggerSectionsPresentation = ["professionalPresentation", "requiredDocuments"]
    const triggerSectionsProfessionalSkills = ["skillsInterests", "professionalPresentation"]
    const triggerSectionsWorkExperience = ["experienceTrackRecord", "programAffiliation"]

    // Base data to save
    const dataToSave = {
      formData: data,
      completedSections: completed,
      lastUpdated: new Date(),
    }

    // Add triggers based on the section being saved
    if (section) {
      const triggerPayload = {}

      if (triggerSectionsAcademic.includes(section)) {
        triggerPayload.triggerAcademicEvaluation = true
      }

      if (triggerSectionsPresentation.includes(section)) {
        triggerPayload.triggerPresentationEvaluation = true
      }

      if (triggerSectionsProfessionalSkills.includes(section)) {
        triggerPayload.triggerProfessionalSkillsEvaluation = true
      }

      if (triggerSectionsWorkExperience.includes(section)) {
        triggerPayload.triggerWorkExperienceEvaluation = true
      }

      // Merge triggers into dataToSave if any were set
      if (Object.keys(triggerPayload).length > 0) {
        Object.assign(dataToSave, triggerPayload)
      }
    }

    await updateDoc(docRef, dataToSave).catch(async (err) => {
      if (err.code === "not-found") {
        await setDoc(docRef, {
          ...dataToSave,
          createdAt: new Date(),
          userId: userId,
          userEmail: auth.currentUser?.email,
        })
      } else throw err
    })
  } catch (error) {
    console.error("Error saving to Firebase:", error)
  }
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
    
  }

  const handleSaveAndContinue = async () => {
    await markSectionAsCompleted(activeSection)
    await handleSaveSection()
    navigateToNextSection()
  }

  const handleSubmitProfile = async () => {
    await markSectionAsCompleted("declarationConsent")
    await saveToFirebase(formData, { ...completedSections, declarationConsent: true })
    setShowSummary(true)
    console.log("Submitted profile data:", formData)
  }

  const handleEditFromSummary = () => {
    setShowSummary(false)
    setActiveSection("personalOverview")
  }

  const renderActiveSection = () => {
    const sectionData = formData[activeSection] || {}
    const updateData = (data) => updateFormData(activeSection, data)
    const commonProps = { data: sectionData, updateData,profileData: { formData } }

    switch (activeSection) {
      case "instructions":
        return <Instructions />
      case "personalOverview":
        return <PersonalOverview {...commonProps} />
      case "academicOverview":
        return <AcademicOverview {...commonProps} />
      case "experienceTrackRecord":
        return <ExperienceTrackRecord {...commonProps} />
      case "programAffiliation":
        return <ProgramAffiliation {...commonProps} />
      case "skillsInterests":
        return <SkillsInterests {...commonProps} />
      case "professionalPresentation":
        return <ProfessionalPresentation {...commonProps} />
      case "requiredDocuments":
        return <RequiredDocuments {...commonProps} />
      case "declarationConsent":
        return <DeclarationConsent {...commonProps} />
      default:
        return <Instructions />
    }
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
    return <StudentProfileSummary formData={formData} onEdit={handleEditFromSummary} />
  }

  return (
    <div className="universal-profile-container">
      <h1>My Universal Profile</h1>
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
            >
              <ChevronLeft size={16} /> Previous
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveSection}
            className={`${styles.btn} ${styles.btnSecondary} btn btn-secondary`}
          >
            <Save size={16} /> Save
          </button>
          {activeSection !== "declarationConsent" ? (
            <button
              type="button"
              onClick={handleSaveAndContinue}
              className={`${styles.btn} ${styles.btnPrimary} btn btn-primary`}
            >
              Save & Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary} btn btn-primary`}
              onClick={handleSubmitProfile}
              disabled={
                !formData.declarationConsent?.accuracyDeclaration ||
                !formData.declarationConsent?.dataProcessingConsent ||
                !formData.declarationConsent?.termsAndConditions
              }
            >
              Submit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  )
}