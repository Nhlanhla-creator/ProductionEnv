// ─────────────────────────────────────────────────────────────────────────
// CAPITAL APPEAL — DETERMINISTIC SCORING AND POTENTIAL POINTS
//
// WHAT CHANGED, AND WHY IT HAD TO
//
//   Financial Strength is 40% of this score and Impact & Mandate is another
//   9–34% of the fundability block. Both came out of parseAiEvaluationScores
//   — a number the model wrote in prose, re-parsed on every run. The card's
//   own About panel said as much of Financial Strength: "this weighting is
//   not applied programmatically to sub-scores — it guides the AI's single
//   overall rating."
//
//   That is incompatible with telling a business "+3.4% if you capture your
//   balance sheet". The model could return a different number next run, so
//   the promise would be a guess with a decimal point on it.
//
//   So the weighting table the card already documented is now the actual
//   arithmetic. Revenue & Profitability 30, Financial Records 25, Balance
//   Sheet 20, Debt & Liability 15, Credit History 10 — applied in code,
//   against literal fields on financialOverview. Impact & Mandate the same,
//   against socialImpact. The AI never touches a number; it explains the
//   finished ones.
//
//   Everything else was already deterministic and read from Firestore
//   (business plan, pitch deck, credit report, guarantees, solvency, growth
//   potential). Those are unchanged — they are simply now the whole picture
//   rather than most of it.
//
// NOT EVERYTHING WITHHELD IS CLAIMABLE
//
//   A credit score band is what your credit record says. Uploading the
//   report is an action; being in a better band is not. Those points show
//   as a fixed deduction and stay out of Potential points, the same way a
//   disclosed incident does on the Operational Strength card.
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// WHERE EACH SECTION ACTUALLY LIVES
//
// Two different pages, and getting this wrong sends a business to a form
// that does not contain the field you told them to fill in.
//
//   /profile             — the universal profile. Financial Overview is here.
//   /applications/funding — the funding application. Everything in
//                           requiredFundingSections is here: applicationOverview,
//                           useOfFunds, enterpriseReadiness, guarantees,
//                           growthPotential, socialImpact, documentUpload,
//                           declarationCommitment.
//   /my-documents         — document uploads.
//
// The split is not cosmetic: Social Impact and Growth Potential feed this
// score but are captured on the funding application, not the profile.
// ─────────────────────────────────────────────────────────────────────────

const PROFILE_ROUTE = "/profile"
const FUNDING_ROUTE = "/applications/funding"
const DOCUMENTS_ROUTE = "/my-documents"

export const SECTION_TARGETS = {
  // Universal profile
  "Financial Overview": `${PROFILE_ROUTE}?section=financialOverview`,

  // Funding application
  "Social Impact": `${FUNDING_ROUTE}?section=socialImpact`,
  "Growth Potential": `${FUNDING_ROUTE}?section=growthPotential`,
  Guarantees: `${FUNDING_ROUTE}?section=guarantees`,
  "Use of Funds": `${FUNDING_ROUTE}?section=useOfFunds`,
  "Enterprise Readiness": `${FUNDING_ROUTE}?section=enterpriseReadiness`,
  "Application Overview": `${FUNDING_ROUTE}?section=applicationOverview`,
  "Document Upload": `${FUNDING_ROUTE}?section=documentUpload`,

  // Documents
  "My Documents": DOCUMENTS_ROUTE,
}

// My Documents filters rows by the exact document LABEL, so the deep link
// carries the label rather than a category.
const DOC_LINKS = {
  businessPlan: `${DOCUMENTS_ROUTE}?doc=business_plan&search=${encodeURIComponent("Business Plan")}`,
  pitchDeck: `${DOCUMENTS_ROUTE}?doc=pitch_deck&search=${encodeURIComponent("Pitch Deck")}`,
  creditReport: `${DOCUMENTS_ROUTE}?doc=credit_report&search=${encodeURIComponent("Credit Report")}`,
  financials: `${DOCUMENTS_ROUTE}?doc=financial_statements&search=${encodeURIComponent("Financial Statements")}`,
  guarantees: `${DOCUMENTS_ROUTE}?doc=guarantee_collateral&search=${encodeURIComponent("Guarantee/Collateral")}`,
}

export const routeFor = (section, field) => {
  if (DOC_LINKS[field]) return DOC_LINKS[field]
  const base = SECTION_TARGETS[section]
  if (!base) return null
  if (!field) return base
  return `${base}${base.includes("?") ? "&" : "?"}field=${encodeURIComponent(field)}`
}

const cleanStr = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim())
const answered = (v) => cleanStr(v) !== "" && cleanStr(v).toLowerCase() !== "not provided"
const isYes = (v) => v === true || /^yes$/i.test(cleanStr(v))
const num = (v) => {
  const n = parseFloat(cleanStr(v).replace(/[^\d.-]/g, ""))
  return Number.isFinite(n) ? n : null
}
const pos = (v) => {
  const n = num(v)
  return n !== null && n > 0 ? n : null
}

// ── One scored answer ──
const mk = ({
  key, label, points, section, field, importance, guidance,
  credit, evidence, reason, fix, claimable = true, applicable = true,
}) => {
  const c = Math.max(0, Math.min(1, credit || 0))
  const earned = Math.round(points * c)
  return {
    key, label, points, section, field, importance, guidance,
    credit: c, earned, withheld: points - earned,
    evidence: evidence || "", reason: reason || null, fix: fix || null,
    claimable, applicable,
    route: routeFor(section, field),
    state: c >= 1 ? "counted" : c > 0 ? "partial" : "missing",
  }
}

