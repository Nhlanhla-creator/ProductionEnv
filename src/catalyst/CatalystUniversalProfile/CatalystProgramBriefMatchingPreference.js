"use client"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

// ─── Option Lists ─────────────────────────────────────────────────────────────

const intangibleSupportOptions = [
  { value: "advisory_services", label: "Advisory Services", tooltip: "Strategic guidance and expert consultation" },
  { value: "mentorship", label: "Mentorship", tooltip: "One-on-one guidance from experienced professionals" },
  { value: "capacity_building", label: "Capacity Building", tooltip: "Skills development, training, and operational improvement" },
  { value: "networking", label: "Networking & Partnerships", tooltip: "Connections to potential partners, clients, and collaborators" },
  { value: "market_access", label: "Market Access", tooltip: "Connections, distribution channels, and market entry support" },
  { value: "technology", label: "Technology & Innovation", tooltip: "Tech infrastructure, digital tools, and innovation resources" },
  { value: "social_impact", label: "Social Impact Support", tooltip: "Support for community development and social responsibility" },
]

// Intangible Support Sub-types (dynamically based on main selection)
const intangibleSupportSubtypes = {
  advisory_services: [
    { value: "legal_advisory", label: "Legal Advisory" },
    { value: "financial_advisory", label: "Financial Advisory" },
    { value: "strategic_planning", label: "Strategic Planning" },
    { value: "hr_advisory", label: "HR Advisory" },
    { value: "it_advisory", label: "IT Advisory" },
    { value: "marketing_advisory", label: "Marketing Advisory" },
  ],
  mentorship: [
    { value: "one_on_one_mentorship", label: "One-on-One Mentorship" },
    { value: "group_mentorship", label: "Group Mentorship" },
    { value: "peer_mentorship", label: "Peer Mentorship" },
    { value: "executive_mentorship", label: "Executive Mentorship" },
  ],
  capacity_building: [
    { value: "leadership_training", label: "Leadership Training" },
    { value: "financial_literacy", label: "Financial Literacy" },
    { value: "digital_skills", label: "Digital Skills" },
    { value: "operations_management", label: "Operations Management" },
    { value: "sales_training", label: "Sales Training" },
    { value: "customer_service", label: "Customer Service" },
  ],
  networking: [
    { value: "industry_events", label: "Industry Events" },
    { value: "investor_connections", label: "Investor Connections" },
    { value: "corporate_partnerships", label: "Corporate Partnerships" },
    { value: "alumni_network", label: "Alumni Network" },
  ],
  market_access: [
    { value: "distribution_channels", label: "Distribution Channels" },
    { value: "supply_chain_integration", label: "Supply Chain Integration" },
    { value: "export_assistance", label: "Export Assistance" },
    { value: "government_tenders", label: "Government Tenders" },
  ],
  technology: [
    { value: "software_licenses", label: "Software Licenses" },
    { value: "hardware_provision", label: "Hardware Provision" },
    { value: "tech_infrastructure", label: "Tech Infrastructure" },
    { value: "digital_transformation", label: "Digital Transformation" },
  ],
  social_impact: [
    { value: "community_engagement", label: "Community Engagement" },
    { value: "social_impact_measurement", label: "Social Impact Measurement" },
    { value: "esg_compliance", label: "ESG Compliance" },
    { value: "b_corp_support", label: "B Corp Support" },
  ],
}

const fundingInstrumentOptions = [
  { value: "Any", label: "Any" },
  { value: "Equity", label: "Equity (Buying shares in the business)", tooltip: "Investor purchases ownership stake in your company in exchange for capital" },
  { value: "Debt", label: "Debt (Loan-based funding)", tooltip: "Borrowed money that must be repaid with interest over time" },
  { value: "Grants", label: "Grants (Non-repayable funding)", tooltip: "Funds provided by government or organizations that do not need to be repaid" },
  { value: "Convertible Notes", label: "Convertible Notes (Loan that can turn into shares)", tooltip: "Short-term debt that converts to equity during future financing round" },
  { value: "Revenue-based Financing", label: "Revenue-based Financing", tooltip: "Repayment tied to company's monthly revenue rather than fixed installments" },
  { value: "Hybrid/Structured Instruments", label: "Hybrid/Structured Instruments", tooltip: "Combination of debt and equity features tailored to specific needs" },
  { value: "Secondary Market Strategies", label: "Secondary Market Strategies", tooltip: "Investments in existing shares rather than new company equity" },
  { value: "Special Strategies", label: "Special Strategies", tooltip: "Customized or non-traditional funding approaches" },
  { value: "Other", label: "Other (please specify)" },
]

