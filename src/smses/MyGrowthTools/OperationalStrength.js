"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Chart } from "react-chartjs-2";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  Eye, EyeOff, LineChart as LineChartIcon, Lightbulb, Plus, StickyNote, X, Save, Pencil, Info,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
  Check, CheckCircle2, AlertTriangle, XCircle, ClipboardList, Download, RefreshCw, Columns3,
  ExternalLink, Square, CheckSquare, ArrowLeft, Calendar, Users, SlidersHorizontal,
  Database, Sparkles, Sigma, Trash2, Palette, Layers, BarChart3,
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const functions = getFunctions();

/* Warm, darker greys — neutral greys washed out badly against white.
   `header` is deliberately near-black brown: the table header needed to sit
   clearly above the accent used elsewhere. */
const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", faint: "#8a7a74",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#4a352f", accentSoft: "#6b4f47", accentTint: "#f4efec",
  header: "#241713", headerLine: "rgba(255,255,255,0.16)",
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

/* Weeks read as the dates they cover — "27 Jul – 2 Aug" — because "W14" tells
   nobody which week they're entering. */
const weekRangeLabel = (start, end) =>
  `${start.getDate()} ${MONTHS[start.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]}`;

const fyWeeks = (sy, sm) => {
  const start = new Date(sy, sm, 1), end = new Date(sy + 1, sm, 0);
  const cur = new Date(start);
  cur.setDate(cur.getDate() - ((cur.getDay() + 6) % 7));
  const out = []; let n = 1;
  while (cur <= end) {
    const wEnd = new Date(cur); wEnd.setDate(wEnd.getDate() + 6);
    out.push({
      key: `W:${isoDate(cur)}`,
      label: weekRangeLabel(cur, wEnd),
      short: `W${n}`,
      hint: `Week ${n} · ${cur.getFullYear()}`,
      start: new Date(cur), end: wEnd, index: n - 1,
    });
    cur.setDate(cur.getDate() + 7); n++;
  }
  return out;
};

const daysInMonth = (year, month) =>
  Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return { key: `D:${isoDate(d)}`, label: `${d.getDate()} ${MONTHS[d.getMonth()]}`, hint: "", date: d, index: i };
  });

