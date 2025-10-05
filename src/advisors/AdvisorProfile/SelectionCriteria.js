"use client"
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import FormField from "./FormField"
import styles from "./AdvisorProfile.module.css"

const preferredAdvisorRoleOptions = [
  { value: "governance-advisor", label: "Governance Advisor" },
  { value: "interim-cfo", label: "Interim CFO" },
  { value: "technical-expert", label: "Technical Expert" },
  { value: "marketing-strategist", label: "Marketing Strategist" },
  { value: "legal-compliance", label: "Legal Compliance" },
  { value: "mentor", label: "Mentor" },
  { value: "board-member", label: "Board Member" },
  { value: "subject-matter-expert", label: "Subject-matter expert" },
]

const advisorySupportTypeOptions = [
  { value: "strategy", label: "Strategy" },
  { value: "fundraising", label: "Fundraising" },
  { value: "governance", label: "Governance" },
  { value: "operations", label: "Operations" },
  { value: "digital_transformation", label: "Digital Transformation" },
]

const smeStageFitOptions = [
   { value: "startup", label: "Startup" },
  { value: "growth", label: "Growth" },
  { value: "scaling", label: "Scaling" },
  { value: "turnaround", label: "Turnaround" },
    { value: "mature", label: "Mature" },
]

const revenueThresholdOptions = [
  { value: "less_than_1m", label: "Revenue <1M" },
  { value: "1_to_5m", label: "1-5M" },
  { value: "5_to_20m", label: "5-20M" },
  { value: "20m_plus", label: "20M+" },
]

const legalEntityFitOptions = [
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
]

const impactFocusOptions = [
  { value: "women_owned", label: "Women-Owned" },
  { value: "youth_led", label: "Youth-Led" },
  { value: "township_based", label: "Township-Based" },
  { value: "green_social_enterprise", label: "Green/Social Enterprise" },
]

const timeCommitmentOptions = [
  { value: "less_than_5", label: "*<5 hrs/month" },
  { value: "5_to_10", label: "5-10 hrs/month" },
  { value: "10_plus", label: "10+ hrs/month*" },
]

const compensationModelOptions = [
  { value: "pro-bono", label: "Pro-Bono" },
  { value: "pre-revenue-pro-bono", label: "Pre-revenue Pro-bono" },
  { value: "equity", label: "Equity" },
  { value: "fee-based", label: "Fee-Based" },
  { value: "hybrid", label: "Hybrid" },
  { value: "hourly-rate", label: "Hourly-Rate" },
  { value: "retainer", label: "Retainer" },
]

const preferredEngagementStyleOptions = [
  { value: "one_on_one_mentorship", label: "One-on-One Mentorship" },
  { value: "group_workshops", label: "Group Workshops" },
  { value: "strategic_board_role", label: "Strategic Board Role" },
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

export default function SelectionCriteria({ data = {}, updateData }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleCheckboxChange = (name, value) => {
    const currentValues = data[name] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value]
    updateData({ [name]: newValues })
  }

  return (
    <div className={styles.productApplicationContainer}>
      <h2 className={styles.productApplicationHeading}>Selection Criteria</h2>

      <div className={styles.formContent}>
        {/* Matching Core */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>

          </h3>

          <div className={styles.gridContainer}>
            <FormField label="Preferred Advisor Role" >
              <MultiSelectDropdown
                name="preferredAdvisorRole"
                options={preferredAdvisorRoleOptions}
                value={data.preferredAdvisorRole || []}
                onChange={(selectedOptions) => updateData({ preferredAdvisorRole: selectedOptions })}
                placeholder="Select Advisor Roles"
                required
              />
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
             
              </div>
            </FormField>

            <FormField label="Advisory Support Type " >
              <MultiSelectDropdown
                name="advisorySupportType"
                options={advisorySupportTypeOptions}
                value={data.advisorySupportType || []}
                onChange={(selectedOptions) => updateData({ advisorySupportType: selectedOptions })}
                placeholder="Select Support Types"
                required
              />
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
               
              </div>
            </FormField>
          </div>

          <div className={styles.gridContainer}>
            <FormField label="SME Stage Fit " >
              <MultiSelectDropdown
                name="smeStageFit"
                options={smeStageFitOptions}
                value={data.smeStageFit || []}
                onChange={(selectedOptions) => updateData({ smeStageFit: selectedOptions })}
                placeholder="Select SME Stages"
                required
              />
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
          
              </div>
            </FormField>

            <FormField label="Revenue Threshold:">
              <select
                name="revenueThreshold"
                value={data.revenueThreshold || ""}
                onChange={handleChange}
                className={styles.formSelect}
              >
                <option value="">Select Revenue Threshold</option>
                {revenueThresholdOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
             
              </div>
            </FormField>
          </div>

          <div className={styles.gridContainer}>
            <FormField label="Legal Entity Fit">
              <select
                name="legalEntityFit"
                value={data.legalEntityFit || ""}
                onChange={handleChange}
                className={styles.formSelect}
              >
                <option value="">Select Legal Entity</option>
                {legalEntityFitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
      
              </div>
            </FormField>

            <FormField label="Impact Focus">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {impactFocusOptions.map((option) => (
                  <label key={option.value} style={{ display: 'flex', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={(data.impactFocus || []).includes(option.value)}
                      onChange={() => handleCheckboxChange('impactFocus', option.value)}
                      style={{ marginRight: '8px', width: '16px', height: '16px' }}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>

              </div>
            </FormField>
          </div>

          <div className={styles.gridContainer}>
            <FormField label="Time Commitment " >
              <select
                name="timeCommitment"
                value={data.timeCommitment || ""}
                onChange={handleChange}
                className={styles.formSelect}
                required
              >
                <option value="">Select Time Commitment</option>
                {timeCommitmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
                
              </div>
            </FormField>

            <FormField label="Compensation Model " >
              <select
                name="compensationModel"
                value={data.compensationModel || ""}
                onChange={handleChange}
                className={styles.formSelect}
                required
              >
                <option value="">Select Compensation Model</option>
                {compensationModelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
               
              </div>
            </FormField>
          </div>

          <FormField label="Preferred Engagement Style">
            <select
              name="preferredEngagementStyle"
              value={data.preferredEngagementStyle || ""}
              onChange={handleChange}
              className={styles.formSelect}
            >
              <option value="">Select Engagement Style</option>
              {preferredEngagementStyleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
              
            </div>
          </FormField>
        </div>
      </div>
    </div>
  )
}