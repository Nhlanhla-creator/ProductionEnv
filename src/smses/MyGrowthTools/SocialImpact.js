"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { Bar, Line, Pie, Doughnut, Chart } from "react-chartjs-2"
import { db, auth } from "../../firebaseConfig"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import ChartDataLabels from 'chartjs-plugin-datalabels';
import ESGAnalysisModal from "../hooks/ESGAnalysisModal";
import {
  Eye, ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, XCircle, Info, SlidersHorizontal, Columns3,
  CheckSquare, Square, StickyNote, Lightbulb, Download, RefreshCw, X,
  Settings2, Trash2, Calendar, Database, Sparkles, Sigma, Palette, Check,
  FileText, ClipboardList, ExternalLink
} from "lucide-react"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
)

// ─── Design Tokens ──────────────────────────────────────────────────────────
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
}

const btnBase = { padding: "9px 16px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "inherit" }
const btnPrimary = { ...btnBase, background: T.accent, color: "#fff", border: `1px solid ${T.accent}`, fontWeight: 600 }
const btnGhost = { ...btnBase, background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}` }
const btnQuiet = { ...btnBase, background: "transparent", color: T.accent, border: "1px solid transparent" }
const inputS = { width: "100%", padding: "9px 11px", border: `1px solid ${T.lineStrong}`, borderRadius: "8px",
  fontSize: "13.5px", fontFamily: "inherit", boxSizing: "border-box", color: T.ink, background: T.bg, outline: "none" }
const selectS = { ...inputS, cursor: "pointer" }
const labelS = { display: "block", fontSize: "12.5px", fontWeight: 600, color: T.accent, marginBottom: "5px" }
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "14px 16px" }

// ─── Helper Functions ──────────────────────────────────────────────────────
const getMonthsForYear = (financialYearEnd) => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  let yearEnd = financialYearEnd || "2026-03"
  let endYear = parseInt(yearEnd.split('-')[0])
  let endMonth = parseInt(yearEnd.split('-')[1]) - 1
  let startYear = endYear - 1
  let startMonth = endMonth + 1
  const months = []
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  let year = startYear
  let month = startMonth
  while (year < currentYear || (year === currentYear && month <= currentMonth)) {
    months.push(`${monthNames[month]}(${year})`)
    month++
    if (month > 11) { month = 0; year++ }
    if (year > currentYear + 1) break
  }
  return months
}

const parseCurrency = (value) => {
  if (!value) return 0
  if (typeof value === 'string') return parseInt(value.replace(/[^\d]/g, '')) || 0
  return value
}

const trimNum = (n) => {
  if (!Number.isFinite(n)) return ""
  const abs = Math.abs(n), dp = abs >= 100 ? 0 : abs >= 10 ? 1 : 2
  return Number(n.toFixed(dp)).toLocaleString("en-US", { maximumFractionDigits: dp })
}

const fmtValue = (raw, kpi, { signed = false, bare = false } = {}) => {
  if (raw === null || raw === undefined || raw === "") return "—"
  let n = Number(raw)
  if (!Number.isFinite(n)) return "—"
  const sign = signed && n > 0 ? "+" : ""
  if (kpi?.units === "%") {
    if (kpi.percentFormat === "fraction") n *= 100
    return `${sign}${trimNum(n)}${bare ? "" : "%"}`
  }
  if (kpi?.units === "R") {
    const dp = Math.abs(n) >= 1000 ? 0 : 2
    const body = n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })
    return bare ? `${sign}${body}` : `${sign}R ${body}`
  }
  const suffix = !bare && kpi?.units && !["#","%","R"].includes(kpi.units) ? ` ${kpi.units}` : ""
  return `${sign}${trimNum(n)}${suffix}`
}

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2,9)}`

// ─── Info Tip ──────────────────────────────────────────────────────────────
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

// ─── Key Question ──────────────────────────────────────────────────────────
const KeyQuestionBox = ({ question, signals, decisions }) => {
  const [showMore, setShowMore] = useState(false)
  const getFirstSentence = (text) => {
    const match = text.match(/^[^.!?]+[.!?]/)
    return match ? match[0] : text.split('.')[0] + '.'
  }
  return (
    <div style={{ backgroundColor: T.panel, padding: "15px 20px", borderRadius: "8px", marginBottom: "20px", border: `1px solid ${T.line}` }}>
      <div style={{ marginBottom: "8px" }}>
        <strong style={{ color: T.accent, fontSize: "14px" }}>Key Question:</strong>
        <span style={{ color: T.body, fontSize: "14px", marginLeft: "8px" }}>
          {showMore ? question : getFirstSentence(question)}
        </span>
        {!showMore && (question.length > getFirstSentence(question).length || signals || decisions) && (
          <button onClick={() => setShowMore(true)} style={{ background: "none", border: "none", color: T.accent, fontWeight: "600", cursor: "pointer", marginLeft: "5px", textDecoration: "underline" }}>See more</button>
        )}
      </div>
      {showMore && (
        <>
          {signals && <div style={{ marginBottom: "8px" }}><strong style={{ color: T.accent, fontSize: "14px" }}>Key Signals:</strong><span style={{ color: T.body, fontSize: "14px", marginLeft: "8px" }}>{signals}</span></div>}
          {decisions && <div><strong style={{ color: T.accent, fontSize: "14px" }}>Key Decisions:</strong><span style={{ color: T.body, fontSize: "14px", marginLeft: "8px" }}>{decisions}</span></div>}
          <button onClick={() => setShowMore(false)} style={{ background: "none", border: "none", color: T.accent, fontWeight: "600", cursor: "pointer", marginTop: "10px", textDecoration: "underline" }}>See less</button>
        </>
      )}
    </div>
  )
}

// ─── Modal (EXACT copy from Operational Performance) ────────────────────────
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

// ─── KPI Info Modal ────────────────────────────────────────────────────────
const KpiInfoModal = ({ kpi, onClose }) => (
  <Modal title={kpi.name} subtitle="What it means and how it is measured" icon={<Eye size={17} />} onClose={onClose}
    footer={<button onClick={onClose} style={btnPrimary}>Close</button>}>
    <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "18px" }}>
      {[`Category: ${kpi.category}`, `Unit: ${kpi.unit}`].map((c) => (
        <span key={c} style={{ fontSize: "12px", padding: "4px 11px", borderRadius: "999px", background: T.raised, color: T.body }}>{c}</span>
      ))}
    </div>
    <div style={{ marginBottom: "18px" }}>
      <label style={labelS}>What does this KPI mean?</label>
      <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: "8px", padding: "13px 15px", fontSize: "14px", lineHeight: 1.65, color: T.body }}>
        {kpi.meaning || "Not captured yet."}
      </div>
    </div>
    <div>
      <label style={{ ...labelS, display: "flex", alignItems: "center", gap: "6px" }}><Sigma size={13} /> How is this KPI measured?</label>
      <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: "8px", padding: "13px 15px", fontSize: "13px", lineHeight: 1.65, color: T.body, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", whiteSpace: "pre-wrap" }}>
        {kpi.measured || "Not captured yet."}
      </div>
    </div>
  </Modal>
);

// ════════════════════════════════════════════════════════════════════════════
//  KPI TABLE — EXACT COPY OF OPERATIONAL PERFORMANCE DESIGN
// ════════════════════════════════════════════════════════════════════════════
const KPITable = ({ title, categories, data, isInvestorView, onInfo, onAnalysis }) => {
  const [filters, setFilters] = useState({ category: "all", kpi: "all", unit: "all", value: "all" });
  const [openFilter, setOpenFilter] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [widths, setWidths] = useState({ category: 180, kpi: 280, unit: 100, value: 150, actions: 140 });
  const [visibility, setVisibility] = useState({ category: true, kpi: true, unit: true, value: true });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const resizing = useRef(null);

  // Flatten the categories data into table rows
  const allRows = useMemo(() => {
    const rows = [];
    categories.forEach(cat => {
      cat.kpis.forEach(kpi => {
        rows.push({
          category: cat.category,
          kpi: kpi.name,
          unit: kpi.unit,
          value: data[kpi.key] ?? "N/A",
          meaning: `This KPI tracks ${kpi.name.toLowerCase()}.`,
          measured: `Measured in ${kpi.unit}.`,
        });
      });
    });
    return rows;
  }, [categories, data]);

  const optionsFor = (key) => {
    const set = new Set();
    allRows.forEach(r => set.add(r[key]));
    return ["all", ...Array.from(set).sort()];
  };

  const rows = useMemo(() => {
    const list = allRows.filter(r =>
      (filters.category === "all" || r.category === filters.category) &&
      (filters.kpi === "all" || r.kpi === filters.kpi) &&
      (filters.unit === "all" || r.unit === filters.unit) &&
      (filters.value === "all" || String(r.value) === filters.value)
    );
    const get = {
      category: (r) => r.category,
      kpi: (r) => r.kpi,
      unit: (r) => r.unit,
      value: (r) => Number(r.value) || 0,
    }[sortConfig.key];
    return [...list].sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      if (!get) return 0;
      const av = get(a), bv = get(b);
      if (typeof av === "number" && typeof bv === "number") return sortConfig.direction === "asc" ? av - bv : bv - av;
      const cmp = String(av).localeCompare(String(bv));
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [allRows, filters, sortConfig]);

  const groupedRows = useMemo(() => {
    const groups = [];
    rows.forEach(r => {
      const last = groups[groups.length - 1];
      if (last && last.name === r.category) last.items.push(r);
      else groups.push({ name: r.category, items: [r] });
    });
    return groups;
  }, [rows]);

  const visibleColumns = ["category", "kpi", "unit", "value"].filter(k => visibility[k]);
  const totalWidth = visibleColumns.reduce((s, k) => s + widths[k], 0) + widths.actions;
  const activeFilterCount = Object.values(filters).filter(v => v !== "all").length;

  const startResize = (e, key) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX, startWidth = widths[key];
    resizing.current = key;
    const onMove = (ev) => setWidths(p => ({ ...p, [key]: Math.max(80, startWidth + (ev.clientX - startX)) }));
    const onUp = () => {
      resizing.current = null;
      document.body.style.cursor = ""; document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp);
    };
    document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };

  const toggleSort = (key) => setSortConfig(p => ({ key, direction: p.key === key && p.direction === "asc" ? "desc" : "asc" }));
  const clearFilters = () => { setFilters({ category: "all", kpi: "all", unit: "all", value: "all" }); setSortConfig({ key: null, direction: "asc" }); };

  const COLUMN_DEFS = {
    category: { label: "Category", width: 180, align: "left", filter: true, sort: true, hideable: true, tip: "The ESG category this KPI sits under." },
    kpi: { label: "Key Performance Indicator", width: 280, align: "left", filter: true, sort: true, hideable: false, tip: "The metric being tracked." },
    unit: { label: "Unit", width: 100, align: "center", filter: true, sort: true, hideable: true, tip: "The unit every figure in this row is expressed in." },
    value: { label: "Current Value", width: 150, align: "center", filter: true, sort: true, hideable: true, tip: "The current value recorded for this period." },
  };

  const thS = { padding: 0, background: T.header, borderBottom: `2px solid ${T.header}`,
    borderRight: "1px solid rgba(255,255,255,0.14)", position: "relative", verticalAlign: "top" };
  const tdS = { padding: "13px 14px", color: T.body, fontSize: "14px", overflow: "hidden", borderRight: `1px solid ${T.lineSoft}` };
  const iconBtn = (c) => ({ background: "none", border: "none", cursor: "pointer", padding: "5px", borderRadius: "6px", color: c, display: "inline-flex", alignItems: "center" });

  return (
    <div style={{ ...cardS, marginBottom: "20px", padding: 0 }}>
      {/* Card header */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <h3 style={{ color: T.accent, margin: 0, fontSize: "16px", fontWeight: 600 }}>{title}</h3>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "12.5px", color: T.muted }}>{rows.length} of {allRows.length} KPIs</span>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} style={{ ...btnQuiet, padding: "3px 10px", fontSize: "12.5px", border: `1px solid ${T.lineStrong}`, borderRadius: "999px" }}>
              Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
            </button>
          )}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowColumnMenu(v => !v)} style={{ ...btnGhost, padding: "5px 10px", fontSize: "12.5px" }}><Columns3 size={13} /> Columns</button>
            {showColumnMenu && (
              <>
                <div onClick={() => setShowColumnMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 400 }} />
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: "220px", background: T.bg, border: `1px solid ${T.lineStrong}`, borderRadius: "10px", boxShadow: "0 12px 30px rgba(45,32,28,0.16)", padding: "8px", zIndex: 401 }}>
                  {Object.keys(COLUMN_DEFS).map(key => {
                    const def = COLUMN_DEFS[key];
                    return (
                      <div key={key} onClick={() => def.hideable && setVisibility(p => ({ ...p, [key]: !p[key] }))}
                        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 9px", borderRadius: "7px", cursor: def.hideable ? "pointer" : "not-allowed", opacity: def.hideable ? 1 : 0.5, fontSize: "13.5px", color: T.body }}>
                        {visibility[key] ? <CheckSquare size={14} color={T.accent} /> : <Square size={14} color={T.muted} />}
                        <span style={{ flex: 1 }}>{def.label}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: totalWidth, minWidth: "100%", tableLayout: "fixed" }}>
          <thead>
            <tr>
              {visibleColumns.map(key => {
                const def = COLUMN_DEFS[key];
                const isOpen = openFilter === key;
                const sorted = sortConfig.key === key;
                const filtered = def.filter && filters[key] !== "all";
                const align = def.align === "center" ? "center" : "flex-start";
                return (
                  <th key={key} style={{ ...thS, width: widths[key] }}>
                    <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "6px", alignItems: align }}>
                      <span style={{ display: "flex", alignItems: "flex-start", gap: "5px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", lineHeight: 1.3 }}>{def.label}</span>
                        <InfoTip text={def.tip} light />
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                        {def.sort && (
                          <button onClick={() => toggleSort(key)} style={iconBtn(sorted ? "#fff" : "rgba(255,255,255,0.6)")}>
                            {sorted ? (sortConfig.direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} />}
                          </button>
                        )}
                        {def.filter && (
                          <button onClick={() => setOpenFilter(isOpen ? null : key)} style={{ ...iconBtn(filtered ? "#fff" : "rgba(255,255,255,0.6)"), background: filtered ? "rgba(255,255,255,0.16)" : "transparent" }}>
                            <SlidersHorizontal size={13} />
                          </button>
                        )}
                      </span>
                    </div>
                    {isOpen && def.filter && (
                      <div onMouseLeave={() => setOpenFilter(null)} style={{ position: "absolute", top: "100%", left: 0, marginTop: "2px", background: T.bg, border: `1px solid ${T.lineStrong}`, borderRadius: "10px", minWidth: "215px", maxHeight: "260px", overflowY: "auto", zIndex: 600, boxShadow: "0 12px 30px rgba(45,32,28,0.18)", padding: "6px" }}>
                        {optionsFor(key).map(opt => (
                          <div key={opt} onClick={() => { setFilters(p => ({ ...p, [key]: opt })); setOpenFilter(null); }}
                            style={{ padding: "8px 10px", cursor: "pointer", fontSize: "13.5px", borderRadius: "7px", background: filters[key] === opt ? T.accentTint : "transparent", color: filters[key] === opt ? T.accent : T.body, fontWeight: filters[key] === opt ? 600 : 400 }}>
                            {opt === "all" ? `All ${def.label.toLowerCase()}` : opt}
                          </div>
                        ))}
                      </div>
                    )}
                    <div onMouseDown={(e) => startResize(e, key)} style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                  </th>
                );
              })}
              <th style={{ ...thS, width: widths.actions, borderRight: "none" }}>
                <div style={{ padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>Actions</span>
                  <span style={{ height: "23px" }} />
                </div>
                <div onMouseDown={(e) => startResize(e, "actions")} style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
              </th>
            </tr>
          </thead>
          <tbody>
            {groupedRows.length === 0 ? (
              <tr><td colSpan={visibleColumns.length + 1} style={{ ...tdS, textAlign: "center", padding: "56px 16px", color: T.muted, borderRight: "none" }}>No KPIs match the current filters.</td></tr>
            ) : groupedRows.map(group => group.items.map((row, idx) => {
              const last = idx === group.items.length - 1;
              const rowTd = { ...tdS, borderBottom: last ? `2px solid ${T.lineStrong}` : `1px solid ${T.lineSoft}` };
              const cell = (key, content) => visibility[key] ? (
                <td key={key} style={{ ...rowTd, width: widths[key], textAlign: COLUMN_DEFS[key].align === "center" ? "center" : "left" }}>{content}</td>
              ) : null;

              return (
                <tr key={`${row.category}-${row.kpi}`}>
                  {visibility.category && idx === 0 && (
                    <td rowSpan={group.items.length} style={{ ...tdS, width: widths.category, background: T.panel, fontWeight: 700, color: T.accent, verticalAlign: "middle", borderBottom: `2px solid ${T.lineStrong}`, borderRight: `1px solid ${T.lineStrong}`, fontSize: "13.5px" }}>
                      {group.name}
                    </td>
                  )}
                  {cell("kpi", <span style={{ fontWeight: 500, color: T.ink }}>{row.kpi}</span>)}
                  {cell("unit", <span style={{ color: T.muted }}>{row.unit}</span>)}
                  {cell("value", <span style={{ fontWeight: 700, color: T.ink }}>{row.value !== "N/A" ? row.value : "—"}</span>)}
                  <td style={{ ...rowTd, width: widths.actions, textAlign: "center", borderRight: "none" }}>
                    <div style={{ display: "flex", gap: "1px", justifyContent: "center", alignItems: "center" }}>
                      <button onClick={() => onInfo(row)} style={iconBtn(T.body)} title="Info"><Eye size={16} /></button>
                      <button onClick={() => onAnalysis(row)} style={iconBtn(T.body)} title="AI Analysis"><Lightbulb size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* Card footer with legend */}
      <div style={{ padding: "11px 16px", borderTop: `1px solid ${T.lineStrong}`, background: T.panel, fontSize: "12px",
        color: T.body, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <span>{groupedRows.length} categories · {rows.length} KPIs listed</span>
      </div>
    </div>
  );
};

// ─── ESG Chart Card (used in Social Tab) ───────────────────────────────────
const ESGChartCard = ({ 
  title, chartType, data, options, kpiKey, unit = "", 
  isInvestorView, currentUser, section, subSection, kpiValue, contextData = {}, metricType = "percentage"
}) => {
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedMetricForAnalysis, setSelectedMetricForAnalysis] = useState(null);

  const handleAIAnalysis = () => {
    let formattedValue = kpiValue;
    if (metricType === "percentage") formattedValue = `${kpiValue}%`;
    else if (metricType === "currency") formattedValue = `R${(kpiValue / 1000000).toFixed(2)}M`;
    else if (metricType === "rating") formattedValue = `Level ${kpiValue}`;

    setSelectedMetricForAnalysis({
      title: title, key: kpiKey, value: kpiValue, formattedValue: formattedValue,
      contextData: { ...contextData, metricType: metricType, unit: unit },
    });
    setShowAnalysisModal(true);
  };

  const renderChart = () => {
    const chartOptions = {
      ...options,
      plugins: {
        ...options?.plugins,
        datalabels: {
          ...options?.plugins?.datalabels,
          display: chartType === "pie" || chartType === "doughnut",
          color: "#ffffff",
          font: { weight: "bold", size: 14 },
          formatter: (value, context) => {
            if (chartType === "pie" || chartType === "doughnut") return value + '%';
            return null;
          },
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context) => {
              let label = context.dataset.label || '';
              let value = context.raw;
              if (metricType === "percentage") return `${label}: ${value}%`;
              else if (metricType === "currency") return `${label}: R${(value / 1000000).toFixed(2)}M`;
              return `${label}: ${value}`;
            }
          }
        }
      },
    };

    switch (chartType) {
      case "bar": return <Bar data={data} options={chartOptions} />;
      case "line": return <Line data={data} options={chartOptions} />;
      case "pie": return <Pie data={data} options={chartOptions} />;
      case "doughnut": return <Doughnut data={data} options={chartOptions} />;
      default: return <Bar data={data} options={chartOptions} />;
    }
  };

  const getBenchmark = () => {
    if (contextData.benchmark) return contextData.benchmark;
    return 50;
  };

  return (
    <div style={cardS}>
      <h4 style={{ color: T.accent, marginBottom: "15px", fontSize: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {title}
        {metricType === "rating" && (
          <span style={{ fontSize: "12px", backgroundColor: T.raised, padding: "2px 8px", borderRadius: "12px", color: T.body }}>B-BBEE Level</span>
        )}
      </h4>
      <div style={{ height: "250px" }}>{renderChart()}</div>

      {!isInvestorView && (
        <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: "15px", marginTop: "10px" }}>
          <button onClick={handleAIAnalysis} style={{ ...btnGhost, padding: "6px 12px", fontSize: "12px" }}>
            🤖 AI Analysis
          </button>
        </div>
      )}

      {showAnalysisModal && selectedMetricForAnalysis && (
        <ESGAnalysisModal
          isOpen={showAnalysisModal}
          onClose={() => { setShowAnalysisModal(false); setSelectedMetricForAnalysis(null); }}
          kpiTitle={selectedMetricForAnalysis.title}
          kpiKey={selectedMetricForAnalysis.key}
          kpiValue={selectedMetricForAnalysis.value}
          contextData={{ ...selectedMetricForAnalysis.contextData, benchmark: getBenchmark() }}
          company={{ name: "Your Business", stage: "Growth Stage", industry: "General" }}
          currentUser={currentUser}
          section={section}
          subSection={subSection}
        />
      )}
    </div>
  );
};

// ─── Environmental Tab (KPI Summary Table) ──────────────────────────────────
const EnvironmentalTab = ({ userData, isInvestorView }) => {
  const [infoKpi, setInfoKpi] = useState(null);
  const [analysisKpi, setAnalysisKpi] = useState(null);

  const envCategories = [
    { category: "Energy & Fuel", kpis: [ 
      { name: "Electricity consumed", key: "electricityConsumed", unit: "kWh" }, 
      { name: "Fuel consumed", key: "fuelConsumed", unit: "Litres by fuel type" }, 
      { name: "Renewable electricity share", key: "renewableShare", unit: "%" }, 
      { name: "Energy intensity", key: "energyIntensity", unit: "kWh per output unit" } 
    ]},
    { category: "Water", kpis: [ 
      { name: "Water consumed", key: "waterConsumed", unit: "m³" }, 
      { name: "Water intensity", key: "waterIntensity", unit: "m³ per output unit" }, 
      { name: "Water reused or recycled", key: "waterRecycled", unit: "%" } 
    ]},
    { category: "Waste", kpis: [ 
      { name: "Total waste generated", key: "totalWaste", unit: "kg or tonnes" }, 
      { name: "Waste diverted from disposal", key: "wasteDiverted", unit: "%" }, 
      { name: "Hazardous waste generated", key: "hazardousWaste", unit: "kg or tonnes" } 
    ]},
    { category: "Emissions", kpis: [ 
      { name: "Scope 1 emissions", key: "scope1", unit: "tCO₂e" }, 
      { name: "Scope 2 emissions", key: "scope2", unit: "tCO₂e" }, 
      { name: "Emissions intensity", key: "emissionsIntensity", unit: "kgCO₂e per output unit" } 
    ]},
    { category: "Environmental Compliance", kpis: [ 
      { name: "Required permits valid", key: "permitsValid", unit: "%" }, 
      { name: "Overdue environmental obligations", key: "overdueObligations", unit: "#" }, 
      { name: "Environmental non-compliances recorded", key: "nonCompliances", unit: "#" } 
    ]},
    { category: "Incidents & Corrective Actions", kpis: [ 
      { name: "Environmental incidents, split by severity", key: "incidents", unit: "#" }, 
      { name: "Corrective actions completed on time", key: "correctiveActions", unit: "%" }, 
      { name: "Overdue corrective actions", key: "overdueActions", unit: "#" } 
    ]}
  ];

  return (
    <div>
      <KPITable 
        title="Environment" 
        categories={envCategories} 
        data={userData || {}} 
        isInvestorView={isInvestorView}
        onInfo={(row) => setInfoKpi(row)}
        onAnalysis={(row) => setAnalysisKpi(row)}
      />
      {infoKpi && <KpiInfoModal kpi={infoKpi} onClose={() => setInfoKpi(null)} />}
      {analysisKpi && <ESGAnalysisModal isOpen={true} onClose={() => setAnalysisKpi(null)} kpiTitle={analysisKpi.kpi} kpiKey={analysisKpi.kpi} kpiValue={analysisKpi.value} contextData={{}} company={{ name: "Your Business" }} currentUser={null} section="environmental" subSection="" />}
    </div>
  );
};

// ─── Governance Tab (KPI Summary Table) ─────────────────────────────────────
const GovernanceTab = ({ userData, isInvestorView }) => {
  const [infoKpi, setInfoKpi] = useState(null);
  const [analysisKpi, setAnalysisKpi] = useState(null);

  const govCategories = [
    { category: "Policies & SOPs", kpis: [ 
      { name: "Required policies approved and current", key: "policiesApproved", unit: "%" }, 
      { name: "Critical SOPs documented and current", key: "sopsDocumented", unit: "%" }, 
      { name: "Required policy acknowledgements completed", key: "policyAcks", unit: "%" } 
    ]},
    { category: "Risk & Controls", kpis: [ 
      { name: "High/critical risks with an owner and treatment plan", key: "highRisksOwned", unit: "%" }, 
      { name: "Scheduled control checks completed", key: "controlChecks", unit: "%" }, 
      { name: "Overdue high-priority risk actions", key: "overdueRiskActions", unit: "#" } 
    ]},
    { category: "Reporting & Compliance", kpis: [ 
      { name: "Required submissions completed on time", key: "submissionsOnTime", unit: "%" }, 
      { name: "Management reports delivered on time", key: "reportsOnTime", unit: "%" }, 
      { name: "Overdue compliance obligations", key: "overdueCompliance", unit: "#" } 
    ]},
    { category: "Ownership & Transparency", kpis: [ 
      { name: "Required ownership/control records current", key: "ownershipRecords", unit: "%" }, 
      { name: "Required conflict-of-interest declarations current", key: "conflictDeclarations", unit: "%" } 
    ]},
    { category: "Oversight & Accountability", kpis: [ 
      { name: "Planned oversight meetings held", key: "oversightMeetings", unit: "%" }, 
      { name: "Meeting attendance", key: "meetingAttendance", unit: "%" }, 
      { name: "Decisions/actions completed by due date", key: "decisionsCompleted", unit: "%" } 
    ]},
    { category: "Ethics & Conduct", kpis: [ 
      { name: "Required ethics training completed", key: "ethicsTraining", unit: "%" }, 
      { name: "Substantiated misconduct cases", key: "misconductCases", unit: "#" }, 
      { name: "Cases resolved within agreed timeframe", key: "casesResolved", unit: "%" } 
    ]},
    { category: "Leadership Representation", kpis: [ 
      { name: "Women in governing body", key: "womenGoverning", unit: "%" }, 
      { name: "Women in senior management", key: "womenSenior", unit: "%" } 
    ]}
  ];

  return (
    <div>
      <KPITable 
        title="Governance" 
        categories={govCategories} 
        data={userData || {}} 
        isInvestorView={isInvestorView}
        onInfo={(row) => setInfoKpi(row)}
        onAnalysis={(row) => setAnalysisKpi(row)}
      />
      {infoKpi && <KpiInfoModal kpi={infoKpi} onClose={() => setInfoKpi(null)} />}
      {analysisKpi && <ESGAnalysisModal isOpen={true} onClose={() => setAnalysisKpi(null)} kpiTitle={analysisKpi.kpi} kpiKey={analysisKpi.kpi} kpiValue={analysisKpi.value} contextData={{}} company={{ name: "Your Business" }} currentUser={null} section="governance" subSection="" />}
    </div>
  );
};

// ─── Social Tab ────────────────────────────────────────────────────────────
const SocialTab = ({ 
  activeSubTab, setActiveSubTab, userData, onSave, isInvestorView, fundingAppData, financialData, currentUser
}) => {
  const [activeSpendTab, setActiveSpendTab] = useState("csi")
  const [financialYearEnd, setFinancialYearEnd] = useState("2026-03")
  const [localUserData, setLocalUserData] = useState(userData || {})

  useEffect(() => {
    if (fundingAppData) {
      const mergedData = {
        ...localUserData,
        jobsCreated: fundingAppData.jobsToCreate || localUserData?.jobsCreated || 0,
        shareholderRaceBlack: fundingAppData.blackOwnership || localUserData?.shareholderRaceBlack || 0,
        shareholderGenderFemale: fundingAppData.womenOwnership || localUserData?.shareholderGenderFemale || 0,
        youthLeadership: fundingAppData.youthOwnership || localUserData?.youthLeadership || 0,
        eap: fundingAppData.disabledOwnership || localUserData?.eap || 0,
        csiSpend: parseCurrency(fundingAppData.csiCsrSpend) || localUserData?.csiSpend || 500000,
        hdiVendorSpend: parseCurrency(fundingAppData.localProcurementSpend) || localUserData?.hdiVendorSpend || 750000,
        numberOfBeneficiaries: fundingAppData.numberOfBeneficiaries || localUserData?.numberOfBeneficiaries || 1000,
        environmentalImpact: fundingAppData.environmentalImpact || localUserData?.environmentalImpact || "",
        sdgAlignment: fundingAppData.sdgAlignment || localUserData?.sdgAlignment || "",
      }
      setLocalUserData(mergedData)
      if (JSON.stringify(mergedData) !== JSON.stringify(userData)) onSave(mergedData)
    }

    if (financialData) {
      const mergedData = {
        ...localUserData,
        hdiSpent: financialData?.balanceSheetData?.assets?.additionalMetrics?.hdiSpent?.[0] || localUserData?.hdiVendorSpend || 750000,
        trainingSpend: financialData?.balanceSheetData?.assets?.additionalMetrics?.trainingSpend?.[0] || localUserData?.trainingSpend || 250000,
        labourCost: financialData?.balanceSheetData?.assets?.additionalMetrics?.labourCost?.[0] || localUserData?.labourCost || 2000000,
        numberOfEmployees: financialData?.balanceSheetData?.assets?.additionalMetrics?.numberOfEmployees?.[0] || localUserData?.numberOfEmployees || 50,
        revenuePerEmployee: financialData?.balanceSheetData?.assets?.additionalMetrics?.revenuePerEmployee?.[0] || localUserData?.revenuePerEmployee || 500000,
      }
      setLocalUserData(mergedData)
      if (JSON.stringify(mergedData) !== JSON.stringify(userData)) onSave(mergedData)
    }
  }, [fundingAppData, financialData])

  const getPieChartOptions = (title, showLegend = true) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: showLegend ? "bottom" : "none", labels: { color: T.body, font: { size: 12 } } },
      tooltip: { enabled: true },
      datalabels: { color: "#ffffff", font: { weight: "bold", size: 16 }, formatter: (value, context) => value + '%', anchor: 'center', align: 'center', offset: 0 }
    }
  })

  const handleDropdownChange = (field, value) => {
    const updatedData = { ...localUserData, [field]: value };
    setLocalUserData(updatedData)
    onSave(updatedData);
  }

  const renderWorkforceDemographics = () => {
    const workforceData = {
      locality: localUserData?.locality || 65,
      gender: localUserData?.gender || 45,
      eap: localUserData?.eap || 70,
      femaleLeadership: localUserData?.femaleLeadership || 35,
      youthLeadership: localUserData?.youthLeadership || 25,
      bbbeeLevel: localUserData?.bbbeeLevel || 4,
      jobsCreated: localUserData?.jobsCreated || 150,
    }

    return (
      <div>
        <KeyQuestionBox
          question="Does the workforce profile align with transformation and inclusion expectations of external stakeholders? This includes assessing B-BBEE positioning and employment impact."
          signals="B-BBEE positioning, Employment impact"
          decisions="Eligibility for ESD, CSI, procurement, Alignment with funder mandates"
        />
        <div style={cardS}>
          <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "25px", fontSize: "18px", fontWeight: "600", borderBottom: `2px solid ${T.line}`, paddingBottom: "10px" }}>Workforce Demographics</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            <ESGChartCard title="Locality" chartType="doughnut" data={{ labels: ["Local", "Non-Local"], datasets: [{ data: [workforceData.locality, 100 - workforceData.locality], backgroundColor: [T.accent, T.line], borderColor: "#ffffff", borderWidth: 3 }] }} options={getPieChartOptions("Locality")} kpiKey="locality" unit="%" isInvestorView={isInvestorView} currentUser={currentUser} section="social" subSection="workforce-demographics" kpiValue={workforceData.locality} contextData={{ benchmark: 50, timeRange: "Current Period" }} />
            <ESGChartCard title="Gender" chartType="doughnut" data={{ labels: ["Female", "Male"], datasets: [{ data: [workforceData.gender, 100 - workforceData.gender], backgroundColor: ["#8d6e63", T.accent], borderColor: "#ffffff", borderWidth: 3 }] }} options={getPieChartOptions("Gender")} kpiKey="gender" unit="%" isInvestorView={isInvestorView} currentUser={currentUser} section="social" subSection="workforce-demographics" kpiValue={workforceData.gender} contextData={{ benchmark: 35, timeRange: "Current Period" }} />
            <ESGChartCard title="EAP (Disabled)" chartType="doughnut" data={{ labels: ["EAP", "Non-EAP"], datasets: [{ data: [workforceData.eap, 100 - workforceData.eap], backgroundColor: ["#3e2723", "#8d6e63"], borderColor: "#ffffff", borderWidth: 3 }] }} options={getPieChartOptions("EAP")} kpiKey="eap" unit="%" isInvestorView={isInvestorView} currentUser={currentUser} section="social" subSection="workforce-demographics" kpiValue={workforceData.eap} contextData={{ benchmark: 5, timeRange: "Current Period" }} />
            <ESGChartCard title="Female Leadership" chartType="doughnut" data={{ labels: ["Female Leaders", "Other"], datasets: [{ data: [workforceData.femaleLeadership, 100 - workforceData.femaleLeadership], backgroundColor: ["#795548", T.line], borderColor: "#ffffff", borderWidth: 3 }] }} options={getPieChartOptions("Female Leadership")} kpiKey="femaleLeadership" unit="%" isInvestorView={isInvestorView} currentUser={currentUser} section="social" subSection="workforce-demographics" kpiValue={workforceData.femaleLeadership} contextData={{ benchmark: 25, timeRange: "Current Period" }} />
            <ESGChartCard title="Youth Leadership" chartType="doughnut" data={{ labels: ["Youth Leaders", "Other"], datasets: [{ data: [workforceData.youthLeadership, 100 - workforceData.youthLeadership], backgroundColor: ["#6d4c41", T.line], borderColor: "#ffffff", borderWidth: 3 }] }} options={getPieChartOptions("Youth Leadership")} kpiKey="youthLeadership" unit="%" isInvestorView={isInvestorView} currentUser={currentUser} section="social" subSection="workforce-demographics" kpiValue={workforceData.youthLeadership} contextData={{ benchmark: 20, timeRange: "Current Period" }} />
          </div>
        </div>
      </div>
    )
  }

  const renderOwnershipInclusion = () => {
    const ownershipData = {
      hdiOwnership: localUserData?.hdiOwnership || 65,
      shareholderGenderMale: localUserData?.shareholderGenderMale || 60,
      shareholderGenderFemale: localUserData?.shareholderGenderFemale || 35,
      shareholderRaceBlack: localUserData?.shareholderRaceBlack || 40,
      permanentJobs: localUserData?.permanentJobs || 120,
      contractJobs: localUserData?.contractJobs || 80,
      bbbeeLevel: localUserData?.bbbeeLevel || 4,
    }

    return (
      <div>
        <KeyQuestionBox
          question="Does ownership structure support inclusion and transformation objectives? This involves assessing HDI / Black ownership, youth, gender, and disability ownership."
          signals="HDI / Black ownership, Youth, gender, disability ownership"
          decisions="Eligibility for targeted funding or ESD, Transformation gap remediation"
        />
        <div style={cardS}>
          <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "25px", fontSize: "18px", fontWeight: "600", borderBottom: `2px solid ${T.line}`, paddingBottom: "10px" }}>Ownership & Inclusion</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            <ESGChartCard title="HDI Ownership" chartType="doughnut" data={{ labels: ["HDI-Owned", "Non-HDI"], datasets: [{ data: [ownershipData.hdiOwnership, 100 - ownershipData.hdiOwnership], backgroundColor: [T.accent, T.line], borderColor: "#ffffff", borderWidth: 3 }] }} options={getPieChartOptions("HDI Ownership")} kpiKey="hdiOwnership" unit="%" isInvestorView={isInvestorView} currentUser={currentUser} section="social" subSection="ownership-inclusion" kpiValue={ownershipData.hdiOwnership} contextData={{ benchmark: 51, timeRange: "Current Period" }} />
            <ESGChartCard title="Shareholder Gender" chartType="pie" data={{ labels: ["Male", "Female"], datasets: [{ data: [ownershipData.shareholderGenderMale, ownershipData.shareholderGenderFemale], backgroundColor: ["#3e2723", "#8d6e63"], borderColor: "#ffffff", borderWidth: 3 }] }} options={getPieChartOptions("Shareholder Gender")} kpiKey="shareholderGender" unit="%" isInvestorView={isInvestorView} currentUser={currentUser} section="social" subSection="ownership-inclusion" kpiValue={ownershipData.shareholderGenderFemale} contextData={{ benchmark: 50, timeRange: "Current Period" }} />
            <ESGChartCard title="Shareholder Race" chartType="pie" data={{ labels: ["Black", "White", "Colored", "Indian/Asian"], datasets: [{ data: [ownershipData.shareholderRaceBlack, 30, 15, 10], backgroundColor: ["#3e2723", T.accent, "#8d6e63", "#a1887f"], borderColor: "#ffffff", borderWidth: 3 }] }} options={getPieChartOptions("Shareholder Race")} kpiKey="shareholderRace" unit="%" isInvestorView={isInvestorView} currentUser={currentUser} section="social" subSection="ownership-inclusion" kpiValue={ownershipData.shareholderRaceBlack} contextData={{ benchmark: 51, timeRange: "Current Period" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", gridColumn: "span 2" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", alignItems: "center" }}>
                <div>
                  <ESGChartCard title="Total Jobs Created" chartType="bar" data={{ labels: ["Permanent", "Contract"], datasets: [{ label: "Jobs", data: [ownershipData.permanentJobs, ownershipData.contractJobs], backgroundColor: T.accent, borderColor: T.accent, borderWidth: 2 }] }} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: "Number of Jobs" } } }, plugins: { tooltip: { enabled: true }, datalabels: { display: false } } }} kpiKey="totalJobs" unit="jobs" isInvestorView={isInvestorView} currentUser={currentUser} section="social" subSection="ownership-inclusion" kpiValue={ownershipData.permanentJobs + ownershipData.contractJobs} contextData={{ benchmark: 100, timeRange: "Current Period" }} />
                </div>
                <div style={cardS}>
                  <h4 style={{ color: T.accent, marginBottom: "20px", fontSize: "16px", textAlign: "center" }}>B-BBEE Level</h4>
                  <div style={{ width: "120px", height: "120px", borderRadius: "50%", backgroundColor: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "42px", fontWeight: "bold", margin: "0 auto 15px auto", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                    {ownershipData.bbbeeLevel === "non-compliant" ? "NC" : ownershipData.bbbeeLevel}
                  </div>
                  <div style={{ color: T.body, fontSize: "15px", fontWeight: "600", textAlign: "center" }}>{ownershipData.bbbeeLevel === "non-compliant" ? "Non-Compliant" : `Level ${ownershipData.bbbeeLevel}`}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCommunityESD = () => {
    const months = getMonthsForYear(financialYearEnd)
    
    const csiData = {
      csiSpend: parseCurrency(localUserData?.csiSpend) || 0,
      csiPercentage: localUserData?.csiPercentage || 0,
      hasMonthlyCsiData: financialData?.balanceSheetData?.assets?.additionalMetrics?.csiSpent ? true : false,
      monthlyCsiData: financialData?.balanceSheetData?.assets?.additionalMetrics?.csiSpent || [],
      csiProjects: [
        { name: "Youth Skills Development", value: 250000 },
        { name: "Community Health Initiative", value: 150000 },
        { name: "Local Sports Sponsorship", value: 100000 }
      ],
      hdiVendorSpend: localUserData?.hdiSpent || localUserData?.hdiVendorSpend || 0,
      hdiPercentage: localUserData?.hdiPercentage || 0,
      hasMonthlyHdiData: financialData?.balanceSheetData?.assets?.additionalMetrics?.hdiSpent ? true : false,
      monthlyHdiData: financialData?.balanceSheetData?.assets?.additionalMetrics?.hdiSpent || [],
      hdiProjects: [
        { name: "Supplier A (HDI)", value: 400000 },
        { name: "Supplier B (HDI)", value: 250000 },
        { name: "Supplier C (HDI)", value: 100000 }
      ]
    }

    const getProjectPieOptions = () => ({
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { color: T.body, font: { size: 11 } } },
        tooltip: { callbacks: { label: (context) => `R ${context.raw.toLocaleString()}` } },
        datalabels: { color: "#ffffff", font: { weight: "bold", size: 10 }, formatter: (value, context) => { const total = context.dataset.data.reduce((a, b) => a + b, 0); return ((value / total) * 100).toFixed(1) + '%'; } }
      }
    });

    return (
      <div>
        <KeyQuestionBox
          question="Is the business contributing meaningfully to broader social and economic development? This involves evaluating CSI intent and ESD participation maturity."
          signals="CSI intent, ESD participation maturity"
          decisions="Qualify for CSI / ESG-linked funding?, Partnership readiness with corporates, readiness to have own CSI programme, readiness to have own ESD programme"
        />
        <div style={cardS}>
          <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "25px", fontSize: "18px", fontWeight: "600", borderBottom: `2px solid ${T.line}`, paddingBottom: "10px" }}>Community & ESD Participation</h3>
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px", backgroundColor: T.raised, padding: "10px", borderRadius: "6px" }}>
              <button onClick={() => setActiveSpendTab("csi")} style={{ padding: "8px 16px", backgroundColor: activeSpendTab === "csi" ? T.accent : "transparent", color: activeSpendTab === "csi" ? "#fff" : T.body, border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600", fontSize: "14px", transition: "all 0.3s ease" }}>CSI/CSR Spend</button>
              <button onClick={() => setActiveSpendTab("hdi")} style={{ padding: "8px 16px", backgroundColor: activeSpendTab === "hdi" ? T.accent : "transparent", color: activeSpendTab === "hdi" ? "#fff" : T.body, border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600", fontSize: "14px", transition: "all 0.3s ease" }}>HDI Spend</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {activeSpendTab === "csi" && (
              <>
                <ESGChartCard title={csiData.hasMonthlyCsiData ? "CSI/CSR Spend & % of Revenue (Monthly)" : "CSI/CSR Spend & % of Revenue (Annual)"} chartType="bar" data={{ labels: csiData.hasMonthlyCsiData ? months : ["Annual Total"], datasets: [{ label: "CSI Spend (R millions)", type: 'bar', data: csiData.hasMonthlyCsiData ? csiData.monthlyCsiData.map(v => v / 1000000) : [csiData.csiSpend / 1000000], backgroundColor: T.accent, borderColor: T.accent, borderWidth: 2, yAxisID: 'y-axis-amount' }, { label: "CSI % of Revenue", type: 'line', data: csiData.hasMonthlyCsiData ? months.map(() => csiData.csiPercentage) : [csiData.csiPercentage], backgroundColor: T.muted, borderColor: T.muted, borderWidth: 3, pointBackgroundColor: T.muted, pointBorderColor: "#fff", pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7, fill: false, tension: 0.1, yAxisID: 'y-axis-percentage' }] }} options={{ responsive: true, maintainAspectRatio: false, scales: { 'y-axis-amount': { type: 'linear', position: 'left', beginAtZero: true, title: { display: true, text: "Amount (R millions)" }, grid: { drawOnChartArea: false } }, 'y-axis-percentage': { type: 'linear', position: 'right', beginAtZero: true, max: 100, title: { display: true, text: "Percentage (%)" }, grid: { drawOnChartArea: false } } }, plugins: { tooltip: { enabled: true, callbacks: { label: (context) => { if (context.dataset.label === "CSI Spend (R millions)") return `CSI Spend: R ${(context.raw * 1000000).toLocaleString()}`; else return `CSI % of Revenue: ${context.raw.toFixed(2)}%`; } } }, datalabels: { display: false } } }} kpiKey="csiSpend" unit="R" isInvestorView={isInvestorView} currentUser={currentUser} section="social" subSection="community-esd" kpiValue={csiData.csiSpend} contextData={{ benchmark: 1, timeRange: "Current Period" }} />
                <ESGChartCard title="CSI Spend by Project" chartType="pie" data={{ labels: csiData.csiProjects.map(p => p.name), datasets: [{ data: csiData.csiProjects.map(p => p.value), backgroundColor: ["#3e2723", "#8d6e63", "#a1887f"], borderColor: "#ffffff", borderWidth: 3 }] }} options={getProjectPieOptions()} kpiKey="csiProjectBreakdown" unit="R" isInvestorView={isInvestorView} currentUser={currentUser} section="social" subSection="community-esd" kpiValue={csiData.csiSpend} contextData={{ timeRange: "Current Period" }} />
              </>
            )}

            {activeSpendTab === "hdi" && (
              <>
                <ESGChartCard title={csiData.hasMonthlyHdiData ? "HDI Spend & % of Revenue (Monthly)" : "HDI Spend & % of Revenue (Annual)"} chartType="bar" data={{ labels: csiData.hasMonthlyHdiData ? months : ["Annual Total"], datasets: [{ label: "HDI Spend (R millions)", type: 'bar', data: csiData.hasMonthlyHdiData ? csiData.monthlyHdiData.map(v => v / 1000000) : [csiData.hdiVendorSpend / 1000000], backgroundColor: "#8d6e63", borderColor: "#8d6e63", borderWidth: 2, yAxisID: 'y-axis-amount' }, { label: "HDI % of Revenue", type: 'line', data: csiData.hasMonthlyHdiData ? months.map(() => csiData.hdiPercentage) : [csiData.hdiPercentage], backgroundColor: T.muted, borderColor: T.muted, borderWidth: 3, pointBackgroundColor: T.muted, pointBorderColor: "#fff", pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7, fill: false, tension: 0.1, yAxisID: 'y-axis-percentage' }] }} options={{ responsive: true, maintainAspectRatio: false, scales: { 'y-axis-amount': { type: 'linear', position: 'left', beginAtZero: true, title: { display: true, text: "Amount (R millions)" }, grid: { drawOnChartArea: false } }, 'y-axis-percentage': { type: 'linear', position: 'right', beginAtZero: true, max: 100, title: { display: true, text: "Percentage (%)" }, grid: { drawOnChartArea: false } } }, plugins: { tooltip: { enabled: true, callbacks: { label: (context) => { if (context.dataset.label === "HDI Spend (R millions)") return `HDI Spend: R ${(context.raw * 1000000).toLocaleString()}`; else return `HDI % of Revenue: ${context.raw.toFixed(2)}%`; } } }, datalabels: { display: false } } }} kpiKey="hdiVendorSpend" unit="R" isInvestorView={isInvestorView} currentUser={currentUser} section="social" subSection="community-esd" kpiValue={csiData.hdiVendorSpend} contextData={{ benchmark: 30, timeRange: "Current Period" }} />
                <ESGChartCard title="HDI Spend by Project" chartType="pie" data={{ labels: csiData.hdiProjects.map(p => p.name), datasets: [{ data: csiData.hdiProjects.map(p => p.value), backgroundColor: ["#4e342e", "#6d4c41", "#8d6e63"], borderColor: "#ffffff", borderWidth: 3 }] }} options={getProjectPieOptions()} kpiKey="hdiProjectBreakdown" unit="R" isInvestorView={isInvestorView} currentUser={currentUser} section="social" subSection="community-esd" kpiValue={csiData.hdiVendorSpend} contextData={{ timeRange: "Current Period" }} />
              </>
            )}
          </div>

          <div style={{ marginTop: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h4 style={{ color: T.accent, fontSize: "16px" }}>{activeSpendTab === "csi" ? "CSI/CSR Projects" : "HDI Vendor Breakdown"}</h4>
              {!isInvestorView && <button onClick={() => alert("Add project functionality coming soon")} style={btnPrimary}>+ Add Project</button>}
            </div>
            <div style={cardS}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: T.header }}>
                    <th style={{ padding: "12px", textAlign: "left", color: "#fff", fontSize: "14px" }}>Project Name</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "#fff", fontSize: "14px" }}>Focus Area</th>
                    <th style={{ padding: "12px", textAlign: "right", color: "#fff", fontSize: "14px" }}>Budget (R)</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "#fff", fontSize: "14px" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "center", color: "#fff", fontSize: "14px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSpendTab === "csi" ? (
                    <>
                      <tr style={{ borderBottom: `1px solid ${T.line}` }}>
                        <td style={{ padding: "12px", color: T.body, fontSize: "14px" }}>Youth Skills Development</td>
                        <td style={{ padding: "12px", color: T.body, fontSize: "14px" }}>Education</td>
                        <td style={{ padding: "12px", textAlign: "right", color: T.body, fontSize: "14px" }}>250,000</td>
                        <td style={{ padding: "12px", color: T.body, fontSize: "14px" }}>Active</td>
                        <td style={{ padding: "12px", textAlign: "center" }}><button style={{ ...btnGhost, padding: "4px 10px", fontSize: "12px", margin: "0 5px" }}>Edit</button><button style={{ ...btnGhost, padding: "4px 10px", fontSize: "12px", margin: "0 5px", color: T.red, borderColor: T.red + "55" }}>Delete</button></td>
                      </tr>
                      <tr style={{ borderBottom: `1px solid ${T.line}` }}>
                        <td style={{ padding: "12px", color: T.body, fontSize: "14px" }}>Community Health Initiative</td>
                        <td style={{ padding: "12px", color: T.body, fontSize: "14px" }}>Healthcare</td>
                        <td style={{ padding: "12px", textAlign: "right", color: T.body, fontSize: "14px" }}>150,000</td>
                        <td style={{ padding: "12px", color: T.body, fontSize: "14px" }}>Planning</td>
                        <td style={{ padding: "12px", textAlign: "center" }}><button style={{ ...btnGhost, padding: "4px 10px", fontSize: "12px", margin: "0 5px" }}>Edit</button><button style={{ ...btnGhost, padding: "4px 10px", fontSize: "12px", margin: "0 5px", color: T.red, borderColor: T.red + "55" }}>Delete</button></td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr style={{ borderBottom: `1px solid ${T.line}` }}>
                        <td style={{ padding: "12px", color: T.body, fontSize: "14px" }}>Supplier A (HDI)</td>
                        <td style={{ padding: "12px", color: T.body, fontSize: "14px" }}>Logistics</td>
                        <td style={{ padding: "12px", textAlign: "right", color: T.body, fontSize: "14px" }}>400,000</td>
                        <td style={{ padding: "12px", color: T.body, fontSize: "14px" }}>Active</td>
                        <td style={{ padding: "12px", textAlign: "center" }}><button style={{ ...btnGhost, padding: "4px 10px", fontSize: "12px", margin: "0 5px" }}>Edit</button><button style={{ ...btnGhost, padding: "4px 10px", fontSize: "12px", margin: "0 5px", color: T.red, borderColor: T.red + "55" }}>Delete</button></td>
                      </tr>
                      <tr style={{ borderBottom: `1px solid ${T.line}` }}>
                        <td style={{ padding: "12px", color: T.body, fontSize: "14px" }}>Supplier B (HDI)</td>
                        <td style={{ padding: "12px", color: T.body, fontSize: "14px" }}>Manufacturing</td>
                        <td style={{ padding: "12px", textAlign: "right", color: T.body, fontSize: "14px" }}>250,000</td>
                        <td style={{ padding: "12px", color: T.body, fontSize: "14px" }}>Active</td>
                        <td style={{ padding: "12px", textAlign: "center" }}><button style={{ ...btnGhost, padding: "4px 10px", fontSize: "12px", margin: "0 5px" }}>Edit</button><button style={{ ...btnGhost, padding: "4px 10px", fontSize: "12px", margin: "0 5px", color: T.red, borderColor: T.red + "55" }}>Delete</button></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const socialSubTabs = [
    { id: "workforce-demographics", label: "Workforce Demographics" },
    { id: "ownership-inclusion", label: "Ownership & Inclusion" },
    { id: "community-esd", label: "Community & ESD Participation" },
  ]

  return (
    <div>
      <div style={{ display: "flex", gap: "2px", borderBottom: `1px solid ${T.lineStrong}`, marginBottom: "18px", flexWrap: "wrap", alignItems: "center" }}>
        {socialSubTabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id)} style={{ padding: "12px 20px", background: "none", border: "none", cursor: "pointer", fontSize: "14.5px", fontWeight: activeSubTab === tab.id ? 600 : 500, color: activeSubTab === tab.id ? T.accent : T.body, borderBottom: activeSubTab === tab.id ? `2px solid ${T.accent}` : "2px solid transparent", fontFamily: "inherit", marginBottom: "-1px" }}>{tab.label}</button>
        ))}
      </div>
      {activeSubTab === "workforce-demographics" && renderWorkforceDemographics()}
      {activeSubTab === "ownership-inclusion" && renderOwnershipInclusion()}
      {activeSubTab === "community-esd" && renderCommunityESD()}
    </div>
  )
}

