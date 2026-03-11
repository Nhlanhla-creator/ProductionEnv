import React, { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882", "#d4c4b0", "#a08060"];

const barOpts = (yCb) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 11 }, boxWidth: 12 } } },
  scales: {
    x: { grid: { display: false }, ticks: { color: B.dark, font: { size: 10 } } },
    y: { beginAtZero: true, grid: { color: B.offwhite }, ticks: { color: B.dark, callback: yCb || (v => v) } },
  },
});
const pieOpts = {
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 11 }, boxWidth: 12 } } },
};

// ── Skeleton Loaders ──────────────────────────────────────────────────────────
const ChartSkeleton = ({ height = "200px" }) => (
  <div className="flex-1 min-h-[200px] flex items-center justify-center">
    <div className="w-full h-full relative">
      {/* Bar chart skeleton */}
      <div className="absolute inset-0 flex items-end justify-around px-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-8 bg-shimmer-mid bg-shimmer rounded-t-md animate-shimmer`}
            style={{
              height: `${Math.random() * 60 + 20}%`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
      {/* X-axis line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-paleBrown" />
    </div>
  </div>
);

const DoughnutSkeleton = () => (
  <div className="flex-1 min-h-[200px] flex items-center justify-center">
    <div className="relative w-32 h-32">
      {/* Circle segments */}
      <div className="absolute inset-0 rounded-full border-8 border-shimmer-mid bg-shimmer animate-shimmer" />
      <div className="absolute inset-2 rounded-full border-4 border-shimmer-light bg-shimmer animate-shimmer-d1" style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }} />
      <div className="absolute inset-2 rounded-full border-4 border-shimmer-dark bg-shimmer animate-shimmer-d2" style={{ clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)" }} />
      {/* Center hole */}
      <div className="absolute inset-[30%] rounded-full bg-white" />
    </div>
  </div>
);

const GaugeSkeleton = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4">
    <div className="relative w-32 h-32">
      {/* Circle background */}
      <div className="absolute inset-0 rounded-full border-8 border-shimmer-mid bg-shimmer animate-shimmer" />
      {/* Progress indicator */}
      <div 
        className="absolute inset-0 rounded-full border-8 border-shimmer-dark bg-shimmer animate-shimmer-d1" 
        style={{ 
          clipPath: "polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 50% 100%, 50% 50%)",
          transform: "rotate(-45deg)"
        }} 
      />
      {/* Center text area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-8 bg-shimmer-mid bg-shimmer animate-shimmer-d2 rounded" />
      </div>
    </div>
    {/* Stats row */}
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
  const getSkeleton = () => {
    switch (type) {
      case "bar":
        return <ChartSkeleton />;
      case "doughnut":
        return <DoughnutSkeleton />;
      case "gauge":
        return <GaugeSkeleton />;
      case "progress":
        return <ProgressBarSkeleton />;
      default:
        return <ChartSkeleton />;
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 min-h-[320px] shadow-[0_2px_10px_rgba(59,36,9,0.07)] border border-paleBrown flex flex-col">
      {/* Title skeleton */}
      <div className="pb-2.5 border-b border-offWhite mb-2.5">
        <div className="w-3/4 h-4 bg-shimmer-dark bg-shimmer animate-shimmer rounded" />
      </div>
      {/* Subtitle skeleton */}
      <div className="w-2/3 h-3 bg-shimmer-mid bg-shimmer animate-shimmer-d1 rounded mb-3 ml-1" />
      {/* Content skeleton */}
      {getSkeleton()}
    </div>
  );
};

// ── Original Components (unchanged) ───────────────────────────────────────────
const Card = ({ title, subLabel, children }) => (
  <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", minHeight: "320px", boxShadow: "0 2px 10px rgba(59,36,9,0.07)", border: `1px solid ${B.pale}`, display: "flex", flexDirection: "column" }}>
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "10px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.dark, margin: 0 }}>{title}</h3>
    </div>
    {subLabel && <div style={{ fontSize: "11px", color: B.warm, background: B.offwhite, padding: "4px 9px", borderRadius: "4px", borderLeft: `3px solid ${B.medium}`, marginBottom: "12px", fontWeight: "500" }}>{subLabel}</div>}
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "5px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "11px", border: `1.5px solid ${active ? B.medium : B.pale}`, fontWeight: active ? 700 : 500, background: active ? B.medium : "#fff", color: active ? "#fff" : B.medium }}>
    {label}
  </button>
);

const StatBox = ({ label, value, color }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: "10px", color: B.warm, marginBottom: "3px" }}>{label}</div>
    <div style={{ fontSize: "18px", fontWeight: "700", color: color || B.dark }}>{value}</div>
  </div>
);

const EmptyState = () => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.light, fontSize: "12px", fontStyle: "italic" }}>
    No data yet
  </div>
);

// ── Average Match Strength ────────────────────────────────────────────────────
const AverageMatchStrength = () => {
  const { metrics } = usePortfolio();
  const m = metrics?.match || {};
  const sectorData = metrics?.sector || {};
  const labels = Object.keys(sectorData).slice(0, 6);
  const hasData = labels.length > 0 && m.avg > 0;

  return (
    <Card title="Average Match Strength (%)" subLabel="Portfolio match score — min, avg, max">
      {hasData ? (
        <>
          <div style={{ flex: 1, minHeight: "200px" }}>
            <Bar options={barOpts(v => v + "%")} data={{
              labels: ["Min", "Avg", "Max"],
              datasets: [{ label: "Match %", data: [m.min, m.avg, m.max], backgroundColor: [C[4], C[2], C[0]] }],
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", padding: "8px 12px", background: B.offwhite, borderRadius: "6px" }}>
            <span style={{ fontSize: "12px", color: B.dark, fontWeight: 600 }}>Portfolio Avg: <strong>{m.avg}%</strong></span>
            <span style={{ fontSize: "12px", color: B.warm }}>Target: 75%</span>
          </div>
        </>
      ) : <EmptyState />}
    </Card>
  );
};

// ── Average BIG Score ─────────────────────────────────────────────────────────
const AverageBIGScore = () => {
  const { metrics } = usePortfolio();
  const [view, setView] = useState("range");
  const b = metrics?.bigScore || {};
  const dist = b.dist || {};
  const hasData = b.avg > 0;

  return (
    <Card title="Average BIG Score (%)" subLabel={view === "range" ? "Min, avg, max across portfolio" : "Histogram — score bands"}>
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
        <Pill label="Range" active={view === "range"} onClick={() => setView("range")} />
        <Pill label="Histogram" active={view === "histogram"} onClick={() => setView("histogram")} />
      </div>
      {hasData ? (
        <div style={{ flex: 1, minHeight: "210px" }}>
          <Bar options={barOpts(v => v + "%")} data={view === "range" ? {
            labels: ["Min", "Avg", "Max"],
            datasets: [{ label: "BIG Score %", data: [b.min, b.avg, b.max], backgroundColor: [C[4], C[2], C[0]] }],
          } : {
            labels: Object.keys(dist),
            datasets: [{ label: "# SMEs", data: Object.values(dist), backgroundColor: C.slice(0, 5) }],
          }} />
        </div>
      ) : <EmptyState />}
    </Card>
  );
};

// ── Funding Readiness Rate ────────────────────────────────────────────────────
const FundingReadinessRate = () => {
  const { metrics } = usePortfolio();
  const rate = metrics?.fundingReadinessRate ?? 0;
  const total = metrics?.totalSMEs ?? 0;
  const ready = Math.round((rate / 100) * total);

  return (
    <Card title="Funding Readiness Rate (%)" subLabel="SMEs with BIG score ≥ 70%">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <div style={{ fontSize: "64px", fontWeight: "800", color: B.darkest, lineHeight: 1 }}>{rate}<span style={{ fontSize: "32px" }}>%</span></div>
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
  const ACTUAL = metrics?.vetting?.avg || 0;
  const TARGET = metrics?.vetting?.target || 10;
  const VARIANCE = ACTUAL - TARGET;
  const R = 54, CIRC = 2 * Math.PI * R;
  const offset = CIRC - (CIRC * Math.min(ACTUAL, 60)) / 60;

  return (
    <Card title="Average Vetting Time (Days)" subLabel="Days from application to last update — actual vs target">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        {ACTUAL > 0 ? (
          <>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={R} stroke={B.pale} strokeWidth="11" fill="none" />
              <circle cx="80" cy="80" r={R} stroke={ACTUAL <= TARGET ? B.medium : B.dark} strokeWidth="11" fill="none" strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={offset} transform="rotate(-90 80 80)" />
              <text x="80" y="74" textAnchor="middle" fill={B.darkest} fontSize="30" fontWeight="800">{Math.round(ACTUAL)}</text>
              <text x="80" y="93" textAnchor="middle" fill={B.warm} fontSize="13">days</text>
            </svg>
            <div style={{ display: "flex", gap: "24px" }}>
              {[["Actual", Math.round(ACTUAL) + "d", B.dark], ["Target", TARGET + "d", B.medium], ["Variance", (VARIANCE > 0 ? "+" : "") + Math.round(VARIANCE) + "d", VARIANCE > 0 ? "#8b3a1a" : B.medium]].map(([l, v, col]) => (
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
const SMEPipelineProgress = () => {
  const { metrics } = usePortfolio();
  const [view, setView] = useState("stage");
  const dist  = metrics?.stageDist || {};
  const labels = Object.keys(dist).filter(k => dist[k] > 0 || true);
  const values = labels.map(k => dist[k]);
  const hasData = values.some(v => v > 0);

  return (
    <Card title="SME Pipeline Progress" subLabel="Stage distribution across all applications">
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
        <Pill label="Stage Dist." active={view === "stage"} onClick={() => setView("stage")} />
        <Pill label="Funnel" active={view === "funnel"} onClick={() => setView("funnel")} />
      </div>
      {hasData ? (
        <>
          <div style={{ flex: 1, minHeight: "200px" }}>
            {view === "stage"
              ? <Bar options={barOpts()} data={{ labels, datasets: [{ label: "# SMEs", data: values, backgroundColor: C.slice(0, labels.length) }] }} />
              : <Doughnut options={pieOpts} data={{ labels, datasets: [{ data: values, backgroundColor: C.slice(0, labels.length), borderWidth: 2, borderColor: "#fff" }] }} />}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "5px", marginTop: "10px", flexWrap: "wrap" }}>
            {labels.map((s, i) => (
              <span key={s} style={{ fontSize: "10px", color: B.dark, background: B.offwhite, padding: "3px 7px", borderRadius: "10px" }}>
                {s}: <strong>{values[i]}</strong>
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