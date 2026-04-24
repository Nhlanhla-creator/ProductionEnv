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
  <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", minHeight: "380px", boxShadow: "0 2px 10px rgba(59,36,9,0.07)", border: `1px solid ${B.pale}`, display: "flex", flexDirection: "column" }}>
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

const TrendIcon = ({ growth }) => (
  <span style={{ color: growth >= 0 ? "#2e7d32" : "#c62828", fontSize: "11px", marginLeft: "6px" }}>
    {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}%
  </span>
);

const doughnutOpts = {
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 10 }, boxWidth: 10 } } },
};

const stackedBarOpts = (xTitle) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 9 }, boxWidth: 10 } } },
  scales: {
    x: { stacked: true, title: { display: true, text: xTitle, color: B.dark, font: { size: 10 } }, ticks: { color: B.dark, font: { size: 9 } } },
    y: { stacked: true, beginAtZero: true, grid: { color: B.offwhite }, ticks: { color: B.dark, callback: v => v.toLocaleString() } },
  },
});

const vBarOpts = (yCb) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { title: { display: true, text: "Year", color: B.dark }, grid: { display: false }, ticks: { color: B.dark, font: { size: 9 } } },
    y: { title: { display: true, text: "Amount (ZAR M)", color: B.dark }, beginAtZero: true, grid: { color: B.offwhite }, ticks: { color: B.dark, callback: yCb || (v => v) } },
  },
});

const CapitalFlow = () => {
  const { marketPulse } = usePortfolio();
  const [activeSubTab, setActiveSubTab] = useState("deployment");

  const capital = marketPulse?.capitalFlow?.capitalDeployment?.totalCapital || { current: 410, yoyGrowth: 6.5, history: [280, 310, 385, 410] };
  const deals = marketPulse?.capitalFlow?.capitalDeployment?.numberOfDeals || { current: 62, yoyGrowth: 10.7, history: [42, 48, 56, 62] };
  const avgFundSize = marketPulse?.capitalFlow?.fundraising?.avgFundSize || { current: 45, yoyGrowth: 12.5 };
  const fundStatus = marketPulse?.capitalFlow?.fundraising?.fundStatus || { open: { count: 18, value: 420 }, closed: { count: 32, value: 580 } };
  const fundsVsDeployed = marketPulse?.capitalFlow?.fundraising?.fundsVsDeployed || { years: ["2022", "2023", "2024", "2025"], raised: [240, 280, 320, 360], deployed: [280, 310, 385, 410] };
  const sources = marketPulse?.capitalFlow?.fundraising?.sources || { "Entities/Individuals": 35, "Corporates": 28, "DFIs": 22, "Fund of Funds": 15 };
  const purposes = marketPulse?.capitalFlow?.fundraising?.purposes || { "Own ring-fenced": 40, "Own balance sheet": 25, "Deal by deal": 35 };

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: `1px solid ${B.pale}`, paddingBottom: "12px" }}>
        <SubTab label="Capital Deployment" active={activeSubTab === "deployment"} onClick={() => setActiveSubTab("deployment")} />
        <SubTab label="Fundraising & Investment" active={activeSubTab === "fundraising"} onClick={() => setActiveSubTab("fundraising")} />
      </div>

      {activeSubTab === "deployment" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <Card title="Total Capital Deployed (ZAR)">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
              <div style={{ fontSize: "44px", fontWeight: "800", color: B.darkest }}>R {capital.current}M</div>
              <div style={{ fontSize: "12px", color: B.medium }}>YoY Growth <TrendIcon growth={capital.yoyGrowth} /></div>
              <div style={{ width: "100%", height: "220px" }}>
                <Bar options={vBarOpts(v => `R${v}M`)} data={{ labels: ["2022", "2023", "2024", "2025"], datasets: [{ label: "Capital Deployed", data: capital.history, backgroundColor: B.darkest }] }} />
              </div>
            </div>
          </Card>

          <Card title="Number of Deals">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
              <div style={{ fontSize: "44px", fontWeight: "800", color: B.darkest }}>{deals.current}</div>
              <div style={{ fontSize: "12px", color: B.medium }}>YoY Growth <TrendIcon growth={deals.yoyGrowth} /></div>
              <div style={{ width: "100%", height: "220px" }}>
                <Bar options={vBarOpts()} data={{ labels: ["2022", "2023", "2024", "2025"], datasets: [{ label: "Number of Deals", data: deals.history, backgroundColor: B.darkest }] }} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeSubTab === "fundraising" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <Card title="Average Fund Size (ZAR M)">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <div style={{ fontSize: "44px", fontWeight: "800", color: B.darkest }}>R {avgFundSize.current}M</div>
              <div style={{ fontSize: "12px", color: B.medium, marginTop: "8px" }}>YoY Growth <TrendIcon growth={avgFundSize.yoyGrowth} /></div>
            </div>
          </Card>

          <Card title="Fund Status">
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
                <div><div style={{ fontSize: "28px", fontWeight: 700, color: B.dark }}>{fundStatus.open.count}</div><div style={{ fontSize: "11px", color: B.warm }}>Open Funds</div><div style={{ fontSize: "13px", fontWeight: 600 }}>R {fundStatus.open.value}M</div></div>
                <div><div style={{ fontSize: "28px", fontWeight: 700, color: B.dark }}>{fundStatus.closed.count}</div><div style={{ fontSize: "11px", color: B.warm }}>Closed Funds</div><div style={{ fontSize: "13px", fontWeight: 600 }}>R {fundStatus.closed.value}M</div></div>
              </div>
              <div style={{ height: "200px" }}>
                <Doughnut options={doughnutOpts} data={{ labels: ["Open (ZAR M)", "Closed (ZAR M)"], datasets: [{ data: [fundStatus.open.value, fundStatus.closed.value], backgroundColor: [B.medium, B.pale] }] }} />
              </div>
            </div>
          </Card>

          <Card title="Funds Raised vs Capital Deployed">
            <div style={{ height: "300px" }}>
              <Bar options={stackedBarOpts("Year")} data={{ labels: fundsVsDeployed.years, datasets: [{ label: "Funds Raised", data: fundsVsDeployed.raised, backgroundColor: B.medium }, { label: "Capital Deployed", data: fundsVsDeployed.deployed, backgroundColor: B.light }] }} />
            </div>
          </Card>

          <Card title="Sources of Funds Raised">
            <div style={{ height: "300px" }}>
              <Doughnut options={doughnutOpts} data={{ labels: Object.keys(sources), datasets: [{ data: Object.values(sources), backgroundColor: C }] }} />
            </div>
          </Card>

          <Card title="Purpose of Funds Raised">
            <div style={{ height: "300px" }}>
              <Doughnut options={doughnutOpts} data={{ labels: Object.keys(purposes), datasets: [{ data: Object.values(purposes), backgroundColor: C }] }} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CapitalFlow;