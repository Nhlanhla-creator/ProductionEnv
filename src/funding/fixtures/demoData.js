/**
 * funding/fixtures/demoData.js
 *
 * Seed data for testing the UI before the backend exists. Only used when
 * REACT_APP_API_URL is not set (see apiClient.js).
 */

const config = {
  version: "1.0.0",
  instruments: "see /src/funding/models/instruments.js",
  requirementLevels: ["base", "category", "instrument", "programme", "opportunity"],
  taskStates: ["ready", "confirm", "missing_answer", "missing_evidence", "pending_validation", "optional"],
}

const preflight = {
  profileCompleteness: 0.82,
  missingFields: [
    { path: "financialOverview.incomeNetProfitPrevious", label: "Net profit — previous year", reason: "Required for Fundability assessment." },
  ],
  vaultItems: [
    { id: "VD-001", type: "signed_purchase_order", label: "Signed PO — Order ABC-2026-041", period: "2026-09", status: "verified" },
    { id: "VD-002", type: "bank_statements",       label: "Bank statements — Aug 2026",     period: "2026-08", status: "verified" },
  ],
  readyToMatch: true,
}

const matches = {
  requestId: "FR-DEMO-001",
  originalBigScore: 78,
  rows: [
    {
      opportunityId: "OPP-MINE-001",
      investorName: "Northern Capital Partners",
      programmeName: "Junior Mining Growth Fund",
      opportunityName: "Working Capital — Junior Contractors 2026",
      instrument: "po_finance",
      ticketMin: 250000,
      ticketMax: 5000000,
      currency: "ZAR",
      deadline: "2026-12-15",
      originalBigScore: 78,
      adjustedBigScore: 81,
      adjustedDelta: 3,
      eligibility: "eligible",
      matchScore: 87,
      matchFit: "high",
      mandatoryTasks: 3,
      recommendedTasks: 2,
      scoreId: "SCORE-DEMO-001",
    },
    {
      opportunityId: "OPP-EQUITY-002",
      investorName: "Ubuntu Growth Equity",
      programmeName: "Series A Track",
      opportunityName: "Growth Equity — Series A 2026",
      instrument: "equity_round",
      ticketMin: 2000000,
      ticketMax: 15000000,
      currency: "ZAR",
      deadline: "2027-02-28",
      originalBigScore: 78,
      adjustedBigScore: 74,
      adjustedDelta: -4,
      eligibility: "eligible",
      matchScore: 62,
      matchFit: "medium",
      mandatoryTasks: 5,
      recommendedTasks: 3,
      scoreId: "SCORE-DEMO-002",
    },
    {
      opportunityId: "OPP-GRANT-003",
      investorName: "SA SME Fund",
      programmeName: "Township Enterprise Support",
      opportunityName: "Grant — Township Enterprise Support 2026",
      instrument: "grant_incentive",
      ticketMin: 50000,
      ticketMax: 750000,
      currency: "ZAR",
      deadline: "2026-11-30",
      originalBigScore: 78,
      adjustedBigScore: 79,
      adjustedDelta: 1,
      eligibility: "provisional",
      matchScore: 71,
      matchFit: "medium",
      mandatoryTasks: 2,
      recommendedTasks: 1,
      scoreId: "SCORE-DEMO-003",
    },
  ],
}

const requirements = {
  opportunityId: "OPP-MINE-001",
  requestId: "FR-DEMO-001",
  ruleVersion: "2026.10.1",
  ready: [
    { ruleId: "base.entity", label: "Legal entity reference", state: "ready", source: "profile", reason: "Required by all funders." },
    { ruleId: "base.contact", label: "Primary contact", state: "ready", source: "profile", reason: "For engagement." },
    { ruleId: "base.amount", label: "Requested amount", state: "ready", source: "request", reason: "Match ticket bounds." },
  ],
  confirm: [
    { ruleId: "profile.bbbee", label: "B-BBEE level", state: "confirm", source: "profile", currentValue: "Level 4", reason: "Confirm current level before submission." },
  ],
  missingAnswer: [
    { ruleId: "opp.buyerName", label: "Buyer name", state: "missing_answer", source: "supplement", reason: "Funders require the buyer against any PO finance." },
    { ruleId: "opp.orderReference", label: "PO / order reference", state: "missing_answer", source: "supplement", reason: "For order verification." },
  ],
  missingEvidence: [
    { ruleId: "opp.signedPO", label: "Signed purchase order", state: "missing_evidence", source: "vault", reason: "Required for PO finance.", acceptedTypes: [".pdf"] },
  ],
  pendingValidation: [],
  recommended: [
    { ruleId: "rec.insurance", label: "Insurance certificate", state: "optional", source: "vault", reason: "Improves funder confidence." },
  ],
}

