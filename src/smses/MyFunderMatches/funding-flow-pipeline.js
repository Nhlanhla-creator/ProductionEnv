"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import {
  Target,
  Eye,
  ListChecks,
  FilePlus,
  Send,
  Search,
  BadgeCheck,
  ScrollText,
  Banknote,
  XCircle,
  Archive,
  ArrowRight,
  Landmark,
  Sparkles,
  HelpCircle,
} from "lucide-react"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../../firebaseConfig"
import { SME_APPLICATIONS, SME_FUNDER_COLLECTION, normalizeFunderStatus } from "./funding-table"

/* ════════════════════════════════════════════════════════════════════════════
   Stage definitions.

   Same status strings funding-table.jsx writes and filters on. The previous
   version kept its own list and warned in a comment that it "MUST mirror the
   labels your FundingTable.js actually writes" — a constraint no build step
   could enforce, and one the two files had already drifted apart on (the
   pipeline showed "Contacted" for a stage the table wrote as "Application
   Sent", and had buckets for values the table never produced).

   `level` is funnel depth, not array index. Stages sharing a level are
   parallel states at the same depth and render side by side with no arrow
   between them.
   ════════════════════════════════════════════════════════════════════════ */
const STAGE_DEFINITIONS = [
  { id: "new_match", name: "New Match", level: 0, statuses: ["New Match"], icon: Target, tooltip: "Funds matched to your profile that you haven't acted on yet." },
  { id: "viewed", name: "Viewed", level: 1, statuses: ["Viewed"], icon: Eye, tooltip: "Funds you've opened but not shortlisted." },
  { id: "shortlisted", name: "Shortlisted", level: 1, statuses: ["Shortlisted"], icon: ListChecks, tooltip: "Funds you've saved as worth applying to." },
  { id: "started", name: "Application Started", level: 2, statuses: ["Application Started"], icon: FilePlus, tooltip: "You've opened an application but haven't sent it." },
  { id: "applied", name: "Applied", level: 3, statuses: ["Applied"], icon: Send, tooltip: "Application sent and with the funder." },
  { id: "review", name: "Under Review", level: 4, statuses: ["Under Review"], icon: Search, tooltip: "The funder is assessing your application." },
  { id: "accepted", name: "Accepted", level: 5, statuses: ["Accepted"], icon: BadgeCheck, tooltip: "Funding approved in principle." },
  { id: "termsheet", name: "Termsheet", level: 6, statuses: ["Termsheet"], icon: ScrollText, tooltip: "Terms issued and under negotiation." },
  { id: "funded", name: "Funded", level: 7, statuses: ["Funded"], icon: Banknote, tooltip: "Money committed and the deal is done." },
  { id: "declined", name: "Declined", level: null, statuses: ["Declined"], icon: XCircle, terminal: true, negative: true, tooltip: "The funder passed, or you withdrew." },
  { id: "closed", name: "Closed", level: null, statuses: ["Closed"], icon: Archive, terminal: true, negative: true, tooltip: "Ended without a deal." },
]

const ALL_MAPPED = new Set(STAGE_DEFINITIONS.flatMap((s) => s.statuses))

const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

const PipelineSkeleton = () => (
  <div className="flex gap-2 overflow-x-auto pb-4 px-1">
    {[...Array(9)].map((_, i) => (
      <div
        key={i}
        className="bg-gradient-to-br from-[#f5f0e1]/60 to-[#e6d7c3]/30 rounded-xl flex-shrink-0 animate-pulse"
        style={{ width: "104px", height: "84px" }}
      >
        <div className="p-2.5 flex flex-col h-full justify-between">
          <div className="h-2.5 w-16 rounded-full bg-[#c8b6a6]/40" />
          <div className="h-5 w-10 rounded bg-[#c8b6a6]/30 mx-auto" />
          <div className="h-1.5 w-full rounded-full bg-[#c8b6a6]/30" />
        </div>
      </div>
    ))}
  </div>
)

/* ════════════════════════════════════════════════════════════════════════════
   DealFlowPipeline

   Props (all optional):
     primaryMatchCount  funds currently matched to this SME, from FundingTable's
                        onPrimaryMatchCount. Needed because "New Match" means
                        "no record exists yet" — there is nothing to count.
     records            pre-fetched rows. Pass them and the component does zero
                        reads; omit and it fetches its own.
     onStageClick       called with the status name when a card is clicked, so
                        it can drive FundingTable's stageFilter. Clicking the
                        active card clears it.
     activeStage        the currently filtered status name.
   ════════════════════════════════════════════════════════════════════════ */
