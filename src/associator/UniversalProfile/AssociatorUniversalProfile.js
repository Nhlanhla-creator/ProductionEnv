"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import styles from "./catalyst-universal-profile.module.css"
import AssociatorInstructions from "./Instructions"
import AssociatorEntityOverview from "./EntityOverview"
import AssociatorContactDetails from "./ContactDetails"
import AssociatorDeclarationConsent from "./DeclarationConsent"
import AssociatorProfileSummary from "./AssociatorProfileSummary"
import { onAuthStateChanged } from "firebase/auth"

const SECTIONS = [
  { id: "instructions", label: "Instructions" },
  { id: "entityOverview", label: "Entity Overview" },
  { id: "contactDetails", label: "Contact Details" },
  { id: "declarationConsent", label: "Declaration & Consent" },
]

const initialFormData = {
  instructions: {},
  entityOverview: {
    registeredName: "",
    tradingName: "",
    legalEntityType: "",
    registrationNumber: "",
    industrySector: "",
    companySize: "",
    yearEstablished: "",
    website: "",
    briefDescription: "",
    referralSource: "",
    referralSourceOther: "",
    // ── Industry Association (single-select) ────────────────────────────
    industryAssociation: "",      // one value from the associations list
    industryAssociationOther: "", // free-text when "Other" is selected
  },
  contactDetails: {},
  declarationConsent: {},
}

export default function AssociatorUniversalProfile() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState("instructions")
  const [formData, setFormData] = useState(initialFormData)
  const [showSummary, setShowSummary] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState(null)

  // Load existing profile from Firestore when user logs in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid)
        await loadProfileFromFirestore(user.uid)
      } else {
        navigate("/login")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const loadProfileFromFirestore = async (uid) => {
    try {
      const docRef = doc(db, "universalProfiles", uid)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        // Merge loaded data with initial form data
        setFormData(prev => ({
          ...prev,
          entityOverview: { ...prev.entityOverview, ...(data.entityOverview || {}) },
          contactDetails: { ...prev.contactDetails, ...(data.contactDetails || {}) },
          declarationConsent: { ...prev.declarationConsent, ...(data.declarationConsent || {}) },
        }))
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    }
  }

  const saveToFirestore = async () => {
    if (!userId) return false
    
    setSaving(true)
    try {
      const docRef = doc(db, "universalProfiles", userId)
      
      // Determine if this is an association profile
      const isAssociation = true
      const userType = "association"
      
      await setDoc(docRef, {
        ...formData,
        userType,
        isAssociation,
        updatedAt: new Date().toISOString(),
        lastEditedBy: userId,
        lastEditedAt: new Date().toISOString(),
      }, { merge: true })
      
      return true
    } catch (error) {
      console.error("Error saving to Firestore:", error)
      alert("Failed to save profile. Please try again.")
      return false
    } finally {
      setSaving(false)
    }
  }

  const updateSectionData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }))
  }

  const currentIndex = SECTIONS.findIndex((s) => s.id === activeSection)

  const goNext = async () => {
    // Save current section before moving to next
    await saveToFirestore()
    
    if (currentIndex < SECTIONS.length - 1) {
      setActiveSection(SECTIONS[currentIndex + 1].id)
    } else {
      // Final section - save then show summary
      await saveToFirestore()
      setShowSummary(true)
    }
  }

  const goPrev = async () => {
    // Save current section before moving back
    await saveToFirestore()
    
    if (currentIndex > 0) {
      setActiveSection(SECTIONS[currentIndex - 1].id)
    }
  }

  const handleEditProfile = () => {
    setShowSummary(false)
    setActiveSection("entityOverview")
  }

  const renderSection = () => {
    switch (activeSection) {
      case "instructions":
        return <AssociatorInstructions />
      case "entityOverview":
        return (
          <AssociatorEntityOverview
            data={formData.entityOverview}
            updateData={(data) => updateSectionData("entityOverview", data)}
          />
        )
      case "contactDetails":
        return (
          <AssociatorContactDetails
            data={formData.contactDetails}
            updateData={(data) => updateSectionData("contactDetails", data)}
          />
        )
      case "declarationConsent":
        return (
          <AssociatorDeclarationConsent
            data={formData.declarationConsent}
            updateData={(data) => updateSectionData("declarationConsent", data)}
          />
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Loading your profile...</div>
      </div>
    )
  }

  if (showSummary) {
    return (
      <AssociatorProfileSummary
        formData={formData}
        onEdit={handleEditProfile}
      />
    )
  }

  return (
    <div className={styles.universalProfileContainer}>
      {/* Saving indicator */}
      {saving && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: '#4CAF50',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000,
        }}>
          Saving...
        </div>
      )}

      {/* Section Tracker */}
      <div className={styles.sectionTracker}>
        {SECTIONS.map((section, index) => (
          <button
            key={section.id}
            className={`${styles.trackerItem} ${
              activeSection === section.id ? styles.trackerItemActive : ""
            } ${index < currentIndex ? styles.trackerItemComplete : ""}`}
            onClick={() => setActiveSection(section.id)}
          >
            <span className={styles.trackerNumber}>{index + 1}</span>
            <span className={styles.trackerLabel}>{section.label}</span>
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className={styles.sectionContent}>{renderSection()}</div>

      {/* Navigation Buttons */}
      <div className={styles.navigationButtons}>
        <button
          className={styles.btnSecondary}
          onClick={goPrev}
          disabled={currentIndex === 0 || saving}
        >
          Previous
        </button>
        <button className={styles.btnPrimary} onClick={goNext} disabled={saving}>
          {currentIndex === SECTIONS.length - 1 ? "Submit & Review" : "Next"}
        </button>
      </div>
    </div>
  )
}