"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle, ChevronRight, ChevronLeft, Save, X, ArrowRight } from "lucide-react"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "../../firebaseConfig" // adjust based on your setup
import "./UniversalProfile.css"
import Instructions from "./instructions"
import EntityOverview from "./entity-overview"
import OwnershipManagement from "./ownership-management"
import ContactDetails from "./contact-details"
import LegalCompliance from "./legal-compliance"
import FinancialOverview from "./FinancialOverview" // Import the FinancialOverview component
import ProductsServices from "./products-services"
import HowDidYouHear from "./how-did-you-hear"
import Documents from "./Documents"
import DeclarationConsent from "./declaration-consent"
import ProfileSummary from "./ProfileSummary"
import { onAuthStateChanged } from "firebase/auth";

const sections = [
  { id: "instructions", label: "Instructions" },
  { id: "entityOverview", label: "Entity\nOverview" },
  { id: "ownershipManagement", label: "Ownership &\nManagement" },
  { id: "contactDetails", label: "Contact\nDetails" },
  { id: "legalCompliance", label: "Legal &\nCompliance" },
  { id: "financialOverview", label: "Financial\nOverview" }, // Added Financial Overview tab
  { id: "productsServices", label: "Products &\nServices" },
  { id: "howDidYouHear", label: "How Did\nYou Hear" },
  { id: "documents", label: "Document\nUpload" },
  { id: "declarationConsent", label: "Declaration &\nConsent" },
]

// Section validation functions - Updated to include financialOverview
const sectionValidations = {
  instructions: () => true, // Always valid
  
  entityOverview: (data) => {
    return (
      data.registeredName &&
      data.registrationNumber &&
      data.entityType &&
      data.legalStructure &&
      data.entitySize &&
      data.financialYearEnd &&
      data.employeeCount >= 0 &&
      data.yearsInOperation >= 0 &&
      data.operationStage &&
      Array.isArray(data.economicSectors) && data.economicSectors.length > 0 &&
      data.location &&
      (data.location !== "south_africa" || data.province) &&
      data.businessDescription
    );
  },

  ownershipManagement: () => true, // Always valid

  contactDetails: (data) => {
    const requiredFields = [
      data.contactTitle,
      data.contactName,
      data.position,
      data.contactId,
      data.businessPhone,
      data.mobile,
      data.email,
      data.physicalAddress
    ];

    const hasAllRequired = requiredFields.every(field => typeof field === "string" && field.trim() !== "");

    const postalAddressValid = data.sameAsPhysical || (typeof data.postalAddress === "string" && data.postalAddress.trim() !== "");

    return hasAllRequired && postalAddressValid;
  },

  legalCompliance: () => true, // Always valid

  financialOverview: () => true, // Always valid - add specific validation if needed

  productsServices: () => true, // Always valid

  howDidYouHear: () => true, // Always valid

  documents: () => true, // Always valid

  declarationConsent: () => true // Always valid
};

// Add this to your validation utilities or at the top of your FundingApplication component
const validateAllSections = (formData, completedSections) => {
  const sectionStatus = {};
  let allValid = true;

  // Check each section
  sections.forEach(section => {
    const sectionId = section.id;
    const isValid = sectionValidations[sectionId](formData[sectionId] || {});

    sectionStatus[sectionId] = {
      valid: isValid,
      completed: completedSections[sectionId],
      name: section.label
    };

    if (!isValid || !completedSections[sectionId]) {
      allValid = false;
    }
  });

  return { allValid, sectionStatus };
};

// Onboarding steps for the welcome popup
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
  const isProfileComplete = () => {
    return Object.entries(sectionValidations).every(([sectionKey, validate]) => {
      const valid = validate(formData[sectionKey] || {});
      const completed = completedSections[sectionKey];
      return valid && completed;
    });
  };


  // New state for popups
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0)

  const [completedSections, setCompletedSections] = useState({
    instructions: true,
    entityOverview: false,
    ownershipManagement: false,
    contactDetails: false,
    legalCompliance: false,
    financialOverview: false, // Added financialOverview
    productsServices: false,
    howDidYouHear: false,
    documents: false,
    declarationConsent: false,
  })
