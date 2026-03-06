"use client"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import styles from "./catalyst-universal-profile.module.css"

// ─── Option Lists ─────────────────────────────────────────────────────────────

const supportFocusOptions = [
  { value: "funding", label: "Funding Support" },
  { value: "capacity_building", label: "Capacity Building" },
  { value: "market_access", label: "Market Access" },
  { value: "technology", label: "Technology & Innovation" },
  { value: "social_impact", label: "Social Impact" },
]

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

const businessStageOptions = [
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "series_c", label: "Series C+" },
  { value: "growth_pe", label: "Growth / PE" },
  { value: "mbo", label: "MBO" },
  { value: "mbi", label: "MBI" },
  { value: "lbo", label: "LBO" },
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
  { value: "generalist", label: "Generalist" },
  { value: "agriculture", label: "Agriculture / Forestry / Fishing" },
  { value: "automotive", label: "Automotive / Motor Industry" },
  { value: "banking", label: "Banking / Insurance / Investments" },
  { value: "beauty", label: "Beauty / Cosmetics / Personal Care" },
  { value: "construction", label: "Construction / Building / Civils" },
  { value: "consulting", label: "Consulting / Business Services" },
  { value: "creative", label: "Creative Arts / Design / Entertainment" },
  { value: "customer_service", label: "Call Centre / Customer Service" },
  { value: "education", label: "Education / Training / Teaching" },
  { value: "engineering", label: "Engineering" },
  { value: "environmental", label: "Environmental / Natural Sciences" },
  { value: "government", label: "Government / Public Sector" },
  { value: "healthcare", label: "Healthcare / Nursing / Medical" },
  { value: "hospitality", label: "Hospitality / Hotel / Catering / Tourism" },
  { value: "hr", label: "Human Resources / Recruitment" },
  { value: "ict", label: "ICT / Information Technology" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "legal", label: "Legal / Law" },
  { value: "logistics", label: "Logistics / Transport / Supply Chain" },
  { value: "manufacturing", label: "Manufacturing / Production" },
  { value: "marketing", label: "Marketing / Advertising / PR" },
  { value: "media", label: "Media / Journalism / Publishing" },
  { value: "mining", label: "Mining / Energy / Oil & Gas" },
  { value: "ngo", label: "NGO / Non-Profit / Community Services" },
  { value: "property", label: "Real Estate / Property" },
  { value: "retail", label: "Retail / Wholesale / Sales" },
  { value: "science", label: "Science / Research / Development" },
  { value: "security", label: "Security / Emergency Services" },
  { value: "telecoms", label: "Telecommunications" },
  { value: "trades", label: "Trades / Artisans / Technical" },
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

const labelStyle = {
  display: "block",
  fontWeight: "600",
  color: "#5d4037",
  marginBottom: "6px",
  fontSize: "14px",
}

// ─── MultiSelect ───────────────────────────────────────────────────────────────

function MultiSelect({ options, selected: _selected, onChange, placeholder = "Select options...", includeSelectAll = true }) {
  // Normalise: could arrive as a string (legacy), array, or undefined
  const selected = Array.isArray(_selected)
    ? _selected
    : typeof _selected === "string" && _selected
      ? [_selected]
      : []

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
  return numeric ? "R" + parseInt(numeric).toLocaleString("en-ZA") : ""
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CatalystProgramBriefMatchingPreference({ data = {}, updateData = () => {} }) {
  const h = (field, value) => updateData({ [field]: value })

  // Normalise: old data may have stored a string, new data stores an array
  const supportFocusArray = Array.isArray(data.supportFocus)
    ? data.supportFocus
    : data.supportFocus
      ? [data.supportFocus]
      : []

  const isFundingSelected = supportFocusArray.includes("funding")
  const availableSubtypes = supportFocusArray.flatMap((f) => supportFocusSubtypes[f] || [])
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

          <div>
            <label style={labelStyle}>Support Focus</label>
            <MultiSelect
              options={supportFocusOptions}
              selected={supportFocusArray}
              onChange={(val) => {
                h("supportFocus", val)
                // Clear subtypes that no longer apply
                const validSubtypes = val.flatMap((f) => (supportFocusSubtypes[f] || []).map((s) => s.value))
                const currentSubtypes = Array.isArray(data.supportFocusSubtype) ? data.supportFocusSubtype : []
                h("supportFocusSubtype", currentSubtypes.filter((s) => validSubtypes.includes(s)))
              }}
              placeholder="Select support focus areas..."
            />
          </div>

          <div>
            <label style={labelStyle}>Support Focus Sub-type</label>
            {availableSubtypes.length > 0 ? (
              <MultiSelect
                options={availableSubtypes}
                selected={data.supportFocusSubtype || []}
                onChange={(val) => h("supportFocusSubtype", val)}
                placeholder="Select sub-types..."
              />
            ) : (
              <div style={{ ...inputStyle, color: "#a0826d", display: "flex", alignItems: "center", minHeight: "42px" }}>
                Select a Support Focus first
              </div>
            )}
          </div>

          {/* Conditional funding fields */}
          {isFundingSelected && (
            <>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{
                  backgroundColor: "#fffbf5",
                  border: "1px dashed #d2b48c",
                  borderRadius: "8px",
                  padding: "16px",
                }}>
                  <p style={{ fontSize: "13px", fontWeight: "600", color: "#8B4513", marginBottom: "16px" }}>
                    ℹ️ Funding Support selected — please complete the additional fields below:
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={labelStyle}>Target Business Stage</label>
                      <MultiSelect
                        options={businessStageOptions}
                        selected={data.targetBusinessStage || []}
                        onChange={(val) => h("targetBusinessStage", val)}
                        placeholder="Select stage(s)..."
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Minimum Support Ticket (ZAR)</label>
                      <input
                        type="text"
                        value={data.minimumSupportTicket || ""}
                        onChange={(e) => h("minimumSupportTicket", formatRand(e.target.value))}
                        style={inputStyle}
                        placeholder="R 10,000"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Maximum Support Ticket (ZAR)</label>
                      <input
                        type="text"
                        value={data.maximumSupportTicket || ""}
                        onChange={(e) => h("maximumSupportTicket", formatRand(e.target.value))}
                        style={inputStyle}
                        placeholder="R 1,000,000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
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