import React, { useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";
import { data } from "autoprefixer";
import { color } from "framer-motion";
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882", "#d4c4b0", "#a08060", "#6b4c2a", "#8a6340"];

// Horizontal bar options
// valCb        – optional tick formatter for the value (x) axis
// integralOnly – only show integer ticks on the value axis
const hBarOpts = (valCb, integralOnly) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  indexAxis: "y",
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 11 }, boxWidth: 12 } }, datalabels: { display: false } },
  scales: {
    x: {
      beginAtZero: true,
      grid: { display: true, color: B.offwhite },
      ticks: {
        color: B.dark, font: { size: 11 },
        ...(valCb ? { callback: valCb } : {}),
        ...(integralOnly && !valCb ? { callback: v => Number.isInteger(v) ? v : "", precision: 0, stepSize: 1 } : {}),
      },
    },
    y: { grid: { display: false }, ticks: { color: B.dark, font: { size: 11 } } },
  },
});

// Vertical bar options (used only for the SMEsByRevenue "Per SME" toggle)
const vBarOpts = (yCb) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  indexAxis: "x",
  plugins: { legend: { display: false }, datalabels: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: B.dark, font: { size: 11 } } },
    y: { beginAtZero: true, grid: { color: B.offwhite }, ticks: { color: B.dark, ...(yCb ? { callback: yCb } : {}) } },
  },
});

const pieOpts = { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 11 }, boxWidth: 12 } }, datalabels: { color: B.offwhite } } };

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

// Pie chart from a plain {label: count} object — unchanged
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

// Horizontal bar from {label: value} object — always sorted highest → lowest
const HBarFromObj = ({ title, subLabel, data, valCb, integralOnly = true, datasetLabel = "# SMEs" }) => {
  const sorted = Object.entries(data).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([k]) => k);
  const values = sorted.map(([, v]) => v);
  const minH = Math.max(200, labels.length * 40);
  return (
    <Card title={title} subLabel={subLabel}>
      {values.length > 0
        ? <div style={{ flex: 1, minHeight: `${minH}px` }}>
            <Bar options={hBarOpts(valCb, integralOnly)} data={{ labels, datasets: [{ label: datasetLabel, data: values, backgroundColor: C[2] }] }} />
          </div>
        : <EmptyState />}
    </Card>
  );
};

// ── Funding instrument key normaliser ────────────────────────────────────────
// Collapses case/plural variants → 4 canonical lowercase keys
const normalizeFundingKey = k => {
  const s = k.toLowerCase().trim();
  if (s === "equity")                                     return "equity";
  if (s === "grant" || s === "grants")                    return "grant";
  if (s === "debt")                                       return "debt";
  if (s === "skills training" || s === "skills_training") return "skills_training";
  return s.replace(/\s+/g, "_");
};

const normalizeFundingData = raw =>
  Object.entries(raw).reduce((acc, [k, v]) => {
    const key = normalizeFundingKey(k);
    acc[key] = (acc[key] || 0) + v;
    return acc;
  }, {});

