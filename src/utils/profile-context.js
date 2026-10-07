// utils/profile-context.js
// Single source of truth for "whose Universal Profile / BIG Score am I looking at,
// and what may I do with it?"
//
//  - Facilitator (CMF) view  -> the SME being viewed, full access (existing behaviour)
//  - Company owner           -> their own profile, full access
//  - Company member          -> by default the COMPANY OWNER's profile, access based on role.
//                               They can switch to "My own profile" at any time (profileScope).
//  - No company              -> their own profile, full access
import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../firebaseConfig"
import { doc, getDoc } from "firebase/firestore"

export const ROLE_PERMISSIONS = {
  owner: { canEditAll: true, sections: ["instructions", "entityOverview", "ownershipManagement", "contactDetails", "legalCompliance", "operationsOverview", "financialOverview", "governance", "productsServices", "howDidYouHear", "documents", "declarationConsent"] },
  companyadmin: { canEditAll: false, sections: ["entityOverview", "contactDetails", "legalCompliance", "operationsOverview", "financialOverview", "governance", "productsServices", "documents"] },
  manager: { canEditAll: false, sections: ["contactDetails", "productsServices", "operationsOverview", "documents"] },
  employee: { canEditAll: false, sections: ["contactDetails", "documents"] },
  viewer: { canEditAll: false, sections: [] },
}

export const canEditProfileSection = (role, sectionId) => {
  const p = ROLE_PERMISSIONS[role]
  if (!p) return false
  return p.canEditAll || p.sections.includes(sectionId)
}

// ── Scope: "company" (default for members) or "own" ──────────────────────────
const scopeKey = (uid) => `profileScope_${uid}`
export const getProfileScope = (uid) => {
  try { return localStorage.getItem(scopeKey(uid)) === "own" ? "own" : "company" } catch { return "company" }
}

let cache = { key: null, promise: null }
export const invalidateProfileContext = () => { cache = { key: null, promise: null } }

// Switches the active profile and reloads so every page/card re-reads the right data.
export const setProfileScope = (scope) => {
  const uid = auth.currentUser?.uid
  if (!uid) return
  try { localStorage.setItem(scopeKey(uid), scope === "own" ? "own" : "company") } catch {}
  invalidateProfileContext()
  window.location.reload()
}

const compute = async (user, scope) => {
  const own = {
    profileId: user.uid, ownProfileId: user.uid, companyProfileId: null,
    role: "owner", isMember: false, isCmf: false, canSwitch: false, scope: "own",
    companyId: null, companyName: "",
  }

  // Facilitator view
  if (sessionStorage.getItem("viewOrigin") === "cmf" && sessionStorage.getItem("viewingSMEId")) {
    return { ...own, profileId: sessionStorage.getItem("viewingSMEId"), isCmf: true }
  }

  const userSnap = await getDoc(doc(db, "users", user.uid))
  if (!userSnap.exists()) return own
  const userData = userSnap.data()
  if (!userData.companyId) return own

  const companySnap = await getDoc(doc(db, "companies", userData.companyId))
  if (!companySnap.exists()) return own
  const company = companySnap.data()
  const ownerId = company.createdBy || company.ownerId
  const base = { ...own, companyId: userData.companyId, companyName: company.name || "" }

  // The company owner just sees their own profile (it IS the company profile)
  if (!ownerId || ownerId === user.uid) return { ...base, scope: "company", companyProfileId: user.uid }

  const memberCtx = {
    ...base,
    companyProfileId: ownerId,
    canSwitch: true,
    role: ROLE_PERMISSIONS[userData.userRole] ? userData.userRole : "viewer",
  }

  // Member who switched back to their own profile
  if (scope === "own") return { ...memberCtx, scope: "own", profileId: user.uid, role: "owner", isMember: false }

  return { ...memberCtx, scope: "company", profileId: ownerId, isMember: true }
}

// Returns { profileId, ownProfileId, companyProfileId, role, isMember, isCmf, canSwitch, scope, companyId, companyName }
export const resolveProfileContext = async ({ force = false } = {}) => {
  const user = auth.currentUser
  if (!user) return null
  const scope = getProfileScope(user.uid)
  const key = `${user.uid}:${scope}`
  if (force || cache.key !== key || !cache.promise) {
    cache = { key, promise: compute(user, scope) }
    cache.promise.catch(() => { cache = { key: null, promise: null } })
  }
  return cache.promise
}

// The universalProfiles/{id} document the current user should read and write.
export const getProfileOwnerId = async () => {
  const ctx = await resolveProfileContext()
  return ctx ? ctx.profileId : null
}

// React hook: resolves once auth is ready. Returns null until then.
export const useProfileContext = () => {
  const [ctx, setCtx] = useState(null)
  useEffect(() => {
    let cancelled = false
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { if (!cancelled) setCtx(null); return }
      try {
        const c = await resolveProfileContext()
        if (!cancelled) setCtx(c)
      } catch (e) { console.error("profile context error:", e) }
    })
    return () => { cancelled = true; unsub() }
  }, [])
  return ctx
}