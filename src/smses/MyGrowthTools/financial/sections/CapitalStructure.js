"use client";
import { useState, useEffect } from "react";
import { db } from "../../../../firebaseConfig";
import { collection, doc, addDoc, getDoc } from "firebase/firestore";
import {
  KeyQuestionBox,
  KPICard,
  TrendModal,
  CalculationModal,
  YearMonthSelector,
  TrendButton,
  SectionHeading,
  DateRangePicker,
} from "../components/SharedComponents";
import UniversalAddDataModal from "../components/UniversalAddDataModal";
import { useCapitalStructureData } from "../../../hooks/useFinancialData";
import {
  getMonthsForYear,
  getYearsRange,
  CALCULATION_TEXTS,
} from "../financialConstants";
import {
  getMonthIndex,
  calculateTotal,
  formatCurrency,
  makeFormatValue,
  getLast12MonthsLabels,
  getLast12MonthsMeta,
  getLast12MonthsComputed,
  computeCapitalStructureChartData,
} from "../financialUtils";

// ==================== BALANCE SHEET TABLE ====================
const BSTable = ({
  title,
  rows,
  totalLabel,
  totalValue,
  monthIndex,
  openTrend,
  totalTrendFn,
}) => (
  <div className="mb-5">
    <h4 className="text-mediumBrown text-base font-semibold mb-2.5 border-b border-[#e8ddd4] pb-1">
      {title}
    </h4>
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-[#e8ddd4]">
          <th className="p-2.5 text-left text-mediumBrown text-xs font-semibold">
            Item
          </th>
          <th className="p-2.5 text-right text-mediumBrown text-xs font-semibold">
            Amount
          </th>
          <th className="p-2.5 text-center text-mediumBrown text-xs font-semibold w-12">
            Trend
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ key, label, value, redLabel, arr }) => (
          <tr key={key}>
            <td className="py-2 text-mediumBrown text-xs">{label}</td>
            <td
              className={`py-2 text-right text-xs font-semibold ${redLabel ? "text-red-700" : "text-mediumBrown"}`}
            >
              {redLabel ? `(${value})` : value}
            </td>
            <td className="py-2 text-center">
              <TrendButton onClick={() => openTrend(label, arr)} />
            </td>
          </tr>
        ))}
        {totalLabel && (
          <tr className="bg-[#f5f0eb]">
            <td className="py-2.5 text-mediumBrown text-sm font-bold">
              {totalLabel}
            </td>
            <td className="py-2.5 text-right text-mediumBrown text-sm font-bold">
              {totalValue}
            </td>
            <td className="py-2.5 text-center">
              {totalTrendFn && <TrendButton onClick={totalTrendFn} />}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);


// Default From-To: last 12 months
const _now = new Date()
const _defaultTo   = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}`
const _defaultFrom = (() => { const d = new Date(_now.getFullYear(), _now.getMonth() - 11, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` })()

