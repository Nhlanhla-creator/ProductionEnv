"use client"
import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Building,
  Phone,
  Briefcase,
  TrendingUp,
  UploadCloud,
} from "lucide-react"

const documentUploadList = [
  { id: "cipcRegistration", label: "CIPC Registration Document" },
  { id: "taxCompliancePin", label: "Tax Compliance PIN" },
  { id: "companyProfile", label: "Company Profile (PDF)" },
  { id: "logo", label: "Company Logo" },
  { id: "proofOfAddress", label: "Proof of Address" },
  { id: "vatCertificate", label: "VAT Certificate" },
  { id: "bbbeeCertificate", label: "B-BBEE Certificate" },
  { id: "fspLicence", label: "FSP Licence / Partner Details" },
  { id: "professionalIndemnityInsurance", label: "Professional Indemnity Insurance" },
  { id: "isoCertifications", label: "ISO Certifications" },
  { id: "industryAccreditations", label: "Industry Accreditations" },
  { id: "capabilityStatement", label: "Capability Statement" },
  { id: "caseStudies", label: "Case Studies" },
  { id: "clientReferences", label: "Client References" },
  { id: "brochure", label: "Brochure" },
  { id: "serviceCatalogue", label: "Service Catalogue" },
]

export default function CMFProfileSummary({ data, formData, onEdit }) {
  const profile = data || formData || {}

  const [expandedSections, setExpandedSections] = useState({
    entityOverview: true,
    contactDetails: true,
    facilitationOffering: true,
    investmentPreference: false,
    documentsStatus: false,
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
      return arr.filter((item) => item && String(item).trim()).join(" • ")
    }
    return String(arr)
  }

  const handleEdit = () => {
    if (onEdit) onEdit()
  }

  const entity = profile.entityOverview || {}
  const contact = profile.contactDetails || {}
  const products = profile.productsServices || {}
  const fundDetails = profile.fundDetails || {}
  const investmentPrefs = profile.generalInvestmentPreference || {}
  const documents = profile.documents || {}

  const renderDocumentStatus = (docArray) => {
    const hasFiles = docArray && docArray.length > 0
    if (!hasFiles) {
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
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 1024px) {
          .cmf-summary-container {
            padding: 16px !important;
          }
          .cmf-header-grid {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
        }
      `}</style>

      <div
        className="cmf-summary-container"
        style={{
          minHeight: "100vh",
          padding: "24px",
          width: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(250, 247, 242, 0.95), rgba(245, 240, 225, 0.95))",
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
                background: "radial-gradient(circle, rgba(166, 124, 82, 0.12) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
            />
            <div
              className="cmf-header-grid"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div>
                <div style={{ fontSize: "13px", color: "#a67c52", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>
                  Capital & Market Facilitator Summary
                </div>
                <h1
                  style={{
                    background: "linear-gradient(135deg, #4a352f, #7d5a50)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontSize: "clamp(24px, 4vw, 36px)",
                    fontWeight: "800",
                    margin: "0 0 8px 0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {entity.registeredName || "CMF Profile Summary"}
                </h1>
                {entity.tradingName && entity.tradingName !== entity.registeredName && (
                  <p style={{ color: "#7d5a50", fontSize: "16px", margin: 0, fontWeight: "500" }}>
                    Trading as: {entity.tradingName}
                  </p>
                )}
              </div>
              <button
                onClick={handleEdit}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 22px",
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

          {/* Profile Sections Grid */}
          <div style={{ display: "grid", gap: "24px" }}>
            {/* 1. Entity Overview */}
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
                      { label: "Registered Name", value: entity.registeredName },
                      { label: "Trading Name", value: entity.tradingName },
                      { label: "Registration Number", value: entity.registrationNumber },
                      { label: "Entity Type", value: entity.entityType },
                      { label: "Legal Structure", value: entity.legalStructure },
                      { label: "Entity Size", value: entity.entitySize },
                      { label: "Years in Operation", value: entity.yearsInOperation ? `${entity.yearsInOperation} Years` : null },
                      { label: "Operation Stage", value: entity.operationStage },
                      { label: "Economic Sectors", value: formatArray(entity.economicSectors) },
                      { label: "Operating Countries", value: formatArray(entity.operatingCountries) },
                      { label: "Operating Provinces", value: formatArray(entity.operatingProvinces) },
                      { label: "Industry Associations", value: formatArray(entity.industryAssociations) },
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

                  {entity.businessDescription && (
                    <div
                      style={{
                        marginTop: "20px",
                        background: "rgba(250, 247, 242, 0.8)",
                        borderRadius: "12px",
                        padding: "20px",
                        border: "1px solid rgba(200, 182, 166, 0.2)",
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
                        Business Description
                      </span>
                      <span
                        style={{
                          fontSize: "15px",
                          color: "#4a352f",
                          fontWeight: "500",
                          lineHeight: "1.6",
                        }}
                      >
                        {entity.businessDescription}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Contact Details */}
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
                      { label: "Primary Contact", value: `${contact.contactTitle || ""} ${contact.contactName || ""}`.trim() },
                      { label: "Position", value: contact.position },
                      { label: "Business Phone", value: contact.businessPhone },
                      { label: "Mobile", value: contact.mobile },
                      { label: "Email", value: contact.email },
                      { label: "Physical Address", value: contact.physicalAddress },
                      { label: "Postal Address", value: contact.postalAddress },
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

            {/* 3. Facilitation Offering & Services */}
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
                onClick={() => toggleSection("facilitationOffering")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.facilitationOffering
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Briefcase size={24} color={expandedSections.facilitationOffering ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(18px, 2vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.facilitationOffering ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Facilitation Offering & Services
                  </h2>
                </div>
                {expandedSections.facilitationOffering ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.facilitationOffering && (
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
                      { label: "Offering Type", value: products.offeringType },
                      { label: "Product Categories", value: formatArray(products.productCategories) },
                      { label: "Service Categories", value: formatArray(products.serviceCategories) },
                      { label: "Delivery Modes", value: formatArray(products.deliveryModes) },
                      {
                        label: "Lead Time Range",
                        value:
                          products.minLeadTime && products.maxLeadTime
                            ? `${products.minLeadTime} ${products.minLeadTimeUnit || "days"} - ${products.maxLeadTime} ${products.maxLeadTimeUnit || "days"}`
                            : null,
                      },
                      { label: "Target Market", value: products.targetMarket },
                      { label: "Key Institutional Clients", value: formatArray(products.keyClients) },
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

            {/* 4. Fund & Investment Preferences */}
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
                onClick={() => toggleSection("investmentPreference")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.investmentPreference
                    ? "linear-gradient(135deg, #7d5a50, #4a352f)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <TrendingUp size={24} color={expandedSections.investmentPreference ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(18px, 2vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.investmentPreference ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Fund & Investment Preferences
                  </h2>
                </div>
                {expandedSections.investmentPreference ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.investmentPreference && (
                <div
                  style={{
                    padding: "28px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  {/* Fund Details */}
                  {fundDetails.funds && fundDetails.funds.length > 0 && (
                    <div style={{ marginBottom: "24px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#7d5a50", marginBottom: "12px" }}>
                        Active & Deployed Facilities
                      </h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                        {fundDetails.funds.map((fund, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: "rgba(250, 247, 242, 0.85)",
                              borderRadius: "12px",
                              padding: "16px",
                              border: "1px solid rgba(200, 182, 166, 0.3)",
                            }}
                          >
                            <div style={{ fontWeight: "700", color: "#4a352f", fontSize: "15px", marginBottom: "4px" }}>
                              {fund.fundName}
                            </div>
                            <div style={{ fontSize: "13px", color: "#7d5a50" }}>
                              Size: <strong>{fund.fundSize}</strong> • Vintage: <strong>{fund.vintage}</strong>
                            </div>
                            <div style={{ marginTop: "6px", display: "inline-block", fontSize: "12px", backgroundColor: "#e6d7c3", color: "#4a352f", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}>
                              {fund.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {[
                      { label: "Fund Structure", value: investmentPrefs.fundStructure },
                      { label: "Legal Entity Fit", value: investmentPrefs.legalEntityFit },
                      { label: "Investment Stage Focus", value: formatArray(investmentPrefs.investmentStage) },
                      { label: "Primary Instruments", value: formatArray(investmentPrefs.investmentFocus) },
                      { label: "Subtype Instruments", value: formatArray(investmentPrefs.investmentFocusSubtype) },
                      { label: "Sector Focus", value: formatArray(investmentPrefs.sectorFocus) },
                      { label: "Geographic Target", value: formatArray(investmentPrefs.geographicFocus) },
                      { label: "Target IRR / Return", value: investmentPrefs.targetIRR || investmentPrefs.expectedReturnMultiple },
                      { label: "Risk Appetite", value: investmentPrefs.riskAppetite },
                      { label: "Exit Strategy", value: formatArray(investmentPrefs.preferredExitStrategy) },
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

            {/* 5. Document Upload & Verification Status */}
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
                onClick={() => toggleSection("documentsStatus")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.documentsStatus
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <UploadCloud size={24} color={expandedSections.documentsStatus ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(18px, 2vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.documentsStatus ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Document & Credential Status
                  </h2>
                </div>
                {expandedSections.documentsStatus ? (
                  <ChevronUp size={24} color="#faf7f2" />
                ) : (
                  <ChevronDown size={24} color="#4a352f" />
                )}
              </div>
              {expandedSections.documentsStatus && (
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
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {documentUploadList.map((docItem) => (
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
                                documents[docItem.id] && documents[docItem.id].length > 0
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
                            {documents[docItem.id] && documents[docItem.id].length > 0 ? "✓" : ""}
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
                        {renderDocumentStatus(documents[docItem.id])}
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