const scale = (v, map) => (answered(v) ? map[cleanStr(v).toLowerCase()] ?? 0 : 0)

// ═════════════════════════════════════════════════════════════════════════
// 1. FINANCIAL STRENGTH — the card's own documented weighting, now applied
// ═════════════════════════════════════════════════════════════════════════

export const FINANCIAL_STRENGTH_WEIGHTS = {
  revenue: 30,
  records: 25,
  balanceSheet: 20,
  debt: 15,
  credit: 10,
}

// ─────────────────────────────────────────────────────────────────────────
// FINANCIAL STATEMENTS ANALYSIS — aiFinancialEvaluations/{userId}
//
// A real document was read and scored: evaluation.breakdown carries
// revenueGrowth, profitability, cashFlow, debtManagement and
// financialControls, each out of 5, plus a written summary and the file
// itself under files[].
//
// Each of those five maps cleanly onto a Financial Strength sub-category, so
// the read statements become the evidence layer underneath the self-reported
// fields rather than a separate score bolted on the side:
//
//   revenueGrowth + profitability → Revenue & Profitability
//   financialControls             → Financial Records & Governance
//   cashFlow                      → Balance Sheet Strength
//   debtManagement                → Debt & Liability Position
//
// These are NOT claimable. They follow what the statements say. Uploading
// statements is the action; what the numbers in them show is not.
// ─────────────────────────────────────────────────────────────────────────
const readStatements = (analysis) => {
  const b = analysis?.breakdown || {}
  const files = Array.isArray(analysis?.files) ? analysis.files : []
  const statementFiles = files.filter((f) =>
    /financial statement/i.test(cleanStr(f?.category)) || /financialstatements/i.test(cleanStr(f?.name))
  )
  const has = !!analysis && (statementFiles.length > 0 || Object.keys(b).length > 0)

  // The summary routinely names differences between the self-reported profile
  // figures and the audited statements. That is a finding a funder will make
  // in due diligence, so it is surfaced rather than smoothed over.
  const summary = cleanStr(analysis?.summary) || cleanStr(analysis?.content)
  const hasDiscrepancy = /discrepan|differ|mismatch|vs\s*R|inconsisten/i.test(summary)

  return {
    present: has,
    breakdown: b,
    overallScore: num(analysis?.overallScore),
    summary,
    hasDiscrepancy: has && hasDiscrepancy,
    fileCount: statementFiles.length,
    fileNames: statementFiles.map((f) => cleanStr(f?.name)).filter(Boolean),
    modelVersion: cleanStr(analysis?.modelVersion),
    evaluatedAt: cleanStr(analysis?.evaluatedAt) || cleanStr(analysis?.createdAt),
  }
}

// One item per sub-category, sourced from the statements the analysis read.
const statementItem = ({ key, label, points, metrics, stmt, importance }) => {
  const scores = metrics.map((m) => num(stmt.breakdown?.[m])).filter((n) => n !== null)
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null

  if (!stmt.present || avg === null) {
    return mk({
      key, label, points,
      section: "My Documents", field: "financials",
      importance,
      guidance: "Upload your annual financial statements — they are read and scored, and what they show then backs every self-reported figure above.",
      credit: 0,
      reason: "No financial statements have been read, so nothing above is independently backed.",
      fix: "Upload your annual financial statements under My Documents.",
    })
  }

  return mk({
    key, label, points,
    section: "My Documents", field: "financials",
    applicable: true,
    claimable: false, // the statements say what they say
    importance,
    credit: avg / 5,
    evidence: `${(Math.round(avg * 10) / 10)}/5 from the statements analysis${stmt.fileNames.length ? ` (${stmt.fileNames[0]})` : ""}`,
    reason: avg < 5
      ? "Read from the statements you uploaded. These points follow the figures in them, not the profile — they move when the next set of statements does."
      : null,
  })
}

