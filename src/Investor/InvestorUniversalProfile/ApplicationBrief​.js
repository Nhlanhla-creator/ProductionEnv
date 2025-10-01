"use client"

import FormField from "./FormField"
import styles from "./InvestorUniversalProfile.module.css"

// Core Documents options
const coreDocumentsOptions = [
  { value: "pitch_deck", label: "Pitch Deck" },
  { value: "financials", label: "Company Registration (CIPC)" },
  { value: "business_plan", label: "Business Plan" },
  { value: "market_analysis", label: "Proof of Address (Utility Bill, Lease Agreement)" },
  { value: "team_bios", label: "Tax Clearance Certificate" },
  { value: "compliance_cert", label: "B-BBEE Certificate" },
  { value: "certificates", label: "VAT/UIF/PAYE/COIDA Certificates" },
  { value: "reports", label: "Previous Program Reports" },
  { value: "letters", label: "Support Letters / Endorsements" },
  { value: "other", label: "Other" },
]

// Conditional Documents options
const conditionalDocumentsOptions = [
  { value: "asset_register", label: "Asset Register" },
  { value: "bank_statements", label: "Bank Statements (6 months)" },
 { value: "bank-details", label: "Bank Details Confirmation Letter" },
  
  { value: "cap_table", label: "Cap Table" },
  { value: "shareholder_agreements", label: "Shareholder Agreements" },
  { value: "other", label: "Other" },
]

