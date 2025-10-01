"use client"
import FormField from "./FormField"
import FileUpload from "./FileUpload"
import "./FundingApplication.css"

// Component for Growth Potential
const GrowthPotential = ({ data = {}, updateData }) => {
  const updateFormData = (section, newData) => {
    updateData({ ...data, [section]: { ...(data[section] || {}), ...newData } })
  }

  return renderGrowthPotential(data.growthPotential || {}, (section, newData) => updateFormData(section, newData))
}

// Rendering function for Growth Potential
export const renderGrowthPotential = (data, updateFormData) => {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateFormData("growthPotential", { [name]: value })
  }

  const handleFileChange = (name, files) => {
    updateFormData("growthPotential", { [name]: files })
  }

  return (
    <>
      <h2>Growth Potential</h2>

      <div className="grid-container">
        <div>
          <FormField label="Market Share - Will market shares be secured or increased for the entity?" >
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="marketShare"
                  value="yes"
                  checked={data.marketShare === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="marketShare"
                  value="no"
                  checked={data.marketShare === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {data.marketShare === "yes" && (
              <div className="specification-field">
                <textarea
                  name="marketShareDetails"
                  value={data.marketShareDetails || ""}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Please explain how market shares will be secured or increased"
                  rows={3}
                ></textarea>
              </div>
            )}
          </FormField>

          <FormField
            label="Quality Improvement - Will prices be lowered and/or will the quality of the products increase for this project?"

          >
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="qualityImprovement"
                  value="yes"
                  checked={data.qualityImprovement === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="qualityImprovement"
                  value="no"
                  checked={data.qualityImprovement === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {data.qualityImprovement === "yes" && (
              <div className="specification-field">
                <textarea
                  name="qualityImprovementDetails"
                  value={data.qualityImprovementDetails || ""}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Please explain how prices will be lowered or quality improved"
                  rows={3}
                ></textarea>
              </div>
            )}
          </FormField>

          <FormField
            label="Green Technology and Resource Efficiency Improvements - Will the project improve environmental sustainability or resource efficiency?"
      
          >
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="greenTech"
                  value="yes"
                  checked={data.greenTech === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="greenTech"
                  value="no"
                  checked={data.greenTech === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {data.greenTech === "yes" && (
              <div className="specification-field">
                <textarea
                  name="greenTechDetails"
                  value={data.greenTechDetails || ""}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Please describe the environmental or resource efficiency improvements"
                  rows={3}
                ></textarea>
              </div>
            )}
          </FormField>

          <FormField
            label="Localisation - Would there be an increase in the localisation of production activities?"
      
          >
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="localisation"
                  value="yes"
                  checked={data.localisation === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="localisation"
                  value="no"
                  checked={data.localisation === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {data.localisation === "yes" && (
              <div className="specification-field">
                <textarea
                  name="localisationDetails"
                  value={data.localisationDetails || ""}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Please explain how production activities will be localized"
                  rows={3}
                ></textarea>
              </div>
            )}
          </FormField>
        </div>

        <div>
          <FormField
            label="Regional Spread - Will this project be located in rural areas or areas with unemployment higher than 25%?"
        
          >
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="regionalSpread"
                  value="yes"
                  checked={data.regionalSpread === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="regionalSpread"
                  value="no"
                  checked={data.regionalSpread === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {data.regionalSpread === "yes" && (
              <div className="specification-field">
                <input
                  type="text"
                  name="regionalSpreadDetails"
                  value={data.regionalSpreadDetails || ""}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Please specify the location and unemployment rate"
                />
              </div>
            )}
          </FormField>

          <FormField label="Personal Risk - Any financial and/or non-financial contribution to the business?" >
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="personalRisk"
                  value="yes"
                  checked={data.personalRisk === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="personalRisk"
                  value="no"
                  checked={data.personalRisk === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {data.personalRisk === "yes" && (
              <div className="specification-field">
                <textarea
                  name="personalRiskDetails"
                  value={data.personalRiskDetails || ""}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Please describe your financial and/or non-financial contributions"
                  rows={3}
                ></textarea>
              </div>
            )}
          </FormField>

          <FormField label="Empowerment - Achieve at least a level Three (3) B-BBEE contributor?" >
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="empowerment"
                  value="yes"
                  checked={data.empowerment === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="empowerment"
                  value="no"
                  checked={data.empowerment === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {data.empowerment === "yes" && (
              <div className="specification-field">
                <input
                  type="text"
                  name="empowermentDetails"
                  value={data.empowermentDetails || ""}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Please specify your current or target B-BBEE level"
                />
              </div>
            )}
          </FormField>

          <FormField label="Employment – will this project increase direct and indirect labour?" >
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="employment"
                  value="yes"
                  checked={data.employment === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="employment"
                  value="no"
                  checked={data.employment === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {data.employment === "yes" && (
              <div className="specification-field">
                <div className="grid-container">
                  <FormField label="By how many direct jobs?">
                    <input
                      type="number"
                      name="employmentIncreaseDirect"
                      value={data.employmentIncreaseDirect || ""}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Number of direct jobs"
                    />
                  </FormField>
                  <FormField label="By how many indirect jobs?">
                    <input
                      type="number"
                      name="employmentIncreaseIndirect"
                      value={data.employmentIncreaseIndirect || ""}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Number of indirect jobs"
                    />
                  </FormField>
                </div>
              </div>
            )}
          </FormField>
        </div>
      </div>

      {/* <div className="section-divider">
        <h3>Required Documents</h3>

        <FileUpload
          label="Support Letters / Endorsements (if any)"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          multiple
          onChange={(files) => handleFileChange("supportLetters", files)}
          value={data.supportLetters || []}
        />
      </div> */}
    </>
  )
}

export default GrowthPotential
