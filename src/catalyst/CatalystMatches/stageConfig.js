// ─────────────────────────────────────────────────────────────────────────────
// stageConfig.js
//
// Single source of truth for DealFlow pipeline stages, shared by
// SupportDealFlowPipeline.jsx and SupportSMETable.jsx so the two views can
// never drift out of sync on names, order, or definitions.
//
// Addresses feedback #3 (clear operational definitions, consistent nouns,
// "Offer"/"Admitted"/"Withdrawn" renames) and #4 (catalyst programmes are
// diverse — stages should be configurable per programme type, with the BIG
// default always available).
// ─────────────────────────────────────────────────────────────────────────────

// Icon names are stored as strings (not JSX) so this config can be imported
// by any file without pulling in a specific icon library binding. Each
// consuming component maps these strings to real lucide-react components.
export const DEFAULT_STAGES = [
  {
    id: "matched",
    name: "Matched",
    tooltip: "BIG has identified the SME as a potential fit, but the SME has not applied.",
    icon: "Target",
    order: 0,
    group: "pipeline",
  },
  {
    id: "applied",
    name: "Applied",
    tooltip: "The SME has submitted or consented to its application.",
    icon: "FileText",
    order: 1,
    group: "pipeline",
  },
  {
    id: "evaluation",
    name: "Evaluation",
    tooltip: "The catalyst is reviewing fit and readiness.",
    icon: "Search",
    order: 2,
    group: "pipeline",
  },
  {
    id: "dueDiligence",
    name: "Due Diligence",
    tooltip: "Detailed assessment and verification of the SME's information.",
    icon: "Shield",
    order: 3,
    group: "pipeline",
  },
  {
    id: "decision",
    name: "Decision",
    tooltip: "The catalyst is making a final decision on whether to proceed.",
    icon: "AlertCircle",
    order: 4,
    group: "pipeline",
  },
  {
    id: "offer",
    name: "Offer",
    tooltip: "A programme offer has been issued to the SME. Only call this a Term Sheet if actual investment terms are being issued.",
    icon: "FileCheck",
    order: 5,
    group: "pipeline",
  },
  {
    id: "admitted",
    name: "Admitted",
    tooltip: "The SME has accepted the offer and is admitted into the programme. It now moves to My Cohorts.",
    icon: "CheckCircle",
    order: 6,
    group: "admitted",
  },
  // ─── Terminal / outcome stages — kept out of the live progression flow ───
  {
    id: "declined",
    name: "Declined",
    tooltip: "The application did not proceed. An alternative outcome to admission, reached before it.",
    icon: "XCircle",
    order: 7,
    group: "declined",
    terminal: true,
  },
  {
    id: "withdrawn",
    name: "Withdrawn",
    tooltip: "The SME withdrew its application. Can happen at any point in the process, not only at the end.",
    icon: "LogOut",
    order: 8,
    group: "withdrawn",
    terminal: true,
  },
];

// Keyword mapping so existing/legacy status strings in Firestore records
// (e.g. "Matching", "Application", "Active", "Exit", "Term Sheet") continue
// to resolve to the right stage under the new names, with no data migration
// required. NOTE: this is a *fallback* used only when a status string
// doesn't directly match a stage id/name in the currently active stage list
// — see mapStatusToStageId below. It intentionally only covers the BIG
// default stage ids; programme-template-specific ids (e.g. "committee",
// "eligibility") are resolved via direct id/name matching instead, since
// they're already unambiguous.
export const STAGE_KEYWORDS = {
  matched: ["matched", "matching", "new", "initial", "prospect", "lead"],
  applied: ["applied", "application", "submitted", "application received"],
  evaluation: ["evaluation", "under review", "in review", "reviewing", "assessment"],
  dueDiligence: ["due diligence", "shortlisted", "verification"],
  decision: ["decision", "pending decision", "final review"],
  offer: ["offer", "term sheet", "terms"],
  admitted: ["admitted", "active", "ongoing", "in progress", "supporting", "support approved"],
  declined: ["declined", "decline", "rejected", "not proceeding"],
  withdrawn: ["withdrawn", "withdraw", "exit", "exited", "cancelled", "completed", "graduated"],
};

