"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Shield, ChevronDown, Check, X, Award, CheckCircle, AlertCircle, FileText, Building2, UserCheck, TrendingUp, HelpCircle } from "lucide-react"

const hasDoc = (data, key) => {
  const docs = data?.documents || data?.documentUpload || data?.formData?.documents || {}
  const val = docs[key]
  if (Array.isArray(val) && val.length > 0) return true
  if (typeof val === "string" && val.trim() !== "") return true
  if (val && typeof val === "object" && Object.keys(val).length > 0) return true
  return false
}

const createVerificationChecklist = (data) => {
  const entity = data?.entityOverview || data?.formData?.entityOverview || {}
  const contact = data?.contactDetails || data?.formData?.contactDetails || {}
  const ownership = data?.ownershipManagement || data?.formData?.ownershipManagement || {}
  const legal = data?.legalCompliance || data?.formData?.legalCompliance || {}
  const products = data?.productsServices || data?.formData?.productsServices || {}
  const prefs = data?.generalInvestmentPreference || data?.formData?.generalInvestmentPreference || {}
  const declaration = data?.declarationConsent || data?.formData?.declarationConsent || {}

  return {
    identityAndLegal: {
      cipcRegistration: hasDoc(data, "cipcRegistration") || hasDoc(data, "registrationDocs"),
      registeredName: Boolean(entity.registeredName && String(entity.registeredName).trim()),
      registrationNumber: Boolean(entity.registrationNumber && String(entity.registrationNumber).trim()),
      businessDescription: Boolean(entity.businessDescription && String(entity.businessDescription).trim()),
      proofOfAddress: hasDoc(data, "proofOfAddress") || Boolean(contact.physicalAddress && String(contact.physicalAddress).trim()),
      primaryContactPerson: Boolean(contact.contactName && (contact.email || contact.businessPhone || contact.mobile)),
    },
    governanceAndLeadership: {
      shareholdersDeclared: Boolean(ownership.shareholders && ownership.shareholders.length > 0 && ownership.shareholders[0]?.name),
      directorsIdentified: Boolean(ownership.directors && ownership.directors.length > 0 && ownership.directors[0]?.name),
      leadershipGovernance: Boolean(ownership.businessLeadership?.ownerLed || ownership.businessLeadership?.decisionGovernance || (ownership.executives && ownership.executives.length > 0)),
      yearsInOperation: Boolean(entity.yearsInOperation !== undefined && entity.yearsInOperation !== ""),
    },
    facilitationOfferings: {
      serviceOfferingsDefined: Boolean((products.offerings && products.offerings.length > 0) || (products.serviceCategories && products.serviceCategories.length > 0) || products.offeringType),
      deliveryModesConfigured: Boolean(products.deliveryModes && products.deliveryModes.length > 0),
      targetMarketSpecified: Boolean(products.targetMarket && String(products.targetMarket).trim()),
      capabilityDocumentation: hasDoc(data, "capabilityStatement") || hasDoc(data, "companyProfile") || hasDoc(data, "brochure") || hasDoc(data, "caseStudies"),
    },
    complianceAndCredentials: {
      taxComplianceStatus: Boolean(legal.taxNumber || legal.taxClearancePin || hasDoc(data, "taxCompliancePin")),
      bbbeeStatus: Boolean(legal.bbbeeLevel || hasDoc(data, "bbbeeCertificate")),
      fspOrAccreditations: hasDoc(data, "fspLicence") || hasDoc(data, "professionalIndemnityInsurance") || hasDoc(data, "industryAccreditations") || hasDoc(data, "isoCertifications"),
      vatRegistration: Boolean(legal.vatNumber || hasDoc(data, "vatCertificate")),
    },
    matchingAndConsent: {
      matchingPreferencesConfigured: Boolean((prefs.sectorFocus && prefs.sectorFocus.length > 0) || (prefs.geographicFocus && prefs.geographicFocus.length > 0) || prefs.fundStructure || prefs.riskAppetite),
      declarationConsentCompleted: Boolean(declaration.accuracy && declaration.dataProcessing && declaration.termsConditions),
    },
  }
}