const buildFinancialStrength = (data, creditReportAnalysis, statementsAnalysis) => {
  const f = data?.financialOverview || {}
  const S = "Financial Overview"
  const stmt = readStatements(statementsAnalysis)

  // ── Revenue & Profitability (30) ──
  const turnover = pos(f.incomeTurnoverCurrent)
  const grossProfit = num(f.incomeGrossProfitCurrent)
  const grossMargin = turnover && grossProfit !== null ? (grossProfit / turnover) * 100 : null

  const revenueItems = [
    mk({
      key: "annualRevenue", label: "Annual revenue captured", points: 25,
      section: S, field: "annualRevenue",
      importance: "The first number any funder looks for. A blank here stops the assessment before it starts.",
      credit: pos(f.annualRevenue) ? 1 : 0,
      evidence: cleanStr(f.annualRevenue),
    }),
    mk({
      key: "generatesRevenue", label: "Revenue generation confirmed", points: 15,
      section: S, field: "generatesRevenue",
      importance: "Pre-revenue is fundable, but a funder needs to know which case they are looking at.",
      credit: isYes(f.generatesRevenue) ? 1 : answered(f.generatesRevenue) ? 0.3 : 0,
      evidence: cleanStr(f.generatesRevenue),
    }),
    mk({
      key: "profitability", label: "Profitability status", points: 20,
      section: S, field: "profitabilityStatus",
      importance: "Determines whether you are being assessed on capacity to repay or capacity to reach breakeven.",
      credit: scale(f.profitabilityStatus, { profitable: 1, breakeven: 0.6, "break-even": 0.6, loss: 0.25, "loss-making": 0.25 }),
      evidence: cleanStr(f.profitabilityStatus),
    }),
    mk({
      key: "revenueTrend", label: "Revenue trend over 12 months", points: 15,
      section: S, field: "revenueTrend",
      importance: "Direction matters more than level to most funders. A growing small business beats a shrinking larger one.",
      credit: scale(f.revenueTrend, { growing: 1, increasing: 1, stable: 0.65, flat: 0.65, declining: 0.25, decreasing: 0.25 }),
      evidence: cleanStr(f.revenueTrend),
    }),
    mk({
      key: "margins", label: "Gross margin readable from the income statement", points: 25,
      section: S, field: "incomeGrossProfitCurrent",
      importance: "Margin is what tells a funder whether growth in turnover will actually reach the bottom line.",
      guidance: "Capture turnover, cost of goods sold and gross profit for the current year — margin is worked out from those.",
      credit: grossMargin === null ? 0 : grossMargin >= 25 ? 1 : grossMargin >= 10 ? 0.7 : grossMargin > 0 ? 0.4 : 0.15,
      evidence: grossMargin !== null ? `Gross margin ${grossMargin.toFixed(1)}%` : "",
      reason: grossMargin === null ? "Turnover or gross profit is missing from the income statement, so no margin can be worked out." : null,
      fix: grossMargin === null ? "Capture turnover and gross profit for the current financial year under Financial Overview." : null,
    }),
    statementItem({
      key: "stmtProfitability", label: "Profitability and growth confirmed by the statements",
      points: 25, metrics: ["profitability", "revenueGrowth"], stmt,
      importance: "Self-reported margins are a claim. The same margins read off audited statements are evidence.",
    }),
  ]

  // ── Financial Records & Governance (25) ──
  const years = (f.financialStatementsYears || []).filter(Boolean).length
  const YEARS_TARGET = 3

  const recordsItems = [
    mk({
      key: "hasFinancials", label: "Financial statements available", points: 25,
      section: S, field: "hasFinancialStatements",
      importance: "Without statements a funder is taking your word for every number above.",
      credit: isYes(f.hasFinancialStatements) ? 1 : 0,
      evidence: cleanStr(f.hasFinancialStatements),
    }),
    mk({
      key: "financialYears", label: `Years of statements (${years} of ${YEARS_TARGET} expected)`, points: 20,
      section: S, field: "financialStatementsYears",
      importance: "Three years lets a funder see a trend rather than a snapshot.",
      credit: Math.min(years / YEARS_TARGET, 1),
      evidence: years ? (f.financialStatementsYears || []).join(", ") : "",
      fix: years < YEARS_TARGET ? `Add ${YEARS_TARGET - years} more year${YEARS_TARGET - years === 1 ? "" : "s"} of statements under Financial Overview.` : null,
    }),
    mk({
      key: "audited", label: "Audited or independently reviewed", points: 20,
      section: S, field: "financialsAudited",
      importance: "An independent review is what moves your numbers from claimed to credible.",
      guidance: "An independent review costs far less than a full audit and satisfies most funders below R10m.",
      credit: scale(f.financialsAudited, { audited_reviewed: 1, audited: 1, reviewed: 1, internally_prepared: 0.45, internal: 0.45 }),
      evidence: cleanStr(f.financialsAudited),
    }),
    mk({
      key: "booksUpToDate", label: "Books up to date", points: 15,
      section: S, field: "booksUpToDate",
      importance: "Out-of-date books are read as a business that does not know its own position.",
      credit: scale(f.booksUpToDate, { fully_up_to_date: 1, partially: 0.5, no: 0 }),
      evidence: cleanStr(f.booksUpToDate),
      reason: cleanStr(f.booksUpToDate) && cleanStr(f.booksUpToDate) !== "fully_up_to_date"
        ? cleanStr(f.booksUpToDateDetails) || "Books are not fully up to date."
        : null,
    }),
    mk({
      key: "accountingSoftware", label: "Accounting software in use", points: 10,
      section: S, field: "hasAccountingSoftware",
      importance: "Signals the numbers come from a system rather than a memory.",
      credit: isYes(f.hasAccountingSoftware) ? 1 : 0,
      evidence: isYes(f.hasAccountingSoftware) ? cleanStr(f.accountingSoftwareName) || "Yes" : cleanStr(f.hasAccountingSoftware),
    }),
    mk({
      key: "managementAccounts", label: "Management accounts produced", points: 10,
      section: S, field: "hasManagementAccounts",
      importance: "Monthly management accounts are the single clearest sign a business is run on its numbers.",
      credit: scale(f.hasManagementAccounts, { monthly: 1, occasionally: 0.5, none: 0 }),
      evidence: cleanStr(f.hasManagementAccounts),
    }),
    statementItem({
      key: "stmtControls", label: "Financial controls confirmed by the statements",
      points: 25, metrics: ["financialControls"], stmt,
      importance: "Whether the numbers come from a system with controls around it, judged from the statements themselves.",
    }),
  ]

  // ── Balance Sheet Strength (20) ──
  const totalAssets = pos(f.balanceTotalAssetsCurrent)
  const totalLiabs = num(f.balanceTotalLiabilitiesCurrent)
  const equity = num(f.balanceEquityCurrent)
  const currentAssets = num(f.balanceCurrentAssetsCurrent)
  const currentLiabs = pos(f.balanceCurrentLiabilitiesCurrent)
  const currentRatio = currentAssets !== null && currentLiabs ? currentAssets / currentLiabs : null

  const balanceItems = [
    mk({
      key: "totalAssets", label: "Total assets captured", points: 20,
      section: S, field: "balanceTotalAssetsCurrent",
      importance: "What the business owns is half of what a funder is lending against.",
      credit: totalAssets ? 1 : 0,
      evidence: totalAssets ? cleanStr(f.balanceTotalAssetsCurrent) : "",
    }),
    mk({
      key: "totalLiabilities", label: "Total liabilities captured", points: 15,
      section: S, field: "balanceTotalLiabilitiesCurrent",
      importance: "A blank here is read as an unknown obligation rather than as no obligation.",
      credit: totalLiabs !== null ? 1 : 0,
      evidence: totalLiabs !== null ? cleanStr(f.balanceTotalLiabilitiesCurrent) : "",
    }),
    mk({
      key: "equity", label: "Positive equity position", points: 30,
      section: S, field: "balanceEquityCurrent",
      importance: "Negative equity is the single most common reason a credit committee declines.",
      credit: equity === null ? 0 : equity > 0 ? 1 : 0.1,
      evidence: equity !== null ? cleanStr(f.balanceEquityCurrent) : "",
      reason: equity !== null && equity <= 0 ? "Equity is zero or negative — liabilities meet or exceed assets." : null,
      fix: equity === null ? "Capture the equity line from your balance sheet under Financial Overview." : null,
      claimable: !(equity !== null && equity <= 0), // capturing it is an action; being solvent is not
    }),
    mk({
      key: "currentRatio", label: "Current ratio at or above 1.0", points: 35,
      section: S, field: "balanceCurrentAssetsCurrent",
      importance: "Whether you can meet the next twelve months of obligations from the next twelve months of assets.",
      credit: currentRatio === null ? 0 : currentRatio >= 1.5 ? 1 : currentRatio >= 1 ? 0.8 : currentRatio >= 0.7 ? 0.4 : 0.15,
      evidence: currentRatio !== null ? `Current ratio ${currentRatio.toFixed(2)}` : "",
      reason: currentRatio === null
        ? "Current assets or current liabilities are missing, so liquidity cannot be assessed."
        : currentRatio < 1
        ? `Current ratio of ${currentRatio.toFixed(2)} means short-term obligations exceed short-term assets.`
        : null,
      fix: currentRatio === null ? "Capture current assets and current liabilities under Financial Overview." : null,
      claimable: currentRatio === null, // capturing is an action; the ratio itself is trading reality
    }),
    statementItem({
      key: "stmtCashFlow", label: "Cash flow position confirmed by the statements",
      points: 30, metrics: ["cashFlow"], stmt,
      importance: "Liquidity read off the actual cash flow statement rather than inferred from two balance-sheet lines.",
    }),
  ]

  // ── Debt & Liability Position (15) ──
  const debt = num(f.existingDebt)
  const debtToEquity = debt !== null && equity && equity > 0 ? debt / equity : null
  const overdraftUtil = num(f.overdraftUtilised)

  const debtItems = [
    mk({
      key: "existingDebt", label: "Existing debt declared", points: 20,
      section: S, field: "existingDebt",
      importance: "Undeclared debt found in due diligence ends an application. Declared debt rarely does.",
      credit: answered(f.existingDebt) ? 1 : 0,
      evidence: cleanStr(f.existingDebt),
    }),
    mk({
      key: "overdraft", label: "Overdraft facility and utilisation", points: 25,
      section: S, field: "hasOverdraft",
      importance: "A permanently maxed overdraft is read as working capital already exhausted.",
      credit: !answered(f.hasOverdraft)
        ? 0
        : !isYes(f.hasOverdraft)
        ? 1
        : overdraftUtil === null
        ? 0.5
        : overdraftUtil <= 60
        ? 1
        : overdraftUtil <= 85
        ? 0.6
        : 0.25,
      evidence: isYes(f.hasOverdraft)
        ? `${cleanStr(f.overdraftValue) || "facility"}${overdraftUtil !== null ? ` · ${overdraftUtil}% utilised` : ""}`
        : cleanStr(f.hasOverdraft),
      reason: isYes(f.hasOverdraft) && overdraftUtil === null ? "An overdraft is declared but utilisation is not recorded." : null,
      fix: isYes(f.hasOverdraft) && overdraftUtil === null ? "Record what percentage of the overdraft is currently drawn." : null,
    }),
    mk({
      key: "directorsSurety", label: "Directors' surety position declared", points: 15,
      section: S, field: "directorsSurety",
      importance: "Existing sureties limit what further security you can offer, so a funder asks early.",
      credit: answered(f.directorsSurety) ? 1 : 0,
      evidence: cleanStr(f.directorsSurety),
    }),
    mk({
      key: "debtorsCeded", label: "Debtor cession position declared", points: 15,
      section: S, field: "debtorsCeded",
      importance: "Already-ceded debtors cannot be pledged twice — a funder finds this in week two if not in week one.",
      credit: answered(f.debtorsCeded) ? 1 : 0,
      evidence: cleanStr(f.debtorsCeded),
    }),
    mk({
      key: "gearing", label: "Debt to equity within a lendable range", points: 25,
      section: S, field: "existingDebt",
      importance: "Above roughly 2:1 most lenders will want equity in before more debt.",
      credit: debtToEquity === null ? 0 : debtToEquity <= 1 ? 1 : debtToEquity <= 2 ? 0.7 : debtToEquity <= 3 ? 0.35 : 0.1,
      evidence: debtToEquity !== null ? `Debt to equity ${debtToEquity.toFixed(2)}` : "",
      reason: debtToEquity === null
        ? "Debt or equity is missing, so gearing cannot be worked out."
        : debtToEquity > 2
        ? `Gearing of ${debtToEquity.toFixed(2)} is above what most lenders will add to.`
        : null,
      fix: debtToEquity === null ? "Capture existing debt and the equity line under Financial Overview." : null,
      claimable: debtToEquity === null,
    }),
    statementItem({
      key: "stmtDebt", label: "Debt management confirmed by the statements",
      points: 25, metrics: ["debtManagement"], stmt,
      importance: "Serviceability and gearing as the statements report them, including facilities the profile may not list.",
    }),
  ]

  // ── Credit History (10) ──
  const cr = creditReportAnalysis
  const crValid = !!cr?.isValid
  const crRaw = cr?.score || 0
  const creditBand = !crRaw ? 0 : crRaw >= 750 ? 1 : crRaw >= 650 ? 0.8 : crRaw >= 550 ? 0.6 : crRaw >= 450 ? 0.4 : 0.2

  const creditItems = [
    mk({
      key: "creditReportOnFile", label: "Credit report on file", points: 50,
      section: "My Documents", field: "creditReport",
      importance: "Most lenders will not open a file without one, and it is the cheapest thing on this list to obtain.",
      guidance: "You are entitled to one free credit report a year from each bureau.",
      credit: crValid ? 1 : 0,
      evidence: crValid ? `${crRaw}/850${cr?.label ? ` · ${cr.label}` : ""}` : "",
      reason: cr && !cr.isCreditReport ? "The document uploaded was not recognised as a credit report." : null,
      fix: cr && !cr.isCreditReport ? "Upload the bureau report itself rather than a summary or statement." : null,
    }),
    mk({
      key: "creditBand", label: "Credit score band", points: 50,
      section: "My Documents", field: "creditReport",
      applicable: crValid,
      claimable: false, // your credit record is not a form field
      importance: "Read straight from the bureau score on the report you uploaded.",
      credit: creditBand,
      evidence: crValid ? `${crRaw}/850` : "",
      reason: crValid && creditBand < 1
        ? "These points follow your bureau score. They cannot be claimed by editing the profile — they move as the underlying credit record improves."
        : null,
    }),
  ]

  const subCategories = [
    { key: "revenue", label: "Revenue & Profitability", weight: FINANCIAL_STRENGTH_WEIGHTS.revenue, items: revenueItems },
    { key: "records", label: "Financial Records & Governance", weight: FINANCIAL_STRENGTH_WEIGHTS.records, items: recordsItems },
    { key: "balanceSheet", label: "Balance Sheet Strength", weight: FINANCIAL_STRENGTH_WEIGHTS.balanceSheet, items: balanceItems },
    { key: "debt", label: "Debt & Liability Position", weight: FINANCIAL_STRENGTH_WEIGHTS.debt, items: debtItems },
    { key: "credit", label: "Credit History", weight: FINANCIAL_STRENGTH_WEIGHTS.credit, items: creditItems },
  ]

  return { ...rollUpSubCategories(subCategories), statements: stmt }
}

// ═════════════════════════════════════════════════════════════════════════
// 2. IMPACT & MANDATE — deterministic, from socialImpact
// ═════════════════════════════════════════════════════════════════════════

const pctCredit = (v, target) => {
  const n = num(v)
  if (n === null) return 0
  return Math.min(n / target, 1)
}

const buildImpactMandate = (data) => {
  const s = data?.socialImpact || {}
  const S = "Social Impact"

  const items = [
    mk({
      key: "blackOwnership", label: "Black ownership", points: 20,
      section: S, field: "blackOwnership",
      importance: "The single most weighted mandate criterion for South African development funders and ESD programmes.",
      credit: pctCredit(s.blackOwnership, 51),
      evidence: answered(s.blackOwnership) ? `${cleanStr(s.blackOwnership)}%` : "",
    }),
    mk({
      key: "womenOwnership", label: "Women ownership", points: 15,
      section: S, field: "womenOwnership",
      importance: "Many funds carry a dedicated women-owned allocation that is easier to access than the general pool.",
      credit: pctCredit(s.womenOwnership, 30),
      evidence: answered(s.womenOwnership) ? `${cleanStr(s.womenOwnership)}%` : "",
    }),
    mk({
      key: "youthOwnership", label: "Youth ownership", points: 10,
      section: S, field: "youthOwnership",
      importance: "Opens youth-specific facilities that are often concessionary.",
      credit: pctCredit(s.youthOwnership, 30),
      evidence: answered(s.youthOwnership) ? `${cleanStr(s.youthOwnership)}%` : "",
    }),
    mk({
      key: "disabledOwnership", label: "Ownership by persons with disabilities", points: 5,
      section: S, field: "disabledOwnership",
      importance: "A small but under-subscribed mandate category.",
      credit: answered(s.disabledOwnership) ? Math.min((num(s.disabledOwnership) || 0) / 10, 1) : 0,
      evidence: answered(s.disabledOwnership) ? `${cleanStr(s.disabledOwnership)}%` : "",
    }),
    mk({
      key: "jobsToCreate", label: "Jobs to be created", points: 15,
      section: S, field: "jobsToCreate",
      importance: "Job creation is the outcome most South African funders are themselves measured on.",
      credit: Math.min((num(s.jobsToCreate) || 0) / 10, 1),
      evidence: answered(s.jobsToCreate) ? `${cleanStr(s.jobsToCreate)} jobs` : "",
    }),
    mk({
      key: "localEmployees", label: "Local employees hired", points: 10,
      section: S, field: "localEmployeesHired",
      importance: "Evidence the jobs claim above is already happening rather than only projected.",
      credit: Math.min((num(s.localEmployeesHired) || 0) / 5, 1),
      evidence: answered(s.localEmployeesHired) ? `${cleanStr(s.localEmployeesHired)}` : "",
    }),
    mk({
      key: "environmentalImpact", label: "Environmental impact described", points: 10,
      section: S, field: "environmentalImpact",
      importance: "Increasingly a screening question rather than a bonus, particularly for DFI and offshore capital.",
      credit: cleanStr(s.environmentalImpact).length > 15 ? 1 : answered(s.environmentalImpact) ? 0.5 : 0,
      evidence: cleanStr(s.environmentalImpact),
    }),
    mk({
      key: "sdgAlignment", label: "SDG alignment stated", points: 5,
      section: S, field: "sdgAlignment",
      importance: "Lets a fund map you to its own reporting framework without doing the work itself.",
      credit: answered(s.sdgAlignment) ? 1 : 0,
      evidence: cleanStr(s.sdgAlignment),
    }),
    mk({
      key: "csiSpend", label: "CSI / CSR spend recorded", points: 5,
      section: S, field: "csiCsrSpend",
      importance: "Small amounts still count — what matters is that something is recorded and evidenced.",
      credit: pos(s.csiCsrSpend) ? 1 : 0,
      evidence: cleanStr(s.csiCsrSpend),
    }),
    mk({
      key: "beneficiaries", label: "Beneficiaries counted", points: 5,
      section: S, field: "numberOfBeneficiaries",
      importance: "Turns an impact claim into a number a fund can put in its own report.",
      credit: pos(s.numberOfBeneficiaries) ? 1 : 0,
      evidence: answered(s.numberOfBeneficiaries) ? cleanStr(s.numberOfBeneficiaries) : "",
    }),
  ]

  return rollUpItems(items)
}

