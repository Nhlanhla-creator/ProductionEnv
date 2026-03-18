import React, { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882", "#d4c4b0", "#a08060"];

// ── Layout constants — shared with all dashboard pages ────────────────────────
const CARD_HEIGHT  = "460px";
const CHART_HEIGHT = "260px";

// ── Chart options ─────────────────────────────────────────────────────────────

// Vertical bar (used for Min/Avg/Max style charts — always small datasets)
const vBarOpts = (yCb) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 11 }, boxWidth: 12 } }, datalabels: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: B.dark, font: { size: 10 } } },
    y: { beginAtZero: true, grid: { color: B.offwhite }, ticks: { color: B.dark, callback: yCb || (v => v) } },
  },
});

// Horizontal bar (used when a categorical distribution has >5 entries)
const hBarOpts = (integralOnly) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  indexAxis: "y",
  plugins: { legend: { display: false }, datalabels: { display: false } },
  scales: {
    x: {
      beginAtZero: true,
      grid: { display: true, color: B.offwhite },
      ticks: {
        color: B.dark, font: { size: 10 },
        ...(integralOnly ? { callback: v => Number.isInteger(v) ? v : "", precision: 0, stepSize: 1 } : {}),
      },
    },
    y: { grid: { display: false }, ticks: { color: B.dark, font: { size: 11 } } },
  },
});

const doughnutOpts = {
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 11 }, boxWidth: 12 } }, datalabels: { color: B.offwhite } },
};

// ── Skeleton Loaders ──────────────────────────────────────────────────────────
const ChartSkeleton = () => (
  <div className="flex-1 min-h-[200px] flex items-center justify-center">
    <div className="w-full h-full relative">
      <div className="absolute inset-0 flex items-end justify-around px-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-8 bg-shimmer-mid bg-shimmer rounded-t-md animate-shimmer"
            style={{ height: `${[55, 80, 40, 70, 30][i - 1]}%`, animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-paleBrown" />
    </div>
  </div>
);

const DoughnutSkeleton = () => (
  <div className="flex-1 min-h-[200px] flex items-center justify-center">
    <div className="relative w-32 h-32">
      <div className="absolute inset-0 rounded-full border-8 border-shimmer-mid bg-shimmer animate-shimmer" />
      <div className="absolute inset-2 rounded-full border-4 border-shimmer-light bg-shimmer animate-shimmer-d1" style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }} />
      <div className="absolute inset-2 rounded-full border-4 border-shimmer-dark bg-shimmer animate-shimmer-d2" style={{ clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)" }} />
      <div className="absolute inset-[30%] rounded-full bg-white" />
    </div>
  </div>
);

const GaugeSkeleton = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4">
    <div className="relative w-32 h-32">
      <div className="absolute inset-0 rounded-full border-8 border-shimmer-mid bg-shimmer animate-shimmer" />
      <div className="absolute inset-0 rounded-full border-8 border-shimmer-dark bg-shimmer animate-shimmer-d1"
        style={{ clipPath: "polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 50% 100%, 50% 50%)", transform: "rotate(-45deg)" }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-8 bg-shimmer-mid bg-shimmer animate-shimmer-d2 rounded" />
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

const ProgressBarSkeleton = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4">
    <div className="w-32 h-32 bg-shimmer-light bg-shimmer animate-shimmer rounded-full" />
    <div className="w-24 h-6 bg-shimmer-mid bg-shimmer animate-shimmer-d1 rounded" />
    <div className="w-full h-3 bg-shimmer-light bg-shimmer animate-shimmer-d2 rounded-full" />
    <div className="flex justify-between w-full">
      <div className="w-16 h-3 bg-shimmer-mid bg-shimmer animate-shimmer-d3 rounded" />
      <div className="w-16 h-3 bg-shimmer-dark bg-shimmer animate-shimmer-d4 rounded" />
    </div>
  </div>
);

const CardSkeleton = ({ type = "bar" }) => {
  const body = { bar: <ChartSkeleton />, doughnut: <DoughnutSkeleton />, gauge: <GaugeSkeleton />, progress: <ProgressBarSkeleton /> }[type] || <ChartSkeleton />;
  return (
    <div
      className="bg-white rounded-xl p-5 shadow-[0_2px_10px_rgba(59,36,9,0.07)] border border-paleBrown flex flex-col"
      style={{ height: CARD_HEIGHT }}
    >
      <div className="pb-2.5 border-b border-offWhite mb-2.5">
        <div className="w-3/4 h-4 bg-shimmer-dark bg-shimmer animate-shimmer rounded" />
      </div>
      <div className="w-2/3 h-3 bg-shimmer-mid bg-shimmer animate-shimmer-d1 rounded mb-3 ml-1" />
      {body}
    </div>
  );
};

// ── Shared primitives ─────────────────────────────────────────────────────────
const Card = ({ title, footer, children }) => (
  <div style={{
    background: "#fff", borderRadius: "10px", padding: "20px",
    height: CARD_HEIGHT,
    boxShadow: "0 2px 10px rgba(59,36,9,0.07)", border: `1px solid ${B.pale}`,
    display: "flex", flexDirection: "column",
  }}>
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "8px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.dark, margin: 0 }}>{title}</h3>
    </div>
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
    {footer && (
      <div style={{ marginTop: "8px", padding: "7px 10px", background: B.offwhite, borderRadius: "6px", flexShrink: 0 }}>
        {footer}
      </div>
    )}
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "5px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "11px", border: `1.5px solid ${active ? B.medium : B.pale}`, fontWeight: active ? 700 : 500, background: active ? B.medium : "#fff", color: active ? "#fff" : B.medium }}>
    {label}
  </button>
);

const EmptyState = () => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.light, fontSize: "12px", fontStyle: "italic" }}>
    No data yet
  </div>
);

