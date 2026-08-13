"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Line } from "react-chartjs-2";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  FaEye, FaChartLine, FaLightbulb, FaPlus, FaRegStickyNote, FaStickyNote,
  FaTimes, FaSave, FaEdit, FaInfoCircle, FaSort, FaSortUp, FaSortDown,
  FaChevronDown, FaSearch, FaCheckCircle, FaExclamationTriangle, FaTimesCircle,
  FaClipboardList, FaDownload, FaSyncAlt, FaColumns, FaExternalLinkAlt,
  FaRegSquare, FaCheckSquare, FaArrowLeft, FaCalendarAlt, FaUsers, FaSlidersH,
} from "react-icons/fa";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

const functions = getFunctions();

/* ════════════════════════════════════════════════════════════════════════════
   Design tokens.

   White and grey carry the interface; dark brown is kept for the table header,
   primary buttons and the active tab underline only.
   ════════════════════════════════════════════════════════════════════════ */
const T = {
  accent: "#4a352f",
  accentSoft: "#7d5a50",
  accentTint: "#f3efec",
  surface: "#ffffff",
  surfaceAlt: "#f8f9fa",
  border: "#e4e7eb",
  borderStrong: "#ced4da",
  text: "#212529",
  textMuted: "#6c757d",
  textFaint: "#adb5bd",
  green: "#1e7e46", greenBg: "#e8f5ee",
  amber: "#b7791f", amberBg: "#fdf6e3",
  red: "#c0392b", redBg: "#fdecea",
  blue: "#1f6feb",
};

/* Same category vocabulary as the Governance Calendar and Integrated Actions.
   "Overall Company Health" is gone; "General" is the catch-all. */
const RAPS_CATEGORIES = [
  { name: "Strategy & Execution", color: "#2196F3", bg: "#E3F2FD" },
  { name: "Financial Performance", color: "#FF9800", bg: "#FFF3E0" },
  { name: "Operational Performance", color: "#9C27B0", bg: "#F3E5F5" },
  { name: "People", color: "#FF5722", bg: "#FBE9E7" },
  { name: "ESG Impact", color: "#8BC34A", bg: "#F1F8E9" },
  { name: "Marketing & Sales", color: "#E91E63", bg: "#FCE4EC" },
  { name: "General", color: "#607D8B", bg: "#ECEFF1" },
];