const businessStageOptions = [
  { value: "Pre-seed", label: "Pre-seed", tooltip: "Earliest stage: Idea development, prototypes, market validation" },
  { value: "Seed", label: "Seed", tooltip: "First equity funding: Complete product, initial customers" },
  { value: "Series A", label: "Series A", tooltip: "Scale proven products, optimize, grow customer base" },
  { value: "Series B", label: "Series B", tooltip: "Expand market reach, scale operations, meet demand" },
  { value: "Series C+", label: "Series C+", tooltip: "Dominate markets, acquire competitors, prepare for IPO" },
  { value: "Growth/PE", label: "Growth/PE", tooltip: "Private equity for mature companies: Expansion, restructuring" },
  { value: "MBO", label: "MBO", tooltip: "Management Buyout: Existing team buys the business" },
  { value: "MBI", label: "MBI", tooltip: "Management Buy-in: External team takes over business" },
  { value: "LBO", label: "LBO", tooltip: "Leveraged Buyout: Purchase financed mostly through debt" },
]

const demographicsOptions = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-Binary / Gender Non-Conforming" },
  { value: "youth_18_35", label: "Youth (18–35)" },
  { value: "persons_with_disability", label: "Persons with Disability" },
  { value: "hdi_black_african", label: "HDI – Black African" },
  { value: "hdi_coloured", label: "HDI – Coloured" },
  { value: "hdi_indian", label: "HDI – Indian/Asian" },
  { value: "white", label: "White" },
  { value: "previously_disadvantaged", label: "Previously Disadvantaged Individuals" },
  { value: "rural", label: "Rural Communities" },
]

const bbbeeOptions = [
  { value: "level_1", label: "Level 1" },
  { value: "level_2", label: "Level 2" },
  { value: "level_3", label: "Level 3" },
  { value: "level_4", label: "Level 4" },
  { value: "level_5", label: "Level 5" },
  { value: "level_6", label: "Level 6" },
  { value: "level_7", label: "Level 7" },
  { value: "level_8", label: "Level 8" },
  { value: "exempt", label: "Exempt Micro Enterprise" },
  { value: "non_compliant", label: "Non-Compliant" },
  { value: "any", label: "Any Level" },
]

const legalEntityOptions = [
  { value: "any", label: "Any Legal Entity" },
  { value: "pty_ltd", label: "(Pty) Ltd – Private Company" },
  { value: "ltd", label: "Ltd – Public Company" },
  { value: "npc", label: "NPC – Non-Profit Company" },
  { value: "sole_proprietor", label: "Sole Proprietor" },
  { value: "partnership", label: "Partnership" },
  { value: "cc", label: "CC – Close Corporation (Legacy)" },
  { value: "trust", label: "Trust" },
  { value: "cooperative", label: "Cooperative" },
  { value: "joint_venture", label: "Joint Venture" },
  { value: "state_owned", label: "State-Owned Enterprise" },
]

