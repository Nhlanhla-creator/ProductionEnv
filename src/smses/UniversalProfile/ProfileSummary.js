"use client"
import { useState } from "react"
import {
  ChevronDown, ChevronUp, Edit, FileText, ExternalLink, Building, Users, Mail,
  Shield, Package, MessageCircle, CheckSquare, Linkedin, DollarSign, FileCheck,
  Target, AlertTriangle, Phone, MapPin, Award, Clock, Layers, Truck, Briefcase,
  TrendingUp, Star,
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
    if (typeof value === "object") return "Not provided"
    try {
      return String(value).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    } catch {
      return "Not provided"
    }
  }

  const formatDate = (value) => {
    if (!value) return "Not provided"
    if (typeof value === "object") return "Not provided"
    try {
      const date = new Date(value)
      if (isNaN(date.getTime())) return value
      return date.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
    } catch {
      return "Not provided"
    }
  }

  const renderDocumentLink = (url, label = "View Document") => {
    if (!url) return "No document uploaded"
    if (typeof url !== "string") return "Invalid document"
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
    if (typeof url !== "string") return "Not provided"
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

  // ── Products & Services Section ──────────────────────────────────────────
  // Renders BOTH the modern `offerings` array (from products-services.js v1)
  // AND the legacy productCategories/serviceCategories shape for compat.
  const renderProductsServices = () => {
    const ps = data?.productsServices || {}

    const getOfferingTypeLabel = () => {
      const type = ps.offeringType
      if (type === "products") return "Products only"
      if (type === "services") return "Services only"
      if (type === "both") return "Both products and services"
      return "Not specified"
    }

    // ── NEW: render modern offerings array ──
    const renderOfferingCard = (offering, idx) => (
      <div key={offering.id || idx} style={{ ...fieldCardStyle, marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "15px", fontWeight: "600", color: "#4a352f", display: "flex", alignItems: "center", gap: "8px" }}>
              {offering.isPrimary && <Star size={14} fill="#8B4513" color="#8B4513" />}
              {offering.name || "Untitled offering"}
            </div>
            {offering.breadcrumb && (
              <div style={{ fontSize: "12px", color: "#7d5a50", marginTop: "3px" }}>{offering.breadcrumb}</div>
            )}
            {!offering.breadcrumb && offering.customCategoryRequest && (
              <div style={{ fontSize: "12px", color: "#92400e", marginTop: "3px", fontStyle: "italic" }}>
                Category pending review: "{offering.customCategoryRequest}"
              </div>
            )}
          </div>
        </div>
        {offering.description && (
          <p style={{ fontSize: "13px", color: "#4a352f", margin: "6px 0 10px", lineHeight: 1.5 }}>{offering.description}</p>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", fontSize: "12px" }}>
          {offering.deliveryRole?.length > 0 && (
            <div>
              <div style={{ fontSize: "10px", fontWeight: "600", color: "#7d5a50", textTransform: "uppercase", marginBottom: "2px" }}>Delivery Model</div>
              <div style={{ color: "#4a352f" }}>{offering.deliveryRole.join(" • ")}</div>
            </div>
          )}
          {offering.industries?.length > 0 && (
            <div>
              <div style={{ fontSize: "10px", fontWeight: "600", color: "#7d5a50", textTransform: "uppercase", marginBottom: "2px" }}>Industries Served</div>
              <div style={{ color: "#4a352f" }}>{offering.industries.join(" • ")}</div>
            </div>
          )}
          {offering.geographicCoverage?.length > 0 && (
            <div>
              <div style={{ fontSize: "10px", fontWeight: "600", color: "#7d5a50", textTransform: "uppercase", marginBottom: "2px" }}>Geographic Coverage</div>
              <div style={{ color: "#4a352f" }}>{offering.geographicCoverage.join(" • ")}</div>
            </div>
          )}
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
          {products.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>
                <Layers size={16} style={{ display: "inline", marginRight: "8px" }} /> Products ({products.length})
              </h3>
              {products.map(renderOfferingCard)}
            </div>
          )}
          {services.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>
                <Briefcase size={16} style={{ display: "inline", marginRight: "8px" }} /> Services ({services.length})
              </h3>
              {services.map(renderOfferingCard)}
            </div>
          )}
        </>
      )
    }

    // ── LEGACY: still render old structure if present ──
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
                    ? category.categories.map((c) => formatLabel(c)).join(" • ")
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
                    ? category.categories.map((c) => formatLabel(c)).join(" • ")
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
                <span style={fieldValueStyle}>{deliveryModes.map((m) => formatLabel(m)).join(" • ")}</span>
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
            <div
              style={{
                ...fieldCardStyle,
                marginBottom: "16px",
                background: totalRevenuePercent > 100 ? "rgba(207, 19, 34, 0.05)" : "rgba(56, 158, 13, 0.05)",
                border: `1px solid ${totalRevenuePercent > 100 ? "#ffccc7" : "#b7eb8f"}`,
              }}
            >
              <span style={fieldLabelStyle}>Revenue Allocation</span>
              <span style={{
                fontSize: "14px",
                fontWeight: "600",
                color: totalRevenuePercent > 100 ? "#cf1322" : "#389e0d",
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
                  <span style={fieldLabelStyle}>Type</span>
                  <span style={fieldValueStyle}>{client.clientType || "Not provided"}</span>
                </div>
                <div>
                  <span style={fieldLabelStyle}>Contact</span>
                  <span style={fieldValueStyle}>{client.contactNumber || "Not provided"}</span>
                </div>
                <div>
                  <span style={fieldLabelStyle}>% of Revenue</span>
                  <span style={fieldValueStyle}>{client.revenuePercentage ? `${client.revenuePercentage}%` : "Not provided"}</span>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={fieldLabelStyle}>Industries</span>
                  <span style={fieldValueStyle}>
                    {client.industries?.length > 0
                      ? client.industries.map((i) => formatLabel(i)).join(" • ")
                      : "Not specified"}
                  </span>
                </div>
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

            <div style={{ marginTop: "16px" }}>
              {renderOfferings()}
              {renderProductCategories()}
              {renderServiceCategories()}
              {renderDeliveryStandards()}
              {renderTargetMarket()}
              {renderKeyClients()}
            </div>
          </div>
        )}
      </div>
    )
  }

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

            <div style={fieldCardStyle}>
              <span style={fieldLabelStyle}><AlertTriangle size={12} /> Pending Legal Judgments</span>
              <span style={fieldValueStyle}>{legal.pendingLegalJudgments || "Not provided"}</span>
              {legal.pendingLegalJudgments === "Yes" && legal.pendingLegalJudgmentsDetails && (
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

  // ── Ownership & Management Section ───────────────────────────────────────
  const renderOwnershipManagement = () => {
    const om = data?.ownershipManagement || {}

    const renderShareholders = () => {
      const shareholders = om.shareholders || []
      if (shareholders.length === 0) return null
      return (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>Shareholders</h3>
          <div style={{ ...fieldCardStyle, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                  {["Name", "Country", "Shareholding", "Issued Shares", "Race", "Gender", "DOA", "Youth", "Disabled", "Also Director"].map((h) => (
                    <th key={h} style={{ padding: "8px 6px", textAlign: "left", fontSize: "10px", fontWeight: "700", color: "#7d5a50", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shareholders.map((sh, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e6d7c3" }}>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontWeight: "500", fontSize: "12px" }}>{sh.name || "Not provided"}</td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>{sh.country || "Not provided"}</td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontWeight: "600", fontSize: "12px" }}>{sh.shareholding || "0"}%</td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>{sh.issuedShares || "0"}</td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>{sh.race || "Not provided"}</td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>{sh.gender || "Not provided"}</td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>{formatDate(sh.doa)}</td>
                    <td style={{ padding: "8px 6px", fontSize: "12px" }}>{formatBoolean(sh.isYouth)}</td>
                    <td style={{ padding: "8px 6px", fontSize: "12px" }}>{formatBoolean(sh.isDisabled)}</td>
                    <td style={{ padding: "8px 6px", fontSize: "12px" }}>{formatBoolean(sh.isAlsoDirector)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    const renderBusinessLeadership = () => {
      const bl = om.businessLeadership || {}
      const hasValues = Object.values(bl).some((v) => v)
      if (!hasValues) return null

      const labels = {
        ownerLed: "Owner-Led",
        primaryMotivation: "Primary Motivation",
        growthAmbition: "Growth Ambition",
        founderFullTime: "Founder Full-Time",
        opennessToAdvice: "Openness to Advice",
        decisionGovernance: "Decision Governance",
      }

      return (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>Business Leadership – Profile Assessment</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
            {Object.entries(bl).map(([key, value]) => {
              if (!value) return null
              return (
                <div key={key} style={{ padding: "10px 14px", background: "rgba(166,124,82,0.05)", borderRadius: "8px", border: "1px solid rgba(200,182,166,0.2)" }}>
                  <span style={{ fontSize: "10px", fontWeight: "600", color: "#7d5a50", display: "block", marginBottom: "2px", textTransform: "uppercase" }}>{labels[key] || key}</span>
                  <span style={{ fontSize: "13px", color: "#4a352f", fontWeight: "500" }}>{formatLabel(value)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    const renderDirectors = () => {
      const directors = om.directors || []
      if (directors.length === 0) return null
      return (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>Directors</h3>
          <div style={{ ...fieldCardStyle, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                  {["Name", "Roles", "Nationality", "DOA", "Committee", "Exec/Non-Exec", "Race", "Gender", "LinkedIn & CV", "Youth", "Disabled"].map((h) => (
                    <th key={h} style={{ padding: "8px 6px", textAlign: "left", fontSize: "10px", fontWeight: "700", color: "#7d5a50", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {directors.map((d, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e6d7c3" }}>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontWeight: "500", fontSize: "12px" }}>
                      {d.name || "Not provided"}
                      {d.linkedShareholderId !== null && <span style={{ marginLeft: "4px", fontSize: "10px", color: "#3b82f6" }}>🔗</span>}
                    </td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "11px" }}>
                      {(d.roles || []).map((r) => r === "Other" ? (d.customRole || "Other") : r).join(", ") || "Not provided"}
                    </td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>{d.nationality || "Not provided"}</td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>{formatDate(d.doa)}</td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "11px" }}>
                      {(d.committeeMembership || []).map((c) => c === "Other" ? (d.customCommittee || "Other") : c).join(", ") || "None"}
                    </td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>{d.execType || "Not provided"}</td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>{d.race || "Not provided"}</td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>{d.gender || "Not provided"}</td>
                    <td style={{ padding: "8px 6px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {d.linkedin ? renderLinkedInLink(d.linkedin) : "No LinkedIn"}
                        {d.cv ? renderDocumentLink(d.cv.url, "CV") : "No CV"}
                      </div>
                    </td>
                    <td style={{ padding: "8px 6px", fontSize: "12px" }}>{formatBoolean(d.isYouth)}</td>
                    <td style={{ padding: "8px 6px", fontSize: "12px" }}>{formatBoolean(d.isDisabled)}</td>
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
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>Executive Management</h3>
          <div style={{ ...fieldCardStyle, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                  {["Name", "Position", "Nationality", "DOA", "Race", "Gender", "Youth", "Disabled"].map((h) => (
                    <th key={h} style={{ padding: "8px 6px", textAlign: "left", fontSize: "10px", fontWeight: "700", color: "#7d5a50", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {executives.map((ex, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e6d7c3" }}>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontWeight: "500", fontSize: "12px" }}>{ex.name || "Not provided"}</td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>
                      {ex.position === "Other" ? (ex.customPosition || "Other") : (ex.position || "Not provided")}
                    </td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>{ex.nationality || "Not provided"}</td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>{formatDate(ex.doa)}</td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>{ex.race || "Not provided"}</td>
                    <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>{ex.gender || "Not provided"}</td>
                    <td style={{ padding: "8px 6px", fontSize: "12px" }}>{formatBoolean(ex.isYouth)}</td>
                    <td style={{ padding: "8px 6px", fontSize: "12px" }}>{formatBoolean(ex.isDisabled)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    const renderInterests = () => {
      const active = om.activeInterests || []
      const previous = om.previousInterests || []
      if (active.length === 0 && previous.length === 0) return null

      const renderInterestTable = (title, interests) => {
        if (interests.length === 0) return null
        return (
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#5c3a1e", marginBottom: "8px" }}>{title}</h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #d6c4a8" }}>
                <thead>
                  <tr style={{ backgroundColor: "#5c3a1e" }}>
                    {["Assigned To", "Company Name", "Registration No.", "Business Status"].map((h) => (
                      <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "#ffffff", fontWeight: "600", fontSize: "10px", borderBottom: "2px solid #3d2b1f" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {interests.map((interest, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e0d5c0" }}>
                      <td style={{ padding: "6px 10px", color: "#4a352f" }}>{interest.assignedTo || "Unassigned"}</td>
                      <td style={{ padding: "6px 10px", color: "#4a352f" }}>{interest.companyName || "Not provided"}</td>
                      <td style={{ padding: "6px 10px", color: "#4a352f" }}>{interest.registrationNo || "Not provided"}</td>
                      <td style={{ padding: "6px 10px", color: "#4a352f" }}>{interest.businessStatus || "Not provided"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      return (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>Interests Declaration</h3>
          {renderInterestTable("Active Interests", active)}
          {renderInterestTable("Previous Interests", previous)}
        </div>
      )
    }

    const renderEmployees = () => {
      const employees = om.employees || []
      const hasEmployeeCount = om.permanentEmployees || om.contractEmployees || om.internshipEmployees || om.temporaryEmployees

      return (
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>Employee Qualification & Clearance</h3>

          {hasEmployeeCount && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
              {om.permanentEmployees && <div style={fieldCardStyle}><span style={fieldLabelStyle}>Permanent</span><span style={fieldValueStyle}>{om.permanentEmployees}</span></div>}
              {om.contractEmployees && <div style={fieldCardStyle}><span style={fieldLabelStyle}>Contract</span><span style={fieldValueStyle}>{om.contractEmployees}</span></div>}
              {om.internshipEmployees && <div style={fieldCardStyle}><span style={fieldLabelStyle}>Internship</span><span style={fieldValueStyle}>{om.internshipEmployees}</span></div>}
              {om.temporaryEmployees && <div style={fieldCardStyle}><span style={fieldLabelStyle}>Temporary</span><span style={fieldValueStyle}>{om.temporaryEmployees}</span></div>}
            </div>
          )}

          {employees.length > 0 && (
            <div style={{ ...fieldCardStyle, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #c8b6a6" }}>
                    {["Employee Name", "Certification Compulsory?", "Qualification", "Role"].map((h) => (
                      <th key={h} style={{ padding: "8px 6px", textAlign: "left", fontSize: "10px", fontWeight: "700", color: "#7d5a50", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #e6d7c3" }}>
                      <td style={{ padding: "8px 6px", color: "#4a352f", fontWeight: "500", fontSize: "12px" }}>{emp.name || "Not provided"}</td>
                      <td style={{ padding: "8px 6px", fontSize: "12px" }}>{emp.isCertificationCompulsory === "yes" ? "✅ Yes" : "❌ No"}</td>
                      <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>
                        {emp.isCertificationCompulsory === "yes" ? (emp.qualification || "Not provided") : "N/A"}
                      </td>
                      <td style={{ padding: "8px 6px", color: "#4a352f", fontSize: "12px" }}>
                        {emp.role === "Other" ? (emp.customRole || "Other") : (emp.role || "Not provided")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!hasEmployeeCount && employees.length === 0 && (
            <div style={{ textAlign: "center", color: "#7d5a50", padding: "16px", fontSize: "13px" }}>
              No employee information provided.
            </div>
          )}
        </div>
      )
    }

    return (
      <div style={sectionCardStyle}>
        {renderSectionHeader("ownershipManagement", Users, "Ownership & Management")}
        {expandedSections.ownershipManagement && (
          <div style={sectionContentStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>Total Authorised Shares</span>
                <span style={fieldValueStyle}>{om.totalAuthorisedShares || om.totalShares || "Not provided"}</span>
              </div>
              <div style={fieldCardStyle}>
                <span style={fieldLabelStyle}>Total Issued Shares</span>
                <span style={fieldValueStyle}>{om.totalIssuedShares || "Not provided"}</span>
              </div>
            </div>

            {renderShareholders()}
            {renderBusinessLeadership()}
            {renderDirectors()}
            {renderExecutives()}
            {renderInterests()}
            {renderEmployees()}
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
            {/* Entity Overview */}
            <div style={sectionCardStyle}>
              {renderSectionHeader("entityOverview", Building, "Entity Overview")}
              {expandedSections.entityOverview && (
                <div style={sectionContentStyle}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Registered Name</span><span style={fieldValueStyle}>{data?.entityOverview?.registeredName || "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Trading Name</span><span style={fieldValueStyle}>{data?.entityOverview?.tradingName || "Same as registered name"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Registration Number</span><span style={fieldValueStyle}>{data?.entityOverview?.registrationNumber || "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Entity Type</span><span style={fieldValueStyle}>{data?.entityOverview?.entityType || "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Legal Structure</span><span style={fieldValueStyle}>{data?.entityOverview?.legalStructure || "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Entity Size</span><span style={fieldValueStyle}>{data?.entityOverview?.entitySize || "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Financial Year End</span><span style={fieldValueStyle}>{data?.entityOverview?.financialYearEnd || "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Years in Operation</span><span style={fieldValueStyle}>{data?.entityOverview?.yearsInOperation || "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Operation Stage</span><span style={fieldValueStyle}>{data?.entityOverview?.operationStage || "Not provided"}</span></div>
                    <div style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>Economic Sectors</span>
                      <span style={fieldValueStyle}>
                        {data?.entityOverview?.economicSectors?.length > 0
                          ? data.entityOverview.economicSectors.map((s) => formatLabel(s)).join(" • ")
                          : "Not provided"}
                      </span>
                    </div>
                    <div style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>Countries of Operation</span>
                      <span style={fieldValueStyle}>
                        {data?.entityOverview?.operatingCountries?.length > 0
                          ? data.entityOverview.operatingCountries.map((c) => formatLabel(c)).join(" • ")
                          : "Not provided"}
                      </span>
                    </div>
                    {data?.entityOverview?.operatingCountries?.includes("South Africa") && data?.entityOverview?.operatingProvinces?.length > 0 && (
                      <div style={fieldCardStyle}>
                        <span style={fieldLabelStyle}>Provinces (SA)</span>
                        <span style={fieldValueStyle}>{data.entityOverview.operatingProvinces.map((p) => formatLabel(p)).join(" • ")}</span>
                      </div>
                    )}
                    <div style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>Member of Industry Association</span>
                      <span style={fieldValueStyle}>{data?.entityOverview?.memberOfAssociation === "yes" ? "✅ Yes" : "❌ No"}</span>
                    </div>
                  </div>
                  <div style={{ background: "rgba(166, 124, 82, 0.1)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(166, 124, 82, 0.2)", marginTop: "16px" }}>
                    <span style={{ ...fieldLabelStyle, fontWeight: "700" }}>Business Description</span>
                    <p style={{ fontSize: "14px", color: "#4a352f", lineHeight: "1.6", margin: 0 }}>{data?.entityOverview?.businessDescription || "Not provided"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Products & Services */}
            {renderProductsServices()}

            {/* Ownership & Management */}
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
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>A. Financial Performance</h3>

                  <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#5c3a1e", marginBottom: "8px", marginTop: "12px" }}>Income Statement</h4>
                  <div style={{ ...fieldCardStyle, overflowX: "auto", marginBottom: "16px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #c8b6a6", backgroundColor: "#5c3a1e" }}>
                          <th style={{ padding: "8px 10px", textAlign: "left", color: "#ffffff", fontWeight: "600", fontSize: "10px" }}>Line Item</th>
                          <th style={{ padding: "8px 10px", textAlign: "right", color: "#ffffff", fontWeight: "600", fontSize: "10px" }}>Current Value</th>
                          <th style={{ padding: "8px 10px", textAlign: "right", color: "#ffffff", fontWeight: "600", fontSize: "10px" }}>Previous Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "Currency", current: data?.financialOverview?.incomeCurrency || "ZAR", previous: "" },
                          { label: "Turnover / Revenue", current: data?.financialOverview?.incomeTurnoverCurrent, previous: data?.financialOverview?.incomeTurnoverPrevious },
                          { label: "Cost of Goods Sold", current: data?.financialOverview?.incomeCOGSCurrent, previous: data?.financialOverview?.incomeCOGSPrevious },
                          { label: "Gross Profit", current: data?.financialOverview?.incomeGrossProfitCurrent, previous: data?.financialOverview?.incomeGrossProfitPrevious, highlight: true },
                          { label: "Operating Profit", current: data?.financialOverview?.incomeOperatingProfitCurrent, previous: data?.financialOverview?.incomeOperatingProfitPrevious },
                          { label: "Net Profit", current: data?.financialOverview?.incomeNetProfitCurrent, previous: data?.financialOverview?.incomeNetProfitPrevious, highlight: true },
                        ].map((row, idx) => {
                          if (!row.current && !row.previous && row.label !== "Currency") return null
                          return (
                            <tr key={idx} style={{ borderBottom: "1px solid #e6d7c3", backgroundColor: row.highlight ? "#f9f7f3" : "transparent" }}>
                              <td style={{ padding: "6px 10px", fontWeight: row.highlight ? "600" : "400", color: "#4a352f" }}>{row.label}</td>
                              <td style={{ padding: "6px 10px", textAlign: "right", color: "#4a352f" }}>{row.current || (row.label === "Currency" ? "ZAR" : "Not provided")}</td>
                              <td style={{ padding: "6px 10px", textAlign: "right", color: "#4a352f" }}>{row.previous || (row.label === "Currency" ? "" : "Not provided")}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#5c3a1e", marginBottom: "8px", marginTop: "12px" }}>Balance Sheet</h4>
                  <div style={{ ...fieldCardStyle, overflowX: "auto", marginBottom: "16px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #c8b6a6", backgroundColor: "#5c3a1e" }}>
                          <th style={{ padding: "8px 10px", textAlign: "left", color: "#ffffff", fontWeight: "600", fontSize: "10px" }}>Line Item</th>
                          <th style={{ padding: "8px 10px", textAlign: "right", color: "#ffffff", fontWeight: "600", fontSize: "10px" }}>Current Value</th>
                          <th style={{ padding: "8px 10px", textAlign: "right", color: "#ffffff", fontWeight: "600", fontSize: "10px" }}>Previous Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "Current Assets", current: data?.financialOverview?.balanceCurrentAssetsCurrent, previous: data?.financialOverview?.balanceCurrentAssetsPrevious },
                          { label: "Total Assets", current: data?.financialOverview?.balanceTotalAssetsCurrent, previous: data?.financialOverview?.balanceTotalAssetsPrevious, highlight: true },
                          { label: "Current Liabilities", current: data?.financialOverview?.balanceCurrentLiabilitiesCurrent, previous: data?.financialOverview?.balanceCurrentLiabilitiesPrevious },
                          { label: "Long Term Liabilities", current: data?.financialOverview?.balanceLongTermLiabilitiesCurrent, previous: data?.financialOverview?.balanceLongTermLiabilitiesPrevious },
                          { label: "Equity", current: data?.financialOverview?.balanceEquityCurrent, previous: data?.financialOverview?.balanceEquityPrevious },
                          { label: "Total Liabilities", current: data?.financialOverview?.balanceTotalLiabilitiesCurrent, previous: data?.financialOverview?.balanceTotalLiabilitiesPrevious, highlight: true },
                        ].map((row, idx) => {
                          if (!row.current && !row.previous) return null
                          return (
                            <tr key={idx} style={{ borderBottom: "1px solid #e6d7c3", backgroundColor: row.highlight ? "#f9f7f3" : "transparent" }}>
                              <td style={{ padding: "6px 10px", fontWeight: row.highlight ? "600" : "400", color: "#4a352f" }}>{row.label}</td>
                              <td style={{ padding: "6px 10px", textAlign: "right", color: "#4a352f" }}>{row.current || "Not provided"}</td>
                              <td style={{ padding: "6px 10px", textAlign: "right", color: "#4a352f" }}>{row.previous || "Not provided"}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px", marginTop: "20px" }}>B. Financial Management & Systems</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Books Up to Date</span><span style={fieldValueStyle}>{formatLabel(data?.financialOverview?.booksUpToDate)}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Management Accounts</span><span style={fieldValueStyle}>{formatLabel(data?.financialOverview?.hasManagementAccounts)}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Accounting Software</span><span style={fieldValueStyle}>{formatLabel(data?.financialOverview?.hasAccountingSoftware)}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Insured</span><span style={fieldValueStyle}>{data?.financialOverview?.isInsured === "yes" ? "✅ Yes" : data?.financialOverview?.isInsured === "no" ? "❌ No" : "Not provided"}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Financial Statements</span><span style={fieldValueStyle}>{formatLabel(data?.financialOverview?.hasFinancialStatements)}</span></div>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Financials Audited</span><span style={fieldValueStyle}>{formatLabel(data?.financialOverview?.financialsAudited)}</span></div>
                  </div>

                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px", marginTop: "20px" }}>C. Support Intent</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                    <div style={fieldCardStyle}><span style={fieldLabelStyle}>Seeking Funding</span><span style={fieldValueStyle}>{formatLabel(data?.financialOverview?.seekingFunding)}</span></div>
                    <div style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>Support Type Needed</span>
                      <span style={fieldValueStyle}>
                        {data?.financialOverview?.supportTypeNeeded?.length > 0
                          ? data?.financialOverview?.supportTypeNeeded.map((s) => formatLabel(s)).join(" • ")
                          : "None"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Operations Overview */}
            <div style={sectionCardStyle}>
              {renderSectionHeader("operationsOverview", FileCheck, "Operations Overview")}
              {expandedSections.operationsOverview && (
                <div style={sectionContentStyle}>
                  <p style={{ fontSize: "14px", color: "#7d5a50", marginBottom: "20px", fontWeight: "500", fontStyle: "italic" }}>BIG Score – Operational Strength (Risk-Based Yes/No Model)</p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                    {[
                      { q: "Q1. Multiple Key Suppliers", key: "multipleSuppliers" },
                      { q: "Q2. Documented Contingency Plan", key: "contingencyPlan" },
                      { q: "Q3. Track Performance Metrics", key: "trackPerformanceMetrics" },
                      { q: "Q4. 3+ Successful Deliveries", key: "threeSuccessfulDeliveries" },
                      { q: "Q5. Capacity to Increase Output", key: "hasCapacityToIncrease" },
                      { q: "Q6. Formal Safety/Compliance", key: "hasFormalProcedures" },
                      { q: "Q7. Major Incidents (24 months)", key: "hasMajorIncidents" },
                    ].map(({ q, key }) => {
                      const v = data?.operationsOverview?.[key]
                      return (
                        <div key={key} style={fieldCardStyle}>
                          <span style={fieldLabelStyle}>{q}</span>
                          <span style={fieldValueStyle}>{v === "yes" ? "✅ Yes" : v === "no" ? "❌ No" : "Not answered"}</span>
                        </div>
                      )
                    })}
                  </div>

                  {data?.operationsOverview?.operationalChallenges && (
                    <>
                      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginTop: "24px", marginBottom: "12px" }}>Operational Challenges</h3>
                      <div style={{ background: "rgba(166,124,82,0.1)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(166,124,82,0.2)" }}>
                        <p style={{ fontSize: "14px", color: "#4a352f", lineHeight: "1.6", margin: 0 }}>{data.operationsOverview.operationalChallenges}</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Governance */}
            <div style={sectionCardStyle}>
              {renderSectionHeader("governance", FileCheck, "Governance")}
              {expandedSections.governance && (
                <div style={sectionContentStyle}>
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

                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px" }}>Conflict of Interest</h3>
                  <div style={fieldCardStyle}>
                    <span style={fieldLabelStyle}>Members Have Multiple Businesses</span>
                    <span style={fieldValueStyle}>{data?.governance?.membersHaveMultipleBusinesses || "Not specified"}</span>
                  </div>

                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "12px", marginTop: "24px" }}>Ethics Training</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                    <div style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>Ethics Training Frequency</span>
                      <span style={fieldValueStyle}>{data?.governance?.ethicsTrainingFrequency || "Not specified"}</span>
                    </div>
                    <div style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>Last Ethics Training Date</span>
                      <span style={fieldValueStyle}>{formatDate(data?.governance?.lastEthicsTrainingDate) || "Not specified"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {renderHowDidYouHear()}

            <div style={sectionCardStyle}>
              {renderSectionHeader("declarationConsent", CheckSquare, "Declaration & Consent")}
              {expandedSections.declarationConsent && (
                <div style={sectionContentStyle}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                    <div style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>Declaration of Accuracy</span>
                      <span style={fieldValueStyle}>{data?.declarationConsent?.accuracy ? "✅ Yes" : "❌ No"}</span>
                    </div>
                    <div style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>Consent for Data Processing</span>
                      <span style={fieldValueStyle}>{data?.declarationConsent?.dataProcessing ? "✅ Yes" : "❌ No"}</span>
                    </div>
                    <div style={fieldCardStyle}>
                      <span style={fieldLabelStyle}>Opt-in for Promotional Visibility</span>
                      <span style={fieldValueStyle}>{data?.declarationConsent?.termsConditions ? "✅ Yes" : "❌ No"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

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