export default function DealFlowPipeline({
  primaryMatchCount = 0,
  records: recordsProp,
  onStageClick,
  activeStage,
}) {
  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredStage, setHoveredStage] = useState(null)

  const usingProvided = Array.isArray(recordsProp)

  useEffect(() => {
    if (usingProvided) return undefined
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
  }, [usingProvided])

  useEffect(() => {
    if (usingProvided) {
      setRecords(recordsProp)
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
        /* The old version read the entire smeApplications collection and
           filtered by smeId in JavaScript, which both leaked every other SME's
           applications to the client and got slower with every signup. */
        const [applicationsSnap, matchesSnap] = await Promise.all([
          getDocs(query(collection(db, SME_APPLICATIONS), where("smeId", "==", effectiveUserId))),
          getDocs(query(collection(db, SME_FUNDER_COLLECTION), where("smeId", "==", effectiveUserId))),
        ])

        // An application supersedes the pre-application record for the same
        // fund, so index by fund key and let the application win.
        const byKey = new Map()
        matchesSnap.forEach((d) => {
          const data = d.data()
          if (data.fundKey && data.status) byKey.set(data.fundKey, data.status)
        })
        applicationsSnap.forEach((d) => {
          const data = d.data()
          const key = data.fundKey || `${data.funderId}__${data.fundName}`
          byKey.set(key, data.pipelineStage || data.status)
        })

        if (!cancelled) setRecords([...byKey.values()].map((status) => ({ status })))
      } catch (error) {
        console.error("Error fetching pipeline data:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [usingProvided, recordsProp, authResolved, effectiveUserId])

  /* Counts are derived, not stored. The old version mirrored counts into
     `stages` state through an effect, then a second effect recomputed the same
     values from a second query. Derived state needs no effect and can't
     disagree with itself. */
  const counts = useMemo(() => {
    const result = Object.fromEntries(STAGE_DEFINITIONS.map((s) => [s.id, 0]))
    let unmapped = 0
    let statused = 0

    records.forEach((record) => {
      if (!record?.status) return
      statused += 1
      const status = normalizeFunderStatus(record.status)
      const stage = STAGE_DEFINITIONS.find((s) => s.statuses.includes(status))
      if (stage) result[stage.id] += 1
      else unmapped += 1
    })

    result.new_match = Math.max(0, (primaryMatchCount || 0) - statused)

    if (unmapped > 0) {
      console.warn(
        "[DealFlowPipeline] statuses with no card:",
        [
          ...new Set(
            records
              .filter((r) => r?.status)
              .map((r) => normalizeFunderStatus(r.status))
              .filter((s) => !ALL_MAPPED.has(s)),
          ),
        ],
      )
    }

    return { ...result, __unmapped: unmapped, __statused: statused }
  }, [records, primaryMatchCount])

  const total = useMemo(
    () => STAGE_DEFINITIONS.reduce((sum, s) => sum + (counts[s.id] || 0), 0),
    [counts],
  )

  const getPercentage = useCallback(
    (count) => (total === 0 ? 0 : ((count / total) * 100).toFixed(1)),
    [total],
  )

  const levels = useMemo(() => {
    const grouped = new Map()
    STAGE_DEFINITIONS.filter((s) => !s.terminal).forEach((s) => {
      if (!grouped.has(s.level)) grouped.set(s.level, [])
      grouped.get(s.level).push(s)
    })
    return [...grouped.entries()].sort((a, b) => a[0] - b[0]).map(([, g]) => g)
  }, [])

  const terminalStages = useMemo(() => STAGE_DEFINITIONS.filter((s) => s.terminal), [])

  const levelConversions = useMemo(() => {
    const totals = levels.map((group) => group.reduce((sum, s) => sum + (counts[s.id] || 0), 0))
    const cumulative = new Array(totals.length).fill(0)
    let running = 0
    for (let i = totals.length - 1; i >= 0; i--) {
      running += totals[i]
      cumulative[i] = running
    }
    return cumulative.map((value, i) =>
      i < cumulative.length - 1 && value > 0 ? ((cumulative[i + 1] / value) * 100).toFixed(1) : null,
    )
  }, [levels, counts])

  const renderStageCard = (stage) => {
    const isHovered = hoveredStage?.id === stage.id
    const count = counts[stage.id] || 0
    const percentage = getPercentage(count)
    const theme = stage.negative ? { from: "#4b4844", to: "#242220" } : { from: "#4a352f", to: "#241a14" }
    const Icon = stage.icon
    const isActive = activeStage && stage.statuses.includes(activeStage)
    const clickable = typeof onStageClick === "function"

    const showTip = (el) => setHoveredStage({ id: stage.id, rect: el.getBoundingClientRect() })
    const hideTip = () => setHoveredStage(null)

    return (
      <div className="relative flex-shrink-0" style={{ width: "104px" }}>
        <button
          type="button"
          disabled={!clickable}
          onClick={() => clickable && onStageClick(isActive ? null : stage.statuses[0])}
          onMouseEnter={(e) => showTip(e.currentTarget)}
          onMouseLeave={hideTip}
          onFocus={(e) => showTip(e.currentTarget)}
          onBlur={hideTip}
          aria-pressed={clickable ? !!isActive : undefined}
          aria-label={`${stage.name}: ${count} fund${count === 1 ? "" : "s"}`}
          className={`w-full text-left rounded-xl p-2.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a67c52] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f2] ${
            clickable ? "cursor-pointer hover:scale-[1.02]" : "cursor-default"
          } ${isHovered || isActive ? "shadow-xl -translate-y-1" : "shadow-md"}`}
          style={{
            background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
            border: isActive ? "1.5px solid #d9b98a" : "1.5px solid rgba(255,255,255,0.1)",
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
                <p className="text-[#e6d7c3] leading-relaxed">{stage.tooltip}</p>
                <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[#c8b6a6]">{percentage}% of all matches</span>
                  <span className="text-[#a67c52] font-semibold">
                    {count} fund{count === 1 ? "" : "s"}
                  </span>
                </div>
                {clickable && (
                  <p className="text-[10px] text-[#c8b6a6] mt-1.5">
                    {isActive ? "Click to clear this filter" : "Click to filter the table"}
                  </p>
                )}
              </div>
            </div>
          </PopupPortal>
        )}
      </div>
    )
  }

  return (
    <div className="w-full font-sans bg-gradient-to-br from-[#faf7f2] to-[#f5f0e1] rounded-3xl p-7 shadow-xl border border-[#e6d7c3]">
      <div className="flex items-center justify-between mb-7 flex-wrap gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center shadow-md">
            <Landmark size={20} className="text-[#faf7f2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#4a352f] tracking-tight">Funding Pipeline</h2>
              <Sparkles size={14} className="text-[#a67c52]" />
            </div>
            <p className="text-xs text-[#7d5a50] mt-0.5">
              {total} fund match{total === 1 ? "" : "es"}, stage by stage · {counts.__statused} application
              {counts.__statused === 1 ? "" : "s"} in progress
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {activeStage && typeof onStageClick === "function" && (
            <button
              onClick={() => onStageClick(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6] hover:bg-[#f5f0e1] transition-colors"
            >
              Filtering by {activeStage} — clear
            </button>
          )}
          <span
            className="flex items-center gap-1.5 text-[11px] text-[#a89482]"
            title="On a card: share of all your fund matches. On an arrow: share of that step which reaches the next, counting live stages only."
          >
            <HelpCircle size={12} /> Cards show share of all matches; arrows show step-to-step conversion
          </span>
        </div>
      </div>

      {counts.__unmapped > 0 && (
        <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-[#fff3e0] border border-[#e65100]/30 text-xs text-[#e65100]">
          {counts.__unmapped} application{counts.__unmapped === 1 ? " has a stage" : "s have stages"} that no card covers,
          so the percentages below won't add up to 100. Check the console for the values and add them to
          STAGE_DEFINITIONS.
        </div>
      )}

      {loading ? (
        <PipelineSkeleton />
      ) : (
        <div className="flex items-stretch overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#c8b6a6] scrollbar-track-transparent gap-1">
          {levels.map((group, idx) => (
            <div key={group[0].id} className="flex items-center">
              {/* Same level = parallel states, so no arrow between them */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {group.map((stage) => (
                  <div key={stage.id}>{renderStageCard(stage)}</div>
                ))}
              </div>

              {idx < levels.length - 1 && (
                <div className="flex flex-col items-center px-0.5 flex-shrink-0" style={{ minWidth: "34px" }}>
                  <span
                    className="text-[10px] font-bold text-[#7d5a50] mb-0.5 whitespace-nowrap"
                    title="Share of funds at this step or beyond that reach the next step"
                  >
                    {levelConversions[idx] === null ? "—" : `${levelConversions[idx]}%`}
                  </span>
                  <div className="flex items-center">
                    <div className="w-5 h-[2px] bg-gradient-to-r from-[#7d5a50] to-[#a67c52]" />
                    <ArrowRight size={14} className="text-[#5a4038] -ml-1" strokeWidth={2.5} />
                  </div>
                </div>
              )}
            </div>
          ))}

          {terminalStages.length > 0 && (
            <div className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center px-2 flex-shrink-0 self-stretch justify-center">
                <div className="w-px h-10 bg-[#e6d7c3]" />
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 p-1.5 rounded-2xl" style={{ border: "2px solid #D32F2F" }}>
                {terminalStages.map((stage) => (
                  <div key={stage.id} className="flex-shrink-0">
                    {renderStageCard(stage)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { DealFlowPipeline }