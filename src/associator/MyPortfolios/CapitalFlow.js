import React, { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// Mixed color palette - brown, grey, cream, black, white
const B = {
  black: "#1a1a1a",
  darkGrey: "#4a4a4a",
  mediumGrey: "#7a7a7a",
  warmGrey: "#9e9e9e",
  lightGrey: "#c4c4c4",
  cream: "#f5f0e8",
  offwhite: "#faf8f5",
  brownDark: "#5c3d2e",
  brownMedium: "#8b694e",
  brownLight: "#b8957a",
  brownPale: "#d4bca8",
  white: "#ffffff",
};

// Mixed color array for charts - combines browns, greys, creams
const MIXED_COLORS = [
  "#5c3d2e", // dark brown
  "#4a4a4a", // dark grey
  "#8b694e", // medium brown
  "#7a7a7a", // medium grey
  "#b8957a", // light brown
  "#c4c4c4", // light grey
  "#d4bca8", // pale brown
  "#9e9e9e", // warm grey
  "#3d2a1f", // deepest brown
  "#e0d6c8", // cream
];

const SubTab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "6px 16px",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "12px",
      border: `1.5px solid ${active ? B.brownMedium : B.lightGrey}`,
      fontWeight: active ? 700 : 500,
      background: active ? B.brownMedium : "#fff",
      color: active ? "#fff" : B.darkGrey,
    }}
  >
    {label}
  </button>
);

const Card = ({ title, children, footer }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: "10px",
      padding: "20px",
      minHeight: "400px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      border: `1px solid ${B.lightGrey}`,
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "10px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.black, margin: 0 }}>{title}</h3>
    </div>
    <div style={{ flex: 1 }}>{children}</div>
    {footer && (
      <div
        style={{
          marginTop: "12px",
          paddingTop: "10px",
          borderTop: `1px solid ${B.offwhite}`,
          fontSize: "11px",
          color: B.warmGrey,
        }}
      >
        {footer}
      </div>
    )}
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "4px 12px",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "10px",
      border: `1.5px solid ${active ? B.brownMedium : B.lightGrey}`,
      fontWeight: active ? 700 : 500,
      background: active ? B.brownMedium : "#fff",
      color: active ? "#fff" : B.darkGrey,
    }}
  >
    {label}
  </button>
);

const TrendIcon = ({ growth }) => (
  <span
    style={{
      color: growth >= 0 ? "#2e7d32" : "#c62828",
      fontSize: "11px",
      marginLeft: "6px",
    }}
  >
    {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}%
  </span>
);

const doughnutOpts = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: { color: B.darkGrey, font: { size: 9 }, boxWidth: 8 },
    },
  },
};

const hBarOpts = () => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  indexAxis: "y",
  plugins: { legend: { display: false } },
  scales: {
    x: {
      beginAtZero: true,
      grid: { display: true, color: B.lightGrey },
      ticks: { color: B.darkGrey, font: { size: 9 } },
    },
    y: {
      grid: { display: false },
      ticks: { color: B.darkGrey, font: { size: 10 } },
    },
  },
});

