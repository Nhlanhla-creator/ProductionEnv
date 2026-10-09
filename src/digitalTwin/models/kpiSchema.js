/**
 * digitalTwin/models/kpiSchema.js
 *
 * KPI definition schema and the canonical formula registry (Brief Sections
 * 7.1, 7.3, 7.4, 7.5, 7.7).
 *
 * Design decisions enforced here:
 *   - Formulas are declarative — components + operation, never eval/Function
 *   - Every KPI declares its aggregation rule (sum, recompute, weighted,
 *     prohibited) — the engine obeys it strictly (Section 7.4)
 *   - Ratios are ALWAYS recomputed from components at each hierarchy level.
 *     Averaging child percentages is explicitly forbidden unless the KPI
 *     declares `aggregation: "average"` with an approval note.
 *   - Each KPI carries a version; new versions do not rewrite history.
 */

import { AGGREGATION_METHOD, KPI_CATEGORY, KPI_DIRECTION } from "./enums";

// ── Formula operations (safe, declarative) ───────────────────────────────
export const FORMULA_OPS = Object.freeze({
  DIVIDE:    "divide",     // numerator / denominator
  MULTIPLY:  "multiply",   // a * b (for OEE chains, etc.)
  SUM:       "sum",        // sum of components
  SUBTRACT:  "subtract",   // a - b
  WEIGHTED:  "weighted",   // sum(value * weight) / sum(weight)
  PERCENT:   "percent",    // (numerator / denominator) * 100
  COUNT_UNIQUE: "count_unique",
});

// ── KPI definition factory ────────────────────────────────────────────────
export const createKpiDefinition = (input) => {
  const nowIso = new Date().toISOString();
  return {
    kpiId: input.kpiId || null,                 // immutable
    version: input.version ?? 1,
    name: input.name || "",
    businessMeaning: input.businessMeaning || "",
    category: input.category || KPI_CATEGORY.TIME_UTILISATION,
    type: input.type || "ratio",                // "input" | "output" | "ratio" | "rate" | "status" | "composite"
    direction: input.direction || KPI_DIRECTION.HIGHER_IS_BETTER,
    unit: input.unit || "percent",
    formula: input.formula || null,             // { op, numerator, denominator, components } — see FORMULA_OPS
    components: input.components || [],         // [{ id, label, unit, source, kpiId? }]
    grain: input.grain || { time: "shift", dimensions: ["asset", "activity", "contract", "site"] },
    aggregation: input.aggregation || AGGREGATION_METHOD.RECOMPUTE,
    weightField: input.weightField || null,     // e.g. "scheduled_hours" when aggregation = weighted_average
    thresholds: input.thresholds || { target: null, warning: null, critical: null, direction: input.direction || "higher" },
    applicability: input.applicability || { sector: null, service: null, activity: null, equipmentType: null },
    sourcePriority: input.sourcePriority || [
      "integrated_verified", "verified_evidence", "manual_actual", "estimate", "calculated",
    ],
    qualityRule: input.qualityRule || {
      completeness: 0.95,
      plausibility: { min: null, max: null },
      duplicateTolerance: 0,
      reconciliationRequired: false,
    },
    owner: input.owner || null,
    approvedBy: input.approvedBy || null,
    approvedAt: input.approvedAt || null,
    effectiveFrom: input.effectiveFrom || nowIso.split("T")[0],
    effectiveTo: input.effectiveTo || null,
    status: input.status || "draft",            // "draft" | "active" | "superseded"
    createdAt: nowIso,
    createdBy: input.createdBy || null,
  };
};

// ── Unit-scope enforcement (rejects cross-quantity formulas) ─────────────
const COMPATIBLE_UNIT_GROUPS = {
  time: ["hours", "minutes", "days", "shifts"],
  mass: ["tonnes", "kilograms"],
  distance: ["metres", "kilometres"],
  volume: ["cubic_metres", "litres"],
  money: ["ZAR", "USD", "EUR", "GBP"],
  energy: ["kilowatt_hours", "megawatt_hours"],
  count: ["count", "units", "cycles", "trips", "holes", "events"],
  ratio: ["percent", "ratio"],
};

export const unitGroupOf = (unit) => {
  for (const [group, members] of Object.entries(COMPATIBLE_UNIT_GROUPS)) {
    if (members.includes(unit)) return group;
  }
  return null;
};

export const validateKpiDefinition = (def) => {
  const errors = [];
  const warnings = [];

  if (!def.name || !def.name.trim()) errors.push({ field: "name", message: "KPI name is required." });
  if (!def.unit) errors.push({ field: "unit", message: "Unit is required." });

  // Formula validity
  if (def.type !== "input" && def.type !== "status") {
    if (!def.formula || !def.formula.op) {
      errors.push({ field: "formula", message: "Calculated KPIs must declare a formula operation." });
    } else if (!Object.values(FORMULA_OPS).includes(def.formula.op)) {
      errors.push({ field: "formula", message: `Unknown formula op "${def.formula.op}".` });
    }
  }

  // Component references
  if (def.formula?.op === FORMULA_OPS.DIVIDE || def.formula?.op === FORMULA_OPS.PERCENT) {
    if (!def.formula.numerator) errors.push({ field: "formula.numerator", message: "Numerator component is required." });
    if (!def.formula.denominator) errors.push({ field: "formula.denominator", message: "Denominator component is required." });
    const compIds = new Set(def.components.map((c) => c.id));
    if (def.formula.numerator && !compIds.has(def.formula.numerator)) {
      errors.push({ field: "formula.numerator", message: `Numerator "${def.formula.numerator}" is not in components list.` });
    }
    if (def.formula.denominator && !compIds.has(def.formula.denominator)) {
      errors.push({ field: "formula.denominator", message: `Denominator "${def.formula.denominator}" is not in components list.` });
    }
    // Unit compatibility
    const numComp = def.components.find((c) => c.id === def.formula.numerator);
    const denComp = def.components.find((c) => c.id === def.formula.denominator);
    if (numComp && denComp) {
      const numGroup = unitGroupOf(numComp.unit);
      const denGroup = unitGroupOf(denComp.unit);
      if (numGroup && denGroup && numGroup !== denGroup && def.unit === "percent") {
        errors.push({
          field: "formula",
          message: `Cannot compute a percentage from "${numGroup}" ÷ "${denGroup}" — quantities must match.`,
        });
      }
    }
  }

  // Aggregation policy — Section 7.4
  if (def.aggregation === AGGREGATION_METHOD.AVERAGE && def.type === "ratio") {
    warnings.push({
      field: "aggregation",
      message: "Ratio KPIs should normally use 'recompute', not 'average'. Averaging child percentages is explicitly prohibited unless approved.",
    });
  }
  if (def.aggregation === AGGREGATION_METHOD.WEIGHTED_AVERAGE && !def.weightField) {
    errors.push({
      field: "weightField",
      message: "Weighted-average aggregation requires an explicit weight field (Section 7.4).",
    });
  }

  return { ok: errors.length === 0, errors, warnings };
};

// ── Canonical KPI registry ───────────────────────────────────────────────
// Every formula from Brief Section 7.4 is encoded here. Version 1.

