"use client"

import { useState, useEffect } from "react"
import { CheckCircle, ChevronRight, ChevronLeft, Save, X, ArrowRight } from 'lucide-react'
import styles from "./InvestorUniversalProfile.module.css"

import Instructions from "./Instructions"
import EntityOverview from "./FundManageOverview"
import ContactDetails from "./ContactDetails"
import OwnershipManagement from "./GeneralInvestmentPreference​"
import ProductsServices from "./FundDetails​"
import HowDidYouHear from "./ApplicationBrief​"
import DocumentUpload from "./DocumentUpload"
import DeclarationConsent from "./DeclarationConsent"
import InvestorProfileSummary from "./investor-profile-summary"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "../../firebaseConfig"
import { useNavigate } from "react-router-dom"

import { documentsList } from "./DocumentUpload"

const sections = [
  { id: "instructions", label: "Instructions" },
  { id: "fundManageOverview", label: "Fund Manage\nOverview" },
  { id: "contactDetails", label: "Contact\nDetails" },
  { id: "generalInvestmentPreference", label: "General Investment \nPreferences" },
  { id: "fundDetails", label: "Fund\nDetails" },
  { id: "applicationBrief", label: "Application\nBrief" },
  { id: "documentUpload", label: "Document\nUpload" },
  { id: "declarationConsent", label: "Declaration &\nConsent" },
]

// Section validation functions - Only fundManageOverview and contactDetails have real validations
const sectionValidations = {
  fundManageOverview: (data) => validateFundManageOverview(data).length === 0,
  generalInvestmentPreference: () => true, // Always valid
  contactDetails: (data) => validateContactDetails(data).length === 0,
  fundDetails: () => true, // Always valid
  applicationBrief: () => true, // Always valid
  documentUpload: () => true, // Always valid
  declarationConsent: () => true // Always valid
}

const validateFundManageOverview = (data) => {
  const errors = [];

  if (!data.registeredName?.trim()) {
    errors.push("Registered name is required.");
  }

  if (!data.registrationNumber?.trim()) {
    errors.push("Registration number is required.");
  }

  if (!data.legalEntityType?.trim()) {
    errors.push("Legal entity type is required.");
  }

  if (!data.firmType?.trim()) {
    errors.push("Firm type is required.");
  }

  if (!Array.isArray(data.firmSubtype) || data.firmSubtype.length === 0) {
    errors.push("At least one firm subtype must be selected.");
  }

  if (!data.investorRole?.trim()) {
    errors.push("Investor role is required.");
  }

  if (!data.yearsInOperation || Number(data.yearsInOperation) < 0) {
    errors.push("Years in operation must be a non-negative number.");
  }

  if (!data.numberOfInvestmentExecutives || Number(data.numberOfInvestmentExecutives) < 0) {
    errors.push("Number of investment executives must be a non-negative number.");
  }

  if (!data.briefDescription?.trim()) {
    errors.push("Brief description is required.");
  }

  if (!data.portfolioCompanies?.trim()) {
    errors.push("Portfolio companies field is required.");
  }

  if (!data.numberOfInvestments || Number(data.numberOfInvestments) < 0) {
    errors.push("Number of investments must be a non-negative number.");
  }

  if (!data.valueDeployed?.trim()) {
    errors.push("Value deployed is required.");
  }

  if (!Array.isArray(data.additionalSupport) || data.additionalSupport.length === 0) {
    errors.push("At least one additional support option must be selected.");
  }

  if (!data.howDidYouHear?.trim()) {
    errors.push("How did you hear about us is required.");
  }

  if (data.howDidYouHear === "other" && !data.howDidYouHearOther?.trim()) {
    errors.push("Please specify how you heard about us.");
  }

  return errors;
};

