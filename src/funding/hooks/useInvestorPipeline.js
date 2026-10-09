"use client"

import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../../firebaseConfig"
import { listSubmissionsForFirm } from "../services/submissionReader"

/**
 * Investor pipeline state — Brief §4, p.44.
 *
 * Columns: SME, request, instrument, amount, original BIG Score,
 *          Adjusted BIG Score + change, eligibility, Match Score,
 *          completeness, evidence confidence, date, current stage.
 */

export default function useInvestorPipeline({ firmId } = {}) {
  const [user, setUser] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [stageFilter, setStageFilter] = useState("all")
  const [sortField, setSortField] = useState("submittedAt")
  const [sortDir, setSortDir] = useState("desc")

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser)
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user || !firmId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await listSubmissionsForFirm(firmId)
        if (!cancelled) setRows(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user, firmId])

  const visible = useMemo(() => {
    let r = [...rows]
    if (stageFilter !== "all") r = r.filter((x) => x.currentStage === stageFilter)
    r.sort((a, b) => {
      const av = a[sortField] ?? ""
      const bv = b[sortField] ?? ""
      if (av === bv) return 0
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    return r
  }, [rows, stageFilter, sortField, sortDir])

  const stages = useMemo(() => {
    const s = new Set()
    for (const r of rows) if (r.currentStage) s.add(r.currentStage)
    return Array.from(s)
  }, [rows])

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortField(field); setSortDir("desc") }
  }

  return {
    user, loading, error,
    rows: visible, allRows: rows, stages,
    stageFilter, setStageFilter,
    sortField, sortDir, toggleSort,
  }
}