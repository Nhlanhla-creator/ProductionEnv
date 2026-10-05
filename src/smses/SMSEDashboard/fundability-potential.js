// ─────────────────────────────────────────────────────────────────────────
// CAPITAL APPEAL — DETERMINISTIC SCORING AND POTENTIAL POINTS
//
// ALIGNED TO BIG SCORE SCORING METHODOLOGY v3.0 (29 September 2026)
//
//   §8   Original Capital Appeal = Financial Strength alone. This is the
//        number the BIG Score consumes (`totalScore`). Fundability never
//        changes it.
//   §8   Financial Strength factor weights are stage-specific (FS_FACTOR_WEIGHTS).
//   §8   A funding request adds an APPLICATION-CONTEXT Capital Appeal:
//          FS × stage share + Fundability × stage share
//        (CAPITAL_APPEAL_SPLIT). It is reported next to the original,
//        never over it.
//   §9   Fundability applicability is decided by INSTRUMENT, not by amount,
//        funder type or the retired A–D tiers (FUNDABILITY_MATRIX). Active
//        rows are renormalised (effective = base ÷ Σ active base).
//        Conditional (C) rows stay out of scope unless a published rule is
//        supplied through `conditionalRules`.
//   §9   Several instruments on one request are scored separately and are
//        NOT averaged into one Fundability number.
//   §3.1 Stage is resolved by resolveBigStage (age for Startup/Growth,
//        recorded stage for Scaling/Mature, turnaround flag).
//   §13  Item thresholds the methodology says are still to be approved
//        (financial ratios, bureau bands, plan/deck rubrics, security
//        enforceability) are marked `provisional` on the item and surfaced
//        on the assessment. They are scored, and labelled.
//
// The AI never writes a number. It explains the finished ones.
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
  credit, evidence, reason, fix, claimable = true, applicable = true, provisional = false,
}) => {
  const c = Math.max(0, Math.min(1, credit || 0))
  // Full precision (§3). Rounding here turned eight 12.5-point growth items into 13 each — 104%.
  const earned = points * c
  return {
    key, label, points, section, field, importance, guidance,
    credit: c, earned, withheld: points - earned,
    evidence: evidence || "", reason: reason || null, fix: fix || null,
    claimable, applicable, provisional,
    route: routeFor(section, field),
    state: c >= 1 ? "counted" : c > 0 ? "partial" : "missing",
  }
}

const scale = (v, map) => (answered(v) ? map[cleanStr(v).toLowerCase()] ?? 0 : 0)

// ═════════════════════════════════════════════════════════════════════════
// METHODOLOGY v3.0 CONFIGURATION
//
// Every table below is copied from the methodology document. Each one must
// sum to 100 per stage; checkWeightTables() enforces that (§13 release check).
// ═════════════════════════════════════════════════════════════════════════

export const METHODOLOGY_VERSION = "3.0"

export const BIG_STAGES = ["startup", "growth", "scaling", "turnaround", "mature"]
export const STAGE_LABELS = {
  startup: "Startup", growth: "Growth", scaling: "Scaling", turnaround: "Turnaround", mature: "Mature",
}

// §3.1 — Startup is under 3 completed years, Growth is 3 to under 6.
// Scaling and Mature need a RECORDED stage assessment, never an age cutoff.
// Set to false to trust the recorded stage for Startup/Growth as well.
const STAGE_FROM_AGE = true

const STAGE_ALIASES = {
  startup: ["startup", "ideation", "preseed", "seed", "earlystage", "early"],
  growth: ["growth", "earlygrowth"],
  scaling: ["scaling", "scaleup", "scale"],
  turnaround: ["turnaround"],
  mature: ["mature", "maturity", "established"],
}

export const resolveBigStage = (profile) => {
  const eo = profile?.entityOverview || {}
  const norm = cleanStr(eo.operationStage).toLowerCase().replace(/[^a-z]/g, "")
  const recorded = BIG_STAGES.find((k) => STAGE_ALIASES[k].includes(norm)) || null
  const years = num(eo.yearsInOperation)
  const out = (key, basis, extra = {}) => ({ key, label: STAGE_LABELS[key], basis, recorded, ...extra })

  if (isYes(eo.turnaroundFlag) || recorded === "turnaround") return out("turnaround", "Turnaround flag recorded")
  if (recorded === "scaling" || recorded === "mature") return out(recorded, `Recorded stage assessment: ${STAGE_LABELS[recorded]}`)
  if (STAGE_FROM_AGE && years !== null) {
    const key = years < 3 ? "startup" : "growth"
    return out(key, `${years} completed year${years === 1 ? "" : "s"} in operation`, { derived: true })
  }
  if (recorded) return out(recorded, `Recorded stage: ${STAGE_LABELS[recorded]}`)
  return out("startup", "No stage or years in operation recorded — Startup assumed", { assumed: true })
}

