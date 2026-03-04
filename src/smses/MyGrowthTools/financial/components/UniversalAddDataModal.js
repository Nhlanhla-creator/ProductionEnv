"use client";
import { useState, useEffect } from "react";
import { db } from "../../../../firebaseConfig";
import { collection, doc, getDoc, setDoc, addDoc } from "firebase/firestore";
import {
  EMPTY_BALANCE_SHEET,
  EMPTY_PNL,
} from "../financialConstants";

// ── Inline range helpers (no external dependency) ─────────────────────────
const _MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const _parseYM = (ym) => { const [y, m] = ym.split("-").map(Number); return { year: y, monthIndex: m - 1 }; };
const _toYM = (year, mi) => `${year}-${String(mi + 1).padStart(2, "0")}`;
const _getRangeMonthsMeta = (fromYM, toYM) => {
  const result = [];
  let { year, monthIndex } = _parseYM(fromYM);
  const end = _parseYM(toYM);
  while (year < end.year || (year === end.year && monthIndex <= end.monthIndex)) {
    result.push({ label: `${_MN[monthIndex]} ${year}`, ym: _toYM(year, monthIndex), year, monthIndex });
    monthIndex++;
    if (monthIndex === 12) { monthIndex = 0; year++; }
  }
  return result;
};
const _getDefaultRange = () => {
  const now = new Date();
  const to   = _toYM(now.getFullYear(), now.getMonth());
  const d    = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  return { from: _toYM(d.getFullYear(), d.getMonth()), to };
};

// ==================== MODAL INPUT HELPERS ====================

const inputCls = "w-full px-1.5 py-1.5 rounded border border-[#e8ddd4] text-xs";
const labelCls = "text-[10px] text-lightBrown block mb-0.5";

/**
 * monthsMeta: array of { label: "Jan 2024", calIdx: 0, ym: "2024-01" }
 * data arrays are always 12-slot calendar-indexed (Jan=0 … Dec=11).
 * We only render the cells whose calIdx is in range for this year.
 */
