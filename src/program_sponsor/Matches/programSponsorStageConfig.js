// ─────────────────────────────────────────────────────────────────────────────
// programSponsorStageConfig.js
//
// The Program Sponsor equivalent of the Catalyst `stageConfig.js`. Both the
// pipeline (ProgramSponsorDealflow) and the placement tables read their stage
// list from here, so renaming/hiding/reordering a stage in the pipeline's
// "Customize Stages" panel is immediately reflected wherever status is shown.
//
// Storage is scoped to its own key, so Program Sponsor, Advisor, CMF, Catalyst
// and Investor each keep their own pipeline setup.
// ─────────────────────────────────────────────────────────────────────────────

export const PIPELINE_SETTINGS_STORAGE_KEY = "program-sponsor-pipeline-settings-v1";

// Fired when this same tab changes pipeline settings, so tables can pick up the
// new stage list without a reload ('storage' only fires cross-tab).
export const PIPELINE_SETTINGS_EVENT = "program-sponsor-pipeline-settings-changed";

// Fired by a table after a status update lands in Firestore, so the pipeline
// can refresh its counts without the user navigating away and back.
export const PIPELINE_REFRESH_EVENT = "program-sponsor-pipeline-refresh";

// ─── Colour groups ───────────────────────────────────────────────────────────
// One colour per *group* rather than per stage, so a custom stage added by a
// sponsor automatically inherits a sensible, consistent colour.
export const STAGE_GROUP_COLORS = {
  entry:       { color: "#1d4ed8", bgColor: "#dbeafe", borderColor: "#bfdbfe" }, // blue
  screening:   { color: "#6d28d9", bgColor: "#ede9fe", borderColor: "#ddd6fe" }, // purple
  engagement:  { color: "#c2410c", bgColor: "#ffedd5", borderColor: "#fed7aa" }, // orange
  offer:       { color: "#a16207", bgColor: "#fef9c3", borderColor: "#fde68a" }, // yellow
  placement:   { color: "#15803d", bgColor: "#dcfce7", borderColor: "#bbf7d0" }, // green
  success:     { color: "#166534", bgColor: "#dcfce7", borderColor: "#86efac" }, // deep green
  negative:    { color: "#b91c1c", bgColor: "#fee2e2", borderColor: "#fecaca" }, // red
  neutral:     { color: "#4b5563", bgColor: "#f3f4f6", borderColor: "#e5e7eb" }, // grey
};

export const getStageColors = (group) =>
  STAGE_GROUP_COLORS[group] || STAGE_GROUP_COLORS.neutral;