// §8 — Financial Strength factor weights by stage
export const FS_FACTOR_WEIGHTS = {
  startup:    { revenue: 25, records: 35, balanceSheet: 20, debt: 10, credit: 10 },
  growth:     { revenue: 30, records: 25, balanceSheet: 20, debt: 15, credit: 10 },
  scaling:    { revenue: 30, records: 15, balanceSheet: 25, debt: 20, credit: 10 },
  turnaround: { revenue: 20, records: 15, balanceSheet: 25, debt: 30, credit: 10 },
  mature:     { revenue: 30, records: 10, balanceSheet: 25, debt: 20, credit: 15 },
}

// §8 — Application / investor-adjusted context only. Never alters the original.
export const CAPITAL_APPEAL_SPLIT = {
  startup:    { financialStrength: 40, fundability: 60 },
  growth:     { financialStrength: 50, fundability: 50 },
  scaling:    { financialStrength: 55, fundability: 45 },
  turnaround: { financialStrength: 55, fundability: 45 },
  mature:     { financialStrength: 65, fundability: 35 },
}

// §9 — default Fundability sub-component weights by stage (v2.1 retained)
export const FUNDABILITY_BASE_WEIGHTS = {
  businessPlan:        { startup: 26, growth: 22, scaling: 18, turnaround: 24, mature: 14 },
  growthPotential:     { startup: 18, growth: 12, scaling: 8,  turnaround: 4,  mature: 7 },
  pitchDeck:           { startup: 16, growth: 12, scaling: 9,  turnaround: 7,  mature: 5 },
  impactMandate:       { startup: 12, growth: 11, scaling: 9,  turnaround: 9,  mature: 8 },
  financialResilience: { startup: 12, growth: 16, scaling: 19, turnaround: 18, mature: 21 },
  creditworthiness:    { startup: 10, growth: 17, scaling: 23, turnaround: 20, mature: 28 },
  guarantees:          { startup: 6,  growth: 10, scaling: 14, turnaround: 18, mature: 17 },
}

// Keys are kept from the previous build so stored findings and narratives still
// resolve. `label` follows the methodology's names.
export const FUNDABILITY_COMPONENTS = [
  { key: "businessPlan", label: "Investment Case (Business Plan)" },
  { key: "growthPotential", label: "Growth Potential" },
  { key: "pitchDeck", label: "Pitch Deck" },
  { key: "impactMandate", label: "Impact & Outcomes Evidence" },
  { key: "financialResilience", label: "Financial Resilience" },
  { key: "creditworthiness", label: "Creditworthiness" },
  { key: "guarantees", label: "Financeable Security" },
]

export const INSTRUMENT_GROUPS = {
  grant: "Grant",
  po: "Purchase order / contract",
  receivable: "Invoice / receivable",
  asset: "Asset / lease",
  debt: "Term / revolving / bridge",
  equity: "Equity",
  hybrid: "Convertible / revenue-based / mezzanine",
}

// §9 — Y active by default · C only under a published rule · — out of scope
const Y = "Y", C = "C", X = "—"
export const FUNDABILITY_MATRIX = {
  //                      grant po receivable asset debt equity hybrid
  businessPlan:        { grant: Y, po: Y, receivable: C, asset: Y, debt: Y, equity: Y, hybrid: Y },
  growthPotential:     { grant: C, po: C, receivable: X, asset: C, debt: C, equity: Y, hybrid: C },
  pitchDeck:           { grant: C, po: X, receivable: X, asset: X, debt: C, equity: Y, hybrid: C },
  impactMandate:       { grant: Y, po: C, receivable: C, asset: C, debt: C, equity: C, hybrid: C },
  financialResilience: { grant: C, po: Y, receivable: Y, asset: Y, debt: Y, equity: Y, hybrid: Y },
  creditworthiness:    { grant: X, po: Y, receivable: Y, asset: Y, debt: Y, equity: X, hybrid: C },
  guarantees:          { grant: X, po: Y, receivable: Y, asset: Y, debt: C, equity: X, hybrid: C },
}

// No published conditional rules exist yet. A rule is an entry keyed
// `${instrumentGroup}:${componentKey}` → { reason, ruleVersion }, e.g.
//   "grant:pitchDeck": { reason: "Programme X scores the pitch", ruleVersion: "2026-10" }
export const CONDITIONAL_RULES = {}

