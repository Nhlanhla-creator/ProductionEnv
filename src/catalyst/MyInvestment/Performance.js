import React, { useState } from "react";
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

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "5px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "11px", border: `1.5px solid ${active ? B.medium : B.pale}`, fontWeight: active ? 700 : 500, background: active ? B.medium : "#fff", color: active ? "#fff" : B.medium }}>
    {label}
  </button>
);

const EmptyState = ({ message }) => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.light, fontSize: "12px", fontStyle: "italic", textAlign: "center", padding: "1rem" }}>
    {message || "No data yet"}
  </div>
);

const barOpts = (yCb) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 11 }, boxWidth: 12 } }, datalabels: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: B.dark, font: { size: 10 } } },
    y: { beginAtZero: true, grid: { color: B.offwhite }, ticks: { color: B.dark, callback: yCb || (v => v) } },
  },
});

// ── Revenue per SME ───────────────────────────────────────────────────────────
const RevenuePerSME = () => {
  const { metrics } = usePortfolio();
  const perSME = (metrics?.revenue?.perSME || []).filter(s => s.revenue > 0);

  return (
    <Card title="Annual Revenue per SME" subLabel="Actual revenue from SME profiles (R)">
      {perSME.length > 0 ? (
        <>
          <div style={{ flex: 1, minHeight: "240px" }}>
            <Bar options={barOpts(v => "R" + (v / 1000000).toFixed(1) + "M")} data={{
              labels: perSME.map(s => s.name),
              datasets: [{ label: "Annual Revenue (R)", data: perSME.map(s => s.revenue), backgroundColor: C.slice(0, perSME.length) }],
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", padding: "8px 12px", background: B.offwhite, borderRadius: "6px" }}>
            <span style={{ fontSize: "12px", color: B.dark, fontWeight: 600 }}>Portfolio Total: <strong>R{(metrics.revenue.total / 1000000).toFixed(1)}M</strong></span>
            <span style={{ fontSize: "12px", color: B.warm }}>Avg: R{(metrics.revenue.avg / 1000000).toFixed(1)}M / SME</span>
          </div>
        </>
      ) : <EmptyState message="Revenue data not yet available in profiles" />}
    </Card>
  );
};

// ── Profitability Status ──────────────────────────────────────────────────────
const ProfitabilityStatus = () => {
  const { metrics } = usePortfolio();
  const perSME = metrics?.revenue?.perSME || [];
  const statuses = perSME.filter(s => s.profitability && s.profitability !== "Unknown");

  const statusCounts = statuses.reduce((acc, s) => {
    acc[s.profitability] = (acc[s.profitability] || 0) + 1;
    return acc;
  }, {});
  const labels = Object.keys(statusCounts);
  const values = labels.map(k => statusCounts[k]);
  const statusColors = { Profitable: "#7d5a36", "Break-even": "#b8a082", "Pre-revenue": "#d4c4b0", Unprofitable: "#9b3a1a" };

  return (
    <Card title="Profitability Status" subLabel="Distribution across portfolio SMEs">
      {labels.length > 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center" }}>
          {labels.map((l, i) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: statusColors[l] || C[i], flexShrink: 0 }} />
              <div style={{ flex: 1, background: B.offwhite, borderRadius: "4px", height: "24px", overflow: "hidden" }}>
                <div style={{ width: `${(values[i] / statuses.length) * 100}%`, background: statusColors[l] || C[i], height: "100%", display: "flex", alignItems: "center", paddingLeft: "8px" }}>
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

// ── Capital Required ──────────────────────────────────────────────────────────
const CapitalRequired = () => {
  const { metrics } = usePortfolio();
  const perSME = (metrics?.revenue?.perSME || []).filter(s => s.fundingRequired > 0);

  return (
    <Card title="Capital Required per SME" subLabel="Funding requested per SME (R)">
      {perSME.length > 0 ? (
        <div style={{ flex: 1, minHeight: "240px" }}>
          <Bar options={barOpts(v => "R" + (v / 1000000).toFixed(1) + "M")} data={{
            labels: perSME.map(s => s.name),
            datasets: [{ label: "Funding Required (R)", data: perSME.map(s => s.fundingRequired), backgroundColor: C.slice(0, perSME.length) }],
          }} />
        </div>
      ) : <EmptyState />}
    </Card>
  );
};

// ── BIG Score as proxy for portfolio quality ──────────────────────────────────
const PortfolioQualityGauge = () => {
  const { metrics } = usePortfolio();
  const avg = metrics?.bigScore?.avg || 0;
  const R = 54, CIRC = 2 * Math.PI * R;
  const offset = CIRC - (CIRC * Math.min(avg, 100)) / 100;

  return (
    <Card title="Portfolio Quality (BIG Score Avg)" subLabel="Blended average BIG score across all SMEs">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
        {avg > 0 ? (
          <>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={R} stroke={B.pale} strokeWidth="11" fill="none" />
              <circle cx="80" cy="80" r={R} stroke={B.dark} strokeWidth="11" fill="none" strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={offset} transform="rotate(-90 80 80)" />
              <text x="80" y="72" textAnchor="middle" fill={B.darkest} fontSize="26" fontWeight="800">{avg}</text>
              <text x="80" y="92" textAnchor="middle" fill={B.warm} fontSize="12">/ 100</text>
            </svg>
            <div style={{ display: "flex", gap: "24px" }}>
              {[["Avg", avg, B.dark], ["Min", metrics.bigScore.min, B.warm], ["Max", metrics.bigScore.max, B.medium]].map(([l, v, col]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: B.warm, marginBottom: "3px" }}>{l}</div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: col }}>{v}</div>
                </div>
              ))}
            </div>
          </>
        ) : <EmptyState />}
      </div>
    </Card>
  );
};

// ── Client Count (from profile keyClients) ────────────────────────────────────
const ClientsPerSME = () => {
  const { metrics, enriched } = usePortfolio();
  const smeClients = enriched.map(a => ({
    name: a.smeName || "Unknown",
    count: (a.profile?.productsServices?.keyClients || []).length,
  })).filter(s => s.count > 0);

  return (
    <Card title="# Key Clients per SME" subLabel="Key clients listed in SME profiles">
      {smeClients.length > 0 ? (
        <div style={{ flex: 1, minHeight: "240px" }}>
          <Bar options={barOpts()} data={{
            labels: smeClients.map(s => s.name),
            datasets: [{ label: "# Key Clients", data: smeClients.map(s => s.count), backgroundColor: C.slice(0, smeClients.length) }],
          }} />
        </div>
      ) : <EmptyState message="Key client data not yet available in profiles" />}
    </Card>
  );
};

const SUBS = [
  { id: "financial",          label: "Financial" },
  { id: "market-penetration", label: "Market Penetration" },
];

const Performance = () => {
  const [sub, setSub] = useState("financial");
  const { loading } = usePortfolio();

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: B.warm }}>Loading performance data…</div>;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {SUBS.map(s => <Pill key={s.id} label={s.label} active={sub === s.id} onClick={() => setSub(s.id)} />)}
      </div>

      {sub === "financial" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <RevenuePerSME />
          <ProfitabilityStatus />
          <CapitalRequired />
          <PortfolioQualityGauge />
        </div>
      )}

      {sub === "market-penetration" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <ClientsPerSME />
        </div>
      )}
    </div>
  );
};

export default Performance;