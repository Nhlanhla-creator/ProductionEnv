"use client";
import { useState, useCallback } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import {
  computePnlChartData,
  computeCostChartData,
  computeLiquidityChartData,
  computeCapitalStructureChartData,
  processPnlFromFirebase,
  getRangeComputed,
  getRangeMonthsMeta,
  getFirstDataMonth,
} from "../MyGrowthTools/financial/financialUtils";
import {
  EMPTY_BALANCE_SHEET,
  EMPTY_PNL,
} from "../MyGrowthTools/financial/financialConstants";

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Load year-keyed doc, fall back to legacy no-suffix doc */
const loadYearDoc = async (uid, docBase, year) => {
  let snap = await getDoc(doc(db, "financialData", `${uid}${docBase}_${year}`));
  if (!snap.exists())
    snap = await getDoc(doc(db, "financialData", `${uid}${docBase}`));
  return snap.exists() ? snap.data() : null;
};

/** Unique calendar years spanned by a range */
const yearsInRange = (fromYM, toYM) => [
  ...new Set(getRangeMonthsMeta(fromYM, toYM).map((m) => m.year)),
];

/**
 * Stitch computed chart keys across year docs into a single range-length array.
 * docCache: { [year]: processedChartData | null }
 * meta:     getRangeMonthsMeta result
 * keys:     array of chartKey strings to stitch
 * hasBudget: whether to also stitch budget arrays
 */
const stitchKeys = (docCache, meta, keys, hasBudget = false) => {
  const result = {};
  for (const key of keys) {
    const actual = [],
      budget = [];
    for (const { year, monthIndex } of meta) {
      const entry = docCache[year]?.[key];
      const a = entry?.actual?.[monthIndex];
      const b = entry?.budget?.[monthIndex];
      actual.push(a !== undefined && a !== null ? a : null);
      if (hasBudget) budget.push(b !== undefined && b !== null ? b : null);
    }
    result[key] = hasBudget ? { actual, budget } : { actual };
  }
  return result;
};

// =============================================================================
// CAPITAL STRUCTURE
// =============================================================================
export const useCapitalStructureData = (user) => {
  const [balanceSheetData, setBalanceSheetData] = useState(EMPTY_BALANCE_SHEET);
  const [solvencyData, setSolvencyData] = useState({
    debtToEquity: Array(12).fill("0"),
    debtToAssets: Array(12).fill("0"),
    equityRatio: Array(12).fill("0"),
    interestCoverage: Array(12).fill("0"),
    debtServiceCoverage: Array(12).fill("0"),
    nav: Array(12).fill("0"),
  });
  const [leverageData, setLeverageData] = useState({
    totalDebtRatio: Array(12).fill("0"),
    longTermDebtRatio: Array(12).fill("0"),
    equityMultiplier: Array(12).fill("0"),
  });
  const [equityData, setEquityData] = useState({
    returnOnEquity: Array(12).fill("0"),
    bookValuePerShare: Array(12).fill("0"),
    equityRatio: Array(12).fill("0"),
  });
  const [dividendHistory, setDividendHistory] = useState([]);
  const [kpiNotes, setKpiNotes] = useState({});
  const [kpiAnalysis, setKpiAnalysis] = useState({});
  const [loading, setLoading] = useState(false);
  const [firstDataMonth, setFirstDataMonth] = useState(null);

  /**
   * Load balance-sheet snapshot for the calendar year containing toYM.
   * Also hydrates solvency/leverage/equity arrays from that year's doc.
   *
   * @param {string} toYM - "YYYY-MM" — the last month in the selected range
   */
  const loadCapitalStructureData = useCallback(
    async (toYM) => {
      if (!user) return;
      setLoading(true);
      try {
        // One-time first-data-month scan
        if (!firstDataMonth) {
          const first = await getFirstDataMonth({
            uid: user.uid,
            docBase: "_capitalStructure",
            probeKey: "totalAssets",
            getDocFn: getDoc,
            docFn: doc,
            db,
            processor: computeCapitalStructureChartData,
          });
          setFirstDataMonth(first);
        }

        const year = parseInt(
          (toYM ?? new Date().toISOString().slice(0, 7)).split("-")[0],
        );
        const raw = await loadYearDoc(user.uid, "_capitalStructure", year);
        if (raw) {
          if (raw.balanceSheetData) setBalanceSheetData(raw.balanceSheetData);
          if (raw.solvencyData) setSolvencyData(raw.solvencyData);
          if (raw.leverageData) setLeverageData(raw.leverageData);
          if (raw.equityData) setEquityData(raw.equityData);
          if (raw.kpiNotes) setKpiNotes(raw.kpiNotes);
          if (raw.kpiAnalysis) setKpiAnalysis(raw.kpiAnalysis);
        }
      } catch (e) {
        console.error("Error loading capital structure:", e);
      } finally {
        setLoading(false);
      }
    },
    [user, firstDataMonth],
  );

  const loadDividendHistory = useCallback(async () => {
    if (!user) return;
    try {
      const q = query(
        collection(
          db,
          "financialData",
          `${user.uid}_dividends`,
          "dividendHistory",
        ),
        orderBy("date", "desc"),
      );
      const snap = await getDocs(q);
      setDividendHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error loading dividends:", e);
    }
  }, [user]);

  /**
   * Fetch range trend data for a single chart key.
   * Used by openTrend inside CapitalStructure.
   *
   * @returns {{ labels: string[], actual: number[], budget: number[] }}
   */
  const loadTrendData = useCallback(
    async (chartKey, fromYM, toYM) => {
      if (!user) return { labels: [], actual: [], budget: [] };
      try {
        const { actual, budget } = await getRangeComputed({
          uid: user.uid,
          docBase: "_capitalStructure",
          chartKey,
          fromYM,
          toYM,
          getDocFn: getDoc,
          docFn: doc,
          db,
          processor: computeCapitalStructureChartData,
        });
        const labels = getRangeMonthsMeta(fromYM, toYM).map((m) => m.label);
        return { labels, actual, budget };
      } catch (e) {
        console.error("Trend load error:", e);
        return { labels: [], actual: [], budget: [] };
      }
    },
    [user],
  );

  return {
    balanceSheetData,
    setBalanceSheetData,
    solvencyData,
    setSolvencyData,
    leverageData,
    setLeverageData,
    equityData,
    setEquityData,
    dividendHistory,
    setDividendHistory,
    kpiNotes,
    setKpiNotes,
    kpiAnalysis,
    loading,
    firstDataMonth,
    loadCapitalStructureData,
    loadDividendHistory,
    loadTrendData,
  };
};

