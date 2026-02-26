// ==================== CONSTANTS ====================

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

// Always Jan→Dec for month picker dropdowns
export const getMonthsForYear = (year, financialYearStart = "Jan") => MONTHS

// Financial-year ordered months (for data array indexing & column headers in Add Data modal)
export const getFYMonths = (year, financialYearStart = "Jan") => {
  const startIndex = MONTHS.indexOf(financialYearStart)
  if (startIndex === -1) return MONTHS
  return [...MONTHS.slice(startIndex), ...MONTHS.slice(0, startIndex)]
}

export const getYearsRange = (startYear = 2021, endYear = 2030) => {
  const years = []
  for (let year = startYear; year <= endYear; year++) years.push(year)
  return years
}

export const CURRENCY_UNITS = [
  { value: "zar", label: "ZAR" },
  { value: "zar_thousand", label: "R K" },
  { value: "zar_million", label: "R m" },
  { value: "zar_billion", label: "R bn" },
]

export const VIEW_MODES = [
  { id: "month", label: "Monthly" },
  { id: "quarter", label: "Quarterly" },
  { id: "year", label: "Yearly" },
]

export const CALCULATION_TEXTS = {
  performance: {
    sales: "Sales / Revenue: Total income from goods sold or services rendered.\n\nCalculation: Sum of all sales invoices for the period.",
    cogs: "Cost of Goods Sold: Direct costs attributable to production.\n\nCalculation: Opening Inventory + Purchases - Closing Inventory",
    opex: "Operating Expenses: Costs to run daily operations.\n\nCalculation: Salaries + Rent + Utilities + Marketing + Admin + Other",
    grossProfit: "Gross Profit = Sales - Cost of Goods Sold\n\nShows profitability of core products/services before operating expenses.",
    ebitda: "EBITDA = Gross Profit - Operating Expenses\n\nEarnings Before Interest, Taxes, Depreciation & Amortization",
    ebit: "EBIT = EBITDA - Depreciation - Amortization\n\nEarnings Before Interest & Taxes",
    netProfit: "Net Profit = EBIT + Interest Income - Interest Expense - Tax\n\nBottom-line profit after all expenses.",
    gpMargin: "Gross Profit Margin = (Gross Profit ÷ Sales) × 100%\n\nMeasures production efficiency and pricing power.",
    npMargin: "Net Profit Margin = (Net Profit ÷ Sales) × 100%\n\nMeasures overall profitability after all expenses.",
  },
  costAgility: {
    fixedCosts: "Fixed Costs: Costs that remain constant regardless of production volume.\n\nExamples: Rent, Salaries, Insurance, Depreciation",
    variableCosts: "Variable Costs: Costs that vary directly with production volume.\n\nExamples: Raw materials, Direct labor, Sales commissions",
    discretionaryCosts: "Discretionary Costs: Non-essential costs that can be reduced or eliminated.\n\nExamples: Advertising, R&D, Training, Bonuses",
    semiVariableCosts: "Semi-Variable Costs: Costs with both fixed and variable components.\n\nExamples: Utilities, Maintenance, Phone bills",
    lockInDuration: "Lock-in Duration: Average time fixed costs are committed.\n\nCalculation: Weighted average of contract terms (months)",
    fixedVariableRatio: "Fixed/Variable Ratio = (Fixed Costs ÷ Total Costs) × 100%\n\nHigher ratio indicates less cost flexibility",
    discretionaryPercentage: "Discretionary % = (Discretionary Costs ÷ Total Costs) × 100%\n\nIndicates capacity to reduce costs quickly",
  },
  liquidity: {
    currentRatio: "Current Ratio = Current Assets ÷ Current Liabilities\n\nMeasures ability to pay short-term obligations.\n\nHealthy range: 1.5 - 3.0",
    quickRatio: "Quick Ratio = (Current Assets - Inventory) ÷ Current Liabilities\n\nMeasures ability to pay immediate obligations.\n\nHealthy range: 1.0 - 2.0",
    cashRatio: "Cash Ratio = (Cash + Cash Equivalents) ÷ Current Liabilities\n\nMost conservative liquidity measure.\n\nHealthy range: 0.5 - 1.0",
    burnRate: "Burn Rate = Average monthly cash outflow\n\nHow quickly the company spends cash.\n\nCalculation: (Beginning Cash - Ending Cash) ÷ Months",
    cashCover: "Cash Cover = Cash Balance ÷ Burn Rate\n\nMonths of operation without additional funding.\n\nTarget: > 6 months",
    cashflow: "Free Cashflow = Operating Cashflow - Capital Expenditures\n\nCash available for distribution or reinvestment.",
    monthsRunway: "Months Runway = Cash Balance ÷ Burn Rate\n\nHow many months the company can operate at current burn rate.\n\nTarget: > 12 months",
    workingCapital: "Working Capital = Current Assets - Current Liabilities\n\nLiquidity available for day-to-day operations.",
  },
  capitalStructure: {
    solvency: "Solvency metrics assess long-term financial stability:\n\n• Debt to Equity = Total Liabilities ÷ Total Equity\n• Debt to Assets = Total Liabilities ÷ Total Assets\n• Equity Ratio = Total Equity ÷ Total Assets\n• Interest Coverage = EBIT ÷ Interest Expense\n• Debt Service Coverage = Operating Income ÷ Total Debt Service\n• Net Asset Value = Total Assets - Total Liabilities",
    leverage: "Leverage metrics measure debt usage:\n\n• Total Debt Ratio = Total Liabilities ÷ Total Assets\n• Long-term Debt Ratio = Long-term Debt ÷ Total Assets\n• Equity Multiplier = Total Assets ÷ Total Equity",
    equity: "Equity metrics measure shareholder value:\n\n• Return on Equity = Net Income ÷ Average Shareholders' Equity\n• Book Value per Share = (Total Equity - Preferred Equity) ÷ Number of Shares Outstanding",
  },
}