// `stages` should be the *currently active* stage list (i.e. the result of
// applyStageCustomization(PROGRAMME_TEMPLATES[programmeType].stages, customization)),
// not always DEFAULT_STAGES — otherwise programme-specific stages (like a
// Grant Programme's "Committee") can never be recognized correctly, even if
// a business's stored status string is literally "Committee".
//
// Resolution order:
//   1. Exact match against the active stage list's id or name (case-insensitive).
//      This covers every programme template, default or custom, directly.
//   2. Legacy keyword fuzzy-matching (for old/freeform status strings), but
//      only if the matched stage id actually exists in the active list —
//      otherwise a keyword hit for a stage the current programme doesn't
//      have (e.g. matching "decision" while on the Grant template) would
//      incorrectly resolve to an id nothing in the UI recognizes.
//   3. Fall back to the first stage in the active list.
export const mapStatusToStageId = (status, stages = DEFAULT_STAGES) => {
  const fallbackId = stages[0]?.id || "matched";
  if (!status) return fallbackId;
  const normalized = status.toString().toLowerCase().trim();

  const direct = stages.find(
    (s) => s.id.toLowerCase() === normalized || s.name.toLowerCase() === normalized
  );
  if (direct) return direct.id;

  for (const [stageId, keywords] of Object.entries(STAGE_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      if (stages.some((s) => s.id === stageId)) return stageId;
    }
  }

  return fallbackId;
};

// ─── Programme-specific templates (feedback #4) ────────────────────────────
// Catalysts are diverse — accelerators, incubators, ESD programmes, grant
// programmes, etc. — and won't all use the same stage sequence. The BIG
// default (above) always remains available; these are alternate presets a
// catalyst administrator can switch to. Programme admins can further rename,
// hide, reorder, or add limited custom stages on top of whichever template
// they start from (see applyStageCustomization below).
export const PROGRAMME_TEMPLATES = {
  default: { label: "BIG Default", stages: DEFAULT_STAGES },
  accelerator: {
    label: "Accelerator",
    stages: [
      { id: "matched", name: "Matched", tooltip: DEFAULT_STAGES[0].tooltip, icon: "Target", order: 0, group: "pipeline" },
      { id: "applied", name: "Applied", tooltip: DEFAULT_STAGES[1].tooltip, icon: "FileText", order: 1, group: "pipeline" },
      { id: "screening", name: "Screening", tooltip: "Initial review to confirm basic eligibility.", icon: "Search", order: 2, group: "pipeline" },
      { id: "interview", name: "Interview", tooltip: "Founder interview with the accelerator team.", icon: "Users", order: 3, group: "pipeline" },
      { id: "selected", name: "Selected", tooltip: "The cohort selection decision has been made.", icon: "CheckCircle", order: 4, group: "pipeline" },
      { id: "onboarding", name: "Onboarding", tooltip: "The SME is being onboarded into the cohort.", icon: "Layers", order: 5, group: "pipeline" },
      { id: "admitted", name: "Active", tooltip: DEFAULT_STAGES[6].tooltip, icon: "CheckCircle", order: 6, group: "admitted" },
      { id: "declined", name: "Declined", tooltip: DEFAULT_STAGES[7].tooltip, icon: "XCircle", order: 7, group: "declined", terminal: true },
      { id: "withdrawn", name: "Withdrawn", tooltip: DEFAULT_STAGES[8].tooltip, icon: "LogOut", order: 8, group: "withdrawn", terminal: true },
    ],
  },
  esd: {
    label: "ESD Programme",
    stages: [
      { id: "matched", name: "Matched", tooltip: DEFAULT_STAGES[0].tooltip, icon: "Target", order: 0, group: "pipeline" },
      { id: "applied", name: "Applied", tooltip: DEFAULT_STAGES[1].tooltip, icon: "FileText", order: 1, group: "pipeline" },
      { id: "evaluation", name: "Evaluation", tooltip: DEFAULT_STAGES[2].tooltip, icon: "Search", order: 2, group: "pipeline" },
      { id: "dueDiligence", name: "Due Diligence", tooltip: DEFAULT_STAGES[3].tooltip, icon: "Shield", order: 3, group: "pipeline" },
      { id: "approval", name: "Approval", tooltip: "Final approval to proceed with support.", icon: "AlertCircle", order: 4, group: "pipeline" },
      { id: "contracting", name: "Contracting", tooltip: "Support agreement is being contracted.", icon: "FileCheck", order: 5, group: "pipeline" },
      { id: "admitted", name: "Active Support", tooltip: DEFAULT_STAGES[6].tooltip, icon: "CheckCircle", order: 6, group: "admitted" },
      { id: "declined", name: "Declined", tooltip: DEFAULT_STAGES[7].tooltip, icon: "XCircle", order: 7, group: "declined", terminal: true },
      { id: "withdrawn", name: "Withdrawn", tooltip: DEFAULT_STAGES[8].tooltip, icon: "LogOut", order: 8, group: "withdrawn", terminal: true },
    ],
  },
  grant: {
    label: "Grant Programme",
    stages: [
      { id: "applied", name: "Applied", tooltip: DEFAULT_STAGES[1].tooltip, icon: "FileText", order: 0, group: "pipeline" },
      { id: "eligibility", name: "Eligibility Check", tooltip: "Confirming the SME meets baseline eligibility criteria.", icon: "Shield", order: 1, group: "pipeline" },
      { id: "evaluation", name: "Evaluation", tooltip: DEFAULT_STAGES[2].tooltip, icon: "Search", order: 2, group: "pipeline" },
      { id: "committee", name: "Committee", tooltip: "Awaiting a grant committee decision.", icon: "Users", order: 3, group: "pipeline" },
      { id: "approved", name: "Approved", tooltip: "The grant has been approved.", icon: "CheckCircle", order: 4, group: "pipeline" },
      { id: "admitted", name: "Disbursed", tooltip: "Funds have been disbursed; SME moves to My Cohorts.", icon: "DollarSign", order: 5, group: "admitted" },
      { id: "declined", name: "Declined", tooltip: DEFAULT_STAGES[7].tooltip, icon: "XCircle", order: 6, group: "declined", terminal: true },
      { id: "withdrawn", name: "Withdrawn", tooltip: DEFAULT_STAGES[8].tooltip, icon: "LogOut", order: 7, group: "withdrawn", terminal: true },
    ],
  },
};