const calculateVerificationScore = (profileData) => {
  const checklist = createVerificationChecklist(profileData)

  const breakdown = {
    identityAndLegal: { label: "Identity & Legal Standing", score: 0, max: 25, weight: 0.25 },
    governanceAndLeadership: { label: "Governance & Leadership", score: 0, max: 20, weight: 0.20 },
    facilitationOfferings: { label: "Facilitation Offerings & Track Record", score: 0, max: 25, weight: 0.25 },
    complianceAndCredentials: { label: "Compliance & Industry Credentials", score: 0, max: 15, weight: 0.15 },
    matchingAndConsent: { label: "Matching Preferences & Consent", score: 0, max: 15, weight: 0.15 },
  }

  // 1. Identity & Legal (25 max)
  const idItems = checklist.identityAndLegal
  const idCount = Object.values(idItems).filter(Boolean).length
  breakdown.identityAndLegal.score = Math.round((idCount / Object.keys(idItems).length) * breakdown.identityAndLegal.max)

  // 2. Governance & Leadership (20 max)
  const govItems = checklist.governanceAndLeadership
  const govCount = Object.values(govItems).filter(Boolean).length
  breakdown.governanceAndLeadership.score = Math.round((govCount / Object.keys(govItems).length) * breakdown.governanceAndLeadership.max)

  // 3. Facilitation Offerings (25 max)
  const facItems = checklist.facilitationOfferings
  const facCount = Object.values(facItems).filter(Boolean).length
  breakdown.facilitationOfferings.score = Math.round((facCount / Object.keys(facItems).length) * breakdown.facilitationOfferings.max)

  // 4. Compliance & Credentials (15 max)
  const compItems = checklist.complianceAndCredentials
  const compCount = Object.values(compItems).filter(Boolean).length
  breakdown.complianceAndCredentials.score = Math.round((compCount / Object.keys(compItems).length) * breakdown.complianceAndCredentials.max)

  // 5. Matching & Consent (15 max)
  const matchItems = checklist.matchingAndConsent
  const matchCount = Object.values(matchItems).filter(Boolean).length
  breakdown.matchingAndConsent.score = Math.round((matchCount / Object.keys(matchItems).length) * breakdown.matchingAndConsent.max)

  const totalScore = Object.values(breakdown).reduce((acc, cat) => acc + cat.score, 0)

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    breakdown,
    checklist,
  }
}

const getTierInfo = (score) => {
  if (score >= 85) {
    return {
      status: "Verified",
      tier: "Tier 1: Verified Facilitator",
      name: "Verified Facilitator",
      badge: "🟢",
      icon: "🟢",
      description: "Fully verified & certified. Highest trust rating and priority dealflow matching.",
      color: "#2e7d32",
      gradient: "linear-gradient(135deg, #2e7d32, #1b5e20)",
      textColor: "#ffffff",
      badgeBg: "rgba(46, 125, 50, 0.15)",
      badgeBorder: "#2e7d32",
    }
  }
  if (score >= 70) {
    return {
      status: "Verified",
      tier: "Tier 2: Trusted Facilitator",
      name: "Trusted Facilitator",
      badge: "🔵",
      icon: "🔵",
      description: "Core legal standing, services, and compliance verified. Eligible for dealflow.",
      color: "#0284c7",
      gradient: "linear-gradient(135deg, #0284c7, #0369a1)",
      textColor: "#ffffff",
      badgeBg: "rgba(2, 132, 199, 0.15)",
      badgeBorder: "#0284c7",
    }
  }
  if (score >= 50) {
    return {
      status: "Partially Verified",
      tier: "Tier 3: Registered Facilitator",
      name: "Registered Facilitator",
      badge: "🟡",
      icon: "🟡",
      description: "Basic entity registered. Upload remaining compliance docs to reach full verification.",
      color: "#d97706",
      gradient: "linear-gradient(135deg, #d97706, #b45309)",
      textColor: "#ffffff",
      badgeBg: "rgba(217, 119, 6, 0.15)",
      badgeBorder: "#d97706",
    }
  }
  return {
    status: "Incomplete",
    tier: "Tier 4: Incomplete Profile",
    name: "Incomplete Profile",
    badge: "🔴",
    icon: "🔴",
    description: "Profile in progress. Complete required entity, document, and declaration fields.",
    color: "#dc2626",
    gradient: "linear-gradient(135deg, #dc2626, #b91c1c)",
    textColor: "#ffffff",
    badgeBg: "rgba(220, 38, 38, 0.15)",
    badgeBorder: "#dc2626",
  }
}

