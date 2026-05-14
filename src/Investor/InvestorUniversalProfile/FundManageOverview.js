"use client"
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import FormField from "./FormField"
import FileUpload from "./FileUpload"
import styles from "./InvestorUniversalProfile.module.css"
import ViewUniversalProfile from "./Investortestview"

const firmTypeCategories = [
  {
    category: "Institutional Investor",
    options: [
      { value: "Pension Funds", label: "Pension Funds" },
      { value: "Insurance Companies", label: "Insurance Companies" },
      { value: "Endowments & Foundations", label: "Endowments & Foundations" },
      { value: "Sovereign Wealth Funds", label: "Sovereign Wealth Funds" },
    ]
  },
  {
    category: "Independent Firm",
    options: [
      { value: "Venture Capital (VC)", label: "Venture Capital (VC)" },
      { value: "Private Equity (PE)", label: "Private Equity (PE)" },
      { value: "Hedge Fund", label: "Hedge Fund" },
      { value: "Family Office", label: "Family Office" },
    ]
  },
  {
    category: "Bank-Affiliated Entity",
    options: [
      { value: "Commercial Bank Subsidiary", label: "Commercial Bank Subsidiary" },
      { value: "Investment Bank Arm", label: "Investment Bank Arm" },
      { value: "Captive Bank Fund", label: "Captive Bank Fund" },
    ]
  },
  {
    category: "Government-Backed Entity",
    options: [
      { value: "Development Finance Institution (DFI)", label: "Development Finance Institution (DFI)" },
      { value: "State-Owned Investment Fund", label: "State-Owned Investment Fund" },
      { value: "Public-Private Partnership (PPP)", label: "Public-Private Partnership (PPP)" },
    ]
  },
  {
    category: "Corporate Investor",
    options: [
      { value: "Corporate Venture Capital (CVC)", label: "Corporate Venture Capital (CVC)" },
      { value: "Captive Corporate Fund", label: "Captive Corporate Fund" },
    ]
  },
  {
    category: "Individual Investor",
    options: [
      { value: "Angel Investor", label: "Angel Investor" },
      { value: "High-Net-Worth Individual (HNWI)", label: "High-Net-Worth Individual (HNWI)" },
    ]
  },
]

const legalEntityTypes = [
  { value: "Private Company (Pty Ltd)", label: "Private Company (Pty Ltd)" },
  { value: "Public Company (Ltd)", label: "Public Company (Ltd)" },
  { value: "Partnership", label: "Partnership" },
  { value: "Sole Proprietorship", label: "Sole Proprietorship" },
]

const investorRoles = [
  { value: "Lead Investor", label: "Lead Investor" },
  { value: "Co-investor", label: "Co-investor" },
  { value: "Syndicate Member", label: "Syndicate Member" },
  { value: "Limited Partner", label: "Limited Partner" },
  { value: "General Partner", label: "General Partner" },
]

const additionalSupportOptions = [
  { value: "Incubation", label: "Incubation" },
  { value: "Governance Support", label: "Governance Support" },
  { value: "Network Access", label: "Network Access" },
  { value: "None", label: "None" },
  { value: "Other", label: "Other" },
]

const additionalServicesOptions = [
  { value: "Consulting/Advisory", label: "Consulting/Advisory" },
  { value: "Legal and Compliance", label: "Legal and Compliance" },
  { value: "Tax and Accounting", label: "Tax and Accounting" },
  { value: "Administration", label: "Administration" },
  { value: "Other", label: "Other" },
]

const howDidYouHearOptions = [
  { value: "Referral", label: "Referral" },
  { value: "Online Search", label: "Online Search" },
  { value: "Social Media", label: "Social Media" },
  { value: "Industry Event", label: "Industry Event" },
  { value: "Advertisement", label: "Advertisement" },
  { value: "Other", label: "Other" },
]

