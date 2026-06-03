"use client";

import { useState, useEffect, useCallback } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

// ==================== CACHE SERVICE ====================
// Mirrors AnalysisCacheService pattern from marketing analysis

class HealthCacheService {
  static simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  static getCacheId(userId) {
    // Cache key is per-user; health data is relatively stable
    return `health_overview_${userId}`;
  }

  static async save(userId, data) {
    if (!userId) return false;
    try {
      const ref = doc(db, `users/${userId}/cachedAnalyses`, this.getCacheId(userId));
      await setDoc(ref, {
        type: "companyHealth",
        data,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h TTL
      });
      return true;
    } catch (e) {
      console.error("HealthCache save error:", e);
      return false;
    }
  }

  static async load(userId) {
    if (!userId) return null;
    try {
      const ref = doc(db, `users/${userId}/cachedAnalyses`, this.getCacheId(userId));
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const d = snap.data();
      if (new Date(d.expiresAt) > new Date()) return d;
      return null;
    } catch (e) {
      console.error("HealthCache load error:", e);
      return null;
    }
  }
}

// ==================== CONSTANTS ====================

const HEALTH_DATA = [
  {
    key: "strategy",
    category: "Strategy & Execution",
    metrics: ["Strategic clarity", "Operating model fit", "Execution discipline", "Strategic risk control", "Change & adaptability"],
    healthStatus: "healthy",
    riskLevel: "low",
    baseAnalysis: "Strong strategic alignment with clear execution pathway",
  },
  {
    key: "finance",
    category: "Finance",
    metrics: ["Solvency", "Liquidity", "Profitability trend", "Cost agility", "Cash survivability", "Investability"],
    healthStatus: "watch",
    riskLevel: "medium",
    baseAnalysis: "Liquidity requires monitoring, profitability trending positive",
  },
  {
    key: "operations",
    category: "Operations",
    metrics: ["Supply chain resilience", "Delivery capacity", "Reliability", "Safety risk", "Scalability readiness"],
    healthStatus: "healthy",
    riskLevel: "low",
    baseAnalysis: "Operational systems stable and scalable",
  },
  {
    key: "people",
    category: "People Health",
    metrics: ["Overall", "Dependency Risk", "Execution Capacity", "Scalability Risk", "Continuity Risk", "External Credibility Risk"],
    healthStatus: "risk",
    riskLevel: "high",
    baseAnalysis: "Key person dependency identified, succession planning needed",
  },
  {
    key: "marketing",
    category: "Marketing & Sales",
    metrics: ["Pipeline visibility", "Pipeline sufficiency", "Pipeline quality", "Revenue concentration", "Demand sustainability"],
    healthStatus: "watch",
    riskLevel: "medium",
    baseAnalysis: "Pipeline building, revenue concentration being addressed",
  },
  {
    key: "esg",
    category: "ESG",
    metrics: ["Environmental Risk", "Social Risk", "Governance Risk"],
    healthStatus: "healthy",
    riskLevel: "low",
    baseAnalysis: "ESG framework in place and operating effectively",
  },
];

// ==================== HELPERS ====================

