"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import FormField from "./FormField"
import FileUpload from "./FileUpload"
import styles from "./InvestorUniversalProfile.module.css"

// Fund Target Investor Type options
const fundTargetInvestorOptions = [
  { value: "Institutional Limited Partner (LPs)", label: "Institutional Limited Partner (LPs) Only" },
  { value: "Family Offices + HNWIs", label: "Family Offices + HNWIs" },
  { value: "Corporate LPs", label: "Corporate LPs" },
  { value: "Mixed", label: "Mixed (Institutional + Corporate)" },
  { value: "Bank Capital", label: "Bank Capital (if fund accepts bank investments)" },
  { value: "Government Capital", label: "Government Capital (for PPP/DFI-backed funds)" },
]

// Fund Structure options
const fundStructureOptions = [
  { value: "Closed-end", label: "Closed-end" },
  { value: "Open-end", label: "Open-end" },
  { value: "Evergreen", label: "Evergreen" },
  { value: "Fund-of-Funds", label: "Fund-of-Funds" },
]

// Fund Legal Structure options
const fundLegalStructureOptions = [
  { value: "South African Trust - Section 12J VCC (SA)", label: "South African Trust - Section 12J VCC (SA)" },
  { value: "En Commandite Partnership", label: "En Commandite Partnership (Mauritius)" },
  { value: "Protected Cell Company (PCC)", label: "Protected Cell Company (PCC)" },
  { value: "Corporate (Pty Ltd)", label: "Corporate (Pty Ltd)" },
  { value: "Offshore (Specify)", label: "Offshore (Specify)" },
]

// Fund Size options
const fundSizeOptions = [
  { value: "Micro", label: "Micro (<ZAR100M)" },
  { value: "Small", label: "Small (ZAR100M–ZAR500M)" },
  { value: "Mid", label: "Mid (ZAR500M–ZAR1B)" },
  { value: "Large", label: "Large (>ZAR 1B)" },
]

// Revenue Threshold options
const revenueThresholdOptions = [
  { value: "Pre-Revenue", label: "Pre-Revenue" },
  { value: "Under 1m", label: "< ZAR 1M" },
  { value: "1m-5m", label: "ZAR 1M – ZAR 5M" },
  { value: "5m-20m", label: "ZAR 5M – ZAR 20M" },
  { value: "20m-50m", label: "ZAR 20M – ZAR 50M" },
  { value: "over-50m", label: "> ZAR 50M" },
]

// Default empty fund template
const emptyFund = {
  name: "",
  size: "",
  // Structural/organizational details
  targetInvestorType: "",
  captiveFund: false,
  lpComposition: "",
  fundStructure: "",
  fundLegalStructure: "",
  fundLegalStructureOther: "",
  // Fund sizing metrics
  fundSizeCategory: "",
  averageDealSize: "",
  minimumTicket: "",
  maximumTicket: "",
  reservesForFollowOn: false,
  followOnPercentage: "",
  proRataRights: false,
  // Revenue threshold
  revenueThreshold: "",
}

