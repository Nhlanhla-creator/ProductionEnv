"use client"
import React, { useState, useEffect } from "react"
import FormField from "./FormField"
import styles from "./catalyst-universal-profile.module.css"

const legalEntityTypes = [
   { value: "(pty) Ltd", label: "(Pty) Ltd - Private Company" },
   { value: "Ltd", label: "Ltd - Public Company" },
   { value: "NPC", label: "NPC - Non-Profit Company" },
   { value: "Sole Proprietor", label: "Sole Proprietor" },
   { value: "Partnership", label: "Partnership" },
   { value: "CC", label: "CC - Close Corporation (Legacy)" },
   { value: "Trust", label: "Trust" },
   { value: "Cooperative", label: "Cooperative" },
   { value: "Joint Venture", label: "Joint Venture" },
   { value: "State Owned", label: "State-Owned Enterprise" },
]

const companySizes = [
  { value: "large_enterprise", label: "Large Enterprise" },
  { value: "medium_enterprise", label: "Medium Enterprise" },
  { value: "multinational", label: "Multinational" },
]

const industrySectors = [
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

const referralSources = [
  { value: "google_search", label: "Google Search" },
  { value: "social_media", label: "Social Media" },
  { value: "referral", label: "Referral from Friend/Colleague" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "website", label: "Company Website" },
  { value: "advertisement", label: "Advertisement" },
  { value: "event", label: "Event/Conference" },
  { value: "other", label: "Other" },
]

const industryAssociations = [
  { value: "SA Township Traders Association", label: "SA Township Traders Association" },
  { value: "Minerals Council South Africa", label: "Minerals Council South Africa" },
  { value: "Junior Mining Council (JEMD-linked)", label: "Junior Mining Council (JEMD-linked)" },
  { value: "Mandela Mining Precinct", label: "Mandela Mining Precinct" },
  { value: "African Chamber of Commerce and Industry", label: "African Chamber of Commerce and Industry" },
  { value: "Black Business Council", label: "Black Business Council" },
  { value: "South African Renewable Energy Council (SAREC)", label: "South African Renewable Energy Council (SAREC)" },
  { value: "SAPICS: Supply Chain Institute of Southern Africa", label: "SAPICS: Supply Chain Institute of Southern Africa" },
  { value: "Manufacturing Circle", label: "Manufacturing Circle" },
  { value: "Southern African Renewable Energy Council (SAWEA / SA-PVIA)", label: "Southern African Renewable Energy Council (SAWEA / SA-PVIA)" },
  { value: "South African Institute of Black Property Practitioners", label: "South African Institute of Black Property Practitioners" },
  { value: "ASASA / ASISA-linked industry groups", label: "ASASA / ASISA-linked industry groups" },
  { value: "South African Venture Capital and Private Equity Association (SAVCA)", label: "South African Venture Capital and Private Equity Association (SAVCA)" },
  { value: "ABSA Black Business Awards / ABSIP / BEE-linked networks", label: "ABSA Black Business Awards / ABSIP / BEE-linked networks" },
  { value: "SA SME Fund", label: "SA SME Fund" },
  { value: "Endeva (SA / global ESO-backed networks)", label: "Endeva (SA / global ESO-backed networks)" },
  { value: "SA Industrial Development Corporation (IDC)", label: "SA Industrial Development Corporation (IDC)" },
  { value: "SA Department of Trade, Industry and Competition (DTIC)", label: "SA Department of Trade, Industry and Competition (DTIC)" },
  { value: "SA Department of Mineral Resources and Energy (DMRE)", label: "SA Department of Mineral Resources and Energy (DMRE)" },
  { value: "SA Department of Employment and Labour (BEE-linked units)", label: "SA Department of Employment and Labour (BEE-linked units)" },
  { value: "SA National Business Initiative (NBI)", label: "SA National Business Initiative (NBI)" },
  { value: "Other", label: "Other" },
]

// Reusable MultiSelect Dropdown
function MultiSelectDropdown({ options, selected = [], onChange, placeholder = "Select options..." }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-multiselect]")) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const removeTag = (e, value) => {
    e.stopPropagation()
    onChange(selected.filter((v) => v !== value))
  }

  const getLabel = (value) => options.find((o) => o.value === value)?.label || value

  return (
    <div style={{ position: "relative" }} data-multiselect="true">
      <div
        onClick={() => setIsOpen((p) => !p)}
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "6px 10px",
          cursor: "pointer",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "4px",
          minHeight: "40px",
          backgroundColor: "white",
          fontSize: "14px",
        }}
      >
        {selected.length === 0 ? (
          <span style={{ color: "#999" }}>{placeholder}</span>
        ) : (
          selected.map((val) => (
            <span
              key={val}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: "#f3ebe0",
                border: "1px solid #d6c4a8",
                color: "#6b4c2a",
                borderRadius: "12px",
                padding: "2px 10px",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              {getLabel(val)}
              <span
                onClick={(e) => removeTag(e, val)}
                style={{ cursor: "pointer", lineHeight: 1, opacity: 0.7, fontSize: "12px" }}
              >
                ✕
              </span>
            </span>
          ))
        )}
        <span style={{ marginLeft: "auto", color: "#999", fontSize: "12px" }}>{isOpen ? "▲" : "▼"}</span>
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            marginTop: "4px",
            zIndex: 1000,
            maxHeight: "260px",
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {options.map((option) => {
            const isSel = selected.includes(option.value)
            return (
              <div
                key={option.value}
                onClick={() => toggle(option.value)}
                style={{
                  padding: "9px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  backgroundColor: isSel ? "#fdf6ee" : "white",
                  fontSize: "14px",
                  color: "#3d2b1f",
                }}
                onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.backgroundColor = "#faf5ef" }}
                onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.backgroundColor = "white" }}
              >
                <div
                  style={{
                    width: "16px", height: "16px", borderRadius: "3px", flexShrink: 0,
                    border: `1px solid ${isSel ? "#8b5e3c" : "#ccc"}`,
                    backgroundColor: isSel ? "#8b5e3c" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {isSel && <span style={{ color: "white", fontSize: "10px", fontWeight: "bold" }}>✓</span>}
                </div>
                <span>{option.label}</span>
              </div>
            )
          })}
          <div style={{ padding: "8px", borderTop: "1px solid #eee", position: "sticky", bottom: 0, backgroundColor: "white" }}>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                width: "100%", padding: "8px",
                backgroundColor: "#8B4513", color: "white",
                border: "none", borderRadius: "4px",
                cursor: "pointer", fontSize: "13px", fontWeight: "600",
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

