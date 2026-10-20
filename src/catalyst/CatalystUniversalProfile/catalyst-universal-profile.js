"use client"

import { useState, useEffect } from "react"
import { CheckCircle, ChevronRight, ChevronLeft, Save, Award } from "lucide-react"
import CatalystObjectives from "./catalyst-objectives"
import CatalystInstructions from "./catalyst-instructions"
import CatalystEntityOverview from "./catalyst-entity-overview"
import CatalystContactDetails from "./catalyst-contact-details"
import CatalystProgrammeSetup from "./catalyst-programme-setup"
import CatalystDocumentUpload from "./catalyst-document-upload"
import CatalystDeclarationConsent from "./catalyst-declaration-consent"
import CatalystProfileSummary from "./catalyst-profile-summary"
import { auth, db, storage } from "../../firebaseConfig"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { DEFAULT_STAGE_WEIGHTS_CATALYST } from "./catalystTaxonomy"
import styles from "./catalyst-universal-profile.module.css"

const sections = [
  { id: "objectives", label: "Objectives" },
  { id: "instructions", label: "Instructions" },
  { id: "entityOverview", label: "Entity\nOverview" },
  { id: "contactDetails", label: "Contact\nDetails" },
  { id: "programmeSetup", label: "Programme\nSetup" },
  { id: "documentUpload", label: "Document\nUpload" },
  { id: "declarationConsent", label: "Declaration &\nConsent" },
]

