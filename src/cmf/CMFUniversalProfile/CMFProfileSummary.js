"use client"

import React, { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Building,
  Phone,
  Briefcase,
  TrendingUp,
  Users,
  Scale,
  Shield,
  Eye,
  CheckCircle2,
  DollarSign,
  Globe,
  Award,
  Layers,
  FileText,
  Mail,
  MapPin,
  Lock,
  ExternalLink,
  CheckSquare
} from "lucide-react"
import CMFVerificationScoreCard, {
  calculateVerificationScore,
  getTierInfo
} from "./CMFVerificationScoreCard"
import CMFSMEPreviewModal from "./sections/CMFSMEPreviewModal"

export default function CMFProfileSummary({ data, formData, onEdit, onSelectSection }) {
  const profile = data || formData || {}
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const [expandedSections, setExpandedSections] = useState({
    verificationAudit: true,
    entityOverview: true,
    servicesSupport: true,
    smeFocusMatching: false,
    experienceNetworks: false,
    feesEngagement: false,
    legalVerification: false,
    contactDetails: false,
    declarationConsent: false
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleEditSection = (sectionId) => {
    if (onSelectSection) {
      onSelectSection(sectionId)
    } else if (onEdit) {
      onEdit()
    }
  }

  // ── Shared Design Tokens from ProfileSummary.js ──────────────────────────────
  const sectionCardStyle = {
    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
    backdropFilter: "blur(20px)",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid rgba(200, 182, 166, 0.3)",
    boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)"
  }

  const sectionContentStyle = {
    padding: "20px",
    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
    animation: "slideDown 0.3s ease-out"
  }

  const fieldCardStyle = {
    background: "rgba(250, 247, 242, 0.8)",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid rgba(200, 182, 166, 0.2)"
  }

  const fieldLabelStyle = {
    display: "block",
    fontSize: "12px",
    color: "#7d5a50",
    marginBottom: "6px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  }

  const fieldValueStyle = {
    fontSize: "14px",
    color: "#4a352f",
    fontWeight: "500",
    wordBreak: "break-word"
  }

  const renderBadgeList = (arr, emptyText = "Not specified") => {
    if (!arr || !arr.length) {
      return <span style={{ color: "#7d5a50", fontStyle: "italic", fontSize: "13px" }}>{emptyText}</span>
    }
    const list = Array.isArray(arr) ? arr.filter(Boolean) : [String(arr)]
    if (list.length === 0) {
      return <span style={{ color: "#7d5a50", fontStyle: "italic", fontSize: "13px" }}>{emptyText}</span>
    }
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
        {list.map((item, idx) => (
          <span
            key={idx}
            style={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: "#f3ebe0",
              border: "1px solid #d6c4a8",
              color: "#6b4c2a",
              borderRadius: "12px",
              padding: "3px 10px",
              fontSize: "12px",
              fontWeight: "500"
            }}
          >
            {item}
          </span>
        ))}
      </div>
    )
  }

  const renderExternalLink = (url, label) => {
    if (!url) return <span style={{ color: "#7d5a50", fontStyle: "italic", fontSize: "13px" }}>Not provided</span>
    return (
      <a
        href={url.startsWith("http") ? url : `https://${url}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "#8B4513",
          fontWeight: "600",
          fontSize: "13px",
          textDecoration: "none"
        }}
      >
        <span>{label || url}</span>
        <ExternalLink size={13} />
      </a>
    )
  }

  const renderDocumentLink = (url, label = "View Document") => {
    if (!url) return <span style={{ color: "#7d5a50", fontStyle: "italic", fontSize: "13px" }}>No document uploaded</span>
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 12px",
          background: "linear-gradient(135deg, #a67c52, #7d5a50)",
          color: "#faf7f2",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: "500",
          cursor: "pointer",
          maxWidth: "fit-content",
          marginTop: "4px"
        }}
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      >
        <FileText size={15} />
        <span>{label}</span>
        <ExternalLink size={13} />
      </div>
    )
  }

  const renderSectionHeader = (sectionKey, Icon, title, isPrivate = false) => {
    const isExpanded = expandedSections[sectionKey]
    return (
      <div
        onClick={() => toggleSection(sectionKey)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          cursor: "pointer",
          background: isExpanded
            ? "linear-gradient(135deg, #a67c52, #7d5a50)"
            : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
          transition: "all 0.2s ease"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Icon size={20} color={isExpanded ? "#faf7f2" : "#4a352f"} />
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(16px, 2.5vw, 18px)",
              fontWeight: "700",
              color: isExpanded ? "#faf7f2" : "#4a352f"
            }}
          >
            {title}
          </h2>
          {isPrivate && (
            <span
              style={{
                fontSize: "11px",
                background: isExpanded ? "rgba(255,255,255,0.2)" : "#fef3c7",
                color: isExpanded ? "#faf7f2" : "#92400e",
                padding: "2px 8px",
                borderRadius: "10px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <Lock size={10} /> Private
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleEditSection(sectionKey)
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 12px",
              background: isExpanded ? "rgba(255, 255, 255, 0.2)" : "rgba(74, 53, 47, 0.1)",
              color: isExpanded ? "#faf7f2" : "#4a352f",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            <Edit size={13} /> Edit
          </button>
          {isExpanded ? <ChevronUp size={20} color="#faf7f2" /> : <ChevronDown size={20} color="#4a352f" />}
        </div>
      </div>
    )
  }

  const entity = profile.entityOverview || {}
  const services = profile.servicesSupport || {}
  const matching = profile.smeFocusMatching || {}
  const experience = profile.experienceNetworks || {}
  const fees = profile.feesEngagement || {}
  const legal = profile.legalVerification || {}
  const contact = profile.contactDetails || {}
  const declaration = profile.declarationConsent || {}

  return (
    <div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "16px", boxSizing: "border-box", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        
        {/* Top Banner Matching ProfileSummary.js */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 20px 40px rgba(74, 53, 47, 0.1)",
            border: "1px solid rgba(200, 182, 166, 0.3)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 2, gap: "16px", flexWrap: "wrap" }}>
            <div style={{ flex: "1", minWidth: "260px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(166, 124, 82, 0.12)", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", color: "#7d5a50", marginBottom: "8px" }}>
                <Shield size={14} color="#7d5a50" /> Capital & Market Facilitator Profile
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 18px",
                  background: "rgba(255, 255, 255, 0.7)",
                  color: "#4a352f",
                  border: "1px solid rgba(200, 182, 166, 0.5)",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(74, 53, 47, 0.05)"
                }}
              >
                <Eye size={16} /> Preview SME View
              </button>

              <button
                type="button"
                onClick={() => handleEditSection("entityOverview")}
                style={{
                  display: "inline-flex",
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
                  boxShadow: "0 4px 16px rgba(166, 124, 82, 0.3)"
                }}
              >
                <Edit size={16} /> Edit Profile
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h1
                  style={{
                    background: "linear-gradient(135deg, #4a352f, #7d5a50)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontSize: "clamp(24px, 4vw, 34px)",
                    fontWeight: "800",
                    margin: "0 0 8px 0"
                  }}
                >
                  {entity.organisationName || "Facilitator Profile"}
                </h1>
                <p style={{ color: "#7d5a50", fontSize: "clamp(14px, 2vw, 16px)", margin: 0, fontWeight: "500",  }}>
                  {entity.headline || "Capital & Market Facilitator on BIG Marketplace"}
                </p>
              </div>
        </div>

        {/* Verification Audit Scorecard */}
        <div style={{ marginBottom: "24px" }}>
          <CMFVerificationScoreCard profileData={profile} />
        </div>

        {/* 8 Profile Section Accordion Cards */}
        <div style={{ display: "grid", gap: "16px" }}>
          
          {/* 1. Entity Overview */}
          <div style={sectionCardStyle}>
            {renderSectionHeader("entityOverview", Building, "1. Entity Overview")}
            {expandedSections.entityOverview && (
              <div style={sectionContentStyle}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Profile Type</span>
                    <span style={fieldValueStyle}>{entity.profileType || "Not specified"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Organisation / Practitioner Name</span>
                    <span style={fieldValueStyle}>{entity.organisationName || "Not specified"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Facilitation Focus</span>
                    <span style={fieldValueStyle}>{entity.facilitationFocus || "Both (Capital & Market Access)"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Base Location</span>
                    <span style={fieldValueStyle}>
                      {entity.baseCity ? `${entity.baseCity}, ${entity.baseCountry || "South Africa"}` : (entity.baseCountry || "Not specified")}
                    </span>
                  </div>
                  {entity.website && (
                    <div style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>Website</span>
                      <span style={fieldValueStyle}>{renderExternalLink(entity.website, entity.website)}</span>
                    </div>
                  )}
                  {entity.linkedin && (
                    <div style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>LinkedIn</span>
                      <span style={fieldValueStyle}>{renderExternalLink(entity.linkedin, "View LinkedIn Profile")}</span>
                    </div>
                  )}
                  <div style={{ ...fieldCardStyle, gridColumn: "1 / -1" }}>
                    <span style={fieldLabelStyle}>Headline</span>
                    <span style={fieldValueStyle}>{entity.headline || "Not specified"}</span>
                  </div>
                  <div style={{ ...fieldCardStyle, gridColumn: "1 / -1", background: "rgba(166, 124, 82, 0.08)" }}>
                    <span style={{ ...fieldLabelStyle, fontWeight: "700" }}>About Facilitator</span>
                    <p style={{ fontSize: "14px", color: "#4a352f", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap" }}>
                      {entity.about || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Services & Support */}
          <div style={sectionCardStyle}>
            {renderSectionHeader("servicesSupport", Layers, "2. Services & Support")}
            {expandedSections.servicesSupport && (
              <div style={sectionContentStyle}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  <div style={{ ...fieldCardStyle, gridColumn: "1 / -1" }}>
                    <span style={fieldLabelStyle}>Services Offered</span>
                    {renderBadgeList(services.servicesOffered)}
                  </div>
                  <div style={{ ...fieldCardStyle, gridColumn: "1 / -1", background: "rgba(166, 124, 82, 0.08)" }}>
                    <span style={{ ...fieldLabelStyle, fontWeight: "700" }}>What SMEs Receive</span>
                    <p style={{ fontSize: "14px", color: "#4a352f", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap" }}>
                      {services.whatSmesReceive || "Not specified"}
                    </p>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Delivery Method</span>
                    <span style={fieldValueStyle}>{services.deliveryMethod || "Not specified"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Support Format</span>
                    <span style={fieldValueStyle}>{services.supportFormat || "Not specified"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Engagement Type</span>
                    <span style={fieldValueStyle}>{services.engagementType || "Not specified"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Typical Duration</span>
                    <span style={fieldValueStyle}>{services.typicalDuration || "Not specified"}</span>
                  </div>
                  <div style={{ ...fieldCardStyle, gridColumn: "1 / -1" }}>
                    <span style={fieldLabelStyle}>Supported Languages</span>
                    {renderBadgeList(services.supportedLanguages, "English")}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. SME Focus & Matching */}
          <div style={sectionCardStyle}>
            {renderSectionHeader("smeFocusMatching", TrendingUp, "3. SME Focus & Matching")}
            {expandedSections.smeFocusMatching && (
              <div style={sectionContentStyle}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  <div style={{ ...fieldCardStyle, gridColumn: "1 / -1" }}>
                    <span style={fieldLabelStyle}>Sectors Supported</span>
                    {renderBadgeList(matching.sectorsSupported)}
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Geographic Focus / Provinces</span>
                    {renderBadgeList(matching.geographicAreas)}
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Business Stages</span>
                    {renderBadgeList(matching.businessStages)}
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Annual Turnover Range</span>
                    <span style={fieldValueStyle}>
                      {matching.allowNoTurnoverRestriction ? "No restriction" : (matching.turnoverRange || "Not specified")}
                    </span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Accepting New SMEs</span>
                    <span style={fieldValueStyle}>{matching.acceptingNewSmes === "No" ? "❌ No" : "✅ Yes"}</span>
                  </div>
                  <div style={{ ...fieldCardStyle, gridColumn: "1 / -1" }}>
                    <span style={fieldLabelStyle}>Eligibility Criteria</span>
                    {renderBadgeList(matching.eligibilityCriteria)}
                    {matching.eligibilityExplanation && (
                      <p style={{ marginTop: "8px", marginBottom: 0, fontSize: "13px", color: "#4a352f", fontStyle: "italic" }}>
                        Note: {matching.eligibilityExplanation}
                      </p>
                    )}
                  </div>
                  {matching.fundingInstruments && matching.fundingInstruments.length > 0 && (
                    <div style={{ ...fieldCardStyle, gridColumn: "1 / -1" }}>
                      <span style={fieldLabelStyle}>Funding Instruments</span>
                      {renderBadgeList(matching.fundingInstruments)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Experience & Networks */}
          <div style={sectionCardStyle}>
            {renderSectionHeader("experienceNetworks", Users, "4. Experience & Networks")}
            {expandedSections.experienceNetworks && (
              <div style={sectionContentStyle}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Lead Facilitator</span>
                    <span style={fieldValueStyle}>
                      {experience.leadFacilitatorName || "Not specified"}
                      {experience.leadFacilitatorRole ? ` (${experience.leadFacilitatorRole})` : ""}
                    </span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Years of Experience</span>
                    <span style={fieldValueStyle}>
                      {experience.yearsExperience ? `${experience.yearsExperience} years` : "Not specified"}
                    </span>
                  </div>
                  <div style={{ ...fieldCardStyle, gridColumn: "1 / -1" }}>
                    <span style={fieldLabelStyle}>Lead Experience Biography</span>
                    <p style={{ fontSize: "14px", color: "#4a352f", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap" }}>
                      {experience.leadExperienceBio || "Not specified"}
                    </p>
                  </div>
                  {experience.relationships && experience.relationships.length > 0 && (
                    <div style={{ ...fieldCardStyle, gridColumn: "1 / -1" }}>
                      <span style={fieldLabelStyle}>Key Ecosystem Relationships</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                        {experience.relationships.map((rel, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "8px 12px",
                              background: "rgba(166, 124, 82, 0.08)",
                              borderRadius: "8px",
                              border: "1px solid rgba(200, 182, 166, 0.3)",
                              fontSize: "13px",
                              color: "#4a352f"
                            }}
                          >
                            <strong>{rel.entityName}</strong>
                            <span style={{ color: "#7d5a50", marginLeft: "6px" }}>({rel.relationshipType})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {experience.caseStudies && experience.caseStudies.length > 0 && (
                    <div style={{ ...fieldCardStyle, gridColumn: "1 / -1" }}>
                      <span style={fieldLabelStyle}>Track Record & Case Studies</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                        {experience.caseStudies.map((cs, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "10px 14px",
                              background: "rgba(166, 124, 82, 0.05)",
                              borderRadius: "8px",
                              border: "1px solid rgba(200, 182, 166, 0.2)"
                            }}
                          >
                            <div style={{ fontWeight: "700", color: "#4a352f", fontSize: "14px", marginBottom: "4px" }}>
                              {cs.title || `Case Study #${idx + 1}`}
                            </div>
                            {cs.outcome && (
                              <p style={{ margin: 0, fontSize: "13px", color: "#7d5a50", lineHeight: "1.5" }}>
                                {cs.outcome}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 5. Fees & Engagement */}
          <div style={sectionCardStyle}>
            {renderSectionHeader("feesEngagement", DollarSign, "5. Fees & Engagement")}
            {expandedSections.feesEngagement && (
              <div style={sectionContentStyle}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Who Pays</span>
                    <span style={fieldValueStyle}>{fees.payer || "SME"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Fee Model</span>
                    <span style={fieldValueStyle}>{fees.feeModel || "Fixed fee"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Indicative Fees</span>
                    <span style={fieldValueStyle}>{fees.indicativeFees || "Not specified"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Payment Timing</span>
                    <span style={fieldValueStyle}>{fees.paymentTiming || "Not specified"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Typical Response Time</span>
                    <span style={fieldValueStyle}>{fees.typicalResponseTime || "1 - 2 business days"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>How Engagement Starts</span>
                    <span style={fieldValueStyle}>{fees.howEngagementStarts || "Initial assessment"}</span>
                  </div>
                  <div style={{ ...fieldCardStyle, gridColumn: "1 / -1" }}>
                    <span style={fieldLabelStyle}>Initial Assessment Information Checklist</span>
                    {renderBadgeList(fees.initialAssessmentInfo)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. Legal & Verification */}
          <div style={sectionCardStyle}>
            {renderSectionHeader("legalVerification", Scale, "6. Legal & Verification", true)}
            {expandedSections.legalVerification && (
              <div style={sectionContentStyle}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Capacity in Which Facilitator Acts</span>
                    <span style={fieldValueStyle}>{legal.capacityInWhichActs || "Independent facilitator"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Legal Registered Name</span>
                    <span style={fieldValueStyle}>{legal.legalEntityName || "Not specified"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Registration Number</span>
                    <span style={fieldValueStyle}>{legal.registrationNumber || "Not specified"}</span>
                  </div>
                  {legal.professionalAuthorisationDetails && (
                    <div style={{ ...fieldCardStyle, gridColumn: "1 / -1" }}>
                      <span style={fieldLabelStyle}>Regulatory Authorisation Details</span>
                      <span style={fieldValueStyle}>{legal.professionalAuthorisationDetails}</span>
                    </div>
                  )}
                  {legal.idDocumentUrl && (
                    <div style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>ID / Passport Document</span>
                      {renderDocumentLink(legal.idDocumentUrl, "ID Document")}
                    </div>
                  )}
                  {legal.cipcCertificateUrl && (
                    <div style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>CIPC Registration Certificate</span>
                      {renderDocumentLink(legal.cipcCertificateUrl, "CIPC Certificate")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 7. Contact Details */}
          <div style={sectionCardStyle}>
            {renderSectionHeader("contactDetails", Phone, "7. Contact Details")}
            {expandedSections.contactDetails && (
              <div style={sectionContentStyle}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>SME-Facing Contact Person</span>
                    <span style={fieldValueStyle}>
                      {contact.smeContactName || "Not specified"}
                      {contact.smeContactRole ? ` (${contact.smeContactRole})` : ""}
                    </span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Preferred Contact Route</span>
                    <span style={fieldValueStyle}>{contact.preferredContactRoute || "Not specified"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Public Email</span>
                    <span style={fieldValueStyle}>{contact.publicEmail || "Not specified"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Public Telephone</span>
                    <span style={fieldValueStyle}>{contact.publicTelephone || "Not specified"}</span>
                  </div>
                  {contact.bookingLink && (
                    <div style={{ ...fieldCardStyle, gridColumn: "1 / -1" }}>
                      <span style={fieldLabelStyle}>Online Booking / Calendar Link</span>
                      <span style={fieldValueStyle}>{renderExternalLink(contact.bookingLink, contact.bookingLink)}</span>
                    </div>
                  )}
                  <div style={{ ...fieldCardStyle, gridColumn: "1 / -1", background: "rgba(166, 124, 82, 0.05)" }}>
                    <span style={fieldLabelStyle}>Account Administrator (Private)</span>
                    <span style={fieldValueStyle}>
                      {contact.accountAdminName || "Not specified"}
                      {contact.accountAdminEmail ? ` • ${contact.accountAdminEmail}` : ""}
                      {contact.accountAdminPhone ? ` • ${contact.accountAdminPhone}` : ""}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 8. Declaration & Consent */}
          <div style={sectionCardStyle}>
            {renderSectionHeader("declarationConsent", CheckSquare, "8. Declaration & Consent")}
            {expandedSections.declarationConsent && (
              <div style={sectionContentStyle}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Declaration of Accuracy</span>
                    <span style={fieldValueStyle}>{declaration.accuracy ? "✅ Yes, Confirmed" : "❌ Pending"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Publishing Permissions Confirmed</span>
                    <span style={fieldValueStyle}>{declaration.permissionRelationships ? "✅ Yes, Confirmed" : "❌ Pending"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>SME Profile Sharing Approved</span>
                    <span style={fieldValueStyle}>{declaration.approvePublicProfile ? "✅ Yes, Approved" : "❌ Pending"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Platform Terms & Privacy</span>
                    <span style={fieldValueStyle}>{declaration.acceptTermsPrivacy ? "✅ Yes, Accepted" : "❌ Pending"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Marketplace Opportunity Alerts</span>
                    <span style={fieldValueStyle}>{declaration.marketingConsent ? "✅ Opted In" : "⚪ Not opted in"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SME Preview Modal */}
        <CMFSMEPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          formData={profile}
        />
      </div>
    </div>
  )
}
