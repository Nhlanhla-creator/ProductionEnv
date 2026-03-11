"use client"

import { useState, useEffect } from "react"
import { Users, Building, DollarSign, Rocket, UserCheck, GraduationCap } from "lucide-react"

// Import all the individual insights components
import { CustomerInsights } from "./CustomerInsights"
import { SupplierInsights } from "./SupplierInsights"
import { FundingInsights } from "./FundingInsights"
import { AcceleratorInsights } from "./AcceleratorInsights" // Catalyst
import { AdvisorInsights } from "./AdvisorInsights"
import { InternInsightsPage } from "./InternInsightsPage"

// Import the CSS file
import "../MyFunderMatches/funding-insights.css"

export function BigInsights() {
  const [activeInsightTab, setActiveInsightTab] = useState("customers")

  const getContainerStyles = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
    backgroundColor: "#f8f9fa",
  })

  return (
    <div className="bigInsightsContainer" style={getContainerStyles()}>
      {/* Main Header */}
      <div className="bigInsightsHeader">
        <h1>My BIG Insights</h1>
        <p>Comprehensive analytics and insights across all your business connections</p>
      </div>

      {/* Main Tabs Navigation - All in one row */}
      <div className="bigInsightsMainTabs">
        <button
          className={`bigInsightMainTab ${activeInsightTab === "customers" ? "bigInsightMainTabActive" : ""}`}
          onClick={() => setActiveInsightTab("customers")}
        >
          <Users size={16} />
          <span>Customers</span>
        </button>

        <button
          className={`bigInsightMainTab ${activeInsightTab === "suppliers" ? "bigInsightMainTabActive" : ""}`}
          onClick={() => setActiveInsightTab("suppliers")}
        >
          <Building size={16} />
          <span>Suppliers</span>
        </button>

        <button
          className={`bigInsightMainTab ${activeInsightTab === "funders" ? "bigInsightMainTabActive" : ""}`}
          onClick={() => setActiveInsightTab("funders")}
        >
          <DollarSign size={16} />
          <span>Funders</span>
        </button>

        <button
          className={`bigInsightMainTab ${activeInsightTab === "catalyst" ? "bigInsightMainTabActive" : ""}`}
          onClick={() => setActiveInsightTab("catalyst")}
        >
          <Rocket size={16} />
          <span>Catalyst</span>
        </button>

        <button
          className={`bigInsightMainTab ${activeInsightTab === "advisors" ? "bigInsightMainTabActive" : ""}`}
          onClick={() => setActiveInsightTab("advisors")}
        >
          <UserCheck size={16} />
          <span>Advisors</span>
        </button>

        <button
          className={`bigInsightMainTab ${activeInsightTab === "interns" ? "bigInsightMainTabActive" : ""}`}
          onClick={() => setActiveInsightTab("interns")}
        >
          <GraduationCap size={16} />
          <span>Interns</span>
        </button>
      </div>

      {/* Content Area - Render the selected insight component */}
      <div className="bigInsightsContent">
        {activeInsightTab === "customers" && <CustomerInsights />}
        {activeInsightTab === "suppliers" && <SupplierInsights />}
        {activeInsightTab === "funders" && <FundingInsights />}
        {activeInsightTab === "catalyst" && <AcceleratorInsights />}
        {activeInsightTab === "advisors" && <AdvisorInsights />}
        {activeInsightTab === "interns" && <InternInsightsPage />}
      </div>
    </div>
  )
}

// Export as default for easy importing
export default BigInsights