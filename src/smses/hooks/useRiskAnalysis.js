// hooks/useRiskAnalysis.js

import { useState, useCallback } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import RiskAnalysisCacheService from "./riskAnalysisCacheService";

export const useRiskAnalysis = (currentUser, section = "strategic-risk-control") => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateAnalysis = useCallback(async (
    riskData,
    forceRegenerate = false
  ) => {
    setLoading(true);
    setError(null);

    try {
      if (!forceRegenerate) {
        const cachedAnalysis = await RiskAnalysisCacheService.loadAnalysis(
          currentUser?.uid,
          section,
          riskData
        );
        
        if (cachedAnalysis) {
          setAnalysis(cachedAnalysis);
          setLoading(false);
          return cachedAnalysis;
        }
      }

      // Prepare risk data for analysis
      const analysisData = prepareRiskData(riskData);
      const prompt = createRiskPrompt(analysisData);

      const functions = getFunctions();
      const generateStrategicRiskAnalysis = httpsCallable(
        functions, 
        'generateStrategicRiskAnalysis'
      );

      const result = await generateStrategicRiskAnalysis({
        prompt: prompt,
        userId: currentUser?.uid,
        timestamp: new Date().toISOString(),
      });

      const analysisContent = result.data.content;

      const analysisDataResponse = {
        analysis: analysisContent,
        fullResponse: analysisContent,
        generatedAt: result.data.generatedAt,
        expiresAt: result.data.expiresAt,
      };

      await RiskAnalysisCacheService.saveAnalysis(
        currentUser?.uid,
        section,
        analysisContent,
        riskData
      );

      setAnalysis(analysisDataResponse);
      return analysisDataResponse;
    } catch (err) {
      console.error("Error generating risk analysis:", err);
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

// Helper functions for risk data preparation
function prepareRiskData(riskData) {
  const allRisks = Object.values(riskData).flat();
  const riskScores = allRisks.map((risk) => ({
    ...risk,
    riskScore: (risk.severity || 1) * (risk.likelihood || 1),
  }));
  const risksByCategory = {};
  const risksByStatus = {};
  const risksByOwner = {};
  const risksByReviewCadence = {};
  const highRisks = [];
  const mediumRisks = [];
  const lowRisks = [];

  riskScores.forEach((risk) => {
    const category = risk.riskCategory || "Uncategorized";
    if (!risksByCategory[category]) risksByCategory[category] = [];
    risksByCategory[category].push(risk);
    const status = risk.mitigationStatus || "Uncontrolled";
    if (!risksByStatus[status]) risksByStatus[status] = 0;
    risksByStatus[status]++;
    if (risk.owner) {
      if (!risksByOwner[risk.owner]) risksByOwner[risk.owner] = 0;
      risksByOwner[risk.owner]++;
    }
    if (risk.reviewCadence) {
      if (!risksByReviewCadence[risk.reviewCadence])
        risksByReviewCadence[risk.reviewCadence] = 0;
      risksByReviewCadence[risk.reviewCadence]++;
    }
    if (risk.riskScore >= 16) highRisks.push(risk);
    else if (risk.riskScore >= 9) mediumRisks.push(risk);
    else lowRisks.push(risk);
  });

  const avgScoresByCategory = {};
  Object.keys(risksByCategory).forEach((category) => {
    const risks = risksByCategory[category];
    const avgSeverity =
      risks.reduce((sum, r) => sum + (r.severity || 1), 0) / risks.length;
    const avgLikelihood =
      risks.reduce((sum, r) => sum + (r.likelihood || 1), 0) / risks.length;
    const avgRiskScore =
      risks.reduce((sum, r) => sum + (r.riskScore || 1), 0) / risks.length;
    avgScoresByCategory[category] = {
      avgSeverity: Math.round(avgSeverity * 10) / 10,
      avgLikelihood: Math.round(avgLikelihood * 10) / 10,
      avgRiskScore: Math.round(avgRiskScore * 10) / 10,
      count: risks.length,
      controlledRisks: risks.filter(
        (r) => r.mitigationStatus === "🟢 Controlled"
      ).length,
      uncontrolledRisks: risks.filter(
        (r) => r.mitigationStatus === "🔴 Uncontrolled"
      ).length,
    };
  });

  return {
    totalRisks: allRisks.length,
    risksByCategory,
    risksByStatus,
    risksByOwner,
    risksByReviewCadence,
    avgScoresByCategory,
    highRisks: highRisks.length,
    mediumRisks: mediumRisks.length,
    lowRisks: lowRisks.length,
    highRiskItems: highRisks.slice(0, 5),
    controlledRisks: allRisks.filter(
      (r) => r.mitigationStatus === "🟢 Controlled"
    ).length,
    partiallyControlledRisks: allRisks.filter(
      (r) => r.mitigationStatus === "🟡 Partially controlled"
    ).length,
    uncontrolledRisks: allRisks.filter(
      (r) => r.mitigationStatus === "🔴 Uncontrolled"
    ).length,
    risksWithOwners: allRisks.filter((r) => r.owner).length,
    risksWithReviewCadence: allRisks.filter((r) => r.reviewCadence).length,
    risksWithMitigation: allRisks.filter((r) => r.mitigation).length,
  };
}

function createRiskPrompt(data) {
  return `Analyze the Strategic Risk Control and Risk Register of a business based on the following risk assessment data:

RISK REGISTER DATA:
Total Risks Identified: ${data.totalRisks}

RISK LEVEL DISTRIBUTION:
- High Risk (Score 16-25): ${data.highRisks}
- Medium Risk (Score 9-15): ${data.mediumRisks}
- Low Risk (Score 1-8): ${data.lowRisks}

MITIGATION STATUS:
- 🟢 Controlled: ${data.controlledRisks}
- 🟡 Partially controlled: ${data.partiallyControlledRisks}
- 🔴 Uncontrolled: ${data.uncontrolledRisks}

GOVERNANCE METRICS:
- Risks with assigned owners: ${data.risksWithOwners} (${Math.round((data.risksWithOwners / data.totalRisks) * 100)}%)
- Risks with review cadence: ${data.risksWithReviewCadence} (${Math.round((data.risksWithReviewCadence / data.totalRisks) * 100)}%)
- Risks with mitigation plans: ${data.risksWithMitigation} (${Math.round((data.risksWithMitigation / data.totalRisks) * 100)}%)

RISK CATEGORY BREAKDOWN:
${Object.keys(data.avgScoresByCategory)
  .map((category) => {
    const cat = data.avgScoresByCategory[category];
    return `- ${category}: ${cat.count} risks, Avg Risk Score: ${cat.avgRiskScore}, Controlled: ${cat.controlledRisks}/${cat.count}`;
  })
  .join("\n")}

TOP 5 HIGHEST RISK ITEMS:
${data.highRiskItems
  .map(
    (risk, i) =>
      `  ${i + 1}. ${risk.riskSubCategory || "Unnamed Risk"} (${risk.riskNumber || "N/A"}) - Score: ${risk.riskScore} (Severity: ${risk.severity}, Likelihood: ${risk.likelihood}), Status: ${risk.mitigationStatus}, Owner: ${risk.owner || "Unassigned"}`
  )
  .join("\n")}

RISK STATUS DISTRIBUTION:
${Object.keys(data.risksByStatus)
  .map((status) => `- ${status}: ${data.risksByStatus[status]}`)
  .join("\n")}

Please provide a comprehensive analysis including:
1. Overall risk profile assessment
2. Mitigation effectiveness evaluation
3. Governance and accountability assessment
4. Critical risk analysis for top items
5. Actionable recommendations
6. Strategic implications`;
}