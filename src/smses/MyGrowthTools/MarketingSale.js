"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Chart, Pie, Bar } from "react-chartjs-2";
import {
  doc, getDoc, setDoc, collection, query, where, getDocs,
  addDoc, deleteDoc, updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  Eye, LineChart as LineChartIcon, Lightbulb, Plus, StickyNote, X, Save, Pencil, Info,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
  CheckCircle2, AlertTriangle, XCircle, ClipboardList, Download, RefreshCw, Columns3,
  ExternalLink, Square, CheckSquare, ArrowLeft, Calendar, SlidersHorizontal,
  Database, Sparkles, Sigma, Settings2, EyeOff, Palette, Check, Users, Trash2,
  TrendingUp, TrendingDown, Settings, FileText, FileSpreadsheet, Printer,
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { getFunctions, httpsCallable } from "firebase/functions";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

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
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PERIODS = [
  { key: "month", label: "This month" },
  { key: "quarter", label: "This quarter" },
  { key: "year", label: "This year" },
];
const PERIOD_LABEL = { month: "This month", quarter: "This quarter", year: "This year" };
const PERIOD_PREFIX = { month: "Monthly", quarter: "Quarterly", year: "Annual" };

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
  return [0, 1, 2, 3].map((q) => {
    const s = months.slice(q * 3, q * 3 + 3);
    return { key: `Q${q + 1}`, label: `Q${q + 1}`, range: `${s[0].label} – ${s[2].label}`, months: s, index: q };
  });
};
const currentMonthKey = () => {
  const d = new Date();
  return `M:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const LOCALE = "en-US";
const trimNum = (n) => {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n), dp = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return Number(n.toFixed(dp)).toLocaleString(LOCALE, { maximumFractionDigits: dp });
};

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
  const suffix = !bare && kpi?.units && !["#", "%", "R"].includes(kpi.units) ? ` ${kpi.units}` : "";
  return `${sign}${trimNum(n)}${suffix}`;
};

const parseNum = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const errText = (e) => String(e?.message ?? e ?? "Unknown error");
const fmtDMY = (d) => {
  if (!d) return "";
  const x = new Date(d);
  return Number.isNaN(x.getTime())
    ? ""
    : `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
};
const rollUp = (values, mode) => {
  const nums = values.filter((v) => Number.isFinite(v));
  if (!nums.length) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return mode === "sum" ? sum : sum / nums.length;
};
const mean = (arr) => {
  const n = arr.filter((v) => Number.isFinite(v));
  return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
};

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

const InfoTip = ({ text, light = false }) => {
  const [rect, setRect] = useState(null);
  if (!text) return null;
  return (
    <span
      style={{ display: "inline-flex" }}
      onMouseEnter={(e) => setRect(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setRect(null)}
    >
      <Info size={13} strokeWidth={2} color={light ? "rgba(255,255,255,0.75)" : T.faint} style={{ cursor: "help" }} />
      {rect && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed", top: rect.bottom + 8,
          left: Math.min(Math.max(rect.left - 110, 12), window.innerWidth - 250),
          width: "236px", background: T.ink, color: "#fff", fontSize: "12.5px",
          padding: "10px 12px", borderRadius: "8px", lineHeight: 1.5, zIndex: 3000,
          pointerEvents: "none", fontWeight: 400, letterSpacing: "normal", textTransform: "none",
          boxShadow: "0 10px 30px rgba(45,32,28,0.3)",
        }}>{text}</div>, document.body)}
    </span>
  );
};

const btnBase = {
  padding: "9px 16px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "inherit",
};
const btnPrimary = { ...btnBase, background: T.accent, color: "#fff", border: `1px solid ${T.accent}`, fontWeight: 600 };
const btnGhost = { ...btnBase, background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}` };
const btnQuiet = { ...btnBase, background: "transparent", color: T.accent, border: "1px solid transparent" };

const inputS = {
  width: "100%", padding: "9px 11px", border: `1px solid ${T.lineStrong}`, borderRadius: "8px",
  fontSize: "13.5px", fontFamily: "inherit", boxSizing: "border-box",
  color: T.ink, background: T.bg, outline: "none",
};

/* Base select — chevron is drawn by the Select wrapper below */
const selectS = {
  ...inputS,
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  paddingRight: "34px",
};

/* Select wrapper — same API as native <select>, overlays a lucide chevron.
   Every dropdown in the app uses this so it *reads* as a dropdown. */
const Select = ({ value, onChange, children, style, disabled, ...rest }) => (
  <div style={{ position: "relative", width: "100%" }}>
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{
        ...selectS,
        background: disabled ? T.panel : T.bg,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
      {...rest}
    >
      {children}
    </select>
    <ChevronDown
      size={15}
      color={T.muted}
      style={{
        position: "absolute", right: "11px", top: "50%",
        transform: "translateY(-50%)", pointerEvents: "none",
      }}
    />
  </div>
);

const labelS = { display: "block", fontSize: "12.5px", fontWeight: 600, color: T.accent, marginBottom: "5px" };
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "14px 16px" };
const panelTh = {
  padding: "9px 12px", fontSize: "11.5px", fontWeight: 700, color: "#fff",
  textTransform: "uppercase", letterSpacing: "0.5px", background: T.header, whiteSpace: "nowrap",
};

const Modal = ({ title, subtitle, icon, onClose, children, width = 640, footer }) => (
  <div onClick={onClose} style={{
    position: "fixed", inset: 0, background: "rgba(45,32,28,0.55)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1400, padding: "20px",
  }}>
    <div onClick={(e) => e.stopPropagation()} style={{
      background: T.bg, borderRadius: "14px", width: "100%", maxWidth: `${width}px`,
      maxHeight: "94vh", display: "flex", flexDirection: "column",
      boxShadow: "0 24px 60px rgba(45,32,28,0.28)",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        padding: "18px 22px 14px", borderBottom: `1px solid ${T.line}`,
      }}>
        <div style={{ display: "flex", gap: "11px", alignItems: "flex-start" }}>
          {icon && <span style={{ marginTop: "2px", color: T.accent }}>{icon}</span>}
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", color: T.accent, fontWeight: 600, letterSpacing: "-0.2px" }}>{title}</h3>
            {subtitle && <p style={{ margin: "3px 0 0", fontSize: "13px", color: T.body }}>{subtitle}</p>}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: T.raised, border: "none", cursor: "pointer", color: T.body,
          width: 30, height: 30, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <X size={15} />
        </button>
      </div>
      <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1 }}>{children}</div>
      {footer && (
        <div style={{
          padding: "13px 22px", borderTop: `1px solid ${T.line}`, display: "flex",
          justifyContent: "flex-end", gap: "10px", alignItems: "center",
          background: T.panel, borderRadius: "0 0 14px 14px",
        }}>{footer}</div>
      )}
    </div>
  </div>
);

const DIRECTIONS = [
  { value: "higher", label: "Higher is better" },
  { value: "lower", label: "Lower is better" },
  { value: "match", label: "Matching is better" },
];

const KpiInfoModal = ({ kpi, onClose, onSave, readOnly }) => {
  const [editing, setEditing] = useState(false);
  const [meaning, setMeaning] = useState(kpi.meaning || "");
  const [measured, setMeasured] = useState(kpi.measured || "");
  const box = (v, empty, mono) => (
    <div style={{
      background: T.panel, border: `1px solid ${T.line}`, borderRadius: "8px",
      padding: "13px 15px", fontSize: mono ? "13px" : "14px", lineHeight: 1.65,
      color: v ? T.body : T.faint, fontStyle: v ? "normal" : "italic",
      whiteSpace: "pre-wrap",
      fontFamily: mono && v ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit",
    }}>{v || empty}</div>
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
        {[
          `Units: ${kpi.units}`,
          DIRECTIONS.find((d) => d.value === kpi.direction)?.label,
          kpi.aggregate === "avg" ? "AVERAGE across periods" : "SUM across periods",
          kpi.benchmark !== null ? `Benchmark: ${fmtValue(kpi.benchmark, kpi)}` : null,
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

const COLUMN_DEFS = {
  category: { label: "Category", width: 178, tip: "The category this KPI sits under.", filter: true, sort: true, hideable: true },
  kpi: { label: "KPI", width: 288, tip: "The metric being tracked. Click the eye to see what it means and how it is measured.", filter: true, sort: true, hideable: false },
  units: { label: "Units", width: 90, align: "center", tip: "The unit every figure in this row is expressed in.", filter: true, sort: true, hideable: true },
  budget: { label: "Target", width: 132, align: "center", tip: "Your captured target, or the recommended benchmark where none is set.", sort: true, hideable: true },
  actual: { label: "Actual", width: 132, align: "center", tip: "What was recorded for the selected period.", sort: true, hideable: true },
  variance: { label: "Variance", width: 132, align: "center", tip: "Actual minus Target. Green means favourable for this KPI's direction.", sort: true, hideable: true },
  status: { label: "Status", width: 104, align: "center", tip: "Green: on target. Amber: needs attention. Red: well outside target.", filter: true, sort: true, hideable: true },
};
const COLUMN_ORDER = Object.keys(COLUMN_DEFS);
const ACTIONS_KEY = "__actions__";
const columnLines = (key, period) =>
  ["budget", "actual", "variance"].includes(key) ? [PERIOD_PREFIX[period], COLUMN_DEFS[key].label] : [COLUMN_DEFS[key].label];

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
      <button onClick={() => setOpen(!open)} style={{
        background: "none", border: "none", cursor: "pointer", padding: "2px",
        color: value && value !== "All" ? "#fff" : "rgba(255,255,255,0.5)",
        display: "inline-flex", alignItems: "center",
      }}><SlidersHorizontal size={13} /></button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", right: 0, marginTop: "4px", background: T.bg,
          border: `1px solid ${T.lineStrong}`, borderRadius: "8px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.15)", zIndex: 100,
          minWidth: "150px", maxHeight: "200px", overflowY: "auto",
        }}>
          {options.map((opt) => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); onClose?.(); }}
              style={{
                padding: "8px 14px", cursor: "pointer", fontSize: "13px", color: T.body,
                background: value === opt ? T.accentTint : "transparent",
                borderBottom: `1px solid ${T.lineSoft}`,
              }}>{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const K = (o) => ({
  id: o.id, name: o.name, units: o.units,
  direction: o.direction || "higher", aggregate: o.aggregate || "avg",
  meaning: o.meaning, measured: o.measured,
  actual: o.actual, budget: o.budget || (() => null),
  benchmark: o.benchmark ?? null, options: o.options || null,
  field: o.field || null, source: o.source || null,
});

const TAB_DEFS = [
  {
    id: "summary",
    name: "Marketing & Sales Performance Summary",
    categories: [
      { name: "Pipeline Sufficiency", kpis: [
        K({ id: "totalPipelineValue", name: "Total Pipeline Value", units: "R", direction: "higher", aggregate: "sum", benchmark: 1000000,
          meaning: "The total value of all opportunities in your pipeline.",
          measured: "=SUM(Rev Potential) for all active opportunities",
          source: "Captured from pipeline records",
          field: { src: "pipeline", a: ["pipelineData", "pipelineValue", "actual"], b: ["pipelineData", "pipelineValue", "budget"] } }),
        K({ id: "riskAdjustedValue", name: "Risk Adjusted Value", units: "R", direction: "higher", aggregate: "sum", benchmark: 500000,
          meaning: "The value of opportunities weighted by their probability of closing.",
          measured: "=SUM(Rev Potential × Probability %) for all active opportunities",
          source: "Captured from pipeline records",
          field: { src: "pipeline", a: ["pipelineData", "riskValue", "actual"], b: ["pipelineData", "riskValue", "budget"] } }),
        K({ id: "pipelineCoverage", name: "Pipeline Coverage", units: "%", direction: "higher", aggregate: "avg", benchmark: 200,
          meaning: "The ratio of risk-adjusted pipeline value to target revenue.",
          measured: "=Risk Adjusted Value ÷ Target Revenue × 100%",
          source: "Calculated from pipeline data",
          field: { src: "pipeline", a: ["pipelineData", "coverage", "actual"], b: ["pipelineData", "coverage", "budget"] } }),
        K({ id: "newLeads", name: "New Leads", units: "#", direction: "higher", aggregate: "sum", benchmark: 50,
          meaning: "The number of new leads added to the pipeline in the period.",
          measured: "=COUNT of new records in the period",
          source: "Captured from pipeline records",
          field: { src: "pipeline", a: ["pipelineData", "newLeads", "actual"], b: ["pipelineData", "newLeads", "budget"] } }),
        K({ id: "conversionRate", name: "Conversion Rate", units: "%", direction: "higher", aggregate: "avg", benchmark: 30,
          meaning: "The percentage of opportunities that convert to closed deals.",
          measured: "=Converted Opportunities ÷ Total Opportunities × 100%",
          source: "Calculated from pipeline data",
          field: { src: "pipeline", a: ["pipelineData", "conversionRate", "actual"], b: ["pipelineData", "conversionRate", "budget"] } }),
        K({ id: "salesVelocity", name: "Sales Velocity", units: "days", direction: "lower", aggregate: "avg", benchmark: 30,
          meaning: "The average number of days from lead creation to close.",
          measured: "=AVERAGE(Days between Created At and Signed Date)",
          source: "Calculated from pipeline records",
          field: { src: "pipeline", a: ["pipelineData", "salesVelocity", "actual"], b: ["pipelineData", "salesVelocity", "budget"] } }),
      ]},
      { name: "Revenue Concentration", kpis: [
        K({ id: "totalMarketingSpend", name: "Total Marketing Spend", units: "R", direction: "lower", aggregate: "sum", benchmark: 100000,
          meaning: "The total amount spent on marketing across all channels.",
          measured: "=SUM of all channel marketing spend",
          source: "Captured from marketing data",
          field: { src: "concentration", a: ["concentrationData", "totalSpend", "actual"], b: ["concentrationData", "totalSpend", "budget"] } }),
        K({ id: "overallROI", name: "Overall ROI", units: "%", direction: "higher", aggregate: "avg", benchmark: 200,
          meaning: "The return on investment from marketing activities.",
          measured: "=(Total Revenue - Total Spend) ÷ Total Spend × 100%",
          source: "Calculated from marketing data",
          field: { src: "concentration", a: ["concentrationData", "totalROI", "actual"], b: ["concentrationData", "totalROI", "budget"] } }),
      ]},
      { name: "Demand Sustainability", kpis: [
        K({ id: "repeatCustomerRate", name: "Repeat Customer Rate", units: "%", direction: "higher", aggregate: "avg", benchmark: 40,
          meaning: "The percentage of customers who make repeat purchases.",
          measured: "=Repeat Customers ÷ Total Customers × 100%",
          source: "Captured from customer data",
          field: { src: "sustainability", a: ["sustainabilityData", "repeatRate", "actual"], b: ["sustainabilityData", "repeatRate", "budget"] } }),
        K({ id: "netRetention", name: "Net Retention", units: "%", direction: "higher", aggregate: "avg", benchmark: 30,
          meaning: "The net customer retention rate (repeat rate minus churn rate).",
          measured: "=Repeat Customer Rate - Churn Rate",
          source: "Calculated from customer data",
          field: { src: "sustainability", a: ["sustainabilityData", "netRetention", "actual"], b: ["sustainabilityData", "netRetention", "budget"] } }),
        K({ id: "campaignROI", name: "Campaign ROI", units: "%", direction: "higher", aggregate: "avg", benchmark: 150,
          meaning: "The return on investment from marketing campaigns.",
          measured: "=(Campaign Revenue - Campaign Cost) ÷ Campaign Cost × 100%",
          source: "Calculated from campaign data",
          field: { src: "sustainability", a: ["sustainabilityData", "campaignROI", "actual"], b: ["sustainabilityData", "campaignROI", "budget"] } }),
      ]},
    ],
  },
  { id: "revenue-concentration", name: "Revenue Concentration", categories: [
    { name: "Top 3 Concentration", panel: "top3", kpis: [], dataEditable: true },
    { name: "Channel Performance", panel: "channelPerf", kpis: [], dataEditable: true },
    { name: "Concentration Risk Analysis", panel: "riskAnalysis", kpis: [], dataEditable: true },
  ]},
  { id: "demand-sustainability", name: "Demand Sustainability", categories: [
    { name: "Campaign Performance", panel: "campaignPerf", kpis: [], dataEditable: true },
  ]},
  { id: "pipeline-visibility", name: "Pipeline Visibility", categories: [
    { name: "Tier Category", panel: "pipelineTable", kpis: [] },
  ]},
];

const DOC = {
  pipeline: "_pipelineData",
  concentration: "_concentrationData",
  sustainability: "_sustainabilityData",
};

const atPath = (obj, path) => path.reduce((o, k) => (o == null ? undefined : o[k]), obj);
const numAt = (docs, src, path, mi) => {
  const arr = atPath(docs[src], path);
  if (!Array.isArray(arr)) return null;
  const n = parseFloat(arr[mi]);
  return Number.isFinite(n) ? n : null;
};

const buildContext = (docs, mi) => ({
  pipelineValue: numAt(docs, "pipeline", ["pipelineData", "pipelineValue", "actual"], mi),
  pipelineBudget: numAt(docs, "pipeline", ["pipelineData", "pipelineValue", "budget"], mi),
  riskValue: numAt(docs, "pipeline", ["pipelineData", "riskValue", "actual"], mi),
  riskBudget: numAt(docs, "pipeline", ["pipelineData", "riskValue", "budget"], mi),
  coverage: numAt(docs, "pipeline", ["pipelineData", "coverage", "actual"], mi),
  coverageBudget: numAt(docs, "pipeline", ["pipelineData", "coverage", "budget"], mi),
  newLeads: numAt(docs, "pipeline", ["pipelineData", "newLeads", "actual"], mi),
  newLeadsBudget: numAt(docs, "pipeline", ["pipelineData", "newLeads", "budget"], mi),
  conversionRate: numAt(docs, "pipeline", ["pipelineData", "conversionRate", "actual"], mi),
  conversionBudget: numAt(docs, "pipeline", ["pipelineData", "conversionRate", "budget"], mi),
  salesVelocity: numAt(docs, "pipeline", ["pipelineData", "salesVelocity", "actual"], mi),
  velocityBudget: numAt(docs, "pipeline", ["pipelineData", "salesVelocity", "budget"], mi),
  totalSpend: numAt(docs, "concentration", ["concentrationData", "totalSpend", "actual"], mi),
  spendBudget: numAt(docs, "concentration", ["concentrationData", "totalSpend", "budget"], mi),
  totalROI: numAt(docs, "concentration", ["concentrationData", "totalROI", "actual"], mi),
  roiBudget: numAt(docs, "concentration", ["concentrationData", "totalROI", "budget"], mi),
  repeatRate: numAt(docs, "sustainability", ["sustainabilityData", "repeatRate", "actual"], mi),
  repeatBudget: numAt(docs, "sustainability", ["sustainabilityData", "repeatRate", "budget"], mi),
  netRetention: numAt(docs, "sustainability", ["sustainabilityData", "netRetention", "actual"], mi),
  netRetentionBudget: numAt(docs, "sustainability", ["sustainabilityData", "netRetention", "budget"], mi),
  campaignROI: numAt(docs, "sustainability", ["sustainabilityData", "campaignROI", "actual"], mi),
  campaignROIBudget: numAt(docs, "sustainability", ["sustainabilityData", "campaignROI", "budget"], mi),
});

const monthEntry = (kpi, year, mi) =>
  kpi.entries?.[`M:${year}-${String(mi + 1).padStart(2, "0")}`] || { actual: null, budget: null };

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

const getStatus = (kpi, period, fy) => {
  const v = periodValues(kpi, period, fy);
  return statusFromPair(kpi, v.budget, v.actual);
};
const getVariance = (kpi, period, fy) => {
  const { budget, actual } = periodValues(kpi, period, fy);
  const b = Number(budget), a = Number(actual);
  return Number.isFinite(b) && Number.isFinite(a) ? a - b : null;
};

/* ════════════════════════════════════════════════════════════════════════════
   Report Generator
   ════════════════════════════════════════════════════════════════════════ */
const MarketingReportGenerator = ({
  tabs, fy, period, onClose, userId, userName, pipelineRecords,
  getStatusFn, periodValuesFn, getVarianceFn, statusFromPairFn,
  trimNumFn, fmtValueFn, fyLabelFn,
}) => {
  const [selectedTabs, setSelectedTabs] = useState(() => Object.fromEntries(tabs.map((t) => [t.id, true])));
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeBreakdown, setIncludeBreakdown] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [includePipeline, setIncludePipeline] = useState(true);
  const [includeConcentration, setIncludeConcentration] = useState(true);
  const [includeCampaigns, setIncludeCampaigns] = useState(true);
  const [includeActions, setIncludeActions] = useState(true);
  const [periodForReport, setPeriodForReport] = useState(period);
  const [generating, setGenerating] = useState(false);
  const [reportTitle, setReportTitle] = useState(`Marketing & Sales Report - ${new Date().toLocaleDateString()}`);

  const [actions, setActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(true);

  useEffect(() => {
    const loadActions = async () => {
      if (!userId) { setLoadingActions(false); return; }
      try {
        const snap = await getDoc(doc(db, "governanceCalendar", userId));
        if (snap.exists()) {
          const meetings = snap.data().meetings || [];
          const allActions = meetings.flatMap(m => (m.actions || []).map(a => ({ ...a, meetingTitle: m.title })));
          setActions(allActions);
        }
      } catch (err) { console.error("Failed to load actions:", err); }
      finally { setLoadingActions(false); }
    };
    loadActions();
  }, [userId]);

  const getStatusLocal = (kpi, p, f) => getStatusFn(kpi, p, f);
  const periodValuesLocal = (kpi, p, f) => periodValuesFn(kpi, p, f);
  const getVarianceLocal = (kpi, p, f) => getVarianceFn(kpi, p, f);
  const trimNumLocal = (n) => trimNumFn(n);
  const fmtValueLocal = (raw, kpi, options) => fmtValueFn(raw, kpi, options);
  const fyLabelLocal = (sy, sm) => fyLabelFn(sy, sm);

  const buildBreakdown = useCallback((kpi) => {
    const months = fyMonths(fy.startYear, fy.startMonth);
    const rows = months.map((m) => {
      const entry = kpi.entries?.[m.key] || {};
      const a = parseNum(entry.actual);
      const b = parseNum(entry.budget);
      const v = Number.isFinite(a) && Number.isFinite(b) ? a - b : null;
      return { label: m.long, actual: a, budget: b, variance: v };
    });
    const anyData = rows.some((r) => r.actual !== null || r.budget !== null);
    return anyData ? rows : [];
  }, [fy]);

  const generateReport = async () => {
    setGenerating(true);
    const reportData = {
      title: reportTitle,
      generated: new Date().toISOString(),
      period: PERIOD_LABEL[periodForReport],
      financialYear: fyLabelLocal(fy.startYear, fy.startMonth),
      userName: userName || "User",
      sections: [], summary: null, actions: [],
      pipeline: null, concentration: null, campaigns: null,
    };

    const selectedTabList = tabs.filter(t => selectedTabs[t.id]);

    if (includeSummary) {
      const allKpis = selectedTabList.flatMap(t => t.categories.flatMap(c => c.kpis || []));
      const statusCounts = { green: 0, amber: 0, red: 0, none: 0 };
      allKpis.forEach(k => {
        const s = getStatusLocal(k, periodForReport, fy);
        statusCounts[s.key] = (statusCounts[s.key] || 0) + 1;
      });
      reportData.summary = { totalKpis: allKpis.length, statusCounts, tabs: selectedTabList.map(t => t.name) };
    }

    selectedTabList.forEach(tab => {
      const section = { name: tab.name, categories: [] };
      tab.categories.forEach(cat => {
        const catData = { name: cat.name, kpis: [], isPanel: !!cat.panel };
        if (cat.panel) return;
        (cat.kpis || []).forEach(k => {
          const v = periodValuesLocal(k, periodForReport, fy);
          const status = getStatusLocal(k, periodForReport, fy);
          const variance = getVarianceLocal(k, periodForReport, fy);
          catData.kpis.push({
            id: k.id, name: k.name, units: k.units, direction: k.direction,
            meaning: k.meaning, measured: k.measured,
            actual: v.actual, budget: v.budget, variance: variance,
            status: status.label, statusKey: status.key,
            benchmark: k.benchmark, notes: k.notes || "", source: k.source || "",
            breakdown: buildBreakdown(k),
          });
        });
        section.categories.push(catData);
      });
      reportData.sections.push(section);
    });

    if (includePipeline && pipelineRecords && pipelineRecords.length) {
      reportData.pipeline = pipelineRecords.map(r => ({
        tier: r.tier || "", accountWebsite: r.accountWebsite || "", sector: r.sector || "",
        revPotential: r.revPotential || 0, probability: r.probability || 0,
        nextCta: r.nextCta || "", byWhen: r.byWhen || "", keyContact: r.keyContact || "", notes: r.notes || "",
      }));
    }
    if (includeConcentration) {
      reportData.concentration = {
        channels: [
          { name: "Social Media", revenue: 1200000, percentage: 35.2 },
          { name: "PPC", revenue: 800000, percentage: 23.5 },
          { name: "Email", revenue: 500000, percentage: 14.7 },
        ],
        customers: [
          { name: "Acme Corp", revenue: 850000, percentage: 24.9 },
          { name: "TechGlobal", revenue: 650000, percentage: 19.0 },
          { name: "EcoSolutions", revenue: 450000, percentage: 13.2 },
        ],
        segments: [
          { name: "Enterprise", revenue: 1500000, percentage: 44.0 },
          { name: "SMB", revenue: 800000, percentage: 23.5 },
          { name: "Startup", revenue: 400000, percentage: 11.7 },
        ],
      };
    }
    if (includeCampaigns) {
      reportData.campaigns = [
        { name: "Q1 Campaign", cost: 25000, revenue: 45000 },
        { name: "Q2 Campaign", cost: 30000, revenue: 55000 },
        { name: "Summer Sale", cost: 15000, revenue: 35000 },
        { name: "Holiday Campaign", cost: 40000, revenue: 80000 },
      ];
    }
    if (includeActions) {
      const marketingActions = actions.filter(a =>
        a.sourceModule === "Marketing & Sales" || a.category === "Marketing & Sales" || a.sourceCategory?.includes("Marketing")
      );
      reportData.actions = marketingActions.map(a => ({
        title: a.title, description: a.description, status: a.status, dueDate: a.dueDate,
        assignedTo: a.assignedTo, category: a.category, sourceKpi: a.sourceKpi, meetingTitle: a.meetingTitle,
      }));
    }

    const htmlContent = generateWordHTML(reportData, includeCharts, includeAnalysis, includeBreakdown);
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

  const generateWordHTML = (data, includeCharts, includeAnalysis, includeBreakdown) => {
    const statusColor = (key) => key === "green" ? "#166534" : key === "amber" ? "#92400e" : key === "red" ? "#991b1b" : "#6b5b55";
    const statusBg = (key) => key === "green" ? "#f0fdf4" : key === "amber" ? "#fffbeb" : key === "red" ? "#fef2f2" : "#f2eeec";

    const fmtVal = (v, units) => {
      if (v === null || v === undefined || v === "") return "—";
      if (units === "%") return `${trimNumLocal(Number(v))}%`;
      if (units === "R") {
        const n = Number(v);
        if (Math.abs(n) >= 1_000_000) return `R ${(n / 1_000_000).toFixed(1)}m`;
        if (Math.abs(n) >= 1_000) return `R ${(n / 1_000).toFixed(1)}k`;
        return `R ${n.toFixed(0)}`;
      }
      if (units && !["#", "%", "R"].includes(units)) return `${trimNumLocal(Number(v))} ${units}`;
      return trimNumLocal(Number(v));
    };

    const isFav = (k, v) => {
      if (v === null) return null;
      if (k?.direction === "match") return Math.abs(v) < 0.001;
      return k?.direction === "higher" ? v >= 0 : v <= 0;
    };

    const kpiRows = (kpis) => {
      if (!kpis.length) return "";
      let html = `<table style="width:100%; border-collapse:collapse; font-size:10pt; margin:8px 0;">
        <thead><tr style="background:#33231e; color:#fff;">
          <th style="padding:6px 10px; text-align:left; border:1px solid #ddd;">KPI</th>
          <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Units</th>
          <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Target</th>
          <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Actual</th>
          <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Variance</th>
          <th style="padding:6px 10px; text-align:center; border:1px solid #ddd;">Status</th>
        </tr></thead><tbody>`;
      kpis.forEach((k, i) => {
        const bg = i % 2 === 0 ? "#ffffff" : "#faf8f7";
        const fav = isFav(k, k.variance);
        html += `<tr style="background:${bg};">
          <td style="padding:6px 10px; border:1px solid #ddd; font-weight:500;">${k.name}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">${k.units}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">${fmtVal(k.budget, k.units)}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center; font-weight:600;">${fmtVal(k.actual, k.units)}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center; color:${fav === null ? '#6b5b55' : fav ? '#166534' : '#991b1b'};">${k.variance !== null ? fmtVal(k.variance, k.units) : "—"}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">
            <span style="background:${statusBg(k.statusKey)}; color:${statusColor(k.statusKey)}; padding:2px 12px; border-radius:12px; font-weight:600; font-size:9pt;">${k.status}</span>
          </td></tr>`;
      });
      html += `</tbody></table>`;
      return html;
    };

    const breakdownTables = (kpis) => {
      if (!kpis.length) return "";
      let html = "";
      kpis.forEach(k => {
        if (!k.breakdown || !k.breakdown.length) return;
        html += `<h4 style="color:#4a352f; font-size:10pt; margin:14px 0 4px;">${k.name} — month-by-month detail (${k.breakdown.length} captured)</h4>`;
        html += `<table style="width:100%; border-collapse:collapse; font-size:9pt; margin:0 0 10px;">
          <thead><tr style="background:#f2eeec; color:#4a352f;">
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:left;">Month</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Target</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Actual</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Variance</th>
          </tr></thead><tbody>`;
        k.breakdown.forEach((row, ri) => {
          const bg = ri % 2 === 0 ? "#ffffff" : "#faf8f7";
          const fav = isFav(k, row.variance);
          html += `<tr style="background:${bg};">
            <td style="padding:4px 8px; border:1px solid #ddd;">${row.label}</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${fmtVal(row.budget, k.units)}</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center; font-weight:600;">${fmtVal(row.actual, k.units)}</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center; color:${fav === null ? '#6b5b55' : fav ? '#166534' : '#991b1b'};">${row.variance !== null ? fmtVal(row.variance, k.units) : "—"}</td>
          </tr>`;
        });
        html += `</tbody></table>`;
      });
      return html;
    };

    let sectionsHtml = "";
    data.sections.forEach(section => {
      sectionsHtml += `<h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">${section.name}</h2>`;
      section.categories.forEach(cat => {
        if (cat.kpis.length) {
          sectionsHtml += `<h3 style="color:#4a352f; font-size:12pt; margin:12px 0 6px;">${cat.name}</h3>
            ${kpiRows(cat.kpis)}
            ${includeBreakdown ? breakdownTables(cat.kpis) : ""}`;
        }
      });
    });

    let pipelineHtml = "";
    if (data.pipeline && data.pipeline.length) {
      let pipeRows = "";
      data.pipeline.slice(0, 20).forEach((item, i) => {
        const bg = i % 2 === 0 ? "#ffffff" : "#faf8f7";
        pipeRows += `<tr style="background:${bg};">
          <td style="padding:4px 8px; border:1px solid #ddd;">${item.tier || "—"}</td>
          <td style="padding:4px 8px; border:1px solid #ddd;">${item.accountWebsite || "—"}</td>
          <td style="padding:4px 8px; border:1px solid #ddd;">${item.sector || "—"}</td>
          <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${item.revPotential ? fmtVal(item.revPotential, "R") : "—"}</td>
          <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${item.probability || 0}%</td>
          <td style="padding:4px 8px; border:1px solid #ddd;">${item.nextCta || "—"}</td>
        </tr>`;
      });
      pipelineHtml = `<h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">Pipeline Visibility</h2>
        <p style="font-size:10pt; color:#6b5b55;">${data.pipeline.length} opportunities in pipeline</p>
        <table style="width:100%; border-collapse:collapse; font-size:9pt; margin:8px 0;">
          <thead><tr style="background:#33231e; color:#fff;">
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:left;">Tier</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:left;">Account</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:left;">Sector</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Rev Potential</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Probability</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:left;">Next CTA</th>
          </tr></thead><tbody>${pipeRows}</tbody></table>`;
    }

    let concentrationHtml = "";
    if (data.concentration) {
      const c = data.concentration;
      const buildTable = (items, nameLabel, title) => {
        let rows = "";
        items.forEach((item, i) => {
          const bg = i % 2 === 0 ? "#ffffff" : "#faf8f7";
          rows += `<tr style="background:${bg};">
            <td style="padding:4px 8px; border:1px solid #ddd;">${item.name}</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${fmtVal(item.revenue, "R")}</td>
            <td style="padding:4px 8px; border:1px solid #ddd; text-align:center; font-weight:600;">${item.percentage}%</td>
          </tr>`;
        });
        return `<div>
          <h4 style="color:#4a352f; font-size:11pt; margin:8px 0;">${title}</h4>
          <table style="width:100%; border-collapse:collapse; font-size:9pt;">
            <thead><tr style="background:#33231e; color:#fff;">
              <th style="padding:4px 8px; border:1px solid #ddd; text-align:left;">${nameLabel}</th>
              <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Revenue</th>
              <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">%</th>
            </tr></thead><tbody>${rows}</tbody>
          </table>
        </div>`;
      };
      concentrationHtml = `<h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">Revenue Concentration</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px;">
          ${buildTable(c.channels, "Channel", "Top 3 Channels")}
          ${buildTable(c.customers, "Customer", "Top 3 Customers")}
          ${buildTable(c.segments, "Segment", "Top 3 Segments")}
        </div>`;
    }

    let campaignsHtml = "";
    if (data.campaigns && data.campaigns.length) {
      let campRows = "";
      data.campaigns.forEach((item, i) => {
        const bg = i % 2 === 0 ? "#ffffff" : "#faf8f7";
        const roi = item.cost > 0 ? ((item.revenue - item.cost) / item.cost * 100) : 0;
        campRows += `<tr style="background:${bg};">
          <td style="padding:4px 8px; border:1px solid #ddd; font-weight:500;">${item.name}</td>
          <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${fmtVal(item.cost, "R")}</td>
          <td style="padding:4px 8px; border:1px solid #ddd; text-align:center;">${fmtVal(item.revenue, "R")}</td>
          <td style="padding:4px 8px; border:1px solid #ddd; text-align:center; color:${roi >= 0 ? '#166534' : '#991b1b'}; font-weight:600;">${roi.toFixed(1)}%</td>
        </tr>`;
      });
      campaignsHtml = `<h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">Campaign Performance</h2>
        <table style="width:100%; border-collapse:collapse; font-size:9pt; margin:8px 0;">
          <thead><tr style="background:#33231e; color:#fff;">
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:left;">Campaign</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Cost</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">Revenue</th>
            <th style="padding:4px 8px; border:1px solid #ddd; text-align:center;">ROI %</th>
          </tr></thead><tbody>${campRows}</tbody></table>`;
    }

    let analysisHtml = "";
    if (includeAnalysis) {
      analysisHtml = `<h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">Analysis & Observations</h2>
        <div style="font-size:10pt; line-height:1.6;">`;
      data.sections.forEach(section => {
        section.categories.forEach(cat => {
          cat.kpis.forEach(k => {
            if (k.statusKey === "red" || k.statusKey === "amber") {
              analysisHtml += `<div style="background:${statusBg(k.statusKey)}; padding:8px 12px; margin:6px 0; border-radius:4px; border-left:3px solid ${statusColor(k.statusKey)};">
                <strong>${k.name}</strong> — ${k.status}
                ${k.variance !== null ? ` (${k.variance >= 0 ? "+" : ""}${fmtVal(k.variance, k.units)})` : ""}
                ${k.notes ? `<br><span style="color:#6b5b55; font-size:9pt;">Note: ${k.notes}</span>` : ""}
              </div>`;
            }
          });
        });
      });
      const allKpis = data.sections.flatMap(s => s.categories.flatMap(c => c.kpis || []));
      const reds = allKpis.filter(k => k.statusKey === "red");
      const ambers = allKpis.filter(k => k.statusKey === "amber");
      const greens = allKpis.filter(k => k.statusKey === "green");
      let pipelineSummary = "";
      if (data.pipeline && data.pipeline.length) {
        const totalPipelineValue = data.pipeline.reduce((sum, p) => sum + (p.revPotential || 0), 0);
        const avgProbability = data.pipeline.reduce((sum, p) => sum + (p.probability || 0), 0) / data.pipeline.length;
        pipelineSummary = `<div style="background:#faf8f7; padding:8px 12px; margin:6px 0; border-radius:4px;">
          <strong>Pipeline Summary:</strong> ${data.pipeline.length} opportunities · Total value: ${fmtVal(totalPipelineValue, "R")} · Avg probability: ${avgProbability.toFixed(1)}%
        </div>`;
      }
      analysisHtml += `<div style="background:#faf8f7; padding:12px 16px; margin:12px 0; border-radius:6px;">
        <p><strong>KPI Summary:</strong> ${greens.length} on target · ${ambers.length} needs attention · ${reds.length} critical</p>
        ${reds.length ? `<p style="color:#991b1b;"><strong>Critical items:</strong> ${reds.map(k => k.name).join(", ")}</p>` : ""}
        ${ambers.length ? `<p style="color:#92400e;"><strong>Needs attention:</strong> ${ambers.map(k => k.name).join(", ")}</p>` : ""}
        ${pipelineSummary}
      </div></div>`;
    }

    let actionsHtml = "";
    if (includeActions && data.actions.length) {
      let actionRows = "";
      data.actions.forEach(a => {
        const statusColors = { "Done": "#166534", "In Progress": "#92400e", "Not Done": "#991b1b" };
        const color = statusColors[a.status] || "#6b5b55";
        actionRows += `<tr>
          <td style="padding:6px 10px; border:1px solid #ddd;">${a.title}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; font-size:9pt;">${a.description || "—"}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">${a.assignedTo || "—"}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">${a.dueDate || "—"}</td>
          <td style="padding:6px 10px; border:1px solid #ddd; text-align:center; color:${color}; font-weight:600;">${a.status}</td>
        </tr>`;
      });
      actionsHtml = `<h2 style="color:#4a352f; border-bottom:2px solid #ded8d4; padding-bottom:6px; margin-top:24px;">Actions</h2>
        <p style="font-size:10pt; color:#6b5b55;">${data.actions.length} actions related to Marketing & Sales</p>
        <table style="width:100%; border-collapse:collapse; font-size:9pt; margin:8px 0;">
          <thead><tr style="background:#33231e; color:#fff;">
            <th style="padding:6px 10px; border:1px solid #ddd; text-align:left;">Action</th>
            <th style="padding:6px 10px; border:1px solid #ddd; text-align:left;">Description</th>
            <th style="padding:6px 10px; border:1px solid #ddd; text-align:center;">Owner</th>
            <th style="padding:6px 10px; border:1px solid #ddd; text-align:center;">Due Date</th>
            <th style="padding:6px 10px; border:1px solid #ddd; text-align:center;">Status</th>
          </tr></thead><tbody>${actionRows}</tbody></table>`;
    }

    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>${data.title}</title>
        <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #2d201c; }
          h1 { color: #2d201c; font-size: 22pt; font-weight: 600; margin-bottom: 4px; }
          .subtitle { color: #6b5b55; font-size: 11pt; margin-bottom: 24px; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          @page { margin: 2cm; }
        </style>
      </head><body>
        <h1>${data.title}</h1>
        <div class="subtitle">
          Generated ${new Date(data.generated).toLocaleDateString()} · ${data.period} · FY ${data.financialYear}<br>${data.userName}
        </div>
        ${data.summary ? `<div style="background:#faf8f7; padding:12px 16px; border-radius:6px; margin-bottom:16px;">
          <p style="font-size:11pt; margin:0;"><strong>${data.summary.totalKpis} KPIs</strong> across ${data.summary.tabs.length} sections
          · ${data.summary.statusCounts.green} on target · ${data.summary.statusCounts.amber} needs attention · ${data.summary.statusCounts.red} critical</p>
        </div>` : ""}
        ${sectionsHtml}${pipelineHtml}${concentrationHtml}${campaignsHtml}${analysisHtml}${actionsHtml}
        <p style="color:#8a7a74; font-size:8pt; text-align:center; margin-top:40px; border-top:1px solid #ded8d4; padding-top:16px;">
          Marketing & Sales Performance Report · Generated from RAPS Platform
        </p>
      </body></html>`;
  };

  return (
    <Modal title="Generate Marketing & Sales Report" subtitle="Select what to include in the Word document" icon={<FileText size={17} />} onClose={onClose} width={680}
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
          <label style={labelS}>Period (summary rollup)</label>
          <Select value={periodForReport} onChange={(e) => setPeriodForReport(e.target.value)}>
            {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </Select>
        </div>
        <div>
          <label style={labelS}>Financial Year</label>
          <div style={{ padding: "9px 11px", background: T.panel, border: `1px solid ${T.lineStrong}`, borderRadius: "8px", fontSize: "13.5px", color: T.body }}>
            FY {fyLabelLocal(fy.startYear, fy.startMonth)}
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
          {[
            [includeSummary, setIncludeSummary, "Summary header"],
            [includeCharts, setIncludeCharts, "Charts (static view)"],
            [includeBreakdown, setIncludeBreakdown, "Month-by-month detail"],
            [includeAnalysis, setIncludeAnalysis, "Analysis & observations"],
            [includePipeline, setIncludePipeline, "Pipeline opportunities"],
            [includeConcentration, setIncludeConcentration, "Revenue concentration"],
            [includeCampaigns, setIncludeCampaigns, "Campaign performance"],
            [includeActions, setIncludeActions, "Actions"],
          ].map(([val, setter, label]) => (
            <label key={label} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: T.body, cursor: "pointer", padding: "4px 0" }}>
              <input type="checkbox" checked={val} onChange={() => setter(!val)} />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div style={{ ...cardS, background: T.panel, fontSize: "12.5px", color: T.body }}>
        <Info size={14} color={T.accentSoft} style={{ marginRight: "8px" }} />
        The report will be generated as a Word document (.doc) that can be opened in Microsoft Word, Google Docs, or LibreOffice.
        {includeBreakdown && " The detail section shows every captured month — not the rolled-up figure."}
      </div>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Pipeline & panels
   ════════════════════════════════════════════════════════════════════════ */
const AVAILABLE_FIELDS = [
  { id: "tier", label: "Tier Category", type: "dropdown", options: ["Core anchor", "Land & expand", "Flagship", "Coopetition", "Capital corridor", "Provincial Multiplier"] },
  { id: "accountWebsite", label: "Account Website", type: "text" },
  { id: "targetCategory", label: "Target Category", type: "dropdown", options: ["Strategic", "Tactical", "Operational"] },
  { id: "sector", label: "Sector", type: "dropdown", options: ["Generalist", "Agriculture", "Automotive", "Banking, Finance & Insurance", "Construction", "Consulting", "Education & Training", "Engineering", "Government / Public Sector", "Healthcare / Medical", "Hospitality / Tourism", "Information Technology (IT)", "Legal / Law", "Logistics / Supply Chain", "Manufacturing", "Marketing / Advertising / PR", "Mining", "Non-Profit / NGO", "Property / Real Estate", "Retail / Wholesale", "Telecommunications", "Utilities (Water, Electricity, Waste)"] },
  { id: "publicPrivate", label: "Public / Private", type: "dropdown", options: ["Public", "Private"] },
  { id: "channel", label: "Channel", type: "dropdown", options: ["Direct", "Partner", "Reseller", "Online", "Referral"] },
  { id: "bigHook", label: "BIG Hook", type: "text" },
  { id: "revPotential", label: "Rev potential", type: "currency" },
  { id: "fyEnd", label: "FY End", type: "text" },
  { id: "strategicSignal", label: "Strategic Signal", type: "dropdown", options: ["High", "Medium", "Low"] },
  { id: "targetModel", label: "Target Model", type: "dropdown", options: ["ICP", "Lookalike", "Niche", "Mass Market"] },
  { id: "compliance", label: "Compliance", type: "boolean" },
  { id: "esd", label: "ESD (incl compliance, intelligence)", type: "boolean" },
  { id: "prevettedSupplyChain", label: "Prevetted Supply Chain Pipeline", type: "boolean" },
  { id: "prevettedFunding", label: "Prevetted Funding Pipeline", type: "boolean" },
  { id: "postInvestmentSupport", label: "Post-Investment Support (Growth Suite)", type: "boolean" },
  { id: "portfolioIntelligence", label: "Portfolio Intelligence", type: "boolean" },
  { id: "marketIntelligence", label: "Market Intelligence", type: "boolean" },
  { id: "internSponsorship", label: "InTern Sponsorship", type: "boolean" },
  { id: "likelyBuyer", label: "Likely Buyer", type: "text" },
  { id: "keyContact", label: "Key Contact (Name & Surname)", type: "text" },
  { id: "keyContactRole", label: "Key Contact Role & Department", type: "text" },
  { id: "keyContactEmail", label: "Key Contact email", type: "text" },
  { id: "keyContactPhone", label: "Key Contact Phone", type: "text" },
  { id: "warmIntroPath", label: "Warm Intro Path", type: "text" },
  { id: "lastEngagement", label: "Last Engagement", type: "date" },
  { id: "probability", label: "Probability %", type: "number" },
  { id: "nextCta", label: "Next CTA", type: "text" },
  { id: "byWhom", label: "By Whom", type: "text" },
  { id: "byWhen", label: "By When", type: "date" },
  { id: "notes", label: "Notes", type: "text" },
  { id: "signedDate", label: "Signed Date", type: "date" },
];

const DEFAULT_VISIBLE_FIELDS = ["tier", "accountWebsite", "sector", "revPotential", "probability", "nextCta", "byWhen"];

const PipelineTable = ({ currentUser, isInvestorView, onDataChange, onEditFromDashboard }) => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleFields, setVisibleFields] = useState(DEFAULT_VISIBLE_FIELDS);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [filters, setFilters] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [widths, setWidths] = useState(() => Object.fromEntries(AVAILABLE_FIELDS.map((f) => [f.id, 150])));
  const [colOrder, setColOrder] = useState(DEFAULT_VISIBLE_FIELDS);

  useEffect(() => {
    setColOrder((prev) => {
      const kept = prev.filter((f) => visibleFields.includes(f));
      const added = visibleFields.filter((f) => !kept.includes(f));
      return [...kept, ...added];
    });
  }, [visibleFields]);

  const loadRecords = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const recordsRef = collection(db, "users", currentUser.uid, "pipelineRecords");
      const querySnapshot = await getDocs(recordsRef);
      const recordsData = [];
      querySnapshot.forEach((d) => recordsData.push({ id: d.id, ...d.data() }));
      setRecords(recordsData);
      setFilteredRecords(recordsData);
      if (onDataChange) onDataChange(recordsData);
    } catch (error) { console.error("Error loading records:", error); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (currentUser) loadRecords(); }, [currentUser]);

  useEffect(() => {
    let filtered = [...records];
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        filtered = filtered.filter((record) => {
          const recordValue = record[key];
          if (recordValue === undefined || recordValue === null) return false;
          return String(recordValue) === value;
        });
      }
    });
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const av = a[sortConfig.key] ?? "";
        const bv = b[sortConfig.key] ?? "";
        if (typeof av === "number" && typeof bv === "number") return sortConfig.direction === "asc" ? av - bv : bv - av;
        return sortConfig.direction === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    setFilteredRecords(filtered);
  }, [filters, records, sortConfig]);

  const handleAddRecord = async () => {
    if (!currentUser) return;
    const newRecord = {};
    AVAILABLE_FIELDS.forEach((field) => {
      if (field.type === "boolean") newRecord[field.id] = false;
      else if (field.type === "currency" || field.type === "number") newRecord[field.id] = 0;
      else newRecord[field.id] = "";
    });
    newRecord.createdAt = new Date().toISOString();
    try {
      const recordsRef = collection(db, "users", currentUser.uid, "pipelineRecords");
      const docRef = await addDoc(recordsRef, newRecord);
      const updated = [{ id: docRef.id, ...newRecord }, ...records];
      setRecords(updated);
      if (onDataChange) onDataChange(updated);
      setEditingId(docRef.id);
      setEditData({ ...newRecord });
    } catch (error) { console.error("Error adding record:", error); alert("Failed to add record"); }
  };

  const handleSaveEdit = async () => {
    if (!currentUser || !editingId) return;
    try {
      const recordRef = doc(db, "users", currentUser.uid, "pipelineRecords", editingId);
      await updateDoc(recordRef, editData);
      const updated = records.map((r) => r.id === editingId ? { ...r, ...editData } : r);
      setRecords(updated);
      if (onDataChange) onDataChange(updated);
      setEditingId(null); setEditData({});
    } catch (error) { console.error("Error saving record:", error); alert("Failed to save changes"); }
  };

  const handleCancelEdit = () => { setEditingId(null); setEditData({}); };
  const handleDeleteRecord = async (id) => {
    if (!currentUser) return;
    try {
      const recordRef = doc(db, "users", currentUser.uid, "pipelineRecords", id);
      await deleteDoc(recordRef);
      const updated = records.filter((r) => r.id !== id);
      setRecords(updated);
      if (onDataChange) onDataChange(updated);
      setShowDeleteConfirm(null);
    } catch (error) { console.error("Error deleting record:", error); alert("Failed to delete record"); }
  };

  const handleEditChange = (fieldId, value) => setEditData({ ...editData, [fieldId]: value });

  const toggleField = (fieldId) => {
    if (visibleFields.includes(fieldId)) setVisibleFields(visibleFields.filter((f) => f !== fieldId));
    else setVisibleFields([...visibleFields, fieldId]);
  };

  const getFieldConfig = (fieldId) => AVAILABLE_FIELDS.find((f) => f.id === fieldId);
  const getFilterOptions = (fieldId) => {
    const values = records.map((r) => r[fieldId]).filter((v) => v !== undefined && v !== null && v !== "");
    const unique = Array.from(new Set(values.map((v) => String(v)))).sort();
    return ["All", ...unique];
  };

  const handleDragStart = (e, key) => { e.dataTransfer.setData("text/plain", key); e.dataTransfer.effectAllowed = "move"; };
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
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX, startWidth = widths[key];
    const onMove = (ev) => setWidths((p) => ({ ...p, [key]: Math.max(80, startWidth + (ev.clientX - startX)) }));
    const onUp = () => {
      document.body.style.cursor = ""; document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp);
    };
    document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };

  const toggleSort = (key) => setSortConfig((p) => ({ key, direction: p.key === key && p.direction === "asc" ? "desc" : "asc" }));

  const thS = {
    padding: 0, background: T.header, borderBottom: `2px solid ${T.header}`,
    borderRight: "1px solid rgba(255,255,255,0.14)", position: "relative", verticalAlign: "top",
  };

  const BooleanCell = ({ value, onChange, isEditing }) => {
    if (isEditing) {
      return (
        <Select value={value ? "yes" : "no"} onChange={(e) => onChange(e.target.value === "yes")} style={{ padding: "4px 24px 4px 6px", fontSize: "12px" }}>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </Select>
      );
    }
    return <span style={{ fontSize: "13px", fontWeight: 500, color: value ? T.green : T.red }}>{value ? "✓ Yes" : "✗ No"}</span>;
  };

  const DropdownCell = ({ value, options, onChange, isEditing }) => {
    if (isEditing) {
      return (
        <Select value={value || ""} onChange={(e) => onChange(e.target.value)} style={{ padding: "4px 24px 4px 6px", fontSize: "12px" }}>
          <option value="">Select...</option>
          {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </Select>
      );
    }
    return <span style={{ fontSize: "13px", color: T.body }}>{value || "-"}</span>;
  };

  const TextCell = ({ value, onChange, isEditing, type }) => {
    if (isEditing) {
      if (type === "currency" || type === "number") {
        return <input type="number" step="0.01" value={value || ""} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} style={{ ...inputS, padding: "4px 6px", fontSize: "12px" }} />;
      }
      if (type === "date") {
        return <input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} style={{ ...inputS, padding: "4px 6px", fontSize: "12px" }} />;
      }
      return <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} style={{ ...inputS, padding: "4px 6px", fontSize: "12px" }} />;
    }
    if (type === "currency") return <span style={{ fontSize: "13px", color: T.body }}>{value ? `R ${Number(value).toLocaleString()}` : "-"}</span>;
    return <span style={{ fontSize: "13px", color: T.body }}>{value || "-"}</span>;
  };

  const renderCell = (record, fieldId, isEditing) => {
    const fieldConfig = getFieldConfig(fieldId);
    if (!fieldConfig) return null;
    const value = isEditing ? editData[fieldId] : record[fieldId];
    if (fieldConfig.type === "boolean") return <BooleanCell value={value} onChange={(v) => handleEditChange(fieldId, v)} isEditing={isEditing} />;
    if (fieldConfig.type === "dropdown") return <DropdownCell value={value} options={fieldConfig.options} onChange={(v) => handleEditChange(fieldId, v)} isEditing={isEditing} />;
    return <TextCell value={value} onChange={(v) => handleEditChange(fieldId, v)} isEditing={isEditing} type={fieldConfig.type} />;
  };

  return (
    <div style={{ marginTop: "20px" }}>
      {showColumnSelector && (
        <div onClick={() => setShowColumnSelector(false)} style={{ position: "fixed", inset: 0, background: "rgba(45,32,28,0.55)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1400, padding: "20px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.bg, borderRadius: "14px", padding: "20px", maxWidth: "600px", width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: T.accent, fontWeight: 600 }}>Select Columns to Display</h3>
              <button onClick={() => setShowColumnSelector(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.body }}><X size={20} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {AVAILABLE_FIELDS.map((field) => (
                <label key={field.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: T.body, cursor: "pointer" }}>
                  <input type="checkbox" checked={visibleFields.includes(field.id)} onChange={() => toggleField(field.id)} />
                  {field.label}
                </label>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button onClick={() => setShowColumnSelector(false)} style={btnPrimary}>Done</button>
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div onClick={() => setShowDeleteConfirm(null)} style={{ position: "fixed", inset: 0, background: "rgba(45,32,28,0.55)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1400, padding: "20px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.bg, borderRadius: "14px", padding: "20px", maxWidth: "400px", width: "100%" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "16px", color: T.accent }}>Confirm Delete</h3>
            <p style={{ color: T.body, marginBottom: "16px", fontSize: "13px" }}>Are you sure you want to delete this record? This action cannot be undone.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={btnGhost}>Cancel</button>
              <button onClick={() => handleDeleteRecord(showDeleteConfirm)} style={{ ...btnPrimary, background: T.red, borderColor: T.red }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {!isInvestorView && (
            <button onClick={handleAddRecord} style={btnPrimary}><Plus size={14} /> Add Record</button>
          )}
          <button onClick={() => setShowColumnSelector(true)} style={btnGhost}><Settings size={14} /> Columns</button>
          {!isInvestorView && onEditFromDashboard && (
            <button onClick={onEditFromDashboard} style={btnGhost}><Pencil size={14} /> Edit from Dashboard</button>
          )}
        </div>
      </div>

      <div style={{ overflowX: "auto", background: T.bg, borderRadius: "10px", border: `1px solid ${T.lineStrong}` }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed" }}>
          <thead>
            <tr>
              {colOrder.map((fieldId) => {
                const fieldConfig = getFieldConfig(fieldId);
                const sorted = sortConfig.key === fieldId;
                const currentFilter = filters[fieldId] || "All";
                const filterOpts = getFilterOptions(fieldId);
                return (
                  <th key={fieldId} draggable onDragStart={(e) => handleDragStart(e, fieldId)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, fieldId)}
                    style={{ ...thS, width: widths[fieldId] || 150, userSelect: "none" }}>
                    <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "100%" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap", color: "#fff", cursor: "grab" }}>{fieldConfig?.label || fieldId}</span>
                        <InfoTip text={fieldConfig?.label} light />
                        <button onClick={() => toggleSort(fieldId)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: sorted ? "#fff" : "rgba(255,255,255,0.6)" }}>
                          {sorted ? (sortConfig.direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                        </button>
                        <FilterDropdown options={filterOpts} value={currentFilter} onChange={(val) => setFilters((p) => ({ ...p, [fieldId]: val === "All" ? "" : val }))} onClose={() => {}} />
                      </div>
                    </div>
                    <div onMouseDown={(e) => startResize(e, fieldId)} style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                  </th>
                );
              })}
              {!isInvestorView && (
                <th style={{ ...thS, width: 100, borderRight: "none" }}>
                  <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>Actions</span>
                    <div style={{ height: "20px" }} />
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr><td colSpan={colOrder.length + (isInvestorView ? 0 : 1)} style={{ padding: "30px", textAlign: "center", color: T.muted, fontSize: "13px" }}>
                {loading ? "Loading..." : "No records found. Click 'Add Record' to get started."}
              </td></tr>
            ) : filteredRecords.map((record, idx) => (
              <tr key={record.id} style={{ borderBottom: `1px solid ${T.lineSoft}`, background: idx % 2 === 0 ? T.bg : T.panel }}>
                {colOrder.map((fieldId) => (
                  <td key={fieldId} style={{ padding: "10px", verticalAlign: "middle" }}>{renderCell(record, fieldId, editingId === record.id)}</td>
                ))}
                {!isInvestorView && (
                  <td style={{ padding: "10px", textAlign: "center", whiteSpace: "nowrap" }}>
                    {editingId === record.id ? (
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <button onClick={handleSaveEdit} style={{ ...btnPrimary, padding: "4px 8px" }}><Check size={14} /></button>
                        <button onClick={handleCancelEdit} style={{ ...btnGhost, padding: "4px 8px" }}><X size={14} /></button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <button onClick={() => { setEditingId(record.id); setEditData({ ...record }); }} style={{ ...btnGhost, padding: "4px 8px" }} title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => setShowDeleteConfirm(record.id)} style={{ ...btnGhost, padding: "4px 8px", color: T.red }} title="Delete"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: "12px", background: T.raised, padding: "10px 14px", borderRadius: "8px", fontSize: "12.5px", color: T.body }}>
        Showing {filteredRecords.length} of {records.length} records
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   Top 3 Concentration (with per-row Edit/Delete)
   ──────────────────────────────────────────────────────────────────────── */
const Top3Concentration = ({ data, isInvestorView, onDataChange, onUpdate, onDeleteItem }) => {
  const [localData, setLocalData] = useState(data || {
    channels: [
      { name: "Social Media", revenue: 1200000, percentage: 35.2 },
      { name: "PPC", revenue: 800000, percentage: 23.5 },
      { name: "Email", revenue: 500000, percentage: 14.7 },
    ],
    customers: [
      { name: "Acme Corp", revenue: 850000, percentage: 24.9 },
      { name: "TechGlobal", revenue: 650000, percentage: 19.0 },
      { name: "EcoSolutions", revenue: 450000, percentage: 13.2 },
    ],
    segments: [
      { name: "Enterprise", revenue: 1500000, percentage: 44.0 },
      { name: "SMB", revenue: 800000, percentage: 23.5 },
      { name: "Startup", revenue: 400000, percentage: 11.7 },
    ],
  });
  const [editingKey, setEditingKey] = useState(null); // "group:idx"
  const [editDraft, setEditDraft] = useState({});

  useEffect(() => { if (data) setLocalData(data); }, [data]);

  const startEdit = (group, idx, item) => {
    setEditingKey(`${group}:${idx}`);
    setEditDraft({ ...item });
  };
  const cancelEdit = () => { setEditingKey(null); setEditDraft({}); };
  const saveEdit = (group, idx) => {
    setLocalData(prev => {
      const next = { ...prev, [group]: [...(prev[group] || [])] };
      next[group][idx] = { ...editDraft };
      // Recalculate all percentages within the group
      const total = next[group].reduce((s, x) => s + (Number(x.revenue) || 0), 0);
      next[group] = next[group].map(x => ({
        ...x,
        percentage: total > 0 ? Number(((Number(x.revenue) || 0) / total * 100).toFixed(1)) : 0,
      }));
      if (onUpdate) onUpdate("top3", next);
      return next;
    });
    setEditingKey(null);
    setEditDraft({});
  };
  const deleteItem = (group, idx) => {
    if (!window.confirm("Remove this row?")) return;
    setLocalData(prev => {
      const next = { ...prev, [group]: [...(prev[group] || [])] };
      next[group].splice(idx, 1);
      const total = next[group].reduce((s, x) => s + (Number(x.revenue) || 0), 0);
      next[group] = next[group].map(x => ({
        ...x,
        percentage: total > 0 ? Number(((Number(x.revenue) || 0) / total * 100).toFixed(1)) : 0,
      }));
      if (onDeleteItem) onDeleteItem("top3", next);
      return next;
    });
  };

  const renderTable = (groupKey, title) => {
    const items = localData[groupKey] || [];
    return (
      <div>
        <h4 style={{ color: T.body, fontSize: "13px", marginBottom: "10px", fontWeight: 600 }}>{title}</h4>
        <div style={{ border: `1px solid ${T.lineSoft}`, borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: T.header }}>
              <th style={{ padding: "8px 12px", color: "#fff", fontSize: "11px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "8px 12px", color: "#fff", fontSize: "11px", textAlign: "right" }}>Revenue</th>
              <th style={{ padding: "8px 12px", color: "#fff", fontSize: "11px", textAlign: "right" }}>%</th>
              {!isInvestorView && (
                <th style={{ padding: "8px 12px", color: "#fff", fontSize: "11px", textAlign: "center", width: 90 }}>Actions</th>
              )}
            </tr></thead>
            <tbody>
              {items.map((item, i) => {
                const key = `${groupKey}:${i}`;
                const editing = editingKey === key;
                return (
                  <tr key={key} style={{ borderBottom: `1px solid ${T.lineSoft}`, background: i % 2 ? T.panel : T.bg }}>
                    <td style={{ padding: "6px 12px", fontSize: "13px", color: T.body }}>
                      {editing ? (
                        <input value={editDraft.name || ""} onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                          style={{ ...inputS, padding: "4px 6px", fontSize: "12px" }} />
                      ) : (item.name || "—")}
                    </td>
                    <td style={{ padding: "6px 12px", fontSize: "13px", color: T.body, textAlign: "right" }}>
                      {editing ? (
                        <input type="number" value={editDraft.revenue ?? 0} onChange={e => setEditDraft(d => ({ ...d, revenue: Number(e.target.value) || 0 }))}
                          style={{ ...inputS, padding: "4px 6px", fontSize: "12px", textAlign: "right" }} />
                      ) : (`R ${Number(item.revenue || 0).toLocaleString()}`)}
                    </td>
                    <td style={{ padding: "6px 12px", fontSize: "13px", color: T.body, textAlign: "right" }}>
                      {editing ? (
                        <input type="number" step="0.1" value={editDraft.percentage ?? 0} onChange={e => setEditDraft(d => ({ ...d, percentage: Number(e.target.value) || 0 }))}
                          style={{ ...inputS, padding: "4px 6px", fontSize: "12px", textAlign: "right" }} />
                      ) : (`${item.percentage ?? 0}%`)}
                    </td>
                    {!isInvestorView && (
                      <td style={{ padding: "6px 12px", textAlign: "center", whiteSpace: "nowrap" }}>
                        {editing ? (
                          <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                            <button onClick={() => saveEdit(groupKey, i)} style={{ ...btnPrimary, padding: "3px 7px" }} title="Save"><Check size={13} /></button>
                            <button onClick={cancelEdit} style={{ ...btnGhost, padding: "3px 7px" }} title="Cancel"><X size={13} /></button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                            <button onClick={() => startEdit(groupKey, i, item)} style={{ ...btnGhost, padding: "3px 7px" }} title="Edit"><Pencil size={13} /></button>
                            <button onClick={() => deleteItem(groupKey, i)} style={{ ...btnGhost, padding: "3px 7px", color: T.red }} title="Delete"><Trash2 size={13} /></button>
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
      </div>
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
      {renderTable("channels", "Top 3 Channels")}
      {renderTable("customers", "Top 3 Customers")}
      {renderTable("segments", "Top 3 Segments")}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   Channel Performance Table (with Actions column)
   ──────────────────────────────────────────────────────────────────────── */
const ChannelPerformanceTable = ({ data, isInvestorView, onDataChange, onUpdate, onDeleteItem }) => {
  const [localData, setLocalData] = useState(data || [
    { name: "Social Media", revenue: 150000, spend: 45000 },
    { name: "Email", revenue: 120000, spend: 30000 },
    { name: "PPC", revenue: 80000, spend: 35000 },
    { name: "SEO", revenue: 60000, spend: 15000 },
    { name: "Referral", revenue: 50000, spend: 10000 },
    { name: "Direct", revenue: 40000, spend: 5000 },
  ]);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filteredData, setFilteredData] = useState(localData);
  const [widths, setWidths] = useState(() => ({ name: 200, revenue: 150, spend: 150, net: 120, roi: 120, pct: 120, actions: 100 }));
  const [colOrder, setColOrder] = useState(["name", "revenue", "spend", "net", "roi", "pct"]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  useEffect(() => { if (data) setLocalData(data); }, [data]);

  useEffect(() => {
    let filtered = [...localData];
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        filtered = filtered.filter((item) => {
          const itemVal = item[key];
          if (itemVal === undefined || itemVal === null) return false;
          return String(itemVal) === value;
        });
      }
    });
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const av = a[sortConfig.key] ?? "";
        const bv = b[sortConfig.key] ?? "";
        if (typeof av === "number" && typeof bv === "number") return sortConfig.direction === "asc" ? av - bv : bv - av;
        return sortConfig.direction === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    setFilteredData(filtered);
  }, [filters, sortConfig, localData]);

  const getFilterOptions = (key) => {
    const values = localData.map((item) => item[key]).filter((v) => v !== undefined && v !== null && v !== "");
    return ["All", ...Array.from(new Set(values.map((v) => String(v)))).sort()];
  };
  const toggleSort = (key) => setSortConfig((p) => ({ key, direction: p.key === key && p.direction === "asc" ? "desc" : "asc" }));
  const thS = { padding: 0, background: T.header, borderBottom: `2px solid ${T.header}`, borderRight: "1px solid rgba(255,255,255,0.14)", position: "relative", verticalAlign: "top" };
  const labels = { name: "Channel", revenue: "Revenue", spend: "Marketing Spend", net: "Net Profit", roi: "ROI %", pct: "% of Revenue" };
  const totalRevenue = localData.reduce((s, i) => s + i.revenue, 0);

  const startEdit = (idx, item) => { setEditingIdx(idx); setEditDraft({ ...item }); };
  const cancelEdit = () => { setEditingIdx(null); setEditDraft({}); };
  const saveEdit = (idx) => {
    setLocalData(prev => {
      const next = [...prev];
      next[idx] = { ...editDraft };
      if (onUpdate) onUpdate("channelPerf", next);
      return next;
    });
    setEditingIdx(null); setEditDraft({});
  };
  const deleteItem = (idx) => {
    if (!window.confirm("Remove this channel?")) return;
    setLocalData(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (onDeleteItem) onDeleteItem("channelPerf", next);
      return next;
    });
  };

  return (
    <div style={{ overflowX: "auto", border: `1px solid ${T.lineStrong}`, borderRadius: "10px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead><tr>
          {colOrder.map((key) => {
            const sorted = sortConfig.key === key;
            const currentFilter = filters[key] || "All";
            return (
              <th key={key} style={{ ...thS, width: widths[key] || 150 }}>
                <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>{labels[key] || key}</span>
                  <button onClick={() => toggleSort(key)} style={{ background: "none", border: "none", cursor: "pointer", color: sorted ? "#fff" : "rgba(255,255,255,0.6)" }}>
                    {sorted ? (sortConfig.direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                  </button>
                  <FilterDropdown options={getFilterOptions(key)} value={currentFilter} onChange={(val) => setFilters((p) => ({ ...p, [key]: val === "All" ? "" : val }))} onClose={() => {}} />
                </div>
              </th>
            );
          })}
          {!isInvestorView && (
            <th style={{ ...thS, width: widths.actions, borderRight: "none" }}>
              <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>Actions</span>
              </div>
            </th>
          )}
        </tr></thead>
        <tbody>
          {filteredData.map((item, idx) => {
            const net = item.revenue - item.spend;
            const roi = item.spend > 0 ? (net / item.spend) * 100 : 0;
            const pct = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
            const editing = editingIdx === idx;
            return (
              <tr key={idx} style={{ borderBottom: `1px solid ${T.lineSoft}`, background: idx % 2 ? T.panel : T.bg }}>
                {colOrder.map((key) => (
                  <td key={key} style={{ padding: "8px 12px", fontSize: "13px", color: T.body, textAlign: key === "name" ? "left" : "right" }}>
                    {key === "name" && (
                      editing ? (
                        <input value={editDraft.name || ""} onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                          style={{ ...inputS, padding: "4px 6px", fontSize: "12px" }} />
                      ) : <span style={{ fontWeight: 600 }}>{item.name}</span>
                    )}
                    {key === "revenue" && (
                      editing ? (
                        <input type="number" value={editDraft.revenue ?? 0} onChange={e => setEditDraft(d => ({ ...d, revenue: Number(e.target.value) || 0 }))}
                          style={{ ...inputS, padding: "4px 6px", fontSize: "12px", textAlign: "right" }} />
                      ) : `R ${item.revenue.toLocaleString()}`
                    )}
                    {key === "spend" && (
                      editing ? (
                        <input type="number" value={editDraft.spend ?? 0} onChange={e => setEditDraft(d => ({ ...d, spend: Number(e.target.value) || 0 }))}
                          style={{ ...inputS, padding: "4px 6px", fontSize: "12px", textAlign: "right" }} />
                      ) : `R ${item.spend.toLocaleString()}`
                    )}
                    {key === "net" && (
                      editing ? (
                        <span style={{ color: (editDraft.revenue - editDraft.spend) >= 0 ? T.green : T.red, fontWeight: 600 }}>
                          R {((editDraft.revenue || 0) - (editDraft.spend || 0)).toLocaleString()}
                        </span>
                      ) : <span style={{ color: net >= 0 ? T.green : T.red, fontWeight: 600 }}>R {net.toLocaleString()}</span>
                    )}
                    {key === "roi" && (
                      editing ? (
                        <span style={{ color: roi >= 0 ? T.green : T.red, fontWeight: 600 }}>{roi.toFixed(1)}%</span>
                      ) : <span style={{ color: roi >= 0 ? T.green : T.red, fontWeight: 600 }}>{roi.toFixed(1)}%</span>
                    )}
                    {key === "pct" && `${pct.toFixed(1)}%`}
                  </td>
                ))}
                {!isInvestorView && (
                  <td style={{ padding: "6px 8px", textAlign: "center", whiteSpace: "nowrap" }}>
                    {editing ? (
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <button onClick={() => saveEdit(idx)} style={{ ...btnPrimary, padding: "3px 7px" }} title="Save"><Check size={13} /></button>
                        <button onClick={cancelEdit} style={{ ...btnGhost, padding: "3px 7px" }} title="Cancel"><X size={13} /></button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <button onClick={() => startEdit(idx, item)} style={{ ...btnGhost, padding: "3px 7px" }} title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => deleteItem(idx)} style={{ ...btnGhost, padding: "3px 7px", color: T.red }} title="Delete"><Trash2 size={13} /></button>
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
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   Campaign Performance Table (with Actions column)
   ──────────────────────────────────────────────────────────────────────── */
const CampaignPerformanceTable = ({ data, isInvestorView, onDataChange, onUpdate, onDeleteItem }) => {
  const [localData, setLocalData] = useState(data || [
    { name: "Q1 Campaign", cost: 25000, revenue: 45000 },
    { name: "Q2 Campaign", cost: 30000, revenue: 55000 },
    { name: "Summer Sale", cost: 15000, revenue: 35000 },
    { name: "Holiday Campaign", cost: 40000, revenue: 80000 },
  ]);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filteredData, setFilteredData] = useState(localData);
  const [widths, setWidths] = useState(() => ({ name: 200, cost: 150, revenue: 150, roi: 120, actions: 100 }));
  const [colOrder] = useState(["name", "cost", "revenue", "roi"]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  useEffect(() => { if (data) setLocalData(data); }, [data]);

  useEffect(() => {
    let filtered = [...localData];
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        filtered = filtered.filter((item) => {
          const itemVal = item[key];
          if (itemVal === undefined || itemVal === null) return false;
          return String(itemVal) === value;
        });
      }
    });
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const av = a[sortConfig.key] ?? "";
        const bv = b[sortConfig.key] ?? "";
        if (typeof av === "number" && typeof bv === "number") return sortConfig.direction === "asc" ? av - bv : bv - av;
        return sortConfig.direction === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    setFilteredData(filtered);
  }, [filters, sortConfig, localData]);

  const getFilterOptions = (key) => {
    const values = localData.map((item) => item[key]).filter((v) => v !== undefined && v !== null && v !== "");
    return ["All", ...Array.from(new Set(values.map((v) => String(v)))).sort()];
  };
  const toggleSort = (key) => setSortConfig((p) => ({ key, direction: p.key === key && p.direction === "asc" ? "desc" : "asc" }));
  const thS = { padding: 0, background: T.header, borderBottom: `2px solid ${T.header}`, borderRight: "1px solid rgba(255,255,255,0.14)", position: "relative", verticalAlign: "top" };
  const labels = { name: "Campaign", cost: "Cost", revenue: "Revenue", roi: "ROI %" };

  const startEdit = (idx, item) => { setEditingIdx(idx); setEditDraft({ ...item }); };
  const cancelEdit = () => { setEditingIdx(null); setEditDraft({}); };
  const saveEdit = (idx) => {
    setLocalData(prev => {
      const next = [...prev];
      next[idx] = { ...editDraft };
      if (onUpdate) onUpdate("campaignPerf", next);
      return next;
    });
    setEditingIdx(null); setEditDraft({});
  };
  const deleteItem = (idx) => {
    if (!window.confirm("Remove this campaign?")) return;
    setLocalData(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (onDeleteItem) onDeleteItem("campaignPerf", next);
      return next;
    });
  };

  return (
    <div style={{ overflowX: "auto", border: `1px solid ${T.lineStrong}`, borderRadius: "10px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead><tr>
          {colOrder.map((key) => {
            const sorted = sortConfig.key === key;
            return (
              <th key={key} style={{ ...thS, width: widths[key] || 150 }}>
                <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>{labels[key] || key}</span>
                  <button onClick={() => toggleSort(key)} style={{ background: "none", border: "none", cursor: "pointer", color: sorted ? "#fff" : "rgba(255,255,255,0.6)" }}>
                    {sorted ? (sortConfig.direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                  </button>
                  <FilterDropdown options={getFilterOptions(key)} value={filters[key] || "All"} onChange={(val) => setFilters((p) => ({ ...p, [key]: val === "All" ? "" : val }))} onClose={() => {}} />
                </div>
              </th>
            );
          })}
          {!isInvestorView && (
            <th style={{ ...thS, width: widths.actions, borderRight: "none" }}>
              <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>Actions</span>
              </div>
            </th>
          )}
        </tr></thead>
        <tbody>
          {filteredData.map((item, idx) => {
            const roi = item.cost > 0 ? ((item.revenue - item.cost) / item.cost) * 100 : 0;
            const editing = editingIdx === idx;
            return (
              <tr key={idx} style={{ borderBottom: `1px solid ${T.lineSoft}`, background: idx % 2 ? T.panel : T.bg }}>
                {colOrder.map((key) => (
                  <td key={key} style={{ padding: "8px 12px", fontSize: "13px", color: T.body, textAlign: key === "name" ? "left" : "right" }}>
                    {key === "name" && (
                      editing ? (
                        <input value={editDraft.name || ""} onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                          style={{ ...inputS, padding: "4px 6px", fontSize: "12px" }} />
                      ) : <span style={{ fontWeight: 600 }}>{item.name}</span>
                    )}
                    {key === "cost" && (
                      editing ? (
                        <input type="number" value={editDraft.cost ?? 0} onChange={e => setEditDraft(d => ({ ...d, cost: Number(e.target.value) || 0 }))}
                          style={{ ...inputS, padding: "4px 6px", fontSize: "12px", textAlign: "right" }} />
                      ) : `R ${item.cost.toLocaleString()}`
                    )}
                    {key === "revenue" && (
                      editing ? (
                        <input type="number" value={editDraft.revenue ?? 0} onChange={e => setEditDraft(d => ({ ...d, revenue: Number(e.target.value) || 0 }))}
                          style={{ ...inputS, padding: "4px 6px", fontSize: "12px", textAlign: "right" }} />
                      ) : `R ${item.revenue.toLocaleString()}`
                    )}
                    {key === "roi" && (
                      editing ? (
                        <span style={{ color: ((editDraft.revenue - editDraft.cost) >= 0) ? T.green : T.red, fontWeight: 600 }}>
                          {(editDraft.cost > 0 ? (((editDraft.revenue - editDraft.cost) / editDraft.cost) * 100) : 0).toFixed(1)}%
                        </span>
                      ) : <span style={{ color: roi >= 0 ? T.green : T.red, fontWeight: 600 }}>{roi.toFixed(1)}%</span>
                    )}
                  </td>
                ))}
                {!isInvestorView && (
                  <td style={{ padding: "6px 8px", textAlign: "center", whiteSpace: "nowrap" }}>
                    {editing ? (
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <button onClick={() => saveEdit(idx)} style={{ ...btnPrimary, padding: "3px 7px" }} title="Save"><Check size={13} /></button>
                        <button onClick={cancelEdit} style={{ ...btnGhost, padding: "3px 7px" }} title="Cancel"><X size={13} /></button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <button onClick={() => startEdit(idx, item)} style={{ ...btnGhost, padding: "3px 7px" }} title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => deleteItem(idx)} style={{ ...btnGhost, padding: "3px 7px", color: T.red }} title="Delete"><Trash2 size={13} /></button>
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
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   Concentration Risk Bar Chart — now shows editable channel table below
   ──────────────────────────────────────────────────────────────────────── */
const ConcentrationRiskBarChart = ({ data, isInvestorView, onDataChange, onUpdate, onDeleteItem }) => {
  const [localData, setLocalData] = useState(data || {
    channels: [
      { name: "Social Media", revenue: 150000, spend: 45000 },
      { name: "Email", revenue: 120000, spend: 30000 },
      { name: "PPC", revenue: 80000, spend: 35000 },
      { name: "SEO", revenue: 60000, spend: 15000 },
      { name: "Referral", revenue: 50000, spend: 10000 },
      { name: "Direct", revenue: 40000, spend: 5000 },
    ],
  });
  const [editingIdx, setEditingIdx] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  useEffect(() => { if (data) setLocalData(data); }, [data]);

  const chartData = useMemo(() => {
    const sorted = [...localData.channels].sort((a, b) => b.revenue - a.revenue);
    return {
      labels: sorted.map(ch => ch.name),
      datasets: [
        { label: "Revenue", data: sorted.map(ch => ch.revenue),
          backgroundColor: sorted.map((_, i) => ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"][i % 6]),
          borderColor: sorted.map((_, i) => ["#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"][i % 6]),
          borderWidth: 1, borderRadius: 4, barPercentage: 0.6 },
        { label: "Marketing Spend", data: sorted.map(ch => ch.spend),
          backgroundColor: "rgba(234, 88, 12, 0.8)", borderColor: "#c2410c",
          borderWidth: 1, borderRadius: 4, barPercentage: 0.6 },
      ],
    };
  }, [localData]);

  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { font: { size: 12, weight: "500" }, color: T.body, padding: 16, usePointStyle: true, pointStyle: "circle" } },
      tooltip: { backgroundColor: T.ink, padding: 12, cornerRadius: 8,
        callbacks: { label: (ctx) => `${ctx.dataset.label}: R ${ctx.parsed.y.toLocaleString()}` } },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: T.lineSoft }, ticks: { color: T.body, font: { size: 11 }, callback: (v) => `R ${(v / 1000).toFixed(0)}k` } },
      x: { grid: { display: false }, ticks: { color: T.body, font: { size: 11 }, maxRotation: 45 } },
    },
  };

  const totalRevenue = localData.channels.reduce((s, ch) => s + ch.revenue, 0);
  const totalSpend = localData.channels.reduce((s, ch) => s + ch.spend, 0);
  const avgROI = localData.channels.length > 0
    ? localData.channels.reduce((s, ch) => s + ((ch.revenue - ch.spend) / ch.spend * 100), 0) / localData.channels.length
    : 0;
  const top3Revenue = [...localData.channels].sort((a, b) => b.revenue - a.revenue).slice(0, 3).reduce((s, ch) => s + ch.revenue, 0);
  const top3Concentration = totalRevenue > 0 ? (top3Revenue / totalRevenue) * 100 : 0;

  const startEdit = (idx, item) => { setEditingIdx(idx); setEditDraft({ ...item }); };
  const cancelEdit = () => { setEditingIdx(null); setEditDraft({}); };
  const saveEdit = (idx) => {
    setLocalData(prev => {
      const next = { ...prev, channels: [...prev.channels] };
      next.channels[idx] = { ...editDraft };
      if (onUpdate) onUpdate("riskAnalysis", next);
      return next;
    });
    setEditingIdx(null); setEditDraft({});
  };
  const deleteItem = (idx) => {
    if (!window.confirm("Remove this channel?")) return;
    setLocalData(prev => {
      const next = { ...prev, channels: prev.channels.filter((_, i) => i !== idx) };
      if (onDeleteItem) onDeleteItem("riskAnalysis", next);
      return next;
    });
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        <div style={{ ...cardS, padding: "12px 14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: T.muted }}>Total Revenue</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: T.ink }}>R {totalRevenue.toLocaleString()}</div>
        </div>
        <div style={{ ...cardS, padding: "12px 14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: T.muted }}>Total Spend</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: T.ink }}>R {totalSpend.toLocaleString()}</div>
        </div>
        <div style={{ ...cardS, padding: "12px 14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: T.muted }}>Top 3 Concentration</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: top3Concentration > 70 ? T.red : top3Concentration > 50 ? T.amber : T.green }}>{top3Concentration.toFixed(1)}%</div>
        </div>
        <div style={{ ...cardS, padding: "12px 14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: T.muted }}>Avg ROI</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: avgROI > 100 ? T.green : avgROI > 50 ? T.amber : T.red }}>{avgROI.toFixed(1)}%</div>
        </div>
      </div>
      <div style={{ height: "320px", marginBottom: "20px" }}>
        <Chart type="bar" data={chartData} options={options} />
      </div>

      <div style={{ fontSize: "12.5px", color: T.muted, padding: "12px 14px", background: T.panel, borderRadius: "8px", border: `1px solid ${T.lineSoft}`, marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <Info size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
          <div>
            <strong>Concentration Risk Analysis:</strong> Top 3 channels represent {top3Concentration.toFixed(1)}% of total revenue.
            {top3Concentration > 70 ? " High concentration risk — consider diversifying revenue streams."
              : top3Concentration > 50 ? " Moderate concentration risk — monitor top channels closely."
              : " Low concentration risk — revenue is well distributed."}
          </div>
        </div>
      </div>

      {/* Editable channel table with Actions column */}
      <div style={{ border: `1px solid ${T.lineSoft}`, borderRadius: "8px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: T.header }}>
            <th style={{ padding: "8px 12px", color: "#fff", fontSize: "11px", textAlign: "left" }}>Channel</th>
            <th style={{ padding: "8px 12px", color: "#fff", fontSize: "11px", textAlign: "right" }}>Revenue</th>
            <th style={{ padding: "8px 12px", color: "#fff", fontSize: "11px", textAlign: "right" }}>Spend</th>
            <th style={{ padding: "8px 12px", color: "#fff", fontSize: "11px", textAlign: "right" }}>ROI %</th>
            {!isInvestorView && (
              <th style={{ padding: "8px 12px", color: "#fff", fontSize: "11px", textAlign: "center", width: 100 }}>Actions</th>
            )}
          </tr></thead>
          <tbody>
            {localData.channels.map((item, i) => {
              const net = item.revenue - item.spend;
              const roi = item.spend > 0 ? (net / item.spend) * 100 : 0;
              const editing = editingIdx === i;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.lineSoft}`, background: i % 2 ? T.panel : T.bg }}>
                  <td style={{ padding: "6px 12px", fontSize: "13px", color: T.body }}>
                    {editing ? (
                      <input value={editDraft.name || ""} onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                        style={{ ...inputS, padding: "4px 6px", fontSize: "12px" }} />
                    ) : item.name}
                  </td>
                  <td style={{ padding: "6px 12px", fontSize: "13px", color: T.body, textAlign: "right" }}>
                    {editing ? (
                      <input type="number" value={editDraft.revenue ?? 0} onChange={e => setEditDraft(d => ({ ...d, revenue: Number(e.target.value) || 0 }))}
                        style={{ ...inputS, padding: "4px 6px", fontSize: "12px", textAlign: "right" }} />
                    ) : `R ${item.revenue.toLocaleString()}`}
                  </td>
                  <td style={{ padding: "6px 12px", fontSize: "13px", color: T.body, textAlign: "right" }}>
                    {editing ? (
                      <input type="number" value={editDraft.spend ?? 0} onChange={e => setEditDraft(d => ({ ...d, spend: Number(e.target.value) || 0 }))}
                        style={{ ...inputS, padding: "4px 6px", fontSize: "12px", textAlign: "right" }} />
                    ) : `R ${item.spend.toLocaleString()}`}
                  </td>
                  <td style={{ padding: "6px 12px", fontSize: "13px", textAlign: "right", color: roi >= 0 ? T.green : T.red, fontWeight: 600 }}>
                    {editing
                      ? `${(editDraft.spend > 0 ? ((editDraft.revenue - editDraft.spend) / editDraft.spend * 100) : 0).toFixed(1)}%`
                      : `${roi.toFixed(1)}%`}
                  </td>
                  {!isInvestorView && (
                    <td style={{ padding: "6px 12px", textAlign: "center", whiteSpace: "nowrap" }}>
                      {editing ? (
                        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                          <button onClick={() => saveEdit(i)} style={{ ...btnPrimary, padding: "3px 7px" }} title="Save"><Check size={13} /></button>
                          <button onClick={cancelEdit} style={{ ...btnGhost, padding: "3px 7px" }} title="Cancel"><X size={13} /></button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                          <button onClick={() => startEdit(i, item)} style={{ ...btnGhost, padding: "3px 7px" }} title="Edit"><Pencil size={13} /></button>
                          <button onClick={() => deleteItem(i)} style={{ ...btnGhost, padding: "3px 7px", color: T.red }} title="Delete"><Trash2 size={13} /></button>
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
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   AddChooser — clean icon cards, no emojis
   ════════════════════════════════════════════════════════════════════════ */
const AddChooser = ({ onClose, onPick }) => {
  return (
    <Modal title="What would you like to do?" icon={<Plus size={17} />} onClose={onClose} width={580}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        {[
          {
            key: "data",
            icon: <Database size={22} />,
            title: "Add Data",
            body: "Capture actual and target figures across all your KPIs. Choose a section, then open the KPI's capture sheet.",
          },
          {
            key: "kpi",
            icon: <Sparkles size={22} />,
            title: "Add KPI",
            body: "Create a new metric under an existing category, or start a category of your own.",
          },
        ].map((o) => (
          <button
            key={o.key}
            onClick={() => onPick(o.key)}
            style={{
              padding: "22px 20px", borderRadius: "12px", border: `1px solid ${T.lineStrong}`,
              background: T.bg, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
              display: "flex", flexDirection: "column", gap: "10px",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = T.accentTint; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.lineStrong; e.currentTarget.style.background = T.bg; }}
          >
            <span style={{ color: T.accent }}>{o.icon}</span>
            <span style={{ fontSize: "15.5px", fontWeight: 600, color: T.accent }}>{o.title}</span>
            <span style={{ fontSize: "13px", color: T.body, lineHeight: 1.5 }}>{o.body}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
};

const AddKpiWizard = ({ tabs, currentTabId, onBack, onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [selectedTabId, setSelectedTabId] = useState(currentTabId || tabs[0]?.id);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [kpiName, setKpiName] = useState("");
  const [kpiUnits, setKpiUnits] = useState("%");
  const [kpiDirection, setKpiDirection] = useState("higher");
  const [kpiAggregate, setKpiAggregate] = useState("avg");
  const [kpiMeaning, setKpiMeaning] = useState("");
  const [kpiMeasured, setKpiMeasured] = useState("");

  const selectedTab = tabs.find(t => t.id === selectedTabId);
  const categories = selectedTab?.categories?.map(c => c.name) || [];

  const handleSave = () => {
    if (!kpiName.trim()) return;
    const category = newCategory.trim() || selectedCategory;
    if (!category) return;
    onSave({
      id: `custom_${uid()}`, name: kpiName.trim(), units: kpiUnits,
      direction: kpiDirection, aggregate: kpiAggregate,
      meaning: kpiMeaning.trim(), measured: kpiMeasured.trim(),
      tabId: selectedTabId, category, custom: true,
    });
    onClose();
  };

  return (
    <Modal title="Add Custom KPI" icon={<Plus size={17} />} onClose={onClose} width={580}
      footer={<>
        {step > 1 && <button onClick={() => setStep(s => s - 1)} style={btnGhost}>Back</button>}
        {step < 2 && <button onClick={() => setStep(2)} style={btnPrimary} disabled={!selectedTabId || (!selectedCategory && !newCategory.trim())}>Next</button>}
        {step === 2 && (
          <>
            <button onClick={onClose} style={btnGhost}>Cancel</button>
            <button onClick={handleSave} style={btnPrimary} disabled={!kpiName.trim()}>Create KPI</button>
          </>
        )}
      </>}>
      {step === 1 && (
        <div>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelS}>Select Tab</label>
            <Select value={selectedTabId} onChange={(e) => setSelectedTabId(e.target.value)}>
              {tabs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelS}>Category</label>
            <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">Select existing category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: T.muted }}>or create new:</span>
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" style={{ ...inputS, flex: 1 }} />
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div>
          <div style={{ marginBottom: "12px" }}>
            <label style={labelS}>KPI Name</label>
            <input value={kpiName} onChange={(e) => setKpiName(e.target.value)} placeholder="e.g. Customer Acquisition Cost" style={inputS} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelS}>Units</label>
              <Select value={kpiUnits} onChange={(e) => setKpiUnits(e.target.value)}>
                <option value="%">%</option><option value="R">R</option><option value="#">#</option>
                <option value="days">days</option><option value="hours">hours</option><option value="custom">Custom</option>
              </Select>
            </div>
            <div>
              <label style={labelS}>Direction</label>
              <Select value={kpiDirection} onChange={(e) => setKpiDirection(e.target.value)}>
                {DIRECTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </Select>
            </div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={labelS}>Aggregation</label>
            <Select value={kpiAggregate} onChange={(e) => setKpiAggregate(e.target.value)}>
              <option value="avg">Average across periods</option>
              <option value="sum">Sum across periods</option>
            </Select>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={labelS}>Meaning</label>
            <textarea value={kpiMeaning} onChange={(e) => setKpiMeaning(e.target.value)} rows="2" placeholder="What does this KPI mean?" style={{ ...inputS, resize: "vertical" }} />
          </div>
          <div>
            <label style={labelS}>Measurement</label>
            <textarea value={kpiMeasured} onChange={(e) => setKpiMeasured(e.target.value)} rows="3" placeholder="How is it measured?" style={{ ...inputS, resize: "vertical", fontFamily: "monospace" }} />
          </div>
        </div>
      )}
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Add Data — bulk capture grid with friendly single-column layout
   ════════════════════════════════════════════════════════════════════════ */
const AddDataWizard = ({ tabs, fy, docs, prefs, onSavePrefs, onBack, onClose, onSaveField, onSavePanel, currentTabId }) => {
  const editableTabs = tabs.filter((t) => {
    const hasEditableKpis = t.categories.some((c) => (c.kpis || []).some((k) => k.field));
    const hasPanel = t.categories.some((c) =>
      c.panel === "top3" || c.panel === "channelPerf" || c.panel === "riskAnalysis" ||
      c.panel === "campaignPerf" || c.panel === "pipelineTable");
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
  const docsRef = useRef(docs);

  /* ── NEW: single-column mode with switch ──────────────────────────── */
  const [mode, setMode] = useState(prefs?.mode || "actual");
  const [globalMode, setGlobalMode] = useState(prefs?.globalMode ?? true);
  const [monthModes, setMonthModes] = useState(() => prefs?.monthModes || {});

  useEffect(() => { docsRef.current = docs; }, [docs]);

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
    tab.categories.forEach((cat) => {
      const hasPanel = cat.panel === "top3" || cat.panel === "channelPerf" ||
                       cat.panel === "riskAnalysis" || cat.panel === "campaignPerf" ||
                       cat.panel === "pipelineTable";
      if (hasPanel) {
        out.push({ kpi: { id: `panel_${cat.panel}`, name: cat.name, units: "", field: null,
          panel: cat.panel, isPanel: true }, category: cat.name, isPanel: true });
      } else {
        (cat.kpis || []).forEach((k) => {
          if (k.field) out.push({ kpi: k, category: cat.name, isPanel: false });
        });
      }
    });
    return out;
  }, [tab]);

  const hasPanelData = tab?.categories.some((c) =>
    c.panel === "top3" || c.panel === "channelPerf" ||
    c.panel === "riskAnalysis" || c.panel === "campaignPerf" ||
    c.panel === "pipelineTable");

  const panelToOpen = tab?.categories.find((c) =>
    c.panel === "top3" || c.panel === "channelPerf" ||
    c.panel === "riskAnalysis" || c.panel === "campaignPerf" ||
    c.panel === "pipelineTable")?.panel;

  const draftKey = (kpiId, monthIdx, which) => `${monthIdx}|${kpiId}|${which}`;

  const value = (kpi, monthIdx, which) => {
    const dk = draftKey(kpi.id, monthIdx, which);
    if (draft[dk] !== undefined) return draft[dk];
    if (!kpi.field) return "";
    const path = which === "actual" ? kpi.field.a : kpi.field.b;
    if (!path) return "";
    const raw = kpi.field.scalar
      ? atPath(docs[kpi.field.src], path)
      : atPath(docs[kpi.field.src], path)?.[monthIdx];
    return raw === undefined || raw === null ? "" : String(raw);
  };

  const setValue = (kpi, monthIdx, which, raw) => {
    const dk = draftKey(kpi.id, monthIdx, which);
    setDraft((p) => ({ ...p, [dk]: raw }));
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await onSaveField({ kpi, which, raw, monthIndex: monthIdx });
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

  const renderPanelEditor = () => {
    if (!panelToOpen) return null;
    const srcKey =
      panelToOpen === "top3" || panelToOpen === "channelPerf" || panelToOpen === "riskAnalysis"
        ? "concentration"
        : panelToOpen === "campaignPerf"
        ? "sustainability"
        : "pipeline";
    const currentData = docs?.[srcKey]?.[panelToOpen];

    switch (panelToOpen) {
      case "top3":
        return <Top3PanelEditor data={currentData} onSave={(d) => onSavePanel("top3", d)} />;
      case "channelPerf":
        return <ChannelPerfPanelEditor data={currentData} onSave={(d) => onSavePanel("channelPerf", d)} />;
      case "riskAnalysis":
        return <RiskAnalysisPanelEditor data={currentData} onSave={(d) => onSavePanel("riskAnalysis", d)} />;
      case "campaignPerf":
        return <CampaignPanelEditor data={currentData} onSave={(d) => onSavePanel("campaignPerf", d)} />;
      case "pipelineTable":
        return <PipelinePanelEditor data={currentData} onSave={(d) => onSavePanel("pipelineTable", d)} />;
      default:
        return <div>Unknown panel type</div>;
    }
  };

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
      label: "Target",
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
  const minGridWidth = 200 + months.length * 86;

  return (
    <Modal
      title="Add Data"
      subtitle={`Financial year starts in ${MONTHS[fy.startMonth]} · Bulk capture mode · Everything saves as you type`}
      icon={<Database size={17} />}
      onClose={onClose}
      width={Math.max(1000, Math.min(minGridWidth + 80, Math.max(window.innerWidth - 40, 1000)))}
      footer={<>
        <button onClick={onBack} style={btnGhost}><ArrowLeft size={13} /> Back</button>
        <span style={{ flex: 1, fontSize: "12.5px", color: saveState === "saved" ? T.green : T.muted, textAlign: "left" }}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Everything saves automatically"}
        </span>
        <button onClick={onClose} style={btnPrimary}>Done</button>
      </>}>

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

      {hasPanelData && kpiRows.length === 0 && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ ...cardS, background: T.panel, marginBottom: "12px", display: "flex",
            alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <Info size={16} color={T.accentSoft} />
            <span style={{ flex: 1, minWidth: "220px", fontSize: "12.5px", color: T.body }}>
              This section contains panel data ({tab.categories.find(c => c.panel)?.name}). Edit it directly below and it will save automatically.
            </span>
          </div>
          {renderPanelEditor()}
        </div>
      )}

      {hasPanelData && kpiRows.length > 0 && (
        <div style={{ ...cardS, background: T.panel, marginBottom: "12px", display: "flex",
          alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "12.5px", color: T.body }}>
          <Info size={16} color={T.accentSoft} />
          <span style={{ flex: 1, minWidth: "220px" }}>
            This section also has panel data. Scroll down to edit it — saves automatically.
          </span>
        </div>
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
                Target
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
                    width: "200px",
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
                              title={`Switch to ${mk === "budget" ? "Actual" : "Target"}`}
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
                  const isScalar = !!kpi.field?.scalar;
                  const hasTarget = !!kpi.field?.b;
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
                          {isScalar && (
                            <span style={{ fontSize: "9.5px", color: T.faint, fontStyle: "italic" }}>· once for all months</span>
                          )}
                        </div>
                      </td>

                      {months.map((m) => {
                        const mk = effectiveModeForMonth(m);
                        const tok = MODE_TOKENS[mk];
                        const disabled = mk === "budget" && !hasTarget;
                        const monthIdx = isScalar ? 0 : m.month;
                        const val = value(kpi, monthIdx, mk);

                        return (
                          <td key={m.key} style={{
                            padding: "3px 4px", borderBottom: `1px solid ${T.lineSoft}`,
                            borderRight: `1px solid ${tok.cellBorder}`,
                            background: val !== "" ? tok.cellBg : bg,
                          }}>
                            {disabled ? (
                              <div style={{
                                textAlign: "center", fontSize: "11px",
                                color: T.faint, padding: "7px 2px",
                              }}>
                                {kpi.benchmark !== null ? `${fmtValue(kpi.benchmark, kpi)}` : "—"}
                              </div>
                            ) : kpi.options ? (
                              <select
                                value={val}
                                disabled={isScalar && m.month !== 0}
                                onChange={(e) => setValue(kpi, monthIdx, mk, e.target.value)}
                                style={{
                                  width: "100%", padding: "6px 4px",
                                  border: `1.5px solid ${tok.inputBorder}`,
                                  borderRadius: "5px",
                                  fontSize: "11.5px",
                                  fontFamily: "inherit",
                                  background: "#ffffff",
                                  color: tok.inputColor,
                                  fontWeight: 600,
                                  outline: "none",
                                  boxSizing: "border-box",
                                  opacity: isScalar && m.month !== 0 ? 0.4 : 1,
                                }}>
                                <option value="">—</option>
                                {kpi.options.map((o) => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="number"
                                step="any"
                                value={val}
                                placeholder="—"
                                disabled={isScalar && m.month !== 0}
                                onChange={(e) => setValue(kpi, monthIdx, mk, e.target.value)}
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
                                  opacity: isScalar && m.month !== 0 ? 0.4 : 1,
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
              ? "Toggle Target / Actual above to switch every month. Filled cells are tinted."
              : "Click the ⇄ next to any month name to flip just that month."}
            {kpiRows.some(({ kpi }) => kpi.field?.scalar) && (
              <> Scalar KPIs (like Head Count) write once and stand for every month.</>
            )}
          </div>
        </>
      )}

      {hasPanelData && kpiRows.length > 0 && (
        <div style={{ marginTop: "18px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: T.accent, marginBottom: "8px" }}>
            Panel data — {tab.categories.find(c => c.panel)?.name}
          </div>
          {renderPanelEditor()}
        </div>
      )}

      {kpiRows.length === 0 && !hasPanelData && (
        <div style={{ textAlign: "center", padding: "30px", color: T.muted, fontSize: "13.5px" }}>
          Nothing on this tab takes direct input.
        </div>
      )}
    </Modal>
  );
};

/* ── Panel editors used inside AddDataWizard ─────────────────────────── */
const Top3PanelEditor = ({ data, onSave }) => {
  const [local, setLocal] = useState(data || {
    channels: [
      { name: "Social Media", revenue: 1200000, percentage: 35.2 },
      { name: "PPC", revenue: 800000, percentage: 23.5 },
      { name: "Email", revenue: 500000, percentage: 14.7 },
    ],
    customers: [
      { name: "Acme Corp", revenue: 850000, percentage: 24.9 },
      { name: "TechGlobal", revenue: 650000, percentage: 19.0 },
      { name: "EcoSolutions", revenue: 450000, percentage: 13.2 },
    ],
    segments: [
      { name: "Enterprise", revenue: 1500000, percentage: 44.0 },
      { name: "SMB", revenue: 800000, percentage: 23.5 },
      { name: "Startup", revenue: 400000, percentage: 11.7 },
    ],
  });
  useEffect(() => { if (data) setLocal(data); }, [data]);

  const updateItem = (group, idx, field, val) => {
    setLocal(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[group][idx][field] = val;
      return next;
    });
  };

  const renderGroup = (group, title) => (
    <div style={{ marginBottom: "16px" }}>
      <h4 style={{ fontSize: "13px", fontWeight: 600, color: T.body, marginBottom: "6px" }}>{title}</h4>
      <div style={{ border: `1px solid ${T.lineSoft}`, borderRadius: "8px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: T.header }}>
            <th style={{ padding: "6px 10px", color: "#fff", fontSize: "11px", textAlign: "left" }}>Name</th>
            <th style={{ padding: "6px 10px", color: "#fff", fontSize: "11px", textAlign: "right" }}>Revenue</th>
            <th style={{ padding: "6px 10px", color: "#fff", fontSize: "11px", textAlign: "right" }}>%</th>
          </tr></thead>
          <tbody>
            {local[group].map((item, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.lineSoft}`, background: i % 2 ? T.panel : T.bg }}>
                <td style={{ padding: "4px 6px" }}>
                  <input value={item.name} onChange={e => updateItem(group, i, "name", e.target.value)} style={{ ...inputS, padding: "4px 6px", fontSize: "12px" }} />
                </td>
                <td style={{ padding: "4px 6px" }}>
                  <input type="number" value={item.revenue} onChange={e => updateItem(group, i, "revenue", Number(e.target.value) || 0)} style={{ ...inputS, padding: "4px 6px", fontSize: "12px", textAlign: "right" }} />
                </td>
                <td style={{ padding: "4px 6px" }}>
                  <input type="number" step="0.1" value={item.percentage} onChange={e => updateItem(group, i, "percentage", Number(e.target.value) || 0)} style={{ ...inputS, padding: "4px 6px", fontSize: "12px", textAlign: "right" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      {renderGroup("channels", "Top 3 Channels")}
      {renderGroup("customers", "Top 3 Customers")}
      {renderGroup("segments", "Top 3 Segments")}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => onSave(local)} style={btnPrimary}><Save size={13} /> Save Panel</button>
      </div>
    </div>
  );
};

const ChannelPerfPanelEditor = ({ data, onSave }) => {
  const [local, setLocal] = useState(data || [
    { name: "Social Media", revenue: 150000, spend: 45000 },
    { name: "Email", revenue: 120000, spend: 30000 },
    { name: "PPC", revenue: 80000, spend: 35000 },
    { name: "SEO", revenue: 60000, spend: 15000 },
    { name: "Referral", revenue: 50000, spend: 10000 },
    { name: "Direct", revenue: 40000, spend: 5000 },
  ]);
  useEffect(() => { if (data) setLocal(data); }, [data]);

  const updateItem = (idx, field, val) => {
    setLocal(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };
  const addRow = () => setLocal(prev => [...prev, { name: "New Channel", revenue: 0, spend: 0 }]);
  const removeRow = (idx) => setLocal(prev => prev.filter((_, i) => i !== idx));

  return (
    <div>
      <div style={{ border: `1px solid ${T.lineSoft}`, borderRadius: "8px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: T.header }}>
            <th style={{ padding: "6px 10px", color: "#fff", fontSize: "11px", textAlign: "left" }}>Channel</th>
            <th style={{ padding: "6px 10px", color: "#fff", fontSize: "11px", textAlign: "right" }}>Revenue</th>
            <th style={{ padding: "6px 10px", color: "#fff", fontSize: "11px", textAlign: "right" }}>Spend</th>
            <th style={{ padding: "6px 10px", color: "#fff", fontSize: "11px", textAlign: "center" }}>—</th>
          </tr></thead>
          <tbody>
            {local.map((item, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.lineSoft}`, background: i % 2 ? T.panel : T.bg }}>
                <td style={{ padding: "4px 6px" }}>
                  <input value={item.name} onChange={e => updateItem(i, "name", e.target.value)} style={{ ...inputS, padding: "4px 6px", fontSize: "12px" }} />
                </td>
                <td style={{ padding: "4px 6px" }}>
                  <input type="number" value={item.revenue} onChange={e => updateItem(i, "revenue", Number(e.target.value) || 0)} style={{ ...inputS, padding: "4px 6px", fontSize: "12px", textAlign: "right" }} />
                </td>
                <td style={{ padding: "4px 6px" }}>
                  <input type="number" value={item.spend} onChange={e => updateItem(i, "spend", Number(e.target.value) || 0)} style={{ ...inputS, padding: "4px 6px", fontSize: "12px", textAlign: "right" }} />
                </td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>
                  <button onClick={() => removeRow(i)} style={{ ...btnGhost, padding: "2px 6px", color: T.red }} title="Remove"><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
        <button onClick={addRow} style={{ ...btnGhost, padding: "5px 10px", fontSize: "12px" }}><Plus size={12} /> Add Channel</button>
        <button onClick={() => onSave(local)} style={btnPrimary}><Save size={13} /> Save Panel</button>
      </div>
    </div>
  );
};

const RiskAnalysisPanelEditor = ({ data, onSave }) => {
  const [local, setLocal] = useState(data?.channels || [
    { name: "Social Media", revenue: 150000, spend: 45000 },
    { name: "Email", revenue: 120000, spend: 30000 },
    { name: "PPC", revenue: 80000, spend: 35000 },
    { name: "SEO", revenue: 60000, spend: 15000 },
    { name: "Referral", revenue: 50000, spend: 10000 },
    { name: "Direct", revenue: 40000, spend: 5000 },
  ]);
  useEffect(() => { if (data?.channels) setLocal(data.channels); }, [data]);

  const updateItem = (idx, field, val) => {
    setLocal(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  return (
    <div>
      <div style={{ border: `1px solid ${T.lineSoft}`, borderRadius: "8px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: T.header }}>
            <th style={{ padding: "6px 10px", color: "#fff", fontSize: "11px", textAlign: "left" }}>Channel</th>
            <th style={{ padding: "6px 10px", color: "#fff", fontSize: "11px", textAlign: "right" }}>Revenue</th>
            <th style={{ padding: "6px 10px", color: "#fff", fontSize: "11px", textAlign: "right" }}>Spend</th>
          </tr></thead>
          <tbody>
            {local.map((item, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.lineSoft}`, background: i % 2 ? T.panel : T.bg }}>
                <td style={{ padding: "4px 6px" }}>
                  <input value={item.name} onChange={e => updateItem(i, "name", e.target.value)} style={{ ...inputS, padding: "4px 6px", fontSize: "12px" }} />
                </td>
                <td style={{ padding: "4px 6px" }}>
                  <input type="number" value={item.revenue} onChange={e => updateItem(i, "revenue", Number(e.target.value) || 0)} style={{ ...inputS, padding: "4px 6px", fontSize: "12px", textAlign: "right" }} />
                </td>
                <td style={{ padding: "4px 6px" }}>
                  <input type="number" value={item.spend} onChange={e => updateItem(i, "spend", Number(e.target.value) || 0)} style={{ ...inputS, padding: "4px 6px", fontSize: "12px", textAlign: "right" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
        <button onClick={() => onSave({ channels: local })} style={btnPrimary}><Save size={13} /> Save Panel</button>
      </div>
    </div>
  );
};

const CampaignPanelEditor = ({ data, onSave }) => {
  const [local, setLocal] = useState(data || [
    { name: "Q1 Campaign", cost: 25000, revenue: 45000 },
    { name: "Q2 Campaign", cost: 30000, revenue: 55000 },
    { name: "Summer Sale", cost: 15000, revenue: 35000 },
    { name: "Holiday Campaign", cost: 40000, revenue: 80000 },
  ]);
  useEffect(() => { if (data) setLocal(data); }, [data]);

  const updateItem = (idx, field, val) => {
    setLocal(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };
  const addRow = () => setLocal(prev => [...prev, { name: "New Campaign", cost: 0, revenue: 0 }]);
  const removeRow = (idx) => setLocal(prev => prev.filter((_, i) => i !== idx));

  return (
    <div>
      <div style={{ border: `1px solid ${T.lineSoft}`, borderRadius: "8px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: T.header }}>
            <th style={{ padding: "6px 10px", color: "#fff", fontSize: "11px", textAlign: "left" }}>Campaign</th>
            <th style={{ padding: "6px 10px", color: "#fff", fontSize: "11px", textAlign: "right" }}>Cost</th>
            <th style={{ padding: "6px 10px", color: "#fff", fontSize: "11px", textAlign: "right" }}>Revenue</th>
            <th style={{ padding: "6px 10px", color: "#fff", fontSize: "11px", textAlign: "center" }}>—</th>
          </tr></thead>
          <tbody>
            {local.map((item, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.lineSoft}`, background: i % 2 ? T.panel : T.bg }}>
                <td style={{ padding: "4px 6px" }}>
                  <input value={item.name} onChange={e => updateItem(i, "name", e.target.value)} style={{ ...inputS, padding: "4px 6px", fontSize: "12px" }} />
                </td>
                <td style={{ padding: "4px 6px" }}>
                  <input type="number" value={item.cost} onChange={e => updateItem(i, "cost", Number(e.target.value) || 0)} style={{ ...inputS, padding: "4px 6px", fontSize: "12px", textAlign: "right" }} />
                </td>
                <td style={{ padding: "4px 6px" }}>
                  <input type="number" value={item.revenue} onChange={e => updateItem(i, "revenue", Number(e.target.value) || 0)} style={{ ...inputS, padding: "4px 6px", fontSize: "12px", textAlign: "right" }} />
                </td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>
                  <button onClick={() => removeRow(i)} style={{ ...btnGhost, padding: "2px 6px", color: T.red }} title="Remove"><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
        <button onClick={addRow} style={{ ...btnGhost, padding: "5px 10px", fontSize: "12px" }}><Plus size={12} /> Add Campaign</button>
        <button onClick={() => onSave(local)} style={btnPrimary}><Save size={13} /> Save Panel</button>
      </div>
    </div>
  );
};

const PipelinePanelEditor = ({ data, onSave }) => {
  const [local, setLocal] = useState(data || []);
  useEffect(() => { if (data) setLocal(data); }, [data]);

  return (
    <div>
      <div style={{ fontSize: "12.5px", color: T.muted, marginBottom: "8px" }}>
        Pipeline visibility data is managed via the Pipeline Table on the Pipeline Visibility tab.
        You can edit it there with full add/edit/delete capabilities.
      </div>
      <div style={{ ...cardS, background: T.panel }}>
        <Info size={14} style={{ marginRight: "6px" }} />
        Use the <strong>Pipeline Visibility</strong> tab in the main dashboard for full pipeline record management.
      </div>
    </div>
  );
};

const TrendChartModal = ({ kpi, period, fy, readOnly, onClose, onSaveNote, onSaveChart }) => {
  const [chartType, setChartType] = useState("line");
  const months = fyMonths(fy.startYear, fy.startMonth);
  const data = months.map(m => {
    const entry = kpi.entries?.[m.key] || { actual: null, budget: null };
    return { ...m, actual: Number(entry.actual), budget: Number(entry.budget) };
  });

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      { label: "Actual", data: data.map(d => d.actual || null), borderColor: T.accent, backgroundColor: T.accent + "33", fill: true, tension: 0.2, pointRadius: 4, pointBackgroundColor: T.accent },
      { label: "Target", data: data.map(d => d.budget || null), borderColor: T.faint, backgroundColor: "transparent", borderDash: [5, 5], tension: 0.2, pointRadius: 3, pointBackgroundColor: T.faint },
    ],
  };

  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { font: { size: 12 }, color: T.body, usePointStyle: true } },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmtValue(ctx.parsed.y, kpi, { bare: true })}` } },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: T.lineSoft }, ticks: { color: T.body, font: { size: 10 }, callback: (v) => fmtValue(v, kpi, { bare: true }) } },
      x: { grid: { display: false }, ticks: { color: T.body, font: { size: 10 } } },
    },
  };

  const periodNotes = kpi.periodNotes || {};

  return (
    <Modal title={`Trend: ${kpi.name}`} subtitle={`${kpi.units} · ${DIRECTIONS.find(d => d.value === kpi.direction)?.label}`} icon={<LineChartIcon size={17} />} onClose={onClose} width={720}
      footer={<>
        {!readOnly && <button onClick={() => onSaveChart({ type: chartType })} style={btnGhost}><Save size={13} /> Save Chart</button>}
        <button onClick={onClose} style={btnPrimary}>Close</button>
      </>}>
      <div style={{ marginBottom: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button onClick={() => setChartType("line")} style={{ ...btnGhost, padding: "4px 12px", fontSize: "12px", background: chartType === "line" ? T.accentTint : "transparent" }}>Line</button>
        <button onClick={() => setChartType("bar")} style={{ ...btnGhost, padding: "4px 12px", fontSize: "12px", background: chartType === "bar" ? T.accentTint : "transparent" }}>Bar</button>
      </div>
      <div style={{ height: "260px", marginBottom: "18px" }}>
        <Chart type={chartType} data={chartData} options={options} />
      </div>
      <div>
        <label style={{ ...labelS, display: "flex", alignItems: "center", gap: "6px" }}><StickyNote size={13} /> Period Notes</label>
        {months.map(m => {
          const text = periodNotes[m.key] || "";
          return (
            <div key={m.key} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, width: "80px", color: T.muted }}>{m.label}</span>
              {readOnly ? (
                <span style={{ fontSize: "13px", color: text ? T.body : T.faint }}>{text || "—"}</span>
              ) : (
                <input value={text} onChange={(e) => onSaveNote(m.key, e.target.value)} placeholder="Add note..." style={{ ...inputS, fontSize: "13px", flex: 1 }} />
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

const AnalysisModal = ({ kpi, period, fy, onClose }) => {
  const months = fyMonths(fy.startYear, fy.startMonth);
  const data = months.map(m => {
    const entry = kpi.entries?.[m.key] || { actual: null, budget: null };
    return { ...m, actual: Number(entry.actual), budget: Number(entry.budget) };
  });

  const actuals = data.map(d => d.actual).filter(v => Number.isFinite(v));
  const budgets = data.map(d => d.budget).filter(v => Number.isFinite(v));
  const avgActual = actuals.length ? actuals.reduce((a, b) => a + b, 0) / actuals.length : null;
  const avgBudget = budgets.length ? budgets.reduce((a, b) => a + b, 0) / budgets.length : null;
  const totalActual = actuals.length ? actuals.reduce((a, b) => a + b, 0) : null;
  const totalBudget = budgets.length ? budgets.reduce((a, b) => a + b, 0) : null;
  const maxActual = actuals.length ? Math.max(...actuals) : null;
  const maxBudget = budgets.length ? Math.max(...budgets) : null;
  const minActual = actuals.length ? Math.min(...actuals) : null;
  const minBudget = budgets.length ? Math.min(...budgets) : null;
  const lastActual = actuals.length ? actuals[actuals.length - 1] : null;
  const lastBudget = budgets.length ? budgets[budgets.length - 1] : null;
  const variance = getVariance(kpi, period, fy);

  const statCard = (label, actual, budget, fmt) => (
    <div style={{ ...cardS, padding: "10px 14px", textAlign: "center" }}>
      <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: T.muted }}>{label}</div>
      <div style={{ fontSize: "15px", fontWeight: 600, color: T.ink }}>{fmt(actual)}</div>
      {budget !== null && <div style={{ fontSize: "11px", color: T.muted }}>Target: {fmt(budget)}</div>}
    </div>
  );

  return (
    <Modal title={`Analysis: ${kpi.name}`} subtitle={`${kpi.units} · ${DIRECTIONS.find(d => d.value === kpi.direction)?.label}`} icon={<Lightbulb size={17} />} onClose={onClose} width={680} footer={<button onClick={onClose} style={btnPrimary}>Close</button>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px", marginBottom: "18px" }}>
        {statCard("Status", getStatus(kpi, period, fy).label, null, (val) => val)}
        {statCard("Variance", variance !== null ? fmtValue(variance, kpi, { signed: true, bare: true }) : "—", null, (val) => val)}
        {statCard("Avg Actual", avgActual, avgBudget, (val) => val !== null ? fmtValue(val, kpi, { bare: true }) : "—")}
        {statCard("Total Actual", totalActual, totalBudget, (val) => val !== null ? fmtValue(val, kpi, { bare: true }) : "—")}
        {statCard("Last Actual", lastActual, lastBudget, (val) => val !== null ? fmtValue(val, kpi, { bare: true }) : "—")}
        {statCard("Max Actual", maxActual, maxBudget, (val) => val !== null ? fmtValue(val, kpi, { bare: true }) : "—")}
        {statCard("Min Actual", minActual, minBudget, (val) => val !== null ? fmtValue(val, kpi, { bare: true }) : "—")}
      </div>
      <div style={{ ...cardS, background: T.panel, marginBottom: "12px" }}>
        <div style={{ fontSize: "12.5px", color: T.body, lineHeight: 1.7 }}>
          <strong>KPI Details:</strong> {kpi.meaning || "No meaning defined."}
          {kpi.measured && <><br /><strong>Measurement:</strong> {kpi.measured}</>}
          {kpi.source && <><br /><strong>Source:</strong> {kpi.source}</>}
        </div>
      </div>
      <div style={{ fontSize: "12.5px", color: T.muted, padding: "10px 14px", background: T.raised, borderRadius: "8px" }}>
        {actuals.length === 0 ? "No data recorded yet." : `${actuals.length} months of data`}
        {kpi.notes && <><br /><strong>Notes:</strong> {kpi.notes}</>}
      </div>
    </Modal>
  );
};

const AddActionModal = ({ kpi, period, fy, categoryName, tabName, userId, onClose, onSaved }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !userId) return;
    setSaving(true);
    try {
      const action = {
        id: uid(), title: title.trim(), description: description.trim(),
        status: "Not Done", assignedTo: assignedTo.trim() || "", dueDate: dueDate || "",
        sourceKpi: kpi.name, sourceCategory: categoryName, sourceTab: tabName,
        sourceModule: "Marketing & Sales",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      const gcRef = doc(db, "governanceCalendar", userId);
      const gcSnap = await getDoc(gcRef);
      let data = gcSnap.exists() ? gcSnap.data() : { meetings: [] };
      let meetings = data.meetings || [];
      let marketingMeeting = meetings.find(m => m.title?.includes("Marketing") || m.title?.includes("Sales") || m.category === "Marketing & Sales");
      if (!marketingMeeting) {
        marketingMeeting = { id: uid(), title: "Marketing & Sales Review", date: new Date().toISOString().split("T")[0], category: "Marketing & Sales", actions: [], attendees: [] };
        meetings.push(marketingMeeting);
      }
      if (!marketingMeeting.actions) marketingMeeting.actions = [];
      marketingMeeting.actions.push(action);
      await setDoc(gcRef, { ...data, meetings, updatedAt: new Date().toISOString() }, { merge: true });
      onSaved?.(marketingMeeting.title);
      onClose();
    } catch (err) { console.error("Error saving action:", err); alert("Failed to save action"); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={`Action for ${kpi.name}`} subtitle={`${categoryName} · Status: ${getStatus(kpi, period, fy).label}`} icon={<Plus size={17} />} onClose={onClose} width={520}
      footer={<>
        <button onClick={onClose} style={btnGhost}>Cancel</button>
        <button onClick={handleSave} disabled={!title.trim() || saving} style={{ ...btnPrimary, opacity: !title.trim() || saving ? 0.6 : 1 }}>
          {saving ? "Saving..." : "Add Action"}
        </button>
      </>}>
      <div style={{ marginBottom: "12px" }}>
        <label style={labelS}>Action Title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Increase marketing spend" style={inputS} />
      </div>
      <div style={{ marginBottom: "12px" }}>
        <label style={labelS}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" placeholder="What needs to be done?" style={{ ...inputS, resize: "vertical" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label style={labelS}>Assigned To</label>
          <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Person responsible" style={inputS} />
        </div>
        <div>
          <label style={labelS}>Due Date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputS} />
        </div>
      </div>
      <div style={{ ...cardS, background: T.panel, marginTop: "12px", fontSize: "12.5px", color: T.muted }}>
        <Info size={13} style={{ marginRight: "6px" }} />
        This action will be added to the Integrated Actions module and tracked in your Marketing & Sales review.
      </div>
    </Modal>
  );
};

const NotesModal = ({ kpi, readOnly, onClose, onSave }) => {
  const [notes, setNotes] = useState(kpi.notes || "");
  return (
    <Modal title={`Notes for ${kpi.name}`} icon={<StickyNote size={17} />} onClose={onClose} width={480}
      footer={<>
        {!readOnly && <button onClick={() => { onSave(notes); onClose(); }} style={btnPrimary}><Save size={13} /> Save Notes</button>}
        <button onClick={onClose} style={btnGhost}>Close</button>
      </>}>
      <div>
        <label style={labelS}>General notes</label>
        {readOnly ? (
          <div style={{ ...cardS, minHeight: "100px", whiteSpace: "pre-wrap", fontSize: "13.5px", color: notes ? T.body : T.faint }}>
            {notes || "No notes yet."}
          </div>
        ) : (
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="6" placeholder="Add general notes about this KPI..." style={{ ...inputS, resize: "vertical" }} />
        )}
      </div>
    </Modal>
  );
};

const MarketingDataModal = ({ mode, onClose, onSave, isInvestorView }) => {
  const [data, setData] = useState(null);
  const renderPanel = () => {
    switch (mode) {
      case "top3": return <Top3Concentration data={data} isInvestorView={isInvestorView} />;
      case "channelPerf": return <ChannelPerformanceTable data={data} isInvestorView={isInvestorView} />;
      case "riskAnalysis": return <ConcentrationRiskBarChart data={data} isInvestorView={isInvestorView} />;
      case "campaignPerf": return <CampaignPerformanceTable data={data} isInvestorView={isInvestorView} />;
      default: return <div>Unknown panel</div>;
    }
  };
  return (
    <Modal title={`Edit Marketing Data`} subtitle={`${mode} view`} icon={<Database size={17} />} onClose={onClose} width={820}
      footer={<>
        {!isInvestorView && <button onClick={() => onSave(mode, data)} style={btnPrimary}><Save size={13} /> Save Data</button>}
        <button onClick={onClose} style={btnGhost}>Close</button>
      </>}>
      {renderPanel()}
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Main
   ════════════════════════════════════════════════════════════════════════ */
const PREFS_KEY = "marketingSales.addData.prefs";
const META_DOC = "marketingSalesKpiMeta";

const MarketingSales = () => {
  const [user, setUser] = useState(null);
  const [fyStartMonth, setFyStartMonth] = useState(0);
  const [docs, setDocs] = useState({});
  const [meta, setMeta] = useState({ kpis: {}, custom: [], hiddenTabs: [], hiddenKpis: [] });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [dataPrefs, setDataPrefs] = useState(null);
  const [showAbout, setShowAbout] = useState(false);

  const [isInvestorView, setIsInvestorView] = useState(false);
  const [viewingSMEId, setViewingSMEId] = useState(null);
  const [viewingSMEName, setViewingSMEName] = useState("");
  const [viewOrigin, setViewOrigin] = useState("investor");

  const [activeTabId, setActiveTabId] = useState(TAB_DEFS[0].id);
  const [period, setPeriod] = useState("month");

  const [filters, setFilters] = useState({ category: "all", kpi: "all", units: "all", status: "all" });
  const [openFilter, setOpenFilter] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [widths, setWidths] = useState(() => ({
    ...Object.fromEntries(COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].width])),
    [ACTIONS_KEY]: 196,
  }));
  const [visibility, setVisibility] = useState(() => Object.fromEntries(COLUMN_ORDER.map((k) => [k, true])));
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const resizing = useRef(null);

  const [colOrder, setColOrder] = useState(COLUMN_ORDER);

  const [infoKpi, setInfoKpi] = useState(null);
  const [chartKpi, setChartKpi] = useState(null);
  const [analysisKpi, setAnalysisKpi] = useState(null);
  const [actionKpi, setActionKpi] = useState(null);
  const [notesKpi, setNotesKpi] = useState(null);
  const [addFlow, setAddFlow] = useState(null);
  const [manageTabs, setManageTabs] = useState(false);
  const [marketingPanel, setMarketingPanel] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const [pipelineRecords, setPipelineRecords] = useState([]);

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
    window.__setMarketingPanel = (mode) => { setMarketingPanel(mode); };
    return () => { delete window.__setMarketingPanel; };
  }, []);

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
    const unsub = onAuthStateChanged(auth, (cu) => setUser(isInvestorView && viewingSMEId ? { uid: viewingSMEId } : cu));
    return () => unsub();
  }, [isInvestorView, viewingSMEId]);

  const loadAll = useCallback(async (uid_) => {
    const out = {};
    const keys = ["pipeline", "concentration", "sustainability"];
    await Promise.all(keys.map(async (k) => {
      try {
        const snap = await getDoc(doc(db, "marketingData", `${uid_}${DOC[k]}`));
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
        const [loaded, metaSnap] = await Promise.all([loadAll(user.uid), getDoc(doc(db, "marketingData", `${user.uid}_${META_DOC}`))]);
        setDocs(loaded);
        if (metaSnap.exists()) setMeta({ kpis: {}, custom: [], hiddenTabs: [], hiddenKpis: [], ...metaSnap.data() });
      } catch (err) {
        console.error("Error loading marketing data:", err);
        notify("error", `Could not load your marketing data: ${errText(err)}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, loadAll]);

  const persistMeta = async (next) => {
    setMeta(next);
    if (!user?.uid || isInvestorView) return;
    try {
      await setDoc(doc(db, "marketingData", `${user.uid}_${META_DOC}`), { ...next, userId: user.uid, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error("Error saving KPI meta:", err);
      notify("error", `Changes could not be saved: ${errText(err)}`);
    }
  };

  const deleteKpi = (kpiId) => {
    if (!window.confirm(`Delete this KPI? It will be removed from the dashboard.`)) return;
    persistMeta({ ...meta, hiddenKpis: Array.from(new Set([...(meta.hiddenKpis || []), kpiId])) });
    notify("success", "KPI removed from the dashboard.");
  };

  const writeDoc = async (src, mutate) => {
    if (!user?.uid || isInvestorView) return;
    const next = JSON.parse(JSON.stringify(docs[src] || {}));
    mutate(next);
    next.userId = user.uid;
    next.lastUpdated = new Date().toISOString();
    setDocs((p) => ({ ...p, [src]: next }));
    try {
      await setDoc(doc(db, "marketingData", `${user.uid}${DOC[src]}`), next, { merge: true });
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

  const saveMarketingPanelData = async (mode, data) => {
    if (!user?.uid || isInvestorView) return;
    try {
      const srcMap = { top3: "concentration", channelPerf: "concentration", riskAnalysis: "concentration", campaignPerf: "sustainability", pipelineTable: "pipeline" };
      const src = srcMap[mode];
      if (!src) { notify("error", "Unknown panel type"); return; }
      await writeDoc(src, (d) => { d[mode] = data; });
      notify("success", "Marketing data saved.");
    } catch (err) {
      console.error("Error saving marketing data:", err);
      notify("error", `Could not save: ${errText(err)}`);
    }
  };

  // Used by panel tables for per-row edits and deletes (persist immediately)
  const handlePanelRowUpdate = async (mode, nextData) => {
    await saveMarketingPanelData(mode, nextData);
  };
  const handlePanelRowDelete = async (mode, nextData) => {
    await saveMarketingPanelData(mode, nextData);
  };

  const tabs = useMemo(() => {
    const withCustom = TAB_DEFS.map((tab) => {
      const cats = tab.categories.map((c) => ({ ...c, kpis: [...(c.kpis || [])] }));
      (meta.custom || []).filter((c) => c.tabId === tab.id).forEach((c) => {
        const kpi = K({ ...c, actual: () => null });
        kpi.custom = true;
        kpi.field = { src: "custom" };
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
              const saved = meta.kpis[kpi.id]?.entries?.[`M:${m.month}`];
              entries[m.key] = { actual: saved?.actual ?? null, budget: saved?.budget ?? null };
            } else if (kpi.field?.src && kpi.field?.a) {
              const src = kpi.field.src;
              const aPath = kpi.field.a;
              const bPath = kpi.field.b;
              const aRaw = aPath ? atPath(docs[src], aPath)?.[m.month] : null;
              const bRaw = bPath ? atPath(docs[src], bPath)?.[m.month] : null;
              const aVal = parseNum(aRaw);
              const bVal = parseNum(bRaw);
              entries[m.key] = {
                actual: aVal,
                budget: bVal !== null ? bVal : kpi.benchmark,
              };
            } else {
              const ctx = buildContext(docs, m.month);
              const b = kpi.budget ? kpi.budget(ctx) : null;
              entries[m.key] = {
                actual: kpi.actual ? kpi.actual(ctx) : null,
                budget: b !== null && b !== undefined ? b : kpi.benchmark,
              };
            }
          });
          const saved = meta.kpis[kpi.id] || {};
          return {
            ...kpi,
            entries,
            meaning: saved.meaning ?? kpi.meaning,
            measured: saved.measured ?? kpi.measured,
            notes: saved.notes || "",
            periodNotes: saved.periodNotes || {},
            chart: saved.chart || null,
            source: kpi.source || null,
          };
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

  const updateKpiMeta = (kpiId, patch) => persistMeta({ ...meta, kpis: { ...meta.kpis, [kpiId]: { ...(meta.kpis[kpiId] || {}), ...patch } } });

  const targetSource = (kpi, period) => {
    const months = fyMonths(fy.startYear, fy.startMonth);
    const anyCaptured = months.some((m) => {
      if (kpi.custom) return meta.kpis[kpi.id]?.entries?.[`M:${m.month}`]?.budget != null;
      if (kpi.field?.src && kpi.field?.b) {
        const bRaw = atPath(docs[kpi.field.src], kpi.field.b)?.[m.month];
        return parseNum(bRaw) !== null;
      }
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
      (cat.kpis || []).forEach((kpi) =>
        rows.push({
          kpi, categoryName: cat.name, tabName: activeTab.name,
          status: getStatus(kpi, period, fy),
          variance: getVariance(kpi, period, fy),
          values: periodValues(kpi, period, fy),
          source: targetSource(kpi, period),
        })
      );
    });
    return rows;
  }, [activeTab, period, fy, docs, meta]);

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
      (filters.status === "all" || r.status.label === filters.status)
    );

    const get = {
      category: (r) => r.categoryName,
      kpi: (r) => r.kpi.name,
      units: (r) => r.kpi.units,
      budget: (r) => Number(r.values.budget) || 0,
      actual: (r) => Number(r.values.actual) || 0,
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

  const visibleColumns = colOrder.filter((k) => visibility[k]);
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

  const handleDragStart = (e, key) => { e.dataTransfer.setData("text/plain", key); e.dataTransfer.effectAllowed = "move"; };
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

  const toggleSort = (key) => setSortConfig((p) => ({ key, direction: p.key === key && p.direction === "asc" ? "desc" : "asc" }));
  const clearFilters = () => {
    setFilters({ category: "all", kpi: "all", units: "all", status: "all" });
    setSortConfig({ key: null, direction: "asc" });
  };

  const downloadCSV = () => {
    const p = PERIOD_PREFIX[period];
    const lines = [["Section", "Category", "KPI", "Units", `${p} Target`, `${p} Actual`, `${p} Variance`, "Status"]];
    tabs.forEach((tab) =>
      tab.categories.forEach((cat) =>
        (cat.kpis || []).forEach((kpi) => {
          const v = periodValues(kpi, period, fy);
          lines.push([tab.name, cat.name, `"${kpi.name}"`, kpi.units, v.budget ?? "", v.actual ?? "", getVariance(kpi, period, fy) ?? "", getStatus(kpi, period, fy).label]);
        })
      )
    );
    const blob = new Blob([lines.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marketing-sales-${period}-FY${fyLabel(fy.startYear, fy.startMonth).replace("/", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exitInvestorView = () => {
    const origin = sessionStorage.getItem("viewOrigin");
    ["viewingSMEId", "viewingSMEName", "investorViewMode", "viewOrigin"].forEach((k) => sessionStorage.removeItem(k));
    window.location.href = origin === "cmf" ? "/cmf-cohorts" : origin === "catalyst" ? "/catalyst/cohorts" : "/my-cohorts";
  };

  const thS = {
    padding: 0, background: T.header, borderBottom: `2px solid ${T.header}`,
    borderRight: "1px solid rgba(255,255,255,0.14)", position: "relative", verticalAlign: "top",
  };
  const tdS = { padding: "13px 14px", color: T.body, fontSize: "14px", overflow: "hidden", borderRight: `1px solid ${T.lineSoft}` };
  const iconBtn = (c) => ({ background: "none", border: "none", cursor: "pointer", padding: "5px", borderRadius: "6px", color: c, display: "inline-flex", alignItems: "center" });

  const handlePipelineRecordsChange = (records) => setPipelineRecords(records);

  if (loading) {
    return <div style={{ padding: "80px", textAlign: "center", color: T.body, fontSize: "14px" }}>Loading marketing & sales performance…</div>;
  }

  const panels = (activeTab?.categories || []).map((c) => c.panel).filter(Boolean);
  const userName = user?.displayName || user?.email || "User";

  return (
    <div style={{ minHeight: "100vh", padding: "28px", boxSizing: "border-box", background: T.bg, color: T.body }}>
      {isInvestorView && (
        <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderLeft: `3px solid ${T.accent}`, padding: "13px 18px", borderRadius: "10px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "10px", color: T.accent, fontWeight: 500, fontSize: "14px" }}>
            <Eye size={15} />
            {viewOrigin === "catalyst" ? "Catalyst view" : viewOrigin === "cmf" ? "Facilitator view" : "Investor view"}: {viewingSMEName}'s Marketing & Sales Performance
          </span>
          <button onClick={exitInvestorView} style={btnGhost}><ArrowLeft size={13} /> Back</button>
        </div>
      )}

      {notification && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: notification.type === "error" ? T.redBg : T.greenBg, border: `1px solid ${notification.type === "error" ? T.red : T.green}33`, color: notification.type === "error" ? T.red : T.green }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {notification.type === "error" ? <XCircle size={14} /> : <CheckCircle2 size={14} />} {notification.message}
          </span>
          <button onClick={() => setNotification(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={14} /></button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ color: T.accent, fontSize: "27px", fontWeight: 650, margin: 0, letterSpacing: "-0.5px" }}>Marketing & Sales Performance Summary</h1>
        <button onClick={() => setShowAbout((v) => !v)} style={btnQuiet}>
          {showAbout ? "See less" : "See more"} {showAbout ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>
      <p style={{ fontSize: "13.5px", color: T.body, margin: "0 0 20px", display: "flex", alignItems: "center", gap: "7px" }}>
        <Calendar size={13} /> Financial year {fyLabel(fy.startYear, fy.startMonth)} · {MONTHS[fy.startMonth]} → {MONTHS[(fy.startMonth + 11) % 12]}
      </p>

      {showAbout && (
        <div style={{ background: T.panel, border: `1px solid ${T.line}`, padding: "22px", borderRadius: "12px", marginBottom: "22px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          <div>
            <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "10px", fontSize: "14.5px", fontWeight: 600 }}>What this dashboard does</h3>
            <ul style={{ color: T.body, fontSize: "13.5px", lineHeight: 1.75, margin: 0, paddingLeft: "18px" }}>
              <li>Assesses pipeline visibility, quality, and concentration</li>
              <li>Evaluates demand risk and market exposure</li>
              <li>Monitors lead generation effectiveness and conversion rates</li>
              <li>Measures customer acquisition cost and marketing ROI</li>
              <li>Tracks sales cycle efficiency and pipeline velocity</li>
            </ul>
          </div>
          <div>
            <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "10px", fontSize: "14.5px", fontWeight: 600 }}>What it doesn't do</h3>
            <ul style={{ color: T.body, fontSize: "13.5px", lineHeight: 1.75, margin: 0, paddingLeft: "18px" }}>
              <li>Run marketing campaigns or ad management</li>
              <li>Manage CRM or customer relationship tracking</li>
              <li>Track social media engagement or content scheduling</li>
              <li>Email marketing automation or lead nurturing</li>
              <li>SEO optimization or website analytics management</li>
            </ul>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "2px", borderBottom: `1px solid ${T.lineStrong}`, marginBottom: "18px", flexWrap: "wrap", alignItems: "center" }}>
        {visibleTabs.map((tab) => {
          const on = tab.id === activeTab?.id;
          const counts = tab.categories.flatMap((c) => c.kpis || []).reduce((acc, k) => {
            const key = getStatus(k, period, fy).key;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});
          return (
            <button key={tab.id} onClick={() => { setActiveTabId(tab.id); clearFilters(); }} style={{ padding: "12px 20px", background: "none", border: "none", cursor: "pointer", fontSize: "14.5px", fontWeight: on ? 600 : 500, color: on ? T.accent : T.body, borderBottom: on ? `2px solid ${T.accent}` : "2px solid transparent", display: "flex", alignItems: "center", gap: "9px", fontFamily: "inherit", marginBottom: "-1px" }}>
              {tab.name}
              <span style={{ display: "inline-flex", gap: "4px" }}>
                {counts.red > 0 && <span style={{ fontSize: "11px", padding: "1px 7px", borderRadius: "999px", background: T.redBg, color: T.red, fontWeight: 700 }}>{counts.red}</span>}
                {counts.amber > 0 && <span style={{ fontSize: "11px", padding: "1px 7px", borderRadius: "999px", background: T.amberBg, color: T.amber, fontWeight: 700 }}>{counts.amber}</span>}
              </span>
            </button>
          );
        })}
        {!isInvestorView && (
          <>
            <button onClick={() => setManageTabs(true)} title="Show or hide dashboard tabs" style={{ ...btnQuiet, marginLeft: "auto", marginBottom: "4px", padding: "6px 12px", fontSize: "12.5px", color: T.muted }}>
              <Settings2 size={13} /> Manage Tabs
            </button>
          </>
        )}
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
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: "250px", background: T.bg, border: `1px solid ${T.lineStrong}`, borderRadius: "10px", boxShadow: "0 12px 30px rgba(45,32,28,0.16)", padding: "8px", zIndex: 401 }}>
                    {COLUMN_ORDER.map((key) => {
                      const def = COLUMN_DEFS[key];
                      return (
                        <div key={key} onClick={() => def.hideable && setVisibility((p) => ({ ...p, [key]: !p[key] }))} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 9px", borderRadius: "7px", cursor: def.hideable ? "pointer" : "not-allowed", opacity: def.hideable ? 1 : 0.5, fontSize: "13.5px", color: T.body }}>
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
            <ClipboardList size={14} /> Marketing & Sales Overview <ExternalLink size={11} />
          </button>
          <button onClick={() => setShowReport(true)} title="Generate a Word report" style={btnGhost}>
            <FileText size={14} /> Report
          </button>
          {!isInvestorView && (
            <button onClick={() => setAddFlow("choose")} style={btnPrimary}><Plus size={14} /> Add KPI/Data</button>
          )}
        </div>
      </div>

      {isKpiTableTab && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
          <div style={{ display: "inline-flex", background: T.raised, borderRadius: "10px", padding: "3px" }}>
            {PERIODS.map((p) => {
              const on = p.key === period;
              return (
                <button key={p.key} onClick={() => setPeriod(p.key)} style={{ padding: "7px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13.5px", fontWeight: 600, border: "none", fontFamily: "inherit", background: on ? T.bg : "transparent", color: on ? T.accent : T.body, boxShadow: on ? "0 1px 3px rgba(45,32,28,0.14)" : "none" }}>
                  {p.label}
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: "12.5px", color: T.muted }}>Showing {PERIOD_PREFIX[period].toLowerCase()} target, actual and variance</span>
        </div>
      )}

      {allRows.length > 0 && isKpiTableTab && (
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
                      <th key={key} draggable onDragStart={(e) => handleDragStart(e, key)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, key)} style={{ ...thS, width: widths[key], userSelect: "none" }}>
                        <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "6px", alignItems: align }}>
                          <span style={{ display: "flex", alignItems: "flex-start", gap: "5px" }}>
                            <span style={{ display: "inline-flex", flexDirection: "column", alignItems: align, lineHeight: 1.3, cursor: "grab" }}>
                              {lines.map((l, i) => (
                                <span key={i} style={{ fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", color: i < lines.length - 1 ? "rgba(255,255,255,0.82)" : "#ffffff" }}>{l}</span>
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
                              <FilterDropdown options={optionsFor(key)} value={filters[key] || "All"} onChange={(val) => setFilters(p => ({ ...p, [key]: val === "All" ? "" : val }))} onClose={() => {}} />
                            )}
                          </span>
                        </div>
                        <div onMouseDown={(e) => startResize(e, key)} title="Drag to resize" style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
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
                    <div onMouseDown={(e) => startResize(e, ACTIONS_KEY)} style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                  </th>
                </tr>
              </thead>

              <tbody>
                {groupedRows.length === 0 ? (
                  <tr><td colSpan={visibleColumns.length + 1} style={{ ...tdS, textAlign: "center", padding: "56px 16px", color: T.muted, borderRight: "none" }}>No KPIs match the current filters.</td></tr>
                ) : (
                  groupedRows.map((group) =>
                    group.items.map((row, idx) => {
                      const { kpi, categoryName, tabName, status, variance, values } = row;
                      const fav = varianceFavourable(kpi, variance);
                      const last = idx === group.items.length - 1;
                      const rowTd = { ...tdS, borderBottom: last ? `2px solid ${T.lineStrong}` : `1px solid ${T.lineSoft}` };
                      const cell = (key, content) =>
                        visibility[key] ? (
                          <td key={key} style={{ ...rowTd, width: widths[key], textAlign: COLUMN_DEFS[key].align === "center" ? "center" : "left" }}>{content}</td>
                        ) : null;

                      return (
                        <tr key={kpi.id}>
                          {visibility.category && idx === 0 && (
                            <td rowSpan={group.items.length} style={{ ...tdS, width: widths.category, background: T.panel, fontWeight: 700, color: T.accent, verticalAlign: "middle", borderBottom: `2px solid ${T.lineStrong}`, borderRight: `1px solid ${T.lineStrong}`, fontSize: "13.5px" }}>
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
                          {cell("variance", variance === null || kpi.options ? <span style={{ color: T.faint }}>—</span> : <span style={{ fontWeight: 700, color: fav ? T.green : T.red, fontVariantNumeric: "tabular-nums" }}>{fmtValue(variance, kpi, { signed: true, bare: true })}</span>)}
                          {cell("status", <span style={{ display: "inline-flex" }} title={status.label}><StatusIcon status={status} size={22} /></span>)}

                          <td style={{ ...rowTd, width: widths[ACTIONS_KEY], textAlign: "center", borderRight: "none" }}>
                            <div style={{ display: "flex", gap: "1px", justifyContent: "center", alignItems: "center" }}>
                              <button onClick={() => setChartKpi(kpi)} style={iconBtn(T.body)} title="Trend chart"><LineChartIcon size={16} /></button>
                              <button onClick={() => setAnalysisKpi(kpi)} style={iconBtn(T.body)} title="Summary analysis across all timeframes"><Lightbulb size={16} /></button>
                              {!isInvestorView && (
                                <button onClick={() => setActionKpi({ kpi, categoryName, tabName })} style={iconBtn(status.color)} title={`Add action (${status.label})`}><Plus size={16} /></button>
                              )}
                              <button onClick={() => setNotesKpi(kpi)} style={iconBtn(kpi.notes ? T.amber : T.body)} title="Notes"><StickyNote size={16} /></button>
                              {!isInvestorView && (
                                <button onClick={() => deleteKpi(kpi.id)} style={iconBtn(T.red)} title="Delete KPI"><Trash2 size={16} /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: "11px 16px", borderTop: `1px solid ${T.lineStrong}`, background: T.panel, fontSize: "12px", color: T.body, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <span>{activeTab?.categories.length} categories · a "Benchmark" target is the published figure, not one you set</span>
            <span style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><CheckCircle2 size={13} color={T.green} /> On target</span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><AlertTriangle size={13} color={T.amber} /> Needs attention</span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><XCircle size={13} color={T.red} /> Critical</span>
            </span>
          </div>
        </div>
      )}

      {!isKpiTableTab && panels.includes("top3") && (
        <div style={{ ...cardS, marginBottom: "20px" }}>
          <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "15px", fontSize: "15px", fontWeight: 600 }}>Top 3 Concentration</h3>
          <Top3Concentration
            isInvestorView={isInvestorView}
            onUpdate={handlePanelRowUpdate}
            onDeleteItem={handlePanelRowDelete}
          />
        </div>
      )}
      {!isKpiTableTab && panels.includes("channelPerf") && (
        <div style={{ ...cardS, marginBottom: "20px" }}>
          <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "15px", fontSize: "15px", fontWeight: 600 }}>Channel Performance</h3>
          <ChannelPerformanceTable
            isInvestorView={isInvestorView}
            onUpdate={handlePanelRowUpdate}
            onDeleteItem={handlePanelRowDelete}
          />
        </div>
      )}
      {!isKpiTableTab && panels.includes("riskAnalysis") && (
        <div style={{ ...cardS, background: T.panel, marginBottom: "20px" }}>
          <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "15px", fontSize: "15px", fontWeight: 600 }}>Concentration Risk Analysis</h3>
          <ConcentrationRiskBarChart
            isInvestorView={isInvestorView}
            onUpdate={handlePanelRowUpdate}
            onDeleteItem={handlePanelRowDelete}
          />
        </div>
      )}
      {!isKpiTableTab && panels.includes("campaignPerf") && (
        <div style={{ ...cardS, marginBottom: "20px" }}>
          <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "15px", fontSize: "15px", fontWeight: 600 }}>Campaign Performance</h3>
          <CampaignPerformanceTable
            isInvestorView={isInvestorView}
            onUpdate={handlePanelRowUpdate}
            onDeleteItem={handlePanelRowDelete}
          />
        </div>
      )}
      {activeTabId === "pipeline-visibility" && (
        <PipelineTable
          currentUser={user}
          isInvestorView={isInvestorView}
          onDataChange={handlePipelineRecordsChange}
          onEditFromDashboard={!isInvestorView ? () => setAddFlow("data") : undefined}
        />
      )}

      {infoKpi && <KpiInfoModal kpi={infoKpi} readOnly={isInvestorView} onClose={() => setInfoKpi(null)} onSave={(patch) => { updateKpiMeta(infoKpi.id, patch); setInfoKpi({ ...infoKpi, ...patch }); notify("success", "KPI details updated."); }} />}
      {chartKpi && <TrendChartModal kpi={chartKpi} period={period} fy={fy} readOnly={isInvestorView} onClose={() => setChartKpi(null)} onSaveNote={(key, text) => { const notes = { ...(chartKpi.periodNotes || {}) }; if (text.trim()) notes[key] = text.trim(); else delete notes[key]; updateKpiMeta(chartKpi.id, { periodNotes: notes }); setChartKpi({ ...chartKpi, periodNotes: notes }); }} onSaveChart={(chart) => { updateKpiMeta(chartKpi.id, { chart }); setChartKpi({ ...chartKpi, chart }); }} />}
      {analysisKpi && <AnalysisModal kpi={analysisKpi} period={period} fy={fy} onClose={() => setAnalysisKpi(null)} />}
      {actionKpi && <AddActionModal kpi={actionKpi.kpi} period={period} fy={fy} categoryName={actionKpi.categoryName} tabName={actionKpi.tabName} userId={user?.uid} onClose={() => setActionKpi(null)} onSaved={(m) => notify("success", `Action added to "${m}" and Integrated Actions.`)} />}
      {notesKpi && <NotesModal kpi={notesKpi} readOnly={isInvestorView} onClose={() => setNotesKpi(null)} onSave={(notes) => { updateKpiMeta(notesKpi.id, { notes }); setNotesKpi({ ...notesKpi, notes }); }} />}

      {marketingPanel && (
        <MarketingDataModal mode={marketingPanel} onClose={() => setMarketingPanel(null)} onSave={saveMarketingPanelData} isInvestorView={isInvestorView} />
      )}

      {manageTabs && (
        <Modal title="Manage Dashboard Tabs" subtitle="Show or hide a tab from the dashboard" icon={<Settings2 size={17} />} onClose={() => setManageTabs(false)} width={560} footer={<button onClick={() => setManageTabs(false)} style={btnPrimary}>Done</button>}>
          {tabs.map((t) => {
            const hidden = (meta.hiddenTabs || []).includes(t.id);
            const count = t.categories.flatMap((c) => c.kpis || []).length;
            return (
              <div key={t.id} style={{ ...cardS, marginBottom: "10px", opacity: hidden ? 0.6 : 1, display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <div style={{ fontSize: "14.5px", fontWeight: 600, color: T.accent }}>{t.name} {hidden && <span style={{ fontSize: "11.5px", fontWeight: 500, color: T.muted }}>· hidden</span>}</div>
                  <div style={{ fontSize: "12.5px", color: T.muted }}>{t.categories.length} categories · {count} KPIs</div>
                </div>
                <button onClick={() => persistMeta({ ...meta, hiddenTabs: hidden ? (meta.hiddenTabs || []).filter((x) => x !== t.id) : [...(meta.hiddenTabs || []), t.id] })} disabled={!hidden && visibleTabs.length <= 1} style={{ ...btnGhost, padding: "7px 12px", fontSize: "12.5px", opacity: !hidden && visibleTabs.length <= 1 ? 0.4 : 1 }}>
                  {hidden ? <><Eye size={13} /> Show</> : <><EyeOff size={13} /> Hide</>}
                </button>
              </div>
            );
          })}
          <p style={{ fontSize: "12.5px", color: T.muted, marginTop: "10px", marginBottom: 0, display: "flex", alignItems: "flex-start", gap: "6px" }}>
            <Info size={12} style={{ marginTop: "2px", flexShrink: 0 }} />
            Tabs are built in, so they hide rather than delete — the underlying marketing data is shared with the rest of the platform.
          </p>
        </Modal>
      )}

      {addFlow === "choose" && <AddChooser onClose={() => setAddFlow(null)} onPick={(k) => setAddFlow(k)} />}

      {addFlow === "data" && (
        <AddDataWizard
          tabs={tabs} fy={fy} docs={docs} currentTabId={activeTabId}
          prefs={dataPrefs} onSavePrefs={savePrefs}
          onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)}
          onSaveField={saveKpiField}
          onSavePanel={saveMarketingPanelData}
        />
      )}

      {addFlow === "kpi" && (
        <AddKpiWizard tabs={tabs} currentTabId={activeTabId} onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)} onSave={async (kpi) => { await persistMeta({ ...meta, custom: [...(meta.custom || []), kpi] }); notify("success", "KPI created."); }} />
      )}

      {showReport && (
        <MarketingReportGenerator
          tabs={visibleTabs} fy={fy} period={period}
          userId={user?.uid} userName={userName}
          pipelineRecords={pipelineRecords}
          getStatusFn={getStatus}
          periodValuesFn={periodValues}
          getVarianceFn={getVariance}
          statusFromPairFn={statusFromPair}
          trimNumFn={trimNum}
          fmtValueFn={fmtValue}
          fyLabelFn={fyLabel}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
};

export default MarketingSales;