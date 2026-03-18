import React, { useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882", "#d4c4b0", "#a08060", "#6b4c2a", "#8a6340"];

// ── Chart options ─────────────────────────────────────────────────────────────

// Horizontal bar — value (x) axis can take an optional formatter; integral mode
// suppresses decimal ticks (for count data).
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
        ...(integralOnly && !valCb
          ? { callback: v => Number.isInteger(v) ? v : "", precision: 0, stepSize: 1 }
          : {}),
      },
    },
    y: { grid: { display: false }, ticks: { color: B.dark, font: { size: 11 } } },
  },
});

// Vertical bar — used for the SMEsByRevenue "Per SME" sub-view
const vBarOpts = (yCb) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  indexAxis: "x",
  plugins: { legend: { display: false }, datalabels: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: B.dark, font: { size: 10 } } },
    y: { beginAtZero: true, grid: { color: B.offwhite }, ticks: { color: B.dark, ...(yCb ? { callback: yCb } : {}) } },
  },
});

const pieOpts = {
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 11 }, boxWidth: 12 } }, datalabels: { color: B.offwhite, font: { size: 20 } } },
};

// ── Layout constants ──────────────────────────────────────────────────────────
// All cards share the same fixed height; all chart areas share the same height
// so nothing looks bigger or smaller than its neighbours.
const CARD_HEIGHT   = "400px";
const CHART_HEIGHT  = "260px"; // chart area inside the card

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
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
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

const EmptyState = () => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.light, fontSize: "12px", fontStyle: "italic" }}>
    No data yet
  </div>
);

// ── Smart chart component ─────────────────────────────────────────────────────
// Renders as Pie if ≤5 slices, otherwise as a horizontal bar (sorted desc).
// Props:
//   data         – { label: value } plain object
//   datasetLabel – legend label for hbar mode
//   valCb        – optional x-axis tick formatter (hbar mode only)
//   integralOnly – suppress decimal ticks (hbar mode, default true)
const SmartChart = ({ data, datasetLabel = "# SMEs", valCb, integralOnly = true }) => {
  const sorted = Object.entries(data).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([k]) => k);
  const values = sorted.map(([, v]) => v);

  if (values.length === 0) return <EmptyState />;

  if (labels.length > 5) {
    // Horizontal bar — height scales with row count but is capped at CHART_HEIGHT
    const minH = Math.max(parseInt(CHART_HEIGHT), labels.length * 36);
    return (
      <div style={{ flex: 1, height: `${minH}px`, overflowY: "auto" }}>
        <div style={{ height: `${minH}px` }}>
          <Bar
            options={hBarOpts(valCb, integralOnly)}
            data={{ labels, datasets: [{ label: datasetLabel, data: values, backgroundColor: C.slice(0, labels.length) }] }}
          />
        </div>
      </div>
    );
  }

  // Pie — fixed height wrapper so all pies are the same size
  return (
    <div style={{ height: CHART_HEIGHT }}>
      <Pie options={pieOpts} data={{ labels, datasets: [{ data: values, backgroundColor: C.slice(0, labels.length), borderWidth: 2, borderColor: "#fff" }] }} />
    </div>
  );
};

// Convenience wrapper: Card + SmartChart
const SmartCard = ({ title, subLabel, data, datasetLabel, valCb, integralOnly }) => (
  <Card title={title} subLabel={subLabel}>
    <SmartChart data={data} datasetLabel={datasetLabel} valCb={valCb} integralOnly={integralOnly} />
  </Card>
);

// Always-horizontal bar card (for Support Focus section where hbar is explicit)
const HBarCard = ({ title, subLabel, data, valCb, integralOnly = true, datasetLabel = "# SMEs", footer }) => {
  const sorted = Object.entries(data).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([k]) => k);
  const values = sorted.map(([, v]) => v);
  const innerH = Math.max(parseInt(CHART_HEIGHT), labels.length * 36);
  return (
    <Card title={title} subLabel={subLabel} footer={footer}>
      {values.length > 0 ? (
        <div style={{ flex: 1, overflowY: labels.length > 7 ? "auto" : "visible" }}>
          <div style={{ height: `${innerH}px` }}>
            <Bar options={hBarOpts(valCb, integralOnly)} data={{ labels, datasets: [{ label: datasetLabel, data: values, backgroundColor: C[2] }] }} />
          </div>
        </div>
      ) : <EmptyState />}
    </Card>
  );
};

