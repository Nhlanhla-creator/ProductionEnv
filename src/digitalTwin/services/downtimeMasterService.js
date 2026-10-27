/** Tenant-owned drafts and immutable published versions. Permissions belong in Firestore rules. */
import { db, auth } from '../../firebaseConfig';
import { collection, doc, getDoc, getDocs, runTransaction } from 'firebase/firestore';
import { seedCodes, validateCodes, TEMPLATE_VERSION } from '../models/downtimeCodes';
export const masterRef = (tenantId,id) => doc(db,'digitalTwinTenants',tenantId,'downtimeMasterLists',id);
const mastersCol = tenantId => collection(db,'digitalTwinTenants',tenantId,'downtimeMasterLists');
export const downtimeActor = () => {
  if (!auth.currentUser) throw new Error('Sign in to change downtime data.');
  return { uid: auth.currentUser.uid, email: auth.currentUser.email || null };
};
export async function listDowntimeMasters(tenantId) {
  if (!tenantId) return [];
  const snap = await getDocs(mastersCol(tenantId));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}
function validateDraft(draft,previous,templateId,publishing) {
  if (!draft.name?.trim() || draft.name.length > 120) throw new Error('A master list name of 1–120 characters is required.');
  if (!draft.industry?.trim()) throw new Error('Industry is required.');
  const a = draft.assignment;
  if (!a || typeof a.allAssets !== 'boolean' || !Array.isArray(a.equipmentTypeIds) || !Array.isArray(a.groupIds) ||
      [...a.equipmentTypeIds,...a.groupIds].some(v => typeof v !== 'string' || !v.trim())) throw new Error('Invalid asset assignment.');
  if (publishing && !a.allAssets && !a.equipmentTypeIds.length && !a.groupIds.length) throw new Error('Assign at least one asset type/group, or explicitly choose all assets.');
  validateCodes(draft.nodes,previous,templateId,publishing);
}
function checkSize(value) {
  if (new TextEncoder().encode(JSON.stringify(value)).length > 750000) throw new Error('Master list is too large. Split it into smaller lists.');
}
export async function createDowntimeMaster(tenantId,{ name, industry = 'Mining', mining = true }) {
  if (!tenantId) throw new Error('An organisation is required.');
  const actor = downtimeActor(), ref = doc(mastersCol(tenantId)), now = new Date().toISOString();
  const draft = { name: name.trim(), industry: industry.trim(), nodes: seedCodes(mining),
    assignment: { allAssets: false, equipmentTypeIds: [], groupIds: [] } };
  const templateId = mining ? TEMPLATE_VERSION : 'custom-industry-1';
  validateDraft(draft,[],templateId,false);
  const value = { tenantId, templateId, revision: 1, draft, published: null,
    createdAt: now, createdBy: actor, updatedAt: now, updatedBy: actor };
  await runTransaction(db,async tx => {
    tx.set(ref,value);
    tx.set(doc(collection(ref,'auditLog')),{ action:'created', actor, at:now, revision:1, after:draft });
  });
  return { ...value,id:ref.id };
}
export async function saveDowntimeMaster(tenantId,id,draft,expectedRevision,{ publish = false } = {}) {
  const actor = downtimeActor(), ref = masterRef(tenantId,id);
  return runTransaction(db,async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Master list no longer exists.');
    const old = snap.data();
    if (old.revision !== expectedRevision) throw new Error('Another user changed this list. Reload before saving.');
    validateDraft(draft,old.draft.nodes,old.templateId,publish);
    const now = new Date().toISOString(), revision = old.revision+1;
    const published = publish ? { ...draft, version: (old.published?.version || 0)+1, publishedAt:now, publishedBy:actor } : old.published;
    const value = { ...old,draft,published,revision,updatedAt:now,updatedBy:actor };
    checkSize(value);
    tx.set(ref,value);
    tx.set(doc(collection(ref,'auditLog')),{ action:publish ? 'published' : 'draft_saved',actor,at:now,revision,before:old.draft,after:draft });
    if (publish) tx.set(doc(ref,'versions',String(published.version)),published);
    return { ...value,id };
  });
}
export async function getDowntimeAudit(tenantId,masterId) {
  const snap = await getDocs(collection(masterRef(tenantId,masterId),'auditLog'));
  return snap.docs.map(d => ({ id:d.id,...d.data() })).sort((a,b) => b.revision-a.revision);
}
export async function getDowntimeMaster(tenantId,id) {
  const snap = await getDoc(masterRef(tenantId,id));
  return snap.exists() ? { ...snap.data(),id:snap.id } : null;
}