const statusColors = { healthy: "#16a34a", watch: "#f59e0b", risk: "#dc2626" };
const riskBadgeStyles = {
  low:    { bg: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" },
  medium: { bg: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" },
  high:   { bg: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" },
};

const statusDotStyle = (status) => ({
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  backgroundColor: statusColors[status] || "#94a3b8",
  margin: "0 auto",
  border: "2px solid #fdfcfb",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
});

// ==================== ANALYSIS CELL ====================

const AnalysisCell = ({ categoryKey, aiResult, loading, baseAnalysis }) => {
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
        <div style={{
          width: "16px", height: "16px",
          border: "2px solid #e8ddd4",
          borderTopColor: "#7d5a50",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <span style={{ fontSize: "12px", color: "#7d5a50" }}>AI analyzing...</span>
      </div>
    );
  }

  if (aiResult) {
    const insightColors = { positive: "#16a34a", warning: "#f59e0b", critical: "#dc2626" };
    return (
      <div style={{ position: "relative" }}>
        {/* AI badge */}
        <div style={{
          position: "absolute", top: "-8px", right: "-8px",
          backgroundColor: "#7d5a50", color: "#fdfcfb",
          fontSize: "10px", padding: "2px 6px",
          borderRadius: "12px", fontWeight: "600",
        }}>
          AI
        </div>
        {/* Summary */}
        <p style={{
          fontSize: "13px", color: "#4a352f", lineHeight: "1.6",
          margin: "0 0 10px", backgroundColor: "#f0f9ff",
          padding: "10px", borderRadius: "6px",
          borderLeft: "3px solid #7d5a50",
        }}>
          {aiResult.summary}
        </p>
        {/* Key insights */}
        {aiResult.keyInsights?.slice(0, 2).map((insight, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: "6px",
            marginBottom: "6px",
          }}>
            <span style={{ color: insightColors[insight.type] || "#7d5a50", fontSize: "14px", marginTop: "1px" }}>
              {insight.type === "positive" ? "✓" : insight.type === "critical" ? "!" : "·"}
            </span>
            <span style={{ fontSize: "12px", color: "#5d4037", lineHeight: "1.5" }}>
              {insight.message}
            </span>
          </div>
        ))}
        {/* Top recommendation */}
        {aiResult.topRecommendation && (
          <div style={{
            marginTop: "8px", padding: "6px 10px",
            backgroundColor: "#fef3c7", borderRadius: "4px",
            fontSize: "12px", color: "#92400e",
          }}>
            <strong>Action: </strong>{aiResult.topRecommendation}
          </div>
        )}
      </div>
    );
  }

  return (
    <p style={{
      fontSize: "13px", color: "#4a352f", lineHeight: "1.6",
      textAlign: "center", margin: 0, fontStyle: "italic",
    }}>
      {baseAnalysis}
    </p>
  );
};

// ==================== MAIN COMPONENT ====================

function OverallCompanyHealth() {
  const [user, setUser] = useState(null);
  const [aiResults, setAiResults] = useState(null);       // full parsed response
  const [categoryLoading, setCategoryLoading] = useState({}); // per-category loading states
  const [globalLoading, setGlobalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cachedAt, setCachedAt] = useState(null);

  const [isInvestorView, setIsInvestorView] = useState(false);
  const [viewingSMEId, setViewingSMEId] = useState(null);
  const [viewingSMEName, setViewingSMEName] = useState("");
  const [viewOrigin, setViewOrigin] = useState("investor");

  // ---- Auth ----
  useEffect(() => {
    const investorViewMode = sessionStorage.getItem("investorViewMode");
    const smeId = sessionStorage.getItem("viewingSMEId");
    const smeName = sessionStorage.getItem("viewingSMEName");
    const origin = sessionStorage.getItem("viewOrigin");
    if (investorViewMode === "true" && smeId) {
      setIsInvestorView(true);
      setViewingSMEId(smeId);
      setViewingSMEName(smeName || "SME");
      setViewOrigin(origin || "investor");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(isInvestorView && viewingSMEId ? { uid: viewingSMEId } : currentUser);
    });
    return () => unsubscribe();
  }, [isInvestorView, viewingSMEId]);

  // ---- Spin animation ----
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // ---- Load cache on mount ----
  useEffect(() => {
    if (!user) return;
    (async () => {
      const cached = await HealthCacheService.load(user.uid);
      if (cached) {
        setAiResults(cached.data);
        setCachedAt(cached.createdAt);
      }
    })();
  }, [user]);

  // ---- Generate analysis ----
  const generateAnalysis = useCallback(async (forceRegenerate = false) => {
    if (!user) {
      setError("Please log in to generate AI analysis.");
      return;
    }

    // Check cache first
    if (!forceRegenerate) {
      const cached = await HealthCacheService.load(user.uid);
      if (cached) {
        setAiResults(cached.data);
        setCachedAt(cached.createdAt);
        return;
      }
    }

    setGlobalLoading(true);
    setError(null);

    // Show per-category spinners immediately
    const loadingMap = {};
    HEALTH_DATA.forEach((row) => { loadingMap[row.key] = true; });
    setCategoryLoading(loadingMap);

    try {
      const functions = getFunctions();
      const analyzeHealth = httpsCallable(functions, "analyzeCompanyHealth");

      const payload = {
        companyName: "Your Business",
        categories: HEALTH_DATA.map((row) => ({
          key: row.key,
          name: row.category,
          metrics: row.metrics,
          healthStatus: row.healthStatus,
          riskLevel: row.riskLevel,
          baseAnalysis: row.baseAnalysis,
        })),
      };

      const result = await analyzeHealth(payload);
      const data = result.data;

      // Cache the result
      await HealthCacheService.save(user.uid, data);

      setAiResults(data);
      setCachedAt(data.timestamp);

      // Stagger clearing the per-category loading states for a nice UX
      HEALTH_DATA.forEach((row, idx) => {
        setTimeout(() => {
          setCategoryLoading((prev) => ({ ...prev, [row.key]: false }));
        }, idx * 150);
      });
    } catch (err) {
      console.error("Error generating health analysis:", err);
      setError(err.message || "Failed to generate analysis. Please try again.");
      setCategoryLoading({});
    } finally {
      setGlobalLoading(false);
    }
  }, [user]);

  // ---- Auto-generate if no cache ----
  useEffect(() => {
    if (user && !aiResults) {
      generateAnalysis(false);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExitInvestorView = () => {
    sessionStorage.removeItem("viewingSMEId");
    sessionStorage.removeItem("viewingSMEName");
    sessionStorage.removeItem("investorViewMode");
    sessionStorage.removeItem("viewOrigin");
    window.location.href = viewOrigin === "catalyst" ? "/catalyst/cohorts" : "/my-cohorts";
  };

  // ---- Render helpers ----
  const getFormattedCacheTime = () => {
    if (!cachedAt) return null;
    const date = new Date(cachedAt);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString();
  };

  const overallScore = aiResults?.overallHealthScore;
  const executiveSummary = aiResults?.executiveSummary;
  const criticalActions = aiResults?.criticalActions || [];

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#f7f3f0",
      width: "100%", boxSizing: "border-box",
    }}>
      <div style={{ maxWidth: "100%", margin: "0 auto", width: "100%" }}>

        {/* ---- Investor / Catalyst Banner ---- */}
        {isInvestorView && (
          <div style={{
            backgroundColor: "#e8f5e9", padding: "16px 20px",
            margin: "0 20px 20px", borderRadius: "8px",
            border: "2px solid #4caf50", display: "flex",
            justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>👁️</span>
              <span style={{ color: "#2e7d32", fontWeight: "600", fontSize: "15px" }}>
                {viewOrigin === "catalyst"
                  ? `Catalyst View: Viewing ${viewingSMEName}'s Company Health`
                  : `Investor View: Viewing ${viewingSMEName}'s Company Health`}
              </span>
            </div>
            <button
              onClick={handleExitInvestorView}
              style={{
                padding: "8px 16px", backgroundColor: "#4caf50", color: "white",
                border: "none", borderRadius: "6px", cursor: "pointer",
                fontWeight: "600", fontSize: "14px",
              }}
            >
              ← {viewOrigin === "catalyst" ? "Back to Catalyst Cohorts" : "Back to My Cohorts"}
            </button>
          </div>
        )}

        {/* ---- Page Header ---- */}
        <div style={{ marginBottom: "30px", paddingLeft: "20px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#5d4037", marginBottom: "10px", marginTop: 0 }}>
            Overall Company Health
          </h1>
          <p style={{ fontSize: "16px", color: "#7d5a50", fontWeight: "500", margin: 0 }}>
            Comprehensive health assessment across all business dimensions
          </p>
        </div>

        {/* ---- AI Executive Summary Banner ---- */}
        <div style={{
          backgroundColor: "#5d4037", margin: "0 20px 20px",
          padding: "16px 24px", borderRadius: "8px", color: "#fdfcfb",
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", flexWrap: "wrap", gap: "15px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "2px" }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <circle cx="12" cy="8" r="0.5" fill="currentColor" />
            </svg>
            <div>
              <span style={{ fontWeight: "600", fontSize: "14px" }}>AI Executive Summary</span>
              <p style={{ margin: "6px 0 0", fontSize: "13px", opacity: 0.9, lineHeight: "1.6" }}>
                {globalLoading
                  ? "Generating AI analysis across all business dimensions..."
                  : executiveSummary || "Generate an AI analysis to see the executive summary for your business."}
              </p>
              {criticalActions.length > 0 && (
                <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {criticalActions.map((action, i) => (
                    <span key={i} style={{
                      backgroundColor: "rgba(255,255,255,0.15)", fontSize: "12px",
                      padding: "3px 10px", borderRadius: "12px",
                    }}>
                      {action}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
            {overallScore !== undefined && (
              <div style={{
                backgroundColor: overallScore >= 75 ? "#d1fae5" : overallScore >= 50 ? "#fef3c7" : "#fee2e2",
                color: overallScore >= 75 ? "#065f46" : overallScore >= 50 ? "#92400e" : "#991b1b",
                padding: "6px 14px", borderRadius: "20px",
                fontSize: "13px", fontWeight: "700",
              }}>
                Health Score: {overallScore}/100
              </div>
            )}
            {cachedAt && (
              <span style={{
                backgroundColor: "#f0f9ff", color: "#065f46",
                padding: "4px 12px", borderRadius: "20px",
                fontSize: "11px", fontWeight: "600",
              }}>
                Updated {getFormattedCacheTime()}
              </span>
            )}
          </div>
        </div>

        {/* ---- Error State ---- */}
        {error && (
          <div style={{
            margin: "0 20px 20px", padding: "14px 20px",
            backgroundColor: "#fee2e2", borderRadius: "8px",
            border: "1px solid #fca5a5", color: "#991b1b",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: "14px" }}>⚠️ {error}</span>
            <button
              onClick={() => generateAnalysis(true)}
              style={{
                padding: "6px 14px", backgroundColor: "#dc2626", color: "white",
                border: "none", borderRadius: "6px", cursor: "pointer",
                fontSize: "13px", fontWeight: "600",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ---- Health Assessment Table ---- */}
        <div style={{
          backgroundColor: "#fdfcfb", borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(93,64,55,0.1)",
          overflow: "hidden", border: "1px solid #e8ddd4", margin: "0 20px",
        }}>
          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 3fr",
            backgroundColor: "#5d4037", color: "#fdfcfb",
            fontWeight: "600", fontSize: "14px",
            textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            {[
              { label: "Category" },
              { label: "Metrics" },
              { label: "Health Status", sub: "🟢 Healthy  🟡 Watch  🔴 Risk" },
              { label: "Risk Level", sub: "Low / Medium / High" },
              { label: "AI Analysis", sub: "AI-powered insights" },
            ].map(({ label, sub }, i) => (
              <div key={i} style={{
                padding: "15px 20px",
                textAlign: i >= 2 ? "center" : "left",
                borderRight: i < 4 ? "1px solid rgba(253,252,251,0.2)" : "none",
              }}>
                <div>{label}</div>
                {sub && <div style={{ fontSize: "11px", fontWeight: "400", marginTop: "4px", opacity: 0.85 }}>{sub}</div>}
              </div>
            ))}
          </div>

          {/* Table Body */}
          {HEALTH_DATA.map((row, index) => {
            const aiCatResult = aiResults?.categories?.[row.key];
            const isLoading = !!categoryLoading[row.key];

            // Use AI-returned status/risk if available, else fallback to static
            const displayStatus = aiCatResult?.healthStatus || row.healthStatus;
            const displayRisk = aiCatResult?.riskLevel || row.riskLevel;

            return (
              <div
                key={row.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 3fr",
                  borderBottom: index < HEALTH_DATA.length - 1 ? "1px solid #e8ddd4" : "none",
                  backgroundColor: index % 2 === 0 ? "#fdfcfb" : "#f7f3f0",
                }}
              >
                {/* Category */}
                <div style={{
                  padding: "20px", borderRight: "1px solid #e8ddd4",
                  fontWeight: "600", color: "#5d4037", fontSize: "15px",
                  display: "flex", alignItems: "center",
                }}>
                  {row.category}
                </div>

                {/* Metrics */}
                <div style={{
                  padding: "20px", borderRight: "1px solid #e8ddd4",
                  display: "flex", alignItems: "center",
                }}>
                  <div>
                    {row.metrics.map((m, i) => (
                      <div key={i} style={{
                        fontSize: "13px", color: "#4a352f",
                        marginBottom: i < row.metrics.length - 1 ? "6px" : 0,
                        lineHeight: "1.4",
                      }}>
                        • {m}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Health Status dot */}
                <div style={{
                  padding: "20px", borderRight: "1px solid #e8ddd4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={statusDotStyle(displayStatus)} />
                </div>

                {/* Risk Level badge */}
                <div style={{
                  padding: "20px", borderRight: "1px solid #e8ddd4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{
                    ...(riskBadgeStyles[displayRisk] || {}),
                    padding: "6px 12px", borderRadius: "4px",
                    fontSize: "12px", fontWeight: "600", textTransform: "capitalize",
                  }}>
                    {displayRisk}
                  </span>
                </div>

                {/* AI Analysis */}
                <div style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AnalysisCell
                    categoryKey={row.key}
                    aiResult={aiCatResult}
                    loading={isLoading}
                    baseAnalysis={row.baseAnalysis}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ---- Action Buttons ---- */}
        <div style={{
          marginTop: "30px", display: "flex",
          justifyContent: "center", gap: "15px",
          flexWrap: "wrap", padding: "0 20px",
        }}>
          <button
            onClick={() => generateAnalysis(true)}
            disabled={globalLoading}
            style={{
              padding: "12px 24px", backgroundColor: globalLoading ? "#a58a82" : "#7d5a50",
              color: "#fdfcfb", fontWeight: "600", fontSize: "14px",
              borderRadius: "6px", border: "none",
              cursor: globalLoading ? "wait" : "pointer",
              display: "flex", alignItems: "center", gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {globalLoading ? "Generating..." : "Regenerate AI Health Report"}
          </button>

          <button
            style={{
              padding: "12px 24px", backgroundColor: "#e8ddd4", color: "#5d4037",
              fontWeight: "600", fontSize: "14px", borderRadius: "6px",
              border: "1px solid #d4c4b0", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Analysis
          </button>
        </div>

        {/* ---- Legend ---- */}
        <div style={{
          marginTop: "30px", padding: "20px", backgroundColor: "#fdfcfb",
          borderRadius: "8px", border: "1px solid #e8ddd4", margin: "30px 20px 0",
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037", marginTop: 0, marginBottom: "15px" }}>
            Status Legend
          </h3>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {[
              { color: "#16a34a", label: "Healthy — good performance, minimal risk" },
              { color: "#f59e0b", label: "Watch — requires monitoring, some risk" },
              { color: "#dc2626", label: "Risk — immediate attention required" },
            ].map(({ color, label }) => (
              <div key={color} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: color }} />
                <span style={{ fontSize: "13px", color: "#4a352f" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default OverallCompanyHealth;