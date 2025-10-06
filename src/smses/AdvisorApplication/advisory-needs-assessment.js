"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import FormField from "./FormField"
import "./AdvisoryApplication.css"

// Advisory options
const advisoryRoleOptions = [
  { value: "governance-advisor", label: "Governance Advisor" },
  { value: "interim-cfo", label: "Interim CFO" },
  { value: "technical-expert", label: "Technical Expert" },
  { value: "marketing-strategist", label: "Marketing Strategist" },
  { value: "legal-compliance", label: "Legal Compliance" },
  { value: "mentor", label: "Mentor" },
  { value: "board-member", label: "Board Member" },
  { value: "subject-matter-expert", label: "Subject-matter expert" },
  { value: "other", label: "Other" },
]

const supportFocusOptions = [
  { value: "financial-structuring", label: "Financial Structuring" },
  { value: "board-governance", label: "Board Governance" },
  { value: "fundraising", label: "Fundraising" },
  { value: "digital-transformation", label: "Digital Transformation" },
  { value: "esg-strategy", label: "ESG Strategy" },
  { value: "other", label: "Other" },
]

// Functional expertise options
const functionalExpertiseOptions = [
  { value: "finance", label: "Finance" },
  { value: "hr", label: "HR" },
  { value: "legal", label: "Legal" },
  { value: "strategy", label: "Strategy" },
  { value: "esg", label: "ESG" },
  { value: "tech", label: "Tech" },
  { value: "governance", label: "Governance" },
  { value: "other", label: "Other" },
]

const timeCommitmentOptions = [
  { value: "1-5-hours", label: "1-5 hrs/month" },
  { value: "5-10-hours", label: "5-10 hrs/month" },
  { value: "full-time-interim", label: "Full-time Interim" },
]

const compensationTypeOptions = [
  { value: "pro-bono", label: "Pro-Bono" },
  { value: "pre-revenue-pro-bono", label: "Pre-revenue Pro-bono" },
  { value: "equity", label: "Equity" },
  { value: "fee-based", label: "Fee-Based" },
  { value: "hybrid", label: "Hybrid" },
  { value: "hourly-rate", label: "Hourly-Rate" },
  { value: "retainer", label: "Retainer" },
]

const meetingFormatOptions = [
  { value: "virtual", label: "Virtual" },
  { value: "in-person", label: "In-Person" },
  { value: "hybrid", label: "Hybrid" },
]

const provinceOptions = [
  { value: "western-cape", label: "Western Cape" },
  { value: "gauteng", label: "Gauteng" },
  { value: "kwazulu-natal", label: "KwaZulu-Natal" },
  { value: "eastern-cape", label: "Eastern Cape" },
  { value: "free-state", label: "Free State" },
  { value: "limpopo", label: "Limpopo" },
  { value: "mpumalanga", label: "Mpumalanga" },
  { value: "north-west", label: "North West" },
  { value: "northern-cape", label: "Northern Cape" },
]

// MultiSelect Dropdown Component
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

  return (
    <div className="multi-select-container">
      <div className="multi-select-header" onClick={toggleDropdown}>
        {selected.length > 0 ? (
          <div className="selected-items">
            {selected.map((item) => (
              <span key={item} className="selected-item">
                {options.find((opt) => opt.value === item)?.label || item}
              </span>
            ))}
          </div>
        ) : (
          <span className="placeholder">Select {label}</span>
        )}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {isOpen && (
        <div className="multi-select-dropdown">
          <div className="multi-select-options">
            {options.map((option) => (
              <div
                key={option.value}
                className={`multi-select-option ${selected.includes(option.value) ? "selected" : ""}`}
                onClick={() => handleSelect(option.value)}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => {}}
                  className="multi-select-checkbox"
                />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
          <div className="multi-select-actions">
            <button type="button" className="multi-select-button" onClick={closeDropdown}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Component for Advisory Needs Assessment
const AdvisoryNeedsAssessment = ({ data = {}, updateData }) => {
  const updateFormData = (section, newData) => {
    updateData({ ...data, [section]: { ...(data[section] || {}), ...newData } })
  }

  return renderAdvisoryNeedsAssessment(data.advisoryNeedsAssessment || {}, (section, newData) =>
    updateFormData(section, newData),
  )
}

// Rendering function for Advisory Needs Assessment
export const renderAdvisoryNeedsAssessment = (data, updateFormData) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    updateFormData("advisoryNeedsAssessment", { [name]: type === "checkbox" ? checked : value })
  }

  const handleMultiSelectChange = (fieldName, value) => {
    updateFormData("advisoryNeedsAssessment", { [fieldName]: value })
  }

  return (
    <div className="advisory-needs-container">
      <h2>Advisory Needs Assessment (Critical for Matching)</h2>

      {/* Advisory Needs Section */}
      <div className="form-section">
        <h3>Type of Support Needed</h3>

        <div className="form-row">
          <div className="form-column">
            <FormField label="Advisory Role (Multi-select)">
              <MultiSelect
                options={advisoryRoleOptions}
                selected={data.advisoryRole || []}
                onChange={(value) => handleMultiSelectChange("advisoryRole", value)}
                label="Advisory Roles"
              />
            </FormField>
          </div>

          <div className="form-column">
            <FormField label="Support Focus (Multi-select)">
              <MultiSelect
                options={supportFocusOptions}
                selected={data.supportFocus || []}
                onChange={(value) => handleMultiSelectChange("supportFocus", value)}
                label="Support Focus Areas"
              />
            </FormField>
          </div>

          <div className="form-column">
            <FormField label="Functional Expertise (Multi-select)">
              <MultiSelect
                options={functionalExpertiseOptions}
                selected={data.functionalExpertise || []}
                onChange={(value) => handleMultiSelectChange("functionalExpertise", value)}
                label="Functional Expertise"
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* Engagement Preferences Section */}
      <div className="form-section">
        <h3>Engagement Preferences</h3>

        <div className="form-row">
          <div className="form-column">
            <FormField label="Time Commitment Needed">
              <select
                name="timeCommitment"
                value={data.timeCommitment || ""}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Time Commitment</option>
                {timeCommitmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="form-column">
            <FormField label="Compensation Type">
              <select
                name="compensationType"
                value={data.compensationType || ""}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Compensation Type</option>
                {compensationTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </div>

        <div className="form-row">
          <div className="form-column">
            <FormField label="Meeting Format">
              <select
                name="meetingFormat"
                value={data.meetingFormat || ""}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Meeting Format</option>
                {meetingFormatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            {data.meetingFormat === "in-person" && (
              <div className="conditional-field">
                <FormField label="Province">
                  <select
                    name="province"
                    value={data.province || ""}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select Province</option>
                    {provinceOptions.map((province) => (
                      <option key={province.value} value={province.value}>
                        {province.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvisoryNeedsAssessment