import React, { useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882", "#d4c4b0", "#a08060", "#6b4c2a", "#8a6340"];

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
    {footer && <div style={{ marginTop: "8px", padding: "7px 10px", background: B.offwhite, borderRadius: "6px", flexShrink: 0 }}>{footer}</div>}
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
const placeholderMetrics = {
  totalSMEs: 45,
  headcount: { "1-5": 12, "6-20": 18, "21-50": 10, "51-200": 4, "200+": 1 },
  lifecycle: { "Startup": 15, "Growth": 22, "Expansion": 6, "Mature": 2 },
  geography: { "Gauteng": 20, "Western Cape": 12, "KZN": 6, "Eastern Cape": 4, "Other": 3 },
  sector: { "Fintech": 10, "Healthtech": 8, "Agritech": 7, "Edtech": 6, "Logistics": 5, "Clean Energy": 4, "Other": 5 },
  gender: { "Male": 58, "Female": 38, "Prefer not to say": 4 },
  disability: { "No disability": 92, "Disability": 5, "Prefer not to say": 3 },
  youth: { "Youth (<35)": 45, "Non-youth": 55 },
  hdi: { "HDI >50%": 62, "HDI <50%": 38 },
  revenue: { 
    buckets: { "<R1M": 8, "R1-5M": 15, "R5-10M": 12, "R10-20M": 6, "R20M+": 4 },
    perSME: [
      { name: "TechSolve", revenue: 18500000 },
      { name: "GreenEnergy", revenue: 12200000 },
      { name: "HealthPlus", revenue: 8900000 },
    ]
  },
  fundingType: { "Equity": 25, "Grant": 12, "Debt": 8, "Skills Training": 5 },
  funding: { bySector: { "Fintech": 45000000, "Healthtech": 32000000, "Agritech": 28000000 }, avg: 2800000, total: 126000000 },
  supportFocus: { "Strategic Guidance": 28, "Networks/Access": 22, "Financial Advisory": 18, "Legal Support": 12, "Marketing": 10 },
  servicesFocus: { "Business Planning": 25, "Financial Modelling": 20, "Legal Compliance": 15, "Marketing Strategy": 12, "Tech Support": 8 }
};

const SmartChart = ({ data, datasetLabel = "# SMEs", valCb, integralOnly = true }) => {
  const sorted = Object.entries(data).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([k]) => k);
  const values = sorted.map(([, v]) => v);

  if (values.length === 0) return <EmptyState />;

  if (labels.length > 5) {
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

  return (
    <div style={{ height: CHART_HEIGHT }}>
      <Pie options={pieOpts} data={{ labels, datasets: [{ data: values, backgroundColor: C.slice(0, labels.length), borderWidth: 2, borderColor: "#fff" }] }} />
    </div>
  );
};

const SmartCard = ({ title, data, datasetLabel, valCb, integralOnly }) => (
  <Card title={title}>
    <SmartChart data={data} datasetLabel={datasetLabel} valCb={valCb} integralOnly={integralOnly} />
  </Card>
);

const HBarCard = ({ title, data, valCb, integralOnly = true, datasetLabel = "# SMEs", footer }) => {
  const sorted = Object.entries(data).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([k]) => k);
  const values = sorted.map(([, v]) => v);
  const innerH = Math.max(parseInt(CHART_HEIGHT), labels.length * 36);
  return (
    <Card title={title} footer={footer}>
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

const TotalSMEsCount = () => {
  const ACTUAL = placeholderMetrics.totalSMEs;
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

const SMEsByRevenue = () => {
  const [view, setView] = useState("pie");
  const buckets = placeholderMetrics.revenue.buckets;
  const perSME = placeholderMetrics.revenue.perSME;
  const labels = Object.keys(buckets).filter(k => buckets[k] > 0);
  const values = labels.map(k => buckets[k]);
  const hasData = values.length > 0;

  return (
    <Card title="SMEs by Revenue">
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexShrink: 0 }}>
        <Pill label="Distribution" active={view === "pie"} onClick={() => setView("pie")} />
        <Pill label="Per SME" active={view === "bar"} onClick={() => setView("bar")} />
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

const FundingAllocationBySector = () => {
  const bySector = placeholderMetrics.funding.bySector;
  return (
    <HBarCard
      title="Funding Required by Sector (R)"
      data={bySector}
      valCb={v => "R" + (v / 1_000_000).toFixed(1) + "M"}
      datasetLabel="Funding Required (R)"
    />
  );
};

const AverageFundingPerSME = () => {
  const avg = placeholderMetrics.funding.avg;
  const total = placeholderMetrics.funding.total;
  const n = placeholderMetrics.totalSMEs;
  const perSME = placeholderMetrics.revenue.perSME.map(s => ({ ...s, fundingRequired: s.revenue * 0.3 }));

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
      data={data}
      valCb={v => "R" + (v / 1_000_000).toFixed(1) + "M"}
      datasetLabel="Funding Required (R)"
      footer={footer}
    />
  );
};

const normalizeFundingData = (raw) => raw;

const SUBS = [
  { id: "composition", label: "Portfolio Composition" },
  { id: "demographics", label: "Beneficiary Demographics" },
  { id: "support", label: "Support Focus" },
];

const PortfolioHealth = () => {
  const [sub, setSub] = useState("composition");

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {SUBS.map(s => <Pill key={s.id} label={s.label} active={sub === s.id} onClick={() => setSub(s.id)} />)}
      </div>

      {sub === "composition" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <TotalSMEsCount />
          <SmartCard title="SMEs by Headcount" data={placeholderMetrics.headcount} />
          <SmartCard title="SMEs by Business Lifecycle Stage" data={placeholderMetrics.lifecycle} />
          <SmartCard title="SMEs by Geography" data={placeholderMetrics.geography} />
          <SmartCard title="SMEs by Sector" data={placeholderMetrics.sector} />
        </div>
      )}

      {sub === "demographics" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <SmartCard title="SMEs by Gender" data={placeholderMetrics.gender} />
          <SmartCard title="SMEs by Disability Status" data={placeholderMetrics.disability} />
          <SmartCard title="SMEs by Youth Status" data={placeholderMetrics.youth} />
          <SmartCard title="SMEs by HDI Ownership" data={placeholderMetrics.hdi} />
          <SMEsByRevenue />
        </div>
      )}

      {sub === "support" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
            <HBarCard title="SMEs by Funding Instrument" data={normalizeFundingData(placeholderMetrics.fundingType)} />
            <FundingAllocationBySector />
            <AverageFundingPerSME />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px", marginTop: "20px" }}>
            <HBarCard title="SMEs by Support Focus" data={placeholderMetrics.supportFocus} />
            <HBarCard title="SMEs by Services Requested" data={placeholderMetrics.servicesFocus} />
          </div>
        </>
      )}
    </div>
  );
};

export default PortfolioHealth;