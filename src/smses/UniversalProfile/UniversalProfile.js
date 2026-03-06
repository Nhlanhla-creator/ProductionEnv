import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle, ChevronRight, ChevronLeft, Save, X, ArrowRight, Users } from "lucide-react"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "../../firebaseConfig"
import "./UniversalProfile.css"
import Instructions from "./instructions"
import EntityOverview from "./entity-overview"
import OwnershipManagement from "./ownership-management"
import ContactDetails from "./contact-details"
import LegalCompliance from "./legal-compliance"
import Governance from "./governance"
import FinancialOverview from "./FinancialOverview"
import OperationsOverview from "./OperationsOverview"
import ProductsServices from "./products-services"
import HowDidYouHear from "./how-did-you-hear"
import Documents from "./Documents"
import DeclarationConsent from "./declaration-consent"
import ProfileSummary from "./ProfileSummary"
import { onAuthStateChanged } from "firebase/auth"

const sections = [
  { id: "instructions", label: "Instructions" },
  { id: "entityOverview", label: "Entity\nOverview" },
  { id: "productsServices", label: "Products &\nServices" },
  { id: "ownershipManagement", label: "Ownership &\nManagement" },
  { id: "contactDetails", label: "Contact\nDetails" },
  { id: "legalCompliance", label: "Legal &\nCompliance" },
  { id: "operationsOverview", label: "Operations\nOverview" },
  { id: "financialOverview", label: "Financial\nOverview" },
  { id: "governance", label: "Governance" },
  { id: "howDidYouHear", label: "How Did\nYou Hear" },
  { id: "documents", label: "Document\nUpload" },
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
      data.fullTimeEmployees >= 0 &&       // updated: was employeeCount
      data.yearsInOperation >= 0 &&
      data.operationStage &&
      Array.isArray(data.economicSectors) && data.economicSectors.length > 0 &&
      Array.isArray(data.operatingCountries) && data.operatingCountries.length > 0 && // updated: was location
      data.businessDescription
    )
  },

  ownershipManagement: () => true,

  contactDetails: (data) => {
    const requiredFields = [
      data.contactTitle,
      data.contactName,
      data.position,
      data.contactId,
      data.businessPhone,
      data.mobile,
      data.email,
      data.physicalAddress,
    ]
    const hasAllRequired = requiredFields.every((field) => typeof field === "string" && field.trim() !== "")
    const postalAddressValid =
      data.sameAsPhysical || (typeof data.postalAddress === "string" && data.postalAddress.trim() !== "")
    return hasAllRequired && postalAddressValid
  },

  legalCompliance: () => true,

  operationsOverview: (data) => {
    return (
      data.multipleSuppliers !== undefined && data.multipleSuppliers !== "" &&
      data.contingencyPlan !== undefined && data.contingencyPlan !== "" &&
      data.trackPerformanceMetrics !== undefined && data.trackPerformanceMetrics !== "" &&
      data.threeSuccessfulDeliveries !== undefined && data.threeSuccessfulDeliveries !== "" &&
      data.hasCapacityToIncrease !== undefined && data.hasCapacityToIncrease !== "" &&
      data.hasFormalProcedures !== undefined && data.hasFormalProcedures !== "" &&
      data.hasMajorIncidents !== undefined && data.hasMajorIncidents !== ""
    )
  },

  financialOverview: () => true,
  governance: () => true,
  productsServices: () => true,
  howDidYouHear: () => true,
  documents: () => true,
  declarationConsent: () => true,
}

const validateAllSections = (formData, completedSections) => {
  const sectionStatus = {}
  let allValid = true

  sections.forEach((section) => {
    const sectionId = section.id
    const isValid = sectionValidations[sectionId](formData[sectionId] || {})

    sectionStatus[sectionId] = {
      valid: isValid,
      completed: completedSections[sectionId],
      name: section.label,
    }

    if (!isValid || !completedSections[sectionId]) {
      allValid = false
    }
  })

  return { allValid, sectionStatus }
}

const onboardingSteps = [
  {
    title: "Welcome to Universal Profile",
    content: "This profile will help us understand your business better and provide you with tailored services.",
  },
  {
    title: "Step 1: Read Instructions",
    content: "Start by reading the instructions carefully to understand what information you'll need to provide.",
  },
  {
    title: "Step 2: Fill in Your Details",
    content: "Complete each section with accurate information about your business entity, ownership, and operations.",
  },
  {
    title: "Step 3: Upload Documents",
    content: "Upload all required documents in the Document Upload section. We accept PDF, Word, Excel, and image files.",
  },
  {
    title: "Step 4: Review & Submit",
    content: "Review your information in the summary page and submit when you're ready. You can always edit later.",
  },
]

