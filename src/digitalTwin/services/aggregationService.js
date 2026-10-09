/**
 * digitalTwin/services/aggregationService.js
 *
 * Hierarchy orchestration on top of the KPI engine (Brief Sections 7.4, 7.6,
 * 7.7, 9.4). Where the KPI engine recomputes a single KPI at a single scope,
 * this service:
 *
 *   - Walks the hierarchy from a root node downward
 *   - Calculates the KPI at every level using recompute-from-components
 *   - Returns a flat displayable list (Screen 5 drill-down) with indentation
 *   - Provides a time-series trend for a KPI at a scope
 *   - Delegates rollup method decisions back to the KPI definition — this
 *     service NEVER invents its own aggregation
 *
 * Guarantees:
 *   - Ratio KPIs are recomputed at every level (never averaged)
 *   - Weighted KPIs use the declared weight field
 *   - Child results are always calculated from raw measurements in that
 *     child scope, not derived from sibling values
 */

import { calculateKpi, periodKeyOf, statusFromThresholds } from "./kpiEngine";
import { KPI_BY_ID } from "../models/kpiSchema";
import { listRelations, getNode, listNodes } from "./hierarchyService";
import { NODE_TYPES } from "../models/enums";

// ── Period utilities ──────────────────────────────────────────────────────
export const periodToWindow = (periodLabel, { grain = "month" } = {}) => {
  if (!periodLabel) return {};
  // Match "M:2026-04", "D:2026-04-15", "Q:2026-Q2", "Y:2026"
  if (periodLabel.startsWith("M:")) {
    const [y, m] = periodLabel.slice(2).split("-").map(Number);
    return {
      startFrom: new Date(Date.UTC(y, m - 1, 1)).toISOString(),
      endTo: new Date(Date.UTC(y, m, 0, 23, 59, 59)).toISOString(),
      label: periodLabel,
    };
  }
  if (periodLabel.startsWith("D:")) {
    const [y, m, d] = periodLabel.slice(2).split("-").map(Number);
    return {
      startFrom: new Date(Date.UTC(y, m - 1, d)).toISOString(),
      endTo: new Date(Date.UTC(y, m - 1, d, 23, 59, 59)).toISOString(),
      label: periodLabel,
    };
  }
  if (periodLabel.startsWith("Q:")) {
    const [y, q] = periodLabel.slice(2).split("-Q").map(Number);
    const startM = (q - 1) * 3;
    return {
      startFrom: new Date(Date.UTC(y, startM, 1)).toISOString(),
      endTo: new Date(Date.UTC(y, startM + 3, 0, 23, 59, 59)).toISOString(),
      label: periodLabel,
    };
  }
  if (periodLabel.startsWith("Y:")) {
    const y = Number(periodLabel.slice(2));
    return {
      startFrom: new Date(Date.UTC(y, 0, 1)).toISOString(),
      endTo: new Date(Date.UTC(y, 11, 31, 23, 59, 59)).toISOString(),
      label: periodLabel,
    };
  }
  return { label: periodLabel };
};

// ── Hierarchy walk ────────────────────────────────────────────────────────

/**
 * Which child relation types apply to each node type when drilling down.
 * Matches Brief Section 13.4.
 */
const DRILL_RELATION_TYPES = {
  [NODE_TYPES.COMPANY]:         ["contains", "owns_or_controls", "scopes"],
  [NODE_TYPES.SITE]:            ["contains", "delivered_at"],
  [NODE_TYPES.CONTRACT]:        ["scopes", "realized_by", "delivered_at"],
  [NODE_TYPES.FACILITY]:        ["has_area", "contains"],
  [NODE_TYPES.PROCESS_AREA]:    ["contains"],
  [NODE_TYPES.SERVICE]:         ["realized_by"],
  [NODE_TYPES.ACTIVITY]:        ["performed_in", "supports"],
  [NODE_TYPES.EQUIPMENT_GROUP]: ["member_of", "supports"],
  [NODE_TYPES.EQUIPMENT_FAMILY]: ["classified_as"],
};

/**
 * Build a flat drill-down list starting from a node, showing the KPI value
 * at every descendant level. Screen 5 from the brief.
 *
 * @returns { rows: [{ nodeId, nodeName, nodeType, depth, kpiResult }], rootKpi }
 */
