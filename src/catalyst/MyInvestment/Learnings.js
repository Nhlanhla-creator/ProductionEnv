import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882", "#d4c4b0", "#a08060"];

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

const hBarOpts = () => ({
  responsive: true, maintainAspectRatio: false, animation: false, indexAxis: "y",
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, grid: { color: B.offwhite }, ticks: { color: B.dark, font: { size: 11 } } },
    y: { grid: { display: false }, ticks: { color: B.dark, font: { size: 11 } } },
  },
});

const HBarFromObj = ({ title, subLabel, data, emptyMsg, summaryFn }) => {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const labels = sorted.map(([k]) => k);
  const values = sorted.map(([, v]) => v);
  const topEntry = sorted[0];

  return (
    <Card title={title} subLabel={subLabel}>
      {values.length > 0 ? (
        <>
          <div style={{ flex: 1, minHeight: "280px" }}>
            <Bar options={hBarOpts()} data={{ labels, datasets: [{ label: "# SMEs", data: values, backgroundColor: values.map((_, i) => C[Math.min(i, C.length - 1)]) }] }} />
          </div>
          {topEntry && (
            <div style={{ marginTop: "10px", padding: "8px 12px", background: B.offwhite, borderRadius: "6px", fontSize: "12px", color: B.dark }}>
              {summaryFn ? summaryFn(topEntry) : <><strong>Top:</strong> {topEntry[0]} — {topEntry[1]} SMEs</>}
            </div>
          )}
        </>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.light, fontSize: "12px", fontStyle: "italic" }}>
          {emptyMsg || "No data yet"}
        </div>
      )}
    </Card>
  );
};

const MostRequestedSupportArea = () => {
  const { metrics } = usePortfolio();
  // Combine supportRequired and servicesRequired from applications
  const combined = {};
  const support  = metrics?.learnings?.support   || {};
  const services = metrics?.learnings?.services  || {};
  Object.entries(support).forEach(([k, v]) => { combined[k] = (combined[k] || 0) + v; });
  Object.entries(services).forEach(([k, v]) => { combined[k] = (combined[k] || 0) + v; });

  return (
    <HBarFromObj
      title="Most Requested Support / Services"
      subLabel="Horizontal Bar — from application support & services fields"
      data={combined}
      emptyMsg="No support preference data in applications yet"
      summaryFn={([k, v]) => <><strong>Top need:</strong> {k} — {v} application{v !== 1 ? "s" : ""}</>}
    />
  );
};

const CapabilityGapDistribution = () => {
  const { metrics } = usePortfolio();
  const barriers = metrics?.learnings?.barriers || {};

  return (
    <HBarFromObj
      title="Capability Gap Distribution"
      subLabel="Horizontal Bar — barriers reported in SME Enterprise Readiness profiles"
      data={barriers}
      emptyMsg="No barrier / capability gap data in profiles yet"
      summaryFn={([k, v]) => <><strong>Biggest gap:</strong> {k} — {v} SME{v !== 1 ? "s" : ""} affected</>}
    />
  );
};

const SUBS = [
  { id: "support",      label: "Support Most Needed" },
  { id: "capabilities", label: "Capabilities Most Missing" },
];

const Learnings = () => {
  const [sub, setSub] = useState("support");
  const { loading } = usePortfolio();

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: B.warm }}>Loading learnings data…</div>;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {SUBS.map(s => <Pill key={s.id} label={s.label} active={sub === s.id} onClick={() => setSub(s.id)} />)}
      </div>

      {sub === "support" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: "20px" }}>
          <MostRequestedSupportArea />
        </div>
      )}

      {sub === "capabilities" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: "20px" }}>
          <CapabilityGapDistribution />
        </div>
      )}
    </div>
  );
};

export default Learnings;