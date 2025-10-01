"use client"

import { useState, useEffect } from "react"
import FormField from "./FormField"
import { Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
import "./FundingApplication.css" // Regular CSS import

// Funding Instrument options - added "Any" option
const fundingInstrumentOptions = [
  { value: "Any", label: "Any" },
  { value: "Equity", label: "Equity (Buying shares in the business)" },
  { value: "Debt", label: "Debt (Loan-based funding)" },
  { value: "Grants", label: "Grants (Non-repayable funding)" },
  { value: "Convertible Notes", label: "Convertible Notes (Loan that can turn into shares)" },
  { value: "Revenue-based Financing", label: "Revenue-based Financing" },
  { value: "Other", label: "Other (please specify)" },
]

const equityType = [
  { value: "0-20%", label: "0-20%" },
  { value: "20-30%", label: "20-30%" },
  { value: "40-50%", label: "40-50%" },
  { value: ">50%", label: " >50%" },
  { value: "Any", label: "Any" },
]

// Type of Funder options - added "Any" option
const funderTypeOptions = [
  { value: "Any", label: "Any" },
  { value: "Venture Capital", label: "Venture Capital" },
  { value: "Angel Investment", label: "Angel Investment" },
  { value: "Private Equity", label: "Private Equity" },
  { value: "Government Fund", label: "Government Fund" },
  { value: "Grant / Non-Profit", label: "Grant / Non-Profit" },
  { value: "Development Finance", label: "Development Finance" },
  { value: "Corporate Investment", label: "Corporate Investment" },
  { value: "Other (specify)", label: "Other (specify)" },
]

// Updated Funding Category options
const fundingCategoryOptions = [
  { value: "Business Establishment (New ventures only)", label: "Business Establishment (New ventures only)" },
  { value: "Capital Expenditure (CapEx) - Physical/long-term assets", label: "Capital Expenditure (CapEx) - Physical/long-term assets" },
  { value: "Working Capital - Short-term operational liquidity", label: "Working Capital - Short-term operational liquidity" },
  { value: "Growth & Market Expansion - Revenue-driving investments", label: "Growth & Market Expansion - Revenue-driving investments" },
  { value: "Product & Innovation - R&D and commercialization", label: "Product & Innovation - R&D and commercialization" },
  { value: "Operational Efficiency - Process optimization", label: "Operational Efficiency - Process optimization" },
  { value: "Sales & Marketing - Customer acquisition", label: "Sales & Marketing - Customer acquisition" },
  { value: "Debt Refinancing - Balance sheet management", label: "Debt Refinancing - Balance sheet management" },
]

// Updated Sub-area options based on new categories
const subAreaOptions = {
  "Business Establishment (New ventures only)": [
    { value: "Feasibility Studies", label: "Feasibility Studies" },
    { value: "Legal Entity Formation", label: "Legal Entity Formation" },
    { value: "Licensing & Permits", label: "Licensing & Permits" },
    { value: "Pre-revenue Operating Costs", label: "Pre-revenue Operating Costs" },
  ],
  "Capital Expenditure (CapEx) - Physical/long-term assets": [
    { value: "Equipment: New Purchase", label: "Equipment: New Purchase" },
    { value: "Equipment: Upgrades", label: "Equipment: Upgrades" },
    { value: "Equipment: Maintenance", label: "Equipment: Maintenance" },
    { value: "Facilities: Construction", label: "Facilities: Construction" },
    { value: "Facilities: Expansion", label: "Facilities: Expansion" },
    { value: "Facilities: Renovation", label: "Facilities: Renovation" },
    { value: "Technology: Hardware", label: "Technology: Hardware" },
    { value: "Technology: Machinery", label: "Technology: Machinery" },
    { value: "Technology: Production Systems", label: "Technology: Production Systems" },
    { value: "Vehicles: Commercial Fleet", label: "Vehicles: Commercial Fleet" },
    { value: "Vehicles: Logistics", label: "Vehicles: Logistics" },
  ],
  "Working Capital - Short-term operational liquidity": [
    { value: "Inventory Purchase", label: "Inventory Purchase" },
    { value: "Accounts Receivable Bridging", label: "Accounts Receivable Bridging" },
    { value: "Seasonal Cash Flow Support", label: "Seasonal Cash Flow Support" },
    { value: "Emergency Reserve Buffer", label: "Emergency Reserve Buffer" },
  ],
  "Growth & Market Expansion - Revenue-driving investments": [
    { value: "Market Entry: New Geographic Markets", label: "Market Entry: New Geographic Markets" },
    { value: "Market Entry: Export Development", label: "Market Entry: Export Development" },
    { value: "Acquisitions: Franchise Fees", label: "Acquisitions: Franchise Fees" },
    { value: "Acquisitions: Business Purchase", label: "Acquisitions: Business Purchase" },
    { value: "Partnerships: Joint Ventures", label: "Partnerships: Joint Ventures" },
    { value: "Partnerships: Distribution Networks", label: "Partnerships: Distribution Networks" },
  ],
  "Product & Innovation - R&D and commercialization": [
    { value: "Product Design & Prototyping", label: "Product Design & Prototyping" },
    { value: "Packaging Development", label: "Packaging Development" },
    { value: "Certification & Compliance Testing (ISO, FDA, CE etc.)", label: "Certification & Compliance Testing (ISO, FDA, CE etc.)" },
    { value: "Patent Filing & IP Protection", label: "Patent Filing & IP Protection" },
  ],
  "Operational Efficiency - Process optimization": [
    { value: "IT Systems (ERP/CRM Software, Cybersecurity)", label: "IT Systems (ERP/CRM Software, Cybersecurity)" },
    { value: "Automation & Robotics", label: "Automation & Robotics" },
    { value: "Lean Manufacturing Setup", label: "Lean Manufacturing Setup" },
    { value: "Supply Chain Reengineering", label: "Supply Chain Reengineering" },
  ],
  "Sales & Marketing - Customer acquisition": [
    { value: "Brand Development", label: "Brand Development" },
    { value: "Digital Marketing (Ads, SEO, Social)", label: "Digital Marketing (Ads, SEO, Social)" },
    { value: "Trade Shows & Sponsorships", label: "Trade Shows & Sponsorships" },
    { value: "Sales Team Expansion", label: "Sales Team Expansion" },
  ],
  "Debt Refinancing - Balance sheet management": [
    { value: "High-interest Loan Replacement", label: "High-interest Loan Replacement" },
    { value: "Equipment Lease Buyouts", label: "Equipment Lease Buyouts" },
    { value: "Credit Line Consolidation", label: "Credit Line Consolidation" },
  ],
}

// MultiSelect component for dropdown selections
function MultiSelect({ options, selected, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdown = () => setIsOpen(!isOpen)
  const closeDropdown = () => setIsOpen(false)

  const handleSelect = (value) => {
    const newSelected = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]
    onChange(newSelected)
  }

  const getSelectedLabels = () => {
    return options.filter((option) => selected.includes(option.value)).map((option) => option.label)
  }

  return (
    <div className="multi-select-container">
      <div className="multi-select-header" onClick={toggleDropdown}>
        {selected.length > 0 ? (
          <div className="selected-items">
            {getSelectedLabels().map((label) => (
              <span key={label} className="selected-item">
                {label}
              </span>
            ))}
          </div>
        ) : (
          <span className="placeholder">Select {label}</span>
        )}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {isOpen && (
        <div className="multi-select-dropdown">
          <div className="multi-select-options">
            {options.map((option) => (
              <div
                key={option.value}
                className={`multi-select-option ${selected.includes(option.value) ? "selected" : ""}`}
                onClick={() => handleSelect(option.value)}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => {}}
                  className="multi-select-checkbox"
                />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
          <div className="multi-select-actions">
            <button type="button" className="multi-select-button" onClick={closeDropdown}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Validation Modal Component
function ValidationModal({ isOpen, onClose, message }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <AlertTriangle className="text-red-500" size={24} />
          <h3>Validation Error</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="modal-button">
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

// Currency formatter function
const formatCurrency = (value) => {
  if (!value) return ""
  const numericValue = value.replace(/[^\d]/g, "")
  if (!numericValue) return ""
  return `R ${Number.parseInt(numericValue).toLocaleString()}`
}

// Parse currency value back to number
const parseCurrency = (value) => {
  return value.replace(/[^\d]/g, "")
}

// Default export component with hooks
const UseOfFunds = ({ data, updateData }) => {
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationMessage, setValidationMessage] = useState("")
  // Add this new state variable after the existing useState declarations
  const [hasShownValidationModal, setHasShownValidationModal] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    // Handle currency formatting for amount fields
    if (name === "amountRequested" || name === "personalEquity") {
      const formattedValue = formatCurrency(value)
      updateData({ [name]: formattedValue })
    } else {
      updateData({ [name]: value })
    }
  }

  const handleFileChange = (name, files) => {
    updateData({ [name]: files })
  }

  const addFundingItem = () => {
    const fundingItems = [...(data.fundingItems || [])]
    updateData({
      fundingItems: [...fundingItems, { category: "", subArea: "", description: "", amount: "" }],
    })
  }

  const updateFundingItem = (index, field, value) => {
    const fundingItems = [...(data.fundingItems || [])]
    if (field === "amount") {
      // Format currency for amount field
      const formattedValue = formatCurrency(value)
      fundingItems[index] = { ...fundingItems[index], [field]: formattedValue }
    } else {
      fundingItems[index] = { ...fundingItems[index], [field]: value }
      // Clear sub-area if category changes
      if (field === "category") {
        fundingItems[index].subArea = ""
      }
    }
    updateData({ fundingItems })
  }

  const removeFundingItem = (index) => {
    const fundingItems = [...(data.fundingItems || [])]
    fundingItems.splice(index, 1)
    updateData({ fundingItems })
  }

  const getSubAreaOptions = (category) => {
    return subAreaOptions[category] || []
  }

  const calculateTotal = () => {
    return (
      data.fundingItems?.reduce((sum, item) => {
        const amount = parseCurrency(item.amount || "0")
        return sum + Number.parseInt(amount || 0)
      }, 0) || 0
    )
  }

  const getTotalRequested = () => {
    const amount = parseCurrency(data.amountRequested || "0")
    return Number.parseInt(amount || 0)
  }

  // Validation function
  const validateAmounts = () => {
    const totalRequested = getTotalRequested()
    const totalPurpose = calculateTotal()

    if (totalRequested !== totalPurpose && totalRequested > 0 && totalPurpose > 0) {
      // Only show modal if it hasn't been shown before
      if (!hasShownValidationModal) {
        setValidationMessage(
          `Total Amount Requested (R ${totalRequested.toLocaleString()}) must equal the sum of Purpose of Funds (R ${totalPurpose.toLocaleString()}). Please adjust the amounts to match.`,
        )
        setShowValidationModal(true)
        setHasShownValidationModal(true) // Mark that modal has been shown
      }
      return false
    }
    return true
  }

  // Auto-validate when amounts change
  useEffect(() => {
    if (data.amountRequested && data.fundingItems?.length > 0) {
      const timer = setTimeout(() => {
        validateAmounts()
      }, 1000) // Debounce validation
      return () => clearTimeout(timer)
    }
  }, [data.amountRequested, data.fundingItems])

  const handleMultiSelectChange = (field, value) => {
    updateData({ [field]: value })
  }

  // Check if "other" is selected in funding instruments or funder types
  const showFundingInstrumentOther = data.fundingInstruments?.includes("other")
  const showFunderTypeOther = data.funderTypes?.includes("other")

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      <h2>Funding Ask</h2>

      <div className="grid-container">
        <div>
          <FormField label="Total Amount Requested">
            <input
              type="text"
              name="amountRequested"
              value={data.amountRequested || ""}
              onChange={handleChange}
              className="form-input"
              placeholder="R 0"
              required
              style={{ color: data.amountRequested ? "black" : "#9CA3AF" }}
            />
          </FormField>

          <FormField label="How much personal equity have you contributed?">
            <input
              type="text"
              name="personalEquity"
              value={data.personalEquity || ""}
              onChange={handleChange}
              className="form-input"
              placeholder="R 0"
              required
              style={{ color: data.personalEquity ? "black" : "#9CA3AF" }}
            />
          </FormField>

          <FormField label="How much equity are you offering?">
            <select
              name="equityType"
              value={data.equityType || ""}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">How much equity are you offering?</option>
              {equityType.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div>
          <FormField label="Funding Instrument Preferred">
            <MultiSelect
              options={fundingInstrumentOptions}
              selected={data.fundingInstruments || []}
              onChange={(value) => handleMultiSelectChange("fundingInstruments", value)}
              label="Funding Instruments"
            />
          </FormField>

          {/* Show specification field when "other" is selected for funding instruments */}
          {showFundingInstrumentOther && (
            <FormField label="Please specify other funding instrument">
              <input
                type="text"
                name="fundingInstrumentOther"
                value={data.fundingInstrumentOther || ""}
                onChange={handleChange}
                className="form-input"
                placeholder="Please specify the funding instrument"
                required
              />
            </FormField>
          )}

          <FormField label="Type of Funder Preferred">
            <MultiSelect
              options={funderTypeOptions}
              selected={data.funderTypes || []}
              onChange={(value) => handleMultiSelectChange("funderTypes", value)}
              label="Funder Types"
            />
          </FormField>

          {/* Show specification field when "other" is selected for funder types */}
          {showFunderTypeOther && (
            <FormField label="Please specify other funder type">
              <input
                type="text"
                name="funderTypeOther"
                value={data.funderTypeOther || ""}
                onChange={handleChange}
                className="form-input"
                placeholder="Please specify the type of funder"
                required
              />
            </FormField>
          )}
        </div>
      </div>

      {/* Fixed Purpose of Funds Section */}
      <div style={{ width: "100%", marginTop: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h3 style={{ margin: 0 }}>Purpose of Funds</h3>
          <button
            type="button"
            onClick={addFundingItem}
            className="add-button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: " #624635",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Add Item
          </button>
        </div>

        <div style={{ width: "100%", overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #E5E7EB",
              backgroundColor: "white",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#F9FAFB" }}>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #E5E7EB",
                    fontWeight: "600",
                    minWidth: "200px",
                  }}
                >
                  Funding Category
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #E5E7EB",
                    fontWeight: "600",
                    minWidth: "180px",
                  }}
                >
                  Sub-area
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #E5E7EB",
                    fontWeight: "600",
                    minWidth: "250px",
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #E5E7EB",
                    fontWeight: "600",
                    minWidth: "120px",
                  }}
                >
                  Amount Required
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "center",
                    borderBottom: "1px solid #E5E7EB",
                    fontWeight: "600",
                    width: "80px",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {(data.fundingItems || []).map((item, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: "12px", verticalAlign: "top" }}>
                    <select
                      value={item.category}
                      onChange={(e) => updateFundingItem(index, "category", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    >
                      <option value="">Select Category</option>
                      {fundingCategoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "12px", verticalAlign: "top" }}>
                    <select
                      value={item.subArea}
                      onChange={(e) => updateFundingItem(index, "subArea", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                      disabled={!item.category || !getSubAreaOptions(item.category).length}
                    >
                      <option value="">Select Sub-area</option>
                      {getSubAreaOptions(item.category).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "12px", verticalAlign: "top" }}>
                    <textarea
                      value={item.description}
                      onChange={(e) => updateFundingItem(index, "description", e.target.value)}
                      style={{
                        width: "100%",
                        minHeight: "80px",
                        padding: "8px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "4px",
                        fontSize: "14px",
                        resize: "vertical",
                      }}
                      placeholder="Detailed description of how funds will be used"
                      rows={3}
                    />
                  </td>
                  <td style={{ padding: "12px", verticalAlign: "top" }}>
                    <input
                      type="text"
                      value={item.amount}
                      onChange={(e) => updateFundingItem(index, "amount", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "4px",
                        fontSize: "14px",
                        color: item.amount ? "black" : "#9CA3AF",
                      }}
                      placeholder="R 0"
                    />
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", verticalAlign: "top" }}>
                    <button
                      type="button"
                      onClick={() => removeFundingItem(index)}
                      style={{
                        padding: "6px",
                        backgroundColor: "#EF4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr
                style={{
                  backgroundColor: "#F9FAFB",
                  fontWeight: "600",
                  borderTop: "2px solid #E5E7EB",
                }}
              >
                <td
                  colSpan="3"
                  style={{
                    padding: "12px",
                    textAlign: "right",
                    fontSize: "16px",
                  }}
                >
                  Total:
                </td>
                <td
                  style={{
                    padding: "12px",
                    fontSize: "16px",
                    color: "#059669",
                  }}
                >
                  R {calculateTotal().toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Validation warning */}
        {getTotalRequested() > 0 && calculateTotal() > 0 && getTotalRequested() !== calculateTotal() && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "6px",
              color: "#DC2626",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertTriangle size={16} />
            Warning: Total Amount Requested (R {getTotalRequested().toLocaleString()}) does not equal Purpose of Funds
            total (R {calculateTotal().toLocaleString()})
          </div>
        )}
      </div>

      {/* Validation Modal */}
      <ValidationModal
        isOpen={showValidationModal}
        onClose={() => {
          setShowValidationModal(false)
          // Don't reset hasShownValidationModal here so it stays true
        }}
        message={validationMessage}
      />
    </div>
  )
}

// Export the renderUseOfFunds function for backward compatibility
export const renderUseOfFunds = (data, updateFormData) => {
  // Create a wrapper that transforms the updateFormData call
  const transformedUpdateData = (newData) => {
    updateFormData("useOfFunds", newData)
  }

  return <UseOfFunds data={data} updateData={transformedUpdateData} />
}

export default UseOfFunds