/**
 * funding/models/fundingRequest.js
 *
 * Canonical funding request document — the SME's generic application.
 * Lives at fundingRequests/{requestId}.
 *
 * A request is separate from:
 *   - the SME's Universal Profile (canonical facts, lives at universalProfiles/{uid})
 *   - opportunity supplements (per-funder additions, live under fundingRequests/{id}/supplements/{opportunityId})
 *
 * The request references profile fields by canonical path. It never stores
 * a divergent copy of a fact that lives in the profile.
 */

export const REQUEST_STATUS = Object.freeze({
  DRAFT: "draft",
  READY: "ready",              // all mandatory tasks satisfied, awaiting submission to an opportunity
  MATCHED: "matched",          // at least one opportunity has been viewed
  SUBMITTED: "submitted",      // at least one opportunity has been submitted to
  ARCHIVED: "archived",
});

export const ROUTE_UNCERTAINTY = Object.freeze({
  SURE: "sure",           // SME knows which instrument they want
  UNSURE: "unsure",       // "help me choose"
  ANY: "any_suitable",    // let matching find the best instrument
});

export const createEmptyFundingRequest = ({ userId, userEmail }) => {
  const now = new Date().toISOString();
  return {
    requestId: null,                // assigned by Firestore on create
    userId,
    userEmail,
    status: REQUEST_STATUS.DRAFT,
    currentStep: 0,                 // 0..5
    completedSteps: {},             // { need: true, route: false, ... }

    // Step 1 — Funding need
    purpose: "",                    // top-level purpose
    subpurpose: "",
    requestedAmount: null,
    currency: "ZAR",
    neededBy: null,
    usesOfFunds: [],                // [{ label, amount }]
    deliveryTiming: "",
    contribution: null,             // SME's own contribution
    fundingGap: null,               // auto-computed from amount - contribution

    // Step 2 — Funding route
    routeUncertainty: ROUTE_UNCERTAINTY.UNSURE,
    instrumentCategory: "",         // "working_capital" | "asset" | "term_debt" | etc.
    instrumentId: "",               // from instruments.js
    preferredProvider: "",
    components: [],                 // for blended finance: [{instrumentId, amount, provider}]

    // Step 3 — Readiness
    readinessAnswers: {},           // ruleId → value
    readinessEvidence: {},          // ruleId → vaultDocId or uploaded file ref

    // Step 4 — Terms and security
    termsAnswers: {},               // ruleId → value
    termsEvidence: {},
    securityRights: [],             // [{ type, counterparty, value, notes }]

    // Step 5 — Outcomes
    outcomes: [],                   // [{ metric, baseline, target, unit, milestoneDate }]

    // Step 6 — Review
    accuracyConfirmed: false,
    sharingConsent: false,

    // Score references (populated by the score service)
    originalBigScoreId: null,
    defaultFundabilityScoreId: null,

    // Audit
    createdAt: now,
    createdBy: userId,
    updatedAt: now,
    updatedBy: userId,
    version: 1,
  };
};

export const validateRequestStep = (request, stepKey) => {
  const errors = [];
  const warnings = [];

  switch (stepKey) {
    case "need": {
      if (!request.purpose?.trim()) errors.push({ field: "purpose", message: "Purpose is required." });
      if (!request.requestedAmount || Number(request.requestedAmount) <= 0) {
        errors.push({ field: "requestedAmount", message: "Requested amount must be greater than zero." });
      }
      if (!request.currency) errors.push({ field: "currency", message: "Currency is required." });
      if (request.usesOfFunds?.length > 0) {
        const sum = request.usesOfFunds.reduce((s, l) => s + (Number(l.amount) || 0), 0);
        if (request.requestedAmount && Math.abs(sum - Number(request.requestedAmount)) > 0.01) {
          errors.push({
            field: "usesOfFunds",
            message: `Uses of funds (${sum}) must reconcile to the requested amount (${request.requestedAmount}).`,
          });
        }
      }
      break;
    }
    case "route": {
      if (request.routeUncertainty === ROUTE_UNCERTAINTY.SURE && !request.instrumentId) {
        errors.push({ field: "instrumentId", message: "Select an instrument or switch to 'Help me choose'." });
      }
      if (request.routeUncertainty === ROUTE_UNCERTAINTY.SURE && !request.instrumentCategory) {
        errors.push({ field: "instrumentCategory", message: "Instrument category is required." });
      }
      break;
    }
    case "readiness":
      // No hard blocking rules — self-declared answers and evidence are captured.
      // The score service decides what is insufficient (marks Provisional).
      break;
    case "terms":
      break;
    case "outcomes": {
      for (const [i, o] of (request.outcomes || []).entries()) {
        if (!o.metric?.trim()) errors.push({ field: `outcomes.${i}.metric`, message: `Outcome ${i + 1}: metric is required.` });
        if (o.target === undefined || o.target === null || o.target === "") {
          errors.push({ field: `outcomes.${i}.target`, message: `Outcome ${i + 1}: target is required.` });
        }
      }
      break;
    }
    case "review": {
      if (!request.accuracyConfirmed) errors.push({ field: "accuracyConfirmed", message: "Confirm accuracy before continuing." });
      if (!request.sharingConsent) errors.push({ field: "sharingConsent", message: "Sharing consent is required." });
      break;
    }
    default:
      break;
  }

  return { ok: errors.length === 0, errors, warnings };
};

export const STEPS = [
  { key: "need",      label: "Funding need",      description: "What do you need and when?" },
  { key: "route",     label: "Funding route",     description: "How should the funding be structured?" },
  { key: "readiness", label: "Readiness",         description: "What evidence supports your case?" },
  { key: "terms",     label: "Terms & security",  description: "What are you offering or expecting?" },
  { key: "outcomes",  label: "Outcomes",          description: "What will this unlock?" },
  { key: "review",    label: "Review",            description: "Confirm and continue to matching." },
];

export default {
  REQUEST_STATUS,
  ROUTE_UNCERTAINTY,
  createEmptyFundingRequest,
  validateRequestStep,
  STEPS,
};