export default function UniversalProfile() {
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
  const [showEditHistory, setShowEditHistory] = useState(false)

  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0)

  const ROLE_PERMISSIONS = {
    owner: {
      canEditAll: true,
      sections: [
        "instructions", "entityOverview", "ownershipManagement", "contactDetails",
        "legalCompliance", "operationsOverview", "financialOverview", "governance",
        "productsServices", "howDidYouHear", "documents", "declarationConsent",
      ],
    },
    companyadmin: {
      canEditAll: false,
      sections: [
        "entityOverview", "contactDetails", "legalCompliance", "operationsOverview",
        "financialOverview", "governance", "productsServices", "documents",
      ],
    },
    manager: {
      canEditAll: false,
      sections: ["contactDetails", "productsServices", "operationsOverview", "documents"],
    },
    employee: {
      canEditAll: false,
      sections: ["contactDetails", "documents"],
    },
    viewer: {
      canEditAll: false,
      sections: [],
    },
  }

  const canEditSection = (sectionId) => {
    if (!userRole) return false
    const permissions = ROLE_PERMISSIONS[userRole]
    if (!permissions) return false
    return permissions.canEditAll || permissions.sections.includes(sectionId)
  }

  const isProfileComplete = () => {
    return Object.entries(sectionValidations).every(([sectionKey, validate]) => {
      const valid = validate(formData[sectionKey] || {})
      const completed = completedSections[sectionKey]
      return valid && completed
    })
  }

  const [completedSections, setCompletedSections] = useState({
    instructions: true,
    entityOverview: false,
    ownershipManagement: false,
    contactDetails: false,
    legalCompliance: false,
    operationsOverview: false,
    financialOverview: false,
    productsServices: false,
    howDidYouHear: false,
    documents: false,
    declarationConsent: false,
  })

  const [validationModal, setValidationModal] = useState({
    open: false,
    title: "",
    messages: [],
  })

  const [formData, setFormData] = useState({
    instructions: {},

    // ── Entity Overview ──────────────────────────────────────────────────────
    entityOverview: {
      registeredName: "",
      tradingName: "",
      registrationNumber: "",
      entityType: "",
      legalStructure: "",
      entitySize: "",
      financialYearEnd: "",
      // Employees (split into full-time / part-time)
      fullTimeEmployees: "",
      partTimeEmployees: "",
      yearsInOperation: "",
      operationStage: "",
      economicSectors: [],
      businessDescription: "",
      // Geographic reach (multi-select, no single city)
      operatingCountries: [],
      operatingProvinces: [],
      // Brand assets
      companyLogo: "",
      companyLetterhead: "",
      // Org structure
      orgStructure: "",
      orgStructureFileName: "",
      orgStructureUpdatedAt: "",
    },

    ownershipManagement: {
      shareholders: [
        {
          name: "",
          idRegNo: "",
          country: "",
          shareholding: "",
          race: "",
          gender: "",
          isYouth: false,
          isDisabled: false,
          idDocument: null,
        },
      ],
      directors: [
        {
          name: "",
          id: "",
          position: "",
          nationality: "",
          isExec: false,
          doc: null,
        },
      ],
      totalShares: "",
    },

    contactDetails: {
      sameAsPhysical: false,
    },

    // ── Legal & Compliance ───────────────────────────────────────────────────
    legalCompliance: {
      taxNumber: "",
      taxClearancePin: "",           // NEW
      payeNumber: "",
      vatNumber: "",
      uifStatus: "",
      uifNumber: "",
      coidaNumber: "",
      bbbeeLevel: "",
      industryAccreditations: [],
      industryAccreditationsOther: "",
      pendingLegalJudgments: "",     // NEW
      pendingLegalJudgmentsDetails: "", // NEW
      taxClearanceCert: [],
      vatCertificate: [],
      bbbeeCert: [],
      otherCerts: [],
      industryAccreditationDocs: [],
    },

    // ── Operations Overview ──────────────────────────────────────────────────
    operationsOverview: {
      multipleSuppliers: "",
      contingencyPlan: "",
      trackPerformanceMetrics: "",
      threeSuccessfulDeliveries: "",
      hasCapacityToIncrease: "",
      hasFormalProcedures: "",
      hasMajorIncidents: "",
      operationalChallenges: "",     // NEW
    },

    // ── Financial Overview ───────────────────────────────────────────────────
    financialOverview: {
      generatesRevenue: "",
      annualRevenue: "",
      currentValuation: "",
      hasAccountingSoftware: "",
      accountingSoftwareName: "",
      profitabilityStatus: "",
      existingDebt: "",
      fundraisingHistory: "",
      // Financial documentation (reordered + new fields)
      booksUpToDate: "",
      booksUpToDateDetails: "",
      hasManagementAccounts: "",       // NEW
      latestManagementAccounts: "",    // NEW
      managementAccountsDocs: [],      // NEW
      hasFinancialStatements: "",      // NEW
      financialStatementsYears: [],    // NEW
      financialStatementsDocs: [],     // NEW
      financialsAudited: "",
      auditedFinancialsDocs: [],
      additionalFinancialNotes: "",
      financialChallenges: "",         // NEW
    },

    governance: {},

    // ── Products & Services ──────────────────────────────────────────────────
    productsServices: {
      entityType: "smse",
      offeringType: "",
      productCategories: [],
      serviceCategories: [],
      deliveryModes: [],
      minLeadTime: "",
      minLeadTimeUnit: "days",
      maxLeadTime: "",
      maxLeadTimeUnit: "days",
      targetMarket: "",
      // Key clients — now include revenuePercentage, revenueGrowthPotential, revenueGrowthDetails
      keyClients: [],
    },

    howDidYouHear: {},

    documents: {
      registrationCertificate: [],
      certifiedIds: [],
      shareRegister: [],
      proofOfAddress: [],
      taxClearanceCert: [],
      vatCertificate: [],
      bbbeeCert: [],
      otherCerts: [],
      industryAccreditationDocs: [],
      companyProfile: [],
      clientReferences: [],
    },

    declarationConsent: {
      accuracy: false,
      dataProcessing: false,
      termsConditions: false,
    },
  })

  // ── Auth + company membership ──────────────────────────────────────────────
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
                  setIsCompanyMember(false)
                  setEffectiveUserId(user.uid)
                  setEditPermissions(ROLE_PERMISSIONS.owner)
                } else {
                  setIsCompanyMember(true)
                  setCompanyOwnerId(ownerId)
                  setEffectiveUserId(ownerId)
                  setEditPermissions(ROLE_PERMISSIONS[userCompanyRole] || ROLE_PERMISSIONS.viewer)
                }
              }
            } else {
              setIsCompanyMember(false)
              setEffectiveUserId(user.uid)
              setUserRole("owner")
              setEditPermissions(ROLE_PERMISSIONS.owner)
            }
          }

          const savedData = localStorage.getItem(getUserSpecificKey("universalProfileData"))
          const savedCompletedSections = localStorage.getItem(getUserSpecificKey("universalProfileCompletedSections"))
          const savedSubmissionStatus = localStorage.getItem(getUserSpecificKey("profileSubmitted"))
          const hasSeenWelcomePopup = localStorage.getItem(getUserSpecificKey("hasSeenWelcomePopup")) === "true"

          if (savedData) setFormData(JSON.parse(savedData))
          if (savedCompletedSections) setCompletedSections(JSON.parse(savedCompletedSections))
          if (savedSubmissionStatus === "true") {
            setProfileSubmitted(true)
            setShowSummary(true)
          }

          if (!hasSeenWelcomePopup) {
            setShowWelcomePopup(true)
            localStorage.setItem(getUserSpecificKey("hasSeenWelcomePopup"), "true")
          }
        } catch (error) {
          console.error("Error checking company membership:", error)
          setEffectiveUserId(user.uid)
          setUserRole("owner")
          setEditPermissions(ROLE_PERMISSIONS.owner)
        }
      } else {
        navigate("/login")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const getUserSpecificKey = (baseKey) => {
    const userId = auth.currentUser?.uid
    return userId ? `${baseKey}_${userId}` : baseKey
  }

  useEffect(() => {
    const userId = auth.currentUser?.uid
    if (!userId) return
    localStorage.setItem(getUserSpecificKey("universalProfileData"), JSON.stringify(formData))
    localStorage.setItem(getUserSpecificKey("universalProfileCompletedSections"), JSON.stringify(completedSections))
    localStorage.setItem(getUserSpecificKey("profileSubmitted"), profileSubmitted.toString())
  }, [formData, completedSections, profileSubmitted])

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
    const updated = { ...completedSections, [section]: true }
    setCompletedSections(updated)

    const userId = auth.currentUser?.uid
    if (userId) {
      const docRef = doc(db, "universalProfiles", userId)
      await setDoc(docRef, { completedSections: updated }, { merge: true })
      localStorage.setItem(getUserSpecificKey("universalProfileCompletedSections"), JSON.stringify(updated))
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

  const handleEditProfile = () => {
    setIsEditing(true)
    setShowSummary(false)
    setActiveSection("entityOverview")
    window.scrollTo(0, 0)
  }

  const uploadFilesAndReplaceWithURLs = async (data, section) => {
    const uploadRecursive = async (item, pathPrefix) => {
      if (item instanceof File) {
        const fileRef = ref(storage, `universalProfile/${auth.currentUser?.uid}/${pathPrefix}`)
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

  const saveDataToFirebase = async (section = null, isFinalSubmit = false) => {
    setLoading(true)
    const userId = effectiveUserId || auth.currentUser?.uid
    const currentUser = auth.currentUser

    if (!userId) {
      setLoading(false)
      throw new Error("User not logged in.")
    }

    if (section && !canEditSection(section)) {
      alert(
        `You don't have permission to edit the ${sections.find((s) => s.id === section)?.label.replace(/\n/g, " ")} section. Your role (${userRole}) does not allow this.`
      )
      setLoading(false)
      return
    }

    const docRef = doc(db, "universalProfiles", userId)
    const sectionData = section ? formData[section] : formData

    const uploaded = section
      ? {
          ...(section !== "instructions" && {
            [section]: await uploadFilesAndReplaceWithURLs(sectionData, section),
          }),
        }
      : await uploadFilesAndReplaceWithURLs(sectionData, "full")

    const userDocRef = doc(db, "users", currentUser.uid)
    const userDocSnap = await getDoc(userDocRef)
    const userName = userDocSnap.exists()
      ? userDocSnap.data().username || userDocSnap.data().email || currentUser.email
      : currentUser.email

    const editLogEntry = {
      editedBy: currentUser.uid,
      editedByName: userName,
      editedByEmail: currentUser.email,
      role: userRole,
      section: section || "full_profile",
      sectionName: section
        ? sections.find((s) => s.id === section)?.label.replace(/\n/g, " ")
        : "Full Profile",
      timestamp: new Date().toISOString(),
      action: isFinalSubmit ? "submitted" : "updated",
    }

    const profileSnap = await getDoc(docRef)
    const existingHistory = profileSnap.exists() ? profileSnap.data().editHistory || [] : []

    const dataToSave = {
      ...uploaded,
      completedSections,
      ...(isFinalSubmit || !section ? { completedSections } : {}),
      lastEditedBy: currentUser.uid,
      lastEditedByName: userName,
      lastEditedAt: new Date().toISOString(),
      lastEditedByRole: userRole,
      editHistory: [...existingHistory, editLogEntry],
    }

    const triggerSections = [
      "enterpriseReadiness", "documentUpload", "entityOverview",
      "legalCompliance", "governance", "contactDetails", "financialOverview",
    ]

    if (section) {
      const triggerPayload = {}
      if (triggerSections.includes(section)) {
        triggerPayload.triggerFundabilityEvaluation = true
        triggerPayload.triggerLegitimacyEvaluation = true
      }
      if (Object.keys(triggerPayload).length > 0) {
        await setDoc(docRef, triggerPayload, { merge: true })
      }
    }

    await setDoc(docRef, dataToSave, { merge: true })
    setEditHistory([...existingHistory, editLogEntry])
    setLoading(false)
  }

  const handleSaveSection = async () => {
    await saveDataToFirebase(activeSection)
    alert("Section saved!")
  }

  const handleSaveAndContinue = async () => {
    const sectionData = formData[activeSection] || {}
    const isValid = sectionValidations[activeSection]?.(sectionData)

    if (!isValid) {
      const errors = []

      if (activeSection === "entityOverview") {
        errors.push("Entity Overview section is incomplete. Please fill in all required fields.")
      } else if (activeSection === "contactDetails") {
        errors.push("Contact Details section is incomplete. Please fill in all required fields.")
      } else if (activeSection === "operationsOverview") {
        errors.push("Operations Overview section is incomplete. Please answer all 7 questions.")
      } else {
        errors.push(
          `${sections.find((s) => s.id === activeSection)?.label.replace(/\n/g, " ")} is incomplete or contains invalid fields.`
        )
      }

      if (activeSection !== "instructions") {
        setValidationModal({ open: true, title: "Please review the following issues:", messages: errors })
      }
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
        .map(([_, status]) => `❌ ${status.name.replace(/\n/g, " ")} is incomplete or invalid.`)
      alert("Profile submission blocked:\n\n" + issues.join("\n"))
      return
    }

    try {
      await saveDataToFirebase()
      setProfileSubmitted(true)

      const hasSeenCongratulationsPopup =
        localStorage.getItem(getUserSpecificKey("hasSeenCongratulationsPopup")) === "true"
      if (!hasSeenCongratulationsPopup) {
        setShowCongratulationsPopup(true)
        localStorage.setItem(getUserSpecificKey("hasSeenCongratulationsPopup"), "true")
      } else {
        setShowSummary(true)
      }

      setIsEditing(false)
      window.scrollTo(0, 0)
    } catch (err) {
      console.error("Failed to submit profile:", err)
      alert("Failed to submit profile. Please try again.")
      setProfileSubmitted(false)
    }
  }

  const handleRegistrationComplete = async () => {
    alert("Your profile has been successfully submitted!")
    navigate("/dashboard")
  }

  const handleNextOnboardingStep = () => {
    if (currentOnboardingStep < onboardingSteps.length - 1) {
      setCurrentOnboardingStep(currentOnboardingStep + 1)
    } else {
      setShowWelcomePopup(false)
    }
  }

  const handleCloseWelcomePopup = () => setShowWelcomePopup(false)

  const handleCloseCongratulationsPopup = () => {
    setShowCongratulationsPopup(false)
    setShowSummary(true)
    window.scrollTo(0, 0)
  }

  const handleNavigateToFunding = () => navigate("/applications/funding")

  const isDocumentsSectionComplete = () => {
    const requiredDocs = ["registrationCertificate", "certifiedIds", "shareRegister", "proofOfAddress", "taxClearanceCert"]
    const documents = formData.documents || {}
    return requiredDocs.every((docId) => (documents[docId] || []).length > 0)
  }

  const renderActiveSection = () => {
    const sectionData = formData[activeSection] || {}
    const commonProps = {
      data: sectionData,
      updateData: (data) => updateFormData(activeSection, data),
    }

    switch (activeSection) {
      case "instructions":
        return <Instructions />
      case "entityOverview":
        return <EntityOverview {...commonProps} />
      case "ownershipManagement":
        return <OwnershipManagement {...commonProps} />
      case "contactDetails":
        return <ContactDetails {...commonProps} />
      case "legalCompliance":
        return <LegalCompliance {...commonProps} />
      case "operationsOverview":
        return <OperationsOverview {...commonProps} />
      case "financialOverview": {
        const updateFinancial = (sectionOrPatch, maybePatch) => {
          if (typeof sectionOrPatch === "string") {
            return updateFormData(sectionOrPatch, maybePatch)
          }
          return updateFormData("financialOverview", sectionOrPatch)
        }
        return (
          <FinancialOverview
            data={formData.financialOverview || {}}
            updateData={updateFinancial}
          />
        )
      }
      case "governance":
        return (
          <Governance
            data={formData.governance || {}}
            updateData={(section, data) => updateFormData(section, data)}
          />
        )
      case "productsServices":
        return <ProductsServices {...commonProps} />
      case "howDidYouHear":
        return <HowDidYouHear {...commonProps} />
      case "documents":
        return <Documents {...commonProps} />
      case "declarationConsent":
        return (
          <DeclarationConsent
            {...commonProps}
            allFormData={formData}
            onComplete={handleRegistrationComplete}
          />
        )
      default:
        return <Instructions />
    }
  }

  // ── Fetch profile from Firebase ────────────────────────────────────────────
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true)
        if (!effectiveUserId) return

        const docRef = doc(db, "universalProfiles", effectiveUserId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setProfileData(data)

          if (data.completedSections) {
            setCompletedSections((prev) => ({ ...prev, instructions: true, ...data.completedSections }))
            localStorage.setItem(
              getUserSpecificKey("universalProfileCompletedSections"),
              JSON.stringify(data.completedSections)
            )
          }

          setFormData((prev) => ({ ...prev, ...data }))

          const isComplete =
            data?.declarationConsent?.accuracy &&
            data?.declarationConsent?.dataProcessing &&
            data?.declarationConsent?.termsConditions

          if (isComplete && !isEditing) {
            setProfileSubmitted(true)
            setShowSummary(true)
          }
        } else {
          if (isCompanyMember) {
            setError("Company profile not found. Please contact the company owner to complete the Universal Profile.")
          } else {
            setError("No profile found. Please complete your Universal Profile first.")
          }
        }
      } catch (err) {
        console.error("Error fetching profile data:", err)
        setError("Failed to load profile data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (effectiveUserId) fetchProfileData()
  }, [isEditing, effectiveUserId])

  // Auto-complete documents section
  useEffect(() => {
    if (isDocumentsSectionComplete() && !completedSections.documents) {
      setCompletedSections((prev) => ({ ...prev, documents: true }))
    } else if (!isDocumentsSectionComplete() && completedSections.documents) {
      setCompletedSections((prev) => ({ ...prev, documents: false }))
    }
  }, [formData.documents])

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <div className="loading-message">Preparing next step...</div>
      </div>
    )
  }

  if (showSummary && !isEditing) {
    return <ProfileSummary data={profileData || formData} onEdit={handleEditProfile} />
  }

  return (
    <div className="universal-profile-container">
      {/* Validation Modal */}
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

      {/* Welcome Popup */}
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
              <div className="confetti-animation"></div>
              <h2>Congratulations!</h2>
              <p>You've successfully completed your Universal Profile!</p>
              <p>
                Your compliance score is "xx%", you can view this in your BIG score and you can make any necessary
                edits, or proceed to the Funding Application to apply for business funding.
              </p>
              <div className="popup-buttons-group">
                <button className="btn btn-secondary" onClick={handleCloseCongratulationsPopup}>
                  View Summary
                </button>
                <button className="btn btn-primary" onClick={handleNavigateToFunding}>
                  Go to Funding Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1>My Universal Profile</h1>

      <div className="profile-tracker">
        {isCompanyMember && (
          <div
            style={{
              backgroundColor: userRole === "viewer" ? "#fef3c7" : "#e0f2fe",
              border: `1px solid ${userRole === "viewer" ? "#f59e0b" : "#0369a1"}`,
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Users size={20} color={userRole === "viewer" ? "#f59e0b" : "#0369a1"} />
              <p style={{ margin: 0, color: userRole === "viewer" ? "#f59e0b" : "#0369a1", fontWeight: "600" }}>
                Company Member - Role: {userRole?.toUpperCase()}
              </p>
            </div>
            <p style={{ margin: 0, color: "#4a5568", fontSize: "0.875rem" }}>
              {userRole === "owner" && "You have full access to edit all sections."}
              {userRole === "companyadmin" && "You can edit most sections except ownership and final declarations."}
              {userRole === "manager" && "You can edit contact details, products/services, operations, and documents."}
              {userRole === "employee" && "You can edit contact details and upload documents."}
              {userRole === "viewer" && "You have read-only access. Contact the owner for edit permissions."}
            </p>
            {editPermissions?.sections?.length > 0 && (
              <p style={{ margin: "0.5rem 0 0 0", color: "#4a5568", fontSize: "0.875rem", fontWeight: "500" }}>
                Editable sections:{" "}
                {editPermissions.sections
                  .map((s) => sections.find((sec) => sec.id === s)?.label.replace(/\n/g, " "))
                  .join(", ")}
              </p>
            )}
          </div>
        )}

        <div className="profile-tracker-inner">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                if (section.id === "documents") {
                  window.location.href = "/my-documents"
                } else {
                  setActiveSection(section.id)
                }
              }}
              className={`profile-tracker-button ${
                activeSection === section.id ? "active" : completedSections[section.id] ? "completed" : "pending"
              }`}
            >
              {section.label.split("\n").map((line, i) => (
                <span key={i} className="tracker-label-line">
                  {line}
                </span>
              ))}
              {completedSections[section.id] && <CheckCircle className="check-icon" />}
            </button>
          ))}
        </div>
      </div>

      {!isProfileComplete() && <p className="text-red-600 text-sm mt-2"></p>}

      <div className="content-card">
        {renderActiveSection()}

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
              disabled={
                !formData.declarationConsent?.accuracy ||
                !formData.declarationConsent?.dataProcessing ||
                !formData.declarationConsent?.termsConditions
              }
              className="btn btn-primary"
            >
              Submit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  )
}