const formatRequirementName = (key) => {
  const names = {
    cipcRegistration: "CIPC Registration Document",
    registeredName: "Registered / Trading Entity Name",
    registrationNumber: "Company Registration Number",
    businessDescription: "Business Description & Scope",
    proofOfAddress: "Proof of Business Address",
    primaryContactPerson: "Primary Contact & Phone / Email",
    shareholdersDeclared: "Shareholders & Equity Breakdown",
    directorsIdentified: "Board of Directors Details",
    leadershipGovernance: "Governance & Executive Leadership",
    yearsInOperation: "Operating History / Years in Business",
    serviceOfferingsDefined: "Facilitation & Service Offerings",
    deliveryModesConfigured: "Service Delivery Modes & Lead Times",
    targetMarketSpecified: "Target Market & Institutional Clients",
    capabilityDocumentation: "Company Profile / Capability Statement",
    taxComplianceStatus: "Tax Number & SARS Tax Clearance PIN",
    bbbeeStatus: "B-BBEE Compliance Level & Certificate",
    fspOrAccreditations: "FSP Licence / Accreditations / Insurance",
    vatRegistration: "VAT Registration Certificate / Status",
    matchingPreferencesConfigured: "Dealflow Matching & Sector Preferences",
    declarationConsentCompleted: "Declaration of Accuracy & Terms Consent",
  }
  return names[key] || key.replace(/([A-Z])/g, " $1").trim()
}

