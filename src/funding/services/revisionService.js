/**
 * funding/services/revisionService.js
 *
 * Revisions and version history for submissions.
 *
 * Brief §7 (p.58):
 *   "A revision creates a new version while retaining the old audit copy."
 *
 * A logical "chain" links every version of the same submission:
 *   fundingRequests/{requestId}/revisions/{chainId}        ← chain metadata
 *   opportunitySubmissions/{submissionId}                   ← one per version
 *
 * Each revision is stored with an idempotency key so retries don't double-create.
 */

import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, getDocs,
  serverTimestamp,
} from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { logEvent, AUDIT_ACTIONS } from "./auditService"

const SUBMISSIONS = "opportunitySubmissions"
const CHAINS = "submissionChains"

const guard = () => {
  const user = auth.currentUser
  if (!user) throw new Error("Not signed in")
  return user
}

/**
 * Given an existing submission, list every version in its chain.
 * Returns rows sorted oldest → newest.
 */
export const listVersionsInChain = async (chainId) => {
  guard()
  if (!chainId) return []
  const q = query(
    collection(db, SUBMISSIONS),
    where("chainId", "==", chainId)
  )
  const snap = await getDocs(q)
  const rows = snap.docs.map((d) => ({ submissionId: d.id, ...d.data() }))
  rows.sort((a, b) => (a.version || 1) - (b.version || 1))
  return rows
}

/**
 * Create a revision from a prior submission. The prior package is
 * preserved untouched; the new draft is seeded from it, marked as the
 * next version, and stored under the same chainId.
 *
 * Note: this creates a DRAFT record that the SME fills in before the
 * new submission is frozen. The freeze step replaces it with an
 * immutable snapshot.
 */
export const createRevisionDraft = async ({ priorSubmissionId, reason }) => {
  const user = guard()
  const priorSnap = await getDoc(doc(db, SUBMISSIONS, priorSubmissionId))
  if (!priorSnap.exists()) throw new Error("Prior submission not found")
  const prior = priorSnap.data()
  if (prior.smeId !== user.uid) throw new Error("Access denied")

  const idempotencyKey = `rev:${priorSubmissionId}:${Date.now()}`
  const chainId = prior.chainId || priorSubmissionId

  const ref = doc(collection(db, SUBMISSIONS))
  const nextVersion = (prior.version || 1) + 1

  const payload = {
    ...prior,
    submissionId: ref.id,
    version: nextVersion,
    chainId,
    status: "draft",
    isRevision: true,
    revisedFromSubmissionId: priorSubmissionId,
    revisedBy: user.uid,
    revisedAt: new Date().toISOString(),
    revisionReason: reason || null,
    idempotencyKey,
    frozenAt: null,
    frozenBy: null,
  }

  await setDoc(ref, payload)

  // Upsert the chain metadata (points at the head version).
  await setDoc(doc(db, CHAINS, chainId), {
    chainId,
    requestId: prior.requestId,
    opportunityId: prior.opportunityId,
    smeId: prior.smeId,
    funderId: prior.funderId,
    createdAt: serverTimestamp(),
    lastRevisedAt: serverTimestamp(),
    headVersion: nextVersion,
    headSubmissionId: ref.id,
  }, { merge: true })

  // Best-effort audit
  logEvent({
    action: AUDIT_ACTIONS.SUBMISSION_REVISED,
    resourceType: "opportunitySubmission",
    resourceId: ref.id,
    smeId: prior.smeId,
    funderId: prior.funderId,
    before: { version: prior.version, submissionId: priorSubmissionId },
    after:  { version: nextVersion, submissionId: ref.id },
    reason: reason || "Revision created",
  })

  return { submissionId: ref.id, version: nextVersion, chainId, payload }
}

/**
 * A revision is only frozen once the SME submits again. This is called
 * from the submission flow when a prior exists — it flips the draft into
 * an immutable snapshot.
 */
export const freezeRevision = async ({ draftSubmissionId, packagePayload }) => {
  const user = guard()
  const ref = doc(db, SUBMISSIONS, draftSubmissionId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error("Revision draft not found")
  if (snap.data().smeId !== user.uid) throw new Error("Access denied")

  const now = new Date().toISOString()
  await updateDoc(ref, {
    ...packagePayload,
    status: "submitted",
    frozenAt: now,
    frozenBy: user.uid,
  })

  logEvent({
    action: AUDIT_ACTIONS.SUBMISSION_CREATED,
    resourceType: "opportunitySubmission",
    resourceId: draftSubmissionId,
    smeId: snap.data().smeId,
    funderId: snap.data().funderId,
    after: { version: snap.data().version, status: "submitted" },
    reason: "Revision frozen and submitted",
  })

  return { ok: true, submissionId: draftSubmissionId, frozenAt: now }
}

export default { listVersionsInChain, createRevisionDraft, freezeRevision }