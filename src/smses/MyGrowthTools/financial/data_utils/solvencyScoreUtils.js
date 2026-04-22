// ==================== ENHANCED SOLVENCY SCORE WITH REAL FCF DATA ====================

/**
 * Calculate comprehensive solvency scores from balance sheet data
 * ENHANCED: Accepts actual Free Cashflow data from liquidity module
 * 
 * @param {Object} balanceSheetData - Balance sheet data structure
 * @param {Object} solvencyData - Solvency ratios
 * @param {Object} liquidityData - Optional actual liquidity metrics (FCF, burn rate, runway)
 * @returns {Object} Detailed solvency score with all metrics
 */

const getLatestValue = (arr) => {
  if (!Array.isArray(arr)) return parseFloat(arr) || 0;
  // Start from the end, find first non-zero value
  for (let i = arr.length - 1; i >= 0; i--) {
    const val = parseFloat(arr[i]);
    if (!isNaN(val) && val !== 0 && val !== null && val !== "") {
      return val;
    }
  }
  // If all are zero, check if any index has a string "0" that we should ignore
  // Actually, return 0 is fine - no data
  return 0;
};

export const calculateSolvencyScoreWithLiquidity = (
  balanceSheetData,
  solvencyData,
  liquidityData = null
) => {
  // Helper that works for both array and direct value
  const getValue = (val) => {
    if (val === undefined || val === null) return 0;
    if (Array.isArray(val)) {
      // Find the last non-zero value
      for (let i = val.length - 1; i >= 0; i--) {
        const v = parseFloat(val[i]);
        if (!isNaN(v) && v !== 0) return v;
      }
      return 0;
    }
    return parseFloat(val) || 0;
  };

  const debtToEquity = getValue(solvencyData.debtToEquity);
  const debtToAssets = getValue(solvencyData.debtToAssets);
  const equityRatio = getValue(solvencyData.equityRatio);
  const interestCoverage = getValue(solvencyData.interestCoverage);
  const nav = getValue(solvencyData.nav);

  // ============== Calculate working capital metrics ==============
  const calcCurrentAssetsTtl = () => {
    const { bank = {}, currentAssets = {} } = balanceSheetData.assets || {};
    let total = 0;
    Object.values(bank).forEach(arr => {
      total += getLatestValue(arr);
    });
    Object.values(currentAssets).forEach(arr => {
      total += getLatestValue(arr);
    });
    return total;
  };

  const calcCurrentLiabilitiesTtl = () => {
    const { currentLiabilities = {} } = balanceSheetData.liabilities || {};
    let total = 0;
    Object.values(currentLiabilities).forEach(arr => {
      total += getLatestValue(arr);
    });
    return total;
  };

  const currentAssets = calcCurrentAssetsTtl();
  const currentLiabilities = calcCurrentLiabilitiesTtl();
  const workingCapital = currentAssets - currentLiabilities;
  const currentRatio = currentLiabilities !== 0 ? currentAssets / currentLiabilities : 0;

  // ============== Calculate quick ratio ==============
  const calcQuickAssets = () => {
    const { bank = {}, currentAssets = {} } = balanceSheetData.assets || {};
    let total = 0;
    Object.values(bank).forEach(arr => {
      total += getLatestValue(arr);
    });
    Object.entries(currentAssets).forEach(([key, arr]) => {
      if (!key.toLowerCase().includes('inventory') && !key.toLowerCase().includes('stock')) {
        total += getLatestValue(arr);
      }
    });
    return total;
  };

  const quickAssets = calcQuickAssets();
  const quickRatio = currentLiabilities !== 0 ? quickAssets / currentLiabilities : 0;

  // ============== ENHANCED: Use actual Free Cashflow if available ==============
  // Priority: Use actual FCF from liquidity module, fall back to working capital estimate
  let freeCashFlowMetric = 0;
  let actualFreeCashFlow = 0;

  if (liquidityData && liquidityData.cashflow) {
    // Use actual FCF from liquidity module
    actualFreeCashFlow = liquidityData.cashflow;
    // Score based on positive/negative FCF
    // Positive FCF in millions -> higher score
    if (actualFreeCashFlow > 0) {
      freeCashFlowMetric = Math.min(100, (actualFreeCashFlow / Math.max(1, Math.abs(liquidityData.burnRate || 1))) * 10);
    } else if (actualFreeCashFlow < 0) {
      freeCashFlowMetric = Math.max(0, 50 + (actualFreeCashFlow / Math.max(1, Math.abs(liquidityData.burnRate || 1))) * 10);
    } else {
      freeCashFlowMetric = 50; // Neutral
    }
  } else {
    // Fallback: Estimate from working capital
    freeCashFlowMetric = workingCapital > 0 ? Math.min(100, (workingCapital / currentAssets) * 100) : 0;
  }

  // ============== Calculate total assets ==============
  const calcTotalAssets = () => {
    const { bank = {}, currentAssets = {}, nonCurrentAssets = {}, fixedAssets = {} } = balanceSheetData.assets || {};
    let total = 0;
    Object.values(bank).forEach(arr => {
      total += getLatestValue(arr);
    });
    Object.values(currentAssets).forEach(arr => {
      total += getLatestValue(arr);
    });
    Object.values(nonCurrentAssets).forEach(arr => {
      total += getLatestValue(arr);
    });
    Object.values(fixedAssets).forEach(arr => {
      total += getLatestValue(arr);
    });
    return total;
  };

  const totalAssets = calcTotalAssets();
  const assetQuality = totalAssets !== 0 ? (quickAssets / totalAssets) * 100 : 0;

  // ============== Score individual metrics ==============
  const scores = {
    debtToEquity: scoreDebtToEquity(debtToEquity),
    debtToAssets: scoreDebtToAssets(debtToAssets),
    equityRatio: scoreEquityRatio(equityRatio),
    interestCoverage: scoreInterestCoverage(interestCoverage),
    nav: scoreNav(nav),
    leverageScore: scoreLeveragePosition(debtToEquity, debtToAssets),
    freeCashFlowScore: scoreFreeCashFlowEnhanced(freeCashFlowMetric, liquidityData),
    workingCapitalScore: scoreWorkingCapital(currentRatio, quickRatio),
    assetQualityScore: scoreAssetQuality(assetQuality),
  };

  // ============== Calculate weighted overall score ==============
  const weights = {
    debtToEquity: 0.18,
    debtToAssets: 0.18,
    equityRatio: 0.15,
    interestCoverage: 0.15,
    nav: 0.12,
    leverageScore: 0.10,
    freeCashFlowScore: 0.07,
    workingCapitalScore: 0.05,
    assetQualityScore: 0.04,
  };

  const overallScore = Math.round(
    scores.debtToEquity * weights.debtToEquity +
    scores.debtToAssets * weights.debtToAssets +
    scores.equityRatio * weights.equityRatio +
    scores.interestCoverage * weights.interestCoverage +
    scores.nav * weights.nav +
    scores.leverageScore * weights.leverageScore +
    scores.freeCashFlowScore * weights.freeCashFlowScore +
    scores.workingCapitalScore * weights.workingCapitalScore +
    scores.assetQualityScore * weights.assetQualityScore
  );

  return {
    overallScore,
    breakdown: scores,
    rawMetrics: {
      debtToEquity: parseFloat(debtToEquity).toFixed(2),
      debtToAssets: parseFloat(debtToAssets).toFixed(2),
      equityRatio: parseFloat(equityRatio).toFixed(2),
      interestCoverage: parseFloat(interestCoverage).toFixed(2),
      nav: parseFloat(nav).toFixed(2),
      currentRatio: parseFloat(currentRatio).toFixed(2),
      quickRatio: parseFloat(quickRatio).toFixed(2),
      workingCapital: parseFloat(workingCapital).toFixed(2),
      assetTurnover: totalAssets !== 0 ? (currentAssets / totalAssets).toFixed(2) : "0.00",
      // â NEW: Actual liquidity metrics
      actualFreeCashFlow: parseFloat(actualFreeCashFlow).toFixed(2),
      burnRate: liquidityData?.burnRate ? parseFloat(liquidityData.burnRate).toFixed(2) : "0.00",
      monthsRunway: liquidityData?.monthsRunway ? parseFloat(liquidityData.monthsRunway).toFixed(1) : "0.0",
      currentRatioFromLiquidity: liquidityData?.currentRatio ? parseFloat(liquidityData.currentRatio).toFixed(2) : null,
    },
    // â NEW: Source data for transparency
    sourceData: {
      usedActualFCF: !!(liquidityData && liquidityData.cashflow),
      liquidityDataPresent: !!liquidityData,
    },
    metrics: {
      currentAssets: parseFloat(currentAssets).toFixed(2),
      currentLiabilities: parseFloat(currentLiabilities).toFixed(2),
      totalAssets: parseFloat(totalAssets).toFixed(2),
      quickAssets: parseFloat(quickAssets).toFixed(2),
    },
    timestamp: new Date().toISOString(),
  };
};

