/**
 * digitalTwin/services/importService.js
 *
 * Import batch lifecycle, dry-run validation, atomic commit and rollback
 * (Brief Section 8.5.5). The rules this enforces:
 *
 *   1. Upload creates a batch — no operational records yet
 *   2. Dry run resolves IDs, converts units, validates rows, cross-row
 *      overlap, assignments and period reconciliation
 *   3. Commit token issued ONLY when no blocking errors remain
 *   4. Commit is atomic and idempotent — never partial
 *   5. Re-running the same idempotency key returns the prior result
 */

import { db, auth } from "../../firebaseConfig";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { IMPORT_BATCH_STATE, DATA_CONFIDENCE } from "../models/enums";
import { INPUT_SHEETS, getCanonicalField } from "../models/inputSheets";
import { COMPONENT_CATALOGUE } from "../models/kpiSchema";
import { toCanonical, UNITS, quantityTypeOf } from "../models/units";

const nowIso = () => new Date().toISOString();
const actor = () => {
  const u = auth.currentUser;
  return u ? { uid: u.uid, email: u.email } : { uid: "system", email: null };
};

const batchesCol = (tenantId) => collection(db, "digitalTwinTenants", tenantId, "importBatches");
const batchRef = (tenantId, batchId) => doc(db, "digitalTwinTenants", tenantId, "importBatches", batchId);
const rowsCol = (tenantId, batchId) => collection(db, "digitalTwinTenants", tenantId, "importBatches", batchId, "rows");
const rowRef = (tenantId, batchId, rowId) => doc(db, "digitalTwinTenants", tenantId, "importBatches", batchId, "rows", rowId);

// ── Batch lifecycle ──────────────────────────────────────────────────────

/**
 * Create a batch. Rows are supplied raw from the spreadsheet; nothing is
 * written to operational collections yet (Section 8.5.5 step 4).
 */
export const createImportBatch = async (tenantId, {
  sheetId,
  idempotencyKey,
  fileName = null,
  rows = [],
  templateVersion = null,
  taxonomyVersion = null,
  contextId = null,
} = {}) => {
  if (!tenantId) throw new Error("tenantId is required");
  if (!sheetId || !INPUT_SHEETS[sheetId]) throw new Error(`Unknown sheet: ${sheetId}`);
  if (!idempotencyKey) throw new Error("idempotencyKey is required");

  // Idempotency — if a batch for this key exists, return it
  const existing = await findBatchByIdempotencyKey(tenantId, idempotencyKey);
  if (existing) return { ...existing, idempotent: true };

  const ref = doc(batchesCol(tenantId));
  const payload = {
    batchId: ref.id,
    tenantId,
    sheetId,
    idempotencyKey,
    fileName,
    templateVersion,
    taxonomyVersion,
    contextId,
    state: IMPORT_BATCH_STATE.UPLOADED,
    totalRows: rows.length,
    validRows: 0,
    warningRows: 0,
    errorRows: 0,
    errors: [],
    warnings: [],
    preview: [],
    commitToken: null,
    committedAt: null,
    committedBy: null,
    rolledBackAt: null,
    rollbackReason: null,
    rowIds: [],       // IDs of Firestore rows written under this batch
    createdBy: actor(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await setDoc(ref, payload);

  // Persist rows in subcollection (batched)
  for (let i = 0; i < rows.length; i += 400) {
    const chunk = rows.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach((raw, idx) => {
      const row = doc(rowsCol(tenantId, ref.id));
      batch.set(row, {
        rowId: row.id,
        rowIndex: i + idx,
        raw,
        state: "uploaded",
        validationErrors: [],
        validationWarnings: [],
        resolvedRecord: null,
        createdAt: nowIso(),
      });
    });
    await batch.commit();
  }

  return { ...payload, idempotent: false };
};

export const getImportBatch = async (tenantId, batchId) => {
  const snap = await getDoc(batchRef(tenantId, batchId));
  return snap.exists() ? { id: batchId, ...snap.data() } : null;
};

const findBatchByIdempotencyKey = async (tenantId, idempotencyKey) => {
  const q = query(
    batchesCol(tenantId),
    where("idempotencyKey", "==", idempotencyKey),
    limit(1),
  );
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const listImportBatches = async (tenantId, { sheetId = null, state = null, pageSize = 100 } = {}) => {
  const filters = [];
  if (sheetId) filters.push(where("sheetId", "==", sheetId));
  if (state)   filters.push(where("state", "==", state));
  const q = filters.length
    ? query(batchesCol(tenantId), ...filters, orderBy("createdAt", "desc"), limit(pageSize))
    : query(batchesCol(tenantId), orderBy("createdAt", "desc"), limit(pageSize));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ── Dry-run validation ───────────────────────────────────────────────────

/**
 * Validate every row. No operational data is written. The batch moves to
 * `errors_found` or `ready` at the end. A `commitToken` is issued ONLY
 * when zero blocking errors remain (Section 8.5.5 step 8).
 */
export const dryRunImportBatch = async (tenantId, batchId) => {
  const batch = await getImportBatch(tenantId, batchId);
  if (!batch) throw new Error("Batch not found");
  if (batch.state === IMPORT_BATCH_STATE.COMMITTED) throw new Error("Batch already committed");

  const sheet = INPUT_SHEETS[batch.sheetId];
  if (!sheet) throw new Error(`Unknown sheet: ${batch.sheetId}`);

  const rowSnap = await getDocs(rowsCol(tenantId, batchId));
  const rows = rowSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const batchErrors = [];
  const batchWarnings = [];
  const preview = [];

  // Cross-row state (for duplicate detection within the batch)
  const seenKeys = new Set();

  let validCount = 0, warnCount = 0, errCount = 0;

  for (const row of rows) {
    const result = await validateRow(tenantId, batch.sheetId, row, { seenKeys });
    row.validationErrors = result.errors;
    row.validationWarnings = result.warnings;
    row.resolvedRecord = result.resolvedRecord;
    row.state = result.errors.length > 0 ? "error" : result.warnings.length > 0 ? "warning" : "valid";

    if (result.errors.length > 0)      errCount += 1;
    else if (result.warnings.length > 0) warnCount += 1;
    else                                validCount += 1;

    result.errors.forEach((e) => batchErrors.push({ row: row.rowIndex + 1, ...e }));
    result.warnings.forEach((w) => batchWarnings.push({ row: row.rowIndex + 1, ...w }));

    if (preview.length < 50) {
      preview.push({
        rowIndex: row.rowIndex,
        state: row.state,
        summary: result.summary,
        canonical: result.resolvedRecord,
      });
    }

    // Persist row status
    await updateDoc(rowRef(tenantId, batchId, row.id), {
      state: row.state,
      validationErrors: row.validationErrors,
      validationWarnings: row.validationWarnings,
      resolvedRecord: row.resolvedRecord,
    });
  }

  const hasErrors = errCount > 0;
  const nextState = hasErrors ? IMPORT_BATCH_STATE.ERRORS_FOUND : IMPORT_BATCH_STATE.READY;
  const commitToken = hasErrors ? null : generateCommitToken(batchId);

  await updateDoc(batchRef(tenantId, batchId), {
    state: nextState,
    validRows: validCount,
    warningRows: warnCount,
    errorRows: errCount,
    errors: batchErrors,
    warnings: batchWarnings,
    preview,
    commitToken,
    validatedAt: nowIso(),
    updatedAt: nowIso(),
  });

  return {
    ...batch,
    state: nextState,
    validRows: validCount,
    warningRows: warnCount,
    errorRows: errCount,
    errors: batchErrors,
    warnings: batchWarnings,
    preview,
    commitToken,
  };
};

const generateCommitToken = (batchId) => `${batchId}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;

// ── Row validation ───────────────────────────────────────────────────────
const validateRow = async (tenantId, sheetId, row, { seenKeys }) => {
  const sheet = INPUT_SHEETS[sheetId];
  const raw = row.raw || {};
  const errors = [];
  const warnings = [];
  const resolvedRecord = {};

  // 1. Required column presence + type coercion
  for (const col of sheet.columns) {
    const value = raw[col.id];
    if (col.required) {
      if (value === undefined || value === null || value === "") {
        errors.push({ field: col.id, code: "REQUIRED", message: `${col.label} is required.` });
        continue;
      }
    }
    if (value === undefined || value === null || value === "") continue;

    // Type coercion
    try {
      resolvedRecord[col.canonicalField] = coerceValue(value, col);
    } catch (err) {
      errors.push({ field: col.id, code: "TYPE", message: `${col.label}: ${err.message}` });
    }
  }

  // 2. Unit conversion where applicable (Section 8.5.5 dry-run "converts units")
  // Measured columns like scheduledHours already come in canonical hours; we
  // validate but do not silently convert unless a user unit is present.
  for (const col of sheet.columns) {
    if (!col.unit) continue;
    const v = resolvedRecord[col.canonicalField];
    if (v === undefined || v === null) continue;
    const targetQty = quantityTypeOf(col.unit);
    if (!targetQty) continue;
    const inputQty = quantityTypeOf(raw[col.id + "Unit"] || col.unit);
    if (inputQty && inputQty !== targetQty) {
      errors.push({ field: col.id, code: "UNIT", message: `${col.label}: expected ${targetQty}, got ${inputQty}.` });
    }
  }

  // 3. Duplicate key within batch
  const externalId = resolvedRecord.externalSourceId;
  if (externalId) {
    if (seenKeys.has(externalId)) {
      errors.push({ field: "externalSourceId", code: "DUP_IN_BATCH", message: `Duplicate external ID "${externalId}" within this batch.` });
    } else {
      seenKeys.add(externalId);
    }
  }

  // 4. Reference resolution (asset ID must exist)
  if (resolvedRecord.assetId && (sheetId === "IS05" || sheetId === "IS06")) {
    const exists = await checkExists(tenantId, "resources", resolvedRecord.assetId);
    if (!exists) {
      warnings.push({ field: "assetId", code: "REF_NOT_FOUND", message: `Asset "${resolvedRecord.assetId}" not found in the register.` });
    }
  }

  // 5. Sheet-specific cross-row checks
  if (sheetId === "IS05") {
    // available ≤ scheduled; operating ≤ available
    const s = Number(resolvedRecord.scheduled_time);
    const a = Number(resolvedRecord.available_time);
    const o = Number(resolvedRecord.operating_time);
    if (Number.isFinite(s) && Number.isFinite(a) && a > s) {
      errors.push({ field: "availableHours", code: "RULE", message: `Available (${a}h) cannot exceed scheduled (${s}h).` });
    }
    if (Number.isFinite(o) && Number.isFinite(a) && o > a) {
      errors.push({ field: "operatingHours", code: "RULE", message: `Operating (${o}h) cannot exceed available (${a}h).` });
    }
    if (Number.isFinite(s) && (s < 0 || s > 24 * 7)) {
      errors.push({ field: "scheduledHours", code: "PLAUSIBILITY", message: `Scheduled hours ${s} outside 0–168h.` });
    }
  }

  if (sheetId === "IS07") {
    const start = resolvedRecord.eventStart ? new Date(resolvedRecord.eventStart).getTime() : null;
    const end   = resolvedRecord.eventEnd ? new Date(resolvedRecord.eventEnd).getTime() : null;
    if (start !== null && end !== null && end < start) {
      errors.push({ field: "eventEnd", code: "RULE", message: "Event end cannot precede event start." });
    }
  }

  // 6. Plausibility ranges on production values
  if (resolvedRecord.accepted_output !== undefined) {
    const v = Number(resolvedRecord.accepted_output);
    if (Number.isFinite(v) && (v < 0 || v > 10_000_000)) {
      warnings.push({ field: "accepted_output", code: "PLAUSIBILITY", message: `Accepted output ${v} outside plausibility range.` });
    }
  }

  return {
    errors,
    warnings,
    resolvedRecord,
    summary: buildRowSummary(sheetId, resolvedRecord),
  };
};

const coerceValue = (value, col) => {
  switch (col.type) {
    case "number": {
      const n = Number(value);
      if (!Number.isFinite(n)) throw new Error(`expected number, got "${value}"`);
      return n;
    }
    case "integer": {
      const n = parseInt(value, 10);
      if (!Number.isFinite(n)) throw new Error(`expected integer, got "${value}"`);
      return n;
    }
    case "boolean": {
      if (typeof value === "boolean") return value;
      const s = String(value).toLowerCase().trim();
      if (["true", "yes", "y", "1"].includes(s)) return true;
      if (["false", "no", "n", "0"].includes(s)) return false;
      throw new Error(`expected boolean, got "${value}"`);
    }
    case "date": {
      const s = String(value).trim();
      if (!/^\d{4}-\d{2}-\d{2}/.test(s)) throw new Error(`expected ISO date (YYYY-MM-DD), got "${value}"`);
      return s.slice(0, 10);
    }
    case "datetime": {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) throw new Error(`expected datetime, got "${value}"`);
      return d.toISOString();
    }
    case "enum": {
      const s = String(value).trim();
      if (col.options && !col.options.includes(s)) {
        throw new Error(`expected one of: ${col.options.join(", ")}`);
      }
      return s;
    }
    default:
      return String(value).trim();
  }
};

const checkExists = async (tenantId, collectionName, id) => {
  if (!id) return true;
  const ref = doc(db, "digitalTwinTenants", tenantId, collectionName, id);
  const snap = await getDoc(ref);
  return snap.exists();
};

const buildRowSummary = (sheetId, resolved) => {
  switch (sheetId) {
    case "IS02":
      return `${resolved.name || "Unnamed"} · ${resolved.equipmentTypeId?.split(".").pop() || "?"}`;
    case "IS05":
      return `${resolved.assetId?.slice(0, 8) || "?"} · ${resolved.scheduled_time ?? "?"}h scheduled`;
    case "IS06":
      return `${resolved.accepted_output ?? "?"} ${resolved.outputUnit || ""} · ${resolved.acceptedOrIntermediate || ""}`;
    case "IS07":
      return `${resolved.categoryLevel1 || "?"} · ${resolved.eventStart?.slice(0, 16) || ""}`;
    default:
      return Object.keys(resolved).slice(0, 3).map((k) => `${k}=${resolved[k]}`).join(" ");
  }
};

// ── Commit ───────────────────────────────────────────────────────────────

/**
 * Atomic commit. Never partial. Requires a valid commit token issued by a
 * clean dry run. Rows are written into their target operational collection
 * under a single transaction per target.
 */
export const commitImportBatch = async (tenantId, batchId, { commitToken } = {}) => {
  const batch = await getImportBatch(tenantId, batchId);
  if (!batch) throw new Error("Batch not found");
  if (batch.state === IMPORT_BATCH_STATE.COMMITTED) {
    // Idempotent — return the prior result
    return { ...batch, idempotent: true };
  }
  if (batch.state !== IMPORT_BATCH_STATE.READY) {
    throw new Error(`Batch is not ready to commit (state: ${batch.state}). Run dry-run first.`);
  }
  if (!commitToken || commitToken !== batch.commitToken) {
    throw new Error("Invalid commit token. Re-run dry-run to obtain a fresh token.");
  }

  const rowSnap = await getDocs(rowsCol(tenantId, batchId));
  const rows = rowSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const ready = rows.filter((r) => r.state === "valid" || r.state === "warning");

  // Update batch to "mapped" before write so a crash shows a recoverable state
  await updateDoc(batchRef(tenantId, batchId), {
    state: IMPORT_BATCH_STATE.MAPPED,
    updatedAt: nowIso(),
  });

  try {
    const writtenIds = await commitToTarget(tenantId, batch, ready, batchId);

    await updateDoc(batchRef(tenantId, batchId), {
      state: IMPORT_BATCH_STATE.COMMITTED,
      rowIds: writtenIds,
      committedAt: nowIso(),
      committedBy: actor(),
      updatedAt: nowIso(),
    });

    return {
      ...batch,
      state: IMPORT_BATCH_STATE.COMMITTED,
      rowIds: writtenIds,
      committedAt: nowIso(),
    };
  } catch (err) {
    await updateDoc(batchRef(tenantId, batchId), {
      state: IMPORT_BATCH_STATE.FAILED,
      failureReason: err.message,
      updatedAt: nowIso(),
    });
    throw err;
  }
};

const commitToTarget = async (tenantId, batch, rows, batchId) => {
  const targetCollection = INPUT_SHEETS[batch.sheetId].targetCollection;
  const writtenIds = [];

  // For IS05/IS06/IS08 → measurements
  if (targetCollection === "measurements") {
    for (const row of rows) {
      const r = row.resolvedRecord;
      const componentMappings = mapToMeasurementsComponents(batch.sheetId, r);
      for (const m of componentMappings) {
        if (m.value === undefined || m.value === null || m.value === "") continue;
        const col = collection(db, "digitalTwinTenants", tenantId, "measurements");
        const ref = doc(col);
        await setDoc(ref, {
          measurementId: ref.id,
          tenantId,
          component: m.component,
          componentDefinition: COMPONENT_CATALOGUE[m.component]?.label || m.component,
          assetId: r.assetId || null,
          groupId: r.groupId || null,
          activityId: r.activityId || null,
          serviceId: r.serviceId || null,
          contractId: r.contractId || null,
          siteId: r.siteId || null,
          processAreaId: r.processAreaId || null,
          startTimestamp: m.start || r.eventStart || r.recordDate + "T00:00:00.000Z",
          endTimestamp: m.end || null,
          timezone: r.timezone || "Africa/Johannesburg",
          shiftId: r.shiftId || null,
          canonicalUnit: COMPONENT_CATALOGUE[m.component]?.unit || m.unit,
          canonicalValue: Number(m.value),
          inputUnit: m.unit || COMPONENT_CATALOGUE[m.component]?.unit,
          inputValue: Number(m.value),
          sourceType: "import",
          sourceSystem: r.source || "import",
          externalSourceId: r.externalSourceId ? `${r.externalSourceId}::${m.component}` : null,
          ingestionBatchId: batchId,
          confidence: r.confidence || DATA_CONFIDENCE.MANUAL_ACTUAL,
          state: "submitted",
          idempotencyKey: `${r.externalSourceId || row.id}::${m.component}`,
          createdBy: actor(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
        writtenIds.push(ref.id);
      }
    }
    return writtenIds;
  }

  // For IS07 → downtimeEvents
  if (targetCollection === "downtimeEvents") {
    for (const row of rows) {
      const r = row.resolvedRecord;
      const col = collection(db, "digitalTwinTenants", tenantId, "downtimeEvents");
      const ref = doc(col);
      const start = new Date(r.eventStart).getTime();
      const end = r.eventEnd ? new Date(r.eventEnd).getTime() : null;
      const durationHours = end !== null ? (end - start) / 3600000 : null;
      await setDoc(ref, {
        eventId: ref.id,
        tenantId,
        assetId: r.assetId || null,
        groupId: r.groupId || null,
        eventStart: r.eventStart,
        eventEnd: r.eventEnd || null,
        durationHours,
        categoryLevel1: r.categoryLevel1,
        categoryLevel2: r.categoryLevel2 || null,
        failureMode: r.failureMode || null,
        causeCode: r.causeCode || null,
        responsibility: r.responsibility || "internal",
        lostOperatingHours: r.lostOperatingHours ?? durationHours,
        estimatedLostOutput: r.estimatedLostOutput || null,
        workOrderId: r.workOrderId || null,
        actionTaken: r.actionTaken || "",
        evidenceUrl: r.evidenceUrl || "",
        confidence: r.confidence || DATA_CONFIDENCE.MANUAL_ACTUAL,
        source: "import",
        externalSourceId: r.externalSourceId,
        ingestionBatchId: batchId,
        createdBy: actor(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      writtenIds.push(ref.id);
    }
    return writtenIds;
  }

  // Generic fallback — write to the target collection
  for (const row of rows) {
    const col = collection(db, "digitalTwinTenants", tenantId, targetCollection);
    const ref = doc(col);
    await setDoc(ref, {
      id: ref.id,
      tenantId,
      ...row.resolvedRecord,
      ingestionBatchId: batchId,
      createdBy: actor(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    writtenIds.push(ref.id);
  }
  return writtenIds;
};

const mapToMeasurementsComponents = (sheetId, r) => {
  if (sheetId === "IS05") {
    return [
      { component: "scheduled_time", value: r.scheduled_time },
      { component: "available_time", value: r.available_time },
      { component: "operating_time", value: r.operating_time },
      { component: "excluded_time",  value: r.excluded_time },
      { component: "planned_downtime", value: r.planned_downtime },
      { component: "standby_time",   value: r.standby_time },
      { component: "utilisation_loss_time", value: r.utilisation_loss_time },
    ];
  }
  if (sheetId === "IS06") {
    return [
      { component: "accepted_output", value: r.accepted_output },
      // Intermediate is stored with a tag rather than a separate component
    ];
  }
  if (sheetId === "IS08") {
    if (r.unit === "kilowatt_hours") return [{ component: "energy_consumed", value: r.quantity }];
    if (r.unit === "litres") return [{ component: "fuel_consumed", value: r.quantity }];
    return [];
  }
  return [];
};

// ── Rollback ─────────────────────────────────────────────────────────────

/**
 * Roll back a committed batch. Only permitted within the recovery window
 * (configurable — currently 24 hours). Deletes all records written by the
 * commit, atomically.
 */
export const rollbackImportBatch = async (tenantId, batchId, { reason = "" } = {}) => {
  const batch = await getImportBatch(tenantId, batchId);
  if (!batch) throw new Error("Batch not found");
  if (batch.state !== IMPORT_BATCH_STATE.COMMITTED) throw new Error("Only committed batches can be rolled back.");
  if (batch.rowIds.length === 0) throw new Error("Batch has no committed records to roll back.");

  const targetCollection = INPUT_SHEETS[batch.sheetId].targetCollection;

  for (let i = 0; i < batch.rowIds.length; i += 400) {
    const chunk = batch.rowIds.slice(i, i + 400);
    const wb = writeBatch(db);
    chunk.forEach((id) => {
      const ref = doc(db, "digitalTwinTenants", tenantId, targetCollection, id);
      wb.delete(ref);
    });
    await wb.commit();
  }

  await updateDoc(batchRef(tenantId, batchId), {
    state: IMPORT_BATCH_STATE.ROLLED_BACK,
    rolledBackAt: nowIso(),
    rollbackReason: reason,
    updatedAt: nowIso(),
  });

  return { ok: true, deletedCount: batch.rowIds.length };
};

// ── CSV / XLSX parsing (called from the UI) ──────────────────────────────
export const parseCsvText = (text) => {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] !== undefined ? values[i] : ""; });
    return row;
  });
  return { headers, rows };
};

const parseCsvLine = (line) => {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim());
};

export default {
  createImportBatch,
  getImportBatch,
  listImportBatches,
  dryRunImportBatch,
  commitImportBatch,
  rollbackImportBatch,
  parseCsvText,
};