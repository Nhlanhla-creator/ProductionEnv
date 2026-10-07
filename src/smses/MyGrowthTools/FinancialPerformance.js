"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Chart, Pie } from "react-chartjs-2";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Eye, LineChart as LineChartIcon, Lightbulb, Plus, StickyNote, X, Save, Pencil, Info,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
  CheckCircle2, AlertTriangle, XCircle, ClipboardList, Download, RefreshCw, Columns3,
  ExternalLink, Square, CheckSquare, ArrowLeft, Calendar, SlidersHorizontal,
  Database, Sparkles, Sigma, Settings2, EyeOff, Palette, Check, Trash2,
  FileText, Printer, FileSpreadsheet,
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const functions = getFunctions();

/* ════════════════════════════════════════════════════════════════════════════
   Tokens
   ════════════════════════════════════════════════════════════════════════ */
const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", faint: "#8a7a74",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#4a352f", accentSoft: "#6b4f47", accentTint: "#f4efec",
  header: "#241813",
  green: "#166534", greenBg: "#f0fdf4",
  amber: "#92400e", amberBg: "#fffbeb",
  red: "#991b1b", redBg: "#fef2f2",
  blue: "#1e40af",
};

const RAPS_CATEGORIES = [
  { name: "Strategy & Execution", color: "#2563eb" },
  { name: "Financial Performance", color: "#c2410c" },
  { name: "Operational Performance", color: "#6d28d9" },
  { name: "People", color: "#be185d" },
  { name: "ESG Impact", color: "#4d7c0f" },
  { name: "Marketing & Sales", color: "#0e7490" },
  { name: "General", color: "#57534e" },
];
const ACTION_STATUSES = ["Not Done", "In Progress", "Done"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const PERIODS = [
  { key: "month", label: "This month" },
  { key: "quarter", label: "This quarter" },
  { key: "year", label: "This year" },
];
const PERIOD_LABEL = { month: "This month", quarter: "This quarter", year: "This year" };
const PERIOD_PREFIX = { month: "Monthly", quarter: "Quarterly", year: "Annual" };

/* ─── Financial year ────────────────────────────────────────────────────── */
const fyStartMonthFromEnd = (end) => {
  if (!end) return 0;
  const m = Number(String(end).split("-")[1]);
  return Number.isFinite(m) && m >= 1 && m <= 12 ? m % 12 : 0;
};
const fyStartYearOf = (date, sm) => (date.getMonth() >= sm ? date.getFullYear() : date.getFullYear() - 1);
const fyLabel = (sy, sm) => (sm === 0 ? `${sy}` : `${sy}/${String(sy + 1).slice(2)}`);

const fyMonths = (sy, sm) =>
  Array.from({ length: 12 }, (_, i) => {
    const d = new Date(sy, sm + i, 1);
    return {
      key: `M:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      long: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      year: d.getFullYear(), month: d.getMonth(), index: i,
    };
  });

const fyQuarters = (sy, sm) => {
  const months = fyMonths(sy, sm);
  return [0,1,2,3].map((q) => {
    const s = months.slice(q * 3, q * 3 + 3);
    return { key: `Q${q + 1}`, label: `Q${q + 1}`, range: `${s[0].label} – ${s[2].label}`, months: s, index: q };
  });
};
const currentMonthKey = () => { const d = new Date(); return `M:${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };

/* ─── Formatting ────────────────────────────────────────────────────────── */
const LOCALE = "en-US";
const trimNum = (n) => {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n), dp = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return Number(n.toFixed(dp)).toLocaleString(LOCALE, { maximumFractionDigits: dp });
};

const fmtValue = (raw, kpi, { signed = false, bare = false } = {}) => {
  if (raw === null || raw === undefined || raw === "") return "—";
  const n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  const sign = signed && n > 0 ? "+" : "";
  if (kpi?.units === "%") return `${sign}${trimNum(n)}${bare ? "" : "%"}`;
  if (kpi?.units === "×") return `${sign}${Number(n.toFixed(2))}${bare ? "" : "×"}`;
  if (kpi?.units === "R") {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `${sign}${bare ? "" : "R "}${(n / 1_000_000).toLocaleString(LOCALE, { maximumFractionDigits: 2 })}m`;
    if (abs >= 1_000) return `${sign}${bare ? "" : "R "}${(n / 1_000).toLocaleString(LOCALE, { maximumFractionDigits: 1 })}k`;
    return `${sign}${bare ? "" : "R "}${n.toLocaleString(LOCALE, { maximumFractionDigits: 0 })}`;
  }
  const suffix = !bare && kpi?.units && !["#","%","R","×"].includes(kpi.units) ? ` ${kpi.units}` : "";
  return `${sign}${trimNum(n)}${suffix}`;
};

const parseNumberInput = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const cleaned = String(value).replace(/[\s,]/g, '');
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
};

const parseNum = (v) => { if (v === null || v === undefined || v === "") return null; const n = Number(v); return Number.isNaN(n) ? null : n; };
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
const errText = (e) => String(e?.message ?? e ?? "Unknown error");
const fmtDMY = (d) => { if (!d) return ""; const x = new Date(d); return Number.isNaN(x.getTime()) ? "" : `${String(x.getDate()).padStart(2,"0")}/${String(x.getMonth()+1).padStart(2,"0")}/${x.getFullYear()}`; };
const rollUp = (values, mode) => {
  const nums = values.filter((v) => Number.isFinite(v));
  if (!nums.length) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return mode === "sum" ? sum : sum / nums.length;
};
const mean = (arr) => { const n = arr.filter((v) => Number.isFinite(v)); return n.length ? n.reduce((a,b)=>a+b,0) / n.length : null; };
const div = (a, b) => (Number.isFinite(a) && Number.isFinite(b) && b !== 0 ? a / b : null);

/* Normalise a field path so both "sales" and ["pipelineData","sales"] work */
const pathArr = (p) => (p === null || p === undefined ? [] : Array.isArray(p) ? p : [p]);

/* ════════════════════════════════════════════════════════════════════════════
   Source documents
   ════════════════════════════════════════════════════════════════════════ */
const DOC = {
  pnl: "_pnlManual",
  bs: "_capitalStructure",
  cost: "_costAgility",
  liq: "_liquiditySurvival",
};

const num = (arr, mi) => { const v = arr?.[mi]; const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const sumObj = (obj, mi) => Object.values(obj || {}).reduce((s, a) => s + (parseFloat(a?.[mi]) || 0), 0);

const monthHasBs = (bs, mi) => {
  if (!bs) return false;
  const scan = (o) => Object.values(o || {}).some((a) => Array.isArray(a) && a[mi] !== "" && a[mi] !== null && a[mi] !== undefined);
  const a = bs.assets || {};
  return scan(a.bank) || scan(a.currentAssets) || scan(a.fixedAssets) || scan(a.intangibleAssets) || scan(a.nonCurrentAssets)
    || scan(bs.liabilities?.currentLiabilities) || scan(bs.liabilities?.nonCurrentLiabilities) || scan(bs.equity)
    || (a.customCategories || bs.customCategories || []).some((c) => scan(c.items))
    || (bs.customLiabilitiesCategories || []).some((c) => scan(c.items))
    || (bs.customEquityCategories || []).some((c) => scan(c.items));
};

const bsTotals = (bsDoc, mi) => {
  const bs = bsDoc?.balanceSheetData;
  const empty = { assets: null, liabilities: null, equity: null, currentAssets: null, currentLiabilities: null, inventory: null, cash: null };
  if (!bs || !monthHasBs(bs, mi)) return empty;

  const a = bs.assets || {};
  const fixed = (() => {
    const fa = a.fixedAssets; if (!fa) return 0;
    const add = ["land","buildings","computerEquipment","vehicles","furniture","machinery","otherPropertyPlantEquipment","assetsUnderConstruction"];
    const sub = ["lessDepreciationBuildings","lessDepreciationComputer","lessDepreciationVehicles","lessDepreciationFurniture","lessDepreciationMachinery","lessDepreciationOther"];
    return add.reduce((s, k) => s + (parseFloat(fa[k]?.[mi]) || 0), 0) - sub.reduce((s, k) => s + (parseFloat(fa[k]?.[mi]) || 0), 0);
  })();
  const intangible = (() => {
    const ia = a.intangibleAssets; if (!ia) return 0;
    return ["goodwill","trademarks","patents","software","customerLists"].reduce((s, k) => s + (parseFloat(ia[k]?.[mi]) || 0), 0)
      - (parseFloat(ia.lessAmortization?.[mi]) || 0);
  })();
  const customAssets = (a.customCategories || bs.customCategories || []).reduce((s, c) => s + sumObj(c.items, mi), 0);

  const currentAssets = sumObj(a.currentAssets, mi) + sumObj(a.bank, mi);
  const assets = currentAssets + fixed + intangible + sumObj(a.nonCurrentAssets, mi) + customAssets;

  const currentLiabilities = sumObj(bs.liabilities?.currentLiabilities, mi);
  const liabilities = currentLiabilities + sumObj(bs.liabilities?.nonCurrentLiabilities, mi)
    + (bs.customLiabilitiesCategories || []).reduce((s, c) => s + sumObj(c.items, mi), 0);

  const equity = sumObj(bs.equity, mi) - 2 * (parseFloat(bs.equity?.treasuryShares?.[mi]) || 0)
    + (bs.customEquityCategories || []).reduce((s, c) => s + sumObj(c.items, mi), 0);

  return {
    assets, liabilities, equity, currentAssets, currentLiabilities,
    inventory: parseFloat(a.currentAssets?.inventory?.[mi]) || 0,
    cash: sumObj(a.bank, mi) + (parseFloat(a.currentAssets?.cash?.[mi]) || 0),
  };
};

const buildContext = (docs, year, mi) => {
  const p = docs[`${DOC.pnl}_${year}`], b = docs[`${DOC.bs}_${year}`];
  const c = docs[`${DOC.cost}_${year}`], l = docs[`${DOC.liq}_${year}`];
  const t = bsTotals(b, mi);

  const sales = num(p?.sales, mi), cogs = num(p?.cogs, mi), opex = num(p?.opex, mi);
  const dep = num(p?.depreciation, mi), amort = num(p?.amortization, mi);
  const intExp = num(p?.interestExpense, mi), intInc = num(p?.interestIncome, mi), tax = num(p?.tax, mi);

  const salesB = num(p?.salesBudget, mi), cogsB = num(p?.cogsBudget, mi), opexB = num(p?.opexBudget, mi);
  const depB = num(p?.depreciationBudget, mi), amortB = num(p?.amortizationBudget, mi);
  const intExpB = num(p?.interestExpenseBudget, mi), intIncB = num(p?.interestIncomeBudget, mi), taxB = num(p?.taxBudget, mi);

  const gp = Number.isFinite(sales) && Number.isFinite(cogs) ? sales - cogs : null;
  const gpB = Number.isFinite(salesB) && Number.isFinite(cogsB) ? salesB - cogsB : null;
  const ebitda = Number.isFinite(gp) && Number.isFinite(opex) ? gp - opex : null;
  const ebitdaB = Number.isFinite(gpB) && Number.isFinite(opexB) ? gpB - opexB : null;
  const ebit = Number.isFinite(ebitda) ? ebitda - (dep || 0) - (amort || 0) : null;
  const np = Number.isFinite(ebit) ? ebit - (intExp || 0) + (intInc || 0) - (tax || 0) : null;
  const ebitB = Number.isFinite(ebitdaB) ? ebitdaB - (depB || 0) - (amortB || 0) : null;
  const npB = Number.isFinite(ebitB) ? ebitB - (intExpB || 0) + (intIncB || 0) - (taxB || 0) : null;

  const fixedCosts = num(c?.fixedCosts, mi), variableCosts = num(c?.variableCosts, mi);
  const discretionary = num(c?.discretionaryCosts, mi), semiVariable = num(c?.semiVariableCosts, mi);
  const lockIn = num(c?.lockInDuration, mi);
  const totalCost = [fixedCosts, variableCosts, discretionary, semiVariable].filter(Number.isFinite).reduce((s, v) => s + v, 0) || null;

  return {
    sales, cogs, opex, gp, np, ebitda, ebit, dep, amort, intExp, intInc, tax,
    salesB, cogsB, opexB, gpB, npB, ebitdaB,
    ...t,
    fixedCosts, variableCosts, discretionary, semiVariable, lockIn, totalCost,
    currentRatio: num(l?.currentRatio, mi), quickRatio: num(l?.quickRatio, mi), cashRatio: num(l?.cashRatio, mi),
    burnRate: num(l?.burnRate, mi), cashCover: num(l?.cashCover, mi),
    cashflow: num(l?.cashflow, mi), operatingCashflow: num(l?.operatingCashflow, mi),
    cashBalance: num(l?.cashBalance, mi), workingCapital: num(l?.workingCapital, mi),
    loanRepayments: num(l?.loanRepayments, mi),
  };
};

/* ════════════════════════════════════════════════════════════════════════════
   KPI registry
   ════════════════════════════════════════════════════════════════════════ */
const K = (o) => ({
  id: o.id, name: o.name, units: o.units, direction: o.direction || "higher",
  aggregate: o.aggregate || "avg",
  frequency: o.frequency || "Monthly",
  meaning: o.meaning, measured: o.measured,
  actual: o.actual, budget: o.budget || (() => null),
  field: o.field || null,
  source: o.source || null,
});

const TAB_DEFS = [
  {
    id: "summary",
    name: "Financial Performance",
    categories: [
      { name: "Solvency", kpis: [
        K({ id: "nav", name: "Net Asset Value", units: "R", direction: "higher", aggregate: "avg",
          source: "Calculated from Balance Sheet",
          meaning: "What the business would be worth if you settled every liability today — total assets less total liabilities.",
          measured: "=SUM(TotalAssets) - SUM(TotalLiabilities)",
          actual: (c) => (Number.isFinite(c.assets) && Number.isFinite(c.liabilities) ? c.assets - c.liabilities : null) }),
        K({ id: "equityRatio", name: "Equity Ratio", units: "%", direction: "higher", aggregate: "avg",
          source: "Calculated from Balance Sheet",
          meaning: "How much of the business is funded by owners rather than lenders.",
          measured: "=TotalEquity / TotalAssets * 100",
          actual: (c) => { const r = div(c.equity, c.assets); return r === null ? null : r * 100; } }),
        K({ id: "interestCoverage", name: "Interest Coverage", units: "×", direction: "higher", aggregate: "avg",
          source: "Calculated from P&L",
          meaning: "How many times over your operating profit covers the interest bill.",
          measured: "=EBIT / InterestExpense",
          actual: (c) => div(c.ebit, c.intExp) }),
      ]},
      { name: "Leverage", kpis: [
        K({ id: "debtToAssets", name: "Debt to Assets", units: "×", direction: "lower", aggregate: "avg",
          source: "Calculated from Balance Sheet",
          meaning: "How much of what you own is funded by debt.",
          measured: "=TotalLiabilities / TotalAssets",
          actual: (c) => div(c.liabilities, c.assets) }),
        K({ id: "debtToEquity", name: "Debt to Equity", units: "×", direction: "lower", aggregate: "avg",
          source: "Calculated from Balance Sheet",
          meaning: "Rand of debt for every rand of owners' capital.",
          measured: "=TotalLiabilities / TotalEquity",
          actual: (c) => div(c.liabilities, c.equity) }),
        K({ id: "equityMultiplier", name: "Equity Multiplier", units: "×", direction: "lower", aggregate: "avg",
          source: "Calculated from Balance Sheet",
          meaning: "How far the asset base is stretched over the equity behind it.",
          measured: "=TotalAssets / TotalEquity",
          actual: (c) => div(c.assets, c.equity) }),
      ]},
      { name: "Revenue & Costs", kpis: [
        K({ id: "sales", name: "Revenue", units: "R", direction: "higher", aggregate: "sum", frequency: "Monthly",
          field: { src: "pnl", a: "sales", b: "salesBudget" },
          source: "Entered manually",
          meaning: "Everything you invoiced in the period.",
          measured: "=SUM(Sales)",
          actual: (c) => c.sales, budget: (c) => c.salesB }),
        K({ id: "cogs", name: "Cost of Sales", units: "R", direction: "lower", aggregate: "sum", frequency: "Monthly",
          field: { src: "pnl", a: "cogs", b: "cogsBudget" },
          source: "Entered manually",
          meaning: "What it cost you to deliver what you sold.",
          measured: "=SUM(COGS)",
          actual: (c) => c.cogs, budget: (c) => c.cogsB }),
        K({ id: "opex", name: "Operating Expenses", units: "R", direction: "lower", aggregate: "sum", frequency: "Monthly",
          field: { src: "pnl", a: "opex", b: "opexBudget" },
          source: "Entered manually",
          meaning: "Running the business — salaries, rent, marketing, admin.",
          measured: "=SUM(Opex)",
          actual: (c) => c.opex, budget: (c) => c.opexB }),
      ]},
      { name: "Profitability", kpis: [
        K({ id: "grossProfit", name: "Gross Profit", units: "R", direction: "higher", aggregate: "sum",
          source: "Calculated from P&L",
          meaning: "What's left after paying for what you sold.",
          measured: "=SUM(Sales) - SUM(COGS)",
          actual: (c) => c.gp, budget: (c) => c.gpB }),
        K({ id: "ebitda", name: "EBITDA", units: "R", direction: "higher", aggregate: "sum",
          source: "Calculated from P&L",
          meaning: "Operating profit before depreciation, amortisation, interest and tax.",
          measured: "=SUM(Sales) - SUM(COGS) - SUM(Opex)",
          actual: (c) => c.ebitda, budget: (c) => c.ebitdaB }),
        K({ id: "netProfit", name: "Net Profit", units: "R", direction: "higher", aggregate: "sum",
          source: "Calculated from P&L",
          meaning: "What the owners actually keep after every cost.",
          measured: "=EBITDA - Depreciation - Amortisation - InterestExpense + InterestIncome - Tax",
          actual: (c) => c.np, budget: (c) => c.npB }),
      ]},
      { name: "Margins", kpis: [
        K({ id: "gpMargin", name: "Gross Profit Margin", units: "%", direction: "higher", aggregate: "avg",
          source: "Calculated from P&L",
          meaning: "Cents of gross profit in every rand of revenue.",
          measured: "=(SUM(Sales) - SUM(COGS)) / SUM(Sales) * 100",
          actual: (c) => { const r = div(c.gp, c.sales); return r === null ? null : r * 100; },
          budget: (c) => { const r = div(c.gpB, c.salesB); return r === null ? null : r * 100; } }),
        K({ id: "npMargin", name: "Net Profit Margin", units: "%", direction: "higher", aggregate: "avg",
          source: "Calculated from P&L",
          meaning: "Cents of profit in every rand of revenue once everything is paid.",
          measured: "=NetProfit / SUM(Sales) * 100",
          actual: (c) => { const r = div(c.np, c.sales); return r === null ? null : r * 100; },
          budget: (c) => { const r = div(c.npB, c.salesB); return r === null ? null : r * 100; } }),
      ]},
      { name: "Liquidity Ratios", kpis: [
        K({ id: "currentRatio", name: "Current Ratio", units: "×", direction: "higher", aggregate: "avg", frequency: "Monthly",
          field: { src: "liq", a: "currentRatio" },
          source: "Entered manually or calculated",
          meaning: "Whether short-term assets cover short-term bills.",
          measured: "=CurrentAssets / CurrentLiabilities",
          actual: (c) => (Number.isFinite(c.currentRatio) ? c.currentRatio : div(c.currentAssets, c.currentLiabilities)) }),
        K({ id: "quickRatio", name: "Quick Ratio", units: "×", direction: "higher", aggregate: "avg", frequency: "Monthly",
          field: { src: "liq", a: "quickRatio" },
          source: "Entered manually or calculated",
          meaning: "Same test with stock stripped out.",
          measured: "=(CurrentAssets - Inventory) / CurrentLiabilities",
          actual: (c) => (Number.isFinite(c.quickRatio) ? c.quickRatio
            : div(Number.isFinite(c.currentAssets) ? c.currentAssets - (c.inventory || 0) : null, c.currentLiabilities)) }),
        K({ id: "cashRatio", name: "Cash Ratio", units: "×", direction: "higher", aggregate: "avg", frequency: "Monthly",
          field: { src: "liq", a: "cashRatio" },
          source: "Entered manually or calculated",
          meaning: "The harshest test — cash alone against short-term bills.",
          measured: "=CashAndEquivalents / CurrentLiabilities",
          actual: (c) => (Number.isFinite(c.cashRatio) ? c.cashRatio : div(c.cash, c.currentLiabilities)) }),
      ]},
      { name: "Survival", kpis: [
        K({ id: "burnRate", name: "Burn Rate", units: "R", direction: "lower", aggregate: "avg", frequency: "Monthly",
          field: { src: "liq", a: "burnRate" },
          source: "Entered manually",
          meaning: "How much cash the business consumes in a month once everything is paid.",
          measured: "=(OpeningCash - ClosingCash) / MonthsElapsed",
          actual: (c) => c.burnRate }),
        K({ id: "cashCover", name: "Cash Cover", units: "months", direction: "higher", aggregate: "avg", frequency: "Monthly",
          field: { src: "liq", a: "cashCover" },
          source: "Entered manually or calculated",
          meaning: "How many months the cash on hand would last at the current burn.",
          measured: "=CashBalance / BurnRate",
          actual: (c) => (Number.isFinite(c.cashCover) ? c.cashCover : div(c.cashBalance, c.burnRate)) }),
        K({ id: "cashflow", name: "Free Cashflow", units: "R", direction: "higher", aggregate: "sum", frequency: "Monthly",
          field: { src: "liq", a: "cashflow" },
          source: "Entered manually",
          meaning: "Cash left over after running the business and keeping the assets going.",
          measured: "=OperatingCashflow - CapitalExpenditure",
          actual: (c) => c.cashflow }),
        K({ id: "workingCapital", name: "Working Capital", units: "R", direction: "higher", aggregate: "avg", frequency: "Monthly",
          field: { src: "liq", a: "workingCapital" },
          source: "Entered manually or calculated",
          meaning: "The buffer between what you're owed and what you owe.",
          measured: "=CurrentAssets - CurrentLiabilities",
          actual: (c) => (Number.isFinite(c.workingCapital) ? c.workingCapital
            : (Number.isFinite(c.currentAssets) && Number.isFinite(c.currentLiabilities) ? c.currentAssets - c.currentLiabilities : null)) }),
        K({ id: "cashBalance", name: "Cash Balance", units: "R", direction: "higher", aggregate: "avg", frequency: "Monthly",
          field: { src: "liq", a: "cashBalance" },
          source: "Entered manually",
          meaning: "What is actually in the bank at month end.",
          measured: "=SUM(BankAccounts) + PettyCash",
          actual: (c) => (Number.isFinite(c.cashBalance) ? c.cashBalance : c.cash) }),
      ]},
      { name: "Cost Agility", kpis: [
        K({ id: "fixedVariableRatio", name: "Fixed / Variable Ratio", units: "%", direction: "lower", aggregate: "avg",
          source: "Calculated from Cost Agility",
          meaning: "How much of your cost base you cannot switch off if revenue drops.",
          measured: "=SUM(FixedCosts) / (SUM(FixedCosts) + SUM(VariableCosts)) * 100",
          actual: (c) => { const r = div(c.fixedCosts, (c.fixedCosts || 0) + (c.variableCosts || 0)); return r === null ? null : r * 100; } }),
        K({ id: "discretionaryPct", name: "Discretionary Spend", units: "%", direction: "higher", aggregate: "avg",
          source: "Calculated from Cost Agility",
          meaning: "The share of spend you could pause next month without breaking anything.",
          measured: "=SUM(DiscretionaryCosts) / SUM(TotalCosts) * 100",
          actual: (c) => { const r = div(c.discretionary, c.totalCost); return r === null ? null : r * 100; } }),
        K({ id: "lockInDuration", name: "Cost Lock-in", units: "months", direction: "lower", aggregate: "avg", frequency: "Monthly",
          field: { src: "cost", a: "lockInDuration" },
          source: "Entered manually",
          meaning: "How long you'd stay committed to your fixed costs.",
          measured: "=AVERAGE(RemainingContractMonths)",
          actual: (c) => c.lockIn }),
        K({ id: "fixedCosts", name: "Fixed Costs", units: "R", direction: "lower", aggregate: "sum", frequency: "Monthly",
          field: { src: "cost", a: "fixedCosts" },
          source: "Entered manually",
          meaning: "Costs that arrive whether you sell anything or not.",
          measured: "=SUM(FixedCosts)",
          actual: (c) => c.fixedCosts }),
        K({ id: "variableCosts", name: "Variable Costs", units: "R", direction: "lower", aggregate: "sum", frequency: "Monthly",
          field: { src: "cost", a: "variableCosts" },
          source: "Entered manually",
          meaning: "Costs that rise and fall with volume.",
          measured: "=SUM(VariableCosts)",
          actual: (c) => c.variableCosts }),
      ]},
      { name: "Daily Operations", kpis: [
        K({ id: "dailyCash", name: "Daily Cash Collected", units: "R", direction: "higher", aggregate: "sum", frequency: "Daily",
          source: "Entered daily",
          meaning: "Cash collected per day. Rolls up to monthly, quarterly and annual.",
          measured: "=SUM(DailyCollections) entered directly per day.",
          actual: () => null }),
        K({ id: "dailyTxns", name: "Daily Transaction Count", units: "#", direction: "higher", aggregate: "sum", frequency: "Daily",
          source: "Entered daily",
          meaning: "Completed transactions per day.",
          measured: "Entered directly per day.",
          actual: () => null }),
      ]},
      { name: "Weekly Operations", kpis: [
        K({ id: "weeklyProduction", name: "Weekly Production Output", units: "units", direction: "higher", aggregate: "sum", frequency: "Weekly",
          source: "Entered weekly",
          meaning: "Units produced per week. Rolls up to monthly.",
          measured: "Entered directly per week.",
          actual: () => null }),
        K({ id: "weeklyOvertime", name: "Weekly Overtime Hours", units: "hrs", direction: "lower", aggregate: "sum", frequency: "Weekly",
          source: "Entered weekly",
          meaning: "Overtime hours per week. Rolls up to monthly.",
          measured: "Entered directly per week.",
          actual: () => null }),
      ]},
    ],
  },
  {
    id: "equity-structure",
    name: "Equity Structure",
    custom: "equity",
    categories: [],
  },
  {
    id: "liquidity",
    name: "Loan Repayments",
    categories: [
      { name: "Loan Repayments", custom: "loans" },
    ],
  },
  {
    id: "balance-sheet",
    name: "Balance Sheet",
    custom: "balanceSheet",
    categories: [],
  },
];

/* ─── Status helpers ───────────────────────────────────────────────────── */
const S = {
  green: { key: "green", label: "On budget", color: T.green, bg: T.greenBg },
  amber: { key: "amber", label: "Needs attention", color: T.amber, bg: T.amberBg },
  red: { key: "red", label: "Critical", color: T.red, bg: T.redBg },
  none: { key: "none", label: "No budget", color: T.faint, bg: T.raised },
};
const statusFromPair = (kpi, budget, actual) => {
  const b = Number(budget), a = Number(actual);
  if (!Number.isFinite(b) || !Number.isFinite(a)) return S.none;
  if (kpi.direction === "match") {
    if (b === 0) return Math.abs(a) < 0.001 ? S.green : Math.abs(a) <= 1 ? S.amber : S.red;
    const drift = Math.abs(a - b) / Math.abs(b);
    return drift <= 0.02 ? S.green : drift <= 0.10 ? S.amber : S.red;
  }
  if (b === 0) {
    if (kpi.direction === "higher") return S.none;
    return a <= 0 ? S.green : S.amber;
  }
  const ratio = kpi.direction === "higher" ? a / b : b / (a || 0.0001);
  return ratio >= 0.98 ? S.green : ratio >= 0.85 ? S.amber : S.red;
};
const varianceFavourable = (kpi, v) => {
  if (v === null) return null;
  if (kpi.direction === "match") return Math.abs(v) < 0.001;
  return kpi.direction === "higher" ? v >= 0 : v <= 0;
};
const StatusIcon = ({ status, size = 22 }) => {
  const p = { size, color: status.color, strokeWidth: 2.2 };
  if (status.key === "green") return <CheckCircle2 {...p} />;
  if (status.key === "amber") return <AlertTriangle {...p} />;
  if (status.key === "red") return <XCircle {...p} />;
  return <Info {...p} />;
};

/* ─── Period resolution ─────────────────────────────────────────────────── */
const resolveMonth = (kpi, year, mi) => {
  const mKey = `M:${year}-${String(mi + 1).padStart(2, "0")}`;
  const direct = kpi.entries?.[mKey];
  if (direct && (Number.isFinite(direct.actual) || Number.isFinite(direct.budget))) return direct;

  const rows = Object.entries(kpi.entries || {})
    .filter(([k]) => k.startsWith("D:") || k.startsWith("W:"))
    .filter(([k]) => {
      const d = new Date(k.slice(2));
      return d.getFullYear() === year && d.getMonth() === mi;
    })
    .map(([, v]) => v);

  if (!rows.length) return { actual: null, budget: null };
  return {
    actual: rollUp(rows.map((r) => Number(r.actual)), kpi.aggregate),
    budget: rollUp(rows.map((r) => Number(r.budget)), kpi.aggregate),
  };
};

const periodValues = (kpi, period, fy) => {
  const now = new Date();
  const freq = kpi.frequency || "Monthly";

  if (period === "month") {
    if (freq === "Daily" || freq === "Weekly") {
      const y = now.getFullYear(), mi = now.getMonth();
      const prefix = freq === "Daily" ? "D:" : "W:";
      const rows = Object.entries(kpi.entries || {})
        .filter(([k]) => k.startsWith(prefix))
        .filter(([k]) => {
          const d = new Date(k.slice(2));
          return d.getFullYear() === y && d.getMonth() === mi;
        })
        .map(([, v]) => v);
      return {
        actual: rollUp(rows.map((r) => Number(r.actual)), kpi.aggregate),
        budget: rollUp(rows.map((r) => Number(r.budget)), kpi.aggregate),
      };
    }
    return resolveMonth(kpi, now.getFullYear(), now.getMonth());
  }

  const months = fyMonths(fy.startYear, fy.startMonth);
  const elapsed = (list) => list.filter((m) => new Date(m.year, m.month, 1) <= new Date(now.getFullYear(), now.getMonth(), 1));
  const rowsFor = (list) => list.map((m) => resolveMonth(kpi, m.year, m.month));

  if (period === "quarter") {
    const qs = fyQuarters(fy.startYear, fy.startMonth);
    const q = qs.find((qq) => qq.months.some((m) => m.year === now.getFullYear() && m.month === now.getMonth())) || qs[0];
    const r = rowsFor(elapsed(q.months));
    return { actual: rollUp(r.map((x) => Number(x.actual)), kpi.aggregate), budget: rollUp(r.map((x) => Number(x.budget)), kpi.aggregate) };
  }
  const r = rowsFor(elapsed(months));
  return { actual: rollUp(r.map((x) => Number(x.actual)), kpi.aggregate), budget: rollUp(r.map((x) => Number(x.budget)), kpi.aggregate) };
};
const getStatus = (kpi, period, fy) => { const v = periodValues(kpi, period, fy); return statusFromPair(kpi, v.budget, v.actual); };
const getVariance = (kpi, period, fy) => {
  const { budget, actual } = periodValues(kpi, period, fy);
  const b = Number(budget), a = Number(actual);
  return Number.isFinite(b) && Number.isFinite(a) ? a - b : null;
};

/* ─── Columns ───────────────────────────────────────────────────────────── */
const COLUMN_DEFS = {
  category:  { label: "Category", width: 168, tip: "The category this KPI sits under.", filter: true, sort: true, hideable: true },
  kpi:       { label: "KPI", width: 258, tip: "The metric being tracked. Click the eye to see what it means and how it is measured.", filter: true, sort: true, hideable: false },
  units:     { label: "Units", width: 90, align: "center", tip: "The unit every figure in this row is expressed in.", filter: true, sort: true, hideable: true },
  frequency: { label: "Frequency", width: 110, align: "center", tip: "How often this KPI is captured.", filter: true, sort: true, hideable: true },
  budget:    { label: "Budget", width: 132, align: "center", tip: "What you planned for the selected period.", sort: true, hideable: true },
  actual:    { label: "Actual", width: 132, align: "center", tip: "What was recorded for the selected period.", sort: true, hideable: true },
  variance:  { label: "Variance", width: 132, align: "center", tip: "Actual minus Budget. Green means favourable for this KPI's direction.", sort: true, hideable: true },
  status:    { label: "Status", width: 104, align: "center", tip: "Green: on budget. Amber: needs attention. Red: well outside budget.", filter: true, sort: true, hideable: true },
};
const COLUMN_ORDER = Object.keys(COLUMN_DEFS);
const ACTIONS_KEY = "__actions__";
const columnLines = (key, period) =>
  ["budget","actual","variance"].includes(key) ? [PERIOD_PREFIX[period], COLUMN_DEFS[key].label] : [COLUMN_DEFS[key].label];

/* ─── Shared UI ─────────────────────────────────────────────────────────── */
const InfoTip = ({ text, light = false }) => {
  const [rect, setRect] = useState(null);
  if (!text) return null;
  return (
    <span style={{ display: "inline-flex" }}
      onMouseEnter={(e) => setRect(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setRect(null)}>
      <Info size={13} strokeWidth={2} color={light ? "rgba(255,255,255,0.75)" : T.faint} style={{ cursor: "help" }} />
      {rect && typeof document !== "undefined" && createPortal(
        <div style={{ position: "fixed", top: rect.bottom + 8,
          left: Math.min(Math.max(rect.left - 110, 12), window.innerWidth - 250),
          width: "236px", background: T.ink, color: "#fff", fontSize: "12.5px",
          padding: "10px 12px", borderRadius: "8px", lineHeight: 1.5, zIndex: 3000,
          pointerEvents: "none", fontWeight: 400, letterSpacing: "normal", textTransform: "none",
          boxShadow: "0 10px 30px rgba(45,32,28,0.3)" }}>{text}</div>, document.body)}
    </span>
  );
};

const btnBase = { padding: "9px 16px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "inherit" };
const btnPrimary = { ...btnBase, background: T.accent, color: "#fff", border: `1px solid ${T.accent}`, fontWeight: 600 };
const btnGhost = { ...btnBase, background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}` };
const btnQuiet = { ...btnBase, background: "transparent", color: T.accent, border: "1px solid transparent" };
const inputS = { width: "100%", padding: "9px 11px", border: `1px solid ${T.lineStrong}`, borderRadius: "8px",
  fontSize: "13.5px", fontFamily: "inherit", boxSizing: "border-box", color: T.ink, background: T.bg, outline: "none" };
const selectS = { ...inputS, cursor: "pointer", appearance: "none", WebkitAppearance: "none", MozAppearance: "none", paddingRight: "34px" };
const labelS = { display: "block", fontSize: "12.5px", fontWeight: 600, color: T.accent, marginBottom: "5px" };
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "14px 16px" };

const Select = ({ value, onChange, children, style, disabled }) => (
  <div style={{ position: "relative", width: "100%" }}>
    <select value={value} onChange={onChange} disabled={disabled}
      style={{ ...selectS, background: disabled ? T.panel : T.bg,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, ...style }}>
      {children}
    </select>
    <ChevronDown size={15} color={T.muted}
      style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
  </div>
);

const Modal = ({ title, subtitle, icon, onClose, children, width = 640, footer }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(45,32,28,0.55)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1400, padding: "20px" }}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: T.bg, borderRadius: "14px", width: "100%",
      maxWidth: `${width}px`, maxHeight: "94vh", display: "flex", flexDirection: "column",
      boxShadow: "0 24px 60px rgba(45,32,28,0.28)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 22px 14px", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ display: "flex", gap: "11px", alignItems: "flex-start" }}>
          {icon && <span style={{ marginTop: "2px", color: T.accent }}>{icon}</span>}
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", color: T.accent, fontWeight: 600, letterSpacing: "-0.2px" }}>{title}</h3>
            {subtitle && <p style={{ margin: "3px 0 0", fontSize: "13px", color: T.body }}>{subtitle}</p>}
          </div>
        </div>
        <button onClick={onClose} style={{ background: T.raised, border: "none", cursor: "pointer", color: T.body,
          width: 30, height: 30, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={15} />
        </button>
      </div>
      <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1 }}>{children}</div>
      {footer && <div style={{ padding: "13px 22px", borderTop: `1px solid ${T.line}`, display: "flex",
        justifyContent: "flex-end", gap: "10px", alignItems: "center", background: T.panel, borderRadius: "0 0 14px 14px" }}>{footer}</div>}
    </div>
  </div>
);

const DIRECTIONS = [
  { value: "higher", label: "Higher is better" },
  { value: "lower", label: "Lower is better" },
  { value: "match", label: "Matching is better" },
];

/* ─── KPI info modal ───────────────────────────────────────────────────── */
const KpiInfoModal = ({ kpi, onClose, onSave, readOnly }) => {
  const [editing, setEditing] = useState(false);
  const [meaning, setMeaning] = useState(kpi.meaning || "");
  const [measured, setMeasured] = useState(kpi.measured || "");
  const box = (v, empty, mono) => (
    <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: "8px", padding: "13px 15px",
      fontSize: mono ? "13px" : "14px", lineHeight: 1.65, color: v ? T.body : T.faint,
      fontStyle: v ? "normal" : "italic", whiteSpace: "pre-wrap",
      fontFamily: mono && v ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit" }}>{v || empty}</div>
  );
  return (
    <Modal title={kpi.name} subtitle="What it means and how it is measured" icon={<Eye size={17} />} onClose={onClose}
      footer={editing ? (
        <>
          <button onClick={() => { setMeaning(kpi.meaning || ""); setMeasured(kpi.measured || ""); setEditing(false); }} style={btnGhost}>Cancel</button>
          <button onClick={() => { onSave({ meaning, measured }); setEditing(false); }} style={btnPrimary}><Save size={13} /> Save</button>
        </>
      ) : (
        <>
          {!readOnly && <button onClick={() => setEditing(true)} style={btnGhost}><Pencil size={13} /> Edit</button>}
          <button onClick={onClose} style={btnPrimary}>Close</button>
        </>
      )}>
      <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "18px" }}>
        {[`Units: ${kpi.units}`, `Capture: ${kpi.frequency || "Monthly"}`, kpi.field ? "Entered directly" : "Calculated",
          DIRECTIONS.find((d) => d.value === kpi.direction)?.label,
          kpi.aggregate === "avg" ? "AVERAGE across periods" : "SUM across periods",
          kpi.source ? `Source: ${kpi.source}` : null,
        ].filter(Boolean).map((c) => (
          <span key={c} style={{ fontSize: "12px", padding: "4px 11px", borderRadius: "999px", background: T.raised, color: T.body }}>{c}</span>
        ))}
      </div>
      <div style={{ marginBottom: "18px" }}>
        <label style={labelS}>What does this KPI mean?</label>
        {editing ? <textarea rows="3" value={meaning} onChange={(e) => setMeaning(e.target.value)} style={{ ...inputS, resize: "vertical" }} />
          : box(meaning, "Not captured yet.", false)}
      </div>
      <div>
        <label style={{ ...labelS, display: "flex", alignItems: "center", gap: "6px" }}><Sigma size={13} /> How is this KPI measured?</label>
        {editing ? <textarea rows="6" value={measured} onChange={(e) => setMeasured(e.target.value)}
            style={{ ...inputS, resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "13px" }} />
          : box(measured, "Not captured yet.", true)}
      </div>
    </Modal>
  );
};

/* ─── Analysis ─────────────────────────────────────────────────────────── */
const localAnalysis = (kpi, period, v, fy) => {
  const status = statusFromPair(kpi, v.budget, v.actual);
  const variance = Number.isFinite(Number(v.budget)) && Number.isFinite(Number(v.actual)) ? Number(v.actual) - Number(v.budget) : null;
  const fav = varianceFavourable(kpi, variance);
  return {
    observations: [
      `${PERIOD_LABEL[period]} actual sits at ${fmtValue(v.actual, kpi)}${v.budget === null ? " with no budget captured." : ` against a budget of ${fmtValue(v.budget, kpi)}.`}`,
      variance === null ? "Variance cannot be computed until a budget exists for this period."
        : `That is a ${fav ? "favourable" : "unfavourable"} variance of ${fmtValue(Math.abs(variance), kpi)}.`,
      kpi.field ? "Entered directly, so the figure is only as good as the capture." : "Calculated from other figures — check the inputs before questioning the result.",
      `Financial year starts in ${MONTHS[fy.startMonth]}.`,
    ],
    trends: status.key === "green"
      ? ["Holding inside tolerance, which points to a stable underlying position.",
         "Watch the month-to-month spread rather than the headline."]
      : status.key === "amber"
        ? ["Drifted outside tolerance but not far — this reads as drift rather than a break.",
           "Two or three more months at this level would move it into critical territory."]
        : status.key === "red"
          ? ["The gap is wide enough that a single-month correction is unlikely to close it.",
             "Treat the trend as broken until two consecutive months recover."]
          : ["No budget captured for this period, so there is nothing to measure the actual against."],
    issues: status.key === "green" ? ["No material issue at this timeframe."]
      : status.key === "none" ? ["Capture a budget for this KPI so performance can be judged rather than just reported."]
      : [`Budget is not being met${variance === null ? "" : ` — off by ${fmtValue(Math.abs(variance), kpi)}`}.`,
         status.key === "red" ? "Severity warrants a named owner and a dated action." : "Unattended, this compounds quietly across periods."],
    opportunities: status.key === "green"
      ? ["Consider tightening the budget — the current one may no longer be stretching.",
         "Document what is working and apply it to the weaker KPIs in this category."]
      : ["Raise an action against this KPI so it carries into the next governance meeting.",
         kpi.direction === "higher" ? "Find the largest single constraint and remove it before adding anything."
           : "Trace the biggest contributors to this number and address the largest one first."],
  };
};

const summaryAnalysis = (kpi, fy) => {
  const rows = PERIODS.map((p) => {
    const v = periodValues(kpi, p.key, fy);
    return { key: p.key, label: p.label, v, status: statusFromPair(kpi, v.budget, v.actual),
      variance: Number.isFinite(Number(v.budget)) && Number.isFinite(Number(v.actual)) ? Number(v.actual) - Number(v.budget) : null };
  });
  const withData = rows.filter((r) => r.status.key !== "none");
  const reds = withData.filter((r) => r.status.key === "red");
  const greens = withData.filter((r) => r.status.key === "green");
  const mth = rows.find((r) => r.key === "month"), yr = rows.find((r) => r.key === "year");
  return {
    observations: [
      ...rows.map((r) => `${r.label}: ${fmtValue(r.v.actual, kpi)}${r.v.budget === null ? " (no budget)" : ` against ${fmtValue(r.v.budget, kpi)} — ${r.status.label.toLowerCase()}`}.`),
      `${withData.length} of ${rows.length} timeframes have both an actual and a budget.`,
    ],
    trends: withData.length < 2 ? ["Not enough timeframes with a budget to compare the short term against the long."]
      : [ mth?.status.key !== "none" && yr?.status.key !== "none" && mth.status.key !== yr.status.key
            ? `The month and the year disagree — ${mth.status.label.toLowerCase()} this month against ${yr.status.label.toLowerCase()} for the year, so treat one as the outlier.`
            : "Short and long timeframes tell the same story, which makes the signal more trustworthy.",
          greens.length === withData.length ? "Every timeframe is inside tolerance."
            : reds.length === withData.length ? "Every timeframe is critical — this is structural, not a bad month."
            : "The picture is mixed; the shorter timeframe moves first, so watch it for the turn." ],
    issues: reds.length === 0 && withData.every((r) => r.status.key === "green") ? ["No timeframe is outside tolerance."]
      : [...reds.map((r) => `${r.label} is critical${r.variance === null ? "" : ` — off by ${fmtValue(Math.abs(r.variance), kpi)}`}.`),
         ...withData.filter((r) => r.status.key === "amber").map((r) => `${r.label} needs attention.`)],
    opportunities: reds.length > 0
      ? ["Raise a dated action — more than one timeframe shows the same gap.",
         "Check whether the budget is still realistic before chasing the actual."]
      : ["Focus on the timeframe drifting first; the others usually follow.",
         "Keep the budget under review as conditions change."],
  };
};

const AnalysisBody = ({ kpi, period, fy, scope = "period", compact = false }) => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [source, setSource] = useState("ai");
  const [reason, setReason] = useState("");

  const build = useCallback(() => {
    setLoading(true);
    const v = periodValues(kpi, period, fy);
    (async () => {
      try {
        const callable = httpsCallable(functions, "generateKpiAnalysis");
        const res = await callable({
          module: "Financial Performance",
          kpiName: kpi.name, meaning: kpi.meaning, measured: kpi.measured,
          units: kpi.units, direction: kpi.direction, scope,
          timeframe: scope === "summary" ? "All timeframes" : PERIOD_LABEL[period],
          financialYearStartMonth: fy.startMonth,
          budget: v.budget, actual: v.actual, variance: getVariance(kpi, period, fy),
          status: getStatus(kpi, period, fy).label, notes: kpi.notes || "", entries: kpi.entries || {},
        });
        const d = res?.data;
        if (d?.observations && d?.opportunities) {
          setAnalysis({ observations: d.observations || [], trends: d.trends || [], issues: d.issues || [], opportunities: d.opportunities || [] });
          setSource("ai"); return;
        }
        throw new Error("The function replied, but not in the expected shape.");
      } catch (err) {
        console.error("AI analysis unavailable:", err);
        setReason(err?.code === "functions/not-found" ? "The generateKpiAnalysis function isn't deployed yet." : errText(err));
        setSource("local");
        setAnalysis(scope === "summary" ? summaryAnalysis(kpi, fy) : localAnalysis(kpi, period, v, fy));
      } finally { setLoading(false); }
    })();
  }, [kpi, period, fy, scope]);

  useEffect(() => { build(); }, [build]);

  const Section = ({ label, items, color }) => (
    <div style={{ marginBottom: compact ? "12px" : "18px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.7px", textTransform: "uppercase", color, marginBottom: "6px" }}>{label}</div>
      <ul style={{ margin: 0, paddingLeft: "18px", color: T.body, fontSize: compact ? "13px" : "14px", lineHeight: 1.65 }}>
        {items.map((it, i) => <li key={i} style={{ marginBottom: "3px" }}>{it}</li>)}
      </ul>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
        <span style={{ fontSize: "12px", color: source === "ai" ? T.muted : T.amber, display: "flex", alignItems: "flex-start", gap: "6px", lineHeight: 1.5 }}>
          <Info size={12} style={{ marginTop: "2px", flexShrink: 0 }} />
          {loading ? "Reviewing…" : source === "ai" ? `Generated from your data · ${scope === "summary" ? "all timeframes" : PERIOD_LABEL[period]}`
            : <span>Rules-based summary built from your figures. <span style={{ color: T.faint }}>{reason}</span></span>}
        </span>
        <button onClick={build} disabled={loading} style={{ ...btnQuiet, padding: "3px 9px", fontSize: "12.5px", opacity: loading ? 0.5 : 1 }}>
          <RefreshCw size={12} /> Regenerate
        </button>
      </div>
      {loading ? <div style={{ padding: "22px 0", color: T.muted, fontSize: "13.5px", textAlign: "center" }}>Reviewing {kpi.name}…</div>
        : analysis && (
        <>
          <Section label="Observations" items={[...(analysis.observations || []), ...(analysis.trends || [])]} color={T.accent} />
          <Section label="Issues" items={analysis.issues} color={T.red} />
          <Section label="Opportunities" items={analysis.opportunities} color={T.green} />
        </>
      )}
    </div>
  );
};

const AnalysisModal = ({ kpi, period, fy, onClose }) => (
  <Modal title="Observations and Opportunities" subtitle={`${kpi.name} · across all timeframes`}
    icon={<Lightbulb size={17} />} onClose={onClose} width={700}
    footer={<button onClick={onClose} style={btnPrimary}>Close</button>}>
    <AnalysisBody kpi={kpi} period={period} fy={fy} scope="summary" />
  </Modal>
);

/* ─── Trend chart ─────────────────────────────────────────────────────── */
const CHART_VERSION = 3;
const DEFAULT_CHART = {
  v: CHART_VERSION,
  actualType: "bar", budgetType: "scatter", varianceType: "scatter",
  actualColor: "#1e40af", budgetColor: "#4a352f", axisMode: "x",
};
const CHART_TYPES = [
  { value: "bar", label: "Column Chart" }, { value: "line", label: "Line Chart" },
  { value: "area", label: "Area Chart" }, { value: "scatter", label: "Scatter Chart" },
];
const SWATCHES = ["#1e40af", "#4a352f", "#166534", "#991b1b", "#92400e", "#6d28d9", "#0e7490", "#be185d"];

const TrendChartModal = ({ kpi, period, fy, onClose, onSaveNote, onSaveChart, readOnly }) => {
  const [noteText, setNoteText] = useState("");
  const [noteState, setNoteState] = useState("idle");
  const [showCustomise, setShowCustomise] = useState(false);
  const noteTimer = useRef(null);
  const prefs = kpi.chart?.v === CHART_VERSION ? { ...DEFAULT_CHART, ...kpi.chart } : { ...DEFAULT_CHART };

  const { labels, actual, budget, noteKey, caption } = useMemo(() => {
    if (period === "quarter") {
      const qs = fyQuarters(fy.startYear, fy.startMonth);
      const rows = qs.map((q) => {
        const ms = q.months.map((m) => resolveMonth(kpi, m.year, m.month));
        return { actual: rollUp(ms.map((r) => Number(r.actual)), kpi.aggregate),
                 budget: rollUp(ms.map((r) => Number(r.budget)), kpi.aggregate) };
      });
      return { labels: qs.map((q) => `${q.label} ${fyLabel(fy.startYear, fy.startMonth)}`),
        actual: rows.map((r) => r.actual), budget: rows.map((r) => r.budget),
        noteKey: `Q:${fy.startYear}`, caption: `Quarters of FY ${fyLabel(fy.startYear, fy.startMonth)}` };
    }
    const months = fyMonths(fy.startYear, fy.startMonth);
    const rows = months.map((m) => resolveMonth(kpi, m.year, m.month));
    return { labels: months.map((m) => m.label),
      actual: rows.map((r) => parseNum(r.actual)), budget: rows.map((r) => parseNum(r.budget)),
      noteKey: currentMonthKey(), caption: `FY ${fyLabel(fy.startYear, fy.startMonth)} · ${months[0].long} → ${months[11].long}` };
  }, [kpi, period, fy]);

  const variance = actual.map((a, i) => (Number.isFinite(a) && Number.isFinite(budget[i]) ? a - budget[i] : null));

  useEffect(() => { setNoteText(kpi.periodNotes?.[noteKey] || ""); setNoteState("idle"); }, [noteKey, kpi.id]);

  const onNoteChange = (text) => {
    setNoteText(text); setNoteState("saving");
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      onSaveNote(noteKey, text); setNoteState("saved");
      setTimeout(() => setNoteState("idle"), 1800);
    }, 700);
  };
  useEffect(() => () => { if (noteTimer.current) clearTimeout(noteTimer.current); }, []);

  const setPref = (patch) => onSaveChart({ ...prefs, ...patch, v: CHART_VERSION });
  const varColors = variance.map((v) => v === null ? "rgba(138,122,116,0.4)" : varianceFavourable(kpi, v) ? T.green : T.red);

  const buildSeries = (type, data, color, extra = {}) => {
    if (type === "scatter") {
      return { type: "scatter", data, showLine: false, pointStyle: "circle", pointRadius: 6, pointHoverRadius: 9,
        pointBackgroundColor: Array.isArray(color) ? color.map((c) => `${c}22`) : "#ffffff",
        pointBorderColor: color, pointBorderWidth: 2.4, ...extra };
    }
    if (type === "line" || type === "area") {
      return { type: "line", data, borderColor: color, backgroundColor: type === "area" ? `${color}22` : "transparent",
        borderWidth: 2.5, fill: type === "area", tension: 0.25, spanGaps: true,
        pointRadius: 5, pointHoverRadius: 7, pointStyle: "circle",
        pointBackgroundColor: "#ffffff", pointBorderColor: color, pointBorderWidth: 2.2, ...extra };
    }
    return { type: "bar", data, backgroundColor: Array.isArray(color) ? color.map((c) => `${c}b3`) : `${color}b3`,
      borderWidth: 0, borderRadius: 4, barPercentage: 0.6, categoryPercentage: 0.78, ...extra };
  };

  const varianceData = { labels, datasets: [
    { label: "Variance", ...buildSeries(prefs.varianceType, variance, varColors) }] };
  const varianceOptions = {
    responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
    layout: { padding: { top: 10, bottom: 0 } },
    plugins: {
      legend: { display: false }, datalabels: { display: false },
      tooltip: { backgroundColor: T.ink, padding: 10, cornerRadius: 8,
        callbacks: { title: (items) => labels[items[0].dataIndex],
          label: (c) => c.parsed.y === null || c.parsed.y === undefined ? "Variance: no data"
            : `Variance: ${fmtValue(c.parsed.y, kpi, { signed: true })} (${varianceFavourable(kpi, c.parsed.y) ? "favourable" : "unfavourable"})` } } },
    scales: { y: { display: false, grid: { display: false } },
      x: { display: false, grid: { display: false }, offset: prefs.varianceType === "bar" } },
  };

  const mainData = { labels, datasets: [
    { label: "Budget", ...buildSeries(prefs.budgetType, budget, prefs.budgetColor), order: 1 },
    { label: "Actual", ...buildSeries(prefs.actualType, actual, prefs.actualColor), order: 2 }] };
  const mainOptions = {
    responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
    layout: { padding: { top: 10 } },
    plugins: { legend: { display: false }, datalabels: { display: false },
      tooltip: { backgroundColor: T.ink, padding: 11, cornerRadius: 8,
        callbacks: { label: (c) => c.parsed.y === null || c.parsed.y === undefined ? `${c.dataset.label}: no data`
          : `${c.dataset.label}: ${fmtValue(c.parsed.y, kpi)}` } } },
    scales: {
      y: { display: prefs.axisMode === "y" || prefs.axisMode === "both", grid: { display: prefs.axisMode === "y" || prefs.axisMode === "both", color: T.lineSoft },
        ticks: { color: T.body, font: { size: 11 }, callback: (v) => fmtValue(v, kpi, { bare: true }) } },
      x: { display: prefs.axisMode === "x" || prefs.axisMode === "both", grid: { display: false },
        ticks: { color: T.body, font: { size: 11 }, maxRotation: 45, minRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
    },
  };

  const avgBudget = mean(budget), avgActual = mean(actual), avgVar = mean(variance);
  const onBudget = variance.filter((v) => v !== null && varianceFavourable(kpi, v)).length;
  const counted = variance.filter((v) => v !== null).length;

  const stat = (label, value, color) => (
    <div key={label} style={{ ...cardS, padding: "11px 14px", flex: "1 1 150px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: T.muted }}>{label}</div>
      <div style={{ fontSize: "18px", fontWeight: 700, color: color || T.ink, marginTop: "3px", fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
  const dot = (color, filled) => (<span style={{ width: 11, height: 11, borderRadius: "50%", border: `2.4px solid ${color}`, background: filled ? color : "#ffffff", display: "inline-block" }} />);
  const barChip = (color) => (<span style={{ width: 11, height: 11, borderRadius: "3px", background: `${color}b3`, display: "inline-block" }} />);
  const key = (label, swatch) => (<span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: T.body }}>{swatch}{label}</span>);

  return (
    <Modal title={`${kpi.name} — (${kpi.units})`} subtitle={caption} icon={<LineChartIcon size={17} />} onClose={onClose} width={960}
      footer={<button onClick={onClose} style={btnPrimary}>Close</button>}>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
        <button onClick={() => setShowCustomise((v) => !v)} style={btnGhost}><Palette size={13} /> Customise chart</button>
      </div>

      {showCustomise && (
        <div style={{ ...cardS, marginBottom: "14px", background: T.panel }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
            {[["actualType","Actual as"],["budgetType","Budget as"],["varianceType","Variance as"]].map(([k, l]) => (
              <div key={k}>
                <label style={labelS}>{l}</label>
                <Select value={prefs[k]} onChange={(e) => setPref({ [k]: e.target.value })}>
                  {CHART_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </div>
            ))}
            <div>
              <label style={labelS}>Axis</label>
              <Select value={prefs.axisMode} onChange={(e) => setPref({ axisMode: e.target.value })}>
                <option value="y">Show Y-Axis</option>
                <option value="x">Show X-Axis</option>
                <option value="both">Show Both</option>
              </Select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "22px", flexWrap: "wrap", marginTop: "12px" }}>
            {[{ k: "actualColor", l: "Actual colour" }, { k: "budgetColor", l: "Budget colour" }].map((c) => (
              <div key={c.k}>
                <label style={labelS}>{c.l}</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  {SWATCHES.map((s) => (
                    <button key={s} onClick={() => setPref({ [c.k]: s })} title={s}
                      style={{ width: 22, height: 22, borderRadius: "6px", background: s, cursor: "pointer",
                        border: prefs[c.k] === s ? `2px solid ${T.ink}` : `1px solid ${T.line}`,
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {prefs[c.k] === s && <Check size={12} color="#fff" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ ...cardS, marginBottom: "14px", paddingTop: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "2px" }}>
          <span style={{ fontSize: "12.5px", fontWeight: 700, color: T.accent }}>Budget vs Actual</span>
          <span style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {key("Variance", <span style={{ display: "inline-flex", gap: "3px" }}>{dot(T.green)}{dot(T.red)}</span>)}
            {key("Budget", prefs.budgetType === "bar" ? barChip(prefs.budgetColor) : dot(prefs.budgetColor))}
            {key("Actual", prefs.actualType === "bar" ? barChip(prefs.actualColor) : dot(prefs.actualColor, true))}
          </span>
        </div>
        <div style={{ height: "112px", marginBottom: "-16px" }}>
          <Chart type="bar" data={varianceData} options={varianceOptions} />
        </div>
        <div style={{ height: "300px" }}>
          <Chart type="bar" data={mainData} options={mainOptions} />
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
        {stat("Average budget", fmtValue(avgBudget, kpi))}
        {stat("Average actual", fmtValue(avgActual, kpi))}
        {stat("Average variance", fmtValue(avgVar, kpi, { signed: true }), avgVar === null ? T.ink : varianceFavourable(kpi, avgVar) ? T.green : T.red)}
        {stat("Periods on budget", counted ? `${onBudget} of ${counted}` : "—")}
      </div>

      <div style={{ ...cardS, marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ ...labelS, marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
            <StickyNote size={13} /> Notes
          </span>
          <span style={{ fontSize: "11.5px", color: noteState === "saved" ? T.green : T.muted }}>
            {noteState === "saving" ? "Saving…" : noteState === "saved" ? "Saved" : "Saves automatically"}
          </span>
        </div>
        <textarea rows="3" value={noteText} readOnly={readOnly} onChange={(e) => onNoteChange(e.target.value)}
          placeholder="e.g. Revenue dipped in March because two large invoices slipped into April."
          style={{ ...inputS, resize: "vertical" }} />
      </div>

      <div style={cardS}>
        <div style={{ ...labelS, display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
          <Lightbulb size={13} /> Observations and Opportunities — {PERIOD_LABEL[period].toLowerCase()}
        </div>
        <AnalysisBody kpi={kpi} period={period} fy={fy} scope="period" compact />
      </div>
    </Modal>
  );
};

/* ─── Add Action ───────────────────────────────────────────────────────── */
const AddActionModal = ({ kpi, period, fy, categoryName, tabName, userId, onClose, onSaved }) => {
  const [meetings, setMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [meetingId, setMeetingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const status = getStatus(kpi, period, fy);
  const variance = getVariance(kpi, period, fy);
  const v = periodValues(kpi, period, fy);

  const [form, setForm] = useState({
    title: status.key === "green" ? `Sustain performance on ${kpi.name}` : `Close the gap on ${kpi.name}`,
    description: `${PERIOD_LABEL[period]} actual ${fmtValue(v.actual, kpi)} against budget ${fmtValue(v.budget, kpi)}${variance === null ? "" : ` (variance ${fmtValue(variance, kpi, { signed: true })})`}. Raised from ${tabName} · ${categoryName}.`,
    category: "Financial Performance", assignedTo: "", dueDate: "", status: "In Progress",
  });

  const meetingDate = (m) => {
    const dates = (m.instances || []).map((i) => new Date(i.date)).filter((d) => !Number.isNaN(d.getTime())).sort((a, b) => a - b);
    if (!dates.length) return null;
    const now = new Date();
    return (dates.find((d) => d >= now) || dates[dates.length - 1]).toISOString();
  };
  const selected = meetings.find((m) => m.id === meetingId) || null;

  const applyDefaults = (id, prev, force = false) => {
    const m = meetings.find((x) => x.id === id);
    if (!m) return prev;
    const d = meetingDate(m);
    const names = (m.participants || []).map((p) => (typeof p === "string" ? p : p.name || p.email || ""));
    return { ...prev,
      category: force || !prev.dueDate ? (m.category || m.department || "Financial Performance") : prev.category,
      dueDate: force || !prev.dueDate ? (d ? new Date(d).toISOString().split("T")[0] : "") : prev.dueDate,
      assignedTo: names.includes(prev.assignedTo) ? prev.assignedTo : "" };
  };

  useEffect(() => {
    (async () => {
      if (!userId) { setLoadingMeetings(false); return; }
      try {
        const snap = await getDoc(doc(db, "governanceCalendar", userId));
        const list = snap.exists() ? snap.data().meetings || [] : [];
        setMeetings(list);
        const dated = list.map((m) => ({ m, d: meetingDate(m) })).filter((x) => x.d);
        const now = new Date();
        const up = dated.filter((x) => new Date(x.d) >= now).sort((a, b) => new Date(a.d) - new Date(b.d))[0];
        const latest = dated.sort((a, b) => new Date(b.d) - new Date(a.d))[0];
        setMeetingId(up?.m.id || latest?.m.id || list[0]?.id || "");
      } catch (err) {
        console.error("Failed to load meetings:", err);
        setMessage(`Could not load your meetings: ${errText(err)}`);
      } finally { setLoadingMeetings(false); }
    })();
  }, [userId]);

  useEffect(() => { if (meetingId) setForm((p) => applyDefaults(meetingId, p, true)); }, [meetingId, meetings.length]);

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true); setMessage("");
    try {
      const snap = await getDoc(doc(db, "governanceCalendar", userId));
      let list = snap.exists() ? snap.data().meetings || [] : [];
      const action = {
        id: uid(), title: form.title.trim(), description: form.description.trim(),
        category: form.category, assignedTo: form.assignedTo.trim(), dueDate: form.dueDate,
        status: form.status, archived: false,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), revisedDate: null,
        sourceModule: "Financial Performance", sourceKpi: kpi.name, sourceCategory: `${tabName} · ${categoryName}`,
      };
      let targetId = meetingId;
      if (!targetId) {
        const meta = RAPS_CATEGORIES.find((c) => c.name === "Financial Performance");
        const holder = {
          id: uid(), title: "Financial Performance Actions",
          category: "Financial Performance", department: "Financial Performance",
          categoryColor: meta.color, categoryBg: "#FFF3E0", departmentColor: meta.color, departmentBg: "#FFF3E0",
          departments: [], purpose: "Actions raised from Financial Performance.",
          agenda: "", preparations: "", participants: [], isRecurring: false, recurrencePattern: null,
          instances: [{ instanceId: uid(), date: new Date().toISOString(), time: "09:00", status: "scheduled" }],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          highlights: "", lowlights: "", opportunities: "", priorities: "", actions: [],
        };
        list = [...list, holder]; targetId = holder.id;
      }
      const updated = list.map((m) => m.id === targetId
        ? { ...m, actions: [...(m.actions || []), { ...action, meetingId: m.id }], updatedAt: new Date().toISOString() } : m);
      await setDoc(doc(db, "governanceCalendar", userId), { meetings: updated, updatedAt: new Date().toISOString(), userId }, { merge: true });
      onSaved(updated.find((m) => m.id === targetId)?.title || "your calendar");
      onClose();
    } catch (err) {
      console.error("Failed to save action:", err);
      setMessage(`Could not save the action: ${errText(err)}`);
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Add Action" subtitle={`${kpi.name} · ${PERIOD_LABEL[period]}`} icon={<Plus size={17} />} onClose={onClose} width={640}
      footer={
        <>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={save} disabled={saving || !form.title.trim()} style={{ ...btnPrimary, opacity: saving || !form.title.trim() ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Action"}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px",
        background: status.bg, border: `1px solid ${status.color}33`, marginBottom: "16px" }}>
        <StatusIcon status={status} size={20} />
        <div style={{ fontSize: "14px", color: T.body }}>
          <strong style={{ color: T.accent }}>{kpi.name}</strong> is {status.label.toLowerCase()} for {PERIOD_LABEL[period].toLowerCase()}.
        </div>
      </div>
      <div style={{ marginBottom: "14px" }}>
        <label style={labelS}>Action *</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputS} />
      </div>
      <div style={{ marginBottom: "14px" }}>
        <label style={labelS}>Description</label>
        <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputS, resize: "vertical" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
        <div>
          <label style={labelS}>Attach to meeting</label>
          {loadingMeetings ? <div style={{ fontSize: "13px", color: T.body }}>Loading...</div>
            : meetings.length === 0 ? (
              <div style={{ fontSize: "12.5px", color: T.body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: "8px", padding: "9px 11px" }}>
                No meetings yet — filed under "Financial Performance Actions".
              </div>
            ) : (
              <Select value={meetingId} onChange={(e) => { setMeetingId(e.target.value); setForm((p) => applyDefaults(e.target.value, p)); }}>
                {meetings.map((m) => { const d = meetingDate(m);
                  return <option key={m.id} value={m.id}>{m.title}{d ? ` — ${fmtDMY(d)}` : ""}</option>; })}
              </Select>
            )}
        </div>
        <div>
          <label style={labelS}>Category</label>
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {RAPS_CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </Select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <div><label style={labelS}>By whom</label>
          {(selected?.participants || []).length > 0 ? (
            <Select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
              <option value="">Unassigned</option>
              {selected.participants.map((p, i) => { const n = typeof p === "string" ? p : p.name || p.email || "Participant"; return <option key={i} value={n}>{n}</option>; })}
            </Select>
          ) : <input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} style={inputS} placeholder="Owner" />}
        </div>
        <div><label style={labelS}>By when</label>
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={inputS} /></div>
        <div><label style={labelS}>Status</label>
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {ACTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select></div>
      </div>
      {message && <div style={{ color: T.red, fontSize: "13px", marginTop: "12px" }}>{message}</div>}
    </Modal>
  );
};

/* ─── KPI notes ────────────────────────────────────────────────────────── */
const NotesModal = ({ kpi, onClose, onSave, readOnly }) => {
  const [notes, setNotes] = useState(kpi.notes || "");
  const [state, setState] = useState("idle");
  const timer = useRef(null);
  const change = (t) => {
    setNotes(t); setState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { onSave(t); setState("saved"); setTimeout(() => setState("idle"), 1800); }, 700);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return (
    <Modal title={`Notes — ${kpi.name}`} icon={<StickyNote size={17} />} onClose={onClose}
      footer={
        <>
          <span style={{ flex: 1, fontSize: "12.5px", color: state === "saved" ? T.green : T.muted, textAlign: "left" }}>
            {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Saves automatically"}
          </span>
          <button onClick={onClose} style={btnPrimary}>Close</button>
        </>
      }
    >
      <label style={labelS}>Context, anomalies or anything worth remembering about this KPI</label>
      <textarea rows="9" value={notes} readOnly={readOnly} onChange={(e) => change(e.target.value)} style={{ ...inputS, resize: "vertical" }} />
    </Modal>
  );
};

/* ─── Enhanced table hook ─────────────────────────────────────────────── */
function useEnhancedTable(initialCols, dataRows) {
  const [colOrder, setColOrder] = useState(initialCols.map(c => c.key));
  const [widths, setWidths] = useState(() => Object.fromEntries(initialCols.map(c => [c.key, c.width || 140])));
  const [filters, setFilters] = useState(() => Object.fromEntries(initialCols.map(c => [c.key, ""])));
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });

  const handleDragStart = (e, key) => {
    e.dataTransfer.setData("text/plain", key);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = (e, targetKey) => {
    e.preventDefault();
    const sourceKey = e.dataTransfer.getData("text/plain");
    if (!sourceKey || sourceKey === targetKey) return;
    const srcIdx = colOrder.indexOf(sourceKey);
    const tgtIdx = colOrder.indexOf(targetKey);
    if (srcIdx === -1 || tgtIdx === -1) return;
    const newOrder = [...colOrder];
    newOrder.splice(srcIdx, 1);
    newOrder.splice(tgtIdx, 0, sourceKey);
    setColOrder(newOrder);
  };

  const startResize = (e, key) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = widths[key];
    const onMove = (ev) => setWidths(p => ({ ...p, [key]: Math.max(80, startW + (ev.clientX - startX)) }));
    const onUp = () => { document.body.style.cursor = ""; document.body.style.userSelect = ""; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };

  const getFilterOptions = (key) => {
    const vals = dataRows.map(row => String(row[key] || "").trim()).filter(v => v !== "");
    return ["All", ...Array.from(new Set(vals)).sort()];
  };

  const filteredData = useMemo(() => dataRows.filter(row => colOrder.every(key => {
    const filterVal = filters[key] || "";
    if (!filterVal || filterVal === "All") return true;
    return String(row[key] || "").trim() === filterVal;
  })), [dataRows, filters, colOrder]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a,b) => {
      const av = a[sortConfig.key] ?? "";
      const bv = b[sortConfig.key] ?? "";
      if (typeof av === "number" && typeof bv === "number") return sortConfig.dir === "asc" ? av - bv : bv - av;
      return sortConfig.dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [filteredData, sortConfig]);

  return { colOrder, widths, filters, sortConfig, setFilters, setSortConfig, startResize,
    handleDragStart, handleDragOver, handleDrop, getFilterOptions, sortedData };
}

/* ─── Filter dropdown ──────────────────────────────────────────────────── */
const FilterDropdown = ({ options, value, onChange, onClose }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); onClose?.(); } };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button onClick={() => setOpen(!open)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: value && value !== "All" ? "#fff" : "rgba(255,255,255,0.5)", display: "inline-flex", alignItems: "center" }}>
        <SlidersHorizontal size={13} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "4px", background: T.bg, border: `1px solid ${T.lineStrong}`, borderRadius: "8px", boxShadow: "0 8px 20px rgba(0,0,0,0.15)", zIndex: 100, minWidth: "150px", maxHeight: "200px", overflowY: "auto" }}>
          {options.map((opt) => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); onClose?.(); }}
              style={{ padding: "8px 14px", cursor: "pointer", fontSize: "13px", color: T.body, background: value === opt ? T.accentTint : "transparent", borderBottom: `1px solid ${T.lineSoft}` }}>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Equity Structure — Dividend History (with Add)
   ════════════════════════════════════════════════════════════════════════ */
const DividendHistory = ({ dividends, readOnly, onSave }) => {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [addingNew, setAddingNew] = useState(false);
  const [newDraft, setNewDraft] = useState({ year: new Date().getFullYear(), amountPerShare: "", totalShares: "", paymentDate: "", notes: "" });

  const cols = [
    { key: "year", label: "Year", tip: "The calendar year.", width: 90 },
    { key: "amountPerShare", label: "Amount per Share", tip: "Dividend per share.", width: 140 },
    { key: "totalShares", label: "Total Shares", tip: "Shares outstanding.", width: 130 },
    { key: "totalIssued", label: "Total Issued", tip: "Shares × Amount.", width: 130 },
    { key: "paymentDate", label: "Payment Date", tip: "When paid.", width: 130 },
    { key: "notes", label: "Notes", tip: "Optional notes.", width: 160 },
  ];
  const rows = dividends.map((d, idx) => ({
    __idx: idx, __raw: d,
    year: d.year, amountPerShare: d.amountPerShare ?? 0, totalShares: d.totalShares ?? 0,
    totalIssued: d.totalIssued ?? 0, paymentDate: d.paymentDate || "", notes: d.notes || "",
  }));
  const { colOrder, widths, filters, setFilters, sortConfig, setSortConfig, startResize, handleDragStart, handleDragOver, handleDrop, getFilterOptions, sortedData } = useEnhancedTable(cols, rows);
  const iconBtn = (c) => ({ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px", color: c, display: "inline-flex", alignItems: "center" });

  const startEdit = (row) => {
    setEditingIdx(row.__idx);
    setEditDraft({
      year: row.__raw.year ?? "",
      amountPerShare: row.__raw.amountPerShare ?? 0,
      totalShares: row.__raw.totalShares ?? 0,
      paymentDate: row.__raw.paymentDate || "",
      notes: row.__raw.notes || "",
    });
  };
  const cancelEdit = () => { setEditingIdx(null); setEditDraft({}); };
  const saveEdit = () => {
    if (!onSave) { cancelEdit(); return; }
    const next = dividends.map((d, i) => i === editingIdx ? {
      ...d,
      year: Number(editDraft.year) || 0,
      amountPerShare: Number(editDraft.amountPerShare) || 0,
      totalShares: Number(editDraft.totalShares) || 0,
      totalIssued: (Number(editDraft.amountPerShare) || 0) * (Number(editDraft.totalShares) || 0),
      paymentDate: editDraft.paymentDate || "",
      notes: editDraft.notes || "",
    } : d);
    onSave(next);
    cancelEdit();
  };
  const deleteRow = (row) => {
    if (!window.confirm("Remove this dividend record?")) return;
    if (!onSave) return;
    onSave(dividends.filter((_, i) => i !== row.__idx));
  };
  const addNew = () => {
    if (!onSave) return;
    if (!newDraft.year && newDraft.year !== 0) return;
    const amount = Number(newDraft.amountPerShare) || 0;
    const shares = Number(newDraft.totalShares) || 0;
    const next = [...dividends, {
      id: uid(),
      year: Number(newDraft.year) || 0,
      amountPerShare: amount,
      totalShares: shares,
      totalIssued: amount * shares,
      paymentDate: newDraft.paymentDate || "",
      notes: newDraft.notes || "",
    }];
    onSave(next);
    setNewDraft({ year: new Date().getFullYear(), amountPerShare: "", totalShares: "", paymentDate: "", notes: "" });
    setAddingNew(false);
  };

  return (
    <div style={{ backgroundColor: T.bg, border: `1px solid ${T.line}`, padding: "20px", margin: "20px 0", borderRadius: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <h3 style={{ color: T.accent, margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>Dividend History</h3>
        {!readOnly && (
          <button onClick={() => setAddingNew(true)} style={{ ...btnGhost, padding: "5px 10px", fontSize: "12px" }}>
            <Plus size={12} /> Add dividend
          </button>
        )}
      </div>

      {addingNew && (
        <div style={{ ...cardS, background: T.panel, marginBottom: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 2fr", gap: "10px", marginBottom: "10px" }}>
            <div><label style={labelS}>Year *</label>
              <input type="number" value={newDraft.year} onChange={(e) => setNewDraft({ ...newDraft, year: e.target.value })} style={inputS} /></div>
            <div><label style={labelS}>Amount/share</label>
              <input type="number" step="0.01" value={newDraft.amountPerShare} onChange={(e) => setNewDraft({ ...newDraft, amountPerShare: e.target.value })} style={inputS} /></div>
            <div><label style={labelS}>Total shares</label>
              <input type="number" value={newDraft.totalShares} onChange={(e) => setNewDraft({ ...newDraft, totalShares: e.target.value })} style={inputS} /></div>
            <div><label style={labelS}>Payment date</label>
              <input type="date" value={newDraft.paymentDate} onChange={(e) => setNewDraft({ ...newDraft, paymentDate: e.target.value })} style={inputS} /></div>
            <div><label style={labelS}>Notes</label>
              <input value={newDraft.notes} onChange={(e) => setNewDraft({ ...newDraft, notes: e.target.value })} style={inputS} /></div>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={addNew} style={{ ...btnPrimary, padding: "5px 10px", fontSize: "12px" }}>
              <Check size={12} /> Save
            </button>
            <button onClick={() => { setAddingNew(false); setNewDraft({ year: new Date().getFullYear(), amountPerShare: "", totalShares: "", paymentDate: "", notes: "" }); }} style={{ ...btnGhost, padding: "5px 10px", fontSize: "12px" }}>
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 && !addingNew ? (
        <div style={{ textAlign: "center", padding: "30px", color: T.accent, backgroundColor: T.panel, borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>No dividend data available. Click <strong>Add dividend</strong> to enter your first record.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto", border: `1px solid ${T.lineStrong}`, borderRadius: "10px" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: T.header, color: "#fff" }}>
                {colOrder.map((key) => {
                  const col = cols.find(c => c.key === key);
                  if (!col) return null;
                  return (
                    <th key={key} draggable onDragStart={(e) => handleDragStart(e, key)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, key)}
                      style={{ padding: 0, borderRight: "1px solid rgba(255,255,255,0.14)", position: "relative", verticalAlign: "top", width: widths[key], userSelect: "none" }}>
                      <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", cursor: "grab" }}>{col.label}</span>
                        <InfoTip text={col.tip} light />
                        <button onClick={() => setSortConfig({ key, dir: sortConfig.key === key && sortConfig.dir === "asc" ? "desc" : "asc" })} style={iconBtn("rgba(255,255,255,0.6)")}>
                          {sortConfig.key === key ? (sortConfig.dir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} />}
                        </button>
                        <FilterDropdown options={getFilterOptions(key)} value={filters[key] || "All"}
                          onChange={(val) => setFilters(p => ({ ...p, [key]: val === "All" ? "" : val }))} onClose={() => {}} />
                      </div>
                      <div onMouseDown={(e) => startResize(e, key)} style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                    </th>
                  );
                })}
                {!readOnly && (
                  <th style={{ padding: "10px 12px", fontSize: "13px", fontWeight: 600, color: "#fff", textAlign: "center", width: 110, borderLeft: "1px solid rgba(255,255,255,0.14)" }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, i) => {
                const editing = editingIdx === row.__idx;
                return (
                  <tr key={i} style={{ background: i % 2 ? T.panel : T.bg, borderBottom: `1px solid ${T.lineSoft}` }}>
                    {colOrder.map((key) => (
                      <td key={key} style={{ padding: "10px 12px", fontSize: "13.5px", color: T.body, borderRight: `1px solid ${T.lineSoft}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {editing ? (
                          key === "year" ? (
                            <input type="number" value={editDraft.year} onChange={(e) => setEditDraft(d => ({ ...d, year: e.target.value }))}
                              style={{ ...inputS, padding: "3px 5px", fontSize: "12px" }} />
                          ) : key === "amountPerShare" || key === "totalShares" ? (
                            <input type="number" value={editDraft[key] ?? 0} onChange={(e) => setEditDraft(d => ({ ...d, [key]: e.target.value }))}
                              style={{ ...inputS, padding: "3px 5px", fontSize: "12px" }} />
                          ) : key === "paymentDate" ? (
                            <input type="date" value={editDraft.paymentDate || ""} onChange={(e) => setEditDraft(d => ({ ...d, paymentDate: e.target.value }))}
                              style={{ ...inputS, padding: "3px 5px", fontSize: "12px" }} />
                          ) : key === "notes" ? (
                            <input value={editDraft.notes || ""} onChange={(e) => setEditDraft(d => ({ ...d, notes: e.target.value }))}
                              style={{ ...inputS, padding: "3px 5px", fontSize: "12px" }} />
                          ) : (
                            <span style={{ color: T.faint }}>—</span>
                          )
                        ) : (
                          key === "amountPerShare" || key === "totalIssued" ? `R${(row[key] || 0).toFixed(2)}` :
                          key === "totalShares" ? (row[key] || 0).toLocaleString() : row[key] || "-"
                        )}
                      </td>
                    ))}
                    {!readOnly && (
                      <td style={{ padding: "8px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                        {editing ? (
                          <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                            <button onClick={saveEdit} style={{ ...btnPrimary, padding: "3px 7px" }} title="Save"><Check size={13} /></button>
                            <button onClick={cancelEdit} style={{ ...btnGhost, padding: "3px 7px" }} title="Cancel"><X size={13} /></button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                            <button onClick={() => startEdit(row)} style={{ ...btnGhost, padding: "3px 7px" }} title="Edit"><Pencil size={13} /></button>
                            <button onClick={() => deleteRow(row)} style={{ ...btnGhost, padding: "3px 7px", color: T.red }} title="Delete"><Trash2 size={13} /></button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ─── Cap Table Overview (with Add) ────────────────────────────────────── */
const CapTableOverview = ({ investors, irrInvestments, readOnly, onSaveCapTable }) => {
  const [editInvIdx, setEditInvIdx] = useState(null);
  const [invDraft, setInvDraft] = useState({});
  const [addingInv, setAddingInv] = useState(false);
  const [newInv, setNewInv] = useState({ name: "", shares: "", investment: "" });

  const [editIrrIdx, setEditIrrIdx] = useState(null);
  const [irrDraft, setIrrDraft] = useState({});
  const [addingIrr, setAddingIrr] = useState(false);
  const [newIrr, setNewIrr] = useState({ name: "", irr: "", initialInvestment: "", duration: "", riskRating: "" });

  const investorCols = [
    { key: "name", label: "Investor", tip: "Investor name." },
    { key: "shares", label: "Shares", tip: "Shares held." },
    { key: "percentage", label: "%", tip: "Share %." },
    { key: "investment", label: "Investment (R)", tip: "Total invested." },
  ];
  const totalShares = investors.reduce((s, inv) => s + (Number(inv.shares) || 0), 0);
  const totalInvestment = investors.reduce((s, inv) => s + (Number(inv.investment) || 0), 0);
  const investorRows = investors.map((inv, idx) => ({
    __idx: idx, __raw: inv,
    name: inv.name,
    shares: inv.shares || 0,
    percentage: totalShares > 0 ? ((inv.shares / totalShares) * 100).toFixed(1) : "0.0",
    investment: inv.investment || 0,
  }));
  const { colOrder: invOrder, widths: invWidths, filters: invFilters, setFilters: setInvFilters, sortConfig: invSort, setSortConfig: setInvSort, startResize: startInvResize, handleDragStart: invDragStart, handleDragOver: invDragOver, handleDrop: invDrop, getFilterOptions: invFilterOpts, sortedData: sortedInvestors } = useEnhancedTable(investorCols, investorRows);

  const irrCols = [
    { key: "name", label: "Project", tip: "Project name." },
    { key: "irr", label: "IRR %", tip: "IRR (%)." },
    { key: "initialInvestment", label: "Initial Investment", tip: "Amount invested." },
    { key: "duration", label: "Duration", tip: "Duration." },
    { key: "riskRating", label: "Risk Rating", tip: "Risk." },
  ];
  const irrRows = irrInvestments.map((inv, idx) => ({
    __idx: idx, __raw: inv,
    name: inv.name, irr: inv.irr ?? 0,
    initialInvestment: inv.details?.initialInvestment || "",
    duration: inv.details?.duration || "", riskRating: inv.details?.riskRating || "",
  }));
  const { colOrder: irrOrder, widths: irrWidths, filters: irrFilters, setFilters: setIrrFilters, sortConfig: irrSort, setSortConfig: setIrrSort, startResize: startIrrResize, handleDragStart: irrDragStart, handleDragOver: irrDragOver, handleDrop: irrDrop, getFilterOptions: irrFilterOpts, sortedData: sortedIrr } = useEnhancedTable(irrCols, irrRows);
  const iconBtn = (c) => ({ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px", color: c, display: "inline-flex", alignItems: "center" });

  const startInvEdit = (row) => {
    setEditInvIdx(row.__idx);
    setInvDraft({ name: row.__raw.name || "", shares: row.__raw.shares ?? 0, investment: row.__raw.investment ?? 0 });
  };
  const saveInvEdit = () => {
    if (!onSaveCapTable) { setEditInvIdx(null); return; }
    const next = investors.map((inv, i) => i === editInvIdx ? {
      ...inv, name: invDraft.name, shares: Number(invDraft.shares) || 0, investment: Number(invDraft.investment) || 0,
    } : inv);
    onSaveCapTable({ investors: next, irrInvestments });
    setEditInvIdx(null);
  };
  const deleteInv = (row) => {
    if (!window.confirm("Remove this investor?")) return;
    if (!onSaveCapTable) return;
    onSaveCapTable({ investors: investors.filter((_, i) => i !== row.__idx), irrInvestments });
  };
  const addInvestor = () => {
    if (!onSaveCapTable || !newInv.name.trim()) return;
    const next = [...investors, { id: uid(), name: newInv.name.trim(), shares: Number(newInv.shares) || 0, investment: Number(newInv.investment) || 0 }];
    onSaveCapTable({ investors: next, irrInvestments });
    setNewInv({ name: "", shares: "", investment: "" });
    setAddingInv(false);
  };

  const startIrrEdit = (row) => {
    setEditIrrIdx(row.__idx);
    setIrrDraft({ name: row.__raw.name || "", irr: row.__raw.irr ?? 0,
      initialInvestment: row.__raw.details?.initialInvestment || "",
      duration: row.__raw.details?.duration || "", riskRating: row.__raw.details?.riskRating || "" });
  };
  const saveIrrEdit = () => {
    if (!onSaveCapTable) { setEditIrrIdx(null); return; }
    const next = irrInvestments.map((inv, i) => i === editIrrIdx ? {
      ...inv, name: irrDraft.name, irr: Number(irrDraft.irr) || 0,
      details: { ...(inv.details || {}), initialInvestment: irrDraft.initialInvestment, duration: irrDraft.duration, riskRating: irrDraft.riskRating },
    } : inv);
    onSaveCapTable({ investors, irrInvestments: next });
    setEditIrrIdx(null);
  };
  const deleteIrr = (row) => {
    if (!window.confirm("Remove this project?")) return;
    if (!onSaveCapTable) return;
    onSaveCapTable({ investors, irrInvestments: irrInvestments.filter((_, i) => i !== row.__idx) });
  };
  const addIrr = () => {
    if (!onSaveCapTable || !newIrr.name.trim()) return;
    const next = [...irrInvestments, {
      id: uid(), name: newIrr.name.trim(), irr: Number(newIrr.irr) || 0,
      details: { initialInvestment: newIrr.initialInvestment, duration: newIrr.duration, riskRating: newIrr.riskRating },
    }];
    onSaveCapTable({ investors, irrInvestments: next });
    setNewIrr({ name: "", irr: "", initialInvestment: "", duration: "", riskRating: "" });
    setAddingIrr(false);
  };

  const renderTable = ({ cols, order, widths, filters, setFilters, sortConfig, setSortConfig, startResize, dragStart, dragOver, drop, filterOpts, data, label,
                         editIdx, draft, setDraft, saveEdit, cancelEdit, deleteRow, startEdit, formatCell }) => (
    <div style={{ overflowX: "auto", border: `1px solid ${T.lineStrong}`, borderRadius: "10px", marginBottom: "20px" }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
        <thead>
          <tr style={{ background: T.header, color: "#fff" }}>
            {order.map((key) => {
              const col = cols.find(c => c.key === key);
              if (!col) return null;
              return (
                <th key={key} draggable onDragStart={(e) => dragStart(e, key)} onDragOver={dragOver} onDrop={(e) => drop(e, key)}
                  style={{ padding: 0, borderRight: "1px solid rgba(255,255,255,0.14)", position: "relative", verticalAlign: "top", width: widths[key], userSelect: "none" }}>
                  <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", cursor: "grab" }}>{col.label}</span>
                    <InfoTip text={col.tip} light />
                    <button onClick={() => setSortConfig({ key, dir: sortConfig.key === key && sortConfig.dir === "asc" ? "desc" : "asc" })} style={iconBtn("rgba(255,255,255,0.6)")}>
                      {sortConfig.key === key ? (sortConfig.dir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} />}
                    </button>
                    <FilterDropdown options={filterOpts(key)} value={filters[key] || "All"}
                      onChange={(val) => setFilters(p => ({ ...p, [key]: val === "All" ? "" : val }))} onClose={() => {}} />
                  </div>
                  <div onMouseDown={(e) => startResize(e, key)} style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                </th>
              );
            })}
            {!readOnly && (
              <th style={{ padding: "10px 12px", fontSize: "13px", fontWeight: 600, color: "#fff", textAlign: "center", width: 110, borderLeft: "1px solid rgba(255,255,255,0.14)" }}>
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const editing = editIdx === row.__idx;
            return (
              <tr key={i} style={{ background: i % 2 ? T.panel : T.bg, borderBottom: `1px solid ${T.lineSoft}` }}>
                {order.map((key) => (
                  <td key={key} style={{ padding: "10px 12px", fontSize: "13.5px", color: T.body, borderRight: `1px solid ${T.lineSoft}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {editing ? formatCell(key, draft, setDraft, true) : formatCell(key, row, null, false)}
                  </td>
                ))}
                {!readOnly && (
                  <td style={{ padding: "8px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                    {editing ? (
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <button onClick={saveEdit} style={{ ...btnPrimary, padding: "3px 7px" }} title="Save"><Check size={13} /></button>
                        <button onClick={cancelEdit} style={{ ...btnGhost, padding: "3px 7px" }} title="Cancel"><X size={13} /></button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <button onClick={() => startEdit(row)} style={{ ...btnGhost, padding: "3px 7px" }} title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => deleteRow(row)} style={{ ...btnGhost, padding: "3px 7px", color: T.red }} title="Delete"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        {label === "investor" && data.length > 0 && (
          <tfoot>
            <tr style={{ background: T.accentTint }}>
              <td colSpan={2} style={{ padding: "10px 12px", fontWeight: 700, color: T.accent }}>Total</td>
              <td style={{ padding: "10px 12px", fontWeight: 700, color: T.accent }}>{totalInvestment.toFixed(1)}</td>
              <td />
              {!readOnly && <td />}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );

  const investorFormatCell = (key, row, setDraft, editing) => {
    if (editing) {
      if (key === "name") return <input value={row.name || ""} onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))} style={{ ...inputS, padding: "3px 5px", fontSize: "12px" }} />;
      if (key === "shares") return <input type="number" value={row.shares ?? 0} onChange={(e) => setDraft(d => ({ ...d, shares: e.target.value }))} style={{ ...inputS, padding: "3px 5px", fontSize: "12px" }} />;
      if (key === "investment") return <input type="number" value={row.investment ?? 0} onChange={(e) => setDraft(d => ({ ...d, investment: e.target.value }))} style={{ ...inputS, padding: "3px 5px", fontSize: "12px" }} />;
      return <span style={{ color: T.faint }}>—</span>;
    }
    if (key === "investment") return `R${(row[key] || 0).toFixed(1)}`;
    if (key === "shares") return (row[key] || 0).toLocaleString();
    if (key === "percentage") return `${row[key]}%`;
    return row[key] || "-";
  };
  const irrFormatCell = (key, row, setDraft, editing) => {
    if (editing) {
      if (key === "name") return <input value={row.name || ""} onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))} style={{ ...inputS, padding: "3px 5px", fontSize: "12px" }} />;
      if (key === "irr") return <input type="number" value={row.irr ?? 0} onChange={(e) => setDraft(d => ({ ...d, irr: e.target.value }))} style={{ ...inputS, padding: "3px 5px", fontSize: "12px" }} />;
      if (key === "initialInvestment") return <input value={row.initialInvestment || ""} onChange={(e) => setDraft(d => ({ ...d, initialInvestment: e.target.value }))} style={{ ...inputS, padding: "3px 5px", fontSize: "12px" }} />;
      if (key === "duration") return <input value={row.duration || ""} onChange={(e) => setDraft(d => ({ ...d, duration: e.target.value }))} style={{ ...inputS, padding: "3px 5px", fontSize: "12px" }} />;
      if (key === "riskRating") return <input value={row.riskRating || ""} onChange={(e) => setDraft(d => ({ ...d, riskRating: e.target.value }))} style={{ ...inputS, padding: "3px 5px", fontSize: "12px" }} />;
      return <span style={{ color: T.faint }}>—</span>;
    }
    if (key === "irr") return `${(row[key] || 0).toFixed(1)}%`;
    return row[key] || "-";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <div style={{ backgroundColor: T.bg, border: `1px solid ${T.line}`, padding: "20px", borderRadius: "10px" }}>
        <h3 style={{ color: T.accent, margin: "0 0 16px", fontSize: "1.1rem", fontWeight: 600 }}>Cap Table Overview</h3>

        <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
          <div>
            <h4 style={{ color: T.accentSoft, marginBottom: "15px", fontSize: "1rem" }}>Ownership Structure</h4>
            {investors.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: T.accent, backgroundColor: T.panel, borderRadius: "8px" }}>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>No investor data. Click <strong>Add investor</strong> to enter your first record.</p>
              </div>
            ) : (
              <div style={{ height: "300px" }}>
                <Pie
                  data={{
                    labels: investors.map((inv) => inv.name),
                    datasets: [{ data: investors.map((inv) => inv.shares),
                      backgroundColor: ["#a67c52", "#8b7355", "#b89f8d", "#e6d7c3", "#f5f0e1"],
                      borderColor: "#4a352f", borderWidth: 1 }],
                  }}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                      legend: { position: window.innerWidth < 768 ? "bottom" : "right", labels: { font: { size: 11 } } },
                      datalabels: { color: "#fff", font: { weight: "bold", size: 11 },
                        formatter: (value, context) => {
                          const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                          return (total > 0 ? ((value / total) * 100).toFixed(1) : 0) + "%";
                        } },
                    },
                  }}
                  plugins={[ChartDataLabels]}
                />
              </div>
            )}
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h4 style={{ color: T.accentSoft, margin: 0, fontSize: "1rem" }}>Investor Details</h4>
              {!readOnly && (
                <button onClick={() => setAddingInv(true)} style={{ ...btnGhost, padding: "4px 9px", fontSize: "11.5px" }}>
                  <Plus size={11} /> Add investor
                </button>
              )}
            </div>

            {addingInv && (
              <div style={{ ...cardS, background: T.panel, marginBottom: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <div><label style={labelS}>Name *</label>
                    <input value={newInv.name} onChange={(e) => setNewInv({ ...newInv, name: e.target.value })} style={inputS} /></div>
                  <div><label style={labelS}>Shares</label>
                    <input type="number" value={newInv.shares} onChange={(e) => setNewInv({ ...newInv, shares: e.target.value })} style={inputS} /></div>
                  <div><label style={labelS}>Investment (R)</label>
                    <input type="number" value={newInv.investment} onChange={(e) => setNewInv({ ...newInv, investment: e.target.value })} style={inputS} /></div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={addInvestor} disabled={!newInv.name.trim()}
                    style={{ ...btnPrimary, padding: "5px 10px", fontSize: "12px", opacity: !newInv.name.trim() ? 0.6 : 1 }}>
                    <Check size={12} /> Save
                  </button>
                  <button onClick={() => { setAddingInv(false); setNewInv({ name: "", shares: "", investment: "" }); }} style={{ ...btnGhost, padding: "5px 10px", fontSize: "12px" }}>
                    <X size={12} /> Cancel
                  </button>
                </div>
              </div>
            )}

            {investors.length === 0 && !addingInv ? (
              <div style={{ textAlign: "center", padding: "30px", color: T.accent, backgroundColor: T.panel, borderRadius: "8px" }}>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>No investor rows yet — click <strong>Add investor</strong> above.</p>
              </div>
            ) : investors.length > 0 && (
              renderTable({
                cols: investorCols, order: invOrder, widths: invWidths, filters: invFilters, setFilters: setInvFilters,
                sortConfig: invSort, setSortConfig: setInvSort, startResize: startInvResize,
                dragStart: invDragStart, dragOver: invDragOver, drop: invDrop, filterOpts: invFilterOpts,
                data: sortedInvestors, label: "investor",
                editIdx: editInvIdx, draft: invDraft, setDraft: setInvDraft,
                saveEdit: saveInvEdit, cancelEdit: () => { setEditInvIdx(null); setInvDraft({}); },
                deleteRow: deleteInv, startEdit: startInvEdit,
                formatCell: investorFormatCell,
              })
            )}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h4 style={{ color: T.accentSoft, margin: 0, fontSize: "1rem" }}>IRR on Equity Investments</h4>
            {!readOnly && (
              <button onClick={() => setAddingIrr(true)} style={{ ...btnGhost, padding: "4px 9px", fontSize: "11.5px" }}>
                <Plus size={11} /> Add project
              </button>
            )}
          </div>

          {addingIrr && (
            <div style={{ ...cardS, background: T.panel, marginBottom: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div><label style={labelS}>Project *</label>
                  <input value={newIrr.name} onChange={(e) => setNewIrr({ ...newIrr, name: e.target.value })} style={inputS} /></div>
                <div><label style={labelS}>IRR %</label>
                  <input type="number" value={newIrr.irr} onChange={(e) => setNewIrr({ ...newIrr, irr: e.target.value })} style={inputS} /></div>
                <div><label style={labelS}>Initial investment</label>
                  <input value={newIrr.initialInvestment} onChange={(e) => setNewIrr({ ...newIrr, initialInvestment: e.target.value })} style={inputS} /></div>
                <div><label style={labelS}>Duration</label>
                  <input value={newIrr.duration} onChange={(e) => setNewIrr({ ...newIrr, duration: e.target.value })} style={inputS} /></div>
                <div><label style={labelS}>Risk rating</label>
                  <input value={newIrr.riskRating} onChange={(e) => setNewIrr({ ...newIrr, riskRating: e.target.value })} style={inputS} /></div>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={addIrr} disabled={!newIrr.name.trim()}
                  style={{ ...btnPrimary, padding: "5px 10px", fontSize: "12px", opacity: !newIrr.name.trim() ? 0.6 : 1 }}>
                  <Check size={12} /> Save
                </button>
                <button onClick={() => { setAddingIrr(false); setNewIrr({ name: "", irr: "", initialInvestment: "", duration: "", riskRating: "" }); }} style={{ ...btnGhost, padding: "5px 10px", fontSize: "12px" }}>
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          )}

          {irrInvestments.length === 0 && !addingIrr ? (
            <div style={{ textAlign: "center", padding: "30px", color: T.accent, backgroundColor: T.panel, borderRadius: "8px" }}>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>No projects yet — click <strong>Add project</strong> above.</p>
            </div>
          ) : irrInvestments.length > 0 && (
            renderTable({
              cols: irrCols, order: irrOrder, widths: irrWidths, filters: irrFilters, setFilters: setIrrFilters,
              sortConfig: irrSort, setSortConfig: setIrrSort, startResize: startIrrResize,
              dragStart: irrDragStart, dragOver: irrDragOver, drop: irrDrop, filterOpts: irrFilterOpts,
              data: sortedIrr, label: "irr",
              editIdx: editIrrIdx, draft: irrDraft, setDraft: setIrrDraft,
              saveEdit: saveIrrEdit, cancelEdit: () => { setEditIrrIdx(null); setIrrDraft({}); },
              deleteRow: deleteIrr, startEdit: startIrrEdit,
              formatCell: irrFormatCell,
            })
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Loan Repayments with Actions column ──────────────────────────────── */
const LoanRepaymentsPanel = ({ loans, readOnly, onSave }) => {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [addingNew, setAddingNew] = useState(false);
  const [newLoan, setNewLoan] = useState({ name: "", scheduled: "", paid: "" });

  const cols = [
    { key: "name", label: "Loan Name", tip: "Loan facility name." },
    { key: "scheduled", label: "Scheduled", tip: "Amount due." },
    { key: "paid", label: "Paid", tip: "Amount paid." },
    { key: "variance", label: "Variance", tip: "Paid minus Scheduled." },
  ];
  const rows = loans.map((l, idx) => ({
    __idx: idx, __raw: l,
    name: l.name, scheduled: parseFloat(l.scheduled) || 0, paid: parseFloat(l.paid) || 0,
    variance: (parseFloat(l.paid) || 0) - (parseFloat(l.scheduled) || 0),
  }));
  const { colOrder, widths, filters, setFilters, sortConfig, setSortConfig, startResize, handleDragStart, handleDragOver, handleDrop, getFilterOptions, sortedData } = useEnhancedTable(cols, rows);
  const totalScheduled = rows.reduce((s, r) => s + r.scheduled, 0);
  const totalPaid = rows.reduce((s, r) => s + r.paid, 0);
  const totalVar = totalPaid - totalScheduled;
  const iconBtn = (c) => ({ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px", color: c, display: "inline-flex", alignItems: "center" });

  const startEdit = (row) => { setEditingIdx(row.__idx); setEditDraft({ name: row.__raw.name || "", scheduled: row.__raw.scheduled ?? "", paid: row.__raw.paid ?? "" }); };
  const cancelEdit = () => { setEditingIdx(null); setEditDraft({}); };
  const saveEdit = () => {
    if (!onSave) { cancelEdit(); return; }
    const next = loans.map((l, i) => i === editingIdx ? { ...l, name: editDraft.name, scheduled: editDraft.scheduled, paid: editDraft.paid } : l);
    onSave(next);
    cancelEdit();
  };
  const deleteRow = (row) => {
    if (!window.confirm("Remove this loan?")) return;
    if (!onSave) return;
    onSave(loans.filter((_, i) => i !== row.__idx));
  };
  const addNew = () => {
    if (!onSave || !newLoan.name.trim()) return;
    onSave([...(loans || []), { id: uid(), name: newLoan.name.trim(), scheduled: newLoan.scheduled, paid: newLoan.paid }]);
    setNewLoan({ name: "", scheduled: "", paid: "" });
    setAddingNew(false);
  };

  return (
    <div style={cardS}>
      <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: T.accent }}>Loan Repayments</div>
          <div style={{ fontSize: "12.5px", color: T.muted }}>Scheduled vs paid, per loan facility</div>
        </div>
        {!readOnly && (
          <button onClick={() => setAddingNew(true)} style={{ ...btnGhost, padding: "5px 10px", fontSize: "12px" }}>
            <Plus size={12} /> Add loan
          </button>
        )}
      </div>

      {addingNew && (
        <div style={{ ...cardS, background: T.panel, marginBottom: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div><label style={labelS}>Name</label>
              <input value={newLoan.name} onChange={(e) => setNewLoan({ ...newLoan, name: e.target.value })} style={inputS} /></div>
            <div><label style={labelS}>Scheduled</label>
              <input type="number" value={newLoan.scheduled} onChange={(e) => setNewLoan({ ...newLoan, scheduled: e.target.value })} style={inputS} /></div>
            <div><label style={labelS}>Paid</label>
              <input type="number" value={newLoan.paid} onChange={(e) => setNewLoan({ ...newLoan, paid: e.target.value })} style={inputS} /></div>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={addNew} disabled={!newLoan.name.trim()} style={{ ...btnPrimary, padding: "5px 10px", fontSize: "12px", opacity: !newLoan.name.trim() ? 0.6 : 1 }}>
              <Check size={12} /> Save
            </button>
            <button onClick={() => { setAddingNew(false); setNewLoan({ name: "", scheduled: "", paid: "" }); }} style={{ ...btnGhost, padding: "5px 10px", fontSize: "12px" }}>
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      )}

      {loans.length === 0 ? (
        <div style={{ padding: "26px 16px", textAlign: "center", color: T.muted, fontSize: "13.5px" }}>
          No loans captured yet — use the <strong>Add loan</strong> button to start.
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: T.header, color: "#fff" }}>
                {colOrder.map((key) => {
                  const col = cols.find(c => c.key === key);
                  if (!col) return null;
                  return (
                    <th key={key} draggable onDragStart={(e) => handleDragStart(e, key)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, key)}
                      style={{ padding: 0, borderRight: "1px solid rgba(255,255,255,0.14)", position: "relative", verticalAlign: "top", width: widths[key], userSelect: "none" }}>
                      <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", cursor: "grab" }}>{col.label}</span>
                        <InfoTip text={col.tip} light />
                        <button onClick={() => setSortConfig({ key, dir: sortConfig.key === key && sortConfig.dir === "asc" ? "desc" : "asc" })} style={iconBtn("rgba(255,255,255,0.6)")}>
                          {sortConfig.key === key ? (sortConfig.dir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} />}
                        </button>
                        <FilterDropdown options={getFilterOptions(key)} value={filters[key] || "All"}
                          onChange={(val) => setFilters(p => ({ ...p, [key]: val === "All" ? "" : val }))} onClose={() => {}} />
                      </div>
                      <div onMouseDown={(e) => startResize(e, key)} style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                    </th>
                  );
                })}
                {!readOnly && (
                  <th style={{ padding: "10px 12px", fontSize: "13px", fontWeight: 600, color: "#fff", textAlign: "center", width: 110, borderLeft: "1px solid rgba(255,255,255,0.14)" }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, i) => {
                const editing = editingIdx === row.__idx;
                return (
                  <tr key={i} style={{ background: i % 2 ? T.panel : T.bg, borderBottom: `1px solid ${T.lineSoft}` }}>
                    {colOrder.map((key) => (
                      <td key={key} style={{ padding: "10px 12px", fontSize: "13.5px", color: T.body, borderRight: `1px solid ${T.lineSoft}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {editing ? (
                          key === "name" ? (
                            <input value={editDraft.name || ""} onChange={(e) => setEditDraft(d => ({ ...d, name: e.target.value }))}
                              style={{ ...inputS, padding: "3px 5px", fontSize: "12px" }} />
                          ) : key === "scheduled" || key === "paid" ? (
                            <input type="number" value={editDraft[key] ?? ""} onChange={(e) => setEditDraft(d => ({ ...d, [key]: e.target.value }))}
                              style={{ ...inputS, padding: "3px 5px", fontSize: "12px", textAlign: "right" }} />
                          ) : (
                            <span style={{ color: T.faint }}>—</span>
                          )
                        ) : key === "variance" ? (
                          <span style={{ fontWeight: 700, color: row[key] <= 0 ? T.green : T.red }}>
                            {fmtValue(row[key], { units: "R" }, { signed: true })}
                          </span>
                        ) : key === "scheduled" || key === "paid" ? fmtValue(row[key], { units: "R" }) : row[key]}
                      </td>
                    ))}
                    {!readOnly && (
                      <td style={{ padding: "8px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                        {editing ? (
                          <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                            <button onClick={saveEdit} style={{ ...btnPrimary, padding: "3px 7px" }} title="Save"><Check size={13} /></button>
                            <button onClick={cancelEdit} style={{ ...btnGhost, padding: "3px 7px" }} title="Cancel"><X size={13} /></button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                            <button onClick={() => startEdit(row)} style={{ ...btnGhost, padding: "3px 7px" }} title="Edit"><Pencil size={13} /></button>
                            <button onClick={() => deleteRow(row)} style={{ ...btnGhost, padding: "3px 7px", color: T.red }} title="Delete"><Trash2 size={13} /></button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: T.accentTint }}>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: T.accent }}>Total</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: T.accent, textAlign: "right" }}>{fmtValue(totalScheduled, { units: "R" })}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: T.accent, textAlign: "right" }}>{fmtValue(totalPaid, { units: "R" })}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: totalVar <= 0 ? T.green : T.red, textAlign: "right" }}>{fmtValue(totalVar, { units: "R" }, { signed: true })}</td>
                {!readOnly && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Balance Sheet
   ════════════════════════════════════════════════════════════════════════ */
const prettify = (k) => k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
const NEGATIVE_KEYS = new Set(["lessAmortization","treasuryShares","lessDepreciationBuildings","lessDepreciationComputer",
  "lessDepreciationVehicles","lessDepreciationFurniture","lessDepreciationMachinery","lessDepreciationOther"]);

const col = () => Array(12).fill("");

const BLANK_BS = {
  assets: {
    bank: { currentAccount: col(), savingsAccount: col(), pettyCash: col() },
    currentAssets: { cash: col(), tradeReceivables: col(), inventory: col(), prepaidExpenses: col(), otherReceivables: col() },
    fixedAssets: {
      land: col(), buildings: col(), computerEquipment: col(), vehicles: col(), furniture: col(),
      machinery: col(), otherPropertyPlantEquipment: col(), assetsUnderConstruction: col(),
      lessDepreciationBuildings: col(), lessDepreciationComputer: col(), lessDepreciationVehicles: col(),
      lessDepreciationFurniture: col(), lessDepreciationMachinery: col(), lessDepreciationOther: col(),
    },
    intangibleAssets: { goodwill: col(), trademarks: col(), patents: col(), software: col(), customerLists: col(), lessAmortization: col() },
    nonCurrentAssets: { investments: col(), loansReceivable: col(), deferredTaxAsset: col() },
  },
  liabilities: {
    currentLiabilities: { tradePayables: col(), accruedExpenses: col(), shortTermLoans: col(), taxPayable: col(), bankOverdraft: col(), otherPayables: col() },
    nonCurrentLiabilities: { longTermLoans: col(), financeLeases: col(), deferredTaxLiability: col(), shareholderLoans: col() },
  },
  equity: { shareCapital: col(), retainedEarnings: col(), currentYearEarnings: col(), reserves: col(), treasuryShares: col() },
  customCategories: [], customLiabilitiesCategories: [], customEquityCategories: [],
};

const BsLineModal = ({ mode, lineName, initialValues, months, onClose, onSave }) => {
  const [name, setName] = useState(lineName || "");
  const [values, setValues] = useState(() => {
    const v = {};
    months.forEach((m, i) => { v[i] = initialValues?.[i] ?? ""; });
    return v;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (mode === "add" && !name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), values: months.map((_, i) => values[i] ?? "") });
      onClose();
    } catch (err) {
      console.error(err);
    } finally { setSaving(false); }
  };

  return (
    <Modal title={mode === "add" ? "Add line" : `Edit ${lineName}`}
      subtitle={mode === "add" ? "Give the line a name and enter its monthly values" : "Update the monthly values for this line"}
      icon={<Database size={17} />} onClose={onClose} width={720}
      footer={
        <>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={handleSave} disabled={saving || (mode === "add" && !name.trim())}
            style={{ ...btnPrimary, opacity: saving || (mode === "add" && !name.trim()) ? 0.6 : 1 }}>
            {saving ? "Saving..." : mode === "add" ? "Add line" : "Save changes"}
          </button>
        </>
      }>
      {mode === "add" && (
        <div style={{ marginBottom: "16px" }}>
          <label style={labelS}>Line name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputS} placeholder="e.g. equipmentDeposit" />
          <p style={{ fontSize: "11.5px", color: T.muted, marginTop: "6px", marginBottom: 0 }}>Use camelCase — no spaces. This becomes the key on the balance sheet.</p>
        </div>
      )}
      <label style={labelS}>Monthly values</label>
      <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
          <thead>
            <tr style={{ background: T.header, color: "#fff" }}>
              <th style={{ padding: "8px 12px", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left", width: "40%" }}>Month</th>
              <th style={{ padding: "8px 12px", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Value (R)</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => (
              <tr key={m.key} style={{ background: i % 2 ? T.panel : T.bg }}>
                <td style={{ padding: "6px 12px", fontSize: "13.5px", color: T.ink, fontWeight: 500,
                  borderBottom: `1px solid ${T.lineSoft}`, borderRight: `1px solid ${T.lineSoft}` }}>{m.long}</td>
                <td style={{ padding: "4px 8px", borderBottom: `1px solid ${T.lineSoft}` }}>
                  <input type="number" step="any" value={values[i] ?? ""} placeholder="—"
                    onChange={(e) => setValues((p) => ({ ...p, [i]: e.target.value }))}
                    style={{ ...inputS, padding: "6px 9px", fontSize: "13px", textAlign: "right" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

const BsSectionModal = ({ onClose, onSave }) => {
  const [name, setName] = useState("");
  const [firstLine, setFirstLine] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ sectionName: name.trim(), firstLine: firstLine.trim() || null });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Add section" subtitle="Create a new custom section on the balance sheet" icon={<Plus size={17} />}
      onClose={onClose} width={480}
      footer={
        <>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !name.trim()}
            style={{ ...btnPrimary, opacity: saving || !name.trim() ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Add section"}
          </button>
        </>
      }>
      <div style={{ marginBottom: "14px" }}>
        <label style={labelS}>Section name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputS} placeholder="e.g. Deferred Items" />
      </div>
      <div>
        <label style={labelS}>First line (optional)</label>
        <input value={firstLine} onChange={(e) => setFirstLine(e.target.value)} style={inputS} placeholder="e.g. prepaidRent" />
      </div>
    </Modal>
  );
};

const BalanceSheetTab = ({ fy, docs, readOnly, onSaveBsFull, onDeleteSection, onDeleteLine }) => {
  const months = useMemo(() => fyMonths(fy.startYear, fy.startMonth), [fy]);
  const [monthKey, setMonthKey] = useState(() => months.find((m) => m.key === currentMonthKey())?.key || months[0].key);
  const meta = months.find((m) => m.key === monthKey) || months[0];
  const monthIndex = months.findIndex((m) => m.key === monthKey);
  const bsDoc = docs[`${DOC.bs}_${meta.year}`];
  const bs = bsDoc?.balanceSheetData || BLANK_BS;
  const mi = meta.month;
  const totals = bsTotals({ balanceSheetData: bs }, mi);

  const [lineModal, setLineModal] = useState(null);
  const [sectionModal, setSectionModal] = useState(null);

  const Section = ({ title, path, obj, total, isCustom, customIndex, sectionType }) => {
    if (!obj && !isCustom) return null;
    const items = obj ? Object.entries(obj).filter(([, arr]) => Array.isArray(arr)) : [];
    return (
      <div style={{ marginBottom: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</div>
          <div style={{ display: "flex", gap: "6px" }}>
            {!readOnly && (
              <button onClick={() => setLineModal({ mode: "add", sectionPath: path, sectionType })}
                style={{ ...btnQuiet, padding: "3px 9px", fontSize: "11.5px", border: `1px solid ${T.line}`, borderRadius: "6px" }}>
                <Plus size={11} /> Add line
              </button>
            )}
            {!readOnly && isCustom && (
              <button onClick={() => onDeleteSection(sectionType, customIndex)}
                style={{ ...btnQuiet, padding: "3px 9px", fontSize: "11.5px", color: T.red, border: `1px solid ${T.line}`, borderRadius: "6px" }}>
                <Trash2 size={11} /> Delete section
              </button>
            )}
          </div>
        </div>
        <div style={{ border: `1px solid ${T.line}`, borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={3} style={{ padding: "14px 12px", fontSize: "12.5px", color: T.muted, textAlign: "center", fontStyle: "italic" }}>No lines yet — use <strong>Add line</strong> above to start.</td></tr>
              )}
              {items.map(([key, arr], i) => {
                const negative = NEGATIVE_KEYS.has(key);
                const raw = arr?.[mi];
                const val = raw === "" || raw === null || raw === undefined ? null : Number(raw);
                return (
                  <tr key={key} style={{ background: i % 2 ? T.panel : T.bg }}>
                    <td style={{ padding: "8px 12px", fontSize: "13.5px", color: negative ? T.muted : T.ink,
                      borderBottom: `1px solid ${T.lineSoft}`, borderRight: `1px solid ${T.lineSoft}` }}>
                      {negative && <span style={{ color: T.faint, marginRight: "5px" }}>−</span>}
                      {prettify(key)}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: "13.5px", color: T.ink,
                      fontVariantNumeric: "tabular-nums", borderBottom: `1px solid ${T.lineSoft}`, borderRight: `1px solid ${T.lineSoft}` }}>
                      {val === null || !Number.isFinite(val) ? "—" : fmtValue(val, { units: "R" })}
                    </td>
                    <td style={{ padding: "6px 8px", width: "70px", textAlign: "center", borderBottom: `1px solid ${T.lineSoft}` }}>
                      {!readOnly && (
                        <div style={{ display: "flex", gap: "2px", justifyContent: "center" }}>
                          <button onClick={() => setLineModal({ mode: "edit", sectionPath: path, sectionType, lineName: key, values: arr })}
                            style={{ background: "none", border: "none", cursor: "pointer", color: T.accent, padding: "2px" }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => onDeleteLine(sectionType, path, key)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: T.red, padding: "2px" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {total !== undefined && (
                <tr style={{ background: T.accentTint }}>
                  <td style={{ padding: "9px 12px", fontSize: "13.5px", fontWeight: 700, color: T.accent, borderRight: `1px solid ${T.lineSoft}` }}>Total {title.toLowerCase()}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: "14px", fontWeight: 700, color: T.accent, fontVariantNumeric: "tabular-nums" }}>{fmtValue(total, { units: "R" })}</td>
                  <td style={{ borderRight: "none" }} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const CustomSections = ({ list, sectionType }) => {
    if (!list?.length) return null;
    return (
      <>
        {list.map((cat, ci) => (
          <Section key={`${cat.id || cat.name || ci}`}
            title={cat.name || `Custom section ${ci + 1}`}
            path={`${sectionType}.customCategories`}
            obj={cat.items} total={sumObj(cat.items, mi)} isCustom customIndex={ci} sectionType={sectionType}
          />
        ))}
      </>
    );
  };

  const handleLineSave = async ({ name, values }) => {
    const lm = lineModal;
    if (!lm) return;
    const docKey = `${DOC.bs}_${meta.year}`;
    const existing = bsDoc?.balanceSheetData || BLANK_BS;
    const next = JSON.parse(JSON.stringify(existing));
    let node = next;
    for (const seg of lm.sectionPath.split(".")) node = node[seg];
    if (!node) return;
    if (lm.mode === "add") {
      const clean = name.replace(/\s+/g, "");
      if (!clean) return;
      if (node[clean] && Array.isArray(node[clean])) return;
      node[clean] = values;
    } else {
      node[lm.lineName] = values;
    }
    await onSaveBsFull(docKey, next);
  };

  const handleSectionSave = async ({ sectionName, firstLine }) => {
    const docKey = `${DOC.bs}_${meta.year}`;
    const existing = bsDoc?.balanceSheetData || BLANK_BS;
    const next = JSON.parse(JSON.stringify(existing));
    const st = sectionModal.sectionType;
    const field = st === "assets" ? "customCategories"
      : st === "liabilities" ? "customLiabilitiesCategories"
      : "customEquityCategories";
    if (!Array.isArray(next[field])) next[field] = [];
    const newSection = { id: uid(), name: sectionName, items: {} };
    if (firstLine) {
      newSection.items[firstLine.replace(/\s+/g, "")] = Array(12).fill("");
    }
    next[field].push(newSection);
    await onSaveBsFull(docKey, next);
  };

  const balanceGap = Number.isFinite(totals.assets) && Number.isFinite(totals.liabilities) && Number.isFinite(totals.equity)
    ? totals.assets - (totals.liabilities + totals.equity) : null;
  const balanced = balanceGap !== null && Math.abs(balanceGap) < 1;

  const summary = (label, value, color) => (
    <div key={label} style={{ ...cardS, padding: "12px 15px", flex: "1 1 170px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: T.muted }}>{label}</div>
      <div style={{ fontSize: "19px", fontWeight: 700, color: color || T.ink, marginTop: "3px", fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
        <div style={{ minWidth: "230px" }}>
          <label style={labelS}>Month</label>
          <Select value={monthKey} onChange={(e) => setMonthKey(e.target.value)}>
            {months.map((m) => <option key={m.key} value={m.key}>{m.long}</option>)}
          </Select>
        </div>
        <button onClick={() => setMonthKey(months[Math.max(0, monthIndex - 1)]?.key)} disabled={monthIndex <= 0}
          style={{ ...btnGhost, padding: "9px 11px", opacity: monthIndex <= 0 ? 0.4 : 1 }}><ChevronLeft size={14} /></button>
        <button onClick={() => setMonthKey(months[Math.min(months.length - 1, monthIndex + 1)]?.key)} disabled={monthIndex >= months.length - 1}
          style={{ ...btnGhost, padding: "9px 11px", opacity: monthIndex >= months.length - 1 ? 0.4 : 1 }}><ChevronRight size={14} /></button>
        <span style={{ flex: 1 }} />
        {!readOnly && (
          <span style={{ fontSize: "12.5px", color: T.muted, paddingBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Info size={12} /> Use <strong>Add line</strong> or the pencil to edit values
          </span>
        )}
      </div>

      <div style={{ ...cardS, marginBottom: "16px", background: balanced ? T.greenBg : T.amberBg,
        border: `1px solid ${(balanced ? T.green : T.amber)}33`, display: "flex", alignItems: "center", gap: "10px" }}>
        {balanced ? <CheckCircle2 size={18} color={T.green} /> : <AlertTriangle size={18} color={T.amber} />}
        <span style={{ fontSize: "13.5px", color: balanced ? T.green : T.amber }}>
          {balanceGap === null ? `Nothing captured for ${meta.long} yet, so there is nothing to balance.`
            : balanced ? "Assets equal liabilities plus equity for this month."
            : `Out by ${fmtValue(Math.abs(balanceGap), { units: "R" })} — assets ${balanceGap > 0 ? "exceed" : "fall short of"} liabilities plus equity.`}
        </span>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
        {summary("Total assets", fmtValue(totals.assets, { units: "R" }))}
        {summary("Total liabilities", fmtValue(totals.liabilities, { units: "R" }))}
        {summary("Total equity", fmtValue(totals.equity, { units: "R" }))}
        {summary("Net asset value", fmtValue(
          Number.isFinite(totals.assets) && Number.isFinite(totals.liabilities) ? totals.assets - totals.liabilities : null,
          { units: "R" }), T.accent)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: T.accent, margin: 0 }}>Assets</h4>
            {!readOnly && (
              <button onClick={() => setSectionModal({ sectionType: "assets" })} style={{ ...btnGhost, padding: "5px 10px", fontSize: "12px" }}>
                <Plus size={12} /> Add section
              </button>
            )}
          </div>
          <Section title="Bank" path="assets.bank" obj={bs.assets?.bank} total={sumObj(bs.assets?.bank, mi)} sectionType="assets" />
          <Section title="Current assets" path="assets.currentAssets" obj={bs.assets?.currentAssets} total={sumObj(bs.assets?.currentAssets, mi)} sectionType="assets" />
          <Section title="Fixed assets" path="assets.fixedAssets" obj={bs.assets?.fixedAssets} sectionType="assets" />
          <Section title="Intangible assets" path="assets.intangibleAssets" obj={bs.assets?.intangibleAssets} sectionType="assets" />
          <Section title="Non-current assets" path="assets.nonCurrentAssets" obj={bs.assets?.nonCurrentAssets} total={sumObj(bs.assets?.nonCurrentAssets, mi)} sectionType="assets" />
          <CustomSections list={bs.customCategories} sectionType="assets" />
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: T.accent, margin: 0 }}>Liabilities and equity</h4>
            {!readOnly && (
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => setSectionModal({ sectionType: "liabilities" })} style={{ ...btnGhost, padding: "5px 10px", fontSize: "12px" }}>
                  <Plus size={12} /> Liability section
                </button>
                <button onClick={() => setSectionModal({ sectionType: "equity" })} style={{ ...btnGhost, padding: "5px 10px", fontSize: "12px" }}>
                  <Plus size={12} /> Equity section
                </button>
              </div>
            )}
          </div>
          <Section title="Current liabilities" path="liabilities.currentLiabilities" obj={bs.liabilities?.currentLiabilities} total={sumObj(bs.liabilities?.currentLiabilities, mi)} sectionType="liabilities" />
          <Section title="Non-current liabilities" path="liabilities.nonCurrentLiabilities" obj={bs.liabilities?.nonCurrentLiabilities} total={sumObj(bs.liabilities?.nonCurrentLiabilities, mi)} sectionType="liabilities" />
          <CustomSections list={bs.customLiabilitiesCategories} sectionType="liabilities" />
          <Section title="Equity" path="equity" obj={bs.equity} total={sumObj(bs.equity, mi) - 2 * (parseFloat(bs.equity?.treasuryShares?.[mi]) || 0)} sectionType="equity" />
          <CustomSections list={bs.customEquityCategories} sectionType="equity" />
        </div>
      </div>

      {lineModal && (
        <BsLineModal
          mode={lineModal.mode}
          lineName={lineModal.lineName}
          initialValues={lineModal.values}
          months={months}
          onClose={() => setLineModal(null)}
          onSave={handleLineSave}
        />
      )}
      {sectionModal && (
        <BsSectionModal onClose={() => setSectionModal(null)} onSave={handleSectionSave} />
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Report Generator
   ════════════════════════════════════════════════════════════════════════ */
const FinancialReportGenerator = ({ tabs, fy, docs, meta, period, onClose, userId, userName, dividends, investors, irrInvestments }) => {
  const [selectedTabs, setSelectedTabs] = useState(() => Object.fromEntries(tabs.map((t) => [t.id, true])));
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [includeEquity, setIncludeEquity] = useState(true);
  const [includeLoans, setIncludeLoans] = useState(true);
  const [includeBalanceSheet, setIncludeBalanceSheet] = useState(true);
  const [includeActions, setIncludeActions] = useState(true);
  const [includeSplit, setIncludeSplit] = useState(true);
  const [periodForReport, setPeriodForReport] = useState(period);
  const [generating, setGenerating] = useState(false);
  const [reportTitle, setReportTitle] = useState(`Financial Performance Report - ${new Date().toLocaleDateString()}`);

  const [actions, setActions] = useState([]);

  useEffect(() => {
    const loadActions = async () => {
      if (!userId) return;
      try {
        const snap = await getDoc(doc(db, "governanceCalendar", userId));
        if (snap.exists()) {
          const meetings = snap.data().meetings || [];
          setActions(meetings.flatMap(m => (m.actions || []).map(a => ({ ...a, meetingTitle: m.title }))));
        }
      } catch (err) { console.error(err); }
    };
    loadActions();
  }, [userId]);

  const buildSplitRows = (kpi) => {
    const freq = kpi.frequency || "Monthly";

    if (freq === "Daily") {
      const keys = Object.keys(kpi.entries || {}).filter((k) => k.startsWith("D:")).sort();
      if (!keys.length) return { title: "Daily split (no entries captured)", rows: [] };
      return {
        title: "Daily split",
        rows: keys.map((k) => {
          const d = new Date(k.slice(2));
          return {
            label: `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
            budget: kpi.entries[k]?.budget ?? null,
            actual: kpi.entries[k]?.actual ?? null,
          };
        }),
      };
    }

    if (freq === "Weekly") {
      const keys = Object.keys(kpi.entries || {}).filter((k) => k.startsWith("W:")).sort();
      if (!keys.length) return { title: "Weekly split (no entries captured)", rows: [] };
      return {
        title: "Weekly split",
        rows: keys.map((k) => {
          const s = new Date(k.slice(2));
          const e = new Date(s); e.setDate(e.getDate() + 6);
          return {
            label: `${String(s.getDate()).padStart(2, "0")} ${MONTHS[s.getMonth()]} – ${String(e.getDate()).padStart(2, "0")} ${MONTHS[e.getMonth()]}`,
            budget: kpi.entries[k]?.budget ?? null,
            actual: kpi.entries[k]?.actual ?? null,
          };
        }),
      };
    }

    const months = fyMonths(fy.startYear, fy.startMonth);
    return {
      title: "Monthly split",
      rows: months.map((m) => {
        const entry = kpi.entries?.[m.key] || {};
        return { label: m.long, budget: entry.budget ?? null, actual: entry.actual ?? null };
      }),
    };
  };

  const generateReport = async () => {
    setGenerating(true);
    const reportData = {
      title: reportTitle,
      generated: new Date().toISOString(),
      period: PERIOD_LABEL[periodForReport],
      financialYear: fyLabel(fy.startYear, fy.startMonth),
      userName: userName || "User",
      includeSplit,
      sections: [],
      summary: null,
      actions: [],
      equity: null,
      loans: null,
      balanceSheet: null,
    };

    const selectedTabList = tabs.filter(t => selectedTabs[t.id]);

    if (includeSummary) {
      const allKpis = selectedTabList.flatMap(t => t.categories.flatMap(c => c.kpis || []));
      const statusCounts = { green: 0, amber: 0, red: 0, none: 0 };
      allKpis.forEach(k => {
        const s = getStatus(k, periodForReport, fy);
        statusCounts[s.key] = (statusCounts[s.key] || 0) + 1;
      });
      reportData.summary = { totalKpis: allKpis.length, statusCounts, tabs: selectedTabList.map(t => t.name) };
    }

    selectedTabList.forEach(tab => {
      if (tab.custom) return;
      const section = { name: tab.name, categories: [] };
      tab.categories.forEach(cat => {
        const catData = { name: cat.name, kpis: [] };
        (cat.kpis || []).forEach(k => {
          const v = periodValues(k, periodForReport, fy);
          const status = getStatus(k, periodForReport, fy);
          const variance = getVariance(k, periodForReport, fy);
          const split = buildSplitRows(k);
          catData.kpis.push({
            id: k.id, name: k.name, units: k.units, frequency: k.frequency || "Monthly",
            direction: k.direction, actual: v.actual, budget: v.budget, variance,
            status: status.label, statusKey: status.key, notes: k.notes || "",
            splitTitle: split.title, splitRows: split.rows,
          });
        });
        section.categories.push(catData);
      });
      reportData.sections.push(section);
    });

    if (includeEquity) reportData.equity = { dividends: dividends || [], investors: investors || [], irrInvestments: irrInvestments || [] };
    if (includeLoans) reportData.loans = meta.loans || [];

    if (includeBalanceSheet) {
      const months = fyMonths(fy.startYear, fy.startMonth);
      const cm = months.find((m) => m.key === currentMonthKey()) || months[0];
      const bsDoc = docs[`${DOC.bs}_${cm.year}`];
      const bs = bsDoc?.balanceSheetData || BLANK_BS;
      const totals = bsTotals({ balanceSheetData: bs }, cm.month);
      reportData.balanceSheet = {
        month: cm.long,
        totals: { assets: totals.assets, liabilities: totals.liabilities, equity: totals.equity,
          currentAssets: totals.currentAssets, currentLiabilities: totals.currentLiabilities, cash: totals.cash },
        hasData: monthHasBs(bs, cm.month),
      };
    }

    if (includeActions) {
      const financialActions = actions.filter(a =>
        a.sourceModule === "Financial Performance" || a.category === "Financial Performance" ||
        a.sourceCategory?.includes("Financial"));
      reportData.actions = financialActions.map(a => ({
        title: a.title, description: a.description, status: a.status, dueDate: a.dueDate,
        assignedTo: a.assignedTo, category: a.category, sourceKpi: a.sourceKpi, meetingTitle: a.meetingTitle,
      }));
    }

    const htmlContent = generateWordHTML(reportData, includeAnalysis);
    const blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportTitle.replace(/[^a-zA-Z0-9]/g, "_")}.doc`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setGenerating(false);
    onClose();
  };

  const generateWordHTML = (data, includeAnalysis) => {
    const statusColor = (key) => key === "green" ? "#166534" : key === "amber" ? "#92400e" : key === "red" ? "#991b1b" : "#6b5b55";
    const statusBg = (key) => key === "green" ? "#f0fdf4" : key === "amber" ? "#fffbeb" : key === "red" ? "#fef2f2" : "#f2eeec";
    const fmtVal = (v, units) => {
      if (v === null || v === undefined || v === "") return "—";
      const n = Number(v);
      if (!Number.isFinite(n)) return "—";
      if (units === "%") return `${trimNum(n)}%`;
      if (units === "×") return `${n.toFixed(2)}×`;
      if (units === "R") {
        const a = Math.abs(n);
        if (a >= 1_000_000) return `R ${(n / 1_000_000).toFixed(1)}m`;
        if (a >= 1_000) return `R ${(n / 1_000).toFixed(1)}k`;
        return `R ${n.toFixed(0)}`;
      }
      if (units && !["#","%","R","×"].includes(units)) return `${trimNum(n)} ${units}`;
      return trimNum(n);
    };

    const kpiSummaryTable = (kpis) => {
      if (!kpis.length) return "";
      let html = `<table style="width:100%; border-collapse:collapse; font-size:10pt; margin:8px 0;">
        <thead><tr style="background:#241813; color:#fff;">
          <th style="padding:6px 10px; text-align:left; border:1px solid #ddd;">KPI</th>
          <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Frequency</th>
          <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Units</th>
          <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Budget</th>
          <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Actual</th>
          <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Variance</th>
          <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Status</th>
        </tr></thead><tbody>`;
      kpis.forEach((k, i) => {
        const bg = i % 2 === 0 ? "#ffffff" : "#faf8f7";
        html += `<tr style="background:${bg};">
          <td style="padding:6px 10px; border:1px solid #ddd; font-weight:500;">${k.name}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center; font-size:9pt;">${k.frequency}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">${k.units}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">${fmtVal(k.budget, k.units)}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center; font-weight:600;">${fmtVal(k.actual, k.units)}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center; color:${k.variance !== null && k.variance >= 0 ? '#166534' : '#991b1b'};">${k.variance !== null ? fmtVal(k.variance, k.units) : "—"}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;"><span style="background:${statusBg(k.statusKey)}; color:${statusColor(k.statusKey)}; padding:2px 12px; border-radius:12px; font-weight:600; font-size:9pt;">${k.status}</span></td>
        </tr>`;
      });
      return html + `</tbody></table>`;
    };

    const kpiSplitTable = (kpi) => {
      if (!kpi.splitRows || !kpi.splitRows.length) return "";
      let html = `<h4 style="color:#4a352f; font-size:11pt; margin:14px 0 4px;">${kpi.name} — ${kpi.splitTitle}</h4>
        <table style="width:100%; border-collapse:collapse; font-size:9pt; margin:4px 0 12px;">
          <thead><tr style="background:#e9e3df; color:#2d201c;">
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:left;">Period</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Target</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Actual</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Variance</th>
          </tr></thead><tbody>`;
      kpi.splitRows.forEach((r) => {
        const variance = Number.isFinite(Number(r.actual)) && Number.isFinite(Number(r.budget))
          ? Number(r.actual) - Number(r.budget) : null;
        html += `<tr>
          <td style="padding:4px 8px; border:1px solid #ddd;">${r.label}</td>
          <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${fmtVal(r.budget, kpi.units)}</td>
          <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${fmtVal(r.actual, kpi.units)}</td>
          <td style="padding:4px 8px; border:1px solid #ddd; text-align:center; color:${variance !== null && variance >= 0 ? '#166534' : '#991b1b'};">${variance !== null ? fmtVal(variance, kpi.units) : "—"}</td>
        </tr>`;
      });
      return html + `</tbody></table>`;
    };

    let sectionsHtml = "";
    data.sections.forEach(section => {
      sectionsHtml += `<h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">${section.name}</h2>`;
      section.categories.forEach(cat => {
        if (cat.kpis.length) {
          sectionsHtml += `<h3 style="color:#4a352f; font-size:12pt; margin:12px 0 6px;">${cat.name}</h3>${kpiSummaryTable(cat.kpis)}`;
          if (data.includeSplit) {
            cat.kpis.forEach((k) => { sectionsHtml += kpiSplitTable(k); });
          }
        }
      });
    });

    let equityHtml = "";
    if (data.equity && (data.equity.dividends.length || data.equity.investors.length)) {
      equityHtml = `<h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">Equity Structure</h2>`;
      if (data.equity.dividends.length) {
        let rows = "";
        data.equity.dividends.forEach((d, i) => {
          const bg = i % 2 === 0 ? "#ffffff" : "#faf8f7";
          rows += `<tr style="background:${bg};">
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${d.year}</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">R${(d.amountPerShare || 0).toFixed(2)}</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${(d.totalShares || 0).toLocaleString()}</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">R${(d.totalIssued || 0).toFixed(2)}</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${d.paymentDate || "—"}</td>
          </tr>`;
        });
        equityHtml += `<h3 style="color:#4a352f; font-size:12pt; margin:12px 0 6px;">Dividend History</h3>
          <table style="width:100%; border-collapse:collapse; font-size:9pt; margin:8px 0;">
            <thead><tr style="background:#241813; color:#fff;">
              <th style="padding:4px 8px; border:1px solid #ddd;">Year</th>
              <th style="padding:4px 8px; border:1px solid #ddd;">Amount/Share</th>
              <th style="padding:4px 8px; border:1px solid #ddd;">Total Shares</th>
              <th style="padding:4px 8px; border:1px solid #ddd;">Total Issued</th>
              <th style="padding:4px 8px; border:1px solid #ddd;">Payment Date</th>
            </tr></thead><tbody>${rows}</tbody></table>`;
      }
      if (data.equity.investors.length) {
        let rows = "";
        const totalShares = data.equity.investors.reduce((s, inv) => s + inv.shares, 0);
        data.equity.investors.forEach((inv, i) => {
          const bg = i % 2 === 0 ? "#ffffff" : "#faf8f7";
          const pct = totalShares > 0 ? ((inv.shares / totalShares) * 100).toFixed(1) : 0;
          rows += `<tr style="background:${bg};">
            <td style="padding:4px 8px; border:1px solid #ddd;">${inv.name}</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${pct}%</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">R${(inv.investment || 0).toFixed(1)}</td>
          </tr>`;
        });
        equityHtml += `<h3 style="color:#4a352f; font-size:12pt; margin:12px 0 6px;">Cap Table</h3>
          <table style="width:100%; border-collapse:collapse; font-size:9pt; margin:8px 0;">
            <thead><tr style="background:#241813; color:#fff;">
              <th style="padding:4px 8px; border:1px solid #ddd;">Investor</th>
              <th style="padding:4px 8px; border:1px solid #ddd;">Shares</th>
              <th style="padding:4px 8px; border:1px solid #ddd;">Investment</th>
            </tr></thead><tbody>${rows}</tbody></table>`;
      }
    }

    let loansHtml = "";
    if (data.loans && data.loans.length) {
      let rows = "";
      let totalScheduled = 0, totalPaid = 0;
      data.loans.forEach((l, i) => {
        const bg = i % 2 === 0 ? "#ffffff" : "#faf8f7";
        const s = parseFloat(l.scheduled) || 0;
        const p = parseFloat(l.paid) || 0;
        totalScheduled += s; totalPaid += p;
        rows += `<tr style="background:${bg};">
          <td style="padding:4px 8px; border:1px solid #ddd;">${l.name}</td>
          <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">R${s.toFixed(0)}</td>
          <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">R${p.toFixed(0)}</td>
          <td style="padding:4px 8px; border:1px solid #ddd; text-align:center; color:${p - s <= 0 ? '#166534' : '#991b1b'};">R${(p - s).toFixed(0)}</td>
        </tr>`;
      });
      loansHtml = `<h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">Loan Repayments</h2>
        <table style="width:100%; border-collapse:collapse; font-size:9pt; margin:8px 0;">
          <thead><tr style="background:#241813; color:#fff;">
            <th style="padding:4px 8px; border:1px solid #ddd;">Loan</th>
            <th style="padding:4px 8px; border:1px solid #ddd;">Scheduled</th>
            <th style="padding:4px 8px; border:1px solid #ddd;">Paid</th>
            <th style="padding:4px 8px; border:1px solid #ddd;">Variance</th>
          </tr></thead><tbody>${rows}</tbody>
          <tfoot><tr style="background:#f4efec; font-weight:700;">
            <td style="padding:4px 8px; border:1px solid #ddd;">Total</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">R${totalScheduled.toFixed(0)}</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">R${totalPaid.toFixed(0)}</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center; color:${totalPaid - totalScheduled <= 0 ? '#166534' : '#991b1b'};">R${(totalPaid - totalScheduled).toFixed(0)}</td>
          </tr></tfoot></table>`;
    }

    let bsHtml = "";
    if (data.balanceSheet && data.balanceSheet.hasData) {
      const b = data.balanceSheet;
      bsHtml = `<h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">Balance Sheet</h2>
        <p style="font-size:10pt; color:#6b5b55;">As at ${b.month}</p>
        <table style="width:60%; border-collapse:collapse; font-size:10pt; margin:8px 0;">
          <tr style="background:#241813; color:#fff;"><th style="padding:6px 12px; border:1px solid #ddd; text-align:left;">Item</th><th style="padding:6px 12px; border:1px solid #ddd; text-align:right;">Amount (R)</th></tr>
          <tr><td style="padding:6px 12px; border:1px solid #ddd;">Total Assets</td><td style="padding:6px 12px; border:1px solid #ddd; text-align:right; font-weight:600;">${fmtVal(b.totals.assets, "R")}</td></tr>
          <tr style="background:#faf8f7;"><td style="padding:6px 12px; border:1px solid #ddd;">Total Liabilities</td><td style="padding:6px 12px; border:1px solid #ddd; text-align:right; font-weight:600;">${fmtVal(b.totals.liabilities, "R")}</td></tr>
          <tr><td style="padding:6px 12px; border:1px solid #ddd;">Total Equity</td><td style="padding:6px 12px; border:1px solid #ddd; text-align:right; font-weight:600;">${fmtVal(b.totals.equity, "R")}</td></tr>
          <tr style="background:#f4efec; font-weight:700;"><td style="padding:6px 12px; border:1px solid #ddd;">Net Asset Value</td><td style="padding:6px 12px; border:1px solid #ddd; text-align:right;">${fmtVal((b.totals.assets || 0) - (b.totals.liabilities || 0), "R")}</td></tr>
        </table>`;
    }

    let analysisHtml = "";
    if (includeAnalysis) {
      analysisHtml = `<h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">Analysis & Observations</h2><div style="font-size:10pt; line-height:1.6;">`;
      data.sections.forEach(s => s.categories.forEach(c => c.kpis.forEach(k => {
        if (k.statusKey === "red" || k.statusKey === "amber") {
          analysisHtml += `<div style="background:${statusBg(k.statusKey)}; padding:8px 12px; margin:6px 0; border-radius:4px; border-left:3px solid ${statusColor(k.statusKey)};">
            <strong>${k.name}</strong> — ${k.status}${k.variance !== null ? ` (${k.variance >= 0 ? "+" : ""}${fmtVal(k.variance, k.units)})` : ""}
            ${k.notes ? `<br><span style="color:#6b5b55; font-size:9pt;">Note: ${k.notes}</span>` : ""}
          </div>`;
        }
      })));
      const all = data.sections.flatMap(s => s.categories.flatMap(c => c.kpis || []));
      const reds = all.filter(k => k.statusKey === "red");
      const ambers = all.filter(k => k.statusKey === "amber");
      const greens = all.filter(k => k.statusKey === "green");
      analysisHtml += `<div style="background:#faf8f7; padding:12px 16px; margin:12px 0; border-radius:6px;">
        <p><strong>Summary:</strong> ${greens.length} on budget · ${ambers.length} needs attention · ${reds.length} critical</p>
        ${reds.length ? `<p style="color:#991b1b;"><strong>Critical:</strong> ${reds.map(k => k.name).join(", ")}</p>` : ""}
        ${ambers.length ? `<p style="color:#92400e;"><strong>Needs attention:</strong> ${ambers.map(k => k.name).join(", ")}</p>` : ""}
      </div></div>`;
    }

    let actionsHtml = "";
    if (data.actions.length) {
      let rows = "";
      data.actions.forEach(a => {
        const colors = { "Done": "#166534", "In Progress": "#92400e", "Not Done": "#991b1b" };
        rows += `<tr>
          <td style="padding:6px 10px; border:1px solid #ddd;">${a.title}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; font-size:9pt;">${a.description || "—"}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">${a.assignedTo || "—"}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">${a.dueDate || "—"}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center; color:${colors[a.status] || "#6b5b55"}; font-weight:600;">${a.status}</td>
        </tr>`;
      });
      actionsHtml = `<h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">Actions</h2>
        <table style="width:100%; border-collapse:collapse; font-size:9pt;">
          <thead><tr style="background:#241813; color:#fff;">
            <th style="padding:6px 10px; border:1px solid #ddd;">Action</th><th style="padding:6px 10px; border:1px solid #ddd;">Description</th>
            <th style="padding:6px 10px; border:1px solid #ddd;">Owner</th><th style="padding:6px 10px; border:1px solid #ddd;">Due</th>
            <th style="padding:6px 10px; border:1px solid #ddd;">Status</th>
          </tr></thead><tbody>${rows}</tbody></table>`;
    }

    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>${data.title}</title>
      <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
      <style>body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #2d201c; } h1 { font-size: 22pt; font-weight: 600; } .subtitle { color: #6b5b55; font-size: 11pt; margin-bottom: 24px; } table { page-break-inside: auto; } tr { page-break-inside: avoid; } @page { margin: 2cm; }</style>
      </head><body>
      <h1>${data.title}</h1>
      <div class="subtitle">Generated ${new Date(data.generated).toLocaleDateString()} · ${data.period} · FY ${data.financialYear}<br>${data.userName}</div>
      ${data.summary ? `<div style="background:#faf8f7; padding:12px 16px; border-radius:6px; margin-bottom:16px;"><p style="font-size:11pt; margin:0;"><strong>${data.summary.totalKpis} KPIs</strong> · ${data.summary.statusCounts.green} on budget · ${data.summary.statusCounts.amber} needs attention · ${data.summary.statusCounts.red} critical</p></div>` : ""}
      ${sectionsHtml}${loansHtml}${equityHtml}${bsHtml}${analysisHtml}${actionsHtml}
      <p style="color:#8a7a74; font-size:8pt; text-align:center; margin-top:40px; border-top:1px solid #ded8d4; padding-top:16px;">Financial Performance Report · Generated from RAPS Platform</p>
      </body></html>`;
  };

  return (
    <Modal title="Generate Financial Report" subtitle="Select what to include in the Word document" icon={<FileText size={17} />} onClose={onClose} width={680}
      footer={
        <>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={generateReport} disabled={generating || !Object.values(selectedTabs).some(v => v)}
            style={{ ...btnPrimary, opacity: generating || !Object.values(selectedTabs).some(v => v) ? 0.6 : 1 }}>
            {generating ? "Generating..." : <><Download size={14} /> Generate Report</>}
          </button>
        </>
      }>
      <div style={{ marginBottom: "16px" }}>
        <label style={labelS}>Report Title</label>
        <input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} style={inputS} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
        <div>
          <label style={labelS}>Period</label>
          <Select value={periodForReport} onChange={(e) => setPeriodForReport(e.target.value)}>
            {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </Select>
        </div>
        <div>
          <label style={labelS}>Financial Year</label>
          <div style={{ padding: "9px 11px", background: T.panel, border: `1px solid ${T.lineStrong}`, borderRadius: "8px", fontSize: "13.5px", color: T.body }}>
            FY {fyLabel(fy.startYear, fy.startMonth)}
          </div>
        </div>
      </div>
      <div style={{ marginBottom: "16px" }}>
        <label style={labelS}>Sections to include</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {tabs.map((t) => (
            <label key={t.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer", padding: "4px 0" }}>
              <input type="checkbox" checked={selectedTabs[t.id]} onChange={() => setSelectedTabs(p => ({ ...p, [t.id]: !p[t.id] }))} />
              {t.name}
            </label>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: "16px" }}>
        <label style={labelS}>Include</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer" }}>
            <input type="checkbox" checked={includeSummary} onChange={() => setIncludeSummary(!includeSummary)} /> Summary header
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer" }}>
            <input type="checkbox" checked={includeSplit} onChange={() => setIncludeSplit(!includeSplit)} /> <strong>Split tables (daily / weekly / monthly)</strong>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer" }}>
            <input type="checkbox" checked={includeAnalysis} onChange={() => setIncludeAnalysis(!includeAnalysis)} /> Analysis & observations
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer" }}>
            <input type="checkbox" checked={includeEquity} onChange={() => setIncludeEquity(!includeEquity)} /> Equity Structure
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer" }}>
            <input type="checkbox" checked={includeLoans} onChange={() => setIncludeLoans(!includeLoans)} /> Loan Repayments
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer" }}>
            <input type="checkbox" checked={includeBalanceSheet} onChange={() => setIncludeBalanceSheet(!includeBalanceSheet)} /> Balance Sheet snapshot
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer" }}>
            <input type="checkbox" checked={includeActions} onChange={() => setIncludeActions(!includeActions)} /> Actions
          </label>
        </div>
      </div>
      <div style={{ ...cardS, background: T.panel, fontSize: "12.5px", color: T.body }}>
        <Info size={14} color={T.accentSoft} style={{ marginRight: "8px" }} />
        The report includes a native-frequency split table under each KPI: daily KPIs show every day captured, weekly show every week, monthly show all 12 months.
      </div>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   AddChooser + AddKpiWizard
   ════════════════════════════════════════════════════════════════════════ */
const AddChooser = ({ onPick, onClose }) => (
  <Modal title="What would you like to do?" icon={<Plus size={17} />} onClose={onClose} width={580}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
      {[
        { key: "data", icon: <Database size={22} />, title: "Add Data",
          body: "Enter figures for KPIs, Balance Sheet, Loans, Dividends, Cap Table and IRR — all in one place." },
        { key: "kpi", icon: <Sparkles size={22} />, title: "Add KPI",
          body: "Create a new metric under an existing category, or start a category of your own." },
      ].map((o) => (
        <button key={o.key} onClick={() => onPick(o.key)}
          style={{ padding: "22px 20px", borderRadius: "12px", border: `1px solid ${T.lineStrong}`, background: T.bg,
            cursor: "pointer", textAlign: "left", fontFamily: "inherit", display: "flex", flexDirection: "column", gap: "10px" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = T.accentTint; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.lineStrong; e.currentTarget.style.background = T.bg; }}>
          <span style={{ color: T.accent }}>{o.icon}</span>
          <span style={{ fontSize: "15.5px", fontWeight: 600, color: T.accent }}>{o.title}</span>
          <span style={{ fontSize: "13px", color: T.body, lineHeight: 1.5 }}>{o.body}</span>
        </button>
      ))}
    </div>
  </Modal>
);

const AddKpiWizard = ({ tabs, currentTabId, onBack, onClose, onSave }) => {
  const [form, setForm] = useState({
    id: uid(), name: "", units: "", category: "", tabId: currentTabId || tabs[0]?.id || "summary",
    direction: "higher", aggregate: "avg", frequency: "Monthly", meaning: "", measured: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!form.name.trim()) { setError("KPI name is required."); return; }
    if (!form.units.trim()) { setError("Units are required."); return; }
    if (!form.category.trim()) { setError("Category is required."); return; }
    setSaving(true); setError("");
    try { await onSave({ ...form, kpis: [] }); onClose(); }
    catch (err) { setError(errText(err)); setSaving(false); }
  };

  const tabOptions = tabs.filter(t => !t.custom);
  const catOptions = (tabs.find(t => t.id === form.tabId)?.categories || []).map(c => c.name).filter(Boolean);

  return (
    <Modal title="Add Custom KPI" subtitle="Define a new metric to track on your dashboard" icon={<Plus size={17} />} onClose={onClose} width={560}
      footer={
        <>
          <button onClick={onBack} style={btnGhost}><ArrowLeft size={13} /> Back</button>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Create KPI"}</button>
        </>
      }>
      {error && <div style={{ color: T.red, marginBottom: "12px", fontSize: "13px", background: T.redBg, padding: "10px 12px", borderRadius: "8px" }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div><label style={labelS}>KPI Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputS} /></div>
        <div><label style={labelS}>Units *</label>
          <input value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} style={inputS} placeholder="e.g. R, %, ×" /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div><label style={labelS}>Tab</label>
          <Select value={form.tabId} onChange={(e) => setForm({ ...form, tabId: e.target.value, category: "" })}>
            {tabOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select></div>
        <div><label style={labelS}>Category *</label>
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputS} placeholder="New or existing category" list="cat-suggestions" />
          <datalist id="cat-suggestions">{catOptions.map(c => <option key={c} value={c} />)}</datalist>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div><label style={labelS}>Frequency</label>
          <Select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </Select></div>
        <div><label style={labelS}>Direction</label>
          <Select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
            {DIRECTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </Select></div>
        <div><label style={labelS}>Aggregate</label>
          <Select value={form.aggregate} onChange={(e) => setForm({ ...form, aggregate: e.target.value })}>
            <option value="avg">Average across periods</option>
            <option value="sum">Sum across periods</option>
          </Select></div>
      </div>
      <div style={{ marginBottom: "12px" }}>
        <label style={labelS}>Meaning</label>
        <textarea rows="2" value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })} style={{ ...inputS, resize: "vertical" }} />
      </div>
      <div>
        <label style={labelS}>How is it measured?</label>
        <textarea rows="3" value={form.measured} onChange={(e) => setForm({ ...form, measured: e.target.value })} style={{ ...inputS, resize: "vertical" }} />
      </div>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Add Data — unified wizard (full-width, all 12 months visible)
   ════════════════════════════════════════════════════════════════════════ */
const AddDataWizard = ({
  tabs, fy, docs, prefs, onSavePrefs, onBack, onClose, onSaveField, currentTabId,
  meta, dividends, investors, irrInvestments,
  onSaveDividends, onSaveCapTable, onSaveLoans,
  onSaveBsFull, onDeleteLine, onDeleteSection,
}) => {
  const editableTabs = tabs.filter((t) => {
    const hasEditableKpis = t.categories.some((c) => (c.kpis || []).some((k) => k.field));
    const hasPanel = t.custom === "balanceSheet" || t.custom === "equity" ||
      t.categories.some((c) => c.custom === "loans");
    return hasEditableKpis || hasPanel;
  });

  const [tabId, setTabId] = useState(
    prefs?.tabId && editableTabs.some((t) => t.id === prefs.tabId) ? prefs.tabId
      : editableTabs.some((t) => t.id === currentTabId) ? currentTabId
      : editableTabs[0]?.id
  );
  const [startYear, setStartYear] = useState(prefs?.startYear ?? fy.startYear);
  const [showCount, setShowCount] = useState(prefs?.showCount || 12);
  const [startMonthOffset, setStartMonthOffset] = useState(prefs?.startMonthOffset || 0);
  const [draft, setDraft] = useState({});
  const [saveState, setSaveState] = useState("idle");
  const timer = useRef(null);

  /* ── Single-column mode with a switch ──────────────────────────────── */
  const [mode, setMode] = useState(prefs?.mode || "actual");
  const [globalMode, setGlobalMode] = useState(prefs?.globalMode ?? true);
  const [monthModes, setMonthModes] = useState(() => prefs?.monthModes || {});

  const tab = editableTabs.find((t) => t.id === tabId) || editableTabs[0];
  const allMonths = useMemo(() => fyMonths(startYear, fy.startMonth), [startYear, fy.startMonth]);

  const months = useMemo(() => {
    const start = Math.max(0, Math.min(startMonthOffset, allMonths.length - 1));
    const end = Math.min(allMonths.length, start + showCount);
    return allMonths.slice(start, end);
  }, [allMonths, startMonthOffset, showCount]);

  const rows = useMemo(() => {
    if (!tab) return [];
    const out = [];
    if (tab.custom === "balanceSheet" || tab.custom === "equity") {
      out.push({ kpi: { id: `panel_${tab.custom}`, name: tab.name, units: "", field: null,
        panel: tab.custom, isPanel: true }, category: tab.name, isPanel: true });
      return out;
    }
    tab.categories.forEach((cat) => {
      if (cat.custom === "loans") {
        out.push({ kpi: { id: `panel_loans`, name: cat.name, units: "", field: null,
          panel: "loans", isPanel: true }, category: cat.name, isPanel: true });
        return;
      }
      (cat.kpis || []).forEach((k) => {
        if (k.field) out.push({ kpi: k, category: cat.name, isPanel: false });
      });
    });
    return out;
  }, [tab]);

  const hasPanelData = tab?.custom === "balanceSheet" || tab?.custom === "equity" ||
    tab?.categories.some((c) => c.custom === "loans");

  const draftKey = (kpiId, monthIdx, which) => `${monthIdx}|${kpiId}|${which}`;

  const value = (kpi, monthIdx, which) => {
    const dk = draftKey(kpi.id, monthIdx, which);
    if (draft[dk] !== undefined) return draft[dk];
    if (!kpi.field) return "";
    const path = which === "actual" ? kpi.field.a : kpi.field.b;
    if (!path) return "";
    const year = months.find((m) => m.month === monthIdx)?.year || startYear;
    const docKey = `${DOC[kpi.field.src]}_${year}`;
    const raw = pathArr(path).reduce((o, k) => (o == null ? undefined : o[k]), docs[docKey]);
    const v = Array.isArray(raw) ? raw[monthIdx] : null;
    return v === undefined || v === null ? "" : String(v);
  };

  const setValue = (kpi, monthIdx, which, raw) => {
    const dk = draftKey(kpi.id, monthIdx, which);
    setDraft((p) => ({ ...p, [dk]: raw }));
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const year = months.find((m) => m.month === monthIdx)?.year || startYear;
      await onSaveField({ kpi, which, raw, year, monthIndex: monthIdx });
      onSavePrefs({ tabId, startYear, showCount, startMonthOffset, mode, globalMode, monthModes });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1800);
    }, 800);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  /* Persist mode prefs on change */
  useEffect(() => {
    onSavePrefs({ tabId, startYear, showCount, startMonthOffset, mode, globalMode, monthModes });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, globalMode, monthModes]);

  const yearOptions = [
    { value: fy.startYear - 1, badge: "FY−", label: fyLabel(fy.startYear - 1, fy.startMonth) },
    { value: fy.startYear,     badge: "FY",  label: fyLabel(fy.startYear, fy.startMonth) },
    { value: fy.startYear + 1, badge: "FY+", label: fyLabel(fy.startYear + 1, fy.startMonth) },
  ];

  if (!tab) {
    return (
      <Modal title="Add Data" icon={<Database size={17} />} onClose={onClose} width={520}
        footer={<button onClick={onClose} style={btnPrimary}>Close</button>}>
        <p style={{ fontSize: "14px", color: T.body, margin: 0 }}>Nothing here takes direct input.</p>
      </Modal>
    );
  }

  const kpiRows = rows.filter((r) => !r.isPanel);

  /* Colour tokens for the two modes */
  const MODE_TOKENS = {
    budget: {
      label: "Budget",
      headerBg: "#1e3a8a",
      headerColor: "#dbeafe",
      cellBg: "#eff6ff",
      cellBorder: "#bfdbfe",
      inputBorder: "#bfdbfe",
      inputFocus: "#2563eb",
      inputFocusRing: "rgba(37,99,235,0.15)",
      inputColor: "#1e3a8a",
    },
    actual: {
      label: "Actual",
      headerBg: "#166534",
      headerColor: "#dcfce7",
      cellBg: "#f0fdf4",
      cellBorder: "#bbf7d0",
      inputBorder: "#bbf7d0",
      inputFocus: "#16a34a",
      inputFocusRing: "rgba(22,163,74,0.15)",
      inputColor: "#166534",
    },
  };

  const effectiveModeForMonth = (m) => (globalMode ? mode : (monthModes[m.key] || mode));
  const toggleModeForMonth = (m) => {
    if (globalMode) {
      setMode((v) => (v === "budget" ? "actual" : "budget"));
    } else {
      setMonthModes((p) => ({ ...p, [m.key]: (p[m.key] || mode) === "budget" ? "actual" : "budget" }));
    }
  };

  /* Full-width modal — expands to fit all months without horizontal scroll */
  // Base widths: KPI col ~180, each month ~86 (comfortable for R 1,250,000 style numbers)
  const minGridWidth = 180 + months.length * 86;

  return (
    <Modal
      title="Add Data"
      subtitle={`Financial year starts in ${MONTHS[fy.startMonth]} · Everything saves as you type`}
      icon={<Database size={17} />}
      onClose={onClose}
      width={Math.max(1000, Math.min(minGridWidth + 80, Math.max(window.innerWidth - 40, 1000)))}
      footer={
        <>
          <button onClick={onBack} style={btnGhost}><ArrowLeft size={13} /> Back</button>
          <span style={{ flex: 1, fontSize: "12.5px", color: saveState === "saved" ? T.green : T.muted, textAlign: "left" }}>
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Everything saves automatically"}
          </span>
          <button onClick={onClose} style={btnPrimary}>Done</button>
        </>
      }>

      {/* Top controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "12px", alignItems: "end" }}>
        <div>
          <label style={labelS}>Financial year</label>
          <select value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} style={selectS}>
            {yearOptions.map((y) => <option key={y.value} value={y.value}>{y.badge} {y.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelS}>Section</label>
          <select value={tabId} onChange={(e) => setTabId(e.target.value)} style={selectS}>
            {editableTabs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelS}>Starting from</label>
          <select value={startMonthOffset} onChange={(e) => setStartMonthOffset(Number(e.target.value))} style={selectS}>
            {allMonths.map((m, i) => <option key={m.key} value={i}>{m.long}</option>)}
          </select>
        </div>
        <div>
          <label style={labelS}>Show</label>
          <select value={showCount} onChange={(e) => setShowCount(Number(e.target.value))} style={selectS}>
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months (full year)</option>
          </select>
        </div>
        <div>
          <label style={labelS}>Periods shown</label>
          <div style={{ padding: "9px 11px", background: T.panel, border: `1px solid ${T.lineStrong}`,
            borderRadius: "8px", fontSize: "13.5px", color: T.body }}>
            {months.length} months
          </div>
        </div>
      </div>

      {hasPanelData && tab.custom === "balanceSheet" && (
        <BalanceSheetTab fy={fy} docs={docs} readOnly={false}
          onSaveBsFull={onSaveBsFull} onDeleteLine={onDeleteLine} onDeleteSection={onDeleteSection} />
      )}

      {hasPanelData && tab.custom === "equity" && (
        <>
          <DividendHistory dividends={dividends} readOnly={false} onSave={onSaveDividends} />
          <CapTableOverview investors={investors} irrInvestments={irrInvestments} readOnly={false} onSaveCapTable={onSaveCapTable} />
        </>
      )}

      {hasPanelData && tab.categories.some((c) => c.custom === "loans") && (
        <LoanRepaymentsPanel loans={meta.loans || []} readOnly={false} onSave={onSaveLoans} />
      )}

      {kpiRows.length > 0 && (
        <>
          {/* Mode switcher bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
            padding: "10px 14px", marginBottom: "10px",
            background: T.panel, border: `1px solid ${T.line}`, borderRadius: "10px",
          }}>
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: T.accent }}>Showing:</span>

            {/* Two-pill switch */}
            <div style={{ display: "inline-flex", background: T.raised, borderRadius: "999px", padding: "3px" }}>
              <button
                onClick={() => setMode("budget")}
                style={{
                  padding: "6px 16px", borderRadius: "999px", border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontSize: "12.5px", fontWeight: 700,
                  background: mode === "budget" ? "#1e3a8a" : "transparent",
                  color: mode === "budget" ? "#fff" : T.body,
                  boxShadow: mode === "budget" ? "0 1px 3px rgba(0,0,0,0.18)" : "none",
                }}>
                Budget
              </button>
              <button
                onClick={() => setMode("actual")}
                style={{
                  padding: "6px 16px", borderRadius: "999px", border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontSize: "12.5px", fontWeight: 700,
                  background: mode === "actual" ? "#166534" : "transparent",
                  color: mode === "actual" ? "#fff" : T.body,
                  boxShadow: mode === "actual" ? "0 1px 3px rgba(0,0,0,0.18)" : "none",
                }}>
                Actual
              </button>
            </div>

            {/* Global vs per-month switch */}
            <label style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "12.5px", color: T.body, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={globalMode}
                onChange={() => setGlobalMode((v) => !v)}
              />
              Use the same mode for every month
            </label>

            <span style={{ flex: 1 }} />

            <span style={{ fontSize: "11.5px", color: T.muted, display: "flex", alignItems: "center", gap: "5px" }}>
              <Info size={12} />
              {globalMode
                ? "One column per month — switch modes to see the other set of figures."
                : "Each month has its own tiny switch. Click the ⇄ in the header to flip that month."}
            </span>
          </div>

          {/* Entry grid — no fixed height, no horizontal scroll, all months visible */}
          <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
            <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%",
              tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{
                    padding: "10px 12px", fontSize: "11px", fontWeight: 700, color: "#fff",
                    textTransform: "uppercase", letterSpacing: "0.5px",
                    background: T.header, textAlign: "left",
                    width: "180px",
                    borderRight: `2px solid ${T.lineStrong}`,
                  }}>
                    KPI
                  </th>
                  {months.map((m) => {
                    const mk = effectiveModeForMonth(m);
                    return (
                      <th key={m.key} style={{
                        padding: "8px 4px 6px", fontSize: "11px", fontWeight: 700, color: "#fff",
                        background: T.header, textAlign: "center",
                        borderRight: "1px solid rgba(255,255,255,0.18)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          <span>{m.label}</span>
                          {!globalMode && (
                            <button
                              onClick={() => toggleModeForMonth(m)}
                              title={`Switch to ${mk === "budget" ? "Actual" : "Budget"}`}
                              style={{
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                width: 18, height: 18, borderRadius: "50%",
                                border: "1px solid rgba(255,255,255,0.4)",
                                background: "rgba(255,255,255,0.12)",
                                color: "#fff", cursor: "pointer", padding: 0,
                                fontSize: "9px", fontWeight: 700,
                              }}>
                              ⇄
                            </button>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
                <tr>
                  <th style={{
                    padding: "6px 12px", background: T.header,
                    borderRight: `2px solid ${T.lineStrong}`,
                  }} />
                  {months.map((m) => {
                    const mk = effectiveModeForMonth(m);
                    const tok = MODE_TOKENS[mk];
                    return (
                      <th key={m.key} style={{
                        padding: "5px 4px", fontSize: "10px", fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.4px",
                        color: tok.headerColor, background: tok.headerBg,
                        textAlign: "center",
                        borderRight: "1px solid rgba(255,255,255,0.15)",
                      }}>
                        {tok.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {kpiRows.map(({ kpi, category }, i) => {
                  const hasBudgetField = !!kpi.field?.b;
                  const bg = i % 2 ? T.panel : T.bg;
                  return (
                    <tr key={kpi.id} style={{ background: bg }}>
                      <td style={{
                        padding: "8px 12px", fontSize: "12.5px", color: T.ink,
                        borderBottom: `1px solid ${T.lineSoft}`,
                        borderRight: `2px solid ${T.lineStrong}`,
                        background: bg,
                      }}>
                        <div style={{ fontWeight: 600, fontSize: "12.5px", lineHeight: 1.3 }}>{kpi.name}</div>
                        <div style={{ fontSize: "10.5px", color: T.muted, marginTop: "2px", display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                          <span>{category}</span>
                          <span style={{
                            padding: "1px 6px", borderRadius: "999px",
                            background: T.raised, color: T.accentSoft, fontWeight: 600,
                            fontSize: "9.5px",
                          }}>{kpi.units}</span>
                        </div>
                      </td>

                      {months.map((m) => {
                        const mk = effectiveModeForMonth(m);
                        const tok = MODE_TOKENS[mk];
                        const val = value(kpi, m.month, mk);
                        const disabled = mk === "budget" && !hasBudgetField;

                        return (
                          <td key={m.key} style={{
                            padding: "3px 4px", borderBottom: `1px solid ${T.lineSoft}`,
                            borderRight: `1px solid ${tok.cellBorder}`,
                            background: val !== "" ? tok.cellBg : bg,
                          }}>
                            {disabled ? (
                              <div style={{
                                textAlign: "center", fontSize: "12px",
                                color: T.faint, padding: "7px 2px",
                              }}>—</div>
                            ) : (
                              <input
                                type="number"
                                step="any"
                                value={val}
                                placeholder="—"
                                onChange={(e) => setValue(kpi, m.month, mk, e.target.value)}
                                style={{
                                  width: "100%", padding: "6px 4px",
                                  border: `1.5px solid ${tok.inputBorder}`,
                                  borderRadius: "5px",
                                  fontSize: "12px",
                                  fontFamily: "inherit",
                                  fontVariantNumeric: "tabular-nums",
                                  textAlign: "right",
                                  background: "#ffffff",
                                  color: tok.inputColor,
                                  fontWeight: 600,
                                  outline: "none",
                                  boxSizing: "border-box",
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = tok.inputFocus;
                                  e.target.style.boxShadow = `0 0 0 3px ${tok.inputFocusRing}`;
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = tok.inputBorder;
                                  e.target.style.boxShadow = "none";
                                }}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: "11.5px", color: T.muted, marginTop: "10px",
            display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <Info size={12} />
            {globalMode
              ? "Toggle Budget / Actual above to switch every month. Filled cells are tinted."
              : "Click the ⇄ next to any month name to flip just that month."}
          </div>
        </>
      )}

      {kpiRows.length === 0 && !hasPanelData && (
        <div style={{ textAlign: "center", padding: "30px", color: T.muted, fontSize: "13.5px" }}>
          Nothing on this section takes direct input.
        </div>
      )}
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Main
   ════════════════════════════════════════════════════════════════════════ */
const PREFS_KEY = "finPerf.addData.prefs";
const META_DOC = "financialKpiMeta";

const FinancialPerformance = () => {
  const [user, setUser] = useState(null);
  const [fyStartMonth, setFyStartMonth] = useState(0);
  const [docs, setDocs] = useState({});
  const [meta, setMeta] = useState({ kpis: {}, custom: [], hiddenTabs: [], hiddenKpis: [], loans: [] });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [dataPrefs, setDataPrefs] = useState(null);

  const [dividends, setDividends] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [irrInvestments, setIrrInvestments] = useState([]);

  const [isInvestorView, setIsInvestorView] = useState(false);
  const [viewingSMEId, setViewingSMEId] = useState(null);
  const [viewingSMEName, setViewingSMEName] = useState("");
  const [viewOrigin, setViewOrigin] = useState("investor");

  const [activeTabId, setActiveTabId] = useState(TAB_DEFS[0].id);
  const [period, setPeriod] = useState("month");

  const [filters, setFilters] = useState({ category: "all", kpi: "all", units: "all", frequency: "all", status: "all" });
  const [openFilter, setOpenFilter] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [widths, setWidths] = useState(() => ({ ...Object.fromEntries(COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].width])), [ACTIONS_KEY]: 196 }));
  const [visibility, setVisibility] = useState(() => Object.fromEntries(COLUMN_ORDER.map((k) => [k, true])));
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const resizing = useRef(null);

  const [infoKpi, setInfoKpi] = useState(null);
  const [chartKpi, setChartKpi] = useState(null);
  const [analysisKpi, setAnalysisKpi] = useState(null);
  const [actionKpi, setActionKpi] = useState(null);
  const [notesKpi, setNotesKpi] = useState(null);
  const [addFlow, setAddFlow] = useState(null);
  const [manageTabs, setManageTabs] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const fy = useMemo(() => ({ startMonth: fyStartMonth, startYear: fyStartYearOf(new Date(), fyStartMonth) }), [fyStartMonth]);

  const notify = (type, message) => {
    setNotification({ type, message: String(message) });
    setTimeout(() => setNotification(null), 4000);
  };

  const savePrefs = (p) => {
    setDataPrefs(p);
    try { window.localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
  };
  useEffect(() => {
    try { const raw = window.localStorage.getItem(PREFS_KEY); if (raw) setDataPrefs(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const mode = sessionStorage.getItem("investorViewMode");
    const smeId = sessionStorage.getItem("viewingSMEId");
    if (mode === "true" && smeId) {
      setIsInvestorView(true); setViewingSMEId(smeId);
      setViewingSMEName(sessionStorage.getItem("viewingSMEName") || "SME");
      setViewOrigin(sessionStorage.getItem("viewOrigin") || "investor");
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (cu) => setUser(isInvestorView && viewingSMEId ? { uid: viewingSMEId } : cu));
    return () => unsub();
  }, [isInvestorView, viewingSMEId]);

  const loadDocs = useCallback(async (uid_, startMonth) => {
    const base = fyStartYearOf(new Date(), startMonth);
    const years = [base - 1, base, base + 1, base + 2];
    const keys = [];
    years.forEach((y) => Object.values(DOC).forEach((d) => keys.push(`${d}_${y}`)));
    const out = {};
    await Promise.all(keys.map(async (k) => {
      try {
        const snap = await getDoc(doc(db, "users", uid_, "financialData", k));
        if (snap.exists()) out[k] = snap.data();
      } catch (err) { console.error(`Could not load ${k}:`, err); }
    }));
    return out;
  }, []);

  const loadEquityData = useCallback(async (uid_) => {
    try {
      const divSnap = await getDoc(doc(db, "dividend-history", uid_));
      setDividends(divSnap.exists() ? divSnap.data().dividends || [] : []);
      const capSnap = await getDoc(doc(db, "cap-table", uid_));
      if (capSnap.exists()) {
        const data = capSnap.data();
        setInvestors(data.investors || []);
        setIrrInvestments(data.irrInvestments || []);
      } else { setInvestors([]); setIrrInvestments([]); }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    (async () => {
      if (!user?.uid) { setLoading(false); return; }
      try {
        const profile = await getDoc(doc(db, "universalProfiles", user.uid));
        const start = fyStartMonthFromEnd(profile.exists() ? profile.data()?.entityOverview?.financialYearEnd : null);
        setFyStartMonth(start);
        const [loaded, metaSnap] = await Promise.all([
          loadDocs(user.uid, start),
          getDoc(doc(db, "users", user.uid, "financialData", META_DOC)),
        ]);
        setDocs(loaded);
        if (metaSnap.exists()) setMeta({ kpis: {}, custom: [], hiddenTabs: [], hiddenKpis: [], loans: [], ...metaSnap.data() });
        await loadEquityData(user.uid);
      } catch (err) {
        console.error(err);
        notify("error", `Could not load your financial data: ${errText(err)}`);
      } finally { setLoading(false); }
    })();
  }, [user, loadDocs, loadEquityData]);

  const persistMeta = async (next) => {
    setMeta(next);
    if (!user?.uid || isInvestorView) return;
    try {
      await setDoc(doc(db, "users", user.uid, "financialData", META_DOC),
        { ...next, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error(err);
      notify("error", `Changes could not be saved: ${errText(err)}`);
    }
  };

  const writeArrayCell = async ({ docKey, field, monthIndex, raw }) => {
    if (!user?.uid || isInvestorView) return;
    let nextToPersist = null;
    setDocs((prev) => {
      const existing = prev[docKey] || {};
      const arr = Array.isArray(existing[field]) ? [...existing[field]] : Array(12).fill("");
      while (arr.length < 12) arr.push("");
      arr[monthIndex] = raw;
      nextToPersist = { ...existing, [field]: arr };
      return { ...prev, [docKey]: nextToPersist };
    });
    if (nextToPersist) {
      try {
        await setDoc(doc(db, "users", user.uid, "financialData", docKey),
          { ...nextToPersist, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) { console.error(err); notify("error", `Could not save: ${errText(err)}`); }
    }
  };

  const saveKpiField = async ({ kpi, which, raw, year, monthIndex, periodKey }) => {
    const freq = kpi.frequency || "Monthly";

    if (freq === "Daily" || freq === "Weekly") {
      const key = periodKey;
      if (!key) return;
      const entries = { ...(meta.kpis[kpi.id]?.entries || {}) };
      entries[key] = { ...(entries[key] || {}), [which]: parseNum(raw) };
      await persistMeta({ ...meta, kpis: { ...meta.kpis, [kpi.id]: { ...(meta.kpis[kpi.id] || {}), entries } } });
      return;
    }

    if (kpi.custom) {
      const key = `M:${year}-${String(monthIndex + 1).padStart(2, "0")}`;
      const entries = { ...(meta.kpis[kpi.id]?.entries || {}) };
      entries[key] = { ...(entries[key] || {}), [which]: parseNum(raw) };
      await persistMeta({ ...meta, kpis: { ...meta.kpis, [kpi.id]: { ...(meta.kpis[kpi.id] || {}), entries } } });
      return;
    }

    if (!kpi.field) return;
    const field = which === "actual" ? kpi.field.a : kpi.field.b;
    if (!field) return;
    if (Array.isArray(field)) return;
    await writeArrayCell({ docKey: `${DOC[kpi.field.src]}_${year}`, field, monthIndex, raw });
  };

  const saveBsFullDoc = async (docKey, nextBsData) => {
    if (!user?.uid || isInvestorView) return;
    const year = Number(docKey.split("_").pop());
    let nextToPersist = null;
    setDocs((prev) => {
      nextToPersist = { ...(prev[docKey] || {}), balanceSheetData: nextBsData, year, updatedAt: new Date().toISOString() };
      return { ...prev, [docKey]: nextToPersist };
    });
    if (nextToPersist) {
      try {
        await setDoc(doc(db, "users", user.uid, "financialData", docKey), nextToPersist, { merge: true });
      } catch (err) { console.error(err); notify("error", `Could not save: ${errText(err)}`); }
    }
  };

  const bsDeleteLine = async (sectionType, path, key) => {
    if (!window.confirm(`Delete "${key}"? This removes it across all months.`)) return;
    const months = fyMonths(fy.startYear, fy.startMonth);
    const cm = months.find(m => m.key === currentMonthKey()) || months[0];
    const docKey = `${DOC.bs}_${cm.year}`;
    const existing = docs[docKey]?.balanceSheetData || BLANK_BS;
    const next = JSON.parse(JSON.stringify(existing));
    let node = next;
    for (const seg of path.split(".")) node = node[seg];
    if (!node) return;
    delete node[key];
    await saveBsFullDoc(docKey, next);
    notify("success", `Removed "${key}".`);
  };

  const bsDeleteSection = async (sectionType, index) => {
    if (!window.confirm("Delete this whole section? All lines go with it.")) return;
    const months = fyMonths(fy.startYear, fy.startMonth);
    const cm = months.find(m => m.key === currentMonthKey()) || months[0];
    const docKey = `${DOC.bs}_${cm.year}`;
    const existing = docs[docKey]?.balanceSheetData || BLANK_BS;
    const next = JSON.parse(JSON.stringify(existing));
    const field = sectionType === "assets" ? "customCategories"
      : sectionType === "liabilities" ? "customLiabilitiesCategories"
      : "customEquityCategories";
    if (!Array.isArray(next[field])) return;
    next[field].splice(index, 1);
    await saveBsFullDoc(docKey, next);
    notify("success", "Section deleted.");
  };

  const saveDividends = async (data) => {
    if (!user?.uid || isInvestorView) return;
    try {
      await setDoc(doc(db, "dividend-history", user.uid), { dividends: data, lastUpdated: new Date().toISOString() });
      setDividends(data);
      notify("success", "Dividends saved.");
    } catch (err) { console.error(err); notify("error", `Could not save dividends: ${errText(err)}`); }
  };

  const saveCapTable = async (data) => {
    if (!user?.uid || isInvestorView) return;
    try {
      await setDoc(doc(db, "cap-table", user.uid), { ...data, lastUpdated: new Date().toISOString() });
      setInvestors(data.investors || []);
      setIrrInvestments(data.irrInvestments || []);
      notify("success", "Cap table saved.");
    } catch (err) { console.error(err); notify("error", `Could not save cap table: ${errText(err)}`); }
  };

  const saveLoans = async (loans) => { await persistMeta({ ...meta, loans }); };

  const tabs = useMemo(() => {
    const withCustom = TAB_DEFS.map((tab) => {
      if (tab.custom) return { ...tab, categories: [] };
      const cats = tab.categories.map((c) => ({ ...c, kpis: [...(c.kpis || [])] }));
      (meta.custom || []).filter((c) => c.tabId === tab.id).forEach((c) => {
        const kpi = K({ ...c, field: { src: "custom" }, actual: () => null });
        kpi.custom = true;
        const found = cats.find((x) => x.name === c.category);
        if (found) found.kpis.push(kpi); else cats.push({ name: c.category, kpis: [kpi] });
      });
      return { ...tab, categories: cats };
    });

    const months = fyMonths(fy.startYear, fy.startMonth);
    return withCustom.map((tab) => ({
      ...tab,
      categories: tab.categories.map((cat) => ({
        ...cat,
        kpis: (cat.kpis || []).filter((kpi) => !(meta.hiddenKpis || []).includes(kpi.id)).map((kpi) => {
          const entries = {};
          months.forEach((m) => {
            if (kpi.custom) {
              const saved = meta.kpis[kpi.id]?.entries?.[m.key];
              entries[m.key] = { actual: saved?.actual ?? null, budget: saved?.budget ?? null };
            } else {
              const ctx = buildContext(docs, m.year, m.month);
              entries[m.key] = { actual: kpi.actual ? kpi.actual(ctx) : null, budget: kpi.budget ? kpi.budget(ctx) : null };
            }
          });
          const storedEntries = meta.kpis[kpi.id]?.entries || {};
          Object.entries(storedEntries).forEach(([key, v]) => {
            if (key.startsWith("D:") || key.startsWith("W:")) entries[key] = v;
          });
          const saved = meta.kpis[kpi.id] || {};
          return { ...kpi, entries,
            meaning: saved.meaning ?? kpi.meaning, measured: saved.measured ?? kpi.measured,
            notes: saved.notes || "", periodNotes: saved.periodNotes || {}, chart: saved.chart || null,
            source: saved.source || kpi.source || null };
        }),
      })),
    }));
  }, [docs, meta, fy]);

  const visibleTabs = useMemo(() => tabs.filter((t) => !(meta.hiddenTabs || []).includes(t.id)), [tabs, meta.hiddenTabs]);

  useEffect(() => {
    if (!visibleTabs.length) return;
    if (!visibleTabs.some((t) => t.id === activeTabId)) setActiveTabId(visibleTabs[0].id);
  }, [visibleTabs, activeTabId]);

  const activeTab = visibleTabs.find((t) => t.id === activeTabId) || visibleTabs[0];
  const isKpiTableTab = activeTab?.id === "summary";

  const updateKpiMeta = (kpiId, patch) =>
    persistMeta({ ...meta, kpis: { ...meta.kpis, [kpiId]: { ...(meta.kpis[kpiId] || {}), ...patch } } });

  const deleteKpi = (kpiId) => {
    persistMeta({ ...meta, hiddenKpis: Array.from(new Set([...(meta.hiddenKpis || []), kpiId])) });
    notify("success", "KPI removed from the dashboard.");
  };

  const allRows = useMemo(() => {
    if (!activeTab || activeTab.custom) return [];
    const rows = [];
    activeTab.categories.forEach((cat) => {
      if (cat.custom) return;
      (cat.kpis || []).forEach((kpi) => rows.push({
        kpi, categoryName: cat.name, tabName: activeTab.name,
        status: getStatus(kpi, period, fy), variance: getVariance(kpi, period, fy),
        values: periodValues(kpi, period, fy),
      }));
    });
    return rows;
  }, [activeTab, period, fy]);

  const optionsFor = (key) => {
    const set = new Set();
    allRows.forEach((r) => {
      if (key === "category") set.add(r.categoryName);
      else if (key === "kpi") set.add(r.kpi.name);
      else if (key === "units") set.add(r.kpi.units);
      else if (key === "frequency") set.add(r.kpi.frequency || "Monthly");
      else if (key === "status") set.add(r.status.label);
    });
    return ["all", ...Array.from(set).sort()];
  };

  const rows = useMemo(() => {
    const list = allRows.filter((r) =>
      (filters.category === "all" || r.categoryName === filters.category) &&
      (filters.kpi === "all" || r.kpi.name === filters.kpi) &&
      (filters.units === "all" || r.kpi.units === filters.units) &&
      (filters.frequency === "all" || (r.kpi.frequency || "Monthly") === filters.frequency) &&
      (filters.status === "all" || r.status.label === filters.status));

    const get = {
      category: (r) => r.categoryName, kpi: (r) => r.kpi.name,
      units: (r) => r.kpi.units, frequency: (r) => r.kpi.frequency || "Monthly",
      budget: (r) => Number(r.values.budget) || 0, actual: (r) => Number(r.values.actual) || 0,
      variance: (r) => Number(r.variance) || 0,
      status: (r) => ({ green: 0, amber: 1, red: 2, none: 3 }[r.status.key]),
    }[sortConfig.key];

    return [...list].sort((a, b) => {
      if (a.categoryName !== b.categoryName) return a.categoryName.localeCompare(b.categoryName);
      if (!get) return 0;
      const av = get(a), bv = get(b);
      if (typeof av === "number" && typeof bv === "number") return sortConfig.direction === "asc" ? av - bv : bv - av;
      const cmp = String(av).localeCompare(String(bv));
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [allRows, filters, sortConfig]);

  const groupedRows = useMemo(() => {
    const groups = [];
    rows.forEach((r) => {
      const last = groups[groups.length - 1];
      if (last && last.name === r.categoryName) last.items.push(r);
      else groups.push({ name: r.categoryName, items: [r] });
    });
    return groups;
  }, [rows]);

  const visibleColumns = COLUMN_ORDER.filter((k) => visibility[k]);
  const totalWidth = visibleColumns.reduce((s, k) => s + widths[k], 0) + widths[ACTIONS_KEY];
  const activeFilterCount = Object.values(filters).filter((v) => v !== "all").length;

  const startResize = (e, key) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX, startWidth = widths[key];
    resizing.current = key;
    const onMove = (ev) => setWidths((p) => ({ ...p, [key]: Math.max(80, startWidth + (ev.clientX - startX)) }));
    const onUp = () => {
      resizing.current = null;
      document.body.style.cursor = ""; document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp);
    };
    document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };

  const toggleSort = (key) => setSortConfig((p) => ({ key, direction: p.key === key && p.direction === "asc" ? "desc" : "asc" }));
  const clearFilters = () => { setFilters({ category: "all", kpi: "all", units: "all", frequency: "all", status: "all" }); setSortConfig({ key: null, direction: "asc" }); };

  const downloadCSV = () => {
    const p = PERIOD_PREFIX[period];
    const lines = [["Section","Category","KPI","Units","Frequency", `${p} Budget`, `${p} Actual`, `${p} Variance`, "Status"]];
    tabs.forEach((tab) => tab.categories.forEach((cat) => (cat.kpis || []).forEach((kpi) => {
      const v = periodValues(kpi, period, fy);
      lines.push([tab.name, cat.name, `"${kpi.name}"`, kpi.units, kpi.frequency || "Monthly",
        v.budget ?? "", v.actual ?? "", getVariance(kpi, period, fy) ?? "", getStatus(kpi, period, fy).label]);
    })));
    const blob = new Blob([lines.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `financial-performance-${period}-FY${fyLabel(fy.startYear, fy.startMonth).replace("/","-")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exitInvestorView = () => {
    const origin = sessionStorage.getItem("viewOrigin");
    ["viewingSMEId","viewingSMEName","investorViewMode","viewOrigin"].forEach((k) => sessionStorage.removeItem(k));
    window.location.href = origin === "cmf" ? "/cmf-cohorts" : origin === "catalyst" ? "/catalyst/cohorts" : "/my-cohorts";
  };

  const thS = { padding: 0, background: T.header, borderBottom: `2px solid ${T.header}`,
    borderRight: "1px solid rgba(255,255,255,0.14)", position: "relative", verticalAlign: "top" };
  const tdS = { padding: "13px 14px", color: T.body, fontSize: "14px", overflow: "hidden", borderRight: `1px solid ${T.lineSoft}` };
  const iconBtn = (c) => ({ background: "none", border: "none", cursor: "pointer", padding: "5px", borderRadius: "6px", color: c, display: "inline-flex", alignItems: "center" });

  if (loading) return <div style={{ padding: "80px", textAlign: "center", color: T.body, fontSize: "14px" }}>Loading financial performance…</div>;

  const userName = user?.displayName || user?.email || "User";

  return (
    <div style={{ minHeight: "100vh", padding: "28px", boxSizing: "border-box", background: T.bg, color: T.body }}>
      {isInvestorView && (
        <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderLeft: `3px solid ${T.accent}`, padding: "13px 18px",
          borderRadius: "10px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "10px", color: T.accent, fontWeight: 500, fontSize: "14px" }}>
            <Eye size={15} /> {viewOrigin === "catalyst" ? "Catalyst view" : viewOrigin === "cmf" ? "Facilitator view" : "Investor view"}: {viewingSMEName}'s Financial Performance
          </span>
          <button onClick={exitInvestorView} style={btnGhost}><ArrowLeft size={13} /> Back</button>
        </div>
      )}

      {notification && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontSize: "14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: notification.type === "error" ? T.redBg : T.greenBg,
          border: `1px solid ${notification.type === "error" ? T.red : T.green}33`,
          color: notification.type === "error" ? T.red : T.green }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {notification.type === "error" ? <XCircle size={14} /> : <CheckCircle2 size={14} />} {notification.message}
          </span>
          <button onClick={() => setNotification(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={14} /></button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ color: T.accent, fontSize: "27px", fontWeight: 650, margin: 0, letterSpacing: "-0.5px" }}>Financial Performance</h1>
        <button onClick={() => setShowAbout((v) => !v)} style={btnQuiet}>
          {showAbout ? "See less" : "See more"} {showAbout ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>
      <p style={{ fontSize: "13.5px", color: T.body, margin: "0 0 20px", display: "flex", alignItems: "center", gap: "7px" }}>
        <Calendar size={13} /> Financial year {fyLabel(fy.startYear, fy.startMonth)} · {MONTHS[fy.startMonth]} → {MONTHS[(fy.startMonth + 11) % 12]}
      </p>

      {showAbout && (
        <div style={{ background: T.panel, border: `1px solid ${T.line}`, padding: "22px", borderRadius: "12px", marginBottom: "22px",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          <div>
            <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "10px", fontSize: "14.5px", fontWeight: 600 }}>What this dashboard does</h3>
            <ul style={{ color: T.body, fontSize: "13.5px", lineHeight: 1.75, margin: 0, paddingLeft: "18px" }}>
              <li>Tracks Budget, Actual and Variance for every financial KPI</li>
              <li>Runs on your financial year, not the calendar year</li>
              <li>Captures monthly, weekly and daily data — each at the right scale</li>
              <li>Raises actions straight into your governance meetings</li>
            </ul>
          </div>
          <div>
            <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "10px", fontSize: "14.5px", fontWeight: 600 }}>How to use it</h3>
            <ul style={{ color: T.body, fontSize: "13.5px", lineHeight: 1.75, margin: 0, paddingLeft: "18px" }}>
              <li>Click <strong>Add Data</strong> and pick Equity Structure — you can add and edit dividends, investors and IRR projects right there</li>
              <li>Monthly KPIs show 3, 6 or 12 months — you pick at the top</li>
              <li>Weekly KPIs show six months; Daily KPIs show one month at a time</li>
              <li>Every table has an Actions column with edit and delete</li>
            </ul>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "2px", borderBottom: `1px solid ${T.lineStrong}`, marginBottom: "18px", flexWrap: "wrap", alignItems: "center" }}>
        {visibleTabs.map((tab) => {
          const on = tab.id === activeTab?.id;
          const counts = tab.categories.flatMap((c) => c.kpis || []).reduce((acc, k) => {
            const key = getStatus(k, period, fy).key; acc[key] = (acc[key] || 0) + 1; return acc;
          }, {});
          return (
            <button key={tab.id} onClick={() => { setActiveTabId(tab.id); clearFilters(); }}
              style={{ padding: "12px 20px", background: "none", border: "none", cursor: "pointer", fontSize: "14.5px",
                fontWeight: on ? 600 : 500, color: on ? T.accent : T.body,
                borderBottom: on ? `2px solid ${T.accent}` : "2px solid transparent",
                display: "flex", alignItems: "center", gap: "9px", fontFamily: "inherit", marginBottom: "-1px" }}>
              {tab.name}
              <span style={{ display: "inline-flex", gap: "4px" }}>
                {counts.red > 0 && <span style={{ fontSize: "11px", padding: "1px 7px", borderRadius: "999px", background: T.redBg, color: T.red, fontWeight: 700 }}>{counts.red}</span>}
                {counts.amber > 0 && <span style={{ fontSize: "11px", padding: "1px 7px", borderRadius: "999px", background: T.amberBg, color: T.amber, fontWeight: 700 }}>{counts.amber}</span>}
              </span>
            </button>
          );
        })}
        {!isInvestorView && (
          <button onClick={() => setManageTabs(true)} style={{ ...btnQuiet, marginLeft: "auto", marginBottom: "4px", padding: "6px 12px", fontSize: "12.5px", color: T.muted }}>
            <Settings2 size={13} /> Manage Tabs
          </button>
        )}
        <button onClick={() => setShowReport(true)} style={{ ...btnGhost, marginLeft: "4px", marginBottom: "4px", padding: "6px 14px", fontSize: "12.5px" }}>
          <FileText size={13} /> Download Report
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: "15.5px", fontWeight: 600, color: T.accent }}>{activeTab?.name}</h3>
          {isKpiTableTab && (
            <>
              <span style={{ fontSize: "12.5px", color: T.muted }}>{rows.length} of {allRows.length} KPIs</span>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} style={{ ...btnQuiet, padding: "3px 10px", fontSize: "12.5px", border: `1px solid ${T.lineStrong}`, borderRadius: "999px" }}>
                  Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                </button>
              )}
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {isKpiTableTab && (
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowColumnMenu((v) => !v)} style={btnGhost}><Columns3 size={14} /> Columns</button>
              {showColumnMenu && (
                <>
                  <div onClick={() => setShowColumnMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 400 }} />
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: "250px", background: T.bg,
                    border: `1px solid ${T.lineStrong}`, borderRadius: "10px", boxShadow: "0 12px 30px rgba(45,32,28,0.16)", padding: "8px", zIndex: 401 }}>
                    {COLUMN_ORDER.map((key) => {
                      const def = COLUMN_DEFS[key];
                      return (
                        <div key={key} onClick={() => def.hideable && setVisibility((p) => ({ ...p, [key]: !p[key] }))}
                          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 9px", borderRadius: "7px",
                            cursor: def.hideable ? "pointer" : "not-allowed", opacity: def.hideable ? 1 : 0.5, fontSize: "13.5px", color: T.body }}>
                          {visibility[key] ? <CheckSquare size={14} color={T.accent} /> : <Square size={14} color={T.muted} />}
                          <span style={{ flex: 1 }}>{def.label}</span>
                        </div>
                      );
                    })}
                    <button onClick={() => setVisibility(Object.fromEntries(COLUMN_ORDER.map((k) => [k, true])))} style={{ ...btnGhost, width: "100%", justifyContent: "center", marginTop: "6px", fontSize: "12.5px", padding: "7px" }}>Show all</button>
                  </div>
                </>
              )}
            </div>
          )}
          <button onClick={downloadCSV} style={btnGhost}><Download size={14} /> CSV</button>
          {!isInvestorView && <button onClick={() => setAddFlow("choose")} style={btnPrimary}><Plus size={14} /> Add Data</button>}
        </div>
      </div>

      {isKpiTableTab && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
          <div style={{ display: "inline-flex", background: T.raised, borderRadius: "10px", padding: "3px" }}>
            {PERIODS.map((p) => {
              const on = p.key === period;
              return (
                <button key={p.key} onClick={() => setPeriod(p.key)}
                  style={{ padding: "7px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13.5px",
                    fontWeight: 600, border: "none", fontFamily: "inherit",
                    background: on ? T.bg : "transparent", color: on ? T.accent : T.body,
                    boxShadow: on ? "0 1px 3px rgba(45,32,28,0.14)" : "none" }}>
                  {p.label}
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: "12.5px", color: T.muted }}>Showing {PERIOD_PREFIX[period].toLowerCase()} budget, actual and variance</span>
        </div>
      )}

      {activeTab?.custom === "balanceSheet" ? (
        <BalanceSheetTab fy={fy} docs={docs} readOnly={isInvestorView}
          onSaveBsFull={saveBsFullDoc}
          onDeleteLine={bsDeleteLine}
          onDeleteSection={bsDeleteSection} />
      ) : activeTab?.custom === "equity" ? (
        <div style={{ marginBottom: "20px" }}>
          <DividendHistory dividends={dividends} readOnly={isInvestorView} onSave={saveDividends} />
          <CapTableOverview investors={investors} irrInvestments={irrInvestments} readOnly={isInvestorView} onSaveCapTable={saveCapTable} />
        </div>
      ) : (
        <>
          {allRows.length > 0 && (
            <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "12px", overflow: "hidden", background: T.bg, marginBottom: "20px" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "separate", borderSpacing: 0, width: totalWidth, minWidth: "100%", tableLayout: "fixed" }}>
                  <thead>
                    <tr>
                      {visibleColumns.map((key) => {
                        const def = COLUMN_DEFS[key];
                        const isOpen = openFilter === key;
                        const sorted = sortConfig.key === key;
                        const filtered = def.filter && filters[key] !== "all";
                        const align = def.align === "center" ? "center" : "flex-start";
                        const lines = columnLines(key, period);
                        return (
                          <th key={key} style={{ ...thS, width: widths[key] }}>
                            <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "6px", alignItems: align }}>
                              <span style={{ display: "flex", alignItems: "flex-start", gap: "5px" }}>
                                <span style={{ display: "inline-flex", flexDirection: "column", alignItems: align, lineHeight: 1.3 }}>
                                  {lines.map((l, i) => (
                                    <span key={i} style={{ fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap",
                                      color: i < lines.length - 1 ? "rgba(255,255,255,0.82)" : "#ffffff" }}>{l}</span>
                                  ))}
                                </span>
                                <InfoTip text={def.tip} light />
                              </span>
                              <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                                {def.sort && (
                                  <button onClick={() => toggleSort(key)} style={iconBtn(sorted ? "#fff" : "rgba(255,255,255,0.6)")}>
                                    {sorted ? (sortConfig.direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} />}
                                  </button>
                                )}
                                {def.filter && (
                                  <button onClick={() => setOpenFilter(isOpen ? null : key)}
                                    style={{ ...iconBtn(filtered ? "#fff" : "rgba(255,255,255,0.6)"), background: filtered ? "rgba(255,255,255,0.16)" : "transparent" }}>
                                    <SlidersHorizontal size={13} />
                                  </button>
                                )}
                              </span>
                            </div>
                            {isOpen && def.filter && (
                              <div onMouseLeave={() => setOpenFilter(null)}
                                style={{ position: "absolute", top: "100%", left: 0, marginTop: "2px", background: T.bg,
                                  border: `1px solid ${T.lineStrong}`, borderRadius: "10px", minWidth: "215px", maxHeight: "260px",
                                  overflowY: "auto", zIndex: 600, boxShadow: "0 12px 30px rgba(45,32,28,0.18)", padding: "6px" }}>
                                {optionsFor(key).map((opt) => (
                                  <div key={opt} onClick={() => { setFilters((p) => ({ ...p, [key]: opt })); setOpenFilter(null); }}
                                    style={{ padding: "8px 10px", cursor: "pointer", fontSize: "13.5px", borderRadius: "7px",
                                      background: filters[key] === opt ? T.accentTint : "transparent",
                                      color: filters[key] === opt ? T.accent : T.body, fontWeight: filters[key] === opt ? 600 : 400 }}>
                                    {opt === "all" ? `All ${def.label.toLowerCase()}s` : opt}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div onMouseDown={(e) => startResize(e, key)}
                              style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                          </th>
                        );
                      })}
                      <th style={{ ...thS, width: widths[ACTIONS_KEY], borderRight: "none" }}>
                        <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                          <span style={{ display: "flex", alignItems: "flex-start", gap: "5px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", lineHeight: 1.3 }}>Actions</span>
                            <InfoTip light text="Trend chart, analysis, add action, notes, delete." />
                          </span>
                          <span style={{ height: "23px" }} />
                        </div>
                        <div onMouseDown={(e) => startResize(e, ACTIONS_KEY)}
                          style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedRows.length === 0 ? (
                      <tr><td colSpan={visibleColumns.length + 1} style={{ ...tdS, textAlign: "center", padding: "56px 16px", color: T.muted, borderRight: "none" }}>No KPIs match the current filters.</td></tr>
                    ) : groupedRows.map((group) => group.items.map((row, idx) => {
                      const { kpi, categoryName, tabName, status, variance, values } = row;
                      const fav = varianceFavourable(kpi, variance);
                      const last = idx === group.items.length - 1;
                      const rowTd = { ...tdS, borderBottom: last ? `2px solid ${T.lineStrong}` : `1px solid ${T.lineSoft}` };
                      const cell = (key, content) => visibility[key] ? (
                        <td key={key} style={{ ...rowTd, width: widths[key], textAlign: COLUMN_DEFS[key].align === "center" ? "center" : "left" }}>{content}</td>
                      ) : null;
                      return (
                        <tr key={kpi.id}>
                          {visibility.category && idx === 0 && (
                            <td rowSpan={group.items.length} style={{ ...tdS, width: widths.category, background: T.panel,
                              fontWeight: 700, color: T.accent, verticalAlign: "middle",
                              borderBottom: `2px solid ${T.lineStrong}`, borderRight: `1px solid ${T.lineStrong}`, fontSize: "13.5px" }}>
                              {group.name}
                            </td>
                          )}
                          {visibility.kpi && (
                            <td style={{ ...rowTd, width: widths.kpi }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                <span style={{ fontWeight: 500, color: T.ink }}>{kpi.name}</span>
                                <button onClick={() => setInfoKpi(kpi)} style={iconBtn(T.muted)} title="What it means and how it is measured"><Eye size={14} /></button>
                                {kpi.notes && <StickyNote size={11} color={T.amber} />}
                              </div>
                            </td>
                          )}
                          {cell("units", <span style={{ color: T.body }}>{kpi.units}</span>)}
                          {cell("frequency", <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "999px", background: T.raised, color: T.body, fontWeight: 500 }}>{kpi.frequency || "Monthly"}</span>)}
                          {cell("budget", <span style={{ color: T.body, fontVariantNumeric: "tabular-nums" }}>{fmtValue(values.budget, kpi, { bare: true })}</span>)}
                          {cell("actual", <span style={{ fontWeight: 700, color: T.ink, fontVariantNumeric: "tabular-nums" }}>{fmtValue(values.actual, kpi, { bare: true })}</span>)}
                          {cell("variance", variance === null
                            ? <span style={{ color: T.faint }}>—</span>
                            : <span style={{ fontWeight: 700, color: fav ? T.green : T.red, fontVariantNumeric: "tabular-nums" }}>
                                {fmtValue(variance, kpi, { signed: true, bare: true })}</span>)}
                          {cell("status", <span style={{ display: "inline-flex" }} title={status.label}><StatusIcon status={status} size={22} /></span>)}
                          <td style={{ ...rowTd, width: widths[ACTIONS_KEY], textAlign: "center", borderRight: "none" }}>
                            <div style={{ display: "flex", gap: "1px", justifyContent: "center", alignItems: "center" }}>
                              <button onClick={() => setChartKpi(kpi)} style={iconBtn(T.body)} title="Trend chart"><LineChartIcon size={16} /></button>
                              <button onClick={() => setAnalysisKpi(kpi)} style={iconBtn(T.body)} title="Summary analysis"><Lightbulb size={16} /></button>
                              {!isInvestorView && (
                                <button onClick={() => setActionKpi({ kpi, categoryName, tabName })} style={iconBtn(status.color)} title="Add action"><Plus size={16} /></button>
                              )}
                              <button onClick={() => setNotesKpi(kpi)} style={iconBtn(kpi.notes ? T.amber : T.body)} title="Notes"><StickyNote size={16} /></button>
                              {!isInvestorView && (
                                <button onClick={() => { if (window.confirm(`Delete "${kpi.name}"?`)) deleteKpi(kpi.id); }} style={iconBtn(T.red)} title="Delete KPI"><Trash2 size={16} /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "11px 16px", borderTop: `1px solid ${T.lineStrong}`, background: T.panel, fontSize: "12px",
                color: T.body, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <span>{activeTab?.categories.filter((c) => !c.custom).length} categories</span>
                <span style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><CheckCircle2 size={13} color={T.green} /> On budget</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><AlertTriangle size={13} color={T.amber} /> Needs attention</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><XCircle size={13} color={T.red} /> Critical</span>
                </span>
              </div>
            </div>
          )}
          {activeTab?.categories.some((c) => c.custom === "loans") && (
            <div style={{ marginBottom: "20px" }}>
              <LoanRepaymentsPanel loans={meta.loans || []} readOnly={isInvestorView} onSave={saveLoans} />
            </div>
          )}
        </>
      )}

      {infoKpi && <KpiInfoModal kpi={infoKpi} readOnly={isInvestorView} onClose={() => setInfoKpi(null)}
        onSave={(patch) => { updateKpiMeta(infoKpi.id, patch); setInfoKpi({ ...infoKpi, ...patch }); notify("success", "KPI updated."); }} />}

      {chartKpi && <TrendChartModal kpi={chartKpi} period={period} fy={fy} readOnly={isInvestorView} onClose={() => setChartKpi(null)}
        onSaveNote={(key, text) => {
          const notes = { ...(chartKpi.periodNotes || {}) };
          if (text.trim()) notes[key] = text.trim(); else delete notes[key];
          updateKpiMeta(chartKpi.id, { periodNotes: notes });
          setChartKpi({ ...chartKpi, periodNotes: notes });
        }}
        onSaveChart={(chart) => { updateKpiMeta(chartKpi.id, { chart }); setChartKpi({ ...chartKpi, chart }); }} />}

      {analysisKpi && <AnalysisModal kpi={analysisKpi} period={period} fy={fy} onClose={() => setAnalysisKpi(null)} />}

      {actionKpi && <AddActionModal kpi={actionKpi.kpi} period={period} fy={fy}
        categoryName={actionKpi.categoryName} tabName={actionKpi.tabName} userId={user?.uid}
        onClose={() => setActionKpi(null)} onSaved={(m) => notify("success", `Action added to "${m}".`)} />}

      {notesKpi && <NotesModal kpi={notesKpi} readOnly={isInvestorView} onClose={() => setNotesKpi(null)}
        onSave={(notes) => { updateKpiMeta(notesKpi.id, { notes }); setNotesKpi({ ...notesKpi, notes }); }} />}

      {manageTabs && (
        <Modal title="Manage Dashboard Tabs" icon={<Settings2 size={17} />} onClose={() => setManageTabs(false)} width={560}
          footer={<button onClick={() => setManageTabs(false)} style={btnPrimary}>Done</button>}>
          {tabs.map((t) => {
            const hidden = (meta.hiddenTabs || []).includes(t.id);
            const count = t.categories.flatMap((c) => c.kpis || []).length;
            return (
              <div key={t.id} style={{ ...cardS, marginBottom: "10px", opacity: hidden ? 0.6 : 1, display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <div style={{ fontSize: "14.5px", fontWeight: 600, color: T.accent }}>{t.name} {hidden && <span style={{ fontSize: "11.5px", color: T.muted }}>· hidden</span>}</div>
                  <div style={{ fontSize: "12.5px", color: T.muted }}>{t.custom === "balanceSheet" ? "Read-only with Add line / Add section" : `${t.categories.length} categories · ${count} KPIs`}</div>
                </div>
                <button onClick={() => persistMeta({ ...meta, hiddenTabs: hidden ? (meta.hiddenTabs || []).filter((x) => x !== t.id) : [...(meta.hiddenTabs || []), t.id] })}
                  disabled={!hidden && visibleTabs.length <= 1}
                  style={{ ...btnGhost, padding: "7px 12px", fontSize: "12.5px", opacity: !hidden && visibleTabs.length <= 1 ? 0.4 : 1 }}>
                  {hidden ? <><Eye size={13} /> Show</> : <><EyeOff size={13} /> Hide</>}
                </button>
              </div>
            );
          })}
        </Modal>
      )}

      {addFlow === "choose" && <AddChooser onClose={() => setAddFlow(null)} onPick={(k) => setAddFlow(k)} />}

      {addFlow === "data" && (
        <AddDataWizard
          tabs={tabs} fy={fy} docs={docs} currentTabId={activeTabId}
          prefs={dataPrefs} onSavePrefs={savePrefs}
          onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
          onSaveField={saveKpiField}
          meta={meta}
          dividends={dividends} investors={investors} irrInvestments={irrInvestments}
          onSaveDividends={saveDividends}
          onSaveCapTable={saveCapTable}
          onSaveLoans={saveLoans}
          onSaveBsFull={saveBsFullDoc}
          onDeleteLine={bsDeleteLine}
          onDeleteSection={bsDeleteSection}
        />
      )}

      {addFlow === "kpi" && <AddKpiWizard tabs={tabs} currentTabId={activeTabId}
        onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
        onSave={async (kpi) => { await persistMeta({ ...meta, custom: [...(meta.custom || []), kpi] }); notify("success", "KPI created."); }} />}

      {showReport && <FinancialReportGenerator
        tabs={visibleTabs} fy={fy} docs={docs} meta={meta} period={period}
        userId={user?.uid} userName={userName}
        dividends={dividends} investors={investors} irrInvestments={irrInvestments}
        onClose={() => setShowReport(false)} />}
    </div>
  );
};

export default FinancialPerformance;