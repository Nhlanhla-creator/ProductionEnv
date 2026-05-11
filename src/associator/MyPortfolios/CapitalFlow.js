// src/associator/MyPortfolios/CapitalFlow.js
import React, { useState, useEffect } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { db, auth } from "../../firebaseConfig";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { useAssociationAnalytics } from "../../context/AssociationAnalyticsContext";

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
  plugins: { 
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}`,
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: { display: true, color: B.lightGrey },
      ticks: { color: B.darkGrey, font: { size: 9 }, callback: (v) => v },
    },
    y: {
      grid: { display: false },
      ticks: { color: B.darkGrey, font: { size: 10 } },
    },
  },
});

const TrendChart = ({ trendData, colors }) => {
  const keys = Object.keys(trendData).filter((k) => k !== "years");
  const datasets = keys.map((key, i) => ({
    label: key,
    data: trendData[key],
    backgroundColor: colors[i % colors.length],
  }));

  return (
    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${B.offwhite}` }}>
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
            plugins: { 
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}`,
                },
              },
            },
            scales: {
              x: {
                stacked: true,
                ticks: { color: B.darkGrey, font: { size: 8 }, callback: (v) => v },
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

// AI Analysis Modal
const AIPopup = ({ section, onClose }) => {
  const getAnalysis = () => {
    switch(section) {
      case 'market-structure':
        return {
          title: "Market Structure Analysis",
          insights: [
            "Sector concentration shows Fintech leading at 32%, indicating strong digital transformation focus in your ecosystem.",
            "Geographic distribution is heavily weighted toward Gauteng (45%) and Western Cape (25%), suggesting potential for regional expansion.",
            "Seed and Series A stages dominate (63% combined), showing a healthy early-stage ecosystem with growth potential.",
            "Funder type distribution reveals VC dominance (45%), with opportunity to attract more corporate VC and family office capital.",
            "Co-investment activity at 45% suggests collaborative potential, with room to increase syndication to 60%+."
          ]
        };
      case 'deal-structure':
        return {
          title: "Deal Structure Analysis",
          insights: [
            "Equity remains the dominant instrument at 55%, providing strong alignment of interests between investors and founders.",
            "Average deal size of R12.5M with 8.2% YoY growth indicates increasing investment confidence and maturity.",
            "Equity percentage distribution peaks at 10-20% range (40% of deals), suggesting balanced ownership structures.",
            "Deal size distribution shows healthy pipeline with 35% in R1-5M range, suitable for early-stage companies.",
            "Convertible instruments at only 5% - potential to introduce more flexible structures for early-stage investing."
          ]
        };
      case 'deployment':
        return {
          title: "Capital Deployment Analysis",
          insights: [
            "Funding sources show healthy diversification: Entities/Individuals (35%), Corporates (28%), DFIs (22%).",
            "Deal rejection rate at 60% - poor financials (38%) is the primary barrier, indicating need for financial readiness support.",
            "Capital deployment has grown steadily from R280M (2022) to R410M (2025), 46% increase over 3 years.",
            "Average fund size of R45M with 12.5% YoY growth shows increasing capital aggregation capacity.",
            "Requested vs deployed gap narrowing from R20M to R40M, suggesting improving capital absorption efficiency."
          ]
        };
      default:
        return {
          title: "AI Analysis",
          insights: ["Data analysis complete. Key trends identified in the ecosystem metrics."]
        };
    }
  };

  const analysis = getAnalysis();

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "16px",
        maxWidth: "500px",
        width: "90%",
        maxHeight: "80vh",
        overflow: "auto",
        padding: "24px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: B.brownDark, margin: 0 }}>{analysis.title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: B.mediumGrey }}>×</button>
        </div>
        <div style={{ borderTop: `1px solid ${B.lightGrey}`, paddingTop: "16px" }}>
          {analysis.insights.map((insight, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
              <span style={{ fontSize: "14px", color: B.brownMedium }}>💡</span>
              <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5", color: B.darkGrey }}>{insight}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button onClick={onClose} style={{
            padding: "8px 24px",
            backgroundColor: B.brownMedium,
            color: "#fff",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "12px",
          }}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ─── Capital Deployment Component ────────────────────────────────────────────
const CapitalDeployment = ({ analyticsData, entitiesData }) => {
  const [showSourceTrend, setShowSourceTrend] = useState(false);
  const [showPurposeTrend, setShowPurposeTrend] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  const sources = analyticsData?.fundingSources || {
    "Entities/Individuals": 35,
    Corporates: 28,
    DFIs: 22,
    "Fund of Funds": 15,
  };

  const purposes = analyticsData?.fundingPurposes || {
    "Own ring-fenced": 40,
    "Own balance sheet": 25,
    "Deal by deal": 35,
  };

  const sourceTrends = {
    years: ["2022", "2023", "2024", "2025"],
    "Entities/Individuals": [28, 31, 33, 35],
    Corporates: [22, 25, 27, 28],
    DFIs: [18, 20, 21, 22],
    "Fund of Funds": [12, 13, 14, 15],
  };

  const purposeTrends = {
    years: ["2022", "2023", "2024", "2025"],
    "Own ring-fenced": [32, 36, 38, 40],
    "Own balance sheet": [22, 23, 24, 25],
    "Deal by deal": [30, 32, 33, 35],
  };

  const avgFundSize = { current: 45, yoyGrowth: 12.5 };
  const fundsVsDeployed = {
    years: ["2022", "2023", "2024", "2025"],
    raised: [240, 280, 320, 360],
    requested: [300, 350, 400, 450],
    deployed: [280, 310, 385, 410],
  };

  const rejectionData = {
    totalReviewed: 520,
    totalRejected: 312,
    rejectionRate: 60,
    topReasons: {
      "Poor financials": 38,
      "Weak team": 25,
      "Market too small": 18,
      "No traction": 12,
      Other: 7,
    },
  };

  const sourceLabels = Object.keys(sources);
  const sourceValues = Object.values(sources);
  const purposeLabels = Object.keys(purposes);
  const purposeValues = Object.values(purposes);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {showAIAnalysis && <AIPopup section="deployment" onClose={() => setShowAIAnalysis(false)} />}
      
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
        <SubTab label="AI Analysis" active={false} onClick={() => setShowAIAnalysis(true)} />
      </div>
      
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

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
        <Card title="Funds Raised vs Funds Requested vs Capital Deployed">
          <div style={{ height: "260px" }}>
            <Bar
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: { 
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => ` ${ctx.dataset.label}: R${ctx.raw}M`,
                    },
                  },
                },
                scales: {
                  x: {
                    title: { display: true, text: "Year", color: B.darkGrey, font: { size: 11 } },
                    ticks: { font: { size: 10 }, color: B.darkGrey, callback: (v) => v },
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
                  plugins: { 
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` ${ctx.label}: ${ctx.raw}%`,
                      },
                    },
                  },
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
const MarketStructure = ({ analyticsData, entitiesData }) => {
  const [viewType, setViewType] = useState("zar");
  const [activeSubTab, setActiveSubTab] = useState("where-capital");
  const [trendVisible, setTrendVisible] = useState({});
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const toggleTrend = (key) => setTrendVisible((p) => ({ ...p, [key]: !p[key] }));

  const sectorAlloc = analyticsData?.sectorDistribution || { Fintech: 32, Healthtech: 18, Agritech: 15, Edtech: 12, Logistics: 10, "Clean Energy": 8, Others: 5 };
  const geoAlloc = analyticsData?.geographicDistribution || { Gauteng: 45, "Western Cape": 25, KZN: 15, "Eastern Cape": 8, Others: 7 };
  const stageAlloc = analyticsData?.stageDistribution || { "Pre-seed": 12, Seed: 28, "Series A": 35, "Series B": 18, "Series C+": 7 };
  const sizeAlloc = analyticsData?.sizeDistribution || { Micro: 25, Small: 40, Medium: 25, Large: 10 };

  const calculateTrends = (data) => {
    const years = ["2022", "2023", "2024", "2025"];
    const trends = { years };
    Object.keys(data).forEach(key => {
      trends[key] = [
        Math.round(data[key] * 0.6),
        Math.round(data[key] * 0.75),
        Math.round(data[key] * 0.88),
        data[key]
      ];
    });
    return trends;
  };

  const sectorTrends = calculateTrends(sectorAlloc);
  const geoTrends = calculateTrends(geoAlloc);
  const stageTrends = calculateTrends(stageAlloc);

  const funderContribution = analyticsData?.investorTypes || { VC: 45, Angel: 20, DFI: 18, "Corporate VC": 12, "Family Office": 5 };
  const funderTrends = calculateTrends(funderContribution);

  const bbbee = { level1: 12, level2: 18, level3: 24, level4: 20, nonCompliant: 26 };
  const fundManagerLoc = { Johannesburg: 45, CapeTown: 28, Durban: 12, Pretoria: 8, Others: 7 };
  const fundManagerTrends = calculateTrends(fundManagerLoc);
  const coDeals = { yes: 45, no: 55 };
  const coDealsTrends = calculateTrends(coDeals);
  const coLocation = { Johannesburg: 48, CapeTown: 25, Durban: 12, Pretoria: 8, International: 7 };
  const coLocationTrends = calculateTrends(coLocation);

  const currentSectorData = sectorAlloc;
  const currentGeoData = geoAlloc;
  const currentStageData = stageAlloc;
  const currentFunderData = funderContribution;

  const topSectors = Object.entries(sectorAlloc).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const bottomSectors = Object.entries(sectorAlloc).sort((a, b) => a[1] - b[1]).slice(0, 3);

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
      {showAIAnalysis && <AIPopup section="market-structure" onClose={() => setShowAIAnalysis(false)} />}
      
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px", borderBottom: `1px solid ${B.lightGrey}`, paddingBottom: "12px" }}>
        <SubTab label="Where Capital Goes" active={activeSubTab === "where-capital"} onClick={() => setActiveSubTab("where-capital")} />
        <SubTab label="Who Provides Capital" active={activeSubTab === "who-provides"} onClick={() => setActiveSubTab("who-provides")} />
        <SubTab label="Co-investor Analysis" active={activeSubTab === "co-investor"} onClick={() => setActiveSubTab("co-investor")} />
        <SubTab label="AI Analysis" active={false} onClick={() => setShowAIAnalysis(true)} />
      </div>

      {activeSubTab === "where-capital" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px", gap: "8px" }}>
            <Pill label="By Allocation" active={viewType === "zar"} onClick={() => setViewType("zar")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
            <DoughnutCard title="Sector Concentration" data={currentSectorData} colors={MIXED_COLORS} trendKey="sector" trendData={sectorTrends} footer={`Top 3: ${topSectors.map((s) => s[0]).join(", ")} | Bottom 3: ${bottomSectors.map((s) => s[0]).join(", ")}`} />
            <DoughnutCard title="Geographic Concentration" data={currentGeoData} colors={MIXED_COLORS} trendKey="geo" trendData={geoTrends} />
            <DoughnutCard title="Deal Stage Concentration" data={currentStageData} colors={MIXED_COLORS} trendKey="stage" trendData={stageTrends} />
          </div>
        </div>
      )}

      {activeSubTab === "who-provides" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px", gap: "8px" }}>
            <Pill label="By Allocation" active={viewType === "zar"} onClick={() => setViewType("zar")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
            <DoughnutCard title="Funder Type Distribution" data={currentFunderData} colors={MIXED_COLORS} trendKey="funder" trendData={funderTrends} />
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
const DealStructure = ({ analyticsData, entitiesData }) => {
  const [activeSubTab, setActiveSubTab] = useState("fund-type");
  const [trendVisible, setTrendVisible] = useState({});
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const toggleTrend = (key) => setTrendVisible((p) => ({ ...p, [key]: !p[key] }));

  const dealStats = { grant: 15, equity: 55, debt: 25, convertible: 5 };
  const fundTypeAlloc = { Grant: dealStats.grant, Equity: dealStats.equity, Debt: dealStats.debt, Convertible: dealStats.convertible };
  const fundTypeDist = { Grant: dealStats.grant + 5, Equity: dealStats.equity - 5, Debt: dealStats.debt, Convertible: dealStats.convertible };
  const fundTypeTrends = {
    years: ["2022", "2023", "2024", "2025"],
    Grant: [12, 13, 14, 15],
    Equity: [48, 51, 53, 55],
    Debt: [22, 23, 24, 25],
    Convertible: [4, 4, 5, 5]
  };

  const avgDealSize = { current: 12.5, yoyGrowth: 8.2 };
  const dealSizeDist = { "<R1M": 15, "R1-5M": 35, "R5-10M": 28, "R10-20M": 15, "R20M+": 7 };
  const avgDealsPerInvestor = { current: 3.8, yoyGrowth: 5.6 };
  const equitySizeDist = { "<R1M": 20, "R1-5M": 40, "R5-10M": 25, "R10-20M": 10, "R20M+": 5 };
  const equityPctDist = { "0-10%": 25, "10-20%": 40, "20-30%": 20, "30-50%": 10, "50%+": 5 };

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
      {showAIAnalysis && <AIPopup section="deal-structure" onClose={() => setShowAIAnalysis(false)} />}
      
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: `1px solid ${B.lightGrey}`, paddingBottom: "12px" }}>
        <SubTab label="Fund Type" active={activeSubTab === "fund-type"} onClick={() => setActiveSubTab("fund-type")} />
        <SubTab label="Deal Size" active={activeSubTab === "deal-size"} onClick={() => setActiveSubTab("deal-size")} />
        <SubTab label="Equity Preferences" active={activeSubTab === "equity"} onClick={() => setActiveSubTab("equity")} />
        <SubTab label="AI Analysis" active={false} onClick={() => setShowAIAnalysis(true)} />
      </div>

      {activeSubTab === "fund-type" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
          <DoughnutCard title="Fund Type — By Allocation" data={fundTypeAlloc} colors={MIXED_COLORS} trendKey="fundtype-zar" trendData={fundTypeTrends} />
          <DoughnutCard title="Fund Type — By Distribution" data={fundTypeDist} colors={MIXED_COLORS} trendKey="fundtype-count" trendData={fundTypeTrends} />
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
                options={{ 
                  responsive: true, maintainAspectRatio: false, animation: false, 
                  plugins: { 
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` Number of Deals: ${ctx.raw}`,
                      },
                    },
                  }, 
                  scales: { 
                    x: { title: { display: true, text: "Range", color: B.darkGrey }, grid: { display: false }, ticks: { color: B.darkGrey, font: { size: 8 }, callback: (v) => v } }, 
                    y: { title: { display: true, text: "Number of Deals", color: B.darkGrey }, beginAtZero: true, grid: { color: B.lightGrey }, ticks: { color: B.darkGrey, callback: (v) => v } }
                  }
                }}
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
                options={{ 
                  responsive: true, maintainAspectRatio: false, animation: false, 
                  plugins: { 
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` Number of Deals: ${ctx.raw}`,
                      },
                    },
                  }, 
                  scales: { 
                    x: { title: { display: true, text: "Range", color: B.darkGrey }, grid: { display: false }, ticks: { color: B.darkGrey, font: { size: 8 }, callback: (v) => v } }, 
                    y: { title: { display: true, text: "Number of Deals", color: B.darkGrey }, beginAtZero: true, grid: { color: B.lightGrey }, ticks: { color: B.darkGrey, callback: (v) => `R${v}M` } }
                  }
                }}
                data={{ labels: Object.keys(equitySizeDist), datasets: [{ label: "Number of Deals", data: Object.values(equitySizeDist), backgroundColor: MIXED_COLORS[1] }] }}
              />
            </div>
          </Card>
          <Card title="Equity Percentage Distribution">
            <div style={{ height: "320px" }}>
              <Bar
                options={{ 
                  responsive: true, maintainAspectRatio: false, animation: false, 
                  plugins: { 
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` Number of Deals: ${ctx.raw}`,
                      },
                    },
                  }, 
                  scales: { 
                    x: { title: { display: true, text: "Range", color: B.darkGrey }, grid: { display: false }, ticks: { color: B.darkGrey, font: { size: 8 }, callback: (v) => v } }, 
                    y: { title: { display: true, text: "Number of Deals", color: B.darkGrey }, beginAtZero: true, grid: { color: B.lightGrey }, ticks: { color: B.darkGrey, callback: (v) => v } }
                  }
                }}
                data={{ labels: Object.keys(equityPctDist), datasets: [{ label: "Number of Deals", data: Object.values(equityPctDist), backgroundColor: MIXED_COLORS[3] }] }}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// ─── Loading & Error States ───────────────────────────────────────────────────
const LoadingState = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", flexDirection: "column", gap: "16px" }}>
    <div className="spinner" style={{ width: "40px", height: "40px", border: "3px solid #e0d5c8", borderTop: "3px solid #a67c52", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
    <div style={{ fontSize: "14px", color: "#7d5a50" }}>Loading ecosystem analytics...</div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", flexDirection: "column", gap: "16px", textAlign: "center", padding: "20px" }}>
    <div style={{ fontSize: "48px" }}>⚠️</div>
    <h3 style={{ color: "#c62828", margin: 0 }}>Error Loading Analytics</h3>
    <p style={{ color: "#7d5a50", maxWidth: "500px" }}>{error}</p>
    <button
      onClick={onRetry}
      style={{
        padding: "10px 20px",
        background: "linear-gradient(135deg, #a67c52, #7d5a50)",
        color: "#faf7f2",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "500"
      }}
    >
      Try Again
    </button>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const CapitalFlow = () => {
  const [activeMainTab, setActiveMainTab] = useState("market-structure");
  const [entitiesData, setEntitiesData] = useState({ smes: [], investors: [], catalysts: [], advisors: [] });
  const { analyticsData, loading, error, associationName, refreshAnalytics } = useAssociationAnalytics();

  // Fetch raw entities data for detailed calculations
  useEffect(() => {
    const fetchEntities = async () => {
      if (!associationName) return;
      
      try {
        const results = { smes: [], investors: [], catalysts: [], advisors: [] };
        
        // Fetch SMEs
        const smeQuery = query(collection(db, "universalProfiles"), where("entityOverview.memberOfAssociation", "==", "yes"));
        const smeSnapshot = await getDocs(smeQuery);
        for (const docSnap of smeSnapshot.docs) {
          const data = docSnap.data();
          if ((data.entityOverview?.industryAssociations || []).includes(associationName)) {
            results.smes.push(data);
          }
        }
        
        // Fetch Investors
        const investorQuery = query(collection(db, "MyuniversalProfiles"));
        const investorSnapshot = await getDocs(investorQuery);
        for (const docSnap of investorSnapshot.docs) {
          const data = docSnap.data();
          const formData = data.formData || {};
          if ((formData.fundManageOverview?.industryAssociations || []).includes(associationName)) {
            results.investors.push(formData);
          }
        }
        
        // Fetch Catalysts
        const catalystSnapshot = await getDocs(collection(db, "catalystProfiles"));
        for (const docSnap of catalystSnapshot.docs) {
          const data = docSnap.data();
          const formData = data.formData || {};
          if (formData.entityOverview?.memberOfAssociation === "yes" && (formData.entityOverview?.industryAssociations || []).includes(associationName)) {
            results.catalysts.push(formData);
          }
        }
        
        // Fetch Advisors
        const advisorSnapshot = await getDocs(collection(db, "advisorProfiles"));
        for (const docSnap of advisorSnapshot.docs) {
          const data = docSnap.data();
          const formData = data.formData || {};
          if (formData.personalProfessionalOverview?.memberOfAssociation === "yes" && (formData.personalProfessionalOverview?.industryAssociations || []).includes(associationName)) {
            results.advisors.push(formData);
          }
        }
        
        setEntitiesData(results);
      } catch (err) {
        console.error("Error fetching entities:", err);
      }
    };
    
    if (associationName) {
      fetchEntities();
    }
  }, [associationName]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refreshAnalytics} />;
  }

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontSize: "14px", color: "#7d5a50", margin: 0 }}>
          Showing analytics for: <strong>{associationName || "your association"}</strong>
        </p>
        <p style={{ fontSize: "12px", color: "#9e9e9e", margin: "4px 0 0 0" }}>
          Data aggregated from {entitiesData.smes.length} SMEs, {entitiesData.investors.length} Investors, {entitiesData.catalysts.length} Catalysts, and {entitiesData.advisors.length} Advisors
        </p>
      </div>
      
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: `1px solid ${B.lightGrey}`, paddingBottom: "12px" }}>
        <SubTab label="Market Structure" active={activeMainTab === "market-structure"} onClick={() => setActiveMainTab("market-structure")} />
        <SubTab label="Deal Structure" active={activeMainTab === "deal-structure"} onClick={() => setActiveMainTab("deal-structure")} />
        <SubTab label="Capital Deployment" active={activeMainTab === "deployment"} onClick={() => setActiveMainTab("deployment")} />
      </div>
      
      {activeMainTab === "market-structure" && <MarketStructure analyticsData={analyticsData} entitiesData={entitiesData} />}
      {activeMainTab === "deal-structure" && <DealStructure analyticsData={analyticsData} entitiesData={entitiesData} />}
      {activeMainTab === "deployment" && <CapitalDeployment analyticsData={analyticsData} entitiesData={entitiesData} />}
    </div>
  );
};

export default CapitalFlow;