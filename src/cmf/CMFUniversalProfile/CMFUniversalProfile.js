import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle, ChevronRight, ChevronLeft, Save, X, ArrowRight, Users } from "lucide-react"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "../../firebaseConfig"
import "../../smses/UniversalProfile/UniversalProfile.css"
import Instructions from "./CMFInstructions"
import EntityOverview from "../../smses/UniversalProfile/entity-overview"
import OwnershipManagement from "../../smses/UniversalProfile/ownership-management"
import ContactDetails from "../../smses/UniversalProfile/contact-details"
import LegalCompliance from "../../smses/UniversalProfile/legal-compliance"
import ProductsServices from "../../smses/UniversalProfile/products-services"
import HowDidYouHear from "../../smses/UniversalProfile/how-did-you-hear"
import CMFDocumentUpload from "./CMFDocumentUpload"
import FundDetailsSection from "../../Investor/InvestorUniversalProfile/FundDetails\u200b"
import ApplicationBriefSection from "../../Investor/InvestorUniversalProfile/ApplicationBrief\u200b"
import GeneralInvestmentPreferenceSection from "../../Investor/InvestorUniversalProfile/GeneralInvestmentPreference\u200b"
import DeclarationConsent from "../../smses/UniversalProfile/declaration-consent"
import CMFProfileSummary from "./CMFProfileSummary"
import { onAuthStateChanged } from "firebase/auth"
import { getFunctions, httpsCallable } from "firebase/functions"

const sections = [
  { id: "instructions", label: "Instructions" },
  { id: "entityOverview", label: "Entity\nOverview" },
  { id: "productsServices", label: "Products &\nServices" },
  { id: "ownershipManagement", label: "Ownership &\nManagement" },
  { id: "legalCompliance", label: "Legal &\nCompliance" },
  { id: "contactDetails", label: "Contact\nDetails" },
  { id: "howDidYouHear", label: "How Did\nYou Hear" },
  { id: "documents", label: "Document\nUpload" },
  { id: "fundDetails", label: "Fund\nDetails" },
  { id: "applicationBrief", label: "Application\nBrief" },
  { id: "generalInvestmentPreference", label: "Investment\nPreferences" },
  { id: "declarationConsent", label: "Declaration &\nConsent" },
]

const sectionValidations = {
  instructions: () => true,
  entityOverview: (data) => {
    return (
      data.registeredName &&
      data.registrationNumber &&
      data.entityType &&
      data.legalStructure &&
      data.entitySize &&
      data.financialYearEnd &&
      data.yearsInOperation >= 0 &&
      data.operationStage &&
      Array.isArray(data.economicSectors) && data.economicSectors.length > 0 &&
      Array.isArray(data.operatingCountries) && data.operatingCountries.length > 0 &&
      data.businessDescription
    )
  },
  ownershipManagement: () => true,
  contactDetails: (data) => {
    const requiredFields = [
      data.contactTitle, data.contactName, data.position,
      data.businessPhone, data.mobile, data.email, data.physicalAddress,
    ]
    const hasAllRequired = requiredFields.every((field) => typeof field === "string" && field.trim() !== "")
    const postalAddressValid = data.sameAsPhysical || (typeof data.postalAddress === "string" && data.postalAddress.trim() !== "")
    return hasAllRequired && postalAddressValid
  },
  legalCompliance: () => true,
  productsServices: () => true,
  howDidYouHear: () => true,
  documents: () => true,
  fundDetails: () => true,
  applicationBrief: () => true,
  generalInvestmentPreference: () => true,
  declarationConsent: () => true,
}

const validateAllSections = (formData, completedSections) => {
  const sectionStatus = {}
  let allValid = true
  sections.forEach((section) => {
    const sectionId = section.id
    const isValid = sectionValidations[sectionId](formData[sectionId] || {})
    sectionStatus[sectionId] = { valid: isValid, completed: completedSections[sectionId], name: section.label }
    if (!isValid || !completedSections[sectionId]) allValid = false
  })
  return { allValid, sectionStatus }
}

