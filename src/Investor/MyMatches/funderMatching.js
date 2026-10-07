"use client"

/* ════════════════════════════════════════════════════════════════════════════
   funderMatching.js

   Scoring, normalising and formatting for funder matches. Both the SME-side
   table (funding-table.jsx) and the investor-side table (InvestorSMETable.jsx)
   must score through this file so the two roles always see the same numbers.

   BIG Score categories (bigEvaluations/{smeId}.scores):
     compliance · legitimacy · fundability (shown as "Capital Appeal")
     · governanceLeadership · operational
   ════════════════════════════════════════════════════════════════════════ */

/* ─── Normalising ───────────────────────────────────────────────────────── */

export const normalizeText = (str) => str?.toString().toLowerCase().trim().replace(/\s+/g, "_")

const STAGE_MAP = {
  "pre-seed": "early_pre_seed",
  preseed: "early_pre_seed",
  pre_seed: "early_pre_seed",
  seed: "early_seed",
  "series a": "venture_series_a",
  seriesa: "venture_series_a",
  "series b": "venture_series_b",
  seriesb: "venture_series_b",
  "series c": "venture_series_c",
  "series c+": "venture_series_c",
  seriesc: "venture_series_c",
  "seriesc+": "venture_series_c",
  growth: "late_growth_pe",
  "growth/pe": "late_growth_pe",
  pe: "late_growth_pe",
  mbo: "late_mbo",
  mbi: "late_mbi",
  lbo: "late_lbo",
}

export const normalizeStage = (raw) => {
  const clean = raw?.toString().toLowerCase().replace(/\s+/g, " ").trim()
  return STAGE_MAP[clean] || STAGE_MAP[clean?.replace(/\s/g, "")] || normalizeText(raw)
}

export const SECTOR_SYNONYMS = {
  general: "generalist",
  generalist: "generalist",
  agri: "agriculture",
  agriculture: "agriculture",
  farming: "agriculture",
  auto: "automotive",
  automotive: "automotive",
  cars: "automotive",
  vehicles: "automotive",
  banking: "banking_finance_insurance",
  finance: "banking_finance_insurance",
  insurance: "banking_finance_insurance",
  financial_services: "banking_finance_insurance",
  banking_finance_insurance: "banking_finance_insurance",
  beauty: "beauty_cosmetics_personal_care",
  cosmetics: "beauty_cosmetics_personal_care",
  personal_care: "beauty_cosmetics_personal_care",
  beauty_cosmetics_personal_care: "beauty_cosmetics_personal_care",
  construction: "construction",
  building: "construction",
  civil_engineering: "construction",
  consulting: "consulting",
  business_services: "consulting",
  arts: "creative_arts_design",
  design: "creative_arts_design",
  creative: "creative_arts_design",
  creative_arts_design: "creative_arts_design",
  customer_service: "customer_service",
  support: "customer_service",
  education: "education_training",
  training: "education_training",
  teaching: "education_training",
  education_training: "education_training",
  engineering: "engineering",
  environment: "environmental_natural_sciences",
  natural_sciences: "environmental_natural_sciences",
  environmental_natural_sciences: "environmental_natural_sciences",
  government: "government_public_sector",
  public_sector: "government_public_sector",
  government_public_sector: "government_public_sector",
  healthcare: "healthcare_medical",
  medical: "healthcare_medical",
  health: "healthcare_medical",
  healthcare_medical: "healthcare_medical",
  tourism: "hospitality_tourism",
  hospitality: "hospitality_tourism",
  hospitality_tourism: "hospitality_tourism",
  hr: "human_resources",
  human_resources: "human_resources",
  it: "information_technology",
  tech: "information_technology",
  ict: "information_technology",
  information_technology: "information_technology",
  infrastructure: "infrastructure",
  law: "legal_law",
  legal: "legal_law",
  legal_law: "legal_law",
  logistics: "logistics_supply_chain",
  supply_chain: "logistics_supply_chain",
  logistics_supply_chain: "logistics_supply_chain",
  manufacturing: "manufacturing",
  production: "manufacturing",
  marketing: "marketing_advertising_pr",
  advertising: "marketing_advertising_pr",
  pr: "marketing_advertising_pr",
  marketing_advertising_pr: "marketing_advertising_pr",
  media: "media_journalism_broadcasting",
  journalism: "media_journalism_broadcasting",
  broadcasting: "media_journalism_broadcasting",
  media_journalism_broadcasting: "media_journalism_broadcasting",
  mining: "mining",
  energy: "energy",
  renewable_energy: "energy",
  oil: "oil_gas",
  gas: "oil_gas",
  oil_and_gas: "oil_gas",
  oil_gas: "oil_gas",
  non_profit: "non_profit_ngo",
  ngo: "non_profit_ngo",
  non_profit_ngo: "non_profit_ngo",
  property: "property_real_estate",
  real_estate: "property_real_estate",
  property_real_estate: "property_real_estate",
  retail: "retail_wholesale",
  wholesale: "retail_wholesale",
  retail_wholesale: "retail_wholesale",
  safety: "safety_security_police_defence",
  security: "safety_security_police_defence",
  police: "safety_security_police_defence",
  defence: "safety_security_police_defence",
  safety_security_police_defence: "safety_security_police_defence",
  sales: "sales",
  science: "science_research",
  research: "science_research",
  science_research: "science_research",
  social_services: "social_services_social_work",
  social_work: "social_services_social_work",
  social_services_social_work: "social_services_social_work",
  sports: "sports_recreation_fitness",
  recreation: "sports_recreation_fitness",
  fitness: "sports_recreation_fitness",
  sports_recreation_fitness: "sports_recreation_fitness",
  telecom: "telecommunications",
  telecommunications: "telecommunications",
  transport: "transport",
  transportation: "transport",
  utilities: "utilities",
  water: "utilities",
  electricity: "utilities",
  waste: "utilities",
}

