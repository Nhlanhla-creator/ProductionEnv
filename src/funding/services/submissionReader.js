/**
 * funding/services/submissionReader.js
 *
 * Reads frozen submission packages.
 *
 * SME → their own submissions (fundingRequests → opportunitySubmissions).
 * Investor → only submissions addressed to their firm's funderId.
 *
 * Brief §7, p.57: "SME may retrieve its own versions; investor may
 * retrieve only its submitted package within its role and consent."
 */

import {
  doc, getDoc,
  collection, query, where, getDocs, orderBy, limit,
} from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { listFirmSubmissions } from "./apiClient"

const COLL = "opportunitySubmissions"

const guard = () => {
  const user = auth.currentUser
  if (!user) throw new Error("Not signed in")
  return user
}

// ── Load one submission ─────────────────────────────────────────────────
export const loadSubmission = async (submissionId) => {
  const user = guard()
  const snap = await getDoc(doc(db, COLL, submissionId))
  if (!snap.exists()) return null
  const data = snap.data()
  // Access gate — mirrors the Firestore rule
  const allowed = data.smeId === user.uid || data.funderId === user.uid
  if (!allowed) throw new Error("Access denied")
  return { submissionId: snap.id, ...data }
}

// ── SME side: list my submissions ───────────────────────────────────────
export const listMySubmissions = async ({ pageSize = 50 } = {}) => {
  const user = guard()
  const q = query(
    collection(db, COLL),
    where("smeId", "==", user.uid),
    limit(pageSize)
  )
  const snap = await getDocs(q)
  const rows = snap.docs.map((d) => ({ submissionId: d.id, ...d.data() }))
  rows.sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""))
  return rows
}

// ── Investor side: list submissions for a firm ──────────────────────────
export const listSubmissionsForFirm = async (firmId) => {
  const user = guard()
  // Try API first (backend may rank/filter server-side)
  try {
    const res = await listFirmSubmissions(firmId)
    if (res?.rows) return res.rows
  } catch { /* fall through to Firestore */ }

  const q = query(
    collection(db, COLL),
    where("funderId", "==", user.uid)
  )
  const snap = await getDocs(q)
  const rows = snap.docs.map((d) => ({ submissionId: d.id, ...d.data() }))
  rows.sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""))
  return rows
}

// ── Evidence index from a submission ────────────────────────────────────
export const getEvidenceIndex = (submission) => {
  const refs = submission?.evidenceRefs || {}
  return Object.entries(refs).map(([ruleId, ref]) => ({
    ruleId,
    vaultDocId: ref.vaultDocId || null,
    name: ref.name || "Evidence file",
    type: ref.type || "unknown",
    period: ref.period || null,
    status: ref.status || "uploaded",
    size: ref.size || null,
    attachedAt: ref.attachedAt || null,
  }))
}

// ── Score bridge references ─────────────────────────────────────────────
export const getScoreRefs = (submission) => submission?.scoreRefs || {}

export default {
  loadSubmission,
  listMySubmissions,
  listSubmissionsForFirm,
  getEvidenceIndex,
  getScoreRefs,
}