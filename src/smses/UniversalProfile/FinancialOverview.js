import React, { useState } from "react";
import "./UniversalProfile.css";
import FormField from "./form-field";
import FileUpload from "./file-upload";
import { profitabilityOptions } from "./applicationOptions";
import FinancialsGPT from "../FundingApplication/FinancialsAI";
import { auth } from "../../firebaseConfig";
import { checkIsNGO } from "./ngoTaxonomy";
import { Plus, Trash2 } from "lucide-react";

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

// Support type multi-select options (SME)
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

// Support type multi-select options (NGO)
const ngoSupportTypeOptions = [
  { value: "programme_funding", label: "Programme / Project grant funding" },
  { value: "core_operating_funding", label: "Core operating / Unrestricted funding" },
  { value: "capex_equipment", label: "Equipment & capital expenditure" },
  { value: "inkind_support", label: "In-kind donor support & goods" },
  { value: "volunteers_probono", label: "Volunteers & pro-bono professionals" },
  { value: "student_interns", label: "Student interns & work-integrated learners" },
  { value: "technical_assistance", label: "Technical assistance & M&E capacity building" },
  { value: "strategic_partnerships", label: "Strategic partnerships & coalition building" },
  { value: "governance_compliance", label: "Governance & compliance support" },
  { value: "none_currently", label: "None currently" },
];

// Multi-select dropdown component
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
        <span style={{ marginLeft: "8px" }}>{isOpen ? "?" : "?"}</span>
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

