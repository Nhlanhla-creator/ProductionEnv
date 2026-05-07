// components/SolvencyAnalysisIntegrated.jsx
// Inline AI analysis component - displays under KPI cards without full panel

import { useState, useEffect } from "react";
import { useSolvencyAnalysis } from "../hooks/Usesolvencyanalysis";
import "./SolvencyAnalysisIntegrated.css";

/**
 * SolvencyAnalysisIntegrated Component
 * Renders AI analysis directly under KPI cards in a clean card-based layout
 * Maintains design consistency with existing KPI section
 */
const SolvencyAnalysisIntegrated = ({ 
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

  const [hasGenerated, setHasGenerated] = useState(false);
  const [expandedFinding, setExpandedFinding] = useState(null);
  const [expandedRec, setExpandedRec] = useState(null);

  // Auto-generate analysis when component mounts or scoreData changes
  useEffect(() => {
    if (scoreData && isVisible && activeSubTab === "solvency" && !hasGenerated) {
      handleGenerateAnalysis();
      setHasGenerated(true);
    }
  }, [scoreData?.overallScore, activeSubTab]);

  const handleGenerateAnalysis = async () => {
    if (!scoreData) return;

    const result = await generateAnalysis(scoreData, company, "comprehensive");
    
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

  // Loading state
  if (loading) {
    return (
      <div className="solvency-analysis-integrated loading-state">
        <div className="analysis-loader">
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
          <p className="loader-text">🤖 Analyzing financial metrics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="solvency-analysis-integrated error-state">
        <div className="error-box">
          <span className="error-icon">⚠️</span>
          <div className="error-content">
            <p className="error-title">Analysis Generation Failed</p>
            <p className="error-message">{error}</p>
            <button 
              onClick={handleRegenerate}
              className="error-retry-btn"
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
      <div className="solvency-analysis-integrated empty-state">
        <div className="empty-box">
          <span className="empty-icon">📊</span>
          <p className="empty-title">AI Analysis Ready</p>
          <p className="empty-text">Generate intelligent insights about your financial metrics</p>
          <button 
            onClick={handleGenerateAnalysis}
            className="generate-btn"
          >
            Generate Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="solvency-analysis-integrated">
      {/* Header with refresh button */}
      <div className="analysis-header-integrated">
        <div className="header-content">
          <h4 className="analysis-title">
            <span className="ai-badge">🤖 AI Analysis</span>
            Financial Health Assessment
          </h4>
        </div>
        <button
          onClick={handleRegenerate}
          className="refresh-btn-integrated"
          title="Regenerate analysis"
        >
          ↻
        </button>
      </div>

      {/* Overall Assessment */}
      {overallAssessment && (
        <div className="assessment-card">
          <div className="card-header">
            <span className="card-icon">🎯</span>
            <h5>Overall Assessment</h5>
          </div>
          <p className="assessment-text">{overallAssessment}</p>
          <div className="score-display">
            <span className="score-label">Solvency Score</span>
            <div className={`score-badge score-${getScoringTier(scoreData.overallScore)}`}>
              {scoreData.overallScore}
            </div>
            <span className="score-tier">{getScoreTierLabel(scoreData.overallScore)}</span>
          </div>
        </div>
      )}

      {/* Key Findings */}
      {keyFindings.length > 0 && (
        <div className="findings-card">
          <div className="card-header">
            <span className="card-icon">📈</span>
            <h5>Key Findings</h5>
            <span className="card-count">{keyFindings.length}</span>
          </div>
          <div className="findings-list">
            {keyFindings.map((finding, idx) => (
              <div
                key={idx}
                className="finding-item"
                onClick={() => setExpandedFinding(expandedFinding === idx ? null : idx)}
              >
                <div className="finding-header">
                  <span className="finding-num">{idx + 1}</span>
                  <span className="finding-text">{finding}</span>
                  <span className={`toggle-icon ${expandedFinding === idx ? "open" : ""}`}>
                    ▼
                  </span>
                </div>
                {expandedFinding === idx && (
                  <div className="finding-detail">
                    <p>{getDetailedFindingExplanation(finding, scoreData)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="recommendations-card">
          <div className="card-header">
            <span className="card-icon">💡</span>
            <h5>Recommendations</h5>
            <span className="card-count">{recommendations.length}</span>
          </div>
          <div className="recommendations-list">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="rec-item"
                onClick={() => setExpandedRec(expandedRec === idx ? null : idx)}
              >
                <div className="rec-header">
                  <span className="rec-priority">{getPriorityBadge(idx)}</span>
                  <span className="rec-text">{rec}</span>
                  <span className={`toggle-icon ${expandedRec === idx ? "open" : ""}`}>
                    ▼
                  </span>
                </div>
                {expandedRec === idx && (
                  <div className="rec-detail">
                    <p>{getDetailedRecommendationSteps(rec)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ======================== HELPER FUNCTIONS ========================

function getScoringTier(score) {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  if (score >= 30) return "poor";
  return "critical";
}

function getScoreTierLabel(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Poor";
  return "Critical";
}

function getPriorityBadge(index) {
  if (index === 0) return "🔴 High";
  if (index === 1) return "🟡 Medium";
  return "🟢 Low";
}

function getDetailedFindingExplanation(finding, scoreData) {
  if (finding.toLowerCase().includes("debt") || finding.toLowerCase().includes("leverage")) {
    const dte = parseFloat(scoreData.rawMetrics.debtToEquity) || 0;
    return `Your debt-to-equity ratio is ${dte.toFixed(2)}×. Industry benchmarks typically suggest 0.5-1.5×. This metric shows how much debt your business uses relative to owner's equity. Higher ratios indicate more reliance on debt financing.`;
  }

  if (finding.toLowerCase().includes("equity") || finding.toLowerCase().includes("solvency")) {
    const eq = parseFloat(scoreData.rawMetrics.equityRatio) || 0;
    return `Your equity ratio is ${eq.toFixed(2)}%. This represents the percentage of assets financed by shareholder equity rather than debt. Higher equity ratios indicate stronger ownership position and financial stability.`;
  }

  if (finding.toLowerCase().includes("cash") || finding.toLowerCase().includes("liquidity")) {
    const cr = parseFloat(scoreData.rawMetrics.currentRatio) || 0;
    return `Your current ratio is ${cr.toFixed(2)}×. This means you have R${cr.toFixed(2)} in current assets for every Rand of current liabilities. A ratio of 1.5-2.0× is generally considered healthy.`;
  }

  return "This metric indicates the financial health dimension mentioned above. Review the metric card for specific values.";
}

function getDetailedRecommendationSteps(recommendation) {
  if (recommendation.toLowerCase().includes("reduce") && recommendation.toLowerCase().includes("debt")) {
    return `Action steps: 1) Refinance high-interest debt to lower rates 2) Create a debt repayment schedule prioritizing highest-interest obligations 3) Consider asset sales or equity injection to reduce leverage 4) Negotiate better terms with creditors`;
  }

  if (recommendation.toLowerCase().includes("improve") && recommendation.toLowerCase().includes("cash")) {
    return `Action steps: 1) Accelerate accounts receivable collection 2) Negotiate longer payment terms with suppliers 3) Review inventory levels and reduce excess stock 4) Consider a working capital loan to bridge seasonal gaps`;
  }

  if (recommendation.toLowerCase().includes("strengthen") || recommendation.toLowerCase().includes("assets")) {
    return `Action steps: 1) Invest in productive assets that generate revenue 2) Consider asset-backed financing for growth 3) Improve asset utilization and turnover 4) Evaluate and potentially liquidate underperforming assets`;
  }

  return `Review this recommendation with your financial advisor to create a detailed implementation plan tailored to your specific situation and industry context.`;
}

export default SolvencyAnalysisIntegrated;