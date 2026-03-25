"use client";

import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import {
  BarChart, PieChart, LineChart,
  TrendingUp, DollarSign, Users, Clock,
  Rocket, Target, Award, Activity
} from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from '../../firebaseConfig';
import { usePortfolio } from "../../context/PortfolioContext";

Chart.register(...registerables);

function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}
function useDeepCompareMemo(value) {
  const ref = useRef();
  if (!isEqual(value, ref.current)) ref.current = value;
  return ref.current;
}
const safeExtractArray = (obj, path) => {
  if (!obj) return [];
  let current = obj;
  for (const part of path.split('.')) {
    if (current[part] === undefined || current[part] === null) return [];
    current = current[part];
  }
  if (Array.isArray(current)) return current;
  if (typeof current === 'string') {
    try { const p = JSON.parse(current); if (Array.isArray(p)) return p; } catch {}
    return [current];
  }
  if (typeof current === 'object') return Object.values(current);
  return [current];
};

// ── Skeleton Components ────────────────────────────────────────────────────────

const StatCardSkeleton = () => (
  <div className="flex items-center gap-3 bg-cream rounded-xl p-4 flex-1 min-w-[140px]">
    <div className="w-10 h-10 rounded-lg bg-shimmer-light bg-shimmer animate-shimmer" />
    <div className="flex flex-col gap-2 flex-1">
      <div className="h-6 w-16 rounded bg-shimmer-light bg-shimmer animate-shimmer-d1" />
      <div className="h-3 w-24 rounded bg-shimmer-light bg-shimmer animate-shimmer-d2" />
    </div>
  </div>
);

const ChartSkeleton = ({ delay = "" }) => (
  <div className={`bg-white rounded-2xl border border-lightTan p-5 flex flex-col gap-3 min-h-[280px]`}>
    {/* Chart title */}
    <div className={`h-4 w-48 rounded bg-shimmer-light bg-shimmer ${delay || "animate-shimmer"}`} />
    {/* Fake bar chart bars */}
    <div className="flex items-end gap-2 flex-1 pt-4 pb-2">
      {[65, 40, 80, 55, 70, 45, 90].map((h, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t bg-shimmer-light bg-shimmer ${
            ["animate-shimmer","animate-shimmer-d1","animate-shimmer-d2","animate-shimmer-d3",
             "animate-shimmer-d4","animate-shimmer-d5","animate-shimmer"][i % 7]
          }`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
    {/* X-axis labels */}
    <div className="flex gap-2">
      {[4, 3, 5, 3, 4, 3, 5].map((w, i) => (
        <div key={i} className={`flex-1 h-2 rounded bg-shimmer-light bg-shimmer animate-shimmer-d${(i % 5) + 1}`} />
      ))}
    </div>
  </div>
);

const LeaderboardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-lightTan p-5 flex flex-col gap-4 min-h-[280px]">
    <div className="h-4 w-48 rounded bg-shimmer-light bg-shimmer animate-shimmer" />
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3 py-2 border-b border-lightTan last:border-0">
        <div className={`w-7 h-7 rounded-full bg-shimmer-light bg-shimmer animate-shimmer-d${i}`} />
        <div className={`flex-1 h-3 rounded bg-shimmer-light bg-shimmer animate-shimmer-d${i}`} />
        <div className={`w-20 h-3 rounded bg-shimmer-light bg-shimmer animate-shimmer-d${i + 1}`} />
      </div>
    ))}
  </div>
);

const TabSkeleton = () => (
  <div className="flex gap-2 flex-wrap">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className={`h-9 w-36 rounded-full bg-shimmer-light bg-shimmer animate-shimmer-d${i}`} />
    ))}
  </div>
);

const InsightsSkeleton = () => (
  <div className="min-h-screen bg-backgroundBrown px-5 py-6">
    {/* Header */}
    <div className="mb-6 flex flex-col gap-2">
      <div className="h-8 w-64 rounded-lg bg-shimmer-light bg-shimmer animate-shimmer" />
      <div className="h-4 w-96 rounded bg-shimmer-light bg-shimmer animate-shimmer-d1" />
    </div>

    {/* Stat cards */}
    <div className="flex flex-wrap gap-3 mb-6">
      {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
    </div>

    {/* Tabs */}
    <div className="mb-5"><TabSkeleton /></div>

    {/* Charts grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <ChartSkeleton delay="animate-shimmer" />
      <ChartSkeleton delay="animate-shimmer-d1" />
      <LeaderboardSkeleton />
    </div>
  </div>
);

// ── Cohort Selection Tab — helpers ─────────────────────────────────────────────
// Uses react-chartjs-2 (Bar / Doughnut).
// Ecosystem data  → metrics / enriched   (ALL catalyst applications)
// Portfolio data  → portfolioMetrics      (Active Support + Support Approved only)
// ──────────────────────────────────────────────────────────────────────────────

const BP = {
  darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36",
  warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de",
};
const BCOLORS = ["#3b2409","#5e3f26","#7d5a36","#9c7c54","#b8a082","#c2a882","#d4c4b0","#a08060"];
// Distinct amber-brown for the portfolio (cohort) line overlay on histograms
const PORTFOLIO_LINE_COLOR = "#c17d3c";
const CS_CARD_H  = "460px";
const CS_CHART_H = "260px";

// Plain bar options (for range view — no second dataset, no legend needed)
const csVBarOpts = (yCb) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: {
    legend: { display: false },
    datalabels: { display: false },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: BP.dark, font: { size: 10 } } },
    y: { beginAtZero: true, grid: { color: BP.offwhite }, ticks: { color: BP.dark, callback: yCb || (v => v) } },
  },
});

// Mixed bar + line options (for histograms — ecosystem bars + portfolio line)
const csHistogramOpts = (yCb, xTitle) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
    plugins: { legend: { display: false, position: "bottom", labels: { color: BP.dark, font: { size: 11 }, boxWidth: 12 } }, datalabels: { display: false } },
    scales: {
      x: { title: { display: true, text: xTitle, color: BP.dark }, grid: { display: false }, ticks: { color: BP.dark, font: { size: 10 } } },
      y: { title: { display: true, text: "Number of SMEs", color: BP.dark }, beginAtZero: true, grid: { color: BP.offwhite }, ticks: { color: BP.dark, callback: yCb || (v => v), stepSize: 1, } },
    },
});

const csHBarOpts = (integralOnly) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  indexAxis: "y",
  plugins: { legend: { display: false }, datalabels: { display: false } },
  scales: {
    x: {
      beginAtZero: true,
      grid: { display: true, color: BP.offwhite },
      ticks: {
        color: BP.dark, font: { size: 10 },
        ...(integralOnly ? { callback: v => Number.isInteger(v) ? v : "", precision: 0, stepSize: 1 } : {}),
      },
    },
    y: { grid: { display: false }, ticks: { color: BP.dark, font: { size: 11 } } },
  },
});

const csDoughnutOpts = {
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: {
    legend: { position: "bottom", labels: { color: BP.dark, font: { size: 11 }, boxWidth: 12 } },
    datalabels: { color: BP.offwhite },
  },
};

// ── Shared primitives ──────────────────────────────────────────────────────────

const CsCard = ({ title, footer, children }) => (
  <div style={{
    background: "#fff", borderRadius: "10px", padding: "20px",
    height: CS_CARD_H,
    boxShadow: "0 2px 10px rgba(59,36,9,0.07)", border: `1px solid ${BP.pale}`,
    display: "flex", flexDirection: "column",
  }}>
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${BP.offwhite}`, marginBottom: "8px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: BP.dark, margin: 0 }}>{title}</h3>
    </div>
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
    {footer && (
      <div style={{ marginTop: "8px", padding: "7px 10px", background: BP.offwhite, borderRadius: "6px", flexShrink: 0 }}>
        {footer}
      </div>
    )}
  </div>
);

const CsPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "5px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "11px",
      border: `1.5px solid ${active ? BP.medium : BP.pale}`,
      fontWeight: active ? 700 : 500,
      background: active ? BP.medium : "#fff",
      color: active ? "#fff" : BP.medium,
    }}
  >
    {label}
  </button>
);

const CsEmpty = () => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: BP.light, fontSize: "12px", fontStyle: "italic" }}>
    No data yet
  </div>
);

// ── Score Range View ───────────────────────────────────────────────────────────
// Shows the ecosystem spread: Min → Ecosystem Avg → Max.
// "Cohort Avg" label and big figure have been removed per spec.
// The progress bar markers now read "Ecosystem Avg" (was "Matches Avg").
const CsScoreRangeView = ({ min, pipelineAvg, max, target, ecoSystemAvg, suffix = "%" }) => {
  if (!min && !pipelineAvg && !max) return <CsEmpty />;

  const clamp = v => Math.min(Math.max(v || 0, 0), 100);
  const mn = clamp(min), pa = clamp(pipelineAvg), mx = clamp(max);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
      {/* "Ecosystem Avg" label
      <div style={{ fontSize: "14px", color: BP.darkest, fontWeight: 600, letterSpacing: "0.8px" }}>
        Ecosystem Avg
      </div> */}

      {/* Big ecosystem avg figure */}
      <div style={{ fontSize: "64px", fontWeight: "800", color: BP.darkest, lineHeight: 1, marginTop: "-4px" }}>
        {ecoSystemAvg}<span style={{ fontSize: "32px" }}>{suffix}</span>
      </div>

      {/* Target */}
      <div style={{ fontSize: "14px", color: BP.medium, fontWeight: 600 }}>
        Target: {target}{suffix}
      </div>

      {/* Joint progress bar */}
      <div style={{ width: "100%", marginTop: "4px" }}>

        {/* Track */}
        <div style={{ position: "relative", width: "100%", height: "12px", background: BP.pale, borderRadius: "6px", overflow: "visible" }}>
          {/* Max layer — lightest */}
          <div style={{ position: "absolute", left: 0, top: 0, width: `${mx}%`, height: "100%", background: BP.light, borderRadius: "6px", overflow: "hidden" }} />
          {/* Pipeline avg layer — medium */}
          <div style={{ position: "absolute", left: 0, top: 0, width: `${pa}%`, height: "100%", background: BP.medium, borderRadius: "6px", overflow: "hidden" }} />
          {/* Min layer — darkest */}
          <div style={{ position: "absolute", left: 0, top: 0, width: `${mn}%`, height: "100%", background: BP.dark, borderRadius: "6px", overflow: "hidden" }} />
        </div>

        {/* Value labels */}
        <div style={{ position: "relative", width: "95%", height: "38px", marginTop: "6px" }}>
          {[
            { val: mn, label: "Min",           color: BP.dark   },
            { val: pa, label: "Ecosystem Avg", color: BP.medium },
            { val: mx, label: "Max",           color: BP.light  },
          ].map(({ val, label, color }) => (
            <div
              key={label}
              style={{ position: "absolute", left: `${val}%`, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}
            >
              <div style={{ fontSize: "14px", fontWeight: 700, color }}>{val}{suffix}</div>
            </div>
          ))}
        </div>
        {/* Custom legend */}
        <div style={{ position: "relative", width: "95%", height: "20px", marginTop: "6px" }}>
          {[
            { label: "Cohort Avg", color: BP.darkest },
            { label: "Pipeline Avg", color: BP.medium },
            { label: "Target", color: BP.light },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px", marginRight: "16px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "6px", background: color }} />
              <div style={{ fontSize: "11px", color }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Histogram dataset builder ──────────────────────────────────────────────────
// Returns two datasets:
//   1. Bar  → ecosystem distribution (all matches via `metrics`)
//   2. Line → portfolio distribution (Active Support + Support Approved via `portfolioMetrics`)
const buildHistogramData = (ecosystemDist, portfolioDist) => ({
  labels: Object.keys(ecosystemDist),
  datasets: [
    {
      type: "bar",
      label: "Ecosystem",
      data: Object.values(ecosystemDist),
      backgroundColor: BCOLORS.slice(0, Object.keys(ecosystemDist).length),
      order: 2,
    },
    {
      type: "line",
      label: "Cohorts",
      data: Object.keys(ecosystemDist).map(k => portfolioDist?.[k] || 0),
      borderColor: PORTFOLIO_LINE_COLOR,
      backgroundColor: "transparent",
      tension: 0.4,
      pointBackgroundColor: PORTFOLIO_LINE_COLOR,
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      order: 1,
    },
  ],
});

// ── Average Match Strength ─────────────────────────────────────────────────────
const CsAverageMatchStrength = ({ metrics, portfolioMetrics }) => {
  const [view, setView] = useState("range");

  // Ecosystem (all matches)
  const m             = metrics?.match || {};
  const ecosystemDist = metrics?.match?.dist || {};
  // Portfolio line overlay
  const portfolioDist = portfolioMetrics?.match?.dist || {};

  const hasData = m.min > 0 || m.avg > 0;

  return (
    <CsCard title="Average Match Strength (%)">
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <CsPill label="Range"     active={view === "range"}     onClick={() => setView("range")} />
        <CsPill label="Histogram" active={view === "histogram"} onClick={() => setView("histogram")} />
      </div>
      {hasData ? (
        view === "range"
          ? <CsScoreRangeView min={m.min} pipelineAvg={m.avg} max={m.max} target={75} ecoSystemAvg={m.avg} />
          : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ height: CS_CHART_H }}>
                <Bar
                  options={csHistogramOpts(v => v, "Average Match Strength (%)")}
                  data={buildHistogramData(ecosystemDist, portfolioDist)}
                />
              </div>
            </div>
          )
      ) : <CsEmpty />}
    </CsCard>
  );
};

