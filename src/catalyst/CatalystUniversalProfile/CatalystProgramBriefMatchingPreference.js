"use client"

import React, { useState } from "react"
import { ChevronDown, ChevronUp, Info, AlertCircle, CheckCircle, TrendingUp, Shield, Users, DollarSign, Briefcase, MapPin } from "lucide-react"

// ─── Option Lists (same as before) ─────────────────────────────────────────────

const intangibleSupportOptions = [
  { value: "advisory_services", label: "Advisory Services", tooltip: "Strategic guidance and expert consultation" },
  { value: "mentorship", label: "Mentorship", tooltip: "One-on-one guidance from experienced professionals" },
  { value: "capacity_building", label: "Capacity Building", tooltip: "Skills development, training, and operational improvement" },
  { value: "networking", label: "Networking & Partnerships", tooltip: "Connections to potential partners, clients, and collaborators" },
  { value: "market_access", label: "Market Access", tooltip: "Connections, distribution channels, and market entry support" },
  { value: "technology", label: "Technology & Innovation", tooltip: "Tech infrastructure, digital tools, and innovation resources" },
  { value: "social_impact", label: "Social Impact Support", tooltip: "Support for community development and social responsibility" },
]

const intangibleSupportSubtypes = {
  advisory_services: [
    { value: "legal_advisory", label: "Legal Advisory" }, { value: "financial_advisory", label: "Financial Advisory" },
    { value: "strategic_planning", label: "Strategic Planning" }, { value: "hr_advisory", label: "HR Advisory" },
    { value: "it_advisory", label: "IT Advisory" }, { value: "marketing_advisory", label: "Marketing Advisory" },
  ],
  mentorship: [
    { value: "one_on_one_mentorship", label: "One-on-One Mentorship" }, { value: "group_mentorship", label: "Group Mentorship" },
    { value: "peer_mentorship", label: "Peer Mentorship" }, { value: "executive_mentorship", label: "Executive Mentorship" },
  ],
  capacity_building: [
    { value: "leadership_training", label: "Leadership Training" }, { value: "financial_literacy", label: "Financial Literacy" },
    { value: "digital_skills", label: "Digital Skills" }, { value: "operations_management", label: "Operations Management" },
    { value: "sales_training", label: "Sales Training" }, { value: "customer_service", label: "Customer Service" },
  ],
  networking: [
    { value: "industry_events", label: "Industry Events" }, { value: "investor_connections", label: "Investor Connections" },
    { value: "corporate_partnerships", label: "Corporate Partnerships" }, { value: "alumni_network", label: "Alumni Network" },
  ],
  market_access: [
    { value: "distribution_channels", label: "Distribution Channels" }, { value: "supply_chain_integration", label: "Supply Chain Integration" },
    { value: "export_assistance", label: "Export Assistance" }, { value: "government_tenders", label: "Government Tenders" },
  ],
  technology: [
    { value: "software_licenses", label: "Software Licenses" }, { value: "hardware_provision", label: "Hardware Provision" },
    { value: "tech_infrastructure", label: "Tech Infrastructure" }, { value: "digital_transformation", label: "Digital Transformation" },
  ],
  social_impact: [
    { value: "community_engagement", label: "Community Engagement" }, { value: "social_impact_measurement", label: "Social Impact Measurement" },
    { value: "esg_compliance", label: "ESG Compliance" }, { value: "b_corp_support", label: "B Corp Support" },
  ],
}

