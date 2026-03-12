import React, { useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882", "#d4c4b0", "#a08060", "#6b4c2a", "#8a6340"];

const barOpts = (yCb, horizontal) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  indexAxis: horizontal ? "y" : "x",
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 11 }, boxWidth: 12 } } },
  scales: {
    x: { grid: { display: horizontal }, ticks: { color: B.dark, font: { size: 11 }, callback: horizontal ? yCb : undefined } },
    y: { beginAtZero: true, grid: { color: horizontal ? "transparent" : B.offwhite }, ticks: { color: B.dark, callback: horizontal ? undefined : yCb } },
  },
});
const pieOpts = { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 11 }, boxWidth: 12 } } } };

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

const EmptyState = () => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.light, fontSize: "12px", fontStyle: "italic" }}>
    No data yet
  </div>
);

const PieFromObj = ({ title, subLabel, data }) => {
  const labels = Object.keys(data).filter(k => data[k] > 0);
  const values = labels.map(k => data[k]);
  return (
    <Card title={title} subLabel={subLabel}>
      {values.length > 0
        ? <div style={{ flex: 1, minHeight: "220px" }}><Pie options={pieOpts} data={{ labels, datasets: [{ data: values, backgroundColor: C.slice(0, labels.length), borderWidth: 2, borderColor: "#fff" }] }} /></div>
        : <EmptyState />}
    </Card>
  );
};

const HBarFromObj = ({ title, subLabel, data }) => {
  const labels = Object.keys(data).filter(k => data[k] > 0);
  const values = labels.map(k => data[k]);
  return (
    <Card title={title} subLabel={subLabel}>
      {values.length > 0
        ? <div style={{ flex: 1, minHeight: "240px" }}><Bar options={barOpts(undefined, true)} data={{ labels, datasets: [{ label: "# SMEs", data: values, backgroundColor: C[2] }] }} /></div>
        : <EmptyState />}
    </Card>
  );
};

// ── Composition ──────────────────────────────────────────────────────────────
const TotalSMEsCount = () => {
  const { metrics } = usePortfolio();
  const ACTUAL = metrics?.totalSMEs || 0;
  const TARGET = 50; // configurable benchmark
  const R = 54, CIRC = 2 * Math.PI * R;
  const offset = CIRC - (CIRC * Math.min(ACTUAL, TARGET)) / TARGET;
  return (
    <Card title="Total Number of SMEs" subLabel="Gauge — actual vs target">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={R} stroke={B.pale} strokeWidth="11" fill="none" />
          <circle cx="80" cy="80" r={R} stroke={B.medium} strokeWidth="11" fill="none" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={offset} transform="rotate(-90 80 80)" />
          <text x="80" y="74" textAnchor="middle" fill={B.darkest} fontSize="30" fontWeight="800">{ACTUAL}</text>
          <text x="80" y="93" textAnchor="middle" fill={B.warm} fontSize="12">SMEs</text>
        </svg>
        <div style={{ fontSize: "12px", color: B.warm }}>Target: <strong style={{ color: B.dark }}>{TARGET}</strong></div>
      </div>
    </Card>
  );
};

const SMEsByRevenue = () => {
  const { metrics } = usePortfolio();
  const [view, setView] = useState("pie");
  const buckets = metrics?.revenue?.buckets || {};
  const perSME  = metrics?.revenue?.perSME || [];
  const labels  = Object.keys(buckets).filter(k => buckets[k] > 0);
  const values  = labels.map(k => buckets[k]);
  const hasData = values.length > 0;

  return (
    <Card title="SMEs by Revenue (#)" subLabel={view === "pie" ? "Distribution by revenue band" : "Revenue per SME (R)"}>
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
        <Pill label="Distribution" active={view === "pie"} onClick={() => setView("pie")} />
        <Pill label="Per SME" active={view === "bar"} onClick={() => setView("bar")} />
      </div>
      {hasData ? (
        <div style={{ flex: 1, minHeight: "200px" }}>
          {view === "pie"
            ? <Pie options={pieOpts} data={{ labels, datasets: [{ data: values, backgroundColor: C.slice(0, labels.length), borderWidth: 2, borderColor: "#fff" }] }} />
            : <Bar options={barOpts(v => "R" + (v / 1000).toFixed(0) + "k")} data={{
                labels: perSME.map(s => s.name),
                datasets: [{ label: "Revenue (R)", data: perSME.map(s => s.revenue), backgroundColor: C[2] }],
              }} />}
        </div>
      ) : <EmptyState />}
    </Card>
  );
};

