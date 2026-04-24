import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882"];

const CARD_HEIGHT = "400px";
const CHART_HEIGHT = "260px";

const hBarOpts = (valCb, integralOnly) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  indexAxis: "y",
  plugins: { legend: { display: false }, datalabels: { display: false } },
  scales: {
    x: {
      beginAtZero: true,
      grid: { display: true, color: B.offwhite },
      ticks: {
        color: B.dark, font: { size: 10 },
        ...(valCb ? { callback: valCb } : {}),
        ...(integralOnly && !valCb ? { callback: v => Number.isInteger(v) ? v : "", precision: 0, stepSize: 1 } : {}),
      },
    },
    y: { grid: { display: false }, ticks: { color: B.dark, font: { size: 11 } } },
  },
});

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

const EmptyState = ({ message }) => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.light, fontSize: "12px", fontStyle: "italic", textAlign: "center", padding: "1rem" }}>
    {message || "No data yet"}
  </div>
);

// Placeholder data
const placeholderMetrics = {
  totalSMEs: 45,
  revenue: {
    total: 125000000,
    avg: 2777777,
    perSME: [
      { name: "TechSolve", revenue: 18500000, profitability: "Profitable" },
      { name: "GreenEnergy", revenue: 12200000, profitability: "Profitable" },
      { name: "HealthPlus", revenue: 8900000, profitability: "Breakeven" },
      { name: "EduTech", revenue: 5600000, profitability: "Profitable" },
      { name: "LogiSync", revenue: 4200000, profitability: "Breakeven" },
      { name: "AgriGrow", revenue: 3100000, profitability: "Unprofitable" },
      { name: "CleanSolutions", revenue: 2800000, profitability: "Profitable" },
      { name: "FinWise", revenue: 2500000, profitability: "Breakeven" },
    ]
  },
  bigScore: { avg: 62, min: 38, max: 88 }
};

const RevenuePerSME = () => {
  const perSME = [...placeholderMetrics.revenue.perSME].sort((a, b) => b.revenue - a.revenue);
  const innerH = Math.max(parseInt(CHART_HEIGHT), perSME.length * 36);

  const footer = (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: "12px", color: B.dark, fontWeight: 600 }}>
        Total: <strong>R{(placeholderMetrics.revenue.total / 1_000_000).toFixed(1)}M</strong>
      </span>
      <span style={{ fontSize: "12px", color: B.warm }}>
        Avg: R{(placeholderMetrics.revenue.avg / 1_000_000).toFixed(1)}M / SME
      </span>
    </div>
  );

  return (
    <Card title="Net Profit per SME" footer={footer}>
      {perSME.length > 0 ? (
        <div style={{ flex: 1, overflowY: perSME.length > 7 ? "auto" : "visible" }}>
          <div style={{ height: `${innerH}px` }}>
            <Bar
              options={hBarOpts(v => "R" + (v / 1_000_000).toFixed(1) + "M")}
              data={{ labels: perSME.map(s => s.name), datasets: [{ label: "Annual Revenue (R)", data: perSME.map(s => s.revenue), backgroundColor: C.slice(0, perSME.length) }] }}
            />
          </div>
        </div>
      ) : <EmptyState message="Revenue data not yet available in profiles" />}
    </Card>
  );
};

const ProfitabilityStatus = () => {
  const perSME = placeholderMetrics.revenue.perSME;
  const statusCounts = perSME.reduce((acc, s) => {
    acc[s.profitability] = (acc[s.profitability] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([l]) => l);
  const values = sorted.map(([, v]) => v);
  const total = perSME.length;
  const statusColors = { "Profitable": "#2fe578", "Breakeven": "#fad05d", "Pre-revenue": "#d4c4b0", "Unprofitable": "#de2e2e" };

  return (
    <Card title="Profitability Status">
      {labels.length > 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center" }}>
          {labels.map((l, i) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: statusColors[l] || C[i], flexShrink: 0 }} />
              <div style={{ flex: 1, background: B.offwhite, borderRadius: "4px", height: "24px", overflow: "hidden" }}>
                <div style={{ width: `${(values[i] / total) * 100}%`, background: statusColors[l] || C[i], height: "100%", display: "flex", alignItems: "center", paddingLeft: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#fff", fontWeight: 600 }}>{values[i]}</span>
                </div>
              </div>
              <span style={{ fontSize: "12px", color: B.dark, minWidth: "90px" }}>{l}</span>
            </div>
          ))}
        </div>
      ) : <EmptyState message="Profitability data not yet in profiles" />}
    </Card>
  );
};

const ClientsPerSME = () => {
  const smeClients = [
    { name: "TechSolve", count: 8 },
    { name: "GreenEnergy", count: 6 },
    { name: "HealthPlus", count: 5 },
    { name: "EduTech", count: 4 },
    { name: "LogiSync", count: 3 },
    { name: "AgriGrow", count: 2 },
  ].sort((a, b) => b.count - a.count);
  const innerH = Math.max(parseInt(CHART_HEIGHT), smeClients.length * 36);

  return (
    <Card title="Key Clients per SME">
      {smeClients.length > 0 ? (
        <div style={{ flex: 1, overflowY: smeClients.length > 7 ? "auto" : "visible" }}>
          <div style={{ height: `${innerH}px` }}>
            <Bar
              options={hBarOpts(null, true)}
              data={{ labels: smeClients.map(s => s.name), datasets: [{ label: "# Key Clients", data: smeClients.map(s => s.count), backgroundColor: C.slice(0, smeClients.length) }] }}
            />
          </div>
        </div>
      ) : <EmptyState message="Key client data not yet available in profiles" />}
    </Card>
  );
};

const Performance = () => {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
        <RevenuePerSME />
        <ProfitabilityStatus />
        <ClientsPerSME />
      </div>
    </div>
  );
};

export default Performance;