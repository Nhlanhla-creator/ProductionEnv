// ─────────────────────────────────────────────────────────────────────────────
// cmfStageConfig.js
//
// The CMF-side equivalent of the Catalyst `stageConfig.js`. Both the pipeline
// (CMFDealFlowPipeline) and the table (CMFSMETable) read their stage list from
// here, so renaming/hiding/reordering a stage in the pipeline's "Customize
// Stages" panel is immediately reflected in the table's Status column, status
// filter, and the Update Stage form.
//
// Storage is scoped to its own key, so CMF, Catalyst and Investor each keep
// their own pipeline setup rather than overwriting one another.
// ─────────────────────────────────────────────────────────────────────────────

export const PIPELINE_SETTINGS_STORAGE_KEY = "cmf-pipeline-settings-v1";

// Fired when this same tab changes pipeline settings, so the table can pick up
// the new stage list without a reload ('storage' only fires cross-tab).
export const PIPELINE_SETTINGS_EVENT = "cmf-pipeline-settings-changed";

// ─── Colour groups ───────────────────────────────────────────────────────────
// One colour per *group* rather than per stage, so a custom stage added by a
// programme manager automatically inherits a sensible, consistent colour.
export const STAGE_GROUP_COLORS = {
  entry:       { color: "#1d4ed8", bgColor: "#dbeafe", borderColor: "#bfdbfe" }, // blue
  application: { color: "#6d28d9", bgColor: "#ede9fe", borderColor: "#ddd6fe" }, // purple
  review:      { color: "#c2410c", bgColor: "#ffedd5", borderColor: "#fed7aa" }, // orange
  diligence:   { color: "#a16207", bgColor: "#fef9c3", borderColor: "#fde68a" }, // yellow
  decision:    { color: "#15803d", bgColor: "#dcfce7", borderColor: "#bbf7d0" }, // green
  engagement:  { color: "#166534", bgColor: "#dcfce7", borderColor: "#86efac" }, // deep green
  success:     { color: "#1f2937", bgColor: "#e5e7eb", borderColor: "#d1d5db" }, // near-black
  negative:    { color: "#b91c1c", bgColor: "#fee2e2", borderColor: "#fecaca" }, // red
  neutral:     { color: "#4b5563", bgColor: "#f3f4f6", borderColor: "#e5e7eb" }, // grey
};

export const getStageColors = (group) =>
  STAGE_GROUP_COLORS[group] || STAGE_GROUP_COLORS.neutral;

// ─── Default CMF stages ──────────────────────────────────────────────────────
// Aliases map legacy or alternative status strings to the standard CMF stages.
export const DEFAULT_STAGES = [
  {
    id: "matched", name: "Matched", group: "entry", icon: "Target", terminal: false,
    tooltip: "Businesses matched to your programme criteria.",
    aliases: ["matched", "matching", "match", "new", "pipeline"],
  },
  {
    id: "evaluation", name: "Evaluation", group: "review", icon: "Search", terminal: false,
    tooltip: "Businesses currently under assessment and evaluation.",
    aliases: [
      "evaluation", "review", "under review", "screening", "in review", "evaluating",
      "applied", "application", "application received", "application sent", "pending",
      "due diligence", "diligence", "dd", "shortlisted", "verification",
      "decision", "approved", "decided", "award", "admission",
      "offer", "term sheet", "termsheet"
    ],
  },
  {
    id: "active", name: "Active Support", group: "engagement", icon: "CheckCircle", terminal: false,
    tooltip: "Business onboarded and actively receiving support and guidance.",
    aliases: ["active", "active support", "admitted", "onboarded", "engaged", "in programme", "contracted", "supported", "in progress"],
  },
  {
    id: "completed", name: "Exited", group: "success", icon: "TrendingUp", terminal: true,
    tooltip: "Programme concluded — business graduated or exited.",
    aliases: ["completed", "exited", "graduated", "closed", "delivered", "complete", "exit"],
  },
  {
    id: "declined", name: "Decline", group: "negative", icon: "XCircle", terminal: true,
    tooltip: "Application or engagement declined — no further stages.",
    aliases: ["declined", "decline", "rejected", "unsuccessful", "withdrawn", "cancelled"],
  },
];

// ─── Programme templates ─────────────────────────────────────────────────────
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
  esd: {
    label: "Enterprise & Supplier Development",
    stages: withOrder([
      pick("matched"),
      pick("evaluation", { name: "Assessment" }),
      pick("active", { name: "Active Support" }),
      pick("completed", { name: "Graduated" }),
      pick("declined", { name: "Declined" }),
    ]),
  },
  procurement: {
    label: "Procurement",
    stages: withOrder([
      pick("matched"),
      pick("evaluation", { name: "Bid Evaluation" }),
      pick("active", { name: "Contracted Support" }),
      pick("completed", { name: "Delivered" }),
      pick("declined", { name: "Declined" }),
    ]),
  },
  incubation: {
    label: "Incubation & Acceleration",
    stages: withOrder([
      pick("matched"),
      pick("evaluation", { name: "Selection Panel" }),
      pick("active", { name: "In Cohort" }),
      pick("completed", { name: "Graduated" }),
      pick("declined", { name: "Declined" }),
    ]),
  },
};

// ─── Stage actions ───────────────────────────────────────────────────────────
// Which fields the "Update Stage" form shows for each stage. Programme
// managers can override any of these per programme type in the Customize
// Stages panel.
const BASE_STAGE_ACTIONS = {
  showMessage: true,
  showMeeting: false,
  showAvailability: false,
  showAgreement: false,
};

export const DEFAULT_STAGE_ACTIONS = {
  matched:          { ...BASE_STAGE_ACTIONS },
  applied:          { ...BASE_STAGE_ACTIONS },
  evaluation:       { ...BASE_STAGE_ACTIONS, showMeeting: true, showAvailability: true },
  prequalification: { ...BASE_STAGE_ACTIONS },
  interview:        { ...BASE_STAGE_ACTIONS, showMeeting: true, showAvailability: true },
  dueDiligence:     { ...BASE_STAGE_ACTIONS },
  decision:         { ...BASE_STAGE_ACTIONS },
  offer:            { ...BASE_STAGE_ACTIONS, showAgreement: true },
  onboarding:       { ...BASE_STAGE_ACTIONS, showAgreement: true },
  active:           { ...BASE_STAGE_ACTIONS },
  completed:        { ...BASE_STAGE_ACTIONS },
  declined:         { ...BASE_STAGE_ACTIONS },
  withdrawn:        { ...BASE_STAGE_ACTIONS },
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
  // An empty/unknown status means "matched" here — CMF rows exist from the
  // moment they're matched, before any application is submitted.
  const fallback = list.find((s) => s.id === "matched")?.id || list[0]?.id;
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
    tooltip: c.tooltip || "Custom stage added for this programme type.",
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
// Customization is stored *per programme type*, so switching from ESD to
// Procurement never scrambles the setup built for the other one.
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