// ── Average BIG Score ──────────────────────────────────────────────────────────
const CsAverageBIGScore = ({ metrics, portfolioMetrics }) => {
  const [view, setView] = useState("range");

  // Ecosystem (all matches)
  const b             = metrics?.bigScore || {};
  const ecosystemDist = metrics?.bigScore?.dist || {};
  // Portfolio line overlay
  const portfolioDist = portfolioMetrics?.bigScore?.dist || {};

  const hasData = b.min > 0 || b.avg > 0;

  return (
    <CsCard title="Average BIG Score (%)">
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <CsPill label="Range"     active={view === "range"}     onClick={() => setView("range")} />
        <CsPill label="Histogram" active={view === "histogram"} onClick={() => setView("histogram")} />
      </div>
      {hasData ? (
        view === "range"
          ? <CsScoreRangeView min={b.min} pipelineAvg={b.avg} max={b.max} target={70} ecoSystemAvg={b.avg} />
          : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ height: CS_CHART_H }}>
                <Bar
                  options={csHistogramOpts(v => v, "Average BIG Score (%)")}
                  data={buildHistogramData(ecosystemDist, portfolioDist)}
                />
              </div>
            </div>
          )
      ) : <CsEmpty />}
    </CsCard>
  );
};

// ── Funding Readiness Rate ─────────────────────────────────────────────────────
const CsFundingReadinessRate = ({ metrics }) => {
  const rate  = metrics?.fundingReadinessRate ?? 0;
  const total = metrics?.totalSMEs ?? 0;
  const ready = Math.round((rate / 100) * total);

  return (
    <CsCard title="Funding Readiness Rate (%)">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "6px", background: "transparent" }} />
        </div>
        <div style={{ fontSize: "64px", fontWeight: "800", color: BP.darkest, lineHeight: 1 }}>
          {rate}<span style={{ fontSize: "32px" }}>%</span>
        </div>
        <div style={{ fontSize: "14px", color: BP.medium, fontWeight: 600 }}>{ready} of {total} SMEs funding-ready</div>
        <div style={{ width: "100%", background: BP.pale, borderRadius: "4px", height: "10px", overflow: "hidden" }}>
          <div style={{ width: `${rate}%`, background: BP.medium, height: "100%", borderRadius: "4px" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "0 4px" }}>
          <span style={{ fontSize: "11px", color: BP.warm }}>Current: {rate}%</span>
          <span style={{ fontSize: "11px", color: BP.warm }}>Target: 70%</span>
        </div>
      </div>
    </CsCard>
  );
};

// ── Average Vetting Time ───────────────────────────────────────────────────────
const CsAverageVettingTime = ({ metrics }) => {
  const ACTUAL = metrics?.vetting?.avg || 0;
  const TARGET = metrics?.vetting?.target || 10;
  const VARIANCE = ACTUAL - TARGET;
  const R = 54, CIRC = 2 * Math.PI * R;
  const offset = CIRC - (CIRC * Math.min(ACTUAL, 60)) / 60;

  return (
    <CsCard title="Average Vetting Time (Days)">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {ACTUAL > 0 ? (
          <>
            <svg width="260" height="260" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={R} stroke={BP.pale} strokeWidth="11" fill="none" />
              <circle
                cx="80" cy="80" r={R}
                stroke={ACTUAL <= TARGET ? BP.medium : BP.dark}
                strokeWidth="11" fill="none" strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={offset}
                transform="rotate(-90 80 80)"
              />
              <text x="80" y="74" textAnchor="middle" fill={BP.darkest} fontSize="30" fontWeight="800">{Math.round(ACTUAL)}</text>
              <text x="80" y="93" textAnchor="middle" fill={BP.warm} fontSize="13">days</text>
            </svg>
            <div style={{ display: "flex", gap: "24px" }}>
              {[
                ["Actual",   Math.round(ACTUAL) + "d",                                      BP.dark],
                ["Target",   TARGET + "d",                                                    BP.medium],
                ["Variance", (VARIANCE > 0 ? "+" : "") + Math.round(VARIANCE) + "d",         VARIANCE > 0 ? "#8b3a1a" : BP.medium],
              ].map(([l, v, col]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: BP.warm, marginBottom: "3px" }}>{l}</div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: col }}>{v}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ color: BP.light, fontSize: "12px", fontStyle: "italic" }}>Not enough data to compute vetting time yet</div>
        )}
      </div>
    </CsCard>
  );
};