// ═════════════════════════════════════════════════════════════════════════
// 3. GROWTH POTENTIAL — the eight declared factors
// ═════════════════════════════════════════════════════════════════════════

const GROWTH_FACTORS = [
  { key: "marketShare", label: "Market share growth", importance: "Shows the funding buys expansion rather than survival." },
  { key: "qualityImprovement", label: "Quality or price improvement", importance: "Evidence the business competes on something other than being cheapest." },
  { key: "greenTech", label: "Green technology or resource efficiency", importance: "Unlocks climate and green-economy facilities specifically." },
  { key: "localisation", label: "Localisation of production", importance: "A direct policy priority, and often a scoring criterion in itself." },
  { key: "regionalSpread", label: "Regional or rural spread", importance: "Rural and township presence is a mandate category for several funds." },
  { key: "personalRisk", label: "Personal financial contribution", importance: "Founders with their own money at risk are funded materially more often." },
  { key: "empowerment", label: "B-BBEE level 3 or better", importance: "Determines whether corporates can count spend with you towards their own scorecard." },
  { key: "employment", label: "Job creation", importance: "The outcome most funders report on." },
]

const buildGrowthPotential = (data) => {
  const g = data?.growthPotential || {}
  const items = GROWTH_FACTORS.map((f) =>
    mk({
      key: `growth_${f.key}`, label: f.label, points: 12.5,
      section: "Growth Potential", field: f.key,
      importance: f.importance,
      credit: isYes(g[f.key]) ? 1 : 0,
      evidence: answered(g[f.key]) ? cleanStr(g[f.key]) : "",
      fix: !answered(g[f.key]) ? "Answer this factor under Growth Potential on your funding application." : null,
    })
  )
  return rollUpItems(items)
}