// =============================================================================
// PERFORMANCE ENGINE
// =============================================================================
export const usePerformanceEngineData = (user) => {
  const [pnlDetails, setPnlDetails] = useState(EMPTY_PNL);
  const [firebaseChartData, setFirebaseChartData] = useState({});
  const [chartNotes, setChartNotes] = useState({});
  const [chartAnalysis, setChartAnalysis] = useState({});
  const [customKPIs, setCustomKPIs] = useState({});
  const [loading, setLoading] = useState(false);
  const [firstDataMonth, setFirstDataMonth] = useState(null);

  const PNL_KEYS = [
    "sales",
    "cogs",
    "opex",
    "grossProfit",
    "ebitda",
    "ebit",
    "netProfit",
    "gpMargin",
    "npMargin",
  ];

  /**
   * Load and stitch P&L chart data across the full selected range.
   *
   * @param {string}   fromYM
   * @param {string}   toYM
   * @param {Function} [onUpdateChartData]
   */
  const loadPnLData = useCallback(
    async (fromYM, toYM, onUpdateChartData) => {
      if (!user) return;
      setLoading(true);
      try {
        if (!firstDataMonth) {
          const first = await getFirstDataMonth({
            uid: user.uid,
            docBase: "_pnlManual",
            probeKey: "sales",
            getDocFn: getDoc,
            docFn: doc,
            db,
            processor: computePnlChartData,
          });
          setFirstDataMonth(first);
        }

        const years = yearsInRange(fromYM, toYM);
        const meta = getRangeMonthsMeta(fromYM, toYM);

        const docCache = {};
        await Promise.all(
          years.map(async (year) => {
            const raw = await loadYearDoc(user.uid, "_pnlManual", year);
            // Populate pnlDetails from the most-recent year for the Add Data modal
            if (year === Math.max(...years) && raw)
              setPnlDetails(processPnlFromFirebase(raw));
            docCache[year] = raw ? computePnlChartData(raw) : null;
          }),
        );

        const stitched = stitchKeys(docCache, meta, PNL_KEYS, true);
        setFirebaseChartData(stitched);
        if (onUpdateChartData)
          Object.keys(stitched).forEach((k) =>
            onUpdateChartData(k, stitched[k]),
          );
      } catch (e) {
        console.error("Error loading P&L:", e);
      } finally {
        setLoading(false);
      }
    },
    [user, firstDataMonth],
  );

  const loadCustomKPIs = useCallback(
    async (setVisibleCharts) => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "financialData"),
          where("userId", "==", user.uid),
          where("isCustomKPI", "==", true),
          where("section", "==", "performance-engine"),
        );
        const snap = await getDocs(q);
        const kpis = {};
        snap.forEach((d) => {
          const data = d.data();
          kpis[data.chartName] = data;
          if (setVisibleCharts)
            setVisibleCharts((p) => ({ ...p, [data.chartName]: true }));
        });
        setCustomKPIs(kpis);
      } catch (e) {
        console.error("Error loading custom KPIs:", e);
      }
    },
    [user],
  );

  return {
    pnlDetails,
    setPnlDetails,
    firebaseChartData,
    setFirebaseChartData,
    chartNotes,
    setChartNotes,
    chartAnalysis,
    customKPIs,
    loading,
    firstDataMonth,
    loadPnLData,
    loadCustomKPIs,
  };
};