// ─── Default (BIG) placement stages ──────────────────────────────────────────
// `aliases` exist so the values already written to `internshipApplications`
// ("New Match", "Contacted/Interview", "Confirmed"…) keep resolving to the
// right stage even after a stage has been renamed by the sponsor.
export const DEFAULT_STAGES = [
  {
    id: "matched", name: "Matched", group: "entry", icon: "Target", terminal: false,
    tooltip: "Candidates matched to your programme criteria.",
    aliases: ["new match", "matched", "matching", "match", "new"],
  },
  {
    id: "shortlisted", name: "Shortlisted", group: "screening", icon: "FileText", terminal: false,
    tooltip: "Candidates shortlisted for consideration.",
    aliases: ["shortlisted", "shortlist", "screened"],
  },
  {
    id: "engaged", name: "Engaged", group: "engagement", icon: "Users", terminal: false,
    tooltip: "Contacted and interviewing.",
    aliases: ["contacted/interview", "contacted", "interview", "engaged", "interviewing"],
  },
  {
    id: "offered", name: "Offered", group: "offer", icon: "FileCheck", terminal: false,
    tooltip: "Placement offer extended and awaiting acceptance.",
    aliases: ["confirmed", "offered", "offer", "offer extended"],
  },
  {
    id: "active", name: "Active", group: "placement", icon: "CheckCircle", terminal: false,
    tooltip: "Placement under way — the candidate is on programme.",
    aliases: ["active", "placed", "in placement", "on programme"],
  },
  {
    id: "completed", name: "Completed", group: "placement", icon: "TrendingUp", terminal: false,
    tooltip: "Placement finished, awaiting final rating.",
    aliases: ["completed", "complete", "finished"],
  },
  {
    id: "rated", name: "Rated", group: "success", icon: "Star", terminal: true,
    tooltip: "Placement closed out and rated — the full cycle is complete.",
    aliases: ["rated", "reviewed", "closed out"],
  },
  {
    id: "declined", name: "Declined", group: "negative", icon: "XCircle", terminal: true,
    tooltip: "Candidate declined — no further stages.",
    aliases: ["declined", "rejected", "unsuccessful"],
  },
  {
    id: "withdrawn", name: "Withdrawn", group: "negative", icon: "LogOut", terminal: true,
    tooltip: "Candidate withdrew from the programme.",
    aliases: ["withdrawn", "withdrew", "cancelled", "dropped out"],
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
  internship: {
    label: "Internship Placement",
    stages: withOrder([
      pick("matched"), pick("shortlisted"),
      {
        id: "interview", name: "Interview", group: "engagement", icon: "Users", terminal: false,
        tooltip: "Formal interview scheduled or held.",
        aliases: ["interview", "interviewing", "panel"],
      },
      pick("engaged", { name: "Host Matching" }),
      pick("offered"),
      {
        id: "onboarding", name: "Onboarding", group: "placement", icon: "Layers", terminal: false,
        tooltip: "Contracting, induction and first-day logistics.",
        aliases: ["onboarding", "induction", "intake"],
      },
      pick("active"), pick("completed"), pick("rated"),
      pick("declined"), pick("withdrawn"),
    ]),
  },
  learnership: {
    label: "Learnership",
    stages: withOrder([
      pick("matched"), pick("shortlisted"), pick("engaged"),
      {
        id: "assessment", name: "Assessment", group: "screening", icon: "Search", terminal: false,
        tooltip: "Entry assessment against accreditation requirements.",
        aliases: ["assessment", "testing", "evaluation"],
      },
      pick("offered", { name: "Enrolled" }),
      pick("active", { name: "In Training" }),
      {
        id: "portfolio", name: "Portfolio of Evidence", group: "placement", icon: "FileCheck", terminal: false,
        tooltip: "Portfolio of evidence compiled and submitted for moderation.",
        aliases: ["portfolio", "poe", "portfolio of evidence"],
      },
      pick("completed", { name: "Certified" }),
      pick("rated"), pick("declined"), pick("withdrawn"),
    ]),
  },
  graduate: {
    label: "Graduate Programme",
    stages: withOrder([
      pick("matched"), pick("shortlisted"),
      {
        id: "assessmentCentre", name: "Assessment Centre", group: "screening", icon: "Search", terminal: false,
        tooltip: "Group assessment centre and psychometric testing.",
        aliases: ["assessment centre", "assessment center", "assessment"],
      },
      pick("engaged", { name: "Final Interview" }),
      pick("offered"),
      pick("active", { name: "On Rotation" }),
      pick("completed"),
      pick("rated", { name: "Absorbed / Rated" }),
      pick("declined"), pick("withdrawn"),
    ]),
  },
};

// ─── Stage actions ───────────────────────────────────────────────────────────
// Which fields the "Update Stage" form shows for each stage. Sponsors can
// override any of these per programme type in the Customize Stages panel.
const BASE_STAGE_ACTIONS = {
  showMessage: true,
  showMeeting: false,
  showAvailability: false,
  showOfferLetter: false,
  showRating: false,
};

export const DEFAULT_STAGE_ACTIONS = {
  matched:         { ...BASE_STAGE_ACTIONS },
  shortlisted:     { ...BASE_STAGE_ACTIONS },
  assessment:      { ...BASE_STAGE_ACTIONS, showMeeting: true, showAvailability: true },
  assessmentCentre:{ ...BASE_STAGE_ACTIONS, showMeeting: true, showAvailability: true },
  interview:       { ...BASE_STAGE_ACTIONS, showMeeting: true, showAvailability: true },
  engaged:         { ...BASE_STAGE_ACTIONS, showMeeting: true, showAvailability: true },
  offered:         { ...BASE_STAGE_ACTIONS, showOfferLetter: true },
  onboarding:      { ...BASE_STAGE_ACTIONS, showOfferLetter: true },
  active:          { ...BASE_STAGE_ACTIONS },
  portfolio:       { ...BASE_STAGE_ACTIONS, showOfferLetter: true },
  completed:       { ...BASE_STAGE_ACTIONS },
  rated:           { ...BASE_STAGE_ACTIONS, showRating: true },
  declined:        { ...BASE_STAGE_ACTIONS },
  withdrawn:       { ...BASE_STAGE_ACTIONS },
};

export const getStageActionConfig = (stageId, overrides = {}) => ({
  ...BASE_STAGE_ACTIONS,
  ...(DEFAULT_STAGE_ACTIONS[stageId] || {}),
  ...((overrides || {})[stageId] || {}),
});

// ─── Status → stage mapping ──────────────────────────────────────────────────
// Slashes are normalised too, so "Contacted/Interview" resolves cleanly.
const norm = (v) =>
  (v || "").toString().toLowerCase().replace(/[_\-/]+/g, " ").replace(/\s+/g, " ").trim();

export const mapStatusToStageId = (status, stages = DEFAULT_STAGES) => {
  const list = stages?.length ? stages : DEFAULT_STAGES;
  const value = norm(status);
  // An empty/unknown status means "Matched" — placement rows exist from the
  // moment a candidate is matched.
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
// Customization is stored *per programme type*, so switching from Internship to
// Learnership never scrambles the setup built for the other one.
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