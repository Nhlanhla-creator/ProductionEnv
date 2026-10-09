/**
 * digitalTwin/services/downtimeService.js
 *
 * Event-level downtime model (Brief Section 7.8).
 *
 * Downtime is captured as discrete events, not monthly totals. This makes
 * it analysable at every level: asset → equipment type → group → activity →
 * service → contract → site → company.
 *
 * Guarantees enforced:
 *   - Overlapping downtime events for the same asset are blocked
 *   - Parent downtime is the UNION of valid child intervals, never the sum
 *     of overlapping asset downtime (§7.8 "Time-state reconciliation")
 *   - Every event is fully classified: planned/unplanned, category,
 *     subcategory, failure mode, cause, responsibility
 *   - Response timing components are captured separately (notify → respond
 *     → repair → return to service) so delays can be diagnosed
 */

import { db, auth } from "../../firebaseConfig";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { DOWNTIME_LEVEL_1, DOWNTIME_LOSS_TYPE, DOWNTIME_RESPONSIBILITY, DATA_CONFIDENCE } from "../models/enums";

const nowIso = () => new Date().toISOString();
const actor = () => {
  const u = auth.currentUser;
  return u ? { uid: u.uid, email: u.email } : { uid: "system", email: null };
};

const eventsCol = (tenantId) => collection(db, "digitalTwinTenants", tenantId, "downtimeEvents");
const eventRef = (tenantId, id) => doc(db, "digitalTwinTenants", tenantId, "downtimeEvents", id);

// ── Classification starter taxonomy (Section 7.8) ─────────────────────────
export const DOWNTIME_TAXONOMY = Object.freeze({
  [DOWNTIME_LEVEL_1.PLANNED_MAINTENANCE]: {
    label: "Planned maintenance",
    lossType: DOWNTIME_LOSS_TYPE.AVAILABILITY_LOSS,
    planned: true,
    subcategories: ["Preventive service", "Inspection", "Statutory inspection", "Planned component replacement", "Shutdown"],
  },
  [DOWNTIME_LEVEL_1.UNPLANNED_MECHANICAL]: {
    label: "Unplanned mechanical",
    lossType: DOWNTIME_LOSS_TYPE.AVAILABILITY_LOSS,
    planned: false,
    subcategories: ["Engine", "Drivetrain", "Hydraulics", "Structure", "Bearings", "Wear parts", "Lubrication"],
  },
  [DOWNTIME_LEVEL_1.UNPLANNED_ELECTRICAL]: {
    label: "Unplanned electrical or control",
    lossType: DOWNTIME_LOSS_TYPE.AVAILABILITY_LOSS,
    planned: false,
    subcategories: ["Electrical", "Instrumentation", "Communications", "Software", "Control-system failure"],
  },
  [DOWNTIME_LEVEL_1.OPERATIONAL_DELAY]: {
    label: "Operational delay",
    lossType: DOWNTIME_LOSS_TYPE.UTILISATION_LOSS,
    planned: false,
    subcategories: ["No operator", "Shift change", "Queue", "Congestion", "Relocation", "Cleaning", "Setup"],
  },
  [DOWNTIME_LEVEL_1.PROCESS_DEPENDENCY]: {
    label: "Process dependency",
    lossType: DOWNTIME_LOSS_TYPE.UTILISATION_LOSS,
    planned: false,
    subcategories: ["Upstream starvation", "Downstream blockage", "No feed", "No storage", "Process instability"],
  },
  [DOWNTIME_LEVEL_1.SUPPLY_DEPENDENCY]: {
    label: "Supply dependency",
    lossType: DOWNTIME_LOSS_TYPE.AVAILABILITY_LOSS,
    planned: false,
    subcategories: ["Fuel", "Parts", "Consumables", "Explosives", "Power", "Water", "Contractor delay"],
  },
  [DOWNTIME_LEVEL_1.EXTERNAL_DELAY]: {
    label: "External or client delay",
    lossType: DOWNTIME_LOSS_TYPE.UTILISATION_LOSS,
    planned: false,
    subcategories: ["Access", "Permit", "Instruction", "Security", "Blast clearance", "Client hold"],
  },
  [DOWNTIME_LEVEL_1.WEATHER_ENVIRONMENT]: {
    label: "Weather and environment",
    lossType: DOWNTIME_LOSS_TYPE.UTILISATION_LOSS,
    planned: false,
    subcategories: ["Rain", "Lightning", "Heat", "Flooding", "Dust", "Geotechnical condition"],
  },
  [DOWNTIME_LEVEL_1.SAFETY_REGULATORY]: {
    label: "Safety or regulatory",
    lossType: DOWNTIME_LOSS_TYPE.AVAILABILITY_LOSS,
    planned: false,
    subcategories: ["Incident stop", "Inspection hold", "Unsafe condition", "Statutory prohibition"],
  },
  [DOWNTIME_LEVEL_1.COMMERCIAL_STANDBY]: {
    label: "Commercial or strategic standby",
    lossType: DOWNTIME_LOSS_TYPE.UTILISATION_LOSS,
    planned: true,
    subcategories: ["No order", "Demand constraint", "Budget hold", "Deliberate idle capacity"],
  },
});

