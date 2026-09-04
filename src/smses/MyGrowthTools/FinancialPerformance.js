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
   Tokens — identical to Operational Performance
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

// NEW: Parse number with thousand separators support
const parseNumberInput = (value) => {
  if (value === null || value === undefined || value === "") return null;
  // Remove thousand separators (spaces, commas, periods used as separators)
  const cleaned = String(value).replace(/[\s,]/g, '');
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
};

// NEW: Format number for display with thousand separators
const formatDisplayNumber = (value, units = null) => {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  
  // For percentage, keep limited decimal places
  if (units === "%") {
    return n.toFixed(1);
  }
  
  // For currency and other numbers, add thousand separators
  if (Math.abs(n) >= 1) {
    return n.toLocaleString(LOCALE);
  }
  return String(n);
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
   KPI registry (unchanged)
   ════════════════════════════════════════════════════════════════════════ */
const K = (o) => ({
  id: o.id, name: o.name, units: o.units, direction: o.direction || "higher",
  aggregate: o.aggregate || "avg", meaning: o.meaning, measured: o.measured,
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
          measured: "=SUM(TotalAssets) - SUM(TotalLiabilities)\n\nBoth totals come from the Balance Sheet tab for the selected month. Format as Currency (R, 0 decimals).",
          actual: (c) => (Number.isFinite(c.assets) && Number.isFinite(c.liabilities) ? c.assets - c.liabilities : null) }),
        K({ id: "equityRatio", name: "Equity Ratio", units: "%", direction: "higher", aggregate: "avg",
          source: "Calculated from Balance Sheet",
          meaning: "How much of the business is funded by owners rather than lenders. Higher means less exposed to a credit squeeze.",
          measured: "=TotalEquity / TotalAssets * 100\n\nFormat as Percentage (1 decimal).",
          actual: (c) => { const r = div(c.equity, c.assets); return r === null ? null : r * 100; } }),
        K({ id: "interestCoverage", name: "Interest Coverage", units: "×", direction: "higher", aggregate: "avg",
          source: "Calculated from P&L",
          meaning: "How many times over your operating profit covers the interest bill. Under 1.5× is where lenders start asking questions.",
          measured: "=EBIT / InterestExpense\n\nWhere EBIT = GrossProfit − Opex − Depreciation − Amortisation.",
          actual: (c) => div(c.ebit, c.intExp) }),
      ]},
      { name: "Leverage", kpis: [
        K({ id: "debtToAssets", name: "Debt to Assets", units: "×", direction: "lower", aggregate: "avg",
          source: "Calculated from Balance Sheet",
          meaning: "How much of what you own is funded by debt. Above 0.6 is generally considered geared.",
          measured: "=TotalLiabilities / TotalAssets",
          actual: (c) => div(c.liabilities, c.assets) }),
        K({ id: "debtToEquity", name: "Debt to Equity", units: "×", direction: "lower", aggregate: "avg",
          source: "Calculated from Balance Sheet",
          meaning: "Rand of debt for every rand of owners' capital. The classic gearing measure.",
          measured: "=TotalLiabilities / TotalEquity",
          actual: (c) => div(c.liabilities, c.equity) }),
        K({ id: "equityMultiplier", name: "Equity Multiplier", units: "×", direction: "lower", aggregate: "avg",
          source: "Calculated from Balance Sheet",
          meaning: "How far the asset base is stretched over the equity behind it. The higher it climbs, the worse a bad year hurts.",
          measured: "=TotalAssets / TotalEquity",
          actual: (c) => div(c.assets, c.equity) }),
      ]},
      { name: "Revenue & Costs", kpis: [
        K({ id: "sales", name: "Revenue", units: "R", direction: "higher", aggregate: "sum", field: { src: "pnl", a: "sales", b: "salesBudget" },
          source: "Entered manually",
          meaning: "Everything you invoiced in the period, before any costs come off.",
          measured: "=SUM(Sales)\n\nEntered directly. Rolls up across the year with =SUM().",
          actual: (c) => c.sales, budget: (c) => c.salesB }),
        K({ id: "cogs", name: "Cost of Sales", units: "R", direction: "lower", aggregate: "sum", field: { src: "pnl", a: "cogs", b: "cogsBudget" },
          source: "Entered manually",
          meaning: "What it cost you to deliver what you sold — materials, direct labour, delivery.",
          measured: "=SUM(COGS)",
          actual: (c) => c.cogs, budget: (c) => c.cogsB }),
        K({ id: "opex", name: "Operating Expenses", units: "R", direction: "lower", aggregate: "sum", field: { src: "pnl", a: "opex", b: "opexBudget" },
          source: "Entered manually",
          meaning: "Running the business — salaries, rent, marketing, admin. Everything not tied to a specific sale.",
          measured: "=SUM(Opex)",
          actual: (c) => c.opex, budget: (c) => c.opexB }),
      ]},
      { name: "Profitability", kpis: [
        K({ id: "grossProfit", name: "Gross Profit", units: "R", direction: "higher", aggregate: "sum",
          source: "Calculated from P&L",
          meaning: "What's left after paying for what you sold, before the cost of running the place.",
          measured: "=SUM(Sales) - SUM(COGS)",
          actual: (c) => c.gp, budget: (c) => c.gpB }),
        K({ id: "ebitda", name: "EBITDA", units: "R", direction: "higher", aggregate: "sum",
          source: "Calculated from P&L",
          meaning: "Operating profit before depreciation, amortisation, interest and tax — the closest thing to cash the P&L gives you.",
          measured: "=SUM(Sales) - SUM(COGS) - SUM(Opex)",
          actual: (c) => c.ebitda, budget: (c) => c.ebitdaB }),
        K({ id: "netProfit", name: "Net Profit", units: "R", direction: "higher", aggregate: "sum",
          source: "Calculated from P&L",
          meaning: "What the owners actually keep after every cost, interest and tax.",
          measured: "=EBITDA - Depreciation - Amortisation - InterestExpense + InterestIncome - Tax",
          actual: (c) => c.np, budget: (c) => c.npB }),
      ]},
      { name: "Margins", kpis: [
        K({ id: "gpMargin", name: "Gross Profit Margin", units: "%", direction: "higher", aggregate: "avg",
          source: "Calculated from P&L",
          meaning: "Cents of gross profit in every rand of revenue. Moves when pricing or input costs move.",
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
        K({ id: "currentRatio", name: "Current Ratio", units: "×", direction: "higher", aggregate: "avg", field: { src: "liq", a: "currentRatio" },
          source: "Entered manually or calculated",
          meaning: "Whether short-term assets cover short-term bills. Below 1 means you cannot pay the next twelve months from what you hold.",
          measured: "=CurrentAssets / CurrentLiabilities\n\nEntered directly, or computed from the Balance Sheet tab.",
          actual: (c) => (Number.isFinite(c.currentRatio) ? c.currentRatio : div(c.currentAssets, c.currentLiabilities)) }),
        K({ id: "quickRatio", name: "Quick Ratio", units: "×", direction: "higher", aggregate: "avg", field: { src: "liq", a: "quickRatio" },
          source: "Entered manually or calculated",
          meaning: "The same test with stock stripped out, since stock is the hardest thing to turn into cash in a hurry.",
          measured: "=(CurrentAssets - Inventory) / CurrentLiabilities",
          actual: (c) => (Number.isFinite(c.quickRatio) ? c.quickRatio
            : div(Number.isFinite(c.currentAssets) ? c.currentAssets - (c.inventory || 0) : null, c.currentLiabilities)) }),
        K({ id: "cashRatio", name: "Cash Ratio", units: "×", direction: "higher", aggregate: "avg", field: { src: "liq", a: "cashRatio" },
          source: "Entered manually or calculated",
          meaning: "The harshest test — cash alone against short-term bills.",
          measured: "=CashAndEquivalents / CurrentLiabilities",
          actual: (c) => (Number.isFinite(c.cashRatio) ? c.cashRatio : div(c.cash, c.currentLiabilities)) }),
      ]},
      { name: "Survival", kpis: [
        K({ id: "burnRate", name: "Burn Rate", units: "R", direction: "lower", aggregate: "avg", field: { src: "liq", a: "burnRate" },
          source: "Entered manually",
          meaning: "How much cash the business consumes in a month once everything is paid.",
          measured: "=(OpeningCash - ClosingCash) / MonthsElapsed\n\nOr entered directly per month.",
          actual: (c) => c.burnRate }),
        K({ id: "cashCover", name: "Cash Cover", units: "months", direction: "higher", aggregate: "avg", field: { src: "liq", a: "cashCover" },
          source: "Entered manually or calculated",
          meaning: "How many months the cash on hand would last at the current burn.",
          measured: "=CashBalance / BurnRate",
          actual: (c) => (Number.isFinite(c.cashCover) ? c.cashCover : div(c.cashBalance, c.burnRate)) }),
        K({ id: "cashflow", name: "Free Cashflow", units: "R", direction: "higher", aggregate: "sum", field: { src: "liq", a: "cashflow" },
          source: "Entered manually",
          meaning: "Cash left over after running the business and keeping the assets going.",
          measured: "=OperatingCashflow - CapitalExpenditure",
          actual: (c) => c.cashflow }),
        K({ id: "workingCapital", name: "Working Capital", units: "R", direction: "higher", aggregate: "avg", field: { src: "liq", a: "workingCapital" },
          source: "Entered manually or calculated",
          meaning: "The buffer between what you're owed and what you owe in the short term.",
          measured: "=CurrentAssets - CurrentLiabilities",
          actual: (c) => (Number.isFinite(c.workingCapital) ? c.workingCapital
            : (Number.isFinite(c.currentAssets) && Number.isFinite(c.currentLiabilities) ? c.currentAssets - c.currentLiabilities : null)) }),
        K({ id: "cashBalance", name: "Cash Balance", units: "R", direction: "higher", aggregate: "avg", field: { src: "liq", a: "cashBalance" },
          source: "Entered manually",
          meaning: "What is actually in the bank at month end.",
          measured: "=SUM(BankAccounts) + PettyCash",
          actual: (c) => (Number.isFinite(c.cashBalance) ? c.cashBalance : c.cash) }),
      ]},
      { name: "Cost Agility", kpis: [
        K({ id: "fixedVariableRatio", name: "Fixed / Variable Ratio", units: "%", direction: "lower", aggregate: "avg",
          source: "Calculated from Cost Agility",
          meaning: "How much of your cost base you cannot switch off if revenue drops. The higher it is, the less room you have to react.",
          measured: "=SUM(FixedCosts) / (SUM(FixedCosts) + SUM(VariableCosts)) * 100",
          actual: (c) => { const r = div(c.fixedCosts, (c.fixedCosts || 0) + (c.variableCosts || 0)); return r === null ? null : r * 100; } }),
        K({ id: "discretionaryPct", name: "Discretionary Spend", units: "%", direction: "higher", aggregate: "avg",
          source: "Calculated from Cost Agility",
          meaning: "The share of spend you could pause next month without breaking anything. This is your shock absorber.",
          measured: "=SUM(DiscretionaryCosts) / SUM(TotalCosts) * 100",
          actual: (c) => { const r = div(c.discretionary, c.totalCost); return r === null ? null : r * 100; } }),
        K({ id: "lockInDuration", name: "Cost Lock-in", units: "months", direction: "lower", aggregate: "avg", field: { src: "cost", a: "lockInDuration" },
          source: "Entered manually",
          meaning: "How long you'd stay committed to your fixed costs if you started unwinding today.",
          measured: "=AVERAGE(RemainingContractMonths)\n\nWeighted by contract value where it matters.",
          actual: (c) => c.lockIn }),
        K({ id: "fixedCosts", name: "Fixed Costs", units: "R", direction: "lower", aggregate: "sum", field: { src: "cost", a: "fixedCosts" },
          source: "Entered manually",
          meaning: "Costs that arrive whether you sell anything or not.",
          measured: "=SUM(FixedCosts)",
          actual: (c) => c.fixedCosts }),
        K({ id: "variableCosts", name: "Variable Costs", units: "R", direction: "lower", aggregate: "sum", field: { src: "cost", a: "variableCosts" },
          source: "Entered manually",
          meaning: "Costs that rise and fall with volume.",
          measured: "=SUM(VariableCosts)",
          actual: (c) => c.variableCosts }),
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
const monthEntry = (kpi, year, mi) => kpi.entries?.[`M:${year}-${String(mi + 1).padStart(2, "0")}`] || { actual: null, budget: null };

const periodValues = (kpi, period, fy) => {
  const now = new Date();
  if (period === "month") return monthEntry(kpi, now.getFullYear(), now.getMonth());
  const months = fyMonths(fy.startYear, fy.startMonth);
  const elapsed = (list) => list.filter((m) => new Date(m.year, m.month, 1) <= new Date(now.getFullYear(), now.getMonth(), 1));
  const rows = (list) => list.map((m) => monthEntry(kpi, m.year, m.month));
  if (period === "quarter") {
    const qs = fyQuarters(fy.startYear, fy.startMonth);
    const q = qs.find((qq) => qq.months.some((m) => m.year === now.getFullYear() && m.month === now.getMonth())) || qs[0];
    const r = rows(elapsed(q.months));
    return { actual: rollUp(r.map((x) => Number(x.actual)), kpi.aggregate), budget: rollUp(r.map((x) => Number(x.budget)), kpi.aggregate) };
  }
  const r = rows(elapsed(months));
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
const selectS = { ...inputS, cursor: "pointer" };
const labelS = { display: "block", fontSize: "12.5px", fontWeight: 600, color: T.accent, marginBottom: "5px" };
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "14px 16px" };

const Modal = ({ title, subtitle, icon, onClose, children, width = 640, footer }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(45,32,28,0.55)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1400, padding: "20px" }}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: T.bg, borderRadius: "14px", width: "100%",
      maxWidth: `${width}px`, maxHeight: "92vh", display: "flex", flexDirection: "column",
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

/* ─── KPI info modal (unchanged) ───────────────────────────────────────── */
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
        {[`Units: ${kpi.units}`, kpi.field ? "Entered directly" : "Calculated",
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

/* ─── Analysis (unchanged) ─────────────────────────────────────────────── */
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

/* ─── Trend chart (unchanged) ──────────────────────────────────────────── */
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
        const ms = q.months.map((m) => monthEntry(kpi, m.year, m.month));
        return { actual: rollUp(ms.map((r) => Number(r.actual)), kpi.aggregate),
                 budget: rollUp(ms.map((r) => Number(r.budget)), kpi.aggregate) };
      });
      return { labels: qs.map((q) => `${q.label} ${fyLabel(fy.startYear, fy.startMonth)}`),
        actual: rows.map((r) => r.actual), budget: rows.map((r) => r.budget),
        noteKey: `Q:${fy.startYear}`, caption: `Quarters of FY ${fyLabel(fy.startYear, fy.startMonth)}` };
    }
    const months = fyMonths(fy.startYear, fy.startMonth);
    const rows = months.map((m) => monthEntry(kpi, m.year, m.month));
    return { labels: months.map((m) => m.label),
      actual: rows.map((r) => parseNum(r.actual)), budget: rows.map((r) => parseNum(r.budget)),
      noteKey: currentMonthKey(), caption: `FY ${fyLabel(fy.startYear, fy.startMonth)} · ${months[0].long} → ${months[11].long}` };
  }, [kpi, period, fy]);

  const variance = actual.map((a, i) => (Number.isFinite(a) && Number.isFinite(budget[i]) ? a - budget[i] : null));

  useEffect(() => { setNoteText(kpi.periodNotes?.[noteKey] || ""); setNoteState("idle"); }, [noteKey, kpi.id]); // eslint-disable-line

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
                <select value={prefs[k]} onChange={(e) => setPref({ [k]: e.target.value })} style={selectS}>
                  {CHART_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label style={labelS}>Axis</label>
              <select value={prefs.axisMode} onChange={(e) => setPref({ axisMode: e.target.value })} style={selectS}>
                <option value="y">Show Y-Axis</option>
                <option value="x">Show X-Axis</option>
                <option value="both">Show Both</option>
              </select>
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

/* ─── Add Action (unchanged) ───────────────────────────────────────────── */
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

  useEffect(() => { if (meetingId) setForm((p) => applyDefaults(meetingId, p, true)); // eslint-disable-next-line
  }, [meetingId, meetings.length]);

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
              <select value={meetingId} onChange={(e) => { setMeetingId(e.target.value); setForm((p) => applyDefaults(e.target.value, p)); }} style={selectS}>
                {meetings.map((m) => { const d = meetingDate(m);
                  return <option key={m.id} value={m.id}>{m.title}{d ? ` — ${fmtDMY(d)}` : ""}</option>; })}
              </select>
            )}
        </div>
        <div>
          <label style={labelS}>Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={selectS}>
            {RAPS_CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <div><label style={labelS}>By whom</label>
          {(selected?.participants || []).length > 0 ? (
            <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} style={selectS}>
              <option value="">Unassigned</option>
              {selected.participants.map((p, i) => { const n = typeof p === "string" ? p : p.name || p.email || "Participant"; return <option key={i} value={n}>{n}</option>; })}
            </select>
          ) : <input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} style={inputS} placeholder="Owner" />}
        </div>
        <div><label style={labelS}>By when</label>
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={inputS} /></div>
        <div><label style={labelS}>Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={selectS}>
            {ACTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select></div>
      </div>
      {message && <div style={{ color: T.red, fontSize: "13px", marginTop: "12px" }}>{message}</div>}
    </Modal>
  );
};

