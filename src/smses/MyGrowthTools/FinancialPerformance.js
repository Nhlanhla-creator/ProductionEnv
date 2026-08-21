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
  Database, Sparkles, Sigma, Settings2, EyeOff, Palette, Check,
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const functions = getFunctions();

/* ════════════════════════════════════════════════════════════════════════════
   Tokens — identical to Operational Performance so the two pages read as one
   system. `header` is a deeper cut of the accent so the table band and the
   merged Category cells sit in the same family.
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

/* Financial data is captured monthly, so the week option from Operational
   Performance has nothing behind it here. */
const PERIODS = [
  { key: "month", label: "This month" },
  { key: "quarter", label: "This quarter" },
  { key: "year", label: "This year" },
];
const PERIOD_LABEL = { month: "This month", quarter: "This quarter", year: "This year" };
const PERIOD_PREFIX = { month: "Monthly", quarter: "Quarterly", year: "Annual" };

/* ─── Financial year, from Entity Overview's financialYearEnd ────────────── */
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

/* `bare` drops the unit marker — the table has its own Units column. */
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
   Source documents.

   Nothing new is invented for storage — the KPIs read the same Firestore docs
   the old sections wrote to, so existing data appears immediately.
   ════════════════════════════════════════════════════════════════════════ */
const DOC = {
  pnl: "_pnlManual",
  bs: "_capitalStructure",
  cost: "_costAgility",
  liq: "_liquiditySurvival",
};

const num = (arr, mi) => { const v = arr?.[mi]; const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const sumObj = (obj, mi) => Object.values(obj || {}).reduce((s, a) => s + (parseFloat(a?.[mi]) || 0), 0);

/* True only when at least one cell in the month carries a figure — the
   difference between "nothing captured" and "genuinely zero". */
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

  /* Treasury shares reduce equity, so the naive sum has to be corrected twice
     over — once to remove it, once to subtract it. */
  const equity = sumObj(bs.equity, mi) - 2 * (parseFloat(bs.equity?.treasuryShares?.[mi]) || 0)
    + (bs.customEquityCategories || []).reduce((s, c) => s + sumObj(c.items, mi), 0);

  return {
    assets, liabilities, equity, currentAssets, currentLiabilities,
    inventory: parseFloat(a.currentAssets?.inventory?.[mi]) || 0,
    cash: sumObj(a.bank, mi) + (parseFloat(a.currentAssets?.cash?.[mi]) || 0),
  };
};

/* Everything a KPI might need for one month, in one object. */
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
   The KPI registry — tabs, categories, KPIs.

   `field` marks a KPI you type in; anything with only `actual` is derived and
   shown read-only in Add Data, because typing over a computed figure would
   just be overwritten on the next load.

   A category with `subTab` set leaves the KPI table and becomes its own
   sub-tab under its parent.
   ════════════════════════════════════════════════════════════════════════ */
const K = (o) => ({
  id: o.id, name: o.name, units: o.units, direction: o.direction || "higher",
  aggregate: o.aggregate || "avg", meaning: o.meaning, measured: o.measured,
  actual: o.actual, budget: o.budget || (() => null),
  field: o.field || null,
});

const TAB_DEFS = [
  {
    id: "capital-structure", name: "Capital Structure",
    categories: [
      { name: "Solvency", kpis: [
        K({ id: "nav", name: "Net Asset Value", units: "R", direction: "higher", aggregate: "avg",
          meaning: "What the business would be worth if you settled every liability today — total assets less total liabilities.",
          measured: "=SUM(TotalAssets) - SUM(TotalLiabilities)\n\nBoth totals come from the Balance Sheet tab for the selected month. Format as Currency (R, 0 decimals).",
          actual: (c) => (Number.isFinite(c.assets) && Number.isFinite(c.liabilities) ? c.assets - c.liabilities : null) }),
        K({ id: "equityRatio", name: "Equity Ratio", units: "%", direction: "higher", aggregate: "avg",
          meaning: "How much of the business is funded by owners rather than lenders. Higher means less exposed to a credit squeeze.",
          measured: "=TotalEquity / TotalAssets * 100\n\nFormat as Percentage (1 decimal).",
          actual: (c) => { const r = div(c.equity, c.assets); return r === null ? null : r * 100; } }),
        K({ id: "interestCoverage", name: "Interest Coverage", units: "×", direction: "higher", aggregate: "avg",
          meaning: "How many times over your operating profit covers the interest bill. Under 1.5× is where lenders start asking questions.",
          measured: "=EBIT / InterestExpense\n\nWhere EBIT = GrossProfit − Opex − Depreciation − Amortisation.",
          actual: (c) => div(c.ebit, c.intExp) }),
      ]},
      { name: "Leverage", kpis: [
        K({ id: "debtToAssets", name: "Debt to Assets", units: "×", direction: "lower", aggregate: "avg",
          meaning: "How much of what you own is funded by debt. Above 0.6 is generally considered geared.",
          measured: "=TotalLiabilities / TotalAssets",
          actual: (c) => div(c.liabilities, c.assets) }),
        K({ id: "debtToEquity", name: "Debt to Equity", units: "×", direction: "lower", aggregate: "avg",
          meaning: "Rand of debt for every rand of owners' capital. The classic gearing measure.",
          measured: "=TotalLiabilities / TotalEquity",
          actual: (c) => div(c.liabilities, c.equity) }),
        K({ id: "equityMultiplier", name: "Equity Multiplier", units: "×", direction: "lower", aggregate: "avg",
          meaning: "How far the asset base is stretched over the equity behind it. The higher it climbs, the more a bad year hurts.",
          measured: "=TotalAssets / TotalEquity",
          actual: (c) => div(c.assets, c.equity) }),
      ]},
      { name: "Equity Structure", kpis: [], custom: "equity", subTab: true },
    ],
  },
  {
    id: "performance-engine", name: "Performance Engine",
    categories: [
      { name: "Revenue & Costs", kpis: [
        K({ id: "sales", name: "Revenue", units: "R", direction: "higher", aggregate: "sum", field: { src: "pnl", a: "sales", b: "salesBudget" },
          meaning: "Everything you invoiced in the period, before any costs come off.",
          measured: "=SUM(Sales)\n\nEntered directly. Rolls up across the year with =SUM().",
          actual: (c) => c.sales, budget: (c) => c.salesB }),
        K({ id: "cogs", name: "Cost of Sales", units: "R", direction: "lower", aggregate: "sum", field: { src: "pnl", a: "cogs", b: "cogsBudget" },
          meaning: "What it cost you to deliver what you sold — materials, direct labour, delivery.",
          measured: "=SUM(COGS)",
          actual: (c) => c.cogs, budget: (c) => c.cogsB }),
        K({ id: "opex", name: "Operating Expenses", units: "R", direction: "lower", aggregate: "sum", field: { src: "pnl", a: "opex", b: "opexBudget" },
          meaning: "Running the business — salaries, rent, marketing, admin. Everything not tied to a specific sale.",
          measured: "=SUM(Opex)",
          actual: (c) => c.opex, budget: (c) => c.opexB }),
      ]},
      { name: "Profitability", kpis: [
        K({ id: "grossProfit", name: "Gross Profit", units: "R", direction: "higher", aggregate: "sum",
          meaning: "What's left after paying for what you sold, before the cost of running the place.",
          measured: "=SUM(Sales) - SUM(COGS)",
          actual: (c) => c.gp, budget: (c) => c.gpB }),
        K({ id: "ebitda", name: "EBITDA", units: "R", direction: "higher", aggregate: "sum",
          meaning: "Operating profit before depreciation, amortisation, interest and tax — the closest thing to cash the P&L gives you.",
          measured: "=SUM(Sales) - SUM(COGS) - SUM(Opex)",
          actual: (c) => c.ebitda, budget: (c) => c.ebitdaB }),
        K({ id: "netProfit", name: "Net Profit", units: "R", direction: "higher", aggregate: "sum",
          meaning: "What the owners actually keep after every cost, interest and tax.",
          measured: "=EBITDA - Depreciation - Amortisation - InterestExpense + InterestIncome - Tax",
          actual: (c) => c.np, budget: (c) => c.npB }),
      ]},
      { name: "Margins", kpis: [
        K({ id: "gpMargin", name: "Gross Profit Margin", units: "%", direction: "higher", aggregate: "avg",
          meaning: "Cents of gross profit in every rand of revenue. Moves when pricing or input costs move.",
          measured: "=(SUM(Sales) - SUM(COGS)) / SUM(Sales) * 100",
          actual: (c) => { const r = div(c.gp, c.sales); return r === null ? null : r * 100; },
          budget: (c) => { const r = div(c.gpB, c.salesB); return r === null ? null : r * 100; } }),
        K({ id: "npMargin", name: "Net Profit Margin", units: "%", direction: "higher", aggregate: "avg",
          meaning: "Cents of profit in every rand of revenue once everything is paid.",
          measured: "=NetProfit / SUM(Sales) * 100",
          actual: (c) => { const r = div(c.np, c.sales); return r === null ? null : r * 100; },
          budget: (c) => { const r = div(c.npB, c.salesB); return r === null ? null : r * 100; } }),
      ]},
    ],
  },
  {
    id: "liquidity", name: "Liquidity",
    categories: [
      { name: "Liquidity Ratios", kpis: [
        K({ id: "currentRatio", name: "Current Ratio", units: "×", direction: "higher", aggregate: "avg", field: { src: "liq", a: "currentRatio" },
          meaning: "Whether short-term assets cover short-term bills. Below 1 means you cannot pay the next twelve months from what you hold.",
          measured: "=CurrentAssets / CurrentLiabilities\n\nEntered directly, or computed from the Balance Sheet tab.",
          actual: (c) => (Number.isFinite(c.currentRatio) ? c.currentRatio : div(c.currentAssets, c.currentLiabilities)) }),
        K({ id: "quickRatio", name: "Quick Ratio", units: "×", direction: "higher", aggregate: "avg", field: { src: "liq", a: "quickRatio" },
          meaning: "The same test with stock stripped out, since stock is the hardest thing to turn into cash in a hurry.",
          measured: "=(CurrentAssets - Inventory) / CurrentLiabilities",
          actual: (c) => (Number.isFinite(c.quickRatio) ? c.quickRatio
            : div(Number.isFinite(c.currentAssets) ? c.currentAssets - (c.inventory || 0) : null, c.currentLiabilities)) }),
        K({ id: "cashRatio", name: "Cash Ratio", units: "×", direction: "higher", aggregate: "avg", field: { src: "liq", a: "cashRatio" },
          meaning: "The harshest test — cash alone against short-term bills.",
          measured: "=CashAndEquivalents / CurrentLiabilities",
          actual: (c) => (Number.isFinite(c.cashRatio) ? c.cashRatio : div(c.cash, c.currentLiabilities)) }),
      ]},
      { name: "Survival", kpis: [
        K({ id: "burnRate", name: "Burn Rate", units: "R", direction: "lower", aggregate: "avg", field: { src: "liq", a: "burnRate" },
          meaning: "How much cash the business consumes in a month once everything is paid.",
          measured: "=(OpeningCash - ClosingCash) / MonthsElapsed\n\nOr entered directly per month.",
          actual: (c) => c.burnRate }),
        K({ id: "cashCover", name: "Cash Cover", units: "months", direction: "higher", aggregate: "avg", field: { src: "liq", a: "cashCover" },
          meaning: "How many months the cash on hand would last at the current burn.",
          measured: "=CashBalance / BurnRate",
          actual: (c) => (Number.isFinite(c.cashCover) ? c.cashCover : div(c.cashBalance, c.burnRate)) }),
        K({ id: "cashflow", name: "Free Cashflow", units: "R", direction: "higher", aggregate: "sum", field: { src: "liq", a: "cashflow" },
          meaning: "Cash left over after running the business and keeping the assets going.",
          measured: "=OperatingCashflow - CapitalExpenditure",
          actual: (c) => c.cashflow }),
        K({ id: "workingCapital", name: "Working Capital", units: "R", direction: "higher", aggregate: "avg", field: { src: "liq", a: "workingCapital" },
          meaning: "The buffer between what you're owed and what you owe in the short term.",
          measured: "=CurrentAssets - CurrentLiabilities",
          actual: (c) => (Number.isFinite(c.workingCapital) ? c.workingCapital
            : (Number.isFinite(c.currentAssets) && Number.isFinite(c.currentLiabilities) ? c.currentAssets - c.currentLiabilities : null)) }),
        K({ id: "cashBalance", name: "Cash Balance", units: "R", direction: "higher", aggregate: "avg", field: { src: "liq", a: "cashBalance" },
          meaning: "What is actually in the bank at month end.",
          measured: "=SUM(BankAccounts) + PettyCash",
          actual: (c) => (Number.isFinite(c.cashBalance) ? c.cashBalance : c.cash) }),
      ]},
      { name: "Cost Agility", kpis: [
        K({ id: "fixedVariableRatio", name: "Fixed / Variable Ratio", units: "%", direction: "lower", aggregate: "avg",
          meaning: "How much of your cost base you cannot switch off if revenue drops. The higher it is, the less room you have to react.",
          measured: "=SUM(FixedCosts) / (SUM(FixedCosts) + SUM(VariableCosts)) * 100",
          actual: (c) => { const r = div(c.fixedCosts, (c.fixedCosts || 0) + (c.variableCosts || 0)); return r === null ? null : r * 100; } }),
        K({ id: "discretionaryPct", name: "Discretionary Spend", units: "%", direction: "higher", aggregate: "avg",
          meaning: "The share of spend you could pause next month without breaking anything. This is your shock absorber.",
          measured: "=SUM(DiscretionaryCosts) / SUM(TotalCosts) * 100",
          actual: (c) => { const r = div(c.discretionary, c.totalCost); return r === null ? null : r * 100; } }),
        K({ id: "lockInDuration", name: "Cost Lock-in", units: "months", direction: "lower", aggregate: "avg", field: { src: "cost", a: "lockInDuration" },
          meaning: "How long you'd stay committed to your fixed costs if you started unwinding today.",
          measured: "=AVERAGE(RemainingContractMonths)\n\nWeighted by contract value where it matters.",
          actual: (c) => c.lockIn }),
        K({ id: "fixedCosts", name: "Fixed Costs", units: "R", direction: "lower", aggregate: "sum", field: { src: "cost", a: "fixedCosts" },
          meaning: "Costs that arrive whether you sell anything or not.",
          measured: "=SUM(FixedCosts)",
          actual: (c) => c.fixedCosts }),
        K({ id: "variableCosts", name: "Variable Costs", units: "R", direction: "lower", aggregate: "sum", field: { src: "cost", a: "variableCosts" },
          meaning: "Costs that rise and fall with volume.",
          measured: "=SUM(VariableCosts)",
          actual: (c) => c.variableCosts }),
      ]},
      { name: "Loan Repayments", kpis: [], custom: "loans" },
    ],
  },
  { id: "balance-sheet", name: "Balance Sheet", categories: [], custom: "balanceSheet" },
];

