"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Chart, Pie, Bar } from "react-chartjs-2";
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
  Database, Sparkles, Sigma, Settings2, EyeOff, Palette, Check, Users, Trash2,
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const functions = getFunctions();

/* ════════════════════════════════════════════════════════════════════════════
   Tokens — shared with Operational and Financial Performance.
   ════════════════════════════════════════════════════════════════════════ */
const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", faint: "#8a7a74",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#4a352f", accentSoft: "#6b4f47", accentTint: "#f4efec",
  header: "#33231e",
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
  if (kpi?.options) {
    const found = kpi.options.find((o) => String(o.value) === String(Math.round(Number(raw))));
    return found ? found.label : "—";
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  const sign = signed && n > 0 ? "+" : "";
  if (kpi?.units === "%") return `${sign}${trimNum(n)}${bare ? "" : "%"}`;
  if (kpi?.units === "R") {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `${sign}${bare ? "" : "R "}${(n / 1_000_000).toLocaleString(LOCALE, { maximumFractionDigits: 2 })}m`;
    if (abs >= 1_000) return `${sign}${bare ? "" : "R "}${(n / 1_000).toLocaleString(LOCALE, { maximumFractionDigits: 1 })}k`;
    return `${sign}${bare ? "" : "R "}${n.toLocaleString(LOCALE, { maximumFractionDigits: 0 })}`;
  }
  const suffix = !bare && kpi?.units && !["#","%","R"].includes(kpi.units) ? ` ${kpi.units}` : "";
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
   Source documents — the same peopleData docs the old sections wrote to, so
   existing data appears immediately.

   People figures are stored as twelve calendar-month slots with no year on
   the document, so the same twelve slots serve every financial year. The FY
   selector reorders them; it doesn't separate them.
   ════════════════════════════════════════════════════════════════════════ */
const DOC = {
  prod: "_productivity",
  cap: "_capabilityTraining",
  exec: "_executionCapacity",
  stab: "_stabilityContinuity",
  comp: "_employeeComposition",
  track: "_employeeTracking",
  term: "_terminationData",
  hire: "_newHireData",
  pnl: "_pnlManual",
  bs: "_capitalStructure",
};

const atPath = (obj, path) => path.reduce((o, k) => (o == null ? undefined : o[k]), obj);
const numAt = (docs, src, path, mi) => {
  const arr = atPath(docs[src], path);
  if (!Array.isArray(arr)) return null;
  const n = parseFloat(arr[mi]);
  return Number.isFinite(n) ? n : null;
};
const scalarAt = (docs, src, path) => {
  const v = atPath(docs[src], path);
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

/* Everything a KPI might need for one month, in one object. */
const buildContext = (docs, mi) => ({
  // Productivity
  revenuePerEmployee: numAt(docs, "prod", ["productivityData","revenuePerEmployee","actual"], mi),
  revenuePerEmployeeB: numAt(docs, "prod", ["productivityData","revenuePerEmployee","budget"], mi),
  laborCostPercentage: numAt(docs, "prod", ["productivityData","laborCostPercentage","actual"], mi),
  laborCostPercentageB: numAt(docs, "prod", ["productivityData","laborCostPercentage","budget"], mi),
  salesVolumePerEmployee: numAt(docs, "prod", ["productivityData","salesVolumePerEmployee","actual"], mi),
  salesVolumePerEmployeeB: numAt(docs, "prod", ["productivityData","salesVolumePerEmployee","budget"], mi),
  overtimeHours: numAt(docs, "prod", ["productivityData","overtimeHours","actual"], mi),
  overtimeHoursB: numAt(docs, "prod", ["productivityData","overtimeHours","budget"], mi),
  // Capability
  trainingSpendAmount: numAt(docs, "cap", ["capabilityData","trainingSpendAmount","actual"], mi),
  trainingSpendAmountB: numAt(docs, "cap", ["capabilityData","trainingSpendAmount","budget"], mi),
  trainingSpendPercentage: numAt(docs, "cap", ["capabilityData","trainingSpendPercentage","actual"], mi),
  trainingSpendPercentageB: numAt(docs, "cap", ["capabilityData","trainingSpendPercentage","budget"], mi),
  trainingFocus: numAt(docs, "cap", ["capabilityData","trainingFocus","actual"], mi),
  trainingFocusB: numAt(docs, "cap", ["capabilityData","trainingFocus","budget"], mi),
  // Composition — scalars, so the same figure stands for every month
  headCount: scalarAt(docs, "comp", ["employeeData","headCount"]),
  targetHeadCount: scalarAt(docs, "comp", ["employeeData","targetHeadCount"]),
  // Execution capacity
  criticalFunctionsSinglePoint: numAt(docs, "exec", ["executionData","criticalFunctionsSinglePoint"], mi),
  criticalRolesWith2IC: numAt(docs, "exec", ["executionData","criticalRolesWith2IC"], mi),
  // Stability
  overallTurnover: numAt(docs, "stab", ["stabilityData","overallTurnover"], mi),
  criticalRoleTurnover: numAt(docs, "stab", ["stabilityData","criticalRoleTurnover"], mi),
  workforceMovements: numAt(docs, "stab", ["stabilityData","workforceMovements"], mi),
  contractorDependence: numAt(docs, "stab", ["stabilityData","contractorDependence"], mi),
});

/* ════════════════════════════════════════════════════════════════════════════
   The KPI registry — tabs, categories, KPIs.

   `benchmark` is the fallback the status uses when nobody has captured a
   target, so a KPI without a budget still says something rather than nothing.
   ════════════════════════════════════════════════════════════════════════ */
const K = (o) => ({
  id: o.id, name: o.name, units: o.units, direction: o.direction || "higher",
  aggregate: o.aggregate || "avg", meaning: o.meaning, measured: o.measured,
  actual: o.actual, budget: o.budget || (() => null),
  benchmark: o.benchmark ?? null, options: o.options || null, field: o.field || null,
});

const FOCUS_OPTIONS = [
  { value: 1, label: "Technical" },
  { value: 2, label: "Leadership" },
  { value: 3, label: "Compliance" },
];

const TAB_DEFS = [
  {
    id: "summary", name: "People Performance Summary",
    categories: [
      { name: "Productivity", kpis: [
        K({ id: "revenuePerEmployee", name: "Revenue per Employee", units: "R", direction: "higher", aggregate: "avg",
          benchmark: 500000,
          field: { src: "prod", a: ["productivityData","revenuePerEmployee","actual"], b: ["productivityData","revenuePerEmployee","budget"] },
          meaning: "How much revenue each person on the payroll brings in. The cleanest single read on whether output is scaling with headcount.",
          measured: "=SUM(Revenue) / AVERAGE(Headcount)\n\nWhere Revenue comes from the P&L and Headcount from the Balance Sheet's additional metrics. Format as Currency (R, 0 decimals).",
          actual: (c) => c.revenuePerEmployee, budget: (c) => c.revenuePerEmployeeB }),
        K({ id: "laborCostPercentage", name: "Labour Cost % of Revenue", units: "%", direction: "lower", aggregate: "avg",
          benchmark: 35,
          field: { src: "prod", a: ["productivityData","laborCostPercentage","actual"], b: ["productivityData","laborCostPercentage","budget"] },
          meaning: "The share of every rand of revenue that goes to paying people. Rises when hiring outpaces output.",
          measured: "=SUM(Salaries) / SUM(Revenue) * 100\n\nBoth from the P&L. Format as Percentage (1 decimal).",
          actual: (c) => c.laborCostPercentage, budget: (c) => c.laborCostPercentageB }),
        K({ id: "salesVolumePerEmployee", name: "Sales Volume per Employee", units: "units", direction: "higher", aggregate: "avg",
          benchmark: 100,
          field: { src: "prod", a: ["productivityData","salesVolumePerEmployee","actual"], b: ["productivityData","salesVolumePerEmployee","budget"] },
          meaning: "Units shifted per person. Useful where revenue is distorted by pricing changes.",
          measured: "=SUM(UnitsSold) / AVERAGE(Headcount)",
          actual: (c) => c.salesVolumePerEmployee, budget: (c) => c.salesVolumePerEmployeeB }),
        K({ id: "overtimeHours", name: "Overtime Hours", units: "hrs", direction: "lower", aggregate: "sum",
          benchmark: 10,
          field: { src: "prod", a: ["productivityData","overtimeHours","actual"], b: ["productivityData","overtimeHours","budget"] },
          meaning: "Hours worked beyond contract. Persistent overtime usually means understaffing or a process that isn't working.",
          measured: "=SUM(OvertimeHours)\n\nFrom the timekeeping register for the month.",
          actual: (c) => c.overtimeHours, budget: (c) => c.overtimeHoursB }),
      ]},
      { name: "Capability & Training", kpis: [
        K({ id: "trainingSpendAmount", name: "Training Spend (R)", units: "R", direction: "higher", aggregate: "sum",
          benchmark: 50000,
          field: { src: "cap", a: ["capabilityData","trainingSpendAmount","actual"], b: ["capabilityData","trainingSpendAmount","budget"] },
          meaning: "What the business actually put into developing its people this month, in rand.",
          measured: "=SUM(TrainingSpend)\n\nFrom the Balance Sheet's additional metrics, or entered directly.",
          actual: (c) => c.trainingSpendAmount, budget: (c) => c.trainingSpendAmountB }),
        K({ id: "trainingSpendPercentage", name: "Training Spend (% of payroll)", units: "%", direction: "higher", aggregate: "avg",
          benchmark: 3,
          field: { src: "cap", a: ["capabilityData","trainingSpendPercentage","actual"], b: ["capabilityData","trainingSpendPercentage","budget"] },
          meaning: "Training spend measured against the wage bill — the fair way to compare year on year as you grow.",
          measured: "=SUM(TrainingSpend) / SUM(Payroll) * 100\n\nUnder 1% is under-investing; 3% and above is a business building capability.",
          actual: (c) => c.trainingSpendPercentage, budget: (c) => c.trainingSpendPercentageB }),
        K({ id: "trainingFocus", name: "Training Focus", units: "focus", direction: "match", aggregate: "avg",
          options: FOCUS_OPTIONS,
          field: { src: "cap", a: ["capabilityData","trainingFocus","actual"], b: ["capabilityData","trainingFocus","budget"] },
          meaning: "Where the training effort went this month — technical skills, leadership, or compliance.",
          measured: "Captured as a category rather than calculated.\n\n=INDEX({\"Technical\";\"Leadership\";\"Compliance\"}, FocusCode)\n\nRotate the focus so no one area is neglected across a year.",
          actual: (c) => c.trainingFocus, budget: (c) => c.trainingFocusB }),
      ]},
      { name: "Employee Composition", kpis: [
        K({ id: "headCount", name: "Head Count", units: "#", direction: "match", aggregate: "avg",
          field: { src: "comp", scalar: true, a: ["employeeData","headCount"], b: ["employeeData","targetHeadCount"] },
          meaning: "How many people are on the books, against the target you set. The gap is your open vacancies.",
          measured: "=COUNTA(EmployeeRegister)\n\nTarget head count is the planned establishment. Vacancies = Target − Actual.",
          actual: (c) => c.headCount, budget: (c) => c.targetHeadCount }),
      ]},
      { name: "Execution Capacity", kpis: [
        K({ id: "criticalFunctionsSinglePoint", name: "% Critical Functions Dependent on 1 Person", units: "%", direction: "lower", aggregate: "avg",
          benchmark: 20,
          field: { src: "exec", a: ["executionData","criticalFunctionsSinglePoint"] },
          meaning: "How much of the business would stop if one particular person didn't come in. This is key-person risk in a single number.",
          measured: "=COUNTIF(SinglePointFlag, \"Yes\") / COUNTA(CriticalFunctions) * 100\n\nUnder 20% is where you want to be.",
          actual: (c) => c.criticalFunctionsSinglePoint }),
        K({ id: "criticalRolesWith2IC", name: "% Critical Roles with 2IC", units: "%", direction: "higher", aggregate: "avg",
          benchmark: 80,
          field: { src: "exec", a: ["executionData","criticalRolesWith2IC"] },
          meaning: "The share of critical roles with a named, capable second-in-command. Your succession cover, measured.",
          measured: "=COUNTIF(HasSecond, \"Yes\") / COUNTA(CriticalRoles) * 100\n\nAbove 80% is a resilient organisation.",
          actual: (c) => c.criticalRolesWith2IC }),
      ]},
      { name: "Stability", kpis: [
        K({ id: "overallTurnover", name: "Overall Turnover (% Annually)", units: "%", direction: "lower", aggregate: "avg",
          benchmark: 15,
          field: { src: "stab", a: ["stabilityData","overallTurnover"] },
          meaning: "The share of your people who leave in a year. Replacing someone costs between half and twice their salary, so this is a cost line as much as a culture signal.",
          measured: "=COUNTA(Terminations) / AVERAGE(Headcount) * 100\n\nUnder 15% overall, under 10% voluntary.",
          actual: (c) => c.overallTurnover }),
        K({ id: "criticalRoleTurnover", name: "Critical Role Turnover", units: "%", direction: "lower", aggregate: "avg",
          benchmark: 10,
          field: { src: "stab", a: ["stabilityData","criticalRoleTurnover"] },
          meaning: "Turnover in the roles that are hardest to replace. Far more damaging than the headline turnover figure.",
          measured: "=COUNTIFS(Terminations, CriticalFlag=\"Yes\") / COUNTA(CriticalRoles) * 100\n\nUnder 10% annually.",
          actual: (c) => c.criticalRoleTurnover }),
        K({ id: "workforceMovements", name: "Workforce Movements", units: "#", direction: "higher", aggregate: "sum",
          field: { src: "stab", a: ["stabilityData","workforceMovements"] },
          meaning: "Net change in headcount — hires less exits. Positive is growth; large swings either way point to unstable planning.",
          measured: "=COUNTA(NewHires) - COUNTA(Terminations)",
          actual: (c) => c.workforceMovements }),
        K({ id: "contractorDependence", name: "Contractor Dependence", units: "%", direction: "lower", aggregate: "avg",
          benchmark: 20,
          field: { src: "stab", a: ["stabilityData","contractorDependence"] },
          meaning: "How much of the workforce sits outside permanent employment. Flexible, but knowledge walks out with them.",
          measured: "=COUNTIF(ContractType, \"Contract\") / COUNTA(Workforce) * 100\n\nOver 30% is worth a conversion plan.",
          actual: (c) => c.contractorDependence }),
      ]},
    ],
  },
  {
    id: "capability", name: "Capability",
    categories: [
      { name: "Employee Development Tracking", panel: "tracking", kpis: [] },
    ],
  },
  {
    id: "capacity", name: "Capacity",
    categories: [
      { name: "Founder Operational Load", panel: "capacityLoad", kpis: [] },
      { name: "Average Span of Control", panel: "capacitySpan", kpis: [] },
    ],
  },
  {
    id: "stability", name: "Stability & Continuity",
    categories: [
      { name: "Termination Records", panel: "recordsTerm", kpis: [] },
      { name: "New Hire Records", panel: "recordsHire", kpis: [] },
    ],
  },
];

/* ─── Status ────────────────────────────────────────────────────────────── */
const S = {
  green: { key: "green", label: "On target", color: T.green, bg: T.greenBg },
  amber: { key: "amber", label: "Needs attention", color: T.amber, bg: T.amberBg },
  red: { key: "red", label: "Critical", color: T.red, bg: T.redBg },
  none: { key: "none", label: "No target", color: T.faint, bg: T.raised },
};
const statusFromPair = (kpi, budget, actual) => {
  const b = Number(budget), a = Number(actual);
  if (!Number.isFinite(b) || !Number.isFinite(a)) return S.none;
  if (kpi.direction === "match") {
    if (b === 0) return Math.abs(a) < 0.001 ? S.green : Math.abs(a) <= 1 ? S.amber : S.red;
    const drift = Math.abs(a - b) / Math.abs(b);
    return drift <= 0.05 ? S.green : drift <= 0.20 ? S.amber : S.red;
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
  category:  { label: "Category", width: 178, tip: "The category this KPI sits under.", filter: true, sort: true, hideable: true },
  kpi:       { label: "KPI", width: 288, tip: "The metric being tracked. Click the eye to see what it means and how it is measured.", filter: true, sort: true, hideable: false },
  units:     { label: "Units", width: 90, align: "center", tip: "The unit every figure in this row is expressed in.", filter: true, sort: true, hideable: true },
  budget:    { label: "Target", width: 132, align: "center", tip: "Your captured target, or the recommended benchmark where none is set.", sort: true, hideable: true },
  actual:    { label: "Actual", width: 132, align: "center", tip: "What was recorded for the selected period.", sort: true, hideable: true },
  variance:  { label: "Variance", width: 132, align: "center", tip: "Actual minus Target. Green means favourable for this KPI's direction.", sort: true, hideable: true },
  status:    { label: "Status", width: 104, align: "center", tip: "Green: on target. Amber: needs attention. Red: well outside target.", filter: true, sort: true, hideable: true },
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
const panelTh = { padding: "9px 12px", fontSize: "11.5px", fontWeight: 700, color: "#fff", textTransform: "uppercase",
  letterSpacing: "0.5px", background: T.header, whiteSpace: "nowrap" };

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
        {[`Units: ${kpi.units}`,
          DIRECTIONS.find((d) => d.value === kpi.direction)?.label,
          kpi.aggregate === "avg" ? "AVERAGE across periods" : "SUM across periods",
          kpi.benchmark !== null ? `Benchmark: ${fmtValue(kpi.benchmark, kpi)}` : null,
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

/* ─── Analysis ──────────────────────────────────────────────────────────── */
const localAnalysis = (kpi, period, v, fy) => {
  const status = statusFromPair(kpi, v.budget, v.actual);
  const variance = Number.isFinite(Number(v.budget)) && Number.isFinite(Number(v.actual)) ? Number(v.actual) - Number(v.budget) : null;
  const fav = varianceFavourable(kpi, variance);
  return {
    observations: [
      `${PERIOD_LABEL[period]} actual sits at ${fmtValue(v.actual, kpi)}${v.budget === null ? " with no target captured." : ` against a target of ${fmtValue(v.budget, kpi)}.`}`,
      variance === null ? "Variance cannot be computed until a target exists for this period."
        : `That is a ${fav ? "favourable" : "unfavourable"} variance of ${fmtValue(Math.abs(variance), kpi)}.`,
      kpi.benchmark !== null ? `The recommended benchmark for this measure is ${fmtValue(kpi.benchmark, kpi)}.` : "No published benchmark for this measure — judge it against your own history.",
      `${DIRECTIONS.find((d) => d.value === kpi.direction)?.label} for this KPI.`,
    ],
    trends: status.key === "green"
      ? ["Holding inside tolerance, which points to a stable people position.",
         "Watch the month-to-month spread rather than the headline."]
      : status.key === "amber"
        ? ["Drifted outside tolerance but not far — this reads as drift rather than a break.",
           "Two or three more months at this level would move it into critical territory."]
        : status.key === "red"
          ? ["The gap is wide enough that a single-month correction is unlikely to close it.",
             "Treat the trend as broken until two consecutive months recover."]
          : ["No target captured for this period, so there is nothing to measure the actual against."],
    issues: status.key === "green" ? ["No material issue at this timeframe."]
      : status.key === "none" ? ["Capture a target so performance can be judged rather than just reported."]
      : [`Target is not being met${variance === null ? "" : ` — off by ${fmtValue(Math.abs(variance), kpi)}`}.`,
         status.key === "red" ? "Severity warrants a named owner and a dated action." : "Unattended, this compounds quietly across periods."],
    opportunities: status.key === "green"
      ? ["Consider tightening the target — the current one may no longer be stretching.",
         "Document what is working and apply it to the weaker measures in this category."]
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
      ...rows.map((r) => `${r.label}: ${fmtValue(r.v.actual, kpi)}${r.v.budget === null ? " (no target)" : ` against ${fmtValue(r.v.budget, kpi)} — ${r.status.label.toLowerCase()}`}.`),
      `${withData.length} of ${rows.length} timeframes have both an actual and a target.`,
    ],
    trends: withData.length < 2 ? ["Not enough timeframes with a target to compare the short term against the long."]
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
         "Check whether the target is still realistic before chasing the actual."]
      : ["Focus on the timeframe drifting first; the others usually follow.",
         "Keep the target under review as the team grows."],
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
          module: "People Performance",
          kpiName: kpi.name, meaning: kpi.meaning, measured: kpi.measured,
          units: kpi.units, direction: kpi.direction, benchmark: kpi.benchmark, scope,
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
    { label: "Target", ...buildSeries(prefs.budgetType, budget, prefs.budgetColor), order: 1, __labelColor: prefs.budgetColor },
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
  const onTarget = variance.filter((v) => v !== null && varianceFavourable(kpi, v)).length;
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
            {[["actualType","Actual as"],["budgetType","Target as"],["varianceType","Variance as"]].map(([k, l]) => (
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
            {[{ k: "actualColor", l: "Actual colour" }, { k: "budgetColor", l: "Target colour" }].map((c) => (
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
          <span style={{ fontSize: "12.5px", fontWeight: 700, color: T.accent }}>Target vs Actual</span>
          <span style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {key("Variance", <span style={{ display: "inline-flex", gap: "3px" }}>{dot(T.green)}{dot(T.red)}</span>)}
            {key("Target", prefs.budgetType === "bar" ? barChip(prefs.budgetColor) : dot(prefs.budgetColor))}
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
        {stat("Average target", fmtValue(avgBudget, kpi))}
        {stat("Average actual", fmtValue(avgActual, kpi))}
        {stat("Average variance", fmtValue(avgVar, kpi, { signed: true }), avgVar === null ? T.ink : varianceFavourable(kpi, avgVar) ? T.green : T.red)}
        {stat("Periods on target", counted ? `${onTarget} of ${counted}` : "—")}
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
          placeholder="e.g. Overtime spiked in March because two people were on extended leave."
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
    description: `${PERIOD_LABEL[period]} actual ${fmtValue(v.actual, kpi)} against target ${fmtValue(v.budget, kpi)}${
      variance === null ? "" : ` (variance ${fmtValue(variance, kpi, { signed: true })})`}. Raised from ${tabName} · ${categoryName}.`,
    category: "People", assignedTo: "", dueDate: "", status: "In Progress",
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
      category: force || !prev.dueDate ? (m.category || m.department || "People") : prev.category,
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
        sourceModule: "People Performance", sourceKpi: kpi.name, sourceCategory: `${tabName} · ${categoryName}`,
      };
      let targetId = meetingId;
      if (!targetId) {
        const meta = RAPS_CATEGORIES.find((c) => c.name === "People");
        const holder = {
          id: uid(), title: "People Performance Actions",
          category: "People", department: "People",
          categoryColor: meta.color, categoryBg: "#FCE4EC", departmentColor: meta.color, departmentBg: "#FCE4EC",
          departments: [], purpose: "Actions raised from People Performance.",
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
                No meetings yet — filed under "People Performance Actions".
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
   Add Data — writes back into the same peopleData docs the old sections used.
   ════════════════════════════════════════════════════════════════════════ */
const AddDataWizard = ({ tabs, fy, docs, prefs, onSavePrefs, onBack, onClose, onSaveField, onPullFinancials, currentTabId }) => {
  const editableTabs = tabs.filter((t) => t.categories.some((c) => (c.kpis || []).some((k) => k.field)));
  const [tabId, setTabId] = useState(prefs?.tabId && editableTabs.some((t) => t.id === prefs.tabId) ? prefs.tabId
    : editableTabs.some((t) => t.id === currentTabId) ? currentTabId : editableTabs[0]?.id);
  const [startYear, setStartYear] = useState(prefs?.startYear ?? fy.startYear);
  const [periodKey, setPeriodKey] = useState(null);
  const [draft, setDraft] = useState({});
  const [saveState, setSaveState] = useState("idle");
  const [pulling, setPulling] = useState(false);
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

  const rows = useMemo(() => {
    if (!tab) return [];
    const out = [];
    tab.categories.forEach((cat) => (cat.kpis || []).forEach((k) => out.push({ kpi: k, category: cat.name })));
    return out;
  }, [tab]);

  const draftKey = (kpiId, which) => `${monthMeta?.month}|${kpiId}|${which}`;

  const value = (kpi, which) => {
    const dk = draftKey(kpi.id, which);
    if (draft[dk] !== undefined) return draft[dk];
    if (!kpi.field) return "";
    const path = which === "actual" ? kpi.field.a : kpi.field.b;
    if (!path) return "";
    const raw = kpi.field.scalar
      ? atPath(docs[kpi.field.src], path)
      : atPath(docs[kpi.field.src], path)?.[monthMeta.month];
    return raw === undefined || raw === null ? "" : String(raw);
  };

  /* Typing saves itself — stepping to the next month can't silently drop it. */
  const setValue = (kpi, which, raw) => {
    const dk = draftKey(kpi.id, which);
    setDraft((p) => ({ ...p, [dk]: raw }));
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await onSaveField({ kpi, which, raw, monthIndex: monthMeta.month });
      onSavePrefs({ tabId, startYear });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1800);
    }, 800);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const cell = { ...inputS, padding: "7px 9px", textAlign: "center", fontSize: "13.5px", minHeight: "34px" };
  const th = { ...panelTh, position: "sticky", top: 0, zIndex: 2, verticalAlign: "top" };
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

      {(tabId === "productivity" || tabId === "capability") && (
        <div style={{ ...cardS, background: T.panel, marginBottom: "12px", display: "flex",
          alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Info size={16} color={T.accentSoft} />
          <span style={{ flex: 1, minWidth: "220px", fontSize: "12.5px", color: T.body }}>
            Revenue per employee, labour cost % and training spend can be computed from Financial Performance rather than typed.
          </span>
          <button onClick={async () => { setPulling(true); await onPullFinancials(); setPulling(false); }}
            disabled={pulling} style={{ ...btnGhost, padding: "7px 12px", fontSize: "12.5px", opacity: pulling ? 0.6 : 1 }}>
            <RefreshCw size={12} /> {pulling ? "Pulling…" : "Pull from Financials"}
          </button>
        </div>
      )}

      <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ maxHeight: "42vh", overflowY: "auto" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.15)" }}>KPI</th>
                <th style={{ ...th, textAlign: "center", width: "24%", borderRight: "1px solid rgba(255,255,255,0.15)" }}>Actual</th>
                <th style={{ ...th, textAlign: "center", width: "24%" }}>Target</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ kpi, category }, i) => (
                <tr key={kpi.id} style={{ background: i % 2 ? T.panel : T.bg }}>
                  <td style={{ padding: "7px 12px", fontSize: "13.5px", color: T.ink,
                    borderBottom: `1px solid ${T.lineSoft}`, borderRight: `1px solid ${T.lineSoft}` }}>
                    <div style={{ fontWeight: 600 }}>{kpi.name}</div>
                    <div style={{ fontSize: "11.5px", color: T.muted }}>
                      {category} · {kpi.units}{kpi.field?.scalar ? " · applies to every month" : ""}
                    </div>
                  </td>
                  {["actual", "budget"].map((which) => {
                    const path = which === "actual" ? kpi.field?.a : kpi.field?.b;
                    return (
                      <td key={which} style={{ padding: "4px 8px", borderBottom: `1px solid ${T.lineSoft}`,
                        borderRight: which === "actual" ? `1px solid ${T.lineSoft}` : "none" }}>
                        {!path ? (
                          <div style={{ textAlign: "center", fontSize: "12.5px", color: T.faint, padding: "8px 0" }}>
                            {which === "budget" && kpi.benchmark !== null ? `${fmtValue(kpi.benchmark, kpi)} benchmark` : "—"}
                          </div>
                        ) : kpi.options ? (
                          <select value={value(kpi, which)} onChange={(e) => setValue(kpi, which, e.target.value)} style={{ ...cell, textAlign: "left" }}>
                            <option value="">—</option>
                            {kpi.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <input type="number" step="any" value={value(kpi, which)} placeholder="—"
                            onChange={(e) => setValue(kpi, which, e.target.value)} style={cell} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

/* ─── Add KPI ───────────────────────────────────────────────────────────── */
const AddKpiWizard = ({ tabs, currentTabId, onBack, onClose, onSave }) => {
  const [tabId, setTabId] = useState(tabs.some((t) => t.id === currentTabId) ? currentTabId : tabs[0]?.id);
  const [catChoice, setCatChoice] = useState("");
  const [newCat, setNewCat] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", units: "#", direction: "higher", aggregate: "avg", meaning: "", measured: "" });

  const tab = tabs.find((t) => t.id === tabId);
  const cats = tab?.categories || [];
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
    <Modal title="Add KPI" subtitle="A custom people metric you capture by hand each month" icon={<Sparkles size={17} />}
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
            {tabs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
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
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputS} placeholder="e.g. Absenteeism Rate" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <div>
          <label style={labelS}>Units</label>
          <select value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} style={selectS}>
            <option value="#">Count (#)</option><option value="%">Percent (%)</option>
            <option value="R">Currency (R)</option><option value="hrs">Hours</option>
            <option value="days">Days</option><option value="units">Units</option>
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
            <option value="avg">AVERAGE the months — rates, ratios</option>
            <option value="sum">SUM the months — counts, hours, rand</option>
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
          placeholder={"=SUM(DaysAbsent) / SUM(WorkingDays) * 100"} />
        <p style={{ fontSize: "12px", color: T.muted, marginTop: "7px", marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
          <Info size={12} /> Use Excel functions and named ranges — SUM, AVERAGE, COUNTIF, COUNTIFS.
        </p>
      </div>
    </Modal>
  );
};

const AddChooser = ({ onPick, onClose }) => (
  <Modal title="What would you like to do?" icon={<Plus size={17} />} onClose={onClose} width={580}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
      {[
        { key: "data", icon: <Database size={22} />, title: "Add Data", body: "Capture actual and target figures against the KPIs you already track." },
        { key: "kpi", icon: <Sparkles size={22} />, title: "Add KPI", body: "Create a custom people metric under any section or category." },
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
   Panels — the parts of People Performance that aren't KPI rows.
   ════════════════════════════════════════════════════════════════════════ */
const BROWN = ["#3E2723", "#5D4037", "#795548", "#8D6E63", "#A1887F", "#BCAAA4"];

const TrackingPanel = ({ docs, onEdit, readOnly }) => {
  const employees = docs.track?.employees || [];
  const doneCount = (k) => employees.filter((e) => e[k]?.status === "Done").length;
  const stages = [
    { key: "skillsGap", label: "Skills gap" },
    { key: "idp", label: "IDP" },
    { key: "midTermReview", label: "Mid-term review" },
    { key: "annualReview", label: "Annual review" },
  ];

  return (
    <div style={cardS}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: T.accent }}>Employee Development Tracking</div>
          <div style={{ fontSize: "12.5px", color: T.muted }}>Skills gap, IDP and reviews — target is 100% completion</div>
        </div>
        {!readOnly && <button onClick={onEdit} style={{ ...btnGhost, padding: "7px 12px", fontSize: "12.5px" }}><Pencil size={13} /> Edit tracking</button>}
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
        <div style={{ ...cardS, padding: "11px 14px", flex: "1 1 130px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: T.muted }}>Employees</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: T.ink, marginTop: "3px" }}>{employees.length}</div>
        </div>
        {stages.map((s) => {
          const n = doneCount(s.key);
          const all = employees.length > 0 && n === employees.length;
          return (
            <div key={s.key} style={{ ...cardS, padding: "11px 14px", flex: "1 1 130px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: T.muted }}>{s.label}</div>
              <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "3px", color: employees.length === 0 ? T.faint : all ? T.green : T.amber }}>
                {employees.length ? `${n} of ${employees.length}` : "—"}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", minWidth: "760px" }}>
            <thead>
              <tr>
                <th style={{ ...panelTh, textAlign: "left" }}>Employee</th>
                {stages.map((s) => <th key={s.key} style={{ ...panelTh, textAlign: "center" }}>{s.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "28px 16px", textAlign: "center", color: T.muted, fontSize: "13.5px" }}>
                  No employees tracked yet.
                </td></tr>
              ) : employees.map((e, i) => (
                <tr key={e.id || i} style={{ background: i % 2 ? T.panel : T.bg }}>
                  <td style={{ padding: "9px 12px", fontSize: "13.5px", fontWeight: 600, color: T.ink, borderBottom: `1px solid ${T.lineSoft}` }}>
                    {e.employee || "—"}
                  </td>
                  {stages.map((s) => {
                    const done = e[s.key]?.status === "Done";
                    return (
                      <td key={s.key} style={{ padding: "9px 12px", textAlign: "center", borderBottom: `1px solid ${T.lineSoft}` }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px",
                          color: done ? T.green : T.red }}>
                          {done ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {e[s.key]?.date ? fmtDMY(e[s.key].date) : done ? "Done" : "Not done"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CapacityLoadPanel = ({ docs, fy, onEdit, readOnly }) => {
  const exec = docs.exec?.executionData || {};
  const months = useMemo(() => fyMonths(fy.startYear, fy.startMonth), [fy]);

  const loadStatus = (v) => {
    if (v === "1" || v === 1) return { text: "Low", color: T.green, bg: T.greenBg };
    if (v === "2" || v === 2) return { text: "Medium", color: T.amber, bg: T.amberBg };
    if (v === "3" || v === 3) return { text: "High", color: T.red, bg: T.redBg };
    if (v === "4" || v === 4) return { text: "Critical", color: T.red, bg: T.redBg };
    return { text: "—", color: T.faint, bg: T.raised };
  };

  return (
    <div style={cardS}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: T.accent }}>Founder Operational Load</div>
          <div style={{ fontSize: "12.5px", color: T.muted }}>FY {fyLabel(fy.startYear, fy.startMonth)}</div>
        </div>
        {!readOnly && <button onClick={onEdit} style={{ ...btnGhost, padding: "7px 12px", fontSize: "12.5px" }}><Pencil size={13} /> Edit data</button>}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", minWidth: "760px" }}>
          <thead>
            <tr>{months.map((m) => (
              <th key={m.key} style={{ ...panelTh, textAlign: "center", fontSize: "11px", padding: "7px 4px" }}>{m.label}</th>
            ))}</tr>
          </thead>
          <tbody>
            <tr>{months.map((m) => {
              const s = loadStatus(exec.founderLoad?.[m.month]);
              return (
                <td key={m.key} style={{ padding: "6px 4px", textAlign: "center", borderBottom: `1px solid ${T.lineSoft}` }}>
                  <div style={{ padding: "6px 4px", borderRadius: "6px", background: s.bg, color: s.color,
                    fontSize: "11.5px", fontWeight: 700 }}>{s.text}</div>
                </td>
              );
            })}</tr>
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: "12px", color: T.muted, margin: "10px 0 0" }}>
        Low means the founder is on strategy and operations run without them. Critical means the business stops when they do. Aim for Low to Medium.
      </p>
    </div>
  );
};

const CapacitySpanPanel = ({ docs, fy, onEdit, readOnly }) => {
  const exec = docs.exec?.executionData || {};
  const months = useMemo(() => fyMonths(fy.startYear, fy.startMonth), [fy]);

  const spanStatus = (v) => {
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return { text: "—", color: T.faint, bg: T.raised };
    if (n >= 5 && n <= 8) return { text: n.toFixed(1), color: T.green, bg: T.greenBg };
    if (n < 3 || n > 12) return { text: n.toFixed(1), color: T.red, bg: T.redBg };
    return { text: n.toFixed(1), color: T.amber, bg: T.amberBg };
  };

  return (
    <div style={cardS}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: T.accent }}>Average Span of Control</div>
          <div style={{ fontSize: "12.5px", color: T.muted }}>FY {fyLabel(fy.startYear, fy.startMonth)}</div>
        </div>
        {!readOnly && <button onClick={onEdit} style={{ ...btnGhost, padding: "7px 12px", fontSize: "12.5px" }}><Pencil size={13} /> Edit data</button>}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", minWidth: "760px" }}>
          <thead>
            <tr>{months.map((m) => (
              <th key={m.key} style={{ ...panelTh, textAlign: "center", fontSize: "11px", padding: "7px 4px" }}>{m.label}</th>
            ))}</tr>
          </thead>
          <tbody>
            <tr>{months.map((m) => {
              const s = spanStatus(exec.spanOfControl?.[m.month]);
              return (
                <td key={m.key} style={{ padding: "6px 4px", textAlign: "center", borderBottom: `1px solid ${T.lineSoft}` }}>
                  <div style={{ padding: "6px 4px", borderRadius: "6px", background: s.bg, color: s.color,
                    fontSize: "11.5px", fontWeight: 700 }}>{s.text}</div>
                </td>
              );
            })}</tr>
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: "12px", color: T.muted, margin: "10px 0 0" }}>
        Five to eight direct reports is the working range. Below three is top-heavy; above twelve and supervision stops being real.
      </p>
    </div>
  );
};

const RecordsTermPanel = ({ docs, onEdit, readOnly }) => {
  const terms = docs.term?.entries || [];

  const byReason = terms.reduce((acc, e) => { acc[e.reason] = (acc[e.reason] || 0) + 1; return acc; }, {});
  const reasons = Object.keys(byReason);

  const pie = (labels, values, colors, total) => (
    <div style={{ height: "230px" }}>
      <Pie data={{ labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] }}
        options={{ responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: T.body, font: { size: 11 }, usePointStyle: true, boxWidth: 8 } },
            datalabels: { color: "#fff", font: { weight: "bold", size: 12 }, formatter: (v) => (v > 0 ? v : "") },
            tooltip: { backgroundColor: T.ink, padding: 10, cornerRadius: 8,
              callbacks: { label: (c) => `${c.label}: ${c.raw} (${total ? ((c.raw / total) * 100).toFixed(1) : 0}%)` } },
          } }}
        plugins={[ChartDataLabels]} />
    </div>
  );

  const table = (headers, rows, empty) => (
    <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", minWidth: "460px" }}>
          <thead><tr>{headers.map((h) => <th key={h} style={{ ...panelTh, textAlign: "left" }}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={headers.length} style={{ padding: "26px 16px", textAlign: "center", color: T.muted, fontSize: "13.5px" }}>{empty}</td></tr>
            ) : rows}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={cardS}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: T.accent }}>Termination Records</div>
          <div style={{ fontSize: "12.5px", color: T.muted }}>{terms.length} exits recorded · {reasons.length} distinct reasons</div>
        </div>
        {!readOnly && <button onClick={onEdit} style={{ ...btnGhost, padding: "7px 12px", fontSize: "12.5px" }}><Pencil size={13} /> Edit records</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "18px", alignItems: "start" }}>
        {table(["Employee", "Started", "Ended", "Reason"],
          terms.map((e, i) => (
            <tr key={e.id || i} style={{ background: i % 2 ? T.panel : T.bg }}>
              <td style={{ padding: "9px 12px", fontSize: "13.5px", color: T.ink, borderBottom: `1px solid ${T.lineSoft}` }}>{e.name || "—"}</td>
              <td style={{ padding: "9px 12px", fontSize: "13px", color: T.body, borderBottom: `1px solid ${T.lineSoft}` }}>{e.dateStarted || "—"}</td>
              <td style={{ padding: "9px 12px", fontSize: "13px", color: T.body, borderBottom: `1px solid ${T.lineSoft}` }}>{e.dateEnded || "—"}</td>
              <td style={{ padding: "9px 12px", borderBottom: `1px solid ${T.lineSoft}` }}>
                <span style={{ fontSize: "11.5px", fontWeight: 600, padding: "3px 9px", borderRadius: "999px", background: T.redBg, color: T.red }}>{e.reason}</span>
              </td>
            </tr>
          )), "No termination records yet.")}
        {reasons.length > 0 && (
          <div>
            <div style={{ fontSize: "12.5px", fontWeight: 600, color: T.accent, marginBottom: "8px" }}>Reasons for leaving</div>
            {pie(reasons, reasons.map((r) => byReason[r]), BROWN, terms.length)}
          </div>
        )}
      </div>
    </div>
  );
};

const RecordsHirePanel = ({ docs, onEdit, readOnly }) => {
  const hires = docs.hire?.entries || [];

  const byType = {
    Permanent: hires.filter((e) => e.contractType === "Permanent").length,
    Contract: hires.filter((e) => e.contractType === "Contract").length,
    Internship: hires.filter((e) => e.contractType === "Internship").length,
  };
  const types = Object.keys(byType).filter((t) => byType[t] > 0);

  const pie = (labels, values, colors, total) => (
    <div style={{ height: "230px" }}>
      <Pie data={{ labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] }}
        options={{ responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: T.body, font: { size: 11 }, usePointStyle: true, boxWidth: 8 } },
            datalabels: { color: "#fff", font: { weight: "bold", size: 12 }, formatter: (v) => (v > 0 ? v : "") },
            tooltip: { backgroundColor: T.ink, padding: 10, cornerRadius: 8,
              callbacks: { label: (c) => `${c.label}: ${c.raw} (${total ? ((c.raw / total) * 100).toFixed(1) : 0}%)` } },
          } }}
        plugins={[ChartDataLabels]} />
    </div>
  );

  const table = (headers, rows, empty) => (
    <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", minWidth: "460px" }}>
          <thead><tr>{headers.map((h) => <th key={h} style={{ ...panelTh, textAlign: "left" }}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={headers.length} style={{ padding: "26px 16px", textAlign: "center", color: T.muted, fontSize: "13.5px" }}>{empty}</td></tr>
            ) : rows}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={cardS}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: T.accent }}>New Hire Records</div>
          <div style={{ fontSize: "12.5px", color: T.muted }}>
            {hires.length} hires · {byType.Permanent} permanent, {byType.Contract} contract, {byType.Internship} internship
          </div>
        </div>
        {!readOnly && <button onClick={onEdit} style={{ ...btnGhost, padding: "7px 12px", fontSize: "12.5px" }}><Pencil size={13} /> Edit records</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "18px", alignItems: "start" }}>
        {table(["Employee", "Started", "Contract", "Ends"],
          hires.map((e, i) => (
            <tr key={e.id || i} style={{ background: i % 2 ? T.panel : T.bg }}>
              <td style={{ padding: "9px 12px", fontSize: "13.5px", color: T.ink, borderBottom: `1px solid ${T.lineSoft}` }}>{e.name}</td>
              <td style={{ padding: "9px 12px", fontSize: "13px", color: T.body, borderBottom: `1px solid ${T.lineSoft}` }}>{e.dateStarted}</td>
              <td style={{ padding: "9px 12px", borderBottom: `1px solid ${T.lineSoft}` }}>
                <span style={{ fontSize: "11.5px", fontWeight: 600, padding: "3px 9px", borderRadius: "999px", background: T.raised, color: T.body }}>{e.contractType}</span>
              </td>
              <td style={{ padding: "9px 12px", fontSize: "13px", color: T.body, borderBottom: `1px solid ${T.lineSoft}` }}>{e.endDate || "—"}</td>
            </tr>
          )), "No new hire records yet.")}
        {types.length > 0 && (
          <div>
            <div style={{ fontSize: "12.5px", fontWeight: 600, color: T.accent, marginBottom: "8px" }}>Hires by contract type</div>
            {pie(types, types.map((t) => byType[t]), [T.green, T.amber, "#6d28d9"], hires.length)}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Records editor — the register-style data the KPI wizard can't hold ──── */
const REASONS = ["Performance","Resignation","Redundancy","Misconduct","Retirement","Other"];
const CONTRACT_TYPES = ["Permanent","Contract","Internship"];

const RecordsModal = ({ mode, docs, onClose, onSave }) => {
  const [employees, setEmployees] = useState(() => [...(docs.track?.employees || [])]);
  const [terms, setTerms] = useState(() => [...(docs.term?.entries || [])]);
  const [hires, setHires] = useState(() => [...(docs.hire?.entries || [])]);
  const [saving, setSaving] = useState(false);
  const [newTerm, setNewTerm] = useState({ name: "", dateStarted: "", dateEnded: "", reason: "", customReason: "" });
  const [newHire, setNewHire] = useState({ name: "", dateStarted: "", contractType: "Permanent", endDate: "" });
  const [exec, setExec] = useState(() => ({ ...(docs.exec?.executionData || {}) }));

  const title = mode === "tracking" ? "Employee development tracking"
    : mode === "capacityLoad" ? "Founder Operational Load"
    : mode === "capacitySpan" ? "Average Span of Control"
    : mode === "recordsTerm" ? "Termination Records"
    : mode === "recordsHire" ? "New Hire Records"
    : "People records";

  const commit = async () => {
    setSaving(true);
    if (mode === "tracking") await onSave("track", { employees });
    if (mode === "capacityLoad") await onSave("exec", { executionData: { ...docs.exec?.executionData, founderLoad: exec.founderLoad } });
    if (mode === "capacitySpan") await onSave("exec", { executionData: { ...docs.exec?.executionData, spanOfControl: exec.spanOfControl } });
    if (mode === "recordsTerm") await onSave("term", { entries: terms });
    if (mode === "recordsHire") await onSave("hire", { entries: hires });
    setSaving(false); onClose();
  };

  const numField = (label, key) => (
    <div key={key}>
      <label style={labelS}>{label}</label>
      <input type="number" min="0" value={exec[key] ?? ""} placeholder="0"
        onChange={(e) => setExec({ ...exec, [key]: e.target.value === "" ? "" : Number(e.target.value) })} style={inputS} />
    </div>
  );

  const capacityEditor = (label, key, min, max) => (
    <div>
      <label style={labelS}>{label}</label>
      <input type="number" min={min} max={max} value={exec[key] ?? ""} placeholder="—"
        onChange={(e) => setExec({ ...exec, [key]: e.target.value === "" ? "" : Number(e.target.value) })} style={inputS} />
    </div>
  );

  return (
    <Modal title={title} icon={<Users size={17} />} onClose={onClose} width={860}
      footer={<>
        <button onClick={onClose} style={btnGhost}>Cancel</button>
        <button onClick={commit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save"}</button>
      </>}>

      {mode === "tracking" && (
        <>
          <button onClick={() => setEmployees([...employees, { id: uid(), employee: `Employee ${employees.length + 1}`,
            skillsGap: { date: "", status: "Not Done" }, idp: { date: "", status: "Not Done" },
            midTermReview: { date: "", status: "Not Done" }, annualReview: { date: "", status: "Not Done" } }])}
            style={{ ...btnGhost, marginBottom: "14px" }}><Plus size={13} /> Add employee</button>

          {employees.length === 0 && <div style={{ textAlign: "center", padding: "24px", color: T.muted, fontSize: "13.5px" }}>No employees yet.</div>}

          {employees.map((emp, i) => (
            <div key={emp.id || i} style={{ ...cardS, marginBottom: "12px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
                <input value={emp.employee} placeholder="Employee name"
                  onChange={(e) => { const n = [...employees]; n[i] = { ...n[i], employee: e.target.value }; setEmployees(n); }}
                  style={{ ...inputS, flex: 1, fontWeight: 600 }} />
                <button onClick={() => setEmployees(employees.filter((_, x) => x !== i))}
                  style={{ ...btnGhost, padding: "9px 11px", color: T.red, borderColor: `${T.red}55` }}><Trash2 size={13} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
                {[["skillsGap","Skills gap"],["idp","IDP"],["midTermReview","Mid-term review"],["annualReview","Annual review"]].map(([k, l]) => (
                  <div key={k}>
                    <label style={labelS}>{l}</label>
                    <input type="date" value={emp[k]?.date || ""}
                      onChange={(e) => { const n = [...employees]; n[i] = { ...n[i], [k]: { ...(n[i][k] || {}), date: e.target.value } }; setEmployees(n); }}
                      style={{ ...inputS, marginBottom: "6px" }} />
                    <select value={emp[k]?.status || "Not Done"}
                      onChange={(e) => { const n = [...employees]; n[i] = { ...n[i], [k]: { ...(n[i][k] || {}), status: e.target.value } }; setEmployees(n); }}
                      style={selectS}>
                      <option value="Done">Done</option><option value="Not Done">Not done</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {(mode === "capacityLoad" || mode === "capacitySpan") && (
        <div style={{ ...cardS, background: T.panel, marginBottom: "14px", fontSize: "12.5px", color: T.body }}>
          {mode === "capacityLoad" ? "1 = Low, 2 = Medium, 3 = High, 4 = Critical" : "Number of direct reports per manager"}
        </div>
      )}

      {mode === "capacityLoad" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "12px" }}>
          {Array.from({ length: 12 }, (_, i) => capacityEditor(MONTHS[i], i, 1, 4))}
        </div>
      )}

      {mode === "capacitySpan" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "12px" }}>
          {Array.from({ length: 12 }, (_, i) => capacityEditor(MONTHS[i], i, 0, 20))}
        </div>
      )}

      {mode === "recordsTerm" && (
        <>
          <div style={{ ...cardS, background: T.panel, marginBottom: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", marginBottom: "10px" }}>
              <div><label style={labelS}>Employee</label>
                <input value={newTerm.name} onChange={(e) => setNewTerm({ ...newTerm, name: e.target.value })} style={inputS} /></div>
              <div><label style={labelS}>Started</label>
                <input type="date" value={newTerm.dateStarted} onChange={(e) => setNewTerm({ ...newTerm, dateStarted: e.target.value })} style={inputS} /></div>
              <div><label style={labelS}>Ended</label>
                <input type="date" value={newTerm.dateEnded} onChange={(e) => setNewTerm({ ...newTerm, dateEnded: e.target.value })} style={inputS} /></div>
              <div><label style={labelS}>Reason</label>
                <select value={newTerm.reason} onChange={(e) => setNewTerm({ ...newTerm, reason: e.target.value })} style={selectS}>
                  <option value="">Select…</option>
                  {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select></div>
              {newTerm.reason === "Other" && (
                <div><label style={labelS}>Specify</label>
                  <input value={newTerm.customReason} onChange={(e) => setNewTerm({ ...newTerm, customReason: e.target.value })} style={inputS} /></div>
              )}
            </div>
            <button
              onClick={() => {
                const reason = newTerm.reason === "Other" ? newTerm.customReason.trim() : newTerm.reason;
                if (!newTerm.name.trim() || !reason || !newTerm.dateEnded) return;
                setTerms([...terms, { id: uid(), name: newTerm.name.trim(), dateStarted: newTerm.dateStarted,
                  dateEnded: newTerm.dateEnded, reason, dateAdded: new Date().toISOString() }]);
                setNewTerm({ name: "", dateStarted: "", dateEnded: "", reason: "", customReason: "" });
              }}
              style={{ ...btnGhost, padding: "7px 12px", fontSize: "12.5px" }}><Plus size={13} /> Add termination</button>
          </div>
          {terms.map((e, i) => (
            <div key={e.id || i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px",
              borderBottom: `1px solid ${T.lineSoft}`, fontSize: "13.5px", color: T.body }}>
              <span style={{ flex: 1, color: T.ink }}>{e.name}</span>
              <span style={{ color: T.muted, fontSize: "12.5px" }}>{e.dateEnded}</span>
              <span style={{ fontSize: "11.5px", fontWeight: 600, padding: "3px 9px", borderRadius: "999px", background: T.redBg, color: T.red }}>{e.reason}</span>
              <button onClick={() => setTerms(terms.filter((_, x) => x !== i))}
                style={{ background: "none", border: "none", cursor: "pointer", color: T.red, padding: "4px" }}><Trash2 size={13} /></button>
            </div>
          ))}
        </>
      )}

      {mode === "recordsHire" && (
        <>
          <div style={{ ...cardS, background: T.panel, marginBottom: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", marginBottom: "10px" }}>
              <div><label style={labelS}>Employee</label>
                <input value={newHire.name} onChange={(e) => setNewHire({ ...newHire, name: e.target.value })} style={inputS} /></div>
              <div><label style={labelS}>Started</label>
                <input type="date" value={newHire.dateStarted} onChange={(e) => setNewHire({ ...newHire, dateStarted: e.target.value })} style={inputS} /></div>
              <div><label style={labelS}>Contract type</label>
                <select value={newHire.contractType} onChange={(e) => setNewHire({ ...newHire, contractType: e.target.value })} style={selectS}>
                  {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select></div>
              {newHire.contractType !== "Permanent" && (
                <div><label style={labelS}>Ends</label>
                  <input type="date" value={newHire.endDate} onChange={(e) => setNewHire({ ...newHire, endDate: e.target.value })} style={inputS} /></div>
              )}
            </div>
            <button
              onClick={() => {
                if (!newHire.name.trim() || !newHire.dateStarted) return;
                setHires([...hires, { id: uid(), name: newHire.name.trim(), dateStarted: newHire.dateStarted,
                  contractType: newHire.contractType, endDate: newHire.endDate || null, dateAdded: new Date().toISOString() }]);
                setNewHire({ name: "", dateStarted: "", contractType: "Permanent", endDate: "" });
              }}
              style={{ ...btnGhost, padding: "7px 12px", fontSize: "12.5px" }}><Plus size={13} /> Add hire</button>
          </div>
          {hires.map((e, i) => (
            <div key={e.id || i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px",
              borderBottom: `1px solid ${T.lineSoft}`, fontSize: "13.5px", color: T.body }}>
              <span style={{ flex: 1, color: T.ink }}>{e.name}</span>
              <span style={{ color: T.muted, fontSize: "12.5px" }}>{e.dateStarted}</span>
              <span style={{ fontSize: "11.5px", fontWeight: 600, padding: "3px 9px", borderRadius: "999px", background: T.raised, color: T.body }}>{e.contractType}</span>
              <button onClick={() => setHires(hires.filter((_, x) => x !== i))}
                style={{ background: "none", border: "none", cursor: "pointer", color: T.red, padding: "4px" }}><Trash2 size={13} /></button>
            </div>
          ))}
        </>
      )}
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Main
   ════════════════════════════════════════════════════════════════════════ */
const PREFS_KEY = "peoplePerf.addData.prefs";
const META_DOC = "peopleKpiMeta";

const PeoplePerformance = () => {
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
  const [period, setPeriod] = useState("month");

  const [filters, setFilters] = useState({ category: "all", kpi: "all", units: "all", status: "all" });
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
  const [recordsMode, setRecordsMode] = useState(null);

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

  const loadAll = useCallback(async (uid_) => {
    const out = {};
    const peopleKeys = ["prod","cap","exec","stab","comp","track","term","hire"];
    await Promise.all(peopleKeys.map(async (k) => {
      try {
        const snap = await getDoc(doc(db, "peopleData", `${uid_}${DOC[k]}`));
        if (snap.exists()) out[k] = snap.data();
      } catch (err) { console.error(`Could not load ${k}:`, err); }
    }));
    // Financial docs are read-only here — they only feed the Pull button.
    await Promise.all([["pnl", DOC.pnl], ["bs", DOC.bs]].map(async ([k, id]) => {
      try {
        const snap = await getDoc(doc(db, "financialData", `${uid_}${id}`));
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
        setFyStartMonth(fyStartMonthFromEnd(profile.exists() ? profile.data()?.entityOverview?.financialYearEnd : null));
        const [loaded, metaSnap] = await Promise.all([
          loadAll(user.uid),
          getDoc(doc(db, "peopleData", `${user.uid}_${META_DOC}`)),
        ]);
        setDocs(loaded);
        if (metaSnap.exists()) setMeta({ kpis: {}, custom: [], hiddenTabs: [], ...metaSnap.data() });
      } catch (err) {
        console.error("Error loading people data:", err);
        notify("error", `Could not load your people data: ${errText(err)}`);
      } finally { setLoading(false); }
    })();
  }, [user, loadAll]);

  const persistMeta = async (next) => {
    setMeta(next);
    if (!user?.uid || isInvestorView) return;
    try {
      await setDoc(doc(db, "peopleData", `${user.uid}_${META_DOC}`),
        { ...next, userId: user.uid, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error("Error saving KPI meta:", err);
      notify("error", `Changes could not be saved: ${errText(err)}`);
    }
  };

  /* Writes into a nested path inside one peopleData doc, creating the shape
     as it goes so a first entry doesn't get dropped. */
  const writeDoc = async (src, mutate) => {
    if (!user?.uid || isInvestorView) return;
    const next = JSON.parse(JSON.stringify(docs[src] || {}));
    mutate(next);
    next.userId = user.uid;
    next.lastUpdated = new Date().toISOString();
    setDocs((p) => ({ ...p, [src]: next }));
    try {
      await setDoc(doc(db, "peopleData", `${user.uid}${DOC[src]}`), next, { merge: true });
    } catch (err) {
      console.error(`Error saving ${src}:`, err);
      notify("error", `Could not save: ${errText(err)}`);
    }
  };

  const setAtPath = (root, path, value, { scalar = false, monthIndex = 0 } = {}) => {
    let node = root;
    for (let i = 0; i < path.length - 1; i++) {
      if (node[path[i]] === undefined || node[path[i]] === null) node[path[i]] = {};
      node = node[path[i]];
    }
    const leaf = path[path.length - 1];
    if (scalar) { node[leaf] = value; return; }
    const arr = Array.isArray(node[leaf]) ? [...node[leaf]] : Array(12).fill("");
    while (arr.length < 12) arr.push("");
    arr[monthIndex] = value;
    node[leaf] = arr;
  };

  const saveKpiField = async ({ kpi, which, raw, monthIndex }) => {
    if (kpi.custom) {
      const key = `M:${monthIndex}`;
      const entries = { ...(meta.kpis[kpi.id]?.entries || {}) };
      entries[key] = { ...(entries[key] || {}), [which]: parseNum(raw) };
      await persistMeta({ ...meta, kpis: { ...meta.kpis, [kpi.id]: { ...(meta.kpis[kpi.id] || {}), entries } } });
      return;
    }
    const path = which === "actual" ? kpi.field?.a : kpi.field?.b;
    if (!path) return;
    await writeDoc(kpi.field.src, (d) => setAtPath(d, path, raw, { scalar: !!kpi.field.scalar, monthIndex }));
  };

  /* Revenue per employee, labour cost % and training spend can all be derived
     from what Financial Performance already holds. */
  const pullFromFinancials = async () => {
    const pnl = docs.pnl, bs = docs.bs;
    const arr = (a) => (Array.isArray(a) ? a.map((v) => parseFloat(v) || 0) : Array(12).fill(0));
    const revenue = arr(pnl?.sales), salaries = arr(pnl?.salaries);
    const extra = bs?.balanceSheetData?.assets?.additionalMetrics || {};
    const heads = arr(extra.numberOfEmployees), training = arr(extra.trainingSpend);

    const revPer = revenue.map((r, i) => (heads[i] ? String(Math.round(r / heads[i])) : ""));
    const labPct = revenue.map((r, i) => (r ? (salaries[i] / r * 100).toFixed(2) : ""));
    const trainAmt = training.map((v) => (v ? String(v) : ""));
    const trainPct = training.map((v, i) => (salaries[i] ? (v / salaries[i] * 100).toFixed(2) : ""));

    await writeDoc("prod", (d) => {
      setAtPath(d, ["productivityData","revenuePerEmployee","actual"], "", {});
      d.productivityData.revenuePerEmployee.actual = revPer;
      setAtPath(d, ["productivityData","laborCostPercentage","actual"], "", {});
      d.productivityData.laborCostPercentage.actual = labPct;
    });
    await writeDoc("cap", (d) => {
      setAtPath(d, ["capabilityData","trainingSpendAmount","actual"], "", {});
      d.capabilityData.trainingSpendAmount.actual = trainAmt;
      setAtPath(d, ["capabilityData","trainingSpendPercentage","actual"], "", {});
      d.capabilityData.trainingSpendPercentage.actual = trainPct;
    });
    notify("success", "Pulled revenue, labour cost and training figures from Financial Performance.");
  };

  const saveRecords = async (src, payload) => writeDoc(src, (d) => Object.assign(d, payload));

  /* ─── Assemble tabs and hydrate every KPI with a financial year ─────────── */
  const tabs = useMemo(() => {
    const withCustom = TAB_DEFS.map((tab) => {
      const cats = tab.categories.map((c) => ({ ...c, kpis: [...(c.kpis || [])] }));
      (meta.custom || []).filter((c) => c.tabId === tab.id).forEach((c) => {
        const kpi = K({ ...c, actual: () => null });
        kpi.custom = true; kpi.field = { src: "custom" };
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
              const saved = meta.kpis[kpi.id]?.entries?.[`M:${m.month}`];
              entries[m.key] = { actual: saved?.actual ?? null, budget: saved?.budget ?? null };
            } else {
              const ctx = buildContext(docs, m.month);
              const b = kpi.budget ? kpi.budget(ctx) : null;
              entries[m.key] = {
                actual: kpi.actual ? kpi.actual(ctx) : null,
                // Fall back to the published benchmark so a KPI without a
                // captured target still says something.
                budget: b !== null && b !== undefined ? b : kpi.benchmark,
              };
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

  const updateKpiMeta = (kpiId, patch) =>
    persistMeta({ ...meta, kpis: { ...meta.kpis, [kpiId]: { ...(meta.kpis[kpiId] || {}), ...patch } } });

  /* A KPI's target is "Set" when someone captured one, "Benchmark" when the
     published figure is standing in for it. */
  const targetSource = (kpi, period) => {
    const months = fyMonths(fy.startYear, fy.startMonth);
    const anyCaptured = months.some((m) => {
      if (kpi.custom) return meta.kpis[kpi.id]?.entries?.[`M:${m.month}`]?.budget != null;
      const ctx = buildContext(docs, m.month);
      const b = kpi.budget ? kpi.budget(ctx) : null;
      return b !== null && b !== undefined;
    });
    return anyCaptured ? "Set" : kpi.benchmark !== null ? "Benchmark" : "None";
  };

  const allRows = useMemo(() => {
    if (!activeTab) return [];
    const rows = [];
    activeTab.categories.forEach((cat) => {
      (cat.kpis || []).forEach((kpi) => rows.push({
        kpi, categoryName: cat.name, tabName: activeTab.name,
        status: getStatus(kpi, period, fy), variance: getVariance(kpi, period, fy),
        values: periodValues(kpi, period, fy), source: targetSource(kpi, period),
      }));
    });
    return rows;
  }, [activeTab, period, fy, docs, meta]); // eslint-disable-line

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
  const clearFilters = () => { setFilters({ category: "all", kpi: "all", units: "all", status: "all" }); setSortConfig({ key: null, direction: "asc" }); };

  const downloadCSV = () => {
    const p = PERIOD_PREFIX[period];
    const lines = [["Section","Category","KPI","Units", `${p} Target`, `${p} Actual`, `${p} Variance`, "Status"]];
    tabs.forEach((tab) => tab.categories.forEach((cat) => (cat.kpis || []).forEach((kpi) => {
      const v = periodValues(kpi, period, fy);
      lines.push([tab.name, cat.name, `"${kpi.name}"`, kpi.units,
        v.budget ?? "", v.actual ?? "", getVariance(kpi, period, fy) ?? "", getStatus(kpi, period, fy).label]);
    })));
    const blob = new Blob([lines.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `people-performance-${period}-FY${fyLabel(fy.startYear, fy.startMonth).replace("/","-")}.csv`; a.click();
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
    return <div style={{ padding: "80px", textAlign: "center", color: T.body, fontSize: "14px" }}>Loading people performance…</div>;
  }

  const panels = (activeTab?.categories || []).map((c) => c.panel).filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", padding: "28px", boxSizing: "border-box", background: T.bg, color: T.body }}>
      {isInvestorView && (
        <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderLeft: `3px solid ${T.accent}`, padding: "13px 18px",
          borderRadius: "10px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "10px", color: T.accent, fontWeight: 500, fontSize: "14px" }}>
            <Eye size={15} />
            {viewOrigin === "catalyst" ? "Catalyst view" : viewOrigin === "cmf" ? "Facilitator view" : "Investor view"}: {viewingSMEName}'s People Performance
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
        <h1 style={{ color: T.accent, fontSize: "27px", fontWeight: 650, margin: 0, letterSpacing: "-0.5px" }}>People Performance Summary</h1>
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
              <li>Tracks Target, Actual and Variance for every people KPI</li>
              <li>Falls back to published benchmarks where you haven't set a target</li>
              <li>Keeps the registers — development, terminations, hires — alongside</li>
              <li>Raises actions straight into your governance meetings</li>
            </ul>
          </div>
          <div>
            <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "10px", fontSize: "14.5px", fontWeight: 600 }}>What it doesn't do</h3>
            <ul style={{ color: T.body, fontSize: "13.5px", lineHeight: 1.75, margin: 0, paddingLeft: "18px" }}>
              <li>Payroll, leave or attendance processing</li>
              <li>Performance review administration</li>
              <li>Recruitment and onboarding workflows</li>
              <li>Demographic reporting — that sits under ESG Impact</li>
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
          <button onClick={() => setManageTabs(true)} title="Hide or show a section"
            style={{ ...btnQuiet, marginLeft: "auto", marginBottom: "4px", padding: "6px 12px", fontSize: "12.5px", color: T.muted }}>
            <Settings2 size={13} /> Sections
          </button>
        )}
      </div>

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
            <ClipboardList size={14} /> Performance Overview <ExternalLink size={11} />
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
          Showing {PERIOD_PREFIX[period].toLowerCase()} target, actual and variance
        </span>
      </div>

      {allRows.length > 0 && (
        <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "12px", overflow: "hidden", background: T.bg, marginBottom: "22px" }}>
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
                      {cell("budget", <span style={{ color: T.body, fontVariantNumeric: "tabular-nums" }}>{fmtValue(values.budget, kpi, { bare: true })}</span>)}
                      {cell("actual", <span style={{ fontWeight: 700, color: T.ink, fontVariantNumeric: "tabular-nums" }}>{fmtValue(values.actual, kpi, { bare: true })}</span>)}
                      {cell("variance", variance === null || kpi.options
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
            <span>{activeTab?.categories.length} categories · a "Benchmark" target is the published figure, not one you set</span>
            <span style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><CheckCircle2 size={13} color={T.green} /> On target</span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><AlertTriangle size={13} color={T.amber} /> Needs attention</span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><XCircle size={13} color={T.red} /> Critical</span>
            </span>
          </div>
        </div>
      )}

      {/* Panels */}
      {panels.includes("tracking") && (
        <div style={{ marginBottom: "20px" }}>
          <TrackingPanel docs={docs} readOnly={isInvestorView} onEdit={() => setRecordsMode("tracking")} />
        </div>
      )}

      {panels.includes("capacityLoad") && (
        <div style={{ marginBottom: "20px" }}>
          <CapacityLoadPanel docs={docs} fy={fy} readOnly={isInvestorView} onEdit={() => setRecordsMode("capacityLoad")} />
        </div>
      )}

      {panels.includes("capacitySpan") && (
        <div style={{ marginBottom: "20px" }}>
          <CapacitySpanPanel docs={docs} fy={fy} readOnly={isInvestorView} onEdit={() => setRecordsMode("capacitySpan")} />
        </div>
      )}

      {panels.includes("recordsTerm") && (
        <div style={{ marginBottom: "20px" }}>
          <RecordsTermPanel docs={docs} readOnly={isInvestorView} onEdit={() => setRecordsMode("recordsTerm")} />
        </div>
      )}

      {panels.includes("recordsHire") && (
        <div style={{ marginBottom: "20px" }}>
          <RecordsHirePanel docs={docs} readOnly={isInvestorView} onEdit={() => setRecordsMode("recordsHire")} />
        </div>
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

      {recordsMode && <RecordsModal mode={recordsMode} docs={docs} onClose={() => setRecordsMode(null)}
        onSave={async (src, payload) => { await saveRecords(src, payload); notify("success", "Records saved."); }} />}

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
                  <div style={{ fontSize: "12.5px", color: T.muted }}>{t.categories.length} categories · {count} KPIs</div>
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
            Sections are built in, so they hide rather than delete — the underlying people data is shared with the rest of the platform.
          </p>
        </Modal>
      )}

      {addFlow === "choose" && <AddChooser onClose={() => setAddFlow(null)} onPick={(k) => setAddFlow(k)} />}

      {addFlow === "data" && <AddDataWizard tabs={tabs} fy={fy} docs={docs} currentTabId={activeTabId}
        prefs={dataPrefs} onSavePrefs={savePrefs} onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
        onSaveField={saveKpiField} onPullFinancials={pullFromFinancials} />}

      {addFlow === "kpi" && <AddKpiWizard tabs={tabs} currentTabId={activeTabId}
        onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
        onSave={async (kpi) => { await persistMeta({ ...meta, custom: [...(meta.custom || []), kpi] }); notify("success", "KPI created."); }} />}
    </div>
  );
};

export default PeoplePerformance;