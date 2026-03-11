"use client"
import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Building,
  Phone,
  Target,
  ClipboardList,
  FileText,
  UploadCloud,
  ShieldCheck,
} from "lucide-react"
import { documentsList as documentUploadList } from "./catalyst-document-upload"

const CatalystProfileSummary = ({ formData, onEdit }) => {
  const [expandedSections, setExpandedSections] = useState({
    instructions: false,
    entityOverview: false,
    contactDetails: false,
    generalMatchingPreference: false,
    programmeDetails: false,
    applicationBrief: false,
    documentUpload: false,
    declarationConsent: false,
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
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
    const numericValue = Number.parseFloat(value.replace(/R|,/g, ""))
    if (isNaN(numericValue)) return value
    return `R${numericValue.toLocaleString("en-ZA")}`
  }

  const handleEdit = () => {
    if (onEdit) onEdit()
  }

  const getSummaryData = () => {
    return {
      registeredName: formData?.entityOverview?.registeredName,
      tradingName: formData?.entityOverview?.tradingName,
      legalEntityType: formData?.entityOverview?.legalEntityType,
      registrationNumber: formData?.entityOverview?.registrationNumber,
      industrySector: formData?.entityOverview?.industrySector,
      companySize: formData?.entityOverview?.companySize,
      yearEstablished: formData?.entityOverview?.yearEstablished,
      website: formData?.entityOverview?.website,
      briefDescription: formData?.entityOverview?.briefDescription,
      referralSource: formData?.entityOverview?.referralSource,
      referralSourceOther: formData?.entityOverview?.referralSourceOther,

      businessTel: formData?.contactDetails?.businessTel,
      businessEmail: formData?.contactDetails?.businessEmail,
      physicalAddress: formData?.contactDetails?.physicalAddress,
      postalAddress: formData?.contactDetails?.postalAddress,
      contactWebsite: formData?.contactDetails?.website,
      linkedin: formData?.contactDetails?.linkedin,
      primaryContactTitle: formData?.contactDetails?.primaryContactTitle,
      primaryContactName: formData?.contactDetails?.primaryContactName,
      primaryContactSurname: formData?.contactDetails?.primaryContactSurname,
      primaryContactPosition: formData?.contactDetails?.primaryContactPosition,
      primaryContactMobile: formData?.contactDetails?.primaryContactMobile,
      primaryContactEmail: formData?.contactDetails?.primaryContactEmail,
      secondaryContactTitle: formData?.contactDetails?.secondaryContactTitle,
      secondaryContactName: formData?.contactDetails?.secondaryContactName,
      secondaryContactSurname: formData?.contactDetails?.secondaryContactSurname,
      secondaryContactPosition: formData?.contactDetails?.secondaryContactPosition,
      secondaryContactMobile: formData?.contactDetails?.secondaryContactMobile,
      secondaryContactEmail: formData?.contactDetails?.secondaryContactEmail,

      programStructure: formData?.generalMatchingPreference?.programStructure,
      legalEntityFit: formData?.generalMatchingPreference?.legalEntityFit,
      programStage: formData?.generalMatchingPreference?.programStage,
      supportFocus: formData?.generalMatchingPreference?.supportFocus,
      supportFocusSubtype: formData?.generalMatchingPreference?.supportFocusSubtype,
      sectorFocus: formData?.generalMatchingPreference?.sectorFocus,
      sectorExclusions: formData?.generalMatchingPreference?.sectorExclusions,
      geographicFocus: formData?.generalMatchingPreference?.geographicFocus,
      selectedProvinces: formData?.generalMatchingPreference?.selectedProvinces,
      selectedCountries: formData?.generalMatchingPreference?.selectedCountries,
      targetDemographics: formData?.generalMatchingPreference?.targetDemographics,

      programs: formData?.programmeDetails?.programs || [],

      overviewObjectives: formData?.applicationBrief?.overviewObjectives,
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

      ...Object.fromEntries(
        documentUploadList.map((docItem) => [docItem.id, formData?.documentUpload?.[docItem.id]])
      ),

      accuracy: formData?.declarationConsent?.accuracy,
      dataProcessing: formData?.declarationConsent?.dataProcessing,
      termsConditions: formData?.declarationConsent?.termsConditions,
    }
  }

  const summaryData = getSummaryData()

  const renderDocumentStatus = (docArray) => {
    if (!docArray || docArray.length === 0) {
      return <span style={{ color: "#ef4444", fontWeight: "600" }}>Not uploaded</span>
    }
    return (
      <span style={{ color: "#22c55e", fontWeight: "600" }}>
        Uploaded ({docArray.length} file{docArray.length > 1 ? "s" : ""})
      </span>
    )
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
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div>
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
                  Complete Your Organization's Profile
                </p>
              </div>
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
                  e.target.style.transform = "translateY(-2px)"
                  e.target.style.boxShadow = "0 8px 24px rgba(166, 124, 82, 0.4)"
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)"
                  e.target.style.boxShadow = "0 4px 16px rgba(166, 124, 82, 0.3)"
                }}
              >
                <Edit size={16} /> Edit Profile
              </button>
            </div>
          </div>

          {/* Profile Sections */}
          <div
            style={{
              display: "grid",
              gap: "24px",
            }}
          >
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

            {/* General Matching Preference */}
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
                onClick={() => toggleSection("generalMatchingPreference")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.generalMatchingPreference
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Target size={24} color={expandedSections.generalMatchingPreference ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(18px, 2vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.generalMatchingPreference ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    General Matching Preference
                  </h2>
                </div>
                {expandedSections.generalMatchingPreference ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.generalMatchingPreference && (
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
                      { label: "Program Structure", value: summaryData?.programStructure },
                      { label: "Legal Entity Fit", value: summaryData?.legalEntityFit },
                      { label: "Program Stage", value: summaryData?.programStage },
                      { label: "Support Focus", value: summaryData?.supportFocus },
                      { label: "Support Focus Subtype", value: summaryData?.supportFocusSubtype },
                      { label: "Sector Focus", value: formatArray(summaryData?.sectorFocus) },
                      { label: "Sector Exclusions", value: formatArray(summaryData?.sectorExclusions) },
                      { label: "Geographic Focus", value: formatArray(summaryData?.geographicFocus) },
                      { label: "Selected Provinces", value: formatArray(summaryData?.selectedProvinces) },
                      { label: "Selected Countries", value: formatArray(summaryData?.selectedCountries) },
                      { label: "Target Demographics", value: formatArray(summaryData?.targetDemographics) },
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
                          {item.value || "Not specified"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Programme Details */}
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
                onClick={() => toggleSection("programmeDetails")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.programmeDetails
                    ? "linear-gradient(135deg, #7d5a50, #4a352f)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <ClipboardList size={24} color={expandedSections.programmeDetails ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(18px, 2vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.programmeDetails ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Programme Details
                  </h2>
                </div>
                {expandedSections.programmeDetails ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.programmeDetails && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  {summaryData.programs.length > 0 ? (
                    summaryData.programs.map((program, index) => (
                      <div
                        key={index}
                        style={{ marginBottom: "30px", paddingBottom: "20px", borderBottom: "1px solid #e8d5b7" }}
                      >
                        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#5d4037", marginBottom: "15px" }}>
                          Program {index + 1}
                        </h3>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "20px",
                          }}
                        >
                          {[
                            { label: "Program Name", value: program.name },
                            { label: "Program Budget", value: formatCurrency(program.budget) },
                            { label: "Target Beneficiaries", value: formatArray(program.targetBeneficiaries) },
                            { label: "Government Backed", value: program.governmentBacked ? "Yes" : "No" },
                            { label: "Funding Sources", value: program.fundingSources },
                            { label: "Program Structure", value: program.programStructure },
                            {
                              label: "Program Legal Structure",
                              value:
                                program.programLegalStructure === "other"
                                  ? program.programLegalStructureOther
                                  : program.programLegalStructure,
                            },
                            { label: "Target Business Stage", value: program.businessStage },
                            { label: "Program Budget Category", value: program.programBudgetCategory },
                            { label: "Average Support Amount", value: formatCurrency(program.averageSupportAmount) },
                            { label: "Minimum Support", value: formatCurrency(program.minimumSupport) },
                            { label: "Maximum Support", value: formatCurrency(program.maximumSupport) },
                            {
                              label: "Provides Follow-Up Support",
                              value: program.providesFollowUp ? `Yes (${program.followUpPercentage || "N/A"}%)` : "No",
                            },
                            { label: "Continued Support Rights", value: program.continuedSupport ? "Yes" : "No" },
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
                    ))
                  ) : (
                    <p style={{ color: "#7d5a50", fontSize: "15px" }}>No program details provided.</p>
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
                      { label: "Program Overview and Objectives", value: summaryData?.overviewObjectives },
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
                        description: "I consent to the collection and processing of my data as described.",
                      },
                      {
                        label: "Opt-in for Promotional Visibility",
                        value: summaryData?.termsConditions,
                        description: "We consent to our program being listed publicly.",
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