// ═════════════════════════════════════════════════════════════════════════
// 4. DOCUMENT-BACKED COMPONENTS — already deterministic, unchanged sources
// ═════════════════════════════════════════════════════════════════════════

const buildDocumentComponent = ({ analysis, label, docField, uploadAction, qualityLabel, importance, guidance, scoreOutOf5 }) => {
  const present = !!analysis?.isValid
  const score5 = present ? scoreOutOf5(analysis) : 0

  const items = [
    mk({
      key: `${docField}_present`, label: `${label} uploaded and analysed`, points: 50,
      section: "My Documents", field: docField,
      importance,
      guidance,
      credit: present ? 1 : 0,
      evidence: present ? "On file and analysed" : "",
      fix: present ? null : uploadAction,
    }),
    mk({
      key: `${docField}_quality`, label: qualityLabel, points: 50,
      section: "My Documents", field: docField,
      applicable: present,
      importance: "Read from the analysis already run on the document you uploaded.",
      credit: score5 / 5,
      evidence: present ? `${score5}/5 from the analysis` : "",
      reason: present && score5 < 5 ? "The analysis on file scored the document below full marks." : null,
      fix: present && score5 < 5 ? `Address the gaps named in the analysis, then re-upload. ${uploadAction}` : null,
    }),
  ]
  return rollUpItems(items)
}

const buildGuarantees = (guaranteesAnalysis) => {
  const g = guaranteesAnalysis
  const active = g?.activeCount || 0
  const TARGET = 3

  const items = [
    mk({
      key: "guaranteeCount", label: `Security instruments recorded (${active} of ${TARGET} expected)`, points: 40,
      section: "Guarantees", field: "securityInstruments",
      importance: "Debt and purchase-order finance is priced off what secures it, not off the business plan.",
      guidance: "Purchase orders, personal suretyship, cession of debtors, notarial bonds and fixed property all count.",
      credit: Math.min(active / TARGET, 1),
      evidence: active ? (g.items || []).join(", ") : "",
      fix: active < TARGET ? `Add ${TARGET - active} more security instrument${TARGET - active === 1 ? "" : "s"} under Guarantees on your funding application.` : null,
    }),
    mk({
      key: "guaranteeSigned", label: "Instruments signed", points: 30,
      section: "Guarantees", field: "securityInstruments",
      applicable: active > 0,
      importance: "An unsigned instrument is a draft, and a funder treats it as one.",
      credit: active ? Math.min((g.signedCount || 0) / active, 1) : 0,
      evidence: active ? `${g.signedCount || 0} of ${active} signed` : "",
      fix: active && (g.signedCount || 0) < active ? "Get the outstanding instruments signed and mark them so under Guarantees on your funding application." : null,
    }),
    mk({
      key: "guaranteeValue", label: "Instruments carry a stated value", points: 30,
      section: "Guarantees", field: "securityInstruments",
      applicable: active > 0,
      importance: "Security without a number against it cannot be counted towards cover.",
      credit: active ? Math.min((g.withValue || 0) / active, 1) : 0,
      evidence: active ? `${g.withValue || 0} of ${active} valued` : "",
      fix: active && (g.withValue || 0) < active ? "Record the rand value of each instrument under Guarantees on your funding application." : null,
    }),
  ]
  return rollUpItems(items)
}

const buildFinancialResilience = (solvencyAnalysis, statementsAnalysis) => {
  const s = solvencyAnalysis
  const valid = !!s?.isValid
  const stmt = readStatements(statementsAnalysis)
  // aiFinancialEvaluations stores a resilience score on some records; where it
  // is absent the overall statements score stands in, since both are read off
  // the same audited document.
  const resilience = num(statementsAnalysis?.resilienceScore) ?? stmt.overallScore

  const items = [
    statementItem({
      key: "stmtResilience", label: "Resilience read from the statements",
      points: 30, metrics: ["cashFlow", "debtManagement"], stmt,
      importance: "Underwriting-grade assessment runs on the statements, not on the self-reported balance sheet.",
    }),
    mk({
      key: "solvencyPresent", label: "Capital structure captured in the growth suite", points: 30,
      section: "Financial Overview", field: "balanceTotalAssetsCurrent",
      importance: "Solvency, leverage and interest cover are what underwriting-grade assessment runs on.",
      guidance: "These metrics come from the growth suite. Completing your capital structure there populates them.",
      credit: valid ? 1 : 0,
      evidence: valid ? `Solvency ${s.score}/100` : "",
      fix: valid ? null : "Complete your capital structure in the growth suite so solvency metrics can be worked out. The underlying balance sheet lines are on Financial Overview.",
    }),
    mk({
      key: "solvencyStrength", label: "Solvency position", points: 40,
      section: "Financial Overview", field: "balanceEquityCurrent",
      applicable: valid,
      claimable: false, // the ratios are trading reality, not a form entry
      importance: "Net asset value, equity ratio and gearing, weighted as the growth suite calculates them.",
      credit: valid ? (s.normalizedScore || 0) / 5 : 0,
      evidence: valid ? `NAV R${s.nav}M · equity ratio ${s.equityRatio}% · D:E ${s.debtToEquity}` : "",
      reason: valid && (s.normalizedScore || 0) < 5
        ? "These points follow your actual balance sheet. They move as the business strengthens, not as the form is edited."
        : null,
    }),
  ]
  return rollUpItems(items)
}

// ═════════════════════════════════════════════════════════════════════════
// ROLL-UP HELPERS
// ═════════════════════════════════════════════════════════════════════════

function rollUpItems(all) {
  const items = all.filter((i) => i.applicable)
  const possible = items.reduce((s, i) => s + i.points, 0) || 1
  const earned = items.reduce((s, i) => s + i.earned, 0)
  return { items, possible, earned, percent: (earned / possible) * 100 }
}

function rollUpSubCategories(subs) {
  const rolled = subs.map((sc) => ({ ...sc, ...rollUpItems(sc.items) }))
  const weightTotal = rolled.reduce((s, c) => s + c.weight, 0) || 1
  const percent = rolled.reduce((s, c) => s + c.percent * (c.weight / weightTotal), 0)
  return { subCategories: rolled, percent, items: rolled.flatMap((c) => c.items) }
}

// ═════════════════════════════════════════════════════════════════════════
// THE ASSESSMENT
//
//   Each item's pointValue is its share of the FINAL score:
//     effectiveWeight = blockWeight × (componentWeight ÷ 100) × (subWeight ÷ 100)
//     pointValue      = (item.withheld ÷ containerPossible) × effectiveWeight
// ═════════════════════════════════════════════════════════════════════════

