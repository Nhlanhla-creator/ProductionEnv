"use client"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Edit, Building2, Mail, Briefcase, FileText, Shield } from "lucide-react"

const ProgramSponsorProfileSummary = ({ formData, onEdit }) => {
  const [expandedSections, setExpandedSections] = useState({
    entityOverview: false,
    contactDetails: false,
    programDetails: false,
    requiredDocuments: false,
    declarationConsent: false,
  })

  // Add sidebar state management
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Monitor sidebar state changes
  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    // Check initial state
    checkSidebarState()

    // Watch for changes
    const observer = new MutationObserver(checkSidebarState)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  // Get responsive container styles
  const getContainerStyles = () => ({
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    padding: `70px 20px 20px ${isSidebarCollapsed ? "100px" : "270px"}`,
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
    background: "linear-gradient(135deg, #faf7f2 0%, #f5f0e1 50%, #f0e6d9 100%)",
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
      return arr
        .map((item) => {
          // Check if the item is an object with a 'name' property (like file metadata)
          if (typeof item === "object" && item !== null && "name" in item) {
            return item.name // Return the file name
          }
          // Otherwise, assume it's a string and trim it
          return String(item).trim()
        })
        .filter((item) => item && item.trim()) // Filter out empty strings after processing
        .join(" • ")
    }
    return String(arr) // Ensure non-array values are converted to string
  }

  const handleEdit = () => {
    if (onEdit) onEdit()
  }

  const getSummaryData = () => {
    const entityOverview = formData?.entityOverview || {}
    const contactDetails = formData?.contactDetails || {}
    const programDetails = formData?.programDetails || {}
    const requiredDocuments = formData?.requiredDocuments || {}
    const declarationConsent = formData?.declarationConsent || {}

    return {
      // Entity Overview (from ProgramSponsorEntityOverview.jsx)
      organizationName: entityOverview.organizationName,
      entityType: entityOverview.entityType,
      registrationNumber: entityOverview.registrationNumber,
      regionCovered: entityOverview.regionCovered, // This is an array

      // Contact Details (from ProgramSponsorContactDetails.jsx)
      primaryContactName: contactDetails.primaryContactName,
      jobTitle: contactDetails.jobTitle,
      emailAddress: contactDetails.emailAddress,
      phoneNumber: contactDetails.phoneNumber,
      secondaryContactName: contactDetails.secondaryContactName,
      secondaryEmail: contactDetails.secondaryEmail,
      secondaryPhone: contactDetails.secondaryPhone,

      // Program Details (from ProgramSponsorProgramDetails.jsx)
      programmeName: programDetails.programmeName,
      duration: programDetails.duration,
      stipendValue: programDetails.stipendValue,
      totalInternsPlaced: programDetails.totalInternsPlaced,
      smeContribution: programDetails.smeContribution,
      reportingPreference: programDetails.reportingPreference,

      // Required Documents (from ProgramSponsorRequiredDocuments.jsx)
      companyRegistrationDocuments: requiredDocuments.companyRegistrationDocuments,
      idOfFundLead: requiredDocuments.idOfFundLead,
      investmentMandateOrProgrammeBrochures: requiredDocuments.investmentMandateOrProgrammeBrochures,

      // Declaration & Consent (from ProgramSponsorDeclarationConsent.jsx)
      accuracy: declarationConsent.accuracy,
      dataProcessing: declarationConsent.dataProcessing,
      termsConditions: declarationConsent.termsConditions,
      communicationConsent: declarationConsent.communicationConsent,
      reportingCompliance: declarationConsent.reportingCompliance,
    }
  }

  const summaryData = getSummaryData()

  const handleNavigate = () => {
    // Add your navigation logic here
  }

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-16px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 1000px;
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
          
          .summary-section-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
          }
        }
        
        @media (max-width: 768px) {
          .application-summary-container {
            padding: 16px !important;
          }
          
          .header-grid {
            gap: 16px !important;
          }
          
          .section-header {
            padding: 16px 20px !important;
          }
          
          .section-content {
            padding: 20px !important;
          }
          
          .summary-item {
            padding: 16px !important;
          }
        }
        
        @media (max-width: 480px) {
          .application-summary-container {
            padding: 12px !important;
          }
          
          .header-grid h1 {
            font-size: 28px !important;
          }
          
          .header-grid p {
            font-size: 16px !important;
          }
          
          .section-header h2 {
            font-size: 18px !important;
          }
          
          .summary-section-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div
        className="application-summary-container"
        style={getContainerStyles()}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
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
              marginBottom: "24px",
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
                  Program Sponsor Profile Summary
                </h1>
                <p
                  style={{
                    color: "#7d5a50",
                    fontSize: "18px",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  Complete Program Sponsor Application Profile
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

          {/* Profile Sections */}
          <div
            style={{
              display: "grid",
              gap: "16px",
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
                className="section-header"
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
                  <Building2 size={24} color={expandedSections.entityOverview ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
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
                  className="section-content"
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    className="summary-section-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      { label: "Organisation Name", value: summaryData?.organizationName },
                      { label: "Entity Type", value: summaryData?.entityType },
                      { label: "Registration Number", value: summaryData?.registrationNumber },
                      { label: "Region Covered", value: formatArray(summaryData?.regionCovered) },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="summary-item"
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
                className="section-header"
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
                  <Mail size={24} color={expandedSections.contactDetails ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
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
                  className="section-content"
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    className="summary-section-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      { label: "Primary Contact Name", value: summaryData?.primaryContactName },
                      { label: "Job Title", value: summaryData?.jobTitle },
                      { label: "Email Address", value: summaryData?.emailAddress },
                      { label: "Phone Number", value: summaryData?.phoneNumber },
                      { label: "Secondary Contact Name", value: summaryData?.secondaryContactName },
                      { label: "Secondary Email", value: summaryData?.secondaryEmail },
                      { label: "Secondary Phone", value: summaryData?.secondaryPhone },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="summary-item"
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

            {/* Program Details */}
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
                className="section-header"
                onClick={() => toggleSection("programDetails")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.programDetails
                    ? "linear-gradient(135deg, #c8b6a6, #a67c52)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Briefcase size={24} color={expandedSections.programDetails ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "700",
                      color: expandedSections.programDetails ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Program Details
                  </h2>
                </div>
                {expandedSections.programDetails ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.programDetails && (
                <div
                  className="section-content"
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    className="summary-section-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      { label: "Programme Name", value: summaryData?.programmeName },
                      {
                        label: "Duration",
                        value: summaryData?.duration ? `${summaryData.duration} months` : "Not specified",
                      },
                      { label: "Stipend Value", value: summaryData?.stipendValue || "N/A" },
                      { label: "Total Interns Placed This Year", value: summaryData?.totalInternsPlaced },
                      { label: "SME Contribution", value: summaryData?.smeContribution || "Not specified" },
                      { label: "Reporting Preference", value: summaryData?.reportingPreference },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="summary-item"
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

            {/* Required Documents */}
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
                className="section-header"
                onClick={() => toggleSection("requiredDocuments")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.requiredDocuments
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <FileText size={24} color={expandedSections.requiredDocuments ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "700",
                      color: expandedSections.requiredDocuments ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Required Documents
                  </h2>
                </div>
                {expandedSections.requiredDocuments ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.requiredDocuments && (
                <div
                  className="section-content"
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    className="summary-section-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      {
                        label: "Company Registration Documents",
                        value: summaryData?.companyRegistrationDocuments,
                        status: summaryData?.companyRegistrationDocuments?.length > 0 ? "complete" : "pending",
                      },
                      {
                        label: "ID of Fund Lead",
                        value: summaryData?.idOfFundLead,
                        status: summaryData?.idOfFundLead?.length > 0 ? "complete" : "pending",
                      },
                      {
                        label: "Investment Mandate or Programme Brochures",
                        value: summaryData?.investmentMandateOrProgrammeBrochures,
                        status: summaryData?.investmentMandateOrProgrammeBrochures?.length > 0 ? "complete" : "pending",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="summary-item"
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
                                item.status === "complete" ? "linear-gradient(135deg, #a67c52, #7d5a50)" : "#e5e5e5",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {item.status === "complete" ? "✓" : ""}
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
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: item.status === "complete" ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {formatArray(item.value) || "Not uploaded"}
                        </div>
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
                className="section-header"
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
                  <Shield size={24} color={expandedSections.declarationConsent ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
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
                  className="section-content"
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    className="summary-section-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      {
                        label: "Accuracy Declaration",
                        value: summaryData?.accuracy,
                        description: "Declaration that all information provided is accurate and truthful.",
                      },
                      {
                        label: "Data Processing Consent",
                        value: summaryData?.dataProcessing,
                        description: "Consent to process personal data for program matching and administration.",
                      },
                      {
                        label: "Communication Consent",
                        value: summaryData?.communicationConsent,
                        description: "Consent to receive communications regarding programs and opportunities.",
                      },
                      {
                        label: "Reporting Compliance",
                        value: summaryData?.reportingCompliance,
                        description: "Agreement to comply with reporting requirements for programs.",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="summary-item"
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

          {/* Footer */}
          <div
            style={{
              marginTop: "32px",
              textAlign: "center",
              background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
              backdropFilter: "blur(20px)",
              borderRadius: "20px",
              padding: "32px",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
            }}
          >
            <button
              onClick={handleNavigate}
              style={{
                padding: "16px 32px",
                background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                color: "#faf7f2",
                border: "none",
                borderRadius: "16px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 8px 24px rgba(166, 124, 82, 0.3)",
                minWidth: "200px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)"
                e.currentTarget.style.boxShadow = "0 16px 40px rgba(166, 124, 82, 0.4)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(166, 124, 82, 0.3)"
              }}
            >
              🚀 Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProgramSponsorProfileSummary