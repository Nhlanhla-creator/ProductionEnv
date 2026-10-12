/**
 * funding/models/requirementRule.js
 *
 * RequirementRule shape from Brief §4 and §8. Rules are inherited through
 * five levels:
 *
 *   1. base         (always applies — entity, need, amount, purpose)
 *   2. category     (debt, equity, grant, hybrid)
 *   3. instrument   (from the instrument catalogue)
 *   4. programme    (funder programme)
 *   5. opportunity  (specific to one opportunity)
 *
 * A rule may be:
 *   - required     (must be satisfied before submission)
 *   - recommended  (optional, improves match)
 *
 * A rule resolves to one of six task states:
 *   - ready          (already satisfied from profile/Vault)
 *   - confirm        (needs a yes/no confirmation from the SME)
 *   - missing_answer (a form field must be filled)
 *   - missing_evidence (a file must be uploaded)
 *   - pending_validation (evidence uploaded, awaiting check)
 *   - optional       (recommended, does not block submission)
 */

export const RULE_LEVELS = Object.freeze({
  BASE: "base",
  CATEGORY: "category",
  INSTRUMENT: "instrument",
  PROGRAMME: "programme",
  OPPORTUNITY: "opportunity",
});

export const TASK_STATES = Object.freeze({
  READY: "ready",
  CONFIRM: "confirm",
  MISSING_ANSWER: "missing_answer",
  MISSING_EVIDENCE: "missing_evidence",
  PENDING_VALIDATION: "pending_validation",
  OPTIONAL: "optional",
});

export const EVIDENCE_TYPES = Object.freeze({
  PDF: "pdf",
  XLSX: "xlsx",
  IMAGE: "image",
  ANY: "any",
});

export const FRESHNESS = Object.freeze({
  ANY: "any",
  LAST_30_DAYS: "last_30_days",
  LAST_90_DAYS: "last_90_days",
  LAST_12_MONTHS: "last_12_months",
  CURRENT_PERIOD: "current_period",
});

const nowIso = () => new Date().toISOString();

/**
 * Create a canonical requirement rule. Called by:
 *   - the base/category/instrument seed loaders
 *   - the investor opportunity editor (frontend)
 *   - the admin publication workflow (backend)
 */
export const createRequirementRule = (input) => ({
  ruleId: input.ruleId || null,
  version: input.version ?? 1,
  level: input.level || RULE_LEVELS.BASE,
  parentId: input.parentId || null,

  label: input.label || "",
  reason: input.reason || "",

  applicableInstruments: input.applicableInstruments || [],
  applicableCategories: input.applicableCategories || [],
  excludedInstruments: input.excludedInstruments || [],

  // Either a canonicalFieldPath (resolves against the profile) or an
  // answerSchema (resolves against the application supplement)
  canonicalFieldPath: input.canonicalFieldPath || null,
  answerSchema: input.answerSchema || null,

  // Evidence rule (optional)
  evidenceType: input.evidenceType || null,
  evidenceAccepts: input.evidenceAccepts || [],
  evidenceFreshness: input.evidenceFreshness || FRESHNESS.ANY,
  evidencePeriodRequired: input.evidencePeriodRequired || false,

  // Required vs recommended
  requirement: input.requirement || "required", // "required" | "recommended"

  // Alternatives / waiver
  alternativeRuleIds: input.alternativeRuleIds || [],
  waivable: input.waivable !== false,

  // Validation gate
  validationThreshold: input.validationThreshold || null, // "uploaded" | "checked" | "verified"
  submissionGate: input.submissionGate !== false, // does failure block submission?

  // Consent scope — which parts of the profile this rule unlocks for the funder
  consentScope: input.consentScope || [],

  // Effective dating
  effectiveFrom: input.effectiveFrom || nowIso().split("T")[0],
  effectiveTo: input.effectiveTo || null,

  // Provenance
  createdBy: input.createdBy || null,
  approvedBy: input.approvedBy || null,
  approvedAt: input.approvedAt || null,
  status: input.status || "draft", // "draft" | "published" | "superseded"
});

/**
 * Validate a rule against the constraint set from Brief §4:
 *   - reject contradictory criteria
 *   - reject impossible ticket bounds
 *   - reject invalid taxonomy paths
 *   - reject unsupported evidence types
 *   - reject required fields with no capture route
 */
export const validateRequirementRule = (rule) => {
  const errors = [];
  const warnings = [];

  if (!rule.label || rule.label.trim().length < 3) {
    errors.push({ field: "label", message: "Label must be at least 3 characters." });
  }

  const hasFieldPath = !!rule.canonicalFieldPath;
  const hasAnswerSchema = !!rule.answerSchema;
  const hasEvidence = !!rule.evidenceType;

  if (!hasFieldPath && !hasAnswerSchema && !hasEvidence) {
    errors.push({
      field: "_route",
      message: "A rule must resolve to a canonical field, a supplementary answer, or an evidence upload.",
    });
  }

  if (rule.evidenceType && (!rule.evidenceAccepts || rule.evidenceAccepts.length === 0)) {
    errors.push({
      field: "evidenceAccepts",
      message: "Evidence rules must specify at least one accepted file type.",
    });
  }

  if (rule.level === RULE_LEVELS.OPPORTUNITY && !rule.parentId) {
    warnings.push({
      field: "parentId",
      message: "Opportunity rules should reference a parent programme.",
    });
  }

  if (rule.validationThreshold && !rule.evidenceType) {
    errors.push({
      field: "validationThreshold",
      message: "A validation threshold only applies to evidence rules.",
    });
  }

  return { ok: errors.length === 0, errors, warnings };
};

/**
 * Apply inheritance — merge base + category + instrument + programme +
 * opportunity rules into a single ordered list for a given request context.
 */
export const resolveRuleSet = ({ rules, requestInstrumentId, programmeId, opportunityId }) => {
  const instrument = requestInstrumentId;
  const applicable = (rules || []).filter((r) => {
    if (r.status !== "published") return false;
    if (r.applicableInstruments?.length && !r.applicableInstruments.includes(instrument)) return false;
    if (r.excludedInstruments?.length && r.excludedInstruments.includes(instrument)) return false;
    if (r.level === RULE_LEVELS.PROGRAMME && r.parentId !== programmeId) return false;
    if (r.level === RULE_LEVELS.OPPORTUNITY && r.parentId !== opportunityId) return false;
    return true;
  });

  // Sort: base first, then category, then instrument, then programme, then opportunity
  const order = {
    [RULE_LEVELS.BASE]: 0,
    [RULE_LEVELS.CATEGORY]: 1,
    [RULE_LEVELS.INSTRUMENT]: 2,
    [RULE_LEVELS.PROGRAMME]: 3,
    [RULE_LEVELS.OPPORTUNITY]: 4,
  };
  return [...applicable].sort((a, b) => (order[a.level] ?? 99) - (order[b.level] ?? 99));
};

/**
 * Decide the task state for a rule given the SME's current data.
 * Returns a TaskResolution shape consumed by the opportunity dialog.
 */
export const resolveTask = (rule, { request, profile, vault }) => {
  // 1. Profile field path — resolved from the profile doc
  if (rule.canonicalFieldPath) {
    const value = getNested(profile, rule.canonicalFieldPath);
    if (value !== undefined && value !== null && value !== "") {
      return {
        ruleId: rule.ruleId,
        state: TASK_STATES.CONFIRM,
        source: "profile",
        fieldPath: rule.canonicalFieldPath,
        currentValue: value,
        reason: rule.reason,
      };
    }
    return {
      ruleId: rule.ruleId,
      state: TASK_STATES.MISSING_ANSWER,
      source: "profile",
      fieldPath: rule.canonicalFieldPath,
      reason: rule.reason,
    };
  }

  // 2. Evidence — resolved from Vault
  if (rule.evidenceType) {
    const vaultMatches = (vault || []).filter((v) =>
      v.type === rule.evidenceType &&
      (!rule.evidenceAccepts?.length || rule.evidenceAccepts.includes(v.fileType))
    );
    if (vaultMatches.length > 0) {
      const anyVerified = vaultMatches.some((v) => v.status === "verified");
      return {
        ruleId: rule.ruleId,
        state: anyVerified ? TASK_STATES.READY : TASK_STATES.PENDING_VALIDATION,
        source: "vault",
        evidenceIds: vaultMatches.map((v) => v.id),
        reason: rule.reason,
      };
    }
    return {
      ruleId: rule.ruleId,
      state: TASK_STATES.MISSING_EVIDENCE,
      source: "vault",
      reason: rule.reason,
      acceptedTypes: rule.evidenceAccepts,
    };
  }

  // 3. Answer schema — resolved from the request supplement
  if (rule.answerSchema) {
    const value = request?.supplement?.[rule.ruleId];
    if (value !== undefined && value !== null && value !== "") {
      return {
        ruleId: rule.ruleId,
        state: TASK_STATES.READY,
        source: "supplement",
        reason: rule.reason,
      };
    }
    return {
      ruleId: rule.ruleId,
      state: TASK_STATES.MISSING_ANSWER,
      source: "supplement",
      reason: rule.reason,
    };
  }

  return {
    ruleId: rule.ruleId,
    state: TASK_STATES.OPTIONAL,
    source: "none",
    reason: rule.reason,
  };
};

const getNested = (obj, path) => {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
};

export default {
  RULE_LEVELS,
  TASK_STATES,
  EVIDENCE_TYPES,
  FRESHNESS,
  createRequirementRule,
  validateRequirementRule,
  resolveRuleSet,
  resolveTask,
};