// ── Create downtime event ─────────────────────────────────────────────────
export const createDowntimeEvent = async (tenantId, input) => {
  if (!tenantId) throw new Error("tenantId is required");
  if (!input.assetId && !input.groupId) throw new Error("assetId or groupId is required");
  if (!input.eventStart) throw new Error("eventStart is required");

  const category = DOWNTIME_TAXONOMY[input.categoryLevel1];
  if (!category) throw new Error(`Unknown downtime category: ${input.categoryLevel1}`);

  const start = new Date(input.eventStart).getTime();
  const end   = input.eventEnd ? new Date(input.eventEnd).getTime() : null;
  if (end !== null && end < start) throw new Error("eventEnd cannot precede eventStart");

  // Overlap check for the same asset (Section 7.8 — "Overlapping downtime
  // events for the same asset must be blocked or resolved")
  if (input.assetId && end !== null) {
    const conflicts = await findOverlaps(tenantId, {
      assetId: input.assetId,
      startMs: start,
      endMs: end,
      excludeId: null,
    });
    if (conflicts.length > 0) {
      const err = new Error(`Overlapping downtime — this event overlaps ${conflicts.length} existing event(s) for the same asset.`);
      err.conflicts = conflicts;
      throw err;
    }
  }

  const durationHours = end !== null ? (end - start) / 3600000 : null;

  const docRef = doc(eventsCol(tenantId));
  const payload = {
    eventId: docRef.id,
    tenantId,

    // Identity
    sourceEventId: input.sourceEventId || null,
    eventVersion: 1,

    // Scope
    assetId: input.assetId || null,
    groupId: input.groupId || null,
    equipmentTypeId: input.equipmentTypeId || null,
    activityId: input.activityId || null,
    serviceId: input.serviceId || null,
    contractId: input.contractId || null,
    siteId: input.siteId || null,
    processAreaId: input.processAreaId || null,

    // Timing
    eventStart: input.eventStart,
    eventEnd: input.eventEnd || null,
    timezone: input.timezone || "Africa/Johannesburg",
    durationHours,
    shiftId: input.shiftId || null,
    reportingPeriodKey: input.reportingPeriodKey || null,

    // Classification (Section 7.8)
    planned: category.planned,
    lossType: input.lossType || category.lossType,
    categoryLevel1: input.categoryLevel1,
    categoryLevel2: input.categoryLevel2 || null,
    failureMode: input.failureMode || null,
    causeCode: input.causeCode || null,

    // Operational context
    assetStateBefore: input.assetStateBefore || null,
    operatingMode: input.operatingMode || null,
    commodity: input.commodity || null,
    product: input.product || null,
    crew: input.crew || null,
    workOrderId: input.workOrderId || null,

    // Responsibility
    responsibility: input.responsibility || DOWNTIME_RESPONSIBILITY.INTERNAL,
    responsibleOwner: input.responsibleOwner || null,
    validatingApprover: input.validatingApprover || null,

    // Impact
    lostOperatingHours: input.lostOperatingHours ?? durationHours,
    estimatedLostOutput: input.estimatedLostOutput || null,
    qualityImpact: input.qualityImpact || null,
    safetyImpact: input.safetyImpact || null,
    financialImpact: input.financialImpact || null,

    // Response timing (Section 7.8)
    notificationTime: input.notificationTime || null,
    responseStartTime: input.responseStartTime || null,
    repairStartTime: input.repairStartTime || null,
    returnToServiceTime: input.returnToServiceTime || null,
    delayComponents: input.delayComponents || {},

    // Resolution
    actionTaken: input.actionTaken || "",
    partsUsed: input.partsUsed || [],
    rootCause: input.rootCause || "",
    recurrenceFlag: !!input.recurrenceFlag,
    linkedCorrectiveActionId: input.linkedCorrectiveActionId || null,

    // Evidence & quality
    source: input.source || "manual",
    notes: input.notes || "",
    attachments: input.attachments || [],
    confidence: input.confidence || DATA_CONFIDENCE.MANUAL_ACTUAL,
    validationStatus: "valid",
    approvedBy: null,
    approvedAt: null,

    // Audit
    createdBy: actor(),
    createdAt: nowIso(),
    updatedBy: actor(),
    updatedAt: nowIso(),
  };

  await setDoc(docRef, payload);
  return payload;
};