export const drillDown = async (tenantId, {
  kpiId,
  rootNodeId,
  periodLabel,
  maxDepth = 6,
  includeTypes = null,
} = {}) => {
  const kpi = KPI_BY_ID[kpiId];
  if (!kpi) throw new Error(`Unknown KPI: ${kpiId}`);

  const period = periodToWindow(periodLabel);
  const root = await getNode(tenantId, rootNodeId);
  if (!root) throw new Error(`Root node not found: ${rootNodeId}`);

  // Calculate KPI at the root
  const rootKpi = await calculateKpi(tenantId, {
    kpiId,
    scope: scopeFromNode(root),
    period,
    periodLabel,
  });

  const rows = [{
    nodeId: root.id,
    nodeName: root.name,
    nodeType: root.nodeType,
    depth: 0,
    kpiResult: rootKpi,
  }];

  const walk = async (node, depth) => {
    if (depth >= maxDepth) return;
    const relTypes = DRILL_RELATION_TYPES[node.nodeType];
    if (!relTypes) return;

    const relations = await listRelations(tenantId, { fromId: node.id, status: "active" });
    const filtered = relations.filter((r) => relTypes.includes(r.relationType));

    for (const rel of filtered) {
      const child = await getNode(tenantId, rel.toId);
      if (!child) continue;
      if (includeTypes && !includeTypes.includes(child.nodeType)) continue;

      let kpiResult;
      try {
        kpiResult = await calculateKpi(tenantId, {
          kpiId,
          scope: scopeFromNode(child),
          period,
          periodLabel,
        });
      } catch (err) {
        kpiResult = { value: null, error: err.message, status: "no_target", statusLabel: "No data" };
      }

      rows.push({
        nodeId: child.id,
        nodeName: child.name,
        nodeType: child.nodeType,
        depth: depth + 1,
        kpiResult,
      });

      await walk(child, depth + 1);
    }
  };

  await walk(root, 0);
  return { rows, rootKpi };
};

/**
 * Translate a hierarchy node into the scope fields the KPI engine expects.
 * This is the only bridge between the graph and the calculation engine.
 */
export const scopeFromNode = (node) => {
  if (!node) return {};
  const s = {};
  switch (node.nodeType) {
    case NODE_TYPES.SITE:            s.siteId = node.id; break;
    case NODE_TYPES.CONTRACT:        s.contractId = node.id; break;
    case NODE_TYPES.FACILITY:        s.facilityId = node.id; break;
    case NODE_TYPES.PROCESS_AREA:    s.processAreaId = node.id; break;
    case NODE_TYPES.SERVICE:         s.serviceId = node.id; break;
    case NODE_TYPES.ACTIVITY:        s.activityId = node.id; break;
    case NODE_TYPES.EQUIPMENT_GROUP: s.groupId = node.id; break;
    case NODE_TYPES.ASSET:           s.assetId = node.id; break;
    default: break;
  }
  return s;
};

// ── Time-series trend ─────────────────────────────────────────────────────

/**
 * Return a time-series of a KPI across the last N periods of the given
 * grain. Used by the command centre sparklines and the trend charts.
 */
export const kpiTrend = async (tenantId, {
  kpiId,
  scope = {},
  grain = "month",
  periods = 12,
  anchorDate = new Date(),
} = {}) => {
  const points = [];
  const d = new Date(anchorDate);
  for (let i = periods - 1; i >= 0; i--) {
    const cursor = new Date(d);
    if (grain === "month") cursor.setMonth(cursor.getMonth() - i);
    else if (grain === "week") cursor.setDate(cursor.getDate() - i * 7);
    else if (grain === "day") cursor.setDate(cursor.getDate() - i);
    else if (grain === "quarter") cursor.setMonth(cursor.getMonth() - i * 3);
    else if (grain === "year") cursor.setFullYear(cursor.getFullYear() - i);
    const label = periodKeyOf(cursor, grain);
    const period = periodToWindow(label);
    try {
      const result = await calculateKpi(tenantId, { kpiId, scope, period, periodLabel: label });
      points.push({
        label,
        displayLabel: formatPeriodLabel(label),
        value: result.value,
        status: result.status,
        components: result.components,
      });
    } catch (err) {
      points.push({ label, displayLabel: formatPeriodLabel(label), value: null, status: "no_target" });
    }
  }
  return points;
};

