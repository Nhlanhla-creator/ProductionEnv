"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../../firebaseConfig"

import { getOpportunityRequirements } from "../services/apiClient"
import { loadRequest } from "../services/fundingRequestService"
import { loadProfileAndVault, correctProfileField } from "../services/prefillService"
import {
  loadSupplementDraft, saveSupplementDraft,
  buildSubmissionPackage, freezeSubmission, listLiveSubmissions,
} from "../services/submissionService"

// Loads firm/programme/opportunity directly (Firestore) — mirrors investorFirmService
import {
  loadFirm, loadProgramme, loadOpportunity,
} from "../services/investorFirmService"

const TASK_SECTIONS = [
  { key: "ready",             label: "Ready from your profile, application, or Vault", tone: "ok" },
  { key: "confirm",           label: "Confirm current values",                          tone: "confirm" },
  { key: "missingAnswer",     label: "Additional answers needed",                        tone: "warn" },
  { key: "missingEvidence",   label: "Additional evidence needed",                       tone: "warn" },
  { key: "pendingValidation", label: "Pending validation",                               tone: "info" },
  { key: "recommended",       label: "Recommended (optional)",                           tone: "muted" },
]

export const TASK_SECTIONS_META = TASK_SECTIONS

export default function useOpportunityDialog({ requestId, opportunityId }) {
  const [user, setUser] = useState(null)
  const [request, setRequest] = useState(null)
  const [profile, setProfile] = useState(null)
  const [vault, setVault] = useState([])
  const [opportunity, setOpportunity] = useState(null)
  const [programme, setProgramme] = useState(null)
  const [firm, setFirm] = useState(null)
  const [requirements, setRequirements] = useState(null)
  const [draft, setDraft] = useState(null)
  const [liveSubmissions, setLiveSubmissions] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)

  const saveTimerRef = useRef(null)

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser)
    return () => unsub()
  }, [])

  // Bootstrap
  useEffect(() => {
    if (!user || !requestId || !opportunityId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [req, pv, reqs, dr] = await Promise.all([
          loadRequest(requestId),
          loadProfileAndVault(user.uid),
          getOpportunityRequirements(opportunityId, requestId),
          loadSupplementDraft(requestId, opportunityId),
        ])
        if (cancelled) return
        setRequest(req)
        setProfile(pv.profile)
        setVault(pv.vault || [])
        setRequirements(reqs)
        setDraft(dr)

        // Try to load firm/programme/opportunity if we know the chain.
        // The requirements response may carry firmId/programmeId; else skip.
        const firmId = reqs?.firmId
        const programmeId = reqs?.programmeId
        if (firmId && programmeId) {
          try {
            const [f, p, o] = await Promise.all([
              loadFirm(firmId),
              loadProgramme(firmId, programmeId),
              loadOpportunity(firmId, programmeId, opportunityId),
            ])
            if (!cancelled) { setFirm(f); setProgramme(p); setOpportunity(o) }
          } catch (e) { /* non-fatal */ }
        }

        const live = await listLiveSubmissions(requestId, opportunityId)
        if (!cancelled) setLiveSubmissions(live)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user, requestId, opportunityId])

  // Debounced draft save
  const persistDraft = useCallback(async (patch) => {
    if (!requestId || !opportunityId) return
    setSaving(true)
    try {
      await saveSupplementDraft(requestId, opportunityId, patch)
      setDirty(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }, [requestId, opportunityId])

  const scheduleSave = useCallback((patch) => {
    setDirty(true)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => persistDraft(patch), 900)
  }, [persistDraft])

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }, [])

  // ── Mutations on the draft ────────────────────────────────────────────
  const setAnswer = useCallback((ruleId, value) => {
    setDraft((prev) => {
      const next = { ...prev, answers: { ...(prev.answers || {}), [ruleId]: value } }
      scheduleSave({ answers: next.answers })
      return next
    })
  }, [scheduleSave])

  const confirmRule = useCallback((ruleId) => {
    const confirmedBy = auth.currentUser?.uid
    const entry = { confirmedAt: new Date().toISOString(), confirmedBy }
    setDraft((prev) => {
      const next = { ...prev, confirmations: { ...(prev.confirmations || {}), [ruleId]: entry } }
      scheduleSave({ confirmations: next.confirmations })
      return next
    })
  }, [scheduleSave])

  const attachEvidence = useCallback((ruleId, evidenceRef) => {
    setDraft((prev) => {
      const next = { ...prev, evidenceRefs: { ...(prev.evidenceRefs || {}), [ruleId]: evidenceRef } }
      scheduleSave({ evidenceRefs: next.evidenceRefs })
      return next
    })
  }, [scheduleSave])

  const requestWaiver = useCallback((ruleId, { reason, scope }) => {
    const entry = { requestedAt: new Date().toISOString(), reason, scope, status: "pending" }
    setDraft((prev) => {
      const next = { ...prev, waiverRequests: { ...(prev.waiverRequests || {}), [ruleId]: entry } }
      scheduleSave({ waiverRequests: next.waiverRequests })
      return next
    })
  }, [scheduleSave])

  const editProfileField = useCallback(async (path, value) => {
    await correctProfileField(path, value, { reason: "Corrected during opportunity application" })
    // Refresh profile
    const pv = await loadProfileAndVault(user.uid)
    setProfile(pv.profile)
  }, [user])

  // ── Submission resolution map ─────────────────────────────────────────
  const resolutions = useMemo(() => {
    if (!draft) return {}
    const out = {}
    for (const [ruleId, v] of Object.entries(draft.answers || {})) out[ruleId] = { ...(out[ruleId] || {}), answer: v }
    for (const [ruleId, c] of Object.entries(draft.confirmations || {})) out[ruleId] = { ...(out[ruleId] || {}), confirmed: true, confirmedAt: c.confirmedAt }
    for (const [ruleId, e] of Object.entries(draft.evidenceRefs || {})) out[ruleId] = { ...(out[ruleId] || {}), evidenceRef: e }
    return out
  }, [draft])

  // ── Task counts (for the header + submit gate) ────────────────────────
  const counts = useMemo(() => {
    const r = requirements || {}
    const required = (r.missingAnswer?.length || 0) + (r.missingEvidence?.length || 0)
    const optional = (r.recommended?.length || 0)
    const confirmNeeded = (r.confirm?.length || 0)
    const readyCount = (r.ready?.length || 0)
    const pendingCount = (r.pendingValidation?.length || 0)
    return { required, optional, confirmNeeded, readyCount, pendingCount }
  }, [requirements])

  // ── Submit ────────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    setSubmitting(true)
    try {
      const pkg = buildSubmissionPackage({
        request, profile, vault, opportunity, programme, firm,
        rules: [
          ...(requirements?.ready || []),
          ...(requirements?.confirm || []),
          ...(requirements?.missingAnswer || []),
          ...(requirements?.missingEvidence || []),
          ...(requirements?.pendingValidation || []),
          ...(requirements?.recommended || []),
        ],
        resolutions,
      })
      const result = await freezeSubmission(pkg)
      setSubmitted({ ...result, package: pkg })
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [request, profile, vault, opportunity, programme, firm, requirements, resolutions])

  return {
    user, loading, error,
    request, profile, vault, opportunity, programme, firm,
    requirements, draft, liveSubmissions,
    saving, dirty, submitting, submitted,
    counts, resolutions,
    setAnswer, confirmRule, attachEvidence, requestWaiver, editProfileField,
    submit,
  }
}