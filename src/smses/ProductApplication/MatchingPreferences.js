"use client"
import FormField from "./FormField"
import { bbeeLevels, ownershipTypes, engagementTypes, deliveryModes, africanCountries } from "./applicationOptions"
import "./ProductApplication.css"

// Currency formatter
const formatCurrency = (value) => {
  if (!value) return ""
  const numericValue = value.replace(/[^\d]/g, "")
  if (!numericValue) return ""
  return `R ${parseInt(numericValue).toLocaleString()}`
}

/**
 * MatchingPreferences — step 2 of the product application form.
 *
 * When used inside ProductApplication (embedded mode), `onSubmit` is provided
 * and this component ONLY calls it — all Firestore persistence is handled by
 * the parent. The component never writes to Firestore itself, which prevents
 * the double-save duplication bug that created multiple application documents.
 */
const MatchingPreferences = ({ data = {}, updateData, onSubmit }) => {
  const formData = {
    bbeeLevel: "",
    ownershipPrefs: [],
    sectorExperience: "",
    engagementType: "",
    engagementTypeOther: "",
    deliveryModes: [],
    startDate: "",
    endDate: "",
    location: "",
    minBudget: "",
    maxBudget: "",
    esdProgram: null,
    ...data,
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === "minBudget" || name === "maxBudget") {
      updateData({ ...formData, [name]: formatCurrency(value) })
    } else {
      updateData({ ...formData, [name]: value })
    }
  }

  const handleOwnershipChange = (type) => {
    const current = formData.ownershipPrefs || []
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    updateData({ ...formData, ownershipPrefs: updated })
  }

  const handleCheckboxChange = (field, value) => {
    const current = formData[field] || []
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    updateData({ ...formData, [field]: next })
  }

  const handleRadioChange = (value) => {
    updateData({ ...formData, esdProgram: value === "yes" })
  }

  const allOwnershipTypes = ownershipTypes.includes("None") ? ownershipTypes : [...ownershipTypes, "None"]
  const showEngagementTypeOther = formData.engagementType === "Other"

  return (
    <div className="matching-preferences-form">
      <h2>Matching Preferences</h2>

      <FormField label="Preferred B-BBEE Level">
        <select
          name="bbeeLevel"
          value={formData.bbeeLevel || ""}
          onChange={handleChange}
          className="form-select form-select-small"
        >
          <option value="">Select level</option>
          {bbeeLevels.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Ownership Preferences">
        <div className="checkbox-grid">
          {allOwnershipTypes.map((type) => (
            <label key={type} className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.ownershipPrefs?.includes(type) || false}
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
          value={formData.sectorExperience || ""}
          onChange={handleChange}
          className="form-textarea"
          rows={3}
        />
      </FormField>

      <div className="grid-container">
        <FormField label="Type of Engagement">
          <select
            name="engagementType"
            value={formData.engagementType}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select engagement type</option>
            {engagementTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </FormField>

        {showEngagementTypeOther && (
          <FormField label="Please specify engagement type">
            <input
              type="text"
              name="engagementTypeOther"
              value={formData.engagementTypeOther}
              onChange={handleChange}
              className="form-input"
              placeholder="Please specify the type of engagement"
              required
            />
          </FormField>
        )}

        <FormField label="Preferred Delivery Mode">
          <div className="checkbox-group">
            {deliveryModes.map((mode) => (
              <label key={mode} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={formData.deliveryModes.includes(mode)}
                  onChange={() => handleCheckboxChange("deliveryModes", mode)}
                />
                {mode}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="Start Date">
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="form-input"
            min={new Date().toISOString().split("T")[0]}
          />
        </FormField>

        <FormField label="End Date">
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="form-input"
            min={formData.startDate || new Date().toISOString().split("T")[0]}
          />
        </FormField>

        <FormField label="Location">
          <select
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select country</option>
            {africanCountries.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Budget Range (ZAR)">
          <div className="flex-row">
            <input
              type="text"
              name="minBudget"
              value={formData.minBudget}
              onChange={handleChange}
              placeholder="R 0"
              className="form-input"
              style={{ color: formData.minBudget ? "black" : "#9CA3AF" }}
            />
            <span className="mx-2">to</span>
            <input
              type="text"
              name="maxBudget"
              value={formData.maxBudget}
              onChange={handleChange}
              placeholder="R 0"
              className="form-input"
              style={{ color: formData.maxBudget ? "black" : "#9CA3AF" }}
            />
          </div>
        </FormField>

        <FormField label="Linked to ESD/CSR Program?">
          <div className="radio-group">
            <label className="radio-item">
              <input
                type="radio"
                name="esdProgram"
                checked={formData.esdProgram === true}
                onChange={() => handleRadioChange("yes")}
              />
              Yes
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="esdProgram"
                checked={formData.esdProgram === false}
                onChange={() => handleRadioChange("no")}
              />
              No
            </label>
          </div>
        </FormField>
      </div>

      {/* Submit button — delegates entirely to the parent via onSubmit */}
      <div
        className="action-buttons"
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          alignItems: "center",
          marginTop: 30,
          padding: "20px 0",
          borderTop: "1px solid #eee",
          width: "100%",
        }}
      >
        <button
          type="button"
          onClick={onSubmit}
          disabled={!onSubmit}
          className="btn btn-primary"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "12px 24px",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            minWidth: 140,
            justifyContent: "center",
            opacity: onSubmit ? 1 : 0.5,
            cursor: onSubmit ? "pointer" : "not-allowed",
          }}
        >
          Submit Application
        </button>
      </div>
    </div>
  )
}

export default MatchingPreferences