const sectorFocusOptions = [
  { value: "Generalist", label: "Generalist" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Automotive", label: "Automotive" },
  { value: "Banking, Finance & Insurance", label: "Banking, Finance & Insurance" },
  { value: "Beauty / Cosmetics / Personal Care", label: "Beauty / Cosmetics / Personal Care" },
  { value: "Construction", label: "Construction" },
  { value: "Consulting", label: "Consulting" },
  { value: "Creative Arts / Design", label: "Creative Arts / Design" },
  { value: "Customer Service", label: "Customer Service" },
  { value: "Education & Training", label: "Education & Training" },
  { value: "Engineering", label: "Engineering" },
  { value: "Environmental / Natural Sciences", label: "Environmental / Natural Sciences" },
  { value: "Government / Public Sector", label: "Government / Public Sector" },
  { value: "Healthcare / Medical", label: "Healthcare / Medical" },
  { value: "Hospitality / Tourism", label: "Hospitality / Tourism" },
  { value: "Human Resources", label: "Human Resources" },
  { value: "Information Technology (IT)", label: "Information Technology (IT)" },
  { value: "Infrastructure", label: "Infrastructure" },
  { value: "Legal / Law", label: "Legal / Law" },
  { value: "Logistics / Supply Chain", label: "Logistics / Supply Chain" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Marketing / Advertising / PR", label: "Marketing / Advertising / PR" },
  { value: "Media / Journalism / Broadcasting", label: "Media / Journalism / Broadcasting" },
  { value: "Mining", label: "Mining" },
  { value: "Energy", label: "Energy" },
  { value: "Oil & Gas", label: "Oil & Gas" },
  { value: "Non-Profit / NGO", label: "Non-Profit / NGO" },
  { value: "Property / Real Estate", label: "Property / Real Estate" },
  { value: "Retail / Wholesale", label: "Retail / Wholesale" },
  { value: "Safety & Security / Police / Defence", label: "Safety & Security / Police / Defence" },
  { value: "Sales", label: "Sales" },
  { value: "Science & Research", label: "Science & Research" },
  { value: "Social Services / Social Work", label: "Social Services / Social Work" },
  { value: "Sports / Recreation / Fitness", label: "Sports / Recreation / Fitness" },
  { value: "Telecommunications", label: "Telecommunications" },
  { value: "Transport", label: "Transport" },
  { value: "Utilities (Water, Electricity, Waste)", label: "Utilities (Water, Electricity, Waste)" },
]

const geographicFocusOptions = [
  { value: "global", label: "Global" },
  { value: "regional_na", label: "Regional (NA)" },
  { value: "regional_emea", label: "Regional (EMEA)" },
  { value: "regional_apac", label: "Regional (APAC)" },
  { value: "country_specific", label: "Country-Specific" },
  { value: "province_specific", label: "Province-Specific (SA)" },
]

const saProvinces = [
  { value: "gauteng", label: "Gauteng" },
  { value: "western_cape", label: "Western Cape" },
  { value: "eastern_cape", label: "Eastern Cape" },
  { value: "kwazulu_natal", label: "KwaZulu-Natal" },
  { value: "free_state", label: "Free State" },
  { value: "north_west", label: "North West" },
  { value: "mpumalanga", label: "Mpumalanga" },
  { value: "limpopo", label: "Limpopo" },
  { value: "northern_cape", label: "Northern Cape" },
]

const africanCountries = [
  { value: "algeria", label: "Algeria" }, { value: "angola", label: "Angola" },
  { value: "benin", label: "Benin" }, { value: "botswana", label: "Botswana" },
  { value: "burkina_faso", label: "Burkina Faso" }, { value: "burundi", label: "Burundi" },
  { value: "cameroon", label: "Cameroon" }, { value: "drc", label: "DR Congo" },
  { value: "egypt", label: "Egypt" }, { value: "ethiopia", label: "Ethiopia" },
  { value: "ghana", label: "Ghana" }, { value: "kenya", label: "Kenya" },
  { value: "lesotho", label: "Lesotho" }, { value: "madagascar", label: "Madagascar" },
  { value: "malawi", label: "Malawi" }, { value: "mauritius", label: "Mauritius" },
  { value: "morocco", label: "Morocco" }, { value: "mozambique", label: "Mozambique" },
  { value: "namibia", label: "Namibia" }, { value: "nigeria", label: "Nigeria" },
  { value: "rwanda", label: "Rwanda" }, { value: "senegal", label: "Senegal" },
  { value: "south_africa", label: "South Africa" }, { value: "tanzania", label: "Tanzania" },
  { value: "uganda", label: "Uganda" }, { value: "zambia", label: "Zambia" },
  { value: "zimbabwe", label: "Zimbabwe" },
]

// ─── Shared Styles ─────────────────────────────────────────────────────────────

const sectionBoxStyle = {
  backgroundColor: "#fdf8f3",
  border: "1px solid #e8d5bc",
  borderRadius: "10px",
  padding: "24px",
  marginBottom: "24px",
}

const sectionTitleStyle = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#6B3410",
  borderBottom: "2px solid #C19A6B",
  paddingBottom: "8px",
  marginBottom: "20px",
}

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #d2b48c",
  borderRadius: "6px",
  fontSize: "14px",
  outline: "none",
  backgroundColor: "white",
  fontFamily: "inherit",
  boxSizing: "border-box",
}

const selectStyle = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #d2b48c",
  borderRadius: "6px",
  fontSize: "14px",
  outline: "none",
  backgroundColor: "white",
  fontFamily: "inherit",
  boxSizing: "border-box",
  cursor: "pointer",
  appearance: "auto",
}

const labelStyle = {
  display: "block",
  fontWeight: "600",
  color: "#5d4037",
  marginBottom: "6px",
  fontSize: "14px",
}

