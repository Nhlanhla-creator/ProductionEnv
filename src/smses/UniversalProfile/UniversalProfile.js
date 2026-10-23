import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle, ChevronRight, ChevronLeft, Save, X, ArrowRight, Users } from "lucide-react"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "../../firebaseConfig"
import "./UniversalProfile.css"
import Instructions from "./instructions"
import EntityOverview from "./entity-overview"
import BrandAssets from "./brand-assets"
import OwnershipManagement from "./ownership-management"
import ContactDetails from "./contact-details"
import LegalCompliance from "./legal-compliance"
import Governance from "./governance"
import FinancialOverview from "./FinancialOverview"
import OperationsOverview from "./OperationsOverview"
import ProductsServices from "./products-services"
import Documents from "./Documents"
import DeclarationConsent from "./declaration-consent"
import ProfileSummary from "./ProfileSummary"
import { onAuthStateChanged } from "firebase/auth"
import { getFunctions, httpsCallable } from "firebase/functions";
import { useOnboardingVetting } from "../../hooks/useOnboardingVetting";
import { useVerificationNudges } from "../../hooks/useVerificationNudges";
import { ROLE_PERMISSIONS, resolveProfileContext } from "../../utils/profile-context";
import ProfileScopeSwitcher from "../../utils/ProfileScopeSwitcher";
import { checkIsNGO } from "./ngoTaxonomy";

export const getProfileSections = (isNGO = false) => [
  { id: "instructions", label: "Instructions" },
  { id: "entityOverview", label: "Entity\nOverview" },
  { id: "brandAssets", label: isNGO ? "Organisation\nAssets" : "Brand\nAssets" },
  { id: "productsServices", label: isNGO ? "Programmes &\nServices" : "Products &\nServices" },
  { id: "ownershipManagement", label: isNGO ? "Leadership &\nManagement" : "Ownership &\nManagement" },
  { id: "legalCompliance", label: "Legal &\nCompliance" },
  { id: "operationsOverview", label: "Operations\nOverview" },
  { id: "financialOverview", label: "Financial\nOverview" },
  { id: "governance", label: isNGO ? "ESG\nReadiness" : "ESG\nOverview" },
  { id: "contactDetails", label: "Contact\nDetails" },
  { id: "documents", label: "Document\nUpload" },
  { id: "declarationConsent", label: "Declaration &\nConsent" },
]

