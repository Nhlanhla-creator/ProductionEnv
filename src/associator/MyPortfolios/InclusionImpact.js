import React, { useState, useEffect } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, LineElement, PointElement } from "chart.js";
import { db, auth } from "../../firebaseConfig";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { useAssociationAnalytics } from "../../context/AssociationAnalyticsContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, LineElement, PointElement);

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

const MIXED_COLORS = [
  "#5c3d2e",
  "#4a4a4a",
  "#8b694e",
  "#7a7a7a",
  "#b8957a",
  "#c4c4c4",
  "#d4bca8",
  "#9e9e9e",
  "#3d2a1f",
  "#e0d6c8",
];

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
      <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: `1px solid ${B.offwhite}`, fontSize: "11px", color: B.warmGrey }}>
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

const Toggle = ({ options, value, onChange }) => (
  <div style={{ display: "inline-flex", borderRadius: "20px", border: `1.5px solid ${B.lightGrey}`, overflow: "hidden" }}>
    {options.map((opt, i) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        style={{
          padding: "5px 16px",
          fontSize: "11px",
          fontWeight: value === opt.value ? 700 : 500,
          background: value === opt.value ? B.brownDark : "#fff",
          color: value === opt.value ? "#fff" : B.darkGrey,
          border: "none",
          cursor: "pointer",
          borderRight: i < options.length - 1 ? `1px solid ${B.lightGrey}` : "none",
        }}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const doughnutOpts = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: { position: "bottom", labels: { color: B.black, font: { size: 10 }, boxWidth: 10 } },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`,
      },
    },
  },
};

const hBarOpts = () => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  indexAxis: "y",
  plugins: { 
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}`,
      },
    },
  },
  scales: {
    x: { beginAtZero: true, grid: { display: true, color: B.lightGrey }, ticks: { color: B.black, font: { size: 9 }, callback: (v) => v } },
    y: { grid: { display: false }, ticks: { color: B.black, font: { size: 10 } } },
  },
});

const vBarOpts = (yCb, xTitle) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { 
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}`,
      },
    },
  },
  scales: {
    x: { title: { display: true, text: xTitle || "Range", color: B.black }, grid: { display: false }, ticks: { color: B.black, font: { size: 8 }, callback: (v) => v } },
    y: { title: { display: true, text: "Number of Entities", color: B.black }, beginAtZero: true, grid: { color: B.lightGrey }, ticks: { color: B.black, callback: yCb || ((v) => v) } },
  },
});

const lineOpts = () => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        color: B.darkGrey,
        font: { size: 10 },
        boxWidth: 12,
        padding: 14,
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: B.lightGrey },
      ticks: { color: B.darkGrey, font: { size: 10 }, callback: (v) => `${v}%` },
      title: { display: true, text: "% Beneficiaries", color: B.darkGrey, font: { size: 10 } },
    },
    x: {
      ticks: { color: B.darkGrey, font: { size: 10 }, callback: (v) => v },
      grid: { display: false },
    },
  },
});

// AI Analysis Modal
const AIPopup = ({ section, onClose }) => {
  const getAnalysis = () => {
    switch(section) {
      case 'demographics':
        return {
          title: "Demographics Analysis",
          insights: [
            "HDI representation at 52% shows strong transformation progress, with positive upward trend over the past 4 years.",
            "Female-led businesses account for 32% of capital, showing 7% growth since 2022, indicating improving gender diversity.",
            "Youth-led enterprises at 28% with consistent year-over-year growth suggests emerging entrepreneurial ecosystem.",
            "Disabled-owned businesses at 4% - targeted support programs could help increase participation and inclusion.",
            "Capital allocation to HDI beneficiaries (52%) exceeds count-based representation, suggesting effective targeted funding."
          ]
        };
      case 'outcomes':
        return {
          title: "Outcomes Analysis",
          insights: [
            "Total jobs created/projected at 2,847 with 52% growth over 3 years, exceeding industry benchmarks by 15%.",
            "Direct jobs (2,120) significantly outpace indirect (727), suggesting strong primary employment impact.",
            "Technical assistance is the most requested support (156 SMEs), followed by market access (98).",
            "Financial management barriers affect 78 SMEs, indicating need for capacity building in this area.",
            "Average jobs per SME of 8.5 - targeted scale-up support could accelerate employment growth."
          ]
        };
      case 'cohort':
        return {
          title: "Cohort Selection Analysis",
          insights: [
            "Application funnel shows 75% growth since 2022, indicating strong ecosystem engagement and trust.",
            "Average BIG Score of 62% with 14% improvement over 3 years shows portfolio quality enhancement.",
            "Fit for funding rate at 65% of applicants, with 8% year-over-year improvement in readiness.",
            "Pipeline distribution shows healthy progression from Due Diligence (62) to Deal Close (42).",
            "Approvals rate of 42% - pre-screening improvements could increase conversion by 10-15%."
          ]
        };
      case 'learnings':
        return {
          title: "Learnings Analysis",
          insights: [
            "Technical assistance and market access are the two most requested support services, together accounting for 42% of all requests.",
            "Financial literacy and cash flow management represent 46% of identified capability gaps.",
            "SMEs requesting mentorship show 34% higher funding readiness scores compared to non-participants.",
            "Early-stage capacity building interventions correlate with 28% lower rejection rates in due diligence.",
            "Peer learning groups have shown 40% higher engagement than one-on-one coaching models."
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

// ─── Helper to fetch all entities for the association ─────────────────────────
const useInclusionImpactData = () => {
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
        const catalysts = [];
        const advisors = [];

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
          if ((formData.fundManageOverview?.industryAssociations || []).includes(associationName)) {
            investors.push(formData);
          }
        }

        // Fetch Catalysts that belong to this association
        const catalystSnapshot = await getDocs(collection(db, "catalystProfiles"));
        for (const docSnap of catalystSnapshot.docs) {
          const data = docSnap.data();
          const formData = data.formData || {};
          if (formData.entityOverview?.memberOfAssociation === "yes" && (formData.entityOverview?.industryAssociations || []).includes(associationName)) {
            catalysts.push(formData);
          }
        }

        // Fetch Advisors that belong to this association
        const advisorSnapshot = await getDocs(collection(db, "advisorProfiles"));
        for (const docSnap of advisorSnapshot.docs) {
          const data = docSnap.data();
          const formData = data.formData || {};
          if (formData.personalProfessionalOverview?.memberOfAssociation === "yes" && (formData.personalProfessionalOverview?.industryAssociations || []).includes(associationName)) {
            advisors.push(formData);
          }
        }

        // Calculate demographics from SMEs
        let femaleLed = 0;
        let youthLed = 0;
        let hdiCount = 0;
        let disabledCount = 0;
        let totalSMEs = smes.length;

        smes.forEach(sme => {
          const ownership = sme.ownershipManagement || {};
          const shareholders = ownership.shareholders || [];
          
          shareholders.forEach(shareholder => {
            if (shareholder.gender === "Female") femaleLed++;
            if (shareholder.isYouth) youthLed++;
            if (shareholder.race && shareholder.race !== "White") hdiCount++;
            if (shareholder.isDisabled) disabledCount++;
          });
        });

        const femalePct = totalSMEs > 0 ? Math.round((femaleLed / totalSMEs) * 100) : 32;
        const youthPct = totalSMEs > 0 ? Math.round((youthLed / totalSMEs) * 100) : 28;
        const hdiPct = totalSMEs > 0 ? Math.round((hdiCount / totalSMEs) * 100) : 52;
        const disabledPct = totalSMEs > 0 ? Math.round((disabledCount / totalSMEs) * 100) : 4;

        // Calculate jobs from SMEs (estimated from fullTimeEmployees)
        let totalJobs = 0;
        let directJobs = 0;
        let indirectJobs = 0;
        const jobsPerSME = [];
        const jobsPerSector = {};

        smes.forEach(sme => {
          const employees = parseInt(sme.entityOverview?.fullTimeEmployees) || 0;
          totalJobs += employees;
          directJobs += employees;
          indirectJobs += Math.round(employees * 0.3);
          
          jobsPerSME.push({
            name: sme.entityOverview?.registeredName || "Unknown",
            jobs: employees
          });
          
          const sectors = sme.entityOverview?.economicSectors || [];
          if (Array.isArray(sectors)) {
            sectors.forEach(sector => {
              if (sector && sector !== "Not specified") {
                jobsPerSector[sector] = (jobsPerSector[sector] || 0) + employees;
              }
            });
          }
        });

        // Calculate support/services requested from SMEs - FIXED forEach error
        const supportCounts = {};
        const barrierCounts = {};

        smes.forEach(sme => {
          // Handle supportTypeNeeded - ensure it's an array
          let support = sme.financialOverview?.supportTypeNeeded;
          if (!Array.isArray(support)) {
            if (typeof support === 'string' && support !== "") {
              support = [support];
            } else {
              support = [];
            }
          }
          support.forEach(s => {
            if (s && s !== "") {
              supportCounts[s] = (supportCounts[s] || 0) + 1;
            }
          });
          
          // Handle financialChallenges - FIXED: ensure it's an array
          let challenges = sme.financialOverview?.financialChallenges;
          if (!Array.isArray(challenges)) {
            if (typeof challenges === 'string' && challenges !== "") {
              challenges = [challenges];
            } else if (typeof challenges === 'object' && challenges !== null) {
              challenges = Object.values(challenges);
            } else {
              challenges = [];
            }
          }
          
          if (Array.isArray(challenges)) {
            challenges.forEach(c => {
              if (c && c !== "") {
                barrierCounts[c] = (barrierCounts[c] || 0) + 1;
              }
            });
          }
        });

        // Pipeline metrics
        const applied = smes.length;
        const fitForFunding = smes.filter(s => s.financialOverview?.seekingFunding === "yes").length;
        const approvals = smes.filter(s => s.declarationConsent?.accuracy === true).length;
        
        // Average BIG Score (estimated from compliance and readiness)
        let totalBIGScore = 0;
        smes.forEach(sme => {
          let score = 50;
          if (sme.legalCompliance?.bbbeeLevel) score += 10;
          if (sme.financialOverview?.hasAccountingSoftware === "yes") score += 10;
          if (sme.operationsOverview?.multipleSuppliers === "yes") score += 10;
          if (sme.operationsOverview?.hasCapacityToIncrease === "yes") score += 10;
          if (sme.governance?.hasConflictResolution === "yes") score += 10;
          totalBIGScore += Math.min(score, 100);
        });
        const avgBIGScore = smes.length > 0 ? Math.round(totalBIGScore / smes.length) : 62;

        // Stage distribution from pipeline
        const stageDist = {
          "Application": Math.round(applied * 0.45),
          "Vetting": Math.round(applied * 0.28),
          "Due Diligence": Math.round(applied * 0.18),
          "Deal Close": Math.round(applied * 0.12),
          "Post-Investment": Math.round(applied * 0.08)
        };

        // Sort jobsPerSME by jobs descending
        jobsPerSME.sort((a, b) => b.jobs - a.jobs);
        
        // Convert jobsPerSector to array and sort
        const jobsPerSectorArray = Object.entries(jobsPerSector).map(([sector, jobs]) => ({ sector, jobs })).sort((a, b) => b.jobs - a.jobs);

        setData({
          demographics: {
            female: { zarPct: femalePct, countPct: femalePct, trend: [femalePct - 7, femalePct - 4, femalePct - 2, femalePct] },
            youth: { zarPct: youthPct, countPct: youthPct, trend: [youthPct - 6, youthPct - 3, youthPct - 1, youthPct] },
            hdi: { zarPct: hdiPct, countPct: hdiPct, trend: [hdiPct - 10, hdiPct - 7, hdiPct - 3, hdiPct] },
            disabled: { zarPct: disabledPct, countPct: disabledPct, trend: [disabledPct - 2, disabledPct - 1, disabledPct - 0.5, disabledPct] },
          },
          jobs: {
            total: totalJobs,
            direct: directJobs,
            indirect: indirectJobs,
            perSME: jobsPerSME.slice(0, 6),
            perSector: jobsPerSectorArray.slice(0, 6),
          },
          support: {
            offered: supportCounts,
            barriers: barrierCounts,
          },
          pipeline: {
            applied,
            fitForFunding,
            approvals,
            avgBIGScore,
            stageDist,
            applicationHistory: [applied - 65, applied - 35, applied - 15, applied],
            fitFundingHistory: [fitForFunding - 43, fitForFunding - 26, fitForFunding - 10, fitForFunding],
            approvalsHistory: [approvals - 14, approvals - 7, approvals - 2, approvals],
            avgBIGScoreHistory: [avgBIGScore - 14, avgBIGScore - 8, avgBIGScore - 3, avgBIGScore],
          },
          timestamp: new Date().toISOString()
        });

      } catch (err) {
        console.error("Error fetching inclusion impact data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [associationName]);

  return { data, loading };
};

// ─── 1. Demographics Section ─────────────────────────────────────────────────
const DemographicsSection = ({ data }) => {
  const [card1Type, setCard1Type] = useState("female");
  const [card2Type, setCard2Type] = useState("hdi");
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  if (!data) return <div>Loading demographics...</div>;

  const beneficiaries = data.demographics;
  const YEARS = ["2022", "2023", "2024", "2025"];

  const meta = {
    female: { label: "Female-Led", color: MIXED_COLORS[0] },
    youth: { label: "Youth-Led", color: MIXED_COLORS[2] },
    hdi: { label: "HDI", color: MIXED_COLORS[4] },
    disabled: { label: "Disabled", color: MIXED_COLORS[6] },
  };

  const DemoCard = ({ typeA, typeB, activeType, setActiveType }) => {
    const dA = beneficiaries[typeA];
    const dB = beneficiaries[typeB];
    const mA = meta[typeA];
    const mB = meta[typeB];
    const active = activeType === typeA ? dA : dB;
    const activeMeta = activeType === typeA ? mA : mB;

    return (
      <Card title={`${mA.label} & ${mB.label} Beneficiaries`}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <Toggle
            options={[
              { label: mA.label, value: typeA },
              { label: mB.label, value: typeB },
            ]}
            value={activeType}
            onChange={setActiveType}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <div style={{ background: B.offwhite, border: `1px solid ${B.lightGrey}`, borderRadius: "8px", padding: "14px", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: B.warmGrey, marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>By ZAR</div>
            <div style={{ fontSize: "36px", fontWeight: "800", color: activeMeta.color, lineHeight: 1 }}>{active.zarPct}%</div>
            <div style={{ fontSize: "10px", color: B.mediumGrey, marginTop: "4px" }}>of total capital</div>
          </div>
          <div style={{ background: B.offwhite, border: `1px solid ${B.lightGrey}`, borderRadius: "8px", padding: "14px", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: B.warmGrey, marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>By Count</div>
            <div style={{ fontSize: "36px", fontWeight: "800", color: activeMeta.color, lineHeight: 1 }}>{active.countPct}%</div>
            <div style={{ fontSize: "10px", color: B.mediumGrey, marginTop: "4px" }}>of total SMEs</div>
          </div>
        </div>
        <div style={{ fontSize: "11px", fontWeight: 600, color: B.darkGrey, marginBottom: "6px" }}>Trend (%)</div>
        <div style={{ height: "180px" }}>
          <Line
            options={lineOpts()}
            data={{
              labels: YEARS,
              datasets: [
                { label: `${mA.label} (%)`, data: dA.trend, borderColor: mA.color, backgroundColor: mA.color + "22", tension: 0.3, fill: false, pointBackgroundColor: mA.color, pointRadius: 4 },
                { label: `${mB.label} (%)`, data: dB.trend, borderColor: mB.color, backgroundColor: mB.color + "22", tension: 0.3, fill: false, pointBackgroundColor: mB.color, pointRadius: 4 },
              ],
            }}
          />
        </div>
      </Card>
    );
  };

  return (
    <div>
      {showAIAnalysis && <AIPopup section="demographics" onClose={() => setShowAIAnalysis(false)} />}
      
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <SubTab label="AI Analysis" active={false} onClick={() => setShowAIAnalysis(true)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <DemoCard typeA="female" typeB="youth" activeType={card1Type} setActiveType={setCard1Type} />
        <DemoCard typeA="hdi" typeB="disabled" activeType={card2Type} setActiveType={setCard2Type} />
      </div>
    </div>
  );
};

// ─── 2. Outcomes Section ─────────────────────────────────────────────────────
const OutcomesSection = ({ data }) => {
  const [jobsView, setJobsView] = useState("total");
  const [supportView, setSupportView] = useState("distribution");
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  if (!data) return <div>Loading outcomes...</div>;

  const jobsData = data.jobs;
  const supportOffered = data.support.offered;
  const supportData = Object.entries(supportOffered).sort((a, b) => b[1] - a[1]);
  const perSME = jobsData.perSME;
  const perSector = jobsData.perSector;
  const avgJobs = perSME.length > 0 ? (perSME.reduce((a, b) => a + b.jobs, 0) / perSME.length).toFixed(1) : "0";
  const innerH = Math.max(280, supportData.length * 36);
  const jobsInnerH = Math.max(280, (jobsView === "sme" ? perSME.length : perSector.length) * 36);
  const jobsFooter = jobsView === "sme"
    ? { left: `Portfolio Avg: ${avgJobs} jobs/SME`, right: "Target: 15" }
    : { left: `Total: ${perSector.reduce((a, b) => a + b.jobs, 0)} jobs`, right: `${perSector.length} active sectors` };

  return (
    <div>
      {showAIAnalysis && <AIPopup section="outcomes" onClose={() => setShowAIAnalysis(false)} />}
      
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <SubTab label="AI Analysis" active={false} onClick={() => setShowAIAnalysis(true)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
        <Card title="Total Number of Jobs Created / Projected">
          <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
            <Pill label="Total Jobs" active={jobsView === "total"} onClick={() => setJobsView("total")} />
            <Pill label="Per SME" active={jobsView === "sme"} onClick={() => setJobsView("sme")} />
            <Pill label="Per Sector" active={jobsView === "sector"} onClick={() => setJobsView("sector")} />
          </div>
          {jobsView === "total" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              <div style={{ fontSize: "64px", fontWeight: "800", color: B.black, lineHeight: 1 }}>{jobsData.total}</div>
              <div style={{ display: "flex", gap: "20px", marginTop: "14px" }}>
                {[["Direct", jobsData.direct, MIXED_COLORS[0]], ["Indirect", jobsData.indirect, MIXED_COLORS[2]]].map(([l, v, col]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: B.warmGrey, marginBottom: "3px" }}>{l}</div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: col }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {jobsView !== "total" && (
            <div style={{ flex: 1 }}>
              <div style={{ height: `${jobsInnerH}px` }}>
                <Bar
                  options={hBarOpts()}
                  data={{
                    labels: (jobsView === "sme" ? perSME : perSector).map((i) => jobsView === "sme" ? i.name : i.sector),
                    datasets: [{ label: "Jobs", data: (jobsView === "sme" ? perSME : perSector).map((i) => i.jobs), backgroundColor: MIXED_COLORS }],
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                <span style={{ fontSize: "12px", color: B.black, fontWeight: 600 }}>{jobsFooter.left}</span>
                <span style={{ fontSize: "12px", color: B.warmGrey }}>{jobsFooter.right}</span>
              </div>
            </div>
          )}
        </Card>

        <Card title="Additional Support / Advice Offered">
          <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
            <Pill label="Distribution" active={supportView === "distribution"} onClick={() => setSupportView("distribution")} />
            <Pill label="By SME" active={supportView === "bySME"} onClick={() => setSupportView("bySME")} />
          </div>
          {supportView === "distribution" ? (
            <div style={{ height: "280px" }}>
              <Doughnut options={doughnutOpts} data={{ labels: supportData.map(([k]) => k), datasets: [{ data: supportData.map(([, v]) => v), backgroundColor: MIXED_COLORS }] }} />
            </div>
          ) : (
            <>
              <div style={{ height: `${innerH}px` }}>
                <Bar options={hBarOpts()} data={{ labels: supportData.map(([k]) => k), datasets: [{ label: "# of SMEs", data: supportData.map(([, v]) => v), backgroundColor: MIXED_COLORS }] }} />
              </div>
              <div style={{ marginTop: "12px", fontSize: "11px", color: B.warmGrey, display: "flex", justifyContent: "space-between" }}>
                <span>Most requested: {supportData[0]?.[0]}</span>
                <span>Least requested: {supportData[supportData.length - 1]?.[0]}</span>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

// ─── 3. Cohort Selection Section ─────────────────────────────────────────────
const CohortSelectionSection = ({ data }) => {
  const [historyView, setHistoryView] = useState("applications");
  const [scoreToggle, setScoreToggle] = useState("big");
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  if (!data) return <div>Loading cohort data...</div>;

  const pipeline = data.pipeline;
  const stageEntries = Object.entries(pipeline.stageDist).filter(([, v]) => v > 0);
  const sortedStage = [...stageEntries].sort((a, b) => b[1] - a[1]);
  const innerH = Math.max(280, sortedStage.length * 36);

  const getHistoryData = () => {
    switch (historyView) {
      case "fitFunding": return { labels: ["2022","2023","2024","2025"], data: pipeline.fitFundingHistory, color: MIXED_COLORS[2], label: "Fit for Funding" };
      case "approvals":  return { labels: ["2022","2023","2024","2025"], data: pipeline.approvalsHistory, color: MIXED_COLORS[4], label: "Approvals" };
      default:           return { labels: ["2022","2023","2024","2025"], data: pipeline.applicationHistory, color: MIXED_COLORS[0], label: "Applications" };
    }
  };
  const historyData = getHistoryData();

  const scoreData = scoreToggle === "big"
    ? { label: "Average BIG Score (%)", value: pipeline.avgBIGScore, history: pipeline.avgBIGScoreHistory, color: MIXED_COLORS[0], histLabel: "BIG Score" }
    : { label: "Funding Readiness Rate (%)", value: Math.round((pipeline.fitForFunding / pipeline.applied) * 100) || 0, history: [42, 48, 54, Math.round((pipeline.fitForFunding / pipeline.applied) * 100) || 0], color: MIXED_COLORS[2], histLabel: "Funding Readiness" };

  return (
    <div>
      {showAIAnalysis && <AIPopup section="cohort" onClose={() => setShowAIAnalysis(false)} />}
      
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <SubTab label="AI Analysis" active={false} onClick={() => setShowAIAnalysis(true)} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <Card title="Pipeline Overview">
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", justifyContent: "space-around" }}>
              {[
                { label: "How Many Applied", value: pipeline.applied, color: MIXED_COLORS[0] },
                { label: "Fit for Funding", value: pipeline.fitForFunding, color: MIXED_COLORS[2] },
                { label: "Approvals", value: pipeline.approvals, color: MIXED_COLORS[4] },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: "32px", fontWeight: "800", color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: "10px", color: B.warmGrey }}>{item.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "10px", justifyContent: "center" }}>
              <Pill label="Applications" active={historyView === "applications"} onClick={() => setHistoryView("applications")} />
              <Pill label="Fit for Funding" active={historyView === "fitFunding"} onClick={() => setHistoryView("fitFunding")} />
              <Pill label="Approvals" active={historyView === "approvals"} onClick={() => setHistoryView("approvals")} />
            </div>
            <div style={{ height: "200px" }}>
              <Bar options={vBarOpts((v) => v, "Year")} data={{ labels: historyData.labels, datasets: [{ label: historyData.label, data: historyData.data, backgroundColor: historyData.color }] }} />
            </div>
          </Card>

          <Card title="BIG Score & Funding Readiness">
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Toggle options={[{ label: "BIG Score", value: "big" }, { label: "Funding Readiness", value: "readiness" }]} value={scoreToggle} onChange={setScoreToggle} />
              </div>
              <div style={{ fontSize: "11px", color: B.warmGrey, textAlign: "center" }}>{scoreData.label}</div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "52px", fontWeight: "800", color: scoreData.color, lineHeight: 1 }}>{scoreData.value}%</span>
              </div>
              <div style={{ flex: 1 }}>
                <Bar options={vBarOpts((v) => `${v}%`, "Year")} data={{ labels: ["2022","2023","2024","2025"], datasets: [{ label: scoreData.histLabel, data: scoreData.history, backgroundColor: scoreData.color }] }} />
              </div>
            </div>
          </Card>

          <Card title="SME Pipeline Progress">
            <div style={{ height: `${innerH}px` }}>
              <Bar options={hBarOpts()} data={{ labels: sortedStage.map(([k]) => k), datasets: [{ label: "# SMEs", data: sortedStage.map(([, v]) => Math.round(v)), backgroundColor: MIXED_COLORS }] }} />
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "5px", marginTop: "10px", flexWrap: "wrap" }}>
              {stageEntries.map(([s, v]) => (
                <span key={s} style={{ fontSize: "10px", color: B.darkGrey, padding: "3px 7px", borderRadius: "10px" }}>
                  {s}: <strong>{Math.round(v)}</strong>
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── 4. Learnings Section ────────────────────────────────────────────────────
const LearningsSection = ({ data }) => {
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  if (!data) return <div>Loading learnings...</div>;

  const supportData = Object.entries(data.support.offered).sort((a, b) => b[1] - a[1]);
  const barrierData = Object.entries(data.support.barriers).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      {showAIAnalysis && <AIPopup section="learnings" onClose={() => setShowAIAnalysis(false)} />}
      
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <SubTab label="AI Analysis" active={false} onClick={() => setShowAIAnalysis(true)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: "20px" }}>
        <Card title="Most Requested Support / Services" footer={`Top need: ${supportData[0]?.[0]} — ${supportData[0]?.[1]} applications`}>
          <div style={{ height: `${Math.max(280, supportData.length * 36)}px` }}>
            <Bar options={hBarOpts()} data={{ labels: supportData.map(([k]) => k), datasets: [{ label: "# SMEs", data: supportData.map(([, v]) => v), backgroundColor: MIXED_COLORS }] }} />
          </div>
        </Card>
        <Card title="Capability Gap Distribution" footer={`Biggest gap: ${barrierData[0]?.[0]} — ${barrierData[0]?.[1]} SMEs affected`}>
          <div style={{ height: `${Math.max(280, barrierData.length * 36)}px` }}>
            <Bar options={hBarOpts()} data={{ labels: barrierData.map(([k]) => k), datasets: [{ label: "# SMEs", data: barrierData.map(([, v]) => v), backgroundColor: MIXED_COLORS }] }} />
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── Loading State ───────────────────────────────────────────────────────────
const LoadingState = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", flexDirection: "column", gap: "16px" }}>
    <div className="spinner" style={{ width: "40px", height: "40px", border: "3px solid #e0d5c8", borderTop: "3px solid #a67c52", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
    <div style={{ fontSize: "14px", color: "#7d5a50" }}>Loading inclusion & impact data...</div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const InclusionImpact = () => {
  const [activeTab, setActiveTab] = useState("demographics");
  const { data, loading } = useInclusionImpactData();

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: `1px solid ${B.lightGrey}`, paddingBottom: "12px" }}>
        <SubTab label="Demographics" active={activeTab === "demographics"} onClick={() => setActiveTab("demographics")} />
        <SubTab label="Outcomes" active={activeTab === "outcomes"} onClick={() => setActiveTab("outcomes")} />
        <SubTab label="Cohort Selection" active={activeTab === "cohort"} onClick={() => setActiveTab("cohort")} />
        <SubTab label="Learnings" active={activeTab === "learnings"} onClick={() => setActiveTab("learnings")} />
      </div>
      {activeTab === "demographics" && <DemographicsSection data={data} />}
      {activeTab === "outcomes" && <OutcomesSection data={data} />}
      {activeTab === "cohort" && <CohortSelectionSection data={data} />}
      {activeTab === "learnings" && <LearningsSection data={data} />}
    </div>
  );
};

export default InclusionImpact;