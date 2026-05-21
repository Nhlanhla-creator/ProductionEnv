// LiquidityExits.js - Updated with full AI analysis functionality

import React, { useState, useEffect } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { db, auth } from "../../firebaseConfig";
import { collection, query, where, getDocs, getDoc, doc, setDoc, addDoc, serverTimestamp, orderBy, limit } from "firebase/firestore";
import { useAssociationAnalytics } from "../../context/AssociationAnalyticsContext";
import { getFunctions, httpsCallable } from "firebase/functions";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const B = {
  darkest: "#3b2409", dark: "#5e3f26", medium: "#7d5a36",
  warm: "#9c7c54", light: "#b8a082", pale: "#d4c4b0", offwhite: "#f0e8de",
};
const C = ["#3b2409", "#5e3f26", "#7d5a36", "#9c7c54", "#b8a082", "#c2a882", "#d4c4b0", "#a08060"];

const TICK = "#4a352f";
const GRID = "#e8ddd5";

// ─── Save Analysis to Firebase ───────────────────────────────────────────────
const saveAnalysisToFirebase = async (userId, analysisType, analysisData, sourceData) => {
  try {
    console.log("🔍 Starting save to Firebase for Liquidity analysis...");
    
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
    console.log(`✅ Liquidity analysis saved with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error saving liquidity analysis to Firebase:", error);
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
        <div style={{ background: B.offwhite, padding: "16px", borderRadius: "8px", borderLeft: `4px solid ${B.darkest}` }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: 700, color: B.darkest }}>Executive Summary</h4>
          <p style={{ margin: 0, fontSize: "13px", color: TICK, lineHeight: "1.5" }}>{analysisData.overallAssessment}</p>
        </div>

        {/* Key Findings */}
        {analysisData.keyFindings && analysisData.keyFindings.length > 0 && (
          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: 700, color: B.darkest }}>Key Findings</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {analysisData.keyFindings.map((finding, idx) => (
                <div key={idx} style={{ display: "flex", gap: "10px", padding: "10px", background: "#fff", borderRadius: "6px", border: `1px solid ${B.pale}` }}>
                  <span style={{ color: B.darkest, fontWeight: 700, fontSize: "12px", flexShrink: 0 }}>•</span>
                  <span style={{ fontSize: "12px", color: TICK, lineHeight: "1.4" }}>{finding}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights Sections */}
        {analysisData.exitTypeInsights && <InsightSection title="Exit Type Insights" insights={analysisData.exitTypeInsights} />}
        {analysisData.exitTimingInsights && <InsightSection title="Exit Timing Insights" insights={analysisData.exitTimingInsights} />}
        {analysisData.returnInsights && <InsightSection title="Return Insights" insights={analysisData.returnInsights} />}
        {analysisData.sectorExitInsights && <InsightSection title="Sector Exit Insights" insights={analysisData.sectorExitInsights} />}

        {/* Liquidity Metrics */}
        {analysisData.liquidityMetrics && (
          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: 700, color: B.darkest }}>Liquidity Metrics</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
              {Object.entries(analysisData.liquidityMetrics).map(([key, value]) => (
                <div key={key} style={{ padding: "10px", background: "#fff", borderRadius: "6px", border: `1px solid ${B.pale}` }}>
                  <div style={{ fontSize: "10px", color: B.warm, fontWeight: 600, textTransform: "uppercase" }}>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 500, color: B.dark, marginTop: "4px" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategic Recommendations */}
        {analysisData.strategicRecommendations && analysisData.strategicRecommendations.length > 0 && (
          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: 700, color: B.darkest }}>Strategic Recommendations</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {analysisData.strategicRecommendations.map((rec, idx) => (
                <div key={idx} style={{ padding: "12px", background: "#fff", borderRadius: "6px", border: `1px solid ${B.pale}` }}>
                  <h5 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: 700, color: B.medium }}>{rec.title}</h5>
                  <p style={{ margin: "0 0 8px 0", fontSize: "11px", color: TICK, lineHeight: "1.4" }}>{rec.description}</p>
                  {rec.steps && rec.steps.length > 0 && (
                    <ol style={{ margin: "0", paddingLeft: "16px", fontSize: "11px", color: B.warm }}>
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
          borderBottom: `1px solid ${B.pale}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: B.offwhite,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: B.darkest }}>
            🤖 AI Analysis: {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: B.warm,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.color = B.darkest}
            onMouseLeave={(e) => e.target.style.color = B.warm}
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
            borderTop: `1px solid ${B.pale}`,
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
                border: `1.5px solid ${B.pale}`,
                fontWeight: 600,
                background: "#fff",
                color: TICK,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = B.medium;
                e.target.style.color = B.medium;
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = B.pale;
                e.target.style.color = TICK;
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
                background: B.darkest,
                color: "#fff",
                transition: "all 0.2s",
                opacity: isSaving ? 0.7 : 1,
              }}
              onMouseEnter={(e) => !isSaving && (e.target.style.background = B.medium)}
              onMouseLeave={(e) => !isSaving && (e.target.style.background = B.darkest)}
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
    <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: 700, color: B.darkest }}>{title}</h4>
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {insights.map((insight, idx) => (
        <div key={idx} style={{ padding: "12px", background: "#fff", borderRadius: "6px", border: `1px solid ${B.pale}` }}>
          <h5 style={{ margin: "0 0 4px 0", fontSize: "12px", fontWeight: 700, color: B.medium }}>{insight.title}</h5>
          <p style={{ margin: "0 0 6px 0", fontSize: "11px", color: TICK, lineHeight: "1.4" }}>{insight.description}</p>
          <div style={{ fontSize: "10px", color: B.warm, fontWeight: 600 }}>Impact: {insight.impact}</div>
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
          border: `1.5px solid ${B.light}`,
          fontWeight: 700,
          background: "#fff",
          color: B.medium,
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.background = B.light;
          e.target.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = "#fff";
          e.target.style.color = B.medium;
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
        border: `1.5px solid ${B.medium}`,
        fontWeight: 700,
        background: loading ? B.pale : B.medium,
        color: "#fff",
        transition: "all 0.3s ease",
        opacity: loading ? 0.7 : 1,
      }}
      onMouseEnter={(e) => !loading && (e.target.style.background = B.darkest)}
      onMouseLeave={(e) => !loading && (e.target.style.background = B.medium)}
    >
      {loading ? "🔄" : "🤖"} {loading ? "..." : hasSavedAnalysis ? "New AI" : "AI"}
    </button>
  </div>
);

