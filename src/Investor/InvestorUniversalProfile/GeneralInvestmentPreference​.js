"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

// South African provinces array
const saProvinces = [
  { value: "Gauteng", label: "Gauteng" },
  { value: "Western Cape", label: "Western Cape" },
  { value: "Eastern Cape", label: "Eastern Cape" },
  { value: "KwaZulu-Natal", label: "KwaZulu-Natal" },
  { value: "Free State", label: "Free State" },
  { value: "North West", label: "North West" },
  { value: "Mpumalanga", label: "Mpumalanga" },
  { value: "Limpopo", label: "Limpopo" },
  { value: "Northern Cape", label: "Northern Cape" },
]

// African countries array
const africanCountries = [
  { value: "Algeria", label: "Algeria" },
  { value: "Angola", label: "Angola" },
  { value: "Benin", label: "Benin" },
  { value: "Botswana", label: "Botswana" },
  { value: "Burkina Faso", label: "Burkina Faso" },
  { value: "Burundi", label: "Burundi" },
  { value: "Cabo Verde", label: "Cabo Verde" },
  { value: "Cameroon", label: "Cameroon" },
  { value: "Central African Republic", label: "Central African Republic" },
  { value: "Chad", label: "Chad" },
  { value: "Comoros", label: "Comoros" },
  { value: "Congo", label: "Congo" },
  { value: "Côte d'Ivoire", label: "Côte d'Ivoire" },
  { value: "Djibouti", label: "Djibouti" },
  { value: "DR Congo", label: "DR Congo" },
  { value: "Egypt", label: "Egypt" },
  { value: "Equatorial Guinea", label: "Equatorial Guinea" },
  { value: "Eritrea", label: "Eritrea" },
  { value: "Eswatini", label: "Eswatini" },
  { value: "Ethiopia", label: "Ethiopia" },
  { value: "Gabon", label: "Gabon" },
  { value: "Gambia", label: "Gambia" },
  { value: "Ghana", label: "Ghana" },
  { value: "Guinea", label: "Guinea" },
  { value: "Guinea-Bissau", label: "Guinea-Bissau" },
  { value: "Kenya", label: "Kenya" },
  { value: "Lesotho", label: "Lesotho" },
  { value: "Liberia", label: "Liberia" },
  { value: "Libya", label: "Libya" },
  { value: "Madagascar", label: "Madagascar" },
  { value: "Malawi", label: "Malawi" },
  { value: "Mali", label: "Mali" },
  { value: "Mauritania", label: "Mauritania" },
  { value: "Mauritius", label: "Mauritius" },
  { value: "Morocco", label: "Morocco" },
  { value: "Mozambique", label: "Mozambique" },
  { value: "Namibia", label: "Namibia" },
  { value: "Niger", label: "Niger" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "Rwanda", label: "Rwanda" },
  { value: "São Tomé and Príncipe", label: "São Tomé and Príncipe" },
  { value: "Senegal", label: "Senegal" },
  { value: "Seychelles", label: "Seychelles" },
  { value: "Sierra Leone", label: "Sierra Leone" },
  { value: "Somalia", label: "Somalia" },
  { value: "South Africa", label: "South Africa" },
  { value: "South Sudan", label: "South Sudan" },
  { value: "Sudan", label: "Sudan" },
  { value: "Tanzania", label: "Tanzania" },
  { value: "Togo", label: "Togo" },
  { value: "Tunisia", label: "Tunisia" },
  { value: "Uganda", label: "Uganda" },
  { value: "Zambia", label: "Zambia" },
  { value: "Zimbabwe", label: "Zimbabwe" },
]

// Fund Structure options
const fundStructureOptions = [
  { value: "Closed-end Fund", label: "Closed-end Fund" },
  { value: "Open-end Fund", label: "Open-end Fund" },
  { value: "Evergreen Fund", label: "Evergreen Fund" },
  { value: "Hybrid Structure", label: "Hybrid Structure" },
]

// Investment Stage options (now for multi-select)
const investmentStageOptions = [
  { value: "Pre-seed", label: "Pre-seed" },
  { value: "Seed", label: "Seed" },
  { value: "Series A", label: "Series A" },
  { value: "Series B", label: "Series B" },
  { value: "Series C+", label: "Series C+" },
  { value: "Growth/PE", label: "Growth/PE" },
  { value: "MBO", label: "MBO" },
  { value: "MBI", label: "MBI" },
  { value: "LBO", label: "LBO" },
]

// Legal Entity Fit options
const legalEntityOptions = [
  { value: "(Pty) Ltd", label: "(Pty) Ltd - Private Company" },
  { value: "NPC", label: "NPC - non-profit company" },
]

