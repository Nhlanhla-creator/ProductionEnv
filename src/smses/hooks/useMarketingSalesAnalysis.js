// hooks/useMarketingSalesAnalysis.js

import { useState, useCallback, useEffect } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import AnalysisCacheService from "./analysisCacheService";

export const useMarketingSalesAnalysis = (currentUser, section = "general") => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cachedAnalyses, setCachedAnalyses] = useState({});

  // Load all cached analyses for this section on mount
  useEffect(() => {
    if (currentUser && section) {
      loadAllSectionAnalyses();
    }
  }, [currentUser, section]);

  const loadAllSectionAnalyses = async () => {
    const analyses = await AnalysisCacheService.loadSectionAnalyses(currentUser?.uid, section);
    const analysesMap = {};
    analyses.forEach(item => {
      analysesMap[item.kpiKey] = {
        analysis: item.analysis,
        cachedAt: item.createdAt,
        kpiValue: item.kpiValue,
      };
    });
    setCachedAnalyses(analysesMap);
  };

  /**
   * Generate AI analysis for marketing/sales KPIs with caching
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
        const cachedAnalysis = await AnalysisCacheService.loadAnalysis(
          currentUser?.uid,
          section,
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
      const analyzeMarketingKPI = httpsCallable(functions, 'analyzeMarketingKPIAnalysis');

      const result = await analyzeMarketingKPI({
        kpiTitle,
        kpiKey,
        kpiValue,
        section,
        contextData: {
          budget: contextData.budget,
          target: contextData.target,
          historicalValues: contextData.historicalValues,
          industryBenchmark: contextData.industryBenchmark,
          relatedMetrics: contextData.relatedMetrics,
          timeRange: contextData.timeRange,
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
      await AnalysisCacheService.saveAnalysis(
        currentUser?.uid,
        section,
        kpiKey,
        analysisData,
        { ...contextData, kpiValue }
      );

      // Update local cache
      setCachedAnalyses(prev => ({
        ...prev,
        [kpiKey]: {
          analysis: analysisData,
          cachedAt: new Date().toISOString(),
          kpiValue,
        }
      }));

      setAnalysis(analysisData);
      return analysisData;
    } catch (err) {
      console.error("Error generating marketing analysis:", err);
      setError(err.message || "Failed to generate analysis");
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, section]);

  /**
   * Get cached analysis for a specific KPI without generating new one
   */
  const getCachedAnalysis = useCallback((kpiKey) => {
    return cachedAnalyses[kpiKey]?.analysis || null;
  }, [cachedAnalyses]);

  /**
   * Check if a KPI has a cached analysis
   */
  const hasCachedAnalysis = useCallback((kpiKey, kpiValue) => {
    const cached = cachedAnalyses[kpiKey];
    return cached && cached.kpiValue === kpiValue;
  }, [cachedAnalyses]);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  const refreshSectionCache = useCallback(async () => {
    await loadAllSectionAnalyses();
  }, [currentUser, section]);

  return {
    analysis,
    loading,
    error,
    generateAnalysis,
    getCachedAnalysis,
    hasCachedAnalysis,
    clearAnalysis,
    refreshSectionCache,
    cachedAnalyses,
  };
};