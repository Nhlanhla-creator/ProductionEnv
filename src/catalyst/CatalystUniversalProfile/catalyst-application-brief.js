"use client"
import React from "react"
import FormField from "./FormField"
import styles from "./catalyst-universal-profile.module.css"

// Core Documents options
const coreDocumentsOptions = [
  { value: "business_profile", label: "Business Profile / Overview" },
  { value: "company_registration", label: "Company Registration (CIPC)" },
  { value: "business_plan", label: "Business Plan" },
  { value: "proof_of_address", label: "Proof of Address (Utility Bill, Lease Agreement)" },
  { value: "tax_clearance", label: "Tax Clearance Certificate" },
  { value: "bbbee_certificate", label: "B-BBEE Certificate" },
  { value: "compliance_certificates", label: "VAT/UIF/PAYE/COIDA Certificates" },
  { value: "previous_program_reports", label: "Previous Program Participation Reports" },
  { value: "recommendation_letters", label: "Recommendation Letters / References" },
  { value: "other", label: "Other" },
]

export default function CatalystApplicationBrief({ data = {}, updateData }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleCheckboxChange = (category, value) => {
    const currentValues = data[category] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value]
    updateData({ [category]: newValues })
  }

  // Checkbox styling
  const checkboxStyle = {
    width: "18px",
    height: "18px",
    accentColor: "#8b4513",
    marginRight: "12px",
    cursor: "pointer",
    borderRadius: "4px",
  }

  const checkboxLabelStyle = {
    display: "flex",
    alignItems: "flex-start",
    fontSize: "14px",
    color: "#5d4037",
    cursor: "pointer",
    padding: "8px 0",
    lineHeight: "1.4",
  }

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "white",
    border: "1px solid #d2b48c",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(139, 69, 19, 0.1)",
  }

  const headerStyle = {
    backgroundColor: "#372c27",
    color: "white",
    padding: "16px",
    fontWeight: "600",
    fontSize: "16px",
    textAlign: "left",
  }

  const cellStyle = {
    padding: "16px",
    borderBottom: "1px solid #e8d5b7",
    verticalAlign: "top",
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>Application Brief</h2>
      <div className={styles.formWrapper}>
        {/* 1. Overview and Objectives */}
        <div className={styles.section}>
          <h3 className={styles.subSectionTitle}>1. Program Overview and Objectives</h3>
          <p className={styles.helperText}>
            (A short paragraph on what support you provide (e.g., "We support early-stage South African entrepreneurs
            with grants, mentorship, and training. Our focus is on scalable businesses with social impact in underserved
            communities.")
          </p>
          <FormField label="">
            <textarea
              name="overviewObjectives"
              value={data.overviewObjectives || ""}
              onChange={handleChange}
              rows={4}
              className={styles.input}
              placeholder="Enter your program's overview and objectives..."
            />
          </FormField>
        </div>

        {/* 2. Instructions for Applying */}
        <div className={styles.section}>
          <h3 className={styles.subSectionTitle}>2. Instructions for Applicants</h3>
          <FormField label="">
            <textarea
              name="instructionsForApplying"
              value={data.instructionsForApplying || ""}
              onChange={handleChange}
              rows={4}
              className={styles.input}
              placeholder="Enter application instructions and requirements..."
            />
          </FormField>
        </div>

        {/* 3. Application Timelines */}
        <div className={styles.section}>
          <h3 className={styles.subSectionTitle}>3. Application Timelines</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <FormField label="Estimated Review Time" required>
              <input
                type="text"
                name="estimatedReviewTime"
                value={data.estimatedReviewTime || ""}
                onChange={handleChange}
                className={styles.input}
                placeholder="e.g., 2-3 weeks"
                required
              />
            </FormField>
            <FormField label="Program Onboarding Time" required>
              <input
                type="text"
                name="programOnboardingTime"
                value={data.programOnboardingTime || ""}
                onChange={handleChange}
                className={styles.input}
                placeholder="e.g., 1-2 weeks after approval"
                required
              />
            </FormField>
          </div>
          <FormField label="Application Window" required>
            <input
              type="text"
              name="applicationWindow"
              value={data.applicationWindow || ""}
              onChange={handleChange}
              className={styles.input}
              placeholder="e.g., Rolling / Open until [Date] / Quarterly Intake"
              style={{ maxWidth: "400px" }}
              required
            />
          </FormField>
        </div>

        {/* 4. Required Documents for Program Application */}
        <div className={styles.section}>
          <h3 className={styles.subSectionTitle}>4. Required Documents for Program Application</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={headerStyle}>
                  Core Documents
                  <div style={{ fontSize: "13px", fontWeight: "normal", marginTop: "4px", opacity: "0.9" }}>
                    Required for all applications
                  </div>
                </th>
                <th style={headerStyle}>
                  Additional Documents
                  <div style={{ fontSize: "13px", fontWeight: "normal", marginTop: "4px", opacity: "0.9" }}>
                    Based on program type and stage
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...cellStyle, width: "50%", verticalAlign: "top" }}>
                  {/* Core Documents Checkboxes */}
                  <div>
                    {coreDocumentsOptions.map((option) => (
                      <label key={option.value} style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={(data.coreDocuments || []).includes(option.value)}
                          onChange={() => handleCheckboxChange("coreDocuments", option.value)}
                          style={checkboxStyle}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                    {(data.coreDocuments || []).includes("other") && (
                      <div style={{ marginTop: "12px", marginLeft: "30px" }}>
                        <input
                          type="text"
                          name="coreDocumentsOther"
                          value={data.coreDocumentsOther || ""}
                          onChange={handleChange}
                          className={styles.input}
                          placeholder="Please specify other core documents..."
                          style={{ width: "100%", maxWidth: "280px" }}
                        />
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ ...cellStyle, width: "50%", verticalAlign: "top" }}>
                  {/* Grant/Funding Programs */}
                  <div style={{ marginBottom: "24px" }}>
                    <div
                      style={{
                        fontWeight: "600",
                        color: "#8b4513",
                        fontSize: "14px",
                        marginBottom: "12px",
                        paddingBottom: "6px",
                        borderBottom: "2px solid #dca06d",
                      }}
                    >
                      If Grant/Funding Program:
                    </div>
                    <div>
                      <label style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={(data.grantDocuments || []).includes("financial_statements")}
                          onChange={() => handleCheckboxChange("grantDocuments", "financial_statements")}
                          style={checkboxStyle}
                        />
                        <span>Financial Statements</span>
                      </label>
                      <label style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={(data.grantDocuments || []).includes("bank_statements")}
                          onChange={() => handleCheckboxChange("grantDocuments", "bank_statements")}
                          style={checkboxStyle}
                        />
                        <span>Bank Statements (3-6 months)</span>
                      </label>
                      <label style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={(data.grantDocuments || []).includes("bank_details")}
                          onChange={() => handleCheckboxChange("grantDocuments", "bank_details")}
                          style={checkboxStyle}
                        />
                        <span>Bank Details Confirmation</span>
                      </label>
                    </div>
                  </div>

                  {/* Training/Mentorship Programs */}
                  <div style={{ marginBottom: "24px" }}>
                    <div
                      style={{
                        fontWeight: "600",
                        color: "#372c27",
                        fontSize: "14px",
                        marginBottom: "12px",
                        paddingBottom: "6px",
                        borderBottom: "2px solid #dca06d",
                      }}
                    >
                      If Training/Mentorship Program:
                    </div>
                    <div>
                      <label style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={(data.trainingDocuments || []).includes("skills_assessment")}
                          onChange={() => handleCheckboxChange("trainingDocuments", "skills_assessment")}
                          style={checkboxStyle}
                        />
                        <span>Skills Assessment / CV</span>
                      </label>
                      <label style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={(data.trainingDocuments || []).includes("business_licenses")}
                          onChange={() => handleCheckboxChange("trainingDocuments", "business_licenses")}
                          style={checkboxStyle}
                        />
                        <span>Business Licenses / Permits</span>
                      </label>
                    </div>
                  </div>

                  {/* Impact/Social Programs */}
                  <div style={{ marginBottom: "24px" }}>
                    <div
                      style={{
                        fontWeight: "600",
                        color: "#2d5a3d",
                        fontSize: "14px",
                        marginBottom: "12px",
                        paddingBottom: "6px",
                        borderBottom: "2px solid #dca06d",
                      }}
                    >
                      If Impact/Social Program:
                    </div>
                    <div>
                      <label style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={(data.impactDocuments || []).includes("impact_measurement")}
                          onChange={() => handleCheckboxChange("impactDocuments", "impact_measurement")}
                          style={checkboxStyle}
                        />
                        <span>Impact Measurement Reports</span>
                      </label>
                    </div>
                  </div>

                  {/* Additional Documents */}
                  <div>
                    <div
                      style={{
                        fontWeight: "600",
                        color: "#666",
                        fontSize: "14px",
                        marginBottom: "12px",
                        paddingBottom: "6px",
                        borderBottom: "2px solid #ccc",
                      }}
                    >
                      Additional Documents:
                    </div>
                    <div>
                      <input
                        type="text"
                        name="otherAdditionalDocuments"
                        value={data.otherAdditionalDocuments || ""}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="Please specify any additional documents..."
                        style={{ width: "100%", maxWidth: "280px" }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. Evaluation Criteria */}
        <div className={styles.section}>
          <h3 className={styles.subSectionTitle}>5. Selection Criteria</h3>
          <FormField label="">
            <textarea
              name="evaluationCriteria"
              value={data.evaluationCriteria || ""}
              onChange={handleChange}
              rows={4}
              className={styles.input}
              placeholder='e.g., "We prioritize entrepreneurs with innovative solutions, clear business potential, and commitment to social impact. Strong leadership and coachability are essential."'
            />
          </FormField>
        </div>

        {/* 6. Impact alignment */}
        <div className={styles.section}>
          <h3 className={styles.subSectionTitle}>6. Impact Alignment</h3>
          <FormField label="">
            <textarea
              name="impactAlignment"
              value={data.impactAlignment || ""}
              onChange={handleChange}
              rows={3}
              className={styles.input}
              placeholder='e.g., "We prioritize businesses that address social challenges, create jobs in underserved communities, or promote environmental sustainability. B-BBEE Level 2 or higher preferred."'
            />
          </FormField>
        </div>
      </div>
    </div>
  )
}