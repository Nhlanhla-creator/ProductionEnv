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
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

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

const PERIODS = [
  { key: "week", label: "This week" }, { key: "month", label: "This month" },
  { key: "quarter", label: "This quarter" }, { key: "year", label: "This year" },
];
const PERIOD_LABEL = { week: "This week", month: "This month", quarter: "This quarter", year: "This year" };
const PERIOD_PREFIX = { week: "Weekly", month: "Monthly", quarter: "Quarterly", year: "Annual" };

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

/* `bare` drops the unit marker — the table has its own Units column, so
   repeating it in every cell is noise. Charts and tooltips keep it. */
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

/* ─── KPI model ─────────────────────────────────────────────────────────── */
/* v2: Budget draws as circles only — the line was reading as a second series
   competing with the bars. Bumping the version resets saved chart prefs once
   so existing KPIs pick up the new default. */
const CHART_VERSION = 2;
const DEFAULT_CHART = {
  v: CHART_VERSION,
  actualType: "bar", budgetType: "scatter", varianceType: "scatter",
  actualColor: "#1e40af", budgetColor: "#4a352f", showValues: true, showAxis: false,
};

const mkKpi = (o) => ({
  id: uid(), name: o.name, units: o.units, frequency: o.frequency || "Monthly",
  direction: o.direction || "higher", aggregate: o.aggregate || "avg",
  percentFormat: o.percentFormat || "whole",
  meaning: o.meaning || "", measured: o.measured || "",
  notes: "", periodNotes: {}, chart: { ...DEFAULT_CHART }, entries: o.entries || {},
});

const seedEntries = (sy, sm, budget, base, swing, aggregate) => {
  const out = {};
  fyMonths(sy, sm).forEach((m, i) => {
    out[m.key] = { budget, actual: Math.round((base + Math.sin(i * 0.9) * swing + (i / 11) * swing * 0.4) * 100) / 100 };
  });
  const wDiv = aggregate === "sum" ? 4.33 : 1;
  fyWeeks(sy, sm).forEach((w, i) => {
    const drift = base + Math.sin(i * 0.42) * swing + (i / 51) * swing * 0.4;
    out[w.key] = { budget: Math.round((budget / wDiv) * 100) / 100, actual: Math.round((drift / wDiv) * 100) / 100 };
  });
  return out;
};

