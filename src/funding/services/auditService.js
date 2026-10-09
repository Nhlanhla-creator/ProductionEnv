/**
 * funding/services/auditService.js
 *
 * Append-only audit trail. Every meaningful state transition writes one
 * document: who, when, what changed, and the reason.
 *
 * Brief §7 (p.58): "Record generation/download actor, time, recipient
 * scope and version." Brief §4 (p.44): "Record actor identity, action
 * time and source of any decline reason."
 */

import {
  doc, setDoc, collection, query, where, getDocs, orderBy, limit,
  serverTimestamp,
} from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"

const COLL = "fundingAuditLog"

export const AUDIT_ACTIONS = Object.freeze({
  // Profile + request
  PROFILE_FIELD_CORRECTED:   "profile.field_corrected",
  REQUEST_CREATED:           "request.created",
  REQUEST_ROUTE_CHANGED:     "request.route_changed",
  REQUEST_AMOUNT_CHANGED:    "request.amount_changed",
  REQUEST_RULES_CHANGED:     "request.rules_changed",
  // Opportunity dialog
  SUPPLEMENT_ANSWERED:       "supplement.answered",
  SUPPLEMENT_CONFIRMED:      "supplement.confirmed",
  EVIDENCE_ATTACHED:         "supplement.evidence_attached",
  WAIVER_REQUESTED:          "supplement.waiver_requested",
  // Submissions
  SUBMISSION_CREATED:        "submission.created",
  SUBMISSION_REVISED:        "submission.revised",
  SUBMISSION_DOWNLOADED_PDF: "submission.downloaded_pdf",
  SUBMISSION_DOWNLOADED_ZIP: "submission.downloaded_zip",
  DECISION_RECORDED:         "submission.decision_recorded",
})

const guard = () => {
  const user = auth.currentUser
  if (!user) throw new Error("Not signed in")
  return user
}

/**
 * Log one audit event. Fire-and-forget for the UI — never blocks a user
 * action on an audit write failure.
 */
export const logEvent = async ({
  action, resourceType, resourceId, smeId, funderId, before, after, reason, meta,
}) => {
  try {
    const user = guard()
    const ref = doc(collection(db, COLL))
    await setDoc(ref, {
      eventId: ref.id,
      action,
      resourceType,
      resourceId,
      smeId: smeId || (user.uid ? user.uid : null),
      funderId: funderId || null,
      actorId: user.uid,
      actorEmail: user.email || null,
      before: before ?? null,
      after: after ?? null,
      reason: reason || null,
      meta: meta || null,
      at: serverTimestamp(),
      atIso: new Date().toISOString(),
    })
    return { ok: true, eventId: ref.id }
  } catch (err) {
    console.warn("[auditService] log failed:", err?.message)
    return { ok: false, error: err?.message }
  }
}

export const listEventsForResource = async ({ resourceType, resourceId, pageSize = 50 }) => {
  guard()
  const q = query(
    collection(db, COLL),
    where("resourceType", "==", resourceType),
    where("resourceId", "==", resourceId),
    limit(pageSize)
  )
  const snap = await getDocs(q)
  const rows = snap.docs.map((d) => d.data())
  rows.sort((a, b) => (b.atIso || "").localeCompare(a.atIso || ""))
  return rows
}

export default { AUDIT_ACTIONS, logEvent, listEventsForResource }