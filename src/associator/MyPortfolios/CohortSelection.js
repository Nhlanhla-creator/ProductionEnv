import React, { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882", "#d4c4b0", "#a08060"];

const CARD_HEIGHT = "460px";
const CHART_HEIGHT = "260px";

// ── Chart options ─────────────────────────────────────────────────────────────

const vBarOpts = (yCb, xTitle) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { display: false, position: "bottom", labels: { color: B.dark, font: { size: 11 }, boxWidth: 12 } }, datalabels: { display: false } },
  scales: {
    x: { title: { display: true, text: xTitle, color: B.dark }, grid: { display: false }, ticks: { color: B.dark, font: { size: 10 } } },
    y: { title: { display: true, text: "Number of SMEs", color: B.dark }, beginAtZero: true, grid: { color: B.offwhite }, ticks: { color: B.dark, callback: yCb || (v => v), stepSize: 1 } },
  },
});

const hBarOpts = (integralOnly) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  indexAxis: "y",
  plugins: { legend: { display: false }, datalabels: { display: false } },
  scales: {
    x: {
      beginAtZero: true,
      grid: { display: true, color: B.offwhite },
      ticks: { color: B.dark, font: { size: 10 }, ...(integralOnly ? { callback: v => Number.isInteger(v) ? v : "", precision: 0, stepSize: 1 } : {}) },
    },
    y: { grid: { display: false }, ticks: { color: B.dark, font: { size: 11 } } },
  },
});

const doughnutOpts = {
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 11 }, boxWidth: 12 } }, datalabels: { color: B.offwhite } },
};