// =============================================================================
// COST AGILITY
// =============================================================================
export const useCostAgilityData = (user) => {
  const [costDetails, setCostDetails] = useState({
    fixedCosts: Array(12).fill(""),
    variableCosts: Array(12).fill(""),
    discretionaryCosts: Array(12).fill(""),
    semiVariableCosts: Array(12).fill(""),
    lockInDuration: Array(12).fill(""),
    notes: "",
  });
  const [firebaseChartData, setFirebaseChartData] = useState({});
  const [chartNotes, setChartNotes] = useState({});
  const [chartAnalysis, setChartAnalysis] = useState({});
  const [loading, setLoading] = useState(false);
  const [firstDataMonth, setFirstDataMonth] = useState(null);

  const COST_KEYS = [
    "fixedCosts",
    "variableCosts",
    "discretionaryCosts",
    "semiVariableCosts",
    "lockInDuration",
    "totalCosts",
    "fixedVariableRatio",
    "discretionaryPercentage",
  ];

  /**
   * Load and stitch cost data across the selected range.
   */
  const loadCostData = useCallback(
    async (fromYM, toYM) => {
      if (!user) return;
      setLoading(true);
      try {
        if (!firstDataMonth) {
          const first = await getFirstDataMonth({
            uid: user.uid,
            docBase: "_costAgility",
            probeKey: "fixedCosts",
            getDocFn: getDoc,
            docFn: doc,
            db,
            processor: computeCostChartData,
          });
          setFirstDataMonth(first);
        }

        const years = yearsInRange(fromYM, toYM);
        const meta = getRangeMonthsMeta(fromYM, toYM);

        const docCache = {};
        await Promise.all(
          years.map(async (year) => {
            const raw = await loadYearDoc(user.uid, "_costAgility", year);
            if (year === Math.max(...years) && raw) {
              setCostDetails({
                fixedCosts:
                  raw.fixedCosts?.map((v) => v.toFixed(2)) ??
                  Array(12).fill(""),
                variableCosts:
                  raw.variableCosts?.map((v) => v.toFixed(2)) ??
                  Array(12).fill(""),
                discretionaryCosts:
                  raw.discretionaryCosts?.map((v) => v.toFixed(2)) ??
                  Array(12).fill(""),
                semiVariableCosts:
                  raw.semiVariableCosts?.map((v) => v.toFixed(2)) ??
                  Array(12).fill(""),
                lockInDuration:
                  raw.lockInDuration?.map((v) => v.toFixed(0)) ??
                  Array(12).fill(""),
                notes: raw.notes || "",
              });
            }
            docCache[year] = raw ? computeCostChartData(raw) : null;
          }),
        );

        setFirebaseChartData(stitchKeys(docCache, meta, COST_KEYS, false));
      } catch (e) {
        console.error("Error loading cost data:", e);
      } finally {
        setLoading(false);
      }
    },
    [user, firstDataMonth],
  );

  return {
    costDetails,
    setCostDetails,
    firebaseChartData,
    chartNotes,
    setChartNotes,
    chartAnalysis,
    loading,
    firstDataMonth,
    loadCostData,
  };
};

