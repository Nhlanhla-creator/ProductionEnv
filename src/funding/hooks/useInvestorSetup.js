"use client"

import { useCallback, useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../../firebaseConfig"
import {
  listMyFirms, createFirm, loadFirm, saveFirm, deleteFirm,
  listProgrammes, createProgramme, loadProgramme, saveProgramme, deleteProgramme,
  listOpportunities, createOpportunity, loadOpportunity, saveOpportunity, publishOpportunity,
  listRequirementRules, upsertRequirementRule, deleteRequirementRule,
} from "../services/investorFirmService"
import {
  createProfile, loadProfile, saveProfile, approveProfile,
} from "../services/scoringProfileService"

export default function useInvestorSetup({ firmId, programmeId, opportunityId } = {}) {
  const [user, setUser] = useState(null)
  const [firms, setFirms] = useState([])
  const [firm, setFirm] = useState(null)
  const [programmes, setProgrammes] = useState([])
  const [programme, setProgramme] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [opportunity, setOpportunity] = useState(null)
  const [rules, setRules] = useState([])
  const [scoringProfile, setScoringProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser)
    return () => unsub()
  }, [])

  // ── Level 1: firms list ────────────────────────────────────────────
  // Runs whenever auth is ready OR the route changes. When we're on the
  // bare /investor-setup route (no firmId), this effect is the one that
  // ends up flipping loading → false.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        const rows = await listMyFirms()
        if (!cancelled) setFirms(rows)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        // Only declare "done loading" if we're at the top level.
        if (!cancelled && !firmId) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user, firmId])

  // ── Level 2: firm + its programmes ─────────────────────────────────
  useEffect(() => {
    if (!user || !firmId) {
      setFirm(null)
      setProgrammes([])
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [f, ps] = await Promise.all([loadFirm(firmId), listProgrammes(firmId)])
        if (cancelled) return
        setFirm(f)
        setProgrammes(ps)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled && !programmeId) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user, firmId, programmeId])

  // ── Level 3: programme + its opportunities ─────────────────────────
  useEffect(() => {
    if (!user || !firmId || !programmeId) {
      setProgramme(null)
      setOpportunities([])
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [p, os] = await Promise.all([
          loadProgramme(firmId, programmeId),
          listOpportunities(firmId, programmeId),
        ])
        if (cancelled) return
        setProgramme(p)
        setOpportunities(os)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled && !opportunityId) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user, firmId, programmeId, opportunityId])

  // ── Level 4: opportunity + rules + scoring profile ─────────────────
  useEffect(() => {
    if (!user || !firmId || !programmeId || !opportunityId) {
      setOpportunity(null)
      setRules([])
      setScoringProfile(null)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [o, rs] = await Promise.all([
          loadOpportunity(firmId, programmeId, opportunityId),
          listRequirementRules(firmId, programmeId, opportunityId),
        ])
        if (cancelled) return
        setOpportunity(o)
        setRules(rs)

        if (o?.scoringProfileId) {
          const p = await loadProfile(o.scoringProfileId)
          if (!cancelled) setScoringProfile(p)
        } else {
          if (!cancelled) setScoringProfile(null)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user, firmId, programmeId, opportunityId])

  // ── Actions ──────────────────────────────────────────────────────────
  const onCreateFirm = useCallback(async () => {
    const f = await createFirm()
    setFirms((prev) => [...prev, f])
    return f
  }, [])

  const onSaveFirm = useCallback(async (patch) => {
    if (!firm?.firmId) return
    await saveFirm(firm.firmId, patch)
    setFirm((prev) => ({ ...prev, ...patch }))
    setFirms((prev) => prev.map((f) => (f.firmId === firm.firmId ? { ...f, ...patch } : f)))
  }, [firm?.firmId])

  const onDeleteFirm = useCallback(async (id) => {
    await deleteFirm(id)
    setFirms((prev) => prev.filter((f) => f.firmId !== id))
  }, [])

  const onCreateProgramme = useCallback(async () => {
    const p = await createProgramme(firmId)
    setProgrammes((prev) => [...prev, p])
    return p
  }, [firmId])

  const onSaveProgramme = useCallback(async (patch) => {
    if (!firmId || !programme?.programmeId) return
    await saveProgramme(firmId, programme.programmeId, patch)
    setProgramme((prev) => ({ ...prev, ...patch }))
    setProgrammes((prev) => prev.map((p) => (p.programmeId === programme.programmeId ? { ...p, ...patch } : p)))
  }, [firmId, programme?.programmeId])

  const onDeleteProgramme = useCallback(async (id) => {
    await deleteProgramme(firmId, id)
    setProgrammes((prev) => prev.filter((p) => p.programmeId !== id))
  }, [firmId])

  const onCreateOpportunity = useCallback(async () => {
    const o = await createOpportunity(firmId, programmeId)
    setOpportunities((prev) => [...prev, o])
    return o
  }, [firmId, programmeId])

  const onSaveOpportunity = useCallback(async (patch) => {
    if (!firmId || !programmeId || !opportunity?.opportunityId) return
    await saveOpportunity(firmId, programmeId, opportunity.opportunityId, patch)
    setOpportunity((prev) => ({ ...prev, ...patch }))
    setOpportunities((prev) => prev.map((o) => (o.opportunityId === opportunity.opportunityId ? { ...o, ...patch } : o)))
  }, [firmId, programmeId, opportunity?.opportunityId])

  const onPublishOpportunity = useCallback(async () => {
    if (!firmId || !programmeId || !opportunity?.opportunityId) return
    const res = await publishOpportunity(firmId, programmeId, opportunity.opportunityId, {})
    setOpportunity((prev) => ({
      ...prev,
      status: "published",
      publishedVersion: res.publishedVersion,
    }))
    return res
  }, [firmId, programmeId, opportunity?.opportunityId])

  const onUpsertRule = useCallback(async (rule) => {
    const saved = await upsertRequirementRule(firmId, programmeId, opportunityId, rule)
    setRules((prev) => {
      const idx = prev.findIndex((r) => r.ruleId === saved.ruleId)
      if (idx >= 0) {
        const next = [...prev]; next[idx] = saved; return next
      }
      return [...prev, saved]
    })
    return saved
  }, [firmId, programmeId, opportunityId])

  const onDeleteRule = useCallback(async (ruleId) => {
    await deleteRequirementRule(firmId, programmeId, opportunityId, ruleId)
    setRules((prev) => prev.filter((r) => r.ruleId !== ruleId))
  }, [firmId, programmeId, opportunityId])

  const onCreateScoringProfile = useCallback(async () => {
    const p = await createProfile({ firmId, opportunityId })
    setScoringProfile(p)
    await saveOpportunity(firmId, programmeId, opportunityId, { scoringProfileId: p.profileId })
    return p
  }, [firmId, programmeId, opportunityId])

  const onSaveScoringProfile = useCallback(async (patch) => {
    if (!scoringProfile?.profileId) return
    await saveProfile(scoringProfile.profileId, patch)
    setScoringProfile((prev) => ({ ...prev, ...patch }))
  }, [scoringProfile?.profileId])

  const onApproveScoringProfile = useCallback(async () => {
    if (!scoringProfile?.profileId) return
    await approveProfile(scoringProfile.profileId, { approverId: user?.uid })
    setScoringProfile((prev) => ({ ...prev, status: "approved" }))
  }, [scoringProfile?.profileId, user?.uid])

  return {
    user,
    loading, error,
    firms, firm,
    programmes, programme,
    opportunities, opportunity,
    rules, scoringProfile,
    onCreateFirm, onSaveFirm, onDeleteFirm,
    onCreateProgramme, onSaveProgramme, onDeleteProgramme,
    onCreateOpportunity, onSaveOpportunity, onPublishOpportunity,
    onUpsertRule, onDeleteRule,
    onCreateScoringProfile, onSaveScoringProfile, onApproveScoringProfile,
  }
}