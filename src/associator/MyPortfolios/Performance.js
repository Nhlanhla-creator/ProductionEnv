// Performance.js - Complete updated component

import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { db, auth } from "../../firebaseConfig";
import { collection, query, where, getDocs, getDoc, doc, setDoc, addDoc, serverTimestamp, orderBy, limit } from "firebase/firestore";
import { useAssociationAnalytics } from "../../context/AssociationAnalyticsContext";
import { getFunctions, httpsCallable } from "firebase/functions";

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

// ─── Save Analysis to Firebase ───────────────────────────────────────────────
const saveAnalysisToFirebase = async (userId, analysisType, analysisData, sourceData) => {
  try {
    console.log("🔍 Starting save to Firebase for Performance analysis...");
    
    if (!auth.currentUser) {
      throw new Error("No authenticated user");
    }
    
    const userAnalysesRef = collection(db, "users", userId, "aiAnalyses");
    
    const analysisDoc = {
      type: analysisType,
      title: `${analysisType.replace(/-/g, " ")} Analysis`,
      analysis: analysisData,
      sourceData: sourceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId: userId,
      createdAtISO: new Date().toISOString(),
    };

    const docRef = await addDoc(userAnalysesRef, analysisDoc);
    console.log(`✅ Performance analysis saved with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error saving performance analysis to Firebase:", error);
    throw error;
  }
};

// ─── Fetch Latest Analysis from Firebase ─────────────────────────────────────
const fetchLatestAnalysis = async (userId, analysisType) => {
  try {
    const userAnalysesRef = collection(db, "users", userId, "aiAnalyses");
    const q = query(
      userAnalysesRef, 
      where("type", "==", analysisType),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const latestDoc = querySnapshot.docs[0];
      const data = latestDoc.data();
      console.log(`✅ Retrieved latest ${analysisType} analysis from Firebase`);
      return {
        id: latestDoc.id,
        analysis: data.analysis,
        sourceData: data.sourceData,
        createdAt: data.createdAt
      };
    }
    
    return null;
  } catch (error) {
    console.error("❌ Error fetching analysis from Firebase:", error);
    throw error;
  }
};

// ─── AI Analysis Modal ────────────────────────────────────────────────────────
const AIAnalysisModal = ({ isOpen, title, analysisData, loading, error, onClose, onNewAnalysis, isSaving, saveSuccess, hasSavedAnalysis, onViewSaved }) => {
  if (!isOpen) return null;

  const renderAnalysis = () => {
    if (loading) {
      return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px", flexDirection: "column", gap: "16px" }}>
          <div className="spinner" style={{ width: "40px", height: "40px", border: "3px solid #e0d5c8", borderTop: "3px solid #a67c52", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
          <div style={{ fontSize: "14px", color: "#7d5a50" }}>Generating AI analysis...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ padding: "20px", background: "#fce4ec", borderRadius: "8px", color: "#c62828" }}>
          <p style={{ margin: 0, fontSize: "14px" }}>⚠️ Failed to generate analysis: {error}</p>
        </div>
      );
    }

    if (!analysisData) return null;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Save Success Message */}
        {saveSuccess && (
          <div style={{ padding: "12px 16px", background: "#e8f5e9", borderRadius: "8px", color: "#2e7d32", border: `1px solid #c8e6c9`, display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>✓</span>
            <span style={{ fontSize: "13px", fontWeight: 500 }}>Analysis saved to your dashboard</span>
          </div>
        )}

        {/* Overall Assessment */}
        <div style={{ background: B.offwhite, padding: "16px", borderRadius: "8px", borderLeft: `4px solid ${B.brownMedium}` }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: 700, color: B.brownDark }}>Executive Summary</h4>
          <p style={{ margin: 0, fontSize: "13px", color: B.darkGrey, lineHeight: "1.5" }}>{analysisData.overallAssessment}</p>
        </div>

        {/* Key Findings */}
        {analysisData.keyFindings && analysisData.keyFindings.length > 0 && (
          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: 700, color: B.brownDark }}>Key Findings</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {analysisData.keyFindings.map((finding, idx) => (
                <div key={idx} style={{ display: "flex", gap: "10px", padding: "10px", background: "#fff", borderRadius: "6px", border: `1px solid ${B.lightGrey}` }}>
                  <span style={{ color: B.brownMedium, fontWeight: 700, fontSize: "12px", flexShrink: 0 }}>•</span>
                  <span style={{ fontSize: "12px", color: B.darkGrey, lineHeight: "1.4" }}>{finding}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights Sections */}
        {analysisData.revenueInsights && <InsightSection title="Revenue Insights" insights={analysisData.revenueInsights} />}
        {analysisData.profitabilityInsights && <InsightSection title="Profitability Insights" insights={analysisData.profitabilityInsights} />}
        {analysisData.clientInsights && <InsightSection title="Client Insights" insights={analysisData.clientInsights} />}
        {analysisData.investorInsights && <InsightSection title="Investor Insights" insights={analysisData.investorInsights} />}

        {/* Performance Metrics */}
        {analysisData.performanceMetrics && (
          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: 700, color: B.brownDark }}>Performance Metrics</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
              {Object.entries(analysisData.performanceMetrics).map(([key, value]) => (
                <div key={key} style={{ padding: "10px", background: "#fff", borderRadius: "6px", border: `1px solid ${B.lightGrey}` }}>
                  <div style={{ fontSize: "10px", color: B.warmGrey, fontWeight: 600, textTransform: "uppercase" }}>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 500, color: B.black, marginTop: "4px" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategic Recommendations */}
        {analysisData.strategicRecommendations && analysisData.strategicRecommendations.length > 0 && (
          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: 700, color: B.brownDark }}>Strategic Recommendations</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {analysisData.strategicRecommendations.map((rec, idx) => (
                <div key={idx} style={{ padding: "12px", background: "#fff", borderRadius: "6px", border: `1px solid ${B.lightGrey}` }}>
                  <h5 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: 700, color: B.brownMedium }}>{rec.title}</h5>
                  <p style={{ margin: "0 0 8px 0", fontSize: "11px", color: B.darkGrey, lineHeight: "1.4" }}>{rec.description}</p>
                  {rec.steps && rec.steps.length > 0 && (
                    <ol style={{ margin: "0", paddingLeft: "16px", fontSize: "11px", color: B.mediumGrey }}>
                      {rec.steps.map((step, i) => (
                        <li key={i} style={{ marginBottom: "4px" }}>{step}</li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "12px",
        maxWidth: "800px",
        width: "100%",
        maxHeight: "90vh",
        overflow: "auto",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px",
          borderBottom: `1px solid ${B.lightGrey}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: B.offwhite,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: B.brownDark }}>
            🤖 AI Analysis: {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: B.mediumGrey,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.color = B.brownDark}
            onMouseLeave={(e) => e.target.style.color = B.mediumGrey}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px" }}>
          {renderAnalysis()}
        </div>

        {/* Footer Actions */}
        {analysisData && !loading && !error && (
          <div style={{
            padding: "16px 20px",
            borderTop: `1px solid ${B.lightGrey}`,
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            background: B.offwhite,
            position: "sticky",
            bottom: 0,
          }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                border: `1.5px solid ${B.lightGrey}`,
                fontWeight: 600,
                background: "#fff",
                color: B.darkGrey,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = B.brownMedium;
                e.target.style.color = B.brownMedium;
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = B.lightGrey;
                e.target.style.color = B.darkGrey;
              }}
            >
              Close
            </button>
            <button
              onClick={onNewAnalysis}
              disabled={isSaving}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: isSaving ? "not-allowed" : "pointer",
                fontSize: "12px",
                border: "none",
                fontWeight: 600,
                background: B.brownMedium,
                color: "#fff",
                transition: "all 0.2s",
                opacity: isSaving ? 0.7 : 1,
              }}
              onMouseEnter={(e) => !isSaving && (e.target.style.background = B.brownDark)}
              onMouseLeave={(e) => !isSaving && (e.target.style.background = B.brownMedium)}
            >
              {isSaving ? "💾 Saving..." : "🔄 New Analysis"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Insight Section Helper ──────────────────────────────────────────────────
const InsightSection = ({ title, insights }) => (
  <div>
    <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: 700, color: B.brownDark }}>{title}</h4>
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {insights.map((insight, idx) => (
        <div key={idx} style={{ padding: "12px", background: "#fff", borderRadius: "6px", border: `1px solid ${B.lightGrey}` }}>
          <h5 style={{ margin: "0 0 4px 0", fontSize: "12px", fontWeight: 700, color: B.brownMedium }}>{insight.title}</h5>
          <p style={{ margin: "0 0 6px 0", fontSize: "11px", color: B.darkGrey, lineHeight: "1.4" }}>{insight.description}</p>
          <div style={{ fontSize: "10px", color: B.warmGrey, fontWeight: 600 }}>Impact: {insight.impact}</div>
        </div>
      ))}
    </div>
  </div>
);

// ─── AI Analysis Button ──────────────────────────────────────────────────────
const AIAnalysisButton = ({ onClick, loading, hasSavedAnalysis, onViewSaved }) => (
  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
    {hasSavedAnalysis && (
      <button
        onClick={onViewSaved}
        style={{
          padding: "6px 12px",
          borderRadius: "20px",
          cursor: "pointer",
          fontSize: "11px",
          border: `1.5px solid ${B.brownLight}`,
          fontWeight: 700,
          background: "#fff",
          color: B.brownMedium,
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.background = B.brownLight;
          e.target.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = "#fff";
          e.target.style.color = B.brownMedium;
        }}
      >
        📊 View Saved
      </button>
    )}
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: "6px 12px",
        borderRadius: "20px",
        cursor: loading ? "not-allowed" : "pointer",
        fontSize: "11px",
        border: `1.5px solid ${B.brownMedium}`,
        fontWeight: 700,
        background: loading ? B.lightGrey : B.brownMedium,
        color: "#fff",
        transition: "all 0.3s ease",
        opacity: loading ? 0.7 : 1,
      }}
      onMouseEnter={(e) => !loading && (e.target.style.background = B.brownDark)}
      onMouseLeave={(e) => !loading && (e.target.style.background = B.brownMedium)}
    >
      {loading ? "🔄" : "🤖"} {loading ? "..." : hasSavedAnalysis ? "New AI" : "AI"}
    </button>
  </div>
);

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
    datalabels: { color: '#ffffff' },
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
        const profitableCount = profitabilityCounts.Profitable || 0;
        const breakevenCount = profitabilityCounts.Breakeven || 0;
        const lossMakingCount = profitabilityCounts.Unprofitable || 0;
        const totalSMEs = smes.length || 1;

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

        const totalCapitalDeployed = investorPerformance.reduce((sum, inv) => sum + inv.totalInvestment, 0);
        const totalDeals = investorPerformance.reduce((sum, inv) => sum + inv.dealsCount, 0);
        const avgDealsPerInvestor = investorPerformance.length > 0 ? totalDeals / investorPerformance.length : 0;

        // Calculate top investor concentration
        const sortedByInvestment = [...investorPerformance].sort((a, b) => b.totalInvestment - a.totalInvestment);
        const top3Investment = sortedByInvestment.slice(0, 3).reduce((sum, inv) => sum + inv.totalInvestment, 0);
        const topInvestorConcentration = totalCapitalDeployed > 0 ? (top3Investment / totalCapitalDeployed) * 100 : 0;

        // Calculate client concentration (top 10% SMEs revenue concentration)
        const sortedByRevenue = [...revenuePerSME].sort((a, b) => b.revenue - a.revenue);
        const top10PercentCount = Math.max(1, Math.ceil(revenuePerSME.length * 0.1));
        const top10PercentRevenue = sortedByRevenue.slice(0, top10PercentCount).reduce((sum, sme) => sum + sme.revenue, 0);
        const clientConcentration = totalRevenue > 0 ? (top10PercentRevenue / totalRevenue) * 100 : 0;

        // Get top sectors by investment
        const sectorInvestment = {};
        investorPerformance.forEach(inv => {
          if (inv.sector && inv.sector !== "Not specified") {
            sectorInvestment[inv.sector] = (sectorInvestment[inv.sector] || 0) + inv.totalInvestment;
          }
        });
        const topSectors = Object.entries(sectorInvestment)
          .sort((a, b) => b[1] - a[1])
          .map(([sector]) => sector);

        // Ensure we ALWAYS have at least 3 items for top/bottom (pad with placeholders if needed)
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
          if (inv.sector && inv.sector !== "Not specified") {
            if (!sectorMap[inv.sector]) sectorMap[inv.sector] = [];
            sectorMap[inv.sector].push(inv);
          }
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
            topByInvestment: padToThree(sortedByInvestment, defaultInvestor),
            bottomByInvestment: padToThree([...sortedByInvestment].reverse(), defaultInvestor),
            mostActive: padToThree([...investorPerformance].sort((a, b) => b.dealsCount - a.dealsCount), defaultInvestor),
            leastActive: padToThree([...investorPerformance].sort((a, b) => a.dealsCount - b.dealsCount), defaultInvestor),
            topBySector: topBySector,
            bottomBySector: bottomBySector
          },
          // Store aggregated metrics for AI analysis
          aggregatedMetrics: {
            totalRevenue,
            avgRevenue,
            smeCount: totalSMEs,
            profitabilityRate: (profitableCount / totalSMEs) * 100,
            breakevenRate: (breakevenCount / totalSMEs) * 100,
            lossMakingRate: (lossMakingCount / totalSMEs) * 100,
            totalInvestors: investorPerformance.length,
            avgDealsPerInvestor,
            totalCapitalDeployed,
            topInvestorConcentration,
            topInvestors: sortedByInvestment.slice(0, 3).map(inv => ({ name: inv.name, investment: inv.totalInvestment, deals: inv.dealsCount })),
            topSectors: topSectors.slice(0, 3),
            clientConcentration
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

const PerformanceSection = ({ data, onAIAnalysis, aiLoading, hasSavedAnalysis, onViewSaved }) => {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <AIAnalysisButton 
          onClick={onAIAnalysis} 
          loading={aiLoading} 
          hasSavedAnalysis={hasSavedAnalysis} 
          onViewSaved={onViewSaved} 
        />
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
const TopBottomSection = ({ data, onAIAnalysis, aiLoading, hasSavedAnalysis, onViewSaved }) => {
  const [sub, setSub] = useState("top");

  if (!data || !data.investors.topByInvestment.length) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <AIAnalysisButton 
            onClick={onAIAnalysis} 
            loading={aiLoading} 
            hasSavedAnalysis={hasSavedAnalysis} 
            onViewSaved={onViewSaved} 
          />
        </div>
        <Card title="Top / Bottom Investors">
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.warmGrey, fontSize: "12px" }}>
            No investor data available for this association
          </div>
        </Card>
      </div>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <Pill label="🏆 Top 3" active={sub === "top"} onClick={() => setSub("top")} />
          <Pill label="⚠️ Bottom 3" active={sub === "bottom"} onClick={() => setSub("bottom")} />
        </div>
        <AIAnalysisButton 
          onClick={onAIAnalysis} 
          loading={aiLoading} 
          hasSavedAnalysis={hasSavedAnalysis} 
          onViewSaved={onViewSaved} 
        />
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
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasSavedAnalysis, setHasSavedAnalysis] = useState(false);
  const { data, loading } = usePerformanceData();

  // Check for saved analysis on component mount
  useEffect(() => {
    const checkSavedAnalysis = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const savedAnalysis = await fetchLatestAnalysis(user.uid, "performance");
          setHasSavedAnalysis(!!savedAnalysis);
          if (savedAnalysis && savedAnalysis.analysis) {
            setAiAnalysis(savedAnalysis.analysis);
          }
        } catch (error) {
          console.error("Error checking saved analysis:", error);
        }
      }
    };
    checkSavedAnalysis();
  }, []);

  const handleViewSavedAnalysis = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const savedAnalysis = await fetchLatestAnalysis(user.uid, "performance");
      if (savedAnalysis && savedAnalysis.analysis) {
        setAiAnalysis(savedAnalysis.analysis);
        setAiModalOpen(true);
      } else {
        setAiError("No saved analysis found. Generate a new one first.");
      }
    } catch (error) {
      console.error("Error loading saved analysis:", error);
      setAiError(error.message || "Failed to load saved analysis");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    setAiError(null);
    setSaveSuccess(false);
    try {
      const functions = getFunctions();
  const generateAssociationPerformanceInsights = httpsCallable(functions, "generateAssociationPerformanceInsights");
      // Prepare performance data for AI
      const performanceDataPayload = {
        totalRevenue: data?.aggregatedMetrics?.totalRevenue || 0,
        avgRevenue: data?.aggregatedMetrics?.avgRevenue || 0,
        smeCount: data?.aggregatedMetrics?.smeCount || 0,
        profitabilityRate: data?.aggregatedMetrics?.profitabilityRate || 0,
        breakevenRate: data?.aggregatedMetrics?.breakevenRate || 0,
        lossMakingRate: data?.aggregatedMetrics?.lossMakingRate || 0,
        totalInvestors: data?.aggregatedMetrics?.totalInvestors || 0,
        avgDealsPerInvestor: data?.aggregatedMetrics?.avgDealsPerInvestor || 0,
        totalCapitalDeployed: data?.aggregatedMetrics?.totalCapitalDeployed || 0,
        topInvestorConcentration: data?.aggregatedMetrics?.topInvestorConcentration || 0,
        topInvestors: data?.aggregatedMetrics?.topInvestors || [],
        topSectors: data?.aggregatedMetrics?.topSectors || [],
        clientConcentration: data?.aggregatedMetrics?.clientConcentration || 0
      };

      console.log("Calling generateAssociationPerformanceInsights with:", performanceDataPayload);
      
        const result = await generateAssociationPerformanceInsights({
          performanceData: performanceDataPayload,
          analysisType: "comprehensive"
        });

      console.log("Received analysis:", result.data);
      
      const analysisData = result.data;
      setAiAnalysis(analysisData);
      setAiModalOpen(true);
      
      // Auto-save to Firebase
      const user = auth.currentUser;
      if (user) {
        try {
          await saveAnalysisToFirebase(
            user.uid,
            "performance",
            analysisData,
            performanceDataPayload
          );
          setSaveSuccess(true);
          setHasSavedAnalysis(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        } catch (saveError) {
          console.error("Error auto-saving analysis:", saveError);
        }
      }
    } catch (error) {
      console.error("AI Analysis error:", error);
      setAiError(error.message || "Failed to generate analysis");
    } finally {
      setAiLoading(false);
    }
  };

  const handleNewAnalysis = async () => {
    setIsSaving(true);
    try {
      setAiModalOpen(false);
      setAiAnalysis(null);
      await handleAIAnalysis();
    } catch (error) {
      console.error("Error generating new analysis:", error);
      setAiError("Failed to generate new analysis: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div>
      <AIAnalysisModal 
        isOpen={aiModalOpen} 
        title="Performance & Investor Analysis" 
        analysisData={aiAnalysis} 
        loading={aiLoading} 
        error={aiError} 
        onClose={() => setAiModalOpen(false)}
        onNewAnalysis={handleNewAnalysis}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        hasSavedAnalysis={hasSavedAnalysis}
        onViewSaved={handleViewSavedAnalysis}
      />

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: `1px solid ${B.lightGrey}`, paddingBottom: "12px" }}>
        <SubTab label="Performance" active={activeTab === "performance"} onClick={() => setActiveTab("performance")} />
        <SubTab label="Top / Bottom" active={activeTab === "topbottom"} onClick={() => setActiveTab("topbottom")} />
      </div>
      
      {activeTab === "performance" && (
        <PerformanceSection 
          data={data} 
          onAIAnalysis={handleAIAnalysis}
          aiLoading={aiLoading}
          hasSavedAnalysis={hasSavedAnalysis}
          onViewSaved={handleViewSavedAnalysis}
        />
      )}
      
      {activeTab === "topbottom" && (
        <TopBottomSection 
          data={data} 
          onAIAnalysis={handleAIAnalysis}
          aiLoading={aiLoading}
          hasSavedAnalysis={hasSavedAnalysis}
          onViewSaved={handleViewSavedAnalysis}
        />
      )}
    </div>
  );
};

export default Performance;