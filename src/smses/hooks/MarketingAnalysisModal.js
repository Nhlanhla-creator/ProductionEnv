// hooks/MarketingAnalysisModal.jsx

import { useState, useEffect } from "react";
import { useMarketingSalesAnalysis } from "./useMarketingSalesAnalysis";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "./AnalysisModal.css";

const MarketingAnalysisModal = ({
  isOpen,
  onClose,
  kpiTitle,
  kpiKey,
  kpiValue,
  contextData = {},
  company = {},
  currentUser,
  section = "general",
}) => {
  const {
    analysis,
    loading,
    error,
    generateAnalysis,
    clearAnalysis,
    refreshSectionCache,
  } = useMarketingSalesAnalysis(currentUser, section);

  const [hasGenerated, setHasGenerated] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && !hasGenerated && kpiTitle) {
      handleGenerateAnalysis(false);
      setHasGenerated(true);
    }
  }, [isOpen, kpiTitle]);

  const handleGenerateAnalysis = async (forceRegenerate = false) => {
    if (forceRegenerate) {
      setIsRegenerating(true);
    }

    const result = await generateAnalysis(
      kpiTitle,
      kpiKey,
      kpiValue,
      contextData,
      company,
      forceRegenerate
    );

    if (result) {
      console.log("✅ Marketing analysis generated/loaded");
    }

    if (forceRegenerate) {
      setIsRegenerating(false);
    }
  };

  const handleRegenerate = () => {
    clearAnalysis();
    setHasGenerated(false);
    handleGenerateAnalysis(true);
  };

  const handleSaveToNotes = async () => {
    if (!currentUser || !analysis) {
      console.error("Cannot save: no user or analysis");
      return;
    }
    
    setIsSaving(true);
    try {
      // Sanitize analysis data to remove undefined values
      const sanitizedAnalysis = {
        overallAssessment: analysis.overallAssessment || "",
        healthScore: analysis.healthScore || 50,
        keyInsights: Array.isArray(analysis.keyInsights) ? analysis.keyInsights : [],
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
        benchmarkComparison: analysis.benchmarkComparison || {},
        fullResponse: analysis.fullResponse || analysis.analysisText || "",
      };
      
      // Sanitize context data
      const sanitizedContextData = {
        budget: contextData.budget ?? null,
        target: contextData.target ?? null,
        timeRange: contextData.timeRange ?? null,
        kpiValue: kpiValue ?? null,
      };
      
      // Remove undefined values
      Object.keys(sanitizedContextData).forEach(key => {
        if (sanitizedContextData[key] === undefined) {
          delete sanitizedContextData[key];
        }
      });
      
      const savedAnalysisRef = doc(
        db, 
        `users/${currentUser.uid}/savedAnalyses`, 
        `${section}_${kpiKey}_${Date.now()}`
      );
      
      await setDoc(savedAnalysisRef, {
        section,
        kpiKey,
        kpiTitle,
        kpiValue: kpiValue ?? null,
        analysis: sanitizedAnalysis,
        contextData: sanitizedContextData,
        company: {
          name: company.name || "Your Business",
          stage: company.stage || "Growth",
        },
        savedAt: new Date().toISOString(),
        notes: "",
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving analysis:", error);
      alert("Failed to save analysis: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const formatValue = (val, kpiKeyParam) => {
    if (val === undefined || val === null) return "0";
    if (kpiKeyParam?.includes("Rate") || kpiKeyParam?.includes("ROI") || kpiKeyParam === "coverage") {
      return `${val?.toFixed(1) || 0}%`;
    }
    if (kpiKeyParam === "salesVelocity") {
      return `${val?.toFixed(0) || 0} days`;
    }
    if (kpiKeyParam?.includes("Value") || kpiKeyParam?.includes("Spend") || kpiKeyParam?.includes("Revenue")) {
      return `R${(val || 0).toLocaleString()}`;
    }
    return val?.toFixed(1) || "0";
  };

  const getStatusColor = (score) => {
    if (!score) return "#FF9800";
    if (score >= 85) return "#4CAF50";
    if (score >= 70) return "#2196F3";
    if (score >= 50) return "#FF9800";
    return "#F44336";
  };

  const getCacheInfo = () => {
    if (analysis?.cachedAt) {
      const generatedDate = new Date(analysis.cachedAt);
      const now = new Date();
      const daysOld = Math.floor((now - generatedDate) / (1000 * 60 * 60 * 24));
      return { daysOld, generatedAt: analysis.cachedAt };
    }
    return null;
  };

  const cacheInfo = getCacheInfo();

  return (
    <div className="analysis-modal-overlay" onClick={onClose}>
      <div className="analysis-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="analysis-modal-header">
          <div className="analysis-modal-title">
            <span className="ai-badge">🤖 AI Analysis</span>
            <h2>{kpiTitle}</h2>
          </div>
          <button className="analysis-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Cache Info Banner */}
        {cacheInfo && analysis && !loading && !isRegenerating && (
          <div className="cache-info-banner">
            <span className="cache-icon">💾</span>
            <span className="cache-text">
              Analysis from {new Date(cacheInfo.generatedAt).toLocaleDateString()}
              {cacheInfo.daysOld > 0 && ` (${cacheInfo.daysOld} days old)`}
            </span>
            <button onClick={handleRegenerate} className="cache-refresh-btn">
              New Analysis
            </button>
          </div>
        )}

        {/* Current Value Display */}
        <div className="analysis-current-value">
          <div className="current-value-label">Current Value</div>
          <div className="current-value-number">{formatValue(kpiValue, kpiKey)}</div>
          {contextData.budget !== undefined && contextData.budget !== null && (
            <div className="current-value-budget">
              Budget: {formatValue(contextData.budget, kpiKey)}
            </div>
          )}
          {contextData.target !== undefined && contextData.target !== null && (
            <div className="current-value-target">
              Target: {formatValue(contextData.target, kpiKey)}
            </div>
          )}
        </div>

        {/* Loading State */}
        {(loading || isRegenerating) && (
          <div className="analysis-loading">
            <div className="loading-spinner"></div>
            <p>{isRegenerating ? "Generating fresh analysis..." : `Loading analysis...`}</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && !isRegenerating && (
          <div className="analysis-error">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <h4>Analysis Failed</h4>
              <p>{error}</p>
              <button onClick={handleRegenerate} className="error-retry-button">
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Analysis Content */}
        {!loading && !isRegenerating && !error && analysis && (
          <div className="analysis-content">
            {/* Overall Assessment */}
            {analysis.overallAssessment && (
              <div className="analysis-section assessment-section">
                <div className="section-header">
                  <span className="section-icon">📊</span>
                  <h3>Overall Assessment</h3>
                </div>
                <div className="assessment-text">
                  <p>{analysis.overallAssessment}</p>
                </div>
                {analysis.healthScore && (
                  <div className="health-score">
                    <div
                      className="health-score-bar"
                      style={{
                        width: `${analysis.healthScore}%`,
                        backgroundColor: getStatusColor(analysis.healthScore)
                      }}
                    />
                    <span className="health-score-label">
                      Health Score: {analysis.healthScore}/100
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Key Insights */}
            {analysis.keyInsights && analysis.keyInsights.length > 0 && (
              <div className="analysis-section insights-section">
                <div className="section-header">
                  <span className="section-icon">💡</span>
                  <h3>Key Insights</h3>
                  <span className="insight-count">{analysis.keyInsights.length}</span>
                </div>
                <div className="insights-list">
                  {analysis.keyInsights.map((insight, idx) => (
                    <div key={idx} className="insight-card">
                      <div className="insight-icon">
                        {insight.type === "positive" ? "✅" : insight.type === "warning" ? "⚠️" : "ℹ️"}
                      </div>
                      <div className="insight-content">
                        <p>{insight.message}</p>
                        {insight.detail && (
                          <small className="insight-detail">{insight.detail}</small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="analysis-section recommendations-section">
                <div className="section-header">
                  <span className="section-icon">🎯</span>
                  <h3>Recommendations</h3>
                  <span className="rec-count">{analysis.recommendations.length}</span>
                </div>
                <div className="recommendations-list">
                  {analysis.recommendations.map((rec, idx) => (
                    <div key={idx} className="recommendation-card">
                      <div className="rec-priority">
                        {rec.priority === "high" ? "🔴 High" :
                          rec.priority === "medium" ? "🟡 Medium" : "🟢 Low"}
                      </div>
                      <div className="rec-content">
                        <p className="rec-title">{rec.title}</p>
                        <p className="rec-description">{rec.description}</p>
                        {rec.actionItems && (
                          <ul className="rec-actions">
                            {rec.actionItems.map((action, aidx) => (
                              <li key={aidx}>{action}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Benchmark Comparison */}
            {analysis.benchmarkComparison && (
              <div className="analysis-section benchmark-section">
                <div className="section-header">
                  <span className="section-icon">📈</span>
                  <h3>Industry Benchmark</h3>
                </div>
                <div className="benchmark-content">
                  <div className="benchmark-item">
                    <span className="benchmark-label">Your Value:</span>
                    <span className="benchmark-value">{formatValue(kpiValue, kpiKey)}</span>
                  </div>
                  <div className="benchmark-item">
                    <span className="benchmark-label">Industry Avg:</span>
                    <span className="benchmark-value">
                      {formatValue(analysis.benchmarkComparison.industryAverage, kpiKey)}
                    </span>
                  </div>
                  <div className="benchmark-item">
                    <span className="benchmark-label">Percentile:</span>
                    <span className="benchmark-value">
                      Top {analysis.benchmarkComparison.percentile}%
                    </span>
                  </div>
                  <div className="benchmark-gap">
                    <div
                      className="benchmark-gap-bar"
                      style={{ width: `${Math.min(100, Math.abs(analysis.benchmarkComparison.gapPercentage || 0))}%` }}
                    />
                    <span>
                      {analysis.benchmarkComparison.gapPercentage > 0
                        ? `${analysis.benchmarkComparison.gapPercentage.toFixed(1)}% above average`
                        : `${Math.abs(analysis.benchmarkComparison.gapPercentage || 0).toFixed(1)}% below average`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer with Action Buttons */}
            <div className="analysis-footer">
              <div className="footer-buttons">
                <button 
                  onClick={handleRegenerate} 
                  className="regenerate-button" 
                  disabled={isRegenerating}
                >
                  {isRegenerating ? "⟳ Generating..." : "↻ New Analysis"}
                </button>
                <button 
                  onClick={handleSaveToNotes} 
                  className="save-analysis-button"
                  disabled={isSaving || !analysis}
                >
                  {isSaving ? "💾 Saving..." : saveSuccess ? "✓ Saved!" : "📌 Save Analysis"}
                </button>
              </div>
              <details className="raw-analysis-toggle">
                <summary>View Full AI Response</summary>
                <pre className="raw-response">{analysis.fullResponse || analysis.analysisText || "No response text available"}</pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingAnalysisModal;