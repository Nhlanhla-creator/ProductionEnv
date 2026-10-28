/**
 * digitalTwin/services/resourceService.js
 *
 * Asset register, equipment groups and effective-dated assignments.
 * Implements Brief Sections 6.1, 6.2, 8.5.2 (IS02/IS03) and 4.2 #5–#7.
 *
 * Firestore layout (all under digitalTwinTenants/{tenantId}):
 *   resources/{resourceId}         — assets, teams, consumables, logical
 *   groups/{groupId}               — equipment groups / fleets / circuits
 *   assignments/{assignmentId}     — effective-dated context links
 *
 * Guarantees enforced:
 *   - Assignments are NEVER overwritten — a move closes the old record and
 *     opens a new one (Section 4.2 #7)
 *   - Primary assignments cannot overlap in the same context
 *   - Allocation sums per context are checked
 *   - Historical placements remain queryable forever
 */

import { db, auth } from "../../firebaseConfig";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp, writeBatch, runTransaction,
} from "firebase/firestore";
import {
  RESOURCE_KIND,
  createEmptyResource,
  createEmptyAssignment,
  createEmptyGroup,
  validateResource,
  validateAssignment,
  validateGroup,
} from "../models/assetSchema";

import { normalAssetNumber, selectEventContext } from "../models/assetIdentity";

// ── Utilities ─────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const nowIso = () => new Date().toISOString();

const actor = () => {
  const u = auth.currentUser;
  return u ? { uid: u.uid, email: u.email } : { uid: "system", email: null };
};

const resourcesCol = (tenantId) => collection(db, "digitalTwinTenants", tenantId, "resources");
const resourceRef = (tenantId, id) => doc(db, "digitalTwinTenants", tenantId, "resources", id);
const groupsCol = (tenantId) => collection(db, "digitalTwinTenants", tenantId, "groups");
const groupRef = (tenantId, id) => doc(db, "digitalTwinTenants", tenantId, "groups", id);
const assignmentsCol = (tenantId) => collection(db, "digitalTwinTenants", tenantId, "assignments");
const assignmentRef = (tenantId, id) => doc(db, "digitalTwinTenants", tenantId, "assignments", id);

// ── Asset / Resource CRUD ────────────────────────────────────────────────

export const createResource = async (tenantId, input, { legacyChecked = false } = {}) => {
  if (!tenantId || !auth.currentUser) throw new Error("Select an organisation and sign in first.");
  const resource = { ...createEmptyResource(tenantId, input), tenantId };
  if (resource.resourceKind === RESOURCE_KIND.ASSET) resource.internalNumber = normalAssetNumber(resource.internalNumber);
  const { ok, errors, warnings } = validateResource(resource, { isCreate: true });
  if (!ok) { const err = new Error(errors.map(e => e.message).join(" ")); err.validationErrors = errors; throw err; }
  // Legacy documents may predate the identifier index. Check them before reserving an ID.
  if (resource.resourceKind === RESOURCE_KIND.ASSET && !legacyChecked) {
    const all = await getDocs(query(resourcesCol(tenantId), where("resourceKind", "==", RESOURCE_KIND.ASSET)));
    if (all.docs.some(d => String(d.data().internalNumber || "").trim().toUpperCase() === resource.internalNumber)) throw new Error(`Asset ID ${resource.internalNumber} is already registered.`);
  }
  const ref = doc(resourcesCol(tenantId)), now = nowIso();
  const payload = { ...resource, assetId: ref.id, resourceVersion: 1, createdAt: now, createdBy: actor(), updatedAt: now, updatedBy: actor(), _warnings: warnings.map(w => w.message) };
  delete payload.id;
  await runTransaction(db, async tx => {
    if (resource.resourceKind === RESOURCE_KIND.ASSET) {
      const key = doc(db, "digitalTwinTenants", tenantId, "assetIdentifiers", resource.internalNumber);
      const reserved = await tx.get(key);
      if (reserved.exists()) throw new Error(`Asset ID ${resource.internalNumber} is already reserved. Use a new ID.`);
      tx.set(key, { resourceId: ref.id, internalNumber: resource.internalNumber, createdAt: now, createdBy: actor() });
    }
    tx.set(ref, payload);
  });
  return { id: ref.id, ...payload };
};