// ── Funding instrument normaliser ─────────────────────────────────────────────
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
  const { portfolioMetrics } = usePortfolio();
  const ACTUAL = portfolioMetrics?.totalSMEs || 0;
  const TARGET = 50;
  const R = 54, CIRC = 2 * Math.PI * R;
  const offset = CIRC - (CIRC * Math.min(ACTUAL, TARGET)) / TARGET;
  return (
    <Card title="Total Number of SMEs">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <svg width="260" height="260" viewBox="0 0 160 160">
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

// Revenue: Distribution pie (≤5 → pie, >5 → hbar) + Per-SME vertical bar
const SMEsByRevenue = () => {
  const { portfolioMetrics } = usePortfolio();
  const [view, setView] = useState("pie");
  const buckets = portfolioMetrics?.revenue?.buckets || {};
  const perSME  = [...(portfolioMetrics?.revenue?.perSME || [])].sort((a, b) => b.revenue - a.revenue);
  const labels  = Object.keys(buckets).filter(k => buckets[k] > 0);
  const values  = labels.map(k => buckets[k]);
  const hasData = values.length > 0;

  return (
    <Card title="SMEs by Revenue (#)" subLabel={view === "pie" ? "Distribution by revenue band" : "Revenue per SME (R)"}>
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <Pill label="Distribution" active={view === "pie"} onClick={() => setView("pie")} />
        <Pill label="Per SME"      active={view === "bar"} onClick={() => setView("bar")} />
      </div>
      {hasData ? (
        <div style={{ height: CHART_HEIGHT }}>
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
const FundingAllocationBySector = () => {
  const { portfolioMetrics } = usePortfolio();
  const bySector = portfolioMetrics?.funding?.bySector || {};
  return (
    <HBarCard
      title="Funding Required by Sector (R)"
      subLabel="Horizontal bar — total funding requested per sector"
      data={bySector}
      valCb={v => "R" + (v / 1_000_000).toFixed(1) + "M"}
      datasetLabel="Funding Required (R)"
    />
  );
};

const AverageFundingPerSME = () => {
  const { portfolioMetrics } = usePortfolio();
  const avg   = portfolioMetrics?.funding?.avg   || 0;
  const total = portfolioMetrics?.funding?.total || 0;
  const n     = portfolioMetrics?.totalSMEs      || 0;
  const perSME = [...(portfolioMetrics?.revenue?.perSME || [])]
    .filter(s => s.fundingRequired > 0)
    .sort((a, b) => b.fundingRequired - a.fundingRequired);

  const footer = (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: "12px", color: B.dark, fontWeight: 600 }}>
        Avg: <strong>R{(avg / 1_000_000).toFixed(1)}M</strong>
      </span>
      <span style={{ fontSize: "12px", color: B.warm }}>
        Total: R{(total / 1_000_000).toFixed(1)}M across {n} SMEs
      </span>
    </div>
  );

  const data = perSME.reduce((acc, s) => { acc[s.name] = s.fundingRequired; return acc; }, {});

  return (
    <HBarCard
      title="Funding Required per SME"
      subLabel="Horizontal bar — individual SME funding needs"
      data={data}
      valCb={v => "R" + (v / 1_000_000).toFixed(1) + "M"}
      datasetLabel="Funding Required (R)"
      footer={footer}
    />
  );
};

// ── Tab navigation ────────────────────────────────────────────────────────────
const SUBS = [
  { id: "composition",  label: "Portfolio Composition" },
  { id: "demographics", label: "Beneficiary Demographics" },
  { id: "support",      label: "Support Focus" },
];

const PortfolioHealth = () => {
  const [sub, setSub] = useState("composition");
  const { portfolioMetrics, loading } = usePortfolio();

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: B.warm }}>Loading portfolio data…</div>;

  if (!portfolioMetrics || portfolioMetrics.totalSMEs === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: B.warm, fontStyle: "italic" }}>
        No SMEs with "Active Support" or "Support Approved" status yet.
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {SUBS.map(s => <Pill key={s.id} label={s.label} active={sub === s.id} onClick={() => setSub(s.id)} />)}
      </div>

      {sub === "composition" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <TotalSMEsCount />

          {/* Headcount: descriptive labels already set in usePortfolioData (e.g. "6–20 employees") */}
          <SmartCard
            title="SMEs by Headcount (#)"
            subLabel="Employee count bands — smart chart (pie ≤5 slices, hbar if more)"
            data={portfolioMetrics?.headcount || {}}
          />

          {/* Sector: likely >5 → auto hbar */}
          <SmartCard
            title="SMEs by Sector (#)"
            subLabel="Economic sector — smart chart (pie ≤5, hbar if more)"
            data={portfolioMetrics?.sector || {}}
          />

          <SmartCard
            title="SMEs by Business Lifecycle Stage (#)"
            subLabel="Operational stage — smart chart (pie ≤5, hbar if more)"
            data={portfolioMetrics?.lifecycle || {}}
          />

          {/* Geography: likely >5 provinces → auto hbar */}
          <SmartCard
            title="SMEs by Geography (#)"
            subLabel="Province / location — smart chart (pie ≤5, hbar if more)"
            data={portfolioMetrics?.geography || {}}
          />
        </div>
      )}

      {sub === "demographics" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <SmartCard title="SMEs by Gender (#)"            subLabel="Shareholder gender breakdown"          data={portfolioMetrics?.gender     || {}} />
          <SmartCard title="SMEs by Disability Status (#)" subLabel="Disability disclosed by shareholders"  data={portfolioMetrics?.disability || {}} />
          <SmartCard title="SMEs by Youth Status (#)"      subLabel="Youth shareholders"                   data={portfolioMetrics?.youth      || {}} />
          <SmartCard title="SMEs by HDI Ownership (#)"     subLabel="Black ownership > 50%"                data={portfolioMetrics?.hdi        || {}} />
          <SMEsByRevenue />
        </div>
      )}

      {sub === "support" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <HBarCard
            title="SMEs by Support Focus (#)"
            subLabel="Support type requested"
            data={portfolioMetrics?.supportFocus  || {}}
          />
          <HBarCard
            title="SMEs by Services Requested (#)"
            subLabel="Services type requested"
            data={portfolioMetrics?.servicesFocus || {}}
          />
          {/* Normalise funding instrument keys → 4 canonical values */}
          <HBarCard
            title="SMEs by Funding Instrument (#)"
            subLabel="Instrument type from profile (equity / grant / debt / skills_training)"
            data={normalizeFundingData(portfolioMetrics?.fundingType || {})}
          />
          <FundingAllocationBySector />
          <AverageFundingPerSME />
        </div>
      )}
    </div>
  );
};

export default PortfolioHealth;