"use client"

import FormField from "./FormField"
import "./AdvisoryApplication.css"

// Barrier options for growth challenges
const barrierOptions = [
  { value: "access-to-finance", label: "Access to Finance" },
  { value: "market-access", label: "Market Access" },
  { value: "skills-shortage", label: "Skills Shortage" },
  { value: "regulatory-compliance", label: "Regulatory Compliance" },
  { value: "technology-adoption", label: "Technology Adoption" },
  { value: "operational-efficiency", label: "Operational Efficiency" },
  { value: "strategic-planning", label: "Strategic Planning" },
  { value: "governance-structure", label: "Governance Structure" },
  { value: "financial-management", label: "Financial Management" },
  { value: "marketing-sales", label: "Marketing & Sales" },
  { value: "supply-chain", label: "Supply Chain Management" },
  { value: "human-resources", label: "Human Resources" },
  { value: "legal-issues", label: "Legal Issues" },
  { value: "competition", label: "Competition" },
  { value: "other", label: "Other" },
]

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
]

const supportFocusOptions = [
  { value: "financial-structuring", label: "Financial Structuring" },
  { value: "board-governance", label: "Board Governance" },
  { value: "fundraising", label: "Fundraising" },
  { value: "digital-transformation", label: "Digital Transformation" },
  { value: "esg-strategy", label: "ESG Strategy" },
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

  const handleMultiSelect = (fieldName) => (e) => {
    const { value, checked } = e.target
    let currentValues = [...(data[fieldName] || [])]

    if (checked) {
      currentValues.push(value)
    } else {
      currentValues = currentValues.filter((item) => item !== value)
    }

    updateFormData("advisoryNeedsAssessment", { [fieldName]: currentValues })
  }

  const handleFileChange = (name, files) => {
    updateFormData("advisoryNeedsAssessment", { [name]: files })
  }

  // Check if "other" is selected in barriers
  const isOtherBarrierSelected = (data.barriers || []).includes("other")

  return (
    <div className="advisory-needs-container">
      <h2>Advisory Needs Assessment (Critical for Matching)</h2>

      {/* Advisory Needs Section */}
      <div className="form-section">
        <h3>Type of Support Needed</h3>

        <div className="form-row">
          <div className="form-column">
            <FormField label="Advisory Role (Multi-select)" >
              <div className="checkbox-grid">
                {advisoryRoleOptions.map((role) => (
                  <label key={role.value} className="form-checkbox-label">
                    <input
                      type="checkbox"
                      name="advisoryRole"
                      value={role.value}
                      checked={(data.advisoryRole || []).includes(role.value)}
                      onChange={handleMultiSelect("advisoryRole")}
                      className="form-checkbox"
                    />
                    <span>{role.label}</span>
                  </label>
                ))}
              </div>
            </FormField>
          </div>

          <div className="form-column">
            <FormField label="Support Focus (Multi-select)" >
              <div className="checkbox-grid">
                {supportFocusOptions.map((option) => (
                  <label key={option.value} className="form-checkbox-label">
                    <input
                      type="checkbox"
                      name="supportFocus"
                      value={option.value}
                      checked={(data.supportFocus || []).includes(option.value)}
                      onChange={handleMultiSelect("supportFocus")}
                      className="form-checkbox"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </FormField>
          </div>
        </div>
      </div>

      {/* Engagement Preferences Section */}
      <div className="form-section">
        <h3>Engagement Preferences</h3>

        <div className="form-row">
          <div className="form-column">
            <FormField label="Time Commitment Needed" >
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
            <FormField label="Compensation Type" >
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
                <FormField label="Province" >
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