// ── Shared Range View ─────────────────────────────────────────────────────────
// Joint bar shows the full-pipeline range: Min → pipelineAvg → Max.
// The big "Cohort Avg" figure above is separately sourced from portfolio SMEs only.
// A distinct cohort marker (filled circle) is also pinned on the bar so you can
// see exactly where the cohort sits relative to the full-pipeline spread.
const ScoreRangeView = ({ min, pipelineAvg, max, cohortAvg, target, suffix = "%" }) => {
  if (!min && !pipelineAvg && !max && !cohortAvg) return <EmptyState />;

  const clamp = v => Math.min(Math.max(v || 0, 0), 100);
  const mn = clamp(min), pa = clamp(pipelineAvg), mx = clamp(max);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>

      {/* "Cohort Avg" label */}
      <div style={{ fontSize: "14px", color: B.darkest, fontWeight: 600, letterSpacing: "0.8px" }}>
        Cohorts Avg
      </div>

      {/* Big cohort avg figure */}
      <div style={{ fontSize: "64px", fontWeight: "800", color: B.darkest, lineHeight: 1, marginTop: "-4px" }}>
        {cohortAvg}<span style={{ fontSize: "32px" }}>{suffix}</span>
      </div>

      {/* Target */}
      <div style={{ fontSize: "14px", color: B.medium, fontWeight: 600 }}>
        Target: {target}{suffix}
      </div>

      {/* Joint progress bar */}
      <div style={{ width: "100%", marginTop: "4px" }}>

        {/* Track */}
        <div style={{ position: "relative", width: "100%", height: "12px", background: B.pale, borderRadius: "6px", overflow: "visible" }}>
          {/* Max layer — lightest */}
          <div style={{ position: "absolute", left: 0, top: 0, width: `${mx}%`, height: "100%", background: B.light, borderRadius: "6px", overflow: "hidden" }} />
          {/* Pipeline avg layer — medium */}
          <div style={{ position: "absolute", left: 0, top: 0, width: `${pa}%`, height: "100%", background: B.medium, borderRadius: "6px", overflow: "hidden" }} />
          {/* Min layer — darkest */}
          <div style={{ position: "absolute", left: 0, top: 0, width: `${mn}%`, height: "100%", background: B.dark, borderRadius: "6px", overflow: "hidden" }} />
        </div>

        {/* Value labels */}
        <div style={{ position: "relative", width: "100%", height: "38px", marginTop: "6px" }}>
          {[
            { val: mn, label: "Min",     color: B.dark   },
            { val: pa, label: "Matches Avg", color: B.medium },
            { val: mx, label: "Max",     color: B.light  },
          ].map(({ val, label, color }) => (
            <div key={label} style={{ position: "absolute", left: `${val}%`, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color }}>{val}{suffix}</div>
              <div style={{ fontSize: "10px", color: B.warm }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Average Match Strength ────────────────────────────────────────────────────
const AverageMatchStrength = () => {
  const { metrics, portfolioMetrics } = usePortfolio();
  const [view, setView] = useState("range");

  // Range bar + histogram: full pipeline (unfiltered)
  const m    = metrics?.match || {};
  const dist = metrics?.match?.dist || {};
  // Big "Cohort Avg" figure: portfolio SMEs only (Active Support + Support Approved)
  const cohortAvg = portfolioMetrics?.match?.avg || 0;

  const hasData = m.min > 0 || m.avg > 0 || cohortAvg > 0;

  return (
    <Card title="Average Match Strength (%)">
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <Pill label="Range"     active={view === "range"}     onClick={() => setView("range")} />
        <Pill label="Histogram" active={view === "histogram"} onClick={() => setView("histogram")} />
      </div>
      {hasData ? (
        view === "range"
          ? <ScoreRangeView min={m.min} pipelineAvg={m.avg} max={m.max} cohortAvg={cohortAvg} target={75} />
          : <div style={{ height: CHART_HEIGHT }}>
              <Bar
                options={vBarOpts(v => v + "%")}
                data={{ labels: Object.keys(dist), datasets: [{ label: "# SMEs", data: Object.values(dist), backgroundColor: C.slice(0, 5) }] }}
              />
            </div>
      ) : <EmptyState />}
    </Card>
  );
};

// ── Average BIG Score ─────────────────────────────────────────────────────────
const AverageBIGScore = () => {
  const { metrics, portfolioMetrics } = usePortfolio();
  const [view, setView] = useState("range");

  // Range bar + histogram: full pipeline (unfiltered)
  const b    = metrics?.bigScore || {};
  const dist = metrics?.bigScore?.dist || {};
  // Big "Cohort Avg" figure: portfolio SMEs only (Active Support + Support Approved)
  const cohortAvg = portfolioMetrics?.bigScore?.avg || 0;

  const hasData = b.min > 0 || b.avg > 0 || cohortAvg > 0;

  return (
    <Card title="Average BIG Score (%)">
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <Pill label="Range"     active={view === "range"}     onClick={() => setView("range")} />
        <Pill label="Histogram" active={view === "histogram"} onClick={() => setView("histogram")} />
      </div>
      {hasData ? (
        view === "range"
          ? <ScoreRangeView min={b.min} pipelineAvg={b.avg} max={b.max} cohortAvg={cohortAvg} target={70} />
          : <div style={{ height: CHART_HEIGHT }}>
              <Bar
                options={vBarOpts(v => v + "%")}
                data={{ labels: Object.keys(dist), datasets: [{ label: "# SMEs", data: Object.values(dist), backgroundColor: C.slice(0, 5) }] }}
              />
            </div>
      ) : <EmptyState />}
    </Card>
  );
};

// ── Funding Readiness Rate ────────────────────────────────────────────────────
const FundingReadinessRate = () => {
  const { metrics } = usePortfolio();
  const rate  = metrics?.fundingReadinessRate ?? 0;
  const total = metrics?.totalSMEs ?? 0;
  const ready = Math.round((rate / 100) * total);

  return (
    <Card title="Funding Readiness Rate (%)">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <div style={{ fontSize: "64px", fontWeight: "800", color: B.darkest, lineHeight: 1 }}>
          {rate}<span style={{ fontSize: "32px" }}>%</span>
        </div>
        <div style={{ fontSize: "14px", color: B.medium, fontWeight: 600 }}>{ready} of {total} SMEs funding-ready</div>
        <div style={{ width: "100%", background: B.pale, borderRadius: "4px", height: "10px", overflow: "hidden" }}>
          <div style={{ width: `${rate}%`, background: B.medium, height: "100%", borderRadius: "4px" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "0 4px" }}>
          <span style={{ fontSize: "11px", color: B.warm }}>Current: {rate}%</span>
          <span style={{ fontSize: "11px", color: B.warm }}>Target: 70%</span>
        </div>
      </div>
    </Card>
  );
};

// ── Average Vetting Time ──────────────────────────────────────────────────────
const AverageVettingTime = () => {
  const { metrics } = usePortfolio();
  const ACTUAL   = metrics?.vetting?.avg    || 0;
  const TARGET   = metrics?.vetting?.target || 10;
  const VARIANCE = ACTUAL - TARGET;
  const R = 54, CIRC = 2 * Math.PI * R;
  const offset = CIRC - (CIRC * Math.min(ACTUAL, 60)) / 60;

  return (
    <Card title="Average Vetting Time (Days)">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {ACTUAL > 0 ? (
          <>
            <svg width="260" height="260" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={R} stroke={B.pale} strokeWidth="11" fill="none" />
              <circle cx="80" cy="80" r={R} stroke={ACTUAL <= TARGET ? B.medium : B.dark} strokeWidth="11" fill="none" strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={offset} transform="rotate(-90 80 80)" />
              <text x="80" y="74" textAnchor="middle" fill={B.darkest} fontSize="30" fontWeight="800">{Math.round(ACTUAL)}</text>
              <text x="80" y="93" textAnchor="middle" fill={B.warm} fontSize="13">days</text>
            </svg>
            <div style={{ display: "flex", gap: "24px" }}>
              {[
                ["Actual",   Math.round(ACTUAL) + "d",                                    B.dark],
                ["Target",   TARGET + "d",                                                  B.medium],
                ["Variance", (VARIANCE > 0 ? "+" : "") + Math.round(VARIANCE) + "d",       VARIANCE > 0 ? "#8b3a1a" : B.medium],
              ].map(([l, v, col]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: B.warm, marginBottom: "3px" }}>{l}</div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: col }}>{v}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ color: B.light, fontSize: "12px", fontStyle: "italic" }}>Not enough data to compute vetting time yet</div>
        )}
      </div>
    </Card>
  );
};

// ── SME Pipeline Progress ─────────────────────────────────────────────────────
// Stage Dist has 8 pipeline stages (>5) → horizontal bar, sorted highest → lowest.
// Funnel view stays as a Doughnut (intentional visual, not a distribution comparison).
const SMEPipelineProgress = () => {
  const { metrics } = usePortfolio();
  const [view, setView]   = useState("stage");
  const dist              = metrics?.stageDist || {};

  // Filter out zero-count stages so the chart isn't padded with empty bars
  const nonZeroEntries    = Object.entries(dist).filter(([, v]) => v > 0);
  // Horizontal bar: sorted highest → lowest
  const sortedEntries     = [...nonZeroEntries].sort((a, b) => b[1] - a[1]);
  const hbarLabels        = sortedEntries.map(([k]) => k);
  const hbarValues        = sortedEntries.map(([, v]) => v);
  // Doughnut: keep original stage order for readability
  const doughnutLabels    = nonZeroEntries.map(([k]) => k);
  const doughnutValues    = nonZeroEntries.map(([, v]) => v);

  const hasData = nonZeroEntries.length > 0;
  const innerH  = Math.max(parseInt(CHART_HEIGHT), hbarLabels.length * 36);

  return (
    <Card title="SME Pipeline Progress">
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <Pill label="Stage Dist." active={view === "stage"}  onClick={() => setView("stage")} />
        <Pill label="Funnel"      active={view === "funnel"} onClick={() => setView("funnel")} />
      </div>
      {hasData ? (
        <>
          <div style={{ flex: 1, overflow: "hidden" }}>
            {view === "stage" ? (
              // >5 stages → horizontal bar
              <div style={{ height: `${innerH}px`, overflowY: hbarLabels.length > 7 ? "auto" : "visible" }}>
                <Bar
                  options={hBarOpts(true)}
                  data={{ labels: hbarLabels, datasets: [{ label: "# SMEs", data: hbarValues, backgroundColor: C.slice(0, hbarLabels.length) }] }}
                />
              </div>
            ) : (
              // Doughnut funnel — keeps natural stage order
              <div style={{ height: CHART_HEIGHT }}>
                <Doughnut
                  options={doughnutOpts}
                  data={{ labels: doughnutLabels, datasets: [{ data: doughnutValues, backgroundColor: C.slice(0, doughnutLabels.length), borderWidth: 2, borderColor: "#fff" }] }}
                />
              </div>
            )}
          </div>
          {/* Stage count badges — shown in both views */}
          <div style={{ display: "flex", justifyContent: "center", gap: "5px", marginTop: "0px", flexWrap: "wrap", flexShrink: 0 }}>
            {doughnutLabels.map((s, i) => (
              <span key={s} style={{ fontSize: "10px", color: B.dark, background: B.offwhite, padding: "3px 7px", borderRadius: "10px" }}>
                {s}: <strong>{doughnutValues[i]}</strong>
              </span>
            ))}
          </div>
        </>
      ) : <EmptyState />}
    </Card>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const CohortSelection = () => {
  const { loading } = usePortfolio();

  if (loading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-5">
          <CardSkeleton type="bar" />
          <CardSkeleton type="bar" />
          <CardSkeleton type="progress" />
          <CardSkeleton type="gauge" />
          <CardSkeleton type="doughnut" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
        <AverageMatchStrength />
        <AverageBIGScore />
        <FundingReadinessRate />
        <AverageVettingTime />
        <SMEPipelineProgress />
      </div>
    </div>
  );
};

export default CohortSelection;