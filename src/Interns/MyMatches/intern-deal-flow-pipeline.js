"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { collection, doc, getDoc, getDocs } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../../firebaseConfig"
import {
  Target,
  Send,
  Inbox,
  Users,
  ListChecks,
  Phone,
  CheckCircle,
  FileText,
  Award,
  FileCheck,
  Activity,
  Trophy,
  XCircle,
  Briefcase,
  Sparkles,
  HelpCircle,
  ArrowRight,
  X,
} from "lucide-react"

/* ════════════════════════════════════════════════════════════════════════════
   InternDealflow — same visual language as AdvisorFlowPipeline.

   Nothing about how the numbers are produced has changed: the Firestore walk
   below (universalProfiles → internApplications gate → checkApplicationStatus
   → one row per program) is the same one InternTable.jsx runs, so the cards
   still agree with the rows beneath them.

   What is new is the shape: one card per status, arrows carrying step-to-step
   conversion between live stages, Declined boxed off at the end as a terminal
   state, hover tooltips, and click-to-filter.

   These three strings must stay identical to the ones intern-table.jsx uses.
   ════════════════════════════════════════════════════════════════════════ */
export const INTERN_STAGE_FILTER_EVENT = "intern-stage-filter"
export const INTERN_ROWS_EVENT = "intern-rows"
export const INTERN_ROWS_REQUEST_EVENT = "intern-rows-request"

// Copied verbatim from InternTable.jsx so status resolution is identical.
const checkApplicationStatus = async (userId, sponsorId) => {
  try {
    const docId = `${sponsorId}_${userId}`
    const applicationDoc = await getDoc(doc(db, "internshipApplications", docId))

    if (applicationDoc.exists()) {
      const appData = applicationDoc.data()
      const status = appData.status || "Applied"

      // Normalize status - treat both "Applied" and "Requested" as applied
      const normalizedStatus =
        status === "Applied" ? "Applied" : status === "Requested" ? "Requested" : status

      return { status: normalizedStatus, exists: true, data: appData }
    }
    return { status: "New Match", exists: false, data: null }
  } catch (error) {
    console.warn(`Could not fetch application status for ${sponsorId}_${userId}:`, error)
    return { status: "New Match", exists: false, data: null }
  }
}

/* Each entry corresponds 1:1 to a literal `status` string that can be written
   onto an internshipApplications doc, plus "New Match" for sponsors the intern
   hasn't applied to / been requested by yet. Keeping these exact strings is
   what makes the counts match InternTable.jsx row-for-row.

   Declined is `terminal`: it sits inside its own red outline at the end with
   no arrow into it, because leaving the pipeline isn't a step it flows through. */
const STAGE_DEFINITIONS = [
  { id: "new_match", name: "New Match", statusMapping: ["New Match"], icon: Target, tooltip: "Sponsors matched to your profile that you haven't applied to yet." },
  { id: "applied", name: "Applied", statusMapping: ["Applied"], icon: Send, tooltip: "Applications you've sent and the sponsor hasn't actioned yet." },
  { id: "requested", name: "Requested", statusMapping: ["Requested"], icon: Inbox, tooltip: "Sponsors who approached you and are waiting on your answer." },
  { id: "matched", name: "Matched", statusMapping: ["Matched"], icon: Users, tooltip: "Mutual interest confirmed by the sponsor." },
  { id: "shortlisted", name: "Shortlisted", statusMapping: ["Shortlisted"], icon: ListChecks, tooltip: "You're on the sponsor's shortlist for the role." },
  { id: "interviewed", name: "Contacted/Interview", statusMapping: ["Contacted/Interview"], icon: Phone, tooltip: "Interviews arranged or already held." },
  { id: "confirmed", name: "Confirmed", statusMapping: ["Confirmed"], icon: CheckCircle, tooltip: "The sponsor has confirmed you for the placement." },
  { id: "confirmed_ts", name: "Confirmed/Term Sheet Sign", statusMapping: ["Confirmed/Term Sheet Sign"], icon: FileText, tooltip: "Terms issued and awaiting signature." },
  { id: "accepted", name: "Accepted", statusMapping: ["Accepted"], icon: Award, tooltip: "Offer accepted by both sides." },
  { id: "contract_signed", name: "Contract Signed", statusMapping: ["Contract Signed"], icon: FileCheck, tooltip: "Internship contract signed." },
  { id: "active", name: "Active", statusMapping: ["Active"], icon: Activity, tooltip: "Placement is currently running." },
  { id: "completed", name: "Completed", statusMapping: ["Completed"], icon: Trophy, tooltip: "Internship finished — it now appears in your history." },
  { id: "declined", name: "Declined", statusMapping: ["Declined"], icon: XCircle, terminal: true, tooltip: "Declined by the sponsor, or withdrawn by you." },
]