// Investment Focus main categories - NOW MULTI-SELECT
const investmentFocusCategories = [
  { value: "Equity", label: "Equity" },
  { value: "Debt", label: "Debt" },
  { value: "Hybrid/Structured Instruments", label: "Hybrid/Structured Instruments" },
  { value: "Secondary Market Strategies", label: "Secondary Market Strategies" },
  { value: "Special Strategies", label: "Special Strategies" },
  { value: "Grants", label: "Grants" },
]

// Investment Focus subtypes based on main category - UPDATED WITH GRANTS
const investmentFocusSubtypes = {
  Equity: [
    { value: "Common Equity", label: "Common Equity (standard shares, voting rights)" },
    { value: "Preferred Equity", label: "Preferred Equity (liquidation preference, dividends)" },
    { value: "Growth Equity", label: "Growth Equity (minority stakes in mature companies)" },
  ],
  Debt: [
    { value: "Senior Debt", label: "Senior Debt (first lien, lowest risk)" },
    { value: "Subordinated Debt", label: "Subordinated Debt (higher risk, unsecured)" },
    { value: "Mezzanine Financing", label: "Mezzanine Financing (hybrid debt/equity, warrants)" },
    { value: "Convertible Notes", label: "Convertible Notes (debt → equity conversion)" },
  ],
  "Hybrid/Structured Instruments": [
    { value: "SAFE/ASA", label: "SAFE/ASA (future equity, no debt terms)" },
    {
      value: "Convertible Preferred Stock",
      label: "Convertible Preferred Stock (combines equity + convertible features)",
    },
    { value: "Warrants/Options", label: "Warrants/Options (rights to purchase equity later)" },
  ],
  "Secondary Market Strategies": [
    { value: "Secondary Purchases", label: "Secondary Purchases (buying existing LP/stakeholder shares)" },
    { value: "GP-Led Continuation Funds", label: "GP-Led Continuation Funds (PE restructuring)" },
  ],
  "Special Strategies": [
    { value: "Infrastructure - Greenfield", label: "Infrastructure - Greenfield" },
    { value: "Infrastructure - Brownfield", label: "Infrastructure - Brownfield" },
    { value: "Distressed Debt", label: "Distressed Debt (non-performing loans, turnarounds)" },
    { value: "Real Assets", label: "Real Assets (real estate, commodities)" },
    { value: "Venture Debt", label: "Venture Debt (loans to startups)" },
  ],
  Grants: [
    { value: "Seed / Startup Grants", label: "Seed / Startup Grants" },
    { value: "Growth / Expansion Grants", label: "Growth / Expansion Grants" },
    { value: "R&D / Innovation Grants", label: "R&D / Innovation Grants" },
    { value: "Impact / Social Grants", label: "Impact / Social Grants" },
    { value: "Capacity building/skills grants", label: "Capacity building/skills grants" },
    { value: "Rescue/turnaround grants", label: "Rescue/turnaround grants" },
  ],
}