const validateContactDetails = (data) => {
  const errors = [];

  // Business Contact Info
  if (!data.businessTel?.trim()) {
    errors.push("Business Tel is required.");
  }

  if (!data.businessEmail?.trim()) {
    errors.push("Business email is required.");
  }

  if (!data.physicalAddress?.trim()) {
    errors.push("Physical address is required.");
  }

  if (!data.postalAddress?.trim()) {
    errors.push("Postal address is required.");
  }

  // Primary Contact Info
  const requiredPrimary = [
    { key: "primaryContactTitle", label: "Title" },
    { key: "primaryContactName", label: "Name" },
    { key: "primaryContactSurname", label: "Surname" },
    { key: "primaryContactPosition", label: "Position" },
    { key: "primaryContactMobile", label: "Mobile" },
    { key: "primaryContactEmail", label: "Email" },
  ];

  requiredPrimary.forEach(({ key, label }) => {
    if (!data[key] || data[key].toString().trim() === "") {
      errors.push(`Primary contact ${label} is required.`);
    }
  });

  // Optional: Validate secondary contact if partially filled
  const anySecondaryFilled = [
    "secondaryContactTitle",
    "secondaryContactName",
    "secondaryContactSurname",
    "secondaryContactPosition",
    "secondaryContactMobile",
    "secondaryContactEmail",
  ].some((field) => data[field] && data[field].toString().trim() !== "");

  if (anySecondaryFilled) {
    const requiredSecondary = [
      { key: "secondaryContactTitle", label: "Title" },
      { key: "secondaryContactName", label: "Name" },
      { key: "secondaryContactSurname", label: "Surname" },
      { key: "secondaryContactPosition", label: "Position" },
      { key: "secondaryContactMobile", label: "Mobile" },
      { key: "secondaryContactEmail", label: "Email" },
    ];

    requiredSecondary.forEach(({ key, label }) => {
      if (!data[key] || data[key].toString().trim() === "") {
        errors.push(`Secondary contact ${label} is required if adding a secondary contact.`);
      }
    });
  }

  return errors;
};

// Onboarding steps for the welcome popup
const onboardingSteps = [
  {
    title: "Welcome to Investor Universal Profile",
    content: "This profile will help us understand your investment preferences and match you with suitable opportunities.",
    icon: "👋",
  },
  {
    title: "Step 1: Read Instructions",
    content: "Start by reading the instructions carefully to understand what information you'll need to provide.",
    icon: "📝",
  },
  {
    title: "Step 2: Fill in Your Details",
    content: "Complete each section with accurate information about your entity, investment criteria, and preferences.",
    icon: "📋",
  },
  {
    title: "Step 3: Upload Documents",
    content: "Upload all required documents including registration documents, certificates, and fund mandates.",
    icon: "📄",
  },
  {
    title: "Step 4: Review & Submit",
    content: "Review your information in the summary page and submit when you're ready. You can always edit later.",
    icon: "✅",
  },
]

