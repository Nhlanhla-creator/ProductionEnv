// hooks/usePeopleAnalysis.js

import { useState, useCallback } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import PeopleAnalysisCacheService from "./peopleAnalysisCacheService";

export const usePeopleAnalysis = (currentUser, section = "execution-capacity") => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      if (!forceRegenerate) {
        const cachedAnalysis = await PeopleAnalysisCacheService.loadAnalysis(
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

      const functions = getFunctions();
      const analyzePeopleKPI = httpsCallable(functions, 'analyzePeopleKPI');

      const result = await analyzePeopleKPI({
        kpiTitle,
        kpiKey,
        kpiValue,
        section,
        contextData: {
          benchmark: contextData.benchmark,
          timeRange: contextData.timeRange,
          budgetValue: contextData.budgetValue,
          currentValue: kpiValue,
          unit: contextData.unit,
          status: contextData.status,
        },
        company: {
          name: company.name || "Your Business",
          stage: company.stage || "Growth",
          industry: company.industry || "General",
        },
        timestamp: new Date().toISOString(),
      });

      const analysisData = result.data;

      await PeopleAnalysisCacheService.saveAnalysis(
        currentUser?.uid,
        section,
        kpiKey,
        analysisData,
        { ...contextData, kpiValue }
      );

      setAnalysis(analysisData);
      return analysisData;
    } catch (err) {
      console.error("Error generating people analysis:", err);
      setError(err.message || "Failed to generate analysis");
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, section]);

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