// =============================================================================
// LIQUIDITY & SURVIVAL
// =============================================================================
export const useLiquidityData = (user) => {
  const ea = () => Array(12).fill("");
  const [liquidityDetails, setLiquidityDetails] = useState({
    currentRatio: ea(),
    quickRatio: ea(),
    cashRatio: ea(),
    burnRate: ea(),
    cashCover: ea(),
    cashflow: ea(),
    operatingCashflow: ea(),
    investingCashflow: ea(),
    financingCashflow: ea(),
    loanRepayments: ea(),
    cashBalance: ea(),
    workingCapital: ea(),
    notes: "",
  });
  const [firebaseChartData, setFirebaseChartData] = useState({});
  const [chartNotes, setChartNotes] = useState({});
  const [chartAnalysis, setChartAnalysis] = useState({});
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [firstDataMonth, setFirstDataMonth] = useState(null);

  const LIQ_KEYS = [
    "currentRatio",
    "quickRatio",
    "cashRatio",
    "burnRate",
    "cashCover",
    "cashflow",
    "loanRepayments",
    "cashBalance",
    "workingCapital",
    "monthsRunway",
  ];

  /**
   * Load and stitch liquidity data across the selected range.
   */
  const loadLiquidityData = useCallback(
    async (fromYM, toYM) => {
      if (!user) return;
      setLoading(true);
      try {
        if (!firstDataMonth) {
          const first = await getFirstDataMonth({
            uid: user.uid,
            docBase: "_liquiditySurvival",
            probeKey: "currentRatio",
            getDocFn: getDoc,
            docFn: doc,
            db,
            processor: computeLiquidityChartData,
          });
          setFirstDataMonth(first);
        }

        const years = yearsInRange(fromYM, toYM);
        const meta = getRangeMonthsMeta(fromYM, toYM);

        const docCache = {};
        await Promise.all(
          years.map(async (year) => {
            const raw = await loadYearDoc(user.uid, "_liquiditySurvival", year);
            if (year === Math.max(...years) && raw) {
              setLiquidityDetails({
                currentRatio:
                  raw.currentRatio?.map((v) => v.toFixed(2)) ?? ea(),
                quickRatio: raw.quickRatio?.map((v) => v.toFixed(2)) ?? ea(),
                cashRatio: raw.cashRatio?.map((v) => v.toFixed(2)) ?? ea(),
                burnRate: raw.burnRate?.map((v) => v.toFixed(2)) ?? ea(),
                cashCover: raw.cashCover?.map((v) => v.toFixed(1)) ?? ea(),
                cashflow: raw.cashflow?.map((v) => v.toFixed(2)) ?? ea(),
                operatingCashflow:
                  raw.operatingCashflow?.map((v) => v.toFixed(2)) ?? ea(),
                investingCashflow:
                  raw.investingCashflow?.map((v) => v.toFixed(2)) ?? ea(),
                financingCashflow:
                  raw.financingCashflow?.map((v) => v.toFixed(2)) ?? ea(),
                loanRepayments:
                  raw.loanRepayments?.map((v) => v.toFixed(2)) ?? ea(),
                cashBalance: raw.cashBalance?.map((v) => v.toFixed(2)) ?? ea(),
                workingCapital:
                  raw.workingCapital?.map((v) => v.toFixed(2)) ?? ea(),
                notes: raw.notes || "",
              });
            }
            docCache[year] = raw ? computeLiquidityChartData(raw) : null;
          }),
        );

        setFirebaseChartData(stitchKeys(docCache, meta, LIQ_KEYS, false));
      } catch (e) {
        console.error("Error loading liquidity:", e);
      } finally {
        setLoading(false);
      }
    },
    [user, firstDataMonth],
  );

  const loadLoans = useCallback(async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "financialData"),
        where("userId", "==", user.uid),
        where("type", "==", "loan"),
        where("section", "==", "liquidity-survival"),
      );
      const snap = await getDocs(q);
      setLoans(snap.docs.map((d) => d.data()));
    } catch (e) {
      console.error("Error loading loans:", e);
    }
  }, [user]);

  return {
    liquidityDetails,
    setLiquidityDetails,
    firebaseChartData,
    chartNotes,
    setChartNotes,
    chartAnalysis,
    loans,
    loading,
    firstDataMonth,
    loadLiquidityData,
    loadLoans,
  };
};
