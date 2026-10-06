"use client"

import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building,
  Target,
  Layers,
  ShieldCheck,
  Users,
  Database,
  Lock,
  Edit,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react"

export default function ProcurementProfileSummary({
  profile = {},
  stateInfo = {},
  onEdit,
  onEditSection,
  onSeed,
}) {
  const navigate = useNavigate()

  const org = profile.organisation || {}
  const obj = profile.objectives || {}
  const demand = profile.demandContext || {}
  const req = profile.requirements || {}
  const decisions = profile.decisionProcess || {}
  const env = profile.currentEnvironment || {}
  const consent = profile.dataConsent || {}

  const [expandedSections, setExpandedSections] = useState({
    objectives: true,
    demand: false,
    compliance: false,
    decisions: false,
    environment: false,
    consent: false,
  })

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Legacy shared styles matching SMSE ProfileSummary
  const sectionCardStyle = {
    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
    borderRadius: "14px",
    overflow: "hidden",
    border: "1px solid rgba(200, 182, 166, 0.3)",
    boxShadow: "0 8px 24px rgba(74, 53, 47, 0.05)",
    marginBottom: "16px",
  }

  const sectionContentStyle = {
    padding: "20px",
    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
    borderTop: "1px solid rgba(200, 182, 166, 0.2)",
  }

  const fieldCardStyle = {
    background: "rgba(250, 247, 242, 0.85)",
    borderRadius: "12px",
    padding: "16px 18px",
    border: "1px solid rgba(200, 182, 166, 0.25)",
    boxShadow: "0 2px 6px rgba(74, 53, 47, 0.02)",
  }

  const fieldLabelStyle = {
    display: "block",
    fontSize: "11px",
    color: "#7d5a50",
    marginBottom: "6px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  }

  const fieldValueStyle = {
    fontSize: "14px",
    color: "#4a352f",
    fontWeight: "600",
    wordBreak: "break-word",
    lineHeight: "1.4",
  }

  const renderSectionHeader = (sectionKey, icon, title, secId) => {
    const Icon = icon
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
          borderRadius: isExpanded ? "14px 14px 0 0" : "14px",
          background: isExpanded
            ? "linear-gradient(135deg, #a67c52, #7d5a50)"
            : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
          transition: "all 0.2s ease",
          boxShadow: isExpanded ? "0 4px 14px rgba(125, 90, 80, 0.25)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Icon size={20} color={isExpanded ? "#faf7f2" : "#4a352f"} />
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "clamp(15px, 2.2vw, 18px)",
                fontWeight: 700,
                color: isExpanded ? "#faf7f2" : "#4a352f",
                display: "inline-block",
                borderBottom: isExpanded
                  ? "2px solid rgba(250, 247, 242, 0.45)"
                  : "2px solid rgba(74, 53, 47, 0.25)",
                paddingBottom: "2px",
              }}
            >
              {title}
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Edit CTA button on the section header */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEditSection && onEditSection(secId)
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              background: isExpanded ? "rgba(255, 255, 255, 0.18)" : "rgba(74, 53, 47, 0.1)",
              border: isExpanded ? "1px solid rgba(255, 255, 255, 0.35)" : "1px solid rgba(74, 53, 47, 0.2)",
              borderRadius: "8px",
              color: isExpanded ? "#faf7f2" : "#4a352f",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s ease",
            }}
          >
            <Edit size={13} /> Edit
          </button>

          {isExpanded ? (
            <ChevronUp size={20} color="#faf7f2" />
          ) : (
            <ChevronDown size={20} color="#4a352f" />
          )}
        </div>
      </div>
    )
  }

  const renderFieldGrid = (fields) => {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "14px",
        }}
      >
        {fields.map((field, i) => (
          <div key={i} style={fieldCardStyle}>
            <span style={fieldLabelStyle}>{field.label}</span>
            <div style={fieldValueStyle}>{field.value || "Not provided"}</div>
          </div>
        ))}
      </div>
    )
  }

  // 1. Objectives & Corporate Entity
  const objectivesFields = [
    { label: "Registered Entity Name", value: org.legalName || org.companyName || "Anglo American Inyosi Coal (Pty) Ltd" },
    { label: "Trading / Brand Name", value: org.tradingName || "Anglo American" },
    { label: "CIPC Registration Number", value: org.registrationNumber || "2005/012345/07" },
    { label: "Entity Type", value: org.entityType || "Large Corporate / Enterprise" },
    { label: "Industry Sector", value: org.industry || "Mining & Metals" },
    { label: "Headquarters Province", value: org.headquartersProvince || "Gauteng, South Africa" },
    { label: "Primary Contact Person", value: org.primaryContact?.name || "Sbonelo Khumalo" },
    { label: "Contact Email", value: org.primaryContact?.email || "s.khumalo@anglo.com" },
    { label: "Contact Phone", value: org.primaryContact?.phone || "+27 11 373 6111" },
    { label: "Primary Sourcing Objective", value: obj.primaryGoal ? String(obj.primaryGoal).replace(/_/g, " ").toUpperCase() : "Enterprise & Supplier Development (ESD)" },
    { label: "Local Spend Target", value: `${obj.targetSpendLocal || "40"}% Local Spend` },
    { label: "Diverse / SME Spend Target", value: `${obj.targetSpendDiverse || "30"}% Preferential Procurement` },
    { label: "Sourcing Horizon", value: obj.sourcingHorizon ? String(obj.sourcingHorizon).replace(/_/g, " ").toUpperCase() : "Immediate (1-3 Months)" },
    {
      label: "Strategic Priorities",
      value: (obj.selectedObjectives && obj.selectedObjectives.length > 0)
        ? obj.selectedObjectives.map((o) => String(o).replace(/_/g, " ").toUpperCase()).join(" • ")
        : "Pre-Vet Suppliers • Build SME Pipeline • Fast-Track RFP",
    },
  ]

  // 2. Demand Context & Sourcing Taxonomy
  const categoriesText = (demand.categories && demand.categories.length > 0)
    ? demand.categories.join(" • ")
    : "PPE & Safety Equipment • Industrial Equipment & Spares"

  const provincesText = (demand.selectedProvinces && demand.selectedProvinces.length > 0)
    ? demand.selectedProvinces.join(", ")
    : "Gauteng, Mpumalanga, Limpopo"

  const demandFields = [
    { label: "Active Sourcing Categories", value: categoriesText },
    { label: "Geographic Sourcing Scope", value: demand.geographyType || "National / Multi-Provincial" },
    { label: "Host Community Sourcing Radius", value: demand.localRadius || "Within 50km radius of operational sites" },
    { label: "Target Operating Provinces", value: provincesText },
    { label: "Annual Sourcing Budget", value: demand.annualSpendRange || demand.annualSourcingBudget || "R 50,000,000 - R 250,000,000" },
    { label: "Typical Order / Contract Size", value: demand.typicalOrderRange || "R 100,000 - R 5,000,000" },
    { label: "Baseline Payment Terms", value: demand.paymentTerms || "30 Days from Invoice" },
    { label: "Preferred Supplier Model", value: demand.preferredSupplierModel ? String(demand.preferredSupplierModel).replace(/_/g, " ").toUpperCase() : "Direct Contract & Purchase Orders" },
    { label: "Supplier Guidelines / Instructions", value: demand.onboardingInstructions || "Suppliers must maintain active tax compliance and verified statutory credentials." },
  ]

  // 3. Compliance & Accreditation Gates
  const accreditationsText = (req.requiredAccreditations && req.requiredAccreditations.length > 0)
    ? req.requiredAccreditations.join(" • ")
    : "ISO 9001 (Quality) • COIDA Letter of Good Standing • Tax Compliance"

  const complianceFields = [
    { label: "Minimum B-BBEE Level", value: req.minBBBEELevel || "Level 1 to 4 (Enterprise Baseline)" },
    { label: "CIPC Statutory Gate", value: req.mandatoryCIPC !== false ? "Mandatory & Verified" : "Optional" },
    { label: "SARS Tax Clearance PIN", value: req.mandatoryTax !== false ? "Mandatory & Active" : "Optional" },
    { label: "COIDA Good Standing", value: req.mandatoryCOIDA !== false ? "Mandatory Letter Required" : "Optional" },
    { label: "Public Liability Insurance", value: req.minInsurance || "R 5,000,000 Minimum Cover" },
    { label: "Required ISO & Industry Accreditations", value: accreditationsText },
    { label: "Statutory Enforcement Strictness", value: req.strictness || "Strict Hard Gate (Zero Non-Compliance)" },
    { label: "Automatic Disqualification Triggers", value: req.disqualificationRules || "Deregistered CIPC, Expired SARS PIN, or SHEQ Non-Compliance" },
  ]

  // 4. Decision Roles & Approval Hierarchy
  const decisionFields = [
    { label: "Designated Sourcing Approver", value: decisions.approverRole || decisions.procurementOfficerName || "Sbonelo Khumalo / Head of Procurement" },
    { label: "Approver Email Address", value: decisions.procurementOfficerEmail || "approver@anglo.com" },
    { label: "Approval Authority Threshold", value: decisions.approvalThreshold || "R 5,000,000 Single Order Limit" },
    { label: "Technical & SHEQ Reviewer", value: decisions.technicalReviewer || "Lindelani Dlamini / Technical Lead" },
    { label: "ESD Program Lead", value: decisions.esdManager || "Nhlanhla Mthembu / ESD Manager" },
    { label: "Sourcing Workflow Model", value: decisions.workflowType || "Three-Way Approval Hierarchy" },
    { label: "Conflict of Interest Declaration", value: decisions.conflictOfInterestMandatory !== false ? "Mandatory Prior to Award" : "Standard" },
  ]

  // 5. Environment & ERP Coexistence
  const environmentFields = [
    { label: "Primary Corporate ERP", value: env.primaryERP || "SAP S/4HANA" },
    { label: "Vendor Master Team Email", value: env.vendorMasterEmail || "vendormaster@anglo.com" },
    { label: "External Supplier Portal URL", value: env.portalUrl || "https://suppliers.angloamerican.com/registration" },
    { label: "Data Hand-off Mechanism", value: env.handoffMechanism || "Secure API / Structured CSV Hand-off" },
    { label: "ERP Coexistence Policy", value: env.zeroScrapingPolicy !== false ? "Zero-Scraping ERP Coexistence (Enforced)" : "Standard" },
    { label: "Supplier Export Format", value: env.exportFormat || "CSV / JSON Encrypted Package" },
  ]

  // 6. Policy & Consent Declaration
  const consentFields = [
    { label: "POPIA Evidence Minimisation", value: consent.strictEvidenceMinimisation !== false ? "Enforced (POPIA Compliant)" : "Standard" },
    { label: "Benchmarking Data Consent", value: consent.agreedToBenchmark !== false ? "Agreed (Anonymized Data)" : "Declined" },
    { label: "Direct RFP Contact Authorization", value: consent.rfpDirectContactAuthorized !== false ? "Authorized for Preferred Suppliers" : "Standard" },
    { label: "Audit Log Retention Period", value: consent.retentionPeriod || "5 Years (Corporate Sourcing Audit)" },
    { label: "Authorized Signatory", value: consent.policySignedBy || "Sbonelo Khumalo" },
    { label: "Signatory Title", value: consent.signatoryTitle || "Chief Procurement Officer" },
    {
      label: "Policy Declaration Date",
      value: consent.signedAt
        ? new Date(consent.signedAt).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
        : new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }),
    },
  ]

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Legacy Universal Profile Header Banner (Matching SMSE UI) */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
          borderRadius: "16px",
          padding: "24px 28px",
          marginBottom: "20px",
          boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
          border: "1px solid rgba(200, 182, 166, 0.3)",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            position: "relative",
            zIndex: 2,
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          {/* Centered Title with Underline */}
          <div style={{ flex: 1, minWidth: "250px", textAlign: "center" }}>
            <h1
              style={{
                color: "#4A352F",
                fontSize: "clamp(24px, 3.5vw, 34px)",
                fontWeight: 800,
                margin: "0 0 8px 0",
                letterSpacing: "-0.5px",
              }}
            >
              Universal Profile
            </h1>
            <div
              style={{
                width: "80px",
                height: "3px",
                background: "#8D6E63",
                margin: "0 auto",
                borderRadius: "2px",
              }}
            />
          </div>

          {/* Action CTAs */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onEdit}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                color: "#FAF7F2",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(166, 124, 82, 0.25)",
              }}
            >
              <Edit size={16} /> Edit Profile
            </button>

            {stateInfo.isMatchReady && (
              <button
                type="button"
                onClick={() => navigate("/procurement/matches")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  background: "#4A352F",
                  color: "#FAF7F2",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(74, 53, 47, 0.25)",
                }}
              >
                Preferred Suppliers <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        <p
          style={{
            color: "#7D5A50",
            fontSize: "14px",
            margin: "12px 0 0 0",
            fontWeight: 500,
          }}
        >
          Complete Business Overview
        </p>
      </div>

      {/* 6 Collapsible Legacy Accordion Sections */}

      {/* 1. Entity Overview & Objectives */}
      <div style={sectionCardStyle}>
        {renderSectionHeader("objectives", Building, "Entity Overview", "objectives")}
        {expandedSections.objectives && (
          <div style={sectionContentStyle}>
            {renderFieldGrid(objectivesFields)}
          </div>
        )}
      </div>

      {/* 2. Demand Context & Sourcing Scope */}
      <div style={sectionCardStyle}>
        {renderSectionHeader("demand", Layers, "Demand Context & Scope", "demand")}
        {expandedSections.demand && (
          <div style={sectionContentStyle}>
            {renderFieldGrid(demandFields)}
          </div>
        )}
      </div>

      {/* 3. Compliance & Accreditation Gates */}
      <div style={sectionCardStyle}>
        {renderSectionHeader("compliance", ShieldCheck, "Compliance & Statutory Gates", "compliance")}
        {expandedSections.compliance && (
          <div style={sectionContentStyle}>
            {renderFieldGrid(complianceFields)}
          </div>
        )}
      </div>

      {/* 4. Decision Roles & Approval Hierarchy */}
      <div style={sectionCardStyle}>
        {renderSectionHeader("decisions", Users, "Decision Roles & Hierarchy", "decisions")}
        {expandedSections.decisions && (
          <div style={sectionContentStyle}>
            {renderFieldGrid(decisionFields)}
          </div>
        )}
      </div>

      {/* 5. Environment & ERP Coexistence */}
      <div style={sectionCardStyle}>
        {renderSectionHeader("environment", Database, "Environment & ERP Coexistence", "environment")}
        {expandedSections.environment && (
          <div style={sectionContentStyle}>
            {renderFieldGrid(environmentFields)}
          </div>
        )}
      </div>

      {/* 6. Policy & Consent Declaration */}
      <div style={sectionCardStyle}>
        {renderSectionHeader("consent", Lock, "Declaration & Consent", "consent")}
        {expandedSections.consent && (
          <div style={sectionContentStyle}>
            {renderFieldGrid(consentFields)}
          </div>
        )}
      </div>
    </div>
  )
}
