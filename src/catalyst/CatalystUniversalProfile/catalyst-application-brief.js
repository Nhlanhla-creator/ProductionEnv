"use client"
import React from "react"
import FormField from "./FormField"
import styles from "./catalyst-universal-profile.module.css"

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

// Documents that can be requested from the SME document vault
const smeVaultDocumentOptions = [
  { value: "signed_nda", label: "Signed NDA" },
  { value: "signed_contracts", label: "Signed Contracts" },
  { value: "registration_certificate", label: "Company Registration Certificate" },
  { value: "certified_ids", label: "Certified IDs (Directors/Shareholders)" },
  { value: "share_register", label: "Share Register" },
  { value: "proof_of_address_vault", label: "Proof of Address" },
  { value: "tax_clearance_vault", label: "Tax Clearance Certificate" },
  { value: "vat_certificate", label: "VAT Certificate" },
  { value: "bbbee_cert_vault", label: "B-BBEE Certificate" },
  { value: "financial_statements_vault", label: "Financial Statements" },
  { value: "management_accounts", label: "Management Accounts" },
  { value: "bank_statements_vault", label: "Bank Statements" },
  { value: "company_profile_vault", label: "Company Profile" },
  { value: "org_structure", label: "Organisational Structure" },
  { value: "client_references", label: "Client References" },
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

  const checkboxStyle = {
    width: "16px",
    height: "16px",
    accentColor: "#8b4513",
    marginRight: "10px",
    cursor: "pointer",
    flexShrink: 0,
  }

  const checkboxLabelStyle = {
    display: "flex",
    alignItems: "flex-start",
    fontSize: "14px",
    color: "#5d4037",
    cursor: "pointer",
    padding: "6px 0",
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
    padding: "14px 16px",
    fontWeight: "600",
    fontSize: "14px",
    textAlign: "left",
    letterSpacing: "0.04em",
  }

  const headerSubStyle = {
    fontSize: "12px",
    fontWeight: "normal",
    marginTop: "3px",
    opacity: "0.85",
    letterSpacing: "0.02em",
  }

  const cellStyle = {
    padding: "16px",
    borderBottom: "1px solid #e8d5b7",
    verticalAlign: "top",
  }

  const subHeadingStyle = {
    fontWeight: "600",
    fontSize: "13px",
    marginBottom: "10px",
    paddingBottom: "6px",
    borderBottom: "2px solid #dca06d",
  }

  const requestedVaultDocs = Array.isArray(data.cohortVaultDocuments) ? data.cohortVaultDocuments : []

  return (
    <div>
      <h2 className={styles.sectionTitle}>Application Brief</h2>
      <div className={styles.formWrapper}>

        {/* ── Section 1 REMOVED (now lives in Program Brief & Matching Preference) ── */}

        {/* 2. Instructions for Applicants */}
        <div className={styles.section}>
          <h3 className={styles.subSectionTitle}>1. Instructions for Applicants</h3>
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
          <h3 className={styles.subSectionTitle}>2. Application Timelines</h3>
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
          <h3 className={styles.subSectionTitle}>3. Required Documents for Program Application</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={headerStyle}>
                  CORE DOCUMENTS
                  <div style={headerSubStyle}>Required for all applications</div>
                </th>
                <th style={headerStyle}>
                  ADDITIONAL DOCUMENTS
                  <div style={headerSubStyle}>Based on program type and stage</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...cellStyle, width: "50%", verticalAlign: "top" }}>
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
                    <div style={{ marginTop: "10px", marginLeft: "26px" }}>
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
                </td>
                <td style={{ ...cellStyle, width: "50%", verticalAlign: "top" }}>

                  {/* Grant/Funding */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ ...subHeadingStyle, color: "#8b4513" }}>If Grant/Funding Program:</div>
                    {[
                      { key: "financial_statements", label: "Financial Statements" },
                      { key: "bank_statements", label: "Bank Statements (3-6 months)" },
                      { key: "bank_details", label: "Bank Details Confirmation" },
                    ].map(({ key, label }) => (
                      <label key={key} style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={(data.grantDocuments || []).includes(key)}
                          onChange={() => handleCheckboxChange("grantDocuments", key)}
                          style={checkboxStyle}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Training/Mentorship */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ ...subHeadingStyle, color: "#372c27" }}>If Training/Mentorship Program:</div>
                    {[
                      { key: "skills_assessment", label: "Skills Assessment / CV" },
                      { key: "business_licenses", label: "Business Licenses / Permits" },
                    ].map(({ key, label }) => (
                      <label key={key} style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={(data.trainingDocuments || []).includes(key)}
                          onChange={() => handleCheckboxChange("trainingDocuments", key)}
                          style={checkboxStyle}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Impact/Social */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ ...subHeadingStyle, color: "#2d5a3d" }}>If Impact/Social Program:</div>
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

                  {/* Additional */}
                  <div>
                    <div style={{ ...subHeadingStyle, color: "#666" }}>Additional Documents:</div>
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

                </td>
              </tr>
            </tbody>
          </table>
        </div>

       
        {/* 5. Evaluation / Selection Criteria */}
        <div className={styles.section}>
          <h3 className={styles.subSectionTitle}>4. Selection Criteria</h3>
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

        {/* 6. Impact Alignment */}
        <div className={styles.section}>
          <h3 className={styles.subSectionTitle}>5. Impact Alignment</h3>
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