import React, { useState, useEffect } from "react";
import { FiSearch, FiActivity, FiTrendingUp, FiTarget, FiLogOut, FiAward, FiBookOpen } from "react-icons/fi";
import { PortfolioProvider } from "../../context/PortfolioContext";
import CohortSelection from "./CohortSelection";
import PortfolioHealth from "./PortfolioHealth";
import Performance from "./Performance";
import Outcomes from "./Outcomes";
import Exit from "./Exit";
import TopBottom from "./TopBottom";
import Learnings from "./Learnings";

const TABS = [
  { id: "cohort-selection", label: "Cohort Selection",  icon: FiSearch,     purpose: "Assess and select SMEs based on BIG score, match strength, vetting time and pipeline progress." },
  { id: "portfolio-health", label: "Portfolio Health",  icon: FiActivity,   purpose: "Understand composition, demographics and support focus across your active cohort." },
  { id: "performance",      label: "Performance",       icon: FiTrendingUp, purpose: "Track financial growth, market penetration and capital raised by cohort SMEs." },
  { id: "outcomes",         label: "Outcomes",          icon: FiTarget,     purpose: "Measure social and economic impact including jobs created across the cohort." },
  { id: "exit",             label: "Exit",              icon: FiLogOut,     purpose: "Monitor graduation numbers and average time SMEs spend in the programme." },
  { id: "top-bottom",       label: "Top & Bottom",      icon: FiAward,      purpose: "Surface the top 3 and bottom 3 performers across key metrics for targeted support." },
  { id: "learnings",        label: "Learnings",         icon: FiBookOpen,   purpose: "Identify the support areas and capability gaps most frequently requested by cohort SMEs." },
];

const MyPortfolioContent = () => {
  const [activeTab, setActiveTab] = useState("cohort-selection");

  const renderTab = () => {
    switch (activeTab) {
      case "cohort-selection": return <CohortSelection />;
      case "portfolio-health": return <PortfolioHealth />;
      case "performance":      return <Performance />;
      case "outcomes":         return <Outcomes />;
      case "exit":             return <Exit />;
      case "top-bottom":       return <TopBottom />;
      case "learnings":        return <Learnings />;
      default:                 return null;
    }
  };

  const current = TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen p-6 pb-8 transition-[padding-left] duration-300 box-border w-full">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[28px] font-bold text-[#4a352f] mb-2">
          My Portfolio
        </h1>
        <p className="text-xs text-warmBrown m-0">
          Catalyst deal flow & cohort analytics
        </p>
      </div>

      {/* Tabs Container */}
      <div className="flex gap-[5px] flex-wrap bg-white rounded-xl p-1.5 border border-paleBrown shadow-[0_2px_8px_rgba(59,36,9,0.06)] mb-0">
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {/* Tab Indicator */}
      <div className="h-[3px] bg-primaryBrown rounded-b-[4px] mb-4" />

      {/* Purpose Banner */}
      <div className="bg-white border-l-4 border-primaryBrown rounded-r-lg px-4 py-[11px] mb-5 text-xs text-textBrown shadow-[0_1px_4px_rgba(59,36,9,0.05)]">
        <strong className="text-darkBrown">Purpose: </strong>
        {current?.purpose}
      </div>

      {/* Tab Content */}
      {renderTab()}
    </div>
  );
};

const MyPortfolio = () => (
  <PortfolioProvider>
    <MyPortfolioContent />
  </PortfolioProvider>
);

export default MyPortfolio;