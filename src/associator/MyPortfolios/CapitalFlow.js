import React, { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const B = {
  black: "#1a1a1a",
  darkGrey: "#4a4a4a",
  mediumGrey: "#7a7a7a",
  warmGrey: "#9e9e9e",
  lightGrey: "#c4c4c4",
  cream: "#f5f0e8",
  offwhite: "#faf8f5",
  brownDark: "#5c3d2e",
  brownMedium: "#8b694e",
  brownLight: "#b8957a",
  brownPale: "#d4bca8",
  white: "#ffffff",
};

const MIXED_COLORS = [
  "#5c3d2e",
  "#4a4a4a",
  "#8b694e",
  "#7a7a7a",
  "#b8957a",
  "#c4c4c4",
  "#d4bca8",
  "#9e9e9e",
  "#3d2a1f",
  "#e0d6c8",
];

// No legend, no data labels — purely tooltips on hover
const doughnutOpts = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`,
      },
    },
  },
};

// Manual HTML legend — always dark text, always visible
const ManualLegend = ({ labels, colors, values }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: "10px" }}>
    {labels.map((label, i) => (
      <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: colors[i % colors.length], flexShrink: 0 }} />
        <span style={{ fontSize: "11px", color: B.darkGrey, fontWeight: 500 }}>
          {label}{values ? ` (${values[i]}%)` : ""}
        </span>
      </div>
    ))}
  </div>
);

const SubTab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "6px 16px",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "12px",
      border: `1.5px solid ${active ? B.brownMedium : B.lightGrey}`,
      fontWeight: active ? 700 : 500,
      background: active ? B.brownMedium : "#fff",
      color: active ? "#fff" : B.darkGrey,
    }}
  >
    {label}
  </button>
);

const Card = ({ title, children, footer }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: "10px",
      padding: "20px",
      minHeight: "400px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      border: `1px solid ${B.lightGrey}`,
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "10px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.black, margin: 0 }}>{title}</h3>
    </div>
    <div style={{ flex: 1 }}>{children}</div>
    {footer && (
      <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: `1px solid ${B.offwhite}`, fontSize: "11px", color: B.warmGrey }}>
        {footer}
      </div>
    )}
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "4px 12px",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "10px",
      border: `1.5px solid ${active ? B.brownMedium : B.lightGrey}`,
      fontWeight: active ? 700 : 500,
      background: active ? B.brownMedium : "#fff",
      color: active ? "#fff" : B.darkGrey,
    }}
  >
    {label}
  </button>
);

const TrendIcon = ({ growth }) => (
  <span style={{ color: growth >= 0 ? "#2e7d32" : "#c62828", fontSize: "11px", marginLeft: "6px" }}>
    {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}%
  </span>
);

const hBarOpts = () => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  indexAxis: "y",
  plugins: { legend: { display: false } },
  scales: {
    x: {
      beginAtZero: true,
      grid: { display: true, color: B.lightGrey },
      ticks: { color: B.darkGrey, font: { size: 9 } },
    },
    y: {
      grid: { display: false },
      ticks: { color: B.darkGrey, font: { size: 10 } },
    },
  },
});

// Stacked bar trend — same design as original Sector Concentration trend
const TrendChart = ({ trendData, colors }) => {
  const keys = Object.keys(trendData).filter((k) => k !== "years");
  const datasets = keys.map((key, i) => ({
    label: key,
    data: trendData[key],
    backgroundColor: colors[i % colors.length],
  }));

  return (
    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${B.offwhite}` }}>
      {/* Manual legend for trend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginBottom: "8px" }}>
        {keys.map((key, i) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: colors[i % colors.length], flexShrink: 0 }} />
            <span style={{ fontSize: "10px", color: B.darkGrey, fontWeight: 500 }}>{key}</span>
          </div>
        ))}
      </div>
      <div style={{ height: "140px" }}>
        <Bar
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                stacked: true,
                ticks: { color: B.darkGrey, font: { size: 8 } },
                grid: { display: false },
              },
              y: {
                stacked: true,
                beginAtZero: true,
                grid: { color: B.lightGrey },
                ticks: { color: B.darkGrey, font: { size: 8 }, callback: (v) => v.toLocaleString() },
              },
            },
          }}
          data={{ labels: trendData.years, datasets }}
        />
      </div>
    </div>
  );
};

const ViewTrendButton = ({ show, onClick }) => (
  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
    <button
      onClick={onClick}
      style={{
        padding: "4px 12px",
        borderRadius: "20px",
        cursor: "pointer",
        fontSize: "10px",
        border: `1.5px solid ${show ? B.brownDark : B.lightGrey}`,
        fontWeight: show ? 700 : 500,
        background: show ? B.brownDark : "#fff",
        color: show ? "#fff" : B.darkGrey,
      }}
    >
      {show ? "Hide Trend ▲" : "View Trend ▼"}
    </button>
  </div>
);

// ─── Capital Deployment ───────────────────────────────────────────────────────
const CapitalDeployment = () => {
  const { marketPulse } = usePortfolio();
  const [showSourceTrend, setShowSourceTrend] = useState(false);
  const [showPurposeTrend, setShowPurposeTrend] = useState(false);

  const avgFundSize = marketPulse?.capitalFlow?.fundraising?.avgFundSize || { current: 45, yoyGrowth: 12.5 };
  const fundsVsDeployed = marketPulse?.capitalFlow?.fundraising?.fundsVsDeployed || {
    years: ["2022", "2023", "2024", "2025"],
    raised: [240, 280, 320, 360],
    requested: [300, 350, 400, 450],
    deployed: [280, 310, 385, 410],
  };
  const sources = marketPulse?.capitalFlow?.fundraising?.sources || {
    "Entities/Individuals": 35, Corporates: 28, DFIs: 22, "Fund of Funds": 15,
  };
  const purposes = marketPulse?.capitalFlow?.fundraising?.purposes || {
    "Own ring-fenced": 40, "Own balance sheet": 25, "Deal by deal": 35,
  };
  const sourceTrends = marketPulse?.capitalFlow?.fundraising?.sourceTrends || {
    years: ["2022", "2023", "2024", "2025"],
    "Entities/Individuals": [28, 31, 33, 35],
    Corporates: [22, 25, 27, 28],
    DFIs: [18, 20, 21, 22],
    "Fund of Funds": [12, 13, 14, 15],
  };
  const purposeTrends = marketPulse?.capitalFlow?.fundraising?.purposeTrends || {
    years: ["2022", "2023", "2024", "2025"],
    "Own ring-fenced": [32, 36, 38, 40],
    "Own balance sheet": [22, 23, 24, 25],
    "Deal by deal": [30, 32, 33, 35],
  };
  const rejectionData = marketPulse?.capitalFlow?.fundraising?.rejection || {
    totalReviewed: 520,
    totalRejected: 312,
    rejectionRate: 60,
    topReasons: {
      "Poor financials": 38, "Weak team": 25, "Market too small": 18, "No traction": 12, Other: 7,
    },
  };

  const sourceLabels = Object.keys(sources);
  const sourceValues = Object.values(sources);
  const purposeLabels = Object.keys(purposes);
  const purposeValues = Object.values(purposes);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Row 1: Sources, Purpose, Avg Fund Size */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        <Card title="Sources of Funds Raised">
          <div style={{ height: "200px" }}>
            <Doughnut
              options={doughnutOpts}
              data={{ labels: sourceLabels, datasets: [{ data: sourceValues, backgroundColor: MIXED_COLORS }] }}
            />
          </div>
          <ManualLegend labels={sourceLabels} colors={MIXED_COLORS} values={sourceValues} />
          <ViewTrendButton show={showSourceTrend} onClick={() => setShowSourceTrend((p) => !p)} />
          {showSourceTrend && <TrendChart trendData={sourceTrends} colors={MIXED_COLORS} />}
        </Card>

        <Card title="Purpose of Funds Raised">
          <div style={{ height: "200px" }}>
            <Doughnut
              options={doughnutOpts}
              data={{ labels: purposeLabels, datasets: [{ data: purposeValues, backgroundColor: MIXED_COLORS.slice(3) }] }}
            />
          </div>
          <ManualLegend labels={purposeLabels} colors={MIXED_COLORS.slice(3)} values={purposeValues} />
          <ViewTrendButton show={showPurposeTrend} onClick={() => setShowPurposeTrend((p) => !p)} />
          {showPurposeTrend && <TrendChart trendData={purposeTrends} colors={MIXED_COLORS.slice(3)} />}
        </Card>

        <Card title="Average Fund Size (ZAR M)">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <div style={{ fontSize: "44px", fontWeight: "800", color: B.black }}>R {avgFundSize.current}M</div>
            <div style={{ fontSize: "12px", color: B.mediumGrey, marginTop: "8px" }}>
              YoY Growth <TrendIcon growth={avgFundSize.yoyGrowth} />
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Funds chart + table | Rejection Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
        <Card title="Funds Raised vs Funds Requested vs Capital Deployed">
          <div style={{ height: "260px" }}>
            <Bar
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    title: { display: true, text: "Year", color: B.darkGrey, font: { size: 11 } },
                    ticks: { font: { size: 10 }, color: B.darkGrey },
                  },
                  y: {
                    beginAtZero: true,
                    grid: { color: B.lightGrey },
                    ticks: { callback: (v) => `R${v}M`, font: { size: 10 }, color: B.darkGrey },
                    title: { display: true, text: "Amount (ZAR M)", color: B.darkGrey, font: { size: 11 } },
                  },
                },
              }}
              data={{
                labels: fundsVsDeployed.years,
                datasets: [
                  { label: "Funds Raised", data: fundsVsDeployed.raised, backgroundColor: MIXED_COLORS[2] },
                  { label: "Funds Requested", data: fundsVsDeployed.requested, backgroundColor: MIXED_COLORS[4] },
                  { label: "Capital Deployed", data: fundsVsDeployed.deployed, backgroundColor: MIXED_COLORS[6] },
                ],
              }}
            />
          </div>
          {/* Manual legend for bar */}
          <div style={{ display: "flex", gap: "14px", marginTop: "8px", marginBottom: "12px" }}>
            {[
              { label: "Funds Raised", color: MIXED_COLORS[2] },
              { label: "Funds Requested", color: MIXED_COLORS[4] },
              { label: "Capital Deployed", color: MIXED_COLORS[6] },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: "11px", color: B.darkGrey, fontWeight: 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
          {/* Summary table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${B.lightGrey}` }}>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: B.darkGrey, fontWeight: 700 }}>Year</th>
                  {fundsVsDeployed.years.map((y) => (
                    <th key={y} style={{ padding: "6px 8px", textAlign: "right", color: B.darkGrey, fontWeight: 700 }}>{y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Raised (RM)", key: "raised" },
                  { label: "Requested (RM)", key: "requested" },
                  { label: "Deployed (RM)", key: "deployed" },
                ].map((row, i) => (
                  <tr key={row.key} style={{ background: i % 2 === 0 ? B.offwhite : "#fff" }}>
                    <td style={{ padding: "5px 8px", color: B.darkGrey, fontWeight: 600 }}>{row.label}</td>
                    {fundsVsDeployed[row.key].map((val, j) => (
                      <td key={j} style={{ padding: "5px 8px", textAlign: "right", color: B.black }}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Deal Rejection Summary">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {[
                { label: "Total Reviewed", value: rejectionData.totalReviewed },
                { label: "Total Rejected", value: rejectionData.totalRejected },
                { label: "Rejection Rate", value: `${rejectionData.rejectionRate}%` },
              ].map((stat) => (
                <div key={stat.label} style={{ background: B.offwhite, borderRadius: "8px", padding: "10px", textAlign: "center", border: `1px solid ${B.lightGrey}` }}>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: B.brownDark }}>{stat.value}</div>
                  <div style={{ fontSize: "10px", color: B.mediumGrey, marginTop: "4px" }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: B.black }}>Top Rejection Reasons</div>
            <div style={{ height: "180px" }}>
              <Bar
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: false,
                  indexAxis: "y",
                  plugins: { legend: { display: false } },
                  scales: {
                    x: {
                      beginAtZero: true,
                      grid: { color: B.lightGrey },
                      ticks: { color: B.darkGrey, font: { size: 9 }, callback: (v) => `${v}%` },
                    },
                    y: {
                      grid: { display: false },
                      ticks: { color: B.darkGrey, font: { size: 9 } },
                    },
                  },
                }}
                data={{
                  labels: Object.keys(rejectionData.topReasons),
                  datasets: [{ data: Object.values(rejectionData.topReasons), backgroundColor: MIXED_COLORS }],
                }}
              />
            </div>
            <div style={{ fontSize: "10px", color: B.warmGrey, paddingTop: "8px", borderTop: `1px solid ${B.offwhite}` }}>
              {rejectionData.rejectionRate}% of reviewed deals were rejected — poor financials remain the leading cause at 38% of all rejections.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── Market Structure ─────────────────────────────────────────────────────────
const MarketStructure = () => {
  const { marketPulse } = usePortfolio();
  const [viewType, setViewType] = useState("zar");
  const [activeSubTab, setActiveSubTab] = useState("where-capital");
  const [trendVisible, setTrendVisible] = useState({});
  const toggleTrend = (key) => setTrendVisible((p) => ({ ...p, [key]: !p[key] }));

  const sectorAlloc = marketPulse?.marketStructure?.whereCapitalGoes?.sector?.allocation || { Fintech: 32, Healthtech: 18, Agritech: 15, Edtech: 12, Logistics: 10, "Clean Energy": 8, Others: 5 };
  const sectorDist = marketPulse?.marketStructure?.whereCapitalGoes?.sector?.distribution || { Fintech: 28, Healthtech: 16, Agritech: 14, Edtech: 13, Logistics: 11, "Clean Energy": 9, Others: 9 };
  const sectorTrends = marketPulse?.marketStructure?.whereCapitalGoes?.sector?.trends || { years: ["2022", "2023", "2024", "2025"], Fintech: [22, 26, 30, 32], Healthtech: [12, 14, 16, 18], Agritech: [10, 12, 14, 15] };

  const geoAlloc = marketPulse?.marketStructure?.whereCapitalGoes?.geo?.allocation || { Gauteng: 45, "Western Cape": 25, KZN: 15, "Eastern Cape": 8, Others: 7 };
  const geoDist = marketPulse?.marketStructure?.whereCapitalGoes?.geo?.distribution || { Gauteng: 42, "Western Cape": 24, KZN: 16, "Eastern Cape": 10, Others: 8 };
  const geoTrends = marketPulse?.marketStructure?.whereCapitalGoes?.geo?.trends || { years: ["2022", "2023", "2024", "2025"], Gauteng: [40, 42, 44, 45], "Western Cape": [22, 23, 24, 25], KZN: [13, 14, 15, 15] };

  const stageAlloc = marketPulse?.marketStructure?.whereCapitalGoes?.stage?.allocation || { "Pre-seed": 12, Seed: 28, "Series A": 35, "Series B": 18, "Series C+": 7 };
  const stageDist = marketPulse?.marketStructure?.whereCapitalGoes?.stage?.distribution || { "Pre-seed": 22, Seed: 32, "Series A": 28, "Series B": 12, "Series C+": 6 };
  const stageTrends = marketPulse?.marketStructure?.whereCapitalGoes?.stage?.trends || { years: ["2022", "2023", "2024", "2025"], "Pre-seed": [10, 11, 11, 12], Seed: [24, 26, 27, 28], "Series A": [30, 32, 34, 35] };

  const lifecycleAlloc = marketPulse?.marketStructure?.whereCapitalGoes?.lifecycle?.allocation || { Startup: 25, Growth: 45, Expansion: 20, Mature: 10 };
  const lifecycleDist = marketPulse?.marketStructure?.whereCapitalGoes?.lifecycle?.distribution || { Startup: 35, Growth: 40, Expansion: 18, Mature: 7 };
  const lifecycleTrends = marketPulse?.marketStructure?.whereCapitalGoes?.lifecycle?.trends || { years: ["2022", "2023", "2024", "2025"], Startup: [28, 30, 32, 35], Growth: [38, 40, 43, 45], Expansion: [18, 19, 19, 20] };

  const funderContribution = marketPulse?.marketStructure?.whoProvidesCapital?.funderType?.contribution || { VC: 45, Angel: 20, DFI: 18, "Corporate VC": 12, "Family Office": 5 };
  const funderDistribution = marketPulse?.marketStructure?.whoProvidesCapital?.funderType?.distribution || { VC: 38, Angel: 32, DFI: 12, "Corporate VC": 10, "Family Office": 8 };
  const funderTrends = marketPulse?.marketStructure?.whoProvidesCapital?.funderType?.trends || { years: ["2022", "2023", "2024", "2025"], VC: [38, 40, 43, 45], Angel: [18, 19, 20, 20], DFI: [15, 16, 17, 18] };

  const bbbee = marketPulse?.marketStructure?.whoProvidesCapital?.bbbee || { level1: 12, level2: 18, level3: 24, level4: 20, nonCompliant: 26 };

  const fundManagerLoc = marketPulse?.marketStructure?.whoProvidesCapital?.fundManager?.managerLocation || { Johannesburg: 45, CapeTown: 28, Durban: 12, Pretoria: 8, Others: 7 };
  const fundManagerTrends = marketPulse?.marketStructure?.whoProvidesCapital?.fundManager?.trends || { years: ["2022", "2023", "2024", "2025"], Johannesburg: [40, 42, 43, 45], CapeTown: [24, 25, 26, 28], Durban: [11, 11, 12, 12] };

  const coDeals = marketPulse?.marketStructure?.whoProvidesCapital?.coInvestor?.dealsWith || { yes: 45, no: 55 };
  const coDealsTrends = marketPulse?.marketStructure?.whoProvidesCapital?.coInvestor?.dealsTrends || { years: ["2022", "2023", "2024", "2025"], "With Co-investors": [38, 40, 43, 45], Solo: [62, 60, 57, 55] };
  const coLocation = marketPulse?.marketStructure?.whoProvidesCapital?.coInvestor?.location || { Johannesburg: 48, CapeTown: 25, Durban: 12, Pretoria: 8, International: 7 };
  const coLocationTrends = marketPulse?.marketStructure?.whoProvidesCapital?.coInvestor?.locationTrends || { years: ["2022", "2023", "2024", "2025"], Johannesburg: [44, 45, 47, 48], CapeTown: [22, 23, 24, 25], Durban: [11, 11, 12, 12] };

  const currentSectorData = viewType === "zar" ? sectorAlloc : sectorDist;
  const currentGeoData = viewType === "zar" ? geoAlloc : geoDist;
  const currentStageData = viewType === "zar" ? stageAlloc : stageDist;
  const currentLifecycleData = viewType === "zar" ? lifecycleAlloc : lifecycleDist;
  const currentFunderData = viewType === "zar" ? funderContribution : funderDistribution;

  const topSectors = Object.entries(sectorAlloc).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const bottomSectors = Object.entries(sectorAlloc).sort((a, b) => a[1] - b[1]).slice(0, 3);

  // Reusable doughnut card with manual legend + trend
  const DoughnutCard = ({ title, data, colors, trendKey, trendData, footer }) => {
    const labels = Object.keys(data);
    const values = Object.values(data);
    return (
      <Card title={title} footer={footer}>
        <div style={{ height: "200px" }}>
          <Doughnut
            options={doughnutOpts}
            data={{ labels, datasets: [{ data: values, backgroundColor: colors }] }}
          />
        </div>
        <ManualLegend labels={labels} colors={colors} values={values} />
        <ViewTrendButton show={trendVisible[trendKey]} onClick={() => toggleTrend(trendKey)} />
        {trendVisible[trendKey] && <TrendChart trendData={trendData} colors={colors} />}
      </Card>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px", borderBottom: `1px solid ${B.lightGrey}`, paddingBottom: "12px" }}>
        <SubTab label="Where Capital Goes" active={activeSubTab === "where-capital"} onClick={() => setActiveSubTab("where-capital")} />
        <SubTab label="Who Provides Capital" active={activeSubTab === "who-provides"} onClick={() => setActiveSubTab("who-provides")} />
        <SubTab label="Co-investor Analysis" active={activeSubTab === "co-investor"} onClick={() => setActiveSubTab("co-investor")} />
      </div>

      {activeSubTab === "where-capital" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px", gap: "8px" }}>
            <Pill label="By ZAR (Allocation)" active={viewType === "zar"} onClick={() => setViewType("zar")} />
            <Pill label="By Count (Distribution)" active={viewType === "count"} onClick={() => setViewType("count")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
            <DoughnutCard title="Sector Concentration" data={currentSectorData} colors={MIXED_COLORS} trendKey="sector" trendData={sectorTrends} footer={`Top 3: ${topSectors.map((s) => s[0]).join(", ")} | Bottom 3: ${bottomSectors.map((s) => s[0]).join(", ")}`} />
            <DoughnutCard title="Geographic Concentration" data={currentGeoData} colors={MIXED_COLORS} trendKey="geo" trendData={geoTrends} />
            <DoughnutCard title="Deal Stage Concentration" data={currentStageData} colors={MIXED_COLORS} trendKey="stage" trendData={stageTrends} />
            <DoughnutCard title="Lifecycle Concentration" data={currentLifecycleData} colors={MIXED_COLORS} trendKey="lifecycle" trendData={lifecycleTrends} />
          </div>
        </div>
      )}

      {activeSubTab === "who-provides" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px", gap: "8px" }}>
            <Pill label="By ZAR" active={viewType === "zar"} onClick={() => setViewType("zar")} />
            <Pill label="By Count" active={viewType === "count"} onClick={() => setViewType("count")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
            <DoughnutCard title="Fund Management & Concentration" data={currentFunderData} colors={MIXED_COLORS} trendKey="funder" trendData={funderTrends} />
            <Card title="Funder B-BBEE Compliance Status">
              <div style={{ height: "260px" }}>
                <Bar
                  options={hBarOpts()}
                  data={{
                    labels: ["Level 1", "Level 2", "Level 3", "Level 4", "Non-Compliant"],
                    datasets: [{ label: "Number of Funders", data: [bbbee.level1, bbbee.level2, bbbee.level3, bbbee.level4, bbbee.nonCompliant], backgroundColor: MIXED_COLORS[0] }],
                  }}
                />
              </div>
            </Card>
            <DoughnutCard title="Fund Manager Head Office Distribution" data={fundManagerLoc} colors={MIXED_COLORS} trendKey="fundmgr" trendData={fundManagerTrends} />
          </div>
        </div>
      )}

      {/* Co-investor — side by side, no tabs */}
      {activeSubTab === "co-investor" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
          <DoughnutCard
            title="Deals with Co-investors"
            data={{ "With Co-investors": coDeals.yes, Solo: coDeals.no }}
            colors={[MIXED_COLORS[1], MIXED_COLORS[6]]}
            trendKey="codeals"
            trendData={coDealsTrends}
          />
          <DoughnutCard title="Co-investor Location" data={coLocation} colors={MIXED_COLORS} trendKey="coloc" trendData={coLocationTrends} />
        </div>
      )}
    </div>
  );
};

