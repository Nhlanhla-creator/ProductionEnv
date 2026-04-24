import React, { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882", "#d4c4b0", "#a08060"];

const SubTab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "6px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "12px", border: `1.5px solid ${active ? B.medium : B.pale}`, fontWeight: active ? 700 : 500, background: active ? B.medium : "#fff", color: active ? "#fff" : B.medium }}>
    {label}
  </button>
);

const Card = ({ title, children }) => (
  <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", minHeight: "400px", boxShadow: "0 2px 10px rgba(59,36,9,0.07)", border: `1px solid ${B.pale}`, display: "flex", flexDirection: "column" }}>
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "10px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.dark, margin: 0 }}>{title}</h3>
    </div>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "4px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "10px", border: `1.5px solid ${active ? B.medium : B.pale}`, fontWeight: active ? 700 : 500, background: active ? B.medium : "#fff", color: active ? "#fff" : B.medium }}>
    {label}
  </button>
);

const doughnutOpts = {
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 9 }, boxWidth: 8 } } },
};

const vBarOpts = (yCb) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { title: { display: true, text: "Range", color: B.dark }, grid: { display: false }, ticks: { color: B.dark, font: { size: 8 } } },
    y: { title: { display: true, text: "Number of Deals", color: B.dark }, beginAtZero: true, grid: { color: B.offwhite }, ticks: { color: B.dark, callback: yCb || (v => v) } },
  },
});

const TrendIcon = ({ growth }) => (
  <span style={{ color: growth >= 0 ? "#2e7d32" : "#c62828", fontSize: "11px", marginLeft: "6px" }}>
    {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}%
  </span>
);

const DealStructure = () => {
  const { marketPulse } = usePortfolio();
  const [activeSubTab, setActiveSubTab] = useState("fund-type");
  const [fundView, setFundView] = useState("zar");

  const fundTypeAlloc = marketPulse?.marketStructure?.dealStructure?.fundType?.allocation || { Grant: 15, Equity: 55, Debt: 25, Convertible: 5 };
  const fundTypeDist = marketPulse?.marketStructure?.dealStructure?.fundType?.distribution || { Grant: 30, Equity: 40, Debt: 20, Convertible: 10 };

  const avgDealSize = marketPulse?.marketStructure?.dealStructure?.dealSize?.avg || { current: 12.5, yoyGrowth: 8.2 };
  const dealSizeDist = marketPulse?.marketStructure?.dealStructure?.dealSize?.distribution || { "<R1M": 15, "R1-5M": 35, "R5-10M": 28, "R10-20M": 15, "R20M+": 7 };
  const avgDealsPerInvestor = marketPulse?.marketStructure?.dealStructure?.dealSize?.avgDealsPerInvestor || { current: 3.8, yoyGrowth: 5.6 };

  const equitySizeDist = marketPulse?.marketStructure?.dealStructure?.equity?.sizeDistribution || { "<R1M": 20, "R1-5M": 40, "R5-10M": 25, "R10-20M": 10, "R20M+": 5 };
  const equityPctDist = marketPulse?.marketStructure?.dealStructure?.equity?.pctDistribution || { "0-10%": 25, "10-20%": 40, "20-30%": 20, "30-50%": 10, "50%+": 5 };

  const currentFundData = fundView === "zar" ? fundTypeAlloc : fundTypeDist;

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: `1px solid ${B.pale}`, paddingBottom: "12px" }}>
        <SubTab label="Fund Type" active={activeSubTab === "fund-type"} onClick={() => setActiveSubTab("fund-type")} />
        <SubTab label="Deal Size" active={activeSubTab === "deal-size"} onClick={() => setActiveSubTab("deal-size")} />
        <SubTab label="Equity Preferences" active={activeSubTab === "equity"} onClick={() => setActiveSubTab("equity")} />
      </div>

      {activeSubTab === "fund-type" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <Card title="Fund Type Concentration">
            <div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "12px" }}>
                <Pill label="By ZAR" active={fundView === "zar"} onClick={() => setFundView("zar")} />
                <Pill label="By Count" active={fundView === "count"} onClick={() => setFundView("count")} />
              </div>
              <div style={{ height: "320px" }}>
                <Doughnut options={doughnutOpts} data={{ labels: Object.keys(currentFundData), datasets: [{ data: Object.values(currentFundData), backgroundColor: C }] }} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeSubTab === "deal-size" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <Card title="Average Deal Size">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
              <div style={{ fontSize: "44px", fontWeight: "800", color: B.darkest }}>R {avgDealSize.current}M</div>
              <div style={{ fontSize: "12px", color: B.medium }}>YoY Growth <TrendIcon growth={avgDealSize.yoyGrowth} /></div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: B.dark, marginTop: "20px" }}>{avgDealsPerInvestor.current} avg deals per investor</div>
              <div style={{ fontSize: "11px", color: B.medium }}>YoY Growth <TrendIcon growth={avgDealsPerInvestor.yoyGrowth} /></div>
            </div>
          </Card>

          <Card title="Deal Size Distribution">
            <div style={{ height: "320px" }}>
              <Bar options={vBarOpts(v => `R${v}M`)} data={{ labels: Object.keys(dealSizeDist), datasets: [{ label: "Number of Deals", data: Object.values(dealSizeDist), backgroundColor: B.darkest }] }} />
            </div>
          </Card>
        </div>
      )}

      {activeSubTab === "equity" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <Card title="Equity Size Distribution">
            <div style={{ height: "320px" }}>
              <Bar options={vBarOpts(v => `R${v}M`)} data={{ labels: Object.keys(equitySizeDist), datasets: [{ label: "Number of Deals", data: Object.values(equitySizeDist), backgroundColor: B.darkest }] }} />
            </div>
          </Card>

          <Card title="Equity Percentage Distribution">
            <div style={{ height: "320px" }}>
              <Bar options={vBarOpts(v => v)} data={{ labels: Object.keys(equityPctDist), datasets: [{ label: "Number of Deals", data: Object.values(equityPctDist), backgroundColor: B.medium }] }} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DealStructure;