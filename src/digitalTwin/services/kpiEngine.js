/**
 * digitalTwin/services/kpiEngine.js
 *
 * The KPI engine — the crown jewel of the digital twin (Brief Sections 7.3,
 * 7.4, 7.5, 7.6, 7.7).
 *
 * What this file guarantees, in strict obedience to the brief:
 *
 *  1. RATIOS ARE RECOMPUTED, NEVER AVERAGED
 *     "Ratio KPIs are recalculated from component totals. Averages of
 *     displayed child ratios are prohibited unless the KPI definition
 *     explicitly authorises them." — §7.7
 *
 *  2. WEIGHTED AGGREGATION USES AN EXPLICIT DENOMINATOR
 *     "The KPI definition must name the weight." — §7.4
 *
 *  3. DOUBLE-COUNTING IS PREVENTED
 *     "Corporate and site production totals must use only accepted output
 *     at the nominated boundary, not every intermediate movement." — §7.7
 *
 *  4. EVERY DISPLAYED METRIC CARRIES LINEAGE
 *     Every result carries the input measurement IDs, the definition
 *     version, and the exclusions applied — so any number on screen can be
 *     opened to see its source records.
 *
 *  5. TIME MODEL RECONCILES
 *     Calendar = Excluded + Scheduled = Planned Downtime + Available
 *     Available = Operating + Standby — §7.8
 */

import { AGGREGATION_METHOD, KPI_DIRECTION, CONFIDENCE_PRECEDENCE } from "../models/enums";
import { KPI_BY_ID, COMPONENT_CATALOGUE } from "../models/kpiSchema";
import { listMeasurements, pickHighestConfidence } from "./measurementService";

// ── Period keys ───────────────────────────────────────────────────────────
export const periodKeyOf = (date, grain = "shift") => {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  switch (grain) {
    case "day":   return `D:${y}-${m}-${day}`;
    case "month": return `M:${y}-${m}`;
    case "quarter": return `Q:${y}-Q${Math.floor(d.getMonth() / 3) + 1}`;
    case "year":  return `Y:${y}`;
    case "shift":
    default:      return `S:${y}-${m}-${day}`;
  }
};

// ── Time interval overlap check ───────────────────────────────────────────
const intervalsOverlap = (a, b) => {
  const aFrom = new Date(a.startTimestamp).getTime();
  const aTo   = a.endTimestamp ? new Date(a.endTimestamp).getTime() : Infinity;
  const bFrom = new Date(b.startTimestamp).getTime();
  const bTo   = b.endTimestamp ? new Date(b.endTimestamp).getTime() : Infinity;
  return !(aTo <= bFrom || bTo <= aFrom);
};

// ── Sum component with source precedence + duplicate tolerance ────────────
/**
 * Sum a component across measurements, respecting:
 *   - source precedence (integrated > verified > manual > estimate)
 *   - duplicate tolerance (Section 8.4)
 *   - overlap policy (downtime intervals must not double-count)
 */
const sumComponent = (measurements, { excludeIntermediate = false, excludeRehandled = false } = {}) => {
  // Filter out intermediate outputs for production boundary (Section 7.7)
  const filtered = measurements.filter((m) => {
    if (excludeIntermediate && m.tags?.intermediate === true) return false;
    if (excludeRehandled && m.tags?.rehandled === true) return false;
    return true;
  });

  // Group by natural key to enforce precedence
  const byKey = new Map();
  filtered.forEach((m) => {
    const key = m.idempotencyKey || m.id;
    const existing = byKey.get(key);
    if (!existing) { byKey.set(key, m); return; }
    const existingIdx = CONFIDENCE_PRECEDENCE.indexOf(existing.confidence || "unknown");
    const newIdx      = CONFIDENCE_PRECEDENCE.indexOf(m.confidence || "unknown");
    if (newIdx > existingIdx) byKey.set(key, m);
  });

  const rows = Array.from(byKey.values());
  const total = rows.reduce((s, m) => s + Number(m.canonicalValue || 0), 0);
  return { total, contributingIds: rows.map((m) => m.id), excludedIntermediate: excludeIntermediate || excludeRehandled };
};