export default function CatalystUniversalProfile() {
  const [activeSection, setActiveSection] = useState("objectives")
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSummary, setShowSummary] = useState(false)

  const [completedSections, setCompletedSections] = useState({
    objectives: false,
    instructions: true,
    entityOverview: false,
    contactDetails: false,
    programmeSetup: false,
    documentUpload: false,
    declarationConsent: false,
  })

  const [formData, setFormData] = useState({
    objectives: {
      catalystActivities: ["incubation", "esd"],
      platformObjectives: ["find_businesses", "track_outcomes"],
    },
    entityOverview: {
      organisationType: "independent_provider",
      organisationalArrangement: "standalone",
      parentOrganisation: "",
      parentOrganisationNotListed: "",
      unitOrDepartmentName: "",
      registeredName: "Catalyst Innovation Hub (Pty) Ltd",
      tradingName: "Ubuntu Catalyst Hub",
      legalEntityType: "pty_ltd",
      legalEntityTypeOther: "",
      countryOfRegistration: "South Africa",
      registrationIdentifierType: "company_cc",
      registrationNumber: "2021/456789/07",
      yearEstablished: "2021",
      briefDescription: "We provide structured acceleration, enterprise and supplier development pipelines for local high-growth businesses.",
      industrySector: "enterprise_support",
      companySize: "11-50",
      website: "https://ubuntuhub.example.org",
      logo: null,
      catalystActivities: ["incubation", "esd"],
      referralSource: "partner",
      referralSourceOther: "",
      memberOfAssociation: "no",
      industryAssociations: [],
      industryAssociationsOther: "",
      associationInclusions: {},
      sponsorType: "",
      sponsorName: "",
      sponsorViewPermission: "",
    },
    contactDetails: {
      businessEmail: "info@ubuntuhub.example.org",
      usePrimaryEmail: false,
      businessTelCountryCode: "+27",
      businessTel: "11 555 0199",
      locationSource: "different",
      country: "South Africa",
      province: "Gauteng",
      city: "Johannesburg",
      physicalAddress: "12 Innovation Boulevard, Rosebank",
      postalAddressChoice: "same_as_physical",
      postalAddress: "",
      // Primary Contact
      primaryTitle: "Dr",
      primaryName: "Nomsa",
      primarySurname: "Dlamini",
      primaryPosition: "Hub Director",
      primaryResponsibilities: ["leadership", "partnerships", "programme_coord"],
      primaryMobileCountryCode: "+27",
      primaryMobile: "82 555 0100",
      primaryEmail: "nomsa@ubuntuhub.example.org",
      preferredContactMethod: "email",
      // Additional Contacts
      additionalContacts: [],
      // Public Visibility
      linkedInPage: "https://linkedin.com/company/ubuntu-catalyst-hub",
      publicEnquiryContact: "general",
      publicLocationVisibility: "city_region",
    },
    programmeSetup: {
      programmes: [],
    },
    documentUpload: {
      identity_evidence: {
        fileName: "CIPC_Registration_Ubuntu_Catalyst.pdf",
        fileSize: "1.42 MB",
        uploadedAt: "18 Oct 2026",
        status: "accepted",
      },
      tax_clearance: {
        taxPin: "9876543210",
        taxExpiry: "2027-08-31",
        fileName: "SARS_Tax_Compliance_PIN_2026.pdf",
        fileSize: "0.85 MB",
        uploadedAt: "18 Oct 2026",
        status: "accepted",
      },
      bbbee_evidence: {
        bbbeeType: "sworn_affidavit_eme",
        bbbeeLevel: "level_1",
        bbbeeExpiry: "2027-06-30",
        fileName: "BBBEE_Sworn_Affidavit_EME_2026.pdf",
        fileSize: "0.92 MB",
        uploadedAt: "18 Oct 2026",
        status: "uploaded",
      },
      capability_statement: {
        fileName: "Ubuntu_Catalyst_Hub_Capability_Deck_2026.pdf",
        fileSize: "4.15 MB",
        uploadedAt: "18 Oct 2026",
        status: "uploaded",
      },
      accreditations: [],
      supplementaryDocs: [],
    },
    declarationConsent: {
      accuracy: true,
      authority: true,
      platformTerms: true,
      dataProcessing: true,
      listingVisibility: "members",
      promotionalOptIn: true,
      shareCapabilityWithSponsors: true,
      onboardingRelationship: "self_managed",
      thirdPartyAccessScopes: ["profile_edits", "programme_setup"],
    },
  })

  // Migration helper for legacy profiles
  const buildProgrammesData = (existingFormData) => {
    if (existingFormData?.programmeSetup?.programmes?.length > 0) {
      return existingFormData.programmeSetup.programmes
    }

    const legacyPB = existingFormData?.programBriefMatchingPreference || {}
    const legacyAB = existingFormData?.applicationBrief || {}

    return [
      {
        id: "prog_primary_1",
        programmeName: legacyPB.programName || "Supplier Growth & ESD Pathway",
        programmeType: "esd",
        status: "draft",
        intakeStatus: "open",
        programmeBrief: {
          programmeLead: "Nomsa Dlamini",
          aboutProgramme: legacyPB.aboutProgram || "Comprehensive incubation and supplier-readiness pathway connecting emerging enterprises to industrial supply chains.",
          primaryMandate: "ed_to_sd_pipeline",
          esdTrackStructure: "sequential",
          fundingSources: ["corporate"],
          sponsorOrganisation: "Corporate Partner Consortium",
          isSponsorConfidential: false,
          durationModel: "fixed",
          durationNumber: "6",
          durationUnit: "Months",
          programmeFormat: "fixed_cohort",
          deliveryMode: "hybrid",
          intakeMethod: "open_applications",
          cohortStartTiming: "1 March 2027",
          participantCapacity: "25",
          participationCost: "free_sponsored",
          founderTimeCommitment: "4 hours / week",
          diagnosticApproach: "combined",
          reviewFrequency: "monthly",
          graduationCriteria: "Baseline 5Cs audit passed + Supplier qualification review",
          intendedOutcomes: ["first_sales", "revenue_growth", "quality_systems", "contract_delivery"],
          nextDestinations: ["sd_procurement"],
        },
        matchingPreferences: {
          acceptedLifecycleStages: ["early_trading", "established"],
          lifecycleStageRule: "must_meet",
          legalStructureRule: "any",
          registrationStatusRule: "we_help_achieve",
          geographicScope: "national",
          sectorFocus: ["enterprise_support", "manufacturing", "logistics_supply_chain"],
          supportOfferings: [
            {
              id: "serv_1",
              cArea: "credibility",
              cLabel: "Credibility",
              subtypeId: "tax_compliance",
              subtypeLabel: "Tax Compliance & PIN PIN Readiness",
              provider: "internal",
              availability: "all",
              cost: "included",
            },
            {
              id: "serv_2",
              cArea: "customers",
              cLabel: "Customers",
              subtypeId: "buyer_introductions",
              subtypeLabel: "Direct Corporate Buyer Introductions",
              provider: "partner",
              availability: "after_diagnosis",
              cost: "included",
            },
          ],
        },
        scoringConfiguration: {
          mode: "default",
          stageWeights: { ...DEFAULT_STAGE_WEIGHTS_CATALYST },
          configurationNote: "Standard BIG stage baseline weighting",
        },
        applicationBrief: {
          applicationChannel: "big_application",
          applicationWindow: "rolling",
          estimatedReviewTime: "10 working days",
          onboardingTime: "1 week",
          instructionsForApplicants: "Ensure your profile and Data Vault documents are up to date.",
          selectionStages: ["screening", "profile_review", "diagnostic", "interview", "panel"],
          requiredDocuments: [
            { docId: "profile_summary", label: "Verified Universal Profile Snapshot", timing: "application", rule: "required" },
            { docId: "registration_cipc", label: "CIPC Company Registration", timing: "shortlisting", rule: "required" },
            { docId: "tax_clearance", label: "SARS Tax Compliance Status PIN", timing: "admission", rule: "required" },
          ],
        },
      },
    ]
  }

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
      // 1. Dev Preview Bypass
      const isDevBypass =
        typeof window !== "undefined" &&
        (window.location.search.includes("dev=true") ||
          sessionStorage.getItem("devMode") === "true")

      if (isDevBypass) {
        setUser({ uid: "test_catalyst_dev", email: "catalyst.dev@example.org" })
        const savedData = localStorage.getItem("catalystProfileData")
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData)
            setFormData((prev) => ({
              ...prev,
              ...parsed,
              programmeSetup: {
                programmes: buildProgrammesData(parsed),
              },
            }))
          } catch (e) {
            console.error("Error reading localStorage:", e)
          }
        } else {
          setFormData((prev) => ({
            ...prev,
            programmeSetup: {
              programmes: buildProgrammesData(prev),
            },
          }))
        }
        setLoading(false)
        return
      }

      // 2. CMF View Origin
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
                objectives: {
                  ...prev.objectives,
                  ...(data.formData.objectives || {}),
                },
                entityOverview: {
                  ...prev.entityOverview,
                  ...data.formData.entityOverview,
                },
                contactDetails: {
                  ...prev.contactDetails,
                  ...(data.formData.contactDetails || {}),
                },
                programmeSetup: {
                  programmes: buildProgrammesData(data.formData),
                },
                documentUpload: {
                  ...prev.documentUpload,
                  ...(data.formData.documentUpload || data.documentUpload || {}),
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
            if (data?.completedSections?.declarationConsent || data?.profileSubmitted || isCmfView) {
              setShowSummary(true)
            }
          }
        } catch (err) {
          console.error("Error loading catalyst profile:", err)
        }
        setLoading(false)
        return
      }

      // 3. Authenticated Firebase User
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser)
          try {
            const userRef = doc(db, "catalystProfiles", currentUser.uid)
            const docSnap = await getDoc(userRef)

            if (docSnap.exists()) {
              const data = docSnap.data()
              if (data?.formData) {
                setFormData((prev) => ({
                  ...prev,
                  ...data.formData,
                  objectives: {
                    ...prev.objectives,
                    ...(data.formData.objectives || {}),
                  },
                  entityOverview: {
                    ...prev.entityOverview,
                    ...data.formData.entityOverview,
                  },
                  contactDetails: {
                    ...prev.contactDetails,
                    ...(data.formData.contactDetails || {}),
                  },
                  programmeSetup: {
                    programmes: buildProgrammesData(data.formData),
                  },
                  documentUpload: {
                    ...prev.documentUpload,
                    ...(data.formData.documentUpload || data.documentUpload || {}),
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
              if (data?.completedSections?.declarationConsent || data?.profileSubmitted) {
                setShowSummary(true)
              }
            } else {
              // Fallback to localStorage
              const savedData = localStorage.getItem("catalystProfileData")
              const savedCompletedSections = localStorage.getItem("catalystProfileCompletedSections")
              if (savedData) {
                const parsed = JSON.parse(savedData)
                setFormData((prev) => ({
                  ...prev,
                  ...parsed,
                  programmeSetup: {
                    programmes: buildProgrammesData(parsed),
                  },
                }))
              } else {
                setFormData((prev) => ({
                  ...prev,
                  programmeSetup: {
                    programmes: buildProgrammesData(prev),
                  },
                }))
              }
              if (savedCompletedSections) {
                const parsedCompleted = JSON.parse(savedCompletedSections)
                setCompletedSections(parsedCompleted)
                if (parsedCompleted.declarationConsent) setShowSummary(true)
              }
            }
          } catch (err) {
            console.error("Error fetching doc:", err)
          }
          setLoading(false)
        } else {
          // Fallback to local storage for guest
          const savedData = localStorage.getItem("catalystProfileData")
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData)
              setFormData((prev) => ({
                ...prev,
                ...parsed,
                programmeSetup: {
                  programmes: buildProgrammesData(parsed),
                },
              }))
            } catch (e) {}
          } else {
            setFormData((prev) => ({
              ...prev,
              programmeSetup: {
                programmes: buildProgrammesData(prev),
              },
            }))
          }
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
    setFormData((prev) => {
      const updatedSection = {
        ...prev[section],
        ...data,
      }

      // Synchronize catalyst activities across objectives and entity overview
      let updatedEntityOverview = prev.entityOverview
      let updatedObjectives = prev.objectives

      if (section === "objectives" && data.catalystActivities) {
        updatedEntityOverview = {
          ...prev.entityOverview,
          catalystActivities: data.catalystActivities,
        }
      } else if (section === "entityOverview" && data.catalystActivities) {
        updatedObjectives = {
          ...prev.objectives,
          catalystActivities: data.catalystActivities,
        }
      }

      return {
        ...prev,
        [section]: updatedSection,
        entityOverview: updatedEntityOverview,
        objectives: updatedObjectives,
      }
    })
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
    if (!user) {
      alert("Profile progress saved locally.")
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
      alert("Saved locally (offline mode).")
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
      alert("Profile completed! (Saved locally in development mode)")
      setShowSummary(true)
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
      alert("Profile completed and saved locally.")
      setShowSummary(true)
    }
  }

  const handleEditFromSummary = () => {
    setShowSummary(false)
    setActiveSection("objectives")
  }

  const renderActiveSection = () => {
    const sectionData = formData[activeSection] || {}
    const commonProps = {
      data: sectionData,
      updateData: (data) => updateFormData(activeSection, data),
      formData,
    }
    switch (activeSection) {
      case "objectives":
        return (
          <CatalystObjectives
            {...commonProps}
            onContinue={() => {
              markSectionAsCompleted("objectives")
              navigateToNextSection()
            }}
            onSave={handleSaveSection}
          />
        )
      case "instructions":
        return <CatalystInstructions />
      case "entityOverview":
        return <CatalystEntityOverview {...commonProps} />
      case "contactDetails":
        return <CatalystContactDetails {...commonProps} />
      case "programmeSetup":
        return (
          <CatalystProgrammeSetup
            data={formData.programmeSetup || {}}
            updateData={(data) => updateFormData("programmeSetup", data)}
          />
        )
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
    if (!isCmfView) return null
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
          onClick={() => {
            sessionStorage.removeItem("viewingSMEId")
            sessionStorage.removeItem("viewingSMEName")
            sessionStorage.removeItem("investorViewMode")
            sessionStorage.removeItem("viewOrigin")
            window.location.href = "/cmf-cohorts"
          }}
          style={{
            padding: "8px 16px",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          ← Back to My Cohorts
        </button>
      </div>
    )
  }

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h1 style={{ margin: 0 }}>My Catalyst Profile</h1>
        <button
          type="button"
          id="view-summary-btn"
          onClick={() => setShowSummary(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            background: "linear-gradient(135deg, #a67c52, #7d5a50)",
            color: "#faf7f2",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(125, 90, 80, 0.25)",
            transition: "all 0.2s ease",
          }}
        >
          <Award size={16} /> View Summary & Verification
        </button>
      </div>
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
          {activeSection !== "objectives" && (
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