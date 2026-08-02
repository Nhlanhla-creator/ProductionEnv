// ─────────────────────────────────────────────────────────────────────────────
// advisorStageConfig.js
//
// The Advisor-side equivalent of the Catalyst `stageConfig.js`. Both the
// pipeline (AdvisorDealFlowPipeline) and the table (AdvisorTable) read their
// stage list from here, so renaming/hiding/reordering a stage in the pipeline's
// "Customize Stages" panel is immediately reflected in the table's Status
// column, status filter, and the Update Stage form.
//
// Storage is scoped to its own key, so Advisor, CMF, Catalyst and Investor each
// keep their own pipeline setup rather than overwriting one another.
// ─────────────────────────────────────────────────────────────────────────────

export const PIPELINE_SETTINGS_STORAGE_KEY = "advisor-pipeline-settings-v1";

// Fired when this same tab changes pipeline settings, so the table can pick up
// the new stage list without a reload ('storage' only fires cross-tab).
export const PIPELINE_SETTINGS_EVENT = "advisor-pipeline-settings-changed";

// Fired by the table after a stage update lands in Firestore, so the pipeline
// can refresh its counts without the user navigating away and back.
export const PIPELINE_REFRESH_EVENT = "advisor-pipeline-refresh";

// ─── Colour groups ───────────────────────────────────────────────────────────
// One colour per *group* rather than per stage, so a custom stage added by an
// advisor automatically inherits a sensible, consistent colour.
export const STAGE_GROUP_COLORS = {
  entry:       { color: "#1d4ed8", bgColor: "#dbeafe", borderColor: "#bfdbfe" }, // blue
  outreach:    { color: "#6d28d9", bgColor: "#ede9fe", borderColor: "#ddd6fe" }, // purple
  review:      { color: "#c2410c", bgColor: "#ffedd5", borderColor: "#fed7aa" }, // orange
  diligence:   { color: "#a16207", bgColor: "#fef9c3", borderColor: "#fde68a" }, // yellow
  decision:    { color: "#15803d", bgColor: "#dcfce7", borderColor: "#bbf7d0" }, // green
  success:     { color: "#166534", bgColor: "#dcfce7", borderColor: "#86efac" }, // deep green
  negative:    { color: "#b91c1c", bgColor: "#fee2e2", borderColor: "#fecaca" }, // red
  neutral:     { color: "#4b5563", bgColor: "#f3f4f6", borderColor: "#e5e7eb" }, // grey
};

export const getStageColors = (group) =>
  STAGE_GROUP_COLORS[group] || STAGE_GROUP_COLORS.neutral;

// ─── Default (BIG) advisory stages ───────────────────────────────────────────
// `aliases` exist so historical Firestore values ("New Match", "Shortlisted",
// "Confirmed", "Deal Successful"…) keep resolving to the right stage even after
// a stage has been renamed by the advisor.
export const DEFAULT_STAGES = [
  {
    id: "newMatch", name: "New Match", group: "entry", icon: "Target", terminal: false,
    tooltip: "Businesses matched to your advisory profile, not yet contacted.",
    aliases: ["new match", "new", "matched", "matching", "match"],
  },
  {
    id: "contacted", name: "Contacted", group: "outreach", icon: "FileText", terminal: false,
    tooltip: "Initial outreach made and awaiting a response.",
    aliases: ["contacted", "shortlisted", "outreach", "application received", "applied"],
  },
  {
    id: "evaluation", name: "Evaluation", group: "review", icon: "Search", terminal: false,
    tooltip: "Assessing the business's needs against your advisory expertise.",
    aliases: ["evaluation", "review", "under review", "screening"],
  },
  {
    id: "diligence", name: "Due Diligence", group: "diligence", icon: "Shield", terminal: false,
    tooltip: "Detailed scoping, verification and readiness assessment.",
    aliases: ["due diligence", "diligence", "dd", "scoping"],
  },
  {
    id: "decision", name: "Decision", group: "decision", icon: "AlertCircle", terminal: false,
    tooltip: "Deciding whether to take on the engagement.",
    aliases: ["decision", "confirmed", "approved", "decided"],
  },
  {
    id: "terms", name: "Term Issue", group: "decision", icon: "FileCheck", terminal: false,
    tooltip: "Terms or engagement letter issued and awaiting signature.",
    aliases: ["term issue", "terms issued", "termsheet", "term sheet", "engagement letter", "sow issued"],
  },
  {
    id: "successful", name: "Deal Successful", group: "success", icon: "CheckCircle", terminal: true,
    tooltip: "Engagement agreed and under way.",
    aliases: ["deal successful", "successful", "deal complete", "engaged", "closed", "project started"],
  },
  {
    id: "declined", name: "Deal Declined", group: "negative", icon: "XCircle", terminal: true,
    tooltip: "Engagement declined — no further stages.",
    aliases: ["deal declined", "declined", "rejected", "unsuccessful"],
  },
  {
    id: "withdrawn", name: "Withdrawn", group: "negative", icon: "LogOut", terminal: true,
    tooltip: "The business withdrew from the engagement.",
    aliases: ["withdrawn", "withdrew", "cancelled"],
  },
];

