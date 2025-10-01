"use client"
import { useState } from "react"
import "./universalProfile.css"

const ProgramSponsorProgramDetails = ({ data, updateData, onComplete }) => {
  const [formData, setFormData] = useState({
    programType: data?.programType || "",
    programmeName: data?.programmeName || "",
    duration: data?.duration || "",
    stipendValue: data?.stipendValue || "",
    totalInternsPlaced: data?.totalInternsPlaced || "",
    smeContribution: data?.smeContribution || "",
    reportingPreference: data?.reportingPreference || "",
  })

  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    updateData && updateData(newData)
  }

  return (
    <div className="program-details-container">
      <h2>Program Details</h2>
      <div className="form-content">
        <p>
          Please provide specific details about your internship/training programs to help us better understand your
          offerings.
        </p>

        <div className="form-grid-2x2">
          <div className="form-group">
            <label>Program Type *</label>
            <select
              className="form-input"
              value={formData.programType}
              onChange={(e) => handleInputChange("programType", e.target.value)}
            >
              <option value="">Select program type</option>
              <option value="SETA program">SETA program</option>
              <option value="YES program">YES program</option>
              <option value="Skills development">Skills development</option>
              <option value="Graduate program">Graduate program</option>
              <option value="Vacation work">Vacation work</option>
            </select>
          </div>

          <div className="form-group">
            <label>Programme Name *</label>
            <input
              type="text"
              placeholder="e.g., SETA Digital Internship 2024"
              className="form-input"
              value={formData.programmeName}
              onChange={(e) => handleInputChange("programmeName", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Duration (Typical) *</label>
            <select
              className="form-input"
              value={formData.duration}
              onChange={(e) => handleInputChange("duration", e.target.value)}
            >
              <option value="">Select duration</option>
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">12 months</option>
            </select>
          </div>

          <div className="form-group">
            <label>Stipend Value (Typical) *</label>
            <input
              type="text"
              placeholder="e.g., R3,500/month"
              className="form-input"
              value={formData.stipendValue}
              onChange={(e) => handleInputChange("stipendValue", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Total Interns Placed This Year *</label>
            <input
              type="number"
              placeholder="e.g., 250"
              className="form-input"
              value={formData.totalInternsPlaced}
              onChange={(e) => handleInputChange("totalInternsPlaced", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>SME Contribution (if any)</label>
            <input
              type="text"
              placeholder="e.g., None or Transport only"
              className="form-input"
              value={formData.smeContribution}
              onChange={(e) => handleInputChange("smeContribution", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Reporting Preference *</label>
            <select
              className="form-input"
              value={formData.reportingPreference}
              onChange={(e) => handleInputChange("reportingPreference", e.target.value)}
            >
              <option value="">Select preference</option>
              <option value="PDF">PDF Reports</option>
              <option value="Excel">Excel Spreadsheets</option>
              <option value="Portal">Portal Access</option>
            </select>
          </div>
        </div>

    
      </div>
    </div>
  )
}

export default ProgramSponsorProgramDetails