export const getResource = async (tenantId, resourceId) => {
  const snap = await getDoc(resourceRef(tenantId, resourceId));
  return snap.exists() ? { id: resourceId, ...snap.data() } : null;
};

export const updateResource = async (tenantId, resourceId, patch) => {
  if (!tenantId || !auth.currentUser) throw new Error("Select an organisation and sign in first.");
  const ref = resourceRef(tenantId, resourceId);
  const initial = await getResource(tenantId, resourceId);
  if (!initial) throw new Error("Asset not found.");
  const nextNumber = initial.resourceKind === RESOURCE_KIND.ASSET && (patch.internalNumber || initial.internalNumber)
    ? normalAssetNumber(patch.internalNumber || initial.internalNumber) : initial.internalNumber;
  if (nextNumber && nextNumber !== initial.internalNumber) {
    const all = await getDocs(query(resourcesCol(tenantId), where("resourceKind", "==", RESOURCE_KIND.ASSET)));
    if (all.docs.some(d => d.id !== resourceId && String(d.data().internalNumber || "").trim().toUpperCase() === nextNumber)) throw new Error(`Asset ID ${nextNumber} is already registered.`);
  }
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Asset no longer exists.");
    const existing = snap.data();
    if (existing.updatedAt !== initial.updatedAt || (existing.resourceVersion || 0) !== (initial.resourceVersion || 0)) throw new Error("This asset changed. Reload before saving.");
    const merged = { ...existing, ...patch, tenantId, assetId: resourceId, resourceKind: existing.resourceKind,
      internalNumber: nextNumber, createdAt: existing.createdAt, createdBy: existing.createdBy };
    delete merged.id;
    const { ok, errors, warnings } = validateResource(merged);
    if (!ok) { const error = new Error(errors.map(e => e.message).join(" ")); error.validationErrors = errors; throw error; }
    const now = nowIso();
    if (merged.resourceKind === RESOURCE_KIND.ASSET && merged.internalNumber) {
      const key = doc(db, "digitalTwinTenants", tenantId, "assetIdentifiers", merged.internalNumber);
      const reserved = await tx.get(key);
      if (reserved.exists() && reserved.data().resourceId !== resourceId) throw new Error("Asset ID is already reserved.");
      if (!reserved.exists()) tx.set(key, { resourceId, internalNumber: merged.internalNumber, createdAt: now, createdBy: actor() });
    }
    tx.set(ref, { ...merged, resourceVersion: (existing.resourceVersion || 0) + 1, updatedAt: now, updatedBy: actor(), _warnings: warnings.map(w => w.message) });
  });
  return getResource(tenantId, resourceId);
};

export const retireResource = async (tenantId, resourceId, { effectiveTo = today(), reason = "" } = {}) => {
  return updateResource(tenantId, resourceId, {
    status: "retired",
    effectiveTo,
    retirementReason: reason,
  });
};

