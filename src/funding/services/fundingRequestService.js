/**
 * funding/services/fundingRequestService.js
 *
 * Firestore CRUD for funding requests. Direct (no backend API) — matches
 * the pattern used by the existing FundingApplication module.
 *
 * A request is always scoped to its owning SME. Firestore rules in your
 * project already enforce that a user can only touch their own documents.
 */

import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, getDocs, limit,
  serverTimestamp,
} from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { createEmptyFundingRequest, REQUEST_STATUS } from "../models/fundingRequest"

const COLLECTION = "fundingRequests"

export const createRequest = async () => {
  const user = auth.currentUser
  if (!user) throw new Error("Not signed in")

  const ref = doc(collection(db, COLLECTION))
  const payload = {
    ...createEmptyFundingRequest({ userId: user.uid, userEmail: user.email }),
    requestId: ref.id,
    status: REQUEST_STATUS.DRAFT,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, payload)
  return {
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export const loadRequest = async (requestId) => {
  const user = auth.currentUser
  if (!user) throw new Error("Not signed in")
  const ref = doc(db, COLLECTION, requestId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data()
  if (data.userId !== user.uid) throw new Error("Access denied")
  return { ...data, requestId: snap.id }
}

export const saveRequest = async (requestId, patch) => {
  const user = auth.currentUser
  if (!user) throw new Error("Not signed in")
  const ref = doc(db, COLLECTION, requestId)
  const current = await getDoc(ref)
  if (!current.exists()) throw new Error("Request not found")
  if (current.data().userId !== user.uid) throw new Error("Access denied")
  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
    version: (current.data().version || 1) + 1,
  })
  return { ok: true, savedAt: new Date().toISOString() }
}

export const listMyRequests = async ({ pageSize = 50 } = {}) => {
  const user = auth.currentUser
  if (!user) return []
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", user.uid),
    limit(pageSize)
  )
  const snap = await getDocs(q)
  const rows = snap.docs.map((d) => ({ requestId: d.id, ...d.data() }))
  rows.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
  return rows
}

export default {
  createRequest,
  loadRequest,
  saveRequest,
  listMyRequests,
}