const currentWeekKey = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return `W:${isoDate(d)}`; };
const currentMonthKey = () => { const d = new Date(); return `M:${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };

/* ─── Formatting ─────────────────────────────────────────────────────────
   fmtValue  — carries the unit. Tooltips, prose, the averages tiles.
   fmtBare   — no unit. The table, where Units is already a column.
   fmtChart  — no unit, always 2 decimals, thousands compacted to k/M so a
               five-figure actual doesn't run into its neighbour. Full
               precision stays one hover away in the tooltip.
   Every one of these rounds. Raw floats like 0.8199999999999998 only appear
   if something else is drawing on the canvas — see the datalabels note in
   the chart options below.                                                 */
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
const fmtBare = (raw, kpi, { signed = false } = {}) => {
  if (raw === null || raw === undefined || raw === "") return "—";
  let n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  if (kpi?.units === "%" && kpi.percentFormat === "fraction") n *= 100;
  const sign = signed && n > 0 ? "+" : "";
  if (kpi?.units === "R") {
    const dp = Math.abs(n) >= 1000 ? 0 : 2;
    return `${sign}${n.toLocaleString(LOCALE, { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
  }
  return `${sign}${trimNum(n)}`;
};
const fmtChart = (raw, kpi, { signed = false } = {}) => {
  let n = Number(raw);
  if (!Number.isFinite(n)) return "";
  if (kpi?.units === "%" && kpi.percentFormat === "fraction") n *= 100;
  // Round first, then sign — otherwise -0.004 prints as "-0.00".
  const r = Math.round(n * 100) / 100;
  const sign = r < 0 ? "-" : signed && r > 0 ? "+" : "";
  const abs = Math.abs(r);
  const two = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  if (abs >= 1000000) return `${sign}${(abs / 1000000).toLocaleString(LOCALE, two)}M`;
  if (abs >= 10000) return `${sign}${(abs / 1000).toLocaleString(LOCALE, two)}k`;
  return `${sign}${abs.toLocaleString(LOCALE, two)}`;
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
const hexA = (hex, a) => {
  const h = String(hex || "#000000").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(0,0,0,${a})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/* ─── KPI model ─────────────────────────────────────────────────────────── */
const DEFAULT_CHART = {
  actualType: "bar", budgetType: "line", varianceType: "bar",
  actualColor: "#1e40af", budgetColor: "#4a352f",
  favColor: "#166534", unfavColor: "#991b1b",
  showLabels: true, showVariance: true, showLegend: true,
};

const mkKpi = (o) => ({
  id: uid(), name: o.name, units: o.units, frequency: o.frequency || "Monthly",
  direction: o.direction || "higher", aggregate: o.aggregate || "avg",
  percentFormat: o.percentFormat || "whole",
  meaning: o.meaning || "",      // What does this KPI mean?
  measured: o.measured || "",    // How is this KPI measured? (Excel terms)
  notes: "", periodNotes: {}, chartConfig: { ...DEFAULT_CHART }, entries: o.entries || {},
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

/* Every calculation is written the way it would be built in Excel — named
   ranges, real functions, and the formula that produces the KPI. */
const buildDefaultStructure = (sy, sm) => [
  { id: "supply-chain", name: "Supply Chain", notes: "", hidden: false, subCategories: [
    { name: "Supplier Dependency", kpis: [
      mkKpi({ name: "Top 3 Supplier Spend", units: "%", frequency: "Monthly", direction: "lower", aggregate: "avg",
        meaning: "How much of your buying sits with your three biggest suppliers. The higher it is, the more exposed you are if one of them fails.",
        measured: "Rank suppliers by spend, take the top three, divide by total spend.\n\n=SUMPRODUCT(LARGE(Spend,{1;2;3})) / SUM(Spend) * 100\n\nWhere Spend = the supplier spend column for the period. Format the result as Percentage (0 decimals).",
        entries: seedEntries(sy, sm, 70, 79, 3, "avg") }),
      mkKpi({ name: "Single Source Flags", units: "#", frequency: "Monthly", direction: "lower", aggregate: "sum",
        meaning: "How many critical inputs you can only buy from one supplier.",
        measured: "Count the items whose qualified-supplier count equals 1.\n\n=COUNTIF(SupplierCount, 1)\n\nWhere SupplierCount = the number of approved suppliers per item on the item register.",
        entries: seedEntries(sy, sm, 0, 1, 1, "sum") }),
      mkKpi({ name: "Critical Supplier Count", units: "#", frequency: "Monthly", direction: "lower", aggregate: "avg",
        meaning: "How many suppliers would stop or seriously disrupt delivery if they failed.",
        measured: "Count the register rows flagged critical.\n\n=COUNTIF(CriticalFlag, \"Yes\")\n\nWhere CriticalFlag = the Yes/No column on the supplier register.",
        entries: seedEntries(sy, sm, 5, 16, 2, "avg") }),
    ]},
    { name: "Continuity Risk", kpis: [
      mkKpi({ name: "Lead Time Variance", units: "days", frequency: "Weekly", direction: "lower", aggregate: "avg",
        meaning: "How far suppliers drift from the delivery dates they quote you.",
        measured: "Average the gap between actual and quoted lead time.\n\n=AVERAGE(ActualLeadDays - QuotedLeadDays)\n\nEntered as an array formula, or =AVERAGE(Variance) where Variance = ActualLeadDays − QuotedLeadDays per order line.",
        entries: seedEntries(sy, sm, 2, 2.3, 0.5, "avg") }),
      mkKpi({ name: "Stock Cover Days", units: "days", frequency: "Weekly", direction: "higher", aggregate: "avg",
        meaning: "How many days of demand your current stock can serve before you run out.",
        measured: "Divide closing stock by average daily usage.\n\n=ClosingStock / AVERAGE(DailyUsage)\n\nWhere DailyUsage = units consumed per day over the period.",
        entries: seedEntries(sy, sm, 30, 27, 4, "avg") }),
      mkKpi({ name: "Disruption Risk Index", units: "index", frequency: "Monthly", direction: "lower", aggregate: "avg",
        meaning: "A single 0–100 score combining supplier, logistics and geographic exposure.",
        measured: "Weighted average of the three sub-scores.\n\n=SUMPRODUCT(SubScores, Weights) / SUM(Weights)\n\nWhere SubScores = concentration, lead-time and geography scores (0–100) and Weights = their agreed weightings.",
        entries: seedEntries(sy, sm, 20, 23, 3, "avg") }),
    ]},
  ]},
  { id: "delivery", name: "Delivery", notes: "", hidden: false, subCategories: [
    { name: "Productivity", kpis: [
      mkKpi({ name: "Production Volume", units: "units", frequency: "Weekly", direction: "higher", aggregate: "sum",
        meaning: "Total good output produced and accepted in the period.",
        measured: "Add up accepted units.\n\n=SUMIFS(UnitsProduced, QCResult, \"Pass\", Date, \">=\"&PeriodStart, Date, \"<=\"&PeriodEnd)",
        entries: seedEntries(sy, sm, 10000, 12800, 900, "sum") }),
      mkKpi({ name: "Availability", units: "%", frequency: "Weekly", direction: "higher", aggregate: "avg",
        meaning: "How much of your planned running time the equipment was actually available.",
        measured: "Planned time less unplanned downtime, over planned time.\n\n=(SUM(PlannedTime) - SUM(UnplannedDowntime)) / SUM(PlannedTime) * 100",
        entries: seedEntries(sy, sm, 95, 93, 2, "avg") }),
      mkKpi({ name: "Utilization", units: "%", frequency: "Weekly", direction: "higher", aggregate: "avg",
        meaning: "How much of the capacity you had available you actually used.",
        measured: "Run time over available time.\n\n=SUM(RunTime) / SUM(AvailableTime) * 100",
        entries: seedEntries(sy, sm, 85, 85, 3, "avg") }),
      mkKpi({ name: "Unit Cost", units: "R", frequency: "Monthly", direction: "lower", aggregate: "avg",
        meaning: "What it costs you, all in, to make one sellable unit.",
        measured: "Total production cost over good units.\n\n=SUM(ProductionCost) / SUMIFS(Units, QCResult, \"Pass\")\n\nFormat as Currency (R, 2 decimals).",
        entries: seedEntries(sy, sm, 50, 41, 4, "avg") }),
    ]},
    { name: "Reliability", kpis: [
      mkKpi({ name: "On-time Delivery", units: "%", frequency: "Weekly", direction: "higher", aggregate: "avg",
        meaning: "The share of orders that reached the customer on or before the date you promised.",
        measured: "Count on-time deliveries over all deliveries.\n\n=COUNTIFS(DeliveredDate, \"<=\"&PromisedDate) / COUNTA(DeliveredDate) * 100\n\nOr flag each line with =IF(DeliveredDate<=PromisedDate, 1, 0) and use =AVERAGE(OnTimeFlag)*100.",
        entries: seedEntries(sy, sm, 98, 96, 2, "avg") }),
      mkKpi({ name: "Rework Rate", units: "%", frequency: "Weekly", direction: "lower", aggregate: "avg",
        meaning: "How much of what you make has to be fixed before it can ship.",
        measured: "Reworked units over units produced.\n\n=SUM(UnitsReworked) / SUM(UnitsProduced) * 100",
        entries: seedEntries(sy, sm, 2, 1.1, 0.4, "avg") }),
      mkKpi({ name: "Defect Rate", units: "%", frequency: "Weekly", direction: "lower", aggregate: "avg",
        meaning: "How much of what you make is rejected at inspection or comes back from customers.",
        measured: "Defective units over units produced.\n\n=(SUMIFS(Units, QCResult, \"Fail\") + SUM(CustomerReturns)) / SUM(UnitsProduced) * 100",
        entries: seedEntries(sy, sm, 1, 0.4, 0.2, "avg") }),
    ]},
  ]},
  { id: "safety", name: "Safety", notes: "", hidden: false, subCategories: [
    { name: "Safety Risk", kpis: [
      mkKpi({ name: "Safety Incidents", units: "#", frequency: "Weekly", direction: "lower", aggregate: "sum",
        meaning: "Recordable incidents involving staff, contractors or visitors.",
        measured: "Count incident-register rows inside the period.\n\n=COUNTIFS(IncidentDate, \">=\"&PeriodStart, IncidentDate, \"<=\"&PeriodEnd)",
        entries: seedEntries(sy, sm, 0, 0.4, 0.4, "sum") }),
      mkKpi({ name: "Open Safety Actions", units: "#", frequency: "Weekly", direction: "lower", aggregate: "avg",
        meaning: "Corrective actions from incidents or inspections that are still outstanding.",
        measured: "Count actions not yet closed.\n\n=COUNTIF(ActionStatus, \"<>Closed\")",
        entries: seedEntries(sy, sm, 5, 2, 1, "avg") }),
      mkKpi({ name: "Compliance Status", units: "%", frequency: "Monthly", direction: "higher", aggregate: "avg",
        meaning: "The share of mandatory safety requirements you currently meet.",
        measured: "Requirements met over requirements that apply.\n\n=COUNTIF(RequirementMet, \"Yes\") / COUNTA(RequirementMet) * 100",
        entries: seedEntries(sy, sm, 100, 99, 1, "avg") }),
    ]},
    { name: "Regulatory Compliance", kpis: [
      mkKpi({ name: "Regulatory Gaps", units: "#", frequency: "Monthly", direction: "lower", aggregate: "sum",
        meaning: "Known areas where you are not compliant with the regulation that applies to you.",
        measured: "Count open gaps on the compliance register.\n\n=COUNTIFS(GapStatus, \"Open\")",
        entries: seedEntries(sy, sm, 0, 0.3, 0.3, "sum") }),
      mkKpi({ name: "Audit Findings", units: "#", frequency: "Quarterly", direction: "lower", aggregate: "sum",
        meaning: "Findings raised at your last internal or external audit that are still open.",
        measured: "Count findings not yet closed out.\n\n=COUNTIFS(FindingStatus, \"<>Closed\", AuditDate, \">=\"&PeriodStart)",
        entries: seedEntries(sy, sm, 3, 0.6, 0.5, "sum") }),
      mkKpi({ name: "Certification Status", units: "%", frequency: "Monthly", direction: "higher", aggregate: "avg",
        meaning: "The share of certifications you need that are current and valid today.",
        measured: "Valid certifications over required certifications.\n\n=COUNTIFS(ExpiryDate, \">\"&TODAY()) / COUNTA(CertificateName) * 100",
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
/* Bigger by default — at 18px the icons read as decoration rather than status. */
const StatusIcon = ({ status, size = 24 }) => {
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
  frequency: { label: "Frequency", width: 126, align: "center", tip: "How often this KPI is captured — daily, weekly, monthly or quarterly.", filter: true, sort: true, hideable: true },
  budget:    { label: "Budget", width: 138, align: "center", tip: "What you planned for the selected period. Read it against the Units column.", sort: true, hideable: true },
  actual:    { label: "Actual", width: 138, align: "center", tip: "What was recorded for the selected period.", sort: true, hideable: true },
  variance:  { label: "Variance", width: 138, align: "center", tip: "Actual minus Budget. Green means favourable for this KPI's direction.", sort: true, hideable: true },
  status:    { label: "Status", width: 100, align: "center", tip: "Green: on budget. Amber: needs attention. Red: well outside budget.", filter: true, sort: true, hideable: true },
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
const btnDanger = { ...btnBase, background: T.redBg, color: T.red, border: `1px solid ${T.red}44` };
const inputS = { width: "100%", padding: "9px 11px", border: `1px solid ${T.lineStrong}`, borderRadius: "8px",
  fontSize: "13.5px", fontFamily: "inherit", boxSizing: "border-box", color: T.ink, background: T.bg, outline: "none" };
const selectS = { ...inputS, cursor: "pointer" };
const labelS = { display: "block", fontSize: "12.5px", fontWeight: 600, color: T.accent, marginBottom: "5px" };
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "14px 16px" };

/* Auto-save: one debounced writer shared by notes, KPI text and chart config. */
const useAutoSave = (value, onSave, { delay = 800, skipFirst = true } = {}) => {
  const [state, setState] = useState("idle"); // idle | saving | saved
  const saveRef = useRef(onSave);
  const first = useRef(skipFirst);
  saveRef.current = onSave;
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setState("saving");
    const t = setTimeout(async () => {
      try { await saveRef.current(value); setState("saved"); }
      catch { setState("idle"); }
    }, delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return state;
};

const SaveState = ({ state, idleText = "" }) => {
  if (state === "saving") return <span style={{ fontSize: "12px", color: T.muted, display: "inline-flex", alignItems: "center", gap: "5px" }}><RefreshCw size={11} /> Saving…</span>;
  if (state === "saved") return <span style={{ fontSize: "12px", color: T.green, display: "inline-flex", alignItems: "center", gap: "5px" }}><Check size={12} /> Saved</span>;
  return idleText ? <span style={{ fontSize: "12px", color: T.muted }}>{idleText}</span> : null;
};

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
  { value: "higher", label: "Higher is better", hint: "e.g. on-time delivery" },
  { value: "lower", label: "Lower is better", hint: "e.g. defect rate" },
  { value: "match", label: "Matching is better", hint: "e.g. headcount to plan" },
];

/* ─── KPI info popup — edits save themselves ────────────────────────────── */
const KpiInfoModal = ({ kpi, onClose, onSave, readOnly }) => {
  const [meaning, setMeaning] = useState(kpi.meaning || "");
  const [measured, setMeasured] = useState(kpi.measured || "");
  const payload = useMemo(() => ({ meaning, measured }), [meaning, measured]);
  const saveState = useAutoSave(payload, (p) => { if (!readOnly) onSave(p); });

  const box = (v, empty, mono) => (
    <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: "8px", padding: "13px 15px",
      fontSize: mono ? "13px" : "14px", lineHeight: 1.65, color: v ? T.body : T.faint,
      fontStyle: v ? "normal" : "italic", whiteSpace: "pre-wrap",
      fontFamily: mono && v ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit" }}>
      {v || empty}
    </div>
  );

  return (
    <Modal title={kpi.name} subtitle="What it means and how it is measured" icon={<Eye size={17} />} onClose={onClose}
      footer={<>
        <span style={{ flex: 1, textAlign: "left" }}><SaveState state={saveState} idleText={readOnly ? "Read only" : "Changes save automatically"} /></span>
        <button onClick={onClose} style={btnPrimary}>Close</button>
      </>}>
      <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "18px" }}>
        {[`Units: ${kpi.units}`, `Captured ${kpi.frequency.toLowerCase()}`,
          DIRECTIONS.find((d) => d.value === kpi.direction)?.label,
          kpi.aggregate === "avg" ? "AVERAGE across periods" : "SUM across periods"].map((c) => (
          <span key={c} style={{ fontSize: "12px", padding: "4px 11px", borderRadius: "999px", background: T.raised, color: T.body }}>{c}</span>
        ))}
      </div>

      <div style={{ marginBottom: "18px" }}>
        <label style={labelS}>What does this KPI mean?</label>
        {readOnly
          ? box(meaning, "Not captured yet.", false)
          : <textarea rows="3" value={meaning} onChange={(e) => setMeaning(e.target.value)} style={{ ...inputS, resize: "vertical" }}
              placeholder="In plain words — what is this number telling you?" />}
      </div>

      <div>
        <label style={{ ...labelS, display: "flex", alignItems: "center", gap: "6px" }}>
          <Sigma size={13} /> How is this KPI measured?
        </label>
        {readOnly
          ? box(measured, "Not captured yet.", true)
          : <textarea rows="6" value={measured} onChange={(e) => setMeasured(e.target.value)}
              style={{ ...inputS, resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "13px" }}
              placeholder={"Write it the way you'd build it in Excel, e.g.\n\n=SUMIFS(Units, QCResult, \"Pass\") / SUM(Units) * 100"} />}
        <p style={{ fontSize: "12px", color: T.muted, marginTop: "8px", marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
          <Info size={12} /> Written in Excel terms so it can be rebuilt in a spreadsheet as-is.
        </p>
      </div>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Analysis — one engine, two scopes.
   scope="period"  : reads only the selected timeframe (used under the chart)
   scope="summary" : reads week, month, quarter and year together (table icon)
   ════════════════════════════════════════════════════════════════════════ */
const localPeriodAnalysis = (kpi, period, v, fy) => {
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

const localSummaryAnalysis = (kpi, fy) => {
  const rows = PERIODS.map((p) => ({
    key: p.key, label: p.label,
    status: getStatus(kpi, p.key, fy),
    variance: getVariance(kpi, p.key, fy),
    v: periodValues(kpi, p.key, fy),
  }));
  const withData = rows.filter((r) => r.status.key !== "none");
  const reds = withData.filter((r) => r.status.key === "red");
  const ambers = withData.filter((r) => r.status.key === "amber");
  const greens = withData.filter((r) => r.status.key === "green");
  const wk = rows.find((r) => r.key === "week"), yr = rows.find((r) => r.key === "year");

  const observations = rows.map((r) => r.status.key === "none"
    ? `${r.label}: not enough captured data to assess.`
    : `${r.label}: ${fmtValue(r.v.actual, kpi)} against ${fmtValue(r.v.budget, kpi)} — ${r.status.label.toLowerCase()}.`);
  observations.push(`Across all four timeframes: ${greens.length} on budget, ${ambers.length} needing attention, ${reds.length} critical.`);

  const trends = [];
  if (wk?.status.key !== "none" && yr?.status.key !== "none") {
    const wf = varianceFavourable(kpi, wk.variance), yf = varianceFavourable(kpi, yr.variance);
    if (wf && !yf) trends.push("The short term is recovering ahead of the year — the recent weeks are stronger than the year-to-date picture.");
    else if (!wf && yf) trends.push("The year-to-date position is still favourable but the most recent week is not. This is where deterioration usually shows first.");
    else if (wf && yf) trends.push("Short and long timeframes agree and are both favourable — performance is consistent rather than lucky in one period.");
    else trends.push("Both the week and the year are unfavourable, so this is a structural gap rather than a bad period.");
  } else {
    trends.push("Not every timeframe has data, so the short-versus-long comparison is partial.");
  }
  trends.push(reds.length >= 2
    ? "Two or more timeframes are critical, which usually means the budget assumption itself needs revisiting."
    : "Read the quarter as the honest middle ground — it absorbs weekly noise without hiding a bad month.");

  const issues = reds.length || ambers.length
    ? [
        `Off budget on ${[...reds, ...ambers].map((r) => r.label.toLowerCase()).join(", ")}.`,
        reds.length ? "At least one timeframe is critical and should carry a named owner and a dated action."
          : "The drift is contained for now, but it is present at more than one timeframe.",
      ]
    : ["Nothing material across any timeframe. The exposure is complacency — budgets that are no longer stretching."];

  const opportunities = reds.length || ambers.length
    ? ["Raise a single action against this KPI rather than one per timeframe — the underlying cause is the same.",
       kpi.direction === "higher" ? "Remove the largest constraint on output before adding capacity or targets."
         : "Rank the contributors driving this number and address the largest one first.",
       "Re-check the budget assumption: if every timeframe misses, the plan may be the problem, not the delivery."]
    : ["Tighten the budget so it continues to stretch, and re-baseline at the next review.",
       "Lift what is working here into the weaker KPIs in the same category."];

  return { observations, trends, issues, opportunities };
};

const AnalysisPanel = ({ kpi, period, fy, scope = "period", embedded = false }) => {
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
          scope, // "period" or "summary"
          timeframe: scope === "summary" ? "All timeframes" : PERIOD_LABEL[period],
          financialYearStartMonth: fy.startMonth,
          budget: v.budget, actual: v.actual, variance: getVariance(kpi, period, fy),
          status: getStatus(kpi, period, fy).label,
          allTimeframes: PERIODS.map((p) => ({
            timeframe: p.label, ...periodValues(kpi, p.key, fy),
            variance: getVariance(kpi, p.key, fy), status: getStatus(kpi, p.key, fy).label,
          })),
          notes: kpi.notes || "", entries: kpi.entries || {},
        });
        const d = res?.data;
        if (d?.observations && d?.opportunities) {
          setAnalysis({ observations: d.observations || [], trends: d.trends || [], issues: d.issues || [], opportunities: d.opportunities || [] });
          setSource("ai"); return;
        }
        throw new Error("The function replied, but not in the expected shape.");
      } catch (err) {
        // "not-found" means the Cloud Function isn't deployed — a different
        // fix from a permissions error, so name it.
        console.error("AI analysis unavailable:", err);
        setReason(err?.code === "functions/not-found" ? "The generateKpiAnalysis function isn't deployed yet." : errText(err));
        setSource("local");
        setAnalysis(scope === "summary" ? localSummaryAnalysis(kpi, fy) : localPeriodAnalysis(kpi, period, v, fy));
      } finally { setLoading(false); }
    })();
  }, [kpi, period, fy, scope]);

  useEffect(() => { build(); }, [build]);

  const Section = ({ label, items, color }) => (!items || !items.length) ? null : (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.7px", textTransform: "uppercase", color, marginBottom: "7px" }}>{label}</div>
      <ul style={{ margin: 0, paddingLeft: "18px", color: T.body, fontSize: "13.5px", lineHeight: 1.65 }}>
        {items.map((it, i) => <li key={i} style={{ marginBottom: "4px" }}>{it}</li>)}
      </ul>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ ...labelS, marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
          <Lightbulb size={13} /> Observations and Opportunities
          <span style={{ fontWeight: 500, color: T.muted }}>
            · {scope === "summary" ? "all timeframes" : PERIOD_LABEL[period].toLowerCase()}
          </span>
        </span>
        <button onClick={build} disabled={loading} style={{ ...btnGhost, padding: "5px 10px", fontSize: "12.5px", opacity: loading ? 0.6 : 1 }}>
          <RefreshCw size={12} /> Regenerate
        </button>
      </div>

      {!loading && (
        <div style={{ fontSize: "12px", color: source === "ai" ? T.muted : T.amber, marginBottom: "12px",
          display: "flex", alignItems: "flex-start", gap: "6px", lineHeight: 1.5 }}>
          <Info size={12} style={{ marginTop: "2px", flexShrink: 0 }} />
          {source === "ai"
            ? (scope === "summary"
                ? "Generated from your figures across the week, month, quarter and year."
                : `Generated from your ${PERIOD_PREFIX[period].toLowerCase()} figures — it changes when you change the timeframe.`)
            : <span>AI unavailable — showing a rules-based summary built from your figures.<br /><span style={{ color: T.muted }}>{reason}</span></span>}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: embedded ? "26px 0" : "44px 0", color: T.body, fontSize: "13.5px" }}>
          <RefreshCw size={20} color={T.faint} /><div style={{ marginTop: "12px" }}>Reviewing {kpi.name}...</div>
        </div>
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

/* Table icon → the everything-considered version. */
const AnalysisModal = ({ kpi, period, fy, onClose }) => (
  <Modal title="Observations and Opportunities" subtitle={`${kpi.name} · summary across all timeframes`}
    icon={<Lightbulb size={17} />} onClose={onClose} width={700}
    footer={<button onClick={onClose} style={btnPrimary}>Close</button>}>
    <AnalysisPanel kpi={kpi} period={period} fy={fy} scope="summary" />
  </Modal>
);

/* ════════════════════════════════════════════════════════════════════════════
   Trend chart.

   Variance sits in its own chart, above Budget vs Actual, on its own scale.
   Values print on the series at two decimals, so the y-axis is switched off.
   Everything below the charts — averages, note, analysis — is always visible.
   ════════════════════════════════════════════════════════════════════════ */
const CHART_TYPES = [
  { value: "bar", label: "Bars" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
];

/* chartjs-plugin-datalabels is registered globally elsewhere in this app. If
   it isn't switched off per-chart it draws every value again, unrounded —
   which is where "0.8199999999999998" came from, layered on top of the
   formatted labels. Both charts must carry this. */
const NO_DATALABELS = { display: false };

const TrendChartModal = ({ kpi, period, fy, onClose, onSaveNote, onSaveConfig, readOnly }) => {
  const [showCustomise, setShowCustomise] = useState(false);
  const cfg = { ...DEFAULT_CHART, ...(kpi.chartConfig || {}) };
  const setCfg = (patch) => { if (!readOnly) onSaveConfig({ ...cfg, ...patch }); };

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

  /* ── Note: always visible, auto-saved ─────────────────────────────────── */
  const [noteText, setNoteText] = useState(kpi.periodNotes?.[noteKey] || "");
  useEffect(() => { setNoteText(kpi.periodNotes?.[noteKey] || ""); /* eslint-disable-next-line */ }, [noteKey]);
  const noteState = useAutoSave(noteText, (t) => { if (!readOnly) onSaveNote(noteKey, t); });

  /* ── Averages ─────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const A = actual.filter(Number.isFinite), B = budget.filter(Number.isFinite), V = variance.filter(Number.isFinite);
    const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const sum = (a) => (a.length ? a.reduce((x, y) => x + y, 0) : null);
    const score = (v) => (kpi.direction === "higher" ? v : kpi.direction === "lower" ? -v : -Math.abs(v));
    let best = null, worst = null;
    variance.forEach((v, i) => {
      if (!Number.isFinite(v)) return;
      if (best === null || score(v) > score(variance[best])) best = i;
      if (worst === null || score(v) < score(variance[worst])) worst = i;
    });
    return {
      avgActual: avg(A), avgBudget: avg(B), avgVariance: avg(V),
      totalActual: sum(A), totalBudget: sum(B),
      periods: A.length, ofPeriods: actual.length,
      best: best === null ? null : { label: labels[best], v: variance[best] },
      worst: worst === null ? null : { label: labels[worst], v: variance[worst] },
    };
  }, [actual, budget, variance, labels, kpi.direction]);

  /* ── Series value labels ──────────────────────────────────────────────────
     Two decimals throughout. Each label is measured before it is drawn, and
     anything that would land on a label already placed is dropped rather than
     stacked. Bar labels sit inside the bar where there is room, which keeps
     them clear of the budget line crossing the same region.                 */
  const showValues = cfg.showLabels;
  const valueLabelPlugin = useMemo(() => ({
    id: "opValueLabels",
    afterDatasetsDraw(chart) {
      if (!showValues) return;
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      ctx.save();
      ctx.font = "600 10.5px ui-sans-serif, system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const placed = [];
      const clashes = (r) => placed.some((p) => !(r.x2 < p.x1 || r.x1 > p.x2 || r.y2 < p.y1 || r.y1 > p.y2));

      chart.data.datasets.forEach((ds, di) => {
        const meta = chart.getDatasetMeta(di);
        if (meta.hidden) return;
        meta.data.forEach((el, i) => {
          const raw = ds.data[i];
          if (!Number.isFinite(raw)) return;
          const text = fmtChart(raw, kpi, { signed: !!ds.__signed });
          if (!text) return;

          const w = ctx.measureText(text).width;
          const x = el.x;
          let y, color = ds.__labelColor || T.body;

          if (ds.type === "bar") {
            const base = Number.isFinite(el.base) ? el.base : chartArea.bottom;
            const height = Math.abs(base - el.y);
            const upward = el.y <= base;
            if (height >= 30) {
              // Inside the bar, in white — always legible, and it can't
              // collide with the budget line sitting at a similar height.
              y = upward ? el.y + 13 : el.y - 13;
              color = "#ffffff";
            } else {
              y = upward ? el.y - 11 : el.y + 11;
            }
          } else {
            y = el.y - 13;
          }

          const rect = { x1: x - w / 2 - 4, x2: x + w / 2 + 4, y1: y - 8, y2: y + 8 };
          if (rect.x1 < chartArea.left - 8 || rect.x2 > chartArea.right + 8) return;
          if (rect.y1 < chartArea.top - 16 || rect.y2 > chartArea.bottom + 16) return;
          if (clashes(rect)) return;

          placed.push(rect);
          ctx.fillStyle = color;
          ctx.fillText(text, x, y);
        });
      });
      ctx.restore();
    },
  }), [showValues, kpi]);

  const mkDataset = (label, data, type, color, extra = {}) => {
    const base = { label, data, order: extra.order ?? 1, __labelColor: extra.__labelColor || T.body, __signed: !!extra.__signed,
      datalabels: NO_DATALABELS };
    if (type === "bar") {
      return { ...base, type: "bar", backgroundColor: extra.backgroundColor || hexA(color, 0.78),
        borderColor: color, borderWidth: 0, borderRadius: 4, barPercentage: 0.58, categoryPercentage: 0.74 };
    }
    return { ...base, type: "line", borderColor: color, backgroundColor: hexA(color, 0.16),
      borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 5, pointBackgroundColor: color,
      tension: 0.25, spanGaps: true, fill: type === "area" };
  };

  const noAxes = {
    y: { display: false, grace: "26%" },
    x: { grid: { display: false }, border: { color: T.line },
      ticks: { color: T.body, font: { size: 11 }, maxRotation: 45, minRotation: 0, autoSkip: true, maxTicksLimit: 14 } },
  };
  const legendCfg = (show) => ({ display: show, position: "top", align: "end",
    labels: { color: T.body, font: { size: 12.5 }, padding: 14, usePointStyle: true, boxWidth: 8 } });

  /* Variance chart — favourable green, unfavourable red. */
  const varColors = variance.map((v) =>
    v === null ? hexA(T.faint, 0.3) : varianceFavourable(kpi, v) ? hexA(cfg.favColor, 0.8) : hexA(cfg.unfavColor, 0.8));

  const varianceData = {
    labels,
    datasets: [mkDataset("Variance", variance, cfg.varianceType === "bar" ? "bar" : cfg.varianceType,
      cfg.favColor, { backgroundColor: varColors, __signed: true, __labelColor: T.body })],
  };
  const varianceOptions = {
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { top: 24, bottom: 8 } },
    interaction: { mode: "index", intersect: false },
    plugins: {
      datalabels: NO_DATALABELS,   // silences the globally registered plugin
      legend: legendCfg(false),
      tooltip: { backgroundColor: T.ink, padding: 10, cornerRadius: 8,
        callbacks: { label: (c) => c.parsed.y === null ? "No data"
          : `Variance: ${fmtValue(c.parsed.y, kpi, { signed: true })} (${varianceFavourable(kpi, c.parsed.y) ? "favourable" : "unfavourable"})` } },
    },
    scales: noAxes,
  };

  const mainData = {
    labels,
    datasets: [
      mkDataset("Budget", budget, cfg.budgetType, cfg.budgetColor, { order: 1, __labelColor: cfg.budgetColor }),
      mkDataset("Actual", actual, cfg.actualType, cfg.actualColor, { order: 2, __labelColor: cfg.actualColor }),
    ],
  };
  const mainOptions = {
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { top: 26, bottom: 4 } },
    interaction: { mode: "index", intersect: false },
    plugins: {
      datalabels: NO_DATALABELS,   // silences the globally registered plugin
      legend: legendCfg(cfg.showLegend),
      tooltip: { backgroundColor: T.ink, padding: 12, cornerRadius: 8,
        callbacks: { label: (c) => c.parsed.y === null ? `${c.dataset.label}: no data` : `${c.dataset.label}: ${fmtValue(c.parsed.y, kpi)}` } },
    },
    scales: noAxes,
  };

  const Tile = ({ label, value, color = T.ink, hint }) => (
    <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: "9px", padding: "10px 12px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: T.muted }}>{label}</div>
      <div style={{ fontSize: "16px", fontWeight: 700, color, marginTop: "3px", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {hint && <div style={{ fontSize: "11.5px", color: T.muted, marginTop: "2px" }}>{hint}</div>}
    </div>
  );

  const colorField = (label, key) => (
    <div>
      <label style={{ ...labelS, fontSize: "12px" }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input type="color" value={cfg[key]} onChange={(e) => setCfg({ [key]: e.target.value })}
          style={{ width: "38px", height: "32px", border: `1px solid ${T.lineStrong}`, borderRadius: "7px", background: T.bg, cursor: "pointer", padding: "2px" }} />
        <span style={{ fontSize: "12px", color: T.muted, fontFamily: "ui-monospace, monospace" }}>{cfg[key]}</span>
      </div>
    </div>
  );

  return (
    <Modal title={`${kpi.name} — Trend`} subtitle={caption} icon={<LineChartIcon size={17} />} onClose={onClose} width={960}
      footer={<>
        <div style={{ flex: 1, fontSize: "12px", color: T.body, textAlign: "left", display: "flex", alignItems: "center", gap: "6px" }}>
          <Info size={12} /> Green variance is favourable for this KPI's direction; red is not.
        </div>
        <button onClick={onClose} style={btnPrimary}>Close</button>
      </>}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "12.5px", color: T.muted }}>
          {PERIOD_PREFIX[period]} view · values printed to 2 decimals; hover any point for the exact figure
        </span>
        {!readOnly && (
          <button onClick={() => setShowCustomise((v) => !v)} style={{ ...btnGhost, padding: "6px 12px", fontSize: "12.5px" }}>
            <Palette size={13} /> Customise chart {showCustomise ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {showCustomise && (
        <div style={{ ...cardS, background: T.panel, marginBottom: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ ...labelS, fontSize: "12px" }}>Actual as</label>
              <select value={cfg.actualType} onChange={(e) => setCfg({ actualType: e.target.value })} style={selectS}>
                {CHART_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...labelS, fontSize: "12px" }}>Budget as</label>
              <select value={cfg.budgetType} onChange={(e) => setCfg({ budgetType: e.target.value })} style={selectS}>
                {CHART_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...labelS, fontSize: "12px" }}>Variance as</label>
              <select value={cfg.varianceType} onChange={(e) => setCfg({ varianceType: e.target.value })} style={selectS}>
                {CHART_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {colorField("Actual colour", "actualColor")}
            {colorField("Budget colour", "budgetColor")}
            {colorField("Favourable", "favColor")}
            {colorField("Unfavourable", "unfavColor")}
          </div>
          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", alignItems: "center" }}>
            {[
              { key: "showLabels", label: "Show values on the series" },
              { key: "showLegend", label: "Show legend" },
              { key: "showVariance", label: "Show the variance chart" },
            ].map((o) => (
              <label key={o.key} onClick={() => setCfg({ [o.key]: !cfg[o.key] })}
                style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: T.body, cursor: "pointer" }}>
                {cfg[o.key] ? <CheckSquare size={15} color={T.accent} /> : <Square size={15} color={T.muted} />} {o.label}
              </label>
            ))}
            <button onClick={() => setCfg({ ...DEFAULT_CHART })} style={{ ...btnQuiet, padding: "4px 8px", fontSize: "12.5px", marginLeft: "auto" }}>
              <RefreshCw size={12} /> Reset to default
            </button>
          </div>
          <p style={{ fontSize: "12px", color: T.muted, margin: "10px 0 0", display: "flex", alignItems: "flex-start", gap: "6px", lineHeight: 1.55 }}>
            <Check size={12} color={T.green} style={{ marginTop: "2px", flexShrink: 0 }} />
            Chart settings save themselves against this KPI. Values print to 2 decimals; thousands show as k and millions as M, and any label that would sit on top of another is left out so the chart stays readable.
          </p>
        </div>
      )}

      {cfg.showVariance && (
        <div style={{ ...cardS, padding: "14px 16px 10px", marginBottom: "12px" }}>
          <div style={{ fontSize: "12.5px", fontWeight: 600, color: T.accent, marginBottom: "6px" }}>
            Variance — Actual less Budget
            <span style={{ fontWeight: 400, color: T.muted, marginLeft: "8px" }}>own scale, own chart</span>
          </div>
          <div style={{ height: "210px" }}>
            <Chart type="bar" data={varianceData} options={varianceOptions} plugins={[valueLabelPlugin]} />
          </div>
        </div>
      )}

      <div style={{ ...cardS, marginBottom: "14px" }}>
        <div style={{ fontSize: "12.5px", fontWeight: 600, color: T.accent, marginBottom: "4px" }}>Budget vs Actual</div>
        <div style={{ height: "330px" }}>
          <Chart type="bar" data={mainData} options={mainOptions} plugins={[valueLabelPlugin]} />
        </div>
      </div>

      {/* Averages, right under the chart */}
      <div style={{ marginBottom: "14px" }}>
        <div style={{ ...labelS, display: "flex", alignItems: "center", gap: "6px" }}>
          <Sigma size={13} /> Averages across the {PERIOD_PREFIX[period].toLowerCase()} periods shown
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
          <Tile label="Average actual" value={fmtValue(stats.avgActual, kpi)} />
          <Tile label="Average budget" value={fmtValue(stats.avgBudget, kpi)} />
          <Tile label="Average variance" value={fmtValue(stats.avgVariance, kpi, { signed: true })}
            color={stats.avgVariance === null ? T.faint : varianceFavourable(kpi, stats.avgVariance) ? T.green : T.red} />
          {kpi.aggregate === "sum" && <Tile label="Total actual" value={fmtValue(stats.totalActual, kpi)} hint={`Budget ${fmtValue(stats.totalBudget, kpi)}`} />}
          <Tile label="Best period" value={stats.best ? fmtValue(stats.best.v, kpi, { signed: true }) : "—"} color={T.green} hint={stats.best?.label} />
          <Tile label="Worst period" value={stats.worst ? fmtValue(stats.worst.v, kpi, { signed: true }) : "—"} color={T.red} hint={stats.worst?.label} />
          <Tile label="Periods with data" value={`${stats.periods} of ${stats.ofPeriods}`} />
        </div>
      </div>

      {/* Note is always on screen and saves itself */}
      <div style={{ ...cardS, background: T.panel, marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", gap: "10px" }}>
          <span style={{ ...labelS, marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
            <StickyNote size={12} /> Note for this period
          </span>
          <SaveState state={noteState} idleText={readOnly ? "Read only" : "Saves as you type"} />
        </div>
        {readOnly
          ? <p style={{ margin: 0, fontSize: "14px", color: noteText ? T.body : T.faint, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{noteText || "No note for this period."}</p>
          : <textarea rows="3" value={noteText} onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Production decreased this month due to scheduled maintenance."
              style={{ ...inputS, resize: "vertical", background: T.bg }} />}
      </div>

      {/* Analysis for this timeframe, always visible */}
      <div style={cardS}>
        <AnalysisPanel kpi={kpi} period={period} fy={fy} scope="period" embedded />
      </div>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Add Action.

   One field: Action. It is what appears in the Action column on the
   Integrated Actions page, so it is written as an instruction, not a
   description of the problem. The KPI figures that prompted it are attached
   automatically as context rather than typed by hand.
   ════════════════════════════════════════════════════════════════════════ */
const AddActionModal = ({ kpi, period, fy, categoryName, subCategoryName, userId, onClose, onSaved }) => {
  const [meetings, setMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [meetingId, setMeetingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const status = getStatus(kpi, period, fy);
  const variance = getVariance(kpi, period, fy);
  const v = periodValues(kpi, period, fy);

  /* Generated, never typed — it travels with the action so the meeting can
     see the figures behind it without the user restating them. */
  const context = `${PERIOD_LABEL[period]} actual ${fmtValue(v.actual, kpi)} against budget ${fmtValue(v.budget, kpi)}${
    variance === null ? "" : ` (variance ${fmtValue(variance, kpi, { signed: true })})`}. Raised from ${categoryName} · ${subCategoryName}.`;

  const [form, setForm] = useState({
    action: status.key === "green" ? `Sustain performance on ${kpi.name}` : `Close the gap on ${kpi.name}`,
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
    if (!form.action.trim()) return;
    setSaving(true); setMessage("");
    try {
      const snap = await getDoc(doc(db, "governanceCalendar", userId));
      let list = snap.exists() ? snap.data().meetings || [] : [];
      const action = {
        // `title` is what the Integrated Actions page shows in its Action
        // column, so the single Action field maps straight onto it.
        id: uid(), title: form.action.trim(), description: context,
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
        <button onClick={save} disabled={saving || !form.action.trim()} style={{ ...btnPrimary, opacity: saving || !form.action.trim() ? 0.6 : 1 }}>
          {saving ? "Saving..." : "Save Action"}</button>
      </>}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px",
        background: status.bg, border: `1px solid ${status.color}33`, marginBottom: "16px" }}>
        <StatusIcon status={status} size={22} />
        <div style={{ fontSize: "14px", color: T.body }}>
          <strong style={{ color: T.accent }}>{kpi.name}</strong> is {status.label.toLowerCase()} for {PERIOD_LABEL[period].toLowerCase()}.
          What action are you going to take?
        </div>
      </div>

      <div style={{ marginBottom: "6px" }}>
        <label style={labelS}>Action *</label>
        <textarea rows="3" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}
          style={{ ...inputS, resize: "vertical" }}
          placeholder="What needs to be done, by the time it is due?" />
        <p style={{ fontSize: "12px", color: T.muted, margin: "7px 0 0", display: "flex", alignItems: "flex-start", gap: "6px" }}>
          <Info size={12} style={{ marginTop: "2px", flexShrink: 0 }} />
          This is the wording that appears in the Action column on the Integrated Actions page.
        </p>
      </div>

      {/* The figures behind the action, attached automatically. */}
      <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: "9px",
        padding: "10px 13px", margin: "14px 0", fontSize: "12.5px", color: T.muted, lineHeight: 1.6 }}>
        <span style={{ fontWeight: 600, color: T.accent }}>Attached context: </span>{context}
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
            {form.category && !RAPS_CATEGORIES.some((c) => c.name === form.category) && <option value={form.category}>{form.category}</option>}
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
      <p style={{ fontSize: "12px", color: T.muted, marginTop: "16px", marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
        <Info size={11} /> Saved actions appear in Integrated Actions and in the meeting's Meeting Actions tab.
      </p>
    </Modal>
  );
};

/* ─── KPI notes — auto-saved ────────────────────────────────────────────── */
const NotesModal = ({ kpi, onClose, onSave, readOnly }) => {
  const [notes, setNotes] = useState(kpi.notes || "");
  const state = useAutoSave(notes, (n) => { if (!readOnly) onSave(n); });
  return (
    <Modal title={`Notes — ${kpi.name}`} icon={<StickyNote size={17} />} onClose={onClose}
      footer={<>
        <span style={{ flex: 1, textAlign: "left" }}><SaveState state={state} idleText={readOnly ? "Read only" : "Saves as you type"} /></span>
        <button onClick={onClose} style={btnPrimary}>Close</button>
      </>}>
      <label style={labelS}>Context, anomalies or anything worth remembering about this KPI</label>
      <textarea rows="9" value={notes} readOnly={readOnly} onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g. Two suppliers were on shutdown for the first half of the period, which explains the dip."
        style={{ ...inputS, resize: "vertical" }} />
    </Modal>
  );
};

/* ─── Manage categories — hide or delete ────────────────────────────────── */
const ManageCategoriesModal = ({ structure, activeCategoryId, onClose, onToggleHidden, onRename, onDelete }) => {
  const [confirmId, setConfirmId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const kpiCount = (c) => c.subCategories.reduce((s, sub) => s + sub.kpis.length, 0);

  return (
    <Modal title="Categories" subtitle="Hide a category to take it off the tabs, or delete it outright."
      icon={<Layers size={17} />} onClose={onClose} width={640}
      footer={<>
        <span style={{ flex: 1, textAlign: "left", fontSize: "12px", color: T.muted, display: "flex", alignItems: "center", gap: "6px" }}>
          <Check size={12} color={T.green} /> Changes save themselves
        </span>
        <button onClick={onClose} style={btnPrimary}>Done</button>
      </>}>
      <div style={{ border: `1px solid ${T.line}`, borderRadius: "10px", overflow: "hidden" }}>
        {structure.map((c, i) => {
          const confirming = confirmId === c.id;
          const name = drafts[c.id] !== undefined ? drafts[c.id] : c.name;
          return (
            <div key={c.id} style={{ padding: "12px 14px", background: i % 2 ? T.panel : T.bg,
              borderBottom: i === structure.length - 1 ? "none" : `1px solid ${T.lineSoft}`,
              opacity: c.hidden ? 0.62 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <input value={name}
                  onChange={(e) => setDrafts((p) => ({ ...p, [c.id]: e.target.value }))}
                  onBlur={() => { const v = (drafts[c.id] ?? c.name).trim(); if (v && v !== c.name) onRename(c.id, v); }}
                  style={{ ...inputS, flex: 1, minWidth: "180px", fontWeight: 600, color: T.ink }} />
                <span style={{ fontSize: "12px", color: T.muted, whiteSpace: "nowrap" }}>
                  {c.subCategories.length} sub · {kpiCount(c)} KPIs
                </span>
                <button onClick={() => onToggleHidden(c.id)} style={{ ...btnGhost, padding: "7px 11px", fontSize: "12.5px" }}
                  title={c.hidden ? "Show this category" : "Hide this category"}>
                  {c.hidden ? <><EyeOff size={13} /> Hidden</> : <><Eye size={13} /> Visible</>}
                </button>
                <button onClick={() => setConfirmId(confirming ? null : c.id)} style={{ ...btnGhost, padding: "7px 11px", color: T.red, borderColor: `${T.red}44` }}
                  title="Delete this category">
                  <Trash2 size={13} />
                </button>
              </div>

              {confirming && (
                <div style={{ marginTop: "10px", background: T.redBg, border: `1px solid ${T.red}33`, borderRadius: "9px", padding: "11px 13px" }}>
                  <div style={{ fontSize: "13px", color: T.red, marginBottom: "9px", display: "flex", gap: "7px", alignItems: "flex-start" }}>
                    <AlertTriangle size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
                    Deleting <strong style={{ margin: "0 3px" }}>{c.name}</strong> removes {kpiCount(c)} KPIs and every figure captured against them. This cannot be undone — hide it instead if you may want it back.
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => { onDelete(c.id); setConfirmId(null); }} style={{ ...btnDanger, padding: "7px 13px", fontSize: "12.5px" }}>
                      <Trash2 size={12} /> Delete permanently
                    </button>
                    <button onClick={() => { onToggleHidden(c.id, true); setConfirmId(null); }} style={{ ...btnGhost, padding: "7px 13px", fontSize: "12.5px" }}>
                      <EyeOff size={12} /> Just hide it
                    </button>
                    <button onClick={() => setConfirmId(null)} style={{ ...btnQuiet, padding: "7px 13px", fontSize: "12.5px" }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: "12px", color: T.muted, marginTop: "12px", marginBottom: 0, display: "flex", alignItems: "flex-start", gap: "6px" }}>
        <Info size={12} style={{ marginTop: "2px" }} /> Hidden categories keep all their data and stay out of the tabs and the CSV until you show them again.
      </p>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Add Data — auto-saving.
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
  const [catId, setCatId] = useState(prefs?.catId || structure[0].id);
  const [startYear, setStartYear] = useState(prefs?.startYear ?? fy.startYear);
  const category = structure.find((c) => c.id === catId) || structure[0];
  const derived = useMemo(() => deriveFrequency(category), [category]);
  const [frequency, setFrequency] = useState(prefs?.frequency || derived.frequency);
  const [freqOverridden, setFreqOverridden] = useState(!!prefs?.frequency);
  const [monthForDays, setMonthForDays] = useState(0);
  const [kpiIndex, setKpiIndex] = useState(0);
  const [draft, setDraft] = useState({});
  const [saveState, setSaveState] = useState("idle");

  const structureRef = useRef(structure);
  structureRef.current = structure;
  const timer = useRef(null);

  const kpis = useMemo(() => category.subCategories.flatMap((s) => s.kpis.map((k) => ({ ...k, sub: s.name }))), [category]);
  const kpi = kpis[Math.min(kpiIndex, kpis.length - 1)];

  useEffect(() => {
    if (!freqOverridden) setFrequency(derived.frequency);
    setKpiIndex(0);
  }, [catId, derived.frequency, freqOverridden]);

  const yearOptions = [
    { value: fy.startYear - 1, badge: "FY−", label: fyLabel(fy.startYear - 1, fy.startMonth) },
    { value: fy.startYear,     badge: "FY",  label: fyLabel(fy.startYear, fy.startMonth) },
    { value: fy.startYear + 1, badge: "FY+", label: fyLabel(fy.startYear + 1, fy.startMonth) },
  ];

  const periods = useMemo(() => {
    if (frequency === "Monthly") return fyMonths(startYear, fy.startMonth).map((m) => ({ key: m.key, label: m.long, hint: "" }));
    if (frequency === "Weekly") return fyWeeks(startYear, fy.startMonth).map((w) => ({ key: w.key, label: w.label, hint: w.short }));
    const m = fyMonths(startYear, fy.startMonth)[monthForDays] || fyMonths(startYear, fy.startMonth)[0];
    return daysInMonth(m.year, m.month).map((d) => ({ key: d.key, label: d.label, hint: "" }));
  }, [frequency, startYear, fy.startMonth, monthForDays]);

  const value = (key, field) => {
    const d = draft[kpi?.id]?.[key];
    if (d && d[field] !== undefined) return d[field];
    return kpi?.entries?.[key]?.[field] ?? "";
  };
  const setValue = (key, field, raw) =>
    setDraft((p) => ({ ...p, [kpi.id]: { ...(p[kpi.id] || {}), [key]: { ...(p[kpi.id]?.[key] || {}), [field]: raw } } }));

  const touchedCount = Object.values(draft).reduce((s, rows) => s + Object.keys(rows).length, 0);

  const applyDraft = useCallback(() => structureRef.current.map((cat) => cat.id !== category.id ? cat : {
    ...cat,
    subCategories: cat.subCategories.map((sub) => ({
      ...sub,
      kpis: sub.kpis.map((k) => {
        const rows = draft[k.id];
        if (!rows) return k;
        const entries = { ...(k.entries || {}) };
        Object.entries(rows).forEach(([key, vals]) => {
          const actual = parseNum(vals.actual !== undefined ? vals.actual : entries[key]?.actual);
          const budget = parseNum(vals.budget !== undefined ? vals.budget : entries[key]?.budget);
          if (actual === null && budget === null) delete entries[key];
          else entries[key] = { actual, budget };
        });
        return { ...k, entries };
      }),
    })),
  }), [draft, category.id]);

  /* Auto-save: writes a short pause after the last keystroke. */
  useEffect(() => {
    if (!Object.keys(draft).length) return;
    setSaveState("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await onSave(applyDraft(), { silent: true });
      onSavePrefs({ catId, startYear, frequency: freqOverridden ? frequency : null });
      setSaveState("saved");
    }, 900);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const closeNow = async () => {
    clearTimeout(timer.current);
    if (Object.keys(draft).length) {
      await onSave(applyDraft(), { silent: false });
      onSavePrefs({ catId, startYear, frequency: freqOverridden ? frequency : null });
    }
    onClose();
  };

  const cell = { ...inputS, padding: "7px 9px", textAlign: "right", fontSize: "13.5px", minHeight: "34px" };
  const th = { padding: "9px 12px", fontSize: "11.5px", fontWeight: 700, color: "#fff", textTransform: "uppercase",
    letterSpacing: "0.5px", background: T.header, whiteSpace: "nowrap", position: "sticky", top: 0, zIndex: 2, verticalAlign: "top" };

  return (
    <Modal title="Add Data" subtitle={`Financial year starts in ${MONTHS[fy.startMonth]} · figures save themselves`} icon={<Database size={17} />}
      onClose={closeNow} width={720}
      footer={<>
        <button onClick={onBack} style={btnGhost}><ArrowLeft size={13} /> Back</button>
        <span style={{ flex: 1, fontSize: "12.5px", color: T.muted, textAlign: "left", display: "flex", alignItems: "center", gap: "10px" }}>
          <SaveState state={saveState} idleText="Blank cells are left as they are" />
          {touchedCount > 0 && <span>{touchedCount} cell{touchedCount === 1 ? "" : "s"} edited</span>}
        </span>
        <button onClick={closeNow} style={btnPrimary}>Done</button>
      </>}>

      <div style={{ display: "grid", gridTemplateColumns: frequency === "Daily" ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap: "10px", marginBottom: "14px" }}>
        <div>
          <label style={labelS}>Financial year</label>
          <select value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} style={selectS}>
            {yearOptions.map((y) => <option key={y.value} value={y.value}>{y.badge} {y.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelS}>Category</label>
          <select value={catId} onChange={(e) => setCatId(e.target.value)} style={selectS}>
            {structure.map((c) => <option key={c.id} value={c.id}>{c.name}{c.hidden ? " (hidden)" : ""}</option>)}
          </select>
        </div>
        <div>
          <label style={labelS}>Enter by</label>
          <select value={frequency}
            onChange={(e) => { setFrequency(e.target.value); setFreqOverridden(e.target.value !== derived.frequency); }}
            style={selectS}>
            {CAPTURE_FREQUENCIES.map((f) => (
              <option key={f} value={f}>{f}{f === derived.frequency ? " (your KPIs)" : ""}</option>
            ))}
          </select>
        </div>
        {frequency === "Daily" && (
          <div>
            <label style={labelS}>Month</label>
            <select value={monthForDays} onChange={(e) => setMonthForDays(Number(e.target.value))} style={selectS}>
              {fyMonths(startYear, fy.startMonth).map((m, i) => <option key={m.key} value={i}>{m.long}</option>)}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "10px" }}>
        <div style={{ flex: 1 }}>
          <label style={labelS}>KPI</label>
          <select value={kpiIndex} onChange={(e) => setKpiIndex(Number(e.target.value))} style={selectS}>
            {kpis.map((k, i) => <option key={k.id} value={i}>{k.sub} · {k.name} ({k.units})</option>)}
          </select>
        </div>
        <button onClick={() => setKpiIndex((i) => Math.max(0, i - 1))} disabled={kpiIndex === 0}
          style={{ ...btnGhost, padding: "9px 11px", opacity: kpiIndex === 0 ? 0.4 : 1 }} title="Previous KPI">
          <ChevronLeft size={14} />
        </button>
        <button onClick={() => setKpiIndex((i) => Math.min(kpis.length - 1, i + 1))} disabled={kpiIndex >= kpis.length - 1}
          style={{ ...btnGhost, padding: "9px 11px", opacity: kpiIndex >= kpis.length - 1 ? 0.4 : 1 }} title="Next KPI">
          <ChevronRight size={14} />
        </button>
      </div>

      <div style={{ fontSize: "12.5px", color: T.muted, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
        <Info size={12} /> {periods.length} {frequency === "Monthly" ? "months" : frequency === "Weekly" ? "weeks" : "days"} in FY {fyLabel(startYear, fy.startMonth)} · KPI {kpiIndex + 1} of {kpis.length} · values in {kpi?.units}
      </div>

      <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ maxHeight: "42vh", overflowY: "auto" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: "left", borderRight: `1px solid ${T.headerLine}` }}>Period</th>
                <th style={{ ...th, textAlign: "right", width: "27%", borderRight: `1px solid ${T.headerLine}` }}>Actual</th>
                <th style={{ ...th, textAlign: "right", width: "27%" }}>Budget</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p, i) => (
                <tr key={p.key} style={{ background: i % 2 ? T.panel : T.bg }}>
                  <td style={{ padding: "6px 12px", fontSize: "13.5px", color: T.ink, fontWeight: 500,
                    borderBottom: `1px solid ${T.lineSoft}`, borderRight: `1px solid ${T.lineSoft}` }}>
                    {p.label}
                    {p.hint && <span style={{ color: T.faint, fontWeight: 400, marginLeft: "7px", fontSize: "11.5px" }}>{p.hint}</span>}
                  </td>
                  <td style={{ padding: "4px 8px", borderBottom: `1px solid ${T.lineSoft}`, borderRight: `1px solid ${T.lineSoft}` }}>
                    <input type="number" step="any" value={value(p.key, "actual")} placeholder="—"
                      onChange={(e) => setValue(p.key, "actual", e.target.value)} style={cell} />
                  </td>
                  <td style={{ padding: "4px 8px", borderBottom: `1px solid ${T.lineSoft}` }}>
                    <input type="number" step="any" value={value(p.key, "budget")} placeholder="—"
                      onChange={(e) => setValue(p.key, "budget", e.target.value)} style={cell} />
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
  const [catId, setCatId] = useState(categoryId);
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
            {structure.map((c) => <option key={c.id} value={c.id}>{c.name}{c.hidden ? " (hidden)" : ""}</option>)}
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
            <option value="%">Percent (%)</option>
            <option value="R">Currency (R)</option>
            <option value="#">Count (#)</option>
            <option value="days">Days</option>
            <option value="hrs">Hours</option>
            <option value="units">Units</option>
            <option value="index">Index</option>
          </select>
        </div>
        {form.units === "%" && (
          <div>
            <label style={labelS}>Captured as</label>
            <select value={form.percentFormat} onChange={(e) => setForm({ ...form, percentFormat: e.target.value })} style={selectS}>
              <option value="whole">Whole numbers (25)</option>
              <option value="fraction">Decimals (0.25)</option>
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
        <label style={{ ...labelS, display: "flex", alignItems: "center", gap: "6px" }}>
          <Sigma size={13} /> How is this KPI measured? *
        </label>
        <textarea rows="4" value={form.measured} onChange={(e) => setForm({ ...form, measured: e.target.value })}
          style={{ ...inputS, resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "13px" }}
          placeholder={"Write it as you'd build it in Excel, e.g.\n\n=COUNTIFS(FirstVisitFix, \"Yes\") / COUNTA(JobID) * 100"} />
        <p style={{ fontSize: "12px", color: T.muted, marginTop: "7px", marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
          <Info size={12} /> Use Excel functions and named ranges — SUM, AVERAGE, COUNTIF, SUMIFS, SUMPRODUCT — so it can be rebuilt in a spreadsheet.
        </p>
      </div>
    </Modal>
  );
};

const AddChooser = ({ onPick, onClose, prefs, fy, structure }) => {
  const cat = prefs ? structure.find((c) => c.id === prefs.catId) : null;
  return (
    <Modal title="What would you like to do?" icon={<Plus size={17} />} onClose={onClose} width={720}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
        {[
          { key: "data", icon: <Database size={22} />, title: "Add Data",
            body: cat ? `Pick up where you left off — ${cat.name}, FY ${fyLabel(prefs.startYear, fy.startMonth)}.`
                      : "Capture actual and budget figures against the KPIs you already track." },
          { key: "kpi", icon: <Sparkles size={22} />, title: "Add KPI",
            body: "Create a new metric under an existing category, or start a category of your own." },
          { key: "categories", icon: <Layers size={22} />, title: "Manage Categories",
            body: "Rename a category, hide it from the tabs, or delete one you no longer track." },
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
  const [showCategories, setShowCategories] = useState(false);

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

  /* ── Category visibility and deletion ─────────────────────────────────── */
  const visibleCategories = useMemo(() => (structure || []).filter((c) => !c.hidden), [structure]);

  const toggleCategoryHidden = (id, forceHide = false) => {
    const next = structure.map((c) => (c.id === id ? { ...c, hidden: forceHide ? true : !c.hidden } : c));
    persist(next);
    const cat = next.find((c) => c.id === id);
    notify("success", `${cat.name} ${cat.hidden ? "hidden" : "shown"}.`);
  };
  const renameCategory = (id, name) => {
    persist(structure.map((c) => (c.id === id ? { ...c, name } : c)));
    notify("success", "Category renamed.");
  };
  const deleteCategory = (id) => {
    const gone = structure.find((c) => c.id === id);
    const next = structure.filter((c) => c.id !== id);
    persist(next.length ? next : buildDefaultStructure(fy.startYear, fy.startMonth));
    notify("success", `${gone?.name || "Category"} deleted.`);
  };

  useEffect(() => {
    if (!structure) return;
    if (!visibleCategories.length) return;
    if (!visibleCategories.some((c) => c.id === activeCategoryId)) setActiveCategoryId(visibleCategories[0].id);
  }, [structure, visibleCategories, activeCategoryId]);

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
    visibleCategories.forEach((cat) => cat.subCategories.forEach((sub) => sub.kpis.forEach((kpi) => {
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

  /* Near-black brown header band, white type, everything top-aligned. */
  const thS = { padding: 0, background: T.header, borderBottom: `2px solid ${T.header}`,
    borderRight: `1px solid ${T.headerLine}`, position: "relative", verticalAlign: "top" };
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
              <li>Figures read against the Units column — no unit is repeated in the number cells</li>
              <li>Click the eye beside a KPI for what it means and how it is measured</li>
              <li>Charts print values to 2 decimals; hover a point for the exact figure</li>
              <li>Categories can be renamed, hidden or deleted under Add KPI/Data</li>
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
          <button onClick={() => setShowCategories(true)} title="Rename, hide or delete a category"
            style={{ ...btnQuiet, marginLeft: "6px", padding: "8px 12px", fontSize: "13px", color: T.muted }}>
            <Layers size={13} /> Categories
            {structure.some((c) => c.hidden) && (
              <span style={{ fontSize: "11px", padding: "1px 7px", borderRadius: "999px", background: T.raised, color: T.muted, fontWeight: 600 }}>
                {structure.filter((c) => c.hidden).length} hidden
              </span>
            )}
          </button>
        )}
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
          Showing {PERIOD_PREFIX[period].toLowerCase()} budget, actual and variance — read against the Units column
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
                  const align = def.align === "right" ? "flex-end" : def.align === "center" ? "center" : "flex-start";
                  const lines = columnLines(key, period);

                  return (
                    <th key={key} style={{ ...thS, width: widths[key] }}>
                      {/* Every header starts at the top of the band — one- and
                          two-line names share the same first baseline. */}
                      <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column",
                        justifyContent: "flex-start", gap: "5px", alignItems: align, minHeight: "66px" }}>
                        <span style={{ display: "flex", alignItems: "flex-start", gap: "5px" }}>
                          <span style={{ display: "inline-flex", flexDirection: "column", alignItems: align, lineHeight: 1.3 }}>
                            {lines.length > 1 && (
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.82)", whiteSpace: "nowrap" }}>{lines[0]}</span>
                            )}
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", whiteSpace: "nowrap" }}>
                              {lines[lines.length - 1]}
                            </span>
                          </span>
                          <span style={{ paddingTop: "1px" }}><InfoTip text={def.tip} light /></span>
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "2px", marginTop: "auto" }}>
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
                  <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column",
                    justifyContent: "flex-start", gap: "5px", alignItems: "center", minHeight: "66px" }}>
                    <span style={{ display: "flex", alignItems: "flex-start", gap: "5px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>Actions</span>
                      <span style={{ paddingTop: "1px" }}><InfoTip light text="Trend chart with averages, note and analysis; a summary analysis; raise an action; KPI notes." /></span>
                    </span>
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
                const cell = (key, content, title) => visibility[key] ? (
                  <td key={key} title={title} style={{ ...rowTd, width: widths[key],
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
                          <button onClick={() => setInfoKpi(kpi)} style={iconBtn(T.muted)} title="What it means and how it is measured"><Eye size={14} /></button>
                          {kpi.notes && <StickyNote size={11} color={T.amber} />}
                        </div>
                      </td>
                    )}
                    {cell("units", <span style={{ color: T.body, fontWeight: 600 }}>{kpi.units}</span>)}
                    {cell("frequency", <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "999px", background: T.raised, color: T.body, fontWeight: 500 }}>{kpi.frequency}</span>)}
                    {/* Numbers carry no unit — the Units column already does. */}
                    {cell("budget", <span style={{ color: T.body, fontVariantNumeric: "tabular-nums" }}>{fmtBare(values.budget, kpi)}</span>, fmtValue(values.budget, kpi))}
                    {cell("actual", <span style={{ fontWeight: 700, color: T.ink, fontVariantNumeric: "tabular-nums" }}>{fmtBare(values.actual, kpi)}</span>, fmtValue(values.actual, kpi))}
                    {cell("variance", variance === null
                      ? <span style={{ color: T.faint }}>—</span>
                      : <span style={{ fontWeight: 700, color: fav ? T.green : T.red, fontVariantNumeric: "tabular-nums" }}>
                          {fmtBare(variance, kpi, { signed: true })}</span>, fmtValue(variance, kpi, { signed: true }))}
                    {cell("status", <span title={status.label} style={{ display: "inline-flex" }}><StatusIcon status={status} size={26} /></span>)}

                    <td style={{ ...rowTd, width: widths[ACTIONS_KEY], textAlign: "center", borderRight: "none" }}>
                      <div style={{ display: "flex", gap: "1px", justifyContent: "center", alignItems: "center" }}>
                        <button onClick={() => setChartKpi(kpi)} style={iconBtn(T.body)} title="Trend chart, averages, note and analysis"><LineChartIcon size={16} /></button>
                        <button onClick={() => setAnalysisKpi(kpi)} style={iconBtn(T.body)} title="Summary analysis across all timeframes"><Lightbulb size={16} /></button>
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
          <span>{activeCategory?.subCategories.length} sub-categories · figures in the units shown per row</span>
          <span style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><CheckCircle2 size={14} color={T.green} /> On budget</span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><AlertTriangle size={14} color={T.amber} /> Needs attention</span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><XCircle size={14} color={T.red} /> Critical</span>
          </span>
        </div>
      </div>

      {infoKpi && <KpiInfoModal kpi={infoKpi} readOnly={isInvestorView} onClose={() => setInfoKpi(null)}
        onSave={(patch) => { updateKpi(infoKpi.id, patch); setInfoKpi({ ...infoKpi, ...patch }); }} />}

      {chartKpi && <TrendChartModal kpi={chartKpi} period={period} fy={fy} readOnly={isInvestorView} onClose={() => setChartKpi(null)}
        onSaveNote={(key, text) => {
          const notes = { ...(chartKpi.periodNotes || {}) };
          if (text.trim()) notes[key] = text.trim(); else delete notes[key];
          updateKpi(chartKpi.id, { periodNotes: notes });
          setChartKpi({ ...chartKpi, periodNotes: notes });
        }}
        onSaveConfig={(cfg) => { updateKpi(chartKpi.id, { chartConfig: cfg }); setChartKpi({ ...chartKpi, chartConfig: cfg }); }} />}

      {analysisKpi && <AnalysisModal kpi={analysisKpi} period={period} fy={fy} onClose={() => setAnalysisKpi(null)} />}

      {actionKpi && <AddActionModal kpi={actionKpi.kpi} period={period} fy={fy}
        categoryName={actionKpi.categoryName} subCategoryName={actionKpi.subCategoryName}
        userId={user?.uid} onClose={() => setActionKpi(null)}
        onSaved={(m) => notify("success", `Action added to "${m}" and Integrated Actions.`)} />}

      {notesKpi && <NotesModal kpi={notesKpi} readOnly={isInvestorView} onClose={() => setNotesKpi(null)}
        onSave={(notes) => updateKpi(notesKpi.id, { notes })} />}

      {showCategories && <ManageCategoriesModal structure={structure} activeCategoryId={activeCategoryId}
        onClose={() => setShowCategories(false)}
        onToggleHidden={toggleCategoryHidden} onRename={renameCategory} onDelete={deleteCategory} />}

      {addFlow === "choose" && <AddChooser onClose={() => setAddFlow(null)}
        onPick={(k) => { if (k === "categories") { setAddFlow(null); setShowCategories(true); } else setAddFlow(k); }}
        prefs={dataPrefs && structure.some((c) => c.id === dataPrefs.catId) ? dataPrefs : null} fy={fy} structure={structure} />}

      {addFlow === "data" && <AddDataWizard structure={structure} fy={fy}
        prefs={dataPrefs && structure.some((c) => c.id === dataPrefs.catId) ? dataPrefs : null}
        onSavePrefs={savePrefs} onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
        onSave={async (next, opts) => { await persist(next); if (!opts?.silent) notify("success", "Data saved."); }} />}

      {addFlow === "kpi" && <AddKpiWizard structure={structure} categoryId={activeCategory?.id}
        onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
        onSave={async (next) => { await persist(next); notify("success", "KPI created."); }} />}
    </div>
  );
};

export default OperationalPerformance;