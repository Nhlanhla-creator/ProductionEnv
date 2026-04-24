import React, { useState } from "react";
import { FiSearch, FiActivity, FiTrendingUp, FiTarget, FiLogOut, FiAward, FiBookOpen, FiPieChart, FiDollarSign, FiBarChart2, FiUsers, FiHeart, FiLogOut as FiExit, FiBarChart } from "react-icons/fi";
import { PortfolioProvider } from "../../context/PortfolioContext";
import CohortSelection from "./CohortSelection";
import PortfolioHealth from "./PortfolioHealth";
import Performance from "./Performance";
import Outcomes from "./Outcomes";
import TopBottom from "./TopBottom";
import Learnings from "./Learnings";
import CapitalFlow from "./CapitalFlow";
import MarketStructure from "./MarketStructure";
import DealStructure from "./DealStructure";
import InclusionImpact from "./InclusionImpact";
import LiquidityExits from "./LiquidityExits";
import AssociationInsights from "./AssociationInsights";

const MY_PORTFOLIO_TABS = [
  { id: "capital-flow",      label: "Capital Flow",      icon: FiDollarSign, purpose: "Track capital deployment, fundraising trends, and investment sources across the ecosystem." },
  { id: "market-structure",  label: "Market Structure",  icon: FiBarChart2,  purpose: "Analyze where capital goes, who provides it, and geographic/sector concentration." },
  { id: "deal-structure",    label: "Deal Structure",    icon: FiPieChart,   purpose: "Understand fund types, deal sizes, equity preferences and investor behavior." },
  { id: "inclusion-impact",  label: "Inclusion & Impact",icon: FiHeart,      purpose: "Measure beneficiary demographics and impact of support programs." },
  { id: "liquidity-exits",   label: "Liquidity & Exits", icon: FiExit,       purpose: "Monitor exit activity, returns, and time to exit across sectors." },
  { id: "cohort-selection",  label: "Cohort Selection",  icon: FiSearch,     purpose: "Assess and select SMEs based on BIG score, match strength, vetting time and pipeline progress." },
  { id: "portfolio-health",  label: "Portfolio Health",  icon: FiActivity,   purpose: "Understand composition, demographics and support focus across your active cohort." },
  { id: "performance",       label: "Performance",       icon: FiTrendingUp, purpose: "Track financial growth, market penetration and capital raised by cohort SMEs." },
  { id: "outcomes",          label: "Outcomes",          icon: FiTarget,     purpose: "Measure social and economic impact including jobs created across the cohort." },
  { id: "top-bottom",        label: "Top & Bottom",      icon: FiAward,      purpose: "Surface the top 3 and bottom 3 performers across key metrics for targeted support." },
  { id: "learnings",         label: "Learnings",         icon: FiBookOpen,   purpose: "Identify the support areas and capability gaps most frequently requested by cohort SMEs." },
];

const TOP_LEVEL_TABS = [
  { id: "my-portfolio", label: "My Portfolio", icon: FiActivity },
  { id: "big-insights", label: "BIG Insights", icon: FiBarChart },
];

const AssociatorPortfolio = () => {
  const [activeTopTab, setActiveTopTab] = useState("my-portfolio");
  const [activeSubTab, setActiveSubTab] = useState("capital-flow");

  const renderSubTab = () => {
    switch (activeSubTab) {
      case "capital-flow":        return <CapitalFlow />;
      case "market-structure":    return <MarketStructure />;
      case "deal-structure":      return <DealStructure />;
      case "inclusion-impact":    return <InclusionImpact />;
      case "liquidity-exits":     return <LiquidityExits />;
      case "cohort-selection":    return <CohortSelection />;
      case "portfolio-health":    return <PortfolioHealth />;
      case "performance":         return <Performance />;
      case "outcomes":            return <Outcomes />;
      case "top-bottom":          return <TopBottom />;
      case "learnings":           return <Learnings />;
      default:                    return <CapitalFlow />;
    }
  };

  const currentSubTab = MY_PORTFOLIO_TABS.find(t => t.id === activeSubTab);

  return (
    <div className="min-h-screen p-6 pb-8 transition-[padding-left] duration-300 box-border w-full">

      {/* Top-level Tabs: full-width split — My Portfolio | BIG Insights */}
      <div className="flex w-full bg-white rounded-xl p-1.5 border border-paleBrown shadow-[0_2px_8px_rgba(59,36,9,0.06)] mb-4">
        {TOP_LEVEL_TABS.map(tab => {
          const active = activeTopTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTopTab(tab.id)}
              className={`
                flex items-center justify-center gap-[7px] py-[10px] rounded-lg border-none cursor-pointer
                text-sm whitespace-nowrap transition-all duration-150 flex-1
                ${active
                  ? 'bg-primaryBrown text-white font-bold shadow-[0_3px_10px_rgba(166,124,82,0.3)]'
                  : 'bg-transparent text-primaryBrown font-medium hover:bg-primaryBrown/10'
                }
              `}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* My Portfolio sub-tabs */}
      {activeTopTab === "my-portfolio" && (
        <>
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
        </>
      )}

      {/* BIG Insights content */}
      {activeTopTab === "big-insights" && (
        <AssociationInsights />
      )}
    </div>
  );
};

const MyPortfolio = () => (
  <PortfolioProvider>
    <AssociatorPortfolio />
  </PortfolioProvider>
);

export default AssociatorPortfolio;