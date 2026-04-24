import React, { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882", "#d4c4b0", "#a08060"];

const CARD_HEIGHT = "460px";
const CHART_HEIGHT = "260px";

const vBarOpts = (yCb, xTitle) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { display: false }, datalabels: { display: false } },
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

const Card = ({ title, footer, children }) => (
  <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", height: CARD_HEIGHT, boxShadow: "0 2px 10px rgba(59,36,9,0.07)", border: `1px solid ${B.pale}`, display: "flex", flexDirection: "column" }}>
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "8px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.dark, margin: 0 }}>{title}</h3>
    </div>
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
    {footer && <div style={{ marginTop: "8px", padding: "7px 10px", borderRadius: "6px", flexShrink: 0 }}>{footer}</div>}
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

// Placeholder data
const placeholderData = {
  match: { min: 45, avg: 68, max: 92, cohortAvg: 68, dist: { "0-20": 2, "21-40": 5, "41-60": 12, "61-80": 18, "81-100": 8 } },
  bigScore: { min: 38, avg: 62, max: 88, cohortAvg: 62, dist: { "0-20": 3, "21-40": 7, "41-60": 14, "61-80": 15, "81-100": 6 } },
  fundingReadinessRate: 58,
  totalSMEs: 45,
  vetting: { avg: 8.5, target: 10 },
  stageDist: { "Application": 45, "Vetting": 28, "Due Diligence": 18, "Deal Close": 12, "Post-Investment": 8 }
};

const ScoreRangeView = ({ min, pipelineAvg, max, cohortAvg, target, suffix = "%" }) => {
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
              <span style={{ fontSize: "11px", color }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AverageMatchStrength = () => {
  const [view, setView] = useState("range");
  const m = placeholderData.match;
  const dist = placeholderData.match.dist;

  return (
    <Card title="Average Match Strength (%)">
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <Pill label="Range" active={view === "range"} onClick={() => setView("range")} />
        <Pill label="Histogram" active={view === "histogram"} onClick={() => setView("histogram")} />
      </div>
      {view === "range"
        ? <ScoreRangeView min={m.min} pipelineAvg={m.avg} max={m.max} cohortAvg={m.cohortAvg} target={75} />
        : <div style={{ height: CHART_HEIGHT }}>
            <Bar
              options={vBarOpts(v => v, "Average Match Strength (%)")}
              data={{ labels: Object.keys(dist), datasets: [{ label: "SMEs", data: Object.values(dist), backgroundColor: B.darkest }] }}
            />
          </div>
      }
    </Card>
  );
};

const AverageBIGScore = () => {
  const [view, setView] = useState("range");
  const b = placeholderData.bigScore;
  const dist = placeholderData.bigScore.dist;

  return (
    <Card title="Average BIG Score (%)">
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <Pill label="Range" active={view === "range"} onClick={() => setView("range")} />
        <Pill label="Histogram" active={view === "histogram"} onClick={() => setView("histogram")} />
      </div>
      {view === "range"
        ? <ScoreRangeView min={b.min} pipelineAvg={b.avg} max={b.max} cohortAvg={b.cohortAvg} target={70} />
        : <div style={{ height: CHART_HEIGHT }}>
            <Bar
              options={vBarOpts(v => v, "Average BIG Score (%)")}
              data={{ labels: Object.keys(dist), datasets: [{ label: "SMEs", data: Object.values(dist), backgroundColor: B.darkest }] }}
            />
          </div>
      }
    </Card>
  );
};

const FundingReadinessRate = () => {
  const rate = placeholderData.fundingReadinessRate;
  const total = placeholderData.totalSMEs;
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

const AverageVettingTime = () => {
  const ACTUAL = placeholderData.vetting.avg;
  const TARGET = placeholderData.vetting.target;
  const VARIANCE = ACTUAL - TARGET;
  const R = 54, CIRC = 2 * Math.PI * R;
  const offset = CIRC - (CIRC * Math.min(ACTUAL, 60)) / 60;

  return (
    <Card title="Average Vetting Time (Days)">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
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
      </div>
    </Card>
  );
};

const SMEPipelineProgress = () => {
  const [view, setView] = useState("stage");
  const dist = placeholderData.stageDist;

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

const CohortSelection = () => {
  const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" };

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