export default function UniversalProfile() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState("instructions")
  const [profileSubmitted, setProfileSubmitted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sectionLoading, setSectionLoading] = useState(false) // New loading state for section transitions
  const [error, setError] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const isProfileComplete = () => {
    return Object.entries(sectionValidations).every(([key, validate]) =>
      validate(formData[key] || {})
    );
  };
  const [validationModal, setValidationModal] = useState({
    open: false,
    title: "",
    messages: []
  });

  // Initialize popup states to false - we'll set them based on user status
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0)

  // Initial data structure for formData
  const [formData, setFormData] = useState({
    instructions: {},
    fundManageOverview: {},
    generalInvestmentPreference: {
      fundStructure: "",
      legalEntityFit: "",
      investmentStage: [], // FIXED: Changed from string to array for multi-select
      investmentFocus: "",
      investmentFocusSubtype: "",
      sectorFocus: [],
      sectorExclusions: [],
      geographicFocus: [],
      selectedProvinces: [],
      selectedCountries: [],
      riskAppetite: ""
    },
    contactDetails: {
      sameAsPhysical: false,
    },
    legalCompliance: {},
    fundDetails: {
  funds: []
    },
   applicationBrief: {
  overviewObjectives: "",
  instructionsForApplying: "",
  estimatedReviewTime: "",
  typicalDealClosingTime: "",
  applicationWindow: "",
  coreDocuments: [],
  coreDocumentsOther: "",
  debtDocuments: [],
  equityDocuments: [],
  otherConditionalDocuments: "",
  evaluationCriteria: "",
  impactAlignment: ""
},
    documentUpload: {},
    declarationConsent: {
      accuracy: false,
      dataProcessing: false,
      termsConditions: false,
    },
  })

  const [completedSections, setCompletedSections] = useState({
    instructions: true,
    fundManageOverview: false,
    generalInvestmentPreference: false,
    contactDetails: false,
    // legalCompliance: false,
    fundDetails: false,
    applicationBrief: false,
    documentUpload: false,
    declarationConsent: false,
  })

  // Helper function to get user-specific localStorage key
  const getUserSpecificKey = (baseKey) => {
    const userId = auth.currentUser?.uid
    return userId ? `${baseKey}_${userId}` : baseKey
  }

  // Function to check if declaration consent is complete
  const checkDeclarationConsent = (data) => {
    const declarationConsent = data?.formData?.declarationConsent || data?.declarationConsent
    if (!declarationConsent) return false

    return (
      declarationConsent.accuracy === true &&
      declarationConsent.dataProcessing === true &&
      declarationConsent.termsConditions === true
    )
  }
  useEffect(() => {
    const requiredDocs = Array.isArray(documentsList)
      ? documentsList.filter(doc => doc.required).map(doc => doc.id)
      : [];

    const uploadedDocs = formData.documentUpload || {};

    const isComplete = requiredDocs.every(docId =>
      Array.isArray(uploadedDocs[docId]) && uploadedDocs[docId].length > 0
    );

    if (isComplete && !completedSections.documentUpload) {
      setCompletedSections(prev => ({ ...prev, documentUpload: true }));
    } else if (!isComplete && completedSections.documentUpload) {
      setCompletedSections(prev => ({ ...prev, documentUpload: false }));
    }
  }, [formData.documentUpload]);



  // Load profile data from Firebase first, then fall back to localStorage
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // First try to fetch from Firebase
        const docRef = doc(db, "MyuniversalProfiles", user.uid)
        const docSnap = await getDoc(docRef)

        let firebaseData = null
        let firebaseCompletedSections = null
        let firebaseSubmissionStatus = false

        if (docSnap.exists()) {
          const data = docSnap.data()
          firebaseData = data.formData
          firebaseCompletedSections = data.completedSections

          // Check if declaration consent is complete in Firebase
          const declarationConsentComplete = checkDeclarationConsent(data)

          // Profile is considered submitted if declaration consent is complete OR profileSubmitted is true
          firebaseSubmissionStatus = declarationConsentComplete || data.profileSubmitted === true

          // Set data from Firebase
          if (firebaseData) setFormData(prev => ({ ...prev, ...firebaseData }))
          if (firebaseCompletedSections) setCompletedSections(prev => ({ ...prev, ...firebaseCompletedSections }))

          // If profile is marked as submitted in Firebase, show summary
          if (firebaseSubmissionStatus) {
            setProfileSubmitted(true)
            setShowSummary(true)
          }
        }

        // If no Firebase data or incomplete, try loading from localStorage as backup
        if (!firebaseData || !firebaseSubmissionStatus) {
          const savedData = localStorage.getItem("investorProfileData")
          const savedCompletedSections = localStorage.getItem("investorProfileCompletedSections")
          const savedSubmissionStatus = localStorage.getItem("investorProfileSubmitted")

          // Only use localStorage data if we don't have Firebase data
          if (savedData && !firebaseData) setFormData(JSON.parse(savedData))
          if (savedCompletedSections && !firebaseCompletedSections) setCompletedSections(JSON.parse(savedCompletedSections))

          // Only use localStorage submission status if Firebase didn't have it marked as submitted
          if (savedSubmissionStatus === "true" && !firebaseSubmissionStatus) {
            setProfileSubmitted(true)
            setShowSummary(true)

            // If we found submission status in localStorage but not Firebase, sync to Firebase
            if (!firebaseSubmissionStatus) {
              try {
                await setDoc(docRef, {
                  profileSubmitted: true
                }, { merge: true })
              } catch (syncError) {
                console.error("Error syncing submission status to Firebase:", syncError)
              }
            }
          }
        }

        // Check if this is the first time visiting - only show welcome popup for new users
        const hasSeenWelcomePopup = localStorage.getItem(getUserSpecificKey("hasSeenInvestorWelcomePopup")) === "true"
        if (!hasSeenWelcomePopup) {
          setShowWelcomePopup(true)
          localStorage.setItem(getUserSpecificKey("hasSeenInvestorWelcomePopup"), "true")
        }

      } catch (error) {
        console.error("Error fetching profile data:", error)
        setError("Failed to load profile data. Please try again later.")

        // Fall back to localStorage if Firebase fails
        const savedData = localStorage.getItem("investorProfileData")
        const savedCompletedSections = localStorage.getItem("investorProfileCompletedSections")
        const savedSubmissionStatus = localStorage.getItem("investorProfileSubmitted")

        if (savedData) setFormData(JSON.parse(savedData))
        if (savedCompletedSections) setCompletedSections(JSON.parse(savedCompletedSections))
        if (savedSubmissionStatus === "true") {
          setProfileSubmitted(true)
          setShowSummary(true)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem("investorProfileData", JSON.stringify(formData))
  }, [formData])

  useEffect(() => {
    localStorage.setItem("investorProfileCompletedSections", JSON.stringify(completedSections))
  }, [completedSections])

  useEffect(() => {
    localStorage.setItem("investorProfileSubmitted", profileSubmitted.toString())
  }, [profileSubmitted])

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
    setCompletedSections((prev) => {
      const updated = { ...prev, [section]: true };

      // Save to Firebase
      const userId = auth.currentUser?.uid;
      if (userId) {
        const docRef = doc(db, "MyuniversalProfiles", userId);
        setDoc(docRef, { completedSections: updated }, { merge: true });
      }

      return updated;
    });
  };

  const navigateToNextSection = async () => {
    setSectionLoading(true)

    // Simulate some processing time for better UX
    await new Promise(resolve => setTimeout(resolve, 800))

    const currentIndex = sections.findIndex((s) => s.id === activeSection)
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id)
      window.scrollTo(0, 0)
    }

    setSectionLoading(false)
  }

  const navigateToPreviousSection = async () => {
    setSectionLoading(true)

    // Simulate some processing time for better UX
    await new Promise(resolve => setTimeout(resolve, 500))

    const currentIndex = sections.findIndex((s) => s.id === activeSection)
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id)
      window.scrollTo(0, 0)
    }

    setSectionLoading(false)
  }

  const handleEditProfile = () => {
    setShowSummary(false)
    setProfileSubmitted(false) // Allow editing by setting to false
    setActiveSection("fundManageOverview")
    window.scrollTo(0, 0)
  }

  const renderActiveSection = () => {
    const sectionData = formData[activeSection] || {}
    const updateData = (data) => updateFormData(activeSection, data)

    const commonProps = { data: sectionData, updateData }

    switch (activeSection) {
      case "instructions":
        return <Instructions />
      case "fundManageOverview":
        return <EntityOverview {...commonProps} />
      case "generalInvestmentPreference":
        return <OwnershipManagement {...commonProps} />
      case "contactDetails":
        return <ContactDetails {...commonProps} />
      case "fundDetails":
        return <ProductsServices {...commonProps} />
      case "applicationBrief":
        return <HowDidYouHear {...commonProps} />
      case "documentUpload":
        return <DocumentUpload {...commonProps} />
      case "declarationConsent":
        return <DeclarationConsent {...commonProps} />
      default:
        return <Instructions />
    }
  }

  const uploadFilesAndReplaceWithURLs = async (data, section) => {
    const uploadRecursive = async (item, pathPrefix) => {
      if (item instanceof File) {
        const fileRef = ref(storage, `MyuniversalProfile/${auth.currentUser?.uid}/${pathPrefix}`)
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

  const saveDataToFirebase = async (section = null, includingSubmissionStatus = false) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error("User not logged in.")

      const docRef = doc(db, "MyuniversalProfiles", userId)
      const sectionData = section ? formData[section] : formData

      const uploaded = section
        ? {
          ...(section !== "instructions" && {
            [section]: await uploadFilesAndReplaceWithURLs(sectionData, section),
          }),
        }
        : await uploadFilesAndReplaceWithURLs(sectionData, "full");


      const dataToSave = {
        formData: section ? { ...uploaded } : uploaded,
        completedSections,
      }

      // Only include submission status if specifically requested
      if (includingSubmissionStatus) {
        dataToSave.profileSubmitted = profileSubmitted
      }

      await setDoc(
        docRef,
        dataToSave,
        { merge: true },
      )

      return true
    } catch (err) {
      console.error("Error saving to Firebase:", err)
      throw err
    }
  }

  const handleSaveSection = async () => {
    try {
      setSectionLoading(true)
      await saveDataToFirebase(activeSection)
      alert("Section saved to Firebase!")
    } catch (err) {
      alert("Failed to save to Firebase.")
    } finally {
      setSectionLoading(false)
    }
  }

  const handleSaveAndContinue = async () => {
    const sectionData = formData[activeSection] || {};
    const isValid = sectionValidations[activeSection]?.(sectionData);

    if (!isValid && activeSection != "instructions") {
      let errors = [];

      if (activeSection === "fundManageOverview") {
        errors = validateFundManageOverview(sectionData);
      } else if (activeSection === "contactDetails") {
        errors = validateContactDetails(sectionData);
      } else {
        // For sections that now always pass validation, this shouldn't trigger
        errors.push(`${sections.find(s => s.id === activeSection)?.label.replace(/\n/g, " ")} is incomplete or has invalid fields.`);
      }

      setValidationModal({
        open: true,
        title: "Please review the following:",
        messages: errors
      });

      return;
    }

    try {
      setSectionLoading(true);
      await markSectionAsCompleted(activeSection);

      await saveDataToFirebase(activeSection);

      await new Promise(resolve => setTimeout(resolve, 800));

      const currentIndex = sections.findIndex(s => s.id === activeSection);
      if (currentIndex < sections.length - 1) {
        setActiveSection(sections[currentIndex + 1].id);
        window.scrollTo(0, 0);
      }
    } catch (err) {
      alert("Failed to save. Please try again.");
    } finally {
      setSectionLoading(false);
    }
  };

  const handleSubmitProfile = async () => {
    try {
      setSectionLoading(true)

      // Mark the current section as completed
      await markSectionAsCompleted("declarationConsent");

      // Set profile as submitted
      setProfileSubmitted(true)

      // First save everything to Firebase including the submission status
      await saveDataToFirebase(null, true)

      // Add a delay to show processing
      await new Promise(resolve => setTimeout(resolve, 1200))

      // Check if user has seen the congratulations popup before
      const hasSeenCongratulationsPopup =
        localStorage.getItem(getUserSpecificKey("hasSeenInvestorCongratulationsPopup")) === "true"

      if (!hasSeenCongratulationsPopup) {
        // Show congratulations popup only for first-time completion
        setShowCongratulationsPopup(true)
        localStorage.setItem(getUserSpecificKey("hasSeenInvestorCongratulationsPopup"), "true")
      } else {
        // If they've seen it before, just show the summary
        setShowSummary(true)
      }

      // Scroll to top for better user experience
      window.scrollTo(0, 0)
    } catch (err) {
      console.error("Failed to submit profile:", err)
      alert("Failed to submit profile. Please try again.")

      // Revert the submission status if Firebase save failed
      setProfileSubmitted(false)
    } finally {
      setSectionLoading(false)
    }
  }

  // Popup handlers
  const handleNextOnboardingStep = () => {
    if (currentOnboardingStep < onboardingSteps.length - 1) {
      setCurrentOnboardingStep(currentOnboardingStep + 1)
    } else {
      setShowWelcomePopup(false)
    }
  }

  const handleCloseWelcomePopup = () => {
    setShowWelcomePopup(false)
  }

  const handleCloseCongratulationsPopup = () => {
    setShowCongratulationsPopup(false)
    setShowSummary(true) // Show the summary after closing the congratulations popup
  }

  const handleNavigateToSMSEApplications = () => {
    navigate("/investor-matches")
  }

  // If still loading initially, show a loading message
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <div className="loading-message">Loading profile data...</div>
      </div>
    )
  }

  // If there's an error, show an error message
  if (error) {
    return <div className="error">{error}</div>
  }

  // Show section loading overlay when transitioning between sections
  if (sectionLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <div className="loading-message">Preparing next step...</div>
      </div>
    )
  }

  // If profile is submitted and we're showing the summary
  if (showSummary && !showCongratulationsPopup) {
    return <InvestorProfileSummary data={formData} onEdit={handleEditProfile} />
  }

  return (
    <div className="universal-profile-container">
      {validationModal.open && (
        <div className="popup-overlay">
          <div className="validation-popup">
            <button className="close-popup" onClick={() => setValidationModal({ open: false, title: "", messages: [] })}>
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
                <button className="btn btn-primary" onClick={() => setValidationModal({ open: false, title: "", messages: [] })}>
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Popup for first-time users */}
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
             
              <h2>Congratulations!</h2>
              <p>You've successfully completed your Investor Universal Profile!</p>
              <p>
                You can now view your profile summary, go to your dashboard to see potential matches, or proceed to the SMSE Applications section.
              </p>
              <div className="popup-buttons-group">
                <button className="btn btn-secondary" onClick={handleCloseCongratulationsPopup}>
                  View Summary
                </button>
                <button className="btn btn-secondary" onClick={handleNavigateToSMSEApplications}>
                  Go to SMSE Applications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1>My Universal Profile</h1>

      <div className={`${styles.profileTracker} profile-tracker`}>
        <div className={`${styles.profileTrackerInner} profile-tracker-inner`}>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`${styles.profileTrackerButton} profile-tracker-button ${activeSection === section.id ? "active" : completedSections[section.id] ? "completed" : "pending"
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
              disabled={sectionLoading}
            >
              <ChevronLeft size={16} /> Previous
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveSection}
            className={`${styles.btn} ${styles.btnSecondary} btn btn-secondary`}
            disabled={sectionLoading}
          >
            <Save size={16} /> Save
          </button>

          {activeSection !== "declarationConsent" ? (
            <button
              type="button"
              onClick={handleSaveAndContinue}
              className="btn btn-primary"
            >
              Save & Continue <ChevronRight size={16} />
            </button>

          ) : (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary} btn btn-primary`}
              onClick={handleSubmitProfile}
              disabled={sectionLoading}
            >
              Submit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  )
}