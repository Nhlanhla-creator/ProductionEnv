"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  Shield,
  Check,
  ChevronDown,
  X,
  Building,
  FileText,
  Layers,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from "lucide-react"

export default function CatalystVerificationScoreCard({ profileData = {}, onEdit }) {
  const [showModal, setShowModal] = useState(false)
  const [verificationScore, setVerificationScore] = useState(0)
  const [scoreBreakdown, setScoreBreakdown] = useState({})
  const [checklist, setChecklist] = useState(null)

  useEffect(() => {
    if (profileData) {
      const { score, breakdown, checklistData } = calculateVerificationScore(profileData)
      setVerificationScore(score)
      setScoreBreakdown(breakdown)
      setChecklist(checklistData)
    }
  }, [profileData])

  const calculateVerificationScore = (data) => {
    const entity = data?.entityOverview || {}
    const contacts = data?.contactDetails || {}
    const objectives = data?.objectives || {}
    const docs = data?.documentUpload || {}
    const programmes = data?.programmeSetup?.programmes || []
    const legacyBrief = data?.programBriefMatchingPreference || {}
    const legacyApp = data?.applicationBrief || {}
    const declaration = data?.declarationConsent || {}

    // 1. Checklist extraction
    const checklistData = {
      essentials: {
        legalName: !!(entity.registeredName && entity.registeredName.trim()),
        legalStructure: !!(entity.legalEntityType && entity.legalEntityType.trim()),
        registrationNumber: !!(entity.registrationNumber && entity.registrationNumber.trim()),
        accountableLeadership: !!(
          (contacts.primaryName || contacts.primaryContactName) &&
          (contacts.primaryPosition || contacts.primaryContactPosition) &&
          (contacts.primaryMobile || contacts.primaryContactMobile)
        ),
        contactLocality: !!(
          (contacts.businessEmail || contacts.primaryEmail) &&
          contacts.country &&
          (contacts.city || contacts.physicalAddress)
        ),
        coreObjectives: !!(
          objectives.catalystActivities?.length > 0 &&
          objectives.platformObjectives?.length > 0
        ),
      },
      documentation: {
        identityEvidence: !!(
          docs.identity_evidence?.name ||
          (Array.isArray(docs.identity_evidence) && docs.identity_evidence.length > 0) ||
          docs.cipcRegistrationCertificate
        ),
        taxClearance: !!(
          docs.tax_clearance?.name ||
          (Array.isArray(docs.tax_clearance) && docs.tax_clearance.length > 0) ||
          docs.taxCompliancePinCertificate
        ),
        authorityEvidence: !!(
          docs.authority_representation?.name ||
          (Array.isArray(docs.authority_representation) && docs.authority_representation.length > 0) ||
          declaration.representativeAgreementFile ||
          entity.organisationalArrangement === "standalone" ||
          entity.organisationalArrangement === "independent"
        ),
        capabilityProfile: !!(
          docs.capability_statement?.name ||
          (Array.isArray(docs.capability_statement) && docs.capability_statement.length > 0) ||
          docs.organisationProfileBrochure
        ),
        bbbeeEvidence: !!(
          docs.bbbee_evidence?.name ||
          (Array.isArray(docs.bbbee_evidence) && docs.bbbee_evidence.length > 0) ||
          entity.legalEntityType === "non_profit" ||
          entity.organisationType === "nonprofit"
        ),
      },
      programmePortfolio: {
        programmesConfigured: programmes.length > 0 || !!legacyBrief.programName,
        programmeBriefComplete:
          programmes.some((p) => !!(p.programmeBrief?.programmeName || p.name)) ||
          !!legacyBrief.programName,
        matchingPreferencesConfigured:
          programmes.some(
            (p) =>
              (p.matchingPreferences?.sectorFocus?.length || 0) > 0 ||
              (p.matchingPreferences?.geographicFocus?.length || 0) > 0
          ) || (legacyBrief.sectorFocus?.length || 0) > 0,
        bigScoreConfigured:
          programmes.some((p) => !!p.bigScoreCustomisation?.pillarWeights) ||
          programmes.length > 0,
        applicationRequirements:
          programmes.some(
            (p) =>
              !!(p.applicationBrief?.overviewObjectives || p.applicationBrief?.cohortCapacity)
          ) || !!legacyApp.cohortCapacity,
      },
      operatingCapacity: {
        operatingHistory: !!(entity.yearEstablished && entity.yearEstablished.toString().trim()),
        industrySector: !!(entity.industrySector && entity.industrySector.trim()),
        companySize: !!(entity.companySize && entity.companySize.trim()),
        networkAffiliations:
          (entity.memberOfAssociation === "yes" && entity.industryAssociations?.length > 0) ||
          entity.memberOfAssociation === "no" ||
          !!entity.referralSource,
      },
      governance: {
        accuracyConfirmed: !!declaration.accuracy,
        dataProcessingConfirmed: !!declaration.dataProcessing,
        termsConfirmed: !!declaration.termsConditions,
        governanceMandate:
          !!declaration.popiaCompliance ||
          !!declaration.onboardingRelationship ||
          !!declaration.listingVisibility,
      },
    }

    // 2. Weights & Scores Breakdown
    const breakdown = {
      essentials: {
        name: "Organisation Essentials",
        score: 0,
        max: 30,
        weight: 0.3,
        items: checklistData.essentials,
      },
      documentation: {
        name: "Document Vault & Evidence",
        score: 0,
        max: 25,
        weight: 0.25,
        items: checklistData.documentation,
      },
      programmePortfolio: {
        name: "Programme Portfolio Setup",
        score: 0,
        max: 20,
        weight: 0.2,
        items: checklistData.programmePortfolio,
      },
      operatingCapacity: {
        name: "Track Record & Capacity",
        score: 0,
        max: 15,
        weight: 0.15,
        items: checklistData.operatingCapacity,
      },
      governance: {
        name: "Governance & Declarations",
        score: 0,
        max: 10,
        weight: 0.1,
        items: checklistData.governance,
      },
    }

    // Calculate subcategory scores
    for (const key of Object.keys(breakdown)) {
      const cat = breakdown[key]
      const items = Object.values(cat.items)
      const completed = items.filter(Boolean).length
      cat.score = items.length > 0 ? (completed / items.length) * cat.max : 0
    }

    // Overall composite score
    const totalScore = Object.values(breakdown).reduce((sum, cat) => sum + cat.score, 0)

    return {
      score: Math.min(100, Math.round(totalScore)),
      breakdown,
      checklistData,
    }
  }

  const getTierInfo = (score) => {
    if (score >= 85) {
      return {
        tier: "Tier 1",
        status: "Fully Verified",
        badge: "🟢",
        description: "Complete organisation profile, valid legal identity evidence, and confirmed representative authority.",
        color: "linear-gradient(135deg, #4CAF50, #2E7D32)",
        ringColor: "#2E7D32",
        textColor: "#1b5e20",
        bgLight: "#e8f5e9",
      }
    }
    if (score >= 70) {
      return {
        tier: "Tier 2",
        status: "Mostly Complete",
        badge: "🔵",
        description: "Core identity and contacts confirmed; profile completion ≥80%; verification review pending.",
        color: "linear-gradient(135deg, #2196F3, #1565C0)",
        ringColor: "#1565C0",
        textColor: "#0d47a1",
        bgLight: "#e3f2fd",
      }
    }
    if (score >= 50) {
      return {
        tier: "Tier 3",
        status: "Partially Verified",
        badge: "🟡",
        description: "Core basics established; outstanding supporting documentation or programme setups required.",
        color: "linear-gradient(135deg, #FF9800, #F57C00)",
        ringColor: "#F57C00",
        textColor: "#e65100",
        bgLight: "#fff3e0",
      }
    }
    return {
      tier: "Tier 4",
      status: "Incomplete",
      badge: "🔴",
      description: "Essential identity, contact details, or statutory declarations missing.",
      color: "linear-gradient(135deg, #F44336, #C62828)",
      ringColor: "#C62828",
      textColor: "#b71c1c",
      bgLight: "#ffebee",
    }
  }

  const tierInfo = getTierInfo(verificationScore)

  const formatItemLabel = (key) => {
    const labels = {
      legalName: "Registered Legal Name",
      legalStructure: "Legal Entity Type & Jurisdiction",
      registrationNumber: "Registration / CIPC Identifier",
      accountableLeadership: "Accountable Leadership Contact",
      contactLocality: "Physical Address & Official Email",
      coreObjectives: "Catalyst Activities & Objectives Selected",
      identityEvidence: "Legal Existence / Incorporation Certificate",
      taxClearance: "SARS Tax Compliance Status PIN",
      authorityEvidence: "Authority to Represent / Delegation Mandate",
      capabilityProfile: "Organisation Capability Statement / Profile",
      bbbeeEvidence: "B-BBEE Certificate or Sworn Affidavit",
      programmesConfigured: "At Least 1 Programme Configured",
      programmeBriefComplete: "Programme Brief, Type & Mandate Configured",
      matchingPreferencesConfigured: "Target Sectors, Geography & Turnover Defined",
      bigScoreConfigured: "5Cs Pillar Weights & Stage Customised",
      applicationRequirements: "Eligibility & Document Rules Defined",
      operatingHistory: "Operating History / Year Established",
      industrySector: "Target Support Industry Sector",
      companySize: "Operational Team / Staff Size",
      networkAffiliations: "Industry Association or Network Affiliations",
      accuracyConfirmed: "Declaration of Accuracy Confirmed",
      dataProcessingConfirmed: "POPIA Data Processing Consent Confirmed",
      termsConfirmed: "Platform Terms & Conditions Accepted",
      governanceMandate: "Onboarding Relationship & Governance Mandate",
    }
    return labels[key] || key
  }

  const VerificationModal = () => {
    if (!showModal || !checklist) return null

    return createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(74, 53, 47, 0.65)",
          backdropFilter: "blur(12px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 999999,
          padding: "20px",
          animation: "fadeIn 0.25s ease-out",
        }}
        onClick={() => setShowModal(false)}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #faf7f2 0%, #f5f0e1 100%)",
            borderRadius: "24px",
            padding: "36px",
            width: "100%",
            maxWidth: "840px",
            maxHeight: "90vh",
            overflowY: "auto",
            position: "relative",
            boxShadow: "0 32px 64px rgba(74, 53, 47, 0.25)",
            border: "1px solid rgba(200, 182, 166, 0.4)",
            animation: "slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={() => setShowModal(false)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "#e6d7c3",
              border: "none",
              color: "#4a352f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#c8b6a6"
              e.currentTarget.style.transform = "scale(1.05)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#e6d7c3"
              e.currentTarget.style.transform = "scale(1)"
            }}
            title="Close"
          >
            <X size={20} />
          </button>

          {/* Modal Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "28px", borderBottom: "1px solid #e6d7c3", paddingBottom: "24px" }}>
            <div
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                background: tierInfo.color,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 8px 24px rgba(74, 53, 47, 0.2)",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "28px", fontWeight: "800", lineHeight: "1" }}>{verificationScore}%</span>
              <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px" }}>Score</span>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "16px" }}>{tierInfo.badge}</span>
                <span
                  style={{
                    backgroundColor: tierInfo.bgLight,
                    color: tierInfo.textColor,
                    padding: "3px 10px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "700",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  {tierInfo.tier} · {tierInfo.status}
                </span>
              </div>
              <h2 style={{ margin: "0 0 6px 0", fontSize: "24px", fontWeight: "800", color: "#4a352f" }}>
                Catalyst Verification Assessment
              </h2>
              <p style={{ margin: 0, fontSize: "14px", color: "#7d5a50", lineHeight: "1.4" }}>
                {tierInfo.description}
              </p>
            </div>
          </div>

          {/* Categories Progress Breakdown */}
          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", margin: "0 0 16px 0" }}>
              Category Weighting & Progress
            </h3>
            <div style={{ display: "grid", gap: "12px" }}>
              {Object.entries(scoreBreakdown).map(([catKey, cat]) => {
                const pct = Math.round((cat.score / cat.max) * 100)
                return (
                  <div
                    key={catKey}
                    style={{
                      background: "rgba(255, 255, 255, 0.7)",
                      borderRadius: "14px",
                      padding: "14px 18px",
                      border: "1px solid rgba(200, 182, 166, 0.3)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#4a352f" }}>
                        {cat.name}
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#7d5a50" }}>
                        {Math.round(cat.score)} / {cat.max} pts ({pct}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: "8px",
                        background: "#e6d7c3",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: pct >= 85 ? "#2e7d32" : pct >= 50 ? "#a67c52" : "#c62828",
                          borderRadius: "999px",
                          transition: "width 0.4s ease-out",
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detailed Itemized Checklist */}
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", margin: "0 0 16px 0" }}>
              Verification Checklist & Requirements
            </h3>
            <div style={{ display: "grid", gap: "20px" }}>
              {Object.entries(checklist).map(([catKey, items]) => {
                const catName = scoreBreakdown[catKey]?.name || catKey
                return (
                  <div
                    key={catKey}
                    style={{
                      background: "#ffffff",
                      borderRadius: "16px",
                      padding: "18px 22px",
                      border: "1px solid rgba(200, 182, 166, 0.35)",
                      boxShadow: "0 2px 8px rgba(74, 53, 47, 0.04)",
                    }}
                  >
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#7d5a50", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {catName}
                    </h4>
                    <div style={{ display: "grid", gap: "10px" }}>
                      {Object.entries(items).map(([itemKey, isComplete]) => (
                        <div
                          key={itemKey}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "13px",
                            padding: "6px 0",
                            borderBottom: "1px dashed #f0e6dc",
                          }}
                        >
                          <span style={{ color: isComplete ? "#2e7d32" : "#4a352f", fontWeight: isComplete ? "500" : "400" }}>
                            {formatItemLabel(itemKey)}
                          </span>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                              fontWeight: "600",
                              color: isComplete ? "#2e7d32" : "#9e9e9e",
                              backgroundColor: isComplete ? "#e8f5e9" : "#f5f5f5",
                              padding: "2px 8px",
                              borderRadius: "6px",
                            }}
                          >
                            {isComplete ? (
                              <>
                                <Check size={13} /> Verified
                              </>
                            ) : (
                              <>Pending</>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div
            style={{
              marginTop: "32px",
              paddingTop: "20px",
              borderTop: "1px solid #e6d7c3",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <button
              onClick={() => {
                setShowModal(false)
                if (onEdit) onEdit()
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                color: "#faf7f2",
                border: "none",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(166, 124, 82, 0.3)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)"
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(166, 124, 82, 0.4)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(166, 124, 82, 0.3)"
              }}
            >
              Update Missing Information
            </button>

            <button
              onClick={() => setShowModal(false)}
              style={{
                padding: "12px 20px",
                background: "#f5f0e1",
                color: "#7d5a50",
                border: "1px solid #c8b6a6",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return (
    <>
      <div
        style={{
          background: "linear-gradient(135deg, rgba(250, 247, 242, 0.95), rgba(245, 240, 225, 0.95))",
          borderRadius: "20px",
          padding: "24px",
          border: "1px solid rgba(200, 182, 166, 0.3)",
          boxShadow: "0 12px 32px rgba(74, 53, 47, 0.08)",
          position: "relative",
          overflow: "hidden",
          minWidth: "300px",
          maxWidth: "360px",
          cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)"
          e.currentTarget.style.boxShadow = "0 16px 40px rgba(74, 53, 47, 0.12)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = "0 12px 32px rgba(74, 53, 47, 0.08)"
        }}
        onClick={() => setShowModal(true)}
      >
        {/* Subtle Decorative Circle */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "120px",
            height: "120px",
            background: "radial-gradient(circle, rgba(166, 124, 82, 0.12) 0%, transparent 70%)",
            borderRadius: "50%",
            transform: "translate(30px, -30px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "18px", position: "relative", zIndex: 2 }}>
          {/* Circular Score Gauge */}
          <div
            style={{
              width: "82px",
              height: "82px",
              borderRadius: "50%",
              background: tierInfo.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: "800",
              color: "#ffffff",
              boxShadow: "0 8px 24px rgba(74, 53, 47, 0.2)",
              position: "relative",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "conic-gradient(from 0deg, transparent, rgba(255,255,255,0.25), transparent)",
                borderRadius: "50%",
                animation: "spin 3s linear infinite",
              }}
            />
            <span style={{ position: "relative", zIndex: 1 }}>{verificationScore}%</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <Shield size={18} color="#4a352f" />
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#4a352f", whiteSpace: "nowrap" }}>
                Catalyst Verification
              </h3>
            </div>
            <p
              style={{
                margin: "0 0 4px 0",
                fontSize: "13px",
                color: "#7d5a50",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>{tierInfo.badge}</span> {tierInfo.tier} · {tierInfo.status}
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: "#a89482", lineHeight: "1.3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {tierInfo.description}
            </p>
          </div>
        </div>

        {/* View Breakdown Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowModal(true)
          }}
          style={{
            width: "100%",
            marginTop: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "10px 16px",
            background: "linear-gradient(135deg, #4a352f, #7d5a50)",
            color: "#faf7f2",
            border: "none",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 3px 12px rgba(74, 53, 47, 0.2)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)"
            e.currentTarget.style.boxShadow = "0 5px 16px rgba(74, 53, 47, 0.3)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "0 3px 12px rgba(74, 53, 47, 0.2)"
          }}
        >
          View Detailed Breakdown
          <ChevronDown size={15} />
        </button>
      </div>

      <VerificationModal />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