export const EMPTY_BALANCE_SHEET = {
  assets: {
    bank: {
      callAccounts: Array(12).fill(""),
      currentAccount: Array(12).fill(""),
      pettyCash: Array(12).fill(""),
      moneyMarket: Array(12).fill(""),
    },
    currentAssets: {
      accountsReceivable: Array(12).fill(""),
      tradeReceivables: Array(12).fill(""),
      otherReceivables: Array(12).fill(""),
      inventory: Array(12).fill(""),
      prepaidExpenses: Array(12).fill(""),
      deposits: Array(12).fill(""),
      cash: Array(12).fill(""),
      callAccounts: Array(12).fill(""),
      shortTermInvestments: Array(12).fill(""),
    },
    fixedAssets: {
      land: Array(12).fill(""),
      buildings: Array(12).fill(""),
      lessDepreciationBuildings: Array(12).fill(""),
      computerEquipment: Array(12).fill(""),
      lessDepreciationComputer: Array(12).fill(""),
      vehicles: Array(12).fill(""),
      lessDepreciationVehicles: Array(12).fill(""),
      furniture: Array(12).fill(""),
      lessDepreciationFurniture: Array(12).fill(""),
      machinery: Array(12).fill(""),
      lessDepreciationMachinery: Array(12).fill(""),
      otherPropertyPlantEquipment: Array(12).fill(""),
      lessDepreciationOther: Array(12).fill(""),
      assetsUnderConstruction: Array(12).fill(""),
      totalFixedAssets: Array(12).fill(""),
    },
    intangibleAssets: {
      goodwill: Array(12).fill(""),
      trademarks: Array(12).fill(""),
      patents: Array(12).fill(""),
      software: Array(12).fill(""),
      customerLists: Array(12).fill(""),
      lessAmortization: Array(12).fill(""),
    },
    nonCurrentAssets: {
      loans: Array(12).fill(""),
      loanAccount: Array(12).fill(""),
      investments: Array(12).fill(""),
      deferredTaxAssets: Array(12).fill(""),
    },
    additionalMetrics: {
      trainingSpend: Array(12).fill(""),
      hdiSpent: Array(12).fill(""),
      labourCost: Array(12).fill(""),
      revenuePerEmployee: Array(12).fill(""),
      numberOfEmployees: Array(12).fill(""),
      marketingSpend: Array(12).fill(""),
      rAndDSpend: Array(12).fill(""),
    },
    customCategories: [],
  },
  liabilities: {
    currentLiabilities: {
      accountsPayable: Array(12).fill(""),
      tradePayables: Array(12).fill(""),
      accruedExpenses: Array(12).fill(""),
      shortTermDebt: Array(12).fill(""),
      currentPortionLongTermDebt: Array(12).fill(""),
      incomeReceivedInAdvance: Array(12).fill(""),
      provisionIntercompany: Array(12).fill(""),
      provisionForLeavePay: Array(12).fill(""),
      provisionForBonuses: Array(12).fill(""),
      salaryControlMedicalFund: Array(12).fill(""),
      salaryControlPAYE: Array(12).fill(""),
      salaryControlPensionFund: Array(12).fill(""),
      salaryControlSalaries: Array(12).fill(""),
      vatLiability: Array(12).fill(""),
      otherTaxesPayable: Array(12).fill(""),
    },
    nonCurrentLiabilities: {
      longTermDebt: Array(12).fill(""),
      thirdPartyLoans: Array(12).fill(""),
      intercompanyLoans: Array(12).fill(""),
      directorsLoans: Array(12).fill(""),
      deferredTaxLiabilities: Array(12).fill(""),
      leaseLiabilities: Array(12).fill(""),
      provisions: Array(12).fill(""),
      totalNonCurrentLiabilities: Array(12).fill(""),
    },
  },
  equity: {
    shareCapital: Array(12).fill(""),
    capital: Array(12).fill(""),
    additionalPaidInCapital: Array(12).fill(""),
    retainedEarnings: Array(12).fill(""),
    currentYearEarnings: Array(12).fill(""),
    reserves: Array(12).fill(""),
    treasuryShares: Array(12).fill(""),
    ownerAContribution: Array(12).fill(""),
    ownerAShare: Array(12).fill(""),
    ownerBContribution: Array(12).fill(""),
    ownerBShare: Array(12).fill(""),
    otherEquity: Array(12).fill(""),
  },
  customLiabilitiesCategories: [],
  customEquityCategories: [],
}