const LIVE_STAGES = STAGE_DEFINITIONS.filter((s) => !s.terminal)
const TERMINAL_STAGES = STAGE_DEFINITIONS.filter((s) => s.terminal)
const ENTRY_STAGE_ID = STAGE_DEFINITIONS[0].id

/* Cards are wider than they were and stage names wrap onto another line rather
   than being cut off with an ellipsis — a stage nobody can read isn't a stage.
   Every card in the row stretches to the height of the tallest one (see
   `items-stretch` on the row plus `h-full` on the card body), so the long
   names here never leave their neighbours sitting short. */
const CARD_WIDTH = 124

/* "Confirmed/Term Sheet Sign" has no space around the slash, so the browser
   would otherwise break it mid-word. A zero-width space after each slash gives
   the line-breaker a clean place to split. Display only — the status strings
   themselves are untouched. */
const softBreak = (name = "") => name.replace(/\//g, "/\u200B")

const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

const PipelineSkeleton = () => (
  <div className="flex items-center gap-1 overflow-x-auto pb-4 px-1">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex items-center flex-shrink-0">
        <div
          className="bg-gradient-to-br from-[#f5f0e1]/60 to-[#e6d7c3]/30 rounded-xl flex-shrink-0 animate-pulse"
          style={{ width: `${CARD_WIDTH}px`, height: "98px" }}
        >
          <div className="p-2.5 flex flex-col h-full justify-between">
            <div className="h-2.5 w-20 rounded-full bg-[#c8b6a6]/40" />
            <div className="h-5 w-10 rounded bg-[#c8b6a6]/30 mx-auto" />
            <div className="h-1.5 w-full rounded-full bg-[#c8b6a6]/30" />
          </div>
        </div>
        {i < 7 && <div className="w-8 h-[2px] mx-1 rounded-full bg-[#e6d7c3] animate-pulse" />}
      </div>
    ))}
  </div>
)

/* ════════════════════════════════════════════════════════════════════════════
   Where the counts come from, in order of preference:
     1. InternTable's broadcast. Its rows carry a resolved status, so the cards
        and the table body can't disagree — including New Match, which has no
        stored record at all.
     2. The `matches` prop, if a page has already fetched the rows.
     3. Its own Firestore walk (identical to the table's).
   ════════════════════════════════════════════════════════════════════════ */
