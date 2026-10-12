/**
 * funding/models/scoringProfile.js
 *
 * Investor scoring profile from Brief §4, page 43.
 *
 *   - Starts with the v3 default five-component weights
 *   - May change those weights within centrally approved bounds
 *   - UI must show total 100, deviations, rationale, effective date
 *   - Item-level arbitrary scoring is NOT exposed
 *   - A mandatory evidence request alone does NOT change the score
 */

export const DEFAULT_WEIGHTS = Object.freeze({
  compliance: 0.25,
  legitimacy: 0.20,
  leadership: 0.15,
  operational: 0.15,
  financial: 0.25,
});

// Central bounds — the admin approves these. Adjust the numbers here only
// after the scoring owner signs off (Brief §11).
export const WEIGHT_BOUNDS = Object.freeze({
  compliance:  { min: 0.10, max: 0.35 },
  legitimacy:  { min: 0.10, max: 0.30 },
  leadership:  { min: 0.05, max: 0.25 },
  operational: { min: 0.05, max: 0.30 },
  financial:   { min: 0.15, max: 0.40 },
});

export const COMPONENT_LABELS = Object.freeze({
  compliance:  "Compliance",
  legitimacy:  "Legitimacy",
  leadership:  "Leadership & Governance",
  operational: "Operational Strength",
  financial:   "Financial Strength",
});

export const SCORING_PROFILE_STATUS = Object.freeze({
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
  SUPERSEDED: "superseded",
});

const nowIso = () => new Date().toISOString();

export const createEmptyScoringProfile = ({ firmId, opportunityId, userId }) => ({
  profileId: null,
  firmId,
  opportunityId,

  // Both keys are written on purpose:
  //   funderId  → matches the existing Firestore rule for investorScoringProfiles
  //   ownerId   → consistent with the rest of the module (firms, programmes)
  funderId: userId,
  ownerId: userId,

  name: "",
  weights: { ...DEFAULT_WEIGHTS },
  rationale: "",

  effectiveFrom: nowIso().split("T")[0],
  effectiveTo: null,

  approvedBy: null,
  approvedAt: null,
  status: SCORING_PROFILE_STATUS.DRAFT,
  version: 1,

  createdAt: nowIso(),
  createdBy: userId,
  updatedAt: nowIso(),
  updatedBy: userId,
});

/**
 * Validate a scoring profile:
 *   - weights must sum to 1.00 (100%)
 *   - each weight must be within its bounds
 *   - a written rationale is required for any deviation from the default
 */
export const validateScoringProfile = (profile) => {
  const errors = [];
  const warnings = [];
  const w = profile.weights || {};
  const keys = Object.keys(DEFAULT_WEIGHTS);
  const total = keys.reduce((s, k) => s + (Number(w[k]) || 0), 0);

  if (Math.abs(total - 1) > 0.001) {
    errors.push({
      field: "weights",
      message: `Weights must total 100%. Current total: ${(total * 100).toFixed(1)}%.`,
    });
  }

  for (const k of keys) {
    const val = Number(w[k]) || 0;
    const bound = WEIGHT_BOUNDS[k];
    if (bound && (val < bound.min - 0.001 || val > bound.max + 0.001)) {
      errors.push({
        field: `weights.${k}`,
        message: `${COMPONENT_LABELS[k]} weight ${(val * 100).toFixed(0)}% is outside allowed bounds (${(bound.min * 100).toFixed(0)}–${(bound.max * 100).toFixed(0)}%).`,
      });
    }
  }

  const hasDeviation = keys.some((k) => Math.abs((Number(w[k]) || 0) - DEFAULT_WEIGHTS[k]) > 0.001);
  if (hasDeviation && !profile.rationale?.trim()) {
    errors.push({
      field: "rationale",
      message: "A written rationale is required when weights deviate from the default.",
    });
  }

  return { ok: errors.length === 0, errors, warnings, total };
};

export const diffFromDefault = (weights) => {
  const out = {};
  for (const k of Object.keys(DEFAULT_WEIGHTS)) {
    const delta = (Number(weights?.[k]) || 0) - DEFAULT_WEIGHTS[k];
    if (Math.abs(delta) > 0.001) out[k] = delta;
  }
  return out;
};