const FinancialOverview = ({ data, updateData, apiKey, onEvaluationComplete, isNGO: isNGOProp, allFormData }) => {
  const isNGO = typeof isNGOProp === "boolean" ? isNGOProp : checkIsNGO(allFormData || {}, auth.currentUser);
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
      <div style={{ marginBottom: "20px" }}>
        <h2 className="text-2xl font-bold text-brown-800" style={{ marginBottom: "4px" }}>Financial Overview</h2>
        <p style={{ color: "#7d5a50", fontSize: "14px" }}>
          {isNGO
            ? "Annual financial statements, income sources breakdown, key funders & commitments, and financial sustainability."
            : "Financial statements, accounting systems, solvency, and funding requirements."}
        </p>
      </div>

      {/* Financial Performance / Statements */}
      <div className="section-divider">
        <h3>{isNGO ? "Financial Statements & Operating Accounts" : "Financial Performance"}</h3>
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
                  { label: isNGO ? "Total Income" : "Turnover / Revenue", key: "incomeTurnover" },
                  { label: isNGO ? "Direct Programme Costs" : "Cost of Goods Sold", key: "incomeCOGS" },
                  { label: isNGO ? "Net Programme Contribution" : "Gross Profit", key: "incomeGrossProfit", highlight: true },
                  { label: isNGO ? "Operating Surplus / (Deficit)" : "Operating Profit", key: "incomeOperatingProfit" },
                  { label: isNGO ? "Total Surplus / (Deficit)" : "Net Profit", key: "incomeNetProfit", highlight: true },
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
                  { label: isNGO ? "Accumulated Funds / Net Assets" : "Equity", key: "balanceEquity" },
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

      {/* ----------------------------------------------------------------------- */}
      {/* NGO SECTIONS: Income Sources, Key Funders, Financial Sustainability */}
      {/* ----------------------------------------------------------------------- */}
      {isNGO && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginBottom: "2.5rem" }}>
          {/* 1. Income Sources Breakdown */}
          <div style={{
            backgroundColor: "#fdfbf9",
            border: "1px solid #ebd9c8",
            borderRadius: "8px",
            padding: "20px",
          }}>
            <h4 style={{ color: "#4a352f", fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>
              Income Sources Breakdown
            </h4>
            <p style={{ color: "#7d5a50", fontSize: "13px", marginBottom: "16px" }}>
              Detail the organisation's primary revenue streams across grants, donations, earned income, and investments.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #d6c4a8", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#5c3a1e" }}>
                    <th style={thStyle}>Income Category</th>
                    <th style={thStyle}>Funding Nature</th>
                    <th style={thStyleRight}>Current FY Amount</th>
                    <th style={thStyleRight}>Previous FY Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "philanthropicGrants", label: "Philanthropic Grants & Trusts", defaultType: "Restricted" },
                    { key: "corporateDonations", label: "Corporate CSI / SED Donations", defaultType: "Restricted" },
                    { key: "governmentSubsidies", label: "Government Grants & Subsidies", defaultType: "Restricted" },
                    { key: "publicDonations", label: "Public & Individual Donations", defaultType: "Unrestricted" },
                    { key: "serviceContractFees", label: "Service Fees & Contract Revenue", defaultType: "Earned Income" },
                    { key: "socialEnterpriseSales", label: "Social Enterprise / Product Sales", defaultType: "Earned Income" },
                    { key: "membershipFees", label: "Membership / Subscription Fees", defaultType: "Earned Income" },
                    { key: "investmentIncome", label: "Investment & Interest Income", defaultType: "Unrestricted" },
                    { key: "otherIncome", label: "Other Income", defaultType: "Unrestricted" },
                  ].map((stream, idx) => (
                    <tr key={stream.key} style={{ backgroundColor: idx % 2 === 0 ? "white" : "#fdfbf9" }}>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #d6c4a8", fontWeight: "500", color: "#3d2b1f" }}>
                        {stream.label}
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #d6c4a8" }}>
                        <select
                          value={data[`incomeType_${stream.key}`] || stream.defaultType}
                          onChange={(e) => handleInputChange(`incomeType_${stream.key}`, e.target.value)}
                          style={{ padding: "4px 8px", border: "1px solid #d6c4a8", borderRadius: "4px", fontSize: "12px", width: "100%" }}
                        >
                          <option value="Restricted">Restricted</option>
                          <option value="Unrestricted">Unrestricted</option>
                          <option value="Earned Income">Earned Income</option>
                        </select>
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #d6c4a8", textAlign: "right" }}>
                        <input
                          type="text"
                          value={data[`incomeAmount_${stream.key}`] || ""}
                          onChange={(e) => handleInputChange(`incomeAmount_${stream.key}`, e.target.value)}
                          placeholder="R 0"
                          style={{ padding: "4px 8px", border: "1px solid #d6c4a8", borderRadius: "4px", textAlign: "right", width: "140px", fontSize: "13px" }}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #d6c4a8", textAlign: "right" }}>
                        <input
                          type="text"
                          value={data[`incomePrevAmount_${stream.key}`] || ""}
                          onChange={(e) => handleInputChange(`incomePrevAmount_${stream.key}`, e.target.value)}
                          placeholder="R 0"
                          style={{ padding: "4px 8px", border: "1px solid #d6c4a8", borderRadius: "4px", textAlign: "right", width: "140px", fontSize: "13px" }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Key Funders & Funding Commitments */}
          <div style={{
            backgroundColor: "#fdfbf9",
            border: "1px solid #ebd9c8",
            borderRadius: "8px",
            padding: "20px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ color: "#4a352f", fontSize: "16px", fontWeight: "700", margin: 0 }}>
                Key Funders & Funding Commitments
              </h4>
              <button
                type="button"
                onClick={() => {
                  const currentFunders = Array.isArray(data.keyFunders) ? data.keyFunders : [];
                  handleInputChange("keyFunders", [
                    ...currentFunders,
                    { funderName: "", purpose: "", amount: "", currency: "ZAR", startDate: "", endDate: "", fundingNature: "Restricted", status: "Committed", reporting: "" }
                  ]);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  backgroundColor: "#5c3a1e",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                <Plus size={14} /> Add Funder Commitment
              </button>
            </div>
            <p style={{ color: "#7d5a50", fontSize: "13px", marginBottom: "16px" }}>
              Record major grants, philanthropic commitments, and donor contracts. Confidential funder names can be listed anonymously (e.g. "Private Foundation A").
            </p>

            {(!data.keyFunders || data.keyFunders.length === 0) ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#8a6d58", backgroundColor: "#faf6f0", borderRadius: "6px", border: "1px dashed #d6c4a8", fontSize: "13px" }}>
                No funder commitments added yet. Click "+ Add Funder Commitment" to record key institutional funders.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {data.keyFunders.map((funder, idx) => (
                  <div key={idx} style={{ padding: "14px", backgroundColor: "white", border: "1px solid #ebd9c8", borderRadius: "6px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "center" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "#6b4c2a", display: "block", marginBottom: "4px" }}>Funder Name</label>
                        <input
                          type="text"
                          value={funder.funderName || ""}
                          onChange={(e) => {
                            const updated = [...data.keyFunders];
                            updated[idx].funderName = e.target.value;
                            handleInputChange("keyFunders", updated);
                          }}
                          placeholder="e.g. Ford Foundation / DG Murray Trust"
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #d6c4a8", borderRadius: "4px", fontSize: "12px" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "#6b4c2a", display: "block", marginBottom: "4px" }}>Programme Purpose</label>
                        <input
                          type="text"
                          value={funder.purpose || ""}
                          onChange={(e) => {
                            const updated = [...data.keyFunders];
                            updated[idx].purpose = e.target.value;
                            handleInputChange("keyFunders", updated);
                          }}
                          placeholder="e.g. Early Literacy Programme"
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #d6c4a8", borderRadius: "4px", fontSize: "12px" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "#6b4c2a", display: "block", marginBottom: "4px" }}>Committed Amount</label>
                        <input
                          type="text"
                          value={funder.amount || ""}
                          onChange={(e) => {
                            const updated = [...data.keyFunders];
                            updated[idx].amount = e.target.value;
                            handleInputChange("keyFunders", updated);
                          }}
                          placeholder="e.g. R 1,500,000"
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #d6c4a8", borderRadius: "4px", fontSize: "12px" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "#6b4c2a", display: "block", marginBottom: "4px" }}>Nature</label>
                        <select
                          value={funder.fundingNature || "Restricted"}
                          onChange={(e) => {
                            const updated = [...data.keyFunders];
                            updated[idx].fundingNature = e.target.value;
                            handleInputChange("keyFunders", updated);
                          }}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #d6c4a8", borderRadius: "4px", fontSize: "12px" }}
                        >
                          <option value="Restricted">Restricted</option>
                          <option value="Unrestricted">Unrestricted (Core)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "#6b4c2a", display: "block", marginBottom: "4px" }}>Status</label>
                        <select
                          value={funder.status || "Committed"}
                          onChange={(e) => {
                            const updated = [...data.keyFunders];
                            updated[idx].status = e.target.value;
                            handleInputChange("keyFunders", updated);
                          }}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #d6c4a8", borderRadius: "4px", fontSize: "12px" }}
                        >
                          <option value="Committed">Committed</option>
                          <option value="Pending Agreement">Pending Agreement</option>
                          <option value="Under Application">Under Application</option>
                        </select>
                      </div>
                      <div style={{ paddingTop: "18px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = data.keyFunders.filter((_, i) => i !== idx);
                            handleInputChange("keyFunders", updated);
                          }}
                          style={{ color: "#a94442", background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                          title="Remove funder"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Financial Sustainability & Cash Runway */}
          <div style={{
            backgroundColor: "#fdfbf9",
            border: "1px solid #ebd9c8",
            borderRadius: "8px",
            padding: "20px",
          }}>
            <h4 style={{ color: "#4a352f", fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>
              Financial Sustainability & Cash Runway
            </h4>
            <p style={{ color: "#7d5a50", fontSize: "13px", marginBottom: "16px" }}>
              Assess liquidity buffer, core burn rate, and committed funding horizon to evaluate non-profit solvency.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <FormField label="Available Unrestricted Cash Balance">
                <input
                  type="text"
                  name="unrestrictedCash"
                  value={data.unrestrictedCash || ""}
                  onChange={(e) => handleInputChange("unrestrictedCash", e.target.value)}
                  placeholder="e.g. R 450,000"
                  className="form-input"
                />
              </FormField>

              <FormField label="Average Monthly Operating Burn">
                <input
                  type="text"
                  name="monthlyOperatingExpenditure"
                  value={data.monthlyOperatingExpenditure || ""}
                  onChange={(e) => handleInputChange("monthlyOperatingExpenditure", e.target.value)}
                  placeholder="e.g. R 75,000"
                  className="form-input"
                />
              </FormField>

              <FormField label="Restricted Project Balances Held">
                <input
                  type="text"
                  name="restrictedCashBalances"
                  value={data.restrictedCashBalances || ""}
                  onChange={(e) => handleInputChange("restrictedCashBalances", e.target.value)}
                  placeholder="e.g. R 800,000"
                  className="form-input"
                />
              </FormField>
            </div>

            {/* Calculated Runway Display */}
            {(() => {
              const parseAmount = (val) => {
                if (!val) return 0;
                const clean = val.toString().replace(/[^\d.]/g, "");
                return parseFloat(clean) || 0;
              };
              const cash = parseAmount(data.unrestrictedCash);
              const burn = parseAmount(data.monthlyOperatingExpenditure);
              if (burn > 0) {
                const runway = (cash / burn).toFixed(1);
                const isHealthy = runway >= 6;
                const isModerate = runway >= 3 && runway < 6;
                return (
                  <div style={{
                    padding: "12px 16px",
                    backgroundColor: isHealthy ? "#f0f7f0" : isModerate ? "#fffbf0" : "#fdf0f0",
                    border: `1px solid ${isHealthy ? "#c2e0c2" : isModerate ? "#faebcc" : "#f5c6cb"}`,
                    borderRadius: "6px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                    <div>
                      <span style={{ fontWeight: "700", color: "#3d2b1f", fontSize: "14px" }}>
                        Unrestricted Cash Runway: {runway} Months
                      </span>
                      <span style={{ fontSize: "12px", color: "#666", marginLeft: "12px" }}>
                        (Based on available unrestricted cash against monthly burn)
                      </span>
                    </div>
                    <span style={{
                      padding: "3px 8px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "700",
                      backgroundColor: isHealthy ? "#4a7c59" : isModerate ? "#c28e2b" : "#b94a48",
                      color: "white"
                    }}>
                      {isHealthy ? "Strong Runway (=6 mo)" : isModerate ? "Moderate (3–6 mo)" : "Short (<3 mo)"}
                    </span>
                  </div>
                );
              }
              return null;
            })()}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
              <FormField label="Committed Funding Period Coverage">
                <select
                  name="committedFundingCoverage"
                  value={data.committedFundingCoverage || ""}
                  onChange={(e) => handleInputChange("committedFundingCoverage", e.target.value)}
                  className="form-select"
                >
                  <option value="">Select period</option>
                  <option value="under_3_months">Under 3 months</option>
                  <option value="3_to_6_months">3 to 6 months</option>
                  <option value="6_to_12_months">6 to 12 months</option>
                  <option value="12_to_24_months">12 to 24 months</option>
                  <option value="over_24_months">More than 24 months</option>
                </select>
              </FormField>

              <FormField label="Principal Funding Gaps & Unfunded Core Needs">
                <textarea
                  name="principalFundingGaps"
                  value={data.principalFundingGaps || ""}
                  onChange={(e) => handleInputChange("principalFundingGaps", e.target.value)}
                  rows={2}
                  placeholder="Describe essential core costs, staffing, or programme gaps that currently lack committed donor funding..."
                  className="form-textarea"
                />
              </FormField>
            </div>
          </div>
        </div>
      )}

      {/* Financial Management & Systems */}
      <div className="section-divider">
        <h3>Financial Management &amp; Systems</h3>
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

      {/* ----------------------------------------------------------------------- */}
      {/* C. Financial Credibility — each question and its follow-ups grouped */}
      {/* ----------------------------------------------------------------------- */}
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

      {/* ----------------------------------------------------------------------- */}
      {/* Liabilities — grouped: (1) sales terms + overdraft + overdraft follow-ups,   */}
      {/*                       (2) surety + debtors + year end, (3) bonds            */}
      {/* ----------------------------------------------------------------------- */}
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

      {/* Current Financial Challenges */}
      <div className="section-divider">
        <h3>Current Financial Challenges</h3>
      </div>

      {/* Challenges picker + elaboration side by side */}
      <div style={grid2}>
        <FormField label={isNGO ? "What are your current financial challenges? (Select all that apply)" : "Current financial challenges (select all that apply)"}>
          <MultiSelectDropdown options={financialChallengeOptions} selected={data.financialChallenges || []} onChange={(val) => handleInputChange("financialChallenges", val)} placeholder="Select financial challenges..." />
        </FormField>
        <FormField label="Elaborate on your financial challenges">
          <textarea
            name="financialChallengesElaboration"
            value={data.financialChallengesElaboration || ""}
            onChange={(e) => handleInputChange("financialChallengesElaboration", e.target.value)}
            className="form-textarea"
            placeholder={isNGO ? "Provide more details about the financial and sustainability challenges your organisation is currently facing..." : "Provide more details about the financial challenges your business is currently facing..."}
            rows={3}
          />
        </FormField>
      </div>

      {/* Support Intent */}
      <div className="section-divider">
        <h3>Support Intent & Funding Requirements</h3>
      </div>

      {/* Funding + support needs side by side, fundraising history full width */}
      <div style={grid2}>
        <FormField label={isNGO ? "Are you currently seeking donor funding or grants?" : "Are you currently seeking funding?"}>
          <select name="seekingFunding" value={data.seekingFunding || ""} onChange={(e) => handleInputChange("seekingFunding", e.target.value)} className="form-select">
            <option value="">Select</option>
            <option value="yes_actively_raising">Yes â€“ actively raising</option>
            <option value="yes_within_6_12_months">Yes â€“ within 6â€“12 months</option>
            <option value="no">No</option>
          </select>
        </FormField>
        <FormField label={isNGO ? "What type of additional support does your organisation currently need? (Select all that apply)" : "What type of additional support does your business currently need? (Select all that apply)"}>
          <MultiSelectDropdown options={isNGO ? ngoSupportTypeOptions : supportTypeOptions} selected={data.supportTypeNeeded || []} onChange={(val) => handleInputChange("supportTypeNeeded", val)} placeholder="Select support types..." />
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
