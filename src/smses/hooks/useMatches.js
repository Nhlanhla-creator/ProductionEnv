"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import {
  calculateCategoryMatch,
  calculateEnhancedMatchScore,
  calculatePreferenceScore,
  getFirstCategory,
} from "../MySupplierMatches/supplier-table"

/**
 * Derive a short, application-specific AppID from a Firestore doc id.
 * The canonical doc id is `{uid}_{timestamp}`; the last 8 characters of the
 * timestamp are unique per application while remaining compact for display.
 *
 * @param {string} fullId
 * @returns {string}
 */
export const deriveAppId = (fullId) => {
  if (!fullId) return ""
  return String(fullId).slice(-8).toUpperCase()
}

/**
 * Normalise a supplier's declared categories into a flat string list.
 * Suppliers store categories as either plain strings or
 * `{ categories: [...], products|services: [...] }` objects.
 */
const flattenSupplierCategories = (productsServices = {}) => {
  const out = []
  const push = (v) => {
    if (!v) return
    if (typeof v === "string") out.push(v)
    else if (typeof v.name === "string") out.push(v.name)
    if (Array.isArray(v?.categories)) v.categories.forEach(push)
  }
  ;(productsServices.productCategories || []).forEach(push)
  ;(productsServices.serviceCategories || []).forEach(push)
  ;(productsServices.categories || []).forEach(push)
  return out
    .map((c) => String(c).trim())
    .filter(Boolean)
}

/**
 * Fetch average ratings for each supplier from the `supplierReviews` collection.
 * Shape: `{ [supplierId]: { average, count, latestComment } }`.
 */
const fetchSupplierRatings = async () => {
  try {
    const snap = await getDocs(collection(db, "supplierReviews"))
    const buckets = {}
    snap.forEach((d) => {
      const data = d.data()
      const sid = data.supplierId
      if (!sid) return
      if (!buckets[sid]) buckets[sid] = []
      buckets[sid].push({
        rating: data.rating || 0,
        comment: data.comment || "",
        date: data.date || "",
      })
    })
    const averages = {}
    Object.keys(buckets).forEach((sid) => {
      const arr = buckets[sid]
      if (!arr.length) {
        averages[sid] = { average: 0, count: 0, latestComment: "No ratings yet" }
        return
      }
      const total = arr.reduce((sum, r) => sum + (r.rating || 0), 0)
      averages[sid] = {
        average: total / arr.length,
        count: arr.length,
        latestComment: arr[arr.length - 1]?.comment || "No comments",
      }
    })
    return averages
  } catch (err) {
    console.error("[useMatches] Failed to fetch supplier ratings", err)
    return {}
  }
}

/**
 * Fetch cached AI secondary matches for a given applicationId
 * from `aiSecondaryMatches/{applicationId}`.
 */
const fetchAiCache = async (applicationId) => {
  try {
    const ref = doc(db, "aiSecondaryMatches", applicationId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return {}
    const data = snap.data()
    return data?.suppliers || {}
  } catch (err) {
    console.warn("[useMatches] Failed to read AI cache for", applicationId, err)
    return {}
  }
}

/**
 * Fetch every supplier (universalProfiles) with productsServices attached.
 */
const fetchAllSuppliers = async () => {
  try {
    const snap = await getDocs(collection(db, "universalProfiles"))
    return snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        productsServices: data.productsServices || {},
        financialOverview: data.financialOverview || {},
        legalCompliance: data.legalCompliance || {},
        entityOverview: data.entityOverview || {},
      }
    })
  } catch (err) {
    console.error("[useMatches] Failed to fetch universalProfiles", err)
    return []
  }
}

/**
 * Fetch all product applications for the given userId, sorted newest first.
 */
