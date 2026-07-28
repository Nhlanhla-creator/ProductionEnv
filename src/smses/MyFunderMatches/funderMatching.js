"use client"

/* ════════════════════════════════════════════════════════════════════════════
   funderMatching.js

   Scoring, normalising and formatting for funder matches, split out of
   FundingTable.js so the table file is a table again. funding-table.jsx
   re-exports everything here by name, so existing imports keep working.
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
  seriesc: "venture_series_c",
  growth: "late_growth_pe",
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

export const normalizeSector = (value) => {
  if (!value) return ""
  const key = value.toLowerCase().replace(/[\s-]/g, "_").trim()
  return SECTOR_SYNONYMS[key] || key
}

/* The old expandSectorsWithSynonyms did `Array.isArray(SECTOR_SYNONYMS[sector])`
   against a map whose values are all strings, so the branch never ran and the
   function returned its input unchanged — every synonym in the table above was
   dead weight. It now canonicalises both sides instead, which is what makes
   "ICT" on an SME profile match "information_technology" on a fund. */
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
    instruments: normalizeArray(funds.fundingInstruments),
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
    instruments: Array.isArray(fund.instruments)
      ? fund.instruments.map((i) => i?.toLowerCase().trim()).filter(Boolean)
      : [fund.instruments?.toLowerCase().trim()].filter(Boolean),
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

export function calculateHybridScore(sme, investorFund) {
  const fund = normalizeInvestorFund(investorFund)
  const breakdown = {}
  let score = 0

  /* Sector. The old version computed matchRatio and then threw it away,
     assigning a flat 10 for any overlap — one sector out of five scored the
     same as five out of five. The ratio is now what it scores on. */
  const smeSectors = expandSectorsWithSynonyms(sme.economicSectors)
  const matchedSectors = smeSectors.filter((s) => fund.sectors.includes(s))
  const hasExclusion = fund.excludedSectors.some((ex) => smeSectors.includes(ex))
  const sectorRatio = sme.economicSectors.length > 0 ? matchedSectors.length / sme.economicSectors.length : 0
  const sectorScore = hasExclusion ? 0 : Math.min(1, sectorRatio) * 10
  score += sectorScore * HYBRID_WEIGHTS.sector
  breakdown.sector = {
    score: sectorScore * 10,
    matched: matchedSectors,
    smeSectors: sme.economicSectors,
    investorSectors: fund.sectors,
    hasExclusion,
    weight: HYBRID_WEIGHTS.sector,
  }

  const stageMatched = fund.stages.includes(sme.applicationStage)
  const stageScore = stageMatched ? 10 : 0
  score += stageScore * HYBRID_WEIGHTS.stage
  breakdown.stage = {
    score: stageScore * 10,
    smeStage: sme.applicationStage,
    investorStages: fund.stages,
    matched: stageMatched,
    weight: HYBRID_WEIGHTS.stage,
  }

  const matchedInstruments = fund.instruments.filter((inst) =>
    sme.instruments.some((smeInst) => smeInst?.toLowerCase() === inst),
  )
  const typeScore = matchedInstruments.length > 0 ? 10 : 0
  score += typeScore * HYBRID_WEIGHTS.type
  breakdown.type = {
    score: typeScore * 10,
    smeInstruments: sme.instruments,
    investorInstruments: fund.instruments,
    matchedInstruments,
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

/* ─── Adjusted BIG Score ────────────────────────────────────────────────────
   Spec section C column 3: "funders can change weightings, so BIG score may
   change because of funder-specific weightings".

   The base score in bigEvaluations/{smeId} is computed on the platform's own
   weighting. A funder that publishes its own weighting gets its own number,
   and the table shows the delta so an SME can see who scores them kindly.

   Custom weights are looked for at several plausible paths because the
   authoring UI for them may not exist yet. Where none are found the base score
   is returned with adjusted:false and the column renders the plain BIG Score.
   ──────────────────────────────────────────────────────────────────────── */

export const getFunderScoreWeightings = (funderFormData = {}) =>
  funderFormData.scoreWeightings ||
  funderFormData.applicationBrief?.scoreWeightings ||
  funderFormData.applicationBrief?.evaluationWeightings ||
  funderFormData.generalInvestmentPreference?.scoreWeightings ||
  null

export function calculateAdjustedBigScore(bigEvaluation, funderWeightings) {
  const scores = bigEvaluation?.scores || {}
  const base = Number(scores.bigScore)
  const baseScore = Number.isFinite(base) ? Math.round(base) : null

  if (!funderWeightings || typeof funderWeightings !== "object") {
    return { score: baseScore, base: baseScore, adjusted: false, delta: 0, categories: [] }
  }

  // Every numeric entry other than the headline score is a category.
  const categories = Object.entries(scores)
    .filter(([key, value]) => key !== "bigScore" && Number.isFinite(Number(value)))
    .map(([key, value]) => ({ key, value: Number(value), weight: Number(funderWeightings[key]) }))
    .filter((c) => Number.isFinite(c.weight) && c.weight > 0)

  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0)
  if (categories.length === 0 || totalWeight === 0) {
    return { score: baseScore, base: baseScore, adjusted: false, delta: 0, categories: [] }
  }

  const weighted = categories.reduce((sum, c) => sum + c.value * (c.weight / totalWeight), 0)
  const score = Math.round(weighted)

  return {
    score,
    base: baseScore,
    adjusted: true,
    delta: baseScore === null ? 0 : score - baseScore,
    categories: categories.map((c) => ({ ...c, share: Math.round((c.weight / totalWeight) * 100) })),
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

/* The old formatLocation had a branch for arrays of single characters, because
   somewhere upstream a string was being spread into an array. Fixing the cause
   is better than detecting the symptom: callers now pass arrays or strings and
   this handles both without guessing. */
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