/**
 * funding/services/scoringProfileService.js
 *
 * Firestore CRUD for investor scoring profiles.
 *
 * A scoring profile is a SEPARATE object from the mandate/requirements
 * (Brief §4, p.43). It is approved by admin before it can be used.
 */

import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, getDocs,
  serverTimestamp,
} from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { createEmptyScoringProfile, SCORING_PROFILE_STATUS } from "../models/scoringProfile"

const COLL = "investorScoringProfiles"

const guard = () => {
  const user = auth.currentUser
  if (!user) throw new Error("Not signed in")
  return user
}

export const listProfilesForFirm = async (firmId) => {
  guard()
  const q = query(collection(db, COLL), where("firmId", "==", firmId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ profileId: d.id, ...d.data() }))
}

export const loadProfile = async (profileId) => {
  guard()
  const snap = await getDoc(doc(db, COLL, profileId))
  if (!snap.exists()) return null
  return { profileId: snap.id, ...snap.data() }
}

export const createProfile = async ({ firmId, opportunityId }) => {
  const user = guard()
  const ref = doc(collection(db, COLL))
  const payload = {
    ...createEmptyScoringProfile({ firmId, opportunityId, userId: user.uid }),
    profileId: ref.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, payload)
  return payload
}

export const saveProfile = async (profileId, patch) => {
  const user = guard()
  await updateDoc(doc(db, COLL, profileId), { ...patch, updatedAt: serverTimestamp(), updatedBy: user.uid })
  return { ok: true }
}

/**
 * Admin-only: approve a scoring profile. Sets status=approved and records
 * the approver + timestamp. Once approved, the profile is immutable unless
 * a new version is created (Brief §11).
 */
export const approveProfile = async (profileId, { approverId }) => {
  guard()
  await updateDoc(doc(db, COLL, profileId), {
    status: SCORING_PROFILE_STATUS.APPROVED,
    approvedBy: approverId,
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { ok: true }
}

export default {
  listProfilesForFirm, loadProfile, createProfile, saveProfile, approveProfile,
}