export default function ApplicationDetails({ data = {}, updateData }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleCheckboxChange = (category, value) => {
    const currentValues = data[category] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value]
    updateData({ [category]: newValues })
  }

  // Checkbox styling
  const checkboxStyle = {
    width: '18px',
    height: '18px',
    accentColor: '#8b4513',
    marginRight: '12px',
    cursor: 'pointer',
    borderRadius: '4px'
  }

  const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    fontSize: '14px',
    color: '#5d4037',
    cursor: 'pointer',
    padding: '8px 0',
    lineHeight: '1.4'
  }

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    border: '1px solid #d2b48c',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(139, 69, 19, 0.1)'
  }

  const headerStyle = {
    backgroundColor: '#372c27',
    color: 'white',
    padding: '16px',
    fontWeight: '600',
    fontSize: '16px',
    textAlign: 'left'
  }

  const subHeaderStyle = {
    backgroundColor: '#f5e6d3',
    color: '#5d4037',
    padding: '12px 16px',
    fontWeight: '600',
    fontSize: '14px',
    borderBottom: '1px solid #d2b48c'
  }

  const cellStyle = {
    padding: '16px',
    borderBottom: '1px solid #e8d5b7',
    verticalAlign: 'top'
  }

  const conditionalCellStyle = {
    padding: '12px 16px',
    backgroundColor: '#faf8f5',
    borderBottom: '1px solid #e8d5b7'
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>Application Details</h2>

      <div className={styles.formWrapper}>
        {/* 1. Overview and Objectives */}
        <div className={styles.section}>
          <h3 className={styles.subSectionTitle}>1. Overview and Objectives</h3>
          <p className={styles.helperText}>
            (A short paragraph on what you are looking for (e.g., "We fund growth-stage South African SMEs in agritech with proven revenues above R2M. Our focus is high-impact, scalable businesses.")
          </p>
          <FormField label="">
            <textarea
              name="overviewObjectives"
              value={data.overviewObjectives || ""}
              onChange={handleChange}
              rows={4}
              className={styles.input}
              placeholder="Enter your fund's overview and objectives..."
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
              placeholder="Enter application instructions..."
            />
          </FormField>
        </div>

        {/* 3. Application Timelines */}
        <div className={styles.section}>
          <h3 className={styles.subSectionTitle}>3. Application Timelines</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <FormField label="Estimated Review Time" >
              <input
                type="text"
                name="estimatedReviewTime"
                value={data.estimatedReviewTime || ""}
                onChange={handleChange}
                className={styles.input}
                placeholder="e.g., 3-4 weeks"
                required
              />
            </FormField>

            <FormField label="Typical Deal Closing Time" >
              <input
                type="text"
                name="typicalDealClosingTime"
                value={data.typicalDealClosingTime || ""}
                onChange={handleChange}
                className={styles.input}
                placeholder="e.g., 6-8 weeks after final approval"
                required
              />
            </FormField>
          </div>

          <FormField label="Application Window" >
            <input
              type="text"
              name="applicationWindow"
              value={data.applicationWindow || ""}
              onChange={handleChange}
              className={styles.input}
              placeholder="e.g., Rolling / Open until [Date]"
              style={{ maxWidth: '400px' }}
              required
            />
          </FormField>
        </div>

        {/* 4. Mandatory Documents for SMSE Application - CLEAN TABLE FORMAT */}
        <div className={styles.section}>
          <h3 className={styles.subSectionTitle}>4. Mandatory Documents for SMSE Application</h3>
          
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={headerStyle}>
                  Core Documents
                  <div style={{ fontSize: '13px', fontWeight: 'normal', marginTop: '4px', opacity: '0.9' }}>
                    Required for all applications
                  </div>
                </th>
                <th style={headerStyle}>
                  Conditional Documents
                  <div style={{ fontSize: '13px', fontWeight: 'normal', marginTop: '4px', opacity: '0.9' }}>
                    Based on investment type
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...cellStyle, width: '50%', verticalAlign: 'top' }}>
                  {/* Core Documents Checkboxes */}
                  <div>
                    {coreDocumentsOptions.map((option) => (
                      <label key={option.value} style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={(data.coreDocuments || []).includes(option.value)}
                          onChange={() => handleCheckboxChange('coreDocuments', option.value)}
                          style={checkboxStyle}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                    
                    {(data.coreDocuments || []).includes('other') && (
                      <div style={{ marginTop: '12px', marginLeft: '30px' }}>
                        <input
                          type="text"
                          name="coreDocumentsOther"
                          value={data.coreDocumentsOther || ""}
                          onChange={handleChange}
                          className={styles.input}
                          placeholder="Please specify other core documents..."
                          style={{ width: '100%', maxWidth: '280px' }}
                        />
                      </div>
                    )}
                  </div>
                </td>

                <td style={{ ...cellStyle, width: '50%', verticalAlign: 'top' }}>
                  {/* If Debt Section */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ 
                      fontWeight: '600',
                      color: '#8b4513',
                      fontSize: '14px',
                      marginBottom: '12px',
                      paddingBottom: '6px',
                      borderBottom: '2px solid #dca06d'
                    }}>
                      If Debt Investment:
                    </div>
                    <div>
                      <label style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={(data.debtDocuments || []).includes('asset_register')}
                          onChange={() => handleCheckboxChange('debtDocuments', 'asset_register')}
                          style={checkboxStyle}
                        />
                        <span>Asset Register</span>
                      </label>
                      <label style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={(data.debtDocuments || []).includes('bank_statements')}
                          onChange={() => handleCheckboxChange('debtDocuments', 'bank_statements')}
                          style={checkboxStyle}
                        />
                        <span>Bank Statements (6 months)</span>
                      </label>
                    </div>
                  </div>

                  {/* If Equity Section */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ 
                      fontWeight: '600',
                      color: '#372c27',
                      fontSize: '14px',
                      marginBottom: '12px',
                      paddingBottom: '6px',
                    borderBottom: '2px solid #dca06d'
                    }}>
                      If Equity Investment:
                    </div>
                    <div>
                      <label style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={(data.equityDocuments || []).includes('cap_table')}
                          onChange={() => handleCheckboxChange('equityDocuments', 'cap_table')}
                          style={checkboxStyle}
                        />
                        <span>Cap Table</span>
                      </label>
                      <label style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={(data.equityDocuments || []).includes('shareholder_agreements')}
                          onChange={() => handleCheckboxChange('equityDocuments', 'shareholder_agreements')}
                          style={checkboxStyle}
                        />
                        <span>Shareholder Agreements</span>
                      </label>
                    </div>
                  </div>

                  {/* Additional Documents */}
                  <div>
                    <div style={{ 
                      fontWeight: '600',
                      color: '#666',
                      fontSize: '14px',
                      marginBottom: '12px',
                      paddingBottom: '6px',
                      borderBottom: '2px solid #ccc'
                    }}>
                      Additional Documents:
                    </div>
                    <div>
                      <input
                        type="text"
                        name="otherConditionalDocuments"
                        value={data.otherConditionalDocuments || ""}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="Please specify any additional documents..."
                        style={{ width: '100%', maxWidth: '280px' }}
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
          <h3 className={styles.subSectionTitle}>5. Evaluation Criteria</h3>
          <FormField label="">
            <textarea
              name="evaluationCriteria"
              value={data.evaluationCriteria || ""}
              onChange={handleChange}
              rows={4}
              className={styles.input}
              placeholder='"We prioritize SMEs with scalable models, strong traction, and operational maturity. BIG Score above 70 required."'
            />
          </FormField>
        </div>

        {/* 6. Impact alignment */}
        <div className={styles.section}>
          <h3 className={styles.subSectionTitle}>6. Impact alignment</h3>
          <FormField label="">
            <textarea
              name="impactAlignment"
              value={data.impactAlignment || ""}
              onChange={handleChange}
              rows={3}
              className={styles.input}
              placeholder='e.g. "We prioritise SMEs that address "ESG" or that are "B-BBEE level 2 maximum"'
            />
          </FormField>
        </div>
      </div>
    </div>
  )
}