// ── Support Focus ─────────────────────────────────────────────────────────────
const FundingAllocationBySector = () => {
  const { metrics } = usePortfolio();
  const bySector = metrics?.funding?.bySector || {};
  const labels   = Object.keys(bySector).filter(k => bySector[k] > 0);
  const values   = labels.map(k => bySector[k]);
  return (
    <Card title="Funding Required by Sector (R)" subLabel="Total funding requested per sector">
      {values.length > 0
        ? <div style={{ flex: 1, minHeight: "220px" }}><Pie options={pieOpts} data={{ labels, datasets: [{ data: values, backgroundColor: C.slice(0, labels.length), borderWidth: 2, borderColor: "#fff" }] }} /></div>
        : <EmptyState />}
    </Card>
  );
};

const AverageFundingPerSME = () => {
  const { metrics } = usePortfolio();
  const avg   = metrics?.funding?.avg || 0;
  const total = metrics?.funding?.total || 0;
  const n     = metrics?.totalSMEs || 0;
  const perSME = metrics?.revenue?.perSME || [];

  return (
    <Card title="Funding Required per SME" subLabel="Bar chart — individual SME funding needs">
      {perSME.length > 0 ? (
        <>
          <div style={{ flex: 1, minHeight: "220px" }}>
            <Bar options={barOpts(v => "R" + (v / 1000).toFixed(0) + "k")} data={{
              labels: perSME.map(s => s.name),
              datasets: [{ label: "Funding Required (R)", data: perSME.map(s => s.fundingRequired), backgroundColor: C[1] }],
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", padding: "8px 12px", background: B.offwhite, borderRadius: "6px" }}>
            <span style={{ fontSize: "12px", color: B.dark, fontWeight: 600 }}>Portfolio Avg: <strong>R{(avg / 1000000).toFixed(1)}M</strong></span>
            <span style={{ fontSize: "12px", color: B.warm }}>Total: R{(total / 1000000).toFixed(1)}M across {n} SMEs</span>
          </div>
        </>
      ) : <EmptyState />}
    </Card>
  );
};

const SUBS = [
  { id: "composition",  label: "Portfolio Composition" },
  { id: "demographics", label: "Beneficiary Demographics" },
  { id: "support",      label: "Support Focus" },
];

const PortfolioHealth = () => {
  const [sub, setSub] = useState("composition");
  const { metrics, loading } = usePortfolio();

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: B.warm }}>Loading portfolio data…</div>;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {SUBS.map(s => <Pill key={s.id} label={s.label} active={sub === s.id} onClick={() => setSub(s.id)} />)}
      </div>

      {sub === "composition" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <TotalSMEsCount />
          <PieFromObj title="SMEs by Headcount (#)"               subLabel="Pie chart — employee count bands"    data={metrics?.headcount || {}} />
          <PieFromObj title="SMEs by Sector (#)"                  subLabel="Pie chart — economic sector"         data={metrics?.sector    || {}} />
          <PieFromObj title="SMEs by Business Lifecycle Stage (#)" subLabel="Pie chart — operational stage"      data={metrics?.lifecycle  || {}} />
          <PieFromObj title="SMEs by Geography (#)"               subLabel="Pie chart — province / location"    data={metrics?.geography  || {}} />
        </div>
      )}

      {sub === "demographics" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <PieFromObj title="SMEs by Gender (#)"            subLabel="Pie — shareholder gender breakdown"       data={metrics?.gender     || {}} />
          <PieFromObj title="SMEs by Disability Status (#)" subLabel="Pie — disability disclosed by shareholders" data={metrics?.disability || {}} />
          <PieFromObj title="SMEs by Youth Status (#)"      subLabel="Pie — youth shareholders"                data={metrics?.youth      || {}} />
          <PieFromObj title="SMEs by HDI Ownership (#)"     subLabel="Pie — black ownership > 50%"             data={metrics?.hdi        || {}} />
          <SMEsByRevenue />
        </div>
      )}

      {sub === "support" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <HBarFromObj title="SMEs by Support Focus (#)"           subLabel="Horizontal bar — support type requested"    data={metrics?.supportFocus  || {}} />
          <HBarFromObj title="SMEs by Services Requested (#)"      subLabel="Horizontal bar — services type requested"   data={metrics?.servicesFocus || {}} />
          <HBarFromObj title="SMEs by Funding Instrument (#)"      subLabel="Horizontal bar — instrument type from profile" data={metrics?.fundingType || {}} />
          <FundingAllocationBySector />
          <AverageFundingPerSME />
        </div>
      )}
    </div>
  );
};

export default PortfolioHealth;