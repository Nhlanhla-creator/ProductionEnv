/**
 * digitalTwin/services/hierarchyService.js
 *
 * Effective-dated graph of organisations, delivery contexts and operational
 * structure (Section 4, Section 6, Section 13.4).
 *
 * Firestore layout:
 *   digitalTwinTenants/{tenantId}                                 — tenant root
 *     nodes/{nodeId}                                              — typed nodes
 *     relations/{relationId}                                      — typed relations
 *     setups/{setupId}                                            — setup sessions
 *
 * Every node and relation carries:
 *   - immutable id
 *   - effectiveFrom / effectiveTo (ISO date strings)
 *   - status ("active" | "retired")
 *   - createdAt / createdBy for audit
 *
 * The service enforces:
 *   - one immutable organisation ID per company (Section 4.2 #1)
 *   - site and contract are separate entities (Section 4.2 #2)
 *   - moving an asset closes the old assignment and creates a new one
 *   - history is preserved when structure changes
 */

import { db, auth } from "../../firebaseConfig";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { NODE_TYPES, RELATION_TYPES } from "../models/enums";

// ── Utilities ─────────────────────────────────────────────────────────────
const nowIso = () => new Date().toISOString();
const today = () => nowIso().split("T")[0];
const tenantRef = (tenantId) => doc(db, "digitalTwinTenants", tenantId);
const nodesCol = (tenantId) => collection(db, "digitalTwinTenants", tenantId, "nodes");
const relationsCol = (tenantId) => collection(db, "digitalTwinTenants", tenantId, "relations");
const setupsCol = (tenantId) => collection(db, "digitalTwinTenants", tenantId, "setups");

const actor = () => {
  const u = auth.currentUser;
  return u ? { uid: u.uid, email: u.email } : { uid: "system", email: null };
};

// ── Tenant bootstrap ──────────────────────────────────────────────────────

/**
 * Ensure a tenant root exists for the given organisation. Idempotent.
 * The tenantId is normally the same as the company owner's uid from the
 * Universal Profile system — this keeps the twin connected to the profile.
 */
export const ensureTenant = async ({ tenantId, displayName, legalName = null, registrationNumber = null }) => {
  if (!tenantId) throw new Error("tenantId is required");
  const ref = tenantRef(tenantId);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: tenantId, ...snap.data() };
  const payload = {
    displayName: displayName || "Untitled tenant",
    legalName,
    registrationNumber,
    createdAt: serverTimestamp(),
    createdBy: actor(),
    status: "active",
    schemaVersion: 1,
  };
  await setDoc(ref, payload);
  return { id: tenantId, ...payload };
};

export const getTenant = async (tenantId) => {
  const snap = await getDoc(tenantRef(tenantId));
  return snap.exists() ? { id: tenantId, ...snap.data() } : null;
};

// ── Node CRUD ─────────────────────────────────────────────────────────────

/**
 * Create a typed node in the graph.
 * Node kinds must be one of NODE_TYPES.
 */
export const createNode = async (tenantId, {
  nodeType,
  name,
  code = null,
  attributes = {},
  effectiveFrom = today(),
  effectiveTo = null,
  status = "active",
}) => {
  if (!tenantId) throw new Error("tenantId is required");
  if (!Object.values(NODE_TYPES).includes(nodeType)) {
    throw new Error(`Unknown nodeType: ${nodeType}`);
  }
  if (!name) throw new Error("name is required");

  const payload = {
    nodeType,
    name: name.trim(),
    code: code || null,
    attributes,
    effectiveFrom,
    effectiveTo,
    status,
    createdAt: serverTimestamp(),
    createdBy: actor(),
    updatedAt: serverTimestamp(),
  };
  const ref = doc(nodesCol(tenantId));
  await setDoc(ref, payload);
  return { id: ref.id, ...payload };
};

export const getNode = async (tenantId, nodeId) => {
  const snap = await getDoc(doc(nodesCol(tenantId), nodeId));
  return snap.exists() ? { id: nodeId, ...snap.data() } : null;
};

export const updateNode = async (tenantId, nodeId, patch) => {
  await updateDoc(doc(nodesCol(tenantId), nodeId), {
    ...patch,
    updatedAt: serverTimestamp(),
    updatedBy: actor(),
  });
  return getNode(tenantId, nodeId);
};