export const EMPTY_PNL = {
  sales: Array(12).fill(""),
  salesBudget: Array(12).fill(""),
  cogs: Array(12).fill(""),
  cogsBudget: Array(12).fill(""),
  opex: Array(12).fill(""),
  opexBudget: Array(12).fill(""),
  salaries: Array(12).fill(""),
  salariesBudget: Array(12).fill(""),
  rent: Array(12).fill(""),
  rentBudget: Array(12).fill(""),
  utilities: Array(12).fill(""),
  utilitiesBudget: Array(12).fill(""),
  marketing: Array(12).fill(""),
  marketingBudget: Array(12).fill(""),
  admin: Array(12).fill(""),
  adminBudget: Array(12).fill(""),
  otherExpenses: Array(12).fill(""),
  otherExpensesBudget: Array(12).fill(""),
  ebitda: Array(12).fill(""),
  ebitdaBudget: Array(12).fill(""),
  depreciation: Array(12).fill(""),
  depreciationBudget: Array(12).fill(""),
  amortization: Array(12).fill(""),
  amortizationBudget: Array(12).fill(""),
  ebit: Array(12).fill(""),
  ebitBudget: Array(12).fill(""),
  interestExpense: Array(12).fill(""),
  interestExpenseBudget: Array(12).fill(""),
  interestIncome: Array(12).fill(""),
  interestIncomeBudget: Array(12).fill(""),
  tax: Array(12).fill(""),
  taxBudget: Array(12).fill(""),
  netProfit: Array(12).fill(""),
  netProfitBudget: Array(12).fill(""),
  notes: "",
}