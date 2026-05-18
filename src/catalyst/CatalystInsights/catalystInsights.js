"use client";

import { useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { TrendingUp, DollarSign, Users, Clock, Rocket, Target, Award, Activity } from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import { usePortfolio } from "../../context/PortfolioContext";
import TopBottom from "../MyInvestment/TopBottom";
import "../../styles/insights-grid.css";

Chart.register(...registerables);

// ── Local helpers ─────────────────────────────────────────────────────────────
const parseAmt = (s) => { if (!s) return 0; const n = parseFloat(s.toString().replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : n; };

function isEqual(obj1, obj2) { return JSON.stringify(obj1) === JSON.stringify(obj2); }
function useDeepCompareMemo(value) {
  const ref = useRef();
  if (!isEqual(value, ref.current)) ref.current = value;
  return ref.current;
}

// ── Skeleton Components ───────────────────────────────────────────────────────
const StatCardSkeleton = () => (
  <div className="flex items-center gap-3 bg-cream rounded-xl p-4 flex-1 min-w-[140px]">
    <div className="w-10 h-10 rounded-lg bg-shimmer-light bg-shimmer animate-shimmer" />
    <div className="flex flex-col gap-2 flex-1">
      <div className="h-6 w-16 rounded bg-shimmer-light bg-shimmer animate-shimmer-d1" />
      <div className="h-3 w-24 rounded bg-shimmer-light bg-shimmer animate-shimmer-d2" />
    </div>
  </div>
);

const CanvasCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-lightTan p-5 shadow-sm flex flex-col gap-4" style={{ height: 280 }}>
    <div className="h-4 w-48 rounded bg-shimmer-light bg-shimmer animate-shimmer" />
    <div className="flex-1 rounded-xl bg-shimmer-light bg-shimmer animate-shimmer-d1" />
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

// ── Cohort Selection chart theme ──────────────────────────────────────────────
const BP = {
  darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36",
  warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de",
};
const BCOLORS = ["#3b2409","#5e3f26","#7d5a36","#9c7c54","#b8a082","#c2a882","#d4c4b0","#a08060"];
const PORTFOLIO_LINE_COLOR = "#c17d3c";
const CS_CARD_H  = "460px";
const CS_CHART_H = "260px";

const csHistogramOpts = (yCb, xTitle) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { display: false, position: "bottom", labels: { color: BP.dark, font: { size: 11 }, boxWidth: 12 } }, datalabels: { display: false } },
  scales: {
    x: { title: { display: true, text: xTitle, color: BP.dark }, grid: { display: false }, ticks: { color: BP.dark, font: { size: 10 } } },
    y: { title: { display: true, text: "Number of SMEs", color: BP.dark }, beginAtZero: true, grid: { color: BP.offwhite }, ticks: { color: BP.dark, callback: yCb || (v => v), stepSize: 1 } },
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
      ticks: { color: BP.dark, font: { size: 10 }, ...(integralOnly ? { callback: v => Number.isInteger(v) ? v : "", precision: 0, stepSize: 1 } : {}) },
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

const csMonthlyComboOpts = (max) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: { color: BP.dark, font: { size: 11 }, boxWidth: 12 },
    },
    datalabels: { display: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: BP.dark, font: { size: 10 } },
      title: { display: true, text: "Month", color: BP.dark },
    },
    y: {
      beginAtZero: true,
      max,
      grid: { color: BP.offwhite },
      ticks: { color: BP.dark, callback: (v) => Number.isInteger(v) ? v : "" },
      title: { display: true, text: "Number of Applications", color: BP.dark },
    },
  },
});

// ── Shared primitives ─────────────────────────────────────────────────────────
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
  <button onClick={onClick} style={{
    padding: "5px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "11px",
    border: `1.5px solid ${active ? BP.medium : BP.pale}`,
    fontWeight: active ? 700 : 500,
    background: active ? BP.medium : "#fff",
    color: active ? "#fff" : BP.medium,
  }}>
    {label}
  </button>
);

const CsEmpty = () => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: BP.light, fontSize: "12px", fontStyle: "italic" }}>
    No data yet
  </div>
);