/* Every non-alphanumeric run becomes one underscore, so "Banking, Finance &
   Insurance" and "Oil & Gas" reach their synonym keys. The old version only
   collapsed spaces and hyphens, leaving commas, ampersands and slashes in. */
export const normalizeSector = (value) => {
  if (!value) return ""
  const key = value
    .toString()
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  return SECTOR_SYNONYMS[key] || key
}

export const expandSectorsWithSynonyms = (sectors = []) => {
  const expanded = new Set()
  sectors.forEach((sector) => {
    if (!sector) return
    expanded.add(normalizeText(sector))
    const canonical = normalizeSector(sector)
    if (canonical) expanded.add(canonical)
  })
  return [...expanded]
}

/* ─── Instruments ───────────────────────────────────────────────────────────
   Investors pick categories ("Grants", "Hybrid/Structured Instruments") and
   subtypes; SMEs store short values ("grant", "equity", "convertible"). The
   old comparison was a plain string match, so "grants" never met "grant".
   Both sides are reduced to a family before they are compared.
   ──────────────────────────────────────────────────────────────────────── */
export const normalizeInstrument = (value) => {
  if (!value) return ""
  const k = value.toString().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
  if (!k) return ""
  if (/grant|donation/.test(k)) return "grant"
  if (/real assets|infrastructure/.test(k)) return "special"
  if (/secondary|continuation/.test(k)) return "secondary"
  if (/convertible|\bsafe\b|\basa\b|warrant|hybrid|structured|revenue based|royalty/.test(k)) return "hybrid"
  if (
    /mezz|debt|loan|overdraft|revolver|factoring|invoice|purchase order|\bpo finance|asset finance|lease|bridge|trade import export|trade finance|credit/.test(
      k,
    )
  )
    return "debt"
  if (/equity|angel|venture capital|private equity|buyout|shares?|stock/.test(k)) return "equity"
  if (/blended/.test(k)) return "blended"
  return k.replace(/\s+/g, "_")
}

const uniqueInstruments = (list) => [...new Set(asListLocal(list).map(normalizeInstrument).filter(Boolean))]

export const normalizeAmount = (value) => {
  if (!value) return 0
  if (typeof value === "number") return value
  const clean = value.toString().replace(/[R$,\s]/g, "").replace(/[^\d.]/g, "")
  return Number.parseFloat(clean) || 0
}

const normalizeArray = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value.map(normalizeText)
  return [normalizeText(value)]
}

function asListLocal(v) {
  return Array.isArray(v) ? v : v ? [v] : []
}

export const normalizeSMEProfile = (profile = {}) => {
  const entity = profile.entityOverview || {}
  const funds = profile.useOfFunds || {}
  const app = profile.applicationOverview || {}

  return {
    location: normalizeText(entity.location),
    province: normalizeText(entity.province),
    economicSectors: normalizeArray(entity.economicSectors),
    applicationStage: normalizeStage(app.fundingStage),
    amountRequested: normalizeAmount(funds.amountRequested),
    instruments: uniqueInstruments(funds.fundingInstruments),
    supportNeeded: normalizeArray(profile.productsServices?.support),
    annualRevenue: normalizeAmount(profile.financialOverview?.annualRevenue),
    legalStructure: normalizeText(entity.legalStructure),
  }
}

export const normalizeInvestorFund = (fund = {}) => {
  const ticket = (value) => normalizeAmount(value)

  return {
    fundName: fund.name?.trim() || "Unnamed Fund",
    locations: [
      ...(fund.geographicFocus || []),
      ...(fund.selectedProvinces || []),
      ...(fund.selectedCountries || []),
    ].map(normalizeText),
    stages: Array.isArray(fund.stages) ? fund.stages.map(normalizeStage) : normalizeArray(fund.stages),
    sectors: expandSectorsWithSynonyms(Array.isArray(fund.sectorFocus) ? fund.sectorFocus : [fund.sectorFocus]),
    excludedSectors: expandSectorsWithSynonyms(
      Array.isArray(fund.sectorExclusions) ? fund.sectorExclusions : [fund.sectorExclusions],
    ),
    instruments: uniqueInstruments(fund.instruments),
    ticketMin: ticket(fund.minimumTicket),
    ticketMax: ticket(fund.maximumTicket),
    supportOffered: normalizeArray(fund.supportOffered),
    decisionTime: fund.dueDiligenceTimeline || "-",
  }
}

/* ─── Hybrid match score ────────────────────────────────────────────────── */

export const HYBRID_WEIGHTS = {
  sector: 0.5,
  stage: 0.2,
  ticket: 0.2,
  type: 0.1,
}

/* Scoring rules, per component (each worth 0–10 before weighting):
   - A fund that lists nothing for sector / stage / instrument is unrestricted
     (the tables label an empty sector list "Generalist"), so it scores full.
     The old code scored it 0, which cost a generalist fund half its match.
   - An SME that has not declared the field gets a neutral 5, not 0.
   - Sector scores on the share of the SME's sectors the fund covers, counted
     per SME sector (the old code counted raw and canonical forms separately,
     so one match could count twice). A listed exclusion scores 0.
   Eligibility (hard pass/fail) is deliberately not decided here. */
