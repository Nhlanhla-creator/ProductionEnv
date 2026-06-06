// hooks/useSolvencyScore.js - ENHANCED VERSION
// Integrates actual Free Cashflow data from liquidity module

import { useState, useCallback } from "react";
import { db } from "../../firebaseConfig";
import { doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { calculateSolvencyScoreWithLiquidity, normalizeSolvencyScore } from "../MyGrowthTools/financial/data_utils/solvencyScoreUtils";



export const useSolvencyScore = (user) => {
  const [solvencyScore, setSolvencyScore] = useState(0);
  const [solvencyScoreBreakdown, setSolvencyScoreBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Calculate and save solvency score with optional liquidity data
   * 
   * @param {Object} balanceSheetData - Balance sheet from capital structure
   * @param {Object} solvencyData - Solvency metrics
   * @param {Object} liquidityData - Optional liquidity metrics (cashflow, burnRate, monthsRunway, currentRatio)
   * @param {number} year - Year for the score
   */
  const calculateAndSaveSolvencyScore = useCallback(
    async (balanceSheetData, solvencyData, liquidityData = null, year = null) => {
      if (!user) {
        // console.log("â No user provided to calculateAndSaveSolvencyScore");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // console.log("ð Calculating solvency score for year:", year);
        // console.log("ð Using liquidity data:", !!liquidityData);

        // Validate data
        if (!solvencyData || !solvencyData.nav) {
          console.warn("â ï¸ solvencyData missing or incomplete", solvencyData);
          setError("Solvency data incomplete - check balance sheet");
          setLoading(false);
          return null;
        }

        // â Use enhanced calculator that accepts liquidity data
        const scoreData = calculateSolvencyScoreWithLiquidity(
          balanceSheetData,
          solvencyData,
          liquidityData
        );

        // console.log("â Calculated score breakdown:", {
        //   overallScore: scoreData.overallScore,
        //   nav: scoreData.rawMetrics.nav,
        //   equityRatio: scoreData.rawMetrics.equityRatio,
        //   freeCashFlowScore: scoreData.breakdown.freeCashFlowScore,
        //   actualFreeCashFlow: scoreData.rawMetrics.actualFreeCashFlow,
        //   monthsRunway: scoreData.rawMetrics.monthsRunway,
        //   usedActualFCF: scoreData.sourceData.usedActualFCF,
        // });

        // Save to Firebase
        const docRef = doc(
          db,
          "users",
          user.uid,
          "solvencyScores",
          year?.toString() || new Date().getFullYear().toString()
        );

        const docToSave = {
          ...scoreData,
          userId: user.uid,
          year: year || new Date().getFullYear(),
          lastUpdated: new Date().toISOString(),
          componentScores: {
            debtToEquity: scoreData.breakdown.debtToEquity,
            debtToAssets: scoreData.breakdown.debtToAssets,
            equityRatio: scoreData.breakdown.equityRatio,
            interestCoverage: scoreData.breakdown.interestCoverage,
            nav: scoreData.breakdown.nav,
            leverageScore: scoreData.breakdown.leverageScore,
            freeCashFlowScore: scoreData.breakdown.freeCashFlowScore,
            workingCapitalScore: scoreData.breakdown.workingCapitalScore,
            assetQualityScore: scoreData.breakdown.assetQualityScore,
          },
          allMetrics: scoreData.rawMetrics,
          // â NEW: Track liquidity integration
          liquidityIntegration: {
            usedActualFCF: scoreData.sourceData.usedActualFCF,
            actualFreeCashFlow: scoreData.rawMetrics.actualFreeCashFlow,
            burnRate: scoreData.rawMetrics.burnRate,
            monthsRunway: scoreData.rawMetrics.monthsRunway,
            timestamp: new Date().toISOString(),
          },
        };

        await setDoc(docRef, docToSave);

        // console.log("â Solvency score saved successfully to:", docRef.path);
        // console.log("ð Saved data with FCF integration:", {
        //   overall: scoreData.overallScore,
        //   nav: scoreData.rawMetrics.nav,
        //   equityRatio: scoreData.rawMetrics.equityRatio,
        //   freeCashFlowScore: scoreData.breakdown.freeCashFlowScore,
        //   usedActualFCF: scoreData.sourceData.usedActualFCF,
        // });

        setSolvencyScore(scoreData.overallScore);
        setSolvencyScoreBreakdown(scoreData);

        return scoreData;
      } catch (e) {
        console.error("â Error calculating/saving solvency score:", e);
        setError(e.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  /**
   * Load latest solvency score from Firebase
   */
  const loadLatestSolvencyScore = useCallback(async () => {
  if (!user) {
    // console.log("â No user provided to loadLatestSolvencyScore");
    return null;
  }

  setLoading(true);
  setError(null);

  try {
    // console.log("ð Loading solvency score for user:", user.uid);

    const currentYear = new Date().getFullYear();
    const docRef = doc(db, "users", user.uid, "solvencyScores", currentYear.toString());
    let docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // console.log("â ï¸ No score for current year, trying previous year");
      const docRef2 = doc(db, "users", user.uid, "solvencyScores", (currentYear - 1).toString());
      docSnap = await getDoc(docRef2);
    }

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // â Return a structured object with consistent paths
      const result = {
        overallScore: data.overallScore || 0,
        normalizedScore: normalizeSolvencyScore(data.overallScore || 0),
        rawMetrics: data.rawMetrics || {},      // â Keep as rawMetrics
        breakdown: data.breakdown || {},
        componentScores: data.componentScores || {},
        metrics: data.metrics || {},
        timestamp: data.timestamp,
        year: data.year,
        // â Also provide rawScores as alias for backward compatibility
        rawScores: data.rawMetrics || {},
      };
      
      // console.log("â Loaded solvency score:", {
      //   overall: result.overallScore,
      //   nav: result.rawMetrics?.nav,
      //   equityRatio: result.rawMetrics?.equityRatio,
      // });

      setSolvencyScore(result.overallScore);
      setSolvencyScoreBreakdown(result);
      return result;
    }

    // console.log("â ï¸ No solvency score found for user");
    return null;
  } catch (e) {
    console.error("â Error loading solvency score:", e);
    setError(e.message);
    return null;
  } finally {
    setLoading(false);
  }
}, [user]);

  /**
   * Load solvency score history
   */
  const loadSolvencyScoreHistory = useCallback(
    async (limit_count = 5) => {
      if (!user) {
        // console.log("â No user provided to loadSolvencyScoreHistory");
        return [];
      }

      try {
        // console.log("ð Loading solvency score history...");

        const q = query(
          collection(db, "users", user.uid, "solvencyScores"),
          orderBy("year", "desc"),
          limit(limit_count)
        );

        const snapshot = await getDocs(q);
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // console.log(`â Loaded ${results.length} historical solvency scores`);
        return results;
      } catch (e) {
        console.error("â Error loading solvency score history:", e);
        return [];
      }
    },
    [user]
  );

  /**
   * Debug helper - verify saved data
   */
  const debugSolvencyData = useCallback(
    async (year) => {
      if (!user) return;

      try {
        const docRef = doc(
          db,
          "users",
          user.uid,
          "solvencyScores",
          year?.toString() || new Date().getFullYear().toString()
        );

        const docSnap = await getDoc(docRef);
        // console.log("ð DEBUG - Document path:", docRef.path);
        // console.log("ð DEBUG - Document exists:", docSnap.exists());
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // console.log("ð DEBUG - Overall Score:", data.overallScore);
          // console.log("ð DEBUG - NAV:", data.rawMetrics?.nav);
          // console.log("ð DEBUG - Equity Ratio:", data.rawMetrics?.equityRatio);
          // console.log("ð DEBUG - Free Cash Flow Score:", data.componentScores?.freeCashFlowScore);
          // console.log("ð DEBUG - Used Actual FCF:", data.liquidityIntegration?.usedActualFCF);
          // console.log("ð DEBUG - Actual FCF Value:", data.liquidityIntegration?.actualFreeCashFlow);
          // console.log("ð DEBUG - Months Runway:", data.liquidityIntegration?.monthsRunway);
          // console.log("ð DEBUG - Full Document:", data);
        }
        return docSnap;
      } catch (e) {
        console.error("ð DEBUG - Error:", e);
      }
    },
    [user]
  );

  return {
    solvencyScore,
    setSolvencyScore,
    solvencyScoreBreakdown,
    setSolvencyScoreBreakdown,
    loading,
    error,
    setError,
    calculateAndSaveSolvencyScore,
    loadLatestSolvencyScore,
    loadSolvencyScoreHistory,
    debugSolvencyData,
  };
};