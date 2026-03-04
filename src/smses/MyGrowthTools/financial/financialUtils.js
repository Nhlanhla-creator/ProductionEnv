// ==================== MONTH CONSTANTS ====================
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ==================== RANGE UTILITIES ====================

/** Parse "YYYY-MM" → { year, monthIndex } (0-based) */
export const parseYM = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return { year: y, monthIndex: m - 1 };
};

/** { year, monthIndex } → "YYYY-MM" */
export const toYM = (year, monthIndex) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

/** "YYYY-MM" → "MMM YYYY" */
export const ymLabel = (ym) => {
  const { year, monthIndex } = parseYM(ym);
  return `${MONTH_NAMES[monthIndex]} ${year}`;
};

/** Returns default last-12-months range */
export const getDefaultRange = () => {
  const now = new Date();
  const to = toYM(now.getFullYear(), now.getMonth());
  const d = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const from = toYM(d.getFullYear(), d.getMonth());
  return { from, to };
};

/**
 * Core range helper — returns array of { label, ym, year, monthIndex }
 * for every month in [fromYM, toYM] inclusive.
 * No FY offset — data arrays always indexed by calendar month (Jan=0).
 */
export const getRangeMonthsMeta = (fromYM, endYM) => {
  const result = [];
  let { year, monthIndex } = parseYM(fromYM);
  const end = parseYM(endYM);
  while (
    year < end.year ||
    (year === end.year && monthIndex <= end.monthIndex)
  ) {
    result.push({
      label: `${MONTH_NAMES[monthIndex]} ${year}`,
      ym: toYM(year, monthIndex),
      year,
      monthIndex,
    });
    monthIndex++;
    if (monthIndex === 12) {
      monthIndex = 0;
      year++;
    }
  }
  return result;
};

/** Convenience: last-12-months meta */
export const getLast12MonthsMeta = () => {
  const { from, to } = getDefaultRange();
  return getRangeMonthsMeta(from, to);
};

/** Build x-axis labels for a range */
export const getRangeLabels = (fromYM, toYM) =>
  getRangeMonthsMeta(fromYM, toYM).map((m) => m.label);

/** Convenience: last-12-months labels (backward compat) */
export const getLast12MonthsLabels = () => {
  const { from, to } = getDefaultRange();
  return getRangeLabels(from, to);
};

// ==================== FIRESTORE RANGE FETCHER ====================

/**
 * Fetches a processed chart key across any date range, stitching multiple year docs.
 */
export const getRangeComputed = async ({
  uid,
  docBase,
  chartKey,
  fromYM,
  toYM,
  getDocFn,
  docFn,
  db,
  processor,
}) => {
  const meta = getRangeMonthsMeta(fromYM, toYM);
  const years = [...new Set(meta.map((m) => m.year))];
  const docCache = {};

  await Promise.all(
    years.map(async (year) => {
      try {
        let snap = await getDocFn(
          docFn(db, "financialData", `${uid}${docBase}_${year}`),
        );
        if (!snap.exists())
          snap = await getDocFn(docFn(db, "financialData", `${uid}${docBase}`));
        docCache[year] = snap.exists() ? processor(snap.data()) : null;
      } catch {
        docCache[year] = null;
      }
    }),
  );

  const actual = [],
    budget = [];
  for (const { year, monthIndex } of meta) {
    const entry = docCache[year]?.[chartKey];
    const a = entry?.actual?.[monthIndex];
    const b = entry?.budget?.[monthIndex];
    actual.push(a !== undefined && a !== null ? a : null);
    budget.push(b !== undefined && b !== null ? b : null);
  }
  return { actual, budget };
};

/**
 * Backward-compat wrapper — financialYearStart ignored, uses calendar months.
 */
export const getLast12MonthsComputed = async ({
  uid,
  docBase,
  chartKey,
  financialYearStart: _ignored,
  getDocFn,
  docFn,
  db,
  processor,
}) => {
  const { from, to } = getDefaultRange();
  return getRangeComputed({
    uid,
    docBase,
    chartKey,
    fromYM: from,
    toYM: to,
    getDocFn,
    docFn,
    db,
    processor,
  });
};

// ==================== FIRST-DATA-MONTH DETECTOR ====================

/**
 * Scans year docs from 2023 and returns earliest "YYYY-MM" with non-zero data.
 * Falls back to 36 months ago.
 */
export const getFirstDataMonth = async ({
  uid,
  docBase,
  probeKey,
  getDocFn,
  docFn,
  db,
  processor,
}) => {
  for (const year of [2023, 2024, 2025, 2026]) {
    try {
      let snap = await getDocFn(
        docFn(db, "financialData", `${uid}${docBase}_${year}`),
      );
      if (!snap.exists()) continue;
      const processed = processor(snap.data());
      const arr = processed?.[probeKey]?.actual;
      if (!arr) continue;
      for (let mi = 0; mi < 12; mi++) {
        if (arr[mi] !== null && arr[mi] !== undefined && arr[mi] !== 0)
          return toYM(year, mi);
      }
    } catch {
      /* skip */
    }
  }
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 35, 1);
  return toYM(d.getFullYear(), d.getMonth());
};

