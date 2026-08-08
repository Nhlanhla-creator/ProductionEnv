"use client"

import { useState, useEffect } from "react"
import { CheckCircle, ChevronRight, ChevronLeft, Save } from "lucide-react"
import CatalystInstructions from "./catalyst-instructions"
import CatalystEntityOverview from "./catalyst-entity-overview"
import CatalystContactDetails from "./catalyst-contact-details"
import CatalystApplicationBrief from "./catalyst-application-brief"
import CatalystProgramBriefMatchingPreference from "./CatalystProgramBriefMatchingPreference"
import CatalystDocumentUpload from "./catalyst-document-upload"
import CatalystDeclarationConsent from "./catalyst-declaration-consent"
import CatalystProfileSummary from "./catalyst-profile-summary"
import { auth, db, storage } from "../../firebaseConfig"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import styles from "./catalyst-universal-profile.module.css"

const sections = [
  { id: "instructions", label: "Instructions" },
  { id: "entityOverview", label: "Entity\nOverview" },
  { id: "contactDetails", label: "Contact\nDetails" },
  { id: "programBriefMatchingPreference", label: "Program Brief &\nMatching Preference" },
  { id: "applicationBrief", label: "Application\nBrief" },
  { id: "documentUpload", label: "Document\nUpload" },
  { id: "declarationConsent", label: "Declaration &\nConsent" },
]