export function InternDealflow({ matches: matchesProp, onStageClick, className = "" }) {
  const [internId, setInternId] = useState(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [fetchedRows, setFetchedRows] = useState([])
  const [tableRows, setTableRows] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hoveredStage, setHoveredStage] = useState(null)
  const [selectedStage, setSelectedStage] = useState(null)

  /* The table's broadcast beats every other source. Asking for it on mount
     covers the case where the table rendered first. */
  useEffect(() => {
    if (typeof window === "undefined") return undefined
    const onRows = (e) => {
      if (!Array.isArray(e.detail)) return
      setTableRows(e.detail)
      setLoading(false)
    }
    window.addEventListener(INTERN_ROWS_EVENT, onRows)
    window.dispatchEvent(new Event(INTERN_ROWS_REQUEST_EVENT))
    return () => window.removeEventListener(INTERN_ROWS_EVENT, onRows)
  }, [])

  const usingTable = Array.isArray(tableRows)
  const usingProvided = !usingTable && Array.isArray(matchesProp)
  const needsOwnFetch = !usingTable && !usingProvided

  useEffect(() => {
    if (!needsOwnFetch) return undefined
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setInternId(user ? user.uid : null)
      setAuthResolved(true)
      if (!user) setLoading(false)
    })
    return () => unsubscribe()
  }, [needsOwnFetch])

  useEffect(() => {
    if (usingTable) return undefined
    if (usingProvided) {
      setFetchedRows(matchesProp)
      setLoading(false)
      return undefined
    }
    if (!authResolved) return undefined
    if (!internId) {
      setLoading(false)
      return undefined
    }

    let cancelled = false

    const fetchDealflowData = async () => {
      try {
        // Same source of truth as InternTable.jsx: iterate every
        // universalProfiles doc (a potential sponsor) and only keep the
        // ones that actually published an internApplications doc.
        const snapshot = await getDocs(collection(db, "universalProfiles"))

        const statusLists = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            try {
              const sponsorId = docSnap.id
              if (sponsorId === internId) return []

              const data = docSnap.data()
              if (!data) return []

              try {
                const appDoc = await getDoc(doc(db, "internApplications", sponsorId))
                if (!appDoc.exists()) return [] // same gate as InternTable.jsx
              } catch {
                return []
              }

              const formData = data || {}
              const overview = formData.entityOverview || {}
              const programs = formData?.programDetails?.programs || []
              const matchPrefs = formData.generalMatchingPreference || {}

              const hasRelevantData =
                overview.registeredName ||
                overview.organizationName ||
                programs.length > 0 ||
                Object.keys(matchPrefs).length > 0

              if (!hasRelevantData) return []

              // One status lookup per sponsor — the application doc id is
              // `${sponsorId}_${internId}` regardless of which program a row
              // represents, exactly like InternTable.jsx.
              const { status } = await checkApplicationStatus(internId, sponsorId)

              // InternTable.jsx renders one row per program (or 1 row if there
              // are no programs) — mirror that so the counts match.
              const rowCount = programs.length > 0 ? programs.length : 1
              return Array(rowCount).fill(status)
            } catch {
              return []
            }
          }),
        )

        if (!cancelled) setFetchedRows(statusLists.flat().map((status) => ({ status })))
      } catch (error) {
        console.error("Error fetching pipeline data:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchDealflowData()
    return () => {
      cancelled = true
    }
  }, [usingTable, usingProvided, matchesProp, authResolved, internId])

  /* Counts are derived, not stored — derived state needs no effect and can't
     loop on a fresh object reference. */
  const counts = useMemo(() => {
    const rows = usingTable ? tableRows : fetchedRows
    const result = Object.fromEntries(STAGE_DEFINITIONS.map((s) => [s.id, 0]))
    const unrecognised = []

    rows.forEach((row) => {
      const status = row?.status
      const stage = STAGE_DEFINITIONS.find((s) => s.statusMapping.includes(status))
      if (stage) {
        result[stage.id] += 1
      } else {
        result[ENTRY_STAGE_ID] += 1
        unrecognised.push(status)
      }
    })

    if (unrecognised.length > 0) {
      /* Counted under New Match rather than dropped, so the percentages still
         reach 100 and no match disappears from the funnel. */
      console.warn(
        "[InternDealflow] counted under New Match — no card covers these statuses:",
        [...new Set(unrecognised)],
      )
    }

    return result
  }, [usingTable, tableRows, fetchedRows])

  const total = useMemo(() => STAGE_DEFINITIONS.reduce((sum, s) => sum + (counts[s.id] || 0), 0), [counts])

  const getPercentage = useCallback((count) => (total === 0 ? 0 : ((count / total) * 100).toFixed(1)), [total])

  /* Running total from the end of the live funnel backwards, so each arrow can
     say "of everything that got this far, this share went further". */
  const cumulativeCounts = useMemo(() => {
    const result = {}
    let running = 0
    for (let i = LIVE_STAGES.length - 1; i >= 0; i--) {
      running += counts[LIVE_STAGES[i].id] || 0
      result[LIVE_STAGES[i].id] = running
    }
    return result
  }, [counts])

  const handleStageClick = useCallback(
    (status) => {
      const next = status === selectedStage ? null : status
      setSelectedStage(next)
      onStageClick?.(next)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(INTERN_STAGE_FILTER_EVENT, { detail: next }))
      }
    },
    [selectedStage, onStageClick],
  )

  /* One renderer for every card — live and terminal — so Declined keeps the
     same shape and size as the rest. Only the palette differs.

     The card body is a flex column at `h-full`: the name sits at the top and
     is free to run to a second or third line, while `mt-auto` pins the count
     and the progress bar to the bottom edge. That keeps the numbers on one
     baseline across the row no matter how many lines each name takes. */
  const renderStageCard = (stage) => {
    const isHovered = hoveredStage?.id === stage.id
    const status = stage.statusMapping[0]
    const isSelected = selectedStage === status
    const count = counts[stage.id] || 0
    const percentage = getPercentage(count)
    const theme = stage.terminal
      ? { from: "#4b4844", to: "#242220" } // dark grey — Declined
      : { from: "#4a352f", to: "#241a14" } // dark brown — every other stage
    const Icon = stage.icon

    return (
      <div
        className={`relative flex-shrink-0 cursor-pointer group transition-all duration-300 ${
          isSelected ? "scale-105" : "hover:scale-[1.02]"
        }`}
        style={{ width: `${CARD_WIDTH}px` }}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`${stage.name}: ${count} match${count === 1 ? "" : "es"}`}
        onMouseEnter={(e) => setHoveredStage({ id: stage.id, rect: e.currentTarget.getBoundingClientRect() })}
        onMouseLeave={() => setHoveredStage(null)}
        onClick={() => handleStageClick(status)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleStageClick(status)
          }
        }}
      >
        <div
          className={`rounded-xl p-2.5 h-full flex flex-col transition-all duration-300 ${
            isHovered || isSelected ? "shadow-xl -translate-y-1" : "shadow-md hover:shadow-lg"
          }`}
          style={{
            background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
            border: `1.5px solid ${isSelected ? "#d9b98a" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          <div className="flex items-start gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-white/10 flex-shrink-0">
              <Icon size={11} className="text-white" />
            </div>
            {/* Full stage name, wrapped rather than truncated. */}
            <h3 className="font-semibold text-white text-[9px] uppercase tracking-wide leading-[11px] break-words flex-1 min-w-0 pt-[3px]">
              {softBreak(stage.name)}
            </h3>
          </div>
          <div className="flex items-baseline justify-center mt-auto pt-1">
            <span className="text-lg font-extrabold leading-none text-white">{count}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, backgroundColor: "#c9986a" }}
              />
            </div>
            <span className="text-[8px] font-semibold flex-shrink-0" style={{ color: "#d9c4b0" }}>
              {percentage}%
            </span>
          </div>
        </div>

        {isHovered && (
          <PopupPortal>
            <div
              className="fixed z-[1200] pointer-events-none w-[240px] font-sans"
              style={{
                top: hoveredStage.rect.bottom + 10,
                left: Math.min(
                  Math.max(hoveredStage.rect.left + hoveredStage.rect.width / 2 - 120, 12),
                  window.innerWidth - 252,
                ),
              }}
            >
              <div className="bg-[#4a352f] text-[#faf7f2] text-xs rounded-2xl px-4 py-3.5 shadow-2xl">
                <p className="font-semibold mb-1.5 text-sm">{stage.name}</p>
                <p className="text-[#e6d7c3] leading-relaxed">{stage.tooltip}</p>
                <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[#c8b6a6]">{percentage}% of all matches</span>
                  <span className="text-[#a67c52] font-semibold">
                    {count} match{count === 1 ? "" : "es"}
                  </span>
                </div>
                <p className="text-[10px] text-[#c8b6a6] mt-1.5">
                  {isSelected ? "Press to clear this filter" : "Press to filter the table"}
                </p>
              </div>
            </div>
          </PopupPortal>
        )}
      </div>
    )
  }

  const renderArrow = (idx) => {
    const stage = LIVE_STAGES[idx]
    const nextStage = LIVE_STAGES[idx + 1]
    const fromCount = cumulativeCounts[stage.id] || 0
    const toCount = cumulativeCounts[nextStage.id] || 0
    const rate = fromCount > 0 ? ((toCount / fromCount) * 100).toFixed(1) : "0.0"

    return (
      <div className="flex flex-col items-center justify-center px-0.5 flex-shrink-0" style={{ minWidth: "38px" }}>
        <span
          className="text-[10px] font-bold text-[#7d5a50] mb-0.5 whitespace-nowrap"
          title="Share of matches at this step or beyond that reach the next step"
        >
          {rate}%
        </span>
        <div className="flex items-center">
          <div className="w-5 h-[2px] bg-gradient-to-r from-[#7d5a50] to-[#a67c52]" />
          <ArrowRight size={14} className="text-[#5a4038] -ml-1" strokeWidth={2.5} />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`w-full font-sans bg-gradient-to-br from-[#faf7f2] to-[#f5f0e1] rounded-3xl p-7 shadow-xl border border-[#e6d7c3] ${className}`}
    >
      <div className="flex items-center justify-between mb-7 flex-wrap gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center shadow-md">
            <Briefcase size={20} className="text-[#faf7f2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#4a352f] tracking-tight">DealFlow Pipeline</h2>
              <Sparkles size={14} className="text-[#a67c52]" />
            </div>
            <p className="text-xs text-[#7d5a50] mt-0.5">
              {total} internship match{total === 1 ? "" : "es"}, stage by stage
            </p>
          </div>
        </div>

        <span
          className="flex items-center gap-1.5 text-[11px] text-[#a89482]"
          title="On a card: share of all your matches. On an arrow: share of that step which reaches the next, counting live stages only."
        >
          <HelpCircle size={12} /> Cards show share of all matches; arrows show step-to-step conversion
        </span>
      </div>

      {loading ? (
        <PipelineSkeleton />
      ) : (
        <>
          {/* `items-stretch` here and `h-full` on each card body are what keep a
              multi-line name from making one card shorter than its neighbours. */}
          <div className="flex items-stretch overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#c8b6a6] scrollbar-track-transparent">
            {/* Live funnel — one card per stage, an arrow in every gap */}
            {LIVE_STAGES.map((stage, idx) => (
              <div key={stage.id} className="flex items-stretch flex-shrink-0">
                {renderStageCard(stage)}
                {idx < LIVE_STAGES.length - 1 && renderArrow(idx)}
              </div>
            ))}

            {/* Exit state — its own red border, no arrow */}
            {TERMINAL_STAGES.length > 0 && (
              <div className="flex items-stretch flex-shrink-0">
                <div className="flex flex-col items-center px-2 flex-shrink-0 self-stretch justify-center">
                  <div className="w-px h-10 bg-[#e6d7c3]" />
                </div>
                <div
                  className="flex items-stretch gap-1.5 flex-shrink-0 p-1.5 rounded-2xl"
                  style={{ border: "2px solid #D32F2F" }}
                >
                  {TERMINAL_STAGES.map((stage) => (
                    <div key={stage.id} className="flex flex-shrink-0">
                      {renderStageCard(stage)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center mt-4 flex-wrap gap-3">
            {selectedStage ? (
              <div className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-[#a67c52]/10 border border-[#a67c52]/40">
                <span className="text-xs font-semibold text-[#7d5a50]">Filtering</span>
                <span className="text-xs font-bold text-[#4a352f]">{selectedStage}</span>
                <button
                  onClick={() => handleStageClick(selectedStage)}
                  className="p-1 rounded-full hover:bg-white/70 text-[#7d5a50] hover:text-[#4a352f] transition-colors"
                  title="Clear filter"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#a89482] font-medium">Click a stage to filter the table below</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default InternDealflow