/* ─── KPI notes (unchanged) ────────────────────────────────────────────── */
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

/* ─── Enhanced table hook with drag-and-drop and filter dropdown ──────── */
function useEnhancedTable(initialCols, dataRows) {
  const [colOrder, setColOrder] = useState(initialCols.map(c => c.key));
  const [widths, setWidths] = useState(() => Object.fromEntries(initialCols.map(c => [c.key, c.width || 140])));
  const [filters, setFilters] = useState(() => Object.fromEntries(initialCols.map(c => [c.key, ""])));
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });

  // Drag-and-drop handlers
  const handleDragStart = (e, key) => {
    e.dataTransfer.setData("text/plain", key);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
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

  // Filter dropdown: get unique values from data for a column
  const getFilterOptions = (key) => {
    const vals = dataRows.map(row => String(row[key] || "").trim()).filter(v => v !== "");
    return ["All", ...Array.from(new Set(vals)).sort()];
  };

  const filteredData = useMemo(() => {
    return dataRows.filter(row => {
      return colOrder.every(key => {
        const filterVal = filters[key] || "";
        if (!filterVal || filterVal === "All") return true;
        const cellVal = String(row[key] || "").trim();
        return cellVal === filterVal;
      });
    });
  }, [dataRows, filters, colOrder]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a,b) => {
      const av = a[sortConfig.key] ?? "";
      const bv = b[sortConfig.key] ?? "";
      if (typeof av === "number" && typeof bv === "number") return sortConfig.dir === "asc" ? av - bv : bv - av;
      return sortConfig.dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [filteredData, sortConfig]);

  return {
    colOrder, widths, filters, sortConfig,
    setFilters, setSortConfig, startResize,
    handleDragStart, handleDragOver, handleDrop,
    getFilterOptions, sortedData,
  };
}

