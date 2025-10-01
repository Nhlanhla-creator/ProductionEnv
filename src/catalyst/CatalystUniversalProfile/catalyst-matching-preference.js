"use client"
import React from "react"
import { useState } from "react"
import { ChevronDown, ChevronUp } from 'lucide-react'

// South African provinces array
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

// African countries array
const africanCountries = [
  { value: "algeria", label: "Algeria" },
  { value: "angola", label: "Angola" },
  { value: "benin", label: "Benin" },
  { value: "botswana", label: "Botswana" },
  { value: "burkina_faso", label: "Burkina Faso" },
  { value: "burundi", label: "Burundi" },
  { value: "cabo_verde", label: "Cabo Verde" },
  { value: "cameroon", label: "Cameroon" },
  { value: "central_african_republic", label: "Central African Republic" },
  { value: "chad", label: "Chad" },
  { value: "comoros", label: "Comoros" },
  { value: "congo", label: "Congo" },
  { value: "cote_d_ivoire", label: "Côte d'Ivoire" },
  { value: "djibouti", label: "Djibouti" },
  { value: "drc", label: "DR Congo" },
  { value: "egypt", label: "Egypt" },
  { value: "equatorial_guinea", label: "Equatorial Guinea" },
  { value: "eritrea", label: "Eritrea" },
  { value: "eswatini", label: "Eswatini" },
  { value: "ethiopia", label: "Ethiopia" },
  { value: "gabon", label: "Gabon" },
  { value: "gambia", label: "Gambia" },
  { value: "ghana", label: "Ghana" },
  { value: "guinea", label: "Guinea" },
  { value: "guinea_bissau", label: "Guinea-Bissau" },
  { value: "kenya", label: "Kenya" },
  { value: "lesotho", label: "Lesotho" },
  { value: "liberia", label: "Liberia" },
  { value: "libya", label: "Libya" },
  { value: "madagascar", label: "Madagascar" },
  { value: "malawi", label: "Malawi" },
  { value: "mali", label: "Mali" },
  { value: "mauritania", label: "Mauritania" },
  { value: "mauritius", label: "Mauritius" },
  { value: "morocco", label: "Morocco" },
  { value: "mozambique", label: "Mozambique" },
  { value: "namibia", label: "Namibia" },
  { value: "niger", label: "Niger" },
  { value: "nigeria", label: "Nigeria" },
  { value: "rwanda", label: "Rwanda" },
  { value: "sao_tome_and_principe", label: "São Tomé and Príncipe" },
  { value: "senegal", label: "Senegal" },
  { value: "seychelles", label: "Seychelles" },
  { value: "sierra_leone", label: "Sierra Leone" },
  { value: "somalia", label: "Somalia" },
  { value: "south_africa", label: "South Africa" },
  { value: "south_sudan", label: "South Sudan" },
  { value: "sudan", label: "Sudan" },
  { value: "tanzania", label: "Tanzania" },
  { value: "togo", label: "Togo" },
  { value: "tunisia", label: "Tunisia" },
  { value: "uganda", label: "Uganda" },
  { value: "zambia", label: "Zambia" },
  { value: "zimbabwe", label: "Zimbabwe" },
]

// Program Structure options
const programStructureOptions = [
  { value: "grant_based", label: "Grant-Based Program" },
  { value: "mentorship", label: "Mentorship Program" },
  { value: "training_education", label: "Training & Education" },
  { value: "incubator", label: "Incubator Program" },
  { value: "accelerator", label: "Accelerator Program" },
  { value: "hybrid", label: "Hybrid Program" },
]

// Program Stage options
const programStageOptions = [
   { value: "Startup", label: "Startup" },
  { value: "Growth", label: "Growth" },
  { value: "Scaling", label: "Scaling" },
  { value: "Turnaround", label: "Turnaround" },
  { value: "Mature", label: "Mature" },
  { value: "any_stage", label: "Any Stage" },
]

// Legal Entity Fit options
const legalEntityOptions = [
    { value: "(pty) Ltd", label: "(Pty) Ltd - Private Company" },
  { value: "Ltd", label: "Ltd - Public Company" },
  { value: "NPC", label: "NPC - Non-Profit Company" },
  { value: "Sole Proprietor", label: "Sole Proprietor" },
  { value: "Partnership", label: "Partnership" },
  { value: "CC", label: "CC - Close Corporation (Legacy)" },
  { value: "Trust", label: "Trust" },
  { value: "Cooperative", label: "Cooperative" },
  { value: "Joint Venture", label: "Joint Venture" },
  { value: "State Qwned", label: "State-Owned Enterprise" },
  { value: "any_entity", label: "Any Legal Entity" },
]