// Items whose thresholds §13 says must be approved before they produce
// production scores. Scored, and labelled provisional.
export const PROVISIONAL_RULES = [
  "Financial ratio thresholds (margin, current ratio, gearing, overdraft utilisation)",
  "Credit bureau band mapping (needs an approved table, consent, report date and dispute workflow)",
  "Quality rubrics for business plans and pitch decks",
  "Security enforceability and financeable value (ownership, prior cession or lien, remaining value)",
  "Which security categories are relevant to which instrument (SECURITY_RELEVANCE)",
  "Solvency strength mapping",
]

export function checkWeightTables() {
  const errs = []
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0)
  BIG_STAGES.forEach((st) => {
    if (sum(FS_FACTOR_WEIGHTS[st]) !== 100) errs.push(`FS_FACTOR_WEIGHTS.${st} sums to ${sum(FS_FACTOR_WEIGHTS[st])}`)
    const sp = CAPITAL_APPEAL_SPLIT[st]
    if (sp.financialStrength + sp.fundability !== 100) errs.push(`CAPITAL_APPEAL_SPLIT.${st} does not sum to 100`)
    const f = Object.values(FUNDABILITY_BASE_WEIGHTS).reduce((a, w) => a + w[st], 0)
    if (f !== 100) errs.push(`FUNDABILITY_BASE_WEIGHTS.${st} sums to ${f}`)
  })
  return errs
}

// ── Instrument detection ──
//
// UseOfFunds.jsx writes a three-level choice: fundingCategory → fundingInstrument
// → preferredFunderType. Only the first two say what KIND of money it is; the
// funder type, the amount and the support focus decide nothing (§1, §9).
//
// The map is exact-match on the form's own option text. An instrument that is not
// in the §9 matrix is reported as NOT ASSESSED rather than forced into a column
// (§8: "If a route is unknown … show Not assessed, not an invented zero").
//
// To bring one of the unmapped instruments into scope, add one line below.
const GROUPED = (group, list) => Object.fromEntries(list.map((n) => [n.toLowerCase(), group]))

export const INSTRUMENT_MAP = {
  ...GROUPED("equity", ["Any Equity Instrument", "Ordinary Equity", "Preference Shares", "Growth Equity", "Strategic Equity"]),
  ...GROUPED("debt", ["Term Loan", "Working Capital Facility", "Revolving Credit Facility", "Bridging Finance"]),
  ...GROUPED("asset", ["Asset Finance"]),
  ...GROUPED("receivable", ["Invoice Discounting / Factoring"]),
  ...GROUPED("po", ["Purchase Order Finance", "Contract Finance"]),
  ...GROUPED("grant", [
    "Any Grant", "Government Grant", "Innovation Grant", "Research Grant", "Export Grant",
    "Green / Energy Grant", "Impact Grant", "Challenge Fund", "Incentive / Rebate", "Matching Grant",
  ]),
  ...GROUPED("hybrid", [
    "Any Hybrid Instrument", "Convertible Note", "SAFE", "Revenue Based Financing", "Mezzanine Finance", "Royalty Financing",
  ]),
}

// Deliberately NOT mapped — each needs a decision on which §9 column it belongs to:
//   Debt: "Any Debt Instrument", Trade Finance, Import Finance, Export Finance
//   Hybrid: Blended Finance (a blend is scored as separate components, §9)
//   Secondary Market Strategies: all four   ·   Special Strategies: all five
export const UNMAPPED_INSTRUMENTS_NOTE =
  "Not in the Fundability matrix: Any Debt Instrument, Trade/Import/Export Finance, Blended Finance, Secondary Market and Special Strategies."

// When only the category is chosen, it decides the column ONLY if every instrument
// in it sits in the same column. Debt does not (term, PO, receivable and asset differ).
const CATEGORY_ONLY_MAP = { equity: "equity", grants: "grant", "hybrid / structured finance": "hybrid" }

// Legacy arrays and free-text "Other" answers: keyword fallback.
const KEYWORD_RULES = [
  ["hybrid", ["convertible", "mezzanine", "revenue_based", "revenue_share", "royalty", "safe"]],
  ["equity", ["equity", "preference_share"]],
  ["grant", ["grant", "incentive", "rebate"]],
  ["receivable", ["invoice", "receivable", "factoring", "discounting"]],
  ["po", ["purchase_order", "purchaseorder", "po", "contract_finance"]],
  ["asset", ["asset_finance", "lease", "equipment_finance", "hire_purchase"]],
  ["debt", ["term_loan", "revolving", "bridge", "bridging", "working_capital", "loan"]],
]
const kwMatch = (item, k) => (k === "po" ? /(^|_)po(_|$)/.test(item) : item.includes(k))
const groupByKeyword = (text) => {
  const n = String(text).toLowerCase().replace(/[\s/-]+/g, "_")
  const hit = KEYWORD_RULES.find(([, kws]) => kws.some((k) => kwMatch(n, k)))
  return hit ? hit[0] : null
}

