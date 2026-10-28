/** Tenant-owned drafts and immutable published versions. Permissions belong in Firestore rules. */
import { db, auth } from '../../firebaseConfig';
import { collection, doc, getDoc, getDocs, runTransaction } from 'firebase/firestore';
import { seedCodes, validateCodes, TEMPLATE_VERSION } from '../models/downtimeCodes';

export const masterRef = (tenantId, id) =>
  doc(db, 'digitalTwinTenants', tenantId, 'downtimeMasterLists', id);

const mastersCol = tenantId =>
  collection(db, 'digitalTwinTenants', tenantId, 'downtimeMasterLists');

/**
 * Rules require EXACTLY { uid, email } — no extra keys, no undefined.
 * `dtActor()` in the ruleset checks keys().hasOnly(['uid','email']).
 */
export const downtimeActor = () => {
  const u = auth.currentUser;
  if (!u) throw new Error('Sign in to change downtime data.');
  // Do NOT add displayName / photoURL / tenantId etc — rules will deny.
  const actor = { uid: u.uid, email: u.email || null };
  // Strip undefined (Firestore rejects undefined in some SDKs / silently drops
  // in others, which breaks deep-equality checks in the rules).
  if (actor.email === undefined) actor.email = null;
  return actor;
};

export async function listDowntimeMasters(tenantId) {
  if (!tenantId) return [];
  const snap = await getDocs(mastersCol(tenantId));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

function validateDraft(draft, previous, templateId, publishing) {
  if (!draft.name?.trim() || draft.name.length > 120)
    throw new Error('A master list name of 1–120 characters is required.');
  if (!draft.industry?.trim())
    throw new Error('Industry is required.');
  const a = draft.assignment;
  if (
    !a ||
    typeof a.allAssets !== 'boolean' ||
    !Array.isArray(a.equipmentTypeIds) ||
    !Array.isArray(a.groupIds) ||
    [...a.equipmentTypeIds, ...a.groupIds].some(
      v => typeof v !== 'string' || !v.trim(),
    )
  )
    throw new Error('Invalid asset assignment.');
  if (
    publishing &&
    !a.allAssets &&
    !a.equipmentTypeIds.length &&
    !a.groupIds.length
  )
    throw new Error(
      'Assign at least one asset type/group, or explicitly choose all assets.',
    );
  validateCodes(draft.nodes, previous, templateId, publishing);
}

function checkSize(value) {
  if (new TextEncoder().encode(JSON.stringify(value)).length > 750000)
    throw new Error('Master list is too large. Split it into smaller lists.');
}

/**
 * Normalise a draft so what we write to `master.draft` is BYTE-IDENTICAL to
 * what we write to `validation/system.nodes`. Any divergence fails
 * `dtTemplateProof`'s deep-equality check.
 *
 * Rules key set (dtDraft / dtPublishedFields):
 *   draft:     keys().hasOnly(['name','industry','nodes','assignment'])
 *   published: keys().hasOnly(['name','industry','nodes','assignment',
 *                              'version','publishedAt','publishedBy'])
 */
function normaliseDraft(draft) {
  return {
    name: String(draft.name),
    industry: String(draft.industry),
    // Clone the nodes so any later mutation can't desync guard vs master.
    nodes: draft.nodes.map(n => ({
      id: n.id,
      parentId: n.parentId ?? null,       // rules require null (not undefined)
      level: Number(n.level),
      label: n.label,
      canonicalId: n.canonicalId ?? null,
      standardLabel: n.standardLabel ?? null,
      origin: n.origin,
      active: Boolean(n.active),
      terminal: Boolean(n.terminal),
      sortOrder: Number(n.sortOrder),
    })),
    assignment: {
      allAssets: Boolean(draft.assignment.allAssets),
      equipmentTypeIds: [...draft.assignment.equipmentTypeIds],
      groupIds: [...draft.assignment.groupIds],
    },
  };
}

/**
 * Build a published map with EXACTLY the keys `dtPublishedFields` allows.
 * Do NOT spread `draft` — that would leak any future field and deny the write.
 */
function buildPublished(draft, version, now, actor) {
  return {
    name: draft.name,
    industry: draft.industry,
    nodes: draft.nodes,           // same array reference as master.draft.nodes
    assignment: draft.assignment, // same object reference as master.draft.assignment
    version: Number(version),
    publishedAt: now,             // ISO string; must === master.updatedAt
    publishedBy: { uid: actor.uid, email: actor.email }, // must === master.updatedBy
  };
}

/**
 * Firestore caps rule evaluation per write. The system snapshot protects
 * Levels 1–2; two Mining snapshots protect the standard Level 3 identities.
 * Rules bind each complete node list and revision to the same atomic parent write.
 *
 * IMPORTANT: `guard.nodes` MUST be the SAME array reference as
 * `value.draft.nodes`, and `guard.revision` MUST be `value.revision`.
 * Using `structuredClone` here would be fine too, but we pass the reference
 * to guarantee byte-identical serialization.
 */
function writeTemplateValidation(tx, ref, value) {
  const guard = { revision: value.revision, nodes: value.draft.nodes };
  tx.set(doc(ref, 'validation', 'system'), guard);
  if (value.templateId === TEMPLATE_VERSION) {
    // Rules only allow mining-a / mining-b when parent.templateId === 'mining-mobile-1'.
    // Never write these for custom-industry-1 — dtTemplateGuard would deny.
    tx.set(doc(ref, 'validation', 'mining-a'), guard);
    tx.set(doc(ref, 'validation', 'mining-b'), guard);
  }
}

export async function createDowntimeMaster(
  tenantId,
  { name, industry = 'Mining', mining = true },
) {
  if (!tenantId) throw new Error('An organisation is required.');
  const actor = downtimeActor();
  const ref = doc(mastersCol(tenantId));
  const now = new Date().toISOString();

  const rawDraft = {
    name: name.trim(),
    industry: industry.trim(),
    nodes: seedCodes(mining),
    assignment: { allAssets: false, equipmentTypeIds: [], groupIds: [] },
  };
  const templateId = mining ? TEMPLATE_VERSION : 'custom-industry-1';
  validateDraft(rawDraft, [], templateId, false);

  // Normalise ONCE — the same object is used for guard, master, and audit.
  const draft = normaliseDraft(rawDraft);

  const value = {
    tenantId,
    templateId,
    revision: 1,
    draft,
    published: null,
    createdAt: now,
    createdBy: actor,
    updatedAt: now,
    updatedBy: actor,
  };

  await runTransaction(db, async tx => {
    tx.set(ref, value);
    writeTemplateValidation(tx, ref, value);
    tx.set(doc(collection(ref, 'auditLog')), {
      action: 'created',
      actor,
      at: now,
      revision: 1,
      // Rules require `before == null` on create, `after == master.draft`.
      // Use the EXACT same `draft` reference we wrote to `ref`.
      before: null,
      after: draft,
    });
  });

  return { ...value, id: ref.id };
}

export async function saveDowntimeMaster(
  tenantId,
  id,
  rawDraft,
  expectedRevision,
  { publish = false } = {},
) {
  const actor = downtimeActor();
  const ref = masterRef(tenantId, id);

  return runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Master list no longer exists.');
    const old = snap.data();
    if (old.revision !== expectedRevision)
      throw new Error('Another user changed this list. Reload before saving.');

    validateDraft(rawDraft, old.draft.nodes, old.templateId, publish);

    // Normalise ONCE — same reference feeds guard, master, and audit.
    const draft = normaliseDraft(rawDraft);

    const now = new Date().toISOString();
    const revision = old.revision + 1;

    const nextVersion = (old.published?.version || 0) + 1;
    const published = publish
      ? buildPublished(draft, nextVersion, now, actor)
      : old.published;

    // Detect whether `published` actually changed so the audit `action`
    // matches what the rules will recompute from the diff:
    //   action = (after.published == before.published ? 'draft_saved' : 'published')
    const publishedChanged =
      JSON.stringify(published) !== JSON.stringify(old.published ?? null);

    const value = {
      ...old,          // keeps tenantId, templateId, createdAt, createdBy
      draft,
      published,
      revision,
      updatedAt: now,
      updatedBy: actor,
    };

    checkSize(value);

    tx.set(ref, value);
    writeTemplateValidation(tx, ref, value);

    // Audit action is derived from the actual diff, not the `publish` flag.
    // If they disagree, the rules will deny.
    const action = publishedChanged ? 'published' : 'draft_saved';

    tx.set(doc(collection(ref, 'auditLog')), {
      action,
      actor,
      at: now,
      revision,
      before: old.draft,
      after: draft,     // EXACT same reference written to ref.draft
    });

    if (publishedChanged) {
      // Rules require versionId === String(published.version) and the doc
      // body to be === the master's `published` map. We pass the SAME object.
      tx.set(doc(ref, 'versions', String(published.version)), published);
    }

    return { ...value, id };
  });
}

export async function getDowntimeAudit(tenantId, masterId) {
  const snap = await getDocs(
    collection(masterRef(tenantId, masterId), 'auditLog'),
  );
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => b.revision - a.revision);
}

export async function getDowntimeMaster(tenantId, id) {
  const snap = await getDoc(masterRef(tenantId, id));
  return snap.exists() ? { ...snap.data(), id: snap.id } : null;
}