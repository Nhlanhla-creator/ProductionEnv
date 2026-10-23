"use client"
import { useState } from "react"
import {
  ChevronDown, ChevronUp, Edit, FileText, ExternalLink, Building, Users, Mail,
  Shield, Package, CheckSquare, Linkedin, DollarSign, FileCheck, Target,
  AlertTriangle, Phone, MapPin, Layers, Briefcase, Star, Image as ImageIcon,
} from "lucide-react"
import { checkIsNGO } from "./ngoTaxonomy"

const ProfileSummary = ({ data, onEdit }) => {
  const isNGO = checkIsNGO(data)

  const [expandedSections, setExpandedSections] = useState({
    entityOverview: false, brandAssets: false, productsServices: false,
    ownershipManagement: false, contactDetails: false, legalCompliance: false,
    operationsOverview: false, financialOverview: false, governance: false,
    declarationConsent: false,
  })

  const toggleSection = (section) => setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))

  const formatLabel = (value) => {
    if (!value) return "Not provided"
    if (typeof value === "boolean") return value ? "Yes" : "No"
    if (typeof value === "object") return "Not provided"
    try { return String(value).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) } catch { return "Not provided" }
  }

  const formatDate = (value) => {
    if (!value) return "Not provided"
    if (typeof value === "object") return "Not provided"
    try { const d = new Date(value); if (isNaN(d.getTime())) return value; return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }) } catch { return "Not provided" }
  }

  const renderDocumentLink = (url, label = "View Document") => {
    if (!url) return "No document uploaded"
    if (typeof url !== "string") return "Invalid document"
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "linear-gradient(135deg, #a67c52, #7d5a50)", color: "#faf7f2", borderRadius: "8px", fontSize: "13px", fontWeight: "500", cursor: "pointer", maxWidth: "fit-content" }} onClick={() => window.open(url, "_blank", "noopener,noreferrer")}>
        <FileText size={14} /><span>{label}</span><ExternalLink size={12} />
      </div>
    )
  }

  const renderLinkedInLink = (url) => {
    if (!url || typeof url !== "string") return "Not provided"
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 9px", background: "linear-gradient(135deg, #0077b5, #005582)", color: "#ffffff", borderRadius: "6px", fontSize: "11px", fontWeight: "500", cursor: "pointer", maxWidth: "fit-content" }} onClick={() => window.open(url, "_blank", "noopener,noreferrer")}>
        <Linkedin size={12} /><span>LinkedIn</span><ExternalLink size={10} />
      </div>
    )
  }

  const formatBoolean = (value) => (value ? "✅ Yes" : "❌ No")
  const handleEdit = () => { if (onEdit) onEdit() }

  const sectionCardStyle = { background: "linear-gradient(135deg, rgba(250,247,242,0.9), rgba(245,240,225,0.9))", backdropFilter: "blur(20px)", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(200,182,166,0.3)", boxShadow: "0 16px 32px rgba(74,53,47,0.08)" }
  const sectionContentStyle = { padding: "18px", background: "linear-gradient(135deg, rgba(250,247,242,0.8), rgba(240,230,217,0.6))", animation: "slideDown 0.3s ease-out" }
  const fieldCardStyle = { background: "rgba(250,247,242,0.8)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(200,182,166,0.2)" }
  const fieldLabelStyle = { display: "block", fontSize: "11px", color: "#7d5a50", marginBottom: "4px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.4px" }
  const fieldValueStyle = { fontSize: "13px", color: "#4a352f", fontWeight: "500" }
  const grid3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }

  const renderSectionHeader = (sectionKey, icon, title) => {
    const Icon = icon
    return (
      <div onClick={() => toggleSection(sectionKey)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", cursor: "pointer", background: expandedSections[sectionKey] ? "linear-gradient(135deg, #a67c52, #7d5a50)" : "linear-gradient(135deg, #e6d7c3, #c8b6a6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Icon size={18} color={expandedSections[sectionKey] ? "#faf7f2" : "#4a352f"} />
          <h2 style={{ margin: 0, fontSize: "clamp(15px, 2vw, 18px)", fontWeight: "700", color: expandedSections[sectionKey] ? "#faf7f2" : "#4a352f" }}>{title}</h2>
        </div>
        {expandedSections[sectionKey] ? <ChevronUp size={18} color="#faf7f2" /> : <ChevronDown size={18} color="#4a352f" />}
      </div>
    )
  }

  // Brand Assets
  const renderBrandAssets = () => {
    const ba = data?.brandAssets || {}
    const legacy = data?.entityOverview || {}
    const brandsOwned = ba.brandsOwned || legacy.brandsOwned
    const brandsRepresented = ba.brandsRepresented || legacy.brandsRepresented
    const holdsFranchises = ba.holdsFranchises || legacy.holdsFranchises
    const holdsAgencies = ba.holdsAgencies || legacy.holdsAgencies
    const companyLogo = ba.companyLogo || legacy.companyLogo
    const companyLetterhead = ba.companyLetterhead || legacy.companyLetterhead
    const orgStructure = ba.orgStructure || legacy.orgStructure
    const hasAny = brandsOwned || brandsRepresented || holdsFranchises || holdsAgencies || companyLogo || companyLetterhead || orgStructure

    return (
      <div style={sectionCardStyle}>
        {renderSectionHeader("brandAssets", ImageIcon, isNGO ? "Organisation Brand Assets" : "Brand Assets")}
        {expandedSections.brandAssets && (
          <div style={sectionContentStyle}>
            {!hasAny ? (
              <div style={{ textAlign: "center", color: "#7d5a50", padding: "16px", fontSize: "13px" }}>No brand asset information provided.</div>
            ) : (
              <>
                <div style={grid3}>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>{isNGO ? "Programmes or Initiatives Owned" : "Brands Owned"}</span>
                    <span style={fieldValueStyle}>{brandsOwned || "Not provided"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>{isNGO ? "Affiliated Programmes or Campaigns" : "Brands Represented"}</span>
                    <span style={fieldValueStyle}>{brandsRepresented || "Not provided"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>{isNGO ? "Operates Under Franchise / Network" : "Holds Franchises"}</span>
                    <span style={fieldValueStyle}>{holdsFranchises === "yes" ? "✅ Yes" : holdsFranchises === "no" ? "❌ No" : "Not provided"}</span>
                  </div>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>{isNGO ? "Official Implementation Agency Status" : "Holds Agencies"}</span>
                    <span style={fieldValueStyle}>{holdsAgencies === "yes" ? "✅ Yes" : holdsAgencies === "no" ? "❌ No" : "Not provided"}</span>
                  </div>
                </div>
                <div style={{ ...grid3, marginTop: "12px" }}>
                  {companyLogo && (
                    <div style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>{isNGO ? "Organisation Logo" : "Company Logo"}</span>
                      <img src={companyLogo} alt="Logo" style={{ maxWidth: "120px", maxHeight: "120px", objectFit: "contain", borderRadius: "6px", border: "1px solid #e6d7c3", backgroundColor: "white", padding: "4px" }} />
                    </div>
                  )}
                  {companyLetterhead && (
                    <div style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>{isNGO ? "Official Letterhead" : "Company Letterhead"}</span>
                      {renderDocumentLink(companyLetterhead, isNGO ? "View Official Letterhead" : "View Letterhead")}
                    </div>
                  )}
                  {orgStructure && (
                    <div style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>{isNGO ? "Governance & Organogram" : "Organisational Structure"}</span>
                      {renderDocumentLink(orgStructure, "View Org Structure")}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  // Products & Services / Programmes & Services
  const renderProductsServices = () => {
    const ps = data?.productsServices || {}
    const getOfferingTypeLabel = () => {
      if (isNGO) {
        if (ps.offeringType === "programmes") return "Core Programmes only"
        if (ps.offeringType === "services") return "Direct Beneficiary Support Services only"
        if (ps.offeringType === "both") return "Both Programmes and Support Services"
      }
      if (ps.offeringType === "products") return "Products only"
      if (ps.offeringType === "services") return "Services only"
      if (ps.offeringType === "both") return "Both products and services"
      return "Not specified"
    }

    const renderOfferingCard = (offering, idx) => (
      <div key={offering.id || idx} style={{ ...fieldCardStyle, marginBottom: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "6px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#4a352f", display: "flex", alignItems: "center", gap: "6px" }}>
              {offering.isPrimary && <Star size={13} fill="#8B4513" color="#8B4513" />}
              {offering.name || "Untitled offering"}
            </div>
            {offering.breadcrumb && <div style={{ fontSize: "11px", color: "#7d5a50", marginTop: "2px" }}>{offering.breadcrumb}</div>}
            {!offering.breadcrumb && (offering.customCategoryRequest || offering.customCategory) && (
              <div style={{ fontSize: "11px", color: "#92400e", marginTop: "2px", fontStyle: "italic" }}>Custom category (pending review): "{offering.customCategoryRequest || offering.customCategory}"</div>
            )}
          </div>
        </div>
        {offering.description && <p style={{ fontSize: "12px", color: "#4a352f", margin: "4px 0 8px", lineHeight: 1.5 }}>{offering.description}</p>}
        <div style={grid3}>
          {offering.deliveryRole?.length > 0 && <div><div style={{ fontSize: "10px", fontWeight: "600", color: "#7d5a50", textTransform: "uppercase", marginBottom: "1px" }}>{isNGO ? "Delivery Model" : "Delivery Role"}</div><div style={{ color: "#4a352f", fontSize: "12px" }}>{offering.deliveryRole.join(" • ")}</div></div>}
          {offering.industries?.length > 0 && <div><div style={{ fontSize: "10px", fontWeight: "600", color: "#7d5a50", textTransform: "uppercase", marginBottom: "1px" }}>{isNGO ? "Thematic Sectors" : "Industries Served"}</div><div style={{ color: "#4a352f", fontSize: "12px" }}>{offering.industries.join(" • ")}</div></div>}
          {offering.geographicCoverage?.length > 0 && <div><div style={{ fontSize: "10px", fontWeight: "600", color: "#7d5a50", textTransform: "uppercase", marginBottom: "1px" }}>Coverage</div><div style={{ color: "#4a352f", fontSize: "12px" }}>{offering.geographicCoverage.join(" • ")}</div></div>}
          {offering.deliveryStandard && <div><div style={{ fontSize: "10px", fontWeight: "600", color: "#7d5a50", textTransform: "uppercase", marginBottom: "1px" }}>Delivery Standard</div><div style={{ color: "#4a352f", fontSize: "12px" }}>{offering.deliveryStandard}</div></div>}
        </div>
      </div>
    )

    const renderOfferings = () => {
      const offerings = Array.isArray(ps.offerings) ? ps.offerings : []
      if (offerings.length === 0) return null
      const products = offerings.filter((o) => o.offeringType === "Product")
      const services = offerings.filter((o) => o.offeringType === "Service")
      return (
        <>
          {products.length > 0 && <div style={{ marginBottom: "16px" }}><h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "10px" }}><Layers size={14} style={{ display: "inline", marginRight: "6px" }} /> {isNGO ? "Core Programmes" : "Products"} ({products.length})</h3>{products.map(renderOfferingCard)}</div>}
          {services.length > 0 && <div style={{ marginBottom: "16px" }}><h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "10px" }}><Briefcase size={14} style={{ display: "inline", marginRight: "6px" }} /> {isNGO ? "Support Services" : "Services"} ({services.length})</h3>{services.map(renderOfferingCard)}</div>}
        </>
      )
    }

    const renderNgoProgrammes = () => {
      const programmes = ps.programmes || []
      if (programmes.length === 0) return null

      return (
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "10px" }}>
            <Layers size={14} style={{ display: "inline", marginRight: "6px" }} /> Active Programmes ({programmes.length})
          </h3>
          {programmes.map((prog, idx) => (
            <div key={idx} style={{ ...fieldCardStyle, marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "6px" }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#4a352f" }}>
                  {prog.name || `Programme ${idx + 1}`}
                </div>
                {prog.fundingStatus && (
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: "600",
                    backgroundColor: prog.fundingStatus === "fully_funded" ? "#e8f5e9" : "#fff8e1",
                    color: prog.fundingStatus === "fully_funded" ? "#2e7d32" : "#b78103",
                  }}>
                    {formatLabel(prog.fundingStatus)}
                  </span>
                )}
              </div>
              {prog.objective && (
                <p style={{ fontSize: "12px", color: "#4a352f", margin: "4px 0 8px", lineHeight: 1.5 }}>{prog.objective}</p>
              )}
              <div style={grid3}>
                {prog.targetBeneficiaries && (
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: "600", color: "#7d5a50", textTransform: "uppercase", marginBottom: "2px" }}>Target Beneficiaries</div>
                    <div style={{ color: "#4a352f", fontSize: "12px" }}>{prog.targetBeneficiaries}</div>
                  </div>
                )}
                {prog.beneficiariesPerCycle && (
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: "600", color: "#7d5a50", textTransform: "uppercase", marginBottom: "2px" }}>Reach per Cycle</div>
                    <div style={{ color: "#4a352f", fontSize: "12px" }}>{prog.beneficiariesPerCycle}</div>
                  </div>
                )}
                {prog.geographicReach && (
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: "600", color: "#7d5a50", textTransform: "uppercase", marginBottom: "2px" }}>Geographic Scope</div>
                    <div style={{ color: "#4a352f", fontSize: "12px" }}>{formatLabel(prog.geographicReach)}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    }

    const renderTargetMarket = () => {
      const target = isNGO ? (ps.targetBeneficiaryGroups || ps.targetMarket) : ps.targetMarket
      if (!target) return null
      return (
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "10px" }}>
            <Target size={14} style={{ display: "inline", marginRight: "6px" }} /> {isNGO ? "Target Beneficiaries & Communities" : "Target Market"}
          </h3>
          <div style={fieldCardStyle}>
            <span style={fieldValueStyle}>{Array.isArray(target) ? target.map(formatLabel).join(" • ") : target}</span>
          </div>
        </div>
      )
    }

    const renderKeyClients = () => {
      const clients = ps.keyClients || []
      if (clients.length === 0) return null
      const totalRevenuePercent = clients.reduce((s, c) => s + (parseFloat(c.revenuePercentage) || 0), 0)
      return (
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "10px" }}>
            {isNGO ? "Key Institutional Donors & Delivery Partners" : "Key Clients"}
          </h3>
          {totalRevenuePercent > 0 && (
            <div style={{ ...fieldCardStyle, marginBottom: "12px", background: totalRevenuePercent > 100 ? "rgba(207,19,34,0.05)" : "rgba(56,158,13,0.05)", border: `1px solid ${totalRevenuePercent > 100 ? "#ffccc7" : "#b7eb8f"}` }}>
              <span style={fieldLabelStyle}>{isNGO ? "Funding Allocation" : "Revenue Allocation"}</span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: totalRevenuePercent > 100 ? "#cf1322" : "#389e0d" }}>
                {totalRevenuePercent > 100 ? `⚠️ Total exceeds 100% (${totalRevenuePercent}%)` : totalRevenuePercent === 100 ? (isNGO ? "✅ Full funding allocated" : "✅ Full revenue allocated") : (isNGO ? `Funding allocated: ${totalRevenuePercent}%` : `Revenue allocated: ${totalRevenuePercent}%`)}
              </span>
            </div>
          )}
          {clients.map((client, idx) => (
            <div key={idx} style={{ ...fieldCardStyle, marginBottom: "10px" }}>
              <div style={grid3}>
                <div><span style={fieldLabelStyle}>{isNGO ? "Partner / Funder" : "Client"}</span><span style={fieldValueStyle}>{client.name || "Not provided"}</span></div>
                <div><span style={fieldLabelStyle}>{isNGO ? "Contact Person" : "Type"}</span><span style={fieldValueStyle}>{client.contactPerson || client.clientType || "Not provided"}</span></div>
                <div><span style={fieldLabelStyle}>Contact</span><span style={fieldValueStyle}>{client.contactNumber || client.contactEmail || "Not provided"}</span></div>
                <div><span style={fieldLabelStyle}>{isNGO ? "% Funding" : "% Revenue"}</span><span style={fieldValueStyle}>{client.revenuePercentage ? `${client.revenuePercentage}%` : "Not provided"}</span></div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div style={sectionCardStyle}>
        {renderSectionHeader("productsServices", Package, isNGO ? "Programmes & Services" : "Products & Services")}
        {expandedSections.productsServices && (
          <div style={sectionContentStyle}>
            <div style={fieldCardStyle}><span style={fieldLabelStyle}>Offering Type</span><span style={fieldValueStyle}>{getOfferingTypeLabel()}</span></div>
            <div style={{ marginTop: "14px" }}>
              {isNGO && renderNgoProgrammes()}
              {renderOfferings()}
              {renderTargetMarket()}
              {renderKeyClients()}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderContactDetails = () => {
    const contact = data?.contactDetails || {}
    return (
      <div style={sectionCardStyle}>
        {renderSectionHeader("contactDetails", Mail, "Contact Details")}
        {expandedSections.contactDetails && (
          <div style={sectionContentStyle}>
            <div style={grid3}>
              <div style={fieldCardStyle}><span style={fieldLabelStyle}>{isNGO ? "Primary Representative" : "Primary Contact"}</span><div style={{ fontSize: "14px", fontWeight: "600", color: "#4a352f" }}>{contact.contactTitle || ""} {contact.contactName || "Not provided"}</div><div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "2px" }}>{contact.position || "Position not specified"}</div></div>
              <div style={fieldCardStyle}><span style={fieldLabelStyle}><Phone size={11} style={{ display: "inline", marginRight: "3px" }} /> {isNGO ? "Organisation Phone" : "Business Phone"}</span><span style={fieldValueStyle}>{contact.businessPhone || "Not provided"}</span></div>
              <div style={fieldCardStyle}><span style={fieldLabelStyle}><Phone size={11} style={{ display: "inline", marginRight: "3px" }} /> {isNGO ? "Organisation WhatsApp / Mobile" : "Mobile"}</span><span style={fieldValueStyle}>{contact.mobile || "Not provided"}</span></div>
              <div style={fieldCardStyle}><span style={fieldLabelStyle}><Mail size={11} style={{ display: "inline", marginRight: "3px" }} /> {isNGO ? "Official Email" : "Email"}</span><span style={fieldValueStyle}>{contact.email || "Not provided"}</span></div>
              <div style={fieldCardStyle}><span style={fieldLabelStyle}><MapPin size={11} style={{ display: "inline", marginRight: "3px" }} /> Physical</span><span style={fieldValueStyle}>{contact.physicalAddress || "Not provided"}</span></div>
              <div style={fieldCardStyle}><span style={fieldLabelStyle}><MapPin size={11} style={{ display: "inline", marginRight: "3px" }} /> Postal</span><span style={fieldValueStyle}>{contact.sameAsPhysical ? "Same as physical" : (contact.postalAddress || "Not provided")}</span></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderLegalCompliance = () => {
    const legal = data?.legalCompliance || {}

    if (isNGO) {
      return (
        <div style={sectionCardStyle}>
          {renderSectionHeader("legalCompliance", Shield, "Legal & Compliance")}
          {expandedSections.legalCompliance && (
            <div style={sectionContentStyle}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "10px" }}>Non-Profit Registrations & Approvals</h3>
              <div style={grid3}>
                <div style={fieldCardStyle}><span style={fieldLabelStyle}>DSD NPO Status</span><span style={fieldValueStyle}>{formatLabel(legal.dsdRegistrationStatus) || "Not registered"}</span></div>
                <div style={fieldCardStyle}><span style={fieldLabelStyle}>DSD NPO Number</span><span style={fieldValueStyle}>{legal.dsdRegistrationNumber || "Not provided"}</span></div>
                <div style={fieldCardStyle}><span style={fieldLabelStyle}>SARS Section 18A Status</span><span style={fieldValueStyle}>{legal.sars18aApproved === "yes" ? "✅ Approved (Can issue tax receipts)" : "Not approved"}</span></div>
                <div style={fieldCardStyle}><span style={fieldLabelStyle}>PBO Reference Number</span><span style={fieldValueStyle}>{legal.pboReferenceNumber || "Not provided"}</span></div>
                <div style={fieldCardStyle}><span style={fieldLabelStyle}>VAT Exemption Status</span><span style={fieldValueStyle}>{legal.vatExempt === "yes" ? "✅ VAT Exempt" : "Standard VAT Registered"}</span></div>
                <div style={fieldCardStyle}><span style={fieldLabelStyle}>Constitution / Founding Doc</span>{legal.constitutionDocument ? renderDocumentLink(legal.constitutionDocument.url || legal.constitutionDocument, "Constitution / Trust Deed") : <span style={fieldValueStyle}>Not uploaded</span>}</div>
                <div style={fieldCardStyle}><span style={fieldLabelStyle}>Annual DSD Narrative Report</span>{legal.annualDsdReport ? renderDocumentLink(legal.annualDsdReport.url || legal.annualDsdReport, "Latest DSD Report") : <span style={fieldValueStyle}>Not uploaded</span>}</div>
                <div style={fieldCardStyle}><span style={fieldLabelStyle}>B-BBEE / SED Recognition</span><span style={fieldValueStyle}>{legal.bbbeeLevel || legal.sedRecognition || "Not provided"}</span></div>
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div style={sectionCardStyle}>
        {renderSectionHeader("legalCompliance", Shield, "Legal & Compliance")}
        {expandedSections.legalCompliance && (
          <div style={sectionContentStyle}>
            <div style={grid3}>
              <div style={fieldCardStyle}><span style={fieldLabelStyle}>Tax Number</span><span style={fieldValueStyle}>{legal.taxNumber || "Not provided"}</span></div>
              <div style={fieldCardStyle}><span style={fieldLabelStyle}>Tax Clearance PIN</span><span style={fieldValueStyle}>{legal.taxClearancePin || "Not provided"}</span></div>
              <div style={fieldCardStyle}><span style={fieldLabelStyle}>PAYE Number</span><span style={fieldValueStyle}>{legal.payeNumber || "Not provided"}</span></div>
              <div style={fieldCardStyle}><span style={fieldLabelStyle}>VAT Number</span><span style={fieldValueStyle}>{legal.vatNumber || "Not provided"}</span></div>
              <div style={fieldCardStyle}><span style={fieldLabelStyle}>UIF Status</span><span style={fieldValueStyle}>{formatLabel(legal.uifStatus) || "Not provided"}</span></div>
              <div style={fieldCardStyle}><span style={fieldLabelStyle}>UIF Number</span><span style={fieldValueStyle}>{legal.uifNumber || "Not provided"}</span></div>
              <div style={fieldCardStyle}><span style={fieldLabelStyle}>COIDA Number</span><span style={fieldValueStyle}>{legal.coidaNumber || "Not provided"}</span></div>
              <div style={fieldCardStyle}><span style={fieldLabelStyle}>B-BBEE Level</span><span style={fieldValueStyle}>{legal.bbbeeLevel || "Not provided"}</span></div>
              <div style={{ ...fieldCardStyle, gridColumn: '1 / -1' }}>
                <span style={fieldLabelStyle}><AlertTriangle size={11} /> Pending Legal Judgments</span>
                <span style={fieldValueStyle}>{legal.pendingLegalJudgments || "Not provided"}</span>
                {legal.pendingLegalJudgments === "Yes" && legal.pendingLegalJudgmentsDetails && <div style={{ marginTop: "6px", padding: "6px", background: "rgba(166,124,82,0.05)", borderRadius: "4px", fontSize: "12px" }}>{legal.pendingLegalJudgmentsDetails}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderOwnershipManagement = () => {
    const om = data?.ownershipManagement || {}

    const renderFounders = () => {
      const founders = om.founders || []
      if (founders.length === 0) return null
      return (
        <div style={{ marginTop: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "8px" }}>Founders</h3>
          <div style={{ ...fieldCardStyle, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                  {["Name", "Country", "Contribution", "Active", "Race", "Gender", "Youth", "Disabled"].map((h) => (
                    <th key={h} style={{ padding: "6px 4px", textAlign: "left", fontSize: "9px", fontWeight: "700", color: "#7d5a50", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {founders.map((f, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e6d7c3" }}>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontWeight: "600", fontSize: "11px" }}>{f.name || "—"}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{f.country || f.nationality || "—"}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{f.roleDescription || f.contribution || "Founder"}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{formatBoolean(f.isActive)}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{f.race || "—"}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{f.gender || "—"}</td>
                    <td style={{ padding: "5px 4px", fontSize: "11px" }}>{formatBoolean(f.isYouth)}</td>
                    <td style={{ padding: "5px 4px", fontSize: "11px" }}>{formatBoolean(f.isDisabled)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    const renderShareholders = () => {
      const shareholders = om.shareholders || []
      if (shareholders.length === 0) return null
      return (
        <div style={{ marginTop: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "8px" }}>Shareholders</h3>
          <div style={{ ...fieldCardStyle, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                  {["Name", "Country", "%", "Issued", "Race", "Gender", "DOA", "Youth", "Disabled", "Also Director"].map((h) => (
                    <th key={h} style={{ padding: "6px 4px", textAlign: "left", fontSize: "9px", fontWeight: "700", color: "#7d5a50", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shareholders.map((sh, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e6d7c3" }}>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontWeight: "500", fontSize: "11px" }}>{sh.name || "—"}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{sh.country || "—"}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontWeight: "600", fontSize: "11px" }}>{sh.shareholding || "0"}%</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{sh.issuedShares || "0"}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{sh.race || "—"}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{sh.gender || "—"}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{formatDate(sh.doa)}</td>
                    <td style={{ padding: "5px 4px", fontSize: "11px" }}>{formatBoolean(sh.isYouth)}</td>
                    <td style={{ padding: "5px 4px", fontSize: "11px" }}>{formatBoolean(sh.isDisabled)}</td>
                    <td style={{ padding: "5px 4px", fontSize: "11px" }}>{formatBoolean(sh.isAlsoDirector)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    const renderGoverningBody = () => {
      const directors = om.directors || om.governingBody || []
      if (directors.length === 0) return null
      const structure = data?.entityOverview?.legalStructure
      const bodyTitle = structure === "Trust"
        ? "Board of Trustees"
        : structure === "Voluntary Association"
          ? "Management Committee"
          : isNGO ? "Governing Board / Directors" : "Directors"

      return (
        <div style={{ marginTop: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "8px" }}>{bodyTitle}</h3>
          <div style={{ ...fieldCardStyle, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                  {["Name", "Roles", "Nationality", "Exec/Non-Exec", "Race", "Gender", "CV"].map((h) => (
                    <th key={h} style={{ padding: "6px 4px", textAlign: "left", fontSize: "9px", fontWeight: "700", color: "#7d5a50", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {directors.map((d, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e6d7c3" }}>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontWeight: "500", fontSize: "11px" }}>
                      {d.name || "—"}
                      {d.isChairperson && <span style={{ marginLeft: "4px", fontSize: "9px", color: "#b45309", fontWeight: "700" }}>★ Chair</span>}
                    </td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "10px" }}>{(d.roles || []).map((r) => r === "Other" ? (d.customRole || "Other") : r).join(", ") || "Member"}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{d.nationality || "—"}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{d.execType || "Non-Executive"}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{d.race || "—"}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{d.gender || "—"}</td>
                    <td style={{ padding: "5px 4px" }}>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        {d.linkedin && renderLinkedInLink(d.linkedin)}
                        {d.cv && renderDocumentLink(d.cv.url || d.cv, "CV")}
                        {!d.linkedin && !d.cv && "—"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    const renderExecutives = () => {
      const executives = om.executives || []
      if (executives.length === 0) return null
      return (
        <div style={{ marginTop: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "8px" }}>
            {isNGO ? "Executive Leadership & Programme Leads" : "Executive Management"}
          </h3>
          <div style={{ ...fieldCardStyle, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                  {["Name", "Position", "Nationality", "Race", "Gender"].map((h) => (
                    <th key={h} style={{ padding: "6px 4px", textAlign: "left", fontSize: "9px", fontWeight: "700", color: "#7d5a50", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {executives.map((ex, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e6d7c3" }}>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontWeight: "500", fontSize: "11px" }}>{ex.name || "—"}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{ex.position === "Other" ? (ex.customPosition || "Other") : (ex.position || "—")}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{ex.nationality || "—"}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{ex.race || "—"}</td>
                    <td style={{ padding: "5px 4px", color: "#4a352f", fontSize: "11px" }}>{ex.gender || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    return (
      <div style={sectionCardStyle}>
        {renderSectionHeader("ownershipManagement", Users, isNGO ? "Leadership & Governance" : "Ownership & Management")}
        {expandedSections.ownershipManagement && (
          <div style={sectionContentStyle}>
            {!isNGO && (
              <div style={grid3}>
                <div style={fieldCardStyle}><span style={fieldLabelStyle}>Total Authorised Shares</span><span style={fieldValueStyle}>{om.totalAuthorisedShares || om.totalShares || "Not provided"}</span></div>
                <div style={fieldCardStyle}><span style={fieldLabelStyle}>Total Issued Shares</span><span style={fieldValueStyle}>{om.totalIssuedShares || "Not provided"}</span></div>
              </div>
            )}

            {isNGO ? renderFounders() : renderShareholders()}
            {renderGoverningBody()}
            {renderExecutives()}
          </div>
        )}
      </div>
    )
  }

  const renderOperationsOverview = () => {
    const ops = data?.operationsOverview || {}
    return (
      <div style={sectionCardStyle}>
        {renderSectionHeader("operationsOverview", FileCheck, "Operations Overview")}
        {expandedSections.operationsOverview && (
          <div style={sectionContentStyle}>
            {isNGO ? (
              <>
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "8px" }}>Delivery Capacity & Safeguarding</h3>
                <div style={grid3}>
                  <div style={fieldCardStyle}><span style={fieldLabelStyle}>Delivery Partners & Sub-Contracting</span><span style={fieldValueStyle}>{ops.deliveryPartners === "yes" ? "✅ Engages delivery partners" : "Direct delivery"}</span></div>
                  <div style={fieldCardStyle}><span style={fieldLabelStyle}>Delivery Continuity & Partner Risk</span><span style={fieldValueStyle}>{ops.deliveryContinuityRisk === "yes" ? "✅ Documented contingency in place" : "No formal contingency"}</span></div>
                  <div style={fieldCardStyle}><span style={fieldLabelStyle}>Premises & Venues</span><span style={fieldValueStyle}>{formatLabel(ops.premisesType) || "Field / Community Venues"}</span></div>
                  <div style={fieldCardStyle}><span style={fieldLabelStyle}>Active Volunteers</span><span style={fieldValueStyle}>{ops.activeVolunteersCount || data?.entityOverview?.volunteerCount || "0"}</span></div>
                  <div style={fieldCardStyle}><span style={fieldLabelStyle}>Beneficiary Safeguarding Policy</span><span style={fieldValueStyle}>{ops.safeguardingPolicies === "yes" ? "✅ Formal safeguarding policy in place" : "In development"}</span></div>
                  <div style={fieldCardStyle}><span style={fieldLabelStyle}>Beneficiary Complaints Mechanism</span><span style={fieldValueStyle}>{ops.incidentReportingMechanism === "yes" ? "✅ Documented feedback/complaints mechanism" : "Informal"}</span></div>
                </div>
              </>
            ) : (
              <div style={grid3}>
                {[
                  { q: "Multiple Key Suppliers", key: "multipleSuppliers" },
                  { q: "Documented Contingency Plan", key: "contingencyPlan" },
                  { q: "Track Performance Metrics", key: "trackPerformanceMetrics" },
                  { q: "3+ Successful Deliveries", key: "threeSuccessfulDeliveries" },
                  { q: "Capacity to Increase Output", key: "hasCapacityToIncrease" },
                  { q: "Formal Safety/Compliance", key: "hasFormalProcedures" },
                  { q: "Major Incidents (24m)", key: "hasMajorIncidents" },
                ].map(({ q, key }) => {
                  const v = ops[key]
                  return (
                    <div key={key} style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>{q}</span>
                      <span style={fieldValueStyle}>{v === "yes" ? "✅ Yes" : v === "no" ? "❌ No" : "Not answered"}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {ops.suppliers?.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "8px" }}>Suppliers</h3>
                <div style={{ ...fieldCardStyle, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                    <thead><tr style={{ borderBottom: "2px solid #c8b6a6", backgroundColor: "#5c3a1e" }}><th style={{ padding: "6px 8px", textAlign: "left", color: "#fff", fontWeight: "600", fontSize: "9px" }}>#</th><th style={{ padding: "6px 8px", textAlign: "left", color: "#fff", fontWeight: "600", fontSize: "9px" }}>Company</th><th style={{ padding: "6px 8px", textAlign: "left", color: "#fff", fontWeight: "600", fontSize: "9px" }}>Contact</th></tr></thead>
                    <tbody>{ops.suppliers.map((s, i) => (<tr key={i} style={{ borderBottom: "1px solid #e6d7c3" }}><td style={{ padding: "5px 8px", color: "#4a352f", fontSize: "11px" }}>{i + 1}</td><td style={{ padding: "5px 8px", color: "#4a352f", fontSize: "11px" }}>{s.name || "—"}</td><td style={{ padding: "5px 8px", color: "#4a352f", fontSize: "11px" }}>{s.contact || "—"}</td></tr>))}</tbody>
                  </table>
                </div>
              </div>
            )}

            {ops.premisesStatus && (
              <div style={{ marginTop: "16px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "8px" }}>Premises</h3>
                <div style={grid3}>
                  <div style={fieldCardStyle}><span style={fieldLabelStyle}>Status</span><span style={fieldValueStyle}>{formatLabel(ops.premisesStatus)}</span></div>
                  {ops.premisesType && <div style={fieldCardStyle}><span style={fieldLabelStyle}>Type</span><span style={fieldValueStyle}>{formatLabel(ops.premisesType)}</span></div>}
                  {ops.premisesSize && <div style={fieldCardStyle}><span style={fieldLabelStyle}>Size (sqm)</span><span style={fieldValueStyle}>{ops.premisesSize}</span></div>}
                  {ops.leaseExpiryDate && <div style={fieldCardStyle}><span style={fieldLabelStyle}>Lease Expiry</span><span style={fieldValueStyle}>{formatDate(ops.leaseExpiryDate)}</span></div>}
                </div>
              </div>
            )}

            {ops.industryAccreditations?.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "8px" }}>Industry Accreditations</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {ops.industryAccreditations.map((acc, i) => (
                    <span key={i} style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", backgroundColor: "#f3ebe0", color: "#5c3a1e", border: "1px solid #d6c4a8" }}>{acc}</span>
                  ))}
                </div>
              </div>
            )}

            {ops.operationalChallenges && (
              <div style={{ marginTop: "16px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "8px" }}>{isNGO ? "Delivery & Operational Constraints" : "Operational Challenges"}</h3>
                <div style={{ background: "rgba(166,124,82,0.1)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(166,124,82,0.2)" }}>
                  <p style={{ fontSize: "12px", color: "#4a352f", lineHeight: "1.6", margin: 0 }}>{ops.operationalChallenges}</p>
                </div>
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
        @keyframes slideDown { from { opacity: 0; transform: translateY(-16px); max-height: 0; } to { opacity: 1; transform: translateY(0); max-height: 2000px; } }
        @media (max-width: 768px) { .main-container { padding: 12px !important; } }
      `}</style>
      <div className="main-container" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: "100vh", width: "100%", padding: "16px", boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: "none" }}>
          {/* Header Banner */}
          <div style={{ background: "linear-gradient(135deg, rgba(250,247,242,0.9), rgba(245,240,225,0.9))", borderRadius: "16px", padding: "18px", marginBottom: "16px", boxShadow: "0 20px 40px rgba(74,53,47,0.1)", border: "1px solid rgba(200,182,166,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "220px" }}>
                <h1 style={{ background: "linear-gradient(135deg, #4a352f, #7d5a50)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: "800", margin: "0 0 6px 0" }}>
                  {isNGO ? "My NGO Profile" : "Universal Profile"}
                </h1>
                <p style={{ color: "#7d5a50", fontSize: "clamp(13px, 1.5vw, 16px)", margin: 0, fontWeight: "500" }}>
                  {isNGO ? "Complete Organisation & Impact Overview" : "Complete Business Overview"}
                </p>
              </div>
              <button onClick={handleEdit} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "linear-gradient(135deg, #a67c52, #7d5a50)", color: "#faf7f2", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 16px rgba(166,124,82,0.3)" }}>
                <Edit size={14} /> Edit Profile
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: "14px" }}>
            {/* Entity Overview */}
            <div style={sectionCardStyle}>
              {renderSectionHeader("entityOverview", Building, "Entity Overview")}
              {expandedSections.entityOverview && (
                <div style={sectionContentStyle}>
                  <div style={grid3}>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Registered Name</span><span style={fieldValueStyle}>{data?.entityOverview?.registeredName || "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>{isNGO ? "Operating Name" : "Trading Name"}</span><span style={fieldValueStyle}>{data?.entityOverview?.tradingName || "Same as registered"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>{isNGO ? "Registration / Establishment Number" : "Registration Number"}</span><span style={fieldValueStyle}>{data?.entityOverview?.registrationNumber || "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Entity Type</span><span style={fieldValueStyle}>{data?.entityOverview?.entityType || (isNGO ? "Non-Profit Organisation" : "SME")}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Legal Structure</span><span style={fieldValueStyle}>{data?.entityOverview?.legalStructure || "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Entity Size</span><span style={fieldValueStyle}>{data?.entityOverview?.entitySize || "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Financial Year End</span><span style={fieldValueStyle}>{data?.entityOverview?.financialYearEnd || "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Years in Operation</span><span style={fieldValueStyle}>{data?.entityOverview?.yearsInOperation || "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Operation Stage</span><span style={fieldValueStyle}>{data?.entityOverview?.operationStage || "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>{isNGO ? "Focus Sectors" : "Economic Sectors"}</span><span style={fieldValueStyle}>{data?.entityOverview?.economicSectors?.length > 0 ? data.entityOverview.economicSectors.map((s) => formatLabel(s)).join(" • ") : "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>{isNGO ? "Countries of Operation" : "Countries"}</span><span style={fieldValueStyle}>{data?.entityOverview?.operatingCountries?.length > 0 ? data.entityOverview.operatingCountries.map((c) => formatLabel(c)).join(" • ") : "Not provided"}</span></div>
                    {data?.entityOverview?.operatingCountries?.includes("South Africa") && data?.entityOverview?.operatingProvinces?.length > 0 && (
                      <div style={fieldCardStyle}><span style={fieldLabelStyle}>Provinces (SA)</span><span style={fieldValueStyle}>{data.entityOverview.operatingProvinces.map((p) => formatLabel(p)).join(" • ")}</span></div>
                    )}
                    {isNGO && data?.entityOverview?.targetBeneficiaryGroups?.length > 0 && (
                      <div style={fieldCardStyle}><span style={fieldLabelStyle}>Target Beneficiary Groups</span><span style={fieldValueStyle}>{data.entityOverview.targetBeneficiaryGroups.map((b) => formatLabel(b)).join(" • ")}</span></div>
                    )}
                    {isNGO && data?.entityOverview?.communitiesServed && (
                      <div style={fieldCardStyle}><span style={fieldLabelStyle}>Communities Served</span><span style={fieldValueStyle}>{data.entityOverview.communitiesServed}</span></div>
                    )}
                  </div>
                  {isNGO && data?.entityOverview?.mission && (
                    <div style={{ background: "rgba(166,124,82,0.1)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(166,124,82,0.2)", marginTop: "12px" }}>
                      <span style={{ ...fieldLabelStyle, fontWeight: "700" }}>Mission Statement</span>
                      <p style={{ fontSize: "13px", color: "#4a352f", lineHeight: "1.6", margin: 0 }}>{data.entityOverview.mission}</p>
                    </div>
                  )}
                  {data?.entityOverview?.businessDescription && (
                    <div style={{ background: "rgba(166,124,82,0.1)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(166,124,82,0.2)", marginTop: "12px" }}>
                      <span style={{ ...fieldLabelStyle, fontWeight: "700" }}>{isNGO ? "Organisation Overview" : "Business Description"}</span>
                      <p style={{ fontSize: "13px", color: "#4a352f", lineHeight: "1.6", margin: 0 }}>{data.entityOverview.businessDescription}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Brand Assets */}
            {renderBrandAssets()}

            {/* Products & Services / Programmes & Services */}
            {renderProductsServices()}

            {/* Ownership & Management / Leadership & Governance */}
            {renderOwnershipManagement()}

            {/* Contact Details */}
            {renderContactDetails()}

            {/* Legal & Compliance */}
            {renderLegalCompliance()}

            {/* Financial Overview */}
            <div style={sectionCardStyle}>
              {renderSectionHeader("financialOverview", DollarSign, "Financial Overview")}
              {expandedSections.financialOverview && (
                <div style={sectionContentStyle}>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#4a352f", marginBottom: "10px" }}>A. Financial Performance</h3>

                  <h4 style={{ fontSize: "13px", fontWeight: "600", color: "#5c3a1e", marginBottom: "6px" }}>
                    {isNGO ? "Statement of Comprehensive Income (Surplus / Deficit)" : "Income Statement"}
                  </h4>
                  <div style={{ ...fieldCardStyle, overflowX: "auto", marginBottom: "12px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                      <thead><tr style={{ backgroundColor: "#5c3a1e" }}><th style={{ padding: "6px 8px", textAlign: "left", color: "#fff", fontWeight: "600", fontSize: "9px" }}>Line</th><th style={{ padding: "6px 8px", textAlign: "right", color: "#fff", fontWeight: "600", fontSize: "9px" }}>Current</th><th style={{ padding: "6px 8px", textAlign: "right", color: "#fff", fontWeight: "600", fontSize: "9px" }}>Previous</th></tr></thead>
                      <tbody>
                        {[
                          { label: "Currency", current: data?.financialOverview?.incomeCurrency || "ZAR" },
                          { label: isNGO ? "Total Income (Grants, Donations & Subsidies)" : "Turnover", current: data?.financialOverview?.incomeTurnoverCurrent, previous: data?.financialOverview?.incomeTurnoverPrevious },
                          { label: isNGO ? "Direct Programme Costs" : "COGS", current: data?.financialOverview?.incomeCOGSCurrent, previous: data?.financialOverview?.incomeCOGSPrevious },
                          { label: isNGO ? "Net Programme Contribution" : "Gross Profit", current: data?.financialOverview?.incomeGrossProfitCurrent, previous: data?.financialOverview?.incomeGrossProfitPrevious, hl: true },
                          { label: isNGO ? "Operating Surplus / (Deficit)" : "Operating Profit", current: data?.financialOverview?.incomeOperatingProfitCurrent, previous: data?.financialOverview?.incomeOperatingProfitPrevious },
                          { label: isNGO ? "Total Surplus / (Deficit)" : "Net Profit", current: data?.financialOverview?.incomeNetProfitCurrent, previous: data?.financialOverview?.incomeNetProfitPrevious, hl: true },
                        ].filter((r) => r.current || r.previous || r.label === "Currency").map((row, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #e6d7c3", backgroundColor: row.hl ? "#f9f7f3" : "transparent" }}>
                            <td style={{ padding: "5px 8px", fontWeight: row.hl ? "600" : "400", color: "#4a352f", fontSize: "11px" }}>{row.label}</td>
                            <td style={{ padding: "5px 8px", textAlign: "right", color: "#4a352f", fontSize: "11px" }}>{row.current || "—"}</td>
                            <td style={{ padding: "5px 8px", textAlign: "right", color: "#4a352f", fontSize: "11px" }}>{row.previous || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* NGO Income Sources Breakdown */}
                  {isNGO && data?.financialOverview?.incomeSources?.length > 0 && (
                    <>
                      <h4 style={{ fontSize: "13px", fontWeight: "600", color: "#5c3a1e", marginBottom: "6px", marginTop: "14px" }}>Income Sources Breakdown</h4>
                      <div style={{ ...fieldCardStyle, overflowX: "auto", marginBottom: "12px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #c8b6a6", backgroundColor: "#7d5a50" }}>
                              <th style={{ padding: "6px 8px", textAlign: "left", color: "#ffffff", fontWeight: "600", fontSize: "9px" }}>Source Type</th>
                              <th style={{ padding: "6px 8px", textAlign: "right", color: "#ffffff", fontWeight: "600", fontSize: "9px" }}>Amount (ZAR)</th>
                              <th style={{ padding: "6px 8px", textAlign: "right", color: "#ffffff", fontWeight: "600", fontSize: "9px" }}>Share</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.financialOverview.incomeSources.map((src, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid #e6d7c3" }}>
                                <td style={{ padding: "5px 8px", color: "#4a352f", fontSize: "11px" }}>{src.sourceName || formatLabel(src.sourceType)}</td>
                                <td style={{ padding: "5px 8px", textAlign: "right", color: "#4a352f", fontSize: "11px" }}>R {Number(src.amount || 0).toLocaleString()}</td>
                                <td style={{ padding: "5px 8px", textAlign: "right", color: "#4a352f", fontSize: "11px" }}>{src.percentage || 0}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* NGO Key Funders & Funding Commitments */}
                  {isNGO && data?.financialOverview?.keyFunders?.length > 0 && (
                    <>
                      <h4 style={{ fontSize: "13px", fontWeight: "600", color: "#5c3a1e", marginBottom: "6px", marginTop: "14px" }}>Key Funders & Funding Commitments</h4>
                      <div style={{ ...fieldCardStyle, overflowX: "auto", marginBottom: "12px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #c8b6a6", backgroundColor: "#7d5a50" }}>
                              <th style={{ padding: "6px 8px", textAlign: "left", color: "#ffffff", fontWeight: "600", fontSize: "9px" }}>Funder Name</th>
                              <th style={{ padding: "6px 8px", textAlign: "left", color: "#ffffff", fontWeight: "600", fontSize: "9px" }}>Purpose</th>
                              <th style={{ padding: "6px 8px", textAlign: "right", color: "#ffffff", fontWeight: "600", fontSize: "9px" }}>Amount</th>
                              <th style={{ padding: "6px 8px", textAlign: "center", color: "#ffffff", fontWeight: "600", fontSize: "9px" }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.financialOverview.keyFunders.map((funder, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid #e6d7c3" }}>
                                <td style={{ padding: "5px 8px", fontWeight: "600", color: "#4a352f", fontSize: "11px" }}>{funder.funderName || "Confidential"}</td>
                                <td style={{ padding: "5px 8px", color: "#4a352f", fontSize: "11px" }}>{funder.programmePurpose || "General Support"}</td>
                                <td style={{ padding: "5px 8px", textAlign: "right", color: "#4a352f", fontSize: "11px" }}>R {Number(funder.committedAmount || 0).toLocaleString()}</td>
                                <td style={{ padding: "5px 8px", textAlign: "center", color: "#4a352f", fontSize: "11px" }}>{formatLabel(funder.status || "Committed")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* NGO Financial Sustainability & Cash Runway */}
                  {isNGO && (
                    <>
                      <h4 style={{ fontSize: "13px", fontWeight: "600", color: "#5c3a1e", marginBottom: "6px", marginTop: "14px" }}>Financial Sustainability & Cash Runway</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "14px" }}>
                        <div style={fieldCardStyle}><span style={fieldLabelStyle}>Unrestricted Cash</span><span style={fieldValueStyle}>{data.financialOverview.unrestrictedCash ? `R ${Number(data.financialOverview.unrestrictedCash).toLocaleString()}` : "Not provided"}</span></div>
                        <div style={fieldCardStyle}><span style={fieldLabelStyle}>Monthly Burn</span><span style={fieldValueStyle}>{data.financialOverview.monthlyOperatingBurn ? `R ${Number(data.financialOverview.monthlyOperatingBurn).toLocaleString()}` : "Not provided"}</span></div>
                        <div style={fieldCardStyle}><span style={fieldLabelStyle}>Calculated Runway</span><span style={{ ...fieldValueStyle, fontWeight: "700", color: "#7d5a50" }}>{data.financialOverview.cashRunwayMonths ? `${data.financialOverview.cashRunwayMonths} Months` : "Not calculated"}</span></div>
                        <div style={fieldCardStyle}><span style={fieldLabelStyle}>Restricted Balances</span><span style={fieldValueStyle}>{data.financialOverview.restrictedBalances ? `R ${Number(data.financialOverview.restrictedBalances).toLocaleString()}` : "R 0"}</span></div>
                      </div>
                    </>
                  )}

                  <h4 style={{ fontSize: "13px", fontWeight: "600", color: "#5c3a1e", marginBottom: "6px", marginTop: "12px" }}>Balance Sheet</h4>
                  <div style={{ ...fieldCardStyle, overflowX: "auto", marginBottom: "12px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                      <thead><tr style={{ backgroundColor: "#5c3a1e" }}><th style={{ padding: "6px 8px", textAlign: "left", color: "#fff", fontWeight: "600", fontSize: "9px" }}>Line</th><th style={{ padding: "6px 8px", textAlign: "right", color: "#fff", fontWeight: "600", fontSize: "9px" }}>Current</th><th style={{ padding: "6px 8px", textAlign: "right", color: "#fff", fontWeight: "600", fontSize: "9px" }}>Previous</th></tr></thead>
                      <tbody>
                        {[
                          { label: "Current Assets", current: data?.financialOverview?.balanceCurrentAssetsCurrent, previous: data?.financialOverview?.balanceCurrentAssetsPrevious },
                          { label: "Total Assets", current: data?.financialOverview?.balanceTotalAssetsCurrent, previous: data?.financialOverview?.balanceTotalAssetsPrevious, hl: true },
                          { label: "Current Liabilities", current: data?.financialOverview?.balanceCurrentLiabilitiesCurrent, previous: data?.financialOverview?.balanceCurrentLiabilitiesPrevious },
                          { label: "Long Term Liabilities", current: data?.financialOverview?.balanceLongTermLiabilitiesCurrent, previous: data?.financialOverview?.balanceLongTermLiabilitiesPrevious },
                          { label: isNGO ? "Accumulated Funds / Net Assets" : "Equity", current: data?.financialOverview?.balanceEquityCurrent, previous: data?.financialOverview?.balanceEquityPrevious },
                          { label: "Total Liabilities", current: data?.financialOverview?.balanceTotalLiabilitiesCurrent, previous: data?.financialOverview?.balanceTotalLiabilitiesPrevious, hl: true },
                        ].filter((r) => r.current || r.previous).map((row, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #e6d7c3", backgroundColor: row.hl ? "#f9f7f3" : "transparent" }}>
                            <td style={{ padding: "5px 8px", fontWeight: row.hl ? "600" : "400", color: "#4a352f", fontSize: "11px" }}>{row.label}</td>
                            <td style={{ padding: "5px 8px", textAlign: "right", color: "#4a352f", fontSize: "11px" }}>{row.current || "—"}</td>
                            <td style={{ padding: "5px 8px", textAlign: "right", color: "#4a352f", fontSize: "11px" }}>{row.previous || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#4a352f", marginBottom: "10px", marginTop: "16px" }}>B. Financial Management &amp; Systems</h3>
                  <div style={grid3}>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Books Up to Date</span><span style={fieldValueStyle}>{formatLabel(data?.financialOverview?.booksUpToDate)}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Management Accounts</span><span style={fieldValueStyle}>{formatLabel(data?.financialOverview?.hasManagementAccounts)}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Accounting Software</span><span style={fieldValueStyle}>{formatLabel(data?.financialOverview?.hasAccountingSoftware)}{data?.financialOverview?.accountingSoftwareName ? ` (${data.financialOverview.accountingSoftwareName})` : ""}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Insured</span><span style={fieldValueStyle}>{data?.financialOverview?.isInsured === "yes" ? "✅ Yes" : data?.financialOverview?.isInsured === "no" ? "❌ No" : "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Financial Statements</span><span style={fieldValueStyle}>{formatLabel(data?.financialOverview?.hasFinancialStatements || data?.financialOverview?.preparedStatements)}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>{isNGO ? "Financials Audited / Reviewed" : "Financials Audited"}</span><span style={fieldValueStyle}>{formatLabel(data?.financialOverview?.financialsAudited)}</span></div>
                  </div>

                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#4a352f", marginBottom: "10px", marginTop: "16px" }}>C. Support Intent</h3>
                  <div style={grid3}>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>{isNGO ? "Seeking Funding & Donor Support" : "Seeking Funding"}</span><span style={fieldValueStyle}>{formatLabel(data?.financialOverview?.seekingFunding)}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Support Type Needed</span><span style={fieldValueStyle}>{data?.financialOverview?.supportTypeNeeded?.length > 0 ? data.financialOverview.supportTypeNeeded.map((s) => formatLabel(s)).join(" • ") : "None"}</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Operations Overview */}
            {renderOperationsOverview()}

            {/* Governance & ESG Overview */}
            <div style={sectionCardStyle}>
              {renderSectionHeader("governance", FileCheck, isNGO ? "Governance & ESG" : "ESG Overview")}
              {expandedSections.governance && (
                <div style={sectionContentStyle}>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#4a352f", marginBottom: "10px" }}>Policies &amp; Controls</h3>
                  {data?.governance?.governanceChecklist && Object.keys(data.governance.governanceChecklist).length > 0 ? (
                    <>
                      <div style={{ background: "rgba(166,124,82,0.1)", borderRadius: "10px", padding: "14px", border: "1px solid rgba(166,124,82,0.2)", marginBottom: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#4a352f" }}>Progress</span>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#7d5a50" }}>{Object.values(data.governance.governanceChecklist).filter(Boolean).length} completed</span>
                        </div>
                        <div style={{ width: "100%", background: "rgba(200,182,166,0.3)", borderRadius: "6px", height: "10px", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "linear-gradient(135deg, #a67c52, #7d5a50)", width: `${(Object.values(data.governance.governanceChecklist).filter(Boolean).length / Object.keys(data.governance.governanceChecklist).length) * 100}%`, borderRadius: "6px" }} />
                        </div>
                      </div>
                      <div style={grid3}>
                        {Object.entries(data.governance.governanceChecklist).filter(([, v]) => v === true).map(([key], i) => (
                          <div key={i} style={{ background: "rgba(166,124,82,0.1)", borderRadius: "8px", padding: "8px 10px", border: "1px solid rgba(166,124,82,0.2)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <CheckSquare size={13} color="#a67c52" />
                            <span style={{ fontSize: "12px", color: "#4a352f", fontWeight: "500" }}>{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ background: "rgba(200,182,166,0.1)", borderRadius: "10px", padding: "18px", border: "1px solid rgba(200,182,166,0.2)", textAlign: "center", color: "#7d5a50", fontSize: "12px" }}>
                      No policies &amp; controls completed yet.
                    </div>
                  )}

                  <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "8px", marginTop: "16px" }}>
                    {isNGO ? "Governing Body & Accountability" : "Conflict of Interest"}
                  </h3>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>{isNGO ? "Board Members with Multiple Directorships / Interests" : "Members Have Multiple Businesses"}</span>
                    <span style={fieldValueStyle}>{data?.governance?.membersHaveMultipleBusinesses || "Not specified"}</span>
                  </div>

                  <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "8px", marginTop: "16px" }}>Ethics Training</h3>
                  <div style={grid3}>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Ethics Training Frequency</span><span style={fieldValueStyle}>{data?.governance?.ethicsTrainingFrequency || "Not specified"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Last Ethics Training Date</span><span style={fieldValueStyle}>{formatDate(data?.governance?.lastEthicsTrainingDate) || "Not specified"}</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Declaration & Consent — includes How Did You Hear at the END */}
            <div style={sectionCardStyle}>
              {renderSectionHeader("declarationConsent", CheckSquare, "Declaration & Consent")}
              {expandedSections.declarationConsent && (
                <div style={sectionContentStyle}>
                  <div style={grid3}>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Declaration of Accuracy</span><span style={fieldValueStyle}>{data?.declarationConsent?.accuracy ? "✅ Confirmed" : "❌ Not confirmed"}</span></div>
                    {isNGO && (
                      <div style={fieldCardStyle}><span style={fieldLabelStyle}>Authority to Submit Profile</span><span style={fieldValueStyle}>{data?.declarationConsent?.authorisedSubmitter ? "✅ Confirmed" : "❌ Not confirmed"}</span></div>
                    )}
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>{isNGO ? "Organisation Data Processing" : "Consent for Data Processing"}</span><span style={fieldValueStyle}>{data?.declarationConsent?.dataProcessing ? "✅ Confirmed" : "❌ Not confirmed"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>{isNGO ? "Marketplace Directory Listing" : "Opt-in for Promotional Visibility"}</span><span style={fieldValueStyle}>{data?.declarationConsent?.termsConditions ? "✅ Yes" : "❌ No"}</span></div>
                  </div>

                  {(data?.howDidYouHear?.source || data?.declarationConsent?.howDidYouHear?.source) && (
                    <>
                      <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#4a352f", marginBottom: "10px", marginTop: "16px" }}>How Did You Hear About Us?</h3>
                      <div style={grid3}>
                        <div style={fieldCardStyle}><span style={fieldLabelStyle}>Source</span><span style={fieldValueStyle}>{formatLabel(data?.howDidYouHear?.source || data?.declarationConsent?.howDidYouHear?.source) || "Not provided"}</span></div>
                        {(data?.howDidYouHear?.otherSource || data?.declarationConsent?.howDidYouHear?.otherSource) && (
                          <div style={fieldCardStyle}><span style={fieldLabelStyle}>Other Source</span><span style={fieldValueStyle}>{data.howDidYouHear?.otherSource || data.declarationConsent?.otherSource}</span></div>
                        )}
                        {(data?.howDidYouHear?.referralName || data?.declarationConsent?.howDidYouHear?.referralName) && (
                          <div style={fieldCardStyle}><span style={fieldLabelStyle}>Referred By</span><span style={fieldValueStyle}>{data.howDidYouHear?.referralName || data.declarationConsent?.howDidYouHear?.referralName}</span></div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: "20px", textAlign: "center", background: "linear-gradient(135deg, rgba(250,247,242,0.9), rgba(245,240,225,0.9))", borderRadius: "16px", padding: "16px", border: "1px solid rgba(200,182,166,0.3)" }}>
            <button
              onClick={() => (window.location.href = isNGO ? "/funding" : "/applications/funding")}
              style={{ padding: "12px 24px", background: "linear-gradient(135deg, #a67c52, #7d5a50)", color: "#faf7f2", border: "none", borderRadius: "10px", fontSize: "clamp(13px, 1.8vw, 15px)", fontWeight: "600", cursor: "pointer", boxShadow: "0 8px 24px rgba(166,124,82,0.3)", minWidth: "180px" }}
            >
              {isNGO ? "🚀 Explore Funding & Grants" : "🚀 Go to Funding Application"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSummary