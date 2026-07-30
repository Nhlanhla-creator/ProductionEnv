"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import {
  Target,
  Eye,
  ListChecks,
  Send,
  Search,
  Phone,
  Award,
  CheckCircle,
  XCircle,
  Archive,
  ArrowRight,
  Briefcase,
  Sparkles,
  HelpCircle,
  X,
} from "lucide-react"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../../firebaseConfig"
import {
  SME_ADVISOR_COLLECTION,
  normalizeAdvisorStatus,
  ADVISOR_STAGE_FILTER_EVENT,
  ADVISOR_ROWS_EVENT,
  ADVISOR_ROWS_REQUEST_EVENT,
} from "./advisor-table"

/* ════════════════════════════════════════════════════════════════════════════
   Stage definitions — array order is display order.

   These are the same status strings advisor-table.jsx writes and filters on —
   the previous version had its own vocabulary entirely (Applications, Matches,
   Evaluation, Negotiation, Term Issued, Deal Closed), none of which the table
   ever produced, so the cards could never agree with the rows beneath them.

   The `level` field is gone. It grouped Viewed with Shortlisted and Under
   Review with Interviewing into arrowless pairs, which read as combined
   cards; every live stage now gets its own card and its own arrow.

   Declined and Closed are `terminal`: they sit together inside one red
   outline at the end, with no arrows into or between them, because leaving
   the pipeline isn't a step it flows through.
   ════════════════════════════════════════════════════════════════════════ */
const STAGE_DEFINITIONS = [
  { id: "new_match", name: "New Match", statuses: ["New Match"], icon: Target, tooltip: "Advisors matched to your profile that you haven't acted on yet." },
  { id: "viewed", name: "Viewed", statuses: ["Viewed"], icon: Eye, tooltip: "Profiles you've opened but not shortlisted." },
  { id: "shortlisted", name: "Shortlisted", statuses: ["Shortlisted"], icon: ListChecks, tooltip: "Advisors you've flagged as worth approaching." },
  { id: "contacted", name: "Contacted", statuses: ["Contacted"], icon: Send, tooltip: "Connection requests you've sent." },
  { id: "under_review", name: "Under Review", statuses: ["Under Review"], icon: Search, tooltip: "Advisors considering your request." },
  { id: "interviewing", name: "Interviewing", statuses: ["Interviewing"], icon: Phone, tooltip: "Introductory calls arranged or held." },
  { id: "accepted", name: "Accepted", statuses: ["Accepted"], icon: Award, tooltip: "Advisor has agreed to work with you." },
  { id: "engaged", name: "Engaged / Placed", statuses: ["Engaged/Placed"], icon: CheckCircle, tooltip: "Engagement is live." },
  { id: "declined", name: "Declined", statuses: ["Declined"], icon: XCircle, terminal: true, tooltip: "Advisor declined, or you withdrew." },
  { id: "closed", name: "Closed", statuses: ["Closed"], icon: Archive, terminal: true, tooltip: "Conversation ended without an engagement." },
]

const LIVE_STAGES = STAGE_DEFINITIONS.filter((s) => !s.terminal)
const TERMINAL_STAGES = STAGE_DEFINITIONS.filter((s) => s.terminal)
const ENTRY_STAGE_ID = STAGE_DEFINITIONS[0].id

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
          style={{ width: "112px", height: "88px" }}
        >
          <div className="p-2.5 flex flex-col h-full justify-between">
            <div className="h-2.5 w-16 rounded-full bg-[#c8b6a6]/40" />
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
   AdvisorFlowPipeline

   Props (all optional):
     totalAdvisors   fallback only. Used when the counts come from Firestore
                     rather than from the table, because "New Match" means "no
                     record exists yet" and there is nothing to count for
                     those rows.
     applications    pre-fetched SmeAdvisorApplications rows.
     onStageClick    called with the status name on press, null when cleared.

   Where the counts come from, in order of preference:
     1. AdvisorTable's broadcast. Its rows carry a resolved status, so the
        cards and the table body can't disagree — including New Match, which
        has no stored record at all.
     2. The `applications` prop.
     3. Its own Firestore query.

   Selection lives in this component. Pressing a card always highlights it and
   fires both the callback and the window event, so the table filters whether
   or not the page wires the props.
   ════════════════════════════════════════════════════════════════════════ */
export function AdvisorFlowPipeline({ totalAdvisors = 0, applications: applicationsProp, onStageClick, className = "" }) {
  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [fetchedRows, setFetchedRows] = useState([])
  const [tableRows, setTableRows] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hoveredStage, setHoveredStage] = useState(null)
  const [selectedStage, setSelectedStage] = useState(null)

  /* The table's broadcast beats every other source. Asking for it on mount
     covers the case where the table rendered first. */
  useEffect(() => {
    if (typeof window === "undefined") return
    const onRows = (e) => {
      if (!Array.isArray(e.detail)) return
      setTableRows(e.detail)
      setLoading(false)
    }
    window.addEventListener(ADVISOR_ROWS_EVENT, onRows)
    window.dispatchEvent(new Event(ADVISOR_ROWS_REQUEST_EVENT))
    return () => window.removeEventListener(ADVISOR_ROWS_EVENT, onRows)
  }, [])

  const usingTable = Array.isArray(tableRows)
  const usingProvided = !usingTable && Array.isArray(applicationsProp)
  const needsOwnFetch = !usingTable && !usingProvided

  useEffect(() => {
    if (!needsOwnFetch) return undefined
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setEffectiveUserId(null)
        setAuthResolved(true)
        setLoading(false)
        return
      }
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid))
        const companyId = userSnap.exists() ? userSnap.data().companyId : null
        if (companyId) {
          const companySnap = await getDoc(doc(db, "companies", companyId))
          if (companySnap.exists()) {
            setEffectiveUserId(companySnap.data().createdBy || user.uid)
            setAuthResolved(true)
            return
          }
        }
        setEffectiveUserId(user.uid)
      } catch (error) {
        console.error("Error resolving company membership:", error)
        setEffectiveUserId(user.uid)
      } finally {
        setAuthResolved(true)
      }
    })
    return () => unsubscribe()
  }, [needsOwnFetch])

  useEffect(() => {
    if (usingTable) return undefined
    if (usingProvided) {
      setFetchedRows(applicationsProp)
      setLoading(false)
      return undefined
    }
    if (!authResolved) return undefined
    if (!effectiveUserId) {
      setLoading(false)
      return undefined
    }

    let cancelled = false
    const load = async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, SME_ADVISOR_COLLECTION), where("smeId", "==", effectiveUserId)),
        )
        if (!cancelled) setFetchedRows(snapshot.docs.map((d) => d.data()))
      } catch (error) {
        console.error("Error fetching advisor applications:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [usingTable, usingProvided, applicationsProp, authResolved, effectiveUserId])

  /* Counts are derived, not stored. The old version mirrored props into
     `stages` state via an effect whose dependency array included a default
     `{}` object literal — a fresh reference every render, so the effect
     re-fired forever. Derived state needs no effect and can't loop. */
  const counts = useMemo(() => {
    const result = Object.fromEntries(STAGE_DEFINITIONS.map((s) => [s.id, 0]))
    const unrecognised = []

    if (usingTable) {
      /* Every broadcast row already carries a resolved status, New Match
         included, so this is a straight tally. */
      tableRows.forEach((row) => {
        const status = normalizeAdvisorStatus(row.status)
        const stage = STAGE_DEFINITIONS.find((s) => s.statuses.includes(status))
        if (stage) {
          result[stage.id] += 1
        } else {
          result[ENTRY_STAGE_ID] += 1
          unrecognised.push(status)
        }
      })
    } else {
      fetchedRows.forEach((app) => {
        const status = normalizeAdvisorStatus(app.status)
        const stage = STAGE_DEFINITIONS.find((s) => s.statuses.includes(status))
        if (stage) {
          result[stage.id] += 1
        } else {
          result[ENTRY_STAGE_ID] += 1
          unrecognised.push(status)
        }
      })
      // No Firestore record exists until the SME acts, so New Match is
      // everything matched minus everything with a record.
      result[ENTRY_STAGE_ID] += Math.max(0, (totalAdvisors || 0) - fetchedRows.length)
    }

    if (unrecognised.length > 0) {
      /* Counted under New Match rather than dropped, so the percentages still
         reach 100 and no advisor disappears from the funnel. The console is
         the right place for this — an SME shouldn't be reading about
         STAGE_DEFINITIONS. */
      console.warn(
        "[AdvisorFlowPipeline] counted under New Match — no card covers these statuses:",
        [...new Set(unrecognised)],
      )
    }

    return result
  }, [usingTable, tableRows, fetchedRows, totalAdvisors])

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
        window.dispatchEvent(new CustomEvent(ADVISOR_STAGE_FILTER_EVENT, { detail: next }))
      }
    },
    [selectedStage, onStageClick],
  )

  /* One renderer for every card — live and terminal — so Declined/Closed keep
     the same shape and size as the rest. Only the palette differs. */
  const renderStageCard = (stage) => {
    const isHovered = hoveredStage?.id === stage.id
    const status = stage.statuses[0]
    const isSelected = selectedStage === status
    const count = counts[stage.id] || 0
    const percentage = getPercentage(count)
    const theme = stage.terminal
      ? { from: "#4b4844", to: "#242220" } // dark grey — Declined / Closed
      : { from: "#4a352f", to: "#241a14" } // dark brown — every other stage
    const Icon = stage.icon

    return (
      <div
        className={`relative flex-shrink-0 cursor-pointer group transition-all duration-300 ${
          isSelected ? "scale-105" : "hover:scale-[1.02]"
        }`}
        style={{ width: "112px" }}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`${stage.name}: ${count} advisor${count === 1 ? "" : "s"}`}
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
          className={`rounded-xl p-2.5 transition-all duration-300 ${
            isHovered || isSelected ? "shadow-xl -translate-y-1" : "shadow-md hover:shadow-lg"
          }`}
          style={{
            background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
            border: `1.5px solid ${isSelected ? "#d9b98a" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-white/10 flex-shrink-0">
              <Icon size={11} className="text-white" />
            </div>
            <h3 className="font-semibold text-white text-[9px] uppercase tracking-wide leading-tight truncate flex-1">
              {stage.name}
            </h3>
          </div>
          <div className="flex items-baseline justify-center">
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
                    {count} advisor{count === 1 ? "" : "s"}
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
      <div className="flex flex-col items-center px-0.5 flex-shrink-0" style={{ minWidth: "38px" }}>
        <span
          className="text-[10px] font-bold text-[#7d5a50] mb-0.5 whitespace-nowrap"
          title="Share of advisors at this step or beyond that reach the next step"
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
              {total} advisor match{total === 1 ? "" : "es"}, stage by stage
            </p>
          </div>
        </div>

        <span
          className="flex items-center gap-1.5 text-[11px] text-[#a89482]"
          title="On a card: share of all your advisor matches. On an arrow: share of that step which reaches the next, counting live stages only."
        >
          <HelpCircle size={12} /> Cards show share of all matches; arrows show step-to-step conversion
        </span>
      </div>

      {loading ? (
        <PipelineSkeleton />
      ) : (
        <>
          <div className="flex items-stretch overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#c8b6a6] scrollbar-track-transparent">
            {/* Live funnel — one card per stage, an arrow in every gap */}
            {LIVE_STAGES.map((stage, idx) => (
              <div key={stage.id} className="flex items-center flex-shrink-0">
                {renderStageCard(stage)}
                {idx < LIVE_STAGES.length - 1 && renderArrow(idx)}
              </div>
            ))}

            {/* Exit states — one shared red border, no arrows */}
            {TERMINAL_STAGES.length > 0 && (
              <div className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center px-2 flex-shrink-0 self-stretch justify-center">
                  <div className="w-px h-10 bg-[#e6d7c3]" />
                </div>
                <div
                  className="flex items-center gap-1.5 flex-shrink-0 p-1.5 rounded-2xl"
                  style={{ border: "2px solid #D32F2F" }}
                >
                  {TERMINAL_STAGES.map((stage) => (
                    <div key={stage.id} className="flex-shrink-0">
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

export default AdvisorFlowPipeline