const CMFVerificationScoreCard = ({ profileData }) => {
  const [showModal, setShowModal] = useState(false)
  const [verificationScore, setVerificationScore] = useState(0)
  const [scoreBreakdown, setScoreBreakdown] = useState({})
  const [animatedScore, setAnimatedScore] = useState(0)
  const [verificationChecklist, setVerificationChecklist] = useState(null)

  useEffect(() => {
    if (profileData) {
      const { score, breakdown, checklist } = calculateVerificationScore(profileData)
      setVerificationScore(score)
      setScoreBreakdown(breakdown)
      setVerificationChecklist(checklist)

      // Animate score count-up
      let start = 0
      const increment = Math.max(1, score / 40)
      const timer = setInterval(() => {
        start += increment
        if (start >= score) {
          setAnimatedScore(score)
          clearInterval(timer)
        } else {
          setAnimatedScore(Math.floor(start))
        }
      }, 25)

      return () => clearInterval(timer)
    }
  }, [profileData])

  const tierInfo = getTierInfo(verificationScore)

  const VerificationModal = () => {
    if (!showModal || !verificationChecklist) return null

    return createPortal(
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(74, 53, 47, 0.65)",
          backdropFilter: "blur(12px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 999999,
          padding: "20px",
          boxSizing: "border-box",
          animation: "cmfFadeIn 0.3s ease-out",
        }}
        onClick={() => setShowModal(false)}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #faf7f2 0%, #f5f0e1 100%)",
            borderRadius: "24px",
            padding: "36px",
            width: "100%",
            maxWidth: "820px",
            maxHeight: "88vh",
            overflowY: "auto",
            position: "relative",
            boxShadow: "0 32px 64px rgba(74, 53, 47, 0.25)",
            border: "1px solid rgba(200, 182, 166, 0.4)",
            animation: "cmfSlideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            boxSizing: "border-box",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={() => setShowModal(false)}
            style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
              border: "none",
              borderRadius: "50%",
              cursor: "pointer",
              color: "#4a352f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #c8b6a6, #a67c52)"
              e.currentTarget.style.color = "#faf7f2"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #e6d7c3, #c8b6a6)"
              e.currentTarget.style.color = "#4a352f"
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Modal Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#faf7f2",
                boxShadow: "0 4px 12px rgba(166, 124, 82, 0.3)",
              }}
            >
              <Shield size={26} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: "#4a352f", fontSize: "24px", fontWeight: "800", letterSpacing: "-0.01em" }}>
                CMF Verification Breakdown
              </h3>
              <p style={{ margin: "4px 0 0 0", color: "#7d5a50", fontSize: "14px", fontWeight: "500" }}>
                Capital & Market Facilitator Credibility Audit
              </p>
            </div>
          </div>

          {/* Score Banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              marginBottom: "32px",
              padding: "24px",
              background: "linear-gradient(135deg, rgba(240, 230, 217, 0.7), rgba(245, 240, 225, 0.7))",
              borderRadius: "18px",
              border: "1px solid rgba(200, 182, 166, 0.3)",
            }}
          >
            <div
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "50%",
                background: tierInfo.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: "800",
                color: "#ffffff",
                boxShadow: "0 8px 24px rgba(74, 53, 47, 0.2)",
                flexShrink: 0,
              }}
            >
              {verificationScore}%
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "22px" }}>{tierInfo.badge}</span>
                <h4 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#4a352f" }}>
                  {tierInfo.tier}
                </h4>
              </div>
              <p style={{ margin: 0, color: "#7d5a50", fontSize: "14px", lineHeight: "1.5" }}>
                {tierInfo.description}
              </p>
            </div>
          </div>

          {/* Pillars Breakdown */}
          <div style={{ marginBottom: "32px" }}>
            <h4 style={{ color: "#4a352f", fontSize: "18px", fontWeight: "700", margin: "0 0 16px 0", letterSpacing: "-0.01em" }}>
              Pillar Breakdown & Weighting
            </h4>
            <div style={{ display: "grid", gap: "12px" }}>
              {Object.entries(scoreBreakdown).map(([category, data]) => {
                const percentage = Math.round((data.score / data.max) * 100)
                return (
                  <div
                    key={category}
                    style={{
                      padding: "16px 20px",
                      background: "rgba(255, 255, 255, 0.65)",
                      borderRadius: "14px",
                      border: "1px solid rgba(200, 182, 166, 0.25)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontWeight: "700", color: "#4a352f", fontSize: "14px" }}>
                        {data.label}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "12px", color: "#8d6e63", fontWeight: "500" }}>
                          Weight: {Math.round(data.weight * 100)}%
                        </span>
                        <span style={{ fontWeight: "700", color: "#7d5a50", fontSize: "14px" }}>
                          {data.score} / {data.max} pts ({percentage}%)
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        background: "rgba(200, 182, 166, 0.25)",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: "100%",
                          background: percentage >= 80 ? "linear-gradient(90deg, #4CAF50, #2E7D32)" : percentage >= 60 ? "linear-gradient(90deg, #0284c7, #0369a1)" : "linear-gradient(90deg, #d97706, #b45309)",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Verification Checklist */}
          <div style={{ marginBottom: "32px" }}>
            <h4 style={{ color: "#4a352f", fontSize: "18px", fontWeight: "700", margin: "0 0 16px 0", letterSpacing: "-0.01em" }}>
              Detailed Verification Checklist
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {Object.entries(verificationChecklist).map(([sectionKey, items]) => {
                const sectionLabels = {
                  identityAndLegal: "1. Identity & Legal Standing",
                  governanceAndLeadership: "2. Governance & Leadership",
                  facilitationOfferings: "3. Facilitation Offerings",
                  complianceAndCredentials: "4. Compliance & Credentials",
                  matchingAndConsent: "5. Matching & Consent",
                }
                return (
                  <div
                    key={sectionKey}
                    style={{
                      background: "rgba(255, 255, 255, 0.6)",
                      borderRadius: "16px",
                      padding: "18px",
                      border: "1px solid rgba(200, 182, 166, 0.25)",
                    }}
                  >
                    <h5 style={{ color: "#7d5a50", fontSize: "14px", fontWeight: "700", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {sectionLabels[sectionKey] || sectionKey}
                    </h5>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {Object.entries(items).map(([key, met]) => (
                        <div
                          key={key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 12px",
                            background: met ? "rgba(76, 175, 80, 0.08)" : "rgba(158, 158, 158, 0.08)",
                            borderRadius: "10px",
                            border: met ? "1px solid rgba(76, 175, 80, 0.25)" : "1px solid rgba(158, 158, 158, 0.25)",
                          }}
                        >
                          <div
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                              background: met ? "#2e7d32" : "#9e9e9e",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#ffffff",
                              fontSize: "12px",
                              fontWeight: "bold",
                              flexShrink: 0,
                            }}
                          >
                            {met ? "✓" : "○"}
                          </div>
                          <span style={{ color: met ? "#2e4a2c" : "#5d4037", fontWeight: "500", fontSize: "13px" }}>
                            {formatRequirementName(key)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Verification Tiers Overview */}
          <div
            style={{
              padding: "20px",
              background: "linear-gradient(135deg, rgba(166, 124, 82, 0.1), rgba(125, 90, 80, 0.05))",
              borderRadius: "16px",
              border: "1px solid rgba(166, 124, 82, 0.2)",
            }}
          >
            <h4 style={{ color: "#4a352f", fontSize: "16px", fontWeight: "700", margin: "0 0 12px 0" }}>
              BIG Marketplace CMF Verification Tiers
            </h4>
            <div style={{ display: "grid", gap: "10px" }}>
              {[
                { min: 85, badge: "🟢", name: "Tier 1: Verified Facilitator (85%+)", desc: "Full credibility audit passed. Priority placement in SME & Funder dealflow matching." },
                { min: 70, badge: "🔵", name: "Tier 2: Trusted Facilitator (70–84%)", desc: "Core business standing and service offerings active. Eligible for standard deal introductions." },
                { min: 50, badge: "🟡", name: "Tier 3: Registered Facilitator (50–69%)", desc: "Basic entity and contacts registered. Upload compliance documents to elevate tier." },
                { min: 0, badge: "🔴", name: "Tier 4: Incomplete Profile (<50%)", desc: "Initial onboarding stage. Complete required sections to activate matchmaking." },
              ].map((tierItem, i) => {
                const isCurrent =
                  (tierItem.min === 85 && verificationScore >= 85) ||
                  (tierItem.min === 70 && verificationScore >= 70 && verificationScore < 85) ||
                  (tierItem.min === 50 && verificationScore >= 50 && verificationScore < 70) ||
                  (tierItem.min === 0 && verificationScore < 50)
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "12px",
                      padding: "12px 14px",
                      background: isCurrent ? "rgba(255, 255, 255, 0.85)" : "transparent",
                      borderRadius: "10px",
                      border: isCurrent ? "2px solid #a67c52" : "1px solid transparent",
                      boxShadow: isCurrent ? "0 4px 12px rgba(74, 53, 47, 0.08)" : "none",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>{tierItem.badge}</span>
                    <div>
                      <div style={{ fontWeight: "700", color: "#4a352f", fontSize: "13px", marginBottom: "2px" }}>
                        {tierItem.name} {isCurrent && <span style={{ color: "#a67c52", fontSize: "11px", fontWeight: "700" }}>• YOUR CURRENT TIER</span>}
                      </div>
                      <div style={{ fontSize: "12px", color: "#7d5a50", lineHeight: "1.4" }}>
                        {tierItem.desc}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  return (
    <>
      <div
        style={{
          background: "linear-gradient(135deg, #faf7f2 0%, #f5f0e1 100%)",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(74, 53, 47, 0.1), 0 8px 16px rgba(74, 53, 47, 0.06)",
          border: "1px solid rgba(200, 182, 166, 0.3)",
          position: "relative",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          cursor: "pointer",
          maxWidth: "380px",
          width: "100%",
          boxSizing: "border-box",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-6px)"
          e.currentTarget.style.boxShadow = "0 28px 56px rgba(74, 53, 47, 0.15), 0 12px 24px rgba(74, 53, 47, 0.08)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = "0 20px 40px rgba(74, 53, 47, 0.1), 0 8px 16px rgba(74, 53, 47, 0.06)"
        }}
        onClick={() => setShowModal(true)}
      >
        {/* Decorative background radial circle */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "120px",
            height: "120px",
            background: "radial-gradient(circle, rgba(74, 53, 47, 0.1) 0%, transparent 70%)",
            borderRadius: "50%",
            transform: "translate(40px, -40px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "18px", position: "relative", zIndex: 2 }}>
          {/* Animated Circular Score */}
          <div
            style={{
              width: "84px",
              height: "84px",
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
                animation: "cmfSpin 3s linear infinite",
              }}
            />
            <span style={{ position: "relative", zIndex: 2 }}>{animatedScore}%</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Shield size={18} color="#4a352f" />
              <h3
                style={{
                  margin: 0,
                  fontSize: "17px",
                  fontWeight: "700",
                  color: "#4a352f",
                  letterSpacing: "-0.01em",
                }}
              >
                CMF Verification
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
                gap: "4px",
              }}
            >
              <span>{tierInfo.badge}</span> {tierInfo.tier.split(":")[1] || tierInfo.tier}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "#8d6e63",
                lineHeight: "1.3",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {tierInfo.description}
            </p>
          </div>
        </div>

        {/* Action Button */}
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
            gap: "8px",
            padding: "10px 18px",
            background: "linear-gradient(135deg, #4a352f, #7d5a50)",
            color: "#faf7f2",
            border: "none",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 4px 14px rgba(74, 53, 47, 0.25)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)"
            e.currentTarget.style.boxShadow = "0 6px 18px rgba(74, 53, 47, 0.35)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(74, 53, 47, 0.25)"
          }}
        >
          View Detailed Breakdown
          <ChevronDown size={14} />
        </button>
      </div>

      <VerificationModal />

      <style>{`
        @keyframes cmfSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes cmfFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cmfSlideUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}

export { calculateVerificationScore, createVerificationChecklist, getTierInfo }
export default CMFVerificationScoreCard
