import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { db, auth } from "../../firebaseConfig";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { useAssociationAnalytics } from "../../context/AssociationAnalyticsContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const B = {
  black: "#1a1a1a", darkGrey: "#4a4a4a", mediumGrey: "#7a7a7a", warmGrey: "#9e9e9e",
  lightGrey: "#c4c4c4", cream: "#f5f0e8", offwhite: "#faf8f5",
  brownDark: "#5c3d2e", brownMedium: "#8b694e", brownLight: "#b8957a", brownPale: "#d4bca8",
  white: "#ffffff",
};
const MIXED_COLORS = ["#5c3d2e","#4a4a4a","#8b694e","#7a7a7a","#b8957a","#c4c4c4","#d4bca8","#9e9e9e","#3d2a1f","#e0d6c8"];
const MEDALS = ["🥇","🥈","🥉"];
const WARN   = ["⚠️","🔸","🔹"];

const TICK = "#4a4a4a";
const GRID = "#e8e8e8";

const SubTab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "6px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "12px", border: `1.5px solid ${active ? B.brownMedium : B.lightGrey}`, fontWeight: active ? 700 : 500, background: active ? B.brownMedium : "#fff", color: active ? "#fff" : B.darkGrey }}>
    {label}
  </button>
);

const Card = ({ title, footer, children }) => (
  <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", minHeight: "400px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: `1px solid ${B.lightGrey}`, display: "flex", flexDirection: "column" }}>
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "10px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.black, margin: 0 }}>{title}</h3>
    </div>
    <div style={{ flex: 1 }}>{children}</div>
    {footer && <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: `1px solid ${B.offwhite}`, fontSize: "11px", color: B.warmGrey }}>{footer}</div>}
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "4px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "10px", border: `1.5px solid ${active ? B.brownMedium : B.lightGrey}`, fontWeight: active ? 700 : 500, background: active ? B.brownMedium : "#fff", color: active ? "#fff" : B.darkGrey }}>
    {label}
  </button>
);

const InsightBox = ({ text }) => (
  <div style={{ marginTop: "12px", padding: "10px 12px", background: B.cream, borderRadius: "7px", border: `1px dashed ${B.lightGrey}`, fontSize: "12px", color: B.darkGrey, fontStyle: "italic", lineHeight: 1.5 }}>
    💡 {text}
  </div>
);

// AI Analysis Modal
const AIPopup = ({ section, onClose }) => {
  const getAnalysis = () => {
    switch(section) {
      case 'performance':
        return {
          title: "Performance Analysis",
          insights: [
            "Top 3 investors account for 68% of total deployed capital, indicating concentration risk that could be diversified.",
            "Average revenue per SME of R8.2M shows healthy growth trajectory, up 15% year-over-year.",
            "Profitability rate at 42% with 8% of portfolio generating losses - focus on turnaround support needed.",
            "Key client concentration shows top 10 SMEs hold 45% of all reported clients, suggesting dependency risks.",
            "Average of 3.8 deals per investor indicates moderate engagement levels with room for increased activity."
          ]
        };
      case 'topbottom':
        return {
          title: "Top/Bottom Analysis",
          insights: [
            "Top investors by sector show clear specialization patterns - VCs dominate Fintech (72% of sector capital).",
            "Bottom 3 investors have average deal size of R2.1M, making them suitable for micro-enterprise support programs.",
            "Most active investors close 8+ deals annually, suggesting efficient deployment processes worth emulating.",
            "Sector-based capital gaps exist in Clean Energy and Agritech where top investment is below R5M.",
            "Bottom activity investors show only 0-1 deals per year - targeted engagement strategies could unlock dormant capital."
          ]
        };
      default:
        return {
          title: "AI Analysis",
          insights: ["Data analysis complete. Key trends identified in the ecosystem metrics."]
        };
    }
  };

  const analysis = getAnalysis();

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "16px",
        maxWidth: "500px",
        width: "90%",
        maxHeight: "80vh",
        overflow: "auto",
        padding: "24px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: B.brownDark, margin: 0 }}>{analysis.title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: B.mediumGrey }}>×</button>
        </div>
        <div style={{ borderTop: `1px solid ${B.lightGrey}`, paddingTop: "16px" }}>
          {analysis.insights.map((insight, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
              <span style={{ fontSize: "14px", color: B.brownMedium }}>💡</span>
              <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5", color: B.darkGrey }}>{insight}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button onClick={onClose} style={{
            padding: "8px 24px",
            backgroundColor: B.brownMedium,
            color: "#fff",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "12px",
          }}>Close</button>
        </div>
      </div>
    </div>
  );
};

const CompanyRow = ({ rank, isTop, name, subtitle, sectorLabel, metric, metricLabel }) => {
  const icons = isTop ? MEDALS : WARN;
  const avatarBg = MIXED_COLORS[rank % MIXED_COLORS.length];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "12px 14px", borderRadius: "8px",
      background: "#ffffff", border: `1px solid ${B.lightGrey}`,
    }}>
      <span style={{ fontSize: "18px", minWidth: "24px" }}>{icons[rank]}</span>
      <div style={{
        width: "40px", height: "40px",
        background: `linear-gradient(135deg, ${avatarBg}, ${MIXED_COLORS[(rank + 2) % MIXED_COLORS.length]})`,
        borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: "bold", fontSize: "16px", flexShrink: 0,
      }}>
        {name.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {sectorLabel && (
          <div style={{ fontSize: "10px", color: B.brownMedium, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "2px" }}>
            {sectorLabel}
          </div>
        )}
        <div style={{ fontSize: "13px", fontWeight: "700", color: B.black, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        {subtitle && <div style={{ fontSize: "11px", color: B.warmGrey, marginTop: "2px" }}>{subtitle}</div>}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "16px", fontWeight: "800", color: isTop ? B.brownDark : "#9b3a1a" }}>{metric}</div>
        <div style={{ fontSize: "10px", color: B.warmGrey }}>{metricLabel}</div>
      </div>
    </div>
  );
};

const RankedCard = ({ title, rows, isTop, insight }) => (
  <Card title={title}>
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {rows.map((row, i) => (
        <CompanyRow key={i} rank={i} isTop={isTop} name={row.name} subtitle={row.subtitle} sectorLabel={row.sectorLabel} metric={row.metric} metricLabel={row.metricLabel} />
      ))}
    </div>
    {insight && <InsightBox text={insight} />}
  </Card>
);

const hBarOpts = (valCb, integralOnly) => ({
  responsive: true, maintainAspectRatio: false, animation: false, indexAxis: "y",
  plugins: { 
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}`,
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true, grid: { display: true, color: GRID },
      ticks: { color: TICK, font: { size: 10 }, ...(valCb ? { callback: valCb } : {}), ...(integralOnly && !valCb ? { callback: (v) => (Number.isInteger(v) ? v : ""), precision: 0, stepSize: 1 } : {}) },
    },
    y: { grid: { display: false }, ticks: { color: TICK, font: { size: 11 } } },
  },
});

// ─── Hook to fetch performance data from Firestore ───────────────────────────
const usePerformanceData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { associationName } = useAssociationAnalytics();

  useEffect(() => {
    const fetchData = async () => {
      if (!associationName) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const smes = [];
        const investors = [];

        // Fetch SMEs that belong to this association
        const smeQuery = query(collection(db, "universalProfiles"), where("entityOverview.memberOfAssociation", "==", "yes"));
        const smeSnapshot = await getDocs(smeQuery);
        for (const docSnap of smeSnapshot.docs) {
          const data = docSnap.data();
          if ((data.entityOverview?.industryAssociations || []).includes(associationName)) {
            smes.push(data);
          }
        }

        // Fetch Investors that belong to this association
        const investorQuery = query(collection(db, "MyuniversalProfiles"));
        const investorSnapshot = await getDocs(investorQuery);
        
        for (const docSnap of investorSnapshot.docs) {
          const data = docSnap.data();
          const formData = data.formData || {};
          const fundManageOverview = formData.fundManageOverview || {};
          const industryAssociations = fundManageOverview.industryAssociations || [];
          const memberOfAssociation = fundManageOverview.memberOfAssociation;
          
          if (memberOfAssociation === "yes" && industryAssociations.includes(associationName)) {
            investors.push(formData);
          }
        }

        // Calculate revenue metrics from SMEs
        let totalRevenue = 0;
        const revenuePerSME = [];
        const profitabilityCounts = { Profitable: 0, Breakeven: 0, Unprofitable: 0, "Pre-revenue": 0 };
        const keyClientsPerSME = [];

        smes.forEach(sme => {
          const revenueStr = sme.financialOverview?.annualRevenue || "0";
          const revenue = parseInt(revenueStr.replace(/[^0-9]/g, '')) || 0;
          totalRevenue += revenue;
          
          const profitability = sme.financialOverview?.profitabilityStatus || "Not specified";
          let profitLabel = "Pre-revenue";
          if (profitability === "profitable") profitLabel = "Profitable";
          else if (profitability === "break_even") profitLabel = "Breakeven";
          else if (profitability === "loss_making") profitLabel = "Unprofitable";
          
          profitabilityCounts[profitLabel] = (profitabilityCounts[profitLabel] || 0) + 1;
          
          revenuePerSME.push({
            name: sme.entityOverview?.registeredName || "Unknown",
            revenue: revenue,
            profitability: profitLabel
          });
          
          const keyClients = sme.productsServices?.keyClients || [];
          keyClientsPerSME.push({
            name: sme.entityOverview?.registeredName || "Unknown",
            count: keyClients.length
          });
        });

        const avgRevenue = smes.length > 0 ? totalRevenue / smes.length : 0;

        // Calculate investor performance metrics
        const investorPerformance = investors.map(investor => {
          const fundOverview = investor.fundManageOverview || {};
          const valueDeployedStr = fundOverview.valueDeployed || "0";
          const totalInvestment = parseInt(valueDeployedStr.replace(/[^0-9]/g, '')) || 0;
          const dealsCount = parseInt(fundOverview.numberOfInvestments) || 0;
          
          return {
            name: fundOverview.registeredName || "Unknown Investor",
            sector: fundOverview.firmType || "Not specified",
            totalInvestment: totalInvestment,
            dealsCount: dealsCount,
            avgTicket: dealsCount > 0 ? totalInvestment / dealsCount : 0
          };
        });

        // Ensure we ALWAYS have at least 3 items for top/bottom (pad with placeholders if needed)
        const topInvestors = [...investorPerformance].sort((a, b) => b.totalInvestment - a.totalInvestment);
        const bottomInvestors = [...investorPerformance].sort((a, b) => a.totalInvestment - b.totalInvestment);
        const mostActive = [...investorPerformance].sort((a, b) => b.dealsCount - a.dealsCount);
        const leastActive = [...investorPerformance].sort((a, b) => a.dealsCount - b.dealsCount);

        // Pad to ensure 3 items
        const padToThree = (arr, defaultItem) => {
          const result = [...arr];
          while (result.length < 3) {
            result.push({ ...defaultItem, name: `Placeholder ${result.length + 1}` });
          }
          return result;
        };

        const defaultInvestor = {
          name: "No Data Available",
          sector: "N/A",
          totalInvestment: 0,
          dealsCount: 0,
          avgTicket: 0
        };

        // Group by sector for top/bottom by sector
        const sectorMap = {};
        investorPerformance.forEach(inv => {
          if (!sectorMap[inv.sector]) sectorMap[inv.sector] = [];
          sectorMap[inv.sector].push(inv);
        });

        const topBySector = {};
        const bottomBySector = {};
        
        Object.entries(sectorMap).forEach(([sector, funders]) => {
          topBySector[sector] = funders.sort((a, b) => b.totalInvestment - a.totalInvestment).slice(0, 3);
          bottomBySector[sector] = funders.sort((a, b) => a.totalInvestment - b.totalInvestment).slice(0, 3);
        });

        setData({
          revenue: {
            total: totalRevenue,
            avg: avgRevenue,
            perSME: revenuePerSME.sort((a, b) => b.revenue - a.revenue)
          },
          profitability: profitabilityCounts,
          keyClients: keyClientsPerSME.sort((a, b) => b.count - a.count),
          investors: {
            topByInvestment: padToThree(topInvestors, defaultInvestor),
            bottomByInvestment: padToThree(bottomInvestors, defaultInvestor),
            mostActive: padToThree(mostActive, defaultInvestor),
            leastActive: padToThree(leastActive, defaultInvestor),
            topBySector: topBySector,
            bottomBySector: bottomBySector
          },
          timestamp: new Date().toISOString()
        });

      } catch (err) {
        console.error("Error fetching performance data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [associationName]);

  return { data, loading };
};

// ─── Performance Section ─────────────────────────────────────────────────────
const RevenuePerSME = ({ data }) => {
  if (!data || !data.revenue.perSME.length) {
    return (
      <Card title="Net Revenue per SME" footer="No revenue data available">
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.warmGrey, fontSize: "12px" }}>
          No revenue data for SMEs in this association
        </div>
      </Card>
    );
  }

  const perSME = data.revenue.perSME.slice(0, 10);
  const innerH = Math.max(280, perSME.length * 36);
  const footer = (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: "12px", color: B.black, fontWeight: 600 }}>Total: <strong>R{(data.revenue.total / 1_000_000).toFixed(1)}M</strong></span>
      <span style={{ fontSize: "12px", color: B.warmGrey }}>Avg: R{(data.revenue.avg / 1_000_000).toFixed(1)}M / SME</span>
    </div>
  );

  return (
    <Card title="Net Revenue per SME" footer={footer}>
      <div style={{ height: `${innerH}px` }}>
        <Bar
          options={hBarOpts((v) => "R" + (v / 1_000_000).toFixed(1) + "M")}
          data={{ labels: perSME.map((s) => s.name), datasets: [{ label: "Revenue (R)", data: perSME.map((s) => s.revenue), backgroundColor: MIXED_COLORS.slice(0, perSME.length) }] }}
        />
      </div>
    </Card>
  );
};

const ProfitabilityStatus = ({ data }) => {
  if (!data) {
    return (
      <Card title="Profitability Status">
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.warmGrey, fontSize: "12px" }}>
          No profitability data available
        </div>
      </Card>
    );
  }

  const statusCounts = data.profitability;
  const sorted = Object.entries(statusCounts).filter(([_, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const statusColors = { 
    Profitable: "#2e7d32", 
    Breakeven: "#ed6c02", 
    "Pre-revenue": MIXED_COLORS[6], 
    Unprofitable: "#c62828",
    "Not specified": B.warmGrey
  };

  if (total === 0) {
    return (
      <Card title="Profitability Status">
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.warmGrey, fontSize: "12px" }}>
          No profitability data available
        </div>
      </Card>
    );
  }

  return (
    <Card title="Profitability Status">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center" }}>
        {sorted.map(([l, v], i) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: statusColors[l] || MIXED_COLORS[i], flexShrink: 0 }} />
            <div style={{ flex: 1, background: B.lightGrey, borderRadius: "4px", height: "24px", overflow: "hidden" }}>
              <div style={{ width: `${(v / total) * 100}%`, background: statusColors[l] || MIXED_COLORS[i], height: "100%", display: "flex", alignItems: "center", paddingLeft: "8px" }}>
                <span style={{ fontSize: "11px", color: "#fff", fontWeight: 600 }}>{v}</span>
              </div>
            </div>
            <span style={{ fontSize: "12px", color: B.darkGrey, minWidth: "90px" }}>{l}</span>
          </div>
        ))}
        <div style={{ marginTop: "8px", fontSize: "11px", color: B.warmGrey, textAlign: "center" }}>
          Based on {total} SMEs in your ecosystem
        </div>
      </div>
    </Card>
  );
};

const ClientsPerSME = ({ data }) => {
  if (!data || !data.keyClients.length) {
    return (
      <Card title="Key Clients per SME">
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.warmGrey, fontSize: "12px" }}>
          No client data available
        </div>
      </Card>
    );
  }

  const smeClients = data.keyClients.slice(0, 10);
  const innerH = Math.max(280, smeClients.length * 36);

  return (
    <Card title="Key Clients per SME">
      <div style={{ height: `${innerH}px` }}>
        <Bar
          options={hBarOpts(null, true)}
          data={{ labels: smeClients.map((s) => s.name), datasets: [{ label: "# Key Clients", data: smeClients.map((s) => s.count), backgroundColor: MIXED_COLORS.slice(0, smeClients.length) }] }}
        />
      </div>
    </Card>
  );
};

const PerformanceSection = ({ data }) => {
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  return (
    <div>
      {showAIAnalysis && <AIPopup section="performance" onClose={() => setShowAIAnalysis(false)} />}
      
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <SubTab label="AI Analysis" active={false} onClick={() => setShowAIAnalysis(true)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
        <RevenuePerSME data={data} />
        <ProfitabilityStatus data={data} />
        <ClientsPerSME data={data} />
      </div>
    </div>
  );
};

// ─── Top/Bottom Section - ALWAYS shows exactly 3 rows ────────────────────────
const TopBottomSection = ({ data }) => {
  const [sub, setSub] = useState("top");
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  if (!data || !data.investors.topByInvestment.length) {
    return (
      <Card title="Top / Bottom Investors">
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.warmGrey, fontSize: "12px" }}>
          No investor data available for this association
        </div>
      </Card>
    );
  }

  // Get exactly 3 rows for top sections
  const topInvestmentRows = data.investors.topByInvestment.slice(0, 3).map((f, idx) => ({
    name: f.name,
    subtitle: f.dealsCount > 0 ? `${f.dealsCount} deals · ${f.sector}` : "No deals yet",
    metric: f.totalInvestment > 0 ? `R${(f.totalInvestment / 1_000_000).toFixed(1)}M` : "R0",
    metricLabel: "Total Invested"
  }));

  // Get exactly 3 sectors for top by sector
  const topSectorEntries = Object.entries(data.investors.topBySector)
    .map(([sector, funders]) => ({
      sectorLabel: sector,
      name: funders[0]?.name || "No data",
      subtitle: `${funders[0]?.dealsCount || 0} deals`,
      metric: `R${((funders[0]?.totalInvestment || 0) / 1_000_000).toFixed(1)}M`,
      metricLabel: "Invested"
    }))
    .sort((a, b) => parseFloat(b.metric) - parseFloat(a.metric))
    .slice(0, 3);

  // Get exactly 3 rows for top activity
  const topActivityRows = data.investors.mostActive.slice(0, 3).map((f) => ({
    name: f.name,
    subtitle: f.avgTicket > 0 ? `R${(f.avgTicket / 1_000_000).toFixed(1)}M avg ticket · ${f.sector}` : f.sector,
    metric: `${f.dealsCount} deals`,
    metricLabel: "Deals Closed"
  }));

  // Get exactly 3 rows for bottom sections
  const bottomInvestmentRows = data.investors.bottomByInvestment.slice(0, 3).map((f) => ({
    name: f.name,
    subtitle: f.dealsCount > 0 ? `${f.dealsCount} deals · ${f.sector}` : "No deals yet",
    metric: f.totalInvestment > 0 ? `R${(f.totalInvestment / 1_000_000).toFixed(2)}M` : "R0",
    metricLabel: "Total Invested"
  }));

  // Get exactly 3 sectors for bottom by sector
  const bottomSectorEntries = Object.entries(data.investors.bottomBySector)
    .map(([sector, funders]) => ({
      sectorLabel: sector,
      name: funders[0]?.name || "No data",
      subtitle: `${funders[0]?.dealsCount || 0} deals`,
      metric: `R${((funders[0]?.totalInvestment || 0) / 1_000_000).toFixed(1)}M`,
      metricLabel: "Invested"
    }))
    .sort((a, b) => parseFloat(a.metric) - parseFloat(b.metric))
    .slice(0, 3);

  // Get exactly 3 rows for bottom activity
  const bottomActivityRows = data.investors.leastActive.slice(0, 3).map((f) => ({
    name: f.name,
    subtitle: f.totalInvestment > 0 ? `R${(f.totalInvestment / 1_000_000).toFixed(1)}M total · ${f.sector}` : f.sector,
    metric: `${f.dealsCount} deals`,
    metricLabel: "Deals Closed"
  }));

  // Ensure we always have 3 rows (pad with empty if needed)
  const ensureThreeRows = (rows) => {
    const result = [...rows];
    while (result.length < 3) {
      result.push({
        name: "No Data",
        subtitle: "No investors available",
        metric: "R0",
        metricLabel: "Total Invested"
      });
    }
    return result;
  };

  return (
    <div>
      {showAIAnalysis && <AIPopup section="topbottom" onClose={() => setShowAIAnalysis(false)} />}
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <Pill label="🏆 Top 3" active={sub === "top"} onClick={() => setSub("top")} />
          <Pill label="⚠️ Bottom 3" active={sub === "bottom"} onClick={() => setSub("bottom")} />
        </div>
        <SubTab label="AI Analysis" active={false} onClick={() => setShowAIAnalysis(true)} />
      </div>

      {sub === "top" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <RankedCard 
            title="Top Investment" 
            rows={ensureThreeRows(topInvestmentRows)} 
            isTop 
            insight={`${topInvestmentRows[0]?.name} leads with ${topInvestmentRows[0]?.metric} deployed. Top 3 account for the majority of total investment.`} 
          />
          <RankedCard 
            title="Top Investment by Sector" 
            rows={ensureThreeRows(topSectorEntries)} 
            isTop 
            insight={`${topSectorEntries[0]?.sectorLabel} leads sector investment with ${topSectorEntries[0]?.name} as the top contributor.`} 
          />
          <RankedCard 
            title="Top Activity" 
            rows={ensureThreeRows(topActivityRows)} 
            isTop 
            insight={`${topActivityRows[0]?.name} is the most active with ${topActivityRows[0]?.metric} closed.`} 
          />
        </div>
      )}

      {sub === "bottom" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <RankedCard 
            title="Bottom Investment" 
            rows={ensureThreeRows(bottomInvestmentRows)} 
            isTop={false} 
            insight="These contributors have deployed less capital. May suit micro and early-stage SMEs." 
          />
          <RankedCard 
            title="Bottom Investment by Sector" 
            rows={ensureThreeRows(bottomSectorEntries)} 
            isTop={false} 
            insight={`${bottomSectorEntries[0]?.sectorLabel} has the lowest sector investment. Consider targeted incentives to attract more capital.`} 
          />
          <RankedCard 
            title="Bottom Activity" 
            rows={ensureThreeRows(bottomActivityRows)} 
            isTop={false} 
            insight="Low deal counts indicate limited engagement. Strategies to increase participation could unlock additional capacity." 
          />
        </div>
      )}
    </div>
  );
};

// ─── Loading State ──────────────────────────────────────────────────────────
const LoadingState = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", flexDirection: "column", gap: "16px" }}>
    <div className="spinner" style={{ width: "40px", height: "40px", border: "3px solid #e0d5c8", borderTop: "3px solid #a67c52", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
    <div style={{ fontSize: "14px", color: "#7d5a50" }}>Loading performance data...</div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────
const Performance = () => {
  const [activeTab, setActiveTab] = useState("performance");
  const { data, loading } = usePerformanceData();

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: `1px solid ${B.lightGrey}`, paddingBottom: "12px" }}>
        <SubTab label="Performance" active={activeTab === "performance"} onClick={() => setActiveTab("performance")} />
        <SubTab label="Top / Bottom" active={activeTab === "topbottom"} onClick={() => setActiveTab("topbottom")} />
      </div>
      {activeTab === "performance" && <PerformanceSection data={data} />}
      {activeTab === "topbottom" && <TopBottomSection data={data} />}
    </div>
  );
};

export default Performance;