const Card = ({ title, children }) => (
  <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", minHeight: "400px", boxShadow: "0 2px 10px rgba(59,36,9,0.07)", border: `1px solid ${B.pale}`, display: "flex", flexDirection: "column" }}>
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "10px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.dark, margin: 0 }}>{title}</h3>
    </div>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

const ManualLegend = ({ labels, colors, values }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: "10px" }}>
    {labels.map((label, i) => (
      <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: colors[i % colors.length], flexShrink: 0 }} />
        <span style={{ fontSize: "11px", color: TICK, fontWeight: 500 }}>
          {label}{values ? ` (${values[i]}%)` : ""}
        </span>
      </div>
    ))}
  </div>
);

const SubTab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "6px 16px",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "12px",
      border: `1.5px solid ${active ? B.darkest : B.pale}`,
      fontWeight: active ? 700 : 500,
      background: active ? B.darkest : "#fff",
      color: active ? "#fff" : B.dark,
    }}
  >
    {label}
  </button>
);

const ViewTrendButton = ({ show, onClick }) => (
  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
    <button
      onClick={onClick}
      style={{
        padding: "4px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "10px",
        border: `1.5px solid ${show ? B.darkest : B.pale}`,
        fontWeight: show ? 700 : 500,
        background: show ? B.darkest : "#fff",
        color: show ? "#fff" : B.dark,
      }}
    >
      {show ? "Hide Trend ▲" : "View Trend ▼"}
    </button>
  </div>
);

const TrendChart = ({ trendData, colors }) => {
  const keys = Object.keys(trendData).filter((k) => k !== "years");
  const datasets = keys.map((key, i) => ({
    label: key, data: trendData[key], backgroundColor: colors[i % colors.length],
  }));
  return (
    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${B.offwhite}` }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginBottom: "8px" }}>
        {keys.map((key, i) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: colors[i % colors.length], flexShrink: 0 }} />
            <span style={{ fontSize: "10px", color: TICK, fontWeight: 500 }}>{key}</span>
          </div>
        ))}
      </div>
      <div style={{ height: "140px" }}>
        <Bar
          options={{
            responsive: true, maintainAspectRatio: false, animation: false,
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
              x: { stacked: true, ticks: { color: TICK, font: { size: 8 }, callback: (v) => v }, grid: { display: false } },
              y: { stacked: true, beginAtZero: true, grid: { color: GRID }, ticks: { color: TICK, font: { size: 8 }, callback: (v) => v } },
            },
          }}
          data={{ labels: trendData.years, datasets }}
        />
      </div>
    </div>
  );
};

const doughnutOpts = {
  responsive: true,
   maintainAspectRatio: false,
   animation: false,
   plugins: {
     legend: { display: false },
     datalabels: {
       color: '#ffffff',  // ← Change number color here
       font: { weight: 'bold', size: 12 },
     },
     tooltip: {
       callbacks: {
         label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`,
       },
     },
   },
};