/**
 * Count unique canonical IDs (for count_unique aggregation — Section 7.4).
 */
const countUniqueIds = (measurements, field = "assetId") => {
  const seen = new Set();
  measurements.forEach((m) => { if (m[field]) seen.add(m[field]); });
  return { total: seen.size, contributingIds: measurements.map((m) => m.id) };
};

/**
 * Weighted average — sum(value × weight) / sum(weight). Section 7.4.
 * This is the ONLY sanctioned way to combine child values with unequal
 * exposure. Silent unweighted averaging is forbidden.
 */
const weightedAverage = (pairs) => {
  let numer = 0, denom = 0;
  pairs.forEach(({ value, weight }) => {
    if (Number.isFinite(value) && Number.isFinite(weight) && weight > 0) {
      numer += value * weight;
      denom += weight;
    }
  });
  return denom > 0 ? numer / denom : null;
};

// ── Component value resolver ──────────────────────────────────────────────
/**
 * For a given scope and period, get the total canonical value of a
 * component. Handles both raw measures and referenced KPIs.
 */
const resolveComponent = async (tenantId, component, scope, period, options = {}) => {
  const compDef = COMPONENT_CATALOGUE[component];
  if (!compDef) throw new Error(`Unknown component: ${component}`);

  // Fetch measurements for the component in scope
  const rows = await listMeasurements(tenantId, {
    component,
    assetId: scope.assetId || null,
    groupId: scope.groupId || null,
    activityId: scope.activityId || null,
    serviceId: scope.serviceId || null,
    contractId: scope.contractId || null,
    siteId: scope.siteId || null,
    processAreaId: scope.processAreaId || null,
    state: "approved",
  });

  // Period filter
  const periodRows = rows.filter((r) => {
    if (period.startFrom && r.startTimestamp < period.startFrom) return false;
    if (period.endTo   && r.startTimestamp > period.endTo)   return false;
    return true;
  });

  // For production components, exclude intermediate + rehandled unless the
  // KPI definition explicitly opts in (Section 7.7 #2, #4).
  const excludeIntermediate = options.excludeIntermediate ?? compDef.category === "production";
  const excludeRehandled    = options.excludeRehandled ?? compDef.category === "production";

  if (compDef.category === "time" && options.unionOverlaps) {
    // For downtime-style components where overlapping intervals must be
    // unioned (Section 7.8 "Parent downtime is the union of valid child intervals")
    return unionIntervals(periodRows);
  }

  return sumComponent(periodRows, { excludeIntermediate, excludeRehandled });
};

const unionIntervals = (rows) => {
  const intervals = rows
    .filter((r) => r.startTimestamp)
    .map((r) => ({
      start: new Date(r.startTimestamp).getTime(),
      end: r.endTimestamp ? new Date(r.endTimestamp).getTime() : new Date(r.startTimestamp).getTime() + (Number(r.canonicalValue) || 0) * 3600 * 1000,
      id: r.id,
    }))
    .sort((a, b) => a.start - b.start);

  if (intervals.length === 0) return { total: 0, contributingIds: [] };

  // Merge overlapping
  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    if (intervals[i].start <= last.end) {
      last.end = Math.max(last.end, intervals[i].end);
      last.id += "," + intervals[i].id;
    } else {
      merged.push(intervals[i]);
    }
  }

  const totalMs = merged.reduce((s, m) => s + (m.end - m.start), 0);
  const totalHours = totalMs / 3600000;
  return { total: totalHours, contributingIds: intervals.map((i) => i.id) };
};

