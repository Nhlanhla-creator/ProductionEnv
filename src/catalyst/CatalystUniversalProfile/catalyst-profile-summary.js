"use client"
import { useState } from "react"
import CatalystVerificationScoreCard from "./CatalystVerificationScoreCard"
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Building,
  Phone,
  Target,
  FileText,
  UploadCloud,
  ShieldCheck,
  Compass,
  Layers,
  Award,
  CheckCircle2,
} from "lucide-react"
import { documentsList as documentUploadList } from "./catalyst-document-upload"

const CatalystProfileSummary = ({ formData, onEdit }) => {
  const [expandedSections, setExpandedSections] = useState({
    objectives: true,
    instructions: false,
    entityOverview: true,
    contactDetails: false,
    programmeSetup: true,
    programBriefMatchingPreference: true,
    applicationBrief: false,
    documentUpload: true,
    declarationConsent: true,
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => {
      const next = !prev[section]
      if (section === "programmeSetup" || section === "programBriefMatchingPreference") {
        return {
          ...prev,
          programmeSetup: next,
          programBriefMatchingPreference: next,
        }
      }
      return {
        ...prev,
        [section]: next,
      }
    })
  }

  const formatArray = (arr) => {
    if (!arr || !arr.length) return "None specified"
    if (Array.isArray(arr)) {
      return arr.filter((item) => item && item.trim()).join(" • ")
    }
    return arr
  }

  const formatCurrency = (value) => {
    if (!value) return "N/A"
    // Handle both string and number formats
    const numericValue = typeof value === 'string' 
      ? Number.parseFloat(value.replace(/R|,/g, ""))
      : value
    if (isNaN(numericValue)) return value
    return `R${numericValue.toLocaleString("en-ZA")}`
  }

  const handleEdit = () => {
    if (onEdit) onEdit()
  }

  const getSummaryData = () => {
    const programBriefData = formData?.programBriefMatchingPreference || {}
    
    return {
      // Entity Overview
      organisationType: formData?.entityOverview?.organisationType,
      organisationalArrangement: formData?.entityOverview?.organisationalArrangement,
      parentOrganisation: formData?.entityOverview?.parentOrganisation,
      unitOrDepartmentName: formData?.entityOverview?.unitOrDepartmentName,
      registeredName: formData?.entityOverview?.registeredName,
      tradingName: formData?.entityOverview?.tradingName,
      legalEntityType: formData?.entityOverview?.legalEntityType,
      registrationIdentifierType: formData?.entityOverview?.registrationIdentifierType,
      registrationNumber: formData?.entityOverview?.registrationNumber,
      industrySector: formData?.entityOverview?.industrySector,
      companySize: formData?.entityOverview?.companySize,
      yearEstablished: formData?.entityOverview?.yearEstablished,
      website: formData?.entityOverview?.website,
      briefDescription: formData?.entityOverview?.briefDescription,
      referralSource: formData?.entityOverview?.referralSource,
      referralSourceOther: formData?.entityOverview?.referralSourceOther,

      // Contact Details
      businessTel: formData?.contactDetails?.businessTel,
      businessEmail: formData?.contactDetails?.businessEmail,
      city: formData?.contactDetails?.city,
      province: formData?.contactDetails?.province,
      country: formData?.contactDetails?.country,
      physicalAddress: formData?.contactDetails?.physicalAddress,
      postalAddress: formData?.contactDetails?.postalAddress,
      contactWebsite: formData?.contactDetails?.website,
      linkedin: formData?.contactDetails?.linkedInPage || formData?.contactDetails?.linkedin,
      publicLocationVisibility: formData?.contactDetails?.publicLocationVisibility,
      primaryContactTitle: formData?.contactDetails?.primaryTitle || formData?.contactDetails?.primaryContactTitle,
      primaryContactName: formData?.contactDetails?.primaryName || formData?.contactDetails?.primaryContactName,
      primaryContactSurname: formData?.contactDetails?.primarySurname || formData?.contactDetails?.primaryContactSurname,
      primaryContactPosition: formData?.contactDetails?.primaryPosition || formData?.contactDetails?.primaryContactPosition,
      primaryContactMobile: formData?.contactDetails?.primaryMobile || formData?.contactDetails?.primaryContactMobile,
      primaryContactEmail: formData?.contactDetails?.primaryEmail || formData?.contactDetails?.primaryContactEmail,
      additionalContacts: formData?.contactDetails?.additionalContacts || [],

      // Program Brief & Matching Preference (Merged Section)
      programName: programBriefData?.programName,
      programWebsite: programBriefData?.programWebsite,
      programDuration: programBriefData?.programDuration,
      aboutProgram: programBriefData?.aboutProgram,
      programGoals: programBriefData?.programGoals,
      supportFramework: programBriefData?.supportFramework,
      supportFocus: programBriefData?.supportFocus,
      supportFocusSubtype: programBriefData?.supportFocusSubtype,
      targetBusinessStage: programBriefData?.targetBusinessStage,
      minimumSupportTicket: programBriefData?.minimumSupportTicket,
      maximumSupportTicket: programBriefData?.maximumSupportTicket,
      demographics: programBriefData?.demographics,
      bbbeeLevel: programBriefData?.bbbeeLevel,
      legalEntity: programBriefData?.legalEntity,
      businessLifecycleStage: programBriefData?.businessLifecycleStage,
      sectorFocus: programBriefData?.sectorFocus,
      sectorExclusions: programBriefData?.sectorExclusions,
      geographicFocus: programBriefData?.geographicFocus,
      selectedCountries: programBriefData?.selectedCountries,
      selectedProvinces: programBriefData?.selectedProvinces,

      // Application Brief
      instructionsForApplying: formData?.applicationBrief?.instructionsForApplying,
      estimatedReviewTime: formData?.applicationBrief?.estimatedReviewTime,
      programOnboardingTime: formData?.applicationBrief?.programOnboardingTime,
      applicationWindow: formData?.applicationBrief?.applicationWindow,
      coreDocuments: formData?.applicationBrief?.coreDocuments,
      coreDocumentsOther: formData?.applicationBrief?.coreDocumentsOther,
      grantDocuments: formData?.applicationBrief?.grantDocuments,
      trainingDocuments: formData?.applicationBrief?.trainingDocuments,
      impactDocuments: formData?.applicationBrief?.impactDocuments,
      otherAdditionalDocuments: formData?.applicationBrief?.otherAdditionalDocuments,
      evaluationCriteria: formData?.applicationBrief?.evaluationCriteria,
      impactAlignment: formData?.applicationBrief?.impactAlignment,

      // Objectives
      catalystActivities: formData?.objectives?.catalystActivities || formData?.entityOverview?.catalystActivities || [],
      platformObjectives: formData?.objectives?.platformObjectives || [],

      // Multi-Programme Setup
      programmes: formData?.programmeSetup?.programmes || [],

      // Document Upload
      ...Object.fromEntries(
        documentUploadList.map((docItem) => [docItem.id, formData?.documentUpload?.[docItem.id]])
      ),

      // Declaration & Governance
      accuracy: formData?.declarationConsent?.accuracy,
      dataProcessing: formData?.declarationConsent?.dataProcessing,
      termsConditions: formData?.declarationConsent?.termsConditions,
      popiaCompliance: formData?.declarationConsent?.popiaCompliance,
      onboardingRelationship: formData?.declarationConsent?.onboardingRelationship || "self",
      representativeName: formData?.declarationConsent?.representativeName,
      representativeRole: formData?.declarationConsent?.representativeRole,
      listingVisibility: formData?.declarationConsent?.listingVisibility || "directory_searchable",
    }
  }

  const summaryData = getSummaryData()

  const renderDocumentStatus = (docVal) => {
    if (!docVal) {
      return <span style={{ color: "#ef4444", fontWeight: "600" }}>Not uploaded</span>
    }
    if (Array.isArray(docVal)) {
      if (docVal.length === 0) return <span style={{ color: "#ef4444", fontWeight: "600" }}>Not uploaded</span>
      const fileNames = docVal.map((f) => (typeof f === "string" ? f : f?.name)).filter(Boolean)
      return (
        <span style={{ color: "#22c55e", fontWeight: "600" }}>
          Uploaded ({docVal.length} file{docVal.length > 1 ? "s" : ""})
          {fileNames.length > 0 && <span style={{ fontSize: "12px", color: "#4a352f", display: "block", marginTop: "2px" }}>{fileNames.join(", ")}</span>}
        </span>
      )
    }
    if (typeof docVal === "object") {
      const fileName = docVal.name || docVal.fileName || (docVal.downloadURL ? "Uploaded document" : null)
      if (fileName) {
        return <span style={{ color: "#22c55e", fontWeight: "600" }}>Uploaded ({fileName})</span>
      }
    }
    return <span style={{ color: "#22c55e", fontWeight: "600" }}>Uploaded</span>
  }

  return (
    <>
      <style jsx global>{`
        html {
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
          width: 100%;
          overflow-x: hidden;
        }
        body {
          touch-action: manipulation;
          min-width: 100vw;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .application-summary-container {
            padding-left: 24px !important;
            padding-right: 24px !important;
          }
        }
        
        @media (max-width: 1024px) {
          .application-summary-container {
            margin-left: 0 !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          
          .header-grid {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 24px !important;
          }
        }
     
        @media (max-width: 768px) {
          .application-summary-container {
            padding: 16px !important;
            margin-left: 0 !important;
          }
          
          .header-grid {
            gap: 16px !important;
          }
        }
          
        
        @media (max-width: 480px) {
          .application-summary-container {
            padding: 12px !important;
            margin-left: 0 !important;
          }
        }
      `}</style>

      <div
        className="application-summary-container"
        style={{
          minHeight: "100vh",
          padding: "24px",
          width: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            padding: "0 32px",
            margin: "0 auto",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              padding: "32px",
              marginBottom: "32px",
              boxShadow: "0 20px 40px rgba(74, 53, 47, 0.1)",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-50%",
                right: "-20%",
                width: "400px",
                height: "400px",
                background: "radial-gradient(circle, rgba(166, 124, 82, 0.1) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
            />
            <div
              className="header-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "32px",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
              }}
            >
              {/* Left: Catalyst Verification Score Card (Package 7) */}
              <CatalystVerificationScoreCard profileData={formData} onEdit={handleEdit} />

              {/* Center: Title & Description */}
              <div style={{ textAlign: "center" }}>
                <h1
                  style={{
                    background: "linear-gradient(135deg, #4a352f, #7d5a50)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontSize: "36px",
                    fontWeight: "800",
                    margin: "0 0 8px 0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Catalyst Profile Summary
                </h1>
                <p
                  style={{
                    color: "#7d5a50",
                    fontSize: "18px",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  Verified Enterprise Support & Programme Dashboard
                </p>
              </div>

              {/* Right: Actions */}
              <div style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
                <button
                  onClick={handleEdit}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                    color: "#faf7f2",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 4px 16px rgba(166, 124, 82, 0.3)",
                    minWidth: "140px",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)"
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(166, 124, 82, 0.4)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(166, 124, 82, 0.3)"
                  }}
                >
                  <Edit size={16} /> Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Profile Sections */}
          <div
            style={{
              display: "grid",
              gap: "24px",
            }}
          >
            {/* Objectives & Context */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("objectives")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.objectives
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Compass size={24} color={expandedSections.objectives ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(18px, 2vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.objectives ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Objectives & Context
                  </h2>
                </div>
                {expandedSections.objectives ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.objectives && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                    <div style={{ background: "rgba(250, 247, 242, 0.8)", borderRadius: "12px", padding: "20px", border: "1px solid rgba(200, 182, 166, 0.2)" }}>
                      <span style={{ display: "block", fontSize: "13px", color: "#7d5a50", marginBottom: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Catalyst Activities
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {(summaryData?.catalystActivities || []).map((act, idx) => (
                          <span key={idx} style={{ background: "#7d5a50", color: "#ffffff", padding: "4px 12px", borderRadius: "999px", fontSize: "13px", fontWeight: "500", textTransform: "capitalize" }}>
                            {act.replace(/_/g, " ")}
                          </span>
                        ))}
                        {(!summaryData?.catalystActivities || summaryData.catalystActivities.length === 0) && (
                          <span style={{ color: "#a89482", fontSize: "14px" }}>None specified</span>
                        )}
                      </div>
                    </div>
                    <div style={{ background: "rgba(250, 247, 242, 0.8)", borderRadius: "12px", padding: "20px", border: "1px solid rgba(200, 182, 166, 0.2)" }}>
                      <span style={{ display: "block", fontSize: "13px", color: "#7d5a50", marginBottom: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Platform Objectives
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {(summaryData?.platformObjectives || []).map((obj, idx) => (
                          <span key={idx} style={{ background: "#a67c52", color: "#ffffff", padding: "4px 12px", borderRadius: "999px", fontSize: "13px", fontWeight: "500", textTransform: "capitalize" }}>
                            {obj.replace(/_/g, " ")}
                          </span>
                        ))}
                        {(!summaryData?.platformObjectives || summaryData.platformObjectives.length === 0) && (
                          <span style={{ color: "#a89482", fontSize: "14px" }}>None specified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Entity Overview */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("entityOverview")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.entityOverview
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Building size={24} color={expandedSections.entityOverview ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(18px, 2vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.entityOverview ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Entity Overview
                  </h2>
                </div>
                {expandedSections.entityOverview ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.entityOverview && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      { label: "Registered Name", value: summaryData?.registeredName },
                      { label: "Trading Name", value: summaryData?.tradingName },
                      { label: "Legal Entity Type", value: summaryData?.legalEntityType },
                      { label: "Registration Number", value: summaryData?.registrationNumber },
                      { label: "Industry Sector", value: summaryData?.industrySector },
                      { label: "Company Size", value: summaryData?.companySize },
                      { label: "Year Established", value: summaryData?.yearEstablished },
                      { label: "Website", value: summaryData?.website },
                      { label: "Brief Description", value: summaryData?.briefDescription },
                      {
                        label: "How did you hear about us?",
                        value:
                          summaryData?.referralSource === "other"
                            ? summaryData?.referralSourceOther
                            : summaryData?.referralSource,
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "20px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: "#7d5a50",
                            marginBottom: "8px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {item.label}
                        </span>
                        <span
                          style={{
                            fontSize: "15px",
                            color: "#4a352f",
                            fontWeight: "500",
                            lineHeight: "1.4",
                          }}
                        >
                          {item.value || "Not provided"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Details */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("contactDetails")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.contactDetails
                    ? "linear-gradient(135deg, #7d5a50, #4a352f)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Phone size={24} color={expandedSections.contactDetails ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(18px, 2vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.contactDetails ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Contact Details
                  </h2>
                </div>
                {expandedSections.contactDetails ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.contactDetails && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      { label: "Business Tel", value: summaryData?.businessTel },
                      { label: "Business Email", value: summaryData?.businessEmail },
                      { label: "Physical Address", value: summaryData?.physicalAddress },
                      { label: "Postal Address", value: summaryData?.postalAddress },
                      { label: "Website", value: summaryData?.contactWebsite },
                      { label: "LinkedIn Page", value: summaryData?.linkedin },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "20px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: "#7d5a50",
                            marginBottom: "8px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {item.label}
                        </span>
                        <span
                          style={{
                            fontSize: "15px",
                            color: "#4a352f",
                            fontWeight: "500",
                            lineHeight: "1.4",
                          }}
                        >
                          {item.value || "Not provided"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#5d4037",
                      marginTop: "30px",
                      marginBottom: "15px",
                    }}
                  >
                    Primary Contact
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      { label: "Title", value: summaryData?.primaryContactTitle },
                      { label: "Name", value: summaryData?.primaryContactName },
                      { label: "Surname", value: summaryData?.primaryContactSurname },
                      { label: "Position", value: summaryData?.primaryContactPosition },
                      { label: "Mobile", value: summaryData?.primaryContactMobile },
                      { label: "Email", value: summaryData?.primaryContactEmail },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "20px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: "#7d5a50",
                            marginBottom: "8px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {item.label}
                        </span>
                        <span
                          style={{
                            fontSize: "15px",
                            color: "#4a352f",
                            fontWeight: "500",
                            lineHeight: "1.4",
                          }}
                        >
                          {item.value || "Not provided"}
                        </span>
                      </div>
                    ))}
                  </div>
                  {(summaryData?.secondaryContactName || summaryData?.secondaryContactEmail) && (
                    <>
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: "600",
                          color: "#5d4037",
                          marginTop: "30px",
                          marginBottom: "15px",
                        }}
                      >
                        Secondary Contact
                      </h3>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                          gap: "20px",
                        }}
                      >
                        {[
                          { label: "Title", value: summaryData?.secondaryContactTitle },
                          { label: "Name", value: summaryData?.secondaryContactName },
                          { label: "Surname", value: summaryData?.secondaryContactSurname },
                          { label: "Position", value: summaryData?.secondaryContactPosition },
                          { label: "Mobile", value: summaryData?.secondaryContactMobile },
                          { label: "Email", value: summaryData?.secondaryContactEmail },
                        ].map((item, i) => (
                          <div
                            key={i}
                            style={{
                              background: "rgba(250, 247, 242, 0.8)",
                              borderRadius: "12px",
                              padding: "20px",
                              border: "1px solid rgba(200, 182, 166, 0.2)",
                              transition: "all 0.3s ease",
                            }}
                          >
                            <span
                              style={{
                                display: "block",
                                fontSize: "13px",
                                color: "#7d5a50",
                                marginBottom: "8px",
                                fontWeight: "600",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              {item.label}
                            </span>
                            <span
                              style={{
                                fontSize: "15px",
                                color: "#4a352f",
                                fontWeight: "500",
                                lineHeight: "1.4",
                              }}
                            >
                              {item.value || "Not provided"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Program Brief & Matching Preference */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("programmeSetup")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.programmeSetup
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Target size={24} color={expandedSections.programmeSetup ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(18px, 2vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.programmeSetup ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Programme Portfolio & Matching Preferences
                  </h2>
                </div>
                {expandedSections.programmeSetup ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.programmeSetup && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  {summaryData.programmes && summaryData.programmes.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                      {summaryData.programmes.map((prog, pIdx) => {
                        const brief = prog.programmeBrief || {}
                        const match = prog.matchingPreferences || {}
                        const app = prog.applicationBrief || {}

                        return (
                          <div
                            key={prog.id || pIdx}
                            style={{
                              background: "#ffffff",
                              borderRadius: "16px",
                              padding: "24px",
                              border: "1px solid rgba(200, 182, 166, 0.35)",
                              boxShadow: "0 8px 24px rgba(74, 53, 47, 0.06)",
                            }}
                          >
                            {/* Programme Header */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "12px",
                                borderBottom: "1px solid #f0e6d9",
                                paddingBottom: "16px",
                                marginBottom: "20px",
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    color: "#a67c52",
                                    textTransform: "uppercase",
                                    letterSpacing: "1px",
                                  }}
                                >
                                  Programme {pIdx + 1}
                                </span>
                                <h3
                                  style={{
                                    margin: "4px 0 0 0",
                                    fontSize: "20px",
                                    fontWeight: "700",
                                    color: "#4a352f",
                                  }}
                                >
                                  {prog.programmeName || brief.programmeName || `Programme #${pIdx + 1}`}
                                </h3>
                              </div>
                              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <span
                                  style={{
                                    background: "rgba(166, 124, 82, 0.15)",
                                    color: "#7d5a50",
                                    padding: "4px 12px",
                                    borderRadius: "999px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {prog.programmeType || "General"}
                                </span>
                                <span
                                  style={{
                                    background: prog.intakeStatus === "open" ? "#dcfce7" : "#fef3c7",
                                    color: prog.intakeStatus === "open" ? "#166534" : "#92400e",
                                    padding: "4px 12px",
                                    borderRadius: "999px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  Intake: {prog.intakeStatus || "Draft"}
                                </span>
                              </div>
                            </div>

                            {/* Programme Overview */}
                            <h4
                              style={{
                                fontSize: "14px",
                                fontWeight: "700",
                                color: "#7d5a50",
                                marginBottom: "12px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Programme Overview
                            </h4>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "14px",
                                marginBottom: "18px",
                              }}
                            >
                              {[
                                { label: "Lead", value: brief.programmeLead },
                                {
                                  label: "Duration",
                                  value: brief.durationNumber
                                    ? `${brief.durationNumber} ${brief.durationUnit || "months"}`
                                    : null,
                                },
                                { label: "Format", value: brief.programmeFormat },
                                { label: "Delivery Mode", value: brief.deliveryMode },
                                {
                                  label: "Capacity",
                                  value: brief.participantCapacity ? `${brief.participantCapacity} participants` : null,
                                },
                                { label: "Participation Cost", value: brief.participationCost },
                                { label: "Sponsor Organisation", value: brief.sponsorOrganisation },
                                { label: "Mandate", value: brief.primaryMandate },
                              ].map((it, idx) =>
                                it.value ? (
                                  <div
                                    key={idx}
                                    style={{
                                      background: "rgba(250, 247, 242, 0.8)",
                                      borderRadius: "10px",
                                      padding: "12px 16px",
                                      border: "1px solid rgba(200, 182, 166, 0.2)",
                                    }}
                                  >
                                    <span
                                      style={{
                                        display: "block",
                                        fontSize: "11px",
                                        color: "#7d5a50",
                                        fontWeight: "600",
                                        textTransform: "uppercase",
                                        marginBottom: "4px",
                                      }}
                                    >
                                      {it.label}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "14px",
                                        color: "#4a352f",
                                        fontWeight: "500",
                                        textTransform: "capitalize",
                                      }}
                                    >
                                      {String(it.value).replace(/_/g, " ")}
                                    </span>
                                  </div>
                                ) : null
                              )}
                            </div>

                            {brief.aboutProgramme && (
                              <div
                                style={{
                                  background: "rgba(250, 247, 242, 0.8)",
                                  borderRadius: "10px",
                                  padding: "14px 16px",
                                  border: "1px solid rgba(200, 182, 166, 0.2)",
                                  marginBottom: "18px",
                                }}
                              >
                                <span
                                  style={{
                                    display: "block",
                                    fontSize: "11px",
                                    color: "#7d5a50",
                                    fontWeight: "600",
                                    textTransform: "uppercase",
                                    marginBottom: "4px",
                                  }}
                                >
                                  About the Programme
                                </span>
                                <span style={{ fontSize: "14px", color: "#4a352f", lineHeight: "1.5" }}>
                                  {brief.aboutProgramme}
                                </span>
                              </div>
                            )}

                            {/* Matching Preferences Sub-block */}
                            <h4
                              style={{
                                fontSize: "14px",
                                fontWeight: "700",
                                color: "#7d5a50",
                                marginBottom: "12px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Matching & Target Criteria
                            </h4>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "14px",
                                marginBottom: "18px",
                              }}
                            >
                              {[
                                {
                                  label: "Lifecycle Stages",
                                  value: formatArray(match.acceptedLifecycleStages || match.businessLifecycleStage),
                                },
                                { label: "Sector Focus", value: formatArray(match.sectorFocus) },
                                { label: "Geographic Scope", value: match.geographicScope || match.geographicFocus },
                                {
                                  label: "Support Ticket Range",
                                  value:
                                    match.minimumSupportTicket || match.minTicket
                                      ? `${formatCurrency(match.minimumSupportTicket || match.minTicket)} – ${formatCurrency(match.maximumSupportTicket || match.maxTicket)}`
                                      : null,
                                },
                                { label: "Target Demographics", value: formatArray(match.demographics) },
                                { label: "B-BBEE Preference", value: formatArray(match.bbbeeLevel) },
                              ].map((it, idx) =>
                                it.value && it.value !== "None specified" ? (
                                  <div
                                    key={idx}
                                    style={{
                                      background: "rgba(250, 247, 242, 0.8)",
                                      borderRadius: "10px",
                                      padding: "12px 16px",
                                      border: "1px solid rgba(200, 182, 166, 0.2)",
                                    }}
                                  >
                                    <span
                                      style={{
                                        display: "block",
                                        fontSize: "11px",
                                        color: "#7d5a50",
                                        fontWeight: "600",
                                        textTransform: "uppercase",
                                        marginBottom: "4px",
                                      }}
                                    >
                                      {it.label}
                                    </span>
                                    <span style={{ fontSize: "14px", color: "#4a352f", fontWeight: "500" }}>
                                      {it.value}
                                    </span>
                                  </div>
                                ) : null
                              )}
                            </div>

                            {/* Application Details */}
                            {(app.instructionsForApplying ||
                              app.estimatedReviewTime ||
                              app.applicationWindow ||
                              app.evaluationCriteria) && (
                              <>
                                <h4
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "700",
                                    color: "#7d5a50",
                                    marginBottom: "12px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  Application & Intake Protocol
                                </h4>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                    gap: "14px",
                                  }}
                                >
                                  {[
                                    { label: "Application Window", value: app.applicationWindow },
                                    { label: "Review Time", value: app.estimatedReviewTime },
                                    { label: "Onboarding Time", value: app.programOnboardingTime },
                                    { label: "Selection Criteria", value: app.evaluationCriteria },
                                  ].map((it, idx) =>
                                    it.value ? (
                                      <div
                                        key={idx}
                                        style={{
                                          background: "rgba(250, 247, 242, 0.8)",
                                          borderRadius: "10px",
                                          padding: "12px 16px",
                                          border: "1px solid rgba(200, 182, 166, 0.2)",
                                        }}
                                      >
                                        <span
                                          style={{
                                            display: "block",
                                            fontSize: "11px",
                                            color: "#7d5a50",
                                            fontWeight: "600",
                                            textTransform: "uppercase",
                                            marginBottom: "4px",
                                          }}
                                        >
                                          {it.label}
                                        </span>
                                        <span style={{ fontSize: "14px", color: "#4a352f", fontWeight: "500" }}>
                                          {it.value}
                                        </span>
                                      </div>
                                    ) : null
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div>
                      {/* Legacy Program Details */}
                      <div style={{ marginBottom: "32px" }}>
                        <h3
                          style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "#7d5a50",
                            marginBottom: "20px",
                            borderBottom: "2px solid #c8b6a6",
                            paddingBottom: "8px",
                          }}
                        >
                          Program Details
                        </h3>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "20px",
                          }}
                        >
                          {[
                            { label: "Program Name", value: summaryData?.programName },
                            { label: "Program Website", value: summaryData?.programWebsite },
                            {
                              label: "Program Duration",
                              value: summaryData?.programDuration ? `${summaryData.programDuration} years` : null,
                            },
                            { label: "About the Program", value: summaryData?.aboutProgram },
                            { label: "Program Goals", value: summaryData?.programGoals },
                            { label: "Support Framework", value: summaryData?.supportFramework },
                          ].map(
                            (item, i) =>
                              item.value && (
                                <div
                                  key={i}
                                  style={{
                                    background: "rgba(250, 247, 242, 0.8)",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    border: "1px solid rgba(200, 182, 166, 0.2)",
                                    transition: "all 0.3s ease",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "block",
                                      fontSize: "13px",
                                      color: "#7d5a50",
                                      marginBottom: "8px",
                                      fontWeight: "600",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    {item.label}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "15px",
                                      color: "#4a352f",
                                      fontWeight: "500",
                                      lineHeight: "1.4",
                                    }}
                                  >
                                    {item.value || "Not provided"}
                                  </span>
                                </div>
                              )
                          )}
                        </div>
                      </div>

                      {/* Support Focus */}
                      <div style={{ marginBottom: "32px" }}>
                        <h3
                          style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "#7d5a50",
                            marginBottom: "20px",
                            borderBottom: "2px solid #c8b6a6",
                            paddingBottom: "8px",
                          }}
                        >
                          Support Focus
                        </h3>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "20px",
                          }}
                        >
                          {[
                            { label: "Support Focus", value: formatArray(summaryData?.supportFocus) },
                            { label: "Support Focus Subtype", value: formatArray(summaryData?.supportFocusSubtype) },
                            { label: "Target Business Stage", value: formatArray(summaryData?.targetBusinessStage) },
                            { label: "Minimum Support Ticket", value: summaryData?.minimumSupportTicket },
                            { label: "Maximum Support Ticket", value: summaryData?.maximumSupportTicket },
                          ].map(
                            (item, i) =>
                              item.value &&
                              item.value !== "None specified" && (
                                <div
                                  key={i}
                                  style={{
                                    background: "rgba(250, 247, 242, 0.8)",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    border: "1px solid rgba(200, 182, 166, 0.2)",
                                    transition: "all 0.3s ease",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "block",
                                      fontSize: "13px",
                                      color: "#7d5a50",
                                      marginBottom: "8px",
                                      fontWeight: "600",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    {item.label}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "15px",
                                      color: "#4a352f",
                                      fontWeight: "500",
                                      lineHeight: "1.4",
                                    }}
                                  >
                                    {item.value}
                                  </span>
                                </div>
                              )
                          )}
                        </div>
                      </div>

                      {/* Target Beneficiaries */}
                      <div style={{ marginBottom: "32px" }}>
                        <h3
                          style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "#7d5a50",
                            marginBottom: "20px",
                            borderBottom: "2px solid #c8b6a6",
                            paddingBottom: "8px",
                          }}
                        >
                          Target Beneficiaries
                        </h3>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "20px",
                          }}
                        >
                          {[
                            { label: "Demographics", value: formatArray(summaryData?.demographics) },
                            { label: "B-BBEE Level", value: formatArray(summaryData?.bbbeeLevel) },
                          ].map(
                            (item, i) =>
                              item.value &&
                              item.value !== "None specified" && (
                                <div
                                  key={i}
                                  style={{
                                    background: "rgba(250, 247, 242, 0.8)",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    border: "1px solid rgba(200, 182, 166, 0.2)",
                                    transition: "all 0.3s ease",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "block",
                                      fontSize: "13px",
                                      color: "#7d5a50",
                                      marginBottom: "8px",
                                      fontWeight: "600",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    {item.label}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "15px",
                                      color: "#4a352f",
                                      fontWeight: "500",
                                      lineHeight: "1.4",
                                    }}
                                  >
                                    {item.value}
                                  </span>
                                </div>
                              )
                          )}
                        </div>
                      </div>

                      {/* General Preferences */}
                      <div>
                        <h3
                          style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "#7d5a50",
                            marginBottom: "20px",
                            borderBottom: "2px solid #c8b6a6",
                            paddingBottom: "8px",
                          }}
                        >
                          General Preferences
                        </h3>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "20px",
                          }}
                        >
                          {[
                            { label: "Legal Entity", value: formatArray(summaryData?.legalEntity) },
                            {
                              label: "Business Lifecycle Stage",
                              value: formatArray(summaryData?.businessLifecycleStage),
                            },
                            { label: "Sector Focus", value: formatArray(summaryData?.sectorFocus) },
                            { label: "Sector Exclusions", value: formatArray(summaryData?.sectorExclusions) },
                            { label: "Geographic Focus", value: formatArray(summaryData?.geographicFocus) },
                            { label: "Selected Countries", value: formatArray(summaryData?.selectedCountries) },
                            { label: "Selected Provinces", value: formatArray(summaryData?.selectedProvinces) },
                          ].map(
                            (item, i) =>
                              item.value &&
                              item.value !== "None specified" && (
                                <div
                                  key={i}
                                  style={{
                                    background: "rgba(250, 247, 242, 0.8)",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    border: "1px solid rgba(200, 182, 166, 0.2)",
                                    transition: "all 0.3s ease",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "block",
                                      fontSize: "13px",
                                      color: "#7d5a50",
                                      marginBottom: "8px",
                                      fontWeight: "600",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    {item.label}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "15px",
                                      color: "#4a352f",
                                      fontWeight: "500",
                                      lineHeight: "1.4",
                                    }}
                                  >
                                    {item.value}
                                  </span>
                                </div>
                              )
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Application Brief */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("applicationBrief")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.applicationBrief
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <FileText size={24} color={expandedSections.applicationBrief ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(18px, 2vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.applicationBrief ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Application Brief
                  </h2>
                </div>
                {expandedSections.applicationBrief ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.applicationBrief && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      { label: "Instructions for Applicants", value: summaryData?.instructionsForApplying },
                      { label: "Estimated Review Time", value: summaryData?.estimatedReviewTime },
                      { label: "Program Onboarding Time", value: summaryData?.programOnboardingTime },
                      { label: "Application Window", value: summaryData?.applicationWindow },
                      { label: "Core Documents", value: formatArray(summaryData?.coreDocuments) },
                      { label: "Other Core Documents", value: summaryData?.coreDocumentsOther },
                      { label: "Grant Documents", value: formatArray(summaryData?.grantDocuments) },
                      { label: "Training Documents", value: formatArray(summaryData?.trainingDocuments) },
                      { label: "Impact Documents", value: formatArray(summaryData?.impactDocuments) },
                      { label: "Other Additional Documents", value: summaryData?.otherAdditionalDocuments },
                      { label: "Selection Criteria", value: summaryData?.evaluationCriteria },
                      { label: "Impact Alignment", value: summaryData?.impactAlignment },
                    ].map((item, i) => (
                      item.value && (
                        <div
                          key={i}
                          style={{
                            background: "rgba(250, 247, 242, 0.8)",
                            borderRadius: "12px",
                            padding: "20px",
                            border: "1px solid rgba(200, 182, 166, 0.2)",
                            transition: "all 0.3s ease",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              fontSize: "13px",
                              color: "#7d5a50",
                              marginBottom: "8px",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {item.label}
                          </span>
                          <span
                            style={{
                              fontSize: "15px",
                              color: "#4a352f",
                              fontWeight: "500",
                              lineHeight: "1.4",
                            }}
                          >
                            {item.value || "Not provided"}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Document Upload */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("documentUpload")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.documentUpload
                    ? "linear-gradient(135deg, #7d5a50, #4a352f)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <UploadCloud size={24} color={expandedSections.documentUpload ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(18px, 2vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.documentUpload ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Document Upload
                  </h2>
                </div>
                {expandedSections.documentUpload ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.documentUpload && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {documentUploadList.map((docItem, i) => (
                      <div
                        key={docItem.id}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "20px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "4px",
                              background:
                                summaryData?.[docItem.id] && summaryData?.[docItem.id].length > 0
                                  ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                                  : "#e5e5e5",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {summaryData?.[docItem.id] && summaryData?.[docItem.id].length > 0 ? "✓" : ""}
                          </div>
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#7d5a50",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {docItem.label}
                          </span>
                        </div>
                        {renderDocumentStatus(summaryData?.[docItem.id])}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Declaration & Consent */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("declarationConsent")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.declarationConsent
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <ShieldCheck size={24} color={expandedSections.declarationConsent ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(18px, 2vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.declarationConsent ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Declaration & Consent
                  </h2>
                </div>
                {expandedSections.declarationConsent ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.declarationConsent && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      {
                        label: "Declaration of Accuracy",
                        value: summaryData?.accuracy,
                        description: "I confirm that all information provided is accurate and complete.",
                      },
                      {
                        label: "Consent for Data Processing",
                        value: summaryData?.dataProcessing,
                        description: "I consent to the collection and processing of my data in accordance with POPIA regulations.",
                      },
                      {
                        label: "Platform Terms & Promotion",
                        value: summaryData?.termsConditions,
                        description: "Consent to platform terms and directory listing.",
                      },
                      ...(summaryData?.representativeName
                        ? [
                            {
                              label: "Authorised Representative",
                              value: true,
                              description: `${summaryData.representativeName} (${summaryData.representativeRole || "Authorised Officer"})`,
                            },
                          ]
                        : []),
                      ...(summaryData?.listingVisibility
                        ? [
                            {
                              label: "Listing Visibility",
                              value: true,
                              description: `Configured to: ${String(summaryData.listingVisibility).replace(/_/g, " ")}`,
                            },
                          ]
                        : []),
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "20px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "4px",
                              background: item.value ? "linear-gradient(135deg, #a67c52, #7d5a50)" : "#e5e5e5",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {item.value ? "✓" : ""}
                          </div>
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#7d5a50",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {item.label}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "400",
                            lineHeight: "1.4",
                            display: "block",
                          }}
                        >
                          {item.description}
                        </span>
                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: item.value ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {item.value ? "Agreed" : "Not Agreed"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CatalystProfileSummary