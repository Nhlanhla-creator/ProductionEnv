// ==================== MONTH CONSTANTS ====================
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

// ==================== LAST 12 MONTHS UTILITIES ====================

/**
 * Returns an array of 12 { monthName, year, fyYear, fyIndex } objects
 * representing the last 12 calendar months ending with the current month.
 * fyYear = the financial year doc key year (the year the FY started)
 * fyIndex = 0-based index within that FY's 12-slot array
 *
 * @param {string} financialYearStart - e.g. "Jan", "Mar", "Jul"
 */
export const getLast12MonthsMeta = (financialYearStart = "Jan") => {
  const fyStartIdx = MONTH_NAMES.indexOf(financialYearStart)
  const now = new Date()
  const result = []

  for (let offset = 11; offset >= 0; offset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const calMonth = d.getMonth()   // 0-based calendar month
    const calYear  = d.getFullYear()

    // Which FY does this calendar month belong to?
    // A month belongs to FY starting in fyStartIdx.
    // If calMonth >= fyStartIdx → FY started this calYear
    // If calMonth <  fyStartIdx → FY started last calYear
    const fyYear = calMonth >= fyStartIdx ? calYear : calYear - 1

    // Position within the FY array
    const fyIndex = (calMonth - fyStartIdx + 12) % 12

    result.push({
      label:   `${MONTH_NAMES[calMonth]} ${calYear}`,
      monthName: MONTH_NAMES[calMonth],
      calYear,
      fyYear,
      fyIndex,
    })
  }
  return result
}

/**
 * Build the x-axis labels for the last 12 months in "MMM YYYY" format.
 */
export const getLast12MonthsLabels = (financialYearStart = "Jan") =>
  getLast12MonthsMeta(financialYearStart).map(m => m.label)

/**
 * Fetches actual & budget arrays for the last 12 calendar months
 * from potentially 2 year-keyed Firestore documents.
 *
 * @param {string} uid        - user uid
 * @param {string} docBase    - base doc name e.g. "_pnlManual"
 * @param {string} actualKey  - field name for actual values in Firestore doc
 * @param {string} budgetKey  - field name for budget values (or null)
 * @param {string} financialYearStart
 * @param {Function} getDocFn - Firestore getDoc
 * @param {Function} docFn    - Firestore doc
 * @param {Object}  db        - Firestore db instance
 * @param {Function} [processor] - optional fn(rawDocData) → { actual: [], budget: [] }
 *                                 Use when computed fields (e.g. grossProfit) are needed.
 */
export const getLast12MonthsData = async ({
  uid, docBase, actualKey, budgetKey = null,
  financialYearStart = "Jan", getDocFn, docFn, db, processor = null,
}) => {
  const meta = getLast12MonthsMeta(financialYearStart)

  // Collect unique FY years we need
  const fyYears = [...new Set(meta.map(m => m.fyYear))]

  // Load each year's doc once
  const docCache = {}
  await Promise.all(fyYears.map(async (fy) => {
    try {
      // 1. Try exact year-keyed doc
      let snap = await getDocFn(docFn(db, "financialData", `${uid}${docBase}_${fy}`))
      // 2. Try next FY year's doc (overlap months from prior FY are stored in the later doc)
      if (!snap.exists()) snap = await getDocFn(docFn(db, "financialData", `${uid}${docBase}_${fy + 1}`))
      // 3. Fall back to legacy doc (no year suffix)
      if (!snap.exists()) snap = await getDocFn(docFn(db, "financialData", `${uid}${docBase}`))
      docCache[fy] = snap.exists() ? snap.data() : null
    } catch {
      docCache[fy] = null
    }
  }))

  // Build output arrays
  const actual = []
  const budget = []

  for (const { fyYear, fyIndex } of meta) {
    const raw = docCache[fyYear]
    if (raw) {
      const rawA = actualKey ? raw[actualKey]?.[fyIndex] : undefined
      const rawB = budgetKey ? raw[budgetKey]?.[fyIndex] : undefined
      actual.push(rawA !== undefined && rawA !== "" && rawA !== null ? parseFloat(rawA) : null)
      budget.push(rawB !== undefined && rawB !== "" && rawB !== null ? parseFloat(rawB) : null)
    } else {
      actual.push(null)
      budget.push(null)
    }
  }

  return { actual, budget: budgetKey ? budget : null }
}