// Capital Deployment Component
const CapitalDeployment = () => {
  const { marketPulse } = usePortfolio();
  const avgFundSize = marketPulse?.capitalFlow?.fundraising?.avgFundSize || { current: 45, yoyGrowth: 12.5 };
  
  const fundsVsDeployed = marketPulse?.capitalFlow?.fundraising?.fundsVsDeployed || {
    years: ["2022", "2023", "2024", "2025"],
    raised: [240, 280, 320, 360],
    requested: [300, 350, 400, 450],
    deployed: [280, 310, 385, 410],
  };
  
  const sources = marketPulse?.capitalFlow?.fundraising?.sources || {
    "Entities/Individuals": 35,
    Corporates: 28,
    DFIs: 22,
    "Fund of Funds": 15,
  };
  
  const purposes = marketPulse?.capitalFlow?.fundraising?.purposes || {
    "Own ring-fenced": 40,
    "Own balance sheet": 25,
    "Deal by deal": 35,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* First row: Average Fund Size + Funds Raised vs Requested vs Deployed (stretched) */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 1fr) minmax(500px, 2fr)", gap: "20px" }}>
        <Card title="Average Fund Size (ZAR M)">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <div style={{ fontSize: "44px", fontWeight: "800", color: B.black }}>R {avgFundSize.current}M</div>
            <div style={{ fontSize: "12px", color: B.mediumGrey, marginTop: "8px" }}>
              YoY Growth <TrendIcon growth={avgFundSize.yoyGrowth} />
            </div>
          </div>
        </Card>

        <Card title="Funds Raised vs Funds Requested vs Capital Deployed">
          <div style={{ height: "350px" }}>
            <Bar
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { color: B.darkGrey, font: { size: 10 }, boxWidth: 10 },
                  },
                },
                scales: {
                  x: { 
                    title: { display: true, text: "Year", color: B.darkGrey, font: { size: 11 } },
                    ticks: { font: { size: 10 } }
                  },
                  y: { 
                    beginAtZero: true, 
                    grid: { color: B.lightGrey }, 
                    ticks: { callback: (v) => `R${v}M`, font: { size: 10 } },
                    title: { display: true, text: "Amount (ZAR M)", color: B.darkGrey, font: { size: 11 } }
                  },
                },
              }}
              data={{
                labels: fundsVsDeployed.years,
                datasets: [
                  { label: "Funds Raised", data: fundsVsDeployed.raised, backgroundColor: MIXED_COLORS[2] },
                  { label: "Funds Requested", data: fundsVsDeployed.requested, backgroundColor: MIXED_COLORS[4] },
                  { label: "Capital Deployed", data: fundsVsDeployed.deployed, backgroundColor: MIXED_COLORS[6] },
                ],
              }}
            />
          </div>
        </Card>
      </div>

      {/* Second row: Sources of Funds Raised and Purpose of Funds Raised side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
        <Card title="Sources of Funds Raised">
          <div style={{ height: "300px" }}>
            <Doughnut
              options={doughnutOpts}
              data={{
                labels: Object.keys(sources),
                datasets: [{ data: Object.values(sources), backgroundColor: MIXED_COLORS }],
              }}
            />
          </div>
        </Card>

        <Card title="Purpose of Funds Raised">
          <div style={{ height: "300px" }}>
            <Doughnut
              options={doughnutOpts}
              data={{
                labels: Object.keys(purposes),
                datasets: [{ data: Object.values(purposes), backgroundColor: MIXED_COLORS.slice(3) }],
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

// Market Structure Component (removed Funder Demographics tab)
const MarketStructure = () => {
  const { marketPulse } = usePortfolio();
  const [viewType, setViewType] = useState("zar");
  const [activeSubTab, setActiveSubTab] = useState("where-capital");
  const [coView, setCoView] = useState("overview");

  const sectorAlloc = marketPulse?.marketStructure?.whereCapitalGoes?.sector?.allocation || {
    Fintech: 32,
    Healthtech: 18,
    Agritech: 15,
    Edtech: 12,
    Logistics: 10,
    "Clean Energy": 8,
    Others: 5,
  };
  const sectorDist = marketPulse?.marketStructure?.whereCapitalGoes?.sector?.distribution || {
    Fintech: 28,
    Healthtech: 16,
    Agritech: 14,
    Edtech: 13,
    Logistics: 11,
    "Clean Energy": 9,
    Others: 9,
  };
  const sectorTrends = marketPulse?.marketStructure?.whereCapitalGoes?.sector?.trends || {
    years: ["2022", "2023", "2024", "2025"],
    Fintech: [22, 26, 30, 32],
    Healthtech: [12, 14, 16, 18],
    Agritech: [10, 12, 14, 15],
  };

  const geoAlloc = marketPulse?.marketStructure?.whereCapitalGoes?.geo?.allocation || {
    Gauteng: 45,
    "Western Cape": 25,
    KZN: 15,
    "Eastern Cape": 8,
    Others: 7,
  };
  const geoDist = marketPulse?.marketStructure?.whereCapitalGoes?.geo?.distribution || {
    Gauteng: 42,
    "Western Cape": 24,
    KZN: 16,
    "Eastern Cape": 10,
    Others: 8,
  };

  const stageAlloc = marketPulse?.marketStructure?.whereCapitalGoes?.stage?.allocation || {
    "Pre-seed": 12,
    Seed: 28,
    "Series A": 35,
    "Series B": 18,
    "Series C+": 7,
  };
  const stageDist = marketPulse?.marketStructure?.whereCapitalGoes?.stage?.distribution || {
    "Pre-seed": 22,
    Seed: 32,
    "Series A": 28,
    "Series B": 12,
    "Series C+": 6,
  };

  const lifecycleAlloc = marketPulse?.marketStructure?.whereCapitalGoes?.lifecycle?.allocation || {
    Startup: 25,
    Growth: 45,
    Expansion: 20,
    Mature: 10,
  };
  const lifecycleDist = marketPulse?.marketStructure?.whereCapitalGoes?.lifecycle?.distribution || {
    Startup: 35,
    Growth: 40,
    Expansion: 18,
    Mature: 7,
  };

  const funderContribution = marketPulse?.marketStructure?.whoProvidesCapital?.funderType?.contribution || {
    VC: 45,
    Angel: 20,
    DFI: 18,
    "Corporate VC": 12,
    "Family Office": 5,
  };
  const funderDistribution = marketPulse?.marketStructure?.whoProvidesCapital?.funderType?.distribution || {
    VC: 38,
    Angel: 32,
    DFI: 12,
    "Corporate VC": 10,
    "Family Office": 8,
  };

  const bbbee = marketPulse?.marketStructure?.whoProvidesCapital?.bbbee || {
    level1: 12,
    level2: 18,
    level3: 24,
    level4: 20,
    nonCompliant: 26,
  };
  const fundManagerLoc = marketPulse?.marketStructure?.whoProvidesCapital?.fundManager?.managerLocation || {
    Johannesburg: 45,
    CapeTown: 28,
    Durban: 12,
    Pretoria: 8,
    Others: 7,
  };

  const coDeals = marketPulse?.marketStructure?.whoProvidesCapital?.coInvestor?.dealsWith || { yes: 45, no: 55 };
  const coLocation = marketPulse?.marketStructure?.whoProvidesCapital?.coInvestor?.location || {
    Johannesburg: 48,
    CapeTown: 25,
    Durban: 12,
    Pretoria: 8,
    International: 7,
  };

  const currentSectorData = viewType === "zar" ? sectorAlloc : sectorDist;
  const currentGeoData = viewType === "zar" ? geoAlloc : geoDist;
  const currentStageData = viewType === "zar" ? stageAlloc : stageDist;
  const currentLifecycleData = viewType === "zar" ? lifecycleAlloc : lifecycleDist;
  const currentFunderData = viewType === "zar" ? funderContribution : funderDistribution;

  const topSectors = Object.entries(sectorAlloc)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const bottomSectors = Object.entries(sectorAlloc)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "20px",
          borderBottom: `1px solid ${B.lightGrey}`,
          paddingBottom: "12px",
        }}
      >
        <SubTab label="Where Capital Goes" active={activeSubTab === "where-capital"} onClick={() => setActiveSubTab("where-capital")} />
        <SubTab label="Who Provides Capital" active={activeSubTab === "who-provides"} onClick={() => setActiveSubTab("who-provides")} />
        <SubTab label="Co-investor Analysis" active={activeSubTab === "co-investor"} onClick={() => setActiveSubTab("co-investor")} />
      </div>

      {activeSubTab === "where-capital" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px", gap: "8px" }}>
            <Pill label="By ZAR (Allocation)" active={viewType === "zar"} onClick={() => setViewType("zar")} />
            <Pill label="By Count (Distribution)" active={viewType === "count"} onClick={() => setViewType("count")} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
            <Card title="Sector Concentration" footer={`Top 3: ${topSectors.map((s) => s[0]).join(", ")} | Bottom 3: ${bottomSectors.map((s) => s[0]).join(", ")}`}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ height: "160px" }}>
                  <Doughnut
                    options={doughnutOpts}
                    data={{
                      labels: Object.keys(currentSectorData),
                      datasets: [{ data: Object.values(currentSectorData), backgroundColor: MIXED_COLORS }],
                    }}
                  />
                </div>
                <div style={{ height: "140px" }}>
                  <Bar
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      animation: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: { color: B.darkGrey, font: { size: 8 }, boxWidth: 8 },
                        },
                      },
                      scales: {
                        x: {
                          stacked: true,
                          title: { display: true, text: "Year", color: B.darkGrey, font: { size: 9 } },
                          ticks: { color: B.darkGrey, font: { size: 8 } },
                        },
                        y: {
                          stacked: true,
                          beginAtZero: true,
                          grid: { color: B.lightGrey },
                          ticks: { color: B.darkGrey, callback: (v) => v.toLocaleString() },
                        },
                      },
                    }}
                    data={{
                      labels: sectorTrends.years,
                      datasets: [
                        { label: "Fintech", data: sectorTrends.Fintech, backgroundColor: MIXED_COLORS[0] },
                        { label: "Healthtech", data: sectorTrends.Healthtech, backgroundColor: MIXED_COLORS[2] },
                        { label: "Agritech", data: sectorTrends.Agritech, backgroundColor: MIXED_COLORS[4] },
                      ],
                    }}
                  />
                </div>
              </div>
            </Card>

            <Card title="Geographic Concentration">
              <div style={{ height: "280px" }}>
                <Doughnut
                  options={doughnutOpts}
                  data={{
                    labels: Object.keys(currentGeoData),
                    datasets: [{ data: Object.values(currentGeoData), backgroundColor: MIXED_COLORS }],
                  }}
                />
              </div>
            </Card>

            <Card title="Deal Stage Concentration">
              <div style={{ height: "280px" }}>
                <Doughnut
                  options={doughnutOpts}
                  data={{
                    labels: Object.keys(currentStageData),
                    datasets: [{ data: Object.values(currentStageData), backgroundColor: MIXED_COLORS }],
                  }}
                />
              </div>
            </Card>

            <Card title="Lifecycle Concentration">
              <div style={{ height: "280px" }}>
                <Doughnut
                  options={doughnutOpts}
                  data={{
                    labels: Object.keys(currentLifecycleData),
                    datasets: [{ data: Object.values(currentLifecycleData), backgroundColor: MIXED_COLORS }],
                  }}
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeSubTab === "who-provides" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px", gap: "8px" }}>
            <Pill label="By ZAR" active={viewType === "zar"} onClick={() => setViewType("zar")} />
            <Pill label="By Count" active={viewType === "count"} onClick={() => setViewType("count")} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
            <Card title="Fund Management & Concentration">
              <div style={{ height: "280px" }}>
                <Doughnut
                  options={doughnutOpts}
                  data={{
                    labels: Object.keys(currentFunderData),
                    datasets: [{ data: Object.values(currentFunderData), backgroundColor: MIXED_COLORS }],
                  }}
                />
              </div>
            </Card>

            <Card title="Funder B-BBEE Compliance Status">
              <div style={{ height: "280px" }}>
                <Bar
                  options={hBarOpts()}
                  data={{
                    labels: ["Level 1", "Level 2", "Level 3", "Level 4", "Non-Compliant"],
                    datasets: [{ label: "Number of Funders", data: [bbbee.level1, bbbee.level2, bbbee.level3, bbbee.level4, bbbee.nonCompliant], backgroundColor: MIXED_COLORS[0] }],
                  }}
                />
              </div>
            </Card>

            <Card title="Fund Manager Head Office Distribution">
              <div style={{ height: "280px" }}>
                <Doughnut
                  options={doughnutOpts}
                  data={{
                    labels: Object.keys(fundManagerLoc),
                    datasets: [{ data: Object.values(fundManagerLoc), backgroundColor: MIXED_COLORS }],
                  }}
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeSubTab === "co-investor" && (
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <Pill label="Overview" active={coView === "overview"} onClick={() => setCoView("overview")} />
            <Pill label="Location" active={coView === "loc"} onClick={() => setCoView("loc")} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
            {coView === "overview" && (
              <Card title="Deals with Co-investors">
                <div style={{ height: "280px" }}>
                  <Doughnut
                    options={doughnutOpts}
                    data={{
                      labels: ["With Co-investors", "Solo"],
                      datasets: [{ data: [coDeals.yes, coDeals.no], backgroundColor: [MIXED_COLORS[1], MIXED_COLORS[6]] }],
                    }}
                  />
                </div>
              </Card>
            )}
            {coView === "loc" && (
              <Card title="Co-investor Location">
                <div style={{ height: "280px" }}>
                  <Doughnut
                    options={doughnutOpts}
                    data={{
                      labels: Object.keys(coLocation),
                      datasets: [{ data: Object.values(coLocation), backgroundColor: MIXED_COLORS }],
                    }}
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Deal Structure Component
const DealStructure = () => {
  const { marketPulse } = usePortfolio();
  const [activeSubTab, setActiveSubTab] = useState("fund-type");
  const [fundView, setFundView] = useState("zar");

  const fundTypeAlloc = marketPulse?.marketStructure?.dealStructure?.fundType?.allocation || {
    Grant: 15,
    Equity: 55,
    Debt: 25,
    Convertible: 5,
  };
  const fundTypeDist = marketPulse?.marketStructure?.dealStructure?.fundType?.distribution || {
    Grant: 30,
    Equity: 40,
    Debt: 20,
    Convertible: 10,
  };

  const avgDealSize = marketPulse?.marketStructure?.dealStructure?.dealSize?.avg || { current: 12.5, yoyGrowth: 8.2 };
  const dealSizeDist = marketPulse?.marketStructure?.dealStructure?.dealSize?.distribution || {
    "<R1M": 15,
    "R1-5M": 35,
    "R5-10M": 28,
    "R10-20M": 15,
    "R20M+": 7,
  };
  const avgDealsPerInvestor = marketPulse?.marketStructure?.dealStructure?.dealSize?.avgDealsPerInvestor || { current: 3.8, yoyGrowth: 5.6 };

  const equitySizeDist = marketPulse?.marketStructure?.dealStructure?.equity?.sizeDistribution || {
    "<R1M": 20,
    "R1-5M": 40,
    "R5-10M": 25,
    "R10-20M": 10,
    "R20M+": 5,
  };
  const equityPctDist = marketPulse?.marketStructure?.dealStructure?.equity?.pctDistribution || {
    "0-10%": 25,
    "10-20%": 40,
    "20-30%": 20,
    "30-50%": 10,
    "50%+": 5,
  };

  const currentFundData = fundView === "zar" ? fundTypeAlloc : fundTypeDist;

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          borderBottom: `1px solid ${B.lightGrey}`,
          paddingBottom: "12px",
        }}
      >
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
                <Doughnut
                  options={doughnutOpts}
                  data={{
                    labels: Object.keys(currentFundData),
                    datasets: [{ data: Object.values(currentFundData), backgroundColor: MIXED_COLORS }],
                  }}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeSubTab === "deal-size" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <Card title="Average Deal Size">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
              <div style={{ fontSize: "44px", fontWeight: "800", color: B.black }}>R {avgDealSize.current}M</div>
              <div style={{ fontSize: "12px", color: B.mediumGrey }}>
                YoY Growth <TrendIcon growth={avgDealSize.yoyGrowth} />
              </div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: B.black, marginTop: "20px" }}>{avgDealsPerInvestor.current} avg deals per investor</div>
              <div style={{ fontSize: "11px", color: B.mediumGrey }}>
                YoY Growth <TrendIcon growth={avgDealsPerInvestor.yoyGrowth} />
              </div>
            </div>
          </Card>

          <Card title="Deal Size Distribution">
            <div style={{ height: "320px" }}>
              <Bar
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: {
                      title: { display: true, text: "Range", color: B.darkGrey },
                      grid: { display: false },
                      ticks: { color: B.darkGrey, font: { size: 8 } },
                    },
                    y: {
                      title: { display: true, text: "Number of Deals", color: B.darkGrey },
                      beginAtZero: true,
                      grid: { color: B.lightGrey },
                      ticks: { color: B.darkGrey, callback: (v) => `R${v}M` },
                    },
                  },
                }}
                data={{
                  labels: Object.keys(dealSizeDist),
                  datasets: [{ label: "Number of Deals", data: Object.values(dealSizeDist), backgroundColor: MIXED_COLORS[0] }],
                }}
              />
            </div>
          </Card>
        </div>
      )}

      {activeSubTab === "equity" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <Card title="Equity Size Distribution">
            <div style={{ height: "320px" }}>
              <Bar
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: {
                      title: { display: true, text: "Range", color: B.darkGrey },
                      grid: { display: false },
                      ticks: { color: B.darkGrey, font: { size: 8 } },
                    },
                    y: {
                      title: { display: true, text: "Number of Deals", color: B.darkGrey },
                      beginAtZero: true,
                      grid: { color: B.lightGrey },
                      ticks: { color: B.darkGrey, callback: (v) => `R${v}M` },
                    },
                  },
                }}
                data={{
                  labels: Object.keys(equitySizeDist),
                  datasets: [{ label: "Number of Deals", data: Object.values(equitySizeDist), backgroundColor: MIXED_COLORS[1] }],
                }}
              />
            </div>
          </Card>

          <Card title="Equity Percentage Distribution">
            <div style={{ height: "320px" }}>
              <Bar
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: {
                      title: { display: true, text: "Range", color: B.darkGrey },
                      grid: { display: false },
                      ticks: { color: B.darkGrey, font: { size: 8 } },
                    },
                    y: {
                      title: { display: true, text: "Number of Deals", color: B.darkGrey },
                      beginAtZero: true,
                      grid: { color: B.lightGrey },
                      ticks: { color: B.darkGrey },
                    },
                  },
                }}
                data={{
                  labels: Object.keys(equityPctDist),
                  datasets: [{ label: "Number of Deals", data: Object.values(equityPctDist), backgroundColor: MIXED_COLORS[3] }],
                }}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Main CapitalFlow Component
const CapitalFlow = () => {
  const [activeMainTab, setActiveMainTab] = useState("market-structure");

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          borderBottom: `1px solid ${B.lightGrey}`,
          paddingBottom: "12px",
        }}
      >
        <SubTab label="Market Structure" active={activeMainTab === "market-structure"} onClick={() => setActiveMainTab("market-structure")} />
        <SubTab label="Deal Structure" active={activeMainTab === "deal-structure"} onClick={() => setActiveMainTab("deal-structure")} />
        <SubTab label="Capital Deployment" active={activeMainTab === "deployment"} onClick={() => setActiveMainTab("deployment")} />
      </div>

      {activeMainTab === "market-structure" && <MarketStructure />}
      {activeMainTab === "deal-structure" && <DealStructure />}
      {activeMainTab === "deployment" && <CapitalDeployment />}
    </div>
  );
};

export default CapitalFlow;