// Support Focus main categories
const supportFocusCategories = [
  { value: "funding", label: "Funding Support" },
  { value: "capacity_building", label: "Capacity Building" },
  { value: "market_access", label: "Market Access" },
  { value: "technology", label: "Technology & Innovation" },
  { value: "social_impact", label: "Social Impact" },
]

// Support Focus subtypes based on main category
const supportFocusSubtypes = {
  funding: [
    { value: "grants", label: "Grants (non-repayable funding)" },
    { value: "low_interest_loans", label: "Low-Interest Loans" },
    { value: "seed_funding", label: "Seed Funding" },
    { value: "crowdfunding_support", label: "Crowdfunding Support" },
  ],
  capacity_building: [
    { value: "skills_training", label: "Skills Training & Development" },
    { value: "business_mentorship", label: "Business Mentorship" },
    { value: "leadership_development", label: "Leadership Development" },
    { value: "financial_literacy", label: "Financial Literacy" },
  ],
  market_access: [
    { value: "networking", label: "Networking & Partnerships" },
    { value: "market_linkages", label: "Market Linkages" },
    { value: "trade_facilitation", label: "Trade Facilitation" },
    { value: "export_support", label: "Export Support" },
  ],
  technology: [
    { value: "digital_tools", label: "Digital Tools & Platforms" },
    { value: "tech_training", label: "Technology Training" },
    { value: "innovation_labs", label: "Innovation Labs" },
    { value: "research_development", label: "Research & Development" },
  ],
  social_impact: [
    { value: "community_development", label: "Community Development" },
    { value: "environmental_programs", label: "Environmental Programs" },
    { value: "youth_development", label: "Youth Development" },
    { value: "women_empowerment", label: "Women Empowerment" },
  ],
}

// Sector Focus options
const sectorFocusOptions = [
  { value: "generalist", label: "Generalist" },
  { value: "accounting_finance", label: "Accounting / Finance" },
  { value: "advertising_marketing_pr", label: "Advertising / Marketing / PR" },
  { value: "agriculture_forestry_fishing", label: "Agriculture / Forestry / Fishing" },
  { value: "automotive_motor_industry", label: "Automotive / Motor Industry" },
  { value: "banking_insurance_investments", label: "Banking / Insurance / Investments" },
  { value: "call_centre_customer_service", label: "Call Centre / Customer Service" },
  { value: "construction_building_civils", label: "Construction / Building / Civils" },
  { value: "consulting_business_services", label: "Consulting / Business Services" },
  { value: "education_training_teaching", label: "Education / Training / Teaching" },
  { value: "engineering", label: "Engineering (Civil, Mechanical, Electrical,)" },
  { value: "government_public_sector", label: "Government / Public Sector" },
  { value: "healthcare_nursing_medical", label: "Healthcare / Nursing / Medical" },
  { value: "hospitality_hotel_catering", label: "Hospitality / Hotel / Catering" },
  { value: "human_resources_recruitment", label: "Human Resources / Recruitment" },
  { value: "ict_information_technology", label: "ICT / Information Technology" },
  { value: "legal_law", label: "Legal / Law" },
  { value: "logistics_transport_supply_chain", label: "Logistics / Transport / Supply Chain" },
  { value: "manufacturing_production", label: "Manufacturing / Production" },
  { value: "media_journalism_publishing", label: "Media / Journalism / Publishing" },
  { value: "mining_energy_oil_gas", label: "Mining / Energy / Oil & Gas" },
  { value: "ngo_nonprofit_community", label: "NGO / Non-Profit / Community Services" },
  { value: "real_estate_property", label: "Real Estate / Property" },
  { value: "retail_wholesale_sales", label: "Retail / Wholesale / Sales" },
  { value: "science_research_development", label: "Science / Research / Development" },
  { value: "security_emergency_services", label: "Security / Emergency Services" },
  { value: "telecommunications", label: "Telecommunications" },
  { value: "tourism_travel_leisure", label: "Tourism / Travel / Leisure" },
  { value: "trades_artisans_technical", label: "Trades / Artisans / Technical" },
  { value: "arts", label: "Arts/ Entertainment" },
]