export const CANONICAL_KPIS = [
  // ── Time & utilisation ──────────────────────────────────────────────
  createKpiDefinition({
    kpiId: "kpi.physical_availability",
    version: 1,
    name: "Physical availability",
    businessMeaning: "Share of scheduled time the asset or circuit was physically able to run.",
    category: KPI_CATEGORY.TIME_UTILISATION,
    type: "ratio",
    unit: "percent",
    direction: KPI_DIRECTION.HIGHER_IS_BETTER,
    formula: { op: FORMULA_OPS.PERCENT, numerator: "available_time", denominator: "scheduled_time" },
    components: [
      { id: "available_time", label: "Available time", unit: "hours" },
      { id: "scheduled_time", label: "Scheduled time", unit: "hours" },
    ],
    grain: { time: "shift", dimensions: ["asset", "activity", "service", "contract", "site", "company"] },
    aggregation: AGGREGATION_METHOD.RECOMPUTE,
    weightField: "scheduled_time",
    thresholds: { target: 90, warning: 87, critical: 84, direction: "higher" },
    sourcePriority: ["integrated_verified", "verified_evidence", "manual_actual", "estimate"],
  }),

  createKpiDefinition({
    kpiId: "kpi.utilisation",
    version: 1,
    name: "Utilisation of available time",
    businessMeaning: "Share of available time the asset actually spent operating.",
    category: KPI_CATEGORY.TIME_UTILISATION,
    type: "ratio",
    unit: "percent",
    direction: KPI_DIRECTION.HIGHER_IS_BETTER,
    formula: { op: FORMULA_OPS.PERCENT, numerator: "operating_time", denominator: "available_time" },
    components: [
      { id: "operating_time", label: "Operating time", unit: "hours" },
      { id: "available_time", label: "Available time", unit: "hours" },
    ],
    grain: { time: "shift", dimensions: ["asset", "activity", "service", "contract", "site", "company"] },
    aggregation: AGGREGATION_METHOD.RECOMPUTE,
    weightField: "available_time",
    thresholds: { target: 75, warning: 70, critical: 65, direction: "higher" },
  }),

  // ── Production ──────────────────────────────────────────────────────
  createKpiDefinition({
    kpiId: "kpi.productivity",
    version: 1,
    name: "Productivity",
    businessMeaning: "Accepted output produced per unit of operating time.",
    category: KPI_CATEGORY.PRODUCTION,
    type: "rate",
    unit: "tonnes_per_hour",
    direction: KPI_DIRECTION.HIGHER_IS_BETTER,
    formula: { op: FORMULA_OPS.DIVIDE, numerator: "accepted_output", denominator: "operating_time" },
    components: [
      { id: "accepted_output", label: "Accepted output", unit: "tonnes" },
      { id: "operating_time", label: "Operating time", unit: "hours" },
    ],
    grain: { time: "shift", dimensions: ["asset", "activity", "service", "contract", "site", "company"] },
    aggregation: AGGREGATION_METHOD.RECOMPUTE,
    weightField: "operating_time",
    thresholds: { target: null, warning: null, critical: null, direction: "higher" },
  }),

  createKpiDefinition({
    kpiId: "kpi.target_attainment",
    version: 1,
    name: "Target attainment",
    businessMeaning: "Accepted output achieved against the approved target for the same scope and period.",
    category: KPI_CATEGORY.PRODUCTION,
    type: "ratio",
    unit: "percent",
    direction: KPI_DIRECTION.HIGHER_IS_BETTER,
    formula: { op: FORMULA_OPS.PERCENT, numerator: "accepted_output", denominator: "approved_target" },
    components: [
      { id: "accepted_output", label: "Accepted output", unit: "tonnes" },
      { id: "approved_target", label: "Approved target", unit: "tonnes" },
    ],
    grain: { time: "month", dimensions: ["asset", "activity", "service", "contract", "site", "company"] },
    aggregation: AGGREGATION_METHOD.RECOMPUTE,
    weightField: "approved_target",
    thresholds: { target: 100, warning: 95, critical: 90, direction: "higher" },
  }),

  // ── Reliability ─────────────────────────────────────────────────────
  createKpiDefinition({
    kpiId: "kpi.mtbf",
    version: 1,
    name: "Mean time between failures",
    businessMeaning: "Average operating time between functional failures.",
    category: KPI_CATEGORY.RELIABILITY,
    type: "rate",
    unit: "hours",
    direction: KPI_DIRECTION.HIGHER_IS_BETTER,
    formula: { op: FORMULA_OPS.DIVIDE, numerator: "operating_time", denominator: "functional_failures" },
    components: [
      { id: "operating_time", label: "Operating time", unit: "hours" },
      { id: "functional_failures", label: "Functional failure events", unit: "count" },
    ],
    grain: { time: "month", dimensions: ["asset", "equipment_type", "group", "service", "contract", "site", "company"] },
    aggregation: AGGREGATION_METHOD.RECOMPUTE,
    thresholds: { target: null, warning: null, critical: null, direction: "higher" },
  }),

  createKpiDefinition({
    kpiId: "kpi.mttr",
    version: 1,
    name: "Mean time to repair",
    businessMeaning: "Average active repair time per repair event.",
    category: KPI_CATEGORY.RELIABILITY,
    type: "rate",
    unit: "hours",
    direction: KPI_DIRECTION.LOWER_IS_BETTER,
    formula: { op: FORMULA_OPS.DIVIDE, numerator: "active_repair_time", denominator: "repair_events" },
    components: [
      { id: "active_repair_time", label: "Active repair time", unit: "hours" },
      { id: "repair_events", label: "Repair events", unit: "count" },
    ],
    grain: { time: "month", dimensions: ["asset", "equipment_type", "group", "service", "contract", "site", "company"] },
    aggregation: AGGREGATION_METHOD.RECOMPUTE,
    thresholds: { target: null, warning: null, critical: null, direction: "lower" },
  }),

  // ── Maintenance ─────────────────────────────────────────────────────
  createKpiDefinition({
    kpiId: "kpi.pm_adherence",
    version: 1,
    name: "PM adherence",
    businessMeaning: "Share of planned maintenance work completed on time.",
    category: KPI_CATEGORY.MAINTENANCE,
    type: "ratio",
    unit: "percent",
    direction: KPI_DIRECTION.HIGHER_IS_BETTER,
    formula: { op: FORMULA_OPS.PERCENT, numerator: "pm_completed_on_time", denominator: "pm_due" },
    components: [
      { id: "pm_completed_on_time", label: "PM completed on time", unit: "count" },
      { id: "pm_due", label: "PM work orders due", unit: "count" },
    ],
    grain: { time: "month", dimensions: ["asset", "equipment_type", "group", "service", "contract", "site", "company"] },
    aggregation: AGGREGATION_METHOD.RECOMPUTE,
    weightField: "pm_due",
    thresholds: { target: 90, warning: 85, critical: 80, direction: "higher" },
  }),

  // ── Energy & fuel ───────────────────────────────────────────────────
  createKpiDefinition({
    kpiId: "kpi.fuel_intensity",
    version: 1,
    name: "Fuel intensity",
    businessMeaning: "Litres of fuel consumed per tonne of accepted output.",
    category: KPI_CATEGORY.ENERGY_FUEL,
    type: "rate",
    unit: "litres_per_tonne",
    direction: KPI_DIRECTION.LOWER_IS_BETTER,
    formula: { op: FORMULA_OPS.DIVIDE, numerator: "fuel_consumed", denominator: "accepted_output" },
    components: [
      { id: "fuel_consumed", label: "Fuel consumed", unit: "litres" },
      { id: "accepted_output", label: "Accepted output", unit: "tonnes" },
    ],
    grain: { time: "shift", dimensions: ["asset", "equipment_type", "group", "service", "contract", "site", "company"] },
    aggregation: AGGREGATION_METHOD.RECOMPUTE,
    thresholds: { target: null, warning: null, critical: null, direction: "lower" },
  }),

  createKpiDefinition({
    kpiId: "kpi.energy_intensity",
    version: 1,
    name: "Energy intensity",
    businessMeaning: "kWh consumed per tonne of accepted output.",
    category: KPI_CATEGORY.ENERGY_FUEL,
    type: "rate",
    unit: "kilowatt_hours_per_tonne",
    direction: KPI_DIRECTION.LOWER_IS_BETTER,
    formula: { op: FORMULA_OPS.DIVIDE, numerator: "energy_consumed", denominator: "accepted_output" },
    components: [
      { id: "energy_consumed", label: "Energy consumed", unit: "kilowatt_hours" },
      { id: "accepted_output", label: "Accepted output", unit: "tonnes" },
    ],
    grain: { time: "day", dimensions: ["circuit", "process_area", "site", "company"] },
    aggregation: AGGREGATION_METHOD.RECOMPUTE,
    thresholds: { target: null, warning: null, critical: null, direction: "lower" },
  }),

  // ── Cost ────────────────────────────────────────────────────────────
  createKpiDefinition({
    kpiId: "kpi.cost_per_unit",
    version: 1,
    name: "Cost per tonne",
    businessMeaning: "Eligible operating cost per tonne of accepted output.",
    category: KPI_CATEGORY.COST,
    type: "rate",
    unit: "ZAR_per_tonne",
    direction: KPI_DIRECTION.LOWER_IS_BETTER,
    formula: { op: FORMULA_OPS.DIVIDE, numerator: "eligible_operating_cost", denominator: "accepted_output" },
    components: [
      { id: "eligible_operating_cost", label: "Eligible operating cost", unit: "ZAR" },
      { id: "accepted_output", label: "Accepted output", unit: "tonnes" },
    ],
    grain: { time: "month", dimensions: ["asset", "equipment_type", "group", "activity", "service", "contract", "site", "company"] },
    aggregation: AGGREGATION_METHOD.RECOMPUTE,
    thresholds: { target: null, warning: null, critical: null, direction: "lower" },
  }),

  // ── Downtime ────────────────────────────────────────────────────────
  createKpiDefinition({
    kpiId: "kpi.downtime_hours",
    version: 1,
    name: "Downtime hours",
    businessMeaning: "Total qualifying downtime recorded for the scope and period.",
    category: KPI_CATEGORY.TIME_UTILISATION,
    type: "input",
    unit: "hours",
    direction: KPI_DIRECTION.LOWER_IS_BETTER,
    formula: { op: FORMULA_OPS.SUM, components: ["downtime_duration"] },
    components: [
      { id: "downtime_duration", label: "Downtime duration", unit: "hours" },
    ],
    grain: { time: "shift", dimensions: ["asset", "category", "cause", "group", "activity", "service", "contract", "site", "company"] },
    aggregation: AGGREGATION_METHOD.SUM,
    thresholds: { target: null, warning: null, critical: null, direction: "lower" },
  }),

  createKpiDefinition({
    kpiId: "kpi.availability_loss_by_category",
    version: 1,
    name: "Availability loss by category",
    businessMeaning: "Total availability loss hours grouped by cause category.",
    category: KPI_CATEGORY.TIME_UTILISATION,
    type: "input",
    unit: "hours",
    direction: KPI_DIRECTION.LOWER_IS_BETTER,
    formula: { op: FORMULA_OPS.SUM, components: ["loss_duration"] },
    components: [
      { id: "loss_duration", label: "Loss duration", unit: "hours" },
    ],
    grain: { time: "month", dimensions: ["category", "subcategory", "asset", "service", "contract", "site", "company"] },
    aggregation: AGGREGATION_METHOD.SUM,
    thresholds: { target: null, warning: null, critical: null, direction: "lower" },
  }),

  // ── OEE (composite) ─────────────────────────────────────────────────
  createKpiDefinition({
    kpiId: "kpi.oee",
    version: 1,
    name: "OEE",
    businessMeaning: "Overall equipment effectiveness = Availability × Performance × Quality. Aggregate by recomputing each component at the valid boundary.",
    category: KPI_CATEGORY.PRODUCTION,
    type: "composite",
    unit: "percent",
    direction: KPI_DIRECTION.HIGHER_IS_BETTER,
    formula: { op: FORMULA_OPS.MULTIPLY, components: ["oee_availability", "oee_performance", "oee_quality"] },
    components: [
      { id: "oee_availability", label: "OEE availability", unit: "ratio" },
      { id: "oee_performance",  label: "OEE performance", unit: "ratio" },
      { id: "oee_quality",      label: "OEE quality", unit: "ratio" },
    ],
    grain: { time: "day", dimensions: ["asset", "circuit", "process_area", "site", "company"] },
    aggregation: AGGREGATION_METHOD.RECOMPUTE,
    thresholds: { target: 85, warning: 75, critical: 65, direction: "higher" },
    qualityRule: { completeness: 1, plausibility: { min: 0, max: 1 }, duplicateTolerance: 0, reconciliationRequired: true },
  }),
];

