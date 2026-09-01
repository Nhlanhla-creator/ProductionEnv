"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Chart, Pie, Bar } from "react-chartjs-2";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  Eye,
  LineChart as LineChartIcon,
  Lightbulb,
  Plus,
  StickyNote,
  X,
  Save,
  Pencil,
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ClipboardList,
  Download,
  RefreshCw,
  Columns3,
  ExternalLink,
  Square,
  CheckSquare,
  ArrowLeft,
  Calendar,
  SlidersHorizontal,
  Database,
  Sparkles,
  Sigma,
  Settings2,
  EyeOff,
  Palette,
  Check,
  Users,
  Trash2,
  TrendingUp,
  TrendingDown,
  Settings,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { getFunctions, httpsCallable } from "firebase/functions";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const functions = getFunctions();

/* ════════════════════════════════════════════════════════════════════════════
   Tokens — shared with People Performance.
   ════════════════════════════════════════════════════════════════════════ */
const T = {
  ink: "#2d201c",
  body: "#3b2b26",
  muted: "#6b5b55",
  faint: "#8a7a74",
  line: "#ded8d4",
  lineSoft: "#e9e3df",
  lineStrong: "#b0a29b",
  bg: "#ffffff",
  panel: "#faf8f7",
  raised: "#f2eeec",
  accent: "#4a352f",
  accentSoft: "#6b4f47",
  accentTint: "#f4efec",
  header: "#33231e",
  green: "#166534",
  greenBg: "#f0fdf4",
  amber: "#92400e",
  amberBg: "#fffbeb",
  red: "#991b1b",
  redBg: "#fef2f2",
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
      year: d.getFullYear(),
      month: d.getMonth(),
      index: i,
    };
  });

const fyQuarters = (sy, sm) => {
  const months = fyMonths(sy, sm);
  return [0, 1, 2, 3].map((q) => {
    const s = months.slice(q * 3, q * 3 + 3);
    return {
      key: `Q${q + 1}`,
      label: `Q${q + 1}`,
      range: `${s[0].label} – ${s[2].label}`,
      months: s,
      index: q,
    };
  });
};
const currentMonthKey = () => {
  const d = new Date();
  return `M:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/* ─── Formatting ────────────────────────────────────────────────────────── */
const LOCALE = "en-US";
const trimNum = (n) => {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n),
    dp = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
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
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const errText = (e) => String(e?.message ?? e ?? "Unknown error");
const fmtDMY = (d) => {
  if (!d) return "";
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? "" : `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
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

/* ─── Status ────────────────────────────────────────────────────────────── */
const S = {
  green: { key: "green", label: "On target", color: T.green, bg: T.greenBg },
  amber: { key: "amber", label: "Needs attention", color: T.amber, bg: T.amberBg },
  red: { key: "red", label: "Critical", color: T.red, bg: T.redBg },
  none: { key: "none", label: "No target", color: T.faint, bg: T.raised },
};

const statusFromPair = (kpi, budget, actual) => {
  const b = Number(budget),
    a = Number(actual);
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

/* ─── Shared UI ─────────────────────────────────────────────────────────── */
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
      {rect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: rect.bottom + 8,
              left: Math.min(Math.max(rect.left - 110, 12), window.innerWidth - 250),
              width: "236px",
              background: T.ink,
              color: "#fff",
              fontSize: "12.5px",
              padding: "10px 12px",
              borderRadius: "8px",
              lineHeight: 1.5,
              zIndex: 3000,
              pointerEvents: "none",
              fontWeight: 400,
              letterSpacing: "normal",
              textTransform: "none",
              boxShadow: "0 10px 30px rgba(45,32,28,0.3)",
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </span>
  );
};

const btnBase = {
  padding: "9px 16px",
  borderRadius: "8px",
  fontSize: "13.5px",
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  fontFamily: "inherit",
};
const btnPrimary = { ...btnBase, background: T.accent, color: "#fff", border: `1px solid ${T.accent}`, fontWeight: 600 };
const btnGhost = { ...btnBase, background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}` };
const btnQuiet = { ...btnBase, background: "transparent", color: T.accent, border: "1px solid transparent" };
const inputS = {
  width: "100%",
  padding: "9px 11px",
  border: `1px solid ${T.lineStrong}`,
  borderRadius: "8px",
  fontSize: "13.5px",
  fontFamily: "inherit",
  boxSizing: "border-box",
  color: T.ink,
  background: T.bg,
  outline: "none",
};
const selectS = { ...inputS, cursor: "pointer" };
const labelS = { display: "block", fontSize: "12.5px", fontWeight: 600, color: T.accent, marginBottom: "5px" };
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "14px 16px" };
const panelTh = {
  padding: "9px 12px",
  fontSize: "11.5px",
  fontWeight: 700,
  color: "#fff",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  background: T.header,
  whiteSpace: "nowrap",
};

const Modal = ({ title, subtitle, icon, onClose, children, width = 640, footer }) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(45,32,28,0.55)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1400,
      padding: "20px",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: T.bg,
        borderRadius: "14px",
        width: "100%",
        maxWidth: `${width}px`,
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 24px 60px rgba(45,32,28,0.28)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "18px 22px 14px",
          borderBottom: `1px solid ${T.line}`,
        }}
      >
        <div style={{ display: "flex", gap: "11px", alignItems: "flex-start" }}>
          {icon && <span style={{ marginTop: "2px", color: T.accent }}>{icon}</span>}
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "17px",
                color: T.accent,
                fontWeight: 600,
                letterSpacing: "-0.2px",
              }}
            >
              {title}
            </h3>
            {subtitle && <p style={{ margin: "3px 0 0", fontSize: "13px", color: T.body }}>{subtitle}</p>}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: T.raised,
            border: "none",
            cursor: "pointer",
            color: T.body,
            width: 30,
            height: 30,
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={15} />
        </button>
      </div>
      <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1 }}>{children}</div>
      {footer && (
        <div
          style={{
            padding: "13px 22px",
            borderTop: `1px solid ${T.line}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            alignItems: "center",
            background: T.panel,
            borderRadius: "0 0 14px 14px",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  </div>
);

const DIRECTIONS = [
  { value: "higher", label: "Higher is better" },
  { value: "lower", label: "Lower is better" },
  { value: "match", label: "Matching is better" },
];

/* ─── KPI info popup ────────────────────────────────────────────────────── */
const KpiInfoModal = ({ kpi, onClose, onSave, readOnly }) => {
  const [editing, setEditing] = useState(false);
  const [meaning, setMeaning] = useState(kpi.meaning || "");
  const [measured, setMeasured] = useState(kpi.measured || "");
  const box = (v, empty, mono) => (
    <div
      style={{
        background: T.panel,
        border: `1px solid ${T.line}`,
        borderRadius: "8px",
        padding: "13px 15px",
        fontSize: mono ? "13px" : "14px",
        lineHeight: 1.65,
        color: v ? T.body : T.faint,
        fontStyle: v ? "normal" : "italic",
        whiteSpace: "pre-wrap",
        fontFamily: mono && v ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit",
      }}
    >
      {v || empty}
    </div>
  );
  return (
    <Modal
      title={kpi.name}
      subtitle="What it means and how it is measured"
      icon={<Eye size={17} />}
      onClose={onClose}
      footer={
        editing ? (
          <>
            <button
              onClick={() => {
                setMeaning(kpi.meaning || "");
                setMeasured(kpi.measured || "");
                setEditing(false);
              }}
              style={btnGhost}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave({ meaning, measured });
                setEditing(false);
              }}
              style={btnPrimary}
            >
              <Save size={13} /> Save
            </button>
          </>
        ) : (
          <>
            {!readOnly && (
              <button onClick={() => setEditing(true)} style={btnGhost}>
                <Pencil size={13} /> Edit
              </button>
            )}
            <button onClick={onClose} style={btnPrimary}>
              Close
            </button>
          </>
        )
      }
    >
      <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "18px" }}>
        {[
          `Units: ${kpi.units}`,
          DIRECTIONS.find((d) => d.value === kpi.direction)?.label,
          kpi.aggregate === "avg" ? "AVERAGE across periods" : "SUM across periods",
          kpi.benchmark !== null ? `Benchmark: ${fmtValue(kpi.benchmark, kpi)}` : null,
          kpi.source ? `Source: ${kpi.source}` : null,
        ]
          .filter(Boolean)
          .map((c) => (
            <span
              key={c}
              style={{
                fontSize: "12px",
                padding: "4px 11px",
                borderRadius: "999px",
                background: T.raised,
                color: T.body,
              }}
            >
              {c}
            </span>
          ))}
      </div>
      <div style={{ marginBottom: "18px" }}>
        <label style={labelS}>What does this KPI mean?</label>
        {editing ? (
          <textarea rows="3" value={meaning} onChange={(e) => setMeaning(e.target.value)} style={{ ...inputS, resize: "vertical" }} />
        ) : (
          box(meaning, "Not captured yet.", false)
        )}
      </div>
      <div>
        <label style={{ ...labelS, display: "flex", alignItems: "center", gap: "6px" }}>
          <Sigma size={13} /> How is this KPI measured?
        </label>
        {editing ? (
          <textarea
            rows="6"
            value={measured}
            onChange={(e) => setMeasured(e.target.value)}
            style={{ ...inputS, resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "13px" }}
          />
        ) : (
          box(measured, "Not captured yet.", true)
        )}
      </div>
    </Modal>
  );
};

/* ─── Columns ───────────────────────────────────────────────────────────── */
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

// ── Filter Dropdown component (reused) ──
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
   Marketing & Sales KPI Registry
   ════════════════════════════════════════════════════════════════════════ */
const K = (o) => ({
  id: o.id,
  name: o.name,
  units: o.units,
  direction: o.direction || "higher",
  aggregate: o.aggregate || "avg",
  meaning: o.meaning,
  measured: o.measured,
  actual: o.actual,
  budget: o.budget || (() => null),
  benchmark: o.benchmark ?? null,
  options: o.options || null,
  field: o.field || null,
  source: o.source || null,
});