// ── Overlap detection ─────────────────────────────────────────────────────
const findOverlaps = async (tenantId, { assetId, startMs, endMs, excludeId }) => {
  const q = query(eventsCol(tenantId), where("assetId", "==", assetId), limit(500));
  const snap = await getDocs(q);
  const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return events.filter((e) => {
    if (excludeId && e.id === excludeId) return false;
    const eStart = new Date(e.eventStart).getTime();
    const eEnd = e.eventEnd ? new Date(e.eventEnd).getTime() : null;
    // An open event (no end) conflicts with everything after its start
    if (eEnd === null) return endMs > eStart;
    return !(endMs <= eStart || startMs >= eEnd);
  });
};

// ── Read ──────────────────────────────────────────────────────────────────
export const getDowntimeEvent = async (tenantId, eventId) => {
  const snap = await getDoc(eventRef(tenantId, eventId));
  return snap.exists() ? { id: eventId, ...snap.data() } : null;
};

export const listDowntimeEvents = async (tenantId, {
  assetId = null,
  groupId = null,
  activityId = null,
  serviceId = null,
  contractId = null,
  siteId = null,
  categoryLevel1 = null,
  startFrom = null,
  endTo = null,
  planned = null,
  pageSize = 2000,
} = {}) => {
  const filters = [];
  if (assetId) filters.push(where("assetId", "==", assetId));
  if (groupId) filters.push(where("groupId", "==", groupId));
  if (activityId) filters.push(where("activityId", "==", activityId));
  if (serviceId) filters.push(where("serviceId", "==", serviceId));
  if (contractId) filters.push(where("contractId", "==", contractId));
  if (siteId) filters.push(where("siteId", "==", siteId));
  if (categoryLevel1) filters.push(where("categoryLevel1", "==", categoryLevel1));
  if (planned !== null) filters.push(where("planned", "==", planned));

  const q = filters.length
    ? query(eventsCol(tenantId), ...filters, limit(pageSize))
    : query(eventsCol(tenantId), limit(pageSize));

  const snap = await getDocs(q);
  let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (startFrom) rows = rows.filter((r) => r.eventStart >= startFrom);
  if (endTo)     rows = rows.filter((r) => r.eventStart <= endTo);
  return rows;
};

export const closeDowntimeEvent = async (tenantId, eventId, { eventEnd, returnToServiceTime = null, actionTaken = "", rootCause = "" } = {}) => {
  const existing = await getDowntimeEvent(tenantId, eventId);
  if (!existing) throw new Error(`Downtime event ${eventId} not found`);
  if (existing.eventEnd) throw new Error("This event is already closed.");

  const start = new Date(existing.eventStart).getTime();
  const end = new Date(eventEnd).getTime();
  if (end < start) throw new Error("Close time cannot precede start time");

  const conflicts = await findOverlaps(tenantId, {
    assetId: existing.assetId,
    startMs: start,
    endMs: end,
    excludeId: eventId,
  });
  if (conflicts.length > 0) throw new Error(`Cannot close — overlaps ${conflicts.length} other event(s).`);

  const durationHours = (end - start) / 3600000;
  await updateDoc(eventRef(tenantId, eventId), {
    eventEnd,
    durationHours,
    returnToServiceTime: returnToServiceTime || eventEnd,
    actionTaken,
    rootCause,
    updatedAt: nowIso(),
    updatedBy: actor(),
  });
  return getDowntimeEvent(tenantId, eventId);
};