export function detectInstruments(profileData) {
  const u = profileData?.useOfFunds || {}
  const isOther = (v) => v && String(v).startsWith("Other")
  const category = cleanStr(isOther(u.fundingCategory) ? u.fundingCategoryOther || u.fundingCategory : u.fundingCategory)
  const instrument = cleanStr(isOther(u.fundingInstrument) ? u.fundingInstrumentOther || u.fundingInstrument : u.fundingInstrument)
  const legacy = (u.fundingInstruments || []).map(cleanStr).filter((x) => x && x.toLowerCase() !== "any")

  const groups = new Set()
  const unmapped = []
  const note = (label) => { if (label && !unmapped.includes(label)) unmapped.push(label) }
  const typedInstrument = instrument && !/^any$/i.test(instrument)

  if (typedInstrument) {
    const exact = INSTRUMENT_MAP[instrument.toLowerCase()]
    const g = exact || (isOther(u.fundingInstrument) ? groupByKeyword(instrument) : null)
    if (g) groups.add(g)
    else note(instrument)
  } else if (category && !/^any$/i.test(category)) {
    const g = CATEGORY_ONLY_MAP[category.toLowerCase()] || (isOther(u.fundingCategory) ? groupByKeyword(category) : null)
    if (g) groups.add(g)
    else note(`${category} — a specific instrument has not been chosen`)
  }

  // Legacy arrays only count when the current fields said nothing at all.
  if (!groups.size && !unmapped.length) {
    legacy.forEach((l) => {
      const g = INSTRUMENT_MAP[l.toLowerCase()] || groupByKeyword(l)
      if (g) groups.add(g)
      else note(l)
    })
  }

  return {
    groups: [...groups],
    unmapped,
    raw: [category, instrument, ...legacy].filter(Boolean),
  }
}

// ── Security: only relevant, AVAILABLE rights count (§9) ──
//
// Categories come from Guarantees.jsx. Relevance by instrument group is a
// provisional rule (PROVISIONAL_RULES): PO finance does not need unrelated
// property (§13), and asset finance reads the financed assets.
export const SECURITY_RELEVANCE = {
  po:         { categories: ["revenueBacked", "paymentSecurity", "institutionalSupport", "other"], extra: ["Accounts Receivable", "Cession of Receivables"] },
  receivable: { categories: ["revenueBacked", "paymentSecurity", "other"], extra: ["Accounts Receivable", "Cession of Receivables"] },
  asset:      { categories: ["assetSecurity", "paymentSecurity", "revenueBacked", "other"], extra: [] },
  debt:       { categories: ["revenueBacked", "paymentSecurity", "assetSecurity", "institutionalSupport", "other"], extra: [] },
  hybrid:     { categories: ["revenueBacked", "paymentSecurity", "assetSecurity", "institutionalSupport", "other"], extra: [] },
}
// existingFinancing records what is ALREADY pledged to someone else (cession, lien,
// bank security). It is shown but is not available security (§9 prior cession/lien).
const NEEDS_ASSIGNMENT = (i) =>
  i.category === "revenueBacked" || ["Accounts Receivable", "Cession of Receivables"].includes(i.instrument)

const isExpired = (endDate, today) => {
  if (!endDate) return false
  const d = new Date(endDate)
  return Number.isFinite(d.getTime()) && d < today
}