export function calculateHybridScore(sme, investorFund) {
  const fund = normalizeInvestorFund(investorFund)
  const breakdown = {}
  let score = 0

  const smeSectorList = sme.economicSectors || []
  const forms = (s) => expandSectorsWithSynonyms([s])
  const fundSectorUnrestricted = fund.sectors.length === 0 || fund.sectors.includes("generalist")
  const hasExclusion = smeSectorList.some((s) => forms(s).some((x) => fund.excludedSectors.includes(x)))
  const matchedSectors = fundSectorUnrestricted ? [...smeSectorList] : smeSectorList.filter((s) => forms(s).some((x) => fund.sectors.includes(x)))

  let sectorScore
  if (hasExclusion) sectorScore = 0
  else if (smeSectorList.length === 0) sectorScore = 5
  else sectorScore = Math.min(1, matchedSectors.length / smeSectorList.length) * 10
  score += sectorScore * HYBRID_WEIGHTS.sector
  breakdown.sector = {
    score: sectorScore * 10,
    matched: matchedSectors,
    smeSectors: smeSectorList,
    investorSectors: fund.sectors,
    unrestricted: fundSectorUnrestricted,
    hasExclusion,
    weight: HYBRID_WEIGHTS.sector,
  }

  const stageUnrestricted = fund.stages.length === 0
  const stageMatched = stageUnrestricted || fund.stages.includes(sme.applicationStage)
  const stageScore = !sme.applicationStage ? 5 : stageMatched ? 10 : 0
  score += stageScore * HYBRID_WEIGHTS.stage
  breakdown.stage = {
    score: stageScore * 10,
    smeStage: sme.applicationStage,
    investorStages: fund.stages,
    matched: stageMatched,
    unrestricted: stageUnrestricted,
    weight: HYBRID_WEIGHTS.stage,
  }

  const instrumentUnrestricted = fund.instruments.length === 0
  const matchedInstruments = fund.instruments.filter((inst) => sme.instruments.includes(inst))
  const typeScore = sme.instruments.length === 0 ? 5 : instrumentUnrestricted || matchedInstruments.length > 0 ? 10 : 0
  score += typeScore * HYBRID_WEIGHTS.type
  breakdown.type = {
    score: typeScore * 10,
    smeInstruments: sme.instruments,
    investorInstruments: fund.instruments,
    matchedInstruments,
    unrestricted: instrumentUnrestricted,
    weight: HYBRID_WEIGHTS.type,
  }

  const { ticketMin, ticketMax } = fund
  const { amountRequested } = sme
  let ticketScore = 0
  if (!amountRequested || (!ticketMin && !ticketMax)) {
    ticketScore = 5 // nothing to compare — neutral rather than a free 10
  } else if (amountRequested >= ticketMin && amountRequested <= (ticketMax || Number.POSITIVE_INFINITY)) {
    ticketScore = 10
  } else {
    const distance = amountRequested < ticketMin ? ticketMin - amountRequested : amountRequested - ticketMax
    const range = (ticketMax || 0) - ticketMin || ticketMin || 1
    ticketScore = Math.max(0, 10 - Math.min((distance / range) * 10, 10))
  }
  score += ticketScore * HYBRID_WEIGHTS.ticket
  breakdown.ticket = {
    score: ticketScore * 10,
    smeAmount: amountRequested,
    minTicket: ticketMin,
    maxTicket: ticketMax,
    inRange: amountRequested >= ticketMin && amountRequested <= (ticketMax || Number.POSITIVE_INFINITY),
    weight: HYBRID_WEIGHTS.ticket,
  }

  return { score: Math.round(score * 10), breakdown }
}

/* ─── BIG Score categories + Adjusted BIG Score ─────────────────────────────
   The investor sets their own criteria in InvestmentRequirements; what is
   saved at investmentRequirements.weights is keyed exactly like the scores in
   bigEvaluations, so no translation is needed (legacy keys are still
   accepted below). weights is null until the investor has rated something,
   in which case the adjusted score is the plain base score — an investor who
   never customised is not shown a made-up adjustment.
   ──────────────────────────────────────────────────────────────────────── */

export const CATEGORY_KEYS = ["compliance", "legitimacy", "fundability", "governanceLeadership", "operational"]

export const CATEGORY_LABELS = {
  compliance: "Compliance",
  legitimacy: "Legitimacy",
  fundability: "Capital Appeal",
  governanceLeadership: "Governance & Leadership",
  operational: "Operational Strength",
}

/* governanceLeadership is stored with mixed types across documents (a number
   in some, an object or string in others). Anything that reads a score goes
   through here so a non-number is read properly instead of being dropped. */
export const readScoreValue = (v) => {
  if (v === null || v === undefined || v === "") return Number.NaN
  if (typeof v === "number") return v
  if (typeof v === "string") {
    const n = Number(v.replace("%", "").trim())
    return Number.isFinite(n) ? n : Number.NaN
  }
  if (typeof v === "object") return readScoreValue(v.score ?? v.value ?? v.total ?? v.overall ?? v.percentage)
  return Number.NaN
}

const weightNum = (v) => (v === null || v === undefined || v === "" ? Number.NaN : Number(v))

const normalizeWeightings = (w) => {
  if (!w || typeof w !== "object") return null
  const sum = (...keys) => {
    const vals = keys.map((k) => weightNum(w[k])).filter(Number.isFinite)
    return vals.length ? vals.reduce((a, b) => a + b, 0) : undefined
  }
  const out = {
    compliance: sum("compliance"),
    legitimacy: sum("legitimacy"),
    fundability: sum("fundability", "capitalAppeal"),
    governanceLeadership: sum("governanceLeadership") ?? sum("governance", "leadership"),
    operational: sum("operational", "operationalStrength"),
  }
  return Object.values(out).some((v) => v > 0) ? out : null
}

export const getFunderScoreWeightings = (form = {}) =>
  normalizeWeightings(
    form.scoreWeightings ||
      form.applicationBrief?.scoreWeightings ||
      form.applicationBrief?.evaluationWeightings ||
      form.generalInvestmentPreference?.scoreWeightings ||
      form.investmentRequirements?.weights,
  )

/* Returns { score, base, adjusted, delta, categories, missing, provisional }.
   A category the SME has no score for yet (for example operational, which is
   new) is left out and the remaining weights are re-based; the result is then
   flagged provisional with the missing categories named, never silently
   treated as zero. */
export function calculateAdjustedBigScore(bigEvaluation, funderWeightings) {
  const scores = bigEvaluation?.scores || {}
  const base = readScoreValue(scores.bigScore)
  const baseScore = Number.isFinite(base) ? Math.round(base) : null
  const plain = { score: baseScore, base: baseScore, adjusted: false, delta: 0, categories: [], missing: [], provisional: false }

  if (!funderWeightings || typeof funderWeightings !== "object") return plain

  const wanted = CATEGORY_KEYS.map((key) => ({ key, weight: Number(funderWeightings[key]) })).filter(
    (c) => Number.isFinite(c.weight) && c.weight > 0,
  )
  if (wanted.length === 0) return plain

  const scored = wanted.map((c) => ({ ...c, value: readScoreValue(scores[c.key]) }))
  const usable = scored.filter((c) => Number.isFinite(c.value))
  const missing = scored.filter((c) => !Number.isFinite(c.value)).map((c) => c.key)

  const totalWeight = usable.reduce((sum, c) => sum + c.weight, 0)
  if (usable.length === 0 || totalWeight === 0) return { ...plain, missing, provisional: missing.length > 0 }

  const weighted = usable.reduce((sum, c) => sum + c.value * (c.weight / totalWeight), 0)
  const score = Math.round(weighted)

  return {
    score,
    base: baseScore,
    adjusted: true,
    delta: baseScore === null ? 0 : score - baseScore,
    categories: usable.map((c) => ({ ...c, share: Math.round((c.weight / totalWeight) * 100) })),
    missing,
    provisional: missing.length > 0,
  }
}

/* ─── Formatting ────────────────────────────────────────────────────────── */

export const formatLabel = (value) => {
  if (!value) return ""
  return value
    .toString()
    .split(",")
    .map((item) => item.trim())
    .map((word) => {
      const lower = word.toLowerCase()
      if (lower === "ict") return "ICT"
      if (lower === "southafrica" || lower === "south_africa") return "South Africa"
      return word
        .split(/[_\s-]+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ")
    })
    .filter(Boolean)
    .join(", ")
}

export const formatDocumentLabel = (label) =>
  !label
    ? ""
    : label
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")

export const formatSectorLabel = (value) => {
  if (!value) return ""
  return value
    .toString()
    .split(",")
    .map((item) => item.trim())
    .map((sector) =>
      sector
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    )
    .filter(Boolean)
    .join(", ")
}

export const formatTicketSize = (min, max) => {
  const minAmount = normalizeAmount(min)
  const maxAmount = normalizeAmount(max)

  if (minAmount > 0 && maxAmount > 0) {
    if (minAmount === maxAmount) return `R${minAmount.toLocaleString("en-ZA")}`
    return `R${minAmount.toLocaleString("en-ZA")} – R${maxAmount.toLocaleString("en-ZA")}`
  }
  if (minAmount > 0) return `From R${minAmount.toLocaleString("en-ZA")}`
  if (maxAmount > 0) return `Up to R${maxAmount.toLocaleString("en-ZA")}`
  return "Not specified"
}

const LOCATION_MAP = {
  country_specific: "Country Specific",
  regional_emea: "EMEA",
  regional_apac: "APAC",
  regional_na: "North America",
  south_africa: "South Africa",
  global: "Global",
}

export const formatSingleLocation = (loc) => {
  if (!loc) return ""
  return (
    LOCATION_MAP[loc.toString().toLowerCase()] ||
    loc
      .toString()
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  )
}

export const formatLocation = (locations) => {
  if (!locations) return "Global"
  const list = Array.isArray(locations) ? locations : locations.toString().split(",")
  const formatted = list.map((l) => formatSingleLocation(l.toString().trim())).filter(Boolean)
  return formatted.join(", ") || "Global"
}

const INVESTMENT_STAGE_LABELS = {
  early_pre_seed: "Pre-Seed",
  early_seed: "Seed",
  venture_series_a: "Series A",
  venture_series_b: "Series B",
  venture_series_c: "Series C",
  late_growth_pe: "Growth",
  late_mbo: "MBO",
  late_mbi: "MBI",
  late_lbo: "LBO",
}

export const formatInvestmentStage = (stage) => {
  if (!stage) return "Various"
  const list = Array.isArray(stage) ? stage : stage.toString().split(",")
  const formatted = list
    .map((s) => {
      const key = s.toString().trim().toLowerCase()
      return INVESTMENT_STAGE_LABELS[key] || formatLabel(s)
    })
    .filter(Boolean)
  return formatted.join(", ") || "Various"
}

export const formatSupport = (support) => {
  if (!support) return "Not specified"
  const map = {
    mentorship: "Mentorship",
    network_access: "Network Access",
    technical_assistance: "Technical Assistance",
  }
  const list = Array.isArray(support) ? support : support.toString().split(",")
  const formatted = list
    .map((s) => s.toString().trim())
    .filter((s) => s && s.toLowerCase() !== "none")
    .map((s) => map[s.toLowerCase()] || formatLabel(s))
  return formatted.length > 0 ? formatted.join(", ") : "None"
}

export const formatWaitingTime = (value) => {
  if (!value || value === "-") return "Not specified"
  return value
    .toString()
    .replace(/([0-9]+)\s*-+\s*([0-9]+)\s*(days?|weeks?|months?)/i, "$1–$2 $3")
    .replace(/([0-9]+)(days?|weeks?|months?)/i, "$1 $2")
    .trim()
}

/* ─── Funder requirements + shared fund shaping (both tables use these) ─── */
export const DEFAULT_MIN_BIG_SCORE = 75

const asList = asListLocal

export const buildFundRequirements = (prefs = {}) => ({
  minimumBigScore: normalizeAmount(prefs.minimumBigScore) || DEFAULT_MIN_BIG_SCORE,
  minimumCompliance: normalizeAmount(prefs.minimumComplianceScore),
  minimumFinancialStrength: normalizeAmount(prefs.minimumFinancialStrength),
  minimumOperational: normalizeAmount(prefs.minimumOperationalStrength),
  minimumRevenue: normalizeAmount(prefs.minimumRevenue),
  minimumYearsTrading: normalizeAmount(prefs.minimumYearsTrading),
})

export function evaluateFundRequirements(req = {}, { bigScore, adjusted, evaluation, profile } = {}) {
  const unmet = []
  const num = (v) => readScoreValue(v)
  const scores = evaluation?.scores || {}

  // The funder's own weighting decides the score it is judged on.
  const effective = Number.isFinite(adjusted?.score) ? adjusted.score : num(bigScore)
  const minBig = req.minimumBigScore || DEFAULT_MIN_BIG_SCORE
  if (!Number.isFinite(effective) || effective < minBig) {
    unmet.push({
      key: "bigScore",
      label: "BIG Score",
      required: `${minBig}%`,
      actual: Number.isFinite(effective) ? `${effective}%` : "not scored yet",
    })
  }

  // Pillar minimums are skipped when that pillar has no score to compare.
  const pillar = (key, label, min, raw) => {
    const value = num(raw)
    if (min > 0 && Number.isFinite(value) && value < min) {
      unmet.push({ key, label, required: `${min}%`, actual: `${Math.round(value)}%` })
    }
  }
  pillar("compliance", "Compliance score", req.minimumCompliance, scores.compliance)
  pillar("financial", "Financial strength (Capital Appeal)", req.minimumFinancialStrength, scores.fundability)
  pillar("operational", "Operational strength", req.minimumOperational, scores.operational)

  const revenue = normalizeAmount(profile?.financialOverview?.annualRevenue)
  if (req.minimumRevenue > 0 && revenue < req.minimumRevenue) {
    unmet.push({
      key: "revenue",
      label: "Annual revenue",
      required: `R${req.minimumRevenue.toLocaleString("en-ZA")}`,
      actual: revenue ? `R${revenue.toLocaleString("en-ZA")}` : "not declared",
    })
  }
  const years = Number(profile?.entityOverview?.yearsInOperation)
  if (req.minimumYearsTrading > 0 && Number.isFinite(years) && years < req.minimumYearsTrading) {
    unmet.push({ key: "years", label: "Years trading", required: `${req.minimumYearsTrading}`, actual: `${years}` })
  }
  return unmet
}

/* First value that is actually filled in. `??` is not enough: an untouched
   form input is "" (not null), so it would stop the fallback chain on an
   empty string. */
const firstPresent = (...vals) => vals.find((v) => v !== null && v !== undefined && v !== "")

/* The old fallback used the fund's total size as the maximum ticket when no
   maximum was entered, which made a R500M fund look like it writes R500M
   cheques. It now falls back to the General Investment Preferences ticket
   fields, then to nothing. */
export const resolveTicketRange = (form = {}, fund = {}, index = 0) => {
  const p = form.fundDetails?.funds?.[index] || fund
  const prefs = form.generalInvestmentPreference || {}
  const minTicket =
    firstPresent(
      p?.minimumTicket, p?.minTicket, fund.minimumTicket, fund.minTicket,
      form.fundDetails?.minimumTicket, p?.ticketSize?.min, prefs.minimumTicketSize,
    ) ?? 0
  const maxTicket =
    firstPresent(
      p?.maximumTicket, p?.maxTicket, fund.maximumTicket, fund.maxTicket,
      form.fundDetails?.maximumTicket, p?.ticketSize?.max, prefs.maximumTicketSize,
    ) ?? 0
  return { minTicket, maxTicket }
}

export const buildScoringFund = (form = {}, fund = {}, index = 0) => {
  const prefs = form.generalInvestmentPreference || {}
  const { minTicket, maxTicket } = resolveTicketRange(form, fund, index)
  return {
    ...fund,
    stages: asList(prefs.investmentStage),
    sectorFocus: asList(prefs.sectorFocus),
    sectorExclusions: asList(prefs.sectorExclusions),
    geographicFocus: asList(prefs.geographicFocus),
    selectedProvinces: asList(prefs.selectedProvinces),
    selectedCountries: asList(prefs.selectedCountries),
    // Categories and the subtypes picked under them, so "Convertible Notes"
    // or "Invoice Finance" count even when only the category was ticked.
    instruments: [...asList(prefs.investmentFocus), ...asList(prefs.investmentFocusSubtype)],
    minimumTicket: minTicket,
    maximumTicket: maxTicket,
    supportOffered: asList(fund.supportOffered),
    dueDiligenceTimeline: fund.dueDiligenceTimeline || prefs.typicalDealClosingTime,
  }
}

/* ─── Documents: pull from what the SME already uploaded ─── */
const isUrl = (v) => typeof v === "string" && v.startsWith("http")

// Accepts a string, an array of strings, or an array/object of { url }.
export const pickDocumentUrl = (value) => {
  if (isUrl(value)) return value
  if (Array.isArray(value)) {
    for (const v of value) {
      const u = pickDocumentUrl(v)
      if (u) return u
    }
    return null
  }
  if (value && typeof value === "object") return pickDocumentUrl(value.url)
  return null
}

const compact = (s) => (s || "").toString().toLowerCase().replace(/[\s_&-]/g, "")

// Investor coreDocuments ids -> keys the SME profile actually uses.
export const DOCUMENT_ALIASES = {
  pitch_deck: ["pitchDeck"],
  business_plan: ["businessPlan"],
  financials: ["financialStatements", "auditedFinancials"],
  financial_statements: ["financialStatements"],
  audited_financials: ["auditedFinancials"],
  team_bios: ["cv_multiple", "CV_multiple"],
}

export const resolveProfileDocument = (profile = {}, label, mappedValue) => {
  const direct = pickDocumentUrl(mappedValue)
  if (direct) return direct
  const wanted = [label, ...(DOCUMENT_ALIASES[label] || [])].map(compact)
  const boxes = [profile.documents, profile.documentUpload, profile.fundingDocuments, profile]
  for (const box of boxes) {
    if (!box || typeof box !== "object") continue
    for (const [key, value] of Object.entries(box)) {
      if (!wanted.includes(compact(key))) continue
      const url = pickDocumentUrl(value)
      if (url) return url
    }
  }
  return null
}