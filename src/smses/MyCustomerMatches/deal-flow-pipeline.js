"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  Target,
  Eye,
  ListChecks,
  Send,
  FileEdit,
  FileCheck,
  Search,
  Award,
  XCircle,
  Archive,
  ArrowRight,
  Briefcase,
  Sparkles,
  HelpCircle,
  X,
} from "lucide-react"
import {
  CUSTOMER_STATUSES,
  normalizeCustomerStatus,
  CUSTOMER_STAGE_FILTER_EVENT,
  CUSTOMER_ROWS_EVENT,
  CUSTOMER_ROWS_REQUEST_EVENT,
} from "./customer-table"

/* The three event names are declared in customer-table.jsx and imported here
   rather than the other way around: this file already imports the status
   vocabulary from there, and pointing the imports back would make a circular
   module dependency. Same pattern SupportSMETable uses for
   PIPELINE_SETTINGS_EVENT — one side owns the constant, the other listens. */

/* ════════════════════════════════════════════════════════════════════════════
   Stage definitions — array order is display order.

   The old `level` field grouped Viewed with Shortlisted and Contacted with
   Application Started into arrowless pairs. It's gone: every live stage gets
   its own card and its own arrow.

   Declined and Closed are `terminal`. They sit together inside one red
   outline at the end, no arrows, exactly like Declined/Withdrawn in the
   support pipeline.
   ════════════════════════════════════════════════════════════════════════ */
const STAGE_DEFINITIONS = [
  { id: "new_match", name: "New Match", statuses: ["New Match"], icon: Target, tooltip: "Opportunities matched to you that you haven't opened yet." },
  { id: "viewed", name: "Viewed", statuses: ["Viewed"], icon: Eye, tooltip: "Opportunities you've opened but not shortlisted." },
  { id: "shortlisted", name: "Shortlisted", statuses: ["Shortlisted"], icon: ListChecks, tooltip: "Opportunities you've flagged as worth pursuing." },
  { id: "contacted", name: "Contacted", statuses: ["Contacted"], icon: Send, tooltip: "You've reached out to the customer." },
  { id: "started", name: "Application Started", statuses: ["Application Started"], icon: FileEdit, tooltip: "A proposal or quote is in progress." },
  { id: "applied", name: "Applied", statuses: ["Applied"], icon: FileCheck, tooltip: "Proposal or quote submitted." },
  { id: "under_review", name: "Under Review", statuses: ["Under Review"], icon: Search, tooltip: "The customer is evaluating your submission." },
  { id: "accepted", name: "Accepted", statuses: ["Accepted"], icon: Award, tooltip: "You won the work." },
  { id: "declined", name: "Declined", statuses: ["Declined"], icon: XCircle, terminal: true, tooltip: "Not selected, or you withdrew." },
  { id: "closed", name: "Closed", statuses: ["Closed"], icon: Archive, terminal: true, tooltip: "The opportunity closed without an award." },
]

const LIVE_STAGES = STAGE_DEFINITIONS.filter((s) => !s.terminal)
const TERMINAL_STAGES = STAGE_DEFINITIONS.filter((s) => s.terminal)

const ALL_MAPPED = new Set(STAGE_DEFINITIONS.flatMap((s) => s.statuses))

/* Every status the table can write should have a card. */
const UNCOVERED_STATUSES = CUSTOMER_STATUSES.filter((s) => !ALL_MAPPED.has(s))
if (UNCOVERED_STATUSES.length > 0) {
  console.warn("[CustomerFlowPipeline] statuses with no card:", UNCOVERED_STATUSES)
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

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#f5f0e1] to-[#e6d7c3] flex items-center justify-center mb-5 shadow-inner">
      <Briefcase size={36} className="text-[#a89482]" />
    </div>
    <h3 className="text-xl font-bold text-[#4a352f] mb-2">No Opportunities in Pipeline</h3>
    <p className="text-sm text-[#7d5a50] text-center max-w-sm leading-relaxed">
      Matched procurement opportunities appear here once customers publish them.
    </p>
  </div>
)

/* ════════════════════════════════════════════════════════════════════════════
   CustomerFlowPipeline

   Props:
     applications   OPTIONAL. Leave it off and the pipeline uses the rows
                    CustomerTable broadcasts, which guarantees the card
                    counts and the table body agree. Pass it only if the
                    page genuinely has its own row list.
     loading        optional, renders the skeleton.
     onStageClick   called with the status name on press, null when cleared.

   Selection lives in this component, like SupportDealFlowPipeline. Pressing
   a card highlights it, fires onStageClick, and broadcasts the status so
   CustomerTable can filter itself with no wiring on the page at all.
   ════════════════════════════════════════════════════════════════════════ */