const TAB_DEFS = [
  {
    id: "summary",
    name: "Marketing & Sales Performance Summary",
    categories: [
      {
        name: "Pipeline Sufficiency",
        kpis: [
          K({
            id: "totalPipelineValue",
            name: "Total Pipeline Value",
            units: "R",
            direction: "higher",
            aggregate: "sum",
            benchmark: 1000000,
            meaning: "The total value of all opportunities in your pipeline.",
            measured: "=SUM(Rev Potential) for all active opportunities",
            source: "Captured from pipeline records",
            field: { src: "pipeline", a: ["pipelineData", "pipelineValue", "actual"], b: ["pipelineData", "pipelineValue", "budget"] },
          }),
          K({
            id: "riskAdjustedValue",
            name: "Risk Adjusted Value",
            units: "R",
            direction: "higher",
            aggregate: "sum",
            benchmark: 500000,
            meaning: "The value of opportunities weighted by their probability of closing.",
            measured: "=SUM(Rev Potential × Probability %) for all active opportunities",
            source: "Captured from pipeline records",
            field: { src: "pipeline", a: ["pipelineData", "riskValue", "actual"], b: ["pipelineData", "riskValue", "budget"] },
          }),
          K({
            id: "pipelineCoverage",
            name: "Pipeline Coverage",
            units: "%",
            direction: "higher",
            aggregate: "avg",
            benchmark: 200,
            meaning: "The ratio of risk-adjusted pipeline value to target revenue.",
            measured: "=Risk Adjusted Value ÷ Target Revenue × 100%",
            source: "Calculated from pipeline data",
            field: { src: "pipeline", a: ["pipelineData", "coverage", "actual"], b: ["pipelineData", "coverage", "budget"] },
          }),
          K({
            id: "newLeads",
            name: "New Leads",
            units: "#",
            direction: "higher",
            aggregate: "sum",
            benchmark: 50,
            meaning: "The number of new leads added to the pipeline in the period.",
            measured: "=COUNT of new records in the period",
            source: "Captured from pipeline records",
            field: { src: "pipeline", a: ["pipelineData", "newLeads", "actual"], b: ["pipelineData", "newLeads", "budget"] },
          }),
          K({
            id: "conversionRate",
            name: "Conversion Rate",
            units: "%",
            direction: "higher",
            aggregate: "avg",
            benchmark: 30,
            meaning: "The percentage of opportunities that convert to closed deals.",
            measured: "=Converted Opportunities ÷ Total Opportunities × 100%",
            source: "Calculated from pipeline data",
            field: { src: "pipeline", a: ["pipelineData", "conversionRate", "actual"], b: ["pipelineData", "conversionRate", "budget"] },
          }),
          K({
            id: "salesVelocity",
            name: "Sales Velocity",
            units: "days",
            direction: "lower",
            aggregate: "avg",
            benchmark: 30,
            meaning: "The average number of days from lead creation to close.",
            measured: "=AVERAGE(Days between Created At and Signed Date)",
            source: "Calculated from pipeline records",
            field: { src: "pipeline", a: ["pipelineData", "salesVelocity", "actual"], b: ["pipelineData", "salesVelocity", "budget"] },
          }),
        ],
      },
      {
        name: "Revenue Concentration",
        kpis: [
          K({
            id: "totalMarketingSpend",
            name: "Total Marketing Spend",
            units: "R",
            direction: "lower",
            aggregate: "sum",
            benchmark: 100000,
            meaning: "The total amount spent on marketing across all channels.",
            measured: "=SUM of all channel marketing spend",
            source: "Captured from marketing data",
            field: { src: "concentration", a: ["concentrationData", "totalSpend", "actual"], b: ["concentrationData", "totalSpend", "budget"] },
          }),
          K({
            id: "overallROI",
            name: "Overall ROI",
            units: "%",
            direction: "higher",
            aggregate: "avg",
            benchmark: 200,
            meaning: "The return on investment from marketing activities.",
            measured: "=(Total Revenue - Total Spend) ÷ Total Spend × 100%",
            source: "Calculated from marketing data",
            field: { src: "concentration", a: ["concentrationData", "totalROI", "actual"], b: ["concentrationData", "totalROI", "budget"] },
          }),
        ],
      },
      {
        name: "Demand Sustainability",
        kpis: [
          K({
            id: "repeatCustomerRate",
            name: "Repeat Customer Rate",
            units: "%",
            direction: "higher",
            aggregate: "avg",
            benchmark: 40,
            meaning: "The percentage of customers who make repeat purchases.",
            measured: "=Repeat Customers ÷ Total Customers × 100%",
            source: "Captured from customer data",
            field: { src: "sustainability", a: ["sustainabilityData", "repeatRate", "actual"], b: ["sustainabilityData", "repeatRate", "budget"] },
          }),
          K({
            id: "netRetention",
            name: "Net Retention",
            units: "%",
            direction: "higher",
            aggregate: "avg",
            benchmark: 30,
            meaning: "The net customer retention rate (repeat rate minus churn rate).",
            measured: "=Repeat Customer Rate - Churn Rate",
            source: "Calculated from customer data",
            field: { src: "sustainability", a: ["sustainabilityData", "netRetention", "actual"], b: ["sustainabilityData", "netRetention", "budget"] },
          }),
          K({
            id: "campaignROI",
            name: "Campaign ROI",
            units: "%",
            direction: "higher",
            aggregate: "avg",
            benchmark: 150,
            meaning: "The return on investment from marketing campaigns.",
            measured: "=(Campaign Revenue - Campaign Cost) ÷ Campaign Cost × 100%",
            source: "Calculated from campaign data",
            field: { src: "sustainability", a: ["sustainabilityData", "campaignROI", "actual"], b: ["sustainabilityData", "campaignROI", "budget"] },
          }),
        ],
      },
    ],
  },
  {
    id: "revenue-concentration",
    name: "Revenue Concentration",
    categories: [
      {
        name: "Top 3 Concentration",
        panel: "top3",
        kpis: [],
        dataEditable: true,
      },
      {
        name: "Channel Performance",
        panel: "channelPerf",
        kpis: [],
        dataEditable: true,
      },
      {
        name: "Concentration Risk Analysis",
        panel: "riskAnalysis",
        kpis: [],
        dataEditable: true,
      },
    ],
  },
  {
    id: "demand-sustainability",
    name: "Demand Sustainability",
    categories: [
      {
        name: "Campaign Performance",
        panel: "campaignPerf",
        kpis: [],
        dataEditable: true,
      },
    ],
  },
  {
    id: "pipeline-visibility",
    name: "Pipeline Visibility",
    categories: [
      {
        name: "Tier Category",
        panel: "pipelineTable",
        kpis: [],
      },
    ],
  },
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

const getStatus = (kpi, period, fy) => {
  const v = periodValues(kpi, period, fy);
  return statusFromPair(kpi, v.budget, v.actual);
};
const getVariance = (kpi, period, fy) => {
  const { budget, actual } = periodValues(kpi, period, fy);
  const b = Number(budget),
    a = Number(actual);
  return Number.isFinite(b) && Number.isFinite(a) ? a - b : null;
};

// ==================== PIPELINE TABLE ====================

const AVAILABLE_FIELDS = [
  { id: "tier", label: "Tier Category", type: "dropdown", options: ["Core anchor", "Land & expand", "Flagship", "Coopetition", "Capital corridor", "Provincial Multiplier"] },
  { id: "accountWebsite", label: "Account Website", type: "text" },
  { id: "targetCategory", label: "Target Category", type: "dropdown", options: ["Strategic", "Tactical", "Operational"] },
  { id: "sector", label: "Sector", type: "dropdown", options: ["Generalist", "Agriculture", "Automotive", "Banking, Finance & Insurance", "Beauty / Cosmetics / Personal Care", "Construction", "Consulting", "Creative Arts / Design", "Customer Service", "Education & Training", "Engineering", "Environmental / Natural Sciences", "Government / Public Sector", "Healthcare / Medical", "Hospitality / Tourism", "Human Resources", "Information Technology (IT)", "Infrastructure", "Legal / Law", "Logistics / Supply Chain", "Manufacturing", "Marketing / Advertising / PR", "Media / Journalism / Broadcasting", "Mining", "Energy", "Oil & Gas", "Non-Profit / NGO", "Property / Real Estate", "Retail / Wholesale", "Safety & Security / Police / Defence", "Sales", "Science & Research", "Social Services / Social Work", "Sports / Recreation / Fitness", "Telecommunications", "Transport", "Utilities (Water, Electricity, Waste)", "Industry multiplier", "Provincial multiplier"] },
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

// ── Column Selector ──
const ColumnSelector = ({ isOpen, onClose, visibleFields, onToggleField }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]">
      <div className="bg-[#fdfcfb] p-5 rounded-lg max-w-[600px] w-[90%] max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-mediumBrown text-lg font-semibold">Select Columns to Display</h3>
          <button onClick={onClose} className="text-mediumBrown hover:text-warmBrown"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {AVAILABLE_FIELDS.map((field) => (
            <label key={field.id} className="flex items-center gap-2 text-sm text-mediumBrown cursor-pointer">
              <input type="checkbox" checked={visibleFields.includes(field.id)} onChange={() => onToggleField(field.id)} className="w-4 h-4 rounded border-[#e8ddd4] accent-mediumBrown" />
              {field.label}
            </label>
          ))}
        </div>
        <div className="flex justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-mediumBrown text-white rounded-md text-sm">Done</button>
        </div>
      </div>
    </div>
  );
};

// ── Cell renderers ──
const BooleanCell = ({ value, onChange, isEditing }) => {
  if (isEditing) {
    return (
      <select value={value ? "yes" : "no"} onChange={(e) => onChange(e.target.value === "yes")} className="w-full p-1 rounded border border-[#e8ddd4] text-sm bg-white">
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    );
  }
  return <span className={`text-sm font-medium ${value ? "text-green-600" : "text-red-500"}`}>{value ? "✓ Yes" : "✗ No"}</span>;
};