// ── Shared primitives ─────────────────────────────────────────────────────────
const Card = ({ title, footer, children }) => (
  <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", height: CARD_HEIGHT, boxShadow: "0 2px 10px rgba(59,36,9,0.07)", border: `1px solid ${B.pale}`, display: "flex", flexDirection: "column" }}>
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "8px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.dark, margin: 0 }}>{title}</h3>
    </div>
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
    {footer && (
      <div style={{ marginTop: "8px", padding: "7px 10px", borderRadius: "6px", flexShrink: 0 }}>{footer}</div>
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

// ── Skeleton Loaders ──────────────────────────────────────────────────────────
// Constants (labels, legends, pill text, known targets) render as-is.
// Only fetched values are shimmed.

// AverageMatchStrength + AverageBIGScore — default "range" view
const ScoreRangeSkeleton = ({ target, suffix = "%" }) => (
  <>
    <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
      <Pill label="Range" active />
      <Pill label="Histogram" />
    </div>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
      {/* big avg figure */}
      <div className="bg-shimmer-dark bg-shimmer animate-shimmer" style={{ width: "140px", height: "54px", borderRadius: "8px" }} />
      {/* target is a known constant */}
      <div style={{ fontSize: "14px", color: B.medium, fontWeight: 600 }}>Target: {target}{suffix}</div>
      <div style={{ width: "100%", marginTop: "4px" }}>
        {/* layered bar — widths are unknown, use placeholder widths */}
        <div style={{ position: "relative", width: "100%", height: "12px", background: B.pale, borderRadius: "6px" }}>
          <div className="bg-shimmer-light bg-shimmer animate-shimmer" style={{ position: "absolute", left: 0, top: 0, width: "75%", height: "100%", borderRadius: "6px" }} />
          <div className="bg-shimmer-mid bg-shimmer animate-shimmer-d1" style={{ position: "absolute", left: 0, top: 0, width: "52%", height: "100%", borderRadius: "6px" }} />
          <div className="bg-shimmer-dark bg-shimmer animate-shimmer-d2" style={{ position: "absolute", left: 0, top: 0, width: "30%", height: "100%", borderRadius: "6px" }} />
        </div>
        {/* value labels below bar */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
          <div className="bg-shimmer-light bg-shimmer animate-shimmer-d1" style={{ width: "36px", height: "14px", borderRadius: "4px" }} />
          <div className="bg-shimmer-mid bg-shimmer animate-shimmer-d2" style={{ width: "56px", height: "14px", borderRadius: "4px" }} />
          <div className="bg-shimmer-light bg-shimmer animate-shimmer-d3" style={{ width: "36px", height: "14px", borderRadius: "4px" }} />
        </div>
        {/* legend — labels are constants */}
        <div style={{ position: "relative", width: "95%", height: "20px", marginTop: "36px" }}>
          {[["Min", B.darkest], ["Cohort Avg", B.medium], ["Max", B.light]].map(([label, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "6px", background: color }} />
              <span style={{ fontSize: "11px", color }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

// FundingReadinessRate — big % → "X of Y SMEs" → progress bar → Current / Target
const FundingReadinessSkeleton = () => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "-8px" }}>
    <div className="bg-shimmer-dark bg-shimmer animate-shimmer" style={{ width: "140px", height: "54px", borderRadius: "8px" }} />
    <div className="bg-shimmer-light bg-shimmer animate-shimmer-d1" style={{ width: "190px", height: "16px", borderRadius: "4px" }} />
    <div style={{ width: "100%", marginTop: "4px" }}>
      <div style={{ width: "100%", background: B.pale, borderRadius: "6px", height: "12px", overflow: "hidden" }}>
        <div className="bg-shimmer-mid bg-shimmer animate-shimmer" style={{ width: "55%", height: "100%", borderRadius: "6px" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px" }}>
        {/* current rate is dynamic */}
        <div className="bg-shimmer-light bg-shimmer animate-shimmer-d2" style={{ width: "80px", height: "11px", borderRadius: "4px", marginTop: "2px" }} />
        {/* target is a known constant */}
        <span style={{ fontSize: "14px", color: B.warm }}>Target: 70%</span>
      </div>
    </div>
  </div>
);

// AverageVettingTime — SVG gauge arc → center value → Actual / Target / Variance stats
const VettingTimeSkeleton = () => {
  const R = 54, CIRC = 2 * Math.PI * R;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <svg width="260" height="260" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={R} stroke={B.pale} strokeWidth="11" fill="none" />
        {/* arc shimmed — actual value unknown, use a mid-point placeholder */}
        <circle cx="80" cy="80" r={R} stroke={B.light} strokeWidth="11" fill="none" strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={CIRC * 0.45} transform="rotate(-90 80 80)" />
        {/* center number shimmed */}
        <rect x="54" y="60" width="52" height="26" rx="5" fill={B.pale} />
        {/* "days" label is a constant */}
        <text x="80" y="93" textAnchor="middle" fill={B.warm} fontSize="13">days</text>
      </svg>
      {/* stat labels are constants, values are shimmed */}
      <div style={{ display: "flex", gap: "24px" }}>
        {[["Actual", "44px"], ["Target", "44px"], ["Variance", "52px"]].map(([label, w], i) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: B.warm, marginBottom: "3px" }}>{label}</div>
            <div className={`bg-shimmer-mid bg-shimmer animate-shimmer-d${i + 1}`} style={{ width: w, height: "20px", borderRadius: "4px", margin: "0 auto" }} />
          </div>
        ))}
      </div>
    </div>
  );
};

// SMEPipelineProgress — default "stage" view: pills → hbar rows → stage badges
const PipelineProgressSkeleton = () => (
  <>
    <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
      <Pill label="Stage Dist." active />
      <Pill label="Funnel" />
    </div>
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: "8px" }}>
      {[82, 64, 48, 36, 22].map((w, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* stage label — unknown, shimmed */}
          <div className={`bg-shimmer-light bg-shimmer animate-shimmer-d${(i % 4) + 1}`} style={{ width: "90px", height: "13px", borderRadius: "4px", flexShrink: 0 }} />
          {/* bar — count unknown, widths are illustrative */}
          <div className={`bg-shimmer-mid bg-shimmer animate-shimmer-d${(i % 4) + 1}`} style={{ width: `${w}%`, height: "24px", borderRadius: "4px" }} />
        </div>
      ))}
    </div>
    {/* stage count badges — dynamic, shimmed */}
    <div style={{ display: "flex", justifyContent: "center", gap: "5px", flexWrap: "wrap", flexShrink: 0, marginTop: "8px" }}>
      {[64, 80, 52, 68, 56].map((w, i) => (
        <div key={i} className={`bg-shimmer-light bg-shimmer animate-shimmer-d${(i % 4) + 1}`} style={{ width: `${w}px`, height: "18px", borderRadius: "10px" }} />
      ))}
    </div>
  </>
);