const [validationModal, setValidationModal] = useState({
  open: false,
  title: "",
  messages: []
});

  const [formData, setFormData] = useState({
    instructions: {},
    entityOverview: {},
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
    legalCompliance: {
      licenseDoc: null,
    },
    financialOverview: { // Added financialOverview data structure
      generatesRevenue: "",
      annualRevenue: "",
      currentValuation: "",
      hasAccountingSoftware: "",
      accountingSoftwareDocs: [],
      profitabilityStatus: "",
      existingDebt: "",
      fundraisingHistory: "",
      booksUpToDate: "",
      booksUpToDateDetails: "",
      hasCreditReport: "",
      creditReportDocs: [],
      creditScore: "",
      creditIssues: ""
    },
    productsServices: {
      entityType: "smse",
      productCategories: [],
      serviceCategories: [],
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const savedData = localStorage.getItem(getUserSpecificKey("universalProfileData"));
        const savedCompletedSections = localStorage.getItem(getUserSpecificKey("universalProfileCompletedSections"));
        const savedSubmissionStatus = localStorage.getItem(getUserSpecificKey("profileSubmitted"));
        const hasSeenWelcomePopup = localStorage.getItem(getUserSpecificKey("hasSeenWelcomePopup")) === "true";
        const hasSeenCongratulationsPopup =
          localStorage.getItem(getUserSpecificKey("hasSeenCongratulationsPopup")) === "true";

        if (savedData) setFormData(JSON.parse(savedData));
        if (savedCompletedSections) setCompletedSections(JSON.parse(savedCompletedSections));
        if (savedSubmissionStatus === "true") {
          setProfileSubmitted(true);
          setShowSummary(true);
        }

        if (!hasSeenWelcomePopup) {
          setShowWelcomePopup(true);
          localStorage.setItem(getUserSpecificKey("hasSeenWelcomePopup"), "true");
        }
      } else {
        // Redirect to login or home page if not authenticated
        navigate("/login");
      }
      setLoading(false); // Done loading regardless
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);
  // Helper function to get user-specific localStorage key
  const getUserSpecificKey = (baseKey) => {
    const userId = auth.currentUser?.uid
    return userId ? `${baseKey}_${userId}` : baseKey
  }

  // Load saved data from localStorage
  useEffect(() => {
    const userId = auth.currentUser?.uid
    if (!userId) {
      setLoading(false)
      return
    }


    const savedData = localStorage.getItem(getUserSpecificKey("universalProfileData"))
    const savedCompletedSections = localStorage.getItem(getUserSpecificKey("universalProfileCompletedSections"))
    const savedSubmissionStatus = localStorage.getItem(getUserSpecificKey("profileSubmitted"))
    const hasSeenWelcomePopup = localStorage.getItem(getUserSpecificKey("hasSeenWelcomePopup")) === "true"
    const hasSeenCongratulationsPopup =
      localStorage.getItem(getUserSpecificKey("hasSeenCongratulationsPopup")) === "true"

    if (savedData) setFormData(JSON.parse(savedData))
    if (savedCompletedSections) setCompletedSections(JSON.parse(savedCompletedSections))
    if (savedSubmissionStatus === "true") {
      setProfileSubmitted(true)
      setShowSummary(true)
    }

    // Show welcome popup only for first-time users
    if (!hasSeenWelcomePopup) {
      setShowWelcomePopup(true)
      localStorage.setItem(getUserSpecificKey("hasSeenWelcomePopup"), "true")
    }

    setLoading(false)
  }, [])

  // Save to localStorage
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
  const updated = {
    ...completedSections,
    [section]: true,
  }

  setCompletedSections(updated)

  const userId = auth.currentUser?.uid
  if (userId) {
    const docRef = doc(db, "universalProfiles", userId)
    await setDoc(docRef, { completedSections: updated }, { merge: true })

    // Keep localStorage in sync for offline continuity
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
    const userId = auth.currentUser?.uid
    if (!userId) throw new Error("User not logged in.")

    if (!userId) return;

    const docRef = doc(db, "universalProfiles", userId);
    const sectionData = section ? formData[section] : formData;

   const uploaded = section
  ? {
      ...(section !== "instructions" && {
        [section]: await uploadFilesAndReplaceWithURLs(sectionData, section),
      }),
    }
  : await uploadFilesAndReplaceWithURLs(sectionData, "full");


    const dataToSave = {
      ...uploaded,
      
  completedSections, // Always include

      ...(isFinalSubmit || !section ? { completedSections } : {}),
    };
    const triggerSections = ["enterpriseReadiness","documentUpload","entityOverview","legalCompliance","contactDetails","financialOverview"];
  const triggerSectionsFundability = [
  "enterpriseReadiness",
  "documentUpload",
  "entityOverview",
    "legalCompliance",
  "contactDetails",
  "financialOverview", // Added financialOverview to fundability triggers
];

const triggerSectionsLegitimacy = [
   "enterpriseReadiness",
  "documentUpload",
  "entityOverview",
    "legalCompliance",
  "contactDetails",
  "financialOverview", // Added financialOverview to legitimacy triggers
];

if (section) {
  const triggerPayload = {};

  if (triggerSectionsFundability.includes(section)) {
    triggerPayload.triggerFundabilityEvaluation = true;
  }

  if (triggerSectionsLegitimacy.includes(section)) {
    triggerPayload.triggerLegitimacyEvaluation = true;
  }

  if (Object.keys(triggerPayload).length > 0) {
    await setDoc(docRef, triggerPayload, { merge: true });
  }
}


    await setDoc(docRef, dataToSave, { merge: true });
    setLoading(false)
  };


  const handleSaveSection = async () => {
    await saveDataToFirebase(activeSection)
    alert("Section saved to Firebase!")
  }
const handleSaveAndContinue = async () => {
  const sectionData = formData[activeSection] || {};
  const isValid = sectionValidations[activeSection]?.(sectionData);

  if (!isValid) {
    const errors = [];

   
    if (activeSection === "entityOverview") {
      errors.push("Entity Overview section is incomplete. Please fill in all required fields.");
    } else if (activeSection === "contactDetails") {
      errors.push("Contact Details section is incomplete. Please fill in all required fields.");
    } else {
      errors.push(`${sections.find(s => s.id === activeSection)?.label.replace(/\n/g, " ")} is incomplete or contains invalid fields.`);
    }
 if (activeSection != "instructions") {
  setValidationModal({
      open: true,
      title: "Please review the following issues:",
      messages: errors
    });
    
    }
  

    return; // 🚫 Prevents saving and navigation when invalid
  }

  // ✅ Only runs when valid
  markSectionAsCompleted(activeSection);
  await saveDataToFirebase(activeSection);
  navigateToNextSection();
};



  const handleSubmitProfile = async () => {
    markSectionAsCompleted("declarationConsent") 
    const { allValid, sectionStatus } = validateAllSections(formData, completedSections);

    if (!allValid) {
      const issues = Object.entries(sectionStatus)
    
        .filter(([_, status]) => !status.valid || !status.completed)
        .map(([_, status]) => `❌ ${status.name.replace(/\n/g, " ")} is incomplete or invalid.`);

      alert("Profile submission blocked:\n\n" + issues.join("\n"));
      return;
    }

    try {

      await saveDataToFirebase()
      // save full form
      setProfileSubmitted(true)

      // Show congratulations popup only if user hasn't seen it before
      const hasSeenCongratulationsPopup =
        localStorage.getItem(getUserSpecificKey("hasSeenCongratulationsPopup")) === "true"
      if (!hasSeenCongratulationsPopup) {
        setShowCongratulationsPopup(true)
        localStorage.setItem(getUserSpecificKey("hasSeenCongratulationsPopup"), "true")
      } else {
        setShowSummary(true) // Show the summary immediately if they've seen the popup before
      }

      setIsEditing(false) // Reset editing state
      window.scrollTo(0, 0)
      console.log("Submitted:", formData)
    } catch (err) {
      console.error("Failed to submit profile:", err);
      alert("Failed to submit profile. Please try again.");
      setProfileSubmitted(false);
    }
  };


  // Function to handle completion of the registration process
  const handleRegistrationComplete = async () => {
    // Any final submission logic here

    // Show a success message
    alert("Your profile has been successfully submitted!")

    // Redirect to dashboard
    navigate("/dashboard")
  }

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
    setShowCongratulationsPopup(false);
    setShowSummary(true);
    window.scrollTo(0, 0);
  };

  const handleNavigateToFunding = () => {
    navigate("/applications/funding")
  }

  // Helper function to check if documents section is complete
  const isDocumentsSectionComplete = () => {
    const requiredDocs = ['registrationCertificate', 'certifiedIds', 'shareRegister', 'proofOfAddress', 'taxClearanceCert']
    const documents = formData.documents || {}

    return requiredDocs.every(docId => {
      const files = documents[docId] || []
      return files.length > 0
    })
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
      case "financialOverview": // Added financialOverview case
        return <FinancialOverview {...commonProps} />
      case "productsServices":
        return <ProductsServices {...commonProps} />
      case "howDidYouHear":
        return <HowDidYouHear {...commonProps} />
      case "documents":
        return <Documents {...commonProps} />
      case "declarationConsent":
        return <DeclarationConsent {...commonProps} allFormData={formData} onComplete={handleRegistrationComplete} />
      default:
        return <Instructions />
    }
  }

  useEffect(() => {
   const fetchProfileData = async () => {
  try {
    setLoading(true)
    const userId = auth.currentUser?.uid
    if (!userId) throw new Error("User not logged in")

    const docRef = doc(db, "universalProfiles", userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      setProfileData(data)

      // Prefer Firebase completedSections over localStorage
      if (data.completedSections) {
        setCompletedSections(prev => ({
          ...prev,
          instructions: true,
          ...data.completedSections,
        }))
        // Overwrite localStorage with latest Firebase version
        localStorage.setItem(getUserSpecificKey("universalProfileCompletedSections"), JSON.stringify(data.completedSections))
      }

      setFormData(prev => ({
        ...prev,
        ...data,
      }))

      const isProfileComplete =
        data?.declarationConsent?.accuracy &&
        data?.declarationConsent?.dataProcessing &&
        data?.declarationConsent?.termsConditions

      if (isProfileComplete && !isEditing) {
        setProfileSubmitted(true)
        setShowSummary(true)
      }
    } else {
      setError("No profile found. Please complete your Universal Profile first.")
    }
  } catch (err) {
    console.error("Error fetching profile data:", err)
    setError("Failed to load profile data. Please try again later.")
  } finally {
    setLoading(false)
  }
}


    fetchProfileData()
  }, [isEditing])

  // Auto-complete documents section when all required documents are uploaded
  useEffect(() => {
    if (isDocumentsSectionComplete() && !completedSections.documents) {
      setCompletedSections(prev => ({
        ...prev,
        documents: true
      }))
    } else if (!isDocumentsSectionComplete() && completedSections.documents) {
      setCompletedSections(prev => ({
        ...prev,
        documents: false
      }))
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

  // If profile is submitted and we're showing the summary (and not editing)
  if (showSummary && !isEditing) {
    return <ProfileSummary data={profileData || formData} onEdit={handleEditProfile} />
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
              <div className="confetti-animation"></div>
              <h2>Congratulations!</h2>
              <p>You've successfully completed your Universal Profile!</p>
              <p>
                Your compliance score is "xx%, you can view this in your BIG score and you can make any necessary edits, or proceed to the Funding
                Application to apply for business funding.
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
        <div className="profile-tracker-inner">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`profile-tracker-button ${activeSection === section.id ? "active" : completedSections[section.id] ? "completed" : "pending"
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
      {!isProfileComplete() && (
        <p className="text-red-600 text-sm mt-2">

        </p>
      )}

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