// ==================== FORMATTERS ====================

export const formatCurrency = (value, unit = "zar_million", decimals = 2) => {
  const num = parseFloat(value) || 0;
  const opts = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  };
  switch (unit) {
    case "zar":
      return `R${num.toLocaleString(undefined, opts)}`;
    case "zar_thousand":
      return `R${(num * 1000).toLocaleString(undefined, opts)}`;
    case "zar_billion":
      return `R${(num / 1000).toLocaleString(undefined, opts)}`;
    default:
      return `R${num.toLocaleString(undefined, opts)}`;
  }
};

export const formatPercentage = (value, decimals = 2) =>
  `${(parseFloat(value) || 0).toFixed(decimals)}%`;

export const formatSmartNumber = (valueInM, decimals = 2) => {
  const num = parseFloat(valueInM) || 0;
  const abs = Math.abs(num);
  if (abs >= 1000) return (num / 1000).toFixed(decimals);
  if (abs >= 1) return num.toFixed(decimals);
  return (num * 1000).toFixed(decimals);
};

export const getSmartUnit = (valueInM) => {
  const abs = Math.abs(parseFloat(valueInM) || 0);
  if (abs >= 1000) return "R bn";
  if (abs >= 1) return "R m";
  return "R k";
};

export const makeFormatValue =
  (unit = "zar_million") =>
  (value, overrideUnit, decimals = 2) =>
    formatCurrency(value, overrideUnit ?? unit, decimals);

// ==================== CALCULATORS ====================

export const getMonthIndex = (month) =>
  [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ].indexOf(month);

export const calculateAverage = (arr) => {
  if (!arr?.length) return 0;
  const valid = arr.filter((v) => v !== "" && !isNaN(parseFloat(v)));
  if (!valid.length) return 0;
  return valid.reduce((sum, v) => sum + parseFloat(v), 0) / valid.length;
};

export const calculateTotal = (items, monthIndex) => {
  if (!items || monthIndex < 0 || monthIndex >= 12) return 0;
  return Object.values(items).reduce((sum, arr) => {
    if (!Array.isArray(arr) || arr.length <= monthIndex) return sum;
    return sum + (parseFloat(arr[monthIndex]) || 0);
  }, 0);
};

export const aggregateDataForView = (data, viewMode, isAverage = false) => {
  if (!data?.length) return data;
  if (viewMode === "month") return data;
  if (viewMode === "quarter") {
    return Array.from({ length: 4 }, (_, i) => {
      const slice = data.slice(i * 3, i * 3 + 3);
      const total = slice.reduce((a, b) => a + b, 0);
      return isAverage ? total / slice.length : total;
    });
  }
  const total = data.reduce((a, b) => a + b, 0);
  return [isAverage ? total / data.length : total];
};

export const generateMonthLabels = (viewMode, year) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  if (viewMode === "month") return months;
  if (viewMode === "quarter") return ["Q1", "Q2", "Q3", "Q4"];
  return [String(year)];
};

// ==================== FIREBASE DATA PROCESSORS ====================

export const processBalanceSheetArrays = (data, fields, decimals = 2) =>
  Object.fromEntries(
    fields.map((f) => [
      f,
      data[f]?.map((v) => parseFloat(v).toFixed(decimals)) ??
        Array(12).fill(""),
    ]),
  );

export const processPnlFromFirebase = (firebaseData) => {
  const pnlFields = [
    "sales",
    "salesBudget",
    "cogs",
    "cogsBudget",
    "opex",
    "opexBudget",
    "salaries",
    "salariesBudget",
    "rent",
    "rentBudget",
    "utilities",
    "utilitiesBudget",
    "marketing",
    "marketingBudget",
    "admin",
    "adminBudget",
    "otherExpenses",
    "otherExpensesBudget",
    "depreciation",
    "depreciationBudget",
    "amortization",
    "amortizationBudget",
    "interestExpense",
    "interestExpenseBudget",
    "interestIncome",
    "interestIncomeBudget",
    "tax",
    "taxBudget",
  ];
  return {
    ...Object.fromEntries(
      pnlFields.map((f) => [
        f,
        firebaseData[f]?.map((v) => v.toFixed(2)) ?? Array(12).fill(""),
      ]),
    ),
    notes: firebaseData.notes || "",
  };
};

export const computePnlChartData = (firebaseData) => {
  const parse = (key) =>
    firebaseData[key]?.map((v) => parseFloat(v) || 0) ?? Array(12).fill(0);
  const sales = parse("sales"),
    cogs = parse("cogs"),
    opex = parse("opex");
  const dep = parse("depreciation"),
    amort = parse("amortization");
  const intExp = parse("interestExpense"),
    intInc = parse("interestIncome"),
    tax = parse("tax");
  const salesB = parse("salesBudget"),
    cogsB = parse("cogsBudget"),
    opexB = parse("opexBudget");
  const depB = parse("depreciationBudget"),
    amortB = parse("amortizationBudget");
  const intExpB = parse("interestExpenseBudget"),
    intIncB = parse("interestIncomeBudget"),
    taxB = parse("taxBudget");

  const gp = sales.map((s, i) => s - cogs[i]);
  const gpB = salesB.map((s, i) => s - cogsB[i]);
  const ebitda = gp.map((g, i) => g - opex[i]);
  const ebitdaB = gpB.map((g, i) => g - opexB[i]);
  const ebit = ebitda.map((e, i) => e - dep[i] - amort[i]);
  const ebitB = ebitdaB.map((e, i) => e - depB[i] - amortB[i]);
  const np = ebit.map((e, i) => e - intExp[i] + (intInc[i] || 0) - tax[i]);
  const npB = ebitB.map((e, i) => e - intExpB[i] + (intIncB[i] || 0) - taxB[i]);
  const gpM = sales.map((s, i) => (s !== 0 ? (gp[i] / s) * 100 : 0));
  const gpMB = salesB.map((s, i) => (s !== 0 ? (gpB[i] / s) * 100 : 0));
  const npM = sales.map((s, i) => (s !== 0 ? (np[i] / s) * 100 : 0));
  const npMB = salesB.map((s, i) => (s !== 0 ? (npB[i] / s) * 100 : 0));

  const toM = (a) => a.map((v) => v / 1_000_000);
  return {
    sales: { actual: toM(sales), budget: toM(salesB) },
    cogs: { actual: toM(cogs), budget: toM(cogsB) },
    opex: { actual: toM(opex), budget: toM(opexB) },
    grossProfit: { actual: toM(gp), budget: toM(gpB) },
    ebitda: { actual: toM(ebitda), budget: toM(ebitdaB) },
    ebit: { actual: toM(ebit), budget: toM(ebitB) },
    netProfit: { actual: toM(np), budget: toM(npB) },
    gpMargin: { actual: gpM, budget: gpMB },
    npMargin: { actual: npM, budget: npMB },
  };
};

export const computeCostChartData = (firebaseData) => {
  const parse = (key) =>
    firebaseData[key]?.map((v) => parseFloat(v) || 0) ?? Array(12).fill(0);
  const fixed = parse("fixedCosts"),
    variable = parse("variableCosts");
  const discretion = parse("discretionaryCosts"),
    semiVar = parse("semiVariableCosts");
  const lockIn = parse("lockInDuration");
  const total = fixed.map((f, i) => f + variable[i] + semiVar[i]);
  const toM = (a) => a.map((v) => v / 1_000_000);
  return {
    fixedCosts: { actual: toM(fixed) },
    variableCosts: { actual: toM(variable) },
    discretionaryCosts: { actual: toM(discretion) },
    semiVariableCosts: { actual: toM(semiVar) },
    lockInDuration: { actual: lockIn },
    totalCosts: { actual: toM(total) },
    fixedVariableRatio: {
      actual: total.map((t, i) => (t !== 0 ? (fixed[i] / t) * 100 : 0)),
    },
    discretionaryPercentage: {
      actual: total.map((t, i) => (t !== 0 ? (discretion[i] / t) * 100 : 0)),
    },
  };
};

export const computeLiquidityChartData = (firebaseData) => {
  const parse = (key) =>
    firebaseData[key]?.map((v) => parseFloat(v) || 0) ?? Array(12).fill(0);
  const burnRate = parse("burnRate"),
    cashBal = parse("cashBalance");
  const toM = (a) => a.map((v) => v / 1_000_000);
  return {
    currentRatio: { actual: parse("currentRatio") },
    quickRatio: { actual: parse("quickRatio") },
    cashRatio: { actual: parse("cashRatio") },
    burnRate: { actual: toM(burnRate) },
    cashCover: { actual: parse("cashCover") },
    cashflow: { actual: toM(parse("cashflow")) },
    loanRepayments: { actual: toM(parse("loanRepayments")) },
    cashBalance: { actual: toM(cashBal) },
    workingCapital: { actual: toM(parse("workingCapital")) },
    monthsRunway: {
      actual: burnRate.map((b, i) => (b !== 0 ? cashBal[i] / b : 0)),
    },
  };
};

// ==================== CAPITAL STRUCTURE PROCESSOR ====================

