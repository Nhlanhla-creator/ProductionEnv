import React, { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { usePortfolio } from "../../context/PortfolioContext";
import MarketStructureAnalysisModal from "./MarketStructureAnalysisModal";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const B = { darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36", warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de" };
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882", "#d4c4b0", "#a08060"];

const SubTab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "6px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "12px", border: `1.5px solid ${active ? B.medium : B.pale}`, fontWeight: active ? 700 : 500, background: active ? B.medium : "#fff", color: active ? "#fff" : B.medium }}>
    {label}
  </button>
);

const Card = ({ title, children, footer }) => (
  <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", minHeight: "420px", boxShadow: "0 2px 10px rgba(59,36,9,0.07)", border: `1px solid ${B.pale}`, display: "flex", flexDirection: "column" }}>
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "10px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.dark, margin: 0 }}>{title}</h3>
    </div>
    <div style={{ flex: 1 }}>{children}</div>
    {footer && <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: `1px solid ${B.offwhite}`, fontSize: "11px", color: B.warm }}>{footer}</div>}
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "4px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "10px", border: `1.5px solid ${active ? B.medium : B.pale}`, fontWeight: active ? 700 : 500, background: active ? B.medium : "#fff", color: active ? "#fff" : B.medium }}>
    {label}
  </button>
);

const hBarOpts = () => ({
  responsive: true, maintainAspectRatio: false, animation: false, indexAxis: "y",
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, grid: { display: true, color: B.offwhite }, ticks: { color: B.dark, font: { size: 9 } } },
    y: { grid: { display: false }, ticks: { color: B.dark, font: { size: 10 } } },
  },
});

const doughnutOpts = {
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 9 }, boxWidth: 8 } } },
};

const stackedBarOpts = (xTitle) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { position: "bottom", labels: { color: B.dark, font: { size: 8 }, boxWidth: 8 } } },
  scales: {
    x: { stacked: true, title: { display: true, text: xTitle, color: B.dark, font: { size: 9 } }, ticks: { color: B.dark, font: { size: 8 } } },
    y: { stacked: true, beginAtZero: true, grid: { color: B.offwhite }, ticks: { color: B.dark, callback: v => v.toLocaleString() } },
  },
});

const MarketStructure = () => {
  const { marketPulse } = usePortfolio();
  const [activeSubTab, setActiveSubTab] = useState("where-capital");
  const [viewType, setViewType] = useState("zar");

  const sectorAlloc = marketPulse?.marketStructure?.whereCapitalGoes?.sector?.allocation || { Fintech: 32, Healthtech: 18, Agritech: 15, Edtech: 12, Logistics: 10, "Clean Energy": 8, Others: 5 };
  const sectorDist = marketPulse?.marketStructure?.whereCapitalGoes?.sector?.distribution || { Fintech: 28, Healthtech: 16, Agritech: 14, Edtech: 13, Logistics: 11, "Clean Energy": 9, Others: 9 };
  const sectorTrends = marketPulse?.marketStructure?.whereCapitalGoes?.sector?.trends || { years: ["2022", "2023", "2024", "2025"], Fintech: [22, 26, 30, 32], Healthtech: [12, 14, 16, 18], Agritech: [10, 12, 14, 15] };

  const geoAlloc = marketPulse?.marketStructure?.whereCapitalGoes?.geo?.allocation || { Gauteng: 45, "Western Cape": 25, KZN: 15, "Eastern Cape": 8, Others: 7 };
  const geoDist = marketPulse?.marketStructure?.whereCapitalGoes?.geo?.distribution || { Gauteng: 42, "Western Cape": 24, KZN: 16, "Eastern Cape": 10, Others: 8 };

  const stageAlloc = marketPulse?.marketStructure?.whereCapitalGoes?.stage?.allocation || { "Pre-seed": 12, Seed: 28, "Series A": 35, "Series B": 18, "Series C+": 7 };
  const stageDist = marketPulse?.marketStructure?.whereCapitalGoes?.stage?.distribution || { "Pre-seed": 22, Seed: 32, "Series A": 28, "Series B": 12, "Series C+": 6 };

  const lifecycleAlloc = marketPulse?.marketStructure?.whereCapitalGoes?.lifecycle?.allocation || { Startup: 25, Growth: 45, Expansion: 20, Mature: 10 };
  const lifecycleDist = marketPulse?.marketStructure?.whereCapitalGoes?.lifecycle?.distribution || { Startup: 35, Growth: 40, Expansion: 18, Mature: 7 };

  const funderContribution = marketPulse?.marketStructure?.whoProvidesCapital?.funderType?.contribution || { VC: 45, Angel: 20, DFI: 18, "Corporate VC": 12, "Family Office": 5 };
  const funderDistribution = marketPulse?.marketStructure?.whoProvidesCapital?.funderType?.distribution || { VC: 38, Angel: 32, DFI: 12, "Corporate VC": 10, "Family Office": 8 };

  const bbbee = marketPulse?.marketStructure?.whoProvidesCapital?.bbbee || { level1: 12, level2: 18, level3: 24, level4: 20, nonCompliant: 26 };
  const demographics = marketPulse?.marketStructure?.whoProvidesCapital?.demographics || { femaleCEOs: 22, femaleFounders: { "<10%": 40, "10-35%": 35, "35-50%": 15, ">50%": 10 }, hdiFounders: 48 };
  const fundManagerLoc = marketPulse?.marketStructure?.whoProvidesCapital?.fundManager?.managerLocation || { Johannesburg: 45, CapeTown: 28, Durban: 12, Pretoria: 8, Others: 7 };

  const coDeals = marketPulse?.marketStructure?.whoProvidesCapital?.coInvestor?.dealsWith || { yes: 45, no: 55 };
  const coLocation = marketPulse?.marketStructure?.whoProvidesCapital?.coInvestor?.location || { Johannesburg: 48, CapeTown: 25, Durban: 12, Pretoria: 8, International: 7 };

  const [coView, setCoView] = useState("overview");
const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const currentSectorData = viewType === "zar" ? sectorAlloc : sectorDist;
  const currentGeoData = viewType === "zar" ? geoAlloc : geoDist;
  const currentStageData = viewType === "zar" ? stageAlloc : stageDist;
  const currentLifecycleData = viewType === "zar" ? lifecycleAlloc : lifecycleDist;
  const currentFunderData = viewType === "zar" ? funderContribution : funderDistribution;

  const topSectors = Object.entries(sectorAlloc).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const bottomSectors = Object.entries(sectorAlloc).sort((a, b) => a[1] - b[1]).slice(0, 3);

  const prepareMarketDataForAnalysis = () => ({
  sectorAllocation: sectorAlloc,
  sectorDistribution: sectorDist,
  sectorTrends: sectorTrends,
  geoAllocation: geoAlloc,
  geoDistribution: geoDist,
  stageAllocation: stageAlloc,
  stageDistribution: stageDist,
  lifecycleAllocation: lifecycleAlloc,
  lifecycleDistribution: lifecycleDist,
  funderContribution: funderContribution,
  funderDistribution: funderDistribution,
  bbbeeCompliance: bbbee,
  fundManagerLocation: fundManagerLoc,
  demographics: demographics,
  coInvestorDeals: coDeals,
  coInvestorLocation: coLocation,
});

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px", borderBottom: `1px solid ${B.pale}`, paddingBottom: "12px" }}>
        <SubTab label="Where Capital Goes" active={activeSubTab === "where-capital"} onClick={() => setActiveSubTab("where-capital")} />
        <SubTab label="Who Provides Capital" active={activeSubTab === "who-provides"} onClick={() => setActiveSubTab("who-provides")} />
        <SubTab label="Funder Demographics" active={activeSubTab === "funder-demo"} onClick={() => setActiveSubTab("funder-demo")} />
        <SubTab label="Co-investor Analysis" active={activeSubTab === "co-investor"} onClick={() => setActiveSubTab("co-investor")} />
      </div>

      {activeSubTab === "where-capital" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px", gap: "8px" }}>
            <Pill label="By ZAR (Allocation)" active={viewType === "zar"} onClick={() => setViewType("zar")} />
            <Pill label="By Count (Distribution)" active={viewType === "count"} onClick={() => setViewType("count")} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
            <Card title="Sector Concentration" footer={`Top 3: ${topSectors.map(s => s[0]).join(", ")} | Bottom 3: ${bottomSectors.map(s => s[0]).join(", ")}`}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ height: "160px" }}>
                  <Doughnut options={doughnutOpts} data={{ labels: Object.keys(currentSectorData), datasets: [{ data: Object.values(currentSectorData), backgroundColor: C }] }} />
                </div>
                <div style={{ height: "140px" }}>
                  <Bar options={stackedBarOpts("Year")} data={{ labels: sectorTrends.years, datasets: [{ label: "Fintech", data: sectorTrends.Fintech, backgroundColor: C[0] }, { label: "Healthtech", data: sectorTrends.Healthtech, backgroundColor: C[1] }, { label: "Agritech", data: sectorTrends.Agritech, backgroundColor: C[2] }] }} />
                </div>
              </div>
            </Card>

            <Card title="Geographic Concentration">
              <div style={{ height: "280px" }}>
                <Doughnut options={doughnutOpts} data={{ labels: Object.keys(currentGeoData), datasets: [{ data: Object.values(currentGeoData), backgroundColor: C }] }} />
              </div>
            </Card>

            <Card title="Deal Stage Concentration">
              <div style={{ height: "280px" }}>
                <Doughnut options={doughnutOpts} data={{ labels: Object.keys(currentStageData), datasets: [{ data: Object.values(currentStageData), backgroundColor: C }] }} />
              </div>
            </Card>

            <Card title="Lifecycle Concentration">
              <div style={{ height: "280px" }}>
                <Doughnut options={doughnutOpts} data={{ labels: Object.keys(currentLifecycleData), datasets: [{ data: Object.values(currentLifecycleData), backgroundColor: C }] }} />
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
                <Doughnut options={doughnutOpts} data={{ labels: Object.keys(currentFunderData), datasets: [{ data: Object.values(currentFunderData), backgroundColor: C }] }} />
              </div>
            </Card>

            <Card title="Funder B-BBEE Compliance Status">
              <div style={{ height: "280px" }}>
                <Bar options={hBarOpts()} data={{ labels: ["Level 1", "Level 2", "Level 3", "Level 4", "Non-Compliant"], datasets: [{ label: "Number of Funders", data: [bbbee.level1, bbbee.level2, bbbee.level3, bbbee.level4, bbbee.nonCompliant], backgroundColor: C }] }} />
              </div>
            </Card>

            <Card title="Fund Manager Head Office Distribution">
              <div style={{ height: "280px" }}>
                <Doughnut options={doughnutOpts} data={{ labels: Object.keys(fundManagerLoc), datasets: [{ data: Object.values(fundManagerLoc), backgroundColor: C }] }} />
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeSubTab === "funder-demo" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <Card title="Female CEOs">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "20px" }}>
              <div style={{ position: "relative", width: "180px", height: "180px" }}>
                <Doughnut options={doughnutOpts} data={{ labels: ["Female CEOs", "Male CEOs"], datasets: [{ data: [demographics.femaleCEOs, 100 - demographics.femaleCEOs], backgroundColor: [B.medium, B.pale] }] }} />
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: B.darkest }}>{demographics.femaleCEOs}%</div>
            </div>
          </Card>

          <Card title="Female Founders Distribution">
            <div style={{ height: "280px" }}>
              <Bar options={hBarOpts()} data={{ labels: Object.keys(demographics.femaleFounders), datasets: [{ label: "% of Funds", data: Object.values(demographics.femaleFounders), backgroundColor: B.medium }] }} />
            </div>
          </Card>

          <Card title="HDI Founders / CEOs">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "20px" }}>
              <div style={{ position: "relative", width: "180px", height: "180px" }}>
                <Doughnut options={doughnutOpts} data={{ labels: ["HDI", "Non-HDI"], datasets: [{ data: [demographics.hdiFounders, 100 - demographics.hdiFounders], backgroundColor: [B.medium, B.pale] }] }} />
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: B.darkest }}>{demographics.hdiFounders}%</div>
            </div>
          </Card>
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
                  <Doughnut options={doughnutOpts} data={{ labels: ["With Co-investors", "Solo"], datasets: [{ data: [coDeals.yes, coDeals.no], backgroundColor: [B.medium, B.pale] }] }} />
                </div>
              </Card>
            )}
            {coView === "loc" && (
              <Card title="Co-investor Location">
                <div style={{ height: "280px" }}>
                  <Doughnut options={doughnutOpts} data={{ labels: Object.keys(coLocation), datasets: [{ data: Object.values(coLocation), backgroundColor: C }] }} />
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", borderBottom: `1px solid ${B.pale}`, paddingBottom: "12px", flex: 1 }}>
    <SubTab label="Where Capital Goes" active={activeSubTab === "where-capital"} onClick={() => setActiveSubTab("where-capital")} />
    <SubTab label="Who Provides Capital" active={activeSubTab === "who-provides"} onClick={() => setActiveSubTab("who-provides")} />
    <SubTab label="Funder Demographics" active={activeSubTab === "funder-demo"} onClick={() => setActiveSubTab("funder-demo")} />
    <SubTab label="Co-investor Analysis" active={activeSubTab === "co-investor"} onClick={() => setActiveSubTab("co-investor")} />
  </div>

  <button
    onClick={() => setShowAnalysisModal(true)}
    style={{
      padding: "8px 16px",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: 600,
      border: `1.5px solid ${B.medium}`,
      background: B.medium,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      marginLeft: "12px",
    }}
  >
    🤖 AI Analysis
  </button>
</div>


{showAnalysisModal && (
  <MarketStructureAnalysisModal
    isOpen={showAnalysisModal}
    onClose={() => setShowAnalysisModal(false)}
    marketData={prepareMarketDataForAnalysis()}
    currentUser={currentUser} // You'll need to pass currentUser from parent or auth
  />
)}
    </div>
  );
};

export default MarketStructure;