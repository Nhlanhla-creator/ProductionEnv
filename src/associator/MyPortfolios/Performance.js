import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Mixed color palette - brown, grey, cream, black, white
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

// Mixed color array for charts - combines browns, greys, creams
const MIXED_COLORS = [
  "#5c3d2e", // dark brown
  "#4a4a4a", // dark grey
  "#8b694e", // medium brown
  "#7a7a7a", // medium grey
  "#b8957a", // light brown
  "#c4c4c4", // light grey
  "#d4bca8", // pale brown
  "#9e9e9e", // warm grey
  "#3d2a1f", // deepest brown
  "#e0d6c8", // cream
];

const MEDALS = ["🥇", "🥈", "🥉"];
const WARN = ["⚠️", "🔸", "🔹"];

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

const Card = ({ title, footer, children }) => (
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
      <div
        style={{
          marginTop: "12px",
          paddingTop: "10px",
          borderTop: `1px solid ${B.offwhite}`,
          fontSize: "11px",
          color: B.warmGrey,
        }}
      >
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

const EmptyState = ({ message }) => (
  <div
    style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: B.warmGrey,
      fontSize: "12px",
      fontStyle: "italic",
      textAlign: "center",
      padding: "1rem",
    }}
  >
    {message || "No data yet"}
  </div>
);

const hBarOpts = (valCb, integralOnly) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  indexAxis: "y",
  plugins: { legend: { display: false } },
  scales: {
    x: {
      beginAtZero: true,
      grid: { display: true, color: B.lightGrey },
      ticks: {
        color: B.darkGrey,
        font: { size: 10 },
        ...(valCb ? { callback: valCb } : {}),
        ...(integralOnly && !valCb
          ? { callback: (v) => (Number.isInteger(v) ? v : ""), precision: 0, stepSize: 1 }
          : {}),
      },
    },
    y: { grid: { display: false }, ticks: { color: B.darkGrey, font: { size: 11 } } },
  },
});

// Ranked Table Component
const RankedTable = ({ rows, isTop, metricLabel, unit = "", fmt }) => {
  if (!rows || rows.length === 0) {
    return <EmptyState message="Not enough data yet" />;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
      {rows.map((row, i) => (
        <div
          key={row.name + i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            borderRadius: "8px",
            background: isTop ? (i === 0 ? B.cream : B.offwhite) : i === 0 ? "#fdf0ec" : B.offwhite,
            border: `1px solid ${isTop ? B.lightGrey : "#e8d4cc"}`,
          }}
        >
          <span style={{ fontSize: "18px", minWidth: "24px" }}>{isTop ? MEDALS[i] : WARN[i]}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: B.black }}>{row.name}</div>
            <div style={{ fontSize: "11px", color: B.warmGrey }}>{row.sector || "–"} · {row.stage || "–"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "16px", fontWeight: "800", color: isTop ? B.black : "#9b3a1a" }}>
              {fmt ? fmt(row) : row.value ?? "–"}
              {unit}
            </div>
            <div style={{ fontSize: "10px", color: B.warmGrey }}>{metricLabel}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const InsightBox = ({ text }) => (
  <div
    style={{
      marginTop: "12px",
      padding: "10px 12px",
      background: B.cream,
      borderRadius: "7px",
      border: `1px dashed ${B.lightGrey}`,
      fontSize: "12px",
      color: B.darkGrey,
      fontStyle: "italic",
      lineHeight: 1.5,
    }}
  >
    💡 {text}
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
    ],
  },
  bigScore: { avg: 62, min: 38, max: 88 },
};

const placeholderRankings = {
  topBig: [
    { name: "TechSolve", sector: "Fintech", stage: "Growth", bigScore: 94, fundability: 88 },
    { name: "GreenEnergy", sector: "Clean Energy", stage: "Expansion", bigScore: 89, fundability: 85 },
    { name: "HealthPlus", sector: "Healthtech", stage: "Growth", bigScore: 86, fundability: 82 },
  ],
  topMatch: [
    { name: "TechSolve", sector: "Fintech", stage: "Growth", matchPct: 96 },
    { name: "FinWise", sector: "Fintech", stage: "Seed", matchPct: 92 },
    { name: "EduTech", sector: "Edtech", stage: "Growth", matchPct: 88 },
  ],
  bottomBig: [
    { name: "AgriGrow", sector: "Agritech", stage: "Startup", bigScore: 34 },
    { name: "RetailX", sector: "Retail", stage: "Seed", bigScore: 38 },
    { name: "LogiSync", sector: "Logistics", stage: "Startup", bigScore: 42 },
  ],
  bottomMatch: [
    { name: "RetailX", sector: "Retail", stage: "Seed", matchPct: 28 },
    { name: "AgriGrow", sector: "Agritech", stage: "Startup", matchPct: 32 },
    { name: "LogiSync", sector: "Logistics", stage: "Startup", matchPct: 38 },
  ],
  lowCompliance: [
    { name: "RetailX", sector: "Retail", stage: "Seed", compliance: 45 },
    { name: "AgriGrow", sector: "Agritech", stage: "Startup", compliance: 52 },
    { name: "QuickServe", sector: "Services", stage: "Startup", compliance: 58 },
  ],
  lowFundability: [
    { name: "AgriGrow", sector: "Agritech", stage: "Startup", fundability: 28 },
    { name: "RetailX", sector: "Retail", stage: "Seed", fundability: 32 },
    { name: "LogiSync", sector: "Logistics", stage: "Startup", fundability: 38 },
  ],
  revenuePerSME: [
    { name: "TechSolve", revenue: 18500000, sector: "Fintech", profitability: "Profitable" },
    { name: "GreenEnergy", revenue: 12200000, sector: "Clean Energy", profitability: "Profitable" },
    { name: "HealthPlus", revenue: 8900000, sector: "Healthtech", profitability: "Breakeven" },
  ],
};

// Performance Sub-components

const RevenuePerSME = () => {
  const perSME = [...placeholderMetrics.revenue.perSME].sort((a, b) => b.revenue - a.revenue);
  const innerH = Math.max(280, perSME.length * 36);

  const footer = (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: "12px", color: B.black, fontWeight: 600 }}>
        Total: <strong>R{(placeholderMetrics.revenue.total / 1_000_000).toFixed(1)}M</strong>
      </span>
      <span style={{ fontSize: "12px", color: B.warmGrey }}>
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
              options={hBarOpts((v) => "R" + (v / 1_000_000).toFixed(1) + "M")}
              data={{
                labels: perSME.map((s) => s.name),
                datasets: [
                  {
                    label: "Annual Revenue (R)",
                    data: perSME.map((s) => s.revenue),
                    backgroundColor: MIXED_COLORS.slice(0, perSME.length),
                  },
                ],
              }}
            />
          </div>
        </div>
      ) : (
        <EmptyState message="Revenue data not yet available in profiles" />
      )}
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
  const statusColors = {
    Profitable: "#2e7d32",
    Breakeven: "#ed6c02",
    "Pre-revenue": MIXED_COLORS[6],
    Unprofitable: "#c62828",
  };

  return (
    <Card title="Profitability Status">
      {labels.length > 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center" }}>
          {labels.map((l, i) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "2px",
                  background: statusColors[l] || MIXED_COLORS[i],
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  flex: 1,
                  background: B.lightGrey,
                  borderRadius: "4px",
                  height: "24px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(values[i] / total) * 100}%`,
                    background: statusColors[l] || MIXED_COLORS[i],
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: "8px",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "#fff", fontWeight: 600 }}>{values[i]}</span>
                </div>
              </div>
              <span style={{ fontSize: "12px", color: B.darkGrey, minWidth: "90px" }}>{l}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="Profitability data not yet in profiles" />
      )}
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
  const innerH = Math.max(280, smeClients.length * 36);

  return (
    <Card title="Key Clients per SME">
      {smeClients.length > 0 ? (
        <div style={{ flex: 1, overflowY: smeClients.length > 7 ? "auto" : "visible" }}>
          <div style={{ height: `${innerH}px` }}>
            <Bar
              options={hBarOpts(null, true)}
              data={{
                labels: smeClients.map((s) => s.name),
                datasets: [
                  {
                    label: "# Key Clients",
                    data: smeClients.map((s) => s.count),
                    backgroundColor: MIXED_COLORS.slice(0, smeClients.length),
                  },
                ],
              }}
            />
          </div>
        </div>
      ) : (
        <EmptyState message="Key client data not yet available in profiles" />
      )}
    </Card>
  );
};

const PerformanceSection = () => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
      <RevenuePerSME />
      <ProfitabilityStatus />
      <ClientsPerSME />
    </div>
  );
};

// Top/Bottom Sub-components

const HighestBIGScore = () => {
  const rows = placeholderRankings.topBig;
  return (
    <Card title="Highest BIG Score">
      <RankedTable isTop rows={rows} metricLabel="BIG Score" unit="%" fmt={(r) => r.bigScore} />
      {rows.length > 0 && (
        <InsightBox
          text={`Top BIG scorer is ${rows[0]?.name} at ${rows[0]?.bigScore}%. Highest-scoring SMEs are strongest candidates for Deal Close.`}
        />
      )}
    </Card>
  );
};

const HighestMatchScore = () => {
  const rows = placeholderRankings.topMatch;
  return (
    <Card title="Highest Match %">
      <RankedTable isTop rows={rows} metricLabel="Match %" unit="%" fmt={(r) => r.matchPct} />
      {rows.length > 0 && (
        <InsightBox
          text={`${rows[0]?.name} is the strongest programme fit at ${rows[0]?.matchPct}% match. Prioritise these SMEs for accelerated support.`}
        />
      )}
    </Card>
  );
};

const HighestFundability = () => {
  const rows = placeholderRankings.topBig.filter((r) => r.fundability > 0);
  return (
    <Card title="Highest Fundability Score">
      <RankedTable isTop rows={rows} metricLabel="Fundability" unit="%" fmt={(r) => r.fundability} />
      {rows.length > 0 && (
        <InsightBox text="High fundability SMEs have the strongest case for external capital. Consider facilitating investor introductions." />
      )}
    </Card>
  );
};

const HighestRevenue = () => {
  const perSME = placeholderRankings.revenuePerSME;
  const rows = perSME.map((s, idx) => ({ name: s.name, sector: s.sector, stage: s.profitability, value: idx }));
  return (
    <Card title="Highest Revenue SMEs">
      <RankedTable
        isTop
        rows={rows}
        metricLabel="Annual Revenue"
        unit=""
        fmt={(_, i) => (perSME[i] ? "R" + (perSME[i].revenue / 1000000).toFixed(1) + "M" : "–")}
      />
      {rows.length > 0 && (
        <InsightBox text="Revenue leaders in the portfolio are likely the most investable. Use their traction as case studies for other SMEs." />
      )}
    </Card>
  );
};

const LowestBIGScore = () => {
  const rows = placeholderRankings.bottomBig;
  return (
    <Card title="Lowest BIG Score">
      <RankedTable isTop={false} rows={rows} metricLabel="BIG Score" unit="%" fmt={(r) => r.bigScore} />
      {rows.length > 0 && (
        <InsightBox text="SMEs with the lowest BIG scores need targeted capability-building before the next assessment cycle." />
      )}
    </Card>
  );
};

const LowestMatchScore = () => {
  const rows = placeholderRankings.bottomMatch;
  return (
    <Card title="Lowest Match %">
      <RankedTable isTop={false} rows={rows} metricLabel="Match %" unit="%" fmt={(r) => r.matchPct} />
      {rows.length > 0 && (
        <InsightBox text="Low-match SMEs may need re-evaluation of programme fit. Consider tailored support tracks or alternative referrals." />
      )}
    </Card>
  );
};

const LowestComplianceScore = () => {
  const rows = placeholderRankings.lowCompliance;
  return (
    <Card title="Lowest Compliance Score">
      <RankedTable isTop={false} rows={rows} metricLabel="Compliance" unit="%" fmt={(r) => r.compliance} />
      {rows.length > 0 && (
        <InsightBox text="Non-compliant SMEs pose reputational risk. A compliance clinic covering tax, CIPC and labour law is recommended." />
      )}
    </Card>
  );
};

const LowestFundability = () => {
  const rows = placeholderRankings.lowFundability;
  return (
    <Card title="Lowest Fundability Score">
      <RankedTable isTop={false} rows={rows} metricLabel="Fundability" unit="%" fmt={(r) => r.fundability} />
      {rows.length > 0 && (
        <InsightBox text="These SMEs need urgent financial structuring support before being introduced to investors or funders." />
      )}
    </Card>
  );
};

const TopBottomSection = () => {
  const [sub, setSub] = useState("top-3");

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        <Pill label="Top 3" active={sub === "top-3"} onClick={() => setSub("top-3")} />
        <Pill label="Bottom 3" active={sub === "bottom-3"} onClick={() => setSub("bottom-3")} />
      </div>

      {sub === "top-3" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <HighestBIGScore />
          <HighestMatchScore />
          <HighestFundability />
          <HighestRevenue />
        </div>
      )}

      {sub === "bottom-3" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <LowestBIGScore />
          <LowestMatchScore />
          <LowestComplianceScore />
          <LowestFundability />
        </div>
      )}
    </div>
  );
};

// Main Performance Component
const Performance = () => {
  const [activeTab, setActiveTab] = useState("performance");

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          borderBottom: `1px solid ${B.lightGrey}`,
          paddingBottom: "12px",
        }}
      >
        <SubTab label="Performance" active={activeTab === "performance"} onClick={() => setActiveTab("performance")} />
        <SubTab label="Top / Bottom" active={activeTab === "topbottom"} onClick={() => setActiveTab("topbottom")} />
      </div>

      {activeTab === "performance" && <PerformanceSection />}
      {activeTab === "topbottom" && <TopBottomSection />}
    </div>
  );
};

export default Performance;