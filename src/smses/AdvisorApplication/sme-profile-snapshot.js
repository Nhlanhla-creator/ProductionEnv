"use client"
import "./AdvisoryApplication.css"
import FormField from "./FormField"

export const renderSMEProfileSnapshot = (data, updateFormData) => {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateFormData("smeProfileSnapshot", { [name]: value })
  }

  const businessStageOptions = [
 
      { value: "startup", label: "Startup" },
  { value: "growth", label: "Growth" },
  { value: "scaling", label: "Scaling" },
  { value: "turnaround", label: "Turnaround" },
    { value: "mature", label: "Mature" },
  ]

  return (
    <>
      <h2>SME Profile Snapshot</h2>

      <div className="grid-container">
        <div>
          <FormField label="Company Name">
            <input
              type="text"
              name="companyName"
              value={data.companyName || ""}
              onChange={handleChange}
              className="form-input"
              disabled
            />
          </FormField>

          <FormField label="Sector" tooltip="Auto-filled but editable">
            <input
              type="text"
              name="sector"
              value={data.sector || ""}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Technology, Manufacturing, Healthcare"
            />
          </FormField>
        </div>

        <div>
          <FormField label="Business Stage" tooltip="Auto-filled based on existing data">
            <select
              name="businessStage"
              value={data.businessStage || ""}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Select Business Stage</option>
              {businessStageOptions.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Current PIS Score" tooltip="Performance Indicator Score based on latest assessment">
            <input
              type="text"
              name="currentPISScore"
              value={data.currentPISScore || ""}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., 45/100 – Governance Gap Detected"
              disabled
            />
          </FormField>
        </div>
      </div>
    </>
  )
}