const fundingInstrumentOptions = [
  { value: "Any", label: "Any" }, { value: "Equity", label: "Equity (Buying shares in the business)", tooltip: "Investor purchases ownership stake in your company in exchange for capital" },
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
  { value: "female", label: "Female" }, { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-Binary / Gender Non-Conforming" }, { value: "youth_18_35", label: "Youth (18–35)" },
  { value: "persons_with_disability", label: "Persons with Disability" }, { value: "hdi_black_african", label: "HDI – Black African" },
  { value: "hdi_coloured", label: "HDI – Coloured" }, { value: "hdi_indian", label: "HDI – Indian/Asian" },
  { value: "white", label: "White" }, { value: "previously_disadvantaged", label: "Previously Disadvantaged Individuals" },
  { value: "rural", label: "Rural Communities" },
]

const bbbeeOptions = [
  { value: "level_1", label: "Level 1" }, { value: "level_2", label: "Level 2" }, { value: "level_3", label: "Level 3" },
  { value: "level_4", label: "Level 4" }, { value: "level_5", label: "Level 5" }, { value: "level_6", label: "Level 6" },
  { value: "level_7", label: "Level 7" }, { value: "level_8", label: "Level 8" }, { value: "exempt", label: "Exempt Micro Enterprise" },
  { value: "non_compliant", label: "Non-Compliant" }, { value: "any", label: "Any Level" },
]

const legalEntityOptions = [
  { value: "any", label: "Any Legal Entity" }, { value: "pty_ltd", label: "(Pty) Ltd – Private Company" },
  { value: "ltd", label: "Ltd – Public Company" }, { value: "npc", label: "NPC – Non-Profit Company" },
  { value: "sole_proprietor", label: "Sole Proprietor" }, { value: "partnership", label: "Partnership" },
  { value: "cc", label: "CC – Close Corporation (Legacy)" }, { value: "trust", label: "Trust" },
  { value: "cooperative", label: "Cooperative" }, { value: "joint_venture", label: "Joint Venture" },
  { value: "state_owned", label: "State-Owned Enterprise" },
]

const sectorFocusOptions = [
  { value: "Generalist", label: "Generalist" }, { value: "Agriculture", label: "Agriculture" },
  { value: "Automotive", label: "Automotive" }, { value: "Banking, Finance & Insurance", label: "Banking, Finance & Insurance" },
  { value: "Beauty / Cosmetics / Personal Care", label: "Beauty / Cosmetics / Personal Care" }, { value: "Construction", label: "Construction" },
  { value: "Consulting", label: "Consulting" }, { value: "Creative Arts / Design", label: "Creative Arts / Design" },
  { value: "Customer Service", label: "Customer Service" }, { value: "Education & Training", label: "Education & Training" },
  { value: "Engineering", label: "Engineering" }, { value: "Environmental / Natural Sciences", label: "Environmental / Natural Sciences" },
  { value: "Government / Public Sector", label: "Government / Public Sector" }, { value: "Healthcare / Medical", label: "Healthcare / Medical" },
  { value: "Hospitality / Tourism", label: "Hospitality / Tourism" }, { value: "Human Resources", label: "Human Resources" },
  { value: "Information Technology (IT)", label: "Information Technology (IT)" }, { value: "Infrastructure", label: "Infrastructure" },
  { value: "Legal / Law", label: "Legal / Law" }, { value: "Logistics / Supply Chain", label: "Logistics / Supply Chain" },
  { value: "Manufacturing", label: "Manufacturing" }, { value: "Marketing / Advertising / PR", label: "Marketing / Advertising / PR" },
  { value: "Media / Journalism / Broadcasting", label: "Media / Journalism / Broadcasting" }, { value: "Mining", label: "Mining" },
  { value: "Energy", label: "Energy" }, { value: "Oil & Gas", label: "Oil & Gas" },
  { value: "Non-Profit / NGO", label: "Non-Profit / NGO" }, { value: "Property / Real Estate", label: "Property / Real Estate" },
  { value: "Retail / Wholesale", label: "Retail / Wholesale" }, { value: "Safety & Security / Police / Defence", label: "Safety & Security / Police / Defence" },
  { value: "Sales", label: "Sales" }, { value: "Science & Research", label: "Science & Research" },
  { value: "Social Services / Social Work", label: "Social Services / Social Work" }, { value: "Sports / Recreation / Fitness", label: "Sports / Recreation / Fitness" },
  { value: "Telecommunications", label: "Telecommunications" }, { value: "Transport", label: "Transport" },
  { value: "Utilities (Water, Electricity, Waste)", label: "Utilities (Water, Electricity, Waste)" },
]

const geographicFocusOptions = [
  { value: "global", label: "Global" }, { value: "regional_na", label: "Regional (NA)" },
  { value: "regional_emea", label: "Regional (EMEA)" }, { value: "regional_apac", label: "Regional (APAC)" },
  { value: "country_specific", label: "Country-Specific" }, { value: "province_specific", label: "Province-Specific (SA)" },
]

const saProvinces = [
  { value: "gauteng", label: "Gauteng" }, { value: "western_cape", label: "Western Cape" },
  { value: "eastern_cape", label: "Eastern Cape" }, { value: "kwazulu_natal", label: "KwaZulu-Natal" },
  { value: "free_state", label: "Free State" }, { value: "north_west", label: "North West" },
  { value: "mpumalanga", label: "Mpumalanga" }, { value: "limpopo", label: "Limpopo" },
  { value: "northern_cape", label: "Northern Cape" },
]

const africanCountries = [
  { value: "algeria", label: "Algeria" }, { value: "angola", label: "Angola" }, { value: "benin", label: "Benin" },
  { value: "botswana", label: "Botswana" }, { value: "burkina_faso", label: "Burkina Faso" }, { value: "burundi", label: "Burundi" },
  { value: "cameroon", label: "Cameroon" }, { value: "drc", label: "DR Congo" }, { value: "egypt", label: "Egypt" },
  { value: "ethiopia", label: "Ethiopia" }, { value: "ghana", label: "Ghana" }, { value: "kenya", label: "Kenya" },
  { value: "lesotho", label: "Lesotho" }, { value: "madagascar", label: "Madagascar" }, { value: "malawi", label: "Malawi" },
  { value: "mauritius", label: "Mauritius" }, { value: "morocco", label: "Morocco" }, { value: "mozambique", label: "Mozambique" },
  { value: "namibia", label: "Namibia" }, { value: "nigeria", label: "Nigeria" }, { value: "rwanda", label: "Rwanda" },
  { value: "senegal", label: "Senegal" }, { value: "south_africa", label: "South Africa" }, { value: "tanzania", label: "Tanzania" },
  { value: "uganda", label: "Uganda" }, { value: "zambia", label: "Zambia" }, { value: "zimbabwe", label: "Zimbabwe" },
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

// ─── Collapsible Rating Section ─────────────────────────────────────────────

function CollapsibleRatingSection({ title, description, items, ratings, onRatingChange, color, icon: Icon, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [localRatings, setLocalRatings] = useState(ratings || {})
  const [totalPercentage, setTotalPercentage] = useState(0)

  React.useEffect(() => {
    calculateTotal(localRatings)
  }, [])

  const calculateTotal = (newRatings) => {
    const total = Object.values(newRatings).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
    setTotalPercentage(total)
    return total
  }

  const handleRatingChange = (itemName, value) => {
    let newValue = parseFloat(value) || 0
    newValue = Math.min(Math.max(newValue, 0), 100)
    
    const newRatings = { ...localRatings, [itemName]: newValue }
    const newTotal = calculateTotal(newRatings)
    
    if (newTotal > 100) {
      return
    }
    
    setLocalRatings(newRatings)
    if (onRatingChange) {
      onRatingChange(title, newRatings, newTotal)
    }
  }

  const distributeEvenly = () => {
    const evenValue = 100 / items.length
    const newRatings = {}
    items.forEach(item => {
      newRatings[item.name] = parseFloat(evenValue.toFixed(1))
    })
    setLocalRatings(newRatings)
    calculateTotal(newRatings)
    if (onRatingChange) {
      onRatingChange(title, newRatings, 100)
    }
  }

  const getPriorityColor = (percentage) => {
    if (percentage >= 70) return "#1B5E20"
    if (percentage >= 40) return "#FF9800"
    return "#F44336"
  }

  const getRatedCount = () => {
    return Object.values(localRatings).filter(r => r > 0).length
  }

  return (
    <div style={{
      marginBottom: "20px",
      backgroundColor: "#fefcf8",
      borderRadius: "12px",
      border: `1px solid ${color}40`,
      overflow: "hidden"
    }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          backgroundColor: `${color}10`,
          cursor: "pointer",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${color}20`}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${color}10`}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
          <div style={{ backgroundColor: color, padding: "8px", borderRadius: "10px", color: "white" }}>
            {Icon && <Icon size={18} />}
          </div>
          <div>
            <h3 style={{ margin: "0", fontSize: "16px", fontWeight: "700", color: "#5d4037" }}>{title}</h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#8d6e63" }}>{description}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {!isOpen && totalPercentage > 0 && (
            <div style={{ 
              display: "flex", gap: "12px", fontSize: "11px", color: "#8d6e63",
              backgroundColor: "white", padding: "4px 12px", borderRadius: "20px"
            }}>
              <span>📊 {totalPercentage.toFixed(0)}% total</span>
            </div>
          )}
          {isOpen ? <ChevronUp size={20} color="#8d6e63" /> : <ChevronDown size={20} color="#8d6e63" />}
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: "20px" }}>
          <div style={{ marginBottom: "20px", padding: "12px", backgroundColor: "#f5f0ec", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#5d4037" }}>Total Allocation</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: totalPercentage === 100 ? "#1B5E20" : "#FF9800" }}>
                {totalPercentage.toFixed(1)}% / 100%
              </span>
            </div>
            <div style={{ width: "100%", height: "6px", backgroundColor: "#e0d5cf", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(totalPercentage, 100)}%`, height: "100%", backgroundColor: totalPercentage === 100 ? "#1B5E20" : "#FF9800", borderRadius: "3px", transition: "width 0.3s ease" }} />
            </div>
            {totalPercentage !== 100 && (
              <div style={{ marginTop: "8px" }}>
                <button onClick={distributeEvenly} style={{ fontSize: "11px", color: "#8d6e63", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Distribute 100% evenly across all items
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto", paddingRight: "4px" }}>
            {items.map((item, idx) => {
              const rating = localRatings[item.name] || 0
              const isExcluded = rating === 0
              
              return (
                <div key={idx} style={{
                  padding: "12px",
                  backgroundColor: isExcluded ? "#faf5f0" : "white",
                  borderRadius: "8px",
                  border: `1px solid ${isExcluded ? "#e0d5cf" : "#e8ddd6"}`,
                }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                    <div style={{ flex: "2", minWidth: "180px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: "600", color: "#5d4037", fontSize: "13px" }}>{item.name}</span>
                        {!isExcluded && rating > 0 && (
                          <span style={{ backgroundColor: getPriorityColor(rating) + "20", color: getPriorityColor(rating), fontSize: "9px", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" }}>
                            {rating >= 70 ? "High Priority" : rating >= 40 ? "Medium Priority" : "Low Priority"}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "11px", color: "#8d6e63", margin: "4px 0 0" }}>{item.description}</p>
                    </div>

                    <div style={{ flex: "2", minWidth: "180px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "10px", color: "#8d6e63", minWidth: "25px" }}>0%</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={rating}
                          onChange={(e) => handleRatingChange(item.name, e.target.value)}
                          style={{
                            flex: "1",
                            height: "4px",
                            borderRadius: "2px",
                            WebkitAppearance: "none",
                            background: `linear-gradient(to right, ${getPriorityColor(rating)} 0%, ${getPriorityColor(rating)} ${rating}%, #e0d5cf ${rating}%, #e0d5cf 100%)`,
                            outline: "none"
                          }}
                        />
                        <span style={{ fontSize: "10px", color: "#8d6e63", minWidth: "25px", textAlign: "right" }}>100%</span>
                        <div style={{ minWidth: "55px", textAlign: "right" }}>
                          <input
                            type="number"
                            value={rating}
                            onChange={(e) => handleRatingChange(item.name, e.target.value)}
                            min="0"
                            max="100"
                            step="5"
                            style={{
                              width: "55px",
                              padding: "4px 6px",
                              border: `1px solid ${isExcluded ? "#e0d5cf" : "#d2b48c"}`,
                              borderRadius: "6px",
                              fontSize: "11px",
                              textAlign: "center",
                              backgroundColor: "white",
                              color: "#5d4037"
                            }}
                          />
                          <span style={{ fontSize: "10px", marginLeft: "2px" }}>%</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRatingChange(item.name, rating === 0 ? 0 : 0)}
                      style={{
                        padding: "4px 10px",
                        backgroundColor: isExcluded ? "#e0d5cf" : "#f5f2f0",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "10px",
                        color: "#8d6e63",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <AlertCircle size={10} />
                      {isExcluded ? "Excluded" : "Skip/Exclude"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{
            marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #e8ddd6",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", fontSize: "11px", color: "#8d6e63"
          }}>
            <span>✅ {getRatedCount()} items rated</span>
            <span>⏭️ {items.length - getRatedCount()} items skipped</span>
            <span>📊 Total: {totalPercentage.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MultiSelect ─────────────────────────────────────────────────────────────

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
  const [ratingsData, setRatingsData] = useState({
    intangibleSupport: data.intangibleSupportRatings || {},
    fundingSupport: data.fundingSupportRatings || {},
    demographics: data.demographicsRatings || {},
    legalStage: data.legalStageRatings || {},
    sectorGeography: data.sectorGeographyRatings || {}
  })

  const handleRatingChange = (category, ratings, total) => {
    const categoryKey = category.toLowerCase().replace(/\s+/g, '')
    const newRatingsData = { ...ratingsData, [categoryKey]: ratings }
    setRatingsData(newRatingsData)
    updateData({ 
      [`${categoryKey}Ratings`]: ratings,
      [`${categoryKey}Total`]: total
    })
  }

  const h = (field, value) => updateData({ [field]: value })

  const isFundingSelected = data.fundingSupport === "yes"
  
  const getAvailableSubtypes = () => {
    if (!data.intangibleSupport || !intangibleSupportSubtypes[data.intangibleSupport]) return []
    return intangibleSupportSubtypes[data.intangibleSupport]
  }

  const showProvinces = (data.geographicFocus || []).includes("province_specific")
  const showCountries = (data.geographicFocus || []).includes("country_specific")

  // Rating items definitions
  const intangibleSupportItems = [
    { name: "Advisory Services", description: "Strategic guidance and expert consultation" },
    { name: "Mentorship", description: "One-on-one guidance from experienced professionals" },
    { name: "Capacity Building", description: "Skills development, training, and operational improvement" },
    { name: "Networking & Partnerships", description: "Connections to potential partners, clients, and collaborators" },
    { name: "Market Access", description: "Distribution channels and market entry support" },
    { name: "Technology & Innovation", description: "Tech infrastructure, digital tools, and innovation resources" },
    { name: "Social Impact Support", description: "Support for community development and social responsibility" },
  ]

  const fundingSupportItems = [
    { name: "Equity", description: "Buying shares in the business" },
    { name: "Debt", description: "Loan-based funding requiring repayment" },
    { name: "Grants", description: "Non-repayable funding" },
    { name: "Convertible Notes", description: "Loan that can turn into shares" },
    { name: "Revenue-based Financing", description: "Repayment tied to monthly revenue" },
    { name: "Hybrid/Structured Instruments", description: "Combination of debt and equity features" },
    { name: "Secondary Market Strategies", description: "Investments in existing shares" },
    { name: "Special Strategies", description: "Customized or non-traditional approaches" },
  ]

  const demographicsItems = [
    { name: "Female", description: "Women-owned or led businesses" },
    { name: "Male", description: "Men-owned businesses" },
    { name: "Non-Binary", description: "Gender non-conforming individuals" },
    { name: "Youth (18-35)", description: "Young entrepreneurs" },
    { name: "Persons with Disability", description: "Entrepreneurs with disabilities" },
    { name: "HDI - Black African", description: "Historically disadvantaged individuals" },
    { name: "HDI - Coloured", description: "Historically disadvantaged individuals" },
    { name: "HDI - Indian/Asian", description: "Historically disadvantaged individuals" },
    { name: "Rural Communities", description: "Businesses in rural areas" },
  ]

  const legalStageItems = [
    { name: "Legal Entity Type", description: "Company registration and structure requirements" },
    { name: "B-BBEE Level", description: "Broad-Based Black Economic Empowerment compliance" },
    { name: "Pre-seed Stage", description: "Idea development, prototypes" },
    { name: "Seed Stage", description: "First equity funding, initial customers" },
    { name: "Series A/B/C", description: "Scale proven products, expand market" },
    { name: "Growth/PE Stage", description: "Private equity for mature companies" },
    { name: "MBO/MBI/LBO", description: "Management buyouts and leveraged buyouts" },
  ]

  const sectorGeographyItems = [
    { name: "Sector Alignment", description: "Business must match target sectors" },
    { name: "Geographic Location", description: "Business location requirements" },
    { name: "Market Presence", description: "Existing market footprint" },
    { name: "Export Readiness", description: "Ability to serve international markets" },
    { name: "Local Economic Impact", description: "Contribution to local communities" },
  ]

  return (
    <div style={{ padding: "24px", maxWidth: "1100px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#5d4037", marginBottom: "8px" }}>
        Program Brief &amp; Matching Preferences
      </h2>
      <p style={{ fontSize: "14px", color: "#9c7a5a", marginBottom: "28px" }}>
        Define your program details and matching preferences. Rate how important each criterion is for SME selection.
        <strong style={{ display: "block", marginTop: "8px" }}>Note: Total rating per section should not exceed 100%.</strong>
      </p>

      {/* Section 1: Program Details (Basic Info - No Rating) */}
      <div style={sectionBoxStyle}>
        <h3 style={sectionTitleStyle}>Section 1 — Program Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={labelStyle}>Program Name *</label>
            <input type="text" value={data.programName || ""} onChange={(e) => h("programName", e.target.value)} style={inputStyle} placeholder="e.g. Women in Tech Accelerator 2025" />
          </div>
          <div>
            <label style={labelStyle}>Program Website <span style={{ fontWeight: 400, color: "#9c7a5a" }}>(if applicable)</span></label>
            <input type="url" value={data.programWebsite || ""} onChange={(e) => h("programWebsite", e.target.value)} style={inputStyle} placeholder="https://yourprogram.co.za" />
          </div>
          <div>
            <label style={labelStyle}>Program Duration (years)</label>
            <input type="number" min="0" step="0.5" value={data.programDuration || ""} onChange={(e) => h("programDuration", e.target.value)} style={inputStyle} placeholder="e.g. 2" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>About the Program</label>
            <textarea value={data.aboutProgram || ""} onChange={(e) => h("aboutProgram", e.target.value)} style={{ ...inputStyle, resize: "vertical" }} rows={3} placeholder="Briefly describe what this program does and who it supports..." />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Program Goals</label>
            <textarea value={data.programGoals || ""} onChange={(e) => h("programGoals", e.target.value)} style={{ ...inputStyle, resize: "vertical" }} rows={3} placeholder="What outcomes does this program aim to achieve?" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Support Framework &amp; Commitment</label>
            <textarea value={data.supportFramework || ""} onChange={(e) => h("supportFramework", e.target.value)} style={{ ...inputStyle, resize: "vertical" }} rows={3} placeholder="Describe how participants are supported and what commitment is required from them..." />
          </div>
        </div>
      </div>

      {/* Rating Sections - Collapsible */}
      
      {/* Section 2: Intangible Support Rating */}
      <CollapsibleRatingSection
        title="Intangible Support Requirements"
        description="Rate how important each type of support is for your program"
        items={intangibleSupportItems}
        ratings={ratingsData.intangibleSupport}
        onRatingChange={handleRatingChange}
        color="#8D6E63"
        icon={Briefcase}
        defaultOpen={true}
      />

      {/* Section 3: Funding Support Rating */}
      <CollapsibleRatingSection
        title="Funding Support Requirements"
        description="Rate how important each funding instrument is for your program"
        items={fundingSupportItems}
        ratings={ratingsData.fundingSupport}
        onRatingChange={handleRatingChange}
        color="#4CAF50"
        icon={DollarSign}
        defaultOpen={false}
      />

      {/* Section 4: Demographics Rating */}
      <CollapsibleRatingSection
        title="Demographics & B-BBEE Requirements"
        description="Rate how important each demographic criterion is for selection"
        items={demographicsItems}
        ratings={ratingsData.demographics}
        onRatingChange={handleRatingChange}
        color="#2196F3"
        icon={Users}
        defaultOpen={false}
      />

      {/* Section 5: Legal & Stage Requirements */}
      <CollapsibleRatingSection
        title="Legal Entity & Business Stage Requirements"
        description="Rate how important each legal and stage criterion is"
        items={legalStageItems}
        ratings={ratingsData.legalStage}
        onRatingChange={handleRatingChange}
        color="#6D4C41"
        icon={Shield}
        defaultOpen={false}
      />

      {/* Section 6: Sector & Geography Requirements */}
      <CollapsibleRatingSection
        title="Sector & Geography Requirements"
        description="Rate how important each sector and geography criterion is"
        items={sectorGeographyItems}
        ratings={ratingsData.sectorGeography}
        onRatingChange={handleRatingChange}
        color="#FF9800"
        icon={MapPin}
        defaultOpen={false}
      />

      {/* Original Matching Preference Fields */}
      <div style={sectionBoxStyle}>
        <h3 style={sectionTitleStyle}>Matching Preferences</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          
          <div>
            <label style={labelStyle}>Intangible Support</label>
            <select value={data.intangibleSupport || ""} onChange={(e) => {
              h("intangibleSupport", e.target.value)
              h("intangibleSupportSubtype", "")
            }} style={selectStyle}>
              <option value="">Select Intangible Support</option>
              {intangibleSupportOptions.map((opt) => (<option key={opt.value} value={opt.value} title={opt.tooltip || ""}>{opt.label}</option>))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Intangible Support Sub-type</label>
            <select value={data.intangibleSupportSubtype || ""} onChange={(e) => h("intangibleSupportSubtype", e.target.value)} style={selectStyle} disabled={!data.intangibleSupport}>
              <option value="">{data.intangibleSupport ? "Select Sub-type" : "Select Intangible Support first"}</option>
              {getAvailableSubtypes().map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Funding Support</label>
            <select value={data.fundingSupport || ""} onChange={(e) => h("fundingSupport", e.target.value)} style={selectStyle}>
              <option value="">Select Funding Support</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {isFundingSelected && (
            <>
              <div>
                <label style={labelStyle}>Instrument Fit</label>
                <MultiSelect options={fundingInstrumentOptions} selected={data.fundingInstruments || []} onChange={(val) => h("fundingInstruments", val)} placeholder="Select funding instruments" includeSelectAll={false} />
              </div>
              <div>
                <label style={labelStyle}>Ticket Size (ZAR)</label>
                <input type="text" value={data.ticketSize || ""} onChange={(e) => h("ticketSize", formatRand(e.target.value))} style={inputStyle} placeholder="R 100,000" />
              </div>
              <div>
                <label style={labelStyle}>Revenue Threshold (ZAR)</label>
                <input type="text" value={data.revenueThreshold || ""} onChange={(e) => h("revenueThreshold", formatRand(e.target.value))} style={inputStyle} placeholder="R 5,000,000" />
              </div>
            </>
          )}

          <div>
            <label style={labelStyle}>Demographics</label>
            <MultiSelect options={demographicsOptions} selected={data.demographics || []} onChange={(val) => h("demographics", val)} placeholder="Select demographic targets..." />
          </div>

          <div>
            <label style={labelStyle}>B-BBEE Level</label>
            <MultiSelect options={bbbeeOptions} selected={data.bbbeeLevel || []} onChange={(val) => h("bbbeeLevel", val)} placeholder="Select B-BBEE level(s)..." />
          </div>

          <div>
            <label style={labelStyle}>Legal Entity</label>
            <MultiSelect options={legalEntityOptions} selected={data.legalEntity || []} onChange={(val) => h("legalEntity", val)} placeholder="Select legal entity type(s)..." />
          </div>

          <div>
            <label style={labelStyle}>Business Lifecycle Stage</label>
            <MultiSelect options={businessStageOptions} selected={data.businessLifecycleStage || []} onChange={(val) => h("businessLifecycleStage", val)} placeholder="Select lifecycle stage(s)..." />
          </div>

          <div>
            <label style={labelStyle}>Sector Focus</label>
            <MultiSelect options={sectorFocusOptions} selected={data.sectorFocus || []} onChange={(val) => h("sectorFocus", val)} placeholder="Select sector(s)..." />
          </div>

          <div>
            <label style={labelStyle}>Sector Exclusions</label>
            <MultiSelect options={sectorFocusOptions} selected={data.sectorExclusions || []} onChange={(val) => h("sectorExclusions", val)} placeholder="Select excluded sector(s)..." />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Geographic Focus</label>
            <MultiSelect options={geographicFocusOptions} selected={data.geographicFocus || []} onChange={(val) => h("geographicFocus", val)} placeholder="Select geographic focus..." />

            {showCountries && (
              <div style={{ marginTop: "12px" }}>
                <label style={{ ...labelStyle, fontWeight: "500", color: "#8B4513" }}>African Countries</label>
                <MultiSelect options={africanCountries} selected={data.selectedCountries || []} onChange={(val) => h("selectedCountries", val)} placeholder="Select countries..." />
              </div>
            )}

            {showProvinces && (
              <div style={{ marginTop: "12px" }}>
                <label style={{ ...labelStyle, fontWeight: "500", color: "#8B4513" }}>South African Provinces</label>
                <MultiSelect options={saProvinces} selected={data.selectedProvinces || []} onChange={(val) => h("selectedProvinces", val)} placeholder="Select provinces..." />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}