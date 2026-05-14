// components/SolvencyAnalysisPanel.jsx
// AI-powered financial analysis component with sophisticated design

import { useState, useEffect } from "react";
import { useSolvencyAnalysis } from "./Usesolvencyanalysis";
import "./SolvencyAnalysisPanel.css";

/**
 * SolvencyAnalysisPanel Component
 * Displays AI-generated financial analysis with key findings and recommendations
 * Seamlessly integrates with solvency scoring system
 */
const SolvencyAnalysisPanel = ({ 
  scoreData, 
  company = {}, 
  activeSubTab = "solvency",
  isVisible = true 
}) => {
  const {
    analysis,
    overallAssessment,
    keyFindings,
    recommendations,
    loading,
    error,
    generateAnalysis,
    clearAnalysis,
  } = useSolvencyAnalysis();

  const [expandedFindings, setExpandedFindings] = useState(null);
  const [expandedRecs, setExpandedRecs] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  /**
   * Auto-generate analysis when scoreData changes or subtab switches
   */
  useEffect(() => {
    if (scoreData && isVisible && activeSubTab === "solvency" && !hasGenerated) {
      handleGenerateAnalysis();
      setHasGenerated(true);
    }
  }, [scoreData?.overallScore, activeSubTab]);

  const handleGenerateAnalysis = async () => {
    if (!scoreData) return;

    const analysisType = activeSubTab === "leverage" 
      ? "leverage" 
      : activeSubTab === "solvency"
      ? "solvency"
      : "comprehensive";

    const result = await generateAnalysis(scoreData, company, analysisType);
    
    if (result) {
      console.log("✅ Analysis ready for display");
    }
  };

  const handleRegenerate = async () => {
    clearAnalysis();
    setHasGenerated(false);
    await handleGenerateAnalysis();
  };

  if (!isVisible || !scoreData) return null;

  // Loading state with animated skeleton
  if (loading) {
    return (
      <div className="solvency-analysis-panel loading">
        <div className="analysis-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-content">
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
          </div>
          <div className="skeleton-findings">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-finding">
                <div className="skeleton-dot"></div>
                <div className="skeleton-text"></div>
              </div>
            ))}
          </div>
        </div>
        <p className="analysis-loading-text">🤖 Analyzing financial metrics...</p>
      </div>
    );
  }

  // Error state with retry option
  if (error) {
    return (
      <div className="solvency-analysis-panel error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h4>Analysis Generation Failed</h4>
            <p className="error-message">{error}</p>
            <button 
              onClick={handleRegenerate}
              className="error-retry-button"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!analysis && !hasGenerated) {
    return (
      <div className="solvency-analysis-panel empty">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h4>AI Analysis Ready</h4>
          <p>Generate intelligent insights about your financial metrics</p>
          <button 
            onClick={handleGenerateAnalysis}
            className="generate-button"
          >
            Generate Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="solvency-analysis-panel">
      {/* Header with title and controls */}
      <div className="analysis-header">
        <div className="header-title">
          <span className="ai-badge">🤖 AI Analysis</span>
          <h3>Financial Health Assessment</h3>
        </div>
        <button
          onClick={handleRegenerate}
          className="refresh-button"
          title="Regenerate analysis"
        >
          ↻
        </button>
      </div>

      {/* Overall Assessment Section */}
      {overallAssessment && (
        <div className="assessment-section">
          <div className="section-header">
            <span className="section-icon">🎯</span>
            <h4>Overall Assessment</h4>
          </div>
          <div className="assessment-content">
            <p className="assessment-text">{overallAssessment}</p>
            <div className="score-indicator">
              <div className="score-label">Solvency Score</div>
              <div className={`score-value score-${getScoringTier(scoreData.overallScore)}`}>
                {scoreData.overallScore}
              </div>
              <div className="score-tier">{getScoreTierLabel(scoreData.overallScore)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Key Findings Section */}
      {keyFindings.length > 0 && (
        <div className="findings-section">
          <div className="section-header">
            <span className="section-icon">📈</span>
            <h4>Key Findings</h4>
            <span className="finding-count">{keyFindings.length}</span>
          </div>
          <div className="findings-list">
            {keyFindings.map((finding, idx) => (
              <div
                key={idx}
                className="finding-card"
                onClick={() => setExpandedFindings(expandedFindings === idx ? null : idx)}
                role="button"
                tabIndex={0}
              >
                <div className="finding-header">
                  <span className="finding-number">{idx + 1}</span>
                  <span className="finding-text">{finding}</span>
                  <span className={`finding-toggle ${expandedFindings === idx ? "expanded" : ""}`}>
                    ▼
                  </span>
                </div>
                {expandedFindings === idx && (
                  <div className="finding-detail">
                    <p>{getDetailedFindingExplanation(finding, scoreData)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="recommendations-section">
          <div className="section-header">
            <span className="section-icon">💡</span>
            <h4>Recommendations</h4>
            <span className="rec-count">{recommendations.length}</span>
          </div>
          <div className="recommendations-list">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="recommendation-card"
                onClick={() => setExpandedRecs(expandedRecs === idx ? null : idx)}
                role="button"
                tabIndex={0}
              >
                <div className="rec-header">
                  <span className="rec-priority">{getPriorityBadge(idx)}</span>
                  <span className="rec-text">{rec}</span>
                  <span className={`rec-toggle ${expandedRecs === idx ? "expanded" : ""}`}>
                    ▼
                  </span>
                </div>
                {expandedRecs === idx && (
                  <div className="rec-detail">
                    <p>{getDetailedRecommendationSteps(rec)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Analysis Toggle (Debug) */}
      <div className="analysis-footer">
        <details className="raw-analysis-toggle">
          <summary>View Full AI Response</summary>
          <div className="raw-analysis-content">
            <pre>{analysis}</pre>
          </div>
        </details>
      </div>
    </div>
  );
};

/**
 * Helper: Get scoring tier for color coding
 */
function getScoringTier(score) {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  if (score >= 30) return "poor";
  return "critical";
}

/**
 * Helper: Get readable tier label
 */
function getScoreTierLabel(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Poor";
  return "Critical";
}

/**
 * Helper: Get priority badge for recommendations
 */
function getPriorityBadge(index) {
  if (index === 0) return "🔴 High";
  if (index === 1) return "🟡 Medium";
  return "🟢 Low";
}

/**
 * Helper: Provide expanded explanation for findings
 */
function getDetailedFindingExplanation(finding, scoreData) {
  // Match findings to specific metrics and provide context
  if (finding.toLowerCase().includes("debt") || finding.toLowerCase().includes("leverage")) {
    const dte = parseFloat(scoreData.rawMetrics.debtToEquity) || 0;
    return `Your debt-to-equity ratio is ${dte.toFixed(2)}×. Industry benchmarks typically suggest 0.5-1.5×. 
This metric shows how much debt your business uses relative to owner's equity. Higher ratios indicate more reliance 
on debt financing.`;
  }

  if (finding.toLowerCase().includes("equity") || finding.toLowerCase().includes("solvency")) {
    const eq = parseFloat(scoreData.rawMetrics.equityRatio) || 0;
    return `Your equity ratio is ${eq.toFixed(2)}%. This represents the percentage of assets financed by shareholder 
equity rather than debt. Higher equity ratios indicate stronger ownership position and financial stability.`;
  }

  if (finding.toLowerCase().includes("cash") || finding.toLowerCase().includes("liquidity")) {
    const cr = parseFloat(scoreData.rawMetrics.currentRatio) || 0;
    return `Your current ratio is ${cr.toFixed(2)}×. This means you have R${cr.toFixed(2)} in current assets for every 
Rand of current liabilities. A ratio of 1.5-2.0× is generally considered healthy.`;
  }

  return "This metric indicates the financial health dimension mentioned above. Review the metric card for specific values.";
}

/**
 * Helper: Provide implementation steps for recommendations
 */
function getDetailedRecommendationSteps(recommendation) {
  if (recommendation.toLowerCase().includes("reduce") && recommendation.toLowerCase().includes("debt")) {
    return `Action steps:
1. Refinance high-interest debt to lower rates
2. Create a debt repayment schedule prioritizing highest-interest obligations
3. Consider asset sales or equity injection to reduce leverage
4. Negotiate better terms with creditors`;
  }

  if (recommendation.toLowerCase().includes("improve") && recommendation.toLowerCase().includes("cash")) {
    return `Action steps:
1. Accelerate accounts receivable collection
2. Negotiate longer payment terms with suppliers
3. Review inventory levels and reduce excess stock
4. Consider a working capital loan to bridge seasonal gaps`;
  }

  if (recommendation.toLowerCase().includes("strengthen") || recommendation.toLowerCase().includes("assets")) {
    return `Action steps:
1. Invest in productive assets that generate revenue
2. Consider asset-backed financing for growth
3. Improve asset utilization and turnover
4. Evaluate and potentially liquidate underperforming assets`;
  }

  return `Review this recommendation with your financial advisor to create a detailed implementation plan tailored to your 
specific situation and industry context.`;
}

export default SolvencyAnalysisPanel;