const ACTION_STATUSES = ["Not Done", "In Progress", "Done"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* Step 5 — replaces Monthly / Quarterly / Yearly. */
const PERIODS = [
  { key: "week", label: "This week", prefix: "Weekly" },
  { key: "month", label: "This month", prefix: "Monthly" },
  { key: "year", label: "This year", prefix: "Annual" },
];
const periodMeta = (k) => PERIODS.find((p) => p.key === k) || PERIODS[1];

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const to2 = (v) => {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return Number.isNaN(n) ? "" : Number(n.toFixed(2));
};
const parse2 = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : Math.round(n * 100) / 100;
};
const uid = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};
const fmtDMY = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2,"0")}/${String(date.getMonth()+1).padStart(2,"0")}/${date.getFullYear()}`;
};
/* Anything caught is flattened before it can reach state — an Error object
   rendered as a React child is what throws "Objects are not valid as a React
   child". */
const errText = (e) => String(e?.message ?? e ?? "Unknown error");

const aggregate = (values, mode) => {
  const nums = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (nums.length === 0) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return parse2(mode === "avg" ? sum / nums.length : sum);
};

/* ════════════════════════════════════════════════════════════════════════════
   KPI shape.

   Each KPI carries its own definition and calculation (both user-editable),
   a measurement frequency, a direction, per-period targets, the twelve-month
   grid, and two week cells. The timeframe filter reads off these.
   ════════════════════════════════════════════════════════════════════════ */
const seedMonths = (base, swing) => {
  const out = {};
  MONTHS.forEach((m, i) => { out[m] = parse2(base + Math.sin(i * 0.9) * swing + (i / 11) * swing * 0.4); });
  return out;
};

const mkKpi = (name, units, frequency, higherIsBetter, agg, definition, calculation, targets, base, swing) => ({
  id: uid(), name, units, frequency, higherIsBetter, aggregate: agg,
  definition, calculation, notes: "",
  targets: { week: targets[0], month: targets[1], year: targets[2] },
  monthly: seedMonths(base, swing),
  weekly: { previous: parse2(base - swing * 0.3), current: parse2(base) },
});

const buildDefaultStructure = () => [
  {
    id: "supply-chain", name: "Supply Chain", notes: "",
    subCategories: [
      {
        name: "Supplier Dependency",
        kpis: [
          mkKpi("Top 3 Supplier Spend", "%", "Monthly", false, "avg",
            "Share of total procurement spend concentrated in the three largest suppliers.",
            "(Spend with top 3 suppliers ÷ total supplier spend) × 100.",
            [70, 70, 70], 79, 3),
          mkKpi("Single Source Flags", "#", "Monthly", false, "sum",
            "Critical inputs available from only one qualified supplier.",
            "Count of items where qualified supplier count = 1.",
            [0, 0, 0], 1, 1),
          mkKpi("Critical Supplier Count", "#", "Monthly", false, "avg",
            "Suppliers whose failure would halt or materially disrupt delivery.",
            "Count of suppliers tagged critical on the supplier register.",
            [5, 5, 5], 16, 2),
        ],
      },
      {
        name: "Continuity Risk",
        kpis: [
          mkKpi("Lead Time Variance", "days", "Weekly", false, "avg",
            "Spread between promised and actual supplier lead times.",
            "Actual lead time − quoted lead time, averaged across orders received.",
            [2, 2, 2], 2.3, 0.5),
          mkKpi("Stock Cover Days", "days", "Weekly", true, "avg",
            "How many days of demand current stock on hand can serve.",
            "Closing stock ÷ average daily usage.",
            [30, 30, 30], 27, 4),
          mkKpi("Disruption Risk Index", "index", "Monthly", false, "avg",
            "Composite score of supplier, logistics and geographic exposure.",
            "Weighted average of concentration, lead-time and geography sub-scores (0–100).",
            [20, 20, 20], 23, 3),
        ],
      },
    ],
  },
  {
    id: "delivery", name: "Delivery", notes: "",
    subCategories: [
      {
        name: "Productivity",
        kpis: [
          mkKpi("Production Volume", "units", "Weekly", true, "sum",
            "Total sellable output produced in the period.",
            "Sum of good units completed and accepted by QC.",
            [2400, 10000, 120000], 12800, 900),
          mkKpi("Availability %", "%", "Weekly", true, "avg",
            "Share of planned production time equipment was available to run.",
            "(Planned time − unplanned downtime) ÷ planned time × 100.",
            [95, 95, 95], 93, 2),
          mkKpi("Utilization %", "%", "Weekly", true, "avg",
            "Share of available capacity actually used.",
            "Actual run time ÷ available time × 100.",
            [85, 85, 85], 85, 3),
          mkKpi("Unit Cost", "R", "Monthly", false, "avg",
            "Fully loaded cost to produce one sellable unit.",
            "Total production cost ÷ good units produced.",
            [50, 50, 50], 41, 4),
        ],
      },
      {
        name: "Reliability",
        kpis: [
          mkKpi("On-time Delivery %", "%", "Weekly", true, "avg",
            "Orders delivered on or before the promised date.",
            "(On-time deliveries ÷ total deliveries) × 100.",
            [98, 98, 98], 96, 2),
          mkKpi("Rework Rate", "%", "Weekly", false, "avg",
            "Output requiring rework before it can be shipped.",
            "(Units reworked ÷ units produced) × 100.",
            [2, 2, 2], 1.1, 0.4),
          mkKpi("Defect Rate", "%", "Weekly", false, "avg",
            "Output rejected at final inspection or returned by customers.",
            "(Defective units ÷ units produced) × 100.",
            [1, 1, 1], 0.1, 0.08),
        ],
      },
    ],
  },
  {
    id: "safety", name: "Safety", notes: "",
    subCategories: [
      {
        name: "Safety Risk",
        kpis: [
          mkKpi("Safety Incidents", "#", "Weekly", false, "sum",
            "Recordable safety incidents involving staff, contractors or visitors.",
            "Count of incidents logged on the incident register.",
            [0, 0, 0], 0.3, 0.4),
          mkKpi("Open Safety Actions", "#", "Weekly", false, "avg",
            "Corrective actions from incidents or inspections still outstanding.",
            "Count of safety actions with status not equal to closed.",
            [5, 5, 5], 1, 1),
          mkKpi("Compliance Status %", "%", "Monthly", true, "avg",
            "Share of mandatory safety requirements currently met.",
            "(Requirements met ÷ total applicable requirements) × 100.",
            [100, 100, 100], 99, 1),
        ],
      },
      {
        name: "Regulatory Compliance",
        kpis: [
          mkKpi("Regulatory Gaps", "#", "Monthly", false, "sum",
            "Known areas of non-compliance with applicable regulation.",
            "Count of open gaps on the compliance register.",
            [0, 0, 0], 0.2, 0.3),
          mkKpi("Audit Findings", "#", "Monthly", false, "sum",
            "Findings raised at the most recent internal or external audit.",
            "Count of findings not yet formally closed out.",
            [3, 3, 3], 0.4, 0.5),
          mkKpi("Certification Status %", "%", "Monthly", true, "avg",
            "Share of required certifications that are current and valid.",
            "(Valid certifications ÷ required certifications) × 100.",
            [100, 100, 100], 99, 1),
        ],
      },
    ],
  },
];

/* ─── Period resolution ──────────────────────────────────────────────────── */
const periodValues = (kpi, period) => {
  const mi = new Date().getMonth();
  if (period === "week") {
    return {
      target: kpi.targets?.week ?? null,
      actual: kpi.weekly?.previous ?? null,
      current: kpi.weekly?.current ?? null,
    };
  }
  if (period === "month") {
    return {
      target: kpi.targets?.month ?? null,
      actual: mi > 0 ? kpi.monthly?.[MONTHS[mi - 1]] ?? null : null,
      current: kpi.monthly?.[MONTHS[mi]] ?? null,
    };
  }
  const toDate = MONTHS.slice(0, mi + 1).map((m) => kpi.monthly?.[m]);
  const completed = MONTHS.slice(0, mi).map((m) => kpi.monthly?.[m]);
  return {
    target: kpi.targets?.year ?? null,
    actual: aggregate(completed, kpi.aggregate),
    current: aggregate(toDate, kpi.aggregate),
  };
};

/* ─── Status: green / yellow / red as icons ─────────────────────────────── */
const S_GREEN = { key: "green", label: "On target", color: T.green, bg: T.greenBg };
const S_AMBER = { key: "amber", label: "Needs attention", color: T.amber, bg: T.amberBg };
const S_RED = { key: "red", label: "Critical", color: T.red, bg: T.redBg };
const S_NONE = { key: "none", label: "No data", color: T.textFaint, bg: T.surfaceAlt };

const getStatus = (kpi, period) => {
  const { target, current } = periodValues(kpi, period);
  const t = Number(target), c = Number(current);
  if (!Number.isFinite(t) || !Number.isFinite(c)) return S_NONE;
  if (t === 0) {
    // A zero target only makes sense where lower is better — incidents, gaps.
    if (kpi.higherIsBetter) return S_NONE;
    if (c <= 0) return S_GREEN;
    if (c <= 1) return S_AMBER;
    return S_RED;
  }
  const ratio = kpi.higherIsBetter ? c / t : t / (c || 0.0001);
  if (ratio >= 0.98) return S_GREEN;
  if (ratio >= 0.85) return S_AMBER;
  return S_RED;
};

const StatusIcon = ({ status, size = 17 }) => {
  if (status.key === "green") return <FaCheckCircle size={size} color={status.color} title={status.label} />;
  if (status.key === "amber") return <FaExclamationTriangle size={size} color={status.color} title={status.label} />;
  if (status.key === "red") return <FaTimesCircle size={size} color={status.color} title={status.label} />;
  return <FaInfoCircle size={size} color={status.color} title={status.label} />;
};

const getVariance = (kpi, period) => {
  const { target, current } = periodValues(kpi, period);
  const t = Number(target), c = Number(current);
  if (!Number.isFinite(t) || !Number.isFinite(c)) return null;
  return parse2(c - t);
};

/* ─── Columns ───────────────────────────────────────────────────────────── */
const COLUMN_DEFS = {
  category:  { label: "Category", width: 155, tooltip: "The sub-category this KPI sits under within the selected tab.", filter: true, sortable: true, hideable: true },
  kpi:       { label: "KPI", width: 235, tooltip: "The metric being tracked. Click the eye to read or edit its definition and how it is calculated.", filter: true, sortable: true, hideable: false },
  units:     { label: "Units", width: 72, align: "center", tooltip: "The unit the value is expressed in — percent, rand, days or a count.", filter: true, sortable: true, hideable: true },
  frequency: { label: "Measurement Frequency", width: 112, align: "center", tooltip: "How often this KPI is captured — weekly or monthly.", filter: true, sortable: true, hideable: true },
  target:    { label: "Target", width: 96, align: "center", tooltip: "What you are aiming for in the selected timeframe.", sortable: true, hideable: true },
  actual:    { label: "Actual", width: 96, align: "center", tooltip: "The value recorded for the last completed period.", sortable: true, hideable: true },
  current:   { label: "Current", width: 96, align: "center", tooltip: "The value for the period currently in progress.", sortable: true, hideable: true },
  variance:  { label: "Variance", width: 96, align: "center", tooltip: "Current minus Target, in the KPI's own units. Green means favourable.", sortable: true, hideable: true },
  status:    { label: "Status", width: 82, align: "center", tooltip: "Green: on target. Yellow: needs attention. Red: critical — well outside target.", filter: true, sortable: true, hideable: true },
};
const COLUMN_ORDER = Object.keys(COLUMN_DEFS);
const ACTIONS_KEY = "__actions__";
const MIN_COL_W = 70;

/* ─── Header info (i) — portaled so it can't be clipped or overlapped ───── */
const InfoTip = ({ text }) => {
  const [rect, setRect] = useState(null);
  if (!text) return null;
  return (
    <span style={{ display: "inline-flex" }}
      onMouseEnter={(e) => setRect(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setRect(null)}>
      <FaInfoCircle size={11} style={{ cursor: "help", opacity: 0.85 }} />
      {rect && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed", top: rect.bottom + 8,
          left: Math.min(Math.max(rect.left - 105, 12), window.innerWidth - 244),
          width: "230px", backgroundColor: "#2b2b2b", color: "#fff",
          fontSize: "11.5px", padding: "10px 12px", borderRadius: "6px",
          lineHeight: 1.5, zIndex: 2000, pointerEvents: "none",
          textTransform: "none", letterSpacing: "normal", fontWeight: 400,
          boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
        }}>{text}</div>, document.body)}
    </span>
  );
};

/* ─── Modal shell ───────────────────────────────────────────────────────── */
const Modal = ({ title, icon, onClose, children, width = 620, footer }) => (
  <div onClick={onClose} style={{
    position: "fixed", inset: 0, backgroundColor: "rgba(33,37,41,0.55)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1200, padding: "20px",
  }}>
    <div onClick={(e) => e.stopPropagation()} style={{
      backgroundColor: T.surface, borderRadius: "10px", width: "100%",
      maxWidth: `${width}px`, maxHeight: "92vh", display: "flex", flexDirection: "column",
      boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: `1px solid ${T.border}` }}>
        <h3 style={{ margin: 0, fontSize: "17px", color: T.text, fontWeight: 600, display: "flex", alignItems: "center", gap: "9px" }}>
          {icon} {title}
        </h3>
        <button onClick={onClose} style={{ background: T.surfaceAlt, border: "none", cursor: "pointer", color: T.textMuted, width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FaTimes size={14} />
        </button>
      </div>
      <div style={{ padding: "22px 24px", overflowY: "auto", flex: 1 }}>{children}</div>
      {footer && (
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: "10px", alignItems: "center" }}>
          {footer}
        </div>
      )}
    </div>
  </div>
);

const btnPrimary = { padding: "9px 18px", backgroundColor: T.accent, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "8px" };
const btnGhost = { padding: "9px 18px", backgroundColor: T.surface, color: T.text, border: `1px solid ${T.borderStrong}`, borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "8px" };
const fieldInput = { width: "100%", padding: "10px 12px", border: `1px solid ${T.borderStrong}`, borderRadius: "6px", fontSize: "13.5px", fontFamily: "inherit", boxSizing: "border-box", color: T.text, backgroundColor: T.surface };
const fieldLabel = { display: "block", fontSize: "12px", fontWeight: 600, color: T.textMuted, marginBottom: "6px" };

/* ════════════════════════════════════════════════════════════════════════════
   Step 3 — KPI definition popup, opened by the eye icon. Definition and
   calculation are both editable.
   ════════════════════════════════════════════════════════════════════════ */
const KpiInfoModal = ({ kpi, onClose, onSave, readOnly }) => {
  const [editing, setEditing] = useState(false);
  const [definition, setDefinition] = useState(kpi.definition || "");
  const [calculation, setCalculation] = useState(kpi.calculation || "");

  const box = (v, empty) => (
    <div style={{ backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: "6px", padding: "13px 15px", fontSize: "13.5px", lineHeight: 1.6, color: v ? T.text : T.textFaint, fontStyle: v ? "normal" : "italic" }}>
      {v || empty}
    </div>
  );

  return (
    <Modal title={kpi.name} icon={<FaEye size={14} color={T.accentSoft} />} onClose={onClose}
      footer={editing ? (
        <>
          <button onClick={() => { setDefinition(kpi.definition || ""); setCalculation(kpi.calculation || ""); setEditing(false); }} style={btnGhost}>Cancel</button>
          <button onClick={() => { onSave({ definition, calculation }); setEditing(false); }} style={btnPrimary}><FaSave size={12} /> Save</button>
        </>
      ) : (
        <>
          {!readOnly && <button onClick={() => setEditing(true)} style={btnGhost}><FaEdit size={12} /> Edit</button>}
          <button onClick={onClose} style={btnPrimary}>Close</button>
        </>
      )}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {[`Units: ${kpi.units}`, `Measured: ${kpi.frequency}`,
          kpi.higherIsBetter ? "Higher is better" : "Lower is better",
          kpi.aggregate === "avg" ? "Averaged over the year" : "Summed over the year"].map((c) => (
          <span key={c} style={{ fontSize: "11.5px", padding: "4px 11px", borderRadius: "12px", backgroundColor: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>{c}</span>
        ))}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={fieldLabel}>Definition — what this KPI measures</label>
        {editing ? <textarea rows="3" value={definition} onChange={(e) => setDefinition(e.target.value)} style={{ ...fieldInput, resize: "vertical" }} />
          : box(definition, "No definition captured yet.")}
      </div>
      <div>
        <label style={fieldLabel}>Calculation — how it is worked out</label>
        {editing ? <textarea rows="3" value={calculation} onChange={(e) => setCalculation(e.target.value)} style={{ ...fieldInput, resize: "vertical" }} />
          : box(calculation, "No calculation captured yet.")}
      </div>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Step 4.1 — Trend chart. Target, Current and Variance on one graph, each with
   its own colour and line style so they read apart in print too. Labels carry
   the year.
   ════════════════════════════════════════════════════════════════════════ */
const YEAR = new Date().getFullYear();
const yr2 = String(YEAR).slice(2);

const buildSeries = (kpi, period) => {
  const mi = new Date().getMonth();

  if (period === "week") {
    const target = kpi.targets?.week ?? null;
    const current = [kpi.weekly?.previous ?? null, kpi.weekly?.current ?? null];
    return {
      labels: [`Prev week ${YEAR}`, `This week ${YEAR}`],
      target: [target, target],
      current,
      variance: current.map((c) => (c === null || target === null ? null : parse2(c - target))),
      thin: true,
    };
  }

  if (period === "month") {
    const target = kpi.targets?.month ?? null;
    const current = MONTHS.map((m) => kpi.monthly?.[m] ?? null);
    return {
      labels: MONTHS.map((m) => `${m} ${yr2}`),
      target: MONTHS.map(() => target),
      current,
      variance: current.map((c) => (c === null || target === null ? null : parse2(c - target))),
      thin: false,
    };
  }

  // Year: months to date, aggregated cumulatively, against the annual target.
  const target = kpi.targets?.year ?? null;
  const running = MONTHS.map((_, i) =>
    i > mi ? null : aggregate(MONTHS.slice(0, i + 1).map((mm) => kpi.monthly?.[mm]), kpi.aggregate));
  return {
    labels: MONTHS.map((m) => `${m} ${yr2}`),
    target: MONTHS.map(() => target),
    current: running,
    variance: running.map((c) => (c === null || target === null ? null : parse2(c - target))),
    thin: false,
  };
};

const TrendChartModal = ({ kpi, period, onClose }) => {
  const s = buildSeries(kpi, period);
  const prefix = periodMeta(period).prefix;

  const data = {
    labels: s.labels,
    datasets: [
      { label: `${prefix} Target`, data: s.target, borderColor: T.textMuted, backgroundColor: "transparent",
        borderWidth: 2, borderDash: [8, 4], pointRadius: 0, tension: 0, spanGaps: true },
      { label: "Current", data: s.current, borderColor: T.blue, backgroundColor: "rgba(31,111,235,0.08)",
        borderWidth: 3, fill: true, pointRadius: 4, pointBackgroundColor: T.blue, tension: 0.32, spanGaps: true },
      { label: "Variance", data: s.variance, borderColor: T.amber, backgroundColor: "transparent",
        borderWidth: 2, borderDash: [2, 3], pointRadius: 3, pointStyle: "rectRot",
        pointBackgroundColor: T.amber, tension: 0.32, spanGaps: true },
    ],
  };

  const options = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      datalabels: { display: false },
      legend: { position: "top", labels: { color: T.text, font: { size: 12 }, padding: 18, usePointStyle: true } },
      tooltip: {
        backgroundColor: "rgba(33,37,41,0.94)", padding: 12,
        callbacks: {
          label: (ctx) => {
            if (ctx.parsed.y === null) return `${ctx.dataset.label}: no data`;
            const v = to2(ctx.parsed.y);
            if (kpi.units === "%") return `${ctx.dataset.label}: ${v}%`;
            if (kpi.units === "R") return `${ctx.dataset.label}: R${v}`;
            return `${ctx.dataset.label}: ${v} ${kpi.units}`;
          },
        },
      },
    },
    scales: {
      y: { grid: { color: "rgba(0,0,0,0.06)" }, ticks: { color: T.textMuted, font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { color: T.textMuted, font: { size: 11 } } },
    },
  };

  return (
    <Modal title={`${kpi.name} — Trend (${YEAR})`} icon={<FaChartLine size={14} color={T.accentSoft} />}
      onClose={onClose} width={900} footer={<button onClick={onClose} style={btnPrimary}>Close</button>}>
      <div style={{ backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: "8px", padding: "18px", height: "340px" }}>
        <Line data={data} options={options} />
      </div>
      {s.thin && (
        <p style={{ fontSize: "12px", color: T.textMuted, marginTop: "12px", display: "flex", alignItems: "center", gap: "7px" }}>
          <FaInfoCircle size={11} /> The weekly view holds two points. Switch to This month or This year for a longer series.
        </p>
      )}
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Step 4.2 — Observations and Opportunities (was "AI Performance Analysis";
   "Recommendations" is now "Opportunities").

   It calls a Firebase callable first and falls back to a rules-based summary
   built from your own figures. The fallback says so rather than passing
   itself off as model output.
   ════════════════════════════════════════════════════════════════════════ */
const localAnalysis = (kpi, period, v) => {
  const status = getStatus(kpi, period);
  const variance = getVariance(kpi, period);
  const prefix = periodMeta(period).prefix;
  const favourable = variance === null ? null : kpi.higherIsBetter ? variance >= 0 : variance <= 0;
  const moved =
    Number.isFinite(Number(v.current)) && Number.isFinite(Number(v.actual))
      ? Math.abs(Number(v.current) - Number(v.actual)) < 0.005 ? "flat"
        : Number(v.current) > Number(v.actual) ? "up" : "down"
      : "unclear";

  return {
    observations: [
      `${prefix} current sits at ${to2(v.current)} ${kpi.units} against a target of ${to2(v.target)} ${kpi.units}.`,
      variance === null
        ? "Variance cannot be computed — either the target or the current value is missing."
        : `That is a ${favourable ? "favourable" : "unfavourable"} variance of ${to2(Math.abs(variance))} ${kpi.units}.`,
      `The last completed period closed at ${to2(v.actual)} ${kpi.units}, so the metric is ${moved} period on period.`,
      `Captured ${kpi.frequency.toLowerCase()}; ${kpi.higherIsBetter ? "higher" : "lower"} readings are better.`,
    ],
    trends: status.key === "green"
      ? ["Performance is holding inside tolerance, which points to a stable underlying process.",
         "Watch the month-to-month spread rather than the headline — a stable average can hide widening swings."]
      : status.key === "amber"
        ? ["The metric has drifted outside tolerance but not far. This reads as drift rather than a break.",
           "Two or three more periods at this level would move it into critical territory."]
        : ["The gap to target is wide enough that a single-period correction is unlikely to close it.",
           "Treat the trend as broken rather than noisy until two consecutive periods recover."],
    issues: status.key === "green"
      ? ["No material issue at this timeframe. The risk is erosion if input costs or volumes shift."]
      : [`Target is not being met at the ${prefix.toLowerCase()} level${variance === null ? "" : ` — off by ${to2(Math.abs(variance))} ${kpi.units}`}.`,
         status.key === "red"
           ? "Severity warrants a named owner and a dated action, not continued monitoring."
           : "Unattended, this is the kind of gap that compounds quietly across periods."],
    opportunities: status.key === "green"
      ? ["Consider tightening the target — the current one may no longer be stretching.",
         "Document what is working here and apply it to the weaker KPIs in this category."]
      : ["Raise an action against this KPI so it carries into the next governance meeting.",
         kpi.higherIsBetter
           ? "Find the single largest constraint on output and remove it before adding capacity."
           : "Trace the top contributors driving this number up and address the largest one first.",
         "Shorten the measurement interval temporarily so corrective effort shows up sooner."],
  };
};

const AnalysisModal = ({ kpi, period, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [source, setSource] = useState("ai");

  const build = useCallback(() => {
    setLoading(true);
    const v = periodValues(kpi, period);
    const status = getStatus(kpi, period);
    const variance = getVariance(kpi, period);

    const run = async () => {
      try {
        const callable = httpsCallable(functions, "generateKpiAnalysis");
        const res = await callable({
          kpiName: kpi.name, definition: kpi.definition, calculation: kpi.calculation,
          units: kpi.units, frequency: kpi.frequency, higherIsBetter: kpi.higherIsBetter,
          timeframe: periodMeta(period).label,
          target: v.target, actual: v.actual, current: v.current, variance,
          status: status.label, notes: kpi.notes || "", history: kpi.monthly || {},
        });
        const d = res?.data;
        if (d?.observations && d?.opportunities) {
          setAnalysis({
            observations: d.observations || [], trends: d.trends || [],
            issues: d.issues || [], opportunities: d.opportunities || [],
          });
          setSource("ai");
          return;
        }
        throw new Error("Unexpected response shape");
      } catch (err) {
        console.error("AI analysis unavailable:", errText(err));
        setSource("local");
        setAnalysis(localAnalysis(kpi, period, v));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [kpi, period]);

  useEffect(() => { build(); }, [build]);

  const Section = ({ label, items, color }) => (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color, marginBottom: "8px" }}>{label}</div>
      <ul style={{ margin: 0, paddingLeft: "19px", color: T.text, fontSize: "13.5px", lineHeight: 1.7 }}>
        {items.map((it, i) => <li key={i} style={{ marginBottom: "4px" }}>{it}</li>)}
      </ul>
    </div>
  );

  return (
    <Modal title="Observations and Opportunities" icon={<FaLightbulb size={14} color={T.accentSoft} />}
      onClose={onClose} width={680}
      footer={<>
        <button onClick={build} disabled={loading} style={{ ...btnGhost, opacity: loading ? 0.6 : 1 }}><FaSyncAlt size={11} /> Regenerate</button>
        <button onClick={onClose} style={btnPrimary}>Close</button>
      </>}>
      <div style={{ fontSize: "12.5px", color: T.textMuted, marginBottom: "6px" }}>
        {kpi.name} · {periodMeta(period).label}
      </div>
      {!loading && (
        <div style={{ fontSize: "11.5px", color: source === "ai" ? T.textMuted : T.amber, marginBottom: "18px", display: "flex", alignItems: "center", gap: "6px" }}>
          <FaInfoCircle size={10} />
          {source === "ai" ? "Generated from your KPI data" : "AI unavailable — showing a rules-based summary built from your figures"}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "44px 0", color: T.textMuted, fontSize: "13.5px" }}>
          <FaSyncAlt size={24} color={T.borderStrong} />
          <div style={{ marginTop: "14px" }}>Reviewing {kpi.name}...</div>
        </div>
      ) : analysis && (
        <>
          <Section label="Observations" items={analysis.observations} color={T.text} />
          <Section label="Trends" items={analysis.trends} color={T.blue} />
          <Section label="Issues" items={analysis.issues} color={T.red} />
          <Section label="Opportunities" items={analysis.opportunities} color={T.green} />
        </>
      )}
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Step 4.3 — Add Action, offered only when the KPI is yellow or red.

   Writes into governanceCalendar/{uid}.meetings[].actions[] — the same array
   Integrated Actions reads and the Meeting Actions tab edits, so an action
   raised here needs no syncing to appear on /raps-actions.
   ════════════════════════════════════════════════════════════════════════ */
const AddActionModal = ({ kpi, period, categoryName, subCategoryName, userId, onClose, onSaved }) => {
  const [meetings, setMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [meetingId, setMeetingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const status = getStatus(kpi, period);
  const variance = getVariance(kpi, period);
  const v = periodValues(kpi, period);

  const [form, setForm] = useState({
    title: `Close the gap on ${kpi.name}`,
    description: `${periodMeta(period).prefix} current ${to2(v.current)} ${kpi.units} against target ${to2(v.target)} ${kpi.units}${
      variance === null ? "" : ` (variance ${to2(variance)} ${kpi.units})`}. Raised from ${categoryName} · ${subCategoryName}.`,
    category: "Operational Performance",
    assignedTo: "", dueDate: "", status: "In Progress",
  });

  const meetingDate = (m) => {
    const dates = (m.instances || []).map((i) => new Date(i.date)).filter((d) => !Number.isNaN(d.getTime())).sort((a, b) => a - b);
    if (dates.length === 0) return null;
    const now = new Date();
    return (dates.find((d) => d >= now) || dates[dates.length - 1]).toISOString();
  };

  const selectedMeeting = meetings.find((m) => m.id === meetingId) || null;

  /* Picking a meeting pulls across what it already knows — category, date,
     participants. All stay editable. */
  const applyDefaults = (id, prev, force = false) => {
    const meeting = meetings.find((m) => m.id === id);
    if (!meeting) return prev;
    const cat = meeting.category || meeting.department || "Operational Performance";
    const d = meetingDate(meeting);
    const dateInput = d ? new Date(d).toISOString().split("T")[0] : "";
    const names = (meeting.participants || []).map((p) => (typeof p === "string" ? p : p.name || p.email || ""));
    return {
      ...prev,
      category: force || !prev.dueDate ? cat : prev.category,
      dueDate: force || !prev.dueDate ? dateInput : prev.dueDate,
      assignedTo: names.includes(prev.assignedTo) ? prev.assignedTo : "",
    };
  };

  useEffect(() => {
    const load = async () => {
      if (!userId) { setLoadingMeetings(false); return; }
      try {
        const snap = await getDoc(doc(db, "governanceCalendar", userId));
        const list = snap.exists() ? snap.data().meetings || [] : [];
        setMeetings(list);
        const dated = list.map((m) => ({ m, d: meetingDate(m) })).filter((x) => x.d);
        const now = new Date();
        const upcoming = dated.filter((x) => new Date(x.d) >= now).sort((a, b) => new Date(a.d) - new Date(b.d))[0];
        const latest = dated.sort((a, b) => new Date(b.d) - new Date(a.d))[0];
        setMeetingId(upcoming?.m.id || latest?.m.id || list[0]?.id || "");
      } catch (err) {
        console.error("Failed to load meetings:", err);
        setMessage(`Could not load your meetings: ${errText(err)}`);
      } finally {
        setLoadingMeetings(false);
      }
    };
    load();
  }, [userId]);

  useEffect(() => {
    if (meetingId) setForm((prev) => applyDefaults(meetingId, prev, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, meetings.length]);

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      const snap = await getDoc(doc(db, "governanceCalendar", userId));
      let list = snap.exists() ? snap.data().meetings || [] : [];

      const newAction = {
        id: uid(), title: form.title.trim(), description: form.description.trim(),
        category: form.category, assignedTo: form.assignedTo.trim(),
        dueDate: form.dueDate, status: form.status, archived: false,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), revisedDate: null,
        // Provenance, so it can be traced back from Integrated Actions.
        sourceModule: "Operational Performance", sourceKpi: kpi.name,
        sourceCategory: `${categoryName} · ${subCategoryName}`,
      };

      let targetId = meetingId;

      if (!targetId) {
        // No meetings yet — create a holder shaped the way the other two pages
        // expect, rather than refusing the action.
        const meta = RAPS_CATEGORIES.find((c) => c.name === "Operational Performance");
        const holder = {
          id: uid(), title: "Operational Performance Actions",
          category: "Operational Performance", department: "Operational Performance",
          categoryColor: meta.color, categoryBg: meta.bg,
          departmentColor: meta.color, departmentBg: meta.bg,
          departments: [], purpose: "Actions raised from the Operational Performance Summary.",
          agenda: "", preparations: "", participants: [],
          isRecurring: false, recurrencePattern: null,
          instances: [{ instanceId: uid(), date: new Date().toISOString(), time: "09:00", status: "scheduled" }],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          highlights: "", lowlights: "", risks: "", headsUp: "", actions: [],
        };
        list = [...list, holder];
        targetId = holder.id;
      }

      const updated = list.map((m) =>
        m.id === targetId
          ? { ...m, actions: [...(m.actions || []), { ...newAction, meetingId: m.id }], updatedAt: new Date().toISOString() }
          : m);

      await setDoc(doc(db, "governanceCalendar", userId),
        { meetings: updated, updatedAt: new Date().toISOString(), userId }, { merge: true });

      onSaved(updated.find((m) => m.id === targetId)?.title || "your calendar");
      onClose();
    } catch (err) {
      console.error("Failed to save action:", err);
      setMessage(`Could not save the action: ${errText(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Action" icon={<FaPlus size={13} color={T.accentSoft} />} onClose={onClose} width={620}
      footer={<>
        <button onClick={onClose} style={btnGhost}>Cancel</button>
        <button onClick={save} disabled={saving || !form.title.trim()} style={{ ...btnPrimary, opacity: saving || !form.title.trim() ? 0.6 : 1 }}>
          {saving ? "Saving..." : "Save Action"}
        </button>
      </>}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 15px", borderRadius: "8px", backgroundColor: status.bg, borderLeft: `4px solid ${status.color}`, marginBottom: "20px" }}>
        <StatusIcon status={status} size={19} />
        <div style={{ fontSize: "13.5px", color: T.text }}>
          <strong>{kpi.name}</strong> is {status.label.toLowerCase()} for {periodMeta(period).label.toLowerCase()}.
          What action are you going to take?
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={fieldLabel}>Action *</label>
        <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={fieldInput} placeholder="What needs to be done?" />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={fieldLabel}>Description</label>
        <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...fieldInput, resize: "vertical" }} />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={fieldLabel}>Attach to meeting</label>
        {loadingMeetings ? (
          <div style={{ fontSize: "13px", color: T.textMuted }}>Loading meetings...</div>
        ) : meetings.length === 0 ? (
          <div style={{ fontSize: "12.5px", color: T.textMuted, backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: "6px", padding: "11px 13px" }}>
            No governance meetings yet — this will be filed under "Operational Performance Actions" and still appears in Integrated Actions.
          </div>
        ) : (
          <>
            <select value={meetingId}
              onChange={(e) => { setMeetingId(e.target.value); setForm((p) => applyDefaults(e.target.value, p)); }}
              style={{ ...fieldInput, cursor: "pointer" }}>
              {meetings.map((m) => {
                const d = meetingDate(m);
                return <option key={m.id} value={m.id}>{m.title} ({m.category || "Uncategorized"}){d ? ` — ${fmtDMY(d)}` : ""}</option>;
              })}
            </select>
            {selectedMeeting && (
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "11.5px", color: T.textMuted, marginTop: "8px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FaCalendarAlt size={10} /> {meetingDate(selectedMeeting) ? fmtDMY(meetingDate(selectedMeeting)) : "No date"}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FaUsers size={10} /> {(selectedMeeting.participants || []).length} participants</span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FaInfoCircle size={10} /> Category and due date pre-filled from this meeting</span>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={fieldLabel}>Category</label>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ ...fieldInput, cursor: "pointer" }}>
          {RAPS_CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          {form.category && !RAPS_CATEGORIES.some((c) => c.name === form.category) && (
            <option value={form.category}>{form.category}</option>
          )}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
        <div>
          <label style={fieldLabel}>By whom</label>
          {(selectedMeeting?.participants || []).length > 0 ? (
            <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} style={{ ...fieldInput, cursor: "pointer" }}>
              <option value="">Unassigned</option>
              {selectedMeeting.participants.map((p, i) => {
                const name = typeof p === "string" ? p : p.name || p.email || "Participant";
                return <option key={i} value={name}>{name}</option>;
              })}
            </select>
          ) : (
            <input type="text" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} style={fieldInput} placeholder="Owner" />
          )}
        </div>
        <div>
          <label style={fieldLabel}>By when</label>
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={fieldInput} />
        </div>
        <div>
          <label style={fieldLabel}>Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ ...fieldInput, cursor: "pointer" }}>
            {ACTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {message && <div style={{ color: T.red, fontSize: "12.5px", marginTop: "14px" }}>{message}</div>}

      <p style={{ fontSize: "11.5px", color: T.textMuted, marginTop: "18px", marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
        <FaInfoCircle size={10} /> Saved actions appear in Integrated Actions and in the meeting's Meeting Actions tab.
      </p>
    </Modal>
  );
};

/* ─── Step 4.4 — Notes ──────────────────────────────────────────────────── */
const NotesModal = ({ kpi, onClose, onSave, readOnly }) => {
  const [notes, setNotes] = useState(kpi.notes || "");
  return (
    <Modal title={`Notes — ${kpi.name}`} icon={<FaRegStickyNote size={13} color={T.accentSoft} />} onClose={onClose}
      footer={readOnly ? <button onClick={onClose} style={btnPrimary}>Close</button> : (
        <>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={() => { onSave(notes); onClose(); }} style={btnPrimary}><FaSave size={12} /> Save Notes</button>
        </>
      )}>
      <label style={fieldLabel}>Context, anomalies or anything worth remembering about this KPI</label>
      <textarea rows="9" value={notes} readOnly={readOnly} onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g. Two suppliers were on shutdown for the first half of the period, which explains the dip."
        style={{ ...fieldInput, resize: "vertical" }} />
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Step 6 — Add Data/KPI. Twelve months spread horizontally with the year on
   every header, plus the per-timeframe targets and the two week cells in
   front, so the dashboard filter has real numbers behind it.
   ════════════════════════════════════════════════════════════════════════ */
const AddDataKpiModal = ({ structure, initialCategoryId, onClose, onSave }) => {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(structure)));
  const [activeCategory, setActiveCategory] = useState(initialCategoryId);
  const [selectedYear, setSelectedYear] = useState(YEAR);
  const [showAddKPIForm, setShowAddKPIForm] = useState(false);
  const [editingKPI, setEditingKPI] = useState(null);
  const [editKPIValue, setEditKPIValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [newKPI, setNewKPI] = useState({
    name: "", units: "%", subCategory: "", frequency: "Monthly",
    higherIsBetter: "true", aggregate: "avg",
    weekTarget: "", monthTarget: "", yearTarget: "", definition: "", calculation: "",
  });

  const current = draft.find((c) => c.id === activeCategory) || draft[0];
  const years = Array.from({ length: 5 }, (_, i) => YEAR - 2 + i);

  useEffect(() => {
    setNewKPI((p) => ({ ...p, subCategory: current?.subCategories[0]?.name || "" }));
  }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const patchKpi = (subName, kpiId, patch) =>
    setDraft((prev) => prev.map((cat) => cat.id !== current.id ? cat : {
      ...cat,
      subCategories: cat.subCategories.map((sub) => sub.name !== subName ? sub : {
        ...sub, kpis: sub.kpis.map((k) => (k.id === kpiId ? { ...k, ...patch } : k)),
      }),
    }));

  const setMonth = (subName, kpi, month, raw) =>
    patchKpi(subName, kpi.id, { monthly: { ...kpi.monthly, [month]: raw === "" ? null : parse2(raw) } });
  const setTarget = (subName, kpi, key, raw) =>
    patchKpi(subName, kpi.id, { targets: { ...kpi.targets, [key]: raw === "" ? null : parse2(raw) } });
  const setWeek = (subName, kpi, key, raw) =>
    patchKpi(subName, kpi.id, { weekly: { ...kpi.weekly, [key]: raw === "" ? null : parse2(raw) } });

  const saveKpiName = () => {
    if (!editingKPI) return;
    patchKpi(editingKPI.subName, editingKPI.kpiId, { name: editKPIValue.trim() || editingKPI.original });
    setEditingKPI(null); setEditKPIValue("");
  };

  const addKPI = () => {
    if (!newKPI.name.trim() || !newKPI.subCategory) return;
    const created = mkKpi(
      newKPI.name.trim(), newKPI.units || "#", newKPI.frequency,
      newKPI.higherIsBetter === "true", newKPI.aggregate,
      newKPI.definition.trim(), newKPI.calculation.trim(),
      [parse2(newKPI.weekTarget), parse2(newKPI.monthTarget), parse2(newKPI.yearTarget)], 0, 0
    );
    // A brand-new KPI starts empty rather than seeded with invented numbers.
    MONTHS.forEach((m) => { created.monthly[m] = null; });
    created.weekly = { previous: null, current: null };

    setDraft((prev) => prev.map((cat) => cat.id !== current.id ? cat : {
      ...cat,
      subCategories: cat.subCategories.map((sub) =>
        sub.name === newKPI.subCategory ? { ...sub, kpis: [...sub.kpis, created] } : sub),
    }));
    setNewKPI({ ...newKPI, name: "", definition: "", calculation: "", weekTarget: "", monthTarget: "", yearTarget: "" });
    setShowAddKPIForm(false);
  };

  const cellInput = {
    width: "100%", padding: "9px 8px", borderRadius: "5px", border: `1px solid ${T.borderStrong}`,
    fontSize: "13.5px", color: T.text, textAlign: "center", backgroundColor: T.surface,
    fontFamily: "inherit", boxSizing: "border-box", minHeight: "38px",
  };
  const headCell = (bg) => ({
    padding: "10px 8px", textAlign: "center", color: T.text, fontWeight: 600,
    borderBottom: `2px solid ${T.borderStrong}`, backgroundColor: bg, fontSize: "12px", whiteSpace: "nowrap",
  });

  return (
    <Modal title="Add Data/KPI" icon={<FaPlus size={14} color={T.accentSoft} />} onClose={onClose} width={1560}
      footer={<>
        <div style={{ flex: 1, fontSize: "12.5px", color: T.textMuted, textAlign: "left" }}>
          All values are rounded to 2 decimal places when saved. Enter every month at once.
        </div>
        <button onClick={onClose} style={btnGhost}>Cancel</button>
        <button onClick={async () => { setSaving(true); await onSave(draft); setSaving(false); onClose(); }}
          disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : "Save All Data"}
        </button>
      </>}>
      {/* Category tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", paddingBottom: "10px", borderBottom: `1px solid ${T.border}`, flexWrap: "wrap" }}>
        {draft.map((cat) => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            style={{ padding: "10px 20px",
              backgroundColor: activeCategory === cat.id ? T.accent : T.surfaceAlt,
              color: activeCategory === cat.id ? "#fff" : T.text,
              border: `1px solid ${activeCategory === cat.id ? T.accent : T.border}`,
              borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13.5px", fontFamily: "inherit" }}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Year + Add New KPI */}
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ color: T.text, fontSize: "13.5px", fontWeight: 600 }}>Year:</span>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number.parseInt(e.target.value, 10))}
            style={{ ...fieldInput, width: "auto", minWidth: "110px", cursor: "pointer" }}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={() => setShowAddKPIForm((v) => !v)} style={btnGhost}>
          <FaPlus size={11} /> {showAddKPIForm ? "Cancel Add KPI" : "Add New KPI"}
        </button>
      </div>

      {showAddKPIForm && (
        <div style={{ backgroundColor: T.surfaceAlt, padding: "20px", borderRadius: "8px", marginBottom: "22px", border: `1px solid ${T.border}` }}>
          <h4 style={{ color: T.text, marginTop: 0, marginBottom: "16px", fontSize: "15px" }}>
            Add New KPI to {current?.name}
          </h4>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr", gap: "15px", marginBottom: "15px" }}>
            <div><label style={fieldLabel}>KPI Name</label>
              <input type="text" value={newKPI.name} onChange={(e) => setNewKPI({ ...newKPI, name: e.target.value })} placeholder="Enter KPI name" style={fieldInput} /></div>
            <div><label style={fieldLabel}>Sub-Category</label>
              <select value={newKPI.subCategory} onChange={(e) => setNewKPI({ ...newKPI, subCategory: e.target.value })} style={{ ...fieldInput, cursor: "pointer" }}>
                {current?.subCategories.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select></div>
            <div><label style={fieldLabel}>Units</label>
              <select value={newKPI.units} onChange={(e) => setNewKPI({ ...newKPI, units: e.target.value })} style={{ ...fieldInput, cursor: "pointer" }}>
                {["%","R","#","days","units","index","hrs"].map((u) => <option key={u} value={u}>{u}</option>)}
              </select></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "15px" }}>
            <div><label style={fieldLabel}>Measurement Frequency</label>
              <select value={newKPI.frequency} onChange={(e) => setNewKPI({ ...newKPI, frequency: e.target.value })} style={{ ...fieldInput, cursor: "pointer" }}>
                <option value="Weekly">Weekly</option><option value="Monthly">Monthly</option>
              </select></div>
            <div><label style={fieldLabel}>Direction</label>
              <select value={newKPI.higherIsBetter} onChange={(e) => setNewKPI({ ...newKPI, higherIsBetter: e.target.value })} style={{ ...fieldInput, cursor: "pointer" }}>
                <option value="true">Higher is better</option><option value="false">Lower is better</option>
              </select></div>
            <div><label style={fieldLabel}>Weekly Target</label>
              <input type="number" step="0.01" value={newKPI.weekTarget} onChange={(e) => setNewKPI({ ...newKPI, weekTarget: e.target.value })} style={fieldInput} /></div>
            <div><label style={fieldLabel}>Monthly Target</label>
              <input type="number" step="0.01" value={newKPI.monthTarget} onChange={(e) => setNewKPI({ ...newKPI, monthTarget: e.target.value })} style={fieldInput} /></div>
            <div><label style={fieldLabel}>Annual Target</label>
              <input type="number" step="0.01" value={newKPI.yearTarget} onChange={(e) => setNewKPI({ ...newKPI, yearTarget: e.target.value })} style={fieldInput} /></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
            <div><label style={fieldLabel}>Annual roll-up</label>
              <select value={newKPI.aggregate} onChange={(e) => setNewKPI({ ...newKPI, aggregate: e.target.value })} style={{ ...fieldInput, cursor: "pointer" }}>
                <option value="avg">Average the months (rates, %)</option>
                <option value="sum">Add the months up (counts, volume)</option>
              </select></div>
            <div><label style={fieldLabel}>Definition</label>
              <textarea rows="2" value={newKPI.definition} onChange={(e) => setNewKPI({ ...newKPI, definition: e.target.value })} style={{ ...fieldInput, resize: "vertical" }} placeholder="What this KPI measures" /></div>
            <div><label style={fieldLabel}>Calculation</label>
              <textarea rows="2" value={newKPI.calculation} onChange={(e) => setNewKPI({ ...newKPI, calculation: e.target.value })} style={{ ...fieldInput, resize: "vertical" }} placeholder="How it is worked out" /></div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button onClick={() => setShowAddKPIForm(false)} style={{ ...btnGhost, padding: "8px 16px", fontSize: "12.5px" }}>Cancel</button>
            <button onClick={addKPI} disabled={!newKPI.name.trim()} style={{ ...btnPrimary, padding: "8px 16px", fontSize: "12.5px", opacity: newKPI.name.trim() ? 1 : 0.5 }}>Add KPI</button>
          </div>
        </div>
      )}

      {/* Data tables — months horizontal, sticky KPI column */}
      <div style={{ marginBottom: "20px" }}>
        {current?.subCategories.map((sub) => (
          <div key={sub.name} style={{ backgroundColor: T.surfaceAlt, padding: "20px", borderRadius: "8px", marginBottom: "20px", border: `1px solid ${T.border}` }}>
            <h5 style={{ color: T.text, marginTop: 0, marginBottom: "16px", fontSize: "15px", fontWeight: 600,
              backgroundColor: T.surface, padding: "10px 15px", borderRadius: "6px", border: `1px solid ${T.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{sub.name}</span>
              <span style={{ fontSize: "13px", fontWeight: 400, color: T.textMuted }}>{selectedYear}</span>
            </h5>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "2100px" }}>
                <thead>
                  <tr>
                    <th style={{ ...headCell(T.surfaceAlt), textAlign: "left", position: "sticky", left: 0, zIndex: 2, minWidth: "260px" }}>KPI</th>
                    <th style={{ ...headCell(T.surface), minWidth: "80px" }}>Units</th>
                    <th style={{ ...headCell(T.surface), minWidth: "120px" }}>Frequency</th>
                    <th style={{ ...headCell(T.accentTint), minWidth: "105px" }}>Wk Target</th>
                    <th style={{ ...headCell(T.accentTint), minWidth: "105px" }}>Mth Target</th>
                    <th style={{ ...headCell(T.accentTint), minWidth: "105px" }}>Yr Target</th>
                    <th style={{ ...headCell("#eef1f4"), minWidth: "105px" }}>Prev Wk</th>
                    <th style={{ ...headCell("#eef1f4"), minWidth: "105px" }}>This Wk</th>
                    {MONTHS.map((m, i) => (
                      <th key={m} style={{ ...headCell(i % 2 === 0 ? T.surface : "#fbfcfd"), minWidth: "110px" }}>
                        <div>{m}</div>
                        <div style={{ fontSize: "10px", fontWeight: 400, color: T.textFaint }}>{selectedYear}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sub.kpis.map((kpi, ki) => {
                    const rowBg = ki % 2 === 0 ? T.surface : "#fbfcfd";
                    const isEditingName = editingKPI?.kpiId === kpi.id;
                    return (
                      <tr key={kpi.id} style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: rowBg }}>
                        <td style={{ padding: "10px 12px", color: T.text, position: "sticky", left: 0, backgroundColor: rowBg, zIndex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {isEditingName ? (
                              <input autoFocus type="text" value={editKPIValue}
                                onChange={(e) => setEditKPIValue(e.target.value)}
                                onBlur={saveKpiName} onKeyDown={(e) => e.key === "Enter" && saveKpiName()}
                                style={{ padding: "5px 9px", borderRadius: "5px", border: `2px solid ${T.accent}`, fontSize: "13.5px", width: "190px", fontFamily: "inherit" }} />
                            ) : (
                              <>
                                <span style={{ fontSize: "13.5px" }}>{kpi.name}</span>
                                <button onClick={() => { setEditingKPI({ subName: sub.name, kpiId: kpi.id, original: kpi.name }); setEditKPIValue(kpi.name); }}
                                  title="Edit KPI name" style={{ background: "none", border: "none", cursor: "pointer", color: T.textFaint, padding: "2px 4px" }}>
                                  <FaEdit size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "8px", textAlign: "center", color: T.textMuted, fontSize: "12.5px" }}>{kpi.units}</td>
                        <td style={{ padding: "6px" }}>
                          <select value={kpi.frequency} onChange={(e) => patchKpi(sub.name, kpi.id, { frequency: e.target.value })} style={{ ...cellInput, cursor: "pointer" }}>
                            <option value="Weekly">Weekly</option><option value="Monthly">Monthly</option>
                          </select>
                        </td>
                        {["week","month","year"].map((key) => (
                          <td key={key} style={{ padding: "6px", backgroundColor: T.accentTint }}>
                            <input type="number" step="0.01" value={kpi.targets?.[key] ?? ""} onChange={(e) => setTarget(sub.name, kpi, key, e.target.value)} style={cellInput} />
                          </td>
                        ))}
                        {["previous","current"].map((key) => (
                          <td key={key} style={{ padding: "6px", backgroundColor: "#eef1f4" }}>
                            <input type="number" step="0.01" value={kpi.weekly?.[key] ?? ""} onChange={(e) => setWeek(sub.name, kpi, key, e.target.value)} placeholder="-" style={cellInput} />
                          </td>
                        ))}
                        {MONTHS.map((m) => (
                          <td key={m} style={{ padding: "6px" }}>
                            <input type="number" step="0.01" value={kpi.monthly?.[m] ?? ""} onChange={(e) => setMonth(sub.name, kpi, m, e.target.value)} placeholder="-" style={cellInput} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div>
        <label style={fieldLabel}>Notes on Data Entry</label>
        <textarea value={current?.notes || ""}
          onChange={(e) => setDraft((prev) => prev.map((cat) => (cat.id === current.id ? { ...cat, notes: e.target.value } : cat)))}
          placeholder="Observations, anomalies, or context that helps later analysis..."
          style={{ ...fieldInput, minHeight: "100px", resize: "vertical" }} />
        <div style={{ fontSize: "11.5px", color: T.textMuted, marginTop: "5px" }}>
          These notes are saved with the data for {current?.name}.
        </div>
      </div>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════════════════════════════ */
const OperationalPerformance = () => {
  const [user, setUser] = useState(null);
  const [structure, setStructure] = useState(() => buildDefaultStructure());
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const [isInvestorView, setIsInvestorView] = useState(false);
  const [viewingSMEId, setViewingSMEId] = useState(null);
  const [viewingSMEName, setViewingSMEName] = useState("");
  const [viewOrigin, setViewOrigin] = useState("investor");

  const [activeCategoryId, setActiveCategoryId] = useState("supply-chain");
  const [period, setPeriod] = useState("month");

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ category: "all", kpi: "all", units: "all", frequency: "all", status: "all" });
  const [openFilter, setOpenFilter] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [widths, setWidths] = useState(() => ({
    ...Object.fromEntries(COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].width])),
    [ACTIONS_KEY]: 160,
  }));
  const [visibility, setVisibility] = useState(() => Object.fromEntries(COLUMN_ORDER.map((k) => [k, true])));
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const resizing = useRef(null);

  const [infoKpi, setInfoKpi] = useState(null);
  const [chartKpi, setChartKpi] = useState(null);
  const [analysisKpi, setAnalysisKpi] = useState(null);
  const [actionKpi, setActionKpi] = useState(null);
  const [notesKpi, setNotesKpi] = useState(null);
  const [showAddData, setShowAddData] = useState(false);

  const notify = (type, message) => {
    setNotification({ type, message: String(message) });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const mode = sessionStorage.getItem("investorViewMode");
    const smeId = sessionStorage.getItem("viewingSMEId");
    if (mode === "true" && smeId) {
      setIsInvestorView(true);
      setViewingSMEId(smeId);
      setViewingSMEName(sessionStorage.getItem("viewingSMEName") || "SME");
      setViewOrigin(sessionStorage.getItem("viewOrigin") || "investor");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (cu) => {
      setUser(isInvestorView && viewingSMEId ? { uid: viewingSMEId } : cu);
    });
    return () => unsubscribe();
  }, [isInvestorView, viewingSMEId]);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) { setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, "operationalKpis", user.uid));
        const saved = snap.exists() ? snap.data().structure : null;
        if (Array.isArray(saved) && saved.length > 0) setStructure(saved);
      } catch (err) {
        console.error("Error loading operational KPIs:", err);
        notify("error", `Could not load your KPIs: ${errText(err)}`);
      } finally {
        setLoading(false);
      }
    };
    load();
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
    persist(structure.map((cat) => ({
      ...cat,
      subCategories: cat.subCategories.map((sub) => ({
        ...sub, kpis: sub.kpis.map((k) => (k.id === kpiId ? { ...k, ...patch } : k)),
      })),
    })));

  const activeCategory = useMemo(
    () => structure.find((c) => c.id === activeCategoryId) || structure[0],
    [structure, activeCategoryId]
  );
  const activeIndex = structure.findIndex((c) => c.id === activeCategory?.id);
  const accentColor = [T.accent, T.accentSoft, "#a67c52"][activeIndex] || T.accent;

  const allRows = useMemo(() => {
    if (!activeCategory) return [];
    const rows = [];
    activeCategory.subCategories.forEach((sub) =>
      sub.kpis.forEach((kpi) => rows.push({
        kpi, subCategoryName: sub.name, categoryName: activeCategory.name,
        status: getStatus(kpi, period), variance: getVariance(kpi, period),
        values: periodValues(kpi, period),
      })));
    return rows;
  }, [activeCategory, period]);

  const optionsFor = (key) => {
    const values = new Set();
    allRows.forEach((r) => {
      if (key === "category") values.add(r.subCategoryName);
      else if (key === "kpi") values.add(r.kpi.name);
      else if (key === "units") values.add(r.kpi.units);
      else if (key === "frequency") values.add(r.kpi.frequency);
      else if (key === "status") values.add(r.status.label);
    });
    return ["all", ...Array.from(values).sort()];
  };

  const rows = useMemo(() => {
    let list = [...allRows];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((r) => r.kpi.name.toLowerCase().includes(q) || r.subCategoryName.toLowerCase().includes(q));
    }

    list = list.filter((r) => {
      if (filters.category !== "all" && r.subCategoryName !== filters.category) return false;
      if (filters.kpi !== "all" && r.kpi.name !== filters.kpi) return false;
      if (filters.units !== "all" && r.kpi.units !== filters.units) return false;
      if (filters.frequency !== "all" && r.kpi.frequency !== filters.frequency) return false;
      if (filters.status !== "all" && r.status.label !== filters.status) return false;
      return true;
    });

    const get = {
      category: (r) => r.subCategoryName,
      kpi: (r) => r.kpi.name,
      units: (r) => r.kpi.units,
      frequency: (r) => r.kpi.frequency,
      target: (r) => Number(r.values.target) || 0,
      actual: (r) => Number(r.values.actual) || 0,
      current: (r) => Number(r.values.current) || 0,
      variance: (r) => Number(r.variance) || 0,
      status: (r) => ({ green: 0, amber: 1, red: 2, none: 3 }[r.status.key]),
    }[sortConfig.key];

    list.sort((a, b) => {
      // Sub-category always wins so the grouped Category cell stays contiguous.
      if (a.subCategoryName !== b.subCategoryName) return a.subCategoryName.localeCompare(b.subCategoryName);
      if (!get) return 0;
      const av = get(a), bv = get(b);
      if (typeof av === "number" && typeof bv === "number") return sortConfig.direction === "asc" ? av - bv : bv - av;
      const cmp = String(av).localeCompare(String(bv));
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });

    return list;
  }, [allRows, search, filters, sortConfig]);

  /* Category is printed once per sub-category, spanning its rows. */
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
  const activeFilterCount = Object.values(filters).filter((v) => v !== "all").length + (search.trim() ? 1 : 0);

  const startResize = (e, key) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const startWidth = widths[key];
    resizing.current = key;
    const onMove = (ev) => setWidths((p) => ({ ...p, [key]: Math.max(MIN_COL_W, startWidth + (ev.clientX - startX)) }));
    const onUp = () => {
      resizing.current = null;
      document.body.style.cursor = ""; document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const toggleSort = (key) =>
    setSortConfig((p) => ({ key, direction: p.key === key && p.direction === "asc" ? "desc" : "asc" }));

  const clearAll = () => {
    setFilters({ category: "all", kpi: "all", units: "all", frequency: "all", status: "all" });
    setSearch("");
    setSortConfig({ key: null, direction: "asc" });
  };

  const downloadCSV = () => {
    const prefix = periodMeta(period).prefix;
    const lines = [["Category","Sub-Category","KPI","Units","Measurement Frequency",
      `${prefix} Target`, `${prefix} Actual`, `${prefix} Current`, `${prefix} Variance`, "Status"]];
    structure.forEach((cat) => cat.subCategories.forEach((sub) => sub.kpis.forEach((kpi) => {
      const v = periodValues(kpi, period);
      lines.push([cat.name, sub.name, `"${kpi.name}"`, kpi.units, kpi.frequency,
        to2(v.target), to2(v.actual), to2(v.current), to2(getVariance(kpi, period)), getStatus(kpi, period).label]);
    })));
    const blob = new Blob([lines.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `operational-performance-${period}-${YEAR}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exitInvestorView = () => {
    const origin = sessionStorage.getItem("viewOrigin");
    ["viewingSMEId","viewingSMEName","investorViewMode","viewOrigin"].forEach((k) => sessionStorage.removeItem(k));
    window.location.href = origin === "cmf" ? "/cmf-cohorts" : origin === "catalyst" ? "/catalyst/cohorts" : "/my-cohorts";
  };

  /* Long headers split onto two lines rather than stretching the column. */
  const splitLabel = (key) => {
    const prefix = periodMeta(period).prefix;
    if (["target","actual","current","variance"].includes(key)) return [prefix, COLUMN_DEFS[key].label];
    if (key === "frequency") return ["Measurement", "Frequency"];
    return [COLUMN_DEFS[key].label];
  };

  const th = {
    padding: "10px 10px", textAlign: "left", color: "#fff", fontWeight: 600, fontSize: "11px",
    textTransform: "uppercase", letterSpacing: "0.4px", backgroundColor: accentColor,
    borderRight: "1px solid rgba(255,255,255,0.14)", position: "relative", overflow: "visible", verticalAlign: "top",
  };
  const td = {
    padding: "11px 12px", color: T.text, borderRight: `1px solid ${T.border}`,
    fontSize: "13.5px", overflow: "hidden",
  };
  const iconBtn = (c) => ({ background: "none", border: "none", cursor: "pointer", padding: "5px", borderRadius: "4px", color: c, display: "inline-flex", alignItems: "center" });

  if (loading) {
    return <div style={{ padding: "60px", textAlign: "center", color: T.textMuted, fontSize: "15px" }}>Loading operational performance...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", padding: "24px", boxSizing: "border-box", backgroundColor: T.surface }}>
      <style>{`
        .op-th-label {
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; white-space: normal;
          overflow-wrap: normal; word-break: normal; hyphens: none;
          line-height: 1.2; min-width: 0; flex: 1 1 auto;
        }
      `}</style>

      {isInvestorView && (
        <div style={{ backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.accent}`, padding: "14px 18px", borderRadius: "8px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "10px", color: T.text, fontWeight: 500, fontSize: "14px" }}>
            <FaEye size={14} color={T.accentSoft} />
            {viewOrigin === "catalyst" ? "Catalyst view" : viewOrigin === "cmf" ? "Facilitator view" : "Investor view"}: {viewingSMEName}'s Operational Performance
          </span>
          <button onClick={exitInvestorView} style={btnGhost}><FaArrowLeft size={11} /> Back</button>
        </div>
      )}

      {notification && (
        <div style={{
          padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "13.5px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          backgroundColor: notification.type === "error" ? T.redBg : T.greenBg,
          border: `1px solid ${notification.type === "error" ? T.red : T.green}33`,
          color: notification.type === "error" ? T.red : T.green,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {notification.type === "error" ? <FaTimesCircle size={13} /> : <FaCheckCircle size={13} />} {notification.message}
          </span>
          <button onClick={() => setNotification(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}><FaTimes size={13} /></button>
        </div>
      )}

      {/* Step 1 — title, and the See more description */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ color: T.text, fontSize: "28px", fontWeight: 700, margin: 0, letterSpacing: "-0.4px" }}>
          Operational Performance Summary
        </h1>
        <button onClick={() => setShowFullDescription((v) => !v)} style={btnGhost}>
          {showFullDescription ? "See less" : "See more"} <FaChevronDown size={10} style={{ transform: showFullDescription ? "rotate(180deg)" : "none" }} />
        </button>
      </div>

      {showFullDescription && (
        <div style={{ backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}`, padding: "24px", borderRadius: "8px", marginBottom: "22px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            <div>
              <h3 style={{ color: T.accentSoft, marginTop: 0, marginBottom: "12px", fontSize: "15px" }}>What this dashboard does</h3>
              <ul style={{ color: T.text, fontSize: "13.5px", lineHeight: 1.7, margin: 0, paddingLeft: "20px" }}>
                <li>Splits KPIs into Supply Chain, Delivery and Safety tabs</li>
                <li>Switches between this week, this month and this year — every value follows</li>
                <li>Shows target, actual, current and variance side by side with a status light</li>
                <li>Holds a definition and calculation against every KPI, editable by you</li>
                <li>Raises actions straight into your governance meetings and Integrated Actions</li>
              </ul>
            </div>
            <div>
              <h3 style={{ color: T.accentSoft, marginTop: 0, marginBottom: "12px", fontSize: "15px" }}>How to use it</h3>
              <ul style={{ color: T.text, fontSize: "13.5px", lineHeight: 1.7, margin: 0, paddingLeft: "20px" }}>
                <li>Click the eye beside a KPI to read or edit what it means</li>
                <li>Use the Actions column for the trend chart, observations, actions and notes</li>
                <li>Drag any column edge to resize it; use Columns to hide what you don't need</li>
                <li>Click a column header to filter, and the arrows to sort</li>
                <li>Use Add Data/KPI to enter a full year at once or add a new metric</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — category tabs */}
      <div style={{ display: "flex", gap: "4px", borderBottom: `1px solid ${T.border}`, marginBottom: "18px", flexWrap: "wrap" }}>
        {structure.map((cat, i) => {
          const active = cat.id === activeCategoryId;
          const color = [T.accent, T.accentSoft, "#a67c52"][i] || T.accent;
          const counts = cat.subCategories.flatMap((s) => s.kpis).reduce((acc, k) => {
            const key = getStatus(k, period).key;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});
          return (
            <button key={cat.id} onClick={() => { setActiveCategoryId(cat.id); clearAll(); }}
              style={{ padding: "12px 24px", background: "none", border: "none", cursor: "pointer",
                fontSize: "14px", fontWeight: active ? 600 : 500,
                color: active ? color : T.textMuted,
                borderBottom: active ? `3px solid ${color}` : "3px solid transparent",
                display: "flex", alignItems: "center", gap: "9px", fontFamily: "inherit" }}>
              {cat.name}
              <span style={{ display: "inline-flex", gap: "4px" }}>
                {counts.red > 0 && <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "9px", backgroundColor: T.redBg, color: T.red, fontWeight: 700 }}>{counts.red}</span>}
                {counts.amber > 0 && <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "9px", backgroundColor: T.amberBg, color: T.amber, fontWeight: 700 }}>{counts.amber}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* Step 5 + 6 — timeframe, columns, buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          {PERIODS.map((p) => {
            const on = p.key === period;
            return (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                style={{ padding: "8px 17px", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
                  fontWeight: on ? 600 : 500,
                  backgroundColor: on ? T.accent : T.surface,
                  color: on ? "#fff" : T.text,
                  border: `1px solid ${on ? T.accent : T.borderStrong}`, fontFamily: "inherit" }}>
                {p.label}
              </button>
            );
          })}
          <span style={{ fontSize: "12px", color: T.textMuted, marginLeft: "6px" }}>
            Showing {periodMeta(period).prefix.toLowerCase()} target, actual, current and variance
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {activeFilterCount > 0 && (
            <button onClick={clearAll} style={{ ...btnGhost, padding: "7px 12px", fontSize: "12px" }}>
              Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: T.surface, border: `1px solid ${T.borderStrong}`, borderRadius: "6px", padding: "2px 10px" }}>
            <FaSearch size={11} color={T.textFaint} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search KPIs..."
              style={{ border: "none", outline: "none", padding: "7px 2px", fontSize: "13px", width: "150px", fontFamily: "inherit", color: T.text }} />
          </div>

          <div style={{ position: "relative" }}>
            <button onClick={() => setShowColumnMenu((v) => !v)} style={btnGhost}>
              <FaColumns size={12} /> Columns <FaChevronDown size={10} />
            </button>
            {showColumnMenu && (
              <>
                <div onClick={() => setShowColumnMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 400 }} />
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: "260px",
                  backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: "8px",
                  boxShadow: "0 8px 26px rgba(0,0,0,0.14)", padding: "10px", zIndex: 401 }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", padding: "4px 8px 8px" }}>
                    Show columns
                  </div>
                  {COLUMN_ORDER.map((key) => {
                    const def = COLUMN_DEFS[key];
                    return (
                      <div key={key} onClick={() => def.hideable && setVisibility((p) => ({ ...p, [key]: !p[key] }))}
                        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 8px", borderRadius: "5px",
                          cursor: def.hideable ? "pointer" : "not-allowed", opacity: def.hideable ? 1 : 0.55, fontSize: "13px", color: T.text }}>
                        {visibility[key] ? <FaCheckSquare size={13} color={T.accent} /> : <FaRegSquare size={13} color={T.textFaint} />}
                        <span style={{ flex: 1 }}>{def.label}</span>
                        {!def.hideable && <span style={{ fontSize: "10px", color: T.textFaint, textTransform: "uppercase" }}>Fixed</span>}
                      </div>
                    );
                  })}
                  <div style={{ borderTop: `1px solid ${T.border}`, marginTop: "6px", paddingTop: "8px", display: "flex", alignItems: "center", gap: "10px", padding: "8px", fontSize: "13px", color: T.textMuted }}>
                    <FaCheckSquare size={13} color={T.textFaint} /><span style={{ flex: 1 }}>Actions</span>
                    <span style={{ fontSize: "10px", color: T.textFaint, textTransform: "uppercase" }}>Fixed</span>
                  </div>
                  <button onClick={() => setVisibility(Object.fromEntries(COLUMN_ORDER.map((k) => [k, true])))}
                    style={{ ...btnGhost, width: "100%", justifyContent: "center", marginTop: "6px", fontSize: "12px", padding: "7px" }}>
                    Show all
                  </button>
                </div>
              </>
            )}
          </div>

          <button onClick={downloadCSV} style={btnGhost}><FaDownload size={12} /> CSV</button>

          {/* Step 6 — through to the upcoming meeting / actions overview */}
          <button onClick={() => { window.location.href = "/raps-actions"; }} style={btnGhost}>
            <FaClipboardList size={12} /> Performance Overview <FaExternalLinkAlt size={9} />
          </button>

          {!isInvestorView && (
            <button onClick={() => setShowAddData(true)} style={btnPrimary}>
              <FaPlus size={11} /> Add Data/KPI
            </button>
          )}
        </div>
      </div>

      {/* Category strip */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ width: "6px", height: "28px", backgroundColor: accentColor, borderRadius: "3px", marginRight: "12px" }} />
        <h3 style={{ color: T.text, margin: 0, fontSize: "17px", fontWeight: 700 }}>{activeCategory?.name}</h3>
        <div style={{ flex: 1, height: "1px", backgroundColor: T.border, marginLeft: "18px" }} />
      </div>

      {/* Step 3 + 4 — the table */}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: "8px", overflow: "hidden", backgroundColor: T.surface, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: totalWidth, minWidth: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr>
                {visibleColumns.map((key) => {
                  const def = COLUMN_DEFS[key];
                  const isOpen = openFilter === key;
                  const sorted = sortConfig.key === key;
                  const filtered = def.filter && filters[key] !== "all";
                  const lines = splitLabel(key);

                  return (
                    <th key={key} style={{ ...th, width: widths[key], textAlign: def.align === "center" ? "center" : "left" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "4px", justifyContent: def.align === "center" ? "center" : "flex-start", minWidth: 0 }}>
                        <span className="op-th-label" title={lines.join(" ")}
                          onClick={() => def.filter && setOpenFilter(isOpen ? null : key)}
                          style={{ cursor: def.filter ? "pointer" : "default",
                            backgroundColor: filtered ? "rgba(255,255,255,0.22)" : "transparent",
                            padding: "1px 5px", borderRadius: "4px" }}>
                          {lines.map((l, i) => <React.Fragment key={i}>{i > 0 && <br />}{l}</React.Fragment>)}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", flexShrink: 0, marginTop: "1px" }}>
                          <InfoTip text={def.tooltip} />
                          {def.sortable && (
                            <button onClick={(e) => { e.stopPropagation(); toggleSort(key); }}
                              style={iconBtn(sorted ? "#fff" : "rgba(255,255,255,0.6)")} title="Sort">
                              {sorted ? (sortConfig.direction === "asc" ? <FaSortUp size={11} /> : <FaSortDown size={11} />) : <FaSort size={10} />}
                            </button>
                          )}
                          {def.filter && (
                            <button onClick={(e) => { e.stopPropagation(); setOpenFilter(isOpen ? null : key); }}
                              style={iconBtn(filtered ? "#fff" : "rgba(255,255,255,0.6)")} title="Filter this column">
                              <FaSlidersH size={10} />
                            </button>
                          )}
                        </span>
                      </div>

                      {isOpen && def.filter && (
                        <div onMouseLeave={() => setOpenFilter(null)} style={{
                          position: "absolute", top: "100%", left: 0, marginTop: "4px", backgroundColor: T.surface,
                          border: `1px solid ${T.border}`, borderRadius: "8px", minWidth: "200px", maxHeight: "260px",
                          overflowY: "auto", zIndex: 500, boxShadow: "0 8px 26px rgba(0,0,0,0.18)", padding: "4px 0",
                          textTransform: "none", letterSpacing: "normal", fontWeight: 400,
                        }}>
                          {optionsFor(key).map((opt) => (
                            <div key={opt} onClick={() => { setFilters((p) => ({ ...p, [key]: opt })); setOpenFilter(null); }}
                              style={{ padding: "7px 14px", cursor: "pointer", fontSize: "12.5px",
                                backgroundColor: filters[key] === opt ? T.accentTint : T.surface,
                                color: T.text, fontWeight: filters[key] === opt ? 600 : 400 }}>
                              {opt === "all" ? `All ${def.label}` : opt}
                            </div>
                          ))}
                        </div>
                      )}

                      <div onMouseDown={(e) => startResize(e, key)} title="Drag to resize"
                        style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                    </th>
                  );
                })}

                <th style={{ ...th, width: widths[ACTIONS_KEY], textAlign: "center", borderRight: "none", backgroundColor: "rgba(0,0,0,0.16)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", justifyContent: "center" }}>
                    <span>Actions</span>
                    <InfoTip text="Trend chart, observations and opportunities, add an action (yellow and red only), and notes for this KPI." />
                  </div>
                  <div onMouseDown={(e) => startResize(e, ACTIONS_KEY)} style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                </th>
              </tr>
            </thead>

            <tbody>
              {groupedRows.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} style={{ ...td, textAlign: "center", padding: "50px 16px", color: T.textMuted, borderRight: "none" }}>
                    No KPIs match the current filters.
                  </td>
                </tr>
              ) : groupedRows.map((group) => group.items.map((row, idx) => {
                const { kpi, subCategoryName, categoryName, status, variance, values } = row;
                const needsAction = status.key === "amber" || status.key === "red";
                const favourable = variance === null ? null : kpi.higherIsBetter ? variance >= 0 : variance <= 0;
                const lastInGroup = idx === group.items.length - 1;
                const rowTd = { ...td, borderBottom: lastInGroup ? `2px solid ${T.borderStrong}` : `1px solid ${T.border}` };

                const cell = (key, content) =>
                  visibility[key] ? (
                    <td key={key} style={{ ...rowTd, width: widths[key], textAlign: COLUMN_DEFS[key].align === "center" ? "center" : "left" }}>
                      {content}
                    </td>
                  ) : null;

                return (
                  <tr key={kpi.id}>
                    {/* One Category cell spanning the whole sub-category */}
                    {visibility.category && idx === 0 && (
                      <td rowSpan={group.items.length}
                        style={{ ...td, width: widths.category, backgroundColor: T.surfaceAlt, fontWeight: 600,
                          color: T.text, verticalAlign: "middle", borderBottom: `2px solid ${T.borderStrong}` }}>
                        {group.name}
                      </td>
                    )}

                    {visibility.kpi && (
                      <td style={{ ...rowTd, width: widths.kpi }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 500 }}>{kpi.name}</span>
                          <button onClick={() => setInfoKpi(kpi)} style={iconBtn(T.textFaint)} title="Definition and calculation">
                            <FaEye size={14} />
                          </button>
                          {kpi.notes && <FaStickyNote size={10} color={T.amber} title="Has notes" />}
                        </div>
                      </td>
                    )}

                    {cell("units", <span style={{ color: T.textMuted }}>{kpi.units}</span>)}
                    {cell("frequency", (
                      <span style={{ fontSize: "11.5px", padding: "3px 10px", borderRadius: "12px", backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.textMuted }}>
                        {kpi.frequency}
                      </span>
                    ))}
                    {cell("target", <span style={{ color: T.textMuted }}>{to2(values.target)}</span>)}
                    {cell("actual", <span>{to2(values.actual)}</span>)}
                    {cell("current", <span style={{ fontWeight: 700 }}>{to2(values.current)}</span>)}
                    {cell("variance", variance === null
                      ? <span style={{ color: T.textFaint }}>—</span>
                      : <span style={{ fontWeight: 700, color: favourable ? T.green : T.red }}>
                          {variance > 0 ? "+" : ""}{to2(variance)}
                        </span>)}
                    {cell("status", <StatusIcon status={status} />)}

                    <td style={{ ...rowTd, width: widths[ACTIONS_KEY], textAlign: "center", borderRight: "none" }}>
                      <div style={{ display: "flex", gap: "2px", justifyContent: "center", alignItems: "center" }}>
                        <button onClick={() => setChartKpi(kpi)} style={iconBtn(T.blue)} title="Trend chart"><FaChartLine size={15} /></button>
                        <button onClick={() => setAnalysisKpi(kpi)} style={iconBtn(T.accentSoft)} title="Observations and opportunities"><FaLightbulb size={15} /></button>
                        {/* Only offered once the KPI is off target — a green KPI
                            has nothing to action. */}
                        {needsAction && !isInvestorView && (
                          <button onClick={() => setActionKpi({ kpi, subCategoryName, categoryName })} style={iconBtn(status.color)} title="Add action">
                            <FaPlus size={15} />
                          </button>
                        )}
                        <button onClick={() => setNotesKpi(kpi)} style={iconBtn(kpi.notes ? T.amber : T.textFaint)} title="Notes">
                          {kpi.notes ? <FaStickyNote size={15} /> : <FaRegStickyNote size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}`, backgroundColor: T.surfaceAlt, fontSize: "11.5px", color: T.textMuted, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <span>{rows.length} of {allRows.length} KPIs · {activeCategory?.subCategories.length} sub-categories</span>
          <span style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FaCheckCircle size={11} color={T.green} /> On target</span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FaExclamationTriangle size={11} color={T.amber} /> Needs attention</span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FaTimesCircle size={11} color={T.red} /> Critical</span>
          </span>
        </div>
      </div>

      {/* Popups */}
      {infoKpi && (
        <KpiInfoModal kpi={infoKpi} readOnly={isInvestorView} onClose={() => setInfoKpi(null)}
          onSave={(patch) => { updateKpi(infoKpi.id, patch); setInfoKpi({ ...infoKpi, ...patch }); notify("success", "KPI definition updated."); }} />
      )}
      {chartKpi && <TrendChartModal kpi={chartKpi} period={period} onClose={() => setChartKpi(null)} />}
      {analysisKpi && <AnalysisModal kpi={analysisKpi} period={period} onClose={() => setAnalysisKpi(null)} />}
      {actionKpi && (
        <AddActionModal kpi={actionKpi.kpi} period={period}
          categoryName={actionKpi.categoryName} subCategoryName={actionKpi.subCategoryName}
          userId={user?.uid} onClose={() => setActionKpi(null)}
          onSaved={(meetingTitle) => notify("success", `Action added to "${meetingTitle}" and Integrated Actions.`)} />
      )}
      {notesKpi && (
        <NotesModal kpi={notesKpi} readOnly={isInvestorView} onClose={() => setNotesKpi(null)}
          onSave={(notes) => { updateKpi(notesKpi.id, { notes }); notify("success", "Notes saved."); }} />
      )}
      {showAddData && (
        <AddDataKpiModal structure={structure} initialCategoryId={activeCategoryId}
          onClose={() => setShowAddData(false)}
          onSave={async (next) => { await persist(next); notify("success", "Data saved successfully."); }} />
      )}
    </div>
  );
};

export default OperationalPerformance;