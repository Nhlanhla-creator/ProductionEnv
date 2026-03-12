import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882"];

const Card = ({ title, subLabel, children }) => (
  <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", minHeight: "320px", boxShadow: "0 2px 10px rgba(59,36,9,0.07)", border: `1px solid ${B.pale}`, display: "flex", flexDirection: "column" }}>
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "10px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.dark, margin: 0 }}>{title}</h3>
    </div>
    {subLabel && <div style={{ fontSize: "11px", color: B.warm, background: B.offwhite, padding: "4px 9px", borderRadius: "4px", borderLeft: `3px solid ${B.medium}`, marginBottom: "12px", fontWeight: "500" }}>{subLabel}</div>}
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

const barOpts = () => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 11 }, boxWidth: 12 } } },
  scales: {
    x: { grid: { display: false }, ticks: { color: B.dark, font: { size: 10 } } },
    y: { beginAtZero: true, grid: { color: B.offwhite }, ticks: { color: B.dark } },
  },
});

const TotalJobsCreated = () => {
  const { metrics } = usePortfolio();
  const j = metrics?.jobs || {};
  const total    = j.total    || 0;
  const direct   = j.direct   || 0;
  const indirect = j.indirect || 0;

  return (
    <Card title="Total Number of Jobs Created / Projected" subLabel="KPI Card — from SME growth potential data">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
        {total > 0 ? (
          <>
            <div style={{ fontSize: "64px", fontWeight: "800", color: B.darkest, lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: "14px", color: B.medium, fontWeight: 600 }}>total jobs (direct + indirect)</div>
            <div style={{ display: "flex", gap: "20px", marginTop: "14px" }}>
              {[["Direct", direct, B.dark], ["Indirect", indirect, B.medium]].map(([l, v, col]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: B.light, marginBottom: "3px" }}>{l}</div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: col }}>{v}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ color: B.light, fontSize: "12px", fontStyle: "italic", textAlign: "center" }}>
            Job creation data not yet available in profiles.<br />Sourced from Growth Potential section.
          </div>
        )}
      </div>
    </Card>
  );
};

const JobsPerSME = () => {
  const { metrics } = usePortfolio();
  const perSME = (metrics?.jobs?.perSME || []).filter(s => s.jobs > 0);
  const total  = metrics?.totalSMEs || 1;
  const avgJobs = perSME.length > 0 ? (perSME.reduce((a, b) => a + b.jobs, 0) / total).toFixed(1) : 0;

  return (
    <Card title="Jobs Created per SME" subLabel="Bar chart — projected jobs per SME">
      {perSME.length > 0 ? (
        <>
          <div style={{ flex: 1, minHeight: "240px" }}>
            <Bar options={barOpts()} data={{
              labels: perSME.map(s => s.name),
              datasets: [{ label: "Jobs (direct + indirect)", data: perSME.map(s => s.jobs), backgroundColor: C.slice(0, perSME.length) }],
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", padding: "8px 12px", background: B.offwhite, borderRadius: "6px" }}>
            <span style={{ fontSize: "12px", color: B.dark, fontWeight: 600 }}>Portfolio Avg: <strong>{avgJobs} jobs/SME</strong></span>
            <span style={{ fontSize: "12px", color: B.warm }}>Target: 15</span>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.light, fontSize: "12px", fontStyle: "italic" }}>
          No job data available yet
        </div>
      )}
    </Card>
  );
};

const Outcomes = () => {
  const { loading } = usePortfolio();
  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: B.warm }}>Loading outcomes data…</div>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
      <TotalJobsCreated />
      <JobsPerSME />
    </div>
  );
};

export default Outcomes;