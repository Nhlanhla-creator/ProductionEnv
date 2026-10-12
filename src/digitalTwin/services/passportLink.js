/**
 * digitalTwin/services/passportLink.js
 *
 * Passport / BIG Verified sync (Brief Sections 10, 13.5).
 *
 * The Passport and BIG Verified modules own people, credential and
 * verification records. This service:
 *   1. Reads those records (via injection — no direct coupling)
 *   2. Produces a Passport-ready readiness snapshot per delivery context
 *   3. Writes verification status back onto the twin's nodes and assets
 *   4. Publishes readiness state to the twin for capacity calculations
 *
 * Design principle: the twin NEVER duplicates Passport data. It stores a
 * reference to the source record and reflects its current status only when
 * the caller supplies a fresh snapshot.
 */

import { db, auth } from "../../firebaseConfig";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, limit,
} from "firebase/firestore";
import { listNodes } from "./hierarchyService";
import { listResources } from "./resourceService";
import { NODE_TYPES, ASSET_STATUS } from "../models/enums";

const nowIso = () => new Date().toISOString();
const today = () => nowIso().split("T")[0];
const actor = () => {
  const u = auth.currentUser;
  return u ? { uid: u.uid, email: u.email } : { uid: "system", email: null };
};

const snapshotsCol = (tenantId) => collection(db, "digitalTwinTenants", tenantId, "passportSnapshots");
const snapshotRef  = (tenantId, id) => doc(db, "digitalTwinTenants", tenantId, "passportSnapshots", id);

// ── Snapshot lifecycle ───────────────────────────────────────────────────

/**
 * Write a Passport readiness snapshot for a scope. Snapshots are
 * append-only — every call creates a new version. The latest snapshot for a
 * scope is the current truth.
 *
 * Input shape:
 *   {
 *     scope: { siteId?, contractId?, serviceId?, activityId? },
 *     credentials: [{ personId, name, role, credentials: [{type, validUntil, issuer}], valid: bool }],
 *     assets: [{ assetId, verified: bool, evidence: [...] }],
 *     compliance: { items: [{ name, status: "valid"|"expired"|"pending", evidenceUrl }] },
 *     bigScore: { value: number, tierName: string, verifiedAt: string } | null
 *   }
 */
export const publishPassportSnapshot = async (tenantId, input) => {
  if (!tenantId) throw new Error("tenantId is required");
  if (!input?.scope) throw new Error("scope is required");

  const ref = doc(snapshotsCol(tenantId));
  const payload = {
    snapshotId: ref.id,
    tenantId,
    scope: input.scope,
    credentials: sanitiseCredentials(input.credentials || []),
    assets: sanitiseAssets(input.assets || []),
    compliance: sanitiseCompliance(input.compliance || {}),
    bigScore: input.bigScore || null,
    readinessScore: computeReadiness(payload0(input)),
    publishedAt: nowIso(),
    publishedBy: actor(),
  };
  // Recompute readiness using the sanitised values
  payload.readinessScore = computeReadiness(payload);

  await setDoc(ref, payload);
  await applySnapshotToTwin(tenantId, payload);
  return payload;
};

const payload0 = (input) => ({ credentials: input.credentials, assets: input.assets, compliance: input.compliance });

const sanitiseCredentials = (list) => list.map((c) => ({
  personId: c.personId || null,
  name: c.name || "",
  role: c.role || "",
  credentials: (c.credentials || []).map((cr) => ({
    type: cr.type || "",
    validUntil: cr.validUntil || null,
    issuer: cr.issuer || "",
    evidenceUrl: cr.evidenceUrl || "",
    status: computeCredentialStatus(cr.validUntil),
  })),
  valid: c.valid !== undefined ? !!c.valid : (c.credentials || []).every((cr) => computeCredentialStatus(cr.validUntil) === "valid"),
}));

const sanitiseAssets = (list) => list.map((a) => ({
  assetId: a.assetId || null,
  verified: !!a.verified,
  evidence: a.evidence || [],
  lastChecked: a.lastChecked || null,
}));

const sanitiseCompliance = (c) => ({
  items: (c.items || []).map((i) => ({
    name: i.name || "",
    status: i.status || "pending",
    evidenceUrl: i.evidenceUrl || "",
    expiryDate: i.expiryDate || null,
  })),
});

const computeCredentialStatus = (validUntil) => {
  if (!validUntil) return "pending";
  const d = new Date(validUntil).getTime();
  if (Number.isNaN(d)) return "pending";
  if (d < Date.now()) return "expired";
  // Warn if expiring within 30 days
  const thirtyDays = 30 * 24 * 3600 * 1000;
  if (d < Date.now() + thirtyDays) return "expiring_soon";
  return "valid";
};

const computeReadiness = (payload) => {
  const parts = [];

  // Credentials component
  const creds = payload.credentials || [];
  const validCreds = creds.filter((c) => c.valid).length;
  parts.push(creds.length ? validCreds / creds.length : 1);

  // Assets component
  const assets = payload.assets || [];
  const verifiedAssets = assets.filter((a) => a.verified).length;
  parts.push(assets.length ? verifiedAssets / assets.length : 1);

  // Compliance component
  const items = payload.compliance?.items || [];
  const validItems = items.filter((i) => i.status === "valid").length;
  parts.push(items.length ? validItems / items.length : 1);

  const avg = parts.reduce((s, v) => s + v, 0) / parts.length;
  return {
    overall: Math.round(avg * 100),
    components: {
      credentials: Math.round((parts[0] ?? 0) * 100),
      assets: Math.round((parts[1] ?? 0) * 100),
      compliance: Math.round((parts[2] ?? 0) * 100),
    },
    computedAt: nowIso(),
  };
};

// ── Apply snapshot side effects on the twin ──────────────────────────────

/**
 * Reflect the Passport snapshot back onto the twin. This does NOT overwrite
 * asset master fields — it only updates the `compliance` side-channel:
 *   - marks asset.siteEligibility against the current scope
 *   - updates the twin's evidenceStatus on affected assets
 */
const applySnapshotToTwin = async (tenantId, snapshot) => {
  const { scope, assets } = snapshot;
  if (!scope || !assets?.length) return;

  // Read the target scope's asset list
  const filter = {};
  if (scope.siteId) filter.siteId = scope.siteId;
  if (scope.contractId) filter.contractId = scope.contractId;
  if (scope.groupId) filter.groupId = scope.groupId;

  for (const snapAsset of assets) {
    if (!snapAsset.assetId) continue;
    try {
      const ref = doc(db, "digitalTwinTenants", tenantId, "resources", snapAsset.assetId);
      const existing = await getDoc(ref);
      if (!existing.exists()) continue;
      await updateDoc(ref, {
        evidenceStatus: snapAsset.verified ? "verified" : "pending",
        "compliance.passportCheckedAt": snapAsset.lastChecked || nowIso(),
        "compliance.passportEvidenceCount": (snapAsset.evidence || []).length,
        updatedAt: nowIso(),
        updatedBy: actor(),
      });
    } catch (err) {
      console.warn("applySnapshotToTwin: asset update failed:", err?.message);
    }
  }
};

// ── Latest snapshot retrieval ────────────────────────────────────────────

export const getLatestPassportSnapshot = async (tenantId, scope) => {
  if (!tenantId) return null;
  const filters = [];
  if (scope?.siteId)     filters.push(where("scope.siteId", "==", scope.siteId));
  if (scope?.contractId) filters.push(where("scope.contractId", "==", scope.contractId));
  if (scope?.serviceId)  filters.push(where("scope.serviceId", "==", scope.serviceId));
  if (scope?.activityId) filters.push(where("scope.activityId", "==", scope.activityId));

  const q = filters.length
    ? query(snapshotsCol(tenantId), ...filters, limit(200))
    : query(snapshotsCol(tenantId), limit(200));

  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  rows.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  return rows[0] || null;
};

export const listPassportSnapshots = async (tenantId, { pageSize = 100 } = {}) => {
  const q = query(snapshotsCol(tenantId), limit(pageSize));
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return rows.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
};

// ── Readiness roll-up across a hierarchy ─────────────────────────────────

/**
 * Return the Passport readiness score at every level of a site or contract
 * hierarchy — used by the Capacity & Readiness panel and by opportunity
 * matching.
 */
export const readinessForHierarchy = async (tenantId, { rootNodeId }) => {
  const nodes = await listNodes(tenantId, { status: "active" });
  const results = [];

  const walk = async (nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const snap = await getLatestPassportSnapshot(tenantId, {
      siteId: node.nodeType === NODE_TYPES.SITE ? node.id : null,
      contractId: node.nodeType === NODE_TYPES.CONTRACT ? node.id : null,
    });
    results.push({
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.nodeType,
      readiness: snap?.readinessScore || null,
    });
  };

  await walk(rootNodeId);
  return results;
};

// ── Verification status write-back (from external verifier) ──────────────

/**
 * Mark an asset or person as verified — used by the External Verifier role.
 * Only updates the evidence status on the twin — does not mutate the
 * source Passport record.
 */
export const setVerificationStatus = async (tenantId, { assetId, status, note = "", evidenceUrl = "" }) => {
  if (!assetId || !status) throw new Error("assetId and status are required");
  const ref = doc(db, "digitalTwinTenants", tenantId, "resources", assetId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error(`Asset not found: ${assetId}`);
  await updateDoc(ref, {
    evidenceStatus: status,
    "compliance.verificationNote": note,
    "compliance.verificationEvidence": evidenceUrl,
    "compliance.verifiedAt": nowIso(),
    "compliance.verifiedBy": actor(),
    updatedAt: nowIso(),
    updatedBy: actor(),
  });
  return { ok: true };
};

export default {
  publishPassportSnapshot,
  getLatestPassportSnapshot,
  listPassportSnapshots,
  readinessForHierarchy,
  setVerificationStatus,
};