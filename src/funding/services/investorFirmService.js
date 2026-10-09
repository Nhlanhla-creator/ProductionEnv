/**
 * funding/services/investorFirmService.js
 *
 * Firestore CRUD for the firm → programme → opportunity hierarchy.
 *
 * Path:
 *   investorFirms/{firmId}
 *     programmes/{programmeId}
 *       opportunities/{opportunityId}
 *         requirementRules/{ruleId}
 */

import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs, orderBy,
  serverTimestamp,
} from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import {
  createEmptyFirm, createEmptyProgramme, createEmptyOpportunity,
} from "../models/investorFirm"

const FIRMS = "investorFirms"

const guard = () => {
  const user = auth.currentUser
  if (!user) throw new Error("Not signed in")
  return user
}

// ── Firms ────────────────────────────────────────────────────────────────
export const listMyFirms = async () => {
  const user = guard()
  const q = query(collection(db, FIRMS), where("ownerId", "==", user.uid))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ firmId: d.id, ...d.data() }))
}

export const createFirm = async () => {
  const user = guard()
  const ref = doc(collection(db, FIRMS))
  const payload = {
    ...createEmptyFirm({ userId: user.uid, userEmail: user.email }),
    firmId: ref.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, payload)
  return { ...payload, firmId: ref.id }
}

export const loadFirm = async (firmId) => {
  guard()
  const snap = await getDoc(doc(db, FIRMS, firmId))
  if (!snap.exists()) return null
  return { firmId: snap.id, ...snap.data() }
}

export const saveFirm = async (firmId, patch) => {
  const user = guard()
  const ref = doc(db, FIRMS, firmId)
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp(), updatedBy: user.uid })
  return { ok: true }
}

export const deleteFirm = async (firmId) => {
  guard()
  await deleteDoc(doc(db, FIRMS, firmId))
  return { ok: true }
}

// ── Programmes ───────────────────────────────────────────────────────────
export const listProgrammes = async (firmId) => {
  guard()
  const q = query(collection(db, FIRMS, firmId, "programmes"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ programmeId: d.id, firmId, ...d.data() }))
}

export const createProgramme = async (firmId) => {
  const user = guard()
  const ref = doc(collection(db, FIRMS, firmId, "programmes"))
  const payload = {
    ...createEmptyProgramme({ firmId, userId: user.uid }),
    programmeId: ref.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, payload)
  return { ...payload, programmeId: ref.id, firmId }
}

export const loadProgramme = async (firmId, programmeId) => {
  guard()
  const snap = await getDoc(doc(db, FIRMS, firmId, "programmes", programmeId))
  if (!snap.exists()) return null
  return { programmeId: snap.id, firmId, ...snap.data() }
}

export const saveProgramme = async (firmId, programmeId, patch) => {
  const user = guard()
  await updateDoc(doc(db, FIRMS, firmId, "programmes", programmeId), {
    ...patch, updatedAt: serverTimestamp(), updatedBy: user.uid,
  })
  return { ok: true }
}

export const deleteProgramme = async (firmId, programmeId) => {
  guard()
  await deleteDoc(doc(db, FIRMS, firmId, "programmes", programmeId))
  return { ok: true }
}

// ── Opportunities ────────────────────────────────────────────────────────
export const listOpportunities = async (firmId, programmeId) => {
  guard()
  const q = query(collection(db, FIRMS, firmId, "programmes", programmeId, "opportunities"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ opportunityId: d.id, firmId, programmeId, ...d.data() }))
}

export const createOpportunity = async (firmId, programmeId) => {
  const user = guard()
  const ref = doc(collection(db, FIRMS, firmId, "programmes", programmeId, "opportunities"))
  const payload = {
    ...createEmptyOpportunity({ firmId, programmeId, userId: user.uid }),
    opportunityId: ref.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, payload)
  return { ...payload, opportunityId: ref.id, firmId, programmeId }
}

export const loadOpportunity = async (firmId, programmeId, opportunityId) => {
  guard()
  const snap = await getDoc(doc(db, FIRMS, firmId, "programmes", programmeId, "opportunities", opportunityId))
  if (!snap.exists()) return null
  return { opportunityId: snap.id, firmId, programmeId, ...snap.data() }
}

export const saveOpportunity = async (firmId, programmeId, opportunityId, patch) => {
  const user = guard()
  await updateDoc(
    doc(db, FIRMS, firmId, "programmes", programmeId, "opportunities", opportunityId),
    { ...patch, updatedAt: serverTimestamp(), updatedBy: user.uid }
  )
  return { ok: true }
}

export const publishOpportunity = async (firmId, programmeId, opportunityId, { approvedBy }) => {
  const user = guard()
  const ref = doc(db, FIRMS, firmId, "programmes", programmeId, "opportunities", opportunityId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error("Opportunity not found")
  const current = snap.data()
  const nextVersion = (current.version || 1) + 1

  await updateDoc(ref, {
    status: "published",
    publishedVersion: nextVersion,
    publishedAt: serverTimestamp(),
    publishedBy: approvedBy || user.uid,
    version: nextVersion,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
  })
  return { ok: true, publishedVersion: nextVersion }
}

// ── Requirement rules (subcollection of opportunity) ─────────────────────
export const listRequirementRules = async (firmId, programmeId, opportunityId) => {
  guard()
  const q = query(
    collection(db, FIRMS, firmId, "programmes", programmeId, "opportunities", opportunityId, "requirementRules")
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ ruleId: d.id, ...d.data() }))
}

export const upsertRequirementRule = async (firmId, programmeId, opportunityId, rule) => {
  guard()
  const rulesRef = collection(
    db, FIRMS, firmId, "programmes", programmeId, "opportunities", opportunityId, "requirementRules"
  )
  const ref = rule.ruleId ? doc(rulesRef, rule.ruleId) : doc(rulesRef)
  const payload = { ...rule, ruleId: ref.id, updatedAt: serverTimestamp() }
  await setDoc(ref, payload, { merge: true })
  return payload
}

export const deleteRequirementRule = async (firmId, programmeId, opportunityId, ruleId) => {
  guard()
  await deleteDoc(
    doc(db, FIRMS, firmId, "programmes", programmeId, "opportunities", opportunityId, "requirementRules", ruleId)
  )
  return { ok: true }
}

export default {
  listMyFirms, createFirm, loadFirm, saveFirm, deleteFirm,
  listProgrammes, createProgramme, loadProgramme, saveProgramme, deleteProgramme,
  listOpportunities, createOpportunity, loadOpportunity, saveOpportunity, publishOpportunity,
  listRequirementRules, upsertRequirementRule, deleteRequirementRule,
}