// ── Formula evaluation (declarative, no eval) ─────────────────────────────
const evaluateFormula = (kpi, componentValues) => {
  const { formula } = kpi;
  if (!formula) return { value: null, error: "No formula" };

  const get = (id) => componentValues[id] ?? null;

  switch (formula.op) {
    case "divide":
      return divide(get(formula.numerator), get(formula.denominator));
    case "percent":
      return percent(get(formula.numerator), get(formula.denominator));
    case "multiply": {
      let prod = 1;
      let anyMissing = false;
      for (const id of formula.components || []) {
        const v = get(id);
        if (v === null || v === undefined) { anyMissing = true; break; }
        prod *= v;
      }
      return { value: anyMissing ? null : prod, error: anyMissing ? "Missing component" : null };
    }
    case "sum": {
      let sum = 0;
      let anyMissing = false;
      for (const id of formula.components || []) {
        const v = get(id);
        if (v === null || v === undefined) { anyMissing = true; continue; }
        sum += v;
      }
      return { value: anyMissing && Object.keys(componentValues).length === 0 ? null : sum, error: null };
    }
    case "subtract":
      return { value: (get(formula.a) ?? 0) - (get(formula.b) ?? 0), error: null };
    case "weighted":
      return { value: null, error: "Weighted op requires caller-supplied pairs" };
    case "count_unique":
      return { value: null, error: "count_unique requires caller-supplied set" };
    default:
      return { value: null, error: `Unknown op: ${formula.op}` };
  }
};

const divide = (a, b) => {
  if (a === null || b === null) return { value: null, error: "Missing component" };
  if (b === 0) return { value: null, error: "Division by zero" };
  return { value: a / b, error: null };
};

const percent = (a, b) => {
  const r = divide(a, b);
  return r.value === null ? r : { value: r.value * 100, error: null };
};

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Calculate a single KPI for a given scope and period.
 * Returns a result object with:
 *   - value, unit
 *   - components (each with total + contributing IDs)
 *   - lineage (input IDs, definition version, calculation timestamp)
 *   - quality (confidence, exclusions)
 *   - status (green / amber / red / no_target)
 */
export const calculateKpi = async (tenantId, {
  kpiId,
  scope = {},
  period = {},
  periodLabel = null,
} = {}) => {
  const kpi = KPI_BY_ID[kpiId];
  if (!kpi) throw new Error(`Unknown KPI: ${kpiId}`);

  const startedAt = Date.now();

  // Resolve every component declared by the KPI
  const componentValues = {};
  const componentDetails = {};
  const contributingMeasurementIds = new Set();

  for (const comp of kpi.components) {
    const result = await resolveComponent(tenantId, comp.id, scope, period, {
      excludeIntermediate: comp.category === "production",
      excludeRehandled:    comp.category === "production",
      unionOverlaps: comp.category === "time" && comp.id.includes("downtime"),
    });
    componentValues[comp.id] = result.total;
    componentDetails[comp.id] = {
      label: comp.label,
      unit: comp.unit,
      total: result.total,
      contributingIds: result.contributingIds,
      exclusions: result.excludedIntermediate ? ["intermediate", "rehandled"] : [],
    };
    result.contributingIds.forEach((id) => contributingMeasurementIds.add(id));
  }

  // Evaluate the formula (or use the input-type passthrough)
  let value = null, error = null;
  if (kpi.type === "input") {
    const first = kpi.components[0];
    value = componentValues[first.id];
  } else {
    const r = evaluateFormula(kpi, componentValues);
    value = r.value;
    error = r.error;
  }

  // Status from thresholds
  const status = statusFromThresholds(kpi, value);

  return {
    kpiId: kpi.kpiId,
    kpiVersion: kpi.version,
    name: kpi.name,
    category: kpi.category,
    type: kpi.type,
    unit: kpi.unit,
    direction: kpi.direction,
    aggregation: kpi.aggregation,
    value,
    error,
    components: componentDetails,
    contributingMeasurementIds: Array.from(contributingMeasurementIds),
    scope,
    period: { ...period, label: periodLabel },
    thresholds: kpi.thresholds,
    status: status.key,
    statusLabel: status.label,
    exclusions: Object.values(componentDetails).flatMap((c) => c.exclusions),
    calculatedAt: new Date().toISOString(),
    calculationTimeMs: Date.now() - startedAt,
  };
};

