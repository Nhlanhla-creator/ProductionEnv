/**
 * funding/services/submissionService.js
 *
 * - Supplement draft persistence (Firestore direct)
 * - Submission package assembly (Brief §7, p.55-56)
 * - Freeze + submit via apiClient (Brief §8, p.65)
 *
 * Draft path:   fundingRequests/{requestId}/supplementDrafts/{opportunityId}
 * Submission:   opportunitySubmissions/{submissionId}   (created by the backend)
 */

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { freezeSubmission as apiFreeze, listLiveSubmissions as apiListLive } from "./apiClient"

const guard = () => {
  const user = auth.currentUser
  if (!user) throw new Error("Not signed in")
  return user
}

// ── Supplement draft ────────────────────────────────────────────────────
const draftRef = (requestId, opportunityId) =>
  doc(db, "fundingRequests", requestId, "supplementDrafts", opportunityId)

export const loadSupplementDraft = async (requestId, opportunityId) => {
  guard()
  const snap = await getDoc(draftRef(requestId, opportunityId))
  if (!snap.exists()) {
    return {
      requestId,
      opportunityId,
      answers: {},          // ruleId → value
      confirmations: {},    // ruleId → { confirmedAt, confirmedBy }
      evidenceRefs: {},     // ruleId → { vaultDocId, name, type, period, status }
      waiverRequests: {},   // ruleId → { requestedAt, reason, scope }
      updatedAt: null,
      version: 0,
    }
  }
  return snap.data()
}

export const saveSupplementDraft = async (requestId, opportunityId, patch) => {
  const user = guard()
  const ref = draftRef(requestId, opportunityId)
  const snap = await getDoc(ref)
  const currentVersion = snap.exists() ? (snap.data().version || 0) : 0
  const payload = {
    requestId,
    opportunityId,
    ...patch,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
    version: currentVersion + 1,
  }
  await setDoc(ref, payload, { merge: true })
  return { ok: true, savedAt: new Date().toISOString() }
}

// ── Submission package assembly (Brief §7, p.55-56) ─────────────────────
export const buildSubmissionPackage = ({
  request, profile, vault, opportunity, programme, firm,
  rules, resolutions,
}) => {
  const user = guard()
  const now = new Date().toISOString()

  // Generic application — only the fields that belong in the frozen package
  const genericApplication = {
    purpose: request?.purpose || "",
    subpurpose: request?.subpurpose || "",
    requestedAmount: request?.requestedAmount ?? null,
    currency: request?.currency || "ZAR",
    neededBy: request?.neededBy || null,
    usesOfFunds: request?.usesOfFunds || [],
    deliveryTiming: request?.deliveryTiming || "",
    contribution: request?.contribution ?? null,
    fundingGap: request?.fundingGap ?? null,
    instrumentCategory: request?.instrumentCategory || "",
    instrumentId: request?.instrumentId || "",
    preferredProvider: request?.preferredProvider || "",
    components: request?.components || [],
    termsAnswers: request?.termsAnswers || {},
    securityRights: request?.securityRights || [],
    outcomes: request?.outcomes || [],
    readinessAnswers: request?.readinessAnswers || {},
  }

  // Referenced profile facts (only those touched by a resolved rule)
  const profileFields = {}
  for (const r of rules || []) {
    if (!r.canonicalFieldPath) continue
    const value = getNested(profile, r.canonicalFieldPath)
    profileFields[r.canonicalFieldPath] = {
      value: value ?? null,
      source: "universalProfiles/" + (profile?.id || user.uid),
      verification: profile?.verification?.[r.canonicalFieldPath.split(".").pop()]?.status || "self_declared",
    }
  }

  // Supplement answers (from the resolutions map, keyed by ruleId)
  const supplementAnswers = {}
  const confirmations = {}
  const evidenceRefs = {}
  for (const [ruleId, res] of Object.entries(resolutions || {})) {
    if (res.answer !== undefined) supplementAnswers[ruleId] = res.answer
    if (res.confirmed) confirmations[ruleId] = { confirmedAt: now, confirmedBy: user.uid }
    if (res.evidenceRef) evidenceRefs[ruleId] = res.evidenceRef
  }

  return {
    // Identifiers
    requestId: request?.requestId,
    opportunityId: opportunity?.opportunityId,
    smeId: user.uid,
    funderId: firm?.ownerId || firm?.firmId,
    firmId: firm?.firmId,
    programmeId: programme?.programmeId,

    instrumentId: opportunity?.instrumentId || request?.instrumentId,

    // Content
    genericApplication,
    profileFields,
    supplementAnswers,
    confirmations,
    evidenceRefs,

    // Score references (Brief §7 p.56)
    scoreRefs: {
      originalBigScoreId: request?.originalBigScoreId || null,
      adjustedScoreId: opportunity?.adjustedScoreId || null,
      methodology: "v3",
      ruleRegistryVersion: opportunity?.ruleVersion || "unpublished",
      scoringProfileId: opportunity?.scoringProfileId || null,
    },

    // Declarations + consent (Brief §5 p.49, §7 p.55)
    declarations: [
      { id: "accuracy", label: "Information in this submission is accurate.", accepted: true },
      { id: "sharing", label: `Share this package with ${firm?.name || "the funder"}.`, accepted: true },
    ],
    consent: {
      scope: opportunity?.consentScope || ["generic_application", "supplement", "evidence"],
      acceptedAt: now,
      acceptedBy: user.uid,
    },

    // Recipient + route
    recipientFirmId: firm?.firmId,
    recipientProgrammeId: programme?.programmeId,
    submissionRoute: opportunity?.submissionRoute || "in_app",

    // Freeze metadata
    frozenAt: now,
    frozenBy: user.uid,
    status: "submitted",
  }
}

// ── Freeze + submit ─────────────────────────────────────────────────────
export const freezeSubmission = async (pkg) => {
  const user = guard()
  const idempotencyKey = `${pkg.requestId}:${pkg.opportunityId}:${pkg.smeId}:${Date.now()}`
  const result = await apiFreeze(pkg.opportunityId, { ...pkg, submittedBy: user.uid }, { idempotencyKey })
  return result
}

// ── Live submission check (duplicate guard, Brief §5 p.49) ──────────────
export const listLiveSubmissions = async (requestId, opportunityId) => {
  try {
    const res = await apiListLive(requestId, opportunityId)
    return res?.rows || []
  } catch (err) {
    console.warn("[submissionService] listLive failed:", err?.message)
    return []
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────
const getNested = (obj, path) => {
  if (!obj || !path) return undefined
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

export default {
  loadSupplementDraft, saveSupplementDraft,
  buildSubmissionPackage, freezeSubmission, listLiveSubmissions,
}