const MonthlyInputRow = ({
  label, category, data, setData,
  unit = "", step = "0.01",
  isSelect = false, selectOptions = [],
  monthsMeta,
}) => (
  <div className="mb-5">
    <h5 className="text-mediumBrown mb-4 font-semibold text-sm">
      {label} {unit && <span className="text-xs text-lightBrown ml-2">({unit})</span>}
    </h5>
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${monthsMeta.length}, minmax(0, 1fr))` }}>
      {monthsMeta.map(({ label: colLabel, calIdx }) => (
        <div key={calIdx}>
          <label className={labelCls}>{colLabel}</label>
          {isSelect ? (
            <select
              value={data[category]?.[calIdx] || ""}
              onChange={(e) => {
                const n = { ...data };
                if (!n[category]) n[category] = Array(12).fill("");
                n[category] = [...n[category]];
                n[category][calIdx] = e.target.value;
                setData(n);
              }}
              className={inputCls}
            >
              <option value="">Select</option>
              {selectOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <input
              type="number" step={step} placeholder="0"
              value={data[category]?.[calIdx] || ""}
              onChange={(e) => {
                const n = { ...data };
                if (!n[category]) n[category] = Array(12).fill("");
                n[category] = [...n[category]];
                n[category][calIdx] = e.target.value;
                setData(n);
              }}
              className={inputCls}
            />
          )}
        </div>
      ))}
    </div>
  </div>
);

const BalanceSheetSection = ({ title, data, setData, monthsMeta }) => {
  if (!data || typeof data !== "object") return (
    <div className="mb-7 p-4 bg-[#f5f0eb] rounded-lg">
      <h4 className="text-mediumBrown mb-4">{title}</h4>
      <p className="text-lightBrown text-center">No data available</p>
    </div>
  );
  return (
    <div className="mb-7 p-4 bg-[#f5f0eb] rounded-lg">
      <h4 className="text-mediumBrown mb-4 font-semibold">{title}</h4>
      {Object.keys(data).map((key) => (
        <div key={key} className="mb-4">
          <label className="block text-mediumBrown font-semibold mb-2 text-xs">
            {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
          </label>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${monthsMeta.length}, minmax(0, 1fr))` }}>
            {monthsMeta.map(({ label: colLabel, calIdx }) => (
              <div key={calIdx}>
                <label className={labelCls}>{colLabel}</label>
                <input
                  type="number" step="0.01"
                  value={data[key]?.[calIdx] || ""}
                  onChange={(e) => {
                    const n = { ...data };
                    if (!n[key]) n[key] = Array(12).fill("");
                    n[key] = [...n[key]];
                    n[key][calIdx] = e.target.value;
                    setData(n);
                  }}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== TAB DEFINITIONS ====================
const MODAL_TABS = [
  { id: "capital-structure",  label: "Capital Structure (Balance Sheet)" },
  { id: "performance-engine", label: "Performance Engine (P&L)" },
  { id: "cost-agility",       label: "Cost Agility" },
  { id: "liquidity-survival", label: "Liquidity & Survival" },
  { id: "dividends",          label: "Dividend History" },
  { id: "loans",              label: "Loan Management" },
  { id: "custom-kpi",         label: "Custom KPI" },
];

// ==================== SAVE HELPERS ====================
const savePnl = async (uid, pnlData, year) => {
  const num = (v) => parseFloat(v) || 0;
  const pnlFields = [
    "sales","salesBudget","cogs","cogsBudget","opex","opexBudget",
    "salaries","salariesBudget","rent","rentBudget","utilities","utilitiesBudget",
    "marketing","marketingBudget","admin","adminBudget","otherExpenses","otherExpensesBudget",
    "depreciation","depreciationBudget","amortization","amortizationBudget",
    "interestExpense","interestExpenseBudget","interestIncome","interestIncomeBudget",
    "tax","taxBudget",
  ];
  await setDoc(doc(db, "financialData", `${uid}_pnlManual_${year}`), {
    userId: uid, year,
    ...Object.fromEntries(pnlFields.map((f) => [f, pnlData[f]?.map(num) ?? Array(12).fill(0)])),
    notes: pnlData.notes,
    lastUpdated: new Date().toISOString(),
  });
};

// ==================== MAIN MODAL ====================
const UniversalAddDataModal = ({
  isOpen, onClose, currentTab, user, onSave, loading,
  fromDate: fromDateProp,
  toDate:   toDateProp,
}) => {
  // Resolve range — fall back to default last-12-months if props not supplied
  const { from: defaultFrom, to: defaultTo } = _getDefaultRange();
  const fromDate = fromDateProp ?? defaultFrom;
  const toDate   = toDateProp   ?? defaultTo;

  // Derive year tabs from the range
  const rangeMeta  = _getRangeMonthsMeta(fromDate, toDate);
  const rangeYears = [...new Set(rangeMeta.map((m) => m.year))];

  const [activeTab, setActiveTab]       = useState(currentTab);
  const [selectedYear, setSelectedYear] = useState(rangeYears[rangeYears.length - 1]); // default to last year in range

  // Months in range for the selected year — used by all MonthlyInputRow / BalanceSheetSection
  const monthsMeta = rangeMeta
    .filter((m) => m.year === selectedYear)
    .map((m) => ({ label: m.label, calIdx: m.monthIndex, ym: m.ym }));

  // Per-tab state
  const [balanceSheetData, setBalanceSheetData] = useState(EMPTY_BALANCE_SHEET);
  const [pnlData,    setPnlData]    = useState(EMPTY_PNL);
  const [costData,   setCostData]   = useState({ fixedCosts: Array(12).fill(""), variableCosts: Array(12).fill(""), discretionaryCosts: Array(12).fill(""), semiVariableCosts: Array(12).fill(""), lockInDuration: Array(12).fill(""), notes: "" });
  const [liquidData, setLiquidData] = useState({ currentRatio: Array(12).fill(""), quickRatio: Array(12).fill(""), cashRatio: Array(12).fill(""), burnRate: Array(12).fill(""), cashCover: Array(12).fill(""), cashflow: Array(12).fill(""), operatingCashflow: Array(12).fill(""), investingCashflow: Array(12).fill(""), financingCashflow: Array(12).fill(""), loanRepayments: Array(12).fill(""), cashBalance: Array(12).fill(""), workingCapital: Array(12).fill(""), notes: "" });
  const [dividendData, setDividendData] = useState({ date: "", amount: "", type: "Interim", declaredBy: "" });
  const [loanData,     setLoanData]     = useState({ name: "", amount: "", interestRate: "", startDate: "", term: "", monthlyPayment: "", status: "active" });
  const [customKPI,    setCustomKPI]    = useState({ name: "", type: "bar", dataType: "currency", actual: Array(12).fill(""), budget: Array(12).fill("") });

  // Keep selectedYear in range when fromDate/toDate change
  useEffect(() => {
    if (!rangeYears.includes(selectedYear))
      setSelectedYear(rangeYears[rangeYears.length - 1]);
  }, [fromDate, toDate]);

  // Load existing data when tab or year changes
  useEffect(() => {
    if (!isOpen || !user) return;
    const load = async () => {
      try {
        const snapId = {
          "capital-structure":  `${user.uid}_capitalStructure_${selectedYear}`,
          "performance-engine": `${user.uid}_pnlManual_${selectedYear}`,
          "cost-agility":       `${user.uid}_costAgility_${selectedYear}`,
          "liquidity-survival": `${user.uid}_liquiditySurvival_${selectedYear}`,
        }[activeTab];
        if (!snapId) return;
        let snap = await getDoc(doc(db, "financialData", snapId));
        const legacyId = snapId.replace(`_${selectedYear}`, "");
        if (!snap.exists()) snap = await getDoc(doc(db, "financialData", legacyId));
        if (!snap.exists()) return;
        const d = snap.data();
        if (activeTab === "capital-structure"  && d.balanceSheetData) setBalanceSheetData(d.balanceSheetData);
        if (activeTab === "performance-engine") setPnlData((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(prev).filter((k) => k !== "notes").map((k) => [k, d[k]?.map((v) => v.toFixed(2)) ?? Array(12).fill("")])), notes: d.notes || "" }));
        if (activeTab === "cost-agility")       setCostData({ fixedCosts: d.fixedCosts?.map((v) => v.toFixed(2)) ?? Array(12).fill(""), variableCosts: d.variableCosts?.map((v) => v.toFixed(2)) ?? Array(12).fill(""), discretionaryCosts: d.discretionaryCosts?.map((v) => v.toFixed(2)) ?? Array(12).fill(""), semiVariableCosts: d.semiVariableCosts?.map((v) => v.toFixed(2)) ?? Array(12).fill(""), lockInDuration: d.lockInDuration?.map((v) => v.toFixed(0)) ?? Array(12).fill(""), notes: d.notes || "" });
        if (activeTab === "liquidity-survival") setLiquidData({ currentRatio: d.currentRatio?.map((v) => v.toFixed(2)) ?? Array(12).fill(""), quickRatio: d.quickRatio?.map((v) => v.toFixed(2)) ?? Array(12).fill(""), cashRatio: d.cashRatio?.map((v) => v.toFixed(2)) ?? Array(12).fill(""), burnRate: d.burnRate?.map((v) => v.toFixed(2)) ?? Array(12).fill(""), cashCover: d.cashCover?.map((v) => v.toFixed(1)) ?? Array(12).fill(""), cashflow: d.cashflow?.map((v) => v.toFixed(2)) ?? Array(12).fill(""), operatingCashflow: d.operatingCashflow?.map((v) => v.toFixed(2)) ?? Array(12).fill(""), investingCashflow: d.investingCashflow?.map((v) => v.toFixed(2)) ?? Array(12).fill(""), financingCashflow: d.financingCashflow?.map((v) => v.toFixed(2)) ?? Array(12).fill(""), loanRepayments: d.loanRepayments?.map((v) => v.toFixed(2)) ?? Array(12).fill(""), cashBalance: d.cashBalance?.map((v) => v.toFixed(2)) ?? Array(12).fill(""), workingCapital: d.workingCapital?.map((v) => v.toFixed(2)) ?? Array(12).fill(""), notes: d.notes || "" });
      } catch (e) { console.error("Error loading tab data:", e); }
    };
    load();
  }, [isOpen, activeTab, user, selectedYear]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please log in");
    try {
      const num = (v) => parseFloat(v) || 0;
      switch (activeTab) {
        case "capital-structure":
          await setDoc(doc(db, "financialData", `${user.uid}_capitalStructure_${selectedYear}`), { userId: user.uid, balanceSheetData, year: selectedYear, lastUpdated: new Date().toISOString() });
          break;
        case "performance-engine":
          await savePnl(user.uid, pnlData, selectedYear);
          break;
        case "cost-agility":
          await setDoc(doc(db, "financialData", `${user.uid}_costAgility_${selectedYear}`), { userId: user.uid, fixedCosts: costData.fixedCosts.map(num), variableCosts: costData.variableCosts.map(num), discretionaryCosts: costData.discretionaryCosts.map(num), semiVariableCosts: costData.semiVariableCosts.map(num), lockInDuration: costData.lockInDuration.map(num), notes: costData.notes, year: selectedYear, lastUpdated: new Date().toISOString() });
          break;
        case "liquidity-survival":
          await setDoc(doc(db, "financialData", `${user.uid}_liquiditySurvival_${selectedYear}`), { userId: user.uid, ...Object.fromEntries(Object.keys(liquidData).filter((k) => k !== "notes").map((k) => [k, liquidData[k].map(num)])), notes: liquidData.notes, year: selectedYear, lastUpdated: new Date().toISOString() });
          break;
        case "dividends":
          if (!dividendData.date || !dividendData.amount) return alert("Fill required fields");
          await addDoc(collection(db, "financialData", `${user.uid}_dividends`, "dividendHistory"), { ...dividendData, amount: num(dividendData.amount), userId: user.uid, createdAt: new Date().toISOString() });
          break;
        case "loans": {
          if (!loanData.name || !loanData.amount) return alert("Fill required fields");
          const loanId = `loan_${Date.now()}`;
          await setDoc(doc(db, "financialData", `${user.uid}_${loanId}`), { userId: user.uid, id: loanId, type: "loan", section: "liquidity-survival", ...loanData, amount: num(loanData.amount), interestRate: num(loanData.interestRate), term: parseInt(loanData.term) || 0, monthlyPayment: num(loanData.monthlyPayment), createdDate: new Date().toISOString(), lastUpdated: new Date().toISOString() });
          break;
        }
        case "custom-kpi": {
          if (!customKPI.name.trim()) return alert("Enter KPI name");
          const chartName = customKPI.name.toLowerCase().replace(/\s+/g, "_");
          await setDoc(doc(db, "financialData", `${user.uid}_${chartName}`), { userId: user.uid, chartName, name: customKPI.name, type: customKPI.type, dataType: customKPI.dataType, actual: customKPI.actual.map(num), budget: customKPI.budget.map(num), isCustomKPI: true, section: "performance-engine", lastUpdated: new Date().toISOString() });
          break;
        }
      }
      onSave?.();
      alert("Data saved successfully!");
    } catch (e) {
      console.error("Error saving:", e);
      alert("Error saving data. Please try again.");
    }
  };

  if (!isOpen) return null;

  // ── Shared render helpers ──────────────────────────────────────────────────
  const renderFields = (data, setData, fields) =>
    fields.map(([category, label, opts]) => (
      <MonthlyInputRow
        key={category}
        category={category} label={label}
        data={data} setData={setData}
        monthsMeta={monthsMeta}
        {...(opts || {})}
      />
    ));

  const textareaRow = (value, onChange, placeholder) => (
    <div className="mb-5">
      <label className="block mb-2.5 text-mediumBrown font-semibold text-sm">Notes:</label>
      <textarea value={value} onChange={onChange} placeholder={placeholder}
        className="w-full p-2.5 rounded border border-[#e8ddd4] min-h-[80px] text-sm resize-y" />
    </div>
  );

  const selectField = (label, value, onChange, children) => (
    <div className="mb-4">
      <label className="block text-mediumBrown mb-1 text-xs font-semibold">{label}</label>
      <select value={value} onChange={onChange} className="w-full p-2.5 rounded border border-[#e8ddd4] text-sm">{children}</select>
    </div>
  );

  const inputField = (label, type, value, onChange, placeholder = "", extra = {}) => (
    <div className="mb-4">
      <label className="block text-mediumBrown mb-1 text-xs font-semibold">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} {...extra}
        className="w-full p-2.5 rounded border border-[#e8ddd4] text-sm" />
    </div>
  );

  const DATA_TABS = ["capital-structure","performance-engine","cost-agility","liquidity-survival","custom-kpi"];

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]">
      <div className="bg-[#fdfcfb] p-5 rounded-lg max-w-[1400px] max-h-[90vh] overflow-auto w-[95%]">

        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-mediumBrown m-0 font-semibold">Add Financial Data</h3>
          <button onClick={onClose} className="bg-transparent border-0 text-2xl text-mediumBrown cursor-pointer leading-none">×</button>
        </div>

        {/* Section tab navigation */}
        <div className="flex gap-2.5 mb-5 flex-wrap">
          {MODAL_TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 border-0 rounded-md cursor-pointer font-semibold text-sm transition-all ${activeTab === tab.id ? "bg-mediumBrown text-[#fdfcfb]" : "bg-[#e8ddd4] text-mediumBrown hover:bg-[#d4c4b8]"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Year tabs — shown for data-entry tabs only; derived from date range */}
        {DATA_TABS.includes(activeTab) && (
          <div className="flex gap-2 mb-5 items-center flex-wrap">
            <span className="text-mediumBrown text-sm font-semibold mr-1">Year:</span>
            {rangeYears.map((yr) => (
              <button key={yr} onClick={() => setSelectedYear(yr)}
                className={`px-4 py-1.5 border-0 rounded-md cursor-pointer font-semibold text-sm transition-all ${selectedYear === yr ? "bg-warmBrown text-[#fdfcfb]" : "bg-[#e8ddd4] text-mediumBrown hover:bg-[#d4c4b8]"}`}>
                {yr}
              </button>
            ))}
            <span className="text-xs text-lightBrown ml-2">
              Showing {monthsMeta.length} month{monthsMeta.length !== 1 ? "s" : ""} in range
            </span>
          </div>
        )}

        {/* ===== CAPITAL STRUCTURE ===== */}
        {activeTab === "capital-structure" && (
          <div>
            {["bank","currentAssets","fixedAssets","intangibleAssets","nonCurrentAssets","additionalMetrics"].map((section) => (
              <BalanceSheetSection
                key={section}
                title={section.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                data={balanceSheetData.assets[section]}
                monthsMeta={monthsMeta}
                setData={(newData) => setBalanceSheetData((prev) => ({ ...prev, assets: { ...prev.assets, [section]: newData } }))}
              />
            ))}
            {["currentLiabilities","nonCurrentLiabilities"].map((section) => (
              <BalanceSheetSection
                key={section}
                title={section.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                data={balanceSheetData.liabilities[section]}
                monthsMeta={monthsMeta}
                setData={(newData) => setBalanceSheetData((prev) => ({ ...prev, liabilities: { ...prev.liabilities, [section]: newData } }))}
              />
            ))}
            <BalanceSheetSection title="Equity" data={balanceSheetData.equity}
              monthsMeta={monthsMeta}
              setData={(newData) => setBalanceSheetData((prev) => ({ ...prev, equity: newData }))} />

            {/* Custom categories */}
            <div className="mt-5 p-5 bg-[#fdfcfb] rounded-lg border-2 border-dashed border-[#e8ddd4]">
              <h4 className="text-mediumBrown mb-4 font-semibold">Add Custom Category</h4>
              <p className="text-lightBrown text-xs mb-4">Create your own balance sheet categories.</p>
              <button
                onClick={() => {
                  const cat = prompt("Enter custom category name:");
                  if (cat) {
                    const item = prompt(`Enter item name for ${cat}:`);
                    if (item) setBalanceSheetData((prev) => ({ ...prev, assets: { ...prev.assets, customCategories: [...(prev.assets?.customCategories || []), { category: cat, items: { [item]: Array(12).fill("") } }] } }));
                  }
                }}
                className="px-5 py-2.5 bg-mediumBrown text-[#fdfcfb] border-0 rounded-md cursor-pointer font-semibold text-sm">
                + Add Custom Category
              </button>
              {balanceSheetData?.assets?.customCategories?.map((custom, idx) => (
                <div key={idx} className="mt-5 p-4 bg-[#f5f0eb] rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="text-mediumBrown m-0">{custom?.category || "Custom Category"}</h5>
                    <button onClick={() => setBalanceSheetData((prev) => ({ ...prev, assets: { ...prev.assets, customCategories: prev.assets.customCategories.filter((_, i) => i !== idx) } }))}
                      className="px-2 py-1 bg-red-500 text-white border-0 rounded cursor-pointer text-xs">Remove</button>
                  </div>
                  {custom?.items && Object.keys(custom.items).map((itemKey) => (
                    <div key={itemKey} className="mb-4">
                      <label className="block text-mediumBrown font-semibold mb-2 text-xs">{itemKey}</label>
                      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${monthsMeta.length}, minmax(0, 1fr))` }}>
                        {monthsMeta.map(({ label: colLabel, calIdx }) => (
                          <div key={calIdx}>
                            <label className={labelCls}>{colLabel}</label>
                            <input type="number" step="0.01" value={custom.items[itemKey]?.[calIdx] || ""}
                              onChange={(e) => setBalanceSheetData((prev) => {
                                const cats = [...prev.assets.customCategories];
                                cats[idx] = { ...cats[idx], items: { ...cats[idx].items, [itemKey]: [...(cats[idx].items[itemKey] || Array(12).fill(""))].map((v, i) => i === calIdx ? e.target.value : v) } };
                                return { ...prev, assets: { ...prev.assets, customCategories: cats } };
                              })}
                              className={inputCls} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { const item = prompt(`New item for ${custom?.category}:`); if (item) setBalanceSheetData((prev) => { const cats = [...prev.assets.customCategories]; cats[idx] = { ...cats[idx], items: { ...cats[idx].items, [item]: Array(12).fill("") } }; return { ...prev, assets: { ...prev.assets, customCategories: cats } }; }) }}
                    className="px-4 py-2 bg-[#e8ddd4] text-mediumBrown border-0 rounded cursor-pointer font-semibold text-xs">
                    + Add Item to {custom?.category}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== PERFORMANCE ENGINE ===== */}
        {activeTab === "performance-engine" && (
          <div>
            <h4 className="text-mediumBrown mb-5 font-semibold">Profit & Loss Statement</h4>
            {[
              [["sales","Sales / Revenue",{unit:"R"}],["salesBudget","Sales Budget",{unit:"R"}]],
              [["cogs","COGS",{unit:"R"}],["cogsBudget","COGS Budget",{unit:"R"}]],
            ].map((group, gi) => (
              <div key={gi} className="mb-7">
                <h5 className="text-mediumBrown mb-4 font-semibold text-sm">{gi === 0 ? "Revenue" : "Cost of Goods Sold"}</h5>
                {renderFields(pnlData, setPnlData, group)}
              </div>
            ))}
            <div className="mb-7">
              <h5 className="text-mediumBrown mb-4 font-semibold text-sm">Operating Expenses</h5>
              {renderFields(pnlData, setPnlData, [
                ["opex","Total Opex",{unit:"R"}],["opexBudget","Opex Budget",{unit:"R"}],
                ["salaries","Salaries & Wages",{unit:"R"}],["salariesBudget","Salaries Budget",{unit:"R"}],
                ["rent","Rent",{unit:"R"}],["rentBudget","Rent Budget",{unit:"R"}],
                ["utilities","Utilities",{unit:"R"}],["utilitiesBudget","Utilities Budget",{unit:"R"}],
                ["marketing","Marketing",{unit:"R"}],["marketingBudget","Marketing Budget",{unit:"R"}],
                ["admin","Administrative",{unit:"R"}],["adminBudget","Administrative Budget",{unit:"R"}],
                ["otherExpenses","Other Expenses",{unit:"R"}],["otherExpensesBudget","Other Expenses Budget",{unit:"R"}],
              ])}
            </div>
            <div className="mb-7">
              <h5 className="text-mediumBrown mb-4 font-semibold text-sm">Depreciation & Amortization</h5>
              {renderFields(pnlData, setPnlData, [
                ["depreciation","Depreciation",{unit:"R"}],["depreciationBudget","Depreciation Budget",{unit:"R"}],
                ["amortization","Amortization",{unit:"R"}],["amortizationBudget","Amortization Budget",{unit:"R"}],
              ])}
            </div>
            <div className="mb-7">
              <h5 className="text-mediumBrown mb-4 font-semibold text-sm">Interest & Tax</h5>
              {renderFields(pnlData, setPnlData, [
                ["interestExpense","Interest Expense",{unit:"R"}],["interestExpenseBudget","Interest Expense Budget",{unit:"R"}],
                ["interestIncome","Interest Income",{unit:"R"}],["interestIncomeBudget","Interest Income Budget",{unit:"R"}],
                ["tax","Tax",{unit:"R"}],["taxBudget","Tax Budget",{unit:"R"}],
              ])}
            </div>
            {textareaRow(pnlData.notes, (e) => setPnlData((p) => ({ ...p, notes: e.target.value })), "Add any additional notes...")}
          </div>
        )}

        {/* ===== COST AGILITY ===== */}
        {activeTab === "cost-agility" && (
          <div>
            <h4 className="text-mediumBrown mb-5 font-semibold">Cost Structure Analysis</h4>
            {renderFields(costData, setCostData, [
              ["fixedCosts","Fixed Costs",{unit:"R"}],
              ["variableCosts","Variable Costs",{unit:"R"}],
              ["semiVariableCosts","Semi-Variable Costs",{unit:"R"}],
              ["discretionaryCosts","Discretionary Costs",{unit:"R"}],
              ["lockInDuration","Fixed Costs Lock-in Duration",{unit:"months",step:"1"}],
            ])}
            {textareaRow(costData.notes, (e) => setCostData((p) => ({ ...p, notes: e.target.value })), "Add notes about your cost structure...")}
          </div>
        )}

        {/* ===== LIQUIDITY ===== */}
        {activeTab === "liquidity-survival" && (
          <div>
            <h4 className="text-mediumBrown mb-5 font-semibold">Liquidity & Survival Metrics</h4>
            {renderFields(liquidData, setLiquidData, [
              ["currentRatio","Current Ratio",{step:"0.01",unit:"ratio"}],
              ["quickRatio","Quick Ratio",{step:"0.01",unit:"ratio"}],
              ["cashRatio","Cash Ratio",{step:"0.01",unit:"ratio"}],
              ["burnRate","Burn Rate",{unit:"R"}],
              ["cashCover","Cash Cover",{unit:"months",step:"1"}],
              ["cashflow","Free Cashflow",{unit:"R"}],
              ["operatingCashflow","Operating Cashflow",{unit:"R"}],
              ["investingCashflow","Investing Cashflow",{unit:"R"}],
              ["financingCashflow","Financing Cashflow",{unit:"R"}],
              ["loanRepayments","Loan Repayments",{unit:"R"}],
              ["cashBalance","Cash Balance",{unit:"R"}],
              ["workingCapital","Working Capital",{unit:"R"}],
            ])}
            {textareaRow(liquidData.notes, (e) => setLiquidData((p) => ({ ...p, notes: e.target.value })), "Add notes about your liquidity position...")}
          </div>
        )}

        {/* ===== DIVIDENDS ===== */}
        {activeTab === "dividends" && (
          <div className="p-5">
            <h4 className="text-mediumBrown mb-5 font-semibold">Add Dividend Record</h4>
            {inputField("Date *",        "date",   dividendData.date,        (e) => setDividendData((p) => ({ ...p, date: e.target.value })))}
            {inputField("Amount (ZAR) *","number", dividendData.amount,      (e) => setDividendData((p) => ({ ...p, amount: e.target.value })), "0.00")}
            {selectField("Type", dividendData.type, (e) => setDividendData((p) => ({ ...p, type: e.target.value })),
              <><option value="Interim">Interim</option><option value="Final">Final</option><option value="Special">Special</option></>
            )}
            {inputField("Declared By",  "text",   dividendData.declaredBy,  (e) => setDividendData((p) => ({ ...p, declaredBy: e.target.value })), "e.g., Board Resolution #123")}
          </div>
        )}

        {/* ===== LOANS ===== */}
        {activeTab === "loans" && (
          <div className="p-5">
            <h4 className="text-mediumBrown mb-5 font-semibold">Add Loan</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {inputField("Loan Name *",          "text",   loanData.name,          (e) => setLoanData((p) => ({ ...p, name: e.target.value })),          "e.g., Business Loan")}
              {inputField("Loan Amount (R m) *",  "number", loanData.amount,        (e) => setLoanData((p) => ({ ...p, amount: e.target.value })),        "0.00")}
              {inputField("Interest Rate (%)",    "number", loanData.interestRate,  (e) => setLoanData((p) => ({ ...p, interestRate: e.target.value })),  "0.0", { step: "0.1" })}
              {inputField("Start Date",           "date",   loanData.startDate,     (e) => setLoanData((p) => ({ ...p, startDate: e.target.value })))}
              {inputField("Term (months)",        "number", loanData.term,          (e) => setLoanData((p) => ({ ...p, term: e.target.value })),          "12")}
              {inputField("Monthly Payment (R m)","number", loanData.monthlyPayment,(e) => setLoanData((p) => ({ ...p, monthlyPayment: e.target.value })),"0.00")}
            </div>
            {selectField("Status", loanData.status, (e) => setLoanData((p) => ({ ...p, status: e.target.value })),
              <><option value="active">Active</option><option value="paid">Paid Off</option></>
            )}
          </div>
        )}

        {/* ===== CUSTOM KPI ===== */}
        {activeTab === "custom-kpi" && (
          <div className="p-5">
            <h4 className="text-mediumBrown mb-5 font-semibold">Create Custom KPI</h4>
            {inputField("KPI Name *","text", customKPI.name, (e) => setCustomKPI((p) => ({ ...p, name: e.target.value })), "e.g., Customer Acquisition Cost")}
            <div className="grid grid-cols-2 gap-5 mb-5">
              {selectField("Chart Type", customKPI.type, (e) => setCustomKPI((p) => ({ ...p, type: e.target.value })),
                <><option value="bar">Bar Chart</option><option value="line">Line Chart</option></>
              )}
              {selectField("Data Type", customKPI.dataType, (e) => setCustomKPI((p) => ({ ...p, dataType: e.target.value })),
                <><option value="currency">Currency (R m)</option><option value="percentage">Percentage (%)</option><option value="number">Number</option></>
              )}
            </div>
            <h5 className="text-mediumBrown mb-4 font-semibold text-sm">Actual Values</h5>
            <MonthlyInputRow category="actual" label="Actual" data={customKPI} setData={setCustomKPI}
              monthsMeta={monthsMeta}
              unit={customKPI.dataType === "percentage" ? "%" : customKPI.dataType === "currency" ? "R" : "units"} />
            <h5 className="text-mediumBrown mb-4 font-semibold text-sm">Budget Values</h5>
            <MonthlyInputRow category="budget" label="Budget" data={customKPI} setData={setCustomKPI}
              monthsMeta={monthsMeta}
              unit={customKPI.dataType === "percentage" ? "%" : customKPI.dataType === "currency" ? "R" : "units"} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2.5 justify-end mt-5">
          <button onClick={onClose}
            className="px-5 py-2.5 bg-[#e8ddd4] text-mediumBrown border-0 rounded-md cursor-pointer font-semibold">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading}
            className={`px-5 py-2.5 bg-mediumBrown text-[#fdfcfb] border-0 rounded-md font-semibold ${loading ? "opacity-70 cursor-wait" : "cursor-pointer hover:bg-[#4a3027]"}`}>
            {loading ? "Saving…" : "Save Data"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversalAddDataModal;