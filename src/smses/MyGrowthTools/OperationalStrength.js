"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Chart } from "react-chartjs-2";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  Eye, LineChart as LineChartIcon, Lightbulb, Plus, StickyNote, X, Save, Pencil, Info,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
  CheckCircle2, AlertTriangle, XCircle, ClipboardList, Download, RefreshCw, Columns3,
  ExternalLink, Square, CheckSquare, ArrowLeft, Calendar, SlidersHorizontal, Trash2,
  Database, Sparkles, Sigma, Settings2, EyeOff, Palette, Check,
  FileText, Printer, FileSpreadsheet,
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler, BarController, LineController, ScatterController,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, BarController, LineController, ScatterController);

const functions = getFunctions();

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
const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Quarterly"];
const CAPTURE_FREQUENCIES = ["Daily", "Weekly", "Monthly"];

/* ─── Expanded period set (mirrors Financial Performance) ───────────────── */
const PERIODS = [
  {key:"custom", label:"Selected dates"},
  { key: "last_week",    label: "Last week" },
  { key: "this_week",    label: "This week" },
  { key: "last_month",   label: "Last month" },
  { key: "this_month",   label: "This month" },
  { key: "last_quarter", label: "Last quarter" },
  { key: "this_quarter", label: "This quarter" },
  { key: "last_year",    label: "Last year" },
  { key: "this_year",    label: "This year" },
];
const PERIOD_LABEL = Object.fromEntries(PERIODS.map((p) => [p.key, p.label]));
const PERIOD_PREFIX = { custom:"Selected dates",
  last_week: "Last week", this_week: "This week",
  last_month: "Last month", this_month: "This month",
  last_quarter: "Last quarter", this_quarter: "This quarter",
  last_year: "Last year", this_year: "This year",
};

/* ─── Date helpers ──────────────────────────────────────────────────────── */
const startOfWeek = (d) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  x.setDate(x.getDate() + diff);
  return x;
};
const weekKeyOf = (d) => {
  const s = startOfWeek(d);
  return `W:${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}-${String(s.getDate()).padStart(2,"0")}`;
};
const dayKeyOf = (d) => `D:${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const monthStart = (y, m) => new Date(y, m, 1);
const monthEnd = (y, m) => new Date(y, m + 1, 0, 23, 59, 59, 999);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };

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

const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const weekRangeLabel = (s, e) => `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]}`;

const fyWeeks = (sy, sm) => {
  const start = new Date(sy, sm, 1), end = new Date(sy + 1, sm, 0);
  const cur = new Date(start);
  cur.setDate(cur.getDate() - ((cur.getDay() + 6) % 7));
  const out = []; let n = 1;
  while (cur <= end) {
    const wEnd = new Date(cur); wEnd.setDate(wEnd.getDate() + 6);
    out.push({ key: `W:${isoDate(cur)}`, label: weekRangeLabel(cur, wEnd), short: `W${n}`,
      start: new Date(cur), end: wEnd, index: n - 1 });
    cur.setDate(cur.getDate() + 7); n++;
  }
  return out;
};

const daysInMonth = (year, month) =>
  Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return { key: `D:${isoDate(d)}`, label: `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      short: `${d.getDate()} ${MONTHS[d.getMonth()]}`, date: d, index: i };
  });

const currentWeekKey = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return `W:${isoDate(d)}`; };
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
  let n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  const sign = signed && n > 0 ? "+" : "";
  if (kpi?.units === "%") {
    if (kpi.percentFormat === "fraction") n *= 100;
    return `${sign}${trimNum(n)}${bare ? "" : "%"}`;
  }
  if (kpi?.units === "R") {
    const dp = Math.abs(n) >= 1000 ? 0 : 2;
    const body = n.toLocaleString(LOCALE, { minimumFractionDigits: dp, maximumFractionDigits: dp });
    return bare ? `${sign}${body}` : `${sign}R ${body}`;
  }
  const suffix = !bare && kpi?.units && !["#","%","R"].includes(kpi.units) ? ` ${kpi.units}` : "";
  return `${sign}${trimNum(n)}${suffix}`;
};

const parseNum = (v) => { if (v === null || v === undefined || (typeof v === "string" && !v.trim())) return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
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

/* ─── KPI model ─────────────────────────────────────────────────────────── */
const CHART_VERSION = 4;
const DEFAULT_CHART = {
  v: CHART_VERSION,
  actualType: "bar", budgetType: "line", varianceType: "scatter",
  actualColor: "#1e40af", budgetColor: "#4a352f", axisMode: "both",
};

const mkKpi = (o) => ({
  id: uid(), name: o.name, units: o.units, frequency: o.frequency || "Monthly",
  direction: o.direction || "higher", aggregate: o.aggregate || "avg",
  percentFormat: o.percentFormat || "whole",
  meaning: o.meaning || "", measured: o.measured || "",
  notes: "", periodNotes: {}, chart: { ...DEFAULT_CHART }, entries: o.entries || {},
});

const seedEntries = () => ({});

const buildDefaultStructure = (sy, sm) => [
  { id: "supply-chain", name: "Supply Chain", notes: "", hidden: false, subCategories: [
    { name: "Supplier Dependency", kpis: [
      mkKpi({ name: "Top 3 Supplier Spend", units: "%", frequency: "Monthly", direction: "lower", aggregate: "avg",
        meaning: "How much of your buying sits with your three biggest suppliers. The higher it is, the more exposed you are if one of them fails.",
        measured: "=SUMPRODUCT(LARGE(Spend,{1;2;3})) / SUM(Spend) * 100\n\nWhere Spend = the supplier spend column for the period. Format as Percentage (0 decimals).",
        entries: seedEntries(sy, sm, 70, 79, 3, "avg") }),
      mkKpi({ name: "Single Source Flags", units: "#", frequency: "Monthly", direction: "lower", aggregate: "sum",
        meaning: "How many critical inputs you can only buy from one supplier.",
        measured: "=COUNTIF(SupplierCount, 1)\n\nWhere SupplierCount = approved suppliers per item on the item register.",
        entries: seedEntries(sy, sm, 0, 1, 1, "sum") }),
      mkKpi({ name: "Critical Supplier Count", units: "#", frequency: "Monthly", direction: "lower", aggregate: "avg",
        meaning: "How many suppliers would stop or seriously disrupt delivery if they failed.",
        measured: "=COUNTIF(CriticalFlag, \"Yes\")\n\nWhere CriticalFlag = the Yes/No column on the supplier register.",
        entries: seedEntries(sy, sm, 5, 16, 2, "avg") }),
    ]},
    { name: "Continuity Risk", kpis: [
      mkKpi({ name: "Lead Time Variance", units: "days", frequency: "Weekly", direction: "lower", aggregate: "avg",
        meaning: "How far suppliers drift from the delivery dates they quote you.",
        measured: "=AVERAGE(ActualLeadDays - QuotedLeadDays)\n\nArray-entered, or =AVERAGE(Variance) where Variance = ActualLeadDays − QuotedLeadDays per line.",
        entries: seedEntries(sy, sm, 2, 2.3, 0.5, "avg") }),
      mkKpi({ name: "Stock Cover Days", units: "days", frequency: "Weekly", direction: "higher", aggregate: "avg",
        meaning: "How many days of demand your current stock can serve before you run out.",
        measured: "=ClosingStock / AVERAGE(DailyUsage)\n\nWhere DailyUsage = units consumed per day over the period.",
        entries: seedEntries(sy, sm, 30, 27, 4, "avg") }),
      mkKpi({ name: "Disruption Risk Index", units: "index", frequency: "Monthly", direction: "lower", aggregate: "avg",
        meaning: "A single 0–100 score combining supplier, logistics and geographic exposure.",
        measured: "=SUMPRODUCT(SubScores, Weights) / SUM(Weights)\n\nWhere SubScores = concentration, lead-time and geography scores (0–100).",
        entries: seedEntries(sy, sm, 20, 23, 3, "avg") }),
    ]},
  ]},
  { id: "delivery", name: "Delivery", notes: "", hidden: false, subCategories: [
    { name: "Productivity", kpis: [
      mkKpi({ name: "Production Volume", units: "units", frequency: "Weekly", direction: "higher", aggregate: "sum",
        meaning: "Total good output produced and accepted in the period.",
        measured: "=SUMIFS(UnitsProduced, QCResult, \"Pass\", Date, \">=\"&PeriodStart, Date, \"<=\"&PeriodEnd)",
        entries: seedEntries(sy, sm, 10000, 12800, 900, "sum") }),
      mkKpi({ name: "Availability", units: "%", frequency: "Weekly", direction: "higher", aggregate: "avg",
        meaning: "How much of your planned running time the equipment was actually available.",
        measured: "=(SUM(PlannedTime) - SUM(UnplannedDowntime)) / SUM(PlannedTime) * 100",
        entries: seedEntries(sy, sm, 95, 93, 2, "avg") }),
      mkKpi({ name: "Utilization", units: "%", frequency: "Weekly", direction: "higher", aggregate: "avg",
        meaning: "How much of the capacity you had available you actually used.",
        measured: "=SUM(RunTime) / SUM(AvailableTime) * 100",
        entries: seedEntries(sy, sm, 85, 85, 3, "avg") }),
      mkKpi({ name: "Unit Cost", units: "R", frequency: "Monthly", direction: "lower", aggregate: "avg",
        meaning: "What it costs you, all in, to make one sellable unit.",
        measured: "=SUM(ProductionCost) / SUMIFS(Units, QCResult, \"Pass\")\n\nFormat as Currency (R, 2 decimals).",
        entries: seedEntries(sy, sm, 50, 41, 4, "avg") }),
    ]},
    { name: "Reliability", kpis: [
      mkKpi({ name: "On-time Delivery", units: "%", frequency: "Weekly", direction: "higher", aggregate: "avg",
        meaning: "The share of orders that reached the customer on or before the date you promised.",
        measured: "=COUNTIFS(DeliveredDate, \"<=\"&PromisedDate) / COUNTA(DeliveredDate) * 100",
        entries: seedEntries(sy, sm, 98, 96, 2, "avg") }),
      mkKpi({ name: "Rework Rate", units: "%", frequency: "Weekly", direction: "lower", aggregate: "avg",
        meaning: "How much of what you make has to be fixed before it can ship.",
        measured: "=SUM(UnitsReworked) / SUM(UnitsProduced) * 100",
        entries: seedEntries(sy, sm, 2, 1.1, 0.4, "avg") }),
      mkKpi({ name: "Defect Rate", units: "%", frequency: "Weekly", direction: "lower", aggregate: "avg",
        meaning: "How much of what you make is rejected at inspection or comes back from customers.",
        measured: "=(SUMIFS(Units, QCResult, \"Fail\") + SUM(CustomerReturns)) / SUM(UnitsProduced) * 100",
        entries: seedEntries(sy, sm, 1, 0.4, 0.2, "avg") }),
    ]},
  ]},
  { id: "safety", name: "Safety", notes: "", hidden: false, subCategories: [
    { name: "Safety Risk", kpis: [
      mkKpi({ name: "Safety Incidents", units: "#", frequency: "Weekly", direction: "lower", aggregate: "sum",
        meaning: "Recordable incidents involving staff, contractors or visitors.",
        measured: "=COUNTIFS(IncidentDate, \">=\"&PeriodStart, IncidentDate, \"<=\"&PeriodEnd)",
        entries: seedEntries(sy, sm, 0, 0.4, 0.4, "sum") }),
      mkKpi({ name: "Open Safety Actions", units: "#", frequency: "Weekly", direction: "lower", aggregate: "avg",
        meaning: "Corrective actions from incidents or inspections that are still outstanding.",
        measured: "=COUNTIF(ActionStatus, \"<>Closed\")",
        entries: seedEntries(sy, sm, 5, 2, 1, "avg") }),
      mkKpi({ name: "Compliance Status", units: "%", frequency: "Monthly", direction: "higher", aggregate: "avg",
        meaning: "The share of mandatory safety requirements you currently meet.",
        measured: "=COUNTIF(RequirementMet, \"Yes\") / COUNTA(RequirementMet) * 100",
        entries: seedEntries(sy, sm, 100, 99, 1, "avg") }),
    ]},
    { name: "Regulatory Compliance", kpis: [
      mkKpi({ name: "Regulatory Gaps", units: "#", frequency: "Monthly", direction: "lower", aggregate: "sum",
        meaning: "Known areas where you are not compliant with the regulation that applies to you.",
        measured: "=COUNTIFS(GapStatus, \"Open\")",
        entries: seedEntries(sy, sm, 0, 0.3, 0.3, "sum") }),
      mkKpi({ name: "Audit Findings", units: "#", frequency: "Quarterly", direction: "lower", aggregate: "sum",
        meaning: "Findings raised at your last internal or external audit that are still open.",
        measured: "=COUNTIFS(FindingStatus, \"<>Closed\", AuditDate, \">=\"&PeriodStart)",
        entries: seedEntries(sy, sm, 3, 0.6, 0.5, "sum") }),
      mkKpi({ name: "Certification Status", units: "%", frequency: "Monthly", direction: "higher", aggregate: "avg",
        meaning: "The share of certifications you need that are current and valid today.",
        measured: "=COUNTIFS(ExpiryDate, \">\"&TODAY()) / COUNTA(CertificateName) * 100",
        entries: seedEntries(sy, sm, 100, 99, 1, "avg") }),
    ]},
  ]},
];

/* ─── Period resolution ─────────────────────────────────────────────────── */
const localDate = value => { const [y,m,d=1] = String(value).split("-").map(Number); return new Date(y,m-1,d); };
const rangeKeys = (frequency, from, to) => {
  if (frequency === "Quarterly") {
    const keys = [];
    for (let d = new Date(from.getFullYear(), Math.floor(from.getMonth()/3)*3, 1); d <= to; d = new Date(d.getFullYear(), d.getMonth()+3, 1)) {
      if (d >= startOfDay(from) && startOfDay(monthEnd(d.getFullYear(), d.getMonth()+2)) <= startOfDay(to)) keys.push(`Q:${isoDate(d).slice(0,7)}`);
    }
    return keys;
  }
  const monthly = !["Daily","Weekly"].includes(frequency), weekly = frequency === "Weekly";
  const keys=[];
  for(let d=monthly?monthStart(from.getFullYear(),from.getMonth()):weekly?startOfWeek(from):startOfDay(from); d<=to; d=monthly?new Date(d.getFullYear(),d.getMonth()+1,1):addDays(d,weekly?7:1)) {
    const end=monthly?monthEnd(d.getFullYear(),d.getMonth()):weekly?addDays(d,6):d;
    if(d>=startOfDay(from) && startOfDay(end)<=startOfDay(to)) keys.push(monthly?`M:${isoDate(d).slice(0,7)}`:weekly?weekKeyOf(d):dayKeyOf(d));
  }
  return keys;
};
const rangeRows = (kpi,from,to) => rangeKeys(kpi.frequency,from,to).map(key=>({key,label:key.slice(2),actual:parseNum(kpi.entries?.[key]?.actual),budget:parseNum(kpi.entries?.[key]?.budget)}));
const rollupRange = (kpi,from,to) => {
  const rows=rangeRows(kpi,from,to);
  return {actual:rollUp(rows.map(r=>r.actual),kpi.aggregate),budget:rollUp(rows.map(r=>r.budget),kpi.aggregate)};
};
const resolveMonth = (kpi,year,month) => rollupRange(kpi,monthStart(year,month),monthEnd(year,month));

/* Period → [from, to] window */
const periodWindow = (period, fy) => {
  const now = new Date();
  const today = startOfDay(now);

  switch (period) {
    case "custom": return fy.range ? [localDate(fy.range.from),localDate(fy.range.to)] : [new Date(fy.startYear,fy.startMonth,1),monthEnd(fy.startYear,fy.startMonth+11)];
    case "this_week": {
      const s = startOfWeek(now);
      return [s, addDays(s, 6)];
    }
    case "last_week": {
      const s = addDays(startOfWeek(now), -7);
      return [s, addDays(s, 6)];
    }
    case "this_month":
      return [monthStart(now.getFullYear(), now.getMonth()), monthEnd(now.getFullYear(), now.getMonth())];
    case "last_month": {
      const d = addMonths(monthStart(now.getFullYear(),now.getMonth()), -1);
      return [monthStart(d.getFullYear(), d.getMonth()), monthEnd(d.getFullYear(), d.getMonth())];
    }
    case "this_quarter": {
      const q = Math.floor(now.getMonth() / 3);
      const s = new Date(now.getFullYear(), q * 3, 1);
      const e = monthEnd(now.getFullYear(), q * 3 + 2);
      return [s, e];
    }
    case "last_quarter": {
      const q = Math.floor(now.getMonth() / 3) - 1;
      const y = q < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const qq = ((q % 4) + 4) % 4;
      const s = new Date(y, qq * 3, 1);
      const e = monthEnd(y, qq * 3 + 2);
      return [s, e];
    }
    case "this_year": {
      const sy = fy.startYear;
      const sm = fy.startMonth;
      const s = new Date(sy, sm, 1);
      const e = monthEnd(sy, sm + 11);
      return [s, e];
    }
    case "last_year": {
      const sy = fy.startYear - 1;
      const sm = fy.startMonth;
      const s = new Date(sy, sm, 1);
      const e = monthEnd(sy, sm + 11);
      return [s, e];
    }
    default:
      return [monthStart(today.getFullYear(), today.getMonth()), monthEnd(today.getFullYear(), today.getMonth())];
  }
};

const periodValues = (kpi,period,fy) => rollupRange(kpi,...periodWindow(period,fy));

/* ─── Status ────────────────────────────────────────────────────────────── */
const S = {
  green: { key: "green", label: "On budget", color: T.green, bg: T.greenBg },
  amber: { key: "amber", label: "Needs attention", color: T.amber, bg: T.amberBg },
  red: { key: "red", label: "Critical", color: T.red, bg: T.redBg },
  none: { key: "none", label: "No data", color: T.faint, bg: T.raised },
};
const statusFromPair = (kpi, budget, actual) => {
  const b = parseNum(budget), a = parseNum(actual);
  if (!Number.isFinite(b) || !Number.isFinite(a)) return S.none;
  if (kpi.direction === "match") {
    if (b === 0) return Math.abs(a) < 0.001 ? S.green : Math.abs(a) <= 1 ? S.amber : S.red;
    const drift = Math.abs(a - b) / Math.abs(b);
    return drift <= 0.02 ? S.green : drift <= 0.10 ? S.amber : S.red;
  }
  if (b === 0) {
    if (kpi.direction === "higher") return S.none;
    return a <= 0 ? S.green : a <= 1 ? S.amber : S.red;
  }
  const ratio = 1 + (kpi.direction === "higher" ? a-b : b-a) / Math.abs(b);
  return ratio >= 0.98 ? S.green : ratio >= 0.85 ? S.amber : S.red;
};
const getStatus = (kpi, period, fy) => {
  const { budget, actual } = periodValues(kpi, period, fy);
  return statusFromPair(kpi, budget, actual);
};
const getVariance = (kpi, period, fy) => {
  const { budget, actual } = periodValues(kpi, period, fy);
  const b = parseNum(budget), a = parseNum(actual);
  return Number.isFinite(b) && Number.isFinite(a) ? a - b : null;
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

/* ─── Columns ───────────────────────────────────────────────────────────── */
const COLUMN_DEFS = {
  category:  { label: "Category", width: 168, tip: "The sub-category this KPI sits under.", filter: true, sort: true, hideable: true },
  kpi:       { label: "KPI", width: 258, tip: "The metric being tracked. Click the eye to see what it means and how it is measured.", filter: true, sort: true, hideable: false },
  units:     { label: "Units", width: 90, align: "center", tip: "The unit every figure in this row is expressed in.", filter: true, sort: true, hideable: true },
  frequency: { label: "Frequency", width: 126, align: "center", tip: "How often this KPI is captured.", filter: true, sort: true, hideable: true },
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

const btnBase = { minHeight: "40px", boxSizing: "border-box", justifyContent: "center", whiteSpace: "nowrap", lineHeight: 1.2, padding: "9px 16px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "inherit" };
const btnPrimary = { ...btnBase, background: T.accent, color: "#fff", border: `1px solid ${T.accent}`, fontWeight: 600 };
const btnGhost = { ...btnBase, background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}` };
const btnQuiet = { ...btnBase, background: "transparent", color: T.accent, border: "1px solid transparent" };
const inputS = { width: "100%", padding: "9px 11px", border: `1px solid ${T.lineStrong}`, borderRadius: "8px",
  fontSize: "13.5px", fontFamily: "inherit", boxSizing: "border-box", color: T.ink, background: T.bg, outline: "none" };
const selectS = { ...inputS, cursor: "pointer", appearance: "auto", WebkitAppearance: "auto" };
const labelS = { display: "block", fontSize: "12.5px", fontWeight: 600, color: T.accent, marginBottom: "5px" };
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "14px 16px" };

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

const moveCategory = (names, from, to) => {
  const next = [...names];
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= next.length || to >= next.length) return next;
  const [name] = next.splice(from, 1);
  next.splice(to, 0, name);
  return next;
};
const CategoryOrderModal = ({ tab, onClose, onSave }) => {
  const [order, setOrder] = useState(() => tab.categories.map(category => category.name));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    setSaving(true); setError("");
    try { await onSave(order); onClose(); }
    catch (err) { setError(`Could not save category order: ${errText(err)}`); }
    finally { setSaving(false); }
  };
  const move = (from, to) => setOrder(previous => moveCategory(previous, from, to));
  return <Modal title="Order categories" subtitle={`${tab.name} · choose the order that works for you`} icon={<ArrowUpDown size={17} />}
    width={600} onClose={() => { if (!saving) onClose(); }}
    footer={<><button onClick={onClose} disabled={saving} style={btnGhost}>Cancel</button>
      <button onClick={save} disabled={saving} style={btnPrimary}><Save size={14} /> {saving ? "Saving…" : "Save order"}</button></>}>
    <p style={{ margin: "0 0 16px", fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
      Move a category with the arrows, or choose its position directly. Your order is saved for this tab and used in the table, data entry screens and spreadsheets.
    </p>
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
      {order.map((name, index) => <li key={name} style={{ ...cardS, padding: "12px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", background: T.raised, color: T.muted, borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{index + 1}</span>
        <span style={{ flex: "1 1 150px", minWidth: 0, fontSize: 13.5, fontWeight: 600, color: T.accent }}>{name}</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <select aria-label={`Position of ${name}`} value={index} disabled={saving} onChange={event => move(index, Number(event.target.value))}
            style={{ ...selectS, width: 72, height: 36, padding: "6px 10px" }}>
            {order.map((_, position) => <option key={position} value={position}>{position + 1}</option>)}
          </select>
          {[{ to: index - 1, label: "up", Icon: ArrowUp }, { to: index + 1, label: "down", Icon: ArrowDown }].map(({ to, label, Icon }) => {
            const disabled = saving || to < 0 || to >= order.length;
            return <button key={label} type="button" aria-label={`Move ${name} ${label}`} disabled={disabled} onClick={() => move(index, to)}
              style={{ ...btnGhost, minHeight: 36, width: 36, padding: 0, opacity: disabled ? 0.35 : 1, cursor: disabled ? "default" : "pointer" }}><Icon size={14} /></button>;
          })}
        </div>
      </li>)}
    </ol>
    {error && <p role="alert" style={{ fontSize: 12, color: T.red, marginBottom: 0 }}>{error}</p>}
  </Modal>;
};

const DateRangeControls = ({ fy, onChange }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("financial");
  const [year, setYear] = useState(fy.startYear);
  const [month, setMonth] = useState(dayKeyOf(new Date()).slice(2, 9));
  const [from, setFrom] = useState(fy.range?.from || dayKeyOf(new Date(fy.startYear, fy.startMonth, 1)).slice(2));
  const [to, setTo] = useState(fy.range?.to || dayKeyOf(monthEnd(fy.startYear, fy.startMonth + 11)).slice(2));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setYear(fy.startYear); }, [fy.startYear]);
  const apply = async () => {
    let a, b;
    if (mode === "custom") { a = localDate(from); b = localDate(to); }
    else if (mode === "month") { a = localDate(month); b = monthEnd(a.getFullYear(), a.getMonth()); }
    else { a = new Date(Number(year), mode === "financial" ? fy.startMonth : 0, 1); b = monthEnd(a.getFullYear(), a.getMonth() + 11); }
    if (!Number.isFinite(+a) || !Number.isFinite(+b) || a > b || a.getFullYear() < 1900 || b.getFullYear() > 9999 || b.getFullYear() - a.getFullYear() > 100) { setError("Choose a valid date range."); return; }
    setBusy(true); setError("");
    try { await onChange({ from: dayKeyOf(a).slice(2), to: dayKeyOf(b).slice(2) }); setOpen(false); }
    catch { setError("Could not apply these dates. Please try again."); }
    finally { setBusy(false); }
  };
  const field = { display: "flex", flexDirection: "column", gap: 6, flex: "1 1 150px", minWidth: 140, maxWidth: 230 };
  const control = { ...inputS, height: 40, boxSizing: "border-box", margin: 0 };
  const caption = fy.period === "custom" && fy.range ? `${fmtDMY(localDate(fy.range.from))} – ${fmtDMY(localDate(fy.range.to))}` : PERIOD_LABEL[fy.period] || `FY ${fyLabel(fy.startYear, fy.startMonth)}`;
  return <div style={{ marginBottom: 12 }}>
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} style={{ ...btnGhost, padding: "8px 12px", gap: 9, height: 38 }}>
      <Calendar size={15} /><span style={{ color: T.muted }}>Dates</span><strong style={{ fontWeight: 600 }}>{caption}</strong><ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : undefined }} />
    </button>
    {open && <div style={{ marginTop: 8, padding: 16, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12 }}>
        <label style={field}><span style={{ ...labelS, margin: 0 }}>View by</span><select aria-label="Date mode" style={{ ...selectS, ...control }} value={mode} onChange={e => setMode(e.target.value)}><option value="financial">Financial year</option><option value="calendar">Calendar year</option><option value="month">Month</option><option value="custom">Custom range</option></select></label>
        {(mode === "financial" || mode === "calendar") && <label style={field}><span style={{ ...labelS, margin: 0 }}>{mode === "financial" ? "Starting year" : "Year"}</span><input aria-label="Year" type="number" min="1900" max="9998" style={control} value={year} onChange={e => setYear(e.target.value)} /></label>}
        {mode === "month" && <label style={field}><span style={{ ...labelS, margin: 0 }}>Month</span><input aria-label="Month" type="month" style={control} value={month} onChange={e => setMonth(e.target.value)} /></label>}
        {mode === "custom" && <><label style={field}><span style={{ ...labelS, margin: 0 }}>From</span><input aria-label="From date" type="date" style={control} value={from} onChange={e => setFrom(e.target.value)} /></label><label style={field}><span style={{ ...labelS, margin: 0 }}>To</span><input aria-label="To date" type="date" min={from} style={control} value={to} onChange={e => setTo(e.target.value)} /></label></>}
        <button type="button" disabled={busy} style={{ ...btnPrimary, height: 40, boxSizing: "border-box", whiteSpace: "nowrap", margin: 0 }} onClick={apply}>{busy ? "Applying…" : "Apply dates"}</button>
        <span title="Monthly and weekly totals require complete periods. Use daily data for partial periods." style={{ display: "inline-flex", alignItems: "center", height: 40, color: T.muted }}><Info size={15} /></span>
      </div>
      {error && <p role="alert" style={{ color: T.red, margin: "10px 0 0", fontSize: 12 }}>{error}</p>}
    </div>}
  </div>;
};

const DIRECTIONS = [
  { value: "higher", label: "Higher is better" },
  { value: "lower", label: "Lower is better" },
  { value: "match", label: "Matching is better" },
];

/* ════════════════════════════════════════════════════════════════════════════
   Report Generator — with native split tables
   ════════════════════════════════════════════════════════════════════════ */

/* Build split rows for a KPI at its native frequency */
const buildSplitRows = (kpi,fy,period=fy.period || "this_year") => ({title:`${kpi.frequency || "Monthly"} split`,rows:rangeRows(kpi,...periodWindow(period,fy))});

const SPREADSHEET_HEADERS=["Category","Subcategory","KPI","Units","Period","Budget","Actual","Frequency","Variance","Variance %"];
const spreadsheetSheets = ({tabs,selectedTabs,fy,period},blank=false) => tabs.filter(c=>selectedTabs[c.id]).map(c=>({name:c.name,rows:[SPREADSHEET_HEADERS,...c.subCategories.flatMap(sub=>sub.kpis.flatMap(k=>rangeRows(k,...periodWindow(period,fy)).map(r=>[c.name,sub.name,k.name,k.units,r.key,blank?null:r.budget,blank?null:r.actual,k.frequency,blank||!Number.isFinite(r.actual)||!Number.isFinite(r.budget)?null:r.actual-r.budget,blank||!Number.isFinite(r.actual)||!Number.isFinite(r.budget)||r.budget===0?null:(r.actual-r.budget)/Math.abs(r.budget)])))]}));
const csvEscape = value => {let s=String(value??"");if(typeof value!=="number" && /^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
const spreadsheetCsv = sheets => "\uFEFF"+[SPREADSHEET_HEADERS,...sheets.flatMap(s=>s.rows.slice(1))].map(r=>r.map(csvEscape).join(",")).join("\r\n");
const downloadBlob = (text,name) => {const url=URL.createObjectURL(new Blob([text],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
const Select = ({children,...props}) => <select {...props} style={{...selectS,...props.style}}>{children}</select>;
const xmlText = value => String(value ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Small uncompressed ZIP writer keeps XLSX export self-contained (no runtime CDN/dependency).
const zipFiles = files => {
  const encoder = new TextEncoder(), parts = [], central = [];
  let offset = 0;
  const crc32 = bytes => {
    let crc = 0xffffffff;
    for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    return (crc ^ 0xffffffff) >>> 0;
  };
  for (const [filename, content] of files) {
    const name = encoder.encode(filename), data = encoder.encode(content), crc = crc32(data);
    const local = new Uint8Array(30 + name.length), l = new DataView(local.buffer);
    l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x800, true);
    l.setUint16(12, 33, true); l.setUint32(14, crc, true); l.setUint32(18, data.length, true); l.setUint32(22, data.length, true); l.setUint16(26, name.length, true); local.set(name, 30);
    const directory = new Uint8Array(46 + name.length), c = new DataView(directory.buffer);
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x800, true);
    c.setUint16(14, 33, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true); directory.set(name, 46);
    parts.push(local, data); central.push(directory); offset += local.length + data.length;
  }
  const end = new Uint8Array(22), e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, central.length, true); e.setUint16(10, central.length, true); e.setUint32(12, central.reduce((n, p) => n + p.length, 0), true); e.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};
const spreadsheetWorkbook = sheets => {
  const ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main", rel = "http://schemas.openxmlformats.org/package/2006/relationships";
  const names = new Set();
  const safeNames = sheets.map((s, i) => {
    const base = (s.name.replace(/[\\/?*\[\]:]/g, " ").replace(/^'+|'+$/g, "").trim() || `Sheet ${i + 1}`).slice(0, 31);
    let name = base, n = 1;
    while (names.has(name.toLowerCase())) { const tail = ` (${++n})`; name = base.slice(0, 31 - tail.length) + tail; }
    names.add(name.toLowerCase()); return name;
  });
  const files = [
    ["[Content_Types].xml", `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`],
    ["_rels/.rels", `<Relationships xmlns="${rel}"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ["xl/workbook.xml", `<workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${safeNames.map((name, i) => `<sheet name="${xmlText(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`],
    ["xl/_rels/workbook.xml.rels", `<Relationships xmlns="${rel}">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ["xl/styles.xml", `<styleSheet xmlns="${ns}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF4A352F"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF0F6FF"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf><xf numFmtId="4" fontId="0" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`],
  ];
  sheets.forEach((sheet, i) => {
    const rows = sheet.rows.map((row, ri) => `<row r="${ri + 1}"${ri === 0 ? ' ht="28" customHeight="1"' : ""}>${row.map((value, ci) => {
      const cell = `${String.fromCharCode(65 + ci)}${ri + 1}`, style = ri === 0 ? 1 : ci === 5 || ci === 6 ? 2 : ci === 8 ? 3 : ci === 9 ? 4 : 0;
      if (ri > 0 && (ci === 8 || ci === 9)) {
        const row = ri + 1;
        const formula = ci === 8 ? `IF(COUNT(F${row}:G${row})<2,"",G${row}-F${row})` : `IF(OR(COUNT(F${row}:G${row})<2,F${row}=0),"",(G${row}-F${row})/ABS(F${row}))`;
        return `<c r="${cell}" s="${style}"><f>${xmlText(formula)}</f></c>`;
      }
      if (value === null || value === undefined || value === "") return `<c r="${cell}" s="${style}"/>`;
      return typeof value === "number" && Number.isFinite(value) ? `<c r="${cell}" s="${style}"><v>${value}</v></c>` : `<c r="${cell}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlText(value)}</t></is></c>`;
    }).join("")}</row>`).join("");
    files.push([`xl/worksheets/sheet${i + 1}.xml`, `<worksheet xmlns="${ns}"><dimension ref="A1:J${sheet.rows.length}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${[24, 32, 34, 12, 28, 18, 18, 16, 18, 18].map((width, ci) => `<col min="${ci + 1}" max="${ci + 1}" width="${width}" customWidth="1"/>`).join("")}</cols><sheetData>${rows}</sheetData><autoFilter ref="A1:J${sheet.rows.length}"/></worksheet>`]);
  });
  return zipFiles(files);
};
const SpreadsheetDownloadModal = ({ structure, activeTabId, fy, period, onClose }) => {
  const [selectedTabs, setSelectedTabs] = useState({ [activeTabId]: true });
  const [blank, setBlank] = useState(false), [format, setFormat] = useState("xlsx");
  const [error, setError] = useState("");
  const tabs=structure.filter(c=>!c.hidden);
  const options = { tabs, selectedTabs, fy, period };
  const download = () => {
    try {
      const sheets = spreadsheetSheets(options, blank);
      if (!sheets.some(s => s.rows.length > 1)) { setError("No data-entry rows in this range. Select a complete month or another section."); return; }
      if (format === "csv") downloadBlob(spreadsheetCsv(sheets), `operational-data-${blank ? "template" : "current"}.csv`);
      else {
        const url = URL.createObjectURL(spreadsheetWorkbook(sheets)), link = document.createElement("a");
        link.href = url; link.download = `operational-data-${blank ? "template" : "current"}.xlsx`;
        document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
      setError("");
    } catch (e) { setError(`Could not download the spreadsheet: ${errText(e)}`); }
  };
  const [from, to] = periodWindow(period, fy);
  return <Modal title="Download spreadsheet" subtitle={`${fmtDMY(from)} – ${fmtDMY(to)}`} icon={<FileSpreadsheet size={18}/>} onClose={onClose} width={600}
    footer={<><button style={btnGhost} onClick={onClose}>Cancel</button><button style={btnPrimary} disabled={!Object.values(selectedTabs).some(Boolean)} onClick={download}><Download size={15}/>Download {format.toUpperCase()}</button></>}>
    <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
      {[[false, "Existing data", "Review or edit your saved figures."], [true, "Blank template", "Fill in Budget and Actual values."]].map(([value, title, description]) => <button key={title} onClick={() => setBlank(value)} aria-pressed={blank === value} style={{ ...cardS, flex: "1 1 210px", textAlign: "left", cursor: "pointer", borderColor: blank === value ? T.accent : T.line, background: blank === value ? T.accentTint : T.bg, fontFamily: "inherit" }}><strong style={{ color: T.ink, display: "block", marginBottom: 5 }}>{title}</strong><span style={{ color: T.muted, fontSize: 12 }}>{description}</span></button>)}
    </div>
    <label style={labelS}>Sections</label><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 8, marginBottom: 20 }}>{tabs.map(tab => <label key={tab.id} style={{ display: "flex", gap: 9, alignItems: "center", fontSize: 13, padding: "8px 0", cursor: "pointer" }}><input type="checkbox" checked={!!selectedTabs[tab.id]} onChange={() => setSelectedTabs(prev => ({ ...prev, [tab.id]: !prev[tab.id] }))}/>{tab.name}</label>)}</div>
    <label style={labelS}>File type</label><Select value={format} onChange={e => setFormat(e.target.value)}><option value="xlsx">Excel workbook (.xlsx) — one sheet per section</option><option value="csv">CSV (.csv) — one combined data sheet</option></Select>
    <p style={{ color: T.muted, fontSize: 12, lineHeight: 1.6, marginBottom: 0 }}>Blue Budget and Actual cells are ready to edit. Excel includes filters, a frozen header and automatic Variance formulas. Leave unknown figures blank; zero is a real value. Variance % in CSV is a decimal ratio. This download contains data-entry rows. Changes made in Excel stay in your downloaded file; enter them in Add Data to save them to the application.</p>
    {error && <p role="alert" style={{ color: T.red, fontSize: 13 }}>{error}</p>}
  </Modal>;
};


const OperationalReportGenerator = ({ structure, fy, period, onClose, userId, userName }) => {
  const [selectedCategories, setSelectedCategories] = useState(() => 
    Object.fromEntries(structure.filter(c => !c.hidden).map((c) => [c.id, true]))
  );
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeBreakdown, setIncludeBreakdown] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [includeActions, setIncludeActions] = useState(true);
  const [periodForReport, setPeriodForReport] = useState(period);
  const [generating, setGenerating] = useState(false);
  const [reportTitle, setReportTitle] = useState(`Operational Performance Report - ${new Date().toLocaleDateString()}`);

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

    const reportData = {
      title: reportTitle,
      generated: new Date().toISOString(),
      period: PERIOD_LABEL[periodForReport],
      financialYear: fyLabel(fy.startYear, fy.startMonth),
      fy: fy,
      userName: userName || "User",
      categories: [],
      summary: null,
      actions: [],
      includeBreakdown,
    };

    const selectedCatList = structure.filter(c => selectedCategories[c.id] && !c.hidden);

    if (includeSummary) {
      const allKpis = selectedCatList.flatMap(c => 
        c.subCategories.flatMap(s => s.kpis || [])
      );
      const statusCounts = { green: 0, amber: 0, red: 0, none: 0 };
      allKpis.forEach(k => {
        const s = getStatus(k, periodForReport, fy);
        statusCounts[s.key] = (statusCounts[s.key] || 0) + 1;
      });
      
      const freqCounts = {};
      allKpis.forEach(k => {
        freqCounts[k.frequency] = (freqCounts[k.frequency] || 0) + 1;
      });
      
      reportData.summary = {
        totalKpis: allKpis.length,
        statusCounts,
        freqCounts,
        categories: selectedCatList.map(c => c.name),
      };
    }

    selectedCatList.forEach(cat => {
      const catData = {
        name: cat.name,
        subCategories: [],
      };

      cat.subCategories.forEach(sub => {
        const subData = {
          name: sub.name,
          kpis: [],
        };

        (sub.kpis || []).forEach(k => {
          const v = periodValues(k, periodForReport, fy);
          const status = getStatus(k, periodForReport, fy);
          const variance = getVariance(k, periodForReport, fy);
          const split = buildSplitRows(k, fy, periodForReport);

          subData.kpis.push({
            id: k.id,
            name: k.name,
            units: k.units,
            frequency: k.frequency,
            aggregate: k.aggregate,
            direction: k.direction,
            meaning: k.meaning,
            measured: k.measured,
            actual: v.actual,
            budget: v.budget,
            variance: variance,
            status: status.label,
            statusKey: status.key,
            notes: k.notes || "",
            splitTitle: split.title,
            splitRows: split.rows,
          });
        });

        catData.subCategories.push(subData);
      });

      reportData.categories.push(catData);
    });

    if (includeActions) {
      const opActions = actions.filter(a => 
        a.sourceModule === "Operational Performance" || 
        a.category === "Operational Performance" ||
        a.sourceCategory?.includes("Operational")
      );
      reportData.actions = opActions.map(a => ({
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

    const htmlContent = generateWordHTML(reportData, includeBreakdown, includeAnalysis);
    
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

  const generateWordHTML = (data, includeBreakdown, includeAnalysis) => {
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

    const fmtVal = (v, units, percentFormat) => {
      if (v === null || v === undefined || v === "") return "—";
      const n = Number(v);
      if (!Number.isFinite(n)) return "—";
      if (units === "%") {
        const val = percentFormat === "fraction" ? n * 100 : n;
        return `${val.toFixed(1)}%`;
      }
      if (units === "R") {
        if (Math.abs(n) >= 1_000_000) return `R ${(n / 1_000_000).toFixed(1)}m`;
        if (Math.abs(n) >= 1_000) return `R ${(n / 1_000).toFixed(1)}k`;
        return `R ${n.toFixed(0)}`;
      }
      if (units && !["#","%","R"].includes(units)) return `${trimNum(n)} ${units}`;
      return trimNum(n);
    };

    const kpiRows = (kpis) => {
      if (!kpis.length) return "";
      let html = `
        <table style="width:100%; border-collapse:collapse; font-size:10pt; margin:8px 0;">
          <thead>
            <tr style="background:#33231e; color:#fff;">
              <th style="padding:6px 10px; text-align:left; border:1px solid #ddd;">KPI</th>
              <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Units</th>
              <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Frequency</th>
              <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Budget</th>
              <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Actual</th>
              <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Variance</th>
              <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Status</th>
            </tr>
          </thead>
          <tbody>`;
      kpis.forEach((k, i) => {
        const bg = i % 2 === 0 ? "#ffffff" : "#faf8f7";
        const status = k.statusKey || "none";
        html += `
          <tr style="background:${bg};">
            <td style="padding:6px 10px; border:1px solid #ddd; font-weight:500;">${k.name}</td>
            <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">${k.units}</td>
            <td style="padding:6px 10px; border:1px solid #ddd; text-align:center; font-size:9pt;">
              <span style="background:#f2eeec; padding:2px 8px; border-radius:12px;">${k.frequency}</span>
            </td>
            <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">${fmtVal(k.budget, k.units)}</td>
            <td style="padding:6px 10px; border:1px solid #ddd; text-align:center; font-weight:600;">${fmtVal(k.actual, k.units)}</td>
            <td style="padding:6px 10px; border:1px solid #ddd; text-align:center; color:${k.variance !== null && k.variance >= 0 ? '#166534' : '#991b1b'};">${k.variance !== null ? fmtVal(k.variance, k.units) : "—"}</td>
            <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">
              <span style="background:${statusBg(status)}; color:${statusColor(status)}; padding:2px 12px; border-radius:12px; font-weight:600; font-size:9pt;">${k.status || "No data"}</span>
            </td>
          </tr>`;
      });
      html += `</tbody></table>`;
      return html;
    };

    /* Split table — native-frequency with running totals */
    const splitTable = (kpi) => {
      if (!kpi.splitRows || !kpi.splitRows.length) return "";
      let html = `<h4 style="color:#4a352f; font-size:10pt; margin:10px 0 4px;">${kpi.name} — ${kpi.splitTitle}</h4>`;
      html += `<table style="width:100%; border-collapse:collapse; font-size:9pt; margin:4px 0 10px;">
        <thead><tr style="background:#e9e3df; color:#2d201c;">
          <th style="padding:4px 8px; border:1px solid #ddd; text-align:left;">Period</th>
          <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Budget</th>
          <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Actual</th>
          <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Variance</th>
        </tr></thead><tbody>`;

      let totalBudget = 0, totalActual = 0, hasBudget = false, hasActual = false;
      kpi.splitRows.forEach((r) => {
        const b = parseNum(r.budget), a = parseNum(r.actual);
        const variance = Number.isFinite(a) && Number.isFinite(b) ? a - b : null;
        if (Number.isFinite(b)) { totalBudget += b; hasBudget = true; }
        if (Number.isFinite(a)) { totalActual += a; hasActual = true; }
        const vColor = variance !== null && varianceFavourable({ direction: kpi.direction }, variance) ? '#166534' : '#991b1b';
        html += `<tr>
          <td style="padding:4px 8px; border:1px solid #ddd;">${r.label}</td>
          <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${fmtVal(r.budget, kpi.units)}</td>
          <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${fmtVal(r.actual, kpi.units)}</td>
          <td style="padding:4px 8px; border:1px solid #ddd; text-align:center; color:${vColor};">${variance !== null ? fmtVal(variance, kpi.units) : "—"}</td>
        </tr>`;
      });
      totalBudget = rollUp(kpi.splitRows.map(r=>parseNum(r.budget)),kpi.aggregate);
      totalActual = rollUp(kpi.splitRows.map(r=>parseNum(r.actual)),kpi.aggregate);
      const totalVar = hasBudget && hasActual ? totalActual - totalBudget : null;
      const totalVarColor = totalVar !== null && varianceFavourable({ direction: kpi.direction }, totalVar) ? '#166534' : '#991b1b';
      html += `<tr style="background:#f4efec; font-weight:700;">
        <td style="padding:4px 8px; border:1px solid #ddd;">${kpi.aggregate === "sum" ? "Total" : "Average"}</td>
        <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${hasBudget ? fmtVal(totalBudget, kpi.units) : "—"}</td>
        <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${hasActual ? fmtVal(totalActual, kpi.units) : "—"}</td>
        <td style="padding:4px 8px; border:1px solid #ddd; text-align:center; color:${totalVarColor};">${totalVar !== null ? fmtVal(totalVar, kpi.units) : "—"}</td>
      </tr>`;
      return html + `</tbody></table>`;
    };

    const breakdownRows = (kpis) => {
      if (!kpis.length) return "";
      let html = "";
      kpis.forEach(k => { html += splitTable(k); });
      return html;
    };

    let categoriesHtml = "";
    data.categories.forEach(cat => {
      categoriesHtml += `<h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">${cat.name}</h2>`;
      
      cat.subCategories.forEach(sub => {
        if (sub.kpis.length) {
          categoriesHtml += `
            <h3 style="color:#4a352f; font-size:12pt; margin:12px 0 6px;">${sub.name}</h3>
            ${kpiRows(sub.kpis)}
            ${includeBreakdown ? breakdownRows(sub.kpis) : ""}
          `;
        }
      });
    });

    let analysisHtml = "";
    if (includeAnalysis) {
      analysisHtml = `
        <h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">Analysis & Observations</h2>
        <div style="font-size:10pt; line-height:1.6;">`;
      
      data.categories.forEach(cat => {
        cat.subCategories.forEach(sub => {
          sub.kpis.forEach(k => {
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

      const allKpis = data.categories.flatMap(c => 
        c.subCategories.flatMap(s => s.kpis || [])
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
        <p style="font-size:10pt; color:#6b5b55;">${data.actions.length} actions related to Operational Performance</p>
        <table style="width:100%; border-collapse:collapse; font-size:9pt; margin:8px 0;">
          <thead><tr style="background:#33231e; color:#fff;">
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
              <strong>${data.summary.totalKpis} KPIs</strong> across ${data.summary.categories.length} categories
              · ${data.summary.statusCounts.green} on budget
              · ${data.summary.statusCounts.amber} needs attention
              · ${data.summary.statusCounts.red} critical
              <br><span style="font-size:9pt; color:#6b5b55;">
                ${Object.entries(data.summary.freqCounts || {}).map(([f, c]) => `${f}: ${c}`).join(" · ")}
              </span>
            </p>
          </div>
        ` : ""}

        ${categoriesHtml}
        ${analysisHtml}
        ${actionsHtml}

        <p style="color:#8a7a74; font-size:8pt; text-align:center; margin-top:40px; border-top:1px solid #ded8d4; padding-top:16px;">
          Operational Performance Report · Generated from RAPS Platform
        </p>
      </body>
      </html>
    `;
  };

  return (
    <Modal title="Generate Operational Report" subtitle="Select what to include in the Word document" icon={<FileText size={17} />} onClose={onClose} width={680}
      footer={<> 
        <button onClick={onClose} style={btnGhost}>Cancel</button>
        <button onClick={generateReport} disabled={generating || !Object.values(selectedCategories).some(v => v)} 
          style={{ ...btnPrimary, opacity: generating || !Object.values(selectedCategories).some(v => v) ? 0.6 : 1 }}>
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
        <label style={labelS}>Categories to include</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {structure.filter(c => !c.hidden).map((c) => (
            <label key={c.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer", padding: "4px 0" }}>
              <input type="checkbox" checked={selectedCategories[c.id]} 
                onChange={() => setSelectedCategories(p => ({ ...p, [c.id]: !p[c.id] }))} />
              {c.name}
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
            <input type="checkbox" checked={includeBreakdown} onChange={() => setIncludeBreakdown(!includeBreakdown)} />
            <strong>Split tables (daily / weekly / monthly)</strong>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer", padding: "4px 0" }}>
            <input type="checkbox" checked={includeAnalysis} onChange={() => setIncludeAnalysis(!includeAnalysis)} />
            Analysis & observations
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer", padding: "4px 0" }}>
            <input type="checkbox" checked={includeActions} onChange={() => setIncludeActions(!includeActions)} />
            Actions
          </label>
        </div>
      </div>

      <div style={{ ...cardS, background: T.panel, fontSize: "12.5px", color: T.body }}>
        <Info size={14} color={T.accentSoft} style={{ marginRight: "8px" }} />
        The report includes a native-frequency split table under each KPI: daily KPIs show every day captured, weekly show every week, monthly show all 12 months with running totals.
      </div>
    </Modal>
  );
};

/* ─── KPI info popup ───────────────────────────────────────────────────── */
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
        {[`Units: ${kpi.units}`, `Captured ${kpi.frequency.toLowerCase()}`,
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

/* ─── Analysis text ────────────────────────────────────────────────────── */
const localAnalysis = (kpi, period, v, fy) => {
  const status = statusFromPair(kpi, v.budget, v.actual);
  const variance = Number.isFinite(parseNum(v.budget)) && Number.isFinite(parseNum(v.actual)) ? Number(v.actual) - Number(v.budget) : null;
  const fav = varianceFavourable(kpi, variance);
  return {
    observations: [
      `${PERIOD_LABEL[period]} actual sits at ${fmtValue(v.actual, kpi)} against a budget of ${fmtValue(v.budget, kpi)}.`,
      variance === null ? "Variance cannot be computed — either the budget or the actual is missing."
        : `That is a ${fav ? "favourable" : "unfavourable"} variance of ${fmtValue(Math.abs(variance), kpi)}.`,
      `Captured ${kpi.frequency.toLowerCase()} on a financial year starting ${MONTHS[fy.startMonth]}.`,
      `${DIRECTIONS.find((d) => d.value === kpi.direction)?.label} for this KPI.`,
    ],
    issues: status.key === "green"
      ? ["No material issue at this timeframe. The risk is erosion if input costs or volumes shift."]
      : [`Budget is not being met${variance === null ? "" : ` — off by ${fmtValue(Math.abs(variance), kpi)}`}.`,
         status.key === "red" ? "Severity warrants a named owner and a dated action, not continued monitoring."
           : "Unattended, this is the kind of gap that compounds quietly across periods."],
    opportunities: status.key === "green"
      ? ["Consider tightening the budget — the current one may no longer be stretching.",
         "Document what is working here and apply it to the weaker KPIs in this category."]
      : ["Raise an action against this KPI so it carries into the next governance meeting.",
         kpi.direction === "higher" ? "Find the single largest constraint on output and remove it before adding capacity."
           : "Trace the top contributors driving this number and address the largest one first.",
         "Shorten the measurement interval temporarily so corrective effort shows up sooner."],
  };
};

const summaryAnalysis = (kpi, fy) => {
  const rows = PERIODS.map((p) => {
    const v = periodValues(kpi, p.key, fy);
    return { key: p.key, label: p.label, v, status: statusFromPair(kpi, v.budget, v.actual),
      variance: Number.isFinite(parseNum(v.budget)) && Number.isFinite(parseNum(v.actual)) ? Number(v.actual) - Number(v.budget) : null };
  });
  const withData = rows.filter((r) => r.status.key !== "none");
  const reds = withData.filter((r) => r.status.key === "red");
  const greens = withData.filter((r) => r.status.key === "green");
  const mth = rows.find((r) => r.key === "this_month"), yr = rows.find((r) => r.key === "this_year");

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
            : reds.length === withData.length ? "Every timeframe is critical — this is structural, not a bad period."
            : "The picture is mixed; the shorter timeframe moves first, so watch it for the turn." ],
    issues: reds.length === 0 && withData.every((r) => r.status.key === "green") ? ["No timeframe is outside tolerance."]
      : [...reds.map((r) => `${r.label} is critical${r.variance === null ? "" : ` — off by ${fmtValue(Math.abs(r.variance), kpi)}`}.`),
         ...withData.filter((r) => r.status.key === "amber").map((r) => `${r.label} needs attention.`)],
    opportunities: reds.length > 0
      ? ["Raise a dated action — more than one timeframe is showing the same gap.",
         "Check whether the budget itself is still realistic before chasing the actual."]
      : greens.length === withData.length
        ? ["Consider tightening the budget across the board — nothing here is stretching.",
           "Use this KPI's approach as the template for the weaker ones in its category."]
        : ["Focus on the timeframe that is drifting first; the others usually follow it.",
           "Shorten the measurement interval while you correct, so effort shows up sooner."],
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
          kpiName: kpi.name, meaning: kpi.meaning, measured: kpi.measured,
          units: kpi.units, frequency: kpi.frequency, direction: kpi.direction,
          scope, timeframe: scope === "summary" ? "All timeframes" : PERIOD_LABEL[period],
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
      {loading ? (
        <div style={{ padding: "22px 0", color: T.muted, fontSize: "13.5px", textAlign: "center" }}>Reviewing {kpi.name}…</div>
      ) : analysis && (
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

/* ─── Trend chart — dynamic base type + proper scatter data ──────────── */
const CHART_TYPES = [
  { value: "bar", label: "Column Chart" }, { value: "line", label: "Line Chart" },
  { value: "area", label: "Area Chart" }, { value: "scatter", label: "Scatter Chart" },
];
const SWATCHES = ["#1e40af", "#4a352f", "#166534", "#991b1b", "#92400e", "#6d28d9", "#0e7490", "#be185d"];

/* Pick the correct x-axis / chart base type for the given series types */
const baseChartType = (types) => {
  if (types.includes("line") || types.includes("area")) return "line";
  if (types.includes("bar")) return "bar";
  return "scatter";
};

const TrendChartModal = ({ kpi, period, fy, onClose, onSaveNote, onSaveChart, readOnly }) => {
  const [noteText, setNoteText] = useState("");
  const [noteState, setNoteState] = useState("idle");
  const [showCustomise, setShowCustomise] = useState(false);
  const noteTimer = useRef(null);

  const prefs = kpi.chart?.v === CHART_VERSION ? { ...DEFAULT_CHART, ...kpi.chart } : { ...DEFAULT_CHART };

  const { labels, actual, budget, noteKey, caption } = useMemo(() => {
    const [from,to]=periodWindow(period,fy), rows=rangeRows(kpi,from,to);
    return {labels:rows.map(r=>r.label),actual:rows.map(r=>r.actual),budget:rows.map(r=>r.budget),noteKey:`${isoDate(from)}:${isoDate(to)}`,caption:`${fmtDMY(from)} – ${fmtDMY(to)} · ${kpi.frequency} · complete periods`};
  },[kpi,period,fy]);

  const variance = actual.map((a, i) => (Number.isFinite(a) && Number.isFinite(budget[i]) ? a - budget[i] : null));

  useEffect(() => { setNoteText(kpi.periodNotes?.[noteKey] || ""); setNoteState("idle"); }, [noteKey, kpi.id]);

  const onNoteChange = (text) => {
    setNoteText(text);
    setNoteState("saving");
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      onSaveNote(noteKey, text);
      setNoteState("saved");
      setTimeout(() => setNoteState("idle"), 1800);
    }, 700);
  };
  useEffect(() => () => { if (noteTimer.current) clearTimeout(noteTimer.current); }, []);

  const setPref = (patch) => onSaveChart({ ...prefs, ...patch, v: CHART_VERSION });

  const varColors = variance.map((v) =>
    v === null ? "rgba(138,122,116,0.4)" : varianceFavourable(kpi, v) ? T.green : T.red);

  const buildSeries = (type, data, color, { label, order } = {}) => {
    const isArrayColor = Array.isArray(color);
    if (type === "scatter") {
      return { type: "scatter", label, data: data.map((v, i) => ({ x: i, y: v })),
        showLine: false, pointStyle: "circle", pointRadius: 6, pointHoverRadius: 9,
        pointBackgroundColor: isArrayColor ? color : "#ffffff",
        pointBorderColor: isArrayColor ? color : color, pointBorderWidth: 2.4, order };
    }
    if (type === "line" || type === "area") {
      return { type: "line", label, data,
        borderColor: color, backgroundColor: type === "area" ? (isArrayColor ? color : `${color}22`) : "transparent",
        borderWidth: 2.5, fill: type === "area", tension: 0.25, spanGaps: false,
        pointRadius: 5, pointHoverRadius: 7, pointStyle: "circle",
        pointBackgroundColor: "#ffffff", pointBorderColor: color, pointBorderWidth: 2.2, order };
    }
    return { type: "bar", label, data,
      backgroundColor: isArrayColor ? color : `${color}b3`,
      borderWidth: 0, borderRadius: 4, barPercentage: 0.7, categoryPercentage: 0.8, order };
  };

  const varianceData = { labels, datasets: [ buildSeries(prefs.varianceType, variance, varColors, { label: "Variance" }) ] };
  const varianceBaseType = baseChartType([prefs.varianceType]);
  const varianceOptions = {
    responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
    layout: { padding: { top: 12, right: 12, bottom: 0 } },
    plugins: {
      legend: { display: false }, datalabels: { display: false },
      tooltip: { backgroundColor: T.ink, padding: 10, cornerRadius: 8,
        callbacks: { title: (items) => labels[items[0].dataIndex],
          label: (c) => {
            const y = c.parsed.y ?? c.raw?.y;
            return y === null || y === undefined ? "Variance: no data"
              : `Variance: ${fmtValue(y, kpi, { signed: true })} (${varianceFavourable(kpi, y) ? "favourable" : "unfavourable"})`;
          } } } },
    scales: {
      y: { display: true, afterFit: scale => { scale.width = 88; }, grace: "20%", beginAtZero: true,
        border: { display: false }, grid: { color: ctx => ctx.tick.value === 0 ? T.lineStrong : T.lineSoft },
        ticks: { maxTicksLimit: 4, color: T.muted, font: { size: 10 }, callback: value => fmtValue(value, kpi, { bare: true, signed: true }) } },
      x: { type: "category", labels, offset: true, display: false, grid: { display: false }, border: { display: false } },
    },
  };

  const mainData = { labels, datasets: [
    buildSeries(prefs.budgetType, budget, prefs.budgetColor, { label: "Budget", order: 1 }),
    buildSeries(prefs.actualType, actual, prefs.actualColor, { label: "Actual", order: 2 }),
  ] };
  const mainBaseType = baseChartType([prefs.actualType, prefs.budgetType]);
  const mainOptions = {
    responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
    layout: { padding: { top: 12, right: 12, bottom: 0 } },
    plugins: { legend: { display: false }, datalabels: { display: false },
      tooltip: { backgroundColor: T.ink, padding: 11, cornerRadius: 8,
        callbacks: { label: (c) => {
          const y = c.parsed.y ?? c.raw?.y;
          return y === null || y === undefined ? `${c.dataset.label}: no data`
            : `${c.dataset.label}: ${fmtValue(y, kpi)}`;
        } } } },
    scales: {
      y: { display: true, afterFit: scale => { scale.width = 88; }, border: { display: false },
        grid: { display: prefs.axisMode === "y" || prefs.axisMode === "both", color: T.lineSoft },
        ticks: { display: prefs.axisMode === "y" || prefs.axisMode === "both", color: T.body, font: { size: 11 }, callback: (v) => fmtValue(v, kpi, { bare: true }) } },
      x: { type: "category", labels, offset: true, display: true, grid: { display: false },
        ticks: { color: prefs.axisMode === "x" || prefs.axisMode === "both" ? T.body : "transparent", font: { size: 11 }, maxRotation: 45, minRotation: 0, autoSkip: true, maxTicksLimit: 14 } },
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

  const dot = (color, filled) => (
    <span style={{ width: 11, height: 11, borderRadius: "50%", border: `2.4px solid ${color}`,
      background: filled ? color : "#ffffff", display: "inline-block" }} />
  );
  const barChip = (color) => (
    <span style={{ width: 11, height: 11, borderRadius: "3px", background: `${color}b3`, display: "inline-block" }} />
  );
  const key = (label, swatch) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: T.body }}>
      {swatch}{label}
    </span>
  );
  const swatchFor = (type, color) => type === "bar" ? barChip(color) : type === "scatter" ? dot(color, false) : dot(color, true);

  return (
    <Modal title={`${kpi.name} — (${kpi.units})`} subtitle={caption} icon={<LineChartIcon size={17} />} onClose={onClose} width={960}
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

      <div style={{ ...cardS, marginBottom: 14, padding: "16px 12px 12px", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", margin: "0 6px 14px" }}>
          <strong style={{ fontSize: 13, color: T.accent }}>Budget vs Actual</strong>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            {key("Budget", swatchFor(prefs.budgetType, prefs.budgetColor))}
            {key("Actual", swatchFor(prefs.actualType, prefs.actualColor))}
            <span style={{ width: 1, height: 14, background: T.lineSoft }} aria-hidden="true" />
            {key("Favourable", dot(T.green, true))}{key("Unfavourable", dot(T.red, true))}
          </div>
        </div>
        <div style={{ paddingLeft: 88, paddingRight: 12, fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 2 }}>
          Variance · Actual − Budget
        </div>
        <div style={{ height: 130 }}>
          <Chart type={varianceBaseType} data={varianceData} options={varianceOptions} />
        </div>
        <div aria-hidden="true" style={{ borderTop: `1px solid ${T.lineSoft}`, margin: "6px 12px 0 88px" }} />
        <div style={{ height: 320 }}>
          <Chart type={mainBaseType} data={mainData} options={mainOptions} />
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
          placeholder="e.g. Production decreased this month due to scheduled maintenance."
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
const AddActionModal = ({ kpi, period, fy, categoryName, subCategoryName, userId, onClose, onSaved }) => {
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
    description: `${PERIOD_LABEL[period]} actual ${fmtValue(v.actual, kpi)} against budget ${fmtValue(v.budget, kpi)}${variance === null ? "" : ` (variance ${fmtValue(variance, kpi, { signed: true })})`}. Raised from ${categoryName} · ${subCategoryName}.`,
    category: "Operational Performance", assignedTo: "", dueDate: "", status: "In Progress",
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
      category: force || !prev.dueDate ? (m.category || m.department || "Operational Performance") : prev.category,
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
        sourceModule: "Operational Performance", sourceKpi: kpi.name,
        sourceCategory: `${categoryName} · ${subCategoryName}`,
      };
      let targetId = meetingId;
      if (!targetId) {
        const meta = RAPS_CATEGORIES.find((c) => c.name === "Operational Performance");
        const holder = {
          id: uid(), title: "Operational Performance Actions",
          category: "Operational Performance", department: "Operational Performance",
          categoryColor: meta.color, categoryBg: "#F3E5F5", departmentColor: meta.color, departmentBg: "#F3E5F5",
          departments: [], purpose: "Actions raised from the Operational Performance Summary.",
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
                No meetings yet — filed under "Operational Performance Actions".
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
      footer={<> 
        <span style={{ flex: 1, fontSize: "12.5px", color: state === "saved" ? T.green : T.muted, textAlign: "left" }}>
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Saves automatically"}
        </span>
        <button onClick={onClose} style={btnPrimary}>Close</button>
      </>}>
      <label style={labelS}>Context, anomalies or anything worth remembering about this KPI</label>
      <textarea rows="9" value={notes} readOnly={readOnly} onChange={(e) => change(e.target.value)}
        style={{ ...inputS, resize: "vertical" }} />
    </Modal>
  );
};

/* ─── Manage Categories ────────────────────────────────────────────────── */
const ManageCategoriesModal = ({ structure, onClose, onSave, notify }) => {
  const [confirmId, setConfirmId] = useState(null);
  const [moving, setMoving] = useState(false);
  const moveTab = async (from, to) => {
    setMoving(true);
    try { await onSave(moveCategory(structure, from, to)); }
    catch { /* The parent restores the previous order and reports the error. */ }
    finally { setMoving(false); }
  };

  const toggleHidden = (id) => onSave(structure.map((c) => (c.id === id ? { ...c, hidden: !c.hidden } : c)));
  
  const remove = (id) => {
    const cat = structure.find((c) => c.id === id);
    if (!cat) return;
    onSave(structure.filter((c) => c.id !== id));
    setConfirmId(null);
    notify("success", `"${cat.name}" deleted.`);
  };

  const kpiCount = (c) => c.subCategories.reduce((s, sub) => s + sub.kpis.length, 0);

  return (
    <Modal title="Manage Categories" subtitle="Order your tabs, manage visibility or remove a category"
      icon={<Settings2 size={17} />} onClose={onClose} width={620}
      footer={<button onClick={onClose} style={btnPrimary}>Done</button>}>
      {structure.map((c, index) => (
        <div key={c.id} style={{ ...cardS, marginBottom: "10px", opacity: c.hidden ? 0.6 : 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <div style={{ fontSize: "14.5px", fontWeight: 600, color: T.accent }}>
                {c.name} {c.hidden && <span style={{ fontSize: "11.5px", fontWeight: 500, color: T.muted }}>· hidden</span>}
              </div>
              <div style={{ fontSize: "12.5px", color: T.muted }}>
                {c.subCategories.length} sub-categor{c.subCategories.length === 1 ? "y" : "ies"} · {kpiCount(c)} KPIs
              </div>
            </div>
            <select aria-label={`Position of tab ${c.name}`} value={index} disabled={moving} onChange={event => moveTab(index, Number(event.target.value))} style={{ ...selectS, width: 70, height: 40 }}>
              {structure.map((_, position) => <option key={position} value={position}>{position + 1}</option>)}
            </select>
            {[-1, 1].map(delta => <button key={delta} aria-label={`Move ${c.name} ${delta < 0 ? "up" : "down"}`} disabled={moving || index + delta < 0 || index + delta >= structure.length}
              style={{ ...btnGhost, width: 36, padding: 0, opacity: moving || index + delta < 0 || index + delta >= structure.length ? 0.35 : 1 }} onClick={() => moveTab(index, index + delta)}>
              {delta < 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            </button>)}
            <button onClick={() => toggleHidden(c.id)} style={{ ...btnGhost, padding: "7px 12px", fontSize: "12.5px" }}>
              {c.hidden ? <><Eye size={13} /> Show</> : <><EyeOff size={13} /> Hide</>}
            </button>
            <button onClick={() => setConfirmId(c.id)} disabled={structure.length <= 1}
              style={{ ...btnGhost, padding: "7px 12px", fontSize: "12.5px", color: T.red,
                borderColor: T.red + "55", opacity: structure.length <= 1 ? 0.4 : 1 }}>
              <Trash2 size={13} /> Delete
            </button>
          </div>

          {confirmId === c.id && (
            <div style={{ marginTop: "12px", padding: "12px 14px", background: T.redBg, border: `1px solid ${T.red}33`, borderRadius: "8px" }}>
              <div style={{ fontSize: "13.5px", color: T.red, fontWeight: 600, marginBottom: "4px" }}>
                Delete "{c.name}" and its {kpiCount(c)} KPIs?
              </div>
              <div style={{ fontSize: "12.5px", color: T.body, marginBottom: "10px" }}>
                Every figure captured against those KPIs goes with it, and this can't be undone. Hiding keeps the data.
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={() => remove(c.id)} style={{ ...btnPrimary, background: T.red, borderColor: T.red, padding: "7px 14px", fontSize: "12.5px" }}>
                  <Trash2 size={12} /> Delete permanently
                </button>
                <button onClick={() => setConfirmId(null)} style={{ ...btnGhost, padding: "7px 14px", fontSize: "12.5px" }}>Cancel</button>
                <button onClick={() => { toggleHidden(c.id); setConfirmId(null); }} style={{ ...btnGhost, padding: "7px 14px", fontSize: "12.5px" }}>
                  <EyeOff size={12} /> Hide instead
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Add Data Wizard — frequency tabs + dual Budget/Actual rows + month selector
   ════════════════════════════════════════════════════════════════════════ */
const AddDataWizard = ({ structure, fy, activeCategoryId, prefs, onSavePrefs, onBack, onClose, onSave }) => {
  const visible = structure.filter((c) => !c.hidden);
  const [catId, setCatId] = useState(visible.some(c=>c.id===activeCategoryId)?activeCategoryId:prefs?.catId && visible.some((c) => c.id === prefs.catId) ? prefs.catId : visible[0]?.id);
  const [startYear, setStartYear] = useState(fy.startYear);
  const [entryRange,setEntryRange]=useState(fy.period==="custom"?fy.range:null);
  const category = structure.find((c) => c.id === catId) || visible[0];

  // Frequency tab & month pagination
  const [freqTab, setFreqTab] = useState(prefs?.freqTab || "auto");
  const [monthCount, setMonthCount] = useState(prefs?.monthCount ?? 12);
  const [monthStart, setMonthStart] = useState(prefs?.monthStart ?? 0);
  const [dailyMonthOffset, setDailyMonthOffset] = useState(prefs?.dailyMonthOffset ?? new Date().getMonth());
  const [weeklyHalf, setWeeklyHalf] = useState(prefs?.weeklyHalf ?? 0);

  const [draft, setDraft] = useState({});
  const draftRef=useRef({}), saving=useRef(Promise.resolve());
  const [saveState, setSaveState] = useState("idle");
  const timer = useRef(null);
  const structureRef = useRef(structure);

  useEffect(() => { structureRef.current = structure; }, [structure]);

  /* Group KPIs in the current category by their frequency */
  const kpiGroups = useMemo(() => {
    if (!category) return { monthly: [], weekly: [], daily: [], quarterly: [] };
    const monthly = [], weekly = [], daily = [], quarterly = [];
    category.subCategories.forEach((sub) => {
      sub.kpis.forEach((k) => {
        const freq = k.frequency;
        const row = { kpi: k, subCategory: sub.name };
        if (freq === "Daily") daily.push(row);
        else if (freq === "Weekly") weekly.push(row);
        else if (freq === "Quarterly") quarterly.push(row);
        else monthly.push(row);
      });
    });
    return { monthly, weekly, daily, quarterly };
  }, [category]);

  /* Which sections have KPIs in this category */
  const sections = useMemo(() => {
    const list = [];
    if (kpiGroups.monthly.length) list.push({ key: "monthly", label: "Monthly", count: kpiGroups.monthly.length });
    if (kpiGroups.weekly.length)  list.push({ key: "weekly",  label: "Weekly",  count: kpiGroups.weekly.length });
    if (kpiGroups.daily.length)   list.push({ key: "daily",   label: "Daily",   count: kpiGroups.daily.length });
    if (kpiGroups.quarterly.length) list.push({ key: "quarterly", label: "Quarterly", count: kpiGroups.quarterly.length });
    return list;
  }, [kpiGroups]);

  /* Auto-select first available section */
  const activeSection = useMemo(() => {
    if (!sections.length) return null;
    if (freqTab === "auto") return sections[0].key;
    return sections.some((s) => s.key === freqTab) ? freqTab : sections[0].key;
  }, [freqTab, sections]);

  /* Value lookup */
  const value = (kpiId, periodKey, field) => {
    const d = draft[kpiId]?.[periodKey];
    if (d && d[field] !== undefined) return d[field];
    const kpi = (category?.subCategories || []).flatMap((s) => s.kpis).find((k) => k.id === kpiId);
    return kpi?.entries?.[periodKey]?.[field] ?? "";
  };

  /* Merge draft into the structure for persistence */
  const merge = (currentStructure, rows) => currentStructure.map((cat) => ({
    ...cat,
    subCategories: cat.subCategories.map((sub) => ({
      ...sub,
      kpis: sub.kpis.map((k) => {
        const kRows = rows[k.id];
        if (!kRows) return k;
        const entries = { ...(k.entries || {}) };
        Object.entries(kRows).forEach(([key, vals]) => {
          const actual = parseNum(vals.actual ?? entries[key]?.actual);
          const budget = parseNum(vals.budget ?? entries[key]?.budget);
          if (actual === null && budget === null) delete entries[key];
          else entries[key] = { actual, budget };
        });
        return { ...k, entries };
      }),
    })),
  }));

  const flush = async () => {
    clearTimeout(timer.current);
    const rows=draftRef.current;
    const job=saving.current.catch(()=>{}).then(async()=>{
      if(!Object.keys(rows).length) return;
      setSaveState("saving");
      try {const next=merge(structureRef.current,rows);await onSave(next,{silent:true});structureRef.current=next;setSaveState("saved");}
      catch(e){setSaveState("error");throw e;}
    });
    saving.current=job; return job;
  };
  const leave = async callback => {try {await flush();callback();} catch {/* Keep the editor and draft open for retry. */}};
  const setValue = (kpiId,periodKey,field,raw) => {
    const current=draftRef.current;
    const next={...current,[kpiId]:{...current[kpiId],[periodKey]:{...current[kpiId]?.[periodKey],[field]:raw}}};
    draftRef.current=next;setDraft(next);setSaveState("saving");clearTimeout(timer.current);
    timer.current=setTimeout(()=>{flush().catch(()=>{});},800);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => {
    onSavePrefs({ catId, startYear, freqTab, monthCount, monthStart, dailyMonthOffset, weeklyHalf });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catId, startYear, freqTab, monthCount, monthStart, dailyMonthOffset, weeklyHalf]);

  /* Colour tokens */
  const MODE_COLOR = {
    budget: { hdr: "#1e3a8a", hdrText: "#dbeafe", cell: "#eff6ff", border: "#bfdbfe", input: "#1e3a8a" },
    actual: { hdr: "#166534", hdrText: "#dcfce7", cell: "#f0fdf4", border: "#bbf7d0", input: "#166534" },
  };

  /* Render an input inline (focus-safe) */
  const renderInput = (kpi, periodKey, field, tok) => {
    const val = value(kpi.id, periodKey, field);
    return (
      <input
        type="number" step="any" value={val} placeholder="—"
        onChange={(e) => setValue(kpi.id, periodKey, field, e.target.value)}
        style={{
          width: "100%", padding: "6px 8px",
          border: `1.5px solid ${tok.border}`, borderRadius: "5px",
          fontSize: "12px", fontFamily: "inherit",
          fontVariantNumeric: "tabular-nums", textAlign: "right",
          background: "#fff", color: tok.input, fontWeight: 600,
          outline: "none", boxSizing: "border-box",
        }}
        onFocus={(e) => { e.target.style.borderColor = tok.hdr; e.target.style.boxShadow = `0 0 0 3px ${tok.hdr}22`; }}
        onBlur={(e) => { e.target.style.borderColor = tok.border; e.target.style.boxShadow = "none"; }}
      />
    );
  };

  /* ── Monthly grid ── */
  const renderMonthlyGrid = () => {
    if (!kpiGroups.monthly.length) return null;
    const allMonths = fyMonths(startYear, fy.startMonth);
    const clampedStart = Math.max(0, Math.min(monthStart, 12 - monthCount));
    const months = entryRange ? rangeKeys("Monthly",localDate(entryRange.from),localDate(entryRange.to)).map(key=>{const d=localDate(key.slice(2));return {key,label:key.slice(2),year:d.getFullYear(),month:d.getMonth()};}) : allMonths.slice(clampedStart, clampedStart + monthCount);
    const rowLabelW = 210;

    return (
      <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ background: T.header, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff", letterSpacing: "0.3px" }}>
            Monthly · {months[0]?.label} → {months[months.length - 1]?.label}
          </span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>From</span>
              <select
                value={clampedStart}
                onChange={(e) => setMonthStart(Number(e.target.value))}
                style={{
                  padding: "4px 8px", borderRadius: "6px", fontSize: "11.5px",
                  fontFamily: "inherit", background: "rgba(255,255,255,0.15)", color: "#fff",
                  border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer",
                }}
              >
                {allMonths.map((m, i) => (
                  <option key={m.key} value={i} disabled={i > 12 - monthCount} style={{ color: "#000" }}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.12)", borderRadius: "8px", padding: "2px" }}>
              {[3, 6, 12].map((n) => {
                const on = monthCount === n;
                return (
                  <button
                    key={n}
                    onClick={() => {
                      setMonthCount(n);
                      setMonthStart((s) => Math.max(0, Math.min(s, 12 - n)));
                    }}
                    style={{
                      padding: "4px 12px", borderRadius: "6px",
                      fontSize: "11.5px", fontWeight: 600, cursor: "pointer",
                      fontFamily: "inherit", border: "none",
                      background: on ? "#fff" : "transparent",
                      color: on ? T.header : "#fff",
                    }}
                  >
                    {n}m
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", minWidth: `${rowLabelW + months.length * 90}px`, tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ background: T.header, width: rowLabelW, padding: "8px 12px", textAlign: "left",
                  fontSize: "11px", fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.4px",
                  borderRight: `2px solid ${T.lineStrong}` }}>
                  KPI
                </th>
                {months.map((m) => (
                  <th key={m.key} style={{ background: T.header, padding: "6px 4px", fontSize: "10.5px",
                    fontWeight: 700, color: "rgba(255,255,255,0.85)", textAlign: "center",
                    borderRight: "1px solid rgba(255,255,255,0.15)" }}>
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kpiGroups.monthly.map(({ kpi, subCategory }, i) => {
                const alt = i % 2 ? T.panel : T.bg;
                return (
                  <React.Fragment key={kpi.id}>
                    {/* BUDGET ROW */}
                    <tr>
                      <td style={{ padding: "7px 12px", fontSize: "12px", fontWeight: 600,
                        color: T.ink, borderBottom: `1px solid ${T.lineSoft}`,
                        borderRight: `2px solid ${T.lineStrong}`,
                        background: MODE_COLOR.budget.cell }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "999px",
                            background: MODE_COLOR.budget.hdr, color: "#fff", fontWeight: 700,
                            letterSpacing: "0.3px" }}>BUDGET</span>
                          <span style={{ fontSize: "12px", color: T.ink }}>{kpi.name}</span>
                        </div>
                        <div style={{ fontSize: "10px", color: T.muted, marginTop: "2px", paddingLeft: "2px" }}>
                          {subCategory} · {kpi.units}
                        </div>
                      </td>
                      {months.map((m) => {
                        const tok = MODE_COLOR.budget;
                        return (
                          <td key={m.key} style={{ padding: "4px 5px",
                            borderBottom: `1px solid ${T.lineSoft}`,
                            borderRight: `1px solid ${tok.border}`,
                            background: tok.cell }}>
                            {renderInput(kpi, m.key, "budget", tok)}
                          </td>
                        );
                      })}
                    </tr>
                    {/* ACTUAL ROW */}
                    <tr>
                      <td style={{ padding: "7px 12px", fontSize: "12px", fontWeight: 600,
                        color: T.ink, borderBottom: `2px solid ${T.lineStrong}`,
                        borderRight: `2px solid ${T.lineStrong}`, background: alt }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "999px",
                            background: MODE_COLOR.actual.hdr, color: "#fff", fontWeight: 700,
                            letterSpacing: "0.3px" }}>ACTUAL</span>
                          <span style={{ fontSize: "12px", color: T.ink }}>{kpi.name}</span>
                        </div>
                        <div style={{ fontSize: "10px", color: T.muted, marginTop: "2px", paddingLeft: "2px" }}>
                          {subCategory} · {kpi.units}
                        </div>
                      </td>
                      {months.map((m) => {
                        const tok = MODE_COLOR.actual;
                        return (
                          <td key={m.key} style={{ padding: "4px 5px",
                            borderBottom: `2px solid ${T.lineStrong}`,
                            borderRight: `1px solid ${tok.border}`,
                            background: alt }}>
                            {renderInput(kpi, m.key, "actual", tok)}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── Weekly grid ── */
  const renderWeeklyGrid = () => {
    if (!kpiGroups.weekly.length) return null;
    const allWeeks = fyWeeks(startYear, fy.startMonth);
    const allMonths = fyMonths(startYear, fy.startMonth);
    const startMonth = weeklyHalf === 0 ? allMonths[0] : allMonths[6];
    const endMonth = weeklyHalf === 0 ? allMonths[5] : allMonths[11];
    const weeks = entryRange ? rangeKeys("Weekly",localDate(entryRange.from),localDate(entryRange.to)).map(key=>{const start=localDate(key.slice(2)),end=addDays(start,6);return {key,start,end,label:weekRangeLabel(start,end)};}) : allWeeks.filter((w) =>
      w.start >= new Date(startMonth.year, startMonth.month, 1) &&
      w.start <= new Date(endMonth.year, endMonth.month + 1, 0)
    );

    return (
      <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ background: T.header, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
            Weekly · {weeks.length} weeks · {weeklyHalf === 0 ? "first half" : "second half"} of the FY
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => setWeeklyHalf(0)} style={{
              padding: "4px 12px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              background: weeklyHalf === 0 ? "#fff" : "rgba(255,255,255,0.15)",
              color: weeklyHalf === 0 ? T.header : "#fff",
              border: "1px solid rgba(255,255,255,0.25)",
            }}>{allMonths[0].label} – {allMonths[5].label}</button>
            <button onClick={() => setWeeklyHalf(1)} style={{
              padding: "4px 12px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              background: weeklyHalf === 1 ? "#fff" : "rgba(255,255,255,0.15)",
              color: weeklyHalf === 1 ? T.header : "#fff",
              border: "1px solid rgba(255,255,255,0.25)",
            }}>{allMonths[6].label} – {allMonths[11].label}</button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: `${210 + weeks.length * 84}px`, tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ background: T.header, width: 210, padding: "8px 12px", textAlign: "left",
                  fontSize: "11px", fontWeight: 700, color: "#fff", textTransform: "uppercase",
                  borderRight: `2px solid ${T.lineStrong}` }}>
                  KPI
                </th>
                {weeks.map((w) => (
                  <th key={w.key} style={{ background: T.header, padding: "6px 4px", fontSize: "10.5px",
                    fontWeight: 700, color: "rgba(255,255,255,0.85)", textAlign: "center",
                    borderRight: "1px solid rgba(255,255,255,0.15)" }}>
                    {w.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kpiGroups.weekly.map(({ kpi, subCategory }, i) => {
                const alt = i % 2 ? T.panel : T.bg;
                return (
                  <React.Fragment key={kpi.id}>
                    <tr>
                      <td style={{ padding: "7px 12px", fontSize: "12px", fontWeight: 600,
                        color: T.ink, borderBottom: `1px solid ${T.lineSoft}`,
                        borderRight: `2px solid ${T.lineStrong}`, background: MODE_COLOR.budget.cell }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "999px",
                            background: MODE_COLOR.budget.hdr, color: "#fff", fontWeight: 700 }}>BUDGET</span>
                          <span style={{ fontSize: "12px" }}>{kpi.name}</span>
                        </div>
                        <div style={{ fontSize: "10px", color: T.muted, marginTop: "2px" }}>{subCategory} · {kpi.units}</div>
                      </td>
                      {weeks.map((w) => (
                        <td key={w.key} style={{ padding: "4px 5px",
                          borderBottom: `1px solid ${T.lineSoft}`,
                          borderRight: `1px solid ${MODE_COLOR.budget.border}`,
                          background: MODE_COLOR.budget.cell }}>
                          {renderInput(kpi, w.key, "budget", MODE_COLOR.budget)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ padding: "7px 12px", fontSize: "12px", fontWeight: 600,
                        color: T.ink, borderBottom: `2px solid ${T.lineStrong}`,
                        borderRight: `2px solid ${T.lineStrong}`, background: alt }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "999px",
                            background: MODE_COLOR.actual.hdr, color: "#fff", fontWeight: 700 }}>ACTUAL</span>
                          <span style={{ fontSize: "12px" }}>{kpi.name}</span>
                        </div>
                        <div style={{ fontSize: "10px", color: T.muted, marginTop: "2px" }}>{subCategory} · {kpi.units}</div>
                      </td>
                      {weeks.map((w) => (
                        <td key={w.key} style={{ padding: "4px 5px",
                          borderBottom: `2px solid ${T.lineStrong}`,
                          borderRight: `1px solid ${MODE_COLOR.actual.border}`,
                          background: alt }}>
                          {renderInput(kpi, w.key, "actual", MODE_COLOR.actual)}
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── Daily grid ── */
  const renderDailyGrid = () => {
    if (!kpiGroups.daily.length) return null;
    const allMonths = fyMonths(startYear, fy.startMonth);
    const refMonth = allMonths.find((m) => m.month === dailyMonthOffset) || allMonths[0];
    const days = entryRange ? rangeKeys("Daily",localDate(entryRange.from),localDate(entryRange.to)).map(key=>{const date=localDate(key.slice(2));return {key,date,label:fmtDMY(date)};}) : daysInMonth(refMonth.year, refMonth.month);

    return (
      <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ background: T.header, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
            Daily · {refMonth.long} · {days.length} days
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={() => {
              const idx = allMonths.findIndex((m) => m.month === dailyMonthOffset);
              setDailyMonthOffset(allMonths[idx <= 0 ? 11 : idx - 1].month);
            }} style={{
              padding: "4px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", background: "rgba(255,255,255,0.15)",
              color: "#fff", border: "1px solid rgba(255,255,255,0.25)",
            }}>←</button>
            <select value={dailyMonthOffset} onChange={(e) => setDailyMonthOffset(Number(e.target.value))}
              style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "11.5px",
                fontFamily: "inherit", background: "rgba(255,255,255,0.15)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer" }}>
              {allMonths.map((mn) => <option key={mn.key} value={mn.month} style={{ color: "#000" }}>{mn.long}</option>)}
            </select>
            <button onClick={() => {
              const idx = allMonths.findIndex((m) => m.month === dailyMonthOffset);
              setDailyMonthOffset(allMonths[idx >= 11 ? 0 : idx + 1].month);
            }} style={{
              padding: "4px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", background: "rgba(255,255,255,0.15)",
              color: "#fff", border: "1px solid rgba(255,255,255,0.25)",
            }}>→</button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: `${210 + days.length * 66}px`, tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ background: T.header, width: 210, padding: "8px 12px", textAlign: "left",
                  fontSize: "11px", fontWeight: 700, color: "#fff", textTransform: "uppercase",
                  borderRight: `2px solid ${T.lineStrong}` }}>
                  KPI
                </th>
                {days.map((d) => (
                  <th key={d.key} style={{ background: T.header, padding: "4px 2px", fontSize: "10px",
                    fontWeight: 700, color: "rgba(255,255,255,0.85)", textAlign: "center",
                    borderRight: "1px solid rgba(255,255,255,0.15)" }}>
                    {entryRange ? fmtDMY(d.date) : d.date.getDate()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kpiGroups.daily.map(({ kpi, subCategory }, i) => {
                const alt = i % 2 ? T.panel : T.bg;
                return (
                  <React.Fragment key={kpi.id}>
                    <tr>
                      <td style={{ padding: "7px 12px", fontSize: "12px", fontWeight: 600,
                        color: T.ink, borderBottom: `1px solid ${T.lineSoft}`,
                        borderRight: `2px solid ${T.lineStrong}`, background: MODE_COLOR.budget.cell }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "999px",
                            background: MODE_COLOR.budget.hdr, color: "#fff", fontWeight: 700 }}>BUDGET</span>
                          <span style={{ fontSize: "12px" }}>{kpi.name}</span>
                        </div>
                        <div style={{ fontSize: "10px", color: T.muted, marginTop: "2px" }}>{subCategory} · {kpi.units}</div>
                      </td>
                      {days.map((d) => (
                        <td key={d.key} style={{ padding: "3px 3px",
                          borderBottom: `1px solid ${T.lineSoft}`,
                          borderRight: `1px solid ${MODE_COLOR.budget.border}`,
                          background: MODE_COLOR.budget.cell }}>
                          {renderInput(kpi, d.key, "budget", MODE_COLOR.budget)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ padding: "7px 12px", fontSize: "12px", fontWeight: 600,
                        color: T.ink, borderBottom: `2px solid ${T.lineStrong}`,
                        borderRight: `2px solid ${T.lineStrong}`, background: alt }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "999px",
                            background: MODE_COLOR.actual.hdr, color: "#fff", fontWeight: 700 }}>ACTUAL</span>
                          <span style={{ fontSize: "12px" }}>{kpi.name}</span>
                        </div>
                        <div style={{ fontSize: "10px", color: T.muted, marginTop: "2px" }}>{subCategory} · {kpi.units}</div>
                      </td>
                      {days.map((d) => (
                        <td key={d.key} style={{ padding: "3px 3px",
                          borderBottom: `2px solid ${T.lineStrong}`,
                          borderRight: `1px solid ${MODE_COLOR.actual.border}`,
                          background: alt }}>
                          {renderInput(kpi, d.key, "actual", MODE_COLOR.actual)}
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!category) {
    return (
      <Modal title="Add Data" icon={<Database size={17} />} onClose={()=>leave(onClose)} width={520}
        footer={<button onClick={()=>leave(onClose)} style={btnPrimary}>Close</button>}>
        <p style={{ fontSize: "14px", color: T.body, margin: 0 }}>Every category is hidden. Unhide one under Categories first.</p>
      </Modal>
    );
  }

  return (
    <Modal title="Add Data" subtitle={`Financial year starts in ${MONTHS[fy.startMonth]} · Budget & Actual visible together · Everything saves as you type`}
      icon={<Database size={17} />}
      onClose={()=>leave(onClose)}
      width={Math.min(Math.max(window.innerWidth - 60, 900), 1600)}
      footer={<> 
        <button onClick={()=>leave(onBack)} style={btnGhost}><ArrowLeft size={13} /> Back</button>
        <span style={{ flex: 1, fontSize: "12.5px", color: saveState === "saved" ? T.green : T.muted, textAlign: "left" }}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Save failed. Press Done to retry; your edits are retained." : "Everything saves automatically"}
        </span>
        <button onClick={()=>leave(onClose)} style={btnPrimary}>Done</button>
      </>}>

      <DateRangeControls fy={{...fy,startYear,range:entryRange,period:entryRange?"custom":undefined}} onChange={async range=>{await flush();setEntryRange(range);setStartYear(localDate(range.from).getFullYear());}}/>
      {/* Top controls */}
      <div style={{ maxWidth: 360, marginBottom: 14 }}>
        <div>
          <label style={labelS}>Category</label>
          <select value={catId} onChange={(e) => setCatId(e.target.value)} style={selectS}>
            {visible.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Frequency tabs */}
      {sections.length > 0 && (
        <div style={{
          display: "flex", gap: "4px", padding: "4px", borderRadius: "10px",
          background: T.raised, marginBottom: "14px", flexWrap: "wrap",
        }}>
          {sections.map((s) => {
            const on = activeSection === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setFreqTab(s.key)}
                style={{
                  padding: "8px 16px", borderRadius: "8px",
                  fontSize: "13.5px", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", border: "none",
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  background: on ? T.bg : "transparent",
                  color: on ? T.accent : T.body,
                  boxShadow: on ? "0 1px 3px rgba(45,32,28,0.14)" : "none",
                }}
              >
                {s.label}
                <span style={{
                  fontSize: "11px", padding: "1px 8px", borderRadius: "999px",
                  background: on ? T.accentTint : T.bg,
                  color: on ? T.accent : T.muted,
                  fontWeight: 700,
                }}>
                  {s.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {activeSection === "quarterly" && <div style={{overflowX:"auto"}}><p>Calendar quarters · only complete quarters are included in reporting. Older monthly entries for quarterly KPIs remain saved; review and enter the correct quarter totals here.</p><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th>KPI</th>{[0,3,6,9].map(m=><th key={m}>Q{m/3+1} {startYear}</th>)}</tr></thead><tbody>{kpiGroups.quarterly.flatMap(({kpi}) => ["budget","actual"].map(field=><tr key={`${kpi.id}-${field}`}><td>{kpi.name} · {field === "budget" ? "Budget" : "Actual"}</td>{[0,3,6,9].map(m=><td key={m} style={{padding:8}}>{renderInput(kpi, `Q:${startYear}-${String(m+1).padStart(2,"0")}`,field,MODE_COLOR[field])}</td>)}</tr>))}</tbody></table></div>}
      {activeSection === "monthly" && renderMonthlyGrid()}
      {activeSection === "weekly" && renderWeeklyGrid()}
      {activeSection === "daily" && renderDailyGrid()}

      {sections.length === 0 && (
        <div style={{ textAlign: "center", padding: "30px", color: T.muted, fontSize: "13.5px" }}>
          This category has no KPIs to capture yet.
        </div>
      )}

      {sections.length > 0 && (
        <div style={{ fontSize: "11.5px", color: T.muted, marginTop: "12px",
          display: "flex", alignItems: "center", gap: "6px" }}>
          <Info size={12} />
          Every KPI shows two rows — Budget above, Actual below — across the entire period. Use the tabs to switch between capture frequencies.
        </div>
      )}
    </Modal>
  );
};

/* ─── Add KPI ───────────────────────────────────────────────────────────── */
const AddKpiWizard = ({ structure, categoryId, onBack, onClose, onSave }) => {
  const visible = structure.filter((c) => !c.hidden);
  const [catId, setCatId] = useState(categoryId || visible[0]?.id);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [subChoice, setSubChoice] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", units: "%", percentFormat: "whole", frequency: "Monthly",
    direction: "higher", aggregate: "avg", meaning: "", measured: "",
  });

  const creatingCategory = catId === "__new__";
  const category = structure.find((c) => c.id === catId);
  const subs = category?.subCategories || [];
  const creatingSub = subChoice === "__new__" || creatingCategory;
  const subName = creatingSub ? newSubName.trim() : subChoice;

  useEffect(() => { if (!creatingCategory && subs.length && !subChoice) setSubChoice(subs[0].name); }, [catId]);

  const canSave = form.name.trim() && subName && (!creatingCategory || newCategoryName.trim())
    && form.meaning.trim() && form.measured.trim();

  const commit = async () => {
    if (!canSave) return;
    setSaving(true);
    const kpi = mkKpi({
      name: form.name.trim(), units: form.units, frequency: form.frequency,
      direction: form.direction, aggregate: form.aggregate,
      percentFormat: form.units === "%" ? form.percentFormat : "whole",
      meaning: form.meaning.trim(), measured: form.measured.trim(), entries: {},
    });
    const next = creatingCategory
      ? [...structure, { id: `cat_${uid().slice(0,8)}`, name: newCategoryName.trim(), notes: "", hidden: false, subCategories: [{ name: subName, kpis: [kpi] }] }]
      : structure.map((cat) => cat.id !== catId ? cat : {
          ...cat,
          subCategories: subs.some((s) => s.name === subName)
            ? cat.subCategories.map((s) => (s.name === subName ? { ...s, kpis: [...s.kpis, kpi] } : s))
            : [...cat.subCategories, { name: subName, kpis: [kpi] }],
        });
    await onSave(next);
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Add KPI" subtitle="Tell the system enough to calculate and display it" icon={<Sparkles size={17} />}
      onClose={onClose} width={720}
      footer={<> 
        <button onClick={onBack} style={btnGhost}><ArrowLeft size={13} /> Back</button>
        <div style={{ flex: 1 }} />
        <button onClick={commit} disabled={!canSave || saving} style={{ ...btnPrimary, opacity: canSave && !saving ? 1 : 0.5 }}>
          {saving ? "Saving..." : "Create KPI"}</button>
      </>}>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
        <div>
          <label style={labelS}>Category</label>
          <select value={catId} onChange={(e) => { setCatId(e.target.value); setSubChoice(""); }} style={selectS}>
            {visible.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__new__">＋ New category…</option>
          </select>
          {creatingCategory && (
            <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
              style={{ ...inputS, marginTop: "8px" }} placeholder="New category name" />
          )}
        </div>
        <div>
          <label style={labelS}>Sub-category</label>
          {creatingCategory ? (
            <input value={newSubName} onChange={(e) => setNewSubName(e.target.value)} style={inputS} placeholder="e.g. Service Levels" />
          ) : (
            <>
              <select value={subChoice} onChange={(e) => setSubChoice(e.target.value)} style={selectS}>
                <option value="">Select…</option>
                {subs.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                <option value="__new__">＋ New sub-category…</option>
              </select>
              {subChoice === "__new__" && (
                <input value={newSubName} onChange={(e) => setNewSubName(e.target.value)}
                  style={{ ...inputS, marginTop: "8px" }} placeholder="New sub-category name" />
              )}
            </>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={labelS}>KPI name *</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputS} placeholder="e.g. First-time Fix Rate" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: form.units === "%" ? "1fr 1fr 1fr" : "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
        <div>
          <label style={labelS}>Units</label>
          <select value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} style={selectS}>
            <option value="%">Percent (%)</option><option value="R">Currency (R)</option>
            <option value="#">Count (#)</option><option value="days">Days</option>
            <option value="hrs">Hours</option><option value="units">Units</option><option value="index">Index</option>
          </select>
        </div>
        {form.units === "%" && (
          <div>
            <label style={labelS}>Captured as</label>
            <select value={form.percentFormat} onChange={(e) => setForm({ ...form, percentFormat: e.target.value })} style={selectS}>
              <option value="whole">Whole numbers (25)</option><option value="fraction">Decimals (0.25)</option>
            </select>
          </div>
        )}
        <div>
          <label style={labelS}>Measurement frequency</label>
          <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} style={selectS}>
            {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <div>
          <label style={labelS}>What counts as good?</label>
          <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} style={selectS}>
            {DIRECTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelS}>Rolling up to quarters and years</label>
          <select value={form.aggregate} onChange={(e) => setForm({ ...form, aggregate: e.target.value })} style={selectS}>
            <option value="avg">AVERAGE the periods — rates, %, indices</option>
            <option value="sum">SUM the periods — counts, volumes, rand</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={labelS}>What does this KPI mean? *</label>
        <textarea rows="2" value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })}
          style={{ ...inputS, resize: "vertical" }}
          placeholder="In plain words — anyone reading the dashboard should get it from this sentence." />
      </div>

      <div>
        <label style={{ ...labelS, display: "flex", alignItems: "center", gap: "6px" }}><Sigma size={13} /> How is this KPI measured? *</label>
        <textarea rows="4" value={form.measured} onChange={(e) => setForm({ ...form, measured: e.target.value })}
          style={{ ...inputS, resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "13px" }}
          placeholder={"=COUNTIFS(FirstVisitFix, \"Yes\") / COUNTA(JobID) * 100"} />
        <p style={{ fontSize: "12px", color: T.muted, marginTop: "7px", marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
          <Info size={12} /> Use Excel functions and named ranges — SUM, AVERAGE, COUNTIF, SUMIFS, SUMPRODUCT.
        </p>
      </div>
    </Modal>
  );
};

const AddChooser = ({ onPick, onClose, prefs, fy, structure }) => {
  const cat = prefs ? structure.find((c) => c.id === prefs.catId) : null;
  return (
    <Modal title="What would you like to do?" icon={<Plus size={17} />} onClose={onClose} width={580}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        {[
          { key: "data", icon: <Database size={22} />, title: "Add Data",
            body: cat ? `Pick up where you left off — ${cat.name}, FY ${fyLabel(prefs.startYear, fy.startMonth)}.`
                      : "Capture actual and budget figures against the KPIs you already track." },
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
};

/* ════════════════════════════════════════════════════════════════════════════
   Main
   ════════════════════════════════════════════════════════════════════════ */
const PREFS_KEY = "opPerf.addData.prefs.v2";

const OperationalPerformance = () => {
  const [user, setUser] = useState(null);
  const [fyStartMonth, setFyStartMonth] = useState(0);
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [dataPrefs, setDataPrefs] = useState(null);

  const [isInvestorView, setIsInvestorView] = useState(false);
  const [viewingSMEId, setViewingSMEId] = useState(null);
  const [viewingSMEName, setViewingSMEName] = useState("");
  const [viewOrigin, setViewOrigin] = useState("investor");

  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [period, setPeriod] = useState("this_month");

  const [filters, setFilters] = useState({ category: "all", kpi: "all", units: "all", frequency: "all", status: "all" });
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
  const [manageCats, setManageCats] = useState(false);
  const [orderingCategoryId, setOrderingCategoryId] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [showSpreadsheet,setShowSpreadsheet]=useState(false);
  const [dateRange,setDateRange]=useState(null);

  const fy = useMemo(() => ({ startMonth: fyStartMonth, startYear: fyStartYearOf(new Date(), fyStartMonth),range:dateRange,period }), [fyStartMonth,dateRange,period]);

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

  useEffect(() => {
    (async () => {
      if (!user?.uid) { setLoading(false); return; }
      try {
        const profile = await getDoc(doc(db, "universalProfiles", user.uid));
        const start = fyStartMonthFromEnd(profile.exists() ? profile.data()?.entityOverview?.financialYearEnd : null);
        setFyStartMonth(start);
        const snap = await getDoc(doc(db, "operationalKpis", user.uid));
        const saved = snap.exists() ? snap.data().structure : null;
        setStructure(Array.isArray(saved) && saved.length ? saved : buildDefaultStructure(fyStartYearOf(new Date(), start), start));
      } catch (err) {
        console.error("Error loading operational KPIs:", err);
        notify("error", `Could not load your KPIs: ${errText(err)}`);
        setStructure(buildDefaultStructure(fyStartYearOf(new Date(), 0), 0));
      } finally { setLoading(false); }
    })();
  }, [user]);

  const persist = async (next, { silent = false } = {}) => {
    setStructure(next);
    if (!user?.uid || isInvestorView) return;
    try {
      await setDoc(doc(db, "operationalKpis", user.uid),
        { userId: user.uid, structure: next, lastUpdated: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error("Error saving operational KPIs:", err);
      if (!silent) notify("error", `Changes could not be saved: ${errText(err)}`);
      throw err;
    }
  };

  const updateKpi = (kpiId, patch) =>
    persist(structure.map((cat) => ({ ...cat,
      subCategories: cat.subCategories.map((sub) => ({ ...sub,
        kpis: sub.kpis.map((k) => (k.id === kpiId ? { ...k, ...patch } : k)) })) })));

  const deleteKpi = (kpiId) => {
    if (!window.confirm("Delete this KPI and all its data? This cannot be undone.")) return;
    persist(structure.map((cat) => ({
      ...cat,
      subCategories: cat.subCategories.map((sub) => ({
        ...sub,
        kpis: sub.kpis.filter((k) => k.id !== kpiId),
      })),
    })));
    notify("success", "KPI deleted.");
  };

  const visibleCategories = useMemo(() => (structure || []).filter((c) => !c.hidden), [structure]);

  useEffect(() => {
    if (!visibleCategories.length) { setActiveCategoryId(null); return; }
    if (!visibleCategories.some((c) => c.id === activeCategoryId)) setActiveCategoryId(visibleCategories[0].id);
  }, [visibleCategories, activeCategoryId]);

  const activeCategory = useMemo(
    () => visibleCategories.find((c) => c.id === activeCategoryId) || visibleCategories[0], [visibleCategories, activeCategoryId]);

  const allRows = useMemo(() => {
    if (!activeCategory) return [];
    const rows = [];
    activeCategory.subCategories.forEach((sub) => sub.kpis.forEach((kpi) => rows.push({
      kpi, subCategoryName: sub.name, categoryName: activeCategory.name,
      status: getStatus(kpi, period, fy), variance: getVariance(kpi, period, fy),
      values: periodValues(kpi, period, fy) })));
    return rows;
  }, [activeCategory, period, fy]);

  const optionsFor = (key) => {
    const set = new Set();
    allRows.forEach((r) => {
      if (key === "category") set.add(r.subCategoryName);
      else if (key === "kpi") set.add(r.kpi.name);
      else if (key === "units") set.add(r.kpi.units);
      else if (key === "frequency") set.add(r.kpi.frequency);
      else if (key === "status") set.add(r.status.label);
    });
    return ["all", ...(key === "category" ? Array.from(set) : Array.from(set).sort())];
  };

  const rows = useMemo(() => {
    const list = allRows.filter((r) =>
      (filters.category === "all" || r.subCategoryName === filters.category) &&
      (filters.kpi === "all" || r.kpi.name === filters.kpi) &&
      (filters.units === "all" || r.kpi.units === filters.units) &&
      (filters.frequency === "all" || r.kpi.frequency === filters.frequency) &&
      (filters.status === "all" || r.status.label === filters.status));

    const get = {
      category: (r) => r.subCategoryName, kpi: (r) => r.kpi.name,
      units: (r) => r.kpi.units, frequency: (r) => r.kpi.frequency,
      budget: (r) => Number(r.values.budget) || 0, actual: (r) => Number(r.values.actual) || 0,
      variance: (r) => Number(r.variance) || 0,
      status: (r) => ({ green: 0, amber: 1, red: 2, none: 3 }[r.status.key]),
    }[sortConfig.key];

    return [...list].sort((a, b) => {
      if (a.subCategoryName !== b.subCategoryName) return allRows.findIndex(row => row.subCategoryName === a.subCategoryName) - allRows.findIndex(row => row.subCategoryName === b.subCategoryName);
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
      if (last && last.name === r.subCategoryName) last.items.push(r);
      else groups.push({ name: r.subCategoryName, items: [r] });
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

  /* ── CSV export: proper quoting, BOM, split rows ── */
  const downloadCSV = () => setShowSpreadsheet(true);

  const exitInvestorView = () => {
    const origin = sessionStorage.getItem("viewOrigin");
    ["viewingSMEId","viewingSMEName","investorViewMode","viewOrigin"].forEach((k) => sessionStorage.removeItem(k));
    window.location.href = origin === "cmf" ? "/cmf-cohorts" : origin === "catalyst" ? "/catalyst/cohorts" : "/my-cohorts";
  };

  const thS = { padding: 0, background: T.header, borderBottom: `2px solid ${T.header}`,
    borderRight: "1px solid rgba(255,255,255,0.14)", position: "relative", verticalAlign: "top" };
  const tdS = { padding: "13px 14px", color: T.body, fontSize: "14px", overflow: "hidden", borderRight: `1px solid ${T.lineSoft}` };
  const iconBtn = (c) => ({ background: "none", border: "none", cursor: "pointer", padding: "5px", borderRadius: "6px", color: c, display: "inline-flex", alignItems: "center" });

  if (loading || !structure) {
    return <div style={{ padding: "80px", textAlign: "center", color: T.body, fontSize: "14px" }}>Loading operational performance...</div>;
  }

  const userName = user?.displayName || user?.email || "User";

  return (
    <div style={{ minHeight: "100vh", padding: "28px", boxSizing: "border-box", background: T.bg, color: T.body }}>
      {isInvestorView && (
        <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderLeft: `3px solid ${T.accent}`, padding: "13px 18px",
          borderRadius: "10px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "10px", color: T.accent, fontWeight: 500, fontSize: "14px" }}>
            <Eye size={15} />
            {viewOrigin === "catalyst" ? "Catalyst view" : viewOrigin === "cmf" ? "Facilitator view" : "Investor view"}: {viewingSMEName}'s Operational Performance
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
        <h1 style={{ color: T.accent, fontSize: "27px", fontWeight: 650, margin: 0, letterSpacing: "-0.5px" }}>Operational Performance Summary</h1>
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
              <li>Tracks Budget, Actual and Variance for every KPI, per period</li>
              <li>Runs on your financial year, not the calendar year</li>
              <li>Rolls daily and weekly capture up to months, quarters and the year</li>
              <li>Raises actions straight into your governance meetings</li>
            </ul>
          </div>
          <div>
            <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "10px", fontSize: "14.5px", fontWeight: 600 }}>How to use it</h3>
            <ul style={{ color: T.body, fontSize: "13.5px", lineHeight: 1.75, margin: 0, paddingLeft: "18px" }}>
              <li>Pick a timeframe above the table — the column names follow it</li>
              <li>The chart carries its own averages, note and analysis for that timeframe</li>
              <li>The lightbulb in the table reads all timeframes together</li>
              <li>Manage Categories lets you hide or delete a whole category</li>
            </ul>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "2px", borderBottom: `1px solid ${T.lineStrong}`, marginBottom: "18px", flexWrap: "wrap", alignItems: "center" }}>
        {visibleCategories.map((cat) => {
          const on = cat.id === activeCategory?.id;
          const counts = cat.subCategories.flatMap((s) => s.kpis).reduce((acc, k) => {
            const key = getStatus(k, period, fy).key; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
          return (
            <button key={cat.id} onClick={() => { setActiveCategoryId(cat.id); clearFilters(); }}
              style={{ padding: "12px 20px", background: "none", border: "none", cursor: "pointer", fontSize: "14.5px",
                fontWeight: on ? 600 : 500, color: on ? T.accent : T.body,
                borderBottom: on ? `2px solid ${T.accent}` : "2px solid transparent",
                display: "flex", alignItems: "center", gap: "9px", fontFamily: "inherit", marginBottom: "-1px" }}>
              {cat.name}
              <span style={{ display: "inline-flex", gap: "4px" }}>
                {counts.red > 0 && <span style={{ fontSize: "11px", padding: "1px 7px", borderRadius: "999px", background: T.redBg, color: T.red, fontWeight: 700 }}>{counts.red}</span>}
                {counts.amber > 0 && <span style={{ fontSize: "11px", padding: "1px 7px", borderRadius: "999px", background: T.amberBg, color: T.amber, fontWeight: 700 }}>{counts.amber}</span>}
              </span>
            </button>
          );
        })}
        {!isInvestorView && (
          <button onClick={() => setManageCats(true)} title="Order tabs, manage visibility or delete a category"
            style={{ ...btnQuiet, marginLeft: "auto", marginBottom: "4px", padding: "6px 12px", fontSize: "12.5px", color: T.muted }}>
            <Settings2 size={13} /> Manage Categories
          </button>
        )}
        <button onClick={() => setShowReport(true)} title="Generate a Word report"
          style={{ ...btnGhost, marginLeft: "4px", marginBottom: "4px", padding: "6px 14px", fontSize: "12.5px" }}>
          <FileText size={13} /> Download Report
        </button>
      </div>

      {!activeCategory ? (
        <div style={{ ...cardS, textAlign: "center", padding: "50px 20px" }}>
          <p style={{ fontSize: "14.5px", color: T.body, margin: "0 0 12px" }}>Every category is hidden right now.</p>
          <button onClick={() => setManageCats(true)} style={btnPrimary}><Settings2 size={13} /> Manage Categories</button>
        </div>
      ) : (
      <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: "15.5px", fontWeight: 600, color: T.accent }}>{activeCategory.name}</h3>
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
                  <button onClick={() => setVisibility(Object.fromEntries(COLUMN_ORDER.map((k) => [k, true])))} style={{ ...btnGhost, width: "100%", justifyContent: "center", marginTop: "6px", fontSize: "12.5px", padding: "7px" }}>Show all</button>
                </div>
              </>
            )}
          </div>
          {!isInvestorView && activeCategory?.subCategories.length > 1 && <button onClick={() => setOrderingCategoryId(activeCategory.id)} style={btnGhost}>
            <ArrowUpDown size={14} /> Order categories
          </button>}
          <button onClick={downloadCSV} style={btnGhost}><FileSpreadsheet size={14} /> Spreadsheet</button>
          <button onClick={() => { window.location.href = "/raps-actions"; }} style={btnGhost}>
            <ClipboardList size={14} /> Performance Overview <ExternalLink size={11} />
          </button>
          {!isInvestorView && <button onClick={() => setAddFlow("choose")} style={btnPrimary}><Plus size={14} /> Add KPI/Data</button>}
        </div>
      </div>

      <DateRangeControls fy={fy} onChange={range=>{setDateRange(range);setPeriod("custom");}}/>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
        <div style={{ display: "inline-flex", background: T.raised, borderRadius: "10px", padding: "3px", flexWrap: "wrap" }}>
          {PERIODS.map((p) => {
            const on = p.key === period;
            return (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                style={{ padding: "7px 13px", borderRadius: "8px", cursor: "pointer", fontSize: "13px",
                  fontWeight: 600, border: "none", fontFamily: "inherit",
                  background: on ? T.bg : "transparent", color: on ? T.accent : T.body,
                  boxShadow: on ? "0 1px 3px rgba(45,32,28,0.14)" : "none" }}>
                {p.label}
              </button>
            );
          })}
        </div>
        <span style={{ fontSize: "12.5px", color: T.muted }}>
          Showing {PERIOD_PREFIX[period]} budget, actual and variance
        </span>
      </div>

      <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "12px", overflow: "hidden", background: T.bg }}>
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
                const { kpi, subCategoryName, categoryName, status, variance, values } = row;
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
                    {cell("frequency", <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "999px", background: T.raised, color: T.body, fontWeight: 500 }}>{kpi.frequency}</span>)}
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
                          <button onClick={() => setActionKpi({ kpi, subCategoryName, categoryName })}
                            style={iconBtn(status.color)} title={`Add action (${status.label})`}><Plus size={16} /></button>
                        )}
                        <button onClick={() => setNotesKpi(kpi)} style={iconBtn(kpi.notes ? T.amber : T.body)} title="Notes"><StickyNote size={16} /></button>
                        {!isInvestorView && (
                          <button onClick={() => deleteKpi(kpi.id)} style={iconBtn(T.red)} title="Delete KPI"><Trash2 size={16} /></button>
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
          <span>{activeCategory.subCategories.length} sub-categories · all figures in each row use that row's Units</span>
          <span style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><CheckCircle2 size={13} color={T.green} /> On budget</span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><AlertTriangle size={13} color={T.amber} /> Needs attention</span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><XCircle size={13} color={T.red} /> Critical</span>
          </span>
        </div>
      </div>
      </> 
      )}

      {infoKpi && <KpiInfoModal kpi={infoKpi} readOnly={isInvestorView} onClose={() => setInfoKpi(null)}
        onSave={(patch) => { updateKpi(infoKpi.id, patch); setInfoKpi({ ...infoKpi, ...patch }); notify("success", "KPI details updated."); }} />}

      {chartKpi && <TrendChartModal kpi={structure.flatMap(c=>c.subCategories.flatMap(sub=>sub.kpis)).find(k=>k.id===chartKpi.id) || chartKpi} period={period} fy={fy} readOnly={isInvestorView} onClose={() => setChartKpi(null)}
        onSaveNote={(key, text) => {
          const notes = { ...(chartKpi.periodNotes || {}) };
          if (text.trim()) notes[key] = text.trim(); else delete notes[key];
          updateKpi(chartKpi.id, { periodNotes: notes });
          setChartKpi({ ...chartKpi, periodNotes: notes });
        }}
        onSaveChart={(chart) => { updateKpi(chartKpi.id, { chart }); setChartKpi({ ...chartKpi, chart }); }} />}

      {analysisKpi && <AnalysisModal kpi={analysisKpi} period={period} fy={fy} onClose={() => setAnalysisKpi(null)} />}

      {actionKpi && <AddActionModal kpi={actionKpi.kpi} period={period} fy={fy}
        categoryName={actionKpi.categoryName} subCategoryName={actionKpi.subCategoryName}
        userId={user?.uid} onClose={() => setActionKpi(null)}
        onSaved={(m) => notify("success", `Action added to "${m}" and Integrated Actions.`)} />}

      {notesKpi && <NotesModal kpi={notesKpi} readOnly={isInvestorView} onClose={() => setNotesKpi(null)}
        onSave={(notes) => { updateKpi(notesKpi.id, { notes }); setNotesKpi({ ...notesKpi, notes }); }} />}

      {!isInvestorView && orderingCategoryId && structure.some(category => category.id === orderingCategoryId) && <CategoryOrderModal
        key={orderingCategoryId}
        tab={{ ...structure.find(category => category.id === orderingCategoryId), categories: structure.find(category => category.id === orderingCategoryId).subCategories }}
        onClose={() => setOrderingCategoryId(null)}
        onSave={async order => {
          const previous = structure;
          const next = structure.map(category => category.id !== orderingCategoryId ? category : {
            ...category, subCategories: order.map(name => category.subCategories.find(sub => sub.name === name)).filter(Boolean),
          });
          try { await persist(next); notify("success", "Category order saved."); }
          catch (err) { setStructure(previous); throw err; }
        }} />}

      {manageCats && <ManageCategoriesModal structure={structure} notify={notify}
        onClose={() => setManageCats(false)} onSave={async next => {
          const previous = structure;
          try { await persist(next); }
          catch (err) { setStructure(previous); throw err; }
        }} />}

      {addFlow === "choose" && <AddChooser onClose={() => setAddFlow(null)} onPick={(k) => setAddFlow(k)}
        prefs={dataPrefs && structure.some((c) => c.id === dataPrefs.catId) ? dataPrefs : null} fy={fy} structure={structure} />}

      {addFlow === "data" && <AddDataWizard structure={structure} fy={fy} activeCategoryId={activeCategoryId}
        prefs={dataPrefs && structure.some((c) => c.id === dataPrefs.catId) ? dataPrefs : null}
        onSavePrefs={savePrefs} onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
        onSave={persist} />}

      {addFlow === "kpi" && <AddKpiWizard structure={structure} categoryId={activeCategory?.id}
        onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
        onSave={async (next) => { await persist(next); notify("success", "KPI created."); }} />}

      {showSpreadsheet && <SpreadsheetDownloadModal structure={structure} activeTabId={activeCategoryId} fy={fy} period={period} onClose={()=>setShowSpreadsheet(false)}/>}
      {showReport && <OperationalReportGenerator 
        structure={structure} 
        fy={fy} 
        period={period}
        userId={user?.uid}
        userName={userName}
        onClose={() => setShowReport(false)} 
      />}
    </div>
  );
};

export default OperationalPerformance;