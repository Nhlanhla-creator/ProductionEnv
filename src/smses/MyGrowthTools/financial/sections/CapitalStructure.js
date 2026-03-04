"use client";
import { useState, useEffect } from "react";
import { db } from "../../../../firebaseConfig";
import { collection, doc, addDoc, getDoc } from "firebase/firestore";
import {
  KeyQuestionBox,
  KPICard,
  TrendModal,
  CalculationModal,
  TrendButton,
  SectionHeading,
  DateRangePicker,
} from "../components/SharedComponents";
import UniversalAddDataModal from "../components/UniversalAddDataModal";
import { useCapitalStructureData } from "../../../hooks/useFinancialData";
import {
  getYearsRange,
  CALCULATION_TEXTS,
} from "../financialConstants";
import {
  calculateTotal,
  formatCurrency,
  makeFormatValue,
  parseYM,
  getRangeMonthsMeta,
  getRangeLabels,
  getRangeComputed,
  computeCapitalStructureChartData,
  formatSmartNumber,
  getSmartUnit,
} from "../financialUtils";

// ==================== HELPERS ====================

const _now        = new Date();
const _defaultTo  = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}`;
const _defaultFrom = (() => {
  const d = new Date(_now.getFullYear(), _now.getMonth() - 11, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();

// ==================== BALANCE SHEET TABLE ====================
const BSTable = ({ title, rows, totalLabel, totalValue, openTrend, totalTrendFn }) => (
  <div className="mb-5">
    <h4 className="text-mediumBrown text-base font-semibold mb-2.5 border-b border-[#e8ddd4] pb-1">
      {title}
    </h4>
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-[#e8ddd4]">
          <th className="p-2.5 text-left text-mediumBrown text-xs font-semibold">Item</th>
          <th className="p-2.5 text-right text-mediumBrown text-xs font-semibold">Amount</th>
          <th className="p-2.5 text-center text-mediumBrown text-xs font-semibold w-12">Trend</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ key, label, value, redLabel, arr }) => (
          <tr key={key}>
            <td className="py-2 text-mediumBrown text-xs">{label}</td>
            <td className={`py-2 text-right text-xs font-semibold ${redLabel ? "text-red-700" : "text-mediumBrown"}`}>
              {redLabel ? `(${value})` : value}
            </td>
            <td className="py-2 text-center">
              <TrendButton onClick={() => openTrend(label, arr)} />
            </td>
          </tr>
        ))}
        {totalLabel && (
          <tr className="bg-[#f5f0eb]">
            <td className="py-2.5 text-mediumBrown text-sm font-bold">{totalLabel}</td>
            <td className="py-2.5 text-right text-mediumBrown text-sm font-bold">{totalValue}</td>
            <td className="py-2.5 text-center">
              {totalTrendFn && <TrendButton onClick={totalTrendFn} />}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// ==================== CAPITAL STRUCTURE COMPONENT ====================
const CapitalStructure = ({ activeSection, user, isInvestorView }) => {
  // ── Sub-tab & modal state ──────────────────────────────────────────────────
  const [activeSubTab, setActiveSubTab]   = useState("balance-sheet");
  const [showModal, setShowModal]         = useState(false);
  const [showDividendModal, setShowDividendModal] = useState(false);

  // ── Date range filter — drives everything ─────────────────────────────────
  const [filterMode, setFilterMode]   = useState("range");
  const [fromDate, setFromDate]       = useState(_defaultFrom);
  const [toDate, setToDate]           = useState(_defaultTo);
  const [selectedYear, setSelectedYear] = useState(_now.getFullYear());

  // ── Trend / calculation modals ────────────────────────────────────────────
  const [showTrendModal, setShowTrendModal]       = useState(false);
  const [selectedTrendItem, setSelectedTrendItem] = useState(null);
  const [trendData, setTrendData]                 = useState(null);
  const [trendLoading, setTrendLoading]           = useState(false);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [selectedCalculation, setSelectedCalculation]   = useState({ title: "", calculation: "" });

  // ── Notes / dividend form ─────────────────────────────────────────────────
  const [kpiNotes, setKpiNotes]       = useState({});
  const [expandedNotes, setExpandedNotes] = useState({});
  const [dividendForm, setDividendForm]   = useState({ date: "", amount: "", type: "Interim", declaredBy: "" });

  const [currencyUnit] = useState("zar_million");

  // ── Hook ──────────────────────────────────────────────────────────────────
  const {
    balanceSheetData,
    solvencyData,   setSolvencyData,
    leverageData,   setLeverageData,
    equityData,     setEquityData,
    dividendHistory,
    kpiAnalysis,
    loading,
    firstDataMonth,
    loadCapitalStructureData,
    loadDividendHistory,
    loadTrendData,
  } = useCapitalStructureData(user);

  // ── Derived snapshot index — always the last month of the selected range ──
  // Balance sheet is a point-in-time snapshot; we show the most recent month.
  const { year: snapshotYear, monthIndex: snapshotMonthIndex } = parseYM(toDate);

  const years       = getYearsRange(2021, 2030);
  const formatValue = makeFormatValue(currencyUnit);

  // ── Initial load + reload when toDate changes ─────────────────────────────
  useEffect(() => {
    if (user) {
      loadCapitalStructureData(toDate);
      loadDividendHistory();
    }
  }, [user, toDate]);

  // ── Auto-calculate solvency / leverage / equity from balance sheet ─────────
  useEffect(() => {
    const mi = snapshotMonthIndex;
    if (mi < 0 || mi >= 12) return;

    const totalAssets_     = calcTotalAssets(mi);
    const totalLiabilities_= calcTotalLiabilities(mi);
    const totalEquity_     = calcTotalEquity(mi);
    const ebit_            = totalAssets_      * 0.1;
    const intExp_          = totalLiabilities_ * 0.05;

    const ensure = (obj, key) => {
      if (!Array.isArray(obj[key])) obj[key] = Array(12).fill("0");
    };

    setSolvencyData((prev) => {
      const s = { ...prev };
      ["debtToEquity", "debtToAssets", "equityRatio", "interestCoverage", "nav"].forEach((k) => ensure(s, k));
      s.debtToEquity[mi]      = (totalEquity_     !== 0 ? totalLiabilities_ / totalEquity_     : 0).toFixed(2);
      s.debtToAssets[mi]      = (totalAssets_     !== 0 ? totalLiabilities_ / totalAssets_     : 0).toFixed(2);
      s.equityRatio[mi]       = (totalAssets_     !== 0 ? (totalEquity_  / totalAssets_) * 100 : 0).toFixed(2);
      s.interestCoverage[mi]  = (intExp_          !== 0 ? ebit_ / intExp_ : 0).toFixed(2);
      s.nav[mi]               = ((totalAssets_ - totalLiabilities_) / 1_000_000).toFixed(2);
      return s;
    });

    setLeverageData((prev) => {
      const l = { ...prev };
      ["totalDebtRatio", "longTermDebtRatio", "equityMultiplier"].forEach((k) => ensure(l, k));
      const ltDebt = calculateTotal(balanceSheetData.liabilities.nonCurrentLiabilities, mi);
      l.totalDebtRatio[mi]    = (totalAssets_  !== 0 ? totalLiabilities_ / totalAssets_        : 0).toFixed(2);
      l.longTermDebtRatio[mi] = (totalAssets_  !== 0 ? ltDebt             / totalAssets_        : 0).toFixed(2);
      l.equityMultiplier[mi]  = (totalEquity_  !== 0 ? totalAssets_        / totalEquity_       : 0).toFixed(2);
      return l;
    });

    setEquityData((prev) => {
      const e = { ...prev };
      ensure(e, "equityRatio");
      e.equityRatio[mi] = (totalAssets_ !== 0 ? (totalEquity_ / totalAssets_) * 100 : 0).toFixed(2);
      return e;
    });
  }, [balanceSheetData, toDate]);

  // ── Balance sheet calculation helpers ─────────────────────────────────────
  const calcTotalAssets = (mi) => {
    const { bank, currentAssets, nonCurrentAssets, customCategories } = balanceSheetData.assets;
    const sumObj = (obj) =>
      Object.values(obj || {}).reduce((s, a) => s + (parseFloat(a?.[mi]) || 0), 0);
    let custom = 0;
    (customCategories || []).forEach((c) => {
      if (c?.items)
        Object.values(c.items).forEach((a) => { custom += parseFloat(a?.[mi]) || 0; });
    });
    return (
      sumObj(bank) +
      calculateTotal(currentAssets, mi) +
      calcFixedAssets(mi) +
      calcIntangibles(mi) +
      calculateTotal(nonCurrentAssets, mi) +
      custom
    );
  };

  const calcFixedAssets = (mi) => {
    const fa = balanceSheetData.assets?.fixedAssets;
    if (!fa) return 0;
    const add = ["land","buildings","computerEquipment","vehicles","furniture","machinery","otherPropertyPlantEquipment","assetsUnderConstruction"];
    const sub = ["lessDepreciationBuildings","lessDepreciationComputer","lessDepreciationVehicles","lessDepreciationFurniture","lessDepreciationMachinery","lessDepreciationOther"];
    return (
      add.reduce((s, k) => s + (parseFloat(fa[k]?.[mi]) || 0), 0) -
      sub.reduce((s, k) => s + (parseFloat(fa[k]?.[mi]) || 0), 0)
    );
  };

  const calcIntangibles = (mi) => {
    const ia = balanceSheetData.assets?.intangibleAssets;
    if (!ia) return 0;
    return (
      ["goodwill","trademarks","patents","software","customerLists"].reduce((s, k) => s + (parseFloat(ia[k]?.[mi]) || 0), 0) -
      (parseFloat(ia.lessAmortization?.[mi]) || 0)
    );
  };

  const calcTotalLiabilities = (mi) =>
    calculateTotal(balanceSheetData.liabilities.currentLiabilities, mi) +
    calculateTotal(balanceSheetData.liabilities.nonCurrentLiabilities, mi) +
    (balanceSheetData.customLiabilitiesCategories || []).reduce(
      (s, c) => s + Object.values(c.items || {}).reduce((ss, a) => ss + (parseFloat(a?.[mi]) || 0), 0),
      0,
    );

  const calcTotalEquity = (mi) =>
    calculateTotal(balanceSheetData.equity, mi) -
    (parseFloat(balanceSheetData.equity.treasuryShares?.[mi]) || 0) +
    (balanceSheetData.customEquityCategories || []).reduce(
      (s, c) => s + Object.values(c.items || {}).reduce((ss, a) => ss + (parseFloat(a?.[mi]) || 0), 0),
      0,
    );

  const totalAssets      = calcTotalAssets(snapshotMonthIndex);
  const totalLiabilities = calcTotalLiabilities(snapshotMonthIndex);
  const totalEquity      = calcTotalEquity(snapshotMonthIndex);

  // ── Trend opener — range-aware ─────────────────────────────────────────────
  //
  //   fieldPath can be:
  //     Array  → raw balance-sheet line-item (12-slot calendar array)
  //     string → a computeCapitalStructureChartData key or legacy dot-path
  const openTrend = async (name, fieldPath, isPercentage = false) => {
    setSelectedTrendItem({ name, isPercentage });
    setTrendData(null);
    setTrendLoading(true);
    setShowTrendModal(true);

    try {
      const labels = getRangeLabels(fromDate, toDate);
      const meta   = getRangeMonthsMeta(fromDate, toDate);

      // ── Case 1: raw balance-sheet array (line item) ─────────────────────
      if (Array.isArray(fieldPath)) {
        const years_    = [...new Set(meta.map((m) => m.year))];
        const docCache  = {};

        await Promise.all(
          years_.map(async (yr) => {
            let snap = await getDoc(doc(db, "financialData", `${user.uid}_capitalStructure_${yr}`));
            if (!snap.exists())
              snap = await getDoc(doc(db, "financialData", `${user.uid}_capitalStructure`));
            docCache[yr] = snap.exists() ? snap.data() : null;
          }),
        );

        // Locate the same array by reference in current balanceSheetData
        const findPath = (obj, target, path = []) => {
          for (const k of Object.keys(obj || {})) {
            if (Array.isArray(obj[k])) {
              if (obj[k] === target) return [...path, k];
            } else if (obj[k] && typeof obj[k] === "object") {
              const found = findPath(obj[k], target, [...path, k]);
              if (found) return found;
            }
          }
          return null;
        };

        const keyPath = findPath(balanceSheetData, fieldPath);

        const actual = meta.map(({ year: yr, monthIndex: mi }) => {
          const raw = docCache[yr];
          if (!raw) return null;
          let arr = null;
          if (keyPath) arr = keyPath.reduce((o, k) => o?.[k], raw?.balanceSheetData);
          if (!Array.isArray(arr)) arr = fieldPath;
          const v = arr?.[mi];
          return v !== undefined && v !== "" && v !== null ? parseFloat(v) : null;
        });

        // Smart y-axis scale from fetched values
        const absVals    = actual.filter((v) => v !== null).map(Math.abs);
        const maxAbs     = absVals.length ? Math.max(...absVals) : 0;
        const scaleUnit    = maxAbs >= 1_000_000 ? "R m" : maxAbs >= 1_000 ? "R k" : "R";
        const scaleDivisor = maxAbs >= 1_000_000 ? 1_000_000 : maxAbs >= 1_000 ? 1_000 : 1;

        setSelectedTrendItem({
          name,
          isPercentage,
          trendFormatValue: (v) => formatCurrency(v, "zar", 2),
          yAxisLabel: `Value (${scaleUnit})`,
          yTickFmt:   (v) => (v / scaleDivisor).toFixed(1),
        });
        setTrendData({ labels, actual, budget: null });
        return;
      }

      // ── Case 2: no fieldPath ────────────────────────────────────────────
      if (!fieldPath || typeof fieldPath !== "string") {
        setTrendData({ labels, actual: Array(labels.length).fill(null), budget: null });
        return;
      }

      // ── Case 3: string key — use hook's range-aware loadTrendData ───────
      const DOT_PATH_MAP = {
        "solvencyData.debtToEquity":        "debtToEquity",
        "solvencyData.debtToAssets":        "debtToAssets",
        "solvencyData.equityRatio":         "equityRatio",
        "solvencyData.interestCoverage":    "interestCoverage",
        "solvencyData.debtServiceCoverage": "debtServiceCoverage",
        "solvencyData.nav":                 "nav",
        "leverageData.totalDebtRatio":      "totalDebtRatio",
        "leverageData.longTermDebtRatio":   "longTermDebtRatio",
        "leverageData.equityMultiplier":    "equityMultiplier",
        "equityData.returnOnEquity":        "returnOnEquity",
        "equityData.bookValuePerShare":     "bookValuePerShare",
      };
      const chartKey = DOT_PATH_MAP[fieldPath] ?? fieldPath;

      const { actual } = await loadTrendData(chartKey, fromDate, toDate);

      // Format helpers per key family
      const BS_TOTAL_KEYS = new Set([
        "totalAssets","totalLiabilities","totalEquity",
        "totalBankAndCash","totalCurrentAssets","totalFixedAssets",
        "totalIntangibleAssets","totalNonCurrentAssets",
        "totalCurrentLiabilities","totalNonCurrentLiabilities",
      ]);
      const RATIO_KEYS = new Set([
        "debtToEquity","debtToAssets","interestCoverage",
        "debtServiceCoverage","totalDebtRatio","longTermDebtRatio","equityMultiplier",
      ]);

      const PERCENT_KEYS = new Set(["equityRatio", "returnOnEquity"]);
      const CURRENCY_KPI_KEYS = new Set(["nav", "bookValuePerShare"]);

      let trendFormatValue, yAxisLabel, yTickFmt;
      if (BS_TOTAL_KEYS.has(chartKey)) {
        trendFormatValue = (v) => formatCurrency(v * 1_000_000, "zar", 2);
        yAxisLabel = "Value (R m)";
        yTickFmt   = (v) => parseFloat(v).toFixed(1);
      } else if (RATIO_KEYS.has(chartKey)) {
        trendFormatValue = (v) => parseFloat(v).toFixed(2);
        yAxisLabel = "Ratio (×)";
        yTickFmt   = (v) => parseFloat(v).toFixed(2);
      } else if (PERCENT_KEYS.has(chartKey)) {
        trendFormatValue = (v) => `${parseFloat(v).toFixed(2)}%`;
        yAxisLabel       = "Percentage (%)";
        yTickFmt         = (v) => `${parseFloat(v).toFixed(1)}%`;
      } else if (CURRENCY_KPI_KEYS.has(chartKey)) {
        // Values are already in millions from the hook
        const allVals  = (actual || []).filter((v) => v !== null && !isNaN(v));
        const maxAbs   = allVals.length ? Math.max(...allVals.map(Math.abs)) : 0;
        const scaleUnit    = maxAbs >= 1_000 ? "R bn" : maxAbs >= 1 ? "R m" : "R k";
        const scaleDivisor = maxAbs >= 1_000 ? 1_000  : maxAbs >= 1 ? 1     : 0.001;
        trendFormatValue = (v) => {
          const num = parseFloat(v) || 0;
          const abs = Math.abs(num);
          if (abs >= 1_000) return `R${(num / 1_000).toFixed(2)}bn`;
          if (abs >= 1)     return `R${num.toFixed(2)}m`;
          return `R${(num * 1_000).toFixed(2)}k`;
        };
        yAxisLabel = `Value (${scaleUnit})`;
        yTickFmt   = (v) => (v / scaleDivisor).toFixed(2);
      }

      setSelectedTrendItem({ name, isPercentage, trendFormatValue, yAxisLabel, yTickFmt });
      setTrendData({ labels, actual, budget: null });

    } catch (e) {
      console.error("Trend load error:", e);
      setTrendData({
        labels: getRangeLabels(fromDate, toDate),
        actual: Array(getRangeMonthsMeta(fromDate, toDate).length).fill(null),
        budget: null,
      });
    } finally {
      setTrendLoading(false);
    }
  };

  const openCalc = (title, calculation) => {
    setSelectedCalculation({ title, calculation });
    setShowCalculationModal(true);
  };

  // ── KPI card metadata ─────────────────────────────────────────────────────
  const KPI_META = {
    nav:                 { unitLabel: null, fmt: (v) => formatSmartNumber(v),     isPercentage: false },
    equityRatio:         { unitLabel: "%",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: true  },
    debtToEquity:        { unitLabel: "×",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: false },
    debtToAssets:        { unitLabel: "×",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: false },
    interestCoverage:    { unitLabel: "×",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: false },
    debtServiceCoverage: { unitLabel: "×",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: false },
    totalDebtRatio:      { unitLabel: "×",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: false },
    longTermDebtRatio:   { unitLabel: "×",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: false },
    equityMultiplier:    { unitLabel: "×",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: false },
    returnOnEquity:      { unitLabel: "%",  fmt: (v) => parseFloat(v).toFixed(2), isPercentage: true  },
    bookValuePerShare:   { unitLabel: null, fmt: (v) => formatSmartNumber(v),     isPercentage: false },
  };

  // KPI card renderer — reads from snapshot month index
  const renderKPICard = (title, data, kpiKey, _isPercentage = false, fieldPath = null) => {
    const meta         = KPI_META[kpiKey] || {};
    const isPercentage = meta.isPercentage ?? _isPercentage;
    const rawValue     = parseFloat(data?.[snapshotMonthIndex]) || 0;
    const unitLabel    = meta.unitLabel !== undefined
      ? meta.unitLabel ?? getSmartUnit(rawValue)
      : (isPercentage ? "%" : getSmartUnit(rawValue));
    const fmtCircle    = meta.fmt ?? ((v) => parseFloat(v).toFixed(2));

    return (
      <KPICard
        key={kpiKey}
        title={title}
        actualValue={rawValue}
        budgetValue={0}
        unit={currencyUnit}
        isPercentage={isPercentage}
        unitLabel={unitLabel}
        formatCircleValue={fmtCircle}
        onEyeClick={() => {
          const tab = SUB_TABS.find((t) => t.id === activeSubTab);
          openCalc(title, tab?.calculation || "");
        }}
        onAddNotes={(notes) => setKpiNotes((p) => ({ ...p, [kpiKey]: notes }))}
        onAnalysis={() =>
          setExpandedNotes((p) => ({ ...p, [`${kpiKey}_analysis`]: !p[`${kpiKey}_analysis`] }))
        }
        onTrend={() => openTrend(title, fieldPath || kpiKey, isPercentage)}
        notes={kpiNotes[kpiKey]}
        formatValue={formatValue}
      />
    );
  };

  const SUB_TABS = [
    { id: "balance-sheet",  label: "Balance Sheet"  },
    { id: "solvency",  label: "Solvency",  calculation: CALCULATION_TEXTS.capitalStructure?.solvency || "" },
    { id: "leverage",  label: "Leverage",  calculation: CALCULATION_TEXTS.capitalStructure?.leverage || "" },
    { id: "equity",    label: "Equity Structure", calculation: CALCULATION_TEXTS.capitalStructure?.equity || "" },
  ];

  if (activeSection !== "capital-structure") return null;

  // Balance sheet amounts displayed in full rands
  const fv = (v) => formatCurrency(parseFloat(v) || 0, "zar", 2);

  const bsRows = (obj, mi, overrides = {}) =>
    Object.keys(obj).map((key) => ({
      key,
      arr: obj[key],
      label: overrides[key]?.label ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
      value: fv(parseFloat(obj[key]?.[mi]) || 0),
      redLabel: overrides[key]?.red ?? false,
    }));

  // Snapshot label shown next to picker (e.g. "Showing snapshot: Feb 2025")
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const snapshotLabel = `${MONTH_NAMES[snapshotMonthIndex]} ${snapshotYear}`;

  return (
    <div>
      {/* ── Sub-tab nav ──────────────────────────────────────────────────────── */}
      <div className="flex gap-2.5 mb-5 border-b-2 border-[#e8ddd4] pb-2.5">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 border-0 rounded-t-md cursor-pointer font-semibold text-sm transition-all ${
              activeSubTab === tab.id
                ? "bg-mediumBrown text-[#fdfcfb]"
                : "bg-transparent text-mediumBrown hover:bg-[#f5f0eb]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Global date range picker + action buttons ─────────────────────────
           Visible across ALL sub-tabs so the range is consistent everywhere.   */}
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <DateRangePicker
            filterMode={filterMode}
            setFilterMode={setFilterMode}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            years={years}
            minDate={firstDataMonth ?? "2023-01"}
            maxDate={_defaultTo}
          />
          {/* Snapshot indicator — relevant for Balance Sheet but harmless to show globally
          {activeSubTab === "balance-sheet" && (
            <span className="text-xs text-lightBrown bg-[#f0ebe6] px-3 py-1.5 rounded-md border border-[#e0d4cc]">
              As of: <strong>{snapshotLabel}</strong>
            </span>
          )} */}
        </div>
        {!isInvestorView && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-mediumBrown text-[#fdfcfb] border-0 rounded cursor-pointer font-semibold text-xs hover:bg-[#4a3027]"
          >
            + Add Data
          </button>
        )}
      </div>

      {/* ===== BALANCE SHEET ===== */}
      {activeSubTab === "balance-sheet" && (
        <div>
          <KeyQuestionBox
            question="Is the business financially solvent and appropriately structured for its current stage?"
            signals="Leverage, balance sheet strength, working capital position"
            decisions="Raise equity vs debt, restructure balance sheet, optimize working capital"
          />

          <div className="grid grid-cols-2 gap-7">
            {/* ASSETS */}
            <div className="bg-[#fdfcfb] p-5 rounded-lg shadow-md">
              <h3 className="text-mediumBrown mb-4 text-lg font-bold">ASSETS</h3>

              <BSTable
                title="Bank & Cash"
                rows={bsRows(balanceSheetData.assets?.bank || {}, snapshotMonthIndex)}
                totalLabel="Total Bank & Cash"
                totalValue={fv(
                  Object.values(balanceSheetData.assets?.bank || {}).reduce(
                    (s, a) => s + (parseFloat(a?.[snapshotMonthIndex]) || 0), 0,
                  ),
                )}
                openTrend={(l, a) => openTrend(l, a)}
                totalTrendFn={() => openTrend("Total Bank & Cash", "totalBankAndCash")}
              />

              <BSTable
                title="Current Assets"
                rows={bsRows(balanceSheetData.assets?.currentAssets || {}, snapshotMonthIndex)}
                totalLabel="Total Current Assets"
                totalValue={fv(calculateTotal(balanceSheetData.assets?.currentAssets || {}, snapshotMonthIndex))}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Current Assets", "totalCurrentAssets")}
              />

              <BSTable
                title="Fixed Assets (Net)"
                rows={[
                  {
                    key: "land", label: "Land",
                    value: fv(parseFloat(balanceSheetData.assets?.fixedAssets?.land?.[snapshotMonthIndex]) || 0),
                    arr: balanceSheetData.assets?.fixedAssets?.land,
                  },
                  {
                    key: "buildings", label: "Buildings (Net)",
                    value: fv(
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.buildings?.[snapshotMonthIndex]) || 0) -
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.lessDepreciationBuildings?.[snapshotMonthIndex]) || 0)
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.buildings,
                  },
                  {
                    key: "computer", label: "Computer Equipment (Net)",
                    value: fv(
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.computerEquipment?.[snapshotMonthIndex]) || 0) -
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.lessDepreciationComputer?.[snapshotMonthIndex]) || 0)
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.computerEquipment,
                  },
                  {
                    key: "vehicles", label: "Vehicles (Net)",
                    value: fv(
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.vehicles?.[snapshotMonthIndex]) || 0) -
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.lessDepreciationVehicles?.[snapshotMonthIndex]) || 0)
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.vehicles,
                  },
                  {
                    key: "furniture", label: "Furniture (Net)",
                    value: fv(
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.furniture?.[snapshotMonthIndex]) || 0) -
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.lessDepreciationFurniture?.[snapshotMonthIndex]) || 0)
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.furniture,
                  },
                  {
                    key: "machinery", label: "Machinery (Net)",
                    value: fv(
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.machinery?.[snapshotMonthIndex]) || 0) -
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.lessDepreciationMachinery?.[snapshotMonthIndex]) || 0)
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.machinery,
                  },
                  {
                    key: "ppe", label: "Other PPE (Net)",
                    value: fv(
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.otherPropertyPlantEquipment?.[snapshotMonthIndex]) || 0) -
                      (parseFloat(balanceSheetData.assets?.fixedAssets?.lessDepreciationOther?.[snapshotMonthIndex]) || 0)
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.otherPropertyPlantEquipment,
                  },
                  {
                    key: "auc", label: "Assets Under Construction",
                    value: fv(parseFloat(balanceSheetData.assets?.fixedAssets?.assetsUnderConstruction?.[snapshotMonthIndex]) || 0),
                    arr: balanceSheetData.assets?.fixedAssets?.assetsUnderConstruction,
                  },
                ]}
                totalLabel="Total Fixed Assets"
                totalValue={fv(calcFixedAssets(snapshotMonthIndex))}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Fixed Assets", "totalFixedAssets")}
              />

              <BSTable
                title="Intangible Assets"
                rows={Object.keys(balanceSheetData.assets?.intangibleAssets || {}).map((key) => ({
                  key,
                  arr: balanceSheetData.assets.intangibleAssets[key],
                  label: key === "lessAmortization"
                    ? "Less: Accumulated Amortization"
                    : key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
                  value: fv(parseFloat(balanceSheetData.assets.intangibleAssets[key]?.[snapshotMonthIndex]) || 0),
                  redLabel: key === "lessAmortization",
                }))}
                totalLabel="Total Intangible Assets"
                totalValue={fv(calcIntangibles(snapshotMonthIndex))}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Intangible Assets", "totalIntangibleAssets")}
              />

              <BSTable
                title="Non-Current Assets"
                rows={bsRows(balanceSheetData.assets?.nonCurrentAssets || {}, snapshotMonthIndex)}
                totalLabel="Total Non-Current Assets"
                totalValue={fv(calculateTotal(balanceSheetData.assets?.nonCurrentAssets || {}, snapshotMonthIndex))}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Non-Current Assets", "totalNonCurrentAssets")}
              />

              {(balanceSheetData.assets?.customCategories || []).map((custom, i) => (
                <BSTable
                  key={i}
                  title={custom?.category || "Custom"}
                  rows={Object.keys(custom?.items || {}).map((k) => ({
                    key: k, label: k,
                    value: fv(parseFloat(custom.items[k]?.[snapshotMonthIndex]) || 0),
                    arr: custom.items[k],
                  }))}
                  totalLabel={`Total ${custom?.category}`}
                  totalValue={fv(
                    Object.values(custom?.items || {}).reduce(
                      (s, a) => s + (parseFloat(a?.[snapshotMonthIndex]) || 0), 0,
                    ),
                  )}
                  openTrend={openTrend}
                />
              ))}

              <div className="mt-5 p-4 bg-mediumBrown rounded-md flex justify-between items-center">
                <span className="text-[#fdfcfb] text-base font-bold">TOTAL ASSETS</span>
                <span className="text-[#fdfcfb] text-lg font-bold">{fv(totalAssets)}</span>
              </div>
            </div>

            {/* LIABILITIES & EQUITY */}
            <div className="bg-[#fdfcfb] p-5 rounded-lg shadow-md">
              <h3 className="text-mediumBrown mb-4 text-lg font-bold">LIABILITIES & EQUITY</h3>

              <BSTable
                title="Current Liabilities"
                rows={bsRows(balanceSheetData.liabilities?.currentLiabilities || {}, snapshotMonthIndex)}
                totalLabel="Total Current Liabilities"
                totalValue={fv(calculateTotal(balanceSheetData.liabilities?.currentLiabilities || {}, snapshotMonthIndex))}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Current Liabilities", "totalCurrentLiabilities")}
              />

              <BSTable
                title="Non-Current Liabilities"
                rows={bsRows(balanceSheetData.liabilities?.nonCurrentLiabilities || {}, snapshotMonthIndex)}
                totalLabel="Total Non-Current Liabilities"
                totalValue={fv(calculateTotal(balanceSheetData.liabilities?.nonCurrentLiabilities || {}, snapshotMonthIndex))}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Non-Current Liabilities", "totalNonCurrentLiabilities")}
              />

              <div className="mb-5 p-4 bg-[#8d6e63] rounded-md flex justify-between items-center">
                <span className="text-[#fdfcfb] text-base font-bold">TOTAL LIABILITIES</span>
                <span className="text-[#fdfcfb] text-lg font-bold">{fv(totalLiabilities)}</span>
              </div>

              <BSTable
                title="Equity"
                rows={Object.keys(balanceSheetData.equity || {}).map((key) => ({
                  key,
                  arr: balanceSheetData.equity[key],
                  label: key === "treasuryShares"
                    ? "Less: Treasury Shares"
                    : key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
                  value: fv(parseFloat(balanceSheetData.equity[key]?.[snapshotMonthIndex]) || 0),
                  redLabel: key === "treasuryShares",
                }))}
                totalLabel="Total Equity"
                totalValue={fv(totalEquity)}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Equity", "totalEquity")}
              />

              <div className="mt-5 p-4 bg-mediumBrown rounded-md flex justify-between items-center">
                <span className="text-[#fdfcfb] text-base font-bold">TOTAL LIABILITIES & EQUITY</span>
                <span className="text-[#fdfcfb] text-lg font-bold">{fv(totalLiabilities + totalEquity)}</span>
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          {balanceSheetData?.assets?.additionalMetrics && (
            <div className="mt-7 p-5 bg-[#fdfcfb] rounded-lg shadow-md">
              <h4 className="text-mediumBrown mb-4 text-base font-semibold">Additional Business Metrics</h4>
              <div className="grid grid-cols-4 gap-5">
                {Object.keys(balanceSheetData.assets.additionalMetrics).map((key) => (
                  <div key={key}>
                    <div className="text-xs text-lightBrown mb-1">
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                    </div>
                    <div className="text-base font-semibold text-mediumBrown">
                      {fv(parseFloat(balanceSheetData.assets.additionalMetrics[key]?.[snapshotMonthIndex] || 0))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== SOLVENCY ===== */}
      {activeSubTab === "solvency" && (
        <div>
          <KeyQuestionBox
            question="Can the business meet its long-term financial obligations? Is the business financially stable?"
            signals="Net asset value, equity ratio"
            decisions="Manage debt levels, improve asset base, consider equity financing"
          />
          <div className="grid grid-cols-2 gap-5">
            {renderKPICard("Net Asset Value", solvencyData.nav,       "nav",        false, "solvencyData.nav")}
            {renderKPICard("Equity Ratio",    solvencyData.equityRatio, "equityRatio", true, "solvencyData.equityRatio")}
          </div>
        </div>
      )}

      {/* ===== LEVERAGE ===== */}
      {activeSubTab === "leverage" && (
        <div>
          <KeyQuestionBox
            question="How effectively is the business using debt to finance its operations?"
            signals="Debt-to-asset ratio, debt-to-equity ratio"
            decisions="Optimize capital structure, manage risk, refinance high-cost debt"
          />
          <div className="grid grid-cols-2 gap-5">
            {renderKPICard("Debt to Assets", solvencyData.debtToAssets, "debtToAssets", false, "solvencyData.debtToAssets")}
            {renderKPICard("Debt to Equity", solvencyData.debtToEquity, "debtToEquity", false, "solvencyData.debtToEquity")}
          </div>
        </div>
      )}

      {/* ===== EQUITY STRUCTURE — Dividend table ===== */}
      {activeSubTab === "equity" && (
        <div>
          <KeyQuestionBox
            question="How is equity being distributed and retained? What is the dividend policy?"
            signals="Dividend yield, payout ratio, capital retention"
            decisions="Balance dividends vs reinvestment, optimize equity structure"
          />

          <div className="bg-[#fdfcfb] p-5 rounded-lg mb-7">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-mediumBrown m-0 font-semibold">Dividend Policy & Capital Retention</h4>
              {!isInvestorView && (
                <button
                  onClick={() => setShowDividendModal(true)}
                  className="px-4 py-2 bg-mediumBrown text-[#fdfcfb] border-0 rounded cursor-pointer font-semibold text-xs hover:bg-[#4a3027]"
                >
                  + Add Dividend
                </button>
              )}
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#e8ddd4]">
                  {["Date", "Amount (ZAR)", "Type", "Declared By"].map((h) => (
                    <th key={h} className="p-3 text-left text-mediumBrown text-xs font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dividendHistory.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-5 text-center text-lightBrown">No dividend records found</td>
                  </tr>
                ) : (
                  dividendHistory.map((d, i) => (
                    <tr key={d.id} className={`border-b border-[#e8ddd4] ${i % 2 === 0 ? "bg-[#fdfcfb]" : "bg-[#f7f3f0]"}`}>
                      <td className="p-3 text-mediumBrown text-xs">{d.date}</td>
                      <td className="p-3 text-right text-mediumBrown text-xs font-semibold">{formatCurrency(d.amount, "zar", 2)}</td>
                      <td className="p-3 text-mediumBrown text-xs">{d.type}</td>
                      <td className="p-3 text-mediumBrown text-xs">{d.declaredBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Dividend stats */}
            <div className="grid grid-cols-3 gap-5 mt-6 pt-5 border-t-2 border-[#e8ddd4]">
              {(() => {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                const total12mo    = dividendHistory
                  .filter((d) => new Date(d.date) >= oneYearAgo)
                  .reduce((s, d) => s + (d.amount || 0), 0);
                const yieldPct     = totalEquity > 0 ? (total12mo / totalEquity) * 100 : 0;
                const currYearEarnings =
                  parseFloat(balanceSheetData.equity?.currentYearEarnings?.[snapshotMonthIndex]) || 0;
                const payout = currYearEarnings > 0 ? (total12mo / currYearEarnings) * 100 : 0;
                return [
                  ["Total Dividends (12mo)", formatCurrency(total12mo, "zar", 2)],
                  ["Dividend Yield",  `${yieldPct.toFixed(2)}%`],
                  ["Payout Ratio",    `${payout.toFixed(2)}%`],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-xs text-lightBrown mb-1">{label}</div>
                    <div className="text-lg font-bold text-mediumBrown">{val}</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODALS ===== */}
      <UniversalAddDataModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTab="capital-structure"
        user={user}
        onSave={() => loadCapitalStructureData(toDate)}
        loading={loading}
        fromDate={fromDate}
        toDate={toDate}
      />

      {showDividendModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1001]">
          <div className="bg-[#fdfcfb] p-7 rounded-lg max-w-lg w-[90%]">
            <h3 className="text-mediumBrown mb-5 font-semibold">Add Dividend Record</h3>
            {[
              ["Date *",        "date",       "date",   ""],
              ["Amount (ZAR) *","amount",     "number", "0.00"],
              ["Declared By",   "declaredBy", "text",   "e.g., Board Resolution #123"],
            ].map(([label, field, type, ph]) => (
              <div key={field} className="mb-4">
                <label className="block text-mediumBrown mb-1 text-xs font-semibold">{label}</label>
                <input
                  type={type}
                  placeholder={ph}
                  value={dividendForm[field]}
                  onChange={(e) => setDividendForm((p) => ({ ...p, [field]: e.target.value }))}
                  className="w-full p-2.5 rounded border border-[#e8ddd4] text-sm"
                />
              </div>
            ))}
            <div className="mb-5">
              <label className="block text-mediumBrown mb-1 text-xs font-semibold">Type</label>
              <select
                value={dividendForm.type}
                onChange={(e) => setDividendForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full p-2.5 rounded border border-[#e8ddd4] text-sm"
              >
                <option value="Interim">Interim</option>
                <option value="Final">Final</option>
                <option value="Special">Special</option>
              </select>
            </div>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => {
                  setShowDividendModal(false);
                  setDividendForm({ date: "", amount: "", type: "Interim", declaredBy: "" });
                }}
                className="px-5 py-2.5 bg-[#e8ddd4] text-mediumBrown border-0 rounded-md cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!user) return;
                  try {
                    await addDoc(
                      collection(db, "financialData", `${user.uid}_dividends`, "dividendHistory"),
                      {
                        ...dividendForm,
                        amount: parseFloat(dividendForm.amount),
                        userId: user.uid,
                        createdAt: new Date().toISOString(),
                      },
                    );
                    loadDividendHistory();
                    setShowDividendModal(false);
                    setDividendForm({ date: "", amount: "", type: "Interim", declaredBy: "" });
                    alert("Dividend added!");
                  } catch (e) {
                    console.error(e);
                    alert("Error saving dividend.");
                  }
                }}
                className="px-5 py-2.5 bg-mediumBrown text-[#fdfcfb] border-0 rounded-md cursor-pointer font-semibold hover:bg-[#4a3027]"
              >
                Save Dividend
              </button>
            </div>
          </div>
        </div>
      )}

      <CalculationModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        title={selectedCalculation.title}
        calculation={selectedCalculation.calculation}
      />

      {showTrendModal && (
        <TrendModal
          isOpen={showTrendModal}
          onClose={() => { setShowTrendModal(false); setTrendData(null); }}
          item={selectedTrendItem}
          trendData={trendData}
          currencyUnit={currencyUnit}
          formatValue={formatValue}
          activeSection="capital-structure"
          loading={trendLoading}
        />
      )}
    </div>
  );
};

export default CapitalStructure;