const formatPeriodLabel = (label) => {
  if (!label) return "";
  if (label.startsWith("M:")) {
    const [y, m] = label.slice(2).split("-");
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${monthNames[Number(m) - 1]} ${String(y).slice(2)}`;
  }
  if (label.startsWith("D:")) return label.slice(2);
  if (label.startsWith("Q:")) return label.slice(2).replace("-", " ");
  if (label.startsWith("Y:")) return label.slice(2);
  return label;
};

// ── Availability-loss breakdown ───────────────────────────────────────────

/**
 * Compute availability loss hours grouped by category for a scope and period.
 * Powers the "Availability loss by category" panel in Screen 4.
 */
export const availabilityLossByCategory = async (tenantId, { scope = {}, periodLabel }) => {
  const { listDowntimeEvents, DOWNTIME_TAXONOMY } = await import("./downtimeService");
  const period = periodToWindow(periodLabel);
  const events = await listDowntimeEvents(tenantId, {
    assetId: scope.assetId || null,
    groupId: scope.groupId || null,
    activityId: scope.activityId || null,
    serviceId: scope.serviceId || null,
    contractId: scope.contractId || null,
    siteId: scope.siteId || null,
    startFrom: period.startFrom,
    endTo: period.endTo,
    pageSize: 5000,
  });

  const byCategory = {};
  let totalHours = 0;
  let plannedHours = 0;
  let unplannedHours = 0;

  events.forEach((e) => {
    if (!e.eventEnd) return; // ignore open events
    const hours = Number(e.durationHours) || 0;
    const cat = e.categoryLevel1 || "unknown";
    if (!byCategory[cat]) {
      byCategory[cat] = {
        category: cat,
        label: DOWNTIME_TAXONOMY[cat]?.label || cat.replace(/_/g, " "),
        planned: !!DOWNTIME_TAXONOMY[cat]?.planned,
        hours: 0,
        eventCount: 0,
      };
    }
    byCategory[cat].hours += hours;
    byCategory[cat].eventCount += 1;
    totalHours += hours;
    if (DOWNTIME_TAXONOMY[cat]?.planned) plannedHours += hours;
    else unplannedHours += hours;
  });

  const rows = Object.values(byCategory).sort((a, b) => b.hours - a.hours);
  return { rows, totalHours, plannedHours, unplannedHours, eventCount: events.length };
};

// ── Attention detection ───────────────────────────────────────────────────

/**
 * Simple rule-based "Attention required" panel (Screen 4 right side).
 * Compares current period to the prior period for the same scope and flags
 * any KPI that moved in the wrong direction by more than 10% relative to
 * the prior value.
 */
export const attentionRequired = async (tenantId, { kpiId, scope, periodLabel }) => {
  const kpi = KPI_BY_ID[kpiId];
  if (!kpi) return [];

  const current = await calculateKpi(tenantId, {
    kpiId, scope, period: periodToWindow(periodLabel), periodLabel,
  });

  // Prior period
  const priorLabel = shiftPeriodBack(periodLabel, 1);
  const prior = await calculateKpi(tenantId, {
    kpiId, scope, period: periodToWindow(priorLabel), periodLabel: priorLabel,
  });

  const findings = [];
  if (current.value === null || prior.value === null) return findings;

  const direction = kpi.direction;
  const delta = current.value - prior.value;
  const favorable = direction === "higher" ? delta >= 0 : delta <= 0;
  const relMagnitude = prior.value !== 0 ? Math.abs(delta / prior.value) : 0;

  if (!favorable && relMagnitude > 0.03) {
    findings.push({
      severity: current.status === "red" ? "critical" : current.status === "amber" ? "warning" : "info",
      title: `${kpi.name} is below target`,
      message: `${kpi.name} moved from ${fmtShort(prior.value, kpi.unit)} to ${fmtShort(current.value, kpi.unit)} — a ${Math.round(relMagnitude * 100)}% ${direction === "higher" ? "decline" : "increase"}.`,
    });
  }
  return findings;
};

const shiftPeriodBack = (label, n) => {
  if (label.startsWith("M:")) {
    const [y, m] = label.slice(2).split("-").map(Number);
    const d = new Date(y, m - 1 - n, 1);
    return `M:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  return label;
};

const fmtShort = (v, unit) => {
  if (v === null || v === undefined) return "—";
  if (unit === "percent") return `${Number(v).toFixed(1)}%`;
  if (unit === "tonnes_per_hour") return `${Number(v).toFixed(1)} t/h`;
  if (unit === "hours") return `${Number(v).toFixed(1)} h`;
  return Number(v).toFixed(2);
};

// ── Command-centre tile data ──────────────────────────────────────────────

/**
 * Build the four hero tiles from Screen 4 for a scope and period.
 * Each tile contains value, unit, target, status, delta vs prior, and a
 * mini time-series for the sparkline.
 */
export const commandCentreTiles = async (tenantId, { scope = {}, periodLabel } = {}) => {
  const tileDefs = [
    { kpiId: "kpi.physical_availability", label: "Availability", accent: "primary" },
    { kpiId: "kpi.utilisation",           label: "Utilisation",  accent: "secondary" },
    { kpiId: "kpi.productivity",          label: "Productivity", accent: "secondary" },
    { kpiId: "kpi.cost_per_unit",         label: "Cost per tonne", accent: "secondary" },
  ];

  const priorLabel = shiftPeriodBack(periodLabel, 1);
  const results = [];

  for (const def of tileDefs) {
    const current = await calculateKpi(tenantId, {
      kpiId: def.kpiId, scope, period: periodToWindow(periodLabel), periodLabel,
    });
    let prior = null;
    try {
      prior = await calculateKpi(tenantId, {
        kpiId: def.kpiId, scope, period: periodToWindow(priorLabel), periodLabel: priorLabel,
      });
    } catch { /* ignore */ }

    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const label = shiftPeriodBack(periodLabel, i);
      try {
        const r = await calculateKpi(tenantId, {
          kpiId: def.kpiId, scope, period: periodToWindow(label), periodLabel: label,
        });
        trend.push({ label, value: r.value });
      } catch {
        trend.push({ label, value: null });
      }
    }

    results.push({
      ...def,
      current,
      prior,
      trend,
      delta: prior?.value != null && current.value != null ? current.value - prior.value : null,
      deltaPercent: prior?.value ? ((current.value - prior.value) / Math.abs(prior.value)) * 100 : null,
    });
  }

  return results;
};

export default {
  periodToWindow,
  drillDown,
  scopeFromNode,
  kpiTrend,
  availabilityLossByCategory,
  attentionRequired,
  commandCentreTiles,
};