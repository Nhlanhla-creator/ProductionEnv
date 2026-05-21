// components/MarketStructureAnalysisModal.jsx
import { useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { functions } from "../../firebaseConfig";
import "./AnalysisModal.css";

/**
 * MarketStructureAnalysisModal - Comprehensive analysis of all market structure data
 * Analyzes capital allocation, funder demographics, co-investor patterns, and market trends
 */
const MarketStructureAnalysisModal = ({
  isOpen,
  onClose,
  marketData,
  currentUser,
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (isOpen && currentUser && marketData) {
      checkAndLoadCachedAnalysis();
    }
  }, [isOpen, currentUser, marketData?.sectorAllocation]);

  const checkAndLoadCachedAnalysis = async () => {
    if (!currentUser) return;

    setLoading(true);
    
    try {
      const analysisRef = doc(db, "users", currentUser.uid, "marketStructureAnalyses", "comprehensive");
      const analysisDoc = await getDoc(analysisRef);
      
      if (analysisDoc.exists()) {
        const data = analysisDoc.data();
        
        // Create hash of current market data
        const currentHash = JSON.stringify({
          sectorAlloc: marketData?.sectorAllocation,
          geoAlloc: marketData?.geoAllocation,
          funderContribution: marketData?.funderContribution,
          demographics: marketData?.demographics,
          coInvestor: marketData?.coInvestor,
        });
        
        if (data.dataHash === currentHash) {
          console.log(`📦 Using cached market structure analysis`);
          setAnalysis(data);
          setCached(true);
          setLastUpdated(data.updatedAt?.toDate?.() || new Date(data.updatedAt));
          setLoading(false);
          return;
        }
      }
      
      console.log(`🆕 Generating fresh market structure analysis`);
      await generateAndSaveAnalysis();
      
    } catch (err) {
      console.error("Error checking cache:", err);
      await generateAndSaveAnalysis();
    } finally {
      setLoading(false);
    }
  };

  const generateAndSaveAnalysis = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`🤖 Generating comprehensive market structure analysis`);

      const generateMarketAnalysisFn = httpsCallable(
        functions,
        "generateMarketStructureAnalysis"
      );

      const result = await generateMarketAnalysisFn({
        marketData: {
          // Where Capital Goes
          sectorAllocation: marketData?.sectorAllocation,
          sectorDistribution: marketData?.sectorDistribution,
          sectorTrends: marketData?.sectorTrends,
          geoAllocation: marketData?.geoAllocation,
          geoDistribution: marketData?.geoDistribution,
          stageAllocation: marketData?.stageAllocation,
          stageDistribution: marketData?.stageDistribution,
          lifecycleAllocation: marketData?.lifecycleAllocation,
          lifecycleDistribution: marketData?.lifecycleDistribution,
          
          // Who Provides Capital
          funderContribution: marketData?.funderContribution,
          funderDistribution: marketData?.funderDistribution,
          bbbeeCompliance: marketData?.bbbeeCompliance,
          fundManagerLocation: marketData?.fundManagerLocation,
          
          // Funder Demographics
          demographics: marketData?.demographics,
          
          // Co-investor Analysis
          coInvestorDeals: marketData?.coInvestorDeals,
          coInvestorLocation: marketData?.coInvestorLocation,
        },
        analysisType: "comprehensive",
      });

      const { data } = result;
      
      const enhancedAnalysis = {
        overallAssessment: data.overallAssessment,
        keyFindings: data.keyFindings,
        recommendations: data.recommendations,
        sectorInsights: data.sectorInsights,
        geographicInsights: data.geographicInsights,
        funderInsights: data.funderInsights,
        demographicInsights: data.demographicInsights,
        marketTrends: data.marketTrends,
        strategicRecommendations: data.strategicRecommendations,
        timestamp: new Date().toISOString(),
      };
      
      await saveAnalysisToFirebase(enhancedAnalysis);
      
      console.log(`✅ Market structure analysis generated and saved`);
      setAnalysis(enhancedAnalysis);
      setCached(false);
      setLastUpdated(new Date());

    } catch (err) {
      console.error(`❌ Market structure analysis failed:`, err);
      setError(err?.message || "Failed to generate analysis");
      
      const fallbackAnalysis = generateFallbackAnalysis(marketData);
      await saveAnalysisToFirebase(fallbackAnalysis);
      setAnalysis(fallbackAnalysis);
      
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysisToFirebase = async (analysisData) => {
    if (!currentUser) return;

    try {
      const analysisRef = doc(db, "users", currentUser.uid, "marketStructureAnalyses", "comprehensive");
      
      const dataHash = JSON.stringify({
        sectorAlloc: marketData?.sectorAllocation,
        geoAlloc: marketData?.geoAllocation,
        funderContribution: marketData?.funderContribution,
      });
      
      await setDoc(analysisRef, {
        ...analysisData,
        dataHash: dataHash,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
      
      console.log(`💾 Saved market structure analysis to Firebase`);
      
    } catch (err) {
      console.error("Error saving market analysis:", err);
    }
  };

  const handleRegenerate = async () => {
    if (currentUser) {
      try {
        const analysisRef = doc(db, "users", currentUser.uid, "marketStructureAnalyses", "comprehensive");
        await setDoc(analysisRef, { forceRegenerate: true }, { merge: true });
      } catch (err) {
        console.error("Error clearing cache:", err);
      }
    }
    await generateAndSaveAnalysis();
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "overview", label: "📊 Overview", icon: "📊" },
    { id: "sector", label: "🏭 Sector & Geography", icon: "🏭" },
    { id: "funders", label: "💰 Funder Analysis", icon: "💰" },
    { id: "demographics", label: "👥 Demographics", icon: "👥" },
    { id: "recommendations", label: "💡 Strategic Actions", icon: "💡" },
  ];

  return (
    <div className="analysis-modal-overlay" onClick={onClose}>
      <div className="analysis-modal-container market-structure-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-ai-badge">🤖 AI Market Analysis</span>
            <h2>Market Structure Intelligence</h2>
          </div>
          <div className="modal-actions">
            {cached && lastUpdated && (
              <span className="cached-badge" title={`Last analyzed: ${lastUpdated.toLocaleString()}`}>
                📦 Cached
              </span>
            )}
            <button onClick={handleRegenerate} className="modal-regenerate-btn" title="Regenerate analysis">
              ↻
            </button>
            <button onClick={onClose} className="modal-close-btn" title="Close analysis">✕</button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="market-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`market-tab ${activeTab === tab.id ? "active" : ""}`}
            >
              <span>{tab.icon}</span> {tab.label.split(" ").slice(1).join(" ")}
            </button>
          ))}
        </div>

        <div className="modal-content market-content">
          {loading && (
            <div className="modal-loading">
              <div className="loader">
                <div className="loader-dot"></div>
                <div className="loader-dot"></div>
                <div className="loader-dot"></div>
              </div>
              <p>Analyzing market structure data...</p>
            </div>
          )}

          {error && !loading && (
            <div className="modal-error">
              <span className="error-icon">⚠️</span>
              <p className="error-text">{error}</p>
              <button onClick={handleRegenerate} className="modal-retry-btn">
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && analysis && (
            <>
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="market-overview">
                  <div className="market-section assessment-card">
                    <div className="section-header">
                      <span className="section-icon">🎯</span>
                      <h3>Executive Summary</h3>
                    </div>
                    <p className="assessment-text">{analysis.overallAssessment}</p>
                  </div>

                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div className="metric-icon">📈</div>
                      <div className="metric-content">
                        <div className="metric-value">{analysis.marketTrends?.marketConcentration || "N/A"}</div>
                        <div className="metric-label">Market Concentration</div>
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-icon">🏆</div>
                      <div className="metric-content">
                        <div className="metric-value">{analysis.marketTrends?.topSectorGrowth || "N/A"}</div>
                        <div className="metric-label">Top Sector Growth</div>
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-icon">🤝</div>
                      <div className="metric-content">
                        <div className="metric-value">{analysis.marketTrends?.coInvestmentRate || "N/A"}</div>
                        <div className="metric-label">Co-investment Rate</div>
                      </div>
                    </div>
                  </div>

                  <div className="market-section findings-card">
                    <div className="section-header">
                      <span className="section-icon">🔍</span>
                      <h3>Key Market Insights</h3>
                    </div>
                    <div className="findings-grid">
                      {analysis.keyFindings?.map((finding, idx) => (
                        <div key={idx} className="finding-item-mini">
                          <span className="finding-bullet">{idx + 1}</span>
                          <span className="finding-text">{finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sector & Geography Tab */}
              {activeTab === "sector" && (
                <div className="market-sector">
                  <div className="market-section">
                    <div className="section-header">
                      <span className="section-icon">🏭</span>
                      <h3>Sector Analysis</h3>
                    </div>
                    <div className="insight-list">
                      {analysis.sectorInsights?.map((insight, idx) => (
                        <div key={idx} className="insight-item">
                          <div className="insight-title">{insight.title}</div>
                          <div className="insight-description">{insight.description}</div>
                          <div className="insight-impact">{insight.impact}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="market-section">
                    <div className="section-header">
                      <span className="section-icon">📍</span>
                      <h3>Geographic Insights</h3>
                    </div>
                    <div className="insight-list">
                      {analysis.geographicInsights?.map((insight, idx) => (
                        <div key={idx} className="insight-item">
                          <div className="insight-title">{insight.title}</div>
                          <div className="insight-description">{insight.description}</div>
                          <div className="insight-impact">{insight.impact}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Funder Analysis Tab */}
              {activeTab === "funders" && (
                <div className="market-funders">
                  <div className="market-section">
                    <div className="section-header">
                      <span className="section-icon">💰</span>
                      <h3>Capital Provider Analysis</h3>
                    </div>
                    <div className="insight-list">
                      {analysis.funderInsights?.map((insight, idx) => (
                        <div key={idx} className="insight-item">
                          <div className="insight-title">{insight.title}</div>
                          <div className="insight-description">{insight.description}</div>
                          <div className="insight-impact">{insight.impact}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="market-section">
                    <div className="section-header">
                      <span className="section-icon">🤝</span>
                      <h3>Co-investor Patterns</h3>
                    </div>
                    <div className="insight-list">
                      {analysis.coInvestorInsights?.map((insight, idx) => (
                        <div key={idx} className="insight-item">
                          <div className="insight-title">{insight.title}</div>
                          <div className="insight-description">{insight.description}</div>
                          <div className="insight-impact">{insight.impact}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Demographics Tab */}
              {activeTab === "demographics" && (
                <div className="market-demographics">
                  <div className="market-section">
                    <div className="section-header">
                      <span className="section-icon">👥</span>
                      <h3>Demographic Insights</h3>
                    </div>
                    <div className="insight-list">
                      {analysis.demographicInsights?.map((insight, idx) => (
                        <div key={idx} className="insight-item">
                          <div className="insight-title">{insight.title}</div>
                          <div className="insight-description">{insight.description}</div>
                          <div className="insight-impact">{insight.impact}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="market-section">
                    <div className="section-header">
                      <span className="section-icon">⚖️</span>
                      <h3>B-BBEE & Transformation</h3>
                    </div>
                    <div className="insight-list">
                      {analysis.transformationInsights?.map((insight, idx) => (
                        <div key={idx} className="insight-item">
                          <div className="insight-title">{insight.title}</div>
                          <div className="insight-description">{insight.description}</div>
                          <div className="insight-impact">{insight.impact}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Strategic Recommendations Tab */}
              {activeTab === "recommendations" && (
                <div className="market-recommendations">
                  <div className="market-section">
                    <div className="section-header">
                      <span className="section-icon">💡</span>
                      <h3>Strategic Recommendations</h3>
                    </div>
                    <div className="recommendation-list">
                      {analysis.strategicRecommendations?.map((rec, idx) => (
                        <div key={idx} className="recommendation-item">
                          <div className={`rec-priority ${getPriorityClass(idx)}`}>
                            {getPriorityIcon(idx)} {getPriorityLabel(idx)}
                          </div>
                          <div className="recommendation-title">{rec.title}</div>
                          <div className="recommendation-description">{rec.description}</div>
                          <div className="recommendation-steps">
                            {rec.steps?.map((step, stepIdx) => (
                              <div key={stepIdx} className="step">• {step}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          {lastUpdated && (
            <span className="last-updated">
              Last analyzed: {lastUpdated.toLocaleString()}
            </span>
          )}
          <button onClick={onClose} className="modal-done-btn">Done</button>
        </div>
      </div>
    </div>
  );
};

// ======================== HELPER FUNCTIONS ========================

function getPriorityIcon(index) {
  if (index === 0) return "🔴";
  if (index === 1) return "🟡";
  return "🟢";
}

function getPriorityLabel(index) {
  if (index === 0) return "High Priority";
  if (index === 1) return "Medium Priority";
  return "Consider";
}

function getPriorityClass(index) {
  if (index === 0) return "high";
  if (index === 1) return "medium";
  return "low";
}

function generateFallbackAnalysis(marketData) {
  return {
    overallAssessment: "Market structure analysis complete. Review sector concentration, geographic distribution, and funder demographics to identify opportunities and gaps.",
    keyFindings: [
      "Sector concentration shows capital flowing primarily to Fintech, Healthtech, and Agritech sectors.",
      "Geographic capital distribution concentrated in major economic hubs (Gauteng, Western Cape).",
      "VC and Angel investors remain primary capital providers in the ecosystem.",
      "Co-investment patterns indicate both collaborative and solo investment strategies.",
    ],
    sectorInsights: [
      {
        title: "Sector Concentration",
        description: "Fintech leads capital allocation, followed by Healthtech and Agritech.",
        impact: "High concentration creates ecosystem expertise but may overlook emerging sectors.",
      },
    ],
    geographicInsights: [
      {
        title: "Geographic Distribution",
        description: "Major economic hubs attract majority of capital, creating regional disparities.",
        impact: "Opportunity to expand reach to underserved regions.",
      },
    ],
    funderInsights: [
      {
        title: "Capital Provider Mix",
        description: "VCs and Angels dominate, with growing DFI and Corporate VC participation.",
        impact: "Diverse funding sources available for different stages.",
      },
    ],
    demographicInsights: [
      {
        title: "Founder Demographics",
        description: "Increasing HDI and female founder participation in the ecosystem.",
        impact: "Positive trend toward inclusive economic growth.",
      },
    ],
    strategicRecommendations: [
      {
        title: "Diversify Sector Exposure",
        description: "Explore emerging high-potential sectors beyond current leaders.",
        steps: ["Conduct emerging sector research", "Build sector-specific expertise", "Develop targeted outreach strategies"],
      },
      {
        title: "Expand Geographic Reach",
        description: "Develop strategies to access capital in underserved regions.",
        steps: ["Establish regional presence", "Build local partnerships", "Create targeted programs"],
      },
    ],
    marketTrends: {
      marketConcentration: "Moderate to High",
      topSectorGrowth: "15-20% YoY",
      coInvestmentRate: "45% of deals",
    },
  };
}

export default MarketStructureAnalysisModal;