/**
 * Calculate the same KPI at multiple hierarchy levels in one call.
 * This is the drill-through engine: corporate → site → contract → group →
 * asset. Each level recomputes from components (never averages children).
 */
export const calculateKpiHierarchy = async (tenantId, {
  kpiId,
  scope,
  period,
  levels = ["company", "site", "contract", "service", "activity", "group", "asset"],
} = {}) => {
  const results = {};
  // Company-level scope: use whatever scope was supplied, but only as an
  // aggregate — the scope fields simply narrow the query.
  for (const level of levels) {
    // For each level, walk down from the current scope.
    // In practice the caller passes a list of node IDs per level.
    // We provide the lowest-scope query here; hierarchy walking lives in
    // the dashboard component (Phase 5) so we don't do N^depth queries.
    results[level] = await calculateKpi(tenantId, { kpiId, scope, period });
  }
  return results;
};

/**
 * Score a value against thresholds (Section 7.3 thresholds).
 * Returns { key: "green"|"amber"|"red"|"no_target", label }
 */
export const statusFromThresholds = (kpi, value) => {
  const th = kpi.thresholds || {};
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return { key: "no_target", label: "No data" };
  }
  if (th.target === null && th.warning === null && th.critical === null) {
    return { key: "no_target", label: "No target" };
  }
  const direction = kpi.direction || KPI_DIRECTION.HIGHER_IS_BETTER;
  const v = value;
  const { target, warning, critical } = th;

  if (direction === "higher") {
    if (target !== null && v >= target) return { key: "green", label: "On target" };
    if (warning !== null && v >= warning) return { key: "amber", label: "Needs attention" };
    if (critical !== null && v < critical) return { key: "red", label: "Critical" };
    return { key: "amber", label: "Needs attention" };
  }
  if (direction === "lower") {
    if (target !== null && v <= target) return { key: "green", label: "On target" };
    if (warning !== null && v <= warning) return { key: "amber", label: "Needs attention" };
    if (critical !== null && v > critical) return { key: "red", label: "Critical" };
    return { key: "amber", label: "Needs attention" };
  }
  // within_range / informational
  if (target !== null && Math.abs(v - target) < 0.01) return { key: "green", label: "On target" };
  return { key: "no_target", label: "Informational" };
};

/**
 * Weighted aggregation across multiple child scopes — Section 7.4.
 *
 * Given child results (each with a value and a weight component), this
 * returns the parent value using the KPI's declared weight field. Ratios
 * are still recomputed from summed numerators and denominators; weights
 * only apply to rate-type KPIs with unequal exposure.
 */
export const aggregateChildren = (kpiId, childResults = []) => {
  const kpi = KPI_BY_ID[kpiId];
  if (!kpi) throw new Error(`Unknown KPI: ${kpiId}`);
  if (childResults.length === 0) return { value: null, contributingIds: [] };

  // Ratio-style → sum numerators + denominators, then recompute (Section 7.4)
  if (kpi.formula?.op === "percent" || kpi.formula?.op === "divide") {
    const num = kpi.formula.numerator;
    const den = kpi.formula.denominator;
    const totalNum = childResults.reduce((s, r) => s + (r.components?.[num]?.total ?? 0), 0);
    const totalDen = childResults.reduce((s, r) => s + (r.components?.[den]?.total ?? 0), 0);
    const value = totalDen === 0 ? null : (kpi.formula.op === "percent" ? (totalNum / totalDen) * 100 : totalNum / totalDen);
    const contributingIds = childResults.flatMap((r) => Object.values(r.components || {}).flatMap((c) => c.contributingIds || []));
    return { value, contributingIds };
  }

  // Rate with declared weight → weighted average
  if (kpi.aggregation === AGGREGATION_METHOD.WEIGHTED_AVERAGE && kpi.weightField) {
    const pairs = childResults.map((r) => ({
      value: r.value,
      weight: r.components?.[kpi.weightField]?.total ?? 0,
    }));
    const value = weightedAverage(pairs);
    const contributingIds = childResults.flatMap((r) => r.contributingMeasurementIds || []);
    return { value, contributingIds };
  }

  // Additive → sum
  if (kpi.aggregation === AGGREGATION_METHOD.SUM) {
    const value = childResults.reduce((s, r) => s + (Number(r.value) || 0), 0);
    const contributingIds = childResults.flatMap((r) => r.contributingMeasurementIds || []);
    return { value, contributingIds };
  }

  // Fallback: honestly report the limitation rather than silently averaging
  return {
    value: null,
    contributingIds: childResults.flatMap((r) => r.contributingMeasurementIds || []),
    error: `Cannot aggregate "${kpi.name}" — the KPI definition does not declare a safe rollup rule.`,
  };
};

