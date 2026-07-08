"use client"

import { useState, useEffect } from "react"
import "./FundingApplication.css"
import { CheckCircle, ChevronRight, ChevronLeft, Save, X, ArrowRight, Eye } from "lucide-react"
import { renderApplicationOverview } from "./ApplicationOverview"
import { renderUseOfFunds } from "./UseOfFunds"
import { renderEnterpriseReadiness } from "./EnterpriseReadiness"

import { renderGuarantees } from "./Gurantees"
import { renderGrowthPotential } from "./GrowthPotential"
import { renderSocialImpact } from "./SocialImpact"
import { renderDocumentUpload } from "./DocumentUpload"
import { renderDeclarationCommitment } from "./DeclarationCommitment"
import ApplicationSummary from "./application-summary"
import AnalysisProgressOverlay from "./AnalysisProgressOverlay"
import { useFundingApplications } from "./hooks/useFundingApplications"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "../../firebaseConfig"
import { useNavigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, getDocs, addDoc } from "firebase/firestore"
import { evaluateProfile } from "../../utils/profileEvaluator"
import API_KEYS from "../../API"

// Updated sections array with Guarantees
const maxScores = {
  leadership: 15,
  operationalStrength: 15,
  governance: 15,
  guarantees: 10,
  impact: 10,
  financialReadiness: 5,
  financialStrength: 5,
}

const sectionsWithGuarantees = [
  { id: "applicationOverview", label: "Application\nOverview" },
  { id: "useOfFunds", label: "Use of\nFunds" },
  { id: "enterpriseReadiness", label: "Enterprise\nReadiness" },

  { id: "guarantees", label: "Guarantees" },
  { id: "growthPotential", label: "Growth\nPotential" },
  { id: "socialImpact", label: "Social\nImpact" },
  { id: "documentUpload", label: "Document\nUpload" },
  { id: "declarationCommitment", label: "Declaration &\nCommitment" },
]

// Onboarding steps for the welcome popup
const onboardingSteps = [
  {
    title: "Welcome to Funding Application",
    content: "This application will help us understand your funding needs and how we can support your business growth.",
    icon: "💰",
  },
  {
    title: "Step 1: Application Overview",
    content: "Start by providing basic information about your funding request and business needs.",
    icon: "📋",
  },
  {
    title: "Step 2: Financial Details",
    content: "Complete each section with accurate information about your financial situation and funding requirements.",
    icon: "📊",
  },
  {
    title: "Step 3: Upload Documents",
    content: "Upload all required financial documents including budgets, bank confirmations, and financial statements.",
    icon: "📄",
  },
  {
    title: "Step 4: Submit & Review",
    content: "Review your information in the summary page and submit when you're ready. You can always edit later.",
    icon: "✅",
  },
]

const documentsList = [
  {
    id: "budgetDocuments",
    label: "5 Year Budget (Income Statement, Cashflows, Balance Sheet)",
    accept: ".pdf,.xlsx,.xls,.doc,.docx",
    required: true,
    multiple: false,
    description: "Comprehensive 5-year financial projections including income statement, cash flows, and balance sheet",
  },
  {
    id: "bankConfirmation",
    label: "Bank Details Confirmation Letter",
    accept: ".pdf,.jpg,.jpeg,.png",
    required: true,
    multiple: false,
    description: "Official letter from your bank confirming account details",
  },
  {
    id: "financialStatements",
    label: "Financial Statements",
    accept: ".pdf,.xlsx,.xls,.csv",
    required: true,
    multiple: false,
    description: "Current financial statements and records",
  },
  {
    id: "programReports",
    label: "Previous Program Reports",
    accept: ".pdf,.doc,.docx",
    required: false,
    multiple: false,
    description: "Reports from previous programs or initiatives (if applicable)",
  },
  {
    id: "loanAgreements",
    label: "Loan Agreements",
    accept: ".pdf,.doc,.docx",
    required: false,
    multiple: false,
    description: "Existing loan agreements or debt instruments (if applicable)",
  },
  {
    id: "supportLetters",
    label: "Support Letters / Endorsements",
    accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
    required: false,
    multiple: true,
    description: "Letters of support or endorsements from partners, clients, or stakeholders",
  },
  {
    id: "impactStatement",
    label: "Optional Impact Statement",
    accept: ".pdf,.doc,.docx",
    required: false,
    multiple: false,
    description: "Free-text or uploaded impact statement document",
  },
]

