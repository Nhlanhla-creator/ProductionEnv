import React, { useState } from "react";
import { usePortfolio } from "../../context/PortfolioContext";
import CapitalFlow from "./CapitalFlow";
import MarketStructure from "./MarketStructure";
import DealStructure from "./DealStructure";
import InclusionImpact from "./InclusionImpact";
import LiquidityExits from "./LiquidityExits";

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };

const MainTab = ({ label, active, onClick }) => (
  <button 
    onClick={onClick} 
    style={{ 
      padding: "10px 28px", 
      borderRadius: "30px", 
      cursor: "pointer", 
      fontSize: "14px", 
      fontWeight: active ? 700 : 500,
      border: `2px solid ${active ? B.medium : B.pale}`,
      background: active ? B.medium : "#fff", 
      color: active ? "#fff" : B.medium,
      transition: "all 0.2s ease"
    }}
  >
    {label}
  </button>
);

const MAIN_TABS = [
  { id: "capital-flow", label: "1.1 Capital Flow" },
  { id: "market-structure", label: "1.2 Market Structure" },
  { id: "deal-structure", label: "1.3 Deal Structure" },
  { id: "inclusion-impact", label: "1.4 Inclusion & Impact" },
  { id: "liquidity-exits", label: "1.5 Liquidity & Exits" },
];

const MarketPulse = () => {
  const [activeMainTab, setActiveMainTab] = useState("capital-flow");
  const { loading } = usePortfolio();

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center", color: B.warm }}>Loading market pulse data...</div>;
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: "24px", borderBottom: `2px solid ${B.pale}`, paddingBottom: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: B.darkest, margin: 0 }}>Market Pulse</h2>
        <p style={{ fontSize: "12px", color: B.warm, marginTop: "4px" }}>Snapshot, trends, and capital flow analysis</p>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
        {MAIN_TABS.map(tab => (
          <MainTab key={tab.id} label={tab.label} active={activeMainTab === tab.id} onClick={() => setActiveMainTab(tab.id)} />
        ))}
      </div>

      {activeMainTab === "capital-flow" && <CapitalFlow />}
      {activeMainTab === "market-structure" && <MarketStructure />}
      {activeMainTab === "deal-structure" && <DealStructure />}
      {activeMainTab === "inclusion-impact" && <InclusionImpact />}
      {activeMainTab === "liquidity-exits" && <LiquidityExits />}
    </div>
  );
};

export default MarketPulse;