// Geographic Focus options
const geographicFocusOptions = [
  { value: "global", label: "Global" },
  { value: "regional_na", label: "Regional (NA)" },
  { value: "regional_emea", label: "Regional (EMEA)" },
  { value: "regional_apac", label: "Regional (APAC)" },
  { value: "country_specific", label: "Country-specific" },
  { value: "province_specific", label: "Province Specific" },
]

// Target Demographics options
const targetDemographicsOptions = [
  { value: "youth", label: "Youth (18-35)" },
  { value: "women", label: "Women Entrepreneurs" },
  { value: "rural_communities", label: "Rural Communities" },
  { value: "previously_disadvantaged", label: "Previously Disadvantaged Individuals" },
  { value: "disabled_entrepreneurs", label: "Entrepreneurs with Disabilities" },
  { value: "first_time_entrepreneurs", label: "First-time Entrepreneurs" },
  { value: "experienced_entrepreneurs", label: "Experienced Entrepreneurs" },
  { value: "social_entrepreneurs", label: "Social Entrepreneurs" },
]

// MultiSelect component for dropdown selections
function MultiSelect({ options, selected, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdown = () => setIsOpen(!isOpen)
  const closeDropdown = () => setIsOpen(false)

  const handleSelect = (value) => {
    const newSelected = selected.includes(value) 
      ? selected.filter((item) => item !== value) 
      : [...selected, value]
    onChange(newSelected)
  }

  const getSelectedLabels = () => {
    return options.filter((option) => selected.includes(option.value)).map((option) => option.label)
  }

  const displaySelectedItems = () => {
    const labels = getSelectedLabels()
    if (labels.length <= 2) {
      return labels.map((label) => (
        <span
          key={label}
          style={{
            backgroundColor: "#F8E1B7",
            color: "#8b4513",
            fontSize: "12px",
            padding: "2px 6px",
            borderRadius: "4px",
            marginRight: "4px",
          }}
        >
          {label}
        </span>
      ))
    } else {
      return (
        <>
          <span
            style={{
              backgroundColor: "#DCA06D",
              color: "#8b4513",
              fontSize: "12px",
              padding: "2px 6px",
              borderRadius: "4px",
              marginRight: "4px",
            }}
          >
            {labels[0]}
          </span>
          <span
            style={{
              backgroundColor: "#DCA06D",
              color: "#8b4513",
              fontSize: "12px",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            {`+${labels.length - 1} more`}
          </span>
        </>
      )
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={toggleDropdown}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          border: "1px solid #d2b48c",
          borderRadius: "6px",
          backgroundColor: "white",
          cursor: "pointer",
          minHeight: "42px",
        }}
      >
        {selected.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
            {displaySelectedItems()}
          </div>
        ) : (
          <span style={{ color: "#a0826d" }}>{`Select ${label}`}</span>
        )}
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #d2b48c",
            borderTop: "none",
            borderRadius: "0 0 6px 6px",
            zIndex: 1000,
            boxShadow: "0 4px 6px -1px rgba(139, 69, 19, 0.1)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "250px",
          }}
        >
          <div
            style={{
              flex: "1",
              overflowY: "auto",
              maxHeight: "200px",
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 12px",
                  cursor: "pointer",
                  backgroundColor: selected.includes(option.value) ? "#f5e6d3" : "white",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f4e8")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = selected.includes(option.value) ? "#f5e6d3" : "white")
                }
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => {}}
                  style={{ marginRight: "8px", accentColor: "#8b4513" }}
                />
                <span style={{ fontSize: "14px", color: "#5d4037" }}>{option.label}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              borderTop: "1px solid #d2b48c",
              padding: "8px",
              backgroundColor: "#faf8f5",
              borderRadius: "0 0 6px 6px",
            }}
          >
            <button
              type="button"
              onClick={closeDropdown}
              style={{
                backgroundColor: "#8b4513",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "6px 16px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CatalystMatchingPreference({
  data = {},
  updateData = () => {},
}) {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleSupportFocusChange = (e) => {
    const { value } = e.target
    updateData({
      supportFocus: value,
      supportFocusSubtype: "", // Reset subtype when main type changes
    })
  }

  const handleMultiSelectChange = (field, value) => {
    updateData({ [field]: value })
  }

  // Get subtype options based on selected support focus
  const getSupportFocusSubtypes = () => {
    if (!data.supportFocus) return []
    return supportFocusSubtypes[data.supportFocus] || []
  }

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d2b48c",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "white",
  }

  const labelStyle = {
    display: "block",
    fontWeight: "500",
    color: "#5d4037",
    marginBottom: "8px",
    fontSize: "14px",
  }

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#5d4037", marginBottom: "24px" }}>
        General Matching Preferences
      </h2>

      {/* Row 1: Program Structure and Legal Entity Fit */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Program Structure */}
        <div>
          <label style={labelStyle}>Program Structure</label>
          <select
            name="programStructure"
            value={data.programStructure || ""}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">Select Program Structure</option>
            {programStructureOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Legal Entity Fit */}
        <div>
          <label style={labelStyle}>Legal Entity Fit</label>
          <select name="legalEntityFit" value={data.legalEntityFit || ""} onChange={handleChange} style={inputStyle}>
            <option value="">Select Legal Entity</option>
            {legalEntityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Program Stage, Support Focus, Support Focus Subtype */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Program Stage */}
        <div>
          <label style={labelStyle}>Program Stage</label>
          <select name="programStage" value={data.programStage || ""} onChange={handleChange} style={inputStyle}>
            <option value="">Select Program Stage</option>
            {programStageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Support Focus */}
        <div>
          <label style={labelStyle}>Support Focus</label>
          <select
            name="supportFocus"
            value={data.supportFocus || ""}
            onChange={handleSupportFocusChange}
            style={inputStyle}
          >
            <option value="">Select Support Focus</option>
            {supportFocusCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Support Focus Subtype */}
        <div>
          <label style={labelStyle}>Support Focus Subtype</label>
          <select
            name="supportFocusSubtype"
            value={data.supportFocusSubtype || ""}
            onChange={handleChange}
            style={inputStyle}
            disabled={!data.supportFocus}
          >
            <option value="">{data.supportFocus ? "Select Support Focus Subtype" : "Select Support Focus first"}</option>
            {getSupportFocusSubtypes().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Remaining fields in 2-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Sector Focus */}
        <div>
          <label style={labelStyle}>Sector Focus</label>
          <MultiSelect
            options={sectorFocusOptions}
            selected={data.sectorFocus || []}
            onChange={(value) => handleMultiSelectChange("sectorFocus", value)}
            label="Sectors"
          />
        </div>

        {/* Sector Exclusions */}
        <div>
          <label style={labelStyle}>Sector Exclusions</label>
          <MultiSelect
            options={sectorFocusOptions}
            selected={data.sectorExclusions || []}
            onChange={(value) => handleMultiSelectChange("sectorExclusions", value)}
            label="Excluded Sectors"
          />
        </div>

        {/* Geographic Focus */}
        <div>
          <label style={labelStyle}>Geographic Focus</label>
          <MultiSelect
            options={geographicFocusOptions}
            selected={data.geographicFocus || []}
            onChange={(value) => handleMultiSelectChange("geographicFocus", value)}
            label="Geographic Areas"
          />
          {/* Conditional dropdowns based on geographic focus selection */}
          {(data.geographicFocus || []).includes("province_specific") && (
            <div style={{ marginTop: "12px" }}>
              <label style={labelStyle}>South African Provinces</label>
              <MultiSelect
                options={saProvinces}
                selected={data.selectedProvinces || []}
                onChange={(value) => handleMultiSelectChange("selectedProvinces", value)}
                label="Provinces"
              />
            </div>
          )}
          {(data.geographicFocus || []).includes("country_specific") && (
            <div style={{ marginTop: "12px" }}>
              <label style={labelStyle}>African Countries</label>
              <MultiSelect
                options={africanCountries}
                selected={data.selectedCountries || []}
                onChange={(value) => handleMultiSelectChange("selectedCountries", value)}
                label="Countries"
              />
            </div>
          )}
        </div>

        {/* Target Demographics */}
        <div>
          <label style={labelStyle}>Target Demographics</label>
          <MultiSelect
            options={targetDemographicsOptions}
            selected={data.targetDemographics || []}
            onChange={(value) => handleMultiSelectChange("targetDemographics", value)}
            label="Demographics"
          />
        </div>
      </div>
    </div>
  )
}