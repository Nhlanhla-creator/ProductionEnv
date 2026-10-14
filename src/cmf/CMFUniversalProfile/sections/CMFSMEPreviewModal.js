"use client"

import React from "react"
import { X, Globe, Shield, MessageSquare, MapPin, Building2, User, Award, CheckCircle2, DollarSign, Calendar, ExternalLink } from "lucide-react"

export default function CMFSMEPreviewModal({ isOpen, onClose, formData = {} }) {
  if (!isOpen) return null

  const entity = formData.entityOverview || {}
  const services = formData.servicesSupport || {}
  const matching = formData.smeFocusMatching || {}
  const experience = formData.experienceNetworks || {}
  const fees = formData.feesEngagement || {}
  const contact = formData.contactDetails || {}

  const name = entity.organisationName || "Facilitator Name"
  const headline = entity.headline || "Helping growing SMEs prepare for funding and access suitable counterparties."
  const about = entity.about || "Experienced facilitation practice assisting SMEs across capital readiness and market access."
  const focus = entity.facilitationFocus || "Both"
  const location = `${entity.baseCity || "Johannesburg"}, ${entity.baseCountry || "South Africa"}`

  const offeredServices = Array.isArray(services.servicesOffered) ? services.servicesOffered : []
  const sectors = Array.isArray(matching.sectorsSupported) ? matching.sectorsSupported : []
  const stages = Array.isArray(matching.businessStages) ? matching.businessStages : []
  const relationships = Array.isArray(experience.relationships) ? experience.relationships : []
  const caseStudies = Array.isArray(experience.caseStudies) ? experience.caseStudies : []
  const testimonials = (Array.isArray(experience.testimonials) ? experience.testimonials : []).filter(t => t.hasPermissionToPublish)

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(30, 20, 16, 0.75)",
      backdropFilter: "blur(4px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "#fdfbf7",
        width: "100%",
        maxWidth: "920px",
        maxHeight: "90vh",
        borderRadius: "16px",
        overflowY: "auto",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
        border: "1px solid #e6d7c3",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        {/* Modal Top Bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid #e6d7c3",
          background: "#ffffff",
          position: "sticky",
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              background: "#e8f5e9",
              color: "#2e7d32",
              fontSize: "12px",
              fontWeight: "700"
            }}>
              <Globe size={14} /> SME Public Preview
            </span>
            <span style={{ fontSize: "12px", color: "#8d6e63" }}>
              (All private verification data & internal notes are excluded)
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#7d5a50",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center"
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Profile Content as Seen by SMEs */}
        <div style={{ padding: "24px" }}>
          {/* Hero Profile Header */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e6d7c3",
            borderRadius: "14px",
            padding: "24px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
                <div style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "14px",
                  background: "#faf7f2",
                  border: "1px solid #d7ccc8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0
                }}>
                  {entity.logo ? (
                    <img src={entity.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Building2 size={32} color="#8d6e63" />
                  )}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                    <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#3e2723", margin: 0 }}>
                      {name}
                    </h2>
                    <span style={{
                      fontSize: "11px",
                      background: "#fef3c7",
                      color: "#92400e",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontWeight: "700"
                    }}>
                      {focus} Facilitator
                    </span>
                    <span style={{
                      fontSize: "11px",
                      background: "#e8f5e9",
                      color: "#166534",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontWeight: "700"
                    }}>
                      BIG Verified Partner
                    </span>
                  </div>

                  <p style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: "600", color: "#6d4c41" }}>
                    {headline}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "12px", color: "#8d6e63", flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={13} /> {location}
                    </span>
                    {services.deliveryMethod && (
                      <span>• Delivery: {services.deliveryMethod}</span>
                    )}
                    {matching.acceptingNewSmes && (
                      <span style={{ color: matching.acceptingNewSmes === "Yes" ? "#2e7d32" : "#b45309", fontWeight: "600" }}>
                        • Capacity: {matching.acceptingNewSmes}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Primary Call to Action: Request Support */}
              <div>
                <button
                  type="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "linear-gradient(135deg, #4a352f 0%, #3e2723 100%)",
                    color: "#ffffff",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(62, 39, 35, 0.25)"
                  }}
                >
                  <MessageSquare size={16} /> Request Support
                </button>
                <div style={{ fontSize: "11px", color: "#8d6e63", marginTop: "4px", textAlign: "center" }}>
                  Route: {contact.preferredContactRoute || "BIG enquiry"}
                </div>
              </div>
            </div>

            {/* About Blurb */}
            <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid #f0e6da" }}>
              <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#4a352f", margin: "0 0 6px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                About the Facilitator
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#5d4037", lineHeight: "1.6" }}>
                {about}
              </p>
            </div>
          </div>

          {/* 2-Column Details Layout */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "18px", marginBottom: "20px" }}>
            {/* Services & Deliverables */}
            <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "12px", padding: "18px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🎯</span> Services & Deliverables
              </h3>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                {offeredServices.map(srv => (
                  <span key={srv} style={{ background: "#faf7f2", border: "1px solid #d7ccc8", borderRadius: "14px", padding: "4px 10px", fontSize: "12px", color: "#4a352f", fontWeight: "500" }}>
                    ✓ {srv}
                  </span>
                ))}
              </div>

              {services.whatSmesReceive && (
                <div style={{ background: "#faf7f2", padding: "12px", borderRadius: "8px", border: "1px solid #f0e6da" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#4a352f", marginBottom: "4px" }}>
                    What SMEs Receive:
                  </div>
                  <div style={{ fontSize: "12px", color: "#5d4037", lineHeight: "1.5" }}>
                    {services.whatSmesReceive}
                  </div>
                </div>
              )}
            </div>

            {/* SME Eligibility & Focus */}
            <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "12px", padding: "18px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🔍</span> SME Focus & Suitability
              </h3>

              <div style={{ marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#4a352f" }}>Stages Supported: </span>
                <span style={{ fontSize: "12px", color: "#7d5a50" }}>
                  {stages.length ? stages.join(", ") : "All stages"}
                </span>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#4a352f" }}>Turnover Range: </span>
                <span style={{ fontSize: "12px", color: "#7d5a50" }}>
                  {matching.allowNoTurnoverRestriction ? "No restriction" : (matching.turnoverRange || "Flexible")}
                </span>
              </div>

              {matching.eligibilityExplanation && (
                <div style={{ background: "#faf7f2", padding: "10px", borderRadius: "8px", border: "1px solid #f0e6da", fontSize: "12px", color: "#5d4037" }}>
                  <strong>Eligibility: </strong> {matching.eligibilityExplanation}
                </div>
              )}
            </div>
          </div>

          {/* Lead Facilitator & Networks */}
          <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>👥</span> Lead Facilitator & Track Record
            </h3>

            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "14px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#f3e5dc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <User size={22} color="#8d6e63" />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f" }}>
                  {experience.leadFacilitatorName || "Facilitator Lead"}
                </div>
                <div style={{ fontSize: "12px", color: "#8d6e63", marginBottom: "4px" }}>
                  {experience.leadFacilitatorRole || "Managing Director"} • {experience.yearsExperience ? `${experience.yearsExperience} yrs experience` : "Senior advisor"}
                </div>
                <div style={{ fontSize: "12px", color: "#5d4037", lineHeight: "1.5" }}>
                  {experience.leadExperienceBio || "Advisory leadership with demonstrated execution."}
                </div>
              </div>
            </div>

            {relationships.length > 0 && (
              <div style={{ paddingTop: "12px", borderTop: "1px solid #f0e6da" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#4a352f", display: "block", marginBottom: "6px" }}>
                  Key Relationships & Mandates:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {relationships.map((rel, i) => (
                    <span key={i} style={{ background: "#faf7f2", border: "1px solid #e6d7c3", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", color: "#4a352f" }}>
                      <strong>{rel.entityName}</strong> ({rel.relationshipType})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Commercial & Contact Overview */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "12px", padding: "16px" }}>
              <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#4a352f", margin: "0 0 8px 0" }}>
                Fees & Commercial Basis
              </h4>
              <div style={{ fontSize: "12px", color: "#5d4037", lineHeight: "1.6" }}>
                <div><strong>Payer:</strong> {fees.payer || "SME"}</div>
                <div><strong>Fee Model:</strong> {fees.feeModel || "Fixed fee"}</div>
                {fees.indicativeFees && <div><strong>Indicative Terms:</strong> {fees.indicativeFees}</div>}
                <div><strong>Response Time:</strong> {fees.typicalResponseTime || "1 - 2 business days"}</div>
              </div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "12px", padding: "16px" }}>
              <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#4a352f", margin: "0 0 8px 0" }}>
                SME Engagement Point of Contact
              </h4>
              <div style={{ fontSize: "12px", color: "#5d4037", lineHeight: "1.6" }}>
                <div><strong>Contact Person:</strong> {contact.smeContactName || "Team Lead"} ({contact.smeContactRole || "Advisory"})</div>
                {contact.publicEmail && <div><strong>Email:</strong> {contact.publicEmail}</div>}
                {contact.publicTelephone && <div><strong>Phone:</strong> {contact.publicTelephone}</div>}
                {contact.bookingLink && (
                  <div style={{ marginTop: "4px" }}>
                    <a href={contact.bookingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#8d6e63", fontWeight: "600", textDecoration: "underline" }}>
                      Book Intro Call ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Close */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #e6d7c3", background: "#faf7f2", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 20px",
              background: "#4a352f",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}