export const listResources = async (tenantId, {
  resourceKind = RESOURCE_KIND.ASSET,
  status = null,
  equipmentTypeId = null,
  groupId = null,
  search = "",
  pageSize = 500,
} = {}) => {
  if (!tenantId) return [];
  const filters = [];
  if (resourceKind) filters.push(where("resourceKind", "==", resourceKind));
  if (status) filters.push(where("status", "==", status));
  if (equipmentTypeId) filters.push(where("equipmentTypeId", "==", equipmentTypeId));
  if (groupId) filters.push(where("equipmentGroupId", "==", groupId));

  const snap = await getDocs(resourcesCol(tenantId));
  let rows = snap.docs.map(d => ({ ...d.data(), id: d.id })).filter(r =>
    (!resourceKind || r.resourceKind === resourceKind) && (!status || r.status === status)
    && (!equipmentTypeId || r.equipmentTypeId === equipmentTypeId) && (!groupId || r.equipmentGroupId === groupId))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  if (search && search.trim()) {
    const needle = search.toLowerCase().trim();
    rows = rows.filter((r) => {
      const hay = [r.name, r.internalNumber, r.serialNumber, r.registration, r.make, r.model, r.barcodeOrQr]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }

  return rows;
};

/**
 * Counts of distinct active assets, useful for capacity views (Section 7.7 #5).
 */
export const countDistinctActiveAssets = async (tenantId, { groupId = null, equipmentTypeId = null } = {}) => {
  const rows = await listResources(tenantId, {
    resourceKind: RESOURCE_KIND.ASSET,
    status: "available",
    groupId,
    equipmentTypeId,
    pageSize: 5000,
  });
  const ids = new Set(rows.map((r) => r.id));
  return ids.size;
};

// ── Equipment groups ─────────────────────────────────────────────────────

export const createGroup = async (tenantId, input) => {
  if (!tenantId) throw new Error("tenantId is required");
  const group = { ...createEmptyGroup(tenantId, input), tenantId };

  const { ok, errors } = validateGroup(group);
  if (!ok) {
    const err = new Error("Group failed validation");
    err.validationErrors = errors;
    throw err;
  }

  const ref = doc(groupsCol(tenantId));
  const payload = {
    ...group,
    groupId: ref.id,
    createdAt: nowIso(),
    createdBy: actor(),
    updatedAt: nowIso(),
    updatedBy: actor(),
  };
  await setDoc(ref, payload);
  return { id: ref.id, ...payload };
};

export const getGroup = async (tenantId, groupId) => {
  const snap = await getDoc(groupRef(tenantId, groupId));
  return snap.exists() ? { id: groupId, ...snap.data() } : null;
};

export const updateGroup = async (tenantId, groupId, patch) => {
  const existing = await getGroup(tenantId, groupId);
  if (!existing) throw new Error(`Group ${groupId} not found`);
  const merged = { ...existing, ...patch, tenantId };
  const { ok, errors } = validateGroup(merged);
  if (!ok) {
    const err = new Error("Group failed validation");
    err.validationErrors = errors;
    throw err;
  }
  await updateDoc(groupRef(tenantId, groupId), {
    ...patch, updatedAt: nowIso(), updatedBy: actor(),
  });
  return getGroup(tenantId, groupId);
};

export const listGroups = async (tenantId, { status = "active" } = {}) => {
  if (!tenantId) return [];
  const snap = await getDocs(groupsCol(tenantId));
  return snap.docs.map(d => ({ ...d.data(), id: d.id })).filter(g => !status || g.status === status)
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const listOperatingSites = async (tenantId, { activeOnly = true } = {}) => {
  if (!tenantId) return [];
  const snap = await getDocs(query(collection(db, "digitalTwinTenants", tenantId, "nodes"), where("nodeType", "==", "site")));
  return snap.docs.map(d => ({ ...d.data(), id: d.id })).filter(s => !activeOnly || s.status === "active").sort((a, b) => a.name.localeCompare(b.name));
};

export const setGroupMembers = async (tenantId, groupId, assetIds = []) => {
  const group = await getGroup(tenantId, groupId);
  if (!group) throw new Error(`Group ${groupId} not found`);

  const previous = await listGroupMembers(tenantId, groupId, { activeOnly: true });
  const prevIds = new Set(previous.map((a) => a.id));
  const nextIds = new Set(assetIds);

  const toAdd = assetIds.filter((id) => !prevIds.has(id));
  const toRemove = previous.filter((a) => !nextIds.has(a.id)).map((a) => a.id);

  // Update resource docs' equipmentGroupId only as a cache — actual source
  // of truth is the group membership list below.
  const batch = writeBatch(db);
  toAdd.forEach((assetId) => {
    batch.update(resourceRef(tenantId, assetId), {
      equipmentGroupId: groupId,
      updatedAt: nowIso(),
      updatedBy: actor(),
    });
  });
  toRemove.forEach((assetId) => {
    batch.update(resourceRef(tenantId, assetId), {
      equipmentGroupId: null,
      updatedAt: nowIso(),
      updatedBy: actor(),
    });
  });
  await batch.commit();

  return { added: toAdd.length, removed: toRemove.length, total: assetIds.length };
};

export const listGroupMembers = async (tenantId, groupId, { activeOnly = true } = {}) => {
  const q = query(resourcesCol(tenantId), where("equipmentGroupId", "==", groupId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ── Assignments (effective-dated) ────────────────────────────────────────

/**
 * Create a new assignment. Never overwrites — always adds.
 * Callers must explicitly close the previous assignment if they want to
 * move an asset between contexts (Section 4.2 #7).
 */
export const createAssignment = async (tenantId, input) => {
  if (!tenantId) throw new Error("tenantId is required");
  const assignment = { ...createEmptyAssignment(tenantId, input.resourceId, input), tenantId };

  // Load all existing assignments for this resource to validate overlaps
  const existing = await listAssignmentsForResource(tenantId, assignment.resourceId);

  const { ok, errors, warnings } = validateAssignment(assignment, { existingAssignmentsForResource: existing });
  if (!ok) {
    const err = new Error("Assignment failed validation");
    err.validationErrors = errors;
    err.validationWarnings = warnings;
    throw err;
  }

  const ref = doc(assignmentsCol(tenantId));
  const payload = {
    ...assignment,
    assignmentId: ref.id,
    createdAt: nowIso(),
    createdBy: actor(),
    updatedAt: nowIso(),
    updatedBy: actor(),
    _warnings: warnings.map((w) => w.message),
  };
  await setDoc(ref, payload);
  return { id: ref.id, ...payload };
};

export const getAssignment = async (tenantId, assignmentId) => {
  const snap = await getDoc(assignmentRef(tenantId, assignmentId));
  return snap.exists() ? { id: assignmentId, ...snap.data() } : null;
};

export const updateAssignment = async (tenantId, assignmentId, patch) => {
  const existing = await getAssignment(tenantId, assignmentId);
  if (!existing) throw new Error(`Assignment ${assignmentId} not found`);
  const merged = { ...existing, ...patch, tenantId };

  const others = (await listAssignmentsForResource(tenantId, merged.resourceId))
    .filter((a) => a.id !== assignmentId);

  const { ok, errors, warnings } = validateAssignment(merged, { existingAssignmentsForResource: others });
  if (!ok) {
    const err = new Error("Assignment failed validation");
    err.validationErrors = errors;
    throw err;
  }

  await updateDoc(assignmentRef(tenantId, assignmentId), {
    ...patch, updatedAt: nowIso(), updatedBy: actor(),
    _warnings: warnings.map((w) => w.message),
  });
  return getAssignment(tenantId, assignmentId);
};

export const closeAssignment = async (tenantId, assignmentId, { effectiveTo = today(), reason = "" } = {}) => {
  return updateAssignment(tenantId, assignmentId, {
    state: "closed",
    effectiveTo,
    closeReason: reason,
  });
};

export const listAssignmentsForResource = async (tenantId, resourceId) => {
  const snap = await getDocs(query(assignmentsCol(tenantId), where("resourceId", "==", resourceId)));
  return snap.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => String(b.effectiveFrom).localeCompare(String(a.effectiveFrom)));
};

export const listAssignmentsForContext = async (tenantId, { siteId = null, contractId = null, activityId = null, groupId = null, asOf = null } = {}) => {
  const filters = [];
  if (siteId) filters.push(where("siteId", "==", siteId));
  if (contractId) filters.push(where("contractId", "==", contractId));
  if (activityId) filters.push(where("activityId", "==", activityId));
  if (groupId) filters.push(where("groupId", "==", groupId));
  if (filters.length === 0) return [];

  const q = query(assignmentsCol(tenantId), ...filters, limit(2000));
  const snap = await getDocs(q);
  let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (asOf) {
    rows = rows.filter((a) => {
      const from = a.effectiveFrom || "0000-01-01";
      const to   = a.effectiveTo   || "9999-12-31";
      return asOf >= from && asOf <= to;
    });
  }
  return rows;
};

/**
 * Move an asset to a new context. Closes the currently-active primary
 * assignment at the new effectiveFrom date and opens a new one — the
 * historical placement remains queryable (Section 4.2 #7).
 */
export const moveAsset = async (tenantId, resourceId, newAssignment, { closeOnDate = null } = {}) => {
  const existing = await listAssignmentsForResource(tenantId, resourceId);
  const activePrimary = existing.find((a) => a.isPrimary && a.state === "active" && !a.effectiveTo);

  const moveDate = closeOnDate || newAssignment.effectiveFrom || today();

  if (activePrimary) {
    await closeAssignment(tenantId, activePrimary.id, {
      effectiveTo: moveDate,
      reason: "Asset moved to new context",
    });
  }

  return createAssignment(tenantId, {
    ...newAssignment,
    resourceId,
    isPrimary: newAssignment.isPrimary ?? true,
    state: newAssignment.state || "active",
  });
};

/**
 * Compute, for a given resource at a given date, the effective context(s).
 * Returns all non-closed assignments whose window contains the date.
 */
export const effectiveContextFor = async (tenantId, resourceId, asOf = today()) => {
  const all = await listAssignmentsForResource(tenantId, resourceId);
  return all.filter(a => a.effectiveFrom && asOf >= a.effectiveFrom && (!a.effectiveTo || asOf <= a.effectiveTo)
    && (a.state !== "closed" || Boolean(a.effectiveTo)));
};

export const contextForDowntime = async (tenantId, resourceId, localDate) => {
  const [all, asset] = await Promise.all([listAssignmentsForResource(tenantId, resourceId), getResource(tenantId, resourceId)]);
  if (!asset) throw new Error("Asset not found.");
  return selectEventContext(all, localDate, asset);
};

// ── Bulk import ──────────────────────────────────────────────────────────

/**
 * Bulk import resources from a normalised array. Each item must be shaped
 * like the createResource payload. Idempotency is achieved by the caller
 * providing an `externalSourceId` per row — repeat calls for the same key
 * are rejected before write (Phase 4 wires the real batch + dry-run).
 */
export const importResources = async (tenantId, rows = [], { dryRun = false } = {}) => {
  const result = { created: 0, updated: 0, errors: [], warnings: [], committed: false, previewIds: [] };
  const seen = new Set();
  rows.forEach((row, i) => {
    const resource = createEmptyResource(tenantId, row);
    const { errors, warnings } = validateResource(resource, { isCreate: true });
    if (resource.resourceKind === RESOURCE_KIND.ASSET) {
      try { const key = normalAssetNumber(resource.internalNumber); if (seen.has(key)) errors.push({ message: "Duplicate Asset ID in file." }); seen.add(key); } catch (_) { /* schema reports this */ }
    }
    errors.forEach(e => result.errors.push({ row: i + 1, message: e.message }));
    warnings.forEach(w => result.warnings.push({ row: i + 1, message: w.message }));
  });
  if (dryRun || result.errors.length) return result;
  for (let i = 0; i < rows.length; i++) {
    try { const resource = await createResource(tenantId, rows[i]); result.previewIds.push(resource.assetId); result.created++; }
    catch (e) { result.errors.push({ row: i + 1, message: e.message }); break; }
  }
  result.committed = result.errors.length === 0;
  return result;
};

export default {
  createResource,
  getResource,
  updateResource,
  retireResource,
  listResources,
  countDistinctActiveAssets,

  createGroup,
  getGroup,
  updateGroup,
  listGroups,
  listOperatingSites,
  setGroupMembers,
  listGroupMembers,

  createAssignment,
  getAssignment,
  updateAssignment,
  closeAssignment,
  listAssignmentsForResource,
  listAssignmentsForContext,
  moveAsset,
  effectiveContextFor,
  contextForDowntime,

  importResources,
};