// ── Score Range View ──────────────────────────────────────────────────────────
const CsScoreRangeView = ({ min, pipelineAvg, max, target, ecoSystemAvg, suffix = "%" }) => {
  if (!min && !pipelineAvg && !max) return <CsEmpty />;
  const clamp = v => Math.min(Math.max(v || 0, 0), 100);
  const mn = clamp(min), pa = clamp(pipelineAvg), mx = clamp(max);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
      <div style={{ fontSize: "64px", fontWeight: "800", color: BP.darkest, lineHeight: 1, marginTop: "-4px" }}>
        {ecoSystemAvg}<span style={{ fontSize: "32px" }}>{suffix}</span>
      </div>
      <div style={{ fontSize: "14px", color: BP.medium, fontWeight: 600 }}>Target: {target}{suffix}</div>
      <div style={{ width: "100%", marginTop: "4px" }}>
        <div style={{ position: "relative", width: "100%", height: "12px", background: BP.pale, borderRadius: "6px", overflow: "visible" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: `${mx}%`, height: "100%", background: BP.light, borderRadius: "6px", overflow: "hidden" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: `${pa}%`, height: "100%", background: BP.medium, borderRadius: "6px", overflow: "hidden" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: `${mn}%`, height: "100%", background: BP.dark, borderRadius: "6px", overflow: "hidden" }} />
        </div>
        <div style={{ position: "relative", width: "95%", height: "38px", marginTop: "6px" }}>
          {[
            { val: mn, label: "Min",           color: BP.dark   },
            { val: pa, label: "Ecosystem Avg", color: BP.medium },
            { val: mx, label: "Max",           color: BP.light  },
          ].map(({ val, label, color }) => (
            <div key={label} style={{ position: "absolute", left: `${val}%`, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color }}>{val}{suffix}</div>
            </div>
          ))}
        </div>
        <div style={{ position: "relative", width: "95%", height: "20px", marginTop: "6px" }}>
          {[
            { label: "Min", color: BP.darkest },
            { label: "Ecosystem Avg",  color: BP.medium  },
            { label: "Max",        color: BP.light   },
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

// ── Histogram dataset builder ─────────────────────────────────────────────────
// Bar = universal ecosystem distribution; Line = user's portfolio cohort overlay
const buildHistogramData = (ecosystemDist, portfolioDist) => ({
  labels: Object.keys(ecosystemDist),
  datasets: [
    {
      type: "bar", label: "Ecosystem",
      data: Object.values(ecosystemDist),
      backgroundColor: BCOLORS.slice(0, Object.keys(ecosystemDist).length),
      order: 2,
    },
    {
      type: "line", label: "My Cohort",
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

// ── Cohort Selection chart components ─────────────────────────────────────────
const CsAverageMatchStrength = ({ metrics, portfolioMetrics }) => {
  const [view, setView] = useState("range");
  const m             = metrics?.match || {};
  const ecosystemDist = metrics?.match?.dist || {};
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
          : <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <Bar options={csHistogramOpts(v => v, "Average Match Strength (%)")} data={buildHistogramData(ecosystemDist, portfolioDist)} />
              </div>
            </div>
      ) : <CsEmpty />}
    </CsCard>
  );
};

const CsAverageBIGScore = ({ metrics, portfolioMetrics }) => {
  const [view, setView] = useState("range");
  const b             = metrics?.bigScore || {};
  const ecosystemDist = metrics?.bigScore?.dist || {};
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
          : <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <Bar options={csHistogramOpts(v => v, "Average BIG Score (%)")} data={buildHistogramData(ecosystemDist, portfolioDist)} />
              </div>
            </div>
      ) : <CsEmpty />}
    </CsCard>
  );
};

const CsFundingReadinessRate = ({ metrics }) => {
  const rate  = metrics?.fundingReadinessRate ?? 0;
  const total = metrics?.totalSMEs ?? 0;
  const ready = Math.round((rate / 100) * total);
  return (
    <CsCard title="Funding Readiness Rate (%)">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "-8px" }}>
        <div style={{ fontSize: "64px", fontWeight: "800", color: BP.darkest, lineHeight: 1 }}>
          {rate}<span style={{ fontSize: "32px" }}>%</span>
        </div>
        <div style={{ fontSize: "14px", color: BP.medium, fontWeight: 600 }}>{ready} of {total} SMEs funding-ready</div>
        <div style={{ width: "100%", marginTop: "4px" }}>
          <div style={{ width: "100%", background: BP.pale, borderRadius: "6px", height: "12px", overflow: "hidden" }}>
            <div style={{ width: `${rate}%`, background: BP.medium, height: "100%", borderRadius: "6px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "4px" }}>
            <span style={{ fontSize: "14px", color: BP.warm }}>Current: {rate}%</span>
            <span style={{ fontSize: "14px", color: BP.warm }}>Target: 70%</span>
          </div>
        </div>
      </div>
    </CsCard>
  );
};

const CsAverageVettingTime = ({ metrics }) => {
  const ACTUAL   = metrics?.vetting?.avg || 0;
  const TARGET   = metrics?.vetting?.target || 10;
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
              <circle cx="80" cy="80" r={R} stroke={ACTUAL <= TARGET ? BP.medium : BP.dark} strokeWidth="11" fill="none" strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={offset} transform="rotate(-90 80 80)" />
              <text x="80" y="74" textAnchor="middle" fill={BP.darkest} fontSize="30" fontWeight="800">{Math.round(ACTUAL)}</text>
              <text x="80" y="93" textAnchor="middle" fill={BP.warm} fontSize="13">days</text>
            </svg>
            <div style={{ display: "flex", gap: "24px" }}>
              {[
                ["Actual",   Math.round(ACTUAL) + "d",                                    BP.dark],
                ["Target",   TARGET + "d",                                                  BP.medium],
                ["Variance", (VARIANCE > 0 ? "+" : "") + Math.round(VARIANCE) + "d",       VARIANCE > 0 ? "#8b3a1a" : BP.medium],
              ].map(([l, v, col]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "14px", color: BP.warm, marginBottom: "3px" }}>{l}</div>
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

const CsSMEPipelineProgress = ({ metrics }) => {
  const [view, setView] = useState("stage");
  const dist = metrics?.stageDist || {};
  const nonZeroEntries = Object.entries(dist).filter(([, v]) => v > 0);
  const sortedEntries  = [...nonZeroEntries].sort((a, b) => b[1] - a[1]);
  const hbarLabels     = sortedEntries.map(([k]) => k);
  const hbarValues     = sortedEntries.map(([, v]) => v);
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
                <Bar options={csHBarOpts(true)} data={{ labels: hbarLabels, datasets: [{ label: "# SMEs", data: hbarValues, backgroundColor: BCOLORS.slice(0, hbarLabels.length) }] }} />
              </div>
            ) : (
              <div style={{ flex: 1, minHeight: 0 }}>
                <Doughnut options={csDoughnutOpts} data={{ labels: doughnutLabels, datasets: [{ data: doughnutValues, backgroundColor: BCOLORS.slice(0, doughnutLabels.length), borderWidth: 2, borderColor: "#fff" }] }} />
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

// ── Cohort Selection tab skeleton ─────────────────────────────────────────────
const CsCohortSkeleton = () => {
  const cardShell = (children) => (
    <div className="bg-white rounded-xl p-5 border border-paleBrown flex flex-col" style={{ height: CS_CARD_H, boxShadow: "0 2px 10px rgba(59,36,9,0.07)" }}>
      <div className="pb-2.5 border-b border-offWhite mb-4">
        <div className="w-3/4 h-4 bg-shimmer-dark bg-shimmer animate-shimmer rounded" />
      </div>
      {children}
    </div>
  );
  const ScoreRangeBody = () => (
    <div className="flex-1 flex flex-col gap-3 px-1 pt-1">
      <div className="flex gap-2">
        <div className="h-7 w-20 rounded-full bg-shimmer-mid bg-shimmer animate-shimmer" />
        <div className="h-7 w-24 rounded-full bg-shimmer-light bg-shimmer animate-shimmer-d1" />
      </div>
      <div className="flex flex-col items-center justify-center flex-1 gap-3">
        <div className="h-16 w-28 rounded-lg bg-shimmer-dark bg-shimmer animate-shimmer-d1" />
        <div className="h-4 w-24 rounded bg-shimmer-light bg-shimmer animate-shimmer-d2" />
        <div className="w-full h-3 rounded-full bg-shimmer-light bg-shimmer animate-shimmer-d3 mt-2" />
        <div className="flex justify-between w-full">
          <div className="h-3 w-10 rounded bg-shimmer-mid bg-shimmer animate-shimmer-d2" />
          <div className="h-3 w-20 rounded bg-shimmer-mid bg-shimmer animate-shimmer-d3" />
          <div className="h-3 w-10 rounded bg-shimmer-light bg-shimmer animate-shimmer-d4" />
        </div>
      </div>
    </div>
  );
  const KpiBarBody = () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-1">
      <div className="h-20 w-32 rounded-lg bg-shimmer-dark bg-shimmer animate-shimmer" />
      <div className="h-4 w-48 rounded bg-shimmer-light bg-shimmer animate-shimmer-d1" />
      <div className="w-full h-3 rounded-full bg-shimmer-light bg-shimmer animate-shimmer-d2" />
      <div className="flex justify-between w-full">
        <div className="h-3 w-20 rounded bg-shimmer-mid bg-shimmer animate-shimmer-d3" />
        <div className="h-3 w-20 rounded bg-shimmer-mid bg-shimmer animate-shimmer-d4" />
      </div>
    </div>
  );
  const GaugeBody = () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <div className="relative w-36 h-36">
        <div className="absolute inset-0 rounded-full border-[10px] border-shimmer-mid bg-shimmer animate-shimmer" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-10 bg-shimmer-dark bg-shimmer animate-shimmer-d1 rounded" />
        </div>
      </div>
      <div className="flex gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="w-12 h-3 bg-shimmer-light bg-shimmer animate-shimmer rounded mx-auto mb-1" />
            <div className="w-16 h-5 bg-shimmer-mid bg-shimmer animate-shimmer-d1 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
  const HBarBody = () => (
    <div className="flex-1 flex flex-col gap-3 px-1 pt-1">
      <div className="flex gap-2">
        <div className="h-7 w-24 rounded-full bg-shimmer-mid bg-shimmer animate-shimmer" />
        <div className="h-7 w-16 rounded-full bg-shimmer-light bg-shimmer animate-shimmer-d1" />
      </div>
      {[80, 55, 40, 30, 20].map((w, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`h-3 w-24 rounded bg-shimmer-light bg-shimmer animate-shimmer-d${(i % 5) + 1} flex-shrink-0`} />
          <div className={`h-6 rounded bg-shimmer-mid bg-shimmer animate-shimmer-d${(i % 5) + 1}`} style={{ width: `${w}%` }} />
        </div>
      ))}
      <div className="flex gap-2 flex-wrap mt-auto">
        {[60, 80, 50, 65].map((w, i) => (
          <div key={i} className={`h-5 rounded-full bg-shimmer-light bg-shimmer animate-shimmer-d${i + 1}`} style={{ width: `${w}px` }} />
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
      {cardShell(<ScoreRangeBody />)}
      {cardShell(<ScoreRangeBody />)}
      {cardShell(<KpiBarBody />)}
      {cardShell(<GaugeBody />)}
      {cardShell(<HBarBody />)}
    </div>
  );
};

// ── Cohort Selection tab ──────────────────────────────────────────────────────
// universalMetrics → ecosystem bars (all applications across every catalyst)
// portfolioMetrics → amber line overlay (current user's Active Support + Approved)
const CohortSelectionTabContent = () => {
  const { universalMetrics, portfolioMetrics, loading } = usePortfolio();
  if (loading) return <CsCohortSkeleton />;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
      <CsAverageMatchStrength metrics={universalMetrics} portfolioMetrics={portfolioMetrics} />
      <CsAverageBIGScore      metrics={universalMetrics} portfolioMetrics={portfolioMetrics} />
      <CsFundingReadinessRate metrics={universalMetrics} />
      <CsAverageVettingTime   metrics={universalMetrics} />
      <CsSMEPipelineProgress  metrics={universalMetrics} />
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export function AcceleratorInsights() {
  const [activeTab, setActiveTab] = useState("cohort-selection");

  // All data sourced from the universal batch — same view for every logged-in user
  const { universalEnriched, universalMetrics, loading } = usePortfolio();
  const apps = universalEnriched || [];

  // ── Sector category helpers ───────────────────────────────────────────────
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

  // ── viewType → program type key ───────────────────────────────────────────
  const viewTypeKey = (vt) => {
    const n = (vt || "").toLowerCase();
    if (n.includes("accelerat"))    return "accelerator";
    if (n.includes("incubat"))      return "incubator";
    if (n.includes("mentor"))       return "mentorship";
    if (n.includes("grant"))        return "grant_based";
    if (n.includes("training"))     return "training_education";
    return "hybrid";
  };

  // ── isApproved helper ─────────────────────────────────────────────────────
  const isApproved = (a) => {
    const s = (a.pipelineStage || a.status || "").toLowerCase();
    return s.includes("support approved") || s.includes("active support") || s.includes("deal closed");
  };

  // ── Data processors — all sourced from universalEnriched / universalMetrics ─

  const processSupportTypeBreakdown = () => {
    const types = { grant_based: 0, mentorship: 0, training_education: 0, incubator: 0, accelerator: 0, hybrid: 0 };
    apps.forEach(a => { types[viewTypeKey(a.viewType)]++; });
    return types;
  };

  // Uses universalMetrics.lifecycle which is already keyed by operationStage
  const processActiveProgramsByStage = () => universalMetrics?.lifecycle || {};

  // Top 3 SMEs by oldest applicationDate — represents longest-running engagements
  const processLongestActiveSMEs = () =>
    [...apps]
      .filter(a => a.applicationDate)
      .sort((a, b) => new Date(a.applicationDate) - new Date(b.applicationDate))
      .slice(0, 3)
      .map(a => ({
        name: a.smeName || "Unknown SME",
        submittedDate: new Date(a.applicationDate),
        daysSinceSubmission: Math.floor((Date.now() - new Date(a.applicationDate)) / 86400000),
      }));

  // Groups by supportRequired field — maps to the same snake_case keys fmtLabel expects
  const processProgramsBySector = () => {
    const types = { funding_support: 0, market_access: 0, technology: 0, capacity_building: 0, social_impact: 0 };
    apps.forEach(a => {
      const s = (a.supportRequired || "").toLowerCase();
      if (s.match(/funding|financial|capital/))       types.funding_support++;
      else if (s.match(/market|access|sales/))        types.market_access++;
      else if (s.match(/tech|digital/))               types.technology++;
      else if (s.match(/capacity|building|training/)) types.capacity_building++;
      else if (s.match(/social|impact|community/))    types.social_impact++;
    });
    return types;
  };

  const processSmeIndustryMatchDistribution = () => {
    const cats = Object.fromEntries(Object.keys(emptyIndustries()).map(k => [k, { matched: 0, unmatched: 0, total: 0 }]));
    apps.forEach(a => {
      const matched = isApproved(a);
      (a.sector || "").split(",").map(s => s.trim()).filter(Boolean).forEach(sec => {
        const cat = categorizeSector(sec);
        cats[cat].total++;
        matched ? cats[cat].matched++ : cats[cat].unmatched++;
      });
    });
    return cats;
  };

  const processAvgIntakeByIndustry = () => {
    const cats = emptyIndustries();
    apps.forEach(a => {
      (a.sector || "").split(",").map(s => s.trim()).filter(Boolean).forEach(sec => { cats[categorizeSector(sec)]++; });
    });
    return cats;
  };

  // "With Catalyst Support" = Support Approved / Active Support
  // "In Pipeline" = all other stages
  const processBigScoreComparison = () => {
    let withT = 0, withC = 0, pipeT = 0, pipeC = 0;
    apps.forEach(a => {
      const s = a.bigScore || 0;
      if (!s) return;
      if (isApproved(a)) { withT += s; withC++; }
      else               { pipeT += s; pipeC++; }
    });
    return {
      "With Catalyst Support": withC > 0 ? Math.round(withT / withC) : 0,
      "In Pipeline":           pipeC > 0 ? Math.round(pipeT / pipeC) : 0,
    };
  };

  const processAvgFundingSecuredByProgramType = () => {
    const fp = { mentorship: { t: 0, c: 0 }, grant_based: { t: 0, c: 0 }, training_education: { t: 0, c: 0 }, incubator: { t: 0, c: 0 }, accelerator: { t: 0, c: 0 }, hybrid: { t: 0, c: 0 } };
    const defaults = { incubator: 15, accelerator: 25, grant_based: 10, mentorship: 5, training_education: 8, hybrid: 12 };
    apps.forEach(a => {
      const amt = parseAmt(a.fundingRequired || a.profile?.useOfFunds?.amountRequested);
      if (!amt) return;
      const key = viewTypeKey(a.viewType);
      fp[key].t += amt; fp[key].c++;
    });
    return Object.fromEntries(Object.entries(fp).map(([k, v]) => [k, v.c > 0 ? Math.round((v.t / v.c) / 1000000) : defaults[k]]));
  };

  const processCompletionRateByProgramType = () => {
    const stats = { mentorship: { a: 0, t: 0 }, grant_based: { a: 0, t: 0 }, training_education: { a: 0, t: 0 }, incubator: { a: 0, t: 0 }, accelerator: { a: 0, t: 0 }, hybrid: { a: 0, t: 0 } };
    const defaults = { incubator: 75, accelerator: 65, grant_based: 80, mentorship: 85, training_education: 70, hybrid: 60 };
    apps.forEach(a => {
      const key = viewTypeKey(a.viewType);
      stats[key].t++;
      if (isApproved(a)) stats[key].a++;
    });
    return Object.entries(stats).map(([type, d]) => ({ type, rate: d.t > 0 ? Math.round((d.a / d.t) * 100) : defaults[type] }));
  };

  const processApplicationVolumeOverTime = () => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const counts = Object.fromEntries(months.map(m => [m, 0]));
    apps.forEach(a => {
      if (a.applicationDate) {
        try { counts[months[new Date(a.applicationDate).getMonth()]]++; } catch {}
      }
    });
    return months.map(m => ({ month: m, applications: counts[m] }));
  };

  const processTimeToAcceptance = () => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const applied  = Object.fromEntries(months.map(m => [m, 0]));
    const accepted = Object.fromEntries(months.map(m => [m, 0]));
    apps.forEach(a => {
      if (a.applicationDate) {
        try { applied[months[new Date(a.applicationDate).getMonth()]]++; } catch {}
      }
      if (isApproved(a) && a.updatedAt) {
        try {
          const d = a.updatedAt?.seconds ? new Date(a.updatedAt.seconds * 1000) : new Date(a.updatedAt);
          if (!isNaN(d)) accepted[months[d.getMonth()]]++;
        } catch {}
      }
    });
    return { applied, accepted };
  };

  const processRejectedVsAcceptedApplicants = () => {
    let accepted = 0, rejected = 0;
    apps.forEach(a => {
      const s = (a.pipelineStage || a.status || "").toLowerCase();
      if (s.match(/approved|active support|closed/)) accepted++;
      else if (s.match(/declined|rejected|withdrawn/)) rejected++;
    });
    return { Accepted: accepted, Rejected: rejected };
  };

  const processTimeToAcceptanceDays = () => {
    const days = [];
    apps.forEach(a => {
      if (!isApproved(a) || !a.applicationDate || !a.updatedAt) return;
      try {
        const end = a.updatedAt?.seconds ? new Date(a.updatedAt.seconds * 1000) : new Date(a.updatedAt);
        const d = Math.ceil(Math.abs(end - new Date(a.applicationDate)) / 86400000);
        if (!isNaN(d) && d > 0) days.push(d);
      } catch {}
    });
    return days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0;
  };

  // ── Stat card values ──────────────────────────────────────────────────────
  const insightsData = {
    matchRate:                    universalMetrics?.match?.avg           ?? 0,
    averageFundingAmount:         universalMetrics?.funding?.avg         ?? 0,
    activeFundersCount:           new Set(apps.map(a => a.catalystId).filter(Boolean)).size,
    totalSMEs:                    universalMetrics?.totalSMEs            ?? apps.length,
    averageProcessingTime:        universalMetrics?.vetting?.avg         ?? 0,
    supportTypeBreakdown:         processSupportTypeBreakdown(),
    activeProgramsByStage:        processActiveProgramsByStage(),
    longestRunningPrograms:       processLongestActiveSMEs(),
    programsBySector:             processProgramsBySector(),
    smeIndustryMatchDistribution: processSmeIndustryMatchDistribution(),
    avgIntakeByIndustry:          processAvgIntakeByIndustry(),
    bigScoreComparison:           processBigScoreComparison(),
    avgFundingSecuredByProgramType: processAvgFundingSecuredByProgramType(),
    completionRateByProgramType:  processCompletionRateByProgramType(),
    applicationVolumeOverTime:    processApplicationVolumeOverTime(),
    timeToAcceptanceData:         processTimeToAcceptance(),
    rejectedVsAcceptedApplicants: processRejectedVsAcceptedApplicants(),
  };

  const memoizedInsights = useDeepCompareMemo(insightsData);

  // ── Chart refs ────────────────────────────────────────────────────────────
  const ceilMax = (vals) => Math.ceil(Math.max(0, ...(vals || []).map(v => Number(v) || 0)));
  const fmtLabel = (l) => l.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const csHBarOptsWithMax = (xTitle, max, stacked = false, tickCb) => ({
    ...csHBarOpts(true),
    scales: {
      x: {
        ...csHBarOpts(true).scales.x,
        max,
        stacked,
        title: { display: true, text: xTitle, color: BP.dark },
        ticks: { ...csHBarOpts(true).scales.x.ticks, callback: tickCb || (v => Number.isInteger(v) ? v : "") },
      },
      y: { ...csHBarOpts(true).scales.y, stacked },
    },
  });

  

  // ── Tab config ────────────────────────────────────────────────────────────
  const tabs = [
    { id: "cohort-selection",       label: "Ecosystem Selection",      icon: Users    },
    { id: "program-types",          label: "Catalyst Types & Reach",   icon: Rocket   },
    { id: "sector-focus",           label: "Sector Focus",             icon: Target   },
    { id: "outcomes-effectiveness", label: "Outcomes & Effectiveness", icon: Award    },
    { id: "engagement-patterns",    label: "Engagement Patterns",      icon: Activity },
    { id: "top-bottom",             label: "Top & Bottom",             icon: Award    },
  ];

  const statCards = [
    { icon: TrendingUp, value: `${memoizedInsights.matchRate}%`,                                 label: "Ecosystem Match Rate"  },
    { icon: DollarSign, value: `R${memoizedInsights.averageFundingAmount >= 1000000 ? (memoizedInsights.averageFundingAmount / 1000000).toFixed(2) + 'M' : (memoizedInsights.averageFundingAmount / 1000).toFixed(0) + 'K'}`, label: "Avg. Funding Required" },
    { icon: Users,      value: `${memoizedInsights.activeFundersCount}/${memoizedInsights.totalSMEs}`, label: "Catalysts to SMEs Ratio" },
    { icon: Clock,      value: `${memoizedInsights.averageProcessingTime}d`,                      label: "Avg. Vetting Time"     },
  ];

  return (
    <div className="min-h-screen bg-backgroundBrown px-5 py-6 box-border">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-mediumBrown mt-0 mb-1">My BIG Insights</h1>
        <p className="text-lg text-lightBrown m-0 font-normal">
          Comprehensive analytics and insights across all your Catalyst programs
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {loading
          ? [1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)
          : statCards.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3 bg-cream rounded-xl p-4 flex-1 min-w-[140px] shadow-sm border border-lightTan">
                <div className="w-10 h-10 rounded-lg bg-mediumBrown/10 flex items-center justify-center text-mediumBrown flex-shrink-0">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-darkBrown leading-tight">{value}</div>
                  <div className="text-xs text-lightBrown mt-0.5">{label}</div>
                </div>
              </div>
            ))
        }
      </div>

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

      <div className={activeTab === "cohort-selection" || activeTab === "top-bottom" ? "" : "insights-grid"}>

        {activeTab === "cohort-selection" && <CohortSelectionTabContent />}

        {activeTab === "program-types" && (loading ? (
          <><CanvasCardSkeleton /><CanvasCardSkeleton /><LeaderboardSkeleton /></>
        ) : (
          <>
            <CsCard title="Support Type Breakdown">
              <div style={{ flex: 1, minHeight: 0 }}>
                <Bar data={{ labels: Object.keys(memoizedInsights.supportTypeBreakdown).map(fmtLabel), datasets: [{ label: "Programs", data: Object.values(memoizedInsights.supportTypeBreakdown), backgroundColor: BCOLORS.slice(0, Object.keys(memoizedInsights.supportTypeBreakdown).length) }] }} options={csHBarOptsWithMax("Number of SMEs", ceilMax(Object.values(memoizedInsights.supportTypeBreakdown)))} />
              </div>
            </CsCard>
            <CsCard title="SMEs by Operation Stage">
              <div style={{ flex: 1, minHeight: 0 }}>
                <Bar data={{ labels: Object.keys(memoizedInsights.activeProgramsByStage), datasets: [{ label: "SMEs", data: Object.values(memoizedInsights.activeProgramsByStage), backgroundColor: BCOLORS.slice(0, Object.keys(memoizedInsights.activeProgramsByStage).length) }] }} options={csHBarOptsWithMax("Number of SMEs", ceilMax(Object.values(memoizedInsights.activeProgramsByStage)))} />
              </div>
            </CsCard>
            <CsCard title="Top 3 Longest Active SMEs">
              <div className="flex flex-col gap-0 flex-1">
                {memoizedInsights.longestRunningPrograms.map((prog, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-lightTan last:border-0">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${i === 0 ? "bg-accentGold" : i === 1 ? "bg-lightBrown" : "bg-lightTan text-textBrown"}`}>#{i + 1}</span>
                    <span className="flex-1 text-sm text-textBrown font-medium truncate">{prog.name}</span>
                    <span className="text-xs text-lightBrown whitespace-nowrap">{prog.daysSinceSubmission}d ago</span>
                  </div>
                ))}
              </div>
            </CsCard>
          </>
        ))}

        {activeTab === "sector-focus" && (loading ? (
          <><CanvasCardSkeleton /><CanvasCardSkeleton /><CanvasCardSkeleton /></>
        ) : (
          <>
            <CsCard title="Support Focus Distribution"><div style={{ flex: 1, minHeight: 0 }}><Bar data={{ labels: Object.keys(memoizedInsights.programsBySector).map(fmtLabel), datasets: [{ label: "SMEs", data: Object.values(memoizedInsights.programsBySector), backgroundColor: BCOLORS.slice(0, Object.keys(memoizedInsights.programsBySector).length) }] }} options={csHBarOptsWithMax("Number of SMEs", ceilMax(Object.values(memoizedInsights.programsBySector)))} /></div></CsCard>
            <CsCard title="SME Industry Match Distribution"><div style={{ flex: 1, minHeight: 0 }}><Bar data={{ labels: Object.keys(memoizedInsights.smeIndustryMatchDistribution), datasets: [{ label: "Approved", data: Object.values(memoizedInsights.smeIndustryMatchDistribution).map(d => d.matched), backgroundColor: BP.dark }, { label: "In Pipeline", data: Object.values(memoizedInsights.smeIndustryMatchDistribution).map(d => d.unmatched), backgroundColor: BP.pale }] }} options={csHBarOptsWithMax("SME Count", ceilMax(Object.values(memoizedInsights.smeIndustryMatchDistribution).map(d => (d.matched || 0) + (d.unmatched || 0))), true)} /></div></CsCard>
            <CsCard title="SME Intake by Industry"><div style={{ flex: 1, minHeight: 0 }}><Bar data={{ labels: Object.keys(memoizedInsights.avgIntakeByIndustry), datasets: [{ label: "SMEs", data: Object.values(memoizedInsights.avgIntakeByIndustry), backgroundColor: BCOLORS.slice(0, Object.keys(memoizedInsights.avgIntakeByIndustry).length) }] }} options={csHBarOptsWithMax("Number of SMEs", ceilMax(Object.values(memoizedInsights.avgIntakeByIndustry)))} /></div></CsCard>
          </>
        ))}

        {activeTab === "outcomes-effectiveness" && (loading ? (
          <><CanvasCardSkeleton /><CanvasCardSkeleton /><CanvasCardSkeleton /></>
        ) : (
          <>
            <CsCard title="BIG Score: Approved vs In Pipeline"><div style={{ flex: 1, minHeight: 0 }}><Bar data={{ labels: Object.keys(memoizedInsights.bigScoreComparison), datasets: [{ label: "Average BIG Score", data: Object.values(memoizedInsights.bigScoreComparison), backgroundColor: [BP.pale, BP.dark] }] }} options={csHBarOptsWithMax("Average BIG Score", ceilMax(Object.values(memoizedInsights.bigScoreComparison)))} /></div></CsCard>
            <CsCard title="Avg. Funding Required by Program Type"><div style={{ flex: 1, minHeight: 0 }}><Bar data={{ labels: Object.keys(memoizedInsights.avgFundingSecuredByProgramType).map(fmtLabel), datasets: [{ label: "Avg Funding (ZAR)", data: Object.values(memoizedInsights.avgFundingSecuredByProgramType), backgroundColor: BCOLORS.slice(0, Object.keys(memoizedInsights.avgFundingSecuredByProgramType).length) }] }} options={csHBarOptsWithMax("Avg Funding (Millions ZAR)", ceilMax(Object.values(memoizedInsights.avgFundingSecuredByProgramType)), false, (v) => Number.isInteger(v) ? `${v}M` : "")} /></div></CsCard>
            <CsCard title="Approval Rate by Program Type"><div style={{ flex: 1, minHeight: 0 }}><Bar data={{ labels: memoizedInsights.completionRateByProgramType.map(d => fmtLabel(d.type)), datasets: [{ label: "Approval Rate (%)", data: memoizedInsights.completionRateByProgramType.map(d => d.rate), backgroundColor: BCOLORS.slice(0, memoizedInsights.completionRateByProgramType.length) }] }} options={csHBarOptsWithMax("Approval Rate (%)", ceilMax(memoizedInsights.completionRateByProgramType.map(d => d.rate)), false, (v) => Number.isInteger(v) ? `${v}%` : "")} /></div></CsCard>
          </>
        ))}

        {activeTab === "engagement-patterns" && (loading ? (
          <><CanvasCardSkeleton /><CanvasCardSkeleton /><CanvasCardSkeleton /></>
        ) : (
          <>
            <CsCard title="Rejected vs Accepted Applicants"><div style={{ flex: 1, minHeight: 0 }}><Doughnut options={csDoughnutOpts} data={{ labels: Object.keys(memoizedInsights.rejectedVsAcceptedApplicants), datasets: [{ data: Object.values(memoizedInsights.rejectedVsAcceptedApplicants), backgroundColor: [BP.dark, BP.pale], borderWidth: 2, borderColor: "#fff" }] }} /></div></CsCard>
            <CsCard title="Applications vs Acceptances by Month"><div style={{ flex: 1, minHeight: 0 }}><Bar data={{ labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], datasets: [{ type: "bar", label: "Applications Submitted", data: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => memoizedInsights.timeToAcceptanceData.applied[m] || 0), backgroundColor: BP.warm, borderRadius: 4 }, { type: "line", label: "Applications Approved", data: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => memoizedInsights.timeToAcceptanceData.accepted[m] || 0), borderColor: PORTFOLIO_LINE_COLOR, backgroundColor: "transparent", tension: 0.35, pointBackgroundColor: PORTFOLIO_LINE_COLOR, pointBorderColor: "#fff", pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6 }] }} options={csMonthlyComboOpts(ceilMax([..."Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ").map(m => memoizedInsights.timeToAcceptanceData.applied[m] || 0), ..."Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ").map(m => memoizedInsights.timeToAcceptanceData.accepted[m] || 0)]))} /></div></CsCard>
          </>
        ))}

        {activeTab === "top-bottom" && <TopBottom metrics={universalMetrics} />}

      </div>
    </div>
  );
}
