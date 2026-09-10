import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle, ChevronRight, ChevronLeft, Save, X, ArrowRight, Users } from "lucide-react"
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import "../../smses/UniversalProfile/UniversalProfile.css"
import Instructions from "./CMFInstructions"
import EntityOverview from "../../smses/UniversalProfile/entity-overview"
import OwnershipManagement from "../../smses/UniversalProfile/ownership-management"
import ContactDetails from "../../smses/UniversalProfile/contact-details"
import LegalCompliance from "../../smses/UniversalProfile/legal-compliance"
import ProductsServices from "../../smses/UniversalProfile/products-services"
import HowDidYouHear from "../../smses/UniversalProfile/how-did-you-hear"
import CMFDocumentUpload from "./CMFDocumentUpload"
import CMFDocuments from "cmf/CMFDocuments/CMFDocuments"
import GeneralInvestmentPreferenceSection from "../../Investor/InvestorUniversalProfile/GeneralInvestmentPreference​"
import DeclarationConsent from "../../smses/UniversalProfile/declaration-consent"
import CMFProfileSummary from "./CMFProfileSummary"
import { getAuth, onAuthStateChanged } from "firebase/auth"
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
  { id: "generalInvestmentPreference", label: "Matching\nPreferences" },
  { id: "declarationConsent", label: "Declaration &\nConsent" },
]

