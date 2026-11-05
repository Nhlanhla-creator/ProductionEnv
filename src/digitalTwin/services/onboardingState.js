/**
 * digitalTwin/services/onboardingState.js
 *
 * Persists the user's progress through the first-run wizard so they can
 * pause and resume. One document per tenant.
 *
 * Firestore: digitalTwinTenants/{tenantId}/onboarding/state
 */

import { db } from "../../firebaseConfig"
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
    return snap.exists() ? { ...DEFAULT_STATE, ...snap.data(), ...(snap.data().form || {}) } : { ...DEFAULT_STATE }
  } catch (err) {
    console.warn("getOnboardingState failed:", err?.message)
    return DEFAULT_STATE
  }
}

const FORM_KEYS = ['environment','siteName','contractName','clientName','serviceValueChainId','serviceId','activityName','equipmentGroupName','equipmentGroupCapacity','companyNodeId','siteNodeId','contractNodeId','serviceNodeId','activityNodeId','groupId'];
export const saveOnboardingState = async (tenantId, patch) => {
  if (!tenantId) return;
  const existing = await getOnboardingState(tenantId);
  const form = {...(existing.form || {})};
  for (const key of FORM_KEYS) if (patch[key] !== undefined) form[key] = patch[key];
  const value = Object.fromEntries(Object.keys(DEFAULT_STATE).map(key=>[key,patch[key] !== undefined ? patch[key] : existing[key] ?? DEFAULT_STATE[key]]));
  value.currentStep = Math.max(0, Math.min(5, Number(value.currentStep) || 0));
  value.startedAt = existing.startedAt || new Date().toISOString();
  value.lastUpdated = serverTimestamp();
  value.form = form;
  await setDoc(ref(tenantId), value, {merge:true});
  return value;
};

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