/**
 * Retire a node. Preserves history — effectiveTo is set, status = "retired".
 * Relations pointing at the node must be closed separately.
 */
export const retireNode = async (tenantId, nodeId, { effectiveTo = today() } = {}) => {
  return updateNode(tenantId, nodeId, { status: "retired", effectiveTo });
};

/** List nodes filtered by type and status. */
export const listNodes = async (tenantId, { nodeType = null, status = "active" } = {}) => {
  const filters = [];
  if (nodeType) filters.push(where("nodeType", "==", nodeType));
  if (status)   filters.push(where("status", "==", status));
  const q = filters.length
    ? query(nodesCol(tenantId), ...filters, orderBy("name"), limit(1000))
    : query(nodesCol(tenantId), orderBy("name"), limit(1000));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ── Relations ─────────────────────────────────────────────────────────────

/**
 * Create an effective-dated typed relation between two nodes.
 * Section 13.4 defines which (from, to) pairs are valid; enforcement lives
 * in the caller for now — a stricter validator ships in Phase 2.
 */
export const createRelation = async (tenantId, {
  fromId,
  toId,
  relationType,
  isPrimary = false,
  allocation = null,
  effectiveFrom = today(),
  effectiveTo = null,
  attributes = {},
}) => {
  if (!tenantId || !fromId || !toId) throw new Error("tenantId, fromId and toId are required");
  if (!Object.values(RELATION_TYPES).includes(relationType)) {
    throw new Error(`Unknown relationType: ${relationType}`);
  }
  if (fromId === toId) throw new Error("Self-relations are not permitted");

  // Overlap guard for primary relations (Section 4.2 #5)
  if (isPrimary) {
    const clash = await findOverlappingPrimary(tenantId, { fromId, toId, relationType, effectiveFrom, effectiveTo });
    if (clash.length > 0) {
      throw new Error(`Cannot create primary relation — ${clash.length} overlapping active relation(s) exist for this pair.`);
    }
  }

  const payload = {
    fromId, toId, relationType, isPrimary,
    allocation,
    effectiveFrom, effectiveTo,
    attributes,
    status: "active",
    createdAt: serverTimestamp(),
    createdBy: actor(),
    updatedAt: serverTimestamp(),
  };
  const ref = doc(relationsCol(tenantId));
  await setDoc(ref, payload);
  return { id: ref.id, ...payload };
};

export const getRelation = async (tenantId, relationId) => {
  const snap = await getDoc(doc(relationsCol(tenantId), relationId));
  return snap.exists() ? { id: relationId, ...snap.data() } : null;
};

export const closeRelation = async (tenantId, relationId, { effectiveTo = today() } = {}) => {
  await updateDoc(doc(relationsCol(tenantId), relationId), {
    status: "closed",
    effectiveTo,
    updatedAt: serverTimestamp(),
    updatedBy: actor(),
  });
  return getRelation(tenantId, relationId);
};

/**
 * Overlapping primary check — two active primary relations for the same
 * (from, to, relationType) whose effective windows intersect.
 */
const findOverlappingPrimary = async (tenantId, { fromId, toId, relationType, effectiveFrom, effectiveTo }) => {
  const q = query(
    relationsCol(tenantId),
    where("fromId", "==", fromId),
    where("toId", "==", toId),
    where("relationType", "==", relationType),
    where("isPrimary", "==", true),
    where("status", "==", "active"),
  );
  const snap = await getDocs(q);
  const ranges = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return ranges.filter((r) => {
    const rFrom = r.effectiveFrom || "0000-01-01";
    const rTo   = r.effectiveTo   || "9999-12-31";
    const nFrom = effectiveFrom || "0000-01-01";
    const nTo   = effectiveTo   || "9999-12-31";
    return !(nTo < rFrom || nFrom > rTo);
  });
};

/** List relations by from / to / type. */
export const listRelations = async (tenantId, { fromId = null, toId = null, relationType = null, status = "active" } = {}) => {
  const filters = [];
  if (fromId) filters.push(where("fromId", "==", fromId));
  if (toId)   filters.push(where("toId", "==", toId));
  if (relationType) filters.push(where("relationType", "==", relationType));
  if (status) filters.push(where("status", "==", status));
  const q = filters.length
    ? query(relationsCol(tenantId), ...filters, limit(2000))
    : query(relationsCol(tenantId), limit(2000));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ── Graph traversal ───────────────────────────────────────────────────────

/**
 * Build a displayable tree for a root node using active relations.
 * Returns { node, children: [...] }. Reads are batched per level to stay
 * efficient for realistic trees (hundreds of nodes, not millions).
 */
export const buildTree = async (tenantId, rootNodeId, { relationTypes = null, maxDepth = 8 } = {}) => {
  const root = await getNode(tenantId, rootNodeId);
  if (!root) return null;

  const build = async (node, depth) => {
    if (depth >= maxDepth) return { node, children: [] };
    const rels = await listRelations(tenantId, { fromId: node.id, status: "active" });
    const filtered = relationTypes ? rels.filter((r) => relationTypes.includes(r.relationType)) : rels;
    const childNodes = await Promise.all(filtered.map((r) => getNode(tenantId, r.toId)));
    const children = await Promise.all(
      childNodes.filter(Boolean).map((child) => build(child, depth + 1))
    );
    return { node, relations: filtered, children };
  };

  return build(root, 0);
};

/**
 * Return the effective path from a descendant up to the corporate root —
 * the "readable reporting path" the UI shows (Section 4).
 */
export const getAncestryPath = async (tenantId, nodeId) => {
  const chain = [];
  let current = await getNode(tenantId, nodeId);
  const guard = new Set();
  while (current && !guard.has(current.id)) {
    guard.add(current.id);
    chain.unshift(current);
    const parents = await listRelations(tenantId, { toId: current.id, status: "active" });
    const primary = parents.find((r) => r.isPrimary) || parents[0];
    if (!primary) break;
    current = await getNode(tenantId, primary.fromId);
  }
  return chain;
};

// ── Setup session (Section 9.2, Section 15.2 Slice 0) ────────────────────

export const createSetupSession = async (tenantId, {
  journeyType = "operational_twin",
  objectiveIds = [],
  sectorPackId = "mining",
}) => {
  if (!tenantId) throw new Error("tenantId is required");
  const payload = {
    journeyType,
    objectiveIds,
    sectorPackId,
    state: "draft",
    currentStep: "start",
    createdBy: actor(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = doc(setupsCol(tenantId));
  await setDoc(ref, payload);
  return { id: ref.id, ...payload };
};

export const advanceSetupSession = async (tenantId, setupId, { currentStep, state }) => {
  const patch = { currentStep, updatedAt: serverTimestamp() };
  if (state) patch.state = state;
  await updateDoc(doc(setupsCol(tenantId), setupId), patch);
  const snap = await getDoc(doc(setupsCol(tenantId), setupId));
  return snap.exists() ? { id: setupId, ...snap.data() } : null;
};

// ── Reference / fixture setup ─────────────────────────────────────────────

/**
 * Slice 1A reference structure: "Khula Mining Services" surface load-and-haul.
 * Idempotent — safe to call more than once.
 */
export const seedKhulaReference = async (tenantId) => {
  const existing = await listNodes(tenantId, { nodeType: NODE_TYPES.COMPANY, status: "active" });
  if (existing.length > 0) return { seeded: false, reason: "tenant already has a company node" };

  const batch = writeBatch(db);

  const companyNodeRef = doc(nodesCol(tenantId));
  batch.set(companyNodeRef, {
    nodeType: NODE_TYPES.COMPANY,
    name: "Khula Mining Services",
    code: "KMS",
    attributes: { displayName: "Khula Mining Services" },
    effectiveFrom: today(),
    effectiveTo: null,
    status: "active",
    createdAt: serverTimestamp(),
    createdBy: actor(),
    updatedAt: serverTimestamp(),
  });

  const siteNodeRef = doc(nodesCol(tenantId));
  batch.set(siteNodeRef, {
    nodeType: NODE_TYPES.SITE,
    name: "Northern Pit",
    code: "NORTH_PIT",
    attributes: { environment: "surface", method: "surface_open_pit", commodity: "iron_ore" },
    effectiveFrom: today(),
    effectiveTo: null,
    status: "active",
    createdAt: serverTimestamp(),
    createdBy: actor(),
    updatedAt: serverTimestamp(),
  });

  const contractNodeRef = doc(nodesCol(tenantId));
  batch.set(contractNodeRef, {
    nodeType: NODE_TYPES.CONTRACT,
    name: "Northern Pit Load and Haul Contract",
    code: "NORTH_LH",
    attributes: { client: "Northern Pit Mine", scopeSummary: "Load and haul of ore and waste" },
    effectiveFrom: today(),
    effectiveTo: null,
    status: "active",
    createdAt: serverTimestamp(),
    createdBy: actor(),
    updatedAt: serverTimestamp(),
  });

  const serviceNodeRef = doc(nodesCol(tenantId));
  batch.set(serviceNodeRef, {
    nodeType: NODE_TYPES.SERVICE,
    name: "Load and haul",
    code: "load_and_haul",
    attributes: { taxonomyId: "vc.load_haul" },
    effectiveFrom: today(),
    effectiveTo: null,
    status: "active",
    createdAt: serverTimestamp(),
    createdBy: actor(),
    updatedAt: serverTimestamp(),
  });

  const activityNodeRef = doc(nodesCol(tenantId));
  batch.set(activityNodeRef, {
    nodeType: NODE_TYPES.ACTIVITY,
    name: "Haul ore from loading area to primary crusher",
    code: "haul_ore",
    attributes: { taxonomyId: "act.hauling" },
    effectiveFrom: today(),
    effectiveTo: null,
    status: "active",
    createdAt: serverTimestamp(),
    createdBy: actor(),
    updatedAt: serverTimestamp(),
  });

  const groupNodeRef = doc(nodesCol(tenantId));
  batch.set(groupNodeRef, {
    nodeType: NODE_TYPES.EQUIPMENT_GROUP,
    name: "100 tonne haul fleet",
    code: "FLEET_100T",
    attributes: { nominalCapacityTonnes: 100 },
    effectiveFrom: today(),
    effectiveTo: null,
    status: "active",
    createdAt: serverTimestamp(),
    createdBy: actor(),
    updatedAt: serverTimestamp(),
  });

  const rels = [
    { from: companyNodeRef.id, to: siteNodeRef.id,    type: RELATION_TYPES.CONTAINS,   primary: true },
    { from: companyNodeRef.id, to: contractNodeRef.id, type: RELATION_TYPES.SCOPES,     primary: false },
    { from: contractNodeRef.id, to: siteNodeRef.id,   type: RELATION_TYPES.DELIVERED_AT, primary: true },
    { from: contractNodeRef.id, to: serviceNodeRef.id, type: RELATION_TYPES.SCOPES,    primary: true },
    { from: serviceNodeRef.id, to: activityNodeRef.id, type: RELATION_TYPES.REALIZED_BY, primary: true },
    { from: groupNodeRef.id,    to: activityNodeRef.id, type: RELATION_TYPES.SUPPORTS,  primary: true },
  ];

  rels.forEach((r) => {
    const relRef = doc(relationsCol(tenantId));
    batch.set(relRef, {
      fromId: r.from,
      toId: r.to,
      relationType: r.type,
      isPrimary: r.primary,
      allocation: null,
      effectiveFrom: today(),
      effectiveTo: null,
      attributes: {},
      status: "active",
      createdAt: serverTimestamp(),
      createdBy: actor(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();

  return {
    seeded: true,
    nodes: {
      company: companyNodeRef.id,
      site: siteNodeRef.id,
      contract: contractNodeRef.id,
      service: serviceNodeRef.id,
      activity: activityNodeRef.id,
      group: groupNodeRef.id,
    },
  };
};

export default {
  ensureTenant,
  getTenant,
  createNode,
  getNode,
  updateNode,
  retireNode,
  listNodes,
  createRelation,
  getRelation,
  closeRelation,
  listRelations,
  buildTree,
  getAncestryPath,
  createSetupSession,
  advanceSetupSession,
  seedKhulaReference,
};