// ── Index by ID for fast lookup ───────────────────────────────────────────
export const KPI_BY_ID = Object.fromEntries(CANONICAL_KPIS.map((k) => [k.kpiId, k]));

// ── Component catalogue — every primitive measure the engine accepts ─────
export const COMPONENT_CATALOGUE = Object.freeze({
  // Time components
  scheduled_time:        { label: "Scheduled time", unit: "hours", category: "time" },
  excluded_time:         { label: "Excluded time", unit: "hours", category: "time" },
  planned_downtime:      { label: "Planned downtime", unit: "hours", category: "time" },
  available_time:        { label: "Available time", unit: "hours", category: "time" },
  operating_time:        { label: "Operating time", unit: "hours", category: "time" },
  standby_time:          { label: "Standby time", unit: "hours", category: "time" },
  utilisation_loss_time: { label: "Utilisation loss", unit: "hours", category: "time" },
  downtime_duration:     { label: "Downtime duration", unit: "hours", category: "time" },
  loss_duration:         { label: "Loss duration", unit: "hours", category: "time" },
  active_repair_time:    { label: "Active repair time", unit: "hours", category: "time" },
  wait_time:             { label: "Waiting time", unit: "hours", category: "time" },

  // Production
  accepted_output:       { label: "Accepted output", unit: "tonnes", category: "production" },
  intermediate_output:   { label: "Intermediate output", unit: "tonnes", category: "production" },
  rehandled_material:    { label: "Rehandled material", unit: "tonnes", category: "production" },
  approved_target:       { label: "Approved target", unit: "tonnes", category: "production" },
  total_output:          { label: "Total output", unit: "tonnes", category: "production" },
  good_output:           { label: "Good accepted output", unit: "tonnes", category: "production" },

  // Events
  functional_failures:   { label: "Functional failure events", unit: "count", category: "events" },
  repair_events:         { label: "Repair events", unit: "count", category: "events" },
  pm_completed_on_time:  { label: "PM work orders completed on time", unit: "count", category: "events" },
  pm_due:                { label: "PM work orders due", unit: "count", category: "events" },
  safety_incidents:      { label: "Safety incidents", unit: "count", category: "events" },

  // Energy & fuel
  fuel_consumed:         { label: "Fuel consumed", unit: "litres", category: "energy" },
  energy_consumed:       { label: "Energy consumed", unit: "kilowatt_hours", category: "energy" },

  // Cost
  eligible_operating_cost: { label: "Eligible operating cost", unit: "ZAR", category: "cost" },
  maintenance_cost:      { label: "Maintenance cost", unit: "ZAR", category: "cost" },
  revenue:               { label: "Revenue", unit: "ZAR", category: "cost" },
  direct_cost:           { label: "Direct cost", unit: "ZAR", category: "cost" },

  // OEE sub-components (already-ratios)
  oee_availability:      { label: "OEE availability", unit: "ratio", category: "oee" },
  oee_performance:       { label: "OEE performance", unit: "ratio", category: "oee" },
  oee_quality:           { label: "OEE quality", unit: "ratio", category: "oee" },

  // Quality
  product_grade:         { label: "Product grade", unit: "percent", category: "quality" },
  recovery:              { label: "Recovery", unit: "percent", category: "quality" },
});

export default {
  FORMULA_OPS,
  createKpiDefinition,
  validateKpiDefinition,
  CANONICAL_KPIS,
  KPI_BY_ID,
  COMPONENT_CATALOGUE,
  unitGroupOf,
};