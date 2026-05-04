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

// NEW: Funder-focused placeholder data
const placeholderFundersData = {
  topFunders: [
    { name: "ABSA Bank", sector: "Banking", totalInvestment: 42500000, dealsCount: 12, avgTicket: 3541666 },
    { name: "FNB", sector: "Banking", totalInvestment: 38500000, dealsCount: 10, avgTicket: 3850000 },
    { name: "Nedbank", sector: "Banking", totalInvestment: 31200000, dealsCount: 8, avgTicket: 3900000 },
    { name: "Development Bank of SA", sector: "Development Finance", totalInvestment: 28400000, dealsCount: 7, avgTicket: 4057142 },
    { name: "Knife Capital", sector: "Venture Capital", totalInvestment: 18900000, dealsCount: 5, avgTicket: 3780000 },
    { name: "Edge Growth", sector: "Impact Investor", totalInvestment: 15600000, dealsCount: 6, avgTicket: 2600000 },
  ],
  topFundersBySector: {
    "Banking": [
      { name: "ABSA Bank", totalInvestment: 42500000, dealsCount: 12 },
      { name: "FNB", totalInvestment: 38500000, dealsCount: 10 },
      { name: "Nedbank", totalInvestment: 31200000, dealsCount: 8 },
      { name: "Standard Bank", totalInvestment: 28400000, dealsCount: 7 },
      { name: "Capitec", totalInvestment: 12500000, dealsCount: 4 },
    ],
    "Venture Capital": [
      { name: "Knife Capital", totalInvestment: 18900000, dealsCount: 5 },
      { name: "CRE Venture Capital", totalInvestment: 14200000, dealsCount: 4 },
      { name: "HAVAÍC", totalInvestment: 12300000, dealsCount: 4 },
      { name: "4Di Capital", totalInvestment: 9800000, dealsCount: 3 },
      { name: "Savant", totalInvestment: 7600000, dealsCount: 3 },
    ],
    "Development Finance": [
      { name: "Development Bank of SA", totalInvestment: 28400000, dealsCount: 7 },
      { name: "IDC", totalInvestment: 26700000, dealsCount: 6 },
      { name: "National Empowerment Fund", totalInvestment: 18900000, dealsCount: 5 },
      { name: "Sefa", totalInvestment: 14500000, dealsCount: 8 },
      { name: "Jobs Fund", totalInvestment: 11200000, dealsCount: 4 },
    ],
    "Impact Investor": [
      { name: "Edge Growth", totalInvestment: 15600000, dealsCount: 6 },
      { name: "Yellowwoods", totalInvestment: 13400000, dealsCount: 4 },
      { name: "Rising Tide", totalInvestment: 8900000, dealsCount: 3 },
      { name: "AHL Venture Partners", totalInvestment: 7200000, dealsCount: 2 },
    ],
  },
  bottomFunders: [
    { name: "Small & Medium Enterprise Fund", sector: "SME Fund", totalInvestment: 1200000, dealsCount: 3, avgTicket: 400000 },
    { name: "Township Entrepreneurs Fund", sector: "Impact", totalInvestment: 980000, dealsCount: 4, avgTicket: 245000 },
    { name: "Women in Business Fund", sector: "Gender Lens", totalInvestment: 750000, dealsCount: 2, avgTicket: 375000 },
    { name: "Rural Development Fund", sector: "Development", totalInvestment: 520000, dealsCount: 2, avgTicket: 260000 },
    { name: "Youth Enterprise Fund", sector: "Youth Focus", totalInvestment: 380000, dealsCount: 3, avgTicket: 126666 },
  ],
};

// Funder Ranking Components

const TopFundersByInvestment = () => {
  const rows = placeholderFundersData.topFunders;
  return (
    <Card title="💰 Top Funders by Investment">
      <RankedTable 
        isTop 
        rows={rows} 
        metricLabel="Total Investment" 
        unit="" 
        fmt={(r) => "R" + (r.totalInvestment / 1_000_000).toFixed(1) + "M"} 
      />
      {rows.length > 0 && (
        <InsightBox
          text={`${rows[0]?.name} leads with R${(rows[0]?.totalInvestment / 1_000_000).toFixed(1)}M deployed across ${rows[0]?.dealsCount} deals. Top 3 funders represent ${((rows.slice(0,3).reduce((sum, f) => sum + f.totalInvestment, 0) / rows.reduce((sum, f) => sum + f.totalInvestment, 0)) * 100).toFixed(0)}% of total investment volume.`}
        />
      )}
    </Card>
  );
};

const TopFundersBySector = () => {
  const [selectedSector, setSelectedSector] = useState("Banking");
  const sectors = Object.keys(placeholderFundersData.topFundersBySector);
  const currentSectorData = placeholderFundersData.topFundersBySector[selectedSector] || [];
  
  const rows = currentSectorData.map(f => ({
    name: f.name,
    sector: selectedSector,
    stage: `${f.dealsCount} deals`,
    value: f.totalInvestment
  }));

  return (
    <Card title="🏆 Top Funders by Sector">
      <div style={{ marginBottom: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {sectors.map(sector => (
          <Pill 
            key={sector}
            label={sector} 
            active={selectedSector === sector} 
            onClick={() => setSelectedSector(sector)} 
          />
        ))}
      </div>
      <RankedTable 
        isTop 
        rows={rows} 
        metricLabel="Investment" 
        unit="" 
        fmt={(r) => "R" + (r.value / 1_000_000).toFixed(1) + "M"} 
      />
      {rows.length > 0 && (
        <InsightBox
          text={`In ${selectedSector}, ${rows[0]?.name} leads with R${(rows[0]?.value / 1_000_000).toFixed(1)}M. Consider deepening relationships with top performers in each sector.`}
        />
      )}
    </Card>
  );
};

const TopFundersByDealCount = () => {
  const rows = [...placeholderFundersData.topFunders]
    .sort((a, b) => b.dealsCount - a.dealsCount)
    .slice(0, 5);
  
  const enhancedRows = rows.map(f => ({
    name: f.name,
    sector: f.sector,
    stage: `R${(f.avgTicket / 1_000_000).toFixed(1)}M avg`,
    value: f.dealsCount
  }));

  return (
    <Card title="📊 Most Active Funders (By Deal Count)">
      <RankedTable 
        isTop 
        rows={enhancedRows} 
        metricLabel="# Deals" 
        unit="" 
        fmt={(r) => r.value} 
      />
      {rows.length > 0 && (
        <InsightBox
          text={`${rows[0]?.name} has completed ${rows[0]?.dealsCount} deals with average ticket of R${(rows[0]?.avgTicket / 1_000_000).toFixed(1)}M. These funders are most engaged with the SME ecosystem.`}
        />
      )}
    </Card>
  );
};

const TopFundersByAvgTicket = () => {
  const rows = [...placeholderFundersData.topFunders]
    .sort((a, b) => b.avgTicket - a.avgTicket)
    .slice(0, 5);
  
  const enhancedRows = rows.map(f => ({
    name: f.name,
    sector: f.sector,
    stage: `${f.dealsCount} deals total`,
    value: f.avgTicket
  }));

  return (
    <Card title="💎 Highest Average Investment per Deal">
      <RankedTable 
        isTop 
        rows={enhancedRows} 
        metricLabel="Avg Ticket" 
        unit="" 
        fmt={(r) => "R" + (r.value / 1_000_000).toFixed(2) + "M"} 
      />
      {rows.length > 0 && (
        <InsightBox
          text={`${rows[0]?.name} provides the largest average deal size at R${(rows[0]?.avgTicket / 1_000_000).toFixed(2)}M. Ideal partners for scaling mature SMEs.`}
        />
      )}
    </Card>
  );
};

const BottomFundersByInvestment = () => {
  const rows = placeholderFundersData.bottomFunders;
  return (
    <Card title="📉 Bottom Funders by Investment">
      <RankedTable 
        isTop={false} 
        rows={rows} 
        metricLabel="Total Investment" 
        unit="" 
        fmt={(r) => "R" + (r.totalInvestment / 1_000_000).toFixed(2) + "M"} 
      />
      {rows.length > 0 && (
        <InsightBox
          text={`Bottom-tier funders have deployed < R2M each. These funds may need capacity building or could be better suited for smaller, earlier-stage SMEs.`}
        />
      )}
    </Card>
  );
};

const BottomFundersByDealVolume = () => {
  const rows = [...placeholderFundersData.bottomFunders]
    .sort((a, b) => a.dealsCount - b.dealsCount)
    .slice(0, 5);
  
  const enhancedRows = rows.map(f => ({
    name: f.name,
    sector: f.sector,
    stage: `R${(f.totalInvestment / 1_000_000).toFixed(1)}M total`,
    value: f.dealsCount
  }));

  return (
    <Card title="📉 Least Active Funders">
      <RankedTable 
        isTop={false} 
        rows={enhancedRows} 
        metricLabel="# Deals" 
        unit="" 
        fmt={(r) => r.value} 
      />
      {rows.length > 0 && (
        <InsightBox
          text={`These funders have completed the fewest deals. Consider engagement strategies to increase their participation in the SME funding ecosystem.`}
        />
      )}
    </Card>
  );
};

const BottomFundersByAvgTicket = () => {
  const rows = [...placeholderFundersData.bottomFunders]
    .sort((a, b) => a.avgTicket - b.avgTicket)
    .slice(0, 5);
  
  const enhancedRows = rows.map(f => ({
    name: f.name,
    sector: f.sector,
    stage: `${f.dealsCount} deals`,
    value: f.avgTicket
  }));

  return (
    <Card title="📉 Lowest Average Investment">
      <RankedTable 
        isTop={false} 
        rows={enhancedRows} 
        metricLabel="Avg Ticket" 
        unit="" 
        fmt={(r) => "R" + (r.value / 1_000_000).toFixed(2) + "M"} 
      />
      {rows.length > 0 && (
        <InsightBox
          text={`Low average ticket sizes (< R500K) suggest these funders focus on micro-enterprises. Useful for early-stage pipeline but may not suit scaling SMEs.`}
        />
      )}
    </Card>
  );
};

// Updated TopBottomSection focused on Funders
const TopBottomSection = () => {
  const [sub, setSub] = useState("top-3");

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        <Pill label="🏆 Top Funders" active={sub === "top-3"} onClick={() => setSub("top-3")} />
        <Pill label="⚠️ Bottom Funders" active={sub === "bottom-3"} onClick={() => setSub("bottom-3")} />
      </div>

      {sub === "top-3" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <TopFundersByInvestment />
          <TopFundersBySector />
          <TopFundersByDealCount />
          <TopFundersByAvgTicket />
        </div>
      )}

      {sub === "bottom-3" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <BottomFundersByInvestment />
          <BottomFundersByDealVolume />
          <BottomFundersByAvgTicket />
        </div>
      )}
    </div>
  );
};

// Performance Sub-components (unchanged from original)
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