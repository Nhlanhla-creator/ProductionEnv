"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Building,
  Phone,
  ShieldCheck,
} from "lucide-react"

const AssociatorProfileSummary = ({ formData, onEdit }) => {
  const [expandedSections, setExpandedSections] = useState({
    entityOverview: false,
    contactDetails: false,
    declarationConsent: false,
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const getSummaryData = () => ({
    // Entity Overview
    registeredName: formData?.entityOverview?.registeredName,
    tradingName: formData?.entityOverview?.tradingName,
    legalEntityType: formData?.entityOverview?.legalEntityType,
    registrationNumber: formData?.entityOverview?.registrationNumber,
    industrySector: formData?.entityOverview?.industrySector,
    companySize: formData?.entityOverview?.companySize,
    yearEstablished: formData?.entityOverview?.yearEstablished,
    website: formData?.entityOverview?.website,
    briefDescription: formData?.entityOverview?.briefDescription,
    referralSource:
      formData?.entityOverview?.referralSource === "other"
        ? formData?.entityOverview?.referralSourceOther
        : formData?.entityOverview?.referralSource,

    // Contact Details
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

    // Declaration
    accuracy: formData?.declarationConsent?.accuracy,
    dataProcessing: formData?.declarationConsent?.dataProcessing,
    termsConditions: formData?.declarationConsent?.termsConditions,
  })

  const summaryData = getSummaryData()

  // ─── Shared card style ───────────────────────────────────────────────────────
  const cardStyle = {
    background: "rgba(250, 247, 242, 0.8)",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid rgba(200, 182, 166, 0.2)",
    transition: "all 0.3s ease",
  }

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    color: "#7d5a50",
    marginBottom: "8px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  }

  const valueStyle = {
    fontSize: "15px",
    color: "#4a352f",
    fontWeight: "500",
    lineHeight: "1.4",
  }

  const sectionWrapperStyle = {
    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid rgba(200, 182, 166, 0.3)",
    boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
    transition: "all 0.3s ease",
    marginBottom: "24px",
  }

  const sectionHeaderStyle = (expanded, colorA, colorB) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 28px",
    background: expanded
      ? `linear-gradient(135deg, ${colorA}, ${colorB})`
      : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  })

  const sectionBodyStyle = {
    padding: "28px",
    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
  }

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  }

  const renderField = (label, value, key) =>
    value ? (
      <div key={key} style={cardStyle}>
        <span style={labelStyle}>{label}</span>
        <span style={valueStyle}>{value}</span>
      </div>
    ) : null

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ minHeight: "100vh", padding: "24px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ width: "100%", padding: "0 32px", margin: "0 auto" }}>

          {/* ── Header ── */}
          <div style={{
            background: "linear-gradient(135deg, rgba(250,247,242,0.9), rgba(245,240,225,0.9))",
            borderRadius: "24px",
            padding: "32px",
            marginBottom: "32px",
            boxShadow: "0 20px 40px rgba(74,53,47,0.1)",
            border: "1px solid rgba(200,182,166,0.3)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
              <div>
                <h1 style={{
                  background: "linear-gradient(135deg, #4a352f, #7d5a50)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontSize: "36px",
                  fontWeight: "800",
                  margin: "0 0 8px 0",
                  letterSpacing: "-0.02em",
                }}>
                  Associator Profile Summary
                </h1>
                <p style={{ color: "#7d5a50", fontSize: "18px", margin: 0, fontWeight: "500" }}>
                  Review Your Organisation's Profile
                </p>
              </div>
              <button
                onClick={onEdit}
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
                  boxShadow: "0 4px 16px rgba(166,124,82,0.3)",
                }}
              >
                <Edit size={16} /> Edit Profile
              </button>
            </div>
          </div>

          {/* ── Entity Overview ── */}
          <div style={sectionWrapperStyle}>
            <div onClick={() => toggleSection("entityOverview")} style={sectionHeaderStyle(expandedSections.entityOverview, "#a67c52", "#7d5a50")}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Building size={24} color={expandedSections.entityOverview ? "#faf7f2" : "#4a352f"} />
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: expandedSections.entityOverview ? "#faf7f2" : "#4a352f" }}>
                  Entity Overview
                </h2>
              </div>
              {expandedSections.entityOverview ? <ChevronUp size={24} color="#faf7f2" /> : <ChevronDown size={24} color="#4a352f" />}
            </div>
            {expandedSections.entityOverview && (
              <div style={{ ...sectionBodyStyle, animation: "slideDown 0.3s ease-out" }}>
                <div style={gridStyle}>
                  {[
                    { label: "Registered Name", value: summaryData.registeredName },
                    { label: "Trading Name", value: summaryData.tradingName },
                    { label: "Legal Entity Type", value: summaryData.legalEntityType },
                    { label: "Registration Number", value: summaryData.registrationNumber },
                    { label: "Industry Sector", value: summaryData.industrySector },
                    { label: "Company Size", value: summaryData.companySize },
                    { label: "Year Established", value: summaryData.yearEstablished },
                    { label: "Website", value: summaryData.website },
                    { label: "Brief Description", value: summaryData.briefDescription },
                    { label: "How did you hear about us?", value: summaryData.referralSource },
                  ].map((item, i) => renderField(item.label, item.value, i))}
                </div>
              </div>
            )}
          </div>

          {/* ── Contact Details ── */}
          <div style={sectionWrapperStyle}>
            <div onClick={() => toggleSection("contactDetails")} style={sectionHeaderStyle(expandedSections.contactDetails, "#7d5a50", "#4a352f")}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Phone size={24} color={expandedSections.contactDetails ? "#faf7f2" : "#4a352f"} />
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: expandedSections.contactDetails ? "#faf7f2" : "#4a352f" }}>
                  Contact Details
                </h2>
              </div>
              {expandedSections.contactDetails ? <ChevronUp size={24} color="#faf7f2" /> : <ChevronDown size={24} color="#4a352f" />}
            </div>
            {expandedSections.contactDetails && (
              <div style={{ ...sectionBodyStyle, animation: "slideDown 0.3s ease-out" }}>
                <div style={gridStyle}>
                  {[
                    { label: "Business Tel", value: summaryData.businessTel },
                    { label: "Business Email", value: summaryData.businessEmail },
                    { label: "Physical Address", value: summaryData.physicalAddress },
                    { label: "Postal Address", value: summaryData.postalAddress },
                    { label: "Website", value: summaryData.contactWebsite },
                    { label: "LinkedIn Page", value: summaryData.linkedin },
                  ].map((item, i) => renderField(item.label, item.value, i))}
                </div>

                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#5d4037", margin: "30px 0 15px" }}>Primary Contact</h3>
                <div style={gridStyle}>
                  {[
                    { label: "Title", value: summaryData.primaryContactTitle },
                    { label: "Name", value: summaryData.primaryContactName },
                    { label: "Surname", value: summaryData.primaryContactSurname },
                    { label: "Position", value: summaryData.primaryContactPosition },
                    { label: "Mobile", value: summaryData.primaryContactMobile },
                    { label: "Email", value: summaryData.primaryContactEmail },
                  ].map((item, i) => renderField(item.label, item.value, i))}
                </div>

                {(summaryData.secondaryContactName || summaryData.secondaryContactEmail) && (
                  <>
                    <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#5d4037", margin: "30px 0 15px" }}>Secondary Contact</h3>
                    <div style={gridStyle}>
                      {[
                        { label: "Title", value: summaryData.secondaryContactTitle },
                        { label: "Name", value: summaryData.secondaryContactName },
                        { label: "Surname", value: summaryData.secondaryContactSurname },
                        { label: "Position", value: summaryData.secondaryContactPosition },
                        { label: "Mobile", value: summaryData.secondaryContactMobile },
                        { label: "Email", value: summaryData.secondaryContactEmail },
                      ].map((item, i) => renderField(item.label, item.value, i))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Declaration & Consent ── */}
          <div style={sectionWrapperStyle}>
            <div onClick={() => toggleSection("declarationConsent")} style={sectionHeaderStyle(expandedSections.declarationConsent, "#a67c52", "#7d5a50")}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <ShieldCheck size={24} color={expandedSections.declarationConsent ? "#faf7f2" : "#4a352f"} />
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: expandedSections.declarationConsent ? "#faf7f2" : "#4a352f" }}>
                  Declaration & Consent
                </h2>
              </div>
              {expandedSections.declarationConsent ? <ChevronUp size={24} color="#faf7f2" /> : <ChevronDown size={24} color="#4a352f" />}
            </div>
            {expandedSections.declarationConsent && (
              <div style={{ ...sectionBodyStyle, animation: "slideDown 0.3s ease-out" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                  {[
                    { label: "Declaration of Accuracy", value: summaryData.accuracy, description: "I confirm that all information provided is accurate and complete." },
                    { label: "Consent for Data Processing", value: summaryData.dataProcessing, description: "I consent to the collection and processing of my data as described." },
                    { label: "Opt-in for Promotional Visibility", value: summaryData.termsConditions, description: "We consent to our association being listed publicly." },
                  ].map((item, i) => (
                    <div key={i} style={cardStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <div style={{
                          width: "20px", height: "20px", borderRadius: "4px",
                          background: item.value ? "linear-gradient(135deg, #a67c52, #7d5a50)" : "#e5e5e5",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: "12px", fontWeight: "bold",
                        }}>
                          {item.value ? "✓" : ""}
                        </div>
                        <span style={labelStyle}>{item.label}</span>
                      </div>
                      <span style={{ fontSize: "14px", color: "#4a352f", lineHeight: "1.4", display: "block" }}>
                        {item.description}
                      </span>
                      <div style={{ marginTop: "8px", fontSize: "13px", fontWeight: "600", color: item.value ? "#22c55e" : "#ef4444" }}>
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
    </>
  )
}

export default AssociatorProfileSummary