const scoreBridge = {
  scoreId: "SCORE-DEMO-001",
  calculationId: "CALC-DEMO-001",
  versions: { methodology: "v3", ruleRegistry: "2026.10.1", scoringProfile: "SP-NCP-1" },
  original: {
    bigScore: 78,
    capitalAppeal: 76,   // = Financial Strength at 100%
    components: [
      { name: "Compliance",     value: 22, max: 25, weight: 0.25 },
      { name: "Legitimacy",     value: 18, max: 20, weight: 0.20 },
      { name: "Leadership",     value: 14, max: 15, weight: 0.15 },
      { name: "Operational",    value: 12, max: 15, weight: 0.15 },
      { name: "Financial",      value: 12, max: 25, weight: 0.25 },
    ],
  },
  adjusted: {
    fundability: 84,
    fundabilityRows: [
      { label: "Cash-flow forecast",   score: 8, weight: 0.10, status: "active" },
      { label: "Order verification",   score: 9, weight: 0.15, status: "active" },
      { label: "Security / assignment", score: 7, weight: 0.10, status: "active" },
      { label: "Credit bureau",         score: 0, weight: 0.10, status: "inactive", reason: "Not applicable to PO finance" },
    ],
    investorWeights: { compliance: 0.20, legitimacy: 0.15, leadership: 0.15, operational: 0.20, financial: 0.30 },
    capitalAppealSplit: { financialStrength: 0.6, fundability: 0.4 },
    preCap: 82,
    gateCap: 90,
    final: 81,
    roundedDelta: 3,
  },
  reasonCodes: ["HIGH_OPERATIONAL_WEIGHT", "FUNDABILITY_ACTIVE"],
  facts: [
    "Investor weights operational higher than default (0.20 vs 0.15).",
    "PO finance activates order-verification Fundability row.",
    "Credit bureau row is inactive for this instrument.",
  ],
}

// ── Phase 5: no live submissions in the demo ─────────────────────────────
const liveSubmissions = []

// ── Phase 6: sample submissions for the investor pipeline ────────────────
const submissions = [
  {
    submissionId: "SUB-DEMO-001",
    version: 1,
    smeId: "sme-demo-001",
    smeName: "Kopano Mining Services (Pty) Ltd",
    funderId: "funder-demo-001",
    firmId: "FIRM-NCP-001",
    programmeId: "PROG-MINE-JR-2026",
    opportunityId: "OPP-MINE-001",
    opportunityName: "Working Capital — Junior Contractors 2026",
    instrumentId: "po_finance",
    requestedAmount: 1500000,
    currency: "ZAR",
    originalBigScore: 78,
    adjustedBigScore: 81,
    adjustedDelta: 3,
    eligibility: "eligible",
    matchScore: 87,
    matchFit: "high",
    completeness: 1.0,
    evidenceConfidence: "verified",
    submittedAt: "2026-10-05T11:24:00Z",
    currentStage: "under_review",
    scoreId: "SCORE-DEMO-001",
  },
  {
    submissionId: "SUB-DEMO-002",
    version: 1,
    smeId: "sme-demo-002",
    smeName: "Ubuntu Agritech",
    funderId: "funder-demo-001",
    firmId: "FIRM-NCP-001",
    programmeId: "PROG-MINE-JR-2026",
    opportunityId: "OPP-MINE-001",
    opportunityName: "Working Capital — Junior Contractors 2026",
    instrumentId: "invoice_finance",
    requestedAmount: 320000,
    currency: "ZAR",
    originalBigScore: 65,
    adjustedBigScore: 68,
    adjustedDelta: 3,
    eligibility: "provisional",
    matchScore: 62,
    matchFit: "medium",
    completeness: 0.72,
    evidenceConfidence: "uploaded",
    submittedAt: "2026-10-07T08:12:00Z",
    currentStage: "received",
    scoreId: "SCORE-DEMO-001",
  },
]

export default { config, preflight, matches, requirements, scoreBridge, liveSubmissions, submissions }