/* ─── Shared FilterDropdown component ──────────────────────────────────── */
const FilterDropdown = ({ options, value, onChange, onClose }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: value && value !== "All" ? "#fff" : "rgba(255,255,255,0.5)", display: "inline-flex", alignItems: "center" }}
      >
        <SlidersHorizontal size={13} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "4px", background: T.bg, border: `1px solid ${T.lineStrong}`, borderRadius: "8px", boxShadow: "0 8px 20px rgba(0,0,0,0.15)", zIndex: 100, minWidth: "150px", maxHeight: "200px", overflowY: "auto" }}>
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); onClose?.(); }}
              style={{ padding: "8px 14px", cursor: "pointer", fontSize: "13px", color: T.body, background: value === opt ? T.accentTint : "transparent", borderBottom: `1px solid ${T.lineSoft}` }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Equity Structure – Dividend History (read‑only, enhanced table)
   ════════════════════════════════════════════════════════════════════════ */
const DividendHistory = ({ dividends, readOnly }) => {
  const cols = [
    { key: "year", label: "Year", tip: "The calendar year in which the dividend was declared." },
    { key: "amountPerShare", label: "Amount per Share", tip: "The dividend amount paid per share." },
    { key: "totalShares", label: "Total Shares", tip: "Number of shares outstanding at the time of payment." },
    { key: "totalIssued", label: "Total Issued", tip: "Total dividend amount issued (shares × amount per share)." },
    { key: "paymentDate", label: "Payment Date", tip: "Date when the dividend was actually paid." },
    { key: "notes", label: "Notes", tip: "Optional notes about this dividend." },
  ];
  const rows = dividends.map(d => ({
    year: d.year,
    amountPerShare: d.amountPerShare ?? 0,
    totalShares: d.totalShares ?? 0,
    totalIssued: d.totalIssued ?? 0,
    paymentDate: d.paymentDate || "",
    notes: d.notes || "",
  }));

  const { colOrder, widths, filters, setFilters, sortConfig, setSortConfig, startResize, handleDragStart, handleDragOver, handleDrop, getFilterOptions, sortedData } = useEnhancedTable(cols, rows);

  const iconBtn = (c) => ({ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px", color: c, display: "inline-flex", alignItems: "center" });

  return (
    <div style={{ backgroundColor: T.bg, border: `1px solid ${T.line}`, padding: "20px", margin: "20px 0", borderRadius: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ color: T.accent, margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>Dividend History</h3>
      </div>
      {rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px", color: T.accent, backgroundColor: T.panel, borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>No dividend data available. Use the <strong>Add Data</strong> button to enter your first dividend.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto", border: `1px solid ${T.lineStrong}`, borderRadius: "10px" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: T.header, color: "#fff" }}>
                {colOrder.map((key) => {
                  const col = cols.find(c => c.key === key);
                  if (!col) return null;
                  const isFiltered = filters[key] && filters[key] !== "All";
                  const filterOpts = getFilterOptions(key);
                  const currentFilter = filters[key] || "All";
                  return (
                    <th
                      key={key}
                      draggable
                      onDragStart={(e) => handleDragStart(e, key)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, key)}
                      style={{ padding: 0, borderRight: "1px solid rgba(255,255,255,0.14)", position: "relative", verticalAlign: "top", width: widths[key], userSelect: "none" }}
                    >
                      <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", cursor: "grab" }}>{col.label}</span>
                          <InfoTip text={col.tip} light />
                          <button onClick={() => setSortConfig({ key, dir: sortConfig.key === key && sortConfig.dir === "asc" ? "desc" : "asc" })}
                            style={iconBtn("rgba(255,255,255,0.6)")}>
                            {sortConfig.key === key ? (sortConfig.dir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} />}
                          </button>
                          <FilterDropdown
                            options={filterOpts}
                            value={currentFilter}
                            onChange={(val) => setFilters(p => ({ ...p, [key]: val === "All" ? "" : val }))}
                            onClose={() => {}}
                          />
                        </div>
                      </div>
                      <div onMouseDown={(e) => startResize(e, key)} style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, i) => (
                <tr key={i} style={{ background: i % 2 ? T.panel : T.bg, borderBottom: `1px solid ${T.lineSoft}` }}>
                  {colOrder.map((key) => (
                    <td key={key} style={{ padding: "10px 12px", fontSize: "13.5px", color: T.body, borderRight: `1px solid ${T.lineSoft}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {key === "amountPerShare" || key === "totalIssued" ? `R${(row[key] || 0).toFixed(2)}` :
                       key === "totalShares" ? (row[key] || 0).toLocaleString() :
                       row[key] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ─── Cap Table Overview (read‑only, enhanced tables) ────────────────── */
const CapTableOverview = ({ investors, irrInvestments, readOnly }) => {
  // Investor table
  const investorCols = [
    { key: "name", label: "Investor", tip: "Name of the investor or shareholder." },
    { key: "shares", label: "Shares (%)", tip: "Number of shares held." },
    { key: "investment", label: "Investment (RM)", tip: "Total amount invested by this shareholder." },
  ];
  const totalShares = investors.reduce((s, inv) => s + inv.shares, 0);
  const totalInvestment = investors.reduce((s, inv) => s + (inv.investment || 0), 0);
  const investorRows = investors.map(inv => ({
    name: inv.name,
    shares: totalShares > 0 ? ((inv.shares / totalShares) * 100).toFixed(1) : "0.0",
    investment: inv.investment || 0,
  }));

  const { colOrder: invOrder, widths: invWidths, filters: invFilters, setFilters: setInvFilters, sortConfig: invSort, setSortConfig: setInvSort, startResize: startInvResize, handleDragStart: invDragStart, handleDragOver: invDragOver, handleDrop: invDrop, getFilterOptions: invFilterOpts, sortedData: sortedInvestors } = useEnhancedTable(investorCols, investorRows);

  // IRR table
  const irrCols = [
    { key: "name", label: "Project", tip: "Name of the investment or project." },
    { key: "irr", label: "IRR %", tip: "Internal Rate of Return (percentage)." },
    { key: "initialInvestment", label: "Initial Investment", tip: "The amount invested upfront." },
    { key: "duration", label: "Duration", tip: "Expected duration of the investment." },
    { key: "riskRating", label: "Risk Rating", tip: "Perceived risk level (Low/Medium/High)." },
  ];
  const irrRows = irrInvestments.map(inv => ({
    name: inv.name,
    irr: inv.irr ?? 0,
    initialInvestment: inv.details?.initialInvestment || "",
    duration: inv.details?.duration || "",
    riskRating: inv.details?.riskRating || "",
  }));

  const { colOrder: irrOrder, widths: irrWidths, filters: irrFilters, setFilters: setIrrFilters, sortConfig: irrSort, setSortConfig: setIrrSort, startResize: startIrrResize, handleDragStart: irrDragStart, handleDragOver: irrDragOver, handleDrop: irrDrop, getFilterOptions: irrFilterOpts, sortedData: sortedIrr } = useEnhancedTable(irrCols, irrRows);

  const iconBtn = (c) => ({ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px", color: c, display: "inline-flex", alignItems: "center" });

  const renderTable = (cols, order, widths, filters, setFilters, sortConfig, setSortConfig, startResize, dragStart, dragOver, drop, filterOpts, data, label) => (
    <div style={{ overflowX: "auto", border: `1px solid ${T.lineStrong}`, borderRadius: "10px", marginBottom: "20px" }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
        <thead>
          <tr style={{ background: T.header, color: "#fff" }}>
            {order.map((key) => {
              const col = cols.find(c => c.key === key);
              if (!col) return null;
              const isFiltered = filters[key] && filters[key] !== "All";
              const currentFilter = filters[key] || "All";
              return (
                <th
                  key={key}
                  draggable
                  onDragStart={(e) => dragStart(e, key)}
                  onDragOver={dragOver}
                  onDrop={(e) => drop(e, key)}
                  style={{ padding: 0, borderRight: "1px solid rgba(255,255,255,0.14)", position: "relative", verticalAlign: "top", width: widths[key], userSelect: "none" }}
                >
                  <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", cursor: "grab" }}>{col.label}</span>
                      <InfoTip text={col.tip} light />
                      <button onClick={() => setSortConfig({ key, dir: sortConfig.key === key && sortConfig.dir === "asc" ? "desc" : "asc" })}
                        style={iconBtn("rgba(255,255,255,0.6)")}>
                        {sortConfig.key === key ? (sortConfig.dir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} />}
                      </button>
                      <FilterDropdown
                        options={filterOpts(key)}
                        value={currentFilter}
                        onChange={(val) => setFilters(p => ({ ...p, [key]: val === "All" ? "" : val }))}
                        onClose={() => {}}
                      />
                    </div>
                  </div>
                  <div onMouseDown={(e) => startResize(e, key)} style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ background: i % 2 ? T.panel : T.bg, borderBottom: `1px solid ${T.lineSoft}` }}>
              {order.map((key) => (
                <td key={key} style={{ padding: "10px 12px", fontSize: "13.5px", color: T.body, borderRight: `1px solid ${T.lineSoft}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {key === "investment" ? `R${(row[key] || 0).toFixed(1)}` :
                   key === "irr" ? `${(row[key] || 0).toFixed(1)}%` :
                   row[key] || "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {label === "investor" && data.length > 0 && (
          <tfoot>
            <tr style={{ background: T.accentTint }}>
              <td colSpan="2" style={{ padding: "10px 12px", fontWeight: 700, color: T.accent }}>Total</td>
              <td style={{ padding: "10px 12px", fontWeight: 700, color: T.accent }}>R{totalInvestment.toFixed(1)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <div style={{ backgroundColor: T.bg, border: `1px solid ${T.line}`, padding: "20px", borderRadius: "10px" }}>
        <h3 style={{ color: T.accent, margin: "0 0 16px", fontSize: "1.1rem", fontWeight: 600 }}>Cap Table Overview</h3>
        {investors.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: T.accent, backgroundColor: T.panel, borderRadius: "8px" }}>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>No investor data available. Use the <strong>Add Data</strong> button to enter your first investor.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
              <div>
                <h4 style={{ color: T.accentSoft, marginBottom: "15px", fontSize: "1rem" }}>Ownership Structure</h4>
                <div style={{ height: "300px" }}>
                  <Pie
                    data={{
                      labels: investors.map((inv) => inv.name),
                      datasets: [
                        {
                          data: investors.map((inv) => inv.shares),
                          backgroundColor: ["#a67c52", "#8b7355", "#b89f8d", "#e6d7c3", "#f5f0e1"],
                          borderColor: "#4a352f",
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: window.innerWidth < 768 ? "bottom" : "right",
                          labels: { font: { size: 11 } }
                        },
                        datalabels: {
                          color: "#fff",
                          font: { weight: "bold", size: 11 },
                          formatter: (value, context) => {
                            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return percentage + "%";
                          },
                        },
                      },
                    }}
                    plugins={[ChartDataLabels]}
                  />
                </div>
              </div>
              <div>
                <h4 style={{ color: T.accentSoft, marginBottom: "15px", fontSize: "1rem" }}>Investor Details</h4>
                {renderTable(investorCols, invOrder, invWidths, invFilters, setInvFilters, invSort, setInvSort, startInvResize, invDragStart, invDragOver, invDrop, invFilterOpts, sortedInvestors, "investor")}
              </div>
            </div>
            <div>
              <h4 style={{ color: T.accentSoft, marginBottom: "15px", fontSize: "1rem" }}>IRR on Equity Investments</h4>
              {irrInvestments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px", color: T.accent, backgroundColor: T.panel, borderRadius: "8px" }}>
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>No investment data available. Use the <strong>Add Data</strong> button to enter your first investment.</p>
                </div>
              ) : (
                renderTable(irrCols, irrOrder, irrWidths, irrFilters, setIrrFilters, irrSort, setIrrSort, startIrrResize, irrDragStart, irrDragOver, irrDrop, irrFilterOpts, sortedIrr, "irr")
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Loan Repayments (read‑only, enhanced table) ────────────────────── */
const LoanRepaymentsPanel = ({ loans, readOnly }) => {
  const cols = [
    { key: "name", label: "Loan Name", tip: "Name of the loan facility." },
    { key: "scheduled", label: "Scheduled", tip: "Amount due for the period." },
    { key: "paid", label: "Paid", tip: "Amount actually paid in the period." },
    { key: "variance", label: "Variance", tip: "Paid minus Scheduled. Negative means underpaid (favourable)." },
  ];
  const rows = loans.map(l => ({
    name: l.name,
    scheduled: parseFloat(l.scheduled) || 0,
    paid: parseFloat(l.paid) || 0,
    variance: (parseFloat(l.paid) || 0) - (parseFloat(l.scheduled) || 0),
  }));
  const { colOrder, widths, filters, setFilters, sortConfig, setSortConfig, startResize, handleDragStart, handleDragOver, handleDrop, getFilterOptions, sortedData } = useEnhancedTable(cols, rows);
  const totalScheduled = rows.reduce((s, r) => s + r.scheduled, 0);
  const totalPaid = rows.reduce((s, r) => s + r.paid, 0);
  const totalVar = totalPaid - totalScheduled;

  const iconBtn = (c) => ({ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px", color: c, display: "inline-flex", alignItems: "center" });

  return (
    <div style={cardS}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: T.accent }}>Loan Repayments</div>
          <div style={{ fontSize: "12.5px", color: T.muted }}>Scheduled vs paid, per loan facility</div>
        </div>
      </div>

      {loans.length === 0 ? (
        <div style={{ padding: "26px 16px", textAlign: "center", color: T.muted, fontSize: "13.5px" }}>
          No loans captured yet — use the <strong>Add Data</strong> button to start.
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: T.header, color: "#fff" }}>
                {colOrder.map((key) => {
                  const col = cols.find(c => c.key === key);
                  if (!col) return null;
                  const currentFilter = filters[key] || "All";
                  const filterOpts = getFilterOptions(key);
                  return (
                    <th
                      key={key}
                      draggable
                      onDragStart={(e) => handleDragStart(e, key)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, key)}
                      style={{ padding: 0, borderRight: "1px solid rgba(255,255,255,0.14)", position: "relative", verticalAlign: "top", width: widths[key], userSelect: "none" }}
                    >
                      <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", cursor: "grab" }}>{col.label}</span>
                          <InfoTip text={col.tip} light />
                          <button onClick={() => setSortConfig({ key, dir: sortConfig.key === key && sortConfig.dir === "asc" ? "desc" : "asc" })}
                            style={iconBtn("rgba(255,255,255,0.6)")}>
                            {sortConfig.key === key ? (sortConfig.dir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} />}
                          </button>
                          <FilterDropdown
                            options={filterOpts}
                            value={currentFilter}
                            onChange={(val) => setFilters(p => ({ ...p, [key]: val === "All" ? "" : val }))}
                            onClose={() => {}}
                          />
                        </div>
                      </div>
                      <div onMouseDown={(e) => startResize(e, key)} style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, i) => (
                <tr key={i} style={{ background: i % 2 ? T.panel : T.bg }}>
                  {colOrder.map((key) => (
                    <td key={key} style={{ padding: "10px 12px", fontSize: "13.5px", color: T.body, borderRight: `1px solid ${T.lineSoft}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {key === "variance" ? (
                        <span style={{ fontWeight: 700, color: row[key] <= 0 ? T.green : T.red }}>
                          {fmtValue(row[key], { units: "R" }, { signed: true })}
                        </span>
                      ) : key === "scheduled" || key === "paid" ? fmtValue(row[key], { units: "R" }) : row[key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: T.accentTint }}>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: T.accent }}>Total</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: T.accent }}>{fmtValue(totalScheduled, { units: "R" })}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: T.accent }}>{fmtValue(totalPaid, { units: "R" })}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: totalVar <= 0 ? T.green : T.red }}>{fmtValue(totalVar, { units: "R" }, { signed: true })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

/* ─── Balance Sheet (read‑only) ────────────────────────────────────────── */
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

const BalanceSheetTab = ({ fy, docs, readOnly }) => {
  const months = useMemo(() => fyMonths(fy.startYear, fy.startMonth), [fy]);
  const [monthKey, setMonthKey] = useState(() => months.find((m) => m.key === currentMonthKey())?.key || months[0].key);
  const meta = months.find((m) => m.key === monthKey) || months[0];
  const monthIndex = months.findIndex((m) => m.key === monthKey);
  const bsDoc = docs[`${DOC.bs}_${meta.year}`];
  const bs = bsDoc?.balanceSheetData || BLANK_BS;
  const mi = meta.month;
  const totals = bsTotals({ balanceSheetData: bs }, mi);

  const Section = ({ title, obj, total }) => {
    if (!obj) return null;
    return (
      <div style={{ marginBottom: "18px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: T.accent, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</div>
        <div style={{ border: `1px solid ${T.line}`, borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
            <tbody>
              {Object.entries(obj).map(([key, arr], i) => {
                if (!Array.isArray(arr)) return null;
                const negative = NEGATIVE_KEYS.has(key);
                const val = arr[mi] !== undefined && arr[mi] !== "" && arr[mi] !== null ? Number(arr[mi]) : null;
                return (
                  <tr key={key} style={{ background: i % 2 ? T.panel : T.bg }}>
                    <td style={{ padding: "7px 12px", fontSize: "13.5px", color: negative ? T.muted : T.ink, borderBottom: `1px solid ${T.lineSoft}`, borderRight: `1px solid ${T.lineSoft}` }}>
                      {negative && <span style={{ color: T.faint, marginRight: "5px" }}>−</span>}
                      {prettify(key)}
                    </td>
                    <td style={{ padding: "7px 12px", textAlign: "right", fontSize: "13.5px", fontVariantNumeric: "tabular-nums", borderBottom: `1px solid ${T.lineSoft}` }}>
                      {val !== null ? fmtValue(val, { units: "R" }) : "—"}
                    </td>
                  </tr>
                );
              })}
              {total !== undefined && (
                <tr style={{ background: T.accentTint }}>
                  <td style={{ padding: "9px 12px", fontSize: "13.5px", fontWeight: 700, color: T.accent, borderRight: `1px solid ${T.lineSoft}` }}>Total {title.toLowerCase()}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: "14px", fontWeight: 700, color: T.accent, fontVariantNumeric: "tabular-nums" }}>
                    {fmtValue(total, { units: "R" })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const CustomSection = ({ list }) => {
    if (!list?.length) return null;
    return (
      <>
        {list.map((cat, ci) => (
          <Section key={cat.name || cat.category || ci} title={cat.category || cat.name || `Custom ${ci + 1}`}
            obj={cat.items} total={sumObj(cat.items, mi)} />
        ))}
      </>
    );
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
          <select value={monthKey} onChange={(e) => setMonthKey(e.target.value)} style={selectS}>
            {months.map((m) => <option key={m.key} value={m.key}>{m.long}</option>)}
          </select>
        </div>
        <button onClick={() => setMonthKey(months[Math.max(0, monthIndex - 1)]?.key)} disabled={monthIndex <= 0}
          style={{ ...btnGhost, padding: "9px 11px", opacity: monthIndex <= 0 ? 0.4 : 1 }}><ChevronLeft size={14} /></button>
        <button onClick={() => setMonthKey(months[Math.min(months.length - 1, monthIndex + 1)]?.key)} disabled={monthIndex >= months.length - 1}
          style={{ ...btnGhost, padding: "9px 11px", opacity: monthIndex >= months.length - 1 ? 0.4 : 1 }}><ChevronRight size={14} /></button>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: "12.5px", color: T.muted, paddingBottom: "10px" }}>Read‑only — edit via <strong>Add Data</strong></span>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        <div>
          <h4 style={{ fontSize: "15px", fontWeight: 700, color: T.accent, margin: "0 0 12px" }}>Assets</h4>
          <Section title="Bank" obj={bs.assets?.bank} total={sumObj(bs.assets?.bank, mi)} />
          <Section title="Current assets" obj={bs.assets?.currentAssets} total={sumObj(bs.assets?.currentAssets, mi)} />
          <Section title="Fixed assets" obj={bs.assets?.fixedAssets} />
          <Section title="Intangible assets" obj={bs.assets?.intangibleAssets} />
          <Section title="Non-current assets" obj={bs.assets?.nonCurrentAssets} total={sumObj(bs.assets?.nonCurrentAssets, mi)} />
          <CustomSection list={bs.assets?.customCategories || bs.customCategories} />
        </div>

        <div>
          <h4 style={{ fontSize: "15px", fontWeight: 700, color: T.accent, margin: "0 0 12px" }}>Liabilities and equity</h4>
          <Section title="Current liabilities" obj={bs.liabilities?.currentLiabilities} total={sumObj(bs.liabilities?.currentLiabilities, mi)} />
          <Section title="Non-current liabilities" obj={bs.liabilities?.nonCurrentLiabilities} total={sumObj(bs.liabilities?.nonCurrentLiabilities, mi)} />
          <CustomSection list={bs.customLiabilitiesCategories} />
          <Section title="Equity" obj={bs.equity} total={sumObj(bs.equity, mi) - 2 * (parseFloat(bs.equity?.treasuryShares?.[mi]) || 0)} />
          <CustomSection list={bs.customEquityCategories} />
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Report Generator — Custom Word document export for Financial Performance
   ════════════════════════════════════════════════════════════════════════ */

const FinancialReportGenerator = ({ tabs, fy, docs, meta, period, onClose, userId, userName, dividends, investors, irrInvestments }) => {
  const [selectedTabs, setSelectedTabs] = useState(() => 
    Object.fromEntries(tabs.map((t) => [t.id, true]))
  );
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [includeEquity, setIncludeEquity] = useState(true);
  const [includeLoans, setIncludeLoans] = useState(true);
  const [includeBalanceSheet, setIncludeBalanceSheet] = useState(true);
  const [includeActions, setIncludeActions] = useState(true);
  const [periodForReport, setPeriodForReport] = useState(period);
  const [generating, setGenerating] = useState(false);
  const [reportTitle, setReportTitle] = useState(`Financial Performance Report - ${new Date().toLocaleDateString()}`);

  // Get actions from governanceCalendar
  const [actions, setActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(true);

  useEffect(() => {
    const loadActions = async () => {
      if (!userId) { setLoadingActions(false); return; }
      try {
        const snap = await getDoc(doc(db, "governanceCalendar", userId));
        if (snap.exists()) {
          const meetings = snap.data().meetings || [];
          const allActions = meetings.flatMap(m => 
            (m.actions || []).map(a => ({ ...a, meetingTitle: m.title }))
          );
          setActions(allActions);
        }
      } catch (err) {
        console.error("Failed to load actions:", err);
      } finally {
        setLoadingActions(false);
      }
    };
    loadActions();
  }, [userId]);

  const generateReport = async () => {
    setGenerating(true);

    // Build the report data structure
    const reportData = {
      title: reportTitle,
      generated: new Date().toISOString(),
      period: PERIOD_LABEL[periodForReport],
      financialYear: fyLabel(fy.startYear, fy.startMonth),
      userName: userName || "User",
      sections: [],
      summary: null,
      actions: [],
      equity: null,
      loans: null,
      balanceSheet: null,
    };

    // Process each selected tab
    const selectedTabList = tabs.filter(t => selectedTabs[t.id]);

    if (includeSummary) {
      // Build summary statistics
      const allKpis = selectedTabList.flatMap(t => 
        t.categories.flatMap(c => c.kpis || [])
      );
      const statusCounts = { green: 0, amber: 0, red: 0, none: 0 };
      allKpis.forEach(k => {
        const s = getStatus(k, periodForReport, fy);
        statusCounts[s.key] = (statusCounts[s.key] || 0) + 1;
      });
      reportData.summary = {
        totalKpis: allKpis.length,
        statusCounts,
        tabs: selectedTabList.map(t => t.name),
      };
    }

    // Build section data for KPI tabs
    selectedTabList.forEach(tab => {
      if (tab.custom) return;
      const section = {
        name: tab.name,
        categories: [],
      };

      tab.categories.forEach(cat => {
        const catData = {
          name: cat.name,
          kpis: [],
        };

        (cat.kpis || []).forEach(k => {
          const v = periodValues(k, periodForReport, fy);
          const status = getStatus(k, periodForReport, fy);
          const variance = getVariance(k, periodForReport, fy);
          catData.kpis.push({
            id: k.id,
            name: k.name,
            units: k.units,
            direction: k.direction,
            meaning: k.meaning,
            measured: k.measured,
            actual: v.actual,
            budget: v.budget,
            variance: variance,
            status: status.label,
            statusKey: status.key,
            notes: k.notes || "",
            source: k.source || "",
          });
        });

        section.categories.push(catData);
      });

      reportData.sections.push(section);
    });

    // Equity data
    if (includeEquity) {
      reportData.equity = {
        dividends: dividends || [],
        investors: investors || [],
        irrInvestments: irrInvestments || [],
      };
    }

    // Loans data
    if (includeLoans) {
      reportData.loans = meta.loans || [];
    }

    // Balance Sheet - include a snapshot
    if (includeBalanceSheet) {
      const months = fyMonths(fy.startYear, fy.startMonth);
      const currentMonth = months.find((m) => m.key === currentMonthKey()) || months[0];
      const bsDoc = docs[`${DOC.bs}_${currentMonth.year}`];
      const bs = bsDoc?.balanceSheetData || BLANK_BS;
      const totals = bsTotals({ balanceSheetData: bs }, currentMonth.month);
      
      reportData.balanceSheet = {
        month: currentMonth.long,
        totals: {
          assets: totals.assets,
          liabilities: totals.liabilities,
          equity: totals.equity,
          currentAssets: totals.currentAssets,
          currentLiabilities: totals.currentLiabilities,
          cash: totals.cash,
        },
        hasData: monthHasBs(bs, currentMonth.month),
      };
    }

    // Get actions
    if (includeActions) {
      const financialActions = actions.filter(a => 
        a.sourceModule === "Financial Performance" || 
        a.category === "Financial Performance" ||
        a.sourceCategory?.includes("Financial")
      );
      reportData.actions = financialActions.map(a => ({
        title: a.title,
        description: a.description,
        status: a.status,
        dueDate: a.dueDate,
        assignedTo: a.assignedTo,
        category: a.category,
        sourceKpi: a.sourceKpi,
        meetingTitle: a.meetingTitle,
      }));
    }

    // Generate the Word document
    const htmlContent = generateWordHTML(reportData, includeCharts, includeAnalysis);
    
    // Create the download
    const blob = new Blob([htmlContent], { 
      type: "application/msword;charset=utf-8" 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportTitle.replace(/[^a-zA-Z0-9]/g, "_")}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setGenerating(false);
    onClose();
  };

  const generateWordHTML = (data, includeCharts, includeAnalysis) => {
    const statusColor = (key) => {
      if (key === "green") return "#166534";
      if (key === "amber") return "#92400e";
      if (key === "red") return "#991b1b";
      return "#6b5b55";
    };

    const statusBg = (key) => {
      if (key === "green") return "#f0fdf4";
      if (key === "amber") return "#fffbeb";
      if (key === "red") return "#fef2f2";
      return "#f2eeec";
    };

    const fmtVal = (v, units) => {
      if (v === null || v === undefined || v === "") return "—";
      if (units === "%") return `${trimNum(Number(v))}%`;
      if (units === "×") return `${Number(v).toFixed(2)}×`;
      if (units === "R") {
        const n = Number(v);
        if (n >= 1_000_000) return `R ${(n / 1_000_000).toFixed(1)}m`;
        if (n >= 1_000) return `R ${(n / 1_000).toFixed(1)}k`;
        return `R ${n.toFixed(0)}`;
      }
      if (units && !["#","%","R","×"].includes(units)) return `${trimNum(Number(v))} ${units}`;
      return trimNum(Number(v));
    };

    const kpiRows = (kpis) => {
      if (!kpis.length) return "";
      let html = `
        <table style="width:100%; border-collapse:collapse; font-size:10pt; margin:8px 0;">
          <thead>
            <tr style="background:#241813; color:#fff;">
              <th style="padding:6px 10px; text-align:left; border:1px solid #ddd;">KPI</th>
              <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Units</th>
              <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Budget</th>
              <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Actual</th>
              <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Variance</th>
              <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Status</th>
            </tr>
          </thead>
          <tbody>`;
      kpis.forEach((k, i) => {
        const bg = i % 2 === 0 ? "#ffffff" : "#faf8f7";
        html += `
          <tr style="background:${bg};">
            <td style="padding:6px 10px; border:1px solid #ddd; font-weight:500;">${k.name}</td>
            <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">${k.units}</td>
            <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">${fmtVal(k.budget, k.units)}</td>
            <td style="padding:6px 10px; border:1px solid #ddd; text-align:center; font-weight:600;">${fmtVal(k.actual, k.units)}</td>
            <td style="padding:6px 10px; border:1px solid #ddd; text-align:center; color:${k.variance !== null && k.variance >= 0 ? '#166534' : '#991b1b'};">${k.variance !== null ? fmtVal(k.variance, k.units) : "—"}</td>
            <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">
              <span style="background:${statusBg(k.statusKey)}; color:${statusColor(k.statusKey)}; padding:2px 12px; border-radius:12px; font-weight:600; font-size:9pt;">${k.status}</span>
            </td>
          </tr>`;
      });
      html += `</tbody></table>`;
      return html;
    };

    // Build sections HTML
    let sectionsHtml = "";
    data.sections.forEach(section => {
      sectionsHtml += `<h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">${section.name}</h2>`;
      
      section.categories.forEach(cat => {
        if (cat.kpis.length) {
          sectionsHtml += `
            <h3 style="color:#4a352f; font-size:12pt; margin:12px 0 6px;">${cat.name}</h3>
            ${kpiRows(cat.kpis)}
          `;
        }
      });
    });

    // Equity section
    let equityHtml = "";
    if (data.equity && (data.equity.dividends.length || data.equity.investors.length)) {
      equityHtml = `
        <h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">Equity Structure</h2>`;
      
      if (data.equity.dividends.length) {
        let divRows = "";
        data.equity.dividends.forEach((d, i) => {
          const bg = i % 2 === 0 ? "#ffffff" : "#faf8f7";
          divRows += `
            <tr style="background:${bg};">
              <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${d.year}</td>
              <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">R${(d.amountPerShare || 0).toFixed(2)}</td>
              <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${(d.totalShares || 0).toLocaleString()}</td>
              <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">R${(d.totalIssued || 0).toFixed(2)}</td>
              <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${d.paymentDate || "—"}</td>
            </tr>`;
        });
        equityHtml += `
          <h3 style="color:#4a352f; font-size:12pt; margin:12px 0 6px;">Dividend History</h3>
          <table style="width:100%; border-collapse:collapse; font-size:9pt; margin:8px 0;">
            <thead><tr style="background:#241813; color:#fff;">
              <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Year</th>
              <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Amount/Share</th>
              <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Total Shares</th>
              <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Total Issued</th>
              <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Payment Date</th>
            </tr></thead>
            <tbody>${divRows}</tbody>
          </table>`;
      }

      if (data.equity.investors.length) {
        let invRows = "";
        const totalShares = data.equity.investors.reduce((s, inv) => s + inv.shares, 0);
        data.equity.investors.forEach((inv, i) => {
          const bg = i % 2 === 0 ? "#ffffff" : "#faf8f7";
          const pct = totalShares > 0 ? ((inv.shares / totalShares) * 100).toFixed(1) : 0;
          invRows += `
            <tr style="background:${bg};">
              <td style="padding:4px 8px; border:1px solid #ddd;">${inv.name}</td>
              <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${pct}%</td>
              <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">R${(inv.investment || 0).toFixed(1)}</td>
            </tr>`;
        });
        equityHtml += `
          <h3 style="color:#4a352f; font-size:12pt; margin:12px 0 6px;">Cap Table</h3>
          <table style="width:100%; border-collapse:collapse; font-size:9pt; margin:8px 0;">
            <thead><tr style="background:#241813; color:#fff;">
              <th style="padding:4px 8px; border:1px solid #ddd; text-align:left;">Investor</th>
              <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Shares</th>
              <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Investment</th>
            </tr></thead>
            <tbody>${invRows}</tbody>
          </table>`;
      }
    }

    // Loans section
    let loansHtml = "";
    if (data.loans && data.loans.length) {
      let loanRows = "";
      let totalScheduled = 0, totalPaid = 0;
      data.loans.forEach((l, i) => {
        const bg = i % 2 === 0 ? "#ffffff" : "#faf8f7";
        const scheduled = parseFloat(l.scheduled) || 0;
        const paid = parseFloat(l.paid) || 0;
        const varAmount = paid - scheduled;
        totalScheduled += scheduled;
        totalPaid += paid;
        loanRows += `
          <tr style="background:${bg};">
            <td style="padding:4px 8px; border:1px solid #ddd;">${l.name}</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">R${scheduled.toFixed(0)}</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">R${paid.toFixed(0)}</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center; color:${varAmount <= 0 ? '#166534' : '#991b1b'};">R${varAmount.toFixed(0)}</td>
          </tr>`;
      });
      const totalVar = totalPaid - totalScheduled;
      loansHtml = `
        <h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">Loan Repayments</h2>
        <table style="width:100%; border-collapse:collapse; font-size:9pt; margin:8px 0;">
          <thead><tr style="background:#241813; color:#fff;">
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:left;">Loan Name</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Scheduled</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Paid</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Variance</th>
          </tr></thead>
          <tbody>${loanRows}</tbody>
          <tfoot>
            <tr style="background:#f4efec;">
              <td style="padding:4px 8px; border:1px solid #ddd; font-weight:700;">Total</td>
              <td style="padding:4px 8px; border:1px solid #ddd; text-align:center; font-weight:700;">R${totalScheduled.toFixed(0)}</td>
              <td style="padding:4px 8px; border:1px solid #ddd; text-align:center; font-weight:700;">R${totalPaid.toFixed(0)}</td>
              <td style="padding:4px 8px; border:1px solid #ddd; text-align:center; font-weight:700; color:${totalVar <= 0 ? '#166534' : '#991b1b'};">R${totalVar.toFixed(0)}</td>
            </tr>
          </tfoot>
        </table>`;
    }

    // Balance Sheet section
    let bsHtml = "";
    if (data.balanceSheet && data.balanceSheet.hasData) {
      const bs = data.balanceSheet;
      bsHtml = `
        <h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">Balance Sheet</h2>
        <p style="font-size:10pt; color:#6b5b55;">As at ${bs.month}</p>
        <table style="width:60%; border-collapse:collapse; font-size:10pt; margin:8px 0;">
          <tr style="background:#241813; color:#fff;">
            <th style="padding:6px 12px; border:1px solid #ddd; text-align:left;">Item</th>
            <th style="padding:6px 12px; border:1px solid #ddd; text-align:right;">Amount (R)</th>
          </tr>
          <tr style="background:#faf8f7;">
            <td style="padding:6px 12px; border:1px solid #ddd;">Total Assets</td>
            <td style="padding:6px 12px; border:1px solid #ddd; text-align:right; font-weight:600;">${fmtVal(bs.totals.assets, "R")}</td>
          </tr>
          <tr style="background:#ffffff;">
            <td style="padding:6px 12px; border:1px solid #ddd; padding-left:20px;">Current Assets</td>
            <td style="padding:6px 12px; border:1px solid #ddd; text-align:right;">${fmtVal(bs.totals.currentAssets, "R")}</td>
          </tr>
          <tr style="background:#faf8f7;">
            <td style="padding:6px 12px; border:1px solid #ddd; padding-left:20px;">Cash</td>
            <td style="padding:6px 12px; border:1px solid #ddd; text-align:right;">${fmtVal(bs.totals.cash, "R")}</td>
          </tr>
          <tr style="background:#ffffff;">
            <td style="padding:6px 12px; border:1px solid #ddd;">Total Liabilities</td>
            <td style="padding:6px 12px; border:1px solid #ddd; text-align:right; font-weight:600;">${fmtVal(bs.totals.liabilities, "R")}</td>
          </tr>
          <tr style="background:#faf8f7;">
            <td style="padding:6px 12px; border:1px solid #ddd; padding-left:20px;">Current Liabilities</td>
            <td style="padding:6px 12px; border:1px solid #ddd; text-align:right;">${fmtVal(bs.totals.currentLiabilities, "R")}</td>
          </tr>
          <tr style="background:#ffffff;">
            <td style="padding:6px 12px; border:1px solid #ddd;">Total Equity</td>
            <td style="padding:6px 12px; border:1px solid #ddd; text-align:right; font-weight:600;">${fmtVal(bs.totals.equity, "R")}</td>
          </tr>
          <tr style="background:#f4efec; font-weight:700;">
            <td style="padding:6px 12px; border:1px solid #ddd;">Net Asset Value</td>
            <td style="padding:6px 12px; border:1px solid #ddd; text-align:right;">${fmtVal((bs.totals.assets || 0) - (bs.totals.liabilities || 0), "R")}</td>
          </tr>
        </table>
        <p style="font-size:9pt; color:#6b5b55;">* Current Ratio: ${Number.isFinite(bs.totals.currentAssets) && Number.isFinite(bs.totals.currentLiabilities) && bs.totals.currentLiabilities !== 0 ? (bs.totals.currentAssets / bs.totals.currentLiabilities).toFixed(2) + "×" : "—"}</p>
      `;
    }

    // Analysis section
    let analysisHtml = "";
    if (includeAnalysis) {
      analysisHtml = `
        <h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">Analysis & Observations</h2>
        <div style="font-size:10pt; line-height:1.6;">`;
      
      data.sections.forEach(section => {
        section.categories.forEach(cat => {
          cat.kpis.forEach(k => {
            const status = k.statusKey;
            if (status === "red" || status === "amber") {
              analysisHtml += `
                <div style="background:${statusBg(status)}; padding:8px 12px; margin:6px 0; border-radius:4px; border-left:3px solid ${statusColor(status)};">
                  <strong>${k.name}</strong> — ${k.status}
                  ${k.variance !== null ? ` (${k.variance >= 0 ? "+" : ""}${fmtVal(k.variance, k.units)})` : ""}
                  ${k.notes ? `<br><span style="color:#6b5b55; font-size:9pt;">Note: ${k.notes}</span>` : ""}
                </div>
              `;
            }
          });
        });
      });

      // Summary stats
      const allKpis = data.sections.flatMap(s => 
        s.categories.flatMap(c => c.kpis || [])
      );
      const reds = allKpis.filter(k => k.statusKey === "red");
      const ambers = allKpis.filter(k => k.statusKey === "amber");
      const greens = allKpis.filter(k => k.statusKey === "green");
      
      analysisHtml += `
        <div style="background:#faf8f7; padding:12px 16px; margin:12px 0; border-radius:6px;">
          <p><strong>Summary:</strong> ${greens.length} on budget · ${ambers.length} needs attention · ${reds.length} critical</p>
          ${reds.length ? `<p style="color:#991b1b;"><strong>Critical items:</strong> ${reds.map(k => k.name).join(", ")}</p>` : ""}
          ${ambers.length ? `<p style="color:#92400e;"><strong>Needs attention:</strong> ${ambers.map(k => k.name).join(", ")}</p>` : ""}
          ${reds.length === 0 && ambers.length === 0 && greens.length > 0 ? `<p style="color:#166534;">All KPIs are on budget.</p>` : ""}
        </div>`;
      analysisHtml += `</div>`;
    }

    // Actions section
    let actionsHtml = "";
    if (includeActions && data.actions.length) {
      let actionRows = "";
      data.actions.forEach(a => {
        const statusColors = { "Done": "#166534", "In Progress": "#92400e", "Not Done": "#991b1b" };
        const color = statusColors[a.status] || "#6b5b55";
        actionRows += `
          <tr>
            <td style="padding:6px 10px; border:1px solid #ddd;">${a.title}</td>
            <td style="padding:6px 10px; border:1px solid #ddd; font-size:9pt;">${a.description || "—"}</td>
            <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">${a.assignedTo || "—"}</td>
            <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">${a.dueDate || "—"}</td>
            <td style="padding:6px 10px; border:1px solid #ddd; text-align:center; color:${color}; font-weight:600;">${a.status}</td>
          </tr>`;
      });
      actionsHtml = `
        <h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">Actions</h2>
        <p style="font-size:10pt; color:#6b5b55;">${data.actions.length} actions related to Financial Performance</p>
        <table style="width:100%; border-collapse:collapse; font-size:9pt; margin:8px 0;">
          <thead><tr style="background:#241813; color:#fff;">
            <th style="padding:6px 10px; border:1px solid #ddd; text-align:left;">Action</th>
            <th style="padding:6px 10px; border:1px solid #ddd; text-align:left;">Description</th>
            <th style="padding:6px 10px; border:1px solid #ddd; text-align:center;">Owner</th>
            <th style="padding:6px 10px; border:1px solid #ddd; text-align:center;">Due Date</th>
            <th style="padding:6px 10px; border:1px solid #ddd; text-align:center;">Status</th>
          </tr></thead>
          <tbody>${actionRows}</tbody>
        </table>`;
    }

    return `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${data.title}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #2d201c; }
          h1 { color: #2d201c; font-size: 22pt; font-weight: 600; margin-bottom: 4px; }
          .subtitle { color: #6b5b55; font-size: 11pt; margin-bottom: 24px; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          @page { margin: 2cm; }
        </style>
      </head>
      <body>
        <h1>${data.title}</h1>
        <div class="subtitle">
          Generated ${new Date(data.generated).toLocaleDateString()} · ${data.period} · FY ${data.financialYear}
          <br>${data.userName}
        </div>

        ${data.summary ? `
          <div style="background:#faf8f7; padding:12px 16px; border-radius:6px; margin-bottom:16px;">
            <p style="font-size:11pt; margin:0;">
              <strong>${data.summary.totalKpis} KPIs</strong> across ${data.summary.tabs.length} sections
              · ${data.summary.statusCounts.green} on budget
              · ${data.summary.statusCounts.amber} needs attention
              · ${data.summary.statusCounts.red} critical
            </p>
          </div>
        ` : ""}

        ${sectionsHtml}
        ${loansHtml}
        ${equityHtml}
        ${bsHtml}
        ${analysisHtml}
        ${actionsHtml}

        <p style="color:#8a7a74; font-size:8pt; text-align:center; margin-top:40px; border-top:1px solid #ded8d4; padding-top:16px;">
          Financial Performance Report · Generated from RAPS Platform
        </p>
      </body>
      </html>
    `;
  };

  return (
    <Modal title="Generate Financial Report" subtitle="Select what to include in the Word document" icon={<FileText size={17} />} onClose={onClose} width={680}
      footer={<> 
        <button onClick={onClose} style={btnGhost}>Cancel</button>
        <button onClick={generateReport} disabled={generating || !Object.values(selectedTabs).some(v => v)} 
          style={{ ...btnPrimary, opacity: generating || !Object.values(selectedTabs).some(v => v) ? 0.6 : 1 }}>
          {generating ? "Generating..." : <><Download size={14} /> Generate Report</>}
        </button>
      </>}>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelS}>Report Title</label>
        <input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} style={inputS} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
        <div>
          <label style={labelS}>Period</label>
          <select value={periodForReport} onChange={(e) => setPeriodForReport(e.target.value)} style={selectS}>
            {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
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
              <input type="checkbox" checked={selectedTabs[t.id]} 
                onChange={() => setSelectedTabs(p => ({ ...p, [t.id]: !p[t.id] }))} />
              {t.name}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelS}>Include</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer", padding: "4px 0" }}>
            <input type="checkbox" checked={includeSummary} onChange={() => setIncludeSummary(!includeSummary)} />
            Summary header
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer", padding: "4px 0" }}>
            <input type="checkbox" checked={includeCharts} onChange={() => setIncludeCharts(!includeCharts)} />
            Charts (static view)
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer", padding: "4px 0" }}>
            <input type="checkbox" checked={includeAnalysis} onChange={() => setIncludeAnalysis(!includeAnalysis)} />
            Analysis & observations
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer", padding: "4px 0" }}>
            <input type="checkbox" checked={includeEquity} onChange={() => setIncludeEquity(!includeEquity)} />
            Equity Structure
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer", padding: "4px 0" }}>
            <input type="checkbox" checked={includeLoans} onChange={() => setIncludeLoans(!includeLoans)} />
            Loan Repayments
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer", padding: "4px 0" }}>
            <input type="checkbox" checked={includeBalanceSheet} onChange={() => setIncludeBalanceSheet(!includeBalanceSheet)} />
            Balance Sheet snapshot
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer", padding: "4px 0" }}>
            <input type="checkbox" checked={includeActions} onChange={() => setIncludeActions(!includeActions)} />
            Actions
          </label>
        </div>
      </div>

      <div style={{ ...cardS, background: T.panel, fontSize: "12.5px", color: T.body }}>
        <Info size={14} color={T.accentSoft} style={{ marginRight: "8px" }} />
        The report will be generated as a Word document (.doc) that can be opened in Microsoft Word, Google Docs, or LibreOffice.
        {includeCharts && " Charts are rendered as static tables and summaries."}
      </div>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   AddChooser, AddDataWizard, and AddKpiWizard Components
   ════════════════════════════════════════════════════════════════════════ */

// ─── AddChooser ──────────────────────────────────────────────────────────
const AddChooser = ({ onClose, onPick }) => {
  return (
    <Modal title="Add KPI or Data" subtitle="Choose what you'd like to add to Financial Performance" icon={<Plus size={17} />} onClose={onClose} width={520}
      footer={<button onClick={onClose} style={btnPrimary}>Cancel</button>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <button onClick={() => onPick("kpi")} style={{ ...cardS, cursor: "pointer", textAlign: "center", transition: "all 0.15s", "&:hover": { borderColor: T.accent } }}>
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>📊</div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: T.accent }}>Add KPI</div>
          <div style={{ fontSize: "12.5px", color: T.muted, marginTop: "4px" }}>Create a custom KPI with its own category</div>
        </button>
        <button onClick={() => onPick("data")} style={{ ...cardS, cursor: "pointer", textAlign: "center", transition: "all 0.15s", "&:hover": { borderColor: T.accent } }}>
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>📝</div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: T.accent }}>Add Data</div>
          <div style={{ fontSize: "12.5px", color: T.muted, marginTop: "4px" }}>Enter numbers for KPIs, Balance Sheet, Loans, Equity</div>
        </button>
      </div>
    </Modal>
  );
};

// ─── AddKpiWizard ──────────────────────────────────────────────────────
const AddKpiWizard = ({ tabs, currentTabId, onBack, onClose, onSave }) => {
  const [form, setForm] = useState({
    id: uid(), name: "", units: "", category: "", tabId: currentTabId || tabs[0]?.id || "summary",
    direction: "higher", aggregate: "avg", meaning: "", measured: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!form.name.trim()) { setError("KPI name is required."); return; }
    if (!form.units.trim()) { setError("Units are required."); return; }
    if (!form.category.trim()) { setError("Category is required."); return; }
    setSaving(true); setError("");
    try {
      await onSave({ ...form, kpis: [] });
      onClose();
    } catch (err) {
      setError(errText(err));
      setSaving(false);
    }
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
        <div>
          <label style={labelS}>KPI Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputS} />
        </div>
        <div>
          <label style={labelS}>Units *</label>
          <input value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} style={inputS} placeholder="e.g. R, %, ×" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div>
          <label style={labelS}>Tab</label>
          <select value={form.tabId} onChange={(e) => setForm({ ...form, tabId: e.target.value, category: "" })} style={selectS}>
            {tabOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelS}>Category *</label>
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputS} placeholder="New or existing category" list="cat-suggestions" />
          <datalist id="cat-suggestions">
            {catOptions.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div>
          <label style={labelS}>Direction</label>
          <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} style={selectS}>
            {DIRECTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelS}>Aggregate</label>
          <select value={form.aggregate} onChange={(e) => setForm({ ...form, aggregate: e.target.value })} style={selectS}>
            <option value="avg">Average across periods</option>
            <option value="sum">Sum across periods</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: "12px" }}>
        <label style={labelS}>Meaning</label>
        <textarea rows="2" value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })} style={{ ...inputS, resize: "vertical" }} placeholder="What does this KPI tell you about the business?" />
      </div>
      <div>
        <label style={labelS}>How is it measured?</label>
        <textarea rows="3" value={form.measured} onChange={(e) => setForm({ ...form, measured: e.target.value })} style={{ ...inputS, resize: "vertical" }} placeholder="e.g. =SUM(Sales) - SUM(COGS)" />
      </div>
    </Modal>
  );
};

// ─── AddDataWizard ──────────────────────────────────────────────────────
const AddDataWizard = ({ tabs, fy, docs, currentTabId, prefs, onSavePrefs, onBack, onClose, onSaveField, onSaveBalanceSheetCell, onSaveLoans, onSaveDividends, onSaveCapTable, dividends, investors, irrInvestments, loans, readOnly }) => {
  const [mode, setMode] = useState(prefs?.mode || "kpi");
  const [year, setYear] = useState(prefs?.year || fy.startYear);
  const [monthIndex, setMonthIndex] = useState(prefs?.monthIndex ?? new Date().getMonth());
  const [kpiId, setKpiId] = useState(prefs?.kpiId || "");
  const [categoryName, setCategoryName] = useState("");
  const [field, setField] = useState("actual");
  const [raw, setRaw] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const months = useMemo(() => fyMonths(year, fy.startMonth), [year, fy]);
  const currentMonth = months.find((m, i) => i === monthIndex) || months[0];

  // Get all KPIs across all tabs
  const allKpis = useMemo(() => {
    const list = [];
    tabs.forEach(tab => {
      if (tab.custom) return;
      tab.categories.forEach(cat => {
        (cat.kpis || []).forEach(k => {
          list.push({ ...k, tabName: tab.name, categoryName: cat.name });
        });
      });
    });
    return list;
  }, [tabs]);

  const selectedKpi = allKpis.find(k => k.id === kpiId);

  // ─── KPI data entry ──────────────────────────────────────────────────
  const handleKpiSave = async () => {
    if (!selectedKpi) { setMessage("Select a KPI first."); return; }
    const num = parseNumberInput(raw);
    if (num === null) { setMessage("Please enter a valid number."); return; }
    setSaving(true); setMessage("");
    try {
      await onSaveField({
        kpi: selectedKpi,
        which: field,
        raw: String(num),
        year: currentMonth.year,
        monthIndex: currentMonth.month,
      });
      setSuccess(true);
      setMessage(`${selectedKpi.name} ${field} saved for ${currentMonth.long}`);
      setTimeout(() => { setSuccess(false); setMessage(""); }, 2500);
      onSavePrefs({ mode, year, monthIndex, kpiId });
    } catch (err) {
      setMessage(`Error: ${errText(err)}`);
    } finally { setSaving(false); }
  };

  // ─── Balance Sheet data entry ────────────────────────────────────────
  const [bsPath, setBsPath] = useState("");
  const [bsKey, setBsKey] = useState("");
  const [bsRaw, setBsRaw] = useState("");
  const [bsSection, setBsSection] = useState("assets");
  const bsSections = ["assets", "liabilities", "equity"];

  const handleBsSave = async () => {
    if (!bsPath || !bsKey) { setMessage("Select a path and a key first."); return; }
    const num = parseNumberInput(bsRaw);
    if (num === null) { setMessage("Please enter a valid number."); return; }
    setSaving(true); setMessage("");
    try {
      await onSaveBalanceSheetCell({
        year: currentMonth.year,
        monthIndex: currentMonth.month,
        path: bsPath,
        key: bsKey,
        raw: String(num),
      });
      setSuccess(true);
      setMessage(`Balance Sheet cell saved for ${currentMonth.long}`);
      setTimeout(() => { setSuccess(false); setMessage(""); }, 2500);
    } catch (err) {
      setMessage(`Error: ${errText(err)}`);
    } finally { setSaving(false); }
  };

  // ─── Loans data entry ────────────────────────────────────────────────
  const [loanName, setLoanName] = useState("");
  const [loanScheduled, setLoanScheduled] = useState("");
  const [loanPaid, setLoanPaid] = useState("");

  const handleLoanSave = async () => {
    if (!loanName.trim()) { setMessage("Loan name is required."); return; }
    const scheduled = parseNumberInput(loanScheduled);
    const paid = parseNumberInput(loanPaid);
    if (scheduled === null && paid === null) { setMessage("Enter at least one amount."); return; }
    setSaving(true); setMessage("");
    try {
      const newLoans = [...loans, { name: loanName.trim(), scheduled: scheduled !== null ? String(scheduled) : "", paid: paid !== null ? String(paid) : "" }];
      await onSaveLoans(newLoans);
      setSuccess(true);
      setMessage(`Loan "${loanName}" added.`);
      setLoanName(""); setLoanScheduled(""); setLoanPaid("");
      setTimeout(() => { setSuccess(false); setMessage(""); }, 2500);
    } catch (err) {
      setMessage(`Error: ${errText(err)}`);
    } finally { setSaving(false); }
  };

  // ─── Dividends data entry ────────────────────────────────────────────
  const [divYear, setDivYear] = useState(new Date().getFullYear());
  const [divAmount, setDivAmount] = useState("");
  const [divShares, setDivShares] = useState("");
  const [divPaymentDate, setDivPaymentDate] = useState("");

  const handleDividendSave = async () => {
    const amount = parseNumberInput(divAmount);
    const shares = parseNumberInput(divShares);
    if (amount === null || shares === null) { setMessage("Amount and shares are required."); return; }
    setSaving(true); setMessage("");
    try {
      const newDividends = [...dividends, {
        year: divYear,
        amountPerShare: amount,
        totalShares: shares,
        totalIssued: amount * shares,
        paymentDate: divPaymentDate || "",
        notes: "",
      }];
      await onSaveDividends(newDividends);
      setSuccess(true);
      setMessage(`Dividend for ${divYear} added.`);
      setDivAmount(""); setDivShares(""); setDivPaymentDate("");
      setTimeout(() => { setSuccess(false); setMessage(""); }, 2500);
    } catch (err) {
      setMessage(`Error: ${errText(err)}`);
    } finally { setSaving(false); }
  };

  // ─── Cap Table data entry ────────────────────────────────────────────
  const [invName, setInvName] = useState("");
  const [invShares, setInvShares] = useState("");
  const [invInvestment, setInvInvestment] = useState("");

  const handleInvestorSave = async () => {
    if (!invName.trim()) { setMessage("Investor name is required."); return; }
    const shares = parseNumberInput(invShares);
    const investment = parseNumberInput(invInvestment);
    if (shares === null) { setMessage("Shares are required."); return; }
    setSaving(true); setMessage("");
    try {
      const newInvestors = [...investors, { name: invName.trim(), shares, investment: investment || 0 }];
      await onSaveCapTable({ investors: newInvestors, irrInvestments });
      setSuccess(true);
      setMessage(`Investor "${invName}" added.`);
      setInvName(""); setInvShares(""); setInvInvestment("");
      setTimeout(() => { setSuccess(false); setMessage(""); }, 2500);
    } catch (err) {
      setMessage(`Error: ${errText(err)}`);
    } finally { setSaving(false); }
  };

  // ─── IRR data entry ──────────────────────────────────────────────────
  const [irrName, setIrrName] = useState("");
  const [irrValue, setIrrValue] = useState("");
  const [irrInitial, setIrrInitial] = useState("");
  const [irrDuration, setIrrDuration] = useState("");
  const [irrRisk, setIrrRisk] = useState("Medium");

  const handleIrrtSave = async () => {
    if (!irrName.trim()) { setMessage("Project name is required."); return; }
    const irr = parseNumberInput(irrValue);
    if (irr === null) { setMessage("IRR percentage is required."); return; }
    setSaving(true); setMessage("");
    try {
      const newIrr = [...irrInvestments, {
        name: irrName.trim(),
        irr,
        details: {
          initialInvestment: irrInitial || "",
          duration: irrDuration || "",
          riskRating: irrRisk,
        },
      }];
      await onSaveCapTable({ investors, irrInvestments: newIrr });
      setSuccess(true);
      setMessage(`Investment "${irrName}" added.`);
      setIrrName(""); setIrrValue(""); setIrrInitial(""); setIrrDuration("");
      setTimeout(() => { setSuccess(false); setMessage(""); }, 2500);
    } catch (err) {
      setMessage(`Error: ${errText(err)}`);
    } finally { setSaving(false); }
  };

  const savePrefs = (patch) => {
    onSavePrefs({ mode, year, monthIndex, kpiId, ...patch });
  };

  useEffect(() => {
    savePrefs({ mode, year, monthIndex, kpiId });
  }, [mode, year, monthIndex, kpiId]);

  return (
    <Modal title="Add Data" subtitle="Enter numbers for KPIs, Balance Sheet, Loans, or Equity" icon={<Database size={17} />} onClose={onClose} width={620}
      footer={
        <>
          <button onClick={onBack} style={btnGhost}><ArrowLeft size={13} /> Back</button>
          <button onClick={onClose} style={btnGhost}>Close</button>
        </>
      }>

      {/* Mode selector */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px", background: T.raised, borderRadius: "10px", padding: "4px", flexWrap: "wrap" }}>
        {["kpi", "bs", "loans", "dividends", "investors", "irr"].map(m => {
          const on = m === mode;
          const labels = { kpi: "KPI", bs: "Balance Sheet", loans: "Loans", dividends: "Dividends", investors: "Cap Table", irr: "IRR Investments" };
          return (
            <button key={m} onClick={() => setMode(m)}
              style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: on ? 600 : 500,
                border: "none", cursor: "pointer", fontFamily: "inherit", flex: "1 1 auto",
                background: on ? T.bg : "transparent", color: on ? T.accent : T.body,
                boxShadow: on ? "0 1px 4px rgba(45,32,28,0.12)" : "none" }}>
              {labels[m]}
            </button>
          );
        })}
      </div>

      {/* Month/Year selector for modes that need it */}
      {(mode === "kpi" || mode === "bs") && (
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: "180px" }}>
            <label style={labelS}>Month</label>
            <select value={monthIndex} onChange={(e) => { setMonthIndex(Number(e.target.value)); setSuccess(false); setMessage(""); }}
              style={selectS}>
              {months.map((m, i) => <option key={i} value={i}>{m.long}</option>)}
            </select>
          </div>
          <div style={{ minWidth: "100px" }}>
            <label style={labelS}>Year</label>
            <select value={year} onChange={(e) => { setYear(Number(e.target.value)); setSuccess(false); setMessage(""); }}
              style={selectS}>
              {[fy.startYear - 1, fy.startYear, fy.startYear + 1, fy.startYear + 2].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <span style={{ fontSize: "12.5px", color: T.muted, paddingBottom: "9px" }}>
            FY {fyLabel(year, fy.startMonth)}
          </span>
        </div>
      )}

      {/* ─── KPI mode ────────────────────────────────────────────────── */}
      {mode === "kpi" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelS}>KPI</label>
              <select value={kpiId} onChange={(e) => { setKpiId(e.target.value); setSuccess(false); setMessage(""); }}
                style={selectS}>
                <option value="">Select a KPI</option>
                {allKpis.map(k => <option key={k.id} value={k.id}>{k.name} ({k.units})</option>)}
              </select>
            </div>
            <div>
              <label style={labelS}>Field</label>
              <select value={field} onChange={(e) => setField(e.target.value)} style={selectS}>
                <option value="actual">Actual</option>
                <option value="budget">Budget</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={labelS}>Value</label>
              <input value={raw} onChange={(e) => setRaw(e.target.value)} style={inputS} placeholder="Enter a number..." />
            </div>
            <button onClick={handleKpiSave} disabled={saving || !kpiId} style={{ ...btnPrimary, opacity: saving || !kpiId ? 0.6 : 1, marginBottom: "1px" }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
          {selectedKpi && (
            <div style={{ marginTop: "8px", fontSize: "12.5px", color: T.muted }}>
              {selectedKpi.tabName} · {selectedKpi.categoryName} · {selectedKpi.units}
            </div>
          )}
          {message && <div style={{ marginTop: "10px", color: success ? T.green : T.red, fontSize: "13px" }}>{message}</div>}
        </>
      )}

      {/* ─── Balance Sheet mode ──────────────────────────────────────── */}
      {mode === "bs" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelS}>Section</label>
              <select value={bsSection} onChange={(e) => setBsSection(e.target.value)} style={selectS}>
                {bsSections.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelS}>Path (e.g. assets.bank)</label>
              <input value={bsPath} onChange={(e) => setBsPath(e.target.value)} style={inputS} placeholder="assets.currentAssets" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelS}>Field name</label>
              <input value={bsKey} onChange={(e) => setBsKey(e.target.value)} style={inputS} placeholder="e.g. cash" />
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={labelS}>Value</label>
                <input value={bsRaw} onChange={(e) => setBsRaw(e.target.value)} style={inputS} placeholder="Number..." />
              </div>
              <button onClick={handleBsSave} disabled={saving || !bsPath || !bsKey} style={{ ...btnPrimary, opacity: saving || !bsPath || !bsKey ? 0.6 : 1, marginBottom: "1px" }}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          <div style={{ fontSize: "12px", color: T.muted, background: T.panel, padding: "8px 12px", borderRadius: "8px" }}>
            Path examples: assets.currentAssets, liabilities.currentLiabilities, equity.shareCapital
          </div>
          {message && <div style={{ marginTop: "10px", color: success ? T.green : T.red, fontSize: "13px" }}>{message}</div>}
        </>
      )}

      {/* ─── Loans mode ──────────────────────────────────────────────── */}
      {mode === "loans" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelS}>Loan Name</label>
              <input value={loanName} onChange={(e) => setLoanName(e.target.value)} style={inputS} placeholder="e.g. Bank Loan" />
            </div>
            <div>
              <label style={labelS}>Scheduled Amount</label>
              <input value={loanScheduled} onChange={(e) => setLoanScheduled(e.target.value)} style={inputS} placeholder="0" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelS}>Paid Amount</label>
              <input value={loanPaid} onChange={(e) => setLoanPaid(e.target.value)} style={inputS} placeholder="0" />
            </div>
            <button onClick={handleLoanSave} disabled={saving || !loanName.trim()} style={{ ...btnPrimary, opacity: saving || !loanName.trim() ? 0.6 : 1, marginBottom: "1px" }}>
              {saving ? "Saving..." : "Add Loan"}
            </button>
          </div>
          {loans.length > 0 && (
            <div style={{ fontSize: "12.5px", color: T.muted, background: T.panel, padding: "8px 12px", borderRadius: "8px" }}>
              {loans.length} loan{loans.length > 1 ? "s" : ""} saved.
            </div>
          )}
          {message && <div style={{ marginTop: "10px", color: success ? T.green : T.red, fontSize: "13px" }}>{message}</div>}
        </>
      )}

      {/* ─── Dividends mode ───────────────────────────────────────────── */}
      {mode === "dividends" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelS}>Year</label>
              <input type="number" value={divYear} onChange={(e) => setDivYear(Number(e.target.value))} style={inputS} />
            </div>
            <div>
              <label style={labelS}>Amount per Share</label>
              <input value={divAmount} onChange={(e) => setDivAmount(e.target.value)} style={inputS} placeholder="0.00" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelS}>Total Shares</label>
              <input value={divShares} onChange={(e) => setDivShares(e.target.value)} style={inputS} placeholder="0" />
            </div>
            <div>
              <label style={labelS}>Payment Date</label>
              <input type="date" value={divPaymentDate} onChange={(e) => setDivPaymentDate(e.target.value)} style={inputS} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={labelS}>Notes (optional)</label>
              <input style={inputS} placeholder="Any notes about this dividend" />
            </div>
            <button onClick={handleDividendSave} disabled={saving || !divAmount || !divShares} style={{ ...btnPrimary, opacity: saving || !divAmount || !divShares ? 0.6 : 1, marginBottom: "1px" }}>
              {saving ? "Saving..." : "Add Dividend"}
            </button>
          </div>
          {dividends.length > 0 && (
            <div style={{ fontSize: "12.5px", color: T.muted, background: T.panel, padding: "8px 12px", borderRadius: "8px", marginTop: "8px" }}>
              {dividends.length} dividend{dividends.length > 1 ? "s" : ""} saved.
            </div>
          )}
          {message && <div style={{ marginTop: "10px", color: success ? T.green : T.red, fontSize: "13px" }}>{message}</div>}
        </>
      )}

      {/* ─── Cap Table (Investors) mode ──────────────────────────────── */}
      {mode === "investors" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelS}>Investor Name</label>
              <input value={invName} onChange={(e) => setInvName(e.target.value)} style={inputS} placeholder="e.g. John Doe" />
            </div>
            <div>
              <label style={labelS}>Shares</label>
              <input value={invShares} onChange={(e) => setInvShares(e.target.value)} style={inputS} placeholder="0" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={labelS}>Investment (R)</label>
              <input value={invInvestment} onChange={(e) => setInvInvestment(e.target.value)} style={inputS} placeholder="0" />
            </div>
            <button onClick={handleInvestorSave} disabled={saving || !invName.trim() || !invShares} style={{ ...btnPrimary, opacity: saving || !invName.trim() || !invShares ? 0.6 : 1, marginBottom: "1px" }}>
              {saving ? "Saving..." : "Add Investor"}
            </button>
          </div>
          {investors.length > 0 && (
            <div style={{ fontSize: "12.5px", color: T.muted, background: T.panel, padding: "8px 12px", borderRadius: "8px", marginTop: "8px" }}>
              {investors.length} investor{investors.length > 1 ? "s" : ""} saved.
            </div>
          )}
          {message && <div style={{ marginTop: "10px", color: success ? T.green : T.red, fontSize: "13px" }}>{message}</div>}
        </>
      )}

      {/* ─── IRR Investments mode ────────────────────────────────────── */}
      {mode === "irr" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelS}>Project Name</label>
              <input value={irrName} onChange={(e) => setIrrName(e.target.value)} style={inputS} placeholder="e.g. Project Alpha" />
            </div>
            <div>
              <label style={labelS}>IRR %</label>
              <input value={irrValue} onChange={(e) => setIrrValue(e.target.value)} style={inputS} placeholder="15.5" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelS}>Initial Investment</label>
              <input value={irrInitial} onChange={(e) => setIrrInitial(e.target.value)} style={inputS} placeholder="R 100,000" />
            </div>
            <div>
              <label style={labelS}>Duration</label>
              <input value={irrDuration} onChange={(e) => setIrrDuration(e.target.value)} style={inputS} placeholder="e.g. 3 years" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={labelS}>Risk Rating</label>
              <select value={irrRisk} onChange={(e) => setIrrRisk(e.target.value)} style={selectS}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <button onClick={handleIrrtSave} disabled={saving || !irrName.trim() || !irrValue} style={{ ...btnPrimary, opacity: saving || !irrName.trim() || !irrValue ? 0.6 : 1, marginBottom: "1px" }}>
              {saving ? "Saving..." : "Add Investment"}
            </button>
          </div>
          {irrInvestments.length > 0 && (
            <div style={{ fontSize: "12.5px", color: T.muted, background: T.panel, padding: "8px 12px", borderRadius: "8px", marginTop: "8px" }}>
              {irrInvestments.length} investment{irrInvestments.length > 1 ? "s" : ""} saved.
            </div>
          )}
          {message && <div style={{ marginTop: "10px", color: success ? T.green : T.red, fontSize: "13px" }}>{message}</div>}
        </>
      )}

    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Main FinancialPerformance Component (continued)
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

  // State for Equity Structure data
  const [dividends, setDividends] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [irrInvestments, setIrrInvestments] = useState([]);

  const [isInvestorView, setIsInvestorView] = useState(false);
  const [viewingSMEId, setViewingSMEId] = useState(null);
  const [viewingSMEName, setViewingSMEName] = useState("");
  const [viewOrigin, setViewOrigin] = useState("investor");

  const [activeTabId, setActiveTabId] = useState(TAB_DEFS[0].id);
  const [period, setPeriod] = useState("month");

  const [filters, setFilters] = useState({ category: "all", kpi: "all", units: "all", status: "all" });
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
    try { window.localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* private browsing — non-fatal */ }
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

  // Load equity data
  const loadEquityData = useCallback(async (uid_) => {
    try {
      const divRef = doc(db, "dividend-history", uid_);
      const divSnap = await getDoc(divRef);
      if (divSnap.exists()) {
        const data = divSnap.data();
        setDividends(data.dividends || []);
      } else {
        setDividends([]);
      }

      const capRef = doc(db, "cap-table", uid_);
      const capSnap = await getDoc(capRef);
      if (capSnap.exists()) {
        const data = capSnap.data();
        setInvestors(data.investors || []);
        setIrrInvestments(data.irrInvestments || []);
      } else {
        setInvestors([]);
        setIrrInvestments([]);
      }
    } catch (err) {
      console.error("Error loading equity data:", err);
      notify("error", `Could not load equity data: ${errText(err)}`);
    }
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
        console.error("Error loading financial data:", err);
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
      console.error("Error saving KPI meta:", err);
      notify("error", `Changes could not be saved: ${errText(err)}`);
    }
  };

  const writeArrayCell = async ({ docKey, field, monthIndex, raw }) => {
    if (!user?.uid || isInvestorView) return;
    const existing = docs[docKey] || {};
    const arr = Array.isArray(existing[field]) ? [...existing[field]] : Array(12).fill("");
    while (arr.length < 12) arr.push("");
    arr[monthIndex] = raw;
    const next = { ...existing, [field]: arr };
    setDocs((p) => ({ ...p, [docKey]: next }));
    try {
      await setDoc(doc(db, "users", user.uid, "financialData", docKey),
        { ...next, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error(`Error saving ${docKey}.${field}:`, err);
      notify("error", `Could not save: ${errText(err)}`);
    }
  };

  const saveKpiField = async ({ kpi, which, raw, year, monthIndex }) => {
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
    await writeArrayCell({ docKey: `${DOC[kpi.field.src]}_${year}`, field, monthIndex, raw });
  };

  const saveBalanceSheetCell = async ({ year, monthIndex, path, key, raw }) => {
    if (!user?.uid || isInvestorView) return;
    const docKey = `${DOC.bs}_${year}`;
    const existing = docs[docKey]?.balanceSheetData
      ? docs[docKey]
      : { ...(docs[docKey] || {}), balanceSheetData: BLANK_BS, year, createdAt: new Date().toISOString() };

    const next = JSON.parse(JSON.stringify(existing));
    let node = next.balanceSheetData;
    const segs = path.split(".");
    for (const seg of segs) {
      const idx = Number(seg);
      node = Number.isFinite(idx) && String(idx) === seg ? node[idx] : node[seg];
      if (!node) return;
    }
    const arr = Array.isArray(node[key]) ? [...node[key]] : Array(12).fill("");
    while (arr.length < 12) arr.push("");
    arr[monthIndex] = raw;
    node[key] = arr;

    setDocs((p) => ({ ...p, [docKey]: next }));
    try {
      await setDoc(doc(db, "users", user.uid, "financialData", docKey),
        { ...next, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error("Error saving balance sheet cell:", err);
      notify("error", `Could not save: ${errText(err)}`);
    }
  };

  // Equity data save functions
  const saveDividends = async (data) => {
    if (!user?.uid || isInvestorView) return;
    try {
      await setDoc(doc(db, "dividend-history", user.uid), { dividends: data, lastUpdated: new Date().toISOString() });
      setDividends(data);
    } catch (err) {
      console.error("Error saving dividends:", err);
      notify("error", `Could not save dividends: ${errText(err)}`);
    }
  };

  const saveCapTable = async (data) => {
    if (!user?.uid || isInvestorView) return;
    try {
      await setDoc(doc(db, "cap-table", user.uid), { ...data, lastUpdated: new Date().toISOString() });
      setInvestors(data.investors || []);
      setIrrInvestments(data.irrInvestments || []);
    } catch (err) {
      console.error("Error saving cap table:", err);
      notify("error", `Could not save cap table: ${errText(err)}`);
    }
  };

  const saveLoans = async (loans) => {
    await persistMeta({ ...meta, loans });
  };

  /* ─── Assemble tabs ───────────────────────────────────────────────────── */
  const tabs = useMemo(() => {
    const withCustom = TAB_DEFS.map((tab) => {
      if (tab.custom) return { ...tab, categories: [] };
      const cats = tab.categories.map((c) => ({ ...c, kpis: [...(c.kpis || [])] }));
      (meta.custom || []).filter((c) => c.tabId === tab.id).forEach((c) => {
        const kpi = K({ ...c, field: { src: "custom" }, actual: () => null });
        kpi.custom = true;
        const found = cats.find((x) => x.name === c.category);
        if (found) found.kpis.push(kpi);
        else cats.push({ name: c.category, kpis: [kpi] });
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
      else if (key === "status") set.add(r.status.label);
    });
    return ["all", ...Array.from(set).sort()];
  };

  const rows = useMemo(() => {
    const list = allRows.filter((r) =>
      (filters.category === "all" || r.categoryName === filters.category) &&
      (filters.kpi === "all" || r.kpi.name === filters.kpi) &&
      (filters.units === "all" || r.kpi.units === filters.units) &&
      (filters.status === "all" || r.status.label === filters.status));

    const get = {
      category: (r) => r.categoryName, kpi: (r) => r.kpi.name,
      units: (r) => r.kpi.units,
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
  const clearFilters = () => { setFilters({ category: "all", kpi: "all", units: "all", status: "all" }); setSortConfig({ key: null, direction: "asc" }); };

  const downloadCSV = () => {
    const p = PERIOD_PREFIX[period];
    const lines = [["Section","Category","KPI","Units", `${p} Budget`, `${p} Actual`, `${p} Variance`, "Status"]];
    tabs.forEach((tab) => tab.categories.forEach((cat) => (cat.kpis || []).forEach((kpi) => {
      const v = periodValues(kpi, period, fy);
      lines.push([tab.name, cat.name, `"${kpi.name}"`, kpi.units,
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

  if (loading) {
    return <div style={{ padding: "80px", textAlign: "center", color: T.body, fontSize: "14px" }}>Loading financial performance…</div>;
  }

  const userName = user?.displayName || user?.email || "User";

  return (
    <div style={{ minHeight: "100vh", padding: "28px", boxSizing: "border-box", background: T.bg, color: T.body }}>
      {isInvestorView && (
        <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderLeft: `3px solid ${T.accent}`, padding: "13px 18px",
          borderRadius: "10px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "10px", color: T.accent, fontWeight: 500, fontSize: "14px" }}>
            <Eye size={15} />
            {viewOrigin === "catalyst" ? "Catalyst view" : viewOrigin === "cmf" ? "Facilitator view" : "Investor view"}: {viewingSMEName}'s Financial Performance
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
              <li>Most figures are calculated from the P&amp;L and Balance Sheet</li>
              <li>Raises actions straight into your governance meetings</li>
            </ul>
          </div>
          <div>
            <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "10px", fontSize: "14.5px", fontWeight: 600 }}>How to use it</h3>
            <ul style={{ color: T.body, fontSize: "13.5px", lineHeight: 1.75, margin: 0, paddingLeft: "18px" }}>
              <li>Pick a timeframe above the table — the column names follow it</li>
              <li>Click the eye for what a KPI means and how it is measured</li>
              <li>The chart carries its own averages, note and analysis</li>
              <li>Balance Sheet is its own tab and is edited in place</li>
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
          <button onClick={() => setManageTabs(true)} title="Show or hide dashboard tabs"
            style={{ ...btnQuiet, marginLeft: "auto", marginBottom: "4px", padding: "6px 12px", fontSize: "12.5px", color: T.muted }}>
            <Settings2 size={13} /> Manage Tabs
          </button>
        )}
        <button onClick={() => setShowReport(true)} title="Generate a Word report"
          style={{ ...btnGhost, marginLeft: "4px", marginBottom: "4px", padding: "6px 14px", fontSize: "12.5px" }}>
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
          <button onClick={() => { window.location.href = "/raps-actions"; }} style={btnGhost}>
            <ClipboardList size={14} /> Financial Performance <ExternalLink size={11} />
          </button>
          {!isInvestorView && <button onClick={() => setAddFlow("choose")} style={btnPrimary}><Plus size={14} /> Add KPI/Data</button>}
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
          <span style={{ fontSize: "12.5px", color: T.muted }}>
            Showing {PERIOD_PREFIX[period].toLowerCase()} budget, actual and variance
          </span>
        </div>
      )}

      {activeTab?.custom === "balanceSheet" ? (
        <BalanceSheetTab fy={fy} docs={docs} readOnly={isInvestorView} />
      ) : activeTab?.custom === "equity" ? (
        <div style={{ marginBottom: "20px" }}>
          <DividendHistory dividends={dividends} readOnly={isInvestorView} />
          <CapTableOverview investors={investors} irrInvestments={irrInvestments} readOnly={isInvestorView} />
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
                                  <button onClick={() => toggleSort(key)} title="Sort" style={iconBtn(sorted ? "#fff" : "rgba(255,255,255,0.6)")}>
                                    {sorted ? (sortConfig.direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} />}
                                  </button>
                                )}
                                {def.filter && (
                                  <button onClick={() => setOpenFilter(isOpen ? null : key)} title="Filter"
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

                            <div onMouseDown={(e) => startResize(e, key)} title="Drag to resize"
                              style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                          </th>
                        );
                      })}
                      <th style={{ ...thS, width: widths[ACTIONS_KEY], borderRight: "none" }}>
                        <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                          <span style={{ display: "flex", alignItems: "flex-start", gap: "5px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", lineHeight: 1.3 }}>Actions</span>
                            <InfoTip light text="Trend chart, the all-timeframe analysis, add an action, notes, and delete for this KPI." />
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
                      <tr><td colSpan={visibleColumns.length + 1} style={{ ...tdS, textAlign: "center", padding: "56px 16px", color: T.muted, borderRight: "none" }}>
                        No KPIs match the current filters.
                      </td></tr>
                    ) : groupedRows.map((group) => group.items.map((row, idx) => {
                      const { kpi, categoryName, tabName, status, variance, values } = row;
                      const fav = varianceFavourable(kpi, variance);
                      const last = idx === group.items.length - 1;
                      const rowTd = { ...tdS, borderBottom: last ? `2px solid ${T.lineStrong}` : `1px solid ${T.lineSoft}` };
                      const cell = (key, content) => visibility[key] ? (
                        <td key={key} style={{ ...rowTd, width: widths[key],
                          textAlign: COLUMN_DEFS[key].align === "center" ? "center" : "left" }}>{content}</td>
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
                              <button onClick={() => setAnalysisKpi(kpi)} style={iconBtn(T.body)} title="Summary analysis across all timeframes"><Lightbulb size={16} /></button>
                              {!isInvestorView && (
                                <button onClick={() => setActionKpi({ kpi, categoryName, tabName })}
                                  style={iconBtn(status.color)} title={`Add action (${status.label})`}><Plus size={16} /></button>
                              )}
                              <button onClick={() => setNotesKpi(kpi)} style={iconBtn(kpi.notes ? T.amber : T.body)} title="Notes"><StickyNote size={16} /></button>
                              {!isInvestorView && (
                                <button onClick={() => { if (window.confirm(`Delete "${kpi.name}"? This removes it from the dashboard.`)) deleteKpi(kpi.id); }}
                                  style={iconBtn(T.red)} title="Delete KPI"><Trash2 size={16} /></button>
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
                <span>{activeTab?.categories.filter((c) => !c.custom).length} categories · all figures in each row use that row's Units</span>
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
              <LoanRepaymentsPanel loans={meta.loans || []} readOnly={isInvestorView} />
            </div>
          )}
        </>
      )}

      {infoKpi && <KpiInfoModal kpi={infoKpi} readOnly={isInvestorView} onClose={() => setInfoKpi(null)}
        onSave={(patch) => { updateKpiMeta(infoKpi.id, patch); setInfoKpi({ ...infoKpi, ...patch }); notify("success", "KPI details updated."); }} />}

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
        categoryName={actionKpi.categoryName} tabName={actionKpi.tabName}
        userId={user?.uid} onClose={() => setActionKpi(null)}
        onSaved={(m) => notify("success", `Action added to "${m}" and Integrated Actions.`)} />}

      {notesKpi && <NotesModal kpi={notesKpi} readOnly={isInvestorView} onClose={() => setNotesKpi(null)}
        onSave={(notes) => { updateKpiMeta(notesKpi.id, { notes }); setNotesKpi({ ...notesKpi, notes }); }} />}

      {manageTabs && (
        <Modal title="Manage Dashboard Tabs" subtitle="Show or hide a tab from the dashboard" icon={<Settings2 size={17} />}
          onClose={() => setManageTabs(false)} width={560}
          footer={<button onClick={() => setManageTabs(false)} style={btnPrimary}>Done</button>}>
          {tabs.map((t) => {
            const hidden = (meta.hiddenTabs || []).includes(t.id);
            const count = t.categories.flatMap((c) => c.kpis || []).length;
            return (
              <div key={t.id} style={{ ...cardS, marginBottom: "10px", opacity: hidden ? 0.6 : 1,
                display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <div style={{ fontSize: "14.5px", fontWeight: 600, color: T.accent }}>
                    {t.name} {hidden && <span style={{ fontSize: "11.5px", fontWeight: 500, color: T.muted }}>· hidden</span>}
                  </div>
                  <div style={{ fontSize: "12.5px", color: T.muted }}>
                    {t.custom === "balanceSheet" ? "Edited in place" : `${t.categories.length} categories · ${count} KPIs`}
                  </div>
                </div>
                <button
                  onClick={() => persistMeta({ ...meta,
                    hiddenTabs: hidden ? (meta.hiddenTabs || []).filter((x) => x !== t.id) : [...(meta.hiddenTabs || []), t.id] })}
                  disabled={!hidden && visibleTabs.length <= 1}
                  style={{ ...btnGhost, padding: "7px 12px", fontSize: "12.5px", opacity: !hidden && visibleTabs.length <= 1 ? 0.4 : 1 }}>
                  {hidden ? <><Eye size={13} /> Show</> : <><EyeOff size={13} /> Hide</>}
                </button>
              </div>
            );
          })}
          <p style={{ fontSize: "12.5px", color: T.muted, marginTop: "10px", marginBottom: 0, display: "flex", alignItems: "flex-start", gap: "6px" }}>
            <Info size={12} style={{ marginTop: "2px", flexShrink: 0 }} />
            Tabs are built in, so they hide rather than delete — the underlying financial data is shared with the rest of the platform.
          </p>
        </Modal>
      )}

      {addFlow === "choose" && <AddChooser onClose={() => setAddFlow(null)} onPick={(k) => setAddFlow(k)} />}

      {addFlow === "data" && <AddDataWizard tabs={tabs} fy={fy} docs={docs} currentTabId={activeTabId}
        prefs={dataPrefs} onSavePrefs={savePrefs} onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
        onSaveField={saveKpiField}
        onSaveBalanceSheetCell={saveBalanceSheetCell}
        onSaveLoans={saveLoans}
        onSaveDividends={saveDividends}
        onSaveCapTable={saveCapTable}
        dividends={dividends} investors={investors} irrInvestments={irrInvestments} loans={meta.loans || []}
        readOnly={isInvestorView} />}

      {addFlow === "kpi" && <AddKpiWizard tabs={tabs} currentTabId={activeTabId}
        onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
        onSave={async (kpi) => { await persistMeta({ ...meta, custom: [...(meta.custom || []), kpi] }); notify("success", "KPI created."); }} />}

      {showReport && <FinancialReportGenerator 
        tabs={visibleTabs} 
        fy={fy} 
        docs={docs} 
        meta={meta}
        period={period}
        userId={user?.uid}
        userName={userName}
        dividends={dividends}
        investors={investors}
        irrInvestments={irrInvestments}
        onClose={() => setShowReport(false)} 
      />}
    </div>
  );
};

export default FinancialPerformance;