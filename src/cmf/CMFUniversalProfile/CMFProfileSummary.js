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
  UploadCloud,
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
  Lock
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

  const formatList = (arr) => {
    if (!arr || !arr.length) return "None specified"
    if (Array.isArray(arr)) {
      return arr.filter(Boolean).join(" • ")
    }
    return String(arr)
  }

  const handleEditSection = (sectionId) => {
    if (onSelectSection) {
      onSelectSection(sectionId)
    } else if (onEdit) {
      onEdit()
    }
  }

  const entity = profile.entityOverview || {}
  const services = profile.servicesSupport || {}
  const matching = profile.smeFocusMatching || {}
  const experience = profile.experienceNetworks || {}
  const fees = profile.feesEngagement || {}
  const legal = profile.legalVerification || {}
  const contact = profile.contactDetails || {}
  const declaration = profile.declarationConsent || {}

  const verificationResult = calculateVerificationScore(profile)
  const verificationScore = verificationResult.score
  const tierInfo = getTierInfo(verificationScore)

  return (
    <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto", padding: "1.5rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top Banner */}
      <div style={{
        background: "linear-gradient(135deg, #4a352f 0%, #3e2723 100%)",
        color: "#ffffff",
        padding: "2rem",
        borderRadius: "16px",
        marginBottom: "2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.5rem",
        boxShadow: "0 8px 24px rgba(62, 39, 35, 0.2)"
      }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.12)", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", color: "#d9b98a", marginBottom: "0.75rem" }}>
            <Shield size={14} /> Profile Summary
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: "800", margin: "0 0 0.5rem 0" }}>
            {entity.organisationName || "Facilitator Profile"}
          </h1>
          <p style={{ margin: 0, fontSize: "1rem", color: "#e8d8cf" }}>
            {entity.headline || "Capital & Market Facilitator on BIG Marketplace"}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255,255,255,0.15)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.3)",
              padding: "10px 18px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
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
              background: "#d9b98a",
              color: "#3e2723",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            <Edit size={16} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Verification Audit Scorecard */}
      <div style={{ marginBottom: "2rem" }}>
        <CMFVerificationScoreCard profileData={profile} />
      </div>

      {/* 8 Profile Section Review Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* 1. Entity Overview */}
        <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div
            onClick={() => toggleSection("entityOverview")}
            style={{ padding: "16px 20px", background: "#faf7f2", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Building size={18} color="#8d6e63" />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#4a352f" }}>
                1. Entity Overview
              </h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleEditSection("entityOverview"); }}
                style={{ background: "transparent", border: "none", color: "#8d6e63", cursor: "pointer", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Edit size={13} /> Edit
              </button>
              {expandedSections.entityOverview ? <ChevronUp size={18} color="#8d6e63" /> : <ChevronDown size={18} color="#8d6e63" />}
            </div>
          </div>

          {expandedSections.entityOverview && (
            <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", fontSize: "13px" }}>
              <div><strong>Profile Type:</strong> {entity.profileType || "Not specified"}</div>
              <div><strong>Name:</strong> {entity.organisationName || "Not specified"}</div>
              <div><strong>Facilitation Focus:</strong> {entity.facilitationFocus || "Both"}</div>
              <div><strong>Location:</strong> {entity.baseCity ? `${entity.baseCity}, ${entity.baseCountry}` : "Not specified"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong>Headline:</strong> {entity.headline || "Not specified"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong>About:</strong> {entity.about || "Not specified"}</div>
              {entity.website && <div><strong>Website:</strong> <a href={entity.website} target="_blank" rel="noopener noreferrer" style={{ color: "#8d6e63" }}>{entity.website}</a></div>}
              {entity.linkedin && <div><strong>LinkedIn:</strong> <a href={entity.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: "#8d6e63" }}>{entity.linkedin}</a></div>}
            </div>
          )}
        </div>

        {/* 2. Services & Support */}
        <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div
            onClick={() => toggleSection("servicesSupport")}
            style={{ padding: "16px 20px", background: "#faf7f2", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Layers size={18} color="#8d6e63" />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#4a352f" }}>
                2. Services & Support
              </h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleEditSection("servicesSupport"); }}
                style={{ background: "transparent", border: "none", color: "#8d6e63", cursor: "pointer", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Edit size={13} /> Edit
              </button>
              {expandedSections.servicesSupport ? <ChevronUp size={18} color="#8d6e63" /> : <ChevronDown size={18} color="#8d6e63" />}
            </div>
          </div>

          {expandedSections.servicesSupport && (
            <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", fontSize: "13px" }}>
              <div style={{ gridColumn: "1 / -1" }}><strong>Services Offered:</strong> {formatList(services.servicesOffered)}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong>What SMEs Receive:</strong> {services.whatSmesReceive || "Not specified"}</div>
              <div><strong>Delivery Method:</strong> {services.deliveryMethod || "Not specified"}</div>
              <div><strong>Support Format:</strong> {services.supportFormat || "Not specified"}</div>
              <div><strong>Engagement Type:</strong> {services.engagementType || "Not specified"}</div>
              <div><strong>Typical Duration:</strong> {services.typicalDuration || "Not specified"}</div>
            </div>
          )}
        </div>

        {/* 3. SME Focus & Matching */}
        <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div
            onClick={() => toggleSection("smeFocusMatching")}
            style={{ padding: "16px 20px", background: "#faf7f2", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <TrendingUp size={18} color="#8d6e63" />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#4a352f" }}>
                3. SME Focus & Matching
              </h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleEditSection("smeFocusMatching"); }}
                style={{ background: "transparent", border: "none", color: "#8d6e63", cursor: "pointer", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Edit size={13} /> Edit
              </button>
              {expandedSections.smeFocusMatching ? <ChevronUp size={18} color="#8d6e63" /> : <ChevronDown size={18} color="#8d6e63" />}
            </div>
          </div>

          {expandedSections.smeFocusMatching && (
            <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", fontSize: "13px" }}>
              <div style={{ gridColumn: "1 / -1" }}><strong>Sectors Supported:</strong> {formatList(matching.sectorsSupported)}</div>
              <div><strong>Geographic Areas:</strong> {formatList(matching.geographicAreas)}</div>
              <div><strong>Business Stages:</strong> {formatList(matching.businessStages)}</div>
              <div><strong>Turnover Range:</strong> {matching.allowNoTurnoverRestriction ? "No restriction" : (matching.turnoverRange || "Not specified")}</div>
              <div><strong>Accepting New SMEs:</strong> {matching.acceptingNewSmes || "Yes"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong>Eligibility Requirements:</strong> {formatList(matching.eligibilityCriteria)} — {matching.eligibilityExplanation}</div>
              {matching.fundingInstruments && matching.fundingInstruments.length > 0 && (
                <div style={{ gridColumn: "1 / -1" }}><strong>Funding Instruments:</strong> {formatList(matching.fundingInstruments)}</div>
              )}
            </div>
          )}
        </div>

        {/* 4. Experience & Networks */}
        <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div
            onClick={() => toggleSection("experienceNetworks")}
            style={{ padding: "16px 20px", background: "#faf7f2", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Users size={18} color="#8d6e63" />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#4a352f" }}>
                4. Experience & Networks
              </h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleEditSection("experienceNetworks"); }}
                style={{ background: "transparent", border: "none", color: "#8d6e63", cursor: "pointer", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Edit size={13} /> Edit
              </button>
              {expandedSections.experienceNetworks ? <ChevronUp size={18} color="#8d6e63" /> : <ChevronDown size={18} color="#8d6e63" />}
            </div>
          </div>

          {expandedSections.experienceNetworks && (
            <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", fontSize: "13px" }}>
              <div><strong>Lead Facilitator:</strong> {experience.leadFacilitatorName} ({experience.leadFacilitatorRole})</div>
              <div><strong>Years of Experience:</strong> {experience.yearsExperience ? `${experience.yearsExperience} years` : "Not specified"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong>Lead Biography:</strong> {experience.leadExperienceBio}</div>
              {experience.relationships && experience.relationships.length > 0 && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <strong>Key Relationships: </strong>
                  {experience.relationships.map((r, i) => `${r.entityName} (${r.relationshipType})`).join(" • ")}
                </div>
              )}
              {experience.caseStudies && experience.caseStudies.length > 0 && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <strong>Case Studies: </strong>
                  {experience.caseStudies.map((c, i) => c.title).join(" • ")}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Fees & Engagement */}
        <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div
            onClick={() => toggleSection("feesEngagement")}
            style={{ padding: "16px 20px", background: "#faf7f2", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <DollarSign size={18} color="#8d6e63" />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#4a352f" }}>
                5. Fees & Engagement
              </h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleEditSection("feesEngagement"); }}
                style={{ background: "transparent", border: "none", color: "#8d6e63", cursor: "pointer", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Edit size={13} /> Edit
              </button>
              {expandedSections.feesEngagement ? <ChevronUp size={18} color="#8d6e63" /> : <ChevronDown size={18} color="#8d6e63" />}
            </div>
          </div>

          {expandedSections.feesEngagement && (
            <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", fontSize: "13px" }}>
              <div><strong>Payer:</strong> {fees.payer || "SME"}</div>
              <div><strong>Fee Model:</strong> {fees.feeModel || "Fixed fee"}</div>
              {fees.indicativeFees && <div><strong>Indicative Fees:</strong> {fees.indicativeFees}</div>}
              {fees.paymentTiming && <div><strong>Payment Timing:</strong> {fees.paymentTiming}</div>}
              <div><strong>Response Time:</strong> {fees.typicalResponseTime || "1 - 2 business days"}</div>
              <div><strong>How Engagement Starts:</strong> {fees.howEngagementStarts || "Initial assessment"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong>Initial Info Checklist:</strong> {formatList(fees.initialAssessmentInfo)}</div>
            </div>
          )}
        </div>

        {/* 6. Legal & Verification */}
        <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div
            onClick={() => toggleSection("legalVerification")}
            style={{ padding: "16px 20px", background: "#faf7f2", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Scale size={18} color="#8d6e63" />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#4a352f" }}>
                6. Legal & Verification
              </h3>
              <span style={{ fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "8px", fontWeight: "600" }}>
                🔒 Private
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleEditSection("legalVerification"); }}
                style={{ background: "transparent", border: "none", color: "#8d6e63", cursor: "pointer", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Edit size={13} /> Edit
              </button>
              {expandedSections.legalVerification ? <ChevronUp size={18} color="#8d6e63" /> : <ChevronDown size={18} color="#8d6e63" />}
            </div>
          </div>

          {expandedSections.legalVerification && (
            <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", fontSize: "13px" }}>
              <div><strong>Capacity in which CMF Acts:</strong> {legal.capacityInWhichActs || "Independent facilitator"}</div>
              {legal.legalEntityName && <div><strong>Legal Registered Name:</strong> {legal.legalEntityName}</div>}
              {legal.registrationNumber && <div><strong>Registration Number:</strong> {legal.registrationNumber}</div>}
              {legal.professionalAuthorisationDetails && (
                <div style={{ gridColumn: "1 / -1" }}><strong>Regulatory Authorisation:</strong> {legal.professionalAuthorisationDetails}</div>
              )}
            </div>
          )}
        </div>

        {/* 7. Contact Details */}
        <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div
            onClick={() => toggleSection("contactDetails")}
            style={{ padding: "16px 20px", background: "#faf7f2", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Phone size={18} color="#8d6e63" />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#4a352f" }}>
                7. Contact Details
              </h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleEditSection("contactDetails"); }}
                style={{ background: "transparent", border: "none", color: "#8d6e63", cursor: "pointer", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Edit size={13} /> Edit
              </button>
              {expandedSections.contactDetails ? <ChevronUp size={18} color="#8d6e63" /> : <ChevronDown size={18} color="#8d6e63" />}
            </div>
          </div>

          {expandedSections.contactDetails && (
            <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", fontSize: "13px" }}>
              <div><strong>SME-Facing Contact:</strong> {contact.smeContactName} ({contact.smeContactRole})</div>
              <div><strong>Preferred Contact Route:</strong> {contact.preferredContactRoute}</div>
              {contact.publicEmail && <div><strong>Public Email:</strong> {contact.publicEmail}</div>}
              {contact.publicTelephone && <div><strong>Public Phone:</strong> {contact.publicTelephone}</div>}
              {contact.bookingLink && <div><strong>Booking Link:</strong> <a href={contact.bookingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#8d6e63" }}>{contact.bookingLink}</a></div>}
              <div><strong>Account Administrator (Private):</strong> {contact.accountAdminName} ({contact.accountAdminEmail}, {contact.accountAdminPhone})</div>
            </div>
          )}
        </div>

        {/* 8. Declaration & Consent */}
        <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div
            onClick={() => toggleSection("declarationConsent")}
            style={{ padding: "16px 20px", background: "#faf7f2", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <CheckCircle2 size={18} color="#8d6e63" />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#4a352f" }}>
                8. Declaration & Consent
              </h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleEditSection("declarationConsent"); }}
                style={{ background: "transparent", border: "none", color: "#8d6e63", cursor: "pointer", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Edit size={13} /> Edit
              </button>
              {expandedSections.declarationConsent ? <ChevronUp size={18} color="#8d6e63" /> : <ChevronDown size={18} color="#8d6e63" />}
            </div>
          </div>

          {expandedSections.declarationConsent && (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#4a352f" }}>
              <div>✓ Accuracy Confirmed: {declaration.accuracy ? "Yes" : "Pending"}</div>
              <div>✓ Publishing Permissions Confirmed: {declaration.permissionRelationships ? "Yes" : "Pending"}</div>
              <div>✓ SME Profile Sharing Approved: {declaration.approvePublicProfile ? "Yes" : "Pending"}</div>
              <div>✓ Platform Terms Accepted: {declaration.acceptTermsPrivacy ? "Yes" : "Pending"}</div>
              <div>• Opportunity Alerts Consent: {declaration.marketingConsent ? "Opted In" : "Not opted in"}</div>
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
  )
}
