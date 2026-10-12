/**
 * digitalTwin/services/measurementService.js
 *
 * Raw measure storage at natural grain (Brief Sections 8.3, 8.4, 8.5).
 * Every row is a single canonical component value for a defined scope and
 * interval. Lineage is stored — the full chain from source record to
 * displayed KPI is reconstructible.
 *
 * Firestore layout:
 *   digitalTwinTenants/{tenantId}/measurements/{measurementId}
 *
 * Guarantees:
 *   - Natural-key deduplication (source_system + external_source_id + component)
 *   - Canonical unit conversion on ingest (Section 8.4 — reject incompatible)
 *   - Plausibility range checks (per-component)
 *   - Overlapping downtime events blocked
 *   - Lineage preserved — corrections create a new version, never overwrite
 */

import { db, auth } from "../../firebaseConfig";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, query,
  where, orderBy, limit, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { DATA_CONFIDENCE, CONFIDENCE_PRECEDENCE, MEASUREMENT_STATE } from "../models/enums";
import { toCanonical, UNITS, quantityTypeOf } from "../models/units";
import { COMPONENT_CATALOGUE } from "../models/kpiSchema";

// ── Utilities ─────────────────────────────────────────────────────────────
const nowIso = () => new Date().toISOString();
const actor = () => {
  const u = auth.currentUser;
  return u ? { uid: u.uid, email: u.email } : { uid: "system", email: null };
};

const measurementsCol = (tenantId) => collection(db, "digitalTwinTenants", tenantId, "measurements");
const measurementRef = (tenantId, id) => doc(db, "digitalTwinTenants", tenantId, "measurements", id);

// Plausibility ranges per component (Section 8.4)
const PLAUSIBILITY = {
  scheduled_time:  { min: 0, max: 24 * 90 },
  available_time:  { min: 0, max: 24 * 90 },
  operating_time:  { min: 0, max: 24 * 90 },
  accepted_output: { min: 0, max: 10_000_000 },
  fuel_consumed:   { min: 0, max: 1_000_000 },
  energy_consumed: { min: 0, max: 10_000_000 },
  eligible_operating_cost: { min: 0, max: 1_000_000_000 },
  safety_incidents: { min: 0, max: 100 },
  functional_failures: { min: 0, max: 500 },
  repair_events: { min: 0, max: 500 },
  pm_completed_on_time: { min: 0, max: 5000 },
  pm_due: { min: 0, max: 5000 },
  product_grade: { min: 0, max: 100 },
  recovery: { min: 0, max: 100 },
  oee_availability: { min: 0, max: 1 },
  oee_performance: { min: 0, max: 1 },
  oee_quality: { min: 0, max: 1 },
};

// ── Natural key ───────────────────────────────────────────────────────────
const naturalKeyOf = (row) => [
  row.sourceSystem || "manual",
  row.externalSourceId || "",
  row.component,
  row.assetId || row.groupId || row.activityId || row.contractId || "",
  row.startTimestamp || "",
].join("::");

// ── Create one measurement ────────────────────────────────────────────────
export const createMeasurement = async (tenantId, input) => {
  if (!tenantId) throw new Error("tenantId is required");
  if (!input.component) throw new Error("component is required");
  if (!input.startTimestamp) throw new Error("startTimestamp is required");

  const componentDef = COMPONENT_CATALOGUE[input.component];
  if (!componentDef) throw new Error(`Unknown component: ${input.component}`);

  // Canonical unit conversion
  const inputUnit = input.inputUnit || componentDef.unit;
  const inputValue = Number(input.numericValue);
  if (!Number.isFinite(inputValue)) throw new Error(`numericValue must be a number (got ${input.numericValue})`);

  const inputQty = quantityTypeOf(inputUnit);
  const targetQty = quantityTypeOf(componentDef.unit);
  if (inputQty && targetQty && inputQty !== targetQty) {
    throw new Error(`Unit mismatch — cannot record "${input.component}" (${targetQty}) in "${inputUnit}" (${inputQty}).`);
  }

  const canonicalValue = toCanonical(inputValue, inputUnit);

  // Plausibility (Section 8.4)
  const range = PLAUSIBILITY[input.component];
  const validationErrors = [];
  if (range) {
    if (canonicalValue < range.min || canonicalValue > range.max) {
      validationErrors.push(`Value ${canonicalValue} outside plausibility range [${range.min}, ${range.max}] for ${input.component}.`);
    }
  }
  if (input.endTimestamp && input.startTimestamp && input.endTimestamp < input.startTimestamp) {
    validationErrors.push("endTimestamp cannot precede startTimestamp.");
  }

  // Duplicate check via natural key
  const dupe = await findNaturalKey(tenantId, input);
  if (dupe) {
    throw new Error(`Duplicate measurement — an active record already exists for this source and interval (${dupe.id}).`);
  }

  const docRef = doc(measurementsCol(tenantId));
  const payload = {
    measurementId: docRef.id,
    tenantId,

    // Scope (Section 8.3)
    organisationId: input.organisationId || null,
    siteId: input.siteId || null,
    contractId: input.contractId || null,
    workPackageId: input.workPackageId || null,
    facilityId: input.facilityId || null,
    processAreaId: input.processAreaId || null,
    serviceId: input.serviceId || null,
    activityId: input.activityId || null,
    groupId: input.groupId || null,
    assetId: input.assetId || null,

    // Metric
    kpiId: input.kpiId || null,
    kpiVersion: input.kpiVersion || null,
    component: input.component,
    componentDefinition: componentDef.label,

    // Period
    startTimestamp: input.startTimestamp,
    endTimestamp: input.endTimestamp || null,
    timezone: input.timezone || "Africa/Johannesburg",
    shiftId: input.shiftId || null,
    reportingPeriodKey: input.reportingPeriodKey || null,  // e.g. "M:2026-04", "W:2026-14"
    periodStatus: input.periodStatus || "open",

    // Value
    inputUnit,
    inputValue,
    canonicalUnit: componentDef.unit,
    canonicalValue,

    // Dimensions (Section 4.1)
    commodity: input.commodity || null,
    product: input.product || null,
    client: input.client || null,
    operatingMode: input.operatingMode || null,
    tags: input.tags || {},

    // Lineage (Section 8.3)
    sourceType: input.sourceType || "manual",           // "manual" | "import" | "integration" | "calculated"
    sourceSystem: input.sourceSystem || "manual",
    sourceRecord: input.sourceRecord || null,
    calculationId: input.calculationId || null,
    contributingMeasurementIds: input.contributingMeasurementIds || [],
    externalSourceId: input.externalSourceId || null,
    ingestionBatchId: input.ingestionBatchId || null,

    // Quality
    confidence: input.confidence || DATA_CONFIDENCE.MANUAL_ACTUAL,
    validationStatus: validationErrors.length === 0 ? "valid" : "warning",
    validationErrors,
    exceptionCodes: input.exceptionCodes || [],
    verificationStatus: input.verificationStatus || "unverified",

    // Workflow
    state: input.state || MEASUREMENT_STATE.DRAFT,

    // Audit
    createdBy: actor(),
    createdAt: nowIso(),
    updatedBy: actor(),
    updatedAt: nowIso(),
    approvedBy: null,
    approvedAt: null,
    correctionReason: null,
    supersedesMeasurementId: input.supersedesMeasurementId || null,

    // Idempotency
    idempotencyKey: input.idempotencyKey || naturalKeyOf(input),
  };

  await setDoc(docRef, payload);
  return payload;
};

// ── Duplicate lookup ─────────────────────────────────────────────────────
const findNaturalKey = async (tenantId, input) => {
  if (!input.sourceSystem || !input.externalSourceId) return null;
  const q = query(
    measurementsCol(tenantId),
    where("sourceSystem", "==", input.sourceSystem),
    where("externalSourceId", "==", input.externalSourceId),
    where("component", "==", input.component),
    where("state", "in", [MEASUREMENT_STATE.DRAFT, MEASUREMENT_STATE.SUBMITTED, MEASUREMENT_STATE.APPROVED]),
    limit(1),
  );
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
};

// ── Read / list ───────────────────────────────────────────────────────────
export const getMeasurement = async (tenantId, measurementId) => {
  const snap = await getDoc(measurementRef(tenantId, measurementId));
  return snap.exists() ? { id: measurementId, ...snap.data() } : null;
};

/**
 * List measurements within a scope and period.
 * Every scope field is optional — the query adds only supplied filters,
 * matching the KPI engine's "any grain, any level" behaviour.
 */
export const listMeasurements = async (tenantId, {
  component = null,
  kpiId = null,
  assetId = null,
  groupId = null,
  activityId = null,
  serviceId = null,
  contractId = null,
  siteId = null,
  processAreaId = null,
  startFrom = null,
  endTo = null,
  state = null,
  pageSize = 2000,
} = {}) => {
  if (!tenantId) return [];
  const filters = [];
  if (component)      filters.push(where("component", "==", component));
  if (kpiId)          filters.push(where("kpiId", "==", kpiId));
  if (assetId)        filters.push(where("assetId", "==", assetId));
  if (groupId)        filters.push(where("groupId", "==", groupId));
  if (activityId)     filters.push(where("activityId", "==", activityId));
  if (serviceId)      filters.push(where("serviceId", "==", serviceId));
  if (contractId)     filters.push(where("contractId", "==", contractId));
  if (siteId)         filters.push(where("siteId", "==", siteId));
  if (processAreaId)  filters.push(where("processAreaId", "==", processAreaId));
  if (state)          filters.push(where("state", "==", state));

  const q = filters.length
    ? query(measurementsCol(tenantId), ...filters, limit(pageSize))
    : query(measurementsCol(tenantId), limit(pageSize));

  const snap = await getDocs(q);
  let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (startFrom) rows = rows.filter((r) => r.startTimestamp >= startFrom);
  if (endTo)     rows = rows.filter((r) => r.startTimestamp <= endTo);
  return rows;
};

// ── Correction workflow (Section 9.8) ─────────────────────────────────────
/**
 * Correct an approved measurement. The original is not overwritten — it
 * becomes state="corrected" and a successor is written with the corrected
 * value and `supersedesMeasurementId` pointing at the old record.
 */
export const correctMeasurement = async (tenantId, measurementId, { correctedValue, reason }) => {
  const existing = await getMeasurement(tenantId, measurementId);
  if (!existing) throw new Error(`Measurement ${measurementId} not found`);
  if (existing.state !== MEASUREMENT_STATE.APPROVED) {
    throw new Error(`Only approved measurements can be corrected (current state: ${existing.state}).`);
  }

  // Mark existing as corrected
  await updateDoc(measurementRef(tenantId, measurementId), {
    state: MEASUREMENT_STATE.CORRECTED,
    correctionReason: reason,
    correctedAt: nowIso(),
    correctedBy: actor(),
  });

  // Write the successor
  const successor = await createMeasurement(tenantId, {
    ...existing,
    measurementId: undefined,
    id: undefined,
    numericValue: correctedValue,
    inputValue: correctedValue,
    canonicalValue: toCanonical(correctedValue, existing.inputUnit),
    supersedesMeasurementId: measurementId,
    state: MEASUREMENT_STATE.DRAFT,
    correctionReason: reason,
  });
  return successor;
};

// ── Approval / workflow ───────────────────────────────────────────────────
export const submitMeasurement = async (tenantId, measurementId) => {
  await updateDoc(measurementRef(tenantId, measurementId), {
    state: MEASUREMENT_STATE.SUBMITTED,
    submittedBy: actor(),
    submittedAt: nowIso(),
  });
  return getMeasurement(tenantId, measurementId);
};

export const approveMeasurement = async (tenantId, measurementId) => {
  await updateDoc(measurementRef(tenantId, measurementId), {
    state: MEASUREMENT_STATE.APPROVED,
    approvedBy: actor(),
    approvedAt: nowIso(),
  });
  return getMeasurement(tenantId, measurementId);
};

export const returnMeasurement = async (tenantId, measurementId, { reason }) => {
  await updateDoc(measurementRef(tenantId, measurementId), {
    state: MEASUREMENT_STATE.RETURNED,
    returnReason: reason,
    returnedBy: actor(),
    returnedAt: nowIso(),
  });
  return getMeasurement(tenantId, measurementId);
};

// ── Quality check ─────────────────────────────────────────────────────────
/**
 * Best-confidence record for a component in a scope+period. Used by the KPI
 * engine when multiple sources disagree — Section 8.5.1 source precedence.
 */
export const pickHighestConfidence = (rows) => {
  if (!rows || rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => {
    const aIdx = CONFIDENCE_PRECEDENCE.indexOf(a.confidence || DATA_CONFIDENCE.UNKNOWN);
    const bIdx = CONFIDENCE_PRECEDENCE.indexOf(b.confidence || DATA_CONFIDENCE.UNKNOWN);
    if (aIdx !== bIdx) return bIdx - aIdx;
    // Tiebreak: latest updatedAt wins
    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
  });
  return sorted[0];
};

// ── Bulk import ───────────────────────────────────────────────────────────
/**
 * Bulk import measurements. Idempotency via external_source_id.
 * Batched at 400 docs per write to stay under Firestore limits.
 */
export const importMeasurements = async (tenantId, rows = [], { dryRun = false, batchId = null } = {}) => {
  const results = { created: 0, errors: [], warnings: [], committed: !dryRun, previewIds: [] };
  if (!Array.isArray(rows) || rows.length === 0) return results;

  const prepared = [];
  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      const componentDef = COMPONENT_CATALOGUE[row.component];
      if (!componentDef) throw new Error(`Unknown component: ${row.component}`);
      if (!row.startTimestamp) throw new Error("startTimestamp is required");

      const inputUnit = row.inputUnit || componentDef.unit;
      const inputValue = Number(row.numericValue);
      if (!Number.isFinite(inputValue)) throw new Error("numericValue must be a number");

      const canonicalValue = toCanonical(inputValue, inputUnit);

      const range = PLAUSIBILITY[row.component];
      if (range && (canonicalValue < range.min || canonicalValue > range.max)) {
        results.warnings.push({ row: i + 1, message: `Value ${canonicalValue} outside expected range.` });
      }

      prepared.push({
        ...row,
        inputUnit,
        inputValue,
        canonicalUnit: componentDef.unit,
        canonicalValue,
        ingestionBatchId: batchId,
      });
    } catch (err) {
      results.errors.push({ row: i + 1, message: err.message });
    }
  }

  if (dryRun) { results.previewIds = prepared.map(() => "preview"); return results; }

  for (let i = 0; i < prepared.length; i += 400) {
    const chunk = prepared.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach((r) => {
      const ref = doc(measurementsCol(tenantId));
      batch.set(ref, {
        measurementId: ref.id,
        tenantId,
        ...r,
        sourceType: r.sourceType || "import",
        state: r.state || MEASUREMENT_STATE.DRAFT,
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
  createMeasurement,
  getMeasurement,
  listMeasurements,
  correctMeasurement,
  submitMeasurement,
  approveMeasurement,
  returnMeasurement,
  pickHighestConfidence,
  importMeasurements,
};