// GeneralInvestmentPreference.js
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

// Investment Stage options
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

// Investment Focus main categories
const investmentFocusCategories = [
  { value: "Equity", label: "Equity" },
  { value: "Debt", label: "Debt" },
  { value: "Hybrid/Structured Instruments", label: "Hybrid/Structured Instruments" },
  { value: "Secondary Market Strategies", label: "Secondary Market Strategies" },
  { value: "Special Strategies", label: "Special Strategies" },
  { value: "Grants", label: "Grants" },
]

// Investment Focus subtypes
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
    { value: "Convertible Preferred Stock", label: "Convertible Preferred Stock (combines equity + convertible features)" },
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

// Sector Focus options
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

// Sector Exclusions options
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

// Exit Strategy options - NEW
const exitStrategyOptions = [
  { value: "IPO", label: "IPO (Initial Public Offering)" },
  { value: "Trade Sale", label: "Trade Sale (Strategic Acquisition)" },
  { value: "Secondary Sale", label: "Secondary Sale (to another investor)" },
  { value: "Management Buyback", label: "Management Buyback" },
  { value: "Dividend Recapitalization", label: "Dividend Recapitalization" },
  { value: "Write-off", label: "Write-off / Liquidation" },
]

// Expected Exit Timeline options - NEW
const exitTimelineOptions = [
  { value: "1-2 years", label: "1-2 years" },
  { value: "3-5 years", label: "3-5 years" },
  { value: "5-7 years", label: "5-7 years" },
  { value: "7-10 years", label: "7-10 years" },
  { value: "10+ years", label: "10+ years" },
]

// Expected Return Multiple options - NEW
const returnMultipleOptions = [
  { value: "1x - 1.5x", label: "1x - 1.5x (Capital preservation focus)" },
  { value: "1.5x - 2.5x", label: "1.5x - 2.5x (Moderate return focus)" },
  { value: "2.5x - 4x", label: "2.5x - 4x (Growth return focus)" },
  { value: "4x - 6x", label: "4x - 6x (High growth return focus)" },
  { value: "6x+", label: "6x+ (Venture/High risk focus)" },
]

// Target IRR options - NEW
const targetIRROptions = [
  { value: "<10%", label: "<10% (Capital preservation focus)" },
  { value: "10-15%", label: "10-15% (Balanced approach)" },
  { value: "15-20%", label: "15-20% (Growth focus)" },
  { value: "20-30%", label: "20-30% (Aggressive growth)" },
  { value: "30%+", label: "30%+ (Venture/High risk)" },
]

// Reinvestment Policy options - NEW
const reinvestmentPolicyOptions = [
  { value: "Always Reinvest", label: "Always Reinvest (All returns go back into portfolio)" },
  { value: "Partial Reinvest", label: "Partial Reinvest (Some returns distributed, some reinvested)" },
  { value: "Distribute All", label: "Distribute All (All returns distributed to investors)" },
  { value: "Case by Case", label: "Case by Case (Decided per investment)" },
]

// Portfolio Reinvestment options - NEW
const portfolioReinvestmentOptions = [
  { value: "Always", label: "Always (Always reinvest in new deals)" },
  { value: "Sometimes", label: "Sometimes (Selectively reinvest)" },
  { value: "Never", label: "Never (Returns are always distributed)" },
]