const sectionValidations = {
  instructions: () => true,
  entityOverview: (data) => {
    if (!data) return false
    const hasName = Boolean((data.registeredName && String(data.registeredName).trim()) || (data.tradingName && String(data.tradingName).trim()))
    const hasReg = Boolean((data.registrationNumber && String(data.registrationNumber).trim()) || (data.entityType && String(data.entityType).trim()))
    return Boolean(hasName && hasReg)
  },
  ownershipManagement: () => true,
  contactDetails: (data) => {
    if (!data) return false
    const hasName = Boolean(data.contactName && String(data.contactName).trim())
    const hasEmail = Boolean(data.email && String(data.email).trim())
    const hasPhone = Boolean(
      (data.businessPhone && String(data.businessPhone).trim()) ||
      (data.mobile && String(data.mobile).trim()) ||
      (data.businessWhatsApp && String(data.businessWhatsApp).trim())
    )
    const hasAddress = Boolean(data.physicalAddress && String(data.physicalAddress).trim())
    const postalAddressValid = data.sameAsPhysical || Boolean(data.postalAddress && String(data.postalAddress).trim())
    return Boolean(hasName && hasEmail && hasPhone && hasAddress && postalAddressValid)
  },
  legalCompliance: () => true,
  productsServices: () => true,
  howDidYouHear: () => true,
  documents: () => true,
  generalInvestmentPreference: () => true,
  declarationConsent: (data) => {
    if (!data) return false
    return Boolean(data.accuracy && data.dataProcessing)
  },
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
  // Modular Firebase instances
  const db = getFirestore()
  const storage = getStorage()
  const auth = getAuth()

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
    companyadmin: { canEditAll: true, sections: sections.map(s => s.id) },
    cmf: { canEditAll: true, sections: sections.map(s => s.id) },
    manager: { canEditAll: false, sections: ["instructions", "entityOverview", "contactDetails", "productsServices", "documents", "generalInvestmentPreference", "howDidYouHear"] },
    employee: { canEditAll: false, sections: ["instructions", "contactDetails", "documents"] },
    viewer: { canEditAll: false, sections: [] },
  }

  const canEditSection = (sectionId) => {
    // If not a company member or role is owner/admin/cmf or not strictly viewer, user has full editing permissions
    if (!isCompanyMember || userRole === "owner" || userRole === "companyadmin" || userRole === "cmf" || !userRole) return true
    const permissions = ROLE_PERMISSIONS[userRole]
    if (!permissions) return true
    return permissions.canEditAll || permissions.sections.includes(sectionId)
  }

  const [completedSections, setCompletedSections] = useState({
    instructions: true, entityOverview: false, ownershipManagement: false,
    contactDetails: false, legalCompliance: false, productsServices: false,
    howDidYouHear: false, documents: false, generalInvestmentPreference: false, declarationConsent: false,
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
      offeringType: "", offerings: [], productCategories: [], serviceCategories: [],
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

  const FIRESTORE_COLLECTION = "cmfProfiles"
  const LOCAL_STORAGE_KEY_PREFIX = "cmfProfileData"
  const LOCAL_STORAGE_SECTIONS_KEY = "cmfProfileCompletedSections"

  useEffect(() => {
    // Force subcomponents to use passed data props instead of fetching from universalProfiles
    sessionStorage.setItem("isOnboarding", "true")

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          sessionStorage.setItem("isOnboarding", "true")
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
                if (ownerId === user.uid) {
                  setIsCompanyMember(false)
                  setUserRole("owner")
                  setEffectiveUserId(`${user.uid}_cmf`)
                  setEditPermissions(ROLE_PERMISSIONS.owner)
                } else {
                  setIsCompanyMember(true)
                  setCompanyOwnerId(ownerId)
                  const assignedRole = userCompanyRole || "companyadmin"
                  setUserRole(assignedRole)
                  setEffectiveUserId(`${ownerId}_cmf`)
                  setEditPermissions(ROLE_PERMISSIONS[assignedRole] || ROLE_PERMISSIONS.owner)
                }
              } else {
                setIsCompanyMember(false)
                setEffectiveUserId(`${user.uid}_cmf`)
                setUserRole("owner")
                setEditPermissions(ROLE_PERMISSIONS.owner)
              }
            } else {
              setIsCompanyMember(false)
              setEffectiveUserId(`${user.uid}_cmf`)
              setUserRole("owner")
              setEditPermissions(ROLE_PERMISSIONS.owner)
            }
          } else {
            setIsCompanyMember(false)
            setEffectiveUserId(`${user.uid}_cmf`)
            setUserRole("owner")
            setEditPermissions(ROLE_PERMISSIONS.owner)
          }
          const savedData = localStorage.getItem(getUserSpecificKey(LOCAL_STORAGE_KEY_PREFIX))
          const savedCompletedSections = localStorage.getItem(getUserSpecificKey(LOCAL_STORAGE_SECTIONS_KEY))
          const savedSubmissionStatus = localStorage.getItem(getUserSpecificKey("cmfProfileSubmitted"))
          const hasSeenWelcomePopup = localStorage.getItem(getUserSpecificKey("cmfHasSeenWelcomePopup")) === "true"
          if (savedData) {
            try { setFormData(JSON.parse(savedData)) } catch (e) { console.warn("Failed to parse savedData", e) }
          }
          if (savedCompletedSections) {
            try {
              const parsedSections = JSON.parse(savedCompletedSections)
              let parsedFormData = null
              if (savedData) {
                try { parsedFormData = JSON.parse(savedData) } catch (e) {}
              }
              const consentValid = Boolean(parsedFormData?.declarationConsent?.accuracy && parsedFormData?.declarationConsent?.dataProcessing)
              if (!consentValid && parsedSections) {
                parsedSections.declarationConsent = false
              }
              setCompletedSections(parsedSections)
            } catch (e) { console.warn("Failed to parse savedCompletedSections", e) }
          }
          if (savedSubmissionStatus === "true") { setProfileSubmitted(true); setShowSummary(true) }
          if (!hasSeenWelcomePopup) { setShowWelcomePopup(true); localStorage.setItem(getUserSpecificKey("cmfHasSeenWelcomePopup"), "true") }
        } catch (error) {
          console.error("Error checking company membership:", error)
          setEffectiveUserId(`${user.uid}_cmf`)
          setUserRole("owner")
          setEditPermissions(ROLE_PERMISSIONS.owner)
        }
      } else { navigate("/auth") }
      setLoading(false)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const getUserSpecificKey = (baseKey) => { const userId = effectiveUserId || auth.currentUser?.uid; return userId ? `${baseKey}_${userId}` : baseKey }

  useEffect(() => {
    const userId = auth.currentUser?.uid; if (!userId) return
    localStorage.setItem(getUserSpecificKey(LOCAL_STORAGE_KEY_PREFIX), JSON.stringify(formData))
    localStorage.setItem(getUserSpecificKey(LOCAL_STORAGE_SECTIONS_KEY), JSON.stringify(completedSections))
    localStorage.setItem(getUserSpecificKey("cmfProfileSubmitted"), profileSubmitted.toString())
  }, [formData, completedSections, profileSubmitted])

  const updateFormData = (section, data) => {
    setFormData((prev) => {
      const updatedSection = { ...prev[section], ...data }
      const updatedFormData = { ...prev, [section]: updatedSection }
      if (section === "declarationConsent") {
        const isConsentValid = Boolean(updatedSection?.accuracy && updatedSection?.dataProcessing)
        if (!isConsentValid) {
          setCompletedSections(prevSections => {
            if (!prevSections.declarationConsent) return prevSections
            const nextSections = { ...prevSections, declarationConsent: false }
            localStorage.setItem(getUserSpecificKey(LOCAL_STORAGE_SECTIONS_KEY), JSON.stringify(nextSections))
            return nextSections
          })
        }
      }
      return updatedFormData
    })
  }

  const isFileOrBlob = (val) => {
    if (!val) return false
    return (
      val instanceof File ||
      val instanceof Blob ||
      (typeof val === "object" && typeof val.name === "string" && typeof val.size === "number" && typeof val.slice === "function")
    )
  }

  const sanitizeForFirestore = (val) => {
    if (val === undefined || val === null) return null
    if (isFileOrBlob(val)) return null
    if (typeof val === "function") return null
    if (typeof val === "object" && typeof val.item === "function" && typeof val.length === "number") {
      return Array.from(val).map(sanitizeForFirestore)
    }
    if (Array.isArray(val)) {
      return val.map(sanitizeForFirestore)
    }
    if (typeof val === "object") {
      const sanitized = {}
      for (const [k, v] of Object.entries(val)) {
        if (v !== undefined) {
          sanitized[k] = sanitizeForFirestore(v)
        }
      }
      return sanitized
    }
    return val
  }

  const markSectionAsCompleted = async (section) => {
    const updated = { ...completedSections, [section]: true }
    setCompletedSections(updated)
    const userId = effectiveUserId || auth.currentUser?.uid
    if (userId) {
      try {
        const docRef = doc(db, FIRESTORE_COLLECTION, userId)
        await setDoc(docRef, { completedSections: updated }, { merge: true })
      } catch (err) {
        console.warn("Could not mark section completed in Firestore:", err)
      }
      localStorage.setItem(getUserSpecificKey(LOCAL_STORAGE_SECTIONS_KEY), JSON.stringify(updated))
    }
    return updated
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
      if (isFileOrBlob(item)) {
        try {
          const safeName = (item.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_")
          const fileRef = ref(storage, `cmfProfile/${auth.currentUser?.uid}/${pathPrefix}_${Date.now()}_${safeName}`)
          await uploadBytes(fileRef, item)
          return await getDownloadURL(fileRef)
        } catch (uploadErr) {
          console.error("Error uploading file in CMF profile:", uploadErr)
          return null
        }
      } else if (typeof item === "object" && item !== null && typeof item.item === "function" && typeof item.length === "number") {
        const filesArray = Array.from(item)
        return await Promise.all(filesArray.map((entry, idx) => uploadRecursive(entry, `${pathPrefix}/${idx}`)))
      } else if (Array.isArray(item)) {
        return await Promise.all(item.map((entry, idx) => uploadRecursive(entry, `${pathPrefix}/${idx}`)))
      } else if (typeof item === "object" && item !== null) {
        const updated = {}
        for (const key in item) {
          if (Object.prototype.hasOwnProperty.call(item, key)) {
            updated[key] = await uploadRecursive(item[key], `${pathPrefix}/${key}`)
          }
        }
        return updated
      } else {
        return item === undefined ? null : item
      }
    }
    const uploaded = await uploadRecursive(data, section)
    return sanitizeForFirestore(uploaded)
  }

  const saveDataToFirebase = async (section = null, isFinalSubmit = false, nextCompletedSections = null) => {
    setLoading(true)
    const userId = effectiveUserId || (auth.currentUser?.uid ? `${auth.currentUser.uid}_cmf` : null)
    const currentUser = auth.currentUser
    if (!userId || !currentUser) {
      setLoading(false)
      throw new Error("User not logged in.")
    }
    if (section && !canEditSection(section)) {
      alert(`You don't have permission to edit the ${sections.find((s) => s.id === section)?.label.replace(/\n/g, " ")} section.`)
      setLoading(false)
      return
    }

    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, userId)
      const latestSnap = await getDoc(docRef)
      if (latestSnap.exists()) {
        const latestData = latestSnap.data()
        if (latestData.documents) {
          setFormData(prev => ({
            ...prev,
            documents: latestData.documents
          }))
        }
      }

      const sectionData = section ? formData[section] : formData
      const uploaded = section
        ? { ...(section !== "instructions" && { [section]: await uploadFilesAndReplaceWithURLs(sectionData, section) }) }
        : await uploadFilesAndReplaceWithURLs(sectionData, "full")

      let userName = currentUser.email
      try {
        const userDocRef = doc(db, "users", currentUser.uid)
        const userDocSnap = await getDoc(userDocRef)
        if (userDocSnap.exists()) {
          userName = userDocSnap.data().username || userDocSnap.data().email || currentUser.email
        }
      } catch (userErr) {
        console.warn("Could not fetch user name:", userErr)
      }

      const editLogEntry = {
        editedBy: currentUser.uid,
        editedByName: userName,
        editedByEmail: currentUser.email,
        role: userRole || "owner",
        section: section || "full_profile",
        sectionName: section ? sections.find((s) => s.id === section)?.label.replace(/\n/g, " ") : "Full Profile",
        timestamp: new Date().toISOString(),
        action: isFinalSubmit ? "submitted" : "updated",
      }

      const existingHistory = latestSnap.exists() ? latestSnap.data().editHistory || [] : []
      const sectionsToSave = nextCompletedSections || completedSections

      const dataToSave = sanitizeForFirestore({
        ...uploaded,
        completedSections: sectionsToSave,
        lastEditedBy: currentUser.uid,
        lastEditedByName: userName,
        lastEditedAt: new Date().toISOString(),
        lastEditedByRole: userRole || "owner",
        editHistory: [...existingHistory, editLogEntry],
      })

      // Primary profile save
      await setDoc(docRef, dataToSave, { merge: true })

      // Dual-sync to base currentUser.uid if effectiveUserId is ${currentUser.uid}_cmf
      if (currentUser.uid && userId !== currentUser.uid) {
        try {
          const fallbackDocRef = doc(db, FIRESTORE_COLLECTION, currentUser.uid)
          await setDoc(fallbackDocRef, dataToSave, { merge: true })
        } catch (dualErr) {
          console.warn("Could not dual-sync to fallback UID doc:", dualErr)
        }
      }

      setEditHistory([...existingHistory, editLogEntry])
      setProfileData(prev => ({ ...(prev || {}), ...dataToSave }))
      localStorage.setItem(getUserSpecificKey(LOCAL_STORAGE_SECTIONS_KEY), JSON.stringify(sectionsToSave))
      localStorage.setItem(getUserSpecificKey(LOCAL_STORAGE_KEY_PREFIX), JSON.stringify(formData))
    } catch (saveErr) {
      console.error("Error saving CMF profile data to Firestore:", saveErr)
      alert("Failed to save to cloud: " + (saveErr?.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSection = async () => {
    if (activeSection === "documents") {
      alert("Documents are saved automatically when uploaded.")
      return
    }
    const updated = { ...completedSections, [activeSection]: true }
    setCompletedSections(updated)
    localStorage.setItem(getUserSpecificKey(LOCAL_STORAGE_SECTIONS_KEY), JSON.stringify(updated))
    await saveDataToFirebase(activeSection, false, updated)
    alert("Section saved!")
  }

  const handleSaveAndContinue = async () => {
    // If on documents tab, just navigate to the next section
    if (activeSection === "documents") {
      const updated = await markSectionAsCompleted("documents")
      navigateToNextSection()
      return
    }

    const sectionData = formData[activeSection] || {}
    const isValid = sectionValidations[activeSection]?.(sectionData)
    if (!isValid) {
      const errors = []
      if (activeSection === "entityOverview") {
        errors.push("Entity Overview requires Registered or Trading Name, and Registration Number or Entity Type.")
      } else if (activeSection === "contactDetails") {
        errors.push("Contact Details requires Contact Name, Email, Phone/Mobile, and Physical Address.")
      } else if (activeSection === "declarationConsent") {
        errors.push("Declaration & Consent requires confirming accuracy and consenting to data processing.")
      } else {
        errors.push(`${sections.find((s) => s.id === activeSection)?.label.replace(/\n/g, " ")} is incomplete or contains invalid fields.`)
      }
      if (activeSection !== "instructions") {
        setValidationModal({ open: true, title: "Please review the following issues:", messages: errors })
        return
      }
    }

    const updated = { ...completedSections, [activeSection]: true }
    setCompletedSections(updated)
    localStorage.setItem(getUserSpecificKey(LOCAL_STORAGE_SECTIONS_KEY), JSON.stringify(updated))
    await saveDataToFirebase(activeSection, false, updated)
    navigateToNextSection()
  }

  const handleSubmitProfile = async () => {
    const isConsentValid = Boolean(formData.declarationConsent?.accuracy && formData.declarationConsent?.dataProcessing)
    if (!isConsentValid) {
      setValidationModal({
        open: true,
        title: "Declaration & Consent Required",
        messages: ["You must accept the Declaration of Accuracy and Data Processing consent before submitting your profile."]
      })
      return
    }

    const updated = { ...completedSections, declarationConsent: true }
    setCompletedSections(updated)
    localStorage.setItem(getUserSpecificKey(LOCAL_STORAGE_SECTIONS_KEY), JSON.stringify(updated))

    const { allValid, sectionStatus } = validateAllSections(formData, updated)
    if (!allValid) {
      const issues = Object.entries(sectionStatus)
        .filter(([_, status]) => !status.valid || !status.completed)
        .map(([_, status]) => `\u274c ${status.name.replace(/\n/g, " ")} is incomplete or invalid.`)
      alert("Profile submission blocked:\n\n" + issues.join("\n"))
      return
    }
    try {
      await saveDataToFirebase(null, true, updated)
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
      case "documents":
        return (
          <CMFDocuments
            onClose={async () => {
              // Refresh profile data from Firestore
              const userId = effectiveUserId || auth.currentUser?.uid;
              if (userId) {
                const docRef = doc(db, "cmfProfiles", userId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                  const data = docSnap.data();
                  // Update formData with the latest data
                  setFormData(prev => {
                    const merged = { ...prev };
                    // Update documents section
                    if (data.documents) {
                      merged.documents = data.documents;
                    }
                    // Also update other sections if they changed
                    Object.keys(data).forEach(key => {
                      if (key !== 'documents' && merged[key] && typeof merged[key] === 'object') {
                        merged[key] = { ...merged[key], ...data[key] };
                      }
                    });
                    return merged;
                  });
                }
              }
              setActiveSection("generalInvestmentPreference");
            }}
          />
        )
      case "generalInvestmentPreference": return <GeneralInvestmentPreferenceSection {...commonProps} />
      case "declarationConsent": return <DeclarationConsent {...commonProps} allFormData={formData} onComplete={() => navigate("/cmf-matches")} />
      default: return <Instructions />
    }
  }

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true)
        const targetId = effectiveUserId || (auth.currentUser?.uid ? `${auth.currentUser.uid}_cmf` : null)
        if (!targetId) return

        let docRef = doc(db, FIRESTORE_COLLECTION, targetId)
        let docSnap = await getDoc(docRef)

        // Fallback: check currentUser.uid if targetId was ${uid}_cmf
        if (!docSnap.exists() && auth.currentUser?.uid && targetId !== auth.currentUser.uid) {
          const fallbackRef = doc(db, FIRESTORE_COLLECTION, auth.currentUser.uid)
          const fallbackSnap = await getDoc(fallbackRef)
          if (fallbackSnap.exists()) {
            docRef = fallbackRef
            docSnap = fallbackSnap
          }
        }

        if (docSnap.exists()) {
          const data = docSnap.data()
          setProfileData(data)
          const consentValid = Boolean(data?.declarationConsent?.accuracy && data?.declarationConsent?.dataProcessing)
          if (data.completedSections) {
            const cleanCompleted = {
              ...data.completedSections,
              instructions: true,
              declarationConsent: consentValid ? Boolean(data.completedSections.declarationConsent) : false,
            }
            setCompletedSections((prev) => ({ ...prev, ...cleanCompleted }))
            localStorage.setItem(getUserSpecificKey(LOCAL_STORAGE_SECTIONS_KEY), JSON.stringify(cleanCompleted))
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
          const isComplete = data?.declarationConsent?.accuracy && data?.declarationConsent?.dataProcessing && data?.declarationConsent?.termsConditions
          if (isComplete && !isEditing) { setProfileSubmitted(true); setShowSummary(true) }
        }
      } catch (err) {
        console.error("Error fetching CMF profile data:", err)
        setError("Failed to load profile data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchProfileData()
  }, [isEditing, effectiveUserId])

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <div className="loading-message">Preparing your CMF profile...</div>
      </div>
    )
  }

  if (showSummary && !isEditing) {
    return (
      <div className="universal-profile-container">
        <CMFProfileSummary data={profileData || formData} onEdit={handleEditProfile} />
      </div>
    )
  }

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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>My CMF Profile — Capital and Market Facilitator</h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => {
              setIsEditing(false);
              setShowSummary(true);
            }}
            className="btn btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            {profileSubmitted ? "← Back to Profile Summary" : "👁 View Profile Summary"}
          </button>
        </div>
      </div>

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
          {sections.map((section) => {
            const isCompleted = section.id === "instructions"
              ? true
              : section.id === "declarationConsent"
                ? Boolean(completedSections.declarationConsent && formData.declarationConsent?.accuracy && formData.declarationConsent?.dataProcessing)
                : Boolean(completedSections[section.id] && sectionValidations[section.id]?.(formData[section.id] || {}))

            return (
              <button key={section.id} onClick={() => setActiveSection(section.id)}
                className={`profile-tracker-button ${activeSection === section.id ? "active" : isCompleted ? "completed" : "pending"}`}>
                {section.label.split("\n").map((line, i) => <span key={i} className="tracker-label-line">{line}</span>)}
                {isCompleted && <CheckCircle className="check-icon" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="content-card">
        {renderActiveSection()}
        <div className="action-buttons">
          {activeSection !== "instructions" && (
            <button type="button" onClick={navigateToPreviousSection} className="btn btn-secondary">
              <ChevronLeft size={16} /> Previous
            </button>
          )}

          {activeSection !== "documents" && (
            <button type="button" onClick={handleSaveSection} className="btn btn-secondary">
              <Save size={16} /> Save
            </button>
          )}

          {activeSection === "documents" && (
            <span style={{ color: "#2e7d32", fontSize: "14px", fontWeight: "500" }}>
              ✅ Documents are saved automatically
            </span>
          )}

          {activeSection !== "declarationConsent" ? (
            activeSection === "documents" ? (
              <button type="button" onClick={() => {
                markSectionAsCompleted("documents");
                navigateToNextSection();
              }} className="btn btn-primary">
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={handleSaveAndContinue} className="btn btn-primary">
                Save & Continue <ChevronRight size={16} />
              </button>
            )
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
