import React, { useState } from "react";
import "./UniversalProfile.css"
import FormField from "./form-field";
import FileUpload from "./file-upload";
import { profitabilityOptions } from "./applicationOptions";
import { useApiKey } from "../SMSEDashboard/callapi"

// Currency formatter function
const formatCurrency = (value) => {
  if (!value) return '';
  const numericValue = value.toString().replace(/[^\d]/g, '');
  if (!numericValue) return '';
  return `R ${parseInt(numericValue, 10).toLocaleString()}`;
};

const FinancialOverview = ({ data, updateData }) => {
  const [currencyValues, setCurrencyValues] = useState({
    annualRevenue: data.annualRevenue || '',
    currentValuation: data.currentValuation || '',
    existingDebt: data.existingDebt || ''
  });

  // Simple handler for all inputs
  const handleInputChange = (field, value) => {
    updateData("financialOverview", { [field]: value });
  };

  // Handler for currency fields
  const handleCurrencyChange = (field, value) => {
    setCurrencyValues(prev => ({ ...prev, [field]: value }));
    const formattedValue = formatCurrency(value);
    updateData("financialOverview", { [field]: formattedValue });
  };

  // Handler for currency blur
  const handleCurrencyBlur = (field, value) => {
    const formattedValue = formatCurrency(value);
    setCurrencyValues(prev => ({ ...prev, [field]: formattedValue }));
    updateData("financialOverview", { [field]: formattedValue });
  };

  // Handler for currency focus
  const handleCurrencyFocus = (field, value) => {
    const rawValue = value.replace(/[^\d]/g, '');
    setCurrencyValues(prev => ({ ...prev, [field]: rawValue }));
  };

  const handleFileChange = (name, files) => {
    updateData("financialOverview", { [name]: files });
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
                  onChange={(e) => handleInputChange("generatesRevenue", e.target.value)}
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
                  onChange={(e) => handleInputChange("generatesRevenue", e.target.value)}
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
                value={currencyValues.annualRevenue}
                onChange={(e) => handleCurrencyChange("annualRevenue", e.target.value)}
                onBlur={(e) => handleCurrencyBlur("annualRevenue", e.target.value)}
                onFocus={(e) => handleCurrencyFocus("annualRevenue", e.target.value)}
                className="form-input"
                placeholder="R 0"
                required={data.generatesRevenue === "yes"}
                style={{ color: currencyValues.annualRevenue ? 'black' : '#9CA3AF' }}
              />
            </FormField>
          )}

          <FormField label="Current valuation (if known)">
            <input
              type="text"
              name="currentValuation"
              value={currencyValues.currentValuation}
              onChange={(e) => handleCurrencyChange("currentValuation", e.target.value)}
              onBlur={(e) => handleCurrencyBlur("currentValuation", e.target.value)}
              onFocus={(e) => handleCurrencyFocus("currentValuation", e.target.value)}
              className="form-input"
              placeholder="R 0"
              style={{ color: currencyValues.currentValuation ? 'black' : '#9CA3AF' }}
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
                  onChange={(e) => handleInputChange("hasAccountingSoftware", e.target.value)}
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
                  onChange={(e) => {
                    handleInputChange("hasAccountingSoftware", e.target.value);
                    if (e.target.value === 'no') {
                      handleInputChange("accountingSoftwareName", "");
                    }
                  }}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
          </FormField>

          {data.hasAccountingSoftware === "yes" && (
            <FormField label="Which accounting software do you use?" required>
              <input
                type="text"
                name="accountingSoftwareName"
                value={data.accountingSoftwareName || ""}
                onChange={(e) => handleInputChange("accountingSoftwareName", e.target.value)}
                className="form-input"
                placeholder="e.g., QuickBooks, Xero, Sage, Pastel"
                required={data.hasAccountingSoftware === "yes"}
              />
            </FormField>
          )}
        </div>

        <div>
          <FormField label="Profitability Status" >
            <select
              name="profitabilityStatus"
              value={data.profitabilityStatus || ""}
              onChange={(e) => handleInputChange("profitabilityStatus", e.target.value)}
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
              value={currencyValues.existingDebt}
              onChange={(e) => handleCurrencyChange("existingDebt", e.target.value)}
              onBlur={(e) => handleCurrencyBlur("existingDebt", e.target.value)}
              onFocus={(e) => handleCurrencyFocus("existingDebt", e.target.value)}
              className="form-input"
              placeholder="R 0"
              style={{ color: currencyValues.existingDebt ? 'black' : '#9CA3AF' }}
            />
          </FormField>

          <FormField label="Fundraising History">
            <textarea
              name="fundraisingHistory"
              value={data.fundraisingHistory || ""}
              onChange={(e) => handleInputChange("fundraisingHistory", e.target.value)}
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
                  onChange={(e) => handleInputChange("booksUpToDate", e.target.value)}
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
                  onChange={(e) => handleInputChange("booksUpToDate", e.target.value)}
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
                  onChange={(e) => handleInputChange("booksUpToDateDetails", e.target.value)}
                  className="form-textarea"
                  placeholder="Please explain why your books aren't up to date or clean"
                  rows={3}
                ></textarea>
              </div>
            )}
          </FormField>
        </div>
      </div>

      {/* Audited Financials Section */}
      <div className="section-divider">
        <h3>Financial Documentation</h3>
      </div>

      <div className="grid-container">
        <div>
          <FormField label="Are your financials audited?" required>
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="financialsAudited"
                  value="yes"
                  checked={data.financialsAudited === "yes"}
                  onChange={(e) => {
                    handleInputChange("financialsAudited", e.target.value);
                  }}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="financialsAudited"
                  value="no"
                  checked={data.financialsAudited === "no"}
                  onChange={(e) => {
                    handleInputChange("financialsAudited", e.target.value);
                    if (e.target.value === 'no') {
                      handleInputChange("auditedFinancialsDocs", []);
                    }
                  }}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
          </FormField>

          {data.financialsAudited === "yes" && (
            <div style={{ marginTop: "1rem" }}>
              <FileUpload
                label="Upload Audited Financials"
                accept=".pdf,.xlsx,.xls"
                onChange={(files) => handleFileChange("auditedFinancialsDocs", files)}
                value={data.auditedFinancialsDocs || []}
                tooltip="Upload your audited financial statements for the past 2-3 years"
                required={data.financialsAudited === "yes"}
              />
            </div>
          )}
        </div>

        <div>
          <FormField label="Additional Financial Notes">
            <textarea
              name="additionalFinancialNotes"
              value={data.additionalFinancialNotes || ""}
              onChange={(e) => handleInputChange("additionalFinancialNotes", e.target.value)}
              className="form-textarea"
              placeholder="Any additional financial information you'd like to share"
              rows={3}
            ></textarea>
          </FormField>
        </div>
      </div>
    </>
  );
};

export default FinancialOverview;