// ============== INDIVIDUAL METRIC SCORERS ==============

const scoreDebtToEquity = (ratio) => {
  const r = parseFloat(ratio);
  if (isNaN(r)) return 0;
  const ideal = 1.0;
  const deviation = Math.abs(r - ideal);
  if (deviation <= 0.3) return 90;
  if (deviation <= 0.6) return 75;
  if (deviation <= 1.0) return 55;
  if (deviation <= 1.5) return 35;
  return Math.max(0, 100 - deviation * 10);
};

const scoreDebtToAssets = (ratio) => {
  const r = parseFloat(ratio);
  if (isNaN(r)) return 0;
  if (r < 0.3) return 95;
  if (r < 0.5) return 85;
  if (r < 0.7) return 65;
  if (r < 0.9) return 40;
  return Math.max(0, 100 - r * 50);
};

const scoreEquityRatio = (percentage) => {
  const p = parseFloat(percentage);
  if (isNaN(p)) return 0;
  if (p >= 70) return 95;
  if (p >= 60) return 85;
  if (p >= 50) return 75;
  if (p >= 40) return 55;
  if (p >= 30) return 35;
  return Math.max(0, p);
};

const scoreInterestCoverage = (ratio) => {
  const r = parseFloat(ratio);
  if (isNaN(r) || r < 0) return 0;
  if (r >= 5) return 100;
  if (r >= 3) return 85;
  if (r >= 2) return 70;
  if (r >= 1.5) return 45;
  if (r >= 1) return 20;
  return 0;
};

const scoreNav = (navInMillions) => {
  const nav = parseFloat(navInMillions);
  if (isNaN(nav)) return 0;
  if (nav <= 0) return 0;
  if (nav > 100) return 100;
  if (nav > 50) return 90;
  if (nav > 10) return 80;
  if (nav > 1) return 60;
  return Math.min(nav * 50, 50);
};

const scoreLeveragePosition = (dte, dta) => {
  const debtToEquityScore = scoreDebtToEquity(dte);
  const debtToAssetsScore = scoreDebtToAssets(dta);
  return Math.round((debtToEquityScore * 0.5 + debtToAssetsScore * 0.5));
};

/**
 * ENHANCED: Score Free Cash Flow using actual liquidity data
 * Considers both FCF amount AND runway/sustainability
 */
const scoreFreeCashFlowEnhanced = (baseMetric, liquidityData) => {
  let fcfScore = baseMetric;

  // Bonus for positive FCF with good runway
  if (liquidityData) {
    const fcf = parseFloat(liquidityData.cashflow) || 0;
    const runway = parseFloat(liquidityData.monthsRunway) || 0;

    // Positive FCF + 6+ months runway = excellent (bump score)
    if (fcf > 0 && runway >= 6) {
      fcfScore = Math.min(100, fcfScore + 15);
    }
    // Positive FCF but low runway = good but risky (slight bump)
    else if (fcf > 0 && runway >= 3) {
      fcfScore = Math.min(100, fcfScore + 8);
    }
    // Negative FCF but reasonable runway = penalize
    else if (fcf <= 0 && runway > 0) {
      fcfScore = Math.max(0, fcfScore - 20);
    }
    // Negative FCF and low runway = critical
    else if (fcf <= 0 && runway < 3) {
      fcfScore = Math.max(0, fcfScore - 40);
    }
  }

  return Math.round(fcfScore);
};

const scoreWorkingCapital = (currentRatio, quickRatio) => {
  const cr = parseFloat(currentRatio);
  const qr = parseFloat(quickRatio);

  let crScore = 0;
  if (cr >= 1.5 && cr <= 2.5) crScore = 95;
  else if (cr >= 1.2 && cr <= 3) crScore = 85;
  else if (cr >= 1 && cr <= 4) crScore = 70;
  else if (cr >= 0.8) crScore = 40;
  else crScore = 0;

  let qrScore = 0;
  if (qr >= 1) qrScore = 90;
  else if (qr >= 0.8) qrScore = 70;
  else if (qr >= 0.6) qrScore = 50;
  else qrScore = 20;

  return Math.round((crScore * 0.6 + qrScore * 0.4));
};

const scoreAssetQuality = (assetQuality) => {
  const aq = parseFloat(assetQuality);
  if (isNaN(aq)) return 0;
  if (aq >= 60) return 95;
  if (aq >= 50) return 85;
  if (aq >= 40) return 75;
  if (aq >= 30) return 60;
  if (aq >= 20) return 40;
  return Math.min(aq * 2, 30);
};

// ============== UTILITY FUNCTIONS ==============

export const normalizeSolvencyScore = (score) => {
  const s = parseFloat(score);
  if (isNaN(s)) return 0;
  return Math.round((s / 100) * 5 * 10) / 10;
};

export const getSolvencyTier = (score) => {
  const s = parseFloat(score);
  if (isNaN(s)) s = 0;
  if (s >= 85) return { tier: "Excellent", badge: "ð¢", color: "#4CAF50" };
  if (s >= 70) return { tier: "Good", badge: "ðµ", color: "#2196F3" };
  if (s >= 50) return { tier: "Fair", badge: "ð¡", color: "#FF9800" };
  if (s >= 30) return { tier: "Poor", badge: "ð´", color: "#F44336" };
  return { tier: "Critical", badge: "â«", color: "#C62828" };
};

export const getSolvencyAnalysis = (score, breakdown) => {
  const s = parseFloat(score);
  const tier = getSolvencyTier(s);

  let analysis = `**Solvency Status: ${tier.tier}** ${tier.badge}\n\n`;

  if (s >= 85) {
    analysis += "Your business shows excellent financial solvency. Strong balance sheet with healthy debt levels, good asset coverage, and positive cash flow.";
  } else if (s >= 70) {
    analysis += "Your business demonstrates good solvency. Most key metrics are within healthy ranges, though some liquidity or leverage areas could be optimized.";
  } else if (s >= 50) {
    analysis += "Your business has fair solvency but faces some challenges. Review debt levels, cash flow management, and working capital optimization.";
  } else if (s >= 30) {
    analysis += "Your business shows poor solvency indicators. Urgent action needed to strengthen balance sheet, improve cash flow, and reduce risk.";
  } else {
    analysis += "Your business is in a critical financial position. Immediate restructuring, refinancing, or capital injection required.";
  }

  return analysis;
};