/**
 * Variant: accepts a processor function that transforms a raw Firestore doc
 * into a chart data map (like computePnlChartData), then extracts a single key.
 * Handles cross-year stitching for computed/derived fields.
 */
export const getLast12MonthsComputed = async ({
  uid, docBase, chartKey,
  financialYearStart = "Jan", getDocFn, docFn, db, processor,
}) => {
  const meta = getLast12MonthsMeta(financialYearStart)
  const fyYears = [...new Set(meta.map(m => m.fyYear))]

  const docCache = {}
  await Promise.all(fyYears.map(async (fy) => {
    try {
      // 1. Try exact year-keyed doc
      let snap = await getDocFn(docFn(db, "financialData", `${uid}${docBase}_${fy}`))
      // 2. Try next FY year's doc (overlap months from prior FY are stored in the later doc)
      if (!snap.exists()) snap = await getDocFn(docFn(db, "financialData", `${uid}${docBase}_${fy + 1}`))
      // 3. Fall back to legacy doc (no year suffix)
      if (!snap.exists()) snap = await getDocFn(docFn(db, "financialData", `${uid}${docBase}`))
      if (snap.exists()) {
        docCache[fy] = processor(snap.data())
      } else {
        docCache[fy] = null
      }
    } catch {
      docCache[fy] = null
    }
  }))

  const actual = []
  const budget = []

  for (const { fyYear, fyIndex } of meta) {
    const computed = docCache[fyYear]
    const entry = computed?.[chartKey]
    const a = entry?.actual?.[fyIndex]
    const b = entry?.budget?.[fyIndex]
    actual.push(a !== undefined && a !== null ? a : null)
    budget.push(b !== undefined && b !== null ? b : null)
  }

  return { actual, budget }
}

// ==================== FORMATTERS ====================

export const formatCurrency = (value, unit = "zar_million", decimals = 2) => {
  const num = parseFloat(value) || 0
  const opts = { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
  switch (unit) {
    case "zar":         return `R${num.toLocaleString(undefined, opts)}`
    case "zar_thousand":return `R${(num * 1000).toLocaleString(undefined, opts)}`
    case "zar_billion": return `R${(num / 1000).toLocaleString(undefined, opts)}`
    default:            return `R${num.toLocaleString(undefined, opts)}` // zar_million
  }
}

export const formatPercentage = (value, decimals = 2) =>
  `${(parseFloat(value) || 0).toFixed(decimals)}%`

export const makeFormatValue = (unit = "zar_million") =>
  (value, overrideUnit, decimals = 2) =>
    formatCurrency(value, overrideUnit ?? unit, decimals)

// ==================== CALCULATORS ====================

export const getMonthIndex = (month) => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return months.indexOf(month)
}

export const calculateAverage = (arr) => {
  if (!arr?.length) return 0
  const valid = arr.filter(v => v !== "" && !isNaN(parseFloat(v)))
  if (!valid.length) return 0
  return valid.reduce((sum, v) => sum + parseFloat(v), 0) / valid.length
}

export const calculateTotal = (items, monthIndex) => {
  if (!items || monthIndex < 0 || monthIndex >= 12) return 0
  return Object.values(items).reduce((sum, arr) => {
    if (!Array.isArray(arr) || arr.length <= monthIndex) return sum
    return sum + (parseFloat(arr[monthIndex]) || 0)
  }, 0)
}

export const aggregateDataForView = (data, viewMode) => {
  if (!data?.length) return data
  if (viewMode === "month") return data
  if (viewMode === "quarter") {
    return Array.from({ length: 4 }, (_, i) => {
      const slice = data.slice(i * 3, i * 3 + 3)
      return slice.reduce((a, b) => a + b, 0) / slice.length
    })
  }
  // year
  return [data.reduce((a, b) => a + b, 0) / data.length]
}