const FundingApplication = ({
  applicationId = null,
  isNew = false,
  onBack,
  onNavigateToMatches,
  onAnalysisComplete,
}) => {
  const [activeSection, setActiveSection] = useState("applicationOverview")
  const [showSummary, setShowSummary] = useState(false)
  const navigate = useNavigate()
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [validationModal, setValidationModal] = useState({ open: false, title: "", messages: [] })
  const apiKey = API_KEYS.OPENAI;

  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0)
  const [isApiKeyLoading, setIsApiKeyLoading] = useState(true)

  // Use custom hook for form state & actions
  const {
    formData,
    completedSections,
    isLoading,
    isSubmitted: applicationSubmitted,
    setIsSubmitted: setApplicationSubmitted,
    updateFormData,
    saveSectionToFirebase,
    submitApplication,
    currentDocId,
    analysisProgress,
    analysisComplete,
    setCompletedSections,
  } = useFundingApplications({
    applicationId,
    isNew,
    onNavigateToMatches,
  })

  // State for existing documents from universal profile (like Advisory)
  const [existingUniversalDocs, setExistingUniversalDocs] = useState({
    businessPlan: null,
    pitchDeck: null,
    financialStatements: [],
    loading: true
  })

  useEffect(() => {
    if (apiKey != null) {
      setIsApiKeyLoading(false)
    }
  }, [apiKey])

  const getContainerStyles = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    boxSizing: "border-box",
    position: "relative",
  })

  // Fetch existing documents from universal profile
  useEffect(() => {
    const fetchExistingDocuments = async () => {
      const user = auth.currentUser
      if (!user) {
        setExistingUniversalDocs(prev => ({ ...prev, loading: false }))
        return
      }

      try {
        const universalProfileRef = doc(db, "universalProfiles", user.uid)
        const profileSnap = await getDoc(universalProfileRef)

        if (profileSnap.exists()) {
          const profileData = profileSnap.data()
          const documents = profileData.documents || {}

          const businessPlanUrl = documents.businessPlan || null
          const pitchDeckUrl = documents.pitchDeck || null
          
          let financialStatementsUrls = []
          if (documents.financialStatements_multiple && Array.isArray(documents.financialStatements_multiple)) {
            financialStatementsUrls = documents.financialStatements_multiple
              .filter(doc => doc.url && doc.url !== "")
              .map(doc => doc.url)
          }

          setExistingUniversalDocs({
            businessPlan: businessPlanUrl,
            pitchDeck: pitchDeckUrl,
            financialStatements: financialStatementsUrls,
            loading: false
          })
        } else {
          setExistingUniversalDocs(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.error("Error fetching existing documents:", error)
        setExistingUniversalDocs(prev => ({ ...prev, loading: false }))
      }
    }

    fetchExistingDocuments()
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true)
      } else {
        navigate("/login")
      }
      setAuthChecked(true)
    })

    return () => unsubscribe()
  }, [])

  // Helper function to get user-specific localStorage key
  const getUserSpecificKey = (baseKey) => {
    const userId = auth.currentUser?.uid
    return userId ? `${baseKey}_${userId}` : baseKey
  }

  // Show onboarding popup if user hasn't seen it yet
  useEffect(() => {
    if (isLoading) return
    const storageKey = getUserSpecificKey("hasSeenFundingOnboarding")
    const seen = localStorage.getItem(storageKey) === "true"
    if (!seen) {
      setShowWelcomePopup(true)
    }
  }, [isLoading])

  const sectionValidations = {
    applicationOverview: (data) => {
      const requiredFields = ["applicationType", "fundingStage", "urgency", "preferredStartDate"]
      const needsSupportFormat =
        data?.applicationType && ["acceleration", "incubation", "enterprise_development"].includes(data.applicationType)

      if (needsSupportFormat) {
        requiredFields.push("supportFormat")
      }

      const allFieldsValid = requiredFields.every((field) => {
        const value = data?.[field]
        return value !== undefined && value !== null && value !== ""
      })

      return allFieldsValid
    },
    useOfFunds: (data) => {
      if (!data || !Array.isArray(data.fundingItems) || data.fundingItems.length === 0) return false

      const allItemsValid = data.fundingItems.every(
        (item) => item.category?.trim() && item.subArea?.trim() && item.description?.trim() && item.amount?.trim(),
      )
      if (!allItemsValid) return false

      if (!Array.isArray(data.fundingInstruments) || data.fundingInstruments.length === 0) return false
      if (data.fundingInstruments.includes("other") && !data.fundingInstrumentOther?.trim()) return false

      if (!Array.isArray(data.funderTypes) || data.funderTypes.length === 0) return false
      if (data.funderTypes.includes("other") && !data.funderTypeOther?.trim()) return false

      const parse = (val) => Number.parseInt((val || "").replace(/[^\d]/g, "")) || 0
      const requested = parse(data.amountRequested)
      const total = data.fundingItems.reduce((sum, item) => sum + parse(item.amount), 0)
      if (requested !== total || requested <= 0) return false

      if (!data.personalEquity || isNaN(parse(data.personalEquity))) return false

      return true
    },
    enterpriseReadiness: (data) => {
      if (!data) return false

      const requiredRadios = [
        "hasBusinessPlan",
        "hasFinancials",
        "hasPitchDeck",
        "hasMvp",
        "hasTraction",
        "hasGuarantees",
        "hasMentor",
        "hasAdvisors",
        "previousSupport",
        "hasPayingCustomers",
      ]

      for (const field of requiredRadios) {
        if (!data[field]) return false
      }

      if (data.hasBusinessPlan === "yes") {
        if (!Array.isArray(data.businessPlanFile) || data.businessPlanFile.length === 0) return false
      }

      if (data.hasFinancials === "yes") {
        if (!Array.isArray(data.financialsFile) || data.financialsFile.length === 0) return false
        if (!data.financialsPeriod?.trim()) return false
      }

      if (data.hasPitchDeck === "yes") {
        if (!Array.isArray(data.pitchDeckFile) || data.pitchDeckFile.length === 0) return false
      }

      if (data.hasMvp === "yes" && !data.mvpDetails?.trim()) return false
      if (data.hasTraction === "yes" && !data.tractionDetails?.trim()) return false

      if (data.hasGuarantees === "yes") {
        if (!Array.isArray(data.guaranteeFile) || data.guaranteeFile.length === 0) return false
      }

      if (data.hasMentor === "yes" && !data.mentorDetails?.trim()) return false

      if (data.hasAdvisors === "yes") {
        if (!data.advisorsDetails?.trim()) return false
        if (!data.advisorsMeetRegularly) return false
        if (data.advisorsMeetRegularly === "yes" && !data.advisorsMeetingFrequency?.trim()) return false
      }

      if ((data.barriers || []).includes("other") && !data.otherBarrierDetails?.trim()) return false

      if (data.previousSupport === "yes") {
        if (!data.previousSupportDetails?.trim() || !data.previousSupportSource?.trim()) return false
      }

      if (data.hasPayingCustomers === "yes" && !data.payingCustomersDetails?.trim()) return false

      return true
    },
    financialOverview: (data) => {
      const requiredFields = ["generatesRevenue", "profitabilityStatus", "hasAccountingSoftware"]
      const basicFieldsValid = requiredFields.every((field) => {
        const value = data[field]
        return value !== undefined && value !== null && value !== ""
      })

      if (!basicFieldsValid) return false

      const conditionalValidations = []
      if (data.generatesRevenue === "yes") {
        conditionalValidations.push(
          data.annualRevenue !== undefined && data.annualRevenue !== null && data.annualRevenue !== "",
        )
      }

      const allConditionalsValid = conditionalValidations.every((validation) => validation === true)
      return basicFieldsValid && allConditionalsValid
    },
    guarantees: (data) => {
      return true
    },
    growthPotential: (data) => {
      const requiredRadioFields = [
        "marketShare",
        "qualityImprovement",
        "greenTech",
        "localisation",
        "regionalSpread",
        "personalRisk",
        "empowerment",
        "employment",
      ]

      const radioFieldsValid = requiredRadioFields.every((field) => data[field] === "yes" || data[field] === "no")
      if (!radioFieldsValid) return false

      const conditionalValidations = []
      if (data.marketShare === "yes") conditionalValidations.push(Boolean(data.marketShareDetails?.trim()))
      if (data.qualityImprovement === "yes") conditionalValidations.push(Boolean(data.qualityImprovementDetails?.trim()))
      if (data.greenTech === "yes") conditionalValidations.push(Boolean(data.greenTechDetails?.trim()))
      if (data.localisation === "yes") conditionalValidations.push(Boolean(data.localisationDetails?.trim()))
      if (data.regionalSpread === "yes") conditionalValidations.push(Boolean(data.regionalSpreadDetails?.trim()))
      if (data.personalRisk === "yes") conditionalValidations.push(Boolean(data.personalRiskDetails?.trim()))
      if (data.empowerment === "yes") conditionalValidations.push(Boolean(data.empowermentDetails?.trim()))

      if (data.employment === "yes") {
        conditionalValidations.push(
          data.employmentIncreaseDirect !== undefined &&
            data.employmentIncreaseDirect !== null &&
            data.employmentIncreaseDirect !== "",
        )
        conditionalValidations.push(
          data.employmentIncreaseIndirect !== undefined &&
            data.employmentIncreaseIndirect !== null &&
            data.employmentIncreaseIndirect !== "",
        )
      }

      const allConditionalsValid = conditionalValidations.every(Boolean)
      return radioFieldsValid && allConditionalsValid
    },
    socialImpact: (data) => {
      const requiredFields = [
        "jobsToCreate",
        "csiCsrSpend",
        "blackOwnership",
        "womenOwnership",
        "youthOwnership",
        "disabledOwnership",
      ]

      const basicFieldsValid = requiredFields.every((field) => {
        const value = data[field]
        return value !== undefined && value !== null && value !== ""
      })

      if (!basicFieldsValid) return false

      const percentageFields = ["blackOwnership", "womenOwnership", "youthOwnership", "disabledOwnership"]
      const percentagesValid = percentageFields.every((field) => {
        const value = Number.parseFloat(data[field])
        return !isNaN(value) && value >= 0 && value <= 100
      })

      const csiCsrValid = data.csiCsrSpend
      return basicFieldsValid && percentagesValid && csiCsrValid
    },
    documentUpload: (data) => {
      const requiredDocuments = documentsList.filter((doc) => doc.required)
      const allRequiredUploaded = requiredDocuments.every((doc) => {
        const files = data[doc.id] || []
        return files.length > 0
      })

      return allRequiredUploaded
    },
    declarationCommitment: (data) => {
      if (!data) return false
      return data.confirmIntent === true && data.commitReporting === true && data.consentShare === true
    },
  }

  const navigateToNextSection = () => {
    const currentIndex = sectionsWithGuarantees.findIndex((section) => section.id === activeSection)
    if (currentIndex < sectionsWithGuarantees.length - 1) {
      setActiveSection(sectionsWithGuarantees[currentIndex + 1].id)
      window.scrollTo(0, 0)
    }
  }

  const navigateToPreviousSection = () => {
    const currentIndex = sectionsWithGuarantees.findIndex((section) => section.id === activeSection)
    if (currentIndex > 0) {
      setActiveSection(sectionsWithGuarantees[currentIndex - 1].id)
      window.scrollTo(0, 0)
    }
  }

  const handleEditApplication = () => {
    setShowSummary(false)
    setApplicationSubmitted(false)
    setActiveSection("applicationOverview")
    window.scrollTo(0, 0)
  }

  const handleNextOnboardingStep = () => {
    if (currentOnboardingStep < onboardingSteps.length - 1) {
      setCurrentOnboardingStep(currentOnboardingStep + 1)
    } else {
      setShowWelcomePopup(false)
      localStorage.setItem(getUserSpecificKey("hasSeenFundingOnboarding"), "true")
    }
  }

  const handleCloseWelcomePopup = () => {
    setShowWelcomePopup(false)
    localStorage.setItem(getUserSpecificKey("hasSeenFundingOnboarding"), "true")
  }

  const handleCloseCongratulationsPopup = () => {
    setShowCongratulationsPopup(false)
    setShowSummary(true)
  }

  const handleNavigateToProductApplication = () => {
    navigate("/applications/product-application")
  }
  const handleNavigateToDashboard = () => {
    navigate("/dashboard")
  }

  const handleViewMatches = () => {
    navigate("/funding-matches")
  }

  const handleSubmitApplication = async () => {
    const allSectionsValid = Object.entries(sectionValidations).every(
      ([key, validate]) => validate(formData[key] || {}) && completedSections[key],
    )

    if (!allSectionsValid) {
      const invalidSections = Object.entries(sectionValidations)
        .filter(([key, validate]) => !validate(formData[key] || {}) || !completedSections[key])
        .map(([key]) => sectionsWithGuarantees.find((s) => s.id === key)?.label.replace(/\n/g, " "))

      setValidationModal({
        open: true,
        title: "Please complete all required sections before submitting:",
        messages: invalidSections,
      })
      return
    }

    try {
      await submitApplication()
      onAnalysisComplete?.(applicationId || currentDocId)

      const hasSeenFundingCongratulationsPopup =
        localStorage.getItem(getUserSpecificKey("hasSeenFundingCongratulationsPopup")) === "true"
      if (!hasSeenFundingCongratulationsPopup) {
        setShowCongratulationsPopup(true)
        localStorage.setItem(getUserSpecificKey("hasSeenFundingCongratulationsPopup"), "true")
      } else {
        setShowSummary(true)
      }

      window.scrollTo(0, 0)
    } catch (err) {
      console.error("Failed to submit application:", err)
      alert("Failed to submit application. Please try again.")
      setApplicationSubmitted(false)
    }
  }

  const renderActiveSection = () => {
    if (activeSection === "enterpriseReadiness") {
      if (isApiKeyLoading) {
        return (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "200px",
              fontSize: "16px",
              color: "#666",
              width: "100%",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div>Loading Enterprise Readiness resources...</div>
            <div style={{ fontSize: "14px", color: "#999" }}>Preparing AI evaluation tools...</div>
          </div>
        )
      }
      if (!apiKey) {
        return (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "200px",
              fontSize: "16px",
              color: "#e74c3c",
              width: "100%",
              flexDirection: "column",
              gap: "15px",
              textAlign: "center",
              padding: "20px",
            }}
          >
            <div>⚠️ API Key Required</div>
            <div style={{ fontSize: "14px", color: "#666", maxWidth: "400px" }}>
              The Enterprise Readiness section requires API access for AI-powered evaluations. Please ensure your API
              configuration is properly set up.
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Retry Loading
            </button>
          </div>
        )
      }
    }
    switch (activeSection) {
      case "applicationOverview":
        return renderApplicationOverview(formData.applicationOverview, updateFormData)
      case "useOfFunds":
        return renderUseOfFunds(formData.useOfFunds, updateFormData)
      case "enterpriseReadiness":
        return renderEnterpriseReadiness(
          formData.enterpriseReadiness, 
          updateFormData, 
          apiKey,
          (response, score, label) => {
            updateFormData("enterpriseReadiness", { 
              aiEvaluation: { response, score, label, timestamp: new Date().toISOString() }
            })
          },
          existingUniversalDocs
        )
      case "guarantees":
        return renderGuarantees(formData.guarantees, updateFormData)
      case "growthPotential":
        return renderGrowthPotential(formData.growthPotential, updateFormData)
      case "socialImpact":
        return renderSocialImpact(formData.socialImpact, updateFormData)
      case "documentUpload":
        return renderDocumentUpload(formData.documentUpload, updateFormData)
      case "declarationCommitment":
        return renderDeclarationCommitment(formData.declarationCommitment, updateFormData)
      default:
        return renderApplicationOverview(formData.applicationOverview, updateFormData)
    }
  }

  const handleSaveSection = async () => {
    try {
      const ok = await saveSectionToFirebase(activeSection, false)
      if (ok) {
        alert("Section saved successfully!")
      } else {
        alert("Failed to save to Firebase.")
      }
    } catch (err) {
      alert("Failed to save to Firebase.")
    }
  }

  const handleSaveAndContinue = async () => {
    const currentIndex = sectionsWithGuarantees.findIndex((s) => s.id === activeSection)
    const nextSection = sectionsWithGuarantees[currentIndex + 1]?.id

    if (!sectionValidations[activeSection](formData[activeSection] || {})) {
      setValidationModal({
        open: true,
        title: "Please review the following:",
        messages: [`${sectionsWithGuarantees.find((s) => s.id === activeSection)?.label.replace(/\n/g, " ")} is incomplete.`],
      })
      return
    }

    const ok = await saveSectionToFirebase(activeSection, true)
    if (ok && nextSection) {
      setActiveSection(nextSection)
      window.scrollTo(0, 0)
    }
  }

  const sendBIGEvaluationMessage = async (userId, userName) => {
    const fetchLatest = async (collectionName) => {
      const q = query(collection(db, collectionName), where("userId", "==", userId))
      const snap = await getDocs(q)
      if (snap.empty) return null

      let latest = null
      snap.forEach((doc) => {
        const data = doc.data()
        if (
          !latest ||
          new Date(data.evaluatedAt || data.createdAt) > new Date(latest.evaluatedAt || latest.createdAt)
        ) {
          latest = data
        }
      })

      return latest
    }

    // Fixed fetchEvaluationData to return data instead of setting state
    const fetchEvaluationData = async () => {
      try {
        // Fetch the document
        const docRef = doc(db, "profileEvaluations", userId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()

          // Extract the breakdown data
          const breakdown = data.breakdown
          const evaluationInfo = {
            // Financial metrics
            financialReadiness: breakdown?.financialReadiness,
            financialStrength: breakdown?.financialStrength,

            // Governance and guarantees
            governance: breakdown?.governance,
            guarantees: breakdown?.guarantees,

            // Impact and leadership
            impact: breakdown?.impact,
            leadership: breakdown?.leadership,

            // Operational strength
            operationalStrength: breakdown?.operationalStrength,

            // Metadata
            evaluatedAt: data.evaluatedAt?.toDate(), // Convert Firestore timestamp
            fundabilityScore: data.fundabilityScore,
            breakdown: breakdown, // Add the full breakdown for use in email
          }

          return evaluationInfo
        } else {
          console.error("No evaluation data found for userId:", userId)
          return null
        }
      } catch (err) {
        console.error("Error fetching evaluation data:", err.message)
        return null
      }
    }

    try {
      // Get all evaluations
      const businessPlan = await fetchLatest("aiEvaluations")
      const pitchDeck = await fetchLatest("aiPitchEvaluations")
      const profileEvaluation = await fetchEvaluationData() // Now properly awaited

      // Calculate combined score with null safety
      const score1 = businessPlan?.evaluation?.score || 0
      const score2 = pitchDeck?.evaluation?.score || 0
      const score3 = profileEvaluation?.fundabilityScore || 0

      // Calculate weighted average (adjust weights as needed)
      const combined = Math.round(score1 * 0.4 + score2 * 0.3 + score3 * 0.3)

      const label =
        combined >= 85
          ? "Investment-Ready"
          : combined >= 65
            ? "Fundable with Support"
            : combined >= 50
              ? "Emerging Potential"
              : "Not Yet Ready"

      const structuredContent = {
        generatedDate: new Date().toISOString(),
        businessPlanScore: score1,
        pitchDeckScore: score2,
        profileEvaluationScore: score3,
        overallScore: combined,
        fundabilityStatus: label,
        summaryRecommendation:
          combined >= 85
            ? "Strong investment readiness."
            : combined >= 65
              ? "Good potential, needs targeted improvement."
              : combined >= 50
                ? "Emerging potential, needs significant development."
                : "Not yet ready for investment.",
        profileEvaluation: {
          ...profileEvaluation,
          breakdown: profileEvaluation?.breakdown || {},
          evaluatedAt: profileEvaluation?.evaluatedAt?.toISOString?.() || null,
        },
        businessPlan: {
          evaluator: businessPlan?.evaluation?.model || "GPT-4",
          date: businessPlan?.evaluation?.date || null,
          confidence: businessPlan?.evaluation?.confidence || null,
          rawContent: businessPlan?.evaluation?.content || null,
        },
        pitchDeck: {
          evaluator: pitchDeck?.evaluation?.model || "GPT-4",
          date: pitchDeck?.evaluation?.date || null,
          confidence: pitchDeck?.evaluation?.confidence || null,
          rawContent: pitchDeck?.evaluation?.content || null,
        },
      }

      // Format profile evaluation for display
      const formatProfileEvaluation = (data) => {
        if (!data?.breakdown) return "No profile evaluation available."

        // If breakdown is a string, format it
        if (typeof data.breakdown === "string") {
          return data.breakdown
            .replace(/^#+\s*/gm, "") // Remove markdown headers
            .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
            .replace(/\*(.*?)\*/g, "$1") // Remove italics
            .replace(/-\s/g, "• ") // Convert dashes to bullets
            .replace(/\n{3,}/g, "\n\n") // Reduce multiple newlines
        }

        // If breakdown is an object, format it nicely
        if (typeof data.breakdown === "object") {
          const categoryLabels = {
            financialReadiness: "Financial Readiness",
            financialStrength: "Financial Strength",
            governance: "Governance",
            guarantees: "Guarantees",
            impact: "Impact",
            leadership: "Leadership",
            operationalStrength: "Operational Strength",
          }

          let formatted = ""
          Object.entries(data.breakdown).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              const label =
                categoryLabels[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
              const score = typeof value === "number" ? `${value}/${maxScores[key] || 10}` : value
              formatted += `**${label}:** ${score}\n`
            }
          })

          if (formatted) {
            formatted += `\n**Overall Profile Score:** ${data.fundabilityScore || 0}/100`
            if (data.evaluatedAt) {
              formatted += `\n**Evaluated:** ${data.evaluatedAt.toLocaleDateString()}`
            }
          }

          return formatted || "Profile evaluation data available but no detailed breakdown."
        }

        return "No profile evaluation available."
      }

      const content = `
Dear ${userName || "Entrepreneur"},

Congratulations on completing your BIG Funding Application!

We've evaluated your submission using our AI-powered Fundability Scorecard system. Here are your results:

🧮 Combined Fundability Score Summary

- Business Plan Score: ${score1}/100  
- Pitch Deck Score: ${score2}/100  
- Profile Evaluation Score: ${score3}/100  
- Weighted Average Score: ${combined}/100  
- Fundability Status: ${label}

📄 Business Plan Evaluation
${businessPlan?.evaluation?.content || "No business plan evaluation available."}

🎯 Pitch Deck Evaluation
${pitchDeck?.evaluation?.content || "No pitch deck evaluation available."}

👤 Profile Evaluation
${formatProfileEvaluation(profileEvaluation)}

📊 What This Means

Based on your combined score of ${combined}/100, we recommend:

${
  combined >= 85
    ? "Your business demonstrates strong investment readiness. You're well positioned for most funding opportunities."
    : combined >= 65
      ? "Your business shows good potential but would benefit from some improvements before seeking major investment."
      : combined >= 50
        ? "Your business has emerging potential but requires significant development before being investment-ready."
        : "Your business needs substantial development before being considered for investment."
}

---

You are now eligible to be matched with aligned funders.  
We encourage you to review the full evaluation feedback to strengthen your readiness further.

Warm regards,  
The BIG Fundability Team
`

      // Send the message
      await addDoc(collection(db, "messages"), {
        from: "BIG Fundability System",
        to: userId,
        toName: userName || "Entrepreneur",
        subject: `Your BIG Fundability Score & Readiness Report (${combined}/100)`,
        content,
        date: new Date().toISOString(),
        type: "inbox",
        read: false,
        metadata: {
          businessPlanScore: score1,
          pitchDeckScore: score2,
          profileScore: score3,
          combinedScore: combined,
          evaluationDate: new Date().toISOString(),
        },
      })

      await addDoc(collection(db, "combinedEvaluations"), {
        userId,
        businessPlanScore: score1,
        pitchDeckScore: score2,
        profileScore: score3,
        combinedScore: combined,
        status: label,
        content, // markdown string
        structuredContent, // clean extractable object
        createdAt: new Date().toISOString(),
      })

      // console.log(`Evaluation message sent successfully to ${userName} (${userId})`)
      return { success: true, combinedScore: combined }
    } catch (error) {
      console.error("Error in sendBIGEvaluationMessage:", error)
      throw error
    }
  }



  if (isLoading && !analysisProgress) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          maxWidth: "100vw",
          overflowX: "hidden",
          padding: "0",
          margin: "0",
          boxSizing: "border-box",
        }}
        className="loading"
      >
        <div className="spinner"></div>
        <div className="loading-message">Preparing next step...</div>
      </div>
    )
  }

  // If application is submitted and we're showing the summary
  if (showSummary) {
    return <ApplicationSummary formData={formData} onEdit={handleEditApplication} onBack={onBack} />
  }

  if (isApiKeyLoading) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          maxWidth: "100vw",
          overflowX: "hidden",
          padding: "20px",
          margin: "0",
          boxSizing: "border-box",
        }}
        className="funding-application-container"
      >
        <div
          className="loading-container"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "200px",
            fontSize: "16px",
            color: "#666",
            width: "100%",
            maxWidth: "100%",
          }}
        >
          Loading application resources...
        </div>
      </div>
    )
  }

  // If application is submitted but user is coming back to edit
  if (applicationSubmitted && !showSummary) {
    // Continue with the form
  }

  return (
    <div style={getContainerStyles()} className="funding-application-container">
      {validationModal.open && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "9999",
            padding: "20px",
            boxSizing: "border-box",
          }}
          className="popup-overlay"
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "20px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "auto",
              position: "relative",
              width: "100%",
              maxWidth: "500px",
            }}
            className="validation-popup"
          >
            <button
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "5px",
              }}
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

      {/* Welcome Popup for first-time users */}
      {showWelcomePopup && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "9999",
            padding: "20px",
            boxSizing: "border-box",
          }}
          className="popup-overlay"
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "20px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "auto",
              position: "relative",
              width: "100%",
              maxWidth: "600px",
            }}
            className="welcome-popup"
          >
            <button
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "5px",
              }}
              className="close-popup"
              onClick={handleCloseWelcomePopup}
            >
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

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: "20px",
                }}
                className="popup-buttons"
              >
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
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "9999",
            padding: "20px",
            boxSizing: "border-box",
          }}
          className="popup-overlay"
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "20px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "auto",
              position: "relative",
              width: "100%",
              maxWidth: "600px",
            }}
            className="congratulations-popup"
          >
            <button
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "5px",
              }}
              className="close-popup"
              onClick={handleCloseCongratulationsPopup}
            >
              <X size={24} />
            </button>
            <div className="popup-content">
              <div className="confetti-animation">🎉</div>
              <h2>Congratulations!</h2>
              <p>You've successfully completed your Funding Application!</p>
              <p>You can now view your application summary or proceed to the Dashboard or view Your matches</p>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: "20px",
                }}
                className="popup-buttons-group"
              >
                <button className="btn btn-secondary" onClick={handleCloseCongratulationsPopup}>
                  View Summary
                </button>
                <button className="btn btn-primary" onClick={handleViewMatches}>
                  View Matches
                </button>
                <button className="btn btn-secondary" onClick={handleNavigateToDashboard}>
                  Go to Big Score
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1
        style={{
          width: "100%",
          textAlign: "center",
          margin: "20px 0",
          fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
          lineHeight: "1.2",
          wordBreak: "break-word",
        }}
      >
        Funding and Support Application
      </h1>

      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          padding: "10px 0",
          margin: "20px 0",
          boxSizing: "border-box",
        }}
        className="profile-tracker"
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            alignItems: "center",
            minWidth: "max-content",
            padding: "0 10px",
            flexWrap: "wrap",
          }}
          className="profile-tracker-inner"
        >
          {sectionsWithGuarantees.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                minWidth: "80px",
                maxWidth: "120px",
                padding: "8px 6px",
                fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)",
                lineHeight: "1.2",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                wordBreak: "break-word",
                hyphens: "auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                minHeight: "60px",
              }}
              className={`profile-tracker-button ${
                activeSection === section.id ? "active" : completedSections[section.id] ? "completed" : "pending"
              }`}
            >
              {section.label.split("\n").map((line, i) => (
                <span key={i} className="tracker-label-line" style={{ display: "block", margin: "1px 0" }}>
                  {line}
                </span>
              ))}
              {completedSections[section.id] && (
                <CheckCircle
                  style={{
                    position: "absolute",
                    top: "2px",
                    right: "2px",
                    width: "16px",
                    height: "16px",
                  }}
                  className="check-icon"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          padding: "20px",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
        className="content-card"
      >
        <div style={{ width: "100%", overflowX: "auto" }}>{renderActiveSection()}</div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "30px",
            padding: "20px 0",
            borderTop: "1px solid #eee",
            flexWrap: "wrap",
            width: "100%",
          }}
          className="action-buttons"
        >
          {activeSection !== "applicationOverview" && (
            <button
              type="button"
              onClick={navigateToPreviousSection}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "10px 15px",
                fontSize: "clamp(0.8rem, 2vw, 1rem)",
                minWidth: "100px",
                justifyContent: "center",
              }}
              className="btn btn-secondary"
            >
              <ChevronLeft size={16} /> Previous
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveSection}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "10px 15px",
              fontSize: "clamp(0.8rem, 2vw, 1rem)",
              minWidth: "100px",
              justifyContent: "center",
            }}
            className="btn btn-secondary"
          >
            <Save size={16} /> Save
          </button>

          {activeSection !== "declarationCommitment" ? (
            <button
              type="button"
              onClick={handleSaveAndContinue}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "10px 15px",
                fontSize: "clamp(0.8rem, 2vw, 1rem)",
                minWidth: "140px",
                justifyContent: "center",
              }}
              className="btn btn-primary"
            >
              Save & Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "10px 15px",
                fontSize: "clamp(0.8rem, 2vw, 1rem)",
                minWidth: "140px",
                justifyContent: "center",
              }}
              className="btn btn-primary"
              onClick={async () => {
                const validation = sectionValidations.declarationCommitment(formData.declarationCommitment)
                if (validation === true) {
                  setCompletedSections((prev) => ({ ...prev, declarationCommitment: true }))

                  const userId = auth.currentUser?.uid
                  if (userId) {
                    await setDoc(
                      doc(db, "universalProfiles", userId),
                      {
                        popupSeen: true,
                      },
                      { merge: true },
                    )
                  }

                  handleSubmitApplication()
                } else {
                  setValidationModal({
                    open: true,
                    title: "Please complete required fields",
                    messages: Array.isArray(validation) ? validation : ["This section is incomplete."],
                  })
                }
              }}
            >
              Submit Application
            </button>
          )}
        </div>
      </div>

      {/* Progress Animation Overlay for AI Matching */}
      <AnalysisProgressOverlay 
        progress={analysisProgress} 
        isComplete={analysisComplete} 
      />
    </div>
  )
}

export default FundingApplication