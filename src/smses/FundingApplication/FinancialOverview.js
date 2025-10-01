import "./FundingApplication.css";

import { useState } from "react";
import FormField from "./FormField";
import FileUpload from "./FileUpload";
import { profitabilityOptions } from "./applicationOptions";

// Currency formatter function
const formatCurrency = (value) => {
  if (!value) return '';
  const numericValue = value.replace(/[^\d]/g, '');
  if (!numericValue) return '';
  return `R ${parseInt(numericValue).toLocaleString()}`;
};

// Parse currency value back to number for storage
const parseCurrency = (value) => {
  return value.replace(/[^\d]/g, '');
};

export const renderFinancialOverview = (data, updateFormData) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle currency formatting for specific fields
    if (name === 'annualRevenue' || name === 'currentValuation' || name === 'existingDebt') {
      const formattedValue = formatCurrency(value);
      updateFormData("financialOverview", { [name]: formattedValue });
    } else {
      const newData = { [name]: type === "checkbox" ? checked : value };
      
      // Clear related fields when "No" is selected
      if (name === 'hasAccountingSoftware' && value === 'no') {
        newData.accountingSoftwareDocs = [];
      }
      if (name === 'financialsAudited' && value === 'no') {
        newData.auditedFinancialsDocs = [];
      }
      
      updateFormData("financialOverview", newData);
    }
  };

  const handleFileChange = (name, files) => {
    updateFormData("financialOverview", { [name]: files });
  };

  return (
    <>
      <h2>Financial Overview</h2>

      <div className="grid-container">
        <div>
          <FormField label="Do you currently generate revenue?">
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="generatesRevenue"
                  value="yes"
                  checked={data.generatesRevenue === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="generatesRevenue"
                  value="no"
                  checked={data.generatesRevenue === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
          </FormField>

          {data.generatesRevenue === "yes" && (
            <FormField label="Annual revenue" required>
              <input
                type="text"
                name="annualRevenue"
                value={data.annualRevenue || ""}
                onChange={handleChange}
                className="form-input"
                placeholder="R 0"
                required={data.generatesRevenue === "yes"}
                style={{ color: data.annualRevenue ? 'black' : '#9CA3AF' }}
              />
            </FormField>
          )}

          <FormField label="Current valuation (if known)">
            <input
              type="text"
              name="currentValuation"
              value={data.currentValuation || ""}
              onChange={handleChange}
              className="form-input"
              placeholder="R 0"
              style={{ color: data.currentValuation ? 'black' : '#9CA3AF' }}
            />
          </FormField>

          <FormField label="Do you have accounting software?" required>
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasAccountingSoftware"
                  value="yes"
                  checked={data.hasAccountingSoftware === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasAccountingSoftware"
                  value="no"
                  checked={data.hasAccountingSoftware === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
          </FormField>

          {data.hasAccountingSoftware === "yes" && (
            <div style={{ marginTop: "1rem" }}>
              <FileUpload
                label="Upload Accounting Software Reports"
                accept=".pdf,.xlsx,.xls,.csv"
                onChange={(files) => handleFileChange("accountingSoftwareDocs", files)}
                value={data.accountingSoftwareDocs || []}
                tooltip="Upload reports or screenshots from your accounting software (e.g., QuickBooks, Xero, Sage)"
              />
            </div>
          )}
        </div>

        

        <div>
          <FormField label="Profitability Status" >
            <select
              name="profitabilityStatus"
              value={data.profitabilityStatus || ""}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select Status</option>
              {profitabilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Existing Debt or Loans">
            <input
              type="text"
              name="existingDebt"
              value={data.existingDebt || ""}
              onChange={handleChange}
              className="form-input"
              placeholder="R 0"
              style={{ color: data.existingDebt ? 'black' : '#9CA3AF' }}
            />
          </FormField>

          <FormField label="Fundraising History">
            <textarea
              name="fundraisingHistory"
              value={data.fundraisingHistory || ""}
              onChange={handleChange}
              className="form-textarea"
              placeholder="List funders and funded amounts"
              rows={3}
            ></textarea>
          </FormField>

          <FormField label="Are your books up to date and clean?" required>
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="booksUpToDate"
                  value="yes"
                  checked={data.booksUpToDate === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="booksUpToDate"
                  value="no"
                  checked={data.booksUpToDate === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {data.booksUpToDate === "no" && (
              <div className="conditional-field">
                <textarea
                  name="booksUpToDateDetails"
                  value={data.booksUpToDateDetails || ""}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Please explain why your books aren't up to date or clean"
                  rows={3}
                ></textarea>
              </div>
            )}
          </FormField>

        
        </div>
      </div>


    
      
          

    
    </>
  );
};

const FinancialOverview = ({ data, updateData }) => {
  return renderFinancialOverview(data, updateData);
};

export default FinancialOverview;