// ─── Deal Structure ───────────────────────────────────────────────────────────
const DealStructure = () => {
  const { marketPulse } = usePortfolio();
  const [activeSubTab, setActiveSubTab] = useState("fund-type");
  const [trendVisible, setTrendVisible] = useState({});
  const toggleTrend = (key) => setTrendVisible((p) => ({ ...p, [key]: !p[key] }));

  const fundTypeAlloc = marketPulse?.marketStructure?.dealStructure?.fundType?.allocation || { Grant: 15, Equity: 55, Debt: 25, Convertible: 5 };
  const fundTypeDist = marketPulse?.marketStructure?.dealStructure?.fundType?.distribution || { Grant: 30, Equity: 40, Debt: 20, Convertible: 10 };
  const fundTypeTrends = marketPulse?.marketStructure?.dealStructure?.fundType?.trends || { years: ["2022", "2023", "2024", "2025"], Grant: [12, 13, 14, 15], Equity: [48, 51, 53, 55], Debt: [22, 23, 24, 25], Convertible: [4, 4, 5, 5] };

  const avgDealSize = marketPulse?.marketStructure?.dealStructure?.dealSize?.avg || { current: 12.5, yoyGrowth: 8.2 };
  const dealSizeDist = marketPulse?.marketStructure?.dealStructure?.dealSize?.distribution || { "<R1M": 15, "R1-5M": 35, "R5-10M": 28, "R10-20M": 15, "R20M+": 7 };
  const avgDealsPerInvestor = marketPulse?.marketStructure?.dealStructure?.dealSize?.avgDealsPerInvestor || { current: 3.8, yoyGrowth: 5.6 };
  const equitySizeDist = marketPulse?.marketStructure?.dealStructure?.equity?.sizeDistribution || { "<R1M": 20, "R1-5M": 40, "R5-10M": 25, "R10-20M": 10, "R20M+": 5 };
  const equityPctDist = marketPulse?.marketStructure?.dealStructure?.equity?.pctDistribution || { "0-10%": 25, "10-20%": 40, "20-30%": 20, "30-50%": 10, "50%+": 5 };

  const DoughnutCard = ({ title, data, colors, trendKey, trendData }) => {
    const labels = Object.keys(data);
    const values = Object.values(data);
    return (
      <Card title={title}>
        <div style={{ height: "220px" }}>
          <Doughnut
            options={doughnutOpts}
            data={{ labels, datasets: [{ data: values, backgroundColor: colors }] }}
          />
        </div>
        <ManualLegend labels={labels} colors={colors} values={values} />
        <ViewTrendButton show={trendVisible[trendKey]} onClick={() => toggleTrend(trendKey)} />
        {trendVisible[trendKey] && <TrendChart trendData={trendData} colors={colors} />}
      </Card>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: `1px solid ${B.lightGrey}`, paddingBottom: "12px" }}>
        <SubTab label="Fund Type" active={activeSubTab === "fund-type"} onClick={() => setActiveSubTab("fund-type")} />
        <SubTab label="Deal Size" active={activeSubTab === "deal-size"} onClick={() => setActiveSubTab("deal-size")} />
        <SubTab label="Equity Preferences" active={activeSubTab === "equity"} onClick={() => setActiveSubTab("equity")} />
      </div>

      {/* Fund Type — both side by side, no tabs */}
      {activeSubTab === "fund-type" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
          <DoughnutCard title="Fund Type — By ZAR (Allocation)" data={fundTypeAlloc} colors={MIXED_COLORS} trendKey="fundtype-zar" trendData={fundTypeTrends} />
          <DoughnutCard title="Fund Type — By Count (Distribution)" data={fundTypeDist} colors={MIXED_COLORS} trendKey="fundtype-count" trendData={fundTypeTrends} />
        </div>
      )}

      {activeSubTab === "deal-size" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <Card title="Average Deal Size">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
              <div style={{ fontSize: "44px", fontWeight: "800", color: B.black }}>R {avgDealSize.current}M</div>
              <div style={{ fontSize: "12px", color: B.mediumGrey }}>YoY Growth <TrendIcon growth={avgDealSize.yoyGrowth} /></div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: B.black, marginTop: "20px" }}>{avgDealsPerInvestor.current} avg deals per investor</div>
              <div style={{ fontSize: "11px", color: B.mediumGrey }}>YoY Growth <TrendIcon growth={avgDealsPerInvestor.yoyGrowth} /></div>
            </div>
          </Card>
          <Card title="Deal Size Distribution">
            <div style={{ height: "320px" }}>
              <Bar
                options={{ responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: "Range", color: B.darkGrey }, grid: { display: false }, ticks: { color: B.darkGrey, font: { size: 8 } } }, y: { title: { display: true, text: "Number of Deals", color: B.darkGrey }, beginAtZero: true, grid: { color: B.lightGrey }, ticks: { color: B.darkGrey, callback: (v) => `R${v}M` } } } }}
                data={{ labels: Object.keys(dealSizeDist), datasets: [{ label: "Number of Deals", data: Object.values(dealSizeDist), backgroundColor: MIXED_COLORS[0] }] }}
              />
            </div>
          </Card>
        </div>
      )}

      {activeSubTab === "equity" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <Card title="Equity Size Distribution">
            <div style={{ height: "320px" }}>
              <Bar
                options={{ responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: "Range", color: B.darkGrey }, grid: { display: false }, ticks: { color: B.darkGrey, font: { size: 8 } } }, y: { title: { display: true, text: "Number of Deals", color: B.darkGrey }, beginAtZero: true, grid: { color: B.lightGrey }, ticks: { color: B.darkGrey, callback: (v) => `R${v}M` } } } }}
                data={{ labels: Object.keys(equitySizeDist), datasets: [{ label: "Number of Deals", data: Object.values(equitySizeDist), backgroundColor: MIXED_COLORS[1] }] }}
              />
            </div>
          </Card>
          <Card title="Equity Percentage Distribution">
            <div style={{ height: "320px" }}>
              <Bar
                options={{ responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: "Range", color: B.darkGrey }, grid: { display: false }, ticks: { color: B.darkGrey, font: { size: 8 } } }, y: { title: { display: true, text: "Number of Deals", color: B.darkGrey }, beginAtZero: true, grid: { color: B.lightGrey }, ticks: { color: B.darkGrey } } } }}
                data={{ labels: Object.keys(equityPctDist), datasets: [{ label: "Number of Deals", data: Object.values(equityPctDist), backgroundColor: MIXED_COLORS[3] }] }}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const CapitalFlow = () => {
  const [activeMainTab, setActiveMainTab] = useState("market-structure");
  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: `1px solid ${B.lightGrey}`, paddingBottom: "12px" }}>
        <SubTab label="Market Structure" active={activeMainTab === "market-structure"} onClick={() => setActiveMainTab("market-structure")} />
        <SubTab label="Deal Structure" active={activeMainTab === "deal-structure"} onClick={() => setActiveMainTab("deal-structure")} />
        <SubTab label="Capital Deployment" active={activeMainTab === "deployment"} onClick={() => setActiveMainTab("deployment")} />
      </div>
      {activeMainTab === "market-structure" && <MarketStructure />}
      {activeMainTab === "deal-structure" && <DealStructure />}
      {activeMainTab === "deployment" && <CapitalDeployment />}
    </div>
  );
};

export default CapitalFlow;