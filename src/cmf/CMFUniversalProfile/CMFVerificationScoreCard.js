"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Shield, ChevronDown, Check, X, Award, CheckCircle, AlertCircle, FileText, Building2, UserCheck, TrendingUp, HelpCircle } from "lucide-react"

export const createVerificationChecklist = (data) => {
  const entity = data?.entityOverview || {}
  const services = data?.servicesSupport || {}
  const matching = data?.smeFocusMatching || {}
  const experience = data?.experienceNetworks || {}
  const fees = data?.feesEngagement || {}
  const legal = data?.legalVerification || {}
  const contact = data?.contactDetails || {}
  const declaration = data?.declarationConsent || {}
  const docs = data?.documents || {}

  const hasDoc = (key) => {
    const val = docs[key] || legal[key]
    if (Array.isArray(val) && val.length > 0) return true
    if (typeof val === "string" && val.trim() !== "") return true
    if (val && typeof val === "object" && Object.keys(val).length > 0) return true
    return false
  }

  return {
    profileCompletion: {
      entityOverview: Boolean(entity.organisationName && entity.headline && entity.about && entity.facilitationFocus),
      contactDetails: Boolean(contact.smeContactName && contact.preferredContactRoute && contact.accountAdminName && contact.accountAdminEmail),
      servicesDefined: Boolean(Array.isArray(services.servicesOffered) && services.servicesOffered.length > 0 && services.whatSmesReceive),
      matchingDefined: Boolean(Array.isArray(matching.sectorsSupported) && matching.sectorsSupported.length > 0 && matching.acceptingNewSmes)
    },
    documentation: {
      entityRegistrationOrId: hasDoc("entityRegistrationDoc") || hasDoc("entityRegistration") || hasDoc("identityVerificationDoc") || hasDoc("idVerification") || hasDoc("cipcRegistration"),
      mandateOrAuthority: hasDoc("mandateEvidenceDoc") || hasDoc("formalMandate") || hasDoc("authorityToRepresent"),
      authorisationOrAccreditation: hasDoc("professionalAuthorisationDoc") || hasDoc("regulatoryAuthorisation") || hasDoc("professionalAccreditation"),
      coreDocsUploaded: Boolean(
        (hasDoc("entityRegistrationDoc") || hasDoc("entityRegistration") || hasDoc("identityVerificationDoc") || hasDoc("idVerification") || hasDoc("cipcRegistration")) &&
        (hasDoc("professionalAuthorisationDoc") || hasDoc("regulatoryAuthorisation") || hasDoc("professionalAccreditation") || hasDoc("mandateEvidenceDoc") || hasDoc("formalMandate"))
      )
    },
    facilitationScope: {
      servicesCatalogued: Boolean(Array.isArray(services.servicesOffered) && services.servicesOffered.length >= 2),
      feeStructureClear: Boolean(fees.feeModel && fees.payer),
      initialAssessmentChecklist: Boolean(Array.isArray(fees.initialAssessmentInfo) && fees.initialAssessmentInfo.length > 0),
      responseTimeCommitted: Boolean(fees.typicalResponseTime)
    },
    trackRecord: {
      leadExpertise: Boolean(experience.leadFacilitatorName && experience.leadExperienceBio),
      relationshipsDeclared: Boolean(Array.isArray(experience.relationships) && experience.relationships.length > 0),
      caseStudiesOrReferences: Boolean(
        (Array.isArray(experience.caseStudies) && experience.caseStudies.length > 0) ||
        (Array.isArray(experience.testimonials) && experience.testimonials.length > 0)
      )
    },
    compliance: {
      capacityDeclared: Boolean(legal.capacityInWhichActs),
      legalRegistrationNumber: Boolean(legal.registrationNumber || entity.profileType === "Individual practitioner"),
      declarationAndConsent: Boolean(declaration.accuracy && declaration.approvePublicProfile && declaration.acceptTermsPrivacy)
    }
  }
}