export function CustomerFlowPipeline({ applications, loading = false, onStageClick, className = "" }) {
  const [hoveredStage, setHoveredStage] = useState(null)
  const [selectedStage, setSelectedStage] = useState(null)
  const [tableRows, setTableRows] = useState([])

  /* CustomerTable broadcasts its own row list, so the cards count exactly
     what the table holds. Without this the two disagree: the table fetches
     from Firestore itself, so any `applications` the page passes in comes
     from a different query. The request event covers mounting after the
     table has already broadcast. */
  useEffect(() => {
    if (typeof window === "undefined") return
    const onRows = (e) => setTableRows(Array.isArray(e.detail) ? e.detail : [])
    window.addEventListener(CUSTOMER_ROWS_EVENT, onRows)
    window.dispatchEvent(new Event(CUSTOMER_ROWS_REQUEST_EVENT))
    return () => window.removeEventListener(CUSTOMER_ROWS_EVENT, onRows)
  }, [])

  /* An explicit `applications` prop always wins, so the page can still drive
     this directly if it has the rows. */
  const rows = Array.isArray(applications) ? applications : tableRows

  const { counts } = useMemo(() => {
    const result = Object.fromEntries(STAGE_DEFINITIONS.map((s) => [s.id, 0]))
    const unmappedStatuses = []

    rows.forEach((app) => {
      const status = normalizeCustomerStatus(app.status)
      const stage = STAGE_DEFINITIONS.find((s) => s.statuses.includes(status))
      if (stage) {
        result[stage.id] += 1
      } else {
        /* An unrecognised status counts into the entry stage rather than
           vanishing, so the percentages still add up to 100 and no
           opportunity goes missing from the funnel. Same fallback the
           support pipeline uses. The console line is for whoever needs to
           add the status to STAGE_DEFINITIONS; it doesn't belong on screen
           in front of a supplier. */
        result[STAGE_DEFINITIONS[0].id] += 1
        unmappedStatuses.push(status)
      }
    })

    if (unmappedStatuses.length > 0) {
      console.warn(
        "[CustomerFlowPipeline] counted under New Match — no card covers these statuses:",
        [...new Set(unmappedStatuses)],
      )
    }

    return { counts: result }
  }, [rows])

  const total = useMemo(() => STAGE_DEFINITIONS.reduce((sum, s) => sum + (counts[s.id] || 0), 0), [counts])

  const getStagePercentage = useCallback(
    (count) => (total === 0 ? 0 : ((count / total) * 100).toFixed(1)),
    [total],
  )

  /* Running total from the end of the live funnel backwards, so an arrow can
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
        window.dispatchEvent(new CustomEvent(CUSTOMER_STAGE_FILTER_EVENT, { detail: next }))
      }
    },
    [selectedStage, onStageClick],
  )

  /* One renderer for every card — live and terminal — so Declined/Closed keep
     the exact same shape and size as the rest. Only the palette differs. */
  const renderStageCard = (stage) => {
    const isHovered = hoveredStage?.id === stage.id
    const status = stage.statuses[0]
    const isSelected = selectedStage === status
    const count = counts[stage.id] || 0
    const percentage = getStagePercentage(count)
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
        aria-label={`${stage.name}: ${count} opportunit${count === 1 ? "y" : "ies"}`}
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
              className="fixed z-[1200] pointer-events-none w-[230px] font-sans"
              style={{
                top: hoveredStage.rect.bottom + 10,
                left: Math.min(
                  Math.max(hoveredStage.rect.left + hoveredStage.rect.width / 2 - 115, 12),
                  window.innerWidth - 242,
                ),
              }}
            >
              <div className="bg-[#4a352f] text-[#faf7f2] text-xs rounded-2xl px-4 py-3.5 shadow-2xl">
                <p className="font-semibold mb-1.5 text-sm">{stage.name}</p>
                <p className="text-[#e6d7c3] leading-relaxed">{stage.tooltip}</p>
                <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[#c8b6a6]">{percentage}% of pipeline</span>
                  <span className="text-[#a67c52] font-semibold">
                    {count} opportunit{count === 1 ? "y" : "ies"}
                  </span>
                </div>
              </div>
            </div>
          </PopupPortal>
        )}
      </div>
    )
  }

  return (
    <div
      className={`w-full font-sans bg-gradient-to-br from-[#faf7f2] to-[#f5f0e1] rounded-3xl p-7 shadow-xl border border-[#e6d7c3] ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-7 flex-wrap gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center shadow-md">
            <Briefcase size={20} className="text-[#faf7f2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#4a352f] tracking-tight">Dealflow Pipeline</h2>
              <Sparkles size={14} className="text-[#a67c52]" />
            </div>
            <p className="text-xs text-[#7d5a50] mt-0.5">
              {total} opportunit{total === 1 ? "y" : "ies"}, stage by stage
            </p>
          </div>
        </div>

        <span
          className="flex items-center gap-1.5 text-[11px] text-[#a89482]"
          title="On a card: share of all your opportunities. On an arrow: share of that step which reaches the next, counting live stages only."
        >
          <HelpCircle size={12} /> Cards show share of all opportunities; arrows show step-to-step conversion
        </span>
      </div>

      {loading ? (
        <PipelineSkeleton />
      ) : total === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Stage cards */}
          <div className="flex items-stretch overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#c8b6a6] scrollbar-track-transparent gap-1">
            {LIVE_STAGES.map((stage, idx) => (
              <div key={stage.id} className="flex items-center">
                {renderStageCard(stage)}

                {/* Connector — conversion into the next stage */}
                {idx < LIVE_STAGES.length - 1 &&
                  (() => {
                    const nextStage = LIVE_STAGES[idx + 1]
                    const fromCount = cumulativeCounts[stage.id] || 0
                    const toCount = cumulativeCounts[nextStage.id] || 0
                    const rate = fromCount > 0 ? ((toCount / fromCount) * 100).toFixed(1) : "0.0"
                    return (
                      <div className="flex flex-col items-center px-0.5 flex-shrink-0" style={{ minWidth: "34px" }}>
                        <span
                          className="text-[10px] font-bold text-[#7d5a50] mb-0.5 whitespace-nowrap"
                          title="Share of this stage that reaches the next"
                        >
                          {rate}%
                        </span>
                        <div className="flex items-center">
                          <div className="w-5 h-[2px] bg-gradient-to-r from-[#7d5a50] to-[#a67c52]" />
                          <ArrowRight size={14} className="text-[#5a4038] -ml-1" strokeWidth={2.5} />
                        </div>
                      </div>
                    )
                  })()}
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
                  style={{ border: "2px solid #dc2626" }}
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

export default CustomerFlowPipeline