const buildDefaultStructure = (sy, sm) => [
  { id: "supply-chain", name: "Supply Chain", notes: "", subCategories: [
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
  { id: "delivery", name: "Delivery", notes: "", subCategories: [
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
  { id: "safety", name: "Safety", notes: "", subCategories: [
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
const resolveMonth = (kpi, year, month) => {
  const mk = `M:${year}-${String(month + 1).padStart(2, "0")}`;
  const direct = kpi.entries?.[mk];
  if (direct && (Number.isFinite(direct.actual) || Number.isFinite(direct.budget))) return direct;
  const rows = Object.entries(kpi.entries || {}).filter(([k]) => {
    if (!k.startsWith("W:") && !k.startsWith("D:")) return false;
    const d = new Date(k.slice(2));
    return d.getFullYear() === year && d.getMonth() === month;
  }).map(([, v]) => v);
  if (!rows.length) return { actual: null, budget: null };
  return { actual: rollUp(rows.map((r) => Number(r.actual)), kpi.aggregate),
           budget: rollUp(rows.map((r) => Number(r.budget)), kpi.aggregate) };
};

const periodValues = (kpi, period, fy) => {
  const { startYear, startMonth } = fy, now = new Date();
  if (period === "week") {
    const e = kpi.entries?.[currentWeekKey()];
    if (e) return { actual: parseNum(e.actual), budget: parseNum(e.budget) };
    const ws = new Date(currentWeekKey().slice(2));
    const we = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + 7);
    const rows = Object.entries(kpi.entries || {}).filter(([k]) => k.startsWith("D:"))
      .filter(([k]) => { const d = new Date(k.slice(2)); return d >= ws && d < we; }).map(([, v]) => v);
    if (!rows.length) return { actual: null, budget: null };
    return { actual: rollUp(rows.map((r) => Number(r.actual)), kpi.aggregate),
             budget: rollUp(rows.map((r) => Number(r.budget)), kpi.aggregate) };
  }
  if (period === "month") return resolveMonth(kpi, now.getFullYear(), now.getMonth());
  const months = fyMonths(startYear, startMonth);
  const elapsed = (l) => l.filter((m) => new Date(m.year, m.month, 1) <= new Date(now.getFullYear(), now.getMonth(), 1));
  if (period === "quarter") {
    const qs = fyQuarters(startYear, startMonth);
    const q = qs.find((qq) => qq.months.some((m) => m.year === now.getFullYear() && m.month === now.getMonth())) || qs[0];
    const rows = elapsed(q.months).map((m) => resolveMonth(kpi, m.year, m.month));
    return { actual: rollUp(rows.map((r) => Number(r.actual)), kpi.aggregate),
             budget: rollUp(rows.map((r) => Number(r.budget)), kpi.aggregate) };
  }
  const rows = elapsed(months).map((m) => resolveMonth(kpi, m.year, m.month));
  return { actual: rollUp(rows.map((r) => Number(r.actual)), kpi.aggregate),
           budget: rollUp(rows.map((r) => Number(r.budget)), kpi.aggregate) };
};

/* ─── Status ────────────────────────────────────────────────────────────── */
const S = {
  green: { key: "green", label: "On budget", color: T.green, bg: T.greenBg },
  amber: { key: "amber", label: "Needs attention", color: T.amber, bg: T.amberBg },
  red: { key: "red", label: "Critical", color: T.red, bg: T.redBg },
  none: { key: "none", label: "No data", color: T.faint, bg: T.raised },
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
    return a <= 0 ? S.green : a <= 1 ? S.amber : S.red;
  }
  const ratio = kpi.direction === "higher" ? a / b : b / (a || 0.0001);
  return ratio >= 0.98 ? S.green : ratio >= 0.85 ? S.amber : S.red;
};
const getStatus = (kpi, period, fy) => {
  const { budget, actual } = periodValues(kpi, period, fy);
  return statusFromPair(kpi, budget, actual);
};
const getVariance = (kpi, period, fy) => {
  const { budget, actual } = periodValues(kpi, period, fy);
  const b = Number(budget), a = Number(actual);
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

/* ─── Columns. Numeric columns are centred and unit-free. ────────────────── */
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

/* Value labels drawn on the canvas, so the charts can stand without axes. */
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

/* ─── Analysis text ─────────────────────────────────────────────────────── */
const localAnalysis = (kpi, period, v, fy) => {
  const status = statusFromPair(kpi, v.budget, v.actual);
  const variance = Number.isFinite(Number(v.budget)) && Number.isFinite(Number(v.actual)) ? Number(v.actual) - Number(v.budget) : null;
  const fav = varianceFavourable(kpi, variance);
  return {
    observations: [
      `${PERIOD_LABEL[period]} actual sits at ${fmtValue(v.actual, kpi)} against a budget of ${fmtValue(v.budget, kpi)}.`,
      variance === null ? "Variance cannot be computed — either the budget or the actual is missing."
        : `That is a ${fav ? "favourable" : "unfavourable"} variance of ${fmtValue(Math.abs(variance), kpi)}.`,
      `Captured ${kpi.frequency.toLowerCase()} on a financial year starting ${MONTHS[fy.startMonth]}.`,
      `${DIRECTIONS.find((d) => d.value === kpi.direction)?.label} for this KPI.`,
    ],
    trends: status.key === "green"
      ? ["Performance is holding inside tolerance, which points to a stable underlying process.",
         "Watch the period-to-period spread rather than the headline — a stable average can hide widening swings."]
      : status.key === "amber"
        ? ["The metric has drifted outside tolerance but not far. This reads as drift rather than a break.",
           "Two or three more periods at this level would move it into critical territory."]
        : ["The gap to budget is wide enough that a single-period correction is unlikely to close it.",
           "Treat the trend as broken rather than noisy until two consecutive periods recover."],
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

/* The table's icon opens the summary — all four timeframes read together,
   which is a different question from "how is this month going". */
const summaryAnalysis = (kpi, fy) => {
  const rows = PERIODS.map((p) => {
    const v = periodValues(kpi, p.key, fy);
    return { key: p.key, label: p.label, v, status: statusFromPair(kpi, v.budget, v.actual),
      variance: Number.isFinite(Number(v.budget)) && Number.isFinite(Number(v.actual)) ? Number(v.actual) - Number(v.budget) : null };
  });
  const withData = rows.filter((r) => r.status.key !== "none");
  const reds = withData.filter((r) => r.status.key === "red");
  const greens = withData.filter((r) => r.status.key === "green");
  const wk = rows.find((r) => r.key === "week"), yr = rows.find((r) => r.key === "year");

  return {
    observations: [
      ...withData.map((r) => `${r.label}: ${fmtValue(r.v.actual, kpi)} against ${fmtValue(r.v.budget, kpi)} — ${r.status.label.toLowerCase()}.`),
      withData.length === 0 ? "No timeframe has both a budget and an actual yet." : `${withData.length} of 4 timeframes have complete data.`,
    ],
    trends: withData.length < 2 ? ["Not enough timeframes with data to compare short-term against long-term."]
      : [
        wk?.status.key !== "none" && yr?.status.key !== "none" && wk.status.key !== yr.status.key
          ? `The week and the year disagree — ${wk.status.label.toLowerCase()} this week against ${yr.status.label.toLowerCase()} for the year, so treat one of them as the outlier rather than the trend.`
          : "Short and long timeframes are telling the same story, which makes the signal more trustworthy.",
        greens.length === withData.length ? "Every timeframe is inside tolerance."
          : reds.length === withData.length ? "Every timeframe is critical — this is structural, not a bad period."
          : "The picture is mixed across timeframes; the shorter ones move first, so watch those for the turn.",
      ],
    issues: reds.length === 0 && withData.every((r) => r.status.key === "green")
      ? ["No timeframe is outside tolerance."]
      : [
        ...reds.map((r) => `${r.label} is critical${r.variance === null ? "" : ` — off by ${fmtValue(Math.abs(r.variance), kpi)}`}.`),
        ...withData.filter((r) => r.status.key === "amber").map((r) => `${r.label} needs attention.`),
      ],
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
        // "not-found" means the Cloud Function isn't deployed — a different fix
        // from a permissions error, so name it.
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
          {loading ? "Reviewing…" : source === "ai" ? `Generated from your KPI data · ${scope === "summary" ? "all timeframes" : PERIOD_LABEL[period]}`
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

/* ════════════════════════════════════════════════════════════════════════════
   Trend chart — one card. The variance band floats above the plot with no
   axes of its own, pulled down onto the main chart so it reads as a top layer
   rather than a competing second chart.
   ════════════════════════════════════════════════════════════════════════ */
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

  /* Anything saved before v2 is ignored rather than merged, so the old
     line-style Budget doesn't survive the change. */
  const prefs = kpi.chart?.v === CHART_VERSION ? { ...DEFAULT_CHART, ...kpi.chart } : { ...DEFAULT_CHART };

  const { labels, actual, budget, noteKey, caption } = useMemo(() => {
    const { startYear, startMonth } = fy;
    if (period === "week") {
      const weeks = fyWeeks(startYear, startMonth);
      const idx = Math.max(weeks.findIndex((w) => w.key === currentWeekKey()), 0);
      const slice = weeks.slice(Math.max(0, idx - 11), idx + 1);
      return { labels: slice.map((w) => w.label),
        actual: slice.map((w) => parseNum(kpi.entries?.[w.key]?.actual)),
        budget: slice.map((w) => parseNum(kpi.entries?.[w.key]?.budget)),
        noteKey: currentWeekKey(), caption: `Weeks of FY ${fyLabel(startYear, startMonth)}` };
    }
    if (period === "quarter") {
      const qs = fyQuarters(startYear, startMonth);
      const rows = qs.map((q) => {
        const ms = q.months.map((m) => resolveMonth(kpi, m.year, m.month));
        return { actual: rollUp(ms.map((r) => Number(r.actual)), kpi.aggregate),
                 budget: rollUp(ms.map((r) => Number(r.budget)), kpi.aggregate) };
      });
      return { labels: qs.map((q) => `${q.label} ${fyLabel(startYear, startMonth)}`),
        actual: rows.map((r) => r.actual), budget: rows.map((r) => r.budget),
        noteKey: `Q:${startYear}`, caption: `Quarters of FY ${fyLabel(startYear, startMonth)}` };
    }
    const months = fyMonths(startYear, startMonth);
    const rows = months.map((m) => resolveMonth(kpi, m.year, m.month));
    return { labels: months.map((m) => m.label),
      actual: rows.map((r) => parseNum(r.actual)), budget: rows.map((r) => parseNum(r.budget)),
      noteKey: currentMonthKey(), caption: `FY ${fyLabel(startYear, startMonth)} · ${months[0].long} → ${months[11].long}` };
  }, [kpi, period, fy]);

  const variance = actual.map((a, i) => (Number.isFinite(a) && Number.isFinite(budget[i]) ? a - budget[i] : null));

  useEffect(() => { setNoteText(kpi.periodNotes?.[noteKey] || ""); setNoteState("idle"); }, [noteKey, kpi.id]); // eslint-disable-line

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

  /* The variance strip carries no axes and no legend of its own. */
  const varianceData = { labels, datasets: [
    { label: "Variance", ...buildSeries(prefs.varianceType, variance, varColors), __signed: true, __labelColor: T.body },
  ]};
  const varianceOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    layout: { padding: { top: prefs.showValues ? 20 : 6, bottom: 0 } },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: T.ink, padding: 10, cornerRadius: 8,
        callbacks: { title: (items) => labels[items[0].dataIndex],
          label: (c) => c.parsed.y === null || c.parsed.y === undefined ? "Variance: no data"
            : `Variance: ${fmtValue(c.parsed.y, kpi, { signed: true })} (${varianceFavourable(kpi, c.parsed.y) ? "favourable" : "unfavourable"})` } },
    },
    scales: {
      y: { display: false, grid: { display: false } },
      x: { display: false, grid: { display: false }, offset: prefs.varianceType === "bar" },
    },
  };

  const mainData = { labels, datasets: [
    { label: "Budget", ...buildSeries(prefs.budgetType, budget, prefs.budgetColor), order: 1, __labelColor: prefs.budgetColor },
    { label: "Actual", ...buildSeries(prefs.actualType, actual, prefs.actualColor), order: 2, __labelColor: prefs.actualColor },
  ]};
  const mainOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    layout: { padding: { top: prefs.showValues ? 20 : 6 } },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: T.ink, padding: 11, cornerRadius: 8,
        callbacks: { label: (c) => c.parsed.y === null || c.parsed.y === undefined ? `${c.dataset.label}: no data`
          : `${c.dataset.label}: ${fmtValue(c.parsed.y, kpi)}` } },
    },
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
            <div>
              <label style={labelS}>Actual as</label>
              <select value={prefs.actualType} onChange={(e) => setPref({ actualType: e.target.value })} style={selectS}>
                {CHART_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelS}>Budget as</label>
              <select value={prefs.budgetType} onChange={(e) => setPref({ budgetType: e.target.value })} style={selectS}>
                {CHART_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelS}>Variance as</label>
              <select value={prefs.varianceType} onChange={(e) => setPref({ varianceType: e.target.value })} style={selectS}>
                {CHART_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelS}>Show</label>
              <select value={`${prefs.showValues}|${prefs.showAxis}`}
                onChange={(e) => { const [v, a] = e.target.value.split("|"); setPref({ showValues: v === "true", showAxis: a === "true" }); }}
                style={selectS}>
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
            <div style={{ fontSize: "12px", color: T.muted, alignSelf: "flex-end", paddingBottom: "3px" }}>
              Variance keeps green/red — the colour is the verdict, not decoration.
            </div>
          </div>
        </div>
      )}

      {/* One card, two canvases. The variance band overlaps the top of the
          main chart so it reads as part of it. */}
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

/* ─── Add Action ────────────────────────────────────────────────────────── */
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
    description: `${PERIOD_LABEL[period]} actual ${fmtValue(v.actual, kpi)} against budget ${fmtValue(v.budget, kpi)}${
      variance === null ? "" : ` (variance ${fmtValue(variance, kpi, { signed: true })})`}. Raised from ${categoryName} · ${subCategoryName}.`,
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
      <textarea rows="9" value={notes} readOnly={readOnly} onChange={(e) => change(e.target.value)}
        style={{ ...inputS, resize: "vertical" }} />
    </Modal>
  );
};

/* ─── Manage categories — hide or delete ────────────────────────────────── */
const ManageCategoriesModal = ({ structure, onClose, onSave, notify }) => {
  const [confirmId, setConfirmId] = useState(null);
  const toggleHidden = (id) => onSave(structure.map((c) => (c.id === id ? { ...c, hidden: !c.hidden } : c)));
  const remove = (id) => {
    const cat = structure.find((c) => c.id === id);
    onSave(structure.filter((c) => c.id !== id));
    setConfirmId(null);
    notify("success", `"${cat?.name}" deleted.`);
  };
  const kpiCount = (c) => c.subCategories.reduce((s, sub) => s + sub.kpis.length, 0);

  return (
    <Modal title="Categories" subtitle="Hide a category to take it off the dashboard, or delete it outright"
      icon={<Settings2 size={17} />} onClose={onClose} width={620}
      footer={<button onClick={onClose} style={btnPrimary}>Done</button>}>
      {structure.map((c) => (
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

/* ─── Add Data — autosaving ─────────────────────────────────────────────── */
const deriveFrequency = (category) => {
  const kpis = category?.subCategories.flatMap((s) => s.kpis) || [];
  if (!kpis.length) return { frequency: "Monthly", mixed: false };
  const tally = {};
  kpis.forEach((k) => {
    // Quarterly KPIs are still captured monthly and rolled up.
    const f = k.frequency === "Quarterly" ? "Monthly" : k.frequency;
    tally[f] = (tally[f] || 0) + 1;
  });
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  return { frequency: sorted[0][0], mixed: sorted.length > 1 };
};

const AddDataWizard = ({ structure, fy, prefs, onSavePrefs, onBack, onClose, onSave }) => {
  const visible = structure.filter((c) => !c.hidden);
  const [catId, setCatId] = useState(prefs?.catId && visible.some((c) => c.id === prefs.catId) ? prefs.catId : visible[0]?.id);
  const [startYear, setStartYear] = useState(prefs?.startYear ?? fy.startYear);
  const category = structure.find((c) => c.id === catId) || visible[0];
  const derived = useMemo(() => deriveFrequency(category), [category]);
  const [frequency, setFrequency] = useState(prefs?.frequency || derived.frequency);
  const [freqOverridden, setFreqOverridden] = useState(!!prefs?.frequency);
  const [monthForDays, setMonthForDays] = useState(new Date().getMonth());
  const [periodKey, setPeriodKey] = useState(null);
  const [draft, setDraft] = useState({});
  const [saveState, setSaveState] = useState("idle");
  const timer = useRef(null);
  const structureRef = useRef(structure);
  useEffect(() => { structureRef.current = structure; }, [structure]);

  useEffect(() => { if (!freqOverridden) setFrequency(derived.frequency); }, [catId, derived.frequency, freqOverridden]);

  const yearOptions = [
    { value: fy.startYear - 1, badge: "FY−", label: fyLabel(fy.startYear - 1, fy.startMonth) },
    { value: fy.startYear,     badge: "FY",  label: fyLabel(fy.startYear, fy.startMonth) },
    { value: fy.startYear + 1, badge: "FY+", label: fyLabel(fy.startYear + 1, fy.startMonth) },
  ];

  const periods = useMemo(() => {
    if (frequency === "Monthly") return fyMonths(startYear, fy.startMonth).map((m) => ({ key: m.key, label: m.long }));
    if (frequency === "Weekly") return fyWeeks(startYear, fy.startMonth).map((w) => ({ key: w.key, label: `${w.label}  ·  ${w.short}` }));
    const list = fyMonths(startYear, fy.startMonth);
    const m = list.find((x) => x.month === monthForDays) || list[0];
    return daysInMonth(m.year, m.month).map((d) => ({ key: d.key, label: d.label }));
  }, [frequency, startYear, fy.startMonth, monthForDays]);

  useEffect(() => {
    if (!periods.length) { setPeriodKey(null); return; }
    if (periods.some((p) => p.key === periodKey)) return;
    const todayKey = frequency === "Weekly" ? currentWeekKey() : frequency === "Monthly" ? currentMonthKey() : `D:${isoDate(new Date())}`;
    setPeriodKey(periods.find((p) => p.key === todayKey)?.key || periods[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periods, frequency]);

  const periodIndex = periods.findIndex((p) => p.key === periodKey);
  const kpis = useMemo(() => category?.subCategories.flatMap((s) => s.kpis.map((k) => ({ ...k, sub: s.name }))) || [], [category]);

  const value = (kpiId, field) => {
    const d = draft[kpiId]?.[periodKey];
    if (d && d[field] !== undefined) return d[field];
    return kpis.find((k) => k.id === kpiId)?.entries?.[periodKey]?.[field] ?? "";
  };

  const merge = (currentStructure, rows) => currentStructure.map((cat) => cat.id !== category.id ? cat : {
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
  });

  /* Figures save themselves as they're typed, so stepping to the next period
     can't quietly drop what was just entered. */
  const setValue = (kpiId, field, raw) => {
    const next = { ...draft, [kpiId]: { ...(draft[kpiId] || {}), [periodKey]: { ...(draft[kpiId]?.[periodKey] || {}), [field]: raw } } };
    setDraft(next);
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await onSave(merge(structureRef.current, next), { silent: true });
      onSavePrefs({ catId, startYear, frequency: freqOverridden ? frequency : null });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1800);
    }, 800);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const cell = { ...inputS, padding: "7px 9px", textAlign: "center", fontSize: "13.5px", minHeight: "34px" };
  const th = { padding: "9px 12px", fontSize: "11.5px", fontWeight: 700, color: "#fff", textTransform: "uppercase",
    letterSpacing: "0.5px", background: T.header, whiteSpace: "nowrap", position: "sticky", top: 0, zIndex: 2, verticalAlign: "top" };

  if (!category) {
    return (
      <Modal title="Add Data" icon={<Database size={17} />} onClose={onClose} width={520}
        footer={<button onClick={onClose} style={btnPrimary}>Close</button>}>
        <p style={{ fontSize: "14px", color: T.body, margin: 0 }}>Every category is hidden. Unhide one under Categories first.</p>
      </Modal>
    );
  }

  return (
    <Modal title="Add Data" subtitle={`Financial year starts in ${MONTHS[fy.startMonth]}`} icon={<Database size={17} />}
      onClose={onClose} width={760}
      footer={<>
        <button onClick={onBack} style={btnGhost}><ArrowLeft size={13} /> Back</button>
        <span style={{ flex: 1, fontSize: "12.5px", color: saveState === "saved" ? T.green : T.muted, textAlign: "left" }}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Everything saves automatically"}
        </span>
        <button onClick={onClose} style={btnPrimary}>Done</button>
      </>}>

      <div style={{ display: "grid", gridTemplateColumns: frequency === "Daily" ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div>
          <label style={labelS}>Financial year</label>
          <select value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} style={selectS}>
            {yearOptions.map((y) => <option key={y.value} value={y.value}>{y.badge} {y.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelS}>Category</label>
          <select value={catId} onChange={(e) => setCatId(e.target.value)} style={selectS}>
            {visible.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelS}>Enter by</label>
          <select value={frequency}
            onChange={(e) => { setFrequency(e.target.value); setFreqOverridden(e.target.value !== derived.frequency); }} style={selectS}>
            {CAPTURE_FREQUENCIES.map((f) => <option key={f} value={f}>{f}{f === derived.frequency ? " (your KPIs)" : ""}</option>)}
          </select>
        </div>
        {frequency === "Daily" && (
          <div>
            <label style={labelS}>Month</label>
            <select value={monthForDays} onChange={(e) => setMonthForDays(Number(e.target.value))} style={selectS}>
              {fyMonths(startYear, fy.startMonth).map((m) => <option key={m.key} value={m.month}>{m.long}</option>)}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "12px" }}>
        <div style={{ flex: 1 }}>
          <label style={labelS}>Period · {periods.length} in FY {fyLabel(startYear, fy.startMonth)}</label>
          <select value={periodKey || ""} onChange={(e) => setPeriodKey(e.target.value)} style={selectS}>
            {periods.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <button onClick={() => setPeriodKey(periods[Math.max(0, periodIndex - 1)]?.key)} disabled={periodIndex <= 0}
          style={{ ...btnGhost, padding: "9px 11px", opacity: periodIndex <= 0 ? 0.4 : 1 }}><ChevronLeft size={14} /></button>
        <button onClick={() => setPeriodKey(periods[Math.min(periods.length - 1, periodIndex + 1)]?.key)} disabled={periodIndex >= periods.length - 1}
          style={{ ...btnGhost, padding: "9px 11px", opacity: periodIndex >= periods.length - 1 ? 0.4 : 1 }}><ChevronRight size={14} /></button>
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
              {kpis.map((k, i) => (
                <tr key={k.id} style={{ background: i % 2 ? T.panel : T.bg }}>
                  <td style={{ padding: "7px 12px", fontSize: "13.5px", color: T.ink,
                    borderBottom: `1px solid ${T.lineSoft}`, borderRight: `1px solid ${T.lineSoft}` }}>
                    <div style={{ fontWeight: 600 }}>{k.name}</div>
                    <div style={{ fontSize: "11.5px", color: T.muted }}>{k.sub} · {k.units} · {k.frequency}</div>
                  </td>
                  <td style={{ padding: "4px 8px", borderBottom: `1px solid ${T.lineSoft}`, borderRight: `1px solid ${T.lineSoft}` }}>
                    <input type="number" step="any" value={value(k.id, "actual")} placeholder="—"
                      onChange={(e) => setValue(k.id, "actual", e.target.value)} style={cell} />
                  </td>
                  <td style={{ padding: "4px 8px", borderBottom: `1px solid ${T.lineSoft}` }}>
                    <input type="number" step="any" value={value(k.id, "budget")} placeholder="—"
                      onChange={(e) => setValue(k.id, "budget", e.target.value)} style={cell} />
                  </td>
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

  useEffect(() => { if (!creatingCategory && subs.length && !subChoice) setSubChoice(subs[0].name); }, [catId]); // eslint-disable-line

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
      ? [...structure, { id: `cat_${uid().slice(0,8)}`, name: newCategoryName.trim(), notes: "", subCategories: [{ name: subName, kpis: [kpi] }] }]
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
const PREFS_KEY = "opPerf.addData.prefs";

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
  const [period, setPeriod] = useState("month");

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
    }
  };

  const updateKpi = (kpiId, patch) =>
    persist(structure.map((cat) => ({ ...cat,
      subCategories: cat.subCategories.map((sub) => ({ ...sub,
        kpis: sub.kpis.map((k) => (k.id === kpiId ? { ...k, ...patch } : k)) })) })));

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
    return ["all", ...Array.from(set).sort()];
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
      // Sub-category leads so the merged Category cell stays contiguous.
      if (a.subCategoryName !== b.subCategoryName) return a.subCategoryName.localeCompare(b.subCategoryName);
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

  const downloadCSV = () => {
    const p = PERIOD_PREFIX[period];
    const lines = [["Category","Sub-Category","KPI","Units","Frequency", `${p} Budget`, `${p} Actual`, `${p} Variance`, "Status"]];
    (structure || []).forEach((cat) => cat.subCategories.forEach((sub) => sub.kpis.forEach((kpi) => {
      const v = periodValues(kpi, period, fy);
      lines.push([cat.name, sub.name, `"${kpi.name}"`, kpi.units, kpi.frequency,
        v.budget ?? "", v.actual ?? "", getVariance(kpi, period, fy) ?? "", getStatus(kpi, period, fy).label]);
    })));
    const blob = new Blob([lines.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `operational-performance-${period}-FY${fyLabel(fy.startYear, fy.startMonth).replace("/","-")}.csv`; a.click();
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

  if (loading || !structure) {
    return <div style={{ padding: "80px", textAlign: "center", color: T.body, fontSize: "14px" }}>Loading operational performance...</div>;
  }

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
              <li>The lightbulb in the table reads all four timeframes together</li>
              <li>Categories lets you hide or delete a whole category</li>
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
          <button onClick={() => setManageCats(true)} title="Hide or delete a category"
            style={{ ...btnQuiet, marginLeft: "auto", marginBottom: "4px", padding: "6px 12px", fontSize: "12.5px", color: T.muted }}>
            <Settings2 size={13} /> Categories
          </button>
        )}
      </div>

      {!activeCategory ? (
        <div style={{ ...cardS, textAlign: "center", padding: "50px 20px" }}>
          <p style={{ fontSize: "14.5px", color: T.body, margin: "0 0 12px" }}>Every category is hidden right now.</p>
          <button onClick={() => setManageCats(true)} style={btnPrimary}><Settings2 size={13} /> Manage categories</button>
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
          Showing {PERIOD_PREFIX[period].toLowerCase()} budget, actual and variance
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
                      {/* Every header starts at the top; two-line ones simply
                          run further down rather than pushing the rest around. */}
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

      {chartKpi && <TrendChartModal kpi={chartKpi} period={period} fy={fy} readOnly={isInvestorView} onClose={() => setChartKpi(null)}
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

      {manageCats && <ManageCategoriesModal structure={structure} notify={notify}
        onClose={() => setManageCats(false)} onSave={(next) => persist(next)} />}

      {addFlow === "choose" && <AddChooser onClose={() => setAddFlow(null)} onPick={(k) => setAddFlow(k)}
        prefs={dataPrefs && structure.some((c) => c.id === dataPrefs.catId) ? dataPrefs : null} fy={fy} structure={structure} />}

      {addFlow === "data" && <AddDataWizard structure={structure} fy={fy}
        prefs={dataPrefs && structure.some((c) => c.id === dataPrefs.catId) ? dataPrefs : null}
        onSavePrefs={savePrefs} onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
        onSave={persist} />}

      {addFlow === "kpi" && <AddKpiWizard structure={structure} categoryId={activeCategory?.id}
        onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
        onSave={async (next) => { await persist(next); notify("success", "KPI created."); }} />}
    </div>
  );
};

export default OperationalPerformance;