const fetchUserApplications = async (userId) => {
  if (!userId) return []
  try {
    try {
      const q = query(
        collection(db, "productApplications"),
        where("userId", "==", userId),
        orderBy("lastUpdated", "desc"),
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    } catch {
      const q = query(collection(db, "productApplications"), where("userId", "==", userId))
      const snap = await getDocs(q)
      const apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      return apps.sort((a, b) => {
        const at = a.lastUpdated?.toMillis?.() || a.lastUpdated?.seconds * 1000 || 0
        const bt = b.lastUpdated?.toMillis?.() || b.lastUpdated?.seconds * 1000 || 0
        return bt - at
      })
    }
  } catch (err) {
    console.error("[useMatches] Failed to fetch user applications", err)
    return []
  }
}

/**
 * Compute relevance-filtered, scored supplier matches for a single application.
 *
 * Scoring model (revised):
 *   PRIMARY   (60%) — AI semantic analysis of product/service alignment.
 *                     Loaded from aiSecondaryMatches/{appId} Firestore cache.
 *   SECONDARY (40%) — Applicant preference criteria (BBBEE, location, delivery,
 *                     budget, ownership, rating, experience, urgency).
 *   OVERALL         — primary * 0.6 + secondary * 0.4
 *                     When AI hasn't been run yet: overall = secondary (100%).
 *
 * Relevance gate: supplier must have calculateCategoryMatch score > 0.
 * Threshold: only suppliers with overall >= 50% are returned.
 */
const OVERALL_THRESHOLD = 50

const computeMatchesForApplication = (application, suppliers, ratings, aiCache) => {
  if (!application || !Array.isArray(suppliers) || suppliers.length === 0) return []

  const scored = suppliers
    .map((supplier) => {
      // Relevance gate — synonym-expanded category match
      const category = calculateCategoryMatch(application, supplier)
      if (!category || category.score <= 0) return null

      // SECONDARY score — preference criteria only
      const preference = calculatePreferenceScore(application, supplier, ratings)

      // PRIMARY score — AI semantic analysis (may not exist yet)
      const aiData = aiCache?.[supplier.id] || null
      const primaryScore = aiData?.score ?? null
      const hasPrimary = primaryScore !== null

      // OVERALL score
      let overallScore
      if (hasPrimary) {
        overallScore = Math.round(primaryScore * 0.6 + preference.totalScore * 0.4)
      } else {
        // Without AI analysis: use preference score alone (clearly flagged)
        overallScore = preference.totalScore
      }

      // Legacy score kept for backward compat (used by SupplierTable)
      const legacy = calculateEnhancedMatchScore(application, supplier, ratings)

      return {
        ...supplier,
        // ── New scoring fields ──
        matchPercentage: overallScore,
        primaryScore,
        primaryBreakdown: aiData
          ? { score: primaryScore, reasoning: aiData.reasoning || "", capabilities: aiData.capabilities || [] }
          : null,
        secondaryScore: preference.totalScore,
        secondaryBreakdown: preference.breakdown,
        hasPrimaryAnalysis: hasPrimary,
        // ── Relevance gate info ──
        categoryGateScore: Math.round(category.score * 100),
        categoryMatches: category.matches || [],
        categoryKeywordMatches: category.keywordMatches || [],
        // ── Legacy / display helpers ──
        legacyMatchScore: legacy.totalScore,
        matchDetails: legacy.breakdown,
        serviceCategory: getFirstCategory(supplier.productsServices),
        supplierCategories: flattenSupplierCategories(supplier.productsServices),
        rating: ratings?.[supplier.id]?.average || 0,
        ratingCount: ratings?.[supplier.id]?.count || 0,
        // ── AI fields (renamed for clarity) ──
        secondaryMatchScore: primaryScore,
        secondaryMatchReasoning: aiData?.reasoning || "",
        secondaryMatchCapabilities: aiData?.capabilities || [],
      }
    })
    .filter(Boolean)
    .filter((s) => s.matchPercentage >= OVERALL_THRESHOLD)

  return scored.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))
}

/**
 * useMatches — loads the current user's applications + suppliers + ratings,
 * then exposes a memoised `matchesByAppId` map keyed by the short AppID (last
 * 8 chars of the Firestore doc id). Also returns helpers and the raw data.
 *
 * Usage:
 *   const { applications, matchesByAppId, getMatchesFor, loading } = useMatches()
 *   const forApp = getMatchesFor(application.id)
 *
 * Options:
 *   - userId (string)     Override the auth.currentUser.uid (useful for tests).
 *   - applications (array) Skip fetching and use these applications directly.
 *   - enabled (boolean)   Set to false to skip fetching entirely.
 */