// ==================== CAPITAL STRUCTURE COMPONENT ====================
const CapitalStructure = ({
  activeSection,
  user,
  isInvestorView,
  financialYearStart,
}) => {
  const [activeSubTab, setActiveSubTab] = useState("balance-sheet");
  const [showModal, setShowModal] = useState(false);
  const [showDividendModal, setShowDividendModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(financialYearStart);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  // Date filter state — default to From-To (last 12 months)
  const [filterMode, setFilterMode] = useState("range")
  const [fromDate, setFromDate]     = useState(_defaultFrom)
  const [toDate, setToDate]         = useState(_defaultTo)
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [selectedTrendItem, setSelectedTrendItem] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState({
    title: "",
    calculation: "",
  });
  const [kpiNotes, setKpiNotes] = useState({});
  const [expandedNotes, setExpandedNotes] = useState({});
  const [dividendForm, setDividendForm] = useState({
    date: "",
    amount: "",
    type: "Interim",
    declaredBy: "",
  });
  const [currencyUnit] = useState("zar_million");

  const {
    balanceSheetData,
    solvencyData,
    setSolvencyData,
    leverageData,
    setLeverageData,
    equityData,
    setEquityData,
    dividendHistory,
    kpiAnalysis,
    loading,
    loadCapitalStructureData,
    loadDividendHistory,
  } = useCapitalStructureData(user);

  const months = getMonthsForYear(selectedYear, financialYearStart);
  const years = getYearsRange(2021, 2030);
  const monthIndex = getMonthIndex(selectedMonth);
  const formatValue = makeFormatValue(currencyUnit);

  useEffect(() => {
    if (user) {
      loadCapitalStructureData();
      loadDividendHistory();
    }
  }, [user]);

  // Auto-calculate solvency/leverage from balance sheet
  useEffect(() => {
    if (monthIndex < 0 || monthIndex >= 12) return;
    const totalAssets = calcTotalAssets(monthIndex);
    const totalLiabilities = calcTotalLiabilities(monthIndex);
    const totalEquity = calcTotalEquity(monthIndex);
    const ebit = totalAssets * 0.1;
    const intExp = totalLiabilities * 0.05;
    const ensure = (obj, key) => {
      if (!Array.isArray(obj[key])) obj[key] = Array(12).fill("0");
    };

    setSolvencyData((prev) => {
      const s = { ...prev };
      [
        "debtToEquity",
        "debtToAssets",
        "equityRatio",
        "interestCoverage",
        "nav",
      ].forEach((k) => ensure(s, k));
      s.debtToEquity[monthIndex] = (
        totalEquity !== 0 ? totalLiabilities / totalEquity : 0
      ).toFixed(2);
      s.debtToAssets[monthIndex] = (
        totalAssets !== 0 ? totalLiabilities / totalAssets : 0
      ).toFixed(2);
      s.equityRatio[monthIndex] = (
        totalAssets !== 0 ? (totalEquity / totalAssets) * 100 : 0
      ).toFixed(2);
      s.interestCoverage[monthIndex] = (
        intExp !== 0 ? ebit / intExp : 0
      ).toFixed(2);
      s.nav[monthIndex] = (
        (totalAssets - totalLiabilities) /
        1_000_000
      ).toFixed(2);
      return s;
    });
    setLeverageData((prev) => {
      const l = { ...prev };
      ["totalDebtRatio", "longTermDebtRatio", "equityMultiplier"].forEach((k) =>
        ensure(l, k),
      );
      const ltDebt = calculateTotal(
        balanceSheetData.liabilities.nonCurrentLiabilities,
        monthIndex,
      );
      l.totalDebtRatio[monthIndex] = (
        totalAssets !== 0 ? totalLiabilities / totalAssets : 0
      ).toFixed(2);
      l.longTermDebtRatio[monthIndex] = (
        totalAssets !== 0 ? ltDebt / totalAssets : 0
      ).toFixed(2);
      l.equityMultiplier[monthIndex] = (
        totalEquity !== 0 ? totalAssets / totalEquity : 0
      ).toFixed(2);
      return l;
    });
    setEquityData((prev) => {
      const e = { ...prev };
      ensure(e, "equityRatio");
      e.equityRatio[monthIndex] = (
        totalAssets !== 0 ? (totalEquity / totalAssets) * 100 : 0
      ).toFixed(2);
      return e;
    });
  }, [balanceSheetData, selectedMonth, selectedYear]);

  // ---- Balance sheet calculations ----
  const calcTotalAssets = (mi) => {
    const { bank, currentAssets, nonCurrentAssets, customCategories } =
      balanceSheetData.assets;
    const sumObj = (obj) =>
      Object.values(obj || {}).reduce(
        (s, a) => s + (parseFloat(a?.[mi]) || 0),
        0,
      );
    let custom = 0;
    (customCategories || []).forEach((c) => {
      if (c?.items)
        Object.values(c.items).forEach((a) => {
          custom += parseFloat(a?.[mi]) || 0;
        });
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
    const add = [
      "land",
      "buildings",
      "computerEquipment",
      "vehicles",
      "furniture",
      "machinery",
      "otherPropertyPlantEquipment",
      "assetsUnderConstruction",
    ];
    const sub = [
      "lessDepreciationBuildings",
      "lessDepreciationComputer",
      "lessDepreciationVehicles",
      "lessDepreciationFurniture",
      "lessDepreciationMachinery",
      "lessDepreciationOther",
    ];
    return (
      add.reduce((s, k) => s + (parseFloat(fa[k]?.[mi]) || 0), 0) -
      sub.reduce((s, k) => s + (parseFloat(fa[k]?.[mi]) || 0), 0)
    );
  };

  const calcIntangibles = (mi) => {
    const ia = balanceSheetData.assets?.intangibleAssets;
    if (!ia) return 0;
    return (
      ["goodwill", "trademarks", "patents", "software", "customerLists"].reduce(
        (s, k) => s + (parseFloat(ia[k]?.[mi]) || 0),
        0,
      ) - (parseFloat(ia.lessAmortization?.[mi]) || 0)
    );
  };

  const calcTotalLiabilities = (mi) =>
    calculateTotal(balanceSheetData.liabilities.currentLiabilities, mi) +
    calculateTotal(balanceSheetData.liabilities.nonCurrentLiabilities, mi) +
    (balanceSheetData.customLiabilitiesCategories || []).reduce(
      (s, c) =>
        s +
        Object.values(c.items || {}).reduce(
          (ss, a) => ss + (parseFloat(a?.[mi]) || 0),
          0,
        ),
      0,
    );

  const calcTotalEquity = (mi) =>
    calculateTotal(balanceSheetData.equity, mi) -
    (parseFloat(balanceSheetData.equity.treasuryShares?.[mi]) || 0) +
    (balanceSheetData.customEquityCategories || []).reduce(
      (s, c) =>
        s +
        Object.values(c.items || {}).reduce(
          (ss, a) => ss + (parseFloat(a?.[mi]) || 0),
          0,
        ),
      0,
    );

  const totalAssets = calcTotalAssets(monthIndex);
  const totalLiabilities = calcTotalLiabilities(monthIndex);
  const totalEquity = calcTotalEquity(monthIndex);

  // ---- Trend opener ----
  // fieldPath can be:
  //   Array  → raw balance-sheet line-item (12-slot FY array)
  //   string → a computeCapitalStructureChartData key  e.g. "nav", "debtToEquity",
  //             "totalAssets", or legacy dot-path "solvencyData.nav" (auto-stripped)
  const openTrend = async (name, fieldPath, isPercentage = false) => {
    setSelectedTrendItem({ name, isPercentage });
    setTrendData(null);
    setTrendLoading(true);
    setShowTrendModal(true);
    try {
      const labels = getLast12MonthsLabels(financialYearStart);
      const meta   = getLast12MonthsMeta(financialYearStart);

      // ── Case 1: raw balance-sheet array (line item) ──────────────────────────
      // Cross-FY fix: fetch every unique FY year that appears in the last 12 months,
      // not just the current one.
      if (Array.isArray(fieldPath)) {
        const fyYears  = [...new Set(meta.map((m) => m.fyYear))];
        const docCache = {};
        await Promise.all(
          fyYears.map(async (fy) => {
            let snap = await getDoc(
              doc(db, "financialData", `${user.uid}_capitalStructure_${fy}`),
            );
            if (!snap.exists())
              snap = await getDoc(
                doc(db, "financialData", `${user.uid}_capitalStructure_${fy + 1}`),
              );
            if (!snap.exists())
              snap = await getDoc(
                doc(db, "financialData", `${user.uid}_capitalStructure`),
              );
            docCache[fy] = snap.exists() ? snap.data() : null;
          }),
        );

        // We need to know WHERE in the stored doc structure this array lives so
        // we can re-read it per FY year. We locate it by comparing the in-memory
        // array reference against the balance-sheet structure.
        // Strategy: walk the balanceSheetData tree to find the matching key path,
        // then re-read that path from each year's doc.
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

        const actual = meta.map(({ fyYear, fyIndex }) => {
          const raw = docCache[fyYear];
          if (!raw) return null;

          // Navigate the stored doc using the key path found above
          let arr = null;
          if (keyPath) {
            arr = keyPath.reduce((obj, k) => obj?.[k], raw?.balanceSheetData);
          }
          // Fall back to the in-memory array if same FY year (single-year case)
          if (!Array.isArray(arr)) arr = fieldPath;

          const v = arr?.[fyIndex];
          return v !== undefined && v !== "" && v !== null ? parseFloat(v) : null;
        });

        setTrendData({ labels, actual, budget: null });
        return;
      }

      // ── Case 2: no fieldPath ─────────────────────────────────────────────────
      if (!fieldPath || typeof fieldPath !== "string") {
        setTrendData({ labels, actual: Array(12).fill(null), budget: null });
        return;
      }

      // ── Case 3: string key — use computeCapitalStructureChartData processor ──
      // Normalise legacy dot-paths like "solvencyData.nav" → "nav"
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

      const { actual } = await getLast12MonthsComputed({
        uid: user.uid,
        docBase: "_capitalStructure",
        chartKey,
        financialYearStart,
        getDocFn: getDoc,
        docFn: doc,
        db,
        processor: computeCapitalStructureChartData,
      });

      setTrendData({ labels, actual, budget: null });
    } catch (e) {
      console.error("Trend load error:", e);
      setTrendData({
        labels: getLast12MonthsLabels(financialYearStart),
        actual: Array(12).fill(null),
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

  // KPI card renderer — no variance circle (budget=0 for these derived metrics)
  const renderKPICard = (
    title,
    data,
    kpiKey,
    isPercentage = false,
    fieldPath = null,
  ) => (
    <KPICard
      key={kpiKey}
      title={title}
      actualValue={parseFloat(data?.[monthIndex]) || 0}
      budgetValue={0}
      unit={currencyUnit}
      isPercentage={isPercentage}
      onEyeClick={() => {
        const tab = SUB_TABS.find((t) => t.id === activeSubTab);
        openCalc(title, tab?.calculation || "");
      }}
      onAddNotes={(notes) => setKpiNotes((p) => ({ ...p, [kpiKey]: notes }))}
      onAnalysis={() =>
        setExpandedNotes((p) => ({
          ...p,
          [`${kpiKey}_analysis`]: !p[`${kpiKey}_analysis`],
        }))
      }
      onTrend={() => openTrend(title, fieldPath || kpiKey, isPercentage)}
      notes={kpiNotes[kpiKey]}
      formatValue={formatValue}
    />
  );

  const SUB_TABS = [
    { id: "balance-sheet", label: "Balance Sheet" },
    {
      id: "solvency",
      label: "Solvency",
      calculation: CALCULATION_TEXTS.capitalStructure?.solvency || "",
    },
    {
      id: "leverage",
      label: "Leverage",
      calculation: CALCULATION_TEXTS.capitalStructure?.leverage || "",
    },
    {
      id: "equity",
      label: "Equity Structure",
      calculation: CALCULATION_TEXTS.capitalStructure?.equity || "",
    },
  ];

  if (activeSection !== "capital-structure") return null;

  const fv = (v) => formatValue(v, currencyUnit);

  const bsRows = (obj, mi, overrides = {}) =>
    Object.keys(obj).map((key) => ({
      key,
      arr: obj[key],
      label:
        overrides[key]?.label ??
        key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
      value: fv(parseFloat(obj[key]?.[mi]) || 0),
      redLabel: overrides[key]?.red ?? false,
    }));

  return (
    <div>
      {/* Sub-tab nav */}
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

      {/* ===== BALANCE SHEET ===== */}
      {activeSubTab === "balance-sheet" && (
        <div>
          <KeyQuestionBox
            question="Is the business financially solvent and appropriately structured for its current stage?"
            signals="Leverage, balance sheet strength, working capital position"
            decisions="Raise equity vs debt, restructure balance sheet, optimize working capital"
          />
          <div className="flex justify-between items-center mb-5 flex-wrap gap-2.5">
            <DateRangePicker
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              fromDate={fromDate}
              setFromDate={setFromDate}
              toDate={toDate}
              setToDate={setToDate}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              years={years}
              months={months}
            />
            {!isInvestorView && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-mediumBrown text-[#fdfcfb] border-0 rounded cursor-pointer font-semibold text-xs hover:bg-[#4a3027]"
              >
                Add Data
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-7">
            {/* ASSETS */}
            <div className="bg-[#fdfcfb] p-5 rounded-lg shadow-md">
              <h3 className="text-mediumBrown mb-4 text-lg font-bold">
                ASSETS
              </h3>
              <BSTable
                title="Bank & Cash"
                rows={bsRows(balanceSheetData.assets?.bank || {}, monthIndex)}
                totalLabel="Total Bank & Cash"
                totalValue={fv(
                  Object.values(balanceSheetData.assets?.bank || {}).reduce(
                    (s, a) => s + (parseFloat(a?.[monthIndex]) || 0),
                    0,
                  ),
                )}
                monthIndex={monthIndex}
                openTrend={(l, a) => openTrend(l, a)}
                totalTrendFn={() => openTrend("Total Bank & Cash", "totalBankAndCash")}
              />
              <BSTable
                title="Current Assets"
                rows={bsRows(
                  balanceSheetData.assets?.currentAssets || {},
                  monthIndex,
                )}
                totalLabel="Total Current Assets"
                totalValue={fv(
                  calculateTotal(
                    balanceSheetData.assets?.currentAssets || {},
                    monthIndex,
                  ),
                )}
                monthIndex={monthIndex}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Current Assets", "totalCurrentAssets")}
              />
              <BSTable
                title="Fixed Assets (Net)"
                rows={[
                  {
                    key: "land",
                    label: "Land",
                    value: fv(
                      parseFloat(
                        balanceSheetData.assets?.fixedAssets?.land?.[
                          monthIndex
                        ],
                      ) || 0,
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.land,
                  },
                  {
                    key: "buildings",
                    label: "Buildings (Net)",
                    value: fv(
                      (parseFloat(
                        balanceSheetData.assets?.fixedAssets?.buildings?.[
                          monthIndex
                        ],
                      ) || 0) -
                        (parseFloat(
                          balanceSheetData.assets?.fixedAssets
                            ?.lessDepreciationBuildings?.[monthIndex],
                        ) || 0),
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.buildings,
                  },
                  {
                    key: "computer",
                    label: "Computer Equipment (Net)",
                    value: fv(
                      (parseFloat(
                        balanceSheetData.assets?.fixedAssets
                          ?.computerEquipment?.[monthIndex],
                      ) || 0) -
                        (parseFloat(
                          balanceSheetData.assets?.fixedAssets
                            ?.lessDepreciationComputer?.[monthIndex],
                        ) || 0),
                    ),
                    arr: balanceSheetData.assets?.fixedAssets
                      ?.computerEquipment,
                  },
                  {
                    key: "vehicles",
                    label: "Vehicles (Net)",
                    value: fv(
                      (parseFloat(
                        balanceSheetData.assets?.fixedAssets?.vehicles?.[
                          monthIndex
                        ],
                      ) || 0) -
                        (parseFloat(
                          balanceSheetData.assets?.fixedAssets
                            ?.lessDepreciationVehicles?.[monthIndex],
                        ) || 0),
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.vehicles,
                  },
                  {
                    key: "furniture",
                    label: "Furniture (Net)",
                    value: fv(
                      (parseFloat(
                        balanceSheetData.assets?.fixedAssets?.furniture?.[
                          monthIndex
                        ],
                      ) || 0) -
                        (parseFloat(
                          balanceSheetData.assets?.fixedAssets
                            ?.lessDepreciationFurniture?.[monthIndex],
                        ) || 0),
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.furniture,
                  },
                  {
                    key: "machinery",
                    label: "Machinery (Net)",
                    value: fv(
                      (parseFloat(
                        balanceSheetData.assets?.fixedAssets?.machinery?.[
                          monthIndex
                        ],
                      ) || 0) -
                        (parseFloat(
                          balanceSheetData.assets?.fixedAssets
                            ?.lessDepreciationMachinery?.[monthIndex],
                        ) || 0),
                    ),
                    arr: balanceSheetData.assets?.fixedAssets?.machinery,
                  },
                  {
                    key: "ppe",
                    label: "Other PPE (Net)",
                    value: fv(
                      (parseFloat(
                        balanceSheetData.assets?.fixedAssets
                          ?.otherPropertyPlantEquipment?.[monthIndex],
                      ) || 0) -
                        (parseFloat(
                          balanceSheetData.assets?.fixedAssets
                            ?.lessDepreciationOther?.[monthIndex],
                        ) || 0),
                    ),
                    arr: balanceSheetData.assets?.fixedAssets
                      ?.otherPropertyPlantEquipment,
                  },
                  {
                    key: "auc",
                    label: "Assets Under Construction",
                    value: fv(
                      parseFloat(
                        balanceSheetData.assets?.fixedAssets
                          ?.assetsUnderConstruction?.[monthIndex],
                      ) || 0,
                    ),
                    arr: balanceSheetData.assets?.fixedAssets
                      ?.assetsUnderConstruction,
                  },
                ]}
                totalLabel="Total Fixed Assets"
                totalValue={fv(calcFixedAssets(monthIndex))}
                monthIndex={monthIndex}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Fixed Assets", "totalFixedAssets")}
              />
              <BSTable
                title="Intangible Assets"
                rows={Object.keys(
                  balanceSheetData.assets?.intangibleAssets || {},
                ).map((key) => ({
                  key,
                  arr: balanceSheetData.assets.intangibleAssets[key],
                  label:
                    key === "lessAmortization"
                      ? "Less: Accumulated Amortization"
                      : key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (s) => s.toUpperCase()),
                  value: fv(
                    parseFloat(
                      balanceSheetData.assets.intangibleAssets[key]?.[
                        monthIndex
                      ],
                    ) || 0,
                  ),
                  redLabel: key === "lessAmortization",
                }))}
                totalLabel="Total Intangible Assets"
                totalValue={fv(calcIntangibles(monthIndex))}
                monthIndex={monthIndex}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Intangible Assets", "totalIntangibleAssets")}
              />
              <BSTable
                title="Non-Current Assets"
                rows={bsRows(
                  balanceSheetData.assets?.nonCurrentAssets || {},
                  monthIndex,
                )}
                totalLabel="Total Non-Current Assets"
                totalValue={fv(
                  calculateTotal(
                    balanceSheetData.assets?.nonCurrentAssets || {},
                    monthIndex,
                  ),
                )}
                monthIndex={monthIndex}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Non-Current Assets", "totalNonCurrentAssets")}
              />
              {(balanceSheetData.assets?.customCategories || []).map(
                (custom, i) => (
                  <BSTable
                    key={i}
                    title={custom?.category || "Custom"}
                    rows={Object.keys(custom?.items || {}).map((k) => ({
                      key: k,
                      label: k,
                      value: fv(parseFloat(custom.items[k]?.[monthIndex]) || 0),
                      arr: custom.items[k],
                    }))}
                    totalLabel={`Total ${custom?.category}`}
                    totalValue={fv(
                      Object.values(custom?.items || {}).reduce(
                        (s, a) => s + (parseFloat(a?.[monthIndex]) || 0),
                        0,
                      ),
                    )}
                    monthIndex={monthIndex}
                    openTrend={openTrend}
                  />
                ),
              )}
              <div className="mt-5 p-4 bg-mediumBrown rounded-md flex justify-between items-center">
                <span className="text-[#fdfcfb] text-base font-bold">
                  TOTAL ASSETS
                </span>
                <span className="text-[#fdfcfb] text-lg font-bold">
                  {fv(totalAssets)}
                </span>
              </div>
            </div>

            {/* LIABILITIES & EQUITY */}
            <div className="bg-[#fdfcfb] p-5 rounded-lg shadow-md">
              <h3 className="text-mediumBrown mb-4 text-lg font-bold">
                LIABILITIES & EQUITY
              </h3>
              <BSTable
                title="Current Liabilities"
                rows={bsRows(
                  balanceSheetData.liabilities?.currentLiabilities || {},
                  monthIndex,
                )}
                totalLabel="Total Current Liabilities"
                totalValue={fv(
                  calculateTotal(
                    balanceSheetData.liabilities?.currentLiabilities || {},
                    monthIndex,
                  ),
                )}
                monthIndex={monthIndex}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Current Liabilities", "totalCurrentLiabilities")}
              />
              <BSTable
                title="Non-Current Liabilities"
                rows={bsRows(
                  balanceSheetData.liabilities?.nonCurrentLiabilities || {},
                  monthIndex,
                )}
                totalLabel="Total Non-Current Liabilities"
                totalValue={fv(
                  calculateTotal(
                    balanceSheetData.liabilities?.nonCurrentLiabilities || {},
                    monthIndex,
                  ),
                )}
                monthIndex={monthIndex}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Non-Current Liabilities", "totalNonCurrentLiabilities")}
              />
              <div className="mb-5 p-4 bg-[#8d6e63] rounded-md flex justify-between items-center">
                <span className="text-[#fdfcfb] text-base font-bold">
                  TOTAL LIABILITIES
                </span>
                <span className="text-[#fdfcfb] text-lg font-bold">
                  {fv(totalLiabilities)}
                </span>
              </div>
              <BSTable
                title="Equity"
                rows={Object.keys(balanceSheetData.equity || {}).map((key) => ({
                  key,
                  arr: balanceSheetData.equity[key],
                  label:
                    key === "treasuryShares"
                      ? "Less: Treasury Shares"
                      : key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (s) => s.toUpperCase()),
                  value: fv(
                    parseFloat(balanceSheetData.equity[key]?.[monthIndex]) || 0,
                  ),
                  redLabel: key === "treasuryShares",
                }))}
                totalLabel="Total Equity"
                totalValue={fv(totalEquity)}
                monthIndex={monthIndex}
                openTrend={openTrend}
                totalTrendFn={() => openTrend("Total Equity", "totalEquity")}
              />
              <div className="mt-5 p-4 bg-mediumBrown rounded-md flex justify-between items-center">
                <span className="text-[#fdfcfb] text-base font-bold">
                  TOTAL LIABILITIES & EQUITY
                </span>
                <span className="text-[#fdfcfb] text-lg font-bold">
                  {fv(totalLiabilities + totalEquity)}
                </span>
              </div>
            </div>
          </div>

          {balanceSheetData?.assets?.additionalMetrics && (
            <div className="mt-7 p-5 bg-[#fdfcfb] rounded-lg shadow-md">
              <h4 className="text-mediumBrown mb-4 text-base font-semibold">
                Additional Business Metrics
              </h4>
              <div className="grid grid-cols-4 gap-5">
                {Object.keys(balanceSheetData.assets.additionalMetrics).map(
                  (key) => (
                    <div key={key}>
                      <div className="text-xs text-lightBrown mb-1">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (s) => s.toUpperCase())}
                      </div>
                      <div className="text-base font-semibold text-mediumBrown">
                        {fv(
                          parseFloat(
                            balanceSheetData.assets.additionalMetrics[key]?.[
                              monthIndex
                            ] || 0,
                          ),
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== SOLVENCY — NAV + Equity Ratio only (Debt to Equity/Assets moved to Leverage; Interest Coverage removed) ===== */}
      {activeSubTab === "solvency" && (
        <div>
          <KeyQuestionBox
            question="Can the business meet its long-term financial obligations? Is the business financially stable?"
            signals="Net asset value, equity ratio"
            decisions="Manage debt levels, improve asset base, consider equity financing"
          />
          <div className="grid grid-cols-2 gap-5">
            {renderKPICard(
              "Net Asset Value",
              solvencyData.nav,
              "nav",
              false,
              "solvencyData.nav",
            )}
            {renderKPICard(
              "Equity Ratio",
              solvencyData.equityRatio,
              "equityRatio",
              true,
              "solvencyData.equityRatio",
            )}
          </div>
        </div>
      )}

      {/* ===== LEVERAGE — Debt to Assets + Debt to Equity (moved here from Solvency); removed Total Debt Ratio, Long-term Debt Ratio, Equity Multiplier ===== */}
      {activeSubTab === "leverage" && (
        <div>
          <KeyQuestionBox
            question="How effectively is the business using debt to finance its operations?"
            signals="Debt-to-asset ratio, debt-to-equity ratio"
            decisions="Optimize capital structure, manage risk, refinance high-cost debt"
          />
          <div className="grid grid-cols-2 gap-5">
            {renderKPICard(
              "Debt to Assets",
              solvencyData.debtToAssets,
              "debtToAssets",
              false,
              "solvencyData.debtToAssets",
            )}
            {renderKPICard(
              "Debt to Equity",
              solvencyData.debtToEquity,
              "debtToEquity",
              false,
              "solvencyData.debtToEquity",
            )}
          </div>
        </div>
      )}

      {/* ===== EQUITY — KPI cards removed; dividend table only ===== */}
      {activeSubTab === "equity" && (
        <div>
          <KeyQuestionBox
            question="How is equity being distributed and retained? What is the dividend policy?"
            signals="Dividend yield, payout ratio, capital retention"
            decisions="Balance dividends vs reinvestment, optimize equity structure"
          />

          <div className="bg-[#fdfcfb] p-5 rounded-lg mb-7">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-mediumBrown m-0 font-semibold">
                Dividend Policy & Capital Retention
              </h4>
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
                    <th
                      key={h}
                      className="p-3 text-left text-mediumBrown text-xs font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dividendHistory.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-5 text-center text-lightBrown">
                      No dividend records found
                    </td>
                  </tr>
                ) : (
                  dividendHistory.map((d, i) => (
                    <tr
                      key={d.id}
                      className={`border-b border-[#e8ddd4] ${i % 2 === 0 ? "bg-[#fdfcfb]" : "bg-[#f7f3f0]"}`}
                    >
                      <td className="p-3 text-mediumBrown text-xs">{d.date}</td>
                      <td className="p-3 text-right text-mediumBrown text-xs font-semibold">
                        {formatCurrency(d.amount, "zar", 2)}
                      </td>
                      <td className="p-3 text-mediumBrown text-xs">{d.type}</td>
                      <td className="p-3 text-mediumBrown text-xs">
                        {d.declaredBy}
                      </td>
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
                const total12mo = dividendHistory
                  .filter((d) => new Date(d.date) >= oneYearAgo)
                  .reduce((s, d) => s + (d.amount || 0), 0);
                const yieldPct =
                  totalEquity > 0 ? (total12mo / totalEquity) * 100 : 0;
                const currYearEarnings =
                  parseFloat(
                    balanceSheetData.equity?.currentYearEarnings?.[monthIndex],
                  ) || 0;
                const payout =
                  currYearEarnings > 0
                    ? (total12mo / currYearEarnings) * 100
                    : 0;
                return [
                  [
                    "Total Dividends (12mo)",
                    formatCurrency(total12mo, "zar", 2),
                  ],
                  ["Dividend Yield", `${yieldPct.toFixed(2)}%`],
                  ["Payout Ratio", `${payout.toFixed(2)}%`],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-xs text-lightBrown mb-1">{label}</div>
                    <div className="text-lg font-bold text-mediumBrown">
                      {val}
                    </div>
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
        onSave={loadCapitalStructureData}
        loading={loading}
        financialYearStart={financialYearStart}
      />

      {showDividendModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1001]">
          <div className="bg-[#fdfcfb] p-7 rounded-lg max-w-lg w-[90%]">
            <h3 className="text-mediumBrown mb-5 font-semibold">
              Add Dividend Record
            </h3>
            {[
              ["Date *", "date", "date", ""],
              ["Amount (ZAR) *", "amount", "number", "0.00"],
              [
                "Declared By",
                "declaredBy",
                "text",
                "e.g., Board Resolution #123",
              ],
            ].map(([label, field, type, ph]) => (
              <div key={field} className="mb-4">
                <label className="block text-mediumBrown mb-1 text-xs font-semibold">
                  {label}
                </label>
                <input
                  type={type}
                  placeholder={ph}
                  value={dividendForm[field]}
                  onChange={(e) =>
                    setDividendForm((p) => ({ ...p, [field]: e.target.value }))
                  }
                  className="w-full p-2.5 rounded border border-[#e8ddd4] text-sm"
                />
              </div>
            ))}
            <div className="mb-5">
              <label className="block text-mediumBrown mb-1 text-xs font-semibold">
                Type
              </label>
              <select
                value={dividendForm.type}
                onChange={(e) =>
                  setDividendForm((p) => ({ ...p, type: e.target.value }))
                }
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
                  setDividendForm({
                    date: "",
                    amount: "",
                    type: "Interim",
                    declaredBy: "",
                  });
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
                      collection(
                        db,
                        "financialData",
                        `${user.uid}_dividends`,
                        "dividendHistory",
                      ),
                      {
                        ...dividendForm,
                        amount: parseFloat(dividendForm.amount),
                        userId: user.uid,
                        createdAt: new Date().toISOString(),
                      },
                    );
                    loadDividendHistory();
                    setShowDividendModal(false);
                    setDividendForm({
                      date: "",
                      amount: "",
                      type: "Interim",
                      declaredBy: "",
                    });
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
          onClose={() => {
            setShowTrendModal(false);
            setTrendData(null);
          }}
          item={selectedTrendItem}
          trendData={trendData}
          currencyUnit={currencyUnit}
          formatValue={formatValue}
          activeSection={"capital-structure"}
          loading={trendLoading}
        />
      )}
    </div>
  );
};

export default CapitalStructure;