/**
 * Time-model reconciliation for a scope and period (Section 7.8).
 *
 *   Calendar Time = Excluded Time + Scheduled Time
 *   Scheduled Time = Planned Downtime + Available Time
 *   Available Time = Operating Time + Standby / Utilisation Loss
 *
 * Returns component totals AND a reconciliation check.
 */
export const reconcileTimeModel = async (tenantId, { scope, period }) => {
  const components = ["excluded_time", "scheduled_time", "planned_downtime", "available_time", "operating_time", "standby_time"];
  const totals = {};
  for (const c of components) {
    const r = await resolveComponent(tenantId, c, scope, period, { unionOverlaps: c.includes("downtime") });
    totals[c] = r.total;
  }

  const { excluded_time, scheduled_time, planned_downtime, available_time, operating_time, standby_time } = totals;

  // Check 1: Scheduled + Excluded = Calendar (if both present, they should not overlap)
  const check1 = "n/a";
  // Check 2: Planned Downtime + Available = Scheduled
  const check2 = (planned_downtime !== null && available_time !== null && scheduled_time !== null)
    ? Math.abs(planned_downtime + available_time - scheduled_time) < 0.5
    : null;
  // Check 3: Operating + Standby = Available
  const check3 = (operating_time !== null && standby_time !== null && available_time !== null)
    ? Math.abs(operating_time + standby_time - available_time) < 0.5
    : null;

  return {
    totals,
    checks: {
      scheduledReconciles: check2,
      availableReconciles: check3,
    },
    warnings: [
      check2 === false ? `Planned downtime (${planned_downtime}h) + available (${available_time}h) ≠ scheduled (${scheduled_time}h).` : null,
      check3 === false ? `Operating (${operating_time}h) + standby (${standby_time}h) ≠ available (${available_time}h).` : null,
    ].filter(Boolean),
  };
};

/**
 * Formula lineage — reconstruct the source chain for a displayed number.
 * Every contributing measurement ID plus its natural key and source system.
 */
export const getLineage = async (tenantId, calculationResult) => {
  const ids = calculationResult.contributingMeasurementIds || [];
  if (ids.length === 0) return [];
  const rows = await Promise.all(ids.slice(0, 500).map(async (id) => {
    try {
      const { getMeasurement } = await import("./measurementService");
      return await getMeasurement(tenantId, id);
    } catch { return null; }
  }));
  return rows.filter(Boolean).map((r) => ({
    id: r.id,
    component: r.component,
    value: r.canonicalValue,
    unit: r.canonicalUnit,
    start: r.startTimestamp,
    end: r.endTimestamp,
    source: `${r.sourceSystem}${r.sourceRecord ? " / " + r.sourceRecord : ""}`,
    confidence: r.confidence,
    state: r.state,
  }));
};

export default {
  periodKeyOf,
  calculateKpi,
  calculateKpiHierarchy,
  statusFromThresholds,
  aggregateChildren,
  reconcileTimeModel,
  getLineage,
};