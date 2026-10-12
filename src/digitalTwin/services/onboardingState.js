/**
 * digitalTwin/services/onboardingState.js
 *
 * Persists the user's progress through the first-run wizard so they can
 * pause and resume. One document per tenant.
 *
 * Firestore: digitalTwinTenants/{tenantId}/onboarding/state
 */

import { db, auth } from "../../firebaseConfig"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

const ref = (tenantId) => doc(db, "digitalTwinTenants", tenantId, "onboarding", "state")

const DEFAULT_STATE = {
  currentStep: 0,
  completed: false,
  completedAt: null,
  startedAt: null,
  lastUpdated: null,
  objective: null,
  sectorPack: null,
  dismissals: {},
}

export const getOnboardingState = async (tenantId) => {
  if (!tenantId) return DEFAULT_STATE
  try {
    const snap = await getDoc(ref(tenantId))
    return snap.exists() ? { ...DEFAULT_STATE, ...snap.data() } : DEFAULT_STATE
  } catch (err) {
    console.warn("getOnboardingState failed:", err?.message)
    return DEFAULT_STATE
  }
}

export const saveOnboardingState = async (tenantId, patch) => {
  if (!tenantId) return
  try {
    const existing = await getOnboardingState(tenantId)
    await setDoc(ref(tenantId), {
      ...existing,
      ...patch,
      lastUpdated: serverTimestamp(),
      startedAt: existing.startedAt || new Date().toISOString(),
    }, { merge: true })
  } catch (err) {
    console.error("saveOnboardingState failed:", err?.message)
  }
}

export const completeOnboarding = async (tenantId, meta = {}) => {
  return saveOnboardingState(tenantId, {
    completed: true,
    completedAt: new Date().toISOString(),
    ...meta,
  })
}

export const dismissOnboardingKey = async (tenantId, key) => {
  if (!tenantId || !key) return
  const current = await getOnboardingState(tenantId)
  const dismissals = { ...(current.dismissals || {}), [key]: new Date().toISOString() }
  return saveOnboardingState(tenantId, { dismissals })
}

export const isDismissed = (state, key) => Boolean(state?.dismissals?.[key])

export default {
  getOnboardingState,
  saveOnboardingState,
  completeOnboarding,
  dismissOnboardingKey,
  isDismissed,
}