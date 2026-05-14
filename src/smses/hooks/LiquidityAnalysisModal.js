// components/LiquidityAnalysisModal.jsx
import { useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { functions } from "../../firebaseConfig";
import "./AnalysisModal.css";

/**
 * LiquidityAnalysisModal - Specific for liquidity metrics
 * Saves results to Firebase and caches them
 */
const LiquidityAnalysisModal = ({
  isOpen,
  onClose,
  metricTitle,
  metricKey,
  metricValue,
  liquidityData,
  currentUser,
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (isOpen && currentUser && metricKey && liquidityData) {
      checkAndLoadCachedAnalysis();
    }
  }, [isOpen, currentUser, metricKey, liquidityData?.cashBalance]);

  const checkAndLoadCachedAnalysis = async () => {
    if (!currentUser || !metricKey) return;

    setLoading(true);
    
    try {
      const analysisRef = doc(db, "users", currentUser.uid, "liquidityAnalyses", metricKey);
      const analysisDoc = await getDoc(analysisRef);
      
      if (analysisDoc.exists()) {
        const data = analysisDoc.data();
        
        // Check if analysis is still relevant
        const currentHash = `${liquidityData?.currentRatio}_${liquidityData?.burnRate}_${liquidityData?.cashBalance}`;
        
        if (data.dataHash === currentHash) {
          console.log(`📦 Using cached liquidity analysis for ${metricTitle}`);
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
      
      console.log(`🆕 Generating fresh liquidity analysis for ${metricTitle}`);
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
      console.log(`🤖 Generating liquidity analysis for: ${metricTitle}`);

      const generateLiquidityAnalysisFn = httpsCallable(
        functions,
        "generateLiquidityAnalysis"
      );

      const result = await generateLiquidityAnalysisFn({
        metricKey: metricKey,
        metricTitle: metricTitle,
        metricValue: metricValue,
        contextMetrics: {
          currentRatio: liquidityData?.currentRatio,
          quickRatio: liquidityData?.quickRatio,
          burnRate: liquidityData?.burnRate,
          cashCover: liquidityData?.cashCover,
          monthsRunway: liquidityData?.monthsRunway,
          cashflow: liquidityData?.cashflow,
          cashBalance: liquidityData?.cashBalance,
          workingCapital: liquidityData?.workingCapital,
        },
        analysisType: "liquidity",
      });

      const { data } = result;
      
      const enhancedAnalysis = {
        overallAssessment: data.overallAssessment || generateFallbackAssessment(metricKey, metricValue),
        keyFindings: data.keyFindings || generateFallbackFindings(metricKey, metricValue, liquidityData),
        recommendations: data.recommendations || generateFallbackRecommendations(metricKey, metricValue),
        metricContext: {
          title: metricTitle,
          key: metricKey,
          value: metricValue,
          formattedValue: formatMetricValue(metricValue, metricKey),
        },
      };
      
      await saveAnalysisToFirebase(enhancedAnalysis);
      
      console.log(`✅ ${metricTitle} liquidity analysis generated and saved`);
      setAnalysis(enhancedAnalysis);
      setCached(false);
      setLastUpdated(new Date());

    } catch (err) {
      console.error(`❌ Liquidity analysis failed for ${metricTitle}:`, err);
      setError(err?.message || "Failed to generate analysis");
      
      const fallbackAnalysis = {
        overallAssessment: generateFallbackAssessment(metricKey, metricValue),
        keyFindings: generateFallbackFindings(metricKey, metricValue, liquidityData),
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
      const analysisRef = doc(db, "users", currentUser.uid, "liquidityAnalyses", metricKey);
      
      const dataHash = `${liquidityData?.currentRatio}_${liquidityData?.burnRate}_${liquidityData?.cashBalance}`;
      
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
      
      console.log(`💾 Saved ${metricTitle} liquidity analysis to Firebase`);
      
    } catch (err) {
      console.error("Error saving liquidity analysis:", err);
    }
  };

  const handleRegenerate = async () => {
    if (currentUser && metricKey) {
      try {
        const analysisRef = doc(db, "users", currentUser.uid, "liquidityAnalyses", metricKey);
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
    case "currentRatio":
    case "quickRatio":
    case "cashRatio":
      return `${num.toFixed(2)}×`;
    case "cashCover":
    case "monthsRunway":
      return `${num.toFixed(1)} months`;
    case "burnRate":
    case "cashflow":
    case "cashBalance":
    case "workingCapital":
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
    currentRatio: { good: 2, warning: 1.5, poor: 1 },
    quickRatio: { good: 1, warning: 0.8, poor: 0.5 },
    cashRatio: { good: 0.5, warning: 0.3, poor: 0.1 },
    monthsRunway: { good: 12, warning: 6, poor: 3 },
    burnRate: { good: -5, warning: 5, poor: 10, reverse: true },
  };
  
  const t = thresholds[metricKey];
  if (!t) return "neutral";
  
  if (t.reverse) {
    if (num <= t.good) return "excellent";
    if (num >= t.poor) return "poor";
    return "warning";
  } else {
    if (num >= t.good) return "excellent";
    if (num <= t.poor) return "poor";
    return "warning";
  }
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
    currentRatio: num < 1 ? `⚠️ Critical: Current Ratio of ${formatted} indicates you cannot cover short-term obligations. Immediate action required.` :
                   num < 1.5 ? `📊 Your Current Ratio of ${formatted} is below the recommended 2:1. Monitor carefully.` :
                   num < 2 ? `📊 Your Current Ratio of ${formatted} is approaching the healthy benchmark of 2:1.` :
                   `✅ Strong Current Ratio of ${formatted} indicates excellent short-term liquidity.`,
    quickRatio: num < 0.5 ? `⚠️ Critical: Quick Ratio of ${formatted} shows severe liquidity constraints.` :
                num < 0.8 ? `📊 Your Quick Ratio of ${formatted} suggests limited liquid assets after inventory.` :
                `✅ Healthy Quick Ratio of ${formatted} shows good ability to meet immediate obligations.`,
    monthsRunway: num < 3 ? `⚠️ Critical: Only ${formatted} of runway remaining. Immediate capital needed.` :
                  num < 6 ? `📊 Limited runway of ${formatted}. Start fundraising or cutting costs now.` :
                  num < 12 ? `📊 Adequate runway of ${formatted}. Good time to plan next funding round.` :
                  `✅ Strong runway of ${formatted} provides stability and negotiating power.`,
    burnRate: num < 0 ? `✅ Positive cash flow with burn rate of ${formatted} - excellent!` :
              num < 5 ? `📊 Moderate burn of ${formatted}M/month. Monitor sustainability.` :
              `⚠️ High burn rate of ${formatted}M/month. Review cost structure urgently.`,
  };
  
  return assessments[metricKey] || `Analysis of ${metricKey}: Current value is ${formatted}.`;
}

function generateFallbackFindings(metricKey, value, liquidityData) {
  const num = parseFloat(value);
  
  const findings = {
    currentRatio: [
      `Current Ratio of ${formatMetricValue(num, metricKey)} measures ability to pay short-term debts.`,
      num < 1 ? "You cannot cover current liabilities with current assets." :
      num < 1.5 ? "Working capital needs improvement for safety buffer." :
      "Strong liquidity position provides operational flexibility.",
    ],
    burnRate: [
      `Monthly burn rate of ${formatMetricValue(num, metricKey)}.`,
      num < 0 ? "Business is generating positive cash flow - sustainable growth possible." :
      `At current burn rate, you have ${liquidityData?.monthsRunway || '?'} months of runway.`,
    ],
    monthsRunway: [
      `${formatMetricValue(num, metricKey)} of operating funds remaining.`,
      num < 3 ? "Urgent action required to extend runway or raise capital." :
      num < 6 ? "Begin cost reduction or fundraising conversations now." :
      "Adequate time to execute strategic initiatives.",
    ],
  };
  
  return findings[metricKey] || [`Current ${metricKey}: ${formatMetricValue(num, metricKey)}`];
}

function generateFallbackRecommendations(metricKey, value) {
  const num = parseFloat(value);
  
  const recommendations = {
    currentRatio: num < 1 ? [
      "Immediately negotiate extended payment terms with suppliers",
      "Accelerate accounts receivable collection aggressively",
      "Consider short-term working capital facility",
    ] : num < 1.5 ? [
      "Review inventory levels and convert to cash",
      "Improve collection processes for receivables",
      "Build cash reserves for safety buffer",
    ] : [
      "Maintain strong liquidity position",
      "Use excess cash for strategic opportunities",
      "Monitor ratio quarterly for trends",
    ],
    burnRate: num > 0 ? [
      "Identify top 3 cost drivers for immediate reduction",
      "Review discretionary spending and marketing ROI",
      "Accelerate revenue-generating initiatives",
    ] : [
      "Maintain positive cash flow discipline",
      "Reinvest surplus cash strategically",
      "Build cash reserves for opportunities",
    ],
    monthsRunway: num < 3 ? [
      "Immediate cost reduction and hiring freeze",
      "Accelerate fundraising or revenue generation",
      "Consider bridge financing options",
    ] : num < 6 ? [
      "Implement cost optimization measures now",
      "Start fundraising conversations early",
      "Focus on highest ROI activities",
    ] : [
      "Use runway for strategic growth initiatives",
      "Build relationships with multiple funding sources",
      "Maintain disciplined cash management",
    ],
  };
  
  return recommendations[metricKey] || [
    "Track this metric monthly against targets",
    "Compare to industry benchmarks",
    "Review with financial advisor quarterly",
  ];
}

export default LiquidityAnalysisModal;