const DropdownCell = ({ value, options, onChange, isEditing }) => {
  if (isEditing) {
    return (
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full p-1 rounded border border-[#e8ddd4] text-sm bg-white">
        <option value="">Select...</option>
        {options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
      </select>
    );
  }
  return <span className="text-sm text-mediumBrown">{value || "-"}</span>;
};

const TextCell = ({ value, onChange, isEditing, type }) => {
  if (isEditing) {
    if (type === "currency" || type === "number") {
      return <input type="number" step="0.01" value={value || ""} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-full p-1 rounded border border-[#e8ddd4] text-sm" />;
    }
    if (type === "date") {
      return <input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full p-1 rounded border border-[#e8ddd4] text-sm" />;
    }
    return <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full p-1 rounded border border-[#e8ddd4] text-sm" />;
  }
  if (type === "currency") {
    return <span className="text-sm text-mediumBrown">{value ? `R ${Number(value).toLocaleString()}` : "-"}</span>;
  }
  return <span className="text-sm text-mediumBrown">{value || "-"}</span>;
};

// ── Main Pipeline Table with drag-drop and filter dropdown ──
const PipelineTable = ({ currentUser, isInvestorView, onDataChange }) => {
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
  const resizing = useRef(null);

  // --- Column order state for drag-drop ---
  const [colOrder, setColOrder] = useState(DEFAULT_VISIBLE_FIELDS);

  // Sync colOrder when visibleFields changes (keep only visible fields in order)
  useEffect(() => {
    setColOrder((prev) => prev.filter((f) => visibleFields.includes(f)));
  }, [visibleFields]);

  const loadRecords = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const recordsRef = collection(db, "users", currentUser.uid, "pipelineRecords");
      const querySnapshot = await getDocs(recordsRef);
      const recordsData = [];
      querySnapshot.forEach((doc) => { recordsData.push({ id: doc.id, ...doc.data() }); });
      setRecords(recordsData);
      setFilteredRecords(recordsData);
      if (onDataChange) onDataChange(recordsData);
    } catch (error) {
      console.error("Error loading records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (currentUser) loadRecords(); }, [currentUser]);

  // Filtering and sorting
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
        if (typeof av === "number" && typeof bv === "number") {
          return sortConfig.direction === "asc" ? av - bv : bv - av;
        }
        const cmp = String(av).localeCompare(String(bv));
        return sortConfig.direction === "asc" ? cmp : -cmp;
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
    } catch (error) {
      console.error("Error adding record:", error);
      alert("Failed to add record");
    }
  };

  const handleSaveEdit = async () => {
    if (!currentUser || !editingId) return;
    try {
      const recordRef = doc(db, "users", currentUser.uid, "pipelineRecords", editingId);
      await updateDoc(recordRef, editData);
      const updated = records.map((r) => r.id === editingId ? { ...r, ...editData } : r);
      setRecords(updated);
      if (onDataChange) onDataChange(updated);
      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error("Error saving record:", error);
      alert("Failed to save changes");
    }
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
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record");
    }
  };

  const handleEditChange = (fieldId, value) => { setEditData({ ...editData, [fieldId]: value }); };

  const toggleField = (fieldId) => {
    if (visibleFields.includes(fieldId)) setVisibleFields(visibleFields.filter((f) => f !== fieldId));
    else setVisibleFields([...visibleFields, fieldId]);
  };

  const clearFilters = () => setFilters({});

  const getFieldConfig = (fieldId) => AVAILABLE_FIELDS.find((f) => f.id === fieldId);

  // Get unique filter options for a column
  const getFilterOptions = (fieldId) => {
    const values = records.map(r => r[fieldId]).filter(v => v !== undefined && v !== null && v !== "");
    const unique = Array.from(new Set(values.map(v => String(v)))).sort();
    return ["All", ...unique];
  };

  // Drag-drop handlers
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
    e.stopPropagation();
    const startX = e.clientX, startWidth = widths[key];
    resizing.current = key;
    const onMove = (ev) => setWidths((p) => ({ ...p, [key]: Math.max(80, startWidth + (ev.clientX - startX)) }));
    const onUp = () => {
      resizing.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const toggleSort = (key) => setSortConfig((p) => ({ key, direction: p.key === key && p.direction === "asc" ? "desc" : "asc" }));

  const thS = {
    padding: 0,
    background: T.header,
    borderBottom: `2px solid ${T.header}`,
    borderRight: "1px solid rgba(255,255,255,0.14)",
    position: "relative",
    verticalAlign: "top",
  };

  const renderCell = (record, fieldId, isEditing) => {
    const fieldConfig = getFieldConfig(fieldId);
    if (!fieldConfig) return null;
    const value = isEditing ? editData[fieldId] : record[fieldId];
    if (fieldConfig.type === "boolean") {
      return <BooleanCell value={value} onChange={(newVal) => handleEditChange(fieldId, newVal)} isEditing={isEditing} />;
    }
    if (fieldConfig.type === "dropdown") {
      return <DropdownCell value={value} options={fieldConfig.options} onChange={(newVal) => handleEditChange(fieldId, newVal)} isEditing={isEditing} />;
    }
    return <TextCell value={value} onChange={(newVal) => handleEditChange(fieldId, newVal)} isEditing={isEditing} type={fieldConfig.type} />;
  };

  return (
    <div className="mt-5">
      <ColumnSelector isOpen={showColumnSelector} onClose={() => setShowColumnSelector(false)} visibleFields={visibleFields} onToggleField={toggleField} />
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]">
          <div className="bg-[#fdfcfb] p-5 rounded-lg max-w-[400px] w-[90%]">
            <h3 className="text-mediumBrown text-lg mb-3">Confirm Delete</h3>
            <p className="text-mediumBrown mb-5">Are you sure you want to delete this record? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 bg-[#e8ddd4] text-mediumBrown rounded-md">Cancel</button>
              <button onClick={() => handleDeleteRecord(showDeleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-md">Delete</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div className="flex gap-2">
          {!isInvestorView && (
            <button onClick={handleAddRecord} className="px-4 py-2 bg-mediumBrown text-white rounded-md text-sm font-semibold hover:bg-warmBrown transition">+ Add Record</button>
          )}
          <button onClick={() => setShowColumnSelector(true)} className="px-4 py-2 bg-[#e8ddd4] text-mediumBrown rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-[#d4c4b8] transition"><Settings size={16} /> Columns</button>
        </div>
      </div>
      <div className="overflow-x-auto bg-[#fdfcfb] rounded-lg border border-[#e8ddd4]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {colOrder.map((fieldId) => {
                const fieldConfig = getFieldConfig(fieldId);
                const sorted = sortConfig.key === fieldId;
                const currentFilter = filters[fieldId] || "All";
                const filterOpts = getFilterOptions(fieldId);
                return (
                  <th
                    key={fieldId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, fieldId)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, fieldId)}
                    style={{ ...thS, width: widths[fieldId] || 150, userSelect: "none" }}
                  >
                    <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "100%" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap", color: "#fff", cursor: "grab" }}>{fieldConfig?.label || fieldId}</span>
                        <InfoTip text={fieldConfig?.label} light />
                        <button onClick={() => toggleSort(fieldId)} title="Sort" style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", borderRadius: "4px", color: sorted ? "#fff" : "rgba(255,255,255,0.6)", display: "inline-flex", alignItems: "center" }}>
                          {sorted ? (sortConfig.direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                        </button>
                        <FilterDropdown
                          options={filterOpts}
                          value={currentFilter}
                          onChange={(val) => setFilters(p => ({ ...p, [fieldId]: val === "All" ? "" : val }))}
                          onClose={() => {}}
                        />
                      </div>
                    </div>
                    <div onMouseDown={(e) => startResize(e, fieldId)} title="Drag to resize" style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                  </th>
                );
              })}
              {!isInvestorView && (
                <th style={{ ...thS, width: 100, borderRight: "none" }}>
                  <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>Actions</span>
                    <div style={{ height: "40px" }} />
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr><td colSpan={colOrder.length + (isInvestorView ? 0 : 1)} className="p-8 text-center text-lightBrown">{loading ? "Loading..." : "No records found. Click 'Add Record' to get started."}</td></tr>
            ) : (
              filteredRecords.map((record, idx) => (
                <tr key={record.id} className={`border-b border-[#e8ddd4] ${idx % 2 === 0 ? "bg-white" : "bg-[#faf8f5]"}`}>
                  {colOrder.map((fieldId) => (
                    <td key={fieldId} className="p-2.5 align-middle">{renderCell(record, fieldId, editingId === record.id)}</td>
                  ))}
                  {!isInvestorView && (
                    <td className="p-2.5 text-center whitespace-nowrap">
                      {editingId === record.id ? (
                        <div className="flex gap-1 justify-center">
                          <button onClick={handleSaveEdit} className="p-1 bg-green-600 text-white rounded hover:bg-green-700" title="Save"><Check size={16} /></button>
                          <button onClick={handleCancelEdit} className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500" title="Cancel"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => { setEditingId(record.id); setEditData({ ...record }); }} className="p-1 bg-mediumBrown text-white rounded hover:bg-warmBrown" title="Edit">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3l4 4-7 7H10v-4l7-7z" /><path d="M4 20h16" /></svg>
                          </button>
                          <button onClick={() => setShowDeleteConfirm(record.id)} className="p-1 bg-red-600 text-white rounded hover:bg-red-700" title="Delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13" /><path d="M9 4h6a1 1 0 0 1 1 1v2H8V5a1 1 0 0 1 1-1z" /></svg>
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 bg-[#f5f0eb] p-3 rounded-lg text-sm text-mediumBrown">Showing {filteredRecords.length} of {records.length} records</div>
    </div>
  );
};

// ==================== TOP 3 CONCENTRATION (with data editing) ====================
const Top3Concentration = ({ data, isInvestorView, onDataChange }) => {
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

  useEffect(() => {
    if (data) setLocalData(data);
  }, [data]);

  const renderTable = (data, title, type) => (
    <div>
      <h4 style={{ color: T.body, fontSize: "13px", marginBottom: "10px", fontWeight: 600 }}>{title}</h4>
      <div style={{ border: `1px solid ${T.lineSoft}`, borderRadius: "8px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.header }}>
              <th style={{ padding: "8px 12px", color: "#fff", fontSize: "11px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "8px 12px", color: "#fff", fontSize: "11px", textAlign: "right" }}>Revenue</th>
              <th style={{ padding: "8px 12px", color: "#fff", fontSize: "11px", textAlign: "right" }}>%</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.lineSoft}`, background: i % 2 ? T.panel : T.bg }}>
                <td style={{ padding: "8px 12px", fontSize: "13px", color: T.body }}>{item.name}</td>
                <td style={{ padding: "8px 12px", fontSize: "13px", color: T.body, textAlign: "right" }}>R {item.revenue.toLocaleString()}</td>
                <td style={{ padding: "8px 12px", fontSize: "13px", color: T.body, textAlign: "right" }}>{item.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
      {renderTable(localData.channels || [], "Top 3 Channels", "channels")}
      {renderTable(localData.customers || [], "Top 3 Customers", "customers")}
      {renderTable(localData.segments || [], "Top 3 Segments", "segments")}
    </div>
  );
};

// ==================== CHANNEL PERFORMANCE TABLE (editable) ====================
const ChannelPerformanceTable = ({ data, isInvestorView, onDataChange }) => {
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
  const [widths, setWidths] = useState(() => ({
    name: 200,
    revenue: 150,
    spend: 150,
    net: 120,
    roi: 120,
    pct: 120,
  }));
  const [colOrder, setColOrder] = useState(["name", "revenue", "spend", "net", "roi", "pct"]);
  const resizing = useRef(null);

  useEffect(() => {
    if (data) setLocalData(data);
  }, [data]);

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
        if (typeof av === "number" && typeof bv === "number") {
          return sortConfig.direction === "asc" ? av - bv : bv - av;
        }
        const cmp = String(av).localeCompare(String(bv));
        return sortConfig.direction === "asc" ? cmp : -cmp;
      });
    }
    setFilteredData(filtered);
  }, [filters, sortConfig, localData]);

  const getFilterOptions = (key) => {
    const values = localData.map((item) => item[key]).filter((v) => v !== undefined && v !== null && v !== "");
    const unique = Array.from(new Set(values.map((v) => String(v)))).sort();
    return ["All", ...unique];
  };

  const toggleSort = (key) => setSortConfig((p) => ({ key, direction: p.key === key && p.direction === "asc" ? "desc" : "asc" }));

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
    e.stopPropagation();
    const startX = e.clientX,
      startWidth = widths[key];
    resizing.current = key;
    const onMove = (ev) => setWidths((p) => ({ ...p, [key]: Math.max(80, startWidth + (ev.clientX - startX)) }));
    const onUp = () => {
      resizing.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const thS = {
    padding: 0,
    background: T.header,
    borderBottom: `2px solid ${T.header}`,
    borderRight: "1px solid rgba(255,255,255,0.14)",
    position: "relative",
    verticalAlign: "top",
  };

  const totalRevenue = localData.reduce((sum, item) => sum + item.revenue, 0);

  const labels = {
    name: "Channel",
    revenue: "Revenue",
    spend: "Marketing Spend",
    net: "Net Profit",
    roi: "ROI %",
    pct: "% of Revenue",
  };

  return (
    <div style={{ overflowX: "auto", border: `1px solid ${T.lineStrong}`, borderRadius: "10px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr>
            {colOrder.map((key) => {
              const sorted = sortConfig.key === key;
              const currentFilter = filters[key] || "All";
              const filterOpts = getFilterOptions(key);
              return (
                <th
                  key={key}
                  draggable
                  onDragStart={(e) => handleDragStart(e, key)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, key)}
                  style={{ ...thS, width: widths[key] || 150, userSelect: "none" }}
                >
                  <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "100%" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap", color: "#fff", cursor: "grab" }}>{labels[key] || key}</span>
                      <button onClick={() => toggleSort(key)} title="Sort" style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", borderRadius: "4px", color: sorted ? "#fff" : "rgba(255,255,255,0.6)", display: "inline-flex", alignItems: "center" }}>
                        {sorted ? (sortConfig.direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                      </button>
                      <FilterDropdown
                        options={filterOpts}
                        value={currentFilter}
                        onChange={(val) => setFilters((p) => ({ ...p, [key]: val === "All" ? "" : val }))}
                        onClose={() => {}}
                      />
                    </div>
                  </div>
                  <div onMouseDown={(e) => startResize(e, key)} title="Drag to resize" style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, idx) => {
            const net = item.revenue - item.spend;
            const roi = item.spend > 0 ? (net / item.spend) * 100 : 0;
            const pct = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
            return (
              <tr key={idx} style={{ borderBottom: `1px solid ${T.lineSoft}`, background: idx % 2 ? T.panel : T.bg }}>
                {colOrder.map((key) => (
                  <td key={key} style={{ padding: "8px 12px", fontSize: "13px", color: T.body, textAlign: key === "name" ? "left" : "right" }}>
                    {key === "name" && <span style={{ fontWeight: 600 }}>{item.name}</span>}
                    {key === "revenue" && `R ${item.revenue.toLocaleString()}`}
                    {key === "spend" && `R ${item.spend.toLocaleString()}`}
                    {key === "net" && <span style={{ color: net >= 0 ? T.green : T.red, fontWeight: 600 }}>R {net.toLocaleString()}</span>}
                    {key === "roi" && <span style={{ color: roi >= 0 ? T.green : T.red, fontWeight: 600 }}>{roi.toFixed(1)}%</span>}
                    {key === "pct" && `${pct.toFixed(1)}%`}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ==================== CONCENTRATION RISK ANALYSIS BAR CHART ====================
const ConcentrationRiskBarChart = ({ data, isInvestorView }) => {
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

  useEffect(() => {
    if (data) setLocalData(data);
  }, [data]);

  // Calculate metrics for each channel
  const chartData = useMemo(() => {
    const sorted = [...localData.channels].sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = sorted.reduce((sum, ch) => sum + ch.revenue, 0);
    
    return {
      labels: sorted.map(ch => ch.name),
      datasets: [
        {
          label: "Revenue",
          data: sorted.map(ch => ch.revenue),
          backgroundColor: sorted.map((_, i) => {
            const colors = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"];
            return colors[i % colors.length];
          }),
          borderColor: sorted.map((_, i) => {
            const colors = ["#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];
            return colors[i % colors.length];
          }),
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.6,
        },
        {
          label: "Marketing Spend",
          data: sorted.map(ch => ch.spend),
          backgroundColor: "rgba(234, 88, 12, 0.8)",
          borderColor: "#c2410c",
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.6,
        },
      ],
    };
  }, [localData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { size: 12, weight: "500" },
          color: T.body,
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: T.ink,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            return `${label}: R ${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: T.lineSoft },
        ticks: {
          color: T.body,
          font: { size: 11 },
          callback: (value) => `R ${(value / 1000).toFixed(0)}k`,
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: T.body,
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
  };

  // Calculate summary stats
  const totalRevenue = localData.channels.reduce((sum, ch) => sum + ch.revenue, 0);
  const totalSpend = localData.channels.reduce((sum, ch) => sum + ch.spend, 0);
  const avgROI = localData.channels.length > 0 
    ? localData.channels.reduce((sum, ch) => sum + ((ch.revenue - ch.spend) / ch.spend * 100), 0) / localData.channels.length 
    : 0;

  const top3Revenue = localData.channels
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3)
    .reduce((sum, ch) => sum + ch.revenue, 0);
  const top3Concentration = totalRevenue > 0 ? (top3Revenue / totalRevenue) * 100 : 0;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        <div style={{ ...cardS, padding: "12px 14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: T.muted }}>Total Revenue</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: T.ink }}>R {totalRevenue.toLocaleString()}</div>
        </div>
        <div style={{ ...cardS, padding: "12px 14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: T.muted }}>Total Spend</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: T.ink }}>R {totalSpend.toLocaleString()}</div>
        </div>
        <div style={{ ...cardS, padding: "12px 14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: T.muted }}>Top 3 Concentration</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: top3Concentration > 70 ? T.red : top3Concentration > 50 ? T.amber : T.green }}>{top3Concentration.toFixed(1)}%</div>
        </div>
        <div style={{ ...cardS, padding: "12px 14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: T.muted }}>Avg ROI</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: avgROI > 100 ? T.green : avgROI > 50 ? T.amber : T.red }}>{avgROI.toFixed(1)}%</div>
        </div>
      </div>

      <div style={{ height: "320px", marginBottom: "20px" }}>
        <Chart type="bar" data={chartData} options={options} />
      </div>

      <div style={{ fontSize: "12.5px", color: T.muted, padding: "12px 14px", background: T.panel, borderRadius: "8px", border: `1px solid ${T.lineSoft}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <Info size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
          <div>
            <strong>Concentration Risk Analysis:</strong> 
            {" "}Top 3 channels represent {top3Concentration.toFixed(1)}% of total revenue.
            {top3Concentration > 70 
              ? " High concentration risk — consider diversifying revenue streams." 
              : top3Concentration > 50 
              ? " Moderate concentration risk — monitor top channels closely." 
              : " Low concentration risk — revenue is well distributed."}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== CAMPAIGN PERFORMANCE TABLE (editable) ====================
const CampaignPerformanceTable = ({ data, isInvestorView, onDataChange }) => {
  const [localData, setLocalData] = useState(data || [
    { name: "Q1 Campaign", cost: 25000, revenue: 45000 },
    { name: "Q2 Campaign", cost: 30000, revenue: 55000 },
    { name: "Summer Sale", cost: 15000, revenue: 35000 },
    { name: "Holiday Campaign", cost: 40000, revenue: 80000 },
  ]);

  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filteredData, setFilteredData] = useState(localData);
  const [widths, setWidths] = useState(() => ({
    name: 200,
    cost: 150,
    revenue: 150,
    roi: 120,
  }));
  const [colOrder, setColOrder] = useState(["name", "cost", "revenue", "roi"]);
  const resizing = useRef(null);

  useEffect(() => {
    if (data) setLocalData(data);
  }, [data]);

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
        if (typeof av === "number" && typeof bv === "number") {
          return sortConfig.direction === "asc" ? av - bv : bv - av;
        }
        const cmp = String(av).localeCompare(String(bv));
        return sortConfig.direction === "asc" ? cmp : -cmp;
      });
    }
    setFilteredData(filtered);
  }, [filters, sortConfig, localData]);

  const getFilterOptions = (key) => {
    const values = localData.map((item) => item[key]).filter((v) => v !== undefined && v !== null && v !== "");
    const unique = Array.from(new Set(values.map((v) => String(v)))).sort();
    return ["All", ...unique];
  };

  const toggleSort = (key) => setSortConfig((p) => ({ key, direction: p.key === key && p.direction === "asc" ? "desc" : "asc" }));

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
    e.stopPropagation();
    const startX = e.clientX,
      startWidth = widths[key];
    resizing.current = key;
    const onMove = (ev) => setWidths((p) => ({ ...p, [key]: Math.max(80, startWidth + (ev.clientX - startX)) }));
    const onUp = () => {
      resizing.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const thS = {
    padding: 0,
    background: T.header,
    borderBottom: `2px solid ${T.header}`,
    borderRight: "1px solid rgba(255,255,255,0.14)",
    position: "relative",
    verticalAlign: "top",
  };

  const labels = {
    name: "Campaign",
    cost: "Cost",
    revenue: "Revenue",
    roi: "ROI %",
  };

  return (
    <div style={{ overflowX: "auto", border: `1px solid ${T.lineStrong}`, borderRadius: "10px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr>
            {colOrder.map((key) => {
              const sorted = sortConfig.key === key;
              const currentFilter = filters[key] || "All";
              const filterOpts = getFilterOptions(key);
              return (
                <th
                  key={key}
                  draggable
                  onDragStart={(e) => handleDragStart(e, key)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, key)}
                  style={{ ...thS, width: widths[key] || 150, userSelect: "none" }}
                >
                  <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "100%" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap", color: "#fff", cursor: "grab" }}>{labels[key] || key}</span>
                      <button onClick={() => toggleSort(key)} title="Sort" style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", borderRadius: "4px", color: sorted ? "#fff" : "rgba(255,255,255,0.6)", display: "inline-flex", alignItems: "center" }}>
                        {sorted ? (sortConfig.direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                      </button>
                      <FilterDropdown
                        options={filterOpts}
                        value={currentFilter}
                        onChange={(val) => setFilters((p) => ({ ...p, [key]: val === "All" ? "" : val }))}
                        onClose={() => {}}
                      />
                    </div>
                  </div>
                  <div onMouseDown={(e) => startResize(e, key)} title="Drag to resize" style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, idx) => {
            const roi = item.cost > 0 ? ((item.revenue - item.cost) / item.cost) * 100 : 0;
            return (
              <tr key={idx} style={{ borderBottom: `1px solid ${T.lineSoft}`, background: idx % 2 ? T.panel : T.bg }}>
                {colOrder.map((key) => (
                  <td key={key} style={{ padding: "8px 12px", fontSize: "13px", color: T.body, textAlign: key === "name" ? "left" : "right" }}>
                    {key === "name" && <span style={{ fontWeight: 600 }}>{item.name}</span>}
                    {key === "cost" && `R ${item.cost.toLocaleString()}`}
                    {key === "revenue" && `R ${item.revenue.toLocaleString()}`}
                    {key === "roi" && <span style={{ color: roi >= 0 ? T.green : T.red, fontWeight: 600 }}>{roi.toFixed(1)}%</span>}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ==================== TREND CHART MODAL ====================
const CHART_VERSION = 2;
const DEFAULT_CHART = {
  v: CHART_VERSION,
  actualType: "bar",
  budgetType: "scatter",
  varianceType: "scatter",
  actualColor: "#1e40af",
  budgetColor: "#4a352f",
  showValues: false,
  showAxis: false,
};
const CHART_TYPES = [
  { value: "bar", label: "Bars" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "scatter", label: "Circles" },
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
        return { actual: rollUp(ms.map((r) => Number(r.actual)), kpi.aggregate), budget: rollUp(ms.map((r) => Number(r.budget)), kpi.aggregate) };
      });
      return {
        labels: qs.map((q) => `${q.label} ${fyLabel(fy.startYear, fy.startMonth)}`),
        actual: rows.map((r) => r.actual),
        budget: rows.map((r) => r.budget),
        noteKey: `Q:${fy.startYear}`,
        caption: `Quarters of FY ${fyLabel(fy.startYear, fy.startMonth)}`,
      };
    }
    const months = fyMonths(fy.startYear, fy.startMonth);
    const rows = months.map((m) => monthEntry(kpi, m.year, m.month));
    return {
      labels: months.map((m) => m.label),
      actual: rows.map((r) => parseNum(r.actual)),
      budget: rows.map((r) => parseNum(r.budget)),
      noteKey: currentMonthKey(),
      caption: `FY ${fyLabel(fy.startYear, fy.startMonth)} · ${months[0].long} → ${months[11].long}`,
    };
  }, [kpi, period, fy]);

  const variance = actual.map((a, i) => (Number.isFinite(a) && Number.isFinite(budget[i]) ? a - budget[i] : null));

  useEffect(() => {
    setNoteText(kpi.periodNotes?.[noteKey] || "");
    setNoteState("idle");
  }, [noteKey, kpi.id]);

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
  useEffect(() => () => {
    if (noteTimer.current) clearTimeout(noteTimer.current);
  }, []);

  const setPref = (patch) => onSaveChart({ ...prefs, ...patch, v: CHART_VERSION });
  const varColors = variance.map((v) =>
    v === null ? "rgba(138,122,116,0.4)" : varianceFavourable(kpi, v) ? T.green : T.red
  );

  const buildSeries = (type, data, color, extra = {}) => {
    if (type === "scatter") {
      return {
        type: "scatter",
        data,
        showLine: false,
        pointStyle: "circle",
        pointRadius: 6,
        pointHoverRadius: 9,
        pointBackgroundColor: Array.isArray(color) ? color.map((c) => `${c}22`) : "#ffffff",
        pointBorderColor: color,
        pointBorderWidth: 2.4,
        ...extra,
      };
    }
    if (type === "line" || type === "area") {
      return {
        type: "line",
        data,
        borderColor: color,
        backgroundColor: type === "area" ? `${color}22` : "transparent",
        borderWidth: 2.5,
        fill: type === "area",
        tension: 0.25,
        spanGaps: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointStyle: "circle",
        pointBackgroundColor: "#ffffff",
        pointBorderColor: color,
        pointBorderWidth: 2.2,
        ...extra,
      };
    }
    return {
      type: "bar",
      data,
      backgroundColor: Array.isArray(color) ? color.map((c) => `${c}b3`) : `${color}b3`,
      borderWidth: 0,
      borderRadius: 4,
      barPercentage: 0.6,
      categoryPercentage: 0.78,
      ...extra,
    };
  };

  const varianceData = {
    labels,
    datasets: [
      { label: "Variance", ...buildSeries(prefs.varianceType, variance, varColors), __signed: true, __labelColor: T.body },
    ],
  };
  const varianceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    layout: { padding: { top: prefs.showValues ? 20 : 6, bottom: 0 } },
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: {
        backgroundColor: T.ink,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: (items) => labels[items[0].dataIndex],
          label: (c) =>
            c.parsed.y === null || c.parsed.y === undefined
              ? "Variance: no data"
              : `Variance: ${fmtValue(c.parsed.y, kpi, { signed: true })} (${varianceFavourable(kpi, c.parsed.y) ? "favourable" : "unfavourable"})`,
        },
      },
    },
    scales: { y: { display: false, grid: { display: false } }, x: { display: false, grid: { display: false }, offset: prefs.varianceType === "bar" } },
  };

  const mainData = {
    labels,
    datasets: [
      { label: "Target", ...buildSeries(prefs.budgetType, budget, prefs.budgetColor), order: 1, __labelColor: prefs.budgetColor },
      { label: "Actual", ...buildSeries(prefs.actualType, actual, prefs.actualColor), order: 2, __labelColor: prefs.actualColor },
    ],
  };
  const mainOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    layout: { padding: { top: prefs.showValues ? 20 : 6 } },
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: {
        backgroundColor: T.ink,
        padding: 11,
        cornerRadius: 8,
        callbacks: {
          label: (c) =>
            c.parsed.y === null || c.parsed.y === undefined ? `${c.dataset.label}: no data` : `${c.dataset.label}: ${fmtValue(c.parsed.y, kpi)}`,
        },
      },
    },
    scales: {
      y: {
        display: prefs.showAxis,
        grid: { display: prefs.showAxis, color: T.lineSoft },
        ticks: { color: T.body, font: { size: 11 }, callback: (v) => fmtValue(v, kpi, { bare: true }) },
      },
      x: {
        display: true,
        grid: { display: false },
        ticks: { color: T.body, font: { size: 11 }, maxRotation: 45, minRotation: 0, autoSkip: true, maxTicksLimit: 12 },
      },
    },
  };

  const avgBudget = mean(budget),
    avgActual = mean(actual),
    avgVar = mean(variance);
  const onTarget = variance.filter((v) => v !== null && varianceFavourable(kpi, v)).length;
  const counted = variance.filter((v) => v !== null).length;

  const stat = (label, value, color) => (
    <div key={label} style={{ ...cardS, padding: "11px 14px", flex: "1 1 150px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: T.muted }}>{label}</div>
      <div
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: color || T.ink,
          marginTop: "3px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
  const dot = (color, filled) => (
    <span
      style={{
        width: 11,
        height: 11,
        borderRadius: "50%",
        border: `2.4px solid ${color}`,
        background: filled ? color : "#ffffff",
        display: "inline-block",
      }}
    />
  );
  const barChip = (color) => <span style={{ width: 11, height: 11, borderRadius: "3px", background: `${color}b3`, display: "inline-block" }} />;
  const key = (label, swatch) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: T.body }}>
      {swatch}
      {label}
    </span>
  );

  return (
    <Modal
      title={`${kpi.name} — (${kpi.units})`}
      subtitle={caption}
      icon={<LineChartIcon size={17} />}
      onClose={onClose}
      width={960}
      footer={
        <>
          <button onClick={() => setShowCustomise((v) => !v)} style={btnGhost}>
            <Palette size={13} /> Customise chart
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={btnPrimary}>
            Close
          </button>
        </>
      }
    >
      {showCustomise && (
        <div style={{ ...cardS, marginBottom: "14px", background: T.panel }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
            {[
              ["actualType", "Actual as"],
              ["budgetType", "Target as"],
              ["varianceType", "Variance as"],
            ].map(([k, l]) => (
              <div key={k}>
                <label style={labelS}>{l}</label>
                <select value={prefs[k]} onChange={(e) => setPref({ [k]: e.target.value })} style={selectS}>
                  {CHART_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <div>
              <label style={labelS}>Show</label>
              <select
                value={`${prefs.showValues}|${prefs.showAxis}`}
                onChange={(e) => {
                  const [v, a] = e.target.value.split("|");
                  setPref({ showValues: v === "true", showAxis: a === "true" });
                }}
                style={selectS}
              >
                <option value="true|false">Value labels, no axis</option>
                <option value="false|true">Axis, no value labels</option>
                <option value="true|true">Both</option>
                <option value="false|false">Neither</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "22px", flexWrap: "wrap", marginTop: "12px" }}>
            {[
              { k: "actualColor", l: "Actual colour" },
              { k: "budgetColor", l: "Target colour" },
            ].map((c) => (
              <div key={c.k}>
                <label style={labelS}>{c.l}</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  {SWATCHES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setPref({ [c.k]: s })}
                      title={s}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "6px",
                        background: s,
                        cursor: "pointer",
                        border: prefs[c.k] === s ? `2px solid ${T.ink}` : `1px solid ${T.line}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "2px",
          }}
        >
          <span style={{ fontSize: "12.5px", fontWeight: 700, color: T.accent }}>Target vs Actual</span>
          <span style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {key("Variance", (
              <span style={{ display: "inline-flex", gap: "3px" }}>
                {dot(T.green)}
                {dot(T.red)}
              </span>
            ))}
            {key("Target", prefs.budgetType === "bar" ? barChip(prefs.budgetColor) : dot(prefs.budgetColor))}
            {key("Actual", prefs.actualType === "bar" ? barChip(prefs.actualColor) : dot(prefs.actualColor, true))}
          </span>
        </div>
        <div style={{ height: "112px", marginBottom: "-16px" }}>
          <Chart
            type="bar"
            data={varianceData}
            options={varianceOptions}
          />
        </div>
        <div style={{ height: "300px" }}>
          <Chart type="bar" data={mainData} options={mainOptions} />
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
        {stat("Average target", fmtValue(avgBudget, kpi))}
        {stat("Average actual", fmtValue(avgActual, kpi))}
        {stat("Average variance", fmtValue(avgVar, kpi, { signed: true }), avgVar === null ? T.ink : varianceFavourable(kpi, avgVar) ? T.green : T.red)}
        {stat("Periods on target", counted ? `${onTarget} of ${counted}` : "—")}
      </div>

      <div style={{ ...cardS, marginBottom: "14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span style={{ ...labelS, marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
            <StickyNote size={13} /> Notes
          </span>
          <span style={{ fontSize: "11.5px", color: noteState === "saved" ? T.green : T.muted }}>
            {noteState === "saving" ? "Saving…" : noteState === "saved" ? "Saved" : "Saves automatically"}
          </span>
        </div>
        <textarea
          rows="3"
          value={noteText}
          readOnly={readOnly}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="e.g. Q4 campaign drove strong lead growth but conversion dropped."
          style={{ ...inputS, resize: "vertical" }}
        />
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

// ==================== ANALYSIS MODAL ====================
const localAnalysis = (kpi, period, v, fy) => {
  const status = statusFromPair(kpi, v.budget, v.actual);
  const variance = Number.isFinite(Number(v.budget)) && Number.isFinite(Number(v.actual)) ? Number(v.actual) - Number(v.budget) : null;
  const fav = varianceFavourable(kpi, variance);
  return {
    observations: [
      `${PERIOD_LABEL[period]} actual sits at ${fmtValue(v.actual, kpi)}${v.budget === null ? " with no target captured." : ` against a target of ${fmtValue(v.budget, kpi)}.`}`,
      variance === null
        ? "Variance cannot be computed until a target exists for this period."
        : `That is a ${fav ? "favourable" : "unfavourable"} variance of ${fmtValue(Math.abs(variance), kpi)}.`,
      kpi.benchmark !== null ? `The recommended benchmark for this measure is ${fmtValue(kpi.benchmark, kpi)}.` : "No published benchmark for this measure — judge it against your own history.",
      `${DIRECTIONS.find((d) => d.value === kpi.direction)?.label} for this KPI.`,
    ],
    issues:
      status.key === "green"
        ? ["No material issue at this timeframe."]
        : status.key === "none"
        ? ["Capture a target so performance can be judged rather than just reported."]
        : [`Target is not being met${variance === null ? "" : ` — off by ${fmtValue(Math.abs(variance), kpi)}`}.`, status.key === "red" ? "Severity warrants a named owner and a dated action." : "Unattended, this compounds quietly across periods."],
    opportunities:
      status.key === "green"
        ? ["Consider tightening the target — the current one may no longer be stretching.", "Document what is working and apply it to the weaker measures in this category."]
        : ["Raise an action against this KPI so it carries into the next governance meeting.", kpi.direction === "higher" ? "Find the largest single constraint and remove it before adding anything." : "Trace the biggest contributors to this number and address the largest one first."],
  };
};

const summaryAnalysis = (kpi, fy) => {
  const rows = PERIODS.map((p) => {
    const v = periodValues(kpi, p.key, fy);
    return {
      key: p.key,
      label: p.label,
      v,
      status: statusFromPair(kpi, v.budget, v.actual),
      variance: Number.isFinite(Number(v.budget)) && Number.isFinite(Number(v.actual)) ? Number(v.actual) - Number(v.budget) : null,
    };
  });
  const withData = rows.filter((r) => r.status.key !== "none");
  const reds = withData.filter((r) => r.status.key === "red");
  const greens = withData.filter((r) => r.status.key === "green");
  const mth = rows.find((r) => r.key === "month"),
    yr = rows.find((r) => r.key === "year");
  return {
    observations: [
      ...rows.map((r) => `${r.label}: ${fmtValue(r.v.actual, kpi)}${r.v.budget === null ? " (no target)" : ` against ${fmtValue(r.v.budget, kpi)} — ${r.status.label.toLowerCase()}`}.`),
      `${withData.length} of ${rows.length} timeframes have both an actual and a target.`,
    ],
    issues:
      reds.length === 0 && withData.every((r) => r.status.key === "green")
        ? ["No timeframe is outside tolerance."]
        : [
            ...reds.map((r) => `${r.label} is critical${r.variance === null ? "" : ` — off by ${fmtValue(Math.abs(r.variance), kpi)}`}.`),
            ...withData.filter((r) => r.status.key === "amber").map((r) => `${r.label} needs attention.`),
          ],
    opportunities:
      reds.length > 0
        ? ["Raise a dated action — more than one timeframe shows the same gap.", "Check whether the target is still realistic before chasing the actual."]
        : ["Focus on the timeframe drifting first; the others usually follow.", "Keep the target under review as the team grows."],
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
          module: "Marketing & Sales",
          kpiName: kpi.name,
          meaning: kpi.meaning,
          measured: kpi.measured,
          units: kpi.units,
          direction: kpi.direction,
          benchmark: kpi.benchmark,
          scope,
          timeframe: scope === "summary" ? "All timeframes" : PERIOD_LABEL[period],
          financialYearStartMonth: fy.startMonth,
          budget: v.budget,
          actual: v.actual,
          variance: getVariance(kpi, period, fy),
          status: getStatus(kpi, period, fy).label,
          notes: kpi.notes || "",
          entries: kpi.entries || {},
        });
        const d = res?.data;
        if (d?.observations && d?.opportunities) {
          setAnalysis({ observations: d.observations || [], issues: d.issues || [], opportunities: d.opportunities || [] });
          setSource("ai");
          return;
        }
        throw new Error("The function replied, but not in the expected shape.");
      } catch (err) {
        console.error("AI analysis unavailable:", err);
        setReason(err?.code === "functions/not-found" ? "The generateKpiAnalysis function isn't deployed yet." : errText(err));
        setSource("local");
        setAnalysis(scope === "summary" ? summaryAnalysis(kpi, fy) : localAnalysis(kpi, period, v, fy));
      } finally {
        setLoading(false);
      }
    })();
  }, [kpi, period, fy, scope]);

  useEffect(() => {
    build();
  }, [build]);

  const Section = ({ label, items, color }) => (
    <div style={{ marginBottom: compact ? "12px" : "18px" }}>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.7px",
          textTransform: "uppercase",
          color,
          marginBottom: "6px",
        }}
      >
        {label}
      </div>
      <ul
        style={{
          margin: 0,
          paddingLeft: "18px",
          color: T.body,
          fontSize: compact ? "13px" : "14px",
          lineHeight: 1.65,
        }}
      >
        {items.map((it, i) => (
          <li key={i} style={{ marginBottom: "3px" }}>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            color: source === "ai" ? T.muted : T.amber,
            display: "flex",
            alignItems: "flex-start",
            gap: "6px",
            lineHeight: 1.5,
          }}
        >
          <Info size={12} style={{ marginTop: "2px", flexShrink: 0 }} />
          {loading
            ? "Reviewing…"
            : source === "ai"
            ? `Generated from your data · ${scope === "summary" ? "all timeframes" : PERIOD_LABEL[period]}`
            : `Rules-based summary built from your figures. ${reason}`}
        </span>
        <button
          onClick={build}
          disabled={loading}
          style={{ ...btnQuiet, padding: "3px 9px", fontSize: "12.5px", opacity: loading ? 0.5 : 1 }}
        >
          <RefreshCw size={12} /> Regenerate
        </button>
      </div>
      {loading ? (
        <div style={{ padding: "22px 0", color: T.muted, fontSize: "13.5px", textAlign: "center" }}>Reviewing {kpi.name}…</div>
      ) : (
        analysis && (
          <>
            <Section label="Observations" items={analysis.observations} color={T.accent} />
            <Section label="Issues" items={analysis.issues} color={T.red} />
            <Section label="Opportunities" items={analysis.opportunities} color={T.green} />
          </>
        )
      )}
    </div>
  );
};

const AnalysisModal = ({ kpi, period, fy, onClose }) => (
  <Modal
    title="Observations and Opportunities"
    subtitle={`${kpi.name} · across all timeframes`}
    icon={<Lightbulb size={17} />}
    onClose={onClose}
    width={700}
    footer={<button onClick={onClose} style={btnPrimary}>Close</button>}
  >
    <AnalysisBody kpi={kpi} period={period} fy={fy} scope="summary" />
  </Modal>
);

// ==================== ADD ACTION MODAL ====================
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
    description: `${PERIOD_LABEL[period]} actual ${fmtValue(v.actual, kpi)} against target ${fmtValue(v.budget, kpi)}${variance === null ? "" : ` (variance ${fmtValue(variance, kpi, { signed: true })})`}. Raised from ${tabName} · ${categoryName}.`,
    category: "Marketing & Sales",
    assignedTo: "",
    dueDate: "",
    status: "In Progress",
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
    return {
      ...prev,
      category: force || !prev.dueDate ? (m.category || m.department || "Marketing & Sales") : prev.category,
      dueDate: force || !prev.dueDate ? (d ? new Date(d).toISOString().split("T")[0] : "") : prev.dueDate,
      assignedTo: names.includes(prev.assignedTo) ? prev.assignedTo : "",
    };
  };

  useEffect(() => {
    (async () => {
      if (!userId) {
        setLoadingMeetings(false);
        return;
      }
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
      } finally {
        setLoadingMeetings(false);
      }
    })();
  }, [userId]);

  useEffect(() => {
    if (meetingId) setForm((p) => applyDefaults(meetingId, p, true));
  }, [meetingId, meetings.length]);

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      const snap = await getDoc(doc(db, "governanceCalendar", userId));
      let list = snap.exists() ? snap.data().meetings || [] : [];
      const action = {
        id: uid(),
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        assignedTo: form.assignedTo.trim(),
        dueDate: form.dueDate,
        status: form.status,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        revisedDate: null,
        sourceModule: "Marketing & Sales",
        sourceKpi: kpi.name,
        sourceCategory: `${tabName} · ${categoryName}`,
      };
      let targetId = meetingId;
      if (!targetId) {
        const meta = RAPS_CATEGORIES.find((c) => c.name === "Marketing & Sales");
        const holder = {
          id: uid(),
          title: "Marketing & Sales Actions",
          category: "Marketing & Sales",
          department: "Marketing & Sales",
          categoryColor: meta.color,
          categoryBg: "#FCE4EC",
          departmentColor: meta.color,
          departmentBg: "#FCE4EC",
          departments: [],
          purpose: "Actions raised from Marketing & Sales.",
          agenda: "",
          preparations: "",
          participants: [],
          isRecurring: false,
          recurrencePattern: null,
          instances: [{ instanceId: uid(), date: new Date().toISOString(), time: "09:00", status: "scheduled" }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          highlights: "",
          lowlights: "",
          opportunities: "",
          priorities: "",
          actions: [],
        };
        list = [...list, holder];
        targetId = holder.id;
      }
      const updated = list.map((m) =>
        m.id === targetId
          ? { ...m, actions: [...(m.actions || []), { ...action, meetingId: m.id }], updatedAt: new Date().toISOString() }
          : m
      );
      await setDoc(doc(db, "governanceCalendar", userId), { meetings: updated, updatedAt: new Date().toISOString(), userId }, { merge: true });
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
    <Modal
      title="Add Action"
      subtitle={`${kpi.name} · ${PERIOD_LABEL[period]}`}
      icon={<Plus size={17} />}
      onClose={onClose}
      width={640}
      footer={
        <>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={save} disabled={saving || !form.title.trim()} style={{ ...btnPrimary, opacity: saving || !form.title.trim() ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Action"}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", background: status.bg, border: `1px solid ${status.color}33`, marginBottom: "16px" }}>
        <StatusIcon status={status} size={20} />
        <div style={{ fontSize: "14px", color: T.body }}><strong style={{ color: T.accent }}>{kpi.name}</strong> is {status.label.toLowerCase()} for {PERIOD_LABEL[period].toLowerCase()}.</div>
      </div>
      <div style={{ marginBottom: "14px" }}><label style={labelS}>Action *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputS} /></div>
      <div style={{ marginBottom: "14px" }}><label style={labelS}>Description</label><textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputS, resize: "vertical" }} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
        <div>
          <label style={labelS}>Attach to meeting</label>
          {loadingMeetings ? <div style={{ fontSize: "13px", color: T.body }}>Loading...</div> : meetings.length === 0 ? (
            <div style={{ fontSize: "12.5px", color: T.body, background: T.panel, border: `1px solid ${T.line}`, borderRadius: "8px", padding: "9px 11px" }}>No meetings yet — filed under "Marketing & Sales Actions".</div>
          ) : (
            <select value={meetingId} onChange={(e) => { setMeetingId(e.target.value); setForm((p) => applyDefaults(e.target.value, p)); }} style={selectS}>
              {meetings.map((m) => { const d = meetingDate(m); return <option key={m.id} value={m.id}>{m.title}{d ? ` — ${fmtDMY(d)}` : ""}</option>; })}
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
        <div>
          <label style={labelS}>By whom</label>
          {(selected?.participants || []).length > 0 ? (
            <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} style={selectS}>
              <option value="">Unassigned</option>
              {selected.participants.map((p, i) => { const n = typeof p === "string" ? p : p.name || p.email || "Participant"; return <option key={i} value={n}>{n}</option>; })}
            </select>
          ) : <input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} style={inputS} placeholder="Owner" />}
        </div>
        <div><label style={labelS}>By when</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={inputS} /></div>
        <div><label style={labelS}>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={selectS}>{ACTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
      </div>
      {message && <div style={{ color: T.red, fontSize: "13px", marginTop: "12px" }}>{message}</div>}
    </Modal>
  );
};

// ==================== NOTES MODAL ====================
const NotesModal = ({ kpi, onClose, onSave, readOnly }) => {
  const [notes, setNotes] = useState(kpi.notes || "");
  const [state, setState] = useState("idle");
  const timer = useRef(null);
  const change = (t) => {
    setNotes(t);
    setState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onSave(t);
      setState("saved");
      setTimeout(() => setState("idle"), 1800);
    }, 700);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return (
    <Modal title={`Notes — ${kpi.name}`} icon={<StickyNote size={17} />} onClose={onClose} footer={<><span style={{ flex: 1, fontSize: "12.5px", color: state === "saved" ? T.green : T.muted, textAlign: "left" }}>{state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Saves automatically"}</span><button onClick={onClose} style={btnPrimary}>Close</button></>}>
      <label style={labelS}>Context, anomalies or anything worth remembering about this KPI</label>
      <textarea rows="9" value={notes} readOnly={readOnly} onChange={(e) => change(e.target.value)} style={{ ...inputS, resize: "vertical" }} />
    </Modal>
  );
};

// ==================== ADD CHOOSER ====================
const AddChooser = ({ onPick, onClose }) => (
  <Modal title="What would you like to do?" icon={<Plus size={17} />} onClose={onClose} width={580}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
      {[
        { key: "data", icon: <Database size={22} />, title: "Add Data", body: "Capture actual and target figures against the KPIs you already track." },
        { key: "kpi", icon: <Sparkles size={22} />, title: "Add KPI", body: "Create a custom marketing & sales metric under any section or category." },
      ].map((o) => (
        <button key={o.key} onClick={() => onPick(o.key)} style={{ padding: "22px 20px", borderRadius: "12px", border: `1px solid ${T.lineStrong}`, background: T.bg, cursor: "pointer", textAlign: "left", fontFamily: "inherit", display: "flex", flexDirection: "column", gap: "10px" }}
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

// ==================== ADD DATA WIZARD ====================
const AddDataWizard = ({ tabs, fy, docs, prefs, onSavePrefs, onBack, onClose, onSaveField, currentTabId }) => {
  const editableTabs = tabs.filter((t) => {
    const hasEditableKpis = t.categories.some((c) => 
      (c.kpis || []).some((k) => k.field)
    );
    const hasPanel = t.categories.some((c) => 
      c.panel === "top3" || 
      c.panel === "channelPerf" || 
      c.panel === "riskAnalysis" || 
      c.panel === "campaignPerf" ||
      c.panel === "pipelineTable"
    );
    return hasEditableKpis || hasPanel;
  });
  
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
  }, [months]);

  const monthMeta = months.find((m) => m.key === periodKey) || months[0];
  const monthIndex = months.findIndex((m) => m.key === periodKey);

  const rows = useMemo(() => {
    if (!tab) return [];
    const out = [];
    tab.categories.forEach((cat) => {
      const hasPanel = cat.panel === "top3" || cat.panel === "channelPerf" || 
                       cat.panel === "riskAnalysis" || cat.panel === "campaignPerf" ||
                       cat.panel === "pipelineTable";
      if (hasPanel) {
        out.push({ 
          kpi: { 
            id: `panel_${cat.panel}`, 
            name: `📋 ${cat.name}`, 
            units: "", 
            field: null,
            panel: cat.panel,
            isPanel: true 
          }, 
          category: cat.name 
        });
      } else {
        (cat.kpis || []).forEach((k) => {
          if (k.field) {
            out.push({ kpi: k, category: cat.name });
          }
        });
      }
    });
    return out;
  }, [tab]);

  const draftKey = (kpiId, which) => `${monthMeta?.month}|${kpiId}|${which}`;

  const value = (kpi, which) => {
    const dk = draftKey(kpi.id, which);
    if (draft[dk] !== undefined) return draft[dk];
    if (!kpi.field) return "";
    const path = which === "actual" ? kpi.field.a : kpi.field.b;
    if (!path) return "";
    const raw = kpi.field.scalar ? atPath(docs[kpi.field.src], path) : atPath(docs[kpi.field.src], path)?.[monthMeta.month];
    return raw === undefined || raw === null ? "" : String(raw);
  };

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
    { value: fy.startYear, badge: "FY", label: fyLabel(fy.startYear, fy.startMonth) },
    { value: fy.startYear + 1, badge: "FY+", label: fyLabel(fy.startYear + 1, fy.startMonth) },
  ];

  if (!tab) {
    return <Modal title="Add Data" icon={<Database size={17} />} onClose={onClose} width={520} footer={<button onClick={onClose} style={btnPrimary}>Close</button>}><p style={{ fontSize: "14px", color: T.body, margin: 0 }}>Nothing here takes direct input.</p></Modal>;
  }

  const hasPanelData = tab.categories.some((c) => 
    c.panel === "top3" || c.panel === "channelPerf" || 
    c.panel === "riskAnalysis" || c.panel === "campaignPerf" ||
    c.panel === "pipelineTable"
  );

  return (
    <Modal title="Add Data" subtitle={`Financial year starts in ${MONTHS[fy.startMonth]} · captured monthly`} icon={<Database size={17} />} onClose={onClose} width={800} footer={<><button onClick={onBack} style={btnGhost}><ArrowLeft size={13} /> Back</button><span style={{ flex: 1, fontSize: "12.5px", color: saveState === "saved" ? T.green : T.muted, textAlign: "left" }}>{saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Everything saves automatically"}</span><button onClick={onClose} style={btnPrimary}>Done</button></>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div><label style={labelS}>Financial year</label><select value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} style={selectS}>{yearOptions.map((y) => <option key={y.value} value={y.value}>{y.badge} {y.label}</option>)}</select></div>
        <div><label style={labelS}>Section</label><select value={tabId} onChange={(e) => setTabId(e.target.value)} style={selectS}>{editableTabs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
      </div>

      {hasPanelData && (
        <div style={{ ...cardS, background: T.panel, marginBottom: "12px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Info size={16} color={T.accentSoft} />
          <span style={{ flex: 1, minWidth: "220px", fontSize: "12.5px", color: T.body }}>
            This section contains marketing data (Revenue Concentration, Channel Performance, Campaign Performance, etc.). Click the button below to edit this data.
          </span>
          <button 
            onClick={() => {
              const panelCat = tab.categories.find((c) => 
                c.panel === "top3" || c.panel === "channelPerf" || 
                c.panel === "riskAnalysis" || c.panel === "campaignPerf" ||
                c.panel === "pipelineTable"
              );
              if (panelCat?.panel) {
                onClose();
                if (window.__setMarketingPanel) {
                  window.__setMarketingPanel(panelCat.panel);
                }
              }
            }}
            style={{ ...btnPrimary, padding: "7px 14px", fontSize: "12.5px" }}>
            <Database size={13} /> Edit Marketing Data
          </button>
        </div>
      )}

      {!hasPanelData && (
        <>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}><label style={labelS}>Month · 12 in FY {fyLabel(startYear, fy.startMonth)}</label><select value={periodKey || ""} onChange={(e) => setPeriodKey(e.target.value)} style={selectS}>{months.map((m) => <option key={m.key} value={m.key}>{m.long}</option>)}</select></div>
            <button onClick={() => setPeriodKey(months[Math.max(0, monthIndex - 1)]?.key)} disabled={monthIndex <= 0} style={{ ...btnGhost, padding: "9px 11px", opacity: monthIndex <= 0 ? 0.4 : 1 }}><ChevronLeft size={14} /></button>
            <button onClick={() => setPeriodKey(months[Math.min(months.length - 1, monthIndex + 1)]?.key)} disabled={monthIndex >= months.length - 1} style={{ ...btnGhost, padding: "9px 11px", opacity: monthIndex >= months.length - 1 ? 0.4 : 1 }}><ChevronRight size={14} /></button>
          </div>

          <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ maxHeight: "42vh", overflowY: "auto" }}>
              <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
                <thead><tr><th style={{ ...th, textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.15)" }}>KPI</th><th style={{ ...th, textAlign: "center", width: "24%", borderRight: "1px solid rgba(255,255,255,0.15)" }}>Actual</th><th style={{ ...th, textAlign: "center", width: "24%" }}>Target</th></tr></thead>
                <tbody>
                  {rows.map(({ kpi, category }, i) => {
                    if (kpi.isPanel) return null;
                    return (
                      <tr key={kpi.id} style={{ background: i % 2 ? T.panel : T.bg }}>
                        <td style={{ padding: "7px 12px", fontSize: "13.5px", color: T.ink, borderBottom: `1px solid ${T.lineSoft}`, borderRight: `1px solid ${T.lineSoft}` }}>
                          <div style={{ fontWeight: 600 }}>{kpi.name}</div>
                          <div style={{ fontSize: "11.5px", color: T.muted }}>{category} · {kpi.units}{kpi.field?.scalar ? " · applies to every month" : ""}</div>
                        </td>
                        {["actual", "budget"].map((which) => {
                          const path = which === "actual" ? kpi.field?.a : kpi.field?.b;
                          return (
                            <td key={which} style={{ padding: "4px 8px", borderBottom: `1px solid ${T.lineSoft}`, borderRight: which === "actual" ? `1px solid ${T.lineSoft}` : "none" }}>
                              {!path ? <div style={{ textAlign: "center", fontSize: "12.5px", color: T.faint, padding: "8px 0" }}>{which === "budget" && kpi.benchmark !== null ? `${fmtValue(kpi.benchmark, kpi)} benchmark` : "—"}</div>
                              : kpi.options ? <select value={value(kpi, which)} onChange={(e) => setValue(kpi, which, e.target.value)} style={{ ...cell, textAlign: "left" }}><option value="">—</option>{kpi.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                              : <input type="number" step="any" value={value(kpi, which)} placeholder="—" onChange={(e) => setValue(kpi, which, e.target.value)} style={cell} />}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};

// ==================== ADD KPI WIZARD ====================
const AddKpiWizard = ({ tabs, currentTabId, onBack, onClose, onSave }) => {
  const [tabId, setTabId] = useState(tabs.some((t) => t.id === currentTabId) ? currentTabId : tabs[0]?.id);
  const [catChoice, setCatChoice] = useState("");
  const [newCat, setNewCat] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", units: "#", direction: "higher", aggregate: "avg", meaning: "", measured: "" });

  const tab = tabs.find((t) => t.id === tabId);
  const cats = tab?.categories || [];
  useEffect(() => { if (cats.length && !catChoice) setCatChoice(cats[0].name); }, [tabId]);
  const creatingCat = catChoice === "__new__";
  const catName = creatingCat ? newCat.trim() : catChoice;
  const canSave = form.name.trim() && catName && form.meaning.trim() && form.measured.trim();

  const commit = async () => {
    if (!canSave) return;
    setSaving(true);
    await onSave({ id: `custom_${uid().slice(0, 8)}`, tabId, category: catName, name: form.name.trim(), units: form.units, direction: form.direction, aggregate: form.aggregate, meaning: form.meaning.trim(), measured: form.measured.trim() });
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Add KPI" subtitle="A custom marketing & sales metric you capture by hand each month" icon={<Sparkles size={17} />} onClose={onClose} width={720} footer={<><button onClick={onBack} style={btnGhost}><ArrowLeft size={13} /> Back</button><div style={{ flex: 1 }} /><button onClick={commit} disabled={!canSave || saving} style={{ ...btnPrimary, opacity: canSave && !saving ? 1 : 0.5 }}>{saving ? "Saving..." : "Create KPI"}</button></>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
        <div><label style={labelS}>Section</label><select value={tabId} onChange={(e) => { setTabId(e.target.value); setCatChoice(""); }} style={selectS}>{tabs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
        <div><label style={labelS}>Category</label><select value={catChoice} onChange={(e) => setCatChoice(e.target.value)} style={selectS}><option value="">Select…</option>{cats.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}<option value="__new__">＋ New category…</option></select>{creatingCat && <input value={newCat} onChange={(e) => setNewCat(e.target.value)} style={{ ...inputS, marginTop: "8px" }} placeholder="New category name" />}</div>
      </div>
      <div style={{ marginBottom: "14px" }}><label style={labelS}>KPI name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputS} placeholder="e.g. Lead Conversion Rate" /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <div><label style={labelS}>Units</label><select value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} style={selectS}><option value="#">Count (#)</option><option value="%">Percent (%)</option><option value="R">Currency (R)</option><option value="hrs">Hours</option><option value="days">Days</option><option value="units">Units</option></select></div>
        <div><label style={labelS}>What counts as good?</label><select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} style={selectS}>{DIRECTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
        <div><label style={labelS}>Rolling up</label><select value={form.aggregate} onChange={(e) => setForm({ ...form, aggregate: e.target.value })} style={selectS}><option value="avg">AVERAGE the months — rates, ratios</option><option value="sum">SUM the months — counts, hours, rand</option></select></div>
      </div>
      <div style={{ marginBottom: "14px" }}><label style={labelS}>What does this KPI mean? *</label><textarea rows="2" value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })} style={{ ...inputS, resize: "vertical" }} placeholder="In plain words — anyone reading the dashboard should get it from this sentence." /></div>
      <div><label style={{ ...labelS, display: "flex", alignItems: "center", gap: "6px" }}><Sigma size={13} /> How is this KPI measured? *</label><textarea rows="4" value={form.measured} onChange={(e) => setForm({ ...form, measured: e.target.value })} style={{ ...inputS, resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "13px" }} placeholder={"=SUM(Converted) / SUM(TotalLeads) * 100"} /><p style={{ fontSize: "12px", color: T.muted, marginTop: "7px", marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}><Info size={12} /> Use Excel functions and named ranges — SUM, AVERAGE, COUNTIF, COUNTIFS.</p></div>
    </Modal>
  );
};

// ==================== MARKETING DATA MODAL ====================
const MarketingDataModal = ({ mode, onClose, onSave, isInvestorView }) => {
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load data based on mode
    const loadData = () => {
      if (mode === "top3") {
        setData({
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
      } else if (mode === "channelPerf" || mode === "riskAnalysis") {
        setData({
          channels: [
            { name: "Social Media", revenue: 150000, spend: 45000 },
            { name: "Email", revenue: 120000, spend: 30000 },
            { name: "PPC", revenue: 80000, spend: 35000 },
            { name: "SEO", revenue: 60000, spend: 15000 },
            { name: "Referral", revenue: 50000, spend: 10000 },
            { name: "Direct", revenue: 40000, spend: 5000 },
          ],
        });
      } else if (mode === "campaignPerf") {
        setData({
          campaigns: [
            { name: "Q1 Campaign", cost: 25000, revenue: 45000 },
            { name: "Q2 Campaign", cost: 30000, revenue: 55000 },
            { name: "Summer Sale", cost: 15000, revenue: 35000 },
            { name: "Holiday Campaign", cost: 40000, revenue: 80000 },
          ],
        });
      } else if (mode === "pipelineTable") {
        setData({});
      }
    };
    loadData();
  }, [mode]);

  const commit = async () => {
    setSaving(true);
    await onSave(mode, data);
    setSaving(false);
    onClose();
  };

  const renderContent = () => {
    if (mode === "top3") {
      return (
        <div>
          <h4 style={{ color: T.accent, marginBottom: "15px" }}>Top 3 Concentration Data</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {["channels", "customers", "segments"].map((type) => (
              <div key={type}>
                <label style={labelS}>{type.charAt(0).toUpperCase() + type.slice(1)}</label>
                {(data[type] || []).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <input type="text" value={item.name || ""} onChange={(e) => {
                      const newData = { ...data };
                      newData[type][idx].name = e.target.value;
                      setData(newData);
                    }} style={{ ...inputS, flex: 2, minWidth: "100px" }} placeholder="Name" />
                    <input type="number" value={item.revenue || ""} onChange={(e) => {
                      const newData = { ...data };
                      newData[type][idx].revenue = parseFloat(e.target.value) || 0;
                      setData(newData);
                    }} style={{ ...inputS, flex: 1, minWidth: "80px" }} placeholder="Revenue" />
                    <input type="number" value={item.percentage || ""} onChange={(e) => {
                      const newData = { ...data };
                      newData[type][idx].percentage = parseFloat(e.target.value) || 0;
                      setData(newData);
                    }} style={{ ...inputS, flex: 1, minWidth: "60px" }} placeholder="%" />
                  </div>
                ))}
                <button onClick={() => {
                  const newData = { ...data };
                  newData[type] = [...(newData[type] || []), { name: "", revenue: 0, percentage: 0 }];
                  setData(newData);
                }} style={{ ...btnGhost, padding: "6px 12px", fontSize: "12px" }}><Plus size={13} /> Add</button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (mode === "channelPerf" || mode === "riskAnalysis") {
      return (
        <div>
          <h4 style={{ color: T.accent, marginBottom: "15px" }}>Channel Performance Data</h4>
          <div>
            <label style={labelS}>Channels</label>
            {(data.channels || []).map((item, idx) => (
              <div key={idx} style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                <input type="text" value={item.name || ""} onChange={(e) => {
                  const newData = { ...data };
                  newData.channels[idx].name = e.target.value;
                  setData(newData);
                }} style={{ ...inputS, flex: 2, minWidth: "120px" }} placeholder="Channel name" />
                <input type="number" value={item.revenue || ""} onChange={(e) => {
                  const newData = { ...data };
                  newData.channels[idx].revenue = parseFloat(e.target.value) || 0;
                  setData(newData);
                }} style={{ ...inputS, flex: 1, minWidth: "80px" }} placeholder="Revenue (R)" />
                <input type="number" value={item.spend || ""} onChange={(e) => {
                  const newData = { ...data };
                  newData.channels[idx].spend = parseFloat(e.target.value) || 0;
                  setData(newData);
                }} style={{ ...inputS, flex: 1, minWidth: "80px" }} placeholder="Spend (R)" />
              </div>
            ))}
            <button onClick={() => {
              const newData = { ...data };
              newData.channels = [...(newData.channels || []), { name: "", revenue: 0, spend: 0 }];
              setData(newData);
            }} style={{ ...btnGhost, padding: "6px 12px", fontSize: "12px" }}><Plus size={13} /> Add channel</button>
          </div>
        </div>
      );
    }

    if (mode === "campaignPerf") {
      return (
        <div>
          <h4 style={{ color: T.accent, marginBottom: "15px" }}>Campaign Performance Data</h4>
          <div>
            <label style={labelS}>Campaigns</label>
            {(data.campaigns || []).map((item, idx) => (
              <div key={idx} style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                <input type="text" value={item.name || ""} onChange={(e) => {
                  const newData = { ...data };
                  newData.campaigns[idx].name = e.target.value;
                  setData(newData);
                }} style={{ ...inputS, flex: 2, minWidth: "120px" }} placeholder="Campaign name" />
                <input type="number" value={item.cost || ""} onChange={(e) => {
                  const newData = { ...data };
                  newData.campaigns[idx].cost = parseFloat(e.target.value) || 0;
                  setData(newData);
                }} style={{ ...inputS, flex: 1, minWidth: "80px" }} placeholder="Cost (R)" />
                <input type="number" value={item.revenue || ""} onChange={(e) => {
                  const newData = { ...data };
                  newData.campaigns[idx].revenue = parseFloat(e.target.value) || 0;
                  setData(newData);
                }} style={{ ...inputS, flex: 1, minWidth: "80px" }} placeholder="Revenue (R)" />
              </div>
            ))}
            <button onClick={() => {
              const newData = { ...data };
              newData.campaigns = [...(newData.campaigns || []), { name: "", cost: 0, revenue: 0 }];
              setData(newData);
            }} style={{ ...btnGhost, padding: "6px 12px", fontSize: "12px" }}><Plus size={13} /> Add campaign</button>
          </div>
        </div>
      );
    }

    if (mode === "pipelineTable") {
      return (
        <div>
          <h4 style={{ color: T.accent, marginBottom: "15px" }}>Pipeline Data</h4>
          <p style={{ color: T.muted, marginBottom: "15px" }}>Pipeline records can be managed directly in the Pipeline Visibility tab. Use the "Add Record" button there to add new opportunities.</p>
        </div>
      );
    }

    return <p>No data editor available for this section.</p>;
  };

  return (
    <Modal title="Edit Marketing Data" icon={<Database size={17} />} onClose={onClose} width={860}
      footer={!isInvestorView && (
        <>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={commit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      )}>
      {isInvestorView ? (
        <div style={{ textAlign: "center", padding: "30px", color: T.muted }}>
          <Eye size={24} color={T.muted} />
          <p style={{ marginTop: "10px" }}>Investor view — data is read-only.</p>
          <button onClick={onClose} style={btnPrimary}>Close</button>
        </div>
      ) : (
        renderContent()
      )}
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

  const [pipelineRecords, setPipelineRecords] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const _now = new Date();
  const _toYM = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}`;
  const _fromD = new Date(_now.getFullYear(), _now.getMonth() - 11, 1);
  const _fromYM = `${_fromD.getFullYear()}-${String(_fromD.getMonth() + 1).padStart(2, "0")}`;
  const [filterMode, setFilterMode] = useState("range");
  const [fromDate, setFromDate] = useState(_fromYM);
  const [toDate, setToDate] = useState(_toYM);

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
    window.__setMarketingPanel = (mode) => {
      setMarketingPanel(mode);
    };
    return () => {
      delete window.__setMarketingPanel;
    };
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
      } finally { setLoading(false); }
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
      const srcMap = {
        top3: "concentration",
        channelPerf: "concentration",
        riskAnalysis: "concentration",
        campaignPerf: "sustainability",
        pipelineTable: "pipeline",
      };
      const src = srcMap[mode];
      if (!src) {
        notify("error", "Unknown panel type");
        return;
      }
      await writeDoc(src, (d) => {
        d[mode] = data;
      });
      notify("success", "Marketing data saved.");
    } catch (err) {
      console.error("Error saving marketing data:", err);
      notify("error", `Could not save: ${errText(err)}`);
    }
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
          kpi,
          categoryName: cat.name,
          tabName: activeTab.name,
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
    const list = allRows.filter(
      (r) =>
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
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX, startWidth = widths[key];
    resizing.current = key;
    const onMove = (ev) => setWidths((p) => ({ ...p, [key]: Math.max(80, startWidth + (ev.clientX - startX)) }));
    const onUp = () => {
      resizing.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

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
    padding: 0,
    background: T.header,
    borderBottom: `2px solid ${T.header}`,
    borderRight: "1px solid rgba(255,255,255,0.14)",
    position: "relative",
    verticalAlign: "top",
  };
  const tdS = {
    padding: "13px 14px",
    color: T.body,
    fontSize: "14px",
    overflow: "hidden",
    borderRight: `1px solid ${T.lineSoft}`,
  };
  const iconBtn = (c) => ({
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "5px",
    borderRadius: "6px",
    color: c,
    display: "inline-flex",
    alignItems: "center",
  });

  const handlePipelineRecordsChange = (records) => setPipelineRecords(records);

  if (loading) {
    return <div style={{ padding: "80px", textAlign: "center", color: T.body, fontSize: "14px" }}>Loading marketing & sales performance…</div>;
  }

  const panels = (activeTab?.categories || []).map((c) => c.panel).filter(Boolean);

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
          <button onClick={() => setManageTabs(true)} title="Show or hide dashboard tabs" style={{ ...btnQuiet, marginLeft: "auto", marginBottom: "4px", padding: "6px 12px", fontSize: "12.5px", color: T.muted }}>
            <Settings2 size={13} /> Manage Tabs
          </button>
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
                      <th
                        key={key}
                        draggable
                        onDragStart={(e) => handleDragStart(e, key)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, key)}
                        style={{ ...thS, width: widths[key], userSelect: "none" }}
                      >
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
                              <FilterDropdown
                                options={optionsFor(key)}
                                value={filters[key] || "All"}
                                onChange={(val) => setFilters(p => ({ ...p, [key]: val === "All" ? "" : val }))}
                                onClose={() => {}}
                              />
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

      {/* Panels based on tab - only shown for non-summary tabs */}
      {!isKpiTableTab && panels.includes("top3") && (
        <div style={{ ...cardS, marginBottom: "20px" }}>
          <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "15px", fontSize: "15px", fontWeight: 600 }}>Top 3 Concentration</h3>
          <Top3Concentration isInvestorView={isInvestorView} />
        </div>
      )}

      {!isKpiTableTab && panels.includes("channelPerf") && (
        <div style={{ ...cardS, marginBottom: "20px" }}>
          <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "15px", fontSize: "15px", fontWeight: 600 }}>Channel Performance</h3>
          <ChannelPerformanceTable isInvestorView={isInvestorView} />
        </div>
      )}

      {!isKpiTableTab && panels.includes("riskAnalysis") && (
        <div style={{ ...cardS, background: T.panel, marginBottom: "20px" }}>
          <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "15px", fontSize: "15px", fontWeight: 600 }}>Concentration Risk Analysis</h3>
          <ConcentrationRiskBarChart isInvestorView={isInvestorView} />
        </div>
      )}

      {!isKpiTableTab && panels.includes("campaignPerf") && (
        <div style={{ ...cardS, marginBottom: "20px" }}>
          <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "15px", fontSize: "15px", fontWeight: 600 }}>Campaign Performance</h3>
          <CampaignPerformanceTable isInvestorView={isInvestorView} />
        </div>
      )}

      {/* Pipeline Visibility - Table only (Tier Category) */}
      {activeTabId === "pipeline-visibility" && (
        <div className="mt-5">
          <PipelineTable currentUser={user} isInvestorView={isInvestorView} onDataChange={handlePipelineRecordsChange} />
        </div>
      )}

      {infoKpi && <KpiInfoModal kpi={infoKpi} readOnly={isInvestorView} onClose={() => setInfoKpi(null)} onSave={(patch) => { updateKpiMeta(infoKpi.id, patch); setInfoKpi({ ...infoKpi, ...patch }); notify("success", "KPI details updated."); }} />}
      {chartKpi && <TrendChartModal kpi={chartKpi} period={period} fy={fy} readOnly={isInvestorView} onClose={() => setChartKpi(null)} onSaveNote={(key, text) => { const notes = { ...(chartKpi.periodNotes || {}) }; if (text.trim()) notes[key] = text.trim(); else delete notes[key]; updateKpiMeta(chartKpi.id, { periodNotes: notes }); setChartKpi({ ...chartKpi, periodNotes: notes }); }} onSaveChart={(chart) => { updateKpiMeta(chartKpi.id, { chart }); setChartKpi({ ...chartKpi, chart }); }} />}
      {analysisKpi && <AnalysisModal kpi={analysisKpi} period={period} fy={fy} onClose={() => setAnalysisKpi(null)} />}
      {actionKpi && <AddActionModal kpi={actionKpi.kpi} period={period} fy={fy} categoryName={actionKpi.categoryName} tabName={actionKpi.tabName} userId={user?.uid} onClose={() => setActionKpi(null)} onSaved={(m) => notify("success", `Action added to "${m}" and Integrated Actions.`)} />}
      {notesKpi && <NotesModal kpi={notesKpi} readOnly={isInvestorView} onClose={() => setNotesKpi(null)} onSave={(notes) => { updateKpiMeta(notesKpi.id, { notes }); setNotesKpi({ ...notesKpi, notes }); }} />}

      {marketingPanel && (
        <MarketingDataModal 
          mode={marketingPanel} 
          onClose={() => setMarketingPanel(null)} 
          onSave={saveMarketingPanelData}
          isInvestorView={isInvestorView}
        />
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
          <p style={{ fontSize: "12.5px", color: T.muted, marginTop: "10px", marginBottom: 0, display: "flex", alignItems: "flex-start", gap: "6px" }}><Info size={12} style={{ marginTop: "2px", flexShrink: 0 }} /> Tabs are built in, so they hide rather than delete — the underlying marketing data is shared with the rest of the platform.</p>
        </Modal>
      )}

      {addFlow === "choose" && <AddChooser onClose={() => setAddFlow(null)} onPick={(k) => setAddFlow(k)} />}

      {addFlow === "data" && (
        <AddDataWizard 
          tabs={tabs} 
          fy={fy} 
          docs={docs} 
          currentTabId={activeTabId} 
          prefs={dataPrefs} 
          onSavePrefs={savePrefs} 
          onBack={() => setAddFlow("choose")} 
          onClose={() => setAddFlow(null)} 
          onSaveField={saveKpiField}
        />
      )}

      {addFlow === "kpi" && (
        <AddKpiWizard tabs={tabs} currentTabId={activeTabId} onBack={() => setAddFlow("choose")} onClose={() => setAddFlow(null)} onSave={async (kpi) => { await persistMeta({ ...meta, custom: [...(meta.custom || []), kpi] }); notify("success", "KPI created."); }} />
      )}
    </div>
  );
};

export default MarketingSales;