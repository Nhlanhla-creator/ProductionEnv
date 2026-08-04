"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import {
  Target,
  FileText,
  Search,
  Shield,
  AlertCircle,
  FileCheck,
  CheckCircle,
  XCircle,
  LogOut,
  ArrowRight,
  Briefcase,
  Sparkles,
  HelpCircle,
  X,
} from "lucide-react"
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../../firebaseConfig"
import { DEFAULT_STAGES, mapStatusToStageId, getStageColors } from "../../catalyst/CatalystMatches/stageConfig"

/* ════════════════════════════════════════════════════════════════════════════
   Events the table can use to talk to this pipeline.

   Declared here rather than in accelerator-table.jsx because this file
   imports nothing from the table — so the table can import these without
   creating a circular module dependency. (Every other pipeline in the app
   has it the other way round, because those pipelines import their status
   vocabulary from their table.)

     ACCELERATOR_STAGE_FILTER_EVENT   pipeline → table. Detail is the pressed
                                      stage id, or null to clear. The page
                                      already wires this through
                                      `onStageClick`; the event is the
                                      fallback for when it doesn't.
     ACCELERATOR_ROWS_EVENT           table → pipeline. Detail is every row
                                      the table holds, each with a resolved
                                      `status`. Send it and the cards count
                                      exactly what the table shows — including
                                      Matched, which has no Firestore record
                                      and is otherwise inferred.
     ACCELERATOR_ROWS_REQUEST_EVENT   pipeline → table. Asks for a
                                      re-broadcast, for whichever component
                                      mounted second.
   ════════════════════════════════════════════════════════════════════════ */
export const ACCELERATOR_STAGE_FILTER_EVENT = "accelerator-pipeline-stage-filter"
export const ACCELERATOR_ROWS_EVENT = "accelerator-pipeline-rows"
export const ACCELERATOR_ROWS_REQUEST_EVENT = "accelerator-pipeline-rows-request"

/* ────────────────────────────────────────────────────────────────────────────
   Shares the stage vocabulary with the catalyst side via stageConfig.js.
   LEGACY_STATUS_ALIASES resolves records written before the two sides were
   unified, so no data migration is needed.

   Known limitation, unchanged: a catalyst's custom stage renaming and
   reordering lives in that catalyst's browser localStorage rather than
   Firestore, so this view always groups by the shared BIG defaults.
   ──────────────────────────────────────────────────────────────────────── */
const LEGACY_STATUS_ALIASES = {
  Match: "Matched",
  "New Application": "Matched",
  "Application Sent": "Applied",
  "Under Review": "Evaluation",
  "In Review": "Evaluation",
  Shortlisted: "Due Diligence",
  "Term Sheet": "Offer",
  "Support Approved": "Offer",
  Active: "Admitted",
  "Active Support": "Admitted",
  "Successful Deals": "Admitted",
  "Graduated Successfully": "Admitted",
  Exit: "Admitted",
  Decline: "Declined",
  "Support Declined": "Declined",
  Rejected: "Declined",
}
const normalizeStatus = (status) => LEGACY_STATUS_ALIASES[status] || status

const ENTRY_STAGE_ID = "matched"

/* Cards are wider than they were and stage names wrap onto another line rather
   than being cut off with an ellipsis — a stage nobody can read isn't a stage.
   Names here come from stageConfig.js and can be long ("Due Diligence"), so
   every card in the row stretches to the height of the tallest one (see
   `items-stretch` on the row plus `h-full` on the card body). */
const CARD_WIDTH = 124

/* A slash with no space around it is one unbreakable token to the line-breaker,
   so it would split mid-word. A zero-width space after each slash gives it a
   clean place to break. Display only — stage ids and statuses are untouched. */
const softBreak = (name = "") => name.replace(/\//g, "/\u200B")

const ICONS = { Target, FileText, Search, Shield, AlertCircle, FileCheck, CheckCircle, XCircle, LogOut }
const getIcon = (name, size = 16, color = "#4a352f") => {
  const Cmp = ICONS[name] || Target
  return <Cmp size={size} style={{ color }} />
}

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
   AcceleratorFlowPipeline

   Props (all optional):
     accelerators   every catalyst programme the SME can see. Used with
                    `applications` to derive Matched, which has no Firestore
                    record of its own.
     applications   the SME's smeCatalystApplications rows.
     onStageClick   called with the stage id on press, null when cleared.

   Where the counts come from, in order of preference:
     1. The table's broadcast, if accelerator-table.jsx sends one. Its rows
        carry a resolved status, so the cards and the table body can't
        disagree.
     2. This component's own query plus the `accelerators` prop.

   Selection lives here. Pressing a card fires both the callback and the
   window event, so the table filters whether or not the page wires props.
   ════════════════════════════════════════════════════════════════════════ */
export function AcceleratorFlowPipeline({ accelerators = [], applications = [], onStageClick, className = "" }) {
  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hoveredStage, setHoveredStage] = useState(null)
  const [selectedStage, setSelectedStage] = useState(null)
  const [smeApplications, setSmeApplications] = useState([])
  const [tableRows, setTableRows] = useState(null)

  /* The table's broadcast beats every other source. Asking for it on mount
     covers the case where the table rendered first. Nothing breaks if the
     table never sends one — the query below still runs. */
  useEffect(() => {
    if (typeof window === "undefined") return
    const onRows = (e) => {
      if (!Array.isArray(e.detail)) return
      setTableRows(e.detail)
      setLoading(false)
    }
    window.addEventListener(ACCELERATOR_ROWS_EVENT, onRows)
    window.dispatchEvent(new Event(ACCELERATOR_ROWS_REQUEST_EVENT))
    return () => window.removeEventListener(ACCELERATOR_ROWS_EVENT, onRows)
  }, [])

  const usingTable = Array.isArray(tableRows)

  /* Was a bare auth.currentUser read on mount with no retry — on a cold load
     Firebase hasn't restored the session yet, so effectiveUserId stayed null
     and every card showed zero permanently. */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setEffectiveUserId(null)
        setAuthResolved(true)
        setLoading(false)
        return
      }

      try {
        const userDocSnap = await getDoc(doc(db, "users", user.uid))
        if (userDocSnap.exists()) {
          const userCompanyId = userDocSnap.data().companyId
          if (userCompanyId) {
            const companyDocSnap = await getDoc(doc(db, "companies", userCompanyId))
            if (companyDocSnap.exists()) {
              setEffectiveUserId(companyDocSnap.data().createdBy || user.uid)
              setAuthResolved(true)
              return
            }
          }
        }
        setEffectiveUserId(user.uid)
      } catch (error) {
        console.error("Error checking company membership:", error)
        setEffectiveUserId(user.uid)
      } finally {
        setAuthResolved(true)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (usingTable) return
    if (!authResolved) return
    if (!effectiveUserId) {
      setLoading(false)
      return
    }

    const fetchApplications = async () => {
      try {
        const q = query(collection(db, "smeCatalystApplications"), where("smeId", "==", effectiveUserId))
        const querySnapshot = await getDocs(q)
        setSmeApplications(querySnapshot.docs.map((d) => d.data()))
      } catch (error) {
        console.error("Error fetching applications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [usingTable, authResolved, effectiveUserId, applications])

  /* "Matched" means available to apply to and not yet applied — there is no
     Firestore record for those, so it's derived from the matches table
     rather than from a status string. */
  const matchedCount = useMemo(() => {
    const appliedKeys = new Set(smeApplications.map((app) => `${app.catalystId}_${app.programIndex || 0}`))
    return accelerators.filter((acc) => {
      const key = `${acc.originalCatalystId || acc.id}_${acc.programIndex || 0}`
      return !appliedKeys.has(key)
    }).length
  }, [accelerators, smeApplications])

  const counts = useMemo(() => {
    const result = {}
    for (const stage of DEFAULT_STAGES) result[stage.id] = 0
    const unrecognised = []

    if (usingTable) {
      /* Every broadcast row already carries a resolved status, Matched
         included, so this is a straight tally. */
      tableRows.forEach((row) => {
        const stageId = mapStatusToStageId(normalizeStatus(row.status || row.pipelineStage), DEFAULT_STAGES)
        if (result[stageId] !== undefined) {
          result[stageId] += 1
        } else {
          result[ENTRY_STAGE_ID] += 1
          unrecognised.push(row.status || row.pipelineStage)
        }
      })
    } else {
      result[ENTRY_STAGE_ID] = matchedCount
      smeApplications.forEach((app) => {
        const raw = app.status || app.pipelineStage
        const stageId = mapStatusToStageId(normalizeStatus(raw), DEFAULT_STAGES)
        if (stageId === ENTRY_STAGE_ID) return
        if (result[stageId] !== undefined) {
          result[stageId] += 1
        } else {
          /* Counted under Matched rather than dropped. The old version had a
             bare `if (result[stageId] !== undefined)` with no else, so an
             unrecognised status silently vanished from every card while the
             percentages carried on as if it had never existed. */
          result[ENTRY_STAGE_ID] += 1
          unrecognised.push(raw)
        }
      })
    }

    if (unrecognised.length > 0) {
      console.warn(
        "[AcceleratorFlowPipeline] counted under Matched — no stage covers these statuses:",
        [...new Set(unrecognised)],
      )
    }

    return result
  }, [usingTable, tableRows, smeApplications, matchedCount])

  const liveStages = useMemo(() => DEFAULT_STAGES.filter((s) => !s.terminal).sort((a, b) => a.order - b.order), [])
  const terminalStages = useMemo(() => DEFAULT_STAGES.filter((s) => s.terminal), [])

  const totalBusinesses = useMemo(() => Object.values(counts).reduce((sum, c) => sum + c, 0), [counts])

  const getStagePercentage = useCallback(
    (count) => (totalBusinesses === 0 ? 0 : ((count / totalBusinesses) * 100).toFixed(1)),
    [totalBusinesses],
  )

  /* Card percentage and arrow percentage answer different questions, and the
     old version quietly used different denominators for them without saying
     so. They still differ — a card is a share of everything, an arrow is a
     step-to-step conversion through the live funnel — but the tooltips now
     name which is which. */
  const cumulativeCounts = useMemo(() => {
    let runningTotal = 0
    const result = {}
    for (let i = liveStages.length - 1; i >= 0; i--) {
      runningTotal += counts[liveStages[i].id] || 0
      result[liveStages[i].id] = runningTotal
    }
    return result
  }, [liveStages, counts])

  const handleStageClick = useCallback(
    (stageId) => {
      setSelectedStage((prev) => {
        const next = prev === stageId ? null : stageId
        onStageClick?.(next)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(ACCELERATOR_STAGE_FILTER_EVENT, { detail: next }))
        }
        return next
      })
    },
    [onStageClick],
  )

  /* The card body is a flex column at `h-full`: the name sits at the top and
     is free to run to a second line, while `mt-auto` pins the count and the
     progress bar to the bottom edge. That keeps the numbers on one baseline
     across the row no matter how many lines each name takes. */
  const renderStageCard = (stage) => {
    const isHovered = hoveredStage?.id === stage.id
    const isSelected = selectedStage === stage.id
    const count = counts[stage.id] || 0
    const percentage = getStagePercentage(count)
    const isNegativeOutcome = stage.terminal && /declined|withdrawn/i.test(stage.name || "")
    const theme = isNegativeOutcome ? { from: "#4b4844", to: "#242220" } : { from: "#4a352f", to: "#241a14" }

    const showTip = (el) => setHoveredStage({ id: stage.id, rect: el.getBoundingClientRect() })
    const hideTip = () => setHoveredStage(null)

    return (
      <div className="relative flex-shrink-0 h-full" style={{ width: `${CARD_WIDTH}px` }}>
        <button
          type="button"
          onClick={() => handleStageClick(stage.id)}
          onMouseEnter={(e) => showTip(e.currentTarget)}
          onMouseLeave={hideTip}
          onFocus={(e) => showTip(e.currentTarget)}
          onBlur={hideTip}
          aria-pressed={!!isSelected}
          aria-label={`${stage.name}: ${count} catalyst${count === 1 ? "" : "s"}`}
          className={`w-full h-full flex flex-col text-left rounded-xl p-2.5 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a67c52] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f2] ${
            isSelected ? "scale-105" : "hover:scale-[1.02]"
          } ${isHovered || isSelected ? "shadow-xl -translate-y-1" : "shadow-md"}`}
          style={{
            background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
            border: `1.5px solid ${isSelected ? "#d9b98a" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          <div className="flex items-start gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-white/10 flex-shrink-0">
              {getIcon(stage.icon, 11, "#ffffff")}
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
        </button>

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
                {stage.tooltip && <p className="text-[#e6d7c3] leading-relaxed">{stage.tooltip}</p>}
                <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[#c8b6a6]">{percentage}% of all matches</span>
                  <span className="text-[#a67c52] font-semibold">
                    {count} catalyst{count === 1 ? "" : "s"}
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
    const stage = liveStages[idx]
    const nextStage = liveStages[idx + 1]
    const fromCount = cumulativeCounts[stage.id] || 0
    const toCount = cumulativeCounts[nextStage.id] || 0
    const rate = fromCount > 0 ? ((toCount / fromCount) * 100).toFixed(1) : "0.0"

    return (
      <div className="flex flex-col items-center justify-center px-0.5 flex-shrink-0" style={{ minWidth: "38px" }}>
        <span
          className="text-[10px] font-bold text-[#7d5a50] mb-0.5 whitespace-nowrap"
          title="Share of catalysts at this step or beyond that reach the next step"
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
              {/* Named for what it holds. Four other pipelines in this app were
                  also called "Dealflow Pipeline", which is unhelpful the
                  moment two of them appear in the same session. */}
              <h2 className="text-xl font-bold text-[#4a352f] tracking-tight">Catalyst Pipeline</h2>
              <Sparkles size={14} className="text-[#a67c52]" />
            </div>
            <p className="text-xs text-[#7d5a50] mt-0.5">
              {totalBusinesses} match{totalBusinesses === 1 ? "" : "es"}, stage by stage
            </p>
          </div>
        </div>

        <span
          className="flex items-center gap-1.5 text-[11px] text-[#a89482]"
          title="On a card: share of all your matches. On an arrow: share of this step that reaches the next, counting live stages only."
        >
          <HelpCircle size={12} /> Cards show share of all matches; arrows show step-to-step conversion
        </span>
      </div>

      {loading ? (
        <PipelineSkeleton />
      ) : (
        <>
          {/* `items-stretch` here and `h-full` on each card body are what keep a
              two-line name from making one card shorter than its neighbours. */}
          <div className="flex items-stretch overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#c8b6a6] scrollbar-track-transparent">
            {/* Live funnel — one card per stage, an arrow in every gap */}
            {liveStages.map((stage, idx) => (
              <div key={stage.id} className="flex items-stretch flex-shrink-0">
                {renderStageCard(stage)}
                {idx < liveStages.length - 1 && renderArrow(idx)}
              </div>
            ))}

            {/* Exit states. Positive endings (Admitted) sit after the divider
                on their own; Declined and Withdrawn share one red outline,
                with no arrows into or between them. */}
            {terminalStages.length > 0 &&
              (() => {
                const negativeStages = terminalStages.filter((s) => /declined|withdrawn/i.test(s.name || ""))
                const otherStages = terminalStages.filter((s) => !/declined|withdrawn/i.test(s.name || ""))
                return (
                  <div className="flex items-stretch flex-shrink-0">
                    <div className="flex flex-col items-center px-2 flex-shrink-0 self-stretch justify-center">
                      <div className="w-px h-10 bg-[#e6d7c3]" />
                    </div>
                    <div className="flex items-stretch gap-2 flex-shrink-0">
                      {otherStages.map((stage) => (
                        <div key={stage.id} className="flex flex-shrink-0">
                          {renderStageCard(stage)}
                        </div>
                      ))}
                      {negativeStages.length > 0 && (
                        <div
                          className="flex items-stretch gap-1.5 flex-shrink-0 p-1.5 rounded-2xl"
                          style={{ border: "2px solid #D32F2F" }}
                        >
                          {negativeStages.map((stage) => (
                            <div key={stage.id} className="flex flex-shrink-0">
                              {renderStageCard(stage)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
          </div>

          <div className="flex items-center mt-4 flex-wrap gap-3">
            {selectedStage ? (
              <div className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-[#a67c52]/10 border border-[#a67c52]/40">
                <span className="text-xs font-semibold text-[#7d5a50]">Filtering</span>
                <span className="text-xs font-bold text-[#4a352f]">
                  {DEFAULT_STAGES.find((s) => s.id === selectedStage)?.name}
                </span>
                <button
                  onClick={() => handleStageClick(selectedStage)}
                  className="p-1 rounded-full hover:bg-white/70 text-[#7d5a50] hover:text-[#4a352f] transition-colors"
                  title="Clear filter"
                  aria-label="Clear filter"
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

export default AcceleratorFlowPipeline