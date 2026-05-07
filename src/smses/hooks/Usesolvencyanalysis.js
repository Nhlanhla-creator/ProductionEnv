// hooks/useSolvencyAnalysis.js
// Manages AI-powered solvency analysis with state management and error handling

import { useState, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebaseConfig";

/**
 * Hook for generating and managing solvency analysis
 * Integrates with Firebase Cloud Functions for OpenAI-powered insights
 */
export const useSolvencyAnalysis = () => {
  const [analysis, setAnalysis] = useState(null);
  const [overallAssessment, setOverallAssessment] = useState("");
  const [keyFindings, setKeyFindings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastAnalyzedScore, setLastAnalyzedScore] = useState(null);

  /**
   * Generate solvency analysis from calculated metrics
   * 
   * @param {Object} scoreData - Full solvency score data from calculateSolvencyScoreWithLiquidity
   * @param {Object} company - Company context (optional)
   * @param {string} analysisType - Type of analysis: 'solvency', 'leverage', 'liquidity', or 'comprehensive'
   */
  const generateAnalysis = useCallback(
    async (scoreData, company = {}, analysisType = "comprehensive") => {
      if (!scoreData) {
        setError("No score data provided");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("🤖 Generating AI analysis for solvency score:", {
          score: scoreData.overallScore,
          analysisType,
        });

        // Prepare payload for Cloud Function
        const payload = {
          metrics: scoreData.breakdown || {},
          breakdown: scoreData.breakdown || {},
          overallScore: scoreData.overallScore,
          rawMetrics: scoreData.rawMetrics || {},
          company: {
            ...company,
            // Add any auto-detected context
          },
          analysisType,
        };

        // Call Cloud Function
        const generateSolvencyAnalysisFn = httpsCallable(
          functions,
          "generateSolvencyAnalysis"
        );

        const result = await generateSolvencyAnalysisFn(payload);
        const { data } = result;

        console.log("✅ Analysis generated successfully:", {
          hasAssessment: !!data.overallAssessment,
          findingsCount: data.keyFindings?.length || 0,
          recsCount: data.recommendations?.length || 0,
        });

        // Update state
        setAnalysis(data.analysis);
        setOverallAssessment(data.overallAssessment);
        setKeyFindings(data.keyFindings || []);
        setRecommendations(data.recommendations || []);
        setLastAnalyzedScore(scoreData.overallScore);

        return {
          analysis: data.analysis,
          overallAssessment: data.overallAssessment,
          keyFindings: data.keyFindings,
          recommendations: data.recommendations,
        };

      } catch (err) {
        console.error("❌ Analysis generation failed:", err);
        const message = err?.message || "Failed to generate analysis";
        setError(message);
        
        // Return null on error but don't crash
        return null;

      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Generate leverage-specific analysis
   */
  const generateLeverageAnalysis = useCallback(
    async (metrics, company = {}) => {
      if (!metrics) {
        setError("No metrics provided");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("📊 Generating leverage analysis...");

        const generateLeverageAnalysisFn = httpsCallable(
          functions,
          "generateLeverageAnalysis"
        );

        const result = await generateLeverageAnalysisFn({
          debtToEquity: parseFloat(metrics.debtToEquity) || 0,
          debtToAssets: parseFloat(metrics.debtToAssets) || 0,
          totalDebt: parseFloat(metrics.totalDebt) || 0,
          totalAssets: parseFloat(metrics.totalAssets) || 0,
          totalEquity: parseFloat(metrics.totalEquity) || 0,
          company,
        });

        setAnalysis(result.data.analysis);
        return result.data.analysis;

      } catch (err) {
        console.error("❌ Leverage analysis failed:", err);
        setError(err?.message || "Failed to generate leverage analysis");
        return null;

      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Clear analysis state
   */
  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setOverallAssessment("");
    setKeyFindings([]);
    setRecommendations([]);
    setError(null);
    setLastAnalyzedScore(null);
  }, []);

  return {
    // State
    analysis,
    overallAssessment,
    keyFindings,
    recommendations,
    loading,
    error,
    lastAnalyzedScore,

    // Methods
    generateAnalysis,
    generateLeverageAnalysis,
    clearAnalysis,
  };
};