export const calculateVerificationScore = (profileData) => {
  const checklist = createVerificationChecklist(profileData)

  const breakdown = {
    profileCompletion: { label: "Profile Completion", score: 0, max: 30, weight: 0.3 },
    documentation: { label: "Document Vault & Evidence", score: 0, max: 25, weight: 0.25 },
    facilitationScope: { label: "Facilitation Scope & Terms", score: 0, max: 20, weight: 0.2 },
    trackRecord: { label: "Experience & Track Record", score: 0, max: 15, weight: 0.15 },
    compliance: { label: "Legal Standing & Consent", score: 0, max: 10, weight: 0.1 }
  }

  // 1. Profile Completion (30%)
  const compItems = Object.values(checklist.profileCompletion).filter(Boolean).length
  const totalComp = Object.keys(checklist.profileCompletion).length
  breakdown.profileCompletion.score = Math.round((compItems / totalComp) * breakdown.profileCompletion.max)

  // 2. Documentation (25%)
  const docItems = Object.values(checklist.documentation).filter(Boolean).length
  const totalDoc = Object.keys(checklist.documentation).length
  breakdown.documentation.score = Math.round((docItems / totalDoc) * breakdown.documentation.max)

  // 3. Facilitation Scope (20%)
  const scopeItems = Object.values(checklist.facilitationScope).filter(Boolean).length
  const totalScope = Object.keys(checklist.facilitationScope).length
  breakdown.facilitationScope.score = Math.round((scopeItems / totalScope) * breakdown.facilitationScope.max)

  // 4. Track Record (15%)
  const trItems = Object.values(checklist.trackRecord).filter(Boolean).length
  const totalTr = Object.keys(checklist.trackRecord).length
  breakdown.trackRecord.score = Math.round((trItems / totalTr) * breakdown.trackRecord.max)

  // 5. Compliance (10%)
  const legItems = Object.values(checklist.compliance).filter(Boolean).length
  const totalLeg = Object.keys(checklist.compliance).length
  breakdown.compliance.score = Math.round((legItems / totalLeg) * breakdown.compliance.max)

  const totalScore = Object.values(breakdown).reduce((acc, cat) => acc + cat.score, 0)

  return {
    score: Math.min(100, Math.max(0, Math.round(totalScore))),
    breakdown,
    checklist
  }
}

export const getTierInfo = (score) => {
  if (score >= 85) return { tier: "Tier 1: Fully Verified Facilitator", color: "#2e7d32", bg: "#e8f5e9", badge: "Gold Partner" }
  if (score >= 65) return { tier: "Tier 2: Verified Facilitator", color: "#0284c7", bg: "#e0f2fe", badge: "Verified Facilitator" }
  if (score >= 40) return { tier: "Tier 3: In Verification", color: "#d97706", bg: "#fef3c7", badge: "Pending Verification" }
  return { tier: "Tier 4: Profile Incomplete", color: "#dc2626", bg: "#fee2e2", badge: "Incomplete" }
}

export default function CMFVerificationScoreCard({ profileData, compact = false }) {
  const [showModal, setShowModal] = useState(false)
  const { score, breakdown, checklist } = calculateVerificationScore(profileData)
  const tier = getTierInfo(score)

  if (compact) {
    return (
      <div
        onClick={() => setShowModal(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: tier.bg,
          border: `1px solid ${tier.color}33`,
          padding: "6px 12px",
          borderRadius: "20px",
          cursor: "pointer"
        }}
      >
        <Shield size={16} color={tier.color} />
        <span style={{ fontSize: "13px", fontWeight: "700", color: tier.color }}>
          {score}% Verified
        </span>
        <span style={{ fontSize: "11px", color: tier.color, opacity: 0.85 }}>
          ({tier.badge})
        </span>
      </div>
    )
  }

  return (
    <>
      <div style={{
        background: "#ffffff",
        border: "1px solid #e6d7c3",
        borderRadius: "14px",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: tier.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={20} color={tier.color} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#3e2723" }}>
                Facilitator Verification Score
              </h3>
              <span style={{ fontSize: "12px", color: tier.color, fontWeight: "600" }}>
                {tier.tier}
              </span>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: tier.color }}>
              {score}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: "100%", height: "8px", background: "#f0e6da", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
          <div style={{ width: `${score}%`, height: "100%", background: tier.color, transition: "width 0.4s ease" }} />
        </div>

        {/* Breakdown Categories */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "14px" }}>
          {Object.entries(breakdown).map(([key, item]) => (
            <div key={key} style={{ background: "#faf7f2", padding: "8px 10px", borderRadius: "8px", border: "1px solid #f0e6da" }}>
              <div style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "600", marginBottom: "2px" }}>
                {item.label}
              </div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#3e2723" }}>
                {item.score} / {item.max} pts
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            width: "100%",
            padding: "8px",
            background: "#faf7f2",
            border: "1px solid #d7ccc8",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "600",
            color: "#4a352f",
            cursor: "pointer"
          }}
        >
          View Full Verification Audit Checklist ↗
        </button>
      </div>

      {/* Modal Audit View */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            width: "100%",
            maxWidth: "640px",
            maxHeight: "85vh",
            borderRadius: "14px",
            overflowY: "auto",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={20} color={tier.color} />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#3e2723" }}>
                  Verification Criteria Checklist ({score}%)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: "transparent", border: "none", color: "#7d5a50", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {Object.entries(checklist).map(([catKey, items]) => (
                <div key={catKey} style={{ background: "#faf7f2", borderRadius: "10px", padding: "12px", border: "1px solid #e6d7c3" }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: "700", color: "#4a352f", textTransform: "capitalize" }}>
                    {breakdown[catKey]?.label || catKey}
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {Object.entries(items).map(([itemKey, val]) => (
                      <div key={itemKey} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "#5d4037" }}>
                          {itemKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <span style={{ color: val ? "#2e7d32" : "#c62828", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                          {val ? <Check size={14} /> : <X size={14} />} {val ? "Verified" : "Missing"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  padding: "8px 18px",
                  background: "#4a352f",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
