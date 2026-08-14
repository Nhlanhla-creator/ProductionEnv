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
  ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, ChevronRight, Check,
  CheckCircle2, AlertTriangle, XCircle, ClipboardList, Download, RefreshCw, Columns3,
  ExternalLink, Square, CheckSquare, ArrowLeft, Calendar, Users, SlidersHorizontal,
  Database, Sparkles,
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const functions = getFunctions();

/* Warm, darker greys — neutral greys washed out badly against white. */
const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", faint: "#8a7a74",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#4a352f", accentSoft: "#6b4f47", accentTint: "#f4efec",
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
  { key: "quarter", label: "Quarter" }, { key: "year", label: "This year" },
];
const PERIOD_LABEL = { week: "This week", month: "This month", quarter: "Quarter", year: "This year" };
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

const fyWeeks = (sy, sm) => {
  const start = new Date(sy, sm, 1), end = new Date(sy + 1, sm, 0);
  const cur = new Date(start);
  cur.setDate(cur.getDate() - ((cur.getDay() + 6) % 7));
  const out = []; let n = 1;
  while (cur <= end) {
    const wEnd = new Date(cur); wEnd.setDate(wEnd.getDate() + 6);
    out.push({ key: `W:${isoDate(cur)}`, label: `W${n}`,
      range: `${String(cur.getDate()).padStart(2,"0")} ${MONTHS[cur.getMonth()]} – ${String(wEnd.getDate()).padStart(2,"0")} ${MONTHS[wEnd.getMonth()]}`,
      start: new Date(cur), end: wEnd, index: n - 1 });
    cur.setDate(cur.getDate() + 7); n++;
  }
  return out;
};

const daysInMonth = (year, month) =>
  Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return { key: `D:${isoDate(d)}`, label: `${String(d.getDate()).padStart(2,"0")} ${MONTHS[d.getMonth()]}`, date: d, index: i };
  });

