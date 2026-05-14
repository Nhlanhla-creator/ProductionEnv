// components/AnalysisModal.jsx
import { useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { functions } from "../../firebaseConfig";
import "./AnalysisModal.css";

/**
 * AnalysisModal Component - Saves results to Firebase and caches them
 */
const AnalysisModal = ({
  isOpen,
  onClose,
  kpiTitle,
  kpiKey,
  kpiValue,
  scoreData,
  company = {},
  currentUser, // Add this prop
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Check cache when modal opens
  useEffect(() => {
    if (isOpen && currentUser && kpiKey && scoreData) {
      checkAndLoadCachedAnalysis();
    }
  }, [isOpen, currentUser, kpiKey, scoreData?.overallScore]);

  const checkAndLoadCachedAnalysis = async () => {
    if (!currentUser || !kpiKey) return;

    setLoading(true);
    
    try {
      // Check if analysis exists in Firebase
      const analysisRef = doc(db, "users", currentUser.uid, "metricAnalyses", kpiKey);
      const analysisDoc = await getDoc(analysisRef);
      
      if (analysisDoc.exists()) {
        const data = analysisDoc.data();
        
        // Check if analysis is still relevant (based on scoreData version)
        const currentScoreHash = `${scoreData?.overallScore}_${scoreData?.rawMetrics?.equityRatio}_${scoreData?.rawMetrics?.debtToEquity}`;
        
        if (data.scoreHash === currentScoreHash) {
          // Use cached analysis
          console.log(`📦 Using cached analysis for ${kpiTitle}`);
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
      
      // No cache or outdated - generate new analysis
      console.log(`🆕 Generating fresh analysis for ${kpiTitle}`);
      await generateAndSaveAnalysis();
      
    } catch (err) {
      console.error("Error checking cache:", err);
      // Still try to generate
      await generateAndSaveAnalysis();
    } finally {
      setLoading(false);
    }
  };

  const generateAndSaveAnalysis = async () => {
    if (!currentUser || !scoreData || !kpiKey) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`🤖 Generating analysis for section: ${kpiTitle} (${kpiKey})`);

      // Use the existing generateSolvencyAnalysis function
      const generateSolvencyAnalysisFn = httpsCallable(
        functions,
        "generateSolvencyAnalysis"
      );

      // Build focused prompt
      const result = await generateSolvencyAnalysisFn({
        metrics: scoreData.breakdown || {},
        breakdown: scoreData.breakdown || {},
        overallScore: scoreData.overallScore,
        rawMetrics: {
          ...scoreData.rawMetrics,
          focusedMetric: kpiKey,
          focusedMetricTitle: kpiTitle,
          focusedMetricValue: kpiValue,
        },
        company: {
          ...company,
          analysisFocus: kpiTitle,
        },
        analysisType: "focused",
      });

      const { data } = result;
      
      // Parse the response
      const enhancedAnalysis = {
        overallAssessment: data.overallAssessment || generateFallbackAssessment(kpiKey, kpiValue),
        keyFindings: data.keyFindings || generateFallbackFindings(kpiKey, kpiValue),
        recommendations: data.recommendations || generateFallbackRecommendations(kpiKey, kpiValue),
        metricContext: {
          title: kpiTitle,
          key: kpiKey,
          value: kpiValue,
          formattedValue: formatMetricValue(kpiValue, kpiKey),
          score: scoreData.overallScore,
        },
      };
      
      // Save to Firebase
      await saveAnalysisToFirebase(enhancedAnalysis);
      
      console.log(`✅ ${kpiTitle} analysis generated and saved`);
      setAnalysis(enhancedAnalysis);
      setCached(false);
      setLastUpdated(new Date());

    } catch (err) {
      console.error(`❌ Analysis failed for ${kpiTitle}:`, err);
      setError(err?.message || "Failed to generate analysis");
      
      // Fallback to local analysis
      const fallbackAnalysis = {
        overallAssessment: generateFallbackAssessment(kpiKey, kpiValue),
        keyFindings: generateFallbackFindings(kpiKey, kpiValue),
        recommendations: generateFallbackRecommendations(kpiKey, kpiValue),
        metricContext: {
          title: kpiTitle,
          key: kpiKey,
          value: kpiValue,
          formattedValue: formatMetricValue(kpiValue, kpiKey),
        },
      };
      
      // Save fallback to cache too
      await saveAnalysisToFirebase(fallbackAnalysis);
      setAnalysis(fallbackAnalysis);
      
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysisToFirebase = async (analysisData) => {
    if (!currentUser || !kpiKey) return;

    try {
      const analysisRef = doc(db, "users", currentUser.uid, "metricAnalyses", kpiKey);
      
      // Create a hash of current metrics to detect changes
      const scoreHash = `${scoreData?.overallScore}_${scoreData?.rawMetrics?.equityRatio}_${scoreData?.rawMetrics?.debtToEquity}_${scoreData?.rawMetrics?.nav}`;
      
      await setDoc(analysisRef, {
        metricKey: kpiKey,
        metricTitle: kpiTitle,
        overallAssessment: analysisData.overallAssessment,
        keyFindings: analysisData.keyFindings,
        recommendations: analysisData.recommendations,
        metricContext: analysisData.metricContext,
        scoreHash: scoreHash,
        overallScore: scoreData?.overallScore,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
      
      console.log(`💾 Saved ${kpiTitle} analysis to Firebase`);
      
    } catch (err) {
      console.error("Error saving analysis:", err);
    }
  };

  const handleRegenerate = async () => {
    // Force regenerate by deleting cache first
    if (currentUser && kpiKey) {
      try {
        const analysisRef = doc(db, "users", currentUser.uid, "metricAnalyses", kpiKey);
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
            <h2>{kpiTitle}</h2>
            <div className="metric-value-badge">
              Current Value: <strong>{formatMetricValue(kpiValue, kpiKey)}</strong>
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
              <p>Analyzing {kpiTitle.toLowerCase()}...</p>
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
              {/* Overall Assessment */}
              {analysis.overallAssessment && (
                <div className="modal-section assessment-section">
                  <div className="section-header">
                    <span className="section-icon">🎯</span>
                    <h3>What This Means</h3>
                  </div>
                  <div className="assessment-body">
                    <p className="assessment-text">{analysis.overallAssessment}</p>
                    <div className={`metric-highlight ${getScoreClass(kpiValue, kpiKey)}`}>
                      <div className="highlight-label">{kpiTitle}</div>
                      <div className="highlight-value">
                        {formatMetricValue(kpiValue, kpiKey)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Findings */}
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

              {/* Recommendations */}
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
    case "nav":
    case "bookValuePerShare":
      return `R${num.toFixed(2)}M`;
    case "equityRatio":
    case "returnOnEquity":
      return `${num.toFixed(1)}%`;
    case "debtToEquity":
    case "debtToAssets":
    case "interestCoverage":
    case "currentRatio":
    case "quickRatio":
      return `${num.toFixed(2)}×`;
    default:
      return num.toString();
  }
}

function getScoreClass(value, metricKey) {
  const num = parseFloat(value);
  if (isNaN(num)) return "neutral";
  
  const thresholds = {
    nav: { good: 50, poor: 10 },
    equityRatio: { good: 50, poor: 30 },
    debtToEquity: { good: 1, poor: 2, reverse: true },
    debtToAssets: { good: 0.5, poor: 0.7, reverse: true },
    currentRatio: { good: 1.5, poor: 1 },
    quickRatio: { good: 1, poor: 0.5 },
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

// Fallback analysis generators (used when cloud function fails)
function generateFallbackAssessment(metricKey, value) {
  const num = parseFloat(value);
  const formatted = formatMetricValue(num, metricKey);
  
  const assessments = {
    nav: num <= 0 ? `⚠️ Critical: Your Net Asset Value of ${formatted} is negative, meaning liabilities exceed assets. This requires immediate attention.` : 
         num < 10 ? `📊 Your Net Asset Value of ${formatted} provides modest financial cushion. Focus on building equity through retained earnings.` :
         `✅ Strong Net Asset Value of ${formatted} provides excellent financial stability and borrowing capacity.`,
    equityRatio: num < 30 ? `⚠️ Your Equity Ratio of ${formatted} is low, indicating high leverage. Consider equity financing options.` :
                 num < 50 ? `📊 Your Equity Ratio of ${formatted} is moderate. Balance debt and equity for optimal structure.` :
                 `✅ Strong Equity Ratio of ${formatted} shows excellent financial stability.`,
    debtToEquity: num > 2 ? `⚠️ High Debt-to-Equity ratio of ${formatted} indicates aggressive leverage. Focus on debt reduction.` :
                  num > 1.5 ? `📊 Elevated leverage at ${formatted}. Monitor debt servicing capacity closely.` :
                  `✅ Health leverage at ${formatted}. Maintain this balanced approach.`,
    debtToAssets: num > 0.7 ? `⚠️ High debt financing at ${formatted}. Reduce reliance on debt.` :
                  num > 0.5 ? `📊 Moderate debt levels at ${formatted}. Manage carefully.` :
                  `✅ Conservative debt levels at ${formatted}. Strategic debt could boost returns.`,
  };
  
  return assessments[metricKey] || `Analysis of ${metricKey}: Current value is ${formatted}. Track this metric over time.`;
}

function generateFallbackFindings(metricKey, value) {
  const num = parseFloat(value);
  
  const findings = {
    nav: [
      `Net Asset Value of ${formatMetricValue(num, metricKey)} represents owner's equity in the business.`,
      num <= 0 ? "Negative NAV indicates technical insolvency - critical situation." : 
      num < 10 ? "Limited NAV reduces financial flexibility for growth opportunities." :
      "Strong NAV provides collateral options for secured financing.",
    ],
    equityRatio: [
      `${formatMetricValue(num, metricKey)} of assets are equity-financed.`,
      num < 30 ? "High leverage increases financial risk and interest costs." :
      num < 50 ? "Balanced structure but room to reduce debt dependency." :
      "Low leverage provides stability and crisis resilience.",
    ],
    debtToEquity: [
      `Debt-to-Equity ratio of ${formatMetricValue(num, metricKey)} measures financial leverage.`,
      num > 2 ? "Aggressive leverage increases default risk during downturns." :
      num > 1.5 ? "Significant debt reliance requires strong cash flow management." :
      "Prudent leverage appropriate for growth-stage business.",
    ],
    debtToAssets: [
      `${(num * 100).toFixed(1)}% of assets financed by debt.`,
      num > 0.7 ? "High asset leverage limits financial flexibility." :
      num > 0.5 ? "Moderate leverage provides reasonable risk-return balance." :
      "Low leverage preserves borrowing capacity for future needs.",
    ],
  };
  
  return findings[metricKey] || [`Current ${metricKey}: ${formatMetricValue(num, metricKey)}`];
}

function generateFallbackRecommendations(metricKey, value) {
  const num = parseFloat(value);
  
  const recommendations = {
    nav: num <= 0 ? [
      "Immediately restructure liabilities with creditors",
      "Consider equity injection or strategic investment",
      "Evaluate asset sales or monetization opportunities",
    ] : [
      "Use NAV as collateral for expansion financing",
      "Monitor NAV growth quarterly relative to earnings",
      "Consider share buybacks if undervalued",
    ],
    equityRatio: num < 30 ? [
      "Prioritize equity over debt for all new financing",
      "Retain earnings instead of paying dividends",
      "Consider strategic partner investment",
    ] : [
      "Maintain equity ratio above 40% as target",
      "Balance debt and equity for optimal cost of capital",
      "Review quarterly to ensure trend remains positive",
    ],
    debtToEquity: num > 2 ? [
      "Reduce high-interest debt through refinancing",
      "Improve operational cash flow for debt service",
      "Consider debt-to-equity conversion with lenders",
    ] : [
      "Lock in current rates with fixed-rate financing",
      "Maintain disciplined debt management practices",
      "Monitor interest coverage ratio closely",
    ],
    debtToAssets: num > 0.7 ? [
      "Prioritize debt reduction in financial planning",
      "Improve asset efficiency to generate higher returns",
      "Consider sale-leaseback of fixed assets",
    ] : [
      "Maintain current leverage discipline",
      "Use debt strategically for high-ROI projects",
      "Document debt policy with target ranges",
    ],
  };
  
  return recommendations[metricKey] || [
    "Track this metric against industry benchmarks",
    "Review quarterly with financial advisor",
    "Set target ranges for proactive management",
  ];
}

export default AnalysisModal;