// src/associator/MyPortfolios/CapitalFlow.js
import React, { useState, useEffect } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { db, auth } from "../../firebaseConfig";
import { collection, query, where, getDocs, getDoc, doc, setDoc, addDoc, serverTimestamp, orderBy, limit } from "firebase/firestore";
import { useAssociationAnalytics } from "../../context/AssociationAnalyticsContext";
import { getFunctions, httpsCallable } from "firebase/functions";
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, ChartDataLabels);


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

// ─── Save Analysis to Firebase ───────────────────────────────────────────────
// Debug version of saveAnalysisToFirebase
const saveAnalysisToFirebase = async (userId, analysisType, analysisData, sourceData) => {
  try {
    console.log("🔍 Starting save to Firebase...");
    console.log("📝 User ID:", userId);
    console.log("📝 Analysis Type:", analysisType);
    console.log("📝 Analysis Data:", JSON.stringify(analysisData, null, 2));
    console.log("📝 Source Data:", JSON.stringify(sourceData, null, 2));

    // Check if user is authenticated
    if (!auth.currentUser) {
      throw new Error("No authenticated user");
    }

    // Verify user ID matches current user
    if (userId !== auth.currentUser.uid) {
      console.warn("⚠️ User ID mismatch:", userId, "vs", auth.currentUser.uid);
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
      createdAtISO: new Date().toISOString(), // Fallback timestamp
    };

    console.log("💾 Attempting to save document with structure:", Object.keys(analysisDoc));

    const docRef = await addDoc(userAnalysesRef, analysisDoc);

    console.log(`✅ Analysis saved with ID: ${docRef.id}`);
    console.log(`🔗 Full path: users/${userId}/aiAnalyses/${docRef.id}`);

    // Verify the save by reading it back
    const savedDoc = await getDoc(docRef);
    if (savedDoc.exists()) {
      console.log("✅ Verified save - document exists in Firebase");
    } else {
      console.warn("⚠️ Document not found immediately after save");
    }

    return docRef.id;
  } catch (error) {
    console.error("❌ Error saving analysis to Firebase:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error:", error);

    // Handle specific Firebase errors
    if (error.code === 'permission-denied') {
      console.error("Permission denied - check Firebase rules");
    } else if (error.code === 'unavailable') {
      console.error("Firebase unavailable - check network");
    } else if (error.code === 'not-found') {
      console.error("Collection not found - check path");
    }

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

    console.log(`ℹ️ No saved ${analysisType} analysis found`);
    return null;
  } catch (error) {
    console.error("❌ Error fetching analysis from Firebase:", error);
    throw error;
  }
};

// ─── AI Analysis Modal ────────────────────────────────────────────────────────
const AIAnalysisModal = ({ isOpen, title, analysisData, loading, error, onClose, onNewAnalysis, isSaving, saveSuccess, hasExistingAnalysis, onViewSaved }) => {
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
        {analysisData.sectorInsights && <InsightSection title="Sector Insights" insights={analysisData.sectorInsights} />}
        {analysisData.geographicInsights && <InsightSection title="Geographic Insights" insights={analysisData.geographicInsights} />}
        {analysisData.funderInsights && <InsightSection title="Funder Insights" insights={analysisData.funderInsights} />}
        {analysisData.demographicInsights && <InsightSection title="Demographic Insights" insights={analysisData.demographicInsights} />}
        {analysisData.transformationInsights && <InsightSection title="Transformation Insights" insights={analysisData.transformationInsights} />}
        {analysisData.coInvestorInsights && <InsightSection title="Co-investor Insights" insights={analysisData.coInvestorInsights} />}
        {analysisData.fundTypeInsights && <InsightSection title="Fund Type Insights" insights={analysisData.fundTypeInsights} />}
        {analysisData.dealSizeInsights && <InsightSection title="Deal Size Insights" insights={analysisData.dealSizeInsights} />}
        {analysisData.equityInsights && <InsightSection title="Equity Insights" insights={analysisData.equityInsights} />}
        {analysisData.sourceInsights && <InsightSection title="Funding Sources" insights={analysisData.sourceInsights} />}
        {analysisData.rejectionInsights && <InsightSection title="Rejection Pattern Insights" insights={analysisData.rejectionInsights} />}
        {analysisData.efficiencyInsights && <InsightSection title="Efficiency Insights" insights={analysisData.efficiencyInsights} />}

        {/* Market Trends */}
        {analysisData.marketTrends && (
          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: 700, color: B.brownDark }}>Market Trends</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
              {Object.entries(analysisData.marketTrends).map(([key, value]) => (
                <div key={key} style={{ padding: "10px", background: "#fff", borderRadius: "6px", border: `1px solid ${B.lightGrey}` }}>
                  <div style={{ fontSize: "10px", color: B.warmGrey, fontWeight: 600, textTransform: "uppercase" }}>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </div>
                  {Array.isArray(value) ? (
                    <div style={{ fontSize: "11px", color: B.darkGrey, marginTop: "4px" }}>
                      {value.join(", ")}
                    </div>
                  ) : (
                    <div style={{ fontSize: "13px", fontWeight: 700, color: B.black, marginTop: "4px" }}>{value}</div>
                  )}
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

const ManualLegend = ({ labels, colors, values }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: "10px" }}>
    {labels.map((label, i) => (
      <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: colors[i % colors.length], flexShrink: 0 }} />
        <span style={{ fontSize: "11px", color: B.darkGrey, fontWeight: 500 }}>
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
      <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: `1px solid ${B.offwhite}`, fontSize: "11px", color: B.warmGrey }}>
        {footer}
      </div>
    )}
  </div>
);

