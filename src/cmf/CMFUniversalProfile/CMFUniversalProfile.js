"use client"

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle, ChevronRight, ChevronLeft, Save, X, Eye, Shield, Users } from "lucide-react"
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import "../../smses/UniversalProfile/UniversalProfile.css"

import {
  CMF_SECTIONS,
  sectionValidations,
  getDefaultCMFFormData,
  getSectionStatus
} from "../cmfProfileConfig"

import CMFInstructions from "./sections/CMFInstructions"
import CMFEntityOverview from "./sections/CMFEntityOverview"
import CMFServicesSupport from "./sections/CMFServicesSupport"
import CMFSMEFocusMatching from "./sections/CMFSMEFocusMatching"
import CMFExperienceNetworks from "./sections/CMFExperienceNetworks"
import CMFFeesEngagement from "./sections/CMFFeesEngagement"
import CMFLegalVerification from "./sections/CMFLegalVerification"
import CMFContactDetails from "./sections/CMFContactDetails"
import CMFDeclarationConsent from "./sections/CMFDeclarationConsent"
import CMFSMEPreviewModal from "./sections/CMFSMEPreviewModal"
import CMFProfileSummary from "./CMFProfileSummary"

const FIRESTORE_COLLECTION = "cmfProfiles"
const LOCAL_STORAGE_KEY_PREFIX = "cmfUniversalProfileFormData"
const LOCAL_STORAGE_SECTIONS_KEY = "cmfUniversalProfileCompletedSections"

