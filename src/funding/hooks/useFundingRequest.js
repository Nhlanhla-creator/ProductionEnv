"use client"

/**
 * funding/hooks/useFundingRequest.js
 *
 * Wizard state for one funding request:
 *   - loads the request from Firestore
 *   - loads the SME's profile + Vault (once, reused across steps)
 *   - tracks the current step and completion state
 *   - autosaves step changes (debounced)
 *   - exposes save/exit/resume helpers
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { auth } from "../../firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"
import { createRequest, loadRequest, saveRequest } from "../services/fundingRequestService"
import { loadProfileAndVault } from "../services/prefillService"
import { STEPS, validateRequestStep } from "../models/fundingRequest"

export default function useFundingRequest({ requestId, isNew = false } = {}) {
  const [user, setUser] = useState(null)
  const [request, setRequest] = useState(null)
  const [profile, setProfile] = useState(null)
  const [vault, setVault] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const saveTimerRef = useRef(null)

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  // Bootstrap
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!user) return
      setLoading(true)
      try {
        const [loadedRequest, profileAndVault] = await Promise.all([
          isNew || !requestId ? createRequest() : loadRequest(requestId),
          loadProfileAndVault(user.uid),
        ])
        if (cancelled) return
        setRequest(loadedRequest)
        setProfile(profileAndVault.profile)
        setVault(profileAndVault.vault)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user, requestId, isNew])

  // Debounced autosave
  const persist = useCallback(async (patch) => {
    if (!request?.requestId) return
    setSaving(true)
    try {
      await saveRequest(request.requestId, patch)
      setDirty(false)
    } catch (err) {
      console.error("[useFundingRequest] Save failed:", err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }, [request?.requestId])

  const scheduleSave = useCallback((patch) => {
    setDirty(true)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      persist(patch)
    }, 900)
  }, [persist])

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }, [])

  // Patch API
  const updateField = useCallback((key, value) => {
    setRequest((prev) => {
      if (!prev) return prev
      const next = { ...prev, [key]: value }
      scheduleSave({ [key]: value })
      return next
    })
  }, [scheduleSave])

  const updateNested = useCallback((parentKey, childKey, value) => {
    setRequest((prev) => {
      if (!prev) return prev
      const parent = { ...(prev[parentKey] || {}) }
      parent[childKey] = value
      const next = { ...prev, [parentKey]: parent }
      scheduleSave({ [parentKey]: parent })
      return next
    })
  }, [scheduleSave])

  // Step nav
  const setStep = useCallback((index) => {
    setRequest((prev) => {
      if (!prev) return prev
      const next = { ...prev, currentStep: index }
      scheduleSave({ currentStep: index })
      return next
    })
    if (typeof window !== "undefined") window.scrollTo(0, 0)
  }, [scheduleSave])

  const markStepComplete = useCallback((stepKey) => {
    setRequest((prev) => {
      if (!prev) return prev
      const completed = { ...(prev.completedSteps || {}), [stepKey]: true }
      scheduleSave({ completedSteps: completed })
      return { ...prev, completedSteps: completed }
    })
  }, [scheduleSave])

  // Validation
  const validateStep = useCallback((stepKey) => {
    return validateRequestStep(request, stepKey)
  }, [request])

  // Explicit save
  const saveNow = useCallback(async () => {
    if (!request?.requestId) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    const patch = {
      ...request,
      updatedAt: new Date().toISOString(),
    }
    delete patch.createdAt // never overwrite
    await persist(patch)
  }, [request, persist])

  // Completion
  const completion = useMemo(() => {
    if (!request) return { completed: 0, total: STEPS.length, percent: 0 }
    const completed = STEPS.filter((s) => request.completedSteps?.[s.key]).length
    return { completed, total: STEPS.length, percent: Math.round((completed / STEPS.length) * 100) }
  }, [request])

  return {
    user,
    request,
    profile,
    vault,
    loading,
    error,
    saving,
    dirty,
    completion,
    updateField,
    updateNested,
    setStep,
    markStepComplete,
    validateStep,
    saveNow,
  }
}