const sectionValidations = {
  instructions: () => true,
  entityOverview: (data) => {
    const isNgoData = data.entityType === "NGO" || data.entityType === "NGO / Non-profit organisation" || ["NPC", "Trust", "Voluntary association", "Foreign non-profit entity"].includes(data.legalStructure)
    if (isNgoData) {
      return Boolean(
        data.registeredName &&
        data.registrationNumber &&
        data.legalStructure &&
        data.entitySize &&
        data.mission
      )
    }
    return Boolean(
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
  brandAssets: () => true,
  ownershipManagement: () => true,
  contactDetails: (data) => {
    const requiredFields = [data.contactTitle, data.contactName, data.position, data.businessPhone, data.mobile, data.email, data.physicalAddress]
    const hasAllRequired = requiredFields.every((f) => typeof f === "string" && f.trim() !== "")
    const postalAddressValid = data.sameAsPhysical || (typeof data.postalAddress === "string" && data.postalAddress.trim() !== "")
    return hasAllRequired && postalAddressValid
  },
  legalCompliance: () => true,
  operationsOverview: (data) => (
    data.multipleSuppliers !== undefined && data.multipleSuppliers !== "" &&
    data.contingencyPlan !== undefined && data.contingencyPlan !== "" &&
    data.trackPerformanceMetrics !== undefined && data.trackPerformanceMetrics !== "" &&
    data.threeSuccessfulDeliveries !== undefined && data.threeSuccessfulDeliveries !== "" &&
    data.hasCapacityToIncrease !== undefined && data.hasCapacityToIncrease !== "" &&
    data.hasFormalProcedures !== undefined && data.hasFormalProcedures !== "" &&
    data.hasMajorIncidents !== undefined && data.hasMajorIncidents !== ""
  ),
  financialOverview: () => true,
  governance: () => true,
  productsServices: () => true,
  documents: () => true,
  declarationConsent: (data) => Boolean(data?.accuracy && data?.dataProcessing && data?.termsConditions),
}

const validateAllSections = (formData, completedSections, isNGO = false) => {
  const sectionList = getProfileSections(isNGO)
  const sectionStatus = {}
  let allValid = true
  sectionList.forEach((section) => {
    const sectionId = section.id
    const isValid = sectionValidations[sectionId](formData[sectionId] || {})
    sectionStatus[sectionId] = { valid: isValid, completed: completedSections[sectionId], name: section.label }
    if (!isValid || !completedSections[sectionId]) allValid = false
  })
  return { allValid, sectionStatus }
}

// ── Role helpers ─────────────────────────────────────────────────────────────
// The role coming back from profile-context (or stored on the user doc) is normalised here,
// so an unexpected value ("admin", "Owner", "facilitator", undefined) can never lock a user out.
const ALL_SECTION_IDS = getProfileSections(false).map((s) => s.id)
const FALLBACK_ROLE_PERMISSIONS = {
  owner: { canEditAll: true, sections: ALL_SECTION_IDS },
  companyadmin: { canEditAll: false, sections: ["entityOverview", "brandAssets", "contactDetails", "legalCompliance", "operationsOverview", "financialOverview", "governance", "productsServices", "documents"] },
  manager: { canEditAll: false, sections: ["contactDetails", "productsServices", "operationsOverview", "documents"] },
  employee: { canEditAll: false, sections: ["contactDetails", "documents"] },
  viewer: { canEditAll: false, sections: [] },
}
const ROLE_ALIASES = {
  owner: "owner", facilitator: "owner", cmf: "owner",
  companyadmin: "companyadmin", company_admin: "companyadmin", "company admin": "companyadmin", admin: "companyadmin",
  manager: "manager", employee: "employee", viewer: "viewer",
}
const normalizeRole = (role) => (typeof role === "string" ? ROLE_ALIASES[role.trim().toLowerCase()] || null : null)
const getRolePermissions = (role) => {
  const r = normalizeRole(role)
  if (!r) return null
  const imported = ROLE_PERMISSIONS && ROLE_PERMISSIONS[r]
  const usable = imported && (imported.canEditAll === true || Array.isArray(imported.sections))
  return usable ? imported : FALLBACK_ROLE_PERMISSIONS[r]
}

const readDeepLinkSection = () => {
  if (typeof window === "undefined") return null
  const requested = new URLSearchParams(window.location.search).get("section")
  return getProfileSections(false).some((s) => s.id === requested) ? requested : null
}

const onboardingSteps = [
  { title: "Welcome to Universal Profile", content: "This profile will help us understand your business better and provide you with tailored services." },
  { title: "Step 1: Read Instructions", content: "Start by reading the instructions carefully to understand what information you'll need to provide." },
  { title: "Step 2: Fill in Your Details", content: "Complete each section with accurate information about your business entity, ownership, and operations." },
  { title: "Step 3: Upload Documents", content: "Upload all required documents in the Document Upload section. We accept PDF, Word, Excel, and image files." },
  { title: "Step 4: Review & Submit", content: "Review your information in the summary page and submit when you're ready. You can always edit later." },
]

export default function UniversalProfile() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const [profileSubmitted, setProfileSubmitted] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [isCompanyMember, setIsCompanyMember] = useState(false)
  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [companyName, setCompanyName] = useState("")
  const [editPermissions, setEditPermissions] = useState({})
  const [editHistory, setEditHistory] = useState([])
  const { notifyVettingStatusUpdate } = useOnboardingVetting(auth.currentUser);
  const { notifyApplicationDraftSaved } = useVerificationNudges(auth.currentUser);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0)
  const [deepLinkSection] = useState(readDeepLinkSection)
  const [activeSection, setActiveSection] = useState(deepLinkSection || "instructions")
  const [showSummary, setShowSummary] = useState(false)
  const [isEditing, setIsEditing] = useState(!!deepLinkSection)
  const [authUser, setAuthUser] = useState(null)

  const isDevMode = typeof window !== "undefined" && (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  )

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.search.includes("ngo=true")) {
        sessionStorage.setItem("ngoDevMode", "true")
        sessionStorage.setItem("devMode", "true")
      } else if (window.location.search.includes("ngo=false")) {
        sessionStorage.setItem("ngoDevMode", "false")
      }
    }
  }, [])

  const toggleNgoMode = () => {
    const nextNgo = !isNGO
    sessionStorage.setItem("ngoDevMode", nextNgo.toString())
    sessionStorage.setItem("devMode", "true")
    setFormData((prev) => ({
      ...prev,
      entityOverview: {
        ...prev.entityOverview,
        entityType: nextNgo ? "NGO" : "SME",
        legalStructure: nextNgo ? "NPC" : "(pty) Ltd",
      },
    }))
  }
  const canEditSection = (sectionId) => {
    if (normalizeRole(userRole) === "owner") return true
    const permissions = getRolePermissions(userRole)
    if (!permissions) return false
    return permissions.canEditAll === true || (Array.isArray(permissions.sections) && permissions.sections.includes(sectionId))
  }

  const [completedSections, setCompletedSections] = useState({
    instructions: true, entityOverview: false, brandAssets: false, ownershipManagement: false,
    contactDetails: false, legalCompliance: false, operationsOverview: false,
    financialOverview: false, governance: false, productsServices: false,
    documents: false, declarationConsent: false,
  })

  const [validationModal, setValidationModal] = useState({ open: false, title: "", messages: [] })

  const [formData, setFormData] = useState({
    instructions: {},
    entityOverview: {
      registeredName: "", tradingName: "", registrationNumber: "", entityType: "",
      legalStructure: "", entitySize: "", financialYearEnd: "", yearsInOperation: "",
      operationStage: "", economicSectors: [], businessDescription: "",
      operatingCountries: [], operatingProvinces: [],
      memberOfAssociation: "", industryAssociations: [], industryAssociationsOther: "",
    },
    brandAssets: {
      brandsOwned: "", brandsRepresented: "", holdsFranchises: "", holdsAgencies: "",
      companyLogo: "", companyLetterhead: "", orgStructure: "",
      mission: "", focusAreas: [], targetBeneficiaryGroups: [], targetBeneficiaryGroupsOther: "",
      operatingModel: "", geographicReach: "", communitiesServed: "",
      paidStaffCount: "", volunteerCount: "",
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
    contactDetails: { contactTitle: "", contactName: "", position: "", businessPhone: "", mobile: "", email: "", physicalAddress: "", sameAsPhysical: false, postalAddress: "" },
    legalCompliance: {
      taxNumber: "", taxClearancePin: "", payeNumber: "", vatNumber: "",
      uifStatus: "", uifNumber: "", coidaNumber: "", bbbeeLevel: "",
      pendingLegalJudgments: "", pendingLegalJudgmentsDetails: "",
    },
    operationsOverview: {
      outsourcesValueChain: "", outsourcedServices: "", outsourcedValue: "", outsourcedCurrency: "ZAR",
      importExport: "none", importExportValue: "", importExportCurrency: "ZAR",
      operatesOnContract: "", totalContractValue: "", contractCurrency: "ZAR",
      multipleSuppliers: "", contingencyPlan: "", suppliers: [],
      premisesStatus: "", leaseExpiryDate: "", premisesType: "", premisesSize: "",
      hasBranches: "", numberOfBranches: "", branchLocations: "", branchStaff: "",
      industryAccreditations: [], industryAccreditationsOther: "",
      trackPerformanceMetrics: "", threeSuccessfulDeliveries: "", hasCapacityToIncrease: "",
      hasFormalProcedures: "", hasMajorIncidents: "", operationalChallenges: "",
    },
    financialOverview: {
      annualRevenue: "", currentValuation: "", existingDebt: "", incomeCurrency: "ZAR",
      incomeTurnoverCurrent: "", incomeCOGSCurrent: "", incomeGrossProfitCurrent: "",
      incomeOperatingProfitCurrent: "", incomeNetProfitCurrent: "",
      incomeTurnoverPrevious: "", incomeCOGSPrevious: "", incomeGrossProfitPrevious: "",
      incomeOperatingProfitPrevious: "", incomeNetProfitPrevious: "",
      balanceCurrentAssetsCurrent: "", balanceTotalAssetsCurrent: "",
      balanceCurrentLiabilitiesCurrent: "", balanceLongTermLiabilitiesCurrent: "",
      balanceEquityCurrent: "", balanceTotalLiabilitiesCurrent: "",
      balanceCurrentAssetsPrevious: "", balanceTotalAssetsPrevious: "",
      balanceCurrentLiabilitiesPrevious: "", balanceLongTermLiabilitiesPrevious: "",
      balanceEquityPrevious: "", balanceTotalLiabilitiesPrevious: "",
      hasAccountingSoftware: "", accountingSoftwareName: "",
      booksUpToDate: "", booksUpToDateDetails: "",
      hasManagementAccounts: "", latestManagementAccounts: "", managementAccountsDocs: [],
      isInsured: "", insuranceBrokerName: "", insuranceBrokerContact: "", insuranceContactPerson: "",
      hasFinancialStatements: "", financialStatementsYears: [], financialStatementsDocs: [],
      financialsAudited: "", auditedFinancialsDocs: [],
      salesTerms: "", hasOverdraft: "", overdraftValue: "", overdraftUtilised: "",
      directorsSurety: "", debtorsCeded: "", financialYearEnd: "", bonds: "",
      financialChallenges: [], financialChallengesElaboration: "",
      seekingFunding: "", fundraisingHistory: "", supportTypeNeeded: [],
    },
    governance: {
      governanceChecklist: {}, membersHaveMultipleBusinesses: "", conflictOfInterest: [],
      ethicsTrainingFrequency: "", lastEthicsTrainingDate: "",
      strategicClarity: {}, riskManagement: {}, transparencyReporting: {},
      adverseListings: "", adverseListingsDetails: "", courtNotices: "", courtNoticesDetails: "",
    },
    productsServices: {
      offeringType: "", offerings: [], targetMarket: "", keyClients: [], customerTypes: [],
    },
    howDidYouHear: {},
    documents: {
      registrationCertificate: [], certifiedIds: [], shareRegister: [],
      proofOfAddress: [], taxClearanceCert: [], vatCertificate: [],
      bbbeeCert: [], otherCerts: [], industryAccreditationDocs: [],
      companyProfile: [], clientReferences: [],
    },
    brandAssets: {},
    declarationConsent: { accuracy: false, dataProcessing: false, termsConditions: false, authorisedSubmitter: false },
  })

  const isNGO = checkIsNGO(formData, authUser)
  const sections = getProfileSections(isNGO)

  // ── Auth + company membership ──────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user)
      if (user) {
        try {
          const ctx = await resolveProfileContext({ force: true })
          const resolvedRole = normalizeRole(ctx.role) || (ctx.isMember && !ctx.isCmf ? "viewer" : "owner")
          setUserRole(resolvedRole)
          setIsCompanyMember(ctx.isMember)
          setEffectiveUserId(ctx.profileId)
          setCompanyName(ctx.companyName || "")
          setEditPermissions(getRolePermissions(resolvedRole) || FALLBACK_ROLE_PERMISSIONS.viewer)
          if (!ctx.isCmf && !ctx.isMember) {
            const savedData = localStorage.getItem(getUserSpecificKey("universalProfileData"))
            const savedCompleted = localStorage.getItem(getUserSpecificKey("universalProfileCompletedSections"))
            const savedStatus = localStorage.getItem(getUserSpecificKey("profileSubmitted"))
            const hasSeenWelcome = localStorage.getItem(getUserSpecificKey("hasSeenWelcomePopup")) === "true"
            if (savedData) {
              const parsed = JSON.parse(savedData)
              setFormData((prev) => {
                const merged = { ...prev }
                Object.keys(parsed).forEach((k) => {
                  merged[k] = prev[k] && typeof prev[k] === "object" && !Array.isArray(prev[k]) ? { ...prev[k], ...parsed[k] } : parsed[k]
                })
                return merged
              })
            }
            if (savedCompleted) setCompletedSections((prev) => ({ ...prev, ...JSON.parse(savedCompleted), instructions: true }))
            if (savedStatus === "true") { setProfileSubmitted(true); if (!deepLinkSection) setShowSummary(true) }
            if (!hasSeenWelcome) { setShowWelcomePopup(true); localStorage.setItem(getUserSpecificKey("hasSeenWelcomePopup"), "true") }
          }
        } catch (error) {
          console.error("Error checking company membership:", error)
          setEffectiveUserId(user.uid); setUserRole("owner"); setEditPermissions(getRolePermissions("owner"))
        }
      } else {
        if (isDevMode) {
          setUserRole("owner")
          setEditPermissions(getRolePermissions("owner") || FALLBACK_ROLE_PERMISSIONS.owner)
          setEffectiveUserId("dev-mock-ngo-user")
        } else {
          navigate("/login")
        }
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!deepLinkSection) return
    window.scrollTo(0, 0)
    window.history.replaceState({}, "", window.location.pathname)
  }, [deepLinkSection])

  const getUserSpecificKey = (baseKey) => {
    const userId = effectiveUserId || auth.currentUser?.uid
    return userId ? `${baseKey}_${userId}` : baseKey
  }

  useEffect(() => {
    const isCmfView = sessionStorage.getItem("viewOrigin") === "cmf" && sessionStorage.getItem("viewingSMEId")
    if (isCmfView) return
    if (isCompanyMember) return
    const userId = auth.currentUser?.uid; if (!userId) return
    localStorage.setItem(getUserSpecificKey("universalProfileData"), JSON.stringify(formData))
    localStorage.setItem(getUserSpecificKey("universalProfileCompletedSections"), JSON.stringify(completedSections))
    localStorage.setItem(getUserSpecificKey("profileSubmitted"), profileSubmitted.toString())
  }, [formData, completedSections, profileSubmitted, isCompanyMember])

  const updateFormData = (section, data) => setFormData((prev) => ({ ...prev, [section]: { ...prev[section], ...data } }))

  const markSectionAsCompleted = (section) => {
    const updated = { ...completedSections, [section]: true }
    setCompletedSections(updated)
    const userId = effectiveUserId || auth.currentUser?.uid
    if (userId) {
      const isCmfView = sessionStorage.getItem("viewOrigin") === "cmf" && sessionStorage.getItem("viewingSMEId")
      if (!isCmfView) localStorage.setItem(getUserSpecificKey("universalProfileCompletedSections"), JSON.stringify(updated))
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
      if (item instanceof File) {
        const fileRef = ref(storage, `universalProfile/${auth.currentUser?.uid}/${pathPrefix}`)
        await uploadBytes(fileRef, item)
        return await getDownloadURL(fileRef)
      } else if (Array.isArray(item)) {
        return await Promise.all(item.map((entry, idx) => uploadRecursive(entry, `${pathPrefix}/${idx}`)))
      } else if (typeof item === "object" && item !== null) {
        const updated = {}
        for (const key in item) updated[key] = await uploadRecursive(item[key], `${pathPrefix}/${key}`)
        return updated
      }
      return item
    }
    return await uploadRecursive(data, section)
  }

  const saveDataToFirebase = async (section = null, isFinalSubmit = false, completedSectionsToSave = completedSections) => {
    setLoading(true)
    const userId = effectiveUserId || auth.currentUser?.uid
    const currentUser = auth.currentUser
    if (!userId) { setLoading(false); throw new Error("User not logged in.") }
    if (section && !canEditSection(section)) {
      alert(`You don't have permission to edit the ${sections.find((s) => s.id === section)?.label.replace(/\n/g, " ")} section.`)
      setLoading(false); return
    }
    const docRef = doc(db, "universalProfiles", userId)
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
      ...uploaded,
      completedSections: isFinalSubmit ? { ...completedSectionsToSave, declarationConsent: true } : completedSectionsToSave,
      lastEditedBy: currentUser.uid, lastEditedByName: userName,
      lastEditedAt: new Date().toISOString(), lastEditedByRole: userRole,
      editHistory: [...existingHistory, editLogEntry],
    }

    const triggerPayload = {}
    if (section) {
      if (["contactDetails", "entityOverview", "productsServices"].includes(section)) triggerPayload.triggerLegitimacyEvaluation = true
      if (["financialOverview"].includes(section)) triggerPayload.triggerFundabilityEvaluation = true
      if (["operationsOverview", "entityOverview"].includes(section)) triggerPayload.triggerOperationalEvaluation = true
      if (["ownershipManagement"].includes(section)) triggerPayload.triggerLeadershipEvaluation = true
      if (["governance", "ownershipManagement"].includes(section)) triggerPayload.triggerGovernanceEvaluation = true
      if (section === "documents") { triggerPayload.triggerLegitimacyEvaluation = true; triggerPayload.triggerFundabilityEvaluation = true }
      if (section === "legalCompliance") { triggerPayload.triggerLegitimacyEvaluation = true; triggerPayload.triggerGovernanceEvaluation = true }
    }
    await setDoc(docRef, { ...triggerPayload, ...dataToSave }, { merge: true })
    setEditHistory([...existingHistory, editLogEntry])
    setLoading(false)
  }

  const handleSaveSection = async () => {
    await saveDataToFirebase(activeSection);
    try {
      const totalSecs = sections.length
      const completedCount = Object.values(completedSections).filter(Boolean).length
      const completionPct = Math.round((completedCount / totalSecs) * 100)
      const companyName = formData.entityOverview?.registeredName || "there"
      notifyApplicationDraftSaved({
        companyName, completionPercentage: completionPct,
        lastEditedSection: sections.find((s) => s.id === activeSection)?.label.replace(/\n/g, " ") || activeSection,
        resumeUrl: window.location.href,
      }).catch((err) => console.error("Draft saved notification error:", err))
    } catch (nudgeErr) { console.warn("Could not dispatch draft saved nudge:", nudgeErr) }
    alert("Section saved!")
  }

  const handleSaveAndContinue = async () => {
    const sectionData = formData[activeSection] || {}
    const isValid = sectionValidations[activeSection]?.(sectionData)
    if (!isValid) {
      const errors = []
      if (activeSection === "entityOverview") errors.push("Entity Overview is incomplete.")
      else if (activeSection === "contactDetails") errors.push("Contact Details is incomplete.")
      else if (activeSection === "operationsOverview") errors.push("Operations Overview is incomplete.")
      else errors.push(`${sections.find((s) => s.id === activeSection)?.label.replace(/\n/g, " ")} is incomplete.`)
      if (activeSection !== "instructions") setValidationModal({ open: true, title: "Please review:", messages: errors })
      return
    }
    const updated = markSectionAsCompleted(activeSection)
    await saveDataToFirebase(activeSection, false, updated)
    navigateToNextSection()
  }

  const sendConsentConfirmationEmail = async (userEmail, smeName) => {
    try {
      const functions = getFunctions()
      const sendConsentConfirmation = httpsCallable(functions, 'sendConsentConfirmation')
      await sendConsentConfirmation({ userId: auth.currentUser?.uid, email: userEmail, name: smeName })
    } catch (error) { console.error("Failed to send consent email:", error) }
  }

  const handleSubmitProfile = async () => {
    const completedWithDeclaration = { ...completedSections, declarationConsent: true }
    const { allValid, sectionStatus } = validateAllSections(formData, completedWithDeclaration, isNGO)
    if (!allValid) {
      const issues = Object.entries(sectionStatus).filter(([_, s]) => !s.valid || !s.completed).map(([_, s]) => `❌ ${s.name.replace(/\n/g, " ")} is incomplete or invalid.`)
      alert("Profile submission blocked:\n\n" + issues.join("\n"))
      return
    }
    try {
      const updated = markSectionAsCompleted("declarationConsent")
      await saveDataToFirebase(null, true, updated)
      const userEmail = formData.contactDetails?.email
      const smeName = formData.entityOverview?.registeredName || "there"
      if (userEmail) await sendConsentConfirmationEmail(userEmail, smeName)
      notifyVettingStatusUpdate({ companyName: smeName, vettingStage: "queued", estimatedDaysRemaining: 3, analystNotes: "Universal Profile submitted." }).catch((err) => console.error("Vetting status dispatch error:", err))
      setProfileSubmitted(true)
      const hasSeenCongrats = localStorage.getItem(getUserSpecificKey("hasSeenCongratulationsPopup")) === "true"
      if (!hasSeenCongrats) { setShowCongratulationsPopup(true); localStorage.setItem(getUserSpecificKey("hasSeenCongratulationsPopup"), "true") }
      else setShowSummary(true)
      setIsEditing(false)
      window.scrollTo(0, 0)
    } catch (err) { console.error("Failed to submit profile:", err); alert("Failed to submit profile. Please try again."); setProfileSubmitted(false) }
  }

  const handleRegistrationComplete = async () => { alert("Your profile has been successfully submitted!"); navigate("/dashboard") }
  const handleNextOnboardingStep = () => { if (currentOnboardingStep < onboardingSteps.length - 1) setCurrentOnboardingStep(currentOnboardingStep + 1); else setShowWelcomePopup(false) }
  const handleCloseWelcomePopup = () => setShowWelcomePopup(false)
  const handleCloseCongratulationsPopup = () => { setShowCongratulationsPopup(false); setShowSummary(true); window.scrollTo(0, 0) }
  const handleNavigateToFunding = () => navigate("/applications/funding")

  const renderActiveSection = () => {
    const sectionData = formData[activeSection] || {}
    const commonProps = {
      data: sectionData,
      updateData: (data) => updateFormData(activeSection, data),
      isNGO,
      allFormData: formData,
    }
    switch (activeSection) {
      case "instructions":
        return <Instructions isNGO={isNGO} />
      case "entityOverview":
        return <EntityOverview {...commonProps} />
      case "brandAssets":
        return <BrandAssets {...commonProps} isNGO={isNGO} />
      case "ownershipManagement":
        return <OwnershipManagement {...commonProps} />
      case "contactDetails":
        return <ContactDetails {...commonProps} />
      case "legalCompliance":
        return <LegalCompliance {...commonProps} />
      case "operationsOverview":
        return <OperationsOverview {...commonProps} economicSectors={formData.entityOverview?.economicSectors || []} />
      case "financialOverview": {
        const updateFinancial = (sectionOrPatch, maybePatch) => {
          if (typeof sectionOrPatch === "string") return updateFormData(sectionOrPatch, maybePatch)
          return updateFormData("financialOverview", sectionOrPatch)
        }
        return (
          <FinancialOverview
            data={formData.financialOverview || {}}
            updateData={updateFinancial}
            isNGO={isNGO}
            allFormData={formData}
          />
        )
      }
      case "governance":
        return (
          <Governance
            data={formData.governance || {}}
            updateData={(section, data) => updateFormData(section, data)}
            isNGO={isNGO}
            allFormData={formData}
          />
        )
      case "productsServices":
        return <ProductsServices {...commonProps} />
      case "documents":
        return <Documents {...commonProps} />
      case "declarationConsent":
        return (
          <DeclarationConsent
            {...commonProps}
            allFormData={formData}
            howDidYouHearData={formData.howDidYouHear || {}}
            onHowDidYouHearUpdate={(data) => updateFormData("howDidYouHear", data)}
            onComplete={handleRegistrationComplete}
          />
        )
      default:
        return <Instructions isNGO={isNGO} />
    }
  }

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true); if (!effectiveUserId) return
        if (effectiveUserId === "dev-mock-ngo-user") {
          setLoading(false)
          return
        }
        const docRef = doc(db, "universalProfiles", effectiveUserId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setProfileData(data)
          if (data.completedSections) {
            setCompletedSections((prev) => ({ ...prev, instructions: true, ...data.completedSections }))
            localStorage.setItem(getUserSpecificKey("universalProfileCompletedSections"), JSON.stringify(data.completedSections))
          }
          setFormData((prev) => {
            const merged = { ...prev }
            Object.keys(data).forEach((key) => {
              if (merged[key] && typeof merged[key] === 'object' && !Array.isArray(merged[key])) {
                merged[key] = { ...merged[key], ...data[key] }
              } else {
                merged[key] = data[key]
              }
            })
            if (data.entityOverview) {
              const { brandsOwned, brandsRepresented, holdsFranchises, holdsAgencies, companyLogo, companyLetterhead, orgStructure } = data.entityOverview
              if (brandsOwned || brandsRepresented || holdsFranchises || holdsAgencies || companyLogo || companyLetterhead || orgStructure) {
                merged.brandAssets = {
                  ...merged.brandAssets,
                  brandsOwned: brandsOwned || merged.brandAssets?.brandsOwned || "",
                  brandsRepresented: brandsRepresented || merged.brandAssets?.brandsRepresented || "",
                  holdsFranchises: holdsFranchises || merged.brandAssets?.holdsFranchises || "",
                  holdsAgencies: holdsAgencies || merged.brandAssets?.holdsAgencies || "",
                  companyLogo: companyLogo || merged.brandAssets?.companyLogo || "",
                  companyLetterhead: companyLetterhead || merged.brandAssets?.companyLetterhead || "",
                  orgStructure: orgStructure || merged.brandAssets?.orgStructure || "",
                }
              }
            }
            return merged
          })
          const isComplete = data?.declarationConsent?.accuracy && data?.declarationConsent?.dataProcessing && data?.declarationConsent?.termsConditions
          if (isComplete && !isEditing) { setProfileSubmitted(true); setShowSummary(true) }
        } else {
          if (isCompanyMember) setError("Company profile not found. Please contact the company owner.")
          else setError("No profile found. Please complete your Universal Profile first.")
        }
      } catch (err) { console.error("Error fetching profile data:", err); setError("Failed to load profile data.") }
      finally { setLoading(false) }
    }
    if (effectiveUserId) fetchProfileData()
  }, [isEditing, effectiveUserId])

  useEffect(() => {
    if (!completedSections.documents) setCompletedSections((prev) => ({ ...prev, documents: true }))
  }, [formData.documents])

  const renderCmfBanner = () => {
    const isCmfView =
      typeof window !== "undefined" &&
      sessionStorage.getItem("viewOrigin") === "cmf" &&
      sessionStorage.getItem("viewingSMEId")
    if (!isCmfView) return null
    const viewingSMEName = sessionStorage.getItem("viewingSMEName") || "Partner"
    return (
      <div
        style={{
          backgroundColor: "#e8f5e9",
          padding: "16px 20px",
          borderRadius: "8px",
          border: "2px solid #4caf50",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px" }}>👁️</span>
          <span style={{ color: "#2e7d32", fontWeight: "600", fontSize: "15px" }}>
            Facilitator View: Managing {viewingSMEName}&apos;s Profile
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem("viewOrigin")
            sessionStorage.removeItem("viewingSMEId")
            sessionStorage.removeItem("viewingSMEName")
            window.location.href = "/cmf/cohorts"
          }}
          style={{
            backgroundColor: "#2e7d32",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
          }}
        >
          Exit Facilitator View
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <div className="loading-message">Preparing next step...</div>
      </div>
    )
  }

  if (showSummary && !isEditing) {
    return (
      <div className="universal-profile-container">
        {renderCmfBanner()}
        <ProfileSummary data={profileData || formData} onEdit={handleEditProfile} isNGO={isNGO} />
      </div>
    )
  }

  const sectionEditable = canEditSection(activeSection)

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
              <div className="popup-progress">{onboardingSteps.map((_, i) => <div key={i} className={`progress-dot ${i === currentOnboardingStep ? "active" : ""}`} />)}</div>
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
              <p>You've successfully completed your Universal Profile!</p>
              <div className="popup-buttons-group">
                <button className="btn btn-secondary" onClick={handleCloseCongratulationsPopup}>View Summary</button>
                <button className="btn btn-primary" onClick={handleNavigateToFunding}>Go to Funding Application</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
        <h1 style={{ margin: 0 }}>
          {isCompanyMember
            ? `${companyName || "Company"} – Universal Profile`
            : isNGO
            ? "My NGO Profile"
            : "My Universal Profile"}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <ProfileScopeSwitcher />
          {isDevMode && (
            <button
              type="button"
              id="dev-ngo-toggle-btn"
              onClick={toggleNgoMode}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                background: isNGO ? "linear-gradient(135deg, #7d5a50, #4a352f)" : "#ffffff",
                color: isNGO ? "#faf7f2" : "#7d5a50",
                border: "1px solid #7d5a50",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(74, 53, 47, 0.15)",
                transition: "all 0.2s ease",
              }}
            >
              {isNGO ? "🤝 Mode: NGO (Click for SME)" : "🏢 Mode: Commercial SME (Click for NGO)"}
            </button>
          )}
        </div>
        {(profileData?.is_verified || profileData?.scoreState?.is_verified || profileData?.status === "approved") && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "#fef9c3",
            border: "1.5px solid #eab308",
            padding: "0.4rem 0.9rem",
            borderRadius: "9999px",
            color: "#854d0e",
            fontWeight: "600",
            fontSize: "0.9rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
          }}>
            <span>🏅</span>
            <span>BIG Score Verified</span>
          </div>
        )}
      </div>

      <div className="profile-tracker">
        {isCompanyMember && (
          <div style={{ backgroundColor: userRole === "viewer" ? "#fef3c7" : "#e0f2fe", border: `1px solid ${userRole === "viewer" ? "#f59e0b" : "#0369a1"}`, borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Users size={20} color={userRole === "viewer" ? "#f59e0b" : "#0369a1"} />
              <p style={{ margin: 0, color: userRole === "viewer" ? "#f59e0b" : "#0369a1", fontWeight: "600" }}>Company Member - Role: {userRole?.toUpperCase()}</p>
            </div>
          </div>
        )}
        <div className="profile-tracker-inner">
          {sections.map((section) => (
            <button key={section.id} onClick={() => { if (section.id === "documents") window.location.href = "/my-documents"; else setActiveSection(section.id) }}
              className={`profile-tracker-button ${activeSection === section.id ? "active" : completedSections[section.id] ? "completed" : "pending"}`}>
              {(section.label || "").split("\n").map((line, i) => <span key={i} className="tracker-label-line">{line}</span>)}
              {completedSections[section.id] && <CheckCircle className="check-icon" />}
            </button>
          ))}
        </div>
      </div>

      <div className="content-card">
        {!sectionEditable && activeSection !== "instructions" && (
          <div style={{ backgroundColor: "#fef3c7", border: "1px solid #f59e0b", color: "#92400e", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
            View only – your role ({userRole}) can't edit this section.
          </div>
        )}
        {sectionEditable ? renderActiveSection() : (
          <fieldset disabled style={{ border: 0, padding: 0, margin: 0, minWidth: 0, pointerEvents: "none", opacity: 0.85 }}>
            {renderActiveSection()}
          </fieldset>
        )}
        <div className="action-buttons">
          {activeSection !== "instructions" && (<button type="button" onClick={navigateToPreviousSection} className="btn btn-secondary"><ChevronLeft size={16} /> Previous</button>)}
          {sectionEditable && (<button type="button" onClick={handleSaveSection} className="btn btn-secondary"><Save size={16} /> Save</button>)}
          {activeSection !== "declarationConsent" ? (
            sectionEditable
              ? <button type="button" onClick={handleSaveAndContinue} className="btn btn-primary">Save & Continue <ChevronRight size={16} /></button>
              : <button type="button" onClick={navigateToNextSection} className="btn btn-primary">Next <ChevronRight size={16} /></button>
          ) : sectionEditable ? (
            <button type="button" onClick={handleSubmitProfile}
              disabled={!formData.declarationConsent?.accuracy || !formData.declarationConsent?.dataProcessing || !formData.declarationConsent?.termsConditions || (isNGO && !formData.declarationConsent?.authorisedSubmitter)}
              className="btn btn-primary">Submit Profile</button>
          ) : null}
        </div>
      </div>
    </div>
  )
}