const vBarOpts = (yTitle, yCb) => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { 
    legend: { display: false },
     datalabels: {
       color: '#ffffff',  // ← Change number color here
     },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}`,
      },
    },
  },
  scales: {
    x: {
      title: { display: true, text: "Range", color: TICK, font: { size: 11 } },
      grid: { display: false },
      ticks: { color: TICK, font: { size: 10 }, callback: (v) => v },
    },
    y: {
      title: { display: true, text: yTitle || "Number of Exits", color: TICK, font: { size: 11 } },
      beginAtZero: true,
      grid: { color: GRID },
      ticks: { color: TICK, font: { size: 10 }, callback: yCb || ((v) => v) },
    },
  },
});

const hBarOpts = () => ({
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
      beginAtZero: true,
      grid: { display: true, color: GRID },
      ticks: { color: TICK, font: { size: 10 }, callback: (v) => v },
    },
    y: {
      grid: { display: false },
      ticks: { color: TICK, font: { size: 11 } },
    },
  },
});

// ─── Hook to fetch liquidity data from Firestore ───────────────────────────
const useLiquidityData = () => {
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

        const smeQuery = query(collection(db, "universalProfiles"), where("entityOverview.memberOfAssociation", "==", "yes"));
        const smeSnapshot = await getDocs(smeQuery);
        for (const docSnap of smeSnapshot.docs) {
          const data = docSnap.data();
          if ((data.entityOverview?.industryAssociations || []).includes(associationName)) {
            smes.push(data);
          }
        }

        const investorQuery = query(collection(db, "MyuniversalProfiles"));
        const investorSnapshot = await getDocs(investorQuery);
        for (const docSnap of investorSnapshot.docs) {
          const data = docSnap.data();
          const formData = data.formData || {};
          if ((formData.fundManageOverview?.industryAssociations || []).includes(associationName)) {
            investors.push(formData);
          }
        }

        const exitsBySector = {};
        const sectorCounts = {};
        
        smes.forEach(sme => {
          const sectors = sme.entityOverview?.economicSectors || [];
          const hasFunding = sme.financialOverview?.seekingFunding === "yes" || 
                            (sme.financialOverview?.fundraisingHistory === "yes");
          
          if (hasFunding) {
            sectors.forEach(sector => {
              if (sector && sector !== "Not specified") {
                exitsBySector[sector] = (exitsBySector[sector] || 0) + 1;
              }
            });
          }
          
          sectors.forEach(sector => {
            if (sector && sector !== "Not specified") {
              sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
            }
          });
        });

        let totalExitValue = 0;
        investors.forEach(investor => {
          const deployed = parseInt(investor.fundManageOverview?.valueDeployed?.replace(/[^0-9]/g, '')) || 0;
          totalExitValue += Math.round(deployed * 0.3);
        });

        const totalExits = Object.values(exitsBySector).reduce((a, b) => a + b, 0);

        const exitTypes = {
          "Trade Sale": 45,
          "Secondary Sale": 30,
          IPO: 10,
          Buyback: 15
        };

        let totalYears = 0;
        let fundedSMEs = 0;
        smes.forEach(sme => {
          const years = parseInt(sme.entityOverview?.yearsInOperation) || 0;
          const hasFunding = sme.financialOverview?.seekingFunding === "yes";
          if (hasFunding && years > 0) {
            totalYears += years;
            fundedSMEs++;
          }
        });
        
        const avgTimeToExit = fundedSMEs > 0 ? (totalYears / fundedSMEs) / 2 : 5.8;
        
        const timeDistribution = {
          labels: ["<2y", "2-3y", "3-4y", "4-5y", "5y+"],
          counts: [2, 5, 8, 6, 3]
        };

        const exitSizeDistribution = {
          labels: ["<R10M", "R10-25M", "R25-50M", "R50-100M", "R100M+"],
          counts: [3, 7, 6, 5, 3]
        };
        
        const meanExitSize = totalExits > 0 ? (totalExitValue / totalExits) / 1_000_000 : 32.5;
        const medianExitSize = 18.2;

        const returnDistribution = {
          "<1x": 8,
          "1-2x": 25,
          "2-3x": 32,
          "3-5x": 20,
          "5x+": 15
        };

        const exitTypeTrends = {
          years: ["2022", "2023", "2024", "2025"],
          "Trade Sale": [38, 40, 43, 45],
          "Secondary Sale": [24, 27, 29, 30],
          IPO: [8, 9, 9, 10],
          Buyback: [12, 13, 14, 15]
        };

        setData({
          totalExits: {
            zar: Math.round(totalExitValue / 1_000_000),
            count: totalExits
          },
          exitsBySector,
          avgTimeToExit: {
            avg: avgTimeToExit.toFixed(1),
            distribution: timeDistribution.labels,
            counts: timeDistribution.counts
          },
          exitTypes,
          exitTypeTrends,
          exitSize: {
            mean: meanExitSize.toFixed(1),
            median: medianExitSize,
            distribution: exitSizeDistribution.labels,
            counts: exitSizeDistribution.counts
          },
          returnDistribution,
          timestamp: new Date().toISOString()
        });

      } catch (err) {
        console.error("Error fetching liquidity data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [associationName]);

  return { data, loading };
};

// ─── Main Component ─────────────────────────────────────────────────────────
const LiquidityExits = () => {
  const [showExitTypeTrend, setShowExitTypeTrend] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasSavedAnalysis, setHasSavedAnalysis] = useState(false);
  const { data, loading } = useLiquidityData();

  // Check for saved analysis on component mount
  useEffect(() => {
    const checkSavedAnalysis = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const savedAnalysis = await fetchLatestAnalysis(user.uid, "liquidity-exits");
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
      
      const savedAnalysis = await fetchLatestAnalysis(user.uid, "liquidity-exits");
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

  // In your LiquidityExits component, update the function call:

const handleAIAnalysis = async () => {
  setAiLoading(true);
  setAiError(null);
  setSaveSuccess(false);
  try {
    const functions = getFunctions();
    // Use the corrected function name
    const generateLiquidityExitsAnalysis = httpsCallable(functions, "generateLiquidityExitsAnalysis");
    
    // Prepare the data with proper defaults
    const liquidityDataPayload = {
      totalExitsZar: data?.totalExits?.zar || 0,
      totalExitsCount: data?.totalExits?.count || 0,
      exitTypes: data?.exitTypes || { "Trade Sale": 45, "Secondary Sale": 30, "IPO": 10, "Buyback": 15 },
      exitTimingDistribution: data?.avgTimeToExit?.distribution?.reduce((acc, label, idx) => {
        acc[label] = data.avgTimeToExit.counts[idx];
        return acc;
      }, {}),
      exitSizeDistribution: data?.exitSize?.distribution?.reduce((acc, label, idx) => {
        acc[label] = data.exitSize.counts[idx];
        return acc;
      }, {}),
      returnDistribution: data?.returnDistribution || { "<1x": 8, "1-2x": 25, "2-3x": 32, "3-5x": 20, "5x+": 15 },
      avgTimeToExit: parseFloat(data?.avgTimeToExit?.avg) || 5.8,
      meanExitSize: parseFloat(data?.exitSize?.mean) || 32.5,
      medianExitSize: data?.exitSize?.median || 18.2,
      exitsBySector: data?.exitsBySector || {},
    };

    console.log("Calling generateLiquidityExitsAnalysis with:", liquidityDataPayload);
    
    const result = await generateLiquidityExitsAnalysis({
      liquidityData: liquidityDataPayload,
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
          "liquidity-exits",
          analysisData,
          liquidityDataPayload
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
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

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
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", flexDirection: "column", gap: "16px" }}>
        <div className="spinner" style={{ width: "40px", height: "40px", border: "3px solid #e0d5c8", borderTop: "3px solid #a67c52", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <div style={{ fontSize: "14px", color: "#7d5a50" }}>Loading liquidity & exits data...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Card title="Liquidity & Exits">
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: B.warm, fontSize: "12px" }}>
            No liquidity data available for this association
          </div>
        </Card>
      </div>
    );
  }

  const exitTypeLabels = Object.keys(data.exitTypes);
  const exitTypeValues = Object.values(data.exitTypes);

  return (
    <div>
      <AIAnalysisModal 
        isOpen={aiModalOpen} 
        title="Liquidity & Exits" 
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
      
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <AIAnalysisButton 
          onClick={handleAIAnalysis} 
          loading={aiLoading} 
          hasSavedAnalysis={hasSavedAnalysis} 
          onViewSaved={handleViewSavedAnalysis} 
        />
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>

        <Card title="Total Exits (by Sector)">
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "20px", height: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: "11px", color: B.warm }}>Total Exit Value</div>
                <div style={{ fontSize: "36px", fontWeight: 800, color: B.darkest }}>R {data.totalExits.zar}M</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: B.warm }}>Number of Exits</div>
                <div style={{ fontSize: "36px", fontWeight: 800, color: B.darkest }}>{data.totalExits.count}</div>
              </div>
            </div>
            {Object.keys(data.exitsBySector).length > 0 ? (
              <div style={{ height: "200px" }}>
                <Bar
                  options={hBarOpts()}
                  data={{
                    labels: Object.keys(data.exitsBySector),
                    datasets: [{ label: "Exits by Sector", data: Object.values(data.exitsBySector), backgroundColor: C }],
                  }}
                />
              </div>
            ) : (
              <div style={{ textAlign: "center", color: B.warm, fontSize: "12px", padding: "20px" }}>
                No exit data available by sector
              </div>
            )}
          </div>
        </Card>

        <Card title="Average Time to Exit">
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px", height: "100%" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "40px", fontWeight: 800, color: B.darkest }}>{data.avgTimeToExit.avg} years</div>
              <div style={{ fontSize: "11px", color: B.warm }}>Average Time to Exit</div>
            </div>
            <div style={{ height: "220px" }}>
              <Bar
                options={vBarOpts("Number of Exits")}
                data={{
                  labels: data.avgTimeToExit.distribution,
                  datasets: [{ label: "Number of Exits", data: data.avgTimeToExit.counts, backgroundColor: B.darkest }],
                }}
              />
            </div>
          </div>
        </Card>

        <Card title="Exit Type & Exit Size">
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", height: "100%" }}>
            <div style={{ height: "160px" }}>
              <Doughnut
                options={doughnutOpts}
                data={{ labels: exitTypeLabels, datasets: [{ data: exitTypeValues, backgroundColor: C }] }}
              />
            </div>
            <ManualLegend labels={exitTypeLabels} colors={C} values={exitTypeValues} />
            <ViewTrendButton show={showExitTypeTrend} onClick={() => setShowExitTypeTrend((p) => !p)} />
            {showExitTypeTrend && <TrendChart trendData={data.exitTypeTrends} colors={C} />}

            <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", paddingTop: "10px", borderTop: `1px solid ${B.offwhite}` }}>
              <div>
                <div style={{ fontSize: "11px", color: B.warm }}>Mean Exit Size</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: B.dark }}>R{data.exitSize.mean}M</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: B.warm }}>Median Exit Size</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: B.dark }}>R{data.exitSize.median}M</div>
              </div>
            </div>

            <div style={{ height: "110px" }}>
              <Bar
                options={vBarOpts("Number of Exits", (v) => `R${v}`)}
                data={{
                  labels: data.exitSize.distribution,
                  datasets: [{ label: "Number of Exits", data: data.exitSize.counts, backgroundColor: B.light }],
                }}
              />
            </div>
          </div>
        </Card>

        <Card title="Return Distribution">
          <div style={{ height: "320px" }}>
            <Bar
              options={vBarOpts("% of Exits", (v) => `${v}%`)}
              data={{
                labels: Object.keys(data.returnDistribution),
                datasets: [{ label: "% of Exits", data: Object.values(data.returnDistribution), backgroundColor: B.darkest }],
              }}
            />
          </div>
        </Card>

      </div>
    </div>
  );
};

export default LiquidityExits;