// ─── Main ESG Component ──────────────────────────────────────────────────────
const ESG = () => {
  const [activeMainTab, setActiveMainTab] = useState("environmental")
  const [activeSubTab, setActiveSubTab] = useState("workforce-demographics")
  const [currentUser, setCurrentUser] = useState(null)
  const [isInvestorView, setIsInvestorView] = useState(false)
  const [viewingSMEId, setViewingSMEId] = useState(null)
  const [viewingSMEName, setViewingSMEName] = useState("")
  const [viewOrigin, setViewOrigin] = useState("investor")
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [userData, setUserData] = useState({})
  const [fundingAppData, setFundingAppData] = useState(null)
  const [financialData, setFinancialData] = useState(null)
  const [financialYearEnd, setFinancialYearEnd] = useState("2026-03")

  useEffect(() => {
    const investorViewMode = sessionStorage.getItem("investorViewMode")
    const smeId = sessionStorage.getItem("viewingSMEId")
    const smeName = sessionStorage.getItem("viewingSMEName")
    const origin = sessionStorage.getItem("viewOrigin")

    if (investorViewMode === "true" && smeId) {
      setIsInvestorView(true)
      setViewingSMEId(smeId)
      setViewingSMEName(smeName || "SME")
      setViewOrigin(origin || "investor")
    }
    
    const savedFYE = localStorage.getItem("financialYearEnd")
    if (savedFYE) setFinancialYearEnd(savedFYE)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isInvestorView && viewingSMEId) {
        setCurrentUser({ uid: viewingSMEId })
        fetchUserData(viewingSMEId)
        fetchFundingAppData(viewingSMEId)
        fetchFinancialData(viewingSMEId)
      } else {
        setCurrentUser(user)
        if (user) {
          fetchUserData(user.uid)
          fetchFundingAppData(user.uid)
          fetchFinancialData(user.uid)
        }
      }
    })
    return () => unsubscribe()
  }, [isInvestorView, viewingSMEId])

  const fetchUserData = async (userId) => {
    try {
      const esgDoc = await getDoc(doc(db, "esgData", userId))
      if (esgDoc.exists()) setUserData(esgDoc.data())
    } catch (error) { console.error("Error loading ESG data:", error) }
  }

  const fetchFundingAppData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "universalProfiles", userId))
      if (userDoc.exists()) setFundingAppData(userDoc.data().socialImpact || {})
    } catch (error) { console.error("Error loading funding application data:", error) }
  }

  const fetchFinancialData = async (userId) => {
    try {
      const capitalDoc = await getDoc(doc(db, "financialData", `${userId}_capitalStructure`))
      if (capitalDoc.exists()) setFinancialData(capitalDoc.data())
    } catch (error) { console.error("Error loading financial data:", error) }
  }

  const handleSaveData = async (data) => {
    if (!currentUser) return
    try {
      const docRef = doc(db, "esgData", currentUser.uid)
      await setDoc(docRef, { ...userData, ...data, userId: currentUser.uid, updatedAt: new Date().toISOString() })
      setUserData(prev => ({ ...prev, ...data }))
    } catch (error) { console.error("Error saving ESG data:", error) }
  }

  const handleExitInvestorView = () => {
    const origin = sessionStorage.getItem("viewOrigin")
    sessionStorage.removeItem("viewingSMEId")
    sessionStorage.removeItem("viewingSMEName")
    sessionStorage.removeItem("investorViewMode")
    sessionStorage.removeItem("viewOrigin")
    if (origin === "cmf") window.location.href = "/cmf-cohorts"
    else if (origin === "catalyst") window.location.href = "/catalyst/cohorts"
    else window.location.href = "/my-cohorts"
  }

  const getContentStyles = () => ({ width: "100%", marginLeft: "0", minHeight: "100vh", transition: "padding 0.3s ease", boxSizing: "border-box" })

  const mainTabs = [
    { id: "environmental", label: "Environmental" },
    { id: "social", label: "Social" },
    { id: "governance", label: "Governance" },
  ]

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg }}>
      <div style={getContentStyles()}>
        {isInvestorView && (
          <div style={{ backgroundColor: T.panel, padding: "16px 20px", margin: "50px 0 20px 0", borderRadius: "8px", border: `1px solid ${T.line}`, borderLeft: `3px solid ${T.accent}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Eye size={15} color={T.accent} />
              <span style={{ color: T.accent, fontWeight: "600", fontSize: "15px" }}>
                {viewOrigin === "catalyst" ? `Catalyst View: Viewing ${viewingSMEName}'s ESG Impact` : viewOrigin === "cmf" ? `Facilitator View: Viewing ${viewingSMEName}'s ESG Impact` : `Investor View: Viewing ${viewingSMEName}'s ESG Impact`}
              </span>
            </div>
            <button onClick={handleExitInvestorView} style={{ ...btnGhost, display: "flex", alignItems: "center", gap: "8px" }}>
              <ArrowLeft size={13} /> {viewOrigin === "catalyst" ? "Back to Catalyst Cohorts" : "Back to My Cohorts"}
            </button>
          </div>
        )}

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h1 style={{ color: T.accent, fontSize: "32px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>ESG Impact</h1>
            <button onClick={() => setShowFullDescription(!showFullDescription)} style={btnQuiet}>{showFullDescription ? "See less" : "See more about dashboard"}</button>
          </div>

          {showFullDescription && (
            <div style={{ ...cardS, marginBottom: "30px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>What this dashboard DOES</h3>
                  <ul style={{ color: T.body, fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
                    <li>Confirms ESG factors are tracked and governed</li>
                    <li>Signals readiness for disclosure to funders, corporates, DFIs</li>
                    <li>Assesses external trustworthiness and credibility</li>
                    <li>Feeds into BIG Score (Governance, Compliance, Capital Appeal)</li>
                    <li>Monitors ESG framework implementation and oversight</li>
                  </ul>
                </div>
                <div>
                  <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>What this dashboard does NOT do</h3>
                  <ul style={{ color: T.body, fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
                    <li>Measure internal execution performance</li>
                    <li>Provide sustainability reporting or SDG mapping</li>
                    <li>Calculate carbon footprints or create ESG narratives</li>
                    <li>Optimize impact or operational performance</li>
                    <li>Replace audits, certifications, or statutory disclosures</li>
                  </ul>
                </div>
              </div>
              <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: `1px solid ${T.line}` }}>
                <h3 style={{ color: T.accent, marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>Key ESG Impact Dimensions</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                  <div><h4 style={{ color: T.accent, marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>Environmental</h4><p style={{ color: T.body, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>Track exposure, compliance, incidents, and controls to manage environmental risks</p></div>
                  <div><h4 style={{ color: T.accent, marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>Social</h4><p style={{ color: T.body, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>Monitor workforce demographics, ownership inclusion, and community development</p></div>
                  <div><h4 style={{ color: T.accent, marginTop: 0, marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>Governance</h4><p style={{ color: T.body, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>Assess ownership structures, oversight mechanisms, policies, and risk management</p></div>
                </div>
                <p style={{ color: T.body, fontSize: "13px", lineHeight: "1.6", marginTop: "15px" }}>Dashboards show the data. ESG confirms it exists, is governed, and is credible for external stakeholders.</p>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "2px", borderBottom: `1px solid ${T.lineStrong}`, marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
            {mainTabs.map((tab) => (
              <button key={tab.id} onClick={() => { setActiveMainTab(tab.id); if (tab.id === "social") setActiveSubTab("workforce-demographics") }} style={{ padding: "12px 24px", background: "none", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: activeMainTab === tab.id ? 600 : 500, color: activeMainTab === tab.id ? T.accent : T.body, borderBottom: activeMainTab === tab.id ? `2px solid ${T.accent}` : "2px solid transparent", fontFamily: "inherit", marginBottom: "-1px" }}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeMainTab === "environmental" && <EnvironmentalTab userData={userData} onSave={handleSaveData} isInvestorView={isInvestorView} />}
          {activeMainTab === "social" && <SocialTab activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} userData={userData} onSave={handleSaveData} isInvestorView={isInvestorView} fundingAppData={fundingAppData} financialData={financialData} currentUser={currentUser} />}
          {activeMainTab === "governance" && <GovernanceTab userData={userData} onSave={handleSaveData} isInvestorView={isInvestorView} />}
        </div>
      </div>
    </div>
  )
}

export default ESG