// MultiSelect component
function MultiSelect({ options, selected, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedArray = Array.isArray(selected) ? selected : selected ? [selected] : []

  const toggleDropdown = () => setIsOpen(!isOpen)
  const closeDropdown = () => setIsOpen(false)

  const handleSelect = (value) => {
    const newSelected = selectedArray.includes(value)
      ? selectedArray.filter((item) => item !== value)
      : [...selectedArray, value]
    onChange(newSelected)
  }

  const getSelectedLabels = () => options.filter((option) => selectedArray.includes(option.value)).map((option) => option.label)

  const displaySelectedItems = () => {
    const labels = getSelectedLabels()
    if (labels.length <= 2) {
      return labels.map((label) => (
        <span key={label} style={{ backgroundColor: "#F8E1B7", color: "#8b4513", fontSize: "12px", padding: "2px 6px", borderRadius: "4px", marginRight: "4px" }}>
          {label}
        </span>
      ))
    } else {
      return (
        <>
          <span style={{ backgroundColor: "#DCA06D", color: "#8b4513", fontSize: "12px", padding: "2px 6px", borderRadius: "4px", marginRight: "4px" }}>
            {labels[0]}
          </span>
          <span style={{ backgroundColor: "#DCA06D", color: "#8b4513", fontSize: "12px", padding: "2px 6px", borderRadius: "4px" }}>
            +{labels.length - 1} more
          </span>
        </>
      )
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <div onClick={toggleDropdown} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: "1px solid #d2b48c", borderRadius: "6px", backgroundColor: "white", cursor: "pointer", minHeight: "42px" }}>
        {selectedArray.length > 0 ? <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>{displaySelectedItems()}</div> : <span style={{ color: "#a0826d" }}>Select {label}</span>}
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>
      {isOpen && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "white", border: "1px solid #d2b48c", borderTop: "none", borderRadius: "0 0 6px 6px", zIndex: 1000, boxShadow: "0 4px 6px -1px rgba(139, 69, 19, 0.1)", display: "flex", flexDirection: "column", maxHeight: "250px" }}>
          <div style={{ flex: "1", overflowY: "auto", maxHeight: "200px" }}>
            {options.map((option) => (
              <div key={option.value} onClick={() => handleSelect(option.value)} style={{ display: "flex", alignItems: "center", padding: "8px 12px", cursor: "pointer", backgroundColor: selectedArray.includes(option.value) ? "#f5e6d3" : "white" }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#f8f4e8")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = selectedArray.includes(option.value) ? "#f5e6d3" : "white")}>
                <input type="checkbox" checked={selectedArray.includes(option.value)} onChange={() => {}} style={{ marginRight: "8px", accentColor: "#8b4513" }} />
                <span style={{ fontSize: "14px", color: "#5d4037" }}>{option.label}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #d2b48c", padding: "8px", backgroundColor: "#faf8f5", borderRadius: "0 0 6px 6px" }}>
            <button type="button" onClick={closeDropdown} style={{ backgroundColor: "#8b4513", color: "white", border: "none", borderRadius: "4px", padding: "6px 16px", fontSize: "12px", cursor: "pointer", fontWeight: "500" }}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GeneralInvestmentPreference({ data = {}, updateData }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleMultiSelectChange = (field, value) => {
    updateData({ [field]: value })
  }

  const getAvailableInvestmentFocusSubtypes = () => {
    const selectedFocusAreas = data.investmentFocus || []
    if (!Array.isArray(selectedFocusAreas) || selectedFocusAreas.length === 0) return []
    let allSubtypes = []
    selectedFocusAreas.forEach(focusArea => {
      if (investmentFocusSubtypes[focusArea]) {
        allSubtypes = [...allSubtypes, ...investmentFocusSubtypes[focusArea]]
      }
    })
    return allSubtypes
  }

  const handleInvestmentFocusChange = (selectedValues) => {
    const currentSubtypes = Array.isArray(data.investmentFocusSubtype) ? data.investmentFocusSubtype : []
    const availableSubtypes = []
    selectedValues.forEach(focusArea => {
      if (investmentFocusSubtypes[focusArea]) {
        availableSubtypes.push(...investmentFocusSubtypes[focusArea].map(sub => sub.value))
      }
    })
    const filteredSubtypes = currentSubtypes.filter(subtype => availableSubtypes.includes(subtype))
    updateData({ investmentFocus: selectedValues, investmentFocusSubtype: filteredSubtypes })
  }

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #d2b48c", borderRadius: "6px", fontSize: "14px", outline: "none", backgroundColor: "white" }
  const labelStyle = { display: "block", fontWeight: "500", color: "#5d4037", marginBottom: "8px", fontSize: "14px" }
  const sectionStyle = { marginBottom: "32px", padding: "24px", backgroundColor: "#fefcf8", borderRadius: "12px", border: "1px solid #e8d5c4" }
  const sectionTitleStyle = { fontSize: "18px", fontWeight: "bold", color: "#5d4037", marginBottom: "20px", paddingBottom: "12px", borderBottom: "2px solid #e8d5c4" }

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#5d4037", marginBottom: "24px" }}>General Investment Preference</h2>

      {/* Section 1: Basic Investment Preferences */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Investment Preferences</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          <div>
            <label style={labelStyle}>Fund Structure</label>
            <select name="fundStructure" value={data.fundStructure || ""} onChange={handleChange} style={inputStyle}>
              <option value="">Select Fund Structure</option>
              {fundStructureOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Legal Entity Fit</label>
            <select name="legalEntityFit" value={data.legalEntityFit || ""} onChange={handleChange} style={inputStyle}>
              <option value="">Select Legal Entity</option>
              {legalEntityOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          <div>
            <label style={labelStyle}>Investment Stage</label>
            <MultiSelect options={investmentStageOptions} selected={data.investmentStage || []} onChange={(value) => handleMultiSelectChange("investmentStage", value)} label="Investment Stages" />
          </div>
          <div>
            <label style={labelStyle}>Funding Instrument Preferred</label>
            <MultiSelect options={investmentFocusCategories} selected={data.investmentFocus || []} onChange={handleInvestmentFocusChange} label="Investment Focus Areas" />
          </div>
          <div>
            <label style={labelStyle}>Funding Instrument Preferred Subtype</label>
            <MultiSelect options={getAvailableInvestmentFocusSubtypes()} selected={data.investmentFocusSubtype || []} onChange={(value) => handleMultiSelectChange("investmentFocusSubtype", value)} label="Focus Subtypes" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <label style={labelStyle}>Sector Focus</label>
            <MultiSelect options={sectorFocusOptions} selected={data.sectorFocus || []} onChange={(value) => handleMultiSelectChange("sectorFocus", value)} label="Sectors" />
          </div>
          <div>
            <label style={labelStyle}>Sector Exclusions</label>
            <MultiSelect options={sectorExclusionsOptions} selected={data.sectorExclusions || []} onChange={(value) => handleMultiSelectChange("sectorExclusions", value)} label="Excluded Sectors" />
          </div>
          <div>
            <label style={labelStyle}>Geographic Focus</label>
            <MultiSelect options={geographicFocusOptions} selected={data.geographicFocus || []} onChange={(value) => handleMultiSelectChange("geographicFocus", value)} label="Geographic Areas" />
            {(data.geographicFocus || []).includes("Province Specific") && (
              <div style={{ marginTop: "12px" }}>
                <label style={labelStyle}>South African Provinces</label>
                <MultiSelect options={saProvinces} selected={data.selectedProvinces || []} onChange={(value) => handleMultiSelectChange("selectedProvinces", value)} label="Provinces" />
              </div>
            )}
            {(data.geographicFocus || []).includes("Country-specific") && (
              <div style={{ marginTop: "12px" }}>
                <label style={labelStyle}>African Countries</label>
                <MultiSelect options={africanCountries} selected={data.selectedCountries || []} onChange={(value) => handleMultiSelectChange("selectedCountries", value)} label="Countries" />
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Risk Appetite (Optional)</label>
            <select name="riskAppetite" value={data.riskAppetite || ""} onChange={handleChange} style={inputStyle}>
              <option value="">Select Risk Appetite</option>
              {riskAppetiteOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Exit Strategy & Liquidity Preferences - NEW */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Exit Strategy & Liquidity Preferences</h3>
        <p style={{ fontSize: "14px", color: "#8d6e63", marginBottom: "20px" }}>
          These preferences help us match you with appropriate investment opportunities and track exit performance.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          <div>
            <label style={labelStyle}>Preferred Exit Strategy</label>
            <MultiSelect options={exitStrategyOptions} selected={data.preferredExitStrategy || []} onChange={(value) => handleMultiSelectChange("preferredExitStrategy", value)} label="Exit Strategies" />
            <small style={{ color: "#a0826d", fontSize: "11px", display: "block", marginTop: "4px" }}>How do you typically realize returns on your investments?</small>
          </div>
          <div>
            <label style={labelStyle}>Expected Exit Timeline</label>
            <select name="expectedExitTimeline" value={data.expectedExitTimeline || ""} onChange={handleChange} style={inputStyle}>
              <option value="">Select Typical Exit Timeline</option>
              {exitTimelineOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
            <small style={{ color: "#a0826d", fontSize: "11px", display: "block", marginTop: "4px" }}>Average time from initial investment to exit</small>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          <div>
            <label style={labelStyle}>Expected Return Multiple</label>
            <select name="expectedReturnMultiple" value={data.expectedReturnMultiple || ""} onChange={handleChange} style={inputStyle}>
              <option value="">Select Expected Return Multiple</option>
              {returnMultipleOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
            <small style={{ color: "#a0826d", fontSize: "11px", display: "block", marginTop: "4px" }}>Target return on investment (x multiple)</small>
          </div>
          <div>
            <label style={labelStyle}>Target Internal Rate of Return (IRR)</label>
            <select name="targetIRR" value={data.targetIRR || ""} onChange={handleChange} style={inputStyle}>
              <option value="">Select Target IRR</option>
              {targetIRROptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
            <small style={{ color: "#a0826d", fontSize: "11px", display: "block", marginTop: "4px" }}>Annualized return target percentage</small>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <label style={labelStyle}>Reinvestment Policy</label>
            <select name="reinvestmentPolicy" value={data.reinvestmentPolicy || ""} onChange={handleChange} style={inputStyle}>
              <option value="">Select Reinvestment Policy</option>
              {reinvestmentPolicyOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
            <small style={{ color: "#a0826d", fontSize: "11px", display: "block", marginTop: "4px" }}>How are returns typically handled?</small>
          </div>
          <div>
            <label style={labelStyle}>Portfolio Reinvestment</label>
            <select name="portfolioReinvestment" value={data.portfolioReinvestment || ""} onChange={handleChange} style={inputStyle}>
              <option value="">Select Reinvestment Preference</option>
              {portfolioReinvestmentOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
            <small style={{ color: "#a0826d", fontSize: "11px", display: "block", marginTop: "4px" }}>Do you reinvest returns into new portfolio companies?</small>
          </div>
        </div>
      </div>

      {/* Section 3: Historical Exit Performance - NEW */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Historical Exit Performance</h3>
        <p style={{ fontSize: "14px", color: "#8d6e63", marginBottom: "20px" }}>
          Sharing your historical exit performance helps us provide better insights and benchmarking.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          <div>
            <label style={labelStyle}>Number of Exits to Date</label>
            <input type="number" name="numberOfExits" value={data.numberOfExits || ""} onChange={handleChange} placeholder="e.g., 5" style={inputStyle} />
            <small style={{ color: "#a0826d", fontSize: "11px", display: "block", marginTop: "4px" }}>Total number of successful exits from your portfolio</small>
          </div>
          <div>
            <label style={labelStyle}>Average Exit Multiple (Historical)</label>
            <input type="number" name="averageExitMultiple" value={data.averageExitMultiple || ""} onChange={handleChange} placeholder="e.g., 2.5" step="0.1" style={inputStyle} />
            <small style={{ color: "#a0826d", fontSize: "11px", display: "block", marginTop: "4px" }}>Average return multiple from past exits (x)</small>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <label style={labelStyle}>Average Time to Exit (Months)</label>
            <input type="number" name="averageTimeToExit" value={data.averageTimeToExit || ""} onChange={handleChange} placeholder="e.g., 48" style={inputStyle} />
            <small style={{ color: "#a0826d", fontSize: "11px", display: "block", marginTop: "4px" }}>Average months from first investment to exit</small>
          </div>
          <div>
            <label style={labelStyle}>Best Exit Multiple Achieved</label>
            <input type="number" name="bestExitMultiple" value={data.bestExitMultiple || ""} onChange={handleChange} placeholder="e.g., 5.2" step="0.1" style={inputStyle} />
            <small style={{ color: "#a0826d", fontSize: "11px", display: "block", marginTop: "4px" }}>Highest return multiple from any past exit</small>
          </div>
        </div>
      </div>

      {/* Section 4: Reinvestment History - NEW */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Reinvestment History</h3>
        <p style={{ fontSize: "14px", color: "#8d6e63", marginBottom: "20px" }}>
          Understanding your reinvestment patterns helps us track portfolio growth.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <label style={labelStyle}>Reinvestment Rate (%)</label>
            <input type="number" name="reinvestmentRate" value={data.reinvestmentRate || ""} onChange={handleChange} placeholder="e.g., 40" min="0" max="100" style={inputStyle} />
            <small style={{ color: "#a0826d", fontSize: "11px", display: "block", marginTop: "4px" }}>What percentage of returns do you typically reinvest?</small>
          </div>
          <div>
            <label style={labelStyle}>Number of Reinvestments Made</label>
            <input type="number" name="numberOfReinvestments" value={data.numberOfReinvestments || ""} onChange={handleChange} placeholder="e.g., 3" style={inputStyle} />
            <small style={{ color: "#a0826d", fontSize: "11px", display: "block", marginTop: "4px" }}>How many times have you reinvested returns into new deals?</small>
          </div>
        </div>
      </div>
    </div>
  )
}