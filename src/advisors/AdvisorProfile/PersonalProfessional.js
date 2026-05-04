"use client"
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import FormField from "./FormField"

import styles from "./AdvisorProfile.module.css"

const yearsOfExperienceOptions = [
  { value: "less_than_5", label: "*<5" },
  { value: "5_to_10", label: "5-10" },
  { value: "10_to_20", label: "10-20" },
  { value: "20_plus", label: "20+*" },
]

const functionalExpertiseOptions = [
  { value: "finance", label: "Finance" },
  { value: "hr", label: "HR" },
  { value: "legal", label: "Legal" },
  { value: "strategy", label: "Strategy" },
  { value: "esg", label: "ESG" },
  { value: "tech", label: "Tech" },
  { value: "governance", label: "Governance" },
]

const industryExperienceOptions = [
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

const boardExperienceOptions = [
  { value: "none", label: "None" },
  { value: "advisory_board", label: "Advisory Board" },
  { value: "fiduciary_board", label: "Fiduciary Board" },
  { value: "chair", label: "Chair" },
]

const mentorshipExperienceOptions = [
  { value: "none", label: "None" },
  { value: "1_to_3_years", label: "1-3 years" },
  { value: "3_to_5_years", label: "3-5" },
  { value: "5_plus_years", label: "5+" },
]

const languagesOptions = [
  { value: "english", label: "English" },
  { value: "afrikaans", label: "Afrikaans" },
  { value: "zulu", label: "Zulu" },
  { value: "xhosa", label: "Xhosa" },
  { value: "sotho", label: "Sotho" },
  { value: "tswana", label: "Tswana" },
  { value: "french", label: "French" },
  { value: "portuguese", label: "Portuguese" },
  { value: "swahili", label: "Swahili" },
  { value: "arabic", label: "Arabic" },
]

const regionFamiliarityOptions = [
  { value: "africa_wide", label: "Africa-wide" },
  { value: "southern_africa", label: "Southern Africa" },
  { value: "east_africa", label: "East Africa" },
  { value: "west_africa", label: "West Africa" },
  { value: "north_africa", label: "North Africa" },
  { value: "gauteng", label: "Gauteng" },
  { value: "western_cape", label: "Western Cape" },
  { value: "kwazulu_natal", label: "KwaZulu-Natal" },
  { value: "eastern_cape", label: "Eastern Cape" },
  { value: "free_state", label: "Free State" },
  { value: "limpopo", label: "Limpopo" },
  { value: "mpumalanga", label: "Mpumalanga" },
  { value: "northern_cape", label: "Northern Cape" },
  { value: "north_west", label: "North West" },
]

// ── Industry Associations ──────────────────────────────────────────────────
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

// Original MultiSelectDropdown (used for existing fields, keeps CSS module styles)
function MultiSelectDropdown({
  options,
  value = [],
  onChange,
  placeholder = "Select options",
  name,
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState(value)
  const dropdownRef = useRef(null)

  useEffect(() => { setSelectedOptions(value) }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleOption = (optionValue) => {
    const newSelectedOptions = selectedOptions.includes(optionValue)
      ? selectedOptions.filter((v) => v !== optionValue)
      : [...selectedOptions, optionValue]
    setSelectedOptions(newSelectedOptions)
    onChange(newSelectedOptions)
  }

  const getSelectedLabels = () =>
    options.filter((option) => selectedOptions.includes(option.value)).map((option) => option.label)

  return (
    <div className={styles.multiSelectContainer} ref={dropdownRef}>
      <div className={styles.multiSelectHeader} onClick={() => setIsOpen(!isOpen)} aria-haspopup="listbox" aria-expanded={isOpen}>
        {selectedOptions.length > 0 ? (
          <div className={styles.selectedItems}>
            {getSelectedLabels().map((label) => (
              <span key={label} className={styles.selectedItem}>{label}</span>
            ))}
          </div>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
        <ChevronDown size={16} />
      </div>

      {isOpen && (
        <div className={styles.multiSelectDropdown}>
          <div className={styles.multiSelectOptions} role="listbox">
            {options.map((option) => (
              <div
                key={option.value}
                className={`${styles.multiSelectOption} ${selectedOptions.includes(option.value) ? styles.selected : ""}`}
                onClick={() => toggleOption(option.value)}
                role="option"
                aria-selected={selectedOptions.includes(option.value)}
              >
                <input
                  type="checkbox"
                  className={styles.multiSelectCheckbox}
                  checked={selectedOptions.includes(option.value)}
                  onChange={() => {}}
                  id={`${name}-${option.value}`}
                />
                <label htmlFor={`${name}-${option.value}`}>{option.label}</label>
              </div>
            ))}
          </div>
          <div className={styles.multiSelectActions}>
            <button type="button" className={styles.multiSelectButton} onClick={() => setIsOpen(false)}>Done</button>
          </div>
        </div>
      )}

      <select name={name} multiple value={selectedOptions} onChange={() => {}} required={required} style={{ display: "none" }}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}

// Associations-specific MultiSelect (earth-tone pill style)
function AssociationsMultiSelect({ options, selected = [], onChange, placeholder = "Select associations..." }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-assoc-multiselect]")) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggle = (value) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  const removeTag = (e, value) => {
    e.stopPropagation()
    onChange(selected.filter((v) => v !== value))
  }

  const getLabel = (value) => options.find((o) => o.value === value)?.label || value

  return (
    <div style={{ position: "relative" }} data-assoc-multiselect="true">
      <div
        onClick={() => setIsOpen((p) => !p)}
        style={{
          border: "1px solid #ccc", borderRadius: "4px", padding: "6px 10px",
          cursor: "pointer", display: "flex", flexWrap: "wrap", alignItems: "center",
          gap: "4px", minHeight: "40px", backgroundColor: "white", fontSize: "14px",
        }}
      >
        {selected.length === 0 ? (
          <span style={{ color: "#999" }}>{placeholder}</span>
        ) : (
          selected.map((val) => (
            <span
              key={val}
              style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                backgroundColor: "#f3ebe0", border: "1px solid #d6c4a8",
                color: "#6b4c2a", borderRadius: "12px", padding: "2px 10px",
                fontSize: "13px", fontWeight: "500",
              }}
            >
              {getLabel(val)}
              <span onClick={(e) => removeTag(e, val)} style={{ cursor: "pointer", lineHeight: 1, opacity: 0.7, fontSize: "12px" }}>✕</span>
            </span>
          ))
        )}
        <span style={{ marginLeft: "auto", color: "#999", fontSize: "12px" }}>{isOpen ? "▲" : "▼"}</span>
      </div>

      {isOpen && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          backgroundColor: "white", border: "1px solid #ccc", borderRadius: "4px",
          marginTop: "4px", zIndex: 1000, maxHeight: "260px", overflowY: "auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>
          {options.map((option) => {
            const isSel = selected.includes(option.value)
            return (
              <div
                key={option.value}
                onClick={() => toggle(option.value)}
                style={{
                  padding: "9px 12px", cursor: "pointer", display: "flex",
                  alignItems: "center", gap: "10px",
                  backgroundColor: isSel ? "#fdf6ee" : "white",
                  fontSize: "14px", color: "#3d2b1f",
                }}
                onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.backgroundColor = "#faf5ef" }}
                onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.backgroundColor = "white" }}
              >
                <div style={{
                  width: "16px", height: "16px", borderRadius: "3px", flexShrink: 0,
                  border: `1px solid ${isSel ? "#8b5e3c" : "#ccc"}`,
                  backgroundColor: isSel ? "#8b5e3c" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
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
                width: "100%", padding: "8px", backgroundColor: "#8B4513",
                color: "white", border: "none", borderRadius: "4px",
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

export default function PersonalProfessionalOverview({ data = {}, updateData }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleBioChange = (e) => {
    const { value } = e.target
    const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length
    if (wordCount <= 200) updateData({ briefBio: value })
  }

  const getBioWordCount = () => {
    if (!data.briefBio) return 0
    return data.briefBio.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  const memberOfAssociation = data.memberOfAssociation

  return (
    <div className={styles.productApplicationContainer}>
      <h2 className={styles.productApplicationHeading}>Personal & Professional Overview</h2>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}></p>

      <div className={styles.formContent}>
        {/* 1. Personal & Professional Overview */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}></h3>

          <div className={styles.gridContainer}>
            {/* commented fields preserved as-is */}
          </div>

          <div className={styles.gridContainer}>
            <FormField label="Current Employer">
              <input
                type="text"
                name="currentEmployer"
                value={data.currentEmployer || ""}
                onChange={handleChange}
                className={styles.formInput}
              />
            </FormField>

            <FormField label="Professional Headline">
              <input
                type="text"
                name="professionalHeadline"
                value={data.professionalHeadline || ""}
                onChange={handleChange}
                className={styles.formInput}
                placeholder='e.g., "CFO with 15+ years in mining & infrastructure"'
                required
              />
            </FormField>
          </div>

          <FormField label="Brief Bio - 200 words max: expertise, career highlights, passion areas">
            <div style={{ position: 'relative' }}>
              <textarea
                name="briefBio"
                value={data.briefBio || ""}
                onChange={handleBioChange}
                className={styles.formTextarea}
                rows={4}
                placeholder="Describe your expertise, career highlights, and passion areas..."
                required
              />
              <div style={{
                position: 'absolute', bottom: '8px', right: '12px',
                fontSize: '0.8rem',
                color: getBioWordCount() > 200 ? '#ef4444' : '#6b7280',
              }}>
                {getBioWordCount()}/200 words
              </div>
            </div>
          </FormField>

          <FormField label="Years of Experience">
            <select name="yearsOfExperience" value={data.yearsOfExperience || ""} onChange={handleChange} className={styles.formSelect} required>
              <option value="">Select Years of Experience</option>
              {yearsOfExperienceOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        {/* 2. Areas of Expertise */}
        <div style={{ margin: '2rem 0 1rem 0', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}></h3>

          <div className={styles.gridContainer}>
            <FormField label="Functional Expertise">
              <MultiSelectDropdown
                name="functionalExpertise"
                options={functionalExpertiseOptions}
                value={data.functionalExpertise || []}
                onChange={(selectedOptions) => updateData({ functionalExpertise: selectedOptions })}
                placeholder="e.g., Finance, HR, Legal, Strategy, ESG, Tech, Governance"
              />
            </FormField>

            <FormField label="Industry Experience">
              <MultiSelectDropdown
                name="industryExperience"
                options={industryExperienceOptions}
                value={data.industryExperience || []}
                onChange={(selectedOptions) => updateData({ industryExperience: selectedOptions })}
                placeholder="e.g., Agri, Mining, Education, Health, FMCG, Tech"
              />
            </FormField>
          </div>

          <div className={styles.gridContainer}>
            <FormField label="Board Experience">
              <select name="boardExperience" value={data.boardExperience || ""} onChange={handleChange} className={styles.formSelect}>
                <option value="">Select Board Experience</option>
                {boardExperienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Mentorship Experience">
              <select name="mentorshipExperience" value={data.mentorshipExperience || ""} onChange={handleChange} className={styles.formSelect}>
                <option value="">Select Mentorship Experience</option>
                {mentorshipExperienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className={styles.gridContainer}>
            <FormField label="Languages Spoken">
              <MultiSelectDropdown
                name="languagesSpoken"
                options={languagesOptions}
                value={data.languagesSpoken || []}
                onChange={(selectedOptions) => updateData({ languagesSpoken: selectedOptions })}
                placeholder="Select Languages"
              />
            </FormField>

            <FormField label="Region Familiarity">
              <MultiSelectDropdown
                name="regionFamiliarity"
                options={regionFamiliarityOptions}
                value={data.regionFamiliarity || []}
                onChange={(selectedOptions) => updateData({ regionFamiliarity: selectedOptions })}
                placeholder="Africa-wide, Province-specific, etc."
              />
            </FormField>
          </div>
        </div>

        {/* 3. Industry Associations */}
        <div style={{ margin: '2rem 0 1rem 0', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
            Industry Associations
          </h3>

          <div className={styles.gridContainer}>
            <FormField label="Are you a member of any industry association?">
              <div style={{ display: "flex", gap: "16px" }}>
                {["yes", "no"].map((opt) => (
                  <label
                    key={opt}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "8px",
                      padding: "8px 20px", borderRadius: "6px",
                      border: `2px solid ${memberOfAssociation === opt ? "#8B4513" : "#ccc"}`,
                      backgroundColor: memberOfAssociation === opt ? "#fdf6ee" : "white",
                      cursor: "pointer",
                      fontWeight: memberOfAssociation === opt ? "600" : "400",
                      color: memberOfAssociation === opt ? "#6B3410" : "#555",
                      fontSize: "14px", transition: "all 0.2s ease", userSelect: "none",
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
                    <span style={{
                      width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${memberOfAssociation === opt ? "#8B4513" : "#ccc"}`,
                      backgroundColor: memberOfAssociation === opt ? "#8B4513" : "transparent",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>
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
                <AssociationsMultiSelect
                  options={industryAssociations}
                  selected={Array.isArray(data.industryAssociations) ? data.industryAssociations : []}
                  onChange={(value) => updateData({ industryAssociations: value })}
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
    </div>
  )
}