// ── Shared Range View ─────────────────────────────────────────────────────────
const ScoreRangeView = ({ min, pipelineAvg, max, cohortAvg, target, suffix = "%" }) => {
  if (!min && !pipelineAvg && !max && !cohortAvg) return <EmptyState />;

  const clamp = v => Math.min(Math.max(v || 0, 0), 100);
  const mn = clamp(min), pa = clamp(pipelineAvg), mx = clamp(max);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
      <div style={{ fontSize: "64px", fontWeight: "800", color: B.darkest, lineHeight: 1 }}>
        {cohortAvg}<span style={{ fontSize: "32px" }}>{suffix}</span>
      </div>
      <div style={{ fontSize: "14px", color: B.medium, fontWeight: 600 }}>Target: {target}{suffix}</div>
      <div style={{ width: "100%", marginTop: "4px" }}>
        <div style={{ position: "relative", width: "100%", height: "12px", background: B.pale, borderRadius: "6px", overflow: "visible" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: `${mx}%`, height: "100%", background: B.light, borderRadius: "6px", overflow: "hidden" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: `${pa}%`, height: "100%", background: B.medium, borderRadius: "6px", overflow: "hidden" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: `${mn}%`, height: "100%", background: B.dark, borderRadius: "6px", overflow: "hidden" }} />
        </div>
        <div style={{ position: "relative", width: "95%", height: "38px", marginTop: "6px" }}>
          {[
            { val: mn, label: "Min", color: B.dark },
            { val: pa, label: "Matches Avg", color: B.medium },
            { val: mx, label: "Max", color: B.light },
          ].map(({ val, label, color }) => (
            <div key={label} style={{ position: "absolute", left: `${val}%`, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color }}>{val}{suffix}</div>
            </div>
          ))}
        </div>
        <div style={{ position: "relative", width: "95%", height: "20px", marginTop: "6px" }}>
          {[
            { label: "Min", color: B.darkest },
            { label: "Cohort Avg", color: B.medium },
            { label: "Max", color: B.light },
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

// ── Average Match Strength ────────────────────────────────────────────────────
const AverageMatchStrength = () => {
  const { portfolioMetrics } = usePortfolio();
  const [view, setView] = useState("range");

  const m = portfolioMetrics?.match || {};
  const dist = portfolioMetrics?.match?.dist || {};
  const cohortAvg = portfolioMetrics?.match?.avg || 0;
  const hasData = m.min > 0 || m.avg > 0 || cohortAvg > 0;

  return (
    <Card title="Average Match Strength (%)">
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <Pill label="Range" active={view === "range"} onClick={() => setView("range")} />
        <Pill label="Histogram" active={view === "histogram"} onClick={() => setView("histogram")} />
      </div>
      {hasData ? (
        view === "range"
          ? <ScoreRangeView min={m.min} pipelineAvg={m.avg} max={m.max} cohortAvg={cohortAvg} target={75} />
          : <div style={{ height: CHART_HEIGHT }}>
              <Bar
                options={vBarOpts(v => v, "Average Match Strength (%)")}
                data={{ labels: Object.keys(dist), datasets: [{ label: "SMEs", data: Object.values(dist), backgroundColor: B.darkest }] }}
              />
            </div>
      ) : <EmptyState />}
    </Card>
  );
};

// ── Average BIG Score ─────────────────────────────────────────────────────────
const AverageBIGScore = () => {
  const { portfolioMetrics } = usePortfolio();
  const [view, setView] = useState("range");

  const b = portfolioMetrics?.bigScore || {};
  const dist = portfolioMetrics?.bigScore?.dist || {};
  const cohortAvg = portfolioMetrics?.bigScore?.avg || 0;
  const hasData = b.min > 0 || b.avg > 0 || cohortAvg > 0;

  return (
    <Card title="Average BIG Score (%)">
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <Pill label="Range" active={view === "range"} onClick={() => setView("range")} />
        <Pill label="Histogram" active={view === "histogram"} onClick={() => setView("histogram")} />
      </div>
      {hasData ? (
        view === "range"
          ? <ScoreRangeView min={b.min} pipelineAvg={b.avg} max={b.max} cohortAvg={cohortAvg} target={70} />
          : <div style={{ height: CHART_HEIGHT }}>
              <Bar
                options={vBarOpts(v => v, "Average BIG Score (%)")}
                data={{ labels: Object.keys(dist), datasets: [{ label: "SMEs", data: Object.values(dist), backgroundColor: B.darkest }] }}
              />
            </div>
      ) : <EmptyState />}
    </Card>
  );
};

// ── Funding Readiness Rate ────────────────────────────────────────────────────
const FundingReadinessRate = () => {
  const { portfolioMetrics } = usePortfolio();
  const rate = portfolioMetrics?.fundingReadinessRate ?? 0;
  const total = portfolioMetrics?.totalSMEs ?? 0;
  const ready = Math.round((rate / 100) * total);

  return (
    <Card title="Funding Readiness Rate (%)">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "-8px" }}>
        <div style={{ fontSize: "64px", fontWeight: "800", color: B.darkest, lineHeight: 1 }}>
          {rate}<span style={{ fontSize: "32px" }}>%</span>
        </div>
        <div style={{ fontSize: "14px", color: B.medium, fontWeight: 600 }}>{ready} of {total} SMEs funding-ready</div>
        <div style={{ width: "100%", marginTop: "4px" }}>
          <div style={{ width: "100%", background: B.pale, borderRadius: "6px", height: "12px", overflow: "hidden" }}>
            <div style={{ width: `${rate}%`, background: B.medium, height: "100%", borderRadius: "6px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "4px" }}>
            <span style={{ fontSize: "14px", color: B.warm }}>Current: {rate}%</span>
            <span style={{ fontSize: "14px", color: B.warm }}>Target: 70%</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ── Average Vetting Time ──────────────────────────────────────────────────────
const AverageVettingTime = () => {
  const { portfolioMetrics } = usePortfolio();
  const ACTUAL = portfolioMetrics?.vetting?.avg || 0;
  const TARGET = portfolioMetrics?.vetting?.target || 10;
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
              <text x="80" y="74" textAnchor="middle" fill={B.darkest} fontSize="30" fontWeight="800">{(ACTUAL).toFixed(0)}</text>
              <text x="80" y="93" textAnchor="middle" fill={B.warm} fontSize="13">days</text>
            </svg>
            <div style={{ display: "flex", gap: "24px" }}>
              {[
                ["Actual", Math.round(ACTUAL) + "d", B.dark],
                ["Target", TARGET + "d", B.medium],
                ["Variance", (VARIANCE > 0 ? "+" : "") + Math.round(VARIANCE) + "d", VARIANCE > 0 ? "#8b3a1a" : B.medium],
              ].map(([l, v, col]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "14px", color: B.warm, marginBottom: "3px" }}>{l}</div>
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
const SMEPipelineProgress = () => {
  const { metrics } = usePortfolio();
  const [view, setView] = useState("stage");
  const dist = metrics?.stageDist || {};

  const nonZeroEntries = Object.entries(dist).filter(([, v]) => v > 0);
  const sortedEntries = [...nonZeroEntries].sort((a, b) => b[1] - a[1]);
  const hbarLabels = sortedEntries.map(([k]) => k);
  const hbarValues = sortedEntries.map(([, v]) => v);
  const doughnutLabels = nonZeroEntries.map(([k]) => k);
  const doughnutValues = nonZeroEntries.map(([, v]) => v);

  const hasData = nonZeroEntries.length > 0;
  const innerH = Math.max(parseInt(CHART_HEIGHT), hbarLabels.length * 36);

  return (
    <Card title="SME Pipeline Progress">
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <Pill label="Stage Dist." active={view === "stage"} onClick={() => setView("stage")} />
        <Pill label="Funnel" active={view === "funnel"} onClick={() => setView("funnel")} />
      </div>
      {hasData ? (
        <>
          <div style={{ flex: 1, overflow: "hidden" }}>
            {view === "stage" ? (
              <div style={{ height: `${innerH}px`, overflowY: hbarLabels.length > 7 ? "auto" : "visible" }}>
                <Bar
                  options={hBarOpts(true)}
                  data={{ labels: hbarLabels, datasets: [{ label: "# SMEs", data: hbarValues, backgroundColor: C.slice(0, hbarLabels.length) }] }}
                />
              </div>
            ) : (
              <div style={{ height: CHART_HEIGHT }}>
                <Doughnut
                  options={doughnutOpts}
                  data={{ labels: doughnutLabels, datasets: [{ data: doughnutValues, backgroundColor: C.slice(0, doughnutLabels.length), borderWidth: 2, borderColor: "#fff" }] }}
                />
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "5px", marginTop: "0px", flexWrap: "wrap", flexShrink: 0 }}>
            {doughnutLabels.map((s, i) => (
              <span key={s} style={{ fontSize: "10px", color: B.dark, padding: "3px 7px", borderRadius: "10px" }}>
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
  const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" };

  if (loading) {
    return (
      <div style={{ width: "100%" }}>
        <div style={grid}>
          <Card title="Average Match Strength (%)"><ScoreRangeSkeleton target={75} /></Card>
          <Card title="Average BIG Score (%)"><ScoreRangeSkeleton target={70} /></Card>
          <Card title="Funding Readiness Rate (%)"><FundingReadinessSkeleton /></Card>
          <Card title="Average Vetting Time (Days)"><VettingTimeSkeleton /></Card>
          <Card title="SME Pipeline Progress"><PipelineProgressSkeleton /></Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={grid}>
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