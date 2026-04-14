"use client"

import { useState, useEffect } from "react"
import { CheckCircle, ChevronRight, ChevronLeft, Save } from "lucide-react"
import { sections } from "./applicationOptions"
import RequestOverview from "./RequestOverview"
import ProductsServices from "./ProductsServices"
import MatchingPreferences from "./MatchingPreferences"
import ApplicationSummary from "./application-summary"
import "./ProductApplication.css"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "../../firebaseConfig"

const ProductApplication = ({
  embedded = false,
  onNavigateToMatches,
  onNavigateToDashboard,
  onNavigateBack,
  initialSectionId,
  applicationId = null,
  forceEdit = false,   // when true, never auto-redirect to summary even if submitted
}) => {
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [loadingApplication, setLoadingApplication] = useState(!!applicationId)

  const [activeSection, setActiveSection] = useState(() => initialSectionId || sections[0].id)

  const [completedSections, setCompletedSections] = useState(() =>
    Object.fromEntries(sections.map((s) => [s.id, false]))
  )

  const [formData, setFormData] = useState({
    matchingPreferences: {
      bbeeLevel: "", ownershipPrefs: [], sectorExperience: "",
      engagementType: "", engagementTypeOther: "", deliveryModes: [],
      startDate: "", endDate: "", location: "",
      minBudget: "", maxBudget: "", esdProgram: null,
    },
    requestOverview: {
      purpose: "", categories: [], subcategories: [],
      keywords: "", scopeOfWorkFiles: [],
    },
    productsServices: {
      categories: [], keywords: "", scopeOfWorkFiles: [],
    },
  })

  useEffect(() => {
    if (applicationId) {
      loadApplication(applicationId)
    }
  }, [applicationId])

  const loadApplication = async (appId) => {
    try {
      setLoadingApplication(true)
      const docRef = doc(db, "productApplications", appId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()

        setFormData({
          matchingPreferences: {
            bbeeLevel:           data.matchingPreferences?.bbeeLevel           || "",
            ownershipPrefs:      data.matchingPreferences?.ownershipPrefs      || [],
            sectorExperience:    data.matchingPreferences?.sectorExperience    || "",
            engagementType:      data.matchingPreferences?.engagementType      || "",
            engagementTypeOther: data.matchingPreferences?.engagementTypeOther || "",
            deliveryModes:       data.matchingPreferences?.deliveryModes       || [],
            startDate:           data.matchingPreferences?.startDate           || "",
            endDate:             data.matchingPreferences?.endDate             || "",
            location:            data.matchingPreferences?.location            || "",
            minBudget:           data.matchingPreferences?.minBudget           || "",
            maxBudget:           data.matchingPreferences?.maxBudget           || "",
            esdProgram:          data.matchingPreferences?.esdProgram          ?? null,
          },
          requestOverview: {
            purpose:          data.requestOverview?.purpose          || "",
            categories:       data.requestOverview?.categories       || [],
            subcategories:    data.requestOverview?.subcategories    || [],
            keywords:         data.requestOverview?.keywords         || "",
            scopeOfWorkFiles: data.requestOverview?.scopeOfWorkFiles || [],
          },
          productsServices: {
            categories:       data.productsServices?.categories       || [],
            keywords:         data.productsServices?.keywords         || "",
            scopeOfWorkFiles: data.productsServices?.scopeOfWorkFiles || [],
          },
        })

        setCompletedSections(
          data.completedSections || Object.fromEntries(sections.map((s) => [s.id, false]))
        )

        const submitted = data.status === 'submitted'
        setApplicationSubmitted(submitted)

        // Only auto-show summary if submitted AND we are NOT forcing edit mode
        if (submitted && !forceEdit) {
          setShowSummary(true)
        }
      }
    } catch (err) {
      console.error("❌ Error loading application:", err)
      alert("Failed to load application data.")
    } finally {
      setLoadingApplication(false)
    }
  }

  const goToSection = (sectionId) => {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return
    setActiveSection(section.id)
    setShowSummary(false)
    window.scrollTo(0, 0)
  }

  const handleEditApplication = () => {
    setShowSummary(false)
    setActiveSection(sections[0].id)
    window.scrollTo(0, 0)
  }

  const updateFormData = (section, newData) => {
    setFormData((prev) => ({ ...prev, [section]: { ...prev[section], ...newData } }))
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

  const saveDataToFirebase = async () => {
    try {
      const user = auth.currentUser
      if (!user) throw new Error("User not logged in.")
      const docId = applicationId || `${user.uid}_${Date.now()}`
      await setDoc(doc(db, "productApplications", docId), {
        ...formData,
        userId: user.uid,
        completedSections: { ...completedSections },
        lastUpdated: serverTimestamp(),
        status: applicationSubmitted ? 'submitted' : 'draft',
      }, { merge: true })
      return docId
    } catch (err) {
      console.error("❌ Error saving:", err)
      alert("Failed to save.")
      return null
    }
  }

  const handleSaveSection = async () => {
    setCompletedSections((prev) => ({ ...prev, [activeSection]: true }))
    await saveDataToFirebase()
    alert("Section saved successfully!")
  }

  const handleSaveAndContinue = async () => {
    setCompletedSections((prev) => ({ ...prev, [activeSection]: true }))
    await saveDataToFirebase()
    goToNextSection()
  }

  const submitApplication = async () => {
    try {
      const user = auth.currentUser
      if (!user) throw new Error("User not logged in.")
      const allCompleted = Object.fromEntries(sections.map((s) => [s.id, true]))
      setCompletedSections(allCompleted)
      setApplicationSubmitted(true)
      const docId = applicationId || `${user.uid}_${Date.now()}`
      await setDoc(doc(db, "productApplications", docId), {
        ...formData,
        userId: user.uid,
        completedSections: allCompleted,
        lastUpdated: serverTimestamp(),
        status: 'submitted',
      }, { merge: true })
      setShowSummary(true)
      window.scrollTo(0, 0)
    } catch (err) {
      console.error("❌ Failed to submit:", err)
      alert("Failed to submit application.")
    }
  }

  const renderActiveSection = () => {
    const sectionProps = {
      data: formData[activeSection] || {},
      updateData: (newData) => updateFormData(activeSection, newData),
      onSubmit: activeSection === "matchingPreferences" ? submitApplication : undefined,
      applicationId,
    }
    switch (activeSection) {
      case "matchingPreferences": return <MatchingPreferences {...sectionProps} />
      case "requestOverview":     return <RequestOverview {...sectionProps} />
      case "productsServices":    return <ProductsServices {...sectionProps} />
      default:                    return <MatchingPreferences {...sectionProps} />
    }
  }

  const containerStyles = embedded
    ? { width:"100%", maxWidth:"100%", margin:0, padding:"20px", backgroundColor:"#f9f9f9", minHeight:"auto", boxSizing:"border-box" }
    : { width:"100%", minHeight:"100vh", maxWidth:"100vw", overflowX:"hidden", margin:"0", boxSizing:"border-box", position:"relative" }

  if (loadingApplication) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'400px' }}>
      <div>Loading application...</div>
    </div>
  )

  if (showSummary) return (
    <ApplicationSummary
      data={formData}
      onEdit={handleEditApplication}
      applicationId={applicationId}
      onBack={embedded ? onNavigateBack : undefined}
    />
  )

  return (
    <div style={containerStyles} className={`product-application-container ${embedded ? 'embedded' : ''}`}>

      {/* Back button */}
      {embedded && onNavigateBack && (
        <button
          onClick={onNavigateBack}
          style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 0', background:'none', border:'none', color:'#a67c52', cursor:'pointer', marginBottom:'16px', fontSize:'14px', fontWeight:'500' }}
          type="button"
        >
          <ChevronLeft size={20} /> Back to Applications
        </button>
      )}

      {/* Title */}
      <h1 style={{
        width:"100%", textAlign:"center",
        margin: embedded ? "0 0 15px 0" : "20px 0",
        fontSize: embedded ? "1.2rem" : "clamp(1.5rem, 4vw, 2.5rem)",
        lineHeight:1.2, wordBreak:"break-word",
        color: embedded ? "#333" : "inherit", display:"block",
      }}>
        {applicationId ? 'Edit Application' : 'Products/Services Request'}
      </h1>

      {/* Progress Tracker */}
      <div className="profile-tracker" style={{
        width:"100%", maxWidth:"100%", overflowX:"auto",
        padding: embedded ? "5px 0" : "10px 0",
        margin: embedded ? "0 0 15px 0" : "20px 0",
        boxSizing:"border-box",
        backgroundColor: embedded ? "#fff" : "transparent",
        borderRadius: embedded ? "6px" : "0",
        border: embedded ? "1px solid #e0e0e0" : "none",
      }}>
        <div className="profile-tracker-inner" style={{
          display:"flex", gap: embedded ? "4px" : "8px",
          justifyContent:"center", alignItems:"center",
          minWidth:"max-content", padding:"0 10px",
        }}>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => goToSection(section.id)}
              type="button"
              className={`profile-tracker-button ${activeSection === section.id ? "active" : completedSections[section.id] ? "completed" : "pending"}`}
              style={{
                minWidth: embedded ? "80px" : "100px",
                maxWidth: embedded ? "120px" : "190px",
                padding: embedded ? "6px 4px" : "10px 8px",
                fontSize: embedded ? "0.7rem" : "clamp(0.7rem, 1.5vw, 0.9rem)",
                lineHeight:1.2, textAlign:"center", cursor:"pointer",
                transition:"all 0.3s ease", wordBreak:"break-word",
                display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", position:"relative",
                minHeight: embedded ? "45px" : "60px",
                backgroundColor: embedded ? "#f5f5f5" : "inherit",
                border: embedded ? "1px solid #ddd" : "none",
                borderRadius: embedded ? "4px" : "0",
              }}
            >
              {section.label.split("\n").map((line, i) => (
                <span key={i} style={{ display:"block", margin:"1px 0", fontSize: embedded ? "0.65rem" : "inherit" }}>{line}</span>
              ))}
              {completedSections[section.id] && (
                <CheckCircle style={{ position:"absolute", top:2, right:2, width: embedded ? "12px" : "16px", height: embedded ? "12px" : "16px" }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="content-card" style={{
        width:"100%", maxWidth:"100%",
        padding: embedded ? "15px" : "20px",
        margin:"0 auto", backgroundColor:"white",
        borderRadius: embedded ? "6px" : "8px",
        boxShadow: embedded ? "0 1px 3px rgba(0,0,0,0.1)" : "0 2px 4px rgba(0,0,0,0.1)",
        boxSizing:"border-box", overflow:"hidden",
        border: embedded ? "1px solid #e0e0e0" : "none",
      }}>
        <div style={{ width:"100%", overflowX:"auto" }}>{renderActiveSection()}</div>

        {/* Navigation */}
        <div style={{
          display:"flex", gap: embedded ? "8px" : "10px",
          justifyContent:"space-between", alignItems:"center",
          marginTop: embedded ? "20px" : "30px",
          padding: embedded ? "15px 0" : "20px 0",
          borderTop:"1px solid #eee", flexWrap:"wrap", width:"100%",
        }}>
          {activeSection !== sections[0].id && (
            <button type="button" onClick={goToPreviousSection} className="btn btn-secondary"
              style={{ display:"flex", alignItems:"center", gap:5, padding: embedded ? "8px 12px" : "10px 15px", fontSize: embedded ? "0.8rem" : "clamp(0.8rem, 2vw, 1rem)", minWidth: embedded ? "80px" : "100px", justifyContent:"center" }}>
              <ChevronLeft size={embedded ? 14 : 16} /> Previous
            </button>
          )}

          <button type="button" onClick={handleSaveSection} className="btn btn-secondary"
            style={{ display:"flex", alignItems:"center", gap:5, padding: embedded ? "8px 12px" : "10px 15px", fontSize: embedded ? "0.8rem" : "clamp(0.8rem, 2vw, 1rem)", minWidth: embedded ? "80px" : "100px", justifyContent:"center" }}>
            <Save size={embedded ? 14 : 16} /> Save
          </button>

          {activeSection !== sections[sections.length - 1].id && (
            <button type="button" onClick={handleSaveAndContinue} className="btn btn-primary"
              style={{ display:"flex", alignItems:"center", gap:5, padding: embedded ? "8px 12px" : "10px 15px", fontSize: embedded ? "0.8rem" : "clamp(0.8rem, 2vw, 1rem)", minWidth: embedded ? "120px" : "140px", justifyContent:"center" }}>
              Save & Continue <ChevronRight size={embedded ? 14 : 16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductApplication