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

// MultiSelectDropdown component
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
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

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const getSelectedLabels = () => {
    return options.filter((option) => selectedOptions.includes(option.value)).map((option) => option.label)
  }

  return (
    <div className={styles.multiSelectContainer} ref={dropdownRef}>
      <div className={styles.multiSelectHeader} onClick={toggleDropdown} aria-haspopup="listbox" aria-expanded={isOpen}>
        {selectedOptions.length > 0 ? (
          <div className={styles.selectedItems}>
            {getSelectedLabels().map((label) => (
              <span key={label} className={styles.selectedItem}>
                {label}
              </span>
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
                className={`${styles.multiSelectOption} ${
                  selectedOptions.includes(option.value) ? styles.selected : ""
                }`}
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

      {/* Hidden select for form submission */}
      <select
        name={name}
        multiple
        value={selectedOptions}
        onChange={() => {}}
        required={required}
        style={{ display: "none" }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
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
    updateData({ 
      firmType: value,
      firmSubtype: [] // Reset subtype when main type changes
    })
  }

  const handleValueDeployedChange = (e) => {
    let value = e.target.value
    // Remove any existing "R" prefix and non-numeric characters except spaces and commas
    value = value.replace(/^R\s*/, '').replace(/[^\d\s,]/g, '')
    // Add "R " prefix
    const formattedValue = value ? `R ${value}` : ''
    updateData({ valueDeployed: formattedValue })
  }

  const handleFileChange = (name, files) => {
    updateData({ [name]: files })
  }

  // Get subcategory options based on selected firm type
  const getSubtypeOptions = () => {
    if (!data.firmType) return []
    const selectedCategory = firmTypeCategories.find(cat => cat.category === data.firmType)
    return selectedCategory ? selectedCategory.options : []
  }

  return (
    <div className={styles.productApplicationContainer}>
      <h2 className={styles.productApplicationHeading}>Fund Manager Overview​</h2>

      <div className={styles.formContent}>
        {/* Basic Information */}
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

          <FormField label="Financial Year Start Month" required>
            <select
              name="financialYearStart"
              value={data.financialYearStart || ""}
              onChange={handleChange}
              className={styles.formSelect}
              required
            >
              <option value="">Select Financial Year Start Month</option>
              {financialYearMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Regulatory License Number">
            <input
              type="text"
              name="regulatoryLicenseNumber"
              value={data.regulatoryLicenseNumber || ""}
              onChange={handleChange}
              className={styles.formInput}
            />
          </FormField>
        </div>

        <div className={styles.gridContainer} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
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

          <FormField label="Firm Type" required>
            <select
              name="firmType"
              value={data.firmType || ""}
              onChange={handleFirmTypeChange}
              className={styles.formSelect}
              required
            >
              <option value="">Select Firm Type</option>
              {firmTypeCategories.map((category) => (
                <option key={category.category} value={category.category}>
                  {category.category}
                </option>
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
            <select
              name="investorRole"
              value={data.investorRole || ""}
              onChange={handleChange}
              className={styles.formSelect}
              required
            >
              <option value="">Select Investor Role</option>
              {investorRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Years in Operation" required>
            <input
              type="number"
              name="yearsInOperation"
              value={data.yearsInOperation || ""}
              onChange={handleChange}
              className={styles.formInput}
              required
              min="0"
            />
          </FormField>

          <FormField label="Number of Investment Executives" required>
            <input
              type="number"
              name="numberOfInvestmentExecutives"
              value={data.numberOfInvestmentExecutives || ""}
              onChange={handleChange}
              className={styles.formInput}
              required
              min="0"
            />
          </FormField>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Tax Number">
            <input
              type="text"
              name="taxNumber"
              value={data.taxNumber || ""}
              onChange={handleChange}
              className={styles.formInput}
            />
          </FormField>

          <FormField label="VAT Registration Numbers">
            <input
              type="text"
              name="vatRegistrationNumbers"
              value={data.vatRegistrationNumbers || ""}
              onChange={handleChange}
              className={styles.formInput}
            />
          </FormField>
        </div>

        {/* Investment Information Section */}
        <div style={{ margin: '2rem 0 1rem 0', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>Investment Information</h3>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Brief Description" required>
            <textarea
              name="briefDescription"
              value={data.briefDescription || ""}
              onChange={handleChange}
              className={`${styles.formTextarea} ${styles.small}`}
              rows={2}
              placeholder="Brief description of your firm..."
              required
            />
          </FormField>

          <FormField label="Portfolio Companies" required>
            <textarea
              name="portfolioCompanies"
              value={data.portfolioCompanies || ""}
              onChange={handleChange}
              className={`${styles.formTextarea} ${styles.small}`}
              rows={2}
              placeholder="List your portfolio companies..."
              required
            />
          </FormField>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Number of Investments to Date" required>
            <input
              type="number"
              name="numberOfInvestments"
              value={data.numberOfInvestments || ""}
              onChange={handleChange}
              className={styles.formInput}
              required
              min="0"
            />
          </FormField>

          <FormField label="Value Deployed" required>
            <input
              type="text"
              name="valueDeployed"
              value={data.valueDeployed || ""}
              onChange={handleValueDeployedChange}
              className={styles.formInput}
              placeholder="e.g., 10,000,000"
              required
            />
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
            
            {/* Other specification field for Additional Support */}
            {data.additionalSupport && data.additionalSupport.includes("Other") && (
              <div style={{ marginTop: "8px" }}>
                <input
                  type="text"
                  name="additionalSupportOther"
                  value={data.additionalSupportOther || ""}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="Please specify other additional support..."
                  required
                />
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
            
            {/* Other specification field for Additional Services */}
            {data.additionalServices && data.additionalServices.includes("Other") && (
              <div style={{ marginTop: "8px" }}>
                <input
                  type="text"
                  name="additionalServicesOther"
                  value={data.additionalServicesOther || ""}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="Please specify other additional services..."
                />
              </div>
            )}
          </FormField>
        </div>

        <div className={styles.gridContainer} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="How did you hear about us?" required>
            <select
              name="howDidYouHear"
              value={data.howDidYouHear || ""}
              onChange={handleChange}
              className={styles.formSelect}
              required
            >
              <option value="">Select how you heard about us</option>
              {howDidYouHearOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {data.howDidYouHear === "Other" && (
              <div style={{ marginTop: "8px" }}>
                <input
                  type="text"
                  name="howDidYouHearOther"
                  value={data.howDidYouHearOther || ""}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="Please specify..."
                  required
                />
              </div>
            )}
          </FormField>
        </div>
      </div>
    </div>
  )
}