// ── SME Pipeline Progress ──────────────────────────────────────────────────────
const CsSMEPipelineProgress = ({ metrics }) => {
  const [view, setView] = useState("stage");
  const dist = metrics?.stageDist || {};

  const nonZeroEntries = Object.entries(dist).filter(([, v]) => v > 0);
  const sortedEntries = [...nonZeroEntries].sort((a, b) => b[1] - a[1]);
  const hbarLabels = sortedEntries.map(([k]) => k);
  const hbarValues = sortedEntries.map(([, v]) => v);
  const doughnutLabels = nonZeroEntries.map(([k]) => k);
  const doughnutValues = nonZeroEntries.map(([, v]) => v);

  const hasData = nonZeroEntries.length > 0;
  const innerH  = Math.max(parseInt(CS_CHART_H), hbarLabels.length * 36);

  return (
    <CsCard title="SME Pipeline Progress">
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <CsPill label="Stage Dist." active={view === "stage"}  onClick={() => setView("stage")} />
        <CsPill label="Funnel"      active={view === "funnel"} onClick={() => setView("funnel")} />
      </div>
      {hasData ? (
        <>
          <div style={{ flex: 1, overflow: "hidden" }}>
            {view === "stage" ? (
              <div style={{ height: `${innerH}px`, overflowY: hbarLabels.length > 7 ? "auto" : "visible" }}>
                <Bar
                  options={csHBarOpts(true)}
                  data={{ labels: hbarLabels, datasets: [{ label: "# SMEs", data: hbarValues, backgroundColor: BCOLORS.slice(0, hbarLabels.length) }] }}
                />
              </div>
            ) : (
              <div style={{ height: CS_CHART_H }}>
                <Doughnut
                  options={csDoughnutOpts}
                  data={{ labels: doughnutLabels, datasets: [{ data: doughnutValues, backgroundColor: BCOLORS.slice(0, doughnutLabels.length), borderWidth: 2, borderColor: "#fff" }] }}
                />
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "5px", marginTop: "0px", flexWrap: "wrap", flexShrink: 0 }}>
            {doughnutLabels.map((s, i) => (
              <span key={s} style={{ fontSize: "10px", color: BP.dark, background: BP.offwhite, padding: "3px 7px", borderRadius: "10px" }}>
                {s}: <strong>{doughnutValues[i]}</strong>
              </span>
            ))}
          </div>
        </>
      ) : <CsEmpty />}
    </CsCard>
  );
};