// ─── Engagement templates ────────────────────────────────────────────────────
const pick = (id, overrides = {}) => ({
  ...DEFAULT_STAGES.find((s) => s.id === id),
  ...overrides,
});

const withOrder = (stages) => stages.map((s, i) => ({ ...s, order: i }));

export const PROGRAMME_TEMPLATES = {
  default: {
    label: "BIG Default",
    stages: withOrder(DEFAULT_STAGES.map((s) => ({ ...s }))),
  },
  retainer: {
    label: "Advisory Retainer",
    stages: withOrder([
      pick("newMatch"), pick("contacted"), pick("evaluation"),
      pick("diligence", { name: "Scoping" }),
      pick("decision"),
      pick("terms", { name: "Engagement Letter" }),
      pick("successful", { name: "Retainer Active" }),
      pick("declined"), pick("withdrawn"),
    ]),
  },
  project: {
    label: "Project / Scope of Work",
    stages: withOrder([
      pick("newMatch"), pick("contacted"), pick("evaluation"),
      {
        id: "proposal", name: "Proposal", group: "review", icon: "Layers", terminal: false,
        tooltip: "Proposal and pricing prepared for the business.",
        aliases: ["proposal", "quote", "pricing"],
      },
      pick("decision"),
      pick("terms", { name: "SOW Issued" }),
      pick("successful", { name: "Project Started" }),
      pick("declined"), pick("withdrawn"),
    ]),
  },
  mentorship: {
    label: "Mentorship",
    stages: withOrder([
      pick("newMatch"), pick("contacted"),
      {
        id: "intro", name: "Intro Session", group: "outreach", icon: "Users", terminal: false,
        tooltip: "Introductory session held to test chemistry and fit.",
        aliases: ["intro session", "intro", "chemistry"],
      },
      pick("evaluation", { name: "Fit Assessment" }),
      pick("decision"),
      pick("successful", { name: "Mentorship Active" }),
      pick("declined"), pick("withdrawn"),
    ]),
  },
};

// ─── Stage actions ───────────────────────────────────────────────────────────
// Which fields the "Update Stage" form shows for each stage. Advisors can
// override any of these per engagement type in the Customize Stages panel.
const BASE_STAGE_ACTIONS = {
  showMessage: true,
  showMeeting: false,
  showAvailability: false,
  showTermSheet: false,
};

export const DEFAULT_STAGE_ACTIONS = {
  newMatch:   { ...BASE_STAGE_ACTIONS },
  contacted:  { ...BASE_STAGE_ACTIONS, showMeeting: true, showAvailability: true },
  intro:      { ...BASE_STAGE_ACTIONS, showMeeting: true, showAvailability: true },
  evaluation: { ...BASE_STAGE_ACTIONS, showMeeting: true, showAvailability: true },
  diligence:  { ...BASE_STAGE_ACTIONS, showMeeting: true, showAvailability: true },
  proposal:   { ...BASE_STAGE_ACTIONS, showTermSheet: true },
  decision:   { ...BASE_STAGE_ACTIONS, showMeeting: true, showAvailability: true },
  terms:      { ...BASE_STAGE_ACTIONS, showTermSheet: true },
  successful: { ...BASE_STAGE_ACTIONS, showTermSheet: true },
  declined:   { ...BASE_STAGE_ACTIONS },
  withdrawn:  { ...BASE_STAGE_ACTIONS },
};

export const getStageActionConfig = (stageId, overrides = {}) => ({
  ...BASE_STAGE_ACTIONS,
  ...(DEFAULT_STAGE_ACTIONS[stageId] || {}),
  ...((overrides || {})[stageId] || {}),
});

// ─── Status → stage mapping ──────────────────────────────────────────────────
const norm = (v) =>
  (v || "").toString().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

export const mapStatusToStageId = (status, stages = DEFAULT_STAGES) => {
  const list = stages?.length ? stages : DEFAULT_STAGES;
  const value = norm(status);
  // An empty/unknown status means "New Match" — advisory rows exist from the
  // moment they're matched, before any outreach.
  const fallback = list.find((s) => s.id === "newMatch")?.id || list[0]?.id;
  if (!value) return fallback;

  for (const stage of list) {
    if (norm(stage.id) === value) return stage.id;
    if (norm(stage.name) === value) return stage.id;
    if ((stage.aliases || []).some((a) => norm(a) === value)) return stage.id;
  }
  for (const stage of list) {
    if ((stage.aliases || []).some((a) => a && value.includes(norm(a)))) return stage.id;
  }
  return fallback;
};

