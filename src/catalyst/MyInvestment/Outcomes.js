import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882"];

// ── Layout constants ──────────────────────────────────────────────────────────
const CARD_HEIGHT  = "400px";
const CHART_HEIGHT = "260px";

// ── Chart options ─────────────────────────────────────────────────────────────
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

// ── Total Jobs KPI ────────────────────────────────────────────────────────────
const TotalJobsCreated = () => {
  const { portfolioMetrics } = usePortfolio();
  const j        = portfolioMetrics?.jobs || {};
  const total    = j.total    || 0;
  const direct   = j.direct   || 0;
  const indirect = j.indirect || 0;

  return (
    <Card title="Total Number of Jobs Created / Projected" subLabel="KPI — from SME growth potential data (portfolio SMEs only)">
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

// ── Jobs per SME ──────────────────────────────────────────────────────────────
const JobsPerSME = () => {
  const { portfolioMetrics } = usePortfolio();
  const perSME = [...(portfolioMetrics?.jobs?.perSME || [])]
    .filter(s => s.jobs > 0)
    .sort((a, b) => b.jobs - a.jobs);
  const total   = portfolioMetrics?.totalSMEs || 1;
  const avgJobs = perSME.length > 0
    ? (perSME.reduce((a, b) => a + b.jobs, 0) / total).toFixed(1)
    : 0;
  const innerH = Math.max(parseInt(CHART_HEIGHT), perSME.length * 36);

  const footer = (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: "12px", color: B.dark, fontWeight: 600 }}>
        Portfolio Avg: <strong>{avgJobs} jobs/SME</strong>
      </span>
      <span style={{ fontSize: "12px", color: B.warm }}>Target: 15</span>
    </div>
  );

  return (
    <Card title="Jobs Created per SME" subLabel="Horizontal bar — projected jobs per SME (direct + indirect)" footer={footer}>
      {perSME.length > 0 ? (
        <div style={{ flex: 1, overflowY: perSME.length > 7 ? "auto" : "visible" }}>
          <div style={{ height: `${innerH}px` }}>
            <Bar
              options={hBarIntegralOpts}
              data={{ labels: perSME.map(s => s.name), datasets: [{ label: "Jobs (direct + indirect)", data: perSME.map(s => s.jobs), backgroundColor: C.slice(0, perSME.length) }] }}
            />
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.light, fontSize: "12px", fontStyle: "italic" }}>
          No job data available yet
        </div>
      )}
    </Card>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const Outcomes = () => {
  const { loading, portfolioMetrics } = usePortfolio();

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: B.warm }}>Loading outcomes data…</div>;

  if (!portfolioMetrics || portfolioMetrics.totalSMEs === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: B.warm, fontStyle: "italic" }}>
        No SMEs with "Active Support" or "Support Approved" status yet.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
      <TotalJobsCreated />
      <JobsPerSME />
    </div>
  );
};

export default Outcomes;