export function summariseSecurity(instruments = [], group = null, today = new Date()) {
  const recorded = (instruments || []).filter((i) => i && (i.instrument || i.instrumentOther || (i.files && i.files.length > 0)))
  const rule = SECURITY_RELEVANCE[group] || null
  const dropped = { notRelevant: 0, encumbered: 0, expired: 0, notCurrent: 0, notAssignable: 0 }
  const available = []

  recorded.forEach((i) => {
    if (i.category === "existingFinancing") return void (dropped.encumbered += 1)
    const relevant = !rule || rule.categories.includes(i.category) || rule.extra.includes(i.instrument)
    if (!relevant) return void (dropped.notRelevant += 1)
    if (i.isCurrent === "no") return void (dropped.notCurrent += 1)
    if (isExpired(i.endDate, today)) return void (dropped.expired += 1)
    if (NEEDS_ASSIGNMENT(i) && i.isAssignable === "no") return void (dropped.notAssignable += 1)
    available.push(i)
  })

  const droppedTotal = Object.values(dropped).reduce((a, b) => a + b, 0)
  const parts = [
    dropped.notRelevant && `${dropped.notRelevant} not relevant to ${INSTRUMENT_GROUPS[group] || "this instrument"}`,
    dropped.encumbered && `${dropped.encumbered} already pledged under existing financing`,
    dropped.expired && `${dropped.expired} past its end date`,
    dropped.notCurrent && `${dropped.notCurrent} marked not current`,
    dropped.notAssignable && `${dropped.notAssignable} where assignment is not allowed`,
  ].filter(Boolean)

  return {
    recordedCount: recorded.length,
    activeCount: available.length,
    items: available.map((i) => i.instrument || i.instrumentOther || "Unnamed instrument"),
    signedCount: available.filter((i) => i.isSigned === "yes").length,
    withValue: available.filter((i) => i.value && parseFloat(String(i.value).replace(/[^\d.]/g, "")) > 0).length,
    dropped,
    droppedTotal,
    droppedNote: droppedTotal ? `${droppedTotal} of ${recorded.length} recorded do not count: ${parts.join("; ")}.` : "",
  }
}

// ═════════════════════════════════════════════════════════════════════════
// 1. FINANCIAL STRENGTH — stage-weighted, §8
// ═════════════════════════════════════════════════════════════════════════

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

const buildFinancialStrength = (data, creditReportAnalysis, statementsAnalysis, W) => {
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
      provisional: true,
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
      provisional: true,
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
      provisional: true,
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
      provisional: true,
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
      provisional: true,
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
    { key: "revenue", label: "Revenue & Profitability", weight: W.revenue, items: revenueItems },
    { key: "records", label: "Financial Records & Governance", weight: W.records, items: recordsItems },
    { key: "balanceSheet", label: "Balance Sheet Strength", weight: W.balanceSheet, items: balanceItems },
    { key: "debt", label: "Debt & Liability Position", weight: W.debt, items: debtItems },
    { key: "credit", label: "Credit History", weight: W.credit, items: creditItems },
  ]

  return { ...rollUpSubCategories(subCategories), statements: stmt }
}

// ═════════════════════════════════════════════════════════════════════════
// 2. IMPACT & OUTCOMES EVIDENCE — deterministic, from socialImpact.
//    Assessed generically (§9). Fit to a named funder's mandate is Match Score, not this.
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
      importance: "The most heavily weighted ownership outcome for South African development funders and ESD programmes.",
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
      provisional: true,
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

