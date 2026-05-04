import React, { useState } from "react";
import { FiSearch, FiActivity, FiTrendingUp, FiTarget, FiLogOut, FiAward, FiBookOpen, FiPieChart, FiDollarSign, FiBarChart2, FiHeart, FiLogOut as FiExit } from "react-icons/fi";
import { PortfolioProvider } from "../../context/PortfolioContext";
import Performance from "./Performance";
import CapitalFlow from "./CapitalFlow";
import InclusionImpact from "./InclusionImpact";
import LiquidityExits from "./LiquidityExits";

const MY_PORTFOLIO_TABS = [
  { id: "capital-flow",      label: "Capital Flow",      icon: FiDollarSign, purpose: "Track capital deployment, fundraising trends, market structure, deal structure, and investment sources across the ecosystem." },
  { id: "inclusion-impact",  label: "Inclusion & Impact",icon: FiHeart,      purpose: "Measure beneficiary demographics, job creation, cohort selection metrics, support program outcomes, and key learnings from SME engagements." },
  { id: "performance",       label: "Performance",       icon: FiTrendingUp, purpose: "Track financial growth, revenue, profitability, key clients, and top/bottom performers across the portfolio." },
  { id: "liquidity-exits",   label: "Liquidity & Exits", icon: FiExit,       purpose: "Monitor exit activity, returns, and time to exit across sectors." },
];

const AssociatorPortfolio = () => {
  const [activeSubTab, setActiveSubTab] = useState("capital-flow");

  const renderSubTab = () => {
    switch (activeSubTab) {
      case "capital-flow":        return <CapitalFlow />;
      case "inclusion-impact":    return <InclusionImpact />;
      case "performance":         return <Performance />;
      case "liquidity-exits":     return <LiquidityExits />;
      default:                    return <CapitalFlow />;
    }
  };

  const currentSubTab = MY_PORTFOLIO_TABS.find(t => t.id === activeSubTab);

  return (
    <div className="min-h-screen p-6 pb-8 transition-[padding-left] duration-300 box-border w-full">

      {/* Page Heading */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-darkBrown tracking-tight">Market Insights</h1>
        <p className="text-xs text-textBrown mt-1">Overview of capital, performance and portfolio analytics</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-[5px] flex-wrap bg-white rounded-xl p-1.5 border border-paleBrown shadow-[0_2px_8px_rgba(59,36,9,0.06)] mb-0">
        {MY_PORTFOLIO_TABS.map(tab => {
          const active = activeSubTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`
                flex items-center gap-[7px] px-[15px] py-[9px] rounded-lg border-none cursor-pointer
                text-xs whitespace-nowrap flex-1 justify-center transition-all duration-150
                ${active
                  ? 'bg-primaryBrown text-white font-bold shadow-[0_3px_10px_rgba(166,124,82,0.3)]'
                  : 'bg-transparent text-primaryBrown font-medium hover:bg-primaryBrown/10'
                }
              `}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="h-[3px] bg-primaryBrown rounded-b-[4px] mb-4" />

      <div className="bg-white border-l-4 border-primaryBrown rounded-r-lg px-4 py-[11px] mb-5 text-xs text-textBrown shadow-[0_1px_4px_rgba(59,36,9,0.05)]">
        <strong className="text-darkBrown">Purpose: </strong>
        {currentSubTab?.purpose}
      </div>

      {renderSubTab()}
    </div>
  );
};

const MyPortfolio = () => (
  <PortfolioProvider>
    <AssociatorPortfolio />
  </PortfolioProvider>
);

export default MyPortfolio;