const CardWithAI = ({ title, children, footer, onAIAnalysis, aiLoading, hasSavedAnalysis, onViewSaved }) => (
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
    <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${B.offwhite}`, marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: B.black, margin: 0 }}>{title}</h3>
      {onAIAnalysis && <AIAnalysisButton onClick={onAIAnalysis} loading={aiLoading} hasSavedAnalysis={hasSavedAnalysis} onViewSaved={onViewSaved} />}
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

const TrendIcon = ({ growth }) => (
  <span style={{ color: growth >= 0 ? "#2e7d32" : "#c62828", fontSize: "11px", marginLeft: "6px" }}>
    {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}%
  </span>
);

const hBarOpts = () => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  indexAxis: "y",
  plugins: {
    legend: { display: false },
    datalabels: {
      color: '#ffffff',  // ← Change number color here
      font: { weight: 'bold', size: 11 },
      anchor: 'end',
      align: 'right',
    },
  },
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
const TrendChart = ({ trendData, colors }) => {
  const keys = Object.keys(trendData).filter((k) => k !== "years");
  const datasets = keys.map((key, i) => ({
    label: key,
    data: trendData[key],
    backgroundColor: colors[i % colors.length],
  }));

  return (
    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${B.offwhite}` }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginBottom: "8px" }}>
        {keys.map((key, i) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: colors[i % colors.length], flexShrink: 0 }} />
            <span style={{ fontSize: "10px", color: B.darkGrey, fontWeight: 500 }}>{key}</span>
          </div>
        ))}
      </div>
      <div style={{ height: "140px" }}>
        <Bar
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                stacked: true,
                ticks: { color: B.darkGrey, font: { size: 8 } },
                grid: { display: false },
              },
              y: {
                stacked: true,
                beginAtZero: true,
                grid: { color: B.lightGrey },
                ticks: { color: B.darkGrey, font: { size: 8 }, callback: (v) => v.toLocaleString() },
              },
            },
          }}
          data={{ labels: trendData.years, datasets }}
        />
      </div>
    </div>
  );
};

const ViewTrendButton = ({ show, onClick }) => (
  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
    <button
      onClick={onClick}
      style={{
        padding: "4px 12px",
        borderRadius: "20px",
        cursor: "pointer",
        fontSize: "10px",
        border: `1.5px solid ${show ? B.brownDark : B.lightGrey}`,
        fontWeight: show ? 700 : 500,
        background: show ? B.brownDark : "#fff",
        color: show ? "#fff" : B.darkGrey,
      }}
    >
      {show ? "Hide Trend ▲" : "View Trend ▼"}
    </button>
  </div>
);

