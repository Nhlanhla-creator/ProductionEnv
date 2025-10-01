"use client"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import "./universalProfile.css"

const ProgramSponsorEntityOverview = ({ data, updateData, onComplete }) => {
  const [formData, setFormData] = useState({
    organizationName: data?.organizationName || "",
    entityType: data?.entityType || "",
    registrationNumber: data?.registrationNumber || "",
    regionCovered: data?.regionCovered || [],
  })

  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false)

  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    updateData && updateData(newData)
  }

  const handleRegionChange = (region) => {
    const newRegions = formData.regionCovered.includes(region)
      ? formData.regionCovered.filter((r) => r !== region)
      : [...formData.regionCovered, region]
    handleInputChange("regionCovered", newRegions)
  }

  const regions = [
    "National",
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "Northern Cape",
    "North West",
    "Western Cape",
  ]

  return (
    <div className="entity-overview-container">
      <h2>Entity Overview</h2>
      <div className="form-content">
        <p>Please provide information about your organization to help us understand your entity better.</p>

        <div className="form-grid-2x2">
          <div className="form-group">
            <label>Organisation Name *</label>
            <input
              type="text"
              placeholder="e.g., YES South Africa"
              className="form-input"
              value={formData.organizationName}
              onChange={(e) => handleInputChange("organizationName", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Entity Type *</label>
            <select
              className="form-input"
              value={formData.entityType}
              onChange={(e) => handleInputChange("entityType", e.target.value)}
            >
              <option value="">Select entity type</option>
              <option value="SETA">SETA</option>
              <option value="Corporate">Corporate</option>
              <option value="NPO">NPO</option>
              <option value="Government">Government</option>
            </select>
          </div>

          <div className="form-group">
            <label>Registration Number</label>
            <input
              type="text"
              placeholder="Optional - Enter registration number"
              className="form-input"
              value={formData.registrationNumber}
              onChange={(e) => handleInputChange("registrationNumber", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Region Covered *</label>
            <div className="region-dropdown-container">
              <div className="region-dropdown-trigger" onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}>
                <div className="selected-regions-display">
                  {formData.regionCovered.length === 0 ? (
                    <span className="placeholder">Select regions covered</span>
                  ) : (
                    <span className="selected-count">
                      {formData.regionCovered.length} region{formData.regionCovered.length !== 1 ? "s" : ""} selected
                    </span>
                  )}
                </div>
                {isRegionDropdownOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>

              {isRegionDropdownOpen && (
                <div className="region-dropdown-menu">
                  {regions.map((region) => (
                    <label key={region} className="region-option">
                      <input
                        type="checkbox"
                        checked={formData.regionCovered.includes(region)}
                        onChange={() => handleRegionChange(region)}
                      />
                      <span className="region-name">{region}</span>
                    </label>
                  ))}
                </div>
              )}

              {formData.regionCovered.length > 0 && (
                <div className="selected-regions-tags">
                  {formData.regionCovered.map((region) => (
                    <span key={region} className="region-tag">
                      {region}
                      <button type="button" onClick={() => handleRegionChange(region)} className="remove-tag">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

       
      </div>
    </div>
  )
}

export default ProgramSponsorEntityOverview
