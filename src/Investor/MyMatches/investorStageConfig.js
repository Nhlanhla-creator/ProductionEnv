// ─────────────────────────────────────────────────────────────────────────────
// investorStageConfig.js
//
// The Investor-side equivalent of the Catalyst `stageConfig.js`. Both the
// pipeline (InvestorDealFlowPipeline) and the table (InvestorSMETable) read
// their stage list from here, so renaming/hiding/reordering a stage in the
// pipeline's "Customize Stages" panel is immediately reflected in the table's
// Status column, status filter, and the Update Stage form.
//
// Deliberately icon-library agnostic: stages carry an icon *name* (string),
// and each component maps that name to a lucide component itself.
// ─────────────────────────────────────────────────────────────────────────────

export const PIPELINE_SETTINGS_STORAGE_KEY = "investor-pipeline-settings-v1";

// Fired when this same tab changes pipeline settings, so the table can pick
// up the new stage list without a reload ('storage' only fires cross-tab).
export const PIPELINE_SETTINGS_EVENT = "investor-pipeline-settings-changed";

// Fired by the table after a stage update lands in Firestore, so the pipeline
// can refresh its counts without the user navigating away and back.
export const PIPELINE_REFRESH_EVENT = "investor-pipeline-refresh";

// ─── Colour groups ───────────────────────────────────────────────────────────
// One colour per *group* rather than per stage, so a custom stage added by an
// investor automatically inherits a sensible, consistent colour.
export const STAGE_GROUP_COLORS = {
  entry:       { color: "#1d4ed8", bgColor: "#dbeafe", borderColor: "#bfdbfe" }, // blue
  application: { color: "#6d28d9", bgColor: "#ede9fe", borderColor: "#ddd6fe" }, // purple
  review:      { color: "#c2410c", bgColor: "#ffedd5", borderColor: "#fed7aa" }, // orange
  diligence:   { color: "#a16207", bgColor: "#fef9c3", borderColor: "#fde68a" }, // yellow
  decision:    { color: "#15803d", bgColor: "#dcfce7", borderColor: "#bbf7d0" }, // green
  success:     { color: "#166534", bgColor: "#dcfce7", borderColor: "#86efac" }, // deep green
  negative:    { color: "#b91c1c", bgColor: "#fee2e2", borderColor: "#fecaca" }, // red
  neutral:     { color: "#4b5563", bgColor: "#f3f4f6", borderColor: "#e5e7eb" }, // grey
};

export const getStageColors = (group) =>
  STAGE_GROUP_COLORS[group] || STAGE_GROUP_COLORS.neutral;