export const getStageById = (id, stages = DEFAULT_STAGES) =>
  (stages?.length ? stages : DEFAULT_STAGES).find((s) => s.id === id) || stages[0];

// ─── Customization ───────────────────────────────────────────────────────────
export const DEFAULT_PIPELINE_CUSTOMIZATION = {
  renames: {},
  hidden: [],
  order: [],
  custom: [],
  stageActions: {},
};

export const applyStageCustomization = (baseStages, customization = {}) => {
  const { renames = {}, hidden = [], order = [], custom = [] } = customization || {};

  const customStages = (custom || []).map((c) => ({
    id: c.id,
    name: c.name,
    group: c.group || "neutral",
    icon: c.icon || "Layers",
    terminal: false,
    tooltip: c.tooltip || "Custom stage added for this engagement type.",
    aliases: [c.name],
  }));

  let stages = [...baseStages, ...customStages].map((s) => ({
    ...s,
    name: renames[s.id] || s.name,
  }));

  if (order?.length) {
    const position = new Map(order.map((id, i) => [id, i]));
    stages.sort(
      (a, b) =>
        (position.has(a.id) ? position.get(a.id) : 999) -
        (position.has(b.id) ? position.get(b.id) : 999)
    );
  }

  stages = stages.filter((s) => !(hidden || []).includes(s.id));

  return stages.map((s, i) => ({ ...s, order: i }));
};

// Next stage = the next *live* (non-terminal) stage in the active order. From
// the last live stage the next step is the success outcome; terminal stages
// have no next stage.
export const getNextStageId = (stages, currentId) => {
  const list = stages?.length ? stages : DEFAULT_STAGES;
  const live = list.filter((s) => !s.terminal).sort((a, b) => a.order - b.order);
  const current = list.find((s) => s.id === currentId);
  if (current?.terminal) return current.id;

  const idx = live.findIndex((s) => s.id === currentId);
  if (idx === -1) return live[0]?.id || list[0]?.id;
  if (idx < live.length - 1) return live[idx + 1].id;

  const success = list.find((s) => s.terminal && s.group === "success");
  return success ? success.id : live[idx].id;
};

// ─── Persistence ─────────────────────────────────────────────────────────────
// Customization is stored *per engagement type*, so switching from Retainer to
// Mentorship never scrambles the setup built for the other one.
export const loadPipelineSettings = () => {
  const fallback = {
    programmeType: "default",
    customization: { ...DEFAULT_PIPELINE_CUSTOMIZATION },
    customizations: {},
  };
  if (typeof window === "undefined") return fallback;
  try {
    const saved = JSON.parse(window.localStorage.getItem(PIPELINE_SETTINGS_STORAGE_KEY) || "null");
    if (!saved) return fallback;
    const programmeType = PROGRAMME_TEMPLATES[saved.programmeType] ? saved.programmeType : "default";
    const customizations =
      saved.customizations && typeof saved.customizations === "object" ? saved.customizations : {};
    return {
      programmeType,
      customization: { ...DEFAULT_PIPELINE_CUSTOMIZATION, ...(customizations[programmeType] || {}) },
      customizations,
    };
  } catch {
    return fallback;
  }
};

export const loadCustomizationForType = (programmeType) => {
  const { customizations } = loadPipelineSettings();
  return { ...DEFAULT_PIPELINE_CUSTOMIZATION, ...((customizations || {})[programmeType] || {}) };
};

export const savePipelineSettings = (programmeType, customization) => {
  if (typeof window === "undefined") return;
  try {
    const existing =
      JSON.parse(window.localStorage.getItem(PIPELINE_SETTINGS_STORAGE_KEY) || "null") || {};
    const customizations = { ...(existing.customizations || {}), [programmeType]: customization };
    window.localStorage.setItem(
      PIPELINE_SETTINGS_STORAGE_KEY,
      JSON.stringify({ programmeType, customizations })
    );
    window.dispatchEvent(new Event(PIPELINE_SETTINGS_EVENT));
  } catch {
    // Storage can fail (private browsing, quota). The session still works, it
    // just won't persist.
  }
};

export const getActiveStages = (settings) => {
  const s = settings || loadPipelineSettings();
  const base = (PROGRAMME_TEMPLATES[s.programmeType] || PROGRAMME_TEMPLATES.default).stages;
  return applyStageCustomization(base, s.customization);
};

export const notifyPipelineRefresh = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PIPELINE_REFRESH_EVENT));
};