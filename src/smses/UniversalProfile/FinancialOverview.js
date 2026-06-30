import React, { useState } from "react";
import "./UniversalProfile.css"
import FormField from "./form-field";
import FileUpload from "./file-upload";
import { profitabilityOptions } from "./applicationOptions";
import FinancialsGPT from "../FundingApplication/FinancialsAI";
// Currency formatter function
const formatCurrency = (value) => {
  if (!value) return '';
  const numericValue = value.toString().replace(/[^\d]/g, '');
  if (!numericValue) return '';
  return `R ${parseInt(numericValue, 10).toLocaleString()}`;
};

// Financial Challenges multi-select options
const financialChallengeOptions = [
  { value: "cash_flow_constraints", label: "Cash flow constraints" },
  { value: "access_to_funding", label: "Access to funding" },
  { value: "high_operating_costs", label: "High operating costs" },
  { value: "low_profitability_margins", label: "Low profitability / margins" },
  { value: "debt_burden", label: "Debt burden" },
  { value: "irregular_revenue", label: "Irregular revenue" },
  { value: "poor_financial_management", label: "Poor financial management / tracking" },
  { value: "pricing_revenue_model", label: "Pricing / revenue model challenges" },
  { value: "none_currently", label: "None currently" },
];

// Support type multi-select options
const supportTypeOptions = [
  { value: "funding_capital", label: "Funding / capital" },
  { value: "financial_management_support", label: "Financial management support" },
  { value: "business_planning_strategy", label: "Business planning / strategy" },
  { value: "legal_compliance_support", label: "Legal / compliance support" },
  { value: "sales_market_access", label: "Sales & market access" },
  { value: "operations_systems", label: "Operations / systems improvement" },
  { value: "talent_hiring", label: "Talent / hiring" },
  { value: "none_currently", label: "None currently" },
];

// Multi-select chip component
const ChipMultiSelect = ({ options, selected = [], onChange, label }) => {
  const safeSelected = Array.isArray(selected) ? selected : [];

  const toggle = (value) => {
    if (safeSelected.includes(value)) {
      onChange(safeSelected.filter((v) => v !== value));
    } else {
      onChange([...safeSelected, value]);
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
      {options.map((option) => {
        const isSelected = safeSelected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: isSelected ? "1px solid #8b5e3c" : "1px solid #d6c4a8",
              backgroundColor: isSelected ? "#8b5e3c" : "white",
              color: isSelected ? "white" : "#3d2b1f",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

// Year multi-select component
const YearMultiSelect = ({ selected = [], onChange, fromYear = 2015 }) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= fromYear; y--) {
    years.push(y.toString());
  }

  const toggle = (year) => {
    if (selected.includes(year)) {
      onChange(selected.filter((y) => y !== year));
    } else {
      onChange([...selected, year].sort((a, b) => b - a));
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
      {years.map((year) => {
        const isSelected = selected.includes(year);
        return (
          <button
            key={year}
            type="button"
            onClick={() => toggle(year)}
            style={{
              padding: "4px 12px",
              borderRadius: "20px",
              border: isSelected ? "1px solid #8b5e3c" : "1px solid #d6c4a8",
              backgroundColor: isSelected ? "#8b5e3c" : "white",
              color: isSelected ? "white" : "#3d2b1f",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {year}
          </button>
        );
      })}
    </div>
  );
};
const FinancialOverview = ({ data, updateData, apiKey, onEvaluationComplete }) => {
  const [currencyValues, setCurrencyValues] = useState({
    annualRevenue: data.annualRevenue || '',
    currentValuation: data.currentValuation || '',
    existingDebt: data.existingDebt || ''
  });

  const handleInputChange = (field, value) => {
    updateData("financialOverview", { [field]: value });
  };

  const handleCurrencyChange = (field, value) => {
    setCurrencyValues(prev => ({ ...prev, [field]: value }));
    const formattedValue = formatCurrency(value);
    updateData("financialOverview", { [field]: formattedValue });
  };

  const handleCurrencyBlur = (field, value) => {
    const formattedValue = formatCurrency(value);
    setCurrencyValues(prev => ({ ...prev, [field]: formattedValue }));
    updateData("financialOverview", { [field]: formattedValue });
  };

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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* A. Financial Performance (Reality) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider">
        <h3>A. Financial Performance (Reality)</h3>
      </div>

      <div className="grid-container">
        <div>
          {/* Do you generate revenue? */}
          <FormField label="Do you generate revenue?" required>
            <select
              name="generatesRevenue"
              value={data.generatesRevenue || ""}
              onChange={(e) => handleInputChange("generatesRevenue", e.target.value)}
              className="form-select"
              required
            >
              <option value="">Select</option>
              <option value="yes_consistent">Yes (consistent)</option>
              <option value="yes_irregular">Yes (irregular)</option>
              <option value="no">No</option>
            </select>
          </FormField>

          {(data.generatesRevenue === "yes_consistent" || data.generatesRevenue === "yes_irregular" || data.generatesRevenue === "yes") && (
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
                required
                style={{ color: currencyValues.annualRevenue ? 'black' : '#9CA3AF' }}
              />
            </FormField>
          )}
        </div>

        <div>
          {/* Profitability Status */}
          <FormField label="Profitability status" required>
            <select
              name="profitabilityStatus"
              value={data.profitabilityStatus || ""}
              onChange={(e) => handleInputChange("profitabilityStatus", e.target.value)}
              className="form-select"
              required
            >
              <option value="">Select Status</option>
              <option value="profitable">Profitable</option>
              <option value="breakeven">Breakeven</option>
              <option value="loss_making">Loss-making</option>
            </select>
          </FormField>

          {/* Revenue trend (last 12 months) */}
          <FormField label="Revenue trend (last 12 months)">
            <select
              name="revenueTrend"
              value={data.revenueTrend || ""}
              onChange={(e) => handleInputChange("revenueTrend", e.target.value)}
              className="form-select"
            >
              <option value="">Select trend</option>
              <option value="growing">Growing</option>
              <option value="stable">Stable</option>
              <option value="declining">Declining</option>
            </select>
          </FormField>

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
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* B. Financial Management & Systems */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider">
        <h3>B. Financial Management & Systems</h3>
      </div>

      <div className="grid-container">
        <div>
          {/* Accounting software */}
          <FormField label="Do you use accounting software?" required>
            <select
              name="hasAccountingSoftware"
              value={data.hasAccountingSoftware || ""}
              onChange={(e) => {
                handleInputChange("hasAccountingSoftware", e.target.value);
                if (e.target.value === 'no') handleInputChange("accountingSoftwareName", "");
              }}
              className="form-select"
              required
            >
              <option value="">Select</option>
              <option value="yes">Yes (e.g. Xero, Sage)</option>
              <option value="basic_tools">Basic tools (Excel/manual)</option>
              <option value="no">No</option>
            </select>
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

          {/* Books up to date */}
          <FormField label="Are your books up to date?" required>
            <select
              name="booksUpToDate"
              value={data.booksUpToDate || ""}
              onChange={(e) => handleInputChange("booksUpToDate", e.target.value)}
              className="form-select"
              required
            >
              <option value="">Select</option>
              <option value="fully_up_to_date">Fully up to date</option>
              <option value="partially">Partially</option>
              <option value="no">No</option>
            </select>
          </FormField>

          {(data.booksUpToDate === "partially" || data.booksUpToDate === "no") && (
            <div className="conditional-field">
              <textarea
                name="booksUpToDateDetails"
                value={data.booksUpToDateDetails || ""}
                onChange={(e) => handleInputChange("booksUpToDateDetails", e.target.value)}
                className="form-textarea"
                placeholder="Please explain why your books aren't up to date"
                rows={3}
              ></textarea>
            </div>
          )}
        </div>

        <div>
          {/* Management accounts */}
          <FormField label="Do you have management accounts?" required>
            <select
              name="hasManagementAccounts"
              value={data.hasManagementAccounts || ""}
              onChange={(e) => {
                handleInputChange("hasManagementAccounts", e.target.value);
                if (e.target.value === "no" || e.target.value === "none") {
                  handleInputChange("latestManagementAccounts", "");
                  handleFileChange("managementAccountsDocs", []);
                }
              }}
              className="form-select"
              required
            >
              <option value="">Select</option>
              <option value="monthly">Monthly</option>
              <option value="occasionally">Occasionally</option>
              <option value="none">None</option>
            </select>
          </FormField>

          {(data.hasManagementAccounts === "monthly" || data.hasManagementAccounts === "occasionally" || data.hasManagementAccounts === "yes") && (
            <>
              <FormField label="What are the latest management accounts available?">
                <input
                  type="text"
                  name="latestManagementAccounts"
                  value={data.latestManagementAccounts || ""}
                  onChange={(e) => handleInputChange("latestManagementAccounts", e.target.value)}
                  className="form-input"
                  placeholder="e.g. March 2025, Q1 2025"
                />
              </FormField>
              <div style={{ marginTop: "1rem" }}>
                <FileUpload
                  label="Upload Management Accounts"
                  accept=".pdf,.xlsx,.xls"
                  onChange={(files) => handleFileChange("managementAccountsDocs", files)}
                  value={data.managementAccountsDocs || []}
                  tooltip="Upload your most recent management accounts"
                />
              </div>
            </>
          )}

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
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* C. Financial Credibility */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider">
        <h3>C. Financial Credibility</h3>
      </div>

      <div className="grid-container">
        <div>
          {/* Financial statements */}
          <FormField label="Do you have financial statements available?" required>
            <select
              name="hasFinancialStatements"
              value={data.hasFinancialStatements || ""}
              onChange={(e) => {
                handleInputChange("hasFinancialStatements", e.target.value);
                if (e.target.value === "no" || e.target.value === "none") {
                  handleInputChange("financialStatementsYears", []);
                  handleFileChange("financialStatementsDocs", []);
                }
              }}
              className="form-select"
              required
            >
              <option value="">Select</option>
              <option value="yes_3_plus">Yes (3+ years)</option>
              <option value="yes_1_2">1–2 years</option>
              <option value="none">None</option>
            </select>
          </FormField>

          {(data.hasFinancialStatements === "yes_3_plus" || data.hasFinancialStatements === "yes_1_2" || data.hasFinancialStatements === "yes") && (
            <>
              <FormField label="Which years are available?">
                <YearMultiSelect
                  selected={data.financialStatementsYears || []}
                  onChange={(years) => handleInputChange("financialStatementsYears", years)}
                />
              </FormField>
              <div style={{ marginTop: "1rem" }}>
                <FileUpload
                  label="Upload Financial Statements"
                  accept=".pdf,.xlsx,.xls"
                  onChange={(files) => handleFileChange("financialStatementsDocs", files)}
                  value={data.financialStatementsDocs || []}
                  tooltip="Upload your available financial statements"
                />
              </div>
            </>
          )}
        </div>

        <div>
          {/* Audited financials */}
          <FormField label="Are your financials audited or independently reviewed?" required>
            <select
              name="financialsAudited"
              value={data.financialsAudited || ""}
              onChange={(e) => {
                handleInputChange("financialsAudited", e.target.value);
                if (e.target.value === 'no' || e.target.value === 'none') {
                  handleInputChange("auditedFinancialsDocs", []);
                }
              }}
              className="form-select"
              required
            >
              <option value="">Select</option>
              <option value="audited_reviewed">Audited/reviewed</option>
              <option value="internally_prepared">Internally prepared</option>
              <option value="none">None</option>
            </select>
          </FormField>

          {(data.financialsAudited === "audited_reviewed" || data.financialsAudited === "yes") && (
            <div style={{ marginTop: "1rem" }}>
              <FileUpload
                label="Upload Audited Financials"
                accept=".pdf,.xlsx,.xls"
                onChange={(files) => handleFileChange("auditedFinancialsDocs", files)}
                value={data.auditedFinancialsDocs || []}
                tooltip="Upload your audited financial statements for the past 2-3 years"
                required={data.financialsAudited === "audited_reviewed"}
              />
            </div>
          )}

          {/* Existing debt */}
          <FormField label="Existing debt obligations">
            <select
              name="existingDebtStatus"
              value={data.existingDebtStatus || ""}
              onChange={(e) => handleInputChange("existingDebtStatus", e.target.value)}
              className="form-select"
            >
              <option value="">Select</option>
              <option value="well_managed">Well managed & structured</option>
              <option value="some_strain">Some strain</option>
              <option value="high_risk_unclear">High risk / unclear</option>
              <option value="no_debt">No debt</option>
            </select>
          </FormField>

          {(data.existingDebtStatus === "well_managed" || data.existingDebtStatus === "some_strain" || data.existingDebtStatus === "high_risk_unclear") && (
            <FormField label="Total existing debt amount">
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
          )}

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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* D. Current Financial Challenges */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider">
        <h3>D. Current Financial Challenges</h3>
      </div>

      <div className="grid-container" style={{ marginBottom: "1.5rem" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <FormField label="What are your current financial challenges? (Select all that apply)">
            <ChipMultiSelect
              options={financialChallengeOptions}
              selected={data.financialChallenges || []}
              onChange={(val) => handleInputChange("financialChallenges", val)}
              label="challenges"
            />
          </FormField>

          <div style={{ marginTop: "1rem" }}>
            <FormField label="Elaborate on your financial challenges">
              <textarea
                name="financialChallengesElaboration"
                value={data.financialChallengesElaboration || ""}
                onChange={(e) => handleInputChange("financialChallengesElaboration", e.target.value)}
                className="form-textarea"
                placeholder="Provide more details about the financial challenges your business is currently facing"
                rows={4}
              ></textarea>
            </FormField>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* E. Support Intent */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider">
        <h3>E. Support Intent</h3>
      </div>

      <div className="grid-container">
        <div>
          <FormField label="Are you currently seeking funding?">
            <select
              name="seekingFunding"
              value={data.seekingFunding || ""}
              onChange={(e) => handleInputChange("seekingFunding", e.target.value)}
              className="form-select"
            >
              <option value="">Select</option>
              <option value="yes_actively_raising">Yes – actively raising</option>
              <option value="yes_within_6_12_months">Yes – within 6–12 months</option>
              <option value="no">No</option>
            </select>
          </FormField>
        </div>
        <div>
          <FormField label="What type of additional support does your business currently need? (Select all that apply)">
            <ChipMultiSelect
              options={supportTypeOptions}
              selected={data.supportTypeNeeded || []}
              onChange={(val) => handleInputChange("supportTypeNeeded", val)}
              label="support types"
            />
          </FormField>
        </div>
      </div>
       {/* AI Financial Health Analysis */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
    
        <FinancialsGPT
          financialStatementsDocs={data.financialStatementsDocs || []}
          auditedFinancialsDocs={data.auditedFinancialsDocs || []}
          managementAccountsDocs={data.managementAccountsDocs || []}
          profileFields={{
            generatesRevenue: data.generatesRevenue,
            annualRevenue: data.annualRevenue,
            profitabilityStatus: data.profitabilityStatus,
            revenueTrend: data.revenueTrend,
            hasAccountingSoftware: data.hasAccountingSoftware,
            booksUpToDate: data.booksUpToDate,
            hasManagementAccounts: data.hasManagementAccounts,
            financialsAudited: data.financialsAudited,
            existingDebtStatus: data.existingDebtStatus,
            existingDebt: data.existingDebt,
          }}
         
          onEvaluationComplete={onEvaluationComplete}
        />
      
    </>
  );
};

export default FinancialOverview;