// Updated Sector Focus options with your specific list
const sectorFocusOptions = [
  { value: "Sin Sectors", label: "Sin Sectors" },
  { value: "Social & Ethical Controversy Sectors", label: "Social & Ethical Controversy Sectors" },
  { value: "ESG Restricted Sectors", label: "ESG Restricted Sectors" },
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

// UPDATED Sector Exclusions options
const sectorExclusionsOptions = [
  { value: "Sin Sectors", label: "Sin Sectors" },
  { value: "Social & Ethical Controversy Sectors", label: "Social & Ethical Controversy Sectors" },
  { value: "ESG Restricted Sectors", label: "ESG Restricted Sectors" },
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

// Geographic Focus options
const geographicFocusOptions = [
  { value: "Global", label: "Global" },
  { value: "Regional (NA)", label: "Regional (NA)" },
  { value: "Regional (EMEA)", label: "Regional (EMEA)" },
  { value: "Regional (APAC)", label: "Regional (APAC)" },
  { value: "Country-specific", label: "Country-specific" },
  { value: "Province Specific", label: "Province Specific" },
]

// Risk Appetite options
const riskAppetiteOptions = [
  { value: "Core (Low Risk)", label: "Core (Low Risk)" },
  { value: "Value-Add (Moderate)", label: "Value-Add (Moderate)" },
  { value: "Opportunistic (High)", label: "Opportunistic (High)" },
]

// MultiSelect component for dropdown selections
function MultiSelect({ options, selected, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false)

  // Ensure selected is always an array
  const selectedArray = Array.isArray(selected) ? selected : selected ? [selected] : []

  const toggleDropdown = () => setIsOpen(!isOpen)
  const closeDropdown = () => setIsOpen(false)

  const handleSelect = (value) => {
    const newSelected = selectedArray.includes(value)
      ? selectedArray.filter((item) => item !== value)
      : [...selectedArray, value]
    onChange(newSelected)
  }

  const getSelectedLabels = () => {
    return options.filter((option) => selectedArray.includes(option.value)).map((option) => option.label)
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
            +{labels.length - 1} more
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
        {selectedArray.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>{displaySelectedItems()}</div>
        ) : (
          <span style={{ color: "#a0826d" }}>Select {label}</span>
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
                  backgroundColor: selectedArray.includes(option.value) ? "#f5e6d3" : "white",
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#f8f4e8")}
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = selectedArray.includes(option.value) ? "#f5e6d3" : "white")
                }
              >
                <input
                  type="checkbox"
                  checked={selectedArray.includes(option.value)}
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

export default function InvestmentTargets({ data = {}, updateData }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleMultiSelectChange = (field, value) => {
    updateData({ [field]: value })
  }

  // UPDATED: Get available subtype options based on selected investment focus categories
  const getAvailableInvestmentFocusSubtypes = () => {
    const selectedFocusAreas = data.investmentFocus || []
    if (!Array.isArray(selectedFocusAreas) || selectedFocusAreas.length === 0) return []
    
    // Combine all subtypes from selected focus areas
    let allSubtypes = []
    selectedFocusAreas.forEach(focusArea => {
      if (investmentFocusSubtypes[focusArea]) {
        allSubtypes = [...allSubtypes, ...investmentFocusSubtypes[focusArea]]
      }
    })
    
    return allSubtypes
  }

  // UPDATED: Handle investment focus change and reset subtypes if needed
  const handleInvestmentFocusChange = (selectedValues) => {
    const currentSubtypes = Array.isArray(data.investmentFocusSubtype) 
      ? data.investmentFocusSubtype 
      : []
    const availableSubtypes = []
    
    // Get all available subtypes for the newly selected focus areas
    selectedValues.forEach(focusArea => {
      if (investmentFocusSubtypes[focusArea]) {
        availableSubtypes.push(...investmentFocusSubtypes[focusArea].map(sub => sub.value))
      }
    })
    
    // Filter out any selected subtypes that are no longer available
    const filteredSubtypes = currentSubtypes.filter(subtype => 
      availableSubtypes.includes(subtype)
    )
    
    updateData({
      investmentFocus: selectedValues,
      investmentFocusSubtype: filteredSubtypes
    })
  }

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d2b48c",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "white",
    focusBorderColor: "#8b4513",
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
        General Investment Preference
      </h2>

      {/* Row 1: Fund Structure and Legal Entity Fit */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        {/* Fund Structure */}
        <div>
          <label style={labelStyle}>Fund Structure</label>
          <select name="fundStructure" value={data.fundStructure || ""} onChange={handleChange} style={inputStyle}>
            <option value="">Select Fund Structure</option>
            {fundStructureOptions.map((option) => (
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

      {/* Row 2: Investment Stage, Investment Focus, Investment Focus Subtype */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        {/* Investment Stage - Multi-Select */}
        <div>
          <label style={labelStyle}>Investment Stage</label>
          <MultiSelect
            options={investmentStageOptions}
            selected={data.investmentStage || []}
            onChange={(value) => handleMultiSelectChange("investmentStage", value)}
            label="Investment Stages"
          />
        </div>

        {/* UPDATED: Investment Focus - NOW MULTI-SELECT */}
        <div>
          <label style={labelStyle}>Funding Instrument Preferred</label>
          <MultiSelect
            options={investmentFocusCategories}
            selected={data.investmentFocus || []}
            onChange={handleInvestmentFocusChange}
            label="Investment Focus Areas"
          />
        </div>

        {/* UPDATED: Investment Focus Subtype - Multi-Select with dynamic options */}
        <div>
          <label style={labelStyle}>Funding Instrument Preferred Subtype</label>
          <MultiSelect
            options={getAvailableInvestmentFocusSubtypes()}
            selected={data.investmentFocusSubtype || []}
            onChange={(value) => handleMultiSelectChange("investmentFocusSubtype", value)}
            label="Focus Subtypes"
          />
        </div>
      </div>

      {/* Remaining fields in 2-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
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

        {/* UPDATED: Sector Exclusions with new options */}
        <div>
          <label style={labelStyle}>Sector Exclusions</label>
          <MultiSelect
            options={sectorExclusionsOptions}
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
          {(data.geographicFocus || []).includes("Province Specific") && (
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

          {(data.geographicFocus || []).includes("Country-specific") && (
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

        {/* Risk Appetite */}
        <div>
          <label style={labelStyle}>Risk Appetite (Optional)</label>
          <select name="riskAppetite" value={data.riskAppetite || ""} onChange={handleChange} style={inputStyle}>
            <option value="">Select Risk Appetite</option>
            {riskAppetiteOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}