const onboardingSteps = [
  { title: "Welcome to Your CMF Profile", content: "This profile will help us understand your firm better and connect you with the right opportunities as a Capital and Market Facilitator." },
  { title: "Step 1: Read Instructions", content: "Start by reading the instructions carefully to understand what information you will need to provide." },
  { title: "Step 2: Fill in Your Details", content: "Complete each section with accurate information about your entity, ownership, and services." },
  { title: "Step 3: Upload Documents", content: "Upload all required documents in the Document Upload section." },
  { title: "Step 4: Review & Submit", content: "Review your information in the summary page and submit when ready. You can always edit later." },
]

export default function CMFUniversalProfile() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState("instructions")
  const [profileSubmitted, setProfileSubmitted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [companyOwnerId, setCompanyOwnerId] = useState(null)
  const [isCompanyMember, setIsCompanyMember] = useState(false)
  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [editPermissions, setEditPermissions] = useState({})
  const [editHistory, setEditHistory] = useState([])
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0)

  const ROLE_PERMISSIONS = {
    owner: { canEditAll: true, sections: sections.map(s => s.id) },
    companyadmin: { canEditAll: false, sections: ["entityOverview", "contactDetails", "legalCompliance", "productsServices", "documents", "fundDetails", "applicationBrief", "generalInvestmentPreference"] },
    manager: { canEditAll: false, sections: ["contactDetails", "productsServices", "documents"] },
    employee: { canEditAll: false, sections: ["contactDetails", "documents"] },
    viewer: { canEditAll: false, sections: [] },
  }

  const canEditSection = (sectionId) => {
    if (!userRole) return false
    const permissions = ROLE_PERMISSIONS[userRole]
    if (!permissions) return false
    return permissions.canEditAll || permissions.sections.includes(sectionId)
  }

  const [completedSections, setCompletedSections] = useState({
    instructions: true, entityOverview: false, ownershipManagement: false,
    contactDetails: false, legalCompliance: false, productsServices: false,
    howDidYouHear: false, documents: false, fundDetails: false,
    applicationBrief: false, generalInvestmentPreference: false, declarationConsent: false,
  })

  const [validationModal, setValidationModal] = useState({ open: false, title: "", messages: [] })

  const [formData, setFormData] = useState({
    instructions: {},
    entityOverview: {
      registeredName: "", tradingName: "", registrationNumber: "", entityType: "",
      legalStructure: "", entitySize: "", financialYearEnd: "",
      yearsInOperation: "", operationStage: "", economicSectors: [],
      businessDescription: "", operatingCountries: [], operatingProvinces: [],
      memberOfAssociation: "", industryAssociations: [], industryAssociationsOther: "",
      companyLogo: "", companyLetterhead: "", orgStructure: "",
    },
    ownershipManagement: {
      shareholders: [{ name: "", country: "", shareholding: "", issuedShares: "", race: "", gender: "", isYouth: false, isDisabled: false, isAlsoDirector: false, doa: "", linkedin: "" }],
      directors: [{ name: "", roles: [], customRole: "", nationality: "", linkedin: "", execType: "", race: "", gender: "", isYouth: false, isDisabled: false, committeeMembership: [], customCommittee: "", doa: "", cv: null }],
      executives: [{ name: "", position: "", customPosition: "", department: "", nationality: "", linkedin: "", race: "", gender: "", isYouth: false, isDisabled: false, doa: "", cv: null }],
      employees: [{ name: "", qualification: "", role: "", customRole: "", isCertificationCompulsory: "no" }],
      totalAuthorisedShares: "", totalIssuedShares: "",
      permanentEmployees: "", contractEmployees: "", internshipEmployees: "", temporaryEmployees: "",
      activeInterests: [], previousInterests: [],
      businessLeadership: { ownerLed: "", primaryMotivation: "", growthAmbition: "", founderFullTime: "", opennessToAdvice: "", decisionGovernance: "" },
    },
    contactDetails: {
      contactTitle: "", contactName: "", position: "",
      businessPhone: "", mobile: "", email: "",
      physicalAddress: "", sameAsPhysical: false, postalAddress: ""
    },
    legalCompliance: {
      taxNumber: "", taxClearancePin: "", payeNumber: "", vatNumber: "",
      uifStatus: "", uifNumber: "", coidaNumber: "", bbbeeLevel: "",
      pendingLegalJudgments: "", pendingLegalJudgmentsDetails: "",
    },
    productsServices: {
      offeringType: "", productCategories: [], serviceCategories: [],
      deliveryModes: [], minLeadTime: "", minLeadTimeUnit: "days",
      maxLeadTime: "", maxLeadTimeUnit: "days", targetMarket: "", keyClients: [],
    },
    howDidYouHear: {},
    // CMF-specific document categories
    documents: {
      // Required
      cipcRegistration: [],
      taxCompliancePin: [],
      companyProfile: [],
      logo: [],
      proofOfAddress: [],
      // Optional - Compliance & Credentials
      vatCertificate: [],
      bbbeeCertificate: [],
      fspLicence: [],
      professionalIndemnityInsurance: [],
      isoCertifications: [],
      industryAccreditations: [],
      // Optional - Marketing & Capability
      capabilityStatement: [],
      caseStudies: [],
      clientReferences: [],
      brochure: [],
      serviceCatalogue: [],
    },
    fundDetails: { funds: [] },
    applicationBrief: {
      overviewObjectives: "", instructionsForApplying: "",
      estimatedReviewTime: "", typicalDealClosingTime: "",
      applicationWindow: "", coreDocuments: [], coreDocumentsOther: "",
      debtDocuments: [], equityDocuments: [], otherConditionalDocuments: "",
      evaluationCriteria: "", impactAlignment: "",
    },
    generalInvestmentPreference: {
      fundStructure: "", legalEntityFit: "", investmentStage: [],
      investmentFocus: [], investmentFocusSubtype: [], sectorFocus: [],
      sectorExclusions: [], geographicFocus: [], selectedProvinces: [],
      selectedCountries: [], riskAppetite: "", preferredExitStrategy: [],
      expectedExitTimeline: "", expectedReturnMultiple: "", targetIRR: "",
      reinvestmentPolicy: "", portfolioReinvestment: "", numberOfExits: "",
      averageExitMultiple: "", averageTimeToExit: "", bestExitMultiple: "",
      reinvestmentRate: "", numberOfReinvestments: "",
    },
    declarationConsent: { accuracy: false, dataProcessing: false, termsConditions: false },
  })

  const FIRESTORE_COLLECTION = "MyuniversalProfiles"
  const LOCAL_STORAGE_KEY_PREFIX = "cmfProfileData"
  const LOCAL_STORAGE_SECTIONS_KEY = "cmfProfileCompletedSections"

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid)
          const userDocSnap = await getDoc(userDocRef)
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data()
            const userCompanyId = userData.companyId
            const userCompanyRole = userData.userRole
            if (userCompanyId) {
              const companyDocRef = doc(db, "companies", userCompanyId)
              const companyDocSnap = await getDoc(companyDocRef)
              if (companyDocSnap.exists()) {
                const companyData = companyDocSnap.data()
                const ownerId = companyData.createdBy
                setUserRole(userCompanyRole || "viewer")
                if (ownerId === user.uid) {
                  setIsCompanyMember(false); setEffectiveUserId(`${user.uid}_cmf`); setEditPermissions(ROLE_PERMISSIONS.owner)
                } else {
                  setIsCompanyMember(true); setCompanyOwnerId(ownerId); setEffectiveUserId(`${ownerId}_cmf`); setEditPermissions(ROLE_PERMISSIONS[userCompanyRole] || ROLE_PERMISSIONS.viewer)
                }
              }
            } else {
              setIsCompanyMember(false); setEffectiveUserId(`${user.uid}_cmf`); setUserRole("owner"); setEditPermissions(ROLE_PERMISSIONS.owner)
            }
          }
          const savedData = localStorage.getItem(getUserSpecificKey(LOCAL_STORAGE_KEY_PREFIX))
          const savedCompletedSections = localStorage.getItem(getUserSpecificKey(LOCAL_STORAGE_SECTIONS_KEY))
          const savedSubmissionStatus = localStorage.getItem(getUserSpecificKey("cmfProfileSubmitted"))
          const hasSeenWelcomePopup = localStorage.getItem(getUserSpecificKey("cmfHasSeenWelcomePopup")) === "true"
          if (savedData) setFormData(JSON.parse(savedData))
          if (savedCompletedSections) setCompletedSections(JSON.parse(savedCompletedSections))
          if (savedSubmissionStatus === "true") { setProfileSubmitted(true); setShowSummary(true) }
          if (!hasSeenWelcomePopup) { setShowWelcomePopup(true); localStorage.setItem(getUserSpecificKey("cmfHasSeenWelcomePopup"), "true") }
        } catch (error) {
          console.error("Error checking company membership:", error)
          setEffectiveUserId(`${user.uid}_cmf`); setUserRole("owner"); setEditPermissions(ROLE_PERMISSIONS.owner)
        }
      } else { navigate("/auth") }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const getUserSpecificKey = (baseKey) => { const userId = auth.currentUser?.uid; return userId ? `${baseKey}_${userId}_cmf` : baseKey }

  useEffect(() => {
    const userId = auth.currentUser?.uid; if (!userId) return
    localStorage.setItem(getUserSpecificKey(LOCAL_STORAGE_KEY_PREFIX), JSON.stringify(formData))
    localStorage.setItem(getUserSpecificKey(LOCAL_STORAGE_SECTIONS_KEY), JSON.stringify(completedSections))
    localStorage.setItem(getUserSpecificKey("cmfProfileSubmitted"), profileSubmitted.toString())
  }, [formData, completedSections, profileSubmitted])

  const updateFormData = (section, data) => {
    setFormData((prev) => ({ ...prev, [section]: { ...prev[section], ...data } }))
  }

  const markSectionAsCompleted = async (section) => {
    const updated = { ...completedSections, [section]: true }
    setCompletedSections(updated)
    const userId = auth.currentUser?.uid
    if (userId) {
      const docRef = doc(db, FIRESTORE_COLLECTION, effectiveUserId || `${userId}_cmf`)
      await setDoc(docRef, { completedSections: updated }, { merge: true })
      localStorage.setItem(getUserSpecificKey(LOCAL_STORAGE_SECTIONS_KEY), JSON.stringify(updated))
    }
  }

  const navigateToNextSection = () => {
    const index = sections.findIndex((s) => s.id === activeSection)
    if (index < sections.length - 1) { setActiveSection(sections[index + 1].id); window.scrollTo(0, 0) }
  }

  const navigateToPreviousSection = () => {
    const index = sections.findIndex((s) => s.id === activeSection)
    if (index > 0) { setActiveSection(sections[index - 1].id); window.scrollTo(0, 0) }
  }

  const handleEditProfile = () => { setIsEditing(true); setShowSummary(false); setActiveSection("entityOverview"); window.scrollTo(0, 0) }

  const uploadFilesAndReplaceWithURLs = async (data, section) => {
    const uploadRecursive = async (item, pathPrefix) => {
      if (item instanceof File) {
        const fileRef = ref(storage, `cmfProfile/${auth.currentUser?.uid}/${pathPrefix}`)
        await uploadBytes(fileRef, item); return await getDownloadURL(fileRef)
      } else if (Array.isArray(item)) {
        return await Promise.all(item.map((entry, idx) => uploadRecursive(entry, `${pathPrefix}/${idx}`)))
      } else if (typeof item === "object" && item !== null) {
        const updated = {}; for (const key in item) { updated[key] = await uploadRecursive(item[key], `${pathPrefix}/${key}`) }; return updated
      } else { return item }
    }
    return await uploadRecursive(data, section)
  }

  const saveDataToFirebase = async (section = null, isFinalSubmit = false) => {
    setLoading(true)
    const userId = effectiveUserId || auth.currentUser?.uid
    const currentUser = auth.currentUser
    if (!userId) { setLoading(false); throw new Error("User not logged in.") }
    if (section && !canEditSection(section)) {
      alert(`You don't have permission to edit the ${sections.find((s) => s.id === section)?.label.replace(/\n/g, " ")} section.`)
      setLoading(false); return
    }
    const docRef = doc(db, FIRESTORE_COLLECTION, userId)
    const sectionData = section ? formData[section] : formData
    const uploaded = section
      ? { ...(section !== "instructions" && { [section]: await uploadFilesAndReplaceWithURLs(sectionData, section) }) }
      : await uploadFilesAndReplaceWithURLs(sectionData, "full")
    const userDocRef = doc(db, "users", currentUser.uid)
    const userDocSnap = await getDoc(userDocRef)
    const userName = userDocSnap.exists() ? userDocSnap.data().username || userDocSnap.data().email || currentUser.email : currentUser.email
    const editLogEntry = {
      editedBy: currentUser.uid, editedByName: userName, editedByEmail: currentUser.email,
      role: userRole, section: section || "full_profile",
      sectionName: section ? sections.find((s) => s.id === section)?.label.replace(/\n/g, " ") : "Full Profile",
      timestamp: new Date().toISOString(), action: isFinalSubmit ? "submitted" : "updated",
    }
    const profileSnap = await getDoc(docRef)
    const existingHistory = profileSnap.exists() ? profileSnap.data().editHistory || [] : []
    const dataToSave = {
      ...uploaded, completedSections,
      ...(isFinalSubmit || !section ? { completedSections } : {}),
      lastEditedBy: currentUser.uid, lastEditedByName: userName,
      lastEditedAt: new Date().toISOString(), lastEditedByRole: userRole,
      editHistory: [...existingHistory, editLogEntry],
    }
    await setDoc(docRef, dataToSave, { merge: true })
    setEditHistory([...existingHistory, editLogEntry])
    setLoading(false)
  }

  const handleSaveSection = async () => { await saveDataToFirebase(activeSection); alert("Section saved!") }

  const handleSaveAndContinue = async () => {
    const sectionData = formData[activeSection] || {}
    const isValid = sectionValidations[activeSection]?.(sectionData)
    if (!isValid) {
      const errors = []
      if (activeSection === "entityOverview") errors.push("Entity Overview section is incomplete. Please fill in all required fields.")
      else if (activeSection === "contactDetails") errors.push("Contact Details section is incomplete. Please fill in all required fields.")
      else errors.push(`${sections.find((s) => s.id === activeSection)?.label.replace(/\n/g, " ")} is incomplete or contains invalid fields.`)
      if (activeSection !== "instructions") setValidationModal({ open: true, title: "Please review the following issues:", messages: errors })
      return
    }
    markSectionAsCompleted(activeSection)
    await saveDataToFirebase(activeSection)
    navigateToNextSection()
  }

  const handleSubmitProfile = async () => {
    markSectionAsCompleted("declarationConsent")
    const { allValid, sectionStatus } = validateAllSections(formData, completedSections)
    if (!allValid) {
      const issues = Object.entries(sectionStatus)
        .filter(([_, status]) => !status.valid || !status.completed)
        .map(([_, status]) => `\u274c ${status.name.replace(/\n/g, " ")} is incomplete or invalid.`)
      alert("Profile submission blocked:\n\n" + issues.join("\n"))
      return
    }
    try {
      await saveDataToFirebase(null, true)
      setProfileSubmitted(true)
      const hasSeenCongratulationsPopup = localStorage.getItem(getUserSpecificKey("cmfHasSeenCongratulationsPopup")) === "true"
      if (!hasSeenCongratulationsPopup) {
        setShowCongratulationsPopup(true)
        localStorage.setItem(getUserSpecificKey("cmfHasSeenCongratulationsPopup"), "true")
      } else {
        setShowSummary(true)
      }
      setIsEditing(false)
      window.scrollTo(0, 0)
    } catch (err) {
      console.error("Failed to submit CMF profile:", err)
      alert("Failed to submit profile. Please try again.")
      setProfileSubmitted(false)
    }
  }

  const handleNextOnboardingStep = () => { if (currentOnboardingStep < onboardingSteps.length - 1) setCurrentOnboardingStep(currentOnboardingStep + 1); else setShowWelcomePopup(false) }
  const handleCloseWelcomePopup = () => setShowWelcomePopup(false)
  const handleCloseCongratulationsPopup = () => { setShowCongratulationsPopup(false); setShowSummary(true); window.scrollTo(0, 0) }

  const renderActiveSection = () => {
    const sectionData = formData[activeSection] || {}
    const commonProps = { data: sectionData, updateData: (data) => updateFormData(activeSection, data) }
    switch (activeSection) {
      case "instructions": return <Instructions />
      case "entityOverview": return <EntityOverview {...commonProps} />
      case "ownershipManagement": return <OwnershipManagement {...commonProps} />
      case "contactDetails": return <ContactDetails {...commonProps} />
      case "legalCompliance": return <LegalCompliance {...commonProps} />
      case "productsServices": return <ProductsServices {...commonProps} />
      case "howDidYouHear": return <HowDidYouHear {...commonProps} />
      case "documents": return <CMFDocumentUpload {...commonProps} />
      case "fundDetails": return <FundDetailsSection {...commonProps} />
      case "applicationBrief": return <ApplicationBriefSection {...commonProps} />
      case "generalInvestmentPreference": return <GeneralInvestmentPreferenceSection {...commonProps} />
      case "declarationConsent": return <DeclarationConsent {...commonProps} allFormData={formData} onComplete={() => navigate("/cmf-matches")} />
      default: return <Instructions />
    }
  }

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true); if (!effectiveUserId) return
        const docRef = doc(db, FIRESTORE_COLLECTION, effectiveUserId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setProfileData(data)
          if (data.completedSections) {
            setCompletedSections((prev) => ({ ...prev, instructions: true, ...data.completedSections }))
            localStorage.setItem(getUserSpecificKey(LOCAL_STORAGE_SECTIONS_KEY), JSON.stringify(data.completedSections))
          }
          setFormData((prev) => {
            const merged = { ...prev }
            Object.keys(data).forEach(key => {
              if (merged[key] && typeof merged[key] === "object" && !Array.isArray(merged[key])) {
                merged[key] = { ...merged[key], ...data[key] }
              } else {
                merged[key] = data[key]
              }
            })
            return merged
          })
          const isComplete = data?.declarationConsent?.accuracy && data?.declarationConsent?.dataProcessing && data?.declarationConsent?.termsConditions
          if (isComplete && !isEditing) { setProfileSubmitted(true); setShowSummary(true) }
        }
      } catch (err) { console.error("Error fetching CMF profile data:", err); setError("Failed to load profile data. Please try again later.") }
      finally { setLoading(false) }
    }
    if (effectiveUserId) fetchProfileData()
  }, [isEditing, effectiveUserId])

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <div className="loading-message">Preparing your CMF profile...</div>
      </div>
    )
  }

  if (showSummary && !isEditing) return <CMFProfileSummary data={profileData || formData} onEdit={handleEditProfile} />

  return (
    <div className="universal-profile-container">
      {validationModal.open && (
        <div className="popup-overlay">
          <div className="validation-popup">
            <button className="close-popup" onClick={() => setValidationModal({ open: false, title: "", messages: [] })}><X size={24} /></button>
            <div className="popup-content">
              <h2 className="text-lg font-semibold">{validationModal.title}</h2>
              <ul className="list-disc pl-5 mt-2 text-sm text-red-600">{validationModal.messages.map((msg, idx) => <li key={idx}>{msg}</li>)}</ul>
              <div className="mt-4 flex justify-end"><button className="btn btn-primary" onClick={() => setValidationModal({ open: false, title: "", messages: [] })}>Got it</button></div>
            </div>
          </div>
        </div>
      )}

      {showWelcomePopup && (
        <div className="popup-overlay">
          <div className="welcome-popup">
            <button className="close-popup" onClick={handleCloseWelcomePopup}><X size={24} /></button>
            <div className="popup-content">
              <h2>{onboardingSteps[currentOnboardingStep].title}</h2>
              <p>{onboardingSteps[currentOnboardingStep].content}</p>
              <div className="popup-progress">{onboardingSteps.map((_, index) => <div key={index} className={`progress-dot ${index === currentOnboardingStep ? "active" : ""}`} />)}</div>
              <div className="popup-buttons">
                <button className="btn btn-secondary" onClick={handleCloseWelcomePopup}>Skip</button>
                <button className="btn btn-primary" onClick={handleNextOnboardingStep}>{currentOnboardingStep < onboardingSteps.length - 1 ? "Next" : "Get Started"}<ArrowRight size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCongratulationsPopup && (
        <div className="popup-overlay">
          <div className="congratulations-popup">
            <button className="close-popup" onClick={handleCloseCongratulationsPopup}><X size={24} /></button>
            <div className="popup-content">
              <div className="confetti-animation"></div>
              <h2>Congratulations!</h2>
              <p>You have successfully completed your Capital and Market Facilitator profile!</p>
              <p>Your profile is now active and you can start connecting with businesses that need your expertise.</p>
              <div className="popup-buttons-group">
                <button className="btn btn-secondary" onClick={handleCloseCongratulationsPopup}>View Summary</button>
                <button className="btn btn-primary" onClick={() => navigate("/cmf-matches")}>View My Matches</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1>My CMF Profile — Capital and Market Facilitator</h1>

      <div className="profile-tracker">
        {isCompanyMember && (
          <div style={{ backgroundColor: userRole === "viewer" ? "#fef3c7" : "#e0f2fe", border: `1px solid ${userRole === "viewer" ? "#f59e0b" : "#0369a1"}`, borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Users size={20} color={userRole === "viewer" ? "#f59e0b" : "#0369a1"} />
              <p style={{ margin: 0, color: userRole === "viewer" ? "#f59e0b" : "#0369a1", fontWeight: "600" }}>Company Member - Role: {userRole?.toUpperCase()}</p>
            </div>
            <p style={{ margin: 0, color: "#4a5568", fontSize: "0.875rem" }}>
              {userRole === "owner" && "You have full access to edit all sections."}
              {userRole === "companyadmin" && "You can edit most sections except ownership and final declarations."}
              {userRole === "manager" && "You can edit contact details, products/services, and documents."}
              {userRole === "employee" && "You can edit contact details and upload documents."}
              {userRole === "viewer" && "You have read-only access. Contact the owner for edit permissions."}
            </p>
          </div>
        )}
        <div className="profile-tracker-inner">
          {sections.map((section) => (
            <button key={section.id} onClick={() => setActiveSection(section.id)}
              className={`profile-tracker-button ${activeSection === section.id ? "active" : completedSections[section.id] ? "completed" : "pending"}`}>
              {section.label.split("\n").map((line, i) => <span key={i} className="tracker-label-line">{line}</span>)}
              {completedSections[section.id] && <CheckCircle className="check-icon" />}
            </button>
          ))}
        </div>
      </div>

      <div className="content-card">
        {renderActiveSection()}
        <div className="action-buttons">
          {activeSection !== "instructions" && (<button type="button" onClick={navigateToPreviousSection} className="btn btn-secondary"><ChevronLeft size={16} /> Previous</button>)}
          <button type="button" onClick={handleSaveSection} className="btn btn-secondary"><Save size={16} /> Save</button>
          {activeSection !== "declarationConsent" ? (
            <button type="button" onClick={handleSaveAndContinue} className="btn btn-primary">Save & Continue <ChevronRight size={16} /></button>
          ) : (
            <button type="button" onClick={handleSubmitProfile}
              disabled={!formData.declarationConsent?.accuracy || !formData.declarationConsent?.dataProcessing || !formData.declarationConsent?.termsConditions}
              className="btn btn-primary">Submit Profile</button>
          )}
        </div>
      </div>
    </div>
  )
}