export default function CatalystUniversalProfile() {
  const [activeSection, setActiveSection] = useState("instructions")
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSummary, setShowSummary] = useState(false)

  const [completedSections, setCompletedSections] = useState({
    instructions: true,
    entityOverview: false,
    contactDetails: false,
    programBriefMatchingPreference: false,
    applicationBrief: false,
    documentUpload: false,
    declarationConsent: false,
  })

  const [formData, setFormData] = useState({
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
      memberOfAssociation: "",
      industryAssociations: [],
      industryAssociationsOther: "",
    },
    contactDetails: {
      sameAsPhysical: false,
    },
    programBriefMatchingPreference: {
      // Section 1 — Program Details
      programName: "",
      programWebsite: "",
      programDuration: "",
      aboutProgram: "",
      programGoals: "",
      supportFramework: "",
      // Section 2 — Support Focus
      intangibleSupport: "",
      intangibleSupportSubtype: "",
      fundingSupport: "",
      fundingInstruments: [],
      ticketSize: "",
      revenueThreshold: "",
      // Section 3 — Target Beneficiaries
      demographics: [],
      bbbeeLevel: [],
      // Section 4 — General Preferences
      legalEntity: [],
      businessLifecycleStage: [],
      sectorFocus: [],
      sectorExclusions: [],
      geographicFocus: [],
      selectedCountries: [],
      selectedProvinces: [],
    },
    applicationBrief: {},
    documentUpload: {},
    declarationConsent: {
      accuracy: false,
      dataProcessing: false,
      termsConditions: false,
    },
  })

  const uploadFilesAndReplaceWithURLs = async (data, sectionPath = "") => {
    const uploadRecursive = async (item, pathPrefix) => {
      if (item instanceof File) {
        const fileRef = ref(storage, `catalystProfiles/${user.uid}/${pathPrefix}`)
        await uploadBytes(fileRef, item)
        return {
          name: item.name,
          url: await getDownloadURL(fileRef),
          path: `catalystProfiles/${user.uid}/${pathPrefix}`,
        }
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
    return await uploadRecursive(data, sectionPath)
  }

  // Load saved data from Firebase or localStorage
  useEffect(() => {
    const loadProfileData = async () => {
      const isCmfView = sessionStorage.getItem("viewOrigin") === "cmf" && sessionStorage.getItem("viewingSMEId")
      if (isCmfView) {
        const viewingId = sessionStorage.getItem("viewingSMEId")
        setUser({ uid: viewingId })
        try {
          const userRef = doc(db, "catalystProfiles", viewingId)
          const docSnap = await getDoc(userRef)
          if (docSnap.exists()) {
            const data = docSnap.data()
            if (data?.formData) {
              setFormData((prev) => ({
                ...prev,
                ...data.formData,
                entityOverview: {
                  ...prev.entityOverview,
                  ...data.formData.entityOverview,
                },
                programBriefMatchingPreference: {
                  ...prev.programBriefMatchingPreference,
                  ...data.formData.programBriefMatchingPreference,
                },
                applicationBrief: {
                  ...prev.applicationBrief,
                  ...data.formData.applicationBrief,
                },
                declarationConsent: {
                  ...prev.declarationConsent,
                  ...data.formData.declarationConsent,
                },
              }))
            }
            if (data?.completedSections) {
              setCompletedSections(data.completedSections)
            }
            if (data?.completedSections?.declarationConsent) {
              setShowSummary(true)
            }
          }
        } catch (err) {
          console.error("Error loading catalyst profile:", err)
        }
        setLoading(false)
        return
      }

      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser)
          const userRef = doc(db, "catalystProfiles", currentUser.uid)
          const docSnap = await getDoc(userRef)

          if (docSnap.exists()) {
            const data = docSnap.data()
            if (data?.formData) {
              setFormData((prev) => ({
                ...prev,
                ...data.formData,
                entityOverview: {
                  ...prev.entityOverview,
                  ...data.formData.entityOverview,
                },
                programBriefMatchingPreference: {
                  ...prev.programBriefMatchingPreference,
                  ...data.formData.programBriefMatchingPreference,
                },
                applicationBrief: {
                  ...prev.applicationBrief,
                  ...data.formData.applicationBrief,
                },
                declarationConsent: {
                  ...prev.declarationConsent,
                  ...data.formData.declarationConsent,
                },
              }))
            }
            if (data?.completedSections) {
              setCompletedSections(data.completedSections)
            }
            if (data?.completedSections?.declarationConsent) {
              setShowSummary(true)
            }
          } else {
            // Fallback to localStorage
            const savedData = localStorage.getItem("catalystProfileData")
            const savedCompletedSections = localStorage.getItem("catalystProfileCompletedSections")
            if (savedData) setFormData(JSON.parse(savedData))
            if (savedCompletedSections) {
              const parsedCompleted = JSON.parse(savedCompletedSections)
              setCompletedSections(parsedCompleted)
              if (parsedCompleted.declarationConsent) setShowSummary(true)
            }
          }
          setLoading(false)
        } else {
          setLoading(false)
        }
      })
      return () => unsubscribe()
    }
    loadProfileData()
  }, [])

  // Persist to localStorage
  useEffect(() => {
    const isCmfView = sessionStorage.getItem("viewOrigin") === "cmf" && sessionStorage.getItem("viewingSMEId")
    if (isCmfView) return
    localStorage.setItem("catalystProfileData", JSON.stringify(formData))
  }, [formData])

  useEffect(() => {
    const isCmfView = sessionStorage.getItem("viewOrigin") === "cmf" && sessionStorage.getItem("viewingSMEId")
    if (isCmfView) return
    localStorage.setItem("catalystProfileCompletedSections", JSON.stringify(completedSections))
  }, [completedSections])

  const updateFormData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }))
  }

  const markSectionAsCompleted = (section) => {
    setCompletedSections((prev) => ({ ...prev, [section]: true }))
  }

  const navigateToNextSection = () => {
    const currentIndex = sections.findIndex((s) => s.id === activeSection)
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id)
      window.scrollTo(0, 0)
    }
  }

  const navigateToPreviousSection = () => {
    const currentIndex = sections.findIndex((s) => s.id === activeSection)
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id)
      window.scrollTo(0, 0)
    }
  }

  const handleSaveSection = async () => {
    localStorage.setItem("catalystProfileData", JSON.stringify(formData))
    if (activeSection === "instructions") return
    if (!user) {
      alert("You must be logged in to save.")
      return
    }
    try {
      const sectionData = formData[activeSection]
      const uploadedData = await uploadFilesAndReplaceWithURLs(sectionData, activeSection)
      await setDoc(
        doc(db, "catalystProfiles", user.uid),
        {
          formData: { ...formData, [activeSection]: uploadedData },
          completedSections,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      )
      console.log(`Section ${activeSection} saved successfully`)
    } catch (error) {
      console.error("Error saving section:", error)
      alert("Failed to save.")
    }
  }

  const handleSaveAndContinue = () => {
    markSectionAsCompleted(activeSection)
    handleSaveSection()
    navigateToNextSection()
  }

  const handleSubmitProfile = async () => {
    markSectionAsCompleted("declarationConsent")
    if (!user) {
      alert("You must be logged in to submit the profile.")
      return
    }
    try {
      const uploadedFormData = await uploadFilesAndReplaceWithURLs(formData, "full")
      await setDoc(
        doc(db, "catalystProfiles", user.uid),
        {
          formData: uploadedFormData,
          completedSections: { ...completedSections, declarationConsent: true },
          submittedAt: new Date().toISOString(),
        },
        { merge: true }
      )
      alert("Profile submitted successfully!")
      setShowSummary(true)
    } catch (error) {
      console.error("Error submitting profile:", error)
      alert("Failed to submit profile.")
    }
  }

  const handleEditFromSummary = () => {
    setShowSummary(false)
    setActiveSection("instructions")
  }

  const renderActiveSection = () => {
    const sectionData = formData[activeSection] || {}
    const commonProps = {
      data: sectionData,
      updateData: (data) => updateFormData(activeSection, data),
    }
    switch (activeSection) {
      case "instructions":
        return <CatalystInstructions />
      case "entityOverview":
        return <CatalystEntityOverview {...commonProps} />
      case "contactDetails":
        return <CatalystContactDetails {...commonProps} />
      case "programBriefMatchingPreference":
        return <CatalystProgramBriefMatchingPreference {...commonProps} />
      case "applicationBrief":
        return <CatalystApplicationBrief {...commonProps} />
      case "documentUpload":
        return <CatalystDocumentUpload {...commonProps} />
      case "declarationConsent":
        return <CatalystDeclarationConsent {...commonProps} />
      default:
        return <CatalystInstructions />
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-lg">Loading...</div>
  }

  const isCmfView = sessionStorage.getItem("viewOrigin") === "cmf" && sessionStorage.getItem("viewingSMEId")
  const viewingSMEName = sessionStorage.getItem("viewingSMEName") || "Partner"

  const renderCmfBanner = () => {
    if (!isCmfView) return null;
    return (
      <div style={{
        backgroundColor: "#e8f5e9", padding: "16px 20px",
        borderRadius: "8px", border: "2px solid #4caf50",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px" }}>👁️</span>
          <span style={{ color: "#2e7d32", fontWeight: "600", fontSize: "15px" }}>
            Facilitator View: Managing {viewingSMEName}'s Profile
          </span>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem("viewingSMEId");
            sessionStorage.removeItem("viewingSMEName");
            sessionStorage.removeItem("investorViewMode");
            sessionStorage.removeItem("viewOrigin");
            window.location.href = "/cmf-cohorts";
          }}
          style={{
            padding: "8px 16px", backgroundColor: "#4caf50", color: "white",
            border: "none", borderRadius: "6px", cursor: "pointer",
            fontWeight: "600", fontSize: "14px",
          }}
        >
          ← Back to My Cohorts
        </button>
      </div>
    );
  };

  if (showSummary) {
    return (
      <div className="universal-profile-container" style={{ padding: "20px" }}>
        {renderCmfBanner()}
        <CatalystProfileSummary formData={formData} onEdit={handleEditFromSummary} />
      </div>
    )
  }

  return (
    <div className="universal-profile-container">
      {renderCmfBanner()}
      <h1>My Catalyst Profile</h1>
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
                !formData.declarationConsent?.accuracy ||
                !formData.declarationConsent?.dataProcessing ||
                !formData.declarationConsent?.termsConditions
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