// ─── MultiSelect ────────────────────────────────────────────────────

function MultiSelect({ options, selected = [], onChange, placeholder = "Select options...", includeSelectAll = true }) {
  const [isOpen, setIsOpen] = useState(false)
  const allSelected = selected.length === options.length

  const toggle = (value) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  const toggleAll = () => onChange(allSelected ? [] : options.map((o) => o.value))
  const getLabel = (value) => options.find((o) => o.value === value)?.label || value

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setIsOpen((p) => !p)}
        style={{
          ...inputStyle,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "4px",
          minHeight: "42px",
          cursor: "pointer",
          paddingRight: "32px",
          position: "relative",
        }}
      >
        {selected.length === 0 ? (
          <span style={{ color: "#a0826d", fontSize: "14px" }}>{placeholder}</span>
        ) : selected.length <= 3 ? (
          selected.map((val) => (
            <span key={val} style={{
              backgroundColor: "#f3ebe0", color: "#6b4c2a",
              border: "1px solid #d6c4a8", borderRadius: "12px",
              padding: "2px 10px", fontSize: "12px", fontWeight: "500",
            }}>
              {getLabel(val)}
            </span>
          ))
        ) : (
          <>
            {selected.slice(0, 2).map((val) => (
              <span key={val} style={{
                backgroundColor: "#f3ebe0", color: "#6b4c2a",
                border: "1px solid #d6c4a8", borderRadius: "12px",
                padding: "2px 10px", fontSize: "12px", fontWeight: "500",
              }}>
                {getLabel(val)}
              </span>
            ))}
            <span style={{
              backgroundColor: "#dca06d", color: "#fff",
              borderRadius: "12px", padding: "2px 10px", fontSize: "12px", fontWeight: "500",
            }}>
              +{selected.length - 2} more
            </span>
          </>
        )}
        <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#9c7a5a" }}>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {isOpen && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          backgroundColor: "white", border: "1px solid #d2b48c",
          borderRadius: "0 0 6px 6px", zIndex: 1000,
          boxShadow: "0 4px 12px rgba(139,69,19,0.1)",
          maxHeight: "260px", display: "flex", flexDirection: "column",
        }}>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {includeSelectAll && (
              <div
                onClick={toggleAll}
                style={{
                  padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                  backgroundColor: allSelected ? "#fdf6ee" : "white",
                  borderBottom: "1px solid #f0e6d6", fontWeight: "600", fontSize: "13px", color: "#8B4513",
                }}
              >
                <input type="checkbox" checked={allSelected} onChange={() => {}} style={{ accentColor: "#8b4513" }} />
                Select All
              </div>
            )}
            {options.map((option) => {
              const isSel = selected.includes(option.value)
              return (
                <div
                  key={option.value}
                  onClick={() => toggle(option.value)}
                  title={option.tooltip || ""}
                  style={{
                    padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                    backgroundColor: isSel ? "#fdf6ee" : "white", fontSize: "14px", color: "#5d4037",
                  }}
                  onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.backgroundColor = "#faf5ef" }}
                  onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.backgroundColor = "white" }}
                >
                  <input type="checkbox" checked={isSel} onChange={() => {}} style={{ accentColor: "#8b4513" }} />
                  {option.label}
                </div>
              )
            })}
          </div>
          <div style={{ padding: "8px", borderTop: "1px solid #d2b48c", backgroundColor: "#faf8f5" }}>
            <button type="button" onClick={() => setIsOpen(false)} style={{
              backgroundColor: "#8b4513", color: "white", border: "none",
              borderRadius: "4px", padding: "6px 16px", fontSize: "12px", cursor: "pointer", fontWeight: "500",
            }}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Currency formatter ────────────────────────────────────────────────────────

