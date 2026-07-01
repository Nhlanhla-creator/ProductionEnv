import React, { useState } from "react";
import "./UniversalProfile.css";
import FormField from "./form-field";
import FileUpload from "./file-upload";
import { profitabilityOptions } from "./applicationOptions";
import FinancialsGPT from "../FundingApplication/FinancialsAI";

// Currency formatter function
const formatCurrency = (value) => {
  if (!value) return "";
  const numericValue = value.toString().replace(/[^\d]/g, "");
  if (!numericValue) return "";
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

// Multi-select dropdown component
const MultiSelectDropdown = ({ options, selected = [], onChange, placeholder = "Select options..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const safeSelected = Array.isArray(selected) ? selected : [];

  const toggle = (value) => {
    if (safeSelected.includes(value)) {
      onChange(safeSelected.filter((v) => v !== value));
    } else {
      onChange([...safeSelected, value]);
    }
  };

  const getSelectedLabels = () => {
    return safeSelected
      .map((val) => {
        const option = options.find((opt) => opt.value === val);
        return option ? option.label : val;
      })
      .join(", ");
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "8px 12px",
          border: "1px solid #d6c4a8",
          borderRadius: "4px",
          backgroundColor: "white",
          cursor: "pointer",
          minHeight: "38px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: safeSelected.length > 0 ? "#3d2b1f" : "#999" }}>
          {safeSelected.length > 0 ? getSelectedLabels() : placeholder}
        </span>
        <span style={{ marginLeft: "8px" }}>{isOpen ? "▲" : "▼"}</span>
      </div>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: "200px",
            overflowY: "auto",
            backgroundColor: "white",
            border: "1px solid #d6c4a8",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            zIndex: 1000,
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          }}
        >
          {options.map((option) => {
            const isSelected = safeSelected.includes(option.value);
            return (
              <div
                key={option.value}
                onClick={() => toggle(option.value)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  backgroundColor: isSelected ? "#f5f0e8" : "white",
                  borderBottom: "1px solid #f0ebe3",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f0e8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isSelected ? "#f5f0e8" : "white";
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  style={{ cursor: "pointer" }}
                />
                <span>{option.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Year multi-select dropdown component
const YearMultiSelectDropdown = ({ selected = [], onChange, fromYear = 2015 }) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= fromYear; y--) {
    years.push(y.toString());
  }

  const yearOptions = years.map((year) => ({
    value: year,
    label: year,
  }));

  return (
    <MultiSelectDropdown
      options={yearOptions}
      selected={selected}
      onChange={onChange}
      placeholder="Select years..."
    />
  );
};

// Table header style - dark brown matching Ownership Management
const thStyle = {
  padding: '10px 12px',
  textAlign: 'left',
  color: '#ffffff',
  fontWeight: '600',
  fontSize: '12px',
  borderBottom: '2px solid #3d2b1f',
  backgroundColor: '#5c3a1e',
  whiteSpace: 'nowrap'
};

const thStyleRight = {
  padding: '10px 12px',
  textAlign: 'right',
  color: '#ffffff',
  fontWeight: '600',
  fontSize: '12px',
  borderBottom: '2px solid #3d2b1f',
  backgroundColor: '#5c3a1e',
  whiteSpace: 'nowrap'
};

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

  const handleInputChange = (field, value) => {
    updateData("financialOverview", { [field]: value });
  };

  const handleCurrencyChange = (field, value) => {
    setCurrencyValues((prev) => ({ ...prev, [field]: value }));
    const formattedValue = formatCurrency(value);
    updateData("financialOverview", { [field]: formattedValue });
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

      {/* Current Value Input - Now for amount, not year */}
     

      {/* Income Statement Table - Dark brown header matching Ownership Management */}
      <div style={{ marginBottom: "2rem" }}>
        <h4 style={{ color: "#8b5e3c", marginBottom: "1rem", fontWeight: "600" }}>Income Statement</h4>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              maxWidth: "700px",
              borderCollapse: "collapse",
              border: "1px solid #d6c4a8",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#5c3a1e" }}>
                <th style={thStyle}></th>
                <th style={thStyleRight}>Current Value</th>
                <th style={thStyleRight}>Previous Financial Year</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    fontWeight: "500",
                  }}
                >
                  Currency
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <select
                    value={data.incomeCurrency || "ZAR"}
                    onChange={(e) => handleInputChange("incomeCurrency", e.target.value)}
                    style={{
                      width: "100%",
                      maxWidth: "120px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                    }}
                  >
                    <option value="ZAR">ZAR (R)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                ></td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    fontWeight: "500",
                  }}
                >
                  Turnover / Revenue
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.incomeTurnoverCurrent}
                    onChange={(e) =>
                      handleCurrencyChange("incomeTurnoverCurrent", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("incomeTurnoverCurrent", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("incomeTurnoverCurrent", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.incomeTurnoverPrevious}
                    onChange={(e) =>
                      handleCurrencyChange("incomeTurnoverPrevious", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("incomeTurnoverPrevious", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("incomeTurnoverPrevious", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    fontWeight: "500",
                  }}
                >
                  Cost of Goods Sold
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.incomeCOGSCurrent}
                    onChange={(e) =>
                      handleCurrencyChange("incomeCOGSCurrent", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("incomeCOGSCurrent", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("incomeCOGSCurrent", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.incomeCOGSPrevious}
                    onChange={(e) =>
                      handleCurrencyChange("incomeCOGSPrevious", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("incomeCOGSPrevious", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("incomeCOGSPrevious", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
              </tr>
              <tr style={{ backgroundColor: "#f9f7f3" }}>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    fontWeight: "600",
                  }}
                >
                  Gross Profit
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.incomeGrossProfitCurrent}
                    onChange={(e) =>
                      handleCurrencyChange("incomeGrossProfitCurrent", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("incomeGrossProfitCurrent", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("incomeGrossProfitCurrent", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.incomeGrossProfitPrevious}
                    onChange={(e) =>
                      handleCurrencyChange("incomeGrossProfitPrevious", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("incomeGrossProfitPrevious", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("incomeGrossProfitPrevious", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    fontWeight: "500",
                  }}
                >
                  Operating Profit
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.incomeOperatingProfitCurrent}
                    onChange={(e) =>
                      handleCurrencyChange("incomeOperatingProfitCurrent", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("incomeOperatingProfitCurrent", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("incomeOperatingProfitCurrent", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.incomeOperatingProfitPrevious}
                    onChange={(e) =>
                      handleCurrencyChange("incomeOperatingProfitPrevious", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("incomeOperatingProfitPrevious", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("incomeOperatingProfitPrevious", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
              </tr>
              <tr style={{ backgroundColor: "#f9f7f3" }}>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "2px solid #5c3a1e",
                    fontWeight: "600",
                  }}
                >
                  Net Profit
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "2px solid #5c3a1e",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.incomeNetProfitCurrent}
                    onChange={(e) =>
                      handleCurrencyChange("incomeNetProfitCurrent", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("incomeNetProfitCurrent", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("incomeNetProfitCurrent", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "2px solid #5c3a1e",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.incomeNetProfitPrevious}
                    onChange={(e) =>
                      handleCurrencyChange("incomeNetProfitPrevious", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("incomeNetProfitPrevious", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("incomeNetProfitPrevious", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Balance Sheet Table - Dark brown header matching Ownership Management */}
      <div style={{ marginBottom: "2rem" }}>
        <h4 style={{ color: "#8b5e3c", marginBottom: "1rem", fontWeight: "600" }}>Balance Sheet</h4>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              maxWidth: "700px",
              borderCollapse: "collapse",
              border: "1px solid #d6c4a8",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#5c3a1e" }}>
                <th style={thStyle}></th>
                <th style={thStyleRight}>Current Value</th>
                <th style={thStyleRight}>Previous Financial Year</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    fontWeight: "500",
                  }}
                >
                  Current Assets
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.balanceCurrentAssetsCurrent}
                    onChange={(e) =>
                      handleCurrencyChange("balanceCurrentAssetsCurrent", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("balanceCurrentAssetsCurrent", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("balanceCurrentAssetsCurrent", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.balanceCurrentAssetsPrevious}
                    onChange={(e) =>
                      handleCurrencyChange("balanceCurrentAssetsPrevious", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("balanceCurrentAssetsPrevious", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("balanceCurrentAssetsPrevious", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
              </tr>
              <tr style={{ backgroundColor: "#f9f7f3" }}>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    fontWeight: "600",
                  }}
                >
                  Total Assets
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.balanceTotalAssetsCurrent}
                    onChange={(e) =>
                      handleCurrencyChange("balanceTotalAssetsCurrent", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("balanceTotalAssetsCurrent", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("balanceTotalAssetsCurrent", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.balanceTotalAssetsPrevious}
                    onChange={(e) =>
                      handleCurrencyChange("balanceTotalAssetsPrevious", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("balanceTotalAssetsPrevious", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("balanceTotalAssetsPrevious", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    fontWeight: "500",
                  }}
                >
                  Current Liabilities
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.balanceCurrentLiabilitiesCurrent}
                    onChange={(e) =>
                      handleCurrencyChange(
                        "balanceCurrentLiabilitiesCurrent",
                        e.target.value
                      )
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("balanceCurrentLiabilitiesCurrent", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("balanceCurrentLiabilitiesCurrent", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.balanceCurrentLiabilitiesPrevious}
                    onChange={(e) =>
                      handleCurrencyChange(
                        "balanceCurrentLiabilitiesPrevious",
                        e.target.value
                      )
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("balanceCurrentLiabilitiesPrevious", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("balanceCurrentLiabilitiesPrevious", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    fontWeight: "500",
                  }}
                >
                  Long Term Liabilities
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.balanceLongTermLiabilitiesCurrent}
                    onChange={(e) =>
                      handleCurrencyChange(
                        "balanceLongTermLiabilitiesCurrent",
                        e.target.value
                      )
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("balanceLongTermLiabilitiesCurrent", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("balanceLongTermLiabilitiesCurrent", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.balanceLongTermLiabilitiesPrevious}
                    onChange={(e) =>
                      handleCurrencyChange(
                        "balanceLongTermLiabilitiesPrevious",
                        e.target.value
                      )
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("balanceLongTermLiabilitiesPrevious", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("balanceLongTermLiabilitiesPrevious", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    fontWeight: "500",
                  }}
                >
                  Equity
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.balanceEquityCurrent}
                    onChange={(e) =>
                      handleCurrencyChange("balanceEquityCurrent", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("balanceEquityCurrent", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("balanceEquityCurrent", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #d6c4a8",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.balanceEquityPrevious}
                    onChange={(e) =>
                      handleCurrencyChange("balanceEquityPrevious", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("balanceEquityPrevious", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("balanceEquityPrevious", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
              </tr>
              <tr style={{ backgroundColor: "#f9f7f3" }}>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "2px solid #5c3a1e",
                    fontWeight: "600",
                  }}
                >
                  Total Liabilities
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "2px solid #5c3a1e",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.balanceTotalLiabilitiesCurrent}
                    onChange={(e) =>
                      handleCurrencyChange("balanceTotalLiabilitiesCurrent", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("balanceTotalLiabilitiesCurrent", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("balanceTotalLiabilitiesCurrent", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "2px solid #5c3a1e",
                    textAlign: "right",
                  }}
                >
                  <input
                    type="text"
                    value={currencyValues.balanceTotalLiabilitiesPrevious}
                    onChange={(e) =>
                      handleCurrencyChange("balanceTotalLiabilitiesPrevious", e.target.value)
                    }
                    onBlur={(e) =>
                      handleCurrencyBlur("balanceTotalLiabilitiesPrevious", e.target.value)
                    }
                    onFocus={(e) =>
                      handleCurrencyFocus("balanceTotalLiabilitiesPrevious", e.target.value)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "160px",
                      padding: "6px",
                      border: "1px solid #d6c4a8",
                      borderRadius: "4px",
                      textAlign: "right",
                    }}
                    placeholder="R 0"
                  />
                </td>
              </tr>
            </tbody>
          </table>
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
                if (e.target.value === "no")
                  handleInputChange("accountingSoftwareName", "");
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
                onChange={(e) =>
                  handleInputChange("accountingSoftwareName", e.target.value)
                }
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
                onChange={(e) =>
                  handleInputChange("booksUpToDateDetails", e.target.value)
                }
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

          {(data.hasManagementAccounts === "monthly" ||
            data.hasManagementAccounts === "occasionally" ||
            data.hasManagementAccounts === "yes") && (
            <>
              <FormField label="What are the latest management accounts available?">
                <input
                  type="text"
                  name="latestManagementAccounts"
                  value={data.latestManagementAccounts || ""}
                  onChange={(e) =>
                    handleInputChange("latestManagementAccounts", e.target.value)
                  }
                  className="form-input"
                  placeholder="e.g. March 2025, Q1 2025"
                />
              </FormField>
              <div style={{ marginTop: "1rem" }}>
                <FileUpload
                  label="Upload Management Accounts"
                  accept=".pdf,.xlsx,.xls"
                  onChange={(files) =>
                    handleFileChange("managementAccountsDocs", files)
                  }
                  value={data.managementAccountsDocs || []}
                  tooltip="Upload your most recent management accounts"
                />
              </div>
            </>
          )}
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
          {/* Insured */}
          <FormField label="Are you insured?" required>
            <select
              name="isInsured"
              value={data.isInsured || ""}
              onChange={(e) => {
                handleInputChange("isInsured", e.target.value);
                if (e.target.value === "no") {
                  handleInputChange("insuranceBrokerName", "");
                  handleInputChange("insuranceBrokerContact", "");
                  handleInputChange("insuranceContactPerson", "");
                }
              }}
              className="form-select"
              required
            >
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </FormField>

          {data.isInsured === "yes" && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                backgroundColor: "#f9f7f3",
                borderRadius: "8px",
                border: "1px solid #d6c4a8",
              }}
            >
              <h5 style={{ color: "#3d2b1f", marginBottom: "0.75rem" }}>
                Insurance Broker Information
              </h5>
              <FormField label="Company name">
                <input
                  type="text"
                  name="insuranceBrokerName"
                  value={data.insuranceBrokerName || ""}
                  onChange={(e) =>
                    handleInputChange("insuranceBrokerName", e.target.value)
                  }
                  className="form-input"
                  placeholder="Insurance broker company name"
                />
              </FormField>
              <FormField label="Insurance Broker contact number">
                <input
                  type="text"
                  name="insuranceBrokerContact"
                  value={data.insuranceBrokerContact || ""}
                  onChange={(e) =>
                    handleInputChange("insuranceBrokerContact", e.target.value)
                  }
                  className="form-input"
                  placeholder="Contact number"
                />
              </FormField>
              <FormField label="Insurance Contact Person">
                <input
                  type="text"
                  name="insuranceContactPerson"
                  value={data.insuranceContactPerson || ""}
                  onChange={(e) =>
                    handleInputChange("insuranceContactPerson", e.target.value)
                  }
                  className="form-input"
                  placeholder="Contact person name"
                />
              </FormField>
            </div>
          )}

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

          {(data.hasFinancialStatements === "yes_3_plus" ||
            data.hasFinancialStatements === "yes_1_2" ||
            data.hasFinancialStatements === "yes") && (
            <>
              <FormField label="Which years are available?">
                <YearMultiSelectDropdown
                  selected={data.financialStatementsYears || []}
                  onChange={(years) =>
                    handleInputChange("financialStatementsYears", years)
                  }
                />
              </FormField>
              <div style={{ marginTop: "1rem" }}>
                <FileUpload
                  label="Upload Financial Statements"
                  accept=".pdf,.xlsx,.xls"
                  onChange={(files) =>
                    handleFileChange("financialStatementsDocs", files)
                  }
                  value={data.financialStatementsDocs || []}
                  tooltip="Upload your available financial statements"
                />
              </div>
            </>
          )}
        </div>

        <div>
          {/* Audited financials */}
          <FormField
            label="Are your financials audited or independently reviewed?"
            required
          >
            <select
              name="financialsAudited"
              value={data.financialsAudited || ""}
              onChange={(e) => {
                handleInputChange("financialsAudited", e.target.value);
                if (
                  e.target.value === "no" ||
                  e.target.value === "none" ||
                  e.target.value === "internally_prepared"
                ) {
                  handleInputChange("auditorCompanyName", "");
                  handleInputChange("auditorContactNumber", "");
                  handleInputChange("auditorContactPerson", "");
                  if (e.target.value === "no" || e.target.value === "none") {
                    handleInputChange("auditedFinancialsDocs", []);
                  }
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

          {(data.financialsAudited === "audited_reviewed" ||
            data.financialsAudited === "yes") && (
            <>
              <div style={{ marginTop: "1rem" }}>
                <FileUpload
                  label="Upload Audited Financials"
                  accept=".pdf,.xlsx,.xls"
                  onChange={(files) =>
                    handleFileChange("auditedFinancialsDocs", files)
                  }
                  value={data.auditedFinancialsDocs || []}
                  tooltip="Upload your audited financial statements for the past 2-3 years"
                  required={data.financialsAudited === "audited_reviewed"}
                />
              </div>
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  backgroundColor: "#f9f7f3",
                  borderRadius: "8px",
                  border: "1px solid #d6c4a8",
                }}
              >
                <h5 style={{ color: "#3d2b1f", marginBottom: "0.75rem" }}>
                  Auditors Information
                </h5>
                <FormField label="Company name">
                  <input
                    type="text"
                    name="auditorCompanyName"
                    value={data.auditorCompanyName || ""}
                    onChange={(e) =>
                      handleInputChange("auditorCompanyName", e.target.value)
                    }
                    className="form-input"
                    placeholder="Auditor company name"
                  />
                </FormField>
                <FormField label="Auditor's contact number">
                  <input
                    type="text"
                    name="auditorContactNumber"
                    value={data.auditorContactNumber || ""}
                    onChange={(e) =>
                      handleInputChange("auditorContactNumber", e.target.value)
                    }
                    className="form-input"
                    placeholder="Contact number"
                  />
                </FormField>
                <FormField label="Auditor Contact Person">
                  <input
                    type="text"
                    name="auditorContactPerson"
                    value={data.auditorContactPerson || ""}
                    onChange={(e) =>
                      handleInputChange("auditorContactPerson", e.target.value)
                    }
                    className="form-input"
                    placeholder="Contact person name"
                  />
                </FormField>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Liabilities Section */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider">
        <h3>Liabilities</h3>
      </div>

      <div className="grid-container">
        <div>
          <FormField label="Financial Information">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label
                  style={{
                    fontSize: "13px",
                    color: "#5c4a3a",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  Payment Terms to your clients (30days, progress payment etc)
                </label>
                <input
                  type="text"
                  name="salesTerms"
                  value={data.salesTerms || ""}
                  onChange={(e) => handleInputChange("salesTerms", e.target.value)}
                  className="form-input"
                  placeholder="e.g., 30 days, 50% upfront + 50% on completion"
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "13px",
                    color: "#5c4a3a",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  Do you operate with an Overdraft facility?
                </label>
                <select
                  name="hasOverdraft"
                  value={data.hasOverdraft || ""}
                  onChange={(e) => {
                    handleInputChange("hasOverdraft", e.target.value);
                    if (e.target.value === "no") {
                      handleInputChange("overdraftValue", "");
                      handleInputChange("overdraftUtilised", "");
                    }
                  }}
                  className="form-select"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {data.hasOverdraft === "yes" && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="text"
                      name="overdraftValue"
                      value={data.overdraftValue || ""}
                      onChange={(e) =>
                        handleInputChange("overdraftValue", e.target.value)
                      }
                      className="form-input"
                      placeholder="Overdraft value"
                    />
                    <select
                      name="overdraftUtilised"
                      value={data.overdraftUtilised || ""}
                      onChange={(e) =>
                        handleInputChange("overdraftUtilised", e.target.value)
                      }
                      className="form-select"
                    >
                      <option value="">Is it regularly utilised?</option>
                      <option value="regularly">Yes, regularly</option>
                      <option value="occasionally">Occasionally</option>
                      <option value="rarely">Rarely</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{
                    fontSize: "13px",
                    color: "#5c4a3a",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  Have the directors signed personal Surety to the bank or any
                  creditors?
                </label>
                <select
                  name="directorsSurety"
                  value={data.directorsSurety || ""}
                  onChange={(e) =>
                    handleInputChange("directorsSurety", e.target.value)
                  }
                  className="form-select"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </FormField>
        </div>

        <div>
          <FormField label="&nbsp;">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label
                  style={{
                    fontSize: "13px",
                    color: "#5c4a3a",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  Have your debtors been ceded or factored?
                </label>
                <select
                  name="debtorsCeded"
                  value={data.debtorsCeded || ""}
                  onChange={(e) =>
                    handleInputChange("debtorsCeded", e.target.value)
                  }
                  className="form-select"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "13px",
                    color: "#5c4a3a",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  When is your financial year end?
                </label>
                <input
                  type="text"
                  name="financialYearEnd"
                  value={data.financialYearEnd || ""}
                  onChange={(e) =>
                    handleInputChange("financialYearEnd", e.target.value)
                  }
                  className="form-input"
                  placeholder="e.g., 28 February, 31 March"
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "13px",
                    color: "#5c4a3a",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  Bonds
                </label>
                <textarea
                  name="bonds"
                  value={data.bonds || ""}
                  onChange={(e) => handleInputChange("bonds", e.target.value)}
                  className="form-textarea"
                  placeholder="Details of any bonds"
                  rows={2}
                ></textarea>
              </div>
            </div>
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
            <MultiSelectDropdown
              options={financialChallengeOptions}
              selected={data.financialChallenges || []}
              onChange={(val) => handleInputChange("financialChallenges", val)}
              placeholder="Select financial challenges..."
            />
          </FormField>

          <div style={{ marginTop: "1rem" }}>
            <FormField label="Elaborate on your financial challenges">
              <textarea
                name="financialChallengesElaboration"
                value={data.financialChallengesElaboration || ""}
                onChange={(e) =>
                  handleInputChange("financialChallengesElaboration", e.target.value)
                }
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

          <div style={{ marginTop: "1rem" }}>
            <FormField label="Fundraising History">
              <textarea
                name="fundraisingHistory"
                value={data.fundraisingHistory || ""}
                onChange={(e) =>
                  handleInputChange("fundraisingHistory", e.target.value)
                }
                className="form-textarea"
                placeholder="List funders and funded amounts"
                rows={3}
              ></textarea>
            </FormField>
          </div>
        </div>
        <div>
          <FormField label="What type of additional support does your business currently need? (Select all that apply)">
            <MultiSelectDropdown
              options={supportTypeOptions}
              selected={data.supportTypeNeeded || []}
              onChange={(val) => handleInputChange("supportTypeNeeded", val)}
              placeholder="Select support types..."
            />
          </FormField>
        </div>
      </div>
      
      {/* AI Financial Health Analysis */}
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