// ─── Capital Deployment Component ────────────────────────────────────────────────────────
const CapitalDeployment = ({ analyticsData, entitiesData }) => {
  const [showSourceTrend, setShowSourceTrend] = useState(false);
  const [showPurposeTrend, setShowPurposeTrend] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasSavedAnalysis, setHasSavedAnalysis] = useState(false);

  const sources = analyticsData?.fundingSources || {
    "Entities/Individuals": 35,
    Corporates: 28,
    DFIs: 22,
    "Fund of Funds": 15,
  };

  const purposes = analyticsData?.fundingPurposes || {
    "Own ring-fenced": 40,
    "Own balance sheet": 25,
    "Deal by deal": 35,
  };

  const sourceTrends = {
    years: ["2022", "2023", "2024", "2025"],
    "Entities/Individuals": [28, 31, 33, 35],
    Corporates: [22, 25, 27, 28],
    DFIs: [18, 20, 21, 22],
    "Fund of Funds": [12, 13, 14, 15],
  };

  const purposeTrends = {
    years: ["2022", "2023", "2024", "2025"],
    "Own ring-fenced": [32, 36, 38, 40],
    "Own balance sheet": [22, 23, 24, 25],
    "Deal by deal": [30, 32, 33, 35],
  };

  const avgFundSize = { current: 45, yoyGrowth: 12.5 };
  const fundsVsDeployed = {
    years: ["2022", "2023", "2024", "2025"],
    raised: [240, 280, 320, 360],
    requested: [300, 350, 400, 450],
    deployed: [280, 310, 385, 410],
  };

  const rejectionData = {
    totalReviewed: 520,
    totalRejected: 312,
    rejectionRate: 60,
    topReasons: {
      "Poor financials": 38,
      "Weak team": 25,
      "Market too small": 18,
      "No traction": 12,
      Other: 7,
    },
  };

  // Check for saved analysis on component mount
  useEffect(() => {
    const checkSavedAnalysis = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const savedAnalysis = await fetchLatestAnalysis(user.uid, "capital-deployment");
          setHasSavedAnalysis(!!savedAnalysis);
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

      const savedAnalysis = await fetchLatestAnalysis(user.uid, "capital-deployment");
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
      const generateCapitalDeploymentAnalysis = httpsCallable(functions, "generateCapitalDeploymentAnalysis");

      const result = await generateCapitalDeploymentAnalysis({
        deploymentData: {
          fundingSources: sources,
          fundingPurposes: purposes,
          averageFundSize: avgFundSize.current,
          fundsRaisedVsDeployed: fundsVsDeployed,
          rejectionData: rejectionData,
        },
      });

      const analysisData = result.data;
      setAiAnalysis(analysisData);
      setAiModalOpen(true);

      // ✅ AUTOMATICALLY SAVE when AI generates analysis (first time)
      const user = auth.currentUser;
      if (user) {
        try {
          await saveAnalysisToFirebase(
            user.uid,
            "capital-deployment",
            analysisData,
            {
              fundingSources: sources,
              fundingPurposes: purposes,
              averageFundSize: avgFundSize.current,
              fundsRaisedVsDeployed: fundsVsDeployed,
              rejectionData: rejectionData,
            }
          );
          setSaveSuccess(true);
          setHasSavedAnalysis(true);
          // Hide success message after 3 seconds
          setTimeout(() => setSaveSuccess(false), 3000);
        } catch (saveError) {
          console.error("Error auto-saving analysis:", saveError);
          // Don't show error to user, just log it
        }
      }

      setHasSavedAnalysis(true);
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

      // Close current modal and reset
      setAiModalOpen(false);
      setAiAnalysis(null);

      // Generate new analysis (this will auto-save again)
      await handleAIAnalysis();

    } catch (error) {
      console.error("Error generating new analysis:", error);
      setAiError("Failed to generate new analysis: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <AIAnalysisModal
        isOpen={aiModalOpen}
        title="Capital Deployment"
        analysisData={aiAnalysis}
        loading={aiLoading}
        error={aiError}
        onClose={() => setAiModalOpen(false)}
        onNewAnalysis={handleNewAnalysis}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        <Card title="Sources of Funds Raised">
          <div style={{ height: "200px" }}>
            <Doughnut
              options={doughnutOpts}
              data={{ labels: Object.keys(sources), datasets: [{ data: Object.values(sources), backgroundColor: MIXED_COLORS }] }}
            />
          </div>
          <ManualLegend labels={Object.keys(sources)} colors={MIXED_COLORS} values={Object.values(sources)} />
          <ViewTrendButton show={showSourceTrend} onClick={() => setShowSourceTrend((p) => !p)} />
          {showSourceTrend && <TrendChart trendData={sourceTrends} colors={MIXED_COLORS} />}
        </Card>

        <Card title="Purpose of Funds Raised">
          <div style={{ height: "200px" }}>
            <Doughnut
              options={doughnutOpts}
              data={{ labels: Object.keys(purposes), datasets: [{ data: Object.values(purposes), backgroundColor: MIXED_COLORS.slice(3) }] }}
            />
          </div>
          <ManualLegend labels={Object.keys(purposes)} colors={MIXED_COLORS.slice(3)} values={Object.values(purposes)} />
          <ViewTrendButton show={showPurposeTrend} onClick={() => setShowPurposeTrend((p) => !p)} />
          {showPurposeTrend && <TrendChart trendData={purposeTrends} colors={MIXED_COLORS.slice(3)} />}
        </Card>

        <CardWithAI
          title="Average Fund Size (ZAR M)"
          onAIAnalysis={handleAIAnalysis}
          aiLoading={aiLoading}
          hasSavedAnalysis={hasSavedAnalysis}
          onViewSaved={handleViewSavedAnalysis}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <div style={{ fontSize: "44px", fontWeight: "800", color: B.black }}>R {avgFundSize.current}M</div>
            <div style={{ fontSize: "12px", color: B.mediumGrey, marginTop: "8px" }}>
              YoY Growth <TrendIcon growth={avgFundSize.yoyGrowth} />
            </div>
          </div>
        </CardWithAI>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
        <Card title="Funds Raised vs Funds Requested vs Capital Deployed">
          <div style={{ height: "260px" }}>
            <Bar
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: { legend: { display: false },datalabels: {color: '#ffffff'}, },

                scales: {
                  x: {
                    title: { display: true, text: "Year", color: B.darkGrey, font: { size: 11 } },
                    ticks: { font: { size: 10 }, color: B.darkGrey },
                  },
                  y: {
                    beginAtZero: true,
                    grid: { color: B.lightGrey },
                    ticks: { callback: (v) => `R${v}M`, font: { size: 10 }, color: B.darkGrey },
                    title: { display: true, text: "Amount (ZAR M)", color: B.darkGrey, font: { size: 11 } },
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
          <div style={{ display: "flex", gap: "14px", marginTop: "8px", marginBottom: "12px" }}>
            {[
              { label: "Funds Raised", color: MIXED_COLORS[2] },
              { label: "Funds Requested", color: MIXED_COLORS[4] },
              { label: "Capital Deployed", color: MIXED_COLORS[6] },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: "11px", color: B.darkGrey, fontWeight: 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${B.lightGrey}` }}>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: B.darkGrey, fontWeight: 700 }}>Year</th>
                  {fundsVsDeployed.years.map((y) => (
                    <th key={y} style={{ padding: "6px 8px", textAlign: "right", color: B.darkGrey, fontWeight: 700 }}>{y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Raised (RM)", key: "raised" },
                  { label: "Requested (RM)", key: "requested" },
                  { label: "Deployed (RM)", key: "deployed" },
                ].map((row, i) => (
                  <tr key={row.key} style={{ background: i % 2 === 0 ? B.offwhite : "#fff" }}>
                    <td style={{ padding: "5px 8px", color: B.darkGrey, fontWeight: 600 }}>{row.label}</td>
                    {fundsVsDeployed[row.key].map((val, j) => (
                      <td key={j} style={{ padding: "5px 8px", textAlign: "right", color: B.black }}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Deal Rejection Summary">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {[
                { label: "Total Reviewed", value: rejectionData.totalReviewed },
                { label: "Total Rejected", value: rejectionData.totalRejected },
                { label: "Rejection Rate", value: `${rejectionData.rejectionRate}%` },
              ].map((stat) => (
                <div key={stat.label} style={{ background: B.offwhite, borderRadius: "8px", padding: "10px", textAlign: "center", border: `1px solid ${B.lightGrey}` }}>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: B.brownDark }}>{stat.value}</div>
                  <div style={{ fontSize: "10px", color: B.mediumGrey, marginTop: "4px" }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: B.black }}>Top Rejection Reasons</div>
            <div style={{ height: "180px" }}>
              <Bar
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: false,
                  indexAxis: "y",
                     plugins: { legend: { display: false },datalabels: {color: '#ffffff'}, },
                  scales: {
                    x: {
                      beginAtZero: true,
                      grid: { color: B.lightGrey },
                      ticks: { color: B.darkGrey, font: { size: 9 }, callback: (v) => `${v}%` },
                    },
                    y: {
                      grid: { display: false },
                      ticks: { color: B.darkGrey, font: { size: 9 } },
                    },
                  },
                }}
                data={{
                  labels: Object.keys(rejectionData.topReasons),
                  datasets: [{ data: Object.values(rejectionData.topReasons), backgroundColor: MIXED_COLORS }],
                }}
              />
            </div>
            <div style={{ fontSize: "10px", color: B.warmGrey, paddingTop: "8px", borderTop: `1px solid ${B.offwhite}` }}>
              {rejectionData.rejectionRate}% of reviewed deals were rejected — poor financials remain the leading cause at 38% of all rejections.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── Market Structure ─────────────────────────────────────────────────────────
const MarketStructure = ({ analyticsData, entitiesData }) => {
  const [viewType, setViewType] = useState("zar");
  const [activeSubTab, setActiveSubTab] = useState("where-capital");
  const [trendVisible, setTrendVisible] = useState({});
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasSavedAnalysis, setHasSavedAnalysis] = useState(false);

  const toggleTrend = (key) => setTrendVisible((p) => ({ ...p, [key]: !p[key] }));

  const sectorAlloc = analyticsData?.sectorDistribution || { Fintech: 32, Healthtech: 18, Agritech: 15, Edtech: 12, Logistics: 10, "Clean Energy": 8, Others: 5 };
  const geoAlloc = analyticsData?.geographicDistribution || { Gauteng: 45, "Western Cape": 25, KZN: 15, "Eastern Cape": 8, Others: 7 };
  const stageAlloc = analyticsData?.stageDistribution || { "Pre-seed": 12, Seed: 28, "Series A": 35, "Series B": 18, "Series C+": 7 };
  const funderContribution = analyticsData?.investorTypes || { VC: 45, Angel: 20, DFI: 18, "Corporate VC": 12, "Family Office": 5 };
  const coDeals = { yes: 45, no: 55 };
  const coLocation = { Johannesburg: 48, CapeTown: 25, Durban: 12, Pretoria: 8, International: 7 };

  const calculateTrends = (data) => {
    const years = ["2022", "2023", "2024", "2025"];
    const trends = { years };
    Object.keys(data).forEach(key => {
      trends[key] = [
        Math.round(data[key] * 0.6),
        Math.round(data[key] * 0.75),
        Math.round(data[key] * 0.88),
        data[key]
      ];
    });
    return trends;
  };

  const sectorTrends = calculateTrends(sectorAlloc);
  const geoTrends = calculateTrends(geoAlloc);
  const stageTrends = calculateTrends(stageAlloc);
  const funderTrends = calculateTrends(funderContribution);
  const fundManagerLoc = { Johannesburg: 45, CapeTown: 28, Durban: 12, Pretoria: 8, Others: 7 };
  const fundManagerTrends = calculateTrends(fundManagerLoc);
  const coDealsTrends = calculateTrends(coDeals);
  const coLocationTrends = calculateTrends(coLocation);
  const bbbee = { level1: 12, level2: 18, level3: 24, level4: 20, nonCompliant: 26 };

  const topSectors = Object.entries(sectorAlloc).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const bottomSectors = Object.entries(sectorAlloc).sort((a, b) => a[1] - b[1]).slice(0, 3);

  // Check for saved analysis on component mount
  useEffect(() => {
    const checkSavedAnalysis = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const savedAnalysis = await fetchLatestAnalysis(user.uid, "market-structure");
          setHasSavedAnalysis(!!savedAnalysis);
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

      const savedAnalysis = await fetchLatestAnalysis(user.uid, "market-structure");
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
      const generateMarketStructureAnalysis = httpsCallable(functions, "generateMarketStructureAnalysis");

      const result = await generateMarketStructureAnalysis({
        marketData: {
          sectorDistribution: sectorAlloc,
          geographicDistribution: geoAlloc,
          stageDistribution: stageAlloc,
          investorTypes: funderContribution,
          coInvestmentRate: coDeals.yes,
          fundManagerLocations: fundManagerLoc,
          bbbeeCompliance: bbbee,
          coInvestorLocations: coLocation,
        },
      });

      setAiAnalysis(result.data);
      setAiModalOpen(true);
      setHasSavedAnalysis(true);
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

      await saveAnalysisToFirebase(
        user.uid,
        "market-structure",
        aiAnalysis,
        {
          sectorDistribution: sectorAlloc,
          geographicDistribution: geoAlloc,
          stageDistribution: stageAlloc,
          investorTypes: funderContribution,
          coInvestmentRate: coDeals.yes,
          fundManagerLocations: fundManagerLoc,
          bbbeeCompliance: bbbee,
          coInvestorLocations: coLocation,
        }
      );

      setSaveSuccess(true);

      setTimeout(() => {
        setAiAnalysis(null);
        setAiModalOpen(false);
        setSaveSuccess(false);
        handleAIAnalysis();
      }, 1500);
    } catch (error) {
      console.error("Error saving analysis:", error);
      setAiError("Failed to save analysis: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const DoughnutCard = ({ title, data, colors, trendKey, trendData, footer }) => {
    const labels = Object.keys(data);
    const values = Object.values(data);
    return (
      <Card title={title} footer={footer}>
        <div style={{ height: "200px" }}>
          <Doughnut
            options={doughnutOpts}
            data={{ labels, datasets: [{ data: values, backgroundColor: colors }] }}
          />
        </div>
        <ManualLegend labels={labels} colors={colors} values={values} />
        <ViewTrendButton show={trendVisible[trendKey]} onClick={() => toggleTrend(trendKey)} />
        {trendVisible[trendKey] && <TrendChart trendData={trendData} colors={colors} />}
      </Card>
    );
  };

  return (
    <div>
      <AIAnalysisModal
        isOpen={aiModalOpen}
        title="Market Structure"
        analysisData={aiAnalysis}
        loading={aiLoading}
        error={aiError}
        onClose={() => setAiModalOpen(false)}
        onNewAnalysis={handleNewAnalysis}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
      />

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px", borderBottom: `1px solid ${B.lightGrey}`, paddingBottom: "12px", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <SubTab label="Where Capital Goes" active={activeSubTab === "where-capital"} onClick={() => setActiveSubTab("where-capital")} />
          <SubTab label="Who Provides Capital" active={activeSubTab === "who-provides"} onClick={() => setActiveSubTab("who-provides")} />
          <SubTab label="Co-investor Analysis" active={activeSubTab === "co-investor"} onClick={() => setActiveSubTab("co-investor")} />
        </div>
        <AIAnalysisButton onClick={handleAIAnalysis} loading={aiLoading} hasSavedAnalysis={hasSavedAnalysis} onViewSaved={handleViewSavedAnalysis} />
      </div>

      {activeSubTab === "where-capital" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px", gap: "8px" }}>
            <Pill label="By Allocation" active={viewType === "zar"} onClick={() => setViewType("zar")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
            <DoughnutCard title="Sector Concentration" data={sectorAlloc} colors={MIXED_COLORS} trendKey="sector" trendData={sectorTrends} footer={`Top 3: ${topSectors.map((s) => s[0]).join(", ")} | Bottom 3: ${bottomSectors.map((s) => s[0]).join(", ")}`} />
            <DoughnutCard title="Geographic Concentration" data={geoAlloc} colors={MIXED_COLORS} trendKey="geo" trendData={geoTrends} />
            <DoughnutCard title="Deal Stage Concentration" data={stageAlloc} colors={MIXED_COLORS} trendKey="stage" trendData={stageTrends} />
          </div>
        </div>
      )}

      {activeSubTab === "who-provides" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px", gap: "8px" }}>
            <Pill label="By Allocation" active={viewType === "zar"} onClick={() => setViewType("zar")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
            <DoughnutCard title="Funder Type Distribution" data={funderContribution} colors={MIXED_COLORS} trendKey="funder" trendData={funderTrends} />
            <Card title="Funder B-BBEE Compliance Status">
              <div style={{ height: "260px" }}>
                <Bar
                  options={hBarOpts()}
                  data={{
                    labels: ["Level 1", "Level 2", "Level 3", "Level 4", "Non-Compliant"],
                    datasets: [{ label: "Number of Funders", data: [bbbee.level1, bbbee.level2, bbbee.level3, bbbee.level4, bbbee.nonCompliant], backgroundColor: MIXED_COLORS[0] }],
                  }}
                />
              </div>
            </Card>
            <DoughnutCard title="Fund Manager Head Office Distribution" data={fundManagerLoc} colors={MIXED_COLORS} trendKey="fundmgr" trendData={fundManagerTrends} />
          </div>
        </div>
      )}

      {activeSubTab === "co-investor" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
          <DoughnutCard
            title="Deals with Co-investors"
            data={{ "With Co-investors": coDeals.yes, Solo: coDeals.no }}
            colors={[MIXED_COLORS[1], MIXED_COLORS[6]]}
            trendKey="codeals"
            trendData={coDealsTrends}
          />
          <DoughnutCard title="Co-investor Location" data={coLocation} colors={MIXED_COLORS} trendKey="coloc" trendData={coLocationTrends} />
        </div>
      )}
    </div>
  );
};
// ─── Deal Structure ───────────────────────────────────────────────────────────
const DealStructure = ({ analyticsData, entitiesData }) => {
  const [activeSubTab, setActiveSubTab] = useState("fund-type");
  const [trendVisible, setTrendVisible] = useState({});
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasSavedAnalysis, setHasSavedAnalysis] = useState(false);

  const toggleTrend = (key) => setTrendVisible((p) => ({ ...p, [key]: !p[key] }));

  const dealStats = { grant: 15, equity: 55, debt: 25, convertible: 5 };
  const fundTypeAlloc = { Grant: dealStats.grant, Equity: dealStats.equity, Debt: dealStats.debt, Convertible: dealStats.convertible };
  const fundTypeDist = { Grant: dealStats.grant + 5, Equity: dealStats.equity - 5, Debt: dealStats.debt, Convertible: dealStats.convertible };
  const fundTypeTrends = {
    years: ["2022", "2023", "2024", "2025"],
    Grant: [12, 13, 14, 15],
    Equity: [48, 51, 53, 55],
    Debt: [22, 23, 24, 25],
    Convertible: [4, 4, 5, 5]
  };

  const avgDealSize = { current: 12.5, yoyGrowth: 8.2 };
  const dealSizeDist = { "<R1M": 15, "R1-5M": 35, "R5-10M": 28, "R10-20M": 15, "R20M+": 7 };
  const avgDealsPerInvestor = { current: 3.8, yoyGrowth: 5.6 };
  const equitySizeDist = { "<R1M": 20, "R1-5M": 40, "R5-10M": 25, "R10-20M": 10, "R20M+": 5 };
  const equityPctDist = { "0-10%": 25, "10-20%": 40, "20-30%": 20, "30-50%": 10, "50%+": 5 };

  // Check for saved analysis on component mount
  useEffect(() => {
    const checkSavedAnalysis = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const savedAnalysis = await fetchLatestAnalysis(user.uid, "deal-structure");
          if (savedAnalysis && savedAnalysis.analysis) {
            setHasSavedAnalysis(true);
            // Optionally load the saved analysis for "View Saved" button
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

      const savedAnalysis = await fetchLatestAnalysis(user.uid, "deal-structure");
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
      const generateDealStructureAnalysis = httpsCallable(functions, "generateDealStructureAnalysis");

      const result = await generateDealStructureAnalysis({
        dealData: {
          fundTypeDistribution: fundTypeAlloc,
          dealSizeDistribution: dealSizeDist,
          averageDealSize: avgDealSize.current,
          averageDealsPerInvestor: avgDealsPerInvestor.current,
          equitySizeDistribution: equitySizeDist,
          equityPercentageDistribution: equityPctDist,
        },
      });

      const analysisData = result.data;
      setAiAnalysis(analysisData);
      setAiModalOpen(true);

      // ✅ AUTO-SAVE immediately after getting analysis
      const user = auth.currentUser;
      if (user) {
        try {
          await saveAnalysisToFirebase(
            user.uid,
            "deal-structure",
            analysisData,
            {
              fundTypeDistribution: fundTypeAlloc,
              dealSizeDistribution: dealSizeDist,
              averageDealSize: avgDealSize.current,
              averageDealsPerInvestor: avgDealsPerInvestor.current,
              equitySizeDistribution: equitySizeDist,
              equityPercentageDistribution: equityPctDist,
            }
          );
          setSaveSuccess(true);
          setHasSavedAnalysis(true);
          // Auto-hide success message after 3 seconds
          setTimeout(() => setSaveSuccess(false), 3000);
        } catch (saveError) {
          console.error("Error auto-saving analysis:", saveError);
          // Show user-friendly error but don't block the modal
          setAiError("Analysis generated but failed to save: " + saveError.message);
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

      // Close current modal and reset
      setAiModalOpen(false);
      setAiAnalysis(null);
      setSaveSuccess(false);

      // Generate new analysis (will auto-save)
      await handleAIAnalysis();

    } catch (error) {
      console.error("Error generating new analysis:", error);
      setAiError("Failed to generate new analysis: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const DoughnutCard = ({ title, data, colors, trendKey, trendData }) => {
    const labels = Object.keys(data);
    const values = Object.values(data);
    return (
      <Card title={title}>
        <div style={{ height: "220px" }}>
          <Doughnut
            options={doughnutOpts}
            data={{ labels, datasets: [{ data: values, backgroundColor: colors }] }}
          />
        </div>
        <ManualLegend labels={labels} colors={colors} values={values} />
        <ViewTrendButton show={trendVisible[trendKey]} onClick={() => toggleTrend(trendKey)} />
        {trendVisible[trendKey] && <TrendChart trendData={trendData} colors={colors} />}
      </Card>
    );
  };

  return (
    <div>
      <AIAnalysisModal
        isOpen={aiModalOpen}
        title="Deal Structure"
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

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: `1px solid ${B.lightGrey}`, paddingBottom: "12px", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <SubTab label="Fund Type" active={activeSubTab === "fund-type"} onClick={() => setActiveSubTab("fund-type")} />
          <SubTab label="Deal Size" active={activeSubTab === "deal-size"} onClick={() => setActiveSubTab("deal-size")} />
          <SubTab label="Equity Preferences" active={activeSubTab === "equity"} onClick={() => setActiveSubTab("equity")} />
        </div>
        <AIAnalysisButton
          onClick={handleAIAnalysis}
          loading={aiLoading}
          hasSavedAnalysis={hasSavedAnalysis}
          onViewSaved={handleViewSavedAnalysis}
        />
      </div>

      {activeSubTab === "fund-type" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
          <DoughnutCard title="Fund Type — By Allocation" data={fundTypeAlloc} colors={MIXED_COLORS} trendKey="fundtype-zar" trendData={fundTypeTrends} />
          <DoughnutCard title="Fund Type — By Distribution" data={fundTypeDist} colors={MIXED_COLORS} trendKey="fundtype-count" trendData={fundTypeTrends} />
        </div>
      )}

      {activeSubTab === "deal-size" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
          <Card title="Average Deal Size">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
              <div style={{ fontSize: "44px", fontWeight: "800", color: B.black }}>R {avgDealSize.current}M</div>
              <div style={{ fontSize: "12px", color: B.mediumGrey }}>YoY Growth <TrendIcon growth={avgDealSize.yoyGrowth} /></div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: B.black, marginTop: "20px" }}>{avgDealsPerInvestor.current} avg deals per investor</div>
              <div style={{ fontSize: "11px", color: B.mediumGrey }}>YoY Growth <TrendIcon growth={avgDealsPerInvestor.yoyGrowth} /></div>
            </div>
          </Card>
          <Card title="Deal Size Distribution">
            <div style={{ height: "320px" }}>
              <Bar
                options={{ responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false }, datalabels: {color: '#ffffff'}, }, scales: { x: { title: { display: true, text: "Range", color: B.darkGrey }, grid: { display: false }, ticks: { color: B.darkGrey, font: { size: 8 } } }, y: { title: { display: true, text: "Number of Deals", color: B.darkGrey }, beginAtZero: true, grid: { color: B.lightGrey }, ticks: { color: B.darkGrey, callback: (v) => `R${v}M` } } } }}
                data={{ labels: Object.keys(dealSizeDist), datasets: [{ label: "Number of Deals", data: Object.values(dealSizeDist), backgroundColor: MIXED_COLORS[0] }] }}
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
                options={{ responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false },datalabels: {color: '#ffffff'}, }, scales: { x: { title: { display: true, text: "Range", color: B.darkGrey }, grid: { display: false }, ticks: { color: B.darkGrey, font: { size: 8 } } }, y: { title: { display: true, text: "Number of Deals", color: B.darkGrey }, beginAtZero: true, grid: { color: B.lightGrey }, ticks: { color: B.darkGrey, callback: (v) => `R${v}M` } } } }}
                data={{ labels: Object.keys(equitySizeDist), datasets: [{ label: "Number of Deals", data: Object.values(equitySizeDist), backgroundColor: MIXED_COLORS[1] }] }}
              />
            </div>
          </Card>
          <Card title="Equity Percentage Distribution">
            <div style={{ height: "320px" }}>
              <Bar
                options={{ responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false },datalabels: {color: '#ffffff'}, }, scales: { x: { title: { display: true, text: "Range", color: B.darkGrey }, grid: { display: false }, ticks: { color: B.darkGrey, font: { size: 8 } } }, y: { title: { display: true, text: "Number of Deals", color: B.darkGrey }, beginAtZero: true, grid: { color: B.lightGrey }, ticks: { color: B.darkGrey } } } }}
                data={{ labels: Object.keys(equityPctDist), datasets: [{ label: "Number of Deals", data: Object.values(equityPctDist), backgroundColor: MIXED_COLORS[3] }] }}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// ─── Loading & Error States ───────────────────────────────────────────────────
const LoadingState = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", flexDirection: "column", gap: "16px" }}>
    <div className="spinner" style={{ width: "40px", height: "40px", border: "3px solid #e0d5c8", borderTop: "3px solid #a67c52", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
    <div style={{ fontSize: "14px", color: "#7d5a50" }}>Loading ecosystem analytics...</div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", flexDirection: "column", gap: "16px", textAlign: "center", padding: "20px" }}>
    <div style={{ fontSize: "48px" }}>⚠️</div>
    <h3 style={{ color: "#c62828", margin: 0 }}>Error Loading Analytics</h3>
    <p style={{ color: "#7d5a50", maxWidth: "500px" }}>{error}</p>
    <button
      onClick={onRetry}
      style={{
        padding: "10px 20px",
        background: "linear-gradient(135deg, #a67c52, #7d5a50)",
        color: "#faf7f2",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "500"
      }}
    >
      Try Again
    </button>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const CapitalFlow = () => {
  const [activeMainTab, setActiveMainTab] = useState("market-structure");
  const [entitiesData, setEntitiesData] = useState({ smes: [], investors: [], catalysts: [], advisors: [] });
  const { analyticsData, loading, error, associationName, refreshAnalytics } = useAssociationAnalytics();

  // Fetch raw entities data for detailed calculations
  useEffect(() => {
    const fetchEntities = async () => {
      if (!associationName) return;

      try {
        const results = { smes: [], investors: [], catalysts: [], advisors: [] };

        // Fetch SMEs
        const smeQuery = query(collection(db, "universalProfiles"), where("entityOverview.memberOfAssociation", "==", "yes"));
        const smeSnapshot = await getDocs(smeQuery);
        for (const docSnap of smeSnapshot.docs) {
          const data = docSnap.data();
          if ((data.entityOverview?.industryAssociations || []).includes(associationName)) {
            results.smes.push(data);
          }
        }

        // Fetch Investors
        const investorQuery = query(collection(db, "MyuniversalProfiles"), where("fundManageOverview.memberOfAssociation", "==", "yes"));
        const investorSnapshot = await getDocs(investorQuery);
        for (const docSnap of investorSnapshot.docs) {
          const data = docSnap.data();
          const formData = data.formData || {};
          if ((formData.fundManageOverview?.industryAssociations || []).includes(associationName)) {
            results.investors.push(formData);
          }
        }

        // Fetch Catalysts
        const catalystSnapshot = await getDocs(collection(db, "catalystProfiles"));
        for (const docSnap of catalystSnapshot.docs) {
          const data = docSnap.data();
          const formData = data.formData || {};
          if (formData.entityOverview?.memberOfAssociation === "yes" && (formData.entityOverview?.industryAssociations || []).includes(associationName)) {
            results.catalysts.push(formData);
          }
        }

        // Fetch Advisors
        const advisorSnapshot = await getDocs(collection(db, "advisorProfiles"));
        for (const docSnap of advisorSnapshot.docs) {
          const data = docSnap.data();
          const formData = data.formData || {};
          if (formData.personalProfessionalOverview?.memberOfAssociation === "yes" && (formData.personalProfessionalOverview?.industryAssociations || []).includes(associationName)) {
            results.advisors.push(formData);
          }
        }

        setEntitiesData(results);
      } catch (err) {
        console.error("Error fetching entities:", err);
      }
    };

    if (associationName) {
      fetchEntities();
    }
  }, [associationName]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refreshAnalytics} />;
  }

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontSize: "14px", color: "#7d5a50", margin: 0 }}>
          Showing analytics for: <strong>{associationName || "your association"}</strong>
        </p>
        <p style={{ fontSize: "12px", color: "#9e9e9e", margin: "4px 0 0 0" }}>
          Data aggregated from {entitiesData.smes.length} SMEs, {entitiesData.investors.length} Investors, {entitiesData.catalysts.length} Catalysts, and {entitiesData.advisors.length} Advisors
        </p>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: `1px solid ${B.lightGrey}`, paddingBottom: "12px" }}>
        <SubTab label="Market Structure" active={activeMainTab === "market-structure"} onClick={() => setActiveMainTab("market-structure")} />
        <SubTab label="Deal Structure" active={activeMainTab === "deal-structure"} onClick={() => setActiveMainTab("deal-structure")} />
        <SubTab label="Capital Deployment" active={activeMainTab === "deployment"} onClick={() => setActiveMainTab("deployment")} />
      </div>

      {activeMainTab === "market-structure" && <MarketStructure analyticsData={analyticsData} entitiesData={entitiesData} />}
      {activeMainTab === "deal-structure" && <DealStructure analyticsData={analyticsData} entitiesData={entitiesData} />}
      {activeMainTab === "deployment" && <CapitalDeployment analyticsData={analyticsData} entitiesData={entitiesData} />}
    </div>
  );
};

// ✅ CRITICAL: Add default export at the very bottom
export default CapitalFlow;