// Colour tokens kept separate from stage identity so recolouring the whole
// pipeline doesn't require touching stage definitions. Declined/Withdrawn
// intentionally get a visually distinct, muted palette (feedback #14) so
// terminal/outcome states don't read as "the next step after Admitted".
export const STAGE_COLORS = {
  pipeline: { color: "#7d5a50", bgColor: "#f5f0e1", borderColor: "#c8b6a6" },
  admitted: { color: "#2e7d32", bgColor: "#e8f5e9", borderColor: "#a5d6a7" },
  declined: { color: "#b45309", bgColor: "#fff7ed", borderColor: "#fdba74" },
  withdrawn: { color: "#6b7280", bgColor: "#f3f4f6", borderColor: "#d1d5db" },
};

export const getStageColors = (group) => STAGE_COLORS[group] || STAGE_COLORS.pipeline;

// ─── Customization (feedback #4: rename, hide, reorder, add custom stages) ──
// `customization` shape:
// { renames: { stageId: "New Name" }, hidden: [stageId, ...], order: [stageId, ...], custom: [{id,name,tooltip}] }
export const applyStageCustomization = (baseStages, customization = {}) => {
  const { renames = {}, hidden = [], order = [], custom = [] } = customization;

  let stages = baseStages
    .filter((s) => !hidden.includes(s.id))
    .map((s) => ({ ...s, name: renames[s.id] || s.name }));

  // Append any admin-defined custom stages (limited: inserted before the
  // terminal Declined/Withdrawn pair so the live pipeline stays coherent).
  if (custom.length) {
    const terminal = stages.filter((s) => s.terminal);
    const live = stages.filter((s) => !s.terminal);
    const customStages = custom.map((c, i) => ({
      id: c.id,
      name: c.name,
      tooltip: c.tooltip || "Custom stage added by the programme administrator.",
      icon: "Target",
      order: live.length + i,
      group: "pipeline",
    }));
    stages = [...live, ...customStages, ...terminal];
  }

  if (order.length) {
    const orderIndex = (id) => {
      const idx = order.indexOf(id);
      return idx === -1 ? 999 : idx;
    };
    stages = [...stages].sort((a, b) => orderIndex(a.id) - orderIndex(b.id));
  }

  return stages.map((s, i) => ({ ...s, order: i }));
};

export const getNextStageId = (stages, currentStageId) => {
  const live = stages.filter((s) => !s.terminal).sort((a, b) => a.order - b.order);
  const idx = live.findIndex((s) => s.id === currentStageId);
  if (idx === -1 || idx === live.length - 1) return live[0]?.id || null;
  return live[idx + 1].id;
};

// ─── Stage-specific actions (closes the remaining gap in feedback #4) ──────
// Controls which fields appear in the SME table's "Update Stage" form for
// each BIG default stage: a message box, meeting scheduler, availability
// picker, and offer/agreement file upload. Previously hardcoded in a switch
// statement inside SupportSMETable.jsx with no way for a catalyst admin to
// change it; now it's data, overridable per-stage from the pipeline's
// settings panel and shared via the same persisted settings object.
export const DEFAULT_STAGE_ACTIONS = {
  matched: { showMessage: true, showMeeting: true, showAvailability: false, showTermSheet: false },
  applied: { showMessage: true, showMeeting: true, showAvailability: false, showTermSheet: false },
  evaluation: { showMessage: true, showMeeting: true, showAvailability: true, showTermSheet: false },
  dueDiligence: { showMessage: true, showMeeting: true, showAvailability: true, showTermSheet: false },
  decision: { showMessage: true, showMeeting: true, showAvailability: true, showTermSheet: false },
  offer: { showMessage: true, showMeeting: true, showAvailability: true, showTermSheet: true },
  admitted: { showMessage: true, showMeeting: false, showAvailability: false, showTermSheet: false },
  declined: { showMessage: true, showMeeting: false, showAvailability: false, showTermSheet: false },
  withdrawn: { showMessage: true, showMeeting: false, showAvailability: false, showTermSheet: false },
};

// Fallback used for any stage id not covered above (e.g. a programme
// template's own ids like "committee", "eligibility", "screening" — these
// don't have bespoke entries yet, so they get a sensible default rather than
// silently rendering an empty form).
const FALLBACK_STAGE_ACTIONS = { showMessage: true, showMeeting: true, showAvailability: false, showTermSheet: false };

export const getStageActionConfig = (stageId, overrides = {}) => ({
  ...(DEFAULT_STAGE_ACTIONS[stageId] || FALLBACK_STAGE_ACTIONS),
  ...(overrides?.[stageId] || {}),
});

// ─── Shared settings persistence ────────────────────────────────────────────
// One localStorage key, one shape, used by both SupportDealFlowPipeline.jsx
// (which writes programmeType/customization/stageActions) and
// SupportSMETable.jsx (which reads programmeType + customization to know
// which stages are active, and stageActions to know what the Update Stage
// form should show). Centralizing this avoids the two files silently
// drifting onto different keys or shapes.
export const PIPELINE_SETTINGS_STORAGE_KEY = "dealflow-pipeline-settings-v1";

// Dispatched on `window` whenever settings are saved, so any other mounted
// view (e.g. the SME table, if rendered alongside the pipeline view rather
// than navigated to separately) can refresh immediately instead of only
// picking up the change on next mount, a tab focus, or a cross-tab
// `storage` event (which doesn't fire in the same tab that made the change).
export const PIPELINE_SETTINGS_EVENT = "dealflow-pipeline-settings-changed";

export const DEFAULT_PIPELINE_CUSTOMIZATION = { renames: {}, hidden: [], order: [], custom: [], stageActions: {} };

export const loadPipelineSettings = () => {
  if (typeof window === "undefined") {
    return { programmeType: "default", customization: DEFAULT_PIPELINE_CUSTOMIZATION };
  }
  try {
    const saved = JSON.parse(window.localStorage.getItem(PIPELINE_SETTINGS_STORAGE_KEY) || "null");
    return {
      programmeType: saved?.programmeType || "default",
      customization: { ...DEFAULT_PIPELINE_CUSTOMIZATION, ...(saved?.customization || {}) },
    };
  } catch {
    return { programmeType: "default", customization: DEFAULT_PIPELINE_CUSTOMIZATION };
  }
};

// Convenience helper: resolves the fully-applied, currently-active stage
// list in one call (template lookup + customization applied). Both
// SupportDealFlowPipeline.jsx and SupportSMETable.jsx should use this rather
// than each re-implementing the same two-step lookup, so they can't drift.
export const getActiveStages = (settings = loadPipelineSettings()) => {
  const template = PROGRAMME_TEMPLATES[settings.programmeType] || PROGRAMME_TEMPLATES.default;
  return applyStageCustomization(template.stages, settings.customization);
};

export const savePipelineSettings = (programmeType, customization) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PIPELINE_SETTINGS_STORAGE_KEY, JSON.stringify({ programmeType, customization }));
    window.dispatchEvent(new CustomEvent(PIPELINE_SETTINGS_EVENT));
  } catch {
    // Storage can fail (private browsing, quota) — settings still work for
    // the current session, they just won't persist.
  }
};