const buildGuarantees = (g) => {
  const active = g?.activeCount || 0
  const TARGET = 3

  const items = [
    mk({
      key: "guaranteeCount", label: `Available security instruments (${active} of ${TARGET} expected)`, points: 40,
      provisional: true,
      section: "Guarantees", field: "securityInstruments",
      importance: "Where security applies, it is priced off what can actually be enforced. Only relevant, current, unencumbered instruments count.",
      guidance: "Contracts and purchase orders with assignable proceeds, issued guarantees, receivables and the assets being financed all count. Property that has nothing to do with this request does not.",
      credit: Math.min(active / TARGET, 1),
      evidence: active ? (g.items || []).join(", ") : "",
      reason: g?.droppedNote || null,
      fix: active < TARGET ? `Add ${TARGET - active} more relevant security instrument${TARGET - active === 1 ? "" : "s"} under Guarantees on this funding application.` : null,
    }),
    mk({
      key: "guaranteeSigned", label: "Instruments signed", points: 30,
      provisional: true,
      section: "Guarantees", field: "securityInstruments",
      applicable: active > 0,
      importance: "An unsigned instrument is a draft, and a funder treats it as one.",
      credit: active ? Math.min((g.signedCount || 0) / active, 1) : 0,
      evidence: active ? `${g.signedCount || 0} of ${active} signed` : "",
      fix: active && (g.signedCount || 0) < active ? "Get the outstanding instruments signed and mark them so under Guarantees on this funding application." : null,
    }),
    mk({
      key: "guaranteeValue", label: "Instruments carry a stated value", points: 30,
      provisional: true,
      section: "Guarantees", field: "securityInstruments",
      applicable: active > 0,
      importance: "Security without a number against it cannot be counted towards cover.",
      credit: active ? Math.min((g.withValue || 0) / active, 1) : 0,
      evidence: active ? `${g.withValue || 0} of ${active} valued` : "",
      fix: active && (g.withValue || 0) < active ? "Record the rand value of each instrument under Guarantees on this funding application." : null,
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
      provisional: true,
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
// FUNDABILITY FOR ONE INSTRUMENT (§9)
// ═════════════════════════════════════════════════════════════════════════

// Largest-remainder rounding so displayed one-decimal weights reconcile to 100.0.
const reconcileTo100 = (vals, dp = 1) => {
  if (!vals.length) return []
  const f = 10 ** dp
  const floors = vals.map((v) => Math.floor(v * f + 1e-9))
  let rem = Math.round(100 * f) - floors.reduce((a, b) => a + b, 0)
  vals
    .map((v, i) => [v * f - floors[i], i])
    .sort((x, y) => y[0] - x[0])
    .forEach(([, i]) => { if (rem > 0) { floors[i] += 1; rem -= 1 } })
  return floors.map((x) => x / f)
}

const outOfScopeNote = (row, group) => {
  const inst = INSTRUMENT_GROUPS[group]
  if (row.applicability === C) {
    return `${row.label} is conditional for ${inst}: it activates only under a published subtype, programme or approved investor rule, and none applies to this request. It is out of scope and costs nothing.`
  }
  const noncredit = group === "equity" || group === "grant"
  if (row.key === "guarantees" && noncredit) return `${inst} does not inherit a collateral penalty — financeable security is outside its scope.`
  if (row.key === "creditworthiness" && noncredit) return `Creditworthiness is not a criterion for ${inst}.`
  return `${row.label} is outside scope for ${inst}. It is excluded from the denominator and costs nothing.`
}

const buildFundability = ({ group, stage, split, profileData, conditionalRules, analyses, securityInstruments, today }) => {
  const rows = FUNDABILITY_COMPONENTS.map((c) => {
    const applicability = FUNDABILITY_MATRIX[c.key][group]
    const rule = conditionalRules?.[`${group}:${c.key}`] || null
    const active = applicability === Y || (applicability === C && !!rule)
    return { ...c, applicability, active, rule, base: FUNDABILITY_BASE_WEIGHTS[c.key][stage] }
  })
  const baseTotal = rows.filter((r) => r.active).reduce((s, r) => s + r.base, 0) || 1
  rows.forEach((r) => { r.exact = r.active ? (r.base / baseTotal) * 100 : 0 })
  const shown = reconcileTo100(rows.filter((r) => r.active).map((r) => r.exact))
  let n = 0
  rows.forEach((r) => { r.display = r.active ? shown[n++] : 0 })

  const { businessPlanAnalysis, pitchDeckAnalysis, creditReportAnalysis, solvencyAnalysis, financialStatementsAnalysis } = analyses

  const builders = {
    businessPlan: () =>
      buildDocumentComponent({
        analysis: businessPlanAnalysis, label: "Business plan", docField: "businessPlan",
        uploadAction: "Upload your business plan under My Documents.",
        qualityLabel: "Business plan quality",
        importance: "The document a funder reads first and declines from fastest.",
        guidance: "A funder-ready plan is 15–25 pages with the financial model attached, not a 60-page narrative.",
        scoreOutOf5: (x) => Math.round((x.score / 100) * 5 * 10) / 10,
      }),
    pitchDeck: () =>
      buildDocumentComponent({
        analysis: pitchDeckAnalysis, label: "Pitch deck", docField: "pitchDeck",
        uploadAction: "Upload your pitch deck under My Documents.",
        qualityLabel: "Pitch deck quality",
        importance: "How the opportunity is communicated, separate from whether it is a good one.",
        scoreOutOf5: (x) => Math.round((x.score / 100) * 5 * 10) / 10,
      }),
    impactMandate: () => buildImpactMandate(profileData),
    creditworthiness: () =>
      buildDocumentComponent({
        analysis: creditReportAnalysis, label: "Credit report", docField: "creditReport",
        uploadAction: "Upload a bureau credit report under My Documents.",
        qualityLabel: "Credit score band",
        importance: "Repayment capacity as evidenced by the credit report on file.",
        guidance: "You are entitled to one free report a year from each bureau.",
        scoreOutOf5: (x) => (!x.score ? 0 : x.score >= 750 ? 5 : x.score >= 650 ? 4 : x.score >= 550 ? 3 : x.score >= 450 ? 2 : 1),
      }),
    guarantees: () => buildGuarantees(summariseSecurity(securityInstruments, group, today)),
    financialResilience: () => buildFinancialResilience(solvencyAnalysis, financialStatementsAnalysis),
    growthPotential: () => buildGrowthPotential(profileData),
  }

  const components = rows.map((r) => {
    if (!r.active) {
      return {
        key: r.key, label: r.label, applicability: r.applicability, baseWeight: r.base,
        weight: 0, exactWeight: 0, effectiveWeight: 0, excluded: true,
        exclusionNote: outOfScopeNote(r, group), reductionNote: null,
        percent: 0, possible: 0, items: [],
      }
    }
    const built = builders[r.key]()
    const effective = split.fundability * (r.exact / 100)
    return {
      key: r.key, label: r.label, applicability: r.applicability, baseWeight: r.base,
      weight: r.display, exactWeight: r.exact, effectiveWeight: effective, excluded: false,
      exclusionNote: null,
      reductionNote: r.rule ? `Conditional row activated by rule: ${r.rule.reason}` : null,
      percent: built.percent, possible: built.possible,
      items: built.items.map((i) => ({
        ...i,
        pointValue: (i.withheld / built.possible) * effective,
        container: r.label, block: "Fundability", scope: "application",
      })),
    }
  })

  const percent = components.filter((c) => !c.excluded).reduce((s, c) => s + c.percent * (c.exactWeight / 100), 0)
  return { group, label: INSTRUMENT_GROUPS[group], components, percent }
}

// ═════════════════════════════════════════════════════════════════════════
// THE ASSESSMENT
//
//   ORIGINAL Capital Appeal (what the BIG Score consumes)
//     = Financial Strength percent, with the stage's factor weights (sum 100)
//     item.pointValue = (withheld ÷ subCategoryPossible) × factorWeight
//
//   APPLICATION-CONTEXT Capital Appeal (single instrument only)
//     = FS% × fsShare + Fundability% × fundShare
//     Fundability item.pointValue = (withheld ÷ componentPossible)
//                                   × effectiveWeight × fundShare ÷ 100
//     (points of the application score, scope: "application")
// ═════════════════════════════════════════════════════════════════════════

export const buildCapitalAppealAssessment = ({
  profileData,
  hasAppliedForFunding,
  instrumentGroups,
  unmappedInstruments = [],
  conditionalRules = CONDITIONAL_RULES,
  businessPlanAnalysis,
  pitchDeckAnalysis,
  creditReportAnalysis,
  securityInstruments = [],
  solvencyAnalysis,
  financialStatementsAnalysis,
  today = new Date(),
}) => {
  const stage = resolveBigStage(profileData)
  const split = CAPITAL_APPEAL_SPLIT[stage.key]
  const factorWeights = FS_FACTOR_WEIGHTS[stage.key]
  const groups = instrumentGroups ?? detectInstruments(profileData).groups
  const analyses = { businessPlanAnalysis, pitchDeckAnalysis, creditReportAnalysis, solvencyAnalysis, financialStatementsAnalysis }

  // ── Financial Strength = original Capital Appeal ──
  const fs = buildFinancialStrength(profileData, creditReportAnalysis, financialStatementsAnalysis, factorWeights)
  const financialStrength = {
    key: "financialStrength",
    label: "Financial Strength",
    color: "#8D6E63",
    blockWeight: 100,
    percent: fs.percent,
    subCategories: fs.subCategories.map((sc) => ({
      ...sc,
      effectiveWeight: sc.weight,
      items: sc.items.map((i) => {
        const pointValue = (i.withheld / sc.possible) * sc.weight
        return {
          ...i,
          pointValue,
          applicationPointValue: pointValue * (split.financialStrength / 100),
          container: sc.label, block: "Financial Strength", scope: "profile",
        }
      }),
    })),
  }
  financialStrength.items = financialStrength.subCategories.flatMap((sc) => sc.items)

  // ── Fundability status ──
  const status = !hasAppliedForFunding
    ? "no_application"
    : groups.length === 0
    ? unmappedInstruments.length ? "unmapped" : "no_instrument"
    : groups.length > 1
    ? "blended"
    : "scored"
  const fundingActive = status === "scored"

  const instrumentResults = groups.map((g) =>
    buildFundability({ group: g, stage: stage.key, split, profileData, conditionalRules, analyses, securityInstruments, today })
  )
  const single = fundingActive ? instrumentResults[0] : null
  const fundabilityComponents = single ? single.components : []

  const blocks = [financialStrength]
  if (single) {
    blocks.push({
      key: "fundability",
      label: "Fundability",
      color: "#6D4C41",
      blockWeight: split.fundability,
      percent: single.percent,
      components: fundabilityComponents,
      items: fundabilityComponents.flatMap((c) => c.items),
    })
  }

  // ── Original ──
  const totalRaw = fs.percent
  const fsItems = financialStrength.items
  const fundItems = blocks.flatMap((b) => (b.key === "fundability" ? b.items : []))
  const allItems = [...fsItems, ...fundItems]

  const recoverable = (list, valueOf) =>
    list
      .filter((i) => i.withheld > 0 && valueOf(i) > 0.05)
      .reduce((acc, i) => { (i.claimable ? acc.claim : acc.lock).push(i); return acc }, { claim: [], lock: [] })

  const orig = recoverable(fsItems, (i) => i.pointValue)
  const outstanding = orig.claim.sort((x, y) => y.pointValue - x.pointValue)
  const locked = orig.lock

  // ── Application context ──
  let application = {
    status, instrument: single?.group || null, instrumentLabel: single?.label || null,
    score: null, raw: null, delta: null,
    financialStrengthShare: split.financialStrength, fundabilityShare: split.fundability,
    outstanding: [], locked: [], availablePoints: 0, lockedPoints: 0,
    instrumentResults: instrumentResults.map((r) => ({ group: r.group, label: r.label, percent: r.percent })),
  }
  if (single) {
    const raw = fs.percent * (split.financialStrength / 100) + single.percent * (split.fundability / 100)
    const appFs = fsItems.map((i) => ({ ...i, pointValue: i.applicationPointValue }))
    const app = recoverable([...appFs, ...fundItems], (i) => i.pointValue)
    const appOut = app.claim.sort((x, y) => y.pointValue - x.pointValue)
    application = {
      ...application,
      raw, score: Math.round(raw), delta: raw - totalRaw,
      outstanding: appOut, locked: app.lock,
      availablePoints: Math.round(appOut.reduce((s, i) => s + i.pointValue, 0) * 10) / 10,
      lockedPoints: Math.round(app.lock.reduce((s, i) => s + i.pointValue, 0) * 10) / 10,
    }
  }

  const provisionalItems = allItems.filter((i) => i.provisional && i.applicable)

  return {
    methodologyVersion: METHODOLOGY_VERSION,
    stage,
    split,
    factorWeights,
    // Application split, kept under the old name. The original is always FS 100%.
    blockWeights: { financialStrength: split.financialStrength, fundability: split.fundability },
    fundingActive,
    fundabilityStatus: status,
    unmappedInstruments,
    blocks,
    statements: fs.statements,
    financialStrength,
    fundabilityComponents,
    instrumentResults,
    allItems,
    outstanding,
    locked,
    totalRaw,
    totalScore: Math.round(totalRaw),
    availablePoints: Math.round(outstanding.reduce((s, i) => s + i.pointValue, 0) * 10) / 10,
    lockedPoints: Math.round(locked.reduce((s, i) => s + i.pointValue, 0) * 10) / 10,
    application,
    provisional: provisionalItems.length > 0,
    provisionalItems,
    provisionalRules: PROVISIONAL_RULES,
  }
}

// ═════════════════════════════════════════════════════════════════════════
// PER-APPLICATION RESULT (§2)
//
// One person can hold several funding requests, and Fundability belongs to the
// request, not to the person. Each qualifying application is assessed on its
// own and this is the plain, storable record of that assessment — written to
// fundingApplicationsV2/{id}.fundabilityAssessment so the applications list can
// show it without re-running the engine. Same inputs → same signature, so it is
// only rewritten when something material changed.
// ═════════════════════════════════════════════════════════════════════════
const cheapHash = (str) => {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

export const applicationSnapshot = (a) => {
  const r1 = (n) => (n == null || !Number.isFinite(n) ? null : Math.round(n * 10) / 10)
  const fund = a.blocks.find((b) => b.key === "fundability")
  const base = {
    methodologyVersion: a.methodologyVersion,
    stage: { key: a.stage.key, label: a.stage.label, basis: a.stage.basis },
    status: a.fundabilityStatus,
    instrument: a.application.instrument,
    instrumentLabel: a.application.instrumentLabel,
    unmappedInstruments: a.unmappedInstruments || [],
    capitalAppeal: r1(a.totalRaw),
    fundability: r1(fund?.percent),
    applicationScore: r1(a.application.raw),
    delta: r1(a.application.delta),
    split: { financialStrength: a.split.financialStrength, fundability: a.split.fundability },
    components: a.fundabilityComponents.map((c) => ({
      key: c.key, label: c.label, excluded: !!c.excluded, weight: c.weight,
      percent: c.excluded ? null : r1(c.percent), effectiveWeight: r1(c.effectiveWeight),
    })),
    availablePoints: a.application.availablePoints,
    provisional: !!a.provisional,
  }
  return { ...base, signature: cheapHash(JSON.stringify(base)) }
}

export const fmtPts = (n) => `${n >= 0 ? "+" : ""}${(Math.round(n * 10) / 10).toFixed(1)}%`