// ── Composition ──────────────────────────────────────────────────────────────
const TotalSMEsCount = () => {
  const { metrics } = usePortfolio();
  const ACTUAL = metrics?.totalSMEs || 0;
  const TARGET = 50;
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

// Revenue: Distribution pie + Per-SME vertical bar (sorted, millions, no legend labels)
const SMEsByRevenue = () => {
  const { metrics } = usePortfolio();
  const [view, setView] = useState("pie");
  const buckets = metrics?.revenue?.buckets || {};
  // Sort per-SME by revenue highest → lowest for the bar view
  const perSME = [...(metrics?.revenue?.perSME || [])].sort((a, b) => b.revenue - a.revenue);
  const labels  = Object.keys(buckets).filter(k => buckets[k] > 0);
  const values  = labels.map(k => buckets[k]);
  const hasData = values.length > 0;

  return (
    <Card title="SMEs by Revenue (#)" subLabel={view === "pie" ? "Distribution by revenue band" : "Revenue per SME (R)"}>
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
        <Pill label="Distribution" active={view === "pie"} onClick={() => setView("pie")} />
        <Pill label="Per SME"      active={view === "bar"} onClick={() => setView("bar")} />
      </div>
      {hasData ? (
        <div style={{ flex: 1, minHeight: "200px" }}>
          {view === "pie"
            ? <Pie options={pieOpts} data={{ labels, datasets: [{ data: values, backgroundColor: C.slice(0, labels.length), borderWidth: 2, borderColor: "#fff" }] }} />
            : <Bar
                options={vBarOpts(v => "R" + (v / 1_000_000).toFixed(1) + "M")}
                data={{ labels: perSME.map(s => s.name), datasets: [{ data: perSME.map(s => s.revenue), backgroundColor: C[2] }] }}
              />}
        </div>
      ) : <EmptyState />}
    </Card>
  );
};

// ── Support Focus ─────────────────────────────────────────────────────────────
// Funding by Sector — horizontal bar, sorted highest → lowest
const FundingAllocationBySector = () => {
  const { metrics } = usePortfolio();
  const bySector = metrics?.funding?.bySector || {};
  const sorted   = Object.entries(bySector).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const labels   = sorted.map(([k]) => k);
  const values   = sorted.map(([, v]) => v);
  const minH     = Math.max(200, labels.length * 40);
  return (
    <Card title="Funding Required by Sector (R)" subLabel="Horizontal bar — total funding requested per sector">
      {values.length > 0
        ? <div style={{ flex: 1, minHeight: `${minH}px` }}>
            <Bar options={hBarOpts(v => "R" + (v / 1_000_000).toFixed(1) + "M")} data={{ labels, datasets: [{ label: "Funding Required (R)", data: values, backgroundColor: C[2] }] }} />
          </div>
        : <EmptyState />}
    </Card>
  );
};

// Funding per SME — horizontal bar, sorted highest → lowest
const AverageFundingPerSME = () => {
  const { metrics } = usePortfolio();
  const avg   = metrics?.funding?.avg   || 0;
  const total = metrics?.funding?.total || 0;
  const n     = metrics?.totalSMEs      || 0;
  const perSME = [...(metrics?.revenue?.perSME || [])]
    .filter(s => s.fundingRequired > 0)
    .sort((a, b) => b.fundingRequired - a.fundingRequired);
  const minH = Math.max(220, perSME.length * 40);

  return (
    <Card title="Funding Required per SME" subLabel="Horizontal bar — individual SME funding needs">
      {perSME.length > 0 ? (
        <>
          <div style={{ flex: 1, minHeight: `${minH}px` }}>
            <Bar
              options={hBarOpts(v => "R" + (v / 1_000_000).toFixed(1) + "M")}
              data={{ labels: perSME.map(s => s.name), datasets: [{ label: "Funding Required (R)", data: perSME.map(s => s.fundingRequired), backgroundColor: C[1] }] }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", padding: "8px 12px", background: B.offwhite, borderRadius: "6px" }}>
            <span style={{ fontSize: "12px", color: B.dark, fontWeight: 600 }}>Portfolio Avg: <strong>R{(avg / 1_000_000).toFixed(1)}M</strong></span>
            <span style={{ fontSize: "12px", color: B.warm }}>Total: R{(total / 1_000_000).toFixed(1)}M across {n} SMEs</span>
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
          <PieFromObj title="SMEs by Headcount (#)"                subLabel="Pie chart — employee count bands"   data={metrics?.headcount || {}} />
          {/* Sector converted from pie → sorted horizontal bar with integral x-axis */}
          <HBarFromObj title="SMEs by Sector (#)"                  subLabel="Horizontal bar — economic sector"   data={metrics?.sector    || {}} />
          <PieFromObj title="SMEs by Business Lifecycle Stage (#)" subLabel="Pie chart — operational stage"      data={metrics?.lifecycle  || {}} />
          <PieFromObj title="SMEs by Geography (#)"                subLabel="Pie chart — province / location"   data={metrics?.geography  || {}} />
        </div>
      )}

      {sub === "demographics" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <PieFromObj title="SMEs by Gender (#)"            subLabel="Pie — shareholder gender breakdown"         data={metrics?.gender     || {}} />
          <PieFromObj title="SMEs by Disability Status (#)" subLabel="Pie — disability disclosed by shareholders" data={metrics?.disability || {}} />
          <PieFromObj title="SMEs by Youth Status (#)"      subLabel="Pie — youth shareholders"                  data={metrics?.youth      || {}} />
          <PieFromObj title="SMEs by HDI Ownership (#)"     subLabel="Pie — black ownership > 50%"               data={metrics?.hdi        || {}} />
          <SMEsByRevenue />
        </div>
      )}

      {sub === "support" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <HBarFromObj title="SMEs by Support Focus (#)"      subLabel="Horizontal bar — support type requested"       data={metrics?.supportFocus  || {}} />
          <HBarFromObj title="SMEs by Services Requested (#)" subLabel="Horizontal bar — services type requested"      data={metrics?.servicesFocus || {}} />
          {/* Normalise key casing/plurals first → guaranteed 4 canonical instruments */}
          <HBarFromObj
            title="SMEs by Funding Instrument (#)"
            subLabel="Horizontal bar — instrument type from profile"
            data={normalizeFundingData(metrics?.fundingType || {})}
          />
          <FundingAllocationBySector />
          <AverageFundingPerSME />
        </div>
      )}
    </div>
  );
};

export default PortfolioHealth;