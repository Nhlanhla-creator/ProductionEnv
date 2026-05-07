// components/PerformanceAnalysisModal.jsx
import { useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { functions } from "../../firebaseConfig";
import "./AnalysisModal.css";

/**
 * PerformanceAnalysisModal - Specific for performance metrics (Revenue, Margins, Profitability)
 * Saves results to Firebase and caches them
 */
const PerformanceAnalysisModal = ({
  isOpen,
  onClose,
  metricTitle,
  metricKey,
  metricValue,
  performanceData,
  currentUser,
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (isOpen && currentUser && metricKey && performanceData) {
      checkAndLoadCachedAnalysis();
    }
  }, [isOpen, currentUser, metricKey, performanceData?.sales]);

  const checkAndLoadCachedAnalysis = async () => {
    if (!currentUser || !metricKey) return;

    setLoading(true);
    
    try {
      const analysisRef = doc(db, "users", currentUser.uid, "performanceAnalyses", metricKey);
      const analysisDoc = await getDoc(analysisRef);
      
      if (analysisDoc.exists()) {
        const data = analysisDoc.data();
        
        // Check if analysis is still relevant
        const currentHash = `${performanceData?.sales}_${performanceData?.grossProfitMargin}_${performanceData?.netProfitMargin}`;
        
        if (data.dataHash === currentHash) {
          console.log(`📦 Using cached performance analysis for ${metricTitle}`);
          setAnalysis({
            overallAssessment: data.overallAssessment,
            keyFindings: data.keyFindings,
            recommendations: data.recommendations,
            metricContext: data.metricContext,
          });
          setCached(true);
          setLastUpdated(data.updatedAt?.toDate?.() || new Date(data.updatedAt));
          setLoading(false);
          return;
        }
      }
      
      console.log(`🆕 Generating fresh performance analysis for ${metricTitle}`);
      await generateAndSaveAnalysis();
      
    } catch (err) {
      console.error("Error checking cache:", err);
      await generateAndSaveAnalysis();
    } finally {
      setLoading(false);
    }
  };

  const generateAndSaveAnalysis = async () => {
    if (!currentUser || !metricKey) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`🤖 Generating performance analysis for: ${metricTitle}`);

      const generatePerformanceAnalysisFn = httpsCallable(
        functions,
        "generatePerformanceAnalysis"
      );

      const result = await generatePerformanceAnalysisFn({
        metricKey: metricKey,
        metricTitle: metricTitle,
        metricValue: metricValue,
        contextMetrics: {
          sales: performanceData?.sales,
          cogs: performanceData?.cogs,
          opex: performanceData?.opex,
          grossProfit: performanceData?.grossProfit,
          grossProfitMargin: performanceData?.grossProfitMargin,
          netProfit: performanceData?.netProfit,
          netProfitMargin: performanceData?.netProfitMargin,
          ebitda: performanceData?.ebitda,
        },
        analysisType: "performance",
      });

      const { data } = result;
      
      const enhancedAnalysis = {
        overallAssessment: data.overallAssessment || generateFallbackAssessment(metricKey, metricValue),
        keyFindings: data.keyFindings || generateFallbackFindings(metricKey, metricValue, performanceData),
        recommendations: data.recommendations || generateFallbackRecommendations(metricKey, metricValue),
        metricContext: {
          title: metricTitle,
          key: metricKey,
          value: metricValue,
          formattedValue: formatMetricValue(metricValue, metricKey),
        },
      };
      
      await saveAnalysisToFirebase(enhancedAnalysis);
      
      console.log(`✅ ${metricTitle} performance analysis generated and saved`);
      setAnalysis(enhancedAnalysis);
      setCached(false);
      setLastUpdated(new Date());

    } catch (err) {
      console.error(`❌ Performance analysis failed for ${metricTitle}:`, err);
      setError(err?.message || "Failed to generate analysis");
      
      const fallbackAnalysis = {
        overallAssessment: generateFallbackAssessment(metricKey, metricValue),
        keyFindings: generateFallbackFindings(metricKey, metricValue, performanceData),
        recommendations: generateFallbackRecommendations(metricKey, metricValue),
        metricContext: {
          title: metricTitle,
          key: metricKey,
          value: metricValue,
          formattedValue: formatMetricValue(metricValue, metricKey),
        },
      };
      
      await saveAnalysisToFirebase(fallbackAnalysis);
      setAnalysis(fallbackAnalysis);
      
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysisToFirebase = async (analysisData) => {
    if (!currentUser || !metricKey) return;

    try {
      const analysisRef = doc(db, "users", currentUser.uid, "performanceAnalyses", metricKey);
      
      const dataHash = `${performanceData?.sales}_${performanceData?.grossProfitMargin}_${performanceData?.netProfitMargin}`;
      
      await setDoc(analysisRef, {
        metricKey: metricKey,
        metricTitle: metricTitle,
        overallAssessment: analysisData.overallAssessment,
        keyFindings: analysisData.keyFindings,
        recommendations: analysisData.recommendations,
        metricContext: analysisData.metricContext,
        dataHash: dataHash,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
      
      console.log(`💾 Saved ${metricTitle} performance analysis to Firebase`);
      
    } catch (err) {
      console.error("Error saving performance analysis:", err);
    }
  };

  const handleRegenerate = async () => {
    if (currentUser && metricKey) {
      try {
        const analysisRef = doc(db, "users", currentUser.uid, "performanceAnalyses", metricKey);
        await setDoc(analysisRef, { forceRegenerate: true }, { merge: true });
      } catch (err) {
        console.error("Error clearing cache:", err);
      }
    }
    await generateAndSaveAnalysis();
  };

  if (!isOpen) return null;

  return (
    <div className="analysis-modal-overlay" onClick={onClose}>
      <div className="analysis-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-ai-badge">🤖 AI Analysis</span>
            <h2>{metricTitle}</h2>
            <div className="metric-value-badge">
              Current Value: <strong>{formatMetricValue(metricValue, metricKey)}</strong>
            </div>
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

        <div className="modal-content">
          {loading && (
            <div className="modal-loading">
              <div className="loader">
                <div className="loader-dot"></div>
                <div className="loader-dot"></div>
                <div className="loader-dot"></div>
              </div>
              <p>Analyzing {metricTitle.toLowerCase()}...</p>
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
              {analysis.overallAssessment && (
                <div className="modal-section assessment-section">
                  <div className="section-header">
                    <span className="section-icon">🎯</span>
                    <h3>What This Means</h3>
                  </div>
                  <div className="assessment-body">
                    <p className="assessment-text">{analysis.overallAssessment}</p>
                    <div className={`metric-highlight ${getScoreClass(metricValue, metricKey)}`}>
                      <div className="highlight-label">{metricTitle}</div>
                      <div className="highlight-value">
                        {formatMetricValue(metricValue, metricKey)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {analysis.keyFindings && analysis.keyFindings.length > 0 && (
                <div className="modal-section findings-section">
                  <div className="section-header">
                    <span className="section-icon">📈</span>
                    <h3>Key Insights</h3>
                    <span className="item-count">{analysis.keyFindings.length}</span>
                  </div>
                  <div className="findings-container">
                    {analysis.keyFindings.map((finding, idx) => (
                      <div key={idx} className="finding-item">
                        <div className="finding-header">
                          <span className="finding-number">{idx + 1}</span>
                          <span className="finding-title">{finding}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="modal-section recommendations-section">
                  <div className="section-header">
                    <span className="section-icon">💡</span>
                    <h3>Recommendations</h3>
                    <span className="item-count">{analysis.recommendations.length}</span>
                  </div>
                  <div className="recommendations-list">
                    {analysis.recommendations.map((rec, idx) => (
                      <div key={idx} className="rec-item">
                        <div className="rec-header">
                          <span className={`rec-priority ${getPriorityClass(idx)}`}>
                            {getPriorityIcon(idx)} {getPriorityLabel(idx)}
                          </span>
                          <span className="rec-title">{rec}</span>
                        </div>
                      </div>
                    ))}
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

function formatMetricValue(value, metricKey) {
  const num = parseFloat(value);
  if (isNaN(num)) return "N/A";
  
  switch(metricKey) {
    case "gpMargin":
    case "npMargin":
      return `${num.toFixed(1)}%`;
    case "sales":
    case "cogs":
    case "opex":
    case "grossProfit":
    case "netProfit":
    case "ebitda":
    case "ebit":
      if (Math.abs(num) >= 1000) return `R${(num / 1000).toFixed(2)}B`;
      if (Math.abs(num) >= 1) return `R${num.toFixed(2)}M`;
      return `R${(num * 1000).toFixed(2)}K`;
    default:
      return num.toString();
  }
}

function getScoreClass(value, metricKey) {
  const num = parseFloat(value);
  if (isNaN(num)) return "neutral";
  
  const thresholds = {
    gpMargin: { excellent: 60, good: 40, poor: 20 },
    npMargin: { excellent: 20, good: 10, poor: 5 },
    sales: { excellent: 100, good: 50, poor: 10 },
    grossProfit: { excellent: 50, good: 20, poor: 5 },
    netProfit: { excellent: 20, good: 5, poor: 0 },
  };
  
  const t = thresholds[metricKey];
  if (!t) return "neutral";
  
  if (num >= t.excellent) return "excellent";
  if (num >= t.good) return "good";
  if (num <= t.poor) return "poor";
  return "warning";
}

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

// Fallback analysis generators
function generateFallbackAssessment(metricKey, value) {
  const num = parseFloat(value);
  const formatted = formatMetricValue(num, metricKey);
  
  const assessments = {
    sales: num < 10 ? `⚠️ Revenue of ${formatted} is low. Focus on customer acquisition and sales growth.` :
           num < 50 ? `📊 Revenue of ${formatted} shows moderate performance. Accelerate growth strategies.` :
           `✅ Strong revenue of ${formatted}. Maintain momentum while improving efficiency.`,
    
    gpMargin: num < 20 ? `⚠️ Gross margin of ${formatted}% is concerning. Review pricing and production costs.` :
               num < 40 ? `📊 Gross margin of ${formatted}% is acceptable but has room for improvement.` :
               `✅ Excellent gross margin of ${formatted}%. Maintain pricing power and cost discipline.`,
    
    npMargin: num < 5 ? `⚠️ Net margin of ${formatted}% is thin. Focus on cost control and operational efficiency.` :
               num < 10 ? `📊 Net margin of ${formatted}% is reasonable. Look for optimization opportunities.` :
               `✅ Strong net margin of ${formatted}%. Excellent profitability and operational efficiency.`,
    
    cogs: num > 50 ? `⚠️ COGS of ${formatted} is high relative to revenue. Review supplier contracts and production efficiency.` :
           `📊 COGS of ${formatted} requires regular monitoring for optimization.`,
    
    opex: num > 30 ? `⚠️ Operating expenses of ${formatted} are high. Review discretionary spending.` :
           `📊 Operating expenses of ${formatted} are within reasonable range.`,
  };
  
  return assessments[metricKey] || `Analysis of ${metricKey}: Current value is ${formatted}.`;
}

function generateFallbackFindings(metricKey, value, performanceData) {
  const num = parseFloat(value);
  
  const findings = {
    sales: [
      `Revenue of ${formatMetricValue(num, metricKey)} is the primary driver of business value.`,
      `Compare to previous periods to identify growth trends.`,
      performanceData?.gpMargin ? `At current gross margin of ${performanceData.gpMargin}%, each R1 of revenue generates R${(performanceData.gpMargin / 100).toFixed(2)} in gross profit.` : "",
    ].filter(Boolean),
    
    gpMargin: [
      `Gross profit margin of ${num}% measures production efficiency and pricing power.`,
      num < 20 ? "Low margins suggest pricing pressure or high production costs." :
      num < 40 ? "Margins are healthy but there's room for optimization." :
      "Excellent margins indicate strong competitive advantage.",
    ],
    
    npMargin: [
      `Net profit margin of ${num}% shows overall operational efficiency.`,
      num < 5 ? "Thin margins require tight cost control and volume growth." :
      "Healthy margins provide reinvestment capacity and shareholder returns.",
    ],
    
    cogs: [
      `Cost of Goods Sold at ${formatMetricValue(num, metricKey)} represents direct production costs.`,
      `COGS ratio to revenue: ${performanceData?.sales ? ((num / performanceData.sales) * 100).toFixed(1) : 'N/A'}%`,
    ],
  };
  
  return findings[metricKey] || [`Current ${metricKey}: ${formatMetricValue(num, metricKey)}`];
}

function generateFallbackRecommendations(metricKey, value) {
  const num = parseFloat(value);
  
  const recommendations = {
    sales: num < 50 ? [
      "Increase customer acquisition efforts through targeted marketing",
      "Expand product/service offerings for existing customers",
      "Review pricing strategy to maximize revenue per customer",
    ] : [
      "Maintain sales momentum with consistent execution",
      "Explore adjacent markets for expansion opportunities",
      "Optimize sales funnel conversion rates",
    ],
    
    gpMargin: num < 30 ? [
      "Renegotiate supplier contracts for better pricing",
      "Review production processes for efficiency gains",
      "Consider value-based pricing adjustments",
    ] : [
      "Maintain margin discipline while scaling",
      "Monitor competitive pricing pressures",
      "Invest in automation for margin expansion",
    ],
    
    npMargin: num < 10 ? [
      "Conduct detailed expense audit to identify savings",
      "Automate manual processes to reduce labor costs",
      "Focus on higher-margin products/services",
    ] : [
      "Optimize tax strategy for after-tax margin improvement",
      "Consider strategic investments for long-term growth",
      "Return value to shareholders through dividends or buybacks",
    ],
    
    cogs: num > 30 ? [
      "Negotiate volume discounts with key suppliers",
      "Implement inventory management system",
      "Explore alternative sourcing options",
    ] : [
      "Maintain cost discipline while scaling",
      "Monitor commodity price fluctuations",
      "Lock in favorable supplier contracts",
    ],
    
    opex: num > 25 ? [
      "Review all discretionary spending for cuts",
      "Implement remote work to reduce office costs",
      "Automate routine tasks to reduce headcount needs",
    ] : [
      "Maintain lean operating structure",
      "Invest in efficiency tools for scale",
      "Benchmark against industry peers",
    ],
  };
  
  return recommendations[metricKey] || [
    "Track this metric monthly against targets",
    "Compare to industry benchmarks",
    "Review with management team quarterly",
  ];
}

export default PerformanceAnalysisModal;