export default function CMFUniversalProfile() {
  const db = getFirestore()
  const storage = getStorage()
  const auth = getAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState("instructions")
  const [profileSubmitted, setProfileSubmitted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [validationModal, setValidationModal] = useState({ open: false, title: "", messages: [] })
  const [showSMEPreview, setShowSMEPreview] = useState(false)

  const [completedSections, setCompletedSections] = useState({
    instructions: true,
    entityOverview: false,
    servicesSupport: false,
    smeFocusMatching: false,
    experienceNetworks: false,
    feesEngagement: false,
    legalVerification: false,
    contactDetails: false,
    declarationConsent: false
  })

  const [formData, setFormData] = useState(getDefaultCMFFormData())

  const getUserSpecificKey = (baseKey) => {
    return effectiveUserId ? `${baseKey}_${effectiveUserId}` : baseKey
  }

  // Auth & effectiveUserId synchronization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = `${user.uid}_cmf`
        setEffectiveUserId(uid)
      } else {
        setEffectiveUserId(null)
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  // Load from Firestore / LocalStorage
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!effectiveUserId) return
      try {
        setLoading(true)
        let docRef = doc(db, FIRESTORE_COLLECTION, effectiveUserId)
        let docSnap = await getDoc(docRef)

        // Fallback: check raw uid if effectiveUserId had suffix
        if (!docSnap.exists() && auth.currentUser?.uid && effectiveUserId !== auth.currentUser.uid) {
          const rawRef = doc(db, FIRESTORE_COLLECTION, auth.currentUser.uid)
          const rawSnap = await getDoc(rawRef)
          if (rawSnap.exists()) {
            docRef = rawRef
            docSnap = rawSnap
          }
        }

        if (docSnap.exists()) {
          const data = docSnap.data()
          setProfileData(data)

          if (data.completedSections) {
            setCompletedSections((prev) => ({
              ...prev,
              ...data.completedSections,
              instructions: true
            }))
          }

          setFormData((prev) => {
            const merged = { ...prev }
            Object.keys(data).forEach(key => {
              if (merged[key] && typeof merged[key] === "object" && !Array.isArray(merged[key])) {
                merged[key] = { ...merged[key], ...data[key] }
              } else if (data[key] !== undefined) {
                merged[key] = data[key]
              }
            })
            return merged
          })

          const isComplete = Boolean(
            data?.declarationConsent?.accuracy &&
            data?.declarationConsent?.permissionRelationships &&
            data?.declarationConsent?.approvePublicProfile &&
            data?.declarationConsent?.acceptTermsPrivacy
          )

          if (isComplete && !isEditing) {
            setProfileSubmitted(true)
            setShowSummary(true)
          }
        }
      } catch (err) {
        console.error("Error loading CMF profile data:", err)
        setError("Failed to load profile data.")
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [effectiveUserId, isEditing])

  const updateFormData = (section, data) => {
    setFormData((prev) => {
      const updated = { ...prev, [section]: data }
      localStorage.setItem(getUserSpecificKey(LOCAL_STORAGE_KEY_PREFIX), JSON.stringify(updated))
      return updated
    })
  }

  const saveDataToFirebase = async (sectionToMarkCompleted = null, isFinalSubmission = false, explicitCompleted = null) => {
    if (!effectiveUserId) return
    try {
      const sectionsToSave = explicitCompleted || completedSections
      const dataToSave = {
        ...formData,
        completedSections: sectionsToSave,
        updatedAt: new Date().toISOString(),
        isSubmitted: isFinalSubmission || profileSubmitted,
        role: "CMF"
      }
      const docRef = doc(db, FIRESTORE_COLLECTION, effectiveUserId)
      await setDoc(docRef, dataToSave, { merge: true })
      setProfileData((prev) => ({ ...(prev || {}), ...dataToSave }))
      localStorage.setItem(getUserSpecificKey(LOCAL_STORAGE_SECTIONS_KEY), JSON.stringify(sectionsToSave))
    } catch (err) {
      console.error("Failed to save CMF profile:", err)
    }
  }

  const navigateToNextSection = () => {
    const currentIndex = CMF_SECTIONS.findIndex((s) => s.id === activeSection)
    if (currentIndex < CMF_SECTIONS.length - 1) {
      setActiveSection(CMF_SECTIONS[currentIndex + 1].id)
      window.scrollTo(0, 0)
    }
  }

  const navigateToPreviousSection = () => {
    const currentIndex = CMF_SECTIONS.findIndex((s) => s.id === activeSection)
    if (currentIndex > 0) {
      setActiveSection(CMF_SECTIONS[currentIndex - 1].id)
      window.scrollTo(0, 0)
    }
  }

  const handleSaveSection = async () => {
    const updated = { ...completedSections, [activeSection]: true }
    setCompletedSections(updated)
    await saveDataToFirebase(activeSection, false, updated)
    alert("Section saved successfully!")
  }

  const handleSaveAndContinue = async () => {
    if (activeSection !== "instructions") {
      const sectionData = formData[activeSection] || {}
      const isValid = sectionValidations[activeSection]?.(sectionData, formData)
      if (!isValid) {
        setValidationModal({
          open: true,
          title: "Please complete required fields",
          messages: [
            `${CMF_SECTIONS.find((s) => s.id === activeSection)?.shortLabel || activeSection} requires completing all mandatory fields marked with an asterisk (*).`
          ]
        })
        return
      }
    }

    const updated = { ...completedSections, [activeSection]: true }
    setCompletedSections(updated)
    await saveDataToFirebase(activeSection, false, updated)
    navigateToNextSection()
  }

  const handleSubmitProfile = async () => {
    const decl = formData.declarationConsent || {}
    const isConsentValid = Boolean(
      decl.accuracy &&
      decl.permissionRelationships &&
      decl.approvePublicProfile &&
      decl.acceptTermsPrivacy
    )

    if (!isConsentValid) {
      setValidationModal({
        open: true,
        title: "Mandatory Declarations Required",
        messages: [
          "You must confirm all 4 mandatory declarations in the Declaration & Consent card before submitting your profile."
        ]
      })
      return
    }

    const updated = { ...completedSections, declarationConsent: true }
    setCompletedSections(updated)

    // Check all countable sections
    const countable = CMF_SECTIONS.filter(s => s.id !== "instructions")
    const invalidSections = countable.filter(s => !sectionValidations[s.id]?.(formData[s.id] || {}, formData))

    if (invalidSections.length > 0) {
      setValidationModal({
        open: true,
        title: "Profile Incomplete",
        messages: invalidSections.map(s => `❌ ${s.shortLabel} contains incomplete required fields.`)
      })
      return
    }

    try {
      await saveDataToFirebase(null, true, updated)
      setProfileSubmitted(true)
      setShowSummary(true)
      setIsEditing(false)
      window.scrollTo(0, 0)
    } catch (err) {
      console.error("Failed to submit profile:", err)
      alert("Submission error. Please try again.")
    }
  }

  const renderActiveSection = () => {
    const sectionData = formData[activeSection] || {}
    const commonProps = {
      data: sectionData,
      allFormData: formData,
      updateData: (data) => updateFormData(activeSection, data)
    }

    switch (activeSection) {
      case "instructions":
        return (
          <CMFInstructions
            formData={formData}
            completedSections={completedSections}
            onPreviewSMEView={() => setShowSMEPreview(true)}
            onContinue={navigateToNextSection}
          />
        )
      case "entityOverview":
        return <CMFEntityOverview {...commonProps} />
      case "servicesSupport":
        return <CMFServicesSupport {...commonProps} />
      case "smeFocusMatching":
        return <CMFSMEFocusMatching {...commonProps} />
      case "experienceNetworks":
        return <CMFExperienceNetworks {...commonProps} />
      case "feesEngagement":
        return <CMFFeesEngagement {...commonProps} />
      case "legalVerification":
        return <CMFLegalVerification {...commonProps} />
      case "contactDetails":
        return <CMFContactDetails {...commonProps} />
      case "declarationConsent":
        return (
          <CMFDeclarationConsent
            {...commonProps}
            canSubmit={true}
            onSubmit={handleSubmitProfile}
          />
        )
      default:
        return <CMFInstructions {...commonProps} onContinue={navigateToNextSection} />
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <div className="loading-message">Loading Facilitator Profile...</div>
      </div>
    )
  }

  if (showSummary && !isEditing) {
    return (
      <div className="universal-profile-container">
        <CMFProfileSummary
          data={profileData || formData}
          onEdit={() => { setIsEditing(true); setShowSummary(false); }}
          onSelectSection={(secId) => {
            setActiveSection(secId)
            setIsEditing(true)
            setShowSummary(false)
            window.scrollTo(0, 0)
          }}
        />
      </div>
    )
  }

  return (
    <div className="universal-profile-container">
      {/* Validation Modal */}
      {validationModal.open && (
        <div className="popup-overlay">
          <div className="validation-popup">
            <button className="close-popup" onClick={() => setValidationModal({ open: false, title: "", messages: [] })}>
              <X size={24} />
            </button>
            <div className="popup-content">
              <h2 className="text-lg font-semibold">{validationModal.title}</h2>
              <ul className="list-disc pl-5 mt-2 text-sm text-red-600">
                {validationModal.messages.map((msg, idx) => <li key={idx}>{msg}</li>)}
              </ul>
              <div className="mt-4 flex justify-end">
                <button className="btn btn-primary" onClick={() => setValidationModal({ open: false, title: "", messages: [] })}>
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "1.5rem"
      }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#3e2723", margin: "0 0 4px 0" }}>
            Capital & Market Facilitator Profile
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#8d6e63" }}>
            Build and manage your facilitator profile for BIG Marketplace matchmaking.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => setShowSMEPreview(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#faf7f2",
              border: "1px solid #d7ccc8",
              color: "#4a352f",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            <Eye size={15} /> Preview SME View
          </button>

          <button
            type="button"
            onClick={() => {
              if (profileSubmitted) {
                setShowSummary(true)
                setIsEditing(false)
              } else {
                setShowSummary(true)
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#4a352f",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {profileSubmitted ? "← Back to Summary" : "👁 View Profile Summary"}
          </button>
        </div>
      </div>

      {/* Tracker Bar Navigation (9 Sections) */}
      <div className="profile-tracker">
        <div className="profile-tracker-inner">
          {CMF_SECTIONS.map((section) => {
            const isCompleted = section.id === "instructions"
              ? true
              : Boolean(completedSections[section.id] && sectionValidations[section.id]?.(formData[section.id] || {}, formData))

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`profile-tracker-button ${activeSection === section.id ? "active" : isCompleted ? "completed" : "pending"}`}
              >
                {section.label.split("\n").map((line, i) => (
                  <span key={i} className="tracker-label-line">{line}</span>
                ))}
                {isCompleted && <CheckCircle className="check-icon" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Section Content Card */}
      <div className="content-card">
        {renderActiveSection()}

        {/* Footer Navigation Buttons */}
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
            <button
              type="button"
              onClick={handleSubmitProfile}
              className="btn btn-primary"
            >
              Submit Profile
            </button>
          )}
        </div>
      </div>

      {/* SME Public Preview Modal */}
      <CMFSMEPreviewModal
        isOpen={showSMEPreview}
        onClose={() => setShowSMEPreview(false)}
        formData={formData}
      />
    </div>
  )
}