export const useMatches = ({ userId: userIdProp, applications: applicationsProp, enabled = true } = {}) => {
  const [userId, setUserId] = useState(userIdProp || auth.currentUser?.uid || null)
  const [applications, setApplications] = useState(applicationsProp || [])
  const [suppliers, setSuppliers] = useState([])
  const [ratings, setRatings] = useState({})
  const [aiCacheByAppId, setAiCacheByAppId] = useState({})
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)

  const externalApps = !!applicationsProp
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Track auth changes unless the caller pins a userId explicitly.
  useEffect(() => {
    if (userIdProp) {
      setUserId(userIdProp)
      return undefined
    }
    const unsub = auth.onAuthStateChanged((u) => {
      setUserId(u?.uid || null)
    })
    return () => unsub()
  }, [userIdProp])

  // Sync external applications prop.
  useEffect(() => {
    if (externalApps) setApplications(applicationsProp || [])
  }, [externalApps, applicationsProp])

  // Primary loader: applications, suppliers, ratings.
  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const [appsResult, suppliersResult, ratingsResult] = await Promise.all([
          externalApps ? Promise.resolve(applicationsProp || []) : fetchUserApplications(userId),
          fetchAllSuppliers(),
          fetchSupplierRatings(),
        ])
        if (cancelled || !mountedRef.current) return
        if (!externalApps) setApplications(appsResult)
        setSuppliers(suppliersResult.filter((s) => s.id !== userId))
        setRatings(ratingsResult)
      } catch (err) {
        if (!cancelled && mountedRef.current) setError(err)
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [enabled, userId, externalApps, applicationsProp])

  // Secondary loader: AI cache per application.
  useEffect(() => {
    if (!enabled || !applications.length) {
      setAiCacheByAppId({})
      return undefined
    }
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        applications.map(async (app) => {
          const cache = await fetchAiCache(app.id)
          return [app.id, cache]
        }),
      )
      if (cancelled || !mountedRef.current) return
      const next = {}
      entries.forEach(([id, cache]) => {
        next[id] = cache
      })
      setAiCacheByAppId(next)
    })()
    return () => {
      cancelled = true
    }
  }, [enabled, applications])

  // Memoised matches map keyed by derived AppID.
  const matchesByAppId = useMemo(() => {
    const out = {}
    applications.forEach((app) => {
      const appId = deriveAppId(app.id)
      out[appId] = computeMatchesForApplication(
        app,
        suppliers,
        ratings,
        aiCacheByAppId[app.id] || {},
      )
    })
    return out
  }, [applications, suppliers, ratings, aiCacheByAppId])

  // Flat union of all matches (deduped by supplier id, keep highest score).
  const allMatches = useMemo(() => {
    const bySupplier = new Map()
    Object.values(matchesByAppId).forEach((list) => {
      list.forEach((m) => {
        const existing = bySupplier.get(m.id)
        if (!existing || (m.matchPercentage || 0) > (existing.matchPercentage || 0)) {
          bySupplier.set(m.id, m)
        }
      })
    })
    return Array.from(bySupplier.values()).sort(
      (a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0),
    )
  }, [matchesByAppId])

  const getMatchesFor = useCallback(
    (applicationOrId) => {
      if (!applicationOrId) return []
      const fullId = typeof applicationOrId === "string" ? applicationOrId : applicationOrId.id
      if (!fullId) return []
      return matchesByAppId[deriveAppId(fullId)] || []
    },
    [matchesByAppId],
  )

  // Re-fetch AI cache for one application (after running AI analysis) so
  // matchesByAppId recomputes with fresh primary scores.
  const refreshAiCache = useCallback(
    async (applicationFullId) => {
      if (!applicationFullId) return
      const cache = await fetchAiCache(applicationFullId)
      setAiCacheByAppId((prev) => ({ ...prev, [applicationFullId]: cache }))
    },
    [],
  )

  return {
    userId,
    applications,
    suppliers,
    ratings,
    matchesByAppId,
    allMatches,
    getMatchesFor,
    refreshAiCache,
    loading,
    error,
  }
}

export default useMatches