const _sumBSSections = (group = {}, sections) =>
  Array.from({ length: 12 }, (_, i) =>
    (sections ?? Object.keys(group)).reduce((total, sec) => {
      const block = group[sec] || {};
      return (
        total +
        Object.values(block).reduce((s, arr) => {
          if (!Array.isArray(arr)) return s;
          const v = parseFloat(arr[i]);
          return s + (isNaN(v) ? 0 : v);
        }, 0)
      );
    }, 0),
  );

const _sumEquity = (equity = {}) =>
  Array.from({ length: 12 }, (_, i) =>
    Object.values(equity).reduce((sum, arr) => {
      if (!Array.isArray(arr)) return sum;
      const v = parseFloat(arr[i]);
      return sum + (isNaN(v) ? 0 : v);
    }, 0),
  );

export const computeCapitalStructureChartData = (firebaseData) => {
  const solvency = firebaseData.solvencyData || {},
    leverage = firebaseData.leverageData || {};
  const equity = firebaseData.equityData || {},
    bs = firebaseData.balanceSheetData || {};

  const stored = (obj, key) => {
    const arr = obj[key];
    if (!Array.isArray(arr)) return null;
    const parsed = arr.map((v) => parseFloat(v) || 0);
    return parsed.some((v) => v !== 0) ? parsed : null;
  };

  const assetSecs = [
    "bank",
    "currentAssets",
    "fixedAssets",
    "intangibleAssets",
    "nonCurrentAssets",
  ];
  const liabSecs = ["currentLiabilities", "nonCurrentLiabilities"];
  const totA = _sumBSSections(bs.assets || {}, assetSecs);
  const totL = _sumBSSections(bs.liabilities || {}, liabSecs);
  const totE = _sumEquity(bs.equity || {});

  const toM = (a) => a.map((v) => v / 1_000_000);
  const toArr = (obj, key) =>
    obj[key]?.map((v) => parseFloat(v) || 0) ?? Array(12).fill(0);

  return {
    debtToEquity: {
      actual:
        stored(solvency, "debtToEquity") ??
        totE.map((e, i) => (e !== 0 ? totL[i] / e : 0)),
    },
    debtToAssets: {
      actual:
        stored(solvency, "debtToAssets") ??
        totA.map((a, i) => (a !== 0 ? totL[i] / a : 0)),
    },
    equityRatio: {
      actual:
        stored(solvency, "equityRatio") ??
        totA.map((a, i) => (a !== 0 ? (totE[i] / a) * 100 : 0)),
    },
    interestCoverage: { actual: toArr(solvency, "interestCoverage") },
    debtServiceCoverage: { actual: toArr(solvency, "debtServiceCoverage") },
    nav: {
      actual: toM(stored(solvency, "nav") ?? totA.map((a, i) => a - totL[i])),
    },
    totalDebtRatio: { actual: toArr(leverage, "totalDebtRatio") },
    longTermDebtRatio: { actual: toArr(leverage, "longTermDebtRatio") },
    equityMultiplier: { actual: toArr(leverage, "equityMultiplier") },
    returnOnEquity: { actual: toArr(equity, "returnOnEquity") },
    bookValuePerShare: { actual: toArr(equity, "bookValuePerShare") },
    totalAssets: { actual: toM(totA) },
    totalLiabilities: { actual: toM(totL) },
    totalEquity: { actual: toM(totE) },
    totalBankAndCash: {
      actual: toM(_sumBSSections(bs.assets || {}, ["bank"])),
    },
    totalCurrentAssets: {
      actual: toM(_sumBSSections(bs.assets || {}, ["currentAssets"])),
    },
    totalFixedAssets: {
      actual: toM(_sumBSSections(bs.assets || {}, ["fixedAssets"])),
    },
    totalIntangibleAssets: {
      actual: toM(_sumBSSections(bs.assets || {}, ["intangibleAssets"])),
    },
    totalNonCurrentAssets: {
      actual: toM(_sumBSSections(bs.assets || {}, ["nonCurrentAssets"])),
    },
    totalCurrentLiabilities: {
      actual: toM(_sumBSSections(bs.liabilities || {}, ["currentLiabilities"])),
    },
    totalNonCurrentLiabilities: {
      actual: toM(
        _sumBSSections(bs.liabilities || {}, ["nonCurrentLiabilities"]),
      ),
    },
  };
};

export const getLast12MonthsCapitalStructure = ({
  uid,
  chartKey,
  getDocFn,
  docFn,
  db,
}) => {
  const { from, to } = getDefaultRange();
  return getRangeComputed({
    uid,
    docBase: "_capitalStructure",
    chartKey,
    fromYM: from,
    toYM: to,
    getDocFn,
    docFn,
    db,
    processor: computeCapitalStructureChartData,
  });
};