export const buildCapitalAppealAssessment = ({
  profileData,
  fundingTier,
  hasAppliedForFunding,
  subWeights,
  stageWeights,
  businessPlanAnalysis,
  pitchDeckAnalysis,
  creditReportAnalysis,
  guaranteesAnalysis,
  solvencyAnalysis,
  financialStatementsAnalysis,
}) => {
  const fundingActive = !!(hasAppliedForFunding && fundingTier && subWeights)

  const blockWeights = {
    financialStrength: fundingActive ? 40 : stageWeights?.financialStrength || 0,
    fundability: fundingActive ? 60 : 0,
  }

  // ── Financial Strength block ──
  const fs = buildFinancialStrength(profileData, creditReportAnalysis, financialStatementsAnalysis)
  const fsWeight = blockWeights.financialStrength

  const financialStrength = {
    key: "financialStrength",
    label: "Financial Strength",
    color: "#8D6E63",
    blockWeight: fsWeight,
    percent: fs.percent,
    subCategories: fs.subCategories.map((sc) => {
      const scWeightTotal = Object.values(FINANCIAL_STRENGTH_WEIGHTS).reduce((a, b) => a + b, 0)
      const effective = fsWeight * (sc.weight / scWeightTotal)
      return {
        ...sc,
        effectiveWeight: effective,
        items: sc.items.map((i) => ({
          ...i,
          pointValue: (i.withheld / sc.possible) * effective,
          container: sc.label,
          block: "Financial Strength",
        })),
      }
    }),
  }
  financialStrength.items = financialStrength.subCategories.flatMap((sc) => sc.items)

  // ── Fundability block ──
  const fundabilityComponents = []

  if (fundingActive) {
    const fw = blockWeights.fundability

    const add = (key, label, weight, built, notes = {}) => {
      const effective = fw * (weight / 100)
      const excluded = !weight
      fundabilityComponents.push({
        key,
        label,
        weight,
        effectiveWeight: effective,
        excluded,
        percent: excluded ? 0 : built.percent,
        exclusionNote: notes.exclusionNote || null,
        reductionNote: notes.reductionNote || null,
        items: excluded
          ? []
          : built.items.map((i) => ({
              ...i,
              pointValue: (i.withheld / built.possible) * effective,
              container: label,
              block: "Fundability",
            })),
        possible: built.possible,
      })
    }

    add("businessPlan", "Business Plan / Investment Case", subWeights.businessPlan,
      buildDocumentComponent({
        analysis: businessPlanAnalysis,
        label: "Business plan",
        docField: "businessPlan",
        uploadAction: "Upload your business plan under My Documents.",
        qualityLabel: "Business plan quality",
        importance: "The document a funder reads first and declines from fastest.",
        guidance: "A funder-ready plan is 15–25 pages with the financial model attached, not a 60-page narrative.",
        scoreOutOf5: (a) => Math.round((a.score / 100) * 5 * 10) / 10,
      }),
      { reductionNote: subWeights._reduced?.businessPlan })

    add("pitchDeck", "Pitch Readiness / Pitch Deck", subWeights.pitchDeck,
      buildDocumentComponent({
        analysis: pitchDeckAnalysis,
        label: "Pitch deck",
        docField: "pitchDeck",
        uploadAction: "Upload your pitch deck under My Documents.",
        qualityLabel: "Pitch deck quality",
        importance: "How the opportunity is communicated, separate from whether it is a good one.",
        scoreOutOf5: (a) => Math.round((a.score / 100) * 5 * 10) / 10,
      }),
      { reductionNote: subWeights._reduced?.pitchDeck })

    add("impactMandate", "Impact & Mandate Alignment", subWeights.impactMandate,
      buildImpactMandate(profileData),
      { reductionNote: subWeights._reduced?.impactMandate })

    add("creditworthiness", "Creditworthiness", subWeights.creditworthiness,
      buildDocumentComponent({
        analysis: creditReportAnalysis,
        label: "Credit report",
        docField: "creditReport",
        uploadAction: "Upload a bureau credit report under My Documents.",
        qualityLabel: "Credit score band",
        importance: "The risk filter almost every debt funder applies before anything else.",
        guidance: "You are entitled to one free report a year from each bureau.",
        scoreOutOf5: (a) => (!a.score ? 0 : a.score >= 750 ? 5 : a.score >= 650 ? 4 : a.score >= 550 ? 3 : a.score >= 450 ? 2 : 1),
      }),
      { reductionNote: subWeights._reduced?.creditworthiness })

    add("guarantees", "Guarantees / Collateral", subWeights.guarantees,
      buildGuarantees(guaranteesAnalysis),
      { exclusionNote: subWeights._excluded?.guarantees })

    add("financialResilience", "Financial Resilience & Efficiency", subWeights.financialResilience,
      buildFinancialResilience(solvencyAnalysis, financialStatementsAnalysis),
      { exclusionNote: subWeights._excluded?.financialResilience })

    add("growthPotential", "Growth Potential", subWeights.growthPotential,
      buildGrowthPotential(profileData),
      { exclusionNote: subWeights._excluded?.growthPotential })
  }

  const blocks = [
    financialStrength,
    ...(fundingActive
      ? [{
          key: "fundability",
          label: "Fundability",
          color: "#6D4C41",
          blockWeight: blockWeights.fundability,
          components: fundabilityComponents,
          percent: (() => {
            const live = fundabilityComponents.filter((c) => !c.excluded)
            const wt = live.reduce((s, c) => s + c.weight, 0) || 1
            return live.reduce((s, c) => s + c.percent * (c.weight / wt), 0)
          })(),
          items: fundabilityComponents.flatMap((c) => c.items),
        }]
      : []),
  ]

  const totalRaw = blocks.reduce((s, bl) => s + bl.percent * (bl.blockWeight / 100), 0)
  const allItems = blocks.flatMap((bl) => bl.items)
  const withheld = allItems.filter((i) => i.withheld > 0 && i.pointValue > 0.05)
  const outstanding = withheld.filter((i) => i.claimable).sort((x, y) => y.pointValue - x.pointValue)
  const locked = withheld.filter((i) => !i.claimable)

  return {
    fundingActive,
    blocks,
    blockWeights,
    statements: fs.statements,
    financialStrength,
    fundabilityComponents,
    allItems,
    outstanding,
    locked,
    totalRaw,
    totalScore: Math.round(totalRaw),
    availablePoints: Math.round(outstanding.reduce((s, i) => s + i.pointValue, 0) * 10) / 10,
    lockedPoints: Math.round(locked.reduce((s, i) => s + i.pointValue, 0) * 10) / 10,
  }
}

export const fmtPts = (n) => `${n >= 0 ? "+" : ""}${(Math.round(n * 10) / 10).toFixed(1)}%`