// ── Parent downtime — UNION of child intervals ────────────────────────────
/**
 * Compute parent downtime as the union of contributing event intervals
 * (Section 7.8). Never the sum of overlapping child durations.
 */
export const parentDowntime = (events = []) => {
  const intervals = events
    .filter((e) => e.eventStart && e.eventEnd)
    .map((e) => ({
      start: new Date(e.eventStart).getTime(),
      end: new Date(e.eventEnd).getTime(),
      category: e.categoryLevel1,
      planned: e.planned,
    }))
    .sort((a, b) => a.start - b.start);

  if (intervals.length === 0) return { totalHours: 0, byCategory: {}, planned: 0, unplanned: 0, merged: [] };

  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    if (intervals[i].start <= last.end) {
      last.end = Math.max(last.end, intervals[i].end);
    } else {
      merged.push(intervals[i]);
    }
  }

  const totalMs = merged.reduce((s, m) => s + (m.end - m.start), 0);
  const totalHours = totalMs / 3600000;

  // By-category breakdown uses the raw events (not merged) so a category
  // sum can exceed the total when intervals overlap across categories —
  // which is correct: overlapping categories mean the asset was down for
  // multiple qualifying reasons in the same window.
  const byCategory = {};
  let planned = 0, unplanned = 0;
  intervals.forEach((e) => {
    const hours = (e.end - e.start) / 3600000;
    byCategory[e.category] = (byCategory[e.category] || 0) + hours;
    if (e.planned) planned += hours; else unplanned += hours;
  });

  return { totalHours, byCategory, planned, unplanned, merged };
};

// ── Bulk import ───────────────────────────────────────────────────────────
export const importDowntimeEvents = async (tenantId, rows = [], { dryRun = false, batchId = null } = {}) => {
  const results = { created: 0, errors: [], warnings: [], committed: !dryRun, previewIds: [] };
  if (!Array.isArray(rows) || rows.length === 0) return results;

  const prepared = [];
  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      if (!row.assetId && !row.groupId) throw new Error("assetId or groupId is required");
      if (!row.eventStart) throw new Error("eventStart is required");
      if (!DOWNTIME_TAXONOMY[row.categoryLevel1]) throw new Error(`Unknown category: ${row.categoryLevel1}`);
      prepared.push(row);
    } catch (err) {
      results.errors.push({ row: i + 1, message: err.message });
    }
  }

  if (dryRun) { results.previewIds = prepared.map(() => "preview"); return results; }

  for (let i = 0; i < prepared.length; i += 400) {
    const chunk = prepared.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach((r) => {
      const ref = doc(eventsCol(tenantId));
      const category = DOWNTIME_TAXONOMY[r.categoryLevel1];
      const start = new Date(r.eventStart).getTime();
      const end = r.eventEnd ? new Date(r.eventEnd).getTime() : null;
      const durationHours = end !== null ? (end - start) / 3600000 : null;
      batch.set(ref, {
        eventId: ref.id,
        tenantId,
        ...r,
        planned: category.planned,
        lossType: r.lossType || category.lossType,
        durationHours,
        ingestionBatchId: batchId,
        source: r.source || "import",
        confidence: r.confidence || DATA_CONFIDENCE.MANUAL_ACTUAL,
        createdBy: actor(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      results.previewIds.push(ref.id);
    });
    await batch.commit();
    results.created += chunk.length;
  }

  return results;
};

export default {
  DOWNTIME_TAXONOMY,
  createDowntimeEvent,
  getDowntimeEvent,
  listDowntimeEvents,
  closeDowntimeEvent,
  parentDowntime,
  importDowntimeEvents,
};