"use client"
import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Edit,
  FileText,
  ExternalLink,
  Building,
  Users,
  Mail,
  Shield,
  Package,
  MessageCircle,
  CheckSquare,
  Linkedin,
  DollarSign,
  FileCheck,
  Target,
  AlertTriangle,
  Phone,
  MapPin,
  Award,
  Clock,
  Layers,
  Truck,
  Briefcase,
} from "lucide-react"

const ProfileSummary = ({ data, onEdit }) => {
  const [expandedSections, setExpandedSections] = useState({
    entityOverview: false,
     productsServices: false,
    ownershipManagement: false,
    contactDetails: false,
    legalCompliance: false,
    operationsOverview: false,
    financialOverview: false,
    governance: false,
   
    howDidYouHear: false,
    declarationConsent: false,
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const formatLabel = (value) => {
    if (!value) return "Not provided"
    if (typeof value === "boolean") return value ? "Yes" : "No"
    return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  }

  const renderDocumentLink = (url, label = "View Document") => {
    if (!url) return "No document uploaded"
    return (
      <div
        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "linear-gradient(135deg, #a67c52, #7d5a50)", color: "#faf7f2", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer", maxWidth: "fit-content" }}
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      >
        <FileText size={16} /><span>{label}</span><ExternalLink size={14} />
      </div>
    )
  }

  const renderLinkedInLink = (url) => {
    if (!url) return "Not provided"
    return (
      <div
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", background: "linear-gradient(135deg, #0077b5, #005582)", color: "#ffffff", borderRadius: "6px", fontSize: "12px", fontWeight: "500", cursor: "pointer", maxWidth: "fit-content" }}
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      >
        <Linkedin size={14} /><span>LinkedIn</span><ExternalLink size={11} />
      </div>
    )
  }

  const formatBoolean = (value) => (value ? "✅ Yes" : "❌ No")

  const handleEdit = () => { if (onEdit) onEdit() }

  // ── Shared styles ──────────────────────────────────────────────────────────
  const sectionCardStyle = {
    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
    backdropFilter: "blur(20px)", borderRadius: "16px", overflow: "hidden",
    border: "1px solid rgba(200, 182, 166, 0.3)", boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
  }
  const sectionContentStyle = {
    padding: "20px", background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
    animation: "slideDown 0.3s ease-out",
  }
  const fieldCardStyle = {
    background: "rgba(250, 247, 242, 0.8)", borderRadius: "12px", padding: "16px",
    border: "1px solid rgba(200, 182, 166, 0.2)",
  }
  const fieldLabelStyle = {
    display: "block", fontSize: "12px", color: "#7d5a50", marginBottom: "6px",
    fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px",
  }
  const fieldValueStyle = { fontSize: "14px", color: "#4a352f", fontWeight: "500" }

  const renderSectionHeader = (sectionKey, icon, title) => {
    const Icon = icon
    return (
      <div
        onClick={() => toggleSection(sectionKey)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", cursor: "pointer",
          background: expandedSections[sectionKey] ? "linear-gradient(135deg, #a67c52, #7d5a50)" : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Icon size={20} color={expandedSections[sectionKey] ? "#faf7f2" : "#4a352f"} />
          <h2 style={{ margin: 0, fontSize: "clamp(16px, 2.5vw, 20px)", fontWeight: "700", color: expandedSections[sectionKey] ? "#faf7f2" : "#4a352f" }}>{title}</h2>
        </div>
        {expandedSections[sectionKey] ? <ChevronUp size={20} color="#faf7f2" /> : <ChevronDown size={20} color="#4a352f" />}
      </div>
    )
  }

  const renderFieldGrid = (fields) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
      {fields.map((item, i) => (
        <div key={i} style={fieldCardStyle}>
          <span style={fieldLabelStyle}>{item.label}</span>
          <span style={fieldValueStyle}>{item.value || "Not provided"}</span>
        </div>
      ))}
    </div>
  )

  // Helper to render dropdown-based question sections in summary
  const renderQuestionSummary = (title, questions, dataObj) => {
    if (!dataObj || Object.keys(dataObj).length === 0) return null
    return (
      <div style={{ marginTop: "20px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>{title}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
          {questions.map((q) => {
            const val = dataObj[q.field]
            if (!val) return null
            const optLabel = q.options?.find(o => o.value === val)?.label || formatLabel(val)
            return (
              <div key={q.field} style={{ padding: "10px 14px", background: "rgba(166,124,82,0.05)", borderRadius: "8px", border: "1px solid rgba(200,182,166,0.2)" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#7d5a50", display: "block", marginBottom: "4px", textTransform: "uppercase" }}>{q.dimension}</span>
                <span style={{ fontSize: "13px", color: "#4a352f", fontWeight: "500" }}>{optLabel}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Strategic Clarity questions for summary
  const strategicClarityQs = [
    { field: "strategicDirection", dimension: "Strategic Direction", options: [{ value: "documented_shared", label: "Documented & shared" }, { value: "informal", label: "Informal" }, { value: "none", label: "None" }] },
    { field: "planningDepth", dimension: "Planning Depth", options: [{ value: "3_4_selected", label: "3–4 selected" }, { value: "1_2_selected", label: "1–2 selected" }, { value: "none", label: "None" }] },
    { field: "marketStrategy", dimension: "Market Strategy", options: [{ value: "clearly_defined", label: "Clearly defined & validated" }, { value: "partially_defined", label: "Partially defined" }, { value: "unclear", label: "Unclear" }] },
    { field: "executionRoadmap", dimension: "Execution Roadmap", options: [{ value: "detailed_roadmap", label: "Detailed roadmap with milestones" }, { value: "high_level_plan", label: "High-level plan" }, { value: "no_roadmap", label: "No roadmap" }] },
    { field: "decisionMaking", dimension: "Decision-Making", options: [{ value: "structured_data_driven", label: "Structured & data-driven" }, { value: "semi_structured", label: "Semi-structured" }, { value: "informal_reactive", label: "Informal/reactive" }] },
    { field: "adaptability", dimension: "Adaptability", options: [{ value: "structured_review", label: "Structured review + adjustment" }, { value: "some_adjustment", label: "Some adjustment" }, { value: "reactive_none", label: "Reactive / none" }] },
  ]

  const riskManagementQs = [
    { field: "riskIdentification", dimension: "Risk Identification", options: [{ value: "documented_risk_register", label: "Documented risk register" }, { value: "informal_awareness", label: "Informal awareness" }, { value: "no_structured_identification", label: "No structured identification" }] },
    { field: "riskAssessment", dimension: "Risk Assessment", options: [{ value: "structured_assessment", label: "Structured assessment" }, { value: "basic_informal", label: "Basic / informal" }, { value: "no_formal_assessment", label: "No formal assessment" }] },
    { field: "riskMitigation", dimension: "Risk Mitigation", options: [{ value: "defined_mitigation_plans", label: "Defined mitigation plans" }, { value: "some_mitigation_actions", label: "Some mitigation actions" }, { value: "no_clear_approach", label: "No clear approach" }] },
    { field: "businessContinuity", dimension: "Business Continuity", options: [{ value: "formal_documented_plan", label: "Formal documented plan" }, { value: "partial_informal_plan", label: "Partial / informal plan" }, { value: "none", label: "None" }] },
    { field: "crisisPreparedness", dimension: "Crisis Preparedness", options: [{ value: "clear_response_protocols", label: "Clear response protocols" }, { value: "some_readiness", label: "Some readiness" }, { value: "reactive_unprepared", label: "Reactive / unprepared" }] },
    { field: "riskOwnership", dimension: "Risk Ownership", options: [{ value: "clear_ownership", label: "Clear ownership & accountability" }, { value: "shared_unclear", label: "Shared but unclear" }, { value: "no_ownership_defined", label: "No ownership defined" }] },
  ]

  const transparencyQs = [
    { field: "reportingFrequency", dimension: "Reporting Frequency", options: [{ value: "monthly", label: "Monthly" }, { value: "quarterly", label: "Quarterly" }, { value: "ad_hoc_none", label: "Ad hoc / none" }] },
    { field: "performanceReviewCycle", dimension: "Performance Review Cycle", options: [{ value: "monthly", label: "Monthly" }, { value: "quarterly_biannual", label: "Quarterly / Bi-annual" }, { value: "ad_hoc_none", label: "Ad hoc / none" }] },
    { field: "kpiMonitoring", dimension: "KPI Monitoring", options: [{ value: "defined_kpis_tracked", label: "Defined KPIs + tracked" }, { value: "some_kpis_tracked", label: "Some KPIs tracked" }, { value: "no_structured_tracking", label: "No structured tracking" }] },
    { field: "stakeholderCommunication", dimension: "Stakeholder Communication", options: [{ value: "structured_reports", label: "Structured" }, { value: "informal_updates", label: "Informal" }, { value: "minimal", label: "Minimal" }] },
    { field: "complianceAndRisk", dimension: "Compliance & Risk", options: [{ value: "formal_risk_register_audits", label: "Formal" }, { value: "partial_some_controls", label: "Partial" }, { value: "none", label: "None" }] },
    { field: "dataGovernance", dimension: "Data Governance", options: [{ value: "formal_popia_aligned", label: "Formal (POPIA aligned)" }, { value: "basic_controls", label: "Basic controls" }, { value: "no_formal_approach", label: "No formal approach" }] },
    { field: "auditAndAssurance", dimension: "Audit & Assurance", options: [{ value: "regular_internal_external", label: "Regular internal + external" }, { value: "occasional_audits", label: "Occasional" }, { value: "none", label: "None" }] },
  ]

  // ── Contact Details Section ──────────────────────────────────────────────
  const renderContactDetails = () => {
    const contact = data?.contactDetails || {}
    return (
      <div style={sectionCardStyle}>
        {renderSectionHeader("contactDetails", Mail, "Contact Details")}
        {expandedSections.contactDetails && (
          <div style={sectionContentStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>Primary Contact</span>
                <div style={{ fontSize: "15px", fontWeight: "600", color: "#4a352f" }}>{contact.contactTitle || ""} {contact.contactName || "Not provided"}</div>
                <div style={{ fontSize: "13px", color: "#7d5a50", marginTop: "4px" }}>{contact.position || "Position not specified"}</div>
              </div>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>Contact ID / Passport</span>
                <span style={fieldValueStyle}>{contact.contactId || "Not provided"}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}><Phone size={12} style={{ display: "inline", marginRight: "4px" }} /> Business Phone</span>
                <span style={fieldValueStyle}>{contact.businessPhone || "Not provided"}</span>
              </div>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}><Phone size={12} style={{ display: "inline", marginRight: "4px" }} /> Mobile</span>
                <span style={fieldValueStyle}>{contact.mobile || "Not provided"}</span>
              </div>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}><Mail size={12} style={{ display: "inline", marginRight: "4px" }} /> Email</span>
                <span style={fieldValueStyle}>{contact.email || "Not provided"}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}><MapPin size={12} style={{ display: "inline", marginRight: "4px" }} /> Physical Address</span>
                <span style={fieldValueStyle}>{contact.physicalAddress || "Not provided"}</span>
              </div>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}><MapPin size={12} style={{ display: "inline", marginRight: "4px" }} /> Postal Address</span>
                <span style={fieldValueStyle}>{contact.sameAsPhysical ? "Same as physical address" : (contact.postalAddress || "Not provided")}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Legal & Compliance Section ───────────────────────────────────────────
  const renderLegalCompliance = () => {
    const legal = data?.legalCompliance || {}
    return (
      <div style={sectionCardStyle}>
        {renderSectionHeader("legalCompliance", Shield, "Legal & Compliance")}
        {expandedSections.legalCompliance && (
          <div style={sectionContentStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>Tax Number</span>
                <span style={fieldValueStyle}>{legal.taxNumber || "Not provided"}</span>
              </div>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>Tax Clearance PIN</span>
                <span style={fieldValueStyle}>{legal.taxClearancePin || "Not provided"}</span>
              </div>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>PAYE Number</span>
                <span style={fieldValueStyle}>{legal.payeNumber || "Not provided"}</span>
              </div>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>VAT Number</span>
                <span style={fieldValueStyle}>{legal.vatNumber || "Not provided"}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>UIF Status</span>
                <span style={fieldValueStyle}>{formatLabel(legal.uifStatus) || "Not provided"}</span>
              </div>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>UIF Number</span>
                <span style={fieldValueStyle}>{legal.uifNumber || "Not provided"}</span>
              </div>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>COIDA Number</span>
                <span style={fieldValueStyle}>{legal.coidaNumber || "Not provided"}</span>
              </div>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>B-BBEE Level</span>
                <span style={fieldValueStyle}>{legal.bbbeeLevel || "Not provided"}</span>
              </div>
            </div>

            {legal.industryAccreditations?.length > 0 && (
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}><Award size={12} /> Industry Accreditations</span>
                <span style={fieldValueStyle}>{legal.industryAccreditations.map(a => formatLabel(a)).join(" • ")}</span>
              </div>
            )}

            <div style={fieldCardStyle}>
              <span style={fieldLabelStyle}><AlertTriangle size={12} /> Pending Legal Judgments</span>
              <span style={fieldValueStyle}>{formatLabel(legal.pendingLegalJudgments)}</span>
              {legal.pendingLegalJudgments === "yes" && legal.pendingLegalJudgmentsDetails && (
                <div style={{ marginTop: "8px", padding: "8px", background: "rgba(166,124,82,0.05)", borderRadius: "6px", fontSize: "13px" }}>
                  {legal.pendingLegalJudgmentsDetails}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Products & Services Section (Full Version) ──────────────────────────
  const renderProductsServices = () => {
    const ps = data?.productsServices || {}
    
    const getOfferingTypeLabel = () => {
      const type = ps.offeringType
      if (type === "products") return "Products only"
      if (type === "services") return "Services only"
      if (type === "both") return "Both products and services"
      return "Not specified"
    }

    const renderProductCategories = () => {
      const categories = ps.productCategories || []
      if (categories.length === 0) return null
      return (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>
            <Layers size={16} style={{ display: "inline", marginRight: "8px" }} /> Product Categories
          </h3>
          {categories.map((category, idx) => (
            <div key={idx} style={{ ...fieldCardStyle, marginBottom: "16px" }}>
              <div style={{ marginBottom: "12px" }}>
                <span style={fieldLabelStyle}>Category Name(s)</span>
                <span style={fieldValueStyle}>
                  {category.categories?.length > 0 
                    ? category.categories.map(c => formatLabel(c)).join(" • ")
                    : "Not specified"}
                </span>
              </div>
              {category.products?.length > 0 && (
                <div>
                  <span style={fieldLabelStyle}>Products</span>
                  {category.products.map((product, pIdx) => (
                    <div key={pIdx} style={{ marginTop: "12px", padding: "12px", background: "rgba(166,124,82,0.05)", borderRadius: "8px" }}>
                      <div style={{ fontWeight: "600", color: "#4a352f", marginBottom: "6px" }}>{product.name || "Unnamed product"}</div>
                      <div style={{ fontSize: "13px", color: "#7d5a50" }}>{product.description || "No description provided"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )
    }

    const renderServiceCategories = () => {
      const categories = ps.serviceCategories || []
      if (categories.length === 0) return null
      return (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>
            <Briefcase size={16} style={{ display: "inline", marginRight: "8px" }} /> Service Categories
          </h3>
          {categories.map((category, idx) => (
            <div key={idx} style={{ ...fieldCardStyle, marginBottom: "16px" }}>
              <div style={{ marginBottom: "12px" }}>
                <span style={fieldLabelStyle}>Category Name(s)</span>
                <span style={fieldValueStyle}>
                  {category.categories?.length > 0 
                    ? category.categories.map(c => formatLabel(c)).join(" • ")
                    : "Not specified"}
                </span>
              </div>
              {category.services?.length > 0 && (
                <div>
                  <span style={fieldLabelStyle}>Services</span>
                  {category.services.map((service, sIdx) => (
                    <div key={sIdx} style={{ marginTop: "12px", padding: "12px", background: "rgba(166,124,82,0.05)", borderRadius: "8px" }}>
                      <div style={{ fontWeight: "600", color: "#4a352f", marginBottom: "6px" }}>{service.name || "Unnamed service"}</div>
                      <div style={{ fontSize: "13px", color: "#7d5a50" }}>{service.description || "No description provided"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )
    }

    const renderDeliveryStandards = () => {
      const deliveryModes = ps.deliveryModes || []
      const minLeadTime = ps.minLeadTime
      const maxLeadTime = ps.maxLeadTime
      const minUnit = ps.minLeadTimeUnit || "days"
      const maxUnit = ps.maxLeadTimeUnit || "days"
      
      if (deliveryModes.length === 0 && !minLeadTime && !maxLeadTime) return null
      
      return (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>
            <Truck size={16} style={{ display: "inline", marginRight: "8px" }} /> Delivery Standards
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {deliveryModes.length > 0 && (
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>Delivery Modes</span>
                <span style={fieldValueStyle}>{deliveryModes.map(m => formatLabel(m)).join(" • ")}</span>
              </div>
            )}
            {(minLeadTime || maxLeadTime) && (
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>Lead Time</span>
                <span style={fieldValueStyle}>
                  {minLeadTime && maxLeadTime
                    ? `${minLeadTime} ${minUnit} - ${maxLeadTime} ${maxUnit}`
                    : minLeadTime
                      ? `Minimum ${minLeadTime} ${minUnit}`
                      : `Maximum ${maxLeadTime} ${maxUnit}`}
                </span>
              </div>
            )}
          </div>
        </div>
      )
    }

    const renderTargetMarket = () => {
      if (!ps.targetMarket) return null
      return (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>
            <Target size={16} style={{ display: "inline", marginRight: "8px" }} /> Target Market
          </h3>
          <div style={fieldCardStyle}>
            <span style={fieldValueStyle}>{ps.targetMarket}</span>
          </div>
        </div>
      )
    }

    const renderKeyClients = () => {
      const clients = ps.keyClients || []
      if (clients.length === 0) return null
      
      const totalRevenuePercent = clients.reduce((sum, c) => {
        const val = parseFloat(c.revenuePercentage) || 0
        return sum + val
      }, 0)
      
      return (
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>Key Clients / Customers</h3>
          {totalRevenuePercent > 0 && (
            <div style={{ 
              ...fieldCardStyle, 
              marginBottom: "16px",
              background: totalRevenuePercent > 100 ? "rgba(207, 19, 34, 0.05)" : "rgba(56, 158, 13, 0.05)",
              border: `1px solid ${totalRevenuePercent > 100 ? "#ffccc7" : "#b7eb8f"}`
            }}>
              <span style={fieldLabelStyle}>Revenue Allocation</span>
              <span style={{ 
                fontSize: "14px", 
                fontWeight: "600",
                color: totalRevenuePercent > 100 ? "#cf1322" : "#389e0d"
              }}>
                {totalRevenuePercent > 100 
                  ? `⚠️ Total exceeds 100% (${totalRevenuePercent}%)`
                  : totalRevenuePercent === 100 
                    ? `✅ Full revenue allocated (${totalRevenuePercent}%)`
                    : `Revenue allocated: ${totalRevenuePercent}% of 100%`}
              </span>
            </div>
          )}
          
          {clients.map((client, idx) => (
            <div key={idx} style={{ ...fieldCardStyle, marginBottom: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                <div>
                  <span style={fieldLabelStyle}>Client Name</span>
                  <span style={fieldValueStyle}>{client.name || "Not provided"}</span>
                </div>
                <div>
                  <span style={fieldLabelStyle}>% of Revenue</span>
                  <span style={fieldValueStyle}>{client.revenuePercentage ? `${client.revenuePercentage}%` : "Not provided"}</span>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={fieldLabelStyle}>Industries</span>
                  <span style={fieldValueStyle}>
                    {client.industries?.length > 0 
                      ? client.industries.map(i => formatLabel(i)).join(" • ")
                      : "Not specified"}
                  </span>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={fieldLabelStyle}>Revenue Growth Potential</span>
                  <span style={fieldValueStyle}>{client.revenueGrowthPotential || "Not specified"}</span>
                </div>
                {client.revenueGrowthPotential === "Yes" && client.revenueGrowthDetails && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={fieldLabelStyle}>Growth Opportunity Details</span>
                    <span style={fieldValueStyle}>{client.revenueGrowthDetails}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div style={sectionCardStyle}>
        {renderSectionHeader("productsServices", Package, "Products & Services")}
        {expandedSections.productsServices && (
          <div style={sectionContentStyle}>
            <div style={fieldCardStyle}>
              <span style={fieldLabelStyle}>Offering Type</span>
              <span style={fieldValueStyle}>{getOfferingTypeLabel()}</span>
            </div>
            
            {renderProductCategories()}
            {renderServiceCategories()}
            {renderDeliveryStandards()}
            {renderTargetMarket()}
            {renderKeyClients()}
          </div>
        )}
      </div>
    )
  }

  // ── How Did You Hear Section ─────────────────────────────────────────────
  const renderHowDidYouHear = () => {
    const how = data?.howDidYouHear || {}
    return (
      <div style={sectionCardStyle}>
        {renderSectionHeader("howDidYouHear", MessageCircle, "How Did You Hear About Us?")}
        {expandedSections.howDidYouHear && (
          <div style={sectionContentStyle}>
            <div style={fieldCardStyle}>
              <span style={fieldLabelStyle}>Referral Source</span>
              <span style={fieldValueStyle}>{formatLabel(how.referralSource) || "Not provided"}</span>
            </div>
            {how.referralSource === "other" && how.otherSource && (
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>Other Source Details</span>
                <span style={fieldValueStyle}>{how.otherSource}</span>
              </div>
            )}
            {how.referredByName && (
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>Referred By</span>
                <span style={fieldValueStyle}>{how.referredByName}</span>
              </div>
            )}
            {how.referredByContact && (
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>Referrer Contact</span>
                <span style={fieldValueStyle}>{how.referredByContact}</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-16px); max-height: 0; } to { opacity: 1; transform: translateY(0); max-height: 2000px; } }
        @media (max-width: 1024px) { .main-container { padding-left: 16px !important; padding-top: 16px !important; } }
        @media (max-width: 768px) { .main-container { padding-left: 12px !important; padding-top: 12px !important; } }
      `}</style>
      <div className="main-container" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: "100vh", width: "100%", padding: "16px", boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: "none" }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 20px 40px rgba(74, 53, 47, 0.1)", border: "1px solid rgba(200, 182, 166, 0.3)", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 2, gap: "16px", flexWrap: "wrap" }}>
              <div style={{ flex: "1", minWidth: "250px" }}>
                <h1 style={{ background: "linear-gradient(135deg, #4a352f, #7d5a50)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: "800", margin: "0 0 8px 0" }}>Universal Profile</h1>
                <p style={{ color: "#7d5a50", fontSize: "clamp(14px, 2vw, 18px)", margin: 0, fontWeight: "500" }}>Complete Business Overview</p>
              </div>
              <button onClick={handleEdit} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: "linear-gradient(135deg, #a67c52, #7d5a50)", color: "#faf7f2", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 16px rgba(166, 124, 82, 0.3)", minWidth: "140px", justifyContent: "center" }}>
                <Edit size={16} /> Edit Profile
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: "16px" }}>

            {/* ── Entity Overview ────────────────────────────────────── */}
            <div style={sectionCardStyle}>
              {renderSectionHeader("entityOverview", Building, "Entity Overview")}
              {expandedSections.entityOverview && (
                <div style={sectionContentStyle}>
                  {renderFieldGrid([
                    { label: "Registered Name", value: data?.entityOverview?.registeredName },
                    { label: "Trading Name", value: data?.entityOverview?.tradingName || "Same as registered name" },
                    { label: "Registration Number", value: data?.entityOverview?.registrationNumber },
                    { label: "Entity Type", value: data?.entityOverview?.entityType },
                    { label: "Legal Structure", value: data?.entityOverview?.legalStructure },
                    { label: "Entity Size", value: data?.entityOverview?.entitySize },
                    { label: "Financial Year End", value: data?.entityOverview?.financialYearEnd },
                    { label: "No. of Employees", value: data?.entityOverview?.employeeCount || data?.entityOverview?.fullTimeEmployees },
                    { label: "Years in Operation", value: data?.entityOverview?.yearsInOperation },
                    { label: "Operation Stage", value: data?.entityOverview?.operationStage },
                    { label: "Country", value: data?.entityOverview?.location || "Not provided" },
                    { label: "City", value: data?.entityOverview?.city || "Not provided" },
                  ])}
                  <div style={{ background: "rgba(166, 124, 82, 0.1)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(166, 124, 82, 0.2)", marginTop: "16px" }}>
                    <span style={{ ...fieldLabelStyle, fontWeight: "700" }}>Business Description</span>
                    <p style={{ fontSize: "14px", color: "#4a352f", lineHeight: "1.6", margin: 0 }}>{data?.entityOverview?.businessDescription || "Not provided"}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* ── Products & Services ─────────────────────────────────── */}
            {renderProductsServices()}

            {/* ── Ownership & Management ─────────────────────────────── */}
            <div style={sectionCardStyle}>
              {renderSectionHeader("ownershipManagement", Users, "Ownership & Management")}
              {expandedSections.ownershipManagement && (
                <div style={sectionContentStyle}>
                  {/* Total Shares */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                    <div style={{ background: "rgba(166, 124, 82, 0.1)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(166, 124, 82, 0.2)" }}>
                      <span style={{ ...fieldLabelStyle, fontWeight: "700" }}>Total Authorised Shares</span>
                      <p style={{ fontSize: "18px", color: "#4a352f", margin: 0, fontWeight: "600" }}>
                        {data?.ownershipManagement?.totalAuthorisedShares || data?.ownershipManagement?.totalShares || "Not provided"}
                      </p>
                    </div>
                    <div style={{ background: "rgba(166, 124, 82, 0.1)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(166, 124, 82, 0.2)" }}>
                      <span style={{ ...fieldLabelStyle, fontWeight: "700" }}>Total Issued Shares</span>
                      <p style={{ fontSize: "18px", color: "#4a352f", margin: 0, fontWeight: "600" }}>
                        {data?.ownershipManagement?.totalIssuedShares || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Shareholders */}
                  {data?.ownershipManagement?.shareholders?.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>Shareholders</h3>
                      <div style={{ ...fieldCardStyle, overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                              {["Name", "Country", "LinkedIn", "% Shareholding", "Issued Shares", "Race", "Gender", "Youth", "Disabled", "Also Director"].map((h, i) => (
                                <th key={i} style={{ padding: "10px 6px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#7d5a50", textTransform: "uppercase" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.ownershipManagement.shareholders.map((sh, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid #e6d7c3" }}>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontWeight: "500", fontSize: "13px" }}>{sh.name || "Not provided"}</td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>{sh.country || "Not provided"}</td>
                                <td style={{ padding: "10px 6px" }}>{sh.linkedin ? renderLinkedInLink(sh.linkedin) : "Not provided"}</td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontWeight: "600", fontSize: "13px" }}>{sh.shareholding || "0"}%</td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>{sh.issuedShares || "0"}</td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>{sh.race || "Not provided"}</td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>{sh.gender || "Not provided"}</td>
                                <td style={{ padding: "10px 6px", fontSize: "13px" }}>{formatBoolean(sh.isYouth)}</td>
                                <td style={{ padding: "10px 6px", fontSize: "13px" }}>{formatBoolean(sh.isDisabled)}</td>
                                <td style={{ padding: "10px 6px", fontSize: "13px" }}>{formatBoolean(sh.isAlsoDirector)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Directors */}
                  {data?.ownershipManagement?.directors?.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>Directors</h3>
                      <div style={{ ...fieldCardStyle, overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                              {["Name", "Position", "Nationality", "LinkedIn", "CV", "Committee Membership", "Exec/Non-Exec", "Race", "Gender", "Youth", "Disabled"].map((h, i) => (
                                <th key={i} style={{ padding: "10px 6px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#7d5a50", textTransform: "uppercase" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.ownershipManagement.directors.map((d, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid #e6d7c3" }}>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontWeight: "500", fontSize: "13px" }}>{d.name || "Not provided"}</td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>{d.position === "Other" && d.customPosition ? d.customPosition : d.position || "Not provided"}</td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>{d.nationality || "Not provided"}</td>
                                <td style={{ padding: "10px 6px" }}>{d.linkedin ? renderLinkedInLink(d.linkedin) : "Not provided"}</td>
                                <td style={{ padding: "10px 6px" }}>{d.cv?.url ? renderDocumentLink(d.cv.url, "View CV") : "No CV"}</td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "12px" }}>
                                  {d.committeeMembership?.length > 0
                                    ? d.committeeMembership.map(c => c === "Other" ? (d.customCommittee || "Other") : c).join(", ")
                                    : "None"}
                                </td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>{d.execType || "Not provided"}</td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>{d.race || "Not provided"}</td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>{d.gender || "Not provided"}</td>
                                <td style={{ padding: "10px 6px", fontSize: "13px" }}>{formatBoolean(d.isYouth)}</td>
                                <td style={{ padding: "10px 6px", fontSize: "13px" }}>{formatBoolean(d.isDisabled)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Executives */}
                  {data?.ownershipManagement?.executives?.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>Executive Management</h3>
                      <div style={{ ...fieldCardStyle, overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                              {["Name", "Position", "Department", "Nationality", "LinkedIn", "Race", "Gender", "Youth", "Disabled"].map((h, i) => (
                                <th key={i} style={{ padding: "10px 6px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#7d5a50", textTransform: "uppercase" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.ownershipManagement.executives.map((ex, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid #e6d7c3" }}>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontWeight: "500", fontSize: "13px" }}>{ex.name || "Not provided"}</td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>{ex.position === "Other" && ex.customPosition ? ex.customPosition : ex.position || "Not provided"}</td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>{ex.department || "Not provided"}</td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>{ex.nationality || "Not provided"}</td>
                                <td style={{ padding: "10px 6px" }}>{ex.linkedin ? renderLinkedInLink(ex.linkedin) : "Not provided"}</td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>{ex.race || "Not provided"}</td>
                                <td style={{ padding: "10px 6px", color: "#4a352f", fontSize: "13px" }}>{ex.gender || "Not provided"}</td>
                                <td style={{ padding: "10px 6px", fontSize: "13px" }}>{formatBoolean(ex.isYouth)}</td>
                                <td style={{ padding: "10px 6px", fontSize: "13px" }}>{formatBoolean(ex.isDisabled)}</td>
                               </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Business Leadership */}
                  {data?.ownershipManagement?.businessLeadership && (
                    <div>
                      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>Business Leadership – Profile Assessment</h3>
                      <div style={{ ...fieldCardStyle }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
                          {Object.entries(data.ownershipManagement.businessLeadership).map(([key, value]) => {
                            if (!value) return null
                            const labels = { ownerLed: "Owner-Led", primaryMotivation: "Primary Motivation", growthAmbition: "Growth Ambition", founderFullTime: "Founder Full-Time", opennessToAdvice: "Openness to Advice", decisionGovernance: "Decision Governance" }
                            return (
                              <div key={key} style={{ padding: "8px 12px", background: "rgba(166,124,82,0.05)", borderRadius: "8px" }}>
                                <span style={{ fontSize: "11px", fontWeight: "600", color: "#7d5a50", display: "block", marginBottom: "2px", textTransform: "uppercase" }}>{labels[key] || key}</span>
                                <span style={{ fontSize: "13px", color: "#4a352f", fontWeight: "500" }}>{formatLabel(value)}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Contact Details ────────────────────────────────────── */}
            {renderContactDetails()}

            {/* ── Legal & Compliance ─────────────────────────────────── */}
            {renderLegalCompliance()}

            {/* ── Financial Overview ─────────────────────────────────── */}
            <div style={sectionCardStyle}>
              {renderSectionHeader("financialOverview", DollarSign, "Financial Overview")}
              {expandedSections.financialOverview && (
                <div style={sectionContentStyle}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>A. Financial Performance</h3>
                  {renderFieldGrid([
                    { label: "Generates Revenue", value: formatLabel(data?.financialOverview?.generatesRevenue) },
                    { label: "Annual Revenue", value: data?.financialOverview?.annualRevenue || "Not provided" },
                    { label: "Profitability Status", value: formatLabel(data?.financialOverview?.profitabilityStatus) },
                    { label: "Revenue Trend", value: formatLabel(data?.financialOverview?.revenueTrend) },
                    { label: "Current Valuation", value: data?.financialOverview?.currentValuation || "Not provided" },
                  ])}

                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px", marginTop: "20px" }}>B. Financial Management & Systems</h3>
                  {renderFieldGrid([
                    { label: "Accounting Software", value: formatLabel(data?.financialOverview?.hasAccountingSoftware) },
                    { label: "Software Name", value: data?.financialOverview?.accountingSoftwareName || "N/A" },
                    { label: "Books Up to Date", value: formatLabel(data?.financialOverview?.booksUpToDate) },
                    { label: "Management Accounts", value: formatLabel(data?.financialOverview?.hasManagementAccounts) },
                  ])}

                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px", marginTop: "20px" }}>C. Financial Credibility</h3>
                  {renderFieldGrid([
                    { label: "Financial Statements", value: formatLabel(data?.financialOverview?.hasFinancialStatements) },
                    { label: "Financials Audited", value: formatLabel(data?.financialOverview?.financialsAudited) },
                    { label: "Existing Debt Status", value: formatLabel(data?.financialOverview?.existingDebtStatus) },
                    { label: "Existing Debt Amount", value: data?.financialOverview?.existingDebt || "N/A" },
                  ])}

                  {(data?.financialOverview?.financialChallenges?.length > 0 || data?.financialOverview?.financialChallengesElaboration) && (
                    <>
                      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px", marginTop: "20px" }}>D. Financial Challenges</h3>
                      {data?.financialOverview?.financialChallenges?.length > 0 && (
                        <div style={{ ...fieldCardStyle, marginBottom: "12px" }}>
                          <span style={fieldLabelStyle}>Challenges</span>
                          <span style={fieldValueStyle}>{data.financialOverview.financialChallenges.map(c => formatLabel(c)).join(" • ")}</span>
                        </div>
                      )}
                      {data?.financialOverview?.financialChallengesElaboration && (
                        <div style={{ background: "rgba(166,124,82,0.1)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(166,124,82,0.2)" }}>
                          <span style={{ ...fieldLabelStyle, fontWeight: "700" }}>Elaboration</span>
                          <p style={{ fontSize: "14px", color: "#4a352f", lineHeight: "1.6", margin: 0 }}>{data.financialOverview.financialChallengesElaboration}</p>
                        </div>
                      )}
                    </>
                  )}

                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px", marginTop: "20px" }}>E. Support Intent</h3>
                  {renderFieldGrid([
                    { label: "Seeking Funding", value: formatLabel(data?.financialOverview?.seekingFunding) },
                    { label: "Support Type Needed", value: data?.financialOverview?.supportTypeNeeded?.length > 0 ? data.financialOverview.supportTypeNeeded.map(s => formatLabel(s)).join(" • ") : "None" },
                  ])}
                </div>
              )}
            </div>

            {/* ── Operations Overview ─────────────────────────────────── */}
            <div style={sectionCardStyle}>
              {renderSectionHeader("operationsOverview", FileCheck, "Operations Overview")}
              {expandedSections.operationsOverview && (
                <div style={sectionContentStyle}>
                  <p style={{ fontSize: "14px", color: "#7d5a50", marginBottom: "20px", fontWeight: "500", fontStyle: "italic" }}>BIG Score – Operational Strength (Risk-Based Yes/No Model)</p>
                  {renderFieldGrid([
                    { label: "Q1. Multiple Key Suppliers", value: data?.operationsOverview?.multipleSuppliers === "yes" ? "✅ Yes" : data?.operationsOverview?.multipleSuppliers === "no" ? "❌ No" : "Not answered" },
                    { label: "Q2. Documented Contingency Plan", value: data?.operationsOverview?.contingencyPlan === "yes" ? "✅ Yes" : data?.operationsOverview?.contingencyPlan === "no" ? "❌ No" : "Not answered" },
                    { label: "Q3. Track Performance Metrics", value: data?.operationsOverview?.trackPerformanceMetrics === "yes" ? "✅ Yes" : data?.operationsOverview?.trackPerformanceMetrics === "no" ? "❌ No" : "Not answered" },
                    { label: "Q4. 3+ Successful Deliveries", value: data?.operationsOverview?.threeSuccessfulDeliveries === "yes" ? "✅ Yes" : data?.operationsOverview?.threeSuccessfulDeliveries === "no" ? "❌ No" : "Not answered" },
                    { label: "Q5. Capacity to Increase Output", value: data?.operationsOverview?.hasCapacityToIncrease === "yes" ? "✅ Yes" : data?.operationsOverview?.hasCapacityToIncrease === "no" ? "❌ No" : "Not answered" },
                    { label: "Q6. Formal Safety/Compliance", value: data?.operationsOverview?.hasFormalProcedures === "yes" ? "✅ Yes" : data?.operationsOverview?.hasFormalProcedures === "no" ? "❌ No" : "Not answered" },
                    { label: "Q7. Major Incidents (24 months)", value: data?.operationsOverview?.hasMajorIncidents === "yes" ? "✅ Yes" : data?.operationsOverview?.hasMajorIncidents === "no" ? "❌ No" : "Not answered" },
                  ])}
                </div>
              )}
            </div>

            {/* ── Governance ─────────────────────────────────────────── */}
            <div style={sectionCardStyle}>
              {renderSectionHeader("governance", FileCheck, "Governance")}
              {expandedSections.governance && (
                <div style={sectionContentStyle}>
                  {/* Policies checklist progress */}
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>Policies & Controls Progress</h3>
                  {data?.governance?.governanceChecklist && Object.keys(data.governance.governanceChecklist).length > 0 ? (
                    <>
                      <div style={{ background: "rgba(166, 124, 82, 0.1)", borderRadius: "12px", padding: "20px", border: "1px solid rgba(166, 124, 82, 0.2)", marginBottom: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <span style={{ fontSize: "16px", fontWeight: "600", color: "#4a352f" }}>Completion Progress</span>
                          <span style={{ fontSize: "16px", fontWeight: "600", color: "#7d5a50" }}>{Object.values(data.governance.governanceChecklist).filter(Boolean).length} completed</span>
                        </div>
                        <div style={{ width: "100%", background: "rgba(200, 182, 166, 0.3)", borderRadius: "8px", height: "12px", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "linear-gradient(135deg, #a67c52, #7d5a50)", width: `${(Object.values(data.governance.governanceChecklist).filter(Boolean).length / Object.keys(data.governance.governanceChecklist).length) * 100}%`, borderRadius: "8px" }} />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px", marginBottom: "24px" }}>
                        {Object.entries(data.governance.governanceChecklist).filter(([, v]) => v === true).map(([key], i) => (
                          <div key={i} style={{ background: "rgba(166,124,82,0.1)", borderRadius: "8px", padding: "12px", border: "1px solid rgba(166,124,82,0.2)", display: "flex", alignItems: "center", gap: "8px" }}>
                            <CheckSquare size={16} color="#a67c52" />
                            <span style={{ fontSize: "13px", color: "#4a352f", fontWeight: "500" }}>{key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ background: "rgba(200,182,166,0.1)", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,182,166,0.2)", textAlign: "center", color: "#7d5a50", marginBottom: "24px" }}>
                      <p style={{ margin: 0, fontSize: "14px" }}>No policies & controls checklist completed yet.</p>
                    </div>
                  )}

                  {/* Conflict Resolution */}
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>Conflict Resolution</h3>
                  {renderFieldGrid([
                    { label: "Conflict Resolution Procedures", value: data?.governance?.hasConflictResolution || "Not specified" },
                    { label: "Ethics Training Frequency", value: data?.governance?.ethicsTrainingFrequency || "Not specified" },
                    { label: "Last Ethics Training", value: data?.governance?.lastEthicsTrainingDate || "Not specified" },
                  ])}

                  {/* Strategic Clarity & Planning */}
                  {renderQuestionSummary("Strategic Clarity & Planning", strategicClarityQs, data?.governance?.strategicClarity)}

                  {/* Risk Management */}
                  {renderQuestionSummary("Risk Management", riskManagementQs, data?.governance?.riskManagement)}

                  {/* Transparency & Reporting */}
                  {renderQuestionSummary("Transparency & Reporting", transparencyQs, data?.governance?.transparencyReporting)}
                </div>
              )}
            </div>

         
            {/* ── How Did You Hear ────────────────────────────────────── */}
            {renderHowDidYouHear()}

            {/* ── Declaration & Consent ──────────────────────────────── */}
            <div style={sectionCardStyle}>
              {renderSectionHeader("declarationConsent", CheckSquare, "Declaration & Consent")}
              {expandedSections.declarationConsent && (
                <div style={sectionContentStyle}>
                  {renderFieldGrid([
                    { label: "Declaration of Accuracy", value: data?.declarationConsent?.accuracy ? "✅ Yes" : "❌ No" },
                    { label: "Consent for Data Processing", value: data?.declarationConsent?.dataProcessing ? "✅ Yes" : "❌ No" },
                    { label: "Opt-in for Promotional Visibility", value: data?.declarationConsent?.termsConditions ? "✅ Yes" : "❌ No" },
                  ])}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: "24px", textAlign: "center", background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))", borderRadius: "16px", padding: "20px", border: "1px solid rgba(200, 182, 166, 0.3)" }}>
            <button
              onClick={() => (window.location.href = "/applications/funding")}
              style={{ padding: "14px 28px", background: "linear-gradient(135deg, #a67c52, #7d5a50)", color: "#faf7f2", border: "none", borderRadius: "12px", fontSize: "clamp(14px, 2vw, 16px)", fontWeight: "600", cursor: "pointer", boxShadow: "0 8px 24px rgba(166, 124, 82, 0.3)", minWidth: "180px", width: "100%", maxWidth: "250px" }}
            >
              🚀 Go to Funding Application
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSummary