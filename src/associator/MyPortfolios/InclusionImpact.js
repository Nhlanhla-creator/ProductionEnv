import React, { useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, LineElement, PointElement } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, LineElement, PointElement);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882", "#d4c4b0", "#a08060"];

const Card = ({ title, children }) => (
  <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", minHeight: "420px", boxShadow: "0 2px 10px rgba(59,36,9,0.07)", border: `1px solid ${B.pale}`, display: "flex", flexDirection: "column" }}>
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

const hBarOpts = () => ({
  responsive: true, maintainAspectRatio: false, animation: false, indexAxis: "y",
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, grid: { display: true, color: B.offwhite }, ticks: { color: B.dark, font: { size: 9 } } },
    y: { grid: { display: false }, ticks: { color: B.dark, font: { size: 10 } } },
  },
});

const lineOpts = () => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 9 } } } },
  scales: { y: { beginAtZero: true, grid: { color: B.offwhite }, ticks: { color: B.dark } }, x: { ticks: { color: B.dark } } },
});

const InclusionImpact = () => {
  const { marketPulse } = usePortfolio();
  const [beneficiaryType, setBeneficiaryType] = useState("female");

  const beneficiaries = marketPulse?.marketStructure?.inclusionImpact?.beneficiaries || {
    female: { zarPct: 32, countPct: 35, trend: [28, 30, 32, 35] },
    youth: { zarPct: 28, countPct: 30, trend: [22, 25, 28, 30] },
    hdi: { zarPct: 52, countPct: 55, trend: [45, 48, 52, 55] },
    disabled: { zarPct: 4, countPct: 6, trend: [2, 3, 3, 4] }
  };
  const supportOffered = marketPulse?.marketStructure?.inclusionImpact?.supportOffered || { "Strategic Guidance": 45, "Networks/Access": 38, "Financial Advisory": 32, "Legal Support": 25, "Marketing Support": 28, "Operations": 20 };
  const topRequests = marketPulse?.marketStructure?.inclusionImpact?.topRequests || ["Strategic Guidance", "Networks/Access", "Financial Advisory"];
  const bottomRequests = marketPulse?.marketStructure?.inclusionImpact?.bottomRequests || ["Legal Support", "Operations", "Marketing Support"];

  const beneficiaryLabels = { female: "Female", youth: "Youth", hdi: "HDI", disabled: "Disabled" };
  const current = beneficiaries[beneficiaryType];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
        <Card title="Beneficiary Demographics">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
              <Pill label="Female" active={beneficiaryType === "female"} onClick={() => setBeneficiaryType("female")} />
              <Pill label="Youth" active={beneficiaryType === "youth"} onClick={() => setBeneficiaryType("youth")} />
              <Pill label="HDI" active={beneficiaryType === "hdi"} onClick={() => setBeneficiaryType("hdi")} />
              <Pill label="Disabled" active={beneficiaryType === "disabled"} onClick={() => setBeneficiaryType("disabled")} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: "11px", color: B.warm }}>By ZAR</div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: B.dark }}>{current.zarPct}%</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: B.warm }}>By Count</div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: B.dark }}>{current.countPct}%</div>
              </div>
            </div>
            <div style={{ height: "160px" }}>
              <Line options={lineOpts()} data={{ labels: ["2022", "2023", "2024", "2025"], datasets: [{ label: `${beneficiaryLabels[beneficiaryType]} Beneficiaries (%)`, data: current.trend, borderColor: B.medium, backgroundColor: "transparent", tension: 0.3, fill: false }] }} />
            </div>
          </div>
        </Card>

        <Card title="Additional Support / Advice Offered">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
            <div style={{ height: "200px" }}>
              <Bar options={hBarOpts()} data={{ labels: Object.keys(supportOffered), datasets: [{ label: "% of SMEs", data: Object.values(supportOffered), backgroundColor: B.medium }] }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "10px" }}>
              <div style={{ background: B.offwhite, padding: "8px", borderRadius: "6px" }}>
                <strong>Top 3 Most Requested:</strong><br />
                {topRequests.map((r, i) => `${i + 1}. ${r}`).join("\n")}
              </div>
              <div style={{ background: B.offwhite, padding: "8px", borderRadius: "6px" }}>
                <strong>Bottom 3 Most Requested:</strong><br />
                {bottomRequests.map((r, i) => `${i + 1}. ${r}`).join("\n")}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InclusionImpact;