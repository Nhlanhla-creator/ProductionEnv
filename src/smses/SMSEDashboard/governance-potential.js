// ─────────────────────────────────────────────────────────────────────────
// GOVERNANCE & LEADERSHIP — POTENTIAL POINTS
//
// WHY THIS IS SIMULATED RATHER THAN TABULATED
//
//   The other cards work out a point value with arithmetic: item points
//   withheld ÷ category points × weight. That works because their scoring
//   is a flat sum.
//
//   This card's is not. The Board Structure score has a shortfall penalty
//   that also deducts a second time from Governance Maturity; composition
//   checks are skipped when evidence is absent, which changes the
//   denominator; the PIS moves the requirement band. Adding one director
//   can move the score by an amount no static table could predict.
//
//   So a point value here is measured, not derived: patch the profile as
//   if the action were done, re-run the SAME scoring function the card
//   uses, and take the difference. The number cannot drift from the score
//   because it is produced by the score.
//
// DECLARED VS EVIDENCED
//
//   Most governance fields are self-assessed dropdowns. Offering points for
//   changing "informal" to "documented_shared" is offering points for
//   claiming a maturity level, which is not the same as reaching one.
//
//   So the two are kept apart:
//     - UNANSWERED  → a real opportunity. The action is "answer it", and
//                     the value is measured at an honest middle option.
//     - ANSWERED LOW→ NOT listed as points to claim. It appears under
//                     "Earn by doing", where the action is producing the
//                     underlying artefact — a written continuity plan, a
//                     real risk register — and the value is what the top
//                     option is worth once that artefact exists.
// ─────────────────────────────────────────────────────────────────────────

const PROFILE_ROUTE = "/profile"
const DOCUMENTS_ROUTE = "/my-documents"

export const SECTION_TARGETS = {
  "Ownership & Management": `${PROFILE_ROUTE}?section=ownershipManagement`,
  Governance: `${PROFILE_ROUTE}?section=governance`,
  "Enterprise Readiness": `${PROFILE_ROUTE}?section=enterpriseReadiness`,
  "Legal & Compliance": `${PROFILE_ROUTE}?section=legalCompliance`,
  "Entity Overview": `${PROFILE_ROUTE}?section=entityOverview`,
  "Financial Overview": `${PROFILE_ROUTE}?section=financialOverview`,
  "My Documents": `${DOCUMENTS_ROUTE}?doc=cv&search=CV`,
}

export const routeFor = (section, field) => {
  const base = SECTION_TARGETS[section]
  if (!base) return null
  if (!field) return base
  return `${base}${base.includes("?") ? "&" : "?"}field=${encodeURIComponent(field)}`
}

const cleanStr = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim())
const isYesish = (v) => v === true || ["yes", "true", "y"].includes(cleanStr(v).toLowerCase())
const answered = (v) => cleanStr(v) !== ""
const clone = (o) => JSON.parse(JSON.stringify(o ?? {}))

const setPath = (obj, path, value) => {
  const parts = path.split(".")
  let cur = obj
  parts.slice(0, -1).forEach((p) => {
    if (cur[p] == null || typeof cur[p] !== "object") cur[p] = {}
    cur = cur[p]
  })
  cur[parts[parts.length - 1]] = value
  return obj
}

const getPath = (obj, path) =>
  path.split(".").reduce((cur, p) => (cur == null ? undefined : cur[p]), obj)

// ═════════════════════════════════════════════════════════════════════════
// LEADERSHIP QUALITY — deterministic
//
// This replaces parseLeadershipAiScores. That function returned 0 for every
// category until an AI run completed, so 40% of the pillar sat at zero on
// first load and the headline score was understated by up to 40 points for
// anyone who never pressed "Load AI analysis". It also made point values
// impossible, because the AI could return different numbers next run.
//
// Every input below is a field that already exists on the profile or in the
// parsed CV store.
// ═════════════════════════════════════════════════════════════════════════

const LEADERSHIP_WEIGHTS = { credentials: 40, structure: 30, behaviour: 30 }

const QUAL_PATTERNS = {
  designation: [/\bCA\s*\(?SA\)?/i, /chartered account/i, /\bCFA\b/i, /\bCIMA\b/i, /\bACCA\b/i, /\bSAIPA\b/i, /\bPr\.?\s?Eng\b/i, /\bPMP\b/i, /admitted\s+(attorney|advocate)/i],
  postgrad: [/\bMBA\b/i, /\bM\.?(Com|Sc|Eng|A|BA|Phil|Tech)\b/i, /\bPh\.?D\b/i, /\bLL\.?M\b/i, /master'?s/i, /honours/i],
  degree: [/\bB\.?\s?(Com|Sc|Eng|A|Tech|Bus|Admin)\b/i, /\bLL\.?B\b/i, /bachelor/i],
  diploma: [/\bN\.?\s?Dip\b/i, /national diploma/i, /\bdiploma\b/i, /\bcertificate\b/i],
}

const GOVERNANCE_TRAINING = [
  /King\s*I{1,3}V?\b/i, /\bIoDSA\b/i, /institute of directors/i,
  /director'?s?\s+(course|development|programme|program|training)/i, /corporate governance/i,
]

const sameName = (a, b) => !!a && !!b && cleanStr(a).toLowerCase() === cleanStr(b).toLowerCase()

const cvText = (cv) => {
  if (!cv) return ""
  const bits = [cv.currentRole, cv.currentCompany, cv.summary, cv.professionalSummary]
  if (Array.isArray(cv.skills)) bits.push(cv.skills.join(" "))
  if (Array.isArray(cv.certifications)) bits.push(cv.certifications.join(" "))
  if (Array.isArray(cv.education)) cv.education.forEach((e) => bits.push(e?.degree, e?.field, e?.institution))
  if (Array.isArray(cv.experience)) cv.experience.forEach((e) => bits.push(e?.role, e?.title, e?.company, e?.description))
  return bits.filter(Boolean).join(" | ")
}

const mkItem = ({ key, label, points, credit, section, field, evidence, reason, fix, guidance, importance, selfDeclared, applicable = true }) => {
  const c = Math.max(0, Math.min(1, credit || 0))
  const earned = Math.round(points * c)
  return {
    key, label, points, credit: c, earned, withheld: points - earned,
    section, field, route: routeFor(section, field),
    evidence: evidence || "", reason: reason || null, fix: fix || null,
    guidance: guidance || null, importance: importance || null,
    selfDeclared: !!selfDeclared, applicable,
    state: c >= 1 ? "counted" : c > 0 ? "partial" : "missing",
  }
}

const rollUp = (items, weightPct, label, color) => {
  const live = items.filter((i) => i.applicable)
  const possible = live.reduce((s, i) => s + i.points, 0) || 1
  const earned = live.reduce((s, i) => s + i.earned, 0)
  const percent = (earned / possible) * 100
  return {
    name: label, color, weight: weightPct,
    items: live.map((i) => ({ ...i, categoryLabel: label })),
    earned, possible,
    score: Math.round(percent),
    rawScore: Math.round((percent / 20) * 10) / 10,
    maxScore: 5,
    weightedScore: Math.round(percent * (weightPct / 100)),
  }
}

export const computeLeadershipQuality = (profileData, cvProfiles, roleCoverage) => {
  const om = profileData?.ownershipManagement || {}
  const bl = om.businessLeadership || {}
  const directors = (om.directors || []).filter((d) => d?.name && d.name.trim() !== "")
  const executives = (om.executives || []).filter((e) => e?.name && e.name.trim() !== "")
  const cvs = cvProfiles || []

  // ── Credentials — what the CVs actually show ──
  const perDirector = directors.map((d) => {
    const cv = cvs.find((c) => sameName(c?.personName, d.name))
    const text = cvText(cv)
    const tiers = Object.entries(QUAL_PATTERNS).filter(([, pats]) => text && pats.some((p) => p.test(text)))
    const years = Number(cv?.yearsOfExperience)
    return {
      name: d.name,
      parsed: !!cv,
      qualified: tiers.length > 0,
      senior: Number.isFinite(years) && years >= 5,
      governanceTrained: !!text && GOVERNANCE_TRAINING.some((p) => p.test(text)),
    }
  })

  const n = directors.length || 1
  const parsedCount = perDirector.filter((d) => d.parsed).length
  const qualifiedCount = perDirector.filter((d) => d.qualified).length
  const seniorCount = perDirector.filter((d) => d.senior).length
  const govTrained = perDirector.filter((d) => d.governanceTrained).length

  const credentialItems = [
    mkItem({
      key: "cvCoverage", label: "Director CVs on file and readable", points: 40,
      credit: directors.length ? parsedCount / n : 0,
      section: "Ownership & Management", field: "directors",
      importance: "A job title says what someone does; a CV says what they are qualified to do.",
      evidence: `${parsedCount} of ${directors.length} director CV${directors.length === 1 ? "" : "s"} readable`,
      reason: directors.length === 0
        ? "No directors are captured, so there is nobody to evidence."
        : parsedCount < directors.length
        ? `${directors.length - parsedCount} director${directors.length - parsedCount === 1 ? " has" : "s have"} no readable CV: ${perDirector.filter((d) => !d.parsed).map((d) => d.name).join(", ")}.`
        : null,
      fix: directors.length === 0
        ? "Add every director under Ownership & Management."
        : parsedCount < directors.length
        ? "Upload a CV against each director row. Names must match the Directors table exactly or the CV will not be credited."
        : null,
    }),
    mkItem({
      key: "qualifications", label: "Formal qualifications evidenced", points: 30,
      credit: directors.length ? qualifiedCount / n : 0,
      section: "Ownership & Management", field: "directors",
      importance: "Funders want to see the board can interrogate management, not just agree with it.",
      evidence: `${qualifiedCount} of ${directors.length} carrying a recognised qualification`,
      guidance: "Qualifications are read from the education and certifications fields of the parsed CV — if one is missing there, it cannot be credited here.",
    }),
    mkItem({
      key: "seniority", label: "Five or more years' experience", points: 15,
      credit: directors.length ? seniorCount / n : 0,
      section: "Ownership & Management", field: "directors",
      importance: "Seniority is what separates a qualified director from a qualified employee.",
      evidence: `${seniorCount} of ${directors.length} with five or more years recorded`,
    }),
    mkItem({
      key: "governanceTraining", label: "Board or governance training", points: 15,
      credit: govTrained > 0 ? 1 : 0,
      section: "Ownership & Management", field: "directors",
      importance: "Cheap to obtain, commonly missing, and a funder will ask.",
      guidance: "King IV, IoDSA or any directors' development programme. Record it under certifications on the CV.",
      evidence: govTrained ? `${govTrained} director${govTrained === 1 ? "" : "s"} with governance training` : "",
    }),
  ]

  // ── Structure — is the operating team actually staffed? ──
  const buckets = roleCoverage?.bucketCoverage || {}
  const bucketKeys = Object.keys(buckets)
  const coveredBuckets = bucketKeys.filter((k) => (buckets[k] || []).length > 0).length
  const missingRoles = roleCoverage?.missingCriticalRoles || []
  const unclassified = directors.filter((d) => d.execType !== "Executive" && d.execType !== "Non-Executive").length

  const structureItems = [
    mkItem({
      key: "roleCoverage", label: `Critical roles covered (${coveredBuckets} of ${bucketKeys.length || 6})`, points: 40,
      credit: bucketKeys.length ? coveredBuckets / bucketKeys.length : 0,
      section: "Ownership & Management", field: "executives",
      importance: "An uncovered function is work nobody owns — a funder reads it as execution risk.",
      evidence: missingRoles.length ? `Not covered: ${missingRoles.map((b) => b.label).join(", ")}` : "Every critical role has a named person",
      reason: missingRoles.length ? `${missingRoles.map((b) => b.label).join(", ")} ${missingRoles.length === 1 ? "has" : "have"} nobody named against ${missingRoles.length === 1 ? "it" : "them"}.` : null,
      fix: missingRoles.length ? "Add the person holding each of these under Directors or Executives — often the role is filled and simply unrecorded." : null,
    }),
    mkItem({
      key: "managementDepth", label: "Management team recorded beyond the board", points: 20,
      credit: executives.length >= 1 ? 1 : 0,
      section: "Ownership & Management", field: "executives",
      importance: "Shows the business does not stop when the founder is unavailable.",
      evidence: executives.length ? `${executives.length} executive${executives.length === 1 ? "" : "s"} named` : "",
    }),
    mkItem({
      key: "directorDepth", label: "At least two directors", points: 20,
      credit: directors.length >= 2 ? 1 : directors.length === 1 ? 0.5 : 0,
      section: "Ownership & Management", field: "directors",
      importance: "A sole director means no second voice in any decision.",
      evidence: `${directors.length} director${directors.length === 1 ? "" : "s"}`,
    }),
    mkItem({
      key: "classification", label: "Every director classified executive or non-executive", points: 20,
      credit: directors.length === 0 ? 0 : unclassified === 0 ? 1 : 1 - unclassified / n,
      section: "Ownership & Management", field: "directors",
      importance: "Without it a funder cannot tell who is independent.",
      reason: unclassified > 0 ? `${unclassified} director${unclassified === 1 ? " is" : "s are"} unclassified.` : null,
      fix: unclassified > 0 ? "Set Exec/Non-Exec on each director row, or pick Executive / Non-Executive / Independent Director under Roles." : null,
    }),
  ]

  // ── Behaviour — the six Business Leadership answers, plus conduct signals ──
  const activeConflicts = (om.activeInterests || []).filter((i) => i?.assignedTo && i.businessStatus && i.businessStatus !== "Closed")
  const overloaded = roleCoverage?.overloadedPeople || []

  const scale = (v, map) => (answered(v) ? map[cleanStr(v)] ?? 0 : 0)

  const behaviourItems = [
    mkItem({
      key: "opennessToAdvice", label: "Openness to outside advice", points: 20, selfDeclared: true,
      credit: scale(bl.opennessToAdvice, { very_open: 1, open_evaluate: 0.8, sometimes_open: 0.4, prefer_own: 0 }),
      section: "Ownership & Management", field: "opennessToAdvice",
      importance: "The single best predictor of whether support and funding will be used well.",
      evidence: cleanStr(bl.opennessToAdvice),
    }),
    mkItem({
      key: "decisionGovernance", label: "How decisions are made", points: 20, selfDeclared: true,
      credit: scale(bl.decisionGovernance, { board_led: 1, management_founder_oversight: 0.8, founder_with_team: 0.6, founder_all: 0.2 }),
      section: "Ownership & Management", field: "decisionGovernance",
      importance: "Founder-only decision-making is the risk funders price highest in an SME.",
      evidence: cleanStr(bl.decisionGovernance),
      guidance: "Moving up here means genuinely changing how decisions are taken — bringing a second person into the call, then minuting it — not reselecting the dropdown.",
    }),
    mkItem({
      key: "founderFullTime", label: "Founder involved full time", points: 15, selfDeclared: true,
      credit: isYesish(bl.founderFullTime) ? 1 : answered(bl.founderFullTime) ? 0.3 : 0,
      section: "Ownership & Management", field: "founderFullTime",
      importance: "Part-time founders are funded far less often, and funders always ask.",
      evidence: cleanStr(bl.founderFullTime),
    }),
    mkItem({
      key: "growthAmbition", label: "Five-year growth ambition stated", points: 15, selfDeclared: true,
      credit: answered(bl.growthAmbition) ? 1 : 0,
      section: "Ownership & Management", field: "growthAmbition",
      importance: "A funder needs to know what they are backing you to become.",
      evidence: cleanStr(bl.growthAmbition),
    }),
    mkItem({
      key: "primaryMotivation", label: "Primary motivation stated", points: 10, selfDeclared: true,
      credit: answered(bl.primaryMotivation) ? 1 : 0,
      section: "Ownership & Management", field: "primaryMotivation",
      evidence: cleanStr(bl.primaryMotivation),
    }),
    mkItem({
      key: "conflictDisclosure", label: "Outside business interests disclosed", points: 10,
      credit: activeConflicts.length === 0 ? 1 : 0.6,
      section: "Ownership & Management", field: "activeInterests",
      importance: "Disclosure is what is being scored here, not the absence of other interests.",
      evidence: activeConflicts.length
        ? `${activeConflicts.length} active interest${activeConflicts.length === 1 ? "" : "s"} declared`
        : "None declared",
      guidance: activeConflicts.length
        ? "Declared interests are credited — a disclosed conflict is a governance strength, an undisclosed one is a finding."
        : null,
    }),
    mkItem({
      key: "concentration", label: "No single person spread across critical roles", points: 10,
      credit: overloaded.length === 0 ? 1 : 0,
      section: "Ownership & Management", field: "executives",
      importance: "One person holding several critical functions is a single point of failure.",
      reason: overloaded.length ? `${overloaded.map((p) => p.name).join(", ")} carries multiple critical roles.` : null,
      fix: overloaded.length ? "Name a second person against at least one of those functions, even part-time or outsourced." : null,
      evidence: overloaded.length ? overloaded.map((p) => p.name).join(", ") : "No concentration detected",
    }),
  ]

  const categories = [
    rollUp(credentialItems, LEADERSHIP_WEIGHTS.credentials, "Leadership Credentials", "#8D6E63"),
    rollUp(structureItems, LEADERSHIP_WEIGHTS.structure, "Leadership Structure", "#6D4C41"),
    rollUp(behaviourItems, LEADERSHIP_WEIGHTS.behaviour, "Leadership Behaviour", "#A67C52"),
  ]

  const totalScore = Math.round(categories.reduce((s, c) => s + c.score * (c.weight / 100), 0))
  return { totalScore, categories, items: categories.flatMap((c) => c.items), perDirector }
}

// ═════════════════════════════════════════════════════════════════════════
// OWNERSHIP & STRUCTURE — the existing heuristic, exposed as items
// The arithmetic is unchanged, so the score does not move.
// ═════════════════════════════════════════════════════════════════════════
export const computeOwnershipStructure = (profileData) => {
  const om = profileData?.ownershipManagement || {}
  const shareholders = (om.shareholders || []).filter((s) => s?.name && s.name.trim() !== "")
  const directors = (om.directors || []).filter((d) => d?.name && d.name.trim() !== "")
  const executives = (om.executives || []).filter((e) => e?.name && e.name.trim() !== "")
  const activeConflicts = (om.activeInterests || []).filter((i) => i?.assignedTo && i.businessStatus && i.businessStatus !== "Closed")

  const shareholderScore = shareholders.length >= 1 ? (shareholders.length <= 8 ? 100 : 60) : 0
  const directorScore = directors.length === 0 ? 0 : directors.length === 1 ? 55 : directors.length <= 6 ? 100 : 75
  const executiveScore = executives.length >= 1 ? 100 : 0
  const advisorBonus = isYesish(profileData?.enterpriseReadiness?.hasAdvisors) ? 100 : 0
  const conflictPenalty = Math.min(activeConflicts.length * 15, 40)

  const raw = Math.round(
    shareholderScore * 0.25 + directorScore * 0.35 + executiveScore * 0.2 + advisorBonus * 0.15 + 5
  ) - conflictPenalty

  const items = [
    mkItem({
      key: "shareholders", label: "Shareholders recorded", points: 25, credit: shareholderScore / 100,
      section: "Ownership & Management", field: "shareholders",
      evidence: `${shareholders.length} shareholder${shareholders.length === 1 ? "" : "s"}`,
      reason: shareholders.length > 8 ? "More than eight shareholders for an SME can signal fragmented decision-making." : null,
      importance: "Ownership transparency is the first thing due diligence checks.",
    }),
    mkItem({
      key: "directorsRecorded", label: "Directors recorded", points: 35, credit: directorScore / 100,
      section: "Ownership & Management", field: "directors",
      evidence: `${directors.length} director${directors.length === 1 ? "" : "s"}`,
      importance: "The directors are the board — nothing in Board Structure can be assessed without them.",
    }),
    mkItem({
      key: "executivesRecorded", label: "Executive team recorded", points: 20, credit: executiveScore / 100,
      section: "Ownership & Management", field: "executives",
      evidence: `${executives.length} executive${executives.length === 1 ? "" : "s"}`,
    }),
    mkItem({
      key: "advisorStructure", label: "Advisory structure declared", points: 15, credit: advisorBonus / 100,
      section: "Enterprise Readiness", field: "hasAdvisors",
      importance: "Below a PIS of 100 an advisory structure is what stands in for a board.",
    }),
  ]

  return { score: Math.min(Math.max(raw, 0), 100), items, conflictPenalty, activeConflicts }
}

// ═════════════════════════════════════════════════════════════════════════
// OPPORTUNITIES
//
// Each entry says how to detect that it is outstanding, and how to patch the
// profile as if it were done. The value is measured by re-scoring.
// ═════════════════════════════════════════════════════════════════════════

const namedPerson = (name) => ({ name, execType: "", roles: [], committeeMembership: [] })

// Self-assessed dropdowns. `mid` is the honest answer for a business that has
// something informal in place — used to value "answer this question".
// `top` is what the field is worth once the real artefact exists.
const DECLARED_FIELDS = [
  { path: "governance.strategicClarity.strategicDirection", label: "Strategic direction", section: "Governance", field: "strategicDirection", mid: "informal", top: "documented_shared", artefact: "a written strategy document shared with the team" },
  { path: "governance.strategicClarity.planningDepth", label: "Planning depth", section: "Governance", field: "planningDepth", mid: "1_2_selected", top: "3_4_selected", artefact: "planning that covers financial, operational, market and people horizons" },
  { path: "governance.strategicClarity.marketStrategy", label: "Market strategy", section: "Governance", field: "marketStrategy", mid: "partially_defined", top: "clearly_defined", artefact: "a defined target market, positioning and pricing approach" },
  { path: "governance.strategicClarity.executionRoadmap", label: "Execution roadmap", section: "Governance", field: "executionRoadmap", mid: "high_level_plan", top: "detailed_roadmap", artefact: "a roadmap with dated milestones and owners" },
  { path: "governance.strategicClarity.decisionMaking", label: "Decision-making", section: "Governance", field: "decisionMaking", mid: "semi_structured", top: "structured_data_driven", artefact: "decisions taken against reported numbers rather than instinct" },
  { path: "governance.strategicClarity.adaptability", label: "Adaptability", section: "Governance", field: "adaptability", mid: "some_adjustment", top: "structured_review", artefact: "a fixed review cycle where the plan is formally revisited" },

  { path: "governance.riskManagement.riskIdentification", label: "Risk identification", section: "Governance", field: "riskIdentification", mid: "informal_awareness", top: "documented_risk_register", artefact: "a written risk register, even a single spreadsheet" },
  { path: "governance.riskManagement.riskAssessment", label: "Risk assessment", section: "Governance", field: "riskAssessment", mid: "basic_informal", top: "structured_assessment", artefact: "each risk scored for likelihood and impact" },
  { path: "governance.riskManagement.riskMitigation", label: "Risk mitigation", section: "Governance", field: "riskMitigation", mid: "some_mitigation_actions", top: "defined_mitigation_plans", artefact: "a named action and owner against each material risk" },
  { path: "governance.riskManagement.businessContinuity", label: "Business continuity", section: "Governance", field: "businessContinuity", mid: "partial_informal_plan", top: "formal_documented_plan", artefact: "a one-page continuity plan naming backup supplier, premises and decision-maker" },
  { path: "governance.riskManagement.crisisPreparedness", label: "Crisis preparedness", section: "Governance", field: "crisisPreparedness", mid: "some_readiness", top: "clear_response_protocols", artefact: "written response protocols people have actually read" },
  { path: "governance.riskManagement.riskOwnership", label: "Risk ownership", section: "Governance", field: "riskOwnership", mid: "shared_unclear", top: "clear_ownership", artefact: "a named person accountable for each risk" },

  { path: "governance.transparencyReporting.reportingFrequency", label: "Reporting frequency", section: "Governance", field: "reportingFrequency", mid: "quarterly", top: "monthly", artefact: "a monthly reporting pack" },
  { path: "governance.transparencyReporting.performanceReviewCycle", label: "Performance review cycle", section: "Governance", field: "performanceReviewCycle", mid: "quarterly_biannual", top: "monthly", artefact: "a monthly performance review rhythm" },
  { path: "governance.transparencyReporting.kpiMonitoring", label: "KPI monitoring", section: "Governance", field: "kpiMonitoring", mid: "some_kpis_tracked", top: "defined_kpis_tracked", artefact: "a defined KPI set tracked on a fixed cadence" },
  { path: "governance.transparencyReporting.stakeholderCommunication", label: "Stakeholder communication", section: "Governance", field: "stakeholderCommunication", mid: "informal_updates", top: "structured_reports", artefact: "a structured report issued to stakeholders on a schedule" },
  { path: "governance.transparencyReporting.complianceAndRisk", label: "Compliance and risk processes", section: "Governance", field: "complianceAndRisk", mid: "partial_some_controls", top: "formal_risk_register_audits", artefact: "a risk register plus periodic control checks" },
  { path: "governance.transparencyReporting.dataGovernance", label: "Data governance", section: "Governance", field: "dataGovernance", mid: "basic_controls", top: "formal_popia_aligned", artefact: "a POPIA-aligned data policy with a named information officer" },
  { path: "governance.transparencyReporting.auditAndAssurance", label: "Audit and assurance", section: "Governance", field: "auditAndAssurance", mid: "occasional_audits", top: "regular_internal_external", artefact: "a regular independent review of the numbers" },
]

const POLICY_LABELS = {
  employmentContract: "Employment Contracts", nda: "Non-Disclosure Agreements", mou: "Memorandums of Understanding",
  suppliercontract: "Supplier Contracts", customerAgreements: "Customer Agreements", codeOfConduct: "Code of Conduct",
  ethicsPolicy: "Ethics Policy", whistleblowingPolicy: "Whistleblowing Policy", leavePolicy: "Leave Policy",
  disciplinaryPolicy: "Disciplinary Policy", healthSafetyPolicy: "Health & Safety Policy", privacyPolicy: "Privacy Policy",
  briberyCorruptionPolicy: "Bribery and Corruption Policy", remoteWorkPolicy: "Remote Work Policy",
  conflictInterestPolicy: "Conflict of Interest Policy", ipProtection: "IP Protection Policy",
  socialMediaPolicy: "Social Media Policy", expensePolicy: "Expense Policy", overtimePolicy: "Overtime Policy",
  terminationPolicy: "Termination Policy", performancePolicy: "Performance Policy",
}
const POLICY_KEYS = Object.keys(POLICY_LABELS)

// ── The catalogue ──
const buildCandidates = (profileData, cvProfiles, leadership) => {
  const om = profileData?.ownershipManagement || {}
  const gov = profileData?.governance || {}
  const er = profileData?.enterpriseReadiness || {}
  const directors = (om.directors || []).filter((d) => d?.name && d.name.trim() !== "")
  const executives = (om.executives || []).filter((e) => e?.name && e.name.trim() !== "")
  const shareholders = (om.shareholders || []).filter((s) => s?.name && s.name.trim() !== "")
  const checklist = gov.governanceChecklist || {}
  const out = []

  const add = (o) => out.push(o)

  // ── People ──
  if (directors.length === 0) {
    add({
      key: "addDirectors", group: "structure", label: "Record your directors",
      section: "Ownership & Management", field: "directors",
      action: "Add every director in the Directors table. The directors are the board, so nothing under Board Structure can be assessed until they are on record.",
      importance: "This is the single largest gap on the profile — it blocks Board Structure entirely.",
      patch: (p) => setPath(p, "ownershipManagement.directors", [namedPerson("Director 1"), namedPerson("Director 2")]),
    })
  } else if (directors.length === 1) {
    add({
      key: "secondDirector", group: "structure", label: "Add a second director",
      section: "Ownership & Management", field: "directors",
      action: "Appoint and record a second director. A sole director means every decision is taken alone.",
      importance: "Board size and non-executive ratio both improve, and the sole-director composition penalty falls away.",
      patch: (p) => setPath(p, "ownershipManagement.directors", [...(getPath(p, "ownershipManagement.directors") || []), namedPerson("Second Director")]),
    })
  }

  const noCv = (leadership?.perDirector || []).filter((d) => !d.parsed)
  if (noCv.length) {
    add({
      key: "directorCvs", group: "evidence", label: `Upload CVs for ${noCv.length} director${noCv.length === 1 ? "" : "s"}`,
      section: "Ownership & Management", field: "directors",
      action: `Upload a CV against ${noCv.map((d) => d.name).join(", ")}. The name on the CV must match the Directors table exactly or it will not be credited.`,
      importance: "Without a CV the seat is read from job title alone, and the Directors table has no role option for legal, technical, commercial or HR expertise — so a well-qualified board can read as empty.",
      patchCvs: (cvs) => [
        ...clone(cvs || []),
        ...noCv.map((d) => ({
          personName: d.name, yearsOfExperience: 8,
          education: [{ degree: "BCom", field: "Business" }],
          certifications: [], skills: [],
        })),
      ],
    })
  }

  const unclassified = directors.filter((d) => d.execType !== "Executive" && d.execType !== "Non-Executive")
  if (unclassified.length) {
    add({
      key: "classifyDirectors", group: "structure", label: `Classify ${unclassified.length} director${unclassified.length === 1 ? "" : "s"} as executive or non-executive`,
      section: "Ownership & Management", field: "directors",
      action: "Set Exec/Non-Exec on each director row, or pick Executive Director / Non-Executive Director / Independent Director under Roles — either resolves it.",
      importance: "Independence carries 18% of the Board Structure score and cannot be read while directors are unclassified.",
      patch: (p) => setPath(p, "ownershipManagement.directors",
        (getPath(p, "ownershipManagement.directors") || []).map((d, i) => (d?.name?.trim() ? { ...d, execType: d.execType || (i === 0 ? "Executive" : "Non-Executive") } : d))),
    })
  }

  const hasIndependent = directors.some(
    (d) => d.execType === "Non-Executive" && (d.linkedShareholderId === null || d.linkedShareholderId === undefined)
  )
  if (directors.length > 0 && !hasIndependent) {
    add({
      key: "independentDirector", group: "structure", label: "Appoint an independent non-executive director",
      section: "Ownership & Management", field: "directors",
      action: "Add one non-executive director who holds no shares. A sector-experienced person meeting quarterly is enough — it does not have to be a paid appointment.",
      importance: "A shareholder's nominee is not independent. Without one, nobody at the table can challenge management.",
      patch: (p) => setPath(p, "ownershipManagement.directors",
        [...(getPath(p, "ownershipManagement.directors") || []), { ...namedPerson("Independent NED"), execType: "Non-Executive", roles: ["Independent Director"], linkedShareholderId: undefined }]),
    })
  }

  if (executives.length === 0) {
    add({
      key: "addExecutives", group: "structure", label: "Record your management team",
      section: "Ownership & Management", field: "executives",
      action: "Add the people running finance, operations, sales and technology under Executives — including where a director also holds the role.",
      importance: "Critical role coverage is read from this table; leaving it blank reads as functions nobody owns.",
      patch: (p) => setPath(p, "ownershipManagement.executives", [{ name: "Executive 1", position: "Chief Financial Officer" }, { name: "Executive 2", position: "Operations Manager" }]),
    })
  }

  const missingRoles = leadership?.items?.find((i) => i.key === "roleCoverage")
  if (executives.length > 0 && missingRoles && missingRoles.withheld > 0) {
    add({
      key: "coverRoles", group: "structure", label: "Name someone against every critical role",
      section: "Ownership & Management", field: "executives",
      action: missingRoles.fix || "Add the person holding each uncovered function under Directors or Executives.",
      importance: missingRoles.importance,
      patch: (p) => setPath(p, "ownershipManagement.executives", [
        ...(getPath(p, "ownershipManagement.executives") || []),
        { name: "Coverage A", position: "Chief Financial Officer" },
        { name: "Coverage B", position: "IT Manager" },
        { name: "Coverage C", position: "Sales Manager" },
        { name: "Coverage D", position: "Operations Manager" },
        { name: "Coverage E", position: "HR Manager" },
        { name: "Coverage F", position: "Chief Executive Officer" },
      ]),
    })
  }

  if (shareholders.length === 0) {
    add({
      key: "addShareholders", group: "structure", label: "Record your shareholders",
      section: "Ownership & Management", field: "shareholders",
      action: "Add every shareholder and their holding.",
      importance: "Ownership transparency is the first thing due diligence checks.",
      patch: (p) => setPath(p, "ownershipManagement.shareholders", [{ name: "Shareholder 1" }]),
    })
  }

  if (!isYesish(er.hasAdvisors)) {
    add({
      key: "advisors", group: "structure", label: "Record your advisory structure",
      section: "Enterprise Readiness", field: "hasAdvisors",
      action: "Confirm whether you have advisors, and how often you meet them.",
      importance: "Below a PIS of 100 a named advisory structure is what stands in for a board.",
      patch: (p) => { setPath(p, "enterpriseReadiness.hasAdvisors", "yes"); return setPath(p, "enterpriseReadiness.advisorsMeetRegularly", "yes") },
    })
  }

  if (!answered(er.advisorsMeetingFrequency)) {
    add({
      key: "cadence", group: "structure", label: "State a meeting cadence",
      section: "Enterprise Readiness", field: "advisorsMeetingFrequency",
      action: "Record how often the board or advisors meet.",
      importance: "A board that does not meet on a fixed rhythm is a board on paper only. Worth 8% of Board Structure.",
      patch: (p) => setPath(p, "enterpriseReadiness.advisorsMeetingFrequency", "Quarterly"),
    })
  }

  const anyCommittee = directors.some((d) => (d.committeeMembership || []).length > 0)
  if (directors.length > 0 && !anyCommittee) {
    add({
      key: "committees", group: "structure", label: "Record committee membership",
      section: "Ownership & Management", field: "directors",
      action: "Fill in Committee Membership on each director row. If audit and risk are handled in full board session, record that as the audit committee.",
      importance: "At a higher Public Interest Score an audit or risk committee is expected — and is currently invisible even if it exists.",
      patch: (p) => setPath(p, "ownershipManagement.directors",
        (getPath(p, "ownershipManagement.directors") || []).map((d, i) => (i === 0 && d?.name?.trim() ? { ...d, committeeMembership: ["Audit Committee", "Remuneration Committee"] } : d))),
    })
  }

  // ── Business Leadership: the six questions ──
  const blFields = [
    ["ownerLed", "Owner-led structure", "yes"],
    ["primaryMotivation", "Primary motivation", "growth"],
    ["growthAmbition", "Five-year growth ambition", "significant_growth"],
    ["founderFullTime", "Founder full-time involvement", "yes"],
    ["opennessToAdvice", "Openness to advice", "open_evaluate"],
    ["decisionGovernance", "How decisions are made", "founder_with_team"],
  ]
  const blMissing = blFields.filter(([f]) => !answered(getPath(profileData, `ownershipManagement.businessLeadership.${f}`)))
  if (blMissing.length) {
    add({
      key: "businessLeadership", group: "answer",
      label: `Answer ${blMissing.length} Business Leadership question${blMissing.length === 1 ? "" : "s"}`,
      section: "Ownership & Management", field: "businessLeadership",
      action: `Unanswered: ${blMissing.map(([, l]) => l).join(", ")}. These take a minute and are read as unproven until they are answered.`,
      importance: "Leadership Behaviour is 30% of Leadership Quality and every one of these is a blank at present.",
      patch: (p) => { blMissing.forEach(([f, , v]) => setPath(p, `ownershipManagement.businessLeadership.${f}`, v)); return p },
    })
  }

  // ── Governance dropdowns that have never been answered ──
  const declaredMissing = DECLARED_FIELDS.filter((f) => !answered(getPath(profileData, f.path)))
  const byGroup = {
    "governance.strategicClarity": "Strategic Clarity",
    "governance.riskManagement": "Risk Management",
    "governance.transparencyReporting": "Transparency & Reporting",
  }
  Object.entries(byGroup).forEach(([prefix, groupLabel]) => {
    const fields = declaredMissing.filter((f) => f.path.startsWith(prefix))
    if (!fields.length) return
    add({
      key: `declared_${prefix}`, group: "answer",
      label: `Answer ${fields.length} ${groupLabel} question${fields.length === 1 ? "" : "s"}`,
      section: "Governance", field: fields[0].field,
      action: `Unanswered: ${fields.map((f) => f.label).join(", ")}. Answer them honestly — an unanswered question scores zero, and the honest middle answer scores more than that.`,
      importance: "An unanswered governance question is treated as unproven, which is the same as the worst answer.",
      note: "Valued at the honest middle option, not the best one.",
      patch: (p) => { fields.forEach((f) => setPath(p, f.path, f.mid)); return p },
    })
  })

  // ── Policies ──
  const missingPolicies = POLICY_KEYS.filter((k) => checklist[k] !== true)
  if (missingPolicies.length) {
    add({
      key: "policies", group: "artefact",
      label: `Put ${missingPolicies.length} of ${POLICY_KEYS.length} policies in place`,
      section: "Governance", field: "governanceChecklist",
      action: `Missing: ${missingPolicies.slice(0, 6).map((k) => POLICY_LABELS[k]).join(", ")}${missingPolicies.length > 6 ? `, and ${missingPolicies.length - 6} more` : ""}. Tick each one only once the document actually exists.`,
      importance: "Policies & Documentation is 20% of Governance Maturity, and each missing policy is a named risk exposure in the AI analysis.",
      patch: (p) => { const c = { ...(getPath(p, "governance.governanceChecklist") || {}) }; POLICY_KEYS.forEach((k) => (c[k] = true)); return setPath(p, "governance.governanceChecklist", c) },
    })
  }

  if (!answered(gov.ethicsTrainingFrequency) || cleanStr(gov.ethicsTrainingFrequency) === "None") {
    add({
      key: "ethicsTraining", group: "artefact", label: "Run ethics training on a stated cadence",
      section: "Governance", field: "ethicsTrainingFrequency",
      action: "Hold a short ethics and conduct session, record the date, and set the frequency.",
      importance: "Worth 10% of Policies & Documentation.",
      patch: (p) => setPath(p, "governance.ethicsTrainingFrequency", "Annually"),
    })
  }

  if (!answered(gov.membersHaveMultipleBusinesses)) {
    add({
      key: "conflictQuestion", group: "answer", label: "Answer the conflict-of-interest question",
      section: "Governance", field: "membersHaveMultipleBusinesses",
      action: "State whether members hold other business interests, and list them if they do.",
      importance: "Unanswered scores as unknown. Declaring a conflict scores full marks — hiding one is the red flag, not having one.",
      patch: (p) => setPath(p, "governance.membersHaveMultipleBusinesses", "No"),
    })
  }

  if (!answered(gov.adverseListings) || !answered(gov.courtNotices)) {
    add({
      key: "riskLegal", group: "answer", label: "Answer the adverse listings and court notices questions",
      section: "Governance", field: "adverseListings",
      action: "Confirm whether there are adverse listings or court proceedings. Answer honestly — a disclosed matter is assessable, an unanswered one is treated as unverified.",
      importance: "Both unanswered leaves Risk Management sitting at a neutral 2.5 out of 5 rather than a clean 5.",
      patch: (p) => { setPath(p, "governance.adverseListings", "No"); return setPath(p, "governance.courtNotices", "No") },
    })
  }

  return out
}

// ── Measure each candidate by re-scoring ──
//
// THREE DIFFERENT NUMBERS, DELIBERATELY KEPT APART
//
//   pointValue    — what ONE action is worth on its own, measured against
//                   today's score. This is what the item chip promises, and
//                   it is the only figure that has to be exactly right.
//
//   availablePoints — the SUM of those individual measurements. Actions
//                   overlap (classifying directors and appointing an
//                   independent NED both move the same independence check),
//                   so the sum is not what you would actually score having
//                   done all of them.
//
//   ceiling       — what you WOULD score with every listed action applied
//                   together, measured by applying every patch to one copy
//                   of the profile and scoring it once. This is the honest
//                   "could reach" figure, and it is what the panel displays.
//
// The ceiling is normally below 100%, and that is correct rather than a bug.
// See UNREACHABLE below.
export const buildOpportunities = (profileData, cvProfiles, scoreFn, leadership) => {
  const base = scoreFn(profileData, cvProfiles)
  const candidates = buildCandidates(profileData, cvProfiles, leadership)

  const measured = candidates
    .map((c) => {
      let after = base
      try {
        const patchedProfile = c.patch ? c.patch(clone(profileData)) : clone(profileData)
        const patchedCvs = c.patchCvs ? c.patchCvs(cvProfiles) : cvProfiles
        after = scoreFn(patchedProfile, patchedCvs)
      } catch (e) {
        console.error(`Opportunity "${c.key}" could not be measured:`, e)
        return null
      }
      const gain = Math.round((after - base) * 10) / 10
      return { ...c, pointValue: gain, projected: Math.round(after), route: routeFor(c.section, c.field) }
    })
    .filter(Boolean)
    .filter((c) => c.pointValue > 0.05)
    .sort((a, b) => b.pointValue - a.pointValue)

  // ── The real ceiling: every listed action applied to ONE profile ──
  let ceiling = base
  try {
    let prof = clone(profileData)
    let cvs = cvProfiles
    measured.forEach((c) => {
      if (c.patch) prof = c.patch(prof)
      if (c.patchCvs) cvs = c.patchCvs(cvs)
    })
    ceiling = scoreFn(prof, cvs)
  } catch (e) {
    console.error("Combined ceiling could not be measured:", e)
    ceiling = base + measured.reduce((s, i) => s + i.pointValue, 0)
  }

  // Declared fields already answered below the top option — shown separately,
  // valued at what the top option is worth once the artefact genuinely exists.
  const earnByDoing = DECLARED_FIELDS.map((f) => {
    const current = cleanStr(getPath(profileData, f.path))
    if (!current || current === f.top) return null
    let after = base
    try {
      after = scoreFn(setPath(clone(profileData), f.path, f.top), cvProfiles)
    } catch (e) {
      return null
    }
    const gain = Math.round((after - base) * 10) / 10
    if (gain <= 0.05) return null
    return {
      key: `earn_${f.path}`, label: f.label, section: f.section, field: f.field,
      route: routeFor(f.section, f.field), current, pointValue: gain,
      projected: Math.round(after),
      action: `Currently "${current}". Worth ${gain.toFixed(1)} more once you have ${f.artefact} — then update the answer.`,
      artefact: f.artefact,
    }
  })
    .filter(Boolean)
    .sort((a, b) => b.pointValue - a.pointValue)

  // ── What the ceiling still leaves on the table, and why ──
  //
  // Some of the score cannot be reached by anything on the list. Naming the
  // reasons is more useful than letting the business wonder why "could reach"
  // stops short of 100%.
  const unreachable = []
  const push = (what, why) => unreachable.push({ what, why })

  const roomLeft = Math.round((100 - ceiling) * 10) / 10
  if (roomLeft > 0.5) {
    if (earnByDoing.length) {
      push(
        `${fmtPts(Math.round(earnByDoing.reduce((s, i) => s + i.pointValue, 0) * 10) / 10)} behind self-assessed answers`,
        "Answers you have already given that sit below the top option. Listed under Earn by doing — the points follow the underlying work, not the dropdown."
      )
    }

    const unansweredDeclared = DECLARED_FIELDS.filter((f) => !cleanStr(getPath(profileData, f.path)))
    if (unansweredDeclared.length) {
      push(
        `The gap between an honest answer and the best one on ${unansweredDeclared.length} unanswered governance question${unansweredDeclared.length === 1 ? "" : "s"}`,
        "Answering these is valued at the honest middle option, never the best one. Reaching the top of each needs the documented process behind it, not a different selection."
      )
    }

    push(
      "Board competencies no job title can evidence",
      "The Directors table has no role option for legal, technical, commercial or HR expertise, so those competencies score only from a CV that actually shows them. Uploading a CV is on the list; what that CV contains is not something the form can supply."
    )

    push(
      "Board or governance training, and senior professional designations",
      "Read from certifications on a parsed CV. These reflect qualifications the people around your table either hold or do not — a form edit cannot create them."
    )

    const pis = pisOfLocal(profileData)
    if (pis < 500) {
      push(
        "Committees not expected at your Public Interest Score",
        `A Social & Ethics Committee is only scored at a PIS of 500 or above; yours is ${pis}. This is headroom that does not apply to you rather than a gap — it costs you nothing today.`
      )
    }
  }

  return {
    base: Math.round(base),
    baseRaw: base,
    opportunities: measured,
    earnByDoing,
    unreachable,
    ceiling: Math.round(ceiling),
    ceilingRaw: ceiling,
    availablePoints: Math.round(measured.reduce((s, i) => s + i.pointValue, 0) * 10) / 10,
    combinedPoints: Math.round((ceiling - base) * 10) / 10,
    earnByDoingPoints: Math.round(earnByDoing.reduce((s, i) => s + i.pointValue, 0) * 10) / 10,
  }
}

// Local PIS, only for the unreachable-reasons text above.
const pisOfLocal = (profileData) => {
  const employees = parseInt(profileData?.entityOverview?.employeeCount) || 0
  const turnover = parseFloat((profileData?.financialOverview?.annualRevenue || "0").toString().replace(/[R,\s]/g, "")) || 0
  const liabilities = parseFloat((profileData?.financialOverview?.existingDebt || "0").toString().replace(/[R,\s]/g, "")) || 0
  const shareholders = profileData?.ownershipManagement?.shareholders?.length || 1
  return Math.round(employees + turnover / 1e6 + liabilities / 1e6 + shareholders)
}

export const fmtPts = (n) => `${n >= 0 ? "+" : ""}${(Math.round(n * 10) / 10).toFixed(1)}%`