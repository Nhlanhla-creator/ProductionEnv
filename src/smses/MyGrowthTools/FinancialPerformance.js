"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebaseConfig";
import Sidebar from "smses/Sidebar/Sidebar";
import Header from "../DashboardHeader/DashboardHeader";

import CapitalStructure    from "./financial/sections/CapitalStructure";
import PerformanceEngine   from "./financial/sections/PerformanceEngine";
import CostAgility         from "./financial/sections/CostAgility";
import LiquiditySurvival   from "./financial/sections/LiquiditySurvival";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  Title, Tooltip, Legend,
);

const SECTIONS = [
  { id: "capital-structure",  label: "Capital Structure"  },
  { id: "performance-engine", label: "Performance Engine" },
  { id: "cost-agility",       label: "Cost Agility"       },
  { id: "liquidity-survival", label: "Liquidity & Survival" },
];

// ==================== MAIN COMPONENT ====================
const FinancialPerformance = () => {
  const [activeSection, setActiveSection]   = useState("capital-structure");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser]                     = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isInvestorView, setIsInvestorView] = useState(false);
  const [viewingSMEId, setViewingSMEId]     = useState(null);
  const [viewingSMEName, setViewingSMEName] = useState("");

  // Investor view via sessionStorage
  useEffect(() => {
    const investorMode = sessionStorage.getItem("investorViewMode");
    const smeId        = sessionStorage.getItem("viewingSMEId");
    const smeName      = sessionStorage.getItem("viewingSMEName");
    if (investorMode === "true" && smeId) {
      setIsInvestorView(true);
      setViewingSMEId(smeId);
      setViewingSMEName(smeName || "SME");
    }
  }, []);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (isInvestorView && viewingSMEId) {
        setUser({ uid: viewingSMEId });
      } else if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });
    return () => unsub();
  }, [isInvestorView, viewingSMEId]);

  // Sidebar collapse observer
  useEffect(() => {
    const check = () =>
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const handleExitInvestorView = () => {
    ["viewingSMEId", "viewingSMEName", "investorViewMode"].forEach((k) =>
      sessionStorage.removeItem(k),
    );
    window.location.href = "/my-cohorts";
  };

  const contentPaddingLeft = isSidebarCollapsed ? "pl-[100px]" : "pl-[270px]";

  return (
    <div className="flex min-h-screen">
      <div className={`w-full bg-[#f7f3f0] min-h-screen px-5 pt-[70px] pb-5 transition-all duration-300 ${contentPaddingLeft} box-border`}>
        {/* Investor banner */}
        {isInvestorView && (
          <div className="bg-green-50 px-5 py-4 mt-[50px] mb-5 rounded-lg border-2 border-green-500 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl">👁️</span>
              <span className="text-green-800 font-semibold text-sm">
                Investor View: Viewing {viewingSMEName}'s Financial Performance
              </span>
            </div>
            <button
              onClick={handleExitInvestorView}
              className="px-4 py-2 bg-green-500 text-white border-0 rounded-md cursor-pointer font-semibold text-sm hover:bg-green-600"
            >
              Back to My Cohorts
            </button>
          </div>
        )}

        {/* Page header */}
        <div className="px-5 pt-10 ml-5">
          <div className="flex justify-between items-center mb-5">
            <h1 className="text-mediumBrown text-3xl font-bold m-0">Financial Performance</h1>
            <button
              onClick={() => setShowFullDescription((v) => !v)}
              className="px-4 py-2 bg-warmBrown text-[#fdfcfb] border-0 rounded-md cursor-pointer font-semibold text-xs whitespace-nowrap hover:opacity-90"
            >
              {showFullDescription ? "See less" : "See more"}
            </button>
          </div>

          {showFullDescription && (
            <div className="bg-[#fdfcfb] p-5 rounded-lg shadow-sm mb-7">
              <div className="pt-2">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <h3 className="text-warmBrown mt-0 mb-3 text-base font-semibold">What this dashboard DOES</h3>
                    <ul className="text-textBrown text-sm leading-7 m-0 pl-5">
                      <li>Assesses solvency, liquidity, and financial survivability</li>
                      <li>Evaluates capital structure quality and financial risk</li>
                      <li>Monitors cash runway and burn rate for survival planning</li>
                      <li>Tests cost agility and ability to flex under pressure</li>
                      <li>Measures performance engine health and margin sustainability</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-warmBrown mt-0 mb-3 text-base font-semibold">What this dashboard does NOT do</h3>
                    <ul className="text-textBrown text-sm leading-7 m-0 pl-5">
                      <li>Bookkeeping, invoicing, or payments processing</li>
                      <li>Payroll management or accounting automation</li>
                      <li>Tax compliance or audit preparation</li>
                      <li>Regulatory reporting or statutory filings</li>
                      <li>Operational transaction processing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section tabs */}
        <div className="flex gap-4 mb-7 p-4 bg-[#fdfcfb] rounded-lg shadow-sm flex-wrap">
          {SECTIONS.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setActiveSection(btn.id)}
              className={`px-6 py-3 border-0 rounded-md cursor-pointer font-semibold text-sm transition-all shadow-sm min-w-[180px] text-center ${
                activeSection === btn.id
                  ? "bg-mediumBrown text-[#fdfcfb]"
                  : "bg-[#e8ddd4] text-mediumBrown hover:bg-[#d4c4b8]"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/*
          Each section component:
          - Guards itself with `activeSection` check internally
          - Owns its own fromDate / toDate state
          - No longer receives financialYearStart
        */}
        <CapitalStructure
          activeSection={activeSection}
          user={user}
          isInvestorView={isInvestorView}
        />
        <PerformanceEngine
          activeSection={activeSection}
          user={user}
          onUpdateChartData={() => {}}
          isInvestorView={isInvestorView}
        />
        <CostAgility
          activeSection={activeSection}
          user={user}
          isInvestorView={isInvestorView}
        />
        <LiquiditySurvival
          activeSection={activeSection}
          user={user}
          isInvestorView={isInvestorView}
        />
      </div>
    </div>
  );
};

export default FinancialPerformance;