export default function CatalystEntityOverview({ data = {}, updateData }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleMultiSelectChange = (field, value) => {
    updateData({ [field]: value })
  }

  const memberOfAssociation = data.memberOfAssociation

  // Inline styles to match the existing brown/earth tone aesthetic
  const sectionHeadingStyle = {
    borderBottom: "2px solid #C19A6B",
    marginBottom: "1.25rem",
    marginTop: "1.75rem",
    paddingBottom: "6px",
  }

  const sectionHeadingTextStyle = {
    fontSize: "15px",
    fontWeight: "700",
    color: "#6B3410",
    margin: 0,
    letterSpacing: "0.3px",
  }

  return (
    <div className={styles.productApplicationContainer}>
      <h2 className={styles.productApplicationHeading}>Entity Overview</h2>
      <div className={styles.formContent}>
        <div className={styles.gridContainer}>
          <FormField label="Registered Name" required>
            <input
              type="text"
              name="registeredName"
              value={data.registeredName || ""}
              onChange={handleChange}
              className={styles.formInput}
              required
            />
          </FormField>
          <FormField label="Trading Name (if different)">
            <input
              type="text"
              name="tradingName"
              value={data.tradingName || ""}
              onChange={handleChange}
              className={styles.formInput}
            />
          </FormField>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Legal Entity of Firm" required>
            <select
              name="legalEntityType"
              value={data.legalEntityType || ""}
              onChange={handleChange}
              className={styles.formSelect}
              required
            >
              <option value="">Select Legal Entity Type</option>
              {legalEntityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Registration Number" required>
            <input
              type="text"
              name="registrationNumber"
              value={data.registrationNumber || ""}
              onChange={handleChange}
              className={styles.formInput}
              required
            />
          </FormField>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Industry Sector" required>
            <select
              name="industrySector"
              value={data.industrySector || ""}
              onChange={handleChange}
              className={styles.formSelect}
              required
            >
              <option value="">Select Industry Sector</option>
              {industrySectors.map((sector) => (
                <option key={sector.value} value={sector.value}>
                  {sector.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Company Size" required>
            <select
              name="companySize"
              value={data.companySize || ""}
              onChange={handleChange}
              className={styles.formSelect}
              required
            >
              <option value="">Select Company Size</option>
              {companySizes.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Year Established" required>
            <input
              type="number"
              name="yearEstablished"
              value={data.yearEstablished || ""}
              onChange={handleChange}
              className={styles.formInput}
              required
              min="1800"
              max={new Date().getFullYear()}
              placeholder="e.g. 2010"
            />
          </FormField>
          <FormField label="Website (URL)">
            <input
              type="url"
              name="website"
              value={data.website || ""}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="https://www.example.com"
            />
          </FormField>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Brief Description" required>
            <textarea
              name="briefDescription"
              value={data.briefDescription || ""}
              onChange={handleChange}
              className={`${styles.formTextarea} ${styles.small}`}
              rows={3}
              placeholder="Brief description of your business..."
              required
            />
          </FormField>
          <FormField label="How did you hear about us?" required>
            <select
              name="referralSource"
              value={data.referralSource || ""}
              onChange={handleChange}
              className={styles.formSelect}
              required
            >
              <option value="">Select how you heard about us</option>
              {referralSources.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
            {data.referralSource === "other" && (
              <div style={{ marginTop: "8px" }}>
                <input
                  type="text"
                  name="referralSourceOther"
                  value={data.referralSourceOther || ""}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="Please specify..."
                  required
                />
              </div>
            )}
          </FormField>
        </div>

        {/* ── INDUSTRY ASSOCIATIONS ── */}
        <div style={sectionHeadingStyle}>
          <h3 style={sectionHeadingTextStyle}>Industry Associations</h3>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Are you a member of any industry association?">
            <div style={{ display: "flex", gap: "16px" }}>
              {["yes", "no"].map((opt) => (
                <label
                  key={opt}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 20px",
                    borderRadius: "6px",
                    border: `2px solid ${memberOfAssociation === opt ? "#8B4513" : "#ccc"}`,
                    backgroundColor: memberOfAssociation === opt ? "#fdf6ee" : "white",
                    cursor: "pointer",
                    fontWeight: memberOfAssociation === opt ? "600" : "400",
                    color: memberOfAssociation === opt ? "#6B3410" : "#555",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="radio"
                    name="memberOfAssociation"
                    value={opt}
                    checked={memberOfAssociation === opt}
                    onChange={handleChange}
                    style={{ display: "none" }}
                  />
                  <span
                    style={{
                      width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${memberOfAssociation === opt ? "#8B4513" : "#ccc"}`,
                      backgroundColor: memberOfAssociation === opt ? "#8B4513" : "transparent",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {memberOfAssociation === opt && (
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "white" }} />
                    )}
                  </span>
                  {opt === "yes" ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </FormField>

          {memberOfAssociation === "yes" && (
            <FormField label="Select your association(s)">
              <MultiSelectDropdown
                options={industryAssociations}
                selected={Array.isArray(data.industryAssociations) ? data.industryAssociations : []}
                onChange={(value) => handleMultiSelectChange("industryAssociations", value)}
                placeholder="Select associations..."
              />
              {Array.isArray(data.industryAssociations) && data.industryAssociations.includes("Other") && (
                <div style={{ marginTop: "10px" }}>
                  <input
                    type="text"
                    name="industryAssociationsOther"
                    value={data.industryAssociationsOther || ""}
                    onChange={handleChange}
                    className={styles.formInput}
                    placeholder="Please specify your association..."
                  />
                </div>
              )}
            </FormField>
          )}
        </div>

      </div>
    </div>
  )
}