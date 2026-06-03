// hooks/useESGAnalysis.js

import { useState, useCallback } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import ESGAnalysisCacheService from "./esgAnalysisCacheService";

export const useESGAnalysis = (currentUser, section = "environmental", subSection = "") => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Generate AI analysis for ESG KPIs with caching
   */
  const generateAnalysis = useCallback(async (
    kpiTitle,
    kpiKey,
    kpiValue,
    contextData = {},
    company = {},
    forceRegenerate = false
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first (unless force regenerate)
      if (!forceRegenerate) {
        const cachedAnalysis = await ESGAnalysisCacheService.loadAnalysis(
          currentUser?.uid,
          section,
          subSection,
          kpiKey,
          { ...contextData, kpiValue }
        );
        
        if (cachedAnalysis) {
          setAnalysis(cachedAnalysis);
          setLoading(false);
          return cachedAnalysis;
        }
      }

      // Generate new analysis
      const functions = getFunctions();
      const analyzeESGKPI = httpsCallable(functions, 'analyzeESGKPI');

      const result = await analyzeESGKPI({
        kpiTitle,
        kpiKey,
        kpiValue,
        section,
        subSection,
        contextData: {
          benchmark: contextData.benchmark,
          timeRange: contextData.timeRange,
          relatedMetrics: contextData.relatedMetrics,
        },
        company: {
          name: company.name || "Your Business",
          stage: company.stage || "Growth",
          industry: company.industry || "General",
        },
        timestamp: new Date().toISOString(),
      });

      const analysisData = result.data;

      // Save to cache
      await ESGAnalysisCacheService.saveAnalysis(
        currentUser?.uid,
        section,
        subSection,
        kpiKey,
        analysisData,
        { ...contextData, kpiValue }
      );

      setAnalysis(analysisData);
      return analysisData;
    } catch (err) {
      console.error("Error generating ESG analysis:", err);
      setError(err.message || "Failed to generate analysis");
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, section, subSection]);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    analysis,
    loading,
    error,
    generateAnalysis,
    clearAnalysis,
  };
};
