import React, { useState } from "react";
import "./UniversalProfile.css";
import FormField from "./form-field";
import FileUpload from "./file-upload";
import { profitabilityOptions } from "./applicationOptions";
import FinancialsGPT from "../FundingApplication/FinancialsAI";

const formatCurrency = (value) => {
  if (!value) return "";
  const numericValue = value.toString().replace(/[^\d]/g, "");
  if (!numericValue) return "";
  return `R ${parseInt(numericValue, 10).toLocaleString()}`;
};

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

const MultiSelectDropdown = ({ options, selected = [], onChange, placeholder = "Select options..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const safeSelected = Array.isArray(selected) ? selected : [];
  const toggle = (value) => onChange(safeSelected.includes(value) ? safeSelected.filter((v) => v !== value) : [...safeSelected, value]);
  const getSelectedLabels = () => safeSelected.map((val) => options.find((opt) => opt.value === val)?.label || val).join(", ");

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ padding: "7px 10px", border: "1px solid #d6c4a8", borderRadius: "4px", backgroundColor: "white", cursor: "pointer", minHeight: "38px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: '12px' }}>
        <span style={{ color: safeSelected.length > 0 ? "#3d2b1f" : "#999" }}>
          {safeSelected.length > 0 ? getSelectedLabels() : placeholder}
        </span>
        <span style={{ marginLeft: "8px" }}>{isOpen ? "▲" : "▼"}</span>
      </div>
      {isOpen && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: "200px", overflowY: "auto", backgroundColor: "white", border: "1px solid #d6c4a8", borderTop: "none", borderRadius: "0 0 4px 4px", zIndex: 1000, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
          {options.map((option) => {
            const isSelected = safeSelected.includes(option.value);
            return (
              <div key={option.value} onClick={() => toggle(option.value)} style={{ padding: "6px 10px", cursor: "pointer", backgroundColor: isSelected ? "#f5f0e8" : "white", borderBottom: "1px solid #f0ebe3", display: "flex", alignItems: "center", gap: "6px", fontSize: '11px' }}>
                <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ cursor: "pointer" }} />
                <span>{option.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const YearMultiSelectDropdown = ({ selected = [], onChange, fromYear = 2015 }) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= fromYear; y--) years.push(y.toString());
  return <MultiSelectDropdown options={years.map((year) => ({ value: year, label: year }))} selected={selected} onChange={onChange} placeholder="Select years..." />;
};

const thStyle = { padding: '8px 10px', textAlign: 'left', color: '#ffffff', fontWeight: '600', fontSize: '11px', borderBottom: '2px solid #3d2b1f', backgroundColor: '#5c3a1e', whiteSpace: 'nowrap' };
const thStyleRight = { ...thStyle, textAlign: 'right' };

// Helpers
const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' };
const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' };

// A subtle card that visually groups related fields (for conditionals)
const FieldGroup = ({ children, style = {} }) => (
  <div style={{
    padding: '12px',
    backgroundColor: '#faf6ee',
    border: '1px dashed #d6c4a8',
    borderRadius: '6px',
    display: 'grid',
    gap: '10px',
    ...style,
  }}>
    {children}
  </div>
);

const FinancialOverview = ({ data, updateData, apiKey, onEvaluationComplete }) => {
  const [currencyValues, setCurrencyValues] = useState({
    annualRevenue: data.annualRevenue || "",
    currentValuation: data.currentValuation || "",
    existingDebt: data.existingDebt || "",
    incomeTurnoverCurrent: data.incomeTurnoverCurrent || "",
    incomeCOGSCurrent: data.incomeCOGSCurrent || "",
    incomeGrossProfitCurrent: data.incomeGrossProfitCurrent || "",
    incomeOperatingProfitCurrent: data.incomeOperatingProfitCurrent || "",
    incomeNetProfitCurrent: data.incomeNetProfitCurrent || "",
    incomeTurnoverPrevious: data.incomeTurnoverPrevious || "",
    incomeCOGSPrevious: data.incomeCOGSPrevious || "",
    incomeGrossProfitPrevious: data.incomeGrossProfitPrevious || "",
    incomeOperatingProfitPrevious: data.incomeOperatingProfitPrevious || "",
    incomeNetProfitPrevious: data.incomeNetProfitPrevious || "",
    balanceCurrentAssetsCurrent: data.balanceCurrentAssetsCurrent || "",
    balanceTotalAssetsCurrent: data.balanceTotalAssetsCurrent || "",
    balanceCurrentLiabilitiesCurrent: data.balanceCurrentLiabilitiesCurrent || "",
    balanceLongTermLiabilitiesCurrent: data.balanceLongTermLiabilitiesCurrent || "",
    balanceEquityCurrent: data.balanceEquityCurrent || "",
    balanceTotalLiabilitiesCurrent: data.balanceTotalLiabilitiesCurrent || "",
    balanceCurrentAssetsPrevious: data.balanceCurrentAssetsPrevious || "",
    balanceTotalAssetsPrevious: data.balanceTotalAssetsPrevious || "",
    balanceCurrentLiabilitiesPrevious: data.balanceCurrentLiabilitiesPrevious || "",
    balanceLongTermLiabilitiesPrevious: data.balanceLongTermLiabilitiesPrevious || "",
    balanceEquityPrevious: data.balanceEquityPrevious || "",
    balanceTotalLiabilitiesPrevious: data.balanceTotalLiabilitiesPrevious || "",
  });

  const handleInputChange = (field, value) => updateData("financialOverview", { [field]: value });
  const handleCurrencyChange = (field, value) => {
    setCurrencyValues((prev) => ({ ...prev, [field]: value }));
    updateData("financialOverview", { [field]: formatCurrency(value) });
  };
  const handleCurrencyBlur = (field, value) => {
    const formattedValue = formatCurrency(value);
    setCurrencyValues((prev) => ({ ...prev, [field]: formattedValue }));
    updateData("financialOverview", { [field]: formattedValue });
  };
  const handleCurrencyFocus = (field, value) => {
    const rawValue = value.replace(/[^\d]/g, "");
    setCurrencyValues((prev) => ({ ...prev, [field]: rawValue }));
  };
  const handleFileChange = (name, files) => updateData("financialOverview", { [name]: files });

  return (
    <>
      <h2>Financial Overview</h2>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* A. Financial Performance (Reality) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider">
        <h3>A. Financial Performance (Reality)</h3>
      </div>

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        {/* Income Statement */}
        <div style={{ flex: "1 1 45%", minWidth: "320px" }}>
          <h4 style={{ color: "#8b5e3c", marginBottom: "0.75rem", fontWeight: "600", fontSize: '14px' }}>Income Statement</h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #d6c4a8", fontSize: "12px" }}>
              <thead>
                <tr style={{ backgroundColor: "#5c3a1e" }}>
                  <th style={thStyle}></th>
                  <th style={thStyleRight}>Current</th>
                  <th style={thStyleRight}>Previous Year</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "6px 10px", borderBottom: "1px solid #d6c4a8", fontWeight: "500" }}>Currency</td>
                  <td style={{ padding: "6px 10px", borderBottom: "1px solid #d6c4a8", textAlign: "right" }}>
                    <select value={data.incomeCurrency || "ZAR"} onChange={(e) => handleInputChange("incomeCurrency", e.target.value)} style={{ width: "100%", maxWidth: "90px", padding: "4px", border: "1px solid #d6c4a8", borderRadius: "4px", fontSize: '11px' }}>
                      <option value="ZAR">ZAR (R)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </td>
                  <td style={{ padding: "6px 10px", borderBottom: "1px solid #d6c4a8", textAlign: "right" }}></td>
                </tr>
                {[
                  { label: "Turnover / Revenue", key: "incomeTurnover" },
                  { label: "Cost of Goods Sold", key: "incomeCOGS" },
                  { label: "Gross Profit", key: "incomeGrossProfit", highlight: true },
                  { label: "Operating Profit", key: "incomeOperatingProfit" },
                  { label: "Net Profit", key: "incomeNetProfit", highlight: true },
                ].map((row) => (
                  <tr key={row.key} style={{ backgroundColor: row.highlight ? "#f9f7f3" : "transparent" }}>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid #d6c4a8", fontWeight: row.highlight ? "600" : "500" }}>{row.label}</td>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid #d6c4a8", textAlign: "right" }}>
                      <input type="text" value={currencyValues[`${row.key}Current`]} onChange={(e) => handleCurrencyChange(`${row.key}Current`, e.target.value)} onBlur={(e) => handleCurrencyBlur(`${row.key}Current`, e.target.value)} onFocus={(e) => handleCurrencyFocus(`${row.key}Current`, e.target.value)} style={{ width: "100%", maxWidth: "120px", padding: "4px", border: "1px solid #d6c4a8", borderRadius: "4px", textAlign: "right", fontSize: '11px' }} placeholder="R 0" />
                    </td>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid #d6c4a8", textAlign: "right" }}>
                      <input type="text" value={currencyValues[`${row.key}Previous`]} onChange={(e) => handleCurrencyChange(`${row.key}Previous`, e.target.value)} onBlur={(e) => handleCurrencyBlur(`${row.key}Previous`, e.target.value)} onFocus={(e) => handleCurrencyFocus(`${row.key}Previous`, e.target.value)} style={{ width: "100%", maxWidth: "120px", padding: "4px", border: "1px solid #d6c4a8", borderRadius: "4px", textAlign: "right", fontSize: '11px' }} placeholder="R 0" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Balance Sheet */}
        <div style={{ flex: "1 1 45%", minWidth: "320px" }}>
          <h4 style={{ color: "#8b5e3c", marginBottom: "0.75rem", fontWeight: "600", fontSize: '14px' }}>Balance Sheet</h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #d6c4a8", fontSize: "12px" }}>
              <thead>
                <tr style={{ backgroundColor: "#5c3a1e" }}>
                  <th style={thStyle}></th>
                  <th style={thStyleRight}>Current</th>
                  <th style={thStyleRight}>Previous Year</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Current Assets", key: "balanceCurrentAssets" },
                  { label: "Total Assets", key: "balanceTotalAssets", highlight: true },
                  { label: "Current Liabilities", key: "balanceCurrentLiabilities" },
                  { label: "Long Term Liabilities", key: "balanceLongTermLiabilities" },
                  { label: "Equity", key: "balanceEquity" },
                  { label: "Total Liabilities", key: "balanceTotalLiabilities", highlight: true },
                ].map((row) => (
                  <tr key={row.key} style={{ backgroundColor: row.highlight ? "#f9f7f3" : "transparent" }}>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid #d6c4a8", fontWeight: row.highlight ? "600" : "500" }}>{row.label}</td>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid #d6c4a8", textAlign: "right" }}>
                      <input type="text" value={currencyValues[`${row.key}Current`]} onChange={(e) => handleCurrencyChange(`${row.key}Current`, e.target.value)} onBlur={(e) => handleCurrencyBlur(`${row.key}Current`, e.target.value)} onFocus={(e) => handleCurrencyFocus(`${row.key}Current`, e.target.value)} style={{ width: "100%", maxWidth: "120px", padding: "4px", border: "1px solid #d6c4a8", borderRadius: "4px", textAlign: "right", fontSize: '11px' }} placeholder="R 0" />
                    </td>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid #d6c4a8", textAlign: "right" }}>
                      <input type="text" value={currencyValues[`${row.key}Previous`]} onChange={(e) => handleCurrencyChange(`${row.key}Previous`, e.target.value)} onBlur={(e) => handleCurrencyBlur(`${row.key}Previous`, e.target.value)} onFocus={(e) => handleCurrencyFocus(`${row.key}Previous`, e.target.value)} style={{ width: "100%", maxWidth: "120px", padding: "4px", border: "1px solid #d6c4a8", borderRadius: "4px", textAlign: "right", fontSize: '11px' }} placeholder="R 0" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* B. Financial Management & Systems — grouped logically per row */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider">
        <h3>B. Financial Management &amp; Systems</h3>
      </div>

      {/* Row 1: Books up to date + reason (conditional, adjacent) + Accounting software + Which software (conditional, adjacent) */}
      <div style={grid3}>
        <FormField label="Are your books up to date?" required>
          <select name="booksUpToDate" value={data.booksUpToDate || ""} onChange={(e) => handleInputChange("booksUpToDate", e.target.value)} className="form-select" required>
            <option value="">Select</option>
            <option value="fully_up_to_date">Fully up to date</option>
            <option value="partially">Partially</option>
            <option value="no">No</option>
          </select>
        </FormField>

        {(data.booksUpToDate === "partially" || data.booksUpToDate === "no") && (
          <FormField label="Why aren't your books up to date?">
            <input type="text" name="booksUpToDateDetails" value={data.booksUpToDateDetails || ""} onChange={(e) => handleInputChange("booksUpToDateDetails", e.target.value)} className="form-input" placeholder="Brief reason..." />
          </FormField>
        )}

        <FormField label="Do you use accounting software?" required>
          <select name="hasAccountingSoftware" value={data.hasAccountingSoftware || ""} onChange={(e) => {
            handleInputChange("hasAccountingSoftware", e.target.value);
            if (e.target.value === "no") handleInputChange("accountingSoftwareName", "");
          }} className="form-select" required>
            <option value="">Select</option>
            <option value="yes">Yes (e.g. Xero, Sage)</option>
            <option value="basic_tools">Basic tools (Excel/manual)</option>
            <option value="no">No</option>
          </select>
        </FormField>

        {data.hasAccountingSoftware === "yes" && (
          <FormField label="Which accounting software?" required>
            <input type="text" name="accountingSoftwareName" value={data.accountingSoftwareName || ""} onChange={(e) => handleInputChange("accountingSoftwareName", e.target.value)} className="form-input" placeholder="e.g. QuickBooks, Xero, Sage" required />
          </FormField>
        )}
      </div>

      {/* Row 2: Management accounts + latest period (conditional, adjacent) + full-width upload */}
      <div style={{ ...grid2, marginTop: '14px' }}>
        <FormField label="Do you have management accounts?" required>
          <select name="hasManagementAccounts" value={data.hasManagementAccounts || ""} onChange={(e) => {
            handleInputChange("hasManagementAccounts", e.target.value);
            if (e.target.value === "no" || e.target.value === "none") {
              handleInputChange("latestManagementAccounts", "");
              handleFileChange("managementAccountsDocs", []);
            }
          }} className="form-select" required>
            <option value="">Select</option>
            <option value="monthly">Monthly</option>
            <option value="occasionally">Occasionally</option>
            <option value="none">None</option>
          </select>
        </FormField>

        {(data.hasManagementAccounts === "monthly" || data.hasManagementAccounts === "occasionally" || data.hasManagementAccounts === "yes") && (
          <FormField label="Latest management accounts available?">
            <input type="text" name="latestManagementAccounts" value={data.latestManagementAccounts || ""} onChange={(e) => handleInputChange("latestManagementAccounts", e.target.value)} className="form-input" placeholder="e.g. March 2025" />
          </FormField>
        )}
      </div>

      {(data.hasManagementAccounts === "monthly" || data.hasManagementAccounts === "occasionally" || data.hasManagementAccounts === "yes") && (
        <div style={{ marginTop: '10px' }}>
          <FileUpload label="Upload Management Accounts" accept=".pdf,.xlsx,.xls" onChange={(files) => handleFileChange("managementAccountsDocs", files)} value={data.managementAccountsDocs || []} tooltip="Upload your most recent management accounts" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* C. Financial Credibility — each question and its follow-ups grouped */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider">
        <h3>C. Financial Credibility</h3>
      </div>

      {/* Row 1: Insured + conditional broker block (3 cols within) */}
      <div style={grid3}>
        <FormField label="Are you insured?" required>
          <select name="isInsured" value={data.isInsured || ""} onChange={(e) => {
            handleInputChange("isInsured", e.target.value);
            if (e.target.value === "no") {
              handleInputChange("insuranceBrokerName", "");
              handleInputChange("insuranceBrokerContact", "");
              handleInputChange("insuranceContactPerson", "");
            }
          }} className="form-select" required>
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </FormField>

        {data.isInsured === "yes" && (
          <>
            <FormField label="Insurance broker company">
              <input type="text" name="insuranceBrokerName" value={data.insuranceBrokerName || ""} onChange={(e) => handleInputChange("insuranceBrokerName", e.target.value)} className="form-input" placeholder="Broker company" />
            </FormField>
            <FormField label="Broker contact number">
              <input type="text" name="insuranceBrokerContact" value={data.insuranceBrokerContact || ""} onChange={(e) => handleInputChange("insuranceBrokerContact", e.target.value)} className="form-input" placeholder="Contact number" />
            </FormField>
            <FormField label="Contact person">
              <input type="text" name="insuranceContactPerson" value={data.insuranceContactPerson || ""} onChange={(e) => handleInputChange("insuranceContactPerson", e.target.value)} className="form-input" placeholder="Contact person" />
            </FormField>
          </>
        )}
      </div>

      {/* Row 2: Financial statements + which years + upload (all together) */}
      <div style={{ ...grid2, marginTop: '14px' }}>
        <FormField label="Do you have financial statements available?" required>
          <select name="hasFinancialStatements" value={data.hasFinancialStatements || ""} onChange={(e) => {
            handleInputChange("hasFinancialStatements", e.target.value);
            if (e.target.value === "no" || e.target.value === "none") {
              handleInputChange("financialStatementsYears", []);
              handleFileChange("financialStatementsDocs", []);
            }
          }} className="form-select" required>
            <option value="">Select</option>
            <option value="yes_3_plus">Yes (3+ years)</option>
            <option value="yes_1_2">1–2 years</option>
            <option value="none">None</option>
          </select>
        </FormField>

        {(data.hasFinancialStatements === "yes_3_plus" || data.hasFinancialStatements === "yes_1_2" || data.hasFinancialStatements === "yes") && (
          <FormField label="Which years are available?">
            <YearMultiSelectDropdown selected={data.financialStatementsYears || []} onChange={(years) => handleInputChange("financialStatementsYears", years)} />
          </FormField>
        )}
      </div>

      {(data.hasFinancialStatements === "yes_3_plus" || data.hasFinancialStatements === "yes_1_2" || data.hasFinancialStatements === "yes") && (
        <div style={{ marginTop: '10px' }}>
          <FileUpload label="Upload Financial Statements" accept=".pdf,.xlsx,.xls" onChange={(files) => handleFileChange("financialStatementsDocs", files)} value={data.financialStatementsDocs || []} tooltip="Upload your financial statements" />
        </div>
      )}

      {/* Row 3: Audited + auditor details + upload (all together) */}
      <div style={{ ...grid3, marginTop: '14px' }}>
        <FormField label="Are your financials audited or independently reviewed?" required>
          <select name="financialsAudited" value={data.financialsAudited || ""} onChange={(e) => {
            handleInputChange("financialsAudited", e.target.value);
            if (e.target.value === "no" || e.target.value === "none" || e.target.value === "internally_prepared") {
              handleInputChange("auditorCompanyName", "");
              handleInputChange("auditorContactNumber", "");
              handleInputChange("auditorContactPerson", "");
              if (e.target.value === "no" || e.target.value === "none") handleInputChange("auditedFinancialsDocs", []);
            }
          }} className="form-select" required>
            <option value="">Select</option>
            <option value="audited_reviewed">Audited/reviewed</option>
            <option value="internally_prepared">Internally prepared</option>
            <option value="none">None</option>
          </select>
        </FormField>

        {(data.financialsAudited === "audited_reviewed" || data.financialsAudited === "yes") && (
          <>
            <FormField label="Auditor company name">
              <input type="text" name="auditorCompanyName" value={data.auditorCompanyName || ""} onChange={(e) => handleInputChange("auditorCompanyName", e.target.value)} className="form-input" placeholder="Auditor company" />
            </FormField>
            <FormField label="Auditor contact number">
              <input type="text" name="auditorContactNumber" value={data.auditorContactNumber || ""} onChange={(e) => handleInputChange("auditorContactNumber", e.target.value)} className="form-input" placeholder="Contact number" />
            </FormField>
            <FormField label="Auditor contact person">
              <input type="text" name="auditorContactPerson" value={data.auditorContactPerson || ""} onChange={(e) => handleInputChange("auditorContactPerson", e.target.value)} className="form-input" placeholder="Contact person" />
            </FormField>
          </>
        )}
      </div>

      {(data.financialsAudited === "audited_reviewed" || data.financialsAudited === "yes") && (
        <div style={{ marginTop: '10px' }}>
          <FileUpload label="Upload Audited Financials" accept=".pdf,.xlsx,.xls" onChange={(files) => handleFileChange("auditedFinancialsDocs", files)} value={data.auditedFinancialsDocs || []} tooltip="Upload audited financials" required={data.financialsAudited === "audited_reviewed"} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Liabilities — grouped: (1) sales terms + overdraft + overdraft follow-ups,   */}
      {/*                       (2) surety + debtors + year end, (3) bonds            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider">
        <h3>Liabilities</h3>
      </div>

      {/* Row 1: Sales terms + Overdraft + Overdraft value + Utilisation */}
      <div style={grid3}>
        <FormField label="Payment terms to your clients">
          <input type="text" name="salesTerms" value={data.salesTerms || ""} onChange={(e) => handleInputChange("salesTerms", e.target.value)} className="form-input" placeholder="e.g., 30 days" />
        </FormField>
        <FormField label="Do you operate with an overdraft facility?">
          <select name="hasOverdraft" value={data.hasOverdraft || ""} onChange={(e) => {
            handleInputChange("hasOverdraft", e.target.value);
            if (e.target.value === "no") { handleInputChange("overdraftValue", ""); handleInputChange("overdraftUtilised", ""); }
          }} className="form-select">
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </FormField>
        {data.hasOverdraft === "yes" && (
          <>
            <FormField label="Overdraft value">
              <input type="text" name="overdraftValue" value={data.overdraftValue || ""} onChange={(e) => handleInputChange("overdraftValue", e.target.value)} className="form-input" placeholder="Overdraft value" />
            </FormField>
            <FormField label="How regularly is it utilised?">
              <select name="overdraftUtilised" value={data.overdraftUtilised || ""} onChange={(e) => handleInputChange("overdraftUtilised", e.target.value)} className="form-select">
                <option value="">Select</option>
                <option value="regularly">Yes, regularly</option>
                <option value="occasionally">Occasionally</option>
                <option value="rarely">Rarely</option>
                <option value="never">Never</option>
              </select>
            </FormField>
          </>
        )}
      </div>

      {/* Row 2: Surety + Debtors ceded + Year end */}
      <div style={{ ...grid3, marginTop: '14px' }}>
        <FormField label="Have directors signed personal surety?">
          <select name="directorsSurety" value={data.directorsSurety || ""} onChange={(e) => handleInputChange("directorsSurety", e.target.value)} className="form-select">
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </FormField>
        <FormField label="Have your debtors been ceded or factored?">
          <select name="debtorsCeded" value={data.debtorsCeded || ""} onChange={(e) => handleInputChange("debtorsCeded", e.target.value)} className="form-select">
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </FormField>
        <FormField label="When is your financial year end?">
          <input type="text" name="financialYearEnd" value={data.financialYearEnd || ""} onChange={(e) => handleInputChange("financialYearEnd", e.target.value)} className="form-input" placeholder="e.g., 28 February" />
        </FormField>
      </div>

      {/* Row 3: Bonds (full width) */}
      <div style={{ marginTop: '14px' }}>
        <FormField label="Bonds">
          <textarea name="bonds" value={data.bonds || ""} onChange={(e) => handleInputChange("bonds", e.target.value)} className="form-textarea" placeholder="Details of any bonds" rows={2} />
        </FormField>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* D. Current Financial Challenges */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider">
        <h3>D. Current Financial Challenges</h3>
      </div>

      {/* Challenges picker + elaboration side by side */}
      <div style={grid2}>
        <FormField label="Current financial challenges (select all that apply)">
          <MultiSelectDropdown options={financialChallengeOptions} selected={data.financialChallenges || []} onChange={(val) => handleInputChange("financialChallenges", val)} placeholder="Select challenges..." />
        </FormField>
        <FormField label="Elaborate on your financial challenges">
          <textarea name="financialChallengesElaboration" value={data.financialChallengesElaboration || ""} onChange={(e) => handleInputChange("financialChallengesElaboration", e.target.value)} className="form-textarea" placeholder="More details..." rows={3} />
        </FormField>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* E. Support Intent */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider">
        <h3>E. Support Intent</h3>
      </div>

      {/* Funding + support needs side by side, fundraising history full width */}
      <div style={grid2}>
        <FormField label="Are you currently seeking funding?">
          <select name="seekingFunding" value={data.seekingFunding || ""} onChange={(e) => handleInputChange("seekingFunding", e.target.value)} className="form-select">
            <option value="">Select</option>
            <option value="yes_actively_raising">Yes – actively raising</option>
            <option value="yes_within_6_12_months">Yes – within 6–12 months</option>
            <option value="no">No</option>
          </select>
        </FormField>
        <FormField label="Additional support needed (select all)">
          <MultiSelectDropdown options={supportTypeOptions} selected={data.supportTypeNeeded || []} onChange={(val) => handleInputChange("supportTypeNeeded", val)} placeholder="Select support types..." />
        </FormField>
      </div>

      <div style={{ marginTop: '14px' }}>
        <FormField label="Fundraising History">
          <textarea name="fundraisingHistory" value={data.fundraisingHistory || ""} onChange={(e) => handleInputChange("fundraisingHistory", e.target.value)} className="form-textarea" placeholder="List funders and funded amounts" rows={2} />
        </FormField>
      </div>

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