export const generateMonthLabels = (financialYearStart, viewMode, year) => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const startIndex = months.indexOf(financialYearStart)
  const ordered = [...months.slice(startIndex), ...months.slice(0, startIndex)]
  if (viewMode === "month")   return ordered
  if (viewMode === "quarter") return ["Q1","Q2","Q3","Q4"]
  return [String(year)]
}

// ==================== FIREBASE DATA PROCESSORS ====================

export const processBalanceSheetArrays = (data, fields, decimals = 2) =>
  Object.fromEntries(
    fields.map(f => [f, data[f]?.map(v => parseFloat(v).toFixed(decimals)) ?? Array(12).fill("")])
  )

export const processPnlFromFirebase = (firebaseData) => {
  const pnlFields = [
    "sales","salesBudget","cogs","cogsBudget","opex","opexBudget",
    "salaries","salariesBudget","rent","rentBudget","utilities","utilitiesBudget",
    "marketing","marketingBudget","admin","adminBudget","otherExpenses","otherExpensesBudget",
    "depreciation","depreciationBudget","amortization","amortizationBudget",
    "interestExpense","interestExpenseBudget","interestIncome","interestIncomeBudget",
    "tax","taxBudget",
  ]
  return {
    ...Object.fromEntries(
      pnlFields.map(f => [f, firebaseData[f]?.map(v => v.toFixed(2)) ?? Array(12).fill("")])
    ),
    notes: firebaseData.notes || "",
  }
}

export const computePnlChartData = (firebaseData) => {
  const parse  = (key) => firebaseData[key]?.map(v => parseFloat(v) || 0) ?? Array(12).fill(0)
  const sales  = parse("sales"),   cogs  = parse("cogs"),   opex  = parse("opex")
  const dep    = parse("depreciation"), amort = parse("amortization")
  const intExp = parse("interestExpense"), intInc = parse("interestIncome")
  const tax    = parse("tax")
  const salesB = parse("salesBudget"), cogsB = parse("cogsBudget"), opexB = parse("opexBudget")
  const depB   = parse("depreciationBudget"), amortB = parse("amortizationBudget")
  const intExpB= parse("interestExpenseBudget"), intIncB= parse("interestIncomeBudget")
  const taxB   = parse("taxBudget")

  const gp  = sales.map((s, i) => s - cogs[i])
  const gpB = salesB.map((s, i) => s - cogsB[i])
  const ebitda  = gp.map((g, i) => g - opex[i])
  const ebitdaB = gpB.map((g, i) => g - opexB[i])
  const ebit    = ebitda.map((e, i) => e - dep[i] - amort[i])
  const ebitB   = ebitdaB.map((e, i) => e - depB[i] - amortB[i])
  const np      = ebit.map((e, i) => e - intExp[i] + (intInc[i] || 0) - tax[i])
  const npB     = ebitB.map((e, i) => e - intExpB[i] + (intIncB[i] || 0) - taxB[i])
  const gpM     = sales.map((s, i) => s !== 0 ? (gp[i] / s) * 100 : 0)
  const gpMB    = salesB.map((s, i) => s !== 0 ? (gpB[i] / s) * 100 : 0)
  const npM     = sales.map((s, i) => s !== 0 ? (np[i] / s) * 100 : 0)
  const npMB    = salesB.map((s, i) => s !== 0 ? (npB[i] / s) * 100 : 0)

  const toM = arr => arr.map(v => v / 1_000_000)
  return {
    sales:       { actual: toM(sales),  budget: toM(salesB) },
    cogs:        { actual: toM(cogs),   budget: toM(cogsB)  },
    opex:        { actual: toM(opex),   budget: toM(opexB)  },
    grossProfit: { actual: toM(gp),     budget: toM(gpB)    },
    ebitda:      { actual: toM(ebitda), budget: toM(ebitdaB)},
    ebit:        { actual: toM(ebit),   budget: toM(ebitB)  },
    netProfit:   { actual: toM(np),     budget: toM(npB)    },
    gpMargin:    { actual: gpM,         budget: gpMB        },
    npMargin:    { actual: npM,         budget: npMB        },
  }
}