export default function ProductsServices({ data = {}, updateData }) {
  // Initialize with at least one fund by default
  useEffect(() => {
    if (!data.funds || data.funds.length === 0) {
      updateData({
        funds: [{ ...emptyFund }],
      })
    }
  }, [data, updateData])

  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleFileChange = (name, files) => {
    updateData({ [name]: files })
  }

  const addFund = () => {
    const funds = data.funds || []
    updateData({
      funds: [...funds, { ...emptyFund }],
    })
  }

  const updateFund = (index, field, value) => {
    const funds = [...(data.funds || [])]
    funds[index] = { ...funds[index], [field]: value }
    updateData({ funds })
  }

  const removeFund = (index) => {
    const funds = [...(data.funds || [])]
    funds.splice(index, 1)
    updateData({ funds })
  }

  // Checkbox styling
  const checkboxStyle = {
    width: '16px',
    height: '16px',
    accentColor: '#8b4513',
    marginRight: '8px',
    cursor: 'pointer'
  }

  const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#5d4037',
    fontWeight: '500',
    cursor: 'pointer',
    marginBottom: '4px'
  }

  return (
    <div className={`${styles.productApplicationContainer} ${styles.productServiceTop}`}>
      <h2 className={styles.productApplicationHeading}>Fund Details</h2>

     
      <div className={styles.investorSection}>
        <div className={styles.sectionHeader}>
       
          <button type="button" onClick={addFund} className={styles.addButton}>
            <Plus className={styles.icon} /> Add Fund
          </button>
        </div>

        {(data.funds || []).map((fund, fundIndex) => (
          <div key={fundIndex} className={styles.fundCard}>
            <div className={styles.fundHeader}>
              <h5 className={styles.fundTitle}>Fund {fundIndex + 1}</h5>
              {(data.funds || []).length > 1 && (
                <button type="button" onClick={() => removeFund(fundIndex)} className={styles.deleteButton}>
                  <Trash2 className={styles.icon} />
                </button>
              )}
            </div>

            {/* Fund Name and Size */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <FormField label="Fund Name" >
                <input
                  type="text"
                  value={fund.name || ""}
                  onChange={(e) => updateFund(fundIndex, "name", e.target.value)}
                  className={styles.formInput}
                  placeholder="Enter fund name"
                  required
                />
              </FormField>

              <FormField label="Fund Size" >
                <input
                  type="text"
                  value={fund.size || ""}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^\d]/g, '');
                    if (value) value = 'R' + value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    updateFund(fundIndex, "size", value);
                  }}
                  className={styles.formInput}
                  placeholder="R10,000,000"
                  required
                />
              </FormField>
            </div>

            {/* Fund Target Investor Type and Fund Structure */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <FormField label="Fund Target Investor Type" >
                <select
                  value={fund.targetInvestorType || ""}
                  onChange={(e) => updateFund(fundIndex, "targetInvestorType", e.target.value)}
                  className={styles.formInput}
                  required
                >
                  <option value="">Select</option>
                  {fundTargetInvestorOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Fund Structure" >
                <select
                  value={fund.fundStructure || ""}
                  onChange={(e) => updateFund(fundIndex, "fundStructure", e.target.value)}
                  className={styles.formInput}
                  required
                >
                  <option value="">Select</option>
                  {fundStructureOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Captive Fund Checkbox and Fund Legal Structure */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={fund.captiveFund || false}
                    onChange={(e) => updateFund(fundIndex, "captiveFund", e.target.checked)}
                    style={checkboxStyle}
                  />
                  Captive Fund? (If backed by parent entity)
                </label>
              </div>

              <FormField label="Fund Legal Structure (Optional)">
                <select
                  value={fund.fundLegalStructure || ""}
                  onChange={(e) => updateFund(fundIndex, "fundLegalStructure", e.target.value)}
                  className={styles.formInput}
                >
                  <option value="">Select</option>
                  {fundLegalStructureOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {fund.fundLegalStructure === "offshore" && (
                  <input
                    type="text"
                    value={fund.fundLegalStructureOther || ""}
                    onChange={(e) => updateFund(fundIndex, "fundLegalStructureOther", e.target.value)}
                    className={styles.formInput}
                    placeholder="Please specify offshore structure"
                    style={{ marginTop: '8px' }}
                  />
                )}
              </FormField>
            </div>

            {/* LP Composition */}
            <div style={{ marginBottom: '1.5rem' }}>
              <FormField label="LP Composition">
                <input
                  type="text"
                  value={fund.lpComposition || ""}
                  onChange={(e) => updateFund(fundIndex, "lpComposition", e.target.value)}
                  className={styles.formInput}
                  placeholder='E.g., "60% Institutional, 40% Family Offices"'
                  style={{ width: '100%', maxWidth: '400px' }}
                />
              </FormField>
            </div>

            {/* Fund Size Section */}
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <h5 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#5d4037', marginBottom: '1rem' }}>Fund Size (Optional)</h5>
              
              {/* Revenue Threshold and Fund Size Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <FormField label="Revenue Threshold" >
                  <select
                    value={fund.revenueThreshold || ""}
                    onChange={(e) => updateFund(fundIndex, "revenueThreshold", e.target.value)}
                    className={styles.formInput}
                    required
                  >
                    <option value="">Select</option>
                    {revenueThresholdOptions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Fund Size Category">
                  <select
                    value={fund.fundSizeCategory || ""}
                    onChange={(e) => updateFund(fundIndex, "fundSizeCategory", e.target.value)}
                    className={styles.formInput}
                  >
                    <option value="">Select</option>
                    {fundSizeOptions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Average Deal Size, Minimum Ticket, Maximum Ticket */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <FormField label="Average Deal Size" >
                  <input
                    type="text"
                    value={fund.averageDealSize || ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^\d]/g, '');
                      if (value) value = 'R' + value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                      updateFund(fundIndex, "averageDealSize", value);
                    }}
                    className={styles.formInput}
                    placeholder="R500,000"
                    required
                  />
                </FormField>

                <FormField label="Minimum Ticket" >
                  <input
                    type="text"
                    value={fund.minimumTicket || ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^\d]/g, '');
                      if (value) value = 'R' + value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                      updateFund(fundIndex, "minimumTicket", value);
                    }}
                    className={styles.formInput}
                    placeholder="R50,000"
                    required
                  />
                </FormField>

                <FormField label="Maximum Ticket" >
                  <input
                    type="text"
                    value={fund.maximumTicket || ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^\d]/g, '');
                      if (value) value = 'R' + value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                      updateFund(fundIndex, "maximumTicket", value);
                    }}
                    className={styles.formInput}
                    placeholder="R5,000,000"
                    required
                  />
                </FormField>
              </div>

              {/* Checkbox options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={checkboxLabelStyle}>
                    <input
                      type="checkbox"
                      checked={fund.reservesForFollowOn || false}
                      onChange={(e) => updateFund(fundIndex, "reservesForFollowOn", e.target.checked)}
                      style={checkboxStyle}
                    />
                    Reserves for Follow-On?
                  </label>
                  {fund.reservesForFollowOn && (
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#5d4037', marginRight: '8px' }}>Fund allocated:</span>
                      <input
                        type="number"
                        value={fund.followOnPercentage || ""}
                        onChange={(e) => updateFund(fundIndex, "followOnPercentage", e.target.value)}
                        className={styles.formInput}
                        placeholder="25"
                        style={{ width: "80px", marginRight: '4px' }}
                      />
                      <span style={{ fontSize: '14px', color: '#5d4037' }}>%</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={checkboxLabelStyle}>
                    <input
                      type="checkbox"
                      checked={fund.proRataRights || false}
                      onChange={(e) => updateFund(fundIndex, "proRataRights", e.target.checked)}
                      style={checkboxStyle}
                    />
                    Pro Rata Rights? (For follow-on investments)
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}