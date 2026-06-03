"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { auth, db } from "../../../firebaseConfig"

// ── Utils ─────────────────────────────────────────────────────────────────────

export const deriveAdvisorAppId = (fullId) =>
  fullId ? String(fullId).slice(-8).toUpperCase() : ""

// ── Fetchers ──────────────────────────────────────────────────────────────────

export const fetchAllAdvisors = async () => {
  try {
    const snap = await getDocs(collection(db, "advisorProfiles"))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error("Failed to fetch advisor profiles", err)
    return []
  }
}

const fetchAiAdvisorCache = async (applicationId, retries = 3) => {
  try {
    const snap = await getDoc(doc(db, "aiAdvisorMatches", applicationId))
    if (!snap.exists()) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 1000))
        return fetchAiAdvisorCache(applicationId, retries - 1)
      }
      return {}
    }
    return snap.data()?.matches || {}
  } catch (err) {
    console.warn("AI cache error", err)
    return {}
  }
}

const fetchUserAdvisorApplications = async (userId) => {
  if (!userId) return []
  const q = query(collection(db, "advisoryApplicationsV2"), where("userId", "==", userId))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.lastUpdated?.toMillis?.() || 0) - (a.lastUpdated?.toMillis?.() || 0))
}

// ── Scoring ───────────────────────────────────────────────────────────────────

// All advisory application fields are flat on the document (no nested advisoryNeedsAssessment)
// All advisor fields are flat under formData on the advisor document
const getAdvisorFormData = (advisor) => advisor.formData || {}

const calculatePreferenceScore = (application, advisor) => {
  const adv = getAdvisorFormData(advisor)
  let total = 0
  let weight = 0

  const score = (value, w) => {
    total += value * w
    weight += w
  }

  // Time commitment
  if (application.timeCommitment && adv.timeCommitment) {
    const a = application.timeCommitment.toLowerCase().replace(/[^a-z0-9]/g, "")
    const b = adv.timeCommitment.toLowerCase().replace(/[^a-z0-9]/g, "")
    score((a.includes(b) || b.includes(a) ? 100 : 0), 0.3)
  }

  // Compensation type
  if (application.compensationType && adv.compensationModel) {
    score(adv.compensationModel.toLowerCase() === application.compensationType.toLowerCase() ? 100 : 0, 0.2)
  }

  // Engagement style / meeting format
  if (application.meetingFormat && adv.preferredEngagementStyle) {
    const formatMap = { one_on_one_mentorship: "mentorship", group_advisory: "group" }
    const mapped = formatMap[adv.preferredEngagementStyle.toLowerCase()] || adv.preferredEngagementStyle
    score(mapped === application.meetingFormat.toLowerCase() ? 100 : 0, 0.2)
  }

  // Functional expertise overlap
  const appExpertise = [
    ...(application.functionalExpertise || []),
    ...(application.supportFocus || []),
    ...(application.advisoryRole || []),
  ].map((s) => s.toLowerCase())

  const advExpertise = (adv.functionalExpertise || []).map((s) => s.toLowerCase())

  if (appExpertise.length && advExpertise.length) {
    const matched = appExpertise.filter((need) => advExpertise.some((has) => has.includes(need)))
    score((matched.length / appExpertise.length) * 100, 0.3)
  }

  return weight > 0 ? Math.round(total / weight) : 0
}

const computeMatchesForApplication = (application, advisors, aiCache) => {
  if (!application || !advisors.length) return []

  return advisors
    .map((advisor) => {
      const aiData = aiCache[advisor.id] || null
      // AI cache scores are on a 0–5 scale; convert to 0–100
      const primaryScore = aiData?.score != null ? aiData.score * 20 : null
      const secondaryScore = calculatePreferenceScore(application, advisor)

      const overallScore =
        primaryScore != null
          ? Math.round(primaryScore * 0.6 + secondaryScore * 0.4)
          : secondaryScore

      const contact = getAdvisorFormData(advisor).contactDetails || {}
      const name = `${contact.name || ""} ${contact.surname || ""}`.trim() || advisor.id
      const serviceCategory = (getAdvisorFormData(advisor).functionalExpertise || [])[0] || "Advisor"

      return {
        ...advisor,
        name,
        serviceCategory,
        matchPercentage: overallScore,
        primaryScore,
        secondaryScore,
        hasPrimaryAnalysis: primaryScore != null,
        primaryBreakdown: aiData
          ? {
              score: primaryScore,
              reasoning: aiData.reasoning,
              capabilities: aiData.matchedCapabilities || [],
              breakdown: aiData.breakdown || null,
            }
          : null,
      }
    })
    .filter((a) => a.matchPercentage >= 40)
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useAdvisoryMatches = ({ enabled = true } = {}) => {
  const [userId, setUserId] = useState(null)
  const [applications, setApplications] = useState([])
  const [advisors, setAdvisors] = useState([])
  const [aiCacheByAppId, setAiCacheByAppId] = useState({})
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    return auth.onAuthStateChanged((u) => setUserId(u?.uid || null))
  }, [])

  // Load applications + advisors in parallel
  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const [apps, advs] = await Promise.all([
          fetchUserAdvisorApplications(userId),
          fetchAllAdvisors(),
        ])
        if (!cancelled && mounted.current) {
          setApplications(apps)
          setAdvisors(advs)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled && mounted.current) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [enabled, userId])

  // Fetch AI cache for each application
  useEffect(() => {
    if (!applications.length) return
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        applications.map(async (app) => [app.id, await fetchAiAdvisorCache(app.id)])
      )
      if (!cancelled && mounted.current) {
        setAiCacheByAppId(Object.fromEntries(entries))
      }
    })()
    return () => { cancelled = true }
  }, [applications])

  // Keyed by short ID for consumer convenience
  const matchesByAppId = useMemo(() => {
    const out = {}
    applications.forEach((app) => {
      out[deriveAdvisorAppId(app.id)] = computeMatchesForApplication(
        app,
        advisors,
        aiCacheByAppId[app.id] || {}
      )
    })
    return out
  }, [applications, advisors, aiCacheByAppId])

  const refreshAiCache = useCallback(async (applicationFullId) => {
    const cache = await fetchAiAdvisorCache(applicationFullId)
    setAiCacheByAppId((prev) => ({ ...prev, [applicationFullId]: cache }))
  }, [])

  return { applications, advisors, matchesByAppId, loading, refreshAiCache }
}

export default useAdvisoryMatches