export const computeCostChartData = (firebaseData) => {
  const parse = (key) => firebaseData[key]?.map(v => parseFloat(v) || 0) ?? Array(12).fill(0)
  const fixed       = parse("fixedCosts")
  const variable    = parse("variableCosts")
  const discretion  = parse("discretionaryCosts")
  const semiVar     = parse("semiVariableCosts")
  const lockIn      = parse("lockInDuration")
  const total       = fixed.map((f, i) => f + variable[i] + semiVar[i])
  const fvRatio     = total.map((t, i) => t !== 0 ? (fixed[i] / t) * 100 : 0)
  const discPct     = total.map((t, i) => t !== 0 ? (discretion[i] / t) * 100 : 0)
  const toM = arr => arr.map(v => v / 1_000_000)
  return {
    fixedCosts:             { actual: toM(fixed)      },
    variableCosts:          { actual: toM(variable)   },
    discretionaryCosts:     { actual: toM(discretion) },
    semiVariableCosts:      { actual: toM(semiVar)    },
    lockInDuration:         { actual: lockIn          },
    totalCosts:             { actual: toM(total)      },
    fixedVariableRatio:     { actual: fvRatio         },
    discretionaryPercentage:{ actual: discPct         },
  }
}

export const computeLiquidityChartData = (firebaseData) => {
  const parse = (key) => firebaseData[key]?.map(v => parseFloat(v) || 0) ?? Array(12).fill(0)
  const burnRate   = parse("burnRate")
  const cashBal    = parse("cashBalance")
  const runway     = burnRate.map((b, i) => b !== 0 ? cashBal[i] / b : 0)
  const toM = arr => arr.map(v => v / 1_000_000)
  return {
    currentRatio: { actual: parse("currentRatio") },
    quickRatio:   { actual: parse("quickRatio")   },
    cashRatio:    { actual: parse("cashRatio")    },
    burnRate:     { actual: toM(burnRate)          },
    cashCover:    { actual: parse("cashCover")    },
    cashflow:     { actual: toM(parse("cashflow")) },
    loanRepayments:{ actual: toM(parse("loanRepayments")) },
    cashBalance:  { actual: toM(cashBal)           },
    workingCapital:{ actual: toM(parse("workingCapital")) },
    monthsRunway: { actual: runway                 },
  }
}

// ==================== CAPITAL STRUCTURE PROCESSOR ====================
// Sums all sub-section arrays for a given balance-sheet group (assets / liabilities / equity)

const _sumBSSections = (group = {}, sections) =>
  Array.from({ length: 12 }, (_, i) =>
    (sections ?? Object.keys(group)).reduce((total, sec) => {
      const block = group[sec] || {}
      return total + Object.values(block).reduce((s, arr) => {
        if (!Array.isArray(arr)) return s
        const v = parseFloat(arr[i])
        return s + (isNaN(v) ? 0 : v)
      }, 0)
    }, 0)
  )

const _sumEquity = (equity = {}) =>
  Array.from({ length: 12 }, (_, i) =>
    Object.values(equity).reduce((sum, arr) => {
      if (!Array.isArray(arr)) return sum
      const v = parseFloat(arr[i])
      return sum + (isNaN(v) ? 0 : v)
    }, 0)
  )

/**
 * Transforms a raw capital-structure Firestore doc into the chart-data format
 * expected by getLast12MonthsComputed.
 *
 * Priority for solvency / leverage / equity ratios:
 *   1. Stored pre-computed values (solvencyData / leverageData / equityData arrays)
 *   2. Computed on the fly from balanceSheetData if stored values are all zero/absent
 */
export const computeCapitalStructureChartData = (firebaseData) => {
  const solvency = firebaseData.solvencyData     || {}
  const leverage = firebaseData.leverageData     || {}
  const equity   = firebaseData.equityData       || {}
  const bs       = firebaseData.balanceSheetData || {}

  // Helper: parse a stored array, returns null if the array is missing or all zeros
  const stored = (obj, key) => {
    const arr = obj[key]
    if (!Array.isArray(arr)) return null
    const parsed = arr.map(v => parseFloat(v) || 0)
    return parsed.some(v => v !== 0) ? parsed : null
  }

  // Balance-sheet totals (always computed so trend totals work)
  const assetSections  = ['bank', 'currentAssets', 'fixedAssets', 'intangibleAssets', 'nonCurrentAssets']
  const liabSections   = ['currentLiabilities', 'nonCurrentLiabilities']
  const totalAssets      = _sumBSSections(bs.assets      || {}, assetSections)
  const totalLiabilities = _sumBSSections(bs.liabilities || {}, liabSections)
  const totalEquity      = _sumEquity(bs.equity || {})

  // Derived ratios from balance sheet (fallback)
  const navCalc          = totalAssets.map((a, i) => a - totalLiabilities[i])
  const equityRatioCalc  = totalAssets.map((a, i) => a !== 0 ? (totalEquity[i] / a) * 100 : 0)
  const debtToEquityCalc = totalEquity.map((e, i) => e !== 0 ? totalLiabilities[i] / e : 0)
  const debtToAssetsCalc = totalAssets.map((a, i) => a !== 0 ? totalLiabilities[i] / a : 0)

  const toM  = arr => arr.map(v => v / 1_000_000)
  const toArr = (obj, key) => obj[key]?.map(v => parseFloat(v) || 0) ?? Array(12).fill(0)

  return {
    // ── Solvency ──────────────────────────────────────────────────────────────
    debtToEquity:        { actual: stored(solvency, 'debtToEquity')        ?? debtToEquityCalc },
    debtToAssets:        { actual: stored(solvency, 'debtToAssets')        ?? debtToAssetsCalc },
    equityRatio:         { actual: stored(solvency, 'equityRatio')         ?? equityRatioCalc  },
    interestCoverage:    { actual: toArr(solvency, 'interestCoverage')     },
    debtServiceCoverage: { actual: toArr(solvency, 'debtServiceCoverage')  },
    nav:                 { actual: toM(stored(solvency, 'nav')             ?? navCalc) },

    // ── Leverage ──────────────────────────────────────────────────────────────
    totalDebtRatio:      { actual: toArr(leverage, 'totalDebtRatio')   },
    longTermDebtRatio:   { actual: toArr(leverage, 'longTermDebtRatio') },
    equityMultiplier:    { actual: toArr(leverage, 'equityMultiplier')  },

    // ── Equity ────────────────────────────────────────────────────────────────
    returnOnEquity:      { actual: toArr(equity, 'returnOnEquity')    },
    bookValuePerShare:   { actual: toArr(equity, 'bookValuePerShare')  },

    // ── Balance-sheet totals (for trend lines on the BS summary cards) ────────
    totalAssets:         { actual: toM(totalAssets)      },
    totalLiabilities:    { actual: toM(totalLiabilities) },
    totalEquity:         { actual: toM(totalEquity)       },

    // ── Per-section totals ────────────────────────────────────────────────────
    totalBankAndCash:           { actual: toM(_sumBSSections(bs.assets      || {}, ['bank']))                   },
    totalCurrentAssets:         { actual: toM(_sumBSSections(bs.assets      || {}, ['currentAssets']))          },
    totalFixedAssets:           { actual: toM(_sumBSSections(bs.assets      || {}, ['fixedAssets']))            },
    totalIntangibleAssets:      { actual: toM(_sumBSSections(bs.assets      || {}, ['intangibleAssets']))       },
    totalNonCurrentAssets:      { actual: toM(_sumBSSections(bs.assets      || {}, ['nonCurrentAssets']))       },
    totalCurrentLiabilities:    { actual: toM(_sumBSSections(bs.liabilities || {}, ['currentLiabilities']))     },
    totalNonCurrentLiabilities: { actual: toM(_sumBSSections(bs.liabilities || {}, ['nonCurrentLiabilities'])) },
  }
}

/**
 * Convenience wrapper: fetches last-12-months capital-structure data with cross-FY stitching.
 * Drop-in equivalent of getLast12MonthsComputed but pre-wired to the capital structure doc.
 */
export const getLast12MonthsCapitalStructure = ({
  uid, chartKey, financialYearStart = "Jan", getDocFn, docFn, db,
}) =>
  getLast12MonthsComputed({
    uid,
    docBase: "_capitalStructure",
    chartKey,
    financialYearStart,
    getDocFn,
    docFn,
    db,
    processor: computeCapitalStructureChartData,
  })