"use client"
import "./AdvisoryApplication.css"
import FormField from "./FormField"

export const renderUrgencyTimeline = (data, updateFormData) => {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateFormData("urgencyTimeline", { [name]: value })
  }

  return (
    <>
      <h2>Urgency & Timeline</h2>

      <div className="grid-container">
        <div>
          <FormField label="Start Date" >
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
          <FormField label="Project Duration" >
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
    </>
  )
}
