"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./catalyst-universal-profile.module.css"
import AssociatorInstructions from "./Instructions"
import AssociatorEntityOverview from "./EntityOverview"
import AssociatorContactDetails from "./ContactDetails"
import AssociatorDeclarationConsent from "./DeclarationConsent"
import AssociatorProfileSummary from "./AssociatorProfileSummary"



const SECTIONS = [
  { id: "instructions", label: "Instructions" },
  { id: "entityOverview", label: "Entity Overview" },
  { id: "contactDetails", label: "Contact Details" },
  { id: "declarationConsent", label: "Declaration & Consent" },
]

const initialFormData = {
  instructions: {},
  entityOverview: {},
  contactDetails: {},
  declarationConsent: {},
}

export default function AssociatorUniversalProfile() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState("instructions")
  const [formData, setFormData] = useState(initialFormData)
  const [showSummary, setShowSummary] = useState(false)

  const updateSectionData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }))
  }

  const currentIndex = SECTIONS.findIndex((s) => s.id === activeSection)

  const goNext = () => {
    if (currentIndex < SECTIONS.length - 1) {
      setActiveSection(SECTIONS[currentIndex + 1].id)
    } else {
      setShowSummary(true)
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      setActiveSection(SECTIONS[currentIndex - 1].id)
    }
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

  if (showSummary) {
    return (
      <AssociatorProfileSummary
        formData={formData}
        onEdit={() => setShowSummary(false)}
      />
    )
  }

  return (
    <div className={styles.universalProfileContainer}>
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
          disabled={currentIndex === 0}
        >
          Previous
        </button>
        <button className={styles.btnPrimary} onClick={goNext}>
          {currentIndex === SECTIONS.length - 1 ? "Submit & Review" : "Next"}
        </button>
      </div>
    </div>
  )
}