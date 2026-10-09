/**
 * funding/services/prefillService.js
 *
 * Prefill resolver from Brief §2. Reads the SME's Universal Profile and
 * Vault, and returns the shape the wizard expects.
 *
 * CRITICAL RULE: a correction writes to the PROFILE, not to the request.
 * A submitted request is frozen and never overwritten.
 */

import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { prefillField, getFieldDefinition } from "../models/canonicalFields"

// ── Read profile + vault ──────────────────────────────────────────────────
export const loadProfileAndVault = async (userId) => {
  const [profileSnap, vaultSnap] = await Promise.all([
    getDoc(doc(db, "universalProfiles", userId)),
    loadVaultDocuments(userId),
  ])
  return {
    profile: profileSnap.exists() ? { id: userId, ...profileSnap.data() } : { id: userId },
    vault: vaultSnap,
  }
}

const loadVaultDocuments = async (userId) => {
  // Direct read against vaultDocuments where ownerId == userId.
  // Uses a simple equality filter (single-field index is auto-created).
  try {
    const { collection, query, where, getDocs } = await import("firebase/firestore")
    const q = query(
      collection(db, "vaultDocuments"),
      where("ownerId", "==", userId)
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.warn("[prefillService] Vault read failed:", err?.message)
    return []
  }
}

// ── Prefill resolution ────────────────────────────────────────────────────

/**
 * Resolve a list of canonical field paths against the profile.
 * Returns one row per path — the shape the PrefillRow component expects.
 */
export const resolveCanonicalFields = (profile, paths) => {
  return (paths || []).map((path) => {
    const def = getFieldDefinition(path)
    const resolved = prefillField(profile, path)
    return {
      ...resolved,
      label: def?.label || path,
      exists: resolved?.value !== null && resolved?.value !== undefined && resolved?.value !== "",
    }
  })
}

/**
 * Given a rule set and the loaded profile/vault, resolve each rule to a
 * task state the wizard can render.
 */
export const resolveTasksForStep = (rules, { profile, vault, request, stepKey }) => {
  return (rules || [])
    .filter((r) => r.stepKey === stepKey)
    .map((rule) => resolveOneRule(rule, { profile, vault, request }))
}

const resolveOneRule = (rule, { profile, vault, request }) => {
  if (rule.canonicalFieldPath) {
    const value = getNested(profile, rule.canonicalFieldPath)
    const exists = value !== undefined && value !== null && value !== ""
    return {
      rule,
      state: exists ? "confirm" : "missing_answer",
      source: "profile",
      currentValue: exists ? value : null,
      displayLabel: rule.label,
      reason: rule.reason,
    }
  }
  if (rule.evidenceType) {
    const matches = (vault || []).filter((v) =>
      v.type === rule.evidenceType &&
      (!rule.evidenceAccepts?.length || rule.evidenceAccepts.includes(v.fileType))
    )
    if (matches.length > 0) {
      const verified = matches.some((m) => m.status === "verified")
      return {
        rule,
        state: verified ? "ready" : "pending_validation",
        source: "vault",
        evidenceIds: matches.map((m) => m.id),
        displayLabel: rule.label,
        reason: rule.reason,
      }
    }
    return {
      rule,
      state: "missing_evidence",
      source: "vault",
      displayLabel: rule.label,
      reason: rule.reason,
      acceptedTypes: rule.evidenceAccepts,
    }
  }
  if (rule.answerSchema) {
    const v = request?.readinessAnswers?.[rule.ruleId] ?? request?.termsAnswers?.[rule.ruleId]
    const has = v !== undefined && v !== null && v !== ""
    return {
      rule,
      state: has ? "ready" : "missing_answer",
      source: "supplement",
      currentValue: has ? v : null,
      displayLabel: rule.label,
      reason: rule.reason,
    }
  }
  return { rule, state: "optional", source: "none", displayLabel: rule.label, reason: rule.reason }
}

/**
 * Correction path — writes a canonical value back to the profile.
 * This is the ONLY way to update a scored fact from within the application.
 *
 * The write is guarded by the profile owner's uid, so an SME can only correct
 * their own profile.
 */
export const correctProfileField = async (path, value, { reason = "" } = {}) => {
  const user = auth.currentUser
  if (!user?.uid) throw new Error("Not signed in")

  const profileRef = doc(db, "universalProfiles", user.uid)
  const current = await getDoc(profileRef)
  if (!current.exists()) throw new Error("Profile not found")

  const now = new Date().toISOString()
  const before = getNested(current.data(), path)

  // Firestore update path uses dotted keys
  await updateDoc(profileRef, {
    [path]: value,
    lastEditedAt: now,
    lastEditedBy: user.uid,
    lastEditReason: reason || "Corrected from funding application",
    profileVersion: (current.data().profileVersion || 1) + 1,
  })

  // Audit — the correction is written to the profile's own audit trail.
  // Score recalculation is triggered by the score service; this module
  // does not compute or store scores.

  return { ok: true, before, after: value, correctedAt: now }
}

// ── Helpers ───────────────────────────────────────────────────────────────
const getNested = (obj, path) => {
  if (!obj || !path) return undefined
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

export default {
  loadProfileAndVault,
  resolveCanonicalFields,
  resolveTasksForStep,
  correctProfileField,
}