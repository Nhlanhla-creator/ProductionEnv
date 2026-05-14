// components/CostAgilityAnalysisModal.jsx
import { useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { functions } from "../../firebaseConfig";
import "./AnalysisModal.css";

/**
 * CostAgilityAnalysisModal - Specific for cost structure metrics
 * Analyzes fixed/variable ratio, discretionary spend, and cost lock-in duration
 */
const CostAgilityAnalysisModal = ({
  isOpen,
  onClose,
  metricTitle,
  metricKey,
  metricValue,
  costData,
  currentUser,
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (isOpen && currentUser && metricKey && costData) {
      checkAndLoadCachedAnalysis();
    }
  }, [isOpen, currentUser, metricKey, costData?.fixedVariableRatio]);

  const checkAndLoadCachedAnalysis = async () => {
    if (!currentUser || !metricKey) return;

    setLoading(true);
    
    try {
      const analysisRef = doc(db, "users", currentUser.uid, "costAgilityAnalyses", metricKey);
      const analysisDoc = await getDoc(analysisRef);
      
      if (analysisDoc.exists()) {
        const data = analysisDoc.data();
        
        // Check if analysis is still relevant
        const currentHash = `${costData?.fixedVariableRatio}_${costData?.discretionaryPercentage}_${costData?.lockInDuration}`;
        
        if (data.dataHash === currentHash) {
          console.log(`📦 Using cached cost agility analysis for ${metricTitle}`);
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
      
      console.log(`🆕 Generating fresh cost agility analysis for ${metricTitle}`);
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
      console.log(`🤖 Generating cost agility analysis for: ${metricTitle}`);

      const generateCostAgilityAnalysisFn = httpsCallable(
        functions,
        "generateCostAgilityAnalysis"
      );

      const result = await generateCostAgilityAnalysisFn({
        metricKey: metricKey,
        metricTitle: metricTitle,
        metricValue: metricValue,
        contextMetrics: {
          fixedVariableRatio: costData?.fixedVariableRatio,
          discretionaryPercentage: costData?.discretionaryPercentage,
          lockInDuration: costData?.lockInDuration,
          fixedCosts: costData?.fixedCosts,
          variableCosts: costData?.variableCosts,
          discretionaryCosts: costData?.discretionaryCosts,
          semiVariableCosts: costData?.semiVariableCosts,
        },
        analysisType: "cost-agility",
      });

      const { data } = result;
      
      const enhancedAnalysis = {
        overallAssessment: data.overallAssessment || generateFallbackAssessment(metricKey, metricValue),
        keyFindings: data.keyFindings || generateFallbackFindings(metricKey, metricValue, costData),
        recommendations: data.recommendations || generateFallbackRecommendations(metricKey, metricValue),
        metricContext: {
          title: metricTitle,
          key: metricKey,
          value: metricValue,
          formattedValue: formatMetricValue(metricValue, metricKey),
        },
      };
      
      await saveAnalysisToFirebase(enhancedAnalysis);
      
      console.log(`✅ ${metricTitle} cost agility analysis generated and saved`);
      setAnalysis(enhancedAnalysis);
      setCached(false);
      setLastUpdated(new Date());

    } catch (err) {
      console.error(`❌ Cost agility analysis failed for ${metricTitle}:`, err);
      setError(err?.message || "Failed to generate analysis");
      
      const fallbackAnalysis = {
        overallAssessment: generateFallbackAssessment(metricKey, metricValue),
        keyFindings: generateFallbackFindings(metricKey, metricValue, costData),
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
      const analysisRef = doc(db, "users", currentUser.uid, "costAgilityAnalyses", metricKey);
      
      const dataHash = `${costData?.fixedVariableRatio}_${costData?.discretionaryPercentage}_${costData?.lockInDuration}`;
      
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
      
      console.log(`💾 Saved ${metricTitle} cost agility analysis to Firebase`);
      
    } catch (err) {
      console.error("Error saving cost agility analysis:", err);
    }
  };

  const handleRegenerate = async () => {
    if (currentUser && metricKey) {
      try {
        const analysisRef = doc(db, "users", currentUser.uid, "costAgilityAnalyses", metricKey);
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
    case "fixedVariableRatio":
    case "discretionaryPercentage":
      return `${num.toFixed(1)}%`;
    case "lockInDuration":
      return `${num.toFixed(1)} months`;
    default:
      return num.toString();
  }
}

function getScoreClass(value, metricKey) {
  const num = parseFloat(value);
  if (isNaN(num)) return "neutral";
  
  const thresholds = {
    fixedVariableRatio: { excellent: 40, good: 60, poor: 80 }, // Lower is better (less fixed)
    discretionaryPercentage: { excellent: 15, good: 25, poor: 40 }, // Higher discretionary = more flexibility
    lockInDuration: { excellent: 3, good: 6, poor: 12 }, // Lower lock-in = more agility
  };
  
  const t = thresholds[metricKey];
  if (!t) return "neutral";
  
  // For these metrics, lower values are better (more agility)
  if (num <= t.excellent) return "excellent";
  if (num <= t.good) return "good";
  if (num >= t.poor) return "poor";
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
    fixedVariableRatio: num > 70 ? `⚠️ Critical: ${formatted} of costs are fixed. Very limited cost flexibility during downturns.` :
                         num > 50 ? `📊 ${formatted} of costs are fixed. Moderate flexibility - consider reducing fixed costs.` :
                         `✅ Excellent: Only ${formatted} of costs are fixed. High cost flexibility provides strong adaptability.`,
    
    discretionaryPercentage: num < 10 ? `⚠️ Very limited discretionary spending (${formatted}). Difficult to cut costs quickly if needed.` :
                              num < 20 ? `📊 Moderate discretionary spending (${formatted}). Some room for cost reduction.` :
                              `✅ Good discretionary spending (${formatted}). Significant ability to reduce costs when needed.`,
    
    lockInDuration: num > 12 ? `⚠️ Critical: Fixed costs locked in for ${formatted}. Very limited agility to restructure costs.` :
                     num > 6 ? `📊 Cost lock-in of ${formatted} provides moderate flexibility. Review contract terms.` :
                     `✅ Excellent: Short lock-in period of ${formatted}. High cost agility and restructuring ability.`,
  };
  
  return assessments[metricKey] || `Analysis of ${metricKey}: Current value is ${formatted}.`;
}

function generateFallbackFindings(metricKey, value, costData) {
  const num = parseFloat(value);
  
  const findings = {
    fixedVariableRatio: [
      `${num}% of total costs are fixed, ` + (100 - num) + `% are variable.`,
      num > 60 ? "High fixed cost structure increases breakeven point and risk during revenue declines." :
      num > 40 ? "Balanced cost structure provides moderate operational flexibility." :
      "Low fixed costs provide excellent adaptability to revenue fluctuations.",
      `During revenue downturns, ${100 - num}% of costs can naturally decrease with volume.`,
    ],
    
    discretionaryPercentage: [
      `${num}% of costs are discretionary (non-essential).`,
      num < 15 ? "Limited discretionary spending makes cost reduction difficult in downturns." :
      "Good discretionary spending provides capacity to cut costs without harming core operations.",
    ],
    
    lockInDuration: [
      `Fixed costs are locked in for ${num} months on average.`,
      num > 9 ? "Long lock-in periods limit ability to restructure costs quickly." :
      num > 4 ? "Moderate lock-in provides some flexibility for cost adjustments." :
      "Short lock-in periods enable rapid cost restructuring when needed.",
    ],
  };
  
  return findings[metricKey] || [`Current ${metricKey}: ${formatMetricValue(num, metricKey)}`];
}

function generateFallbackRecommendations(metricKey, value) {
  const num = parseFloat(value);
  
  const recommendations = {
    fixedVariableRatio: num > 60 ? [
      "Convert fixed costs to variable through outsourcing or contractors",
      "Negotiate flexible payment terms with key suppliers",
      "Use technology to automate and reduce fixed overhead",
      "Consider shared services or co-working to reduce facility costs",
    ] : num > 40 ? [
      "Review fixed contracts annually for renegotiation opportunities",
      "Maintain balance between fixed and variable costs",
      "Build variable cost relationships for scaling flexibility",
    ] : [
      "Maintain excellent cost flexibility",
      "Consider strategic fixed investments for efficiency",
      "Monitor ratio as business scales",
    ],
    
    discretionaryPercentage: num < 15 ? [
      "Identify any unnecessary fixed costs that can become discretionary",
      "Create contingency budget for discretionary spending",
      "Build flexibility into all new contracts",
    ] : num < 30 ? [
      "Maintain discretionary budget for strategic opportunities",
      "Review discretionary ROI quarterly",
      "Document cost-cutting playbook for downturns",
    ] : [
      "Great flexibility maintained. Ensure core operations not underfunded.",
      "Consider reallocating some discretionary to strategic fixed investments",
      "Monitor discretionary effectiveness regularly",
    ],
    
    lockInDuration: num > 9 ? [
      "Renegotiate contracts to add early termination clauses",
      "Avoid new long-term commitments without exit options",
      "Phase out long-term contracts as they expire",
      "Consider month-to-month arrangements where possible",
    ] : num > 5 ? [
      "Review upcoming contract renewals for better terms",
      "Limit new commitments to 6 months or less",
      "Build flexibility into all new vendor agreements",
    ] : [
      "Maintain short lock-in periods for all costs",
      "Use flexibility for strategic advantage",
      "Consider locking in strategic suppliers for rate benefits",
    ],
  };
  
  return recommendations[metricKey] || [
    "Review cost structure quarterly for optimization opportunities",
    "Benchmark against industry peers",
    "Maintain contingency plans for cost reduction",
  ];
}

export default CostAgilityAnalysisModal;