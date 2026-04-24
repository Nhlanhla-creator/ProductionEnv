import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882"];

const CARD_HEIGHT = "400px";
const CHART_HEIGHT = "260px";

const hBarIntegralOpts = {
  responsive: true, maintainAspectRatio: false, animation: false,
  indexAxis: "y",
  plugins: { legend: { display: false }, datalabels: { color: B.offwhite } },
  scales: {
    x: {
      beginAtZero: true,
      grid: { display: true, color: B.offwhite },
      ticks: { color: B.dark, callback: v => Number.isInteger(v) ? v : "", precision: 0, stepSize: 1 },
    },
    y: { grid: { display: false }, ticks: { color: B.dark, font: { size: 11 } } },
  },
};

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

// Placeholder data
const placeholderJobs = {
  total: 385,
  direct: 245,
  indirect: 140,
  perSME: [
    { name: "TechSolve", jobs: 45, sector: "Fintech" },
    { name: "GreenEnergy", jobs: 32, sector: "Clean Energy" },
    { name: "HealthPlus", jobs: 28, sector: "Healthtech" },
    { name: "EduTech", jobs: 24, sector: "Edtech" },
    { name: "LogiSync", jobs: 18, sector: "Logistics" },
    { name: "AgriGrow", jobs: 15, sector: "Agritech" },
  ],
  perSector: [
    { sector: "Fintech", jobs: 78 },
    { sector: "Clean Energy", jobs: 65 },
    { sector: "Healthtech", jobs: 52 },
    { sector: "Edtech", jobs: 48 },
    { sector: "Logistics", jobs: 42 },
    { sector: "Agritech", jobs: 38 },
  ]
};

const TotalJobsCreated = () => {
  const total = placeholderJobs.total;
  const direct = placeholderJobs.direct;
  const indirect = placeholderJobs.indirect;

  return (
    <Card title="Total Number of Jobs Created / Projected">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
        <div style={{ fontSize: "64px", fontWeight: "800", color: B.darkest, lineHeight: 1 }}>{total}</div>
        <div style={{ display: "flex", gap: "20px", marginTop: "14px" }}>
          {[["Direct", direct, B.dark], ["Indirect", indirect, B.medium]].map(([l, v, col]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: B.light, marginBottom: "3px" }}>{l}</div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: col }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const JobsBreakdown = () => {
  const [view, setView] = React.useState("sme");

  const perSME = [...placeholderJobs.perSME].sort((a, b) => b.jobs - a.jobs);
  const perSector = [...placeholderJobs.perSector].sort((a, b) => b.jobs - a.jobs);

  const totalSMEs = 45;
  const avgJobs = perSME.length > 0 ? (perSME.reduce((a, b) => a + b.jobs, 0) / totalSMEs).toFixed(1) : 0;

  const smeInnerH = Math.max(parseInt(CHART_HEIGHT), perSME.length * 36);
  const sectorInnerH = Math.max(parseInt(CHART_HEIGHT), perSector.length * 36);

  const footer = view === "sme" ? (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: "12px", color: B.dark, fontWeight: 600 }}>
        Portfolio Avg: <strong>{avgJobs} jobs/SME</strong>
      </span>
      <span style={{ fontSize: "12px", color: B.warm }}>Target: 15</span>
    </div>
  ) : (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: "12px", color: B.dark, fontWeight: 600 }}>
        Total: <strong>{perSector.reduce((a, b) => a + b.jobs, 0)} jobs</strong>
      </span>
      <span style={{ fontSize: "12px", color: B.warm }}>{perSector.length} active sectors</span>
    </div>
  );

  const isEmpty = view === "sme" ? perSME.length === 0 : perSector.length === 0;

  return (
    <Card title="Jobs Created" footer={!isEmpty ? footer : undefined}>
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <Pill label="Per SME" active={view === "sme"} onClick={() => setView("sme")} />
        <Pill label="Per Sector" active={view === "sector"} onClick={() => setView("sector")} />
      </div>

      {isEmpty ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.light, fontSize: "12px", fontStyle: "italic" }}>
          No job data available yet
        </div>
      ) : view === "sme" ? (
        <div style={{ flex: 1, overflowY: perSME.length > 7 ? "auto" : "visible" }}>
          <div style={{ height: `${smeInnerH}px` }}>
            <Bar
              options={hBarIntegralOpts}
              data={{ labels: perSME.map(s => s.name), datasets: [{ label: "Jobs", data: perSME.map(s => s.jobs), backgroundColor: C.slice(0, perSME.length) }] }}
            />
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: perSector.length > 7 ? "auto" : "visible" }}>
          <div style={{ height: `${sectorInnerH}px` }}>
            <Bar
              options={hBarIntegralOpts}
              data={{ labels: perSector.map(s => s.sector), datasets: [{ label: "Jobs (direct + indirect)", data: perSector.map(s => s.jobs), backgroundColor: C.slice(0, perSector.length) }] }}
            />
          </div>
        </div>
      )}
    </Card>
  );
};

const Outcomes = () => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
      <TotalJobsCreated />
      <JobsBreakdown />
    </div>
  );
};

export default Outcomes;