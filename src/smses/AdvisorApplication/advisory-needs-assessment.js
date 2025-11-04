"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
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
  { value: "equity", label: "Equity" },
  { value: "fee-based", label: "Fee-Based" },
  { value: "hourly-rate", label: "Hourly Rate" },
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

const bbeeLevels = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6", "Level 7", "Level 8", "Non-compliant"]

const ownershipTypes = ["Black-owned", "Women-owned", "Youth-owned", "Disabled-owned", "None"]

const engagementTypes = ["Once-off", "Ongoing", "Project-based", "Other"]

const deliveryModes = ["On-site", "Remote", "Hybrid"]

const africanCountries = ["South Africa", "Nigeria", "Kenya", "Ghana", "Egypt", "Morocco", "Tanzania", "Uganda", "Ethiopia", "Zimbabwe"]

// Currency formatter function
const formatCurrency = (value) => {
  if (!value) return '';
  const numericValue = value.replace(/[^\d]/g, '');
  if (!numericValue) return '';
  return `R ${parseInt(numericValue).toLocaleString()}`;
};

// MultiSelect Dropdown Component
function MultiSelect({ options, selected = [], onChange, label }) {
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

// Rendering function for Advisory Needs Assessment
const renderAdvisoryNeedsAssessment = (data = {}, updateFormData) => {
  // Initialize advisors array if it doesn't exist
  const advisors = data.advisors || [{
    id: Date.now(),
    advisorName: "",
    advisoryRole: [],
    supportFocus: [],
    functionalExpertise: []
  }]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name === "compensationType") {
      updateFormData("advisoryNeedsAssessment", { 
        [name]: type === "checkbox" ? checked : value,
        compensationAmount: value === "pro-bono" ? "0" : (data.compensationAmount || "")
      })
    } else if (name === "compensationAmount") {
      const formatted = formatCurrency(value)
      updateFormData("advisoryNeedsAssessment", { [name]: formatted })
    } else {
      updateFormData("advisoryNeedsAssessment", { [name]: type === "checkbox" ? checked : value })
    }
  }

  // Advisor handlers
  const addAdvisor = () => {
    const newAdvisors = [...advisors, {
      id: Date.now(),
      advisorName: "",
      advisoryRole: [],
      supportFocus: [],
      functionalExpertise: []
    }]
    updateFormData("advisoryNeedsAssessment", { advisors: newAdvisors })
  }

  const removeAdvisor = (id) => {
    if (advisors.length > 1) {
      const newAdvisors = advisors.filter(advisor => advisor.id !== id)
      updateFormData("advisoryNeedsAssessment", { advisors: newAdvisors })
    }
  }

  const updateAdvisor = (id, field, value) => {
    const newAdvisors = advisors.map(advisor => 
      advisor.id === id ? { ...advisor, [field]: value } : advisor
    )
    updateFormData("advisoryNeedsAssessment", { advisors: newAdvisors })
  }

  // Matching preferences handlers
  const handleOwnershipChange = (type) => {
    const currentValues = data.ownershipPrefs || []
    const updatedValues = currentValues.includes(type)
      ? currentValues.filter((t) => t !== type)
      : [...currentValues, type]

    updateFormData("advisoryNeedsAssessment", { ownershipPrefs: updatedValues })
  }

  const handleCheckboxChange = (field, value) => {
    const currentValues = data[field] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    
    updateFormData("advisoryNeedsAssessment", { [field]: newValues })
  }

  const handleRadioChange = (value) => {
    updateFormData("advisoryNeedsAssessment", { esdProgram: value === 'yes' })
  }

  const handleMatchingChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'minBudget' || name === 'maxBudget') {
      const formattedValue = formatCurrency(value)
      updateFormData("advisoryNeedsAssessment", { [name]: formattedValue })
    } else {
      updateFormData("advisoryNeedsAssessment", { [name]: value })
    }
  }

  const showEngagementTypeOther = data.engagementType === 'Other'

  return (
    <div className="advisory-needs-container">
      <h2>Advisory Needs Assessment (Critical for Matching)</h2>

      {/* Type of Support Needed */}
      <div className="form-section">
        <h3 style={{ marginBottom: "20px" }}>Type of Support Needed</h3>
        
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
          <button
            type="button"
            onClick={addAdvisor}
            className="btn btn-primary"
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            <Plus size={16} /> Add Advisor
          </button>
        </div>

        {advisors.map((advisor, index) => (
          <div key={advisor.id} className="advisor-card" style={{ marginBottom: "20px", padding: "20px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "600" }}>Advisor {index + 1}</h4>
              {advisors.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAdvisor(advisor.id)}
                  className="btn btn-danger"
                  style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", fontSize: "13px" }}
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>

            <FormField label="Advisor Name/Specification">
              <input
                type="text"
                value={advisor.advisorName || ""}
                onChange={(e) => updateAdvisor(advisor.id, "advisorName", e.target.value)}
                placeholder="e.g., Financial Advisory Specialist"
                className="form-input"
              />
            </FormField>

            <div className="form-row">
              <div className="form-column">
                <FormField label="Advisory Role (Multi-select)">
                  <MultiSelect
                    options={advisoryRoleOptions}
                    selected={advisor.advisoryRole || []}
                    onChange={(value) => updateAdvisor(advisor.id, "advisoryRole", value)}
                    label="Advisory Roles"
                  />
                </FormField>
              </div>

              <div className="form-column">
                <FormField label="Support Focus (Multi-select)">
                  <MultiSelect
                    options={supportFocusOptions}
                    selected={advisor.supportFocus || []}
                    onChange={(value) => updateAdvisor(advisor.id, "supportFocus", value)}
                    label="Support Focus Areas"
                  />
                </FormField>
              </div>

              <div className="form-column">
                <FormField label="Functional Expertise (Multi-select)">
                  <MultiSelect
                    options={functionalExpertiseOptions}
                    selected={advisor.functionalExpertise || []}
                    onChange={(value) => updateAdvisor(advisor.id, "functionalExpertise", value)}
                    label="Functional Expertise"
                  />
                </FormField>
              </div>
            </div>
          </div>
        ))}
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

          {data.compensationType && (
            <div className="form-column">
              <FormField label={`Compensation Amount ${data.compensationType === 'hourly-rate' ? '(per hour)' : '(monthly)'}`}>
                <input
                  type="text"
                  name="compensationAmount"
                  value={data.compensationAmount || ""}
                  onChange={handleChange}
                  placeholder="R 0"
                  disabled={data.compensationType === "pro-bono"}
                  className="form-input"
                  style={{
                    backgroundColor: data.compensationType === "pro-bono" ? "#f3f4f6" : "white",
                    cursor: data.compensationType === "pro-bono" ? "not-allowed" : "text"
                  }}
                />
              </FormField>
            </div>
          )}
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

      {/* Urgency & Timeline */}
      <div className="form-section">
        <h3>Urgency & Timeline</h3>

        <div className="grid-container">
          <div>
            <FormField label="Start Date">
              <select
                name="startDate"
                value={data.startDate || ""}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Start Date</option>
                <option value="immediately">Immediately</option>
                <option value="1-3-months">Within 1-3 Months</option>
                <option value="flexible">Flexible</option>
              </select>
            </FormField>
          </div>

          <div>
            <FormField label="Project Duration">
              <select
                name="projectDuration"
                value={data.projectDuration || ""}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Project Duration</option>
                <option value="3-6-months">3-6 Months</option>
                <option value="1-year">1 Year</option>
                <option value="ongoing">Ongoing</option>
              </select>
            </FormField>
          </div>
        </div>
      </div>

      {/* Matching Preferences */}
      <div className="form-section">
        <h3>Matching Preferences</h3>

        <FormField label="Preferred B-BBEE Level">
          <select
            name="bbeeLevel"
            value={data.bbeeLevel || ""}
            onChange={handleMatchingChange}
            className="form-select form-select-small"
          >
            <option value="">Select level</option>
            {bbeeLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Ownership Preferences">
          <div className="checkbox-grid">
            {ownershipTypes.map((type) => (
              <label key={type} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={data.ownershipPrefs?.includes(type) || false}
                  onChange={() => handleOwnershipChange(type)}
                />
                {type}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="Sector Experience Required">
          <textarea
            name="sectorExperience"
            value={data.sectorExperience || ""}
            onChange={handleMatchingChange}
            className="form-textarea"
            rows={3}
          />
        </FormField>

        <div className="grid-container">
          <FormField label="Type of Engagement">
            <select
              name="engagementType"
              value={data.engagementType || ""}
              onChange={handleMatchingChange}
              className="form-select"
            >
              <option value="">Select engagement type</option>
              {engagementTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </FormField>

          {showEngagementTypeOther && (
            <FormField label="Please specify engagement type">
              <input
                type="text"
                name="engagementTypeOther"
                value={data.engagementTypeOther || ""}
                onChange={handleMatchingChange}
                className="form-input"
                placeholder="Please specify the type of engagement"
                required
              />
            </FormField>
          )}

          <FormField label="Preferred Delivery Mode">
            <div className="checkbox-group">
              {deliveryModes.map(mode => (
                <label key={mode} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={(data.deliveryModes || []).includes(mode)}
                    onChange={() => handleCheckboxChange('deliveryModes', mode)}
                  />
                  {mode}
                </label>
              ))}
            </div>
          </FormField>

          <FormField label="Start Date">
            <input
              type="date"
              name="matchingStartDate"
              value={data.matchingStartDate || ""}
              onChange={handleMatchingChange}
              className="form-input"
              min={new Date().toISOString().split('T')[0]}
            />
          </FormField>

          <FormField label="End Date">
            <input
              type="date"
              name="endDate"
              value={data.endDate || ""}
              onChange={handleMatchingChange}
              className="form-input"
              min={data.matchingStartDate || new Date().toISOString().split('T')[0]}
            />
          </FormField>

          <FormField label="Location">
            <select
              name="location"
              value={data.location || ""}
              onChange={handleMatchingChange}
              className="form-select"
            >
              <option value="">Select country</option>
              {africanCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Budget Range (ZAR)">
            <div className="flex-row">
              <input
                type="text"
                name="minBudget"
                value={data.minBudget || ""}
                onChange={handleMatchingChange}
                placeholder="R 0"
                className="form-input"
                style={{ color: data.minBudget ? 'black' : '#9CA3AF' }}
              />
              <span className="mx-2">to</span>
              <input
                type="text"
                name="maxBudget"
                value={data.maxBudget || ""}
                onChange={handleMatchingChange}
                placeholder="R 0"
                className="form-input"
                style={{ color: data.maxBudget ? 'black' : '#9CA3AF' }}
              />
            </div>
          </FormField>

          <FormField label="Linked to ESD/CSR Program?">
            <div className="radio-group">
              <label className="radio-item">
                <input
                  type="radio"
                  name="esdProgram"
                  checked={data.esdProgram === true}
                  onChange={() => handleRadioChange('yes')}
                />
                Yes
              </label>
              <label className="radio-item">
                <input
                  type="radio"
                  name="esdProgram"
                  checked={data.esdProgram === false}
                  onChange={() => handleRadioChange('no')}
                />
                No
              </label>
            </div>
          </FormField>
        </div>
      </div>
    </div>
  )
}

export default renderAdvisoryNeedsAssessment