// ─── Default (BIG) investor stages ───────────────────────────────────────────
// `aliases` exist so historical Firestore values ("Under Review", "Funding
// Approved", "Deal Complete"…) keep resolving to the right stage even after a
// stage has been renamed by the investor.
export const DEFAULT_STAGES = [
  {
    id: "matched", name: "Matches", group: "entry", icon: "Target", terminal: false,
    tooltip: "Businesses that meet your investment criteria but have not applied yet.",
    aliases: ["matched", "match", "matches", "initial"],
  },
  {
    id: "application", name: "Application", group: "application", icon: "FileText", terminal: false,
    tooltip: "Applications received and awaiting your first response.",
    aliases: ["application received", "application sent", "application", "applied", "pending", "new"],
  },
  {
    id: "evaluation", name: "Evaluation", group: "review", icon: "Search", terminal: false,
    tooltip: "Applications being reviewed by your investment team.",
    aliases: ["under review", "evaluation", "review", "in review", "screening"],
  },
  {
    id: "diligence", name: "Due Diligence", group: "diligence", icon: "Shield", terminal: false,
    tooltip: "Financial, legal and operational verification in progress.",
    aliases: ["due diligence", "diligence", "dd"],
  },
  {
    id: "decision", name: "Decision", group: "decision", icon: "AlertCircle", terminal: false,
    tooltip: "Investment decision made — amount, instrument and deployment agreed.",
    aliases: ["funding approved", "approved", "decision", "ic decision", "credit decision", "award decision"],
  },
  {
    id: "terms", name: "Terms Issued", group: "decision", icon: "FileCheck", terminal: false,
    tooltip: "Term sheet issued and awaiting the business's response.",
    aliases: ["termsheet", "term sheet", "terms issued", "terms issue", "offer issued"],
  },
  {
    id: "closed", name: "Deal Closed", group: "success", icon: "CheckCircle", terminal: true,
    tooltip: "Deal concluded and funds committed.",
    aliases: ["deal complete", "deal closed", "deals closed", "closed", "deal successful", "disbursed", "awarded"],
  },
  {
    id: "declined", name: "Declined", group: "negative", icon: "XCircle", terminal: true,
    tooltip: "Application declined — no further stages.",
    aliases: ["deal declined", "declined", "rejected"],
  },
  {
    id: "withdrawn", name: "Withdrawn", group: "negative", icon: "LogOut", terminal: true,
    tooltip: "The business withdrew its application.",
    aliases: ["withdrawn", "withdrew", "cancelled"],
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
  equity: {
    label: "Equity Investment",
    stages: withOrder([
      pick("matched"), pick("application"), pick("evaluation"), pick("diligence"),
      {
        id: "valuation", name: "Valuation", group: "decision", icon: "DollarSign", terminal: false,
        tooltip: "Valuation agreed and shareholding modelled.",
        aliases: ["valuation", "pricing"],
      },
      pick("decision", { name: "IC Decision" }),
      pick("terms"), pick("closed"), pick("declined"), pick("withdrawn"),
    ]),
  },
  debt: {
    label: "Debt Finance",
    stages: withOrder([
      pick("matched"), pick("application"), pick("evaluation"),
      {
        id: "credit", name: "Credit Assessment", group: "diligence", icon: "Shield", terminal: false,
        tooltip: "Affordability, security and repayment capacity assessed.",
        aliases: ["credit assessment", "credit", "affordability"],
      },
      pick("decision", { name: "Credit Decision" }),
      pick("terms", { name: "Offer Issued" }),
      pick("closed", { name: "Disbursed" }),
      pick("declined"), pick("withdrawn"),
    ]),
  },
  grant: {
    label: "Grant Funding",
    stages: withOrder([
      pick("matched"), pick("application"), pick("evaluation"),
      {
        id: "committee", name: "Committee Review", group: "review", icon: "Users", terminal: false,
        tooltip: "Reviewed by the grant committee against award criteria.",
        aliases: ["committee", "committee review", "panel"],
      },
      pick("decision", { name: "Award Decision" }),
      {
        id: "contracting", name: "Contracting", group: "decision", icon: "FileCheck", terminal: false,
        tooltip: "Grant agreement issued and being signed.",
        aliases: ["contracting", "grant agreement"],
      },
      pick("closed", { name: "Awarded" }),
      pick("declined"), pick("withdrawn"),
    ]),
  },
};

// ─── Stage actions ───────────────────────────────────────────────────────────
// Which fields the "Update Stage" form shows for each stage. Investors can
// override any of these per programme type in the Customize Stages panel.
const BASE_STAGE_ACTIONS = {
  showMessage: true,
  showMeeting: false,
  showAvailability: false,
  showTermSheet: false,
  showFundingDetails: false,
};

export const DEFAULT_STAGE_ACTIONS = {
  matched:     { ...BASE_STAGE_ACTIONS },
  application: { ...BASE_STAGE_ACTIONS },
  evaluation:  { ...BASE_STAGE_ACTIONS, showMeeting: true, showAvailability: true },
  diligence:   { ...BASE_STAGE_ACTIONS },
  credit:      { ...BASE_STAGE_ACTIONS },
  committee:   { ...BASE_STAGE_ACTIONS, showMeeting: true },
  valuation:   { ...BASE_STAGE_ACTIONS, showFundingDetails: true },
  decision:    { ...BASE_STAGE_ACTIONS, showFundingDetails: true },
  terms:       { ...BASE_STAGE_ACTIONS, showTermSheet: true },
  contracting: { ...BASE_STAGE_ACTIONS, showTermSheet: true },
  closed:      { ...BASE_STAGE_ACTIONS },
  declined:    { ...BASE_STAGE_ACTIONS },
  withdrawn:   { ...BASE_STAGE_ACTIONS },
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
  const fallback = list.find((s) => s.id === "application")?.id || list[0]?.id;
  if (!value) return fallback;

  for (const stage of list) {
    if (norm(stage.id) === value) return stage.id;
    if (norm(stage.name) === value) return stage.id;
    if ((stage.aliases || []).some((a) => norm(a) === value)) return stage.id;
  }
  // Looser pass for values like "Deal Complete — funds released".
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
  const {
    renames = {}, hidden = [], order = [], custom = [],
  } = customization || {};

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
// Customization is stored *per programme type*, so switching from Equity to
// Grant never scrambles the setup you built for the other one.
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
    // Storage can fail (private browsing, quota). The session still works,
    // it just won't persist.
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