// ── Cohort Selection Tab skeleton ──────────────────────────────────────────────
const CsCohortSkeleton = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
    {["bar","bar","progress","gauge","doughnut"].map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-xl p-5 border border-paleBrown flex flex-col"
        style={{ height: CS_CARD_H, boxShadow: "0 2px 10px rgba(59,36,9,0.07)" }}
      >
        <div className="pb-2.5 border-b border-offWhite mb-2.5">
          <div className="w-3/4 h-4 bg-shimmer-dark bg-shimmer animate-shimmer rounded" />
        </div>
        <div className="flex-1 flex items-end justify-around px-4 gap-2">
          {[55, 80, 40, 70, 30].map((h, j) => (
            <div
              key={j}
              className="flex-1 bg-shimmer-mid bg-shimmer rounded-t-md animate-shimmer"
              style={{ height: `${h}%`, animationDelay: `${j * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ── Cohort Selection Tab content ───────────────────────────────────────────────
// Consumes the portfolio context; renders the 5 CohortSelection charts.
const CohortSelectionTabContent = () => {
  const { metrics, portfolioMetrics, loading } = usePortfolio();

  if (loading) return <CsCohortSkeleton />;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
      <CsAverageMatchStrength  metrics={metrics} portfolioMetrics={portfolioMetrics} />
      <CsAverageBIGScore       metrics={metrics} portfolioMetrics={portfolioMetrics} />
      <CsFundingReadinessRate  metrics={metrics} />
      <CsAverageVettingTime    metrics={metrics} />
      <CsSMEPipelineProgress   metrics={metrics} />
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

export function AcceleratorInsights() {
  const [activeTab, setActiveTab] = useState("program-types");
  const [catalystProfilesData, setCatalystProfilesData] = useState([]);
  const [catalystApplicationsData, setCatalystApplicationsData] = useState([]);
  const [smeCatalystApplicationsData, setSmeCatalystApplicationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const charts = useRef([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profSnap, appSnap, smeSnap] = await Promise.all([
          getDocs(query(collection(db, "catalystProfiles"))),
          getDocs(query(collection(db, "catalystApplications"))),
          getDocs(query(collection(db, "smeCatalystApplications"))),
        ]);
        setCatalystProfilesData(profSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setCatalystApplicationsData(appSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setSmeCatalystApplicationsData(smeSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Data processors (unchanged logic) ────────────────────────────────────
  const calculateAverageMatchRate = () => {
    if (!catalystApplicationsData.length) return 0;
    let total = 0, count = 0;
    catalystApplicationsData.forEach(a => {
      if (typeof a.matchPercentage === 'number' && !isNaN(a.matchPercentage)) { total += a.matchPercentage; count++; }
    });
    return count > 0 ? Math.round(total / count) : 0;
  };

  const countActivePrograms = () => catalystProfilesData.length;

  const calculateAverageFunding = () => {
    if (!catalystProfilesData.length) return 0;
    let total = 0, count = 0;
    catalystProfilesData.forEach(p => {
      safeExtractArray(p, "formData.programmeDetails.programs").forEach(prog => {
        const amt = typeof prog?.averageSupportAmount === 'number'
          ? prog.averageSupportAmount
          : parseFloat(String(prog?.averageSupportAmount || '').replace(/[^0-9.]/g, ''));
        if (!isNaN(amt)) { total += amt; count++; }
      });
    });
    return count > 0 ? Math.round(total / count) : 0;
  };

  const processBigScoreComparison = () => {
    let wT = 0, wC = 0, wOT = 0, wOC = 0;
    smeCatalystApplicationsData.forEach(a => {
      const s = a.bigScore || 0;
      if (typeof s === 'number' && !isNaN(s) && s > 0) {
        if ((a.status || '').toLowerCase().includes("support approved")) { wT += s; wC++; }
        else { wOT += s; wOC++; }
      }
    });
    return { "With Catalyst": wC > 0 ? Math.round(wT / wC) : 0, "Without Catalyst": wOC > 0 ? Math.round(wOT / wOC) : 0 };
  };

  const sectorCategoryMap = {
    "Healthcare / Nursing / Medical": "Health & Social Services",
    "NGO / Non-Profit / Community Services": "Health & Social Services",
    "Security / Emergency Services": "Health & Social Services",
    "Consulting / Business Services": "Business",
    "Human Resources / Recruitment": "Business",
    "Advertising / Marketing / PR": "Business",
    "Hospitality / Hotel / Catering": "Business",
    "Tourism / Travel / Leisure": "Business",
    "Accounting / Finance": "Finance",
    "Banking / Insurance / Investments": "Finance",
    "Legal / Law": "Law",
    "ICT / Information Technology": "Technology & Engineering",
    "Engineering (Civil, Mechanical, Electrical)": "Technology & Engineering",
    "Construction / Building / Civils": "Technology & Engineering",
    "Manufacturing / Production": "Technology & Engineering",
    "Trades / Artisans / Technical": "Technology & Engineering",
    "Telecommunications": "Technology & Engineering",
    "Education / Training / Teaching": "Science, Research & Education",
    "Science / Research / Development": "Science, Research & Education",
    "Agriculture / Forestry / Fishing": "Science, Research & Education",
    "Mining / Energy / Oil & Gas": "Science, Research & Education",
    "Generalist": "Other", "Automotive / Motor Industry": "Other",
    "Call Centre / Customer Service": "Other", "Retail / Wholesale / Sales": "Other",
    "Real Estate / Property": "Other", "Arts / Entertainment": "Other",
    "Media / Journalism / Publishing": "Other",
  };

  const categorizeSector = (sec) => {
    for (const [k, v] of Object.entries(sectorCategoryMap)) {
      if (sec.includes(k) || k.includes(sec)) return v;
    }
    const l = sec.toLowerCase();
    if (l.match(/health|care|medical|nursing|ngo|non-profit|community|security|emergency/)) return "Health & Social Services";
    if (l.match(/business|consult|hr|human resource|market|advert|hospitality|hotel|catering|tourism|travel|leisure/)) return "Business";
    if (l.match(/finance|account|bank|insurance|invest/)) return "Finance";
    if (l.match(/law|legal/)) return "Law";
    if (l.match(/tech|ict|information|engineer|construct|building|manufactur|production|trade|artisan|technical|telecom/)) return "Technology & Engineering";
    if (l.match(/science|research|develop|education|teach|train|agriculture|forestry|fishing|mining|energy|oil|gas/)) return "Science, Research & Education";
    return "Other";
  };

  const emptyIndustries = () => ({
    "Health & Social Services": 0, "Business": 0, "Finance": 0, "Law": 0,
    "Technology & Engineering": 0, "Science, Research & Education": 0, "Other": 0,
  });

  const processSmeIndustryMatchDistribution = () => {
    const cats = Object.fromEntries(Object.keys(emptyIndustries()).map(k => [k, { matched: 0, unmatched: 0, total: 0 }]));
    smeCatalystApplicationsData.forEach(a => {
      const isMatched = (a.status || '').toLowerCase().includes("support approved");
      (a.sector || '').split(',').map(s => s.trim()).filter(Boolean).forEach(sec => {
        const cat = categorizeSector(sec);
        cats[cat].total++; isMatched ? cats[cat].matched++ : cats[cat].unmatched++;
      });
    });
    return cats;
  };

  const processSupportTypeBreakdown = () => {
    const types = { grant_based: 0, mentorship: 0, training_education: 0, incubator: 0, accelerator: 0, hybrid: 0 };
    catalystProfilesData.forEach(p => {
      safeExtractArray(p, "formData.generalMatchingPreference.programStructure").forEach(t => {
        if (typeof t !== 'string') return;
        const n = t.toLowerCase();
        if (n.match(/grant|funding/)) types.grant_based++;
        else if (n.match(/mentor|coaching/)) types.mentorship++;
        else if (n.match(/training|education|learning/)) types.training_education++;
        else if (n.match(/incubat/)) types.incubator++;
        else if (n.match(/accelerat/)) types.accelerator++;
        else if (n.match(/hybrid|mixed|multiple/)) types.hybrid++;
      });
    });
    return types;
  };

  const processActiveProgramsByStage = () => {
    const stages = { Startup: 0, Scaling: 0, Growth: 0, Turnaround: 0, Mature: 0 };
    catalystProfilesData.forEach(p => {
      const s = (p.formData?.generalMatchingPreference?.programStage || '').toLowerCase();
      if (s.includes("startup")) stages.Startup++;
      else if (s.includes("scaling")) stages.Scaling++;
      else if (s.includes("growth")) stages.Growth++;
      else if (s.includes("turnaround")) stages.Turnaround++;
      else if (s.includes("mature")) stages.Mature++;
    });
    return stages;
  };

  const processApplicationVolumeOverTime = () => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const counts = Object.fromEntries(months.map(m => [m, 0]));
    catalystApplicationsData.forEach(a => {
      if (a.applicationDate) {
        try { counts[months[new Date(a.applicationDate).getMonth()]]++; } catch {}
      }
    });
    return months.map(m => ({ month: m, applications: counts[m] }));
  };

  const processLongestRunningPrograms = () =>
    catalystProfilesData
      .filter(p => p.submittedAt)
      .map(p => ({
        name: p.formData?.entityOverview?.registeredName || "Unnamed Program",
        submittedDate: new Date(p.submittedAt),
        daysSinceSubmission: Math.floor((Date.now() - new Date(p.submittedAt)) / 86400000),
      }))
      .sort((a, b) => a.submittedDate - b.submittedDate)
      .slice(0, 3);

  const processProgramsBySector = () => {
    const types = { funding_support: 0, market_access: 0, technology: 0, capacity_building: 0, social_impact: 0 };
    catalystProfilesData.forEach(p => {
      safeExtractArray(p, "formData.generalMatchingPreference.supportFocus").forEach(f => {
        if (typeof f !== 'string') return;
        const n = f.toLowerCase();
        if (n.match(/funding|financial|capital/)) types.funding_support++;
        else if (n.match(/market|access|sales|customer/)) types.market_access++;
        else if (n.match(/technology|tech|digital|software|technical/)) types.technology++;
        else if (n.match(/capacity|building|training|skills|development/)) types.capacity_building++;
        else if (n.match(/social|impact|community|esg|sustainability/)) types.social_impact++;
      });
    });
    return types;
  };

  const processTimeToAcceptance = () => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const applied = Object.fromEntries(months.map(m => [m, 0]));
    const accepted = Object.fromEntries(months.map(m => [m, 0]));
    catalystApplicationsData.forEach(a => {
      if (a.applicationDate) {
        try { applied[months[new Date(a.applicationDate).getMonth()]]++; } catch {}
      }
      if ((a.status || '').toLowerCase().includes("approved") && a.updatedAt) {
        try {
          const parts = a.updatedAt.split(' at ')[0].split(' ');
          if (parts.length >= 3) {
            const d = new Date(`${parts[0]} ${parts[1]} ${parts[2]}`);
            if (!isNaN(d)) accepted[months[d.getMonth()]]++;
          }
        } catch {}
      }
    });
    return { applied, accepted };
  };

  const processRejectedVsAcceptedApplicants = () => {
    let accepted = 0, rejected = 0;
    catalystApplicationsData.forEach(a => {
      const s = (a.status || '').toLowerCase();
      if (s.match(/approved|accept/)) accepted++;
      else if (s.match(/declined|reject/)) rejected++;
    });
    return { Accepted: accepted, Rejected: rejected };
  };

  const processAvgFundingSecuredByProgramType = () => {
    const fp = { mentorship: { t: 0, c: 0 }, grant_based: { t: 0, c: 0 }, training_education: { t: 0, c: 0 }, incubator: { t: 0, c: 0 }, accelerator: { t: 0, c: 0 }, hybrid: { t: 0, c: 0 } };
    const defaults = { incubator: 15, accelerator: 25, grant_based: 10, mentorship: 5, training_education: 8, hybrid: 12 };
    catalystProfilesData.forEach(p => {
      const amt = parseFloat(p.formData?.programmeDetails?.averageSupportAmount) || 0;
      if (!amt) return;
      safeExtractArray(p, "formData.generalMatchingPreference.programStructure").forEach(t => {
        if (typeof t !== 'string') return;
        const n = t.toLowerCase();
        const key = n.match(/mentor|coaching/) ? "mentorship" : n.match(/grant|funding/) ? "grant_based" : n.match(/training|education/) ? "training_education" : n.match(/incubat/) ? "incubator" : n.match(/accelerat/) ? "accelerator" : n.match(/hybrid|mixed/) ? "hybrid" : null;
        if (key) { fp[key].t += amt; fp[key].c++; }
      });
    });
    return Object.fromEntries(Object.entries(fp).map(([k, v]) => [k, v.c > 0 ? Math.round((v.t / v.c) / 1000000) : defaults[k]]));
  };

  const processCompletionRateByProgramType = () => {
    const stats = { mentorship: { a: 0, t: 0 }, grant_based: { a: 0, t: 0 }, training_education: { a: 0, t: 0 }, incubator: { a: 0, t: 0 }, accelerator: { a: 0, t: 0 }, hybrid: { a: 0, t: 0 } };
    const defaults = { incubator: 75, accelerator: 65, grant_based: 80, mentorship: 85, training_education: 70, hybrid: 60 };
    catalystApplicationsData.forEach(a => {
      if (!a.viewType) return;
      const n = a.viewType.toLowerCase();
      const key = n.match(/mentor|coaching/) ? "mentorship" : n.match(/grant|funding/) ? "grant_based" : n.match(/training|education/) ? "training_education" : n.match(/incubat/) ? "incubator" : n.match(/accelerat/) ? "accelerator" : n.match(/hybrid|mixed/) ? "hybrid" : null;
      if (!key) return;
      stats[key].t++;
      if ((a.status || '').toLowerCase().includes("approved")) stats[key].a++;
    });
    return Object.entries(stats).map(([type, d]) => ({ type, rate: d.t > 0 ? Math.round((d.a / d.t) * 100) : defaults[type] }));
  };

  const processAvgIntakeByIndustry = () => {
    const cats = emptyIndustries();
    catalystApplicationsData.forEach(a => {
      (a.sector || '').split(',').map(s => s.trim()).filter(Boolean).forEach(sec => { cats[categorizeSector(sec)]++; });
    });
    return cats;
  };

  const processTimeToAcceptanceDays = () => {
    const days = [];
    const mMap = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
    catalystApplicationsData.forEach(a => {
      if (!(a.status || '').toLowerCase().includes("approved") || !a.applicationDate || !a.updatedAt) return;
      try {
        const parts = a.updatedAt.split(' at ')[0].split(' ');
        if (parts.length >= 3 && mMap[parts[1]] !== undefined) {
          const accDate = new Date(parts[2], mMap[parts[1]], parts[0]);
          const d = Math.ceil(Math.abs(accDate - new Date(a.applicationDate)) / 86400000);
          if (!isNaN(d)) days.push(d);
        }
      } catch {}
    });
    return days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 15;
  };

  const insightsData = {
    matchRate: calculateAverageMatchRate(),
    averageFundingAmount: calculateAverageFunding(),
    activeFundersCount: countActivePrograms(),
    averageProcessingTime: processTimeToAcceptanceDays(),
    supportTypeBreakdown: processSupportTypeBreakdown(),
    activeProgramsByStage: processActiveProgramsByStage(),
    longestRunningPrograms: processLongestRunningPrograms(),
    programsBySector: processProgramsBySector(),
    smeIndustryMatchDistribution: processSmeIndustryMatchDistribution(),
    avgIntakeByIndustry: processAvgIntakeByIndustry(),
    bigScoreComparison: processBigScoreComparison(),
    avgFundingSecuredByProgramType: processAvgFundingSecuredByProgramType(),
    completionRateByProgramType: processCompletionRateByProgramType(),
    applicationVolumeOverTime: processApplicationVolumeOverTime(),
    timeToAcceptanceData: processTimeToAcceptance(),
    rejectedVsAcceptedApplicants: processRejectedVsAcceptedApplicants(),
  };

  const memoizedInsights = useDeepCompareMemo(insightsData);

  // ── Chart refs ────────────────────────────────────────────────────────────
  const chartRefs = {
    supportTypeBreakdown:        useRef(null),
    activeProgramsByStage:       useRef(null),
    programsBySector:            useRef(null),
    smeIndustryMatchDistribution:useRef(null),
    avgIntakeByIndustry:         useRef(null),
    bigScoreComparison:          useRef(null),
    avgFundingSecuredByProgramType: useRef(null),
    completionRateByProgramType: useRef(null),
    applicationVolumeOverTime:   useRef(null),
    timeToAcceptanceByMonth:     useRef(null),
    rejectedVsAcceptedApplicants:useRef(null),
  };

  useEffect(() => {
    if (loading) return;
    charts.current.forEach(c => c.destroy());
    charts.current = [];

    const bp = {
      primary: "#6d4c41", secondary: "#8d6e63", tertiary: "#a1887f",
      light: "#bcaaa4", lighter: "#d7ccc8", lightest: "#efebe9",
      accent1: "#5d4037", accent2: "#4e342e", accent3: "#3e2723",
    };
    const fmtLabel = (l) => l.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const createChart = (ref, config) => {
      if (!ref.current) return;
      const ctx = ref.current.getContext("2d");
      if (ctx) charts.current.push(new Chart(ctx, config));
    };
    const yScale = (title) => ({
      beginAtZero: true, max: 50,
      title: { display: true, text: title, color: bp.primary },
      ticks: { color: bp.primary, font: { size: 10 }, stepSize: 10 },
      grid: { color: bp.lighter },
    });
    const xBase = { ticks: { color: bp.primary, font: { size: 10 } }, grid: { color: bp.lighter } };

    if (activeTab === "program-types") {
      createChart(chartRefs.supportTypeBreakdown, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.supportTypeBreakdown).map(fmtLabel), datasets: [{ label: "Programs", data: Object.values(memoizedInsights.supportTypeBreakdown), backgroundColor: bp.primary, borderColor: bp.accent1, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Support Type Breakdown", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { ...xBase, title: { display: true, text: "Support Type", color: bp.primary }, ticks: { ...xBase.ticks, maxRotation: 45 } }, y: yScale("Number of Programs") } },
      });
      createChart(chartRefs.activeProgramsByStage, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.activeProgramsByStage), datasets: [{ label: "Programs", data: Object.values(memoizedInsights.activeProgramsByStage), backgroundColor: bp.secondary, borderColor: bp.primary, borderWidth: 1 }] },
        options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Active Programs by Preferred Stage", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: yScale("Number of Programs"), y: { ...xBase, title: { display: true, text: "Business Stage", color: bp.primary } } } },
      });
    }

    if (activeTab === "sector-focus") {
      createChart(chartRefs.programsBySector, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.programsBySector).map(fmtLabel), datasets: [{ label: "Programs", data: Object.values(memoizedInsights.programsBySector), backgroundColor: bp.accent1, borderColor: bp.primary, borderWidth: 1 }] },
        options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Support Focus Distribution", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: yScale("Number of Programs"), y: { ...xBase, title: { display: true, text: "Support Focus", color: bp.primary } } } },
      });
      createChart(chartRefs.smeIndustryMatchDistribution, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.smeIndustryMatchDistribution), datasets: [{ label: "Matched", data: Object.values(memoizedInsights.smeIndustryMatchDistribution).map(d => d.matched), backgroundColor: bp.primary }, { label: "Unmatched", data: Object.values(memoizedInsights.smeIndustryMatchDistribution).map(d => d.unmatched), backgroundColor: bp.lighter }] },
        options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "SME Industry Match Distribution", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { position: "top", labels: { color: bp.primary, font: { size: 10 } } } }, scales: { x: { stacked: true, beginAtZero: true, max: 100, title: { display: true, text: "Match Count", color: bp.primary }, ticks: { color: bp.primary, font: { size: 10 }, stepSize: 20 }, grid: { color: bp.lighter } }, y: { stacked: true, ...xBase, title: { display: true, text: "Industry", color: bp.primary } } } },
      });
      createChart(chartRefs.avgIntakeByIndustry, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.avgIntakeByIndustry), datasets: [{ label: "Avg. No. of SMEs", data: Object.values(memoizedInsights.avgIntakeByIndustry), backgroundColor: bp.tertiary, borderColor: bp.primary, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Avg. Intake by Industry Categories", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { ...xBase, title: { display: true, text: "Industry Categories", color: bp.primary }, ticks: { ...xBase.ticks, maxRotation: 45 } }, y: yScale("Avg. No. of SMEs") } },
      });
    }

    if (activeTab === "outcomes-effectiveness") {
      createChart(chartRefs.bigScoreComparison, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.bigScoreComparison), datasets: [{ label: "Average BIG Score", data: Object.values(memoizedInsights.bigScoreComparison), backgroundColor: [bp.lighter, bp.primary], borderColor: bp.accent1, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "BIG Score: With vs Without Catalyst", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { ...xBase, title: { display: true, text: "Catalyst Support", color: bp.primary } }, y: { beginAtZero: true, max: 100, title: { display: true, text: "Average BIG Score", color: bp.primary }, ticks: { color: bp.primary, font: { size: 10 }, stepSize: 20 }, grid: { color: bp.lighter } } } },
      });
      createChart(chartRefs.avgFundingSecuredByProgramType, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.avgFundingSecuredByProgramType).map(fmtLabel), datasets: [{ label: "Avg Funding (ZAR)", data: Object.values(memoizedInsights.avgFundingSecuredByProgramType), backgroundColor: bp.light, borderColor: bp.primary, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Avg. Funding Secured By Program Type", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { ...xBase, title: { display: true, text: "Program", color: bp.primary }, ticks: { ...xBase.ticks, maxRotation: 45 } }, y: { beginAtZero: true, max: 50, title: { display: true, text: "Avg Funding (Millions ZAR)", color: bp.primary }, ticks: { color: bp.primary, font: { size: 10 }, callback: v => v + 'M', stepSize: 10 }, grid: { color: bp.lighter } } } },
      });
      createChart(chartRefs.completionRateByProgramType, {
        type: "bar",
        data: { labels: memoizedInsights.completionRateByProgramType.map(d => fmtLabel(d.type)), datasets: [{ label: "Approval Rate (%)", data: memoizedInsights.completionRateByProgramType.map(d => d.rate), backgroundColor: bp.primary, borderColor: bp.accent1, borderWidth: 1 }] },
        options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Approval Rate by Program Type", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { beginAtZero: true, max: 100, title: { display: true, text: "Approval Rate (%)", color: bp.primary }, ticks: { color: bp.primary, font: { size: 10 }, callback: v => v + '%', stepSize: 20 }, grid: { color: bp.lighter } }, y: { ...xBase, title: { display: true, text: "Program Type", color: bp.primary } } } },
      });
    }

    if (activeTab === "engagement-patterns") {
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      createChart(chartRefs.applicationVolumeOverTime, {
        type: "line",
        data: { labels: memoizedInsights.applicationVolumeOverTime.map(d => d.month), datasets: [{ label: "Applications", data: memoizedInsights.applicationVolumeOverTime.map(d => d.applications), borderColor: bp.primary, backgroundColor: bp.lighter, tension: 0.4, fill: true, pointBackgroundColor: bp.primary, pointRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Application Volume Over Time", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { ...xBase, title: { display: true, text: "Month", color: bp.primary } }, y: yScale("Applications") } },
      });
      createChart(chartRefs.rejectedVsAcceptedApplicants, {
        type: "doughnut",
        data: { labels: Object.keys(memoizedInsights.rejectedVsAcceptedApplicants), datasets: [{ data: Object.values(memoizedInsights.rejectedVsAcceptedApplicants), backgroundColor: [bp.primary, bp.lighter], borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Rejected vs Accepted Applicants", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { position: "bottom", labels: { color: bp.primary, boxWidth: 8, padding: 8, font: { size: 9 } } } } },
      });
      createChart(chartRefs.timeToAcceptanceByMonth, {
        type: "line",
        data: { labels: months, datasets: [{ label: "Applications Submitted", data: months.map(m => memoizedInsights.timeToAcceptanceData.applied[m] || 0), borderColor: bp.primary, backgroundColor: 'transparent', tension: 0.4, pointBackgroundColor: bp.primary, pointRadius: 4 }, { label: "Applications Accepted", data: months.map(m => memoizedInsights.timeToAcceptanceData.accepted[m] || 0), borderColor: bp.secondary, backgroundColor: 'transparent', tension: 0.4, pointBackgroundColor: bp.secondary, pointRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Applications vs Acceptances by Month", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { position: "top", labels: { color: bp.primary, font: { size: 10 } } } }, scales: { x: { ...xBase, title: { display: true, text: "Month", color: bp.primary } }, y: yScale("Number of Applications") } },
      });
    }

    return () => { charts.current.forEach(c => c.destroy()); };
  }, [activeTab, memoizedInsights, loading]);

  // ── Tab config ─────────────────────────────────────────────────────────────
  const tabs = [
    { id: "cohort-selection",        label: "Cohort Selection",         icon: Users    }, // ← first tab
    { id: "program-types",           label: "Catalyst Types & Reach",   icon: Rocket   },
    { id: "sector-focus",            label: "Sector Focus",             icon: Target   },
    { id: "outcomes-effectiveness",  label: "Outcomes & Effectiveness", icon: Award    },
    { id: "engagement-patterns",     label: "Engagement Patterns",      icon: Activity },
  ];

  const statCards = [
    { icon: TrendingUp, value: `${memoizedInsights.matchRate}%`,                                label: "Match Rate" },
    { icon: DollarSign, value: `R${(memoizedInsights.averageFundingAmount / 1000).toFixed(0)}K`, label: "Avg. Funding" },
    { icon: Users,      value: `${memoizedInsights.activeFundersCount}`,                         label: "Active Catalysts" },
    { icon: Clock,      value: `${memoizedInsights.averageProcessingTime}d`,                     label: "Processing Time" },
  ];

  if (loading) return <InsightsSkeleton />;

  return (
    <div className="min-h-screen bg-backgroundBrown px-5 py-6 box-border">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-mediumBrown mt-0 mb-1">My BIG Insights</h1>
        <p className="text-lg text-lightBrown m-0 font-normal">
          Comprehensive analytics and insights across all your Catalyst programs
        </p>
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3 mb-6">
        {statCards.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center gap-3 bg-cream rounded-xl p-4 flex-1 min-w-[140px] shadow-sm border border-lightTan">
            <div className="w-10 h-10 rounded-lg bg-mediumBrown/10 flex items-center justify-center text-mediumBrown flex-shrink-0">
              <Icon size={18} />
            </div>
            <div>
              <div className="text-2xl font-bold text-darkBrown leading-tight">{value}</div>
              <div className="text-xs text-lightBrown mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer
              ${activeTab === id
                ? "bg-mediumBrown text-white border-mediumBrown shadow-md"
                : "bg-white text-textBrown border-lightTan hover:border-mediumBrown hover:text-mediumBrown"
              }`}
          >
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Charts grid */}
      <div className={activeTab === "cohort-selection" ? "" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"}>

        {/* ── Cohort Selection tab ── */}
        {activeTab === "cohort-selection" && <CohortSelectionTabContent />}

        {activeTab === "program-types" && (<>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.supportTypeBreakdown} />
          </div>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.activeProgramsByStage} />
          </div>
          <div className="bg-white rounded-2xl border border-lightTan p-5 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-mediumBrown mb-4 m-0">Top 3 Longest Running Catalysts</h3>
            <div className="flex flex-col gap-0 flex-1">
              {memoizedInsights.longestRunningPrograms.map((prog, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-lightTan last:border-0">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${i === 0 ? "bg-accentGold" : i === 1 ? "bg-lightBrown" : "bg-lightTan text-textBrown"}`}>
                    #{i + 1}
                  </span>
                  <span className="flex-1 text-sm text-textBrown font-medium truncate">{prog.name}</span>
                  <span className="text-xs text-lightBrown whitespace-nowrap">{prog.daysSinceSubmission}d ago</span>
                </div>
              ))}
              {memoizedInsights.longestRunningPrograms.length === 0 && (
                <p className="text-sm text-lightBrown italic">No programs found</p>
              )}
            </div>
          </div>
        </>)}

        {activeTab === "sector-focus" && (<>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.programsBySector} />
          </div>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.smeIndustryMatchDistribution} />
          </div>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.avgIntakeByIndustry} />
          </div>
        </>)}

        {activeTab === "outcomes-effectiveness" && (<>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.bigScoreComparison} />
          </div>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.avgFundingSecuredByProgramType} />
          </div>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.completionRateByProgramType} />
          </div>
        </>)}

        {activeTab === "engagement-patterns" && (<>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.applicationVolumeOverTime} />
          </div>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.rejectedVsAcceptedApplicants} />
          </div>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.timeToAcceptanceByMonth} />
          </div>
        </>)}

      </div>
    </div>
  );
}