const currentWeekKey = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return `W:${isoDate(d)}`; };
const currentMonthKey = () => { const d = new Date(); return `M:${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };

/* ─── Formatting. en-US gives "R 125,000" and "1,250"; en-ZA gives
   "125 000" and "0,3". ─────────────────────────────────────────────────── */
const LOCALE = "en-US";
const trimNum = (n) => {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n), dp = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return Number(n.toFixed(dp)).toLocaleString(LOCALE, { maximumFractionDigits: dp });
};
const fmtValue = (raw, kpi, { signed = false } = {}) => {
  if (raw === null || raw === undefined || raw === "") return "—";
  let n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  const sign = signed && n > 0 ? "+" : "";
  if (kpi?.units === "%") { if (kpi.percentFormat === "fraction") n *= 100; return `${sign}${trimNum(n)}%`; }
  if (kpi?.units === "R") {
    const dp = Math.abs(n) >= 1000 ? 0 : 2;
    return `${sign}R ${n.toLocaleString(LOCALE, { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
  }
  const suffix = kpi?.units && !["#","%","R"].includes(kpi.units) ? ` ${kpi.units}` : "";
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

/* ─── KPI model ─────────────────────────────────────────────────────────── */
const mkKpi = (o) => ({
  id: uid(), name: o.name, units: o.units, frequency: o.frequency || "Monthly",
  direction: o.direction || "higher", aggregate: o.aggregate || "avg",
  percentFormat: o.percentFormat || "whole",
  definition: o.definition || "", calculation: o.calculation || "",
  notes: "", periodNotes: {}, entries: o.entries || {},
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
        definition: "Share of total procurement spend concentrated in the three largest suppliers.",
        calculation: "(Spend with top 3 suppliers ÷ total supplier spend) × 100.",
        entries: seedEntries(sy, sm, 70, 79, 3, "avg") }),
      mkKpi({ name: "Single Source Flags", units: "#", frequency: "Monthly", direction: "lower", aggregate: "sum",
        definition: "Critical inputs available from only one qualified supplier.",
        calculation: "Count of items where qualified supplier count = 1.",
        entries: seedEntries(sy, sm, 0, 1, 1, "sum") }),
      mkKpi({ name: "Critical Supplier Count", units: "#", frequency: "Monthly", direction: "lower", aggregate: "avg",
        definition: "Suppliers whose failure would halt or materially disrupt delivery.",
        calculation: "Count of suppliers tagged critical on the supplier register.",
        entries: seedEntries(sy, sm, 5, 16, 2, "avg") }),
    ]},
    { name: "Continuity Risk", kpis: [
      mkKpi({ name: "Lead Time Variance", units: "days", frequency: "Weekly", direction: "lower", aggregate: "avg",
        definition: "Spread between promised and actual supplier lead times.",
        calculation: "Actual lead time − quoted lead time, averaged across orders received.",
        entries: seedEntries(sy, sm, 2, 2.3, 0.5, "avg") }),
      mkKpi({ name: "Stock Cover Days", units: "days", frequency: "Weekly", direction: "higher", aggregate: "avg",
        definition: "How many days of demand current stock on hand can serve.",
        calculation: "Closing stock ÷ average daily usage.",
        entries: seedEntries(sy, sm, 30, 27, 4, "avg") }),
      mkKpi({ name: "Disruption Risk Index", units: "index", frequency: "Monthly", direction: "lower", aggregate: "avg",
        definition: "Composite score of supplier, logistics and geographic exposure.",
        calculation: "Weighted average of concentration, lead-time and geography sub-scores (0–100).",
        entries: seedEntries(sy, sm, 20, 23, 3, "avg") }),
    ]},
  ]},
  { id: "delivery", name: "Delivery", notes: "", subCategories: [
    { name: "Productivity", kpis: [
      mkKpi({ name: "Production Volume", units: "units", frequency: "Weekly", direction: "higher", aggregate: "sum",
        definition: "Total sellable output produced in the period.",
        calculation: "Sum of good units completed and accepted by QC.",
        entries: seedEntries(sy, sm, 10000, 12800, 900, "sum") }),
      mkKpi({ name: "Availability", units: "%", frequency: "Weekly", direction: "higher", aggregate: "avg",
        definition: "Share of planned production time equipment was available to run.",
        calculation: "(Planned time − unplanned downtime) ÷ planned time × 100.",
        entries: seedEntries(sy, sm, 95, 93, 2, "avg") }),
      mkKpi({ name: "Utilization", units: "%", frequency: "Weekly", direction: "higher", aggregate: "avg",
        definition: "Share of available capacity actually used.",
        calculation: "Actual run time ÷ available time × 100.",
        entries: seedEntries(sy, sm, 85, 85, 3, "avg") }),
      mkKpi({ name: "Unit Cost", units: "R", frequency: "Monthly", direction: "lower", aggregate: "avg",
        definition: "Fully loaded cost to produce one sellable unit.",
        calculation: "Total production cost ÷ good units produced.",
        entries: seedEntries(sy, sm, 50, 41, 4, "avg") }),
    ]},
    { name: "Reliability", kpis: [
      mkKpi({ name: "On-time Delivery", units: "%", frequency: "Weekly", direction: "higher", aggregate: "avg",
        definition: "Orders delivered on or before the promised date.",
        calculation: "(On-time deliveries ÷ total deliveries) × 100.",
        entries: seedEntries(sy, sm, 98, 96, 2, "avg") }),
      mkKpi({ name: "Rework Rate", units: "%", frequency: "Weekly", direction: "lower", aggregate: "avg",
        definition: "Output requiring rework before it can be shipped.",
        calculation: "(Units reworked ÷ units produced) × 100.",
        entries: seedEntries(sy, sm, 2, 1.1, 0.4, "avg") }),
      mkKpi({ name: "Defect Rate", units: "%", frequency: "Weekly", direction: "lower", aggregate: "avg",
        definition: "Output rejected at final inspection or returned by customers.",
        calculation: "(Defective units ÷ units produced) × 100.",
        entries: seedEntries(sy, sm, 1, 0.4, 0.2, "avg") }),
    ]},
  ]},
  { id: "safety", name: "Safety", notes: "", subCategories: [
    { name: "Safety Risk", kpis: [
      mkKpi({ name: "Safety Incidents", units: "#", frequency: "Weekly", direction: "lower", aggregate: "sum",
        definition: "Recordable safety incidents involving staff, contractors or visitors.",
        calculation: "Count of incidents logged on the incident register.",
        entries: seedEntries(sy, sm, 0, 0.4, 0.4, "sum") }),
      mkKpi({ name: "Open Safety Actions", units: "#", frequency: "Weekly", direction: "lower", aggregate: "avg",
        definition: "Corrective actions from incidents or inspections still outstanding.",
        calculation: "Count of safety actions with status not equal to closed.",
        entries: seedEntries(sy, sm, 5, 2, 1, "avg") }),
      mkKpi({ name: "Compliance Status", units: "%", frequency: "Monthly", direction: "higher", aggregate: "avg",
        definition: "Share of mandatory safety requirements currently met.",
        calculation: "(Requirements met ÷ total applicable requirements) × 100.",
        entries: seedEntries(sy, sm, 100, 99, 1, "avg") }),
    ]},
    { name: "Regulatory Compliance", kpis: [
      mkKpi({ name: "Regulatory Gaps", units: "#", frequency: "Monthly", direction: "lower", aggregate: "sum",
        definition: "Known areas of non-compliance with applicable regulation.",
        calculation: "Count of open gaps on the compliance register.",
        entries: seedEntries(sy, sm, 0, 0.3, 0.3, "sum") }),
      mkKpi({ name: "Audit Findings", units: "#", frequency: "Quarterly", direction: "lower", aggregate: "sum",
        definition: "Findings raised at the most recent internal or external audit.",
        calculation: "Count of findings not yet formally closed out.",
        entries: seedEntries(sy, sm, 3, 0.6, 0.5, "sum") }),
      mkKpi({ name: "Certification Status", units: "%", frequency: "Monthly", direction: "higher", aggregate: "avg",
        definition: "Share of required certifications that are current and valid.",
        calculation: "(Valid certifications ÷ required certifications) × 100.",
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

const getStatus = (kpi, period, fy) => {
  const { budget, actual } = periodValues(kpi, period, fy);
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
const StatusIcon = ({ status, size = 18 }) => {
  const p = { size, color: status.color, strokeWidth: 2.2 };
  if (status.key === "green") return <CheckCircle2 {...p} />;
  if (status.key === "amber") return <AlertTriangle {...p} />;
  if (status.key === "red") return <XCircle {...p} />;
  return <Info {...p} />;
};

/* ─── Columns ───────────────────────────────────────────────────────────── */
const COLUMN_DEFS = {
  category:  { label: "Category", width: 168, tip: "The sub-category this KPI sits under.", filter: true, sort: true, hideable: true },
  kpi:       { label: "KPI", width: 258, tip: "The metric being tracked. Click the eye to read or edit its definition and calculation.", filter: true, sort: true, hideable: false },
  units:     { label: "Units", width: 90, align: "center", tip: "The unit the value is expressed in.", filter: true, sort: true, hideable: true },
  frequency: { label: "Frequency", width: 126, align: "center", tip: "How often this KPI is captured — daily, weekly, monthly or quarterly.", filter: true, sort: true, hideable: true },
  budget:    { label: "Budget", width: 142, align: "right", tip: "What you planned for the selected period.", sort: true, hideable: true },
  actual:    { label: "Actual", width: 142, align: "right", tip: "What was recorded for the selected period.", sort: true, hideable: true },
  variance:  { label: "Variance", width: 142, align: "right", tip: "Actual minus Budget. Green means favourable for this KPI's direction.", sort: true, hideable: true },
  status:    { label: "Status", width: 94, align: "center", tip: "Green: on budget. Amber: needs attention. Red: well outside budget.", filter: true, sort: true, hideable: true },
};
const COLUMN_ORDER = Object.keys(COLUMN_DEFS);
const ACTIONS_KEY = "__actions__";

/* Budget, Actual and Variance take the timeframe into their name. */
const columnLines = (key, period) =>
  ["budget","actual","variance"].includes(key) ? [PERIOD_PREFIX[period], COLUMN_DEFS[key].label] : [COLUMN_DEFS[key].label];

/* ─── Shared UI ─────────────────────────────────────────────────────────── */
const InfoTip = ({ text }) => {
  const [rect, setRect] = useState(null);
  if (!text) return null;
  return (
    <span style={{ display: "inline-flex" }}
      onMouseEnter={(e) => setRect(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setRect(null)}>
      <Info size={13} strokeWidth={2} color={T.faint} style={{ cursor: "help" }} />
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
const inputS = { width: "100%", padding: "10px 12px", border: `1px solid ${T.lineStrong}`, borderRadius: "8px",
  fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box", color: T.ink, background: T.bg, outline: "none" };
/* Every field label is dark brown — one voice across the section. */
const labelS = { display: "block", fontSize: "12.5px", fontWeight: 600, color: T.accent, marginBottom: "6px" };

const Modal = ({ title, subtitle, icon, onClose, children, width = 640, footer }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(45,32,28,0.55)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1400, padding: "20px" }}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: T.bg, borderRadius: "14px", width: "100%",
      maxWidth: `${width}px`, maxHeight: "92vh", display: "flex", flexDirection: "column",
      boxShadow: "0 24px 60px rgba(45,32,28,0.28)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 24px 16px", borderBottom: `1px solid ${T.line}` }}>
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
      <div style={{ padding: "22px 24px", overflowY: "auto", flex: 1 }}>{children}</div>
      {footer && <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.line}`, display: "flex",
        justifyContent: "flex-end", gap: "10px", alignItems: "center", background: T.panel, borderRadius: "0 0 14px 14px" }}>{footer}</div>}
    </div>
  </div>
);

const DIRECTIONS = [
  { value: "higher", label: "Higher is better", hint: "e.g. on-time delivery" },
  { value: "lower", label: "Lower is better", hint: "e.g. defect rate" },
  { value: "match", label: "Matching is better", hint: "e.g. headcount to plan" },
];

/* ─── KPI definition popup ──────────────────────────────────────────────── */
const KpiInfoModal = ({ kpi, onClose, onSave, readOnly }) => {
  const [editing, setEditing] = useState(false);
  const [definition, setDefinition] = useState(kpi.definition || "");
  const [calculation, setCalculation] = useState(kpi.calculation || "");
  const box = (v, empty) => (
    <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: "8px", padding: "13px 15px",
      fontSize: "14px", lineHeight: 1.65, color: v ? T.body : T.faint, fontStyle: v ? "normal" : "italic" }}>{v || empty}</div>
  );
  return (
    <Modal title={kpi.name} subtitle="Definition and calculation" icon={<Eye size={17} />} onClose={onClose}
      footer={editing ? (
        <>
          <button onClick={() => { setDefinition(kpi.definition || ""); setCalculation(kpi.calculation || ""); setEditing(false); }} style={btnGhost}>Cancel</button>
          <button onClick={() => { onSave({ definition, calculation }); setEditing(false); }} style={btnPrimary}><Save size={13} /> Save</button>
        </>
      ) : (
        <>
          {!readOnly && <button onClick={() => setEditing(true)} style={btnGhost}><Pencil size={13} /> Edit</button>}
          <button onClick={onClose} style={btnPrimary}>Close</button>
        </>
      )}>
      <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "20px" }}>
        {[`Units: ${kpi.units}`, `Captured ${kpi.frequency.toLowerCase()}`,
          DIRECTIONS.find((d) => d.value === kpi.direction)?.label,
          kpi.aggregate === "avg" ? "Averaged over the year" : "Summed over the year"].map((c) => (
          <span key={c} style={{ fontSize: "12px", padding: "4px 11px", borderRadius: "999px", background: T.raised, color: T.body }}>{c}</span>
        ))}
      </div>
      <div style={{ marginBottom: "20px" }}>
        <label style={labelS}>Definition — what this KPI measures</label>
        {editing ? <textarea rows="3" value={definition} onChange={(e) => setDefinition(e.target.value)} style={{ ...inputS, resize: "vertical" }} /> : box(definition, "No definition captured yet.")}
      </div>
      <div>
        <label style={labelS}>Calculation — how it is worked out</label>
        {editing ? <textarea rows="3" value={calculation} onChange={(e) => setCalculation(e.target.value)} style={{ ...inputS, resize: "vertical" }} /> : box(calculation, "No calculation captured yet.")}
      </div>
    </Modal>
  );
};

/* ─── Trend chart ───────────────────────────────────────────────────────── */
const TrendChartModal = ({ kpi, period, fy, onClose, onSaveNote }) => {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

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
  const existingNote = kpi.periodNotes?.[noteKey] || "";

  const data = { labels, datasets: [
    { type: "line", label: "Variance", data: variance, yAxisID: "yVar", order: 0,
      borderColor: "rgba(107,91,85,0.55)", borderWidth: 1.5, borderDash: [3,3],
      pointStyle: "circle", pointRadius: 6, pointHoverRadius: 8, pointBorderWidth: 2,
      pointBorderColor: T.ink, pointBackgroundColor: "transparent", tension: 0, spanGaps: true },
    { type: "line", label: "Budget", data: budget, yAxisID: "y", order: 1,
      borderColor: T.accent, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 4, tension: 0.25, spanGaps: true, fill: false },
    { type: "bar", label: "Actual", data: actual, yAxisID: "y", order: 2,
      backgroundColor: "rgba(30,64,175,0.72)", borderWidth: 0, borderRadius: 4, barPercentage: 0.6, categoryPercentage: 0.75 },
  ]};

  const options = {
    responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
    plugins: {
      datalabels: { display: false },
      legend: { position: "top", align: "end", labels: { color: T.body, font: { size: 12.5 }, padding: 16, usePointStyle: true, boxWidth: 8 } },
      tooltip: { backgroundColor: T.ink, padding: 12, cornerRadius: 8,
        callbacks: { label: (c) => c.parsed.y === null ? `${c.dataset.label}: no data`
          : `${c.dataset.label}: ${fmtValue(c.parsed.y, kpi, { signed: c.dataset.label === "Variance" })}` } },
    },
    scales: {
      yVar: { position: "right", grid: { display: false },
        ticks: { color: T.muted, font: { size: 10.5 }, callback: (v) => fmtValue(v, kpi, { signed: true }) },
        title: { display: true, text: "Variance", color: T.muted, font: { size: 10.5 } } },
      y: { position: "left", grid: { color: T.lineSoft }, ticks: { color: T.body, font: { size: 11.5 }, callback: (v) => fmtValue(v, kpi) },
        // Headroom so variance markers sit above the bars, not through them.
        afterDataLimits: (a) => { a.max = a.max + (a.max - a.min) * 0.18; } },
      x: { grid: { display: false }, ticks: { color: T.body, font: { size: 11.5 } } },
    },
  };

  return (
    <Modal title={`${kpi.name} — Trend`} subtitle={caption} icon={<LineChartIcon size={17} />} onClose={onClose} width={940}
      footer={<>
        <div style={{ flex: 1, fontSize: "12px", color: T.body, textAlign: "left", display: "flex", alignItems: "center", gap: "6px" }}>
          <Info size={12} /> Variance on top, Actual as bars, Budget as the line.
        </div>
        <button onClick={() => { setNoteText(existingNote); setNoteOpen((v) => !v); }} style={btnGhost}>
          <StickyNote size={13} /> {existingNote ? "Edit note" : "Add note"}
        </button>
        <button onClick={onClose} style={btnPrimary}>Close</button>
      </>}>
      <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "18px", height: "350px" }}>
        <Chart type="bar" data={data} options={options} />
      </div>
      {(existingNote || noteOpen) && (
        <div style={{ marginTop: "16px", background: T.panel, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ ...labelS, marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <StickyNote size={12} /> Note for this period
            </span>
            {!noteOpen && <button onClick={() => { setNoteText(existingNote); setNoteOpen(true); }} style={{ ...btnQuiet, padding: "2px 6px", fontSize: "12.5px" }}><Pencil size={11} /> Edit</button>}
          </div>
          {noteOpen ? (
            <>
              <textarea rows="3" value={noteText} onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Production decreased this month due to scheduled maintenance."
                style={{ ...inputS, resize: "vertical" }} />
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <button onClick={() => { onSaveNote(noteKey, noteText); setNoteOpen(false); }} style={{ ...btnPrimary, padding: "7px 14px" }}><Save size={12} /> Save note</button>
                <button onClick={() => setNoteOpen(false)} style={{ ...btnGhost, padding: "7px 14px" }}>Cancel</button>
              </div>
            </>
          ) : <p style={{ margin: 0, fontSize: "14px", color: T.body, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{existingNote}</p>}
        </div>
      )}
    </Modal>
  );
};

/* ─── Observations and Opportunities ────────────────────────────────────── */
const localAnalysis = (kpi, period, v, fy) => {
  const status = getStatus(kpi, period, fy);
  const variance = getVariance(kpi, period, fy);
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

const AnalysisModal = ({ kpi, period, fy, onClose }) => {
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
          kpiName: kpi.name, definition: kpi.definition, calculation: kpi.calculation,
          units: kpi.units, frequency: kpi.frequency, direction: kpi.direction,
          timeframe: PERIOD_LABEL[period], financialYearStartMonth: fy.startMonth,
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
        // Naming the reason matters: "not-found" means the Cloud Function is
        // not deployed, which is a different fix from a permissions error.
        console.error("AI analysis unavailable:", err);
        setReason(err?.code === "functions/not-found" ? "The generateKpiAnalysis function isn't deployed yet." : errText(err));
        setSource("local");
        setAnalysis(localAnalysis(kpi, period, v, fy));
      } finally { setLoading(false); }
    })();
  }, [kpi, period, fy]);

  useEffect(() => { build(); }, [build]);

  const Section = ({ label, items, color }) => (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.7px", textTransform: "uppercase", color, marginBottom: "8px" }}>{label}</div>
      <ul style={{ margin: 0, paddingLeft: "18px", color: T.body, fontSize: "14px", lineHeight: 1.7 }}>
        {items.map((it, i) => <li key={i} style={{ marginBottom: "4px" }}>{it}</li>)}
      </ul>
    </div>
  );

  return (
    <Modal title="Observations and Opportunities" subtitle={`${kpi.name} · ${PERIOD_LABEL[period]}`}
      icon={<Lightbulb size={17} />} onClose={onClose} width={700}
      footer={<>
        <button onClick={build} disabled={loading} style={{ ...btnGhost, opacity: loading ? 0.6 : 1 }}><RefreshCw size={13} /> Regenerate</button>
        <button onClick={onClose} style={btnPrimary}>Close</button>
      </>}>
      {!loading && (
        <div style={{ fontSize: "12px", color: source === "ai" ? T.body : T.amber, marginBottom: "18px",
          display: "flex", alignItems: "flex-start", gap: "6px", lineHeight: 1.5 }}>
          <Info size={12} style={{ marginTop: "2px", flexShrink: 0 }} />
          {source === "ai" ? "Generated from your KPI data"
            : <span>AI unavailable — showing a rules-based summary built from your figures.<br /><span style={{ color: T.muted }}>{reason}</span></span>}
        </div>
      )}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: T.body, fontSize: "14px" }}>
          <RefreshCw size={22} color={T.faint} /><div style={{ marginTop: "14px" }}>Reviewing {kpi.name}...</div>
        </div>
      ) : analysis && (
        <>
          <Section label="Observations" items={analysis.observations} color={T.accent} />
          <Section label="Trends" items={analysis.trends} color={T.blue} />
          <Section label="Issues" items={analysis.issues} color={T.red} />
          <Section label="Opportunities" items={analysis.opportunities} color={T.green} />
        </>
      )}
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
          highlights: "", lowlights: "", risks: "", headsUp: "", actions: [],
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
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 15px", borderRadius: "10px",
        background: status.bg, border: `1px solid ${status.color}33`, marginBottom: "20px" }}>
        <StatusIcon status={status} size={19} />
        <div style={{ fontSize: "14px", color: T.body }}>
          <strong style={{ color: T.accent }}>{kpi.name}</strong> is {status.label.toLowerCase()} for {PERIOD_LABEL[period].toLowerCase()}.
          What action are you going to take?
        </div>
      </div>
      <div style={{ marginBottom: "16px" }}>
        <label style={labelS}>Action *</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputS} placeholder="What needs to be done?" />
      </div>
      <div style={{ marginBottom: "16px" }}>
        <label style={labelS}>Description</label>
        <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputS, resize: "vertical" }} />
      </div>
      <div style={{ marginBottom: "16px" }}>
        <label style={labelS}>Attach to meeting</label>
        {loadingMeetings ? <div style={{ fontSize: "13.5px", color: T.body }}>Loading meetings...</div>
          : meetings.length === 0 ? (
            <div style={{ fontSize: "13px", color: T.body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: "8px", padding: "11px 13px" }}>
              No governance meetings yet — this will be filed under "Operational Performance Actions" and still appears in Integrated Actions.
            </div>
          ) : (
            <>
              <select value={meetingId} onChange={(e) => { setMeetingId(e.target.value); setForm((p) => applyDefaults(e.target.value, p)); }} style={{ ...inputS, cursor: "pointer" }}>
                {meetings.map((m) => { const d = meetingDate(m);
                  return <option key={m.id} value={m.id}>{m.title} ({m.category || "Uncategorized"}){d ? ` — ${fmtDMY(d)}` : ""}</option>; })}
              </select>
              {selected && (
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px", color: T.muted, marginTop: "8px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><Calendar size={11} /> {meetingDate(selected) ? fmtDMY(meetingDate(selected)) : "No date"}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><Users size={11} /> {(selected.participants || []).length} participants</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><Info size={11} /> Category and due date pre-filled from this meeting</span>
                </div>
              )}
            </>
          )}
      </div>
      <div style={{ marginBottom: "16px" }}>
        <label style={labelS}>Category</label>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ ...inputS, cursor: "pointer" }}>
          {RAPS_CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          {form.category && !RAPS_CATEGORIES.some((c) => c.name === form.category) && <option value={form.category}>{form.category}</option>}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
        <div><label style={labelS}>By whom</label>
          {(selected?.participants || []).length > 0 ? (
            <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} style={{ ...inputS, cursor: "pointer" }}>
              <option value="">Unassigned</option>
              {selected.participants.map((p, i) => { const n = typeof p === "string" ? p : p.name || p.email || "Participant"; return <option key={i} value={n}>{n}</option>; })}
            </select>
          ) : <input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} style={inputS} placeholder="Owner" />}
        </div>
        <div><label style={labelS}>By when</label>
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={inputS} /></div>
        <div><label style={labelS}>Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ ...inputS, cursor: "pointer" }}>
            {ACTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select></div>
      </div>
      {message && <div style={{ color: T.red, fontSize: "13px", marginTop: "14px" }}>{message}</div>}
      <p style={{ fontSize: "12px", color: T.muted, marginTop: "18px", marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
        <Info size={11} /> Saved actions appear in Integrated Actions and in the meeting's Meeting Actions tab.
      </p>
    </Modal>
  );
};

/* ─── KPI notes ─────────────────────────────────────────────────────────── */
const NotesModal = ({ kpi, onClose, onSave, readOnly }) => {
  const [notes, setNotes] = useState(kpi.notes || "");
  return (
    <Modal title={`Notes — ${kpi.name}`} icon={<StickyNote size={17} />} onClose={onClose}
      footer={readOnly ? <button onClick={onClose} style={btnPrimary}>Close</button> : (
        <>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={() => { onSave(notes); onClose(); }} style={btnPrimary}><Save size={13} /> Save Notes</button>
        </>
      )}>
      <label style={labelS}>Context, anomalies or anything worth remembering about this KPI</label>
      <textarea rows="9" value={notes} readOnly={readOnly} onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g. Two suppliers were on shutdown for the first half of the period, which explains the dip."
        style={{ ...inputS, resize: "vertical" }} />
    </Modal>
  );
};

/* ─── Progressive-disclosure shell ──────────────────────────────────────── */
const StepBlock = ({ n, title, done, active, summary, onEdit, children }) => {
  if (!active && !done) return (
    <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px 14px", borderRadius: "10px",
      border: `1px dashed ${T.lineStrong}`, marginBottom: "10px", opacity: 0.6 }}>
      <span style={{ width: 24, height: 24, borderRadius: "50%", background: T.raised, color: T.muted,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12.5px", fontWeight: 600, flexShrink: 0 }}>{n}</span>
      <span style={{ fontSize: "14px", color: T.muted }}>{title}</span>
    </div>
  );
  if (done && !active) return (
    <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px 14px", borderRadius: "10px",
      border: `1px solid ${T.line}`, background: T.panel, marginBottom: "10px" }}>
      <span style={{ width: 24, height: 24, borderRadius: "50%", background: T.green, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Check size={13} /></span>
      <span style={{ fontSize: "13.5px", color: T.body, flex: 1 }}>{title}</span>
      <span style={{ fontSize: "13.5px", color: T.accent, fontWeight: 600 }}>{summary}</span>
      <button onClick={onEdit} style={{ ...btnQuiet, padding: "3px 8px", fontSize: "12.5px" }}><Pencil size={11} /> Change</button>
    </div>
  );
  return (
    <div style={{ padding: "18px", borderRadius: "12px", border: `1px solid ${T.accent}33`, background: T.bg,
      boxShadow: `0 0 0 3px ${T.accentTint}`, marginBottom: "14px" }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "14px" }}>
        <span style={{ width: 24, height: 24, borderRadius: "50%", background: T.accent, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12.5px", fontWeight: 600, flexShrink: 0 }}>{n}</span>
        <span style={{ fontSize: "15.5px", color: T.accent, fontWeight: 600, letterSpacing: "-0.1px" }}>{title}</span>
      </div>
      {children}
    </div>
  );
};

const ChoiceGrid = ({ options, value, onSelect, min = 130 }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: "10px" }}>
    {options.map((o) => {
      const on = value === o.value;
      return (
        <button key={String(o.value)} onClick={() => onSelect(o.value)}
          style={{ padding: "14px 12px", borderRadius: "10px", cursor: "pointer", textAlign: "left",
            background: on ? T.accentTint : T.bg, border: `1.5px solid ${on ? T.accent : T.lineStrong}`,
            fontFamily: "inherit", display: "flex", flexDirection: "column", gap: "3px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            {o.badge && (
              <span style={{ fontSize: "11.5px", fontWeight: 700, padding: "2px 7px", borderRadius: "5px",
                background: on ? T.accent : T.raised, color: on ? "#fff" : T.accent, letterSpacing: "0.3px" }}>{o.badge}</span>
            )}
            <span style={{ fontSize: "14px", fontWeight: 600, color: T.accent }}>{o.label}</span>
          </span>
          {o.hint && <span style={{ fontSize: "12px", color: T.muted }}>{o.hint}</span>}
        </button>
      );
    })}
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════
   Add Data.

   The frequency was already declared when each KPI was created, so this flow
   reads it off the category rather than asking again. Same for the year and
   category, which are remembered from last time. Everything stays changeable
   through the "Change" links — people do switch — but a returning user lands
   straight on the period picker.
   ════════════════════════════════════════════════════════════════════════ */
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
  const remembered = !!prefs;
  const [catId, setCatId] = useState(prefs?.catId || structure[0].id);
  const [startYear, setStartYear] = useState(prefs?.startYear ?? fy.startYear);

  const category = structure.find((c) => c.id === catId) || structure[0];
  const derived = useMemo(() => deriveFrequency(category), [category]);
  const [frequency, setFrequency] = useState(prefs?.frequency || derived.frequency);
  const [freqOverridden, setFreqOverridden] = useState(!!prefs?.frequency);

  /* Returning users skip straight to picking a period. */
  const [step, setStep] = useState(remembered ? 3 : 1);
  const [showFreqPicker, setShowFreqPicker] = useState(false);
  const [periodKeys, setPeriodKeys] = useState([]);
  const [monthForDays, setMonthForDays] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  /* Changing category re-derives the frequency unless it was set by hand. */
  useEffect(() => {
    if (!freqOverridden) setFrequency(derived.frequency);
    setPeriodKeys([]); setMonthForDays(null);
  }, [catId, derived.frequency, freqOverridden]);

  const kpis = useMemo(() => category.subCategories.flatMap((s) => s.kpis.map((k) => ({ ...k, sub: s.name }))), [category]);

  const yearOptions = [
    { value: fy.startYear - 1, badge: "FY−", label: fyLabel(fy.startYear - 1, fy.startMonth), hint: "Previous financial year" },
    { value: fy.startYear,     badge: "FY",  label: fyLabel(fy.startYear, fy.startMonth),     hint: "Current financial year" },
    { value: fy.startYear + 1, badge: "FY+", label: fyLabel(fy.startYear + 1, fy.startMonth), hint: "Next financial year" },
  ];
  const yearBadge = startYear === fy.startYear ? "FY" : startYear === fy.startYear + 1 ? "FY+" : startYear === fy.startYear - 1 ? "FY−" : "FY";

  const periodOptions = useMemo(() => {
    if (frequency === "Monthly") return fyMonths(startYear, fy.startMonth).map((m) => ({ key: m.key, label: m.label, hint: m.long }));
    if (frequency === "Weekly") return fyWeeks(startYear, fy.startMonth).map((w) => ({ key: w.key, label: w.label, hint: w.range }));
    if (frequency === "Daily" && monthForDays !== null) {
      const m = fyMonths(startYear, fy.startMonth)[monthForDays];
      return daysInMonth(m.year, m.month).map((d) => ({ key: d.key, label: d.label, hint: "" }));
    }
    return [];
  }, [frequency, startYear, fy.startMonth, monthForDays]);

  const value = (kpiId, key, field) => {
    const d = draft[kpiId]?.[key];
    if (d && d[field] !== undefined) return d[field];
    return kpis.find((k) => k.id === kpiId)?.entries?.[key]?.[field] ?? "";
  };
  const setValue = (kpiId, key, field, raw) =>
    setDraft((p) => ({ ...p, [kpiId]: { ...(p[kpiId] || {}), [key]: { ...(p[kpiId]?.[key] || {}), [field]: raw } } }));

  const commit = async () => {
    setSaving(true);
    const next = structure.map((cat) => cat.id !== category.id ? cat : {
      ...cat,
      subCategories: cat.subCategories.map((sub) => ({
        ...sub,
        kpis: sub.kpis.map((kpi) => {
          const rows = draft[kpi.id];
          if (!rows) return kpi;
          const entries = { ...(kpi.entries || {}) };
          Object.entries(rows).forEach(([key, vals]) => {
            const actual = parseNum(vals.actual ?? entries[key]?.actual);
            const budget = parseNum(vals.budget ?? entries[key]?.budget);
            if (actual === null && budget === null) delete entries[key];
            else entries[key] = { actual, budget };
          });
          return { ...kpi, entries };
        }),
      })),
    });
    onSavePrefs({ catId, startYear, frequency: freqOverridden ? frequency : null });
    await onSave(next);
    setSaving(false);
    onClose();
  };

  const cellInput = { ...inputS, padding: "8px 10px", textAlign: "right", fontSize: "13.5px", minHeight: "36px" };
  const th = { padding: "10px 12px", fontSize: "11.5px", fontWeight: 700, color: T.accent, textTransform: "uppercase",
    letterSpacing: "0.5px", borderBottom: `1px solid ${T.lineStrong}`, background: T.panel, whiteSpace: "nowrap" };

  return (
    <Modal title="Add Data" subtitle={`Financial year starts in ${MONTHS[fy.startMonth]}`} icon={<Database size={17} />}
      onClose={onClose} width={step >= 4 ? 1200 : 760}
      footer={<>
        <button onClick={step === 1 ? onBack : () => setStep(Math.max(1, step - 1))} style={btnGhost}><ArrowLeft size={13} /> Back</button>
        <div style={{ flex: 1 }} />
        {step >= 4 && <button onClick={commit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving..." : "Save data"}</button>}
      </>}>

      {/* Steps 1 and 2 collapse to a single settings strip once answered. */}
      {step > 2 ? (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", padding: "12px 14px",
          borderRadius: "10px", background: T.panel, border: `1px solid ${T.line}`, marginBottom: "16px" }}>
          <span style={{ fontSize: "12.5px", color: T.muted }}>Adding to</span>
          {[
            { text: `${yearBadge} ${fyLabel(startYear, fy.startMonth)}`, go: 1 },
            { text: category.name, go: 1 },
            { text: `${frequency}${freqOverridden ? "" : " · from your KPIs"}`, go: 2 },
          ].map((chip) => (
            <button key={chip.text} onClick={() => setStep(chip.go)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "999px",
                background: T.bg, border: `1px solid ${T.lineStrong}`, cursor: "pointer", fontFamily: "inherit",
                fontSize: "13px", fontWeight: 600, color: T.accent }}>
              {chip.text} <Pencil size={11} color={T.muted} />
            </button>
          ))}
        </div>
      ) : (
        <>
          <StepBlock n={1} title="Which year and category?" active={step === 1} done={step > 1}
            summary={`${yearBadge} ${fyLabel(startYear, fy.startMonth)} · ${category.name}`} onEdit={() => setStep(1)}>
            <label style={labelS}>Financial year</label>
            <ChoiceGrid options={yearOptions} value={startYear} onSelect={setStartYear} min={190} />
            <label style={{ ...labelS, marginTop: "18px" }}>Category</label>
            <ChoiceGrid options={structure.map((c) => ({ value: c.id, label: c.name }))} value={catId} onSelect={setCatId} />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button onClick={() => setStep(3)} style={btnPrimary}>Continue <ChevronRight size={13} /></button>
            </div>
          </StepBlock>

          <StepBlock n={2} title="How often are you entering this data?" active={step === 2} done={step > 2}
            summary={frequency} onEdit={() => setStep(2)}>
            <p style={{ fontSize: "13px", color: T.body, marginTop: 0, marginBottom: "12px" }}>
              {derived.mixed
                ? `The KPIs in ${category.name} are captured at different frequencies — ${derived.frequency} is the most common.`
                : `The KPIs in ${category.name} are set to ${derived.frequency}.`} You can enter at a different frequency if you need to.
            </p>
            <ChoiceGrid min={200}
              options={CAPTURE_FREQUENCIES.map((f) => ({ value: f, label: f,
                hint: f === derived.frequency ? "Matches your KPIs" : `One figure per ${f.toLowerCase().replace("ly","")}` }))}
              value={frequency}
              onSelect={(f) => { setFrequency(f); setFreqOverridden(f !== derived.frequency); setPeriodKeys([]); setMonthForDays(null); setStep(3); }} />
            <p style={{ fontSize: "12.5px", color: T.body, marginTop: "14px", marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <Info size={12} /> Quarterly and yearly figures roll up from what you enter — you don't capture them separately.
            </p>
          </StepBlock>
        </>
      )}

      {step === 3 && (
        <StepBlock n={1} title={`Which ${frequency.toLowerCase().replace("ly", "")} are you entering?`} active done={false} summary="" onEdit={() => {}}>
          {frequency === "Daily" && (
            <div style={{ marginBottom: "16px" }}>
              <label style={labelS}>First pick a month</label>
              <ChoiceGrid options={fyMonths(startYear, fy.startMonth).map((m, i) => ({ value: i, label: m.label }))}
                value={monthForDays} onSelect={(i) => { setMonthForDays(i); setPeriodKeys([]); }} />
            </div>
          )}
          {periodOptions.length > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <label style={{ ...labelS, marginBottom: 0 }}>Select one or more</label>
                <button onClick={() => setPeriodKeys(periodKeys.length === periodOptions.length ? [] : periodOptions.map((p) => p.key))}
                  style={{ ...btnQuiet, padding: "3px 8px", fontSize: "12.5px" }}>
                  {periodKeys.length === periodOptions.length ? "Clear all" : "Select all"}
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "240px", overflowY: "auto", padding: "2px" }}>
                {periodOptions.map((p) => {
                  const on = periodKeys.includes(p.key);
                  return (
                    <button key={p.key} title={p.hint}
                      onClick={() => setPeriodKeys((prev) => on ? prev.filter((k) => k !== p.key) : [...prev, p.key])}
                      style={{ padding: "8px 14px", borderRadius: "999px", cursor: "pointer", fontSize: "13px",
                        background: on ? T.accent : T.bg, color: on ? "#fff" : T.accent,
                        border: `1px solid ${on ? T.accent : T.lineStrong}`, fontWeight: on ? 600 : 500, fontFamily: "inherit" }}>
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                <button onClick={() => setStep(4)} disabled={!periodKeys.length} style={{ ...btnPrimary, opacity: periodKeys.length ? 1 : 0.5 }}>
                  Enter data <ChevronRight size={13} />
                </button>
              </div>
            </>
          )}
        </StepBlock>
      )}

      {step >= 4 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: T.body, display: "flex", alignItems: "center", gap: "8px" }}>
              <Info size={13} /> Enter the <strong style={{ color: T.accent }}>Actual</strong> and <strong style={{ color: T.accent }}>Budget</strong> for each KPI. Leave a cell blank to remove that figure.
            </span>
            <button onClick={() => setStep(3)} style={{ ...btnQuiet, padding: "3px 10px", fontSize: "12.5px" }}>
              <Pencil size={11} /> Change periods
            </button>
          </div>
          <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ overflowX: "auto", maxHeight: "48vh" }}>
              <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", minWidth: `${340 + periodKeys.length * 240}px` }}>
                <thead>
                  <tr>
                    <th style={{ ...th, textAlign: "left", position: "sticky", left: 0, top: 0, zIndex: 3, minWidth: "270px", borderRight: `1px solid ${T.lineStrong}` }}>KPI</th>
                    {periodKeys.map((k) => {
                      const p = periodOptions.find((x) => x.key === k);
                      return (
                        <th key={k} colSpan={2} style={{ ...th, textAlign: "center", position: "sticky", top: 0, zIndex: 2, borderRight: `1px solid ${T.lineStrong}` }}>
                          <div>{p?.label}</div>
                          {p?.hint && <div style={{ fontSize: "10.5px", fontWeight: 400, textTransform: "none", letterSpacing: 0, color: T.muted }}>{p.hint}</div>}
                        </th>
                      );
                    })}
                  </tr>
                  <tr>
                    <th style={{ ...th, position: "sticky", left: 0, zIndex: 2, borderRight: `1px solid ${T.lineStrong}` }} />
                    {periodKeys.map((k) => (
                      <React.Fragment key={k}>
                        <th style={{ ...th, textAlign: "right", minWidth: "118px", borderRight: `1px solid ${T.line}` }}>Actual</th>
                        <th style={{ ...th, textAlign: "right", minWidth: "118px", borderRight: `1px solid ${T.lineStrong}` }}>Budget</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kpis.map((kpi, i) => (
                    <tr key={kpi.id} style={{ background: i % 2 ? T.panel : T.bg }}>
                      <td style={{ padding: "9px 12px", fontSize: "13.5px", color: T.ink, position: "sticky", left: 0,
                        background: i % 2 ? T.panel : T.bg, borderBottom: `1px solid ${T.lineSoft}`, borderRight: `1px solid ${T.lineStrong}`, zIndex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{kpi.name}</div>
                        <div style={{ fontSize: "11.5px", color: T.muted }}>{kpi.sub} · {kpi.units} · {kpi.frequency}</div>
                      </td>
                      {periodKeys.map((k) => (
                        <React.Fragment key={k}>
                          <td style={{ padding: "5px 8px", borderRight: `1px solid ${T.lineSoft}`, borderBottom: `1px solid ${T.lineSoft}` }}>
                            <input type="number" step="any" value={value(kpi.id, k, "actual")} placeholder="—"
                              onChange={(e) => setValue(kpi.id, k, "actual", e.target.value)} style={cellInput} />
                          </td>
                          <td style={{ padding: "5px 8px", borderRight: `1px solid ${T.lineStrong}`, borderBottom: `1px solid ${T.lineSoft}` }}>
                            <input type="number" step="any" value={value(kpi.id, k, "budget")} placeholder="—"
                              onChange={(e) => setValue(kpi.id, k, "budget", e.target.value)} style={cellInput} />
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

/* ─── Add KPI — always asks in full; a new metric has no history to reuse ── */
const AddKpiWizard = ({ structure, categoryId, onBack, onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [catId, setCatId] = useState(categoryId);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [subChoice, setSubChoice] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", units: "%", percentFormat: "whole", frequency: "Monthly",
    direction: "higher", aggregate: "avg", definition: "", calculation: "",
  });

  const creatingCategory = catId === "__new__";
  const category = structure.find((c) => c.id === catId);
  const subs = category?.subCategories || [];
  const creatingSub = subChoice === "__new__" || creatingCategory;
  const subName = creatingSub ? newSubName.trim() : subChoice;
  const canSave = form.name.trim() && subName && (!creatingCategory || newCategoryName.trim()) && form.definition.trim() && form.calculation.trim();

  const commit = async () => {
    if (!canSave) return;
    setSaving(true);
    const kpi = mkKpi({
      name: form.name.trim(), units: form.units, frequency: form.frequency,
      direction: form.direction, aggregate: form.aggregate,
      percentFormat: form.units === "%" ? form.percentFormat : "whole",
      definition: form.definition.trim(), calculation: form.calculation.trim(), entries: {},
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
      onClose={onClose} width={760}
      footer={<>
        <button onClick={step === 1 ? onBack : () => setStep(step - 1)} style={btnGhost}><ArrowLeft size={13} /> Back</button>
        <div style={{ flex: 1 }} />
        {step >= 3 && <button onClick={commit} disabled={!canSave || saving} style={{ ...btnPrimary, opacity: canSave && !saving ? 1 : 0.5 }}>
          {saving ? "Saving..." : "Create KPI"}</button>}
      </>}>

      <StepBlock n={1} title="Where does this KPI belong?" active={step === 1} done={step > 1}
        summary={creatingCategory ? newCategoryName : category?.name} onEdit={() => setStep(1)}>
        <label style={labelS}>Category</label>
        {/* Only the categories that exist here, plus the option to create one —
            listing the other RAPS categories would point at places a KPI can't
            actually live on this dashboard. */}
        <ChoiceGrid options={[...structure.map((c) => ({ value: c.id, label: c.name })),
                              { value: "__new__", label: "＋ New category", hint: "Create your own" }]}
          value={catId} onSelect={(v) => { setCatId(v); if (v !== "__new__") setNewCategoryName(""); setSubChoice(""); }} />
        {creatingCategory && (
          <div style={{ marginTop: "16px" }}>
            <label style={labelS}>New category name *</label>
            <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} style={inputS} placeholder="e.g. Customer Experience" />
          </div>
        )}
        <div style={{ marginTop: "18px" }}>
          <label style={labelS}>Sub-category</label>
          {!creatingCategory && subs.length > 0 && (
            <ChoiceGrid options={[...subs.map((s) => ({ value: s.name, label: s.name })), { value: "__new__", label: "＋ New sub-category" }]}
              value={subChoice} onSelect={setSubChoice} />
          )}
          {creatingSub && <input value={newSubName} onChange={(e) => setNewSubName(e.target.value)} style={{ ...inputS, marginTop: "10px" }} placeholder="e.g. Service Levels" />}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <button onClick={() => setStep(2)} disabled={!subName || (creatingCategory && !newCategoryName.trim())}
            style={{ ...btnPrimary, opacity: subName && (!creatingCategory || newCategoryName.trim()) ? 1 : 0.5 }}>
            Continue <ChevronRight size={13} />
          </button>
        </div>
      </StepBlock>

      <StepBlock n={2} title="How is it measured?" active={step === 2} done={step > 2}
        summary={`${form.name || "Unnamed"} · ${form.units} · ${form.frequency}`} onEdit={() => setStep(2)}>
        <div style={{ marginBottom: "16px" }}>
          <label style={labelS}>KPI name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputS} placeholder="e.g. First-time Fix Rate" />
        </div>
        <label style={labelS}>Units</label>
        <ChoiceGrid options={[{ value: "%", label: "Percent", hint: "%" }, { value: "R", label: "Currency", hint: "R" },
            { value: "#", label: "Count", hint: "#" }, { value: "days", label: "Days" },
            { value: "hrs", label: "Hours" }, { value: "units", label: "Units" }, { value: "index", label: "Index" }]}
          value={form.units} onSelect={(u) => setForm({ ...form, units: u })} />
        {form.units === "%" && (
          <div style={{ marginTop: "16px" }}>
            <label style={labelS}>How do you capture this percentage?</label>
            <ChoiceGrid min={200}
              options={[{ value: "whole", label: "As 25", hint: "Whole numbers" }, { value: "fraction", label: "As 0.25", hint: "Decimal fractions" }]}
              value={form.percentFormat} onSelect={(v) => setForm({ ...form, percentFormat: v })} />
            <p style={{ fontSize: "12px", color: T.body, marginTop: "8px", marginBottom: 0 }}>
              Either way it displays as 25%. This tells the system how to read what you type in.
            </p>
          </div>
        )}
        <div style={{ marginTop: "18px" }}>
          <label style={labelS}>Measurement frequency</label>
          <ChoiceGrid options={FREQUENCIES.map((f) => ({ value: f, label: f }))} value={form.frequency} onSelect={(f) => setForm({ ...form, frequency: f })} />
        </div>
        <div style={{ marginTop: "18px" }}>
          <label style={labelS}>Direction — what counts as good?</label>
          <ChoiceGrid min={200} options={DIRECTIONS} value={form.direction} onSelect={(d) => setForm({ ...form, direction: d })} />
        </div>
        <div style={{ marginTop: "18px" }}>
          <label style={labelS}>Rolling up to quarters and years</label>
          <ChoiceGrid min={200}
            options={[{ value: "avg", label: "Average the periods", hint: "Rates, percentages, indices" },
                      { value: "sum", label: "Add the periods up", hint: "Counts, volumes, rand totals" }]}
            value={form.aggregate} onSelect={(a) => setForm({ ...form, aggregate: a })} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <button onClick={() => setStep(3)} disabled={!form.name.trim()} style={{ ...btnPrimary, opacity: form.name.trim() ? 1 : 0.5 }}>
            Continue <ChevronRight size={13} />
          </button>
        </div>
      </StepBlock>

      <StepBlock n={3} title="What does it mean?" active={step === 3} done={false} summary="" onEdit={() => setStep(3)}>
        <div style={{ marginBottom: "16px" }}>
          <label style={labelS}>Definition * — what this KPI measures</label>
          <textarea rows="3" value={form.definition} onChange={(e) => setForm({ ...form, definition: e.target.value })}
            style={{ ...inputS, resize: "vertical" }} placeholder="Anyone reading the dashboard should understand it from this sentence." />
        </div>
        <div>
          <label style={labelS}>Calculation * — how it is worked out</label>
          <textarea rows="3" value={form.calculation} onChange={(e) => setForm({ ...form, calculation: e.target.value })}
            style={{ ...inputS, resize: "vertical" }} placeholder="e.g. (Jobs fixed on first visit ÷ total jobs) × 100." />
        </div>
        <p style={{ fontSize: "12.5px", color: T.body, marginTop: "14px", marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
          <Info size={12} /> Both are required — without them the KPI can't be interpreted by anyone reading the dashboard later.
        </p>
      </StepBlock>
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

  const [activeCategoryId, setActiveCategoryId] = useState("supply-chain");
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

  const fy = useMemo(() => ({ startMonth: fyStartMonth, startYear: fyStartYearOf(new Date(), fyStartMonth) }), [fyStartMonth]);

  const notify = (type, message) => {
    setNotification({ type, message: String(message) });
    setTimeout(() => setNotification(null), 4000);
  };

  /* Last Add Data setup, so a returning user isn't re-asked. */
  const savePrefs = (p) => {
    setDataPrefs(p);
    try { window.localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* private browsing — non-fatal */ }
  };

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFS_KEY);
      if (raw) setDataPrefs(JSON.parse(raw));
    } catch { /* ignore */ }
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

  const persist = async (next) => {
    setStructure(next);
    if (!user?.uid || isInvestorView) return;
    try {
      await setDoc(doc(db, "operationalKpis", user.uid),
        { userId: user.uid, structure: next, lastUpdated: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error("Error saving operational KPIs:", err);
      notify("error", `Changes could not be saved: ${errText(err)}`);
    }
  };

  const updateKpi = (kpiId, patch) =>
    persist(structure.map((cat) => ({ ...cat,
      subCategories: cat.subCategories.map((sub) => ({ ...sub,
        kpis: sub.kpis.map((k) => (k.id === kpiId ? { ...k, ...patch } : k)) })) })));

  const activeCategory = useMemo(
    () => (structure || []).find((c) => c.id === activeCategoryId) || (structure || [])[0], [structure, activeCategoryId]);

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
    structure.forEach((cat) => cat.subCategories.forEach((sub) => sub.kpis.forEach((kpi) => {
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

  const thS = { padding: 0, background: T.panel, borderBottom: `2px solid ${T.lineStrong}`,
    borderRight: `1px solid ${T.line}`, position: "relative", verticalAlign: "top" };
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
              <li>Click the eye beside a KPI for its definition and calculation</li>
              <li>Use the Actions column for the chart, insights, actions and notes</li>
              <li>Add KPI/Data remembers your last setup and skips ahead</li>
            </ul>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "2px", borderBottom: `1px solid ${T.lineStrong}`, marginBottom: "18px", flexWrap: "wrap" }}>
        {structure.map((cat) => {
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
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: "15.5px", fontWeight: 600, color: T.accent }}>{activeCategory?.name}</h3>
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
                {visibleColumns.map((key, ci) => {
                  const def = COLUMN_DEFS[key];
                  const isOpen = openFilter === key;
                  const sorted = sortConfig.key === key;
                  const filtered = def.filter && filters[key] !== "all";
                  const align = def.align === "right" ? "flex-end" : def.align === "center" ? "center" : "flex-start";
                  const lines = columnLines(key, period);

                  return (
                    <th key={key} style={{ ...thS, width: widths[key] }}>
                      {/* The label block is a fixed two-line height and bottom-
                          aligned, so a one-line name sits on the same baseline
                          as the second line of a two-line one. */}
                      <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "5px", alignItems: align }}>
                        <span style={{ display: "flex", alignItems: "flex-end", gap: "5px", minHeight: "34px" }}>
                          <span style={{ display: "inline-flex", flexDirection: "column", justifyContent: "flex-end",
                            alignItems: align, lineHeight: 1.3, minHeight: "34px" }}>
                            {lines.length > 1 && (
                              <span style={{ fontSize: "13px", fontWeight: 600, color: T.accent, whiteSpace: "nowrap" }}>{lines[0]}</span>
                            )}
                            <span style={{ fontSize: "13px", fontWeight: 600, color: T.ink, whiteSpace: "nowrap" }}>
                              {lines[lines.length - 1]}
                            </span>
                          </span>
                          <span style={{ paddingBottom: "2px" }}><InfoTip text={def.tip} /></span>
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                          {def.sort && (
                            <button onClick={() => toggleSort(key)} title="Sort" style={iconBtn(sorted ? T.accent : T.muted)}>
                              {sorted ? (sortConfig.direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} />}
                            </button>
                          )}
                          {def.filter && (
                            <button onClick={() => setOpenFilter(isOpen ? null : key)} title="Filter"
                              style={{ ...iconBtn(filtered ? T.accent : T.muted), background: filtered ? T.accentTint : "transparent" }}>
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
                  <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "5px", alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "flex-end", gap: "5px", minHeight: "34px" }}>
                      <span style={{ display: "inline-flex", alignItems: "flex-end", minHeight: "34px", fontSize: "13px", fontWeight: 600, color: T.ink }}>Actions</span>
                      <span style={{ paddingBottom: "2px" }}><InfoTip text="Trend chart, observations and opportunities, add an action, and notes for this KPI." /></span>
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
                // Heavy rule between sub-categories; light rule between KPIs.
                const rowTd = { ...tdS, borderBottom: last ? `2px solid ${T.lineStrong}` : `1px solid ${T.lineSoft}` };
                const cell = (key, content) => visibility[key] ? (
                  <td key={key} style={{ ...rowTd, width: widths[key],
                    textAlign: COLUMN_DEFS[key].align === "right" ? "right" : COLUMN_DEFS[key].align === "center" ? "center" : "left" }}>
                    {content}
                  </td>
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
                          <button onClick={() => setInfoKpi(kpi)} style={iconBtn(T.muted)} title="Definition and calculation"><Eye size={14} /></button>
                          {kpi.notes && <StickyNote size={11} color={T.amber} />}
                        </div>
                      </td>
                    )}
                    {cell("units", <span style={{ color: T.body }}>{kpi.units}</span>)}
                    {cell("frequency", <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "999px", background: T.raised, color: T.body, fontWeight: 500 }}>{kpi.frequency}</span>)}
                    {cell("budget", <span style={{ color: T.body, fontVariantNumeric: "tabular-nums" }}>{fmtValue(values.budget, kpi)}</span>)}
                    {cell("actual", <span style={{ fontWeight: 700, color: T.ink, fontVariantNumeric: "tabular-nums" }}>{fmtValue(values.actual, kpi)}</span>)}
                    {cell("variance", variance === null
                      ? <span style={{ color: T.faint }}>—</span>
                      : <span style={{ fontWeight: 700, color: fav ? T.green : T.red, fontVariantNumeric: "tabular-nums" }}>
                          {fmtValue(variance, kpi, { signed: true })}</span>)}
                    {cell("status", <StatusIcon status={status} />)}

                    <td style={{ ...rowTd, width: widths[ACTIONS_KEY], textAlign: "center", borderRight: "none" }}>
                      <div style={{ display: "flex", gap: "1px", justifyContent: "center", alignItems: "center" }}>
                        <button onClick={() => setChartKpi(kpi)} style={iconBtn(T.body)} title="Trend chart"><LineChartIcon size={16} /></button>
                        <button onClick={() => setAnalysisKpi(kpi)} style={iconBtn(T.body)} title="Observations and opportunities"><Lightbulb size={16} /></button>
                        {/* Always available; the colour follows the row's status. */}
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
          <span>{activeCategory?.subCategories.length} sub-categories</span>
          <span style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><CheckCircle2 size={12} color={T.green} /> On budget</span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><AlertTriangle size={12} color={T.amber} /> Needs attention</span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><XCircle size={12} color={T.red} /> Critical</span>
          </span>
        </div>
      </div>

      {infoKpi && <KpiInfoModal kpi={infoKpi} readOnly={isInvestorView} onClose={() => setInfoKpi(null)}
        onSave={(patch) => { updateKpi(infoKpi.id, patch); setInfoKpi({ ...infoKpi, ...patch }); notify("success", "KPI definition updated."); }} />}

      {chartKpi && <TrendChartModal kpi={chartKpi} period={period} fy={fy} onClose={() => setChartKpi(null)}
        onSaveNote={(key, text) => {
          const notes = { ...(chartKpi.periodNotes || {}) };
          if (text.trim()) notes[key] = text.trim(); else delete notes[key];
          updateKpi(chartKpi.id, { periodNotes: notes });
          setChartKpi({ ...chartKpi, periodNotes: notes });
          notify("success", "Note saved.");
        }} />}

      {analysisKpi && <AnalysisModal kpi={analysisKpi} period={period} fy={fy} onClose={() => setAnalysisKpi(null)} />}

      {actionKpi && <AddActionModal kpi={actionKpi.kpi} period={period} fy={fy}
        categoryName={actionKpi.categoryName} subCategoryName={actionKpi.subCategoryName}
        userId={user?.uid} onClose={() => setActionKpi(null)}
        onSaved={(m) => notify("success", `Action added to "${m}" and Integrated Actions.`)} />}

      {notesKpi && <NotesModal kpi={notesKpi} readOnly={isInvestorView} onClose={() => setNotesKpi(null)}
        onSave={(notes) => { updateKpi(notesKpi.id, { notes }); notify("success", "Notes saved."); }} />}

      {addFlow === "choose" && <AddChooser onClose={() => setAddFlow(null)} onPick={(k) => setAddFlow(k)}
        prefs={dataPrefs && structure.some((c) => c.id === dataPrefs.catId) ? dataPrefs : null} fy={fy} structure={structure} />}

      {addFlow === "data" && <AddDataWizard structure={structure} fy={fy}
        prefs={dataPrefs && structure.some((c) => c.id === dataPrefs.catId) ? dataPrefs : null}
        onSavePrefs={savePrefs} onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
        onSave={async (next) => { await persist(next); notify("success", "Data saved."); }} />}

      {addFlow === "kpi" && <AddKpiWizard structure={structure} categoryId={activeCategory?.id}
        onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
        onSave={async (next) => { await persist(next); notify("success", "KPI created."); }} />}
    </div>
  );
};

export default OperationalPerformance;