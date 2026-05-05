import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const B = {
  black: "#1a1a1a", darkGrey: "#4a4a4a", mediumGrey: "#7a7a7a", warmGrey: "#9e9e9e",
  lightGrey: "#c4c4c4", cream: "#f5f0e8", offwhite: "#faf8f5",
  brownDark: "#5c3d2e", brownMedium: "#8b694e", brownLight: "#b8957a", brownPale: "#d4bca8",
  white: "#ffffff",
};
const MIXED_COLORS = ["#5c3d2e","#4a4a4a","#8b694e","#7a7a7a","#b8957a","#c4c4c4","#d4bca8","#9e9e9e","#3d2a1f","#e0d6c8"];
const MEDALS = ["🥇","🥈","🥉"];
const WARN   = ["⚠️","🔸","🔹"];

// Dark tick colour — all charts sit on white cards
const TICK = "#4a4a4a";
const GRID = "#e8e8e8";

const SubTab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "6px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "12px", border: `1.5px solid ${active ? B.brownMedium : B.lightGrey}`, fontWeight: active ? 700 : 500, background: active ? B.brownMedium : "#fff", color: active ? "#fff" : B.darkGrey }}>
    {label}
  </button>
);

const Card = ({ title, footer, children }) => (
  <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", minHeight: "400px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: `1px solid ${B.lightGrey}`, display: "flex", flexDirection: "column" }}>
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "10px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.black, margin: 0 }}>{title}</h3>
    </div>
    <div style={{ flex: 1 }}>{children}</div>
    {footer && <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: `1px solid ${B.offwhite}`, fontSize: "11px", color: B.warmGrey }}>{footer}</div>}
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "4px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "10px", border: `1.5px solid ${active ? B.brownMedium : B.lightGrey}`, fontWeight: active ? 700 : 500, background: active ? B.brownMedium : "#fff", color: active ? "#fff" : B.darkGrey }}>
    {label}
  </button>
);

const EmptyState = ({ message }) => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.warmGrey, fontSize: "12px", fontStyle: "italic", textAlign: "center", padding: "1rem" }}>
    {message || "No data yet"}
  </div>
);

// Horizontal bar — dark labels (white card)
const hBarOpts = (valCb, integralOnly) => ({
  responsive: true, maintainAspectRatio: false, animation: false, indexAxis: "y",
  plugins: { legend: { display: false } },
  scales: {
    x: {
      beginAtZero: true, grid: { display: true, color: GRID },
      ticks: { color: TICK, font: { size: 10 }, ...(valCb ? { callback: valCb } : {}), ...(integralOnly && !valCb ? { callback: (v) => (Number.isInteger(v) ? v : ""), precision: 0, stepSize: 1 } : {}) },
    },
    y: { grid: { display: false }, ticks: { color: TICK, font: { size: 11 } } },
  },
});

// InsightBox
const InsightBox = ({ text }) => (
  <div style={{ marginTop: "12px", padding: "10px 12px", background: B.cream, borderRadius: "7px", border: `1px dashed ${B.lightGrey}`, fontSize: "12px", color: B.darkGrey, fontStyle: "italic", lineHeight: 1.5 }}>
    💡 {text}
  </div>
);

// Company-style ranked row — avatar with first letter, name + subtitle, metric on right
const CompanyRow = ({ rank, isTop, name, subtitle, sectorLabel, metric, metricLabel }) => {
  const icons = isTop ? MEDALS : WARN;
  // Avatar background cycles through brand colours
  const avatarBg = MIXED_COLORS[rank % MIXED_COLORS.length];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "12px 14px", borderRadius: "8px",
      background: "#ffffff", border: `1px solid ${B.lightGrey}`,
    }}>
      {/* Medal */}
      <span style={{ fontSize: "18px", minWidth: "24px" }}>{icons[rank]}</span>

      {/* Avatar */}
      <div style={{
        width: "40px", height: "40px",
        background: `linear-gradient(135deg, ${avatarBg}, ${MIXED_COLORS[(rank + 2) % MIXED_COLORS.length]})`,
        borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: "bold", fontSize: "16px", flexShrink: 0,
      }}>
        {name.charAt(0).toUpperCase()}
      </div>

      {/* Name block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {sectorLabel && (
          <div style={{ fontSize: "10px", color: B.brownMedium, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "2px" }}>
            {sectorLabel}
          </div>
        )}
        <div style={{ fontSize: "13px", fontWeight: "700", color: B.black, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        {subtitle && <div style={{ fontSize: "11px", color: B.warmGrey, marginTop: "2px" }}>{subtitle}</div>}
      </div>

      {/* Metric */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "16px", fontWeight: "800", color: isTop ? B.brownDark : "#9b3a1a" }}>{metric}</div>
        <div style={{ fontSize: "10px", color: B.warmGrey }}>{metricLabel}</div>
      </div>
    </div>
  );
};

// Ranked card wrapper
const RankedCard = ({ title, rows, isTop, insight }) => (
  <Card title={title}>
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {rows.map((row, i) => (
        <CompanyRow key={i} rank={i} isTop={isTop} name={row.name} subtitle={row.subtitle} sectorLabel={row.sectorLabel} metric={row.metric} metricLabel={row.metricLabel} />
      ))}
    </div>
    {insight && <InsightBox text={insight} />}
  </Card>
);

// ─── Data ─────────────────────────────────────────────────────────────────────
const placeholderMetrics = {
  revenue: {
    total: 125000000, avg: 2777777,
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
};

const topFunders = [
  { name: "ABSA Bank", sector: "Banking", totalInvestment: 42500000, dealsCount: 12, avgTicket: 3541666 },
  { name: "FNB", sector: "Banking", totalInvestment: 38500000, dealsCount: 10, avgTicket: 3850000 },
  { name: "Nedbank", sector: "Banking", totalInvestment: 31200000, dealsCount: 8, avgTicket: 3900000 },
  { name: "Development Bank of SA", sector: "Development Finance", totalInvestment: 28400000, dealsCount: 7, avgTicket: 4057142 },
  { name: "Knife Capital", sector: "Venture Capital", totalInvestment: 18900000, dealsCount: 5, avgTicket: 3780000 },
  { name: "Edge Growth", sector: "Impact Investor", totalInvestment: 15600000, dealsCount: 6, avgTicket: 2600000 },
];

const bottomFunders = [
  { name: "Small & Medium Enterprise Fund", sector: "SME Fund", totalInvestment: 1200000, dealsCount: 3, avgTicket: 400000 },
  { name: "Township Entrepreneurs Fund", sector: "Impact", totalInvestment: 980000, dealsCount: 4, avgTicket: 245000 },
  { name: "Women in Business Fund", sector: "Gender Lens", totalInvestment: 750000, dealsCount: 2, avgTicket: 375000 },
];

const topBySector = {
  "IT":          [{ name: "Knife Capital", totalInvestment: 18900000, dealsCount: 5 }, { name: "CRE Venture Capital", totalInvestment: 14200000, dealsCount: 4 }, { name: "4Di Capital", totalInvestment: 9800000, dealsCount: 3 }],
  "Logistics":   [{ name: "ABSA Bank", totalInvestment: 12500000, dealsCount: 6 }, { name: "IDC", totalInvestment: 9800000, dealsCount: 4 }, { name: "Sefa", totalInvestment: 6200000, dealsCount: 5 }],
  "Fintech":     [{ name: "FNB", totalInvestment: 22000000, dealsCount: 8 }, { name: "Nedbank", totalInvestment: 17500000, dealsCount: 6 }, { name: "Edge Growth", totalInvestment: 11400000, dealsCount: 4 }],
  "Agritech":    [{ name: "Development Bank of SA", totalInvestment: 16000000, dealsCount: 5 }, { name: "Jobs Fund", totalInvestment: 11200000, dealsCount: 4 }, { name: "Yellowwoods", totalInvestment: 8400000, dealsCount: 3 }],
  "Healthtech":  [{ name: "National Empowerment Fund", totalInvestment: 14500000, dealsCount: 4 }, { name: "Rising Tide", totalInvestment: 8900000, dealsCount: 3 }, { name: "AHL Venture Partners", totalInvestment: 7200000, dealsCount: 2 }],
  "Clean Energy":[{ name: "IDC", totalInvestment: 19600000, dealsCount: 6 }, { name: "Edge Growth", totalInvestment: 12300000, dealsCount: 4 }, { name: "ABSA Bank", totalInvestment: 9100000, dealsCount: 3 }],
};

// ─── Top/Bottom Section ───────────────────────────────────────────────────────
const TopBottomSection = () => {
  const [sub, setSub] = useState("top");

  // Top 3 by investment
  const topInvestmentRows = [...topFunders]
    .sort((a, b) => b.totalInvestment - a.totalInvestment).slice(0, 3)
    .map((f) => ({ name: f.name, subtitle: `${f.dealsCount} deals · ${f.sector}`, metric: `R${(f.totalInvestment / 1_000_000).toFixed(1)}M`, metricLabel: "Total Invested" }));

  // Top 3 by sector — leader per sector, sorted by investment
  const topSectorRows = Object.entries(topBySector)
    .map(([sector, funders]) => ({ sectorLabel: sector, name: funders[0].name, subtitle: `${funders[0].dealsCount} deals`, metric: `R${(funders[0].totalInvestment / 1_000_000).toFixed(1)}M`, metricLabel: "Invested" }))
    .sort((a, b) => parseFloat(b.metric) - parseFloat(a.metric)).slice(0, 3);

  // Top 3 by deal count
  const topActivityRows = [...topFunders]
    .sort((a, b) => b.dealsCount - a.dealsCount).slice(0, 3)
    .map((f) => ({ name: f.name, subtitle: `R${(f.avgTicket / 1_000_000).toFixed(1)}M avg ticket · ${f.sector}`, metric: `${f.dealsCount} deals`, metricLabel: "Deals Closed" }));

  // Bottom 3 by investment
  const bottomInvestmentRows = [...bottomFunders]
    .sort((a, b) => a.totalInvestment - b.totalInvestment).slice(0, 3)
    .map((f) => ({ name: f.name, subtitle: `${f.dealsCount} deals · ${f.sector}`, metric: `R${(f.totalInvestment / 1_000_000).toFixed(2)}M`, metricLabel: "Total Invested" }));

  // Bottom 3 by sector — last per sector
  const bottomSectorRows = Object.entries(topBySector)
    .map(([sector, funders]) => { const b = funders[funders.length - 1]; return { sectorLabel: sector, name: b.name, subtitle: `${b.dealsCount} deals`, metric: `R${(b.totalInvestment / 1_000_000).toFixed(1)}M`, metricLabel: "Invested" }; })
    .sort((a, b) => parseFloat(a.metric) - parseFloat(b.metric)).slice(0, 3);

  // Bottom 3 by deal count
  const bottomActivityRows = [...bottomFunders]
    .sort((a, b) => a.dealsCount - b.dealsCount).slice(0, 3)
    .map((f) => ({ name: f.name, subtitle: `R${(f.totalInvestment / 1_000_000).toFixed(1)}M total · ${f.sector}`, metric: `${f.dealsCount} deals`, metricLabel: "Deals Closed" }));

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <Pill label="🏆 Top 3" active={sub === "top"} onClick={() => setSub("top")} />
        <Pill label="⚠️ Bottom 3" active={sub === "bottom"} onClick={() => setSub("bottom")} />
      </div>

      {sub === "top" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <RankedCard title="Top Investment" rows={topInvestmentRows} isTop insight={`${topInvestmentRows[0]?.name} leads with ${topInvestmentRows[0]?.metric} deployed. Top 3 account for the majority of total investment.`} />
          <RankedCard title="Top Investment by Sector" rows={topSectorRows} isTop insight={`${topSectorRows[0]?.sectorLabel} leads sector investment with ${topSectorRows[0]?.name} as the top contributor.`} />
          <RankedCard title="Top Activity" rows={topActivityRows} isTop insight={`${topActivityRows[0]?.name} is the most active with ${topActivityRows[0]?.metric} closed.`} />
        </div>
      )}

      {sub === "bottom" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <RankedCard title="Bottom Investment" rows={bottomInvestmentRows} isTop={false} insight="These contributors have deployed less than R2M each. May suit micro and early-stage SMEs." />
          <RankedCard title="Bottom Investment by Sector" rows={bottomSectorRows} isTop={false} insight={`${bottomSectorRows[0]?.sectorLabel} has the lowest sector investment. Consider targeted incentives to attract more capital.`} />
          <RankedCard title="Bottom Activity" rows={bottomActivityRows} isTop={false} insight="Low deal counts indicate limited engagement. Strategies to increase participation could unlock additional capacity." />
        </div>
      )}
    </div>
  );
};

// ─── Performance Cards ────────────────────────────────────────────────────────
const RevenuePerSME = () => {
  const perSME = [...placeholderMetrics.revenue.perSME].sort((a, b) => b.revenue - a.revenue);
  const innerH = Math.max(280, perSME.length * 36);
  const footer = (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: "12px", color: B.black, fontWeight: 600 }}>Total: <strong>R{(placeholderMetrics.revenue.total / 1_000_000).toFixed(1)}M</strong></span>
      <span style={{ fontSize: "12px", color: B.warmGrey }}>Avg: R{(placeholderMetrics.revenue.avg / 1_000_000).toFixed(1)}M / SME</span>
    </div>
  );
  return (
    <Card title="Net Profit per SME" footer={footer}>
      <div style={{ height: `${innerH}px` }}>
        <Bar
          options={hBarOpts((v) => "R" + (v / 1_000_000).toFixed(1) + "M")}
          data={{ labels: perSME.map((s) => s.name), datasets: [{ label: "Revenue", data: perSME.map((s) => s.revenue), backgroundColor: MIXED_COLORS.slice(0, perSME.length) }] }}
        />
      </div>
    </Card>
  );
};

const ProfitabilityStatus = () => {
  const perSME = placeholderMetrics.revenue.perSME;
  const statusCounts = perSME.reduce((acc, s) => { acc[s.profitability] = (acc[s.profitability] || 0) + 1; return acc; }, {});
  const sorted = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  const total = perSME.length;
  const statusColors = { Profitable: "#2e7d32", Breakeven: "#ed6c02", "Pre-revenue": MIXED_COLORS[6], Unprofitable: "#c62828" };
  return (
    <Card title="Profitability Status">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center" }}>
        {sorted.map(([l, v], i) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: statusColors[l] || MIXED_COLORS[i], flexShrink: 0 }} />
            <div style={{ flex: 1, background: B.lightGrey, borderRadius: "4px", height: "24px", overflow: "hidden" }}>
              <div style={{ width: `${(v / total) * 100}%`, background: statusColors[l] || MIXED_COLORS[i], height: "100%", display: "flex", alignItems: "center", paddingLeft: "8px" }}>
                <span style={{ fontSize: "11px", color: "#fff", fontWeight: 600 }}>{v}</span>
              </div>
            </div>
            <span style={{ fontSize: "12px", color: B.darkGrey, minWidth: "90px" }}>{l}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

const ClientsPerSME = () => {
  const smeClients = [
    { name: "TechSolve", count: 8 }, { name: "GreenEnergy", count: 6 }, { name: "HealthPlus", count: 5 },
    { name: "EduTech", count: 4 }, { name: "LogiSync", count: 3 }, { name: "AgriGrow", count: 2 },
  ].sort((a, b) => b.count - a.count);
  const innerH = Math.max(280, smeClients.length * 36);
  return (
    <Card title="Key Clients per SME">
      <div style={{ height: `${innerH}px` }}>
        <Bar
          options={hBarOpts(null, true)}
          data={{ labels: smeClients.map((s) => s.name), datasets: [{ label: "# Key Clients", data: smeClients.map((s) => s.count), backgroundColor: MIXED_COLORS.slice(0, smeClients.length) }] }}
        />
      </div>
    </Card>
  );
};

const PerformanceSection = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
    <RevenuePerSME />
    <ProfitabilityStatus />
    <ClientsPerSME />
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const Performance = () => {
  const [activeTab, setActiveTab] = useState("performance");
  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: `1px solid ${B.lightGrey}`, paddingBottom: "12px" }}>
        <SubTab label="Performance" active={activeTab === "performance"} onClick={() => setActiveTab("performance")} />
        <SubTab label="Top / Bottom" active={activeTab === "topbottom"} onClick={() => setActiveTab("topbottom")} />
      </div>
      {activeTab === "performance" && <PerformanceSection />}
      {activeTab === "topbottom" && <TopBottomSection />}
    </div>
  );
};

export default Performance;