const formatRand = (val) => {
  const numeric = String(val).replace(/[^\d]/g, "")
  return numeric ? "R " + parseInt(numeric).toLocaleString("en-ZA") : ""
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CatalystProgramBriefMatchingPreference({ data = {}, updateData = () => {} }) {
  const h = (field, value) => updateData({ [field]: value })

  const isFundingSelected = data.fundingSupport === "yes"
  
  // Get available subtypes based on selected intangible support
  const getAvailableSubtypes = () => {
    if (!data.intangibleSupport || !intangibleSupportSubtypes[data.intangibleSupport]) {
      return []
    }
    return intangibleSupportSubtypes[data.intangibleSupport]
  }

  const showProvinces = (data.geographicFocus || []).includes("province_specific")
  const showCountries = (data.geographicFocus || []).includes("country_specific")

  return (
    <div style={{ padding: "24px", maxWidth: "1100px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#5d4037", marginBottom: "8px" }}>
        Program Brief &amp; Matching Preferences
      </h2>
      <p style={{ fontSize: "14px", color: "#9c7a5a", marginBottom: "28px" }}>
        Define your program details and matching preferences to ensure accurate pairing with suitable SMEs.
      </p>

      {/* ── Section 1: Program Details ──────────────────────────────────────── */}
      <div style={sectionBoxStyle}>
        <h3 style={sectionTitleStyle}>Section 1 — Program Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

          <div>
            <label style={labelStyle}>Program Name *</label>
            <input
              type="text"
              value={data.programName || ""}
              onChange={(e) => h("programName", e.target.value)}
              style={inputStyle}
              placeholder="e.g. Women in Tech Accelerator 2025"
            />
          </div>

          <div>
            <label style={labelStyle}>Program Website <span style={{ fontWeight: 400, color: "#9c7a5a" }}>(if applicable)</span></label>
            <input
              type="url"
              value={data.programWebsite || ""}
              onChange={(e) => h("programWebsite", e.target.value)}
              style={inputStyle}
              placeholder="https://yourprogram.co.za"
            />
          </div>

          <div>
            <label style={labelStyle}>Program Duration (years)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={data.programDuration || ""}
              onChange={(e) => h("programDuration", e.target.value)}
              style={inputStyle}
              placeholder="e.g. 2"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>About the Program</label>
            <textarea
              value={data.aboutProgram || ""}
              onChange={(e) => h("aboutProgram", e.target.value)}
              style={{ ...inputStyle, resize: "vertical" }}
              rows={3}
              placeholder="Briefly describe what this program does and who it supports..."
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Program Goals</label>
            <textarea
              value={data.programGoals || ""}
              onChange={(e) => h("programGoals", e.target.value)}
              style={{ ...inputStyle, resize: "vertical" }}
              rows={3}
              placeholder="What outcomes does this program aim to achieve?"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Support Framework &amp; Commitment</label>
            <textarea
              value={data.supportFramework || ""}
              onChange={(e) => h("supportFramework", e.target.value)}
              style={{ ...inputStyle, resize: "vertical" }}
              rows={3}
              placeholder="Describe how participants are supported and what commitment is required from them..."
            />
          </div>

        </div>
      </div>

      {/* ── Section 2: Support Focus ─────────────────────────────────────────── */}
      <div style={sectionBoxStyle}>
        <h3 style={sectionTitleStyle}>Section 2 — Support Focus</h3>
        
        {/* Row 1: Intangible Support, Intangible Support Sub-type, and Funding Support */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "20px" }}>
          <div>
            <label style={labelStyle}>Intangible Support</label>
            <select
              value={data.intangibleSupport || ""}
              onChange={(e) => {
                h("intangibleSupport", e.target.value)
                // Clear sub-type when main selection changes
                h("intangibleSupportSubtype", "")
              }}
              style={selectStyle}
            >
              <option value="">Select Intangible Support</option>
              {intangibleSupportOptions.map((opt) => (
                <option key={opt.value} value={opt.value} title={opt.tooltip || ""}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Intangible Support Sub-type</label>
            <select
              value={data.intangibleSupportSubtype || ""}
              onChange={(e) => h("intangibleSupportSubtype", e.target.value)}
              style={selectStyle}
              disabled={!data.intangibleSupport}
            >
              <option value="">
                {data.intangibleSupport ? "Select Sub-type" : "Select Intangible Support first"}
              </option>
              {getAvailableSubtypes().map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Funding Support</label>
            <select
              value={data.fundingSupport || ""}
              onChange={(e) => h("fundingSupport", e.target.value)}
              style={selectStyle}
            >
              <option value="">Select Funding Support</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        {/* Row 2: Instrument Fit, Ticket Size, and Revenue Threshold (only when Funding Support is Yes) */}
        {isFundingSelected && (
          <div style={{
            backgroundColor: "#fffbf5",
            border: "1px dashed #d2b48c",
            borderRadius: "8px",
            padding: "20px",
            marginTop: "8px"
          }}>
            <p style={{ fontSize: "13px", fontWeight: "600", color: "#8B4513", marginBottom: "16px" }}>
              💰 Funding Configuration
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
              
              {/* Instrument Fit */}
              <div>
                <label style={labelStyle}>Instrument Fit</label>
                <MultiSelect
                  options={fundingInstrumentOptions}
                  selected={data.fundingInstruments || []}
                  onChange={(val) => h("fundingInstruments", val)}
                  placeholder="Select funding instruments"
                  includeSelectAll={false}
                />
              </div>

              {/* Ticket Size */}
              <div>
                <label style={labelStyle}>Ticket Size (ZAR)</label>
                <input
                  type="text"
                  value={data.ticketSize || ""}
                  onChange={(e) => h("ticketSize", formatRand(e.target.value))}
                  style={inputStyle}
                  placeholder="R 100,000"
                />
              </div>

              {/* Revenue Threshold */}
              <div>
                <label style={labelStyle}>Revenue Threshold (ZAR)</label>
                <input
                  type="text"
                  value={data.revenueThreshold || ""}
                  onChange={(e) => h("revenueThreshold", formatRand(e.target.value))}
                  style={inputStyle}
                  placeholder="R 5,000,000"
                />
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Target Beneficiaries ─────────────────────────────────── */}
      <div style={sectionBoxStyle}>
        <h3 style={sectionTitleStyle}>Section 3 — Target Beneficiaries</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

          <div>
            <label style={labelStyle}>Demographics <span style={{ fontWeight: 400, color: "#9c7a5a" }}>(Gender, Ability, Age, HDI Ownership)</span></label>
            <MultiSelect
              options={demographicsOptions}
              selected={data.demographics || []}
              onChange={(val) => h("demographics", val)}
              placeholder="Select demographic targets..."
            />
          </div>

          <div>
            <label style={labelStyle}>B-BBEE Level</label>
            <MultiSelect
              options={bbbeeOptions}
              selected={data.bbbeeLevel || []}
              onChange={(val) => h("bbbeeLevel", val)}
              placeholder="Select B-BBEE level(s)..."
            />
          </div>

        </div>
      </div>

      {/* ── Section 4: General Preferences ──────────────────────────────────── */}
      <div style={sectionBoxStyle}>
        <h3 style={sectionTitleStyle}>Section 4 — General Preferences</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

          <div>
            <label style={labelStyle}>Legal Entity</label>
            <MultiSelect
              options={legalEntityOptions}
              selected={data.legalEntity || []}
              onChange={(val) => h("legalEntity", val)}
              placeholder="Select legal entity type(s)..."
            />
          </div>

          <div>
            <label style={labelStyle}>Business Lifecycle Stage</label>
            <MultiSelect
              options={businessStageOptions}
              selected={data.businessLifecycleStage || []}
              onChange={(val) => h("businessLifecycleStage", val)}
              placeholder="Select lifecycle stage(s)..."
            />
          </div>

          <div>
            <label style={labelStyle}>Sector Focus</label>
            <MultiSelect
              options={sectorFocusOptions}
              selected={data.sectorFocus || []}
              onChange={(val) => h("sectorFocus", val)}
              placeholder="Select sector(s)..."
            />
          </div>

          <div>
            <label style={labelStyle}>Sector Exclusions</label>
            <MultiSelect
              options={sectorFocusOptions}
              selected={data.sectorExclusions || []}
              onChange={(val) => h("sectorExclusions", val)}
              placeholder="Select excluded sector(s)..."
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Geographic Focus <span style={{ fontWeight: 400, color: "#9c7a5a" }}>(if country-specific, then country)</span></label>
            <MultiSelect
              options={geographicFocusOptions}
              selected={data.geographicFocus || []}
              onChange={(val) => h("geographicFocus", val)}
              placeholder="Select geographic focus..."
            />

            {showCountries && (
              <div style={{ marginTop: "12px" }}>
                <label style={{ ...labelStyle, fontWeight: "500", color: "#8B4513" }}>African Countries</label>
                <MultiSelect
                  options={africanCountries}
                  selected={data.selectedCountries || []}
                  onChange={(val) => h("selectedCountries", val)}
                  placeholder="Select countries..."
                />
              </div>
            )}

            {showProvinces && (
              <div style={{ marginTop: "12px" }}>
                <label style={{ ...labelStyle, fontWeight: "500", color: "#8B4513" }}>South African Provinces</label>
                <MultiSelect
                  options={saProvinces}
                  selected={data.selectedProvinces || []}
                  onChange={(val) => h("selectedProvinces", val)}
                  placeholder="Select provinces..."
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}