/* ─── Status ────────────────────────────────────────────────────────────── */
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

/* ─── Period resolution over the loaded entries ─────────────────────────── */
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
  source:    { label: "Source", width: 118, align: "center", tip: "Entered directly, or calculated from other figures.", filter: true, sort: true, hideable: true },
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

const makeValueLabelPlugin = (kpi, enabled) => ({
  id: "seriesValueLabels",
  afterDatasetsDraw(chart) {
    if (!enabled) return;
    const { ctx } = chart;
    ctx.save();
    ctx.font = "600 10.5px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    chart.data.datasets.forEach((ds, di) => {
      const meta = chart.getDatasetMeta(di);
      if (meta.hidden) return;
      meta.data.forEach((el, i) => {
        const raw = ds.data[i];
        if (raw === null || raw === undefined) return;
        ctx.fillStyle = ds.__labelColor || T.body;
        ctx.fillText(fmtValue(raw, kpi, { signed: !!ds.__signed, bare: true }), el.x, el.y - 8);
      });
    });
    ctx.restore();
  },
});

/* ─── KPI info popup ────────────────────────────────────────────────────── */
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
          kpi.aggregate === "avg" ? "AVERAGE across periods" : "SUM across periods"].map((c) => (
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

/* ─── Analysis ──────────────────────────────────────────────────────────── */
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
        // "not-found" means the Cloud Function is not deployed — a different
        // fix from a permissions error, so name it.
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
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
          <Section label="Observations" items={analysis.observations} color={T.accent} />
          <Section label="Trends" items={analysis.trends} color={T.blue} />
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

/* ─── Trend chart ───────────────────────────────────────────────────────── */
const CHART_VERSION = 2;
const DEFAULT_CHART = {
  v: CHART_VERSION,
  actualType: "bar", budgetType: "scatter", varianceType: "scatter",
  actualColor: "#1e40af", budgetColor: "#4a352f", showValues: true, showAxis: false,
};
const CHART_TYPES = [
  { value: "bar", label: "Bars" }, { value: "line", label: "Line" },
  { value: "area", label: "Area" }, { value: "scatter", label: "Circles" },
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

  /* The variance band has no axes and no legend — it floats above the plot so
     it reads as a top layer rather than a competing chart. */
  const varianceData = { labels, datasets: [
    { label: "Variance", ...buildSeries(prefs.varianceType, variance, varColors), __signed: true, __labelColor: T.body }] };
  const varianceOptions = {
    responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
    layout: { padding: { top: prefs.showValues ? 20 : 6, bottom: 0 } },
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
    { label: "Budget", ...buildSeries(prefs.budgetType, budget, prefs.budgetColor), order: 1, __labelColor: prefs.budgetColor },
    { label: "Actual", ...buildSeries(prefs.actualType, actual, prefs.actualColor), order: 2, __labelColor: prefs.actualColor }] };
  const mainOptions = {
    responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
    layout: { padding: { top: prefs.showValues ? 20 : 6 } },
    plugins: { legend: { display: false }, datalabels: { display: false },
      tooltip: { backgroundColor: T.ink, padding: 11, cornerRadius: 8,
        callbacks: { label: (c) => c.parsed.y === null || c.parsed.y === undefined ? `${c.dataset.label}: no data`
          : `${c.dataset.label}: ${fmtValue(c.parsed.y, kpi)}` } } },
    scales: {
      y: { display: prefs.showAxis, grid: { display: prefs.showAxis, color: T.lineSoft },
        ticks: { color: T.body, font: { size: 11 }, callback: (v) => fmtValue(v, kpi, { bare: true }) } },
      x: { display: true, grid: { display: false },
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
    <Modal title={`${kpi.name} — Trend`} subtitle={caption} icon={<LineChartIcon size={17} />} onClose={onClose} width={960}
      footer={<>
        <button onClick={() => setShowCustomise((v) => !v)} style={btnGhost}><Palette size={13} /> Customise chart</button>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={btnPrimary}>Close</button>
      </>}>

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
              <label style={labelS}>Show</label>
              <select value={`${prefs.showValues}|${prefs.showAxis}`}
                onChange={(e) => { const [v, a] = e.target.value.split("|"); setPref({ showValues: v === "true", showAxis: a === "true" }); }} style={selectS}>
                <option value="true|false">Value labels, no axis</option>
                <option value="false|true">Axis, no value labels</option>
                <option value="true|true">Both</option>
                <option value="false|false">Neither</option>
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
          <Chart type="bar" data={varianceData} options={varianceOptions} plugins={[makeValueLabelPlugin(kpi, prefs.showValues)]} />
        </div>
        <div style={{ height: "300px" }}>
          <Chart type="bar" data={mainData} options={mainOptions} plugins={[makeValueLabelPlugin(kpi, prefs.showValues)]} />
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
            <StickyNote size={13} /> Note for {PERIOD_LABEL[period].toLowerCase()}
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

/* ─── Add Action ────────────────────────────────────────────────────────── */
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
    description: `${PERIOD_LABEL[period]} actual ${fmtValue(v.actual, kpi)} against budget ${fmtValue(v.budget, kpi)}${
      variance === null ? "" : ` (variance ${fmtValue(variance, kpi, { signed: true })})`}. Raised from ${tabName} · ${categoryName}.`,
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
      footer={<>
        <button onClick={onClose} style={btnGhost}>Cancel</button>
        <button onClick={save} disabled={saving || !form.title.trim()} style={{ ...btnPrimary, opacity: saving || !form.title.trim() ? 0.6 : 1 }}>
          {saving ? "Saving..." : "Save Action"}</button>
      </>}>
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

/* ─── KPI notes — autosaving ────────────────────────────────────────────── */
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
      footer={<>
        <span style={{ flex: 1, fontSize: "12.5px", color: state === "saved" ? T.green : T.muted, textAlign: "left" }}>
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Saves automatically"}
        </span>
        <button onClick={onClose} style={btnPrimary}>Close</button>
      </>}>
      <label style={labelS}>Context, anomalies or anything worth remembering about this KPI</label>
      <textarea rows="9" value={notes} readOnly={readOnly} onChange={(e) => change(e.target.value)} style={{ ...inputS, resize: "vertical" }} />
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Add Data — writes back into the same source docs the old sections used.
   ════════════════════════════════════════════════════════════════════════ */
const AddDataWizard = ({ tabs, fy, docs, prefs, onSavePrefs, onBack, onClose, onSaveField, currentTabId }) => {
  const editableTabs = tabs.filter((t) => !t.custom && t.categories.some((c) => (c.kpis || []).some((k) => k.field)));
  const [tabId, setTabId] = useState(prefs?.tabId && editableTabs.some((t) => t.id === prefs.tabId) ? prefs.tabId
    : editableTabs.some((t) => t.id === currentTabId) ? currentTabId : editableTabs[0]?.id);
  const [startYear, setStartYear] = useState(prefs?.startYear ?? fy.startYear);
  const [periodKey, setPeriodKey] = useState(null);
  const [draft, setDraft] = useState({});
  const [saveState, setSaveState] = useState("idle");
  const timer = useRef(null);

  const tab = editableTabs.find((t) => t.id === tabId) || editableTabs[0];
  const months = useMemo(() => fyMonths(startYear, fy.startMonth), [startYear, fy.startMonth]);

  useEffect(() => {
    if (!months.length) return;
    if (months.some((m) => m.key === periodKey)) return;
    setPeriodKey(months.find((m) => m.key === currentMonthKey())?.key || months[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months]);

  const monthMeta = months.find((m) => m.key === periodKey) || months[0];
  const monthIndex = months.findIndex((m) => m.key === periodKey);
  const ctx = monthMeta ? buildContext(docs, monthMeta.year, monthMeta.month) : {};

  const rows = useMemo(() => {
    if (!tab) return [];
    const out = [];
    tab.categories.forEach((cat) => (cat.kpis || []).forEach((k) => out.push({ kpi: k, category: cat.name })));
    return out;
  }, [tab]);

  const draftKey = (kpiId, which) => `${monthMeta?.year}|${monthMeta?.month}|${kpiId}|${which}`;

  const value = (kpi, which) => {
    const dk = draftKey(kpi.id, which);
    if (draft[dk] !== undefined) return draft[dk];
    if (!kpi.field) return "";
    if (kpi.custom) {
      const v = kpi.entries?.[monthMeta.key]?.[which];
      return v === undefined || v === null ? "" : String(v);
    }
    const field = which === "actual" ? kpi.field.a : kpi.field.b;
    if (!field) return "";
    const d = docs[`${DOC[kpi.field.src]}_${monthMeta.year}`];
    const v = d?.[field]?.[monthMeta.month];
    return v === undefined || v === null ? "" : String(v);
  };

  /* Typing saves itself — stepping to the next month can't silently drop it. */
  const setValue = (kpi, which, raw) => {
    const dk = draftKey(kpi.id, which);
    setDraft((p) => ({ ...p, [dk]: raw }));
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await onSaveField({ kpi, which, raw, year: monthMeta.year, monthIndex: monthMeta.month });
      onSavePrefs({ tabId, startYear });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1800);
    }, 800);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const cell = { ...inputS, padding: "7px 9px", textAlign: "center", fontSize: "13.5px", minHeight: "34px" };
  const th = { padding: "9px 12px", fontSize: "11.5px", fontWeight: 700, color: "#fff", textTransform: "uppercase",
    letterSpacing: "0.5px", background: T.header, whiteSpace: "nowrap", position: "sticky", top: 0, zIndex: 2, verticalAlign: "top" };
  const yearOptions = [
    { value: fy.startYear - 1, badge: "FY−", label: fyLabel(fy.startYear - 1, fy.startMonth) },
    { value: fy.startYear,     badge: "FY",  label: fyLabel(fy.startYear, fy.startMonth) },
    { value: fy.startYear + 1, badge: "FY+", label: fyLabel(fy.startYear + 1, fy.startMonth) },
  ];

  if (!tab) {
    return (
      <Modal title="Add Data" icon={<Database size={17} />} onClose={onClose} width={520}
        footer={<button onClick={onClose} style={btnPrimary}>Close</button>}>
        <p style={{ fontSize: "14px", color: T.body, margin: 0 }}>Nothing here takes direct input. The Balance Sheet tab is edited on the page itself.</p>
      </Modal>
    );
  }

  return (
    <Modal title="Add Data" subtitle={`Financial year starts in ${MONTHS[fy.startMonth]} · captured monthly`} icon={<Database size={17} />}
      onClose={onClose} width={800}
      footer={<>
        <button onClick={onBack} style={btnGhost}><ArrowLeft size={13} /> Back</button>
        <span style={{ flex: 1, fontSize: "12.5px", color: saveState === "saved" ? T.green : T.muted, textAlign: "left" }}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Everything saves automatically"}
        </span>
        <button onClick={onClose} style={btnPrimary}>Done</button>
      </>}>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
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
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "12px" }}>
        <div style={{ flex: 1 }}>
          <label style={labelS}>Month · 12 in FY {fyLabel(startYear, fy.startMonth)}</label>
          <select value={periodKey || ""} onChange={(e) => setPeriodKey(e.target.value)} style={selectS}>
            {months.map((m) => <option key={m.key} value={m.key}>{m.long}</option>)}
          </select>
        </div>
        <button onClick={() => setPeriodKey(months[Math.max(0, monthIndex - 1)]?.key)} disabled={monthIndex <= 0}
          style={{ ...btnGhost, padding: "9px 11px", opacity: monthIndex <= 0 ? 0.4 : 1 }}><ChevronLeft size={14} /></button>
        <button onClick={() => setPeriodKey(months[Math.min(months.length - 1, monthIndex + 1)]?.key)} disabled={monthIndex >= months.length - 1}
          style={{ ...btnGhost, padding: "9px 11px", opacity: monthIndex >= months.length - 1 ? 0.4 : 1 }}><ChevronRight size={14} /></button>
      </div>

      <div style={{ fontSize: "12.5px", color: T.muted, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
        <Info size={12} /> Calculated KPIs are shown greyed — they follow from what you type above them.
      </div>

      <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ maxHeight: "44vh", overflowY: "auto" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.15)" }}>KPI</th>
                <th style={{ ...th, textAlign: "center", width: "24%", borderRight: "1px solid rgba(255,255,255,0.15)" }}>Actual</th>
                <th style={{ ...th, textAlign: "center", width: "24%" }}>Budget</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ kpi, category }, i) => {
                const derivedActual = !kpi.custom && kpi.actual ? kpi.actual(ctx) : null;
                const derivedBudget = !kpi.custom && kpi.budget ? kpi.budget(ctx) : null;
                const bg = i % 2 ? T.panel : T.bg;
                return (
                  <tr key={kpi.id} style={{ background: bg }}>
                    <td style={{ padding: "7px 12px", fontSize: "13.5px", color: T.ink,
                      borderBottom: `1px solid ${T.lineSoft}`, borderRight: `1px solid ${T.lineSoft}` }}>
                      <div style={{ fontWeight: 600 }}>{kpi.name}</div>
                      <div style={{ fontSize: "11.5px", color: T.muted }}>{category} · {kpi.units} · {kpi.field ? "entered" : "calculated"}</div>
                    </td>
                    <td style={{ padding: "4px 8px", borderBottom: `1px solid ${T.lineSoft}`, borderRight: `1px solid ${T.lineSoft}` }}>
                      {kpi.field ? (
                        <input type="number" step="any" value={value(kpi, "actual")} placeholder="—"
                          onChange={(e) => setValue(kpi, "actual", e.target.value)} style={cell} />
                      ) : (
                        <div style={{ textAlign: "center", fontSize: "13.5px", color: T.muted, padding: "7px 0" }}>{fmtValue(derivedActual, kpi, { bare: true })}</div>
                      )}
                    </td>
                    <td style={{ padding: "4px 8px", borderBottom: `1px solid ${T.lineSoft}` }}>
                      {kpi.field?.b || kpi.custom ? (
                        <input type="number" step="any" value={value(kpi, "budget")} placeholder="—"
                          onChange={(e) => setValue(kpi, "budget", e.target.value)} style={cell} />
                      ) : (
                        <div style={{ textAlign: "center", fontSize: "13.5px", color: T.faint, padding: "7px 0" }}>{fmtValue(derivedBudget, kpi, { bare: true })}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

/* ─── Add KPI ───────────────────────────────────────────────────────────── */
const AddKpiWizard = ({ tabs, currentTabId, onBack, onClose, onSave }) => {
  const usable = tabs.filter((t) => !t.custom);
  const [tabId, setTabId] = useState(usable.some((t) => t.id === currentTabId) ? currentTabId : usable[0]?.id);
  const [catChoice, setCatChoice] = useState("");
  const [newCat, setNewCat] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", units: "R", direction: "higher", aggregate: "sum", meaning: "", measured: "" });

  const tab = usable.find((t) => t.id === tabId);
  const cats = (tab?.categories || []).filter((c) => !c.custom);
  useEffect(() => { if (cats.length && !catChoice) setCatChoice(cats[0].name); }, [tabId]); // eslint-disable-line
  const creatingCat = catChoice === "__new__";
  const catName = creatingCat ? newCat.trim() : catChoice;
  const canSave = form.name.trim() && catName && form.meaning.trim() && form.measured.trim();

  const commit = async () => {
    if (!canSave) return;
    setSaving(true);
    await onSave({
      id: `custom_${uid().slice(0, 8)}`, tabId, category: catName,
      name: form.name.trim(), units: form.units, direction: form.direction, aggregate: form.aggregate,
      meaning: form.meaning.trim(), measured: form.measured.trim(),
    });
    setSaving(false); onClose();
  };

  return (
    <Modal title="Add KPI" subtitle="A custom metric you capture by hand each month" icon={<Sparkles size={17} />}
      onClose={onClose} width={720}
      footer={<>
        <button onClick={onBack} style={btnGhost}><ArrowLeft size={13} /> Back</button>
        <div style={{ flex: 1 }} />
        <button onClick={commit} disabled={!canSave || saving} style={{ ...btnPrimary, opacity: canSave && !saving ? 1 : 0.5 }}>
          {saving ? "Saving..." : "Create KPI"}</button>
      </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
        <div>
          <label style={labelS}>Section</label>
          <select value={tabId} onChange={(e) => { setTabId(e.target.value); setCatChoice(""); }} style={selectS}>
            {usable.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelS}>Category</label>
          <select value={catChoice} onChange={(e) => setCatChoice(e.target.value)} style={selectS}>
            <option value="">Select…</option>
            {cats.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            <option value="__new__">＋ New category…</option>
          </select>
          {creatingCat && <input value={newCat} onChange={(e) => setNewCat(e.target.value)} style={{ ...inputS, marginTop: "8px" }} placeholder="New category name" />}
        </div>
      </div>
      <div style={{ marginBottom: "14px" }}>
        <label style={labelS}>KPI name *</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputS} placeholder="e.g. Debtor Days" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <div>
          <label style={labelS}>Units</label>
          <select value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} style={selectS}>
            <option value="R">Currency (R)</option><option value="%">Percent (%)</option>
            <option value="×">Ratio (×)</option><option value="#">Count (#)</option>
            <option value="days">Days</option><option value="months">Months</option>
          </select>
        </div>
        <div>
          <label style={labelS}>What counts as good?</label>
          <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} style={selectS}>
            {DIRECTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelS}>Rolling up</label>
          <select value={form.aggregate} onChange={(e) => setForm({ ...form, aggregate: e.target.value })} style={selectS}>
            <option value="sum">SUM the months — rand, counts</option>
            <option value="avg">AVERAGE the months — rates, ratios</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: "14px" }}>
        <label style={labelS}>What does this KPI mean? *</label>
        <textarea rows="2" value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })}
          style={{ ...inputS, resize: "vertical" }} placeholder="In plain words — anyone reading the dashboard should get it from this sentence." />
      </div>
      <div>
        <label style={{ ...labelS, display: "flex", alignItems: "center", gap: "6px" }}><Sigma size={13} /> How is this KPI measured? *</label>
        <textarea rows="4" value={form.measured} onChange={(e) => setForm({ ...form, measured: e.target.value })}
          style={{ ...inputS, resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "13px" }}
          placeholder={"=SUM(TradeReceivables) / SUM(Sales) * 365"} />
        <p style={{ fontSize: "12px", color: T.muted, marginTop: "7px", marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
          <Info size={12} /> Use Excel functions and named ranges — SUM, AVERAGE, COUNTIF, SUMIFS, SUMPRODUCT.
        </p>
      </div>
    </Modal>
  );
};

const AddChooser = ({ onPick, onClose }) => (
  <Modal title="What would you like to do?" icon={<Plus size={17} />} onClose={onClose} width={580}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
      {[
        { key: "data", icon: <Database size={22} />, title: "Add Data", body: "Capture actual and budget figures against the KPIs you already track." },
        { key: "kpi", icon: <Sparkles size={22} />, title: "Add KPI", body: "Create a custom metric under any section or category." },
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

/* ════════════════════════════════════════════════════════════════════════════
   Balance Sheet — its own tab, always rendered, edited in place.
   ════════════════════════════════════════════════════════════════════════ */
const prettify = (k) => k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
const NEGATIVE_KEYS = new Set(["lessAmortization","treasuryShares","lessDepreciationBuildings","lessDepreciationComputer",
  "lessDepreciationVehicles","lessDepreciationFurniture","lessDepreciationMachinery","lessDepreciationOther"]);

const col = () => Array(12).fill("");

/* The sheet always renders, even before anything is captured — otherwise
   there'd be no way to start one. Editing any cell writes this shape to
   Firestore, matching what the rest of the platform expects. */
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

const BalanceSheetTab = ({ fy, docs, onSaveCell, readOnly }) => {
  const months = useMemo(() => fyMonths(fy.startYear, fy.startMonth), [fy]);
  const [monthKey, setMonthKey] = useState(() => months.find((m) => m.key === currentMonthKey())?.key || months[0].key);
  const [draft, setDraft] = useState({});
  const [saveState, setSaveState] = useState("idle");
  const timer = useRef(null);

  const meta = months.find((m) => m.key === monthKey) || months[0];
  const monthIndex = months.findIndex((m) => m.key === monthKey);
  const bsDoc = docs[`${DOC.bs}_${meta.year}`];
  const bs = bsDoc?.balanceSheetData || BLANK_BS;
  const isNew = !bsDoc?.balanceSheetData;
  const mi = meta.month;
  const totals = bsTotals({ balanceSheetData: bs }, mi);

  const dk = (path, key) => `${meta.year}|${mi}|${path}|${key}`;
  const cellValue = (path, key, arr) => {
    const k = dk(path, key);
    if (draft[k] !== undefined) return draft[k];
    const v = arr?.[mi];
    return v === undefined || v === null ? "" : String(v);
  };
  const setCell = (path, key, arr, raw) => {
    setDraft((p) => ({ ...p, [dk(path, key)]: raw }));
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await onSaveCell({ year: meta.year, monthIndex: mi, path, key, raw });
      setSaveState("saved"); setTimeout(() => setSaveState("idle"), 1800);
    }, 800);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const cellInput = { ...inputS, padding: "6px 9px", textAlign: "right", fontSize: "13.5px", minHeight: "32px" };

  const Section = ({ title, obj, path, total }) => {
    if (!obj) return null;
    return (
      <div style={{ marginBottom: "18px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: T.accent, marginBottom: "8px",
          textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</div>
        <div style={{ border: `1px solid ${T.line}`, borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
            <tbody>
              {Object.entries(obj).map(([key, arr], i) => {
                if (!Array.isArray(arr)) return null;
                const negative = NEGATIVE_KEYS.has(key);
                return (
                  <tr key={key} style={{ background: i % 2 ? T.panel : T.bg }}>
                    <td style={{ padding: "7px 12px", fontSize: "13.5px", color: negative ? T.muted : T.ink,
                      borderBottom: `1px solid ${T.lineSoft}`, borderRight: `1px solid ${T.lineSoft}` }}>
                      {negative && <span style={{ color: T.faint, marginRight: "5px" }}>−</span>}
                      {prettify(key)}
                    </td>
                    <td style={{ padding: "4px 8px", borderBottom: `1px solid ${T.lineSoft}`, width: "34%" }}>
                      <input type="number" step="any" readOnly={readOnly} placeholder="—"
                        value={cellValue(path, key, arr)}
                        onChange={(e) => setCell(path, key, arr, e.target.value)} style={cellInput} />
                    </td>
                  </tr>
                );
              })}
              {total !== undefined && (
                <tr style={{ background: T.accentTint }}>
                  <td style={{ padding: "9px 12px", fontSize: "13.5px", fontWeight: 700, color: T.accent,
                    borderRight: `1px solid ${T.lineSoft}` }}>Total {title.toLowerCase()}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: "14px", fontWeight: 700,
                    color: T.accent, fontVariantNumeric: "tabular-nums" }}>
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

  const CustomSection = ({ list, basePath }) => {
    if (!list?.length) return null;
    return (
      <>
        {list.map((cat, ci) => (
          <Section key={cat.name || cat.category || ci} title={cat.category || cat.name || `Custom ${ci + 1}`}
            obj={cat.items} path={`${basePath}.${ci}.items`} total={sumObj(cat.items, mi)} />
        ))}
      </>
    );
  };

  /* Assets less liabilities and equity should be zero. Showing the gap is more
     useful than asserting a balance that may not hold. */
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
        <span style={{ fontSize: "12.5px", color: saveState === "saved" ? T.green : T.muted, paddingBottom: "10px" }}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Edits save automatically"}
        </span>
      </div>

      {isNew && (
        <div style={{ ...cardS, marginBottom: "16px", background: T.panel, display: "flex", alignItems: "center", gap: "10px" }}>
          <Info size={18} color={T.accentSoft} />
          <span style={{ fontSize: "13.5px", color: T.body }}>
            Nothing captured for FY {fyLabel(fy.startYear, fy.startMonth)} yet — type into any line below and the sheet starts from there.
          </span>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
        {summary("Total assets", fmtValue(totals.assets, { units: "R" }))}
        {summary("Total liabilities", fmtValue(totals.liabilities, { units: "R" }))}
        {summary("Total equity", fmtValue(totals.equity, { units: "R" }))}
        {summary("Net asset value", fmtValue(
          Number.isFinite(totals.assets) && Number.isFinite(totals.liabilities) ? totals.assets - totals.liabilities : null,
          { units: "R" }), T.accent)}
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        <div>
          <h4 style={{ fontSize: "15px", fontWeight: 700, color: T.accent, margin: "0 0 12px" }}>Assets</h4>
          <Section title="Bank" obj={bs.assets?.bank} path="assets.bank" total={sumObj(bs.assets?.bank, mi)} />
          <Section title="Current assets" obj={bs.assets?.currentAssets} path="assets.currentAssets" total={sumObj(bs.assets?.currentAssets, mi)} />
          <Section title="Fixed assets" obj={bs.assets?.fixedAssets} path="assets.fixedAssets" />
          <Section title="Intangible assets" obj={bs.assets?.intangibleAssets} path="assets.intangibleAssets" />
          <Section title="Non-current assets" obj={bs.assets?.nonCurrentAssets} path="assets.nonCurrentAssets" total={sumObj(bs.assets?.nonCurrentAssets, mi)} />
          <CustomSection list={bs.assets?.customCategories || bs.customCategories}
            basePath={bs.assets?.customCategories ? "assets.customCategories" : "customCategories"} />
        </div>

        <div>
          <h4 style={{ fontSize: "15px", fontWeight: 700, color: T.accent, margin: "0 0 12px" }}>Liabilities and equity</h4>
          <Section title="Current liabilities" obj={bs.liabilities?.currentLiabilities} path="liabilities.currentLiabilities" total={sumObj(bs.liabilities?.currentLiabilities, mi)} />
          <Section title="Non-current liabilities" obj={bs.liabilities?.nonCurrentLiabilities} path="liabilities.nonCurrentLiabilities" total={sumObj(bs.liabilities?.nonCurrentLiabilities, mi)} />
          <CustomSection list={bs.customLiabilitiesCategories} basePath="customLiabilitiesCategories" />
          <Section title="Equity" obj={bs.equity} path="equity" total={sumObj(bs.equity, mi) - 2 * (parseFloat(bs.equity?.treasuryShares?.[mi]) || 0)} />
          <CustomSection list={bs.customEquityCategories} basePath="customEquityCategories" />
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Equity Structure — Dividend History and Cap Table Overview, carried over
   from the original Capital Structure page exactly as they were.
   ════════════════════════════════════════════════════════════════════════ */
const DividendHistory = ({ currentUser, isInvestorView }) => {
  const [dividends, setDividends] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const saveDividendData = async () => {
    if (!currentUser) return

    try {
      await setDoc(doc(db, "dividend-history", currentUser.uid), {
        dividends,
        lastUpdated: new Date().toISOString(),
      })
      setShowEditForm(false)
      alert("Dividend history data saved successfully!")
    } catch (error) {
      console.error("Error saving dividend data:", error)
      alert("Error saving data")
    }
  }

  const loadDividendData = async () => {
    if (!currentUser) return

    try {
      setIsLoading(true)
      const docRef = doc(db, "dividend-history", currentUser.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        const dividendsData = data.dividends || []
        const updatedDividends = dividendsData.map(dividend => ({
          ...dividend,
          amountPerShare: dividend.amountPerShare !== undefined ? dividend.amountPerShare : (dividend.amount || 0),
          totalShares: dividend.totalShares !== undefined ? dividend.totalShares : 0,
          totalIssued: dividend.totalIssued !== undefined ? dividend.totalIssued : (dividend.amountPerShare || 0) * (dividend.totalShares || 0),
          notes: dividend.notes || ""
        }))
        setDividends(updatedDividends)
      } else {
        await setDoc(docRef, {
          dividends: [],
          lastUpdated: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error loading dividend data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadDividendData()
    }
  }, [currentUser])

  const updateDividend = (index, field, value) => {
    const newDividends = [...dividends]
    if (field === "year") {
      newDividends[index][field] = Number.parseInt(value) || 0
    } else if (field === "amountPerShare") {
      newDividends[index][field] = Number.parseFloat(value) || 0
      const totalShares = newDividends[index].totalShares || 0
      newDividends[index].totalIssued = (Number.parseFloat(value) || 0) * totalShares
    } else if (field === "totalShares") {
      newDividends[index][field] = Number.parseFloat(value) || 0
      const amountPerShare = newDividends[index].amountPerShare || 0
      newDividends[index].totalIssued = amountPerShare * (Number.parseFloat(value) || 0)
    } else if (field === "totalIssued") {
      newDividends[index][field] = Number.parseFloat(value) || 0
    } else if (field === "notes") {
      newDividends[index][field] = value
    } else {
      newDividends[index][field] = value
    }
    setDividends(newDividends)
  }

  const addDividend = () => {
    setDividends([...dividends, { 
      year: new Date().getFullYear(), 
      amountPerShare: 0, 
      totalShares: 0,
      totalIssued: 0,
      paymentDate: "",
      notes: ""
    }])
  }

  const removeDividend = (index) => {
    const newDividends = dividends.filter((_, i) => i !== index)
    setDividends(newDividends)
  }

  const handleDownload = (type) => {
    if (type === "csv") {
      const csvContent = [
        ["Year", "Amount per Share", "Total Shares", "Total Issued", "Payment Date", "Notes"],
        ...dividends.map((div) => [
          div.year, 
          (div.amountPerShare || 0).toFixed(2), 
          (div.totalShares || 0).toFixed(0),
          (div.totalIssued || 0).toFixed(2), 
          div.paymentDate,
          `"${(div.notes || "").replace(/"/g, '""')}"`
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "dividend-history.csv"
      a.click()
      URL.revokeObjectURL(url)
    } else if (type === "json") {
      const jsonContent = JSON.stringify(dividends, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "dividend-history.json"
      a.click()
      URL.revokeObjectURL(url)
    }
    setShowDownloadOptions(false)
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          backgroundColor: "#fdfcfb",
          borderRadius: "8px",
        }}
      >
        <div>Loading dividend history data...</div>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ color: "#5d4037", margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>Dividend History</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          {!isInvestorView && (
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: "6px 12px",
                backgroundColor: "#5d4037",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              {showEditForm ? "Cancel" : "Edit Data"}
            </button>
          )}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              style={{
                padding: "6px 12px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              Download
            </button>
            {showDownloadOptions && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  backgroundColor: "#fdfcfb",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                }}
              >
                <button
                  onClick={() => handleDownload("json")}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 15px",
                    backgroundColor: "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#5d4037",
                    fontSize: "0.8rem",
                  }}
                >
                  Download JSON
                </button>
                <button
                  onClick={() => handleDownload("csv")}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 15px",
                    backgroundColor: "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#5d4037",
                    fontSize: "0.8rem",
                  }}
                >
                  Download CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isInvestorView && showEditForm && (
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h4 style={{ color: "#72542b", marginTop: 0, fontSize: "1rem" }}>Edit Dividend History Data</h4>
          {dividends.map((dividend, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr 2fr 2fr auto",
                gap: "10px",
                alignItems: "center",
                marginBottom: "10px",
                padding: "10px",
                backgroundColor: "#fdfcfb",
                borderRadius: "4px",
              }}
            >
              <input
                type="number"
                value={dividend.year}
                onChange={(e) => updateDividend(index, "year", e.target.value)}
                style={{
                  padding: "6px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                }}
                placeholder="Year"
              />
              <input
                type="number"
                step="0.01"
                value={dividend.amountPerShare || 0}
                onChange={(e) => updateDividend(index, "amountPerShare", e.target.value)}
                style={{
                  padding: "6px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                }}
                placeholder="Amount per Share"
              />
              <input
                type="number"
                step="1"
                value={dividend.totalShares || 0}
                onChange={(e) => updateDividend(index, "totalShares", e.target.value)}
                style={{
                  padding: "6px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                }}
                placeholder="Total Shares"
              />
              <input
                type="number"
                step="0.01"
                value={dividend.totalIssued || 0}
                onChange={(e) => updateDividend(index, "totalIssued", e.target.value)}
                style={{
                  padding: "6px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  backgroundColor: "#f0e6d9",
                }}
                placeholder="Total Issued (auto)"
                readOnly
              />
              <input
                type="date"
                value={dividend.paymentDate}
                onChange={(e) => updateDividend(index, "paymentDate", e.target.value)}
                style={{
                  padding: "6px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                }}
              />
              <input
                type="text"
                value={dividend.notes || ""}
                onChange={(e) => updateDividend(index, "notes", e.target.value)}
                style={{
                  padding: "6px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                }}
                placeholder="Notes (optional)"
              />
              <button
                onClick={() => removeDividend(index)}
                style={{
                  padding: "6px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
            <button
              onClick={addDividend}
              style={{
                padding: "6px 12px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              Add Dividend
            </button>
            <button
              onClick={saveDividendData}
              style={{
                padding: "6px 12px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {dividends.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "30px",
            color: "#72542b",
            backgroundColor: "#f7f3f0",
            borderRadius: "6px",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.9rem" }}>No dividend data available. {!isInvestorView && 'Click "Edit Data" to add your first dividend entry.'}</p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#f0e6d9",
            padding: "15px",
            borderRadius: "6px",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              color: "#5d4037",
              fontSize: "0.85rem",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #d4c4b0",
                }}
              >
                <th style={{ padding: "10px", textAlign: "left" }}>Year</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Amount per Share</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Total Shares</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Total Issued</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Payment Date</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {dividends
                .sort((a, b) => b.year - a.year)
                .map((div, index) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: "1px solid #e6d7c3",
                    }}
                  >
                    <td style={{ padding: "10px" }}>{div.year}</td>
                    <td style={{ padding: "10px", textAlign: "right" }}>R{(div.amountPerShare || 0).toFixed(2)}</td>
                    <td style={{ padding: "10px", textAlign: "right" }}>{(div.totalShares || 0).toLocaleString()}</td>
                    <td style={{ padding: "10px", textAlign: "right" }}>R{(div.totalIssued || 0).toFixed(2)}</td>
                    <td style={{ padding: "10px" }}>{div.paymentDate}</td>
                    <td style={{ padding: "10px", maxWidth: "200px", wordBreak: "break-word" }}>{div.notes || "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const CapTableOverview = ({ currentUser, isInvestorView }) => {
  const [investors, setInvestors] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [irrInvestments, setIrrInvestments] = useState([])
  const [expandedInvestment, setExpandedInvestment] = useState(null)
  const [showIrrEditForm, setShowIrrEditForm] = useState(false)
  const [showIrrDownloadOptions, setShowIrrDownloadOptions] = useState(false)

  const saveCapTableData = async () => {
    if (!currentUser) return

    try {
      await setDoc(doc(db, "cap-table", currentUser.uid), {
        investors,
        irrInvestments,
        lastUpdated: new Date().toISOString(),
      })
      setShowEditForm(false)
      setShowIrrEditForm(false)
      alert("Cap table data saved successfully!")
    } catch (error) {
      console.error("Error saving cap table data:", error)
      alert("Error saving data")
    }
  }

  const loadCapTableData = async () => {
    if (!currentUser) return

    try {
      setIsLoading(true)
      const docRef = doc(db, "cap-table", currentUser.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        const investorsData = data.investors || []
        const updatedInvestors = investorsData.map(investor => ({
          ...investor,
          investment: investor.investment !== undefined ? investor.investment : (investor.valuation || 0)
        }))
        setInvestors(updatedInvestors)
        setIrrInvestments(data.irrInvestments || [])
      } else {
        await setDoc(docRef, {
          investors: [],
          irrInvestments: [],
          lastUpdated: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error loading cap table data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadCapTableData()
    }
  }, [currentUser])

  const updateInvestor = (index, field, value) => {
    const newInvestors = [...investors]
    newInvestors[index][field] = field === "name" ? value : Number.parseFloat(value) || 0
    setInvestors(newInvestors)
  }

  const addInvestor = () => {
    setInvestors([...investors, { name: "New Investor", shares: 0, investment: 0 }])
  }

  const removeInvestor = (index) => {
    const newInvestors = investors.filter((_, i) => i !== index)
    setInvestors(newInvestors)
  }

  const updateIrrInvestment = (index, field, value) => {
    const newInvestments = [...irrInvestments]
    if (field === "name" || field === "riskRating") {
      newInvestments[index][field] = value
    } else if (field === "irr") {
      newInvestments[index][field] = Number.parseFloat(value) || 0
    } else if (field.startsWith("details.")) {
      const detailField = field.split(".")[1]
      if (detailField === "cashFlows") {
        newInvestments[index].details[detailField] = value.split(",").map((flow) => flow.trim())
      } else {
        newInvestments[index].details[detailField] = value
      }
    }
    setIrrInvestments(newInvestments)
  }

  const addIrrInvestment = () => {
    const newInvestment = {
      name: "New Project",
      irr: 0,
      details: {
        initialInvestment: "R0M",
        duration: "0 years",
        cashFlows: ["Year 1: R0M"],
        riskRating: "Medium",
      },
    }
    setIrrInvestments([...irrInvestments, newInvestment])
  }

  const removeIrrInvestment = (index) => {
    const newInvestments = irrInvestments.filter((_, i) => i !== index)
    setIrrInvestments(newInvestments)
  }

  const toggleIrrInvestment = (index) => {
    if (expandedInvestment === index) {
      setExpandedInvestment(null)
    } else {
      setExpandedInvestment(index)
    }
  }

  const handleDownload = (type) => {
    const totalShares = investors.reduce((sum, inv) => sum + inv.shares, 0)
    const totalInvestment = investors.reduce((sum, inv) => sum + (inv.investment || 0), 0)

    if (type === "csv") {
      const csvContent = [
        ["Investor Name", "Shares", "Percentage", "Investment (RM)"],
        ...investors.map((inv) => [
          inv.name,
          inv.shares,
          totalShares > 0 ? ((inv.shares / totalShares) * 100).toFixed(1) : 0,
          (inv.investment || 0).toFixed(1),
        ]),
        ["Total", totalShares, "100", totalInvestment.toFixed(1)],
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "cap-table.csv"
      a.click()
      URL.revokeObjectURL(url)
    } else if (type === "json") {
      const jsonContent = JSON.stringify({ investors, irrInvestments }, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "cap-table.json"
      a.click()
      URL.revokeObjectURL(url)
    }
    setShowDownloadOptions(false)
  }

  const handleIrrDownload = (type) => {
    if (type === "csv") {
      const csvContent = [
        ["Investment Name", "IRR %", "Initial Investment", "Duration", "Risk Rating"],
        ...irrInvestments.map((inv) => [
          inv.name,
          inv.irr,
          inv.details.initialInvestment,
          inv.details.duration,
          inv.details.riskRating,
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "irr-investments.csv"
      a.click()
      URL.revokeObjectURL(url)
    } else if (type === "json") {
      const jsonContent = JSON.stringify(irrInvestments, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "irr-investments.json"
      a.click()
      URL.revokeObjectURL(url)
    }
    setShowIrrDownloadOptions(false)
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          backgroundColor: "#fdfcfb",
          borderRadius: "8px",
        }}
      >
        <div>Loading cap table data...</div>
      </div>
    )
  }

  const totalShares = investors.reduce((sum, inv) => sum + inv.shares, 0)
  const totalInvestment = investors.reduce((sum, inv) => sum + (inv.investment || 0), 0)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ color: "#5d4037", margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>Cap Table Overview</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            {!isInvestorView && (
              <button
                onClick={() => setShowEditForm(!showEditForm)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                {showEditForm ? "Cancel" : "Edit Data"}
              </button>
            )}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#72542b",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Download
              </button>
              {showDownloadOptions && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    backgroundColor: "#fdfcfb",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    zIndex: 1000,
                  }}
                >
                  <button
                    onClick={() => handleDownload("json")}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 15px",
                      backgroundColor: "transparent",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "#5d4037",
                      fontSize: "0.8rem",
                    }}
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={() => handleDownload("csv")}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 15px",
                      backgroundColor: "transparent",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "#5d4037",
                      fontSize: "0.8rem",
                    }}
                  >
                    Download CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {!isInvestorView && showEditForm && (
          <div
            style={{
              backgroundColor: "#f7f3f0",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            <h4 style={{ color: "#72542b", marginTop: 0, fontSize: "1rem" }}>Edit Cap Table Data</h4>
            {investors.map((investor, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr auto",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "10px",
                  padding: "10px",
                  backgroundColor: "#fdfcfb",
                  borderRadius: "4px",
                }}
              >
                <input
                  type="text"
                  value={investor.name}
                  onChange={(e) => updateInvestor(index, "name", e.target.value)}
                  style={{
                    padding: "6px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                  }}
                  placeholder="Investor Name"
                />
                <input
                  type="number"
                  value={investor.shares}
                  onChange={(e) => updateInvestor(index, "shares", e.target.value)}
                  style={{
                    padding: "6px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                  }}
                  placeholder="Shares %"
                />
                <input
                  type="number"
                  step="0.1"
                  value={investor.investment || 0}
                  onChange={(e) => updateInvestor(index, "investment", e.target.value)}
                  style={{
                    padding: "6px",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                  }}
                  placeholder="Investment (RM)"
                />
                <button
                  onClick={() => removeInvestor(index)}
                  style={{
                    padding: "6px",
                    backgroundColor: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              <button
                onClick={addInvestor}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#72542b",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Add Investor
              </button>
              <button
                onClick={saveCapTableData}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Save Data
              </button>
            </div>
          </div>
        )}

        {investors.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "30px",
              color: "#72542b",
              backgroundColor: "#f7f3f0",
              borderRadius: "6px",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.9rem" }}>No investor data available. {!isInvestorView && 'Click "Edit Data" to add your first investor.'}</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "1fr 1fr",
              gap: "30px",
            }}
          >
            <div>
              <h4 style={{ color: "#7d5a50", marginBottom: "15px", fontSize: "1rem" }}>Ownership Structure</h4>
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
                          const total = context.dataset.data.reduce((sum, val) => sum + val, 0)
                          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                          return percentage + "%"
                        },
                      },
                    },
                  }}
                  plugins={[ChartDataLabels]}
                />
              </div>
            </div>
            <div>
              <h4 style={{ color: "#7d5a50", marginBottom: "15px", fontSize: "1rem" }}>Investor Details</h4>
              <div
                style={{
                  backgroundColor: "#f5f0e1",
                  padding: "15px",
                  borderRadius: "6px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    color: "#5d4037",
                    fontSize: "0.85rem",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e6d7c3" }}>
                      <th style={{ padding: "10px", textAlign: "left" }}>Investor</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Shares (%)</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Investment (RM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investors.map((investor, index) => (
                      <tr key={index} style={{ borderBottom: "1px solid #e6d7c3" }}>
                        <td style={{ padding: "10px" }}>{investor.name}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          {totalShares > 0 ? ((investor.shares / totalShares) * 100).toFixed(1) : 0}%
                        </td>
                        <td style={{ padding: "10px", textAlign: "right" }}>R{(investor.investment || 0).toFixed(1)}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: "2px solid #e6d7c3", fontWeight: "bold" }}>
                      <td style={{ padding: "10px" }}>Total</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>100%</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>R{totalInvestment.toFixed(1)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ color: "#5d4037", margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>IRR on Equity Investments</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            {!isInvestorView && (
              <button
                onClick={() => setShowIrrEditForm(!showIrrEditForm)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5d4037",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                {showIrrEditForm ? "Cancel" : "Edit Data"}
              </button>
            )}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowIrrDownloadOptions(!showIrrDownloadOptions)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#72542b",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Download
              </button>
              {showIrrDownloadOptions && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    backgroundColor: "#fdfcfb",
                    border: "1px solid #d4c4b0",
                    borderRadius: "4px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    zIndex: 1000,
                  }}
                >
                  <button
                    onClick={() => handleIrrDownload("json")}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 15px",
                      backgroundColor: "transparent",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "#5d4037",
                      fontSize: "0.8rem",
                    }}
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={() => handleIrrDownload("csv")}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 15px",
                      backgroundColor: "transparent",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "#5d4037",
                      fontSize: "0.8rem",
                    }}
                  >
                    Download CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {!isInvestorView && showIrrEditForm && (
          <div
            style={{
              backgroundColor: "#f7f3f0",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            <h4 style={{ color: "#72542b", marginTop: 0, fontSize: "1rem" }}>Edit IRR Investment Data</h4>
            {irrInvestments.map((investment, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "20px",
                  padding: "15px",
                  backgroundColor: "#fdfcfb",
                  borderRadius: "4px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr auto",
                    gap: "10px",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <input
                    type="text"
                    value={investment.name}
                    onChange={(e) => updateIrrInvestment(index, "name", e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                    placeholder="Project Name"
                  />
                  <input
                    type="number"
                    value={investment.irr}
                    onChange={(e) => updateIrrInvestment(index, "irr", e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                    placeholder="IRR %"
                  />
                  <select
                    value={investment.details.riskRating}
                    onChange={(e) => updateIrrInvestment(index, "details.riskRating", e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                  <button
                    onClick={() => removeIrrInvestment(index)}
                    style={{
                      padding: "6px",
                      backgroundColor: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                    }}
                  >
                    Remove
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <input
                    type="text"
                    value={investment.details.initialInvestment}
                    onChange={(e) => updateIrrInvestment(index, "details.initialInvestment", e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                    placeholder="Initial Investment"
                  />
                  <input
                    type="text"
                    value={investment.details.duration}
                    onChange={(e) => updateIrrInvestment(index, "details.duration", e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                    placeholder="Duration"
                  />
                  <input
                    type="text"
                    value={investment.details.cashFlows.join(", ")}
                    onChange={(e) => updateIrrInvestment(index, "details.cashFlows", e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                    placeholder="Cash Flows (comma separated)"
                  />
                </div>
              </div>
            ))}
            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              <button
                onClick={addIrrInvestment}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#72542b",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Add Investment
              </button>
              <button
                onClick={saveCapTableData}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Save Data
              </button>
            </div>
          </div>
        )}

        {irrInvestments.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "30px",
              color: "#72542b",
              backgroundColor: "#f7f3f0",
              borderRadius: "6px",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.9rem" }}>No investment data available. {!isInvestorView && 'Click "Edit Data" to add your first investment.'}</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            {irrInvestments.map((investment, index) => (
              <div
                key={index}
                style={{
                  padding: "15px",
                  backgroundColor: "#f7f3f0",
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <h4 style={{ color: "#72542b", marginTop: 0, fontSize: "1rem" }}>{investment.name}</h4>
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    backgroundColor: "#e8ddd4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto",
                    border: "6px solid #9c7c5f",
                    marginBottom: "15px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#5d4037",
                    }}
                  >
                    {investment.irr}%
                  </span>
                </div>

                <button
                  onClick={() => toggleIrrInvestment(index)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#5d4037",
                    color: "#fdfcfb",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginBottom: "10px",
                    fontSize: "0.8rem",
                  }}
                >
                  {expandedInvestment === index ? "Hide Details" : "Breakdown"}
                </button>

                {expandedInvestment === index && (
                  <div
                    style={{
                      textAlign: "left",
                      backgroundColor: "#e8ddd4",
                      padding: "10px",
                      borderRadius: "4px",
                      marginTop: "10px",
                      fontSize: "0.8rem",
                    }}
                  >
                    <p><strong>Initial Investment:</strong> {investment.details.initialInvestment}</p>
                    <p><strong>Duration:</strong> {investment.details.duration}</p>
                    <p><strong>Risk Rating:</strong> {investment.details.riskRating}</p>
                    <div>
                      <strong>Cash Flows:</strong>
                      <ul style={{ margin: "5px 0 0 20px", padding: 0 }}>
                        {investment.details.cashFlows.map((flow, i) => (
                          <li key={i}>{flow}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Loan Repayments — a schedule, not a KPI ────────────────────────────── */
const LoanRepaymentsPanel = ({ docs, fy, onSaveField, readOnly }) => {
  const months = useMemo(() => fyMonths(fy.startYear, fy.startMonth), [fy]);
  const [draft, setDraft] = useState({});
  const [saveState, setSaveState] = useState("idle");
  const timer = useRef(null);

  const val = (m) => {
    const k = `${m.year}|${m.month}`;
    if (draft[k] !== undefined) return draft[k];
    const v = docs[`${DOC.liq}_${m.year}`]?.loanRepayments?.[m.month];
    return v === undefined || v === null ? "" : String(v);
  };
  const set = (m, raw) => {
    setDraft((p) => ({ ...p, [`${m.year}|${m.month}`]: raw }));
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await onSaveField({ src: "liq", field: "loanRepayments", year: m.year, monthIndex: m.month, raw });
      setSaveState("saved"); setTimeout(() => setSaveState("idle"), 1800);
    }, 800);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const totalYear = months.reduce((s, m) => s + (parseFloat(val(m)) || 0), 0);
  const th = { padding: "9px 12px", fontSize: "11.5px", fontWeight: 700, color: "#fff", textTransform: "uppercase",
    letterSpacing: "0.5px", background: T.header };

  return (
    <div style={cardS}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: T.accent }}>Loan Repayments</div>
          <div style={{ fontSize: "12.5px", color: T.muted }}>What leaves the account for debt service each month · FY {fyLabel(fy.startYear, fy.startMonth)}</div>
        </div>
        <span style={{ fontSize: "12.5px", color: saveState === "saved" ? T.green : T.muted }}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Edits save automatically"}
        </span>
      </div>

      <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.15)" }}>Month</th>
              <th style={{ ...th, textAlign: "center", width: "38%" }}>Repayment</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => (
              <tr key={m.key} style={{ background: i % 2 ? T.panel : T.bg }}>
                <td style={{ padding: "7px 12px", fontSize: "13.5px", color: T.ink,
                  borderBottom: `1px solid ${T.lineSoft}`, borderRight: `1px solid ${T.lineSoft}` }}>{m.long}</td>
                <td style={{ padding: "4px 8px", borderBottom: `1px solid ${T.lineSoft}` }}>
                  <input type="number" step="any" readOnly={readOnly} placeholder="—" value={val(m)}
                    onChange={(e) => set(m, e.target.value)}
                    style={{ ...inputS, padding: "7px 9px", textAlign: "center", fontSize: "13.5px", minHeight: "34px" }} />
                </td>
              </tr>
            ))}
            <tr style={{ background: T.accentTint }}>
              <td style={{ padding: "10px 12px", fontSize: "13.5px", fontWeight: 700, color: T.accent, borderRight: `1px solid ${T.lineSoft}` }}>
                Total for the year
              </td>
              <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "14.5px", fontWeight: 700, color: T.accent, fontVariantNumeric: "tabular-nums" }}>
                {fmtValue(totalYear, { units: "R" })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Main
   ════════════════════════════════════════════════════════════════════════ */
const PREFS_KEY = "finPerf.addData.prefs";
const META_DOC = "financialKpiMeta";
const KPI_SUB = "__kpis__";

const FinancialPerformance = () => {
  const [user, setUser] = useState(null);
  const [fyStartMonth, setFyStartMonth] = useState(0);
  const [docs, setDocs] = useState({});
  const [meta, setMeta] = useState({ kpis: {}, custom: [], hiddenTabs: [] });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [dataPrefs, setDataPrefs] = useState(null);

  const [isInvestorView, setIsInvestorView] = useState(false);
  const [viewingSMEId, setViewingSMEId] = useState(null);
  const [viewingSMEName, setViewingSMEName] = useState("");
  const [viewOrigin, setViewOrigin] = useState("investor");

  const [activeTabId, setActiveTabId] = useState(TAB_DEFS[0].id);
  const [activeSubId, setActiveSubId] = useState(KPI_SUB);
  const [period, setPeriod] = useState("month");

  const [filters, setFilters] = useState({ category: "all", kpi: "all", units: "all", source: "all", status: "all" });
  const [openFilter, setOpenFilter] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [widths, setWidths] = useState(() => ({ ...Object.fromEntries(COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].width])), [ACTIONS_KEY]: 166 }));
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

  /* Several financial years are loaded so FY−, FY and FY+ all resolve without
     a round trip when the year selector moves. */
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
        if (metaSnap.exists()) setMeta({ kpis: {}, custom: [], hiddenTabs: [], ...metaSnap.data() });
      } catch (err) {
        console.error("Error loading financial data:", err);
        notify("error", `Could not load your financial data: ${errText(err)}`);
      } finally { setLoading(false); }
    })();
  }, [user, loadDocs]);

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

  /* Writes a single month cell into the source doc, keeping the 12-slot array
     shape the rest of the platform expects. */
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
      // Custom KPIs have no source document, so they live on the meta doc.
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

  const savePanelField = async ({ src, field, year, monthIndex, raw }) =>
    writeArrayCell({ docKey: `${DOC[src]}_${year}`, field, monthIndex, raw });

  const saveBalanceSheetCell = async ({ year, monthIndex, path, key, raw }) => {
    if (!user?.uid || isInvestorView) return;
    const docKey = `${DOC.bs}_${year}`;

    /* First edit on an empty year creates the document from the blank
       template rather than silently dropping the keystroke. */
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

  /* ─── Assemble tabs: registry + custom KPIs + saved meta, then hydrate
       every KPI with a full financial year of entries. ─────────────────── */
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
        kpis: (cat.kpis || []).map((kpi) => {
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
            notes: saved.notes || "", periodNotes: saved.periodNotes || {}, chart: saved.chart || null };
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

  /* A category flagged `subTab` leaves the KPI table and gets its own tab
     under the parent — the KPI rows keep the first slot. */
  const subTabs = useMemo(() => {
    const extras = (activeTab?.categories || []).filter((c) => c.subTab);
    if (!extras.length) return [];
    return [{ id: KPI_SUB, name: "Solvency & Leverage" }, ...extras.map((c) => ({ id: c.name, name: c.name, custom: c.custom }))];
  }, [activeTab]);

  useEffect(() => {
    if (!subTabs.length) { setActiveSubId(KPI_SUB); return; }
    if (!subTabs.some((s) => s.id === activeSubId)) setActiveSubId(subTabs[0].id);
  }, [subTabs, activeSubId]);

  const activeSub = subTabs.find((s) => s.id === activeSubId);
  const showKpiTable = !subTabs.length || activeSubId === KPI_SUB;

  const updateKpiMeta = (kpiId, patch) =>
    persistMeta({ ...meta, kpis: { ...meta.kpis, [kpiId]: { ...(meta.kpis[kpiId] || {}), ...patch } } });

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
      else if (key === "source") set.add(r.kpi.field ? "Entered" : "Calculated");
      else if (key === "status") set.add(r.status.label);
    });
    return ["all", ...Array.from(set).sort()];
  };

  const rows = useMemo(() => {
    const list = allRows.filter((r) =>
      (filters.category === "all" || r.categoryName === filters.category) &&
      (filters.kpi === "all" || r.kpi.name === filters.kpi) &&
      (filters.units === "all" || r.kpi.units === filters.units) &&
      (filters.source === "all" || (r.kpi.field ? "Entered" : "Calculated") === filters.source) &&
      (filters.status === "all" || r.status.label === filters.status));

    const get = {
      category: (r) => r.categoryName, kpi: (r) => r.kpi.name,
      units: (r) => r.kpi.units, source: (r) => (r.kpi.field ? "Entered" : "Calculated"),
      budget: (r) => Number(r.values.budget) || 0, actual: (r) => Number(r.values.actual) || 0,
      variance: (r) => Number(r.variance) || 0,
      status: (r) => ({ green: 0, amber: 1, red: 2, none: 3 }[r.status.key]),
    }[sortConfig.key];

    return [...list].sort((a, b) => {
      // Category leads so the merged Category cell stays contiguous.
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
  const clearFilters = () => { setFilters({ category: "all", kpi: "all", units: "all", source: "all", status: "all" }); setSortConfig({ key: null, direction: "asc" }); };

  const downloadCSV = () => {
    const p = PERIOD_PREFIX[period];
    const lines = [["Section","Category","KPI","Units","Source", `${p} Budget`, `${p} Actual`, `${p} Variance`, "Status"]];
    tabs.forEach((tab) => tab.categories.forEach((cat) => (cat.kpis || []).forEach((kpi) => {
      const v = periodValues(kpi, period, fy);
      lines.push([tab.name, cat.name, `"${kpi.name}"`, kpi.units, kpi.field ? "Entered" : "Calculated",
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
        <h1 style={{ color: T.accent, fontSize: "27px", fontWeight: 650, margin: 0, letterSpacing: "-0.5px" }}>Financial Performance Summary</h1>
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

      <div style={{ display: "flex", gap: "2px", borderBottom: `1px solid ${T.lineStrong}`, marginBottom: subTabs.length ? "12px" : "18px", flexWrap: "wrap", alignItems: "center" }}>
        {visibleTabs.map((tab) => {
          const on = tab.id === activeTab?.id;
          const counts = tab.categories.flatMap((c) => c.kpis || []).reduce((acc, k) => {
            const key = getStatus(k, period, fy).key; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
          return (
            <button key={tab.id} onClick={() => { setActiveTabId(tab.id); setActiveSubId(KPI_SUB); clearFilters(); }}
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
          <button onClick={() => setManageTabs(true)} title="Hide or show a section"
            style={{ ...btnQuiet, marginLeft: "auto", marginBottom: "4px", padding: "6px 12px", fontSize: "12.5px", color: T.muted }}>
            <Settings2 size={13} /> Sections
          </button>
        )}
      </div>

      {/* Sub-tabs sit lower in the hierarchy, so they read as pills rather
          than another underlined row competing with the tabs above. */}
      {subTabs.length > 0 && (
        <div style={{ display: "inline-flex", background: T.raised, borderRadius: "10px", padding: "3px", marginBottom: "18px", flexWrap: "wrap" }}>
          {subTabs.map((s) => {
            const on = s.id === activeSubId;
            return (
              <button key={s.id} onClick={() => setActiveSubId(s.id)}
                style={{ padding: "7px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13.5px",
                  fontWeight: 600, border: "none", fontFamily: "inherit",
                  background: on ? T.bg : "transparent", color: on ? T.accent : T.body,
                  boxShadow: on ? "0 1px 3px rgba(45,32,28,0.14)" : "none" }}>
                {s.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Balance Sheet is a document, not a KPI table. */}
      {activeTab?.custom === "balanceSheet" ? (
        <BalanceSheetTab fy={fy} docs={docs} readOnly={isInvestorView} onSaveCell={saveBalanceSheetCell} />
      ) : activeSub?.custom === "equity" ? (
        <div style={{ marginBottom: "20px" }}>
          <DividendHistory currentUser={user} isInvestorView={isInvestorView} />
          <CapTableOverview currentUser={user} isInvestorView={isInvestorView} />
        </div>
      ) : (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: "15.5px", fontWeight: 600, color: T.accent }}>{activeTab?.name}</h3>
            <span style={{ fontSize: "12.5px", color: T.muted }}>{rows.length} of {allRows.length} KPIs</span>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} style={{ ...btnQuiet, padding: "3px 10px", fontSize: "12.5px", border: `1px solid ${T.lineStrong}`, borderRadius: "999px" }}>
                Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
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
                    <button onClick={() => setVisibility(Object.fromEntries(COLUMN_ORDER.map((k) => [k, true])))}
                      style={{ ...btnGhost, width: "100%", justifyContent: "center", marginTop: "6px", fontSize: "12.5px", padding: "7px" }}>Show all</button>
                  </div>
                </>
              )}
            </div>
            <button onClick={downloadCSV} style={btnGhost}><Download size={14} /> CSV</button>
            <button onClick={() => { window.location.href = "/raps-actions"; }} style={btnGhost}>
              <ClipboardList size={14} /> Financial Performance <ExternalLink size={11} />
            </button>
            {!isInvestorView && <button onClick={() => setAddFlow("choose")} style={btnPrimary}><Plus size={14} /> Add KPI/Data</button>}
          </div>
        </div>

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
                          {/* Every header starts at the top; two-line ones run
                              further down rather than pushing the rest around. */}
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
                                  {opt === "all" ? `All ${def.label.toLowerCase()}` : opt}
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
                          <InfoTip light text="Trend chart, the all-timeframe analysis, add an action, and notes for this KPI." />
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
                        {cell("source", (
                          <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "999px", background: T.raised, color: T.body, fontWeight: 500 }}>
                            {kpi.field ? "Entered" : "Calculated"}
                          </span>
                        ))}
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

        {/* Loan Repayments stays a panel under the Liquidity table. */}
        {activeTab?.categories.some((c) => c.custom === "loans") && (
          <div style={{ marginBottom: "20px" }}>
            <LoanRepaymentsPanel docs={docs} fy={fy} readOnly={isInvestorView} onSaveField={savePanelField} />
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
        <Modal title="Sections" subtitle="Hide a section to take it off the dashboard" icon={<Settings2 size={17} />}
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
            Sections are built in, so they hide rather than delete — the underlying financial data is shared with the rest of the platform.
          </p>
        </Modal>
      )}

      {addFlow === "choose" && <AddChooser onClose={() => setAddFlow(null)} onPick={(k) => setAddFlow(k)} />}

      {addFlow === "data" && <AddDataWizard tabs={tabs} fy={fy} docs={docs} currentTabId={activeTabId}
        prefs={dataPrefs} onSavePrefs={savePrefs} onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
        onSaveField={saveKpiField} />}

      {addFlow === "kpi" && <AddKpiWizard tabs={tabs} currentTabId={activeTabId}
        onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
        onSave={async (kpi) => { await persistMeta({ ...meta, custom: [...(meta.custom || []), kpi] }); notify("success", "KPI created."); }} />}
    </div>
  );
};

export default FinancialPerformance;