const financialYearMonths = [
  { value: "January", label: "January" },
  { value: "February", label: "February" },
  { value: "March", label: "March" },
  { value: "April", label: "April" },
  { value: "May", label: "May" },
  { value: "June", label: "June" },
  { value: "July", label: "July" },
  { value: "August", label: "August" },
  { value: "September", label: "September" },
  { value: "October", label: "October" },
  { value: "November", label: "November" },
  { value: "December", label: "December" },
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

// MultiSelectDropdown for associations (earth-tone pill style)
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
    <div style={{ position: "relative" }} data-assoc-multiselect="true">
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

// Original MultiSelectDropdown (for other fields)
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

  useEffect(() => {
    setSelectedOptions(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleOption = (optionValue) => {
    let newSelectedOptions
    if (selectedOptions.includes(optionValue)) {
      newSelectedOptions = selectedOptions.filter((value) => value !== optionValue)
    } else {
      newSelectedOptions = [...selectedOptions, optionValue]
    }
    setSelectedOptions(newSelectedOptions)
    onChange(newSelectedOptions)
  }

  const toggleDropdown = () => setIsOpen(!isOpen)

  const getSelectedLabels = () =>
    options.filter((option) => selectedOptions.includes(option.value)).map((option) => option.label)

  return (
    <div className={styles.multiSelectContainer} ref={dropdownRef}>
      <div className={styles.multiSelectHeader} onClick={toggleDropdown} aria-haspopup="listbox" aria-expanded={isOpen}>
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
            <button type="button" className={styles.multiSelectButton} onClick={() => setIsOpen(false)}>
              Done
            </button>
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

export default function EntityOverview({ data = {}, updateData }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleFirmTypeChange = (e) => {
    const { value } = e.target
    updateData({ firmType: value, firmSubtype: [] })
  }

  const handleValueDeployedChange = (e) => {
    let value = e.target.value
    value = value.replace(/^R\s*/, '').replace(/[^\d\s,]/g, '')
    const formattedValue = value ? `R ${value}` : ''
    updateData({ valueDeployed: formattedValue })
  }

  const handleFileChange = (name, files) => {
    updateData({ [name]: files })
  }

  const getSubtypeOptions = () => {
    if (!data.firmType) return []
    const selectedCategory = firmTypeCategories.find(cat => cat.category === data.firmType)
    return selectedCategory ? selectedCategory.options : []
  }

  const memberOfAssociation = data.memberOfAssociation

  // Handle association selection - ensures data is properly saved
  const handleAssociationChange = (selectedValues) => {
    updateData({ industryAssociations: selectedValues })
  }

  return (
    <div className={styles.productApplicationContainer}>
      <h2 className={styles.productApplicationHeading}>Fund Manager Overview​</h2>

      <div className={styles.formContent}>
        {/* Basic Information */}
        <div className={styles.gridContainer}>
          <FormField label="Registered Name" required>
            <input type="text" name="registeredName" value={data.registeredName || ""} onChange={handleChange} className={styles.formInput} required />
          </FormField>
          <FormField label="Trading Name (if different)">
            <input type="text" name="tradingName" value={data.tradingName || ""} onChange={handleChange} className={styles.formInput} />
          </FormField>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Registration Number" required>
            <input type="text" name="registrationNumber" value={data.registrationNumber || ""} onChange={handleChange} className={styles.formInput} required />
          </FormField>
          <FormField label="Financial Year Start Month" required>
            <select name="financialYearStart" value={data.financialYearStart || ""} onChange={handleChange} className={styles.formSelect} required>
              <option value="">Select Financial Year Start Month</option>
              {financialYearMonths.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Regulatory License Number">
            <input type="text" name="regulatoryLicenseNumber" value={data.regulatoryLicenseNumber || ""} onChange={handleChange} className={styles.formInput} />
          </FormField>
        </div>

        <div className={styles.gridContainer} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <FormField label="Legal Entity of Firm" required>
            <select name="legalEntityType" value={data.legalEntityType || ""} onChange={handleChange} className={styles.formSelect} required>
              <option value="">Select Legal Entity Type</option>
              {legalEntityTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Firm Type" required>
            <select name="firmType" value={data.firmType || ""} onChange={handleFirmTypeChange} className={styles.formSelect} required>
              <option value="">Select Firm Type</option>
              {firmTypeCategories.map((category) => (
                <option key={category.category} value={category.category}>{category.category}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Firm Subtype" required={!!data.firmType}>
            <MultiSelectDropdown
              name="firmSubtype"
              options={getSubtypeOptions()}
              value={data.firmSubtype || []}
              onChange={(selectedOptions) => updateData({ firmSubtype: selectedOptions })}
              placeholder={data.firmType ? "Select Firm Subtypes" : "Select Firm Type first"}
              required={!!data.firmType}
            />
          </FormField>
        </div>

        <div className={styles.gridContainer} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <FormField label="Investor Role" required>
            <select name="investorRole" value={data.investorRole || ""} onChange={handleChange} className={styles.formSelect} required>
              <option value="">Select Investor Role</option>
              {investorRoles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Years in Operation" required>
            <input type="number" name="yearsInOperation" value={data.yearsInOperation || ""} onChange={handleChange} className={styles.formInput} required min="0" />
          </FormField>
          <FormField label="Number of Investment Executives" required>
            <input type="number" name="numberOfInvestmentExecutives" value={data.numberOfInvestmentExecutives || ""} onChange={handleChange} className={styles.formInput} required min="0" />
          </FormField>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Tax Number">
            <input type="text" name="taxNumber" value={data.taxNumber || ""} onChange={handleChange} className={styles.formInput} />
          </FormField>
          <FormField label="VAT Registration Numbers">
            <input type="text" name="vatRegistrationNumbers" value={data.vatRegistrationNumbers || ""} onChange={handleChange} className={styles.formInput} />
          </FormField>
        </div>

        {/* Investment Information Section */}
        <div style={{ margin: '2rem 0 1rem 0', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>Investment Information</h3>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Brief Description" required>
            <textarea name="briefDescription" value={data.briefDescription || ""} onChange={handleChange} className={`${styles.formTextarea} ${styles.small}`} rows={2} placeholder="Brief description of your firm..." required />
          </FormField>
          <FormField label="Portfolio Companies" required>
            <textarea name="portfolioCompanies" value={data.portfolioCompanies || ""} onChange={handleChange} className={`${styles.formTextarea} ${styles.small}`} rows={2} placeholder="List your portfolio companies..." required />
          </FormField>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Number of Investments to Date" required>
            <input type="number" name="numberOfInvestments" value={data.numberOfInvestments || ""} onChange={handleChange} className={styles.formInput} required min="0" />
          </FormField>
          <FormField label="Value Deployed" required>
            <input type="text" name="valueDeployed" value={data.valueDeployed || ""} onChange={handleValueDeployedChange} className={styles.formInput} placeholder="e.g., 10,000,000" required />
          </FormField>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Additional Support Offered" required>
            <MultiSelectDropdown
              name="additionalSupport"
              options={additionalSupportOptions}
              value={data.additionalSupport || []}
              onChange={(selectedOptions) => updateData({ additionalSupport: selectedOptions })}
              placeholder="Select Additional Support"
              required
            />
            {data.additionalSupport && data.additionalSupport.includes("Other") && (
              <div style={{ marginTop: "8px" }}>
                <input type="text" name="additionalSupportOther" value={data.additionalSupportOther || ""} onChange={handleChange} className={styles.formInput} placeholder="Please specify other additional support..." required />
              </div>
            )}
          </FormField>
          <FormField label="Additional Services Offered">
            <MultiSelectDropdown
              name="additionalServices"
              options={additionalServicesOptions}
              value={data.additionalServices || []}
              onChange={(selectedOptions) => updateData({ additionalServices: selectedOptions })}
              placeholder="Select Additional Services"
            />
            {data.additionalServices && data.additionalServices.includes("Other") && (
              <div style={{ marginTop: "8px" }}>
                <input type="text" name="additionalServicesOther" value={data.additionalServicesOther || ""} onChange={handleChange} className={styles.formInput} placeholder="Please specify other additional services..." />
              </div>
            )}
          </FormField>
        </div>

        <div className={styles.gridContainer} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="How did you hear about us?" required>
            <select name="howDidYouHear" value={data.howDidYouHear || ""} onChange={handleChange} className={styles.formSelect} required>
              <option value="">Select how you heard about us</option>
              {howDidYouHearOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {data.howDidYouHear === "Other" && (
              <div style={{ marginTop: "8px" }}>
                <input type="text" name="howDidYouHearOther" value={data.howDidYouHearOther || ""} onChange={handleChange} className={styles.formInput} placeholder="Please specify..." required />
              </div>
            )}
          </FormField>
        </div>

        {/* ── INDUSTRY ASSOCIATIONS ── */}
        <div style={{ margin: '2rem 0 1rem 0', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>Industry Associations</h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            Select the industry associations you belong to. This helps match you with relevant opportunities and allows associations to see your firm in their ecosystem.
          </p>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Are you a member of any industry association?">
            <div style={{ display: "flex", gap: "16px", marginBottom: memberOfAssociation === "yes" ? "1rem" : 0 }}>
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
                onChange={handleAssociationChange}
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

        {/* Help text for Investors */}
        {memberOfAssociation === "yes" && (
          <div style={{
            marginTop: "16px",
            padding: "12px 16px",
            backgroundColor: "#f0f7f0",
            borderLeft: "4px solid #4CAF50",
            borderRadius: "4px",
            fontSize: "14px",
            color: "#2e7d32",
          }}>
            <strong>📌 Note:</strong> The associations you select here will be able to see your firm in their investor ecosystem. 
            This helps connect you with relevant opportunities and partnerships through shared industry networks.
          </div>
        )}

        {memberOfAssociation === "no" && (
          <div style={{
            marginTop: "16px",
            padding: "12px 16px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
            fontSize: "14px",
            color: "#666",
          }}>
            <strong>ℹ️ Note:</strong> You indicated that you are not a member of any industry association. 
            You can update this later if needed. Selecting associations helps with visibility in the ecosystem.
          </div>
        )}
      </div>
    </div>
  )
}