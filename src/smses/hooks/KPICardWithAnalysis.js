// components/KPICardWithAnalysis.jsx
// Enhanced KPI Card that displays AI analysis directly underneath

import { useState, useEffect } from "react";
import { useSolvencyAnalysis } from "./Usesolvencyanalysis";
import "./KPICardWithAnalysis.css";

/**
 * KPICardWithAnalysis Component
 * Extends existing KPICard with integrated AI analysis for specific metric
 * 
 * @param {string} title - Metric title
 * @param {Array|number} data - Metric data
 * @param {string} kpiKey - Key identifier for the metric
 * @param {boolean} isPercentage - Is this a percentage metric
 * @param {string} fieldPath - Path to field in solvency data
 * @param {Object} scoreData - Full solvency score breakdown
 * @param {Object} company - Company context
 */
const KPICardWithAnalysis = ({
  title,
  data,
  kpiKey,
  isPercentage = false,
  fieldPath = null,
  scoreData = null,
  company = {},
  onEyeClick,
  onAddNotes,
  onAnalysis,
  onTrend,
  notes,
  formatValue,
  unitLabel,
  formatCircleValue,
}) => {
  const { generateAnalysis, loading, error, analysis } = useSolvencyAnalysis();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [metricAnalysis, setMetricAnalysis] = useState("");
  const [hasGeneratedAnalysis, setHasGeneratedAnalysis] = useState(false);

  const snapshotMonthIndex = data?.length ? data.length - 1 : 0;
  const rawValue = parseFloat(data?.[snapshotMonthIndex]) || 0;

  /**
   * Generate analysis for this specific metric
   */
  const handleGenerateAnalysis = async () => {
    if (!scoreData) return;

    setShowAnalysis(true);

    if (!hasGeneratedAnalysis) {
      // Generate metric-specific analysis
      const metricSpecificPrompt = buildMetricPrompt(kpiKey, rawValue, scoreData);
      
      // For now, use the general analysis but filter for this metric
      const result = await generateAnalysis(
        scoreData,
        company,
        "comprehensive"
      );

      if (result && result.analysis) {
        // Extract analysis relevant to this metric from the full response
        const filtered = extractMetricAnalysis(kpiKey, result.analysis);
        setMetricAnalysis(filtered || result.analysis);
      }

      setHasGeneratedAnalysis(true);
    }
  };

  /**
   * Build metric-specific analysis prompt
   */
  function buildMetricPrompt(key, value, data) {
    const metricContext = {
      nav: {
        name: "Net Asset Value",
        explanation: `The company has a NAV of R${value}m. This represents total assets minus liabilities.`,
        benchmark: "Should be positive and growing",
      },
      equityRatio: {
        name: "Equity Ratio",
        explanation: `The equity ratio is ${value}%. This means ${value}% of assets are financed by shareholders.`,
        benchmark: "Higher is better. Typically 50%+ is healthy",
      },
      debtToEquity: {
        name: "Debt-to-Equity Ratio",
        explanation: `The D/E ratio is ${value}×. For every Rand of equity, the company has R${value} in debt.`,
        benchmark: "1.0× is ideal. Below 1.5× is generally healthy",
      },
      debtToAssets: {
        name: "Debt-to-Assets Ratio",
        explanation: `The D/A ratio is ${value}×. This shows debt as a percentage of total assets.`,
        benchmark: "Below 0.6× is considered healthy",
      },
      interestCoverage: {
        name: "Interest Coverage Ratio",
        explanation: `The company can cover its interest expenses ${value}× over with operating income.`,
        benchmark: "Above 2.5× indicates good debt service capacity",
      },
      currentRatio: {
        name: "Current Ratio",
        explanation: `The current ratio is ${value}×. The company has R${value} in current assets for every Rand of liabilities.`,
        benchmark: "1.5-2.0× is healthy; below 1.0× is a red flag",
      },
      quickRatio: {
        name: "Quick Ratio",
        explanation: `The quick ratio is ${value}×. This is current ratio minus inventory.`,
        benchmark: "Above 1.0× is healthy; shows strong liquid position",
      },
    };

    const context = metricContext[key];
    if (!context) return null;

    return `
Analyze the "${context.name}" metric for this company:

Current Value: ${value}
Explanation: ${context.explanation}
Industry Benchmark: ${context.benchmark}

Provide a brief (2-3 sentences) assessment of what this metric means for the company's financial health.
Focus on: What is this metric telling us? Is it healthy? What should the company do about it?
`;
  }

  /**
   * Extract metric-specific analysis from full response
   */
  function extractMetricAnalysis(key, fullAnalysis) {
    const metricKeywords = {
      nav: ["net asset value", "nav", "total assets", "net worth"],
      equityRatio: ["equity ratio", "ownership", "shareholder equity", "asset coverage"],
      debtToEquity: ["debt-to-equity", "leverage", "d/e ratio", "debt ratio"],
      debtToAssets: ["debt-to-assets", "asset coverage", "d/a ratio"],
      interestCoverage: ["interest coverage", "debt service", "ebit", "interest expense"],
      currentRatio: ["current ratio", "current assets", "current liabilities", "short-term"],
      quickRatio: ["quick ratio", "liquid assets", "working capital"],
    };

    const keywords = metricKeywords[key] || [];
    const sentences = fullAnalysis.split(/[.!?]+/).filter(s => s.trim());

    // Find sentences that mention the metric
    const relevantSentences = sentences.filter(sentence =>
      keywords.some(keyword => sentence.toLowerCase().includes(keyword))
    );

    if (relevantSentences.length > 0) {
      return relevantSentences.slice(0, 2).join(". ") + ".";
    }

    return null;
  }

  return (
    <div className="kpi-card-with-analysis">
      {/* Original KPI Card */}
      <div className="kpi-card">
        <div className="kpi-header">
          <h4 className="kpi-title">{title}</h4>
          <button className="kpi-info-btn" onClick={onEyeClick} title="View calculation">
            ⓘ
          </button>
        </div>

        <div className="kpi-circles">
          <div className="kpi-circle actual">
            <div className="circle-value">{formatCircleValue(rawValue)}</div>
            <div className="circle-label">Actual</div>
          </div>
          <div className="kpi-circle budget">
            <div className="circle-value">0.00</div>
            <div className="circle-label">Budget</div>
          </div>
          <div className="kpi-circle variance">
            <div className="circle-value">0.0%</div>
            <div className="circle-label">Variance</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="kpi-actions">
          <button
            className="action-btn notes-btn"
            onClick={() => onAddNotes && onAddNotes("")}
            title="Add notes"
          >
            Notes
          </button>
          <button
            className={`action-btn analysis-btn ${showAnalysis ? "active" : ""}`}
            onClick={handleGenerateAnalysis}
            title="Generate AI analysis"
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analysis"}
          </button>
          <button
            className="action-btn trend-btn"
            onClick={onTrend}
            title="View trend"
          >
            Trend
          </button>
        </div>
      </div>

      {/* AI Analysis Section */}
      {showAnalysis && (
        <div className={`kpi-analysis-section ${loading ? "loading" : ""}`}>
          {loading ? (
            <div className="analysis-loading">
              <div className="loader"></div>
              <p>🤖 Analyzing {title}...</p>
            </div>
          ) : error ? (
            <div className="analysis-error">
              <p>⚠️ {error}</p>
              <button
                onClick={handleGenerateAnalysis}
                className="retry-btn"
              >
                Try Again
              </button>
            </div>
          ) : metricAnalysis ? (
            <div className="analysis-content">
              <div className="analysis-header">
                <span className="ai-badge">🤖 AI Insight</span>
              </div>
              <p className="analysis-text">{metricAnalysis}</p>
              
              {/* Context Box */}
              <div className="analysis-context">
                <h5>What This Means</h5>
                <p>{getMetricContext(kpiKey, rawValue)}</p>
              </div>

              {/* Action Items */}
              <div className="analysis-actions">
                <p className="action-label">💡 Next Steps:</p>
                <ul className="action-list">
                  {getActionItems(kpiKey).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="analysis-empty">
              <p>No analysis available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Get contextual explanation for metric
 */
function getMetricContext(key, value) {
  const contexts = {
    nav: `A Net Asset Value of R${value}m represents the company's net worth. This is critical for long-term solvency.`,
    equityRatio: `An equity ratio of ${value}% means shareholders own ${value}% of assets. Higher percentages indicate stronger financial independence.`,
    debtToEquity: `A D/E ratio of ${value}× means the company uses debt equal to ${value} times its equity. Lower ratios indicate less leverage.`,
    debtToAssets: `A D/A ratio of ${value}× shows debt represents ${(value * 100).toFixed(1)}% of total assets.`,
    interestCoverage: `The company can cover interest ${value}× over. Higher coverage means lower default risk.`,
    currentRatio: `With a current ratio of ${value}×, the company has R${value} in liquid assets per Rand of short-term debt.`,
    quickRatio: `A quick ratio of ${value}× shows strong immediate liquidity (excluding inventory).`,
  };

  return contexts[key] || "This metric shows the company's financial position.";
}

/**
 * Get actionable next steps for metric
 */
function getActionItems(key) {
  const actions = {
    nav: [
      "Monitor monthly changes in NAV",
      "Focus on growing assets faster than liabilities",
      "Consider equity injection if NAV is declining",
    ],
    equityRatio: [
      "Aim for equity ratio above 50%",
      "Consider raising capital if below 40%",
      "Balance equity with debt for optimal capital structure",
    ],
    debtToEquity: [
      "Target a D/E ratio around 1.0×",
      "Refinance high-interest debt",
      "Consider paying down debt to improve ratio",
    ],
    debtToAssets: [
      "Keep below 0.6× for healthy position",
      "Monitor covenant compliance",
      "Evaluate debt restructuring options",
    ],
    interestCoverage: [
      "Maintain above 2.5× for safety",
      "Increase EBIT through operational improvements",
      "Refinance if coverage is below 2.0×",
    ],
    currentRatio: [
      "Maintain between 1.5-2.0×",
      "Optimize working capital management",
      "Accelerate receivables collection if low",
    ],
    quickRatio: [
      "Ensure above 1.0× for safety",
      "Reduce inventory if ratio is low",
      "Build cash reserves for stability",
    ],
  };

  return actions[key] || ["Review metric regularly", "Track changes over time"];
}

export default KPICardWithAnalysis;